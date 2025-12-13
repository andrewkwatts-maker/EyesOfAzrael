/**
 * Upload Greek Entities to Firebase Script
 * Converts entity-schema-v2.0 JSON to Firestore-compatible format and batch uploads
 *
 * Usage:
 *   node scripts/upload-greek-to-firebase.js --dry-run
 *   node scripts/upload-greek-to-firebase.js --upload
 */

const fs = require('fs');
const path = require('path');

const ENTITIES_DIR = path.join(__dirname, '../data/entities');

// Statistics
const stats = {
  total: 0,
  converted: 0,
  ready: 0,
  byType: {}
};

/**
 * Convert entity to Firebase-compatible format
 */
function convertToFirestoreFormat(entity) {
  // Add Firebase-specific fields
  const firestoreEntity = {
    ...entity,

    // Search optimization
    searchTerms: generateSearchTerms(entity),
    displayName: entity.name,
    category: entity.type,
    mythology: entity.primaryMythology || entity.mythologies[0],

    // Firestore metadata
    visibility: 'public',
    status: 'published',
    contributors: [],
    views: 0,
    likes: 0,

    // Timestamps
    createdAt: new Date(entity.metadata?.created || new Date().toISOString()),
    updatedAt: new Date(entity.metadata?.lastModified || new Date().toISOString()),

    // Completeness tracking
    schemaVersion: '2.0',
    completeness: entity.metadata?.completeness || 0
  };

  // Clean up undefined/null values for Firestore
  cleanFirestoreObject(firestoreEntity);

  return firestoreEntity;
}

/**
 * Generate search terms array for full-text search
 */
function generateSearchTerms(entity) {
  const terms = new Set();

  // Add basic fields
  if (entity.id) terms.add(entity.id);
  if (entity.name) {
    terms.add(entity.name.toLowerCase());
    // Add individual words
    entity.name.split(/\s+/).forEach(word => terms.add(word.toLowerCase()));
  }

  // Add mythology
  entity.mythologies?.forEach(m => terms.add(m.toLowerCase()));

  // Add tags
  entity.tags?.forEach(tag => terms.add(tag.toLowerCase()));

  // Add linguistic variants
  if (entity.linguistic?.originalName) terms.add(entity.linguistic.originalName);
  if (entity.linguistic?.transliteration) terms.add(entity.linguistic.transliteration.toLowerCase());
  entity.linguistic?.alternativeNames?.forEach(alt => terms.add(alt.name.toLowerCase()));

  // Add type
  if (entity.type) terms.add(entity.type);

  return Array.from(terms).filter(Boolean);
}

/**
 * Recursively clean undefined/null values from object
 */
function cleanFirestoreObject(obj) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined || obj[key] === null) {
      delete obj[key];
    } else if (obj[key] === '') {
      // Keep empty strings but consider removing them in some cases
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].filter(item => item !== undefined && item !== null);
      if (obj[key].length === 0) {
        delete obj[key];
      } else {
        obj[key].forEach(item => {
          if (typeof item === 'object') {
            cleanFirestoreObject(item);
          }
        });
      }
    } else if (typeof obj[key] === 'object') {
      cleanFirestoreObject(obj[key]);
      // Remove empty objects
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    }
  });
}

/**
 * Convert all Greek entities to Firestore format
 */
function convertGreekEntities() {
  const types = ['deity', 'hero', 'creature', 'place', 'item', 'magic', 'concept'];
  const firestoreExport = {
    entities: [],
    collections: {
      deities: [],
      heroes: [],
      creatures: [],
      places: [],
      items: [],
      magic: [],
      concepts: []
    },
    metadata: {
      exportDate: new Date().toISOString(),
      totalEntities: 0,
      byType: {},
      mythology: 'greek',
      schemaVersion: '2.0'
    }
  };

  types.forEach(type => {
    const typeDir = path.join(ENTITIES_DIR, type);

    if (!fs.existsSync(typeDir)) {
      return;
    }

    const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(typeDir, file);

      try {
        const entity = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Only export Greek entities
        if (!entity.mythologies?.includes('greek')) {
          return;
        }

        stats.total++;

        const firestoreEntity = convertToFirestoreFormat(entity);

        // Add to main entities array
        firestoreExport.entities.push(firestoreEntity);

        // Add to type-specific collection
        const collectionName = type === 'concept' ? 'concepts' :
                               type === 'deity' ? 'deities' :
                               type === 'hero' ? 'heroes' :
                               type === 'creature' ? 'creatures' :
                               type === 'place' ? 'places' :
                               type === 'item' ? 'items' :
                               type === 'magic' ? 'magic' : type + 's';

        firestoreExport.collections[collectionName].push(firestoreEntity);

        stats.converted++;
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        if (firestoreEntity.completeness >= 70) {
          stats.ready++;
        }

        const status = firestoreEntity.completeness >= 80 ? '✅' :
                      firestoreEntity.completeness >= 60 ? '⚠️' : '❌';
        console.log(`${status} ${firestoreEntity.name} (${type}) - ${firestoreEntity.completeness}% complete, ${firestoreEntity.searchTerms.length} search terms`);

      } catch (error) {
        console.error(`Error converting ${file}:`, error.message);
      }
    });
  });

  // Update metadata
  firestoreExport.metadata.totalEntities = firestoreExport.entities.length;
  firestoreExport.metadata.byType = stats.byType;

  return firestoreExport;
}

/**
 * Main function
 */
function main() {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--upload');

  console.log('\n=== Firebase Export for Greek Mythology ===\n');

  if (dryRun) {
    console.log('Running in DRY RUN mode. No files will be written.\n');
  }

  const firestoreExport = convertGreekEntities();

  console.log('\n=== Conversion Summary ===');
  console.log(`Total entities processed: ${stats.total}`);
  console.log(`Converted to Firestore format: ${stats.converted}`);
  console.log(`Ready for production (≥70% complete): ${stats.ready} (${Math.round(stats.ready/stats.converted*100)}%)`);
  console.log('\nBy Type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Save exports
  if (!dryRun) {
    const outputDir = path.join(__dirname, '../firebase-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Full export
    const fullExportPath = path.join(outputDir, 'greek-entities-firestore.json');
    fs.writeFileSync(fullExportPath, JSON.stringify(firestoreExport, null, 2));
    console.log(`\n✅ Full export saved: ${fullExportPath}`);

    // Collection-specific exports
    Object.entries(firestoreExport.collections).forEach(([collectionName, entities]) => {
      if (entities.length > 0) {
        const collectionPath = path.join(outputDir, `greek-${collectionName}.json`);
        fs.writeFileSync(collectionPath, JSON.stringify({ [collectionName]: entities }, null, 2));
        console.log(`   Collection export: ${collectionPath} (${entities.length} entities)`);
      }
    });

    console.log('\n📤 Ready to upload to Firebase!');
    console.log('\nNext steps:');
    console.log('  1. Review the exported JSON files');
    console.log('  2. Use Firebase Admin SDK to batch upload:');
    console.log('     firebase firestore:import ./firebase-exports/greek-entities-firestore.json');
    console.log('  3. Or use custom upload script with batched writes');

  } else {
    console.log('\n💡 Run with --upload flag to save exports to disk.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertToFirestoreFormat, generateSearchTerms };
