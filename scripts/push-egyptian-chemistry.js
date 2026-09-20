#!/usr/bin/env node

/**
 * Publish the Egyptian chemical theories to Firestore and the local snapshot.
 *
 * Both, because the static base is built from firebase-assets-downloaded/ and
 * not from Firestore: a Firestore-only write is invisible on the site until
 * someone re-downloads the snapshot, and a snapshot-only write is invisible to
 * anything reading the database directly. `updatedAt` is stamped so the delta
 * layer picks the records up before the next base export.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/push-egyptian-chemistry.js            # dry run
 *   node scripts/push-egyptian-chemistry.js --confirm
 *
 * Then: npm run export-base
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'egyptian-chemistry', 'theories.json');
const SNAPSHOT = path.join(__dirname, '..', 'firebase-assets-downloaded', 'con_theories');
const CONFIRM = process.argv.includes('--confirm');

async function main() {
    const records = JSON.parse(fs.readFileSync(SRC, 'utf8'));
    console.log(`${records.length} theory records to publish\n`);

    if (!CONFIRM) {
        records.slice(0, 5).forEach(r => console.log(`  ${r.id}  "${r.name.slice(0, 64)}"`));
        console.log('\nDry run — nothing written. Re-run with --confirm.');
        return;
    }

    fs.mkdirSync(SNAPSHOT, { recursive: true });
    for (const record of records) {
        fs.writeFileSync(path.join(SNAPSHOT, `${record.id}.json`), JSON.stringify(record, null, 2));
    }
    console.log(`Snapshot: wrote ${records.length} files to ${SNAPSHOT}`);

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS not set; Firestore left unchanged.');
        process.exitCode = 1;
        return;
    }

    const admin = require('firebase-admin');
    admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'eyesofazrael' });
    const db = admin.firestore();

    let written = 0;
    for (const record of records) {
        await db.collection('con_theories').doc(record.id).set({
            ...record,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        written++;
    }
    console.log(`Firestore: wrote ${written} documents to con_theories`);
    console.log('\nNow run: npm run export-base');
}

main().catch((err) => { console.error('Failed:', err.message); process.exit(1); });
