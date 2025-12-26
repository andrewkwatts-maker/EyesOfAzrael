/**
 * Auto-Enhance Firebase Assets
 *
 * Automatically populates common missing fields that can be inferred:
 * - search.searchableText (combine all text fields)
 * - search.keywords (extract from name, description)
 * - rendering.modes (default configuration)
 * - metadata.importance (default based on type)
 *
 * Usage:
 *   node scripts/auto-enhance-firebase-assets.js [--dry-run] [--collection=deities]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const COLLECTION_FILTER = args.find(a => a.startsWith('--collection='))?.split('=')[1];

console.log('Auto-Enhance Firebase Assets');
console.log('Mode:', DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (will update Firebase)');
if (COLLECTION_FILTER) {
  console.log('Filter:', `Only processing collection: ${COLLECTION_FILTER}`);
}
console.log('');

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// ============================================================================
// ENHANCEMENT RULES
// ============================================================================

/**
 * Generate searchableText from all text fields
 */
function generateSearchableText(asset) {
  const textParts = [];

  // Core text fields
  if (asset.name) textParts.push(asset.name);
  if (asset.title) textParts.push(asset.title);
  if (asset.subtitle) textParts.push(asset.subtitle);
  if (asset.description) textParts.push(asset.description);
  if (asset.summary) textParts.push(asset.summary);
  if (asset.content) textParts.push(asset.content);

  // Metadata
  if (asset.metadata?.category) textParts.push(asset.metadata.category);
  if (asset.metadata?.subcategory) textParts.push(asset.metadata.subcategory);
  if (asset.metadata?.tags) textParts.push(...asset.metadata.tags);

  // Search fields
  if (asset.search?.keywords) textParts.push(...asset.search.keywords);
  if (asset.search?.aliases) textParts.push(...asset.search.aliases);

  // Type-specific fields
  if (asset.attributes) {
    Object.values(asset.attributes).forEach(val => {
      if (Array.isArray(val)) {
        textParts.push(...val.filter(v => typeof v === 'string'));
      } else if (typeof val === 'string') {
        textParts.push(val);
      }
    });
  }

  return textParts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate keywords from name and description
 */
function generateKeywords(asset) {
  const keywords = new Set();

  // Add name parts
  if (asset.name) {
    asset.name.split(/\s+/).forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 2) keywords.add(clean);
    });
  }

  // Add from description (important words)
  if (asset.description) {
    const words = asset.description.split(/\s+/);
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 4) keywords.add(clean); // Longer words only
    });
  }

  // Add type
  if (asset.type) {
    keywords.add(asset.type.toLowerCase());
  }

  // Add mythology
  if (asset.relationships?.mythology) {
    keywords.add(asset.relationships.mythology.toLowerCase());
  }

  // Add category
  if (asset.metadata?.category) {
    keywords.add(asset.metadata.category.toLowerCase());
  }

  return Array.from(keywords).slice(0, 15); // Limit to 15 keywords
}

/**
 * Generate default rendering modes
 */
function generateRenderingModes() {
  return {
    hyperlink: true,
    expandableRow: true,
    panelCard: true,
    subsection: true,
    fullPage: true
  };
}

/**
 * Generate default importance based on type
 */
function generateImportance(asset) {
  const typeImportance = {
    mythology: 90,
    deity: 80,
    hero: 70,
    creature: 60,
    item: 60,
    place: 65,
    ritual: 55,
    text: 65,
    cosmology: 75,
    herb: 50,
    concept: 70,
    being: 60,
    angel: 75
  };

  return typeImportance[asset.type] || 50;
}

/**
 * Determine what enhancements an asset needs
 */
function determineEnhancements(asset) {
  const enhancements = {};

  // Search.searchableText
  if (!asset.search?.searchableText) {
    enhancements.searchableText = generateSearchableText(asset);
  }

  // Search.keywords
  if (!asset.search?.keywords || asset.search.keywords.length === 0) {
    enhancements.keywords = generateKeywords(asset);
  }

  // Rendering.modes
  if (!asset.rendering?.modes) {
    enhancements.renderingModes = generateRenderingModes();
  }

  // Rendering.defaultMode
  if (!asset.rendering?.defaultMode) {
    enhancements.defaultMode = 'panelCard';
  }

  // Rendering.defaultAction
  if (!asset.rendering?.defaultAction) {
    enhancements.defaultAction = 'page';
  }

  // Metadata.importance
  if (!asset.metadata?.importance) {
    enhancements.importance = generateImportance(asset);
  }

  // Metadata.status
  if (!asset.metadata?.status) {
    enhancements.status = 'active';
  }

  // Metadata.visibility
  if (!asset.metadata?.visibility) {
    enhancements.visibility = 'public';
  }

  return enhancements;
}

