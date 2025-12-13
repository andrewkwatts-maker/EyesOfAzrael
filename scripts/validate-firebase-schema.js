#!/usr/bin/env node

/**
 * Firebase Entity-Schema-v2.0 Compliance Validator
 *
 * This script validates all Firebase Firestore collections against the
 * Entity-Schema-v2.0 standard defined in data/schemas/entity-schema-v2.json
 *
 * USAGE:
 *   node scripts/validate-firebase-schema.js [--collection=<name>] [--fix] [--report]
 *
 * OPTIONS:
 *   --collection=<name>  Validate only a specific collection
 *   --fix                Attempt to auto-fix schema violations
 *   --report             Generate detailed compliance report
 *   --local              Validate local JSON files instead of Firebase
 *
 * OUTPUTS:
 *   - Console summary of validation results
 *   - Detailed JSON report (if --report flag used)
 *   - List of priority fixes needed
 *   - Completeness scores per entity
 */

const fs = require('fs').promises;
const path = require('path');

// Parse args early to check if we need Firebase
const args = process.argv.slice(2);
const validateLocal = args.includes('--local');

// Initialize Firebase Admin only if needed
let admin, db;
if (!validateLocal) {
    admin = require('firebase-admin');
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    let serviceAccount;

    try {
        serviceAccount = require(serviceAccountPath);
    } catch (error) {
        console.error('❌ Firebase service account file not found!');
        console.error(`   Expected at: ${serviceAccountPath}`);
        console.error('   Use --local flag to validate local files instead');
        process.exit(1);
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    db = admin.firestore();
}

// Collection configuration
const COLLECTIONS = {
    deities: { expectedCount: 100, type: 'deity' },
    heroes: { expectedCount: 30, type: 'hero' },
    creatures: { expectedCount: 30, type: 'creature' },
    items: { expectedCount: 242, type: 'item' },
    places: { expectedCount: 129, type: 'place' },
    'magic-systems': { expectedCount: 99, type: 'magic' },
    herbs: { expectedCount: 28, type: 'herb' },
    theories: { expectedCount: 20, type: 'theory' },
    cosmology: { expectedCount: null, type: 'cosmology' },
    texts: { expectedCount: null, type: 'text' },
    rituals: { expectedCount: null, type: 'ritual' },
    symbols: { expectedCount: null, type: 'symbol' },
    concepts: { expectedCount: null, type: 'concept' },
    myths: { expectedCount: null, type: 'myth' }
};

// Entity Schema v2.0 - Required Fields
const REQUIRED_FIELDS = [
    'id',
    'type',
    'name',
    'mythologies',
    'primaryMythology'
];

// Recommended Metadata Fields (for completeness scoring)
const RECOMMENDED_FIELDS = {
    'linguistic.originalName': 5,
    'linguistic.transliteration': 3,
    'linguistic.pronunciation': 5,
    'linguistic.etymology': 5,
    'geographical.primaryLocation': 5,
    'geographical.region': 3,
    'temporal.firstAttestation': 5,
    'temporal.historicalDate': 3,
    'temporal.culturalPeriod': 3,
    'metaphysicalProperties.primaryElement': 3,
    'metaphysicalProperties.planets': 2,
    'metaphysicalProperties.sefirot': 2,
    'shortDescription': 5,
    'longDescription': 5,
    'tags': 3,
    'relatedEntities': 5,
    'sources': 5,
    'icon': 2,
    'colors': 2,
    'cultural': 3,
    'mediaReferences': 2
};

const TOTAL_POSSIBLE_POINTS = Object.values(RECOMMENDED_FIELDS).reduce((sum, val) => sum + val, 0);

/**
 * Get nested property value using dot notation
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) =>
        current && current[prop] !== undefined ? current[prop] : undefined, obj);
}

/**
 * Check if a value is meaningful (not empty/null/undefined)
 */
function isMeaningful(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
}

/**
 * Validate required fields
 */
function validateRequiredFields(doc) {
    const errors = [];
    const warnings = [];

    REQUIRED_FIELDS.forEach(field => {
        const value = doc[field];

        if (!isMeaningful(value)) {
            errors.push({
                field,
                severity: 'critical',
                message: `Required field '${field}' is missing or empty`
            });
        } else {
            // Additional validation
            if (field === 'id' && !/^[a-z0-9-]+$/.test(value)) {
                errors.push({
                    field,
                    severity: 'error',
                    message: `ID '${value}' does not match kebab-case pattern (^[a-z0-9-]+$)`
                });
            }

            if (field === 'mythologies' && !Array.isArray(value)) {
                errors.push({
                    field,
                    severity: 'error',
                    message: `Field 'mythologies' must be an array`
                });
            }

            if (field === 'mythologies' && Array.isArray(value) && value.length === 0) {
                errors.push({
                    field,
                    severity: 'error',
                    message: `Field 'mythologies' array must have at least one item`
                });
            }
        }
    });

    return { errors, warnings };
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(doc) {
    let earnedPoints = 0;
    const missingFields = [];
    const presentFields = [];

    Object.entries(RECOMMENDED_FIELDS).forEach(([field, points]) => {
        const value = getNestedValue(doc, field);

        if (isMeaningful(value)) {
            earnedPoints += points;
            presentFields.push(field);
        } else {
            missingFields.push({ field, points });
        }
    });

    const percentage = Math.round((earnedPoints / TOTAL_POSSIBLE_POINTS) * 100);

    return {
        percentage,
        earnedPoints,
        totalPoints: TOTAL_POSSIBLE_POINTS,
        missingFields: missingFields.sort((a, b) => b.points - a.points),
        presentFields
    };
}

/**
 * Validate cross-references
 */
function validateCrossReferences(doc, allEntities) {
    const brokenRefs = [];
    const warnings = [];

    if (doc.relatedEntities) {
        Object.entries(doc.relatedEntities).forEach(([type, entities]) => {
            if (Array.isArray(entities)) {
                entities.forEach(ref => {
                    if (ref.id) {
                        const exists = allEntities.has(ref.id);
                        if (!exists) {
                            brokenRefs.push({
                                field: `relatedEntities.${type}`,
                                referencedId: ref.id,
                                referencedName: ref.name,
                                message: `Referenced entity '${ref.id}' does not exist`
                            });
                        }
                    } else {
                        warnings.push({
                            field: `relatedEntities.${type}`,
                            message: `Entity reference missing 'id' field`
                        });
                    }
                });
            }
        });
    }

    return { brokenRefs, warnings };
}

/**
 * Validate a single document
 */
function validateDocument(doc, docId, collectionName, allEntities) {
    const validation = {
        id: docId,
        collection: collectionName,
        isValid: true,
        errors: [],
        warnings: [],
        completeness: null,
        brokenReferences: []
    };

    // Validate required fields
    const requiredCheck = validateRequiredFields(doc);
    validation.errors.push(...requiredCheck.errors);
    validation.warnings.push(...requiredCheck.warnings);

    // Calculate completeness
    validation.completeness = calculateCompleteness(doc);

    // Validate cross-references
    const refCheck = validateCrossReferences(doc, allEntities);
    validation.brokenReferences = refCheck.brokenRefs;
    validation.warnings.push(...refCheck.warnings);

    // Check type matches collection
    const expectedType = COLLECTIONS[collectionName]?.type;
    if (expectedType && doc.type !== expectedType) {
        validation.warnings.push({
            field: 'type',
            message: `Type '${doc.type}' does not match collection '${collectionName}' expected type '${expectedType}'`
        });
    }

    // Determine overall validity
    validation.isValid = validation.errors.length === 0;

    return validation;
}

/**
 * Validate local JSON files instead of Firebase
 */
async function validateLocalFiles() {
    console.log('🔍 Validating local entity files...\n');

    const entitiesDir = path.join(__dirname, '..', 'data', 'entities');
    const results = {
        totalDocuments: 0,
        validDocuments: 0,
        invalidDocuments: 0,
        collections: {}
    };

    const allEntities = new Set();

    // First pass: collect all entity IDs
    const entityDirs = await fs.readdir(entitiesDir);
    for (const dir of entityDirs) {
        const dirPath = path.join(entitiesDir, dir);
        const stat = await fs.stat(dirPath);

        if (stat.isDirectory()) {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'migration-report.json') {
                    const id = file.replace('.json', '');
                    allEntities.add(id);
                }
            }
        }
    }

    // Second pass: validate each entity
    for (const dir of entityDirs) {
        const dirPath = path.join(entitiesDir, dir);
        const stat = await fs.stat(dirPath);

        if (stat.isDirectory()) {
            const collectionName = dir === 'magic' ? 'magic-systems' : dir + 's';

            if (!results.collections[collectionName]) {
                results.collections[collectionName] = {
                    count: 0,
                    valid: 0,
                    invalid: 0,
                    avgCompleteness: 0,
                    documents: []
                };
            }

            const files = await fs.readdir(dirPath);
            const completenessScores = [];

            for (const file of files) {
                if (file.endsWith('.json') && file !== 'migration-report.json') {
                    const filePath = path.join(dirPath, file);
                    const docId = file.replace('.json', '');

                    try {
                        const content = await fs.readFile(filePath, 'utf-8');
                        const doc = JSON.parse(content);

                        const validation = validateDocument(doc, docId, collectionName, allEntities);

                        results.totalDocuments++;
                        results.collections[collectionName].count++;
                        results.collections[collectionName].documents.push(validation);

                        if (validation.isValid) {
                            results.validDocuments++;
                            results.collections[collectionName].valid++;
                        } else {
                            results.invalidDocuments++;
                            results.collections[collectionName].invalid++;
                        }

                        completenessScores.push(validation.completeness.percentage);
                    } catch (error) {
                        console.error(`\n❌ Error parsing ${collectionName}/${docId}: ${error.message}`);

                        // Still count it
                        results.totalDocuments++;
                        results.collections[collectionName].count++;
                        results.invalidDocuments++;
                        results.collections[collectionName].invalid++;

                        results.collections[collectionName].documents.push({
                            id: docId,
                            collection: collectionName,
                            isValid: false,
                            errors: [{
                                field: 'file',
                                severity: 'critical',
                                message: `JSON parsing error: ${error.message}`
                            }],
                            warnings: [],
                            completeness: { percentage: 0, earnedPoints: 0, totalPoints: TOTAL_POSSIBLE_POINTS, missingFields: [], presentFields: [] },
                            brokenReferences: []
                        });
                    }
                }
            }

            // Calculate average completeness
            if (completenessScores.length > 0) {
                results.collections[collectionName].avgCompleteness = Math.round(
                    completenessScores.reduce((sum, val) => sum + val, 0) / completenessScores.length
                );
            }
        }
    }

    return results;
}

