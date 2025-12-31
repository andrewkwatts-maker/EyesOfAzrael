#!/usr/bin/env node

/**
 * Fix Cosmology Entity Types
 *
 * Problem: 30 entities in the 'cosmology' collection have incorrect type values.
 *          They have `type: 'concept'` or `type: 'place'` but should have `type: 'cosmology'`.
 *
 * Solution: Update each entity's type field to 'cosmology' in Firebase.
 *
 * Usage:
 *   node scripts/fix-cosmology-types.js --dry-run    # Preview changes without modifying Firebase
 *   node scripts/fix-cosmology-types.js --update     # Apply changes to Firebase
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with the specific service account
const serviceAccountPath = path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Entity IDs that need to be fixed
const ENTITY_IDS_TO_FIX = [
  'babylonian_afterlife',
  'babylonian_creation',
  'buddhist_afterlife',
  'buddhist_creation',
  'buddhist_potala_palace',  // has type: 'place'
  'chinese_afterlife',
  'chinese_creation',
  'christian_afterlife',
  'christian_creation',
  'creation-amp-origins',
  'death-amp-the-afterlife',
  'egyptian_afterlife',
  'egyptian_creation',
  'egyptian_creation-myths',
  'greek_afterlife',
  'greek_creation',
  'hindu_afterlife',
  'hindu_creation',
  'islamic_afterlife',
  'islamic_creation',
  'norse_afterlife',
  'norse_creation',
  'persian_afterlife',
  'persian_creation',
  'roman_afterlife',
  'roman_creation',
  'sumerian_afterlife',
  'sumerian_creation',
  'tarot_afterlife',
  'tarot_creation'
];

const COLLECTION_NAME = 'cosmology';
const CORRECT_TYPE = 'cosmology';

// Local backup directory
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'cosmology');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'cosmology-type-fix');
const DIFF_FILE = path.join(BACKUP_DIR, 'type-fix-diff.json');

/**
 * Read local backup file for an entity
 */
