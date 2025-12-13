#!/usr/bin/env node

/**
 * Universal Content Parser for Firebase Migration
 * Eyes of Azrael - All Content Types
 *
 * This script parses ALL content types with a standardized schema:
 * - Deities (DONE ✅)
 * - Heroes
 * - Creatures/Beings
 * - Places/Cosmology/Realms
 * - Items/Artifacts
 * - Herbs
 * - Texts/Corpus
 * - Symbols
 * - Rituals
 * - Magic/Concepts
 * - Events/Myths
 *
 * Usage:
 *   node parse-universal-content.js --type=heroes
 *   node parse-universal-content.js --type=creatures --mythology=greek
 *   node parse-universal-content.js --all
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configuration
const BASE_DIR = path.join(__dirname, '../..');
const MYTHOS_DIR = path.join(BASE_DIR, 'mythos');
const OUTPUT_DIR = path.join(__dirname, '../parsed_data');

// Content type configurations
const CONTENT_TYPE_CONFIGS = {
    heroes: {
        collection: 'heroes',
        pathPattern: /heroes\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            titles: 'array',
            attributes: 'array',
            feats: 'array',
            weapons: 'array',
            companions: 'array',
            quests: 'array',
            relationships: 'object',
            primarySources: 'array',
            metadata: 'object'
        }
    },
    creatures: {
        collection: 'creatures',
        pathPattern: /creatures\/.*\.html$|beings\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            type: 'string', // dragon, beast, spirit, etc.
            attributes: 'array',
            abilities: 'array',
            habitats: 'array',
            weaknesses: 'array',
            relationships: 'object',
            primarySources: 'array',
            metadata: 'object'
        }
    },
    cosmology: {
        collection: 'cosmology',
        pathPattern: /cosmology\/.*\.html$|realms\/.*\.html$|places\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            type: 'string', // realm, place, concept
            layers: 'array',
            inhabitants: 'array',
            features: 'array',
            connections: 'array',
            primarySources: 'array',
            metadata: 'object'
        }
    },
    items: {
        collection: 'items',
        pathPattern: /items\/.*\.html$|artifacts\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            type: 'string', // weapon, artifact, treasure
            powers: 'array',
            owners: 'array',
            materials: 'array',
            primarySources: 'array',
            metadata: 'object'
        }
    },
    herbs: {
        collection: 'herbs',
        pathPattern: /herbs\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            uses: 'array',
            properties: 'array',
            rituals: 'array',
            preparation: 'array',
            primarySources: 'array',
            metadata: 'object'
        }
    },
    texts: {
        collection: 'texts',
        pathPattern: /texts\/.*\.html$/,
        schema: {
            id: 'string',
            title: 'string',
            displayTitle: 'string',
            mythology: 'string',
            description: 'string',
            author: 'string',
            period: 'string',
            type: 'string', // scripture, epic, hymn
            themes: 'array',
            chapters: 'array',
            translations: 'array',
            metadata: 'object'
        }
    },
    rituals: {
        collection: 'rituals',
        pathPattern: /rituals\/.*\.html$|magic\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            purpose: 'array',
            steps: 'array',
            tools: 'array',
            timing: 'string',
            participants: 'array',
            primarySources: 'array',
            metadata: 'object'
        }
    },
    concepts: {
        collection: 'concepts',
        pathPattern: /concepts\/.*\.html$|events\/.*\.html$|myths\/.*\.html$/,
        schema: {
            id: 'string',
            name: 'string',
            displayName: 'string',
            mythology: 'string',
            description: 'string',
            type: 'string', // concept, event, myth
            participants: 'array',
            significance: 'array',
            relatedConcepts: 'array',
            primarySources: 'array',
            metadata: 'object'
        }
    }
};

/**
 * Extract common metadata from any HTML file
 */
