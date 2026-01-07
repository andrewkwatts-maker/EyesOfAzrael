#!/usr/bin/env node

/**
 * Upload Enriched Items to Firebase
 *
 * This script uploads enriched item metadata to Firebase Firestore.
 * It can be used with the Firebase emulator for testing or with live Firebase.
 *
 * Usage:
 *   node scripts/upload-items-enriched.js [--test] [--verbose] [--batch N]
 *
 * Options:
 *   --test      Use emulator (default: true if FIREBASE_EMULATOR_HOST is set)
 *   --verbose   Print detailed progress
 *   --batch N   Upload N items at a time (default: 50)
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const ITEMS_DIR = path.join(__dirname, '../firebase-assets-enriched/items');
const USE_EMULATOR = process.argv.includes('--test') || !!process.env.FIREBASE_EMULATOR_HOST;
const VERBOSE = process.argv.includes('--verbose');
const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '50', 10);

console.log(`\nFirebase Items Upload Script`);
console.log(`=============================`);
console.log(`Source directory: ${ITEMS_DIR}`);
console.log(`Mode: ${USE_EMULATOR ? 'EMULATOR' : 'LIVE FIREBASE'}`);
console.log(`Batch size: ${BATCH_SIZE}\n`);

// Initialize Firebase
function initializeFirebase() {
  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Initialized with service account');
    } else {
      // Use default credentials (for emulator or deployed environment)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'eyes-of-azrael'
      });
      console.log('Initialized with default credentials');
    }

    if (USE_EMULATOR) {
      const emulatorHost = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
      process.env.FIREBASE_FIRESTORE_EMULATOR_HOST = emulatorHost;
      console.log(`Using Firestore emulator at ${emulatorHost}`);
    }

  } catch (error) {
    console.error(`Error initializing Firebase: ${error.message}`);
    console.error(`\nMake sure:`);
    console.error(`  1. Firebase admin SDK is installed: npm install firebase-admin`);
    console.error(`  2. serviceAccountKey.json exists, or`);
    console.error(`  3. FIREBASE_PROJECT_ID environment variable is set`);
    process.exit(1);
  }

  return admin.firestore();
}

/**
 * Upload batch of items to Firestore
 */
async function uploadBatch(db, items) {
  const batch = db.batch();
  let operations = 0;

  for (const item of items) {
    if (!item.id) {
      console.warn(`Skipping item without ID`);
      continue;
    }

    const docRef = db.collection('items').doc(item.id);
    batch.set(docRef, item, { merge: true });
    operations++;
  }

  if (operations > 0) {
    await batch.commit();
    return operations;
  }

  return 0;
}

/**
 * Main upload function
 */
async function uploadItems() {
  const db = initializeFirebase();

  if (!fs.existsSync(ITEMS_DIR)) {
    console.error(`Error: Items directory not found: ${ITEMS_DIR}`);
    console.error(`\nFirst run: node scripts/enrich-items-metadata.js`);
    process.exit(1);
  }

  const files = fs.readdirSync(ITEMS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`Found ${files.length} enriched items to upload\n`);

  if (files.length === 0) {
    console.error(`Error: No item files found in ${ITEMS_DIR}`);
    process.exit(1);
  }

  let uploadedCount = 0;
  let errorCount = 0;
  let batch = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const content = fs.readFileSync(path.join(ITEMS_DIR, file), 'utf-8');
      const item = JSON.parse(content);

      batch.push(item);

      if (VERBOSE) {
        console.log(`  [${i + 1}/${files.length}] Loaded: ${item.name || item.id}`);
      }

      // Upload when batch is full or at end
      if (batch.length >= BATCH_SIZE || i === files.length - 1) {
        console.log(`\nUploading batch of ${batch.length} items...`);

        const uploaded = await uploadBatch(db, batch);
        uploadedCount += uploaded;

        console.log(`  Uploaded: ${uploaded} items`);

        batch = [];
      }

    } catch (error) {
      errorCount++;
      console.error(`  Error processing ${file}: ${error.message}`);
    }
  }

  // Summary
  console.log(`\n\nUpload Summary`);
  console.log(`==============`);
  console.log(`Total items uploaded: ${uploadedCount}`);
  console.log(`Total errors: ${errorCount}`);
  console.log(`Success rate: ${((uploadedCount / (uploadedCount + errorCount)) * 100).toFixed(1)}%\n`);

  if (errorCount > 0) {
    console.warn(`\nWarning: Some items failed to upload. Review errors above.`);
  } else {
    console.log(`All items uploaded successfully!`);
  }

  // Verify upload
  try {
    const snapshot = await db.collection('items').limit(1).get();
    console.log(`\nVerification: Firestore 'items' collection ${snapshot.size > 0 ? 'contains items' : 'is empty'}`);
  } catch (error) {
    console.error(`\nVerification failed: ${error.message}`);
  }
}

// Run the upload
uploadItems()
  .then(() => {
    console.log(`\nUpload script completed`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`\nFatal error: ${error.message}`);
    process.exit(1);
  });
