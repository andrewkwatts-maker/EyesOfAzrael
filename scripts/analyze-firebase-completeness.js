#!/usr/bin/env node

/**
 * Firebase Data Completeness Analyzer
 *
 * Analyzes all entities in Firebase to find:
 * - Missing required fields
 * - Empty or sparse data
 * - Entities needing enrichment
 * - Standardization issues
 */

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Required fields for each entity type (using actual Firebase field names)
const requiredFields = {
    common: ['id', 'name', 'mythology', 'description'],
    deity: ['domains', 'symbols'],
    cosmology: ['type'],
    hero: ['feats'],
    creature: ['abilities'],
    ritual: [],
    herb: [],
    concept: [],
    figure: [],
    symbol: [],
    text: [],
    location: [],
    magic: []
};

// Recommended fields for rich content (using actual Firebase field names)
const recommendedFields = {
    all: ['primarySources', 'relationships'],
    deity: ['epithets', 'alternateNames', 'archetypes'],
    cosmology: ['layers', 'features', 'connections'],
    hero: ['companions', 'weapons', 'quests'],
    creature: ['habitat', 'symbolism'],
    ritual: ['materials', 'participants'],
    herb: ['preparation', 'cultivation'],
    concept: ['applications'],
    text: ['chapters']
};

class CompletenessAnalyzer {
    constructor() {
        this.stats = {
            totalEntities: 0,
            byType: {},
            byMythology: {},
            incomplete: [],
            missingRecommended: [],
            sparse: []
        };
    }

    async analyze() {
        console.log('\n' + '='.repeat(80));
        console.log('FIREBASE DATA COMPLETENESS ANALYSIS');
        console.log('='.repeat(80) + '\n');

        try {
            // Get all root-level entity type collections
            const entityTypes = ['deities', 'cosmology', 'heroes', 'creatures', 'rituals',
                               'herbs', 'concepts', 'figures', 'symbols', 'texts',
                               'locations', 'magic', 'path'];

            for (const collectionName of entityTypes) {
                // Map plural collection names to singular entity types
                const entityType = this.mapCollectionToType(collectionName);

                try {
                    const entitiesSnapshot = await db.collection(collectionName).get();

                    if (entitiesSnapshot.size === 0) {
                        console.log(`\nSkipping ${collectionName} (empty)`);
                        continue;
                    }

                    console.log(`\nAnalyzing ${collectionName}: ${entitiesSnapshot.size} entities`);

                    for (const doc of entitiesSnapshot.docs) {
                        const data = doc.data();
                        const mythology = data.mythology || 'unknown';
                        await this.analyzeEntity(doc, mythology, entityType);
                    }
                } catch (error) {
                    console.log(`  ⚠️ Collection ${collectionName} not found or inaccessible`);
                }
            }

            this.printReport();
            this.saveReport();

        } catch (error) {
            console.error('Error analyzing Firebase:', error);
        }
    }

    mapCollectionToType(collectionName) {
        const mapping = {
            'deities': 'deity',
            'cosmology': 'cosmology',
            'heroes': 'hero',
            'creatures': 'creature',
            'rituals': 'ritual',
            'herbs': 'herb',
            'concepts': 'concept',
            'figures': 'figure',
            'symbols': 'symbol',
            'texts': 'text',
            'locations': 'location',
            'magic': 'magic',
            'path': 'path'
        };
        return mapping[collectionName] || collectionName;
    }

    async analyzeEntity(doc, mythology, entityType) {
        const data = doc.data();
        const entityId = doc.id;

        this.stats.totalEntities++;

        // Track by type
        if (!this.stats.byType[entityType]) {
            this.stats.byType[entityType] = 0;
        }
        this.stats.byType[entityType]++;

        // Track by mythology
        if (!this.stats.byMythology[mythology]) {
            this.stats.byMythology[mythology] = 0;
        }
        this.stats.byMythology[mythology]++;

        // Check for missing required fields
        const missingRequired = this.checkRequiredFields(data, entityType);
        if (missingRequired.length > 0) {
            this.stats.incomplete.push({
                mythology,
                entityType,
                id: entityId,
                name: data.name || entityId,
                missing: missingRequired
            });
        }

        // Check for missing recommended fields
        const missingRecommended = this.checkRecommendedFields(data, entityType);
        if (missingRecommended.length > 0) {
            this.stats.missingRecommended.push({
                mythology,
                entityType,
                id: entityId,
                name: data.name || entityId,
                missing: missingRecommended
            });
        }

        // Check for sparse content
        const sparseFields = this.checkSparseContent(data, entityType);
        if (sparseFields.length > 0) {
            this.stats.sparse.push({
                mythology,
                entityType,
                id: entityId,
                name: data.name || entityId,
                sparse: sparseFields
            });
        }
    }

