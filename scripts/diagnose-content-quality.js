#!/usr/bin/env node
/**
 * Content Quality Diagnostic Script
 *
 * Analyzes all assets to identify content quality issues:
 * - Low word counts (< 500 words total)
 * - Missing key sections
 * - Shallow descriptions (< 100 words)
 * - Assets that would render less than 3 content sections
 *
 * Usage:
 *   node scripts/diagnose-content-quality.js [options]
 *
 * Options:
 *   --type=<type>      Only analyze specific type
 *   --mythology=<myth> Only analyze specific mythology
 *   --output=<file>    Save report to file
 *   --verbose          Show detailed output
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const TYPE_FILTER = args.find(a => a.startsWith('--type='))?.split('=')[1];
const MYTHOLOGY_FILTER = args.find(a => a.startsWith('--mythology='))?.split('=')[1];
const OUTPUT_FILE = args.find(a => a.startsWith('--output='))?.split('=')[1];
const VERBOSE = args.includes('--verbose');

const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Collection types
const COLLECTIONS = [
    'deities', 'heroes', 'creatures', 'items', 'places',
    'concepts', 'cosmology', 'archetypes', 'events',
    'rituals', 'texts', 'symbols', 'herbs', 'magic',
    'beings', 'figures', 'angels', 'teachings'
];

// Key content fields with importance weights
const CONTENT_FIELDS = {
    // Core content (high weight)
    description: { weight: 3, minWords: 50 },
    longDescription: { weight: 2, minWords: 100 },

    // Extended content (high weight)
    extendedContent: { weight: 4, isArray: true, minItems: 2 },
    keyMyths: { weight: 3, isArray: true, minItems: 2 },

    // Cultural & context (medium weight)
    cultural: { weight: 2, isObject: true },
    cross_cultural_parallels: { weight: 2, isArray: true, minItems: 2 },
    symbolism: { weight: 2, minWords: 50 },

    // Relationships (medium weight)
    relatedEntities: { weight: 2, isObject: true },
    relatedDeities: { weight: 1, isArray: true },
    companions: { weight: 1, isArray: true },
    family: { weight: 1, isObject: true },

    // Entity-specific (medium weight)
    quests: { weight: 2, isArray: true },
    feats: { weight: 2, isArray: true },
    associations: { weight: 1, isArray: true },

    // Reference content (lower weight)
    sources: { weight: 1, isArray: true },
    corpusSearch: { weight: 1, isObject: true },
    tags: { weight: 0.5, isArray: true }
};

// Quality thresholds
const THRESHOLDS = {
    minTotalWords: 500,        // Minimum words for "adequate" content
    minDescriptionWords: 50,   // Minimum description length
    minSections: 5,            // Minimum displayable sections
    minContentScore: 10,       // Minimum weighted score
    targetPages: 3             // Target pages of content
};

// Results storage
const results = {
    total: 0,
    adequate: 0,
    sparse: 0,
    byCollection: {},
    byMythology: {},
    issues: [],
    sparseAssets: [],
    recommendations: []
};

/**
 * Count words in text
 */
function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Count words in an object recursively
 */
function countWordsDeep(obj) {
    if (!obj) return 0;
    if (typeof obj === 'string') return countWords(obj);
    if (Array.isArray(obj)) {
        return obj.reduce((sum, item) => sum + countWordsDeep(item), 0);
    }
    if (typeof obj === 'object') {
        return Object.values(obj).reduce((sum, val) => sum + countWordsDeep(val), 0);
    }
    return 0;
}

/**
 * Count displayable sections in entity
 */
