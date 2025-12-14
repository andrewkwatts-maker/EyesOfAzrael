#!/usr/bin/env node

/**
 * Hero Migration Script - Entity Schema v2.0
 * Migrates all heroes from old repository to Firebase-ready format
 *
 * Source: H:\Github\EyesOfAzrael2\EyesOfAzrael\mythos\*\heroes\*.html
 * Target Schema: data/schemas/entity-schema-v2.json
 * Output: data/firebase-imports/heroes-supplement.json
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const OLD_REPO_BASE = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael';
const NEW_REPO_BASE = 'H:\\Github\\EyesOfAzrael';
const MYTHOS_DIR = path.join(OLD_REPO_BASE, 'mythos');
const OUTPUT_FILE = path.join(NEW_REPO_BASE, 'data', 'firebase-imports', 'heroes-supplement.json');
const CURRENT_HEROES_FILE = path.join(NEW_REPO_BASE, 'FIREBASE', 'transformed_data', 'heroes_transformed.json');

// List of all mythologies to scan
const MYTHOLOGIES = [
    'greek', 'roman', 'norse', 'egyptian', 'celtic', 'hindu', 'buddhist',
    'babylonian', 'sumerian', 'persian', 'christian', 'islamic', 'jewish',
    'chinese', 'japanese', 'aztec', 'mayan', 'shinto'
];

/**
 * Extract text content from HTML element
 */
function extractText(element) {
    if (!element) return '';
    return element.textContent.trim();
}

/**
 * Extract sections from HTML content
 */
function extractSections(doc) {
    const sections = [];
    const mainContent = doc.querySelector('main') || doc.querySelector('body');

    if (!mainContent) return sections;

    const headers = mainContent.querySelectorAll('h2, h3');
    headers.forEach((header, index) => {
        const title = extractText(header);
        if (!title || title.length === 0) return;

        // Get content until next header
        let content = '';
        let element = header.nextElementSibling;

        while (element && !['H2', 'H3'].includes(element.tagName)) {
            if (element.tagName === 'P' || element.tagName === 'UL' || element.tagName === 'OL') {
                content += extractText(element) + '\n\n';
            }
            element = element.nextElementSibling;
        }

        if (content.trim()) {
            sections.push({
                title: title.replace(/^[⚔️🌊🔱🏹💘🔥🌟🦉👑🕊️🐉🦁📜🗝️🦅✝️🕌⭐🪈🏛️⚡🌾]+\s*/, ''),
                content: content.trim(),
                level: header.tagName.toLowerCase()
            });
        }
    });

    return sections;
}

/**
 * Extract relationships from HTML
 */
function extractRelationships(doc) {
    const relationships = {};

    // Look for relationship sections
    const relationshipSection = Array.from(doc.querySelectorAll('h2, h3'))
        .find(h => extractText(h).toLowerCase().includes('relationship') ||
                    extractText(h).toLowerCase().includes('family'));

    if (relationshipSection) {
        let element = relationshipSection.nextElementSibling;

        while (element && !['H2', 'H3'].includes(element.tagName)) {
            if (element.tagName === 'UL') {
                const items = element.querySelectorAll('li');
                items.forEach(item => {
                    const text = extractText(item);
                    const match = text.match(/^([^:]+):\s*(.+)$/);

                    if (match) {
                        const key = match[1].trim().toLowerCase();
                        const value = match[2].trim();

                        // Handle various relationship types
                        if (key.includes('father')) relationships.father = value;
                        else if (key.includes('mother')) relationships.mother = value;
                        else if (key.includes('spouse') || key.includes('wife') || key.includes('husband')) {
                            relationships.spouse = value;
                        }
                        else if (key.includes('son') && !key.includes('sons')) relationships.son = value;
                        else if (key.includes('sons') || key.includes('children')) {
                            relationships.children = value.split(',').map(s => s.trim());
                        }
                        else if (key.includes('allies')) {
                            relationships.allies = value.split(',').map(s => s.trim());
                        }
                        else if (key.includes('enemies')) {
                            relationships.enemies = value.split(',').map(s => s.trim());
                        }
                        else {
                            // Store other relationships
                            if (!relationships.other) relationships.other = [];
                            relationships.other.push({ type: key, value });
                        }
                    }
                });
            }
            element = element.nextElementSibling;
        }
    }

    return relationships;
}

/**
 * Extract quests/adventures from content
 */
