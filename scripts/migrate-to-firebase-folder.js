#!/usr/bin/env node

/**
 * Migration Script: Copy Website Files to FIREBASE Folder
 *
 * This script creates a FIREBASE folder and copies all relevant website files
 * while excluding build artifacts, configs, and documentation.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..');
const TARGET_DIR = path.join(__dirname, '..', 'FIREBASE');

// Files and directories to exclude from migration
const EXCLUDE_PATTERNS = [
    /^\.git/,
    /^\.github/,
    /^\.claude/,
    /^node_modules/,
    /^FIREBASE/,
    /^_dev/,
    /^\.firebaserc$/,
    /^firebase\.json$/,
    /^firebase-config\.js$/,
    /^firebase-config\.template\.js$/,
    /^firestore\.rules$/,
    /^firestore\.indexes\.json/,
    /^storage\.rules$/,
    /^package\.json$/,
    /^package-lock\.json$/,
    /\.md$/,
    /\.log$/,
    /\.txt$/,
    /\.csv$/,
    /\.backup$/,
    /\.py$/,
    /^test-/,
    /firebase-debug\.log/,
    /server\.log/,
    /temp_/,
    /audit-/,
    /validate-/,
    /fix-/,
];

// Files to include (website core files)
const INCLUDE_EXTENSIONS = [
    '.html',
    '.css',
    '.js',
    '.json',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
];

// Directories to copy entirely
const INCLUDE_DIRS = [
    'mythos',
    'archetypes',
    'herbalism',
    'magic',
    'theories',
    'cosmology',
    'spiritual-items',
    'spiritual-places',
    'themes',
    'css',
    'js',
    'components',
    'visualizations',
    'data',
    'entities',
    'shared',
    'templates',
    'docs'
];

// Critical root files to copy
const INCLUDE_ROOT_FILES = [
    'index.html',
    'about.html',
    'styles.css',
    'search.js',
    'mythos_data.js',
    'sparks_data.js',
    'sparks_data_expanded.js',
    'data_api.js',
    'corpus-github-browser.js',
    'corpus-search-core.js',
    'corpus-search-ui.js'
];

/**
 * Check if a path should be excluded
 */
function shouldExclude(relativePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath));
}

/**
 * Check if a file should be included based on extension
 */
function shouldIncludeFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Create directory recursively
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created: ${path.relative(SOURCE_DIR, dirPath)}`);
    }
}

/**
 * Copy file
 */
function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    const relativePath = path.relative(SOURCE_DIR, src);
    console.log(`📄 Copied: ${relativePath}`);
}

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest, dirName = '') {
    const relativePath = path.relative(SOURCE_DIR, src);

    // Skip if excluded
    if (shouldExclude(relativePath)) {
        return;
    }

    ensureDir(dest);

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        const relPath = path.relative(SOURCE_DIR, srcPath);

        // Skip excluded patterns
        if (shouldExclude(relPath) || shouldExclude(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, entry.name);
        } else if (entry.isFile() && shouldIncludeFile(entry.name)) {
            copyFile(srcPath, destPath);
        }
    }
}

/**
 * Main migration function
 */
function migrateToFirebase() {
    console.log('🚀 Starting migration to FIREBASE folder...\n');

    // Create FIREBASE root directory
    ensureDir(TARGET_DIR);

    // Copy critical root files
    console.log('\n📋 Copying root files...');
    for (const filename of INCLUDE_ROOT_FILES) {
        const src = path.join(SOURCE_DIR, filename);
        const dest = path.join(TARGET_DIR, filename);

        if (fs.existsSync(src)) {
            copyFile(src, dest);
        } else {
            console.log(`⚠️  Not found: ${filename}`);
        }
    }

    // Copy included directories
    console.log('\n📋 Copying directories...');
    for (const dirName of INCLUDE_DIRS) {
        const src = path.join(SOURCE_DIR, dirName);
        const dest = path.join(TARGET_DIR, dirName);

        if (fs.existsSync(src)) {
            console.log(`\n📂 Processing: ${dirName}/`);
            copyDirectory(src, dest, dirName);
        } else {
            console.log(`⚠️  Directory not found: ${dirName}/`);
        }
    }

    // Create migration metadata file
    const metadata = {
        migrationDate: new Date().toISOString(),
        sourceDirectory: SOURCE_DIR,
        targetDirectory: TARGET_DIR,
        filesProcessed: true,
        note: 'This folder contains a copy of all website files for Firebase migration'
    };

    fs.writeFileSync(
        path.join(TARGET_DIR, '_migration_metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    console.log('\n✅ Migration complete!');
    console.log(`📁 Target directory: ${TARGET_DIR}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Review copied files in FIREBASE/ folder');
    console.log('   2. Create Firebase DB schema');
    console.log('   3. Migrate index.html data to Firebase');
    console.log('   4. Implement data reading from Firebase DB');
}

// Run migration
try {
    migrateToFirebase();
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
}
