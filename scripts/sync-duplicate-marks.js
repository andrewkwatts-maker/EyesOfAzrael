#!/usr/bin/env node

/**
 * Copy duplicate marks from Firestore into the local asset snapshot.
 *
 * The static base is built from firebase-assets-downloaded/, not from Firestore.
 * scripts/merge-duplicate-entities.js writes `duplicateOf` to Firestore, so the
 * next export produced a base with none of those marks in it and the router's
 * redirect never fired — the data was correct in two places and useless in the
 * third.
 *
 * The obvious repair is to re-download everything, but that is ~14,000 document
 * reads to propagate a few dozen fields, on a project that has already been
 * throttled once for read volume. Only the marked documents matter, and they can
 * be found with one indexed query per collection.
 *
 * Run this after merge-duplicate-entities.js and before export-static-base.js.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/sync-duplicate-marks.js
 *   node scripts/sync-duplicate-marks.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const CONFIRM = process.argv.includes('--confirm');
const ASSETS = path.join(__dirname, '..', 'firebase-assets-downloaded');

const COLLECTIONS = [
    'deities', 'heroes', 'creatures', 'places', 'items', 'texts', 'concepts',
    'symbols', 'rituals', 'herbs', 'archetypes', 'magic', 'cosmology', 'myths'
];

const MARKS = ['duplicateOf', 'duplicateOfCollection', 'status'];

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        process.exit(1);
    }
    if (!fs.existsSync(ASSETS)) {
        console.error(`No snapshot at ${ASSETS}.`);
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });
    const db = admin.firestore();

    let found = 0, patched = 0, missing = 0;

    for (const collection of COLLECTIONS) {
        let snap;
        try {
            // Only the marked documents, not the collection.
            snap = await db.collection(collection).where('duplicateOf', '!=', null).get();
        } catch (err) {
            console.log(`  ${collection}: query failed (${err.message.slice(0, 50)})`);
            continue;
        }
        if (snap.empty) continue;
        found += snap.size;

        for (const doc of snap.docs) {
            const file = path.join(ASSETS, collection, `${doc.id}.json`);
            if (!fs.existsSync(file)) {
                missing++;
                continue;
            }
            const data = doc.data();
            const local = JSON.parse(fs.readFileSync(file, 'utf8'));

            let changed = false;
            for (const field of MARKS) {
                if (data[field] !== undefined && local[field] !== data[field]) {
                    local[field] = data[field];
                    changed = true;
                }
            }
            if (!changed) continue;

            if (CONFIRM) fs.writeFileSync(file, JSON.stringify(local, null, 2));
            patched++;
        }
        console.log(`  ${collection.padEnd(11)} ${String(snap.size).padStart(4)} marked`);
    }

    console.log(`\n${found} marked documents in Firestore, ${patched} snapshot files ${CONFIRM ? 'updated' : 'to update'}, ${missing} absent from the snapshot.`);
    if (!CONFIRM) console.log('Dry run — nothing written. Re-run with --confirm.');
    else console.log('Now run: npm run export-base');
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
