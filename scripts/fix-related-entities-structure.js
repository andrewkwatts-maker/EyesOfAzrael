/**
 * Fix relatedEntities Structure
 *
 * Converts relatedEntities from flat array to proper category-keyed object:
 * FROM: relatedEntities: [{type: "deity", id: "zeus"}, ...]
 * TO:   relatedEntities: {deities: [{id: "zeus", ...}], heroes: [...]}
 */

const fs = require('fs').promises;
const path = require('path');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Map type values to category keys
const TYPE_TO_CATEGORY = {
  'deity': 'deities',
  'deities': 'deities',
  'god': 'deities',
  'goddess': 'deities',
  'hero': 'heroes',
  'heroes': 'heroes',
  'creature': 'creatures',
  'creatures': 'creatures',
  'item': 'items',
  'items': 'items',
  'artifact': 'items',
  'place': 'places',
  'places': 'places',
  'location': 'places',
  'text': 'texts',
  'texts': 'texts',
  'cosmology': 'cosmology',
  'concept': 'concepts',
  'concepts': 'concepts',
  'archetype': 'archetypes',
  'archetypes': 'archetypes',
  'ritual': 'rituals',
  'rituals': 'rituals',
  'herb': 'herbs',
  'herbs': 'herbs',
  'symbol': 'symbols',
  'symbols': 'symbols',
  'event': 'events',
  'events': 'events',
  'being': 'beings',
  'beings': 'beings',
  'magic': 'magic',
  'mythology': 'mythologies',
  'mythologies': 'mythologies'
};

class StructureFixer {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.stats = {
      filesFixed: 0,
      entitiesRestructured: 0
    };
  }

  async fix() {
    console.log('Scanning for assets with array-based relatedEntities...\n');

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places', 'texts',
      'cosmology', 'rituals', 'herbs', 'symbols', 'events', 'concepts',
      'archetypes', 'magic', 'beings', 'mythologies'
    ];

    for (const category of categories) {
      await this.processCategory(category);
    }

    this.printReport();
  }

  async processCategory(category) {
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
            await this.processFile(path.join(entryPath, file));
          }
        }
      } else if (entry.name.endsWith('.json')) {
        await this.processFile(entryPath);
      }
    }
  }

  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (!data.relatedEntities) return;

      // Check if it's already proper structure (has category keys)
      if (!Array.isArray(data.relatedEntities) && !this.hasNumericKeys(data.relatedEntities)) {
        return; // Already proper structure
      }

      // Convert to proper structure
      const newStructure = {};
      const items = Array.isArray(data.relatedEntities)
        ? data.relatedEntities
        : Object.values(data.relatedEntities);

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        // Determine category from type field or default to 'deities'
        const type = item.type || 'deities';
        const category = TYPE_TO_CATEGORY[type.toLowerCase()] || 'deities';

        if (!newStructure[category]) {
          newStructure[category] = [];
        }

        // Create clean reference without the type field
        const cleanRef = {
          id: item.id,
          name: item.name || this.formatName(item.id),
          relationship: item.relationship || 'related'
        };

        // Copy any unverified flags
        if (item._unverified) {
          cleanRef._unverified = item._unverified;
          cleanRef._unverifiedReason = item._unverifiedReason;
        }

        // Avoid duplicates
        if (!newStructure[category].some(r => r.id === cleanRef.id)) {
          newStructure[category].push(cleanRef);
        }

        this.stats.entitiesRestructured++;
      }

      data.relatedEntities = newStructure;
      this.stats.filesFixed++;

      if (!this.dryRun) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }

    } catch (error) {
      // Skip invalid files
    }
  }

  hasNumericKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return false;
    const keys = Object.keys(obj);
    return keys.some(k => /^\d+$/.test(k));
  }

  formatName(id) {
    if (!id) return 'Unknown';
    return id.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  printReport() {
    console.log('='.repeat(60));
    console.log('RELATED ENTITIES STRUCTURE FIX REPORT');
    console.log('='.repeat(60));
    console.log(`\nFixes Applied:`);
    console.log(`  Files fixed: ${this.stats.filesFixed}`);
    console.log(`  Entities restructured: ${this.stats.entitiesRestructured}`);
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

const fixer = new StructureFixer(dryRun);
fixer.fix().catch(console.error);
