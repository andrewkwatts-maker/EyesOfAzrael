/**
 * Fix Remaining Warnings
 *
 * Handles edge cases:
 * 1. String references in family/enemies fields
 * 2. Unknown relationship types
 */

const fs = require('fs').promises;
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Additional relationship mappings
const REL_MAPPINGS = {
  'follower': 'associated',
  'associated_with': 'associated',
  'unrequited_love': 'related',
  'opposed_to': 'enemy',
  'antagonist': 'enemy'
};

class FinalFixer {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.allAssets = new Map();
    this.stats = {
      stringsConverted: 0,
      relationshipsFixed: 0,
      filesModified: 0
    };
  }

  async loadAssets() {
    console.log('Loading all assets...');

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places', 'texts',
      'cosmology', 'rituals', 'herbs', 'symbols', 'events', 'concepts',
      'archetypes', 'magic', 'beings', 'mythologies'
    ];

    for (const category of categories) {
      await this.loadCategory(category);
    }

    console.log(`Loaded ${this.allAssets.size} assets`);
  }

  async loadCategory(category) {
    const categoryPath = path.join(ASSET_DIR, category);

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
        const files = await fs.readdir(entryPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('_')) {
            await this.loadAssetFile(category, path.join(entryPath, file));
          }
        }
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(category, entryPath);
      }
    }
  }

  async loadAssetFile(category, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.id) {
        this.allAssets.set(data.id, { asset: data, category, filePath });
      }
    } catch {
      // Skip invalid files
    }
  }

  async fix() {
    await this.loadAssets();

    console.log('\nFixing remaining warnings...\n');

    for (const [assetId, { asset, filePath }] of this.allAssets) {
      let modified = false;

      // Fix string references in family
      if (asset.family) {
        for (const [relType, refs] of Object.entries(asset.family)) {
          if (Array.isArray(refs)) {
            for (let i = 0; i < refs.length; i++) {
              if (typeof refs[i] === 'string') {
                refs[i] = {
                  id: this.makeId(refs[i]),
                  name: refs[i],
                  relationship: relType.replace(/s$/, ''),
                  _unverified: true,
                  _unverifiedReason: 'Converted from string reference'
                };
                this.stats.stringsConverted++;
                modified = true;
              }
            }
          }
        }
      }

      // Fix string references in enemies/allies
      for (const field of ['enemies', 'allies']) {
        if (Array.isArray(asset[field])) {
          for (let i = 0; i < asset[field].length; i++) {
            if (typeof asset[field][i] === 'string') {
              asset[field][i] = {
                id: this.makeId(asset[field][i]),
                name: asset[field][i],
                relationship: field.replace(/s$/, ''),
                _unverified: true,
                _unverifiedReason: 'Converted from string reference'
              };
              this.stats.stringsConverted++;
              modified = true;
            }
          }
        }
      }

      // Fix unknown relationship types in relatedEntities
      if (asset.relatedEntities) {
        for (const [category, refs] of Object.entries(asset.relatedEntities)) {
          if (Array.isArray(refs)) {
            for (const ref of refs) {
              if (typeof ref === 'object' && ref.relationship) {
                const mapped = REL_MAPPINGS[ref.relationship];
                if (mapped) {
                  ref.relationship = mapped;
                  this.stats.relationshipsFixed++;
                  modified = true;
                }
              }
            }
          }
        }
      }

      if (modified) {
        this.stats.filesModified++;
        if (!this.dryRun) {
          await fs.writeFile(filePath, JSON.stringify(asset, null, 2));
        }
      }
    }

    this.printReport();
  }

  makeId(name) {
    return name.toLowerCase()
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  printReport() {
    console.log('='.repeat(60));
    console.log('FINAL WARNINGS FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  Strings converted: ${this.stats.stringsConverted}`);
    console.log(`  Relationships fixed: ${this.stats.relationshipsFixed}`);
    console.log(`  Files modified: ${this.stats.filesModified}`);
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to apply fixes');
    }
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

const fixer = new FinalFixer(dryRun);
fixer.fix().catch(console.error);
