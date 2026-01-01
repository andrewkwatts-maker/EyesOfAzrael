#!/usr/bin/env node

/**
 * Firebase Deity Metadata Upload Script
 *
 * This script uploads enriched deity metadata to Firebase Firestore.
 * Requires Firebase credentials via environment variable or local config.
 *
 * Usage:
 *   FIREBASE_CREDENTIALS=./credentials.json node upload-deity-metadata-firebase.js
 *   Or configure with FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const CONFIG = {
  collection: 'deities',
  targetMythologies: ['greek', 'norse', 'egyptian'],
  batchSize: 100,
  dryRun: process.env.DRY_RUN === 'true'
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Try to load credentials from environment
    const credentialsPath = process.env.FIREBASE_CREDENTIALS;

    if (credentialsPath && fs.existsSync(credentialsPath)) {
      const serviceAccount = require(path.resolve(credentialsPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('✓ Firebase initialized with service account credentials\n');
    } else {
      // Fall back to application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✓ Firebase initialized with application default credentials\n');
    }

    return admin.firestore();
  } catch (error) {
    console.error('✗ Firebase initialization failed:');
    console.error(error.message);
    console.error('\nMake sure to set FIREBASE_CREDENTIALS or use Application Default Credentials');
    process.exit(1);
  }
}

/**
 * Load deity files from local directory
 */
function loadDeityFiles(dirPath) {
  const deities = [];

  try {
    const files = fs.readdirSync(dirPath);
    const deityFiles = files.filter(f =>
      f.endsWith('.json') &&
      f !== '_all.json' &&
      !f.includes('_detailed')
    );

    deityFiles.forEach(file => {
      try {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Filter by mythology type
        if (data.type === 'deity' && CONFIG.targetMythologies.includes(data.mythology)) {
          deities.push({
            id: data.id || file.replace('.json', ''),
            data: data
          });
        }
      } catch (error) {
        console.warn(`  Warning: Could not parse ${file}: ${error.message}`);
      }
    });

    return deities;
  } catch (error) {
    console.error(`Error reading deity directory: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract metadata fields for Firebase update
 */
function extractMetadata(deityData) {
  return {
    symbolism: deityData.symbolism || [],
    domains: deityData.domains || [],
    aliases: deityData.aliases || [],
    festivals: deityData.festivals || [],
    epithets: deityData.epithets || [],
    attributes: deityData.attributes || [],
    iconography: deityData.iconography || '',
    sacred_sites: deityData.sacred_sites || [],
    metadata: {
      ...(deityData.metadata || {}),
      enrichment_type: 'metadata_enrichment',
      enriched_at: new Date().toISOString(),
      uploaded_by: 'upload-deity-metadata-firebase-script'
    }
  };
}

/**
 * Upload deities to Firebase Firestore
 */
async function uploadDeities(db, deities) {
  const results = {
    total: deities.length,
    uploaded: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  console.log(`Preparing to upload ${deities.length} deities...\n`);

  if (CONFIG.dryRun) {
    console.log('DRY RUN MODE - No changes will be made to Firebase\n');
  }

  // Process in batches
  for (let i = 0; i < deities.length; i += CONFIG.batchSize) {
    const batch = deities.slice(i, i + CONFIG.batchSize);

    console.log(`Processing batch ${Math.floor(i / CONFIG.batchSize) + 1}...`);

    for (const deity of batch) {
      try {
        const metadata = extractMetadata(deity.data);

        const displayName = deity.data.name ||
          deity.data.displayName ||
          deity.data.title ||
          deity.id;

        if (!CONFIG.dryRun) {
          // Upload to Firebase
          await db.collection(CONFIG.collection)
            .doc(deity.id)
            .update(metadata);

          results.uploaded++;
          console.log(`  ✓ ${displayName} (${deity.data.mythology})`);
        } else {
          console.log(`  [DRY RUN] ${displayName} (${deity.data.mythology})`);
          results.uploaded++;
        }

        results.details.push({
          id: deity.id,
          name: displayName,
          mythology: deity.data.mythology,
          status: 'uploaded',
          metadata_fields: Object.keys(metadata).length
        });

      } catch (error) {
        results.errors++;
        console.error(`  ✗ Error uploading ${deity.id}: ${error.message}`);

        results.details.push({
          id: deity.id,
          status: 'error',
          error: error.message
        });
      }
    }
  }

  return results;
}

/**
 * Generate upload report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('FIREBASE DEITY METADATA UPLOAD REPORT');
  console.log('='.repeat(80) + '\n');

  console.log(`Total Deities: ${results.total}`);
  console.log(`Successfully Uploaded: ${results.uploaded}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Errors: ${results.errors}\n`);

  if (results.details.length > 0) {
    const successCount = results.details.filter(d => d.status === 'uploaded').length;
    const errorCount = results.details.filter(d => d.status === 'error').length;

    if (successCount > 0) {
      console.log('Successfully Updated Deities:');
      console.log('-'.repeat(80));
      results.details
        .filter(d => d.status === 'uploaded')
        .forEach(detail => {
          console.log(`  ${detail.name.padEnd(35)} | ${detail.mythology.padEnd(12)} | ${detail.metadata_fields} metadata fields`);
        });
    }

    if (errorCount > 0) {
      console.log('\nErrors:');
      console.log('-'.repeat(80));
      results.details
        .filter(d => d.status === 'error')
        .forEach(detail => {
          console.log(`  ${detail.id.padEnd(35)} | ${detail.error}`);
        });
    }
  }

  console.log('\n' + '='.repeat(80));
  if (CONFIG.dryRun) {
    console.log('Dry run complete. Re-run without DRY_RUN=true to upload to Firebase.');
  } else {
    console.log('Upload complete! Deities have been updated in Firebase.');
  }
  console.log('='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('Firebase Deity Metadata Upload\n');
  console.log('Configuration:');
  console.log(`  Collection: ${CONFIG.collection}`);
  console.log(`  Target Mythologies: ${CONFIG.targetMythologies.join(', ')}`);
  console.log(`  Dry Run: ${CONFIG.dryRun}\n`);

  // Initialize Firebase
  const db = initializeFirebase();

  // Load deity files
  const deityDir = path.join(__dirname, '../firebase-assets-downloaded/deities');
  console.log(`Loading deities from: ${deityDir}\n`);

  const deities = loadDeityFiles(deityDir);
  console.log(`Loaded ${deities.length} deities for upload\n`);

  if (deities.length === 0) {
    console.log('No deities found to upload.');
    process.exit(0);
  }

  // Upload to Firebase
  const results = await uploadDeities(db, deities);
  generateReport(results);

  // Close Firebase connection
  await admin.app().delete();

  process.exit(results.errors === 0 ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  uploadDeities,
  initializeFirebase,
  extractMetadata
};
