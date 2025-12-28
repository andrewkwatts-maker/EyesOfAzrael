#!/usr/bin/env node

/**
 * Deity Metadata Enhancement Script
 *
 * Enhances all deity JSON files with rich metadata for better rendering:
 * - description (auto-generated if missing)
 * - summary (1-2 sentence overview)
 * - domains (array of deity roles)
 * - symbols (associated symbols)
 * - epithets (alternative names/titles)
 * - cultural_significance (importance in mythology)
 * - primary_sources (ancient texts)
 * - geographic_region (where worshipped)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEITIES_DIR = path.join(__dirname, '../firebase-assets-enhanced/deities');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/deities/enhancement-report.json');

// Domain-based knowledge for intelligent metadata generation
const DOMAIN_KNOWLEDGE = {
  war: {
    cultural_significance: 'Revered as a divine warrior and protector in battle',
    related_symbols: ['spear', 'sword', 'shield', 'helmet', 'armor'],
    geographic_hint: 'warrior cult'
  },
  sun: {
    cultural_significance: 'Worshipped as the source of light, life, and cosmic order',
    related_symbols: ['solar disk', 'rays', 'chariot', 'golden'],
    geographic_hint: 'solar cult'
  },
  wisdom: {
    cultural_significance: 'Venerated as a source of divine knowledge and guidance',
    related_symbols: ['book', 'scroll', 'owl', 'staff'],
    geographic_hint: 'centers of learning'
  },
  death: {
    cultural_significance: 'Governs the transition between life and death, guiding souls',
    related_symbols: ['skull', 'scythe', 'underworld', 'darkness'],
    geographic_hint: 'funerary practices'
  },
  love: {
    cultural_significance: 'Embodies divine love, beauty, and desire',
    related_symbols: ['rose', 'dove', 'heart', 'mirror'],
    geographic_hint: 'fertility cults'
  },
  thunder: {
    cultural_significance: 'Wields the power of storms and atmospheric phenomena',
    related_symbols: ['lightning bolt', 'hammer', 'storm clouds'],
    geographic_hint: 'storm worship'
  },
  sea: {
    cultural_significance: 'Rules over oceans, waterways, and maritime endeavors',
    related_symbols: ['trident', 'waves', 'fish', 'dolphin'],
    geographic_hint: 'coastal regions'
  }
};

// Mythology-specific geographic regions
const MYTHOLOGY_REGIONS = {
  greek: 'Ancient Greece, Mediterranean basin',
  roman: 'Ancient Rome, Italian Peninsula, Roman Empire',
  norse: 'Scandinavia (Norway, Sweden, Denmark, Iceland)',
  egyptian: 'Ancient Egypt, Nile Valley',
  hindu: 'Indian subcontinent (India, Nepal, Southeast Asia)',
  buddhist: 'East and Southeast Asia (Tibet, China, Japan, Thailand)',
  chinese: 'China, East Asia',
  japanese: 'Japan, Japanese archipelago',
  aztec: 'Central Mexico, Mesoamerica',
  mayan: 'Yucatan Peninsula, Guatemala, Southern Mexico',
  celtic: 'British Isles, Gaul, Central Europe',
  babylonian: 'Mesopotamia, ancient Iraq',
  sumerian: 'Ancient Sumer, southern Mesopotamia',
  persian: 'Ancient Persia, Iranian plateau',
  christian: 'Global (originated in Judea, spread worldwide)',
  islamic: 'Middle East, North Africa, Asia (originated in Arabia)',
  jewish: 'Ancient Israel, Jewish diaspora worldwide'
};

// Primary sources by mythology
const PRIMARY_SOURCES = {
  greek: ['Iliad', 'Odyssey', 'Theogony', 'Homeric Hymns', 'Greek tragedies'],
  roman: ['Aeneid', 'Metamorphoses', 'Fasti', 'Roman histories'],
  norse: ['Poetic Edda', 'Prose Edda', 'Sagas of Icelanders'],
  egyptian: ['Pyramid Texts', 'Coffin Texts', 'Book of the Dead', 'Temple inscriptions'],
  hindu: ['Rigveda', 'Mahabharata', 'Ramayana', 'Puranas', 'Upanishads'],
  buddhist: ['Tripitaka', 'Lotus Sutra', 'Heart Sutra', 'Tibetan Book of the Dead'],
  chinese: ['Journey to the West', 'Fengshen Yanyi', 'Classic of Mountains and Seas'],
  japanese: ['Kojiki', 'Nihon Shoki', 'Engishiki'],
  aztec: ['Codex Borgia', 'Florentine Codex', 'Codex Mendoza'],
  mayan: ['Popol Vuh', 'Chilam Balam', 'Dresden Codex'],
  celtic: ['Mabinogion', 'Ulster Cycle', 'Book of Invasions'],
  babylonian: ['Enuma Elish', 'Epic of Gilgamesh', 'Babylonian chronicles'],
  sumerian: ['Sumerian King List', 'Descent of Inanna', 'Gilgamesh cycle'],
  persian: ['Avesta', 'Gathas', 'Bundahishn'],
  christian: ['Bible (Old & New Testament)', 'Apocrypha', 'Church Fathers writings'],
  islamic: ['Quran', 'Hadith', 'Tafsir literature'],
  jewish: ['Torah', 'Talmud', 'Midrash', 'Kabbalah texts']
};

// Top 50 most important deities (for priority enhancement)
const TOP_DEITIES = [
  // Greek
  'zeus', 'athena', 'apollo', 'artemis', 'poseidon', 'hades', 'demeter', 'hera',
  // Norse
  'odin', 'thor', 'freya', 'loki', 'frigg',
  // Egyptian
  'ra', 'osiris', 'isis', 'anubis', 'horus', 'thoth', 'set',
  // Hindu
  'shiva', 'vishnu', 'brahma', 'krishna', 'ganesha', 'durga', 'kali',
  // Roman
  'jupiter', 'mars', 'venus', 'neptune',
  // Chinese
  'jade-emperor', 'guanyin',
  // Japanese
  'amaterasu', 'susanoo', 'izanagi', 'izanami',
  // Aztec
  'quetzalcoatl', 'huitzilopochtli', 'tlaloc',
  // Mayan
  'kukulkan', 'ixchel',
  // Celtic
  'dagda', 'brigid', 'lugh',
  // Babylonian
  'marduk', 'ishtar', 'tiamat',
  // Christian
  'jesus-christ', 'god-father', 'virgin-mary'
];

// Statistics tracking
let stats = {
  total: 0,
  enhanced: 0,
  byMythology: {},
  fieldsAdded: {
    description: 0,
    summary: 0,
    domains: 0,
    symbols: 0,
    epithets: 0,
    cultural_significance: 0,
    primary_sources: 0,
    geographic_region: 0
  },
  before: {
    complete: 0,
    partial: 0,
    minimal: 0
  },
  after: {
    complete: 0,
    partial: 0,
    minimal: 0
  }
};

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Generate a summary from description or name
 */
