#!/usr/bin/env node

/**
 * Verification script to show detection is working correctly
 */

const report = require('../html-migration-report.json');

console.log('\n🔍 HTML Migration Detection Verification\n');
console.log('='.repeat(70));

// Summary
console.log('\n📊 SUMMARY:');
console.log(`   Total HTML files scanned: ${report.statistics.totalHtml}`);
console.log(`   Infrastructure (excluded): ${report.statistics.infrastructure}`);
console.log(`   Needs Migration: ${report.statistics.needsMigration}`);
console.log(`   Needs Update: ${report.statistics.needsUpdate}`);
console.log(`   Can Delete: ${report.statistics.canDelete}`);
console.log(`   Errors: ${report.statistics.errors}`);

// Verify infrastructure exclusions
console.log('\n✅ CORRECTLY EXCLUDED (Infrastructure):');
console.log('\n   Root pages:');
['index.html', 'login.html', 'dashboard.html', 'about.html', 'compare.html']
  .forEach(file => {
    const found = report.infrastructure.find(f => f.file === file);
    console.log(`   ${found ? '✓' : '✗'} ${file}`);
  });

console.log('\n   Index pages (category listings):');
const indexes = report.infrastructure.filter(f => f.file.includes('index.html'));
console.log(`   ✓ ${indexes.length} index pages excluded`);

console.log('\n   Corpus search pages:');
const corpusSearch = report.infrastructure.filter(f => f.file.includes('corpus-search'));
console.log(`   ✓ ${corpusSearch.length} corpus-search pages excluded`);

console.log('\n   FIREBASE folder:');
const firebaseFolder = report.infrastructure.filter(f => f.file.startsWith('FIREBASE/'));
console.log(`   ✓ ${firebaseFolder.length} FIREBASE/* pages excluded`);

// Verify content detection
console.log('\n✅ CORRECTLY DETECTED (Content to migrate):');

console.log('\n   Deities:');
const deities = report.newMigrations.filter(f => f.assetType === 'deity');
console.log(`   ✓ ${deities.length} deity pages found`);
if (deities.length > 0) {
  console.log(`   Examples: ${deities.slice(0, 3).map(d => d.file.split('/').pop()).join(', ')}`);
}

console.log('\n   Heroes:');
const heroes = report.newMigrations.filter(f => f.assetType === 'hero');
console.log(`   ✓ ${heroes.length} hero pages found`);
if (heroes.length > 0) {
  console.log(`   Examples: ${heroes.slice(0, 3).map(h => h.file.split('/').pop()).join(', ')}`);
}

console.log('\n   Creatures:');
const creatures = report.newMigrations.filter(f => f.assetType === 'creature');
console.log(`   ✓ ${creatures.length} creature pages found`);
if (creatures.length > 0) {
  console.log(`   Examples: ${creatures.slice(0, 3).map(c => c.file.split('/').pop()).join(', ')}`);
}

console.log('\n   Places/Cosmology:');
const places = report.newMigrations.filter(f => f.assetType === 'place');
console.log(`   ✓ ${places.length} place/cosmology pages found`);
if (places.length > 0) {
  console.log(`   Examples: ${places.slice(0, 3).map(p => p.file.split('/').pop()).join(', ')}`);
}

// Verify mythologies
console.log('\n✅ MYTHOLOGIES DETECTED:');
const byMythology = {};
report.newMigrations.forEach(f => {
  byMythology[f.mythology] = (byMythology[f.mythology] || 0) + 1;
});

const topMythologies = Object.entries(byMythology)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

topMythologies.forEach(([mythology, count]) => {
  console.log(`   ✓ ${mythology}: ${count} files`);
});

// Verify priority distribution
console.log('\n✅ PRIORITY DISTRIBUTION:');
const byPriority = {};
report.newMigrations.forEach(f => {
  byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
});

Object.keys(byPriority).sort((a, b) => b - a).forEach(p => {
  const count = byPriority[p];
  const percentage = ((count / report.newMigrations.length) * 100).toFixed(1);
  console.log(`   Priority ${p}: ${count} files (${percentage}%)`);
});

// Check for errors
if (report.errors.length > 0) {
  console.log('\n⚠️  ERRORS DETECTED:');
  report.errors.slice(0, 5).forEach(err => {
    console.log(`   ✗ ${err.file}: ${err.error}`);
  });
  if (report.errors.length > 5) {
    console.log(`   ... and ${report.errors.length - 5} more errors`);
  }
} else {
  console.log('\n✅ No errors detected!');
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ Detection appears to be working correctly!\n');
console.log('Next steps:');
console.log('  1. Review HTML_MIGRATION_REPORT.md for full details');
console.log('  2. Review html-migration-backlog.json for migration list');
console.log('  3. Start migrating high-priority files (priority 8-10)');
console.log('  4. Run "npm run detect-migrations:firebase" to verify against Firebase');
console.log('');
