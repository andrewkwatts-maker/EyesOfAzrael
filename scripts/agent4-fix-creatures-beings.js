/**
 * AGENT 4: Fix Creatures & Beings Collections
 *
 * This script processes incomplete creature and being assets from Firebase,
 * ensuring all template fields are populated, adding proper cross-links to
 * related deities and mythologies, and making these collections complete and rich.
 *
 * Process:
 * 1. Scan all HTML files in creatures/ and beings/ directories
 * 2. Extract metadata from HTML content
 * 3. Create/update complete Firebase documents with all required fields
 * 4. Add cross-references to deities, mythologies, archetypes, heroes
 * 5. Generate search terms, facets, and display options
 * 6. Ensure consistency and completeness across all entries
 *
 * Run with: node scripts/agent4-fix-creatures-beings.js
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

// Initialize Firebase Admin
let app;
try {
    app = admin.app();
    console.log('✅ Using existing Firebase app');
} catch (error) {
    const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'eyesofazrael'
    });
    console.log('✅ Initialized new Firebase app');
}

const db = admin.firestore();

// Statistics
const stats = {
    creaturesProcessed: 0,
    creaturesCreated: 0,
    creaturesUpdated: 0,
    beingsProcessed: 0,
    beingsCreated: 0,
    beingsUpdated: 0,
    errors: [],
    examples: []
};

/**
 * Creature and Being icon mappings
 */
const creatureIcons = {
    // Dragons and serpents
    'hydra': '🐉',
    'dragon': '🐉',
    'serpent': '🐍',
    'mushussu': '🐉',
    'lamassu': '🦁',
    'basilisk': '🐍',

    // Mythical beasts
    'chimera': '🔥',
    'sphinx': '🦁',
    'minotaur': '🐂',
    'centaur': '🐴',
    'pegasus': '🦄',
    'griffin': '🦅',
    'phoenix': '🔥',

    // Birds
    'garuda': '🦅',
    'simurgh': '🦅',
    'thunderbird': '🦅',
    'eagle': '🦅',
    'raven': '🐦‍⬛',

    // Underworld creatures
    'cerberus': '🐕',
    'garmr': '🐕',
    'hellhound': '🐕',

    // Warriors and guardians
    'valkyries': '⚔️',
    'apsaras': '💃',
    'houris': '🌟',

    // Monsters
    'typhon': '🌪️',
    'titans': '⚡',
    'giants': '👹',
    'jotnar': '❄️',

    // Magical beings
    'jinn': '💨',
    'div': '👿',
    'nagas': '🐍',
    'makara': '🐊',

    // Hindu avatars
    'brahma': '🕉️',
    'vishnu': '🕉️',
    'shiva': '🕉️',

    // Tarot
    'kerubim': '👁️',
    'angel': '👼',
    'bull': '🐂',
    'lion': '🦁',

    // Scorpions and insects
    'scorpion': '🦂'
};

/**
 * Creature type mappings
 */
const creatureTypes = {
    'hydra': 'serpent-monster',
    'dragon': 'dragon',
    'chimera': 'hybrid-beast',
    'sphinx': 'hybrid-beast',
    'minotaur': 'hybrid-beast',
    'pegasus': 'divine-beast',
    'cerberus': 'guardian-beast',
    'garuda': 'divine-bird',
    'valkyries': 'divine-warrior',
    'titans': 'primordial-being',
    'jinn': 'spirit-being',
    'nagas': 'serpent-deity',
    'mushussu': 'dragon',
    'lamassu': 'guardian-beast',
    'scorpion-men': 'hybrid-warrior',
    'typhon': 'primordial-monster',
    'garmr': 'guardian-beast',
    'jotnar': 'giant',
    'svadilfari': 'divine-beast',
    'yamadutas': 'death-messenger',
    'kerubim': 'angelic-being',
    'div': 'demon'
};

/**
 * Generate appropriate icon for creature/being
 */
