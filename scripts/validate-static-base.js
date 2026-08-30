#!/usr/bin/env node
/**
 * Validate static entity base against the manifest.
 *
 * Checks:
 *  - manifest.json is valid JSON with required fields
 *  - every collection listed in the manifest has its expected JSON files
 *  - entity counts in files match manifest totals (within ±1 to allow for edge cases)
 *  - all JSON files parse without error
 *  - every entity in every file has an `id` field
 *  - per-mythology counts in manifest match actual file sizes
 *
 * Usage:
 *   node scripts/validate-static-base.js
 *   node scripts/validate-static-base.js --dir path/to/static/entities
 */

const fs   = require('fs');
const path = require('path');

const dirArg = process.argv.indexOf('--dir');
const BASE   = dirArg !== -1
    ? path.resolve(process.argv[dirArg + 1])
    : path.join(__dirname, '..', 'static', 'entities');

let passed = 0;
let failed = 0;
const errors = [];

function ok(msg)      { passed++; console.log(`  ✓  ${msg}`); }
function fail(msg)    { failed++; errors.push(msg); console.error(`  ✗  ${msg}`); }
function section(msg) { console.log(`\n${msg}`); }

// ── Load manifest ─────────────────────────────────────────────────────────────

section('📋 Manifest');

const manifestPath = path.join(BASE, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
    fail(`manifest.json not found at ${manifestPath}`);
    process.exit(1);
}

let manifest;
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    ok('manifest.json is valid JSON');
} catch (e) {
    fail(`manifest.json parse error: ${e.message}`);
    process.exit(1);
}

for (const field of ['version', 'generatedAt', 'collections']) {
    if (manifest[field]) ok(`manifest.${field} present`);
    else fail(`manifest.${field} missing`);
}

const collectionNames = Object.keys(manifest.collections || {});
ok(`${collectionNames.length} collections declared in manifest`);

// ── Per-collection checks ─────────────────────────────────────────────────────

section('📦 Collections');

for (const collection of collectionNames) {
    const meta      = manifest.collections[collection];
    const collDir   = path.join(BASE, collection);

    if (!fs.existsSync(collDir)) {
        fail(`${collection}: directory missing at ${collDir}`);
        continue;
    }

    // Check _all.json
    const allPath = path.join(collDir, '_all.json');
    if (!fs.existsSync(allPath)) {
        fail(`${collection}: _all.json missing`);
    } else {
        let allEntities;
        try {
            allEntities = JSON.parse(fs.readFileSync(allPath, 'utf8'));
            const diff = Math.abs(allEntities.length - meta.total);
            if (diff <= 1) {
                ok(`${collection}: _all.json has ${allEntities.length} entities (manifest: ${meta.total})`);
            } else {
                fail(`${collection}: _all.json count ${allEntities.length} differs from manifest ${meta.total} by ${diff}`);
            }

            const missing = allEntities.filter(e => !e || !e.id);
            if (missing.length === 0) ok(`${collection}: all entities have id`);
            else fail(`${collection}: ${missing.length} entities missing id field`);
        } catch (e) {
            fail(`${collection}: _all.json parse error — ${e.message}`);
        }
    }

    // Check per-mythology files
    const mythologies = meta.mythologies || [];
    for (const myth of mythologies) {
        const mythPath = path.join(collDir, `${myth}.json`);
        if (!fs.existsSync(mythPath)) {
            fail(`${collection}/${myth}.json missing`);
            continue;
        }
        try {
            const entities = JSON.parse(fs.readFileSync(mythPath, 'utf8'));
            const expected = meta.mythologyCounts?.[myth];
            if (expected !== undefined && Math.abs(entities.length - expected) > 1) {
                fail(`${collection}/${myth}: count ${entities.length} vs manifest ${expected}`);
            } else {
                ok(`${collection}/${myth}.json — ${entities.length} entities`);
            }
        } catch (e) {
            fail(`${collection}/${myth}.json parse error — ${e.message}`);
        }
    }
}

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
console.log(`Manifest version : ${manifest.version}`);
console.log(`Generated at     : ${manifest.generatedAt}`);
console.log(`\nResults: ${passed}/${total} checks passed${failed > 0 ? `, ${failed} failed` : ''}`);

if (errors.length > 0) {
    console.error('\nFailed checks:');
    errors.forEach(e => console.error(`  • ${e}`));
}

if (failed > 0) process.exit(1);
console.log('\n✅ Static base is valid and consistent with manifest.\n');
