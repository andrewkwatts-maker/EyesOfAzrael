#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SYMBOLS_DIR = path.join(__dirname, '../firebase-assets-enhanced/symbols');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/symbols/enhancement-report.json');

let stats = {
  total: 0, enhanced: 0,
  fieldsAdded: { meaning: 0, usage: 0, variations: 0, cultural_context: 0, cultural_significance: 0, primary_sources: 0, summary: 0 },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').trim() : '';
}

function extractMeaning(symbol) {
  if (symbol.meaning) return symbol.meaning;

  const desc = stripHtml(symbol.longDescription || symbol.description || '');
  const patterns = [
    /(?:meaning|represents?|symbolizes?):?\s*([^.]+)/i,
    /(?:stands for|signifies) ([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractUsage(symbol) {
  if (symbol.usage) return symbol.usage;

  const desc = stripHtml(symbol.longDescription || symbol.description || '');
  const patterns = [
    /used (?:in|for|as) ([^.]+)/i,
    /(?:usage|application):?\s*([^.]+)/i,
    /appears (?:in|on|at) ([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractVariations(symbol) {
  if (symbol.variations && symbol.variations.length > 0) return symbol.variations;

  const variations = [];
  const desc = stripHtml(symbol.longDescription || symbol.description || '');

  const patterns = [
    /(?:variations?|forms?|versions?):?\s*([^.]+)/gi,
    /also (?:known|depicted|shown) as ([^.,]+)/gi,
    /sometimes (?:called|represented as) ([^.,]+)/gi
  ];

  for (const pattern of patterns) {
    const matches = desc.matchAll(pattern);
    for (const match of matches) {
      const variation = match[1].trim();
      if (variation && !variations.includes(variation)) variations.push(variation);
    }
  }

  return variations.slice(0, 4);
}

function extractCulturalContext(symbol) {
  if (symbol.cultural_context) return symbol.cultural_context;

  const desc = stripHtml(symbol.longDescription || symbol.description || '');
  const patterns = [
    /(?:cultural context|cultural significance):?\s*([^.]+)/i,
    /in (?:ancient|traditional) ([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function generateCulturalSignificance(symbol) {
  if (symbol.cultural_significance) return symbol.cultural_significance;

  const mythology = symbol.mythology || symbol.primaryMythology || 'ancient';
  const name = symbol.displayName || symbol.name || 'This symbol';

  return `${name} is a sacred symbol in ${mythology} tradition, representing profound spiritual and cosmological concepts.`;
}

function addPrimarySources(symbol) {
  if (symbol.primarySources && symbol.primarySources.length > 0) return symbol.primarySources;

  const mythology = symbol.mythology || symbol.primaryMythology;
  const sources = {
    greek: ['Archaeological evidence', 'Temple inscriptions'],
    egyptian: ['Hieroglyphic texts', 'Temple art'],
    hindu: ['Iconographic studies', 'Temple architecture'],
    buddhist: ['Iconography texts', 'Mandalas']
  };

  return (sources[mythology] || []).slice(0, 2).map(s => ({ text: s, tradition: mythology, type: 'iconographic_source' }));
}

function generateSummary(symbol) {
  if (symbol.summary) return symbol.summary;

  const short = stripHtml(symbol.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(symbol.longDescription || symbol.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A sacred symbol from ${symbol.mythology || 'ancient'} tradition.`;
}

function calculateCompleteness(symbol) {
  let score = 0;
  const fields = ['description', 'summary', 'meaning', 'usage', 'variations', 'cultural_context', 'cultural_significance', 'primarySources'];

  for (const field of fields) {
    if (symbol[field]) {
      if (Array.isArray(symbol[field])) {
        score += symbol[field].length > 0 ? 1 : 0;
      } else if (typeof symbol[field] === 'string') {
        score += stripHtml(symbol[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function enhanceSymbol(symbol) {
  const before = calculateCompleteness(symbol);
  const enhanced = { ...symbol };
  const added = [];

  const meaning = extractMeaning(enhanced);
  if (meaning && !enhanced.meaning) {
    enhanced.meaning = meaning;
    added.push('meaning');
    stats.fieldsAdded.meaning++;
  }

  const usage = extractUsage(enhanced);
  if (usage && !enhanced.usage) {
    enhanced.usage = usage;
    added.push('usage');
    stats.fieldsAdded.usage++;
  }

  const variations = extractVariations(enhanced);
  if (variations.length > 0 && (!enhanced.variations || enhanced.variations.length === 0)) {
    enhanced.variations = variations;
    added.push('variations');
    stats.fieldsAdded.variations++;
  }

  const culturalContext = extractCulturalContext(enhanced);
  if (culturalContext && !enhanced.cultural_context) {
    enhanced.cultural_context = culturalContext;
    added.push('cultural_context');
    stats.fieldsAdded.cultural_context++;
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
  enhanced.metadata.enhancement_agent = 'symbol_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processSymbols() {
  console.log('Starting symbol metadata enhancement...\n');

  if (!fs.existsSync(SYMBOLS_DIR)) {
    console.log('Symbols directory not found, skipping...');
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

  scanDir(SYMBOLS_DIR);

  console.log(`Found ${files.length} symbol files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const symbols = JSON.parse(content);

      const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
      const enhancedArray = [];

      for (const symbol of symbolArray) {
        const beforeScore = calculateCompleteness(symbol);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceSymbol(symbol);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${symbol.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(symbols) ? enhancedArray : enhancedArray[0];
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
      symbols_enhanced: stats.enhanced,
      enhancement_rate: stats.total > 0 ? `${((stats.enhanced / stats.total) * 100).toFixed(1)}%` : '0%',
      completeness_improvement: { before: stats.before, after: stats.after }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total symbols processed: ${stats.total}`);
  console.log(`Symbols enhanced: ${stats.enhanced}`);
}

processSymbols();
