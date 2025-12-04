const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

function findHtmlFiles(dir) {
    let results = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(findHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            results.push(fullPath);
        }
    }

    return results;
}

function extractLinks(content, filePath) {
    const links = [];

    // Match href attributes
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;

    while ((match = hrefRegex.exec(content)) !== null) {
        const href = match[1];

        // Skip external links, anchors only, mailto, javascript, etc.
        if (href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('mailto:') ||
            href.startsWith('javascript:') ||
            href.startsWith('#') ||
            href === '' ||
            href.startsWith('?')) {  // Skip query parameters without path
            continue;
        }

        links.push({
            href: href,
            line: content.substring(0, match.index).split('\n').length
        });
    }

    return links;
}

function resolveLink(fromFile, link) {
    const fromDir = path.dirname(fromFile);

    // Remove anchor/hash and query params from link
    let pathPart = link.split('#')[0];
    pathPart = pathPart.split('?')[0];

    // Resolve relative path
    const resolved = path.resolve(fromDir, pathPart);
    return resolved;
}

function checkLinks() {
    const baseDir = __dirname;
    const files = findHtmlFiles(baseDir);

    console.log(`${colors.blue}==========================================`);
    console.log(`Egyptian Mythology Link Audit`);
    console.log(`==========================================${colors.reset}\n`);
    console.log(`Found ${files.length} HTML files to check\n`);

    let totalLinks = 0;
    let brokenLinks = 0;
    const brokenLinkDetails = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const links = extractLinks(content, file);
        totalLinks += links.length;

        for (const link of links) {
            const resolved = resolveLink(file, link.href);

            if (!fs.existsSync(resolved)) {
                brokenLinks++;
                brokenLinkDetails.push({
                    file: path.relative(baseDir, file),
                    link: link.href,
                    line: link.line,
                    resolved: resolved
                });
            }
        }
    }

    console.log(`${colors.magenta}Summary:${colors.reset}`);
    console.log(`Total internal links checked: ${totalLinks}`);
    console.log(`Broken links found: ${brokenLinks}\n`);

    if (brokenLinks > 0) {
        console.log(`${colors.red}BROKEN LINKS:${colors.reset}\n`);

        for (const broken of brokenLinkDetails) {
            console.log(`${colors.yellow}File:${colors.reset} ${broken.file}`);
            console.log(`${colors.yellow}Line:${colors.reset} ${broken.line}`);
            console.log(`${colors.yellow}Link:${colors.reset} ${broken.link}`);
            console.log(`${colors.red}Target not found:${colors.reset} ${broken.resolved}`);
            console.log('---');
        }

        process.exit(1);
    } else {
        console.log(`${colors.green}All links are valid!${colors.reset}`);
        process.exit(0);
    }
}

checkLinks();