function extractCommonMetadata(doc, filePath, mythology) {
    // Extract title
    const titleElement = doc.querySelector('title');
    const titleText = titleElement ? titleElement.textContent.trim() : '';

    // Parse title (usually "Mythology - Name" format)
    const titleParts = titleText.split('-').map(p => p.trim());
    const name = titleParts.length > 1 ? titleParts[1] : titleParts[0];

    // Extract meta description
    const metaDesc = doc.querySelector('meta[name="description"]');
    const description = metaDesc ? metaDesc.getAttribute('content').trim() : '';

    // Extract filename for ID
    const filename = path.basename(filePath, '.html');
    const id = `${mythology}_${filename}`.toLowerCase().replace(/\s+/g, '_');

    // Extract display name with icon if present
    const h1 = doc.querySelector('h1');
    const displayName = h1 ? h1.textContent.trim() : name;

    return {
        id,
        name,
        displayName,
        mythology,
        description,
        filename
    };
}

/**
 * Extract description from various HTML structures
 */
function extractDescription(doc) {
    // Try multiple selectors for description
    const selectors = [
        '.hero-description',
        '.hero-section p',
        '.deity-header p',
        '.description',
        '.subtitle',
        '.intro-text',
        'main > p:first-of-type',
        '.content > p:first-of-type'
    ];

    for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
            return element.textContent.trim();
        }
    }

    return '';
}

/**
 * Extract list items from various HTML structures
 */
function extractListItems(doc, headers) {
    const items = [];

    // Find sections by header text
    const allSections = doc.querySelectorAll('.glass-card, section, .card, .attribute-card, .content-section');

    for (const section of allSections) {
        const header = section.querySelector('h2, h3, .section-header, .card-header');
        if (!header) continue;

        const headerText = header.textContent.toLowerCase().trim();

        // Check if this section matches any of our target headers
        const matchedHeader = headers.find(h => headerText.includes(h.toLowerCase()));
        if (!matchedHeader) continue;

        // Extract list items
        const listItems = section.querySelectorAll('li, .badge, .meta-badge, .attribute-value');
        listItems.forEach(item => {
            const text = item.textContent.trim();
            if (text && text.length > 0 && text.length < 200) {
                items.push(text);
            }
        });

        // Also check for comma-separated values in attribute-value divs
        const attributeValues = section.querySelectorAll('.attribute-value');
        attributeValues.forEach(attr => {
            const text = attr.textContent.trim();
            const splitItems = text.split(',').map(t => t.trim()).filter(t => t.length > 0);
            items.push(...splitItems);
        });
    }

    return [...new Set(items)]; // Remove duplicates
}

/**
 * Extract relationships (family, associations, etc.)
 */
function extractRelationships(doc) {
    const relationships = {};

    const relationshipSection = Array.from(doc.querySelectorAll('.glass-card, section'))
        .find(section => {
            const header = section.querySelector('h2, h3');
            return header && header.textContent.toLowerCase().includes('relationship');
        });

    if (relationshipSection) {
        const badges = relationshipSection.querySelectorAll('.badge, li');
        badges.forEach(badge => {
            const text = badge.textContent.trim();
            const match = text.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const [, key, value] = match;
                relationships[key.toLowerCase()] = value.split(',').map(v => v.trim());
            }
        });
    }

    return relationships;
}

/**
 * Extract primary source references
 */
function extractPrimarySources(doc) {
    const sources = [];

    // Look for corpus references
    const corpusRefs = doc.querySelectorAll('.corpus-ref, .source-ref, .reference');
    corpusRefs.forEach(ref => {
        const title = ref.querySelector('.source-title, .book-title')?.textContent.trim();
        const location = ref.querySelector('.source-location, .passage')?.textContent.trim();

        if (title) {
            sources.push({
                title,
                location: location || '',
                url: ref.getAttribute('href') || ''
            });
        }
    });

    return sources;
}

/**
 * Parse hero content
 */
