/**
 * Fix Firebase Assets - Missing Required Fields
 *
 * This script:
 * 1. Downloads all assets from Firebase
 * 2. Analyzes them for missing required fields
 * 3. Infers missing data from context (collection name, related data, etc.)
 * 4. Generates fixes (conservative approach)
 * 5. Creates a batch update script
 * 6. Logs all changes for review
 *
 * Usage: node scripts/fix-firebase-assets.js [--dry-run] [--collection=name]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_COLLECTION = process.argv.find(arg => arg.startsWith('--collection='))?.split('=')[1];

const OUTPUT_DIR = path.join(__dirname, '..', 'firebase-fixes');
const FIXES_DIR = path.join(OUTPUT_DIR, 'fixes');
const LOGS_DIR = path.join(OUTPUT_DIR, 'logs');

// Required fields per unified schema
const REQUIRED_FIELDS = {
  // Core fields for ALL entities
  universal: ['id', 'type', 'name', 'mythology'],

  // Recommended fields that enhance quality
  recommended: ['description', 'icon', 'summary'],

  // Metadata fields that should exist
  metadata: ['status', 'visibility', 'created', 'updated']
};

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

console.log('Initializing Firebase Admin SDK...');

let serviceAccount;
const possiblePaths = [
  path.join(__dirname, '..', 'firebase-service-account.json'),
  path.join(__dirname, '..', 'FIREBASE', 'firebase-service-account.json'),
  path.join(__dirname, '..', 'serviceAccountKey.json')
];

for (const accountPath of possiblePaths) {
  try {
    if (fs.existsSync(accountPath)) {
      serviceAccount = require(accountPath);
      console.log(`Found service account at: ${accountPath}`);
      break;
    }
  } catch (err) {
    // Continue to next path
  }
}

if (!serviceAccount) {
  console.error('ERROR: Could not find Firebase service account key!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'eyesofazrael'
});

const db = admin.firestore();
console.log('Firebase initialized successfully.\n');

// ============================================================================
// FIELD INFERENCE FUNCTIONS
// ============================================================================

/**
 * Infer entity type from collection name
 */
function inferType(collectionName, asset) {
  // Check if type already exists
  if (asset.type && asset.type !== 'unknown') {
    return null; // No change needed
  }

  // Map collection names to types
  const typeMap = {
    'deities': 'deity',
    'heroes': 'hero',
    'creatures': 'creature',
    'cosmology': 'cosmology',
    'rituals': 'ritual',
    'texts': 'text',
    'places': 'location',
    'locations': 'location',
    'concepts': 'concept',
    'herbs': 'herb',
    'symbols': 'symbol',
    'beings': 'being',
    'events': 'event',
    'myths': 'myth',
    'items': 'item',
    'archetypes': 'archetype',
    'mythologies': 'mythology',
    'cross_references': 'cross-reference',
    'pages': 'page',
    'theories': 'theory'
  };

  const inferredType = typeMap[collectionName];

  if (inferredType) {
    return {
      field: 'type',
      oldValue: asset.type || null,
      newValue: inferredType,
      reason: `Inferred from collection name: ${collectionName}`,
      confidence: 'high'
    };
  }

  return null;
}

/**
 * Infer entity type for entityType field
 */
function inferEntityType(collectionName, asset) {
  // Check if entityType exists and is valid
  if (asset.entityType && asset.entityType !== 'unknown') {
    return null;
  }

  // Use type field if it exists
  if (asset.type && asset.type !== 'unknown') {
    return {
      field: 'entityType',
      oldValue: asset.entityType || null,
      newValue: asset.type,
      reason: 'Copied from type field',
      confidence: 'high'
    };
  }

  // Infer from collection
  const typeMap = {
    'deities': 'deity',
    'heroes': 'hero',
    'creatures': 'creature',
    'cosmology': 'cosmology',
    'rituals': 'ritual',
    'texts': 'text',
    'places': 'location',
    'locations': 'location',
    'concepts': 'concept'
  };

  const inferredType = typeMap[collectionName];

  if (inferredType) {
    return {
      field: 'entityType',
      oldValue: asset.entityType || null,
      newValue: inferredType,
      reason: `Inferred from collection name: ${collectionName}`,
      confidence: 'high'
    };
  }

  return null;
}

/**
 * Infer name from id or other fields
 */
