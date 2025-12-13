const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inspectSearchIndex() {
  console.log('\n🔍 Search Index Structure Inspection\n');
  console.log('━'.repeat(80));

  const snapshot = await db.collection('search_index').limit(3).get();

  snapshot.docs.forEach((doc, index) => {
    console.log(`\nDocument ${index + 1}: ${doc.id}`);
    console.log('Fields:');
    const data = doc.data();
    Object.keys(data).forEach(key => {
      const value = data[key];
      const preview = Array.isArray(value)
        ? `[${value.length} items]`
        : typeof value === 'object'
          ? '{object}'
          : String(value).substring(0, 50);
      console.log(`   ${key}: ${preview}`);
    });
  });

  console.log('\n━'.repeat(80));
  process.exit(0);
}

inspectSearchIndex().catch(console.error);
