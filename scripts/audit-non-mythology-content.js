#!/usr/bin/env node

/**
 * Non-Mythology Content Audit Script
 *
 * Audits migration status of:
 * - Magic Systems (magic/, data/entities/magic)
 * - Herbalism (herbalism/, herbs in mythos)
 * - Items & Artifacts (spiritual-items/, data/entities/item)
 * - Theories (theories/)
 * - Places (spiritual-places/, data/entities/place)
 * - Creatures (data/entities/creature)
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Paths
const OLD_REPO = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael';
const NEW_REPO = 'H:\\Github\\EyesOfAzrael';

// Initialize Firebase
const serviceAccountPath = path.join(NEW_REPO, 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account file not found:', serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'eyesofazrael'
});

const db = admin.firestore();

// Helper function to find files recursively
function findFiles(dir, pattern = /\.html$|\.json$/) {
    const results = [];

    if (!fs.existsSync(dir)) {
        return results;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results.push(...findFiles(fullPath, pattern));
        } else if (pattern.test(file)) {
            results.push(fullPath);
        }
    }

    return results;
}

// Helper function to read JSON file
function readJSON(filepath) {
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (err) {
        console.error(`Error reading ${filepath}:`, err.message);
        return null;
    }
}

// Helper function to query Firestore collection
async function getCollectionDocs(collectionName) {
    try {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error(`Error querying ${collectionName}:`, err.message);
        return [];
    }
}

// Main audit function
async function auditContent() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  NON-MYTHOLOGY CONTENT MIGRATION AUDIT');
    console.log('═══════════════════════════════════════════════════════\n');

    const report = {
        timestamp: new Date().toISOString(),
        categories: {},
        summary: {
            totalOldFiles: 0,
            totalNewFiles: 0,
            totalFirestoreDocs: 0,
            missingInNew: [],
            missingInFirestore: []
        }
    };

    // ==================== MAGIC SYSTEMS ====================
    console.log('📚 1. AUDITING MAGIC SYSTEMS...\n');

    const magicOldHTML = findFiles(path.join(OLD_REPO, 'magic'), /\.html$/);
    const magicOldJSON = findFiles(path.join(OLD_REPO, 'data', 'entities', 'magic'), /\.json$/);
    const magicNewHTML = findFiles(path.join(NEW_REPO, 'magic'), /\.html$/);
    const magicNewJSON = findFiles(path.join(NEW_REPO, 'data', 'entities', 'magic'), /\.json$/);
    const magicFirestore = await getCollectionDocs('magic');

    report.categories.magic = {
        oldRepo: {
            html: magicOldHTML.length,
            json: magicOldJSON.length,
            total: magicOldHTML.length + magicOldJSON.length,
            files: { html: magicOldHTML, json: magicOldJSON }
        },
        newRepo: {
            html: magicNewHTML.length,
            json: magicNewJSON.length,
            total: magicNewHTML.length + magicNewJSON.length
        },
        firestore: {
            count: magicFirestore.length,
            ids: magicFirestore.map(d => d.id)
        }
    };

    console.log(`  Old Repo: ${magicOldHTML.length} HTML + ${magicOldJSON.length} JSON = ${magicOldHTML.length + magicOldJSON.length} files`);
    console.log(`  New Repo: ${magicNewHTML.length} HTML + ${magicNewJSON.length} JSON = ${magicNewHTML.length + magicNewJSON.length} files`);
    console.log(`  Firestore: ${magicFirestore.length} documents`);
    console.log('');

    // ==================== HERBALISM ====================
    console.log('🌿 2. AUDITING HERBALISM...\n');

    const herbsOldHTML = findFiles(path.join(OLD_REPO, 'herbalism'), /\.html$/);
    const herbsNewHTML = findFiles(path.join(NEW_REPO, 'herbalism'), /\.html$/);
    const herbsFirestore = await getCollectionDocs('herbs');

    report.categories.herbalism = {
        oldRepo: {
            html: herbsOldHTML.length,
            total: herbsOldHTML.length,
            files: { html: herbsOldHTML }
        },
        newRepo: {
            html: herbsNewHTML.length,
            total: herbsNewHTML.length
        },
        firestore: {
            count: herbsFirestore.length,
            ids: herbsFirestore.map(d => d.id)
        }
    };

    console.log(`  Old Repo: ${herbsOldHTML.length} HTML files`);
    console.log(`  New Repo: ${herbsNewHTML.length} HTML files`);
    console.log(`  Firestore: ${herbsFirestore.length} documents`);
    console.log('');

    // ==================== ITEMS & ARTIFACTS ====================
    console.log('⚔️ 3. AUDITING ITEMS & ARTIFACTS...\n');

    const itemsOldHTML = findFiles(path.join(OLD_REPO, 'spiritual-items'), /\.html$/);
    const itemsOldJSON = findFiles(path.join(OLD_REPO, 'data', 'entities', 'item'), /\.json$/);
    const itemsNewHTML = findFiles(path.join(NEW_REPO, 'spiritual-items'), /\.html$/);
    const itemsNewJSON = findFiles(path.join(NEW_REPO, 'data', 'entities', 'item'), /\.json$/);
    const itemsFirestore = await getCollectionDocs('items');

    report.categories.items = {
        oldRepo: {
            html: itemsOldHTML.length,
            json: itemsOldJSON.length,
            total: itemsOldHTML.length + itemsOldJSON.length,
            files: { html: itemsOldHTML, json: itemsOldJSON }
        },
        newRepo: {
            html: itemsNewHTML.length,
            json: itemsNewJSON.length,
            total: itemsNewHTML.length + itemsNewJSON.length
        },
        firestore: {
            count: itemsFirestore.length,
            ids: itemsFirestore.map(d => d.id)
        }
    };

    console.log(`  Old Repo: ${itemsOldHTML.length} HTML + ${itemsOldJSON.length} JSON = ${itemsOldHTML.length + itemsOldJSON.length} files`);
    console.log(`  New Repo: ${itemsNewHTML.length} HTML + ${itemsNewJSON.length} JSON = ${itemsNewHTML.length + itemsNewJSON.length} files`);
    console.log(`  Firestore: ${itemsFirestore.length} documents`);
    console.log('');

    // ==================== THEORIES ====================
    console.log('💭 4. AUDITING THEORIES...\n');

    const theoriesOldHTML = findFiles(path.join(OLD_REPO, 'theories'), /\.html$/);
    const theoriesNewHTML = findFiles(path.join(NEW_REPO, 'theories'), /\.html$/);
    const theoriesFirestore = await getCollectionDocs('theories');

    report.categories.theories = {
        oldRepo: {
            html: theoriesOldHTML.length,
            total: theoriesOldHTML.length,
            files: { html: theoriesOldHTML }
        },
        newRepo: {
            html: theoriesNewHTML.length,
            total: theoriesNewHTML.length
        },
        firestore: {
            count: theoriesFirestore.length,
            ids: theoriesFirestore.map(d => d.id)
        }
    };

    console.log(`  Old Repo: ${theoriesOldHTML.length} HTML files`);
    console.log(`  New Repo: ${theoriesNewHTML.length} HTML files`);
    console.log(`  Firestore: ${theoriesFirestore.length} documents`);
    console.log('');

    // ==================== PLACES ====================
    console.log('🏛️ 5. AUDITING PLACES...\n');

    const placesOldHTML = findFiles(path.join(OLD_REPO, 'spiritual-places'), /\.html$/);
    const placesOldJSON = findFiles(path.join(OLD_REPO, 'data', 'entities', 'place'), /\.json$/);
    const placesNewHTML = findFiles(path.join(NEW_REPO, 'spiritual-places'), /\.html$/);
    const placesNewJSON = findFiles(path.join(NEW_REPO, 'data', 'entities', 'place'), /\.json$/);
    const placesFirestore = await getCollectionDocs('places');

    report.categories.places = {
        oldRepo: {
            html: placesOldHTML.length,
            json: placesOldJSON.length,
            total: placesOldHTML.length + placesOldJSON.length,
            files: { html: placesOldHTML, json: placesOldJSON }
        },
        newRepo: {
            html: placesNewHTML.length,
            json: placesNewJSON.length,
            total: placesNewHTML.length + placesNewJSON.length
        },
        firestore: {
            count: placesFirestore.length,
            ids: placesFirestore.map(d => d.id)
        }
    };

    console.log(`  Old Repo: ${placesOldHTML.length} HTML + ${placesOldJSON.length} JSON = ${placesOldHTML.length + placesOldJSON.length} files`);
    console.log(`  New Repo: ${placesNewHTML.length} HTML + ${placesNewJSON.length} JSON = ${placesNewHTML.length + placesNewJSON.length} files`);
    console.log(`  Firestore: ${placesFirestore.length} documents`);
    console.log('');

    // ==================== CREATURES ====================
    console.log('🐉 6. AUDITING CREATURES...\n');

    const creaturesOldJSON = findFiles(path.join(OLD_REPO, 'data', 'entities', 'creature'), /\.json$/);
    const creaturesNewJSON = findFiles(path.join(NEW_REPO, 'data', 'entities', 'creature'), /\.json$/);
    const creaturesFirestore = await getCollectionDocs('creatures');

    report.categories.creatures = {
        oldRepo: {
            json: creaturesOldJSON.length,
            total: creaturesOldJSON.length,
            files: { json: creaturesOldJSON }
        },
        newRepo: {
            json: creaturesNewJSON.length,
            total: creaturesNewJSON.length
        },
        firestore: {
            count: creaturesFirestore.length,
            ids: creaturesFirestore.map(d => d.id)
        }
    };

    console.log(`  Old Repo: ${creaturesOldJSON.length} JSON files`);
    console.log(`  New Repo: ${creaturesNewJSON.length} JSON files`);
    console.log(`  Firestore: ${creaturesFirestore.length} documents`);
    console.log('');

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    const categories = Object.keys(report.categories);
    let totalOld = 0;
    let totalNew = 0;
    let totalFirestore = 0;

    console.log('Category       | Old Repo | New Repo | Firestore | Status');
    console.log('---------------|----------|----------|-----------|--------');

    for (const cat of categories) {
        const data = report.categories[cat];
        const oldCount = data.oldRepo.total;
        const newCount = data.newRepo.total;
        const fsCount = data.firestore.count;

        totalOld += oldCount;
        totalNew += newCount;
        totalFirestore += fsCount;

        let status = '✅';
        if (fsCount === 0) status = '❌ MISSING';
        else if (fsCount < oldCount) status = '⚠️ PARTIAL';

        console.log(`${cat.padEnd(14)} | ${String(oldCount).padStart(8)} | ${String(newCount).padStart(8)} | ${String(fsCount).padStart(9)} | ${status}`);
    }

    console.log('---------------|----------|----------|-----------|--------');
    console.log(`${'TOTAL'.padEnd(14)} | ${String(totalOld).padStart(8)} | ${String(totalNew).padStart(8)} | ${String(totalFirestore).padStart(9)} |`);

    report.summary.totalOldFiles = totalOld;
    report.summary.totalNewFiles = totalNew;
    report.summary.totalFirestoreDocs = totalFirestore;

    console.log('\n');

    // Save report
    const reportPath = path.join(NEW_REPO, 'NON_MYTHOLOGY_CONTENT_AUDIT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✓ Full report saved: ${reportPath}\n`);

    // Check for critical gaps
    const missing = [];
    const partial = [];

    for (const cat of categories) {
        const data = report.categories[cat];
        if (data.firestore.count === 0) {
            missing.push(cat);
        } else if (data.firestore.count < data.oldRepo.total) {
            partial.push(cat);
        }
    }

    if (missing.length > 0) {
        console.log('❌ CRITICAL: The following categories are COMPLETELY MISSING from Firestore:');
        missing.forEach(cat => console.log(`   - ${cat}`));
        console.log('');
    }

    if (partial.length > 0) {
        console.log('⚠️ WARNING: The following categories are PARTIALLY migrated to Firestore:');
        partial.forEach(cat => {
            const data = report.categories[cat];
            console.log(`   - ${cat}: ${data.firestore.count}/${data.oldRepo.total} (${Math.round(data.firestore.count / data.oldRepo.total * 100)}%)`);
        });
        console.log('');
    }

    if (missing.length === 0 && partial.length === 0) {
        console.log('✅ ALL CATEGORIES FULLY MIGRATED!\n');
    }

    // Calculate migration completeness
    const completeness = totalFirestore > 0 ? Math.round((totalFirestore / totalOld) * 100) : 0;
    console.log(`📊 Overall Migration Completeness: ${completeness}%`);
    console.log(`   (${totalFirestore} / ${totalOld} files migrated)\n`);

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(missing.length > 0 ? 1 : 0);
}

// Run audit
auditContent().catch(err => {
    console.error('❌ Audit failed:', err);
    process.exit(1);
});
