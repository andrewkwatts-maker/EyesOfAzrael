#!/usr/bin/env node
/**
 * Gemini Enrichment Script
 * Reads entities flagged as incomplete, sends them to Gemini API to fill missing fields,
 * and writes enriched data back to the JSON files.
 *
 * Usage: node scripts/enrich-with-gemini.js [--dry-run] [--batch=N] [--collection=X]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB5BGm2MOI97sKKmsTumSSvkGl7bfvL4Ow';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const REPORT_FILE = path.join(__dirname, 'content-gaps-report.json');
const ENRICHMENT_LOG = path.join(__dirname, 'enrichment-log.json');

// Rate limiting
const RATE_LIMIT_MS = 1500; // 1.5 seconds between requests
const MAX_RETRIES = 3;

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const BATCH_SIZE = parseInt((args.find(a => a.startsWith('--batch=')) || '--batch=50').split('=')[1]);
const COLLECTION_FILTER = (args.find(a => a.startsWith('--collection=')) || '').split('=')[1] || null;
const SKIP_INDEX = args.includes('--skip-index');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function geminiRequest(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const url = new URL(GEMINI_URL);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode !== 200) {
                        reject(new Error(`API ${res.statusCode}: ${parsed.error?.message || responseData.substring(0, 200)}`));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${responseData.substring(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(60000, () => { req.destroy(); reject(new Error('Request timeout')); });
        req.write(data);
        req.end();
    });
}

function buildPrompt(entity, missingFields, entityType) {
    const typeFieldDescriptions = {
        archetype: {
            description: 'A comprehensive 200-400 word description of this archetype in world mythology and Jungian psychology',
            shortDescription: 'A 1-2 sentence summary (max 200 chars)',
            subtitle: 'A poetic subtitle (5-10 words)',
            icon: 'A single emoji that represents this archetype',
            category: 'The archetype category (e.g., "cosmic", "heroic", "transformative", "elemental", "divine", "psychological")',
            manifestations: 'An array of 5-8 specific mythological manifestations across cultures, each as an object {mythology, entity, description}',
            extendedContent: 'An array of 3-4 article sections, each {title, content} with 150-300 word markdown content covering: origins, cultural examples, psychological significance, modern relevance',
            sources: 'An array of 2-3 scholarly sources, each {author, title, description}',
            associations: 'An array of 5-8 symbolic associations, each {type, name, significance} where type is one of: color, element, concept, animal, number, celestial',
            cultural: 'Object with {worshipPractices: [{name, description}], festivals: [{name, timing, description}], modernLegacy: string}',
            cross_cultural_parallels: 'Array of 3-5 parallels, each {mythology, entity, category, similarity}',
            companions: 'Array of 2-4 associated figures, each {name, relationship, description, category}'
        },
        place: {
            description: 'A comprehensive 200-400 word description of this sacred place',
            shortDescription: 'A 1-2 sentence summary (max 200 chars)',
            subtitle: 'A poetic subtitle (5-10 words)',
            icon: 'A single emoji representing this place',
            mythology: 'The primary mythology system this place belongs to',
            characteristics: 'Array of 5-8 defining characteristics as strings',
            significance: 'A 2-3 sentence description of spiritual/cultural significance',
            location: 'Object with {cosmological: string describing the cosmic/geographical context}',
            extendedContent: 'Array of 3-4 article sections, each {title, content} with 150-300 word markdown content',
            sources: 'Array of 2-3 scholarly sources, each {author, title, description}',
            associations: 'Array of 5-8 symbolic associations, each {type, name, significance}',
            cultural: 'Object with {worshipPractices: [{name, description}], festivals: [{name, timing, description}], modernLegacy: string}',
            cross_cultural_parallels: 'Array of 3-5 parallels, each {mythology, entity, category, similarity}',
            companions: 'Array of 2-4 associated figures, each {name, relationship, description, category}'
        },
        herb: {
            description: 'A comprehensive 200-400 word description of this sacred plant',
            shortDescription: 'A 1-2 sentence summary (max 200 chars)',
            subtitle: 'A poetic subtitle (5-10 words)',
            icon: 'A single emoji representing this plant',
            mythology: 'The primary mythology system this herb belongs to',
            properties: 'Array of 5-8 traditional/mythological properties as strings',
            uses: 'Array of 5-8 traditional uses as strings',
            habitat: 'A 1-2 sentence description of where this plant grows',
            extendedContent: 'Array of 3-4 article sections, each {title, content} with 150-300 word markdown content',
            sources: 'Array of 2-3 scholarly sources, each {author, title, description}'
        },
        magic: {
            description: 'A comprehensive 200-400 word description of this magical tradition',
            shortDescription: 'A 1-2 sentence summary (max 200 chars)',
            subtitle: 'A poetic subtitle (5-10 words)',
            icon: 'A single emoji',
            mythology: 'The primary mythology system',
            magicType: 'The type of magic (elemental, divine, natural, ceremonial, etc.)',
            practitioners: 'Array of 3-5 types of practitioners as strings',
            extendedContent: 'Array of 3-4 article sections, each {title, content} with 150-300 word markdown content',
            sources: 'Array of 2-3 scholarly sources, each {author, title, description}'
        },
        concept: {
            description: 'A comprehensive 200-400 word description',
            shortDescription: 'A 1-2 sentence summary (max 200 chars)',
            subtitle: 'A poetic subtitle (5-10 words)',
            icon: 'A single emoji',
            mythology: 'The primary mythology or cultural system',
            category: 'The concept category (philosophical, spiritual, cosmological, etc.)',
            relatedConcepts: 'Array of 3-5 related concept names as strings',
            extendedContent: 'Array of 3-4 article sections, each {title, content} with 150-300 word markdown content',
            sources: 'Array of 2-3 scholarly sources, each {author, title, description}',
            associations: 'Array of 5-8 symbolic associations, each {type, name, significance}',
            cultural: 'Object with {worshipPractices: [{name, description}], modernLegacy: string}',
            cross_cultural_parallels: 'Array of 3-5 parallels, each {mythology, entity, category, similarity}',
            companions: 'Array of 2-4 associated figures, each {name, relationship, description, category}'
        }
    };

    const fieldDescs = typeFieldDescriptions[entityType] || typeFieldDescriptions['concept'];

    // Only describe the missing fields
    const fieldsToGenerate = missingFields
        .filter(f => fieldDescs[f])
        .map(f => `  "${f}": ${fieldDescs[f]}`)
        .join('\n');

    if (!fieldsToGenerate) return null;

    return `You are an expert mythology scholar and encyclopedia writer. Generate ONLY the missing JSON fields for this entity.

ENTITY:
  Name: ${entity.name}
  Type: ${entityType}
  Mythology: ${entity.mythology || 'universal'}
  Current ID: ${entity.id}
  ${entity.description ? `Existing description (first 300 chars): ${entity.description.substring(0, 300)}` : ''}

MISSING FIELDS TO GENERATE (provide ONLY these as a JSON object):
${fieldsToGenerate}

RULES:
- Return ONLY valid JSON — no markdown fences, no explanation, no preamble
- Content must be historically/mythologically accurate and scholarly
- Write in an encyclopedic but engaging tone
- Extended content sections should be substantive (150-300 words each)
- Do NOT include fields that were not listed above
- Do NOT include the entity's existing fields (id, name, type, etc.)
- For "icon", provide exactly ONE emoji character
- For arrays, provide the exact structure specified
- All strings must be properly escaped for JSON`;
}

async function enrichEntity(entityInfo) {
    const filePath = path.join(ASSETS_DIR, entityInfo.file);

    if (!fs.existsSync(filePath)) {
        return { file: entityInfo.file, status: 'skipped', reason: 'file not found' };
    }

    const entity = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const prompt = buildPrompt(entity, entityInfo.missingFields, entityInfo.type);

    if (!prompt) {
        return { file: entityInfo.file, status: 'skipped', reason: 'no fields to generate' };
    }

    if (DRY_RUN) {
        console.log(`  [DRY RUN] Would enrich: ${entityInfo.name} (${entityInfo.missingFields.length} fields)`);
        return { file: entityInfo.file, status: 'dry-run', fields: entityInfo.missingFields };
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await geminiRequest({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json'
                }
            });

            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Empty response from Gemini');

            // Parse the generated JSON
            let generated;
            try {
                // Strip markdown fences if present
                const cleaned = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
                generated = JSON.parse(cleaned);
            } catch (e) {
                throw new Error(`Invalid JSON from Gemini: ${text.substring(0, 200)}`);
            }

            // Merge generated fields into entity (only missing ones)
            let fieldsAdded = 0;
            for (const field of entityInfo.missingFields) {
                if (generated[field] !== undefined && !hasExistingField(entity, field)) {
                    entity[field] = generated[field];
                    fieldsAdded++;
                }
            }

            // Add enrichment metadata
            entity.enrichedAt = new Date().toISOString();
            entity.enrichedBy = 'gemini-2.0-flash';
            entity._enrichmentVersion = (entity._enrichmentVersion || 0) + 1;

            // Write back
            fs.writeFileSync(filePath, JSON.stringify(entity, null, 2));

            console.log(`  ✓ ${entityInfo.name}: +${fieldsAdded} fields`);
            return { file: entityInfo.file, status: 'enriched', fieldsAdded, fieldsRequested: entityInfo.missingFields.length };

        } catch (error) {
            console.error(`  ✗ ${entityInfo.name} (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
            if (attempt < MAX_RETRIES) {
                await sleep(RATE_LIMIT_MS * attempt * 2);
            } else {
                return { file: entityInfo.file, status: 'failed', error: error.message };
            }
        }
    }
}

function hasExistingField(entity, field) {
    const val = entity[field];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    if (typeof val === 'string') return val.trim().length > 10;
    return true;
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Gemini Content Enrichment Pipeline');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`  Batch size: ${BATCH_SIZE}`);
    console.log(`  Collection filter: ${COLLECTION_FILTER || 'all'}`);
    console.log(`  Skip index pages: ${SKIP_INDEX}`);
    console.log('');

    if (!fs.existsSync(REPORT_FILE)) {
        console.error('No content-gaps-report.json found. Run validate-content-completeness.js first.');
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    const queue = report.enrichmentQueue;

    // Build flat list of entities to enrich
    let entities = [];
    for (const [collection, items] of Object.entries(queue)) {
        if (COLLECTION_FILTER && collection !== COLLECTION_FILTER) continue;
        for (const item of items) {
            // Skip index/hub pages unless explicitly requested
            if (SKIP_INDEX && item.name.includes('Collection')) continue;
            entities.push(item);
        }
    }

    // Limit to batch size
    entities = entities.slice(0, BATCH_SIZE);

    console.log(`Enriching ${entities.length} entities...\n`);

    const results = [];
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        console.log(`[${i + 1}/${entities.length}] ${entity.name} (${entity.type}, score: ${entity.score})`);

        const result = await enrichEntity(entity);
        results.push(result);

        // Rate limit
        if (i < entities.length - 1 && !DRY_RUN) {
            await sleep(RATE_LIMIT_MS);
        }
    }

    // Summary
    const enriched = results.filter(r => r.status === 'enriched');
    const failed = results.filter(r => r.status === 'failed');
    const skipped = results.filter(r => r.status === 'skipped');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Results');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Enriched: ${enriched.length}`);
    console.log(`  Failed: ${failed.length}`);
    console.log(`  Skipped: ${skipped.length}`);
    console.log(`  Total fields added: ${enriched.reduce((s, r) => s + (r.fieldsAdded || 0), 0)}`);

    if (failed.length > 0) {
        console.log('\n  Failed entities:');
        for (const f of failed) {
            console.log(`    - ${f.file}: ${f.error}`);
        }
    }

    // Save log
    const log = {
        timestamp: new Date().toISOString(),
        dryRun: DRY_RUN,
        totalProcessed: results.length,
        enrichedCount: enriched.length,
        failedCount: failed.length,
        skippedCount: skipped.length,
        totalFieldsAdded: enriched.reduce((s, r) => s + (r.fieldsAdded || 0), 0),
        results
    };

    fs.writeFileSync(ENRICHMENT_LOG, JSON.stringify(log, null, 2));
    console.log(`\nLog saved to: ${ENRICHMENT_LOG}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
