#!/usr/bin/env node

/**
 * Firebase Enriched Assets Upload Script
 *
 * Uploads all enriched assets from firebase-assets-downloaded to Firebase Firestore.
 * This handles all entity collections: deities, creatures, heroes, items, places,
 * herbs, rituals, texts, symbols, concepts, cosmology, etc.
 *
 * Usage:
 *   node scripts/upload-enriched-assets-to-firebase.js [--dry-run] [--collection=name] [--filter=pattern]
 *
 * Options:
 *   --dry-run         : Preview uploads without modifying Firebase
 *   --collection=name : Only upload a specific collection (e.g., --collection=deities)
 *   --filter=pattern  : Only upload entities matching the pattern
 *   --batch-size=N    : Set batch size (default: 100, max: 500)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const COLLECTION_FILTER = args.find(a => a.startsWith('--collection='))?.split('=')[1];
const PATTERN_FILTER = args.find(a => a.startsWith('--filter='))?.split('=')[1];
const BATCH_SIZE = Math.min(parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '100', 10), 500);

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

// Collections to upload (folder name -> Firestore collection name)
const COLLECTION_MAP = {
    'deities': 'deities',
    'creatures': 'creatures',
    'heroes': 'heroes',
    'items': 'items',
    'places': 'places',
    'herbs': 'herbs',
    'rituals': 'rituals',
    'texts': 'texts',
    'symbols': 'symbols',
    'concepts': 'concepts',
    'cosmology': 'cosmology',
    'archetypes': 'archetypes'
};

console.log('');
console.log('='.repeat(60));
console.log('  Firebase Enriched Assets Upload Script');
console.log('='.repeat(60));
console.log('');
console.log('Mode:', DRY_RUN ? '🔍 DRY RUN (preview only)' : '🚀 LIVE (will update Firebase)');
if (COLLECTION_FILTER) console.log('Collection:', COLLECTION_FILTER);
if (PATTERN_FILTER) console.log('Filter:', PATTERN_FILTER);
console.log('Batch Size:', BATCH_SIZE);
console.log('');

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let db = null;

function initializeFirebase() {
    try {
        if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
            throw new Error(`Service account file not found: ${SERVICE_ACCOUNT_PATH}`);
        }

        const serviceAccount = require(SERVICE_ACCOUNT_PATH);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'eyesofazrael'
        });

        db = admin.firestore();
        console.log('✓ Firebase initialized successfully\n');
        return db;

    } catch (error) {
        console.error('✗ Firebase initialization failed:');
        console.error('  ', error.message);
        process.exit(1);
    }
}

// ============================================================================
// FILE LOADING
// ============================================================================

function loadAssets(collectionFolder) {
    const collectionPath = path.join(ASSETS_DIR, collectionFolder);

    if (!fs.existsSync(collectionPath)) {
        console.log(`  ⚠ Collection folder not found: ${collectionFolder}`);
        return [];
    }

    const files = fs.readdirSync(collectionPath)
        .filter(f => f.endsWith('.json'))
        .filter(f => !f.startsWith('_')); // Skip meta files

    const assets = [];
    for (const file of files) {
        try {
            const filePath = path.join(collectionPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);

            // Skip if pattern filter doesn't match
            if (PATTERN_FILTER && !file.toLowerCase().includes(PATTERN_FILTER.toLowerCase())) {
                continue;
            }

            // Ensure required fields
            if (!data.id) {
                data.id = path.basename(file, '.json');
            }

            assets.push({
                file,
                data,
                id: data.id
            });
        } catch (error) {
            console.log(`  ⚠ Failed to parse: ${file} - ${error.message}`);
        }
    }

    return assets;
}

// ============================================================================
// UPLOAD LOGIC
// ============================================================================

/**
 * Clean data to be Firestore-compatible
 * Removes undefined values, converts Date objects, handles nested objects
 */
