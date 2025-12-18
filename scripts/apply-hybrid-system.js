#!/usr/bin/env node

/**
 * Batch Update Script - Apply Hybrid Dynamic System
 *
 * Applies the Phase 4 hybrid redirect system to existing static HTML pages.
 * Adds metadata tags and includes the dynamic-redirect.js script.
 *
 * Usage:
 *   node scripts/apply-hybrid-system.js --mythology greek --type deity --limit 10
 *   node scripts/apply-hybrid-system.js --file mythos/greek/deities/athena.html
 *   node scripts/apply-hybrid-system.js --all (careful! updates ALL pages)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    baseDir: process.cwd(),
    backupDir: path.join(process.cwd(), 'BACKUP_HYBRID_UPDATE'),
    dryRun: false, // Set to true to preview changes without modifying files
    verbose: true
};

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        mythology: null,
        type: null,
        limit: null,
        file: null,
        all: false,
        dryRun: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--mythology':
                options.mythology = args[++i];
                break;
            case '--type':
                options.type = args[++i];
                break;
            case '--limit':
                options.limit = parseInt(args[++i]);
                break;
            case '--file':
                options.file = args[++i];
                break;
            case '--all':
                options.all = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

/**
 * Show help information
 */
function showHelp() {
    console.log(`
Batch Update Script - Apply Hybrid Dynamic System

Usage:
  node scripts/apply-hybrid-system.js [options]

Options:
  --mythology <name>    Target specific mythology (e.g., greek, norse, egyptian)
  --type <type>         Target specific entity type (deity, hero, creature, etc.)
  --limit <number>      Limit number of files to update
  --file <path>         Update a specific file
  --all                 Update ALL entity pages (use with caution!)
  --dry-run             Preview changes without modifying files
  --help, -h            Show this help message

Examples:
  # Update first 10 Greek deity pages
  node scripts/apply-hybrid-system.js --mythology greek --type deity --limit 10

  # Update specific file
  node scripts/apply-hybrid-system.js --file mythos/greek/deities/athena.html

  # Preview updates for Norse entities
  node scripts/apply-hybrid-system.js --mythology norse --dry-run

  # Update all Greek pages (careful!)
  node scripts/apply-hybrid-system.js --mythology greek
    `);
}

/**
 * Find entity files based on criteria
 */
function findEntityFiles(options) {
    const files = [];
    const mythosDir = path.join(CONFIG.baseDir, 'mythos');

    // Single file mode
    if (options.file) {
        const filePath = path.join(CONFIG.baseDir, options.file);
        if (fs.existsSync(filePath)) {
            return [filePath];
        } else {
            console.error(`File not found: ${filePath}`);
            return [];
        }
    }

    // Scan directory
    function scanDir(dir, mythology = null) {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Skip certain directories
                if (entry.name === 'FIREBASE' || entry.name === 'BACKUP_PRE_MIGRATION') {
                    continue;
                }

                // Track mythology from directory structure
                const currentMythology = mythology || (
                    fullPath.includes('mythos/') ? entry.name : null
                );

                scanDir(fullPath, currentMythology);
            } else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.endsWith('.backup')) {
                // Check if file matches criteria
                const relativePath = path.relative(CONFIG.baseDir, fullPath);

                // Filter by mythology
                if (options.mythology && !relativePath.includes(`mythos/${options.mythology}/`)) {
                    continue;
                }

                // Filter by type
                if (options.type && !relativePath.includes(`/${options.type}s/`) && !relativePath.includes(`/${options.type}/`)) {
                    continue;
                }

                // Check if already has hybrid system
                const content = fs.readFileSync(fullPath, 'utf-8');
                if (content.includes('dynamic-redirect.js')) {
                    if (CONFIG.verbose) {
                        console.log(`⏭️  Skipping (already updated): ${relativePath}`);
                    }
                    continue;
                }

                files.push(fullPath);

                // Respect limit
                if (options.limit && files.length >= options.limit) {
                    return files;
                }
            }
        }
    }

    // Start scanning
    if (options.mythology) {
        const mythologyDir = path.join(mythosDir, options.mythology);
        scanDir(mythologyDir, options.mythology);
    } else if (options.all) {
        scanDir(mythosDir);
    } else {
        console.error('Please specify --mythology, --file, or --all');
        return [];
    }

    return files;
}

/**
 * Extract entity information from file path
 */
function extractEntityInfo(filePath) {
    // Expected format: mythos/{mythology}/{type}s/{id}.html
    const relativePath = path.relative(CONFIG.baseDir, filePath);
    const match = relativePath.match(/mythos[/\\\\]([^/\\\\]+)[/\\\\]([^/\\\\]+)[/\\\\]([^/\\\\]+)\.html/);

    if (match) {
        return {
            mythology: match[1],
            typePlural: match[2],
            type: match[2].endsWith('s') ? match[2].slice(0, -1) : match[2],
            id: match[3]
        };
    }

    return null;
}

