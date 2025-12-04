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

function checkStyles() {
    const baseDir = __dirname;
    const files = findHtmlFiles(baseDir);

    console.log(`${colors.blue}==========================================`);
    console.log(`Egyptian Mythology Styles Audit`);
    console.log(`==========================================${colors.reset}\n`);
    console.log(`Found ${files.length} HTML files to check\n`);

    const missingStyles = [];
    const missingThemePicker = [];
    const oldStyling = [];
    const modernPages = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(baseDir, file);

        // Check for styles.css import
        const hasStylesCSS = content.includes('styles.css');

        // Check for theme picker integration
        const hasThemePicker = content.includes('theme-picker.js') ||
                                content.includes('initThemePicker') ||
                                content.includes('data-theme');

        // Check for glass morphism (classes or CSS properties)
        const hasGlassMorphism = content.includes('glass-panel') ||
                                  content.includes('glass-card') ||
                                  content.includes('backdrop-blur') ||
                                  content.includes('backdrop-filter');

        // Check for modern hero sections or deity headers
        const hasModernHero = content.includes('hero-section') ||
                               content.includes('hero-content') ||
                               content.includes('deity-header') ||
                               content.includes('deity-card');

        // Check for old ASCII art
        const hasASCII = /<pre[^>]*>[\s\S]*?<\/pre>/i.test(content) &&
                         !content.includes('code-block');

        if (!hasStylesCSS) {
            missingStyles.push(relativePath);
        }

        if (!hasThemePicker) {
            missingThemePicker.push(relativePath);
        }

        if (hasStylesCSS && (hasGlassMorphism || hasModernHero)) {
            modernPages.push(relativePath);
        } else if (hasStylesCSS && !hasGlassMorphism && !hasModernHero) {
            oldStyling.push(relativePath);
        }
    }

    console.log(`${colors.magenta}Summary:${colors.reset}`);
    console.log(`Total pages: ${files.length}`);
    console.log(`Modern styled pages: ${modernPages.length}`);
    console.log(`Pages with old styling: ${oldStyling.length}`);
    console.log(`Pages missing styles.css: ${missingStyles.length}`);
    console.log(`Pages missing theme picker: ${missingThemePicker.length}\n`);

    let hasIssues = false;

    if (missingStyles.length > 0) {
        hasIssues = true;
        console.log(`${colors.red}MISSING STYLES.CSS:${colors.reset}`);
        missingStyles.forEach(f => console.log(`  - ${f}`));
        console.log();
    }

    if (missingThemePicker.length > 0) {
        hasIssues = true;
        console.log(`${colors.yellow}MISSING THEME PICKER:${colors.reset}`);
        missingThemePicker.forEach(f => console.log(`  - ${f}`));
        console.log();
    }

    if (oldStyling.length > 0) {
        hasIssues = true;
        console.log(`${colors.yellow}OLD STYLING (needs modernization):${colors.reset}`);
        oldStyling.forEach(f => console.log(`  - ${f}`));
        console.log();
    }

    if (modernPages.length > 0) {
        console.log(`${colors.green}MODERN STYLED PAGES:${colors.reset}`);
        modernPages.forEach(f => console.log(`  - ${f}`));
        console.log();
    }

    if (!hasIssues) {
        console.log(`${colors.green}All pages have proper styling!${colors.reset}`);
        process.exit(0);
    } else {
        process.exit(1);
    }
}

checkStyles();
