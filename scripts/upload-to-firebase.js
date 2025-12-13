/**
 * Firebase Upload Script for Entity v2.0
 * Uploads entities to Firestore with proper indexing and search terms
 *
 * Setup:
 * 1. npm install firebase-admin
 * 2. Download Firebase service account key
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 *
 * Usage:
 *   node scripts/upload-to-firebase.js --all
 *   node scripts/upload-to-firebase.js --type deity
 *   node scripts/upload-to-firebase.js --mythology egyptian
 *   node scripts/upload-to-firebase.js --file data/entities/deity/ra.json
 */

const fs = require('fs');
const path = require('path');

// Note: Firebase Admin SDK must be installed separately
// This script provides the structure for Firebase upload

const ENTITIES_DIR = path.join(__dirname, '../data/entities');

/**
 * Transform entity to Firestore-compatible format
 */
function transformForFirestore(entity) {
  const firestore = {
    // Core fields
    id: entity.id,
    type: entity.type,
    name: entity.name,
    icon: entity.icon || '',
    mythologies: entity.mythologies || [],
    primaryMythology: entity.primaryMythology || entity.mythologies[0],

    // Descriptions
    shortDescription: entity.shortDescription || '',
    longDescription: entity.longDescription || entity.fullDescription || '',

    // Metadata for queries
    category: entity.type,
    mythology: entity.primaryMythology || entity.mythologies[0],
    displayName: entity.name,

    // Search optimization
    searchTerms: generateSearchTerms(entity),
    tags: entity.tags || [],

    // Colors for UI
    colors: entity.colors || {},

    // Timestamps
    createdAt: entity.metadata?.created || new Date().toISOString(),
    updatedAt: entity.metadata?.lastModified || new Date().toISOString(),

    // Status
    status: entity.status || 'published',
    visibility: entity.visibility || 'public',

    // Nested data (preserved for detailed views)
    linguistic: entity.linguistic || null,
    geographical: entity.geographical || null,
    temporal: entity.temporal || null,
    cultural: entity.cultural || null,
    metaphysicalProperties: entity.metaphysicalProperties || null,

    // Related entities (simplified for queries)
    relatedDeityIds: entity.relatedEntities?.deities?.map(d => d.id) || [],
    relatedItemIds: entity.relatedEntities?.items?.map(i => i.id) || [],
    relatedPlaceIds: entity.relatedEntities?.places?.map(p => p.id) || [],
    relatedConceptIds: entity.relatedEntities?.concepts?.map(c => c.id) || [],

    // Sources (preserved)
    sources: entity.sources || [],

    // Archetypes
    archetypes: entity.archetypes || [],

    // Completeness score for quality metrics
    completeness: calculateCompleteness(entity)
  };

  return firestore;
}

/**
 * Generate comprehensive search terms
 */
function generateSearchTerms(entity) {
  const terms = new Set();

  // Basic terms
  terms.add(entity.id);
  terms.add(entity.name.toLowerCase());
  entity.mythologies?.forEach(m => terms.add(m));

  // Tags
  entity.tags?.forEach(tag => terms.add(tag.toLowerCase()));

  // Linguistic terms
  if (entity.linguistic) {
    if (entity.linguistic.originalName) terms.add(entity.linguistic.originalName);
    if (entity.linguistic.transliteration) terms.add(entity.linguistic.transliteration);
    entity.linguistic.alternativeNames?.forEach(alt => terms.add(alt.name.toLowerCase()));
  }

  // Name variants
  const nameWords = entity.name.toLowerCase().split(' ');
  nameWords.forEach(word => terms.add(word));

  return Array.from(terms);
}

/**
 * Calculate entity completeness percentage
 */
