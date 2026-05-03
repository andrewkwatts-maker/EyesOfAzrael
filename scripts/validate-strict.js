#!/usr/bin/env node
/**
 * Strict Content Completeness Validator
 * Tighter requirements: all display fields must be populated.
 * Outputs work packages for Gemini enrichment agents.
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const OUTPUT_FILE = path.join(__dirname, 'strict-gaps-report.json');
const WORK_PACKAGES_DIR = path.join(__dirname, 'work-packages');

const COLLECTIONS = [
    'deities', 'creatures', 'heroes', 'items', 'places',
    'archetypes', 'magic', 'rituals', 'texts', 'symbols',
    'herbs', 'cosmology', 'beings'
];

// Strict: ALL of these must be populated for an entity to pass
const REQUIRED_DISPLAY_FIELDS = [
    'id', 'name', 'type', 'mythology', 'description',
    'shortDescription', 'subtitle', 'icon'
];

// Enrichment fields that should be populated for a "complete" entity
const ENRICHMENT_FIELDS = [
    'extendedContent',  // >= 3 sections
    'sources',          // >= 2 sources
    'associations',     // >= 3 items
    'cultural',         // non-empty object
    'cross_cultural_parallels' // >= 1 item
];

// Type-specific required fields
const TYPE_FIELDS = {
    deity: ['domains', 'powers', 'symbols'],
    creature: ['abilities', 'habitat', 'appearance'],
    hero: ['achievements', 'weapons', 'companions'],
    item: ['powers', 'materials', 'wielders'],
    place: ['characteristics', 'significance', 'location'],
    concept: ['category', 'relatedConcepts'],
    magic: ['magicType', 'practitioners'],
    ritual: ['ritualType', 'purpose', 'participants'],
    text: ['textType', 'author', 'themes'],
    symbol: ['symbolType', 'meaning', 'usage'],
    herb: ['properties', 'uses', 'habitat'],
    archetype: ['category', 'manifestations'],
    cosmology: ['category', 'significance'],
    being: ['abilities', 'appearance']
};

const COLLECTION_TO_TYPE = {
    deities: 'deity', creatures: 'creature', heroes: 'hero',
    items: 'item', places: 'place', concepts: 'concept',
    magic: 'magic', rituals: 'ritual', texts: 'text',
    symbols: 'symbol', herbs: 'herb', archetypes: 'archetype',
    cosmology: 'cosmology', beings: 'being'
};

function checkField(entity, field) {
    const val = entity[field];
    if (val === undefined || val === null || val === '') return false;

    // Strict checks by field
    switch (field) {
        case 'description':
            return typeof val === 'string' && val.trim().length >= 100;
        case 'shortDescription':
            return typeof val === 'string' && val.trim().length >= 20;
        case 'subtitle':
            return typeof val === 'string' && val.trim().length >= 5;
        case 'icon':
            return typeof val === 'string' && val.trim().length >= 1;
        case 'extendedContent':
            return Array.isArray(val) && val.length >= 3 && val.every(s => s.title && s.content && s.content.length >= 50);
        case 'sources':
            return Array.isArray(val) && val.length >= 2;
        case 'associations':
            return Array.isArray(val) && val.length >= 3;
        case 'cultural':
            return val && typeof val === 'object' && Object.keys(val).length >= 1;
        case 'cross_cultural_parallels':
            return Array.isArray(val) && val.length >= 1;
        case 'companions':
            return Array.isArray(val) && val.length >= 1;
        default:
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === 'object') return Object.keys(val).length > 0;
            if (typeof val === 'string') return val.trim().length >= 3;
            return true;
    }
}

function validateEntity(entity, collection) {
    const entityType = entity.type || COLLECTION_TO_TYPE[collection];
    const typeFields = TYPE_FIELDS[entityType] || [];
    const missingFields = [];

    // Check display fields
    for (const f of REQUIRED_DISPLAY_FIELDS) {
        if (!checkField(entity, f)) missingFields.push(f);
    }

    // Check enrichment fields
    for (const f of ENRICHMENT_FIELDS) {
        if (!checkField(entity, f)) missingFields.push(f);
    }

    // Check type-specific fields
    for (const f of typeFields) {
        if (!checkField(entity, f)) missingFields.push(f);
    }

    const totalChecks = REQUIRED_DISPLAY_FIELDS.length + ENRICHMENT_FIELDS.length + typeFields.length;
    const score = Math.round(((totalChecks - missingFields.length) / totalChecks) * 100);

    return { missingFields, score, entityType };
}

// Main scan
console.log('Strict validation scan...\n');

const allResults = [];
const collectionStats = {};

for (const collection of COLLECTIONS) {
    const dir = path.join(ASSETS_DIR, collection);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
    let colResults = [];

    for (const file of files) {
        try {
            const filePath = path.join(dir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(data) || data['0'] !== undefined) continue;
            if (!data.name && !data.id) continue;

            const { missingFields, score, entityType } = validateEntity(data, collection);

            if (missingFields.length > 0) {
                colResults.push({
                    file: `${collection}/${file}`,
                    id: data.id || file.replace('.json', ''),
                    name: data.name || data.displayName || 'Unknown',
                    type: entityType,
                    mythology: data.mythology || 'unknown',
                    score,
                    missingFields,
                    isHub: (data.name || '').includes('Collection') || file.includes('-hub-')
                });
            }

            allResults.push({ file: `${collection}/${file}`, score, missingCount: missingFields.length });
        } catch (e) {}
    }

    const total = allResults.filter(r => r.file.startsWith(collection + '/')).length;
    const needsWork = colResults.length;
    const perfect = allResults.filter(r => r.file.startsWith(collection + '/') && r.missingCount === 0).length;

    collectionStats[collection] = { total, needsWork, perfect };
    console.log(`${collection.padEnd(15)} ${String(total).padStart(5)} total | ${String(perfect).padStart(5)} complete | ${String(needsWork).padStart(5)} need work`);

    // Group missing fields for work packages
    if (colResults.length > 0) {
        colResults.sort((a, b) => a.score - b.score);
    }

    // Write work package for this collection
    if (colResults.filter(r => !r.isHub).length > 0) {
        if (!fs.existsSync(WORK_PACKAGES_DIR)) fs.mkdirSync(WORK_PACKAGES_DIR, { recursive: true });

        // Group by missing field pattern for efficient batching
        const fieldGroups = {};
        for (const r of colResults.filter(r => !r.isHub)) {
            const key = r.missingFields.sort().join(',');
            if (!fieldGroups[key]) fieldGroups[key] = { fields: r.missingFields, entities: [] };
            fieldGroups[key].entities.push({
                file: r.file, id: r.id, name: r.name, mythology: r.mythology, score: r.score
            });
        }

        const workPackage = {
            collection,
            entityType: COLLECTION_TO_TYPE[collection],
            totalEntities: colResults.filter(r => !r.isHub).length,
            fieldGroups: Object.values(fieldGroups).sort((a, b) => b.entities.length - a.entities.length)
        };

        fs.writeFileSync(
            path.join(WORK_PACKAGES_DIR, `wp-${collection}.json`),
            JSON.stringify(workPackage, null, 2)
        );
    }
}

// Summary
const totalEntities = allResults.length;
const totalNeedWork = allResults.filter(r => r.missingCount > 0).length;
const totalPerfect = allResults.filter(r => r.missingCount === 0).length;

console.log(`\n${'═'.repeat(60)}`);
console.log(`Total: ${totalEntities} entities`);
console.log(`Complete: ${totalPerfect} (${Math.round(totalPerfect/totalEntities*100)}%)`);
console.log(`Need work: ${totalNeedWork} (${Math.round(totalNeedWork/totalEntities*100)}%)`);
console.log(`\nWork packages written to: ${WORK_PACKAGES_DIR}/`);

// Save full report
const report = {
    generatedAt: new Date().toISOString(),
    summary: { totalEntities, totalNeedWork, totalPerfect },
    collectionStats
};
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
