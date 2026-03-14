#!/usr/bin/env node
/**
 * Bulk Enrichment Script for Enhanced Display
 *
 * This script enriches assets with content required for the enhanced section renderers,
 * ensuring each asset has at least 3+ pages of displayable content.
 *
 * Target fields for enrichment:
 * - cultural (worshipPractices, festivals, modernLegacy)
 * - cross_cultural_parallels (parallels in other mythologies)
 * - associations (items, concepts, symbols)
 * - quests/feats (for heroes)
 * - companions (allies and helpers)
 * - extendedContent (additional detailed sections)
 * - keyMyths (if missing)
 *
 * Usage:
 *   node scripts/bulk-enrich-for-display.js [options]
 *
 * Options:
 *   --dry-run          Preview changes without saving
 *   --type=<type>      Only enrich specific entity type (deities, heroes, etc.)
 *   --limit=<n>        Limit number of entities to process
 *   --sparse-only      Only process entities with < 5 content sections
 *   --mythology=<myth> Only process specific mythology
 */

const fs = require('fs');
const path = require('path');

// Load .env file if present (simple implementation without dotenv package)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            if (key && value && !process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// Parse command line arguments first (need for API key)
const args = process.argv.slice(2);

// Gemini API configuration - Get a new key from https://aistudio.google.com/apikey
const API_KEY_ARG = args.find(a => a.startsWith('--api-key='))?.split('=')[1];
const GEMINI_API_KEY = API_KEY_ARG || process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

if (!GEMINI_API_KEY) {
    console.error('ERROR: Gemini API key not provided');
    console.error('Option 1: node script.js --api-key=YOUR_KEY_HERE');
    console.error('Option 2: set GEMINI_API_KEY=YOUR_KEY_HERE (Windows)');
    console.error('Get a key from: https://aistudio.google.com/apikey');
    process.exit(1);
}
const DRY_RUN = args.includes('--dry-run');
const SPARSE_ONLY = args.includes('--sparse-only');
const TYPE_FILTER = args.find(a => a.startsWith('--type='))?.split('=')[1];
const MYTHOLOGY_FILTER = args.find(a => a.startsWith('--mythology='))?.split('=')[1];
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');

// Asset directory
const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Collection types
const COLLECTION_TYPES = [
    'deities', 'heroes', 'creatures', 'items', 'places',
    'concepts', 'cosmology', 'archetypes', 'events',
    'rituals', 'texts', 'symbols', 'herbs', 'magic'
];

// Statistics
const stats = {
    scanned: 0,
    sparse: 0,
    enriched: 0,
    errors: 0,
    skipped: 0
};

/**
 * Call Gemini API
 */
async function callGemini(prompt, maxTokens = 4096) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: maxTokens,
                    topP: 0.95
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
        console.error('  Gemini API call failed:', error.message);
        return null;
    }
}

/**
 * Parse JSON from Gemini response
 */
function parseGeminiJSON(text) {
    if (!text) return null;

    let jsonText = text.trim();

    // Extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
    } else {
        jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    }

    // Find JSON structure
    if (!jsonText.startsWith('[') && !jsonText.startsWith('{')) {
        const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
        const objMatch = jsonText.match(/(\{[\s\S]*\})/);
        if (arrayMatch) jsonText = arrayMatch[1];
        else if (objMatch) jsonText = objMatch[1];
    }

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('  Failed to parse JSON:', error.message);
        return null;
    }
}

/**
 * Count displayable sections in an entity
 */
function countSections(entity) {
    let count = 0;

    // Core sections
    if (entity.description) count++;
    if (entity.keyMyths?.length) count++;
    if (entity.extendedContent?.length) count += entity.extendedContent.length;
    if (entity.symbolism) count++;
    if (entity.cultural) count++;
    if (entity.cross_cultural_parallels?.length) count++;
    if (entity.associations?.length) count++;
    if (entity.quests?.length) count++;
    if (entity.feats?.length) count++;
    if (entity.companions?.length) count++;
    if (entity.relatedEntities && Object.keys(entity.relatedEntities).length) count++;
    if (entity.sources?.length) count++;
    if (entity.family) count++;
    if (entity.worship || entity.cultCenters?.length) count++;

    return count;
}

