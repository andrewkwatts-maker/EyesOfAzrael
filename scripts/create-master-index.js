const fs = require('fs').promises;
const path = require('path');

/**
 * Create Master Index Hub
 *
 * Creates a master navigation hub that links to all orphaned hub assets,
 * ensuring zero orphans in the asset database.
 */

async function createMasterIndex() {
  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const reportPath = path.join(__dirname, 'reports', 'orphan-fix-report.json');

  // Load orphan report
  const reportContent = await fs.readFile(reportPath, 'utf8');
  const report = JSON.parse(reportContent);

  console.log(`Found ${report.orphans.length} orphaned assets`);

  // Categorize orphans
  const hubOrphans = [];
  const otherOrphans = [];

  for (const orphan of report.orphans) {
    if (orphan.id.includes('-hub-') || orphan.id.startsWith('concepts-hub-')) {
      hubOrphans.push(orphan);
    } else {
      otherOrphans.push(orphan);
    }
  }

  console.log(`  Hub orphans: ${hubOrphans.length}`);
  console.log(`  Other orphans: ${otherOrphans.length}`);

  // Create master index hub
  const masterIndex = {
    id: 'master-navigation-index',
    name: 'Master Navigation Index',
    type: 'navigation',
    description: 'Central navigation hub linking to all mythology collections, concept hubs, and special collections in the Eyes of Azrael encyclopedia.',
    icon: '🧭',
    mythology: 'universal',
    relatedEntities: {
      mythologies: [],
      collections: []
    },
    metadata: {
      isHub: true,
      isMasterIndex: true,
      createdAt: new Date().toISOString()
    }
  };

  // Add hub orphans to master index
  for (const orphan of hubOrphans) {
    const entity = {
      id: orphan.id,
      name: orphan.name || formatName(orphan.id),
      type: 'collection',
      relationship: 'contains'
    };

    if (orphan.id.startsWith('concepts-hub-')) {
      masterIndex.relatedEntities.collections.push(entity);
    } else {
      masterIndex.relatedEntities.mythologies.push(entity);
    }
  }

  // Add other orphans directly
  for (const orphan of otherOrphans) {
    const category = orphan.category || 'mythologies';
    if (!masterIndex.relatedEntities[category]) {
      masterIndex.relatedEntities[category] = [];
    }
    masterIndex.relatedEntities[category].push({
      id: orphan.id,
      name: orphan.name || formatName(orphan.id),
      type: categoryToType(category),
      relationship: 'contains'
    });
  }

  // Write master index
  const masterPath = path.join(assetsPath, 'mythologies', 'master-navigation-index.json');
  await fs.writeFile(masterPath, JSON.stringify(masterIndex, null, 2));
  console.log(`\nCreated: ${masterPath}`);

  // Also create a secondary link FROM the main mythology hubs TO orphaned hubs
  // This ensures bidirectional linking
  await linkOrphanedHubs(assetsPath, hubOrphans);

  console.log('\nMaster index created successfully!');
  console.log(`Linked ${hubOrphans.length} hub orphans`);
  console.log(`Linked ${otherOrphans.length} other orphans`);
}

async function linkOrphanedHubs(assetsPath, orphanedHubs) {
  // Load existing world-mythologies hub if it exists
  const worldHubPath = path.join(assetsPath, 'mythologies', 'world-mythologies.json');

  let worldHub;
  try {
    const content = await fs.readFile(worldHubPath, 'utf8');
    worldHub = JSON.parse(content);
  } catch {
    // Create world mythologies hub
    worldHub = {
      id: 'world-mythologies',
      name: 'World Mythologies',
      type: 'navigation',
      description: 'Complete index of all world mythology traditions and belief systems.',
      icon: '🌍',
      mythology: 'universal',
      relatedEntities: {
        mythologies: []
      },
      metadata: {
        isHub: true,
        isRootHub: true,
        createdAt: new Date().toISOString()
      }
    };
  }

  // Add orphaned mythology hubs to world hub
  for (const hub of orphanedHubs) {
    if (hub.id.startsWith('mythology-hub-')) {
      const existing = worldHub.relatedEntities.mythologies.find(m => m.id === hub.id);
      if (!existing) {
        worldHub.relatedEntities.mythologies.push({
          id: hub.id,
          name: hub.name || formatName(hub.id),
          type: 'collection',
          relationship: 'contains'
        });
      }
    }
  }

  await fs.writeFile(worldHubPath, JSON.stringify(worldHub, null, 2));
  console.log(`Updated: ${worldHubPath}`);
}

function formatName(id) {
  return id
    .replace(/^mythology-hub-/, '')
    .replace(/^concepts-hub-/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function categoryToType(category) {
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
    'magic': 'magic',
    'mythologies': 'mythology'
  };
  return typeMap[category] || category;
}

createMasterIndex().catch(console.error);
