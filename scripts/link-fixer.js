#!/usr/bin/env node
/**
 * Link Fixer Script for EyesOfAzrael
 * Automatically fixes common broken link patterns
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_FILE = path.join(__dirname, 'link-report.json');
const FIX_LOG = path.join(__dirname, 'fix-log.json');

// Load the link report
function loadReport() {
    if (!fs.existsSync(REPORT_FILE)) {
        console.error('❌ No link report found. Run link-checker.js first.');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
}

// Get all existing HTML files for fuzzy matching
function buildFileIndex() {
    const index = new Map();

    function scan(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scan(fullPath);
            } else if (entry.name.endsWith('.html')) {
                const relPath = path.relative(ROOT_DIR, fullPath);
                const baseName = entry.name.replace('.html', '').toLowerCase();

                if (!index.has(baseName)) {
                    index.set(baseName, []);
                }
                index.get(baseName).push(relPath);
            }
        }
    }

    scan(ROOT_DIR);
    return index;
}

// Fix corpus-results links
function fixCorpusResultsLink(href, sourceFile) {
    // Extract tradition and term from corpus-results/tradition/term.html
    const match = href.match(/corpus-results\/([^\/]+)\/([^\.]+)\.html/);
    if (!match) return null;

    const tradition = match[1];
    const term = match[2].replace(/-/g, ' ');

    // Calculate relative path to corpus-search
    const sourceDir = path.dirname(sourceFile);
    const sourceRel = path.relative(ROOT_DIR, sourceDir);
    const depth = sourceRel.split(path.sep).filter(p => p).length;
    const prefix = '../'.repeat(depth);

    return `${prefix}mythos/${tradition}/corpus-search.html?term=${encodeURIComponent(term)}`;
}

// Fix archetype links missing index.html
function fixArchetypeLink(href) {
    if (href.endsWith('/')) {
        return href + 'index.html';
    }
    // Check if it's a directory path without extension
    if (!href.includes('.') || (!href.endsWith('.html') && !href.endsWith('.css') && !href.endsWith('.js'))) {
        return href + '/index.html';
    }
    return null;
}

// Fix directory links
function fixDirectoryLink(href) {
    if (href.endsWith('/')) {
        return href + 'index.html';
    }
    return null;
}

// Try to find a similar file
function findSimilarFile(href, sourceFile, fileIndex) {
    // Extract the filename without extension
    const baseName = path.basename(href).replace('.html', '').toLowerCase();

    // Check if we have any files with this name
    if (fileIndex.has(baseName)) {
        const candidates = fileIndex.get(baseName);

        // Find the best match based on path similarity
        const sourceDir = path.dirname(sourceFile);
        let bestMatch = null;
        let bestScore = -1;

        for (const candidate of candidates) {
            // Score based on common path segments
            const candidateParts = candidate.split(path.sep);
            const hrefParts = href.split('/').filter(p => p && p !== '..');

            let score = 0;
            for (const part of hrefParts) {
                if (candidateParts.includes(part)) {
                    score++;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        }

        if (bestMatch) {
            // Calculate relative path from source file
            const sourceRel = path.relative(ROOT_DIR, sourceDir);
            const targetPath = path.relative(sourceRel, bestMatch);
            return targetPath;
        }
    }

    return null;
}

// Process a single file
function processFile(filePath, fixes) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fileFixLog = [];

    for (const fix of fixes) {
        if (fix.newHref && fix.href !== fix.newHref) {
            // Create regex to find and replace the specific href
            const escapedHref = fix.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(href\\s*=\\s*["'])${escapedHref}(["'])`, 'g');

            const newContent = content.replace(regex, `$1${fix.newHref}$2`);

            if (newContent !== content) {
                content = newContent;
                modified = true;
                fileFixLog.push({
                    old: fix.href,
                    new: fix.newHref,
                    category: fix.category
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
    console.log('🔧 Starting link fixer...\n');

    const report = loadReport();
    const fileIndex = buildFileIndex();

    console.log(`📊 Loaded report with ${report.brokenLinks.length} broken links`);
    console.log(`📁 Built index with ${fileIndex.size} unique file names\n`);

    // Group broken links by source file
    const byFile = {};
    for (const link of report.brokenLinks) {
        if (!byFile[link.sourceFile]) {
            byFile[link.sourceFile] = [];
        }

        // Determine fix based on category
        let newHref = null;

        switch (link.category) {
            case 'corpus-results':
                newHref = fixCorpusResultsLink(link.href, link.sourceFile);
                break;

            case 'archetype-missing-index':
                newHref = fixArchetypeLink(link.href);
                break;

            case 'directory-link':
                newHref = fixDirectoryLink(link.href);
                break;

            case 'missing-extension':
                newHref = link.href + '.html';
                break;

            case 'missing-file':
                // Try fuzzy matching
                newHref = findSimilarFile(link.href, link.sourceFile, fileIndex);
                break;
        }

        byFile[link.sourceFile].push({
            ...link,
            newHref
        });
    }

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
    console.log('FIX SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📁 Files modified: ${totalFiles}`);
    console.log(`🔗 Links fixed: ${totalFixed}`);

    // Count fixes by category
    const byCat = {};
    for (const fixes of Object.values(fixLog)) {
        for (const fix of fixes) {
            byCat[fix.category] = (byCat[fix.category] || 0) + 1;
        }
    }

    console.log('\n📊 Fixes by category:');
    for (const [cat, count] of Object.entries(byCat)) {
        console.log(`   ${cat}: ${count}`);
    }

    // Save fix log
    fs.writeFileSync(FIX_LOG, JSON.stringify(fixLog, null, 2));
    console.log(`\n📝 Fix log saved to: scripts/fix-log.json`);

    return { totalFixed, totalFiles, fixLog };
}

// Run
fixLinks();
