/**
 * Schema Auto-Fixer
 *
 * Automatically fixes common schema compliance issues:
 * - Adds missing 'name' fields to entity references
 * - Marks broken links as _unverified
 * - Converts string references to proper entityReference objects
 * - Fixes malformed IDs
 *
 * Usage:
 *   node fix-schema-issues.js [options]
 *
 * Options:
 *   --dry-run        Show fixes without applying
 *   --category=X     Only fix specific category
 *   --id=X           Only fix specific asset
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class SchemaFixer {
  findAssetsPath() {
    // Prefer firebase-assets-downloaded in project root
    const projectDir = path.join(__dirname, '..');
    const mainAssetsPath = path.join(projectDir, 'firebase-assets-downloaded');

    if (fsSync.existsSync(path.join(mainAssetsPath, 'deities'))) {
      return mainAssetsPath;
    }

    // Fallback to backups directory
    const backupsDir = path.join(projectDir, 'backups');

    try {
      const dirs = fsSync.readdirSync(backupsDir);
      const assetDirs = dirs
        .filter(d => d.startsWith('firebase-assets'))
        .sort()
        .reverse();

      for (const dir of assetDirs) {
        const fullPath = path.join(backupsDir, dir);
        const deitiesPath = path.join(fullPath, 'deities');
        if (fsSync.existsSync(deitiesPath)) {
          return fullPath;
        }
      }
    } catch (e) {
      // Fallback
    }

    return path.join(backupsDir, 'firebase-assets-pre-enrichment');
  }

  constructor(options = {}) {
    this.assetsPath = options.assetsPath || this.findAssetsPath();
    this.dryRun = options.dryRun || false;
    this.targetCategory = options.category || null;
    this.targetId = options.id || null;

    this.allAssets = new Map();
    this.assetFiles = new Map(); // id -> filePath
    this.fixResults = {
      fixed: [],
      skipped: [],
      errors: []
    };

    // Valid relationship types
    this.validRelationshipTypes = [
      'parent', 'father', 'mother', 'child', 'son', 'daughter',
      'sibling', 'brother', 'sister', 'spouse', 'consort', 'lover',
      'offspring', 'ancestor', 'descendant', 'ally', 'enemy', 'rival',
      'companion', 'friend', 'servant', 'master', 'worshipper', 'devotee',
      'mentor', 'student', 'teacher', 'creator', 'creation', 'created_by',
      'slayer', 'victim', 'slain_by', 'aspect', 'avatar', 'incarnation',
      'syncretism', 'equivalent', 'parallel', 'derived', 'influenced',
      'contrasts', 'similar', 'related', 'historical', 'thematic', 'symbolic',
      'wielder', 'wielded_by', 'ruler', 'ruled_by', 'guardian', 'guarded_by',
      'associated', 'linked', 'connected', 'origin', 'destination',
      'contains', 'contained_in', 'member', 'group', 'other'
    ];
  }

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'angels',
      'beings', 'figures', 'mythologies'
    ];

    for (const category of categories) {
      if (this.targetCategory && category !== this.targetCategory) continue;

      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    console.log(`Loaded ${this.allAssets.size} assets`);
  }

  async loadCategory(category, categoryPath) {
    try {
      const stats = await fs.stat(categoryPath);
      if (!stats.isDirectory()) return;
    } catch {
      return;
    }

    const entries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
        await this.loadSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(entryPath, category);
      }
    }
  }

  async loadSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.loadAssetFile(path.join(dirPath, file), category);
      }
    }
  }

  async loadAssetFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        if (this.targetId && asset.id !== this.targetId) return;

        asset._category = category;
        this.allAssets.set(asset.id, asset);
        this.assetFiles.set(asset.id, filePath);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message);
    }
  }

  normalizeId(str) {
    if (!str) return null;
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  generateNameFromId(id) {
    if (!id) return null;
    return id
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/^(Greek|Norse|Celtic|Roman|Hindu|Chinese|Japanese|Egyptian|Sumerian|Buddhist|Christian|Islamic|Jewish)\s/i, '')
      .trim();
  }

  findAssetById(id) {
    // Direct match
    if (this.allAssets.has(id)) {
      return this.allAssets.get(id);
    }

    // Try normalized id
    const normalized = this.normalizeId(id);
    if (this.allAssets.has(normalized)) {
      return this.allAssets.get(normalized);
    }

    // Try with common prefixes
    const prefixes = ['greek_deity_', 'norse_', 'celtic_', 'roman_', 'hindu_', 'chinese_', 'japanese_', 'egyptian_'];
    for (const prefix of prefixes) {
      if (this.allAssets.has(prefix + normalized)) {
        return this.allAssets.get(prefix + normalized);
      }
    }

    // Try without prefix
    for (const prefix of prefixes) {
      if (id.startsWith(prefix)) {
        const withoutPrefix = id.substring(prefix.length);
        if (this.allAssets.has(withoutPrefix)) {
          return this.allAssets.get(withoutPrefix);
        }
      }
    }

    return null;
  }

  fixEntityReference(ref, fieldPath) {
    const fixes = [];

    if (typeof ref === 'string') {
      // Convert string to object
      const targetAsset = this.findAssetById(ref);
      const newRef = {
        id: targetAsset ? targetAsset.id : this.normalizeId(ref),
        name: targetAsset ? targetAsset.name : this.generateNameFromId(ref)
      };

      if (!targetAsset) {
        newRef._unverified = true;
        newRef._unverifiedReason = 'Entity not found in database';
      }

      fixes.push({
        field: fieldPath,
        type: 'string_to_object',
        oldValue: ref,
        newValue: newRef
      });

      return { ref: newRef, fixes };
    }

    if (typeof ref !== 'object' || ref === null) {
      return { ref, fixes };
    }

    const newRef = { ...ref };

    // Fix missing id
    if (!newRef.id && newRef.name) {
      newRef.id = this.normalizeId(newRef.name);
      fixes.push({
        field: `${fieldPath}.id`,
        type: 'add_missing_id',
        newValue: newRef.id
      });
    }

    // Fix missing name
    if (!newRef.name && newRef.id) {
      const targetAsset = this.findAssetById(newRef.id);
      newRef.name = targetAsset ? targetAsset.name : this.generateNameFromId(newRef.id);
      fixes.push({
        field: `${fieldPath}.name`,
        type: 'add_missing_name',
        newValue: newRef.name
      });
    }

    // Check if target exists and fix ID if needed
    if (newRef.id && !newRef._unverified) {
      // First try EXACT match only (not the fuzzy findAssetById)
      let targetAsset = this.allAssets.get(newRef.id);
      let idWasFixed = false;

      // If no exact match, check if there's a prefixed ID we can fix
      if (!targetAsset) {
        const prefixes = ['greek_', 'greek_deity_', 'norse_', 'celtic_', 'roman_', 'hindu_', 'chinese_', 'japanese_', 'egyptian_', 'sumerian_', 'mayan_', 'aztec_'];
        for (const prefix of prefixes) {
          if (newRef.id.startsWith(prefix)) {
            const strippedId = newRef.id.substring(prefix.length);
            // Try exact match with stripped ID
            if (this.allAssets.has(strippedId)) {
              targetAsset = this.allAssets.get(strippedId);
              // Fix the ID to match the actual entity
              const oldId = newRef.id;
              newRef.id = targetAsset.id;
              newRef.name = targetAsset.name;
              fixes.push({
                field: `${fieldPath}.id`,
                type: 'fix_prefixed_id',
                oldValue: oldId,
                newValue: targetAsset.id
              });
              idWasFixed = true;
              break;
            }
          }
        }
      }

      // If still not found, try adding common prefixes
      if (!targetAsset && !idWasFixed) {
        const prefixesToTry = ['japanese_', 'chinese_', 'hindu_', 'egyptian_', 'greek_', 'norse_', 'celtic_'];
        for (const prefix of prefixesToTry) {
          const prefixedId = prefix + newRef.id;
          if (this.allAssets.has(prefixedId)) {
            targetAsset = this.allAssets.get(prefixedId);
            const oldId = newRef.id;
            newRef.id = targetAsset.id;
            newRef.name = targetAsset.name;
            fixes.push({
              field: `${fieldPath}.id`,
              type: 'fix_missing_prefix',
              oldValue: oldId,
              newValue: targetAsset.id
            });
            idWasFixed = true;
            break;
          }
        }
      }

      // If still not found, try fuzzy lookup
      if (!targetAsset && !idWasFixed) {
        targetAsset = this.findAssetById(newRef.id);
      }

      if (!targetAsset) {
        newRef._unverified = true;
        newRef._unverifiedReason = 'Entity not found in database';
        fixes.push({
          field: `${fieldPath}._unverified`,
          type: 'mark_unverified',
          reason: `Entity '${newRef.id}' not found`
        });
      }
    }

    // Normalize relationship to valid type
    if (newRef.relationship && !this.validRelationshipTypes.includes(newRef.relationship)) {
      const normalized = this.normalizeRelationship(newRef.relationship);
      if (normalized !== newRef.relationship) {
        fixes.push({
          field: `${fieldPath}.relationship`,
          type: 'normalize_relationship',
          oldValue: newRef.relationship,
          newValue: normalized
        });
        newRef.relationship = normalized;
      }
    }

    return { ref: newRef, fixes };
  }

  normalizeRelationship(rel) {
    if (!rel) return 'related';

    const relLower = rel.toLowerCase();

    // Map common variations
    const mappings = {
      'parents': 'parent',
      'fathers': 'father',
      'mothers': 'mother',
      'children': 'child',
      'sons': 'son',
      'daughters': 'daughter',
      'siblings': 'sibling',
      'brothers': 'brother',
      'sisters': 'sister',
      'spouses': 'spouse',
      'consorts': 'consort',
      'lovers': 'lover',
      'wife': 'spouse',
      'husband': 'spouse',
      'half-brother': 'sibling',
      'half-sister': 'sibling',
      'step-brother': 'sibling',
      'step-sister': 'sibling',
      'patron': 'guardian',
      'protector': 'guardian',
      'creator_of': 'creator',
      'made_by': 'created_by',
      'killer': 'slayer',
      'killed_by': 'slain_by'
    };

    if (mappings[relLower]) {
      return mappings[relLower];
    }

    if (this.validRelationshipTypes.includes(relLower)) {
      return relLower;
    }

    return 'related';
  }

  fixEntityReferences(refs, fieldPath) {
    if (!Array.isArray(refs)) return { refs, fixes: [] };

    const allFixes = [];
    const newRefs = [];

    for (let i = 0; i < refs.length; i++) {
      const { ref, fixes } = this.fixEntityReference(refs[i], `${fieldPath}[${i}]`);
      newRefs.push(ref);
      allFixes.push(...fixes);
    }

    return { refs: newRefs, fixes: allFixes };
  }

  fixAsset(asset) {
    const allFixes = [];
    const newAsset = JSON.parse(JSON.stringify(asset)); // Deep clone

    // Fix family
    if (newAsset.family) {
      const familyFields = ['parents', 'children', 'siblings', 'consorts', 'ancestors', 'descendants'];

      for (const field of familyFields) {
        if (newAsset.family[field]) {
          if (typeof newAsset.family[field] === 'string') {
            // Convert string to array of entity references
            const value = newAsset.family[field];
            const names = value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
            const refs = [];

            for (const name of names) {
              const targetAsset = this.findAssetById(name);
              const ref = {
                id: targetAsset ? targetAsset.id : this.normalizeId(name),
                name: targetAsset ? targetAsset.name : name,
                relationship: field.replace(/s$/, '') // parents -> parent
              };

              if (!targetAsset) {
                ref._unverified = true;
                ref._unverifiedReason = 'Entity not found in database';
              }

              refs.push(ref);
            }

            allFixes.push({
              field: `family.${field}`,
              type: 'string_to_array',
              oldValue: value,
              newValue: refs
            });

            newAsset.family[field] = refs;
          } else if (Array.isArray(newAsset.family[field])) {
            const { refs, fixes } = this.fixEntityReferences(newAsset.family[field], `family.${field}`);
            newAsset.family[field] = refs;
            allFixes.push(...fixes);
          }
        }
      }
    }

    // Fix relatedEntities - handles both array and object formats
    if (newAsset.relatedEntities) {
      if (Array.isArray(newAsset.relatedEntities)) {
        // Array format: [{ type, name, id, relationship }]
        const { refs, fixes } = this.fixEntityReferences(newAsset.relatedEntities, 'relatedEntities');
        newAsset.relatedEntities = refs;
        allFixes.push(...fixes);
      } else {
        // Object format: { deities: [], heroes: [], ... }
        // Category name normalization map
        const categoryNormalization = {
          'deitys': 'deities',
          'heros': 'heroes',
          'cosmologys': 'cosmology',
          'artifacts': 'items',
          'relatedSymbols': 'symbols',
          'related_deities': 'deities',
          'related_heroes': 'heroes',
          'related_creatures': 'creatures',
          'related_items': 'items',
          'related_places': 'places'
        };

        const newRelatedEntities = {};
        for (const [category, entities] of Object.entries(newAsset.relatedEntities)) {
          const normalizedCategory = categoryNormalization[category] || category;

          if (normalizedCategory !== category) {
            allFixes.push({
              field: `relatedEntities.${category}`,
              type: 'normalize_category',
              oldValue: category,
              newValue: normalizedCategory
            });
          }

          if (Array.isArray(entities)) {
            const { refs, fixes } = this.fixEntityReferences(entities, `relatedEntities.${normalizedCategory}`);
            // Merge with existing array if category was renamed
            if (newRelatedEntities[normalizedCategory]) {
              newRelatedEntities[normalizedCategory].push(...refs);
            } else {
              newRelatedEntities[normalizedCategory] = refs;
            }
            allFixes.push(...fixes);
          } else {
            // Preserve non-array values
            newRelatedEntities[normalizedCategory] = entities;
          }
        }
        newAsset.relatedEntities = newRelatedEntities;
      }
    }

    // Fix allies
    if (newAsset.allies) {
      const { refs, fixes } = this.fixEntityReferences(newAsset.allies, 'allies');
      newAsset.allies = refs;
      allFixes.push(...fixes);
    }

    // Fix enemies
    if (newAsset.enemies) {
      const { refs, fixes } = this.fixEntityReferences(newAsset.enemies, 'enemies');
      newAsset.enemies = refs;
      allFixes.push(...fixes);
    }

    // Fix companions - convert string references to entity references
    if (newAsset.companions && Array.isArray(newAsset.companions)) {
      const { refs, fixes } = this.fixEntityReferences(newAsset.companions, 'companions');
      newAsset.companions = refs;
      allFixes.push(...fixes);
    }

    return { asset: newAsset, fixes: allFixes };
  }

  async fixAllAssets() {
    console.log('\nFixing schema issues...');

    for (const [id, asset] of this.allAssets) {
      const { asset: fixedAsset, fixes } = this.fixAsset(asset);

      if (fixes.length > 0) {
        // Remove internal fields before saving
        delete fixedAsset._category;

        this.fixResults.fixed.push({
          id,
          name: asset.name,
          fixCount: fixes.length,
          fixes: fixes.slice(0, 10) // Limit stored fixes
        });

        if (!this.dryRun) {
          try {
            const filePath = this.assetFiles.get(id);
            await fs.writeFile(filePath, JSON.stringify(fixedAsset, null, 2));
          } catch (error) {
            this.fixResults.errors.push({
              id,
              error: error.message
            });
          }
        }
      } else {
        this.fixResults.skipped.push({ id, name: asset.name });
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('SCHEMA FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY'}`);
    console.log(`Total assets: ${this.allAssets.size}`);
    console.log(`Fixed: ${this.fixResults.fixed.length}`);
    console.log(`Skipped (no issues): ${this.fixResults.skipped.length}`);
    console.log(`Errors: ${this.fixResults.errors.length}`);
    console.log('='.repeat(60));

    if (this.fixResults.fixed.length > 0) {
      console.log('\nFIXED ASSETS (showing first 20):');
      for (const item of this.fixResults.fixed.slice(0, 20)) {
        console.log(`  ${item.id}: ${item.fixCount} fixes`);
        for (const fix of item.fixes.slice(0, 3)) {
          console.log(`    - ${fix.type} at ${fix.field}`);
        }
      }
    }

    if (this.fixResults.errors.length > 0) {
      console.log('\nERRORS:');
      for (const item of this.fixResults.errors) {
        console.log(`  ${item.id}: ${item.error}`);
      }
    }

    // Count total fixes by type
    const fixCounts = {};
    for (const item of this.fixResults.fixed) {
      for (const fix of item.fixes) {
        fixCounts[fix.type] = (fixCounts[fix.type] || 0) + 1;
      }
    }

    if (Object.keys(fixCounts).length > 0) {
      console.log('\nFIXES BY TYPE:');
      for (const [type, count] of Object.entries(fixCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count}`);
      }
    }
  }

  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'apply',
      options: {
        category: this.targetCategory,
        id: this.targetId
      },
      summary: {
        total: this.allAssets.size,
        fixed: this.fixResults.fixed.length,
        skipped: this.fixResults.skipped.length,
        errors: this.fixResults.errors.length
      },
      fixed: this.fixResults.fixed,
      errors: this.fixResults.errors
    };

    await fs.writeFile(
      path.join(reportDir, 'schema-fix-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nReport saved to scripts/reports/schema-fix-report.json');
  }

  async run() {
    console.log('Schema Auto-Fixer');
    console.log('=================');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY'}`);
    if (this.targetCategory) console.log(`Category: ${this.targetCategory}`);
    if (this.targetId) console.log(`Asset ID: ${this.targetId}`);
    console.log('');

    await this.loadAllAssets();
    await this.fixAllAssets();
    await this.generateReport();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: true, // Default to dry-run for safety
    category: null,
    id: null
  };

  for (const arg of args) {
    if (arg === '--apply') {
      options.dryRun = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--id=')) {
      options.id = arg.split('=')[1];
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const fixer = new SchemaFixer(options);

  try {
    await fixer.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SchemaFixer };
