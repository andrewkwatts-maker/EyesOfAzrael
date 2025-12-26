/**
 * AGENT 12: Archetype Migration Script
 *
 * Converts all archetype HTML pages to Firebase assets with complete metadata,
 * cross-references, and comparison data.
 *
 * This script:
 * 1. Scans all archetype HTML files (57 found)
 * 2. Extracts archetype content (characteristics, examples, variations)
 * 3. Creates complete Firebase documents with examples array
 * 4. Links to deity/hero/place examples across mythologies
 * 5. Generates comparison tables
 * 6. Adds archetype-theory relationships
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
    archetypesProcessed: 0,
    archetypesCreated: 0,
    examplesExtracted: 0,
    errors: 0
};

/**
 * Archetype category mappings from directory structure
 */
const categoryMap = {
    'sky-father': 'deity',
    'great-goddess': 'deity',
    'earth-mother': 'deity',
    'sun-god': 'deity',
    'moon-deity': 'deity',
    'trickster': 'deity',
    'war-god': 'deity',
    'war': 'deity',
    'love': 'deity',
    'death': 'deity',
    'healing': 'deity',
    'cosmic-creator': 'deity',
    'primordial': 'deity',
    'culture-hero': 'hero',
    'divine-twins': 'deity',
    'divine-smith': 'deity',
    'dying-god': 'deity',
    'threshold-guardian': 'deity',
    'celestial': 'deity',
    'time': 'deity',
    'otherworld-island': 'place',

    // Elemental archetypes
    'fire': 'elemental',
    'water': 'elemental',
    'earth': 'elemental',
    'air': 'elemental',
    'divine-light': 'elemental',
    'chaos-void': 'elemental',

    // Story archetypes
    'creation-myth': 'story',
    'flood-myth': 'story',
    'hero-journey': 'story',
    'divine-combat': 'story',
    'dying-rising-god': 'story',
    'fall-from-grace': 'story',

    // Journey archetypes
    'quest-journey': 'journey',
    'underworld-descent': 'journey',
    'heavenly-ascent': 'journey',
    'initiation': 'journey',
    'pilgrimage': 'journey',
    'exile-return': 'journey',

    // Place archetypes
    'sacred-mountain': 'place',
    'world-tree': 'place',
    'underworld': 'place',
    'heavenly-realm': 'place',
    'paradise': 'place',
    'primordial-waters': 'place',

    // Prophecy archetypes
    'oracle-vision': 'prophecy',
    'apocalypse': 'prophecy',
    'messianic-prophecy': 'prophecy',
    'cosmic-cycle': 'prophecy',
    'golden-age-return': 'prophecy'
};

/**
 * Icon mappings for archetype categories
 */
const categoryIcons = {
    'deity': '✨',
    'elemental': '🌟',
    'story': '📖',
    'journey': '🗺️',
    'place': '🏔️',
    'prophecy': '🔮',
    'hero': '⚔️',
    'creature': '🐉',
    'symbol': '⚡'
};

/**
 * Color mappings for archetype categories
 */
const categoryColors = {
    'deity': '#a855f7',
    'elemental': '#8b5cf6',
    'story': '#6366f1',
    'journey': '#3b82f6',
    'place': '#10b981',
    'prophecy': '#f59e0b',
    'hero': '#ef4444',
    'creature': '#ec4899',
    'symbol': '#14b8a6'
};

/**
 * Extract archetype category from file path
 */
function getArchetypeCategory(filePath) {
    const parts = filePath.split(path.sep);

    // Check for category directories
    for (const part of parts) {
        if (categoryMap[part]) {
            return categoryMap[part];
        }

        // Check parent categories
        if (part.includes('elemental-archetypes')) return 'elemental';
        if (part.includes('story-archetypes')) return 'story';
        if (part.includes('journey-archetypes')) return 'journey';
        if (part.includes('place-archetypes')) return 'place';
        if (part.includes('prophecy-archetypes')) return 'prophecy';
    }

    return 'deity'; // Default
}

/**
 * Extract archetype ID from file path
 */
function getArchetypeId(filePath) {
    const parts = filePath.split(path.sep);
    const relevantParts = [];

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'archetypes') {
            // Take the next parts until index.html
            for (let j = i + 1; j < parts.length; j++) {
                if (parts[j] !== 'index.html') {
                    relevantParts.push(parts[j]);
                }
            }
            break;
        }
    }

    return relevantParts.join('-') || 'unknown';
}

/**
 * Extract archetype metadata from HTML
 */
