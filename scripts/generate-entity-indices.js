/**
 * Entity Index Generator
 *
 * Scans all entity JSON files and creates searchable indices organized by:
 * - Mythology
 * - Category
 * - Archetype
 * - Element
 * - Sefirot
 * - All entities
 *
 * Usage: node scripts/generate-entity-indices.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ENTITIES_DIR = path.join(__dirname, '..', 'data', 'entities');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'indices');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Initialize indices
const indices = {
    byMythology: {},
    byCategory: {},
    byArchetype: {},
    byElement: {},
    bySefirot: {},
    all: []
};

/**
 * Recursively scan directory for JSON files
 */
function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    const jsonFiles = [];

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            jsonFiles.push(...scanDirectory(fullPath));
        } else if (file.endsWith('.json') && file !== 'entity-schema.json') {
            jsonFiles.push(fullPath);
        }
    });

    return jsonFiles;
}

/**
 * Create entity summary for index
 */
function createEntitySummary(entity, filePath) {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);

    return {
        id: entity.id,
        type: entity.type,
        name: entity.name,
        icon: entity.icon || '',
        slug: entity.slug || entity.id,
        mythologies: entity.mythologies || [],
        primaryMythology: entity.primaryMythology || entity.mythologies?.[0] || 'universal',
        shortDescription: entity.shortDescription || '',
        category: entity.category || 'uncategorized',
        subCategory: entity.subCategory || null,
        tags: entity.tags || [],
        colors: entity.colors || null,

        // Metaphysical properties
        element: entity.metaphysicalProperties?.element || null,
        energyType: entity.metaphysicalProperties?.energyType || null,
        sefirot: entity.metaphysicalProperties?.sefirot || [],
        world: entity.metaphysicalProperties?.world || null,
        chakra: entity.metaphysicalProperties?.chakra || null,
        planet: entity.metaphysicalProperties?.planet || null,
        zodiac: entity.metaphysicalProperties?.zodiac || [],

        // Archetype information
        archetypes: extractArchetypes(entity),

        // Related counts
        relatedCount: {
            deities: entity.relatedEntities?.deities?.length || 0,
            items: entity.relatedEntities?.items?.length || 0,
            places: entity.relatedEntities?.places?.length || 0,
            concepts: entity.relatedEntities?.concepts?.length || 0,
            heroes: entity.relatedEntities?.heroes?.length || 0,
            creatures: entity.relatedEntities?.creatures?.length || 0
        },

        // File information
        filePath: relativePath.replace(/\\/g, '/'),
        jsonPath: `/data/entities/${entity.type}/${entity.id}.json`
    };
}

/**
 * Extract archetype information from entity
 */
function extractArchetypes(entity) {
    const archetypes = [];

    // Check if entity has explicit archetype type
    if (entity.type === 'archetype') {
        archetypes.push({
            category: entity.category || 'unknown',
            score: 100,
            description: entity.shortDescription
        });
    }

    // Check related archetypes
    if (entity.relatedEntities?.archetypes) {
        entity.relatedEntities.archetypes.forEach(arch => {
            archetypes.push({
                category: arch.id || 'unknown',
                score: 80,
                name: arch.name
            });
        });
    }

    // Infer archetypes from tags
    const archetypeKeywords = {
        'hero-journey': ['hero', 'quest', 'journey', 'transformation'],
        'trickster': ['trickster', 'deception', 'cunning'],
        'magical-weapon': ['weapon', 'sword', 'staff', 'divine-weapon'],
        'sacred-mountain': ['mountain', 'sacred-mountain', 'holy-mountain'],
        'underworld-journey': ['underworld', 'death', 'descent'],
        'great-mother': ['mother', 'fertility', 'creation'],
        'dragon-slayer': ['dragon', 'monster', 'slayer'],
        'divine-child': ['child', 'birth', 'divine-birth'],
        'world-tree': ['tree', 'axis-mundi', 'cosmic-tree']
    };

    if (entity.tags) {
        Object.entries(archetypeKeywords).forEach(([archetype, keywords]) => {
            const matches = keywords.filter(kw =>
                entity.tags.some(tag => tag.includes(kw))
            );

            if (matches.length > 0) {
                archetypes.push({
                    category: archetype,
                    score: Math.min(matches.length * 20, 70),
                    inferred: true
                });
            }
        });
    }

    return archetypes;
}

/**
 * Add entity to indices
 */
function indexEntity(summary) {
    // Add to all entities
    indices.all.push(summary);

    // Index by mythology
    summary.mythologies.forEach(myth => {
        if (!indices.byMythology[myth]) {
            indices.byMythology[myth] = {
                items: [],
                places: [],
                deities: [],
                concepts: [],
                archetypes: [],
                creatures: [],
                heroes: [],
                magic: []
            };
        }

        const typeKey = summary.type + 's';
        if (!indices.byMythology[myth][typeKey]) {
            indices.byMythology[myth][typeKey] = [];
        }
        indices.byMythology[myth][typeKey].push(summary);
    });

    // Index by category
    if (summary.category) {
        if (!indices.byCategory[summary.category]) {
            indices.byCategory[summary.category] = [];
        }
        indices.byCategory[summary.category].push(summary);
    }

    // Index by archetype
    summary.archetypes.forEach(arch => {
        if (!indices.byArchetype[arch.category]) {
            indices.byArchetype[arch.category] = [];
        }

        indices.byArchetype[arch.category].push({
            ...summary,
            archetypeScore: arch.score,
            archetypeInferred: arch.inferred || false
        });
    });

    // Index by element
    if (summary.element) {
        if (!indices.byElement[summary.element]) {
            indices.byElement[summary.element] = [];
        }
        indices.byElement[summary.element].push(summary);
    }

    // Index by sefirot
    summary.sefirot.forEach(sefirah => {
        if (!indices.bySefirot[sefirah]) {
            indices.bySefirot[sefirah] = [];
        }
        indices.bySefirot[sefirah].push(summary);
    });
}

