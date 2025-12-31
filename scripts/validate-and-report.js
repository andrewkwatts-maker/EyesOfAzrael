#!/usr/bin/env node
/**
 * Eyes of Azrael - Unified Validation & Report Generator
 *
 * Validates all Firebase assets in firebase-assets-downloaded/ folder
 * and generates comprehensive reports.
 *
 * Usage: node scripts/validate-and-report.js [options]
 *
 * Options:
 *   --output=DIR    Output directory for reports (default: firebase-assets-downloaded)
 *   --strict        Fail on any warning (default: fail only on errors)
 *   --verbose       Show detailed validation output
 *   --fix           Attempt to fix simple issues automatically
 *
 * Exit codes:
 *   0 = All validations passed
 *   1 = Critical errors found
 *   2 = Warnings found (with --strict)
 */

const fs = require('fs');
const path = require('path');

// ============================================
// Configuration
// ============================================
const CONFIG = {
    assetsDir: path.join(__dirname, '..', 'firebase-assets-downloaded'),
    outputDir: path.join(__dirname, '..', 'firebase-assets-downloaded'),

    // Collections to validate
    collections: [
        'deities', 'heroes', 'creatures', 'items', 'places',
        'cosmology', 'texts', 'rituals', 'herbs', 'concepts',
        'beings', 'symbols', 'events', 'archetypes', 'magic',
        'mythologies', 'angels', 'teachings'
    ],

    // Required fields for all entities
    requiredFields: ['id', 'name'],

    // Required fields by type (in addition to base required fields)
    requiredByType: {
        deity: ['mythology', 'type'],
        hero: ['mythology', 'type'],
        creature: ['mythology', 'type'],
        item: ['mythology', 'type'],
        place: ['mythology', 'type'],
        cosmology: ['mythology', 'type'],
        text: ['mythology', 'type'],
        ritual: ['mythology', 'type'],
        herb: ['mythology', 'type'],
        concept: ['mythology', 'type'],
        being: ['mythology', 'type'],
        symbol: ['mythology', 'type'],
        event: ['mythology', 'type'],
        archetype: ['type'],
        magic: ['mythology', 'type']
    },

    // Valid mythology values
    validMythologies: [
        'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'christian',
        'islamic', 'babylonian', 'sumerian', 'persian', 'roman', 'celtic',
        'chinese', 'japanese', 'aztec', 'mayan', 'yoruba', 'jewish', 'tarot',
        'universal', 'multiple'
    ],

    // Valid entity types
    validTypes: [
        'deity', 'hero', 'creature', 'item', 'place', 'cosmology',
        'text', 'ritual', 'herb', 'concept', 'being', 'symbol',
        'event', 'archetype', 'magic', 'mythology'
    ]
};

// ============================================
// Validation State
// ============================================
const state = {
    totalEntities: 0,
    validEntities: 0,
    issues: [],
    byCollection: {},
    byIssueType: {
        missingId: [],
        missingName: [],
        missingMythology: [],
        missingDescription: [],
        missingType: [],
        invalidMythology: [],
        invalidType: [],
        emptyRelations: [],
        brokenInternalLinks: []
    },
    startTime: Date.now()
};

// ============================================
// Issue Tracking
// ============================================
function addIssue(entityId, collection, type, message, severity = 'error') {
    const issue = {
        entityId,
        collection,
        type,
        message,
        severity,
        timestamp: new Date().toISOString()
    };

    state.issues.push(issue);

    if (state.byIssueType[type]) {
        state.byIssueType[type].push(entityId);
    }

    if (state.byCollection[collection]) {
        state.byCollection[collection].issues.push(issue);
    }
}

