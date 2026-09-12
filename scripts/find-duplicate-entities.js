#!/usr/bin/env node

/**
 * Find entities that appear more than once in the database.
 *
 * Duplicates surfaced during the legacy import: the matcher kept offering two
 * equally good targets for one legacy page — jesus_christ and christian_jesus,
 * moses and jewish_hero_moses, gabriel and jibreel — because both genuinely
 * exist. That was a symptom, and this looks for the rest of it.
 *
 * Grouping is on normalised name plus tradition. Two records called "Zeus" in
 * the Greek tradition are one subject recorded twice; "Zeus" in Greek and "Zeus"
 * in Roman are two subjects and are not grouped.
 *
 * Reports only. Merging is a content decision — which record keeps the canonical
 * id, what happens to relationships pointing at the loser — and the two sides of
 * a duplicate are rarely equal: one usually carries the prose and the other the
 * relationships.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/find-duplicate-entities.js
 *   node scripts/find-duplicate-entities.js --collection deities
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const only = (() => {
    const i = args.indexOf('--collection');
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
})();

const COLLECTIONS = [
    'deities', 'heroes', 'creatures', 'places', 'items', 'texts', 'concepts',
    'symbols', 'rituals', 'herbs', 'archetypes', 'magic', 'cosmology', 'myths'
];

/** Names collapse to this for comparison; see the note on grouping above. */
function nameKey(name) {
    return String(name || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\(.*?\)/g, ' ')          // drop parenthetical glosses
        .replace(/^(the|a|an)\s+/, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

/** How much a record carries, used to suggest which side should survive. */
function weigh(data) {
    const text = ['description', 'longDescription', 'significance', 'symbolism']
        .map((f) => (typeof data[f] === 'string' ? data[f] : ''))
        .join(' ').length;
    const rels = ['relatedItems', 'relatedEntities', 'relationships', 'sources', 'keyMyths']
        .reduce((n, f) => n + (Array.isArray(data[f]) ? data[f].length : 0), 0);
    const sections = Array.isArray(data.extendedContent) ? data.extendedContent.length : 0;
    return { text, rels, sections, score: text + rels * 200 + sections * 300 };
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

    const groups = new Map();
    let scanned = 0;

    for (const collection of (only ? [only] : COLLECTIONS)) {
        const snap = await db.collection(collection).get();
        scanned += snap.size;
        for (const doc of snap.docs) {
            const data = doc.data();
            const key = nameKey(data.name || data.title || doc.id);
            if (!key || key.length < 3) continue;
            const myth = String(data.mythology || '').toLowerCase();
            const groupKey = `${collection}|${myth}|${key}`;
            if (!groups.has(groupKey)) groups.set(groupKey, []);
            groups.get(groupKey).push({
                id: doc.id, collection, mythology: myth,
                name: data.name || data.title || doc.id,
                ...weigh(data)
            });
        }
        console.log(`  scanned ${collection.padEnd(11)} ${String(snap.size).padStart(6)}`);
    }

    const dupes = [...groups.entries()]
        .filter(([, rows]) => rows.length > 1)
        .map(([key, rows]) => {
            rows.sort((a, b) => b.score - a.score);
            return { key, rows, wasted: rows.length - 1 };
        })
        .sort((a, b) => b.rows.length - a.rows.length || b.rows[0].score - a.rows[0].score);

    const extra = dupes.reduce((n, d) => n + d.wasted, 0);

    console.log(`\n${scanned} entities scanned`);
    console.log(`  subjects recorded more than once : ${dupes.length}`);
    console.log(`  redundant records                : ${extra}\n`);

    console.log('worst cases (keep -> the fuller record):');
    dupes.slice(0, 18).forEach((d) => {
        const [keep, ...rest] = d.rows;
        console.log(`  ${keep.collection}/${keep.name}`);
        console.log(`      KEEP  ${keep.id.padEnd(34)} text=${String(keep.text).padStart(6)} rels=${String(keep.rels).padStart(3)} sections=${keep.sections}`);
        rest.forEach((r) => console.log(`      dup   ${r.id.padEnd(34)} text=${String(r.text).padStart(6)} rels=${String(r.rels).padStart(3)} sections=${r.sections}`));
    });

    const out = path.join(__dirname, '..', 'data', 'legacy-port', 'duplicate-entities.json');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(dupes, null, 2));
    console.log(`\nFull list: ${out}`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
