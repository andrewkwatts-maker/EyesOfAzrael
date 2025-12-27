#!/usr/bin/env node

/**
 * AGENT 3: Generate Fixes for Rituals, Herbs, and Texts (Offline Mode)
 *
 * This script generates fix patches without requiring Firebase connection.
 * It analyzes FAILED_ASSETS.json and creates fix data that can be applied later.
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('AGENT 3: GENERATE FIXES FOR RITUALS, HERBS, AND TEXTS (OFFLINE)');
console.log('='.repeat(80));
console.log('');

// Load failed assets
const failedAssets = JSON.parse(fs.readFileSync('FAILED_ASSETS.json', 'utf8'));
const assetsArray = Object.values(failedAssets);

// Icon mappings
const RITUAL_ICONS = {
  'festival': '🎭',
  'celebration': '🎉',
  'ceremony': '🕯️',
  'worship': '🙏',
  'sacrifice': '⚗️',
  'divination': '🔮',
  'initiation': '🔱',
  'mystery': '🌟',
  'offering': '🎁',
  'prayer': '📿',
  'purification': '💧',
  'consecration': '✨',
  'funeral': '⚱️',
  'calendar': '📅',
  'default': '🕯️'
};

const HERB_ICONS = {
  'tree': '🌳',
  'flower': '🌸',
  'plant': '🌿',
  'fruit': '🍎',
  'root': '🥕',
  'leaf': '🍃',
  'seed': '🌰',
  'herb': '🌿',
  'divine': '✨',
  'entheogen': '🍄',
  'preparation': '🫖',
  'default': '🌿'
};

const TEXT_ICONS = {
  'scripture': '📖',
  'prophecy': '📜',
  'apocalyptic': '🔥',
  'hymn': '🎵',
  'prayer': '🙏',
  'myth': '📚',
  'epic': '⚔️',
  'wisdom': '💡',
  'law': '⚖️',
  'history': '📋',
  'commentary': '📝',
  'default': '📖'
};

/**
 * Determine ritual type based on ID and content
 */
function inferRitualType(id, data) {
  const idLower = id.toLowerCase();
  const name = (data.name || '').toLowerCase();
  const desc = (data.description || '').toLowerCase();
  const combined = `${idLower} ${name} ${desc}`;

  if (combined.includes('festival') || combined.includes('akitu') || combined.includes('opet')) return 'festival';
  if (combined.includes('divination') || combined.includes('oracle')) return 'divination';
  if (combined.includes('mystery') || combined.includes('mysteries')) return 'mystery';
  if (combined.includes('offering') || combined.includes('sacrifice')) return 'offering';
  if (combined.includes('baptism') || combined.includes('purification')) return 'purification';
  if (combined.includes('sacrament') || combined.includes('communion')) return 'worship';
  if (combined.includes('mummification') || combined.includes('burial')) return 'funeral';
  if (combined.includes('calendar') || combined.includes('seasonal')) return 'calendar';
  if (combined.includes('initiation')) return 'initiation';
  if (combined.includes('dionysian') || combined.includes('eleusinian')) return 'mystery';
  if (combined.includes('blot')) return 'offering';

  return 'ceremony';
}

/**
 * Determine herb type based on ID and content
 */
function inferHerbType(id, data) {
  const idLower = id.toLowerCase();
  const name = (data.name || '').toLowerCase();
  const botanical = (data.botanicalName || '').toLowerCase();
  const combined = `${idLower} ${name} ${botanical}`;

  if (combined.includes('tree') || combined.includes('oak') || combined.includes('ash') || combined.includes('bodhi') || combined.includes('yggdrasil')) return 'tree';
  if (combined.includes('lotus') || combined.includes('flower')) return 'flower';
  if (combined.includes('ambrosia') || combined.includes('nectar')) return 'divine';
  if (combined.includes('soma') || combined.includes('haoma')) return 'entheogen';
  if (combined.includes('preparation') || combined.includes('tea')) return 'preparation';
  if (combined.includes('laurel') || combined.includes('myrtle') || combined.includes('mugwort') || combined.includes('yarrow')) return 'plant';

  return 'plant';
}

/**
 * Extract mythology from ID (e.g., "buddhist_bodhi" -> "buddhist")
 */
function extractMythologyFromId(id) {
  const parts = id.split('_');
  if (parts.length > 1) {
    return parts[0];
  }
  return null;
}

/**
 * Determine text type based on ID and content
 */
