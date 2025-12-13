const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verify() {
  const collections = [
    'aztec', 'babylonian', 'buddhist', 'celtic', 'chinese', 'christian',
    'concepts', 'cosmology', 'creatures', 'egyptian', 'greek', 'herbs',
    'heroes', 'hindu', 'islamic', 'japanese', 'mayan', 'norse', 'persian',
    'rituals', 'roman', 'sumerian', 'symbols', 'tarot', 'texts', 'yoruba'
  ];

  console.log('\n📊 Firestore Collection Verification\n');
  console.log('━'.repeat(80));

  let totalDocs = 0;
  const results = {};

  for (const coll of collections) {
    const snapshot = await db.collection(coll).count().get();
    const count = snapshot.data().count;
    results[coll] = count;
    totalDocs += count;
    console.log(`   ✅ ${coll.padEnd(20)} ${count} documents`);
  }

  console.log('━'.repeat(80));

  const searchSnapshot = await db.collection('search_index').count().get();
  const xrefSnapshot = await db.collection('cross_references').count().get();

  const searchCount = searchSnapshot.data().count;
  const xrefCount = xrefSnapshot.data().count;

  console.log(`\n   ✅ search_index         ${searchCount} documents`);
  console.log(`   ✅ cross_references     ${xrefCount} documents`);

  console.log('\n━'.repeat(80));
  console.log(`\n📈 Summary:`);
  console.log(`   Total Collections: ${collections.length}`);
  console.log(`   Total Content Documents: ${totalDocs}`);
  console.log(`   Search Indexes: ${searchCount}`);
  console.log(`   Cross References: ${xrefCount}`);
  console.log(`   Grand Total: ${totalDocs + searchCount + xrefCount} documents\n`);

  process.exit(0);
}

verify().catch(console.error);
