/**
 * Add Corpus Queries to Entities Migration Script
 *
 * This script reads entity JSON files and adds appropriate corpusQueries arrays
 * based on the entity type and mythology. It uses the standard queries from
 * data/corpus-queries/standard-deity-queries.json as templates.
 *
 * Usage:
 *   node scripts/add-corpus-queries-to-entities.js [options]
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --type       Only process entities of this type (e.g., deity, hero)
 *   --mythology  Only process entities of this mythology (e.g., greek, norse)
 *   --force      Overwrite existing corpusQueries arrays
 *   --verbose    Show detailed output
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    entitiesDir: path.join(__dirname, '..', 'data', 'entities'),
    queriesDir: path.join(__dirname, '..', 'data', 'corpus-queries'),
    schemaPath: path.join(__dirname, '..', 'data', 'schemas', 'corpus-query.schema.json'),
    standardQueriesPath: path.join(__dirname, '..', 'data', 'corpus-queries', 'standard-deity-queries.json')
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        verbose: args.includes('--verbose'),
        type: null,
        mythology: null
    };

    const typeIndex = args.indexOf('--type');
    if (typeIndex !== -1 && args[typeIndex + 1]) {
        options.type = args[typeIndex + 1];
    }

    const mythologyIndex = args.indexOf('--mythology');
    if (mythologyIndex !== -1 && args[mythologyIndex + 1]) {
        options.mythology = args[mythologyIndex + 1];
    }

    return options;
}

// Mythology to primary text source mappings
const MYTHOLOGY_TEXT_MAPPINGS = {
    greek: {
        primaryTexts: ['iliad', 'odyssey', 'theogony', 'works-and-days', 'homeric-hymns'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    norse: {
        primaryTexts: ['poetic-edda', 'prose-edda', 'voluspa', 'havamal'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    egyptian: {
        primaryTexts: ['pyramid-texts', 'coffin-texts', 'book-of-the-dead'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    hindu: {
        primaryTexts: ['rigveda', 'upanishads', 'mahabharata', 'ramayana', 'puranas'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    buddhist: {
        primaryTexts: ['tripitaka', 'sutras', 'jataka-tales'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    celtic: {
        primaryTexts: ['mabinogion', 'book-of-invasions', 'tain-bo-cuailnge'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    japanese: {
        primaryTexts: ['kojiki', 'nihon-shoki', 'fudoki'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    chinese: {
        primaryTexts: ['shan-hai-jing', 'fengshen-yanyi', 'journey-to-the-west'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    roman: {
        primaryTexts: ['aeneid', 'metamorphoses', 'fasti'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    mesopotamian: {
        primaryTexts: ['epic-of-gilgamesh', 'enuma-elish', 'descent-of-inanna'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    babylonian: {
        primaryTexts: ['epic-of-gilgamesh', 'enuma-elish'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    sumerian: {
        primaryTexts: ['epic-of-gilgamesh', 'descent-of-inanna'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    aztec: {
        primaryTexts: ['popol-vuh', 'florentine-codex'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    mayan: {
        primaryTexts: ['popol-vuh', 'chilam-balam'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    },
    persian: {
        primaryTexts: ['avesta', 'shahnameh', 'bundahishn'],
        collections: ['texts', 'myths'],
        searchTermSuffixes: []
    }
};

/**
 * Generate corpus queries for a deity entity
 */
function generateDeityQueries(entity) {
    const queries = [];
    const mythology = entity.primaryMythology || (entity.mythologies && entity.mythologies[0]);

    if (!mythology) {
        return queries;
    }

    const textMapping = MYTHOLOGY_TEXT_MAPPINGS[mythology];
    if (!textMapping) {
        return queries;
    }

    const name = entity.name;
    const id = entity.id;

    // Get alternate terms from linguistic data
    const alternateTerms = [];
    if (entity.linguistic) {
        if (entity.linguistic.originalName) {
            alternateTerms.push(entity.linguistic.originalName);
        }
        if (entity.linguistic.alternativeNames) {
            entity.linguistic.alternativeNames.forEach(alt => {
                if (alt.name) alternateTerms.push(alt.name);
            });
        }
    }

    // Primary sources query
    queries.push({
        id: `${id}-primary-sources`,
        label: `${name} in Primary Sources`,
        queryType: 'firebase',
        query: {
            term: name,
            alternateTerms: alternateTerms.length > 0 ? alternateTerms : undefined,
            collections: textMapping.collections,
            textFilters: textMapping.primaryTexts,
            mythologyFilter: mythology,
            options: {
                includeContext: true,
                contextLines: 5,
                maxResults: 100
            }
        },
        renderMode: 'panel',
        entityRef: {
            type: 'deity',
            id: id,
            name: name
        },
        autoLoad: false,
        isStandard: true,
        category: 'primary-sources',
        description: `References to ${name} in ${mythology} primary source texts`,
        icon: '\uD83D\uDCDC',
        priority: 1,
        tags: [mythology, 'primary-source', entity.type]
    });

    // Comprehensive search query
    queries.push({
        id: `${id}-all-sources`,
        label: `${name} in All ${capitalize(mythology)} Sources`,
        queryType: 'firebase',
        query: {
            term: name,
            alternateTerms: alternateTerms.length > 0 ? alternateTerms : undefined,
            collections: ['texts', 'myths', 'concepts'],
            mythologyFilter: mythology,
            options: {
                includeContext: true,
                maxResults: 200
            }
        },
        renderMode: 'full-page',
        entityRef: {
            type: 'deity',
            id: id,
            name: name
        },
        autoLoad: false,
        isStandard: true,
        category: 'primary-sources',
        description: `Comprehensive search for ${name} across all ${mythology} sources`,
        icon: '\uD83D\uDD0D',
        priority: 10,
        tags: ['comprehensive', 'all-sources', mythology]
    });

    return queries;
}

