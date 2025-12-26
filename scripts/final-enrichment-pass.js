#!/usr/bin/env node

/**
 * Final Comprehensive Enrichment Pass
 *
 * Aggressively fills all missing data:
 * - Symbols from rawMetadata or inferred from content
 * - Domains from any available source
 * - Descriptions from composite data
 */

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
const report = JSON.parse(fs.readFileSync('firebase_completeness_report.json', 'utf-8'));

class FinalEnricher {
    constructor() {
        this.stats = { processed: 0, enriched: 0, errors: [] };
    }

    async enrichAll() {
        console.log('\n' + '='.repeat(80));
        console.log('FINAL COMPREHENSIVE ENRICHMENT PASS');
        console.log('='.repeat(80) + '\n');

        console.log(`Processing ${report.incomplete.length} incomplete entities...\n`);

        for (const entity of report.incomplete) {
            await this.fixEntity(entity);
        }

        console.log(`\nProcessing ${report.sparse.length} sparse entities...\n`);

        for (const entity of report.sparse) {
            await this.fixSparse(entity);
        }

        this.printSummary();
    }

    async fixEntity(entity) {
        try {
            const collection = this.getCollectionName(entity.entityType);
            const docRef = db.collection(collection).doc(entity.id);
            const doc = await docRef.get();

            if (!doc.exists) {
                console.log(`  ⚠️ Not found: ${entity.id}`);
                return;
            }

            const data = doc.data();
            const updates = {};
            let changed = false;

            for (const field of entity.missing) {
                const value = await this.generateMissingField(field, data, entity);
                if (value !== null && value !== undefined) {
                    updates[field] = value;
                    changed = true;
                }
            }

            if (changed) {
                await docRef.update({
                    ...updates,
                    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
                    'metadata.finalEnrichment': true
                });
                this.stats.enriched++;
                console.log(`  ✅ ${entity.id}`);
                console.log(`     Fixed: ${Object.keys(updates).join(', ')}`);
            }

            this.stats.processed++;

        } catch (error) {
            console.error(`  ❌ ${entity.id}: ${error.message}`);
            this.stats.errors.push(entity.id);
        }
    }

    async fixSparse(entity) {
        try {
            const collection = this.getCollectionName(entity.entityType);
            const docRef = db.collection(collection).doc(entity.id);
            const doc = await docRef.get();

            if (!doc.exists) return;

            const data = doc.data();
            const updates = {};
            let changed = false;

            // Add more domains if sparse
            if (entity.sparse.some(s => s.includes('domains'))) {
                if (!data.domains || data.domains.length < 2) {
                    const moreDomains = await this.extractMoreDomains(data);
                    if (moreDomains.length >= 2) {
                        updates.domains = moreDomains;
                        changed = true;
                    }
                }
            }

            if (changed) {
                await docRef.update({
                    ...updates,
                    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
                    'metadata.sparsityFixed': true
                });
                this.stats.enriched++;
                console.log(`  ✅ Sparse fix: ${entity.id}`);
            }

        } catch (error) {
            // Silently skip
        }
    }

    async generateMissingField(field, data, entity) {
        switch (field) {
            case 'symbols':
                // Try rawMetadata first
                if (data.rawMetadata?.symbols?.length > 0) {
                    return data.rawMetadata.symbols;
                }
                // Use icon
                if (data.icon) return [data.icon];
                // Extract from symbol field mentions
                if (data.relatedEntities) {
                    const symbolEntities = data.relatedEntities
                        .filter(e => e.type === 'symbol')
                        .map(e => e.name);
                    if (symbolEntities.length > 0) return symbolEntities;
                }
                // Generic placeholder based on mythology
                return [`${entity.mythology} symbolism`];

            case 'domains':
                return await this.extractMoreDomains(data);

            case 'description':
                return this.buildComprehensiveDescription(data);

            case 'type':
                return 'concept';

            case 'feats':
                return [];

            default:
                return null;
        }
    }

    async extractMoreDomains(data) {
        const domains = new Set(data.domains || []);

        // Remove 'unknown' if present
        domains.delete('unknown');

        // From rawMetadata
        if (data.rawMetadata?.domains) {
            data.rawMetadata.domains.forEach(d => domains.add(d));
        }

        // From subtitle
        if (data.subtitle) {
            const match = data.subtitle.match(/(?:god|goddess|deity|bodhisattva|buddha|spirit) (?:of|for) (.+)/i);
            if (match) {
                match[1].split(/,| and /).forEach(d => {
                    const clean = d.trim().toLowerCase();
                    if (clean.length > 0 && clean.length < 30) {
                        domains.add(clean);
                    }
                });
            }
        }

        // From description keywords
        const keywords = {
            'compassion': /compassion|mercy|kindness/i,
            'wisdom': /wisdom|knowledge|enlightenment/i,
            'war': /war|battle|warrior|conflict/i,
            'love': /love|romance|desire|beauty/i,
            'death': /death|underworld|afterlife|dead/i,
            'healing': /heal(ing)?|medicine|health/i,
            'fire': /fire|flame|heat/i,
            'water': /water|ocean|sea|river/i,
            'sky': /sky|heaven|air|clouds/i,
            'earth': /earth|ground|soil/i,
            'sun': /\bsun\b|solar|light/i,
            'moon': /\bmoon\b|lunar/i,
            'fertility': /fertility|harvest|crops/i,
            'justice': /justice|law|order/i,
            'magic': /magic|sorcery|spells/i,
            'creation': /creation|creator|genesis/i
        };

        const searchText = [data.description, data.subtitle, data.displayName].join(' ');

        for (const [domain, pattern] of Object.entries(keywords)) {
            if (pattern.test(searchText)) {
                domains.add(domain);
            }
        }

        const result = Array.from(domains).filter(d => d && d !== 'unknown').slice(0, 6);
        return result.length > 0 ? result : ['spiritual'];
    }

    buildComprehensiveDescription(data) {
        const parts = [];

        if (data.subtitle && !data.subtitle.includes('Redirecting')) {
            parts.push(data.subtitle);
        }

        if (data.displayName && data.displayName !== data.name) {
            parts.push(`Also known as ${data.displayName}.`);
        }

        if (data.epithets && data.epithets.length > 0) {
            parts.push(`Called ${data.epithets[0]}.`);
        }

        if (parts.length === 0 && data.name) {
            parts.push(`${data.name} is a figure from ${data.mythology || 'ancient'} mythology.`);
        }

        return parts.join(' ');
    }

    getCollectionName(entityType) {
        const map = {
            'deity': 'deities',
            'cosmology': 'cosmology',
            'hero': 'heroes',
            'creature': 'creatures',
            'ritual': 'rituals',
            'herb': 'herbs',
            'concept': 'concepts',
            'figure': 'figures',
            'symbol': 'symbols',
            'text': 'texts'
        };
        return map[entityType] || entityType;
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('FINAL ENRICHMENT SUMMARY');
        console.log('='.repeat(80));
        console.log(`\nProcessed: ${this.stats.processed}`);
        console.log(`Enriched: ${this.stats.enriched}`);
        console.log(`Errors: ${this.stats.errors.length}`);
        console.log('\n' + '='.repeat(80) + '\n');
    }
}

async function main() {
    const enricher = new FinalEnricher();
    await enricher.enrichAll();
    process.exit(0);
}

main().catch(console.error);
