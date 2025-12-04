#!/usr/bin/env node

/**
 * Audit script v2: Find REAL broken internal links in Chinese mythology section
 * Ignores query strings and focuses on actual file paths
 */

const fs = require('fs');
const path = require('path');

const chineseDir = path.join(__dirname);
const brokenLinks = [];
const allLinks = [];

// Recursively get all HTML files
function getHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Extract links from HTML content
function extractLinks(content) {
    const linkPattern = /(?:href|src)=["']([^"']+)["']/g;
    const links = [];
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
        links.push(match[1]);
    }

    return links;
}

// Check if a link is broken
function isLinkBroken(sourcePath, linkUrl) {
    // Skip external links, anchors, and special URLs
    if (linkUrl.startsWith('http://') ||
        linkUrl.startsWith('https://') ||
        linkUrl.startsWith('#') ||
        linkUrl.startsWith('mailto:') ||
        linkUrl.startsWith('javascript:')) {
        return false;
    }

    // Remove query string AND anchor part for file checking
    const urlWithoutQuery = linkUrl.split('?')[0].split('#')[0];
    if (!urlWithoutQuery) return false; // Pure anchor/query link

    // Resolve relative path
    const sourceDir = path.dirname(sourcePath);
    const targetPath = path.resolve(sourceDir, urlWithoutQuery);

    // Check if file exists
    return !fs.existsSync(targetPath);
}

// Main audit
function auditLinks() {
    console.log('🔍 Auditing REAL broken links in Chinese mythology section...\n');

    const htmlFiles = getHtmlFiles(chineseDir);
    console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const links = extractLinks(content);
        const relativePath = path.relative(chineseDir, file);

        for (const link of links) {
            // Remove query string for counting unique links
            const linkWithoutQuery = link.split('?')[0];
            allLinks.push({ file: relativePath, link: linkWithoutQuery });

            if (isLinkBroken(file, link)) {
                brokenLinks.push({
                    file: relativePath,
                    link: link,
                    line: content.split('\n').findIndex(line => line.includes(link)) + 1
                });
            }
        }
    }

    // Report results
    console.log('━'.repeat(80));
    console.log('AUDIT RESULTS: Real Broken Internal Links');
    console.log('━'.repeat(80));
    console.log(`Total unique file links checked: ${new Set(allLinks.map(l => l.link)).size}`);
    console.log(`Broken links found: ${brokenLinks.length}\n`);

    if (brokenLinks.length > 0) {
        console.log('❌ BROKEN LINKS:\n');

        // Group by file
        const byFile = {};
        for (const broken of brokenLinks) {
            if (!byFile[broken.file]) {
                byFile[broken.file] = [];
            }
            byFile[broken.file].push(broken);
        }

        for (const [file, links] of Object.entries(byFile)) {
            console.log(`\n📄 ${file}`);
            const uniqueLinks = [...new Set(links.map(l => l.link))];
            for (const link of uniqueLinks) {
                console.log(`   ${link}`);
            }
        }

        console.log('\n' + '━'.repeat(80));
        console.log(`\n⚠️  Found ${brokenLinks.length} broken link(s) that need fixing!\n`);
    } else {
        console.log('✅ No broken links found! All internal links are valid.\n');
    }
}

// Run audit
try {
    auditLinks();
} catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
}
