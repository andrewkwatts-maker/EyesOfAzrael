/**
 * Asset Metadata Enrichment Script using Gemini AI
 *
 * Scans assets and enriches them with missing fields required for the
 * enhanced schema section renderer:
 * - keyMyths (array of myths with title, description, source)
 * - extendedContent (array of titled content sections)
 * - sources (array of bibliography entries)
 * - corpusSearch (canonical and variant search terms)
 * - symbolism (extended meaning/symbolism text)
 * - relatedConcepts (array of concept IDs)
 *
 * Usage: node scripts/enrich-assets-gemini.js [--dry-run] [--type=<type>] [--limit=<n>]
 */

const fs = require('fs');
const path = require('path');

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyCrDboksSpF_gOQ26U0H5zDhpRXqSlc05g';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const TYPE_FILTER = args.find(a => a.startsWith('--type='))?.split('=')[1];
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0');

// Asset directories
const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Required fields for enhanced rendering
const REQUIRED_FIELDS = [
    'keyMyths',
    'sources',
    'corpusSearch'
];

// Optional enhancement fields
const ENHANCEMENT_FIELDS = [
    'extendedContent',
    'symbolism',
    'relatedConcepts'
];

// Collection type mappings
const COLLECTION_TYPES = {
    'archetypes': 'archetype',
    'concepts': 'concept',
    'cosmology': 'cosmology',
    'creatures': 'creature',
    'deities': 'deity',
    'events': 'event',
    'heroes': 'hero',
    'items': 'item',
    'mythologies': 'mythology',
    'places': 'place',
    'rituals': 'ritual',
    'symbols': 'symbol',
    'texts': 'text',
    'herbs': 'herb'
};

/**
 * Call Gemini API to generate content
 */
async function callGemini(prompt, maxTokens = 2048) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
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
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text;
    } catch (error) {
        console.error('Gemini API call failed:', error.message);
        return null;
    }
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
function parseGeminiJSON(text) {
    if (!text) return null;

    let jsonText = text.trim();

    // Try to extract JSON from markdown code block (with closing ```)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
    } else {
        // Handle unclosed code block - remove opening ```json
        jsonText = jsonText.replace(/^```(?:json)?\s*/i, '');
        // Also remove trailing ``` if present without matching opening
        jsonText = jsonText.replace(/```\s*$/i, '');
    }

    // Try to find JSON structure (array or object) if still not valid
    if (!jsonText.startsWith('[') && !jsonText.startsWith('{')) {
        const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
        const objMatch = jsonText.match(/(\{[\s\S]*\})/);
        if (arrayMatch) jsonText = arrayMatch[1];
        else if (objMatch) jsonText = objMatch[1];
    }

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Failed to parse JSON:', error.message);
        console.error('Raw text:', jsonText.substring(0, 200));
        return null;
    }
}

/**
 * Generate keyMyths for an entity
 */
async function generateKeyMyths(entity) {
    const prompt = `Generate 3-5 key myths or legends associated with "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
    {
        "title": "Myth title",
        "description": "Brief description of the myth (2-3 sentences)",
        "source": "Primary source text or tradition"
    }
]

Entity info:
- Name: ${entity.name}
- Type: ${entity.type}
- Mythology: ${entity.mythology || 'universal'}
- Description: ${entity.description || entity.shortDescription || 'Not provided'}`;

    const response = await callGemini(prompt, 1024);
    return parseGeminiJSON(response);
}

/**
 * Generate sources/bibliography for an entity
 */
async function generateSources(entity) {
    const prompt = `Generate 3-5 academic or primary sources for "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
    {
        "title": "Source title (book, text, or scholarly work)",
        "author": "Author name or 'Traditional' for ancient texts"
    }
]

Focus on:
1. Primary ancient sources (e.g., Homer, Vedas, Eddas)
2. Key scholarly works
3. Well-known translations or compilations

Entity info:
- Name: ${entity.name}
- Type: ${entity.type}
- Mythology: ${entity.mythology || 'universal'}`;

    const response = await callGemini(prompt, 512);
    return parseGeminiJSON(response);
}

/**
 * Generate corpus search terms for an entity
 */
async function generateCorpusSearch(entity) {
    const prompt = `Generate search terms for finding "${entity.name}" in ancient texts and mythological sources.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
    "canonical": ["primary name", "most common spelling"],
    "variants": ["alternate spelling 1", "alternate name", "epithet", "translation"]
}

Include:
- Original language spellings (transliterated)
- Common epithets or titles
- Alternate names from different traditions
- Related search terms

Entity info:
- Name: ${entity.name}
- Type: ${entity.type}
- Mythology: ${entity.mythology || 'universal'}`;

    const response = await callGemini(prompt, 512);
    return parseGeminiJSON(response);
}

/**
 * Generate extended content sections for an entity
 */
async function generateExtendedContent(entity) {
    const prompt = `Generate 2-3 detailed content sections about "${entity.name}" from ${entity.mythology || 'world'} mythology.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
    {
        "title": "Section Title",
        "content": "Detailed content (3-5 paragraphs)"
    }
]

Suggested sections based on type "${entity.type}":
- For deities: Origins, Worship & Cult, Iconography
- For heroes: Early Life, Great Deeds, Legacy
- For places: Geography, Significance, Associated Events
- For items: Origins, Powers, Historical Appearances
- For rituals: Purpose, Procedure, Symbolism
- For concepts: Definition, Cultural Context, Related Practices

