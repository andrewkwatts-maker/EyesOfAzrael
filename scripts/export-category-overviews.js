#!/usr/bin/env node

/**
 * Publish the tradition/category tier as a static file.
 *
 * Every category page reads mythology_categories to get its own overview prose
 * and the sibling links beside it — 11 document reads on #/mythology/greek/deities,
 * and the same again for each of the 181 traditions a reader moves through. It is
 * the last route still paying Firestore on a normal browse.
 *
 * The collection is not an entity domain, so it does not belong in
 * DOMAINS.allCollections() and cannot ride along in the main static base without
 * the browse routes and facet builders treating it as a category of things. It
 * gets its own file instead.
 *
 * The whole tier is 184 records of a heading, a paragraph and a count, so one
 * file is smaller than the query it replaces and is cached by the browser for
 * the whole session.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/export-category-overviews.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const OUT = path.join(__dirname, '..', 'static', 'mythology-categories.json');

/**
 * Fields the category page actually renders.
 *
 * `longDescription` and `sections` are deliberately excluded: they run to
 * thousands of characters each and nothing on the listing page displays them,
 * so including them would make this file larger than the data it saves.
 */
const FIELDS = ['id', 'mythology', 'category', 'name', 'description', 'icon', 'entityCount', 'route'];

/**
 * Entities per tradition-and-category, counted the way the page counts them.
 *
 * Mirrors what a listing actually renders: duplicates redirect so they are not
 * shown, and the shadow list from scripts/build-topics.js holds back records
 * another record already says better. A count that ignored either would be
 * right about the database and wrong about the page.
 */
function countFromBase() {
    const base = path.join(__dirname, '..', 'static', 'entities');
    const counts = new Map();
    if (!fs.existsSync(base)) return counts;

    let shadowed = {};
    const topicsFile = path.join(__dirname, '..', 'static', 'topics.json');
    if (fs.existsSync(topicsFile)) {
        try {
            shadowed = JSON.parse(fs.readFileSync(topicsFile, 'utf8')).shadowed || {};
        } catch (err) {
            // Counting without it is still better than the stored number.
        }
    }

    for (const collection of fs.readdirSync(base)) {
        const file = path.join(base, collection, '_all.json');
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
            const key = `${String(row.mythology).toLowerCase()}/${collection.toLowerCase()}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    return counts;
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

    const snap = await admin.firestore().collection('mythology_categories').get();

    // Grouped by tradition, because that is how the page asks for it: one
    // lookup for the overview and its siblings, with no scan at read time.
    const byMythology = {};
    for (const doc of snap.docs) {
        const data = doc.data();
        const myth = String(data.mythology || '').toLowerCase();
        if (!myth) continue;

        const row = {};
        for (const field of FIELDS) {
            if (data[field] !== undefined) row[field] = data[field];
        }
        row.id = row.id || doc.id;

        (byMythology[myth] = byMythology[myth] || []).push(row);
    }

    // Recount from the base rather than trusting the stored number.
    //
    // `entityCount` in Firestore was computed before the duplicate merge and
    // before the base export stopped emitting repeated ids, so it drifted: the
    // Japanese deities overview claimed 112 where the page rendered 94, and the
    // page showed both numbers at once - the stale one in the prose, the real
    // one in the stat block and the pager. Recomputing here means the figure
    // corrects itself on every export instead of needing its own repair job.
    const liveCounts = countFromBase();
    let corrected = 0;
    for (const rows of Object.values(byMythology)) {
        for (const row of rows) {
            const key = `${String(row.mythology).toLowerCase()}/${String(row.category).toLowerCase()}`;
            const actual = liveCounts.get(key);
            if (actual === undefined || actual === row.entityCount) continue;

            // The number is written into the description too ("112 deities and
            // divine beings catalogued in the Japanese tradition"), so fixing
            // only the field would leave the sentence contradicting it.
            if (typeof row.description === 'string') {
                row.description = row.description.replace(/^\s*[\d,]+\b/, String(actual));
            }
            row.entityCount = actual;
            corrected++;
        }
    }
    if (corrected) console.log(`  recounted ${corrected} overview(s) that had drifted from the base`);

    // Busiest category first, matching the order the sibling links render in.
    for (const rows of Object.values(byMythology)) {
        rows.sort((a, b) => (b.entityCount || 0) - (a.entityCount || 0));
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        traditions: Object.keys(byMythology).length,
        total: snap.size,
        byMythology
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload));

    const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
    console.log(`${snap.size} category overviews across ${payload.traditions} traditions -> ${OUT} (${kb} KB)`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
