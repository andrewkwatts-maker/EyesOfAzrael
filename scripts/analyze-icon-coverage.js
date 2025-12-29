const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'entities');
const CATEGORIES = ['deity', 'creature', 'hero', 'item', 'place', 'herb', 'ritual', 'text', 'symbol'];

function analyzeIconCoverage() {
  const results = {
    total: { withIcon: 0, withoutIcon: 0, entities: [] },
    byCategory: {}
  };

  CATEGORIES.forEach(category => {
    results.byCategory[category] = {
      withIcon: 0,
      withoutIcon: 0,
      entities: [],
      missingEntities: []
    };
  });

  CATEGORIES.forEach(category => {
    const categoryDir = path.join(DATA_DIR, category);

    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️  Category directory not found: ${category}`);
      return;
    }

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(categoryDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const entityId = file.replace('.json', '');

        if (data.icon && data.icon.trim() !== '') {
          results.byCategory[category].withIcon++;
          results.total.withIcon++;
        } else {
          results.byCategory[category].withoutIcon++;
          results.total.withoutIcon++;
          results.byCategory[category].missingEntities.push({
            id: entityId,
            name: data.name || entityId,
            mythology: data.mythology || 'unknown',
            category: category,
            domains: data.domains || [],
            type: data.type || category
          });
        }

        results.byCategory[category].entities.push(entityId);
      } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
      }
    });
  });

  return results;
}

function printReport(results) {
  console.log('\n=== ICON COVERAGE ANALYSIS ===\n');

  const totalEntities = results.total.withIcon + results.total.withoutIcon;
  const totalCoverage = totalEntities > 0
    ? ((results.total.withIcon / totalEntities) * 100).toFixed(1)
    : 0;

  console.log(`📊 OVERALL COVERAGE: ${totalCoverage}% (${results.total.withIcon}/${totalEntities})`);
  console.log(`   ✅ With icons: ${results.total.withIcon}`);
  console.log(`   ❌ Missing icons: ${results.total.withoutIcon}\n`);

  console.log('📋 BY CATEGORY:\n');

  CATEGORIES.forEach(category => {
    const data = results.byCategory[category];
    const total = data.withIcon + data.withoutIcon;
    const coverage = total > 0 ? ((data.withIcon / total) * 100).toFixed(1) : 0;

    console.log(`${category.toUpperCase()}:`);
    console.log(`   Coverage: ${coverage}% (${data.withIcon}/${total})`);
    console.log(`   Missing: ${data.withoutIcon} icons needed`);

    if (data.withoutIcon > 0) {
      console.log(`   Sample missing: ${data.missingEntities.slice(0, 3).map(e => e.name).join(', ')}...`);
    }
    console.log('');
  });

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'ICON_COVERAGE_ANALYSIS.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return results;
}

// Run analysis
const results = analyzeIconCoverage();
printReport(results);

module.exports = { analyzeIconCoverage };
