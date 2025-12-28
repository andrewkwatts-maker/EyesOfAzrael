const admin = require('firebase-admin');
const sa = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

async function analyzeCollections() {
  const collections = ['items', 'creatures', 'heroes', 'places', 'herbs', 'rituals', 'texts', 'symbols'];
  const results = {};

  for (const collection of collections) {
    console.log(`Analyzing ${collection}...`);
    const snapshot = await db.ref(`assets/${collection}`).once('value');
    const data = snapshot.val() || {};
    const items = Object.values(data);

    // Gather all unique fields across all items
    const allFields = new Set();
    items.forEach(item => {
      Object.keys(item).forEach(key => allFields.add(key));
    });

    results[collection] = {
      count: items.length,
      fields: Array.from(allFields).sort(),
      sample: items.length > 0 ? items[0] : {}
    };
  }

  console.log('\n=== COLLECTION ANALYSIS ===\n');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

analyzeCollections().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
