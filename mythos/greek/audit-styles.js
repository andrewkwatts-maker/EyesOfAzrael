// Greek Mythology Section - Styles Audit Script
// Checks for missing styles.css imports and theme integration

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const results = {
    totalFiles: 0,
    missingStyles: [],
    missingThemeBase: [],
    missingThemePicker: [],
    missingSmartLinks: [],
    hasOldStyling: [],
    fullyModern: [],
    issues: []
};

// Get all HTML files recursively
function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html') && !file.endsWith('.bak')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Check for required imports and modern styling
function checkStyles(file) {
    const html = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(baseDir, file);
    const issues = [];

    // Check for styles.css
    if (!html.includes('styles.css')) {
        issues.push('Missing styles.css import');
        results.missingStyles.push(relativePath);
    }

    // Check for theme-base.css
    if (!html.includes('theme-base.css')) {
        issues.push('Missing theme-base.css import');
        results.missingThemeBase.push(relativePath);
    }

    // Check for theme-picker.js
    if (!html.includes('theme-picker.js')) {
        issues.push('Missing theme-picker.js script');
        results.missingThemePicker.push(relativePath);
    }

    // Check for smart-links integration
    if (!html.includes('smart-links.css') || !html.includes('smart-links.js')) {
        issues.push('Missing smart-links integration');
        results.missingSmartLinks.push(relativePath);
    }

    // Check for old ASCII art patterns (pre tags with large content blocks)
    if (html.match(/<pre[^>]*>[\s\S]{200,}<\/pre>/)) {
        issues.push('Contains large <pre> blocks (possible ASCII art)');
        results.hasOldStyling.push(relativePath);
    }

    // Check for glass morphism styling
    const hasGlassCard = html.includes('glass-card');
    const hasHeroSection = html.includes('hero-section');
    const hasModernGrid = html.includes('deity-grid') || html.includes('section-grid');

    // Check for old table-based layouts
    if (html.includes('<table') && !html.includes('data-table')) {
        issues.push('Contains <table> elements (may be old layout)');
        results.hasOldStyling.push(relativePath);
    }

    // If it has modern components and no issues, mark as fully modern
    if (hasGlassCard && hasHeroSection && issues.length === 0) {
        results.fullyModern.push(relativePath);
    }

    if (issues.length > 0) {
        results.issues.push({
            file: relativePath,
            issues: issues
        });
    }
}

// Main audit function
function auditStyles() {
    console.log('Starting Greek Mythology Styles Audit...\n');

    const htmlFiles = getHtmlFiles(baseDir);
    results.totalFiles = htmlFiles.length;

    console.log(`Found ${htmlFiles.length} HTML files\n`);

    htmlFiles.forEach(file => {
        checkStyles(file);
    });

    // Print results
    console.log('='.repeat(80));
    console.log('STYLES AUDIT RESULTS');
    console.log('='.repeat(80));
    console.log(`\nTotal HTML files scanned: ${results.totalFiles}`);
    console.log(`Fully modern (glass morphism + all imports): ${results.fullyModern.length}`);
    console.log(`Files with issues: ${results.issues.length}`);
    console.log(`\n📊 BREAKDOWN:\n`);
    console.log(`Missing styles.css: ${results.missingStyles.length}`);
    console.log(`Missing theme-base.css: ${results.missingThemeBase.length}`);
    console.log(`Missing theme-picker.js: ${results.missingThemePicker.length}`);
    console.log(`Missing smart-links: ${results.missingSmartLinks.length}`);
    console.log(`Has old styling (ASCII art/tables): ${[...new Set(results.hasOldStyling)].length}`);

    if (results.issues.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('DETAILED ISSUES:');
        console.log('='.repeat(80));

        results.issues.forEach(item => {
            console.log(`\n📄 ${item.file}`);
            item.issues.forEach(issue => {
                console.log(`   ❌ ${issue}`);
            });
        });
    } else {
        console.log('\n✅ All files have modern styling!');
    }

    // Save detailed report
    const reportPath = path.join(baseDir, 'audit-report-styles.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n\nDetailed report saved to: ${reportPath}`);
}

// Run the audit
auditStyles();