// ============================================
// Entity Validation
// ============================================
function validateEntity(entity, collection, filename) {
    const issues = [];
    const entityId = entity.id || filename.replace('.json', '');

    // Check required fields
    if (!entity.id) {
        addIssue(entityId, collection, 'missingId', 'Missing required field: id', 'error');
        issues.push('missing id');
    }

    if (!entity.name) {
        addIssue(entityId, collection, 'missingName', 'Missing required field: name', 'error');
        issues.push('missing name');
    }

    // Check type-specific required fields
    const entityType = entity.type || collection.replace(/s$/, ''); // Remove trailing 's'
    const typeRequirements = CONFIG.requiredByType[entityType] || [];

    for (const field of typeRequirements) {
        if (field === 'mythology' && !entity.mythology) {
            addIssue(entityId, collection, 'missingMythology', 'Missing required field: mythology', 'warning');
            issues.push('missing mythology');
        }
        if (field === 'type' && !entity.type) {
            addIssue(entityId, collection, 'missingType', 'Missing required field: type', 'warning');
            issues.push('missing type');
        }
    }

    // Validate mythology value
    if (entity.mythology && !CONFIG.validMythologies.includes(entity.mythology.toLowerCase())) {
        addIssue(entityId, collection, 'invalidMythology',
            `Invalid mythology value: "${entity.mythology}"`, 'error');
        issues.push('invalid mythology');
    }

    // Validate type value
    if (entity.type && !CONFIG.validTypes.includes(entity.type.toLowerCase())) {
        addIssue(entityId, collection, 'invalidType',
            `Invalid type value: "${entity.type}"`, 'error');
        issues.push('invalid type');
    }

    // Check for description (warning only)
    if (!entity.description && !entity.summary && !entity.shortDescription) {
        addIssue(entityId, collection, 'missingDescription',
            'No description, summary, or shortDescription field', 'info');
    }

    // Validate internal links (relatedEntities, relatedDeities, etc.)
    validateRelations(entity, entityId, collection);

    return issues.length === 0;
}

function validateRelations(entity, entityId, collection) {
    const relationFields = [
        'relatedEntities', 'relatedDeities', 'relatedHeroes',
        'relatedCreatures', 'relatedItems', 'relatedPlaces'
    ];

    for (const field of relationFields) {
        if (entity[field] && Array.isArray(entity[field])) {
            for (const relation of entity[field]) {
                // Check if relation has proper structure
                if (typeof relation === 'string') {
                    // Simple string ID - check if it looks valid
                    if (!relation.match(/^[a-z0-9_-]+$/i)) {
                        addIssue(entityId, collection, 'brokenInternalLinks',
                            `Invalid relation format in ${field}: "${relation}"`, 'warning');
                    }
                } else if (typeof relation === 'object') {
                    // Object relation - should have id or name
                    if (!relation.id && !relation.name && !relation.link) {
                        addIssue(entityId, collection, 'brokenInternalLinks',
                            `Relation in ${field} missing id/name/link`, 'warning');
                    }
                }
            }
        }
    }
}

// ============================================
// Collection Processing
// ============================================
function processCollection(collectionName) {
    const collectionPath = path.join(CONFIG.assetsDir, collectionName);

    // Initialize collection stats
    state.byCollection[collectionName] = {
        total: 0,
        valid: 0,
        issues: []
    };

    // Check if collection directory exists
    if (!fs.existsSync(collectionPath)) {
        return;
    }

    // Get all JSON files (exclude _all.json and _*.json metadata files)
    const files = fs.readdirSync(collectionPath)
        .filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of files) {
        const filePath = path.join(collectionPath, file);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);

            // Handle arrays (grouped entity files like greek.json, norse.json)
            if (Array.isArray(data)) {
                // This is a grouped file containing multiple entities
                for (const entity of data) {
                    if (entity && typeof entity === 'object' && entity.id) {
                        state.totalEntities++;
                        state.byCollection[collectionName].total++;

                        const isValid = validateEntity(entity, collectionName, `${file}[${entity.id}]`);
                        if (isValid) {
                            state.validEntities++;
                            state.byCollection[collectionName].valid++;
                        }
                    }
                }
            } else if (data && typeof data === 'object') {
                // Single entity file
                state.totalEntities++;
                state.byCollection[collectionName].total++;

                const isValid = validateEntity(data, collectionName, file);
                if (isValid) {
                    state.validEntities++;
                    state.byCollection[collectionName].valid++;
                }
            }
        } catch (error) {
            addIssue(file, collectionName, 'parseError',
                `Failed to parse JSON: ${error.message}`, 'error');
        }
    }
}

