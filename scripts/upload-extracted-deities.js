#!/usr/bin/env node

/**
 * Upload Extracted Deity Data to Firebase
 *
 * Uploads data from pilot_deity_extraction.json to Firestore
 * Structure: deities/{mythology}/entities/{entityId}
 *
 * Usage:
 *   node upload-extracted-deities.js --dry-run
 *   node upload-extracted-deities.js --mythology greek --limit 10
 *   node upload-extracted-deities.js --upload
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
    inputFile: args.includes('--input') ? args[args.indexOf('--input') + 1] : 'pilot_deity_extraction.json',
    mythology: args.includes('--mythology') ? args[args.indexOf('--mythology') + 1] : null,
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null
};

class DeityUploader {
    constructor(config) {
        this.config = config;
        this.stats = {
            total: 0,
            uploaded: 0,
            skipped: 0,
            errors: 0,
            byMythology: {}
        };
    }

    async run() {
        console.log('\n' + '═'.repeat(70));
        console.log('🔥 FIREBASE DEITY UPLOAD TOOL');
        console.log('═'.repeat(70));
        console.log(`Mode: ${this.config.dryRun ? '🔍 DRY RUN (no data will be uploaded)' : '✅ LIVE UPLOAD'}`);
        console.log(`Input: ${this.config.inputFile}`);
        if (this.config.mythology) console.log(`Filter: ${this.config.mythology} mythology only`);
        if (this.config.limit) console.log(`Limit: First ${this.config.limit} deities`);
        console.log('─'.repeat(70));

        // Load JSON data
        const filePath = path.join(__dirname, this.config.inputFile);
        if (!fs.existsSync(filePath)) {
            console.error(`\n❌ Error: File not found: ${filePath}\n`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        let deities = JSON.parse(rawData);

        // Apply filters
        if (this.config.mythology) {
            deities = deities.filter(d => d.mythology === this.config.mythology);
        }

        if (this.config.limit) {
            deities = deities.slice(0, this.config.limit);
        }

        this.stats.total = deities.length;
        console.log(`\nFound ${deities.length} deities to upload\n`);

        // Upload in batches of 10
        for (let i = 0; i < deities.length; i += 10) {
            const batch = deities.slice(i, i + 10);
            await this.uploadBatch(batch, i);
        }

        this.printSummary();
    }

    async uploadBatch(deities, startIndex) {
        const promises = deities.map((deity, idx) =>
            this.uploadDeity(deity, startIndex + idx + 1)
        );
        await Promise.all(promises);
    }

    async uploadDeity(deity, index) {
        const mythology = deity.mythology;
        const entityId = deity.entityId;

        if (!mythology || !entityId) {
            console.log(`⚠️  [${index}/${this.stats.total}] Skipping deity with missing metadata: ${deity.name}`);
            this.stats.skipped++;
            return;
        }

        try {
            // Firestore document path
            const docPath = `deities/${mythology}/entities/${entityId}`;

            // Prepare document data
            const firestoreDoc = {
                // Basic info
                name: deity.name || 'Unknown',
                icon: deity.icon || '⭐',
                subtitle: deity.subtitle || '',
                description: deity.description || '',

                // Entity metadata
                entityType: deity.entityType || 'deity',
                mythology: mythology,
                entityId: entityId,
                filePath: deity.filePath || '',

                // Content sections
                attributes: deity.attributes || {},
                myths: deity.myths || [],
                relationships: deity.relationships || {
                    family: {},
                    connections: []
                },
                worship: deity.worship || {
                    sacredSites: '',
                    festivals: [],
                    offerings: '',
                    prayers: ''
                },
                sources: deity.sources || [],

                // Metadata for tracking
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                migrationBatch: 'pilot-extraction-2025-12-20',
                extractedFrom: deity.filePath || '',

                // Search and indexing
                searchTerms: this.generateSearchTerms(deity),

                // User submission support
                allowUserEdits: true,
                allowUserMyths: true,
                moderationRequired: true
            };

            if (this.config.dryRun) {
                console.log(`✓ [${index}/${this.stats.total}] [DRY RUN] ${mythology}/${entityId} - ${deity.name}`);
            } else {
                await db.doc(docPath).set(firestoreDoc, { merge: true });
                console.log(`✓ [${index}/${this.stats.total}] Uploaded ${mythology}/${entityId} - ${deity.name}`);
            }

            this.stats.uploaded++;
            this.stats.byMythology[mythology] = (this.stats.byMythology[mythology] || 0) + 1;

        } catch (error) {
            console.error(`❌ [${index}/${this.stats.total}] Error: ${mythology}/${entityId} - ${error.message}`);
            this.stats.errors++;
        }
    }

    generateSearchTerms(deity) {
        const terms = new Set();

        // Add basic terms
        if (deity.name) {
            terms.add(deity.name.toLowerCase());
            // Add individual words from name
            deity.name.toLowerCase().split(/\s+/).forEach(word => terms.add(word));
        }

        if (deity.mythology) terms.add(deity.mythology);
        if (deity.entityId) terms.add(deity.entityId);

        // Add attribute values as search terms
        if (deity.attributes) {
            Object.values(deity.attributes).forEach(value => {
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

        console.log('═'.repeat(70));

        if (this.config.dryRun) {
            console.log('\n💡 This was a DRY RUN. No data was uploaded to Firebase.');
            console.log('   To perform actual upload, run with --upload flag:');
            console.log(`   node ${path.basename(__filename)} --upload\n`);
        } else {
            console.log('\n✅ Upload complete! Data is now live in Firestore.');
            console.log('\n🔍 Verify in Firebase Console:');
            console.log('   https://console.firebase.google.com/project/eyesofazrael/firestore\n');
        }
    }
}

// Main execution
async function main() {
    try {
        const uploader = new DeityUploader(config);
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

module.exports = { DeityUploader };
