/**
 * Hindu Mythology - ASCII Art Detector
 * Finds pages still using old ASCII art instead of SVG
 */

const fs = require('fs');
const path = require('path');

const findings = {
    hasAsciiArt: [],
    hasSvg: [],
    filesChecked: 0
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

function detectAsciiArt(filePath) {
    findings.filesChecked++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Common ASCII art patterns
    const asciiPatterns = [
        /\│|\║|\┃|\┆|\┇|\┊|\┋/,  // Box drawing characters
        /─|═|━|┄|┅|┈|┉/,          // Horizontal lines
        /┌|┐|└|┘|╔|╗|╚|╝/,        // Box corners
        /├|┤|┬|┴|╠|╣|╦|╩/,        // Box junctions
        /<pre>[\s\S]*?[│║┃─═━┌┐└┘][\s\S]*?<\/pre>/,  // ASCII in pre tags
        /\+[-]+\+/,                // Simple box borders
        /\|[^\|]{5,}\|/            // Pipe-bordered content
    ];

    let hasAscii = false;
    const matches = [];

    asciiPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
            hasAscii = true;
            const match = content.match(pattern);
            if (match) {
                matches.push({
                    pattern: pattern.toString(),
                    sample: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : '')
                });
            }
        }
    });

    if (hasAscii) {
        findings.hasAsciiArt.push({
            file: relativePath,
            matches
        });
    }

    // Check for SVG
    if (content.includes('<svg') || content.includes('.svg')) {
        findings.hasSvg.push(relativePath);
    }
}

function auditAsciiArt() {
    console.log('🎨 HINDU MYTHOLOGY - ASCII ART DETECTOR\n');
    console.log('=' .repeat(60));

    const hinduDir = path.resolve(__dirname);
    const htmlFiles = getAllHtmlFiles(hinduDir);

    console.log(`\n📄 Checking ${htmlFiles.length} HTML files\n`);

    htmlFiles.forEach(file => detectAsciiArt(file));

    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT RESULTS\n');
    console.log(`Files Checked: ${findings.filesChecked}`);
    console.log(`Files with ASCII Art: ${findings.hasAsciiArt.length}`);
    console.log(`Files with SVG: ${findings.hasSvg.length}`);

    if (findings.hasAsciiArt.length > 0) {
        console.log('\n⚠️  ASCII ART DETECTED:\n');
        findings.hasAsciiArt.forEach(item => {
            console.log(`\n📄 ${item.file}`);
            item.matches.forEach(match => {
                console.log(`   Pattern: ${match.pattern}`);
                console.log(`   Sample: ${match.sample}`);
            });
        });
    } else {
        console.log('\n✅ NO ASCII ART FOUND!');
    }

    console.log('\n' + '='.repeat(60));

    const reportPath = path.join(__dirname, 'audit-report-ascii.json');
    fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
    console.log(`\n💾 Report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

auditAsciiArt();
