const fs = require('fs').promises;
const path = require('path');

/**
 * Create Concept Hub Assets
 *
 * Creates hub/index assets that link to concepts, making them discoverable.
 * Groups concepts by their culture/topic and creates hub pages.
 */

class ConceptHubCreator {
  constructor(assetsPath, dryRun = true) {
    this.assetsPath = assetsPath;
    this.dryRun = dryRun;
    this.concepts = [];
    this.hubsCreated = [];
  }

  async loadConcepts() {
    console.log('Loading concepts...');

    const conceptsPath = path.join(this.assetsPath, 'concepts');
    await this.loadDirectory(conceptsPath);

    console.log(`Loaded ${this.concepts.length} concepts`);
  }

  async loadDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.loadDirectory(fullPath);
        } else if (entry.name.endsWith('.json')) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const data = JSON.parse(content);
            if (data.id) {
              this.concepts.push({
                id: data.id,
                name: data.name || data.id,
                culture: data.culture || data.mythology || 'general',
                topic: this.extractTopic(data),
                filePath: fullPath
              });
            }
          } catch (e) {
            // Skip invalid files
          }
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }

  extractTopic(data) {
    // Try to extract topic from various fields
    const name = (data.name || '').toLowerCase();
    const desc = (data.description || '').toLowerCase();

    // Topic keywords
    if (name.includes('conspiracy') || desc.includes('conspiracy')) return 'conspiracy';
    if (name.includes('ufo') || desc.includes('ufo') || name.includes('alien')) return 'ufo';
    if (name.includes('illuminati') || name.includes('secret society')) return 'secret-societies';
    if (name.includes('medical') || name.includes('health') || name.includes('vaccine')) return 'health';
    if (name.includes('government') || name.includes('cia') || name.includes('fbi')) return 'government';
    if (name.includes('technology') || name.includes('tech')) return 'technology';
    if (name.includes('finance') || name.includes('bank') || name.includes('money')) return 'finance';
    if (name.includes('media') || name.includes('news') || name.includes('hollywood')) return 'media';

    return 'general';
  }

  groupByCulture() {
    const groups = {};

    for (const concept of this.concepts) {
      const key = (concept.culture || 'general').toLowerCase().replace(/\s+/g, '-');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(concept);
    }

    return groups;
  }

  async createHubs() {
    console.log('\nGrouping concepts by culture...');

    const groups = this.groupByCulture();

    console.log('\nCulture groups:');
    const sortedGroups = Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20); // Top 20

    for (const [culture, concepts] of sortedGroups) {
      console.log(`  ${culture}: ${concepts.length} concepts`);
    }

    console.log('\nCreating hub assets...');

    for (const [culture, concepts] of Object.entries(groups)) {
      if (concepts.length >= 10) { // Only create hubs for groups with 10+ concepts
        await this.createHub(culture, concepts);
      }
    }

    console.log(`\nCreated ${this.hubsCreated.length} hub assets`);
  }

  async createHub(culture, concepts) {
    const hubId = `concepts-hub-${culture}`;
    const hubName = `${this.titleCase(culture)} Concepts Collection`;

    // Create the hub asset
    const hubAsset = {
      id: hubId,
      name: hubName,
      type: 'concept',
      culture: culture,
      description: `A collection of ${concepts.length} concepts related to ${this.titleCase(culture)} topics. This hub serves as a navigation index for exploring related ideas and theories.`,
      icon: this.getIconForCulture(culture),
      relatedEntities: {
        concepts: concepts.map(c => ({
          id: c.id,
          name: c.name,
          type: 'concept',
          relationship: 'contains'
        }))
      },
      metadata: {
        isHub: true,
        conceptCount: concepts.length,
        createdAt: new Date().toISOString()
      }
    };

    const hubPath = path.join(this.assetsPath, 'concepts', `${hubId}.json`);

    if (!this.dryRun) {
      await fs.writeFile(hubPath, JSON.stringify(hubAsset, null, 2));
    }

    this.hubsCreated.push({
      id: hubId,
      name: hubName,
      conceptCount: concepts.length,
      path: hubPath
    });

    console.log(`  Created: ${hubId} (${concepts.length} concepts)`);
  }

  titleCase(str) {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getIconForCulture(culture) {
    const icons = {
      'american': '🇺🇸',
      'global': '🌍',
      'european': '🇪🇺',
      'british': '🇬🇧',
      'chinese': '🇨🇳',
      'russian': '🇷🇺',
      'general': '📚',
      'default': '📖'
    };
    return icons[culture] || icons['default'];
  }

  async run() {
    await this.loadConcepts();
    await this.createHubs();

    console.log('\n' + '='.repeat(60));
    console.log('CONCEPT HUB CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Concepts: ${this.concepts.length}`);
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
  const creator = new ConceptHubCreator(assetsPath, dryRun);

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

module.exports = { ConceptHubCreator };
