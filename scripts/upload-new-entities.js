/**
 * Upload New Entities Script
 * Uploads magic and symbol entities from firebase-assets-downloaded folder to Firestore
 *
 * Usage: node scripts/upload-new-entities.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Firebase Web SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, getDocs, query, limit, getDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAa9KV0pZqXFzE8H9T7gJNx2mY5RlvKj3w",
    authDomain: "eyesofazrael.firebaseapp.com",
    projectId: "eyesofazrael",
    storageBucket: "eyesofazrael.firebasestorage.app",
    messagingSenderId: "533894778090",
    appId: "1:533894778090:web:a4a8f6e3c1b2d9e4f5g6h7"
};

const BATCH_SIZE = 450; // Keep under Firestore's 500 limit
const isDryRun = process.argv.includes('--dry-run');

// Entity configurations - which folders to upload to which collections
const ENTITY_CONFIG = [
    { folder: 'magic', collection: 'magic', exclude: ['_all.json'] },
    { folder: 'symbols', collection: 'symbols', exclude: ['_all.json', 'persian.json'] }
];

/**
 * Load entities from a folder
 */
function loadEntitiesFromFolder(folderName, exclude = []) {
    const folderPath = path.join(__dirname, '../firebase-assets-downloaded', folderName);
    const entities = [];

    if (!fs.existsSync(folderPath)) {
        console.log(`  ⚠️  Folder not found: ${folderPath}`);
        return entities;
    }

    const files = fs.readdirSync(folderPath).filter(f =>
        f.endsWith('.json') && !exclude.includes(f)
    );

    for (const file of files) {
        try {
            const filePath = path.join(folderPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const entity = JSON.parse(content);

            // Handle array files (skip them - they're aggregates)
            if (Array.isArray(entity)) {
                console.log(`    ⏭️  Skipping array file: ${file}`);
                continue;
            }

            // Ensure entity has an id
            if (!entity.id) {
                entity.id = path.basename(file, '.json');
            }

            entities.push({ ...entity, _sourceFile: file });
        } catch (error) {
            console.error(`    ❌ Error loading ${file}: ${error.message}`);
        }
    }

    return entities;
}

/**
 * Dry run - preview what would be uploaded
 */
async function dryRun() {
    console.log('\n=== DRY RUN: Preview Upload ===\n');

    let totalEntities = 0;

    for (const config of ENTITY_CONFIG) {
        console.log(`📁 ${config.folder} → ${config.collection} collection:`);
        const entities = loadEntitiesFromFolder(config.folder, config.exclude);

        if (entities.length === 0) {
            console.log('  No entities found\n');
            continue;
        }

        console.log(`  Found ${entities.length} entities:\n`);

        for (const entity of entities) {
            const completeness = entity.description ?
                Math.min(100, Math.round((entity.description.length / 500) * 50) + 50) : 30;
            console.log(`    ✓ ${entity.displayName || entity.name} (${entity.id})`);
            console.log(`      Type: ${entity.type}, Mythology: ${entity.mythology}`);
        }

        totalEntities += entities.length;
        console.log('');
    }

    console.log(`=== SUMMARY ===`);
    console.log(`Total entities to upload: ${totalEntities}`);
    console.log(`\nTo actually upload, run: node scripts/upload-new-entities.js`);

    return totalEntities;
}

/**
 * Upload entities to Firebase
 */
async function uploadToFirebase() {
    console.log('\n=== UPLOADING TO FIREBASE ===\n');

    // Initialize Firebase
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✓ Firebase initialized\n');

    const results = {
        collections: {},
        total: { uploaded: 0, skipped: 0, failed: 0 },
        errors: []
    };

    for (const config of ENTITY_CONFIG) {
        console.log(`\n📦 Processing ${config.folder} → ${config.collection}...`);
        const entities = loadEntitiesFromFolder(config.folder, config.exclude);

        if (entities.length === 0) {
            console.log('  No entities to upload');
            continue;
        }

        let uploaded = 0;
        let skipped = 0;
        let failed = 0;

        // Process in batches
        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
            const batchEntities = entities.slice(i, Math.min(i + BATCH_SIZE, entities.length));
            const batch = writeBatch(db);
            let batchCount = 0;

            for (const entity of batchEntities) {
                try {
                    // Check if entity already exists
                    const docRef = doc(db, config.collection, entity.id);
                    const existingDoc = await getDoc(docRef);

                    if (existingDoc.exists()) {
                        console.log(`  ⏭️  ${entity.id} already exists, skipping`);
                        skipped++;
                        continue;
                    }

                    // Prepare entity for upload
                    const uploadData = { ...entity };
                    delete uploadData._sourceFile;

                    // Add timestamps
                    uploadData.createdAt = uploadData.createdAt || new Date().toISOString();
                    uploadData.updatedAt = new Date().toISOString();
                    uploadData._uploadedAt = new Date().toISOString();

                    batch.set(docRef, uploadData);
                    batchCount++;
                    console.log(`  ✓ Queued: ${entity.displayName || entity.name} (${entity.id})`);

                } catch (error) {
                    console.error(`  ❌ Failed: ${entity.id} - ${error.message}`);
                    failed++;
                    results.errors.push({ id: entity.id, error: error.message });
                }
            }

            // Commit batch
            if (batchCount > 0) {
                try {
                    await batch.commit();
                    uploaded += batchCount;
                    console.log(`  📦 Batch committed: ${batchCount} documents`);
                } catch (error) {
                    console.error(`  ❌ Batch commit failed: ${error.message}`);
                    failed += batchCount;
                    results.errors.push({ batch: true, error: error.message });
                }
            }

            // Rate limiting
            if (i + BATCH_SIZE < entities.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        results.collections[config.collection] = { uploaded, skipped, failed };
        results.total.uploaded += uploaded;
        results.total.skipped += skipped;
        results.total.failed += failed;

        console.log(`\n  Summary for ${config.collection}:`);
        console.log(`    Uploaded: ${uploaded}`);
        console.log(`    Skipped: ${skipped}`);
        console.log(`    Failed: ${failed}`);
    }

    // Final summary
    console.log('\n=== UPLOAD COMPLETE ===');
    console.log(`Total uploaded: ${results.total.uploaded}`);
    console.log(`Total skipped: ${results.total.skipped}`);
    console.log(`Total failed: ${results.total.failed}`);

    if (results.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        results.errors.forEach(e => {
            console.log(`  - ${e.id || 'Batch'}: ${e.error}`);
        });
    }

    // Verify by checking counts
    console.log('\n=== VERIFICATION ===');
    for (const config of ENTITY_CONFIG) {
        try {
            const collectionRef = collection(db, config.collection);
            const q = query(collectionRef, limit(5));
            const snapshot = await getDocs(q);
            console.log(`${config.collection}: Found ${snapshot.size}+ documents`);
        } catch (error) {
            console.error(`${config.collection}: Verification failed - ${error.message}`);
        }
    }

    return results;
}

/**
 * Main
 */
async function main() {
    try {
        if (isDryRun) {
            await dryRun();
        } else {
            await uploadToFirebase();
        }
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
