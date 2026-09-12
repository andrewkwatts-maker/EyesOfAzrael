#!/usr/bin/env node

/**
 * Repair entities whose `name` is a category instead of their own name.
 *
 * 105 records are called things like "Hindu Mythology", "Norse Mythology" or
 * "Buddhist Cosmology" — the section they were scraped from, captured instead of
 * the subject. deities/vritra is called "Hindu Mythology". So are thirteen other
 * Hindu deities, which is why they collapse together in any duplicate scan and
 * why a browse grid shows the same words fourteen times.
 *
 * The real name is in the document id, which is why this can be repaired
 * mechanically: hindu_durga is Durga, buddhist_potala_palace is Potala Palace,
 * norse_mugwort is Mugwort.
 *
 * SCOPE IS DELIBERATELY NARROW
 *
 * Only names matching the category pattern are touched. A separate set of ~184
 * records carry sentence fragments as names — "Born from Brahma's mind",
 * "Cerberus, Hydra, Orthrus, Sphinx, Nemean Lion" — and those are not repairable
 * from an id, because the id was generated from the same bad name. They need a
 * person and are left alone.
 *
 * The previous value is kept in `_preFixName`, so anything mis-derived can be
 * found and put back.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/fix-category-named-entities.js
 *   node scripts/fix-category-named-entities.js --confirm
 */

const admin = require('firebase-admin');

const CONFIRM = process.argv.includes('--confirm');

const COLLECTIONS = [
    'deities', 'heroes', 'creatures', 'places', 'items', 'texts', 'concepts',
    'symbols', 'rituals', 'herbs', 'archetypes', 'magic', 'cosmology', 'myths'
];

/** A name that describes a section rather than a subject. */
const CATEGORY_NAME = /^(the\s+)?[a-z'’\- ]+\s+(mythology|mythos|cosmology|tradition|pantheon|deities|creatures|heroes|beings|figures|herbs|symbols|rituals|texts|items|places|magic)$/i;

/** Tradition prefixes the ids carry, stripped before deriving a name. */
const PREFIXES = new RegExp(
    '^(' + [
        'greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist', 'celtic',
        'chinese', 'japanese', 'jewish', 'christian', 'islamic', 'persian',
        'sumerian', 'babylonian', 'aztec', 'mayan', 'yoruba', 'apocryphal',
        'gnostic', 'hermetic', 'tarot', 'native', 'african', 'global', 'medieval',
        'middle', 'amazonian', 'american', 'sami', 'aboriginal'
    ].join('|') + ')_+', 'i'
);

/** Words that stay lowercase inside a title, and ones that stay capitalised. */
const MINOR = new Set(['of', 'the', 'and', 'in', 'a', 'an', 'de', 'du', 'von']);

function nameFromId(id) {
    const bare = String(id).replace(PREFIXES, '').replace(/[_-]+/g, ' ').trim();
    if (!bare) return null;
    return bare.split(/\s+/).map((word, i) => {
        const lower = word.toLowerCase();
        if (i > 0 && MINOR.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(' ');
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

    const planned = [];
    const unfixable = [];

    for (const collection of COLLECTIONS) {
        const snap = await db.collection(collection).select('name').get();
        for (const doc of snap.docs) {
            const current = String(doc.data().name || '').trim();
            if (!current || !CATEGORY_NAME.test(current)) continue;

            const derived = nameFromId(doc.id);
            // If the id only repeats the bad name, there is nothing to derive.
            if (!derived || CATEGORY_NAME.test(derived) || derived.length < 2) {
                unfixable.push(`${collection}/${doc.id} ("${current}")`);
                continue;
            }
            planned.push({ collection, id: doc.id, from: current, to: derived });
        }
        process.stdout.write(`  scanned ${collection}\r`);
    }

    console.log(`\n\nrecords named after a category : ${planned.length + unfixable.length}`);
    console.log(`  repairable from their id      : ${planned.length}`);
    console.log(`  need a person                 : ${unfixable.length}\n`);

    planned.slice(0, 20).forEach((p) =>
        console.log(`  ${p.collection}/${p.id.padEnd(30)} "${p.from}"  ->  "${p.to}"`));
    if (planned.length > 20) console.log(`  ... and ${planned.length - 20} more`);
    if (unfixable.length) {
        console.log('\nleft alone:');
        unfixable.slice(0, 5).forEach((u) => console.log('  ' + u));
    }

    if (!CONFIRM) {
        console.log('\nDry run — nothing written. Re-run with --confirm.');
        return;
    }

    let written = 0;
    const CHUNK = 400;
    for (let i = 0; i < planned.length; i += CHUNK) {
        const batch = db.batch();
        for (const p of planned.slice(i, i + CHUNK)) {
            batch.update(db.collection(p.collection).doc(p.id), {
                name: p.to,
                _preFixName: p.from,
                _nameFixedAt: new Date().toISOString()
            });
            written++;
        }
        await batch.commit();
    }

    console.log(`\n${written} names repaired.`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
