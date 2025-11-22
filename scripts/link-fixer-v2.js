#!/usr/bin/env node
/**
 * Enhanced Link Fixer Script v2
 * Handles path variations, redirects, and comments out truly missing links
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_FILE = path.join(__dirname, 'link-report.json');
const FIX_LOG = path.join(__dirname, 'fix-log-v2.json');

// Path variations to try
const PATH_VARIATIONS = {
    'beings': ['creatures', 'deities', 'spirits', 'entities'],
    'creatures': ['beings', 'spirits', 'entities'],
    'figures': ['heroes', 'deities', 'characters', 'people'],
    'heroes': ['figures', 'characters', 'people'],
    'deities': ['gods', 'figures', 'beings'],
    'gods': ['deities', 'figures'],
    'characters': ['figures', 'heroes'],
    'people': ['figures', 'heroes'],
    'spirits': ['beings', 'creatures', 'deities'],
    'abrahamic': ['christian', 'jewish', 'islamic'],
    'zoroastrian': ['persian']
};

// Traditions that exist
const EXISTING_TRADITIONS = [
    'greek', 'norse', 'egyptian', 'hindu', 'jewish', 'sumerian', 'babylonian',
    'chinese', 'buddhist', 'roman', 'christian', 'persian', 'celtic', 'tarot',
    'japanese', 'aztec', 'islamic', 'apocryphal', 'native_american', 'native-american'
];

// Load report
function loadReport() {
    if (!fs.existsSync(REPORT_FILE)) {
        console.error('❌ No link report found. Run link-checker.js first.');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
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

// Try to find an alternative path that exists
function findAlternativePath(href, sourceFile) {
    const parts = href.split('/');

    // Try path variations
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].toLowerCase();
        if (PATH_VARIATIONS[part]) {
            for (const alt of PATH_VARIATIONS[part]) {
                const newParts = [...parts];
                newParts[i] = alt;
                const newHref = newParts.join('/');
                const resolved = resolveLink(newHref, sourceFile);
                if (fileExists(resolved)) {
                    return newHref;
                }
            }
        }
    }

    // Try adding index.html
    if (!href.endsWith('.html') && !href.endsWith('/')) {
        const withIndex = href + '/index.html';
        const resolved = resolveLink(withIndex, sourceFile);
        if (fileExists(resolved)) {
            return withIndex;
        }
    }

    // Try without the last path segment (go to parent index)
    const parentParts = href.split('/');
    parentParts.pop();
    if (parentParts.length > 0) {
        const parentHref = parentParts.join('/') + '/index.html';
        const resolved = resolveLink(parentHref, sourceFile);
        if (fileExists(resolved)) {
            return parentHref;
        }
    }

    return null;
}

// Resolve link to absolute path
function resolveLink(href, sourceFile) {
    const sourceDir = path.dirname(sourceFile);
    if (href.startsWith('/')) {
        return path.join(ROOT_DIR, href);
    }
    return path.resolve(sourceDir, href);
}

// Check if link is to a non-existent tradition
function isNonExistentTradition(href) {
    const match = href.match(/mythos\/([^\/]+)\//);
    if (match) {
        const tradition = match[1].toLowerCase();
        return !EXISTING_TRADITIONS.includes(tradition);
    }
    return false;
}

// Get the tradition's index page as fallback
function getTraditionIndex(href, sourceFile) {
    const match = href.match(/mythos\/([^\/]+)\//);
    if (match) {
        const tradition = match[1];
        // Calculate relative path to mythos index
        const sourceDir = path.dirname(sourceFile);
        const sourceRel = path.relative(ROOT_DIR, sourceDir);
        const depth = sourceRel.split(path.sep).filter(p => p).length;
        const prefix = '../'.repeat(depth);

        // Try the tradition index first
        const tradIndexPath = `${prefix}mythos/${tradition}/index.html`;
        const resolved = resolveLink(tradIndexPath, sourceFile);
        if (fileExists(resolved)) {
            return tradIndexPath;
        }

        // Fallback to main mythos index
        return `${prefix}mythos/index.html`;
    }
    return null;
}

// Fix archetype links
function fixArchetypeLink(href, sourceFile) {
    // Add index.html to archetype folder links
    if (href.includes('archetypes/') && !href.endsWith('.html') && !href.endsWith('/')) {
        const withIndex = href + '/index.html';
        const resolved = resolveLink(withIndex, sourceFile);
        if (fileExists(resolved)) {
            return withIndex;
        }

        // Try with trailing slash and index
        const withSlashIndex = href + '/index.html';
        const resolvedSlash = resolveLink(withSlashIndex, sourceFile);
        if (fileExists(resolvedSlash)) {
            return withSlashIndex;
        }
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
    console.log('🔧 Starting enhanced link fixer v2...\n');

    const report = loadReport();
    console.log(`📊 Processing ${report.brokenLinks.length} broken links\n`);

    // Group by source file
    const byFile = {};
    let fixableCount = 0;
    let unfixableCount = 0;

    for (const link of report.brokenLinks) {
        if (!byFile[link.sourceFile]) {
            byFile[link.sourceFile] = [];
        }

        let newHref = null;
        let fixType = null;

        // Try archetype fix first
        if (link.category === 'archetype-missing-index' || link.href.includes('archetypes/')) {
            newHref = fixArchetypeLink(link.href, link.sourceFile);
            if (newHref) fixType = 'archetype-index';
        }

        // Try path variations
        if (!newHref) {
            newHref = findAlternativePath(link.href, link.sourceFile);
            if (newHref) fixType = 'path-variation';
        }

        // For non-existent traditions, redirect to tradition/mythos index
        if (!newHref && isNonExistentTradition(link.href)) {
            newHref = getTraditionIndex(link.href, link.sourceFile);
            if (newHref) fixType = 'tradition-redirect';
        }

        if (newHref) {
            fixableCount++;
        } else {
            unfixableCount++;
        }

        byFile[link.sourceFile].push({
            ...link,
            newHref,
            fixType
        });
    }

    console.log(`✅ Fixable: ${fixableCount}`);
    console.log(`⚠️  Unfixable (will be left as-is): ${unfixableCount}\n`);

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
    console.log('FIX SUMMARY v2');
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

    console.log('\n📊 Fixes by type:');
    for (const [type, count] of Object.entries(byType)) {
        console.log(`   ${type}: ${count}`);
    }

    // Save fix log
    fs.writeFileSync(FIX_LOG, JSON.stringify(fixLog, null, 2));
    console.log(`\n📝 Fix log saved to: scripts/fix-log-v2.json`);

    return { totalFixed, totalFiles };
}

// Run
fixLinks();
