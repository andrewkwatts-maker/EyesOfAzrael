#!/usr/bin/env node

/**
 * Upload Missing Myths to Firestore
 *
 * Uploads the 9 myths and 1 event that are missing from Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../FIREBASE/firebase-service-account.json');

try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✓ Firebase Admin initialized\n');
} catch (error) {
  console.error('✗ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Upload myths collection
 */
async function uploadMyths() {
  console.log('📤 Uploading myths...\n');

  const mythsFile = path.join(__dirname, '../FIREBASE/parsed_data/myths_parsed.json');

  if (!fs.existsSync(mythsFile)) {
    console.error('✗ myths_parsed.json not found');
    return;
  }

  const data = JSON.parse(fs.readFileSync(mythsFile, 'utf8'));
  const items = data.items || [];

  console.log(`Found ${items.length} myths to upload\n`);

  const batch = db.batch();
  let count = 0;

  for (const item of items) {
    const docRef = db.collection('myths').doc(item.id);

    // Remove metadata field, add timestamps
    const { metadata, ...docData } = item;
    docData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    docData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    batch.set(docRef, docData, { merge: true });
    count++;

    console.log(`  ✓ ${item.id} - ${item.displayName}`);
  }

  await batch.commit();
  console.log(`\n✅ Uploaded ${count} myths\n`);
}

/**
 * Upload ragnarok event
 */
async function uploadRagnarok() {
  console.log('📤 Uploading Ragnarok event...\n');

  const eventsFile = path.join(__dirname, '../FIREBASE/parsed_data/events_parsed.json');

  if (!fs.existsSync(eventsFile)) {
    console.error('✗ events_parsed.json not found');
    return;
  }

  const data = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
  const items = data.items || [];

  // Find ragnarok
  const ragnarok = items.find(item => item.id === 'norse_ragnarok');

  if (!ragnarok) {
    console.error('✗ Ragnarok not found in events_parsed.json');
    return;
  }

  const { metadata, ...docData } = ragnarok;
  docData.createdAt = admin.firestore.FieldValue.serverTimestamp();
  docData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('events').doc(ragnarok.id).set(docData, { merge: true });

  console.log(`  ✓ ${ragnarok.id} - ${ragnarok.displayName}`);
  console.log('\n✅ Uploaded Ragnarok event\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Upload Missing Myths & Events');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await uploadMyths();
    await uploadRagnarok();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ UPLOAD COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Run validation script to verify:');
    console.log('  node scripts/compare-local-vs-firestore.js\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
