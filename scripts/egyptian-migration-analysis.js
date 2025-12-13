/**
 * Egyptian Mythology Migration Analysis
 *
 * Compares content between old and new repositories
 * Identifies gaps and generates migration recommendations
 */

const fs = require('fs');
const path = require('path');

const OLD_REPO = 'H:\\Github\\EyesOfAzrael2\\EyesOfAzrael\\mythos\\egyptian';
const NEW_REPO = 'H:\\Github\\EyesOfAzrael';

// Category mappings from old repo to new entity types
const CATEGORY_MAP = {
    'deities': 'deity',
    'creatures': 'creature',
    'cosmology': 'concept',  // Cosmology pages become conceptual entries
    'concepts': 'concept',
    'rituals': 'magic',  // Rituals go into magic category
    'texts': 'text',
    'symbols': 'symbol',
    'locations': 'place',
    'heroes': 'hero',
    'herbs': 'item',
    'magic': 'magic'
};

function scanOldRepo() {
    const results = {};

    for (const [oldDir, newCategory] of Object.entries(CATEGORY_MAP)) {
        const dirPath = path.join(OLD_REPO, oldDir);
        if (!fs.existsSync(dirPath)) continue;

        const files = fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.html') && f !== 'index.html');

        if (!results[newCategory]) {
            results[newCategory] = [];
        }

        files.forEach(file => {
            results[newCategory].push({
                id: file.replace('.html', ''),
                sourceDir: oldDir,
                sourcePath: path.join(dirPath, file)
            });
        });
    }

    return results;
}

function scanNewRepo() {
    const results = {};
    const entitiesDir = path.join(NEW_REPO, 'data', 'entities');

    if (!fs.existsSync(entitiesDir)) return results;

    const categories = fs.readdirSync(entitiesDir);

    for (const category of categories) {
        const categoryPath = path.join(entitiesDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        const files = fs.readdirSync(categoryPath)
            .filter(f => f.endsWith('.json'));

        results[category] = [];

        for (const file of files) {
            const filePath = path.join(categoryPath, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                if (data.mythology === 'egyptian') {
                    results[category].push({
                        id: file.replace('.json', ''),
                        displayName: data.displayName,
                        category: data.category
                    });
                }
            } catch (error) {
                console.warn(`Warning: Could not parse ${filePath}: ${error.message}`);
            }
        }
    }

    return results;
}

function compareRepos() {
    console.log('Analyzing Egyptian Mythology Content Migration...\n');

    const oldContent = scanOldRepo();
    const newContent = scanNewRepo();

    const report = {
        oldRepo: {},
        newRepo: {},
        missing: {},
        summary: {
            totalOld: 0,
            totalNew: 0,
            totalMissing: 0
        }
    };

    // Count old repo content
    for (const [category, items] of Object.entries(oldContent)) {
        report.oldRepo[category] = items.length;
        report.summary.totalOld += items.length;
    }

    // Count new repo content
    for (const [category, items] of Object.entries(newContent)) {
        report.newRepo[category] = items.length;
        report.summary.totalNew += items.length;
    }

    // Find missing content
    for (const [category, oldItems] of Object.entries(oldContent)) {
        const newItems = newContent[category] || [];
        const newIds = new Set(newItems.map(item => item.id));

        const missing = oldItems.filter(item => !newIds.has(item.id));

        if (missing.length > 0) {
            report.missing[category] = missing.map(item => ({
                id: item.id,
                sourceDir: item.sourceDir,
                sourcePath: item.sourcePath
            }));
            report.summary.totalMissing += missing.length;
        }
    }

    return report;
}

function printReport(report) {
    console.log('='.repeat(70));
    console.log('EGYPTIAN MYTHOLOGY MIGRATION ANALYSIS');
    console.log('='.repeat(70));
    console.log();

    console.log('📊 SUMMARY');
    console.log('-'.repeat(70));
    console.log(`Total items in old repository:     ${report.summary.totalOld}`);
    console.log(`Total items in new repository:     ${report.summary.totalNew}`);
    console.log(`Missing items (need migration):    ${report.summary.totalMissing}`);
    console.log(`Migration completion:              ${((report.summary.totalNew / report.summary.totalOld) * 100).toFixed(1)}%`);
    console.log();

    console.log('📂 CONTENT BY CATEGORY');
    console.log('-'.repeat(70));
    console.log(`${'Category'.padEnd(15)} | ${'Old Repo'.padEnd(12)} | ${'New Repo'.padEnd(12)} | ${'Missing'.padEnd(12)}`);
    console.log('-'.repeat(70));

    const allCategories = new Set([
        ...Object.keys(report.oldRepo),
        ...Object.keys(report.newRepo)
    ]);

    for (const category of Array.from(allCategories).sort()) {
        const oldCount = report.oldRepo[category] || 0;
        const newCount = report.newRepo[category] || 0;
        const missingCount = report.missing[category]?.length || 0;

        const status = missingCount === 0 ? '✅' : '⚠️';

        console.log(
            `${status} ${category.padEnd(12)} | ${String(oldCount).padEnd(12)} | ${String(newCount).padEnd(12)} | ${String(missingCount).padEnd(12)}`
        );
    }

    console.log();

    if (report.summary.totalMissing > 0) {
        console.log('🔍 MISSING CONTENT DETAILS');
        console.log('-'.repeat(70));

        for (const [category, items] of Object.entries(report.missing)) {
            console.log(`\n${category.toUpperCase()} (${items.length} missing):`);
            items.forEach(item => {
                console.log(`  - ${item.id} (from ${item.sourceDir}/)`);
            });
        }
    } else {
        console.log('✅ All content successfully migrated!');
    }

    console.log();
    console.log('='.repeat(70));
}

function generateMigrationPlan(report) {
    console.log('\n📋 MIGRATION PLAN');
    console.log('-'.repeat(70));

    if (report.summary.totalMissing === 0) {
        console.log('✅ No additional migration needed!');
        return;
    }

    const plan = [];

    for (const [category, items] of Object.entries(report.missing)) {
        plan.push({
            category,
            count: items.length,
            items: items.map(i => i.id),
            priority: getPriority(category)
        });
    }

    plan.sort((a, b) => b.priority - a.priority);

    console.log('\nRecommended migration order (by priority):\n');

    plan.forEach((task, index) => {
        console.log(`${index + 1}. ${task.category.toUpperCase()} (${task.count} items) - Priority: ${task.priority}`);
        console.log(`   Items: ${task.items.join(', ')}`);
        console.log();
    });

    console.log('Priority levels:');
    console.log('  10 = Critical core content (cosmology, key concepts)');
    console.log('   8 = Important content (creatures, places, texts)');
    console.log('   5 = Supporting content (rituals, symbols, items)');
    console.log('   3 = Supplementary content');
}

function getPriority(category) {
    const priorities = {
        'concept': 10,      // Cosmology and core concepts
        'place': 8,         // Important locations
        'creature': 8,      // Mythological creatures
        'text': 8,          // Sacred texts
        'magic': 5,         // Rituals and magical practices
        'symbol': 5,        // Symbols
        'item': 5,          // Sacred items/herbs
        'hero': 3           // Heroes
    };

    return priorities[category] || 1;
}

// Main execution
const report = compareRepos();
printReport(report);
generateMigrationPlan(report);

// Save detailed report
const reportPath = path.join(NEW_REPO, 'scripts', 'egyptian-migration-analysis.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`\nDetailed report saved to: ${reportPath}`);