function countSections(entity) {
    let count = 0;

    // Core sections
    if (entity.description && countWords(entity.description) >= 30) count++;
    if (entity.longDescription) count++;

    // Extended content
    if (entity.extendedContent?.length) count += Math.min(entity.extendedContent.length, 5);
    if (entity.keyMyths?.length) count++;

    // Cultural & symbolism
    if (entity.cultural) count++;
    if (entity.cross_cultural_parallels?.length >= 2) count++;
    if (entity.symbolism && countWords(entity.symbolism) >= 30) count++;

    // Relationships
    if (entity.relatedEntities && Object.keys(entity.relatedEntities).length) count++;
    if (entity.family && Object.keys(entity.family).length) count++;
    if (entity.companions?.length) count++;

    // Entity-specific
    if (entity.quests?.length) count++;
    if (entity.feats?.length) count++;
    if (entity.associations?.length >= 3) count++;

    // Reference
    if (entity.sources?.length) count++;
    if (entity.corpusSearch) count++;

    return count;
}

/**
 * Calculate content score
 */
function calculateScore(entity) {
    let score = 0;

    for (const [field, config] of Object.entries(CONTENT_FIELDS)) {
        const value = entity[field];
        if (!value) continue;

        if (config.isArray) {
            if (Array.isArray(value) && value.length > 0) {
                const bonus = Math.min(value.length / (config.minItems || 1), 2);
                score += config.weight * bonus;
            }
        } else if (config.isObject) {
            if (typeof value === 'object' && Object.keys(value).length > 0) {
                score += config.weight;
            }
        } else {
            const words = countWords(value);
            if (words >= (config.minWords || 10)) {
                const bonus = Math.min(words / config.minWords, 2);
                score += config.weight * bonus;
            }
        }
    }

    return Math.round(score * 10) / 10;
}

/**
 * Identify missing fields for an entity
 */
function getMissingFields(entity, type) {
    const missing = [];
    const recommended = [];

    // Core fields everyone needs
    if (!entity.description || countWords(entity.description) < 50) {
        missing.push('description (< 50 words)');
    }

    if (!entity.extendedContent?.length) {
        missing.push('extendedContent');
    } else if (entity.extendedContent.length < 2) {
        recommended.push('extendedContent (need 2+ sections)');
    }

    if (!entity.keyMyths?.length) {
        missing.push('keyMyths');
    }

    if (!entity.cultural) {
        recommended.push('cultural');
    }

    if (!entity.cross_cultural_parallels?.length) {
        recommended.push('cross_cultural_parallels');
    }

    if (!entity.symbolism || countWords(entity.symbolism) < 30) {
        recommended.push('symbolism');
    }

    if (!entity.sources?.length) {
        recommended.push('sources');
    }

    if (!entity.corpusSearch) {
        recommended.push('corpusSearch');
    }

    // Type-specific fields
    if (type === 'heroes' || type === 'hero') {
        if (!entity.quests?.length) recommended.push('quests');
        if (!entity.feats?.length) recommended.push('feats');
        if (!entity.companions?.length) recommended.push('companions');
    }

    if (type === 'deities' || type === 'deity') {
        if (!entity.family || Object.keys(entity.family).length === 0) {
            recommended.push('family');
        }
        if (!entity.associations?.length) recommended.push('associations');
    }

    return { missing, recommended };
}

/**
 * Analyze a single entity
 */
function analyzeEntity(entity, collection, filePath) {
    const totalWords = countWordsDeep(entity);
    const descWords = countWords(entity.description);
    const sections = countSections(entity);
    const score = calculateScore(entity);
    const { missing, recommended } = getMissingFields(entity, collection);

    const issues = [];

    // Check thresholds
    if (totalWords < THRESHOLDS.minTotalWords) {
        issues.push(`Low word count: ${totalWords} words (min: ${THRESHOLDS.minTotalWords})`);
    }

    if (descWords < THRESHOLDS.minDescriptionWords) {
        issues.push(`Short description: ${descWords} words (min: ${THRESHOLDS.minDescriptionWords})`);
    }

    if (sections < THRESHOLDS.minSections) {
        issues.push(`Few sections: ${sections} (min: ${THRESHOLDS.minSections})`);
    }

    if (score < THRESHOLDS.minContentScore) {
        issues.push(`Low content score: ${score} (min: ${THRESHOLDS.minContentScore})`);
    }

    if (missing.length > 0) {
        issues.push(`Missing fields: ${missing.join(', ')}`);
    }

    const isSparse = issues.length > 0 || score < THRESHOLDS.minContentScore;

    return {
        id: entity.id,
        name: entity.name,
        mythology: entity.mythology || 'unknown',
        collection,
        filePath,
        totalWords,
        descWords,
        sections,
        score,
        missing,
        recommended,
        issues,
        isSparse
    };
}

