#!/usr/bin/env node

/**
 * Validate Firebase Metadata
 *
 * Validates metadata enrichment across all collections:
 * - Check presence of required metadata fields
 * - Validate data types and ranges
 * - Generate coverage report
 * - Identify issues
 *
 * Usage:
 *   node scripts/validate-firebase-metadata.js [--collection=name]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const COLLECTION_FILTER = args.find(a => a.startsWith('--collection='))?.split('=')[1];

console.log('Firebase Metadata Validation');
if (COLLECTION_FILTER) {
  console.log('Filter:', `Only validating: ${COLLECTION_FILTER}`);
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
// VALIDATION RULES
// ============================================================================

const REQUIRED_FIELDS = [
  'createdAt',
  'updatedAt',
  'importance',
  'tags',
  'search_text',
  'display_order',
  'featured',
  'completeness_score'
];

const FIELD_TYPES = {
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  importance: 'number',
  tags: 'array',
  search_text: 'string',
  display_order: 'string',
  featured: 'boolean',
  completeness_score: 'number'
};

const FIELD_RANGES = {
  importance: { min: 0, max: 100 },
  completeness_score: { min: 0, max: 100 }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate single asset
 */
function validateAsset(asset, assetId) {
  const issues = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!asset.hasOwnProperty(field)) {
      issues.push({
        field,
        issue: 'missing',
        severity: 'error'
      });
    }
  });

  // Check field types
  Object.entries(FIELD_TYPES).forEach(([field, expectedType]) => {
    if (!asset.hasOwnProperty(field)) return;

    const value = asset[field];
    let actualType = typeof value;

    if (expectedType === 'timestamp') {
      if (!(value && typeof value.toDate === 'function')) {
        issues.push({
          field,
          issue: 'invalid_type',
          expected: 'timestamp',
          actual: actualType,
          severity: 'error'
        });
      }
    } else if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        issues.push({
          field,
          issue: 'invalid_type',
          expected: 'array',
          actual: actualType,
          severity: 'error'
        });
      }
    } else if (actualType !== expectedType) {
      issues.push({
        field,
        issue: 'invalid_type',
        expected: expectedType,
        actual: actualType,
        severity: 'error'
      });
    }
  });

  // Check ranges
  Object.entries(FIELD_RANGES).forEach(([field, range]) => {
    if (!asset.hasOwnProperty(field)) return;

    const value = asset[field];
    if (typeof value !== 'number') return;

    if (value < range.min || value > range.max) {
      issues.push({
        field,
        issue: 'out_of_range',
        value,
        min: range.min,
        max: range.max,
        severity: 'warning'
      });
    }
  });

  // Check tags
  if (asset.tags) {
    if (asset.tags.length === 0) {
      issues.push({
        field: 'tags',
        issue: 'empty_array',
        severity: 'warning'
      });
    }
    if (asset.tags.length > 30) {
      issues.push({
        field: 'tags',
        issue: 'too_many_tags',
        count: asset.tags.length,
        severity: 'info'
      });
    }
  }

  // Check search_text
  if (asset.search_text) {
    if (asset.search_text.length === 0) {
      issues.push({
        field: 'search_text',
        issue: 'empty_string',
        severity: 'error'
      });
    }
    if (asset.search_text.length < 10) {
      issues.push({
        field: 'search_text',
        issue: 'too_short',
        length: asset.search_text.length,
        severity: 'warning'
      });
    }
  }

  // Check display_order
  if (asset.display_order) {
    if (asset.display_order.length === 0) {
      issues.push({
        field: 'display_order',
        issue: 'empty_string',
        severity: 'error'
      });
    }
  }

  return issues;
}

/**
 * Calculate coverage statistics
 */
function calculateCoverage(assets) {
  const stats = {
    total: assets.length,
    coverage: {},
    issues: {
      error: 0,
      warning: 0,
      info: 0
    },
    distributions: {
      importance: {},
      completeness: {},
      featured: { true: 0, false: 0 },
      tagCounts: {}
    }
  };

  // Initialize coverage
  REQUIRED_FIELDS.forEach(field => {
    stats.coverage[field] = {
      present: 0,
      missing: 0,
      percentage: 0
    };
  });

  // Process each asset
  assets.forEach(asset => {
    // Coverage
    REQUIRED_FIELDS.forEach(field => {
      if (asset.data.hasOwnProperty(field)) {
        stats.coverage[field].present++;
      } else {
        stats.coverage[field].missing++;
      }
    });

    // Distributions
    if (typeof asset.data.importance === 'number') {
      const bucket = Math.floor(asset.data.importance / 10) * 10;
      stats.distributions.importance[bucket] = (stats.distributions.importance[bucket] || 0) + 1;
    }

    if (typeof asset.data.completeness_score === 'number') {
      const bucket = Math.floor(asset.data.completeness_score / 10) * 10;
      stats.distributions.completeness[bucket] = (stats.distributions.completeness[bucket] || 0) + 1;
    }

    if (typeof asset.data.featured === 'boolean') {
      stats.distributions.featured[asset.data.featured]++;
    }

    if (Array.isArray(asset.data.tags)) {
      const count = asset.data.tags.length;
      const bucket = count === 0 ? 0 : Math.min(Math.ceil(count / 5) * 5, 30);
      stats.distributions.tagCounts[bucket] = (stats.distributions.tagCounts[bucket] || 0) + 1;
    }

    // Count issues
    if (asset.issues) {
      asset.issues.forEach(issue => {
        stats.issues[issue.severity]++;
      });
    }
  });

  // Calculate percentages
  Object.keys(stats.coverage).forEach(field => {
    const coverage = stats.coverage[field];
    coverage.percentage = Math.round((coverage.present / stats.total) * 100);
  });

  return stats;
}

