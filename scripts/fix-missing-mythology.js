#!/usr/bin/env node
/**
 * Fix Missing Mythology Script
 *
 * Infers and adds missing mythology values to entities based on:
 * 1. Entity ID prefix (e.g., greek_*, norse_*)
 * 2. Filename pattern
 * 3. Content analysis
 *
 * Usage: node scripts/fix-missing-mythology.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Mythology prefix mappings
const ID_PREFIX_MAP = {
    'greek': 'greek',
    'norse': 'norse',
    'egyptian': 'egyptian',
    'hindu': 'hindu',
    'buddhist': 'buddhist',
    'christian': 'christian',
    'islamic': 'islamic',
    'babylonian': 'babylonian',
    'sumerian': 'sumerian',
    'persian': 'persian',
    'roman': 'roman',
    'celtic': 'celtic',
    'chinese': 'chinese',
    'japanese': 'japanese',
    'aztec': 'aztec',
    'mayan': 'mayan',
    'yoruba': 'yoruba',
    'jewish': 'jewish',
    'tarot': 'tarot',
    'shinto': 'shinto',
    'finnish': 'finnish'
};

// Known items and their mythologies (for common items without clear prefix)
const KNOWN_ITEMS = {
    // Norse items
    'mjolnir': 'norse',
    'gungnir': 'norse',
    'draupnir': 'norse',
    'brisingamen': 'norse',
    'gleipnir': 'norse',
    'gjallarhorn': 'norse',
    'skidbladnir': 'norse',
    'gram': 'norse',
    'megingjord': 'norse',
    'hofud': 'norse',
    'laevateinn': 'norse',
    'mead-of-poetry': 'norse',
    'dainsleif': 'norse',
    'mistletoe': 'norse',
    'mead': 'norse',
    'ash': 'norse',
    'elder': 'norse',
    'mugwort': 'norse',

    // Greek items
    'aegis': 'greek',
    'ambrosia': 'greek',
    'caduceus': 'greek',
    'cornucopia': 'greek',
    'golden-fleece': 'greek',
    'harpe': 'greek',
    'nectar': 'greek',
    'necklace-of-harmonia': 'greek',
    'pandoras-box': 'greek',
    'ring-of-gyges': 'greek',
    'laurel': 'greek',
    'myrtle': 'greek',
    'oak': 'greek',
    'olive': 'greek',
    'pomegranate': 'greek',
    'apollo-bow': 'greek',
    'artemis-bow': 'greek',
    'athena-aegis': 'greek',
    'cronos-scythe': 'greek',
    'hades-helm': 'greek',
    'helm-of-darkness': 'greek',
    'hermes-caduceus': 'greek',
    'poseidon-trident': 'greek',

    // Egyptian items
    'ankh': 'egyptian',
    'book-of-thoth': 'egyptian',
    'crook-flail': 'egyptian',
    'djed-pillar': 'egyptian',
    'eye-of-horus': 'egyptian',
    'papyrus': 'egyptian',
    'sistrum': 'egyptian',
    'lotus': 'egyptian',

    // Hindu items
    'brahmastra': 'hindu',
    'gandiva': 'hindu',
    'pashupatastra': 'hindu',
    'shiva-lingam': 'hindu',
    'soma': 'hindu',
    'conch-shell': 'hindu',
    'bilva': 'hindu',

    // Buddhist items
    'bell-and-dorje': 'buddhist',
    'prayer-wheel': 'buddhist',
    'singing-bowl': 'buddhist',

    // Japanese items
    'kusanagi': 'japanese',
    'ame-no-murakumo': 'japanese',
    'amenonuhoko': 'japanese',
    'sakaki': 'japanese',
    'shimenawa': 'japanese',
    'sake': 'japanese',
    'rice': 'japanese',

    // Celtic items
    'cauldron-of-dagda': 'celtic',
    'cauldron-of-rebirth': 'celtic',
    'claiomh-solais': 'celtic',
    'claimoh-solais': 'celtic',
    'excalibur': 'celtic',
    'fragarach': 'celtic',
    'gae-bolg': 'celtic',
    'gae-bulg': 'celtic',
    'lia-fail': 'celtic',
    'caladbolg': 'celtic',
    'hazel': 'celtic',

    // Chinese items
    'dragon-pearl': 'chinese',
    'green-dragon-crescent-blade': 'chinese',
    'peach-immortality': 'chinese',
    'ruyi-jingu-bang': 'chinese',
    'cinnabar': 'chinese',
    'ginseng': 'chinese',
    'jade': 'chinese',
    'elixir-life': 'chinese',

    // Christian items
    'ark-of-covenant': 'jewish',
    'aarons-rod': 'jewish',
    'holy-grail': 'christian',
    'crown-of-thorns': 'christian',
    'shroud-of-turin': 'christian',
    'rosary': 'christian',
    'spear-of-longinus': 'christian',

    // Jewish items
    'menorah': 'jewish',
    'mezuzah': 'jewish',
    'shofar': 'jewish',
    'ketoret': 'jewish',
    'star-of-david': 'jewish',

    // Islamic items
    'black-stone': 'islamic',

    // Persian items
    'cup-of-jamshid': 'persian',
    'simurgh-feather': 'persian',

    // Universal/Hermetic items
    'philosophers-stone': 'alchemy',
    'emerald-tablet': 'hermetic',
    'athame': 'hermetic',
    'hand-of-glory': 'hermetic',
    'pentagram': 'hermetic',

    // Universal herbs
    'frankincense': 'universal',
    'myrrh': 'universal',

    // Germanic
    'durandal': 'celtic',
    'ascalon': 'christian',
    'hrunting': 'norse',

    // More Norse items
    'sampo': 'finnish',
    'tarnhelm': 'norse',

    // More Celtic items
    'cloak-of-invisibility': 'celtic',
    'spear-of-lugh': 'celtic',
    'stone-of-destiny': 'celtic',
    'sword-of-nuada': 'celtic',
    'tuatha-treasures': 'celtic',
    'undry': 'celtic',

    // More Hindu items
    'sudarshana-chakra': 'hindu',
    'trishula': 'hindu',
    'vajra': 'hindu',
    'vimana': 'hindu',
    'veena': 'hindu',
    'thunderbolt': 'hindu',

    // More Jewish items
    'seal-of-solomon': 'jewish',
    'staff-of-moses': 'jewish',
    'tablets-of-law': 'jewish',
    'tefillin': 'jewish',
    'urim-thummim': 'jewish',

    // More Christian items
    'true-cross': 'christian',
    'thurible': 'christian',

    // More Japanese items
    'torii': 'shinto',
    'totsuka-no-tsurugi': 'japanese',

    // More Buddhist items
    'tooth-relic': 'buddhist',
    'stupa': 'buddhist',

    // More Egyptian items
    'uraeus': 'egyptian',
    'was-scepter': 'egyptian',

    // Greek additions
    'trident': 'greek',

    // Mesopotamian
    'sharur': 'sumerian'
};

const CONFIG = {
    assetsDir: path.join(__dirname, '..', 'firebase-assets-downloaded'),
    collections: ['items', 'places', 'herbs', 'texts', 'symbols', 'magic']
};

const stats = {
    scanned: 0,
    fixed: 0,
    skipped: 0,
    cantFix: [],
    fixes: []
};

/**
 * Infer mythology from entity ID
 */
