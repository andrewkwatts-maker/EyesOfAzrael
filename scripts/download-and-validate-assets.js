/**
 * Download and Validate All Firebase Assets
 * Downloads fresh data from Firebase and validates structure
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to download
const COLLECTIONS = [
    'deities', 'heroes', 'creatures', 'cosmology',
    'texts', 'rituals', 'herbs', 'symbols',
    'magic', 'path', 'places', 'items',
    'concepts', 'events', 'figures', 'beings',
    'angels', 'teachings'
];

// Required metadata fields
const REQUIRED_FIELDS = {
    core: ['id', 'name', 'entityType', 'mythology', 'description'],
    display: ['icon', 'subtitle', 'searchTerms', 'sortName'],
    metrics: ['importance', 'popularity'],
    version: ['_version']
};

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'firebase-assets-validated');

/**
 * Download all assets from Firebase
 */
async function downloadAllAssets() {
    console.log('================================================================================');
    console.log('DOWNLOADING ALL FIREBASE ASSETS');
    console.log('================================================================================\n');

    const stats = {
        totalCollections: 0,
        totalEntities: 0,
        byCollection: {},
        byMythology: {},
        errors: []
    };

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const collection of COLLECTIONS) {
        console.log(`\n>> Downloading ${collection}...`);

        try {
            const snapshot = await db.collection(collection).get();

            if (snapshot.empty) {
                console.log(`   No documents in ${collection}`);
                stats.byCollection[collection] = 0;
                continue;
            }

            const collectionDir = path.join(OUTPUT_DIR, collection);
            if (!fs.existsSync(collectionDir)) {
                fs.mkdirSync(collectionDir, { recursive: true });
            }

            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const mythology = data.mythology || 'unknown';

                // Create mythology subdirectory
                const mythDir = path.join(collectionDir, mythology);
                if (!fs.existsSync(mythDir)) {
                    fs.mkdirSync(mythDir, { recursive: true });
                }

                // Save file
                const fileName = `${doc.id}.json`;
                const filePath = path.join(mythDir, fileName);

                fs.writeFileSync(
                    filePath,
                    JSON.stringify(data, null, 2),
                    'utf8'
                );

                count++;

                // Track stats
                stats.byMythology[mythology] = (stats.byMythology[mythology] || 0) + 1;
            });

            stats.byCollection[collection] = count;
            stats.totalEntities += count;
            stats.totalCollections++;

            console.log(`   Downloaded ${count} entities`);

        } catch (error) {
            console.error(`   ERROR: ${error.message}`);
            stats.errors.push({
                collection,
                error: error.message
            });
        }
    }

    return stats;
}

/**
 * Validate asset structure
 */
function validateAsset(asset, collection) {
    const issues = [];

    // Check required core fields
    for (const field of REQUIRED_FIELDS.core) {
        if (!asset[field]) {
            issues.push(`Missing required field: ${field}`);
        }
    }

    // Check display fields (warnings)
    for (const field of REQUIRED_FIELDS.display) {
        if (!asset[field]) {
            issues.push(`WARNING: Missing display field: ${field}`);
        }
    }

    // Check metrics
    for (const field of REQUIRED_FIELDS.metrics) {
        if (asset[field] === undefined) {
            issues.push(`WARNING: Missing metric: ${field}`);
        }
    }

    // Check version
    if (asset._version !== '2.0') {
        issues.push(`WARNING: Version is ${asset._version || 'undefined'}, expected 2.0`);
    }

    // Check entityType matches collection
    if (asset.entityType && asset.entityType !== collection && !collection.includes(asset.entityType)) {
        issues.push(`WARNING: entityType (${asset.entityType}) doesn't match collection (${collection})`);
    }

    // Check searchTerms is array
    if (asset.searchTerms && !Array.isArray(asset.searchTerms)) {
        issues.push(`ERROR: searchTerms should be array, got ${typeof asset.searchTerms}`);
    }

    // Check importance range
    if (asset.importance !== undefined) {
        if (asset.importance < 0 || asset.importance > 100) {
            issues.push(`ERROR: importance out of range (0-100): ${asset.importance}`);
        }
    }

    // Check popularity range
    if (asset.popularity !== undefined) {
        if (asset.popularity < 0 || asset.popularity > 100) {
            issues.push(`ERROR: popularity out of range (0-100): ${asset.popularity}`);
        }
    }

    return issues;
}

/**
 * Validate all downloaded assets
 */