/**
 * Generate cultural section
 */
async function generateCultural(entity) {
    const prompt = `Generate a cultural section for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no explanation) in this exact format:
{
    "worshipPractices": [
        {
            "name": "Practice name",
            "description": "Description of worship practice (2-3 sentences)"
        }
    ],
    "festivals": [
        {
            "name": "Festival name",
            "timing": "When it occurs",
            "description": "What happens during the festival"
        }
    ],
    "modernLegacy": "How this entity continues to influence modern culture, art, literature, or popular culture (2-3 sentences)"
}

Entity: ${entity.name}
Type: ${entity.type}
Mythology: ${entity.mythology || 'universal'}
Description: ${(entity.description || '').substring(0, 300)}`;

    const response = await callGemini(prompt, 2048);
    return parseGeminiJSON(response);
}

/**
 * Generate cross-cultural parallels
 */
async function generateCrossCulturalParallels(entity) {
    const prompt = `Generate 3-5 cross-cultural parallels for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no explanation) in this exact format:
[
    {
        "mythology": "Mythology name (e.g., Greek, Norse, Egyptian)",
        "entity": "Parallel entity name",
        "category": "deities|heroes|creatures|items|places",
        "similarity": "Brief explanation of what makes them similar (1-2 sentences)"
    }
]

Find parallels in OTHER mythologies (not ${entity.mythology}).

Entity: ${entity.name}
Type: ${entity.type}
Mythology: ${entity.mythology || 'universal'}
Description: ${(entity.description || '').substring(0, 300)}`;

    const response = await callGemini(prompt, 1024);
    return parseGeminiJSON(response);
}

/**
 * Generate associations
 */
async function generateAssociations(entity) {
    const prompt = `Generate symbolic associations for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no explanation) in this exact format:
[
    {
        "type": "animal|plant|element|color|number|celestial|concept",
        "name": "Association name (e.g., 'Eagle', 'Oak', 'Thunder')",
        "significance": "Why this is associated with the entity (1 sentence)"
    }
]

Generate 5-8 varied associations covering different types.

Entity: ${entity.name}
Type: ${entity.type}
Mythology: ${entity.mythology || 'universal'}
Description: ${(entity.description || '').substring(0, 300)}`;

    const response = await callGemini(prompt, 1024);
    return parseGeminiJSON(response);
}

/**
 * Generate quests/feats for heroes
 */
async function generateQuestsOrFeats(entity) {
    const isHero = entity.type === 'hero' || entity.type === 'heroes';
    const prompt = `Generate ${isHero ? 'quests and legendary deeds' : 'notable achievements or events'} for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no explanation) in this exact format:
{
    "quests": [
        {
            "title": "Quest or adventure name",
            "description": "What happened in this quest (2-3 sentences)",
            "companions": ["Companion 1", "Companion 2"],
            "outcome": "How it ended"
        }
    ],
    "feats": [
        {
            "title": "Feat or deed name",
            "description": "What was accomplished (2-3 sentences)",
            "significance": "Why this was important"
        }
    ]
}

Generate 3-5 quests and 3-5 feats based on known myths.

Entity: ${entity.name}
Type: ${entity.type}
Mythology: ${entity.mythology || 'universal'}
Description: ${(entity.description || '').substring(0, 300)}`;

    const response = await callGemini(prompt, 2048);
    return parseGeminiJSON(response);
}

/**
 * Generate companions/allies
 */
async function generateCompanions(entity) {
    const prompt = `Generate companions, allies, or associated figures for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no explanation) in this exact format:
[
    {
        "name": "Companion name",
        "relationship": "ally|companion|servant|mount|animal|helper|student|protector",
        "description": "Brief description of relationship (1-2 sentences)",
        "category": "deities|heroes|creatures|items"
    }
]

Generate 3-6 companions or allies based on mythology.

Entity: ${entity.name}
Type: ${entity.type}
Mythology: ${entity.mythology || 'universal'}
Description: ${(entity.description || '').substring(0, 300)}`;

    const response = await callGemini(prompt, 1024);
    return parseGeminiJSON(response);
}