/**
 * Validate Firebase collections
 */
async function validateFirebase(collectionFilter = null) {
    console.log('🔍 Validating Firebase collections...\n');

    const collectionsToValidate = collectionFilter
        ? { [collectionFilter]: COLLECTIONS[collectionFilter] }
        : COLLECTIONS;

    const results = {
        totalDocuments: 0,
        validDocuments: 0,
        invalidDocuments: 0,
        collections: {}
    };

    // First pass: collect all entity IDs
    const allEntities = new Set();
    for (const [collectionName] of Object.entries(collectionsToValidate)) {
        try {
            const snapshot = await db.collection(collectionName).get();
            snapshot.docs.forEach(doc => {
                allEntities.add(doc.id);
            });
        } catch (error) {
            console.warn(`⚠️  Could not access collection '${collectionName}': ${error.message}`);
        }
    }

    // Second pass: validate each collection
    for (const [collectionName, config] of Object.entries(collectionsToValidate)) {
        console.log(`Validating collection: ${collectionName}...`);

        try {
            const snapshot = await db.collection(collectionName).get();
            const count = snapshot.size;

            results.collections[collectionName] = {
                count,
                expectedCount: config.expectedCount,
                valid: 0,
                invalid: 0,
                avgCompleteness: 0,
                documents: []
            };

            const completenessScores = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const validation = validateDocument(data, doc.id, collectionName, allEntities);

                results.totalDocuments++;
                results.collections[collectionName].documents.push(validation);

                if (validation.isValid) {
                    results.validDocuments++;
                    results.collections[collectionName].valid++;
                } else {
                    results.invalidDocuments++;
                    results.collections[collectionName].invalid++;
                }

                completenessScores.push(validation.completeness.percentage);
            }

            // Calculate average completeness
            if (completenessScores.length > 0) {
                results.collections[collectionName].avgCompleteness = Math.round(
                    completenessScores.reduce((sum, val) => sum + val, 0) / completenessScores.length
                );
            }

        } catch (error) {
            console.error(`❌ Error validating ${collectionName}:`, error.message);
            results.collections[collectionName] = {
                error: error.message
            };
        }
    }

    return results;
}

