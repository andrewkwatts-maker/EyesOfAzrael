const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifySearchIndexes() {
  console.log('\n🔍 Search Index Verification\n');
  console.log('━'.repeat(80));

  // Get sample search index documents
  const snapshot = await db.collection('search_index').limit(5).get();

  console.log(`\n📄 Sample Search Index Documents (showing ${snapshot.size} of total):\n`);

  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ID: ${doc.id}`);
    console.log(`   Name: ${data.name || 'N/A'}`);
    console.log(`   Type: ${data.type || 'N/A'}`);
    console.log(`   Collection: ${data.collection || 'N/A'}`);
    console.log(`   Search Terms: ${data.searchTerms ? data.searchTerms.length : 0} terms`);
    if (data.searchTerms && data.searchTerms.length > 0) {
      console.log(`   Sample Terms: ${data.searchTerms.slice(0, 3).join(', ')}`);
    }
    console.log();
  });

  // Get collection distribution
  console.log('━'.repeat(80));
  console.log('\n📊 Search Indexes by Collection:\n');

  const collectionCounts = {};
  const allIndexes = await db.collection('search_index').get();

  allIndexes.docs.forEach(doc => {
    const collection = doc.data().collection;
    if (collection) {
      collectionCounts[collection] = (collectionCounts[collection] || 0) + 1;
    }
  });

  Object.entries(collectionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([collection, count]) => {
      console.log(`   ${collection.padEnd(20)} ${count} indexes`);
    });

  console.log(`\n   Total: ${allIndexes.size} search indexes`);
  console.log('\n━'.repeat(80));

  process.exit(0);
}

verifySearchIndexes().catch(console.error);