/**
 * Process a collection
 */
function processCollection(collectionName) {
    const collectionDir = path.join(ASSETS_DIR, collectionName);
    if (!fs.existsSync(collectionDir)) return;

    const files = fs.readdirSync(collectionDir)
        .filter(f => f.endsWith('.json') && !f.startsWith('_'));

    results.byCollection[collectionName] = {
        total: 0,
        sparse: 0,
        adequate: 0,
        avgScore: 0,
        avgWords: 0
    };

    let totalScore = 0;
    let totalWords = 0;

    for (const file of files) {
        const filePath = path.join(collectionDir, file);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const entity = JSON.parse(content);

            if (!entity.id || !entity.name) continue;

            // Apply filters
            if (MYTHOLOGY_FILTER && entity.mythology !== MYTHOLOGY_FILTER) continue;

            const analysis = analyzeEntity(entity, collectionName, filePath);

            results.total++;
            results.byCollection[collectionName].total++;
            totalScore += analysis.score;
            totalWords += analysis.totalWords;

            // Track by mythology
            const myth = analysis.mythology;
            if (!results.byMythology[myth]) {
                results.byMythology[myth] = { total: 0, sparse: 0, adequate: 0 };
            }
            results.byMythology[myth].total++;

            if (analysis.isSparse) {
                results.sparse++;
                results.byCollection[collectionName].sparse++;
                results.byMythology[myth].sparse++;
                results.sparseAssets.push(analysis);

                if (VERBOSE) {
                    console.log(`  ⚠ ${entity.name}: Score ${analysis.score}, ${analysis.sections} sections, ${analysis.totalWords} words`);
                    if (analysis.missing.length) {
                        console.log(`    Missing: ${analysis.missing.join(', ')}`);
                    }
                }
            } else {
                results.adequate++;
                results.byCollection[collectionName].adequate++;
                results.byMythology[myth].adequate++;
            }

        } catch (error) {
            // Skip invalid files
        }
    }

    // Calculate averages
    if (results.byCollection[collectionName].total > 0) {
        results.byCollection[collectionName].avgScore =
            Math.round(totalScore / results.byCollection[collectionName].total * 10) / 10;
        results.byCollection[collectionName].avgWords =
            Math.round(totalWords / results.byCollection[collectionName].total);
    }
}

/**
 * Generate recommendations
 */
