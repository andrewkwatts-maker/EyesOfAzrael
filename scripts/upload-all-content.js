#!/usr/bin/env node

/**
 * Upload All Content Types to Firestore
 * Eyes of Azrael - Complete Migration
 *
 * This script uploads ALL parsed content types to Firestore:
 * - Deities
 * - Heroes
 * - Creatures
 * - Cosmology
 * - Herbs
 * - Rituals
 * - Texts
 * - Symbols
 * - Concepts
 * - Search indexes
 *
 * Usage:
 *   node upload-all-content.js --dry-run
 *   node upload-all-content.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
    serviceAccount = require('../firebase-service-account.json');
} catch (error) {
    console.error('❌ firebase-service-account.json not found!');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Paths
const PARSED_DATA_DIR = path.join(__dirname, '../parsed_data');
const SEARCH_INDEX_DIR = path.join(__dirname, '../search_indexes');

// Content type to collection mapping
const COLLECTION_MAP = {
    'deities': 'deities',
    'heroes': 'heroes',
    'creatures': 'creatures',
    'beings': 'creatures',
    'spirits': 'creatures',
    'cosmology': 'cosmology',
    'realms': 'cosmology',
    'places': 'cosmology',
    'herbs': 'herbs',
    'rituals': 'rituals',
    'magic': 'rituals',
    'texts': 'texts',
    'symbols': 'symbols',
    'concepts': 'concepts',
    'events': 'concepts',
    'myths': 'concepts',
    'figures': 'heroes'
};

/**
 * Upload content items in batches
 */
async function uploadContentBatch(collection, items, dryRun = false) {
    console.log(`\n📦 Uploading ${items.length} items to ${collection}`);

    if (dryRun) {
        console.log(`   [DRY RUN] Would upload ${items.length} items`);
        items.slice(0, 3).forEach(item => {
            console.log(`      - ${item.id}: ${item.name || item.title || 'Unnamed'}`);
        });
        if (items.length > 3) {
            console.log(`      ... and ${items.length - 3} more`);
        }
        return { success: true, count: items.length, dryRun: true };
    }

    const BATCH_SIZE = 500;
    let uploadedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = items.slice(i, i + BATCH_SIZE);

        chunk.forEach(item => {
            const docRef = db.collection(collection).doc(item.id);
            batch.set(docRef, item, { merge: true });
        });

        try {
            await batch.commit();
            uploadedCount += chunk.length;
            console.log(`   ✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} items`);
        } catch (error) {
            console.error(`   ❌ Error uploading batch:`, error.message);
            failedCount += chunk.length;
        }
    }

    console.log(`   📊 Total: ${uploadedCount} uploaded, ${failedCount} failed`);
    return { success: failedCount === 0, uploaded: uploadedCount, failed: failedCount };
}

/**
 * Process all parsed data files
 */
async function uploadAllContent(dryRun = false) {
    console.log('🚀 Uploading All Content to Firestore');
    console.log('━'.repeat(80));

    if (dryRun) {
        console.log('⚠️  Running in DRY RUN mode - no data will be uploaded\n');
    }

    const stats = {
        collections: {},
        totalUploaded: 0,
        totalFailed: 0
    };

    // Find all parsed JSON files
    const parsedFiles = fs.readdirSync(PARSED_DATA_DIR)
        .filter(f => f.endsWith('_parsed.json') && !f.startsWith('all_') && !f.includes('quality') && !f.includes('stats'));

    console.log(`📁 Found ${parsedFiles.length} parsed data files\n`);

    // Upload each content type
    for (const filename of parsedFiles) {
        const filePath = path.join(PARSED_DATA_DIR, filename);
        const contentType = filename.replace('_parsed.json', '');
        const collection = COLLECTION_MAP[contentType] || contentType;

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const items = data.items || data.deities || [];

            if (items.length === 0) {
                console.log(`⏭️  Skipping ${contentType} (no items)`);
                continue;
            }

            const result = await uploadContentBatch(collection, items, dryRun);

            if (!stats.collections[collection]) {
                stats.collections[collection] = { uploaded: 0, failed: 0 };
            }
            stats.collections[collection].uploaded += result.uploaded || 0;
            stats.collections[collection].failed += result.failed || 0;
            stats.totalUploaded += result.uploaded || 0;
            stats.totalFailed += result.failed || 0;

        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error.message);
        }
    }

    return stats;
}

