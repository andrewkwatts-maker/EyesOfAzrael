const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const celticDir = path.join(__dirname);
const results = {
    missingStyles: [],
    hasStyles: [],
    missingThemePicker: [],
    hasThemePicker: [],
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

function checkStyles(htmlFile) {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;

    // Check for styles.css import
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const hasStylesCss = stylesheets.some(link =>
        link.getAttribute('href')?.includes('styles.css')
    );

    if (hasStylesCss) {
        results.hasStyles.push(htmlFile);
    } else {
        results.missingStyles.push(htmlFile);
    }

    // Check for theme picker script
    const scripts = Array.from(document.querySelectorAll('script'));
    const hasThemePicker = scripts.some(script =>
        script.getAttribute('src')?.includes('theme-picker.js') ||
        script.textContent?.includes('theme-picker')
    );

    // Also check for theme picker HTML element
    const hasThemePickerElement = document.querySelector('#theme-picker') !== null;

    if (hasThemePicker || hasThemePickerElement) {
        results.hasThemePicker.push(htmlFile);
    } else {
        results.missingThemePicker.push(htmlFile);
    }
}

// Main execution
const htmlFiles = getAllHtmlFiles(celticDir);
results.totalFiles = htmlFiles.length;

console.log(`Found ${htmlFiles.length} HTML files in Celtic directory\n`);

htmlFiles.forEach(file => {
    checkStyles(file);
});

// Output results
console.log('=== STYLES AUDIT RESULTS ===\n');
console.log(`Total files checked: ${results.totalFiles}`);
console.log(`Files with styles.css: ${results.hasStyles.length}`);
console.log(`Files missing styles.css: ${results.missingStyles.length}`);
console.log(`Files with theme picker: ${results.hasThemePicker.length}`);
console.log(`Files missing theme picker: ${results.missingThemePicker.length}\n`);

if (results.missingStyles.length > 0) {
    console.log('=== FILES MISSING styles.css ===');
    results.missingStyles.forEach(file => {
        console.log(`  ${path.relative(celticDir, file)}`);
    });
    console.log();
}

if (results.missingThemePicker.length > 0) {
    console.log('=== FILES MISSING THEME PICKER ===');
    results.missingThemePicker.forEach(file => {
        console.log(`  ${path.relative(celticDir, file)}`);
    });
    console.log();
}

// Save detailed report
fs.writeFileSync(
    path.join(celticDir, 'audit_styles_report.json'),
    JSON.stringify(results, null, 2)
);

console.log('Detailed report saved to: audit_styles_report.json');
process.exit((results.missingStyles.length > 0 || results.missingThemePicker.length > 0) ? 1 : 0);
