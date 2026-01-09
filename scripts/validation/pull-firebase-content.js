/**
 * Pull Firebase Content
 * Downloads/syncs Firebase content to local firebase-assets-downloaded folder
 * Eyes of Azrael Validation System
 *
 * Usage: node pull-firebase-content.js [--collection=name] [--force]
 *
 * Options:
 *   --collection=name  Only sync a specific collection
 *   --force           Force re-download even if file exists
 *   --help            Show this help message
 */

const fs = require('fs');
const path = require('path');

// Firebase Admin SDK for server-side access
let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    console.error('Error: firebase-admin package not found.');
    console.error('Install it with: npm install firebase-admin');
    process.exit(1);
}

// Configuration
const CONFIG = {
    projectId: 'eyesofazrael',
    outputDir: path.resolve(__dirname, '../../firebase-assets-downloaded'),
    collections: [
        'deities',
        'creatures',
        'heroes',
        'items',
        'places',
        'herbs',
        'rituals',
        'texts',
        'symbols',
        'archetypes',
        'cosmology',
        'mythologies',
        'concepts',
        'magic'
    ]
};

// Parse command line arguments
function parseArgs() {
    const args = {
        collection: null,
        force: false,
        help: false
    };

    process.argv.slice(2).forEach(arg => {
        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg === '--force' || arg === '-f') {
            args.force = true;
        } else if (arg.startsWith('--collection=')) {
            args.collection = arg.split('=')[1];
        }
    });

    return args;
}

// Show help message
function showHelp() {
    console.log(`
Pull Firebase Content - Eyes of Azrael Validation System

Downloads Firebase collections to local firebase-assets-downloaded folder.

Usage: node pull-firebase-content.js [options]

Options:
  --collection=name  Only sync a specific collection
  --force, -f        Force re-download even if files exist
  --help, -h         Show this help message

Available collections:
  ${CONFIG.collections.join(', ')}

Examples:
  node pull-firebase-content.js                    # Sync all collections
  node pull-firebase-content.js --collection=deities  # Sync only deities
  node pull-firebase-content.js --force            # Force full re-sync
`);
}

// Initialize Firebase Admin
function initializeFirebase() {
    // Check for service account file
    const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: CONFIG.projectId
        });
        console.log('[Firebase] Initialized with service account');
    } else {
        // Try to use application default credentials
        try {
            admin.initializeApp({
                projectId: CONFIG.projectId
            });
            console.log('[Firebase] Initialized with default credentials');
        } catch (e) {
            console.error('Error: Could not initialize Firebase.');
            console.error('Please provide a service account JSON file at:');
            console.error(serviceAccountPath);
            console.error('Or set up application default credentials.');
            process.exit(1);
        }
    }

    return admin.firestore();
}

// Ensure output directory exists
function ensureOutputDir(collection) {
    const collectionDir = path.join(CONFIG.outputDir, collection);
    if (!fs.existsSync(collectionDir)) {
        fs.mkdirSync(collectionDir, { recursive: true });
        console.log(`[Created] ${collectionDir}`);
    }
    return collectionDir;
}

// Sanitize filename
function sanitizeFilename(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Download a single collection
async function downloadCollection(db, collectionName, force = false) {
    console.log(`\n[Downloading] ${collectionName}...`);

    const collectionDir = ensureOutputDir(collectionName);
    const results = {
        downloaded: 0,
        skipped: 0,
        errors: [],
        documents: []
    };

    try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`[Warning] Collection ${collectionName} is empty`);
            return results;
        }

        console.log(`[Found] ${snapshot.size} documents in ${collectionName}`);

        const allDocs = [];

        for (const doc of snapshot.docs) {
            try {
                const data = doc.data();
                const docId = doc.id;
                const filename = `${sanitizeFilename(docId)}.json`;
                const filepath = path.join(collectionDir, filename);

                // Skip if exists and not forcing
                if (!force && fs.existsSync(filepath)) {
                    results.skipped++;
                    allDocs.push({ id: docId, ...data });
                    continue;
                }

                // Add document ID to data
                const docWithId = {
                    id: docId,
                    ...data
                };

                // Write individual file
                fs.writeFileSync(filepath, JSON.stringify(docWithId, null, 2));
                results.downloaded++;
                allDocs.push(docWithId);
                results.documents.push(docId);

            } catch (error) {
                results.errors.push({
                    document: doc.id,
                    error: error.message
                });
            }
        }

        // Write _all.json with all documents
        const allFilePath = path.join(collectionDir, '_all.json');
        fs.writeFileSync(allFilePath, JSON.stringify(allDocs, null, 2));

        console.log(`[Complete] ${collectionName}: ${results.downloaded} downloaded, ${results.skipped} skipped`);
        if (results.errors.length > 0) {
            console.log(`[Errors] ${results.errors.length} errors occurred`);
        }

    } catch (error) {
        console.error(`[Error] Failed to download ${collectionName}: ${error.message}`);
        results.errors.push({
            collection: collectionName,
            error: error.message
        });
    }

    return results;
}

