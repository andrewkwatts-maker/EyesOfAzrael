#!/usr/bin/env node
/**
 * Final Link Fixer - Redirects remaining broken links to parent index pages
 * For content that doesn't exist, redirect to the most appropriate index
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_FILE = path.join(__dirname, 'link-report.json');
const FIX_LOG = path.join(__dirname, 'fix-log-final.json');

// Existing traditions
const TRADITIONS = [
    'greek', 'norse', 'egyptian', 'hindu', 'jewish', 'sumerian', 'babylonian',
    'chinese', 'buddhist', 'roman', 'christian', 'persian', 'celtic', 'tarot',
    'japanese', 'aztec', 'islamic', 'apocryphal', 'native_american', 'mayan', 'yoruba'
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

// Find best redirect for a broken link
function findRedirect(href, sourceFile) {
    // Handle mythos links - redirect to tradition index
    const mythosMatch = href.match(/mythos\/([^\/]+)\/(.+)/);
    if (mythosMatch) {
        const tradition = mythosMatch[1];
        const prefix = getRelativePrefix(sourceFile);

        // Try tradition index first
        const tradIndexHref = `${prefix}mythos/${tradition}/index.html`;
        const tradIndexPath = resolveLink(tradIndexHref, sourceFile);
        if (fileExists(tradIndexPath)) {
            return { newHref: tradIndexHref, fixType: 'tradition-index' };
        }

        // Fall back to mythos index
        const mythosIndexHref = `${prefix}mythos/index.html`;
        return { newHref: mythosIndexHref, fixType: 'mythos-index' };
    }

    // Handle archetype links
    const archetypeMatch = href.match(/archetypes\/([^\/]+)\/?(.*)$/);
    if (archetypeMatch) {
        const archetype = archetypeMatch[1];
        const prefix = getRelativePrefix(sourceFile);

        // Try specific archetype index
        const archIndexHref = `${prefix}archetypes/${archetype}/index.html`;
        const archIndexPath = resolveLink(archIndexHref, sourceFile);
        if (fileExists(archIndexPath)) {
            return { newHref: archIndexHref, fixType: 'archetype-index' };
        }

        // Fall back to archetypes index
        const archMainHref = `${prefix}archetypes/index.html`;
        return { newHref: archMainHref, fixType: 'archetypes-main' };
    }

    // Handle concepts, symbols, etc. - redirect to main index
    if (href.includes('concepts/') || href.includes('symbols/')) {
        const prefix = getRelativePrefix(sourceFile);
        return { newHref: `${prefix}index.html`, fixType: 'main-index' };
    }

    // Handle magic links
    const magicMatch = href.match(/magic\/([^\/]+)\/?(.*)$/);
    if (magicMatch) {
        const prefix = getRelativePrefix(sourceFile);
        const magicIndexHref = `${prefix}magic/index.html`;
        const magicIndexPath = resolveLink(magicIndexHref, sourceFile);
        if (fileExists(magicIndexPath)) {
            return { newHref: magicIndexHref, fixType: 'magic-index' };
        }
    }

    // Handle herbalism links
    if (href.includes('herbalism/')) {
        const prefix = getRelativePrefix(sourceFile);
        const herbIndexHref = `${prefix}herbalism/index.html`;
        const herbIndexPath = resolveLink(herbIndexHref, sourceFile);
        if (fileExists(herbIndexPath)) {
            return { newHref: herbIndexHref, fixType: 'herbalism-index' };
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
    console.log('🔧 Starting final link fixer...\\n');

    const report = loadReport();
    console.log(`📊 Processing ${report.brokenLinks.length} broken links\\n`);

    // Group by source file
    const byFile = {};
    let fixableCount = 0;
    let unfixableCount = 0;

    for (const link of report.brokenLinks) {
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
            byFile[link.sourceFile].push({
                ...link,
                newHref: null,
                fixType: null
            });
        }
    }

    console.log(`✅ Fixable: ${fixableCount}`);
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
    console.log('FINAL FIX SUMMARY');
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
    console.log(`\\n📝 Fix log saved to: scripts/fix-log-final.json`);

    return { totalFixed, totalFiles };
}

// Run
fixLinks();
