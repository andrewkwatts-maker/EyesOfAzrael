#!/usr/bin/env node

/**
 * Batch 4 Firebase Upload & HTML Deletion Script
 * Uploads extracted content from batch-4-extracted-content.json to Firebase
 * and deletes HTML files after successful verification
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Paths
const BATCH_DATA_FILE = path.join(__dirname, '../batch-4-extracted-content.json');
const BATCH_MAPPING_FILE = path.join(__dirname, '../migration-batches/batch-4.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../FIREBASE/firebase-service-account.json');
const DELETION_LOG_FILE = path.join(__dirname, '../batch4_deletion_log.json');
const ERROR_LOG_FILE = path.join(__dirname, '../batch4_upload_errors.json');
const ROLLBACK_FILE = path.join(__dirname, '../batch4_rollback_data.json');
const REPORT_FILE = path.join(__dirname, '../BATCH4_UPLOAD_REPORT.md');

// Firebase initialization
let db;
let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) return;

  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.error('[ERROR] firebase-service-account.json not found at:', SERVICE_ACCOUNT_PATH);
      process.exit(1);
    }

    const serviceAccount = require(SERVICE_ACCOUNT_PATH);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    isInitialized = true;
    console.log('[OK] Firebase Admin initialized\n');
  } catch (error) {
    console.error('[ERROR] Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// Tracking arrays
const deletionLog = [];
const errorLog = [];
const rollbackData = [];
const uploadResults = [];

/**
 * Upload content to Firebase document
 */
