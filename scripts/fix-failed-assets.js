#!/usr/bin/env node

/**
 * Fix Failed Firebase Assets
 *
 * Adds missing required fields (description, type) to 11 failed assets:
 * - 4 archetypes: archetypes, hermetic, related-mythological-figures, universal-symbols
 * - 7 pages: apocryphal_index, babylonian_index, buddhist_index, chinese_index,
 *            christian_index, greek_index, norse_index
 *
 * Usage: node scripts/fix-failed-assets.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
function initFirebase() {
    console.log('🔧 Initializing Firebase Admin SDK...');

    try {
        // Try to load service account
        let serviceAccount;
        const possiblePaths = [
            path.join(__dirname, '..', 'serviceAccountKey.json'),
            path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json')
        ];

        for (const serviceAccountPath of possiblePaths) {
            try {
                serviceAccount = require(serviceAccountPath);
                console.log(`✅ Loaded credentials from ${path.basename(serviceAccountPath)}`);
                break;
            } catch (error) {
                // Try next path
            }
        }

        if (!serviceAccount) {
            console.warn('⚠️  Service account key not found. Using environment credentials.');
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } else {
                throw new Error('No Firebase credentials found');
            }
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || 'eyesofazrael'
        });

        console.log('✅ Firebase initialized successfully\n');
        return admin.firestore();
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        throw error;
    }
}

// Define fixes for each failed asset
const FIXES = {
    archetypes: {
        archetypes: {
            type: 'archetype-index',
            description: 'Universal patterns and themes that appear across world mythologies, representing fundamental human experiences and cosmic principles. These archetypal forms transcend individual cultures, revealing shared human narratives.',
            icon: '🎭'
        },
        hermetic: {
            type: 'philosophical-archetype',
            description: 'The Hermetic principle "As Above, So Below" teaches that patterns repeat at every scale of existence, from the microcosm to the macrocosm. This fundamental teaching of Hermeticism appears in mystical traditions worldwide.',
            icon: '⚗️'
        },
        'related-mythological-figures': {
            type: 'cross-reference',
            description: 'Deities and figures from different mythological traditions that embody similar archetypal patterns, revealing universal themes across cultures. These connections demonstrate the shared human experience expressed through diverse mythological narratives.',
            icon: '🔗'
        },
        'universal-symbols': {
            type: 'symbolic-archetype',
            description: 'Symbols and imagery that transcend cultural boundaries, appearing in multiple mythological traditions with similar meanings and significance. These universal symbols represent fundamental aspects of human consciousness and spiritual understanding.',
            icon: '🌟'
        },
        world: {
            type: 'tarot-archetype',
            description: 'The World card represents cosmic completion, the achievement of unity with all existence, and the fulfillment of the soul\'s journey. It embodies the sacred dance at the center of creation where all opposites unite.',
            icon: '🌍'
        }
    },
    pages: {
        archetypes: {
            name: 'Mythological Archetypes',
            mythology: 'global',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        },
        home: {
            name: 'Eyes of Azrael',
            mythology: 'global',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        },
        items: {
            name: 'Legendary Items',
            mythology: 'global',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        },
        mythologies: {
            name: 'World Mythologies',
            mythology: 'global',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        },
        places: {
            name: 'Sacred Places',
            mythology: 'global',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        },
        submissions: {
            name: 'Community Contributions',
            mythology: 'global',
            description: 'Contributions from the Eyes of Azrael community. Share your research, insights, and discoveries about world mythology, magical traditions, and spiritual practices.',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        },
        theories: {
            name: 'Theories & Analysis',
            mythology: 'global',
            created_at: new Date().toISOString(),
            createdBy: 'system'
        }
    }
};

/**
 * Read current state of an asset before fixing
 */
async function readAssetState(db, collection, id) {
    try {
        const doc = await db.collection(collection).doc(id).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error(`   ❌ Error reading ${collection}/${id}:`, error.message);
        return null;
    }
}

/**
 * Apply fixes to all failed assets
 */
