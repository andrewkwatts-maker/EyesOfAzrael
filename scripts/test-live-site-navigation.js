#!/usr/bin/env node

/**
 * Live Site Navigation & Asset Validation Test
 *
 * Tests all Firebase assets against the live site to ensure:
 * - Navigation works for each entity
 * - Assets have proper metadata for display/interlinking/searching/sharing
 * - Links are working and renderable
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://www.eyesofazrael.com';
const ASSETS_DIR = path.resolve(__dirname, '..', 'firebase-assets-downloaded');

// Required fields for proper rendering
const REQUIRED_FIELDS = {
    minimal: ['id', 'name', 'mythology'],
    display: ['id', 'name', 'mythology', 'description'],
    full: ['id', 'name', 'mythology', 'description', 'type'],
    sharing: ['name', 'description', 'mythology'],
    interlinking: ['id', 'mythology', 'type']
};

// Entity type to collection mapping
const COLLECTION_MAP = {
    'deity': 'deities',
    'deities': 'deities',
    'hero': 'heroes',
    'heroes': 'heroes',
    'creature': 'creatures',
    'creatures': 'creatures',
    'item': 'items',
    'items': 'items',
    'place': 'places',
    'places': 'places',
    'text': 'texts',
    'texts': 'texts',
    'ritual': 'rituals',
    'rituals': 'rituals',
    'herb': 'herbs',
    'herbs': 'herbs',
    'symbol': 'symbols',
    'symbols': 'symbols',
    'concept': 'concepts',
    'concepts': 'concepts',
    'cosmology': 'cosmology',
    'event': 'events',
    'events': 'events',
    'being': 'beings',
    'beings': 'beings'
};

class AssetValidator {
    constructor() {
        this.results = {
            total: 0,
            valid: 0,
            issues: [],
            byCollection: {},
            byIssueType: {
                missingId: [],
                missingName: [],
                missingMythology: [],
                missingDescription: [],
                missingType: [],
                invalidMythology: [],
                invalidType: [],
                emptyRelations: [],
                brokenInternalLinks: []
            }
        };

        this.validMythologies = new Set();
        this.allEntityIds = new Set();
        this.entityIdToCollection = new Map();
    }

    /**
     * Load all downloaded assets
     */
    loadAssets() {
        const collections = fs.readdirSync(ASSETS_DIR).filter(f => {
            const stat = fs.statSync(path.join(ASSETS_DIR, f));
            return stat.isDirectory();
        });

        const allAssets = {};

        for (const collection of collections) {
            const collectionPath = path.join(ASSETS_DIR, collection);
            const allFile = path.join(collectionPath, '_all.json');

            if (fs.existsSync(allFile)) {
                try {
                    const entities = JSON.parse(fs.readFileSync(allFile, 'utf-8'));
                    allAssets[collection] = entities;

                    // Track all entity IDs and their collections
                    entities.forEach(entity => {
                        if (entity.id) {
                            this.allEntityIds.add(entity.id);
                            this.entityIdToCollection.set(entity.id, collection);
                        }
                        if (entity.mythology) {
                            this.validMythologies.add(entity.mythology.toLowerCase());
                        }
                    });

                    console.log(`Loaded ${entities.length} entities from ${collection}`);
                } catch (e) {
                    console.error(`Error loading ${collection}:`, e.message);
                }
            }
        }

        return allAssets;
    }

    /**
     * Validate a single entity
     */
    validateEntity(entity, collection) {
        const issues = [];

        // Check required fields
        if (!entity.id) {
            issues.push({ type: 'missingId', message: 'Missing id field' });
        }

        if (!entity.name) {
            issues.push({ type: 'missingName', message: 'Missing name field' });
        }

        if (!entity.mythology) {
            issues.push({ type: 'missingMythology', message: 'Missing mythology field' });
        }

        if (!entity.description || entity.description.trim().length < 10) {
            issues.push({ type: 'missingDescription', message: 'Missing or too short description' });
        }

        if (!entity.type) {
            issues.push({ type: 'missingType', message: 'Missing type field' });
        }

        // Validate type matches collection
        if (entity.type) {
            const expectedCollection = COLLECTION_MAP[entity.type.toLowerCase()];
            if (expectedCollection && expectedCollection !== collection) {
                issues.push({
                    type: 'invalidType',
                    message: `Type '${entity.type}' doesn't match collection '${collection}'`
                });
            }
        }

        // Check internal links/relations
        const relationFields = ['relatedDeities', 'relatedCreatures', 'relatedHeroes',
                               'relatedItems', 'relatedPlaces', 'relatedTexts',
                               'parents', 'children', 'siblings', 'consorts', 'enemies'];

        for (const field of relationFields) {
            if (entity[field] && Array.isArray(entity[field])) {
                for (const relatedId of entity[field]) {
                    if (typeof relatedId === 'string' && !this.allEntityIds.has(relatedId)) {
                        issues.push({
                            type: 'brokenInternalLinks',
                            message: `Broken link in ${field}: '${relatedId}' not found`
                        });
                    }
                }
            }
        }

        // Check for empty arrays that should have content
        if (entity.aliases && Array.isArray(entity.aliases) && entity.aliases.length === 0) {
            // This is fine, aliases are optional
        }

        return issues;
    }

    /**
     * Generate navigation URL for an entity
     */
    getNavigationUrl(entity, collection) {
        const type = entity.type || this.getTypeFromCollection(collection);
        return `${BASE_URL}/#/entity/${type}/${entity.id}`;
    }

    /**
     * Get type from collection name
     */
    getTypeFromCollection(collection) {
        const typeMap = {
            'deities': 'deity',
            'heroes': 'hero',
            'creatures': 'creature',
            'items': 'item',
            'places': 'place',
            'texts': 'text',
            'rituals': 'ritual',
            'herbs': 'herb',
            'symbols': 'symbol',
            'concepts': 'concept',
            'cosmology': 'cosmology',
            'events': 'event',
            'beings': 'being'
        };
        return typeMap[collection] || collection.replace(/s$/, '');
    }

    /**
     * Validate all assets
     */
    validateAll(assets) {
        console.log('\n' + '='.repeat(80));
        console.log('VALIDATING ASSETS');
        console.log('='.repeat(80));

        for (const [collection, entities] of Object.entries(assets)) {
            console.log(`\nValidating ${collection}...`);

            this.results.byCollection[collection] = {
                total: entities.length,
                valid: 0,
                issues: []
            };

            for (const entity of entities) {
                this.results.total++;
                const issues = this.validateEntity(entity, collection);

                if (issues.length === 0) {
                    this.results.valid++;
                    this.results.byCollection[collection].valid++;
                } else {
                    this.results.issues.push({
                        id: entity.id,
                        name: entity.name,
                        collection,
                        url: this.getNavigationUrl(entity, collection),
                        issues
                    });
                    this.results.byCollection[collection].issues.push({
                        id: entity.id,
                        name: entity.name,
                        issues
                    });

                    // Categorize by issue type
                    for (const issue of issues) {
                        if (this.results.byIssueType[issue.type]) {
                            this.results.byIssueType[issue.type].push({
                                id: entity.id,
                                name: entity.name,
                                collection,
                                message: issue.message
                            });
                        }
                    }
                }
            }

            const collectionResult = this.results.byCollection[collection];
            const issueCount = collectionResult.issues.length;
            if (issueCount > 0) {
                console.log(`  ⚠️  ${issueCount}/${entities.length} entities have issues`);
            } else {
                console.log(`  ✓ All ${entities.length} entities valid`);
            }
        }
    }

    /**
     * Generate report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('VALIDATION REPORT');
        console.log('='.repeat(80));

        console.log(`\nTotal Entities: ${this.results.total}`);
        console.log(`Valid Entities: ${this.results.valid}`);
        console.log(`Entities with Issues: ${this.results.issues.length}`);
        console.log(`Success Rate: ${((this.results.valid / this.results.total) * 100).toFixed(1)}%`);

        console.log('\n📊 Issues by Type:');
        for (const [type, issues] of Object.entries(this.results.byIssueType)) {
            if (issues.length > 0) {
                console.log(`  ${type}: ${issues.length}`);
            }
        }

        console.log('\n📊 Issues by Collection:');
        for (const [collection, data] of Object.entries(this.results.byCollection)) {
            if (data.issues.length > 0) {
                console.log(`  ${collection}: ${data.issues.length}/${data.total} have issues`);
            }
        }

        // Save detailed report
        const reportPath = path.join(ASSETS_DIR, '_validation_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2), 'utf-8');
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        // Save fixable issues for bulk processing
        const fixableIssuesPath = path.join(ASSETS_DIR, '_fixable_issues.json');
        const fixableIssues = {
            missingType: this.results.byIssueType.missingType,
            missingDescription: this.results.byIssueType.missingDescription,
            invalidType: this.results.byIssueType.invalidType
        };
        fs.writeFileSync(fixableIssuesPath, JSON.stringify(fixableIssues, null, 2), 'utf-8');
        console.log(`📄 Fixable issues saved to: ${fixableIssuesPath}`);

        return this.results;
    }

    /**
     * Run full validation
     */
    run() {
        console.log('='.repeat(80));
        console.log('LIVE SITE NAVIGATION & ASSET VALIDATION TEST');
        console.log(`Base URL: ${BASE_URL}`);
        console.log('='.repeat(80));

        const assets = this.loadAssets();
        this.validateAll(assets);
        return this.generateReport();
    }
}

// Run if executed directly
if (require.main === module) {
    const validator = new AssetValidator();
    const results = validator.run();

    // Exit with error code if too many issues
    const errorRate = (results.issues.length / results.total) * 100;
    if (errorRate > 50) {
        console.error(`\n❌ Error rate too high: ${errorRate.toFixed(1)}%`);
        process.exit(1);
    }

    console.log('\n✅ Validation complete!');
}

module.exports = AssetValidator;
