#!/usr/bin/env node

/**
 * Firebase Metadata Enrichment Script
 *
 * Enriches all Firebase assets with standardized metadata fields:
 * - timestamps (createdAt, updatedAt)
 * - importance score (0-100)
 * - tags array (extracted from content)
 * - search_text (normalized full-text search)
 * - display_order (for sorted lists)
 * - featured boolean (top 10%)
 * - completeness_score (0-100)
 *
 * Usage:
 *   node scripts/enrich-firebase-metadata.js [--dry-run] [--collection=name]
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

console.log('Firebase Metadata Enrichment');
console.log('Mode:', DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will update Firebase)');
if (COLLECTION_FILTER) {
  console.log('Filter:', `Only processing: ${COLLECTION_FILTER}`);
}
console.log('');

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();

// ============================================================================
// METADATA CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate importance score (0-100) based on content richness
 */
function calculateImportance(asset) {
  let score = 0;

  // Base scores by type
  const typeScores = {
    deity: 70,
    hero: 65,
    creature: 60,
    cosmology: 75,
    ritual: 60,
    text: 70,
    concept: 65,
    herb: 50,
    symbol: 55,
    place: 60,
    item: 55,
    being: 60,
    angel: 70,
    event: 60,
    lineage: 60,
    figure: 60,
    teaching: 65,
    magic: 60
  };

  score = typeScores[asset.type] || typeScores[asset.contentType] || 50;

  // Content richness bonuses
  if (asset.description || asset.summary) {
    const textLength = (asset.description || asset.summary || '').length;
    if (textLength > 500) score += 10;
    else if (textLength > 200) score += 5;
  }

  // Rich content panels bonus
  if (asset.richContent && asset.richContent.panels) {
    const panelCount = asset.richContent.panels.length;
    score += Math.min(panelCount * 2, 15); // Max 15 bonus
  }

  // Relationships bonus
  if (asset.relatedContent && asset.relatedContent.length > 0) {
    score += Math.min(asset.relatedContent.length * 1, 5);
  }

  // Images bonus
  if (asset.imageUrl || (asset.imageUrls && asset.imageUrls.length > 0)) {
    score += 5;
  }

  // Icon bonus
  if (asset.icon) {
    score += 2;
  }

  // Attributes bonus
  if (asset.attributes && Object.keys(asset.attributes).length > 0) {
    score += Math.min(Object.keys(asset.attributes).length, 10);
  }

  // Sources bonus
  if (asset.sources) {
    score += 5;
  }

  // Tags bonus
  if (asset.tags && asset.tags.length > 0) {
    score += Math.min(asset.tags.length, 5);
  }

  // Cap at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Extract tags from asset content
 */
function extractTags(asset) {
  const tags = new Set();

  // Add type
  if (asset.type) tags.add(asset.type);
  if (asset.contentType) tags.add(asset.contentType);

  // Add mythology
  if (asset.mythology) tags.add(asset.mythology);
  if (asset.relationships && asset.relationships.mythology) {
    tags.add(asset.relationships.mythology);
  }

  // Add section
  if (asset.section) tags.add(asset.section);

  // Add pantheon
  if (asset.pantheon) tags.add(asset.pantheon);

  // Add role
  if (asset.role) tags.add(asset.role);

  // Add alignment
  if (asset.alignment) tags.add(asset.alignment);

  // Extract from domains (deity)
  if (asset.attributes && asset.attributes.domains) {
    asset.attributes.domains.forEach(d => tags.add(d.toLowerCase()));
  }

  // Extract from abilities (creature)
  if (asset.attributes && asset.attributes.abilities) {
    asset.attributes.abilities.forEach(a => {
      const words = a.split(/\s+/);
      words.forEach(w => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length > 4) tags.add(clean);
      });
    });
  }

  // Extract from symbols
  if (asset.attributes && asset.attributes.symbols) {
    asset.attributes.symbols.forEach(s => tags.add(s.toLowerCase()));
  }

  // Extract from titles
  if (asset.attributes && asset.attributes.titles) {
    asset.attributes.titles.forEach(t => {
      const words = t.split(/\s+/);
      words.forEach(w => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length > 4) tags.add(clean);
      });
    });
  }

  // Add existing tags
  if (asset.tags) {
    asset.tags.forEach(t => tags.add(t.toLowerCase()));
  }

  // Add search keywords
  if (asset.search && asset.search.keywords) {
    asset.search.keywords.forEach(k => tags.add(k.toLowerCase()));
  }

  // Limit to 25 most relevant tags
  return Array.from(tags).slice(0, 25);
}