function generateSummary(deity) {
  if (deity.summary) return deity.summary;

  let desc = stripHtml(deity.description || '');
  if (desc) {
    // Take first 1-2 sentences
    const sentences = desc.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  // Generate from name and domains
  const name = deity.displayName || deity.name || 'Unknown deity';
  const mythology = deity.mythology || 'ancient';
  const primaryDomain = deity.domains && deity.domains[0] ? deity.domains[0] : 'deity';

  return `${name} is a ${mythology} deity associated with ${primaryDomain}.`;
}

/**
 * Generate description from available metadata
 */
function generateDescription(deity) {
  if (deity.description && stripHtml(deity.description).length > 20) {
    return deity.description;
  }

  const name = deity.displayName || deity.name || 'Unknown';
  const mythology = deity.mythology || 'ancient';

  const parts = [`${name} is a deity from ${mythology} mythology`];

  if (deity.domains && deity.domains.length > 0) {
    const domainList = deity.domains.slice(0, 3).join(', ');
    parts.push(`associated with ${domainList}`);
  }

  if (deity.epithets && deity.epithets.length > 0) {
    const epithetList = deity.epithets.slice(0, 2).join(', ');
    parts.push(`Known by the epithets: ${epithetList}`);
  }

  if (deity.symbols && deity.symbols.length > 0) {
    const symbolList = deity.symbols.slice(0, 2).join(', ');
    parts.push(`Symbols include ${symbolList}`);
  }

  return parts.join('. ') + '.';
}

/**
 * Extract domains from existing data
 */
function extractDomains(deity) {
  if (deity.domains && deity.domains.length > 0) {
    return deity.domains;
  }

  const domains = [];
  const text = stripHtml(deity.description || '').toLowerCase();

  // Extract from description
  const domainPatterns = [
    /god(?:dess)? of ([^.,]+)/gi,
    /deity of ([^.,]+)/gi,
    /associated with ([^.,]+)/gi,
    /rules over ([^.,]+)/gi,
    /governs ([^.,]+)/gi
  ];

  for (const pattern of domainPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const domain = match[1].trim();
      if (domain && !domains.includes(domain)) {
        domains.push(domain);
      }
    }
  }

  return domains.length > 0 ? domains : ['unknown'];
}

