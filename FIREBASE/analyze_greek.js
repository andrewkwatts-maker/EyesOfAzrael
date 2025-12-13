const fs = require('fs');
const data = JSON.parse(fs.readFileSync('parsed_data/greek_parsed.json', 'utf8'));

console.log('=== STRUCTURE ANALYSIS ===');
console.log('Top-level keys:', Object.keys(data));
if (data.deities) console.log('Deities key type:', Array.isArray(data.deities) ? 'array' : 'object');

const deities = data.deities || (data.mythology && data.mythology.deityPages);
if (deities) {
  console.log('\n=== DEITY COUNT ===');
  console.log('Total deities:', deities.length);

  console.log('\n=== DEITY NAMES (all) ===');
  deities.forEach((d, i) => console.log(`${i + 1}. ${d.name}`));

  console.log('\n=== DESCRIPTIONS ===');
  const withDesc = deities.filter(d => d.description && d.description.trim().length > 0);
  console.log(`Deities with descriptions: ${withDesc.length}/${deities.length}`);

  console.log('\n=== DOMAINS ===');
  const withDomains = deities.filter(d => d.domains && d.domains.length > 0);
  console.log(`Deities with domains: ${withDomains.length}/${deities.length}`);

  console.log('\n=== SYMBOLS ===');
  const withSymbols = deities.filter(d => d.symbols && d.symbols.length > 0);
  console.log(`Deities with symbols: ${withSymbols.length}/${deities.length}`);

  console.log('\n=== SAMPLE DEITIES (first 3 complete ones) ===');
  const complete = deities.filter(d =>
    d.name &&
    d.description &&
    d.domains && d.domains.length > 0 &&
    d.symbols && d.symbols.length > 0
  );

  complete.slice(0, 3).forEach((deity, i) => {
    console.log(`\n--- SAMPLE ${i + 1}: ${deity.name} ---`);
    console.log(JSON.stringify(deity, null, 2));
  });

  console.log('\n=== QUALITY SCORE ===');
  const avgDomainsPerDeity = deities.reduce((sum, d) => sum + (d.domains?.length || 0), 0) / deities.length;
  const avgSymbolsPerDeity = deities.reduce((sum, d) => sum + (d.symbols?.length || 0), 0) / deities.length;

  const nameScore = deities.filter(d => d.name && !d.name.includes('Greek')).length / deities.length * 100;
  const descScore = withDesc.length / deities.length * 100;
  const domainScore = withDomains.length / deities.length * 100;
  const symbolScore = withSymbols.length / deities.length * 100;

  const overallScore = (nameScore + descScore + domainScore + symbolScore) / 4;

  console.log(`Name Quality: ${nameScore.toFixed(1)}%`);
  console.log(`Description Coverage: ${descScore.toFixed(1)}%`);
  console.log(`Domain Coverage: ${domainScore.toFixed(1)}%`);
  console.log(`Symbol Coverage: ${symbolScore.toFixed(1)}%`);
  console.log(`Average domains per deity: ${avgDomainsPerDeity.toFixed(1)}`);
  console.log(`Average symbols per deity: ${avgSymbolsPerDeity.toFixed(1)}`);
  console.log(`OVERALL QUALITY SCORE: ${overallScore.toFixed(1)}%`);
}
