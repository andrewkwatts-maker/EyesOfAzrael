const fs = require('fs');
const path = require('path');

// ANSI color codes
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

function checkASCII() {
    const baseDir = __dirname;
    const files = findHtmlFiles(baseDir);

    console.log(`${colors.blue}==========================================`);
    console.log(`Egyptian Mythology ASCII Art Audit`);
    console.log(`==========================================${colors.reset}\n`);
    console.log(`Found ${files.length} HTML files to check\n`);

    const pagesWithASCII = [];
    const pagesWithSVG = [];
    const pagesWithNeither = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(baseDir, file);

        // Check for <pre> tags (potential ASCII art)
        const preMatches = content.match(/<pre[^>]*>[\s\S]*?<\/pre>/gi) || [];

        // Filter out code blocks (which should use <pre>)
        const asciiBlocks = preMatches.filter(block => {
            const hasCode = block.includes('<code>') || block.includes('class="code');
            const hasAsciiArt = /[│┌┐└┘├┤┬┴┼─═║╔╗╚╝╠╣╦╩╬]/.test(block) ||
                                 /\+[-=]+\+/.test(block) ||
                                 /\|[\s\S]*?\|/.test(block);
            return !hasCode && (hasAsciiArt || block.length > 200);
        });

        const hasSVG = content.includes('<svg') || content.includes('.svg');

        if (asciiBlocks.length > 0) {
            pagesWithASCII.push({
                path: relativePath,
                count: asciiBlocks.length,
                samples: asciiBlocks.slice(0, 2).map(b =>
                    b.substring(0, 200).replace(/\n/g, ' ')
                )
            });
        }

        if (hasSVG) {
            pagesWithSVG.push(relativePath);
        }

        if (asciiBlocks.length === 0 && !hasSVG) {
            pagesWithNeither.push(relativePath);
        }
    }

    console.log(`${colors.magenta}Summary:${colors.reset}`);
    console.log(`Total pages: ${files.length}`);
    console.log(`Pages with SVG diagrams: ${pagesWithSVG.length}`);
    console.log(`Pages with ASCII art: ${pagesWithASCII.length}`);
    console.log(`Pages with no diagrams: ${pagesWithNeither.length}\n`);

    if (pagesWithASCII.length > 0) {
        console.log(`${colors.yellow}PAGES WITH ASCII ART (consider converting to SVG):${colors.reset}\n`);

        for (const page of pagesWithASCII) {
            console.log(`${colors.yellow}File:${colors.reset} ${page.path}`);
            console.log(`${colors.yellow}ASCII blocks found:${colors.reset} ${page.count}`);
            console.log(`${colors.yellow}Sample:${colors.reset} ${page.samples[0].substring(0, 150)}...`);
            console.log('---');
        }
        console.log();
    }

    if (pagesWithSVG.length > 0) {
        console.log(`${colors.green}PAGES WITH SVG DIAGRAMS:${colors.reset}`);
        pagesWithSVG.forEach(f => console.log(`  - ${f}`));
        console.log();
    }

    if (pagesWithASCII.length > 0) {
        console.log(`${colors.yellow}Action needed: ${pagesWithASCII.length} pages have ASCII art that should be converted to SVG${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}No ASCII art found - all diagrams use modern formats!${colors.reset}`);
        process.exit(0);
    }
}

checkASCII();
