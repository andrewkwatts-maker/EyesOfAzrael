#!/usr/bin/env node
/**
 * Link Checker Script for EyesOfAzrael
 * Scans all HTML files and validates internal links
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_FILE = path.join(__dirname, 'link-report.json');

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'scripts', 'tests'];

// Collect all HTML files
function getAllHtmlFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!SKIP_DIRS.includes(entry.name)) {
                getAllHtmlFiles(fullPath, files);
            }
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Extract links from HTML content
function extractLinks(content, filePath) {
    const links = [];

    // Match href attributes
    const hrefRegex = /href\s*=\s*["']([^"'#][^"']*?)["']/gi;
    let match;

    while ((match = hrefRegex.exec(content)) !== null) {
        const href = match[1];

        // Skip external links, javascript, mailto, tel
        if (href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('data:') ||
            href.startsWith('#')) {
            continue;
        }

        links.push({
            href: href,
            sourceFile: filePath,
            lineNumber: content.substring(0, match.index).split('\n').length
        });
    }

    // Match src attributes for images/scripts
    const srcRegex = /src\s*=\s*["']([^"'#][^"']*?)["']/gi;

    while ((match = srcRegex.exec(content)) !== null) {
        const src = match[1];

        if (src.startsWith('http://') ||
            src.startsWith('https://') ||
            src.startsWith('data:')) {
            continue;
        }

        links.push({
            href: src,
            sourceFile: filePath,
            lineNumber: content.substring(0, match.index).split('\n').length,
            isResource: true
        });
    }

    return links;
}

// Resolve relative path to absolute
function resolveLink(href, sourceFile) {
    const sourceDir = path.dirname(sourceFile);

    // Handle absolute paths (starting with /)
    if (href.startsWith('/')) {
        return path.join(ROOT_DIR, href);
    }

    // Handle relative paths
    return path.resolve(sourceDir, href);
}

// Check if a file exists
function fileExists(filePath) {
    // Remove query string and hash
    const cleanPath = filePath.split('?')[0].split('#')[0];

    try {
        // Check if it's a directory with index.html
        if (fs.existsSync(cleanPath)) {
            const stats = fs.statSync(cleanPath);
            if (stats.isDirectory()) {
                return fs.existsSync(path.join(cleanPath, 'index.html'));
            }
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// Categorize broken links
function categorizeLink(link) {
    const href = link.href;

    if (href.includes('corpus-results/')) {
        return 'corpus-results';
    }
    if (href.includes('archetypes/') && !href.includes('index.html')) {
        return 'archetype-missing-index';
    }
    if (href.endsWith('/')) {
        return 'directory-link';
    }
    if (!href.endsWith('.html') && !href.endsWith('.css') && !href.endsWith('.js') && !href.includes('.')) {
        return 'missing-extension';
    }
    return 'missing-file';
}

// Main function
function checkLinks() {
    console.log('🔍 Starting link check...\n');

    const htmlFiles = getAllHtmlFiles(ROOT_DIR);
    console.log(`📄 Found ${htmlFiles.length} HTML files\n`);

    const brokenLinks = [];
    const validLinks = [];
    const allLinks = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const links = extractLinks(content, file);

        for (const link of links) {
            const resolvedPath = resolveLink(link.href, link.sourceFile);
            const exists = fileExists(resolvedPath);

            allLinks.push({
                ...link,
                resolvedPath,
                exists
            });

            if (exists) {
                validLinks.push(link);
            } else {
                const category = categorizeLink(link);
                brokenLinks.push({
                    ...link,
                    resolvedPath,
                    category
                });
            }
        }
    }

    // Group broken links by category
    const byCategory = {};
    for (const link of brokenLinks) {
        if (!byCategory[link.category]) {
            byCategory[link.category] = [];
        }
        byCategory[link.category].push(link);
    }

    // Group by source file
    const byFile = {};
    for (const link of brokenLinks) {
        const relPath = path.relative(ROOT_DIR, link.sourceFile);
        if (!byFile[relPath]) {
            byFile[relPath] = [];
        }
        byFile[relPath].push(link);
    }

    // Print summary
    console.log('=' .repeat(60));
    console.log('LINK CHECK SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Valid links: ${validLinks.length}`);
    console.log(`❌ Broken links: ${brokenLinks.length}`);
    console.log('');

    console.log('📊 Broken links by category:');
    for (const [category, links] of Object.entries(byCategory)) {
        console.log(`   ${category}: ${links.length}`);
    }
    console.log('');

    // Print top files with broken links
    console.log('📁 Top files with broken links:');
    const sortedFiles = Object.entries(byFile)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);

    for (const [file, links] of sortedFiles) {
        console.log(`   ${file}: ${links.length} broken`);
    }
    console.log('');

    // Print sample broken links
    console.log('🔗 Sample broken links:');
    const samples = brokenLinks.slice(0, 20);
    for (const link of samples) {
        const relSource = path.relative(ROOT_DIR, link.sourceFile);
        console.log(`   [${link.category}] ${relSource}:${link.lineNumber}`);
        console.log(`      href="${link.href}"`);
    }

    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: htmlFiles.length,
            validLinks: validLinks.length,
            brokenLinks: brokenLinks.length
        },
        byCategory,
        byFile,
        brokenLinks
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`\n📝 Full report saved to: scripts/link-report.json`);

    return report;
}

// Run
checkLinks();