/**
 * Generate compliance report
 */
function generateReport(results) {
    const report = {
        generated: new Date().toISOString(),
        summary: {
            totalDocuments: results.totalDocuments,
            validDocuments: results.validDocuments,
            invalidDocuments: results.invalidDocuments,
            complianceRate: Math.round((results.validDocuments / results.totalDocuments) * 100),
            avgCompleteness: 0
        },
        collections: {},
        priorityFixes: [],
        lowCompletenessEntities: [],
        brokenReferences: []
    };

    let totalCompleteness = 0;
    let totalDocs = 0;

    // Process each collection
    Object.entries(results.collections).forEach(([collectionName, data]) => {
        if (data.error) {
            report.collections[collectionName] = { error: data.error };
            return;
        }

        const complianceRate = data.count > 0
            ? Math.round((data.valid / data.count) * 100)
            : 0;

        report.collections[collectionName] = {
            documentCount: data.count,
            expectedCount: data.expectedCount,
            valid: data.valid,
            invalid: data.invalid,
            complianceRate: `${complianceRate}%`,
            avgCompleteness: `${data.avgCompleteness}%`,
            status: data.invalid === 0 ? '✅' : '⚠️'
        };

        totalCompleteness += data.avgCompleteness * data.count;
        totalDocs += data.count;

        // Collect low completeness entities
        data.documents.forEach(doc => {
            if (doc.completeness.percentage < 50) {
                report.lowCompletenessEntities.push({
                    collection: collectionName,
                    id: doc.id,
                    completeness: doc.completeness.percentage,
                    missingFields: doc.completeness.missingFields.slice(0, 5)
                });
            }

            // Collect critical errors
            const criticalErrors = doc.errors.filter(e => e.severity === 'critical');
            if (criticalErrors.length > 0) {
                report.priorityFixes.push({
                    collection: collectionName,
                    id: doc.id,
                    errors: criticalErrors
                });
            }

            // Collect broken references
            if (doc.brokenReferences.length > 0) {
                report.brokenReferences.push({
                    collection: collectionName,
                    id: doc.id,
                    references: doc.brokenReferences
                });
            }
        });
    });

    report.summary.avgCompleteness = totalDocs > 0
        ? Math.round(totalCompleteness / totalDocs)
        : 0;

    // Sort low completeness entities
    report.lowCompletenessEntities.sort((a, b) => a.completeness - b.completeness);

    return report;
}

