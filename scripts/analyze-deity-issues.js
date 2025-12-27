const fs = require('fs');

// Read FAILED_ASSETS.json
const data = JSON.parse(fs.readFileSync('FAILED_ASSETS.json', 'utf8'));

// Filter for deities with missing description or domains
const deities = data.filter(d =>
  d.collection === 'deities' && (!d.description || !d.domains)
);

console.log(`Total deities with missing fields: ${deities.length}`);
console.log('\nSample entries:');
console.log(JSON.stringify(deities.slice(0, 5), null, 2));

// Save to file
fs.writeFileSync('deity_issues.json', JSON.stringify(deities, null, 2));
console.log(`\nSaved ${deities.length} entries to deity_issues.json`);
