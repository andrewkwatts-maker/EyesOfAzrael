#!/usr/bin/env node

/**
 * Firebase Cosmology Metadata Update Script
 * Auto-generated from enrich-cosmology-metadata.js
 *
 * Usage: node firebase-cosmology-update.js
 *
 * Prerequisites:
 * 1. Initialize Firebase Admin SDK with credentials
 * 2. Ensure you have write permissions to firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase (configure with your credentials)
// const serviceAccount = require('./path/to/service-account-key.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://your-project.firebaseio.com"
// });

const db = admin.firestore();

// Entities to update
const entitiesToUpdate = [
  {
    "id": "babylonian",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\babylonian.json"
  },
  {
    "id": "buddhist",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\buddhist.json"
  },
  {
    "id": "buddhist_karma",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\buddhist_karma.json"
  },
  {
    "id": "buddhist_realms",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\buddhist_realms.json"
  },
  {
    "id": "celtic",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\celtic.json"
  },
  {
    "id": "chinese",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\chinese.json"
  },
  {
    "id": "christian",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\christian.json"
  },
  {
    "id": "christian_heaven",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\christian_heaven.json"
  },
  {
    "id": "christian_trinity",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\christian_trinity.json"
  },
  {
    "id": "creation-amp-origins",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\creation-amp-origins.json"
  },
  {
    "id": "death-amp-the-afterlife",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\death-amp-the-afterlife.json"
  },
  {
    "id": "egyptian",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\egyptian.json"
  },
  {
    "id": "egyptian_duat",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\egyptian_duat.json"
  },
  {
    "id": "egyptian_nun",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\egyptian_nun.json"
  },
  {
    "id": "greek",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\greek.json"
  },
  {
    "id": "greek_underworld",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\greek_underworld.json"
  },
  {
    "id": "hindu",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\hindu.json"
  },
  {
    "id": "hindu_karma",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\hindu_karma.json"
  },
  {
    "id": "islamic",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\islamic.json"
  },
  {
    "id": "norse",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\norse.json"
  },
  {
    "id": "norse_asgard",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\norse_asgard.json"
  },
  {
    "id": "norse_yggdrasil",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\norse_yggdrasil.json"
  },
  {
    "id": "persian",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\persian.json"
  },
  {
    "id": "roman",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\roman.json"
  },
  {
    "id": "sumerian",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\sumerian.json"
  },
  {
    "id": "sumerian_anunnaki",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\sumerian_anunnaki.json"
  },
  {
    "id": "sumerian_me",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\sumerian_me.json"
  },
  {
    "id": "tarot",
    "localPath": "H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded\\cosmology\\tarot.json"
  }
];

/**
 * Update a single cosmology entity in Firebase
 */
async function updateCosmologyEntity(entityId, localPath) {
  try {
    const content = fs.readFileSync(localPath, 'utf8');
    const entity = JSON.parse(content);

    await db.collection('cosmology').doc(entityId).set(entity, { merge: true });
    console.log(`✓ Updated: ${entityId}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to update ${entityId}: ${error.message}`);
    return false;
  }
}

/**
 * Batch update all entities
 */
async function batchUpdateCosmology() {
  console.log(`Updating ${entitiesToUpdate.length} cosmology entities...
`);

  let success = 0;
  let failed = 0;

  for (const entity of entitiesToUpdate) {
    const updated = await updateCosmologyEntity(entity.id, entity.localPath);
    if (updated) {
      success++;
    } else {
      failed++;
    }
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`
${'='.repeat(60)}`);
  console.log(`Firebase Update Complete`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${entitiesToUpdate.length}`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run updates
batchUpdateCosmology().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