function parseHero(doc, filePath, mythology) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    return {
        ...common,
        description,
        titles: extractListItems(doc, ['title', 'epithet', 'role']),
        attributes: extractListItems(doc, ['attribute', 'trait', 'characteristic']),
        feats: extractListItems(doc, ['feat', 'achievement', 'accomplishment', 'deed']),
        weapons: extractListItems(doc, ['weapon', 'equipment', 'arsenal']),
        companions: extractListItems(doc, ['companion', 'ally', 'follower']),
        quests: extractListItems(doc, ['quest', 'journey', 'adventure', 'labor']),
        relationships: extractRelationships(doc),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse creature content
 */
function parseCreature(doc, filePath, mythology) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    // Detect creature type from content
    const contentText = doc.body.textContent.toLowerCase();
    let type = 'creature';
    if (contentText.includes('dragon')) type = 'dragon';
    else if (contentText.includes('spirit')) type = 'spirit';
    else if (contentText.includes('beast')) type = 'beast';
    else if (contentText.includes('monster')) type = 'monster';

    return {
        ...common,
        description,
        type,
        attributes: extractListItems(doc, ['attribute', 'trait', 'feature', 'appearance']),
        abilities: extractListItems(doc, ['ability', 'power', 'skill']),
        habitats: extractListItems(doc, ['habitat', 'location', 'dwelling']),
        weaknesses: extractListItems(doc, ['weakness', 'vulnerability']),
        relationships: extractRelationships(doc),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse cosmology/realm/place content
 */
function parseCosmology(doc, filePath, mythology) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    // Detect type
    const filename = path.basename(filePath).toLowerCase();
    let type = 'realm';
    if (filename.includes('creation') || filename.includes('afterlife')) type = 'concept';
    else if (filename.includes('palace') || filename.includes('temple')) type = 'place';

    return {
        ...common,
        description,
        type,
        layers: extractListItems(doc, ['layer', 'level', 'plane', 'world']),
        inhabitants: extractListItems(doc, ['inhabitant', 'resident', 'being', 'deity']),
        features: extractListItems(doc, ['feature', 'characteristic', 'landmark']),
        connections: extractListItems(doc, ['connection', 'portal', 'gateway', 'path']),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse herb content
 */
function parseHerb(doc, filePath, mythology) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    return {
        ...common,
        description,
        uses: extractListItems(doc, ['use', 'application', 'purpose', 'benefit']),
        properties: extractListItems(doc, ['property', 'quality', 'characteristic', 'attribute']),
        rituals: extractListItems(doc, ['ritual', 'ceremony', 'practice']),
        preparation: extractListItems(doc, ['preparation', 'method', 'recipe']),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse ritual content
 */
function parseRitual(doc, filePath, mythology) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    return {
        ...common,
        description,
        purpose: extractListItems(doc, ['purpose', 'goal', 'intent']),
        steps: extractListItems(doc, ['step', 'instruction', 'procedure']),
        tools: extractListItems(doc, ['tool', 'implement', 'item', 'material']),
        timing: extractListItems(doc, ['timing', 'time', 'season', 'date'])[0] || '',
        participants: extractListItems(doc, ['participant', 'practitioner', 'celebrant']),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse concept/event/myth content
 */
function parseConcept(doc, filePath, mythology) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    // Detect type from path
    let type = 'concept';
    if (filePath.includes('/events/')) type = 'event';
    else if (filePath.includes('/myths/')) type = 'myth';

    return {
        ...common,
        description,
        type,
        participants: extractListItems(doc, ['participant', 'figure', 'character']),
        significance: extractListItems(doc, ['significance', 'meaning', 'importance', 'theme']),
        relatedConcepts: extractListItems(doc, ['related', 'connection', 'association']),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse generic content (fallback)
 */
function parseGeneric(doc, filePath, mythology, contentType) {
    const common = extractCommonMetadata(doc, filePath, mythology);
    const description = extractDescription(doc) || common.description;

    return {
        ...common,
        description,
        contentType,
        attributes: extractListItems(doc, ['attribute', 'feature', 'characteristic']),
        relationships: extractRelationships(doc),
        primarySources: extractPrimarySources(doc),
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            source: 'html_parser',
            verified: false,
            sourceFile: path.relative(BASE_DIR, filePath).replace(/\\/g, '/')
        }
    };
}

/**
 * Parse content file based on type
 */
function parseContentFile(filePath, contentType, mythology) {
    try {
        const html = fs.readFileSync(filePath, 'utf-8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Choose parser based on content type
        switch (contentType) {
            case 'heroes':
            case 'figures':
                return parseHero(doc, filePath, mythology);
            case 'creatures':
            case 'beings':
            case 'spirits':
                return parseCreature(doc, filePath, mythology);
            case 'cosmology':
            case 'realms':
            case 'places':
                return parseCosmology(doc, filePath, mythology);
            case 'herbs':
                return parseHerb(doc, filePath, mythology);
            case 'rituals':
            case 'magic':
                return parseRitual(doc, filePath, mythology);
            case 'concepts':
            case 'events':
            case 'myths':
                return parseConcept(doc, filePath, mythology);
            default:
                return parseGeneric(doc, filePath, mythology, contentType);
        }
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Parse all content of a specific type
 */
async function parseContentType(contentType, mythologyFilter = null) {
    console.log(`\n🔄 Parsing ${contentType}...`);

    // Load audit report to get file list
    const auditReportPath = path.join(__dirname, '../audit_results/content_audit_report.json');
    if (!fs.existsSync(auditReportPath)) {
        console.error('❌ Audit report not found. Run audit-all-content.js first.');
        return;
    }

    const auditReport = JSON.parse(fs.readFileSync(auditReportPath, 'utf-8'));
    const contentTypeData = auditReport.byContentType[contentType];

    if (!contentTypeData) {
        console.error(`❌ Content type '${contentType}' not found in audit report.`);
        return;
    }

    console.log(`📁 Found ${contentTypeData.count} ${contentType} files`);

    // Filter by mythology if specified
    let filesToParse = contentTypeData.files;
    if (mythologyFilter) {
        filesToParse = filesToParse.filter(f => f.includes(`/${mythologyFilter}/`));
        console.log(`   Filtered to ${filesToParse.length} files for ${mythologyFilter}`);
    }

    // Parse each file
    const parsed = [];
    let successCount = 0;
    let failCount = 0;

    for (const fileRelPath of filesToParse) {
        const filePath = path.join(BASE_DIR, fileRelPath);
        const mythology = detectMythology(fileRelPath);

        const result = parseContentFile(filePath, contentType, mythology);
        if (result) {
            parsed.push(result);
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log(`✅ Parsed ${successCount} ${contentType}`);
    if (failCount > 0) {
        console.log(`⚠️  Failed to parse ${failCount} files`);
    }

    // Save results
    const outputPath = path.join(OUTPUT_DIR, `${contentType}_parsed.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
        contentType,
        count: parsed.length,
        parsedAt: new Date().toISOString(),
        items: parsed
    }, null, 2));

    console.log(`💾 Saved to: ${outputPath}`);

    return parsed;
}

/**
 * Detect mythology from file path
 */
function detectMythology(filePath) {
    const mythologies = [
        'greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist',
        'chinese', 'japanese', 'celtic', 'aztec', 'mayan', 'babylonian',
        'sumerian', 'persian', 'christian', 'islamic', 'jewish',
        'yoruba', 'native_american', 'tarot', 'apocryphal'
    ];

    for (const mythology of mythologies) {
        if (filePath.includes(`/${mythology}/`)) {
            return mythology;
        }
    }

    return 'unknown';
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const typeArg = args.find(arg => arg.startsWith('--type='));
    const mythologyArg = args.find(arg => arg.startsWith('--mythology='));
    const allFlag = args.includes('--all');

    const contentType = typeArg ? typeArg.split('=')[1] : null;
    const mythology = mythologyArg ? mythologyArg.split('=')[1] : null;

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (allFlag) {
        // Parse all content types
        const types = ['heroes', 'creatures', 'beings', 'cosmology', 'realms', 'places',
                      'herbs', 'rituals', 'magic', 'concepts', 'events', 'myths'];

        console.log('🚀 Parsing ALL content types...\n');

        for (const type of types) {
            await parseContentType(type, mythology);
        }

        console.log('\n✨ All content types parsed!');

    } else if (contentType) {
        await parseContentType(contentType, mythology);

    } else {
        console.log('Usage:');
        console.log('  node parse-universal-content.js --type=heroes');
        console.log('  node parse-universal-content.js --type=creatures --mythology=greek');
        console.log('  node parse-universal-content.js --all');
    }
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}

module.exports = {
    parseContentFile,
    parseContentType
};
