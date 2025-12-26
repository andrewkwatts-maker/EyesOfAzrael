const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
    const doc = await db.collection('deities').doc('buddhist_avalokiteshvara').get();
    console.log(JSON.stringify(doc.data(), null, 2));
    process.exit(0);
}

check().catch(console.error);
