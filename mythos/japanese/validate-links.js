const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = __dirname;
const RESULTS = {
    brokenLinks: [],
    externalLinks: [],
    totalLinks: 0,
    totalPages: 0
};

// Helper: Check if file exists
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
}

// Helper: Find all HTML files recursively
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Helper: Extract links from HTML content
function extractLinks(content) {
    const linkRegex = /(?:href|src)=["']([^"']+)["']/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
        links.push(match[1]);
    }

    return links;
}

// Helper: Resolve relative path
function resolveLink(fromFile, link) {
    // Skip external URLs
    if (link.startsWith('http://') || link.startsWith('https://')) {
        return { type: 'external', url: link };
    }

    // Skip anchors, mailto, javascript
    if (link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
        return { type: 'skip', url: link };
    }

    // Remove query strings and anchors
    const cleanLink = link.split('?')[0].split('#')[0];
    if (!cleanLink) return { type: 'skip', url: link };

    // Resolve relative path
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, cleanLink);

    return { type: 'internal', url: link, resolvedPath };
}

// Main validation function
function validateLinks() {
    console.log('\n=== Japanese Mythology Link Validator ===\n');

    const htmlFiles = findHtmlFiles(BASE_DIR);
    RESULTS.totalPages = htmlFiles.length;

    console.log(`Found ${htmlFiles.length} HTML files to check\n`);

    htmlFiles.forEach(filePath => {
        const relativePath = path.relative(BASE_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const links = extractLinks(content);

        links.forEach(link => {
            RESULTS.totalLinks++;
            const resolved = resolveLink(filePath, link);

            if (resolved.type === 'internal') {
                if (!fileExists(resolved.resolvedPath)) {
                    RESULTS.brokenLinks.push({
                        file: relativePath,
                        link: link,
                        resolved: resolved.resolvedPath
                    });
                }
            } else if (resolved.type === 'external') {
                RESULTS.externalLinks.push({
                    file: relativePath,
                    url: resolved.url
                });
            }
        });
    });

    // Print results
    console.log('=== RESULTS ===\n');
    console.log(`Total pages scanned: ${RESULTS.totalPages}`);
    console.log(`Total links checked: ${RESULTS.totalLinks}`);
    console.log(`Broken internal links: ${RESULTS.brokenLinks.length}`);
    console.log(`External links found: ${RESULTS.externalLinks.length}\n`);

    if (RESULTS.brokenLinks.length > 0) {
        console.log('=== BROKEN LINKS ===\n');
        RESULTS.brokenLinks.forEach((broken, index) => {
            console.log(`${index + 1}. ${broken.file}`);
            console.log(`   Link: ${broken.link}`);
            console.log(`   Resolved to: ${broken.resolved}`);
            console.log('');
        });
    } else {
        console.log('✓ No broken internal links found!\n');
    }

    // Save results to JSON
    const reportPath = path.join(BASE_DIR, 'link-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
    console.log(`Full report saved to: ${reportPath}\n`);

    return RESULTS.brokenLinks.length === 0;
}

// Run validation
const success = validateLinks();
process.exit(success ? 0 : 1);
