#!/usr/bin/env node

/**
 * Batch Update Firebase Metadata
 *
 * Reads enriched metadata from a JSON file and batch updates Firebase.
 * Use this script to apply changes from the enrichment report.
 *
 * Usage:
 *   node scripts/batch-update-firebase-metadata.js <report-file.json> [--dry-run]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REPORT_FILE = args.find(a => !a.startsWith('--'));

if (!REPORT_FILE) {
  console.error('Error: Report file required');
  console.error('Usage: node scripts/batch-update-firebase-metadata.js <report-file.json> [--dry-run]');
  process.exit(1);
}

const reportPath = path.isAbsolute(REPORT_FILE)
  ? REPORT_FILE
  : path.join(process.cwd(), REPORT_FILE);

if (!fs.existsSync(reportPath)) {
  console.error(`Error: Report file not found: ${reportPath}`);
  process.exit(1);
}

console.log('Batch Update Firebase Metadata');
console.log('Mode:', DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will update Firebase)');
console.log('Source:', reportPath);
console.log('');

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// ============================================================================
// BATCH UPDATE LOGIC
// ============================================================================

/**
 * Apply updates in batches of 500 (Firestore limit)
 */
async function batchUpdate(collection, updates) {
  console.log(`\nUpdating ${collection}: ${updates.length} documents`);

  if (DRY_RUN) {
    console.log('  (Dry run - no changes will be made)');
    return { updated: 0, skipped: updates.length };
  }

  const BATCH_SIZE = 500;
  let updated = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = updates.slice(i, i + BATCH_SIZE);

    for (const update of chunk) {
      const docRef = db.collection(collection).doc(update.id);
      batch.update(docRef, update.data);
    }

    try {
      await batch.commit();
      updated += chunk.length;
      console.log(`  Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${chunk.length} documents updated`);
    } catch (error) {
      console.error(`  Batch ${Math.floor(i/BATCH_SIZE) + 1} failed:`, error.message);
    }
  }

  return { updated, skipped: 0 };
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('BATCH UPDATE FROM REPORT');
  console.log('='.repeat(80));
  console.log('');

  // Load report
  let report;
  try {
    const reportData = fs.readFileSync(reportPath, 'utf-8');
    report = JSON.parse(reportData);
  } catch (error) {
    console.error('Error reading report file:', error.message);
    process.exit(1);
  }

  if (!report.collections || !Array.isArray(report.collections)) {
    console.error('Error: Invalid report format (missing collections array)');
    process.exit(1);
  }

  console.log(`Loaded report from: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`Collections: ${report.collections.length}`);
  console.log('');

  const startTime = Date.now();
  const results = [];

  for (const collectionData of report.collections) {
    if (collectionData.success === false) {
      console.log(`Skipping ${collectionData.collection} (error in report)`);
      continue;
    }

    if (!collectionData.assets || !Array.isArray(collectionData.assets)) {
      console.log(`Skipping ${collectionData.collection} (no assets)`);
      continue;
    }

    // Prepare updates
    const updates = collectionData.assets.map(asset => ({
      id: asset.id,
      data: {
        importance: asset.importance,
        completeness_score: asset.completeness,
        featured: asset.featured,
        tags: asset.tags || [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }));

    const result = await batchUpdate(collectionData.collection, updates);
    results.push({
      collection: collectionData.collection,
      ...result
    });
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);

  console.log('\n' + '='.repeat(80));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Duration: ${duration}s`);
  console.log(`Total Updated: ${totalUpdated}`);
  console.log('');

  console.log('Collection Breakdown:');
  results.forEach(r => {
    console.log(`  ${r.collection.padEnd(20)} ${r.updated.toString().padStart(4)} updated`);
  });

  console.log('='.repeat(80));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No changes were made');
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('\n✓ Batch update complete!');
  }

  console.log('');
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
