#!/usr/bin/env node

/**
 * Sync Sacred Texts Metadata to Firebase
 *
 * Uploads enriched text metadata from local JSON files to Firebase Firestore.
 * Supports dry-run mode and batch processing.
 *
 * Usage:
 *   node SYNC_TEXTS_TO_FIREBASE.js [--dry-run] [--batch-size 100]
 *
 * Requirements:
 *   - GOOGLE_APPLICATION_CREDENTIALS environment variable set to service account key
 *   - Firebase Admin SDK initialized
 *   - Firestore database configured
 *
 * Options:
 *   --dry-run         Preview changes without writing to Firebase
 *   --batch-size      Number of documents to update per batch (default: 100)
 *   --collection      Target collection (default: texts)
 *   --mythology       Only sync texts from specific mythology (e.g., christian)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration from command line arguments
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100');
const COLLECTION = process.argv.find(arg => arg.startsWith('--collection='))?.split('=')[1] || 'texts';
const MYTHOLOGY_FILTER = process.argv.find(arg => arg.startsWith('--mythology='))?.split('=')[1] || null;

// Directory configuration
const FIREBASE_DATA_DIR = path.join(__dirname, '../data');
const TEXTS_DIR = path.join(FIREBASE_DATA_DIR, 'texts');

// Statistics
const stats = {
  filesProcessed: 0,
  documentsLoaded: 0,
  documentsUpdated: 0,
  documentsFailed: 0,
  fieldUpdates: 0,
  errors: [],
  summary: {}
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // Try to get service account credentials
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
        console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set or file not found');
        console.error('To set up Firebase Admin SDK:');
        console.error('  1. Go to Firebase Console > Project Settings > Service Accounts');
        console.error('  2. Click "Generate New Private Key"');
        console.error('  3. Set: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"');
        process.exit(1);
      }

      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      console.log(`Firebase initialized with project: ${serviceAccount.project_id}`);
    }

    return admin.firestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

/**
 * Load all text files from local directory
 */
