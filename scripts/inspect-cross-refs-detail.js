const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inspectCrossRefsDetail() {
  console.log('\n🔗 Cross-References Detailed Inspection\n');
  console.log('━'.repeat(80));

  const snapshot = await db.collection('cross_references').limit(2).get();

  snapshot.docs.forEach((doc, index) => {
    console.log(`\nDocument ${index + 1}: ${doc.id}`);
    const data = doc.data();

    if (data.relatedContent && Array.isArray(data.relatedContent)) {
      console.log(`   Related Content: ${data.relatedContent.length} items`);
      console.log('\n   Sample entries:');
      data.relatedContent.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(item, null, 6).split('\n').join('\n      ')}`);
      });
    }
  });

  console.log('\n━'.repeat(80));

  // Get statistics
  const allRefs = await db.collection('cross_references').get();
  let totalRelations = 0;

  allRefs.docs.forEach(doc => {
    const data = doc.data();
    if (data.relatedContent && Array.isArray(data.relatedContent)) {
      totalRelations += data.relatedContent.length;
    }
  });

  console.log(`\n📊 Statistics:`);
  console.log(`   Cross-Reference Documents: ${allRefs.size}`);
  console.log(`   Total Related Content Links: ${totalRelations}`);
  console.log(`   Average Relations per Document: ${(totalRelations / allRefs.size).toFixed(1)}`);

  console.log('\n━'.repeat(80));
  process.exit(0);
}

inspectCrossRefsDetail().catch(console.error);