/**
 * Extract symbols from existing data
 */
function extractSymbols(deity) {
  if (deity.symbols && deity.symbols.length > 0) {
    return deity.symbols;
  }

  const symbols = [];
  const text = stripHtml(deity.description || '').toLowerCase();

  // Common symbol patterns
  const symbolPatterns = [
    /symbols? (?:include|are) ([^.,]+)/gi,
    /associated symbols?: ([^.,]+)/gi,
    /carries (?:a |the )?([^.,]+)/gi,
    /wields (?:a |the )?([^.,]+)/gi
  ];

  for (const pattern of symbolPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const symbol = match[1].trim();
      if (symbol && !symbols.includes(symbol)) {
        symbols.push(symbol);
      }
    }
  }

  return symbols;
}

/**
 * Generate cultural significance
 */
function generateCulturalSignificance(deity) {
  if (deity.cultural_significance) {
    return deity.cultural_significance;
  }

  const domains = deity.domains || [];
  const mythology = deity.mythology || '';

  // Check if deity has known domain patterns
  for (const domain of domains) {
    const lowerDomain = domain.toLowerCase();
    for (const [key, data] of Object.entries(DOMAIN_KNOWLEDGE)) {
      if (lowerDomain.includes(key)) {
        return data.cultural_significance;
      }
    }
  }

  // Generic significance based on importance
  const importance = deity.importance || 50;
  if (importance >= 80) {
    return `One of the most important deities in ${mythology} mythology, central to religious practices and cosmology.`;
  } else if (importance >= 60) {
    return `A significant deity in ${mythology} mythology, widely worshipped and culturally influential.`;
  } else {
    return `A deity in ${mythology} mythology with specific cultural and religious importance.`;
  }
}

/**
 * Add primary sources
 */
function addPrimarySources(deity) {
  if (deity.primarySources && deity.primarySources.length > 0) {
    return deity.primarySources;
  }

  const mythology = deity.mythology;
  const sources = PRIMARY_SOURCES[mythology] || [];

  // Return first 3-5 sources
  return sources.slice(0, 5).map(source => ({
    text: source,
    tradition: mythology,
    type: 'ancient_text'
  }));
}

/**
 * Add geographic region
 */
