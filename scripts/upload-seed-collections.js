#!/usr/bin/env node

/**
 * Upload a bake_from_local-layout seed directory into a Firestore project,
 * under a domain prefix.
 *
 * Promotes the mnema/synomosia curated seeds from git into the live Firestore
 * upstream, so the packages' Refresh() delta sync has something to pull from.
 *
 * ── Why a prefix ─────────────────────────────────────────────────────────────
 * All four domains share ONE Firestore project, `eyesofazrael` (plan §2). That
 * is not a convenience: Firebase Authentication is per project, so a user signed
 * in to eyesofazrael has no `request.auth.uid` in a separate project and the
 * security rules there cannot identify them — user submissions on history and
 * conspiracy would be unimplementable.
 *
 * Sharing a project means collection names collide. Mnema's seed directory is
 * named `events`; so is mythology's live collection. Writing one into the other
 * interleaves two corpora with nothing to tell them apart afterwards, and it
 * fails silently, because a successful batch write looks identical either way.
 * The `hist_`/`con_` prefixes exist to make that impossible.
 *
 * An earlier version of this script refused the `eyesofazrael` project outright.
 * That was right about the danger and too blunt to allow the correct design. The
 * check now lives on the resolved collection name — see scripts/lib/seed-upload-plan.js
 * — so `--prefix hist_` is accepted and a bare `events` is not.
 *
 * Usage:
 *   node scripts/upload-seed-collections.js \
 *     --seed ../Mnema/seed_data \
 *     --prefix hist_ \
 *     --project eyesofazrael \
 *     --key path/to/serviceAccountKey.json \
 *     [--upload]
 *
 * Dry run is the DEFAULT; pass --upload to actually write. Every document is
 * stamped with updatedAt (server time) so delta sync and the static+delta
 * pattern see it from the first read.
 */

const fs = require('fs');
const path = require('path');

const DOMAINS = require('../js/config/domains.js');
const { planSeedUpload, validateSeedDocuments } = require('./lib/seed-upload-plan');

function arg(name, fallback = undefined) {
    const i = process.argv.indexOf(`--${name}`);
    if (i === -1) return fallback;
    const v = process.argv[i + 1];
    return v && !v.startsWith('--') ? v : true;
}

const seedDir = arg('seed');
const projectId = arg('project');
const keyPath = arg('key');
const prefix = arg('prefix', '') === true ? '' : (arg('prefix', '') || '');
const upload = !!arg('upload', false);
// --dry-run remains accepted so existing invocations keep working, but dry run
// is now the default and the flag is a no-op.
const dryRun = !upload;

if (!seedDir || !projectId) {
    console.error('Required: --seed <dir> --project <id> [--prefix hist_] [--key <serviceAccount.json>] [--upload]');
    process.exit(1);
}
if (upload && !keyPath) {
    console.error('--upload requires --key <serviceAccount.json>');
    process.exit(1);
}

/** Read every seed document under one collection directory. */
function readCollection(dir) {
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json') && !f.startsWith('_'));
    const entities = [];
    for (const file of files) {
        const loaded = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        for (const entity of (Array.isArray(loaded) ? loaded : [loaded])) entities.push(entity);
    }
    return entities;
}

async function main() {
    const sourceDirs = fs.readdirSync(seedDir)
        .filter(d => fs.statSync(path.join(seedDir, d)).isDirectory())
        .sort();

    const plan = planSeedUpload({ collections: sourceDirs, prefix, domains: DOMAINS, projectId });

    for (const warning of plan.warnings) console.warn(`  warning: ${warning}`);

    if (plan.errors.length) {
        console.error('\nRefusing to upload — resolved collection names collide with live data:\n');
        for (const err of plan.errors) console.error(`  ${err}\n`);
        process.exit(1);
    }

    // Validate before writing anything. A document missing its facet field
    // uploads cleanly and is then unreachable: it lands in no static-base shard
    // and matches no delta query. Better to refuse the batch than to publish
    // documents that exist and cannot be found.
    let invalid = 0;
    const loaded = new Map();
    for (const target of plan.targets) {
        const entities = readCollection(path.join(seedDir, target.source));
        loaded.set(target.target, entities);

        const { missingFacet, missingId } = validateSeedDocuments(entities, target.facetField);
        if (missingId) {
            console.error(`  ${target.target}: ${missingId} document(s) have no id and cannot be written`);
            invalid += missingId;
        }
        if (missingFacet.length) {
            console.error(
                `  ${target.target}: ${missingFacet.length} document(s) have no "${target.facetField}" ` +
                `and would be invisible to the site: ${missingFacet.slice(0, 5).join(', ')}` +
                `${missingFacet.length > 5 ? ', …' : ''}`
            );
            invalid += missingFacet.length;
        }
    }
    if (invalid) {
        console.error(`\nRefusing to upload — ${invalid} document(s) would be unreachable once written.`);
        process.exit(1);
    }

    let db = null;
    let admin = null;
    if (!dryRun) {
        admin = require('firebase-admin');
        admin.initializeApp({
            credential: admin.credential.cert(require(path.resolve(keyPath))),
            projectId,
        });
        db = admin.firestore();
    }

    console.log(`\n${dryRun ? 'Dry run' : 'Uploading'} → project ${projectId}, prefix "${prefix}"\n`);

    let total = 0;
    for (const target of plan.targets) {
        const entities = loaded.get(target.target);
        let count = 0;

        if (!dryRun) {
            let batch = db.batch();
            let inBatch = 0;
            for (const entity of entities) {
                const ref = db.collection(target.target).doc(String(entity.id));
                batch.set(ref, {
                    ...entity,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                count += 1;
                inBatch += 1;
                if (inBatch >= 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
            }
            if (inBatch > 0) await batch.commit();
        } else {
            count = entities.length;
        }

        console.log(`  ${target.source} → ${target.target}: ${count} (facet: ${target.facetField})`);
        total += count;
    }

    console.log(`\n${dryRun ? 'Would upload' : 'Uploaded'} ${total} entities to ${projectId}`);
    if (dryRun) console.log('Re-run with --upload --key <serviceAccount.json> to write.');
}

main().catch(err => { console.error(err); process.exit(1); });
