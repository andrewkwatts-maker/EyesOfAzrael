/**
 * Firebase Asset Validation Script
 *
 * Comprehensive validation of ALL Firebase assets against the unified template
 * Downloads all collections, validates against template requirements, generates reports
 *
 * Usage: node scripts/validate-all-firebase-assets.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, '..', 'firebase-assets-validated-complete');
const REPORTS_DIR = path.join(__dirname, '..');

// ============================================================================
// INITIALIZE FIREBASE
// ============================================================================

console.log('Initializing Firebase Admin SDK...');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'eyesofazrael'
});

const db = admin.firestore();
console.log('Firebase initialized successfully.\n');

// ============================================================================
// UNIFIED TEMPLATE SCHEMA (from UNIFIED_ASSET_TEMPLATE.md)
// ============================================================================

const TEMPLATE_SCHEMA = {
  // Core Identity (required)
  coreIdentity: {
    id: { required: true, type: 'string', weight: 10 },
    type: { required: true, type: 'string', weight: 10 },
    name: { required: true, type: 'string', weight: 10 },
    title: { required: false, type: 'string', weight: 2 },
    subtitle: { required: false, type: 'string', weight: 1 }
  },

  // Display (important for rendering)
  display: {
    icon: { required: false, type: 'string', weight: 3 },
    image: { required: false, type: 'string', weight: 2 },
    thumbnail: { required: false, type: 'string', weight: 2 },
    color: { required: false, type: 'string', weight: 1 }
  },

  // Content (critical for user value)
  content: {
    description: { required: false, type: 'string', weight: 8 },
    summary: { required: false, type: 'string', weight: 5 },
    content: { required: false, type: 'string', weight: 5 }
  },

  // Metadata (important for filtering/search)
  metadata: {
    category: { required: false, type: 'string', weight: 4 },
    subcategory: { required: false, type: 'string', weight: 2 },
    tags: { required: false, type: 'array', weight: 4 },
    order: { required: false, type: 'number', weight: 2 },
    importance: { required: false, type: 'number', weight: 3 },
    featured: { required: false, type: 'boolean', weight: 1 },
    status: { required: false, type: 'string', weight: 2 },
    created: { required: false, type: 'timestamp', weight: 1 },
    updated: { required: false, type: 'timestamp', weight: 1 },
    published: { required: false, type: 'timestamp', weight: 1 },
    author: { required: false, type: 'string', weight: 1 },
    contributors: { required: false, type: 'array', weight: 1 },
    source: { required: false, type: 'string', weight: 2 },
    visibility: { required: false, type: 'string', weight: 1 }
  },

  // Relationships (critical for cross-linking)
  relationships: {
    mythology: { required: false, type: 'string', weight: 5 },
    parentId: { required: false, type: 'string', weight: 2 },
    childIds: { required: false, type: 'array', weight: 2 },
    relatedIds: { required: false, type: 'array', weight: 4 },
    references: { required: false, type: 'array', weight: 3 },
    collections: { required: false, type: 'array', weight: 3 },
    sameAs: { required: false, type: 'array', weight: 1 },
    seeAlso: { required: false, type: 'array', weight: 1 }
  },

  // Search & Filtering (critical for discoverability)
  search: {
    keywords: { required: false, type: 'array', weight: 4 },
    aliases: { required: false, type: 'array', weight: 3 },
    facets: { required: false, type: 'object', weight: 3 },
    searchableText: { required: false, type: 'string', weight: 2 }
  },

  // Rendering Configuration (for display modes)
  rendering: {
    modes: { required: false, type: 'object', weight: 2 },
    defaultMode: { required: false, type: 'string', weight: 1 },
    defaultAction: { required: false, type: 'string', weight: 1 }
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a single asset against the template schema
 * @param {Object} asset - Asset data
 * @param {string} collection - Collection name
 * @returns {Object} Validation result
 */
