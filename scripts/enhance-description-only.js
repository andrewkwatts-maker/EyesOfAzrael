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
  } catch (error) {}
}

loadEnv();

/**
 * Description-Only Enhancement
 *
 * Asks Gemini for just the description text, not full JSON.
 * This is more reliable for assets that fail full JSON enhancement.
 */

class DescriptionEnhancer {
  constructor(assetsPath, options = {}) {
    this.assetsPath = assetsPath;
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    this.dryRun = options.dryRun !== false;
    this.delayMs = options.delayMs || 2000;
    this.stats = { processed: 0, enhanced: 0, failed: 0 };
    this.results = [];
  }

  async enhanceAssets(assetIds) {
    console.log(`\nEnhancing ${assetIds.length} assets (description only)...`);
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY CHANGES'}\n`);

    for (let i = 0; i < assetIds.length; i++) {
      const { id, category, filePath } = assetIds[i];
      console.log(`[${i + 1}/${assetIds.length}] ${id} (${category})`);

      try {
        const result = await this.enhanceAsset(id, category, filePath);
        if (result.success) {
          this.stats.enhanced++;
          console.log(`  ✓ ${result.oldLength} → ${result.newLength} chars`);
        } else {
          this.stats.failed++;
          console.log(`  ✗ ${result.reason}`);
        }
      } catch (error) {
        this.stats.failed++;
        console.log(`  ✗ Error: ${error.message}`);
      }

      this.stats.processed++;
      if (i < assetIds.length - 1) await this.delay(this.delayMs);
    }

    this.printReport();
  }

  async enhanceAsset(id, category, filePath) {
    const fullPath = path.join(this.assetsPath, filePath);

    let fileContent, data, asset, assetIndex = -1;
    try {
      fileContent = await fs.readFile(fullPath, 'utf8');
      data = JSON.parse(fileContent);

      if (Array.isArray(data)) {
        assetIndex = data.findIndex(a => a.id === id);
        asset = data[assetIndex];
      } else if (data.id === id) {
        asset = data;
      }

      if (!asset) return { success: false, reason: 'Asset not found' };
    } catch (error) {
      return { success: false, reason: `Read error: ${error.message}` };
    }

    const oldLength = (asset.description || '').length;

    // Build context from existing asset
    const context = this.buildContext(asset, category);

    // Ask Gemini for description only
    const description = await this.getEnhancedDescription(asset, context);
    if (!description || description.length < oldLength) {
      return { success: false, reason: 'No valid description returned' };
    }

    const newLength = description.length;

    // Save if not dry run
    if (!this.dryRun) {
      asset.description = description;

      if (Array.isArray(data)) {
        data[assetIndex] = asset;
      } else {
        data = asset;
      }
      await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
    }

    this.results.push({ id, category, oldLength, newLength });
    return { success: true, oldLength, newLength };
  }

  buildContext(asset, category) {
    const parts = [];
    parts.push(`Name: ${asset.name || asset.displayName || asset.id}`);
    parts.push(`Category: ${category}`);
    parts.push(`Mythology: ${asset.mythology || 'Unknown'}`);

    if (asset.domains?.length) {
      parts.push(`Domains: ${asset.domains.slice(0, 10).join(', ')}`);
    }
    if (asset.epithets?.length) {
      parts.push(`Epithets: ${asset.epithets.slice(0, 10).join(', ')}`);
    }
    if (asset.symbols?.length) {
      parts.push(`Symbols: ${asset.symbols.slice(0, 10).join(', ')}`);
    }
    if (asset.relatedDeities?.length) {
      parts.push(`Related: ${asset.relatedDeities.slice(0, 10).map(r => r.name).join(', ')}`);
    }
    if (asset.historical) {
      parts.push(`Has historical context: Yes`);
    }

    return parts.join('\n');
  }

  async getEnhancedDescription(asset, context) {
    const prompt = `You are a mythology expert. Write a comprehensive scholarly description for this entity.

ENTITY:
${context}

CURRENT DESCRIPTION (if any):
${asset.description || 'None'}

REQUIREMENTS:
1. Write a rich, detailed description of AT LEAST 4500 characters (about 3 pages)
2. Cover: origin myths, role in mythology, key stories, symbolism, worship practices, cultural significance
3. Use academic but accessible language
4. Include specific mythological details and narrative elements
5. Reference primary sources (Avesta, Eddas, etc.) where applicable

IMPORTANT: Return ONLY the description text. No JSON, no formatting, no markdown. Just plain text paragraphs.`;

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
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
              reject(new Error(response.error.message));
              return;
            }
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text?.trim());
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('DESCRIPTION-ONLY ENHANCEMENT REPORT');
    console.log('='.repeat(60));
    console.log(`\nMode: ${this.dryRun ? 'DRY RUN' : 'CHANGES APPLIED'}`);
    console.log(`\nResults:`);
    console.log(`  Processed: ${this.stats.processed}`);
    console.log(`  Enhanced:  ${this.stats.enhanced}`);
    console.log(`  Failed:    ${this.stats.failed}`);

    if (this.results.length > 0) {
      const avgIncrease = this.results.reduce((sum, r) => sum + (r.newLength - r.oldLength), 0) / this.results.length;
      console.log(`  Avg increase: ${Math.round(avgIncrease)} chars`);
    }
    console.log('='.repeat(60));
  }
}

// Problematic assets that fail full JSON enhancement
const PROBLEM_ASSETS = [
  { id: 'ahura-mazda', category: 'deities', filePath: 'deities/ahura-mazda.json' },
  { id: 'an', category: 'deities', filePath: 'deities/an.json' },
  { id: 'ishtar', category: 'deities', filePath: 'deities/ishtar.json' },
  { id: 'nabu', category: 'deities', filePath: 'deities/nabu.json' },
  { id: 'shamash', category: 'deities', filePath: 'deities/shamash.json' },
  { id: 'enki', category: 'deities', filePath: 'deities/enki.json' },
  { id: 'enlil', category: 'deities', filePath: 'deities/enlil.json' },
  { id: 'ereshkigal', category: 'deities', filePath: 'deities/ereshkigal.json' },
  { id: 'god-father', category: 'deities', filePath: 'deities/god-father.json' },
  { id: 'hades', category: 'deities', filePath: 'deities/hades.json' },
  { id: 'hephaestus', category: 'deities', filePath: 'deities/hephaestus.json' },
  { id: 'hera', category: 'deities', filePath: 'deities/hera.json' }
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const enhancer = new DescriptionEnhancer(assetsPath, {
    dryRun,
    apiKey: process.env.GEMINI_API_KEY
  });

  try {
    await enhancer.enhanceAssets(PROBLEM_ASSETS);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DescriptionEnhancer };
