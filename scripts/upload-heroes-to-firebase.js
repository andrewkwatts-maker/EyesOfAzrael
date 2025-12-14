#!/usr/bin/env node

/**
 * Upload Heroes to Firebase Firestore
 *
 * This script uploads hero entities from the migration output to Firebase Firestore.
 * It includes batch operations, verification queries, and error handling.
 *
 * Usage:
 *   node upload-heroes-to-firebase.js --dry-run    # Preview without uploading
 *   node upload-heroes-to-firebase.js              # Upload to Firebase
 *   node upload-heroes-to-firebase.js --verify     # Verify existing data
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Configuration
const BASE_DIR = path.join(__dirname, '..');
const HEROES_FILE = path.join(BASE_DIR, 'data', 'firebase-imports', 'heroes-supplement.json');
const SERVICE_ACCOUNT_PATH = path.join(BASE_DIR, 'firebase-service-account.json');

// Firebase configuration
let db;
const COLLECTION_NAME = 'heroes';
const BATCH_SIZE = 500; // Firestore limit

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
    if (admin.apps.length > 0) {
        console.log('Firebase already initialized');
        db = admin.firestore();
        return;
    }

    try {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });

        db = admin.firestore();
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        console.error('   Make sure firebase-service-account.json exists in project root');
        process.exit(1);
    }
}

/**
 * Load heroes from JSON file
 */
function loadHeroes() {
    if (!fs.existsSync(HEROES_FILE)) {
        console.error(`❌ Heroes file not found: ${HEROES_FILE}`);
        console.error('   Run migrate-heroes-to-template.js first');
        process.exit(1);
    }

    try {
        const data = fs.readFileSync(HEROES_FILE, 'utf8');
        const heroes = JSON.parse(data);

        console.log(`✅ Loaded ${heroes.length} heroes from ${HEROES_FILE}`);
        return heroes;
    } catch (error) {
        console.error('❌ Failed to load heroes:', error.message);
        process.exit(1);
    }
}

/**
 * Validate hero object before upload
 */
function validateHero(hero) {
    const errors = [];

    // Required fields
    if (!hero.id) errors.push('Missing id');
    if (!hero.type) errors.push('Missing type');
    if (!hero.name) errors.push('Missing name');
    if (!hero.mythologies || hero.mythologies.length === 0) errors.push('Missing mythologies');

    // Type should be 'hero'
    if (hero.type !== 'hero') errors.push(`Invalid type: ${hero.type} (should be 'hero')`);

    // ID format
    if (hero.id && !/^[a-z0-9_-]+$/.test(hero.id)) {
        errors.push(`Invalid id format: ${hero.id} (must be lowercase alphanumeric with hyphens/underscores)`);
    }

    return errors;
}

/**
 * Upload heroes in batches
 */
