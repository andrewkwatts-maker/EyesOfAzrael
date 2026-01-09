/**
 * Validate Schema
 * Validates all assets against their type-specific schemas
 * Eyes of Azrael Validation System
 *
 * Usage: node validate-schema.js [--collection=name] [--verbose] [--output=file]
 */

const fs = require('fs');
const path = require('path');
const { getSchema, baseSchema, getAvailableTypes } = require('./schemas');

// Configuration
const CONFIG = {
    assetsDir: path.resolve(__dirname, '../../firebase-assets-downloaded'),
    outputDir: path.resolve(__dirname, '../../reports'),
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
        verbose: false,
        output: null,
        help: false
    };

    process.argv.slice(2).forEach(arg => {
        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg === '--verbose' || arg === '-v') {
            args.verbose = true;
        } else if (arg.startsWith('--collection=')) {
            args.collection = arg.split('=')[1];
        } else if (arg.startsWith('--output=')) {
            args.output = arg.split('=')[1];
        }
    });

    return args;
}

// Show help message
function showHelp() {
    console.log(`
Validate Schema - Eyes of Azrael Validation System

Validates all assets against their type-specific schemas.

Usage: node validate-schema.js [options]

Options:
  --collection=name  Only validate a specific collection
  --verbose, -v      Show detailed validation messages
  --output=file      Output results to a specific file
  --help, -h         Show this help message

Available collections:
  ${CONFIG.collections.join(', ')}

Examples:
  node validate-schema.js                      # Validate all collections
  node validate-schema.js --collection=deities # Validate only deities
  node validate-schema.js --verbose            # Show detailed output
`);
}

/**
 * Validate a field value against expected type
 */
function validateFieldType(value, expectedType, fieldName) {
    if (value === null || value === undefined) {
        return { valid: true, type: 'null' };
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    // Handle multiple allowed types
    const allowedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];

    if (allowedTypes.includes(actualType)) {
        return { valid: true, type: actualType };
    }

    return {
        valid: false,
        type: actualType,
        expected: allowedTypes.join(' or '),
        message: `Field "${fieldName}" should be ${allowedTypes.join(' or ')} but got ${actualType}`
    };
}

/**
 * Validate a single asset against its schema
 */