function inferName(collectionName, asset) {
  if (asset.name && asset.name.length > 0) {
    return null; // Has name
  }

  let inferredName = null;
  let reason = '';
  let confidence = 'low';

  // Try displayName
  if (asset.displayName && asset.displayName.length > 0) {
    inferredName = asset.displayName.replace(/^[^\w\s]+\s*/, ''); // Remove leading emoji
    reason = 'Extracted from displayName';
    confidence = 'high';
  }
  // Try title
  else if (asset.title && asset.title.length > 0) {
    inferredName = asset.title.split(' - ').pop().trim(); // Get last part after dash
    reason = 'Extracted from title';
    confidence = 'medium';
  }
  // Convert id to title case
  else if (asset.id) {
    inferredName = asset.id
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    reason = 'Generated from ID';
    confidence = 'low';
  }

  if (inferredName) {
    return {
      field: 'name',
      oldValue: asset.name || null,
      newValue: inferredName,
      reason: reason,
      confidence: confidence
    };
  }

  return null;
}

/**
 * Infer mythology from related data or collection structure
 */
function inferMythology(collectionName, asset) {
  if (asset.mythology && asset.mythology !== 'global' && asset.mythology.length > 2) {
    return null; // Has valid mythology
  }

  let inferredMythology = null;
  let reason = '';
  let confidence = 'low';

  // Check for mythology-specific collections
  const mythologyCollections = [
    'christian', 'islamic', 'yoruba', 'tarot'
  ];

  if (mythologyCollections.includes(collectionName)) {
    inferredMythology = collectionName;
    reason = `Collection is mythology-specific: ${collectionName}`;
    confidence = 'high';
  }
  // Check relatedEntities for mythology hints
  else if (asset.relatedEntities && asset.relatedEntities.length > 0) {
    // Extract mythology from related entity links
    const mythologyHints = new Set();
    asset.relatedEntities.forEach(entity => {
      if (entity.link) {
        const match = entity.link.match(/mythos\/(\w+)\//);
        if (match) {
          mythologyHints.add(match[1]);
        }
      }
    });

    if (mythologyHints.size === 1) {
      inferredMythology = Array.from(mythologyHints)[0];
      reason = 'Extracted from related entities links';
      confidence = 'high';
    }
  }
  // Check title for mythology prefix
  else if (asset.title) {
    const match = asset.title.match(/^(\w+)\s*-/);
    if (match) {
      const potentialMyth = match[1].toLowerCase();
      const validMythologies = [
        'greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist', 'chinese',
        'japanese', 'celtic', 'babylonian', 'sumerian', 'persian', 'aztec',
        'mayan', 'christian', 'islamic', 'jewish'
      ];

      if (validMythologies.includes(potentialMyth)) {
        inferredMythology = potentialMyth;
        reason = 'Extracted from title prefix';
        confidence = 'high';
      }
    }
  }

  // Default to 'global' if nothing else works
  if (!inferredMythology && !asset.mythology) {
    inferredMythology = 'global';
    reason = 'Default value for cross-cultural content';
    confidence = 'low';
  }

  if (inferredMythology) {
    return {
      field: 'mythology',
      oldValue: asset.mythology || null,
      newValue: inferredMythology,
      reason: reason,
      confidence: confidence
    };
  }

  return null;
}

/**
 * Infer or improve description
 */
function inferDescription(collectionName, asset) {
  const currentDesc = asset.description || '';

  // If description exists and is substantial, no change needed
  if (currentDesc.length > 50) {
    return null;
  }

  let inferredDesc = null;
  let reason = '';
  let confidence = 'low';

  // Try summary
  if (asset.summary && asset.summary.length > 50) {
    inferredDesc = asset.summary;
    reason = 'Copied from summary field';
    confidence = 'high';
  }
  // Try listDisplay.expandedContent
  else if (asset.listDisplay?.expandedContent && asset.listDisplay.expandedContent.length > 50) {
    inferredDesc = asset.listDisplay.expandedContent;
    reason = 'Extracted from listDisplay.expandedContent';
    confidence = 'high';
  }
  // Try panelDisplay content
  else if (asset.panelDisplay?.sections) {
    const textSection = asset.panelDisplay.sections.find(s => s.type === 'text');
    if (textSection?.content && textSection.content.length > 50) {
      inferredDesc = textSection.content;
      reason = 'Extracted from panelDisplay text section';
      confidence = 'medium';
    }
  }
  // Generate minimal description from name and type
  else if (asset.name && asset.type) {
    const typeName = asset.type.charAt(0).toUpperCase() + asset.type.slice(1);
    const mythologyName = asset.mythology ?
      ` in ${asset.mythology.charAt(0).toUpperCase() + asset.mythology.slice(1)} mythology` : '';
    inferredDesc = `${asset.name} is a ${typeName}${mythologyName}.`;
    reason = 'Generated minimal description from name and type';
    confidence = 'low';
  }

  if (inferredDesc && inferredDesc !== currentDesc) {
    return {
      field: 'description',
      oldValue: currentDesc || null,
      newValue: inferredDesc,
      reason: reason,
      confidence: confidence
    };
  }

  return null;
}

/**
 * Infer summary from description or other content
 */
function inferSummary(collectionName, asset) {
  const currentSummary = asset.summary || '';

  // If summary exists and is substantial, no change needed
  if (currentSummary.length > 30) {
    return null;
  }

  let inferredSummary = null;
  let reason = '';
  let confidence = 'low';

  // Try description (truncate if too long)
  if (asset.description && asset.description.length > 30) {
    if (asset.description.length <= 300) {
      inferredSummary = asset.description;
      reason = 'Copied from description';
      confidence = 'high';
    } else {
      // Truncate at sentence boundary
      const sentences = asset.description.match(/[^.!?]+[.!?]+/g) || [];
      inferredSummary = sentences[0] || asset.description.substring(0, 300) + '...';
      reason = 'Truncated from description';
      confidence = 'medium';
    }
  }
  // Try listDisplay.secondary
  else if (asset.listDisplay?.secondary) {
    inferredSummary = asset.listDisplay.secondary.replace(/\.\.\.$/, '');
    reason = 'Extracted from listDisplay.secondary';
    confidence = 'medium';
  }

  if (inferredSummary && inferredSummary !== currentSummary) {
    return {
      field: 'summary',
      oldValue: currentSummary || null,
      newValue: inferredSummary,
      reason: reason,
      confidence: confidence
    };
  }

  return null;
}

/**
 * Ensure metadata fields exist
 */
function ensureMetadata(collectionName, asset) {
  const fixes = [];

  if (!asset.metadata) {
    asset.metadata = {};
  }

  // Status
  if (!asset.metadata.status) {
    fixes.push({
      field: 'metadata.status',
      oldValue: null,
      newValue: 'published',
      reason: 'Default status for existing content',
      confidence: 'high'
    });
  }

  // Visibility
  if (!asset.metadata.visibility) {
    fixes.push({
      field: 'metadata.visibility',
      oldValue: null,
      newValue: 'public',
      reason: 'Default visibility for existing content',
      confidence: 'high'
    });
  }

  // Timestamps
  const now = admin.firestore.Timestamp.now();

  if (!asset.metadata.created && !asset._created) {
    fixes.push({
      field: 'metadata.created',
      oldValue: null,
      newValue: now,
      reason: 'Set to current timestamp (original unknown)',
      confidence: 'low'
    });
  }

  if (!asset.metadata.updated && !asset._modified) {
    fixes.push({
      field: 'metadata.updated',
      oldValue: null,
      newValue: now,
      reason: 'Set to current timestamp',
      confidence: 'high'
    });
  }

  return fixes.length > 0 ? fixes : null;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze an asset and generate fixes
 */
function analyzeAsset(collectionName, asset) {
  const fixes = [];

  // Check required fields
  const typeFix = inferType(collectionName, asset);
  if (typeFix) fixes.push(typeFix);

  const entityTypeFix = inferEntityType(collectionName, asset);
  if (entityTypeFix) fixes.push(entityTypeFix);

  const nameFix = inferName(collectionName, asset);
  if (nameFix) fixes.push(nameFix);

  const mythologyFix = inferMythology(collectionName, asset);
  if (mythologyFix) fixes.push(mythologyFix);

  // Check recommended fields
  const descriptionFix = inferDescription(collectionName, asset);
  if (descriptionFix) fixes.push(descriptionFix);

  const summaryFix = inferSummary(collectionName, asset);
  if (summaryFix) fixes.push(summaryFix);

  // Check metadata
  const metadataFixes = ensureMetadata(collectionName, asset);
  if (metadataFixes) fixes.push(...metadataFixes);

  return {
    id: asset.id,
    collection: collectionName,
    fixCount: fixes.length,
    fixes: fixes,
    priority: calculateFixPriority(fixes, asset)
  };
}

/**
 * Calculate priority for applying fixes
 */
function calculateFixPriority(fixes, asset) {
  let priority = 0;

  // Higher priority for required field fixes
  fixes.forEach(fix => {
    if (['type', 'name', 'mythology'].includes(fix.field)) {
      priority += 10;
    }
    if (fix.confidence === 'high') {
      priority += 5;
    } else if (fix.confidence === 'medium') {
      priority += 3;
    } else {
      priority += 1;
    }
  });

  // Boost for important assets
  if (asset.importance && asset.importance > 70) {
    priority += 10;
  }

  return priority;
}

// ============================================================================
// FIREBASE OPERATIONS
// ============================================================================

/**
 * Download all documents from a collection
 */
async function downloadCollection(collectionName) {
  console.log(`\nAnalyzing collection: ${collectionName}`);

  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];

    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`  Found ${documents.length} documents`);
    return {
      collection: collectionName,
      documents: documents,
      count: documents.length,
      success: true
    };
  } catch (error) {
    console.error(`  ERROR: ${error.message}`);
    return {
      collection: collectionName,
      documents: [],
      count: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Apply fixes to Firebase
 */
async function applyFixes(fixes) {
  console.log(`\nApplying ${fixes.length} fixes to Firebase...`);

  const batch = db.batch();
  let batchCount = 0;
  const results = [];

  for (const fix of fixes) {
    const docRef = db.collection(fix.collection).doc(fix.id);
    const updates = {};

    // Build update object from fixes
    fix.fixes.forEach(f => {
      updates[f.field] = f.newValue;
    });

    batch.update(docRef, updates);
    batchCount++;

    // Firestore batch limit is 500
    if (batchCount >= 500) {
      await batch.commit();
      console.log(`  Committed batch of ${batchCount} updates`);
      results.push({ batchSize: batchCount, success: true });
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} updates`);
    results.push({ batchSize: batchCount, success: true });
  }

  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('FIREBASE ASSET FIX SCRIPT');
    console.log('='.repeat(80));
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (will update Firebase)'}`);
    if (SPECIFIC_COLLECTION) {
      console.log(`Target: ${SPECIFIC_COLLECTION} collection only`);
    }
    console.log('='.repeat(80));

    // Create output directories
    [OUTPUT_DIR, FIXES_DIR, LOGS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Get collections to process
    let collections;
    if (SPECIFIC_COLLECTION) {
      collections = [SPECIFIC_COLLECTION];
    } else {
      const allCollections = await db.listCollections();
      collections = allCollections.map(col => col.id);
    }

    console.log(`\nProcessing ${collections.length} collection(s)...\n`);

    const allFixes = [];
    const summary = {
      totalAssets: 0,
      assetsNeedingFixes: 0,
      totalFixes: 0,
      byConfidence: { high: 0, medium: 0, low: 0 },
      byField: {},
      byCollection: {}
    };

    // Process each collection
    for (const collectionName of collections) {
      const result = await downloadCollection(collectionName);

      if (!result.success) {
        continue;
      }

      const collectionFixes = [];

      for (const asset of result.documents) {
        summary.totalAssets++;

        const analysis = analyzeAsset(collectionName, asset);

        if (analysis.fixCount > 0) {
          summary.assetsNeedingFixes++;
          summary.totalFixes += analysis.fixCount;

          // Track by confidence
          analysis.fixes.forEach(fix => {
            summary.byConfidence[fix.confidence]++;
            summary.byField[fix.field] = (summary.byField[fix.field] || 0) + 1;
          });

          collectionFixes.push(analysis);
          allFixes.push(analysis);
        }
      }

      summary.byCollection[collectionName] = {
        total: result.count,
        needingFixes: collectionFixes.length,
        fixes: collectionFixes.reduce((sum, f) => sum + f.fixCount, 0)
      };

      // Save collection fixes
      if (collectionFixes.length > 0) {
        const fixFile = path.join(FIXES_DIR, `${collectionName}-fixes.json`);
        fs.writeFileSync(fixFile, JSON.stringify(collectionFixes, null, 2));
        console.log(`  Saved ${collectionFixes.length} asset fixes to ${fixFile}`);
      }
    }

    // Sort fixes by priority
    allFixes.sort((a, b) => b.priority - a.priority);

    // Save master fix list
    const masterFile = path.join(OUTPUT_DIR, 'MASTER_FIXES.json');
    fs.writeFileSync(masterFile, JSON.stringify(allFixes, null, 2));

    // Save summary
    const summaryFile = path.join(OUTPUT_DIR, 'FIX_SUMMARY.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    // Generate human-readable report
    const report = generateReport(summary, allFixes);
    const reportFile = path.join(OUTPUT_DIR, 'FIX_REPORT.md');
    fs.writeFileSync(reportFile, report);

    // Apply fixes if not dry run
    if (!DRY_RUN && allFixes.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('APPLYING FIXES TO FIREBASE');
      console.log('='.repeat(80));

      const applyResults = await applyFixes(allFixes);

      const changeLog = {
        timestamp: new Date().toISOString(),
        mode: 'LIVE',
        totalFixes: allFixes.length,
        batchResults: applyResults,
        summary: summary
      };

      const logFile = path.join(LOGS_DIR, `change-log-${Date.now()}.json`);
      fs.writeFileSync(logFile, JSON.stringify(changeLog, null, 2));

      console.log(`\nChange log saved: ${logFile}`);
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('FIX SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Assets: ${summary.totalAssets}`);
    console.log(`Assets Needing Fixes: ${summary.assetsNeedingFixes}`);
    console.log(`Total Fixes: ${summary.totalFixes}`);
    console.log('');
    console.log('By Confidence:');
    console.log(`  High: ${summary.byConfidence.high}`);
    console.log(`  Medium: ${summary.byConfidence.medium}`);
    console.log(`  Low: ${summary.byConfidence.low}`);
    console.log('');
    console.log('Most Common Fixes:');
    Object.entries(summary.byField)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([field, count]) => {
        console.log(`  ${field}: ${count}`);
      });
    console.log('');
    console.log('Output Files:');
    console.log(`  Master Fixes: ${masterFile}`);
    console.log(`  Summary: ${summaryFile}`);
    console.log(`  Report: ${reportFile}`);
    console.log('='.repeat(80));

    if (DRY_RUN) {
      console.log('\nDRY RUN COMPLETE - No changes made to Firebase');
      console.log('To apply fixes, run: node scripts/fix-firebase-assets.js');
    } else {
      console.log('\nFixes applied successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('\nERROR:', error);
    process.exit(1);
  }
}

/**
 * Generate human-readable report
 */
function generateReport(summary, allFixes) {
  const lines = [];

  lines.push('# Firebase Asset Fix Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Assets:** ${summary.totalAssets}`);
  lines.push(`- **Assets Needing Fixes:** ${summary.assetsNeedingFixes}`);
  lines.push(`- **Total Fixes Applied:** ${summary.totalFixes}`);
  lines.push('');

  lines.push('### Fix Confidence Distribution');
  lines.push('');
  lines.push(`- **High Confidence:** ${summary.byConfidence.high} fixes`);
  lines.push(`- **Medium Confidence:** ${summary.byConfidence.medium} fixes`);
  lines.push(`- **Low Confidence:** ${summary.byConfidence.low} fixes`);
  lines.push('');

  lines.push('## Fixes by Collection');
  lines.push('');
  lines.push('| Collection | Total Assets | Need Fixes | Total Fixes |');
  lines.push('|-----------|--------------|------------|-------------|');

  Object.entries(summary.byCollection)
    .sort((a, b) => b[1].fixes - a[1].fixes)
    .forEach(([name, data]) => {
      lines.push(`| ${name} | ${data.total} | ${data.needingFixes} | ${data.fixes} |`);
    });
  lines.push('');

  lines.push('## Top 20 Priority Fixes');
  lines.push('');
  lines.push('| Priority | Collection | Asset ID | Fixes | Fields |');
  lines.push('|----------|-----------|----------|-------|--------|');

  allFixes.slice(0, 20).forEach(fix => {
    const fields = fix.fixes.map(f => f.field).join(', ');
    lines.push(`| ${fix.priority} | ${fix.collection} | ${fix.id} | ${fix.fixCount} | ${fields} |`);
  });
  lines.push('');

  lines.push('## Most Common Field Fixes');
  lines.push('');
  lines.push('| Field | Count |');
  lines.push('|-------|-------|');

  Object.entries(summary.byField)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
      lines.push(`| ${field} | ${count} |`);
    });
  lines.push('');

  return lines.join('\n');
}

// Run the script
main();
