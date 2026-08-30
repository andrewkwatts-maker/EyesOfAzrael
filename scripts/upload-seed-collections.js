#!/usr/bin/env node

/**
 * Upload a bake_from_local-layout seed directory into a Firestore project.
 *
 * Used to promote the mnema/synomosia curated seeds from git into a live
 * Firestore upstream, so the packages' Refresh() delta sync has something to
 * pull from. Targets a *separate* project per domain (the packages read
 * CLIO_PROJECT / AUGUR_PROJECT) — do NOT point this at `eyesofazrael`, whose
 * `events`, `figures`, and `theories` collections already hold
 * mythology/user content.
 *
 * Usage:
 *   node scripts/upload-seed-collections.js \
 *     --seed ../Clio/seed_data \
 *     --project <firebase-project-id> \
 *     --key path/to/serviceAccountKey.json \
 *     [--dry-run]
 *
 * Every document is stamped with updatedAt (server time) so delta sync and
 * the static+delta pattern see it.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function arg(name, fallback = undefined) {
    const i = process.argv.indexOf(`--${name}`);
    if (i === -1) return fallback;
    const v = process.argv[i + 1];
    return v && !v.startsWith('--') ? v : true;
}

const seedDir = arg('seed');
const projectId = arg('project');
const keyPath = arg('key');
const dryRun = !!arg('dry-run', false);

if (!seedDir || !projectId || !keyPath) {
    console.error('Required: --seed <dir> --project <id> --key <serviceAccount.json>');
    process.exit(1);
}
if (projectId === 'eyesofazrael') {
    console.error('Refusing to upload seed domains into the eyesofazrael project — ' +
        'its events/figures/theories collections hold mythology and user content. ' +
        'Create a per-domain project (CLIO_PROJECT / AUGUR_PROJECT).');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(keyPath))),
    projectId,
});
const db = admin.firestore();

async function main() {
    const collections = fs.readdirSync(seedDir).filter(d =>
        fs.statSync(path.join(seedDir, d)).isDirectory());
    let total = 0;
    for (const coll of collections) {
        const files = fs.readdirSync(path.join(seedDir, coll))
            .filter(f => f.endsWith('.json') && !f.startsWith('_'));
        let count = 0;
        for (const file of files) {
            const loaded = JSON.parse(
                fs.readFileSync(path.join(seedDir, coll, file), 'utf-8'));
            const entities = Array.isArray(loaded) ? loaded : [loaded];
            let batch = db.batch();
            let inBatch = 0;
            for (const entity of entities) {
                if (!entity || typeof entity !== 'object' || !entity.id) continue;
                if (dryRun) { count += 1; continue; }
                const ref = db.collection(coll).doc(String(entity.id));
                batch.set(ref, {
                    ...entity,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                count += 1;
                inBatch += 1;
                if (inBatch >= 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
            }
            if (!dryRun && inBatch > 0) await batch.commit();
        }
        console.log(`  ${coll}: ${count}${dryRun ? ' (dry run)' : ''}`);
        total += count;
    }
    console.log(`\n${dryRun ? 'Would upload' : 'Uploaded'} ${total} entities to ${projectId}`);
}

main().catch(err => { console.error(err); process.exit(1); });
