/**
 * Count Mythology Categories
 *
 * This script counts actual HTML files in each mythology's category folders
 * to generate accurate category counts for the mythologies collection.
 */

const fs = require('fs');
const path = require('path');

// Base path to mythos directory
const MYTHOS_PATH = path.join(__dirname, '..', 'mythos');

// List of mythologies to scan
const mythologies = [
    'greek', 'norse', 'egyptian', 'hindu', 'buddhist',
    'chinese', 'japanese', 'celtic', 'babylonian', 'persian',
    'christian', 'islamic', 'roman', 'sumerian', 'aztec',
    'mayan', 'yoruba'
];

// Categories to check (ordered by importance)
const categories = [
    'deities', 'heroes', 'creatures', 'texts', 'cosmology',
    'rituals', 'herbs', 'magic', 'places', 'symbols',
    'concepts', 'events', 'lineage', 'beings', 'figures', 'myths'
];

/**
 * Count HTML files in a directory (excluding index.html)
 */
function countFiles(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return 0;
        }

        const files = fs.readdirSync(dirPath);
        return files.filter(file => {
            if (file === 'index.html') return false;
            if (!file.endsWith('.html')) return false;

            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            return stat.isFile();
        }).length;
    } catch (error) {
        console.error(`Error counting files in ${dirPath}:`, error.message);
        return 0;
    }
}

/**
 * Recursively count all HTML files in nested directories
 */
function countFilesRecursive(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return 0;
        }

        let count = 0;
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isFile() && item.endsWith('.html') && item !== 'index.html') {
                count++;
            } else if (stat.isDirectory()) {
                count += countFilesRecursive(itemPath);
            }
        }

        return count;
    } catch (error) {
        console.error(`Error counting files recursively in ${dirPath}:`, error.message);
        return 0;
    }
}

/**
 * Scan a single mythology and count all categories
 */
function scanMythology(mythId) {
    const mythPath = path.join(MYTHOS_PATH, mythId);

    if (!fs.existsSync(mythPath)) {
        console.warn(`⚠️  Mythology folder not found: ${mythId}`);
        return null;
    }

    const categoryCounts = {};
    let totalFiles = 0;

    for (const category of categories) {
        const categoryPath = path.join(mythPath, category);
        const count = countFilesRecursive(categoryPath);

        if (count > 0) {
            categoryCounts[category] = { enabled: true, count };
            totalFiles += count;
        }
    }

    return {
        id: mythId,
        categories: categoryCounts,
        totalFiles
    };
}

/**
 * Main function
 */
function main() {
    console.log('📊 MYTHOLOGY CATEGORY COUNTER\n');
    console.log('Scanning mythologies for category counts...\n');

    const results = {};
    let grandTotal = 0;

    // Scan each mythology
    for (const mythId of mythologies) {
        const result = scanMythology(mythId);

        if (result) {
            results[mythId] = result;
            grandTotal += result.totalFiles;

            console.log(`✅ ${mythId.toUpperCase()}: ${result.totalFiles} total files`);

            // Show category breakdown
            const sortedCategories = Object.entries(result.categories)
                .sort((a, b) => b[1].count - a[1].count);

            for (const [cat, data] of sortedCategories) {
                console.log(`   - ${cat}: ${data.count}`);
            }
            console.log('');
        }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`📈 GRAND TOTAL: ${grandTotal} files across ${Object.keys(results).length} mythologies`);
    console.log('═══════════════════════════════════════════\n');

    // Generate summary table
    console.log('📋 CATEGORY SUMMARY TABLE:\n');
    console.log('Mythology'.padEnd(15) + categories.slice(0, 8).map(c => c.substring(0, 7).padEnd(8)).join(''));
    console.log('─'.repeat(15 + 8 * 8));

    for (const mythId of mythologies) {
        if (results[mythId]) {
            let row = mythId.padEnd(15);
            for (const cat of categories.slice(0, 8)) {
                const count = results[mythId].categories[cat]?.count || 0;
                row += (count > 0 ? count.toString() : '-').padEnd(8);
            }
            console.log(row);
        }
    }

    // Save results to JSON
    const outputPath = path.join(__dirname, '..', 'AGENT_11_CATEGORY_COUNTS.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);

    return results;
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { scanMythology, countFiles, countFilesRecursive };
