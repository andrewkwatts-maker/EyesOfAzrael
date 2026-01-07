#!/usr/bin/env node

/**
 * Firebase Creatures Upload Script
 *
 * Uploads enriched creature metadata from local JSON files to Firebase Firestore.
 * This script reads from the firebase-assets-downloaded/creatures/ directory
 * and uploads each creature document with all enriched metadata fields.
 *
 * Usage:
 *   node scripts/upload-creatures-enriched-to-firebase.js [--dry-run] [--filter=pattern]
 *
 * Options:
 *   --dry-run      : Preview uploads without modifying Firebase
 *   --filter=name  : Only upload creatures matching the pattern (e.g., --filter=greek)
 *   --batch-size=N : Set batch size (default: 100, max: 500)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FILTER = args.find(a => a.startsWith('--filter='))?.split('=')[1];
const BATCH_SIZE = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '100', 10);

const CREATURES_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'creatures');
const SERVICE_ACCOUNT = path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

console.log('Firebase Creatures Upload Script');
console.log('================================');
console.log('Mode:', DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE (will update Firebase)');
if (FILTER) console.log('Filter:', `Only uploading creatures matching: ${FILTER}`);
console.log('Batch Size:', BATCH_SIZE);
console.log('');

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT)) {
      throw new Error(`Service account file not found: ${SERVICE_ACCOUNT}`);
    }

    const serviceAccount = require(SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'eyesofazrael'
    });

    console.log('✓ Firebase initialized successfully\n');
    return admin.firestore();

  } catch (error) {
    console.error('✗ Firebase initialization failed:');
    console.error('  ', error.message);
    console.error('\nMake sure:');
    console.error('  1. Service account JSON file exists');
    console.error('  2. Firebase project is configured correctly');
    process.exit(1);
  }
}

// ============================================================================
// FILE LOADING & VALIDATION
// ============================================================================

/**
 * Load all creature JSON files from the creatures directory
 */
function loadCreatureFiles() {
  if (!fs.existsSync(CREATURES_DIR)) {
    console.error(`✗ Creatures directory not found: ${CREATURES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CREATURES_DIR)
    .filter(f => f.endsWith('.json') && f !== '_all.json')
    .sort();

  const creatures = [];
  const errors = [];

  for (const file of files) {
    try {
      // Apply filter if specified
      if (FILTER && !file.includes(FILTER)) {
        continue;
      }

      const filePath = path.join(CREATURES_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.id) {
        data.id = file.replace('.json', '');
      }

      creatures.push({
        file,
        id: data.id,
        data,
        size: JSON.stringify(data).length
      });

    } catch (error) {
      errors.push({
        file,
        error: error.message
      });
    }
  }

  return { creatures, errors };
}

/**
 * Validate creature data before upload
 */
function validateCreature(creature) {
  const issues = [];

  // Required fields
  if (!creature.data.id) issues.push('Missing id');
  if (!creature.data.type) issues.push('Missing type');
  if (!creature.data.mythology) issues.push('Missing mythology');
  if (!creature.data.name && !creature.data.displayName) issues.push('Missing name/displayName');

  // At least some enriched fields
  const hasEnrichment =
    (creature.data.abilities && creature.data.abilities.length > 0) ||
    (creature.data.weaknesses && creature.data.weaknesses.length > 0) ||
    (creature.data.habitat && creature.data.habitat.length > 0) ||
    (creature.data.behavior && creature.data.behavior.length > 0);

  if (!hasEnrichment) {
    issues.push('No enrichment metadata found');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// ============================================================================
// FIREBASE UPLOAD
// ============================================================================

/**
 * Upload creatures to Firebase in batches
 */
async function uploadToFirebase(db, creatures) {
  console.log(`Uploading ${creatures.length} creatures to Firebase...\n`);

  const stats = {
    total: creatures.length,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    batches: 0,
    errors: []
  };

  // Process in batches
  const batches = [];
  let currentBatch = null;
  let batchSize = 0;

  for (let i = 0; i < creatures.length; i++) {
    const creature = creatures[i];

    // Start new batch
    if (!currentBatch || batchSize >= BATCH_SIZE) {
      if (currentBatch) {
        batches.push(currentBatch);
      }
      currentBatch = db.batch();
      batchSize = 0;
      stats.batches++;
    }

    // Validate creature
    const validation = validateCreature(creature);
    if (!validation.isValid) {
      stats.skipped++;
      stats.errors.push({
        id: creature.id,
        file: creature.file,
        issues: validation.issues
      });
      continue;
    }

    // Add to batch
    try {
      const docRef = db.collection('creatures').doc(creature.id);

      // Prepare data with enrichment metadata
      const uploadData = {
        ...creature.data,
        metadata: {
          ...(creature.data.metadata || {}),
          uploadedAt: admin.firestore.Timestamp.now(),
          uploadedVia: 'upload-creatures-enriched-to-firebase.js'
        }
      };

      currentBatch.set(docRef, uploadData, { merge: true });
      batchSize++;
      stats.uploaded++;

    } catch (error) {
      stats.failed++;
      stats.errors.push({
        id: creature.id,
        file: creature.file,
        error: error.message
      });
    }
  }

  // Final batch
  if (currentBatch && batchSize > 0) {
    batches.push(currentBatch);
  }

  // Commit batches
  if (!DRY_RUN && batches.length > 0) {
    console.log(`Committing ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit();
        console.log(`  ✓ Batch ${i + 1}/${batches.length} committed`);
      } catch (error) {
        console.error(`  ✗ Batch ${i + 1} failed: ${error.message}`);
        stats.failed++;
      }
    }
  }

  return stats;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate upload report
 */
