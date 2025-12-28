#!/usr/bin/env node

/**
 * Creatures Metadata Enhancement Script
 *
 * Enhances all creature JSON files with rich metadata:
 * - abilities (creature powers and skills)
 * - habitat (where the creature lives)
 * - weaknesses (vulnerabilities)
 * - appearance (physical description)
 * - cultural_significance
 * - primary_sources
 * - creature_category
 */

const fs = require('fs');
const path = require('path');

const CREATURES_DIR = path.join(__dirname, '../firebase-assets-enhanced/creatures');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/creatures/enhancement-report.json');

const PRIMARY_SOURCES = {
  greek: ['Theogony', 'Metamorphoses', 'Library of Apollodorus'],
  roman: ['Natural History', 'Metamorphoses'],
  norse: ['Prose Edda', 'Poetic Edda'],
  egyptian: ['Book of the Dead', 'Pyramid Texts'],
  hindu: ['Mahabharata', 'Puranas', 'Ramayana'],
  buddhist: ['Jataka Tales', 'Lotus Sutra'],
  chinese: ['Classic of Mountains and Seas', 'Journey to the West'],
  japanese: ['Kojiki', 'Nihon Shoki'],
  babylonian: ['Enuma Elish', 'Epic of Gilgamesh'],
  sumerian: ['Sumerian mythological texts'],
  celtic: ['Mabinogion', 'Ulster Cycle'],
  christian: ['Bible', 'Book of Enoch']
};

let stats = {
  total: 0,
  enhanced: 0,
  fieldsAdded: {
    abilities: 0,
    habitat: 0,
    weaknesses: 0,
    appearance: 0,
    cultural_significance: 0,
    primary_sources: 0,
    creature_category: 0,
    summary: 0
  },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function extractAbilities(creature) {
  if (creature.abilities && creature.abilities.length > 0) {
    return creature.abilities;
  }

  const abilities = [];
  const text = stripHtml(creature.longDescription || creature.description || '').toLowerCase();

  const patterns = [
    /can ([^.,]+)/gi,
    /able to ([^.,]+)/gi,
    /possess(?:es)? (?:the )?(?:ability|power) (?:to|of) ([^.,]+)/gi,
    /known for (?:its |their )?([^.,]+)/gi
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const ability = match[1].trim();
      if (ability && ability.length < 100 && !abilities.includes(ability)) {
        abilities.push(ability);
      }
    }
  }

  return abilities.slice(0, 6);
}

