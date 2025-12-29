/**
 * Fix Remaining Family Member Issues
 *
 * Some family members don't have required 'name' field (only have 'description' or 'note')
 * This script removes those invalid entries.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced');

class FamilyFixer {
  constructor() {
    this.stats = {
      scanned: 0,
      fixed: 0,
      removed: 0,
    };
  }

  /**
   * Clean family arrays by removing invalid entries
   */
  cleanFamilyMembers(members) {
    if (!members || !Array.isArray(members)) {
      return false;
    }

    const initialLength = members.length;
    const cleaned = members.filter(member => {
      // Keep only members with both id and name
      return member && typeof member === 'object' && member.id && member.name;
    });

    const removed = initialLength - cleaned.length;
    if (removed > 0) {
      this.stats.removed += removed;
      // Modify array in place
      members.length = 0;
      members.push(...cleaned);
      return true;
    }

    return false;
  }

  /**
   * Fix family field
   */
  fixFamily(data) {
    if (!data.family || typeof data.family !== 'object') {
      return false;
    }

    let fixed = false;
    const familyTypes = ['parents', 'siblings', 'consorts', 'children'];

    for (const type of familyTypes) {
      if (this.cleanFamilyMembers(data.family[type])) {
        fixed = true;
      }
    }

    return fixed;
  }

  /**
   * Fix offerings field - handle string/object structures
   */
  fixOfferings(data) {
    if (!data.worship || !data.worship.offerings) {
      return false;
    }

    let fixed = false;
    const offerings = data.worship.offerings;

    // If it's already an array, check if items need fixing
    if (Array.isArray(offerings)) {
      // Filter out non-string items
      const cleaned = offerings.filter(item => typeof item === 'string');
      if (cleaned.length !== offerings.length) {
        data.worship.offerings = cleaned;
        fixed = true;
      }
    } else if (typeof offerings === 'object') {
      // Convert object to array
      data.worship.offerings = Object.values(offerings).filter(item => typeof item === 'string');
      fixed = true;
    }

    return fixed;
  }

  /**
   * Fix prayers field
   */
  fixPrayers(data) {
    if (!data.worship || !data.worship.prayers) {
      return false;
    }

    let fixed = false;
    const prayers = data.worship.prayers;

    if (Array.isArray(prayers)) {
      const cleaned = prayers.filter(prayer => {
        return prayer && typeof prayer === 'object' && prayer.text;
      });

      if (cleaned.length !== prayers.length) {
        data.worship.prayers = cleaned;
        fixed = true;
      }
    }

    return fixed;
  }

  /**
   * Fix a single file
   */
  fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      let hasChanges = false;

      if (this.fixFamily(data)) hasChanges = true;
      if (this.fixOfferings(data)) hasChanges = true;
      if (this.fixPrayers(data)) hasChanges = true;

      if (hasChanges) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✓ Fixed: ${path.relative(SOURCE_DIR, filePath)}`);
        this.stats.fixed++;
      }

      return true;
    } catch (error) {
      console.error(`✗ Error: ${path.relative(SOURCE_DIR, filePath)}: ${error.message}`);
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
        // Skip non-entity directories
        if (fullPath.includes('mythologies') || fullPath.includes('pages')) {
          continue;
        }

        this.stats.scanned++;
        this.fixFile(fullPath);
      }
    }
  }

  /**
   * Run the fixer
   */
  run() {
    console.log('\nFixing remaining family member issues...\n');
    this.scanDirectory(SOURCE_DIR);
    console.log(`\n✓ Scanned ${this.stats.scanned} files`);
    console.log(`✓ Fixed ${this.stats.fixed} files`);
    console.log(`✓ Removed ${this.stats.removed} invalid family members`);
  }
}

const fixer = new FamilyFixer();
fixer.run();
