const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkMythologies() {
  try {
    const snapshot = await db.collection('mythologies')
      .orderBy('displayName')
      .get();

    console.log(`\n=== Total Mythologies: ${snapshot.size} ===\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${doc.id}:`);
      console.log(`  displayName: ${data.displayName || 'MISSING'}`);
      console.log(`  icon: ${data.icon || 'MISSING'}`);
      console.log(`  description: ${data.description ? data.description.substring(0, 80) + '...' : 'MISSING'}`);
      console.log(`  era: ${data.era || 'MISSING'}`);
      console.log(`  regions: ${data.regions ? data.regions.join(', ') : 'MISSING'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMythologies();
