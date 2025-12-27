#!/usr/bin/env node

/**
 * AGENT 3: Fix Rituals, Herbs, and Texts Collections
 *
 * This script fixes missing fields in rituals, herbs, and texts collections:
 * - Rituals: Add 'type' field based on patterns
 * - Herbs: Add 'mythology' field from ID prefix
 * - Texts: Add 'type' field based on content patterns
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log('='.repeat(80));
console.log('AGENT 3: FIX RITUALS, HERBS, AND TEXTS COLLECTIONS');
console.log('='.repeat(80));
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
console.log('');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync('firebase-service-account.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

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

  return 'ceremony';
}

/**
 * Get icon for ritual type
 */
function getRitualIcon(type) {
  return RITUAL_ICONS[type] || RITUAL_ICONS.default;
}

/**
 * Determine herb type based on ID and content
 */
function inferHerbType(id, data) {
  const idLower = id.toLowerCase();
  const name = (data.name || '').toLowerCase();
  const botanical = (data.botanicalName || '').toLowerCase();
  const combined = `${idLower} ${name} ${botanical}`;

  if (combined.includes('tree') || combined.includes('oak') || combined.includes('ash')) return 'tree';
  if (combined.includes('lotus') || combined.includes('flower')) return 'flower';
  if (combined.includes('ambrosia') || combined.includes('nectar')) return 'divine';
  if (combined.includes('soma') || combined.includes('haoma')) return 'entheogen';
  if (combined.includes('bodhi') || name.includes('tree')) return 'tree';
  if (combined.includes('preparation') || combined.includes('tea')) return 'preparation';

  return 'plant';
}

/**
 * Get icon for herb type
 */
function getHerbIcon(type, data) {
  if (data.icon) return data.icon; // Keep existing icon
  return HERB_ICONS[type] || HERB_ICONS.default;
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
  const desc = (data.description || '').toLowerCase();
  const combined = `${idLower} ${name} ${desc}`;

  // Christian revelation texts
  if (combined.includes('revelation') || combined.includes('apocalypse')) return 'apocalyptic';
  if (combined.includes('seals') || combined.includes('trumpets') || combined.includes('bowls')) return 'prophecy';
  if (combined.includes('144000') || combined.includes('millennium')) return 'prophecy';
  if (combined.includes('beast') || combined.includes('dragon')) return 'apocalyptic';
  if (combined.includes('babylon')) return 'prophecy';
  if (combined.includes('parallels') || combined.includes('daniel') || combined.includes('ezekiel')) return 'commentary';

  // General patterns
  if (combined.includes('enuma elish') || combined.includes('gilgamesh')) return 'epic';
  if (combined.includes('hymn') || combined.includes('psalm')) return 'hymn';
  if (combined.includes('law') || combined.includes('code')) return 'law';
  if (combined.includes('wisdom')) return 'wisdom';
  if (combined.includes('prayer')) return 'prayer';
  if (combined.includes('myth') || combined.includes('creation')) return 'myth';

  return 'scripture';
}

/**
 * Get icon for text type
 */
function getTextIcon(type) {
  return TEXT_ICONS[type] || TEXT_ICONS.default;
}

/**
 * Fix rituals collection
 */
async function fixRituals() {
  console.log('\n--- FIXING RITUALS COLLECTION ---\n');

  console.log('Fetching rituals from Firebase...');
  const snapshot = await db.ref('assets/rituals').once('value');
  const rituals = snapshot.val() || {};
  console.log(`Found ${Object.keys(rituals).length} rituals\n`);

  const updates = {};
  let fixCount = 0;

  for (const [id, data] of Object.entries(rituals)) {
    const fixes = [];

    // Add type if missing
    if (!data.type) {
      const type = inferRitualType(id, data);
      updates[`${id}/type`] = type;
      fixes.push(`type: ${type}`);
    }

    // Add icon if missing
    if (!data.icon && data.type) {
      const icon = getRitualIcon(data.type);
      updates[`${id}/icon`] = icon;
      fixes.push(`icon: ${icon}`);
    } else if (!data.icon && updates[`${id}/type`]) {
      const icon = getRitualIcon(updates[`${id}/type`]);
      updates[`${id}/icon`] = icon;
      fixes.push(`icon: ${icon}`);
    }

    if (fixes.length > 0) {
      console.log(`✓ ${id}: ${fixes.join(', ')}`);
      fixCount++;
    }
  }

  if (!isDryRun && Object.keys(updates).length > 0) {
    console.log('\nApplying updates to Firebase...');
    await db.ref('assets/rituals').update(updates);
    console.log(`✓ Applied ${Object.keys(updates).length} updates to ${fixCount} rituals`);
  } else if (isDryRun) {
    console.log(`\n[DRY RUN] Would apply ${Object.keys(updates).length} updates to ${fixCount} rituals`);
  }

  return { fixed: fixCount, updates: Object.keys(updates).length };
}

/**
 * Fix herbs collection
 */
