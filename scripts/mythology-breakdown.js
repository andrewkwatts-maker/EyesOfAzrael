const data = require('../deity-fixes-report.json');

const mythCounts = {};
data.fixes.forEach(f => {
  if (!mythCounts[f.mythology]) {
    mythCounts[f.mythology] = { total: 0, html: 0, generated: 0 };
  }
  mythCounts[f.mythology].total++;
  mythCounts[f.mythology][f.source]++;
});

console.log('Breakdown by Mythology:\n');
Object.keys(mythCounts).sort().forEach(m => {
  const c = mythCounts[m];
  console.log(`${m.toUpperCase()}: ${c.total} total (${c.html || 0} HTML, ${c.generated || 0} generated)`);
});
