const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'js', 'components');
let total = 0;
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));

console.log('Total files: ' + files.length);
files.forEach(f => {
  total += fs.statSync(path.join(componentsDir, f)).size;
});

const totalKB = total / 1024;
const minifiedKB = totalKB * 0.4;

console.log(`Total components (excluding .min.js): ${totalKB.toFixed(2)} KB (source)`);
console.log(`Estimated minified: ${minifiedKB.toFixed(2)} KB`);
console.log(`Budget compliance: ${totalKB < 1000 ? 'PASS ✅' : 'FAIL ❌'} (budget: 1000 KB)`);
