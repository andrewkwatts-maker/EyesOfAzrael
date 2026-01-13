const fs = require('fs').promises;
const path = require('path');

/**
 * Create Catch-All Hub Assets
 *
 * Creates hub assets for remaining orphaned entities that don't fit into
 * culture or mythology-based hubs.
 */

class CatchAllHubCreator {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.orphans = {
      concepts: [],
      deities: [],
      creatures: [],
      items: [],
      places: [],
      heroes: [],
      magic: [],
      herbs: [],
      archetypes: [],
      other: []
    };
    this.hubsCreated = [];
  }

  async loadOrphans() {
    console.log('Loading orphan report...');

    const reportPath = path.join(__dirname, 'reports', 'orphan-fix-report.json');
    const content = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(content);

    for (const orphan of report.orphans) {
      // Skip hub files - they're meant to be entry points
      if (orphan.id.startsWith('mythology-hub-') || orphan.id.startsWith('concepts-hub-')) {
        continue;
      }

      const category = orphan.category || 'other';
      if (this.orphans[category]) {
        this.orphans[category].push(orphan);
      } else {
        this.orphans.other.push(orphan);
      }
    }

    console.log('Remaining orphans by category:');
    for (const [cat, items] of Object.entries(this.orphans)) {
      if (items.length > 0) {
        console.log(`  ${cat}: ${items.length}`);
      }
    }
  }

  async createHubs() {
    console.log('\nCreating catch-all hubs...\n');

    // Create hub for miscellaneous concepts
    if (this.orphans.concepts.length > 0) {
      await this.createHub('concepts', 'concepts-hub-miscellaneous', 'Miscellaneous Concepts Collection',
        'A collection of concepts covering various topics, theories, and ideas that span multiple cultures and domains.',
        this.orphans.concepts);
    }

    // Create hub for deities from small mythologies
    if (this.orphans.deities.length > 0) {
      await this.createHub('deities', 'mythology-hub-minor-traditions', 'Minor Traditions Deities',
        'Deities from smaller, less documented mythological traditions around the world.',
        this.orphans.deities);
    }

    // Create hub for miscellaneous creatures
    if (this.orphans.creatures.length > 0) {
      await this.createHub('creatures', 'mythology-hub-global-creatures', 'Global Mythical Creatures',
        'Mythical creatures and beings from various folklore traditions worldwide.',
        this.orphans.creatures);
    }

    // Create hub for miscellaneous items
    if (this.orphans.items.length > 0) {
      await this.createHub('items', 'mythology-hub-legendary-artifacts', 'Legendary Artifacts Collection',
        'Sacred items, magical artifacts, and legendary objects from various traditions.',
        this.orphans.items);
    }

    // Create hub for miscellaneous places
    if (this.orphans.places.length > 0) {
      await this.createHub('places', 'mythology-hub-sacred-sites', 'Sacred Sites Collection',
        'Sacred places, mystical locations, and legendary sites from around the world.',
        this.orphans.places);
    }

    // Create hub for miscellaneous heroes
    if (this.orphans.heroes.length > 0) {
      await this.createHub('heroes', 'mythology-hub-legendary-figures', 'Legendary Figures Collection',
        'Heroes, champions, and legendary figures from various traditions.',
        this.orphans.heroes);
    }

    // Create hub for miscellaneous magic
    if (this.orphans.magic.length > 0) {
      await this.createHub('magic', 'mythology-hub-magical-traditions', 'Magical Traditions Collection',
        'Magical systems, esoteric practices, and mystical traditions from around the world.',
        this.orphans.magic);
    }

    // Create hub for miscellaneous herbs
    if (this.orphans.herbs.length > 0) {
      await this.createHub('herbs', 'mythology-hub-sacred-plants', 'Sacred Plants Collection',
        'Sacred herbs, mystical plants, and ritual substances from various cultures.',
        this.orphans.herbs);
    }

    // Create hub for miscellaneous archetypes
    if (this.orphans.archetypes.length > 0) {
      await this.createHub('archetypes', 'mythology-hub-universal-archetypes', 'Universal Archetypes Collection',
        'Universal archetypes and mythological patterns found across cultures.',
        this.orphans.archetypes);
    }

    // Create hub for anything else
    if (this.orphans.other.length > 0) {
      await this.createHub('mythologies', 'mythology-hub-uncategorized', 'Uncategorized Entities',
        'Entities and concepts that span multiple categories or traditions.',
        this.orphans.other);
    }

    console.log(`\nCreated ${this.hubsCreated.length} catch-all hubs`);
  }

  async createHub(category, hubId, hubName, description, orphans) {
    const relatedEntities = {};

    // Group by type
    for (const orphan of orphans) {
      const type = orphan.category || 'other';
      if (!relatedEntities[type]) {
        relatedEntities[type] = [];
      }
      relatedEntities[type].push({
        id: orphan.id,
        name: orphan.name || orphan.id,
        type: this.categoryToType(type),
        relationship: 'contains'
      });
    }

    const hubAsset = {
      id: hubId,
      name: hubName,
      type: 'collection',
      description: description,
      icon: '📚',
      relatedEntities,
      metadata: {
        isHub: true,
        isCatchAll: true,
        entityCount: orphans.length,
        createdAt: new Date().toISOString()
      }
    };

    const hubPath = path.join(this.assetsPath, category, `${hubId}.json`);

    if (!this.dryRun) {
      await fs.mkdir(path.join(this.assetsPath, category), { recursive: true });
      await fs.writeFile(hubPath, JSON.stringify(hubAsset, null, 2));
    }

    this.hubsCreated.push({ id: hubId, name: hubName, count: orphans.length });
    console.log(`  Created: ${hubId} (${orphans.length} entities)`);
  }

  categoryToType(category) {
    const typeMap = {
      'deities': 'deity',
      'heroes': 'hero',
      'creatures': 'creature',
      'items': 'item',
      'places': 'place',
      'concepts': 'concept',
      'cosmology': 'cosmology',
      'rituals': 'ritual',
      'herbs': 'herb',
      'texts': 'text',
      'symbols': 'symbol',
      'events': 'event',
      'archetypes': 'archetype',
      'magic': 'magic'
    };
    return typeMap[category] || category;
  }

  async run() {
    await this.loadOrphans();
    await this.createHubs();

    console.log('\n' + '='.repeat(60));
    console.log('CATCH-ALL HUB CREATION SUMMARY');
    console.log('='.repeat(60));
    for (const hub of this.hubsCreated) {
      console.log(`  ${hub.id}: ${hub.count} entities`);
    }
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
  const creator = new CatchAllHubCreator(assetsPath, dryRun);

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

module.exports = { CatchAllHubCreator };
