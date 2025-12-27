const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eyesofazrael-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log(`\n${'='.repeat(60)}`);
console.log(`  FIREBASE TIMESTAMP FIX SCRIPT`);
console.log(`  Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
console.log(`${'='.repeat(60)}\n`);

async function analyzeFailedAssets() {
  console.log('📊 Analyzing FAILED_ASSETS.json...\n');

  const failedAssetsPath = path.join(__dirname, '..', 'FAILED_ASSETS.json');
  const failedAssets = JSON.parse(fs.readFileSync(failedAssetsPath, 'utf8'));

  // Filter assets with missing timestamp warnings
  const assetsNeedingTimestamps = [];
  const collectionBreakdown = {};

  // Handle both object and array formats
  const assetsArray = Array.isArray(failedAssets) ? failedAssets : Object.values(failedAssets);

  for (const asset of assetsArray) {
    // Check if this asset has timestamp warning
    const hasTimestampWarning = asset.issues?.some(issue =>
      issue.message?.includes('Missing creation timestamp') ||
      issue.message?.includes('Missing createdAt') ||
      issue.message?.includes('Missing created_at')
    );

    if (hasTimestampWarning) {
      const collection = asset.collection || 'unknown';
      const id = asset.id || 'unknown';
      const path = `${collection}/${id}`;

      assetsNeedingTimestamps.push({
        path: path,
        collection: collection,
        id: id,
        data: asset.data,
        issues: asset.issues
      });

      collectionBreakdown[collection] = (collectionBreakdown[collection] || 0) + 1;
    }
  }

  return { assetsNeedingTimestamps, collectionBreakdown };
}

async function fixTimestamps(assets, isDryRun) {
  const stats = {
    total: assets.length,
    updated: 0,
    errors: 0,
    skipped: 0,
    byCollection: {}
  };

  const batchSize = 500;
  const timestamp = new Date().toISOString();
  const firestoreTimestamp = admin.firestore.FieldValue.serverTimestamp();

  console.log(`📝 Processing ${stats.total} assets...\n`);

  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = db.batch();
    const currentBatch = assets.slice(i, Math.min(i + batchSize, assets.length));
    let batchHasUpdates = false;

    console.log(`\nBatch ${Math.floor(i / batchSize) + 1}: Processing documents ${i + 1}-${Math.min(i + batchSize, assets.length)}...`);

    for (const asset of currentBatch) {
      try {
        const docRef = db.doc(asset.path);

        // Check if document exists first
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          console.log(`  ⚠️  Document not found: ${asset.path}`);
          stats.skipped++;
          continue;
        }

        const data = docSnap.data();

        // Check if timestamps are already present
        if (data.createdAt || data.created_at) {
          console.log(`  ℹ️  Root timestamps already exist: ${asset.path}`);
          stats.skipped++;
          continue;
        }

        // Check if metadata.created exists
        let createdTimestamp = timestamp;
        if (data.metadata?.created?._seconds) {
          // Convert Firestore timestamp to ISO string
          const date = new Date(data.metadata.created._seconds * 1000);
          createdTimestamp = date.toISOString();
          console.log(`  ℹ️  Using existing metadata.created timestamp: ${asset.path}`);
        } else if (data._created) {
          createdTimestamp = data._created;
          console.log(`  ℹ️  Using existing _created timestamp: ${asset.path}`);
        }

        // Prepare update data
        const updates = {
          createdAt: createdTimestamp,
          updated_at: timestamp
        };

        // Also ensure metadata has proper timestamps
        if (!data.metadata) {
          updates['metadata.created'] = firestoreTimestamp;
          updates['metadata.updated'] = firestoreTimestamp;
        } else if (!data.metadata.created) {
          updates['metadata.created'] = firestoreTimestamp;
        }

        if (!isDryRun) {
          batch.update(docRef, updates);
          batchHasUpdates = true;
        }

        console.log(`  ✓ ${isDryRun ? '[DRY RUN] Would update' : 'Queued'}: ${asset.path}`);
        stats.updated++;
        stats.byCollection[asset.collection] = (stats.byCollection[asset.collection] || 0) + 1;

      } catch (error) {
        console.error(`  ✗ Error processing ${asset.path}:`, error.message);
        stats.errors++;
      }
    }

    // Commit batch
    if (!isDryRun && batchHasUpdates) {
      try {
        await batch.commit();
        console.log(`  ✓ Batch committed successfully`);
      } catch (error) {
        console.error(`  ✗ Batch commit error:`, error.message);
        stats.errors += currentBatch.length;
      }
    }

    // Add a small delay to avoid rate limiting
    if (i + batchSize < assets.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return stats;
}

function generateReport(stats, collectionBreakdown, isDryRun) {
  const report = [];

  report.push('# AGENT 2: TIMESTAMP FIX REPORT\n');
  report.push(`**Mode:** ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  report.push(`**Date:** ${new Date().toISOString()}\n`);

  report.push('## Summary\n');
  report.push(`- **Total Assets Identified:** ${stats.total}`);
  report.push(`- **Assets Updated:** ${stats.updated}`);
  report.push(`- **Assets Skipped:** ${stats.skipped}`);
  report.push(`- **Errors:** ${stats.errors}\n`);

  report.push('## Breakdown by Collection\n');
  report.push('| Collection | Count |');
  report.push('|------------|-------|');

  const sortedCollections = Object.entries(stats.byCollection || {})
    .sort((a, b) => b[1] - a[1]);

  for (const [collection, count] of sortedCollections) {
    report.push(`| ${collection} | ${count} |`);
  }

  report.push('\n## Original Analysis\n');
  report.push('Assets identified from FAILED_ASSETS.json:\n');
  report.push('| Collection | Count |');
  report.push('|------------|-------|');

  const sortedOriginal = Object.entries(collectionBreakdown)
    .sort((a, b) => b[1] - a[1]);

  for (const [collection, count] of sortedOriginal) {
    report.push(`| ${collection} | ${count} |`);
  }

  if (stats.errors > 0) {
    report.push('\n## Errors\n');
    report.push(`${stats.errors} errors encountered during processing. Check console output for details.\n`);
  }

  if (isDryRun) {
    report.push('\n## Next Steps\n');
    report.push('This was a DRY RUN. To apply changes, run:\n');
    report.push('```bash\n');
    report.push('node scripts/fix-missing-timestamps.js\n');
    report.push('```\n');
  } else {
    report.push('\n## Status\n');
    report.push('✓ Timestamps successfully added to all qualifying assets.\n');
  }

  return report.join('\n');
}

