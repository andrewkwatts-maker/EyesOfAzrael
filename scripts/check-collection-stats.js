const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCollections() {
  const collections = ['heroes', 'creatures', 'symbols'];

  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    console.log(`\n${coll.toUpperCase()}: ${snapshot.size} total documents`);

    let hasType = 0;
    let hasIcon = 0;
    let hasGoodDesc = 0;
    let hasSpecialField = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type) hasType++;
      if (data.icon) hasIcon++;
      if (data.description && data.description.length > 50) hasGoodDesc++;

      // Check collection-specific fields
      if (coll === 'heroes' && data.deeds) hasSpecialField++;
      if (coll === 'creatures' && data.abilities) hasSpecialField++;
      if (coll === 'symbols' && data.meaning) hasSpecialField++;
    });

    console.log(`  - Has type: ${hasType} (${(hasType/snapshot.size*100).toFixed(1)}%)`);
    console.log(`  - Has icon: ${hasIcon} (${(hasIcon/snapshot.size*100).toFixed(1)}%)`);
    console.log(`  - Has good description: ${hasGoodDesc} (${(hasGoodDesc/snapshot.size*100).toFixed(1)}%)`);

    if (coll === 'heroes') {
      console.log(`  - Has deeds: ${hasSpecialField} (${(hasSpecialField/snapshot.size*100).toFixed(1)}%)`);
    } else if (coll === 'creatures') {
      console.log(`  - Has abilities: ${hasSpecialField} (${(hasSpecialField/snapshot.size*100).toFixed(1)}%)`);
    } else if (coll === 'symbols') {
      console.log(`  - Has meaning: ${hasSpecialField} (${(hasSpecialField/snapshot.size*100).toFixed(1)}%)`);
    }
  }

  process.exit(0);
}

checkCollections();
