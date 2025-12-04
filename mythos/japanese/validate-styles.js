const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = __dirname;
const RESULTS = {
    missingStyles: [],
    missingThemePicker: [],
    missingThemeBase: [],
    missingSmartLinks: [],
    oldStyling: [],
    totalPages: 0
};

// Required imports for modern pages
const REQUIRED_IMPORTS = {
    styles: 'styles.css',
    themeBase: 'theme-base.css',
    themePicker: 'theme-picker.js',
    smartLinks: 'smart-links.js',
    themeAnimations: 'theme-animations.js'
};

// Modern styling indicators
const MODERN_PATTERNS = {
    glassCard: /class="glass-card"/,
    heroSection: /class="hero-section"/,
    themeVariables: /var\(--color-/,
    breadcrumb: /class="breadcrumb"/
};

// Old styling indicators
const OLD_PATTERNS = {
    inlineStyles: /<style>[\s\S]*?:root\s*\{[\s\S]*?--mythos-primary/,
    hardcodedColors: /#[0-9A-Fa-f]{6}/,
    asciiArt: /\+[-=]+\+/
};

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

// Check if file has required import
function hasImport(content, importFile) {
    const patterns = [
        new RegExp(`href=["'][^"']*${importFile}["']`),
        new RegExp(`src=["'][^"']*${importFile}["']`)
    ];
    return patterns.some(pattern => pattern.test(content));
}

// Check for modern styling
function checkModernStyling(content) {
    const modernCount = Object.values(MODERN_PATTERNS)
        .filter(pattern => pattern.test(content)).length;
    return modernCount >= 2; // At least 2 modern patterns
}

// Check for old styling
function checkOldStyling(content) {
    const oldCount = Object.values(OLD_PATTERNS)
        .filter(pattern => pattern.test(content)).length;
    return oldCount > 0;
}

// Main validation function
function validateStyles() {
    console.log('\n=== Japanese Mythology Styles Validator ===\n');

    const htmlFiles = findHtmlFiles(BASE_DIR);
    RESULTS.totalPages = htmlFiles.length;

    console.log(`Found ${htmlFiles.length} HTML files to check\n`);

    htmlFiles.forEach(filePath => {
        const relativePath = path.relative(BASE_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for required imports
        if (!hasImport(content, REQUIRED_IMPORTS.styles)) {
            RESULTS.missingStyles.push(relativePath);
        }
        if (!hasImport(content, REQUIRED_IMPORTS.themeBase)) {
            RESULTS.missingThemeBase.push(relativePath);
        }
        if (!hasImport(content, REQUIRED_IMPORTS.themePicker)) {
            RESULTS.missingThemePicker.push(relativePath);
        }
        if (!hasImport(content, REQUIRED_IMPORTS.smartLinks)) {
            RESULTS.missingSmartLinks.push(relativePath);
        }

        // Check styling patterns
        const hasModern = checkModernStyling(content);
        const hasOld = checkOldStyling(content);

        if (hasOld || !hasModern) {
            RESULTS.oldStyling.push({
                file: relativePath,
                hasModern,
                hasOld,
                issues: []
            });

            const issues = RESULTS.oldStyling[RESULTS.oldStyling.length - 1].issues;

            if (!hasModern) {
                issues.push('Missing modern glass-card/hero-section patterns');
            }
            if (OLD_PATTERNS.inlineStyles.test(content)) {
                issues.push('Uses old inline :root styles');
            }
            if (OLD_PATTERNS.asciiArt.test(content)) {
                issues.push('Contains ASCII art boxes');
            }
        }
    });

    // Print results
    console.log('=== RESULTS ===\n');
    console.log(`Total pages scanned: ${RESULTS.totalPages}\n`);

    console.log(`Missing styles.css import: ${RESULTS.missingStyles.length}`);
    if (RESULTS.missingStyles.length > 0) {
        RESULTS.missingStyles.forEach(file => console.log(`  - ${file}`));
        console.log('');
    }

    console.log(`Missing theme-base.css import: ${RESULTS.missingThemeBase.length}`);
    if (RESULTS.missingThemeBase.length > 0) {
        RESULTS.missingThemeBase.forEach(file => console.log(`  - ${file}`));
        console.log('');
    }

    console.log(`Missing theme-picker.js import: ${RESULTS.missingThemePicker.length}`);
    if (RESULTS.missingThemePicker.length > 0) {
        RESULTS.missingThemePicker.forEach(file => console.log(`  - ${file}`));
        console.log('');
    }

    console.log(`Missing smart-links.js import: ${RESULTS.missingSmartLinks.length}`);
    if (RESULTS.missingSmartLinks.length > 0) {
        RESULTS.missingSmartLinks.forEach(file => console.log(`  - ${file}`));
        console.log('');
    }

    console.log(`Pages with old/incomplete styling: ${RESULTS.oldStyling.length}`);
    if (RESULTS.oldStyling.length > 0) {
        RESULTS.oldStyling.forEach(item => {
            console.log(`  - ${item.file}`);
            item.issues.forEach(issue => console.log(`    • ${issue}`));
        });
        console.log('');
    }

    // Save results to JSON
    const reportPath = path.join(BASE_DIR, 'style-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
    console.log(`Full report saved to: ${reportPath}\n`);

    const hasIssues = RESULTS.missingStyles.length > 0 ||
                     RESULTS.missingThemeBase.length > 0 ||
                     RESULTS.missingThemePicker.length > 0 ||
                     RESULTS.oldStyling.length > 0;

    if (!hasIssues) {
        console.log('✓ All pages have proper modern styling!\n');
    }

    return !hasIssues;
}

// Run validation
const success = validateStyles();
process.exit(success ? 0 : 1);
