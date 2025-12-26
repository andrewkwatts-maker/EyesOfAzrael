/**
 * Quick verification script to sample a few deities and show their completeness
 */

const admin = require('firebase-admin');

console.log('Initializing Firebase...');
const serviceAccount = require('../FIREBASE/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

async function sampleDeities() {
  const snapshot = await db.collection('deities').limit(5).get();

  console.log('\nSample of 5 deities from Firebase:\n');

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log(`ID: ${doc.id}`);
    console.log(`Name: ${data.name}`);
    console.log(`Type: ${data.type || 'MISSING'}`);
    console.log(`Icon: ${data.icon || 'MISSING'}`);
    console.log(`Color: ${data.color || 'MISSING'}`);
    console.log(`Description: ${data.description ? data.description.substring(0, 80) + '...' : 'MISSING'}`);
    console.log(`\nMetadata:`);
    console.log(`  - Category: ${data.metadata?.category || 'MISSING'}`);
    console.log(`  - Status: ${data.metadata?.status || 'MISSING'}`);
    console.log(`  - Visibility: ${data.metadata?.visibility || 'MISSING'}`);
    console.log(`  - Tags: ${data.metadata?.tags?.length || 0} tags`);
    console.log(`\nRelationships:`);
    console.log(`  - Mythology: ${data.relationships?.mythology || 'MISSING'}`);
    console.log(`  - Related IDs: ${data.relationships?.relatedIds?.length || 0}`);
    console.log(`  - Collections: ${data.relationships?.collections?.length || 0}`);
    console.log(`\nSearch:`);
    console.log(`  - Keywords: ${data.search?.keywords?.length || 0}`);
    console.log(`  - Aliases: ${data.search?.aliases?.length || 0}`);
    console.log(`  - Facets: ${Object.keys(data.search?.facets || {}).length} facets`);
    console.log(`  - Searchable Text: ${data.search?.searchableText ? 'YES' : 'MISSING'}`);
    console.log(`\nRendering:`);
    console.log(`  - Default Mode: ${data.rendering?.defaultMode || 'MISSING'}`);
    console.log(`  - Modes Enabled: ${Object.keys(data.rendering?.modes || {}).length}`);
  });

  console.log('='.repeat(60));

  process.exit(0);
}

sampleDeities().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