function inferTextType(id, data) {
  const idLower = id.toLowerCase();
  const name = (data.name || '').toLowerCase();
  const desc = (data.description || data.summary || '').toLowerCase();
  const combined = `${idLower} ${name} ${desc}`;

  // Christian revelation texts
  if (combined.includes('revelation') || combined.includes('apocalypse')) return 'apocalyptic';
  if (combined.includes('seals') || combined.includes('trumpets') || combined.includes('bowls')) return 'prophecy';
  if (combined.includes('144000') || combined.includes('millennium')) return 'prophecy';
  if (combined.includes('beast') || combined.includes('dragon') || combined.includes('babylon')) return 'apocalyptic';
  if (combined.includes('parallels') || combined.includes('daniel') || combined.includes('ezekiel') || combined.includes('exodus')) return 'commentary';

  // General patterns
  if (combined.includes('enuma elish') || combined.includes('gilgamesh') || combined.includes('amduat')) return 'epic';
  if (combined.includes('hymn') || combined.includes('psalm')) return 'hymn';
  if (combined.includes('law') || combined.includes('code')) return 'law';
  if (combined.includes('wisdom')) return 'wisdom';
  if (combined.includes('prayer')) return 'prayer';
  if (combined.includes('myth') || combined.includes('creation')) return 'myth';

  return 'scripture';
}

// Process each collection
const fixes = {
  rituals: [],
  herbs: [],
  texts: []
};

console.log('Analyzing failed assets...\n');

// Process rituals
const rituals = assetsArray.filter(a => a && a.collection === 'rituals');
console.log(`--- RITUALS (${rituals.length} items) ---\n`);

rituals.forEach(asset => {
  const id = asset.id;
  const data = asset.data;
  const updates = {};

  if (!data.type) {
    const type = inferRitualType(id, data);
    updates.type = type;
    updates.icon = RITUAL_ICONS[type] || RITUAL_ICONS.default;
  } else if (!data.icon) {
    updates.icon = RITUAL_ICONS[data.type] || RITUAL_ICONS.default;
  }

  if (Object.keys(updates).length > 0) {
    fixes.rituals.push({ id, updates });
    console.log(`✓ ${id}: ${Object.entries(updates).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  }
});

// Process herbs
const herbs = assetsArray.filter(a => a && a.collection === 'herbs');
console.log(`\n--- HERBS (${herbs.length} items) ---\n`);

herbs.forEach(asset => {
  const id = asset.id;
  const data = asset.data;
  const updates = {};

  if (!data.mythology) {
    const mythology = extractMythologyFromId(id);
    if (mythology) {
      updates.mythology = mythology;
    }
  }

  if (!data.type) {
    const type = inferHerbType(id, data);
    updates.type = type;
  }

  if (!data.icon) {
    const type = data.type || updates.type || 'plant';
    updates.icon = HERB_ICONS[type] || HERB_ICONS.default;
  }

  if (Object.keys(updates).length > 0) {
    fixes.herbs.push({ id, updates });
    console.log(`✓ ${id}: ${Object.entries(updates).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  }
});

// Process texts
const texts = assetsArray.filter(a => a && a.collection === 'texts');
console.log(`\n--- TEXTS (${texts.length} items) ---\n`);

texts.forEach(asset => {
  const id = asset.id;
  const data = asset.data;
  const updates = {};

  if (!data.type) {
    const type = inferTextType(id, data);
    updates.type = type;
  }

  if (!data.icon) {
    const type = data.type || updates.type || 'scripture';
    updates.icon = TEXT_ICONS[type] || TEXT_ICONS.default;
  }

  if (Object.keys(updates).length > 0) {
    fixes.texts.push({ id, updates });
    console.log(`✓ ${id}: ${Object.entries(updates).map(([k,v]) => `${k}=${v}`).join(', ')}`);
  }
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Rituals: ${fixes.rituals.length} items need fixes`);
console.log(`Herbs: ${fixes.herbs.length} items need fixes`);
console.log(`Texts: ${fixes.texts.length} items need fixes`);
console.log(`Total: ${fixes.rituals.length + fixes.herbs.length + fixes.texts.length} items`);
console.log('='.repeat(80));

// Save fixes
const outputFile = 'AGENT_3_FIXES.json';
fs.writeFileSync(outputFile, JSON.stringify(fixes, null, 2));
console.log(`\n✓ Fixes saved to ${outputFile}\n`);

// Create detailed statistics
const stats = {
  timestamp: new Date().toISOString(),
  collections: {
    rituals: {
      total: rituals.length,
      fixed: fixes.rituals.length,
      fieldsCovered: {
        type: fixes.rituals.filter(f => f.updates.type).length,
        icon: fixes.rituals.filter(f => f.updates.icon).length
      }
    },
    herbs: {
      total: herbs.length,
      fixed: fixes.herbs.length,
      fieldsCovered: {
        mythology: fixes.herbs.filter(f => f.updates.mythology).length,
        type: fixes.herbs.filter(f => f.updates.type).length,
        icon: fixes.herbs.filter(f => f.updates.icon).length
      }
    },
    texts: {
      total: texts.length,
      fixed: fixes.texts.length,
      fieldsCovered: {
        type: fixes.texts.filter(f => f.updates.type).length,
        icon: fixes.texts.filter(f => f.updates.icon).length
      }
    }
  }
};

fs.writeFileSync('AGENT_3_FIX_STATS.json', JSON.stringify(stats, null, 2));
console.log(`✓ Statistics saved to AGENT_3_FIX_STATS.json\n`);
