#!/usr/bin/env node

/**
 * Firebase Batch Upload Script
 * Eyes of Azrael - Phase 3.2
 *
 * Robust Node.js script for uploading all validated entities to Firestore
 * with progress tracking, error handling, and verification.
 *
 * Features:
 * - Batch processing (500 docs max per batch)
 * - Progress bar with real-time status
 * - Rate limiting to avoid quota issues
 * - Automatic retry on failures (3 attempts)
 * - Collection routing by entity type
 * - Data transformation for Firebase
 * - Conflict resolution strategies
 * - Progress tracking in MIGRATION_TRACKER.json
 * - Comprehensive error logging
 *
 * Usage:
 *   node scripts/firebase-batch-upload.js --mythology greek
 *   node scripts/firebase-batch-upload.js --type deity
 *   node scripts/firebase-batch-upload.js --all
 *   node scripts/firebase-batch-upload.js --dry-run
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 500; // Firestore limit
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms
const RATE_LIMIT_DELAY = 100; // ms between batches

// Entity type to Firestore collection mapping
const ENTITY_COLLECTIONS = {
  deity: 'deities',
  hero: 'heroes',
  creature: 'creatures',
  being: 'creatures',
  spirit: 'creatures',
  place: 'places',
  realm: 'places',
  location: 'places',
  item: 'items',
  artifact: 'items',
  relic: 'items',
  weapon: 'items',
  text: 'texts',
  scripture: 'texts',
  book: 'texts',
  concept: 'concepts',
  teaching: 'concepts',
  practice: 'concepts',
  ritual: 'rituals',
  magic: 'rituals',
  ceremony: 'rituals',
  event: 'events',
  myth: 'myths',
  cosmology: 'cosmology',
  symbol: 'symbols'
};

// Paths
const PARSED_DATA_DIR = path.join(__dirname, '../FIREBASE/parsed_data');
const MIGRATION_TRACKER_PATH = path.join(__dirname, '../MIGRATION_TRACKER.json');
const MIGRATION_LOG_PATH = path.join(__dirname, '../MIGRATION_LOG.md');
const ERROR_LOG_PATH = path.join(__dirname, '../firebase-upload-errors.log');

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let db;
let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) return;

  try {
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ firebase-service-account.json not found!');
      console.error('   Please download it from Firebase Console:');
      console.error('   Project Settings > Service Accounts > Generate New Private Key');
      process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    isInitialized = true;
    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format number with padding
 */
function padNumber(num, width) {
  return String(num).padStart(width, ' ');
}

/**
 * Create progress bar
 */
function createProgressBar(current, total, width = 40) {
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}% | ${current}/${total}`;
}

/**
 * Log error to file
 */
function logError(error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorEntry = `\n[${timestamp}] ${error.message}\n${JSON.stringify(context, null, 2)}\n${'='.repeat(80)}\n`;

  fs.appendFileSync(ERROR_LOG_PATH, errorEntry);
}

/**
 * Update migration tracker
 */
function updateMigrationTracker(updates) {
  let tracker = { files: {}, stats: {} };

  if (fs.existsSync(MIGRATION_TRACKER_PATH)) {
    try {
      tracker = JSON.parse(fs.readFileSync(MIGRATION_TRACKER_PATH, 'utf-8'));
    } catch (error) {
      console.warn('⚠️  Could not read migration tracker, creating new one');
    }
  }

  // Merge updates
  if (updates.files) {
    tracker.files = { ...tracker.files, ...updates.files };
  }
  if (updates.stats) {
    tracker.stats = { ...tracker.stats, ...updates.stats };
  }

  tracker.lastUpdated = new Date().toISOString();

  fs.writeFileSync(MIGRATION_TRACKER_PATH, JSON.stringify(tracker, null, 2));
}

/**
 * Update migration log
 */
function updateMigrationLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `\n## ${timestamp}\n\n${message}\n`;

  fs.appendFileSync(MIGRATION_LOG_PATH, logEntry);
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Transform entity data for Firebase
 */
function transformEntityForFirebase(entity, mythology) {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Determine entity type from various sources
  const entityType = entity.type || entity.category || entity.assetType || 'concept';

  return {
    // Core identity
    id: entity.id,
    name: entity.name || entity.title || 'Unnamed',
    type: entityType,
    mythology: entity.mythology || mythology || 'unknown',

    // Content
    summary: entity.summary || entity.description || '',
    description: entity.description || '',
    panels: entity.panels || entity.sections || [],

    // Metadata
    status: 'published',
    authorId: 'official',
    isOfficial: true,

    // Search optimization
    searchTerms: generateSearchTerms(entity),

    // Links and relationships
    link: entity.link || '',
    icon: entity.icon || '',
    relatedEntities: entity.relatedEntities || [],

    // Timestamps
    createdAt: timestamp,
    updatedAt: timestamp,

    // Migration metadata
    migrationSource: entity.source || 'html_parser',
    migrationDate: new Date().toISOString(),

    // Original data (for reference)
    _original: {
      extractionMetadata: entity.extractionMetadata || null,
      originalPath: entity.originalPath || null
    }
  };
}

