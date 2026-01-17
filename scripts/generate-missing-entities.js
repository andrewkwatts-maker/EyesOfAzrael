/**
 * Generate Missing Entities with Gemini
 *
 * Uses Google Gemini API to generate complete JSON entities
 * for all missing mythology references.
 *
 * Input: reports/generation-queue.json
 * Output: generated-entities-preview/ (dry-run) or firebase-assets-downloaded/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');

// Load .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fsSync.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    // .env file not found
  }
}

loadEnv();

const CONFIG = {
  model: 'gemini-2.0-flash',
  batchSize: 10,
  delayBetweenRequests: 3000,
  maxRetries: 3,
  maxEntities: Infinity,
  outputDir: 'firebase-assets-downloaded',
  dryRunDir: 'generated-entities-preview'
};

// Entity type to directory mapping
const TYPE_TO_DIR = {
  'deity': 'deities',
  'hero': 'heroes',
  'creature': 'creatures',
  'place': 'places',
  'item': 'items',
  'ritual': 'rituals',
  'text': 'texts',
  'symbol': 'symbols',
  'concept': 'concepts',
  'cosmology': 'cosmology',
  'archetype': 'archetypes',
  'mythology': 'mythologies'
};

class EntityGenerator {
  constructor(options = {}) {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.dryRun = options.dryRun !== false;
    this.maxEntities = options.maxEntities || CONFIG.maxEntities;
    this.queue = [];
    this.stats = {
      processed: 0,
      generated: 0,
      failed: 0,
      skipped: 0
    };
    this.results = [];
  }

  async loadQueue() {
    const queuePath = path.join(__dirname, '..', 'reports', 'generation-queue.json');
    const content = await fs.readFile(queuePath, 'utf8');
    this.queue = JSON.parse(content);
    console.log('Loaded ' + this.queue.length + ' entities from generation queue');
  }

  buildPrompt(item) {
    const typeSchemas = {
      deity: `{
  "id": "lowercase-id",
  "name": "Display Name",
  "type": "deity",
  "mythology": "${item.inferredMythology}",
  "shortDescription": "Brief 1-2 sentence description",
  "description": "Detailed 500+ character description covering origin, role, myths, and significance",
  "domains": ["domain1", "domain2"],
  "symbols": ["symbol1", "symbol2"],
  "epithets": ["Epithet One", "Epithet Two"],
  "gender": "male|female|non-binary|unknown",
  "relatedEntities": {
    "deities": [{"id": "related-id", "name": "Name", "relationship": "parent|child|sibling|consort|associated"}]
  },
  "sources": [{"title": "Source Title", "author": "Author Name"}]
}`,
      hero: `{
  "id": "lowercase-id",
  "name": "Display Name",
  "type": "hero",
  "mythology": "${item.inferredMythology}",
  "shortDescription": "Brief 1-2 sentence description",
  "description": "Detailed 500+ character description covering origin, quests, and legacy",
  "quests": ["Quest/deed one", "Quest/deed two"],
  "abilities": ["ability1", "ability2"],
  "relatedEntities": {
    "deities": [{"id": "related-id", "name": "Name", "relationship": "patron|parent|associated"}],
    "heroes": [{"id": "related-id", "name": "Name", "relationship": "companion|rival|associated"}]
  },
  "sources": [{"title": "Source Title", "author": "Author Name"}]
}`,
      creature: `{
  "id": "lowercase-id",
  "name": "Display Name",
  "type": "creature",
  "mythology": "${item.inferredMythology}",
  "shortDescription": "Brief 1-2 sentence description",
  "description": "Detailed 500+ character description covering appearance, abilities, and myths",
  "classification": "beast|monster|dragon|spirit|demon|hybrid",
  "appearance": "Physical description",
  "abilities": ["ability1", "ability2"],
  "habitat": ["location1"],
  "relatedEntities": {
    "heroes": [{"id": "related-id", "name": "Name", "relationship": "slayer|associated"}]
  },
  "sources": [{"title": "Source Title", "author": "Author Name"}]
}`,
      concept: `{
  "id": "lowercase-id",
  "name": "Display Name",
  "type": "concept",
  "mythology": "${item.inferredMythology}",
  "shortDescription": "Brief 1-2 sentence definition",
  "description": "Detailed 500+ character explanation of the concept, its significance, and related ideas",
  "category": "philosophical|cosmological|ritual|spiritual",
  "relatedConcepts": ["concept1", "concept2"],
  "relatedEntities": {
    "deities": [{"id": "related-id", "name": "Name", "relationship": "associated"}]
  },
  "sources": [{"title": "Source Title", "author": "Author Name"}]
}`,
      place: `{
  "id": "lowercase-id",
  "name": "Display Name",
  "type": "place",
  "mythology": "${item.inferredMythology}",
  "shortDescription": "Brief 1-2 sentence description",
  "description": "Detailed 500+ character description of the location, its significance, and myths",
  "category": "realm|mountain|temple|underworld|paradise|sacred-site",
  "location": {"cosmological": "Description of cosmic location"},
  "inhabitants": [{"id": "deity-id", "name": "Name", "role": "ruler|guardian|resident"}],
  "characteristics": ["feature1", "feature2"],
  "relatedEntities": {
    "deities": [{"id": "related-id", "name": "Name", "relationship": "ruler|dwells|created"}]
  },
  "sources": [{"title": "Source Title", "author": "Author Name"}]
}`
    };

    const schema = typeSchemas[item.inferredType] || typeSchemas.concept;

    return `You are a mythology expert. Generate a complete, accurate JSON entity for:

ENTITY TO CREATE:
- ID: ${item.targetId}
- Display Name: ${item.displayName}
- Type: ${item.inferredType}
- Mythology: ${item.inferredMythology}

CONTEXT (from entities that reference this one):
- Referenced by: ${item.context.sourceAssets.slice(0, 5).join(', ')}
- Relationship types: ${item.context.relationships.join(', ') || 'associated'}
- Related domains: ${item.context.relatedDomains.slice(0, 5).join(', ') || 'general'}
- Related entities: ${item.context.relatedEntities.slice(0, 5).join(', ') || 'none specified'}

SCHEMA TO FOLLOW:
${schema}

REQUIREMENTS:
1. Use the exact ID: "${item.targetId}"
2. Be historically and mythologically accurate
3. Description must be at least 500 characters
4. Include 2-3 real academic sources (Theogony, Iliad, Eddas, Vedas, etc.)
5. Only include relationships to entities that likely exist
6. Output ONLY valid JSON - no markdown, no explanation

Generate the JSON now:`;
  }

  async callGemini(prompt, retries = 0) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.95
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: '/v1beta/models/' + CONFIG.model + ':generateContent?key=' + this.apiKey,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.error) {
              if (retries < CONFIG.maxRetries && response.error.code === 429) {
                console.log('    Rate limited, retrying in 10s...');
                setTimeout(() => {
                  this.callGemini(prompt, retries + 1).then(resolve).catch(reject);
                }, 10000);
                return;
              }
              reject(new Error(response.error.message));
              return;
            }
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text);
          } catch (error) {
            reject(new Error('Parse error: ' + error.message));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  parseResponse(responseText, item) {
    try {
      let jsonStr = responseText;

      // Remove markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Find JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      // Clean up common issues
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/\t/g, '  ');

      const entity = JSON.parse(jsonStr);

      // Ensure required fields
      entity.id = item.targetId;
      entity.type = item.inferredType;
      entity.mythology = item.inferredMythology;

      if (!entity.name) {
        entity.name = item.displayName;
      }

      return entity;
    } catch (error) {
      console.log('    Parse error: ' + error.message);
      return null;
    }
  }

  async saveEntity(entity, item) {
    const dir = TYPE_TO_DIR[item.inferredType] || 'concepts';
    const baseDir = this.dryRun ? CONFIG.dryRunDir : CONFIG.outputDir;
    const dirPath = path.join(__dirname, '..', baseDir, dir);

    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {}

    const filePath = path.join(dirPath, item.targetId + '.json');
    await fs.writeFile(filePath, JSON.stringify(entity, null, 2));
    return filePath;
  }

  async generate() {
    if (!this.apiKey) {
      console.error('ERROR: GEMINI_API_KEY not set in .env file');
      process.exit(1);
    }

    await this.loadQueue();

    const queue = this.queue.slice(0, this.maxEntities);

    console.log('\n' + '='.repeat(60));
    console.log('GENERATING MISSING ENTITIES');
    console.log('='.repeat(60));
    console.log('Mode: ' + (this.dryRun ? 'DRY RUN' : 'APPLY'));
    console.log('Entities to generate: ' + queue.length);
    console.log('Output: ' + (this.dryRun ? CONFIG.dryRunDir : CONFIG.outputDir));
    console.log('');

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      console.log('[' + (i + 1) + '/' + queue.length + '] ' + item.targetId + ' (' + item.inferredType + '/' + item.inferredMythology + ')');

      try {
        const prompt = this.buildPrompt(item);
        const response = await this.callGemini(prompt);

        if (!response) {
          throw new Error('Empty response from Gemini');
        }

        const entity = this.parseResponse(response, item);

        if (!entity) {
          throw new Error('Could not parse response');
        }

        const filePath = await this.saveEntity(entity, item);
        const descLen = (entity.description || '').length;

        this.stats.generated++;
        this.results.push({
          id: item.targetId,
          type: item.inferredType,
          mythology: item.inferredMythology,
          descriptionLength: descLen,
          filePath: filePath,
          success: true
        });

        console.log('  Created: ' + descLen + ' char description');

      } catch (error) {
        this.stats.failed++;
        this.results.push({
          id: item.targetId,
          type: item.inferredType,
          mythology: item.inferredMythology,
          error: error.message,
          success: false
        });
        console.log('  FAILED: ' + error.message);
      }

      this.stats.processed++;

      // Rate limiting
      if (i < queue.length - 1) {
        await this.delay(CONFIG.delayBetweenRequests);
      }
    }

    await this.saveReport();
    this.printSummary();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveReport() {
    const reportsDir = path.join(__dirname, '..', 'reports');
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'applied',
      stats: this.stats,
      results: this.results
    };

    await fs.writeFile(
      path.join(reportsDir, 'generation-results.json'),
      JSON.stringify(report, null, 2)
    );
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log('Mode: ' + (this.dryRun ? 'DRY RUN' : 'APPLIED'));
    console.log('Processed: ' + this.stats.processed);
    console.log('Generated: ' + this.stats.generated);
    console.log('Failed: ' + this.stats.failed);

    if (this.stats.failed > 0) {
      console.log('\nFailed entities:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log('  - ' + r.id + ': ' + r.error);
      });
    }

    console.log('\nReport saved to: reports/generation-results.json');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const maxEntities = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1]) || Infinity;

  const generator = new EntityGenerator({ dryRun, maxEntities });
  await generator.generate();
}

main().catch(console.error);