function generateIcon(name, type) {
    const nameLower = name.toLowerCase();

    // Check specific name matches
    for (const [key, icon] of Object.entries(creatureIcons)) {
        if (nameLower.includes(key)) {
            return icon;
        }
    }

    // Default by type
    const typeDefaults = {
        'dragon': '🐉',
        'serpent-monster': '🐍',
        'hybrid-beast': '🦁',
        'divine-beast': '🦄',
        'guardian-beast': '🛡️',
        'divine-bird': '🦅',
        'divine-warrior': '⚔️',
        'primordial-being': '⚡',
        'spirit-being': '👻',
        'serpent-deity': '🐍',
        'hybrid-warrior': '⚔️',
        'primordial-monster': '👹',
        'giant': '👹',
        'death-messenger': '💀',
        'angelic-being': '👼',
        'demon': '👿'
    };

    return typeDefaults[type] || '🐉';
}

/**
 * Determine creature type from name and context
 */
function determineCreatureType(name, mythology, fileName) {
    const nameLower = name.toLowerCase();
    const fileLower = fileName.toLowerCase();

    // Check specific mappings
    for (const [key, type] of Object.entries(creatureTypes)) {
        if (nameLower.includes(key) || fileLower.includes(key)) {
            return type;
        }
    }

    // Pattern matching
    if (nameLower.includes('dragon') || nameLower.includes('wyrm')) return 'dragon';
    if (nameLower.includes('serpent') || nameLower.includes('snake')) return 'serpent-monster';
    if (nameLower.includes('guardian') || nameLower.includes('protector')) return 'guardian-beast';
    if (nameLower.includes('warrior') || nameLower.includes('maiden')) return 'divine-warrior';
    if (nameLower.includes('giant') || nameLower.includes('titan')) return 'giant';
    if (nameLower.includes('spirit') || nameLower.includes('jinn')) return 'spirit-being';
    if (nameLower.includes('demon') || nameLower.includes('div')) return 'demon';
    if (nameLower.includes('angel') || nameLower.includes('seraph')) return 'angelic-being';

    return 'mythical-creature';
}

/**
 * Extract metadata from HTML file
 */
