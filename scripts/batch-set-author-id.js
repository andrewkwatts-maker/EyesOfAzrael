/**
 * Batch Set AuthorId Script
 *
 * Sets authorId on all firebase-assets-downloaded JSON files.
 * This enables the ownership system to recognize existing assets.
 *
 * Usage:
 *   node scripts/batch-set-author-id.js --dry-run    # Preview changes
 *   node scripts/batch-set-author-id.js              # Execute changes
 *   node scripts/batch-set-author-id.js --set-admin  # Set all to admin user
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ASSETS_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded');
const SYSTEM_AUTHOR = 'system';
const ADMIN_AUTHOR = 'admin';  // Replace with actual Firebase UID if needed

const COLLECTIONS = [
    'deities', 'creatures', 'heroes', 'items', 'places',
    'texts', 'rituals', 'herbs', 'symbols', 'archetypes',
    'cosmology', 'magic', 'beings', 'angels', 'figures',
    'concepts', 'events', 'mythologies'
];

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const setAdmin = args.includes('--set-admin');

// Statistics
const stats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    alreadyHasAuthor: 0,
    errors: []
};

/**
 * Process a single JSON file
 */
function processJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let data;

        try {
            data = JSON.parse(content);
        } catch (parseError) {
            stats.errors.push({ file: filePath, error: `JSON parse error: ${parseError.message}` });
            return;
        }

        // Skip aggregate files (arrays) and index files
        if (Array.isArray(data)) {
            stats.skipped++;
            return;
        }

        const fileName = path.basename(filePath);
        if (fileName.startsWith('_') || fileName.includes('_all') || fileName.includes('_index')) {
            stats.skipped++;
            return;
        }

        // Check if authorId already exists and has a value
        if (data.authorId && data.authorId !== '' && data.authorId !== 'system') {
            stats.alreadyHasAuthor++;
            return;
        }

        // Determine the authorId to set
        let newAuthorId = SYSTEM_AUTHOR;

        if (setAdmin) {
            newAuthorId = ADMIN_AUTHOR;
        } else if (data.submittedBy && data.submittedBy !== 'system') {
            // Preserve existing submittedBy as authorId
            newAuthorId = data.submittedBy;
        } else if (data.metadata?.submittedBy && data.metadata.submittedBy !== 'system') {
            newAuthorId = data.metadata.submittedBy;
        }

        // Add/update authorId
        data.authorId = newAuthorId;

        // Ensure metadata exists
        if (!data.metadata) {
            data.metadata = {};
        }

        // Add authoredAt if missing
        if (!data.authoredAt && !data.metadata.authoredAt) {
            const timestamp = data.createdAt ||
                              data.metadata?.created ||
                              data._created ||
                              new Date().toISOString();
            data.authoredAt = typeof timestamp === 'object' ?
                              new Date(timestamp._seconds * 1000).toISOString() :
                              timestamp;
        }

        if (!isDryRun) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
        }

        stats.updated++;
        const relativePath = path.relative(ASSETS_DIR, filePath);
        console.log(`${isDryRun ? '[DRY RUN] Would update' : '[UPDATED]'}: ${relativePath} -> authorId: ${newAuthorId}`);

    } catch (error) {
        stats.errors.push({ file: filePath, error: error.message });
    }

    stats.processed++;
}

/**
 * Process all JSON files in a directory recursively
 */
function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.name.endsWith('.json') && !entry.name.startsWith('_')) {
            processJsonFile(fullPath);
        }
    }
}

// =============================================================================
// Main Execution
// =============================================================================

console.log('');
console.log('='.repeat(60));
console.log('  Batch Set AuthorId Script');
console.log('='.repeat(60));
console.log('');

if (isDryRun) {
    console.log('[MODE] DRY RUN - No files will be modified\n');
} else {
    console.log('[MODE] LIVE - Files will be modified\n');
}

if (setAdmin) {
    console.log(`[CONFIG] Setting all authorId to: ${ADMIN_AUTHOR}\n`);
} else {
    console.log(`[CONFIG] Preserving existing submittedBy or defaulting to: ${SYSTEM_AUTHOR}\n`);
}

// Process each collection
for (const collection of COLLECTIONS) {
    const collectionPath = path.join(ASSETS_DIR, collection);
    if (fs.existsSync(collectionPath)) {
        console.log(`\nProcessing: ${collection}/`);
        processDirectory(collectionPath);
    }
}

// Print summary
console.log('\n' + '='.repeat(60));
console.log('  Summary');
console.log('='.repeat(60));
console.log(`  Processed:           ${stats.processed}`);
console.log(`  Updated:             ${stats.updated}`);
console.log(`  Already had author:  ${stats.alreadyHasAuthor}`);
console.log(`  Skipped (arrays):    ${stats.skipped}`);
console.log(`  Errors:              ${stats.errors.length}`);
console.log('='.repeat(60));

if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.slice(0, 20).forEach(e => {
        const relativePath = path.relative(ASSETS_DIR, e.file);
        console.log(`  - ${relativePath}: ${e.error}`);
    });
    if (stats.errors.length > 20) {
        console.log(`  ... and ${stats.errors.length - 20} more errors`);
    }
}

if (isDryRun && stats.updated > 0) {
    console.log('\n[INFO] Run without --dry-run to apply these changes');
}

console.log('');
