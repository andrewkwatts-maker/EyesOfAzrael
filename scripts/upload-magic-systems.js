const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../FIREBASE/firebase-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function uploadMagicSystems() {
    const magicPath = path.join(__dirname, '..', 'data', 'firebase-imports', 'magic-systems-import.json');
    const data = JSON.parse(fs.readFileSync(magicPath, 'utf-8'));
    const systems = data.systems || [];

    console.log('Uploading', systems.length, 'magic systems...');

    const batch = db.batch();
    systems.forEach(system => {
        const docRef = db.collection('magic_systems').doc(system.id);
        batch.set(docRef, system, { merge: true });
    });

    await batch.commit();
    console.log('Uploaded', systems.length, 'magic systems');
    process.exit(0);
}

uploadMagicSystems().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