/**
 * Apply enhancements to asset
 */
function applyEnhancements(asset, enhancements) {
  const updated = { ...asset };

  // Initialize nested objects if needed
  if (!updated.search) updated.search = {};
  if (!updated.rendering) updated.rendering = {};
  if (!updated.metadata) updated.metadata = {};

  // Apply enhancements
  if (enhancements.searchableText) {
    updated.search.searchableText = enhancements.searchableText;
  }

  if (enhancements.keywords) {
    updated.search.keywords = enhancements.keywords;
  }

  if (enhancements.renderingModes) {
    updated.rendering.modes = enhancements.renderingModes;
  }

  if (enhancements.defaultMode) {
    updated.rendering.defaultMode = enhancements.defaultMode;
  }

  if (enhancements.defaultAction) {
    updated.rendering.defaultAction = enhancements.defaultAction;
  }

  if (enhancements.importance) {
    updated.metadata.importance = enhancements.importance;
  }

  if (enhancements.status) {
    updated.metadata.status = enhancements.status;
  }

  if (enhancements.visibility) {
    updated.metadata.visibility = enhancements.visibility;
  }

  // Update timestamp
  updated.metadata.updated = new Date().toISOString();

  return updated;
}

// ============================================================================
// PROCESSING
// ============================================================================

/**
 * Process a single collection
 */
async function processCollection(collectionName) {
  console.log(`\nProcessing collection: ${collectionName}`);

  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];

    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ref: doc.ref,
        data: doc.data()
      });
    });

    console.log(`  Found ${documents.length} documents`);

    let enhancedCount = 0;
    let skippedCount = 0;
    const enhancementLog = [];

    for (const doc of documents) {
      const asset = { id: doc.id, ...doc.data };
      const enhancements = determineEnhancements(asset);

      const enhancementCount = Object.keys(enhancements).length;

      if (enhancementCount > 0) {
        const updated = applyEnhancements(asset, enhancements);

        if (!DRY_RUN) {
          await doc.ref.update(updated);
        }

        enhancedCount++;
        enhancementLog.push({
          id: doc.id,
          enhancements: Object.keys(enhancements)
        });

        console.log(`    ✓ ${doc.id}: Added ${enhancementCount} fields`);
      } else {
        skippedCount++;
      }
    }

    return {
      collection: collectionName,
      total: documents.length,
      enhanced: enhancedCount,
      skipped: skippedCount,
      enhancements: enhancementLog,
      success: true
    };

  } catch (error) {
    console.error(`  ✗ ERROR: ${error.message}`);
    return {
      collection: collectionName,
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('AUTO-ENHANCE FIREBASE ASSETS');
  console.log('='.repeat(80));
  console.log('');

  const startTime = Date.now();

  // Get collections
  let collections = await db.listCollections();
  let collectionNames = collections.map(c => c.id);

  // Filter if requested
  if (COLLECTION_FILTER) {
    collectionNames = collectionNames.filter(name => name === COLLECTION_FILTER);
    if (collectionNames.length === 0) {
      console.error(`Collection "${COLLECTION_FILTER}" not found!`);
      process.exit(1);
    }
  }

  console.log(`Processing ${collectionNames.length} collections...\n`);

  const results = [];

  for (const collectionName of collectionNames) {
    const result = await processCollection(collectionName);
    results.push(result);
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalAssets = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalEnhanced = results.reduce((sum, r) => sum + (r.enhanced || 0), 0);
  const totalSkipped = results.reduce((sum, r) => sum + (r.skipped || 0), 0);

  console.log('\n' + '='.repeat(80));
  console.log('ENHANCEMENT COMPLETE');
  console.log('='.repeat(80));
  console.log(`Duration: ${duration}s`);
  console.log(`Total Assets: ${totalAssets}`);
  console.log(`Enhanced: ${totalEnhanced}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log('');

  console.log('Collection Summary:');
  results.forEach(r => {
    if (r.success) {
      console.log(`  ${r.collection}: ${r.enhanced}/${r.total} enhanced`);
    } else {
      console.log(`  ${r.collection}: ERROR - ${r.error}`);
    }
  });

  console.log('='.repeat(80));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No changes were made to Firebase');
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('\n✓ Changes saved to Firebase');
    console.log('Run validation script to see improvements:');
    console.log('  npm run validate-firebase');
  }

  console.log('');

  // Save enhancement log
  const logPath = path.join(__dirname, '..', 'auto-enhancement-log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    results: results
  }, null, 2));

  console.log(`Enhancement log saved: ${logPath}\n`);

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
