#!/usr/bin/env node
/**
 * Fix Entity Types Script
 *
 * Fixes entities where the `type` field doesn't match the collection they belong to.
 * For example, creatures should have type: "creature", not type: "dragon".
 *
 * The more specific type (dragon, beast, spirit, etc.) is preserved as `subType`.
 *
 * Usage: node scripts/fix-entity-types.js [--dry-run] [--upload]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOAD = process.argv.includes('--upload');

// Collection to correct type mapping
const COLLECTION_TYPE_MAP = {
    'deities': 'deity',
    'heroes': 'hero',
    'creatures': 'creature',
    'items': 'item',
    'places': 'place',
    'cosmology': 'cosmology',
    'texts': 'text',
    'rituals': 'ritual',
    'herbs': 'herb',
    'concepts': 'concept',
    'beings': 'being',
    'symbols': 'symbol',
    'events': 'event',
    'archetypes': 'archetype',
    'magic': 'magic'
};

// Types that should be moved to subType
const SUBTYPES = [
    'dragon', 'beast', 'monster', 'spirit', 'serpent', 'giant',
    'guardian', 'weapon', 'armor', 'vessel', 'jewel', 'book',
    'mountain', 'river', 'temple', 'city', 'realm', 'underworld',
    'plant', 'tree', 'flower', 'root'
];

const CONFIG = {
    assetsDir: path.join(__dirname, '..', 'firebase-assets-downloaded'),
    collections: Object.keys(COLLECTION_TYPE_MAP)
};

const stats = {
    scanned: 0,
    fixed: 0,
    skipped: 0,
    errors: [],
    fixes: []
};

/**
 * Process a collection
 */
function processCollection(collectionName) {
    const collectionPath = path.join(CONFIG.assetsDir, collectionName);
    const correctType = COLLECTION_TYPE_MAP[collectionName];

    if (!fs.existsSync(collectionPath)) {
        return;
    }

    const files = fs.readdirSync(collectionPath)
        .filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of files) {
        const filePath = path.join(collectionPath, file);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);

            if (Array.isArray(data)) {
                // Array file (like greek.json with multiple entities)
                let modified = false;
                for (const entity of data) {
                    if (entity && typeof entity === 'object' && entity.id) {
                        stats.scanned++;
                        if (fixEntity(entity, collectionName, correctType, file)) {
                            modified = true;
                        }
                    }
                }

                if (modified && !DRY_RUN) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                }
            } else if (data && typeof data === 'object' && data.id) {
                // Single entity file
                stats.scanned++;
                if (fixEntity(data, collectionName, correctType, file)) {
                    if (!DRY_RUN) {
                        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    }
                }
            }
        } catch (error) {
            stats.errors.push({ file, error: error.message });
        }
    }
}

/**
 * Fix a single entity
 */
function fixEntity(entity, collection, correctType, filename) {
    let modified = false;

    // Check if type needs fixing
    const currentType = entity.type;

    if (!currentType) {
        // Missing type - add correct one
        entity.type = correctType;
        stats.fixed++;
        stats.fixes.push({
            id: entity.id,
            collection,
            change: `Added type: "${correctType}"`,
            filename
        });
        modified = true;
    } else if (currentType !== correctType) {
        // Type doesn't match collection
        if (SUBTYPES.includes(currentType.toLowerCase())) {
            // Current type is a subtype - preserve it
            if (!entity.subType) {
                entity.subType = currentType;
            }
            entity.type = correctType;
            stats.fixed++;
            stats.fixes.push({
                id: entity.id,
                collection,
                change: `type: "${currentType}" → "${correctType}", added subType: "${currentType}"`,
                filename
            });
            modified = true;
        } else if (currentType !== correctType && !COLLECTION_TYPE_MAP[currentType + 's']) {
            // Unknown type value - just set correct type
            if (!entity.subType && currentType !== correctType) {
                entity.subType = currentType;
            }
            entity.type = correctType;
            stats.fixed++;
            stats.fixes.push({
                id: entity.id,
                collection,
                change: `type: "${currentType}" → "${correctType}"`,
                filename
            });
            modified = true;
        }
    } else {
        stats.skipped++;
    }

    return modified;
}

/**
 * Print results
 */
function printResults() {
    console.log('\n========================================');
    console.log('  FIX ENTITY TYPES - RESULTS');
    console.log('========================================\n');

    console.log(`  Mode:      ${DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE'}`);
    console.log(`  Scanned:   ${stats.scanned}`);
    console.log(`  Fixed:     ${stats.fixed}`);
    console.log(`  Skipped:   ${stats.skipped}`);
    console.log(`  Errors:    ${stats.errors.length}`);

    if (stats.fixes.length > 0) {
        console.log('\n  Fixes Applied:');
        console.log('  ---------------');

        // Group by collection
        const byCollection = {};
        for (const fix of stats.fixes) {
            if (!byCollection[fix.collection]) {
                byCollection[fix.collection] = [];
            }
            byCollection[fix.collection].push(fix);
        }

        for (const [collection, fixes] of Object.entries(byCollection)) {
            console.log(`\n  [${collection}] - ${fixes.length} fixes`);
            for (const fix of fixes.slice(0, 10)) {
                console.log(`    - ${fix.id}: ${fix.change}`);
            }
            if (fixes.length > 10) {
                console.log(`    ... and ${fixes.length - 10} more`);
            }
        }
    }

    if (stats.errors.length > 0) {
        console.log('\n  Errors:');
        for (const err of stats.errors.slice(0, 5)) {
            console.log(`    - ${err.file}: ${err.error}`);
        }
    }

    console.log('\n========================================');

    if (DRY_RUN && stats.fixed > 0) {
        console.log('\n  Run without --dry-run to apply fixes.');
    }

    if (!DRY_RUN && stats.fixed > 0 && UPLOAD) {
        console.log('\n  Uploading fixed entities to Firebase...');
        // TODO: Add Firebase upload logic
    }
}

/**
 * Main
 */
function main() {
    console.log('Fix Entity Types Script');
    console.log('=======================\n');

    if (DRY_RUN) {
        console.log('Running in DRY RUN mode - no changes will be made.\n');
    }

    if (!fs.existsSync(CONFIG.assetsDir)) {
        console.error(`ERROR: Assets directory not found: ${CONFIG.assetsDir}`);
        process.exit(1);
    }

    console.log('Processing collections...\n');

    for (const collection of CONFIG.collections) {
        process.stdout.write(`  ${collection}... `);
        const beforeFixed = stats.fixed;
        processCollection(collection);
        const fixedInCollection = stats.fixed - beforeFixed;
        console.log(fixedInCollection > 0 ? `${fixedInCollection} fixes` : 'OK');
    }

    printResults();

    // Write report
    const reportPath = path.join(CONFIG.assetsDir, '_type_fixes_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        dryRun: DRY_RUN,
        stats: {
            scanned: stats.scanned,
            fixed: stats.fixed,
            skipped: stats.skipped,
            errors: stats.errors.length
        },
        fixes: stats.fixes,
        errors: stats.errors
    }, null, 2));

    console.log(`\nReport written to: ${reportPath}`);
}

main();
