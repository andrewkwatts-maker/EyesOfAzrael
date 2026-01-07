/**
 * Herb Enrichment Script
 * Parses HTML files from _recovered-html/FIREBASE/herbalism and enriches
 * the corresponding JSON files in firebase-assets-downloaded/herbs
 *
 * Adds: mythology, healing, magic, traditions, extendedContent fields
 */

const fs = require('fs');
const path = require('path');

// Paths
const HTML_BASE = path.join(__dirname, '..', '_recovered-html', 'FIREBASE', 'herbalism');
const JSON_BASE = path.join(__dirname, '..', 'firebase-assets-downloaded', 'herbs');

// HTML to JSON file mapping - all confirmed existing files
const FILE_MAPPINGS = [
  // Universal herbs
  { html: 'universal/soma.html', json: 'hindu_soma.json', mythology: 'hindu' },
  { html: 'universal/frankincense.html', json: 'universal_frankincense.json', mythology: 'universal' },
  { html: 'universal/myrrh.html', json: 'universal_myrrh.json', mythology: 'universal' },
  { html: 'universal/blue-lotus.html', json: 'egyptian_lotus.json', mythology: 'egyptian' },
  { html: 'universal/mandrake.html', json: 'jewish_mandrake.json', mythology: 'jewish' },
  { html: 'universal/mugwort.html', json: 'norse_mugwort.json', mythology: 'norse' },

  // Buddhist herbs
  { html: 'traditions/buddhist/bodhi-tree.html', json: 'buddhist_bodhi.json', mythology: 'buddhist' },
  { html: 'traditions/buddhist/lotus.html', json: 'buddhist_lotus.json', mythology: 'buddhist' },
  { html: 'traditions/buddhist/sandalwood.html', json: 'buddhist_sandalwood.json', mythology: 'buddhist' },
  { html: 'traditions/buddhist/tea.html', json: 'buddhist_tea.json', mythology: 'buddhist' },

  // Hindu herbs
  { html: 'traditions/hindu/tulsi.html', json: 'hindu_tulsi.json', mythology: 'hindu' },

  // Jewish herbs
  { html: 'traditions/jewish/hyssop.html', json: 'jewish_hyssop.json', mythology: 'jewish' },
  { html: 'traditions/jewish/mandrake.html', json: 'jewish_mandrake.json', mythology: 'jewish' },

  // Norse herbs
  { html: 'traditions/norse/ash.html', json: 'norse_ash.json', mythology: 'norse' },
  { html: 'traditions/norse/elder.html', json: 'norse_elder.json', mythology: 'norse' },
  { html: 'traditions/norse/yew.html', json: 'norse_yew.json', mythology: 'norse' },

  // Persian herbs
  { html: 'universal/soma.html', json: 'persian_haoma.json', mythology: 'persian' }, // Soma/Haoma related

  // Greek herbs (if HTML available, use universal sources)
  { html: 'universal/cedar.html', json: 'greek_laurel.json', mythology: 'greek' },
  { html: 'universal/sage.html', json: 'greek_myrtle.json', mythology: 'greek' },

  // Norse additional
  { html: 'traditions/norse/yew.html', json: 'norse_yggdrasil.json', mythology: 'norse' },
  { html: 'universal/mugwort.html', json: 'norse_yarrow.json', mythology: 'norse' },
];

/**
 * Extract text content from HTML between specific tags or sections
 */
function extractTextFromHTML(html, startPattern, endPattern) {
  const startMatch = html.search(startPattern);
  if (startMatch === -1) return '';

  const searchStart = startMatch;
  const endMatch = html.slice(searchStart).search(endPattern);
  if (endMatch === -1) return '';

  const section = html.slice(searchStart, searchStart + endMatch);
  // Remove HTML tags and clean up
  return section
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '->')
    .replace(/&larr;/g, '<-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract list items from HTML
 */
function extractListItems(html, sectionId) {
  const sectionPattern = new RegExp(`id="${sectionId}"[^>]*>([\\s\\S]*?)(?=<div[^>]*id="|<section|<\\/main>)`, 'i');
  const match = html.match(sectionPattern);
  if (!match) return [];

  const section = match[1];
  const liPattern = /<li[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/li>/gi;
  const items = [];
  let liMatch;

  while ((liMatch = liPattern.exec(section)) !== null) {
    const text = liMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text && text.length > 5) {
      items.push(text);
    }
  }

  return items.slice(0, 20); // Limit to 20 items
}

/**
 * Extract healing/medicinal uses from HTML
 */
function extractHealingUses(html) {
  const healing = {
    medicinal: [],
    properties: [],
    preparations: []
  };

  // Look for medicinal sections
  const medicinalPattern = /<div[^>]*class="medicinal-use"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = medicinalPattern.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    if (text) healing.medicinal.push(text);
  }

  // Look for preparation methods
  const prepPattern = /<div[^>]*class="prep-method"[^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = prepPattern.exec(html)) !== null) {
    const text = match[1]
      .replace(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi, '$1: ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);
    if (text) healing.preparations.push(text);
  }

  return healing;
}

/**
 * Extract magical/spiritual uses from HTML
 */
