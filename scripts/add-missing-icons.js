const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../FIREBASE/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eyes-of-azrael-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// Load icon mappings
const iconPath = path.join(__dirname, '../icons/firebase-icons.json');
const icons = JSON.parse(fs.readFileSync(iconPath, 'utf8'));

// Load failed assets
const failedAssetsPath = path.join(__dirname, '../FAILED_ASSETS.json');
const failedAssets = JSON.parse(fs.readFileSync(failedAssetsPath, 'utf8'));

// Collection to entity type mapping
const collectionToEntityType = {
  'deities': 'deity',
  'heroes': 'hero',
  'creatures': 'creature',
  'places': 'place',
  'items': 'item',
  'rituals': 'concept',
  'herbs': 'concept',
  'texts': 'concept',
  'symbols': 'concept',
  'cosmology': 'magic',
  'mythologies': 'concept'
};

// Extract assets missing proper icon fields
function extractMissingIcons() {
  const missingIcons = [];

  for (const asset of failedAssets) {
    // Check if missing iconType field (meaning they have emoji instead of SVG)
    if (!asset.data.iconType) {
      missingIcons.push({
        collection: asset.collection,
        id: asset.id,
        name: asset.data?.name || asset.id,
        currentIcon: asset.data.icon || 'none'
      });
    }
  }

  return missingIcons;
}

// Get icon SVG for entity type
function getIconForType(entityType) {
  if (icons.entities[entityType]) {
    return icons.entities[entityType].svg;
  }
  // Fallback to concept icon
  return icons.entities.concept.svg;
}

// Add icons to assets
async function addMissingIcons(dryRun = true) {
  const missingIcons = extractMissingIcons();
  const results = {
    total: missingIcons.length,
    byCollection: {},
    processed: 0,
    errors: []
  };

  console.log(`Found ${missingIcons.length} assets missing icon field\n`);

  for (const asset of missingIcons) {
    const entityType = collectionToEntityType[asset.collection];

    if (!entityType) {
      console.warn(`⚠️  Unknown collection: ${asset.collection} for ${asset.id}`);
      results.errors.push({
        id: asset.id,
        collection: asset.collection,
        error: 'Unknown collection type'
      });
      continue;
    }

    const iconSvg = getIconForType(entityType);

    // Initialize collection counter
    if (!results.byCollection[asset.collection]) {
      results.byCollection[asset.collection] = 0;
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would replace "${asset.currentIcon}" with ${entityType} SVG icon for ${asset.collection}/${asset.id} (${asset.name})`);
      results.byCollection[asset.collection]++;
      results.processed++;
    } else {
      try {
        const docRef = db.collection(asset.collection).doc(asset.id);

        await docRef.update({
          icon: iconSvg,
          iconType: 'svg',
          _modified: new Date().toISOString()
        });

        console.log(`✅ Added ${entityType} icon to ${asset.collection}/${asset.id} (${asset.name})`);
        results.byCollection[asset.collection]++;
        results.processed++;
      } catch (error) {
        console.error(`❌ Error updating ${asset.collection}/${asset.id}:`, error.message);
        results.errors.push({
          id: asset.id,
          collection: asset.collection,
          error: error.message
        });
      }
    }
  }

  return results;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(80));
  console.log('AGENT 7: ADD MISSING ICON FIELDS');
  console.log('='.repeat(80));
  console.log();

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚡ LIVE MODE - Changes will be written to Firebase\n');
  }

  const results = await addMissingIcons(dryRun);

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total assets missing icons: ${results.total}`);
  console.log(`Successfully processed: ${results.processed}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log();
  console.log('By Collection:');
  for (const [collection, count] of Object.entries(results.byCollection)) {
    const entityType = collectionToEntityType[collection];
    console.log(`  ${collection}: ${count} (${entityType} icon)`);
  }

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  ${err.collection}/${err.id}: ${err.error}`);
    });
  }

  // Save results
  const reportPath = path.join(__dirname, '../AGENT_7_ICON_FIX_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${reportPath}`);

  if (!dryRun) {
    console.log('\n✅ Icon fields added successfully!');
  } else {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
