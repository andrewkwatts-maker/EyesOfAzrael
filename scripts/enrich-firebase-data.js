#!/usr/bin/env node

/**
 * Firebase Data Enrichment Tool
 *
 * Systematically fills in missing required fields and sparse data
 * based on the completeness report.
 */

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load completeness report
const report = JSON.parse(fs.readFileSync('firebase_completeness_report.json', 'utf-8'));

class DataEnricher {
    constructor() {
        this.stats = {
            processed: 0,
            enriched: 0,
            errors: []
        };
    }

    async enrichAll() {
        console.log('\n' + '='.repeat(80));
        console.log('FIREBASE DATA ENRICHMENT');
        console.log('='.repeat(80) + '\n');

        // Process incomplete entities first (missing required fields)
        console.log(`\nEnriching ${report.incomplete.length} incomplete entities...\n`);

        for (const entity of report.incomplete) {
            await this.enrichEntity(entity);
        }

        // Process sparse entities (insufficient content)
        console.log(`\n\nEnriching ${report.sparse.length} sparse entities...\n`);

        for (const entity of report.sparse) {
            await this.enrichSparseEntity(entity);
        }

        this.printSummary();
    }

    async enrichEntity(entity) {
        try {
            const { mythology, entityType, id, missing } = entity;

            // Get collection name from entity type
            const collectionName = this.getCollectionName(entityType);
            const docRef = db.collection(collectionName).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                console.log(`  ⚠️ Entity not found: ${id}`);
                return;
            }

            const data = doc.data();
            const updates = {};
            let changed = false;

            // Fill in missing fields
            for (const field of missing) {
                const value = this.generateFieldValue(field, entityType, data);
                if (value !== null) {
                    updates[field] = value;
                    changed = true;
                }
            }

            if (changed) {
                await docRef.update({
                    ...updates,
                    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
                    'metadata.enrichedBy': 'completeness_analyzer'
                });
                this.stats.enriched++;
                console.log(`  ✅ Enriched: ${mythology}/${entityType}/${id}`);
                console.log(`     Added: ${Object.keys(updates).join(', ')}`);
            }

            this.stats.processed++;

        } catch (error) {
            console.error(`  ❌ Error enriching ${entity.id}:`, error.message);
            this.stats.errors.push({ entity: entity.id, error: error.message });
        }
    }

    async enrichSparseEntity(entity) {
        try {
            const { mythology, entityType, id, sparse } = entity;

            const collectionName = this.getCollectionName(entityType);
            const docRef = db.collection(collectionName).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return;
            }

            const data = doc.data();
            const updates = {};
            let changed = false;

            // Enrich sparse fields
            for (const sparseField of sparse) {
                // Parse field name (e.g., "description (< 50 chars or missing)")
                const fieldName = sparseField.split(' ')[0];

                if (fieldName === 'description' && (!data.description || data.description.length < 50)) {
                    // Try to build description from other fields
                    const enrichedDesc = this.buildDescription(data, entityType);
                    if (enrichedDesc && enrichedDesc.length >= 50) {
                        updates.description = enrichedDesc;
                        changed = true;
                    }
                }
            }

            if (changed) {
                await docRef.update({
                    ...updates,
                    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
                    'metadata.enrichedBy': 'completeness_analyzer'
                });
                this.stats.enriched++;
                console.log(`  ✅ Enriched sparse: ${mythology}/${entityType}/${id}`);
            }

        } catch (error) {
            console.error(`  ❌ Error enriching sparse ${entity.id}:`, error.message);
        }
    }

    generateFieldValue(field, entityType, data) {
        switch (field) {
            case 'domains':
                // For deities, extract from description or subtitle
                if (data.subtitle) {
                    const domains = this.extractDomainsFromSubtitle(data.subtitle);
                    if (domains.length > 0) return domains;
                }
                // Generic default
                return ['unknown'];

            case 'symbols':
                // Check if entity has icon or other symbol-like fields
                if (data.icon) return [data.icon];
                return [];

            case 'description':
                // Build from subtitle + any available narrative
                return this.buildDescription(data, entityType);

            case 'type':
                // For cosmology entities
                return 'concept';

            case 'feats':
                // For heroes
                return [];

            default:
                return null;
        }
    }

    extractDomainsFromSubtitle(subtitle) {
        // Extract domains from subtitle like "God of Love, Youth, and Poetry"
        const match = subtitle.match(/(?:God|Goddess|Deity|Spirit|Lord|Lady) of (.+)/i);
        if (match) {
            return match[1]
                .split(/,| and /)
                .map(d => d.trim().toLowerCase())
                .filter(d => d.length > 0);
        }
        return [];
    }

    buildDescription(data, entityType) {
        let parts = [];

        if (data.subtitle) {
            parts.push(data.subtitle + '.');
        }

        if (data.displayName && data.displayName !== data.name) {
            parts.push(`Also known as ${data.displayName}.`);
        }

        if (data.domains && data.domains.length > 0) {
            parts.push(`Associated with ${data.domains.slice(0, 3).join(', ')}.`);
        }

        if (data.epithets && data.epithets.length > 0) {
            parts.push(`Known by the epithets: ${data.epithets[0]}.`);
        }

        const description = parts.join(' ');
        return description.length >= 50 ? description : null;
    }

    getCollectionName(entityType) {
        const mapping = {
            'deity': 'deities',
            'cosmology': 'cosmology',
            'hero': 'heroes',
            'creature': 'creatures',
            'ritual': 'rituals',
            'herb': 'herbs',
            'concept': 'concepts',
            'figure': 'figures',
            'symbol': 'symbols',
            'text': 'texts',
            'location': 'locations',
            'magic': 'magic',
            'path': 'path'
        };
        return mapping[entityType] || entityType;
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('ENRICHMENT SUMMARY');
        console.log('='.repeat(80));
        console.log(`\nTotal Processed: ${this.stats.processed}`);
        console.log(`Successfully Enriched: ${this.stats.enriched}`);
        console.log(`Errors: ${this.stats.errors.length}`);

        if (this.stats.errors.length > 0) {
            console.log('\nErrors:');
            this.stats.errors.slice(0, 10).forEach(e => {
                console.log(`  - ${e.entity}: ${e.error}`);
            });
        }

        console.log('\n' + '='.repeat(80) + '\n');
    }
}

async function main() {
    const enricher = new DataEnricher();
    await enricher.enrichAll();
    process.exit(0);
}

main().catch(console.error);
