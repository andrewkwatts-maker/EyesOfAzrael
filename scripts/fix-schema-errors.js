/**
 * Fix Schema Validation Errors Script
 *
 * Purpose: Fix common schema validation errors in entity files
 *
 * Fixes:
 * 1. Convert archetype objects to strings (extract 'type' field)
 * 2. Add missing 'id' field to family members (generate from name)
 * 3. Convert family object fields to arrays
 * 4. Fix attributes field (should be object, not array)
 * 5. Fix offerings field (should be array, not object)
 * 6. Add missing 'relationship' field to relatedEntities
 * 7. Truncate domains over 100 characters
 *
 * Usage:
 *   node scripts/fix-schema-errors.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced');

class SchemaFixer {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.stats = {
      scanned: 0,
      fixed: 0,
      errors: 0,
      fixes: {
        archetypes: 0,
        familyIds: 0,
        familyArrays: 0,
        attributes: 0,
        offerings: 0,
        relationships: 0,
        domains: 0,
      }
    };
  }

  /**
   * Generate a valid ID from a name
   */
  generateId(name) {
    if (!name) return 'unknown';
    return name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) || 'unknown';
  }

  /**
   * Fix archetypes field - convert objects to strings
   */
  fixArchetypes(data) {
    if (!data.archetypes || !Array.isArray(data.archetypes)) {
      return false;
    }

    let fixed = false;
    data.archetypes = data.archetypes.map(archetype => {
      if (typeof archetype === 'object' && archetype.type) {
        fixed = true;
        this.stats.fixes.archetypes++;
        return this.generateId(archetype.type);
      }
      return archetype;
    });

    return fixed;
  }

  /**
   * Fix family members - ensure they have id field
   */
  fixFamilyMembers(members) {
    if (!members || !Array.isArray(members)) {
      return false;
    }

    let fixed = false;
    members.forEach(member => {
      if (typeof member === 'object' && member.name && !member.id) {
        member.id = this.generateId(member.name);
        fixed = true;
        this.stats.fixes.familyIds++;
      }
    });

    return fixed;
  }

  /**
   * Fix family field - convert object properties to arrays
   */
  fixFamily(data) {
    if (!data.family || typeof data.family !== 'object') {
      return false;
    }

    let fixed = false;
    const familyTypes = ['parents', 'siblings', 'consorts', 'children'];

    for (const type of familyTypes) {
      if (data.family[type] && !Array.isArray(data.family[type])) {
        // Convert object to array
        const obj = data.family[type];
        data.family[type] = Object.values(obj);
        fixed = true;
        this.stats.fixes.familyArrays++;
      }

      // Also fix IDs within arrays
      if (this.fixFamilyMembers(data.family[type])) {
        fixed = true;
      }
    }

    return fixed;
  }

  /**
   * Fix attributes field - should be object with specific structure
   */
  fixAttributes(data) {
    if (!data.attributes) {
      return false;
    }

    let fixed = false;

    // If attributes is an array, convert to object
    if (Array.isArray(data.attributes)) {
      const newAttributes = {};

      // Try to categorize array items
      data.attributes.forEach(item => {
        if (typeof item === 'string') {
          // Put generic strings in a misc array
          if (!newAttributes.other) {
            newAttributes.other = [];
          }
          newAttributes.other.push(item);
        }
      });

      data.attributes = newAttributes;
      fixed = true;
      this.stats.fixes.attributes++;
    }

    return fixed;
  }

  /**
   * Fix worship.offerings - should be array
   */
  fixOfferings(data) {
    if (!data.worship || !data.worship.offerings) {
      return false;
    }

    let fixed = false;

    // If offerings is an object, convert to array
    if (typeof data.worship.offerings === 'object' && !Array.isArray(data.worship.offerings)) {
      data.worship.offerings = Object.values(data.worship.offerings);
      fixed = true;
      this.stats.fixes.offerings++;
    }

    return fixed;
  }

  /**
   * Fix relatedEntities - add missing relationship field
   */
  fixRelatedEntities(data) {
    if (!data.relatedEntities || !Array.isArray(data.relatedEntities)) {
      return false;
    }

    let fixed = false;
    data.relatedEntities = data.relatedEntities.map(entity => {
      if (typeof entity === 'object') {
        // Add missing id
        if (entity.name && !entity.id) {
          entity.id = this.generateId(entity.name);
          fixed = true;
        }

        // Add missing relationship
        if (!entity.relationship) {
          entity.relationship = entity.role || entity.relation || 'related';
          fixed = true;
          this.stats.fixes.relationships++;
        }
      }
      return entity;
    });

    return fixed;
  }

  /**
   * Fix domains - truncate if over 100 characters
   */
  fixDomains(data) {
    if (!data.domains || !Array.isArray(data.domains)) {
      return false;
    }

    let fixed = false;
    data.domains = data.domains.map(domain => {
      if (typeof domain === 'string' && domain.length > 100) {
        fixed = true;
        this.stats.fixes.domains++;
        return domain.substring(0, 97) + '...';
      }
      return domain;
    });

    return fixed;
  }

  /**
   * Fix a single entity file
   */
  fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      let hasChanges = false;

      // Apply all fixes
      if (this.fixArchetypes(data)) hasChanges = true;
      if (this.fixFamily(data)) hasChanges = true;
      if (this.fixAttributes(data)) hasChanges = true;
      if (this.fixOfferings(data)) hasChanges = true;
      if (this.fixRelatedEntities(data)) hasChanges = true;
      if (this.fixDomains(data)) hasChanges = true;

      if (hasChanges) {
        if (!this.dryRun) {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
          console.log(`✓ Fixed: ${path.relative(SOURCE_DIR, filePath)}`);
        } else {
          console.log(`[DRY RUN] Would fix: ${path.relative(SOURCE_DIR, filePath)}`);
        }
        this.stats.fixed++;
      }

      return true;
    } catch (error) {
      console.error(`✗ Error processing ${path.relative(SOURCE_DIR, filePath)}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Recursively scan and fix files
   */
  scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Skip mythology files and page files
        if (fullPath.includes('mythologies') || fullPath.includes('pages')) {
          continue;
        }

        this.stats.scanned++;
        this.fixFile(fullPath);
      }
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('SCHEMA FIX REPORT');
    console.log('='.repeat(70));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN (no changes made)' : 'LIVE'}`);
    console.log(`\nFiles scanned: ${this.stats.scanned}`);
    console.log(`Files fixed: ${this.stats.fixed}`);
    console.log(`Errors: ${this.stats.errors}`);

    console.log('\n' + '-'.repeat(70));
    console.log('FIXES APPLIED:');
    console.log('-'.repeat(70));
    console.log(`Archetypes converted: ${this.stats.fixes.archetypes}`);
    console.log(`Family IDs added: ${this.stats.fixes.familyIds}`);
    console.log(`Family arrays fixed: ${this.stats.fixes.familyArrays}`);
    console.log(`Attributes fixed: ${this.stats.fixes.attributes}`);
    console.log(`Offerings fixed: ${this.stats.fixes.offerings}`);
    console.log(`Relationships added: ${this.stats.fixes.relationships}`);
    console.log(`Domains truncated: ${this.stats.fixes.domains}`);

    console.log('\n' + '='.repeat(70));

    if (this.dryRun) {
      console.log('\n💡 Run without --dry-run to apply these fixes');
    } else {
      console.log('\n✓ All fixes applied');
    }
  }

  /**
   * Run the fixer
   */
  run() {
    console.log('\nStarting schema error fixes...');
    console.log(`Source: ${SOURCE_DIR}\n`);

    this.scanDirectory(SOURCE_DIR);
    this.generateReport();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run fixer
const fixer = new SchemaFixer(dryRun);
fixer.run();

// Exit with error code if there were errors
process.exit(fixer.stats.errors > 0 ? 1 : 0);
