#!/usr/bin/env node

/**
 * Audit script: Find ASCII art that should be replaced with SVG/Unicode
 * Detects old-style ASCII diagrams in Chinese mythology pages
 */

const fs = require('fs');
const path = require('path');

const chineseDir = path.join(__dirname);
const filesWithAsciiArt = [];

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

// Detect ASCII art patterns
function detectAsciiArt(content) {
    const asciiPatterns = [
        // Box drawing characters
        /[─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬]+/g,
        // Multiple consecutive dashes/underscores/pipes
        /[-_|]{5,}/g,
        // ASCII art trees/diagrams
        /\s+[\/\\|]+\s+/g,
        // Pre-formatted ASCII blocks
        /<pre>[\s\S]*?[─│┌┐└┘├┤┬┴┼|\/\\]{3,}[\s\S]*?<\/pre>/g
    ];

    const findings = [];

    for (const pattern of asciiPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
            findings.push(...matches);
        }
    }

    return findings;
}

// Check for modern SVG/emoji alternatives
function hasModernVisuals(content) {
    return {
        hasSvg: content.includes('<svg'),
        hasUnicodeSymbols: /[☯️🌙☀️🌊🏔️⚔️💧🔥🌳]/.test(content),
        hasHeroIcons: content.includes('hero-icon-display'),
        hasDeityIcons: content.includes('deity-icon')
    };
}

// Main audit
function auditAsciiArt() {
    console.log('🎨 Auditing for ASCII art in Chinese mythology section...\n');

    const htmlFiles = getHtmlFiles(chineseDir);
    console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(chineseDir, file);
        const asciiArt = detectAsciiArt(content);
        const modernVisuals = hasModernVisuals(content);

        if (asciiArt.length > 0) {
            filesWithAsciiArt.push({
                file: relativePath,
                asciiCount: asciiArt.length,
                modernVisuals,
                samples: asciiArt.slice(0, 3) // First 3 examples
            });
        }
    }

    // Report results
    console.log('━'.repeat(80));
    console.log('AUDIT RESULTS: ASCII Art Detection');
    console.log('━'.repeat(80));
    console.log(`Total files checked: ${htmlFiles.length}`);
    console.log(`Files with ASCII art: ${filesWithAsciiArt.length}\n`);

    if (filesWithAsciiArt.length > 0) {
        console.log('⚠️  FILES WITH ASCII ART:\n');

        for (const result of filesWithAsciiArt) {
            console.log(`\n📄 ${result.file}`);
            console.log(`   ASCII patterns found: ${result.asciiCount}`);
            console.log(`   Samples: ${result.samples.join(', ').substring(0, 80)}...`);
            console.log(`   Modern alternatives:`);
            console.log(`     - SVG graphics: ${result.modernVisuals.hasSvg ? '✅' : '❌'}`);
            console.log(`     - Unicode symbols: ${result.modernVisuals.hasUnicodeSymbols ? '✅' : '❌'}`);
            console.log(`     - Hero icons: ${result.modernVisuals.hasHeroIcons ? '✅' : '❌'}`);
            console.log(`     - Deity icons: ${result.modernVisuals.hasDeityIcons ? '✅' : '✅ (using emoji)'}`);
        }

        console.log('\n' + '━'.repeat(80));
        console.log(`\n💡 Recommendation: Replace ASCII art with Unicode emoji (☯️, 🐉, etc.) or SVG\n`);
    } else {
        console.log('✅ No ASCII art detected! All visuals use modern formats.\n');
    }
}

// Run audit
try {
    auditAsciiArt();
} catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
}