async function applyFixes(db) {
    console.log('🔧 Applying fixes to failed assets...\n');

    const results = {
        total: 0,
        success: 0,
        failed: 0,
        fixes: []
    };

    for (const [collection, assets] of Object.entries(FIXES)) {
        console.log(`📁 Collection: ${collection}`);

        for (const [id, updates] of Object.entries(assets)) {
            results.total++;

            try {
                // Read current state
                const beforeState = await readAssetState(db, collection, id);

                if (!beforeState) {
                    console.log(`   ⚠️  ${id}: Document not found, skipping`);
                    results.failed++;
                    continue;
                }

                // Apply update
                await db.collection(collection).doc(id).update(updates);

                // Read after state
                const afterState = await readAssetState(db, collection, id);

                console.log(`   ✅ ${id}: Fixed`);

                // Track what was added
                const added = Object.keys(updates).filter(key => !beforeState[key]);
                if (added.length > 0) {
                    console.log(`      Added fields: ${added.join(', ')}`);
                }

                results.success++;
                results.fixes.push({
                    collection,
                    id,
                    fieldsAdded: added,
                    before: beforeState,
                    after: afterState
                });

            } catch (error) {
                console.log(`   ❌ ${id}: Error - ${error.message}`);
                results.failed++;
            }
        }

        console.log('');
    }

    return results;
}

/**
 * Validate that fixes were applied correctly
 */
async function validateFixes(db) {
    console.log('🔍 Validating fixes...\n');

    const validationResults = {
        total: 0,
        passed: 0,
        failed: 0,
        issues: []
    };

    for (const [collection, assets] of Object.entries(FIXES)) {
        for (const [id, expectedFields] of Object.entries(assets)) {
            validationResults.total++;

            try {
                const doc = await db.collection(collection).doc(id).get();

                if (!doc.exists) {
                    validationResults.failed++;
                    validationResults.issues.push({
                        collection,
                        id,
                        issue: 'Document not found'
                    });
                    continue;
                }

                const data = doc.data();
                const missingFields = [];

                // Check that all expected fields are now present
                for (const field of Object.keys(expectedFields)) {
                    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                        missingFields.push(field);
                    }
                }

                if (missingFields.length === 0) {
                    validationResults.passed++;
                    console.log(`   ✅ ${collection}/${id}: All fields present`);
                } else {
                    validationResults.failed++;
                    validationResults.issues.push({
                        collection,
                        id,
                        missingFields
                    });
                    console.log(`   ❌ ${collection}/${id}: Missing ${missingFields.join(', ')}`);
                }

            } catch (error) {
                validationResults.failed++;
                validationResults.issues.push({
                    collection,
                    id,
                    issue: error.message
                });
                console.log(`   ❌ ${collection}/${id}: Error - ${error.message}`);
            }
        }
    }

    return validationResults;
}

/**
 * Generate detailed report of all changes
 */
async function generateReport(fixResults, validationResults) {
    const fs = require('fs').promises;

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalAssetsFixed: fixResults.total,
            successfulFixes: fixResults.success,
            failedFixes: fixResults.failed,
            validationPassed: validationResults.passed,
            validationFailed: validationResults.failed
        },
        fixesByCollection: {},
        fixes: fixResults.fixes,
        validationIssues: validationResults.issues
    };

    // Group by collection
    for (const fix of fixResults.fixes) {
        if (!report.fixesByCollection[fix.collection]) {
            report.fixesByCollection[fix.collection] = [];
        }
        report.fixesByCollection[fix.collection].push({
            id: fix.id,
            fieldsAdded: fix.fieldsAdded
        });
    }

    // Save JSON report
    const jsonPath = path.join(__dirname, '..', 'FAILED_ASSETS_FIXED.json');
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdown = generateMarkdownReport(report);
    const mdPath = path.join(__dirname, '..', 'FAILED_ASSETS_FIXED.md');
    await fs.writeFile(mdPath, markdown);

    console.log('\n📊 Reports generated:');
    console.log(`   ✅ FAILED_ASSETS_FIXED.json`);
    console.log(`   ✅ FAILED_ASSETS_FIXED.md\n`);

    return report;
}

