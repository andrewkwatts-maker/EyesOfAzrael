#!/usr/bin/env node

/**
 * CELTIC DUPLICATES CLEANUP SCRIPT
 *
 * This script removes duplicate Celtic entities, keeping only the
 * high-quality polished versions.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// IDs to remove (duplicates with "celtic_" prefix)
const duplicatesToRemove = {
  deities: [
    'celtic_aengus',
    'celtic_brigid',
    'celtic_cernunnos',
    'celtic_dagda',
    'celtic_danu',
    'celtic_lugh',
    'celtic_manannan',
    'celtic_morrigan',
    'celtic_nuada',
    'celtic_ogma'
  ],
  cosmology: [
    'celtic-afterlife',
    'celtic-creation',
    'celtic_afterlife',
    'celtic_creation'
  ]
};

async function removeDuplicates() {
  console.log('🧹 CLEANING UP CELTIC DUPLICATES');
  console.log('='.repeat(80));

  let totalRemoved = 0;

  for (const [collection, ids] of Object.entries(duplicatesToRemove)) {
    console.log(`\n📂 Processing ${collection}...`);

    for (const id of ids) {
      try {
        const docRef = db.collection(collection).doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
          await docRef.delete();
          console.log(`  ✅ Removed ${id}`);
          totalRemoved++;
        } else {
          console.log(`  ℹ️  ${id} already removed`);
        }
      } catch (error) {
        console.error(`  ❌ Error removing ${id}:`, error.message);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ CLEANUP COMPLETE`);
  console.log(`   Removed ${totalRemoved} duplicate entities`);
  console.log('='.repeat(80));

  process.exit(0);
}

// Run cleanup
if (require.main === module) {
  removeDuplicates().catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = { removeDuplicates };
