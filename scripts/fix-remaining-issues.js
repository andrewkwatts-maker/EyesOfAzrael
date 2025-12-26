const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
let fixed = 0;

async function fixAll() {
    console.log('Fixing remaining issues...\n');

    // Fix cosmology entities missing name
    const cosmoSnapshot = await db.collection('cosmology').get();
    for (const doc of cosmoSnapshot.docs) {
        const data = doc.data();
        if (!data.name || data.name === 'The' || data.name.length < 3) {
            const newName = data.displayName || data.filename || doc.id;
            await doc.ref.update({
                name: newName,
                'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Fixed cosmology name: ${doc.id} → "${newName}"`);
            fixed++;
        }
    }

    // Fix heroes missing feats
    const heroSnapshot = await db.collection('heroes').get();
    for (const doc of heroSnapshot.docs) {
        const data = doc.data();
        if (!data.feats || data.feats.length === 0) {
            await doc.ref.update({
                feats: [],
                'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Fixed hero feats: ${doc.id}`);
            fixed++;
        }
    }

    console.log(`\n✅ Fixed ${fixed} entities`);
    process.exit(0);
}

fixAll().catch(console.error);
