/**
 * Batch Icon Generation Script
 * Eyes of Azrael Project
 *
 * Queries Firebase for entities missing icons and generates them automatically
 * using the AIIconGenerator system.
 *
 * Usage:
 * - Run in browser console on any authenticated page
 * - Or include in Node.js environment with Firebase Admin SDK
 *
 * Features:
 * - Query entities without icons
 * - Batch generation with progress tracking
 * - Automatic upload to Firebase
 * - Detailed reporting
 * - Error recovery
 */

(function() {
    'use strict';

    /**
     * Batch Icon Generator Class
     */
    class BatchIconGenerator {
        constructor() {
            this.generator = null;
            this.db = null;
            this.auth = null;
            this.stats = {
                total: 0,
                processed: 0,
                successful: 0,
                failed: 0,
                skipped: 0,
                errors: []
            };
            this.results = [];
        }

        /**
         * Initialize Firebase and generator
         */
        async initialize() {
            console.log('🚀 Initializing Batch Icon Generator...');

            // Check for Firebase
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase not loaded. Please ensure Firebase SDK is included.');
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('Not authenticated. Please sign in first.');
            }

            console.log(`✅ Authenticated as: ${user.email}`);

            // Check for AIIconGenerator
            if (typeof AIIconGenerator === 'undefined') {
                throw new Error('AIIconGenerator not loaded. Please include ai-icon-generator.js');
            }

            this.generator = new AIIconGenerator();
            console.log('✅ AIIconGenerator initialized');

            return true;
        }

        /**
         * Query entities missing icons
         * @param {Object} options - Query options
         * @returns {Promise<Array>} Entities without icons
         */
        async queryEntitiesWithoutIcons(options = {}) {
            const {
                mythology = null,
                entityType = null,
                limit = 100
            } = options;

            console.log('🔍 Querying entities without icons...');

            const collections = [
                'deities',
                'heroes',
                'creatures',
                'items',
                'places',
                'concepts',
                'magicSystems',
                'rituals',
                'symbols'
            ];

            const entitiesWithoutIcons = [];

            for (const collection of collections) {
                try {
                    let query = this.db.collection(collection);

                    // Filter by mythology if specified
                    if (mythology) {
                        query = query.where('mythology', '==', mythology);
                    }

                    // Get entities
                    const snapshot = await query.limit(limit).get();

                    snapshot.forEach(doc => {
                        const data = doc.data();

                        // Check if icon is missing or empty
                        if (!data.icon || data.icon.trim() === '') {
                            entitiesWithoutIcons.push({
                                id: doc.id,
                                collection,
                                ...data,
                                type: this.getTypeFromCollection(collection)
                            });
                        }
                    });

                } catch (error) {
                    console.warn(`⚠️ Error querying ${collection}:`, error.message);
                }
            }

            console.log(`✅ Found ${entitiesWithoutIcons.length} entities without icons`);
            return entitiesWithoutIcons;
        }

        /**
         * Get entity type from collection name
         */
        getTypeFromCollection(collection) {
            const typeMap = {
                'deities': 'deity',
                'heroes': 'hero',
                'creatures': 'creature',
                'items': 'item',
                'places': 'place',
                'concepts': 'concept',
                'magicSystems': 'magic',
                'rituals': 'ritual',
                'symbols': 'symbol'
            };
            return typeMap[collection] || 'entity';
        }

        /**
         * Generate icons for entities
         * @param {Array} entities - Entities to process
         * @param {Function} progressCallback - Progress callback
         * @returns {Promise<Object>} Results summary
         */
        async generateIcons(entities, progressCallback = null) {
            console.log(`🎨 Starting icon generation for ${entities.length} entities...`);

            this.stats.total = entities.length;
            this.stats.processed = 0;
            this.stats.successful = 0;
            this.stats.failed = 0;

            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];

                try {
                    // Generate icon
                    const result = this.generator.generateWithOptions(entity, {
                        style: 'symbolic',
                        size: 64,
                        colorScheme: 'auto'
                    });

                    if (result.success) {
                        // Upload to Firebase
                        await this.uploadIcon(entity, result.svgCode);

                        this.stats.successful++;
                        this.results.push({
                            entityId: entity.id,
                            entityName: entity.name,
                            collection: entity.collection,
                            status: 'success'
                        });

                        console.log(`✅ [${i + 1}/${entities.length}] Generated icon for ${entity.name}`);
                    } else {
                        this.stats.failed++;
                        this.results.push({
                            entityId: entity.id,
                            entityName: entity.name,
                            collection: entity.collection,
                            status: 'failed',
                            error: result.error
                        });

                        console.error(`❌ [${i + 1}/${entities.length}] Failed for ${entity.name}: ${result.error}`);
                    }

                } catch (error) {
                    this.stats.failed++;
                    this.stats.errors.push({
                        entity: entity.name,
                        error: error.message
                    });

                    console.error(`❌ [${i + 1}/${entities.length}] Error for ${entity.name}:`, error);
                }

                this.stats.processed++;

                // Call progress callback
                if (progressCallback) {
                    progressCallback({
                        current: i + 1,
                        total: entities.length,
                        percent: Math.round(((i + 1) / entities.length) * 100),
                        successful: this.stats.successful,
                        failed: this.stats.failed
                    });
                }

                // Small delay to prevent overwhelming Firebase
                await this.delay(100);
            }

            console.log('✅ Icon generation complete!');
            return this.stats;
        }

        /**
         * Upload icon to Firebase
         * @param {Object} entity - Entity data
         * @param {string} svgCode - SVG code
         */
        async uploadIcon(entity, svgCode) {
            try {
                const docRef = this.db.collection(entity.collection).doc(entity.id);

                await docRef.update({
                    icon: svgCode,
                    iconGeneratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    iconGeneratedBy: 'ai-icon-generator'
                });

                return true;
            } catch (error) {
                console.error(`Failed to upload icon for ${entity.name}:`, error);
                throw error;
            }
        }

        /**
         * Generate report
         */
        generateReport() {
            const report = {
                summary: {
                    total: this.stats.total,
                    processed: this.stats.processed,
                    successful: this.stats.successful,
                    failed: this.stats.failed,
                    successRate: this.stats.total > 0
                        ? Math.round((this.stats.successful / this.stats.total) * 100)
                        : 0
                },
                results: this.results,
                errors: this.stats.errors,
                timestamp: new Date().toISOString()
            };

            console.log('\n📊 Generation Report:');
            console.log('═══════════════════════════════════════');
            console.log(`Total Entities:     ${report.summary.total}`);
            console.log(`Successful:         ${report.summary.successful}`);
            console.log(`Failed:             ${report.summary.failed}`);
            console.log(`Success Rate:       ${report.summary.successRate}%`);
            console.log('═══════════════════════════════════════\n');

            if (report.errors.length > 0) {
                console.log('❌ Errors:');
                report.errors.forEach(err => {
                    console.log(`   - ${err.entity}: ${err.error}`);
                });
            }

            return report;
        }

        /**
         * Save report to Firebase
         */
        async saveReport(report) {
            try {
                const reportsRef = this.db.collection('iconGenerationReports');
                await reportsRef.add(report);
                console.log('✅ Report saved to Firebase');
            } catch (error) {
                console.error('❌ Failed to save report:', error);
            }
        }

        /**
         * Delay utility
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Run complete batch process
         * @param {Object} options - Options for querying and generation
         */
        async run(options = {}) {
            try {
                // Initialize
                await this.initialize();

                // Query entities
                const entities = await this.queryEntitiesWithoutIcons(options);

                if (entities.length === 0) {
                    console.log('🎉 No entities found without icons. All done!');
                    return { success: true, message: 'No entities to process' };
                }

                // Generate icons
                const stats = await this.generateIcons(entities, (progress) => {
                    console.log(`Progress: ${progress.percent}% (${progress.current}/${progress.total})`);
                });

                // Generate and save report
                const report = this.generateReport();
                await this.saveReport(report);

                return {
                    success: true,
                    stats,
                    report
                };

            } catch (error) {
                console.error('❌ Batch generation failed:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    /**
     * Quick run function for console
     */
    async function runBatchIconGeneration(options = {}) {
        const generator = new BatchIconGenerator();
        return await generator.run(options);
    }

    /**
     * Generate icons for specific mythology
     */
    async function generateForMythology(mythology) {
        return await runBatchIconGeneration({ mythology });
    }

    /**
     * Generate icons for specific entity type
     */
    async function generateForType(entityType) {
        return await runBatchIconGeneration({ entityType });
    }

    /**
     * Preview what would be generated (dry run)
     */
    async function previewGeneration(options = {}) {
        const generator = new BatchIconGenerator();
        await generator.initialize();
        const entities = await generator.queryEntitiesWithoutIcons(options);

        console.log('\n📋 Preview of entities that would receive icons:');
        console.log('═══════════════════════════════════════');

        const byMythology = {};
        entities.forEach(e => {
            const myth = e.mythology || 'unknown';
            byMythology[myth] = (byMythology[myth] || 0) + 1;
        });

        Object.entries(byMythology).forEach(([myth, count]) => {
            console.log(`${myth}: ${count} entities`);
        });

        console.log('═══════════════════════════════════════');
        console.log(`Total: ${entities.length} entities\n`);

        return entities;
    }

    // Export to window for browser use
    if (typeof window !== 'undefined') {
        window.BatchIconGenerator = BatchIconGenerator;
        window.runBatchIconGeneration = runBatchIconGeneration;
        window.generateForMythology = generateForMythology;
        window.generateForType = generateForType;
        window.previewGeneration = previewGeneration;

        console.log('✅ Batch Icon Generator loaded!');
        console.log('\nUsage:');
        console.log('  - runBatchIconGeneration()                  // Generate all missing icons');
        console.log('  - generateForMythology("greek")             // Generate for specific mythology');
        console.log('  - previewGeneration()                       // Preview what would be generated');
        console.log('  - previewGeneration({ mythology: "norse" }) // Preview for specific mythology\n');
    }

    // Export for Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            BatchIconGenerator,
            runBatchIconGeneration,
            generateForMythology,
            generateForType,
            previewGeneration
        };
    }

})();
