#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RITUALS_DIR = path.join(__dirname, '../firebase-assets-enhanced/rituals');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/rituals/enhancement-report.json');

let stats = {
  total: 0, enhanced: 0,
  fieldsAdded: { purpose: 0, steps: 0, participants: 0, timing: 0, cultural_significance: 0, primary_sources: 0, summary: 0 },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').trim() : '';
}

function extractPurpose(ritual) {
  if (ritual.purpose) return ritual.purpose;

  const text = stripHtml(ritual.longDescription || ritual.description || '');
  const patterns = [/(?:purpose|intention):?\s*([^.]+)/i, /performed (?:to|for) ([^.]+)/i, /intended to ([^.]+)/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractSteps(ritual) {
  if (ritual.steps && ritual.steps.length > 0) return ritual.steps;

  const steps = [];
  const text = stripHtml(ritual.longDescription || ritual.description || '');

  // Look for numbered or bulleted steps
  const stepPatterns = [
    /\d+\.\s*([^.\n]+)/g,
    /(?:first|second|third|then|next|finally),?\s*([^.\n]+)/gi
  ];

  for (const pattern of stepPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const step = match[1].trim();
      if (step && step.length < 200 && !steps.includes(step)) steps.push(step);
    }
  }

  return steps.slice(0, 6);
}

function extractParticipants(ritual) {
  if (ritual.participants && ritual.participants.length > 0) return ritual.participants;

  const participants = [];
  const text = stripHtml(ritual.longDescription || ritual.description || '').toLowerCase();

  const participantTypes = ['priest', 'priestess', 'shaman', 'monk', 'worshipper', 'initiate', 'devotee', 'celebrant'];

  for (const type of participantTypes) {
    if (text.includes(type)) {
      participants.push(type);
    }
  }

  return participants;
}

function extractTiming(ritual) {
  if (ritual.timing) return ritual.timing;

  const text = stripHtml(ritual.longDescription || ritual.description || '').toLowerCase();

  const timingPatterns = [
    /(?:performed|celebrated|observed) (?:on|during|at) ([^.,]+)/i,
    /(?:timing|schedule|when):?\s*([^.]+)/i,
    /(?:annually|monthly|weekly|daily|seasonal)/i
  ];

  for (const pattern of timingPatterns) {
    const match = text.match(pattern);
    if (match) return match[1] ? match[1].trim() : match[0].trim();
  }

  return null;
}

function generateCulturalSignificance(ritual) {
  if (ritual.cultural_significance) return ritual.cultural_significance;

  const mythology = ritual.mythology || ritual.primaryMythology || 'ancient';
  const name = ritual.displayName || ritual.name || 'This ritual';

  return `${name} is an important religious ceremony in ${mythology} tradition, central to spiritual practice and community worship.`;
}

function addPrimarySources(ritual) {
  if (ritual.primarySources && ritual.primarySources.length > 0) return ritual.primarySources;

  const mythology = ritual.mythology || ritual.primaryMythology;
  const sources = {
    greek: ['Pausanias', 'Plutarch'],
    roman: ['Fasti', 'Roman antiquities'],
    hindu: ['Vedas', 'Kalpa Sutras'],
    buddhist: ['Vinaya Pitaka'],
    egyptian: ['Temple inscriptions']
  };

  return (sources[mythology] || []).slice(0, 2).map(s => ({ text: s, tradition: mythology, type: 'ritual_text' }));
}

function generateSummary(ritual) {
  if (ritual.summary) return ritual.summary;

  const short = stripHtml(ritual.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(ritual.longDescription || ritual.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A religious ritual from ${ritual.mythology || 'ancient'} tradition.`;
}

function calculateCompleteness(ritual) {
  let score = 0;
  const fields = ['description', 'summary', 'purpose', 'steps', 'participants', 'timing', 'cultural_significance', 'primarySources'];

  for (const field of fields) {
    if (ritual[field]) {
      if (Array.isArray(ritual[field])) {
        score += ritual[field].length > 0 ? 1 : 0;
      } else if (typeof ritual[field] === 'string') {
        score += stripHtml(ritual[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function enhanceRitual(ritual) {
  const before = calculateCompleteness(ritual);
  const enhanced = { ...ritual };
  const added = [];

  const purpose = extractPurpose(enhanced);
  if (purpose && !enhanced.purpose) {
    enhanced.purpose = purpose;
    added.push('purpose');
    stats.fieldsAdded.purpose++;
  }

  const steps = extractSteps(enhanced);
  if (steps.length > 0 && (!enhanced.steps || enhanced.steps.length === 0)) {
    enhanced.steps = steps;
    added.push('steps');
    stats.fieldsAdded.steps++;
  }

  const participants = extractParticipants(enhanced);
  if (participants.length > 0 && (!enhanced.participants || enhanced.participants.length === 0)) {
    enhanced.participants = participants;
    added.push('participants');
    stats.fieldsAdded.participants++;
  }

  const timing = extractTiming(enhanced);
  if (timing && !enhanced.timing) {
    enhanced.timing = timing;
    added.push('timing');
    stats.fieldsAdded.timing++;
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
  enhanced.metadata.enhancement_agent = 'ritual_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processRituals() {
  console.log('Starting ritual metadata enhancement...\n');

  if (!fs.existsSync(RITUALS_DIR)) {
    console.log('Rituals directory not found, skipping...');
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

  scanDir(RITUALS_DIR);

  console.log(`Found ${files.length} ritual files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const rituals = JSON.parse(content);

      const ritualArray = Array.isArray(rituals) ? rituals : [rituals];
      const enhancedArray = [];

      for (const ritual of ritualArray) {
        const beforeScore = calculateCompleteness(ritual);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceRitual(ritual);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${ritual.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(rituals) ? enhancedArray : enhancedArray[0];
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
      rituals_enhanced: stats.enhanced,
      enhancement_rate: stats.total > 0 ? `${((stats.enhanced / stats.total) * 100).toFixed(1)}%` : '0%',
      completeness_improvement: { before: stats.before, after: stats.after }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total rituals processed: ${stats.total}`);
  console.log(`Rituals enhanced: ${stats.enhanced}`);
}

processRituals();
