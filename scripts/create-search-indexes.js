#!/usr/bin/env node

/**
 * Search Index Creator
 * Eyes of Azrael - Firebase Migration
 *
 * Creates comprehensive search indexes for all content types
 * with optimized metadata for filtering, sorting, and full-text search.
 *
 * Features:
 * - Full-text search tokens
 * - Faceted search (mythology, type, tags)
 * - Autocomplete support
 * - Cross-reference mapping
 * - Quality scoring
 *
 * Usage:
 *   node create-search-indexes.js
 *   node create-search-indexes.js --output=firestore
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PARSED_DATA_DIR = path.join(__dirname, '../parsed_data');
const OUTPUT_DIR = path.join(__dirname, '../search_indexes');

// Stop words for search tokenization
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'she', 'her', 'his', 'they', 'their'
]);

/**
 * Tokenize text for search
 */
function tokenize(text) {
    if (!text) return [];

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Remove punctuation
        .split(/\s+/)               // Split on whitespace
        .filter(word => word.length > 2 && !STOP_WORDS.has(word))  // Filter short words and stop words
        .filter((word, index, self) => self.indexOf(word) === index);  // Remove duplicates
}

/**
 * Extract searchable tags from content
 */
function extractTags(item, contentType) {
    const tags = new Set();

    // Add content type
    tags.add(contentType);

    // Add mythology
    if (item.mythology) {
        tags.add(item.mythology);
    }

    // Type-specific tag extraction
    switch (contentType) {
        case 'deities':
            if (item.domains) item.domains.forEach(d => tags.add(d.toLowerCase()));
            if (item.symbols) item.symbols.forEach(s => tags.add(s.toLowerCase()));
            if (item.archetypes) item.archetypes.forEach(a => tags.add(a.toLowerCase()));
            break;

        case 'heroes':
            if (item.titles) item.titles.forEach(t => tags.add(t.toLowerCase()));
            if (item.feats) item.feats.forEach(f => tags.add(f.toLowerCase()));
            break;

        case 'creatures':
            if (item.type) tags.add(item.type.toLowerCase());
            if (item.attributes) item.attributes.forEach(a => tags.add(a.toLowerCase()));
            break;

        case 'cosmology':
            if (item.type) tags.add(item.type.toLowerCase());
            if (item.layers) item.layers.forEach(l => tags.add(l.toLowerCase()));
            break;

        case 'herbs':
            if (item.properties) item.properties.forEach(p => tags.add(p.toLowerCase()));
            if (item.uses) item.uses.forEach(u => tags.add(u.toLowerCase()));
            break;

        case 'rituals':
            if (item.purpose) item.purpose.forEach(p => tags.add(p.toLowerCase()));
            break;
    }

    return Array.from(tags);
}

/**
 * Calculate quality score for content
 */
function calculateQualityScore(item, contentType) {
    let score = 0;
    let maxScore = 100;

    // Name/title (required)
    if (item.name || item.title) score += 10;

    // Description (weighted heavily)
    if (item.description) {
        if (item.description.length > 200) score += 20;
        else if (item.description.length > 100) score += 15;
        else if (item.description.length > 50) score += 10;
        else score += 5;
    }

    // Primary sources
    if (item.primarySources && item.primarySources.length > 0) {
        score += Math.min(item.primarySources.length * 2, 20);
    }

    // Content-specific scoring
    switch (contentType) {
        case 'deities':
            if (item.domains && item.domains.length > 0) score += 15;
            if (item.symbols && item.symbols.length > 0) score += 10;
            if (item.relationships && Object.keys(item.relationships).length > 0) score += 10;
            if (item.archetypes && item.archetypes.length > 0) score += 15;
            break;

        case 'heroes':
            if (item.feats && item.feats.length > 0) score += 15;
            if (item.weapons && item.weapons.length > 0) score += 10;
            if (item.quests && item.quests.length > 0) score += 15;
            break;

        case 'creatures':
            if (item.attributes && item.attributes.length > 0) score += 15;
            if (item.abilities && item.abilities.length > 0) score += 15;
            break;

        case 'cosmology':
            if (item.inhabitants && item.inhabitants.length > 0) score += 15;
            if (item.features && item.features.length > 0) score += 15;
            break;

        case 'herbs':
            if (item.uses && item.uses.length > 0) score += 15;
            if (item.properties && item.properties.length > 0) score += 15;
            break;

        case 'rituals':
            if (item.steps && item.steps.length > 0) score += 20;
            if (item.tools && item.tools.length > 0) score += 10;
            break;
    }

    return Math.min(score, maxScore);
}

/**
 * Create search index entry
 */
