const fs = require('fs');
const path = require('path');

const parsedDir = path.join(__dirname, '..', 'parsed_data');
const files = fs.readdirSync(parsedDir).filter(f => f.endsWith('_parsed.json'));

const results = [];
let totalCount = 0;

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(parsedDir, file), 'utf8'));
  const count = data.count || 0;
  totalCount += count;
  results.push({ file, count, type: data.contentType || 'unknown' });
});

// Sort by count descending
results.sort((a, b) => b.count - a.count);

console.log('\n📊 All Parsed Content Summary\n');
console.log('═'.repeat(70));
console.log('File'.padEnd(35), 'Count'.padStart(8), 'Type'.padStart(20));
console.log('─'.repeat(70));

results.forEach(r => {
  console.log(
    r.file.padEnd(35),
    r.count.toString().padStart(8),
    (r.type || '').padStart(20)
  );
});

console.log('═'.repeat(70));
console.log('TOTAL'.padEnd(35), totalCount.toString().padStart(8));
console.log('═'.repeat(70));
console.log('');
