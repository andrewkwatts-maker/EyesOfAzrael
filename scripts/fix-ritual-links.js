/**
 * Fix Ritual Related Deities Links Script
 *
 * This script fixes broken internal links in rituals where relatedDeities
 * arrays contain deity NAMES instead of deity IDs.
 *
 * Rituals to fix:
 * 1. babylonian_akitu - references: Marduk, Nabu, Tiamat, Ea, Ishtar
 * 2. babylonian_divination - references: Shamash, Adad, Marduk, Ea, Sin, Ishtar
 * 3. christian_baptism - references: God the Father, Jesus Christ, Holy Spirit, John the Baptist
 *
 * Usage:
 *   node scripts/fix-ritual-links.js           # Dry run (shows diff)
 *   node scripts/fix-ritual-links.js --apply   # Apply changes to Firebase
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Service account path
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');

// Deities data file
const DEITIES_FILE = path.join(__dirname, '..', 'firebase-assets-downloaded', 'deities', '_all.json');

// Rituals to fix
const RITUALS_TO_FIX = {
  'babylonian_akitu': {
    currentNames: ['Marduk', 'Nabu', 'Tiamat', 'Ea', 'Ishtar'],
    description: 'Babylonian New Year Festival'
  },
  'babylonian_divination': {
    currentNames: ['Shamash', 'Adad', 'Marduk', 'Ea', 'Sin', 'Ishtar'],
    description: 'Babylonian Divination Practices'
  },
  'christian_baptism': {
    currentNames: ['God the Father', 'Jesus Christ', 'Holy Spirit', 'John the Baptist'],
    description: 'Christian Baptism Sacrament'
  }
};

// Known alias mappings for deities (name variants to ID)
const DEITY_ALIASES = {
  'god the father': 'god-father',
  'jesus christ': 'jesus_christ',
  'holy spirit': 'holy-spirit',
  'john the baptist': null  // Not in deities - he's a prophet, not a deity. Remove from list.
};

/**
 * Build a name-to-ID mapping from the deities _all.json file
 * @returns {Map<string, string>} Map of lowercase deity name to ID
 */
function buildDeityNameToIdMap() {
  console.log('Loading deities from:', DEITIES_FILE);

  const content = fs.readFileSync(DEITIES_FILE, 'utf-8');
  const deities = JSON.parse(content);

  const nameToId = new Map();

  for (const deity of deities) {
    if (!deity.id || !deity.name) continue;

    // Map the main name (lowercase for case-insensitive matching)
    const nameLower = deity.name.toLowerCase().trim();
    nameToId.set(nameLower, deity.id);

    // Also map displayName if different
    if (deity.displayName) {
      // Remove emoji prefix if present
      const cleanDisplayName = deity.displayName.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '').toLowerCase().trim();
      if (cleanDisplayName && cleanDisplayName !== nameLower) {
        nameToId.set(cleanDisplayName, deity.id);
      }
    }
  }

  console.log(`Loaded ${nameToId.size} deity name mappings from ${deities.length} deities`);
  return nameToId;
}

/**
 * Find deity ID by name (case-insensitive, uses exact match and known aliases)
 * @param {Map<string, string>} nameToId - Name to ID mapping
 * @param {string} deityName - Deity name to look up
 * @returns {string|null} Deity ID or null if not found
 */
function findDeityId(nameToId, deityName) {
  const nameLower = deityName.toLowerCase().trim();

  // Check known aliases first (these are manually curated to avoid errors)
  if (DEITY_ALIASES.hasOwnProperty(nameLower)) {
    return DEITY_ALIASES[nameLower]; // May be null intentionally
  }

  // Exact match from database
  if (nameToId.has(nameLower)) {
    return nameToId.get(nameLower);
  }

  // No partial matching - it causes incorrect mappings (e.g., "John the Baptist" -> "holy-spirit")
  return null;
}

/**
 * Generate diff showing before and after
 * @param {string} ritualId - Ritual ID
 * @param {string[]} currentNames - Current names in relatedDeities
 * @param {Object} mapping - Mapping of name to ID (or null if not found)
 */
