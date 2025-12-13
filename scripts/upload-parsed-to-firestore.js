#!/usr/bin/env node

/**
 * Upload Parsed Data to Firestore
 *
 * This script takes the parsed JSON data and uploads it to Firebase Firestore
 * in batch operations for optimal performance.
 *
 * Usage:
 *   node upload-parsed-to-firestore.js
 *   node upload-parsed-to-firestore.js --mythology=greek
 *   node upload-parsed-to-firestore.js --dry-run
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
    console.error('   Please download from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Paths
const BASE_DIR = path.join(__dirname, '..');
const PARSED_DATA_DIR = path.join(BASE_DIR, 'parsed_data');

/**
 * Upload a single mythology to Firestore
 */
async function uploadMythology(mythologyId, data, dryRun = false) {
    console.log(`\n📦 Uploading mythology: ${mythologyId}`);

    if (dryRun) {
        console.log(`   [DRY RUN] Would upload mythology document`);
        return { success: true, dryRun: true };
    }

    const mythologyDoc = {
        id: mythologyId,
        displayName: data.mythology.title,
        icon: data.mythology.icon,
        description: data.mythology.description,
        heroTitle: data.mythology.heroTitle,
        sections: data.mythology.sections.map(s => s.type),
        stats: {
            deityCount: data.stats.totalDeities,
            archetypeCount: data.stats.totalArchetypes,
            domainCount: data.stats.totalDomains
        },
        metadata: {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            deityCount: data.stats.totalDeities
        }
    };

    try {
        await db.collection('mythologies').doc(mythologyId).set(mythologyDoc, { merge: true });
        console.log(`   ✅ Uploaded mythology document`);
        return { success: true };
    } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Upload deities in batches
 */
async function uploadDeities(mythologyId, deities, dryRun = false) {
    console.log(`\n📦 Uploading ${deities.length} deities for ${mythologyId}`);

    if (dryRun) {
        console.log(`   [DRY RUN] Would upload ${deities.length} deities`);
        deities.slice(0, 3).forEach(deity => {
            console.log(`      - ${deity.id}: ${deity.name}`);
        });
        if (deities.length > 3) {
            console.log(`      ... and ${deities.length - 3} more`);
        }
        return { success: true, count: deities.length, dryRun: true };
    }

    const BATCH_SIZE = 500; // Firestore batch limit
    let uploadedCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < deities.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = deities.slice(i, i + BATCH_SIZE);

        chunk.forEach(deity => {
            const deityDoc = {
                id: deity.id,
                name: deity.name,
                displayName: deity.displayName || deity.name,
                mythology: mythologyId,
                title: deity.title,
                description: deity.description,
                archetypes: deity.archetypes || [],
                domains: deity.domains || [],
                symbols: deity.symbols || [],
                epithets: deity.epithets || [],
                attributes: deity.attributes || [],
                relationships: deity.relationships || {},
                primarySources: deity.primarySources || [],
                relatedEntities: deity.relatedEntities || [],
                metadata: {
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'system',
                    source: 'html_parser',
                    verified: false,
                    submissionType: 'system'
                }
            };

            const docRef = db.collection('deities').doc(`${mythologyId}_${deity.id}`);
            batch.set(docRef, deityDoc);
        });

        try {
            await batch.commit();
            uploadedCount += chunk.length;
            console.log(`   ✅ Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} deities`);
        } catch (error) {
            console.error(`   ❌ Batch error:`, error.message);
            errorCount += chunk.length;
        }
    }

    console.log(`   📊 Total: ${uploadedCount} uploaded, ${errorCount} failed`);

    return {
        success: errorCount === 0,
        uploaded: uploadedCount,
        failed: errorCount
    };
}

/**
 * Extract and upload archetypes from all mythologies
 */