async function extractMetadataFromHTML(filePath, mythology, entityType) {
    try {
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html);

        // Extract basic info and remove ALL emojis
        const rawTitle = $('h1').first().text().trim();
        // Remove all emojis using a comprehensive regex
        const title = rawTitle.replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{E0020}-\u{E007F}]/gu, '').trim();
        const fileName = path.basename(filePath, '.html');

        // Extract description
        let description = $('meta[name="description"]').attr('content') || '';
        if (!description) {
            const heroSection = $('section').first();
            description = heroSection.find('p').first().text().trim();
        }

        // Extract subtitle/tagline
        let subtitle = $('.subtitle').first().text().trim();
        if (!subtitle) {
            const headerP = $('section').first().find('p').first().text().trim();
            if (headerP && headerP.length < 200) {
                subtitle = headerP;
            }
        }

        // Extract related entities from links
        const relatedDeities = [];
        const relatedHeroes = [];
        const relatedPlaces = [];
        const relatedCreatures = [];

        $('a[href*="/deities/"]').each((i, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href');
            if (name && !name.includes('Browse') && !relatedDeities.find(d => d.name === name)) {
                relatedDeities.push({ name, href });
            }
        });

        $('a[href*="/heroes/"]').each((i, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href');
            if (name && !name.includes('Browse') && !relatedHeroes.find(h => h.name === name)) {
                relatedHeroes.push({ name, href });
            }
        });

        $('a[href*="/cosmology/"], a[href*="/places/"], a[href*="/realms/"]').each((i, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href');
            if (name && !name.includes('Browse') && !relatedPlaces.find(p => p.name === name)) {
                relatedPlaces.push({ name, href });
            }
        });

        $('a[href*="/creatures/"], a[href*="/beings/"]').each((i, el) => {
            const name = $(el).text().trim();
            const href = $(el).attr('href');
            if (name && !name.includes('Browse') && !relatedCreatures.find(c => c.name === name)) {
                relatedCreatures.push({ name, href });
            }
        });

        // Extract archetype information
        let archetype = null;
        const archetypeLink = $('.archetype-badge, .archetype-link-card').first();
        if (archetypeLink.length > 0) {
            archetype = {
                name: archetypeLink.text().trim(),
                description: archetypeLink.closest('.archetype-link-card').find('.archetype-context').text().trim()
            };
        }

        // Extract abilities/powers from lists
        const abilities = [];
        $('ul li').each((i, el) => {
            const text = $(el).text().trim();
            if (text && text.length < 300 && (
                text.includes(':') ||
                text.toLowerCase().includes('ability') ||
                text.toLowerCase().includes('power')
            )) {
                abilities.push(text);
            }
        });

        // Extract cross-cultural parallels
        const parallels = [];
        $('.parallel-card').each((i, el) => {
            const name = $(el).find('.parallel-name').text().trim();
            const tradition = $(el).find('.tradition-label').text().trim();
            if (name && tradition) {
                parallels.push({ name, tradition });
            }
        });

        return {
            name: title || fileName,
            fileName,
            description,
            subtitle,
            relatedDeities,
            relatedHeroes,
            relatedPlaces,
            relatedCreatures,
            archetype,
            abilities,
            parallels
        };

    } catch (error) {
        console.error(`Error extracting from ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Create comprehensive Firebase document for creature/being
 */
function createFirebaseDocument(metadata, mythology, entityType, filePath) {
    const creatureType = determineCreatureType(metadata.name, mythology, metadata.fileName);
    const icon = generateIcon(metadata.name, creatureType);

    // Build related entities array
    const relatedEntities = [];

    // Add deities
    metadata.relatedDeities.forEach(deity => {
        relatedEntities.push({
            name: deity.name,
            type: 'deity',
            relationship: 'associated deity',
            mythology: mythology,
            icon: '⚡'
        });
    });

    // Add heroes
    metadata.relatedHeroes.forEach(hero => {
        relatedEntities.push({
            name: hero.name,
            type: 'hero',
            relationship: 'associated hero',
            mythology: mythology,
            icon: '🗡️'
        });
    });

    // Add places
    metadata.relatedPlaces.forEach(place => {
        relatedEntities.push({
            name: place.name,
            type: 'place',
            relationship: 'associated location',
            mythology: mythology,
            icon: '🏛️'
        });
    });

    // Add other creatures
    metadata.relatedCreatures.forEach(creature => {
        relatedEntities.push({
            name: creature.name,
            type: 'creature',
            relationship: 'related creature',
            mythology: mythology,
            icon: '🐉'
        });
    });

    // Add parallels as cross-tradition related entities
    metadata.parallels.forEach(parallel => {
        relatedEntities.push({
            name: parallel.name,
            type: 'creature',
            relationship: 'cross-cultural parallel',
            mythology: parallel.tradition.toLowerCase(),
            icon: '🔗'
        });
    });

    // Build document
    const doc = {
        // Core identity
        id: metadata.fileName,
        name: metadata.name,
        type: entityType, // 'creature' or 'being'
        subtype: creatureType,
        mythology: mythology,
        mythologies: [mythology],

        // Visual
        icon: icon,
        visual: {
            icon: icon,
            color: getMythologyColor(mythology),
            theme: mythology
        },

        // Description
        description: metadata.description || `${metadata.name} from ${mythology} mythology`,
        subtitle: metadata.subtitle || '',

        // Content
        content: buildContentMarkdown(metadata, mythology, entityType),

        // Relationships
        relatedEntities: relatedEntities,

        // Archetype
        archetype: metadata.archetype ? {
            name: metadata.archetype.name,
            description: metadata.archetype.description,
            type: 'creature-archetype'
        } : null,

        // Attributes
        abilities: metadata.abilities || [],
        characteristics: extractCharacteristics(metadata, creatureType),

        // Search and discovery
        searchTerms: generateSearchTerms(metadata.name, mythology, creatureType, metadata),
        facets: {
            mythology: mythology,
            type: entityType,
            subtype: creatureType,
            role: determineRole(creatureType, metadata),
            alignment: determineAlignment(metadata, creatureType)
        },

        // Display options
        displayOptions: {
            relatedEntities: {
                mode: 'grid',
                columns: 3,
                sort: 'custom',
                showIcons: true,
                cardStyle: 'compact'
            }
        },

        // Metadata
        metadata: {
            created: admin.firestore.FieldValue.serverTimestamp(),
            updated: admin.firestore.FieldValue.serverTimestamp(),
            source: 'agent4-migration',
            sourceFile: path.basename(filePath),
            completeness: calculateCompleteness(metadata)
        },

        // Tags
        tags: generateTags(metadata, mythology, creatureType)
    };

    return doc;
}

/**
 * Get mythology color scheme
 */
function getMythologyColor(mythology) {
    const colors = {
        'greek': '#4682B4',
        'norse': '#5F9EA0',
        'egyptian': '#DAA520',
        'hindu': '#FF8C00',
        'celtic': '#228B22',
        'babylonian': '#8B4513',
        'sumerian': '#CD853F',
        'chinese': '#DC143C',
        'japanese': '#8B0000',
        'buddhist': '#FFD700',
        'christian': '#4169E1',
        'islamic': '#006400',
        'persian': '#800080',
        'roman': '#B22222',
        'tarot': '#9370DB',
        'apocryphal': '#483D8B'
    };
    return colors[mythology] || '#4682B4';
}

/**
 * Build markdown content from metadata
 */
function buildContentMarkdown(metadata, mythology, entityType) {
    let content = `# ${metadata.name}\n\n`;

    if (metadata.description) {
        content += `${metadata.description}\n\n`;
    }

    if (metadata.abilities && metadata.abilities.length > 0) {
        content += `## Abilities and Powers\n\n`;
        metadata.abilities.forEach(ability => {
            content += `- ${ability}\n`;
        });
        content += '\n';
    }

    if (metadata.archetype) {
        content += `## Archetypal Significance\n\n`;
        content += `${metadata.archetype.description}\n\n`;
    }

    return content;
}

/**
 * Extract characteristics from metadata
 */
function extractCharacteristics(metadata, creatureType) {
    const characteristics = [];

    // Type-based characteristics
    if (creatureType.includes('dragon')) {
        characteristics.push('Reptilian', 'Powerful', 'Ancient');
    } else if (creatureType.includes('warrior')) {
        characteristics.push('Martial', 'Divine', 'Selective');
    } else if (creatureType.includes('guardian')) {
        characteristics.push('Protective', 'Vigilant', 'Loyal');
    } else if (creatureType.includes('spirit')) {
        characteristics.push('Ethereal', 'Shapeshifting', 'Mysterious');
    }

    // Name-based characteristics
    const nameLower = metadata.name.toLowerCase();
    if (nameLower.includes('hydra')) {
        characteristics.push('Multi-headed', 'Regenerative', 'Venomous');
    } else if (nameLower.includes('phoenix')) {
        characteristics.push('Immortal', 'Fire-based', 'Rebirth');
    } else if (nameLower.includes('cerberus') || nameLower.includes('garmr')) {
        characteristics.push('Three-headed', 'Underworld guardian', 'Fierce');
    }

    return [...new Set(characteristics)]; // Remove duplicates
}

/**
 * Determine role based on type and metadata
 */
function determineRole(creatureType, metadata) {
    if (creatureType.includes('guardian')) return 'Guardian';
    if (creatureType.includes('warrior')) return 'Warrior';
    if (creatureType.includes('messenger')) return 'Messenger';
    if (creatureType.includes('primordial')) return 'Primordial Force';
    if (creatureType.includes('demon')) return 'Antagonist';
    if (creatureType.includes('angelic')) return 'Divine Servant';
    if (creatureType === 'hybrid-beast' || creatureType === 'serpent-monster') return 'Monster';
    return 'Mythical Being';
}

/**
 * Determine alignment based on metadata
 */
function determineAlignment(metadata, creatureType) {
    const nameLower = metadata.name.toLowerCase();
    const descLower = (metadata.description || '').toLowerCase();

    if (creatureType.includes('demon') || creatureType.includes('monster')) return 'Chaotic';
    if (creatureType.includes('angelic') || creatureType.includes('guardian')) return 'Lawful';
    if (creatureType.includes('warrior') && descLower.includes('divine')) return 'Lawful';
    if (nameLower.includes('trickster') || descLower.includes('chaos')) return 'Chaotic';

    return 'Neutral';
}

/**
 * Generate search terms
 */
function generateSearchTerms(name, mythology, creatureType, metadata) {
    const terms = [
        name.toLowerCase(),
        mythology,
        creatureType,
        ...name.toLowerCase().split(/\s+/)
    ];

    // Add variant spellings
    if (name.includes('ū') || name.includes('š') || name.includes('ḫ')) {
        // Add ASCII version
        terms.push(name.replace(/[ūšḫ]/g, match => {
            const map = { 'ū': 'u', 'š': 'sh', 'ḫ': 'h' };
            return map[match] || match;
        }).toLowerCase());
    }

    // Add related terms
    if (metadata.abilities) {
        metadata.abilities.forEach(ability => {
            const words = ability.toLowerCase().split(/\s+/);
            terms.push(...words.filter(w => w.length > 3));
        });
    }

    return [...new Set(terms)]; // Remove duplicates
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(metadata) {
    let score = 0;
    let total = 0;

    const checks = [
        { field: 'name', weight: 10 },
        { field: 'description', weight: 15 },
        { field: 'subtitle', weight: 5 },
        { field: 'relatedDeities', weight: 10, isArray: true },
        { field: 'relatedHeroes', weight: 5, isArray: true },
        { field: 'abilities', weight: 10, isArray: true },
        { field: 'archetype', weight: 10 },
        { field: 'parallels', weight: 5, isArray: true }
    ];

    checks.forEach(check => {
        total += check.weight;
        if (check.isArray) {
            if (metadata[check.field] && metadata[check.field].length > 0) {
                score += check.weight;
            }
        } else {
            if (metadata[check.field]) {
                score += check.weight;
            }
        }
    });

    return Math.round((score / total) * 100);
}

/**
 * Generate tags
 */
function generateTags(metadata, mythology, creatureType) {
    const tags = [mythology, creatureType];

    // Add feature tags
    if (creatureType.includes('dragon')) tags.push('dragon', 'reptile');
    if (creatureType.includes('warrior')) tags.push('warrior', 'divine');
    if (creatureType.includes('guardian')) tags.push('guardian', 'protector');
    if (creatureType.includes('hybrid')) tags.push('hybrid', 'chimeric');
    if (creatureType.includes('serpent')) tags.push('serpent', 'snake');

    // Add role tags
    const nameLower = metadata.name.toLowerCase();
    if (nameLower.includes('death') || nameLower.includes('underworld')) {
        tags.push('death', 'underworld');
    }
    if (nameLower.includes('heaven') || nameLower.includes('celestial')) {
        tags.push('celestial', 'heavenly');
    }

    return [...new Set(tags)];
}

/**
 * Process a single creature/being file
 */
async function processEntity(filePath, mythology, entityType) {
    try {
        console.log(`\n📄 Processing: ${path.basename(filePath)}`);

        // Extract metadata from HTML
        const metadata = await extractMetadataFromHTML(filePath, mythology, entityType);
        if (!metadata) {
            throw new Error('Failed to extract metadata');
        }

        console.log(`   Name: ${metadata.name}`);
        console.log(`   Type: ${entityType} (${determineCreatureType(metadata.name, mythology, metadata.fileName)})`);

        // Create Firebase document
        const doc = createFirebaseDocument(metadata, mythology, entityType, filePath);

        // Check if document exists
        const collectionName = entityType === 'creature' ? 'creatures' : 'beings';
        const docRef = db.collection(collectionName).doc(metadata.fileName);
        const existing = await docRef.get();

        if (existing.exists) {
            // Update existing document
            await docRef.update({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    updated: admin.firestore.FieldValue.serverTimestamp()
                }
            });
            console.log(`   ✅ Updated in Firebase`);
            if (entityType === 'creature') {
                stats.creaturesUpdated++;
            } else {
                stats.beingsUpdated++;
            }
        } else {
            // Create new document
            await docRef.set(doc);
            console.log(`   ✅ Created in Firebase`);
            if (entityType === 'creature') {
                stats.creaturesCreated++;
            } else {
                stats.beingsCreated++;
            }
        }

        // Save example
        if (stats.examples.length < 5) {
            stats.examples.push({
                name: doc.name,
                type: entityType,
                mythology: mythology,
                completeness: doc.metadata.completeness,
                relatedCount: doc.relatedEntities.length
            });
        }

        if (entityType === 'creature') {
            stats.creaturesProcessed++;
        } else {
            stats.beingsProcessed++;
        }

    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        stats.errors.push({
            file: path.basename(filePath),
            error: error.message
        });
    }
}

/**
 * Scan and process all creatures and beings
 */
async function processAll() {
    console.log('🚀 AGENT 4: Fix Creatures & Beings Collections');
    console.log('================================================\n');

    const basePath = path.join(__dirname, '..');

    // Find all creature and being HTML files
    const mythologies = [
        'greek', 'norse', 'egyptian', 'hindu', 'celtic', 'babylonian',
        'sumerian', 'chinese', 'japanese', 'buddhist', 'christian',
        'islamic', 'persian', 'roman', 'tarot', 'apocryphal'
    ];

    for (const mythology of mythologies) {
        console.log(`\n📚 Processing ${mythology.toUpperCase()} mythology...`);

        // Process creatures
        const creaturesPath = path.join(basePath, 'mythos', mythology, 'creatures');
        try {
            const creatureFiles = await fs.readdir(creaturesPath);
            const htmlFiles = creatureFiles.filter(f =>
                f.endsWith('.html') &&
                f !== 'index.html' &&
                !f.includes('hierarchy')
            );

            for (const file of htmlFiles) {
                await processEntity(
                    path.join(creaturesPath, file),
                    mythology,
                    'creature'
                );
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.log(`   ⚠️  Error reading creatures: ${error.message}`);
            }
        }

        // Process beings
        const beingsPath = path.join(basePath, 'mythos', mythology, 'beings');
        try {
            const beingFiles = await fs.readdir(beingsPath);
            const htmlFiles = beingFiles.filter(f =>
                f.endsWith('.html') &&
                f !== 'index.html'
            );

            for (const file of htmlFiles) {
                await processEntity(
                    path.join(beingsPath, file),
                    mythology,
                    'being'
                );
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.log(`   ⚠️  Error reading beings: ${error.message}`);
            }
        }
    }
}

/**
 * Generate report
 */
async function generateReport() {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            creaturesProcessed: stats.creaturesProcessed,
            creaturesCreated: stats.creaturesCreated,
            creaturesUpdated: stats.creaturesUpdated,
            beingsProcessed: stats.beingsProcessed,
            beingsCreated: stats.beingsCreated,
            beingsUpdated: stats.beingsUpdated,
            totalProcessed: stats.creaturesProcessed + stats.beingsProcessed,
            totalCreated: stats.creaturesCreated + stats.beingsCreated,
            totalUpdated: stats.creaturesUpdated + stats.beingsUpdated,
            errors: stats.errors.length
        },
        examples: stats.examples,
        errors: stats.errors
    };

    const reportPath = path.join(__dirname, '..', 'AGENT4_CREATURES_BEINGS_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n\n📊 FINAL STATISTICS');
    console.log('==================');
    console.log(`Creatures Processed: ${stats.creaturesProcessed}`);
    console.log(`  - Created: ${stats.creaturesCreated}`);
    console.log(`  - Updated: ${stats.creaturesUpdated}`);
    console.log(`\nBeings Processed: ${stats.beingsProcessed}`);
    console.log(`  - Created: ${stats.beingsCreated}`);
    console.log(`  - Updated: ${stats.beingsUpdated}`);
    console.log(`\nTotal Processed: ${stats.creaturesProcessed + stats.beingsProcessed}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
        console.log('\n❌ Errors:');
        stats.errors.forEach(err => {
            console.log(`   - ${err.file}: ${err.error}`);
        });
    }

    console.log(`\n✅ Report saved to: AGENT4_CREATURES_BEINGS_REPORT.json`);
}

/**
 * Main execution
 */
async function main() {
    try {
        await processAll();
        await generateReport();
        console.log('\n✅ Agent 4 complete!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { processEntity, createFirebaseDocument };