function extractQuests(sections) {
    const quests = [];
    const questKeywords = ['quest', 'labor', 'adventure', 'journey', 'trial', 'task', 'deed', 'slaying', 'battle'];

    sections.forEach(section => {
        const title = section.title.toLowerCase();

        // Check if section title suggests quest/adventure
        if (questKeywords.some(kw => title.includes(kw))) {
            quests.push({
                name: section.title,
                description: section.content.substring(0, 300) + (section.content.length > 300 ? '...' : ''),
                category: 'major_adventure'
            });
        }
    });

    return quests;
}

/**
 * Extract weapons and artifacts mentioned
 */
function extractWeapons(doc, content) {
    const weapons = [];
    const weaponKeywords = ['sword', 'spear', 'bow', 'shield', 'armor', 'axe', 'hammer', 'staff', 'weapon'];

    // Search content for weapon mentions
    weaponKeywords.forEach(weapon => {
        const regex = new RegExp(`\\b(\\w+\\s)?${weapon}(\\sof\\s\\w+)?`, 'gi');
        const matches = content.match(regex);

        if (matches) {
            matches.forEach(match => {
                const clean = match.trim();
                if (clean.length > 3 && clean.length < 50 && !weapons.includes(clean)) {
                    weapons.push(clean);
                }
            });
        }
    });

    return weapons.slice(0, 10); // Limit to top 10
}

/**
 * Extract abilities/powers from content
 */
function extractAbilities(sections) {
    const abilities = [];
    const abilitySection = sections.find(s =>
        s.title.toLowerCase().includes('power') ||
        s.title.toLowerCase().includes('abilit') ||
        s.title.toLowerCase().includes('feat')
    );

    if (abilitySection) {
        // Extract bullet points or sentences about abilities
        const lines = abilitySection.content.split('\n');
        lines.forEach(line => {
            if (line.trim().length > 10 && line.trim().length < 200) {
                abilities.push(line.trim());
            }
        });
    }

    return abilities.slice(0, 10); // Limit to 10
}

/**
 * Extract geographical birthplace
 */
function extractBirthplace(sections, relationships) {
    // Look in birth/origin sections
    const birthSection = sections.find(s =>
        s.title.toLowerCase().includes('birth') ||
        s.title.toLowerCase().includes('origin') ||
        s.title.toLowerCase().includes('upbringing')
    );

    if (birthSection) {
        // Look for place names (often capitalized)
        const placeMatch = birthSection.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g);
        if (placeMatch && placeMatch.length > 0) {
            return placeMatch[0];
        }
    }

    return null;
}

/**
 * Generate subtitle from key achievements
 */
function generateSubtitle(heroName, sections, mythology) {
    // Look for famous epithets or descriptions
    const firstSection = sections[0];
    if (!firstSection) return '';

    // Try to extract a descriptive phrase from first paragraph
    const sentences = firstSection.content.split('.');
    if (sentences.length > 0) {
        const firstSentence = sentences[0].trim();

        // Extract description after hero name
        const nameIndex = firstSentence.toLowerCase().indexOf(heroName.toLowerCase());
        if (nameIndex >= 0) {
            const afterName = firstSentence.substring(nameIndex + heroName.length).trim();
            const match = afterName.match(/^[^,]+/);
            if (match) {
                return match[0].replace(/^(was|is|,)\s*/i, '').trim();
            }
        }

        // Try to find descriptive phrases
        const descriptors = ['greatest', 'legendary', 'famous', 'renowned', 'mighty', 'heroic'];
        for (const desc of descriptors) {
            if (firstSentence.toLowerCase().includes(desc)) {
                const match = firstSentence.match(new RegExp(`${desc}[^.]+`, 'i'));
                if (match) return match[0].trim();
            }
        }
    }

    return `Hero of ${mythology.charAt(0).toUpperCase() + mythology.slice(1)} Mythology`;
}

/**
 * Parse hero HTML file
 */
