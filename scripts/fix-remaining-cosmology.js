#!/usr/bin/env node
/**
 * Quick fix for remaining 7 cosmology entities with wrong type
 */
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

const ENTITIES_TO_FIX = [
  'persian_creation',
  'roman_afterlife',
  'roman_creation',
  'sumerian_afterlife',
  'sumerian_creation',
  'tarot_afterlife',
  'tarot_creation'
];

async function fix() {
  console.log('Fixing 7 remaining cosmology entities...\n');

  for (const id of ENTITIES_TO_FIX) {
    try {
      await db.collection('cosmology').doc(id).update({
        type: 'cosmology',
        'metadata.typeFixedAt': new Date().toISOString()
      });
      console.log(`[UPDATED] ${id}`);
    } catch (e) {
      console.log(`[ERROR] ${id}: ${e.message}`);
    }
  }

  console.log('\nDone!');
}

fix().catch(console.error);