function generateReport(loadStats, uploadStats) {
  const report = {
    timestamp: new Date().toISOString(),
    mode: DRY_RUN ? 'dry-run' : 'live',
    filter: FILTER || 'none',
    batchSize: BATCH_SIZE,
    loading: {
      total: loadStats.creatures.length,
      errors: loadStats.errors.length,
      errorDetails: loadStats.errors.slice(0, 5)
    },
    upload: uploadStats,
    summary: {
      attempted: uploadStats.total,
      uploaded: uploadStats.uploaded,
      failed: uploadStats.failed,
      skipped: uploadStats.skipped,
      batches: uploadStats.batches,
      success: uploadStats.failed === 0 && uploadStats.skipped === 0
    }
  };

  return report;
}

/**
 * Display upload summary
 */
function displaySummary(stats, loadErrors) {
  console.log('\n' + '='.repeat(80));
  console.log('UPLOAD SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('Statistics:');
  console.log(`  Total creatures: ${stats.total}`);
  console.log(`  Successfully uploaded: ${stats.uploaded}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Skipped (validation): ${stats.skipped}`);
  console.log(`  Batches: ${stats.batches}`);

  if (loadErrors.length > 0) {
    console.log(`\nFile Loading Errors: ${loadErrors.length}`);
    loadErrors.slice(0, 3).forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }

  if (stats.errors.length > 0) {
    console.log(`\nValidation/Upload Issues: ${stats.errors.length}`);
    stats.errors.slice(0, 3).forEach(err => {
      if (err.issues) {
        console.log(`  - ${err.id}: ${err.issues.join(', ')}`);
      } else {
        console.log(`  - ${err.id}: ${err.error}`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN - No changes were made to Firebase');
    console.log('Run without --dry-run to upload changes');
  } else {
    if (stats.failed === 0 && stats.skipped === 0) {
      console.log('✓ All creatures uploaded successfully!');
    } else {
      console.log('⚠️  Some creatures had issues - see details above');
    }
  }

  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');

  // Load creature files
  console.log('Loading creature files...');
  const loadResult = loadCreatureFiles();
  console.log(`✓ Loaded ${loadResult.creatures.length} creature files`);

  if (loadResult.errors.length > 0) {
    console.log(`⚠️  ${loadResult.errors.length} files had errors`);
  }

  if (loadResult.creatures.length === 0) {
    console.error('No creatures to upload!');
    process.exit(0);
  }

  console.log('');

  // Initialize Firebase
  const db = initializeFirebase();

  // Upload to Firebase
  const uploadStats = await uploadToFirebase(db, loadResult.creatures);

  // Generate and display report
  displaySummary(uploadStats, loadResult.errors);

  // Save detailed report
  const report = generateReport(loadResult, uploadStats);
  const reportPath = path.join(__dirname, '..', 'CREATURES_UPLOAD_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${reportPath}\n`);

  // Cleanup
  await admin.app().delete();

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