function sanitizeForFirestore(obj, path = '') {
    if (obj === undefined || obj === null) {
        return null;
    }

    // Handle primitives
    if (typeof obj !== 'object') {
        return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj.toISOString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item, i) => sanitizeForFirestore(item, `${path}[${i}]`)).filter(item => item !== undefined);
    }

    // Handle plain objects
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip undefined values and functions
        if (value === undefined || typeof value === 'function') {
            continue;
        }

        // Skip special fields that might cause issues
        if (key.startsWith('__') || key === 'constructor') {
            continue;
        }

        const sanitized = sanitizeForFirestore(value, `${path}.${key}`);
        if (sanitized !== undefined) {
            result[key] = sanitized;
        }
    }
    return result;
}

async function uploadBatch(collectionName, assets) {
    if (DRY_RUN) {
        console.log(`  📋 Would upload ${assets.length} documents to ${collectionName}`);
        return { success: assets.length, failed: 0 };
    }

    const batch = db.batch();
    let count = 0;
    let skipped = 0;

    for (const asset of assets) {
        try {
            const docRef = db.collection(collectionName).doc(asset.id);

            // Sanitize data for Firestore
            const cleanData = sanitizeForFirestore(asset.data);

            if (!cleanData || typeof cleanData !== 'object') {
                console.log(`  ⚠ Skipping invalid document: ${asset.id}`);
                skipped++;
                continue;
            }

            // Add updated timestamp
            cleanData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            cleanData._uploadedAt = new Date().toISOString();

            batch.set(docRef, cleanData, { merge: true });
            count++;
        } catch (err) {
            console.log(`  ⚠ Error preparing ${asset.id}: ${err.message}`);
            skipped++;
        }
    }

    if (count === 0) {
        return { success: 0, failed: skipped };
    }

    try {
        await batch.commit();
        return { success: count, failed: skipped };
    } catch (error) {
        console.error(`  ✗ Batch failed: ${error.message}`);
        return { success: 0, failed: count + skipped };
    }
}

async function uploadCollection(folderName, collectionName) {
    console.log(`\n📁 Processing: ${folderName} → ${collectionName}`);

    const assets = loadAssets(folderName);

    if (assets.length === 0) {
        console.log('  ⚠ No assets found to upload');
        return { success: 0, failed: 0, skipped: 0 };
    }

    console.log(`  📊 Found ${assets.length} assets`);

    let totalSuccess = 0;
    let totalFailed = 0;

    // Upload in batches
    for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batchAssets = assets.slice(i, i + BATCH_SIZE);
        const result = await uploadBatch(collectionName, batchAssets);
        totalSuccess += result.success;
        totalFailed += result.failed;

        if (!DRY_RUN && result.success > 0) {
            console.log(`  ✓ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.success} documents`);
        }
    }

    return { success: totalSuccess, failed: totalFailed };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    initializeFirebase();

    const summary = {
        collections: 0,
        success: 0,
        failed: 0,
        startTime: Date.now()
    };

    // Determine which collections to process
    const collectionsToProcess = COLLECTION_FILTER
        ? { [COLLECTION_FILTER]: COLLECTION_MAP[COLLECTION_FILTER] || COLLECTION_FILTER }
        : COLLECTION_MAP;

    // Process each collection
    for (const [folder, collection] of Object.entries(collectionsToProcess)) {
        const result = await uploadCollection(folder, collection);
        summary.collections++;
        summary.success += result.success;
        summary.failed += result.failed;
    }

    // Print summary
    const elapsed = ((Date.now() - summary.startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log('  UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Collections processed: ${summary.collections}`);
    console.log(`  Documents uploaded:    ${summary.success}`);
    console.log(`  Documents failed:      ${summary.failed}`);
    console.log(`  Time elapsed:          ${elapsed}s`);
    console.log('='.repeat(60) + '\n');

    if (DRY_RUN) {
        console.log('💡 This was a dry run. Use without --dry-run to actually upload.\n');
    }

    process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