function generateRecommendations() {
    // Sort sparse assets by score (lowest first)
    results.sparseAssets.sort((a, b) => a.score - b.score);

    // Group by most common missing fields
    const missingCounts = {};
    for (const asset of results.sparseAssets) {
        for (const field of asset.missing) {
            const fieldName = field.split(' ')[0];
            missingCounts[fieldName] = (missingCounts[fieldName] || 0) + 1;
        }
        for (const field of asset.recommended) {
            const fieldName = field.split(' ')[0];
            missingCounts[fieldName] = (missingCounts[fieldName] || 0) + 0.5;
        }
    }

    // Sort by frequency
    const sortedMissing = Object.entries(missingCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    results.recommendations.push({
        type: 'priority_fields',
        title: 'Fields to prioritize for enrichment',
        items: sortedMissing.map(([field, count]) => `${field}: ${Math.round(count)} assets need this`)
    });

    // Collections needing most work
    const collectionsBySparsePct = Object.entries(results.byCollection)
        .map(([name, data]) => ({
            name,
            sparsePct: data.total > 0 ? Math.round(data.sparse / data.total * 100) : 0,
            sparse: data.sparse,
            total: data.total
        }))
        .filter(c => c.total > 0)
        .sort((a, b) => b.sparsePct - a.sparsePct);

    results.recommendations.push({
        type: 'collections',
        title: 'Collections needing most enrichment',
        items: collectionsBySparsePct.slice(0, 5).map(c =>
            `${c.name}: ${c.sparsePct}% sparse (${c.sparse}/${c.total})`
        )
    });

    // Mythologies needing work
    const mythsBySparsePct = Object.entries(results.byMythology)
        .map(([name, data]) => ({
            name,
            sparsePct: data.total > 0 ? Math.round(data.sparse / data.total * 100) : 0,
            sparse: data.sparse,
            total: data.total
        }))
        .filter(m => m.total >= 5) // Only mythologies with 5+ assets
        .sort((a, b) => b.sparsePct - a.sparsePct);

    results.recommendations.push({
        type: 'mythologies',
        title: 'Mythologies needing most enrichment',
        items: mythsBySparsePct.slice(0, 5).map(m =>
            `${m.name}: ${m.sparsePct}% sparse (${m.sparse}/${m.total})`
        )
    });

    // Worst assets to fix first
    results.recommendations.push({
        type: 'worst_assets',
        title: 'Assets most urgently needing enrichment',
        items: results.sparseAssets.slice(0, 20).map(a =>
            `${a.name} (${a.mythology}): score ${a.score}, ${a.sections} sections`
        )
    });
}

/**
 * Print report
 */
function printReport() {
    console.log('\n' + '='.repeat(70));
    console.log('CONTENT QUALITY DIAGNOSTIC REPORT');
    console.log('='.repeat(70));

    console.log(`\nTotal assets analyzed: ${results.total}`);
    console.log(`Adequate content: ${results.adequate} (${Math.round(results.adequate / results.total * 100)}%)`);
    console.log(`Sparse/needs work: ${results.sparse} (${Math.round(results.sparse / results.total * 100)}%)`);

    console.log('\n--- By Collection ---');
    for (const [name, data] of Object.entries(results.byCollection).sort((a, b) => b[1].sparse - a[1].sparse)) {
        if (data.total === 0) continue;
        const pct = Math.round(data.sparse / data.total * 100);
        console.log(`  ${name.padEnd(15)} ${data.sparse}/${data.total} sparse (${pct}%) | Avg score: ${data.avgScore} | Avg words: ${data.avgWords}`);
    }

    console.log('\n--- By Mythology (top 10) ---');
    const topMyths = Object.entries(results.byMythology)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);
    for (const [name, data] of topMyths) {
        const pct = data.total > 0 ? Math.round(data.sparse / data.total * 100) : 0;
        console.log(`  ${name.padEnd(20)} ${data.sparse}/${data.total} sparse (${pct}%)`);
    }

    console.log('\n--- Recommendations ---');
    for (const rec of results.recommendations) {
        console.log(`\n${rec.title}:`);
        rec.items.forEach(item => console.log(`  • ${item}`));
    }

    console.log('\n' + '='.repeat(70));
}

/**
 * Save report to file
 */
function saveReport() {
    if (!OUTPUT_FILE) return;

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: results.total,
            adequate: results.adequate,
            sparse: results.sparse,
            sparsePercent: Math.round(results.sparse / results.total * 100)
        },
        byCollection: results.byCollection,
        byMythology: results.byMythology,
        recommendations: results.recommendations,
        sparseAssets: results.sparseAssets.map(a => ({
            id: a.id,
            name: a.name,
            mythology: a.mythology,
            collection: a.collection,
            score: a.score,
            sections: a.sections,
            totalWords: a.totalWords,
            missing: a.missing,
            recommended: a.recommended
        }))
    };

    const outputPath = path.resolve(OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${outputPath}`);
}

/**
 * Main
 */
function main() {
    console.log('Analyzing content quality...\n');

    const collections = TYPE_FILTER ? [TYPE_FILTER] : COLLECTIONS;

    for (const collection of collections) {
        console.log(`📂 ${collection}...`);
        processCollection(collection);
    }

    generateRecommendations();
    printReport();
    saveReport();
}

main();
