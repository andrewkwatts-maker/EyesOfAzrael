const fs = require('fs');

const data = JSON.parse(fs.readFileSync('FAILED_ASSETS.json', 'utf8'));
const arr = Object.values(data);

const herb = arr.find(a => a && a.collection === 'herbs');
const text = arr.find(a => a && a.collection === 'texts');
const ritual = arr.find(a => a && a.collection === 'rituals');

console.log('=== RITUAL ===');
console.log('ID:', ritual.id);
console.log('Has purpose:', ritual.data.purpose !== undefined);
console.log('Has type:', ritual.data.type !== undefined);
console.log('Keys:', Object.keys(ritual.data).join(', '));

console.log('\n=== HERB ===');
console.log('ID:', herb.id);
console.log('Has mythology:', herb.data.mythology !== undefined);
console.log('Has type:', herb.data.type !== undefined);
console.log('Keys:', Object.keys(herb.data).join(', '));

console.log('\n=== TEXT ===');
console.log('ID:', text.id);
console.log('Has type:', text.data.type !== undefined);
console.log('Keys:', Object.keys(text.data).join(', '));

// Analyze type patterns
console.log('\n=== RITUAL IDs (for type inference) ===');
arr.filter(a => a && a.collection === 'rituals').slice(0, 10).forEach(r => {
  console.log(r.id);
});

console.log('\n=== HERB IDs (for type/mythology inference) ===');
arr.filter(a => a && a.collection === 'herbs').slice(0, 10).forEach(h => {
  console.log(h.id, '- mythology:', h.data.mythology);
});

console.log('\n=== TEXT IDs (for type inference) ===');
arr.filter(a => a && a.collection === 'texts').slice(0, 10).forEach(t => {
  console.log(t.id);
});
