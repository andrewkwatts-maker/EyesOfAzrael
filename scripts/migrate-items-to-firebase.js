/**
 * Item Migration Script - Entity Schema v2.0
 * Migrates all items from old repository to Firebase-ready format
 *
 * Source: H:\Github\EyesOfAzrael2\EyesOfAzrael\data\entities\item\*.json (140 files)
 * HTML Content: H:\Github\EyesOfAzrael2\EyesOfAzrael\spiritual-items\*\*.html (102 files)
 * Target: Firebase Firestore collection "items"
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const OLD_REPO_BASE = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael';
const NEW_REPO_BASE = 'H:\\Github\\EyesOfAzrael';
const JSON_SOURCE = path.join(OLD_REPO_BASE, 'data', 'entities', 'item');
const HTML_SOURCES = [
    path.join(OLD_REPO_BASE, 'spiritual-items', 'weapons'),
    path.join(OLD_REPO_BASE, 'spiritual-items', 'relics'),
    path.join(OLD_REPO_BASE, 'spiritual-items', 'ritual')
];
const OUTPUT_FILE = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'items-import.json');

// Utility: Extract text content from HTML
function extractHTMLContent(htmlPath) {
    if (!fs.existsSync(htmlPath)) return null;

    try {
        const html = fs.readFileSync(htmlPath, 'utf-8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Extract full narrative content
        const contentSections = [];
        const glassCards = document.querySelectorAll('.glass-card');

        glassCards.forEach(card => {
            const title = card.querySelector('.section-title, .subsection-title');
            const content = card.querySelector('.content-text, .highlight-box');

            if (title && content) {
                contentSections.push({
                    title: title.textContent.trim(),
                    content: content.textContent.trim()
                });
            }
        });

        // Extract metadata from hero section
        const heroSection = document.querySelector('.hero-section');
        const heroData = {};
        if (heroSection) {
            heroData.subtitle = heroSection.querySelector('.hero-subtitle')?.textContent.trim();
            heroData.traditions = Array.from(heroSection.querySelectorAll('.tradition-tag'))
                .map(tag => tag.textContent.trim().toLowerCase());
        }

        // Extract quick info
        const infoItems = {};
        document.querySelectorAll('.info-item').forEach(item => {
            const label = item.querySelector('.info-label')?.textContent.trim();
            const value = item.querySelector('.info-value')?.textContent.trim();
            if (label && value) {
                infoItems[label.toLowerCase()] = value;
            }
        });

        return {
            contentSections,
            heroData,
            infoItems
        };
    } catch (error) {
        console.warn(`Failed to parse HTML ${htmlPath}:`, error.message);
        return null;
    }
}

// Utility: Find HTML file for an item
function findHTMLFile(itemId) {
    for (const sourceDir of HTML_SOURCES) {
        const htmlPath = path.join(sourceDir, `${itemId}.html`);
        if (fs.existsSync(htmlPath)) {
            return htmlPath;
        }
    }
    return null;
}

// Utility: Map old category/subCategory to new itemType/subtype
function mapItemType(category, subCategory) {
    const categoryMap = {
        'weapon': 'weapon',
        'relic': 'artifact',
        'artifact': 'artifact',
        'ritual': 'ritual_object',
        'herb': 'plant',
        'plant': 'plant',
        'substance': 'substance'
    };

    return {
        itemType: categoryMap[category?.toLowerCase()] || 'artifact',
        subtype: subCategory || 'unknown'
    };
}

// Utility: Extract powers from properties
function extractPowers(properties, tags) {
    const powers = [];

    // Look for power-related properties
    if (properties) {
        properties.forEach(prop => {
            if (prop.name.toLowerCase().includes('power') ||
                prop.name.toLowerCase().includes('ability') ||
                prop.name.toLowerCase().includes('special')) {
                powers.push(prop.value);
            }
        });
    }

    // Look for power-related tags
    if (tags) {
        const powerTags = tags.filter(tag =>
            tag.includes('power') ||
            tag.includes('lightning') ||
            tag.includes('thunder') ||
            tag.includes('healing') ||
            tag.includes('protection')
        );
        powers.push(...powerTags);
    }

    return [...new Set(powers)]; // Deduplicate
}

// Utility: Extract wielders/associated entities
function extractWielders(item) {
    const wielders = [];

    // From properties
    if (item.properties) {
        item.properties.forEach(prop => {
            if (prop.name.toLowerCase().includes('wielder') ||
                prop.name.toLowerCase().includes('owner')) {
                wielders.push(prop.value);
            }
        });
    }

    // From relatedEntities
    if (item.relatedEntities?.deities) {
        wielders.push(...item.relatedEntities.deities.map(d => d.id));
    }
    if (item.relatedEntities?.heroes) {
        wielders.push(...item.relatedEntities.heroes.map(h => h.id));
    }

    return [...new Set(wielders)];
}

// Main migration function
function migrateItem(jsonPath) {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const itemId = jsonData.id;

    console.log(`Migrating: ${itemId}`);

    // Find and parse HTML content
    const htmlPath = findHTMLFile(itemId);
    const htmlContent = htmlPath ? extractHTMLContent(htmlPath) : null;

    // Map item type
    const { itemType, subtype } = mapItemType(jsonData.category, jsonData.subCategory);

    // Extract powers
    const powers = extractPowers(jsonData.properties, jsonData.tags);

    // Extract wielders
    const wielders = extractWielders(jsonData);

    // Build entity schema v2.0 compliant structure
    const migratedItem = {
        // Core required fields
        id: jsonData.id,
        type: 'item',
        name: jsonData.name.replace(/^[^a-zA-Z]+/, ''), // Remove emoji prefixes
        mythologies: jsonData.mythologies || [],
        primaryMythology: jsonData.primaryMythology || jsonData.mythologies?.[0] || 'unknown',

        // Icon/slug
        icon: jsonData.icon || '⚔️',
        slug: jsonData.slug || jsonData.id,

        // Descriptions
        shortDescription: jsonData.shortDescription || '',
        longDescription: jsonData.fullDescription || jsonData.longDescription || '',

        // Item-specific fields
        itemType: itemType,
        subtype: subtype,

        // Powers and abilities
        powers: powers,

        // Materials and creation
        materials: extractMaterials(jsonData),
        wielders: wielders,
        createdBy: extractCreators(jsonData),

        // Linguistic data
        linguistic: jsonData.linguistic || null,

        // Geographical data
        geographical: jsonData.geographical || null,

        // Temporal data
        temporal: jsonData.temporal || null,

        // Cultural context
        cultural: extractCulturalData(jsonData),

        // Metaphysical properties
        metaphysicalProperties: jsonData.metaphysicalProperties || null,

        // Colors
        colors: jsonData.colors || null,

        // Tags
        tags: jsonData.tags || [],

        // Related entities
        relatedEntities: jsonData.relatedEntities || null,

        // Sources
        sources: jsonData.sources || [],

        // Images
        mediaReferences: {
            images: jsonData.images || [],
            diagrams: []
        },

        // Search terms
        searchTerms: generateSearchTerms(jsonData, htmlContent),

        // Mythology contexts (preserve full detail)
        mythologyContexts: jsonData.mythologyContexts || [],

        // HTML content sections (extended content)
        extendedContent: htmlContent?.contentSections || [],

        // Metadata
        visibility: 'public',
        status: 'published',
        migratedFrom: 'legacy-repository',
        migrationDate: new Date().toISOString()
    };

    return migratedItem;
}

// Helper: Extract materials
function extractMaterials(item) {
    const materials = [];

    if (item.properties) {
        item.properties.forEach(prop => {
            if (prop.name.toLowerCase().includes('material')) {
                materials.push(prop.value);
            }
        });
    }

    return materials;
}

// Helper: Extract creators
function extractCreators(item) {
    const creators = [];

    if (item.properties) {
        item.properties.forEach(prop => {
            if (prop.name.toLowerCase().includes('craft') ||
                prop.name.toLowerCase().includes('creator') ||
                prop.name.toLowerCase().includes('builder') ||
                prop.name.toLowerCase().includes('forged by')) {
                creators.push(prop.value);
            }
        });
    }

    return creators;
}

// Helper: Extract cultural data
function extractCulturalData(item) {
    const cultural = {};

    if (item.mythologyContexts && item.mythologyContexts.length > 0) {
        const context = item.mythologyContexts[0];

        if (context.usage) {
            cultural.worshipPractices = [context.usage];
        }

        if (context.rituals) {
            cultural.festivals = context.rituals.map(r => ({
                name: r.name,
                description: r.description
            }));
        }

        if (context.culturalSignificance) {
            cultural.modernLegacy = {
                culturalImpact: context.culturalSignificance
            };
        }
    }

    return Object.keys(cultural).length > 0 ? cultural : null;
}

// Helper: Generate search terms
function generateSearchTerms(item, htmlContent) {
    const terms = new Set();

    // Add name variations
    terms.add(item.name.toLowerCase());
    terms.add(item.id);

    // Add linguistic variations
    if (item.linguistic) {
        if (item.linguistic.originalName) terms.add(item.linguistic.originalName.toLowerCase());
        if (item.linguistic.transliteration) terms.add(item.linguistic.transliteration.toLowerCase());
        if (item.linguistic.alternativeNames) {
            item.linguistic.alternativeNames.forEach(alt => terms.add(alt.name.toLowerCase()));
        }
    }

    // Add mythology contexts
    if (item.mythologyContexts) {
        item.mythologyContexts.forEach(ctx => {
            if (ctx.names) {
                ctx.names.forEach(name => terms.add(name.toLowerCase()));
            }
        });
    }

    // Add tags
    if (item.tags) {
        item.tags.forEach(tag => terms.add(tag.toLowerCase()));
    }

    // Add mythologies
    if (item.mythologies) {
        item.mythologies.forEach(myth => terms.add(myth.toLowerCase()));
    }

    return Array.from(terms);
}

// Main execution
async function main() {
    console.log('=== Item Migration to Entity Schema v2.0 ===\n');

    // Read all JSON files
    const jsonFiles = fs.readdirSync(JSON_SOURCE)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(JSON_SOURCE, f));

    console.log(`Found ${jsonFiles.length} JSON item files`);

    const migratedItems = [];
    const errors = [];

    for (const jsonPath of jsonFiles) {
        try {
            const item = migrateItem(jsonPath);
            migratedItems.push(item);
        } catch (error) {
            console.error(`Error migrating ${path.basename(jsonPath)}:`, error.message);
            errors.push({
                file: path.basename(jsonPath),
                error: error.message
            });
        }
    }

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write migrated items to JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(migratedItems, null, 2), 'utf-8');

    console.log(`\n=== Migration Complete ===`);
    console.log(`Successfully migrated: ${migratedItems.length} items`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Output: ${OUTPUT_FILE}`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }

    // Generate statistics
    const stats = {
        totalItems: migratedItems.length,
        byMythology: {},
        byItemType: {},
        withLinguistic: 0,
        withGeographical: 0,
        withTemporal: 0,
        withPowers: 0,
        withWielders: 0
    };

    migratedItems.forEach(item => {
        // Count by mythology
        item.mythologies.forEach(myth => {
            stats.byMythology[myth] = (stats.byMythology[myth] || 0) + 1;
        });

        // Count by item type
        stats.byItemType[item.itemType] = (stats.byItemType[item.itemType] || 0) + 1;

        // Count metadata coverage
        if (item.linguistic) stats.withLinguistic++;
        if (item.geographical) stats.withGeographical++;
        if (item.temporal) stats.withTemporal++;
        if (item.powers && item.powers.length > 0) stats.withPowers++;
        if (item.wielders && item.wielders.length > 0) stats.withWielders++;
    });

    // Write statistics
    const statsFile = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'items-migration-stats.json');
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf-8');
    console.log(`\nStatistics written to: ${statsFile}`);

    return { migratedItems, errors, stats };
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, migrateItem };
