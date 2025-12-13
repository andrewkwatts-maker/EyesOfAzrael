const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./parsed_data/greek_parsed.json', 'utf8'));

console.log('=== PARSING QUALITY ANALYSIS ===\n');
console.log('Total deities parsed:', data.deities.length);
console.log('Deities with proper name (not "Greek"):', data.deities.filter(d => d.name !== 'Greek').length);
console.log('Deities with empty descriptions:', data.deities.filter(d => d.description === '').length);
console.log('Deities with domains:', data.deities.filter(d => d.domains.length > 0).length);
console.log('Deities with archetypes:', data.deities.filter(d => d.archetypes.length > 0).length);
console.log('Deities with symbols:', data.deities.filter(d => d.symbols.length > 0).length);
console.log('Deities with relationships:', data.deities.filter(d => d.relationships && Object.keys(d.relationships).length > 0).length);
console.log('Deities with related entities:', data.deities.filter(d => d.relatedEntities.length > 0).length);
console.log('Deities with primary sources:', data.deities.filter(d => d.primarySources.length > 0).length);

console.log('\n=== ISSUES DETECTED ===\n');

// Check name issue
const nameIssues = data.deities.filter(d => d.name === 'Greek');
console.log(`${nameIssues.length} deities have "Greek" as name instead of actual deity name:`);
nameIssues.slice(0, 5).forEach(d => console.log(`  - ${d.id}: ${d.displayName}`));

// Check empty descriptions
const noDesc = data.deities.filter(d => !d.description || d.description === '');
console.log(`\n${noDesc.length} deities have empty descriptions`);

// Check missing metadata
const noDomains = data.deities.filter(d => d.domains.length === 0);
console.log(`${noDomains.length} deities missing domains/attributes`);

// Sample well-parsed deity
console.log('\n=== BEST PARSED EXAMPLE (Cronos) ===\n');
const cronos = data.deities.find(d => d.id === 'cronos');
console.log(JSON.stringify(cronos, null, 2));
