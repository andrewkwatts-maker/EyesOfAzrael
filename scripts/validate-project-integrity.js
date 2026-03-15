#!/usr/bin/env node
/**
 * Project Integrity Validator
 * Checks that all script/link tags in index.html point to existing files
 * and no orphaned JS/CSS files exist without references.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;

function log(type, msg) {
  if (type === 'error') { errors++; console.error(`  ERROR: ${msg}`); }
  else if (type === 'warn') { warnings++; console.warn(`  WARN:  ${msg}`); }
  else { console.log(`  OK:    ${msg}`); }
}

// 1. Check all <script src="..."> and <link href="..."> in index.html
console.log('\n=== Checking index.html references ===');
const indexPath = path.join(ROOT, 'index.html');
if (!fs.existsSync(indexPath)) {
  log('error', 'index.html not found');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');

// Check script src attributes
const scriptRefs = [...indexContent.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
for (const ref of scriptRefs) {
  if (ref.startsWith('http') || ref.startsWith('//')) continue;
  const filePath = path.join(ROOT, ref);
  if (!fs.existsSync(filePath)) {
    log('error', `Missing script: ${ref}`);
  }
}

// Check link href attributes (CSS)
const cssRefs = [...indexContent.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
for (const ref of cssRefs) {
  if (ref.startsWith('http') || ref.startsWith('//')) continue;
  const filePath = path.join(ROOT, ref);
  if (!fs.existsSync(filePath)) {
    log('error', `Missing stylesheet: ${ref}`);
  }
}

console.log(`  Checked ${scriptRefs.length} scripts, ${cssRefs.length} stylesheets`);

// 2. Check for duplicate script/link loads
console.log('\n=== Checking for duplicate loads ===');
const scriptCounts = {};
for (const ref of scriptRefs) {
  scriptCounts[ref] = (scriptCounts[ref] || 0) + 1;
}
for (const [ref, count] of Object.entries(scriptCounts)) {
  if (count > 1) log('warn', `Script loaded ${count} times: ${ref}`);
}

const cssCounts = {};
for (const ref of cssRefs) {
  cssCounts[ref] = (cssCounts[ref] || 0) + 1;
}
for (const [ref, count] of Object.entries(cssCounts)) {
  if (count > 1) log('warn', `Stylesheet loaded ${count} times: ${ref}`);
}

// 3. Check for .min.js files (should have been purged)
console.log('\n=== Checking for stale .min.js files ===');
function findFiles(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const minFiles = findFiles(path.join(ROOT, 'js'), /\.min\.js$/);
if (minFiles.length > 0) {
  for (const f of minFiles) {
    log('warn', `Stale .min.js: ${path.relative(ROOT, f)}`);
  }
} else {
  log('ok', 'No stale .min.js files');
}

// 4. Summary
console.log('\n=== Summary ===');
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n  FAILED: Fix errors above before deploying.\n');
  process.exit(1);
} else {
  console.log('\n  PASSED: Project integrity check complete.\n');
  process.exit(0);
}