/**
 * Create backup of file
 */
function createBackup(filePath) {
    if (!fs.existsSync(CONFIG.backupDir)) {
        fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }

    const relativePath = path.relative(CONFIG.baseDir, filePath);
    const backupPath = path.join(CONFIG.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.copyFileSync(filePath, backupPath);

    if (CONFIG.verbose) {
        console.log(`💾 Backup created: ${backupPath}`);
    }
}

/**
 * Apply hybrid system to a file
 */
function applyHybridSystem(filePath, options) {
    // Extract entity info
    const entityInfo = extractEntityInfo(filePath);
    if (!entityInfo) {
        console.error(`❌ Could not extract entity info from: ${filePath}`);
        return false;
    }

    // Read file content
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if already updated
    if (content.includes('dynamic-redirect.js')) {
        if (CONFIG.verbose) {
            console.log(`⏭️  Already updated: ${path.relative(CONFIG.baseDir, filePath)}`);
        }
        return false;
    }

    // Create backup (unless dry run)
    if (!options.dryRun && !CONFIG.dryRun) {
        createBackup(filePath);
    }

    // Build metadata tags
    const metadataTags = `
<!-- Entity Metadata for Dynamic Loading -->
<meta name="mythology" content="${entityInfo.mythology}">
<meta name="entity-type" content="${entityInfo.type}">
<meta name="entity-id" content="${entityInfo.id}">
`;

    // Build script tag
    const scriptPath = '../'.repeat((filePath.match(/[/\\\\]/g) || []).length - 1) + 'js/dynamic-redirect.js';
    const scriptTag = `
<!-- Dynamic Redirect System (PHASE 4) -->
<script src="${scriptPath}"></script>`;

    // Insert metadata after viewport meta tag
    const viewportRegex = /<meta[^>]*viewport[^>]*>/i;
    if (viewportRegex.test(content)) {
        content = content.replace(viewportRegex, (match) => {
            return match + metadataTags;
        });
    } else {
        // Insert after first meta charset tag
        const charsetRegex = /<meta[^>]*charset[^>]*>/i;
        content = content.replace(charsetRegex, (match) => {
            return match + metadataTags;
        });
    }

    // Insert script before closing </head> or before first <style> tag
    const headCloseRegex = /<\/head>/i;
    if (headCloseRegex.test(content)) {
        content = content.replace(headCloseRegex, scriptTag + '\n</head>');
    } else {
        const styleRegex = /<style>/i;
        if (styleRegex.test(content)) {
            content = content.replace(styleRegex, scriptTag + '\n<style>');
        }
    }

    // Write updated content (unless dry run)
    if (!options.dryRun && !CONFIG.dryRun) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ Updated: ${path.relative(CONFIG.baseDir, filePath)}`);
    } else {
        console.log(`🔍 Would update: ${path.relative(CONFIG.baseDir, filePath)}`);
    }

    return true;
}

/**
 * Main execution
 */
function main() {
    console.log('🚀 Batch Update Script - Apply Hybrid Dynamic System\n');

    const options = parseArgs();

    if (options.help) {
        showHelp();
        return;
    }

    // Update config
    if (options.dryRun) {
        CONFIG.dryRun = true;
        console.log('⚠️  DRY RUN MODE - No files will be modified\n');
    }

    // Find files to update
    console.log('🔍 Scanning for entity files...\n');
    const files = findEntityFiles(options);

    if (files.length === 0) {
        console.log('❌ No files found matching criteria');
        return;
    }

    console.log(`\n📊 Found ${files.length} file(s) to update\n`);

    // Confirm if updating many files
    if (files.length > 20 && !options.dryRun && !CONFIG.dryRun) {
        console.warn(`⚠️  WARNING: About to update ${files.length} files!`);
        console.warn('   Consider running with --dry-run first to preview changes.\n');
        // In a real implementation, you'd want to add a confirmation prompt here
    }

    // Apply hybrid system to each file
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const filePath of files) {
        try {
            const updated = applyHybridSystem(filePath, options);
            if (updated) {
                successCount++;
            } else {
                skipCount++;
            }
        } catch (error) {
            console.error(`❌ Error updating ${filePath}:`, error.message);
            errorCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`⏭️  Skipped (already updated): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total files processed: ${files.length}`);
    console.log('='.repeat(60));

    if (!options.dryRun && !CONFIG.dryRun && successCount > 0) {
        console.log(`\n💾 Backups saved to: ${CONFIG.backupDir}`);
        console.log('✅ All changes have been applied!');
        console.log('\n📝 Next steps:');
        console.log('   1. Test the updated pages in a browser');
        console.log('   2. Verify dynamic redirect is working');
        console.log('   3. Check visual fidelity matches static version');
        console.log('   4. Monitor performance metrics');
    }
}

// Run the script
if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

module.exports = { applyHybridSystem, findEntityFiles, extractEntityInfo };