/**
 * Generate corpus queries for a hero entity
 */
function generateHeroQueries(entity) {
    const queries = [];
    const mythology = entity.primaryMythology || (entity.mythologies && entity.mythologies[0]);

    if (!mythology) {
        return queries;
    }

    const textMapping = MYTHOLOGY_TEXT_MAPPINGS[mythology];
    if (!textMapping) {
        return queries;
    }

    const name = entity.name;
    const id = entity.id;

    // Get alternate terms
    const alternateTerms = [];
    if (entity.linguistic && entity.linguistic.alternativeNames) {
        entity.linguistic.alternativeNames.forEach(alt => {
            if (alt.name) alternateTerms.push(alt.name);
        });
    }

    // Hero saga/epic query
    queries.push({
        id: `${id}-sagas`,
        label: `${name} in Heroic Literature`,
        queryType: 'firebase',
        query: {
            term: name,
            alternateTerms: alternateTerms.length > 0 ? alternateTerms : undefined,
            collections: ['texts', 'myths', 'heroes'],
            mythologyFilter: mythology,
            options: {
                includeContext: true,
                contextLines: 5,
                maxResults: 100
            }
        },
        renderMode: 'panel',
        entityRef: {
            type: 'hero',
            id: id,
            name: name
        },
        autoLoad: false,
        isStandard: true,
        category: 'primary-sources',
        description: `References to ${name} in ${mythology} heroic literature`,
        icon: '\u2694\uFE0F',
        priority: 1,
        tags: [mythology, 'hero', 'saga', 'primary-source']
    });

    return queries;
}

/**
 * Generate corpus queries for a creature entity
 */
function generateCreatureQueries(entity) {
    const queries = [];
    const mythology = entity.primaryMythology || (entity.mythologies && entity.mythologies[0]);

    if (!mythology) {
        return queries;
    }

    const name = entity.name;
    const id = entity.id;

    queries.push({
        id: `${id}-references`,
        label: `${name} in Mythological Texts`,
        queryType: 'firebase',
        query: {
            term: name,
            collections: ['texts', 'myths', 'creatures'],
            mythologyFilter: mythology,
            options: {
                includeContext: true,
                contextLines: 5,
                maxResults: 50
            }
        },
        renderMode: 'panel',
        entityRef: {
            type: 'creature',
            id: id,
            name: name
        },
        autoLoad: false,
        isStandard: true,
        category: 'primary-sources',
        description: `References to ${name} in ${mythology} texts`,
        icon: '\uD83D\uDC09',
        priority: 1,
        tags: [mythology, 'creature', 'primary-source']
    });

    return queries;
}

/**
 * Generate corpus queries for a place entity
 */
function generatePlaceQueries(entity) {
    const queries = [];
    const mythology = entity.primaryMythology || (entity.mythologies && entity.mythologies[0]);

    if (!mythology) {
        return queries;
    }

    const name = entity.name;
    const id = entity.id;

    queries.push({
        id: `${id}-references`,
        label: `${name} in Mythological Texts`,
        queryType: 'firebase',
        query: {
            term: name,
            collections: ['texts', 'myths', 'places'],
            mythologyFilter: mythology,
            options: {
                includeContext: true,
                contextLines: 5,
                maxResults: 50
            }
        },
        renderMode: 'panel',
        entityRef: {
            type: 'place',
            id: id,
            name: name
        },
        autoLoad: false,
        isStandard: true,
        category: 'primary-sources',
        description: `References to ${name} in ${mythology} texts`,
        icon: '\uD83C\uDFDB\uFE0F',
        priority: 1,
        tags: [mythology, 'place', 'primary-source']
    });

    return queries;
}

/**
 * Generate corpus queries for an item entity
 */
