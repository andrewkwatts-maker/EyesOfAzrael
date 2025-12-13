/**
 * Firebase Upload Script using Web SDK
 * Uploads migrated content to Firestore using web SDK (no service account needed)
 *
 * Usage: node scripts/upload-via-web-sdk.js <collection> <import-file>
 * Example: node scripts/upload-via-web-sdk.js items data/firebase-imports/items-import.json
 */

const fs = require('fs');
const path = require('path');

// Firebase Web SDK (compatible version - we're using v10.7.1 in the site)
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, getDocs, query, limit } = require('firebase/firestore');

// Load Firebase config from the main config file
const firebaseConfig = {
    apiKey: "AIzaSyAa9KV0pZqXFzE8H9T7gJNx2mY5RlvKj3w",
    authDomain: "eyesofazrael.firebaseapp.com",
    projectId: "eyesofazrael",
    storageBucket: "eyesofazrael.firebasestorage.app",
    messagingSenderId: "533894778090",
    appId: "1:533894778090:web:a4a8f6e3c1b2d9e4f5g6h7"
};

// Parse command line arguments
const collectionName = process.argv[2];
const importFilePath = process.argv[3];

if (!collectionName || !importFilePath) {
    console.error('Usage: node upload-via-web-sdk.js <collection> <import-file>');
    console.error('Example: node upload-via-web-sdk.js items data/firebase-imports/items-import.json');
    process.exit(1);
}

const BATCH_SIZE = 500; // Firestore batch limit

async function uploadToFirestore() {
    console.log(`\n=== Firebase Upload via Web SDK ===\n`);
    console.log(`Collection: ${collectionName}`);
    console.log(`Import file: ${importFilePath}\n`);

    // Load import data
    if (!fs.existsSync(importFilePath)) {
        throw new Error(`Import file not found: ${importFilePath}`);
    }

    const data = JSON.parse(fs.readFileSync(importFilePath, 'utf8'));
    console.log(`Loaded ${data.length} documents\n`);

    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✓ Firebase initialized\n');

    // Upload in batches
    console.log('Starting upload...');
    let uploaded = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batchData = data.slice(i, Math.min(i + BATCH_SIZE, data.length));
        const batch = writeBatch(db);

        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Processing ${batchData.length} documents...`);

        for (const item of batchData) {
            try {
                const docRef = doc(db, collectionName, item.id);
                batch.set(docRef, item);
            } catch (error) {
                console.error(`✗ Failed to add ${item.id}:`, error.message);
                failed++;
                errors.push({ id: item.id, error: error.message });
            }
        }

        try {
            await batch.commit();
            uploaded += batchData.length;
            console.log(`✓ Batch committed: ${uploaded}/${data.length} documents uploaded\n`);
        } catch (error) {
            console.error(`✗ Batch commit failed:`, error.message);
            failed += batchData.length;
            errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
        }

        // Rate limiting pause
        if (i + BATCH_SIZE < data.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Summary
    console.log('\n=== Upload Summary ===');
    console.log(`Total documents: ${data.length}`);
    console.log(`✓ Successful: ${uploaded}`);
    console.log(`✗ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(err => console.log(`  - ${err.id || 'Batch ' + err.batch}: ${err.error}`));
    }

    // Verify upload
    console.log('\n=== Verification ===');
    try {
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, limit(5));
        const snapshot = await getDocs(q);

        console.log(`Sample of ${snapshot.size} documents from ${collectionName}:`);
        snapshot.forEach(doc => {
            console.log(`  - ${doc.id}: ${doc.data().name || doc.data().title || 'No name'}`);
        });
    } catch (error) {
        console.error('✗ Verification failed:', error.message);
    }

    console.log('\n✅ Upload complete!\n');
}

// Run upload
uploadToFirestore().catch(error => {
    console.error('\n✗ Upload failed:', error);
    process.exit(1);
});
