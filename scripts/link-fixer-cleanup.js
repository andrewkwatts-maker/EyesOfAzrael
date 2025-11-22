#!/usr/bin/env node
/**
 * Cleanup Link Fixer - Final pass with smart redirects
 * Excludes templates and handles sources/places links
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_FILE = path.join(__dirname, 'link-report.json');
const FIX_LOG = path.join(__dirname, 'fix-log-cleanup.json');

// Files to skip (templates, components, examples)
const SKIP_PATTERNS = [
    /\/components\//,
    /\/tests\//,
    /_dev\//,
    /template/i,
    /\.backup$/,
    /docs\//
];

// Load report
function loadReport() {
    if (!fs.existsSync(REPORT_FILE)) {
        console.error('❌ No link report found. Run link-checker.js first.');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
}

// Check if should skip this file
function shouldSkip(filePath) {
    return SKIP_PATTERNS.some(pattern => pattern.test(filePath));
}

// Check if file exists
function fileExists(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                return fs.existsSync(path.join(filePath, 'index.html'));
            }
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// Resolve link to absolute path
function resolveLink(href, sourceFile) {
    const sourceDir = path.dirname(sourceFile);
    if (href.startsWith('/')) {
        return path.join(ROOT_DIR, href);
    }
    return path.resolve(sourceDir, href);
}

// Get relative path prefix based on source depth
function getRelativePrefix(sourceFile) {
    const sourceDir = path.dirname(sourceFile);
    const sourceRel = path.relative(ROOT_DIR, sourceDir);
    const depth = sourceRel.split(path.sep).filter(p => p).length;
    return '../'.repeat(depth);
}

// Find redirect for broken link
function findRedirect(href, sourceFile) {
    const prefix = getRelativePrefix(sourceFile);

    // Skip template placeholders
    if (href.includes('{{') || href.includes('[') || href.includes('path/to')) {
        return null;
    }

    // Redirect sources/ to archetypes (for scholarly reference)
    if (href.includes('sources/')) {
        const archHref = `${prefix}archetypes/index.html`;
        return { newHref: archHref, fixType: 'sources-to-archetypes' };
    }

    // Redirect places/ to spiritual-places
    if (href.includes('places/') && !href.includes('spiritual-places/')) {
        const placesHref = `${prefix}spiritual-places/index.html`;
        return { newHref: placesHref, fixType: 'places-redirect' };
    }

    // Redirect items/ to spiritual-items
    if (href.includes('items/') && !href.includes('spiritual-items/')) {
        const itemsHref = `${prefix}spiritual-items/index.html`;
        return { newHref: itemsHref, fixType: 'items-redirect' };
    }

    // Handle specific file extensions we know don't exist
    if (href.endsWith('.jpg') || href.endsWith('.png') || href.endsWith('.gif')) {
        return null; // Skip image links
    }

    // Default: redirect to main index for remaining broken links
    if (!href.includes('components/') && !href.includes('tests/')) {
        return { newHref: `${prefix}index.html`, fixType: 'main-index-fallback' };
    }

    return null;
}

// Process file and fix links
function processFile(filePath, fixes) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fileFixLog = [];

    for (const fix of fixes) {
        if (fix.newHref && fix.href !== fix.newHref) {
            const escapedHref = fix.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(href\\s*=\\s*["'])${escapedHref}(["'])`, 'g');

            const newContent = content.replace(regex, `$1${fix.newHref}$2`);

            if (newContent !== content) {
                content = newContent;
                modified = true;
                fileFixLog.push({
                    old: fix.href,
                    new: fix.newHref,
                    fixType: fix.fixType
                });
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
    }

    return fileFixLog;
}

// Main function
function fixLinks() {
    console.log('🔧 Starting cleanup link fixer...\\n');

    const report = loadReport();
    console.log(`📊 Processing ${report.brokenLinks.length} broken links\\n`);

    // Group by source file
    const byFile = {};
    let fixableCount = 0;
    let skippedCount = 0;
    let unfixableCount = 0;

    for (const link of report.brokenLinks) {
        // Skip template/component files
        if (shouldSkip(link.sourceFile)) {
            skippedCount++;
            continue;
        }

        if (!byFile[link.sourceFile]) {
            byFile[link.sourceFile] = [];
        }

        const redirect = findRedirect(link.href, link.sourceFile);

        if (redirect) {
            fixableCount++;
            byFile[link.sourceFile].push({
                ...link,
                newHref: redirect.newHref,
                fixType: redirect.fixType
            });
        } else {
            unfixableCount++;
        }
    }

    console.log(`✅ Fixable: ${fixableCount}`);
    console.log(`⏭️  Skipped (templates): ${skippedCount}`);
    console.log(`⚠️  Unfixable: ${unfixableCount}\\n`);

    // Process each file
    const fixLog = {};
    let totalFixed = 0;
    let totalFiles = 0;

    for (const [filePath, fixes] of Object.entries(byFile)) {
        const fileFixLog = processFile(filePath, fixes);

        if (fileFixLog.length > 0) {
            const relPath = path.relative(ROOT_DIR, filePath);
            fixLog[relPath] = fileFixLog;
            totalFixed += fileFixLog.length;
            totalFiles++;
        }
    }

    // Print summary
    console.log('=' .repeat(60));
    console.log('CLEANUP FIX SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📁 Files modified: ${totalFiles}`);
    console.log(`🔗 Links fixed: ${totalFixed}`);

    // Count by fix type
    const byType = {};
    for (const fixes of Object.values(fixLog)) {
        for (const fix of fixes) {
            byType[fix.fixType] = (byType[fix.fixType] || 0) + 1;
        }
    }

    console.log('\\n📊 Fixes by type:');
    for (const [type, count] of Object.entries(byType)) {
        console.log(`   ${type}: ${count}`);
    }

    // Save fix log
    fs.writeFileSync(FIX_LOG, JSON.stringify(fixLog, null, 2));
    console.log(`\\n📝 Fix log saved to: scripts/fix-log-cleanup.json`);

    return { totalFixed, totalFiles };
}

// Run
fixLinks();
