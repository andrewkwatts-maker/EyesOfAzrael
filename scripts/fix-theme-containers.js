#!/usr/bin/env node

/**
 * Script to ensure all HTML files have theme-picker-container
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getAllHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

function addThemePickerContainer(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Skip if already has theme-picker-container
    if (content.includes('theme-picker-container')) {
        return false;
    }

    // Find <body> tag and add container after it
    const bodyMatch = content.match(/<body[^>]*>/);
    if (!bodyMatch) {
        console.log(`⚠️  No <body> tag found: ${filePath}`);
        return false;
    }

    const bodyTag = bodyMatch[0];
    const bodyIndex = content.indexOf(bodyTag);
    const afterBody = bodyIndex + bodyTag.length;

    // Insert theme picker container
    content = content.substring(0, afterBody) +
              '\n    <div id="theme-picker-container"></div>' +
              content.substring(afterBody);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    }

    return false;
}

// Main execution
console.log('🎨 Adding theme-picker-container to all HTML files...\n');

const mythosDir = path.join(process.cwd(), 'mythos');
const allFiles = getAllHtmlFiles(mythosDir);

let addedCount = 0;
let skippedCount = 0;

allFiles.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    try {
        if (addThemePickerContainer(file)) {
            console.log(`✓ Added container: ${relativePath}`);
            addedCount++;
        } else {
            skippedCount++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${relativePath}:`, error.message);
    }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Theme Container Addition Summary');
console.log('='.repeat(60));
console.log(`✓ Containers added: ${addedCount}`);
console.log(`⊘ Files skipped (already have container): ${skippedCount}`);
console.log(`📁 Total files processed: ${allFiles.length}`);
console.log('='.repeat(60));

if (addedCount > 0) {
    console.log('\n✅ Theme picker containers added successfully!');
} else {
    console.log('\n⚠️  All files already have theme picker containers.');
}