/**
 * Create normalized search text
 */
function createSearchText(asset) {
  const textParts = [];

  // Core fields
  if (asset.name) textParts.push(asset.name);
  if (asset.title) textParts.push(asset.title);
  if (asset.subtitle) textParts.push(asset.subtitle);
  if (asset.description) textParts.push(asset.description);
  if (asset.summary) textParts.push(asset.summary);

  // Metadata
  if (asset.mythology) textParts.push(asset.mythology);
  if (asset.section) textParts.push(asset.section);
  if (asset.pantheon) textParts.push(asset.pantheon);
  if (asset.role) textParts.push(asset.role);

  // Attributes (flatten arrays and objects)
  if (asset.attributes) {
    Object.values(asset.attributes).forEach(val => {
      if (Array.isArray(val)) {
        textParts.push(...val.filter(v => typeof v === 'string'));
      } else if (typeof val === 'string') {
        textParts.push(val);
      }
    });
  }

  // Rich content panels
  if (asset.richContent && asset.richContent.panels) {
    asset.richContent.panels.forEach(panel => {
      if (panel.title) textParts.push(panel.title);
      if (panel.content) textParts.push(panel.content);
    });
  }

  // Join and normalize
  return textParts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate completeness score (0-100) based on field population
 */
function calculateCompleteness(asset) {
  const requiredFields = [
    'name', 'title', 'type', 'contentType', 'mythology', 'section',
    'description', 'summary'
  ];

  const optionalFields = [
    'subtitle', 'icon', 'imageUrl', 'richContent', 'attributes',
    'tags', 'relatedContent', 'sources', 'pantheon', 'role'
  ];

  let score = 0;

  // Required fields (60 points)
  const requiredPresent = requiredFields.filter(field => {
    const value = asset[field];
    return value && (typeof value !== 'string' || value.trim().length > 0);
  });
  score += (requiredPresent.length / requiredFields.length) * 60;

  // Optional fields (40 points)
  const optionalPresent = optionalFields.filter(field => {
    const value = asset[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length > 0;
    }
    return value && (typeof value !== 'string' || value.trim().length > 0);
  });
  score += (optionalPresent.length / optionalFields.length) * 40;

  // Rich content bonus
  if (asset.richContent && asset.richContent.panels) {
    const panelCount = asset.richContent.panels.length;
    if (panelCount >= 5) score += 5;
    else if (panelCount >= 3) score += 3;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate display order (alphabetical by title)
 */
function calculateDisplayOrder(asset) {
  const title = asset.title || asset.name || '';
  return title.toLowerCase().replace(/^(the|a|an)\s+/, '');
}

/**
 * Add timestamps if missing
 */
function ensureTimestamps(asset) {
  const now = admin.firestore.Timestamp.now();

  return {
    createdAt: asset.createdAt || now,
    updatedAt: now
  };
}

// ============================================================================
// ENRICHMENT LOGIC
// ============================================================================

/**
 * Enrich a single asset with metadata
 */
function enrichAsset(asset) {
  const enriched = { ...asset };

  // Add timestamps
  const timestamps = ensureTimestamps(asset);
  enriched.createdAt = timestamps.createdAt;
  enriched.updatedAt = timestamps.updatedAt;

  // Calculate importance
  enriched.importance = calculateImportance(asset);

  // Extract tags
  enriched.tags = extractTags(asset);

  // Create search text
  enriched.search_text = createSearchText(asset);

  // Calculate completeness
  enriched.completeness_score = calculateCompleteness(asset);

  // Display order (for sorting)
  enriched.display_order = calculateDisplayOrder(asset);

  // Featured flag (will be set later for top 10%)
  if (!enriched.hasOwnProperty('featured')) {
    enriched.featured = false;
  }

  return enriched;
}

// ============================================================================
// PROCESSING
// ============================================================================

/**
 * Process a single collection
 */
async function processCollection(collectionName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing: ${collectionName}`);
  console.log('='.repeat(80));

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

    console.log(`Found ${documents.length} documents`);

    // Enrich all assets
    const enrichedAssets = documents.map(doc => ({
      ...doc,
      enriched: enrichAsset({ id: doc.id, ...doc.data })
    }));

    // Calculate featured (top 10% by importance)
    const sorted = [...enrichedAssets].sort((a, b) =>
      b.enriched.importance - a.enriched.importance
    );
    const featuredCount = Math.max(1, Math.ceil(sorted.length * 0.1));
    const featuredIds = new Set(
      sorted.slice(0, featuredCount).map(a => a.id)
    );

    // Mark featured assets
    enrichedAssets.forEach(asset => {
      asset.enriched.featured = featuredIds.has(asset.id);
    });

    // Stats
    const stats = {
      total: documents.length,
      featured: featuredCount,
      avgImportance: Math.round(
        enrichedAssets.reduce((sum, a) => sum + a.enriched.importance, 0) / documents.length
      ),
      avgCompleteness: Math.round(
        enrichedAssets.reduce((sum, a) => sum + a.enriched.completeness_score, 0) / documents.length
      ),
      enriched: 0,
      errors: []
    };

    // Update Firebase
    if (!DRY_RUN) {
      const batch = db.batch();
      let batchCount = 0;
      const batches = [];

      for (const asset of enrichedAssets) {
        batch.update(asset.ref, asset.enriched);
        batchCount++;

        if (batchCount >= 500) {
          batches.push(batch);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        batches.push(batch);
      }

      // Commit batches
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        console.log(`  Batch ${i + 1}/${batches.length} committed`);
      }

      stats.enriched = documents.length;
    }

    // Display stats
    console.log('\nStatistics:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Featured: ${stats.featured} (${Math.round(stats.featured/stats.total*100)}%)`);
    console.log(`  Avg Importance: ${stats.avgImportance}/100`);
    console.log(`  Avg Completeness: ${stats.avgCompleteness}/100`);

    if (DRY_RUN) {
      console.log('\n  (Dry run - no changes made)');
    } else {
      console.log(`\n  ✓ Enriched ${stats.enriched} assets`);
    }

    return {
      collection: collectionName,
      ...stats,
      assets: enrichedAssets.map(a => ({
        id: a.id,
        title: a.enriched.title || a.enriched.name,
        importance: a.enriched.importance,
        completeness: a.enriched.completeness_score,
        featured: a.enriched.featured,
        tags: a.enriched.tags.length
      }))
    };

  } catch (error) {
    console.error(`\n✗ ERROR: ${error.message}`);
    return {
      collection: collectionName,
      error: error.message,
      success: false
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('FIREBASE METADATA ENRICHMENT');
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

  // Generate report
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalAssets = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalFeatured = results.reduce((sum, r) => sum + (r.featured || 0), 0);
  const avgImportance = Math.round(
    results.reduce((sum, r) => sum + (r.avgImportance || 0) * (r.total || 0), 0) / totalAssets
  );
  const avgCompleteness = Math.round(
    results.reduce((sum, r) => sum + (r.avgCompleteness || 0) * (r.total || 0), 0) / totalAssets
  );

  console.log('\n' + '='.repeat(80));
  console.log('ENRICHMENT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Duration: ${duration}s`);
  console.log(`Total Assets: ${totalAssets}`);
  console.log(`Featured: ${totalFeatured} (${Math.round(totalFeatured/totalAssets*100)}%)`);
  console.log(`Average Importance: ${avgImportance}/100`);
  console.log(`Average Completeness: ${avgCompleteness}/100`);
  console.log('');

  console.log('Collection Breakdown:');
  results.forEach(r => {
    if (r.success !== false) {
      console.log(`  ${r.collection.padEnd(20)} ${r.total.toString().padStart(4)} assets, ` +
        `${r.avgImportance}/100 importance, ${r.avgCompleteness}/100 completeness`);
    } else {
      console.log(`  ${r.collection.padEnd(20)} ERROR: ${r.error}`);
    }
  });

  console.log('='.repeat(80));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No changes were made');
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('\n✓ Metadata enrichment complete!');
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'FIREBASE_METADATA_ENRICHMENT_REPORT.json');
  const report = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    summary: {
      duration,
      totalAssets,
      totalFeatured,
      avgImportance,
      avgCompleteness
    },
    collections: results
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}\n`);

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
