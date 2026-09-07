#!/usr/bin/env node

/**
 * Cache a lightweight index of every live entity: id, name and mythology.
 *
 * scripts/port-legacy-html.js needs to know what already exists before it can
 * decide whether a legacy page is new. Pulling ~13,400 documents on every run is
 * slow and burns read quota, so the index is fetched once and cached.
 *
 * Only three fields are selected. A full read of these collections pulls tens of
 * megabytes of prose that the diff never looks at.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/fetch-live-index.js
 *
 * Writes %TEMP%/live-ids.json, deliberately outside the repository: it is a
 * cache keyed to one moment in time, not a source artefact, and committing it
 * would rot immediately.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const COLLECTIONS = [
    'deities', 'heroes', 'creatures', 'places', 'items', 'texts', 'concepts',
    'symbols', 'rituals', 'herbs', 'archetypes', 'magic', 'magic_systems',
    'cosmology', 'events', 'myths', 'beings', 'tarot'
];

const OUT = path.join(process.env.TEMP || '.', 'live-ids.json');

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        console.error('Point it at the service-account key (kept outside this repo).');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });

    const out = {};
    let total = 0;

    for (const name of COLLECTIONS) {
        const snap = await admin.firestore().collection(name).select('name', 'mythology').get();
        out[name] = snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || '',
            myth: d.data().mythology || ''
        }));
        total += snap.size;
        console.log(`  ${name.padEnd(16)} ${String(snap.size).padStart(6)}`);
    }

    fs.writeFileSync(OUT, JSON.stringify(out));
    console.log(`\n${total} entities indexed -> ${OUT}`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
