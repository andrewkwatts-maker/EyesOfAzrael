const fs = require('fs');
const path = require('path');

const celticDir = path.join(__dirname);
const results = {
    filesWithAsciiArt: [],
    filesWithSvg: [],
    filesWithoutVisuals: [],
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

function checkAsciiArt(htmlFile) {
    const content = fs.readFileSync(htmlFile, 'utf-8');

    // Common ASCII art patterns
    const asciiPatterns = [
        /<pre[^>]*>[\s\S]*?[|\/\\\_\-\+]{3,}[\s\S]*?<\/pre>/,  // Common ASCII art in pre tags
        /\s{2,}[|\/\\\_]{2,}/,  // Multiple spacing with ASCII chars
        /<code[^>]*>[\s\S]*?[|\/\\\_\-\+]{3,}[\s\S]*?<\/code>/,  // ASCII in code tags
    ];

    const hasAsciiArt = asciiPatterns.some(pattern => pattern.test(content));
    const hasSvg = content.includes('<svg') || content.includes('.svg');

    if (hasAsciiArt) {
        results.filesWithAsciiArt.push({
            file: htmlFile,
            hasSvg: hasSvg
        });
    } else if (hasSvg) {
        results.filesWithSvg.push(htmlFile);
    } else {
        results.filesWithoutVisuals.push(htmlFile);
    }
}

// Main execution
const htmlFiles = getAllHtmlFiles(celticDir);
results.totalFiles = htmlFiles.length;

console.log(`Found ${htmlFiles.length} HTML files in Celtic directory\n`);

htmlFiles.forEach(file => {
    checkAsciiArt(file);
});

// Output results
console.log('=== ASCII ART AUDIT RESULTS ===\n');
console.log(`Total files checked: ${results.totalFiles}`);
console.log(`Files with ASCII art: ${results.filesWithAsciiArt.length}`);
console.log(`Files with SVG: ${results.filesWithSvg.length}`);
console.log(`Files without visuals: ${results.filesWithoutVisuals.length}\n`);

if (results.filesWithAsciiArt.length > 0) {
    console.log('=== FILES WITH ASCII ART ===');
    results.filesWithAsciiArt.forEach(item => {
        console.log(`  ${path.relative(celticDir, item.file)} ${item.hasSvg ? '(also has SVG)' : '(no SVG)'}`);
    });
    console.log();
}

// Save detailed report
fs.writeFileSync(
    path.join(celticDir, 'audit_ascii_report.json'),
    JSON.stringify(results, null, 2)
);

console.log('Detailed report saved to: audit_ascii_report.json');
process.exit(results.filesWithAsciiArt.length > 0 ? 1 : 0);
