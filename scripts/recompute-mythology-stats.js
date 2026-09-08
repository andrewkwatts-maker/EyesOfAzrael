#!/usr/bin/env node

/**
 * Store per-category entity counts on each mythology document.
 *
 * The mythology hub (#/mythology/greek) needs one number per category to render
 * "Deities 762 / Heroes 394 / ...". It was getting them by downloading every
 * matching document and taking .size — 2,329 document reads for a single view of
 * the Greek page, and proportionally more for the larger traditions. Eleven
 * collections, four to five calls each, to display eleven integers.
 *
 * The compat SDK the site runs has no Query.count() at any version, so the page
 * cannot aggregate for itself. The counts therefore have to be precomputed here,
 * where the Admin SDK is available, and read back as a single document.
 *
 * There is already a `stats` field on these documents and it is badly stale —
 * mythologies/greek claims 22 deities against an actual 762, and 115 total
 * against 2,329 — which is presumably why the page stopped trusting it and
 * started counting the hard way. This writes `entityCounts`, a separate field, so
 * nothing reading the old one changes behaviour, and stamps entityCountsAt so
 * staleness is visible rather than assumed.
 *
 * COST
 *
 * One pass per collection selecting only the `mythology` field — eleven queries,
 * about 13,400 document reads in total — and every tradition is tallied in the
 * same pass. Per-mythology aggregation would be roughly 181 x 11 = 1,991 round
 * trips instead. Run this after a data import, not on a schedule.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/recompute-mythology-stats.js
 *   node scripts/recompute-mythology-stats.js --confirm
 */

const admin = require('firebase-admin');

const CONFIRM = process.argv.includes('--confirm');

const ENTITY_TYPES = [
    'deities', 'heroes', 'creatures', 'items', 'places',
    'texts', 'rituals', 'herbs', 'symbols', 'cosmology', 'magic'
];

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });
    const db = admin.firestore();

    // mythology -> { deities: n, heroes: n, ... }
    const tally = new Map();
    let scanned = 0;

    for (const type of ENTITY_TYPES) {
        const snap = await db.collection(type).select('mythology').get();
        scanned += snap.size;
        for (const doc of snap.docs) {
            const myth = String(doc.data().mythology || '').toLowerCase().trim();
            if (!myth) continue;
            if (!tally.has(myth)) tally.set(myth, {});
            const row = tally.get(myth);
            row[type] = (row[type] || 0) + 1;
        }
        console.log(`  scanned ${type.padEnd(11)} ${String(snap.size).padStart(6)} docs`);
    }

    console.log(`\n${scanned} documents scanned, ${tally.size} traditions with entities.\n`);

    const mythSnap = await db.collection('mythologies').select('name', 'stats').get();
    const updates = [];

    for (const doc of mythSnap.docs) {
        const counts = tally.get(doc.id.toLowerCase());
        if (!counts) continue;
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const oldTotal = (doc.data().stats || {}).totalEntities;
        updates.push({ id: doc.id, counts, total, oldTotal });
    }

    updates.sort((a, b) => b.total - a.total);
    console.log('  stored  actual  tradition        (old stats.totalEntities)');
    updates.slice(0, 12).forEach((u) => console.log(
        `  ${String(u.oldTotal ?? '-').padStart(6)}  ${String(u.total).padStart(6)}  ${u.id}`
    ));
    console.log(`  ... ${updates.length} traditions total`);

    if (!CONFIRM) {
        console.log('\nDry run — nothing written. Re-run with --confirm.');
        return;
    }

    // Batched: 181 individual writes is 181 round trips for no reason.
    let written = 0;
    const CHUNK = 400;
    for (let i = 0; i < updates.length; i += CHUNK) {
        const batch = db.batch();
        for (const u of updates.slice(i, i + CHUNK)) {
            batch.set(db.collection('mythologies').doc(u.id), {
                entityCounts: u.counts,
                entityCountsTotal: u.total,
                entityCountsAt: new Date().toISOString()
            }, { merge: true });
            written++;
        }
        await batch.commit();
    }

    console.log(`\n${written} mythology documents updated with entityCounts.`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
