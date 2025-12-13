#!/usr/bin/env node
/**
 * Magic Systems Firebase Upload Script
 * Uploads magic system data to Firestore
 *
 * Usage: node scripts/upload-magic-to-firebase.js
 */

const firebase = require('firebase/app');
require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Import Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw",
  authDomain: "eyesofazrael.firebaseapp.com",
  projectId: "eyesofazrael",
  storageBucket: "eyesofazrael.firebasestorage.app",
  messagingSenderId: "533894778090",
  appId: "1:533894778090:web:35b48ba34421b385569b93",
  measurementId: "G-ECC98XJ9W9"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

/**
 * Upload magic systems to Firestore in batches
 */
async function uploadMagicSystems() {
  try {
    logSection('MAGIC SYSTEMS FIREBASE UPLOAD');

    // Load import data
    const importPath = path.join(__dirname, '../data/firebase-imports/magic-systems-import.json');
    log(`\n📂 Loading data from: ${importPath}`, 'cyan');

    if (!fs.existsSync(importPath)) {
      throw new Error(`Import file not found: ${importPath}`);
    }

    const importData = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    const { systems, collection } = importData;

    log(`✅ Loaded ${systems.length} magic systems`, 'green');
    log(`📊 Target collection: ${collection}`, 'blue');

    // Organize by category
    const byCategory = systems.reduce((acc, system) => {
      const cat = system.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(system);
      return acc;
    }, {});

    log(`\n📋 Systems by category:`, 'cyan');
    Object.entries(byCategory).forEach(([cat, items]) => {
      log(`   ${cat}: ${items.length} systems`, 'yellow');
    });

    // Confirm upload
    log(`\n⚠️  This will upload ${systems.length} documents to Firestore`, 'yellow');
    log(`   Collection: ${collection}`, 'yellow');
    log(`   This may overwrite existing data!`, 'red');

    // Batch upload (Firestore limit: 500 operations per batch)
    const BATCH_SIZE = 500;
    let uploaded = 0;
    let failed = 0;
    const errors = [];

    logSection('UPLOAD PROGRESS');

    for (let i = 0; i < systems.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = systems.slice(i, i + BATCH_SIZE);

      log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: Processing ${chunk.length} systems...`, 'cyan');

      chunk.forEach((system) => {
        try {
          const docRef = db.collection(collection).doc(system.id);

          // Add metadata
          const systemData = {
            ...system,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            version: '1.0.0'
          };

          batch.set(docRef, systemData, { merge: true });
          log(`   ✓ Queued: ${system.id} (${system.name})`, 'green');

        } catch (error) {
          log(`   ✗ Error queuing ${system.id}: ${error.message}`, 'red');
          errors.push({ id: system.id, error: error.message });
          failed++;
        }
      });

      // Commit batch
      try {
        await batch.commit();
        uploaded += chunk.length;
        log(`✅ Batch committed: ${chunk.length} systems uploaded`, 'green');
      } catch (error) {
        log(`❌ Batch commit failed: ${error.message}`, 'red');
        failed += chunk.length;
        errors.push({ batch: i / BATCH_SIZE + 1, error: error.message });
      }

      // Rate limiting pause
      if (i + BATCH_SIZE < systems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Create indexes collection
    logSection('CREATING SEARCH INDEXES');

    const indexesRef = db.collection('magic-systems-indexes');

    // Category index
    const categoryIndex = {};
    byCategory.forEach((items, category) => {
      categoryIndex[category] = items.map(s => s.id);
    });

    await indexesRef.doc('by-category').set(categoryIndex);
    log('✅ Created category index', 'green');

    // Mythology index
    const mythologyIndex = {};
    systems.forEach(system => {
      (system.mythologies || []).forEach(myth => {
        if (!mythologyIndex[myth]) mythologyIndex[myth] = [];
        mythologyIndex[myth].push(system.id);
      });
    });

    await indexesRef.doc('by-mythology').set(mythologyIndex);
    log('✅ Created mythology index', 'green');

    // Tradition index
    const traditionIndex = {};
    systems.forEach(system => {
      const tradition = system.tradition || 'unknown';
      if (!traditionIndex[tradition]) traditionIndex[tradition] = [];
      traditionIndex[tradition].push(system.id);
    });

    await indexesRef.doc('by-tradition').set(traditionIndex);
    log('✅ Created tradition index', 'green');

    // Summary
    logSection('UPLOAD SUMMARY');
    log(`✅ Successfully uploaded: ${uploaded} systems`, 'green');
    if (failed > 0) {
      log(`❌ Failed: ${failed} systems`, 'red');
      log(`\nErrors:`, 'red');
      errors.forEach(err => {
        console.log(err);
      });
    }

    log(`\n📊 Total documents in Firestore:`, 'cyan');
    log(`   Collection: ${collection}`, 'blue');
    log(`   Documents: ${uploaded}`, 'green');
    log(`   Indexes: 3 (category, mythology, tradition)`, 'green');

    logSection('VERIFICATION');

    // Query to verify
    const snapshot = await db.collection(collection).limit(5).get();
    log(`\n📋 Sample documents (first 5):`, 'cyan');
    snapshot.forEach(doc => {
      const data = doc.data();
      log(`   ${doc.id}: ${data.name} (${data.category})`, 'yellow');
    });

    log(`\n✅ Upload complete! ${uploaded} magic systems are now in Firebase`, 'bright');

  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Verify upload by querying Firestore
 */
async function verifyUpload() {
  logSection('VERIFICATION QUERIES');

  try {
    // Count total documents
    const allDocs = await db.collection('magic-systems').get();
    log(`\n📊 Total magic systems: ${allDocs.size}`, 'cyan');

    // Query by category
    log(`\n🔍 Testing category queries:`, 'cyan');
    const categories = ['divination', 'energy', 'ritual', 'texts'];

    for (const category of categories) {
      const snapshot = await db.collection('magic-systems')
        .where('category', '==', category)
        .get();
      log(`   ${category}: ${snapshot.size} systems`, 'yellow');
    }

    // Query by mythology
    log(`\n🔍 Testing mythology queries:`, 'cyan');
    const mythologies = ['hermetic', 'chinese', 'hindu', 'norse'];

    for (const mythology of mythologies) {
      const snapshot = await db.collection('magic-systems')
        .where('mythologies', 'array-contains', mythology)
        .get();
      log(`   ${mythology}: ${snapshot.size} systems`, 'yellow');
    }

    // Test search
    log(`\n🔍 Testing text search (by tags):`, 'cyan');
    const searchTerms = ['tarot', 'energy-healing', 'divination'];

    for (const term of searchTerms) {
      const snapshot = await db.collection('magic-systems')
        .where('tags', 'array-contains', term)
        .get();
      log(`   "${term}": ${snapshot.size} results`, 'yellow');
    }

    log(`\n✅ All verification queries successful!`, 'green');

  } catch (error) {
    log(`\n❌ Verification failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Main execution
(async () => {
  try {
    await uploadMagicSystems();
    await verifyUpload();

    log(`\n${'='.repeat(70)}`, 'bright');
    log(`✅ MIGRATION COMPLETE`, 'bright');
    log(`${'='.repeat(70)}\n`, 'bright');

    process.exit(0);

  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
})();
