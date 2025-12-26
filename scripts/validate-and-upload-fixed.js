/**
 * Validate and Upload Fixed Assets Script
 *
 * This script validates fixed assets and uploads them to Firebase:
 * 1. Validates all JSON files for schema compliance
 * 2. Checks for required fields
 * 3. Uploads valid files to Firebase Firestore
 * 4. Generates comprehensive report
 */

const fs = require('fs').promises;
const path = require('path');
const admin = require('firebase-admin');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Required fields for validation
const REQUIRED_FIELDS = {
  common: ['id', 'name', 'mythology', 'type', '_version'],
  display: ['icon', 'subtitle', 'searchTerms', 'sortName'],
  metrics: ['importance', 'popularity']
};

// Statistics tracker
const stats = {
  totalFiles: 0,
  validated: 0,
  invalid: 0,
  uploaded: 0,
  uploadFailed: 0,
  validationErrors: {},
  uploadErrors: []
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log(`${colors.green}Firebase already initialized${colors.reset}`);
      return admin.firestore();
    }

    // Try to get service account from environment or default location
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                               path.join(process.cwd(), 'FIREBASE', 'firebase-service-account.json');

    console.log(`${colors.cyan}Initializing Firebase...${colors.reset}`);
    console.log(`${colors.yellow}Service Account:${colors.reset} ${serviceAccountPath}`);

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log(`${colors.green}Firebase initialized successfully${colors.reset}\n`);
    return admin.firestore();

  } catch (error) {
    console.error(`${colors.red}Failed to initialize Firebase: ${error.message}${colors.reset}`);
    console.error(`${colors.yellow}Please ensure GOOGLE_APPLICATION_CREDENTIALS is set or firebase-service-account.json exists${colors.reset}\n`);
    throw error;
  }
}

/**
 * Validate entity against schema
 */