function validateAllAssets() {
    console.log('\n================================================================================');
    console.log('VALIDATING DOWNLOADED ASSETS');
    console.log('================================================================================\n');

    const validation = {
        totalFiles: 0,
        validFiles: 0,
        filesWithWarnings: 0,
        filesWithErrors: 0,
        issues: []
    };

    for (const collection of COLLECTIONS) {
        const collectionDir = path.join(OUTPUT_DIR, collection);
        if (!fs.existsSync(collectionDir)) continue;

        console.log(`\n>> Validating ${collection}...`);

        // Walk through mythology subdirectories
        const mythologies = fs.readdirSync(collectionDir);

        for (const mythology of mythologies) {
            const mythDir = path.join(collectionDir, mythology);
            if (!fs.statSync(mythDir).isDirectory()) continue;

            const files = fs.readdirSync(mythDir).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(mythDir, file);
                validation.totalFiles++;

                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const asset = JSON.parse(content);

                    const issues = validateAsset(asset, collection);

                    if (issues.length === 0) {
                        validation.validFiles++;
                    } else {
                        const hasErrors = issues.some(i => i.startsWith('ERROR'));
                        if (hasErrors) {
                            validation.filesWithErrors++;
                        } else {
                            validation.filesWithWarnings++;
                        }

                        validation.issues.push({
                            file: `${collection}/${mythology}/${file}`,
                            issues
                        });
                    }

                } catch (error) {
                    validation.filesWithErrors++;
                    validation.issues.push({
                        file: `${collection}/${mythology}/${file}`,
                        issues: [`CRITICAL: ${error.message}`]
                    });
                }
            }
        }
    }

    return validation;
}

/**
 * Generate validation report
 */
function generateReport(downloadStats, validationResults) {
    const report = {
        timestamp: new Date().toISOString(),
        download: downloadStats,
        validation: validationResults
    };

    // Save full report
    const reportPath = path.join(OUTPUT_DIR, 'VALIDATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    let markdown = '# Firebase Assets Validation Report\n\n';
    markdown += `**Date:** ${new Date().toLocaleString()}\n\n`;

    markdown += '## Download Summary\n\n';
    markdown += `- **Total Collections:** ${downloadStats.totalCollections}\n`;
    markdown += `- **Total Entities:** ${downloadStats.totalEntities}\n\n`;

    markdown += '### By Collection\n\n';
    for (const [collection, count] of Object.entries(downloadStats.byCollection)) {
        markdown += `- **${collection}:** ${count} entities\n`;
    }

    markdown += '\n### By Mythology\n\n';
    const sortedMyths = Object.entries(downloadStats.byMythology)
        .sort((a, b) => b[1] - a[1]);

    for (const [mythology, count] of sortedMyths) {
        markdown += `- **${mythology}:** ${count} entities\n`;
    }

    markdown += '\n## Validation Summary\n\n';
    markdown += `- **Total Files:** ${validationResults.totalFiles}\n`;
    markdown += `- **Valid Files:** ${validationResults.validFiles} (${((validationResults.validFiles / validationResults.totalFiles) * 100).toFixed(2)}%)\n`;
    markdown += `- **Files with Warnings:** ${validationResults.filesWithWarnings}\n`;
    markdown += `- **Files with Errors:** ${validationResults.filesWithErrors}\n\n`;

    if (validationResults.filesWithErrors > 0 || validationResults.filesWithWarnings > 0) {
        markdown += '## Issues Found\n\n';

        // Group by severity
        const errors = validationResults.issues.filter(i =>
            i.issues.some(issue => issue.startsWith('ERROR') || issue.startsWith('CRITICAL'))
        );
        const warnings = validationResults.issues.filter(i =>
            !i.issues.some(issue => issue.startsWith('ERROR') || issue.startsWith('CRITICAL'))
        );

        if (errors.length > 0) {
            markdown += '### Errors\n\n';
            errors.forEach(({ file, issues }) => {
                markdown += `**${file}:**\n`;
                issues.forEach(issue => markdown += `  - ${issue}\n`);
                markdown += '\n';
            });
        }

        if (warnings.length > 0 && warnings.length <= 50) {
            markdown += '### Warnings (First 50)\n\n';
            warnings.slice(0, 50).forEach(({ file, issues }) => {
                markdown += `**${file}:**\n`;
                issues.forEach(issue => markdown += `  - ${issue}\n`);
                markdown += '\n';
            });
        }
    }

    const summaryPath = path.join(OUTPUT_DIR, 'VALIDATION_SUMMARY.md');
    fs.writeFileSync(summaryPath, markdown);

    return { reportPath, summaryPath };
}

/**
 * Main execution
 */
async function main() {
    try {
        // Download assets
        const downloadStats = await downloadAllAssets();

        console.log('\n================================================================================');
        console.log('DOWNLOAD COMPLETE');
        console.log('================================================================================');
        console.log(`Total Entities: ${downloadStats.totalEntities}`);
        console.log(`Output Directory: ${OUTPUT_DIR}`);

        // Validate assets
        const validationResults = validateAllAssets();

        console.log('\n================================================================================');
        console.log('VALIDATION COMPLETE');
        console.log('================================================================================');
        console.log(`Valid Files: ${validationResults.validFiles}/${validationResults.totalFiles}`);
        console.log(`Files with Warnings: ${validationResults.filesWithWarnings}`);
        console.log(`Files with Errors: ${validationResults.filesWithErrors}`);

        // Generate report
        const { reportPath, summaryPath } = generateReport(downloadStats, validationResults);

        console.log('\n================================================================================');
        console.log('REPORTS GENERATED');
        console.log('================================================================================');
        console.log(`Full Report: ${reportPath}`);
        console.log(`Summary: ${summaryPath}`);

        // Exit
        process.exit(0);

    } catch (error) {
        console.error('\nFATAL ERROR:', error);
        process.exit(1);
    }
}

// Run
main();