function addGeographicRegion(deity) {
  if (deity.geographic_region) {
    return deity.geographic_region;
  }

  return MYTHOLOGY_REGIONS[deity.mythology] || 'Various ancient regions';
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(deity) {
  let score = 0;
  const fields = [
    'description', 'summary', 'domains', 'symbols', 'epithets',
    'cultural_significance', 'primarySources', 'geographic_region'
  ];

  for (const field of fields) {
    if (deity[field]) {
      if (Array.isArray(deity[field])) {
        score += deity[field].length > 0 ? 1 : 0;
      } else if (typeof deity[field] === 'string') {
        score += stripHtml(deity[field]).length > 10 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }

  return score;
}

/**
 * Enhance a single deity
 */
function enhanceDeity(deity, filename) {
  const before = calculateCompleteness(deity);
  const enhanced = { ...deity };
  const isPriority = TOP_DEITIES.includes(deity.id || filename.replace('.json', ''));

  // Track what we're adding
  const added = [];

  // 1. Description
  if (!enhanced.description || stripHtml(enhanced.description).length < 20) {
    enhanced.description = generateDescription(enhanced);
    added.push('description');
    stats.fieldsAdded.description++;
  }

  // 2. Summary
  if (!enhanced.summary) {
    enhanced.summary = generateSummary(enhanced);
    added.push('summary');
    stats.fieldsAdded.summary++;
  }

  // 3. Domains
  if (!enhanced.domains || enhanced.domains.length === 0) {
    enhanced.domains = extractDomains(enhanced);
    if (enhanced.domains.length > 0) {
      added.push('domains');
      stats.fieldsAdded.domains++;
    }
  }

  // 4. Symbols
  if (!enhanced.symbols || enhanced.symbols.length === 0) {
    enhanced.symbols = extractSymbols(enhanced);
    if (enhanced.symbols.length > 0) {
      added.push('symbols');
      stats.fieldsAdded.symbols++;
    }
  }

  // 5. Epithets (keep existing)
  if (!enhanced.epithets || enhanced.epithets.length === 0) {
    enhanced.epithets = [];
    // Don't count as added since we're just ensuring it exists
  }

  // 6. Cultural significance
  if (!enhanced.cultural_significance) {
    enhanced.cultural_significance = generateCulturalSignificance(enhanced);
    added.push('cultural_significance');
    stats.fieldsAdded.cultural_significance++;
  }

  // 7. Primary sources (only for priority deities or if missing)
  if (!enhanced.primary_sources && (!enhanced.primarySources || enhanced.primarySources.length === 0)) {
    enhanced.primary_sources = addPrimarySources(enhanced);
    added.push('primary_sources');
    stats.fieldsAdded.primary_sources++;
  }

  // 8. Geographic region
  if (!enhanced.geographic_region) {
    enhanced.geographic_region = addGeographicRegion(enhanced);
    added.push('geographic_region');
    stats.fieldsAdded.geographic_region++;
  }

  // Update metadata
  if (!enhanced.metadata) enhanced.metadata = {};
  enhanced.metadata.enhanced_metadata = true;
  enhanced.metadata.enhancement_date = new Date().toISOString();
  enhanced.metadata.enhancement_agent = 'deity_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;
  enhanced.metadata.priority_deity = isPriority;

  const after = calculateCompleteness(enhanced);

  return { enhanced, before, after, added };
}

/**
 * Process all deity files
 */
function processDeities() {
  console.log('Starting deity metadata enhancement...\n');

  // Find all deity JSON files
  const files = [];

  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.json') && !item.includes('summary') && !item.includes('report')) {
        files.push(fullPath);
      }
    }
  }

  scanDir(DEITIES_DIR);

  console.log(`Found ${files.length} deity files\n`);
  stats.total = files.length;

  // Process each file
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const deity = JSON.parse(content);

      const mythology = deity.mythology || 'unknown';
      if (!stats.byMythology[mythology]) {
        stats.byMythology[mythology] = { total: 0, enhanced: 0 };
      }
      stats.byMythology[mythology].total++;

      const beforeScore = calculateCompleteness(deity);

      // Categorize before
      if (beforeScore >= 7) stats.before.complete++;
      else if (beforeScore >= 4) stats.before.partial++;
      else stats.before.minimal++;

      const { enhanced, before, after, added } = enhanceDeity(deity, path.basename(file));

      // Categorize after
      if (after >= 7) stats.after.complete++;
      else if (after >= 4) stats.after.partial++;
      else stats.after.minimal++;

      if (added.length > 0) {
        stats.enhanced++;
        stats.byMythology[mythology].enhanced++;

        // Write enhanced file
        fs.writeFileSync(file, JSON.stringify(enhanced, null, 2), 'utf8');

        console.log(`✓ ${path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
      }

    } catch (error) {
      console.error(`✗ Error processing ${path.basename(file)}: ${error.message}`);
    }
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    statistics: stats,
    summary: {
      total_files: stats.total,
      files_enhanced: stats.enhanced,
      enhancement_rate: `${((stats.enhanced / stats.total) * 100).toFixed(1)}%`,
      completeness_improvement: {
        before: {
          complete: stats.before.complete,
          partial: stats.before.partial,
          minimal: stats.before.minimal
        },
        after: {
          complete: stats.after.complete,
          partial: stats.after.partial,
          minimal: stats.after.minimal
        }
      }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total deities processed: ${stats.total}`);
  console.log(`Files enhanced: ${stats.enhanced}`);
  console.log(`\nFields added:`);
  Object.entries(stats.fieldsAdded).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`  - ${field}: ${count}`);
    }
  });
  console.log(`\nCompleteness (8 fields):`);
  console.log(`  Before: Complete ${stats.before.complete}, Partial ${stats.before.partial}, Minimal ${stats.before.minimal}`);
  console.log(`  After:  Complete ${stats.after.complete}, Partial ${stats.after.partial}, Minimal ${stats.after.minimal}`);
  console.log(`\nReport saved to: ${REPORT_FILE}`);
}

// Run
processDeities();
