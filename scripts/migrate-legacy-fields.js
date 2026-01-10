/**
 * Legacy Field Migrator
 *
 * Migrates legacy field names to the standardized connection schema.
 * Also fixes corpus search issues and ensures proper entity reference format.
 *
 * Legacy fields:
 * - relatedConcepts -> relatedEntities.concepts
 * - inhabitants -> relatedEntities.deities/heroes
 * - wielders -> relatedEntities.heroes
 * - relatedItems -> relatedEntities.items
 * - guardians -> relatedEntities.creatures
 * - relatedDeities -> relatedEntities.deities
 * - relatedArchetypes -> relatedEntities.archetypes
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class LegacyMigrator {
  constructor(options = {}) {
    this.assetsPath = options.assetsPath || this.findAssetsPath();
    this.dryRun = options.dryRun || false;

    this.allAssets = new Map();
    this.assetFiles = new Map();
    this.results = {
      migrated: [],
      skipped: [],
      errors: []
    };

    // Legacy field mappings
    this.fieldMappings = {
      'relatedConcepts': { target: 'relatedEntities.concepts', entityType: 'concept' },
      'relatedDeities': { target: 'relatedEntities.deities', entityType: 'deity' },
      'relatedHeroes': { target: 'relatedEntities.heroes', entityType: 'hero' },
      'relatedCreatures': { target: 'relatedEntities.creatures', entityType: 'creature' },
      'relatedItems': { target: 'relatedEntities.items', entityType: 'item' },
      'relatedPlaces': { target: 'relatedEntities.places', entityType: 'place' },
      'relatedArchetypes': { target: 'relatedEntities.archetypes', entityType: 'archetype' },
      'wielders': { target: 'relatedEntities.heroes', entityType: 'hero' },
      'inhabitants': { target: 'relatedEntities.deities', entityType: 'deity' },
      'guardians': { target: 'relatedEntities.creatures', entityType: 'creature' },
      'related_deities': { target: 'relatedEntities.deities', entityType: 'deity' },
      'related_heroes': { target: 'relatedEntities.heroes', entityType: 'hero' },
      'related_creatures': { target: 'relatedEntities.creatures', entityType: 'creature' },
      'related_items': { target: 'relatedEntities.items', entityType: 'item' },
      'related_places': { target: 'relatedEntities.places', entityType: 'place' }
    };
  }

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

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'angels',
      'beings', 'figures', 'mythologies'
    ];

    for (const category of categories) {
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
    if (this.allAssets.has(id)) {
      return this.allAssets.get(id);
    }

    const normalized = this.normalizeId(id);
    if (this.allAssets.has(normalized)) {
      return this.allAssets.get(normalized);
    }

    const prefixes = ['greek_deity_', 'norse_', 'celtic_', 'roman_', 'hindu_', 'chinese_', 'japanese_', 'egyptian_'];
    for (const prefix of prefixes) {
      if (this.allAssets.has(prefix + normalized)) {
        return this.allAssets.get(prefix + normalized);
      }
    }

    return null;
  }

  convertToEntityReference(value, entityType) {
    if (typeof value === 'string') {
      const targetAsset = this.findAssetById(value);
      const ref = {
        id: targetAsset ? targetAsset.id : this.normalizeId(value),
        name: targetAsset ? targetAsset.name : this.generateNameFromId(value),
        relationship: 'related'
      };

      if (!targetAsset) {
        ref._unverified = true;
        ref._unverifiedReason = 'Entity not found in database';
      }

      return ref;
    }

    if (typeof value === 'object' && value !== null) {
      const ref = { ...value };

      if (!ref.id && ref.name) {
        ref.id = this.normalizeId(ref.name);
      }
      if (!ref.name && ref.id) {
        const targetAsset = this.findAssetById(ref.id);
        ref.name = targetAsset ? targetAsset.name : this.generateNameFromId(ref.id);
      }
      if (!ref.relationship) {
        ref.relationship = 'related';
      }

      if (ref.id && !ref._unverified) {
        const targetAsset = this.findAssetById(ref.id);
        if (!targetAsset) {
          ref._unverified = true;
          ref._unverifiedReason = 'Entity not found in database';
        }
      }

      return ref;
    }

    return null;
  }

  migrateAsset(asset) {
    const migrations = [];
    const newAsset = JSON.parse(JSON.stringify(asset));

    // Ensure relatedEntities exists
    if (!newAsset.relatedEntities) {
      newAsset.relatedEntities = {};
    }

    // Migrate each legacy field
    for (const [legacyField, config] of Object.entries(this.fieldMappings)) {
      if (asset[legacyField]) {
        const values = Array.isArray(asset[legacyField]) ? asset[legacyField] : [asset[legacyField]];
        const targetCategory = config.target.split('.')[1]; // e.g., 'concepts' from 'relatedEntities.concepts'

        // Initialize target array if needed
        if (!newAsset.relatedEntities[targetCategory]) {
          newAsset.relatedEntities[targetCategory] = [];
        }

        // Convert and add each value
        for (const value of values) {
          const ref = this.convertToEntityReference(value, config.entityType);
          if (ref) {
            // Check for duplicates
            const exists = newAsset.relatedEntities[targetCategory].some(
              existing => existing.id === ref.id
            );
            if (!exists) {
              newAsset.relatedEntities[targetCategory].push(ref);
            }
          }
        }

        // Remove legacy field
        delete newAsset[legacyField];

        migrations.push({
          field: legacyField,
          target: config.target,
          count: values.length
        });
      }
    }

    // Fix corpus search issues
    if (newAsset.corpusSearch) {
      const corpus = newAsset.corpusSearch;
      for (const [key, value] of Object.entries(corpus)) {
        if (value !== null && !Array.isArray(value)) {
          corpus[key] = [String(value)];
          migrations.push({
            field: `corpusSearch.${key}`,
            type: 'convert_to_array'
          });
        }
        if (Array.isArray(value)) {
          corpus[key] = value.filter(v => v !== null && v !== undefined && v !== '').map(String);
        }
      }
    }

    // Clean up empty relatedEntities
    if (newAsset.relatedEntities) {
      for (const [key, value] of Object.entries(newAsset.relatedEntities)) {
        if (Array.isArray(value) && value.length === 0) {
          delete newAsset.relatedEntities[key];
        }
      }
      if (Object.keys(newAsset.relatedEntities).length === 0) {
        delete newAsset.relatedEntities;
      }
    }

    return { asset: newAsset, migrations };
  }

  async migrateAll() {
    console.log('\nMigrating legacy fields...');

    for (const [id, asset] of this.allAssets) {
      const { asset: migratedAsset, migrations } = this.migrateAsset(asset);

      if (migrations.length > 0) {
        delete migratedAsset._category;

        this.results.migrated.push({
          id,
          name: asset.name,
          migrations
        });

        if (!this.dryRun) {
          try {
            const filePath = this.assetFiles.get(id);
            await fs.writeFile(filePath, JSON.stringify(migratedAsset, null, 2));
          } catch (error) {
            this.results.errors.push({
              id,
              error: error.message
            });
          }
        }
      } else {
        this.results.skipped.push({ id, name: asset.name });
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('LEGACY FIELD MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY'}`);
    console.log(`Total assets: ${this.allAssets.size}`);
    console.log(`Migrated: ${this.results.migrated.length}`);
    console.log(`Skipped: ${this.results.skipped.length}`);
    console.log(`Errors: ${this.results.errors.length}`);
    console.log('='.repeat(60));

    if (this.results.migrated.length > 0) {
      console.log('\nMIGRATED ASSETS (showing first 20):');
      for (const item of this.results.migrated.slice(0, 20)) {
        console.log(`  ${item.id}:`);
        for (const migration of item.migrations.slice(0, 3)) {
          if (migration.target) {
            console.log(`    - ${migration.field} -> ${migration.target} (${migration.count} items)`);
          } else {
            console.log(`    - ${migration.field}: ${migration.type}`);
          }
        }
      }
    }

    // Count migrations by field
    const fieldCounts = {};
    for (const item of this.results.migrated) {
      for (const migration of item.migrations) {
        const key = migration.field;
        fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      }
    }

    if (Object.keys(fieldCounts).length > 0) {
      console.log('\nMIGRATIONS BY FIELD:');
      for (const [field, count] of Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${field}: ${count} assets`);
      }
    }
  }

  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'apply',
      summary: {
        total: this.allAssets.size,
        migrated: this.results.migrated.length,
        skipped: this.results.skipped.length,
        errors: this.results.errors.length
      },
      migrated: this.results.migrated,
      errors: this.results.errors
    };

    await fs.writeFile(
      path.join(reportDir, 'legacy-migration-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nReport saved to scripts/reports/legacy-migration-report.json');
  }

  async run() {
    console.log('Legacy Field Migrator');
    console.log('=====================');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY'}`);
    console.log('');

    await this.loadAllAssets();
    await this.migrateAll();
    await this.generateReport();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: true
  };

  for (const arg of args) {
    if (arg === '--apply') {
      options.dryRun = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const migrator = new LegacyMigrator(options);

  try {
    await migrator.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { LegacyMigrator };
