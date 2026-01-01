/**
 * Upload New Entities Script (Admin SDK)
 * Uploads magic and symbol entities from firebase-assets-downloaded folder to Firestore
 * Uses Firebase Admin SDK with service account
 *
 * Usage: node scripts/upload-new-entities-admin.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const isDryRun = process.argv.includes('--dry-run');

// Service account path
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

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
            console.log(`    ✓ ${entity.displayName || entity.name} (${entity.id})`);
            console.log(`      Type: ${entity.type}, Mythology: ${entity.mythology}`);
        }

        totalEntities += entities.length;
        console.log('');
    }

    console.log(`=== SUMMARY ===`);
    console.log(`Total entities to upload: ${totalEntities}`);
    console.log(`\nTo actually upload, run: node scripts/upload-new-entities-admin.js`);

    return totalEntities;
}

/**
 * Upload entities to Firebase
 */
async function uploadToFirebase() {
    console.log('\n=== UPLOADING TO FIREBASE (Admin SDK) ===\n');

    // Check for service account
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account file not found: ${serviceAccountPath}`);
    }

    // Initialize Firebase Admin
    console.log('Initializing Firebase Admin...');
    const serviceAccount = require(serviceAccountPath);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();
    console.log('✓ Firebase Admin initialized\n');

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

        // Process with batch write
        const batch = db.batch();
        let batchCount = 0;

        for (const entity of entities) {
            try {
                // Check if entity already exists
                const docRef = db.collection(config.collection).doc(entity.id);
                const existingDoc = await docRef.get();

                if (existingDoc.exists) {
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
                uploaded = batchCount;
                console.log(`  📦 Batch committed: ${batchCount} documents`);
            } catch (error) {
                console.error(`  ❌ Batch commit failed: ${error.message}`);
                failed += batchCount;
                results.errors.push({ batch: true, error: error.message });
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
            const snapshot = await db.collection(config.collection).get();
            console.log(`${config.collection}: ${snapshot.size} documents total`);

            // Show sample
            const sample = snapshot.docs.slice(0, 3);
            sample.forEach(doc => {
                const data = doc.data();
                console.log(`  - ${doc.id}: ${data.displayName || data.name}`);
            });
        } catch (error) {
            console.error(`${config.collection}: Verification failed - ${error.message}`);
        }
    }

    console.log('\n✅ Upload complete!');
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
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
