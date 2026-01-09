/**
 * Validate Links
 * Checks all internal links are valid
 * Eyes of Azrael Validation System
 *
 * Usage: node validate-links.js [--collection=name] [--verbose] [--output=file]
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

// Build index of all assets for link validation
let assetIndex = null;

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
Validate Links - Eyes of Azrael Validation System

Checks all internal links between assets are valid.

Usage: node validate-links.js [options]

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
 * Build an index of all assets for quick lookup
 */
function buildAssetIndex() {
    if (assetIndex) return assetIndex;

    console.log('[Building] Asset index for link validation...');
    assetIndex = {
        byId: {},
        byType: {},
        byMythology: {},
        byName: {}
    };

    for (const collection of CONFIG.collections) {
        const collectionDir = path.join(CONFIG.assetsDir, collection);
        if (!fs.existsSync(collectionDir)) continue;

        const files = fs.readdirSync(collectionDir).filter(f =>
            f.endsWith('.json') &&
            !f.startsWith('_') &&
            !f.endsWith('.backup')
        );

        for (const file of files) {
            try {
                const filepath = path.join(collectionDir, file);
                const content = fs.readFileSync(filepath, 'utf8');
                const asset = JSON.parse(content);

                const id = asset.id || file.replace('.json', '');
                const type = asset.type || collection.replace(/s$/, '');
                const mythology = asset.mythology || 'unknown';
                const name = (asset.name || asset.displayName || '').toLowerCase();

                // Index by ID
                assetIndex.byId[id] = { collection, file, type, mythology };

                // Index by type
                if (!assetIndex.byType[type]) {
                    assetIndex.byType[type] = [];
                }
                assetIndex.byType[type].push(id);

                // Index by mythology
                if (!assetIndex.byMythology[mythology]) {
                    assetIndex.byMythology[mythology] = [];
                }
                assetIndex.byMythology[mythology].push(id);

                // Index by name (for fuzzy matching)
                if (name) {
                    assetIndex.byName[name] = id;
                }

            } catch (error) {
                // Skip invalid files
            }
        }
    }

    const totalAssets = Object.keys(assetIndex.byId).length;
    console.log(`[Complete] Indexed ${totalAssets} assets`);

    return assetIndex;
}

/**
 * Parse and normalize a link/reference
 */