function parseHeroHTML(htmlPath, mythologyId) {
    console.log(`  Parsing: ${path.basename(htmlPath)}`);

    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Extract basic info
        const title = doc.querySelector('title')?.textContent || '';
        const heroName = title.includes('-')
            ? title.split('-').pop().trim()
            : title.split('|')[0].trim();

        // Get display name from header
        const h1 = doc.querySelector('h1');
        const displayName = h1 ? extractText(h1).replace(/^[⚔️🌊🔱🏹💘🔥🌟🦉👑🕊️🐉🦁📜🗝️🦅✝️🕌⭐🪈🏛️⚡🌾]+\s*/, '') : heroName;

        // Extract icon from display name
        const iconMatch = extractText(h1 || {textContent: ''}).match(/^([⚔️🌊🔱🏹💘🔥🌟🦉👑🕊️🐉🦁📜🗝️🦅✝️🕌⭐🪈🏛️⚡🌾])/);
        const icon = iconMatch ? iconMatch[1] : '⚔️';

        // Get subtitle
        const subtitle = doc.querySelector('.subtitle, .hero-subtitle, p.subtitle');
        const shortDescription = subtitle ? extractText(subtitle) : '';

        // Extract all content
        const sections = extractSections(doc);
        const fullContent = sections.map(s => s.content).join('\n\n');

        // Generate hero ID
        const heroId = `${mythologyId}_${heroName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        // Extract structured data
        const relationships = extractRelationships(doc);
        const quests = extractQuests(sections);
        const weapons = extractWeapons(doc, fullContent);
        const abilities = extractAbilities(sections);
        const birthplace = extractBirthplace(sections, relationships);
        const generatedSubtitle = shortDescription || generateSubtitle(heroName, sections, mythologyId);

        // Build hero entity
        const hero = {
            // Core fields (required)
            id: heroId,
            type: 'hero',
            name: heroName,
            icon: icon,
            slug: heroId,
            mythologies: [mythologyId],
            primaryMythology: mythologyId,

            // Descriptions
            shortDescription: generatedSubtitle,
            longDescription: fullContent.substring(0, 1000),

            // Hero-specific fields
            parentage: {
                father: relationships.father || null,
                mother: relationships.mother || null,
                divine: relationships.father?.includes('god') || relationships.mother?.includes('goddess') ||
                        relationships.father?.includes('deity') || relationships.mother?.includes('nymph')
            },

            quests: quests,
            companions: relationships.allies || [],
            weapons: weapons,
            abilities: abilities,

            achievements: quests.map(q => q.name),

            death: extractDeathInfo(sections),
            legacy: extractLegacy(sections),

            // Geographical
            geographical: birthplace ? {
                primaryLocation: {
                    name: birthplace,
                    type: 'city'
                }
            } : null,

            // Linguistic
            linguistic: {
                originalName: displayName,
                transliteration: heroName
            },

            // Relationships
            relatedEntities: {
                deities: extractDeityReferences(fullContent),
                places: extractPlaceReferences(fullContent),
                items: weapons.map(w => ({ id: w.toLowerCase().replace(/\s+/g, '-'), name: w }))
            },

            // Content sections
            contentSections: sections,

            // Metadata
            tags: generateTags(heroName, mythologyId, quests, abilities),
            searchTerms: generateSearchTerms(heroName, displayName, mythologyId),

            visibility: 'public',
            status: 'published',
            migratedFrom: 'legacy-html',
            migrationDate: new Date().toISOString(),
            sourceFile: path.relative(OLD_REPO_BASE, htmlPath)
        };

        return hero;

    } catch (error) {
        console.error(`  Error parsing ${htmlPath}:`, error.message);
        return null;
    }
}

/**
 * Extract death information
 */
function extractDeathInfo(sections) {
    const deathSection = sections.find(s =>
        s.title.toLowerCase().includes('death') ||
        s.title.toLowerCase().includes('demise') ||
        s.title.toLowerCase().includes('end')
    );

    return deathSection ? deathSection.content.substring(0, 500) : null;
}

/**
 * Extract legacy information
 */
function extractLegacy(sections) {
    const legacySection = sections.find(s =>
        s.title.toLowerCase().includes('legacy') ||
        s.title.toLowerCase().includes('impact') ||
        s.title.toLowerCase().includes('influence')
    );

    return legacySection ? legacySection.content.substring(0, 500) : null;
}

/**
 * Extract deity references from content
 */
function extractDeityReferences(content) {
    const deities = [];
    const greekGods = ['Zeus', 'Athena', 'Apollo', 'Hera', 'Poseidon', 'Ares', 'Aphrodite', 'Hephaestus', 'Hermes'];
    const norseGods = ['Odin', 'Thor', 'Loki', 'Freya', 'Freyja'];

    const allGods = [...greekGods, ...norseGods];

    allGods.forEach(god => {
        if (content.includes(god)) {
            deities.push({
                id: god.toLowerCase(),
                name: god,
                relationship: 'mentioned'
            });
        }
    });

    return deities.slice(0, 10);
}

/**
 * Extract place references from content
 */
function extractPlaceReferences(content) {
    const places = [];
    const knownPlaces = ['Troy', 'Athens', 'Sparta', 'Thebes', 'Olympus', 'Delphi', 'Underworld'];

    knownPlaces.forEach(place => {
        if (content.includes(place)) {
            places.push({
                id: place.toLowerCase(),
                name: place,
                relationship: 'visited'
            });
        }
    });

    return places.slice(0, 10);
}

/**
 * Generate tags for hero
 */
function generateTags(heroName, mythology, quests, abilities) {
    const tags = [
        mythology,
        'hero',
        'mythology',
        heroName.toLowerCase()
    ];

    // Add quest-based tags
    quests.forEach(q => {
        if (q.name.toLowerCase().includes('dragon')) tags.push('dragon-slayer');
        if (q.name.toLowerCase().includes('monster')) tags.push('monster-slayer');
        if (q.name.toLowerCase().includes('war')) tags.push('warrior');
    });

    // Add ability-based tags
    if (abilities.some(a => a.toLowerCase().includes('strength'))) tags.push('strong');
    if (abilities.some(a => a.toLowerCase().includes('wisdom'))) tags.push('wise');

    return [...new Set(tags)];
}

/**
 * Generate search terms
 */
function generateSearchTerms(heroName, displayName, mythology) {
    const terms = new Set([
        heroName.toLowerCase(),
        displayName.toLowerCase(),
        mythology,
        'hero',
        ...heroName.toLowerCase().split(/\s+/)
    ]);

    return Array.from(terms);
}

/**
 * Find all hero HTML files for a mythology
 */
function findHeroFiles(mythologyId) {
    const heroesDir = path.join(MYTHOS_DIR, mythologyId, 'heroes');

    if (!fs.existsSync(heroesDir)) {
        return [];
    }

    return fs.readdirSync(heroesDir)
        .filter(file => file.endsWith('.html') && file !== 'index.html')
        .map(file => path.join(heroesDir, file));
}

/**
 * Load existing heroes from Firebase
 */
function loadExistingHeroes() {
    if (!fs.existsSync(CURRENT_HEROES_FILE)) {
        console.warn('No existing heroes file found');
        return [];
    }

    try {
        const data = JSON.parse(fs.readFileSync(CURRENT_HEROES_FILE, 'utf8'));
        return data.items || data || [];
    } catch (error) {
        console.error('Error loading existing heroes:', error.message);
        return [];
    }
}

/**
 * Main migration function
 */
async function main() {
    console.log('=== Hero Migration to Entity Schema v2.0 ===\n');

    // Load existing heroes
    const existingHeroes = loadExistingHeroes();
    const existingIds = new Set(existingHeroes.map(h => h.id));
    console.log(`Existing heroes in Firebase: ${existingHeroes.length}\n`);

    const allHeroes = [];
    const stats = {
        totalProcessed: 0,
        newHeroes: 0,
        existingHeroes: 0,
        errors: 0,
        byMythology: {}
    };

    // Process each mythology
    for (const mythology of MYTHOLOGIES) {
        console.log(`\nScanning ${mythology}...`);
        const heroFiles = findHeroFiles(mythology);

        if (heroFiles.length === 0) {
            console.log(`  No heroes found`);
            continue;
        }

        console.log(`  Found ${heroFiles.length} hero files`);
        stats.byMythology[mythology] = 0;

        for (const heroFile of heroFiles) {
            const hero = parseHeroHTML(heroFile, mythology);

            if (hero) {
                stats.totalProcessed++;

                if (existingIds.has(hero.id)) {
                    console.log(`  ⚠️  Already exists: ${hero.id}`);
                    stats.existingHeroes++;
                } else {
                    console.log(`  ✅ New hero: ${hero.id}`);
                    allHeroes.push(hero);
                    stats.newHeroes++;
                    stats.byMythology[mythology]++;
                }
            } else {
                stats.errors++;
            }
        }
    }

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write new heroes to JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allHeroes, null, 2), 'utf-8');

    console.log('\n=== Migration Complete ===');
    console.log(`Total processed: ${stats.totalProcessed}`);
    console.log(`New heroes: ${stats.newHeroes}`);
    console.log(`Already in Firebase: ${stats.existingHeroes}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\nOutput: ${OUTPUT_FILE}`);

    console.log('\nBy Mythology:');
    Object.entries(stats.byMythology)
        .filter(([_, count]) => count > 0)
        .forEach(([myth, count]) => console.log(`  ${myth}: ${count} new heroes`));

    return { heroes: allHeroes, stats };
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, parseHeroHTML };
