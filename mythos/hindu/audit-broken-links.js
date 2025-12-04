/**
 * Hindu Mythology - Broken Link Checker
 * Audits all HTML files in mythos/hindu/ for broken internal links
 */

const fs = require('fs');
const path = require('path');

// Store all findings
const findings = {
    brokenLinks: [],
    missingFiles: new Set(),
    validLinks: 0,
    totalLinks: 0,
    filesChecked: 0
};

// Get all HTML files recursively
function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Extract all internal links from HTML content
function extractLinks(content, filePath) {
    const links = [];

    // Match href attributes (but not external links or anchors)
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = hrefRegex.exec(content)) !== null) {
        const href = match[1];

        // Skip external links, anchors, and corpus-search
        if (href.startsWith('http') ||
            href.startsWith('mailto:') ||
            href.startsWith('#') ||
            href === '' ||
            href.includes('corpus-search.html')) {
            continue;
        }

        links.push({
            href,
            fullMatch: match[0],
            sourceFile: filePath
        });
    }

    return links;
}

// Resolve relative path to absolute
function resolvePath(fromFile, linkPath) {
    const fromDir = path.dirname(fromFile);

    // Handle anchor links
    if (linkPath.includes('#')) {
        linkPath = linkPath.split('#')[0];
        if (!linkPath) return null; // Pure anchor link
    }

    // Handle query strings
    if (linkPath.includes('?')) {
        linkPath = linkPath.split('?')[0];
    }

    const resolved = path.resolve(fromDir, linkPath);
    return resolved;
}

// Check if link target exists
function checkLink(link) {
    findings.totalLinks++;

    const targetPath = resolvePath(link.sourceFile, link.href);

    if (!targetPath) {
        findings.validLinks++;
        return true; // Pure anchor or query
    }

    if (fs.existsSync(targetPath)) {
        findings.validLinks++;
        return true;
    } else {
        findings.brokenLinks.push({
            source: path.relative(process.cwd(), link.sourceFile),
            href: link.href,
            resolved: path.relative(process.cwd(), targetPath)
        });
        findings.missingFiles.add(path.relative(process.cwd(), targetPath));
        return false;
    }
}

// Main audit function
function auditHinduLinks() {
    console.log('🔍 HINDU MYTHOLOGY - BROKEN LINK AUDIT\n');
    console.log('=' .repeat(60));

    const hinduDir = path.resolve(__dirname);
    const htmlFiles = getAllHtmlFiles(hinduDir);

    console.log(`\n📄 Found ${htmlFiles.length} HTML files to check\n`);

    // Check each file
    htmlFiles.forEach(file => {
        findings.filesChecked++;
        const content = fs.readFileSync(file, 'utf-8');
        const links = extractLinks(content, file);

        links.forEach(link => checkLink(link));
    });

    // Report results
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT RESULTS\n');
    console.log(`Files Checked: ${findings.filesChecked}`);
    console.log(`Total Links: ${findings.totalLinks}`);
    console.log(`Valid Links: ${findings.validLinks}`);
    console.log(`Broken Links: ${findings.brokenLinks.length}`);

    if (findings.brokenLinks.length > 0) {
        console.log('\n❌ BROKEN LINKS FOUND:\n');
        console.log('='.repeat(60));

        // Group by source file
        const byFile = {};
        findings.brokenLinks.forEach(link => {
            if (!byFile[link.source]) {
                byFile[link.source] = [];
            }
            byFile[link.source].push(link);
        });

        Object.entries(byFile).forEach(([file, links]) => {
            console.log(`\n📄 ${file}`);
            links.forEach(link => {
                console.log(`   ❌ ${link.href}`);
                console.log(`      → Resolves to: ${link.resolved}`);
            });
        });

        console.log('\n\n📋 MISSING FILES:\n');
        console.log('='.repeat(60));
        Array.from(findings.missingFiles).sort().forEach(file => {
            console.log(`   ❌ ${file}`);
        });
    } else {
        console.log('\n✅ NO BROKEN LINKS FOUND!');
    }

    console.log('\n' + '='.repeat(60));

    // Save detailed report
    const reportPath = path.join(__dirname, 'audit-report-links.json');
    fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
    console.log(`\n💾 Detailed report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

// Run the audit
auditHinduLinks();
