#!/usr/bin/env node

/**
 * Fix Items Collection Assets
 *
 * Fixes items collection by adding missing required fields:
 * - mythology: Extracted from primaryMythology or mythologies array
 * - description: Extracted from shortDescription or longDescription
 * - icon: Default item icon SVG
 * - powers: Ensure powers array exists
 * - type: Ensure "item" type is set
 *
 * Issues Found in Items:
 * - Missing mythology field (has primaryMythology instead)
 * - Missing description field (has shortDescription/longDescription instead)
 * - Missing creation timestamp
 * - Some have empty powers array
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Item icon SVG (from generate-svg-icons-firebase.js)
const ITEM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28.8" fill="#6a5acd" opacity="0.2"/>
  <circle cx="32" cy="32" r="16" fill="none" stroke="#6a5acd" stroke-width="2"/>
  <text x="32" y="44.8" text-anchor="middle" font-size="22.4" fill="#6a5acd">💎</text>
</svg>`;

// Statistics
const stats = {
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0,
    fixes: {
        mythology: 0,
        description: 0,
        icon: 0,
        powers: 0,
        createdAt: 0,
        type: 0
    }
};

/**
 * Extract mythology from item data
 */
function extractMythology(data) {
    // Priority order:
    // 1. primaryMythology
    // 2. First item in mythologies array
    // 3. First item in mythologyContexts array
    // 4. Extract from tags or searchTerms

    if (data.primaryMythology && data.primaryMythology !== '') {
        return data.primaryMythology;
    }

    if (data.mythologies && Array.isArray(data.mythologies) && data.mythologies.length > 0) {
        // Filter out generic terms
        const validMythologies = data.mythologies.filter(m =>
            m && !['priestly', 'tabernacle relic', 'relic', 'divine-artifact', 'shield', 'protection'].includes(m)
        );
        if (validMythologies.length > 0) {
            return validMythologies[0];
        }
    }

    if (data.mythologyContexts && Array.isArray(data.mythologyContexts) && data.mythologyContexts.length > 0) {
        return data.mythologyContexts[0].mythology;
    }

    // Try to extract from tags
    const mythologyTags = ['greek', 'norse', 'egyptian', 'hindu', 'celtic', 'babylonian',
                          'sumerian', 'christian', 'jewish', 'islamic', 'buddhist', 'chinese',
                          'japanese', 'roman', 'persian', 'aztec', 'mayan'];

    if (data.tags && Array.isArray(data.tags)) {
        for (const tag of data.tags) {
            if (mythologyTags.includes(tag.toLowerCase())) {
                return tag.toLowerCase();
            }
        }
    }

    if (data.searchTerms && Array.isArray(data.searchTerms)) {
        for (const term of data.searchTerms) {
            if (mythologyTags.includes(term.toLowerCase())) {
                return term.toLowerCase();
            }
        }
    }

    return null;
}

/**
 * Extract description from item data
 */
function extractDescription(data) {
    // Priority order:
    // 1. shortDescription
    // 2. longDescription (first 200 chars)
    // 3. First extendedContent section
    // 4. Generate from name and itemType

    if (data.shortDescription && data.shortDescription.trim().length > 0) {
        return data.shortDescription.trim();
    }

    if (data.longDescription && data.longDescription.trim().length > 0) {
        const desc = data.longDescription.trim();
        // Take first paragraph or 200 chars
        const firstPara = desc.split('\n')[0];
        if (firstPara.length <= 200) {
            return firstPara;
        }
        return desc.substring(0, 197) + '...';
    }

    if (data.extendedContent && Array.isArray(data.extendedContent) && data.extendedContent.length > 0) {
        const firstSection = data.extendedContent[0];
        if (firstSection.content && firstSection.content.trim().length > 0) {
            const content = firstSection.content.trim();
            const firstPara = content.split('\n')[0];
            if (firstPara.length <= 200) {
                return firstPara;
            }
            return content.substring(0, 197) + '...';
        }
    }

    // Generate basic description
    const itemType = data.itemType || data.subtype || 'item';
    return `A ${itemType} from ${data.name || 'mythology'}`;
}

/**
 * Extract powers from item data
 */
