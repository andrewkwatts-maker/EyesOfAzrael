/**
 * Firebase Upload Script for Concepts
 * Uploads philosophical/cosmological concepts to Firestore database
 *
 * Prerequisites:
 * - concepts-import.json must exist
 * - Firebase credentials configured
 * - Firestore indexes created for search
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const NEW_REPO_BASE = 'H:\\Github\\EyesOfAzrael';
const IMPORT_FILE = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'concepts-import.json');
const SERVICE_ACCOUNT_PATH = path.join(NEW_REPO_BASE, 'firebase-service-account.json');
const COLLECTION_NAME = 'concepts';
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

// Upload concepts in batches
async function uploadConcepts(db, concepts) {
    console.log(`Uploading ${concepts.length} concepts to Firestore collection: ${COLLECTION_NAME}`);

    const results = {
        successful: 0,
        failed: 0,
        errors: []
    };

    // Process in batches
    for (let i = 0; i < concepts.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchConcepts = concepts.slice(i, Math.min(i + BATCH_SIZE, concepts.length));

        console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(concepts.length / BATCH_SIZE)}`);

        for (const concept of batchConcepts) {
            try {
                const docRef = db.collection(COLLECTION_NAME).doc(concept.id);

                // Add server timestamp
                const conceptWithTimestamp = {
                    ...concept,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(docRef, conceptWithTimestamp);
                results.successful++;
                console.log(`  ✓ Queued: ${concept.id} (${concept.name})`);
            } catch (error) {
                results.failed++;
                results.errors.push({
                    conceptId: concept.id,
                    error: error.message
                });
                console.error(`  ✗ Failed: ${concept.id} - ${error.message}`);
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
        if (i + BATCH_SIZE < concepts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return results;
}

// Create Firestore indexes
async function createIndexes(db) {
    console.log('\nNote: Firestore indexes must be created manually or via firestore.indexes.json');
    console.log('Required indexes:');
    console.log('  1. Collection: concepts, Fields: name (ASC), mythologies (ARRAY)');
    console.log('  2. Collection: concepts, Fields: conceptType (ASC), conceptSubtype (ASC)');
    console.log('  3. Collection: concepts, Fields: mythologies (ARRAY), conceptType (ASC)');
    console.log('  4. Collection: concepts, Fields: tags (ARRAY), primaryMythology (ASC)');
    console.log('  5. Collection: concepts, Fields: primaryMythology (ASC), name (ASC)');

    // Write indexes configuration
    const indexesConfig = {
        indexes: [
            {
                collectionGroup: 'concepts',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'name', order: 'ASCENDING' },
                    { fieldPath: 'mythologies', arrayConfig: 'CONTAINS' }
                ]
            },
            {
                collectionGroup: 'concepts',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'conceptType', order: 'ASCENDING' },
                    { fieldPath: 'conceptSubtype', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'concepts',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'mythologies', arrayConfig: 'CONTAINS' },
                    { fieldPath: 'conceptType', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'concepts',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'tags', arrayConfig: 'CONTAINS' },
                    { fieldPath: 'primaryMythology', order: 'ASCENDING' }
                ]
            },
            {
                collectionGroup: 'concepts',
                queryScope: 'COLLECTION',
                fields: [
                    { fieldPath: 'primaryMythology', order: 'ASCENDING' },
                    { fieldPath: 'name', order: 'ASCENDING' }
                ]
            }
        ],
        fieldOverrides: []
    };

    const indexesFile = path.join(NEW_REPO_BASE, 'firestore.indexes.json');
    let existingIndexes = { indexes: [], fieldOverrides: [] };

    if (fs.existsSync(indexesFile)) {
        try {
            existingIndexes = JSON.parse(fs.readFileSync(indexesFile, 'utf-8'));
        } catch (error) {
            console.warn('Warning: Could not parse existing indexes file, creating new one');
        }
    }

    // Merge indexes (avoid duplicates by checking collection group)
    const existingConceptIndexes = existingIndexes.indexes.filter(
        idx => idx.collectionGroup === 'concepts'
    );

    if (existingConceptIndexes.length === 0) {
        existingIndexes.indexes.push(...indexesConfig.indexes);
        fs.writeFileSync(indexesFile, JSON.stringify(existingIndexes, null, 2), 'utf-8');
        console.log(`\nIndexes configuration updated: ${indexesFile}`);
        console.log('Deploy with: firebase deploy --only firestore:indexes');
    } else {
        console.log('\nConcepts indexes already exist in firestore.indexes.json');
    }
}

// Verify upload
async function verifyUpload(db, expectedCount) {
    console.log('\nVerifying upload...');

    const snapshot = await db.collection(COLLECTION_NAME).get();
    const actualCount = snapshot.size;

    console.log(`Expected: ${expectedCount} concepts`);
    console.log(`Actual: ${actualCount} concepts`);

    if (actualCount === expectedCount) {
        console.log('✓ Upload verification successful!');
        return true;
    } else {
        console.warn(`⚠ Upload incomplete! Missing ${expectedCount - actualCount} concepts`);
        return false;
    }
}

// Update Firestore security rules
async function updateSecurityRules() {
    const rulesFile = path.join(NEW_REPO_BASE, 'firestore.rules');
    let existingRules = '';

    if (fs.existsSync(rulesFile)) {
        existingRules = fs.readFileSync(rulesFile, 'utf-8');
    }

    if (!existingRules.includes('match /concepts/{conceptId}')) {
        const conceptRules = `
    // Concepts collection - public read, authenticated write
    match /concepts/{conceptId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Authenticated users only
      allow create: if request.auth != null && request.auth.token.email_verified == true;
      allow update: if request.auth != null && request.auth.token.email_verified == true;
      allow delete: if request.auth != null && request.auth.token.admin == true;
    }

    // Concept search index
    match /conceptsIndex/{indexId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }`;

        // Insert before the closing braces
        const updatedRules = existingRules.replace(
            /(\s*)\}\s*\}\s*$/,
            `${conceptRules}\n  }\n}`
        );

        fs.writeFileSync(rulesFile, updatedRules, 'utf-8');
        console.log(`\nSecurity rules updated: ${rulesFile}`);
        console.log('Deploy with: firebase deploy --only firestore:rules');
    } else {
        console.log('\nSecurity rules already configured for concepts collection');
    }
}

// Generate statistics
function generateStats(concepts) {
    const stats = {
        total: concepts.length,
        byMythology: {},
        byConceptType: {},
        byConceptSubtype: {},
        withOpposites: 0,
        withPersonifications: 0,
        withRelatedConcepts: 0,
        averageRelatedConcepts: 0
    };

    let totalRelated = 0;

    concepts.forEach(concept => {
        // By mythology
        concept.mythologies.forEach(myth => {
            stats.byMythology[myth] = (stats.byMythology[myth] || 0) + 1;
        });

        // By type
        stats.byConceptType[concept.conceptType] =
            (stats.byConceptType[concept.conceptType] || 0) + 1;

        // By subtype
        if (concept.conceptSubtype) {
            stats.byConceptSubtype[concept.conceptSubtype] =
                (stats.byConceptSubtype[concept.conceptSubtype] || 0) + 1;
        }

        // Relationships
        if (concept.opposites && concept.opposites.length > 0) {
            stats.withOpposites++;
        }
        if (concept.personifications && concept.personifications.length > 0) {
            stats.withPersonifications++;
        }
        if (concept.relatedConcepts && concept.relatedConcepts.length > 0) {
            stats.withRelatedConcepts++;
            totalRelated += concept.relatedConcepts.length;
        }
    });

    stats.averageRelatedConcepts = (totalRelated / concepts.length).toFixed(2);

    return stats;
}

// Main execution
async function main() {
    console.log('=== Firebase Concepts Upload ===\n');

    // Load concepts
    if (!fs.existsSync(IMPORT_FILE)) {
        throw new Error(`Import file not found: ${IMPORT_FILE}`);
    }

    const data = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf-8'));
    const concepts = data.concepts || data;
    console.log(`Loaded ${concepts.length} concepts from ${IMPORT_FILE}`);

    // Generate statistics
    const stats = generateStats(concepts);
    console.log('\n--- Concept Statistics ---');
    console.log(`Total concepts: ${stats.total}`);
    console.log(`\nBy Mythology:`);
    Object.entries(stats.byMythology)
        .sort((a, b) => b[1] - a[1])
        .forEach(([myth, count]) => {
            console.log(`  ${myth}: ${count}`);
        });
    console.log(`\nBy Type:`);
    Object.entries(stats.byConceptType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log(`\nRelationships:`);
    console.log(`  With opposites: ${stats.withOpposites}`);
    console.log(`  With personifications: ${stats.withPersonifications}`);
    console.log(`  With related concepts: ${stats.withRelatedConcepts}`);
    console.log(`  Average related concepts: ${stats.averageRelatedConcepts}`);

    // Initialize Firebase
    console.log('\nInitializing Firebase...');
    const db = initializeFirebase();
    console.log('✓ Firebase initialized');

    // Upload concepts
    console.log('\n--- Starting Upload ---');
    const results = await uploadConcepts(db, concepts);

    // Display results
    console.log('\n=== Upload Complete ===');
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(e => {
            console.log(`  - ${e.conceptId || 'batch ' + e.batch}: ${e.error}`);
        });
    }

    // Verify upload
    await verifyUpload(db, concepts.length);

    // Create indexes
    await createIndexes(db);

    // Update security rules
    await updateSecurityRules();

    // Generate upload report
    const report = {
        timestamp: new Date().toISOString(),
        totalConcepts: concepts.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        collection: COLLECTION_NAME,
        statistics: stats
    };

    const reportFile = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'concepts-upload-report.json');
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

module.exports = { main, uploadConcepts, verifyUpload, generateStats };