async function uploadArchetypes(allReports, dryRun = false) {
    console.log(`\n📦 Extracting and uploading archetypes`);

    // Collect all unique archetypes
    const archetypeMap = new Map();

    Object.entries(allReports).forEach(([mythId, data]) => {
        data.deities.forEach(deity => {
            deity.archetypes.forEach(archetype => {
                const archetypeId = archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                if (!archetypeMap.has(archetypeId)) {
                    archetypeMap.set(archetypeId, {
                        id: archetypeId,
                        name: archetype,
                        occurrences: {}
                    });
                }

                const archetypeData = archetypeMap.get(archetypeId);
                if (!archetypeData.occurrences[mythId]) {
                    archetypeData.occurrences[mythId] = [];
                }

                archetypeData.occurrences[mythId].push({
                    deity: deity.id,
                    name: deity.name
                });
            });
        });
    });

    console.log(`   Found ${archetypeMap.size} unique archetypes`);

    if (dryRun) {
        console.log(`   [DRY RUN] Would upload ${archetypeMap.size} archetypes`);
        const sample = Array.from(archetypeMap.values()).slice(0, 5);
        sample.forEach(arch => {
            const mythCount = Object.keys(arch.occurrences).length;
            console.log(`      - ${arch.name} (in ${mythCount} mythologies)`);
        });
        return { success: true, count: archetypeMap.size, dryRun: true };
    }

    const batch = db.batch();
    let count = 0;

    archetypeMap.forEach(archetype => {
        const archetypeDoc = {
            id: archetype.id,
            name: archetype.name,
            occurrences: archetype.occurrences,
            mythologyCount: Object.keys(archetype.occurrences).length,
            totalOccurrences: Object.values(archetype.occurrences).reduce((sum, arr) => sum + arr.length, 0),
            metadata: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
                source: 'html_parser',
                verified: false
            }
        };

        const docRef = db.collection('archetypes').doc(archetype.id);
        batch.set(docRef, archetypeDoc, { merge: true });
        count++;
    });

    try {
        await batch.commit();
        console.log(`   ✅ Uploaded ${count} archetypes`);
        return { success: true, count: count };
    } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Create search index for all content
 */
async function createSearchIndex(allReports, dryRun = false) {
    console.log(`\n🔍 Creating search index`);

    if (dryRun) {
        console.log(`   [DRY RUN] Would create search index`);
        return { success: true, dryRun: true };
    }

    const searchDocs = [];

    // Index mythologies
    Object.entries(allReports).forEach(([mythId, data]) => {
        searchDocs.push({
            id: `mythology_${mythId}`,
            type: 'mythology',
            mythology: mythId,
            name: data.mythology.title,
            description: data.mythology.description,
            searchTerms: [
                data.mythology.title.toLowerCase(),
                mythId,
                data.mythology.icon
            ].filter(Boolean)
        });

        // Index deities
        data.deities.forEach(deity => {
            searchDocs.push({
                id: `deity_${mythId}_${deity.id}`,
                type: 'deity',
                mythology: mythId,
                name: deity.name,
                displayName: deity.displayName,
                description: deity.description,
                archetypes: deity.archetypes,
                domains: deity.domains,
                searchTerms: [
                    deity.name.toLowerCase(),
                    deity.displayName?.toLowerCase(),
                    ...deity.archetypes.map(a => a.toLowerCase()),
                    ...deity.domains.map(d => d.toLowerCase()),
                    ...deity.epithets.map(e => e.toLowerCase())
                ].filter(Boolean)
            });
        });
    });

    console.log(`   Creating ${searchDocs.length} search documents`);

    // Upload in batches
    const BATCH_SIZE = 500;
    let uploadedCount = 0;

    for (let i = 0; i < searchDocs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = searchDocs.slice(i, i + BATCH_SIZE);

        chunk.forEach(doc => {
            const docRef = db.collection('search_index').doc(doc.id);
            batch.set(docRef, {
                ...doc,
                metadata: {
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }
            });
        });

        try {
            await batch.commit();
            uploadedCount += chunk.length;
            console.log(`   ✅ Indexed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} documents`);
        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
        }
    }

    console.log(`   📊 Total indexed: ${uploadedCount}`);

    return { success: true, count: uploadedCount };
}

