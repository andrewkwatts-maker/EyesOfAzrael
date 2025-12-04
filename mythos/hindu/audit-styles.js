/**
 * Hindu Mythology - Styles Import Checker
 * Checks all HTML files for proper styles.css import
 */

const fs = require('fs');
const path = require('path');

const findings = {
    missingStyles: [],
    missingThemePicker: [],
    missingThemeAnimations: [],
    missingSmartLinks: [],
    hasOldStyling: [],
    hasModernStyling: [],
    filesCheked: 0
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

function checkStyles(filePath) {
    findings.filesCheked++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Check for styles.css
    if (!content.includes('styles.css')) {
        findings.missingStyles.push(relativePath);
    }

    // Check for theme-picker.js
    if (!content.includes('theme-picker.js')) {
        findings.missingThemePicker.push(relativePath);
    }

    // Check for theme-animations.js
    if (!content.includes('theme-animations.js')) {
        findings.missingThemeAnimations.push(relativePath);
    }

    // Check for smart-links.js
    if (!content.includes('smart-links.js')) {
        findings.missingSmartLinks.push(relativePath);
    }

    // Check for modern styling patterns
    const hasGlassCard = content.includes('glass-card');
    const hasHeroSection = content.includes('hero-section');
    const hasSubsectionCard = content.includes('subsection-card');
    const hasThemeVariables = content.includes('var(--color-');

    if (hasGlassCard && hasHeroSection && hasThemeVariables) {
        findings.hasModernStyling.push(relativePath);
    } else {
        findings.hasOldStyling.push({
            file: relativePath,
            missing: {
                glassCard: !hasGlassCard,
                heroSection: !hasHeroSection,
                themeVars: !hasThemeVariables
            }
        });
    }
}

function auditStyles() {
    console.log('🎨 HINDU MYTHOLOGY - STYLES AUDIT\n');
    console.log('=' .repeat(60));

    const hinduDir = path.resolve(__dirname);
    const htmlFiles = getAllHtmlFiles(hinduDir);

    console.log(`\n📄 Checking ${htmlFiles.length} HTML files\n`);

    htmlFiles.forEach(file => checkStyles(file));

    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT RESULTS\n');
    console.log(`Files Checked: ${findings.filesCheked}`);
    console.log(`Modern Styling: ${findings.hasModernStyling.length}`);
    console.log(`Old Styling: ${findings.hasOldStyling.length}`);

    if (findings.missingStyles.length > 0) {
        console.log('\n❌ MISSING styles.css:\n');
        findings.missingStyles.forEach(file => console.log(`   ${file}`));
    }

    if (findings.missingThemePicker.length > 0) {
        console.log('\n❌ MISSING theme-picker.js:\n');
        findings.missingThemePicker.forEach(file => console.log(`   ${file}`));
    }

    if (findings.missingThemeAnimations.length > 0) {
        console.log('\n❌ MISSING theme-animations.js:\n');
        findings.missingThemeAnimations.forEach(file => console.log(`   ${file}`));
    }

    if (findings.missingSmartLinks.length > 0) {
        console.log('\n⚠️  MISSING smart-links.js:\n');
        findings.missingSmartLinks.forEach(file => console.log(`   ${file}`));
    }

    if (findings.hasOldStyling.length > 0) {
        console.log('\n⚠️  OLD STYLING DETECTED:\n');
        findings.hasOldStyling.forEach(item => {
            console.log(`\n   📄 ${item.file}`);
            if (item.missing.glassCard) console.log('      - Missing glass-card class');
            if (item.missing.heroSection) console.log('      - Missing hero-section class');
            if (item.missing.themeVars) console.log('      - Missing CSS variables (var(--)');
        });
    }

    if (findings.hasModernStyling.length === findings.filesCheked) {
        console.log('\n✅ ALL FILES HAVE MODERN STYLING!');
    }

    console.log('\n' + '='.repeat(60));

    const reportPath = path.join(__dirname, 'audit-report-styles.json');
    fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
    console.log(`\n💾 Report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

auditStyles();
