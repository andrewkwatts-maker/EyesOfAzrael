/**
 * Fix Validation Warnings
 *
 * Addresses:
 * 1. Unknown entity category "mythologies" -> move to proper location
 * 2. Missing name fields on entity references
 * 3. Unknown relationship types -> normalize to valid types
 */

const fs = require('fs').promises;
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Valid relationship types
const VALID_RELATIONSHIPS = [
  'parent', 'child', 'sibling', 'consort', 'spouse',
  'ally', 'enemy', 'rival', 'friend',
  'creator', 'creation', 'wielder', 'guardian',
  'mentor', 'student', 'servant', 'master',
  'associated', 'related', 'aspect', 'avatar',
  'predecessor', 'successor'
];

// Relationship type mappings
const RELATIONSHIP_MAPPINGS = {
  'parents': 'parent',
  'children': 'child',
  'siblings': 'sibling',
  'consorts': 'consort',
  'spouses': 'spouse',
  'foster-son': 'associated',
  'foster-child': 'associated',
  'foster-parent': 'mentor',
  'protege': 'student',
  'pupil': 'student'
};

class WarningFixer {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.allAssets = new Map();
    this.stats = {
      mythologiesCategoryFixed: 0,
      namesAdded: 0,
      relationshipsNormalized: 0,
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

      if (Array.isArray(data)) {
        for (const asset of data) {
          if (asset?.id) {
            this.allAssets.set(asset.id, { asset, category, filePath, isArray: true });
          }
        }
      } else if (data.id) {
        this.allAssets.set(data.id, { asset: data, category, filePath, isArray: false });
      }
    } catch {
      // Skip invalid files
    }
  }

  async fix() {
    await this.loadAssets();

    console.log('\nFixing validation warnings...\n');

    const modifiedFiles = new Set();

    for (const [assetId, { asset, filePath }] of this.allAssets) {
      let modified = false;

      // Fix 1: Handle "mythologies" category in relatedEntities
      if (asset.relatedEntities?.mythologies) {
        // Move mythologies references to a mythologyCollection field
        if (!asset.mythologyCollection) {
          asset.mythologyCollection = [];
        }

        for (const ref of asset.relatedEntities.mythologies) {
          const id = typeof ref === 'string' ? ref : ref?.id;
          if (id && !asset.mythologyCollection.some(m => m.id === id)) {
            asset.mythologyCollection.push({
              id,
              name: this.getAssetName(id) || this.formatName(id),
              type: 'mythology'
            });
          }
        }

        delete asset.relatedEntities.mythologies;
        this.stats.mythologiesCategoryFixed++;
        modified = true;
      }

      // Fix 2: Add missing names to entity references
      if (asset.relatedEntities) {
        for (const [category, refs] of Object.entries(asset.relatedEntities)) {
          if (Array.isArray(refs)) {
            for (const ref of refs) {
              if (typeof ref === 'object' && ref.id && !ref.name) {
                ref.name = this.getAssetName(ref.id) || this.formatName(ref.id);
                this.stats.namesAdded++;
                modified = true;
              }
            }
          }
        }
      }

      // Fix 3: Add missing names to family references
      if (asset.family) {
        for (const [relType, refs] of Object.entries(asset.family)) {
          if (Array.isArray(refs)) {
            for (const ref of refs) {
              if (typeof ref === 'object' && ref.id && !ref.name) {
                ref.name = this.getAssetName(ref.id) || this.formatName(ref.id);
                this.stats.namesAdded++;
                modified = true;
              }
            }
          }
        }
      }

      // Fix 4: Normalize relationship types
      if (asset.relatedEntities) {
        for (const [category, refs] of Object.entries(asset.relatedEntities)) {
          if (Array.isArray(refs)) {
            for (const ref of refs) {
              if (typeof ref === 'object' && ref.relationship) {
                const normalized = this.normalizeRelationship(ref.relationship);
                if (normalized !== ref.relationship) {
                  ref.relationship = normalized;
                  this.stats.relationshipsNormalized++;
                  modified = true;
                }
              }
            }
          }
        }
      }

      if (modified) {
        modifiedFiles.add(filePath);
      }
    }

    // Write modified files
    for (const filePath of modifiedFiles) {
      // Find asset by filePath
      for (const [, data] of this.allAssets) {
        if (data.filePath === filePath && !data.isArray) {
          this.stats.filesModified++;
          if (!this.dryRun) {
            await fs.writeFile(filePath, JSON.stringify(data.asset, null, 2));
          }
          break;
        }
      }
    }

    this.printReport();
  }

  getAssetName(id) {
    const assetData = this.allAssets.get(id);
    return assetData?.asset?.name || null;
  }

  formatName(id) {
    // Convert ID to readable name
    // e.g., "mythology-hub-greek" -> "Greek Mythology"
    // e.g., "erebus" -> "Erebus"
    if (id.startsWith('mythology-hub-')) {
      const mythology = id.replace('mythology-hub-', '');
      return this.capitalize(mythology) + ' Mythology';
    }
    return id.split(/[-_]/).map(w => this.capitalize(w)).join(' ');
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  normalizeRelationship(rel) {
    const lower = rel.toLowerCase();

    // Check if already valid
    if (VALID_RELATIONSHIPS.includes(lower)) {
      return lower;
    }

    // Check mappings
    if (RELATIONSHIP_MAPPINGS[lower]) {
      return RELATIONSHIP_MAPPINGS[lower];
    }

    // Default to 'associated' for unknown types
    return 'associated';
  }

  printReport() {
    console.log('='.repeat(60));
    console.log('VALIDATION WARNING FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  Mythologies category fixed: ${this.stats.mythologiesCategoryFixed}`);
    console.log(`  Names added to references: ${this.stats.namesAdded}`);
    console.log(`  Relationships normalized: ${this.stats.relationshipsNormalized}`);
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

const fixer = new WarningFixer(dryRun);
fixer.fix().catch(console.error);