/**
 * Load parsed data for a specific mythology
 */
function loadParsedData(mythologyId) {
    const filepath = path.join(PARSED_DATA_DIR, `${mythologyId}_parsed.json`);

    if (!fs.existsSync(filepath)) {
        console.error(`❌ Parsed data not found: ${filepath}`);
        console.error(`   Run: node parse-html-to-firestore.js --mythology=${mythologyId}`);
        return null;
    }

    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

/**
 * Load all parsed data
 */
function loadAllParsedData() {
    const filepath = path.join(PARSED_DATA_DIR, 'all_mythologies_parsed.json');

    if (!fs.existsSync(filepath)) {
        console.error(`❌ Parsed data not found: ${filepath}`);
        console.error(`   Run: node parse-html-to-firestore.js --all`);
        return null;
    }

    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const mythologyArg = args.find(arg => arg.startsWith('--mythology='));
    const dryRun = args.includes('--dry-run');

    console.log('🚀 Upload Parsed Data to Firestore');
    console.log('━'.repeat(60));

    if (dryRun) {
        console.log('⚠️  Running in DRY RUN mode - no data will be uploaded\n');
    }

    try {
        if (mythologyArg) {
            // Upload single mythology
            const mythId = mythologyArg.split('=')[1];
            const data = loadParsedData(mythId);

            if (!data) {
                process.exit(1);
            }

            const mythResult = await uploadMythology(mythId, data, dryRun);
            const deityResult = await uploadDeities(mythId, data.deities, dryRun);

            console.log('\n✅ Upload complete!');
            console.log(`   - Mythology: ${mythResult.success ? 'Success' : 'Failed'}`);
            console.log(`   - Deities: ${deityResult.uploaded} uploaded, ${deityResult.failed} failed`);

        } else {
            // Upload all mythologies
            const allData = loadAllParsedData();

            if (!allData) {
                process.exit(1);
            }

            const stats = {
                mythologies: { success: 0, failed: 0 },
                deities: { uploaded: 0, failed: 0 },
                archetypes: { count: 0 },
                searchIndex: { count: 0 }
            };

            // Upload each mythology
            for (const [mythId, data] of Object.entries(allData)) {
                const mythResult = await uploadMythology(mythId, data, dryRun);
                const deityResult = await uploadDeities(mythId, data.deities, dryRun);

                if (mythResult.success) stats.mythologies.success++;
                else stats.mythologies.failed++;

                stats.deities.uploaded += deityResult.uploaded || 0;
                stats.deities.failed += deityResult.failed || 0;
            }

            // Upload archetypes
            const archetypeResult = await uploadArchetypes(allData, dryRun);
            stats.archetypes.count = archetypeResult.count || 0;

            // Create search index
            const searchResult = await createSearchIndex(allData, dryRun);
            stats.searchIndex.count = searchResult.count || 0;

            console.log('\n━'.repeat(60));
            console.log('📊 Upload Statistics:');
            console.log(`   Mythologies: ${stats.mythologies.success} success, ${stats.mythologies.failed} failed`);
            console.log(`   Deities: ${stats.deities.uploaded} uploaded, ${stats.deities.failed} failed`);
            console.log(`   Archetypes: ${stats.archetypes.count} uploaded`);
            console.log(`   Search Index: ${stats.searchIndex.count} documents`);
            console.log('\n✅ Upload complete!');

            if (!dryRun) {
                console.log('\n📝 Next steps:');
                console.log('   1. Verify data in Firebase Console');
                console.log('   2. Test queries');
                console.log('   3. Update index_firebase.html to display data');
            }
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Upload failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    uploadMythology,
    uploadDeities,
    uploadArchetypes,
    createSearchIndex
};
