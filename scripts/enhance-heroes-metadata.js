#!/usr/bin/env node

/**
 * Heroes Metadata Enhancement Script
 *
 * Enhances hero JSON files with:
 * - achievements (heroic deeds)
 * - associated_deities (gods connected to hero)
 * - weapons (items used)
 * - quests (major journeys/tasks)
 */

const fs = require('fs');
const path = require('path');

const HEROES_DIR = path.join(__dirname, '../firebase-assets-enhanced/heroes');
const REPORT_FILE = path.join(__dirname, '../firebase-assets-enhanced/heroes/enhancement-report.json');

const PRIMARY_SOURCES = {
  greek: ['Iliad', 'Odyssey', 'Argonautica', 'Library of Apollodorus'],
  norse: ['Volsunga Saga', 'Prose Edda'],
  hindu: ['Mahabharata', 'Ramayana'],
  babylonian: ['Epic of Gilgamesh'],
  celtic: ['Ulster Cycle', 'Mabinogion']
};

let stats = {
  total: 0, enhanced: 0,
  fieldsAdded: {
    achievements: 0, associated_deities: 0, weapons: 0, quests: 0,
    cultural_significance: 0, primary_sources: 0, summary: 0
  },
  before: { complete: 0, partial: 0, minimal: 0 },
  after: { complete: 0, partial: 0, minimal: 0 }
};

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function extractAchievements(hero) {
  if (hero.achievements && hero.achievements.length > 0) return hero.achievements;

  const achievements = [];
  const text = stripHtml(hero.longDescription || hero.description || '').toLowerCase();

  const patterns = [
    /(?:defeated|slew|killed|conquered) ([^.,]+)/gi,
    /(?:completed|accomplished|achieved) ([^.,]+)/gi,
    /known for ([^.,]+)/gi
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const achievement = match[1].trim();
      if (achievement && achievement.length < 100 && !achievements.includes(achievement)) {
        achievements.push(achievement);
      }
    }
  }

  return achievements.slice(0, 5);
}

function extractAssociatedDeities(hero) {
  if (hero.associated_deities && hero.associated_deities.length > 0) return hero.associated_deities;

  const deities = [];
  const text = stripHtml(hero.longDescription || hero.description || '');

  const patterns = [
    /(?:son|daughter|child) of ([A-Z][a-z]+)/g,
    /(?:blessed|favored|aided|guided) by ([A-Z][a-z]+)/g,
    /(?:patron|protector):?\s*([A-Z][a-z]+)/g
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const deity = match[1].trim();
      if (deity && !deities.includes(deity)) {
        deities.push(deity);
      }
    }
  }

  return deities;
}

function extractWeapons(hero) {
  if (hero.weapons && hero.weapons.length > 0) return hero.weapons;

  const weapons = [];
  const text = stripHtml(hero.longDescription || hero.description || '').toLowerCase();

  const weaponKeywords = ['sword', 'spear', 'bow', 'shield', 'armor', 'hammer', 'axe', 'club'];

  for (const weapon of weaponKeywords) {
    if (text.includes(weapon)) {
      const patterns = [
        new RegExp(`(?:his|her|their) ([^.,]*${weapon}[^.,]*)`, 'gi'),
        new RegExp(`(${weapon} of [^.,]+)`, 'gi')
      ];

      for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const foundWeapon = match[1].trim();
          if (foundWeapon && !weapons.includes(foundWeapon)) {
            weapons.push(foundWeapon);
          }
        }
      }
    }
  }

  return weapons.slice(0, 3);
}

function extractQuests(hero) {
  if (hero.quests && hero.quests.length > 0) return hero.quests;

  const quests = [];
  const text = stripHtml(hero.longDescription || hero.description || '');

  const patterns = [
    /(?:quest|journey|voyage) (?:to|for) ([^.,]+)/gi,
    /(?:traveled|journeyed|sailed) to ([^.,]+)/gi,
    /(?:labor|task|trial):?\s*([^.]+)/gi
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const quest = match[1].trim();
      if (quest && quest.length < 100 && !quests.includes(quest)) {
        quests.push(quest);
      }
    }
  }

  return quests.slice(0, 4);
}

function generateCulturalSignificance(hero) {
  if (hero.cultural_significance) return hero.cultural_significance;

  const mythology = hero.mythology || hero.primaryMythology || 'ancient';
  const name = hero.displayName || hero.name || 'This hero';

  return `${name} is a legendary hero in ${mythology} mythology, embodying cultural ideals of courage, strength, and virtue.`;
}

