const failed = require('../FAILED_ASSETS.json');

// Analyze issue patterns
const issues = {};
const byCollection = {};
const missingTypeAssets = [];

failed.forEach(asset => {
  // Count by collection
  byCollection[asset.collection] = (byCollection[asset.collection] || 0) + 1;

  // Count issues
  asset.issues.forEach(issue => {
    const key = `${issue.field}: ${issue.message}`;
    issues[key] = (issues[key] || 0) + 1;

    // Track missing type field
    if (issue.field === 'type' && issue.message && issue.message.includes('Missing')) {
      missingTypeAssets.push({
        collection: asset.collection,
        id: asset.id,
        mythology: asset.data?.mythology
      });
    }
  });
});

console.log('\n=== TOP 20 VALIDATION ISSUES ===');
Object.entries(issues)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([issue, count]) => {
    console.log(`${String(count).padStart(4)} - ${issue}`);
  });

console.log('\n=== FAILURES BY COLLECTION ===');
Object.entries(byCollection)
  .sort((a, b) => b[1] - a[1])
  .forEach(([coll, count]) => {
    console.log(`${String(count).padStart(4)} - ${coll}`);
  });

console.log('\n=== MISSING TYPE FIELD BREAKDOWN ===');
const typesByCollection = {};
missingTypeAssets.forEach(asset => {
  typesByCollection[asset.collection] = (typesByCollection[asset.collection] || 0) + 1;
});
Object.entries(typesByCollection)
  .sort((a, b) => b[1] - a[1])
  .forEach(([coll, count]) => {
    console.log(`${String(count).padStart(4)} - ${coll}`);
  });

console.log(`\n=== SUMMARY ===`);
console.log(`Total failed assets: ${failed.length}`);
console.log(`Total unique issues: ${Object.keys(issues).length}`);
console.log(`Assets missing type field: ${missingTypeAssets.length}`);
