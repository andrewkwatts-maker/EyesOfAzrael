#!/usr/bin/env node

/**
 * Verify Firebase Upload Script
 * Eyes of Azrael - Phase 3.2
 *
 * Comprehensive verification of uploaded Firestore documents.
 * Checks for data integrity, field completeness, and query functionality.
 *
 * Features:
 * - Document existence verification
 * - Field count validation
 * - Special character preservation check
 * - Search term validation
 * - Collection statistics
 * - Query testing
 * - Data quality report
 *
 * Usage:
 *   node scripts/verify-firebase-upload.js --collection deities
 *   node scripts/verify-firebase-upload.js --all
 *   node scripts/verify-firebase-upload.js --sample 10
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const COLLECTIONS = [
  'deities',
  'heroes',
  'creatures',
  'places',
  'items',
  'texts',
  'concepts',
  'rituals',
  'events',
  'myths',
  'cosmology',
  'symbols'
];

const REQUIRED_FIELDS = [
  'id',
  'name',
  'type',
  'mythology',
  'status',
  'createdAt',
  'updatedAt'
];

const RECOMMENDED_FIELDS = [
  'summary',
  'description',
  'searchTerms',
  'panels'
];

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let db;

function initializeFirebase() {
  try {
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ firebase-service-account.json not found!');
      process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Get collection statistics
 */
async function getCollectionStats(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    const docs = snapshot.docs;

    const stats = {
      name: collectionName,
      count: docs.length,
      mythologies: new Set(),
      types: new Set(),
      hasDescription: 0,
      hasSearchTerms: 0,
      hasPanels: 0,
      avgSearchTerms: 0,
      avgPanels: 0,
      issues: []
    };

    let totalSearchTerms = 0;
    let totalPanels = 0;

    for (const doc of docs) {
      const data = doc.data();

      // Count mythologies and types
      if (data.mythology) stats.mythologies.add(data.mythology);
      if (data.type) stats.types.add(data.type);

      // Count field presence
      if (data.description) stats.hasDescription++;
      if (data.searchTerms && data.searchTerms.length > 0) {
        stats.hasSearchTerms++;
        totalSearchTerms += data.searchTerms.length;
      }
      if (data.panels && data.panels.length > 0) {
        stats.hasPanels++;
        totalPanels += data.panels.length;
      }

      // Check for issues
      if (!data.id || !data.name) {
        stats.issues.push(`Missing id or name: ${doc.id}`);
      }
      if (!data.searchTerms || data.searchTerms.length === 0) {
        stats.issues.push(`No search terms: ${doc.id}`);
      }
    }

    // Calculate averages
    if (stats.hasSearchTerms > 0) {
      stats.avgSearchTerms = (totalSearchTerms / stats.hasSearchTerms).toFixed(1);
    }
    if (stats.hasPanels > 0) {
      stats.avgPanels = (totalPanels / stats.hasPanels).toFixed(1);
    }

    // Convert Sets to Arrays
    stats.mythologies = Array.from(stats.mythologies);
    stats.types = Array.from(stats.types);

    return stats;
  } catch (error) {
    return {
      name: collectionName,
      count: 0,
      error: error.message
    };
  }
}

/**
 * Verify document structure
 */
function verifyDocumentStructure(doc) {
  const data = doc.data();
  const issues = [];
  const warnings = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      warnings.push(`Missing or empty recommended field: ${field}`);
    }
  }

  // Check data types
  if (data.searchTerms && !Array.isArray(data.searchTerms)) {
    issues.push('searchTerms should be an array');
  }

  if (data.panels && !Array.isArray(data.panels)) {
    issues.push('panels should be an array');
  }

  // Check for special characters preservation
  if (data.name && data.name.includes('&amp;')) {
    warnings.push('Name contains HTML entity &amp; (should be &)');
  }

  return { issues, warnings };
}

/**
 * Verify special characters in document
 */
function verifySpecialCharacters(data) {
  const issues = [];
  const fieldsToCheck = ['name', 'summary', 'description'];

  for (const field of fieldsToCheck) {
    if (!data[field]) continue;

    const text = String(data[field]);

    // Check for common HTML entity issues
    if (text.includes('&amp;')) issues.push(`${field}: Contains &amp;`);
    if (text.includes('&lt;')) issues.push(`${field}: Contains &lt;`);
    if (text.includes('&gt;')) issues.push(`${field}: Contains &gt;`);
    if (text.includes('&quot;')) issues.push(`${field}: Contains &quot;`);

    // Check for double encoding
    if (text.includes('&amp;amp;')) issues.push(`${field}: Double encoded entity`);
  }

  return issues;
}

/**
 * Test query functionality
 */
