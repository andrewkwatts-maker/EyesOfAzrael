#!/usr/bin/env node

/**
 * Universal Entity Upload Script for Firebase
 *
 * Uploads any entity type (deity, cosmology, hero, creature, ritual, etc.) to Firestore
 *
 * Usage:
 *   node upload-entities.js --input cosmology_extraction.json --type cosmology --dry-run
 *   node upload-entities.js --input cosmology_extraction.json --type cosmology --upload
 *   node upload-entities.js --input heroes_extraction.json --type hero --upload
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
    dryRun: !args.includes('--upload'),
    inputFile: args.includes('--input') ? args[args.indexOf('--input') + 1] : null,
    entityType: args.includes('--type') ? args[args.indexOf('--type') + 1] : null,
    mythology: args.includes('--mythology') ? args[args.indexOf('--mythology') + 1] : null,
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null
};

class EntityUploader {
    constructor(config) {
        this.config = config;
        this.stats = {
            total: 0,
            uploaded: 0,
            skipped: 0,
            errors: 0,
            byMythology: {},
            byType: {}
        };
    }

    async run() {
        console.log('\n' + '═'.repeat(70));
        console.log('🔥 FIREBASE ENTITY UPLOAD TOOL');
        console.log('═'.repeat(70));
        console.log(`Mode: ${this.config.dryRun ? '🔍 DRY RUN (no data will be uploaded)' : '✅ LIVE UPLOAD'}`);
        console.log(`Input: ${this.config.inputFile}`);
        if (this.config.entityType) console.log(`Type Filter: ${this.config.entityType}`);
        if (this.config.mythology) console.log(`Mythology Filter: ${this.config.mythology}`);
        if (this.config.limit) console.log(`Limit: First ${this.config.limit} entities`);
        console.log('─'.repeat(70));

        // Load JSON data
        const filePath = path.join(__dirname, this.config.inputFile);
        if (!fs.existsSync(filePath)) {
            console.error(`\n❌ Error: File not found: ${filePath}\n`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        let entities = JSON.parse(rawData);

        // Apply filters
        if (this.config.entityType) {
            entities = entities.filter(e => e.entityType === this.config.entityType);
        }

        if (this.config.mythology) {
            entities = entities.filter(e => e.mythology === this.config.mythology);
        }

        if (this.config.limit) {
            entities = entities.slice(0, this.config.limit);
        }

        this.stats.total = entities.length;
        console.log(`\nFound ${entities.length} entities to upload\n`);

        // Upload in batches of 10
        for (let i = 0; i < entities.length; i += 10) {
            const batch = entities.slice(i, i + 10);
            await this.uploadBatch(batch, i);
        }

        this.printSummary();
    }

    async uploadBatch(entities, startIndex) {
        const promises = entities.map((entity, idx) =>
            this.uploadEntity(entity, startIndex + idx + 1)
        );
        await Promise.all(promises);
    }

    async uploadEntity(entity, index) {
        const mythology = entity.mythology;
        const entityId = entity.id;
        const entityType = entity.entityType;

        if (!mythology || !entityId || !entityType) {
            console.log(`⚠️  [${index}/${this.stats.total}] Skipping entity with missing metadata`);
            this.stats.skipped++;
            return;
        }

        try {
            // Determine collection path based on entity type
            const collectionPath = this.getCollectionPath(entityType, mythology);
            const docPath = `${collectionPath}/${entityId}`;

            // Prepare Firestore document
            const firestoreDoc = {
                // Core identity
                id: entity.id,
                entityType: entity.entityType,
                mythology: entity.mythology,
                mythologies: entity.mythologies || [entity.mythology],

                // Display
                name: entity.name || 'Unknown',
                icon: entity.icon || '⭐',
                title: entity.title || entity.name,
                subtitle: entity.subtitle || '',
                shortDescription: entity.shortDescription || '',
                longDescription: entity.longDescription || '',

                // Metadata
                slug: entity.slug || entity.id,
                filePath: entity.filePath || '',
                status: entity.status || 'published',
                visibility: entity.visibility || 'public',

                // Extended metadata
                timeperiod: entity.timeperiod || null,
                geography: entity.geography || null,
                cultural: entity.cultural || null,

                // Search & discovery
                searchTerms: this.generateSearchTerms(entity),
                tags: entity.tags || [],
                categories: entity.categories || [],

                // Relationships
                relatedDeities: entity.relatedDeities || [],
                relatedHeroes: entity.relatedHeroes || [],
                relatedCreatures: entity.relatedCreatures || [],
                relatedPlaces: entity.relatedPlaces || [],
                relatedConcepts: entity.relatedConcepts || [],
                relatedRituals: entity.relatedRituals || [],
                relatedTexts: entity.relatedTexts || [],

                // Content
                sections: entity.sections || [],
                attributes: entity.attributes || {},

                // Media
                media: entity.media || [],
                featuredImage: entity.featuredImage || '',
                gallery: entity.gallery || [],
                diagrams: entity.diagrams || [],

                // Sources
                sources: entity.sources || [],
                references: entity.references || [],

                // Type-specific data
                ...this.getTypeSpecificData(entity),

                // User interaction
                allowUserEdits: entity.allowUserEdits !== false,
                allowUserContent: entity.allowUserContent !== false,
                moderationRequired: entity.moderationRequired !== false,

                // Timestamps
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                migrationBatch: `phase3-cosmology-2025-12-20`,
                extractedFrom: entity.filePath || '',
                dataVersion: 1.1  // Updated schema version
            };

            if (this.config.dryRun) {
                console.log(`✓ [${index}/${this.stats.total}] [DRY RUN] ${entityType}/${mythology}/${entityId} - ${entity.name}`);
            } else {
                await db.doc(docPath).set(firestoreDoc, { merge: true });
                console.log(`✓ [${index}/${this.stats.total}] Uploaded ${entityType}/${mythology}/${entityId} - ${entity.name}`);
            }

            this.stats.uploaded++;
            this.stats.byMythology[mythology] = (this.stats.byMythology[mythology] || 0) + 1;
            this.stats.byType[entityType] = (this.stats.byType[entityType] || 0) + 1;

        } catch (error) {
            console.error(`❌ [${index}/${this.stats.total}] Error: ${mythology}/${entityId} - ${error.message}`);
            this.stats.errors++;
        }
    }

    getCollectionPath(entityType, mythology) {
        /**
         * Determine Firestore collection path
         * Structure: entities/{mythology}/{entityType}/{id}
         */
        return `entities/${mythology}/${entityType}`;
    }

    getTypeSpecificData(entity) {
        /**
         * Extract type-specific fields based on entity type
         */
        const typeData = {};

        switch (entity.entityType) {
            case 'cosmology':
                typeData.cosmologyType = entity.cosmologyType || 'concept';
                typeData.timeline = entity.timeline || [];
                typeData.structure = entity.structure || {};
                typeData.principles = entity.principles || [];
                break;

            case 'deity':
                typeData.myths = entity.myths || [];
                typeData.relationships = entity.relationships || {};
                typeData.worship = entity.worship || {};
                typeData.powers = entity.powers || [];
                typeData.epithets = entity.epithets || [];
                break;

            case 'hero':
                typeData.biography = entity.biography || {};
                typeData.deeds = entity.deeds || [];
                typeData.powers = entity.powers || [];
                typeData.weaknesses = entity.weaknesses || [];
                break;

            case 'creature':
                typeData.creatureType = entity.creatureType || 'monster';
                typeData.physicalDescription = entity.physicalDescription || {};
                typeData.encounters = entity.encounters || [];
                typeData.symbolism = entity.symbolism || '';
                break;

            case 'ritual':
                typeData.ritualType = entity.ritualType || 'ceremony';
                typeData.procedure = entity.procedure || [];
                typeData.requirements = entity.requirements || {};
                typeData.significance = entity.significance || {};
                break;
        }

        return typeData;
    }

    generateSearchTerms(entity) {
        const terms = new Set();

        // Add basic terms
        if (entity.name) {
            terms.add(entity.name.toLowerCase());
            entity.name.toLowerCase().split(/\s+/).forEach(word => terms.add(word));
        }

        if (entity.mythology) terms.add(entity.mythology);
        if (entity.entityType) terms.add(entity.entityType);

        // Add from tags
        entity.tags?.forEach(tag => terms.add(tag.toLowerCase()));

        // Add from attributes
        if (entity.attributes) {
            Object.values(entity.attributes).forEach(value => {
                if (typeof value === 'string') {
                    value.toLowerCase().split(/[,\s]+/).forEach(term => {
                        if (term.length > 2) terms.add(term);
                    });
                }
            });
        }

        return Array.from(terms);
    }

    printSummary() {
        console.log('\n' + '═'.repeat(70));
        console.log('📊 UPLOAD SUMMARY');
        console.log('═'.repeat(70));
        console.log(`Total processed:        ${this.stats.total}`);
        console.log(`Successfully uploaded:  ${this.stats.uploaded}`);
        console.log(`Skipped:                ${this.stats.skipped}`);
        console.log(`Errors:                 ${this.stats.errors}`);

        console.log('\n📈 By Mythology:');
        Object.entries(this.stats.byMythology)
            .sort((a, b) => b[1] - a[1])
            .forEach(([myth, count]) => {
                const bar = '█'.repeat(Math.ceil(count / 2));
                console.log(`  ${myth.padEnd(15)} ${count.toString().padStart(3)} ${bar}`);
            });

        console.log('\n📊 By Type:');
        Object.entries(this.stats.byType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                const bar = '█'.repeat(Math.ceil(count / 2));
                console.log(`  ${type.padEnd(15)} ${count.toString().padStart(3)} ${bar}`);
            });

        console.log('═'.repeat(70));

        if (this.config.dryRun) {
            console.log('\n💡 This was a DRY RUN. No data was uploaded to Firebase.');
            console.log('   To perform actual upload, run with --upload flag:');
            console.log(`   node ${path.basename(__filename)} --input ${this.config.inputFile} --upload\n`);
        } else {
            console.log('\n✅ Upload complete! Data is now live in Firestore.');
            console.log('\n🔍 Verify in Firebase Console:');
            console.log('   https://console.firebase.google.com/project/eyesofazrael/firestore\n');
        }
    }
}

// Main execution
async function main() {
    if (!config.inputFile) {
        console.error('\n❌ Error: --input file is required\n');
        console.log('Usage: node upload-entities.js --input <file.json> [--type <type>] [--upload]');
        process.exit(1);
    }

    try {
        const uploader = new EntityUploader(config);
        await uploader.run();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { EntityUploader };
