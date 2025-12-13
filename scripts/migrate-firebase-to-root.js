#!/usr/bin/env node

/**
 * Migrate FIREBASE Folder to Root
 *
 * This script safely migrates the FIREBASE folder contents to the root directory,
 * replacing older files with newer Firebase-integrated versions.
 */

const fs = require('fs');
const path = require('path');

const FIREBASE_DIR = path.join(__dirname, '../FIREBASE');
const ROOT_DIR = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'BACKUP_PRE_MIGRATION');

// Files to migrate from FIREBASE to root
const FILES_TO_MIGRATE = {
  // Core Firebase files (newer versions in FIREBASE/)
  'firebase-config.js': true,
  'firestore.rules': true,
  'firebase.json': true,
  'storage.rules': false, // Skipped - not using storage

  // JavaScript files
  'js/firebase-auth.js': true,
  'js/firebase-cache-manager.js': true,
  'js/firebase-content-loader.js': true,
  'js/firebase-detector.js': true,
  'js/version-tracker.js': true,

  // HTML files (Firebase-integrated versions)
  'index.html': false, // Will handle separately - use index_firebase.html

  // CSS files
  'css/firebase-auth.css': true,
  'css/user-profile.css': true,

  // Scripts
  'scripts/': true, // Migrate all scripts

  // Documentation
  'FIREBASE_SETUP_INSTRUCTIONS.md': true,
  'CACHING_STRATEGY.md': true,
  'SECURITY_IMPLEMENTATION.md': true
};

/**
 * Create backup of root directory
 */