function validateAsset(asset, collectionName) {
    const errors = [];
    const warnings = [];
    const info = [];

    // Get asset type
    const assetType = asset.type || collectionName.replace(/s$/, '');
    const schema = getSchema(assetType);

    if (!schema) {
        warnings.push({
            field: 'type',
            message: `No schema found for type "${assetType}", using base schema only`
        });
    }

    // Combine base schema and type-specific schema
    const requiredFields = [...baseSchema.required];
    if (schema && schema.required) {
        requiredFields.push(...schema.required.filter(f => !requiredFields.includes(f)));
    }

    // Check required fields
    for (const field of requiredFields) {
        if (asset[field] === undefined || asset[field] === null) {
            errors.push({
                field,
                message: `Required field "${field}" is missing`
            });
        } else if (typeof asset[field] === 'string' && asset[field].trim() === '') {
            errors.push({
                field,
                message: `Required field "${field}" is empty`
            });
        }
    }

    // Check field types from base schema
    for (const [field, expectedType] of Object.entries(baseSchema.fieldTypes)) {
        if (asset[field] !== undefined) {
            const result = validateFieldType(asset[field], expectedType, field);
            if (!result.valid) {
                errors.push({
                    field,
                    message: result.message
                });
            }
        }
    }

    // Check field types from type-specific schema
    if (schema && schema.fieldTypes) {
        for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
            if (asset[field] !== undefined) {
                const result = validateFieldType(asset[field], expectedType, field);
                if (!result.valid) {
                    errors.push({
                        field,
                        message: result.message
                    });
                }
            }
        }
    }

    // Check type value is valid
    if (asset.type && !baseSchema.validTypes.includes(asset.type)) {
        warnings.push({
            field: 'type',
            message: `Type "${asset.type}" is not in the standard list of types`
        });
    }

    // Validate ID format
    if (asset.id) {
        const idRule = baseSchema.rules.id;
        if (asset.id.length < idRule.minLength) {
            errors.push({
                field: 'id',
                message: `ID "${asset.id}" is too short (min ${idRule.minLength} characters)`
            });
        }
        if (asset.id.length > idRule.maxLength) {
            errors.push({
                field: 'id',
                message: `ID "${asset.id}" exceeds max length (${idRule.maxLength} characters)`
            });
        }
    }

    // Check recommended fields for completeness
    if (schema && schema.recommended) {
        let presentCount = 0;
        for (const field of schema.recommended) {
            if (asset[field] !== undefined && asset[field] !== null && asset[field] !== '') {
                presentCount++;
            } else {
                info.push({
                    field,
                    message: `Recommended field "${field}" is missing`
                });
            }
        }
        const completeness = Math.round((presentCount / schema.recommended.length) * 100);
        info.push({
            field: '_completeness',
            message: `Completeness score: ${completeness}%`,
            value: completeness
        });
    }

    // Check for empty arrays that should have content
    const arrayFields = ['primarySources', 'relatedEntities', 'tags', 'searchTerms'];
    for (const field of arrayFields) {
        if (Array.isArray(asset[field]) && asset[field].length === 0) {
            info.push({
                field,
                message: `Array field "${field}" is empty`
            });
        }
    }

    // Check for malformed data in common fields
    if (asset.description && typeof asset.description === 'string') {
        // Check for truncated HTML or encoding issues
        if (asset.description.includes('<!DOCTYPE') || asset.description.includes('<html')) {
            warnings.push({
                field: 'description',
                message: 'Description appears to contain raw HTML'
            });
        }
        if (asset.description.includes('\\n\\n\\n')) {
            warnings.push({
                field: 'description',
                message: 'Description has excessive newlines'
            });
        }
    }

    // Check icon field for SVG or emoji
    if (asset.icon) {
        if (asset.iconType === 'svg' && !asset.icon.includes('<svg')) {
            warnings.push({
                field: 'icon',
                message: 'iconType is "svg" but icon does not contain SVG markup'
            });
        }
    }

    return {
        id: asset.id || 'unknown',
        name: asset.name || 'unknown',
        type: assetType,
        valid: errors.length === 0,
        errors,
        warnings,
        info
    };
}

/**
 * Validate all assets in a collection
 */
function validateCollection(collectionName, verbose = false) {
    const collectionDir = path.join(CONFIG.assetsDir, collectionName);
    const results = {
        collection: collectionName,
        totalAssets: 0,
        validAssets: 0,
        invalidAssets: 0,
        totalErrors: 0,
        totalWarnings: 0,
        assets: []
    };

    if (!fs.existsSync(collectionDir)) {
        console.log(`[Warning] Collection directory not found: ${collectionDir}`);
        return results;
    }

    // Get all JSON files (excluding special files)
    const files = fs.readdirSync(collectionDir).filter(f =>
        f.endsWith('.json') &&
        !f.startsWith('_') &&
        !f.endsWith('.backup')
    );

    results.totalAssets = files.length;
    console.log(`[Validating] ${collectionName}: ${files.length} assets`);

    for (const file of files) {
        try {
            const filepath = path.join(collectionDir, file);
            const content = fs.readFileSync(filepath, 'utf8');
            const asset = JSON.parse(content);

            const validation = validateAsset(asset, collectionName);
            validation.file = file;

            if (validation.valid) {
                results.validAssets++;
            } else {
                results.invalidAssets++;
            }

            results.totalErrors += validation.errors.length;
            results.totalWarnings += validation.warnings.length;
            results.assets.push(validation);

            if (verbose && (validation.errors.length > 0 || validation.warnings.length > 0)) {
                console.log(`  ${file}:`);
                validation.errors.forEach(e => console.log(`    [ERROR] ${e.message}`));
                validation.warnings.forEach(w => console.log(`    [WARN] ${w.message}`));
            }

        } catch (error) {
            results.invalidAssets++;
            results.totalErrors++;
            results.assets.push({
                file,
                id: file.replace('.json', ''),
                valid: false,
                errors: [{
                    field: '_parse',
                    message: `Failed to parse JSON: ${error.message}`
                }],
                warnings: [],
                info: []
            });

            if (verbose) {
                console.log(`  ${file}: [ERROR] Failed to parse - ${error.message}`);
            }
        }
    }

    console.log(`[Complete] ${collectionName}: ${results.validAssets}/${results.totalAssets} valid (${results.totalErrors} errors, ${results.totalWarnings} warnings)`);

    return results;
}

