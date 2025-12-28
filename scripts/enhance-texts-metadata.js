#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TEXTS_DIR = path.join(__dirname, '../firebase-assets-enhanced/texts');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/texts/enhancement-report.json');

let stats = {
  total: 0, enhanced: 0,
  fieldsAdded: { author: 0, date: 0, content_summary: 0, significance: 0, cultural_significance: 0, primary_sources: 0, summary: 0 },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').trim() : '';
}

function extractAuthor(text) {
  if (text.author) return text.author;

  const desc = stripHtml(text.longDescription || text.description || '');
  const patterns = [
    /(?:written|authored|composed) by ([A-Z][a-z\s]+)/i,
    /(?:author|writer):?\s*([A-Z][a-z\s]+)/i,
    /attributed to ([A-Z][a-z\s]+)/i
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].trim();
  }

  return 'Unknown';
}

function extractDate(text) {
  if (text.date) return text.date;

  const desc = stripHtml(text.longDescription || text.description || '');
  const patterns = [
    /(?:written|composed|dated) (?:in|circa|c\.) ([^.,]+)/i,
    /(?:date|period):?\s*([^.]+)/i,
    /(\d+(?:st|nd|rd|th)?\s+century)/i,
    /(\d{3,4}\s*(?:BCE|CE|BC|AD))/i
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractContentSummary(text) {
  if (text.content_summary) return text.content_summary;

  const long = stripHtml(text.longDescription || text.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 3).join(' ').trim();
  }

  return null;
}

function extractSignificance(text) {
  if (text.significance) return text.significance;

  const desc = stripHtml(text.longDescription || text.description || '');
  const patterns = [
    /(?:significance|importance):?\s*([^.]+)/i,
    /(?:important|significant) (?:because|as|for) ([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function generateCulturalSignificance(text) {
  if (text.cultural_significance) return text.cultural_significance;

  const mythology = text.mythology || text.primaryMythology || 'ancient';
  const name = text.displayName || text.name || 'This text';

  return `${name} is a foundational text in ${mythology} tradition, preserving important mythological, religious, and cultural knowledge.`;
}

function addPrimarySources(text) {
  if (text.primarySources && text.primarySources.length > 0) return text.primarySources;

  // For texts, they ARE primary sources, so we mark them as such
  const mythology = text.mythology || text.primaryMythology;

  return [{
    text: text.displayName || text.name || 'This text',
    tradition: mythology,
    type: 'primary_text',
    self_referential: true
  }];
}

function generateSummary(text) {
  if (text.summary) return text.summary;

  const short = stripHtml(text.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(text.longDescription || text.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `An important text from ${text.mythology || 'ancient'} tradition.`;
}

function calculateCompleteness(text) {
  let score = 0;
  const fields = ['description', 'summary', 'author', 'date', 'content_summary', 'significance', 'cultural_significance', 'primarySources'];

  for (const field of fields) {
    if (text[field]) {
      if (Array.isArray(text[field])) {
        score += text[field].length > 0 ? 1 : 0;
      } else if (typeof text[field] === 'string') {
        score += stripHtml(text[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function enhanceText(text) {
  const before = calculateCompleteness(text);
  const enhanced = { ...text };
  const added = [];

  const author = extractAuthor(enhanced);
  if (author && !enhanced.author) {
    enhanced.author = author;
    added.push('author');
    stats.fieldsAdded.author++;
  }

  const date = extractDate(enhanced);
  if (date && !enhanced.date) {
    enhanced.date = date;
    added.push('date');
    stats.fieldsAdded.date++;
  }

  const contentSummary = extractContentSummary(enhanced);
  if (contentSummary && !enhanced.content_summary) {
    enhanced.content_summary = contentSummary;
    added.push('content_summary');
    stats.fieldsAdded.content_summary++;
  }

  const significance = extractSignificance(enhanced);
  if (significance && !enhanced.significance) {
    enhanced.significance = significance;
    added.push('significance');
    stats.fieldsAdded.significance++;
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
  enhanced.metadata.enhancement_agent = 'text_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processTexts() {
  console.log('Starting text metadata enhancement...\n');

  if (!fs.existsSync(TEXTS_DIR)) {
    console.log('Texts directory not found, skipping...');
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

  scanDir(TEXTS_DIR);

  console.log(`Found ${files.length} text files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const texts = JSON.parse(content);

      const textArray = Array.isArray(texts) ? texts : [texts];
      const enhancedArray = [];

      for (const text of textArray) {
        const beforeScore = calculateCompleteness(text);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceText(text);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${text.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(texts) ? enhancedArray : enhancedArray[0];
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
      texts_enhanced: stats.enhanced,
      enhancement_rate: stats.total > 0 ? `${((stats.enhanced / stats.total) * 100).toFixed(1)}%` : '0%',
      completeness_improvement: { before: stats.before, after: stats.after }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total texts processed: ${stats.total}`);
  console.log(`Texts enhanced: ${stats.enhanced}`);
}

processTexts();
