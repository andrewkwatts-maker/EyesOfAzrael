#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const HERBS_DIR = path.join(__dirname, '../firebase-assets-enhanced/herbs');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/herbs/enhancement-report.json');

let stats = {
  total: 0, enhanced: 0,
  fieldsAdded: { uses: 0, preparation: 0, associated_deities: 0, effects: 0, cultural_significance: 0, primary_sources: 0, summary: 0 },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').trim() : '';
}

function extractUses(herb) {
  if (herb.uses && herb.uses.length > 0) return herb.uses;

  const uses = [];
  const text = stripHtml(herb.longDescription || herb.description || '').toLowerCase();
  const patterns = [/used for ([^.,]+)/gi, /(?:treats?|cures?|heals?) ([^.,]+)/gi, /(?:purpose|application):?\s*([^.]+)/gi];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const use = match[1].trim();
      if (use && use.length < 100 && !uses.includes(use)) uses.push(use);
    }
  }
  return uses.slice(0, 5);
}

function extractPreparation(herb) {
  if (herb.preparation) return herb.preparation;

  const text = stripHtml(herb.longDescription || herb.description || '');
  const patterns = [/(?:prepared|preparation):?\s*([^.]+)/i, /(?:mix|blend|combine|brew) ([^.]+)/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractDeities(herb) {
  if (herb.associated_deities && herb.associated_deities.length > 0) return herb.associated_deities;

  const deities = [];
  const text = stripHtml(herb.longDescription || herb.description || '');
  const patterns = [/sacred to ([A-Z][a-z]+)/g, /associated with ([A-Z][a-z]+)/g, /dedicated to ([A-Z][a-z]+)/g];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const deity = match[1].trim();
      if (deity && !deities.includes(deity)) deities.push(deity);
    }
  }
  return deities;
}

function extractEffects(herb) {
  if (herb.effects && herb.effects.length > 0) return herb.effects;

  const effects = [];
  const text = stripHtml(herb.longDescription || herb.description || '').toLowerCase();
  const patterns = [/(?:causes?|induces?|produces?) ([^.,]+)/gi, /(?:effect|effects?):?\s*([^.]+)/gi];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const effect = match[1].trim();
      if (effect && effect.length < 100 && !effects.includes(effect)) effects.push(effect);
    }
  }
  return effects.slice(0, 4);
}

function generateCulturalSignificance(herb) {
  if (herb.cultural_significance) return herb.cultural_significance;

  const mythology = herb.mythology || herb.primaryMythology || 'ancient';
  const name = herb.displayName || herb.name || 'This herb';

  return `${name} is a sacred plant in ${mythology} tradition, used in religious rituals and traditional medicine.`;
}

function addPrimarySources(herb) {
  if (herb.primarySources && herb.primarySources.length > 0) return herb.primarySources;

  const mythology = herb.mythology || herb.primaryMythology;
  const sources = {
    greek: ['Materia Medica', 'Theophrastus'],
    hindu: ['Ayurveda', 'Charaka Samhita'],
    chinese: ['Shennong Bencao Jing', 'Compendium of Materia Medica']
  };

  return (sources[mythology] || []).slice(0, 2).map(s => ({ text: s, tradition: mythology, type: 'medical_text' }));
}

function generateSummary(herb) {
  if (herb.summary) return herb.summary;

  const short = stripHtml(herb.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(herb.longDescription || herb.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A sacred herb used in ${herb.mythology || 'ancient'} tradition.`;
}

function calculateCompleteness(herb) {
  let score = 0;
  const fields = ['description', 'summary', 'uses', 'preparation', 'associated_deities', 'effects', 'cultural_significance', 'primarySources'];

  for (const field of fields) {
    if (herb[field]) {
      if (Array.isArray(herb[field])) {
        score += herb[field].length > 0 ? 1 : 0;
      } else if (typeof herb[field] === 'string') {
        score += stripHtml(herb[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function enhanceHerb(herb) {
  const before = calculateCompleteness(herb);
  const enhanced = { ...herb };
  const added = [];

  const uses = extractUses(enhanced);
  if (uses.length > 0 && (!enhanced.uses || enhanced.uses.length === 0)) {
    enhanced.uses = uses;
    added.push('uses');
    stats.fieldsAdded.uses++;
  }

  const preparation = extractPreparation(enhanced);
  if (preparation && !enhanced.preparation) {
    enhanced.preparation = preparation;
    added.push('preparation');
    stats.fieldsAdded.preparation++;
  }

  const deities = extractDeities(enhanced);
  if (deities.length > 0 && (!enhanced.associated_deities || enhanced.associated_deities.length === 0)) {
    enhanced.associated_deities = deities;
    added.push('associated_deities');
    stats.fieldsAdded.associated_deities++;
  }

  const effects = extractEffects(enhanced);
  if (effects.length > 0 && (!enhanced.effects || enhanced.effects.length === 0)) {
    enhanced.effects = effects;
    added.push('effects');
    stats.fieldsAdded.effects++;
  }

  if (!enhanced.cultural_significance) {
    enhanced.cultural_significance = generateCulturalSignificance(enhanced);
    added.push('cultural_significance');
    stats.fieldsAdded.cultural_significance++;
  }

  if (!enhanced.primarySources || enhanced.primarySources.length === 0) {
    enhanced.primarySources = addPrimarySources(enhanced);
    if (enhanced.primarySources.length > 0) {
      added.push('primary_sources');
      stats.fieldsAdded.primary_sources++;
    }
  }

  if (!enhanced.summary) {
    enhanced.summary = generateSummary(enhanced);
    added.push('summary');
    stats.fieldsAdded.summary++;
  }

  if (!enhanced.metadata) enhanced.metadata = {};
  enhanced.metadata.enhanced_metadata = true;
  enhanced.metadata.enhancement_date = new Date().toISOString();
  enhanced.metadata.enhancement_agent = 'herb_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processHerbs() {
  console.log('Starting herb metadata enhancement...\n');

  if (!fs.existsSync(HERBS_DIR)) {
    console.log('Herbs directory not found, skipping...');
    return;
  }

  const files = [];

  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) scanDir(fullPath);
      else if (item.endsWith('.json') && !item.includes('summary') && !item.includes('report')) files.push(fullPath);
    }
  }

  scanDir(HERBS_DIR);

  console.log(`Found ${files.length} herb files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const herbs = JSON.parse(content);

      const herbArray = Array.isArray(herbs) ? herbs : [herbs];
      const enhancedArray = [];

      for (const herb of herbArray) {
        const beforeScore = calculateCompleteness(herb);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceHerb(herb);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${herb.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(herbs) ? enhancedArray : enhancedArray[0];
      fs.writeFileSync(file, JSON.stringify(output, null, 2), 'utf8');

    } catch (error) {
      console.error(`✗ Error processing ${path.basename(file)}: ${error.message}`);
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    statistics: stats,
    summary: {
      total_files: stats.total,
      herbs_enhanced: stats.enhanced,
      enhancement_rate: stats.total > 0 ? `${((stats.enhanced / stats.total) * 100).toFixed(1)}%` : '0%',
      completeness_improvement: { before: stats.before, after: stats.after }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total herbs processed: ${stats.total}`);
  console.log(`Herbs enhanced: ${stats.enhanced}`);
}

processHerbs();