Entity info:
- Name: ${entity.name}
- Type: ${entity.type}
- Mythology: ${entity.mythology || 'universal'}
- Current description: ${entity.description?.substring(0, 300) || 'Not provided'}`;

    const response = await callGemini(prompt, 2048);
    return parseGeminiJSON(response);
}

/**
 * Check which fields are missing from an entity
 */
function getMissingFields(entity) {
    const missing = {
        required: [],
        optional: []
    };

    for (const field of REQUIRED_FIELDS) {
        if (!entity[field] || (Array.isArray(entity[field]) && entity[field].length === 0)) {
            missing.required.push(field);
        }
    }

    for (const field of ENHANCEMENT_FIELDS) {
        if (!entity[field] || (Array.isArray(entity[field]) && entity[field].length === 0)) {
            missing.optional.push(field);
        }
    }

    return missing;
}

/**
 * Enrich a single entity with missing fields
 */
async function enrichEntity(entity, filePath) {
    const missing = getMissingFields(entity);

    if (missing.required.length === 0) {
        return { enriched: false, reason: 'No required fields missing' };
    }

    console.log(`  Missing required: ${missing.required.join(', ')}`);

    const enrichments = {};

    // Generate required fields
    for (const field of missing.required) {
        console.log(`  Generating ${field}...`);

        let result = null;
        switch (field) {
            case 'keyMyths':
                result = await generateKeyMyths(entity);
                break;
            case 'sources':
                result = await generateSources(entity);
                break;
            case 'corpusSearch':
                result = await generateCorpusSearch(entity);
                break;
        }

        if (result) {
            enrichments[field] = result;
            console.log(`    ✓ Generated ${field}`);
        } else {
            console.log(`    ✗ Failed to generate ${field}`);
        }

        // Rate limiting - wait 500ms between API calls
        await new Promise(r => setTimeout(r, 500));
    }

    // Optionally generate extended content if no extendedContent exists
    if (missing.optional.includes('extendedContent') && Object.keys(enrichments).length > 0) {
        console.log(`  Generating extendedContent...`);
        const extContent = await generateExtendedContent(entity);
        if (extContent) {
            enrichments.extendedContent = extContent;
            console.log(`    ✓ Generated extendedContent`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    if (Object.keys(enrichments).length === 0) {
        return { enriched: false, reason: 'No enrichments generated' };
    }

    // Merge enrichments with entity
    const enrichedEntity = {
        ...entity,
        ...enrichments,
        enrichedAt: new Date().toISOString(),
        enrichedBy: 'gemini-schema-enrich'
    };

    // Save if not dry run
    if (!DRY_RUN) {
        fs.writeFileSync(filePath, JSON.stringify(enrichedEntity, null, 2));
    }

    return {
        enriched: true,
        fields: Object.keys(enrichments),
        dryRun: DRY_RUN
    };
}

/**
 * Scan and enrich all assets
 */
async function scanAndEnrich() {
    console.log('='.repeat(60));
    console.log('Asset Metadata Enrichment Script');
    console.log('='.repeat(60));
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no files modified)' : 'LIVE (files will be modified)'}`);
    if (TYPE_FILTER) console.log(`Filter: ${TYPE_FILTER} only`);
    if (LIMIT) console.log(`Limit: ${LIMIT} assets`);
    console.log('');

    const stats = {
        scanned: 0,
        needsEnrichment: 0,
        enriched: 0,
        failed: 0,
        skipped: 0
    };

    // Get all collection directories
    const collections = fs.readdirSync(ASSETS_DIR)
        .filter(name => {
            const fullPath = path.join(ASSETS_DIR, name);
            return fs.statSync(fullPath).isDirectory() &&
                   !name.startsWith('_') &&
                   !name.endsWith('-backup');
        });

    // Filter collections if type specified
    const targetCollections = TYPE_FILTER
        ? collections.filter(c => c === TYPE_FILTER || COLLECTION_TYPES[c] === TYPE_FILTER)
        : collections;

    console.log(`Scanning collections: ${targetCollections.join(', ')}`);
    console.log('');

    let processedCount = 0;

    for (const collection of targetCollections) {
        if (LIMIT && processedCount >= LIMIT) break;

        const collectionPath = path.join(ASSETS_DIR, collection);
        const files = fs.readdirSync(collectionPath)
            .filter(f => f.endsWith('.json') && !f.startsWith('_'));

        console.log(`\n[${collection}] ${files.length} assets`);

        for (const file of files) {
            if (LIMIT && processedCount >= LIMIT) break;

            const filePath = path.join(collectionPath, file);
            stats.scanned++;
            processedCount++;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const entity = JSON.parse(content);

                // Skip if no name
                if (!entity.name) {
                    console.log(`  [SKIP] ${file} - No name field`);
                    stats.skipped++;
                    continue;
                }

                const missing = getMissingFields(entity);

                if (missing.required.length === 0) {
                    // Already has required fields
                    continue;
                }

                stats.needsEnrichment++;
                console.log(`\n  Processing: ${entity.name} (${file})`);

                const result = await enrichEntity(entity, filePath);

                if (result.enriched) {
                    stats.enriched++;
                    console.log(`    → ${result.dryRun ? '[DRY RUN] Would enrich' : 'Enriched'}: ${result.fields.join(', ')}`);
                } else {
                    stats.failed++;
                    console.log(`    → Failed: ${result.reason}`);
                }

            } catch (error) {
                console.log(`  [ERROR] ${file}: ${error.message}`);
                stats.failed++;
            }
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Scanned:           ${stats.scanned}`);
    console.log(`Needs enrichment:  ${stats.needsEnrichment}`);
    console.log(`Enriched:          ${stats.enriched}`);
    console.log(`Failed:            ${stats.failed}`);
    console.log(`Skipped:           ${stats.skipped}`);
    if (DRY_RUN) {
        console.log('\n⚠️  DRY RUN - No files were modified');
        console.log('   Run without --dry-run to apply changes');
    }
}

// Run the script
scanAndEnrich().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
