#!/usr/bin/env node

/**
 * Firebase Data Enrichment Tool v2
 *
 * Improved enrichment with better domain extraction and symbol handling
 */

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// Known deity domains based on displayName/subtitle patterns
const DOMAIN_KNOWLEDGE = {
    'compassion': ['compassion', 'mercy', 'kindness'],
    'wisdom': ['wisdom', 'knowledge', 'enlightenment'],
    'war': ['war', 'battle', 'conflict', 'victory'],
    'love': ['love', 'beauty', 'desire', 'romance'],
    'death': ['death', 'underworld', 'afterlife'],
    'creation': ['creation', 'beginning', 'genesis'],
    'fertility': ['fertility', 'harvest', 'abundance'],
    'sky': ['sky', 'heaven', 'air', 'thunder'],
    'sun': ['sun', 'light', 'day'],
    'moon': ['moon', 'night', 'cycles'],
    'ocean': ['ocean', 'sea', 'water', 'waves'],
    'fire': ['fire', 'flame', 'heat', 'forge'],
    'earth': ['earth', 'ground', 'stone', 'mountains'],
    'magic': ['magic', 'sorcery', 'spells', 'witchcraft'],
    'healing': ['healing', 'medicine', 'health'],
    'music': ['music', 'song', 'harmony', 'arts'],
    'justice': ['justice', 'law', 'order', 'righteousness']
};

class DataEnricher {
    constructor() {
        this.stats = {
            processed: 0,
            fixed: 0,
            errors: []
        };
    }

    async enrichAll() {
        console.log('\n' + '='.repeat(80));
        console.log('FIREBASE DATA ENRICHMENT V2 - SMART DOMAIN & SYMBOL EXTRACTION');
        console.log('='.repeat(80) + '\n');

        const collections = ['deities', 'cosmology', 'heroes'];

        for (const collectionName of collections) {
            console.log(`\n🔍 Processing ${collectionName}...`);
            const snapshot = await db.collection(collectionName).get();

            for (const doc of snapshot.docs) {
                await this.enrichEntity(doc, collectionName);
            }
        }

        this.printSummary();
    }

    async enrichEntity(doc, collectionName) {
        try {
            const data = doc.data();
            const updates = {};
            let changed = false;

            // Fix domains that are just ['unknown']
            if (data.domains && data.domains.length === 1 && data.domains[0] === 'unknown') {
                const betterDomains = this.inferDomains(data);
                if (betterDomains.length > 0) {
                    updates.domains = betterDomains;
                    changed = true;
                }
            }

            // Copy symbols from rawMetadata if missing
            if ((!data.symbols || data.symbols.length === 0) && data.rawMetadata?.symbols?.length > 0) {
                updates.symbols = data.rawMetadata.symbols;
                changed = true;
            }

            // If description is sparse or contains 'unknown', rebuild it
            if (data.description && (data.description.includes('unknown') || data.description.length < 100)) {
                const betterDesc = this.buildBetterDescription(data);
                if (betterDesc && betterDesc.length > data.description.length) {
                    updates.description = betterDesc;
                    changed = true;
                }
            }

            if (changed) {
                await doc.ref.update({
                    ...updates,
                    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
                    'metadata.enrichedBy': 'v2_smart_enrichment'
                });
                this.stats.fixed++;
                console.log(`  ✅ Fixed: ${doc.id}`);
                if (updates.domains) console.log(`     Domains: ${updates.domains.join(', ')}`);
                if (updates.symbols) console.log(`     Symbols: ${updates.symbols.length} added`);
            }

            this.stats.processed++;

        } catch (error) {
            console.error(`  ❌ Error: ${doc.id}: ${error.message}`);
            this.stats.errors.push({ entity: doc.id, error: error.message });
        }
    }

    inferDomains(data) {
        const domains = [];
        const searchText = [
            data.displayName || '',
            data.subtitle || '',
            data.description || '',
            data.name || ''
        ].join(' ').toLowerCase();

        // Check rawMetadata first
        if (data.rawMetadata?.domains?.length > 0) {
            return data.rawMetadata.domains;
        }

        // Infer from displayName patterns (Bodhisattva of Compassion, God of War, etc.)
        const patterns = [
            /(?:god|goddess|deity|lord|lady|spirit|bodhisattva|buddha|saint) of (.+)/i,
            /(.+) god(?:dess)?/i,
            /(.+) deity/i
        ];

        for (const pattern of patterns) {
            const match = searchText.match(pattern);
            if (match) {
                const extracted = match[1].split(/,| and /)
                    .map(d => d.trim().toLowerCase())
                    .filter(d => d.length > 0 && d.length < 30);
                domains.push(...extracted);
            }
        }

        // Infer from knowledge base
        for (const [domain, keywords] of Object.entries(DOMAIN_KNOWLEDGE)) {
            for (const keyword of keywords) {
                if (searchText.includes(keyword)) {
                    domains.push(domain);
                    break;
                }
            }
        }

        // Deduplicate and limit
        return [...new Set(domains)].slice(0, 5);
    }

    buildBetterDescription(data) {
        const parts = [];

        // Start with subtitle if available
        if (data.subtitle && !data.subtitle.includes('Redirecting')) {
            parts.push(data.subtitle);
        }

        // Add displayName variation if meaningful
        if (data.displayName && data.displayName !== data.name && data.displayName.length < 100) {
            parts.push(`Also known as ${data.displayName}.`);
        }

        // Add domains if available
        if (data.domains && data.domains.length > 0 && !data.domains.includes('unknown')) {
            const domainStr = data.domains.slice(0, 5).join(', ');
            parts.push(`Associated with ${domainStr}.`);
        }

        // Add epithets if available
        if (data.epithets && data.epithets.length > 0) {
            const epithet = data.epithets[0];
            if (epithet.length < 80) {
                parts.push(`Known as ${epithet}.`);
            }
        }

        // Add key symbol if available
        if (data.symbols && data.symbols.length > 0) {
            const symbol = data.symbols[0];
            if (symbol.length < 80) {
                parts.push(`Symbolized by ${symbol.toLowerCase()}.`);
            }
        }

        return parts.join(' ').trim();
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('V2 ENRICHMENT SUMMARY');
        console.log('='.repeat(80));
        console.log(`\nTotal Processed: ${this.stats.processed}`);
        console.log(`Successfully Fixed: ${this.stats.fixed}`);
        console.log(`Errors: ${this.stats.errors.length}`);
        console.log('\n' + '='.repeat(80) + '\n');
    }
}

async function main() {
    const enricher = new DataEnricher();
    await enricher.enrichAll();
    process.exit(0);
}

main().catch(console.error);