function createSearchIndexEntry(item, contentType) {
    // Extract name/title
    const name = item.name || item.title || '';
    const displayName = item.displayName || item.displayTitle || name;

    // Tokenize searchable fields
    const searchTokens = new Set();

    // Add name tokens
    tokenize(name).forEach(token => searchTokens.add(token));
    tokenize(displayName).forEach(token => searchTokens.add(token));

    // Add description tokens
    tokenize(item.description).forEach(token => searchTokens.add(token));

    // Add mythology tokens
    if (item.mythology) {
        tokenize(item.mythology).forEach(token => searchTokens.add(token));
    }

    // Add content-specific tokens
    const allText = [];
    Object.entries(item).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => {
                if (typeof v === 'string') allText.push(v);
            });
        } else if (typeof value === 'string' && key !== 'id' && key !== 'metadata') {
            allText.push(value);
        }
    });

    allText.forEach(text => {
        tokenize(text).forEach(token => searchTokens.add(token));
    });

    // Extract tags for faceted search
    const tags = extractTags(item, contentType);

    // Calculate quality score
    const qualityScore = calculateQualityScore(item, contentType);

    // Create autocomplete prefixes
    const autocompletePrefixes = [];
    const nameLower = name.toLowerCase();
    for (let i = 1; i <= Math.min(nameLower.length, 10); i++) {
        autocompletePrefixes.push(nameLower.substring(0, i));
    }

    return {
        id: item.id,
        name: name,
        displayName: displayName,
        description: item.description ? item.description.substring(0, 200) : '',
        contentType: contentType,
        mythology: item.mythology || 'unknown',
        searchTokens: Array.from(searchTokens),
        tags: tags,
        qualityScore: qualityScore,
        autocompletePrefixes: autocompletePrefixes,
        sourceFile: item.metadata?.sourceFile || '',
        createdAt: item.metadata?.createdAt || new Date().toISOString(),
        metadata: {
            hasDescription: !!item.description && item.description.length > 50,
            hasPrimarySources: (item.primarySources && item.primarySources.length > 0) || false,
            sourceCount: item.primarySources?.length || 0,
            verified: item.metadata?.verified || false
        }
    };
}

/**
 * Create cross-references between content
 */
function createCrossReferences(allIndexes) {
    const crossRefs = {};

    // Build name lookup map
    const nameMap = new Map();
    allIndexes.forEach(index => {
        const nameLower = index.name.toLowerCase();
        if (!nameMap.has(nameLower)) {
            nameMap.set(nameLower, []);
        }
        nameMap.get(nameLower).push(index);
    });

    // Find relationships
    allIndexes.forEach(index => {
        const refs = new Set();

        // Check description for mentions
        const descLower = (index.description || '').toLowerCase();
        nameMap.forEach((items, name) => {
            if (descLower.includes(name) && items[0].id !== index.id) {
                items.forEach(item => refs.add(item.id));
            }
        });

        // Check tags for overlaps
        index.tags.forEach(tag => {
            allIndexes.forEach(other => {
                if (other.id !== index.id && other.tags.includes(tag)) {
                    refs.add(other.id);
                }
            });
        });

        if (refs.size > 0) {
            crossRefs[index.id] = {
                id: index.id,
                relatedContent: Array.from(refs).slice(0, 20)  // Limit to top 20
            };
        }
    });

    return crossRefs;
}

/**
 * Process all parsed data files
 */
function processAllParsedData() {
    console.log('🔍 Creating search indexes...\n');

    const allIndexes = [];
    const stats = {
        byContentType: {},
        byMythology: {},
        totalTokens: new Set(),
        totalTags: new Set()
    };

    // Find all parsed JSON files
    const parsedFiles = fs.readdirSync(PARSED_DATA_DIR)
        .filter(f => f.endsWith('_parsed.json'));

    console.log(`📁 Found ${parsedFiles.length} parsed data files\n`);

    parsedFiles.forEach(filename => {
        const filePath = path.join(PARSED_DATA_DIR, filename);
        const contentType = filename.replace('_parsed.json', '');

        // Skip if it's the deities file (already processed)
        // Actually, let's include it for complete indexing
        console.log(`   Processing ${contentType}...`);

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const items = data.items || data.deities || [];

            if (!stats.byContentType[contentType]) {
                stats.byContentType[contentType] = 0;
            }

            items.forEach(item => {
                const indexEntry = createSearchIndexEntry(item, contentType);
                allIndexes.push(indexEntry);

                // Update stats
                stats.byContentType[contentType]++;

                if (!stats.byMythology[indexEntry.mythology]) {
                    stats.byMythology[indexEntry.mythology] = 0;
                }
                stats.byMythology[indexEntry.mythology]++;

                indexEntry.searchTokens.forEach(token => stats.totalTokens.add(token));
                indexEntry.tags.forEach(tag => stats.totalTags.add(tag));
            });

            console.log(`      ✅ Indexed ${items.length} ${contentType}`);

        } catch (error) {
            console.error(`      ❌ Error processing ${filename}:`, error.message);
        }
    });

    return { allIndexes, stats };
}

