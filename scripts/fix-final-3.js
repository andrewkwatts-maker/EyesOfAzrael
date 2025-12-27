const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function fixFinal3() {
  console.log('Fixing final 3 assets...\n');

  // Fix universal_frankincense
  await db.collection('herbs').doc('universal_frankincense').update({
    mythology: 'universal'
  });
  console.log('✓ Fixed herbs/universal_frankincense');

  // Fix universal_myrrh
  await db.collection('herbs').doc('universal_myrrh').update({
    mythology: 'universal'
  });
  console.log('✓ Fixed herbs/universal_myrrh');

  // Fix sample-enhanced-text
  await db.collection('texts').doc('texts_sample-enhanced-text').update({
    name: 'Sample Enhanced Text',
    mythology: 'universal'
  });
  console.log('✓ Fixed texts/texts_sample-enhanced-text');

  console.log('\n✅ All 3 assets fixed!');
  process.exit(0);
}

fixFinal3().catch(console.error);