async function uploadHeroes(heroes, dryRun = false) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(dryRun ? 'DRY RUN MODE - No data will be uploaded' : 'UPLOADING HEROES TO FIREBASE');
    console.log('='.repeat(60));

    const stats = {
        total: heroes.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    // Process in batches
    for (let i = 0; i < heroes.length; i += BATCH_SIZE) {
        const batch = heroes.slice(i, Math.min(i + BATCH_SIZE, heroes.length));
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(heroes.length / BATCH_SIZE);

        console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} heroes)`);

        if (dryRun) {
            // Validate only
            batch.forEach(hero => {
                const errors = validateHero(hero);
                if (errors.length > 0) {
                    console.log(`  ❌ ${hero.id || 'unknown'}: ${errors.join(', ')}`);
                    stats.failed++;
                    stats.errors.push({ id: hero.id, errors });
                } else {
                    console.log(`  ✅ ${hero.id} - Valid`);
                    stats.successful++;
                }
            });
        } else {
            // Upload to Firestore
            const firestoreBatch = db.batch();

            batch.forEach(hero => {
                const errors = validateHero(hero);
                if (errors.length > 0) {
                    console.log(`  ❌ ${hero.id || 'unknown'}: ${errors.join(', ')}`);
                    stats.failed++;
                    stats.errors.push({ id: hero.id, errors });
                    return;
                }

                try {
                    const docRef = db.collection(COLLECTION_NAME).doc(hero.id);

                    // Add timestamp fields
                    const heroData = {
                        ...hero,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        uploadedAt: admin.firestore.FieldValue.serverTimestamp()
                    };

                    firestoreBatch.set(docRef, heroData, { merge: true });
                    console.log(`  ✅ Queued: ${hero.id}`);
                } catch (error) {
                    console.log(`  ❌ ${hero.id}: ${error.message}`);
                    stats.failed++;
                    stats.errors.push({ id: hero.id, errors: [error.message] });
                }
            });

            // Commit batch
            try {
                await firestoreBatch.commit();
                stats.successful += batch.filter(h => validateHero(h).length === 0).length;
                console.log(`  ✅ Batch committed successfully`);
            } catch (error) {
                console.error(`  ❌ Batch commit failed:`, error.message);
                stats.failed += batch.length;
            }
        }
    }

    return stats;
}

/**
 * Verify uploaded heroes
 */
async function verifyUpload(heroes) {
    console.log('\n📊 Verifying upload...\n');

    const stats = {
        totalExpected: heroes.length,
        found: 0,
        missing: [],
        mismatched: []
    };

    for (const hero of heroes) {
        try {
            const docRef = db.collection(COLLECTION_NAME).doc(hero.id);
            const doc = await docRef.get();

            if (doc.exists) {
                stats.found++;
                const data = doc.data();

                // Verify key fields
                if (data.name !== hero.name) {
                    stats.mismatched.push({
                        id: hero.id,
                        field: 'name',
                        expected: hero.name,
                        actual: data.name
                    });
                }
            } else {
                stats.missing.push(hero.id);
            }
        } catch (error) {
            console.error(`  Error verifying ${hero.id}:`, error.message);
            stats.missing.push(hero.id);
        }
    }

    console.log(`✅ Found: ${stats.found}/${stats.totalExpected}`);

    if (stats.missing.length > 0) {
        console.log(`❌ Missing: ${stats.missing.length}`);
        stats.missing.forEach(id => console.log(`   - ${id}`));
    }

    if (stats.mismatched.length > 0) {
        console.log(`⚠️  Mismatched: ${stats.mismatched.length}`);
        stats.mismatched.forEach(m => console.log(`   - ${m.id}: ${m.field} (expected: ${m.expected}, got: ${m.actual})`));
    }

    return stats;
}

/**
 * Query existing heroes in Firebase
 */
async function queryExistingHeroes() {
    console.log('🔍 Querying existing heroes in Firebase...\n');

    try {
        const snapshot = await db.collection(COLLECTION_NAME).get();

        console.log(`Total heroes in collection: ${snapshot.size}`);

        const byMythology = {};
        const bySource = {};

        snapshot.forEach(doc => {
            const data = doc.data();

            // Count by mythology
            if (data.mythologies) {
                data.mythologies.forEach(myth => {
                    byMythology[myth] = (byMythology[myth] || 0) + 1;
                });
            }

            // Count by source
            const source = data.migratedFrom || 'unknown';
            bySource[source] = (bySource[source] || 0) + 1;
        });

        console.log('\nBy Mythology:');
        Object.entries(byMythology)
            .sort((a, b) => b[1] - a[1])
            .forEach(([myth, count]) => console.log(`  ${myth}: ${count}`));

        console.log('\nBy Source:');
        Object.entries(bySource)
            .forEach(([source, count]) => console.log(`  ${source}: ${count}`));

        return {
            total: snapshot.size,
            byMythology,
            bySource
        };
    } catch (error) {
        console.error('❌ Query failed:', error.message);
        return null;
    }
}

/**
 * Delete specific heroes (for testing/cleanup)
 */
async function deleteHeroes(heroIds) {
    console.log(`🗑️  Deleting ${heroIds.length} heroes...\n`);

    const batch = db.batch();

    heroIds.forEach(id => {
        const docRef = db.collection(COLLECTION_NAME).doc(id);
        batch.delete(docRef);
    });

    try {
        await batch.commit();
        console.log('✅ Heroes deleted successfully');
    } catch (error) {
        console.error('❌ Deletion failed:', error.message);
    }
}

/**
 * Generate upload report
 */
function generateReport(stats, verifyStats) {
    const report = {
        timestamp: new Date().toISOString(),
        upload: stats,
        verification: verifyStats,
        summary: {
            successRate: ((stats.successful / stats.total) * 100).toFixed(2) + '%',
            verificationRate: verifyStats
                ? ((verifyStats.found / verifyStats.totalExpected) * 100).toFixed(2) + '%'
                : 'N/A'
        }
    };

    const reportPath = path.join(BASE_DIR, 'data', 'firebase-imports', 'heroes-upload-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`\n📝 Report saved to: ${reportPath}`);
    return report;
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const verifyOnly = args.includes('--verify');
    const queryOnly = args.includes('--query');

    console.log('🔥 Firebase Heroes Upload Script\n');

    // Initialize Firebase
    initializeFirebase();

    // Query only mode
    if (queryOnly) {
        await queryExistingHeroes();
        return;
    }

    // Load heroes
    const heroes = loadHeroes();

    // Verify only mode
    if (verifyOnly) {
        await verifyUpload(heroes);
        return;
    }

    // Upload heroes
    const uploadStats = await uploadHeroes(heroes, dryRun);

    console.log('\n' + '='.repeat(60));
    console.log('UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${uploadStats.total}`);
    console.log(`Successful: ${uploadStats.successful}`);
    console.log(`Failed: ${uploadStats.failed}`);
    console.log(`Skipped: ${uploadStats.skipped}`);

    if (uploadStats.errors.length > 0) {
        console.log('\nErrors:');
        uploadStats.errors.forEach(e => {
            console.log(`  ${e.id}: ${e.errors.join(', ')}`);
        });
    }

    // Verify upload (if not dry run)
    let verifyStats = null;
    if (!dryRun && uploadStats.successful > 0) {
        console.log('\n⏳ Waiting 3 seconds for Firestore to index...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        verifyStats = await verifyUpload(heroes);
    }

    // Generate report
    if (!dryRun) {
        generateReport(uploadStats, verifyStats);
    }

    console.log('\n✅ Complete!');
}

// Run if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    initializeFirebase,
    uploadHeroes,
    verifyUpload,
    queryExistingHeroes
};