/**
 * Generate search terms from entity
 */
function generateSearchTerms(entity) {
  const terms = new Set();

  // Add name variations
  if (entity.name) {
    terms.add(entity.name.toLowerCase());
    entity.name.split(/\s+/).forEach(word => terms.add(word.toLowerCase()));
  }

  if (entity.title) {
    terms.add(entity.title.toLowerCase());
  }

  // Add ID
  if (entity.id) terms.add(entity.id.toLowerCase());

  // Add type
  if (entity.type) terms.add(entity.type.toLowerCase());

  // Add mythology
  if (entity.mythology) terms.add(entity.mythology.toLowerCase());

  // Add from description
  if (entity.summary) {
    const words = entity.summary.toLowerCase().match(/\b\w{4,}\b/g);
    if (words) {
      words.slice(0, 20).forEach(word => terms.add(word));
    }
  }

  return Array.from(terms).filter(Boolean);
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Check if document exists in Firestore
 */
async function checkDocumentExists(collection, docId) {
  try {
    const doc = await db.collection(collection).doc(docId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Resolve conflict based on strategy
 */
function resolveConflict(existing, incoming, strategy = 'overwrite') {
  switch (strategy) {
    case 'skip':
      return existing; // Keep existing

    case 'merge':
      // Merge: incoming takes precedence, but preserve some fields
      return {
        ...existing,
        ...incoming,
        createdAt: existing.createdAt, // Preserve original creation date
        views: existing.views || 0,
        likes: existing.likes || 0
      };

    case 'overwrite':
    default:
      // Replace completely, but preserve stats
      return {
        ...incoming,
        views: existing.views || 0,
        likes: existing.likes || 0
      };
  }
}

// ============================================================================
// BATCH UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a batch of entities with retry logic
 */
async function uploadBatchWithRetry(collection, entities, batchNum, totalBatches, options = {}) {
  const { dryRun = false, strategy = 'overwrite' } = options;

  if (dryRun) {
    console.log(`   [DRY RUN] Batch ${batchNum}/${totalBatches} - Would upload ${entities.length} entities to ${collection}`);
    return { success: true, uploaded: entities.length, failed: 0, skipped: 0 };
  }

  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    try {
      const batch = db.batch();
      let skipped = 0;

      for (const entity of entities) {
        // Check for conflicts if strategy is not overwrite
        if (strategy !== 'overwrite') {
          const existing = await checkDocumentExists(collection, entity.id);
          if (existing) {
            if (strategy === 'skip') {
              skipped++;
              continue;
            } else if (strategy === 'merge') {
              entity = resolveConflict(existing, entity, 'merge');
            }
          }
        }

        const docRef = db.collection(collection).doc(entity.id);
        batch.set(docRef, entity, { merge: strategy === 'merge' });
      }

      await batch.commit();

      return {
        success: true,
        uploaded: entities.length - skipped,
        failed: 0,
        skipped: skipped
      };

    } catch (error) {
      attempt++;
      lastError = error;

      if (attempt < MAX_RETRIES) {
        console.log(`   ⚠️  Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All retries failed
  logError(lastError, { collection, batchNum, entityCount: entities.length });
  return {
    success: false,
    uploaded: 0,
    failed: entities.length,
    skipped: 0
  };
}

/**
 * Upload entities to collection with progress tracking
 */
async function uploadEntitiesToCollection(collection, entities, options = {}) {
  const totalBatches = Math.ceil(entities.length / BATCH_SIZE);
  const stats = {
    uploaded: 0,
    failed: 0,
    skipped: 0
  };

  console.log(`\n📦 Uploading to ${collection}`);
  console.log(`   Total: ${entities.length} entities in ${totalBatches} batch(es)\n`);

  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = entities.slice(i, i + BATCH_SIZE);

    // Upload batch
    const result = await uploadBatchWithRetry(collection, batch, batchNum, totalBatches, options);

    stats.uploaded += result.uploaded;
    stats.failed += result.failed;
    stats.skipped += result.skipped;

    // Progress bar
    const progressBar = createProgressBar(Math.min(i + BATCH_SIZE, entities.length), entities.length);
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} Batch ${batchNum}/${totalBatches} ${progressBar}`);

    // Rate limiting
    if (batchNum < totalBatches) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  return stats;
}

// ============================================================================
// DATA LOADING FUNCTIONS
// ============================================================================

/**
 * Load entities from parsed data files
 */
function loadEntitiesFromFiles(options = {}) {
  const { mythology, type } = options;
  const allEntities = {};

  // Get list of parsed data files
  const files = fs.readdirSync(PARSED_DATA_DIR)
    .filter(f => f.endsWith('_parsed.json'))
    .filter(f => !f.includes('all_mythologies'))
    .filter(f => !f.includes('stats'))
    .filter(f => !f.includes('quality'))
    .filter(f => !f.includes('validation'));

  for (const file of files) {
    const filePath = path.join(PARSED_DATA_DIR, file);
    const mythologyName = file.replace('_parsed.json', '');

    // Skip if mythology filter doesn't match
    if (mythology && mythologyName !== mythology) {
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Handle different data structures
      let entities = [];

      if (Array.isArray(data)) {
        entities = data;
      } else if (data.items) {
        entities = data.items;
      } else if (data.deities) {
        entities = data.deities;
      } else {
        // It might be an object with mythology names as keys
        const mythKeys = Object.keys(data).filter(k => !k.startsWith('_'));
        if (mythKeys.length > 0) {
          entities = mythKeys.flatMap(key => {
            const mythData = data[key];
            return Array.isArray(mythData) ? mythData :
                   mythData.items || mythData.deities || [];
          });
        }
      }

      // Transform and categorize entities
      for (const entity of entities) {
        if (!entity.id || !entity.name) continue;

        const transformed = transformEntityForFirebase(entity, mythologyName);

        // Skip if type filter doesn't match
        if (type && transformed.type !== type) {
          continue;
        }

        // Determine collection
        const collection = ENTITY_COLLECTIONS[transformed.type] || 'concepts';

        if (!allEntities[collection]) {
          allEntities[collection] = [];
        }

        allEntities[collection].push(transformed);
      }

    } catch (error) {
      console.warn(`⚠️  Error loading ${file}: ${error.message}`);
    }
  }

  return allEntities;
}

// ============================================================================
// VERIFICATION
// ============================================================================

/**
 * Verify uploaded documents
 */
async function verifyUpload(collection, expectedIds, options = {}) {
  const { dryRun = false } = options;

  if (dryRun) {
    console.log(`   [DRY RUN] Would verify ${expectedIds.length} documents in ${collection}`);
    return { verified: expectedIds.length, missing: 0 };
  }

  console.log(`\n🔍 Verifying ${collection}...`);

  const missing = [];
  const verified = [];

  for (const id of expectedIds) {
    try {
      const doc = await db.collection(collection).doc(id).get();
      if (doc.exists) {
        verified.push(id);
      } else {
        missing.push(id);
      }
    } catch (error) {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    console.log(`   ⚠️  Missing ${missing.length} documents`);
    missing.slice(0, 5).forEach(id => console.log(`      - ${id}`));
    if (missing.length > 5) {
      console.log(`      ... and ${missing.length - 5} more`);
    }
  } else {
    console.log(`   ✅ All ${verified.length} documents verified`);
  }

  return { verified: verified.length, missing: missing.length };
}

// ============================================================================
// MAIN UPLOAD FUNCTION
// ============================================================================

/**
 * Main upload orchestrator
 */
async function uploadToFirebase(options = {}) {
  const {
    mythology,
    type,
    all = false,
    dryRun = false,
    strategy = 'overwrite'
  } = options;

  console.log('🚀 Firebase Batch Upload');
  console.log('='.repeat(80));

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be uploaded\n');
  }

  // Load entities
  console.log('📂 Loading entities...');
  const entitiesByCollection = loadEntitiesFromFiles({ mythology, type });

  const totalEntities = Object.values(entitiesByCollection)
    .reduce((sum, entities) => sum + entities.length, 0);

  if (totalEntities === 0) {
    console.log('❌ No entities found matching criteria');
    return;
  }

  console.log(`   Found ${totalEntities} entities across ${Object.keys(entitiesByCollection).length} collections\n`);

  // Display filters
  if (mythology) console.log(`   Mythology filter: ${mythology}`);
  if (type) console.log(`   Type filter: ${type}`);
  if (strategy !== 'overwrite') console.log(`   Conflict strategy: ${strategy}`);
  console.log('');

  // Upload each collection
  const startTime = Date.now();
  const uploadStats = {
    collections: {},
    totalUploaded: 0,
    totalFailed: 0,
    totalSkipped: 0
  };

  for (const [collection, entities] of Object.entries(entitiesByCollection)) {
    const stats = await uploadEntitiesToCollection(collection, entities, { dryRun, strategy });

    uploadStats.collections[collection] = stats;
    uploadStats.totalUploaded += stats.uploaded;
    uploadStats.totalFailed += stats.failed;
    uploadStats.totalSkipped += stats.skipped;

    // Verify upload if not dry run
    if (!dryRun && stats.uploaded > 0) {
      const entityIds = entities.map(e => e.id);
      await verifyUpload(collection, entityIds, { dryRun });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Upload Summary');
  console.log('='.repeat(80));

  console.log('\nBy Collection:');
  Object.entries(uploadStats.collections)
    .sort((a, b) => b[1].uploaded - a[1].uploaded)
    .forEach(([collection, stats]) => {
      const status = stats.failed > 0 ? '⚠️' : '✅';
      console.log(`   ${status} ${collection.padEnd(20)} ${padNumber(stats.uploaded, 4)} uploaded, ${stats.failed} failed, ${stats.skipped} skipped`);
    });

  console.log(`\n   ✅ Uploaded: ${uploadStats.totalUploaded}`);
  console.log(`   ❌ Failed: ${uploadStats.totalFailed}`);
  console.log(`   ⊙ Skipped: ${uploadStats.totalSkipped}`);
  console.log(`   ⏱️  Time: ${elapsed}s`);

  // Update migration tracker
  if (!dryRun) {
    updateMigrationTracker({
      stats: {
        lastUpload: new Date().toISOString(),
        uploaded: uploadStats.totalUploaded,
        failed: uploadStats.totalFailed,
        collections: uploadStats.collections
      }
    });

    updateMigrationLog(
      `Uploaded ${uploadStats.totalUploaded} entities across ${Object.keys(uploadStats.collections).length} collections.\n` +
      `Filters: mythology=${mythology || 'all'}, type=${type || 'all'}\n` +
      `Time: ${elapsed}s`
    );

    console.log('\n✅ Migration tracker updated');
  }

  console.log('\n');
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    mythology: null,
    type: null,
    all: false,
    dryRun: false,
    strategy: 'overwrite',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--mythology' && args[i + 1]) {
      options.mythology = args[++i];
    } else if (arg === '--type' && args[i + 1]) {
      options.type = args[++i];
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--strategy' && args[i + 1]) {
      options.strategy = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

/**
 * Display help text
 */
function displayHelp() {
  console.log(`
Firebase Batch Upload Script
${'='.repeat(80)}

Upload validated entities to Firestore with progress tracking and error handling.

Usage:
  node scripts/firebase-batch-upload.js [options]

Options:
  --mythology <name>    Upload entities from specific mythology (e.g., greek, norse)
  --type <type>         Upload entities of specific type (e.g., deity, hero)
  --all                 Upload all entities from all mythologies
  --dry-run             Test without uploading (shows what would be uploaded)
  --strategy <mode>     Conflict resolution: overwrite, skip, or merge (default: overwrite)
  --help, -h            Show this help message

Examples:
  # Upload all Greek mythology entities
  node scripts/firebase-batch-upload.js --mythology greek

  # Upload only deities from all mythologies
  node scripts/firebase-batch-upload.js --type deity

  # Upload everything
  node scripts/firebase-batch-upload.js --all

  # Test run without uploading
  node scripts/firebase-batch-upload.js --mythology norse --dry-run

  # Upload with merge strategy (preserves existing data)
  node scripts/firebase-batch-upload.js --all --strategy merge

Collections:
  ${Object.entries(ENTITY_COLLECTIONS).map(([type, collection]) =>
    `${type.padEnd(15)} → ${collection}`
  ).join('\n  ')}

For more information, see FIREBASE_UPLOAD_GUIDE.md
`);
}

/**
 * Main entry point
 */
async function main() {
  const options = parseArguments();

  if (options.help) {
    displayHelp();
    process.exit(0);
  }

  // Initialize Firebase (unless dry run for data loading only)
  if (!options.dryRun) {
    initializeFirebase();
  }

  // Run upload
  try {
    await uploadToFirebase(options);
    console.log('✅ Upload complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('   Check firebase-upload-errors.log for details\n');
    logError(error, { options });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  uploadToFirebase,
  transformEntityForFirebase,
  ENTITY_COLLECTIONS
};