function loadAllTexts() {
  console.log(`Loading text files from ${TEXTS_DIR}...`);

  if (!fs.existsSync(TEXTS_DIR)) {
    console.error(`Error: Texts directory not found at ${TEXTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TEXTS_DIR);
  const textFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Found ${textFiles.length} text files`);
  return textFiles;
}

/**
 * Load texts from a JSON file
 */
function loadTextsFromFile(filename) {
  const filePath = path.join(TEXTS_DIR, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const texts = JSON.parse(content);

    if (!Array.isArray(texts)) {
      throw new Error('File does not contain an array of texts');
    }

    return texts;
  } catch (error) {
    stats.errors.push({
      file: filename,
      error: error.message
    });
    throw error;
  }
}

/**
 * Update a single document in Firestore
 */
async function updateDocument(db, docId, data) {
  try {
    await db.collection(COLLECTION).doc(docId).set(data, { merge: true });
    return true;
  } catch (error) {
    stats.documentsFailed++;
    stats.errors.push({
      docId: docId,
      error: error.message
    });
    return false;
  }
}

/**
 * Batch update documents
 */
async function batchUpdateDocuments(db, documents) {
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const writeBatch = db.batch();

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} documents)...`);

    for (const doc of batch) {
      const docRef = db.collection(COLLECTION).doc(doc.id);
      writeBatch.set(docRef, doc, { merge: true });
    }

    try {
      if (!DRY_RUN) {
        await writeBatch.commit();
        updated += batch.length;
        console.log(`  ✓ Committed ${batch.length} documents`);
      } else {
        console.log(`  [DRY RUN] Would commit ${batch.length} documents`);
        updated += batch.length;
      }
    } catch (error) {
      console.error(`  ✗ Batch error: ${error.message}`);
      failed += batch.length;
      stats.errors.push({
        batch: i / BATCH_SIZE,
        error: error.message
      });
    }
  }

  return { updated, failed };
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Sacred Texts Firebase Sync Script');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE SYNC'}`);
  console.log(`Collection: ${COLLECTION}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  if (MYTHOLOGY_FILTER) {
    console.log(`Mythology Filter: ${MYTHOLOGY_FILTER}`);
  }
  console.log();

  // Initialize Firebase
  const db = initializeFirebase();
  console.log();

  // Load text files
  const textFiles = loadAllTexts();
  if (textFiles.length === 0) {
    console.log('No text files to sync.');
    process.exit(0);
  }

  console.log('Loading and preparing documents...\n');

  const documentsToSync = [];

  // Load all texts from files
  for (const file of textFiles) {
    try {
      const texts = loadTextsFromFile(file);
      stats.filesProcessed++;

      let fileCount = 0;
      for (const text of texts) {
        // Apply mythology filter if specified
        if (MYTHOLOGY_FILTER && text.mythology !== MYTHOLOGY_FILTER) {
          continue;
        }

        // Validate required fields
        if (!text.id) {
          stats.errors.push({
            file: file,
            error: 'Text missing required "id" field'
          });
          continue;
        }

        documentsToSync.push({
          id: text.id,
          ...text,
          syncedAt: new Date().toISOString(),
          syncedFrom: 'local'
        });

        fileCount++;
        stats.documentsLoaded++;
      }

      console.log(`✓ Loaded ${fileCount} texts from ${file}`);
    } catch (error) {
      console.error(`✗ Failed to load ${file}: ${error.message}`);
    }
  }

  console.log(`\nTotal documents prepared: ${documentsToSync.length}`);

  if (documentsToSync.length === 0) {
    console.log('No documents to sync.');
    process.exit(0);
  }

  // Count metadata fields
  let fieldCount = 0;
  documentsToSync.forEach(doc => {
    const metadataFields = ['author', 'period', 'language', 'themes', 'structure', 'influence'];
    metadataFields.forEach(field => {
      if (doc[field]) {
        fieldCount++;
      }
    });
  });

  console.log(`Metadata fields to sync: ${fieldCount}`);
  console.log();

  // Sync to Firebase
  if (DRY_RUN) {
    console.log('[DRY RUN] Would sync the following:');
    console.log(`  - Documents: ${documentsToSync.length}`);
    console.log(`  - Metadata Fields: ${fieldCount}`);
    console.log(`  - Batch Size: ${BATCH_SIZE}`);
    console.log(`  - Total Batches: ${Math.ceil(documentsToSync.length / BATCH_SIZE)}`);
  } else {
    console.log('Syncing documents to Firebase...\n');

    try {
      const result = await batchUpdateDocuments(db, documentsToSync);
      stats.documentsUpdated = result.updated;
      stats.documentsFailed = result.failed;

      console.log(`\nSync completed: ${result.updated} documents updated, ${result.failed} failed`);
    } catch (error) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('Summary');
  console.log('='.repeat(70));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Documents loaded: ${stats.documentsLoaded}`);
  console.log(`Documents updated: ${stats.documentsUpdated}`);
  console.log(`Documents failed: ${stats.documentsFailed}`);
  console.log(`Metadata fields synced: ${fieldCount}`);

  if (stats.errors.length > 0) {
    console.log(`\nErrors: ${stats.errors.length}`);
    stats.errors.slice(0, 5).forEach(err => {
      console.log(`  - ${err.file || err.docId || err.batch}: ${err.error}`);
    });
    if (stats.errors.length > 5) {
      console.log(`  ... and ${stats.errors.length - 5} more errors`);
    }
  }

  if (DRY_RUN) {
    console.log('\nNo changes were made (dry-run mode).');
    console.log('Run without --dry-run flag to sync to Firebase.');
  } else {
    console.log('\nSync completed successfully!');
  }

  console.log('='.repeat(70));
  console.log();

  // Close Firebase connection
  await admin.app().delete();
  process.exit(stats.documentsFailed > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
