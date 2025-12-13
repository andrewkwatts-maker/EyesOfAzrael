const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const celticDir = path.join(__dirname);
const results = {
    brokenLinks: [],
    externalLinks: [],
    workingLinks: [],
    totalFiles: 0
};

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

function checkLinks(htmlFile) {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;
    const links = document.querySelectorAll('a[href]');
    const fileDir = path.dirname(htmlFile);

    links.forEach(link => {
        const href = link.getAttribute('href');

        // Skip anchors, external links, and javascript
        if (href.startsWith('#') || href.startsWith('javascript:')) {
            return;
        }

        if (href.startsWith('http://') || href.startsWith('https://')) {
            results.externalLinks.push({
                file: htmlFile,
                link: href
            });
            return;
        }

        // Resolve relative path
        let targetPath;
        if (href.startsWith('/')) {
            // Absolute path from root
            targetPath = path.join(__dirname, '..', '..', href);
        } else {
            // Relative path
            targetPath = path.resolve(fileDir, href.split('#')[0]);
        }

        // Check if file exists
        if (!fs.existsSync(targetPath)) {
            results.brokenLinks.push({
                file: htmlFile,
                link: href,
                resolvedPath: targetPath
            });
        } else {
            results.workingLinks.push({
                file: htmlFile,
                link: href
            });
        }
    });
}

// Main execution
const htmlFiles = getAllHtmlFiles(celticDir);
results.totalFiles = htmlFiles.length;

console.log(`Found ${htmlFiles.length} HTML files in Celtic directory\n`);

htmlFiles.forEach(file => {
    checkLinks(file);
});

// Output results
console.log('=== LINK AUDIT RESULTS ===\n');
console.log(`Total files checked: ${results.totalFiles}`);
console.log(`Working internal links: ${results.workingLinks.length}`);
console.log(`External links: ${results.externalLinks.length}`);
console.log(`Broken links: ${results.brokenLinks.length}\n`);

if (results.brokenLinks.length > 0) {
    console.log('=== BROKEN LINKS ===');
    results.brokenLinks.forEach(item => {
        console.log(`\nFile: ${path.relative(celticDir, item.file)}`);
        console.log(`  Link: ${item.link}`);
        console.log(`  Resolved to: ${item.resolvedPath}`);
    });
}

// Save detailed report
fs.writeFileSync(
    path.join(celticDir, 'audit_links_report.json'),
    JSON.stringify(results, null, 2)
);

console.log('\n\nDetailed report saved to: audit_links_report.json');
process.exit(results.brokenLinks.length > 0 ? 1 : 0);
