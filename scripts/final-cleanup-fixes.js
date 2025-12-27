const admin = require('firebase-admin');
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
const failedAssets = require('../FAILED_ASSETS.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eyesofazrael-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

// Track statistics
const stats = {
  total: 0,
  typeFixed: 0,
  timestampFixed: 0,
  descriptionFixed: 0,
  purposeFixed: 0,
  mythologyFixed: 0,
  otherFieldsFixed: 0,
  errors: []
};

// Helper: Infer type from collection name
function inferType(collection) {
  const typeMap = {
    'deities': 'deity',
    'heroes': 'hero',
    'creatures': 'creature',
    'texts': 'text',
    'rituals': 'ritual',
    'herbs': 'herb',
    'items': 'item',
    'symbols': 'symbol',
    'places': 'place',
    'events': 'event',
    'concepts': 'concept'
  };
  return typeMap[collection] || collection.replace(/s$/, ''); // Remove trailing 's'
}

// Helper: Extract mythology from asset ID or data
function extractMythology(assetId, data) {
  // Try from data first
  if (data.mythology) return data.mythology;
  if (data.tradition) return data.tradition;

  // Try from ID pattern (e.g., "babylonian_ea")
  const parts = assetId.split('_');
  if (parts.length > 1) {
    const potential = parts[0];
    // List of known mythologies
    const mythologies = [
      'babylonian', 'sumerian', 'egyptian', 'greek', 'roman', 'norse',
      'celtic', 'hindu', 'buddhist', 'chinese', 'japanese', 'aztec',
      'mayan', 'christian', 'islamic', 'jewish', 'persian', 'yoruba',
      'native_american', 'apocryphal', 'tarot', 'freemasons'
    ];
    if (mythologies.includes(potential)) {
      return potential;
    }
  }

  return null;
}

// Helper: Enhance short description
function enhanceDescription(data, collection, mythology) {
  let desc = data.description || data.subtitle || '';

  // If already long enough, return as is
  if (desc.length >= 50) return desc;

  // Try to build from other fields
  if (data.longDescription && data.longDescription.length >= 50) {
    return data.longDescription.substring(0, 200); // Take first 200 chars
  }

  // Try subtitle + description
  if (data.subtitle && data.description) {
    desc = `${data.subtitle}. ${data.description}`;
    if (desc.length >= 50) return desc;
  }

  // Build from name and type
  const name = data.name || data.displayName || data.title || 'Unknown';
  const type = inferType(collection);
  const myth = mythology || data.mythology || 'ancient';

  // Collection-specific enhancements
  if (collection === 'deities') {
    const domains = data.domains || [];
    if (domains.length > 0) {
      return `${name}, ${myth} deity of ${domains.slice(0, 3).join(', ')}.`;
    }
    return `${name} is a significant deity in ${myth} mythology.`;
  }

  if (collection === 'heroes') {
    const deeds = data.deeds || data.achievements || [];
    if (deeds.length > 0) {
      return `${name}, legendary ${myth} hero known for ${deeds[0]}.`;
    }
    return `${name} is a legendary hero in ${myth} mythology.`;
  }

  if (collection === 'creatures') {
    const abilities = data.abilities || data.powers || [];
    if (abilities.length > 0) {
      return `${name}, a mythical creature from ${myth} mythology with ${abilities[0]}.`;
    }
    return `${name} is a mythical creature in ${myth} mythology.`;
  }

  if (collection === 'texts') {
    return `${name} is an important sacred text in ${myth} tradition.`;
  }

  if (collection === 'rituals') {
    return `${name} is a significant ritual practice in ${myth} tradition.`;
  }

  if (collection === 'herbs') {
    return `${name} is a sacred plant used in ${myth} spiritual practices.`;
  }

  // Generic fallback
  return `${name} - a significant ${type} in ${myth} mythology.`;
}

// Helper: Infer purpose for texts
function inferPurpose(data) {
  const name = (data.name || data.title || '').toLowerCase();

  if (name.includes('creation') || name.includes('genesis')) return 'cosmology';
  if (name.includes('ritual') || name.includes('prayer')) return 'ritual';
  if (name.includes('wisdom') || name.includes('proverb')) return 'wisdom';
  if (name.includes('law') || name.includes('code')) return 'law';
  if (name.includes('history') || name.includes('chronicle')) return 'historical';
  if (name.includes('prophecy') || name.includes('apocalypse')) return 'prophetic';
  if (name.includes('hymn') || name.includes('psalm')) return 'devotional';
  if (name.includes('myth') || name.includes('legend')) return 'mythological';

  return 'religious';
}

// Main fix function
async function fixAsset(asset, dryRun = true) {
  const { collection, id, data, issues } = asset;
  const updates = {};
  let hasChanges = false;

  // Fix missing type field
  const missingType = issues.some(i => i.field === 'type' && i.message.includes('Missing'));
  if (missingType && !data.type) {
    updates.type = inferType(collection);
    stats.typeFixed++;
    hasChanges = true;
  }

  // Fix missing timestamps
  if (!data.createdAt && !data.created_at) {
    updates.createdAt = new Date().toISOString();
    stats.timestampFixed++;
    hasChanges = true;
  }

  if (!data.updatedAt && !data.updated_at) {
    updates.updatedAt = new Date().toISOString();
    stats.timestampFixed++;
    hasChanges = true;
  }

  // Fix missing mythology
  const missingMythology = issues.some(i => i.field === 'mythology' && i.message.includes('Missing'));
  if (missingMythology && !data.mythology) {
    const mythology = extractMythology(id, data);
    if (mythology) {
      updates.mythology = mythology;
      stats.mythologyFixed++;
      hasChanges = true;
    }
  }

  // Fix short or missing description
  const descIssue = issues.find(i => i.field === 'description');
  if (descIssue) {
    const mythology = updates.mythology || data.mythology || extractMythology(id, data);
    const enhanced = enhanceDescription(data, collection, mythology);
    if (enhanced && enhanced.length >= 50) {
      updates.description = enhanced;
      stats.descriptionFixed++;
      hasChanges = true;
    }
  }

  // Fix missing purpose (for texts)
  const missingPurpose = issues.some(i => i.field === 'purpose' && i.message.includes('Missing'));
  if (missingPurpose && collection === 'texts' && !data.purpose) {
    updates.purpose = inferPurpose(data);
    stats.purposeFixed++;
    hasChanges = true;
  }

  // Collection-specific fixes
  if (collection === 'deities' && !data.domains && data.title) {
    // Try to extract domains from title or description
    const domains = [];
    const text = (data.title + ' ' + (data.description || '')).toLowerCase();

    const domainKeywords = {
      'sun': 'sun', 'moon': 'moon', 'sky': 'sky', 'thunder': 'thunder',
      'war': 'war', 'wisdom': 'wisdom', 'love': 'love', 'death': 'death',
      'sea': 'sea', 'ocean': 'ocean', 'water': 'water', 'fire': 'fire',
      'earth': 'earth', 'fertility': 'fertility', 'harvest': 'harvest',
      'underworld': 'underworld', 'healing': 'healing', 'magic': 'magic'
    };

    for (const [keyword, domain] of Object.entries(domainKeywords)) {
      if (text.includes(keyword) && !domains.includes(domain)) {
        domains.push(domain);
      }
    }

    if (domains.length > 0) {
      updates.domains = domains;
      stats.otherFieldsFixed++;
      hasChanges = true;
    }
  }

  if (collection === 'herbs' && !data.uses) {
    updates.uses = ['spiritual', 'medicinal'];
    stats.otherFieldsFixed++;
    hasChanges = true;
  }

  // Apply updates
  if (hasChanges) {
    stats.total++;

    if (dryRun) {
      console.log(`\n[DRY RUN] Would update ${collection}/${id}:`);
      console.log(JSON.stringify(updates, null, 2));
    } else {
      try {
        await db.collection(collection).doc(id).update(updates);
        console.log(`✓ Updated ${collection}/${id}`);
      } catch (error) {
        console.error(`✗ Error updating ${collection}/${id}:`, error.message);
        stats.errors.push({ collection, id, error: error.message });
      }
    }
  }

  return hasChanges;
}

// Main execution
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('FINAL CLEANUP FIXES');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
  console.log(`Failed assets to process: ${failedAssets.length}`);
  console.log('='.repeat(60));

  // Process each failed asset
  for (const asset of failedAssets) {
    await fixAsset(asset, dryRun);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total assets updated: ${stats.total}`);
  console.log(`  - Type field fixed: ${stats.typeFixed}`);
  console.log(`  - Timestamps added: ${stats.timestampFixed}`);
  console.log(`  - Descriptions enhanced: ${stats.descriptionFixed}`);
  console.log(`  - Mythology inferred: ${stats.mythologyFixed}`);
  console.log(`  - Purpose added: ${stats.purposeFixed}`);
  console.log(`  - Other fields fixed: ${stats.otherFieldsFixed}`);
  console.log(`  - Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach(err => {
      console.log(`  - ${err.collection}/${err.id}: ${err.error}`);
    });
  }

  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made.');
    console.log('Run without --dry-run to apply fixes.');
  } else {
    console.log('\n✓ All fixes applied successfully!');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