function extractHabitat(creature) {
  if (creature.habitat) return creature.habitat;
  if (creature.habitats && creature.habitats.length > 0) {
    return creature.habitats.join(', ');
  }

  const text = stripHtml(creature.longDescription || creature.description || '');

  const patterns = [
    /lives? in (?:the )?([^.,]+)/i,
    /dwells? in (?:the )?([^.,]+)/i,
    /found in (?:the )?([^.,]+)/i,
    /inhabits? (?:the )?([^.,]+)/i,
    /(?:habitat|home):?\s*([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function extractWeaknesses(creature) {
  if (creature.weaknesses && creature.weaknesses.length > 0) {
    return creature.weaknesses;
  }

  const weaknesses = [];
  const text = stripHtml(creature.longDescription || creature.description || '').toLowerCase();

  const patterns = [
    /weakness(?:es)?:?\s*([^.]+)/gi,
    /vulnerable to ([^.,]+)/gi,
    /can be (?:killed|defeated|slain) by ([^.,]+)/gi,
    /susceptible to ([^.,]+)/gi
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const weakness = match[1].trim();
      if (weakness && !weaknesses.includes(weakness)) {
        weaknesses.push(weakness);
      }
    }
  }

  return weaknesses;
}

function extractAppearance(creature) {
  if (creature.appearance) return creature.appearance;
  if (creature.physicalDescription) return creature.physicalDescription;

  const text = stripHtml(creature.longDescription || creature.description || '');

  const patterns = [
    /(?:appears?|looks?) (?:like |as )?([^.]+)/i,
    /(?:described|depicted) as ([^.]+)/i,
    /(?:physical )?(?:appearance|description):?\s*([^.]+)/i,
    /has (?:the )?(?:body|head|form) of ([^.]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function determineCategory(creature) {
  if (creature.creature_category) return creature.creature_category;
  if (creature.type) return creature.type;

  const name = (creature.name || creature.displayName || '').toLowerCase();
  const desc = stripHtml(creature.description || '').toLowerCase();
  const combined = name + ' ' + desc;

  const categories = {
    dragon: ['dragon', 'serpent', 'wyrm'],
    beast: ['beast', 'animal', 'creature'],
    hybrid: ['hybrid', 'chimera', 'composite'],
    spirit: ['spirit', 'ghost', 'phantom'],
    giant: ['giant', 'titan', 'colossus'],
    demon: ['demon', 'devil', 'fiend'],
    undead: ['undead', 'zombie', 'skeleton'],
    divine: ['divine', 'celestial', 'sacred']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        return category;
      }
    }
  }

  return 'creature';
}

function generateCulturalSignificance(creature) {
  if (creature.cultural_significance) return creature.cultural_significance;

  const mythology = creature.mythology || creature.primaryMythology || 'ancient';
  const name = creature.displayName || creature.name || 'This creature';

  return `${name} is a significant creature in ${mythology} mythology, featuring prominently in mythological narratives and cultural traditions.`;
}

function addPrimarySources(creature) {
  if (creature.primarySources && creature.primarySources.length > 0) {
    return creature.primarySources;
  }

  const mythology = creature.mythology || creature.primaryMythology;
  const sources = PRIMARY_SOURCES[mythology] || [];

  return sources.slice(0, 3).map(source => ({
    text: source,
    tradition: mythology,
    type: 'ancient_text'
  }));
}

function generateSummary(creature) {
  if (creature.summary) return creature.summary;

  const short = stripHtml(creature.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(creature.longDescription || creature.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A mythological creature from ${creature.mythology || 'ancient'} tradition.`;
}

function calculateCompleteness(creature) {
  let score = 0;
  const fields = [
    'description', 'summary', 'abilities', 'habitat', 'weaknesses',
    'appearance', 'cultural_significance', 'primarySources'
  ];

  for (const field of fields) {
    if (creature[field]) {
      if (Array.isArray(creature[field])) {
        score += creature[field].length > 0 ? 1 : 0;
      } else if (typeof creature[field] === 'string') {
        score += stripHtml(creature[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }

  return score;
}

function enhanceCreature(creature) {
  const before = calculateCompleteness(creature);
  const enhanced = { ...creature };
  const added = [];

  // 1. Abilities
  const abilities = extractAbilities(enhanced);
  if (abilities.length > 0 && (!enhanced.abilities || enhanced.abilities.length === 0)) {
    enhanced.abilities = abilities;
    added.push('abilities');
    stats.fieldsAdded.abilities++;
  }

  // 2. Habitat
  const habitat = extractHabitat(enhanced);
  if (habitat && !enhanced.habitat) {
    enhanced.habitat = habitat;
    added.push('habitat');
    stats.fieldsAdded.habitat++;
  }

  // 3. Weaknesses
  const weaknesses = extractWeaknesses(enhanced);
  if (weaknesses.length > 0 && (!enhanced.weaknesses || enhanced.weaknesses.length === 0)) {
    enhanced.weaknesses = weaknesses;
    added.push('weaknesses');
    stats.fieldsAdded.weaknesses++;
  }

  // 4. Appearance
  const appearance = extractAppearance(enhanced);
  if (appearance && !enhanced.appearance) {
    enhanced.appearance = appearance;
    added.push('appearance');
    stats.fieldsAdded.appearance++;
  }

  // 5. Category
  if (!enhanced.creature_category) {
    enhanced.creature_category = determineCategory(enhanced);
    added.push('creature_category');
    stats.fieldsAdded.creature_category++;
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

  if (!enhanced.metadata) enhanced.metadata = {};
  enhanced.metadata.enhanced_metadata = true;
  enhanced.metadata.enhancement_date = new Date().toISOString();
  enhanced.metadata.enhancement_agent = 'creature_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processCreatures() {
  console.log('Starting creature metadata enhancement...\n');

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

  scanDir(CREATURES_DIR);

  console.log(`Found ${files.length} creature files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const creatures = JSON.parse(content);

      const creatureArray = Array.isArray(creatures) ? creatures : [creatures];
      const enhancedArray = [];

      for (const creature of creatureArray) {
        const beforeScore = calculateCompleteness(creature);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceCreature(creature);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${creature.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(creatures) ? enhancedArray : enhancedArray[0];
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
      creatures_enhanced: stats.enhanced,
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
  console.log(`Total creatures processed: ${stats.total}`);
  console.log(`Creatures enhanced: ${stats.enhanced}`);
  console.log(`\nFields added:`);
  Object.entries(stats.fieldsAdded).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`  - ${field}: ${count}`);
    }
  });
  console.log(`\nCompleteness (8 fields):`);
  console.log(`  Before: Complete ${stats.before.complete}, Partial ${stats.before.partial}, Minimal ${stats.before.minimal}`);
  console.log(`  After:  Complete ${stats.after.complete}, Partial ${stats.after.partial}, Minimal ${stats.after.minimal}`);
}

processCreatures();