    checkRequiredFields(data, entityType) {
        const missing = [];

        // Check common required fields
        for (const field of requiredFields.common) {
            if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
                missing.push(field);
            }
        }

        // Check type-specific required fields
        const typeFields = requiredFields[entityType] || [];
        for (const field of typeFields) {
            // For content fields like 'feats', missing entirely is a problem but empty array is OK
            if (field === 'feats' || field === 'abilities') {
                if (data[field] === undefined || data[field] === null) {
                    missing.push(field);
                }
            } else {
                if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
                    missing.push(field);
                }
            }
        }

        return missing;
    }

    checkRecommendedFields(data, entityType) {
        const missing = [];

        // Check common recommended fields
        for (const field of recommendedFields.all) {
            if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
                missing.push(field);
            }
        }

        // Check type-specific recommended fields
        const typeFields = recommendedFields[entityType] || [];
        for (const field of typeFields) {
            if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
                missing.push(field);
            }
        }

        return missing;
    }

    checkSparseContent(data, entityType) {
        const sparse = [];

        // Check if description is too short or missing
        if (!data.description || data.description.length < 50) {
            sparse.push('description (< 50 chars or missing)');
        }

        // Check type-specific content depth
        if (entityType === 'deity' && (!data.domains || data.domains.length < 2)) {
            sparse.push('domains (< 2 domains)');
        }
        if (entityType === 'hero' && (!data.feats || data.feats.length < 1)) {
            sparse.push('feats (no achievements)');
        }
        if (entityType === 'creature' && (!data.abilities || data.abilities.length < 2)) {
            sparse.push('abilities (< 2 powers)');
        }

        return sparse;
    }

    printReport() {
        console.log('\n' + '='.repeat(80));
        console.log('COMPLETENESS REPORT');
        console.log('='.repeat(80));

        console.log(`\nTotal Entities Analyzed: ${this.stats.totalEntities}`);

        console.log('\nBy Entity Type:');
        for (const [type, count] of Object.entries(this.stats.byType).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${type}: ${count}`);
        }

        console.log('\nBy Mythology:');
        for (const [myth, count] of Object.entries(this.stats.byMythology).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${myth}: ${count}`);
        }

        console.log(`\n🔴 INCOMPLETE (Missing Required Fields): ${this.stats.incomplete.length}`);
        if (this.stats.incomplete.length > 0) {
            console.log('\nTop 10 Incomplete Entities:');
            this.stats.incomplete.slice(0, 10).forEach(item => {
                console.log(`  - ${item.mythology}/${item.entityType}/${item.id}`);
                console.log(`    Missing: ${item.missing.join(', ')}`);
            });
        }

        console.log(`\n🟡 SPARSE CONTENT: ${this.stats.sparse.length}`);
        if (this.stats.sparse.length > 0) {
            console.log('\nTop 10 Sparse Entities:');
            this.stats.sparse.slice(0, 10).forEach(item => {
                console.log(`  - ${item.mythology}/${item.entityType}/${item.id}`);
                console.log(`    Sparse: ${item.sparse.join(', ')}`);
            });
        }

        console.log(`\n🟢 MISSING RECOMMENDED: ${this.stats.missingRecommended.length}`);

        console.log('\n' + '='.repeat(80));

        // Summary percentages
        const completeCount = this.stats.totalEntities - this.stats.incomplete.length;
        const completePercent = ((completeCount / this.stats.totalEntities) * 100).toFixed(1);

        console.log(`\nCOMPLETENESS RATE: ${completePercent}% (${completeCount}/${this.stats.totalEntities})`);
        console.log('='.repeat(80) + '\n');
    }

    saveReport() {
        const report = {
            analyzedDate: new Date().toISOString(),
            totalEntities: this.stats.totalEntities,
            completenessRate: ((this.stats.totalEntities - this.stats.incomplete.length) / this.stats.totalEntities * 100).toFixed(1) + '%',
            byType: this.stats.byType,
            byMythology: this.stats.byMythology,
            incomplete: this.stats.incomplete,
            sparse: this.stats.sparse,
            missingRecommended: this.stats.missingRecommended
        };

        fs.writeFileSync('firebase_completeness_report.json', JSON.stringify(report, null, 2));
        console.log('📁 Full report saved to: firebase_completeness_report.json\n');
    }
}

// Run analysis
async function main() {
    const analyzer = new CompletenessAnalyzer();
    await analyzer.analyze();
    process.exit(0);
}

main().catch(console.error);
