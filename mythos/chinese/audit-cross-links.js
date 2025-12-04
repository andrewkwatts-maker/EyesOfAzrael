#!/usr/bin/env node

/**
 * Audit script: Check cross-mythology interlinking quality
 * Verifies connections to other mythology sections
 */

const fs = require('fs');
const path = require('path');

const chineseDir = path.join(__dirname);

// Expected cross-cultural links based on archetypes
const expectedCrossLinks = {
    'deities/jade-emperor.html': [
        { tradition: 'greek', deity: 'zeus', archetype: 'Sky Father' },
        { tradition: 'norse', deity: 'odin', archetype: 'Sky Father' },
        { tradition: 'hindu', deity: 'indra', archetype: 'Sky Father' }
    ],
    'deities/guanyin.html': [
        { tradition: 'buddhist', deity: 'avalokiteshvara', archetype: 'Compassion' }
    ],
    'deities/guan-yu.html': [
        { tradition: 'greek', deity: 'ares', archetype: 'War God' },
        { tradition: 'norse', deity: 'tyr', archetype: 'War God' },
        { tradition: 'roman', deity: 'mars', archetype: 'War God' }
    ],
    'cosmology/creation.html': [
        { tradition: 'norse', concept: 'ymir', archetype: 'Primordial Giant' },
        { tradition: 'hindu', concept: 'purusha', archetype: 'Cosmic Person' }
    ]
};

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

// Check for cross-cultural links in a file
function checkCrossCultural(content) {
    const traditions = [
        'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'japanese',
        'roman', 'celtic', 'aztec', 'mayan', 'sumerian', 'babylonian',
        'christian', 'jewish', 'islamic'
    ];

    const findings = {
        hasCrossCulturalSection: content.includes('Cross-Cultural Parallels') || content.includes('cross-cultural'),
        hasInterlinkling: false,
        linkedTraditions: [],
        hasParallelGrid: content.includes('parallel-grid'),
        hasArchetypeLink: content.includes('archetype')
    };

    for (const tradition of traditions) {
        const tradPattern = new RegExp(`href=["'].*?\\/mythos\\/${tradition}\\/`, 'gi');
        if (tradPattern.test(content)) {
            findings.hasInterlinkling = true;
            findings.linkedTraditions.push(tradition);
        }
    }

    return findings;
}

// Main audit
function auditCrossLinks() {
    console.log('🌍 Auditing cross-mythology interlinking in Chinese section...\n');

    const htmlFiles = getHtmlFiles(chineseDir);
    const results = {
        total: htmlFiles.length,
        withCrossLinks: 0,
        withoutCrossLinks: 0,
        details: []
    };

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(chineseDir, file);
        const findings = checkCrossCultural(content);

        if (findings.hasInterlinkling) {
            results.withCrossLinks++;
        } else {
            results.withoutCrossLinks++;
        }

        // Check key pages
        if (relativePath === 'index.html' ||
            relativePath === 'deities/index.html' ||
            relativePath.startsWith('deities/jade-emperor') ||
            relativePath.startsWith('deities/guanyin') ||
            relativePath.startsWith('cosmology/')) {

            results.details.push({
                file: relativePath,
                ...findings
            });
        }
    }

    // Report results
    console.log('━'.repeat(80));
    console.log('AUDIT RESULTS: Cross-Mythology Interlinking');
    console.log('━'.repeat(80));
    console.log(`Total files: ${results.total}`);
    console.log(`Files with cross-links: ${results.withCrossLinks}`);
    console.log(`Files without cross-links: ${results.withoutCrossLinks}`);
    console.log(`Percentage with interlinking: ${(results.withCrossLinks / results.total * 100).toFixed(1)}%\n`);

    console.log('KEY PAGES ANALYSIS:\n');

    for (const detail of results.details) {
        console.log(`📄 ${detail.file}`);
        console.log(`   Cross-cultural section: ${detail.hasCrossCulturalSection ? '✅' : '❌'}`);
        console.log(`   Has interlinking: ${detail.hasInterlinkling ? '✅' : '❌'}`);
        console.log(`   Parallel grid: ${detail.hasParallelGrid ? '✅' : '❌'}`);
        console.log(`   Archetype links: ${detail.hasArchetypeLink ? '✅' : '❌'}`);
        if (detail.linkedTraditions.length > 0) {
            console.log(`   Linked to: ${detail.linkedTraditions.join(', ')}`);
        }
        console.log();
    }

    console.log('━'.repeat(80));

    if (results.withCrossLinks / results.total > 0.5) {
        console.log('✅ Good cross-mythology interlinking coverage!\n');
    } else {
        console.log('⚠️  Consider adding more cross-cultural connections\n');
    }
}

// Run audit
try {
    auditCrossLinks();
} catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
}
