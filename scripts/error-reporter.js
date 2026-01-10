/**
 * Error Reporter for Eyes of Azrael
 *
 * Logs validation errors to Firebase for tracking user submission issues.
 * Tracks unique error types with counts and timestamps.
 *
 * Usage:
 *   node error-reporter.js --report <error-file>    Report errors to Firebase
 *   node error-reporter.js --pull                   Pull error reports from Firebase
 *   node error-reporter.js --summary                Show error summary
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class ErrorReporter {
  constructor(options = {}) {
    this.reportsDir = options.reportsDir || path.join(__dirname, 'reports');
    this.errorsFile = path.join(this.reportsDir, 'user-errors.json');
    this.localErrors = { errors: [], summary: {} };

    // Firebase admin would be initialized here
    this.useFirebase = options.useFirebase || false;
    this.db = null;
  }

  async initFirebase() {
    if (!this.useFirebase) return;

    try {
      const admin = require('firebase-admin');
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

      if (!fsSync.existsSync(serviceAccountPath)) {
        console.log('Firebase service account not found, using local storage');
        this.useFirebase = false;
        return;
      }

      if (!admin.apps.length) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      this.db = admin.firestore();
      console.log('Firebase initialized for error reporting');
    } catch (error) {
      console.log('Firebase init failed, using local storage:', error.message);
      this.useFirebase = false;
    }
  }

  async loadLocalErrors() {
    try {
      const content = await fs.readFile(this.errorsFile, 'utf8');
      this.localErrors = JSON.parse(content);
    } catch {
      this.localErrors = { errors: [], summary: {} };
    }
  }

  async saveLocalErrors() {
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.writeFile(this.errorsFile, JSON.stringify(this.localErrors, null, 2));
  }

  generateErrorKey(error) {
    // Generate unique key based on error type and field
    const type = error.type || 'UNKNOWN';
    const field = error.field || '';
    const message = error.message || '';

    // Create a hash-like key
    const key = `${type}:${field}:${message.substring(0, 50)}`.replace(/[^a-zA-Z0-9:_-]/g, '_');
    return key;
  }

  async reportError(error, context = {}) {
    const errorEntry = {
      key: this.generateErrorKey(error),
      type: error.type || 'UNKNOWN',
      severity: error.severity || 'error',
      field: error.field || null,
      message: error.message || 'Unknown error',
      assetId: error.assetId || context.assetId || null,
      assetType: error.assetType || context.assetType || null,
      mythology: error.mythology || context.mythology || null,
      timestamp: new Date().toISOString(),
      source: context.source || 'validation-script',
      userAgent: context.userAgent || null
    };

    if (this.useFirebase && this.db) {
      await this.reportToFirebase(errorEntry);
    }

    await this.reportToLocal(errorEntry);
  }

  async reportToFirebase(errorEntry) {
    try {
      const errorsRef = this.db.collection('validation_errors');

      // Check if this error type already exists
      const existingQuery = await errorsRef
        .where('key', '==', errorEntry.key)
        .limit(1)
        .get();

      if (existingQuery.empty) {
        // New error type
        await errorsRef.add({
          ...errorEntry,
          count: 1,
          firstSeen: errorEntry.timestamp,
          lastSeen: errorEntry.timestamp,
          examples: [errorEntry.assetId].filter(Boolean)
        });
      } else {
        // Update existing error
        const doc = existingQuery.docs[0];
        const data = doc.data();
        const examples = data.examples || [];

        if (errorEntry.assetId && !examples.includes(errorEntry.assetId)) {
          examples.push(errorEntry.assetId);
        }

        await doc.ref.update({
          count: (data.count || 0) + 1,
          lastSeen: errorEntry.timestamp,
          examples: examples.slice(-10) // Keep last 10 examples
        });
      }
    } catch (error) {
      console.error('Firebase error reporting failed:', error.message);
    }
  }

  async reportToLocal(errorEntry) {
    await this.loadLocalErrors();

    // Update summary
    if (!this.localErrors.summary[errorEntry.key]) {
      this.localErrors.summary[errorEntry.key] = {
        type: errorEntry.type,
        field: errorEntry.field,
        message: errorEntry.message,
        count: 0,
        firstSeen: errorEntry.timestamp,
        lastSeen: errorEntry.timestamp,
        examples: []
      };
    }

    const summary = this.localErrors.summary[errorEntry.key];
    summary.count++;
    summary.lastSeen = errorEntry.timestamp;

    if (errorEntry.assetId && !summary.examples.includes(errorEntry.assetId)) {
      summary.examples.push(errorEntry.assetId);
      if (summary.examples.length > 10) {
        summary.examples = summary.examples.slice(-10);
      }
    }

    // Add to detailed log (keep last 1000)
    this.localErrors.errors.push(errorEntry);
    if (this.localErrors.errors.length > 1000) {
      this.localErrors.errors = this.localErrors.errors.slice(-1000);
    }

    await this.saveLocalErrors();
  }

  async reportBatch(errors, context = {}) {
    console.log(`Reporting ${errors.length} errors...`);

    for (const error of errors) {
      await this.reportError(error, context);
    }

    console.log('Batch reporting complete');
  }

  async pullFromFirebase() {
    if (!this.useFirebase || !this.db) {
      console.log('Firebase not available, using local errors only');
      return this.localErrors;
    }

    try {
      const errorsRef = this.db.collection('validation_errors');
      const snapshot = await errorsRef.orderBy('lastSeen', 'desc').limit(100).get();

      const firebaseErrors = {
        pulledAt: new Date().toISOString(),
        errors: []
      };

      snapshot.forEach(doc => {
        firebaseErrors.errors.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Save pulled errors locally
      await fs.writeFile(
        path.join(this.reportsDir, 'firebase-errors.json'),
        JSON.stringify(firebaseErrors, null, 2)
      );

      console.log(`Pulled ${firebaseErrors.errors.length} error types from Firebase`);
      return firebaseErrors;
    } catch (error) {
      console.error('Failed to pull from Firebase:', error.message);
      return null;
    }
  }

  async getSummary() {
    await this.loadLocalErrors();

    const summary = {
      totalErrors: this.localErrors.errors.length,
      uniqueErrorTypes: Object.keys(this.localErrors.summary).length,
      byType: {},
      bySeverity: {},
      topErrors: []
    };

    // Count by type
    for (const [key, data] of Object.entries(this.localErrors.summary)) {
      const type = data.type || 'UNKNOWN';
      summary.byType[type] = (summary.byType[type] || 0) + data.count;

      const severity = data.severity || 'error';
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + data.count;
    }

    // Get top errors
    summary.topErrors = Object.entries(this.localErrors.summary)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return summary;
  }

  printSummary(summary) {
    console.log('\n' + '='.repeat(60));
    console.log('ERROR SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total errors logged: ${summary.totalErrors}`);
    console.log(`Unique error types: ${summary.uniqueErrorTypes}`);

    console.log('\nBy Type:');
    for (const [type, count] of Object.entries(summary.byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }

    console.log('\nBy Severity:');
    for (const [severity, count] of Object.entries(summary.bySeverity)) {
      console.log(`  ${severity}: ${count}`);
    }

    if (summary.topErrors.length > 0) {
      console.log('\nTop Errors:');
      for (const error of summary.topErrors.slice(0, 10)) {
        console.log(`  [${error.count}x] ${error.type}: ${error.message.substring(0, 50)}`);
      }
    }
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const reporter = new ErrorReporter();

  if (args.includes('--pull')) {
    await reporter.initFirebase();
    await reporter.pullFromFirebase();
  } else if (args.includes('--summary')) {
    const summary = await reporter.getSummary();
    reporter.printSummary(summary);
  } else if (args.includes('--report')) {
    const fileIndex = args.indexOf('--report') + 1;
    if (args[fileIndex]) {
      const errorFile = args[fileIndex];
      const errors = JSON.parse(fsSync.readFileSync(errorFile, 'utf8'));
      await reporter.initFirebase();
      await reporter.reportBatch(errors.errors || errors, { source: 'file-import' });
    } else {
      console.log('Usage: node error-reporter.js --report <error-file.json>');
    }
  } else {
    console.log('Error Reporter for Eyes of Azrael');
    console.log('==================================');
    console.log('Usage:');
    console.log('  --report <file>  Report errors from file');
    console.log('  --pull           Pull errors from Firebase');
    console.log('  --summary        Show error summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ErrorReporter };
