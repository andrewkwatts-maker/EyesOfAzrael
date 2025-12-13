#!/usr/bin/env node

/**
 * Clean FIREBASE Folder After Migration
 *
 * Safely removes migrated files from FIREBASE folder while preserving:
 * - firebase-service-account.json (credentials)
 * - parsed_data/ (data backup)
 * - functions/ (cloud functions)
 */

const fs = require('fs');
const path = require('path');

const FIREBASE_DIR = path.join(__dirname, '../FIREBASE');
const ROOT_DIR = path.join(__dirname, '..');

// Files/folders to DELETE from FIREBASE (already migrated to root)
const TO_DELETE = [
  'js',
  'css',
  'scripts',
  'index.html',
  'index_firebase.html',
  'COMPLETE_MIGRATION_SUMMARY.md',
  'DEPLOYMENT_SUMMARY.md'
];

// Files/folders to KEEP in FIREBASE (critical or backup)
const TO_KEEP = [
  'firebase-service-account.json',
  'parsed_data',
  'search_indexes',
  'functions',
  'transformed_data',
  'backups'
];

/**
 * Delete directory recursively
 */
function deleteDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      deleteDirRecursive(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }

  fs.rmdirSync(dirPath);
}

/**
 * Verify file exists in root before deleting from FIREBASE
 */
function verifyMigrated(relativePath) {
  const rootPath = path.join(ROOT_DIR, relativePath);
  return fs.existsSync(rootPath);
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Clean FIREBASE Folder After Migration');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('This script will delete migrated files from FIREBASE folder.\n');
  console.log('✅ WILL DELETE:');
  TO_DELETE.forEach(item => console.log(`   - ${item}`));
  console.log('\n🔒 WILL KEEP (protected):');
  TO_KEEP.forEach(item => console.log(`   - ${item}`));

  console.log('\n⚠️  SAFETY CHECK: Verifying files migrated to root...\n');

  let allMigrated = true;

  // Verify critical files migrated
  const criticalFiles = [
    'js/firebase-auth.js',
    'js/firebase-cache-manager.js',
    'js/firebase-content-loader.js',
    'js/version-tracker.js',
    'index.html'
  ];

  criticalFiles.forEach(file => {
    const migrated = verifyMigrated(file);
    if (migrated) {
      console.log(`  ✓ ${file} exists in root`);
    } else {
      console.log(`  ✗ ${file} NOT FOUND in root`);
      allMigrated = false;
    }
  });

  if (!allMigrated) {
    console.error('\n❌ ABORT: Some critical files not found in root!');
    console.error('Run migrate-firebase-to-root.js first.\n');
    process.exit(1);
  }

  console.log('\n✅ All critical files verified in root\n');
  console.log('🗑️  Deleting migrated files from FIREBASE...\n');

  let deletedCount = 0;

  TO_DELETE.forEach(item => {
    const fullPath = path.join(FIREBASE_DIR, item);

    if (!fs.existsSync(fullPath)) {
      console.log(`  ⏭️  ${item} (not found)`);
      return;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      deleteDirRecursive(fullPath);
      console.log(`  ✓ Deleted directory: ${item}/`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`  ✓ Deleted file: ${item}`);
    }

    deletedCount++;
  });

  console.log(`\n✅ Deleted ${deletedCount} items from FIREBASE folder\n`);

  console.log('🔒 Protected files remaining in FIREBASE:');
  TO_KEEP.forEach(item => {
    const fullPath = path.join(FIREBASE_DIR, item);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✓ ${item}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Next steps:');
  console.log('1. Verify website works: firebase serve');
  console.log('2. Commit changes to git');
  console.log('3. Deploy to production\n');

  process.exit(0);
}

main();