function inferMythologyFromId(entityId) {
    // Check for prefix pattern (e.g., greek_*, norse_*)
    for (const [prefix, mythology] of Object.entries(ID_PREFIX_MAP)) {
        if (entityId.startsWith(prefix + '_') || entityId.startsWith(prefix + '-')) {
            return mythology;
        }
    }

    // Check known items
    const normalizedId = entityId.toLowerCase().replace(/_/g, '-');
    if (KNOWN_ITEMS[normalizedId]) {
        return KNOWN_ITEMS[normalizedId];
    }

    // Check if id contains mythology name
    for (const [prefix, mythology] of Object.entries(ID_PREFIX_MAP)) {
        if (entityId.toLowerCase().includes(prefix)) {
            return mythology;
        }
    }

    return null;
}

/**
 * Process a collection
 */
function processCollection(collectionName) {
    const collectionPath = path.join(CONFIG.assetsDir, collectionName);

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
                let modified = false;
                for (const entity of data) {
                    if (entity && typeof entity === 'object' && entity.id) {
                        stats.scanned++;
                        if (fixEntity(entity, collectionName, file)) {
                            modified = true;
                        }
                    }
                }

                if (modified && !DRY_RUN) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                }
            } else if (data && typeof data === 'object' && data.id) {
                stats.scanned++;
                if (fixEntity(data, collectionName, file)) {
                    if (!DRY_RUN) {
                        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }
}

/**
 * Fix a single entity
 */
function fixEntity(entity, collection, filename) {
    if (entity.mythology) {
        stats.skipped++;
        return false;
    }

    const inferredMythology = inferMythologyFromId(entity.id);

    if (inferredMythology) {
        entity.mythology = inferredMythology;
        stats.fixed++;
        stats.fixes.push({
            id: entity.id,
            collection,
            mythology: inferredMythology,
            filename
        });
        return true;
    } else {
        stats.cantFix.push({
            id: entity.id,
            collection,
            filename
        });
        return false;
    }
}

/**
 * Print results
 */
function printResults() {
    console.log('\n========================================');
    console.log('  FIX MISSING MYTHOLOGY - RESULTS');
    console.log('========================================\n');

    console.log(`  Mode:      ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`  Scanned:   ${stats.scanned}`);
    console.log(`  Fixed:     ${stats.fixed}`);
    console.log(`  Skipped:   ${stats.skipped}`);
    console.log(`  Can't Fix: ${stats.cantFix.length}`);

    if (stats.fixes.length > 0) {
        console.log('\n  Fixes Applied:');
        console.log('  ---------------');

        const byMythology = {};
        for (const fix of stats.fixes) {
            if (!byMythology[fix.mythology]) {
                byMythology[fix.mythology] = [];
            }
            byMythology[fix.mythology].push(fix);
        }

        for (const [mythology, fixes] of Object.entries(byMythology)) {
            console.log(`\n  [${mythology}] - ${fixes.length} entities`);
            for (const fix of fixes.slice(0, 5)) {
                console.log(`    - ${fix.id}`);
            }
            if (fixes.length > 5) {
                console.log(`    ... and ${fixes.length - 5} more`);
            }
        }
    }

    if (stats.cantFix.length > 0) {
        console.log('\n  Could Not Infer Mythology For:');
        for (const item of stats.cantFix.slice(0, 20)) {
            console.log(`    - ${item.id} (${item.collection})`);
        }
        if (stats.cantFix.length > 20) {
            console.log(`    ... and ${stats.cantFix.length - 20} more`);
        }
    }

    console.log('\n========================================');
}

/**
 * Main
 */
function main() {
    console.log('Fix Missing Mythology Script');
    console.log('============================\n');

    if (DRY_RUN) {
        console.log('Running in DRY RUN mode.\n');
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
    const reportPath = path.join(CONFIG.assetsDir, '_mythology_fixes_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        dryRun: DRY_RUN,
        stats: {
            scanned: stats.scanned,
            fixed: stats.fixed,
            skipped: stats.skipped,
            cantFix: stats.cantFix.length
        },
        fixes: stats.fixes,
        cantFix: stats.cantFix
    }, null, 2));

    console.log(`\nReport written to: ${reportPath}`);
}

main();
