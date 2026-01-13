/**
 * Generate New Mythology Assets via Gemini API
 *
 * Reads manifest files and generates full asset JSON files using AI.
 * Includes validation and broken link fixing.
 *
 * Usage:
 *   node scripts/generate-new-assets.js --dry-run         # Preview
 *   node scripts/generate-new-assets.js --execute         # Generate
 *   node scripts/generate-new-assets.js --type=deities    # Single type
 *   node scripts/generate-new-assets.js --limit=100       # Limit count
 *   node scripts/generate-new-assets.js --resume          # Resume from checkpoint
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Load API key
function loadApiKey() {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    const keyFile = path.join(__dirname, '.gemini-api-key');
    if (fs.existsSync(keyFile)) return fs.readFileSync(keyFile, 'utf8').trim();
    console.error('[ERROR] Gemini API key not found!');
    process.exit(1);
}

const CONFIG = {
    manifestsDir: path.join(__dirname, 'manifests'),
    outputDir: path.join(__dirname, '..', 'firebase-assets-downloaded'),
    stateFile: path.join(__dirname, 'generation-state.json'),
    batchSize: 20,
    concurrency: 3,
    delayBetweenBatches: 60000,
    delayBetweenRequests: 1000,
    maxRetries: 3,
    model: 'gemini-2.0-flash',
    apiKey: null
};

// Entity type to collection folder mapping
const TYPE_TO_COLLECTION = {
    deity: 'deities',
    deities: 'deities',
    creature: 'creatures',
    creatures: 'creatures',
    hero: 'heroes',
    heroes: 'heroes',
    item: 'items',
    items: 'items',
    place: 'places',
    places: 'places'
};

// Schema templates per entity type
const SCHEMA_TEMPLATES = {
    deity: {
        required: ['id', 'name', 'type', 'mythology', 'description', 'domains', 'keyMyths', 'sources'],
        template: (entity) => `You are a mythology scholar. Generate a complete JSON asset for this deity.

ENTITY: ${entity.name}
MYTHOLOGY: ${entity.category || 'Unknown'}
TYPE: deity

Generate a complete deity asset with these EXACT fields:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "deity",
  "mythology": "${entity.category || 'unknown'}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "A detailed 100+ word scholarly description...",
  "subtitle": "Brief epithet or title",
  "icon": "Single emoji representing this deity",
  "domains": ["domain1", "domain2", "domain3", "domain4", "domain5"],
  "titles": ["title1", "title2", "title3"],
  "symbols": ["symbol1", "symbol2", "symbol3"],
  "keyMyths": [
    {"title": "Myth Title", "description": "50+ word description of the myth", "source": "Academic source"},
    {"title": "Myth Title 2", "description": "50+ word description", "source": "Source"},
    {"title": "Myth Title 3", "description": "50+ word description", "source": "Source"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description of source"},
    {"author": "Author 2", "work": "Work 2", "description": "Description"},
    {"author": "Author 3", "work": "Work 3", "description": "Description"}
  ],
  "corpusSearch": {
    "canonical": ["lowercase name"],
    "variants": ["alternate spellings"],
    "domains": ["key domains"],
    "symbols": ["key symbols"]
  },
  "family": {
    "parents": {"father": "Name or Unknown", "mother": "Name or Unknown"},
    "consorts": [],
    "children": []
  }
}

REQUIREMENTS:
- description MUST be 100+ words, scholarly tone
- keyMyths MUST have 3+ entries, each description 50+ words
- sources MUST have 3+ academic references
- domains MUST have 5+ items
- Use accurate mythological information
- Return ONLY valid JSON, no markdown`
    },

    creature: {
        required: ['id', 'name', 'type', 'mythology', 'description', 'abilities', 'keyMyths', 'sources'],
        template: (entity) => `You are a mythology scholar. Generate a complete JSON asset for this mythical creature.

ENTITY: ${entity.name}
CATEGORY: ${entity.category || 'Unknown'}
TYPE: creature

IMPORTANT: Determine the CORRECT mythology based on the creature's cultural origin:
- Ladon, Typhon, Hydra → "greek"
- Nidhogg, Jormungandr, Fenrir → "norse"
- Apophis, Sphinx → "egyptian"
- Fafnir → "norse"
- Yamata no Orochi → "japanese"
- Zu, Tiamat → "mesopotamian"
- Chinese dragons → "chinese"

Generate a complete creature asset with these EXACT fields:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "creature",
  "mythology": "[DETERMINE FROM CREATURE'S CULTURAL ORIGIN]",
  "status": "published",
  "authorId": "ai-generated",
  "description": "A detailed 100+ word scholarly description...",
  "subtitle": "Brief description",
  "icon": "Single emoji",
  "abilities": ["ability1", "ability2", "ability3", "ability4", "ability5"],
  "appearance": "Physical description of the creature",
  "habitat": "Where this creature is found",
  "behavior": "How this creature behaves",
  "weaknesses": ["weakness1", "weakness2"],
  "keyMyths": [
    {"title": "Story Title", "description": "50+ word description", "source": "Source"},
    {"title": "Story 2", "description": "50+ words", "source": "Source"},
    {"title": "Story 3", "description": "50+ words", "source": "Source"}
  ],
  "sources": [
    {"author": "Author", "work": "Work", "description": "Description"},
    {"author": "Author 2", "work": "Work 2", "description": "Description"},
    {"author": "Author 3", "work": "Work 3", "description": "Description"}
  ],
  "corpusSearch": {
    "canonical": ["lowercase name"],
    "variants": ["alternate names"],
    "abilities": ["key abilities"]
  }
}

REQUIREMENTS:
- description MUST be 100+ words
- keyMyths MUST have 3+ entries
- sources MUST have 3+ academic references
- Use accurate mythological information
- Return ONLY valid JSON`
    },

    hero: {
        required: ['id', 'name', 'type', 'mythology', 'description', 'achievements', 'keyMyths', 'sources'],
        template: (entity) => `You are a mythology scholar. Generate a complete JSON asset for this legendary hero.

ENTITY: ${entity.name}
MYTHOLOGY: ${entity.category || 'Unknown'}
TYPE: hero

Generate a complete hero asset with these EXACT fields:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "hero",
  "mythology": "${entity.category || 'unknown'}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "A detailed 100+ word scholarly description...",
  "subtitle": "Epithet or title",
  "icon": "Single emoji",
  "achievements": ["achievement1", "achievement2", "achievement3", "achievement4", "achievement5"],
  "weapons": ["weapon1", "weapon2"],
  "parentage": {
    "father": "Name",
    "mother": "Name",
    "divine": "Divine parent if any"
  },
  "keyMyths": [
    {"title": "Adventure Title", "description": "50+ word description", "source": "Source"},
    {"title": "Quest 2", "description": "50+ words", "source": "Source"},
    {"title": "Feat 3", "description": "50+ words", "source": "Source"}
  ],
  "sources": [
    {"author": "Author", "work": "Work", "description": "Description"},
    {"author": "Author 2", "work": "Work 2", "description": "Description"},
    {"author": "Author 3", "work": "Work 3", "description": "Description"}
  ],
  "corpusSearch": {
    "canonical": ["lowercase name"],
    "variants": ["alternate names"],
    "achievements": ["key achievements"]
  }
}

REQUIREMENTS:
- description MUST be 100+ words
- keyMyths MUST have 3+ entries
- sources MUST have 3+ academic references
- Return ONLY valid JSON`
    },

    item: {
        required: ['id', 'name', 'type', 'mythology', 'description', 'powers', 'keyMyths', 'sources'],
        template: (entity) => `You are a mythology scholar. Generate a complete JSON asset for this sacred/legendary item.

ENTITY: ${entity.name}
CATEGORY: ${entity.category || 'Unknown'}
TYPE: item

Generate a complete item asset with these EXACT fields:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "item",
  "mythology": "${entity.category || 'various'}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "A detailed 100+ word scholarly description...",
  "subtitle": "Brief description",
  "icon": "Single emoji",
  "powers": ["power1", "power2", "power3"],
  "origin": "How the item was created or found",
  "wielders": ["owner1", "owner2"],
  "currentLocation": "Where it is now (lost, destroyed, etc.)",
  "keyMyths": [
    {"title": "Story Title", "description": "50+ word description", "source": "Source"},
    {"title": "Story 2", "description": "50+ words", "source": "Source"},
    {"title": "Story 3", "description": "50+ words", "source": "Source"}
  ],
  "sources": [
    {"author": "Author", "work": "Work", "description": "Description"},
    {"author": "Author 2", "work": "Work 2", "description": "Description"},
    {"author": "Author 3", "work": "Work 3", "description": "Description"}
  ],
  "corpusSearch": {
    "canonical": ["lowercase name"],
    "variants": ["alternate names"]
  }
}

REQUIREMENTS:
- description MUST be 100+ words
- keyMyths MUST have 3+ entries
- sources MUST have 3+ academic references
- Return ONLY valid JSON`
    },

    place: {
        required: ['id', 'name', 'type', 'mythology', 'description', 'features', 'keyMyths', 'sources'],
        template: (entity) => `You are a mythology scholar. Generate a complete JSON asset for this sacred/mythical place.

ENTITY: ${entity.name}
CATEGORY: ${entity.category || 'Unknown'}
TYPE: place

Generate a complete place asset with these EXACT fields:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "place",
  "mythology": "${entity.category || 'various'}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "A detailed 100+ word scholarly description...",
  "subtitle": "Brief description",
  "icon": "Single emoji",
  "features": ["feature1", "feature2", "feature3", "feature4"],
  "location": "Geographic or cosmic location",
  "inhabitants": ["resident1", "resident2"],
  "significance": "Why this place is important",
  "keyMyths": [
    {"title": "Story Title", "description": "50+ word description", "source": "Source"},
    {"title": "Story 2", "description": "50+ words", "source": "Source"},
    {"title": "Story 3", "description": "50+ words", "source": "Source"}
  ],
  "sources": [
    {"author": "Author", "work": "Work", "description": "Description"},
    {"author": "Author 2", "work": "Work 2", "description": "Description"},
    {"author": "Author 3", "work": "Work 3", "description": "Description"}
  ],
  "corpusSearch": {
    "canonical": ["lowercase name"],
    "variants": ["alternate names"]
  }
}

REQUIREMENTS:
- description MUST be 100+ words
- keyMyths MUST have 3+ entries
- sources MUST have 3+ academic references
- Return ONLY valid JSON`
    }
};

class AssetGenerator {
    constructor(options = {}) {
        this.dryRun = options.dryRun !== false;
        this.resume = options.resume || false;
        this.typeFilter = options.type || null;
        this.limit = options.limit || Infinity;

        this.stats = {
            total: 0,
            generated: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };
    }

    async initialize() {
        console.log('\n' + '='.repeat(60));
        console.log('  MYTHOLOGY ASSET GENERATOR');
        console.log('='.repeat(60));
        console.log(`\n[MODE] ${this.dryRun ? 'DRY RUN' : 'EXECUTE'}\n`);

        CONFIG.apiKey = loadApiKey();
        console.log(`[INIT] Model: ${CONFIG.model}`);
        console.log(`[INIT] API Key: ${CONFIG.apiKey.substring(0, 10)}...`);
    }

    loadManifests() {
        console.log('\n[LOAD] Loading manifests...');
        const entities = [];

        const files = fs.readdirSync(CONFIG.manifestsDir)
            .filter(f => f.endsWith('-manifest.json'));

        for (const file of files) {
            const type = file.replace('-manifest.json', '');

            if (this.typeFilter && !type.startsWith(this.typeFilter)) continue;

            const manifest = JSON.parse(
                fs.readFileSync(path.join(CONFIG.manifestsDir, file))
            );

            for (const item of manifest.items) {
                if (item.status === 'completed') continue;

                entities.push({
                    ...item,
                    manifestFile: file
                });
            }
        }

        console.log(`[LOAD] Found ${entities.length} entities to generate`);
        return entities;
    }

    async callGeminiAPI(prompt) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;

        const body = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    if (response.status === 429) {
                        console.log('    [RATE LIMIT] Waiting 60s...');
                        await this.delay(60000);
                        continue;
                    }
                    throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
                }

                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text;
            } catch (error) {
                if (attempt === CONFIG.maxRetries) throw error;
                console.log(`    [RETRY] Attempt ${attempt} failed...`);
                await this.delay(CONFIG.delayBetweenRequests * attempt);
            }
        }
    }

    parseResponse(text) {
        let jsonStr = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) jsonStr = match[0];

        return JSON.parse(jsonStr);
    }

    validateAsset(asset, type) {
        const issues = [];
        const wordCount = (str) => (str || '').split(/\s+/).filter(w => w.length > 0).length;

        if (!asset.id) issues.push('missing id');
        if (!asset.name) issues.push('missing name');
        if (!asset.description || wordCount(asset.description) < 80) {
            issues.push(`description too short: ${wordCount(asset.description)} words`);
        }

        const myths = asset.keyMyths || [];
        if (myths.length < 3) issues.push(`only ${myths.length} keyMyths (need 3+)`);

        const sources = asset.sources || [];
        if (sources.length < 3) issues.push(`only ${sources.length} sources (need 3+)`);

        return { valid: issues.length === 0, issues };
    }

    async generateAsset(entity) {
        const type = entity.type.replace(/s$/, '');  // deities -> deity
        const schema = SCHEMA_TEMPLATES[type] || SCHEMA_TEMPLATES.deity;
        const prompt = schema.template(entity);

        try {
            const responseText = await this.callGeminiAPI(prompt);
            const asset = this.parseResponse(responseText);

            // Ensure required fields
            asset.id = entity.id;
            asset.name = entity.name;
            asset.type = type;
            asset.createdAt = new Date().toISOString();
            asset.generatedBy = 'gemini-asset-generator';

            // Validate
            const validation = this.validateAsset(asset, type);
            if (!validation.valid) {
                console.log(`    ⚠ ${entity.name}: ${validation.issues.join(', ')}`);
            }

            return asset;
        } catch (error) {
            throw error;
        }
    }

    async saveAsset(asset) {
        const collection = TYPE_TO_COLLECTION[asset.type] || asset.type + 's';
        const dir = path.join(CONFIG.outputDir, collection);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `${asset.id}.json`;
        const filepath = path.join(dir, filename);

        fs.writeFileSync(filepath, JSON.stringify(asset, null, 2) + '\n');
        return filepath;
    }

    updateManifest(entity, status) {
        const manifestPath = path.join(CONFIG.manifestsDir, entity.manifestFile);
        const manifest = JSON.parse(fs.readFileSync(manifestPath));

        const item = manifest.items.find(i => i.id === entity.id);
        if (item) {
            item.status = status;
            item.processedAt = new Date().toISOString();
        }

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        await this.initialize();

        const entities = this.loadManifests();
        const toProcess = entities.slice(0, this.limit);

        this.stats.total = toProcess.length;
        console.log(`[PROCESS] Will generate ${toProcess.length} assets\n`);

        // Process in batches
        for (let i = 0; i < toProcess.length; i += CONFIG.batchSize) {
            const batch = toProcess.slice(i, i + CONFIG.batchSize);
            const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
            const totalBatches = Math.ceil(toProcess.length / CONFIG.batchSize);

            console.log(`📦 Batch ${batchNum}/${totalBatches}: Generating ${batch.length} assets`);

            // Process with concurrency
            for (let j = 0; j < batch.length; j += CONFIG.concurrency) {
                const chunk = batch.slice(j, j + CONFIG.concurrency);

                await Promise.all(chunk.map(async (entity) => {
                    try {
                        const asset = await this.generateAsset(entity);

                        if (!this.dryRun) {
                            const filepath = await this.saveAsset(asset);
                            this.updateManifest(entity, 'completed');
                        }

                        this.stats.generated++;
                        console.log(`    ✓ ${entity.name}`);
                    } catch (error) {
                        this.stats.failed++;
                        this.stats.errors.push({ id: entity.id, error: error.message });
                        console.log(`    ✗ ${entity.name}: ${error.message.substring(0, 50)}`);
                    }
                }));

                await this.delay(CONFIG.delayBetweenRequests);
            }

            // Wait between batches
            if (i + CONFIG.batchSize < toProcess.length) {
                console.log(`\n⏳ Waiting 60s before next batch...`);
                await this.delay(CONFIG.delayBetweenBatches);
            }
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('  GENERATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`  Total Entities:   ${this.stats.total}`);
        console.log(`  Generated:        ${this.stats.generated}`);
        console.log(`  Failed:           ${this.stats.failed}`);
        console.log('='.repeat(60));

        if (this.stats.errors.length > 0) {
            console.log('\nErrors (last 10):');
            this.stats.errors.slice(-10).forEach(e => {
                console.log(`  - ${e.id}: ${e.error.substring(0, 60)}`);
            });
        }

        if (this.dryRun) {
            console.log('\n[DRY RUN] No files were created.');
        }
    }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
    dryRun: !args.includes('--execute'),
    resume: args.includes('--resume'),
    type: args.find(a => a.startsWith('--type='))?.split('=')[1],
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || Infinity
};

const generator = new AssetGenerator(options);
generator.run().catch(err => {
    console.error('[FATAL ERROR]', err.message);
    process.exit(1);
});
