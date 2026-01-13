/**
 * Gemini Navigation Test Script
 *
 * Uses Gemini to analyze the website structure and test navigation
 */

const fsSync = require('fs');
const path = require('path');
const https = require('https');

const ASSET_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');

// Load .env
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
  } catch {}
}

loadEnv();

// Gemini API call
function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return reject(new Error('GEMINI_API_KEY not set'));
    }

    const data = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.candidates && json.candidates[0]?.content?.parts) {
            resolve(json.candidates[0].content.parts[0].text);
          } else if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve('No response generated');
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runNavigationTest() {
  console.log('═'.repeat(60));
  console.log('GEMINI NAVIGATION TEST');
  console.log('═'.repeat(60));

  // Gather test data
  const testData = gatherTestData();

  const prompt = `
You are testing the Eyes of Azrael mythology encyclopedia website.

## Website Info
- URL: https://www.eyesofazrael.com
- Type: Single Page Application (SPA) with hash-based routing
- Framework: Vanilla JavaScript with Firebase backend

## Asset Statistics
${JSON.stringify(testData.stats, null, 2)}

## Sample Entity Data
Here are some entities that should be navigable:

### Sample Deities:
${JSON.stringify(testData.sampleDeities, null, 2)}

### Sample Heroes:
${JSON.stringify(testData.sampleHeroes, null, 2)}

### Sample Creatures:
${JSON.stringify(testData.sampleCreatures, null, 2)}

## Route Patterns
The website supports these URL patterns:
- #/ - Home page
- #/mythologies - Mythology list
- #/mythology/{myth} - Mythology detail (e.g., #/mythology/greek)
- #/browse/{category} - Browse category (e.g., #/browse/deities)
- #/browse/{category}/{mythology} - Filtered browse (e.g., #/browse/deities/greek)
- #/entity/{category}/{id} - Entity detail (e.g., #/entity/deities/zeus)
- #/search - Search page

## Recent Data Quality Fixes
We just completed comprehensive data quality fixes:
- Schema validation: 223 → 9,869 assets passed (99%)
- Warnings reduced by 99.2%
- Bidirectional link completeness: 23% → 99%
- Zero validation failures

## Task
Based on the data provided:

1. **Data Quality Assessment** (Brief): Are the entity data structures well-formed for navigation?

2. **Navigation Test Scenarios**: List 5 specific navigation paths to test, with expected outcomes.

3. **Potential Issues**: Identify any data issues that could cause navigation problems.

4. **Overall Assessment**: Rate the data quality for navigation (1-10) and explain.

Be concise - focus on actionable insights.
`;

  try {
    console.log('\nSending test data to Gemini...\n');

    const response = await callGemini(prompt);

    console.log('═'.repeat(60));
    console.log('GEMINI ANALYSIS');
    console.log('═'.repeat(60));
    console.log(response);

    // Save report
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fsSync.existsSync(reportDir)) {
      fsSync.mkdirSync(reportDir, { recursive: true });
    }
    const reportPath = path.join(reportDir, `gemini-nav-test-${Date.now()}.md`);
    fsSync.writeFileSync(reportPath, `# Gemini Navigation Test Report\n\nDate: ${new Date().toISOString()}\n\n${response}`);
    console.log(`\nReport saved to: ${reportPath}`);

  } catch (error) {
    console.error('Gemini API error:', error.message);
  }
}

function gatherTestData() {
  const categories = ['deities', 'heroes', 'creatures', 'beings', 'items', 'places'];
  const stats = {};

  for (const cat of categories) {
    const catPath = path.join(ASSET_DIR, cat);
    try {
      const files = fsSync.readdirSync(catPath).filter(f => f.endsWith('.json') && !f.startsWith('_'));
      stats[cat] = files.length;
    } catch {
      stats[cat] = 0;
    }
  }

  // Sample entities
  const sampleDeities = loadSamples('deities', ['zeus.json', 'odin.json', 'ra.json', 'vishnu.json', 'thor.json']);
  const sampleHeroes = loadSamples('heroes', ['greek_heracles.json', 'norse_sigurd.json']);
  const sampleCreatures = loadSamples('beings', ['cerberus.json', 'fenrir.json']);

  return { stats, sampleDeities, sampleCreatures, sampleHeroes };
}

function loadSamples(category, files) {
  const samples = [];
  for (const file of files) {
    const filePath = path.join(ASSET_DIR, category, file);
    try {
      const data = JSON.parse(fsSync.readFileSync(filePath, 'utf8'));
      samples.push({
        id: data.id,
        name: data.name,
        mythology: data.mythology,
        hasRelatedEntities: !!data.relatedEntities,
        relatedCount: data.relatedEntities ? Object.keys(data.relatedEntities).length : 0,
        hasFamily: !!data.family
      });
    } catch {
      // Skip missing files
    }
  }
  return samples;
}

runNavigationTest().catch(console.error);