function printDiff(ritualId, currentNames, mapping) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Ritual: ${ritualId}`);
  console.log(`${'='.repeat(60)}`);

  console.log('\nBEFORE (relatedDeities):');
  console.log('  ' + JSON.stringify(currentNames, null, 2).replace(/\n/g, '\n  '));

  const newIds = [];
  const notFound = [];

  for (const name of currentNames) {
    if (mapping[name]) {
      newIds.push(mapping[name]);
    } else {
      notFound.push(name);
    }
  }

  console.log('\nAFTER (relatedDeities):');
  console.log('  ' + JSON.stringify(newIds, null, 2).replace(/\n/g, '\n  '));

  if (notFound.length > 0) {
    console.log('\nNOT FOUND (will be removed):');
    for (const name of notFound) {
      console.log(`  - "${name}" (no matching deity ID in database)`);
    }
  }

  console.log('\nMAPPING:');
  for (const name of currentNames) {
    if (mapping[name]) {
      console.log(`  "${name}" -> "${mapping[name]}"`);
    } else {
      console.log(`  "${name}" -> NOT FOUND`);
    }
  }
}

/**
 * Apply fixes to Firebase
 * @param {Object} fixes - Object with ritual IDs as keys and new relatedDeities arrays as values
 */
async function applyToFirebase(fixes) {
  // Initialize Firebase Admin
  console.log('\nInitializing Firebase Admin SDK...');
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  console.log('Applying fixes to Firebase...\n');

  const batch = db.batch();
  let updateCount = 0;

  for (const [ritualId, newRelatedDeities] of Object.entries(fixes)) {
    const docRef = db.collection('rituals').doc(ritualId);

    batch.update(docRef, {
      relatedDeities: newRelatedDeities,
      _modified: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`  Queued update for: ${ritualId}`);
    console.log(`    New relatedDeities: ${JSON.stringify(newRelatedDeities)}`);
    updateCount++;
  }

  console.log(`\nCommitting ${updateCount} updates...`);
  await batch.commit();
  console.log('Done! All updates committed successfully.');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');

  console.log('='.repeat(60));
  console.log('Fix Ritual Related Deities Links');
  console.log('='.repeat(60));
  console.log(`Mode: ${applyChanges ? 'APPLY CHANGES' : 'DRY RUN'}`);
  console.log('');

  // Build name-to-ID mapping
  const nameToId = buildDeityNameToIdMap();

  // Process each ritual
  const fixes = {};

  for (const [ritualId, config] of Object.entries(RITUALS_TO_FIX)) {
    const mapping = {};
    const newRelatedDeities = [];

    for (const name of config.currentNames) {
      const deityId = findDeityId(nameToId, name);
      mapping[name] = deityId;

      if (deityId) {
        newRelatedDeities.push(deityId);
      }
    }

    printDiff(ritualId, config.currentNames, mapping);
    fixes[ritualId] = newRelatedDeities;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  for (const [ritualId, newIds] of Object.entries(fixes)) {
    const config = RITUALS_TO_FIX[ritualId];
    const foundCount = newIds.length;
    const totalCount = config.currentNames.length;
    const notFoundCount = totalCount - foundCount;

    console.log(`\n${ritualId}:`);
    console.log(`  ${foundCount}/${totalCount} deities found`);
    if (notFoundCount > 0) {
      console.log(`  ${notFoundCount} deities not in database (will be removed)`);
    }
    console.log(`  New relatedDeities: ${JSON.stringify(newIds)}`);
  }

  if (!applyChanges) {
    console.log('\n' + '='.repeat(60));
    console.log('This was a DRY RUN. No changes were made.');
    console.log('Run with --apply flag to push changes to Firebase:');
    console.log('  node scripts/fix-ritual-links.js --apply');
    console.log('='.repeat(60));
  } else {
    try {
      await applyToFirebase(fixes);
      console.log('\n' + '='.repeat(60));
      console.log('SUCCESS! All changes applied to Firebase.');
      console.log('='.repeat(60));
    } catch (error) {
      console.error('\nError applying changes:', error.message);
      process.exit(1);
    }
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