async function fixHerbs() {
  console.log('\n--- FIXING HERBS COLLECTION ---\n');

  console.log('Fetching herbs from Firebase...');
  const snapshot = await db.ref('assets/herbs').once('value');
  const herbs = snapshot.val() || {};
  console.log(`Found ${Object.keys(herbs).length} herbs\n`);

  const updates = {};
  let fixCount = 0;

  for (const [id, data] of Object.entries(herbs)) {
    const fixes = [];

    // Add mythology if missing
    if (!data.mythology) {
      const mythology = extractMythologyFromId(id);
      if (mythology) {
        updates[`${id}/mythology`] = mythology;
        fixes.push(`mythology: ${mythology}`);
      }
    }

    // Add type if missing
    if (!data.type) {
      const type = inferHerbType(id, data);
      updates[`${id}/type`] = type;
      fixes.push(`type: ${type}`);
    }

    // Add/update icon
    if (!data.icon) {
      const type = data.type || updates[`${id}/type`] || 'plant';
      const icon = getHerbIcon(type, data);
      updates[`${id}/icon`] = icon;
      fixes.push(`icon: ${icon}`);
    }

    if (fixes.length > 0) {
      console.log(`✓ ${id}: ${fixes.join(', ')}`);
      fixCount++;
    }
  }

  if (!isDryRun && Object.keys(updates).length > 0) {
    console.log('\nApplying updates to Firebase...');
    await db.ref('assets/herbs').update(updates);
    console.log(`✓ Applied ${Object.keys(updates).length} updates to ${fixCount} herbs`);
  } else if (isDryRun) {
    console.log(`\n[DRY RUN] Would apply ${Object.keys(updates).length} updates to ${fixCount} herbs`);
  }

  return { fixed: fixCount, updates: Object.keys(updates).length };
}

/**
 * Fix texts collection
 */
async function fixTexts() {
  console.log('\n--- FIXING TEXTS COLLECTION ---\n');

  console.log('Fetching texts from Firebase...');
  const snapshot = await db.ref('assets/texts').once('value');
  const texts = snapshot.val() || {};
  console.log(`Found ${Object.keys(texts).length} texts\n`);

  const updates = {};
  let fixCount = 0;

  for (const [id, data] of Object.entries(texts)) {
    const fixes = [];

    // Add type if missing
    if (!data.type) {
      const type = inferTextType(id, data);
      updates[`${id}/type`] = type;
      fixes.push(`type: ${type}`);
    }

    // Add icon if missing
    if (!data.icon && data.type) {
      const icon = getTextIcon(data.type);
      updates[`${id}/icon`] = icon;
      fixes.push(`icon: ${icon}`);
    } else if (!data.icon && updates[`${id}/type`]) {
      const icon = getTextIcon(updates[`${id}/type`]);
      updates[`${id}/icon`] = icon;
      fixes.push(`icon: ${icon}`);
    }

    if (fixes.length > 0) {
      console.log(`✓ ${id}: ${fixes.join(', ')}`);
      fixCount++;
    }
  }

  if (!isDryRun && Object.keys(updates).length > 0) {
    console.log('\nApplying updates to Firebase...');
    await db.ref('assets/texts').update(updates);
    console.log(`✓ Applied ${Object.keys(updates).length} updates to ${fixCount} texts`);
  } else if (isDryRun) {
    console.log(`\n[DRY RUN] Would apply ${Object.keys(updates).length} updates to ${fixCount} texts`);
  }

  return { fixed: fixCount, updates: Object.keys(updates).length };
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  try {
    const ritualResults = await fixRituals();
    const herbResults = await fixHerbs();
    const textResults = await fixTexts();

    const totalFixed = ritualResults.fixed + herbResults.fixed + textResults.fixed;
    const totalUpdates = ritualResults.updates + herbResults.updates + textResults.updates;

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Rituals: ${ritualResults.fixed} items fixed (${ritualResults.updates} updates)`);
    console.log(`Herbs: ${herbResults.fixed} items fixed (${herbResults.updates} updates)`);
    console.log(`Texts: ${textResults.fixed} items fixed (${textResults.updates} updates)`);
    console.log(`\nTotal: ${totalFixed} items fixed with ${totalUpdates} total updates`);
    console.log(`Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log('='.repeat(80));

    // Write results to JSON for reporting
    const results = {
      timestamp: new Date().toISOString(),
      mode: isDryRun ? 'dry-run' : 'live',
      collections: {
        rituals: ritualResults,
        herbs: herbResults,
        texts: textResults
      },
      totals: {
        itemsFixed: totalFixed,
        updatesApplied: totalUpdates
      },
      duration: ((Date.now() - startTime) / 1000).toFixed(2) + 's'
    };

    fs.writeFileSync(
      'AGENT_3_FIX_RESULTS.json',
      JSON.stringify(results, null, 2)
    );

    console.log('\n✓ Results saved to AGENT_3_FIX_RESULTS.json\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run
main();
