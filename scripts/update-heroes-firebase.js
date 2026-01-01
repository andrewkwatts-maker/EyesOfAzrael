/**
 * Firebase Hero Metadata Batch Update Script
 *
 * This script updates Firebase with enriched hero metadata.
 * It handles batching of updates to respect Firebase quotas.
 *
 * Prerequisites:
 *   - Firebase project configured
 *   - Service account credentials in environment or file
 *   - Node.js Firebase Admin SDK installed
 *
 * Usage:
 *   node scripts/update-heroes-firebase.js [--dry-run] [--batch-size=25]
 *
 * Environment variables:
 *   FIREBASE_PROJECT_ID - Your Firebase project ID
 *   FIREBASE_CREDENTIALS - Path to service account JSON (optional)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase (will use default credentials if available)
function initializeFirebase() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      console.error('Error: FIREBASE_PROJECT_ID environment variable not set');
      console.error('Set it with: export FIREBASE_PROJECT_ID=your-project-id');
      process.exit(1);
    }

    try {
      admin.initializeApp({
        projectId: projectId
      });
      console.log(`Initialized Firebase with project: ${projectId}\n`);
    } catch (error) {
      console.error('Firebase initialization failed:', error.message);
      process.exit(1);
    }
  }

  return admin.firestore();
}

/**
 * Load enriched heroes from local files
 */
function loadEnrichedHeroes(heroDir) {
  const heroes = [];
  const files = fs.readdirSync(heroDir);

  files.forEach(file => {
    if (file.endsWith('.json') && file !== '_all.json') {
      const filePath = path.join(heroDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          heroes.push(...data);
        } else if (data && typeof data === 'object' && data.id) {
          heroes.push(data);
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error.message);
      }
    }
  });

  return heroes;
}

/**
 * Update a single hero in Firebase
 */
async function updateHeroInFirebase(db, hero) {
  try {
    const docRef = db.collection('heroes').doc(hero.id);

    // Prepare update data - only include enriched fields
    const updateData = {
      quests: hero.quests || [],
      allies: hero.allies || [],
      enemies: hero.enemies || [],
      weapons: hero.weapons || [],
      abilities: hero.abilities || [],
      metadata: {
        ...(hero.metadata || {}),
        enrichedBy: 'hero-metadata-enricher',
        enrichedAt: admin.firestore.Timestamp.now(),
        metadataVersion: '1.0'
      }
    };

    // Include parentage if available
    if (hero.parentage) {
      updateData.parentage = hero.parentage;
    }

    // Update document
    await docRef.set(updateData, { merge: true });

    return {
      success: true,
      id: hero.id,
      name: hero.name || hero.displayName
    };
  } catch (error) {
    return {
      success: false,
      id: hero.id,
      error: error.message
    };
  }
}

/**
 * Batch update heroes to Firebase
 */
async function batchUpdateHeroes(db, heroes, batchSize = 25) {
  const results = {
    successful: [],
    failed: [],
    total: heroes.length
  };

  console.log(`Updating ${heroes.length} heroes in batches of ${batchSize}...\n`);

  for (let i = 0; i < heroes.length; i += batchSize) {
    const batch = heroes.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(heroes.length / batchSize);

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} heroes)...`);

    const promises = batch.map(hero => updateHeroInFirebase(db, hero));
    const batchResults = await Promise.all(promises);

    batchResults.forEach(result => {
      if (result.success) {
        results.successful.push(result);
        console.log(`  ✓ ${result.name}`);
      } else {
        results.failed.push(result);
        console.log(`  ✗ ${result.id}: ${result.error}`);
      }
    });

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < heroes.length) {
      console.log('  Waiting before next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Dry run - preview what would be updated
 */
function previewUpdates(heroes) {
  console.log('PREVIEW: Heroes that would be updated\n');
  console.log('='.repeat(80));

  heroes.forEach(hero => {
    const questCount = (hero.quests || []).length;
    const alliesCount = (hero.allies || []).length;
    const enemiesCount = (hero.enemies || []).length;
    const weaponsCount = (hero.weapons || []).length;
    const abilitiesCount = (hero.abilities || []).length;

    if (questCount > 0 || alliesCount > 0 || enemiesCount > 0 ||
        weaponsCount > 0 || abilitiesCount > 0) {
      console.log(`\n${hero.name || hero.displayName} (${hero.id})`);
      if (questCount > 0) console.log(`  • ${questCount} quest(s)`);
      if (alliesCount > 0) console.log(`  • ${alliesCount} ally/allies`);
      if (enemiesCount > 0) console.log(`  • ${enemiesCount} enemy/enemies`);
      if (weaponsCount > 0) console.log(`  • ${weaponsCount} weapon(s)`);
      if (abilitiesCount > 0) console.log(`  • ${abilitiesCount} ability/abilities`);
      if (hero.parentage) console.log(`  • Parentage information`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${heroes.length} heroes ready for update`);
}

/**
 * Main update process
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 25;

  const heroDir = path.join(__dirname, '../firebase-assets-downloaded/heroes');

  if (!fs.existsSync(heroDir)) {
    console.error(`Hero directory not found: ${heroDir}`);
    process.exit(1);
  }

  console.log('Loading enriched hero data from local files...\n');
  const heroes = loadEnrichedHeroes(heroDir);

  if (heroes.length === 0) {
    console.error('No heroes found to update');
    process.exit(1);
  }

  console.log(`Loaded ${heroes.length} heroes\n`);

  if (dryRun) {
    previewUpdates(heroes);
    console.log('\nRun without --dry-run flag to apply updates to Firebase');
    return;
  }

  // Initialize Firebase
  const db = initializeFirebase();

  console.log('Starting Firebase update process...\n');

  try {
    const results = await batchUpdateHeroes(db, heroes, batchSize);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('UPDATE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total processed: ${results.total}`);
    console.log(`Successful: ${results.successful.length}`);
    console.log(`Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\nFailed updates:');
      results.failed.forEach(result => {
        console.log(`  - ${result.id}: ${result.error}`);
      });
    }

    console.log('='.repeat(80));

    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nFatal error during update:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  initializeFirebase,
  loadEnrichedHeroes,
  updateHeroInFirebase,
  batchUpdateHeroes
};
