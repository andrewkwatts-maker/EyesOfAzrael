#!/usr/bin/env node
/**
 * Generate creatures from batch manifest
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'manifests/creatures-batch2.json');
const apiKeyPath = path.join(__dirname, '.gemini-api-key');
const outputDir = path.join(__dirname, '../firebase-assets-downloaded/creatures');

async function generateCreature(entity, apiKey) {
  const prompt = `Generate a complete mythology asset JSON for the creature '${entity.name}' from ${entity.culture} mythology.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "creature",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this creature, its origins, appearance, and significance)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "abilities": ["ability1", "ability2", "ability3", "ability4", "ability5"],
  "appearance": "(Detailed physical description)",
  "habitat": "(Where this creature lives)",
  "behavior": "(How this creature behaves)",
  "weaknesses": ["weakness1", "weakness2"],
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence description", "source": "Source text"},
    {"title": "Title2", "description": "2-3 sentence description", "source": "Source text"},
    {"title": "Title3", "description": "2-3 sentence description", "source": "Source text"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names and spellings"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      })
    });

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No response from API');
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const asset = JSON.parse(text);
    asset.createdAt = new Date().toISOString();
    asset.generatedBy = 'gemini-asset-generator';

    const outPath = path.join(outputDir, `${entity.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(asset, null, 2));
    return { success: true, name: entity.name };
  } catch (e) {
    return { success: false, name: entity.name, error: e.message };
  }
}

async function run() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const apiKey = fs.readFileSync(apiKeyPath, 'utf8').trim();

  console.log('Generating', manifest.entities.length, 'creatures...\n');

  const batchSize = 5;
  let success = 0, failed = 0;

  for (let i = 0; i < manifest.entities.length; i += batchSize) {
    const batch = manifest.entities.slice(i, i + batchSize);
    console.log(`Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(manifest.entities.length/batchSize)}: ${batch.map(e => e.name).join(', ')}`);

    const results = await Promise.all(batch.map(e => generateCreature(e, apiKey)));

    for (const r of results) {
      if (r.success) {
        console.log('  ✓', r.name);
        success++;
      } else {
        console.log('  ✗', r.name + ':', r.error);
        failed++;
      }
    }

    if (i + batchSize < manifest.entities.length) {
      await new Promise(r => setTimeout(r, 5000)); // 5s delay between batches
    }
  }

  console.log('\n============================================================');
  console.log('  GENERATION COMPLETE');
  console.log('============================================================');
  console.log('  Success:', success);
  console.log('  Failed:', failed);
  console.log('============================================================');
}

run().catch(console.error);