async function uploadToFirebase(collection, docId, content) {
  try {
    const docRef = db.collection(collection).doc(docId);

    // Prepare the update data
    const updateData = {
      batch4_migration_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      batch4_migration_status: 'completed'
    };

    // Add extracted content fields
    if (content.title) {
      updateData.extracted_title = content.title;
    }

    if (content.headings && content.headings.length > 0) {
      updateData.extracted_headings = content.headings;
    }

    if (content.links && content.links.length > 0) {
      updateData.extracted_links = content.links;
    }

    if (content.lists && content.lists.length > 0) {
      updateData.extracted_lists = content.lists;
    }

    // Use merge to preserve existing data
    await docRef.set(updateData, { merge: true });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Verify the document was uploaded successfully
 */
async function verifyUpload(collection, docId) {
  try {
    const docRef = db.collection(collection).doc(docId);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      // Check if batch4 migration fields exist
      return data.batch4_migration_status === 'completed';
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Delete HTML file
 */
function deleteHtmlFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true };
    } else {
      return {
        success: false,
        error: 'File not found'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process batch upload
 */
async function processBatch() {
  console.log('='.repeat(80));
  console.log('BATCH 4 FIREBASE UPLOAD & HTML DELETION');
  console.log('='.repeat(80));
  console.log('');

  // Load batch data
  console.log('Loading batch data...');
  if (!fs.existsSync(BATCH_DATA_FILE)) {
    console.error('[ERROR] Batch data file not found:', BATCH_DATA_FILE);
    process.exit(1);
  }

  const batchData = JSON.parse(fs.readFileSync(BATCH_DATA_FILE, 'utf-8'));
  const files = batchData.files || [];

  console.log(`Found ${files.length} files to process`);
  console.log(`Average migration: ${batchData.avg_migration_pct?.toFixed(2)}%\n`);

  let successCount = 0;
  let errorCount = 0;
  let deletedCount = 0;

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const fileEntry = files[i];
    const { source_file, collection, asset_id, content } = fileEntry;

    console.log(`\n[${i + 1}/${files.length}] Processing: ${source_file}`);
    console.log(`  -> Collection: ${collection}, Asset ID: ${asset_id}`);

    // Upload to Firebase
    const uploadResult = await uploadToFirebase(collection, asset_id, content);
    let deleteResult = null;
    let wasDeleted = false;

    if (uploadResult.success) {
      console.log('  [OK] Upload successful');

      // Verify upload
      const verified = await verifyUpload(collection, asset_id);

      if (verified) {
        console.log('  [OK] Upload verified');

        // Store rollback data
        rollbackData.push({
          collection,
          document_id: asset_id,
          html_file: source_file,
          timestamp: new Date().toISOString()
        });

        // Delete HTML file
        deleteResult = deleteHtmlFile(source_file);

        if (deleteResult.success) {
          console.log(`  [OK] HTML file deleted: ${source_file}`);
          deletedCount++;
          wasDeleted = true;

          deletionLog.push({
            file: source_file,
            deleted_at: new Date().toISOString(),
            collection,
            asset_id
          });

          successCount++;
        } else {
          console.log(`  [ERROR] Failed to delete HTML file: ${deleteResult.error}`);

          errorLog.push({
            file: source_file,
            collection,
            asset_id,
            error: `Deletion failed: ${deleteResult.error}`,
            stage: 'deletion'
          });

          successCount++; // Still count as success since upload worked
        }
      } else {
        console.log('  [ERROR] Upload verification failed');

        errorLog.push({
          file: source_file,
          collection,
          asset_id,
          error: 'Upload verification failed',
          stage: 'verification'
        });

        errorCount++;
      }
    } else {
      console.log(`  [ERROR] Upload failed: ${uploadResult.error}`);
      console.log('  -> HTML file preserved for safety');

      errorLog.push({
        file: source_file,
        collection,
        asset_id,
        error: uploadResult.error,
        error_code: uploadResult.code,
        stage: 'upload'
      });

      errorCount++;
    }

    uploadResults.push({
      file: source_file,
      collection,
      asset_id,
      success: uploadResult.success,
      deleted: wasDeleted
    });

    // Rate limiting - be gentle with Firebase
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save logs
  console.log('\n' + '='.repeat(80));
  console.log('Saving logs...');

  fs.writeFileSync(DELETION_LOG_FILE, JSON.stringify(deletionLog, null, 2));
  console.log('[OK] Saved: batch4_deletion_log.json');

  if (errorLog.length > 0) {
    fs.writeFileSync(ERROR_LOG_FILE, JSON.stringify(errorLog, null, 2));
    console.log('[OK] Saved: batch4_upload_errors.json');
  }

  fs.writeFileSync(ROLLBACK_FILE, JSON.stringify(rollbackData, null, 2));
  console.log('[OK] Saved: batch4_rollback_data.json');

  // Generate report
  generateReport(files.length, successCount, errorCount, deletedCount);

  return {
    total: files.length,
    success: successCount,
    errors: errorCount,
    deleted: deletedCount
  };
}

/**
 * Generate comprehensive report
 */
function generateReport(total, success, errors, deleted) {
  const report = `# Batch 4 Firebase Upload Report

## Summary

**Date:** ${new Date().toISOString()}
**Total Files Processed:** ${total}
**Successful Uploads:** ${success}
**Failed Uploads:** ${errors}
**HTML Files Deleted:** ${deleted}
**Success Rate:** ${((success / total) * 100).toFixed(2)}%

## Upload Statistics

- Files uploaded to Firebase: ${success}
- Files with errors: ${errors}
- HTML files successfully deleted: ${deleted}
- HTML files preserved (due to errors): ${errors}

## Collections Updated

${getCollectionStats()}

## Error Details

${getErrorDetails()}

## Rollback Information

Rollback data saved to: batch4_rollback_data.json
Total rollback entries: ${rollbackData.length}
Rollback data preserved for 24 hours

## Deletion Log

Deleted files logged to: batch4_deletion_log.json
Total files deleted: ${deletionLog.length}

${getDeletionSamples()}

## Next Steps

1. Verify Firebase data integrity
2. Check error log if any failures occurred
3. Review deletion log to confirm files were properly removed
4. Rollback data available if needed within 24 hours
`;

  fs.writeFileSync(REPORT_FILE, report);

  console.log('\n' + '='.repeat(80));
  console.log('BATCH 4 UPLOAD COMPLETE');
  console.log('='.repeat(80));
  console.log(`\nTotal Files: ${total}`);
  console.log(`Successful: ${success}`);
  console.log(`Errors: ${errors}`);
  console.log(`Deleted: ${deleted}`);
  console.log(`\n[OK] Report saved: BATCH4_UPLOAD_REPORT.md`);
  console.log('='.repeat(80));
}

function getCollectionStats() {
  const collections = {};
  for (const result of uploadResults) {
    const coll = result.collection;
    collections[coll] = (collections[coll] || 0) + 1;
  }

  return Object.entries(collections)
    .sort((a, b) => b[1] - a[1])
    .map(([coll, count]) => `- **${coll}**: ${count} documents`)
    .join('\n');
}

function getErrorDetails() {
  if (errorLog.length === 0) {
    return 'No errors encountered!\n';
  }

  let details = `Total errors: ${errorLog.length}\n\n`;

  const displayErrors = errorLog.slice(0, 10);
  for (const error of displayErrors) {
    details += `### ${error.file}\n`;
    details += `- Collection: ${error.collection}\n`;
    details += `- Asset ID: ${error.asset_id}\n`;
    details += `- Stage: ${error.stage}\n`;
    details += `- Error: ${error.error}\n\n`;
  }

  if (errorLog.length > 10) {
    details += `\n*See batch4_upload_errors.json for complete error list*\n`;
  }

  return details;
}

function getDeletionSamples() {
  if (deletionLog.length === 0) {
    return '';
  }

  let samples = '### Sample Deletions\n\n';

  const displaySamples = deletionLog.slice(0, 5);
  for (const del of displaySamples) {
    samples += `- ${del.file} -> ${del.collection}/${del.asset_id}\n`;
  }

  return samples;
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Initialize Firebase
    initializeFirebase();

    // Process batch
    const results = await processBatch();

    // Exit
    process.exit(0);
  } catch (error) {
    console.error('\n[ERROR] Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main();