function extractMagicalUses(html) {
  const magic = {
    spiritual: [],
    ritual: [],
    correspondences: []
  };

  // Look for magic sections
  const magicPattern = /<div[^>]*class="magic-use"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = magicPattern.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    if (text) magic.spiritual.push(text);
  }

  // Extract correspondences (Planet, Element, etc.)
  const corrPatterns = [
    /Element:<\/strong>\s*([^<]+)/gi,
    /Planet:<\/strong>\s*([^<]+)/gi,
    /Zodiac:<\/strong>\s*([^<]+)/gi,
    /Deities:<\/strong>\s*([^<]+)/gi,
    /Chakras?:<\/strong>\s*([^<]+)/gi,
  ];

  for (const pattern of corrPatterns) {
    let corrMatch;
    while ((corrMatch = pattern.exec(html)) !== null) {
      magic.correspondences.push(corrMatch[1].trim());
    }
  }

  return magic;
}

/**
 * Extract traditions/cultural usage from HTML
 */
function extractTraditions(html) {
  const traditions = {};

  // Look for cultural usage sections
  const culturalPattern = /<div[^>]*class="cultural-usage"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  let index = 0;

  while ((match = culturalPattern.exec(html)) !== null) {
    const section = match[1];
    // Try to extract tradition name from h3 or h4
    const titleMatch = section.match(/<h[34][^>]*>([^<]+)</i);
    const title = titleMatch
      ? titleMatch[1].replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase().replace(/\s+/g, '_')
      : `tradition_${index}`;

    const text = section
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 800);

    if (title && text) {
      traditions[title] = {
        usage: text.slice(0, 400),
        significance: text.slice(400, 800)
      };
    }
    index++;
  }

  return traditions;
}

/**
 * Extract hero/overview content
 */
function extractOverview(html) {
  const heroPattern = /<div[^>]*class="herb-hero"[^>]*>([\s\S]*?)<\/div>/i;
  const match = html.match(heroPattern);
  if (!match) return '';

  return match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

/**
 * Extract mythology associations
 */
function extractMythology(html) {
  const mythology = {
    overview: '',
    deities: [],
    myths: [],
    symbolism: []
  };

  // Extract from mythology section
  const mythPattern = /<div[^>]*id="mythology"[^>]*>([\s\S]*?)(?=<div[^>]*id="|<section|<\/main>)/i;
  const match = html.match(mythPattern);
  if (match) {
    mythology.overview = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);
  }

  // Extract deity connections
  const deityPattern = /<div[^>]*class="deity-connection"[^>]*>([\s\S]*?)<\/div>/gi;
  let deityMatch;
  while ((deityMatch = deityPattern.exec(html)) !== null) {
    const text = deityMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    if (text) mythology.deities.push(text);
  }

  return mythology;
}

/**
 * Process a single HTML file and enrich the corresponding JSON
 */
function processFile(mapping) {
  const htmlPath = path.join(HTML_BASE, mapping.html);

  if (!fs.existsSync(htmlPath)) {
    console.log(`  [SKIP] HTML not found: ${mapping.html}`);
    return null;
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Extract enrichment data
  const enrichmentData = {
    mythology: extractMythology(html),
    healing: extractHealingUses(html),
    magic: extractMagicalUses(html),
    traditions: extractTraditions(html),
    extendedContent: {
      overview: extractOverview(html),
      fullDescription: extractTextFromHTML(html, /<main>/, /<\/main>/).slice(0, 5000)
    }
  };

  // If there's no JSON file, just return the extracted data
  if (!mapping.json) {
    console.log(`  [INFO] No JSON target for ${mapping.html}`);
    return { extracted: true, noTarget: true, data: enrichmentData };
  }

  const jsonPath = path.join(JSON_BASE, mapping.json);

  if (!fs.existsSync(jsonPath)) {
    console.log(`  [SKIP] JSON not found: ${mapping.json}`);
    return null;
  }

  // Read and enrich JSON
  let jsonData;
  try {
    jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    console.log(`  [ERROR] Failed to parse ${mapping.json}: ${err.message}`);
    return null;
  }

  // Merge enrichment data
  const enriched = {
    ...jsonData,
    mythology: mapping.mythology,
    mythologyDetails: enrichmentData.mythology,
    healing: enrichmentData.healing,
    magic: enrichmentData.magic,
    traditions: {
      ...(jsonData.traditions || {}),
      ...enrichmentData.traditions
    },
    extendedContent: enrichmentData.extendedContent,
    enrichedFromHTML: true,
    enrichmentDate: new Date().toISOString(),
    _modified: new Date().toISOString()
  };

  // Write enriched JSON
  fs.writeFileSync(jsonPath, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`  [ENRICHED] ${mapping.json}`);

  return { enriched: true, path: jsonPath };
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(60));
  console.log('HERBALISM JSON ENRICHMENT FROM HTML');
  console.log('='.repeat(60));
  console.log(`HTML Source: ${HTML_BASE}`);
  console.log(`JSON Target: ${JSON_BASE}`);
  console.log('');

  let enrichedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const mapping of FILE_MAPPINGS) {
    console.log(`Processing: ${mapping.html}`);
    const result = processFile(mapping);

    if (!result) {
      skippedCount++;
    } else if (result.enriched) {
      enrichedCount++;
    } else if (result.noTarget) {
      skippedCount++;
    } else {
      errorCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('ENRICHMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Enriched: ${enrichedCount} files`);
  console.log(`Skipped:  ${skippedCount} files`);
  console.log(`Errors:   ${errorCount} files`);
  console.log('');

  return { enrichedCount, skippedCount, errorCount };
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, processFile };