async function testQueries(collectionName) {
  console.log(`\n   Testing queries on ${collectionName}...`);

  const tests = [];

  try {
    // Test 1: Simple query by mythology
    const greekQuery = await db.collection(collectionName)
      .where('mythology', '==', 'greek')
      .limit(5)
      .get();

    tests.push({
      name: 'Query by mythology',
      success: true,
      count: greekQuery.size
    });

    // Test 2: Query by type
    const typeQuery = await db.collection(collectionName)
      .where('status', '==', 'published')
      .limit(5)
      .get();

    tests.push({
      name: 'Query by status',
      success: true,
      count: typeQuery.size
    });

    // Test 3: Order by createdAt
    const orderedQuery = await db.collection(collectionName)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    tests.push({
      name: 'Order by createdAt',
      success: true,
      count: orderedQuery.size
    });

  } catch (error) {
    tests.push({
      name: 'Query test',
      success: false,
      error: error.message
    });
  }

  return tests;
}

/**
 * Verify sample documents
 */
async function verifySampleDocuments(collectionName, sampleSize = 10) {
  console.log(`\n   Verifying ${sampleSize} sample documents from ${collectionName}...`);

  const snapshot = await db.collection(collectionName).limit(sampleSize).get();
  const results = {
    checked: snapshot.size,
    passed: 0,
    issues: [],
    warnings: []
  };

  for (const doc of snapshot.docs) {
    const { issues, warnings } = verifyDocumentStructure(doc);
    const charIssues = verifySpecialCharacters(doc.data());

    if (issues.length === 0 && charIssues.length === 0) {
      results.passed++;
    }

    if (issues.length > 0) {
      results.issues.push({
        docId: doc.id,
        issues: [...issues, ...charIssues]
      });
    }

    if (warnings.length > 0) {
      results.warnings.push({
        docId: doc.id,
        warnings: warnings
      });
    }
  }

  return results;
}

/**
 * Generate verification report
 */
function generateReport(collectionStats, verificationResults, queryTests) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalCollections: collectionStats.length,
      totalDocuments: collectionStats.reduce((sum, c) => sum + c.count, 0),
      collectionsWithIssues: collectionStats.filter(c => c.issues && c.issues.length > 0).length
    },
    collections: collectionStats,
    verifications: verificationResults,
    queryTests: queryTests
  };

  return report;
}

/**
 * Print collection statistics
 */
function printCollectionStats(stats) {
  console.log(`\n📊 ${stats.name}`);
  console.log('   ' + '-'.repeat(60));

  if (stats.error) {
    console.log(`   ❌ Error: ${stats.error}`);
    return;
  }

  console.log(`   Documents: ${stats.count}`);

  if (stats.count === 0) {
    console.log('   ⚠️  Collection is empty');
    return;
  }

  console.log(`   Mythologies: ${stats.mythologies.length} (${stats.mythologies.slice(0, 5).join(', ')}${stats.mythologies.length > 5 ? '...' : ''})`);
  console.log(`   Types: ${stats.types.length} (${stats.types.join(', ')})`);

  console.log(`\n   Field Coverage:`);
  console.log(`     - Description: ${stats.hasDescription}/${stats.count} (${Math.round(stats.hasDescription / stats.count * 100)}%)`);
  console.log(`     - Search Terms: ${stats.hasSearchTerms}/${stats.count} (${Math.round(stats.hasSearchTerms / stats.count * 100)}%) avg: ${stats.avgSearchTerms}`);
  console.log(`     - Panels: ${stats.hasPanels}/${stats.count} (${Math.round(stats.hasPanels / stats.count * 100)}%) avg: ${stats.avgPanels}`);

  if (stats.issues && stats.issues.length > 0) {
    console.log(`\n   ⚠️  Issues (${stats.issues.length}):`);
    stats.issues.slice(0, 5).forEach(issue => {
      console.log(`      - ${issue}`);
    });
    if (stats.issues.length > 5) {
      console.log(`      ... and ${stats.issues.length - 5} more`);
    }
  } else {
    console.log(`\n   ✅ No issues found`);
  }
}

/**
 * Print verification results
 */
function printVerificationResults(results) {
  console.log(`\n   Checked: ${results.checked} documents`);
  console.log(`   Passed: ${results.passed}/${results.checked} (${Math.round(results.passed / results.checked * 100)}%)`);

  if (results.issues.length > 0) {
    console.log(`\n   ❌ Issues found in ${results.issues.length} documents:`);
    results.issues.slice(0, 3).forEach(item => {
      console.log(`      ${item.docId}:`);
      item.issues.forEach(issue => console.log(`         - ${issue}`));
    });
    if (results.issues.length > 3) {
      console.log(`      ... and ${results.issues.length - 3} more`);
    }
  }

  if (results.warnings.length > 0) {
    console.log(`\n   ⚠️  Warnings in ${results.warnings.length} documents (showing first 3):`);
    results.warnings.slice(0, 3).forEach(item => {
      console.log(`      ${item.docId}: ${item.warnings.length} warnings`);
    });
  }
}

/**
 * Print query test results
 */