// ============================================================================
// PROCESSING
// ============================================================================

/**
 * Validate a single collection
 */
async function validateCollection(collectionName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Validating: ${collectionName}`);
  console.log('='.repeat(80));

  try {
    const snapshot = await db.collection(collectionName).get();
    const assets = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const issues = validateAsset(data, doc.id);

      assets.push({
        id: doc.id,
        data: data,
        issues: issues
      });
    });

    console.log(`Found ${assets.length} documents`);

    // Calculate statistics
    const stats = calculateCoverage(assets);

    // Display coverage
    console.log('\nMetadata Coverage:');
    Object.entries(stats.coverage).forEach(([field, coverage]) => {
      const status = coverage.percentage === 100 ? '✓' : coverage.percentage >= 90 ? '⚠' : '✗';
      console.log(`  ${status} ${field.padEnd(22)} ${coverage.percentage}% (${coverage.present}/${stats.total})`);
    });

    // Display issues
    console.log('\nIssues:');
    console.log(`  Errors:   ${stats.issues.error}`);
    console.log(`  Warnings: ${stats.issues.warning}`);
    console.log(`  Info:     ${stats.issues.info}`);

    // Display distributions
    console.log('\nImportance Distribution:');
    const importanceBuckets = Object.keys(stats.distributions.importance)
      .map(Number)
      .sort((a, b) => a - b);
    importanceBuckets.forEach(bucket => {
      const count = stats.distributions.importance[bucket];
      const percentage = Math.round((count / stats.total) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`  ${bucket}-${bucket + 9}: ${bar} ${count} (${percentage}%)`);
    });

    console.log('\nCompleteness Distribution:');
    const completenessBuckets = Object.keys(stats.distributions.completeness)
      .map(Number)
      .sort((a, b) => a - b);
    completenessBuckets.forEach(bucket => {
      const count = stats.distributions.completeness[bucket];
      const percentage = Math.round((count / stats.total) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      console.log(`  ${bucket}-${bucket + 9}: ${bar} ${count} (${percentage}%)`);
    });

    const featuredCount = stats.distributions.featured.true || 0;
    const featuredPct = Math.round((featuredCount / stats.total) * 100);
    console.log(`\nFeatured: ${featuredCount}/${stats.total} (${featuredPct}%)`);

    // Assets with issues
    const assetsWithIssues = assets.filter(a => a.issues.length > 0);
    if (assetsWithIssues.length > 0 && assetsWithIssues.length <= 10) {
      console.log('\nAssets with Issues:');
      assetsWithIssues.forEach(asset => {
        console.log(`  ${asset.id}:`);
        asset.issues.forEach(issue => {
          console.log(`    [${issue.severity}] ${issue.field}: ${issue.issue}`);
        });
      });
    } else if (assetsWithIssues.length > 10) {
      console.log(`\n${assetsWithIssues.length} assets have issues (showing first 10):`);
      assetsWithIssues.slice(0, 10).forEach(asset => {
        console.log(`  ${asset.id}: ${asset.issues.length} issues`);
      });
    }

    return {
      collection: collectionName,
      stats,
      assets: assets.map(a => ({
        id: a.id,
        issues: a.issues
      })),
      success: true
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
  console.log('FIREBASE METADATA VALIDATION');
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

  console.log(`Validating ${collectionNames.length} collections...\n`);

  const results = [];

  for (const collectionName of collectionNames) {
    const result = await validateCollection(collectionName);
    results.push(result);
  }

  // Overall summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalAssets = results.reduce((sum, r) => sum + (r.stats?.total || 0), 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.stats?.issues.error || 0), 0);
  const totalWarnings = results.reduce((sum, r) => sum + (r.stats?.issues.warning || 0), 0);

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Duration: ${duration}s`);
  console.log(`Total Assets: ${totalAssets}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log('');

  console.log('Collection Coverage:');
  results.forEach(r => {
    if (r.success && r.stats) {
      const avgCoverage = Math.round(
        Object.values(r.stats.coverage).reduce((sum, c) => sum + c.percentage, 0) /
        Object.keys(r.stats.coverage).length
      );
      const status = avgCoverage === 100 ? '✓' : avgCoverage >= 90 ? '⚠' : '✗';
      console.log(`  ${status} ${r.collection.padEnd(20)} ${avgCoverage}% coverage, ` +
        `${r.stats.issues.error} errors, ${r.stats.issues.warning} warnings`);
    } else if (!r.success) {
      console.log(`  ✗ ${r.collection.padEnd(20)} ERROR: ${r.error}`);
    }
  });

  console.log('='.repeat(80));

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('\n✓ All metadata valid!');
  } else {
    console.log(`\n⚠ Found ${totalErrors} errors and ${totalWarnings} warnings`);
    console.log('Run enrichment script to fix issues:');
    console.log('  node scripts/enrich-firebase-metadata.js');
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'FIREBASE_METADATA_VALIDATION_REPORT.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      duration,
      totalAssets,
      totalErrors,
      totalWarnings
    },
    collections: results
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nValidation report saved: ${reportPath}\n`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
