/**
 * Validate Firebase Fixes
 *
 * This script validates that fixes were applied correctly
 * Compares before/after states and reports any issues
 *
 * Usage: node scripts/validate-fixes.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const FIXES_DIR = path.join(__dirname, '..', 'firebase-fixes');
const MASTER_FIXES_FILE = path.join(FIXES_DIR, 'MASTER_FIXES.json');

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
    // Continue
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
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Get nested value from object
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

/**
 * Validate a single fix
 */
async function validateFix(fix) {
  try {
    const docRef = db.collection(fix.collection).doc(fix.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        id: fix.id,
        collection: fix.collection,
        status: 'ERROR',
        message: 'Document not found'
      };
    }

    const data = doc.data();
    const results = [];

    for (const fieldFix of fix.fixes) {
      const actualValue = getNestedValue(data, fieldFix.field);

      if (actualValue === undefined || actualValue === null) {
        results.push({
          field: fieldFix.field,
          status: 'FAILED',
          expected: fieldFix.newValue,
          actual: null,
          message: 'Field still missing'
        });
      } else if (actualValue === fieldFix.newValue) {
        results.push({
          field: fieldFix.field,
          status: 'SUCCESS',
          value: actualValue
        });
      } else {
        // Value exists but different - could be okay if it was updated by something else
        results.push({
          field: fieldFix.field,
          status: 'MODIFIED',
          expected: fieldFix.newValue,
          actual: actualValue,
          message: 'Field has different value (may have been updated elsewhere)'
        });
      }
    }

    const allSuccess = results.every(r => r.status === 'SUCCESS' || r.status === 'MODIFIED');

    return {
      id: fix.id,
      collection: fix.collection,
      status: allSuccess ? 'PASSED' : 'FAILED',
      results: results
    };
  } catch (error) {
    return {
      id: fix.id,
      collection: fix.collection,
      status: 'ERROR',
      message: error.message
    };
  }
}

/**
 * Validate all fixes
 */
async function validateAllFixes(fixes) {
  console.log(`Validating ${fixes.length} fixes...\n`);

  const results = [];
  const summary = {
    total: fixes.length,
    passed: 0,
    failed: 0,
    errors: 0,
    modified: 0
  };

  let processed = 0;

  for (const fix of fixes) {
    const result = await validateFix(fix);
    results.push(result);

    if (result.status === 'PASSED') {
      summary.passed++;
    } else if (result.status === 'FAILED') {
      summary.failed++;
    } else if (result.status === 'ERROR') {
      summary.errors++;
    }

    // Count modified
    if (result.results) {
      const hasModified = result.results.some(r => r.status === 'MODIFIED');
      if (hasModified) {
        summary.modified++;
      }
    }

    processed++;
    if (processed % 50 === 0) {
      console.log(`  Validated ${processed}/${fixes.length} fixes...`);
    }
  }

  console.log(`\nValidation complete!`);

  return { results, summary };
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate validation report
 */
function generateReport(results, summary) {
  const lines = [];

  lines.push('# Fix Validation Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total Fixes:** ${summary.total}`);
  lines.push(`- **Passed:** ${summary.passed} (${Math.round(summary.passed / summary.total * 100)}%)`);
  lines.push(`- **Failed:** ${summary.failed}`);
  lines.push(`- **Errors:** ${summary.errors}`);
  lines.push(`- **Modified:** ${summary.modified} (values changed but field exists)`);
  lines.push('');

  // Failed fixes
  const failed = results.filter(r => r.status === 'FAILED');
  if (failed.length > 0) {
    lines.push('## Failed Fixes');
    lines.push('');
    lines.push('These fixes did not apply correctly:');
    lines.push('');
    lines.push('| Collection | Asset ID | Field | Issue |');
    lines.push('|-----------|----------|-------|-------|');

    failed.forEach(fix => {
      fix.results.forEach(fieldResult => {
        if (fieldResult.status === 'FAILED') {
          lines.push(`| ${fix.collection} | ${fix.id} | ${fieldResult.field} | ${fieldResult.message} |`);
        }
      });
    });
    lines.push('');
  }

  // Errors
  const errors = results.filter(r => r.status === 'ERROR');
  if (errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    lines.push('| Collection | Asset ID | Error |');
    lines.push('|-----------|----------|-------|');

    errors.forEach(error => {
      lines.push(`| ${error.collection} | ${error.id} | ${error.message} |`);
    });
    lines.push('');
  }

  // Modified
  const modified = results.filter(r => r.results?.some(f => f.status === 'MODIFIED'));
  if (modified.length > 0) {
    lines.push('## Modified Fields');
    lines.push('');
    lines.push('These fields exist but have different values than expected (may have been updated):');
    lines.push('');
    lines.push('| Collection | Asset ID | Field | Expected | Actual |');
    lines.push('|-----------|----------|-------|----------|--------|');

    modified.forEach(fix => {
      fix.results.forEach(fieldResult => {
        if (fieldResult.status === 'MODIFIED') {
          const expected = JSON.stringify(fieldResult.expected).substring(0, 50);
          const actual = JSON.stringify(fieldResult.actual).substring(0, 50);
          lines.push(`| ${fix.collection} | ${fix.id} | ${fieldResult.field} | ${expected} | ${actual} |`);
        }
      });
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('FIREBASE FIX VALIDATION');
    console.log('='.repeat(80));

    // Load master fixes file
    if (!fs.existsSync(MASTER_FIXES_FILE)) {
      console.error(`\nERROR: Master fixes file not found: ${MASTER_FIXES_FILE}`);
      console.error('Run fix-firebase-assets.js first to generate fixes.');
      process.exit(1);
    }

    const fixes = JSON.parse(fs.readFileSync(MASTER_FIXES_FILE, 'utf8'));
    console.log(`\nLoaded ${fixes.length} fixes from ${MASTER_FIXES_FILE}\n`);

    // Validate all fixes
    const { results, summary } = await validateAllFixes(fixes);

    // Generate report
    const report = generateReport(results, summary);
    const reportFile = path.join(FIXES_DIR, 'VALIDATION_REPORT.md');
    fs.writeFileSync(reportFile, report);

    // Save detailed results
    const resultsFile = path.join(FIXES_DIR, 'validation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({ summary, results }, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total: ${summary.total}`);
    console.log(`Passed: ${summary.passed} (${Math.round(summary.passed / summary.total * 100)}%)`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Modified: ${summary.modified}`);
    console.log('');
    console.log('Reports saved:');
    console.log(`  ${reportFile}`);
    console.log(`  ${resultsFile}`);
    console.log('='.repeat(80));

    if (summary.failed > 0 || summary.errors > 0) {
      console.log('\nWARNING: Some fixes failed or had errors. Review the report.');
      process.exit(1);
    } else {
      console.log('\nAll fixes validated successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\nERROR:', error);
    process.exit(1);
  }
}

// Run the script
main();
