#!/usr/bin/env node

/**
 * Audit script: Check completeness of Chinese mythology section
 * Verifies all expected pages exist and index pages have complete listings
 */

const fs = require('fs');
const path = require('path');

const chineseDir = path.join(__dirname);

// Expected structure based on index.html
const expectedPages = {
    main: ['index.html', 'corpus-search.html'],
    deities: [
        'index.html',
        'jade-emperor.html',
        'guanyin.html',
        'guan-yu.html',
        'xi-wangmu.html',
        'dragon-kings.html',
        'nezha.html',
        'erlang-shen.html',
        'zao-jun.html'
    ],
    cosmology: [
        'index.html',
        'creation.html',
        'afterlife.html'
    ],
    heroes: ['index.html'],
    creatures: ['index.html'],
    herbs: ['index.html'],
    rituals: ['index.html'],
    magic: ['index.html'],
    path: ['index.html'],
    texts: ['index.html'],
    symbols: ['index.html']
};

// Check if files exist
function checkPageExists(dir, filename) {
    const fullPath = path.join(chineseDir, dir, filename);
    return fs.existsSync(fullPath);
}

// Extract linked pages from index
function extractLinkedPages(indexContent) {
    const linkPattern = /href=["']([^"']+\.html)["']/g;
    const links = new Set();
    let match;

    while ((match = linkPattern.exec(indexContent)) !== null) {
        const link = match[1];
        // Only internal links
        if (!link.startsWith('http') && !link.startsWith('../') && !link.startsWith('../../')) {
            links.add(link);
        }
    }

    return Array.from(links);
}

// Main audit
function auditCompleteness() {
    console.log('📋 Auditing completeness of Chinese mythology section...\n');

    const results = {
        existing: [],
        missing: [],
        extraFiles: [],
        indexIssues: []
    };

    // Check each category
    for (const [category, files] of Object.entries(expectedPages)) {
        const dirPath = category === 'main' ? '' : category;

        console.log(`Checking ${category}...`);

        for (const file of files) {
            const exists = checkPageExists(dirPath, file);
            const fullPath = path.join(dirPath, file);

            if (exists) {
                results.existing.push(fullPath);
            } else {
                results.missing.push(fullPath);
            }
        }
    }

    // Check index page completeness
    const mainIndexPath = path.join(chineseDir, 'index.html');
    if (fs.existsSync(mainIndexPath)) {
        const indexContent = fs.readFileSync(mainIndexPath, 'utf-8');
        const linkedPages = extractLinkedPages(indexContent);

        // Check if all deity pages are linked
        const deityIndexPath = path.join(chineseDir, 'deities', 'index.html');
        if (fs.existsSync(deityIndexPath)) {
            const deityContent = fs.readFileSync(deityIndexPath, 'utf-8');
            const deityLinks = extractLinkedPages(deityContent);

            for (const deity of expectedPages.deities) {
                if (deity !== 'index.html' && !deityLinks.includes(deity)) {
                    results.indexIssues.push(`deities/index.html missing link to ${deity}`);
                }
            }
        }
    }

    // Report results
    console.log('\n' + '━'.repeat(80));
    console.log('AUDIT RESULTS: Section Completeness');
    console.log('━'.repeat(80));

    const totalExpected = Object.values(expectedPages).flat().length;
    console.log(`\nExpected pages: ${totalExpected}`);
    console.log(`Existing pages: ${results.existing.length}`);
    console.log(`Missing pages: ${results.missing.length}\n`);

    if (results.missing.length > 0) {
        console.log('❌ MISSING PAGES:\n');
        for (const page of results.missing) {
            console.log(`   ${page}`);
        }
        console.log();
    }

    if (results.indexIssues.length > 0) {
        console.log('⚠️  INDEX LINKING ISSUES:\n');
        for (const issue of results.indexIssues) {
            console.log(`   ${issue}`);
        }
        console.log();
    }

    const completeness = (results.existing.length / totalExpected * 100).toFixed(1);
    console.log('━'.repeat(80));
    console.log(`\nSection Completeness: ${completeness}%`);

    if (results.missing.length === 0 && results.indexIssues.length === 0) {
        console.log('✅ All expected pages exist and are properly linked!\n');
    } else {
        console.log(`⚠️  ${results.missing.length} page(s) need to be created\n`);
    }
}

// Run audit
try {
    auditCompleteness();
} catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
}
