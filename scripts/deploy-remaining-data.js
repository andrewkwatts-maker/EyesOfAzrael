#!/usr/bin/env node

/**
 * Deploy Remaining Data to Firestore
 * Uploads items, places, and magic systems
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Paths
const REPO_BASE = 'H:\\Github\\EyesOfAzrael';
const SERVICE_ACCOUNT_PATH = path.join(REPO_BASE, 'FIREBASE', 'firebase-service-account.json');
const IMPORTS_DIR = path.join(REPO_BASE, 'data', 'firebase-imports');
const THEORIES_FILE = path.join(REPO_BASE, 'data', 'theories-import.json');

// Initialize Firebase
console.log('\n=== Initializing Firebase Admin SDK ===\n');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

/**
 * Upload collection in batches
 */
async function uploadCollection(collectionName, items, batchSize = 500) {
    console.log(`\n📦 Uploading ${items.length} items to ${collectionName}...`);

    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = db.batch();
        const chunk = items.slice(i, Math.min(i + batchSize, items.length));

        chunk.forEach(item => {
            const docRef = db.collection(collectionName).doc(item.id);
            batch.set(docRef, item, { merge: true });
        });

        try {
            await batch.commit();
            uploaded += chunk.length;
            console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${chunk.length} items`);
        } catch (error) {
            failed += chunk.length;
            console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        }
    }

    console.log(`   📊 Total: ${uploaded} uploaded, ${failed} failed`);
    return { uploaded, failed };
}

/**
 * Main deployment function
 */
async function main() {
    const stats = {
        items: { uploaded: 0, failed: 0 },
        places: { uploaded: 0, failed: 0 },
        magic_systems: { uploaded: 0, failed: 0 },
        theories: { uploaded: 0, failed: 0 }
    };

    // 1. Upload Items
    try {
        const itemsPath = path.join(IMPORTS_DIR, 'items-import.json');
        if (fs.existsSync(itemsPath)) {
            const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
            stats.items = await uploadCollection('items', itemsData);
        } else {
            console.log('⚠️  Items file not found, skipping...');
        }
    } catch (error) {
        console.error('❌ Error uploading items:', error.message);
    }

    // 2. Upload Places
    try {
        const placesPath = path.join(IMPORTS_DIR, 'places-import.json');
        if (fs.existsSync(placesPath)) {
            const placesData = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));
            stats.places = await uploadCollection('places', placesData);
        } else {
            console.log('⚠️  Places file not found, skipping...');
        }
    } catch (error) {
        console.error('❌ Error uploading places:', error.message);
    }

    // 3. Upload Magic Systems
    try {
        const magicPath = path.join(IMPORTS_DIR, 'magic-systems-import.json');
        if (fs.existsSync(magicPath)) {
            const magicData = JSON.parse(fs.readFileSync(magicPath, 'utf-8'));
            stats.magic_systems = await uploadCollection('magic_systems', magicData);
        } else {
            console.log('⚠️  Magic systems file not found, skipping...');
        }
    } catch (error) {
        console.error('❌ Error uploading magic systems:', error.message);
    }

    // 4. Upload Theories
    try {
        if (fs.existsSync(THEORIES_FILE)) {
            const theoriesData = JSON.parse(fs.readFileSync(THEORIES_FILE, 'utf-8'));
            // Theories might be an array or object with theories key
            const theories = Array.isArray(theoriesData) ? theoriesData : (theoriesData.theories || []);
            stats.theories = await uploadCollection('user_theories', theories);
        } else {
            console.log('⚠️  Theories file not found, skipping...');
        }
    } catch (error) {
        console.error('❌ Error uploading theories:', error.message);
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 UPLOAD SUMMARY');
    console.log('='.repeat(80));
    console.log(`Items:         ${stats.items.uploaded.toString().padStart(4)} uploaded, ${stats.items.failed} failed`);
    console.log(`Places:        ${stats.places.uploaded.toString().padStart(4)} uploaded, ${stats.places.failed} failed`);
    console.log(`Magic Systems: ${stats.magic_systems.uploaded.toString().padStart(4)} uploaded, ${stats.magic_systems.failed} failed`);
    console.log(`Theories:      ${stats.theories.uploaded.toString().padStart(4)} uploaded, ${stats.theories.failed} failed`);
    console.log('='.repeat(80));

    const totalUploaded = Object.values(stats).reduce((sum, s) => sum + s.uploaded, 0);
    const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);

    console.log(`\n✅ Deployment complete: ${totalUploaded} documents uploaded, ${totalFailed} failed\n`);

    process.exit(totalFailed > 0 ? 1 : 0);
}

// Run deployment
main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
