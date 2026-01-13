/**
 * Batch AI Enrichment Script
 *
 * Enriches 800+ mythology assets using Vertex AI (Gemini 1.5 Pro)
 * to achieve 100% content readiness score.
 *
 * Features:
 * - Firebase Service Account authentication
 * - Batch processing with controlled concurrency
 * - Checkpoint/resume capability
 * - Dry-run mode (default)
 * - Priority ordering by score
 *
 * Usage:
 *   node scripts/batch-ai-enrich.js --dry-run           # Preview (default)
 *   node scripts/batch-ai-enrich.js --execute           # Run enrichment
 *   node scripts/batch-ai-enrich.js --resume            # Resume from checkpoint
 *   node scripts/batch-ai-enrich.js --type=deity        # Single type only
 *   node scripts/batch-ai-enrich.js --limit=10          # Limit assets
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Load Gemini API key from environment or config file
function loadApiKey() {
    // 1. Check environment variable
    if (process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }
    // 2. Check config file
    const keyFile = path.join(__dirname, '.gemini-api-key');
    if (fs.existsSync(keyFile)) {
        return fs.readFileSync(keyFile, 'utf8').trim();
    }
    // 3. Fail with instructions
    console.error('\n[ERROR] Gemini API key not found!');
    console.error('\nTo get a key:');
    console.error('  1. Visit https://aistudio.google.com/app/apikey');
    console.error('  2. Create a new API key');
    console.error('\nThen either:');
    console.error('  - Set GEMINI_API_KEY environment variable');
    console.error('  - Create scripts/.gemini-api-key file with the key');
    process.exit(1);
}

// Configuration
const CONFIG = {
    assetsDir: path.join(__dirname, '..', 'firebase-assets-downloaded'),
    stateFile: path.join(__dirname, 'enrichment-state.json'),
    reportFile: path.join(__dirname, 'reports', 'enrichment-report.json'),
    batchSize: 50,
    concurrency: 3,
    delayBetweenBatches: 60000, // 1 minute
    delayBetweenRequests: 500,  // 0.5 seconds
    maxRetries: 3,
    model: 'gemini-2.0-flash',
    apiKey: null // Set at runtime
};

// Entity type to collection mapping
const COLLECTIONS = [
    'deities', 'creatures', 'heroes', 'items', 'places',
    'texts', 'rituals', 'herbs', 'symbols', 'archetypes',
    'cosmology', 'magic', 'beings', 'concepts', 'events'
];

// Prompt templates per entity type
const PROMPTS = {
    deity: {
        fields: ['keyMyths', 'domains', 'sources', 'corpusSearch'],
        template: (entity) => `You are a mythology scholar. Enrich this deity for a mythology encyclopedia.

DEITY: ${entity.name}
MYTHOLOGY: ${entity.mythology || 'unknown'}
CURRENT DESCRIPTION: ${(entity.description || '').substring(0, 500)}

Generate ONLY these fields in valid JSON (no markdown, no explanations):
{
  "keyMyths": [
    {"title": "Myth Title", "description": "2-3 sentence summary", "source": "Primary source text"}
  ],
  "domains": ["domain1", "domain2", "domain3", "domain4", "domain5"],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${(entity.name || '').toLowerCase()}"],
    "variants": ["alternate spelling 1", "alternate spelling 2"]
  }
}

REQUIREMENTS:
- keyMyths: Exactly 5 important myths/stories about this deity
- domains: 5+ spheres of influence (e.g., "war", "wisdom", "harvest")
- sources: 5 scholarly/primary sources
- corpusSearch.canonical: lowercase name variants
- corpusSearch.variants: alternate spellings, epithets

Return ONLY the JSON object.`
    },
    creature: {
        fields: ['keyMyths', 'abilities', 'sources', 'corpusSearch'],
        template: (entity) => `You are a mythology scholar. Enrich this mythical creature for a mythology encyclopedia.

CREATURE: ${entity.name}
MYTHOLOGY: ${entity.mythology || 'unknown'}
CURRENT DESCRIPTION: ${(entity.description || '').substring(0, 500)}

Generate ONLY these fields in valid JSON:
{
  "keyMyths": [
    {"title": "Story Title", "description": "2-3 sentence summary", "source": "Primary source"}
  ],
  "abilities": ["ability1", "ability2", "ability3", "ability4", "ability5"],
  "sources": [
    {"name": "Source Name", "description": "Brief description of source"}
  ],
  "corpusSearch": {
    "canonical": ["${(entity.name || '').toLowerCase()}"],
    "variants": []
  }
}

REQUIREMENTS:
- keyMyths: 5 stories/legends featuring this creature
- abilities: 5+ supernatural powers or characteristics
- sources: 5 references (ancient texts, scholarly works)

Return ONLY the JSON object.`
    },
    hero: {
        fields: ['keyMyths', 'achievements', 'sources', 'corpusSearch'],
        template: (entity) => `You are a mythology scholar. Enrich this legendary hero for a mythology encyclopedia.

HERO: ${entity.name}
MYTHOLOGY: ${entity.mythology || 'unknown'}
CURRENT DESCRIPTION: ${(entity.description || '').substring(0, 500)}

Generate ONLY these fields in valid JSON:
{
  "keyMyths": [
    {"title": "Adventure Title", "description": "2-3 sentence summary", "source": "Primary source"}
  ],
  "achievements": ["achievement1", "achievement2", "achievement3", "achievement4", "achievement5"],
  "sources": [
    {"name": "Source Name", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${(entity.name || '').toLowerCase()}"],
    "variants": []
  }
}

REQUIREMENTS:
- keyMyths: 5 major quests/adventures of this hero
- achievements: 5+ notable deeds, victories, or accomplishments
- sources: 5 references

Return ONLY the JSON object.`
    },
    default: {
        fields: ['keyMyths', 'sources', 'corpusSearch'],
        template: (entity) => `You are a mythology scholar. Enrich this ${entity.type || 'entity'} for a mythology encyclopedia.

NAME: ${entity.name}
TYPE: ${entity.type || 'unknown'}
MYTHOLOGY: ${entity.mythology || 'unknown'}
CURRENT DESCRIPTION: ${(entity.description || '').substring(0, 500)}

Generate ONLY these fields in valid JSON:
{
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence summary", "source": "Primary source"}
  ],
  "sources": [
    {"name": "Source Name", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${(entity.name || '').toLowerCase()}"],
    "variants": []
  }
}

REQUIREMENTS:
- keyMyths: 5 relevant stories or narratives
- sources: 5 academic/primary references

Return ONLY the JSON object.`
    }
};

class BatchAIEnricher {
    constructor(options = {}) {
        this.dryRun = options.dryRun !== false;
        this.resume = options.resume || false;
        this.typeFilter = options.type || null;
        this.limit = options.limit || Infinity;
        this.batchSize = options.batchSize || CONFIG.batchSize;

        this.stats = {
            total: 0,
            processed: 0,
            enriched: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Initialize and display startup info
     */
    async initialize() {
        console.log('\n' + '='.repeat(60));
        console.log('  BATCH AI ENRICHMENT');
        console.log('='.repeat(60));
        console.log(`\n[MODE] ${this.dryRun ? 'DRY RUN - No files will be modified' : 'EXECUTE - Files will be modified'}\n`);

        // Load API key
        CONFIG.apiKey = loadApiKey();
        console.log(`[INIT] Model: ${CONFIG.model}`);
        console.log(`[INIT] API Key: ${CONFIG.apiKey.substring(0, 10)}...`);
    }

    /**
     * Load all assets and calculate readiness scores
     */
    async loadAndScoreAssets() {
        console.log('\n[LOAD] Loading assets...');
        const assets = [];

        for (const collection of COLLECTIONS) {
            if (this.typeFilter && !collection.startsWith(this.typeFilter)) continue;

            const collectionPath = path.join(CONFIG.assetsDir, collection);
            if (!fs.existsSync(collectionPath)) continue;

            const files = fs.readdirSync(collectionPath)
                .filter(f => f.endsWith('.json') && !f.startsWith('_'));

            for (const file of files) {
                const filePath = path.join(collectionPath, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(content);

                    if (Array.isArray(data)) continue; // Skip aggregate files

                    const score = this.calculateScore(data);

                    assets.push({
                        id: data.id || path.basename(file, '.json'),
                        name: data.name || 'Unknown',
                        type: data.type || collection.replace(/s$/, ''),
                        mythology: data.mythology || data.primaryMythology || 'unknown',
                        path: filePath,
                        collection,
                        score,
                        data
                    });
                } catch (error) {
                    console.error(`  [ERROR] Failed to load ${file}: ${error.message}`);
                }
            }
        }

        console.log(`[LOAD] Loaded ${assets.length} assets`);
        return assets;
    }

    /**
     * Calculate readiness score (0-100)
     */
    calculateScore(entity) {
        let score = 0;

        // Description (25 points)
        const desc = entity.description || entity.fullDescription || '';
        if (desc.length >= 500) score += 25;
        else if (desc.length >= 300) score += 20;
        else if (desc.length >= 100) score += 15;
        else if (desc.length > 0) score += 5;

        // Key Myths (20 points)
        const myths = entity.keyMyths || entity.keyNarratives || entity.myths || [];
        if (myths.length >= 5) score += 20;
        else if (myths.length >= 3) score += 15;
        else if (myths.length >= 1) score += 10;

        // Sources (15 points)
        const sources = entity.sources || entity.references || entity.primarySources || [];
        if (sources.length >= 5) score += 15;
        else if (sources.length >= 3) score += 12;
        else if (sources.length >= 1) score += 8;

        // Domains/Attributes (15 points)
        const domains = entity.domains || entity.attributes || entity.abilities || entity.powers || [];
        if (domains.length >= 5) score += 15;
        else if (domains.length >= 3) score += 12;
        else if (domains.length >= 1) score += 8;

        // Corpus Search (10 points)
        const corpus = entity.corpusSearch || {};
        if (corpus.canonical?.length && corpus.variants?.length) score += 10;
        else if (corpus.canonical?.length || corpus.variants?.length) score += 5;

        // Related Entities (10 points)
        const relations = entity.relatedEntities || {};
        const relCount = Object.values(relations).flat().length;
        if (relCount >= 10) score += 10;
        else if (relCount >= 5) score += 7;
        else if (relCount >= 1) score += 4;

        // Metadata (5 points)
        if (entity.name) score += 1;
        if (entity.type) score += 1;
        if (entity.mythology) score += 1;
        if (entity.icon || entity.image) score += 1;
        if (entity.aliases?.length || entity.epithets?.length) score += 1;

        return Math.min(100, score);
    }

    /**
     * Check what fields are missing for an asset
     */
    getMissingFields(entity) {
        const missing = [];

        const desc = entity.description || entity.fullDescription || '';
        if (desc.length < 500) missing.push('description');

        const myths = entity.keyMyths || entity.keyNarratives || [];
        if (myths.length < 5) missing.push('keyMyths');

        const sources = entity.sources || entity.references || [];
        if (sources.length < 5) missing.push('sources');

        const domains = entity.domains || entity.attributes || entity.abilities || [];
        if (domains.length < 5) missing.push('domains');

        const corpus = entity.corpusSearch || {};
        if (!corpus.canonical?.length) missing.push('corpusSearch');

        return missing;
    }

    /**
     * Load checkpoint state
     */
    loadCheckpoint() {
        if (!this.resume) return 0;

        if (fs.existsSync(CONFIG.stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
                console.log(`[RESUME] Resuming from batch ${state.lastBatch}, processed ${state.processed} assets`);
                return state.processed;
            } catch (error) {
                console.log('[RESUME] Could not load checkpoint, starting fresh');
            }
        }
        return 0;
    }

    /**
     * Save checkpoint state
     */
    saveCheckpoint(processed) {
        const state = {
            startedAt: new Date().toISOString(),
            lastBatch: Math.floor(processed / this.batchSize),
            processed,
            enriched: this.stats.enriched,
            failed: this.stats.failed,
            errors: this.stats.errors.slice(-20)
        };

        fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
    }

    /**
     * Call Gemini API via Generative Language endpoint
     */
    async callGeminiAPI(prompt) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;

        const body = {
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        };

        for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    if (response.status === 429) {
                        console.log(`    [RATE LIMIT] Waiting 30s...`);
                        await this.delay(30000);
                        continue;
                    }

                    throw new Error(`API error ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!text) {
                    throw new Error('No content in response');
                }

                return text;
            } catch (error) {
                if (attempt === CONFIG.maxRetries) throw error;
                console.log(`    [RETRY] Attempt ${attempt} failed, retrying...`);
                await this.delay(CONFIG.delayBetweenRequests * attempt);
            }
        }
    }

    /**
     * Parse AI response to JSON
     */
    parseResponse(text) {
        // Clean up response
        let jsonStr = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Extract JSON object
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
            jsonStr = match[0];
        }

        return JSON.parse(jsonStr);
    }

    /**
     * Validate enrichment meets minimum word counts
     */
    validateEnrichment(enrichment) {
        const issues = [];
        const wordCount = (str) => (str || '').split(/\s+/).filter(w => w.length > 0).length;

        // Description: minimum 80 words
        if (enrichment.description) {
            const descWords = wordCount(enrichment.description);
            if (descWords < 80) {
                issues.push(`description too short: ${descWords} words (min 80)`);
            }
        }

        // keyMyths: each description minimum 25 words, need at least 3
        if (enrichment.keyMyths) {
            if (enrichment.keyMyths.length < 3) {
                issues.push(`keyMyths: only ${enrichment.keyMyths.length} (min 3)`);
            }
            enrichment.keyMyths.forEach((myth, i) => {
                const mythWords = wordCount(myth.description);
                if (mythWords < 25) {
                    issues.push(`keyMyths[${i}] too short: ${mythWords} words (min 25)`);
                }
            });
        }

        // sources: minimum 3 entries
        if (enrichment.sources && enrichment.sources.length < 3) {
            issues.push(`sources: only ${enrichment.sources.length} (min 3)`);
        }

        // domains: minimum 4 entries
        if (enrichment.domains && enrichment.domains.length < 4) {
            issues.push(`domains: only ${enrichment.domains.length} (min 4)`);
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Merge enrichment with existing data
     */
    mergeEnrichment(original, enrichment) {
        const merged = { ...original };

        for (const [field, value] of Object.entries(enrichment)) {
            if (!value) continue;

            // Check if field is missing or empty
            const existing = original[field];

            if (!existing || (Array.isArray(existing) && existing.length === 0)) {
                merged[field] = value;
            } else if (Array.isArray(value) && Array.isArray(existing)) {
                // Merge arrays, deduplicate by stringifying
                const existingSet = new Set(existing.map(x => JSON.stringify(x)));
                const newItems = value.filter(x => !existingSet.has(JSON.stringify(x)));
                merged[field] = [...existing, ...newItems];
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Merge objects
                merged[field] = { ...existing, ...value };
            }
        }

        // Add enrichment metadata
        merged.enrichedAt = new Date().toISOString();
        merged.enrichedBy = 'batch-ai-enrich';

        return merged;
    }

    /**
     * Enrich a single asset
     */
    async enrichAsset(asset) {
        const missing = this.getMissingFields(asset.data);

        if (missing.length === 0) {
            this.stats.skipped++;
            return null;
        }

        try {
            // Get prompt template
            const promptConfig = PROMPTS[asset.type] || PROMPTS.default;
            const prompt = promptConfig.template(asset.data);

            // Call AI
            const responseText = await this.callGeminiAPI(prompt);
            const enrichment = this.parseResponse(responseText);

            // Validate enrichment quality
            const validation = this.validateEnrichment(enrichment);
            if (!validation.valid) {
                console.log(`    ⚠ ${asset.name}: Quality issues - ${validation.issues.join(', ')}`);
            }

            // Merge with existing
            const merged = this.mergeEnrichment(asset.data, enrichment);

            // Save if not dry-run
            if (!this.dryRun) {
                fs.writeFileSync(asset.path, JSON.stringify(merged, null, 2) + '\n');
            }

            this.stats.enriched++;

            const newScore = this.calculateScore(merged);
            console.log(`    ✓ ${asset.name}: ${asset.score} → ${newScore}`);

            return merged;
        } catch (error) {
            this.stats.failed++;
            this.stats.errors.push({
                id: asset.id,
                name: asset.name,
                error: error.message
            });
            console.log(`    ✗ ${asset.name}: ${error.message}`);
            return null;
        }
    }

    /**
     * Process a batch of assets
     */
    async processBatch(assets, batchNum) {
        console.log(`\n📦 Batch ${batchNum + 1}: Processing ${assets.length} assets`);

        for (let i = 0; i < assets.length; i += CONFIG.concurrency) {
            const chunk = assets.slice(i, i + CONFIG.concurrency);

            await Promise.all(chunk.map(asset => this.enrichAsset(asset)));

            this.stats.processed += chunk.length;

            // Small delay between concurrent groups
            if (i + CONFIG.concurrency < assets.length) {
                await this.delay(CONFIG.delayBetweenRequests);
            }
        }
    }

    /**
     * Main run method
     */
    async run() {
        try {
            await this.initialize();

            // Load and score all assets
            const allAssets = await this.loadAndScoreAssets();
            this.stats.total = allAssets.length;

            // Filter to those needing enrichment (score < 90)
            const needsEnrichment = allAssets
                .filter(a => a.score < 90)
                .sort((a, b) => a.score - b.score); // Lowest first

            console.log(`\n[FILTER] ${needsEnrichment.length} assets need enrichment (score < 90)`);

            // Apply limit
            const toProcess = needsEnrichment.slice(0, this.limit);
            console.log(`[PROCESS] Will process ${toProcess.length} assets`);

            // Load checkpoint
            const startIndex = this.loadCheckpoint();

            // Process in batches
            const totalBatches = Math.ceil((toProcess.length - startIndex) / this.batchSize);

            for (let i = startIndex; i < toProcess.length; i += this.batchSize) {
                const batch = toProcess.slice(i, i + this.batchSize);
                const batchNum = Math.floor(i / this.batchSize);

                await this.processBatch(batch, batchNum);

                // Save checkpoint
                this.saveCheckpoint(i + batch.length);

                // Delay between batches
                if (i + this.batchSize < toProcess.length) {
                    const remaining = totalBatches - batchNum - 1;
                    console.log(`\n⏳ Waiting 60s before next batch... (${remaining} batches remaining)`);
                    await this.delay(CONFIG.delayBetweenBatches);
                }
            }

            // Generate report
            await this.generateReport();

        } catch (error) {
            console.error('\n[FATAL ERROR]', error.message);
            process.exit(1);
        }
    }

    /**
     * Generate final report
     */
    async generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('  ENRICHMENT COMPLETE');
        console.log('='.repeat(60));
        console.log(`  Total Assets:     ${this.stats.total}`);
        console.log(`  Processed:        ${this.stats.processed}`);
        console.log(`  Enriched:         ${this.stats.enriched}`);
        console.log(`  Skipped (OK):     ${this.stats.skipped}`);
        console.log(`  Failed:           ${this.stats.failed}`);
        console.log('='.repeat(60));

        if (this.stats.errors.length > 0) {
            console.log('\nErrors (last 10):');
            this.stats.errors.slice(-10).forEach(e => {
                console.log(`  - ${e.name}: ${e.error}`);
            });
        }

        if (this.dryRun) {
            console.log('\n[DRY RUN] No files were modified. Run with --execute to apply changes.');
        }

        // Save report
        const reportsDir = path.dirname(CONFIG.reportFile);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            mode: this.dryRun ? 'dry-run' : 'execute',
            stats: this.stats
        };

        fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
        console.log(`\nReport saved to: ${CONFIG.reportFile}`);
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: !args.includes('--execute'),
        resume: args.includes('--resume')
    };

    for (const arg of args) {
        if (arg.startsWith('--type=')) {
            options.type = arg.split('=')[1];
        }
        if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1], 10);
        }
        if (arg.startsWith('--batch-size=')) {
            options.batchSize = parseInt(arg.split('=')[1], 10);
        }
    }

    return options;
}

// Main execution
const options = parseArgs();
const enricher = new BatchAIEnricher(options);
enricher.run();