/**
 * Print console summary
 */
function printSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('FIREBASE ENTITY-SCHEMA-V2.0 COMPLIANCE REPORT');
    console.log('='.repeat(80) + '\n');

    console.log('📊 EXECUTIVE SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total documents audited:     ${report.summary.totalDocuments}`);
    console.log(`Schema compliance:           ${report.summary.complianceRate}% (${report.summary.validDocuments}/${report.summary.totalDocuments} documents)`);
    console.log(`Average completeness:        ${report.summary.avgCompleteness}%`);
    console.log(`Invalid documents:           ${report.summary.invalidDocuments}`);
    console.log(`Priority fixes needed:       ${report.priorityFixes.length}`);
    console.log(`Broken cross-references:     ${report.brokenReferences.length}`);
    console.log(`Low completeness (<50%):     ${report.lowCompletenessEntities.length}\n`);

    console.log('📚 PER-COLLECTION RESULTS');
    console.log('-'.repeat(80));

    Object.entries(report.collections).forEach(([name, data]) => {
        if (data.error) {
            console.log(`${name.padEnd(20)} ❌ ERROR: ${data.error}`);
        } else {
            const countInfo = data.expectedCount
                ? `${data.documentCount}/${data.expectedCount}`
                : `${data.documentCount}`;

            console.log(`${name.padEnd(20)} ${data.status} ${countInfo.padEnd(12)} Compliance: ${data.complianceRate.padEnd(6)} Completeness: ${data.avgCompleteness}`);
        }
    });

    if (report.priorityFixes.length > 0) {
        console.log('\n🔴 PRIORITY FIXES (Critical Errors)');
        console.log('-'.repeat(80));
        report.priorityFixes.slice(0, 10).forEach(fix => {
            console.log(`${fix.collection}/${fix.id}`);
            fix.errors.forEach(err => {
                console.log(`  ❌ ${err.field}: ${err.message}`);
            });
        });
        if (report.priorityFixes.length > 10) {
            console.log(`... and ${report.priorityFixes.length - 10} more`);
        }
    }

    if (report.brokenReferences.length > 0) {
        console.log('\n🔗 BROKEN CROSS-REFERENCES');
        console.log('-'.repeat(80));
        report.brokenReferences.slice(0, 10).forEach(item => {
            console.log(`${item.collection}/${item.id}`);
            item.references.forEach(ref => {
                console.log(`  ⚠️  ${ref.field}: '${ref.referencedId}' (${ref.referencedName}) not found`);
            });
        });
        if (report.brokenReferences.length > 10) {
            console.log(`... and ${report.brokenReferences.length - 10} more`);
        }
    }

    if (report.lowCompletenessEntities.length > 0) {
        console.log('\n📉 LOW COMPLETENESS ENTITIES (<50%)');
        console.log('-'.repeat(80));
        report.lowCompletenessEntities.slice(0, 20).forEach(entity => {
            console.log(`${entity.collection}/${entity.id}: ${entity.completeness}%`);
            console.log(`  Missing: ${entity.missingFields.map(f => f.field).join(', ')}`);
        });
        if (report.lowCompletenessEntities.length > 20) {
            console.log(`... and ${report.lowCompletenessEntities.length - 20} more`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ RECOMMENDATIONS');
    console.log('='.repeat(80));
    console.log('1. Fix critical schema violations (missing required fields)');
    console.log('2. Resolve broken cross-references');
    console.log('3. Enrich entities with <50% completeness');
    console.log('4. Add linguistic metadata (pronunciation, etymology)');
    console.log('5. Add temporal metadata (firstAttestation, historicalDate)');
    console.log('6. Add geographical metadata (primaryLocation, region)');
    console.log('7. Set minimum completeness threshold: 60%');
    console.log('8. Validate all cross-references on upload');
    console.log('='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
    const collectionArg = args.find(a => a.startsWith('--collection='));
    const collectionFilter = collectionArg ? collectionArg.split('=')[1] : null;
    const shouldGenerateReport = args.includes('--report');

    try {
        // Run validation
        const results = validateLocal
            ? await validateLocalFiles()
            : await validateFirebase(collectionFilter);

        // Generate report
        const report = generateReport(results);

        // Print summary
        printSummary(report);

        // Save detailed report
        if (shouldGenerateReport) {
            const reportsDir = path.join(__dirname, 'reports');
            await fs.mkdir(reportsDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const reportPath = path.join(reportsDir, `firebase-compliance-${timestamp}.json`);

            await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
            console.log(`📄 Detailed report saved to: ${reportPath}\n`);
        }

        // Exit code
        if (report.summary.invalidDocuments > 0 || report.priorityFixes.length > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    validateDocument,
    calculateCompleteness,
    validateFirebase,
    validateLocalFiles,
    generateReport
};