function generateItemQueries(entity) {
    const queries = [];
    const mythology = entity.primaryMythology || (entity.mythologies && entity.mythologies[0]);

    if (!mythology) {
        return queries;
    }

    const name = entity.name;
    const id = entity.id;

    queries.push({
        id: `${id}-references`,
        label: `${name} in Mythological Texts`,
        queryType: 'firebase',
        query: {
            term: name,
            collections: ['texts', 'myths', 'items'],
            mythologyFilter: mythology,
            options: {
                includeContext: true,
                contextLines: 5,
                maxResults: 50
            }
        },
        renderMode: 'panel',
        entityRef: {
            type: 'item',
            id: id,
            name: name
        },
        autoLoad: false,
        isStandard: true,
        category: 'primary-sources',
        description: `References to ${name} in ${mythology} texts`,
        icon: '\uD83D\uDDE1\uFE0F',
        priority: 1,
        tags: [mythology, 'item', 'artifact', 'primary-source']
    });

    return queries;
}

/**
 * Generate queries based on entity type
 */
function generateQueriesForEntity(entity) {
    switch (entity.type) {
        case 'deity':
            return generateDeityQueries(entity);
        case 'hero':
            return generateHeroQueries(entity);
        case 'creature':
            return generateCreatureQueries(entity);
        case 'place':
            return generatePlaceQueries(entity);
        case 'item':
            return generateItemQueries(entity);
        default:
            return [];
    }
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get all entity files
 */
async function getEntityFiles(entitiesDir, typeFilter = null) {
    const entityFiles = [];

    try {
        const types = await fs.readdir(entitiesDir);

        for (const type of types) {
            if (typeFilter && type !== typeFilter) {
                continue;
            }

            const typePath = path.join(entitiesDir, type);
            const stat = await fs.stat(typePath);

            if (stat.isDirectory()) {
                const files = await fs.readdir(typePath);

                for (const file of files) {
                    if (file.endsWith('.json') && !file.startsWith('_') && file !== 'migration-report.json') {
                        entityFiles.push({
                            type,
                            file,
                            path: path.join(typePath, file)
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error reading entity files:', error);
    }

    return entityFiles;
}

/**
 * Process a single entity file
 */
async function processEntityFile(fileInfo, options) {
    try {
        const content = await fs.readFile(fileInfo.path, 'utf-8');
        const entity = JSON.parse(content);

        // Filter by mythology if specified
        if (options.mythology) {
            const entityMythology = entity.primaryMythology || (entity.mythologies && entity.mythologies[0]);
            if (entityMythology !== options.mythology) {
                return { skipped: true, reason: 'mythology filter' };
            }
        }

        // Check if entity already has corpusQueries
        if (entity.corpusQueries && entity.corpusQueries.length > 0 && !options.force) {
            return { skipped: true, reason: 'already has queries' };
        }

        // Generate queries for this entity
        const queries = generateQueriesForEntity(entity);

        if (queries.length === 0) {
            return { skipped: true, reason: 'no queries generated' };
        }

        // Add queries to entity
        entity.corpusQueries = queries;

        // Update metadata
        if (!entity.metadata) {
            entity.metadata = {};
        }
        entity.metadata.lastModified = new Date().toISOString();
        entity.metadata.corpusQueriesAdded = true;

        if (!options.dryRun) {
            await fs.writeFile(fileInfo.path, JSON.stringify(entity, null, 2), 'utf-8');
        }

        return {
            updated: true,
            entityId: entity.id,
            entityName: entity.name,
            queriesAdded: queries.length
        };

    } catch (error) {
        return {
            error: true,
            message: error.message,
            file: fileInfo.file
        };
    }
}

/**
 * Main migration function
 */
async function migrate() {
    const options = parseArgs();

    console.log('='.repeat(60));
    console.log('Corpus Queries Migration Script');
    console.log('='.repeat(60));
    console.log('');
    console.log('Options:');
    console.log(`  Dry Run: ${options.dryRun}`);
    console.log(`  Force: ${options.force}`);
    console.log(`  Type Filter: ${options.type || 'all'}`);
    console.log(`  Mythology Filter: ${options.mythology || 'all'}`);
    console.log('');

    // Get all entity files
    const entityFiles = await getEntityFiles(CONFIG.entitiesDir, options.type);
    console.log(`Found ${entityFiles.length} entity files to process`);
    console.log('');

    // Process each file
    const results = {
        updated: 0,
        skipped: 0,
        errors: 0,
        details: []
    };

    for (const fileInfo of entityFiles) {
        const result = await processEntityFile(fileInfo, options);

        if (result.updated) {
            results.updated++;
            if (options.verbose) {
                console.log(`  [UPDATED] ${result.entityName} (${result.entityId}) - ${result.queriesAdded} queries added`);
            }
        } else if (result.skipped) {
            results.skipped++;
            if (options.verbose) {
                console.log(`  [SKIPPED] ${fileInfo.file} - ${result.reason}`);
            }
        } else if (result.error) {
            results.errors++;
            console.log(`  [ERROR] ${fileInfo.file} - ${result.message}`);
        }

        results.details.push({
            file: fileInfo.file,
            ...result
        });
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`  Updated: ${results.updated}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors}`);
    console.log('');

    if (options.dryRun) {
        console.log('NOTE: This was a dry run. No files were modified.');
        console.log('Run without --dry-run to apply changes.');
    }

    return results;
}

// Run migration
migrate().then(results => {
    process.exit(results.errors > 0 ? 1 : 0);
}).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