function readLocalBackup(entityId) {
  const localPath = path.join(LOCAL_DATA_DIR, `${entityId}.json`);
  if (fs.existsSync(localPath)) {
    try {
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (error) {
      console.error(`  Warning: Could not read local file for ${entityId}: ${error.message}`);
      return null;
    }
  }
  return null;
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Fetch current entity data from Firebase
 */
async function fetchEntityFromFirebase(entityId) {
  try {
    const docRef = db.collection(COLLECTION_NAME).doc(entityId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { exists: false, id: entityId };
    }

    return {
      exists: true,
      id: entityId,
      data: doc.data()
    };
  } catch (error) {
    return {
      exists: false,
      id: entityId,
      error: error.message
    };
  }
}

/**
 * Update entity type in Firebase
 */
async function updateEntityType(entityId) {
  try {
    const docRef = db.collection(COLLECTION_NAME).doc(entityId);
    await docRef.update({
      type: CORRECT_TYPE,
      'metadata.typeFixedAt': new Date().toISOString(),
      'metadata.typeFixedBy': 'fix-cosmology-types.js'
    });
    return { success: true, id: entityId };
  } catch (error) {
    return { success: false, id: entityId, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const doUpdate = args.includes('--update');

  if (!dryRun && !doUpdate) {
    console.log('Usage:');
    console.log('  node scripts/fix-cosmology-types.js --dry-run    # Preview changes');
    console.log('  node scripts/fix-cosmology-types.js --update     # Apply changes to Firebase');
    process.exit(0);
  }

  console.log('='.repeat(80));
  console.log('FIX COSMOLOGY ENTITY TYPES');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'UPDATE MODE'}`);
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Entities to fix: ${ENTITY_IDS_TO_FIX.length}`);
  console.log(`Target type: ${CORRECT_TYPE}`);
  console.log('='.repeat(80));
  console.log('');

  // Ensure backup directory exists
  ensureBackupDir();

  const results = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'update',
    collection: COLLECTION_NAME,
    targetType: CORRECT_TYPE,
    entities: [],
    summary: {
      total: ENTITY_IDS_TO_FIX.length,
      needsFix: 0,
      alreadyCorrect: 0,
      notFound: 0,
      updated: 0,
      errors: 0
    }
  };

  console.log('Step 1: Reading local backup data and fetching current Firebase state...\n');

  // Process each entity
  for (const entityId of ENTITY_IDS_TO_FIX) {
    const entityResult = {
      id: entityId,
      localBackup: null,
      firebaseState: null,
      action: null,
      updateResult: null
    };

    // Read local backup
    const localData = readLocalBackup(entityId);
    if (localData) {
      entityResult.localBackup = {
        type: localData.type,
        name: localData.name || localData.displayName
      };
    }

    // Fetch from Firebase
    const firebaseResult = await fetchEntityFromFirebase(entityId);

    if (!firebaseResult.exists) {
      entityResult.firebaseState = { exists: false, error: firebaseResult.error };
      entityResult.action = 'NOT_FOUND';
      results.summary.notFound++;
      console.log(`  [NOT FOUND] ${entityId}`);
      if (firebaseResult.error) {
        console.log(`              Error: ${firebaseResult.error}`);
      }
    } else {
      const currentType = firebaseResult.data.type;
      entityResult.firebaseState = {
        exists: true,
        currentType: currentType,
        name: firebaseResult.data.name || firebaseResult.data.displayName
      };

      if (currentType === CORRECT_TYPE) {
        entityResult.action = 'ALREADY_CORRECT';
        results.summary.alreadyCorrect++;
        console.log(`  [OK] ${entityId} - already has type: '${currentType}'`);
      } else {
        entityResult.action = 'NEEDS_FIX';
        entityResult.before = currentType;
        entityResult.after = CORRECT_TYPE;
        results.summary.needsFix++;
        console.log(`  [FIX] ${entityId}`);
        console.log(`        Before: type = '${currentType}'`);
        console.log(`        After:  type = '${CORRECT_TYPE}'`);

        // Apply update if not dry run
        if (!dryRun) {
          const updateResult = await updateEntityType(entityId);
          entityResult.updateResult = updateResult;

          if (updateResult.success) {
            results.summary.updated++;
            console.log(`        Status: UPDATED`);
          } else {
            results.summary.errors++;
            console.log(`        Status: ERROR - ${updateResult.error}`);
          }
        }
      }
    }

    results.entities.push(entityResult);
  }

  // Save diff report
  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Saving diff report...\n');

  fs.writeFileSync(DIFF_FILE, JSON.stringify(results, null, 2));
  console.log(`Diff report saved to: ${DIFF_FILE}`);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total entities processed:  ${results.summary.total}`);
  console.log(`Needed fix:                ${results.summary.needsFix}`);
  console.log(`Already correct:           ${results.summary.alreadyCorrect}`);
  console.log(`Not found in Firebase:     ${results.summary.notFound}`);

  if (!dryRun) {
    console.log(`Successfully updated:      ${results.summary.updated}`);
    console.log(`Errors:                    ${results.summary.errors}`);
  }

  console.log('='.repeat(80));

  if (dryRun && results.summary.needsFix > 0) {
    console.log(`\nTo apply these changes, run:`);
    console.log(`  node scripts/fix-cosmology-types.js --update`);
  }

  if (!dryRun && results.summary.updated > 0) {
    console.log(`\nSuccessfully updated ${results.summary.updated} entities in Firebase!`);
  }

  // Print diff table for entities that need/got fixed
  const entitiesNeedingFix = results.entities.filter(e => e.action === 'NEEDS_FIX');
  if (entitiesNeedingFix.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('DIFF TABLE');
    console.log('='.repeat(80));
    console.log('| Entity ID                      | Before    | After     | Status          |');
    console.log('|--------------------------------|-----------|-----------|-----------------|');

    for (const entity of entitiesNeedingFix) {
      const id = entity.id.padEnd(30);
      const before = (entity.before || 'N/A').padEnd(9);
      const after = entity.after.padEnd(9);
      let status = 'pending';
      if (!dryRun) {
        status = entity.updateResult?.success ? 'UPDATED' : 'ERROR';
      }
      console.log(`| ${id} | ${before} | ${after} | ${status.padEnd(15)} |`);
    }
    console.log('='.repeat(80));
  }

  process.exit(results.summary.errors > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
