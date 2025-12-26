#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inspect() {
    // Get one entity from each type to see structure
    const types = ['deities', 'cosmology', 'heroes'];
    
    for (const type of types) {
        const snapshot = await db.collection(type).limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Sample ${type} entity: ${doc.id}`);
            console.log('='.repeat(80));
            console.log(JSON.stringify(doc.data(), null, 2));
        }
    }
    
    process.exit(0);
}

inspect().catch(console.error);
