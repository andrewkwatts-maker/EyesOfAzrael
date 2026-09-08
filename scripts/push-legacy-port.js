#!/usr/bin/env node

/**
 * Upload the reviewed output of scripts/port-legacy-html.js to Firestore.
 *
 * Reads the emitted documents under data/legacy-port/<collection>/*.json and
 * creates them in the matching live collection.
 *
 * SAFETY
 *
 * Writes with create(), never set(). set() would silently overwrite a live
 * document if an id collided, and the diff that produced these files matched on
 * name — so an id collision is exactly the case the diff could not see. create()
 * fails on an existing id instead, which is the outcome worth having: a refusal
 * is recoverable, an overwritten entity is not.
 *
 * Dry run by default. Nothing is written without --confirm.
 *
 * Every document carries migratedFrom: 'daedalus-svn-mythology' and
 * _portedBy: 'scripts/port-legacy-html.js', so the whole batch can be found — or
 * deleted — with a single query:
 *
 *   collection.where('migratedFrom', '==', 'daedalus-svn-mythology')
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/push-legacy-port.js
 *   node scripts/push-legacy-port.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const DIR = path.join(__dirname, '..', 'data', 'legacy-port');

function loadDocuments() {
    const out = [];
    if (!fs.existsSync(DIR)) return out;
    for (const collection of fs.readdirSync(DIR)) {
        const sub = path.join(DIR, collection);
        if (!fs.statSync(sub).isDirectory()) continue;
        for (const file of fs.readdirSync(sub)) {
            if (!file.endsWith('.json')) continue;
            const doc = JSON.parse(fs.readFileSync(path.join(sub, file), 'utf8'));
            out.push({ collection, doc });
        }
    }
    return out;
}

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

    const documents = loadDocuments();
    if (!documents.length) {
        console.error(`No documents found under ${DIR}. Run port-legacy-html.js --emit first.`);
        process.exit(1);
    }

    console.log(`${documents.length} documents staged in ${DIR}\n`);

    // Pre-flight: report collisions before writing anything, so a bad batch is
    // visible as a whole rather than discovered halfway through.
    const clashes = [];
    for (const { collection, doc } of documents) {
        const snap = await db.collection(collection).doc(doc.id).get();
        if (snap.exists) clashes.push(`${collection}/${doc.id}`);
    }

    if (clashes.length) {
        console.log(`WARNING — ${clashes.length} id(s) already exist and will be SKIPPED, not overwritten:`);
        clashes.forEach((c) => console.log('  ' + c));
        console.log('');
    } else {
        console.log('Pre-flight: no id collisions.\n');
    }

    if (!CONFIRM) {
        const byCollection = {};
        for (const { collection } of documents) {
            byCollection[collection] = (byCollection[collection] || 0) + 1;
        }
        console.log('Would create:');
        Object.entries(byCollection).sort()
            .forEach(([c, n]) => console.log(`  ${c.padEnd(14)} ${String(n).padStart(3)}`));
        console.log(`\nDry run — nothing written. Re-run with --confirm to upload.`);
        return;
    }

    let created = 0;
    let skipped = 0;
    const failures = [];

    for (const { collection, doc } of documents) {
        try {
            await db.collection(collection).doc(doc.id).create(doc);
            created++;
            console.log(`  created  ${collection}/${doc.id}`);
        } catch (err) {
            if (err.code === 6 /* ALREADY_EXISTS */) {
                skipped++;
                console.log(`  exists   ${collection}/${doc.id} — left untouched`);
            } else {
                failures.push(`${collection}/${doc.id}: ${err.message}`);
                console.log(`  FAILED   ${collection}/${doc.id} — ${err.message}`);
            }
        }
    }

    console.log(`\n${created} created, ${skipped} already existed, ${failures.length} failed.`);
    if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