function validateAsset(asset, collection) {
  const validation = {
    id: asset.id || 'unknown',
    collection: collection,
    completeness: 0,
    maxScore: 0,
    actualScore: 0,
    missingFields: [],
    presentFields: [],
    fieldScores: {},
    issues: []
  };

  // Flatten asset for easier validation
  const flatAsset = {
    ...asset,
    ...asset.metadata,
    ...asset.relationships,
    ...asset.search,
    ...asset.rendering
  };

  // Validate each section
  Object.entries(TEMPLATE_SCHEMA).forEach(([sectionName, fields]) => {
    Object.entries(fields).forEach(([fieldName, fieldSpec]) => {
      validation.maxScore += fieldSpec.weight;

      const fullPath = getFieldPath(sectionName, fieldName);
      const value = getNestedValue(asset, fullPath);

      if (value !== undefined && value !== null && value !== '') {
        // Field exists
        validation.actualScore += fieldSpec.weight;
        validation.presentFields.push(fullPath);
        validation.fieldScores[fullPath] = fieldSpec.weight;
      } else {
        // Field missing
        if (fieldSpec.required) {
          validation.issues.push(`REQUIRED field missing: ${fullPath}`);
        }
        validation.missingFields.push({
          path: fullPath,
          weight: fieldSpec.weight,
          required: fieldSpec.required
        });
      }
    });
  });

  // Calculate completeness percentage
  validation.completeness = Math.round((validation.actualScore / validation.maxScore) * 100);

  return validation;
}

/**
 * Get field path for nested objects
 */