/**
 * Upload search indexes
 */
async function uploadSearchIndexes(dryRun = false) {
    console.log('\n🔍 Uploading search indexes...');

    const indexPath = path.join(SEARCH_INDEX_DIR, 'firestore_search_index.json');
    if (!fs.existsSync(indexPath)) {
        console.log('⚠️  Search index not found, skipping');
        return;
    }

    const indexes = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

    if (dryRun) {
        console.log(`   [DRY RUN] Would upload ${indexes.length} search index documents`);
        return;
    }

    const BATCH_SIZE = 500;
    let uploadedCount = 0;

    for (let i = 0; i < indexes.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = indexes.slice(i, i + BATCH_SIZE);

        chunk.forEach(index => {
            const { _collection, ...indexData } = index;
            const docRef = db.collection('search_index').doc(index.id);
            batch.set(docRef, indexData, { merge: true });
        });

        try {
            await batch.commit();
            uploadedCount += chunk.length;
            console.log(`   ✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} indexes`);
        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
        }
    }

    console.log(`   📊 Total: ${uploadedCount} search indexes uploaded`);
}

/**
 * Upload cross-references
 */
async function uploadCrossReferences(dryRun = false) {
    console.log('\n🔗 Uploading cross-references...');

    const crossRefPath = path.join(SEARCH_INDEX_DIR, 'cross_references.json');
    if (!fs.existsSync(crossRefPath)) {
        console.log('⚠️  Cross-references not found, skipping');
        return;
    }

    const crossRefs = JSON.parse(fs.readFileSync(crossRefPath, 'utf-8'));
    const crossRefArray = Object.values(crossRefs);

    if (dryRun) {
        console.log(`   [DRY RUN] Would upload ${crossRefArray.length} cross-reference maps`);
        return;
    }

    const BATCH_SIZE = 500;
    let uploadedCount = 0;

    for (let i = 0; i < crossRefArray.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = crossRefArray.slice(i, i + BATCH_SIZE);

        chunk.forEach(ref => {
            const docRef = db.collection('cross_references').doc(ref.id);
            batch.set(docRef, ref, { merge: true });
        });

        try {
            await batch.commit();
            uploadedCount += chunk.length;
            console.log(`   ✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} references`);
        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
        }
    }

    console.log(`   📊 Total: ${uploadedCount} cross-references uploaded`);
}

/**
 * Print summary
 */
function printSummary(stats) {
    console.log('\n' + '━'.repeat(80));
    console.log('📊 Upload Summary');
    console.log('━'.repeat(80));

    console.log('\nBy Collection:');
    Object.entries(stats.collections)
        .sort((a, b) => b[1].uploaded - a[1].uploaded)
        .forEach(([collection, data]) => {
            const status = data.failed > 0 ? '⚠️' : '✅';
            console.log(`   ${status} ${collection.padEnd(20)} ${data.uploaded.toString().padStart(4)} uploaded, ${data.failed} failed`);
        });

    console.log(`\n   Total: ${stats.totalUploaded} uploaded, ${stats.totalFailed} failed`);
    console.log('\n✅ Upload complete!\n');
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    try {
        // Upload all content
        const stats = await uploadAllContent(dryRun);

        // Upload search indexes
        await uploadSearchIndexes(dryRun);

        // Upload cross-references
        await uploadCrossReferences(dryRun);

        // Print summary
        printSummary(stats);

        if (!dryRun) {
            console.log('📝 Next steps:');
            console.log('   1. Verify data: https://console.firebase.google.com/project/eyesofazrael/firestore');
            console.log('   2. Test queries in Firebase Console');
            console.log('   3. Test frontend: python -m http.server 8000\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}
