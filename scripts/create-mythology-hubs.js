const fs = require('fs').promises;
const path = require('path');

/**
 * Create Mythology Hub Assets
 *
 * Creates hub/index assets for each mythology that link to all entities within.
 * Ensures all mythology assets have at least 1 inbound link.
 */

class MythologyHubCreator {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.assets = new Map(); // mythology -> category -> assets[]
    this.hubsCreated = [];
    this.categories = ['deities', 'heroes', 'creatures', 'items', 'places', 'cosmology', 'rituals', 'herbs', 'texts', 'symbols', 'events', 'archetypes', 'magic', 'beings'];
  }

  async loadAllAssets() {
    console.log('Loading all mythology assets...');

    for (const category of this.categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    console.log(`Loaded assets from ${this.assets.size} mythologies`);
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
      if (entry.name.startsWith('concepts-hub')) continue; // Skip concept hubs

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
        // Subdirectory might be mythology name (e.g., deities/greek/)
        await this.loadSubdirectory(category, entry.name, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(category, entryPath);
      }
    }
  }

  async loadSubdirectory(category, subdir, dirPath) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.loadAssetFile(category, path.join(dirPath, file), subdir);
      }
    }
  }

  async loadAssetFile(category, filePath, subdirMythology = null) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (!data.id) return;

      // Determine mythology
      let mythology = data.mythology || subdirMythology || this.extractMythologyFromId(data.id) || 'general';
      mythology = mythology.toLowerCase().replace(/\s+/g, '-');

      // Initialize mythology map
      if (!this.assets.has(mythology)) {
        this.assets.set(mythology, new Map());
      }
      const mythologyMap = this.assets.get(mythology);

      // Initialize category array
      if (!mythologyMap.has(category)) {
        mythologyMap.set(category, []);
      }

      mythologyMap.get(category).push({
        id: data.id,
        name: data.name || data.id,
        type: this.categoryToType(category)
      });
    } catch (e) {
      // Skip invalid files
    }
  }

  extractMythologyFromId(id) {
    const prefixes = ['greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'christian', 'islamic', 'jewish', 'roman', 'celtic', 'japanese', 'chinese', 'aztec', 'mayan', 'sumerian', 'babylonian', 'persian', 'african', 'native_american', 'tarot'];

    for (const prefix of prefixes) {
      if (id.toLowerCase().startsWith(prefix + '_') || id.toLowerCase().startsWith(prefix + '-')) {
        return prefix;
      }
    }
    return null;
  }

  categoryToType(category) {
    const typeMap = {
      'deities': 'deity',
      'heroes': 'hero',
      'creatures': 'creature',
      'items': 'item',
      'places': 'place',
      'cosmology': 'cosmology',
      'rituals': 'ritual',
      'herbs': 'herb',
      'texts': 'text',
      'symbols': 'symbol',
      'events': 'event',
      'archetypes': 'archetype',
      'magic': 'magic',
      'beings': 'being'
    };
    return typeMap[category] || category;
  }

  async createHubs() {
    console.log('\nCreating mythology hub assets...\n');

    for (const [mythology, categories] of this.assets) {
      // Count total assets in this mythology
      let totalAssets = 0;
      for (const assets of categories.values()) {
        totalAssets += assets.length;
      }

      if (totalAssets >= 3) { // Only create hubs for mythologies with 3+ assets
        await this.createHub(mythology, categories, totalAssets);
      }
    }

    console.log(`\nCreated ${this.hubsCreated.length} mythology hub assets`);
  }

  async createHub(mythology, categories, totalAssets) {
    const hubId = `mythology-hub-${mythology}`;
    const hubName = `${this.titleCase(mythology)} Mythology Collection`;

    // Build relatedEntities with all categories
    const relatedEntities = {};

    for (const [category, assets] of categories) {
      if (assets.length > 0) {
        relatedEntities[category] = assets.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          relationship: 'contains'
        }));
      }
    }

    const hubAsset = {
      id: hubId,
      name: hubName,
      type: 'mythology',
      mythology: mythology,
      description: `A comprehensive collection of ${totalAssets} entities from ${this.titleCase(mythology)} mythology. This hub serves as a navigation index for exploring all related deities, heroes, creatures, items, and more.`,
      icon: this.getIconForMythology(mythology),
      relatedEntities,
      metadata: {
        isHub: true,
        totalAssets: totalAssets,
        categoryCounts: Object.fromEntries(
          Array.from(categories.entries()).map(([cat, assets]) => [cat, assets.length])
        ),
        createdAt: new Date().toISOString()
      }
    };

    const hubPath = path.join(this.assetsPath, 'mythologies', `${hubId}.json`);

    if (!this.dryRun) {
      // Ensure mythologies directory exists
      await fs.mkdir(path.join(this.assetsPath, 'mythologies'), { recursive: true });
      await fs.writeFile(hubPath, JSON.stringify(hubAsset, null, 2));
    }

    this.hubsCreated.push({
      id: hubId,
      name: hubName,
      totalAssets: totalAssets,
      path: hubPath
    });

    // Print category breakdown
    const breakdown = Array.from(categories.entries())
      .filter(([, assets]) => assets.length > 0)
      .map(([cat, assets]) => `${cat}:${assets.length}`)
      .join(', ');

    console.log(`  ${hubId}: ${totalAssets} assets (${breakdown})`);
  }

  titleCase(str) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getIconForMythology(mythology) {
    const icons = {
      'greek': '🏛️',
      'norse': '⚡',
      'egyptian': '🏺',
      'hindu': '🕉️',
      'buddhist': '☸️',
      'christian': '✝️',
      'islamic': '☪️',
      'jewish': '✡️',
      'roman': '🦅',
      'celtic': '☘️',
      'japanese': '🎌',
      'chinese': '🐉',
      'aztec': '🌞',
      'mayan': '🗿',
      'sumerian': '𒀭',
      'babylonian': '🌙',
      'persian': '🔥',
      'african': '🌍',
      'native-american': '🦅',
      'tarot': '🃏',
      'general': '📚'
    };
    return icons[mythology] || '📖';
  }

  async run() {
    await this.loadAllAssets();
    await this.createHubs();

    console.log('\n' + '='.repeat(60));
    console.log('MYTHOLOGY HUB CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Mythologies Found: ${this.assets.size}`);
    console.log(`Hubs Created: ${this.hubsCreated.length}`);
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files created');
      console.log('Run with --apply flag to create hub assets');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const creator = new MythologyHubCreator(assetsPath, dryRun);

  try {
    await creator.run();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MythologyHubCreator };
