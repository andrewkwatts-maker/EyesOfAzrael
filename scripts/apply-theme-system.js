#!/usr/bin/env node

/**
 * Script to apply standardized theme system to HTML files
 * Adds theme CSS/JS includes and theme picker container
 */

const fs = require('fs');
const path = require('path');

// Files to update (from grep results)
const filesToUpdate = [
    './mythos/christian/gnostic/refining-fire.html',
    './mythos/christian/teachings/parables/index.html',
    './mythos/christian/teachings/parables/mustard-seed.html',
    './mythos/comparative/assumption-traditions/index.html',
    './mythos/comparative/dying-rising-gods/dying-rising-gods.html',
    './mythos/comparative/flood-myths/atrahasis-flood.html',
    './mythos/comparative/flood-myths/comparative-flood-chart.html',
    './mythos/comparative/flood-myths/enoch-flood.html',
    './mythos/comparative/flood-myths/enoch-watchers-nephilim.html',
    './mythos/comparative/flood-myths/flood-geology.html',
    './mythos/comparative/flood-myths/flood-typology.html',
    './mythos/comparative/flood-myths/genesis-flood.html',
    './mythos/comparative/flood-myths/gilgamesh-flood.html',
    './mythos/comparative/flood-myths/global-flood-myths.html',
    './mythos/comparative/flood-myths/index.html',
    './mythos/comparative/gilgamesh-biblical/comprehensive-parallels.html',
    './mythos/comparative/gilgamesh-biblical/creation-parallels.html',
    './mythos/comparative/gilgamesh-biblical/friendship-covenant.html',
    './mythos/comparative/gilgamesh-biblical/gilgamesh-nephilim.html',
    './mythos/comparative/gilgamesh-biblical/hero-quest.html',
    './mythos/comparative/gilgamesh-biblical/immortality-quest.html',
    './mythos/comparative/gilgamesh-biblical/index.html',
    './mythos/comparative/gilgamesh-biblical/temple-prostitution.html',
    './mythos/comparative/gilgamesh-biblical/underworld-journey.html',
    './mythos/comparative/gilgamesh-biblical/whore-of-babylon.html',
    './mythos/japanese/deities/fujin.html',
    './mythos/jewish/heroes/enoch/1-enoch-heavenly-journeys.html',
    './mythos/jewish/heroes/enoch/assumption-tradition.html',
    './mythos/jewish/heroes/enoch/enoch-calendar.html',
    './mythos/jewish/heroes/enoch/enoch-hermes-thoth.html',
    './mythos/jewish/heroes/enoch/enoch-islam.html',
    './mythos/jewish/heroes/enoch/enoch-pseudepigrapha.html',
    './mythos/jewish/heroes/enoch/genesis-enoch.html',
    './mythos/jewish/heroes/enoch/index.html',
    './mythos/jewish/heroes/enoch/metatron-transformation.html',
    './mythos/jewish/heroes/enoch/seven-seals.html',
    './mythos/jewish/heroes/moses/parallels/circumcision-parallels.html',
    './mythos/jewish/heroes/moses/parallels/egyptian-monotheism.html',
    './mythos/jewish/heroes/moses/parallels/magician-showdown.html',
    './mythos/jewish/heroes/moses/parallels/moses-horus-parallels.html',
    './mythos/jewish/heroes/moses/parallels/plagues-egyptian-gods.html',
    './mythos/jewish/heroes/moses/parallels/reed-symbolism.html',
    './mythos/jewish/heroes/moses/parallels/virgin-births.html',
    './mythos/jewish/texts/genesis/parallels/flood-myths-ane.html',
    './mythos/jewish/texts/genesis/parallels/index.html',
    './mythos/jewish/texts/genesis/parallels/potter-and-clay.html',
    './mythos/jewish/texts/genesis/parallels/tiamat-and-tehom.html'
];

function getRelativePath(filePath, levels) {
    return '../'.repeat(levels);
}

function calculateDepth(filePath) {
    // Count directory depth from mythos/
    const parts = filePath.split('/');
    const mythosIndex = parts.indexOf('mythos');
    if (mythosIndex === -1) return 3; // default
    return parts.length - mythosIndex - 2; // -2 for mythos and filename
}

function updateHtmlFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Calculate relative path depth
    const depth = calculateDepth(filePath);
    const relativePath = getRelativePath(filePath, depth);

    // Check if already has theme-base.css
    if (content.includes('theme-base.css')) {
        console.log(`✓ Already has themes: ${filePath}`);
        return false;
    }

    let modified = false;

    // Find the </head> tag and add theme includes before it
    const headCloseIndex = content.indexOf('</head>');
    if (headCloseIndex === -1) {
        console.log(`⚠️  No </head> tag found: ${filePath}`);
        return false;
    }

    // Look for existing styles.css to insert theme files before it
    const stylesPattern = /<link[^>]*href=["']([^"']*styles\.css)["'][^>]*>/;
    const stylesMatch = content.match(stylesPattern);

    const themeIncludes = `
    <!-- Modern Theme System -->
    <link rel="stylesheet" href="${relativePath}themes/theme-base.css">
    <link rel="stylesheet" href="${relativePath}themes/mythology-colors.css">
    <link rel="stylesheet" href="${relativePath}themes/smart-links.css">`;

    const themeScripts = `
    <script defer src="${relativePath}themes/theme-picker.js"></script>
    <script defer src="${relativePath}themes/theme-animations.js"></script>
    <script defer src="${relativePath}themes/smart-links.js"></script>`;

    if (stylesMatch) {
        // Insert theme CSS before styles.css
        content = content.replace(stylesMatch[0], themeIncludes + '\n    ' + stylesMatch[0]);
        modified = true;
    } else {
        // Insert before </head>
        const headContent = content.substring(0, headCloseIndex);
        const afterHead = content.substring(headCloseIndex);
        content = headContent + themeIncludes + '\n    ' + themeScripts + '\n' + afterHead;
        modified = true;
    }

    // Add theme scripts before </head> if not already added
    if (!content.includes('theme-picker.js')) {
        content = content.replace('</head>', themeScripts + '\n</head>');
        modified = true;
    }

    // Add theme picker container after <body> tag if not present
    if (!content.includes('theme-picker-container')) {
        const bodyMatch = content.match(/<body[^>]*>/);
        if (bodyMatch) {
            const bodyTag = bodyMatch[0];
            content = content.replace(bodyTag, bodyTag + '\n    <div id="theme-picker-container"></div>');
            modified = true;
        }
    }

    if (modified && content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✓ Updated: ${filePath}`);
        return true;
    }

    return false;
}

// Main execution
console.log('🎨 Applying standardized theme system to HTML files...\n');

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(filePath => {
    try {
        const updated = updateHtmlFile(filePath);
        if (updated) {
            updatedCount++;
        } else {
            skippedCount++;
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        errorCount++;
    }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Theme System Application Summary');
console.log('='.repeat(60));
console.log(`✓ Files updated: ${updatedCount}`);
console.log(`⊘ Files skipped (already have themes): ${skippedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📁 Total files processed: ${filesToUpdate.length}`);
console.log('='.repeat(60));

if (updatedCount > 0) {
    console.log('\n✅ Theme system successfully applied to all files!');
} else {
    console.log('\n⚠️  No files needed updating.');
}