/**
 * Generate extended content sections
 */
async function generateExtendedContent(entity) {
    const typePrompts = {
        deity: 'Origins & Birth, Worship & Temples, Iconography & Representation, Role in Cosmic Order',
        hero: 'Early Life & Training, Greatest Challenges, Legacy & Influence, Death & Afterlife',
        creature: 'Origin & Nature, Encounters in Myth, Symbolism & Meaning, Cultural Significance',
        item: 'Creation & Forging, Powers & Properties, Notable Wielders, Symbolism',
        place: 'Geography & Features, Sacred Significance, Events & Stories, Modern Connections'
    };

    const suggestedTopics = typePrompts[entity.type] || 'Background, Significance, Stories, Legacy';

    const prompt = `Generate 4-5 detailed content sections for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no explanation) in this exact format:
[
    {
        "title": "Section Title",
        "content": "Detailed content with 3-4 paragraphs. Include specific details, stories, and scholarly insights."
    }
]

Suggested topics: ${suggestedTopics}

Each section should be substantive (200-300 words) with:
- Specific mythological details
- References to original sources when possible
- Cultural context and significance

Entity: ${entity.name}
Type: ${entity.type}
Mythology: ${entity.mythology || 'universal'}
Current description: ${(entity.description || '').substring(0, 400)}`;

    const response = await callGemini(prompt, 4096);
    return parseGeminiJSON(response);
}

/**
 * Determine which fields need enrichment
 */
function getFieldsToEnrich(entity) {
    const fields = [];

    // Check each target field
    if (!entity.cultural) fields.push('cultural');
    if (!entity.cross_cultural_parallels?.length) fields.push('cross_cultural_parallels');
    if (!entity.associations?.length) fields.push('associations');

    // Heroes specifically get quests/feats
    const isHeroType = entity.type === 'hero' || entity.type === 'heroes';
    if (isHeroType && (!entity.quests?.length || !entity.feats?.length)) {
        fields.push('quests_feats');
    }

    if (!entity.companions?.length) fields.push('companions');
    if (!entity.extendedContent?.length || entity.extendedContent.length < 3) {
        fields.push('extendedContent');
    }

    return fields;
}

/**
 * Enrich a single entity
 */
async function enrichEntity(entity, filePath) {
    const sectionCount = countSections(entity);

    // Skip if already content-rich (unless explicitly processing all)
    if (SPARSE_ONLY && sectionCount >= 5) {
        return { enriched: false, reason: 'Already content-rich' };
    }

    const fieldsToEnrich = getFieldsToEnrich(entity);
    if (fieldsToEnrich.length === 0) {
        return { enriched: false, reason: 'No fields need enrichment' };
    }

    console.log(`  Current sections: ${sectionCount}, Fields to enrich: ${fieldsToEnrich.join(', ')}`);

    const enrichments = {};

    // Generate each missing field
    for (const field of fieldsToEnrich) {
        console.log(`  Generating ${field}...`);

        let result = null;
        switch (field) {
            case 'cultural':
                result = await generateCultural(entity);
                break;
            case 'cross_cultural_parallels':
                result = await generateCrossCulturalParallels(entity);
                break;
            case 'associations':
                result = await generateAssociations(entity);
                break;
            case 'quests_feats':
                result = await generateQuestsOrFeats(entity);
                if (result) {
                    if (result.quests?.length) enrichments.quests = result.quests;
                    if (result.feats?.length) enrichments.feats = result.feats;
                    result = null; // Don't add as-is
                }
                break;
            case 'companions':
                result = await generateCompanions(entity);
                break;
            case 'extendedContent':
                result = await generateExtendedContent(entity);
                break;
        }

        if (result) {
            enrichments[field] = result;
            console.log(`    ✓ Generated ${field}`);
        } else if (field !== 'quests_feats') {
            console.log(`    ✗ Failed to generate ${field}`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 600));
    }

    if (Object.keys(enrichments).length === 0) {
        return { enriched: false, reason: 'No enrichments generated' };
    }

    // Merge enrichments
    const enrichedEntity = {
        ...entity,
        ...enrichments,
        enrichedAt: new Date().toISOString(),
        enrichedBy: 'bulk-enrich-for-display',
        _enrichmentVersion: 2
    };

    // Save if not dry run
    if (!DRY_RUN) {
        fs.writeFileSync(filePath, JSON.stringify(enrichedEntity, null, 2));
    }

    const newSectionCount = countSections(enrichedEntity);
    return {
        enriched: true,
        fields: Object.keys(enrichments),
        sectionsBefore: sectionCount,
        sectionsAfter: newSectionCount,
        dryRun: DRY_RUN
    };
}