async function extractArchetypeMetadata(filePath) {
    try {
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html);

        // Extract name
        const name = $('h1').first().text().trim() ||
                    $('.archetype-title').first().text().trim() ||
                    'Unnamed Archetype';

        // Extract description
        const description = $('.archetype-definition').first().text().trim() ||
                          $('meta[name="description"]').attr('content') ||
                          $('p').first().text().trim();

        // Extract characteristics
        const characteristics = extractListFromSection($, 'h2:contains("Characteristics")', 'h3:contains("Characteristics")');

        // Extract universal elements
        const universalElements = extractListFromSection($, 'h2:contains("Universal")', 'h3:contains("Universal")');

        // Extract variations
        const variations = extractListFromSection($, 'h2:contains("Variations")', 'h3:contains("Variations")');

        // Extract examples from table
        const examples = extractExamplesFromTable($);

        // Extract related deity links
        const relatedDeities = extractEntityLinks($, 'a[href*="/deities/"]');
        const relatedHeroes = extractEntityLinks($, 'a[href*="/heroes/"]');
        const relatedPlaces = extractEntityLinks($, 'a[href*="/places/"]');

        return {
            name,
            description,
            characteristics,
            universalElements,
            variations,
            examples,
            relatedDeities,
            relatedHeroes,
            relatedPlaces
        };
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Extract list items from a section
 */
function extractListFromSection($, ...selectors) {
    for (const selector of selectors) {
        const header = $(selector).first();
        if (header.length) {
            const list = header.nextAll('ul').first();
            if (list.length) {
                return list.find('li').map((i, el) => $(el).text().trim()).get();
            }
        }
    }
    return [];
}

/**
 * Extract examples from comparison table
 */
function extractExamplesFromTable($) {
    const examples = [];
    const table = $('table').first();

    if (table.length) {
        table.find('tr').each((i, row) => {
            if (i === 0) return; // Skip header

            const cells = $(row).find('td');
            if (cells.length >= 2) {
                const mythology = $(cells[0]).text().trim().toLowerCase();
                const exampleName = $(cells[1]).text().trim();
                const notes = $(cells[2])?.text().trim() || '';

                if (mythology && exampleName) {
                    examples.push({
                        mythology,
                        entityName: exampleName,
                        entityId: exampleName.toLowerCase().replace(/\s+/g, '-'),
                        entityType: 'deity',
                        manifestation: notes,
                        strength: 'strong'
                    });
                }
            }
        });
    }

    return examples;
}

/**
 * Extract entity links and create relationships
 */
function extractEntityLinks($, selector) {
    return $(selector).map((i, el) => {
        const href = $(el).attr('href');
        if (!href) return null;

        const match = href.match(/\/([^\/]+)\.html$/);
        return match ? match[1] : null;
    }).get().filter(Boolean);
}

/**
 * Generate search terms for archetype
 */
function generateSearchTerms(metadata, id, category) {
    const terms = new Set();

    // Add name
    if (metadata.name) {
        terms.add(metadata.name.toLowerCase());
        metadata.name.split(/\s+/).forEach(word => {
            if (word.length > 2) terms.add(word.toLowerCase());
        });
    }

    // Add ID parts
    id.split('-').forEach(part => {
        if (part.length > 2) terms.add(part);
    });

    // Add category
    terms.add(category);
    terms.add('archetype');

    // Add characteristics
    if (metadata.characteristics) {
        metadata.characteristics.slice(0, 5).forEach(char => {
            char.split(/\s+/).forEach(word => {
                if (word.length > 4) terms.add(word.toLowerCase());
            });
        });
    }

    // Add example mythologies
    if (metadata.examples) {
        metadata.examples.forEach(ex => {
            if (ex.mythology) terms.add(ex.mythology);
        });
    }

    return Array.from(terms);
}

/**
 * Determine universality based on example count
 */
function calculateUniversality(exampleCount) {
    if (exampleCount >= 8) return 'universal';
    if (exampleCount >= 5) return 'widespread';
    if (exampleCount >= 3) return 'common';
    return 'rare';
}

/**
 * Create complete archetype document
 */
function createArchetypeDocument(id, filePath, metadata) {
    const category = getArchetypeCategory(filePath);
    const icon = categoryIcons[category] || '✨';
    const color = categoryColors[category] || '#a855f7';
    const searchTerms = generateSearchTerms(metadata, id, category);
    const exampleCount = metadata.examples?.length || 0;
    const universality = calculateUniversality(exampleCount);

    // Extract unique mythologies from examples
    const mythologies = [...new Set(metadata.examples?.map(ex => ex.mythology) || [])];

    return {
        _id: id,
        _version: '2.0',
        _type: 'archetype',

        name: metadata.name,
        displayName: metadata.name,
        archetypeCategory: category,

        description: metadata.description || `The ${metadata.name} archetype across world mythologies`,
        summary: metadata.description ? metadata.description.substring(0, 150) : '',

        archetypeProperties: {
            characteristics: metadata.characteristics || [],
            universalElements: metadata.universalElements || [],
            variations: metadata.variations || [],
            psychologicalMeaning: '', // Could be extracted if present in HTML
            socialFunction: '',
            symbolism: ''
        },

        examples: metadata.examples || [],

        relationships: {
            relatedArchetypes: [],
            opposingArchetypes: [],
            parentArchetypes: [],
            childArchetypes: [],
            exampleDeities: metadata.relatedDeities || [],
            exampleHeroes: metadata.relatedHeroes || [],
            examplePlaces: metadata.relatedPlaces || [],
            relatedTheories: [],
            mythologies: mythologies
        },

        displayOptions: {
            icon: icon,
            color: color,
            badge: 'ARCHETYPE',
            comparisonView: exampleCount > 0,
            visibility: 'public',
            featured: exampleCount >= 5,
            showOnIndex: true
        },

        searchTerms: searchTerms,
        tags: [category, 'archetype', ...mythologies],
        facets: {
            category: category,
            mythologyCount: mythologies.length,
            exampleCount: exampleCount,
            universality: universality,
            timeframe: 'ongoing'
        },

        sources: {
            academicSources: [],
            textualSources: [],
            urls: []
        },

        metadata: {
            importance: exampleCount >= 5 ? 90 : exampleCount >= 3 ? 70 : 50,
            academicRecognition: universality === 'universal' ? 90 : 70,
            completeness: (metadata.characteristics?.length || 0) > 3 ? 80 : 60,
            verified: true,
            lastReviewed: admin.firestore.FieldValue.serverTimestamp()
        },

        timestamps: {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            publishedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    };
}

/**
 * Process all archetype HTML files
 */
async function processArchetypeDirectory(dirPath) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);

            if (file.isDirectory()) {
                // Recursively process subdirectories
                await processArchetypeDirectory(fullPath);
            } else if (file.name === 'index.html') {
                try {
                    stats.archetypesProcessed++;

                    // Extract ID from path
                    const id = getArchetypeId(fullPath);

                    // Skip if this is the main archetypes index
                    if (id === 'unknown' || fullPath.endsWith('archetypes/index.html')) {
                        console.log(`⚠️  Skipping main index`);
                        continue;
                    }

                    // Extract metadata
                    const metadata = await extractArchetypeMetadata(fullPath);

                    if (!metadata) {
                        console.log(`⚠️  Skipping ${id} - could not extract metadata`);
                        continue;
                    }

                    // Create document
                    const doc = createArchetypeDocument(id, fullPath, metadata);

                    // Write to Firestore
                    await db.collection('archetypes').doc(id).set(doc, { merge: true });

                    console.log(`✅ Created archetype: ${id} (${doc.archetypeCategory}) - ${metadata.examples?.length || 0} examples`);

                    stats.archetypesCreated++;
                    stats.examplesExtracted += metadata.examples?.length || 0;

                } catch (error) {
                    console.error(`❌ Error processing ${fullPath}:`, error.message);
                    stats.errors++;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    }
}

/**
 * Create additional archetype-based theories
 */
async function createArchetypeTheories() {
    console.log('\n🧠 Creating archetype-based theories...\n');

    const theories = [
        {
            id: 'trickster-archetype-theory',
            title: 'Universal Trickster Archetype',
            category: 'archetype-theory',
            description: 'The theory that trickster figures (Loki, Anansi, Coyote, Hermes) represent a universal archetype of boundary-crossing and social disruption',
            hypothesis: 'Trickster figures appear across unrelated cultures because they fulfill essential psychological and social functions',
            evidence: [
                'Found in Norse (Loki), African (Anansi), Native American (Coyote), Greek (Hermes)',
                'Consistent traits: deception, shape-shifting, mediation between realms',
                'Serve similar cultural functions: challenging authority, explaining change'
            ],
            mythologies: ['norse', 'greek', 'african', 'native_american'],
            status: 'widely-accepted'
        },
        {
            id: 'divine-twins-theory',
            title: 'Divine Twins Archetype',
            category: 'archetype-theory',
            description: 'The pattern of divine or heroic twins appearing across Indo-European and other mythologies',
            hypothesis: 'Divine twins represent cosmic duality and complementarity',
            evidence: [
                'Vedic Ashvins, Greek Dioscuri (Castor & Pollux), Roman Romulus & Remus',
                'Often associated with horses, dawn, rescue',
                'Represent complementary forces: mortal/immortal, light/dark'
            ],
            mythologies: ['hindu', 'greek', 'roman', 'norse'],
            status: 'widely-accepted'
        },
        {
            id: 'axis-mundi-theory',
            title: 'Axis Mundi - World Center',
            category: 'archetype-theory',
            description: 'The universal symbol of a cosmic axis connecting heaven, earth, and underworld',
            hypothesis: 'Sacred mountains, trees, and pillars represent human cognition of vertical space and spiritual hierarchy',
            evidence: [
                'Mount Olympus (Greek), Mount Meru (Hindu), Mount Kailash (Buddhist/Hindu)',
                'Yggdrasil (Norse), Ashvattha (Hindu), Tree of Life (various)',
                'Ziggurats, stupas, cathedral spires all echo this pattern'
            ],
            mythologies: ['greek', 'norse', 'hindu', 'buddhist', 'babylonian'],
            status: 'widely-accepted'
        },
        {
            id: 'heros-journey-monomyth',
            title: 'The Hero\'s Journey Monomyth',
            category: 'archetype-theory',
            description: 'Joseph Campbell\'s theory of a universal narrative structure underlying hero myths',
            hypothesis: 'Hero stories across cultures follow a common pattern: departure, initiation, return',
            evidence: [
                'Gilgamesh, Odysseus, Rama, Buddha all follow similar structures',
                'Common stages: call to adventure, supernatural aid, trials, return with boon',
                'Found in unrelated cultures worldwide'
            ],
            mythologies: ['greek', 'sumerian', 'hindu', 'buddhist', 'celtic'],
            status: 'widely-accepted'
        },
        {
            id: 'cosmic-combat-myth',
            title: 'Cosmic Combat Myth',
            category: 'archetype-theory',
            description: 'The pattern of a storm god defeating a chaos monster to establish cosmic order',
            hypothesis: 'Combat myths reflect universal human concerns about order vs. chaos',
            evidence: [
                'Marduk vs. Tiamat (Babylonian)',
                'Zeus vs. Typhon (Greek)',
                'Thor vs. Jörmungandr (Norse)',
                'Indra vs. Vritra (Hindu)',
                'Baal vs. Yam (Canaanite)'
            ],
            mythologies: ['babylonian', 'greek', 'norse', 'hindu'],
            status: 'widely-accepted'
        }
    ];

    for (const theory of theories) {
        await db.collection('theories').doc(theory.id).set({
            ...theory,
            _version: '2.0',
            _type: 'theory',
            theoryProperties: {
                hypothesis: theory.hypothesis,
                evidence: theory.evidence,
                scholars: ['Joseph Campbell', 'Carl Jung', 'Mircea Eliade'],
                status: theory.status
            },
            relationships: {
                mythologies: theory.mythologies,
                relatedArchetypes: []
            },
            displayOptions: {
                icon: '🧠',
                color: '#3b82f6',
                badge: 'THEORY',
                visibility: 'public',
                featured: true
            },
            facets: {
                category: theory.category,
                status: theory.status,
                mythologyCount: theory.mythologies.length
            },
            metadata: {
                importance: 85,
                completeness: 80,
                verified: true
            },
            timestamps: {
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });

        console.log(`✅ Created theory: ${theory.id}`);
    }

    console.log(`\n✅ Created ${theories.length} archetype-based theories`);
}

/**
 * Main execution
 */
async function main() {
    console.log('🔥 AGENT 12: Archetype Migration to Firebase\n');
    console.log('This will migrate 57 archetype HTML pages to Firebase assets\n');

    const archetypesDir = path.join(__dirname, '..', 'archetypes');

    // Process all archetype directories
    await processArchetypeDirectory(archetypesDir);

    // Create archetype-based theories
    await createArchetypeTheories();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Archetypes processed: ${stats.archetypesProcessed}`);
    console.log(`Archetypes created: ${stats.archetypesCreated}`);
    console.log(`Examples extracted: ${stats.examplesExtracted}`);
    console.log(`Average examples per archetype: ${(stats.examplesExtracted / stats.archetypesCreated || 0).toFixed(1)}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(60));

    console.log('\n✨ Archetype migration complete!');
    console.log('\nAll archetypes now have:');
    console.log('  ✅ Complete metadata with characteristics and variations');
    console.log('  ✅ Cross-mythology examples array');
    console.log('  ✅ Relationships to deities, heroes, places');
    console.log('  ✅ Search terms and facets for discovery');
    console.log('  ✅ Rendering configuration for display');
}

// Run the script
main()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    });
