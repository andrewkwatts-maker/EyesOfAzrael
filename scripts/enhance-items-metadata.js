#!/usr/bin/env node

/**
 * Items Metadata Enhancement Script
 *
 * Enhances all item JSON files with rich metadata:
 * - powers (array of item abilities)
 * - wielders (who used/uses the item)
 * - origin (creation/discovery story)
 * - material (what it's made from)
 * - cultural_significance
 * - primary_sources
 * - item_category (weapon, artifact, relic, etc.)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ITEMS_DIR = path.join(__dirname, '../firebase-assets-enhanced/items');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/items/enhancement-report.json');

// Primary sources by mythology
const PRIMARY_SOURCES = {
  greek: ['Iliad', 'Odyssey', 'Theogony', 'Homeric Hymns'],
  roman: ['Aeneid', 'Metamorphoses', 'Fasti'],
  norse: ['Poetic Edda', 'Prose Edda', 'Sagas of Icelanders'],
  egyptian: ['Pyramid Texts', 'Book of the Dead', 'Temple inscriptions'],
  hindu: ['Rigveda', 'Mahabharata', 'Ramayana', 'Puranas'],
  buddhist: ['Tripitaka', 'Lotus Sutra', 'Jataka Tales'],
  chinese: ['Journey to the West', 'Fengshen Yanyi'],
  japanese: ['Kojiki', 'Nihon Shoki'],
  aztec: ['Codex Borgia', 'Florentine Codex'],
  mayan: ['Popol Vuh', 'Dresden Codex'],
  celtic: ['Mabinogion', 'Ulster Cycle'],
  babylonian: ['Enuma Elish', 'Epic of Gilgamesh'],
  sumerian: ['Descent of Inanna', 'Gilgamesh cycle'],
  persian: ['Avesta', 'Shahnameh'],
  christian: ['Bible', 'Apocrypha'],
  islamic: ['Quran', 'Hadith'],
  jewish: ['Torah', 'Talmud', 'Midrash']
};

// Item category mappings
const ITEM_CATEGORIES = {
  weapon: ['sword', 'spear', 'bow', 'hammer', 'axe', 'club', 'mace'],
  armor: ['shield', 'helmet', 'breastplate', 'gauntlet', 'boots'],
  jewelry: ['ring', 'necklace', 'amulet', 'bracelet', 'crown'],
  tool: ['staff', 'wand', 'rod', 'cauldron', 'chalice'],
  relic: ['stone', 'tablet', 'bone', 'scroll', 'book'],
  divine_artifact: ['throne', 'chariot', 'tree', 'well']
};

// Statistics tracking
let stats = {
  total: 0,
  enhanced: 0,
  fieldsAdded: {
    powers: 0,
    wielders: 0,
    origin: 0,
    material: 0,
    cultural_significance: 0,
    primary_sources: 0,
    item_category: 0,
    summary: 0
  },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract powers from description
 */
function extractPowers(item) {
  if (item.powers && item.powers.length > 0) {
    return item.powers;
  }

  const powers = [];
  const text = stripHtml(item.longDescription || item.description || '').toLowerCase();

  // Common power patterns
  const patterns = [
    /grants? (?:the )?([^.,]+)/gi,
    /provides? (?:the )?([^.,]+)/gi,
    /allows? (?:the wielder to )?([^.,]+)/gi,
    /enables? (?:the user to )?([^.,]+)/gi,
    /imbues? (?:the bearer with )?([^.,]+)/gi
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const power = match[1].trim();
      if (power && power.length < 100 && !powers.includes(power)) {
        powers.push(power);
      }
    }
  }

  return powers.slice(0, 5); // Limit to top 5
}

/**
 * Extract wielders from description or existing data
 */
function extractWielders(item) {
  if (item.wielders && item.wielders.length > 0) {
    return item.wielders;
  }

  const wielders = [];
  const text = stripHtml(item.longDescription || item.description || '');

  // Look for possessive patterns
  const patterns = [
    /(?:wielded|carried|owned|possessed|used) by ([A-Z][a-z]+)/g,
    /([A-Z][a-z]+)'s (?:sword|hammer|spear|shield|weapon)/g,
    /belongs? to ([A-Z][a-z]+)/g
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const wielder = match[1].trim();
      if (wielder && !wielders.includes(wielder)) {
        wielders.push(wielder);
      }
    }
  }

  return wielders;
}

/**
 * Extract origin story
 */
