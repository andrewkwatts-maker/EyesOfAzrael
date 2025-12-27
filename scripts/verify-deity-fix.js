const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://eyesofazrael.firebaseio.com"
});

const db = admin.firestore();

async function verifySample() {
  console.log('\nVerifying Firebase Updates...\n');

  const sampleIds = ['aengus', 'jupiter', 'mithra', 'ahura-mazda', 'japanese_raijin'];

  for (const id of sampleIds) {
    const doc = await db.collection('deities').doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`✓ ${id}:`);
      console.log(`  Description: ${data.description ? '✓ PRESENT' : '✗ MISSING'} (${data.description?.length || 0} chars)`);
      console.log(`  Domains: ${data.domains ? '✓ PRESENT' : '✗ MISSING'} (${data.domains?.length || 0} items: ${data.domains?.join(', ') || 'none'})`);
      console.log('');
    } else {
      console.log(`✗ ${id}: Document not found`);
    }
  }

  await admin.app().delete();
  console.log('Verification complete!\n');
}

verifySample().catch(console.error);