/**
 * Generate search statistics
 */
function generateSearchStats(allIndexes, stats) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SEARCH INDEX STATISTICS');
    console.log('='.repeat(80));

    console.log(`\n📝 Total Indexed Items: ${allIndexes.length}`);
    console.log(`🔤 Unique Search Tokens: ${stats.totalTokens.size}`);
    console.log(`🏷️  Unique Tags: ${stats.totalTags.size}`);

    console.log('\n📑 By Content Type:');
    Object.entries(stats.byContentType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            console.log(`   ${type.padEnd(20)} ${count.toString().padStart(6)} items`);
        });

    console.log('\n🌍 By Mythology:');
    Object.entries(stats.byMythology)
        .sort((a, b) => b[1] - a[1])
        .forEach(([mythology, count]) => {
            console.log(`   ${mythology.padEnd(20)} ${count.toString().padStart(6)} items`);
        });

    // Quality distribution
    const qualityBuckets = {
        'Excellent (80-100)': 0,
        'Good (60-79)': 0,
        'Fair (40-59)': 0,
        'Poor (0-39)': 0
    };

    allIndexes.forEach(index => {
        if (index.qualityScore >= 80) qualityBuckets['Excellent (80-100)']++;
        else if (index.qualityScore >= 60) qualityBuckets['Good (60-79)']++;
        else if (index.qualityScore >= 40) qualityBuckets['Fair (40-59)']++;
        else qualityBuckets['Poor (0-39)']++;
    });

    console.log('\n⭐ Quality Distribution:');
    Object.entries(qualityBuckets).forEach(([range, count]) => {
        const percentage = ((count / allIndexes.length) * 100).toFixed(1);
        console.log(`   ${range.padEnd(20)} ${count.toString().padStart(6)} (${percentage}%)`);
    });

    console.log('\n' + '='.repeat(80));
}

/**
 * Save search indexes
 */
function saveSearchIndexes(allIndexes, crossRefs, stats) {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save main search index
    const mainIndexPath = path.join(OUTPUT_DIR, 'search_index.json');
    fs.writeFileSync(mainIndexPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalEntries: allIndexes.length,
        indexes: allIndexes
    }, null, 2));
    console.log(`\n💾 Main index saved: ${mainIndexPath}`);

    // Save cross-references
    const crossRefPath = path.join(OUTPUT_DIR, 'cross_references.json');
    fs.writeFileSync(crossRefPath, JSON.stringify(crossRefs, null, 2));
    console.log(`💾 Cross-references saved: ${crossRefPath}`);

    // Save statistics
    const statsPath = path.join(OUTPUT_DIR, 'index_stats.json');
    fs.writeFileSync(statsPath, JSON.stringify({
        ...stats,
        totalTokens: Array.from(stats.totalTokens),
        totalTags: Array.from(stats.totalTags),
        generatedAt: new Date().toISOString()
    }, null, 2));
    console.log(`💾 Statistics saved: ${statsPath}`);

    // Create Firestore-ready format
    const firestorePath = path.join(OUTPUT_DIR, 'firestore_search_index.json');
    const firestoreIndexes = allIndexes.map(index => ({
        id: index.id,
        ...index,
        _collection: 'search_index'
    }));
    fs.writeFileSync(firestorePath, JSON.stringify(firestoreIndexes, null, 2));
    console.log(`💾 Firestore index saved: ${firestorePath}`);

    // Create autocomplete dictionary
    const autocompleteDict = {};
    allIndexes.forEach(index => {
        index.autocompletePrefixes.forEach(prefix => {
            if (!autocompleteDict[prefix]) {
                autocompleteDict[prefix] = [];
            }
            autocompleteDict[prefix].push({
                id: index.id,
                name: index.displayName,
                type: index.contentType,
                mythology: index.mythology
            });
        });
    });

    const autocompletePath = path.join(OUTPUT_DIR, 'autocomplete_dictionary.json');
    fs.writeFileSync(autocompletePath, JSON.stringify(autocompleteDict, null, 2));
    console.log(`💾 Autocomplete dictionary saved: ${autocompletePath}`);
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting search index creation...\n');

    // Process all parsed data
    const { allIndexes, stats } = processAllParsedData();

    // Create cross-references
    console.log('\n🔗 Creating cross-references...');
    const crossRefs = createCrossReferences(allIndexes);
    console.log(`   ✅ Created ${Object.keys(crossRefs).length} cross-reference maps`);

    // Generate statistics
    generateSearchStats(allIndexes, stats);

    // Save all indexes
    saveSearchIndexes(allIndexes, crossRefs, stats);

    console.log('\n✨ Search index creation complete!\n');
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}

module.exports = {
    createSearchIndexEntry,
    createCrossReferences,
    tokenize
};