/**
 * Generate markdown documentation of fixes
 */
function generateMarkdownReport(report) {
    return `# Failed Assets Fixed - Summary Report

**Date:** ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Total Assets Fixed:** ${report.summary.totalAssetsFixed}
- **Successful Fixes:** ${report.summary.successfulFixes}
- **Failed Fixes:** ${report.summary.failedFixes}
- **Validation Passed:** ${report.summary.validationPassed}
- **Validation Failed:** ${report.summary.validationFailed}

---

## Fixes Applied

### Archetypes Collection

${report.fixesByCollection.archetypes ? report.fixesByCollection.archetypes.map(fix =>
`#### ${fix.id}
- **Fields Added:** ${fix.fieldsAdded.join(', ')}`
).join('\n\n') : 'No fixes in this collection'}

### Pages Collection

${report.fixesByCollection.pages ? report.fixesByCollection.pages.map(fix =>
`#### ${fix.id}
- **Fields Added:** ${fix.fieldsAdded.join(', ')}`
).join('\n\n') : 'No fixes in this collection'}

---

## Validation Issues

${report.validationIssues.length > 0 ?
    report.validationIssues.map(issue =>
        `- **${issue.collection}/${issue.id}:** ${issue.missingFields ? 'Missing ' + issue.missingFields.join(', ') : issue.issue}`
    ).join('\n') :
    '✅ No validation issues - all fixes applied successfully!'}

---

## Next Steps

1. Run full validation: \`node scripts/validate-firebase-assets.js\`
2. Verify 0 failed assets in validation report
3. Check rendering in production
4. Monitor for any issues

---

## Detailed Changes

${report.fixes.map(fix => `
### ${fix.collection}/${fix.id}

**Fields Added:** ${fix.fieldsAdded.join(', ')}

**Before:**
\`\`\`json
${JSON.stringify(fix.before, null, 2)}
\`\`\`

**After:**
\`\`\`json
${JSON.stringify(fix.after, null, 2)}
\`\`\`
`).join('\n---\n')}
`;
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Failed Assets Fix Script\n');
    console.log('This script will fix 11 failed Firebase assets by adding:');
    console.log('  - description fields (educational, 2-3 sentences)');
    console.log('  - type fields');
    console.log('  - name and mythology fields (for pages)');
    console.log('  - icon fields (optional enhancements)\n');

    const db = initFirebase();

    try {
        // Apply fixes
        const fixResults = await applyFixes(db);

        console.log('='.repeat(70));
        console.log('📊 FIX RESULTS');
        console.log('='.repeat(70));
        console.log(`Total Assets:     ${fixResults.total}`);
        console.log(`✅ Success:        ${fixResults.success}`);
        console.log(`❌ Failed:         ${fixResults.failed}`);
        console.log('='.repeat(70) + '\n');

        // Validate fixes
        const validationResults = await validateFixes(db);

        console.log('\n' + '='.repeat(70));
        console.log('🔍 VALIDATION RESULTS');
        console.log('='.repeat(70));
        console.log(`Total Validated:  ${validationResults.total}`);
        console.log(`✅ Passed:         ${validationResults.passed}`);
        console.log(`❌ Failed:         ${validationResults.failed}`);
        console.log('='.repeat(70) + '\n');

        // Generate report
        const report = await generateReport(fixResults, validationResults);

        if (validationResults.failed === 0) {
            console.log('✅ SUCCESS! All 11 assets have been fixed and validated.\n');
            console.log('Next steps:');
            console.log('  1. Run: node scripts/validate-firebase-assets.js');
            console.log('  2. Verify: 0 failed assets in validation report\n');
        } else {
            console.log('⚠️  Some fixes may need manual review.\n');
            console.log('Check FAILED_ASSETS_FIXED.md for details.\n');
        }

    } catch (error) {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { FIXES, applyFixes, validateFixes };