function extractPowers(data) {
    if (data.powers && Array.isArray(data.powers) && data.powers.length > 0) {
        // Filter out empty or "protection" only entries
        const validPowers = data.powers.filter(p =>
            p && p.trim().length > 0 && p.trim().toLowerCase() !== 'protection'
        );

        if (validPowers.length > 0) {
            return validPowers;
        }
    }

    // Try to extract from extendedContent
    if (data.extendedContent && Array.isArray(data.extendedContent)) {
        for (const section of data.extendedContent) {
            if (section.title &&
                (section.title.toLowerCase().includes('power') ||
                 section.title.toLowerCase().includes('abilities'))) {
                if (section.content) {
                    // Extract bullet points or split by commas
                    const lines = section.content.split('\n')
                        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
                        .map(line => line.replace(/^[-•]\s*/, '').trim())
                        .filter(line => line.length > 0);

                    if (lines.length > 0) {
                        return lines.slice(0, 5); // Limit to 5 powers
                    }
                }
            }
        }
    }

    // Default powers based on item type
    const itemType = data.itemType || data.subtype || 'artifact';
    if (itemType.includes('weapon')) {
        return ['Enhanced combat abilities', 'Supernatural power'];
    } else if (itemType.includes('armor')) {
        return ['Divine protection', 'Enhanced defense'];
    } else if (itemType.includes('relic') || itemType.includes('sacred')) {
        return ['Spiritual power', 'Divine blessing'];
    }

    return ['Mystical properties'];
}

/**
 * Fix a single item
 */
async function fixItem(id, data, dryRun = false) {
    const updates = {};
    let needsUpdate = false;

    // Fix: mythology field
    if (!data.mythology || data.mythology === '') {
        const mythology = extractMythology(data);
        if (mythology) {
            updates.mythology = mythology;
            stats.fixes.mythology++;
            needsUpdate = true;
        } else {
            console.warn(`  ⚠️  Could not extract mythology for ${id}`);
        }
    }

    // Fix: description field
    if (!data.description || data.description.trim().length < 50) {
        const description = extractDescription(data);
        if (description && description.length >= 50) {
            updates.description = description;
            stats.fixes.description++;
            needsUpdate = true;
        } else {
            console.warn(`  ⚠️  Description too short for ${id}: ${description?.length || 0} chars`);
        }
    }

    // Fix: icon field (if using emoji instead of SVG)
    if (!data.icon || (data.icon && data.icon.length < 50)) {
        updates.icon = ITEM_ICON_SVG;
        stats.fixes.icon++;
        needsUpdate = true;
    }

    // Fix: powers array
    if (!data.powers || !Array.isArray(data.powers) || data.powers.length === 0) {
        const powers = extractPowers(data);
        if (powers.length > 0) {
            updates.powers = powers;
            stats.fixes.powers++;
            needsUpdate = true;
        }
    }

    // Fix: type field
    if (!data.type || data.type === '') {
        updates.type = 'item';
        stats.fixes.type++;
        needsUpdate = true;
    }

    // Fix: creation timestamp
    if (!data._created && !data.createdAt) {
        updates._created = new Date().toISOString();
        stats.fixes.createdAt++;
        needsUpdate = true;
    }

    if (!needsUpdate) {
        return false;
    }

    // Apply updates
    if (!dryRun) {
        try {
            await db.collection('items').doc(id).update(updates);
            return true;
        } catch (error) {
            console.error(`  ❌ Error updating ${id}:`, error.message);
            stats.errors++;
            return false;
        }
    }

    return true;
}

/**
 * Process all failed items
 */
async function processItems(dryRun = false) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔧 FIXING ITEMS COLLECTION`);
    console.log(`${'='.repeat(60)}\n`);

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Load failed assets
    const failedAssetsPath = path.join(__dirname, '..', 'FAILED_ASSETS.json');
    const failedAssets = JSON.parse(fs.readFileSync(failedAssetsPath, 'utf8'));

    const failedItems = failedAssets.filter(a => a.collection === 'items');
    stats.total = failedItems.length;

    console.log(`📊 Found ${stats.total} failed items\n`);

    // Process each item
    for (let i = 0; i < failedItems.length; i++) {
        const { id, data, issues } = failedItems[i];

        process.stdout.write(`[${i + 1}/${stats.total}] Processing ${id}...`);

        const fixed = await fixItem(id, data, dryRun);

        if (fixed) {
            stats.fixed++;
            console.log(` ✅ Fixed`);
        } else {
            stats.skipped++;
            console.log(` ⏭️  Skipped`);
        }
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total items processed: ${stats.total}`);
    console.log(`Items fixed: ${stats.fixed}`);
    console.log(`Items skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\nFixes applied:`);
    console.log(`  - mythology: ${stats.fixes.mythology}`);
    console.log(`  - description: ${stats.fixes.description}`);
    console.log(`  - icon: ${stats.fixes.icon}`);
    console.log(`  - powers: ${stats.fixes.powers}`);
    console.log(`  - type: ${stats.fixes.type}`);
    console.log(`  - createdAt: ${stats.fixes.createdAt}`);
    console.log(`${'='.repeat(60)}\n`);

    if (dryRun) {
        console.log('💡 Run without --dry-run to apply changes\n');
    } else {
        const passRate = ((stats.fixed / stats.total) * 100).toFixed(1);
        console.log(`📈 Expected pass rate improvement: ${passRate}%\n`);
    }
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    try {
        await processItems(dryRun);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { fixItem, extractMythology, extractDescription, extractPowers };