function extractOrigin(item) {
  if (item.origin) return item.origin;

  const text = stripHtml(item.longDescription || item.description || '');

  // Look for creation/forging mentions
  const patterns = [
    /(?:forged|created|crafted|made) by ([^.,]+)/i,
    /(?:origin|origins?):?\s*([^.]+)/i,
    /(?:was|were) (?:forged|created|crafted|made) ([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract material composition
 */
function extractMaterial(item) {
  if (item.material) return item.material;

  const text = stripHtml(item.longDescription || item.description || '').toLowerCase();

  const materials = [];
  const commonMaterials = [
    'gold', 'silver', 'bronze', 'iron', 'steel', 'adamantine', 'mithril',
    'wood', 'stone', 'crystal', 'diamond', 'jade', 'obsidian',
    'divine', 'magical', 'enchanted', 'blessed'
  ];

  for (const material of commonMaterials) {
    if (text.includes(material)) {
      materials.push(material);
    }
  }

  return materials.length > 0 ? materials.join(', ') : null;
}

/**
 * Determine item category
 */
function determineCategory(item) {
  if (item.item_category) return item.item_category;
  if (item.itemType) return item.itemType;

  const name = (item.name || item.displayName || '').toLowerCase();
  const desc = stripHtml(item.description || item.shortDescription || '').toLowerCase();
  const combined = name + ' ' + desc;

  for (const [category, keywords] of Object.entries(ITEM_CATEGORIES)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        return category;
      }
    }
  }

  return 'artifact';
}

/**
 * Generate cultural significance
 */
function generateCulturalSignificance(item) {
  if (item.cultural_significance) return item.cultural_significance;

  const mythology = item.primaryMythology || item.mythology || 'ancient';
  const category = determineCategory(item);
  const name = item.displayName || item.name || 'This item';

  const templates = {
    weapon: `${name} is a legendary ${category} from ${mythology} mythology, symbolizing divine power and heroic might.`,
    armor: `${name} represents divine protection in ${mythology} mythology, shielding its wearer from harm.`,
    jewelry: `${name} is a sacred ornament in ${mythology} mythology, often associated with royalty and divine favor.`,
    relic: `${name} is a revered relic in ${mythology} tradition, holding profound spiritual significance.`,
    divine_artifact: `${name} is a sacred artifact in ${mythology} mythology, central to cosmological narratives.`
  };

  return templates[category] || `${name} holds significant importance in ${mythology} mythology.`;
}

/**
 * Add primary sources
 */
function addPrimarySources(item) {
  if (item.primarySources && item.primarySources.length > 0) {
    return item.primarySources;
  }

  const mythology = item.primaryMythology || item.mythology;
  const sources = PRIMARY_SOURCES[mythology] || [];

  return sources.slice(0, 3).map(source => ({
    text: source,
    tradition: mythology,
    type: 'ancient_text'
  }));
}

/**
 * Generate summary
 */
function generateSummary(item) {
  if (item.summary) return item.summary;

  const short = stripHtml(item.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(item.longDescription || item.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A legendary item from ${item.primaryMythology || 'ancient'} mythology.`;
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(item) {
  let score = 0;
  const fields = [
    'description', 'summary', 'powers', 'wielders', 'origin',
    'material', 'cultural_significance', 'primarySources'
  ];

  for (const field of fields) {
    if (item[field]) {
      if (Array.isArray(item[field])) {
        score += item[field].length > 0 ? 1 : 0;
      } else if (typeof item[field] === 'string') {
        score += stripHtml(item[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }

  return score;
}

/**
 * Enhance a single item
 */
function enhanceItem(item, filename) {
  const before = calculateCompleteness(item);
  const enhanced = { ...item };
  const added = [];

  // 1. Powers
  const powers = extractPowers(enhanced);
  if (powers.length > 0 && (!enhanced.powers || enhanced.powers.length === 0)) {
    enhanced.powers = powers;
    added.push('powers');
    stats.fieldsAdded.powers++;
  }

  // 2. Wielders
  const wielders = extractWielders(enhanced);
  if (wielders.length > 0 && (!enhanced.wielders || enhanced.wielders.length === 0)) {
    enhanced.wielders = wielders;
    added.push('wielders');
    stats.fieldsAdded.wielders++;
  }

  // 3. Origin
  const origin = extractOrigin(enhanced);
  if (origin && !enhanced.origin) {
    enhanced.origin = origin;
    added.push('origin');
    stats.fieldsAdded.origin++;
  }

  // 4. Material
  const material = extractMaterial(enhanced);
  if (material && !enhanced.material) {
    enhanced.material = material;
    added.push('material');
    stats.fieldsAdded.material++;
  }

  // 5. Item category
  if (!enhanced.item_category) {
    enhanced.item_category = determineCategory(enhanced);
    added.push('item_category');
    stats.fieldsAdded.item_category++;
  }

  // 6. Cultural significance
  if (!enhanced.cultural_significance) {
    enhanced.cultural_significance = generateCulturalSignificance(enhanced);
    added.push('cultural_significance');
    stats.fieldsAdded.cultural_significance++;
  }

  // 7. Primary sources
  if (!enhanced.primarySources || enhanced.primarySources.length === 0) {
    enhanced.primarySources = addPrimarySources(enhanced);
    if (enhanced.primarySources.length > 0) {
      added.push('primary_sources');
      stats.fieldsAdded.primary_sources++;
    }
  }

  // 8. Summary
  if (!enhanced.summary) {
    enhanced.summary = generateSummary(enhanced);
    added.push('summary');
    stats.fieldsAdded.summary++;
  }

  // Update metadata
  if (!enhanced.metadata) enhanced.metadata = {};
  enhanced.metadata.enhanced_metadata = true;
  enhanced.metadata.enhancement_date = new Date().toISOString();
  enhanced.metadata.enhancement_agent = 'item_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);

  return { enhanced, before, after, added };
}

/**
 * Process all item files
 */
function processItems() {
  console.log('Starting item metadata enhancement...\n');

  // Find all item JSON files
  const files = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      return;
    }

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

  scanDir(ITEMS_DIR);

  console.log(`Found ${files.length} item files\n`);
  stats.total = files.length;

  // Process each file
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const items = JSON.parse(content);

      // Handle both array and single object
      const itemArray = Array.isArray(items) ? items : [items];
      const enhancedArray = [];

      for (const item of itemArray) {
        const beforeScore = calculateCompleteness(item);

        // Categorize before
        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceItem(item, path.basename(file));

        // Categorize after
        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${item.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      // Write enhanced file
      const output = Array.isArray(items) ? enhancedArray : enhancedArray[0];
      fs.writeFileSync(file, JSON.stringify(output, null, 2), 'utf8');

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
      items_enhanced: stats.enhanced,
      enhancement_rate: `${((stats.enhanced / stats.total) * 100).toFixed(1)}%`,
      completeness_improvement: {
        before: stats.before,
        after: stats.after
      }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total items processed: ${stats.total}`);
  console.log(`Items enhanced: ${stats.enhanced}`);
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
processItems();