function addPrimarySources(hero) {
  if (hero.primarySources && hero.primarySources.length > 0) return hero.primarySources;

  const mythology = hero.mythology || hero.primaryMythology;
  const sources = PRIMARY_SOURCES[mythology] || [];

  return sources.slice(0, 3).map(source => ({
    text: source,
    tradition: mythology,
    type: 'ancient_text'
  }));
}

function generateSummary(hero) {
  if (hero.summary) return hero.summary;

  const short = stripHtml(hero.shortDescription || '');
  if (short && short.length < 200) return short;

  const long = stripHtml(hero.longDescription || hero.description || '');
  if (long) {
    const sentences = long.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim();
  }

  return `A heroic figure from ${hero.mythology || 'ancient'} mythology.`;
}

function calculateCompleteness(hero) {
  let score = 0;
  const fields = ['description', 'summary', 'achievements', 'associated_deities', 'weapons', 'quests', 'cultural_significance', 'primarySources'];

  for (const field of fields) {
    if (hero[field]) {
      if (Array.isArray(hero[field])) {
        score += hero[field].length > 0 ? 1 : 0;
      } else if (typeof hero[field] === 'string') {
        score += stripHtml(hero[field]).length > 5 ? 1 : 0;
      } else {
        score += 1;
      }
    }
  }

  return score;
}

function enhanceHero(hero) {
  const before = calculateCompleteness(hero);
  const enhanced = { ...hero };
  const added = [];

  const achievements = extractAchievements(enhanced);
  if (achievements.length > 0 && (!enhanced.achievements || enhanced.achievements.length === 0)) {
    enhanced.achievements = achievements;
    added.push('achievements');
    stats.fieldsAdded.achievements++;
  }

  const deities = extractAssociatedDeities(enhanced);
  if (deities.length > 0 && (!enhanced.associated_deities || enhanced.associated_deities.length === 0)) {
    enhanced.associated_deities = deities;
    added.push('associated_deities');
    stats.fieldsAdded.associated_deities++;
  }

  const weapons = extractWeapons(enhanced);
  if (weapons.length > 0 && (!enhanced.weapons || enhanced.weapons.length === 0)) {
    enhanced.weapons = weapons;
    added.push('weapons');
    stats.fieldsAdded.weapons++;
  }

  const quests = extractQuests(enhanced);
  if (quests.length > 0 && (!enhanced.quests || enhanced.quests.length === 0)) {
    enhanced.quests = quests;
    added.push('quests');
    stats.fieldsAdded.quests++;
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
  enhanced.metadata.enhancement_agent = 'hero_metadata_enhancer_v1';
  enhanced.metadata.fields_added = added;

  const after = calculateCompleteness(enhanced);
  return { enhanced, before, after, added };
}

function processHeroes() {
  console.log('Starting hero metadata enhancement...\n');

  if (!fs.existsSync(HEROES_DIR)) {
    console.log(`Heroes directory not found, skipping...`);
    return;
  }

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

  scanDir(HEROES_DIR);

  console.log(`Found ${files.length} hero files\n`);
  stats.total = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const heroes = JSON.parse(content);

      const heroArray = Array.isArray(heroes) ? heroes : [heroes];
      const enhancedArray = [];

      for (const hero of heroArray) {
        const beforeScore = calculateCompleteness(hero);

        if (beforeScore >= 7) stats.before.complete++;
        else if (beforeScore >= 4) stats.before.partial++;
        else stats.before.minimal++;

        const { enhanced, before, after, added } = enhanceHero(hero);

        if (after >= 7) stats.after.complete++;
        else if (after >= 4) stats.after.partial++;
        else stats.after.minimal++;

        if (added.length > 0) {
          stats.enhanced++;
          console.log(`✓ ${hero.id || path.basename(file)}: +${added.length} fields (${before}/8 → ${after}/8)`);
        }

        enhancedArray.push(enhanced);
      }

      const output = Array.isArray(heroes) ? enhancedArray : enhancedArray[0];
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
      heroes_enhanced: stats.enhanced,
      enhancement_rate: stats.total > 0 ? `${((stats.enhanced / stats.total) * 100).toFixed(1)}%` : '0%',
      completeness_improvement: { before: stats.before, after: stats.after }
    }
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total heroes processed: ${stats.total}`);
  console.log(`Heroes enhanced: ${stats.enhanced}`);
}

processHeroes();
