#!/usr/bin/env node

/**
 * Correct the entity count written into each tradition's description.
 *
 * The `mythologies` records carry a generated sentence — "A comprehensive
 * collection of 15 entities from Aboriginal mythology." — and the number in it
 * was computed once, before the duplicate merge and before the base export
 * stopped emitting repeated ids. 50 of the 123 that carry a count are now
 * wrong, some wildly: Aboriginal claims 15 against 97, Aztec claims 79 against
 * 182. The figure sits in the page's opening paragraph, directly above a grid
 * showing a different number.
 *
 * Counted from the static base rather than Firestore, which makes this free and
 * makes it agree with the page by construction: the base is what the page
 * reads, and the same two exclusions are applied — merged-away duplicates, and
 * the shadow list from build-topics.js holding back records another record
 * already says better.
 *
 * WRITES TO BOTH PLACES, ON PURPOSE
 *
 * The static base is built from firebase-assets-downloaded/, not from Firestore,
 * so a Firestore-only fix would change nothing a visitor sees until someone
 * happened to re-download the snapshot. Writing only the snapshot would leave
 * Firestore wrong for anything reading it directly. Both, then re-export.
 *
 * USAGE
 *   node scripts/recount-tradition-blurbs.js                 # report only
 *   node scripts/recount-tradition-blurbs.js --confirm       # snapshot only
 *   set GOOGLE_APPLICATION_CREDENTIALS=...
 *   node scripts/recount-tradition-blurbs.js --confirm --firestore
 *
 * Then: npm run export-base
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'static', 'entities');
const SNAPSHOT = path.join(ROOT, 'firebase-assets-downloaded', 'mythologies');
const TOPICS = path.join(ROOT, 'static', 'topics.json');

const CONFIRM = process.argv.includes('--confirm');
const WRITE_FIRESTORE = process.argv.includes('--firestore');

/** "A comprehensive collection of 15 entities from ..." */
const COUNT_IN_BLURB = /(collection of\s+)([\d,]+)(\s+entit)/i;

function traditionTotals() {
    let shadowed = {};
    if (fs.existsSync(TOPICS)) {
        try {
            shadowed = JSON.parse(fs.readFileSync(TOPICS, 'utf8')).shadowed || {};
        } catch (err) {
            // A count without the shadow list is still far closer than the stored one.
        }
    }

    const totals = new Map();
    for (const collection of fs.readdirSync(BASE)) {
        // The tradition records are not entities of a tradition.
        if (collection === 'mythologies') continue;
        const file = path.join(BASE, collection, '_all.json');
        if (!fs.existsSync(file)) continue;

        const hidden = new Set(shadowed[collection] || []);
        let rows;
        try {
            const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
            rows = Array.isArray(raw) ? raw : Object.values(raw);
        } catch (err) {
            continue;
        }
        for (const row of rows) {
            if (!row || typeof row !== 'object' || !row.id) continue;
            if (row.duplicateOf || hidden.has(row.id) || !row.mythology) continue;
            const key = String(row.mythology).toLowerCase().trim();
            totals.set(key, (totals.get(key) || 0) + 1);
        }
    }
    return totals;
}

async function main() {
    if (!fs.existsSync(SNAPSHOT)) {
        console.error(`No snapshot at ${SNAPSHOT}.`);
        process.exit(1);
    }

    const totals = traditionTotals();
    const changes = [];

    for (const file of fs.readdirSync(SNAPSHOT)) {
        if (!file.endsWith('.json') || file.startsWith('_')) continue;
        const full = path.join(SNAPSHOT, file);

        let record;
        try {
            record = JSON.parse(fs.readFileSync(full, 'utf8'));
        } catch (err) {
            continue;
        }
        if (!record || typeof record.description !== 'string') continue;

        const match = record.description.match(COUNT_IN_BLURB);
        if (!match) continue;

        const id = String(record.id || path.basename(file, '.json'));
        // A hub stub describes the tradition its id ends with.
        const tradition = id.replace(/^mythology-hub-/, '').toLowerCase();
        const actual = totals.get(tradition);
        if (actual === undefined) continue;

        const claimed = Number(match[2].replace(/,/g, ''));
        if (claimed === actual) continue;

        const description = record.description.replace(COUNT_IN_BLURB, `$1${actual}$3`);
        changes.push({ file: full, id, tradition, claimed, actual, description });

        if (CONFIRM) {
            record.description = description;
            fs.writeFileSync(full, JSON.stringify(record, null, 2));
        }
    }

    changes.sort((a, b) => Math.abs(b.actual - b.claimed) - Math.abs(a.actual - a.claimed));

    console.log(`${changes.length} tradition description(s) carry a count that disagrees with the base.\n`);
    for (const change of changes.slice(0, 12)) {
        console.log(`  ${change.tradition.padEnd(22)} ${String(change.claimed).padStart(5)} -> ${change.actual}`);
    }
    if (changes.length > 12) console.log(`  … and ${changes.length - 12} more`);

    if (!CONFIRM) {
        console.log('\nDry run — nothing written. Re-run with --confirm.');
        return;
    }
    console.log(`\nSnapshot updated (${changes.length} files).`);

    if (WRITE_FIRESTORE) {
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.error('GOOGLE_APPLICATION_CREDENTIALS is not set; Firestore left unchanged.');
            process.exitCode = 1;
        } else {
            const admin = require('firebase-admin');
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'eyesofazrael'
            });
            const db = admin.firestore();
            let written = 0;
            for (const change of changes) {
                await db.collection('mythologies').doc(change.id).update({
                    description: change.description,
                    // Stamped so the delta layer picks this up; without it the
                    // edit stays invisible under static+delta until the next
                    // base export.
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                written++;
            }
            console.log(`Firestore updated (${written} documents).`);
        }
    }

    console.log('Now run: npm run export-base');
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
