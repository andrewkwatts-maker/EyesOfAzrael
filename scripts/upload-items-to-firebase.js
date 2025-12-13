/**
 * Firebase Upload Script for Items
 * Uploads migrated items to Firestore database
 *
 * Prerequisites:
 * - items-import.json must exist (run migrate-items-to-firebase.js first)
 * - Firebase credentials configured
 * - Firestore indexes created for search
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const NEW_REPO_BASE = 'H:\\Github\\EyesOfAzrael';
const IMPORT_FILE = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'items-import.json');
const SERVICE_ACCOUNT_PATH = path.join(NEW_REPO_BASE, 'firebase-service-account.json');
const COLLECTION_NAME = 'items';
const BATCH_SIZE = 500; // Firestore batch limit

// Initialize Firebase Admin
function initializeFirebase() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error(`Firebase service account not found: ${SERVICE_ACCOUNT_PATH}`);
    }

    const serviceAccount = require(SERVICE_ACCOUNT_PATH);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    return admin.firestore();
}

// Upload items in batches
async function uploadItems(db, items) {
    console.log(`Uploading ${items.length} items to Firestore collection: ${COLLECTION_NAME}`);

    const results = {
        successful: 0,
        failed: 0,
        errors: []
    };

    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchItems = items.slice(i, Math.min(i + BATCH_SIZE, items.length));

        console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}`);

        for (const item of batchItems) {
            try {
                const docRef = db.collection(COLLECTION_NAME).doc(item.id);

                // Add server timestamp
                const itemWithTimestamp = {
                    ...item,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(docRef, itemWithTimestamp);
                results.successful++;
                console.log(`  ✓ Queued: ${item.id} (${item.name})`);
            } catch (error) {
                results.failed++;
                results.errors.push({
                    itemId: item.id,
                    error: error.message
                });
                console.error(`  ✗ Failed: ${item.id} - ${error.message}`);
            }
        }

        // Commit batch
        try {
            await batch.commit();
            console.log(`  Batch committed successfully`);
        } catch (error) {
            console.error(`  Batch commit failed:`, error.message);
            results.errors.push({
                batch: Math.floor(i / BATCH_SIZE) + 1,
                error: error.message
            });
        }

        // Rate limiting delay
        if (i + BATCH_SIZE < items.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return results;
}

// Create Firestore indexes
async function createIndexes(db) {
    console.log('\nNote: Firestore indexes must be created manually or via firestore.indexes.json');
    console.log('Required indexes:');
    console.log('  1. Collection: items, Fields: name (ASC), status (ASC)');
    console.log('  2. Collection: items, Fields: mythologies (ARRAY), status (ASC)');
    console.log('  3. Collection: items, Fields: primaryMythology (ASC), itemType (ASC)');
    console.log('  4. Collection: items, Fields: searchTerms (ARRAY), visibility (ASC)');
    console.log('  5. Collection: items, Fields: tags (ARRAY), mythologies (ARRAY)');

    // Write indexes configuration
    const indexesConfig = {
        indexes: [
            {
                collectionGroup: 'items',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'name', order: 'ASCENDING' },
                    { fieldPath: 'status', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'items',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'mythologies', arrayConfig: 'CONTAINS' },
                    { fieldPath: 'status', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'items',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'primaryMythology', order: 'ASCENDING' },
                    { fieldPath: 'itemType', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'items',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'searchTerms', arrayConfig: 'CONTAINS' },
                    { fieldPath: 'visibility', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'items',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'tags', arrayConfig: 'CONTAINS' },
                    { fieldPath: 'mythologies', arrayConfig: 'CONTAINS' }
                ]
            }
        ],
        fieldOverrides: []
    };

    const indexesFile = path.join(NEW_REPO_BASE, 'firestore.indexes.json');
    const existingIndexes = fs.existsSync(indexesFile)
        ? JSON.parse(fs.readFileSync(indexesFile, 'utf-8'))
        : { indexes: [], fieldOverrides: [] };

    // Merge indexes
    existingIndexes.indexes.push(...indexesConfig.indexes);

    fs.writeFileSync(indexesFile, JSON.stringify(existingIndexes, null, 2), 'utf-8');
    console.log(`\nIndexes configuration updated: ${indexesFile}`);
    console.log('Deploy with: firebase deploy --only firestore:indexes');
}

// Verify upload
async function verifyUpload(db, expectedCount) {
    console.log('\nVerifying upload...');

    const snapshot = await db.collection(COLLECTION_NAME).get();
    const actualCount = snapshot.size;

    console.log(`Expected: ${expectedCount} items`);
    console.log(`Actual: ${actualCount} items`);

    if (actualCount === expectedCount) {
        console.log('✓ Upload verification successful!');
        return true;
    } else {
        console.warn(`⚠ Upload incomplete! Missing ${expectedCount - actualCount} items`);
        return false;
    }
}

// Set Firestore security rules
async function updateSecurityRules() {
    const rulesTemplate = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Items collection - public read, authenticated write
    match /items/{itemId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Authenticated users only
      allow create: if request.auth != null && request.auth.token.email_verified == true;
      allow update: if request.auth != null && request.auth.token.email_verified == true;
      allow delete: if request.auth != null && request.auth.token.admin == true;
    }

    // Item search index
    match /itemsIndex/{indexId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}`;

    const rulesFile = path.join(NEW_REPO_BASE, 'firestore.rules');
    const existingRules = fs.existsSync(rulesFile)
        ? fs.readFileSync(rulesFile, 'utf-8')
        : '';

    if (!existingRules.includes('match /items/{itemId}')) {
        fs.writeFileSync(rulesFile, rulesTemplate, 'utf-8');
        console.log(`\nSecurity rules updated: ${rulesFile}`);
        console.log('Deploy with: firebase deploy --only firestore:rules');
    } else {
        console.log('\nSecurity rules already configured for items collection');
    }
}

// Main execution
async function main() {
    console.log('=== Firebase Item Upload ===\n');

    // Load items
    if (!fs.existsSync(IMPORT_FILE)) {
        throw new Error(`Import file not found: ${IMPORT_FILE}\nRun migrate-items-to-firebase.js first`);
    }

    const items = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf-8'));
    console.log(`Loaded ${items.length} items from ${IMPORT_FILE}`);

    // Initialize Firebase
    console.log('\nInitializing Firebase...');
    const db = initializeFirebase();
    console.log('✓ Firebase initialized');

    // Upload items
    console.log('\n--- Starting Upload ---');
    const results = await uploadItems(db, items);

    // Display results
    console.log('\n=== Upload Complete ===');
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(e => {
            console.log(`  - ${e.itemId || 'batch ' + e.batch}: ${e.error}`);
        });
    }

    // Verify upload
    await verifyUpload(db, items.length);

    // Create indexes
    await createIndexes(db);

    // Update security rules
    await updateSecurityRules();

    // Generate upload report
    const report = {
        timestamp: new Date().toISOString(),
        totalItems: items.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        collection: COLLECTION_NAME
    };

    const reportFile = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'upload-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\nUpload report saved: ${reportFile}`);

    return report;
}

// Run if called directly
if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✓ All done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n✗ Upload failed:', error);
            process.exit(1);
        });
}

module.exports = { main, uploadItems, verifyUpload };
