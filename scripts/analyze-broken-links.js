const fs = require('fs');
const path = require('path');

/**
 * Analyze broken links to categorize error patterns
 */
function analyzeBrokenLinks() {
  const brokenLinksPath = path.join(__dirname, '../reports/broken-links.json');
  const data = JSON.parse(fs.readFileSync(brokenLinksPath, 'utf8'));

  const patterns = {
    prefix_underscore: [],
    contains_newline: [],
    contains_colon: [],
    contains_parentheses: [],
    contains_spaces: [],
    other: []
  };

  const assetCounts = {};

  data.links.forEach(link => {
    const id = link.targetId;
    const assetId = link.assetId;

    // Count broken links per asset
    assetCounts[assetId] = (assetCounts[assetId] || 0) + 1;

    // Categorize the error
    let category;
    if (id.startsWith('_')) {
      category = 'prefix_underscore';
    } else if (id.includes('\n')) {
      category = 'contains_newline';
    } else if (id.includes(':')) {
      category = 'contains_colon';
    } else if (id.includes('(') && id.includes(')')) {
      category = 'contains_parentheses';
    } else if (id.includes(' ')) {
      category = 'contains_spaces';
    } else {
      category = 'other';
    }

    patterns[category].push({
      assetId: link.assetId,
      targetId: id,
      field: link.field,
      mythology: link.assetMythology
    });
  });

  console.log('\n=== BROKEN LINK ANALYSIS ===\n');
  console.log(`Total broken links: ${data.count}\n`);

  console.log('Error Pattern Distribution:');
  Object.keys(patterns).forEach(pattern => {
    console.log(`  ${pattern}: ${patterns[pattern].length}`);
  });

  console.log('\nTop 10 Assets with Most Broken Links:');
  const sortedAssets = Object.entries(assetCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  sortedAssets.forEach(([assetId, count]) => {
    console.log(`  ${assetId}: ${count} broken links`);
  });

  console.log('\nSample Broken IDs by Category:');
  Object.keys(patterns).forEach(category => {
    if (patterns[category].length > 0) {
      console.log(`\n${category} (${patterns[category].length} total):`);
      patterns[category].slice(0, 5).forEach(item => {
        console.log(`  "${item.targetId}" (from ${item.assetId})`);
      });
    }
  });

  // Save detailed analysis
  const analysisPath = path.join(__dirname, '../reports/broken-links-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify({
    totalBroken: data.count,
    patterns,
    assetCounts
  }, null, 2));
  console.log(`\nDetailed analysis saved to ${analysisPath}`);
}

analyzeBrokenLinks();
