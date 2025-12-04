// Greek Mythology Section - Link Audit Script
// Checks all internal links within mythos/greek/ directory

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const results = {
    brokenLinks: [],
    workingLinks: [],
    externalLinks: [],
    totalFiles: 0,
    totalLinks: 0
};

// Get all HTML files recursively
function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Extract all links from HTML content
function extractLinks(html, sourceFile) {
    const links = [];

    // Match href attributes
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1];

        // Skip anchors, javascript, mailto, etc.
        if (href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')) {
            continue;
        }

        links.push({
            href,
            source: sourceFile,
            isExternal: href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')
        });
    }

    return links;
}

// Check if a relative link target exists
function checkLink(link, sourceFile) {
    if (link.isExternal) {
        results.externalLinks.push({
            source: path.relative(baseDir, sourceFile),
            target: link.href
        });
        return true;
    }

    // Resolve relative path
    const sourceDir = path.dirname(sourceFile);
    let targetPath = link.href;

    // Remove query strings and hash fragments
    targetPath = targetPath.split('?')[0].split('#')[0];

    // Skip empty links
    if (!targetPath || targetPath === '') {
        return true;
    }

    // Handle absolute paths from site root
    if (targetPath.startsWith('../../')) {
        // These are links outside greek section - we'll validate they exist
        const fullPath = path.resolve(sourceDir, targetPath);
        const exists = fs.existsSync(fullPath);

        if (exists) {
            results.workingLinks.push({
                source: path.relative(baseDir, sourceFile),
                target: link.href,
                type: 'external-to-greek'
            });
        } else {
            results.brokenLinks.push({
                source: path.relative(baseDir, sourceFile),
                target: link.href,
                resolvedPath: fullPath,
                type: 'external-to-greek'
            });
        }

        return exists;
    }

    // Resolve the target file path
    const fullTargetPath = path.resolve(sourceDir, targetPath);
    const exists = fs.existsSync(fullTargetPath);

    if (exists) {
        results.workingLinks.push({
            source: path.relative(baseDir, sourceFile),
            target: link.href,
            type: 'internal'
        });
    } else {
        results.brokenLinks.push({
            source: path.relative(baseDir, sourceFile),
            target: link.href,
            resolvedPath: fullTargetPath,
            type: 'internal'
        });
    }

    return exists;
}

// Main audit function
function auditLinks() {
    console.log('Starting Greek Mythology Link Audit...\n');

    const htmlFiles = getHtmlFiles(baseDir);
    results.totalFiles = htmlFiles.length;

    console.log(`Found ${htmlFiles.length} HTML files\n`);

    htmlFiles.forEach(file => {
        const html = fs.readFileSync(file, 'utf8');
        const links = extractLinks(html, file);

        results.totalLinks += links.length;

        links.forEach(link => {
            checkLink(link, file);
        });
    });

    // Print results
    console.log('='.repeat(80));
    console.log('LINK AUDIT RESULTS');
    console.log('='.repeat(80));
    console.log(`\nTotal HTML files scanned: ${results.totalFiles}`);
    console.log(`Total links found: ${results.totalLinks}`);
    console.log(`Working internal links: ${results.workingLinks.filter(l => l.type === 'internal').length}`);
    console.log(`Working external-to-greek links: ${results.workingLinks.filter(l => l.type === 'external-to-greek').length}`);
    console.log(`External links (not checked): ${results.externalLinks.length}`);
    console.log(`\n🔴 BROKEN LINKS: ${results.brokenLinks.length}\n`);

    if (results.brokenLinks.length > 0) {
        console.log('BROKEN LINKS DETAILS:');
        console.log('-'.repeat(80));

        // Group by source file
        const bySource = {};
        results.brokenLinks.forEach(link => {
            if (!bySource[link.source]) {
                bySource[link.source] = [];
            }
            bySource[link.source].push(link);
        });

        Object.keys(bySource).sort().forEach(source => {
            console.log(`\n📄 ${source}`);
            bySource[source].forEach(link => {
                console.log(`   ❌ ${link.target}`);
                console.log(`      → Resolved to: ${link.resolvedPath}`);
            });
        });
    } else {
        console.log('✅ No broken links found!');
    }

    // Save detailed report
    const reportPath = path.join(baseDir, 'audit-report-links.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
}

// Run the audit
auditLinks();