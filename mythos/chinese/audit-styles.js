#!/usr/bin/env node

/**
 * Audit script: Check for missing styles.css imports in Chinese mythology section
 */

const fs = require('fs');
const path = require('path');

const chineseDir = path.join(__dirname);
const missingStylesFiles = [];
const missingThemePickerFiles = [];
const missingSmartLinksFiles = [];
const allFiles = [];

// Recursively get all HTML files
function getHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getHtmlFiles(fullPath));
        } else if (item.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Check for required imports
function checkStyleImports(file, content) {
    const relativePath = path.relative(chineseDir, file);
    const issues = [];

    // Check for styles.css
    if (!content.includes('styles.css')) {
        issues.push('styles.css');
        missingStylesFiles.push(relativePath);
    }

    // Check for theme-picker.js
    if (!content.includes('theme-picker.js')) {
        issues.push('theme-picker.js');
        missingThemePickerFiles.push(relativePath);
    }

    // Check for smart-links.js (modern feature)
    if (!content.includes('smart-links.js')) {
        issues.push('smart-links.js');
        missingSmartLinksFiles.push(relativePath);
    }

    // Check for theme-animations.js
    if (!content.includes('theme-animations.js')) {
        issues.push('theme-animations.js');
    }

    return issues;
}

// Check for modern styling patterns
function checkModernStyling(content) {
    const modernFeatures = {
        glassCard: content.includes('glass-card'),
        heroSection: content.includes('hero-section'),
        themePickerContainer: content.includes('theme-picker-container'),
        breadcrumb: content.includes('breadcrumb'),
        corpusLink: content.includes('corpus-link')
    };

    return modernFeatures;
}

// Main audit
function auditStyles() {
    console.log('🎨 Auditing style imports in Chinese mythology section...\n');

    const htmlFiles = getHtmlFiles(chineseDir);
    console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

    const results = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(chineseDir, file);
        const missingImports = checkStyleImports(file, content);
        const modernFeatures = checkModernStyling(content);

        allFiles.push(relativePath);

        if (missingImports.length > 0) {
            results.push({
                file: relativePath,
                missingImports,
                modernFeatures
            });
        }
    }

    // Report results
    console.log('━'.repeat(80));
    console.log('AUDIT RESULTS: Style Imports & Modern Styling');
    console.log('━'.repeat(80));
    console.log(`Total files checked: ${allFiles.length}\n`);

    console.log(`Files missing styles.css: ${missingStylesFiles.length}`);
    console.log(`Files missing theme-picker.js: ${missingThemePickerFiles.length}`);
    console.log(`Files missing smart-links.js: ${missingSmartLinksFiles.length}\n`);

    if (results.length > 0) {
        console.log('❌ FILES WITH MISSING IMPORTS:\n');

        for (const result of results) {
            console.log(`\n📄 ${result.file}`);
            console.log(`   Missing: ${result.missingImports.join(', ')}`);
            console.log(`   Modern features:`);
            console.log(`     - Glass cards: ${result.modernFeatures.glassCard ? '✅' : '❌'}`);
            console.log(`     - Hero section: ${result.modernFeatures.heroSection ? '✅' : '❌'}`);
            console.log(`     - Theme picker: ${result.modernFeatures.themePickerContainer ? '✅' : '❌'}`);
            console.log(`     - Breadcrumbs: ${result.modernFeatures.breadcrumb ? '✅' : '❌'}`);
            console.log(`     - Corpus links: ${result.modernFeatures.corpusLink ? '✅' : '❌'}`);
        }

        console.log('\n' + '━'.repeat(80));
        console.log(`\n⚠️  Found ${results.length} file(s) with missing imports!\n`);
    } else {
        console.log('✅ All files have required style imports!\n');
    }
}

// Run audit
try {
    auditStyles();
} catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
}
