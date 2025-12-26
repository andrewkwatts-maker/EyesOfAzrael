#!/usr/bin/env node

/**
 * Quick utility to show migration backlog summary
 */

const data = require('../html-migration-backlog.json');

console.log('\n📊 Migration Backlog Summary\n');
console.log('='.repeat(60));
console.log(`Total files to migrate: ${data.length}\n`);

// By priority
console.log('By Priority:');
const byPriority = {};
data.forEach(f => {
  byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
});
Object.keys(byPriority).sort((a, b) => b - a).forEach(p => {
  console.log(`  Priority ${p}: ${byPriority[p]} files`);
});

// By type
console.log('\nBy Asset Type:');
const byType = {};
data.forEach(f => {
  byType[f.assetType] = (byType[f.assetType] || 0) + 1;
});
Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} files`);
});

// By mythology
console.log('\nBy Mythology:');
const byMythology = {};
data.forEach(f => {
  byMythology[f.mythology] = (byMythology[f.mythology] || 0) + 1;
});
Object.entries(byMythology).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([myth, count]) => {
  console.log(`  ${myth}: ${count} files`);
});

console.log('\n' + '='.repeat(60));
console.log('\nTop 10 Priority Files:\n');

data.slice(0, 10).forEach((f, i) => {
  console.log(`${i+1}. [${f.priority}/10] ${f.assetType.toUpperCase()}: ${f.title.substring(0, 60)}...`);
  console.log(`   File: ${f.file}`);
  console.log(`   ID: ${f.assetId}`);
  console.log('');
});

console.log('Run "npm run detect-migrations" to regenerate reports\n');
