const fs = require('fs');
const path = require('path');

const files = [
  'search-view-complete.js',
  'compare-view.js',
  'entity-quick-view-modal.js',
  'edit-entity-modal.js',
  'user-dashboard.js',
  'entity-card.js',
  'mythology-nav.js',
  'search-ui.js'
];

console.log('Component File Sizes:');
console.log('='.repeat(70));

let total = 0;
let criticalTotal = 0;

files.forEach(f => {
  const fp = path.join(__dirname, '..', 'js', 'components', f);
  if (fs.existsSync(fp)) {
    const size = fs.statSync(fp).size;
    const kb = size / 1024;
    const min = kb * 0.4; // 60% reduction estimate

    console.log(`${f.padEnd(40)} ${kb.toFixed(2).padStart(8)} KB → ${min.toFixed(2).padStart(8)} KB (minified)`);
    total += kb;

    if (['entity-card.js', 'mythology-nav.js', 'search-ui.js'].includes(f)) {
      criticalTotal += kb;
    }
  }
});

console.log('='.repeat(70));
console.log(`Total: ${total.toFixed(2)} KB (source) → ${(total * 0.4).toFixed(2)} KB (minified est.)`);
console.log(`Critical path: ${criticalTotal.toFixed(2)} KB (source) → ${(criticalTotal * 0.4).toFixed(2)} KB (minified est.)`);