// ============================================
// Report Generation
// ============================================
function generateReport() {
    const duration = ((Date.now() - state.startTime) / 1000).toFixed(2);
    const passRate = state.totalEntities > 0
        ? ((state.validEntities / state.totalEntities) * 100).toFixed(1)
        : 0;

    const report = {
        summary: {
            timestamp: new Date().toISOString(),
            duration: `${duration}s`,
            total: state.totalEntities,
            valid: state.validEntities,
            invalid: state.totalEntities - state.validEntities,
            passRate: `${passRate}%`,
            issueCount: state.issues.length
        },
        byCollection: state.byCollection,
        byIssueType: state.byIssueType,
        issues: state.issues
    };

    return report;
}

function generateSummaryText(report) {
    const lines = [
        '========================================',
        '  VALIDATION SUMMARY',
        '========================================',
        '',
        `  Total Entities:  ${report.summary.total}`,
        `  Valid Entities:  ${report.summary.valid}`,
        `  Invalid:         ${report.summary.invalid}`,
        `  Pass Rate:       ${report.summary.passRate}`,
        `  Issues Found:    ${report.summary.issueCount}`,
        `  Duration:        ${report.summary.duration}`,
        '',
        '  Collections:',
    ];

    // Collection breakdown
    for (const [name, stats] of Object.entries(report.byCollection)) {
        if (stats.total > 0) {
            const status = stats.issues.length === 0 ? '[OK]' : '[!!]';
            lines.push(`    ${status} ${name}: ${stats.valid}/${stats.total}`);
        }
    }

    // Issue summary
    if (report.summary.issueCount > 0) {
        lines.push('');
        lines.push('  Issue Types:');
        for (const [type, ids] of Object.entries(report.byIssueType)) {
            if (ids.length > 0) {
                lines.push(`    - ${type}: ${ids.length}`);
            }
        }
    }

    lines.push('');
    lines.push('========================================');

    return lines.join('\n');
}

// ============================================
// Main Execution
// ============================================
async function main() {
    console.log('Eyes of Azrael - Entity Validation');
    console.log('===================================\n');

    // Check if assets directory exists
    if (!fs.existsSync(CONFIG.assetsDir)) {
        console.error(`ERROR: Assets directory not found: ${CONFIG.assetsDir}`);
        console.error('Run download-all-firebase-assets.js first.');
        process.exit(1);
    }

    // Process each collection
    console.log('Validating collections...\n');

    for (const collection of CONFIG.collections) {
        process.stdout.write(`  Checking ${collection}...`);
        processCollection(collection);
        const stats = state.byCollection[collection];
        if (stats && stats.total > 0) {
            const status = stats.issues.length === 0 ? 'OK' : `${stats.issues.length} issues`;
            console.log(` ${stats.valid}/${stats.total} (${status})`);
        } else {
            console.log(' (empty)');
        }
    }

    // Generate reports
    console.log('\nGenerating reports...');

    const report = generateReport();
    const summaryText = generateSummaryText(report);

    // Write JSON report
    const reportPath = path.join(CONFIG.outputDir, '_validation_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`  Written: ${reportPath}`);

    // Write summary text
    const summaryPath = path.join(CONFIG.outputDir, '_validation_summary.txt');
    fs.writeFileSync(summaryPath, summaryText);
    console.log(`  Written: ${summaryPath}`);

    // Display summary
    console.log('\n' + summaryText);

    // Exit with appropriate code
    const hasErrors = state.issues.some(i => i.severity === 'error');
    const hasWarnings = state.issues.some(i => i.severity === 'warning');

    if (hasErrors) {
        console.log('\nResult: FAILED (errors found)');
        process.exit(1);
    } else if (hasWarnings && process.argv.includes('--strict')) {
        console.log('\nResult: FAILED (warnings found in strict mode)');
        process.exit(2);
    } else {
        console.log('\nResult: PASSED');
        process.exit(0);
    }
}

// Run
main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
