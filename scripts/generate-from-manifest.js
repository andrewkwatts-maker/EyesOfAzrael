#!/usr/bin/env node
/**
 * Generate assets from a manifest file
 * Usage: node generate-from-manifest.js <manifest-path>
 */

const fs = require('fs');
const path = require('path');

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: node generate-from-manifest.js <manifest-path>');
  process.exit(1);
}

const apiKeyPath = path.join(__dirname, '.gemini-api-key');
const baseOutputDir = path.join(__dirname, '../firebase-assets-downloaded');

const typeTemplates = {
  heroes: (entity) => `Generate a complete mythology asset JSON for the hero '${entity.name}' from ${entity.culture} mythology/tradition.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "hero",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this hero, their origins, deeds, and significance)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "achievements": ["achievement1", "achievement2", "achievement3", "achievement4", "achievement5"],
  "companions": ["companion1", "companion2"],
  "enemies": ["enemy1", "enemy2"],
  "weapons": ["weapon1", "weapon2"],
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

Return ONLY valid JSON. No markdown, no explanations.`,

  deities: (entity) => `Generate a complete mythology asset JSON for the deity '${entity.name}' from ${entity.culture} mythology.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "deity",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this deity, their origins, powers, and role)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "domains": ["domain1", "domain2", "domain3", "domain4", "domain5"],
  "symbols": ["symbol1", "symbol2", "symbol3"],
  "associations": ["association1", "association2"],
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

Return ONLY valid JSON. No markdown, no explanations.`,

  items: (entity) => `Generate a complete mythology asset JSON for the sacred item '${entity.name}' from ${entity.culture} mythology/tradition.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "item",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this item, its origins, powers, and significance)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "powers": ["power1", "power2", "power3"],
  "material": "(What the item is made of)",
  "origin": "(How the item was created or obtained)",
  "currentLocation": "(Where the item is believed to be now)",
  "associatedDeities": ["deity1", "deity2"],
  "associatedHeroes": ["hero1", "hero2"],
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence description", "source": "Source text"},
    {"title": "Title2", "description": "2-3 sentence description", "source": "Source text"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`,

  creatures: (entity) => `Generate a complete mythology asset JSON for the creature '${entity.name}' from ${entity.culture} mythology.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "creature",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this creature)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "abilities": ["ability1", "ability2", "ability3", "ability4", "ability5"],
  "appearance": "(Detailed physical description)",
  "habitat": "(Where this creature lives)",
  "behavior": "(How this creature behaves)",
  "weaknesses": ["weakness1", "weakness2"],
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence description", "source": "Source text"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`,

  places: (entity) => `Generate a complete mythology asset JSON for the sacred place '${entity.name}' from ${entity.culture} mythology/tradition.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "place",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this place, its significance, and mythological importance)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "significance": ["significance1", "significance2", "significance3"],
  "features": ["feature1", "feature2", "feature3"],
  "inhabitants": ["inhabitant1", "inhabitant2"],
  "associatedDeities": ["deity1", "deity2"],
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence description", "source": "Source text"},
    {"title": "Title2", "description": "2-3 sentence description", "source": "Source text"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`,

  concepts: (entity) => `Generate a complete encyclopedia asset JSON for the concept/theory '${entity.name}' from ${entity.culture} context.

This is for an encyclopedia covering mythology, alternative history, conspiracy theories, unexplained phenomena, and esoteric knowledge. Provide BALANCED, scholarly coverage - present claims alongside mainstream perspectives and criticisms.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "concept",
  "category": "(category: ancient_mystery, secret_society, lost_civilization, religious_mystery, cryptid, ufo, paranormal, alternative_science, or conspiracy)",
  "culture": "${entity.culture}",
  "status": "published",
  "visibility": "admin",
  "authorId": "ai-generated",
  "description": "(600+ characters providing balanced scholarly overview - what the theory/concept claims, its origins, key evidence cited by proponents, and mainstream scholarly perspective)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "claims": [
    {"claim": "Main claim 1", "evidence": "Evidence cited", "criticism": "Mainstream response"},
    {"claim": "Main claim 2", "evidence": "Evidence cited", "criticism": "Mainstream response"},
    {"claim": "Main claim 3", "evidence": "Evidence cited", "criticism": "Mainstream response"}
  ],
  "keyFigures": [
    {"name": "Proponent name", "role": "Their role in promoting/researching this"},
    {"name": "Critic name", "role": "Their role in debunking/critiquing this"}
  ],
  "relatedConcepts": ["related_concept_1", "related_concept_2", "related_concept_3"],
  "mythologyConnections": ["Connection to traditional mythology 1", "Connection 2"],
  "timeline": [
    {"date": "Date or era", "event": "Key event in the theory's history"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "year": "Year", "perspective": "proponent/critic/academic"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names and related terms"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`,

  magic: (entity) => `Generate a complete mythology asset JSON for the magic system/practice '${entity.name}' from ${entity.culture} tradition.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "magic",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this magical practice, its origins, methods, and cultural significance)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "practices": ["practice1", "practice2", "practice3"],
  "tools": ["tool1", "tool2", "tool3"],
  "principles": ["principle1", "principle2"],
  "practitioners": ["practitioner type 1", "practitioner type 2"],
  "associatedDeities": ["deity1", "deity2"],
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence description", "source": "Source text"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`,

  herbs: (entity) => `Generate a complete mythology asset JSON for the sacred plant/herb '${entity.name}' from ${entity.culture} tradition.

Return ONLY valid JSON with this structure:
{
  "id": "${entity.id}",
  "name": "${entity.name}",
  "type": "herb",
  "mythology": "${entity.culture.toLowerCase()}",
  "status": "published",
  "authorId": "ai-generated",
  "description": "(500+ characters describing this plant, its mythological significance, ritual uses, and cultural importance)",
  "subtitle": "(Brief 5-10 word subtitle)",
  "icon": "(single appropriate emoji)",
  "properties": ["property1", "property2", "property3"],
  "ritualUses": ["use1", "use2", "use3"],
  "associatedDeities": ["deity1", "deity2"],
  "symbolism": ["symbol1", "symbol2"],
  "preparations": ["preparation method 1", "preparation method 2"],
  "keyMyths": [
    {"title": "Title", "description": "2-3 sentence description", "source": "Source text"}
  ],
  "sources": [
    {"author": "Author Name", "work": "Work Title", "description": "Brief description"}
  ],
  "corpusSearch": {
    "canonical": ["${entity.id}"],
    "variants": ["alternate names"]
  }
}

Return ONLY valid JSON. No markdown, no explanations.`
};

