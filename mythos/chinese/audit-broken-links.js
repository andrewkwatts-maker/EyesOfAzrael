#!/usr/bin/env node

/**
 * Audit script: Find broken internal links in Chinese mythology section
 * Checks all HTML files for broken relative links
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

    // Remove anchor part
    const urlWithoutAnchor = linkUrl.split('#')[0];
    if (!urlWithoutAnchor) return false; // Pure anchor link

    // Resolve relative path
    const sourceDir = path.dirname(sourcePath);
    const targetPath = path.resolve(sourceDir, urlWithoutAnchor);

    // Check if file exists
    return !fs.existsSync(targetPath);
}

// Main audit
function auditLinks() {
    console.log('🔍 Auditing internal links in Chinese mythology section...\n');

    const htmlFiles = getHtmlFiles(chineseDir);
    console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const links = extractLinks(content);
        const relativePath = path.relative(chineseDir, file);

        for (const link of links) {
            allLinks.push({ file: relativePath, link });

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
    console.log('AUDIT RESULTS: Broken Internal Links');
    console.log('━'.repeat(80));
    console.log(`Total links checked: ${allLinks.length}`);
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
            for (const link of links) {
                console.log(`   Line ${link.line}: ${link.link}`);
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