async function main() {
  try {
    // Step 1: Analyze failed assets
    const { assetsNeedingTimestamps, collectionBreakdown } = await analyzeFailedAssets();

    console.log('📊 Analysis Complete:\n');
    console.log(`  Total assets needing timestamps: ${assetsNeedingTimestamps.length}\n`);
    console.log('  Breakdown by collection:');

    const sortedCollections = Object.entries(collectionBreakdown)
      .sort((a, b) => b[1] - a[1]);

    for (const [collection, count] of sortedCollections) {
      console.log(`    ${collection}: ${count}`);
    }

    console.log('');

    if (assetsNeedingTimestamps.length === 0) {
      console.log('✓ No assets need timestamp fixes!\n');
      process.exit(0);
    }

    // Step 2: Fix timestamps
    const stats = await fixTimestamps(assetsNeedingTimestamps, isDryRun);

    // Step 3: Generate report
    console.log(`\n${'='.repeat(60)}`);
    console.log('  GENERATING REPORT');
    console.log(`${'='.repeat(60)}\n`);

    const report = generateReport(stats, collectionBreakdown, isDryRun);
    const reportPath = path.join(__dirname, '..',
      isDryRun ? 'AGENT_2_TIMESTAMP_FIX_DRYRUN.md' : 'AGENT_2_TIMESTAMP_FIX_REPORT.md'
    );

    fs.writeFileSync(reportPath, report);

    console.log(`✓ Report saved to: ${reportPath}\n`);

    // Step 4: Print summary
    console.log(`${'='.repeat(60)}`);
    console.log('  FINAL SUMMARY');
    console.log(`${'='.repeat(60)}\n`);
    console.log(`  Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`  Total Identified: ${stats.total}`);
    console.log(`  Updated: ${stats.updated}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Errors: ${stats.errors}`);
    console.log(`\n${'='.repeat(60)}\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
