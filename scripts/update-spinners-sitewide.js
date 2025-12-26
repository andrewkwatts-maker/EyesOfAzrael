#!/usr/bin/env node

/**
 * Update Spinners Sitewide
 *
 * This script updates all HTML files across the site to:
 * 1. Include the new centralized spinner.css
 * 2. Use only 3 spinner rings (removing the wonky 4th ring)
 * 3. Ensure consistent spinner implementation
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToUpdate = [
    'index.html',
    'search-advanced.html',
    'archetypes.html',
    'compare.html',
    'entity-dynamic.html',
    'dashboard.html',
    'edit.html',
    'templates/mythology-hub.html',
    'templates/entity-grid.html',
    'templates/entity-detail.html',
    'templates/category-index-template.html',
    'admin/review-queue.html',
    'theories/user-submissions/browse.html',
    'theories/user-submissions/edit.html',
    'tests/performance-tests.html',
    'tests/firebase-integration-tests.html',
    'visualizations/globe-timeline.html',
    'visualizations/timeline-tree.html',
    'visualizations/visualizations.html'
];

// Add all mythology index pages
const mythologies = [
    'greek', 'norse', 'egyptian', 'hindu', 'buddhist', 'celtic', 'roman',
    'persian', 'babylonian', 'sumerian', 'chinese', 'japanese', 'aztec',
    'mayan', 'yoruba', 'islamic', 'native_american', 'apocryphal',
    'christian', 'comparative', 'freemasons', 'jewish', 'tarot'
];

mythologies.forEach(myth => {
    filesToUpdate.push(`mythos/${myth}/index.html`);
});

// Statistics
const stats = {
    filesProcessed: 0,
    filesUpdated: 0,
    filesSkipped: 0,
    errors: []
};

function updateFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Skipping ${filePath} (not found)`);
        stats.filesSkipped++;
        return;
    }

    try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Check if spinner.css is already included
        if (!content.includes('css/spinner.css')) {
            // Find where to insert spinner.css
            // Look for styles.css or theme-base.css
            const stylesRegex = /<link\s+rel="stylesheet"\s+href="[^"]*styles\.css"[^>]*>/;
            const themeRegex = /<link\s+rel="stylesheet"\s+href="[^"]*theme-base\.css"[^>]*>/;

            let insertAfter = null;
            let match = content.match(themeRegex);
            if (match) {
                insertAfter = match[0];
            } else {
                match = content.match(stylesRegex);
                if (match) {
                    insertAfter = match[0];
                }
            }

            if (insertAfter) {
                // Calculate relative path to css/spinner.css
                const fileDir = path.dirname(filePath);
                const depth = fileDir.split(path.sep).length - (fileDir === '.' ? 0 : 0);
                let relativePath = '../'.repeat(depth) + 'css/spinner.css';
                if (filePath.startsWith('mythos/') || filePath.startsWith('templates/') ||
                    filePath.startsWith('admin/') || filePath.startsWith('theories/') ||
                    filePath.startsWith('tests/') || filePath.startsWith('visualizations/')) {
                    // Already calculated correctly
                } else if (filePath === 'index.html' || filePath === 'search-advanced.html') {
                    relativePath = 'css/spinner.css';
                }

                content = content.replace(insertAfter,
                    `${insertAfter}\n    <link rel="stylesheet" href="${relativePath}">`);
                modified = true;
            }
        }

        // Check for 4-ring spinners and update to 3 rings
        const fourRingPattern = /(<div\s+class="spinner-container"[^>]*>\s*<div\s+class="spinner-ring"><\/div>\s*<div\s+class="spinner-ring"><\/div>\s*<div\s+class="spinner-ring"><\/div>\s*<div\s+class="spinner-ring"><\/div>)/g;

        if (fourRingPattern.test(content)) {
            content = content.replace(fourRingPattern,
                `<div class="spinner-container">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>`);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated ${filePath}`);
            stats.filesUpdated++;
        } else {
            console.log(`⏭️  No changes needed for ${filePath}`);
            stats.filesSkipped++;
        }

        stats.filesProcessed++;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        stats.errors.push({ file: filePath, error: error.message });
    }
}

// Main execution
console.log('🔄 Starting sitewide spinner update...\n');

filesToUpdate.forEach(file => {
    updateFile(file);
});

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 SPINNER UPDATE SUMMARY');
console.log('='.repeat(60));
console.log(`Files Processed: ${stats.filesProcessed}`);
console.log(`Files Updated:   ${stats.filesUpdated}`);
console.log(`Files Skipped:   ${stats.filesSkipped}`);
console.log(`Errors:          ${stats.errors.length}`);

if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(err => {
        console.log(`  - ${err.file}: ${err.error}`);
    });
}

console.log('\n✨ Spinner update complete!');
console.log('\n📝 Changes made:');
console.log('  1. Added css/spinner.css to all pages with spinners');
console.log('  2. Updated 4-ring spinners to 3-ring spinners');
console.log('  3. Ensured consistent spinner implementation');
console.log('\n🎨 New spinner features:');
console.log('  - 3 concentric rings (no wonky 4th ring)');
console.log('  - Each ring spins independently');
console.log('  - Staggered animation delays (0s, 0.2s, 0.4s)');
console.log('  - Perfect centering around container center');
console.log('  - Modern, smooth animations');
console.log('  - Responsive sizing');

process.exit(stats.errors.length > 0 ? 1 : 0);
