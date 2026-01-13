const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');

// Load .env file manually (no external dependencies)
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
    // .env file not found, continue with existing env vars
  }
}

loadEnv();

/**
 * Enhance Assets with Gemini
 *
 * Uses Google's Gemini API to enhance mythology asset content:
 * - Expands descriptions to 3+ pages (4500+ chars)
 * - Adds missing domains, epithets, sources
 * - Ensures academic quality and mythological accuracy
 * - Respects existing content structure
 */

class GeminiEnhancer {
  constructor(assetsPath, options = {}) {
    this.assetsPath = assetsPath;
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    this.dryRun = options.dryRun !== false;
    this.batchSize = options.batchSize || 5;
    this.delayMs = options.delayMs || 2000;  // Rate limiting
    this.maxEnhancements = options.maxEnhancements || 50;

    this.stats = {
      processed: 0,
      enhanced: 0,
      failed: 0,
      skipped: 0
    };

    this.enhancementQueue = [];
    this.results = [];
  }

  async loadEnhancementQueue() {
    const queuePath = path.join(__dirname, '..', 'reports', 'enhancement-queue.json');
    try {
      const content = await fs.readFile(queuePath, 'utf8');
      this.enhancementQueue = JSON.parse(content);
      console.log(`Loaded ${this.enhancementQueue.length} assets from enhancement queue`);
    } catch (error) {
      console.error('Could not load enhancement queue. Run audit-content-standards.js first.');
      process.exit(1);
    }
  }

  async enhance() {
    if (!this.apiKey) {
      console.error('ERROR: GEMINI_API_KEY environment variable not set.');
      console.error('Set it with: set GEMINI_API_KEY=your-api-key');
      process.exit(1);
    }

    await this.loadEnhancementQueue();

    // Sort by priority and take top N
    const queue = this.enhancementQueue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.maxEnhancements);

    console.log(`\nEnhancing ${queue.length} high-priority assets...`);
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'APPLY CHANGES'}\n`);

    for (let i = 0; i < queue.length; i++) {
      const asset = queue[i];
      console.log(`[${i + 1}/${queue.length}] Processing: ${asset.id} (${asset.category})`);

      try {
        const result = await this.enhanceAsset(asset);
        if (result.success) {
          this.stats.enhanced++;
          console.log(`  ✓ Enhanced: ${asset.descriptionLength} → ${result.newLength} chars`);
        } else {
          this.stats.skipped++;
          console.log(`  - Skipped: ${result.reason}`);
        }
      } catch (error) {
        this.stats.failed++;
        console.log(`  ✗ Failed: ${error.message}`);
      }

      this.stats.processed++;

      // Rate limiting
      if (i < queue.length - 1) {
        await this.delay(this.delayMs);
      }
    }

    await this.saveResults();
    this.printReport();
  }

  async enhanceAsset(queueItem) {
    const filePath = path.join(this.assetsPath, queueItem.filePath);

    // Read the asset file
    let fileContent, data, asset;
    try {
      fileContent = await fs.readFile(filePath, 'utf8');
      data = JSON.parse(fileContent);

      // Find the specific asset in the file
      if (Array.isArray(data)) {
        asset = data.find(a => a.id === queueItem.id);
      } else if (data.id === queueItem.id) {
        asset = data;
      }

      if (!asset) {
        return { success: false, reason: 'Asset not found in file' };
      }
    } catch (error) {
      return { success: false, reason: `File read error: ${error.message}` };
    }

    // Build the enhancement prompt
    const prompt = this.buildEnhancementPrompt(asset, queueItem);

    // Call Gemini API
    const enhancement = await this.callGemini(prompt);
    if (!enhancement) {
      return { success: false, reason: 'Gemini API returned no content' };
    }

    // Parse and apply enhancement
    const enhanced = this.parseEnhancement(asset, enhancement);
    if (!enhanced) {
      return { success: false, reason: 'Could not parse enhancement response' };
    }

    // Calculate new length
    const newLength = (enhanced.description || '').length;

    // Save if not dry run
    if (!this.dryRun) {
      if (Array.isArray(data)) {
        const idx = data.findIndex(a => a.id === queueItem.id);
        if (idx >= 0) data[idx] = enhanced;
      } else {
        data = enhanced;
      }
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    this.results.push({
      id: queueItem.id,
      category: queueItem.category,
      oldLength: queueItem.descriptionLength,
      newLength,
      enhanced: true
    });

    return { success: true, newLength };
  }

  buildEnhancementPrompt(asset, queueItem) {
    return `You are a mythology expert and academic writer. Enhance the following mythology asset to meet scholarly standards.

ASSET INFORMATION:
- ID: ${asset.id}
- Name: ${asset.name || 'Unknown'}
- Category: ${queueItem.category}
- Mythology: ${asset.mythology || queueItem.mythology || 'Unknown'}
- Current Description Length: ${(asset.description || '').length} characters

CURRENT CONTENT:
${JSON.stringify(asset, null, 2)}

ENHANCEMENT REQUIREMENTS:

1. DESCRIPTION (CRITICAL):
   - Expand to AT LEAST 4500 characters (about 3 pages)
   - Include: origin story, role in mythology, key myths/stories, symbolism, cultural significance
   - Use academic but accessible language
   - Include specific references to primary sources when possible
   - Structure with clear paragraphs covering different aspects

