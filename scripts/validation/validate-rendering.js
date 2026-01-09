/**
 * Validate Rendering
 * Tests that all assets can be rendered without errors
 * Eyes of Azrael Validation System
 *
 * Usage: node validate-rendering.js [--collection=name] [--verbose] [--output=file]
 */

const fs = require('fs');
const path = require('path');

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

// Entity type icons (matching universal-display-renderer.js)
const ENTITY_TYPE_ICONS = {
    deity: '->',
    hero: '->',
    creature: '->',
    item: '->',
    place: '->',
    concept: '->',
    magic: '->',
    ritual: '->',
    herb: '->',
    symbol: '->',
    text: '->',
    archetype: '->',
    mythology: '->',
    cosmology: '->>'
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
Validate Rendering - Eyes of Azrael Validation System

Tests that all assets can be rendered without errors.

Usage: node validate-rendering.js [options]

Options:
  --collection=name  Only validate a specific collection
  --verbose, -v      Show detailed validation messages
  --output=file      Output results to a specific file
  --help, -h         Show this help message

Available collections:
  ${CONFIG.collections.join(', ')}
`);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Truncate text safely
 */
function truncateText(text, maxLength = 150) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Simulate rendering an asset to a grid card
 */
function simulateGridRender(asset) {
    const errors = [];
    const warnings = [];

    try {
        // Check required rendering fields
        const name = asset.name || asset.displayName;
        if (!name) {
            errors.push('No name or displayName for card title');
        }

        // Check for icon/image
        const icon = asset.icon;
        const iconType = asset.iconType;

        if (icon) {
            if (iconType === 'svg') {
                if (!icon.includes('<svg')) {
                    warnings.push('iconType is svg but icon does not contain SVG markup');
                }
                // Check for valid SVG
                if (!icon.includes('</svg>')) {
                    errors.push('SVG icon is malformed (missing closing tag)');
                }
            } else if (icon.startsWith('http')) {
                // URL icon - should be valid
            } else if (icon.length > 10) {
                // Might be inline SVG without proper iconType
                if (icon.includes('<svg')) {
                    warnings.push('Icon contains SVG but iconType is not set to "svg"');
                }
            }
        }

        // Check description for rendering
        const description = asset.description || asset.shortDescription;
        if (description) {
            // Check for problematic content
            if (typeof description !== 'string') {
                errors.push(`Description is not a string (type: ${typeof description})`);
            } else {
                // Check for HTML in description that might break rendering
                if (description.includes('<script')) {
                    errors.push('Description contains script tags');
                }
                if (description.includes('javascript:')) {
                    errors.push('Description contains javascript: protocol');
                }
            }
        }

        // Check for circular references in relatedEntities
        if (asset.relatedEntities) {
            try {
                // This would throw on circular references
                JSON.stringify(asset.relatedEntities);
            } catch (e) {
                errors.push('relatedEntities contains circular references');
            }
        }

        // Check metadata rendering
        if (asset.metadata) {
            if (typeof asset.metadata !== 'object') {
                errors.push('metadata is not an object');
            }
        }

        // Check arrays for rendering issues
        const arrayFields = ['domains', 'symbols', 'epithets', 'abilities', 'characteristics', 'tags'];
        for (const field of arrayFields) {
            if (asset[field]) {
                if (!Array.isArray(asset[field])) {
                    errors.push(`${field} should be array but is ${typeof asset[field]}`);
                } else {
                    // Check for non-string items that might break pill rendering
                    for (let i = 0; i < asset[field].length; i++) {
                        const item = asset[field][i];
                        if (item !== null && typeof item !== 'string' && typeof item !== 'object') {
                            warnings.push(`${field}[${i}] has unexpected type: ${typeof item}`);
                        }
                    }
                }
            }
        }

        // Simulate HTML generation (basic)
        const html = generateTestHtml(asset);
        if (!html) {
            errors.push('Failed to generate HTML output');
        }

    } catch (error) {
        errors.push(`Rendering simulation failed: ${error.message}`);
    }

    return { errors, warnings };
}

/**
 * Generate test HTML to verify asset can render
 */
function generateTestHtml(asset) {
    try {
        const type = asset.type || 'unknown';
        const name = escapeHtml(asset.name || asset.displayName || 'Unnamed');
        const description = escapeHtml(truncateText(asset.description || asset.shortDescription || '', 200));
        const mythology = escapeHtml(asset.mythology || '');

        let iconHtml = '';
        if (asset.icon) {
            if (asset.iconType === 'svg' && asset.icon.includes('<svg')) {
                iconHtml = asset.icon; // Use SVG directly
            } else if (asset.icon.startsWith('http')) {
                iconHtml = `<img src="${escapeHtml(asset.icon)}" alt="${name}">`;
            } else {
                iconHtml = `<span class="icon">${escapeHtml(asset.icon)}</span>`;
            }
        } else {
            iconHtml = `<span class="icon">${ENTITY_TYPE_ICONS[type] || '?'}</span>`;
        }

        // Generate pills for array fields
        let pillsHtml = '';
        const pillFields = ['domains', 'tags', 'symbols'];
        for (const field of pillFields) {
            if (Array.isArray(asset[field]) && asset[field].length > 0) {
                const pills = asset[field].slice(0, 5).map(item => {
                    const text = typeof item === 'object' ? (item.name || JSON.stringify(item)) : String(item);
                    return `<span class="pill">${escapeHtml(text)}</span>`;
                }).join('');
                pillsHtml += pills;
            }
        }

        const html = `
            <div class="entity-card" data-type="${escapeHtml(type)}" data-id="${escapeHtml(asset.id || '')}">
                <div class="card-icon">${iconHtml}</div>
                <div class="card-content">
                    <h3 class="card-title">${name}</h3>
                    <p class="card-mythology">${mythology}</p>
                    <p class="card-description">${description}</p>
                    <div class="card-pills">${pillsHtml}</div>
                </div>
            </div>
        `;

        return html;

    } catch (error) {
        return null;
    }
}

/**
 * Validate rendering for a single asset
 */
function validateAssetRendering(asset, collectionName) {
    const results = {
        id: asset.id || 'unknown',
        name: asset.name || asset.displayName || 'unknown',
        type: asset.type || collectionName.replace(/s$/, ''),
        renderable: true,
        errors: [],
        warnings: []
    };

    // Test grid rendering
    const gridResult = simulateGridRender(asset);
    results.errors.push(...gridResult.errors);
    results.warnings.push(...gridResult.warnings);

    // Additional rendering checks

    // Check for deeply nested objects that might cause issues
    try {
        const jsonStr = JSON.stringify(asset);
        if (jsonStr.length > 500000) {
            results.warnings.push('Asset JSON is very large (>500KB), may slow rendering');
        }
    } catch (e) {
        results.errors.push('Asset cannot be serialized to JSON');
    }

    // Check for problematic field values
    if (asset.content && typeof asset.content === 'string' && asset.content.length > 100000) {
        results.warnings.push('Content field is very large (>100KB)');
    }

    // Check for malformed dates
    const dateFields = ['createdAt', 'updatedAt', 'updated_at', '_modified', '_created'];
    for (const field of dateFields) {
        if (asset[field]) {
            if (typeof asset[field] === 'object' && asset[field]._seconds) {
                // Firestore timestamp format - valid
            } else if (typeof asset[field] === 'string') {
                const date = new Date(asset[field]);
                if (isNaN(date.getTime())) {
                    results.warnings.push(`${field} contains invalid date string`);
                }
            }
        }
    }

    // Determine if renderable
    results.renderable = results.errors.length === 0;

    return results;
}

/**
 * Validate all assets in a collection for rendering
 */
function validateCollection(collectionName, verbose = false) {
    const collectionDir = path.join(CONFIG.assetsDir, collectionName);
    const results = {
        collection: collectionName,
        totalAssets: 0,
        renderableAssets: 0,
        unrenderableAssets: 0,
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
    console.log(`[Validating Rendering] ${collectionName}: ${files.length} assets`);

    for (const file of files) {
        try {
            const filepath = path.join(collectionDir, file);
            const content = fs.readFileSync(filepath, 'utf8');
            const asset = JSON.parse(content);

            const validation = validateAssetRendering(asset, collectionName);
            validation.file = file;

            if (validation.renderable) {
                results.renderableAssets++;
            } else {
                results.unrenderableAssets++;
            }

            results.totalErrors += validation.errors.length;
            results.totalWarnings += validation.warnings.length;
            results.assets.push(validation);

            if (verbose && (validation.errors.length > 0 || validation.warnings.length > 0)) {
                console.log(`  ${file}:`);
                validation.errors.forEach(e => console.log(`    [ERROR] ${e}`));
                validation.warnings.forEach(w => console.log(`    [WARN] ${w}`));
            }

        } catch (error) {
            results.unrenderableAssets++;
            results.totalErrors++;
            results.assets.push({
                file,
                id: file.replace('.json', ''),
                renderable: false,
                errors: [`Failed to parse/render: ${error.message}`],
                warnings: []
            });

            if (verbose) {
                console.log(`  ${file}: [ERROR] ${error.message}`);
            }
        }
    }

    console.log(`[Complete] ${collectionName}: ${results.renderableAssets}/${results.totalAssets} renderable (${results.totalErrors} errors, ${results.totalWarnings} warnings)`);

    return results;
}

/**
 * Generate rendering validation report
 */
function generateReport(allResults, outputPath = null) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalCollections: Object.keys(allResults).length,
            totalAssets: 0,
            renderableAssets: 0,
            unrenderableAssets: 0,
            totalErrors: 0,
            totalWarnings: 0,
            renderRate: 0
        },
        collections: {},
        commonErrors: {},
        commonWarnings: {}
    };

    // Aggregate results
    for (const [collection, results] of Object.entries(allResults)) {
        report.summary.totalAssets += results.totalAssets;
        report.summary.renderableAssets += results.renderableAssets;
        report.summary.unrenderableAssets += results.unrenderableAssets;
        report.summary.totalErrors += results.totalErrors;
        report.summary.totalWarnings += results.totalWarnings;

        report.collections[collection] = {
            totalAssets: results.totalAssets,
            renderableAssets: results.renderableAssets,
            unrenderableAssets: results.unrenderableAssets,
            totalErrors: results.totalErrors,
            totalWarnings: results.totalWarnings,
            renderRate: results.totalAssets > 0
                ? Math.round((results.renderableAssets / results.totalAssets) * 100)
                : 100
        };

        // Aggregate common errors
        for (const asset of results.assets) {
            for (const error of asset.errors) {
                if (!report.commonErrors[error]) {
                    report.commonErrors[error] = { count: 0, examples: [] };
                }
                report.commonErrors[error].count++;
                if (report.commonErrors[error].examples.length < 3) {
                    report.commonErrors[error].examples.push({
                        collection,
                        asset: asset.id
                    });
                }
            }
            for (const warning of asset.warnings) {
                if (!report.commonWarnings[warning]) {
                    report.commonWarnings[warning] = { count: 0, examples: [] };
                }
                report.commonWarnings[warning].count++;
                if (report.commonWarnings[warning].examples.length < 3) {
                    report.commonWarnings[warning].examples.push({
                        collection,
                        asset: asset.id
                    });
                }
            }
        }
    }

    // Calculate overall render rate
    report.summary.renderRate = report.summary.totalAssets > 0
        ? Math.round((report.summary.renderableAssets / report.summary.totalAssets) * 100)
        : 100;

    // Determine output path
    const finalOutputPath = outputPath || path.join(CONFIG.outputDir, 'rendering-validation.json');

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
    console.log('Validate Rendering - Eyes of Azrael');
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
    console.log(`Renderable: ${report.summary.renderableAssets}`);
    console.log(`Unrenderable: ${report.summary.unrenderableAssets}`);
    console.log(`Total errors: ${report.summary.totalErrors}`);
    console.log(`Total warnings: ${report.summary.totalWarnings}`);
    console.log(`Render rate: ${report.summary.renderRate}%`);

    // Exit with error code if there are rendering errors
    if (report.summary.unrenderableAssets > 0) {
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    CONFIG,
    validateAssetRendering,
    validateCollection,
    generateReport,
    simulateGridRender
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
