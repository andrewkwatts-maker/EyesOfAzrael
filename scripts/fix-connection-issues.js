/**
 * Fix Connection Issues Script
 *
 * Systematically fixes all connection-related issues identified by validate-connections.js
 * Can be run with specific fix types or fix all issues at once.
 *
 * Usage:
 *   node fix-connection-issues.js --fix-type=legacy-fields
 *   node fix-connection-issues.js --fix-type=format-issues
 *   node fix-connection-issues.js --fix-type=broken-links
 *   node fix-connection-issues.js --fix-type=corpus-search
 *   node fix-connection-issues.js --fix-type=all
 *   node fix-connection-issues.js --legacy-field=wielders
 */

const fs = require('fs').promises;
const path = require('path');

class ConnectionFixer {
  constructor(options = {}) {
    this.assetsPath = options.assetsPath || path.join(__dirname, '..', 'backups', 'firebase-assets-backup-20260101');
    this.outputPath = options.outputPath || path.join(__dirname, '..', 'firebase-assets-downloaded');
    this.dryRun = options.dryRun || false;
    this.fixType = options.fixType || 'all';
    this.specificField = options.specificField || null;

    this.allAssets = new Map();
    this.fixedAssets = new Map();
    this.stats = {
      totalAssets: 0,
      assetsFixed: 0,
      legacyFieldsMigrated: 0,
      formatIssuesFixed: 0,
      brokenLinksFixed: 0,
      corpusSearchFixed: 0,
      errors: []
    };

    // Legacy field mappings
    this.legacyFieldMappings = {
      'wielders': { target: 'relatedEntities', category: 'heroes', relationshipType: 'wielder' },
      'inhabitants': { target: 'relatedEntities', category: 'deities', relationshipType: 'inhabitant' },
      'guardians': { target: 'relatedEntities', category: 'creatures', relationshipType: 'guardian' },
      'relatedItems': { target: 'relatedEntities', category: 'items', relationshipType: 'related' },
      'relatedDeities': { target: 'relatedEntities', category: 'deities', relationshipType: 'related' },
      'relatedConcepts': { target: 'relatedEntities', category: 'concepts', relationshipType: 'related' }
    };
  }

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'angels',
      'beings', 'figures', 'path', 'teachings'
    ];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    this.stats.totalAssets = this.allAssets.size;
    console.log(`Loaded ${this.stats.totalAssets} assets`);
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
        asset._filePath = filePath;
        asset._modified = false;
        this.allAssets.set(asset.id, asset);
      }
    } catch (error) {
      this.stats.errors.push({ type: 'LOAD_ERROR', file: filePath, error: error.message });
    }
  }

  async fixAllIssues() {
    console.log('\nFixing connection issues...');
    console.log('Fix type:', this.fixType);
    console.log('Dry run:', this.dryRun);

    for (const [id, asset] of this.allAssets) {
      let modified = false;

      if (this.fixType === 'all' || this.fixType === 'legacy-fields') {
        if (this.fixLegacyFields(asset)) modified = true;
      }

      if (this.fixType === 'all' || this.fixType === 'format-issues') {
        if (this.fixFormatIssues(asset)) modified = true;
      }

      if (this.fixType === 'all' || this.fixType === 'broken-links') {
        if (this.fixBrokenLinks(asset)) modified = true;
      }

      if (this.fixType === 'all' || this.fixType === 'corpus-search') {
        if (this.fixCorpusSearch(asset)) modified = true;
      }

      if (modified) {
        asset._modified = true;
        this.fixedAssets.set(id, asset);
        this.stats.assetsFixed++;
      }
    }

    console.log(`\nFixed ${this.stats.assetsFixed} assets`);
  }

  fixLegacyFields(asset) {
    let modified = false;

    for (const [legacyField, mapping] of Object.entries(this.legacyFieldMappings)) {
      // If specific field requested, only process that one
      if (this.specificField && legacyField !== this.specificField) continue;

      if (asset[legacyField] !== undefined && asset[legacyField] !== null) {
        const values = asset[legacyField];

        // Initialize relatedEntities if needed
        if (!asset.relatedEntities) {
          asset.relatedEntities = {};
        }
        if (!asset.relatedEntities[mapping.category]) {
          asset.relatedEntities[mapping.category] = [];
        }

        // Convert and migrate values
        const converted = this.convertToEntityReferences(values, mapping.relationshipType);

        // Merge with existing, avoiding duplicates
        for (const ref of converted) {
          const exists = asset.relatedEntities[mapping.category].some(
            existing => existing.id === ref.id || existing.name === ref.name
          );
          if (!exists) {
            asset.relatedEntities[mapping.category].push(ref);
          }
        }

        // Remove legacy field
        delete asset[legacyField];
        modified = true;
        this.stats.legacyFieldsMigrated++;

        console.log(`  [${asset.id}] Migrated ${legacyField} -> relatedEntities.${mapping.category}`);
      }
    }

    return modified;
  }

  convertToEntityReferences(values, relationshipType) {
    const refs = [];

    if (!values) return refs;

    // Handle array
    if (Array.isArray(values)) {
      for (const value of values) {
        const ref = this.valueToEntityReference(value, relationshipType);
        if (ref) refs.push(ref);
      }
    }
    // Handle string (single value)
    else if (typeof values === 'string') {
      const ref = this.valueToEntityReference(values, relationshipType);
      if (ref) refs.push(ref);
    }
    // Handle object
    else if (typeof values === 'object') {
      const ref = this.valueToEntityReference(values, relationshipType);
      if (ref) refs.push(ref);
    }

    return refs;
  }

  valueToEntityReference(value, relationshipType) {
    if (!value) return null;

    // Already an object with id and name
    if (typeof value === 'object' && value !== null) {
      return {
        id: value.id || this.generateId(value.name || ''),
        name: value.name || value.id || 'Unknown',
        type: value.type || null,
        mythology: value.mythology || null,
        relationship: value.relationship || relationshipType,
        ...(value.description && { description: value.description })
      };
    }

    // String value - convert to object
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      return {
        id: this.generateId(trimmed),
        name: trimmed,
        relationship: relationshipType
      };
    }

    return null;
  }

  generateId(name) {
    if (!name) return 'unknown';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  fixFormatIssues(asset) {
    let modified = false;

    // Fix relatedEntities format issues
    if (asset.relatedEntities && typeof asset.relatedEntities === 'object') {
      for (const [category, entities] of Object.entries(asset.relatedEntities)) {
        if (Array.isArray(entities)) {
          const fixed = [];
          for (const entity of entities) {
            if (typeof entity === 'string') {
              // Convert string to object
              fixed.push({
                id: this.generateId(entity),
                name: entity,
                relationship: 'related'
              });
              this.stats.formatIssuesFixed++;
              modified = true;
            } else if (typeof entity === 'object' && entity !== null) {
              // Ensure required fields
              const fixedEntity = {
                id: entity.id || this.generateId(entity.name || entity.link || ''),
                name: entity.name || entity.id || 'Unknown',
                ...entity
              };

              // Extract id from link if present
              if (!entity.id && entity.link) {
                fixedEntity.id = this.extractIdFromLink(entity.link);
                delete fixedEntity.link; // Remove legacy link field
                this.stats.formatIssuesFixed++;
                modified = true;
              }

              fixed.push(fixedEntity);
            }
          }
          asset.relatedEntities[category] = fixed;
        }
      }
    }

    // Fix family structure
    if (asset.family && typeof asset.family === 'object') {
      const familyFields = ['parents', 'children', 'siblings', 'consorts', 'ancestors', 'descendants'];

      for (const field of familyFields) {
        if (asset.family[field] !== undefined) {
          if (typeof asset.family[field] === 'string') {
            // Convert string to array of entity references
            const names = asset.family[field].split(/[,;]/).map(n => n.trim()).filter(n => n);
            asset.family[field] = names.map(name => ({
              id: this.generateId(name),
              name: name,
              relationship: field.replace(/s$/, '') // parents -> parent
            }));
            this.stats.formatIssuesFixed++;
            modified = true;
          }
        }
      }
    }

    // Fix allies/enemies arrays
    for (const field of ['allies', 'enemies']) {
      if (asset[field] && Array.isArray(asset[field])) {
        const fixed = [];
        for (const entity of asset[field]) {
          if (typeof entity === 'string') {
            fixed.push({
              id: this.generateId(entity),
              name: entity,
              relationship: field === 'allies' ? 'ally' : 'enemy'
            });
            this.stats.formatIssuesFixed++;
            modified = true;
          } else {
            fixed.push(entity);
          }
        }
        asset[field] = fixed;
      }
    }

    return modified;
  }

  extractIdFromLink(link) {
    if (!link) return 'unknown';

    // Extract from HTML path: ../greek/deities/zeus.html -> zeus
    const match = link.match(/\/([^\/]+)\.html$/);
    if (match) {
      return this.generateId(match[1]);
    }

    // Extract last segment
    const parts = link.split('/').filter(p => p && !p.startsWith('.'));
    if (parts.length > 0) {
      return this.generateId(parts[parts.length - 1].replace(/\.(html|json)$/, ''));
    }

    return 'unknown';
  }

  fixBrokenLinks(asset) {
    let modified = false;

    // For broken links, we'll mark them as unverified rather than removing
    // This preserves the data while flagging it for review

    if (asset.relatedEntities && typeof asset.relatedEntities === 'object') {
      for (const [category, entities] of Object.entries(asset.relatedEntities)) {
        if (Array.isArray(entities)) {
          for (const entity of entities) {
            if (entity.id && !this.allAssets.has(entity.id)) {
              // Mark as unverified if reference doesn't exist
              if (!entity._unverified) {
                entity._unverified = true;
                entity._unverifiedReason = 'Referenced entity not found in database';
                this.stats.brokenLinksFixed++;
                modified = true;
              }
            }
          }
        }
      }
    }

    return modified;
  }

  fixCorpusSearch(asset) {
    let modified = false;

    if (asset.corpusSearch) {
      const corpus = asset.corpusSearch;
      const validFields = ['canonical', 'variants', 'epithets', 'domains', 'symbols', 'places', 'concepts'];

      // Ensure all corpus fields are arrays
      for (const field of validFields) {
        if (corpus[field] !== undefined) {
          if (!Array.isArray(corpus[field])) {
            if (typeof corpus[field] === 'string') {
              corpus[field] = [corpus[field]];
            } else if (corpus[field] === null) {
              corpus[field] = [];
            } else {
              corpus[field] = [];
            }
            this.stats.corpusSearchFixed++;
            modified = true;
          }

          // Filter out empty strings and non-strings
          const cleaned = corpus[field].filter(term =>
            typeof term === 'string' && term.trim().length > 0
          ).map(term => term.trim());

          if (cleaned.length !== corpus[field].length) {
            corpus[field] = cleaned;
            this.stats.corpusSearchFixed++;
            modified = true;
          }
        }
      }

      // Initialize canonical if missing but asset has name
      if (!corpus.canonical && asset.name) {
        corpus.canonical = [asset.name];
        if (asset.displayName && asset.displayName !== asset.name) {
          corpus.canonical.push(asset.displayName.replace(/^[^\w]+/, '').trim());
        }
        this.stats.corpusSearchFixed++;
        modified = true;
      }
    }

    return modified;
  }

  async saveFixedAssets() {
    if (this.dryRun) {
      console.log('\n[DRY RUN] Would save', this.fixedAssets.size, 'assets');
      return;
    }

    console.log('\nSaving fixed assets...');

    for (const [id, asset] of this.fixedAssets) {
      try {
        // Determine output path
        const category = asset._category || asset.type || 'unknown';
        const outputDir = path.join(this.outputPath, category);

        await fs.mkdir(outputDir, { recursive: true });

        // Clean up internal fields before saving
        const cleanAsset = { ...asset };
        delete cleanAsset._category;
        delete cleanAsset._filePath;
        delete cleanAsset._modified;

        // Add metadata about the fix
        cleanAsset._lastFixed = new Date().toISOString();
        cleanAsset._fixedBy = 'fix-connection-issues.js';

        const outputFile = path.join(outputDir, `${id}.json`);
        await fs.writeFile(outputFile, JSON.stringify(cleanAsset, null, 2));

      } catch (error) {
        this.stats.errors.push({ type: 'SAVE_ERROR', assetId: id, error: error.message });
      }
    }

    console.log(`Saved ${this.fixedAssets.size} assets to ${this.outputPath}`);
  }

  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      fixType: this.fixType,
      specificField: this.specificField,
      dryRun: this.dryRun,
      stats: this.stats,
      fixedAssetIds: [...this.fixedAssets.keys()]
    };

    await fs.writeFile(
      path.join(reportDir, 'connection-fix-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nFix Report:');
    console.log('  Total Assets:', this.stats.totalAssets);
    console.log('  Assets Fixed:', this.stats.assetsFixed);
    console.log('  Legacy Fields Migrated:', this.stats.legacyFieldsMigrated);
    console.log('  Format Issues Fixed:', this.stats.formatIssuesFixed);
    console.log('  Broken Links Marked:', this.stats.brokenLinksFixed);
    console.log('  Corpus Search Fixed:', this.stats.corpusSearchFixed);
    console.log('  Errors:', this.stats.errors.length);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    fixType: 'all'
  };

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--fix-type=')) {
      options.fixType = arg.split('=')[1];
    }
    if (arg.startsWith('--legacy-field=')) {
      options.specificField = arg.split('=')[1];
      options.fixType = 'legacy-fields';
    }
    if (arg.startsWith('--assets-path=')) {
      options.assetsPath = arg.split('=')[1];
    }
    if (arg.startsWith('--output-path=')) {
      options.outputPath = arg.split('=')[1];
    }
  }

  const fixer = new ConnectionFixer(options);

  try {
    await fixer.loadAllAssets();
    await fixer.fixAllIssues();
    await fixer.saveFixedAssets();
    await fixer.generateReport();

    console.log('\nFix complete!');
  } catch (error) {
    console.error('Error during fix:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ConnectionFixer };
