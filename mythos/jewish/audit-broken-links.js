const fs = require('fs');
const path = require('path');

const baseDir = 'H:/Github/EyesOfAzrael';
const jewishDir = path.join(baseDir, 'mythos/jewish');

function getAllHtmlFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files = files.concat(getAllHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

function checkLinks(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const brokenLinks = [];

    // Find all href links
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = hrefRegex.exec(content)) !== null) {
        const link = match[1];

        // Skip external links, anchors, and javascript
        if (link.startsWith('http://') || link.startsWith('https://') ||
            link.startsWith('#') || link.startsWith('javascript:') ||
            link.startsWith('mailto:')) {
            continue;
        }

        // Resolve relative path
        const fileDir = path.dirname(filePath);
        let targetPath = path.resolve(fileDir, link.split('#')[0]);

        // Check if file exists
        if (!fs.existsSync(targetPath)) {
            brokenLinks.push({
                link: link,
                resolvedPath: targetPath
            });
        }
    }

    // Find all src links
    const srcRegex = /src=["']([^"']+)["']/g;
    while ((match = srcRegex.exec(content)) !== null) {
        const link = match[1];

        // Skip external links and data URIs
        if (link.startsWith('http://') || link.startsWith('https://') ||
            link.startsWith('data:')) {
            continue;
        }

        // Resolve relative path
        const fileDir = path.dirname(filePath);
        let targetPath = path.resolve(fileDir, link);

        // Check if file exists
        if (!fs.existsSync(targetPath)) {
            brokenLinks.push({
                link: link,
                resolvedPath: targetPath
            });
        }
    }

    return brokenLinks;
}

console.log('=== BROKEN LINK AUDIT ===\n');

const files = getAllHtmlFiles(jewishDir);
let totalBroken = 0;
let filesWithIssues = 0;

files.forEach(file => {
    const broken = checkLinks(file);
    if (broken.length > 0) {
        filesWithIssues++;
        const relativePath = path.relative(baseDir, file);
        console.log(`\n${relativePath}:`);
        broken.forEach(b => {
            console.log(`  - BROKEN: ${b.link}`);
            console.log(`    Resolved to: ${b.resolvedPath}`);
            totalBroken++;
        });
    }
});

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total files checked: ${files.length}`);
console.log(`Files with broken links: ${filesWithIssues}`);
console.log(`Total broken links: ${totalBroken}`);