function calculateCompleteness(entity) {
  const fields = [
    !!entity.id,
    !!entity.type,
    !!entity.name,
    !!entity.mythologies?.length,
    !!entity.shortDescription,
    !!(entity.longDescription || entity.fullDescription),
    !!entity.icon,
    !!entity.colors?.primary,
    !!entity.sources?.length,
    !!entity.tags?.length,
    !!entity.linguistic?.originalName,
    !!entity.geographical?.primaryLocation,
    !!entity.temporal?.firstAttestation,
    !!entity.cultural?.worshipPractices?.length,
    !!entity.metaphysicalProperties?.primaryElement,
    !!entity.archetypes?.length,
    !!(entity.relatedEntities && Object.keys(entity.relatedEntities).length)
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Get Firestore collection name based on entity type
 */
function getCollectionName(type) {
  return `entities_${type}`;
}

/**
 * Dry run - show what would be uploaded
 */
function dryRun(entities) {
  console.log('\n=== Dry Run - Entities to Upload ===\n');

  const byType = {};
  entities.forEach(entity => {
    if (!byType[entity.type]) byType[entity.type] = [];
    byType[entity.type].push(entity);
  });

  for (const [type, list] of Object.entries(byType)) {
    console.log(`\n${type.toUpperCase()} (${list.length}):`);
    list.forEach(entity => {
      const data = transformForFirestore(entity);
      console.log(`  - ${entity.name} (${entity.id})`);
      console.log(`    Collection: ${getCollectionName(type)}`);
      console.log(`    Completeness: ${data.completeness}%`);
      console.log(`    Search terms: ${data.searchTerms.length}`);
    });
  }

  console.log(`\n=== Total: ${entities.length} entities ===\n`);
}

/**
 * Upload entities to Firebase
 * NOTE: Requires Firebase Admin SDK setup
 */
async function uploadToFirebase(entities) {
  try {
    // Check if Firebase Admin is available
    const admin = require('firebase-admin');

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!serviceAccount) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();

    console.log('\n=== Uploading to Firebase ===\n');

    let uploaded = 0;
    let failed = 0;

    // Batch upload (Firestore allows 500 operations per batch)
    const batch = db.batch();

    for (const entity of entities) {
      try {
        const data = transformForFirestore(entity);
        const collection = getCollectionName(entity.type);
        const docRef = db.collection(collection).doc(entity.id);

        batch.set(docRef, data);
        uploaded++;

        console.log(`✅ Queued: ${entity.name} (${entity.id})`);

        // Commit batch every 400 documents
        if (uploaded % 400 === 0) {
          await batch.commit();
          console.log(`\n📦 Committed batch of ${uploaded} documents\n`);
        }
      } catch (error) {
        console.error(`❌ Failed: ${entity.name} - ${error.message}`);
        failed++;
      }
    }

    // Commit remaining documents
    if (uploaded % 400 !== 0) {
      await batch.commit();
    }

    console.log(`\n=== Upload Complete ===`);
    console.log(`Uploaded: ${uploaded}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Firebase Admin SDK not installed');
      console.error('Install with: npm install firebase-admin');
      console.error('Then set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.log('\nRunning dry run instead...\n');
      dryRun(entities);
    } else {
      throw error;
    }
  }
}

/**
 * Load entities from filesystem
 */
function loadEntities(filter = {}) {
  const entities = [];

  // Get all entity type directories
  const types = fs.readdirSync(ENTITIES_DIR).filter(name => {
    const stat = fs.statSync(path.join(ENTITIES_DIR, name));
    return stat.isDirectory();
  });

  for (const type of types) {
    // Skip if filtering by type
    if (filter.type && type !== filter.type) continue;

    const typeDir = path.join(ENTITIES_DIR, type);
    const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(typeDir, file);
        const entity = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Skip if filtering by mythology
        if (filter.mythology && !entity.mythologies?.includes(filter.mythology)) {
          continue;
        }

        entities.push(entity);
      } catch (error) {
        console.error(`Error loading ${file}:`, error.message);
      }
    }
  }

  return entities;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  const filter = {};
  const options = {
    dryRun: true // Default to dry run
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--all') {
      // Upload all entities
    } else if (arg === '--type' && args[i + 1]) {
      filter.type = args[i + 1];
      i++;
    } else if (arg === '--mythology' && args[i + 1]) {
      filter.mythology = args[i + 1];
      i++;
    } else if (arg === '--file' && args[i + 1]) {
      // Upload single file
      const entity = JSON.parse(fs.readFileSync(args[i + 1], 'utf-8'));
      await uploadToFirebase([entity]);
      return;
    } else if (arg === '--upload') {
      options.dryRun = false;
    }
  }

  // Load entities
  const entities = loadEntities(filter);

  if (entities.length === 0) {
    console.error('No entities found matching criteria');
    return;
  }

  // Upload or dry run
  if (options.dryRun) {
    dryRun(entities);
    console.log('\nTo actually upload, add --upload flag');
  } else {
    await uploadToFirebase(entities);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  transformForFirestore,
  uploadToFirebase,
  loadEntities
};
