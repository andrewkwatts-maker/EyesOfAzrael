/**
 * Upload Theories to Firebase
 *
 * This script uploads the theories from theories-import.json to Firebase Firestore
 * in the 'theories' collection.
 *
 * Usage:
 *   node scripts/upload-theories-to-firebase.js
 *
 * Prerequisites:
 *   - Firebase Admin SDK initialized
 *   - Service account credentials configured
 *   - theories-import.json exists in data/ directory
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
// NOTE: You need to add your service account key JSON file
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../config/serviceAccountKey.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * Upload a single theory to Firestore
 */
async function uploadTheory(theory) {
  try {
    const docRef = db.collection('theories').doc(theory.id);
    await docRef.set({
      ...theory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`✓ Uploaded theory: ${theory.id} - ${theory.name}`);
    return { success: true, id: theory.id };
  } catch (error) {
    console.error(`✗ Failed to upload theory ${theory.id}:`, error.message);
    return { success: false, id: theory.id, error: error.message };
  }
}

/**
 * Main upload function
 */
async function uploadAllTheories() {
  console.log('🚀 Starting theory upload to Firebase...\n');

  // Load theories from JSON file
  const theoriesPath = join(__dirname, '../data/theories-import.json');
  const theoriesData = JSON.parse(readFileSync(theoriesPath, 'utf8'));
  const theories = theoriesData.theories;

  console.log(`📚 Found ${theories.length} theories to upload\n`);

  const results = {
    success: [],
    failed: [],
    total: theories.length
  };

  // Upload each theory
  for (const theory of theories) {
    const result = await uploadTheory(theory);
    if (result.success) {
      results.success.push(result.id);
    } else {
      results.failed.push({ id: result.id, error: result.error });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total theories: ${results.total}`);
  console.log(`✓ Successfully uploaded: ${results.success.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);

  if (results.success.length > 0) {
    console.log('\n✓ Successfully uploaded theories:');
    results.success.forEach(id => console.log(`  - ${id}`));
  }

  if (results.failed.length > 0) {
    console.log('\n✗ Failed theories:');
    results.failed.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`);
    });
  }

  console.log('\n✅ Upload process complete!\n');

  return results;
}

/**
 * Create indexes for efficient queries
 */
async function createIndexes() {
  console.log('📇 Creating Firestore indexes...\n');

  // Note: Composite indexes must be created in Firebase Console or via firebase.json
  // This function documents the required indexes

  const requiredIndexes = [
    {
      collection: 'theories',
      fields: [
        { field: 'status', order: 'ASCENDING' },
        { field: 'submittedDate', order: 'DESCENDING' }
      ]
    },
    {
      collection: 'theories',
      fields: [
        { field: 'primaryMythology', order: 'ASCENDING' },
        { field: 'confidenceScore', order: 'DESCENDING' }
      ]
    },
    {
      collection: 'theories',
      fields: [
        { field: 'mythologies', arrayContains: true },
        { field: 'confidenceScore', order: 'DESCENDING' }
      ]
    }
  ];

  console.log('Required Firestore composite indexes:');
  console.log(JSON.stringify(requiredIndexes, null, 2));
  console.log('\n⚠️  Please create these indexes in Firebase Console:');
  console.log('   Firestore Database → Indexes → Create Index\n');
}

/**
 * Verify upload by reading back from Firestore
 */
async function verifyUpload() {
  console.log('🔍 Verifying upload...\n');

  try {
    const snapshot = await db.collection('theories').get();
    console.log(`✓ Found ${snapshot.size} theories in Firestore`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.name} (${data.primaryMythology})`);
    });

    return true;
  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    return false;
  }
}

// Run the upload
(async () => {
  try {
    await uploadAllTheories();
    await createIndexes();
    await verifyUpload();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