2. DOMAINS (if deity/hero):
   - Ensure at least 3-5 relevant domains
   - Use lowercase single words (e.g., "thunder", "wisdom", "war")

3. EPITHETS (if deity/hero):
   - Add at least 3-5 traditional epithets
   - Include original language versions where known

4. SOURCES:
   - Add at least 3 academic/primary sources
   - Format as: [{"title": "Source Name", "author": "Author Name", "text": "Relevant excerpt or description"}]

5. RELATED ENTITIES:
   - Verify all existing relationships are accurate
   - Add missing relationships (parents, children, allies, enemies)

RESPOND WITH ONLY A VALID JSON OBJECT containing the enhanced asset. Do not include any explanation or markdown formatting. The JSON must be parseable.

IMPORTANT:
- Preserve the original id, type, and structure
- Do not invent false information - use actual mythological sources
- If uncertain about something, mark it as "traditionally attributed" or "according to some sources"
- Keep the tone scholarly but engaging`;
  }

  async callGemini(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
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
            resolve(text);
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

  parseEnhancement(originalAsset, responseText) {
    try {
      // Try to extract JSON from the response
      let jsonStr = responseText;

      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Try to find JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }

      // Clean up common JSON issues
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}')        // Remove trailing commas in objects
        .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
        .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
        .replace(/\t/g, '  ')          // Replace tabs with spaces
        .replace(/"\s*\n\s*"/g, '" "') // Fix broken strings across lines
        .replace(/\\'/g, "'");         // Fix escaped single quotes

      let enhanced;
      try {
        enhanced = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try more aggressive JSON repair
        try {
          // Fix unescaped newlines in strings
          let fixedJson = jsonStr.replace(/"([^"]*?)(?<!\\)\n([^"]*?)"/g, (match, p1, p2) => {
            return `"${p1}\\n${p2}"`;
          });
          // Fix unescaped quotes within strings
          fixedJson = fixedJson.replace(/"([^"]*?)(?<!\\)"([^,:}\]\s][^"]*?)"/g, (match, p1, p2) => {
            return `"${p1}\\"${p2}"`;
          });
          enhanced = JSON.parse(fixedJson);
          console.log(`    Repaired JSON successfully`);
        } catch (repairError) {
          // Try to extract just the description if full parse fails
          const descMatch = responseText.match(/"description"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/);
          if (descMatch && descMatch[1].length > (originalAsset.description?.length || 0)) {
            enhanced = { ...originalAsset };
            enhanced.description = descMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log(`    Used fallback description extraction (${enhanced.description.length} chars)`);
          } else {
            // Try extracting longDescription too
            const longDescMatch = responseText.match(/"longDescription"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/);
            if (longDescMatch && longDescMatch[1].length > 500) {
              enhanced = { ...originalAsset };
              enhanced.longDescription = longDescMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
              console.log(`    Used fallback longDescription extraction (${enhanced.longDescription.length} chars)`);
            } else {
              throw parseError;
            }
          }
        }
      }

      // Preserve critical fields from original
      enhanced.id = originalAsset.id;
      if (originalAsset.type) enhanced.type = originalAsset.type;

      // Merge rather than replace some fields
      if (originalAsset.metadata) {
        enhanced.metadata = { ...originalAsset.metadata, ...enhanced.metadata };
      }

      return enhanced;
    } catch (error) {
      console.log(`    Parse warning: ${error.message}`);
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveResults() {
    const reportsPath = path.join(__dirname, '..', 'reports');
    try {
      await fs.mkdir(reportsPath, { recursive: true });
    } catch {}

    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'dry-run' : 'applied',
      stats: this.stats,
      results: this.results
    };

    await fs.writeFile(
      path.join(reportsPath, 'gemini-enhancement-results.json'),
      JSON.stringify(report, null, 2)
    );
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('GEMINI ENHANCEMENT REPORT');
    console.log('='.repeat(60));
    console.log(`\nMode: ${this.dryRun ? 'DRY RUN' : 'CHANGES APPLIED'}`);
    console.log(`\nResults:`);
    console.log(`  Processed: ${this.stats.processed}`);
    console.log(`  Enhanced:  ${this.stats.enhanced}`);
    console.log(`  Skipped:   ${this.stats.skipped}`);
    console.log(`  Failed:    ${this.stats.failed}`);

    if (this.results.length > 0) {
      const avgIncrease = this.results
        .filter(r => r.enhanced)
        .reduce((sum, r) => sum + (r.newLength - r.oldLength), 0) /
        this.results.filter(r => r.enhanced).length;

      console.log(`\n  Average character increase: ${Math.round(avgIncrease)}`);
    }

    console.log('\n' + '='.repeat(60));

    if (this.dryRun) {
      console.log('\nDRY RUN - No files modified');
      console.log('Run with --apply flag to apply enhancements');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const maxEnhancements = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '50');

  const assetsPath = path.join(__dirname, '..', 'firebase-assets-downloaded');
  const enhancer = new GeminiEnhancer(assetsPath, {
    dryRun,
    maxEnhancements,
    apiKey: process.env.GEMINI_API_KEY
  });

  try {
    await enhancer.enhance();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GeminiEnhancer };