/**
 * Generate validation report
 */
function generateReport(allResults, outputPath = null) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalCollections: Object.keys(allResults).length,
            totalAssets: 0,
            validAssets: 0,
            invalidAssets: 0,
            totalErrors: 0,
            totalWarnings: 0,
            passRate: 0
        },
        collections: {},
        errorsByType: {},
        warningsByType: {}
    };

    // Aggregate results
    for (const [collection, results] of Object.entries(allResults)) {
        report.summary.totalAssets += results.totalAssets;
        report.summary.validAssets += results.validAssets;
        report.summary.invalidAssets += results.invalidAssets;
        report.summary.totalErrors += results.totalErrors;
        report.summary.totalWarnings += results.totalWarnings;

        report.collections[collection] = {
            totalAssets: results.totalAssets,
            validAssets: results.validAssets,
            invalidAssets: results.invalidAssets,
            totalErrors: results.totalErrors,
            totalWarnings: results.totalWarnings,
            passRate: results.totalAssets > 0
                ? Math.round((results.validAssets / results.totalAssets) * 100)
                : 100
        };

        // Aggregate errors by type
        for (const asset of results.assets) {
            for (const error of asset.errors) {
                const key = error.field || 'unknown';
                if (!report.errorsByType[key]) {
                    report.errorsByType[key] = [];
                }
                report.errorsByType[key].push({
                    collection,
                    asset: asset.id,
                    message: error.message
                });
            }
            for (const warning of asset.warnings) {
                const key = warning.field || 'unknown';
                if (!report.warningsByType[key]) {
                    report.warningsByType[key] = [];
                }
                report.warningsByType[key].push({
                    collection,
                    asset: asset.id,
                    message: warning.message
                });
            }
        }
    }

    // Calculate overall pass rate
    report.summary.passRate = report.summary.totalAssets > 0
        ? Math.round((report.summary.validAssets / report.summary.totalAssets) * 100)
        : 100;

    // Determine output path
    const finalOutputPath = outputPath || path.join(CONFIG.outputDir, 'schema-validation.json');

    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write report
    fs.writeFileSync(finalOutputPath, JSON.stringify(report, null, 2));
    console.log(`\n[Report] Saved to ${finalOutputPath}`);

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
    console.log('Validate Schema - Eyes of Azrael');
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

    const allResults = {};

    for (const collection of collectionsToProcess) {
        allResults[collection] = validateCollection(collection, args.verbose);
    }

    // Generate report
    const report = generateReport(allResults, args.output);

    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Collections validated: ${report.summary.totalCollections}`);
    console.log(`Total assets: ${report.summary.totalAssets}`);
    console.log(`Valid assets: ${report.summary.validAssets}`);
    console.log(`Invalid assets: ${report.summary.invalidAssets}`);
    console.log(`Total errors: ${report.summary.totalErrors}`);
    console.log(`Total warnings: ${report.summary.totalWarnings}`);
    console.log(`Pass rate: ${report.summary.passRate}%`);

    // Exit with error code if there are validation errors
    if (report.summary.invalidAssets > 0) {
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    CONFIG,
    validateAsset,
    validateCollection,
    generateReport
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