function printQueryResults(tests) {
  const passed = tests.filter(t => t.success).length;
  const total = tests.length;

  console.log(`\n   Query Tests: ${passed}/${total} passed`);

  tests.forEach(test => {
    if (test.success) {
      console.log(`      ✅ ${test.name}: ${test.count} results`);
    } else {
      console.log(`      ❌ ${test.name}: ${test.error}`);
    }
  });
}

// ============================================================================
// MAIN VERIFICATION FUNCTION
// ============================================================================

/**
 * Main verification orchestrator
 */
async function verifyFirebaseUpload(options = {}) {
  const {
    collection = null,
    all = false,
    sample = 10,
    saveReport = true
  } = options;

  console.log('🔍 Firebase Upload Verification');
  console.log('='.repeat(80));

  const collectionsToVerify = all ? COLLECTIONS :
                             collection ? [collection] :
                             COLLECTIONS;

  console.log(`Verifying ${collectionsToVerify.length} collection(s)...\n`);

  const collectionStats = [];
  const verificationResults = {};
  const queryTests = {};

  // Verify each collection
  for (const collectionName of collectionsToVerify) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📁 Collection: ${collectionName}`);
    console.log('='.repeat(80));

    // Get statistics
    const stats = await getCollectionStats(collectionName);
    collectionStats.push(stats);
    printCollectionStats(stats);

    // Skip detailed verification if collection is empty
    if (stats.count === 0) continue;

    // Verify sample documents
    const verification = await verifySampleDocuments(collectionName, sample);
    verificationResults[collectionName] = verification;
    printVerificationResults(verification);

    // Test queries
    const queries = await testQueries(collectionName);
    queryTests[collectionName] = queries;
    printQueryResults(queries);
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 Verification Summary');
  console.log('='.repeat(80));

  const totalDocs = collectionStats.reduce((sum, c) => sum + c.count, 0);
  const collectionsWithData = collectionStats.filter(c => c.count > 0).length;
  const collectionsWithIssues = collectionStats.filter(c => c.issues && c.issues.length > 0).length;

  console.log(`\nCollections: ${collectionsWithData}/${collectionStats.length} have data`);
  console.log(`Total Documents: ${totalDocs}`);
  console.log(`Issues: ${collectionsWithIssues} collections have issues`);

  // Top collections by size
  console.log(`\nTop Collections:`);
  collectionStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .forEach(c => {
      console.log(`   ${c.name.padEnd(20)} ${c.count.toString().padStart(4)} documents`);
    });

  // Mythology distribution
  const allMythologies = new Set();
  collectionStats.forEach(c => {
    if (c.mythologies) {
      c.mythologies.forEach(m => allMythologies.add(m));
    }
  });

  console.log(`\nMythologies: ${allMythologies.size} total`);
  console.log(`   ${Array.from(allMythologies).sort().join(', ')}`);

  // Save report
  if (saveReport) {
    const report = generateReport(collectionStats, verificationResults, queryTests);
    const reportPath = path.join(__dirname, '../firebase-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Verification report saved: ${reportPath}`);
  }

  console.log('\n');

  return {
    totalDocs,
    collectionsWithData,
    collectionsWithIssues,
    stats: collectionStats
  };
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    collection: null,
    all: false,
    sample: 10,
    saveReport: true,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--collection' && args[i + 1]) {
      options.collection = args[++i];
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--sample' && args[i + 1]) {
      options.sample = parseInt(args[++i]);
    } else if (arg === '--no-report') {
      options.saveReport = false;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

/**
 * Display help text
 */
function displayHelp() {
  console.log(`
Firebase Upload Verification Script
${'='.repeat(80)}

Verify uploaded Firestore documents for integrity and completeness.

Usage:
  node scripts/verify-firebase-upload.js [options]

Options:
  --collection <name>   Verify specific collection (e.g., deities, heroes)
  --all                 Verify all collections (default)
  --sample <num>        Number of documents to sample per collection (default: 10)
  --no-report           Skip saving JSON report
  --help, -h            Show this help message

Examples:
  # Verify all collections
  node scripts/verify-firebase-upload.js --all

  # Verify specific collection
  node scripts/verify-firebase-upload.js --collection deities

  # Verify with larger sample size
  node scripts/verify-firebase-upload.js --all --sample 50

Collections:
  ${COLLECTIONS.join(', ')}

Verification Checks:
  - Document existence and count
  - Required field presence
  - Field completeness
  - Special character preservation
  - Search term generation
  - Query functionality
  - Data type validation
`);
}

/**
 * Main entry point
 */
async function main() {
  const options = parseArguments();

  if (options.help) {
    displayHelp();
    process.exit(0);
  }

  initializeFirebase();

  try {
    await verifyFirebaseUpload(options);
    console.log('✅ Verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  verifyFirebaseUpload,
  getCollectionStats,
  verifyDocumentStructure
};