async function generateAsset(entity, type, apiKey) {
  const template = typeTemplates[type];
  if (!template) {
    return { success: false, name: entity.name, error: `Unknown type: ${type}` };
  }

  const prompt = template(entity);

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

    const outputDir = path.join(baseOutputDir, type);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outPath = path.join(outputDir, `${entity.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(asset, null, 2));
    return { success: true, name: entity.name };
  } catch (e) {
    return { success: false, name: entity.name, error: e.message };
  }
}

function generateId(name, culture) {
  // Create a URL-friendly ID from name and culture
  const base = name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const culturePrefix = culture.toLowerCase()
    .split(/[\s-]+/)[0]
    .replace(/[^a-z]/g, '');
  return `${culturePrefix}_${base}`;
}

async function run() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const apiKey = fs.readFileSync(apiKeyPath, 'utf8').trim();
  const type = manifest.type;

  // Add IDs to entities if not present
  manifest.entities.forEach(e => {
    if (!e.id) {
      e.id = generateId(e.name, e.culture);
    }
  });

  // Filter out existing assets
  const outputDir = path.join(baseOutputDir, type);
  const existingIds = new Set();
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach(f => {
      if (f.endsWith('.json')) {
        existingIds.add(f.replace('.json', ''));
      }
    });
  }

  const entities = manifest.entities.filter(e => !existingIds.has(e.id));
  console.log(`\n============================================================`);
  console.log(`  GENERATING ${type.toUpperCase()}`);
  console.log(`============================================================`);
  console.log(`  Manifest: ${entities.length} entities`);
  console.log(`  Already exist: ${manifest.entities.length - entities.length}`);
  console.log(`  To generate: ${entities.length}\n`);

  if (entities.length === 0) {
    console.log('Nothing to generate.');
    return;
  }

  const batchSize = 5;
  let success = 0, failed = 0;

  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    console.log(`Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entities.length/batchSize)}: ${batch.map(e => e.name).join(', ')}`);

    const results = await Promise.all(batch.map(e => generateAsset(e, type, apiKey)));

    for (const r of results) {
      if (r.success) {
        console.log('  ✓', r.name);
        success++;
      } else {
        console.log('  ✗', r.name + ':', r.error);
        failed++;
      }
    }

    if (i + batchSize < entities.length) {
      await new Promise(r => setTimeout(r, 5000)); // 5s delay between batches
    }
  }

  console.log(`\n============================================================`);
  console.log(`  GENERATION COMPLETE`);
  console.log(`============================================================`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`============================================================\n`);
}

run().catch(console.error);