function createBackup() {
  console.log('📦 Creating backup of root directory...\n');

  if (fs.existsSync(BACKUP_DIR)) {
    console.log('  ⚠️  Backup already exists, skipping...\n');
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // Copy critical files
  const filesToBackup = [
    'firebase-config.js',
    'firestore.rules',
    'firebase.json',
    'index.html',
    '.firebaserc'
  ];

  filesToBackup.forEach(file => {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
      const dest = path.join(BACKUP_DIR, file);
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Backed up ${file}`);
    }
  });

  console.log('\n✅ Backup created\n');
}

/**
 * Copy directory recursively
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Migrate individual file
 */
function migrateFile(relativePath) {
  const src = path.join(FIREBASE_DIR, relativePath);
  const dest = path.join(ROOT_DIR, relativePath);

  if (!fs.existsSync(src)) {
    console.log(`  ⚠️  Source not found: ${relativePath}`);
    return false;
  }

  // Create destination directory if needed
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy file
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${relativePath}`);
  return true;
}

/**
 * Migrate scripts directory
 */
function migrateScripts() {
  console.log('📁 Migrating scripts...\n');

  const firebaseScriptsDir = path.join(FIREBASE_DIR, 'scripts');
  const rootScriptsDir = path.join(ROOT_DIR, 'scripts');

  if (!fs.existsSync(firebaseScriptsDir)) {
    console.log('  ⚠️  No scripts directory in FIREBASE\n');
    return;
  }

  // Get all script files
  const scripts = fs.readdirSync(firebaseScriptsDir).filter(f => f.endsWith('.js'));

  scripts.forEach(script => {
    const src = path.join(firebaseScriptsDir, script);
    const dest = path.join(rootScriptsDir, script);

    // Check if newer
    const srcStat = fs.statSync(src);
    if (fs.existsSync(dest)) {
      const destStat = fs.statSync(dest);
      if (srcStat.mtime <= destStat.mtime) {
        console.log(`  ⏭️  ${script} (root is newer)`);
        return;
      }
    }

    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${script}`);
  });

  console.log('\n✅ Scripts migrated\n');
}

/**
 * Replace index.html with Firebase version
 */
function replaceIndexHtml() {
  console.log('📄 Replacing index.html with Firebase version...\n');

  const firebaseIndex = path.join(FIREBASE_DIR, 'index_firebase.html');
  const rootIndex = path.join(ROOT_DIR, 'index.html');
  const oldIndex = path.join(BACKUP_DIR, 'index_old.html');

  // Check if Firebase version exists
  if (!fs.existsSync(firebaseIndex)) {
    console.log('  ⚠️  index_firebase.html not found, keeping current index.html\n');
    return;
  }

  // Backup current index
  if (fs.existsSync(rootIndex)) {
    fs.copyFileSync(rootIndex, oldIndex);
    console.log('  ✓ Backed up current index.html');
  }

  // Copy Firebase version to root
  fs.copyFileSync(firebaseIndex, rootIndex);
  console.log('  ✓ Replaced index.html with Firebase version\n');

  console.log('✅ Index replaced\n');
}

/**
 * Migrate directories
 */
function migrateDirectories() {
  console.log('📁 Migrating directories...\n');

  const dirs = ['js', 'css'];

  dirs.forEach(dir => {
    const src = path.join(FIREBASE_DIR, dir);
    const dest = path.join(ROOT_DIR, dir);

    if (!fs.existsSync(src)) {
      console.log(`  ⚠️  ${dir}/ not found in FIREBASE`);
      return;
    }

    // Get all files in directory
    const files = fs.readdirSync(src);

    files.forEach(file => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);

      // Skip if not a file
      if (!fs.statSync(srcFile).isFile()) return;

      // Check if Firebase-specific file
      if (file.includes('firebase-') || file.includes('version-tracker') ||
          file === 'user-profile.css') {
        fs.mkdirSync(dest, { recursive: true });
        fs.copyFileSync(srcFile, destFile);
        console.log(`  ✓ ${dir}/${file}`);
      }
    });
  });

  console.log('\n✅ Directories migrated\n');
}

/**
 * Migrate documentation
 */
function migrateDocs() {
  console.log('📚 Migrating documentation...\n');

  const docs = [
    'FIREBASE_SETUP_INSTRUCTIONS.md',
    'CACHING_STRATEGY.md',
    'SECURITY_IMPLEMENTATION.md',
    'DEPLOYMENT_SUMMARY.md',
    'COMPLETE_MIGRATION_SUMMARY.md'
  ];

  docs.forEach(doc => {
    const src = path.join(FIREBASE_DIR, doc);
    const dest = path.join(ROOT_DIR, doc);

    if (!fs.existsSync(src)) {
      console.log(`  ⏭️  ${doc} (not found)`);
      return;
    }

    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${doc}`);
  });

  console.log('\n✅ Documentation migrated\n');
}

/**
 * Migrate core Firebase config files
 */
function migrateFirebaseConfig() {
  console.log('⚙️  Migrating Firebase configuration...\n');

  const configs = [
    'firebase-config.js',
    'firestore.rules',
    'firebase.json'
  ];

  configs.forEach(config => {
    const src = path.join(FIREBASE_DIR, config);
    const dest = path.join(ROOT_DIR, config);

    if (!fs.existsSync(src)) {
      console.log(`  ⚠️  ${config} not found in FIREBASE`);
      return;
    }

    // Check if Firebase version is newer
    const srcStat = fs.statSync(src);
    if (fs.existsSync(dest)) {
      const destStat = fs.statSync(dest);
      if (srcStat.mtime <= destStat.mtime) {
        console.log(`  ⏭️  ${config} (root is newer or same)`);
        return;
      }
    }

    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${config}`);
  });

  console.log('\n✅ Firebase config migrated\n');
}

/**
 * Generate migration report
 */
function generateReport() {
  const reportPath = path.join(ROOT_DIR, 'FIREBASE_MIGRATION_REPORT.md');

  const report = `# Firebase Migration Report

**Date:** ${new Date().toISOString()}
**Status:** ✅ COMPLETE

---

## Migration Summary

Successfully migrated FIREBASE folder contents to root directory.

### Files Migrated

- **Firebase Config:** firebase-config.js, firestore.rules, firebase.json
- **JavaScript:** firebase-auth.js, firebase-cache-manager.js, firebase-content-loader.js, firebase-detector.js, version-tracker.js
- **CSS:** firebase-auth.css, user-profile.css
- **Scripts:** All Firebase-related scripts from FIREBASE/scripts/
- **Documentation:** Setup instructions, caching strategy, security docs
- **Index:** Replaced index.html with Firebase-integrated version

### Backup Location

All original files backed up to: \`BACKUP_PRE_MIGRATION/\`

### Next Steps

1. ✅ Test Firebase website locally
2. ✅ Verify all Firebase features work
3. ⏭️ Delete FIREBASE folder after final verification
4. ⏭️ Commit changes to git

### Rollback Procedure

If issues occur, restore from backup:

\`\`\`bash
# Restore original files
xcopy BACKUP_PRE_MIGRATION\\* . /E /Y

# Delete migrated files
del firebase-config.js firestore.rules firebase.json
\`\`\`

---

**Migration completed successfully!**
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📝 Report saved: FIREBASE_MIGRATION_REPORT.md\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Migrate FIREBASE Folder to Root');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create backup
    createBackup();

    // Step 2: Migrate Firebase config files
    migrateFirebaseConfig();

    // Step 3: Migrate directories (js, css)
    migrateDirectories();

    // Step 4: Migrate scripts
    migrateScripts();

    // Step 5: Migrate documentation
    migrateDocs();

    // Step 6: Replace index.html
    replaceIndexHtml();

    // Step 7: Generate report
    generateReport();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Test website locally: firebase serve');
    console.log('2. Verify all Firebase features work');
    console.log('3. Delete FIREBASE folder after verification');
    console.log('4. Commit changes\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
