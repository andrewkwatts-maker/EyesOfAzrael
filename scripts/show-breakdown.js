const tracker = require('./update-tracker.js');
const stats = tracker.getStats();

console.log('\n=== MYTHOLOGY BREAKDOWN ===\n');
Object.entries(stats.byMythology)
  .sort((a,b) => b[1].total - a[1].total)
  .forEach(([myth, st]) => {
    console.log(`${myth.padEnd(20)} ${st.total.toString().padStart(4)} files`);
  });

console.log('\n=== ENTITY TYPE BREAKDOWN ===\n');
Object.entries(stats.byEntityType)
  .sort((a,b) => b[1].total - a[1].total)
  .forEach(([type, st]) => {
    console.log(`${type.padEnd(20)} ${st.total.toString().padStart(4)} files`);
  });

console.log(`\n=== TOTALS ===\n`);
console.log(`Total Files:     ${stats.totalFiles}`);
console.log(`Total Stages:    ${stats.totalStages}`);
console.log(`Total Issues:    ${stats.issueCount}`);