function parseLink(link) {
    if (!link) return null;

    // Handle object references
    if (typeof link === 'object') {
        return {
            type: link.type || null,
            id: link.id || null,
            name: link.name || null,
            mythology: link.mythology || null,
            url: link.url || link.link || null
        };
    }

    // Handle string references
    if (typeof link === 'string') {
        // Check for URL format
        if (link.startsWith('http://') || link.startsWith('https://')) {
            return { type: 'external', url: link };
        }

        // Check for hash route format (#/type/id)
        const hashMatch = link.match(/^#\/(\w+)\/(.+)$/);
        if (hashMatch) {
            return {
                type: hashMatch[1].replace(/s$/, ''),
                id: hashMatch[2]
            };
        }

        // Check for relative path format (../../type/id.html)
        const pathMatch = link.match(/\/(\w+)\/([^\/]+)\.html$/);
        if (pathMatch) {
            return {
                type: pathMatch[1].replace(/s$/, ''),
                id: pathMatch[2]
            };
        }

        // Plain ID reference
        return { id: link };
    }

    return null;
}

/**
 * Check if a link target exists
 */
function checkLinkExists(link, sourceAsset) {
    const index = buildAssetIndex();
    const parsed = parseLink(link);

    if (!parsed) {
        return { valid: false, reason: 'Could not parse link' };
    }

    // External links are not validated
    if (parsed.type === 'external') {
        return { valid: true, external: true };
    }

    // Check by ID first
    if (parsed.id) {
        if (index.byId[parsed.id]) {
            return { valid: true, target: index.byId[parsed.id] };
        }

        // Try with mythology prefix
        if (parsed.mythology) {
            const prefixedId = `${parsed.mythology}_${parsed.id}`;
            if (index.byId[prefixedId]) {
                return { valid: true, target: index.byId[prefixedId] };
            }
        }

        // Try source mythology prefix
        if (sourceAsset.mythology) {
            const prefixedId = `${sourceAsset.mythology}_${parsed.id}`;
            if (index.byId[prefixedId]) {
                return { valid: true, target: index.byId[prefixedId] };
            }
        }
    }

    // Check by name
    if (parsed.name) {
        const normalizedName = parsed.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (index.byName[normalizedName]) {
            return { valid: true, target: index.byId[index.byName[normalizedName]] };
        }
    }

    // Check if type+id combination might exist
    if (parsed.type && parsed.id) {
        // Check in type index
        if (index.byType[parsed.type] && index.byType[parsed.type].includes(parsed.id)) {
            return { valid: true };
        }
    }

    return {
        valid: false,
        reason: 'Target not found',
        parsed
    };
}

/**
 * Extract all links from an asset
 */
function extractLinks(asset) {
    const links = [];

    // Helper to add link with context
    function addLink(value, field, index = null) {
        if (!value) return;

        const path = index !== null ? `${field}[${index}]` : field;

        if (typeof value === 'string' && (value.includes('html') || value.includes('#/'))) {
            links.push({ value, field: path });
        } else if (typeof value === 'object') {
            if (value.link || value.url || value.id) {
                links.push({ value, field: path });
            }
        }
    }

    // Check relatedEntities
    if (asset.relatedEntities) {
        if (Array.isArray(asset.relatedEntities)) {
            asset.relatedEntities.forEach((entity, i) => addLink(entity, 'relatedEntities', i));
        } else if (typeof asset.relatedEntities === 'object') {
            // Object format with nested arrays
            for (const [type, entities] of Object.entries(asset.relatedEntities)) {
                if (Array.isArray(entities)) {
                    entities.forEach((entity, i) => addLink(entity, `relatedEntities.${type}`, i));
                }
            }
        }
    }

    // Check relatedArchetypes
    if (Array.isArray(asset.relatedArchetypes)) {
        asset.relatedArchetypes.forEach((archetype, i) => addLink(archetype, 'relatedArchetypes', i));
    }

    // Check relatedDeities
    if (Array.isArray(asset.relatedDeities)) {
        asset.relatedDeities.forEach((deity, i) => {
            if (typeof deity === 'string') {
                addLink({ id: deity, type: 'deity' }, 'relatedDeities', i);
            } else {
                addLink(deity, 'relatedDeities', i);
            }
        });
    }

    // Check relatedTexts
    if (Array.isArray(asset.relatedTexts)) {
        asset.relatedTexts.forEach((text, i) => addLink(text, 'relatedTexts', i));
    }

    // Check relationships
    if (asset.relationships && typeof asset.relationships === 'object') {
        for (const [rel, value] of Object.entries(asset.relationships)) {
            if (Array.isArray(value)) {
                value.forEach((v, i) => addLink(v, `relationships.${rel}`, i));
            } else if (typeof value === 'string') {
                // Check if it's a reference (contains ID-like format)
                if (value.match(/^[a-z0-9_-]+$/i) && value.length < 100) {
                    addLink({ id: value.split(' ')[0] }, `relationships.${rel}`);
                }
            }
        }
    }

    // Check sources with URLs
    if (Array.isArray(asset.sources)) {
        asset.sources.forEach((source, i) => {
            if (source.corpusUrl) {
                addLink({ url: source.corpusUrl }, 'sources', i);
            }
        });
    }

    // Check mythologyContexts
    if (Array.isArray(asset.mythologyContexts)) {
        asset.mythologyContexts.forEach((ctx, i) => {
            if (Array.isArray(ctx.associatedDeities)) {
                ctx.associatedDeities.forEach((deity, j) =>
                    addLink(deity, `mythologyContexts[${i}].associatedDeities`, j)
                );
            }
        });
    }

    return links;
}

/**
 * Validate all links in an asset
 */
function validateAssetLinks(asset) {
    const results = {
        id: asset.id || 'unknown',
        name: asset.name || asset.displayName || 'unknown',
        type: asset.type || 'unknown',
        totalLinks: 0,
        validLinks: 0,
        brokenLinks: 0,
        externalLinks: 0,
        links: []
    };

    const links = extractLinks(asset);
    results.totalLinks = links.length;

    for (const { value, field } of links) {
        const check = checkLinkExists(value, asset);

        const linkResult = {
            field,
            value: typeof value === 'object' ? (value.id || value.name || value.url) : value,
            valid: check.valid,
            external: check.external || false
        };

        if (!check.valid) {
            linkResult.reason = check.reason;
            linkResult.parsed = check.parsed;
            results.brokenLinks++;
        } else if (check.external) {
            results.externalLinks++;
        } else {
            results.validLinks++;
        }

        results.links.push(linkResult);
    }

    return results;
}

/**
 * Validate all links in a collection
 */
function validateCollection(collectionName, verbose = false) {
    const collectionDir = path.join(CONFIG.assetsDir, collectionName);
    const results = {
        collection: collectionName,
        totalAssets: 0,
        assetsWithLinks: 0,
        totalLinks: 0,
        validLinks: 0,
        brokenLinks: 0,
        externalLinks: 0,
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
    console.log(`[Validating Links] ${collectionName}: ${files.length} assets`);

    for (const file of files) {
        try {
            const filepath = path.join(collectionDir, file);
            const content = fs.readFileSync(filepath, 'utf8');
            const asset = JSON.parse(content);

            const validation = validateAssetLinks(asset);
            validation.file = file;

            if (validation.totalLinks > 0) {
                results.assetsWithLinks++;
            }

            results.totalLinks += validation.totalLinks;
            results.validLinks += validation.validLinks;
            results.brokenLinks += validation.brokenLinks;
            results.externalLinks += validation.externalLinks;

            // Only include assets with links in the output
            if (validation.totalLinks > 0) {
                results.assets.push(validation);
            }

            if (verbose && validation.brokenLinks > 0) {
                console.log(`  ${file}: ${validation.brokenLinks} broken links`);
                validation.links
                    .filter(l => !l.valid)
                    .forEach(l => console.log(`    [BROKEN] ${l.field}: ${l.value} - ${l.reason}`));
            }

        } catch (error) {
            if (verbose) {
                console.log(`  ${file}: [ERROR] ${error.message}`);
            }
        }
    }

    const brokenRate = results.totalLinks > 0
        ? Math.round((results.brokenLinks / results.totalLinks) * 100)
        : 0;

    console.log(`[Complete] ${collectionName}: ${results.totalLinks} links, ${results.brokenLinks} broken (${brokenRate}%)`);

    return results;
}

/**
 * Generate link validation report
 */
function generateReport(allResults, outputPath = null) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalCollections: Object.keys(allResults).length,
            totalAssets: 0,
            assetsWithLinks: 0,
            totalLinks: 0,
            validLinks: 0,
            brokenLinks: 0,
            externalLinks: 0,
            linkIntegrity: 0
        },
        collections: {},
        brokenLinksByAsset: [],
        brokenLinksByTarget: {}
    };

    // Aggregate results
    for (const [collection, results] of Object.entries(allResults)) {
        report.summary.totalAssets += results.totalAssets;
        report.summary.assetsWithLinks += results.assetsWithLinks;
        report.summary.totalLinks += results.totalLinks;
        report.summary.validLinks += results.validLinks;
        report.summary.brokenLinks += results.brokenLinks;
        report.summary.externalLinks += results.externalLinks;

        report.collections[collection] = {
            totalAssets: results.totalAssets,
            assetsWithLinks: results.assetsWithLinks,
            totalLinks: results.totalLinks,
            validLinks: results.validLinks,
            brokenLinks: results.brokenLinks,
            externalLinks: results.externalLinks,
            linkIntegrity: results.totalLinks > 0
                ? Math.round(((results.validLinks + results.externalLinks) / results.totalLinks) * 100)
                : 100
        };

        // Collect broken links
        for (const asset of results.assets) {
            const brokenLinks = asset.links.filter(l => !l.valid && !l.external);
            if (brokenLinks.length > 0) {
                report.brokenLinksByAsset.push({
                    collection,
                    asset: asset.id,
                    file: asset.file,
                    brokenLinks: brokenLinks.map(l => ({
                        field: l.field,
                        value: l.value,
                        reason: l.reason
                    }))
                });

                // Group by target
                for (const link of brokenLinks) {
                    const target = link.value || 'unknown';
                    if (!report.brokenLinksByTarget[target]) {
                        report.brokenLinksByTarget[target] = [];
                    }
                    report.brokenLinksByTarget[target].push({
                        collection,
                        asset: asset.id,
                        field: link.field
                    });
                }
            }
        }
    }

    // Calculate overall link integrity
    const internalLinks = report.summary.totalLinks - report.summary.externalLinks;
    report.summary.linkIntegrity = internalLinks > 0
        ? Math.round((report.summary.validLinks / internalLinks) * 100)
        : 100;

    // Sort broken links by frequency
    report.brokenLinksByTarget = Object.fromEntries(
        Object.entries(report.brokenLinksByTarget)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 100) // Top 100 most referenced broken targets
    );

    // Determine output path
    const finalOutputPath = outputPath || path.join(CONFIG.outputDir, 'links-validation.json');

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
    console.log('Validate Links - Eyes of Azrael');
    console.log('='.repeat(60));

    // Build asset index first
    buildAssetIndex();

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
    console.log(`Assets with links: ${report.summary.assetsWithLinks}`);
    console.log(`Total links: ${report.summary.totalLinks}`);
    console.log(`Valid internal links: ${report.summary.validLinks}`);
    console.log(`Broken links: ${report.summary.brokenLinks}`);
    console.log(`External links: ${report.summary.externalLinks}`);
    console.log(`Link integrity: ${report.summary.linkIntegrity}%`);

    // Exit with error code if there are broken links (but not for external)
    // We use a threshold to allow some broken links without failing
    const brokenRate = report.summary.totalLinks > 0
        ? (report.summary.brokenLinks / report.summary.totalLinks) * 100
        : 0;

    if (brokenRate > 20) {
        console.log('\n[Warning] More than 20% of links are broken');
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    CONFIG,
    buildAssetIndex,
    validateAssetLinks,
    validateCollection,
    generateReport,
    extractLinks,
    parseLink,
    checkLinkExists
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
