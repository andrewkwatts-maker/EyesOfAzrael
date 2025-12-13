const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inspectCrossRefs() {
  console.log('\n🔗 Cross-References Structure Inspection\n');
  console.log('━'.repeat(80));

  const snapshot = await db.collection('cross_references').limit(3).get();

  snapshot.docs.forEach((doc, index) => {
    console.log(`\nDocument ${index + 1}: ${doc.id}`);
    const data = doc.data();
    console.log('Fields:');
    Object.keys(data).forEach(key => {
      const value = data[key];
      const preview = Array.isArray(value)
        ? `[${value.length} items]`
        : typeof value === 'object'
          ? '{object}'
          : String(value).substring(0, 50);
      console.log(`   ${key}: ${preview}`);
    });

    // Show sample references if they exist
    if (data.references && Array.isArray(data.references) && data.references.length > 0) {
      console.log('\n   Sample References:');
      data.references.slice(0, 3).forEach(ref => {
        console.log(`      - ${ref.targetId} (${ref.targetName}) - ${ref.type}`);
      });
    }
  });

  console.log('\n━'.repeat(80));
  console.log('\n📊 Cross-Reference Statistics:\n');

  const allRefs = await db.collection('cross_references').get();
  let totalReferences = 0;
  const refTypes = {};

  allRefs.docs.forEach(doc => {
    const data = doc.data();
    if (data.references && Array.isArray(data.references)) {
      totalReferences += data.references.length;
      data.references.forEach(ref => {
        refTypes[ref.type] = (refTypes[ref.type] || 0) + 1;
      });
    }
  });

  console.log(`   Total Cross-Reference Documents: ${allRefs.size}`);
  console.log(`   Total Reference Links: ${totalReferences}`);
  console.log(`\n   Reference Types:`);
  Object.entries(refTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`      ${type.padEnd(20)} ${count}`);
    });

  console.log('\n━'.repeat(80));
  process.exit(0);
}

inspectCrossRefs().catch(console.error);
