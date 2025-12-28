#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLACES_DIR = path.join(__dirname, '../firebase-assets-enhanced/places');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/places/enhancement-report.json');

let stats = {
  total: 0, enhanced: 0,
  fieldsAdded: { significance: 0, location: 0, associated_deities: 0, events: 0, cultural_significance: 0, primary_sources: 0, summary: 0 },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '').trim() : '';
}

function extractSignificance(place) {
  if (place.significance) return place.significance;

  const text = stripHtml(place.longDescription || place.description || '');
  const patterns = [/(?:significance|importance):?\s*([^.]+)/i, /(?:sacred|holy|important) (?:because|as|for) ([^.]+)/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractLocation(place) {
  if (place.location) return place.location;

  const text = stripHtml(place.longDescription || place.description || '');
  const patterns = [/located (?:in|at|on) ([^.,]+)/i, /(?:lies|sits|stands) (?:in|at|on) ([^.,]+)/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractDeities(place) {
  if (place.associated_deities && place.associated_deities.length > 0) return place.associated_deities;

  const deities = [];
  const text = stripHtml(place.longDescription || place.description || '');
  const patterns = [/(?:home|dwelling|realm) of ([A-Z][a-z]+)/g, /associated with ([A-Z][a-z]+)/g];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const deity = match[1].trim();
      if (deity && !deities.includes(deity)) deities.push(deity);
    }
  }
  return deities;
}

function extractEvents(place) {
  if (place.events && place.events.length > 0) return place.events;

  const events = [];
  const text = stripHtml(place.longDescription || place.description || '').toLowerCase();
  const patterns = [/(?:where|site of) ([^.,]+(?:battle|war|conflict|meeting|gathering))/gi];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const event = match[1].trim();
      if (event && !events.includes(event)) events.push(event);
    }
  }
  return events.slice(0, 3);
}

function generateCulturalSignificance(place) {
  if (place.cultural_significance) return place.cultural_significance;

  const mythology = place.mythology || place.primaryMythology || 'ancient';
  const name = place.displayName || place.name || 'This place';

  return `${name} is a significant sacred location in ${mythology} mythology, central to cosmological beliefs and religious practices.`;
}

function addPrimarySources(place) {
  if (place.primarySources && place.primarySources.length > 0) return place.primarySources;

  const mythology = place.mythology || place.primaryMythology;
  const sources = {
    greek: ['Theogony', 'Odyssey'],
    norse: ['Prose Edda', 'Poetic Edda'],
    hindu: ['Puranas', 'Mahabharata'],
    egyptian: ['Book of the Dead', 'Pyramid Texts']
  };

  return (sources[mythology] || []).slice(0, 2).map(s => ({ text: s, tradition: mythology, type: 'ancient_text' }));
}

function generateSummary(place) {
  if (place.summary) return place.summary;

  const short = stripHtml(place.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(place.longDescription || place.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A sacred place in ${place.mythology || 'ancient'} mythology.`;
}

function calculateCompleteness(place) {
  let score = 0;
  const fields = ['description', 'summary', 'significance', 'location', 'associated_deities', 'events', 'cultural_significance', 'primarySources'];

  for (const field of fields) {
    if (place[field]) {
      if (Array.isArray(place[field])) {
        score += place[field].length > 0 ? 1 : 0;
      } else if (typeof place[field] === 'string') {
        score += stripHtml(place[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }
  return score;
}

function enhancePlace(place) {
  const before = calculateCompleteness(place);
  const enhanced = { ...place };
  const added = [];

  const significance = extractSignificance(enhanced);
  if (significance && !enhanced.significance) {
    enhanced.significance = significance;
    added.push('significance');
    stats.fieldsAdded.significance++;
  }

  const location = extractLocation(enhanced);
  if (location && !enhanced.location) {
    enhanced.location = location;
    added.push('location');
    stats.fieldsAdded.location++;
  }

  const deities = extractDeities(enhanced);
  if (deities.length > 0 && (!enhanced.associated_deities || enhanced.associated_deities.length === 0)) {
    enhanced.associated_deities = deities;
    added.push('associated_deities');
    stats.fieldsAdded.associated_deities++;
  }

  const events = extractEvents(enhanced);
  if (events.length > 0 && (!enhanced.events || enhanced.events.length === 0)) {
    enhanced.events = events;
    added.push('events');
    stats.fieldsAdded.events++;
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
  enhanced.metadata.enhancement_agent = 'place_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processPlaces() {
  console.log('Starting place metadata enhancement...\n');

  if (!fs.existsSync(PLACES_DIR)) {
    console.log('Places directory not found, skipping...');
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

  scanDir(PLACES_DIR);

  console.log(`Found ${files.length} place files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const places = JSON.parse(content);

      const placeArray = Array.isArray(places) ? places : [places];
      const enhancedArray = [];

      for (const place of placeArray) {
        const beforeScore = calculateCompleteness(place);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhancePlace(place);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${place.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(places) ? enhancedArray : enhancedArray[0];
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
      places_enhanced: stats.enhanced,
      enhancement_rate: stats.total > 0 ? `${((stats.enhanced / stats.total) * 100).toFixed(1)}%` : '0%',
      completeness_improvement: { before: stats.before, after: stats.after }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total places processed: ${stats.total}`);
  console.log(`Places enhanced: ${stats.enhanced}`);
}

processPlaces();
