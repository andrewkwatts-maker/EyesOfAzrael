#!/usr/bin/env node
/**
 * Content Completeness Validator
 * Scans all firebase-assets-downloaded entities and flags ones with missing schema fields.
 * Outputs a JSON report of entities needing enrichment.
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const OUTPUT_FILE = path.join(__dirname, 'content-gaps-report.json');
const SUMMARY_FILE = path.join(__dirname, 'content-gaps-summary.txt');

// Collections to validate
const COLLECTIONS = [
    'deities', 'creatures', 'heroes', 'items', 'places',
    'archetypes', 'magic', 'rituals', 'texts', 'symbols',
    'herbs', 'cosmology', 'beings', 'concepts'
];

// Universal required fields
const UNIVERSAL_REQUIRED = ['id', 'name', 'type', 'mythology', 'description'];

// Universal enrichment fields (should have for a complete entity)
const UNIVERSAL_ENRICHMENT = [
    'shortDescription', 'subtitle', 'icon',
    'extendedContent', 'sources', 'associations',
    'cultural', 'cross_cultural_parallels', 'companions'
];

// Type-specific fields
const TYPE_SPECIFIC_FIELDS = {
    deity: {
        important: ['domains', 'powers', 'symbols'],
        optional: ['consorts', 'children', 'parents', 'titles']
    },
    hero: {
        important: ['achievements', 'weapons', 'companions'],
        optional: ['quests', 'birthplace', 'deathPlace']
    },
    creature: {
        important: ['abilities', 'habitat', 'appearance'],
        optional: ['weaknesses', 'behavior', 'physicalTraits', 'keyMyths']
    },
    item: {
        important: ['powers', 'materials', 'wielders'],
        optional: ['itemType', 'createdBy', 'currentLocation']
    },
    place: {
        important: ['characteristics', 'significance', 'location'],
        optional: ['locationType', 'geography', 'inhabitants', 'events']
    },
    concept: {
        important: ['category', 'relatedConcepts'],
        optional: ['manifestations', 'symbolism']
    },
    magic: {
        important: ['magicType', 'practitioners'],
        optional: ['spells', 'rituals', 'requirements', 'limitations']
    },
    ritual: {
        important: ['ritualType', 'purpose', 'participants'],
        optional: ['timing', 'materials', 'steps']
    },
    text: {
        important: ['textType', 'author', 'themes'],
        optional: ['dateWritten', 'language', 'chapters']
    },
    symbol: {
        important: ['symbolType', 'meaning', 'usage'],
        optional: ['relatedSymbols', 'variations']
    },
    herb: {
        important: ['properties', 'uses', 'habitat'],
        optional: ['preparation', 'warnings', 'folklore']
    },
    archetype: {
        important: ['category', 'manifestations'],
        optional: ['symbolism', 'relatedConcepts']
    },
    cosmology: {
        important: ['category', 'significance'],
        optional: ['relatedConcepts', 'symbolism']
    },
    being: {
        important: ['abilities', 'appearance'],
        optional: ['habitat', 'behavior']
    }
};

// Map collection names to entity types
const COLLECTION_TO_TYPE = {
    deities: 'deity',
    creatures: 'creature',
    heroes: 'hero',
    items: 'item',
    places: 'place',
    concepts: 'concept',
    magic: 'magic',
    rituals: 'ritual',
    texts: 'text',
    symbols: 'symbol',
    herbs: 'herb',
    archetypes: 'archetype',
    cosmology: 'cosmology',
    beings: 'being'
};

function isValidArray(val) {
    return Array.isArray(val) && val.length > 0;
}

function isValidString(val) {
    return typeof val === 'string' && val.trim().length > 10;
}

function isValidObject(val) {
    return val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0;
}

function hasField(entity, field) {
    const val = entity[field];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    if (typeof val === 'string') return val.trim().length > 0;
    return true;
}

function validateEntity(entity, collection) {
    const issues = [];
    const missingFields = [];
    const entityType = entity.type || COLLECTION_TO_TYPE[collection] || collection;
    const typeFields = TYPE_SPECIFIC_FIELDS[entityType] || TYPE_SPECIFIC_FIELDS[COLLECTION_TO_TYPE[collection]] || { important: [], optional: [] };

    // Check universal required
    for (const field of UNIVERSAL_REQUIRED) {
        if (!hasField(entity, field)) {
            issues.push(`Missing required: ${field}`);
            missingFields.push(field);
        }
    }

    // Check description quality
    const desc = entity.description || '';
    if (desc.length < 100) {
        issues.push(`Description too short (${desc.length} chars, need 100+)`);
        missingFields.push('description');
    }

    // Check shortDescription
    if (!hasField(entity, 'shortDescription') || (entity.shortDescription || '').length < 10) {
        issues.push('Missing/short shortDescription');
        missingFields.push('shortDescription');
    }

    // Check extended content
    const ext = entity.extendedContent || [];
    if (!Array.isArray(ext) || ext.length < 2) {
        issues.push(`Insufficient extendedContent (${ext.length} sections, need 2+)`);
        missingFields.push('extendedContent');
    }

    // Check sources
    const src = entity.sources || [];
    if (!Array.isArray(src) || src.length < 1) {
        issues.push('No sources');
        missingFields.push('sources');
    }

    // Check type-specific important fields
    for (const field of typeFields.important) {
        if (!hasField(entity, field)) {
            issues.push(`Missing type-specific: ${field}`);
            missingFields.push(field);
        }
    }

    // Check enrichment fields
    if (!hasField(entity, 'associations')) missingFields.push('associations');
    if (!hasField(entity, 'cultural')) missingFields.push('cultural');
    if (!hasField(entity, 'cross_cultural_parallels')) missingFields.push('cross_cultural_parallels');
    if (!hasField(entity, 'companions')) missingFields.push('companions');
    if (!hasField(entity, 'icon')) missingFields.push('icon');
    if (!hasField(entity, 'subtitle')) missingFields.push('subtitle');

    // Score: 0-100 completeness
    const totalChecks = UNIVERSAL_REQUIRED.length + UNIVERSAL_ENRICHMENT.length + typeFields.important.length + 1; // +1 for desc quality
    const passedChecks = totalChecks - issues.length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return { issues, missingFields: [...new Set(missingFields)], score, entityType };
}

function scanCollection(collection) {
    const dir = path.join(ASSETS_DIR, collection);
    if (!fs.existsSync(dir)) return [];

    const results = [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of files) {
        try {
            const filePath = path.join(dir, file);
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);

            // Skip index/aggregate files
            if (Array.isArray(data) || data['0'] !== undefined) continue;
            if (!data.name && !data.id) continue;

            const { issues, missingFields, score, entityType } = validateEntity(data, collection);

            results.push({
                file: `${collection}/${file}`,
                id: data.id || file.replace('.json', ''),
                name: data.name || data.displayName || 'Unknown',
                type: entityType,
                mythology: data.mythology || 'unknown',
                score,
                issueCount: issues.length,
                issues,
                missingFields,
                descriptionLength: (data.description || '').length,
                extendedContentSections: (data.extendedContent || []).length,
                sourcesCount: (data.sources || []).length
            });
        } catch (e) {
            // Skip invalid JSON
        }
    }

    return results;
}

// Main
console.log('Scanning all collections for content completeness...\n');

const allResults = [];
const collectionStats = {};

for (const collection of COLLECTIONS) {
    const results = scanCollection(collection);
    allResults.push(...results);

    const total = results.length;
    const needsWork = results.filter(r => r.score < 70).length;
    const critical = results.filter(r => r.score < 40).length;
    const good = results.filter(r => r.score >= 85).length;

    collectionStats[collection] = { total, needsWork, critical, good };
    console.log(`${collection}: ${total} entities | ${good} good | ${needsWork} need work | ${critical} critical`);
}

// Sort by score ascending (worst first)
allResults.sort((a, b) => a.score - b.score);

// Entities needing enrichment (score < 70)
const needsEnrichment = allResults.filter(r => r.score < 70);

// Build enrichment queue grouped by collection
const enrichmentQueue = {};
for (const entity of needsEnrichment) {
    const collection = entity.file.split('/')[0];
    if (!enrichmentQueue[collection]) enrichmentQueue[collection] = [];
    enrichmentQueue[collection].push({
        file: entity.file,
        id: entity.id,
        name: entity.name,
        type: entity.type,
        mythology: entity.mythology,
        score: entity.score,
        missingFields: entity.missingFields
    });
}

// Write full report
const report = {
    generatedAt: new Date().toISOString(),
    summary: {
        totalEntities: allResults.length,
        needsEnrichment: needsEnrichment.length,
        criticalCount: allResults.filter(r => r.score < 40).length,
        goodCount: allResults.filter(r => r.score >= 85).length,
        averageScore: Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length)
    },
    collectionStats,
    enrichmentQueue,
    allResults
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

// Write summary
let summary = `Content Completeness Report - ${new Date().toISOString()}\n`;
summary += `${'='.repeat(60)}\n\n`;
summary += `Total entities scanned: ${allResults.length}\n`;
summary += `Entities needing enrichment (score < 70): ${needsEnrichment.length}\n`;
summary += `Critical (score < 40): ${allResults.filter(r => r.score < 40).length}\n`;
summary += `Good (score >= 85): ${allResults.filter(r => r.score >= 85).length}\n`;
summary += `Average score: ${report.summary.averageScore}\n\n`;

summary += `Collection Breakdown:\n`;
summary += `${'─'.repeat(60)}\n`;
for (const [col, stats] of Object.entries(collectionStats)) {
    summary += `  ${col.padEnd(15)} ${String(stats.total).padStart(5)} total | ${String(stats.good).padStart(4)} good | ${String(stats.needsWork).padStart(4)} need work | ${String(stats.critical).padStart(4)} critical\n`;
}

summary += `\nEnrichment Queue by Collection:\n`;
summary += `${'─'.repeat(60)}\n`;
for (const [col, entities] of Object.entries(enrichmentQueue)) {
    summary += `\n  ${col} (${entities.length} entities):\n`;
    for (const e of entities.slice(0, 10)) {
        summary += `    - ${e.name} (score: ${e.score}, missing: ${e.missingFields.join(', ')})\n`;
    }
    if (entities.length > 10) summary += `    ... and ${entities.length - 10} more\n`;
}

fs.writeFileSync(SUMMARY_FILE, summary);

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${allResults.length} entities | ${needsEnrichment.length} need enrichment`);
console.log(`Report: ${OUTPUT_FILE}`);
console.log(`Summary: ${SUMMARY_FILE}`);
