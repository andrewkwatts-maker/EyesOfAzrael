#!/usr/bin/env node

/**
 * Download All Firebase Assets
 *
 * Downloads all entities from all Firestore collections to local JSON files
 * for comparison and polishing against original hardcoded HTML pages.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'eyesofazrael'
});

const db = admin.firestore();

class FirebaseAssetDownloader {
    constructor() {
        this.baseDir = path.resolve(__dirname, '..');
        this.outputDir = path.join(this.baseDir, 'firebase-assets-downloaded');
        this.collections = [
            'deities',
            'heroes',
            'cosmology',
            'creatures',
            'rituals',
            'texts',
            'herbs',
            'symbols',
            'magic',
            'path',
            'figures',
            'places',
            'items',
            'beings',
            'angels',
            'teachings',
            'concepts',
            'events'
        ];

        this.stats = {
            totalCollections: 0,
            totalEntities: 0,
            byCollection: {},
            byMythology: {},
            errors: []
        };
    }

    /**
     * Create output directory structure
     */
    setupDirectories() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Create subdirectories for each collection
        this.collections.forEach(collection => {
            const collectionDir = path.join(this.outputDir, collection);
            if (!fs.existsSync(collectionDir)) {
                fs.mkdirSync(collectionDir, { recursive: true });
            }
        });

        console.log(`✓ Created output directory: ${this.outputDir}`);
    }

    /**
     * Download all documents from a collection
     */
    async downloadCollection(collectionName) {
        console.log(`\n📥 Downloading ${collectionName}...`);

        try {
            const snapshot = await db.collection(collectionName).get();
            const entities = [];

            snapshot.forEach(doc => {
                entities.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.stats.byCollection[collectionName] = entities.length;
            this.stats.totalEntities += entities.length;

            // Group by mythology for easier processing
            const byMythology = {};
            entities.forEach(entity => {
                const mythology = entity.mythology || 'unknown';
                if (!byMythology[mythology]) {
                    byMythology[mythology] = [];
                }
                byMythology[mythology].push(entity);

                // Track mythology stats
                if (!this.stats.byMythology[mythology]) {
                    this.stats.byMythology[mythology] = 0;
                }
                this.stats.byMythology[mythology]++;
            });

            // Save complete collection
            const collectionFile = path.join(this.outputDir, collectionName, '_all.json');
            fs.writeFileSync(collectionFile, JSON.stringify(entities, null, 2), 'utf-8');

            // Save by mythology
            Object.entries(byMythology).forEach(([mythology, mythEntities]) => {
                const mythologyFile = path.join(
                    this.outputDir,
                    collectionName,
                    `${mythology}.json`
                );
                fs.writeFileSync(mythologyFile, JSON.stringify(mythEntities, null, 2), 'utf-8');
            });

            // Save individual entity files
            entities.forEach(entity => {
                const entityFile = path.join(
                    this.outputDir,
                    collectionName,
                    `${entity.id}.json`
                );
                fs.writeFileSync(entityFile, JSON.stringify(entity, null, 2), 'utf-8');
            });

            console.log(`  ✓ Downloaded ${entities.length} entities`);
            console.log(`  ✓ Organized into ${Object.keys(byMythology).length} mythologies`);

            return entities;

        } catch (error) {
            console.error(`  ✗ Error downloading ${collectionName}:`, error.message);
            this.stats.errors.push({
                collection: collectionName,
                error: error.message
            });
            return [];
        }
    }

    /**
     * Download all collections
     */
    async downloadAll() {
        console.log('='.repeat(80));
        console.log('FIREBASE ASSET DOWNLOADER');
        console.log('='.repeat(80));

        this.setupDirectories();

        console.log('\n📥 Starting download from Firebase...\n');

        for (const collection of this.collections) {
            await this.downloadCollection(collection);
        }

        this.generateReport();
    }

    /**
     * Generate download report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('DOWNLOAD REPORT');
        console.log('='.repeat(80));

        console.log(`\nTotal Collections: ${Object.keys(this.stats.byCollection).length}`);
        console.log(`Total Entities: ${this.stats.totalEntities}`);

        console.log('\n📊 Entities by Collection:');
        Object.entries(this.stats.byCollection)
            .sort((a, b) => b[1] - a[1])
            .forEach(([collection, count]) => {
                console.log(`  ${collection.padEnd(20)} ${count}`);
            });

        console.log('\n🌍 Entities by Mythology:');
        Object.entries(this.stats.byMythology)
            .sort((a, b) => b[1] - a[1])
            .forEach(([mythology, count]) => {
                console.log(`  ${mythology.padEnd(20)} ${count}`);
            });

        if (this.stats.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.stats.errors.forEach(err => {
                console.log(`  ${err.collection}: ${err.error}`);
            });
        }

        // Save report
        const reportPath = path.join(this.outputDir, '_download_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.stats, null, 2), 'utf-8');

        console.log(`\n📄 Report saved to: ${reportPath}`);
        console.log(`\n✅ All assets downloaded to: ${this.outputDir}`);
        console.log('='.repeat(80) + '\n');
    }
}

// Run if executed directly
if (require.main === module) {
    const downloader = new FirebaseAssetDownloader();
    downloader.downloadAll()
        .then(() => {
            console.log('Download complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Download failed:', error);
            process.exit(1);
        });
}

module.exports = FirebaseAssetDownloader;