function getFieldPath(section, field) {
  // Core identity fields are at root level
  if (section === 'coreIdentity') {
    return field;
  }
  // Display fields are at root level
  if (section === 'display') {
    return field;
  }
  // Content fields are at root level
  if (section === 'content') {
    return field;
  }
  // Others are nested
  return `${section}.${field}`;
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

/**
 * Download all documents from a collection
 */
async function downloadCollection(collectionName) {
  console.log(`\nDownloading collection: ${collectionName}`);

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
 * Get all collection names from Firestore
 */
async function getAllCollections() {
  console.log('Fetching all collections from Firestore...');
  const collections = await db.listCollections();
  const collectionNames = collections.map(col => col.id);
  console.log(`Found ${collectionNames.length} collections:`, collectionNames.join(', '));
  return collectionNames;
}

// ============================================================================
// VALIDATION & REPORTING
// ============================================================================

/**
 * Main validation function
 */
async function validateAllAssets() {
  console.log('='.repeat(80));
  console.log('FIREBASE ASSET VALIDATION');
  console.log('='.repeat(80));
  console.log('Starting comprehensive validation...\n');

  const timestamp = new Date().toISOString();

  // Create output directories
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all collections
  const collectionNames = await getAllCollections();

  const report = {
    timestamp: timestamp,
    totalCollections: collectionNames.length,
    totalAssets: 0,
    validatedAssets: 0,
    collections: {},
    allValidations: [],
    incompleteAssets: [],
    summary: {
      averageCompleteness: 0,
      highQuality: 0,  // >= 80%
      mediumQuality: 0, // 50-79%
      lowQuality: 0,    // < 50%
      totalScore: 0,
      maxPossibleScore: 0
    }
  };

  // Download and validate each collection
  for (const collectionName of collectionNames) {
    const result = await downloadCollection(collectionName);

    if (!result.success) {
      report.collections[collectionName] = {
        error: result.error,
        count: 0,
        validations: []
      };
      continue;
    }

    // Save raw collection data
    const collectionDir = path.join(OUTPUT_DIR, collectionName);
    if (!fs.existsSync(collectionDir)) {
      fs.mkdirSync(collectionDir, { recursive: true });
    }

    const collectionFile = path.join(collectionDir, '_collection.json');
    fs.writeFileSync(collectionFile, JSON.stringify(result.documents, null, 2));

    // Validate each asset
    const validations = [];
    const incompleteAssets = [];

    for (const asset of result.documents) {
      const validation = validateAsset(asset, collectionName);
      validations.push(validation);
      report.allValidations.push(validation);
      report.validatedAssets++;

      // Save individual asset
      const assetFile = path.join(collectionDir, `${asset.id || 'unknown'}.json`);
      fs.writeFileSync(assetFile, JSON.stringify(asset, null, 2));

      // Track incomplete assets
      if (validation.completeness < 100) {
        incompleteAssets.push({
          id: validation.id,
          collection: collectionName,
          completeness: validation.completeness,
          missingFields: validation.missingFields,
          importance: asset.metadata?.importance || 0,
          priority: calculatePriority(validation, asset)
        });
      }

      // Update quality metrics
      if (validation.completeness >= 80) {
        report.summary.highQuality++;
      } else if (validation.completeness >= 50) {
        report.summary.mediumQuality++;
      } else {
        report.summary.lowQuality++;
      }

      report.summary.totalScore += validation.actualScore;
      report.summary.maxPossibleScore += validation.maxScore;
    }

    // Collection summary
    const avgCompleteness = validations.length > 0
      ? Math.round(validations.reduce((sum, v) => sum + v.completeness, 0) / validations.length)
      : 0;

    report.collections[collectionName] = {
      count: result.count,
      validations: validations,
      averageCompleteness: avgCompleteness,
      incompleteCount: incompleteAssets.length,
      incompleteAssets: incompleteAssets
    };

    report.incompleteAssets.push(...incompleteAssets);
    report.totalAssets += result.count;

    console.log(`  Validated: ${result.count} assets (Avg: ${avgCompleteness}% complete)`);
  }

  // Calculate overall average
  report.summary.averageCompleteness = report.validatedAssets > 0
    ? Math.round((report.summary.totalScore / report.summary.maxPossibleScore) * 100)
    : 0;

  // Sort incomplete assets by priority
  report.incompleteAssets.sort((a, b) => b.priority - a.priority);

  return report;
}

/**
 * Calculate priority score for fixing an asset
 * Higher score = higher priority
 */
function calculatePriority(validation, asset) {
  let priority = 0;

  // Base priority on importance field
  const importance = asset.metadata?.importance || 50;
  priority += importance;

  // Add points for how incomplete it is
  const incompleteness = 100 - validation.completeness;
  priority += incompleteness * 0.5;

  // Add points for missing high-weight fields
  validation.missingFields.forEach(field => {
    priority += field.weight * 2;
  });

  // Boost priority for featured items
  if (asset.metadata?.featured) {
    priority += 20;
  }

  return Math.round(priority);
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate JSON report
 */
function generateJSONReport(report) {
  const reportPath = path.join(REPORTS_DIR, 'firebase-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nJSON report saved: ${reportPath}`);
  return reportPath;
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report) {
  const md = [];

  md.push('# Firebase Asset Validation Report');
  md.push('');
  md.push(`**Generated:** ${report.timestamp}`);
  md.push('');

  // Executive Summary
  md.push('## Executive Summary');
  md.push('');
  md.push(`- **Total Collections:** ${report.totalCollections}`);
  md.push(`- **Total Assets:** ${report.totalAssets}`);
  md.push(`- **Validated Assets:** ${report.validatedAssets}`);
  md.push(`- **Overall Completeness:** ${report.summary.averageCompleteness}%`);
  md.push('');
  md.push('### Quality Distribution');
  md.push('');
  md.push(`- **High Quality (≥80%):** ${report.summary.highQuality} assets`);
  md.push(`- **Medium Quality (50-79%):** ${report.summary.mediumQuality} assets`);
  md.push(`- **Low Quality (<50%):** ${report.summary.lowQuality} assets`);
  md.push('');

  // Collection Statistics
  md.push('## Collection Statistics');
  md.push('');
  md.push('| Collection | Assets | Avg Completeness | Incomplete |');
  md.push('|-----------|--------|------------------|------------|');

  Object.entries(report.collections).forEach(([name, data]) => {
    if (data.error) {
      md.push(`| ${name} | ERROR | - | - |`);
    } else {
      md.push(`| ${name} | ${data.count} | ${data.averageCompleteness}% | ${data.incompleteCount} |`);
    }
  });
  md.push('');

  // Top 20 Incomplete Assets
  md.push('## Top 20 Incomplete Assets (By Priority)');
  md.push('');
  md.push('These assets should be fixed first based on importance and incompleteness.');
  md.push('');
  md.push('| Priority | Collection | ID | Completeness | Missing Fields |');
  md.push('|----------|-----------|----|--------------|-----------------|');

  const top20 = report.incompleteAssets.slice(0, 20);
  top20.forEach(asset => {
    const missingCount = asset.missingFields.length;
    const topMissing = asset.missingFields
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(f => f.path)
      .join(', ');

    md.push(`| ${asset.priority} | ${asset.collection} | ${asset.id} | ${asset.completeness}% | ${missingCount} (${topMissing}) |`);
  });
  md.push('');

  // Recommended Actions
  md.push('## Recommended Fix Priority');
  md.push('');
  md.push('1. **High Priority** - Fix top 20 incomplete assets above');
  md.push('2. **Medium Priority** - Complete all assets below 50% completeness');
  md.push('3. **Low Priority** - Enhance assets between 50-79% completeness');
  md.push('4. **Polish** - Add optional fields to high-quality assets');
  md.push('');

  // Most Common Missing Fields
  md.push('## Most Common Missing Fields');
  md.push('');
  const missingFieldCounts = {};
  report.allValidations.forEach(v => {
    v.missingFields.forEach(f => {
      if (!missingFieldCounts[f.path]) {
        missingFieldCounts[f.path] = { count: 0, weight: f.weight };
      }
      missingFieldCounts[f.path].count++;
    });
  });

  const sortedMissing = Object.entries(missingFieldCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);

  md.push('| Field | Missing From | Weight |');
  md.push('|-------|--------------|--------|');
  sortedMissing.forEach(([field, data]) => {
    md.push(`| ${field} | ${data.count} assets | ${data.weight} |`);
  });
  md.push('');

  const reportPath = path.join(REPORTS_DIR, 'FIREBASE_VALIDATION_REPORT.md');
  fs.writeFileSync(reportPath, md.join('\n'));
  console.log(`Markdown report saved: ${reportPath}`);
  return reportPath;
}

/**
 * Generate backlog JSON file
 */
function generateBacklog(report) {
  const backlog = report.incompleteAssets.map(asset => ({
    id: asset.id,
    collection: asset.collection,
    completeness: asset.completeness,
    priority: asset.priority,
    missingFieldCount: asset.missingFields.length,
    topMissingFields: asset.missingFields
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(f => f.path)
  }));

  const backlogPath = path.join(REPORTS_DIR, 'firebase-incomplete-backlog.json');
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  console.log(`Backlog file saved: ${backlogPath}`);
  return backlogPath;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    const startTime = Date.now();

    // Validate all assets
    const report = await validateAllAssets();

    // Generate reports
    console.log('\n' + '='.repeat(80));
    console.log('GENERATING REPORTS');
    console.log('='.repeat(80));

    const jsonPath = generateJSONReport(report);
    const mdPath = generateMarkdownReport(report);
    const backlogPath = generateBacklog(report);

    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Duration: ${duration}s`);
    console.log(`Total Assets: ${report.totalAssets}`);
    console.log(`Overall Completeness: ${report.summary.averageCompleteness}%`);
    console.log('');
    console.log('Quality Breakdown:');
    console.log(`  High (≥80%): ${report.summary.highQuality}`);
    console.log(`  Medium (50-79%): ${report.summary.mediumQuality}`);
    console.log(`  Low (<50%): ${report.summary.lowQuality}`);
    console.log('');
    console.log('Output:');
    console.log(`  Assets: ${OUTPUT_DIR}/`);
    console.log(`  JSON Report: ${jsonPath}`);
    console.log(`  Markdown Report: ${mdPath}`);
    console.log(`  Backlog: ${backlogPath}`);
    console.log('='.repeat(80));
    console.log('');
    console.log('Next Steps:');
    console.log('1. Review FIREBASE_VALIDATION_REPORT.md for detailed analysis');
    console.log('2. Use firebase-incomplete-backlog.json to prioritize fixes');
    console.log('3. Check firebase-assets-validated-complete/ for individual assets');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('VALIDATION FAILED');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
