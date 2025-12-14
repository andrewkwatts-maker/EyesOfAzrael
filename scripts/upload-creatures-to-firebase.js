#!/usr/bin/env node

/**
 * Firebase Creature Upload Script
 * Uploads creatures to Firebase Firestore with validation and conflict resolution
 *
 * Features:
 * - Validates data against universal template
 * - Handles conflicts (skip, overwrite, or merge)
 * - Batch processing for efficiency
 * - Progress tracking and error handling
 * - Dry-run mode for testing
 */

const fs = require('fs');
const path = require('path');

// Firebase Admin SDK (requires setup)
let admin;
try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('⚠️  Firebase Admin SDK not installed. Install with: npm install firebase-admin');
}

// Configuration
const CONFIG = {
  creaturesFile: path.join(__dirname, '../data/firebase-imports/creatures-supplement.json'),
  migratedFile: path.join(__dirname, '../data/firebase-imports/creatures-migrated.json'),
  serviceAccountKey: path.join(__dirname, '../config/firebase-service-account.json'),
  collectionName: 'creatures',
  batchSize: 500, // Firestore batch limit
  conflictResolution: 'skip', // 'skip', 'overwrite', or 'merge'
  dryRun: false // Set to true to test without uploading
};

/**
 * Load JSON file
 */
function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Initialize Firebase Admin
 */
function initializeFirebase() {
  if (!admin) {
    throw new Error('Firebase Admin SDK not available');
  }

  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.firestore();
    }

    // Load service account
    if (!fs.existsSync(CONFIG.serviceAccountKey)) {
      throw new Error(`Service account key not found: ${CONFIG.serviceAccountKey}`);
    }

    const serviceAccount = require(CONFIG.serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: serviceAccount.databaseURL || `https://${serviceAccount.project_id}.firebaseio.com`
    });

    console.log('✓ Firebase initialized');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    throw error;
  }
}

/**
 * Validate creature data
 */
function validateCreature(creature) {
  const errors = [];

  // Required fields
  if (!creature.id) errors.push('Missing required field: id');
  if (!creature.type) errors.push('Missing required field: type');
  if (!creature.name) errors.push('Missing required field: name');
  if (!creature.mythologies || creature.mythologies.length === 0) {
    errors.push('Missing required field: mythologies');
  }

  // Type validation
  const validTypes = ['item', 'place', 'deity', 'concept', 'archetype', 'magic', 'creature', 'hero'];
  if (creature.type && !validTypes.includes(creature.type)) {
    errors.push(`Invalid type: ${creature.type}`);
  }

  // ID validation (must be kebab-case)
  if (creature.id && !/^[a-z0-9-]+$/.test(creature.id)) {
    errors.push(`Invalid id format (must be kebab-case): ${creature.id}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if creature exists in Firestore
 */
async function creatureExists(db, id) {
  try {
    const doc = await db.collection(CONFIG.collectionName).doc(id).get();
    return doc.exists;
  } catch (error) {
    console.error(`Error checking existence of ${id}:`, error.message);
    return false;
  }
}

/**
 * Upload creatures in batches
 */
async function uploadCreatures(db, creatures) {
  const results = {
    total: creatures.length,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  console.log(`\n📤 Uploading ${creatures.length} creatures...`);

  for (let i = 0; i < creatures.length; i++) {
    const creature = creatures[i];

    try {
      // Validate creature
      const validation = validateCreature(creature);
      if (!validation.valid) {
        console.error(`❌ Validation failed for ${creature.id}:`, validation.errors);
        results.failed++;
        results.errors.push({
          id: creature.id,
          errors: validation.errors
        });
        continue;
      }

      // Check for conflicts
      const exists = await creatureExists(db, creature.id);

      if (exists) {
        if (CONFIG.conflictResolution === 'skip') {
          console.log(`⏭️  Skipping existing creature: ${creature.id}`);
          results.skipped++;
          continue;
        } else if (CONFIG.conflictResolution === 'overwrite') {
          console.log(`🔄 Overwriting existing creature: ${creature.id}`);
        } else if (CONFIG.conflictResolution === 'merge') {
          console.log(`🔀 Merging with existing creature: ${creature.id}`);
          // Get existing data
          const existingDoc = await db.collection(CONFIG.collectionName).doc(creature.id).get();
          const existingData = existingDoc.data();
          // Merge data (new data takes precedence)
          creature = { ...existingData, ...creature };
        }
      }

      // Dry run mode
      if (CONFIG.dryRun) {
        console.log(`🧪 [DRY RUN] Would upload: ${creature.id}`);
        results.uploaded++;
        continue;
      }

      // Upload to Firestore
      await db.collection(CONFIG.collectionName).doc(creature.id).set(creature);
      console.log(`✓ Uploaded: ${creature.id} (${i + 1}/${creatures.length})`);
      results.uploaded++;

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${creatures.length} (${Math.round((i + 1) / creatures.length * 100)}%)`);
      }

    } catch (error) {
      console.error(`❌ Failed to upload ${creature.id}:`, error.message);
      results.failed++;
      results.errors.push({
        id: creature.id,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Main upload function
 */
async function main() {
  console.log('🚀 Firebase Creature Upload Script');
  console.log('=' .repeat(50));

  // Check mode
  if (CONFIG.dryRun) {
    console.log('🧪 DRY RUN MODE - No data will be uploaded\n');
  }

  // Load creatures
  console.log('\n📂 Loading creatures...');

  let creatures = [];

  // Load supplemental creatures
  if (fs.existsSync(CONFIG.creaturesFile)) {
    const supplemental = loadJSON(CONFIG.creaturesFile);
    if (supplemental) {
      creatures = creatures.concat(supplemental);
      console.log(`✓ Loaded ${supplemental.length} supplemental creatures`);
    }
  }

  // Load migrated creatures
  if (fs.existsSync(CONFIG.migratedFile)) {
    const migrated = loadJSON(CONFIG.migratedFile);
    if (migrated) {
      creatures = creatures.concat(migrated);
      console.log(`✓ Loaded ${migrated.length} migrated creatures`);
    }
  }

  if (creatures.length === 0) {
    console.error('❌ No creatures to upload');
    process.exit(1);
  }

  console.log(`\n📊 Total creatures to process: ${creatures.length}`);

  // Initialize Firebase
  console.log('\n🔧 Initializing Firebase...');
  let db;
  try {
    db = initializeFirebase();
  } catch (error) {
    console.error('❌ Firebase initialization failed');
    console.log('\n💡 To use this script:');
    console.log('   1. Install Firebase Admin SDK: npm install firebase-admin');
    console.log('   2. Place your service account key at: config/firebase-service-account.json');
    console.log('   3. Ensure the key has Firestore write permissions');
    process.exit(1);
  }

  // Upload creatures
  const results = await uploadCreatures(db, creatures);

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('📊 Upload Results:');
  console.log(`   Total: ${results.total}`);
  console.log(`   ✓ Uploaded: ${results.uploaded}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   ${err.id}: ${err.error || err.errors.join(', ')}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n✅ Upload completed successfully!');
  } else {
    console.log('\n⚠️  Upload completed with errors');
    process.exit(1);
  }
}

// Run upload
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { uploadCreatures, validateCreature };