/**
 * Process all entities in a collection
 */
async function processCollection(collectionName) {
    const collectionDir = path.join(ASSETS_DIR, collectionName);
    if (!fs.existsSync(collectionDir)) return;

    console.log(`\n📂 Processing ${collectionName}...`);

    const files = fs.readdirSync(collectionDir)
        .filter(f => f.endsWith('.json') && !f.startsWith('_'));

    let processed = 0;

    for (const file of files) {
        if (LIMIT > 0 && stats.enriched >= LIMIT) break;

        const filePath = path.join(collectionDir, file);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const entity = JSON.parse(content);

            stats.scanned++;

            // Apply filters
            if (MYTHOLOGY_FILTER && entity.mythology !== MYTHOLOGY_FILTER) continue;
            if (!entity.name || !entity.id) continue;

            const sectionCount = countSections(entity);
            if (SPARSE_ONLY && sectionCount >= 5) {
                stats.skipped++;
                continue;
            }

            stats.sparse++;
            console.log(`\n🔧 Enriching: ${entity.name} (${entity.mythology || 'unknown'})`);

            const result = await enrichEntity(entity, filePath);

            if (result.enriched) {
                stats.enriched++;
                console.log(`  ✓ Enriched: ${result.sectionsBefore} → ${result.sectionsAfter} sections`);
                console.log(`    Fields: ${result.fields.join(', ')}`);
            } else {
                console.log(`  ⏭ Skipped: ${result.reason}`);
            }

            processed++;

        } catch (error) {
            console.error(`  Error processing ${file}:`, error.message);
            stats.errors++;
        }
    }

    console.log(`  Processed ${processed} entities in ${collectionName}`);
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(70));
    console.log('BULK ENRICHMENT FOR ENHANCED DISPLAY');
    console.log('='.repeat(70));
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE (saving changes)'}`);
    console.log(`Sparse Only: ${SPARSE_ONLY}`);
    console.log(`Limit: ${LIMIT}`);
    if (TYPE_FILTER) console.log(`Type Filter: ${TYPE_FILTER}`);
    if (MYTHOLOGY_FILTER) console.log(`Mythology Filter: ${MYTHOLOGY_FILTER}`);
    console.log('');

    const collections = TYPE_FILTER ? [TYPE_FILTER] : COLLECTION_TYPES;

    for (const collection of collections) {
        if (LIMIT > 0 && stats.enriched >= LIMIT) break;
        await processCollection(collection);
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('ENRICHMENT SUMMARY');
    console.log('='.repeat(70));
    console.log(`Scanned:   ${stats.scanned}`);
    console.log(`Sparse:    ${stats.sparse}`);
    console.log(`Enriched:  ${stats.enriched}`);
    console.log(`Skipped:   ${stats.skipped}`);
    console.log(`Errors:    ${stats.errors}`);
    console.log('='.repeat(70));

    if (DRY_RUN) {
        console.log('\n[DRY RUN] No changes were saved. Run without --dry-run to apply changes.');
    }
}

// Run
main().catch(console.error);