/**
 * Save index to file
 */
function saveIndex(filename, data) {
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Generated: ${filename} (${getDataSize(data)})`);
}

/**
 * Get human-readable data size
 */
function getDataSize(data) {
    if (Array.isArray(data)) {
        return `${data.length} entities`;
    } else if (typeof data === 'object') {
        const keys = Object.keys(data);
        const totalEntities = keys.reduce((sum, key) => {
            const value = data[key];
            if (Array.isArray(value)) {
                return sum + value.length;
            } else if (typeof value === 'object') {
                return sum + Object.values(value).flat().length;
            }
            return sum;
        }, 0);
        return `${keys.length} categories, ${totalEntities} entities`;
    }
    return 'unknown';
}

/**
 * Generate metadata file
 */
function generateMetadata() {
    const metadata = {
        generated: new Date().toISOString(),
        version: '1.0.0',
        totalEntities: indices.all.length,
        breakdown: {
            byType: {},
            byMythology: {},
            byCategory: Object.keys(indices.byCategory).length,
            byArchetype: Object.keys(indices.byArchetype).length,
            byElement: Object.keys(indices.byElement).length,
            bySefirot: Object.keys(indices.bySefirot).length
        }
    };

    // Count by type
    indices.all.forEach(entity => {
        const type = entity.type;
        metadata.breakdown.byType[type] = (metadata.breakdown.byType[type] || 0) + 1;
    });

    // Count by mythology
    Object.entries(indices.byMythology).forEach(([myth, data]) => {
        const total = Object.values(data).flat().length;
        metadata.breakdown.byMythology[myth] = total;
    });

    return metadata;
}

/**
 * Sort indices for better usability
 */
function sortIndices() {
    // Sort all entities by name
    indices.all.sort((a, b) => a.name.localeCompare(b.name));

    // Sort mythology indices
    Object.keys(indices.byMythology).forEach(myth => {
        Object.keys(indices.byMythology[myth]).forEach(type => {
            indices.byMythology[myth][type].sort((a, b) => a.name.localeCompare(b.name));
        });
    });

    // Sort category indices
    Object.keys(indices.byCategory).forEach(cat => {
        indices.byCategory[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Sort archetype indices by score (descending) then name
    Object.keys(indices.byArchetype).forEach(arch => {
        indices.byArchetype[arch].sort((a, b) => {
            const scoreDiff = (b.archetypeScore || 0) - (a.archetypeScore || 0);
            if (scoreDiff !== 0) return scoreDiff;
            return a.name.localeCompare(b.name);
        });
    });

    // Sort element indices
    Object.keys(indices.byElement).forEach(elem => {
        indices.byElement[elem].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Sort sefirot indices
    Object.keys(indices.bySefirot).forEach(sef => {
        indices.bySefirot[sef].sort((a, b) => a.name.localeCompare(b.name));
    });
}

/**
 * Main execution
 */
function main() {
    console.log('====================================');
    console.log('Entity Index Generator');
    console.log('====================================\n');

    // Scan for all entity files
    console.log('Scanning entity files...');
    const entityFiles = scanDirectory(ENTITIES_DIR);
    console.log(`Found ${entityFiles.length} entity files\n`);

    // Process each entity
    console.log('Processing entities...');
    let processedCount = 0;
    let errorCount = 0;

    entityFiles.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const entity = JSON.parse(content);

            const summary = createEntitySummary(entity, filePath);
            indexEntity(summary);

            processedCount++;
        } catch (error) {
            console.error(`✗ Error processing ${filePath}:`, error.message);
            errorCount++;
        }
    });

    console.log(`Processed: ${processedCount} entities`);
    if (errorCount > 0) {
        console.log(`Errors: ${errorCount} entities\n`);
    } else {
        console.log('');
    }

    // Sort all indices
    console.log('Sorting indices...');
    sortIndices();
    console.log('');

    // Generate metadata
    console.log('Generating metadata...');
    const metadata = generateMetadata();
    console.log('');

    // Save all indices
    console.log('Saving indices...');
    saveIndex('all-entities.json', indices.all);
    saveIndex('by-mythology.json', indices.byMythology);
    saveIndex('by-category.json', indices.byCategory);
    saveIndex('by-archetype.json', indices.byArchetype);
    saveIndex('by-element.json', indices.byElement);
    saveIndex('by-sefirot.json', indices.bySefirot);
    saveIndex('metadata.json', metadata);
    console.log('');

    // Display summary
    console.log('====================================');
    console.log('Summary');
    console.log('====================================');
    console.log(`Total entities: ${metadata.totalEntities}`);
    console.log('\nBy Type:');
    Object.entries(metadata.breakdown.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log('\nBy Mythology:');
    Object.entries(metadata.breakdown.byMythology)
        .sort((a, b) => b[1] - a[1])
        .forEach(([myth, count]) => {
            console.log(`  ${myth}: ${count}`);
        });
    console.log(`\nCategories: ${metadata.breakdown.byCategory}`);
    console.log(`Archetypes: ${metadata.breakdown.byArchetype}`);
    console.log(`Elements: ${metadata.breakdown.byElement}`);
    console.log(`Sefirot: ${metadata.breakdown.bySefirot}`);
    console.log('\n✓ Index generation complete!');
    console.log(`Output directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, createEntitySummary, indexEntity };
