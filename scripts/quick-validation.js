const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'firebase-assets-downloaded');
const collections = ['deities', 'heroes', 'creatures', 'items', 'places', 'archetypes', 'cosmology', 'concepts', 'rituals', 'texts', 'symbols', 'herbs', 'magic', 'events', 'beings', 'figures', 'angels', 'teachings'];

const stats = {};
let totalAssets = 0;
let enrichedAssets = 0;
let sparseAssets = 0;

function countSections(data) {
  let count = 0;
  const sectionFields = ['description', 'keyMyths', 'cultural', 'cross_cultural_parallels', 'associations', 'companions', 'extendedContent', 'sources', 'quests', 'feats'];
  sectionFields.forEach(field => {
    if (data[field] && (Array.isArray(data[field]) ? data[field].length > 0 : true)) count++;
  });
  return count;
}

function scanDir(collection, dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(collection, fullPath);
    } else if (entry.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (!stats[collection]) stats[collection] = { total: 0, enriched: 0, sparse: 0 };
        stats[collection].total++;
        totalAssets++;

        const sections = countSections(data);
        if (sections >= 5) {
          stats[collection].enriched++;
          enrichedAssets++;
        } else {
          stats[collection].sparse++;
          sparseAssets++;
        }
      } catch (e) {}
    }
  }
}

collections.forEach(c => scanDir(c, path.join(baseDir, c)));

console.log('========================================');
console.log('ENRICHMENT VALIDATION REPORT');
console.log('========================================');
console.log('');
console.log('By Collection:');
console.log('----------------------------------------');
Object.entries(stats).sort((a,b) => b[1].total - a[1].total).forEach(([c, s]) => {
  const pct = ((s.enriched/s.total)*100).toFixed(0);
  console.log(`${c.padEnd(15)} ${String(s.enriched).padStart(5)}/${String(s.total).padStart(5)} enriched (${pct}%) - ${s.sparse} sparse`);
});
console.log('');
console.log('========================================');
console.log('TOTALS');
console.log('========================================');
console.log('Total Assets:', totalAssets);
console.log('Enriched (5+ sections):', enrichedAssets);
console.log('Sparse (<5 sections):', sparseAssets);
console.log('Enrichment Rate:', ((enrichedAssets/totalAssets)*100).toFixed(1) + '%');
console.log('========================================');