// Sync local files with Firebase (using existing downloads)
async function syncFromLocal(collectionName) {
    console.log(`\n[Syncing from local] ${collectionName}...`);

    const collectionDir = path.join(CONFIG.outputDir, collectionName);
    const results = {
        files: 0,
        valid: 0,
        invalid: 0,
        errors: []
    };

    if (!fs.existsSync(collectionDir)) {
        console.log(`[Warning] Directory not found: ${collectionDir}`);
        return results;
    }

    try {
        const files = fs.readdirSync(collectionDir).filter(f =>
            f.endsWith('.json') && !f.startsWith('_')
        );

        results.files = files.length;
        console.log(`[Found] ${files.length} JSON files in ${collectionName}`);

        for (const file of files) {
            try {
                const filepath = path.join(collectionDir, file);
                const content = fs.readFileSync(filepath, 'utf8');
                JSON.parse(content); // Validate JSON
                results.valid++;
            } catch (error) {
                results.invalid++;
                results.errors.push({
                    file,
                    error: error.message
                });
            }
        }

        console.log(`[Complete] ${collectionName}: ${results.valid} valid, ${results.invalid} invalid`);

    } catch (error) {
        console.error(`[Error] Failed to sync ${collectionName}: ${error.message}`);
        results.errors.push({
            collection: collectionName,
            error: error.message
        });
    }

    return results;
}

// Generate download report
function generateReport(allResults) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalCollections: Object.keys(allResults).length,
            totalDownloaded: 0,
            totalSkipped: 0,
            totalErrors: 0
        },
        collections: {}
    };

    for (const [collection, results] of Object.entries(allResults)) {
        report.summary.totalDownloaded += results.downloaded || 0;
        report.summary.totalSkipped += results.skipped || 0;
        report.summary.totalErrors += (results.errors || []).length;
        report.collections[collection] = results;
    }

    const reportPath = path.join(CONFIG.outputDir, '_download_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n[Report] Saved to ${reportPath}`);

    return report;
}

// Main execution
async function main() {
    const args = parseArgs();

    if (args.help) {
        showHelp();
        process.exit(0);
    }

    console.log('='.repeat(60));
    console.log('Pull Firebase Content - Eyes of Azrael');
    console.log('='.repeat(60));

    // Determine which collections to process
    let collectionsToProcess = CONFIG.collections;
    if (args.collection) {
        if (!CONFIG.collections.includes(args.collection)) {
            console.error(`Error: Unknown collection "${args.collection}"`);
            console.error(`Available: ${CONFIG.collections.join(', ')}`);
            process.exit(1);
        }
        collectionsToProcess = [args.collection];
    }

    // Check if we should use Firebase or local files
    let useFirebase = false;
    try {
        const db = initializeFirebase();
        useFirebase = true;
    } catch (e) {
        console.log('[Note] Firebase not available, using local files only');
    }

    const allResults = {};

    for (const collection of collectionsToProcess) {
        if (useFirebase) {
            allResults[collection] = await downloadCollection(
                admin.firestore(),
                collection,
                args.force
            );
        } else {
            allResults[collection] = await syncFromLocal(collection);
        }
    }

    // Generate report
    const report = generateReport(allResults);

    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Collections processed: ${report.summary.totalCollections}`);
    console.log(`Documents downloaded: ${report.summary.totalDownloaded}`);
    console.log(`Documents skipped: ${report.summary.totalSkipped}`);
    console.log(`Errors: ${report.summary.totalErrors}`);

    // Exit with error code if there were errors
    if (report.summary.totalErrors > 0) {
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    CONFIG,
    downloadCollection,
    syncFromLocal,
    generateReport
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
