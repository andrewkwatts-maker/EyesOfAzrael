#!/usr/bin/env node
/**
 * Export static entity base for CDN-served JSON.
 *
 * Reads firebase-assets-downloaded/{collection}/*.json and writes:
 *   static/entities/manifest.json                   — version hash, generatedAt, per-collection counts
 *   static/entities/{collection}/{mythology}.json   — entities filtered to one mythology
 *   static/entities/{collection}/_all.json          — all entities in the collection
 *
 * Usage:
 *   node scripts/export-static-base.js
 *   node scripts/export-static-base.js --out path/to/out
 *   node scripts/export-static-base.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT     = path.join(__dirname, '..');
const ASSETS   = path.join(ROOT, 'firebase-assets-downloaded');
const DRY_RUN  = process.argv.includes('--dry-run');

const outArg = process.argv.indexOf('--out');
const OUT_DIR = outArg !== -1
    ? path.resolve(process.argv[outArg + 1])
    : path.join(ROOT, 'static', 'entities');

// All collections present in firebase-assets-downloaded that should be exported.
// The AssetService collectionMap (archetypes→concepts) is handled transparently —
// we export both names so either lookup path works.
const COLLECTIONS = [
    'deities', 'creatures', 'heroes', 'items', 'places',
    'texts', 'rituals', 'herbs', 'symbols', 'magic',
    'concepts', 'archetypes', 'beings', 'cosmology',
    'events', 'figures', 'teachings',
];

// ── helpers ──────────────────────────────────────────────────────────────────

function readCollection(name) {
    const dir = path.join(ASSETS, name);
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
    const entities = [];

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(dir, file), 'utf8');
            const parsed = JSON.parse(raw);
            const fileBase = path.basename(file, '.json');

            // Some files contain an array of entities; expand them individually
            const items = Array.isArray(parsed) ? parsed : [parsed];
            items.forEach((obj, i) => {
                if (!obj || typeof obj !== 'object') return;
                if (!obj.id) obj.id = items.length === 1 ? fileBase : `${fileBase}_${i}`;
                entities.push(obj);
            });
        } catch (e) {
            console.warn(`  ⚠  Skipping ${name}/${file}: ${e.message}`);
        }
    }

    return entities;
}

function ensureDir(dir) {
    if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
    if (DRY_RUN) return;
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
}

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12);
}

// ── main ─────────────────────────────────────────────────────────────────────

function main() {
    console.log(DRY_RUN ? '\n📦 DRY RUN — no files written\n' : `\n📦 Exporting static entity base → ${OUT_DIR}\n`);

    const generatedAt = new Date().toISOString();
    const manifest = { version: null, generatedAt, collections: {} };
    let hashInput = generatedAt;
    let totalEntities = 0;

    for (const collection of COLLECTIONS) {
        const entities = readCollection(collection);

        if (entities.length === 0) {
            console.log(`  ⏭  ${collection}: not found, skipping`);
            continue;
        }

        // Group by mythology (lowercase, default 'other')
        const byMythology = {};
        for (const entity of entities) {
            const myth = (entity.mythology || 'other').toLowerCase().trim();
            (byMythology[myth] = byMythology[myth] || []).push(entity);
        }

        const mythologies = Object.keys(byMythology).sort();
        const collDir = path.join(OUT_DIR, collection);
        ensureDir(collDir);

        // Write per-mythology files
        for (const myth of mythologies) {
            writeJson(path.join(collDir, `${myth}.json`), byMythology[myth]);
        }

        // Write _all.json
        writeJson(path.join(collDir, '_all.json'), entities);

        // Build per-mythology counts for manifest (used by stats/breakdown UIs)
        const mythologyCounts = {};
        for (const myth of mythologies) {
            mythologyCounts[myth] = byMythology[myth].length;
        }

        manifest.collections[collection] = {
            total: entities.length,
            mythologies,
            mythologyCounts,
        };

        hashInput += `|${collection}:${entities.length}`;
        totalEntities += entities.length;

        const mythSummary = mythologies.length > 6
            ? `${mythologies.slice(0, 6).join(', ')}, … (${mythologies.length} total)`
            : mythologies.join(', ');
        console.log(`  ✓  ${collection}: ${entities.length} entities (${mythSummary})`);
    }

    manifest.version = sha256(hashInput);

    ensureDir(OUT_DIR);
    writeJson(path.join(OUT_DIR, 'manifest.json'), manifest);

    const collectionCount = Object.keys(manifest.collections).length;
    console.log(`\n✅ Done`);
    console.log(`   Version    : ${manifest.version}`);
    console.log(`   GeneratedAt: ${manifest.generatedAt}`);
    console.log(`   Collections: ${collectionCount}`);
    console.log(`   Entities   : ${totalEntities}`);
    if (DRY_RUN) console.log('\n   (dry run — nothing written)');
    console.log();
}

main();