function validateEntity(entity, filePath) {
  const errors = [];
  const warnings = [];

  // Check required common fields
  for (const field of REQUIRED_FIELDS.common) {
    if (!entity[field]) {
      errors.push(`Missing required field: ${field}`);
    } else if (field === 'mythology' && entity[field] === 'unknown') {
      errors.push(`Mythology is still "unknown"`);
    } else if (field === '_version' && entity[field] !== '2.0') {
      errors.push(`Version is "${entity[field]}", expected "2.0"`);
    }
  }

  // Check display fields
  for (const field of REQUIRED_FIELDS.display) {
    if (!entity[field]) {
      warnings.push(`Missing display field: ${field}`);
    }
  }

  // Check metrics
  for (const field of REQUIRED_FIELDS.metrics) {
    if (!entity[field] || entity[field] === 0) {
      warnings.push(`Missing or zero metric: ${field}`);
    }
  }

  // Check for invalid values
  if (entity.description && entity.description.includes('unknown')) {
    warnings.push('Description contains "unknown"');
  }

  if (entity.domains && entity.domains.includes('unknown')) {
    warnings.push('Domains contains "unknown"');
  }

  // Validate entity structure
  if (!entity.id || typeof entity.id !== 'string') {
    errors.push('Invalid or missing id');
  }

  if (!entity.name || typeof entity.name !== 'string') {
    errors.push('Invalid or missing name');
  }

  // Check for malformed data
  if (entity.searchTerms && !Array.isArray(entity.searchTerms)) {
    errors.push('searchTerms must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Prepare entity for Firebase upload
 */
function prepareForFirebase(entity) {
  // Create a clean copy
  const firebaseEntity = { ...entity };

  // Convert timestamps to Firestore Timestamp
  if (firebaseEntity._created) {
    try {
      const date = new Date(firebaseEntity._created);
      firebaseEntity._created = admin.firestore.Timestamp.fromDate(date);
    } catch (e) {
      delete firebaseEntity._created;
    }
  }

  if (firebaseEntity._modified) {
    try {
      const date = new Date(firebaseEntity._modified);
      firebaseEntity._modified = admin.firestore.Timestamp.fromDate(date);
    } catch (e) {
      delete firebaseEntity._modified;
    }
  }

  // Ensure _uploadedAt is set
  firebaseEntity._uploadedAt = admin.firestore.FieldValue.serverTimestamp();

  // Clean up any undefined values (Firestore doesn't allow them)
  Object.keys(firebaseEntity).forEach(key => {
    if (firebaseEntity[key] === undefined) {
      delete firebaseEntity[key];
    }
  });

  return firebaseEntity;
}

/**
 * Upload entity to Firebase
 */
async function uploadToFirebase(db, entity, collection = 'entities') {
  try {
    const firebaseEntity = prepareForFirebase(entity);
    const docRef = db.collection(collection).doc(entity.id);

    await docRef.set(firebaseEntity, { merge: true });

    return { success: true, id: entity.id };

  } catch (error) {
    return {
      success: false,
      id: entity.id,
      error: error.message
    };
  }
}

/**
 * Process a single file
 */
async function processFile(filePath, db, options = {}) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const entity = JSON.parse(content);

    // Validate entity
    const validation = validateEntity(entity, filePath);

    if (!validation.valid) {
      stats.invalid++;
      // Track validation errors
      validation.errors.forEach(error => {
        stats.validationErrors[error] = (stats.validationErrors[error] || 0) + 1;
      });

      return {
        status: 'invalid',
        file: path.basename(filePath),
        entity: entity.name || entity.id,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    stats.validated++;

    // Upload to Firebase if enabled
    if (options.upload && db) {
      const uploadResult = await uploadToFirebase(db, entity, options.collection);

      if (uploadResult.success) {
        stats.uploaded++;
        return {
          status: 'uploaded',
          file: path.basename(filePath),
          entity: entity.name || entity.id,
          id: uploadResult.id,
          warnings: validation.warnings
        };
      } else {
        stats.uploadFailed++;
        stats.uploadErrors.push({
          file: path.basename(filePath),
          entity: entity.name || entity.id,
          error: uploadResult.error
        });
        return {
          status: 'upload_failed',
          file: path.basename(filePath),
          entity: entity.name || entity.id,
          error: uploadResult.error,
          warnings: validation.warnings
        };
      }
    }

    return {
      status: 'valid',
      file: path.basename(filePath),
      entity: entity.name || entity.id,
      warnings: validation.warnings
    };

  } catch (error) {
    stats.invalid++;
    return {
      status: 'error',
      file: path.basename(filePath),
      error: error.message
    };
  }
}

/**
 * Recursively find all JSON files
 */
async function findJsonFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate detailed report
 */
function generateReport(results, duration, options) {
  const invalidResults = results.filter(r => r.status === 'invalid' || r.status === 'error');
  const uploadFailedResults = results.filter(r => r.status === 'upload_failed');
  const successResults = results.filter(r => r.status === 'uploaded' || r.status === 'valid');

  const report = {
    timestamp: new Date().toISOString(),
    duration: `${(duration / 1000).toFixed(2)}s`,
    options: {
      uploadEnabled: options.upload || false,
      collection: options.collection || 'entities',
      dryRun: !options.upload
    },
    statistics: {
      totalFiles: stats.totalFiles,
      validated: stats.validated,
      invalid: stats.invalid,
      uploaded: stats.uploaded,
      uploadFailed: stats.uploadFailed,
      successRate: ((stats.validated / stats.totalFiles) * 100).toFixed(2) + '%',
      uploadRate: options.upload ? ((stats.uploaded / stats.validated) * 100).toFixed(2) + '%' : 'N/A'
    },
    validationErrors: stats.validationErrors,
    invalidEntities: invalidResults,
    uploadFailures: uploadFailedResults,
    successfulUploads: successResults.filter(r => r.status === 'uploaded'),
    summary: {
      totalProcessed: stats.totalFiles,
      valid: stats.validated,
      invalid: stats.invalid,
      uploaded: stats.uploaded,
      uploadFailed: stats.uploadFailed,
      mostCommonErrors: Object.entries(stats.validationErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }))
    }
  };

  return report;
}

/**
 * Print report to console
 */
function printReport(report) {
  console.log(`\n${colors.bright}${colors.cyan}=== VALIDATION AND UPLOAD REPORT ===${colors.reset}\n`);
  console.log(`${colors.yellow}Timestamp:${colors.reset} ${report.timestamp}`);
  console.log(`${colors.yellow}Duration:${colors.reset} ${report.duration}`);
  console.log(`${colors.yellow}Mode:${colors.reset} ${report.options.dryRun ? 'DRY RUN (validation only)' : 'UPLOAD ENABLED'}\n`);

  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Files Processed: ${colors.cyan}${report.statistics.totalFiles}${colors.reset}`);
  console.log(`  Valid Entities: ${colors.green}${report.statistics.validated}${colors.reset} (${report.statistics.successRate})`);
  console.log(`  Invalid Entities: ${colors.red}${report.statistics.invalid}${colors.reset}`);

  if (report.options.uploadEnabled) {
    console.log(`  Uploaded: ${colors.green}${report.statistics.uploaded}${colors.reset} (${report.statistics.uploadRate})`);
    console.log(`  Upload Failed: ${colors.red}${report.statistics.uploadFailed}${colors.reset}`);
  }

  console.log();

  if (Object.keys(report.validationErrors).length > 0) {
    console.log(`${colors.bright}Most Common Validation Errors:${colors.reset}`);
    report.summary.mostCommonErrors.forEach(({ error, count }) => {
      console.log(`  ${error.padEnd(40)}: ${colors.red}${count}${colors.reset}`);
    });
    console.log();
  }

  if (report.invalidEntities.length > 0 && report.invalidEntities.length <= 10) {
    console.log(`${colors.bright}Invalid Entities:${colors.reset}`);
    report.invalidEntities.forEach(item => {
      console.log(`  ${colors.red}✗${colors.reset} ${item.entity || item.file}`);
      if (item.errors) {
        item.errors.forEach(err => console.log(`    - ${err}`));
      }
    });
    console.log();
  } else if (report.invalidEntities.length > 10) {
    console.log(`${colors.yellow}${report.invalidEntities.length} invalid entities found. See full report for details.${colors.reset}\n`);
  }

  if (report.uploadFailures.length > 0) {
    console.log(`${colors.bright}Upload Failures:${colors.reset}`);
    report.uploadFailures.slice(0, 10).forEach(item => {
      console.log(`  ${colors.red}✗${colors.reset} ${item.entity}: ${item.error}`);
    });
    if (report.uploadFailures.length > 10) {
      console.log(`  ${colors.yellow}... and ${report.uploadFailures.length - 10} more${colors.reset}`);
    }
    console.log();
  }

  console.log(`${colors.cyan}Full report saved to: scripts/validation-upload-report.json${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    upload: args.includes('--upload'),
    collection: 'entities',
    dryRun: !args.includes('--upload')
  };

  // Check for custom collection
  const collectionArg = args.find(arg => arg.startsWith('--collection='));
  if (collectionArg) {
    options.collection = collectionArg.split('=')[1];
  }

  console.log(`${colors.bright}${colors.blue}Validate and Upload Fixed Assets${colors.reset}\n`);

  const assetsDir = path.join(process.cwd(), 'firebase-assets-validated');

  // Check if directory exists
  try {
    await fs.access(assetsDir);
  } catch (error) {
    console.error(`${colors.red}Error: Directory not found: ${assetsDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.yellow}Assets Directory:${colors.reset} ${assetsDir}`);
  console.log(`${colors.yellow}Mode:${colors.reset} ${options.dryRun ? 'DRY RUN (validation only)' : 'UPLOAD ENABLED'}`);
  console.log(`${colors.yellow}Collection:${colors.reset} ${options.collection}\n`);

  // Initialize Firebase if upload is enabled
  let db = null;
  if (options.upload) {
    try {
      db = initializeFirebase();
    } catch (error) {
      console.error(`${colors.red}Cannot proceed with upload. Switching to validation-only mode.${colors.reset}\n`);
      options.upload = false;
      options.dryRun = true;
    }
  }

  // Find all JSON files
  console.log(`${colors.cyan}Finding JSON files...${colors.reset}`);
  const jsonFiles = await findJsonFiles(assetsDir);
  stats.totalFiles = jsonFiles.length;
  console.log(`${colors.green}Found ${stats.totalFiles} JSON files${colors.reset}\n`);

  // Process files
  console.log(`${colors.cyan}Processing files...${colors.reset}`);
  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < jsonFiles.length; i++) {
    const file = jsonFiles[i];
    const result = await processFile(file, db, options);
    results.push(result);

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === jsonFiles.length - 1) {
      const percent = ((i + 1) / jsonFiles.length * 100).toFixed(1);
      const statusText = options.upload
        ? `Valid: ${colors.green}${stats.validated}${colors.reset}, Invalid: ${colors.red}${stats.invalid}${colors.reset}, Uploaded: ${colors.green}${stats.uploaded}${colors.reset}`
        : `Valid: ${colors.green}${stats.validated}${colors.reset}, Invalid: ${colors.red}${stats.invalid}${colors.reset}`;

      process.stdout.write(`\r  Progress: ${percent}% (${i + 1}/${jsonFiles.length}) - ${statusText}`);
    }
  }

  console.log('\n');

  const duration = Date.now() - startTime;

  // Generate and save report
  const report = generateReport(results, duration, options);
  const reportPath = path.join(process.cwd(), 'scripts', 'validation-upload-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // Print report
  printReport(report);

  // Final status
  if (stats.invalid === 0) {
    console.log(`${colors.green}${colors.bright}✓ All files passed validation!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ ${stats.invalid} file(s) failed validation${colors.reset}`);
  }

  if (options.upload) {
    if (stats.uploadFailed === 0) {
      console.log(`${colors.green}${colors.bright}✓ All valid files uploaded successfully!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${colors.bright}⚠ ${stats.uploadFailed} file(s) failed to upload${colors.reset}`);
    }
  } else {
    console.log(`\n${colors.cyan}To upload to Firebase, run with --upload flag:${colors.reset}`);
    console.log(`${colors.yellow}node scripts/validate-and-upload-fixed.js --upload${colors.reset}`);
  }

  console.log();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}${colors.bright}Fatal Error:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { validateEntity, prepareForFirebase, uploadToFirebase };
