#!/usr/bin/env node

/**
 * Consolidate duplicate entities onto one canonical record.
 *
 * scripts/find-duplicate-entities.js finds subjects recorded more than once —
 * Zeus four times, Jesus five. This merges each group onto its fullest record
 * and marks the others as redirects.
 *
 * NOTHING IS DELETED
 *
 * Relationships across the database point at specific document ids, and so do
 * URLs people have already followed or shared. Deleting the losing record breaks
 * both, silently: a relationship pointing at a missing id renders as a link to
 * nothing. Each duplicate instead keeps its document and gains
 * `duplicateOf: <canonical id>` plus `status: 'duplicate'`, so the router can
 * send it to the canonical entry and every existing link keeps working.
 *
 * Content is moved before anything is marked. The fullest record is not always
 * the one with the most prose — Aphrodite's best-connected record has 6,929
 * characters while a thinner duplicate has 8,501 — so longer prose, extra
 * sections and unseen relationships are copied onto the keeper first. The merge
 * only ever adds.
 *
 * REVERSIBLE
 *
 *   collection.where('duplicateOf', '!=', null)          finds the batch
 *   _preMergeDuplicate on the keeper                     holds what it had before
 *
 * USAGE
 *   node scripts/find-duplicate-entities.js        (writes the report this reads)
 *   node scripts/merge-duplicate-entities.js --limit 20
 *   node scripts/merge-duplicate-entities.js --limit 20 --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const LIMIT = (() => {
    const i = args.indexOf('--limit');
    return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : Infinity;
})();

const REPORT = path.join(__dirname, '..', 'data', 'legacy-port', 'duplicate-entities.json');

/**
 * Groups whose shared "name" is a category rather than a subject.
 *
 * 26 groups covering 105 records are not duplicates at all: their `name` field
 * holds something like "Greek Mythology" or "Christian Cosmology", so four
 * unrelated creatures group together under one meaningless title. Merging those
 * would destroy four distinct entities. They are a naming defect and are left
 * for that to be fixed separately.
 */
const GENERIC_NAME = /^(the )?[a-z]+ (mythology|cosmology|tradition|deities|creatures|heroes|pantheon|beings|figures)$/i;

const textOf = (d, f) => (typeof d[f] === 'string' ? d[f] : '');

function mergeArrays(a, b, keyOf) {
    const out = [];
    const seen = new Set();
    for (const item of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
        const key = keyOf(item);
        if (key == null || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        process.exit(1);
    }
    if (!fs.existsSync(REPORT)) {
        console.error(`No report at ${REPORT}. Run find-duplicate-entities.js first.`);
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });
    const db = admin.firestore();

    const all = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
    const groups = all
        .filter((g) => !GENERIC_NAME.test(g.rows[0].name))
        .filter((g) => g.rows.length > 1)
        .slice(0, LIMIT);

    const skippedGeneric = all.length - all.filter((g) => !GENERIC_NAME.test(g.rows[0].name)).length;

    console.log(`duplicate groups in report      : ${all.length}`);
    console.log(`  misnamed, not duplicates      : ${skippedGeneric}  (left alone)`);
    console.log(`  to process this run           : ${groups.length}\n`);

    let merged = 0, marked = 0, failed = 0;

    for (const group of groups) {
        const [keeperRow, ...losers] = group.rows;
        try {
            const keeperRef = db.collection(keeperRow.collection).doc(keeperRow.id);
            const keeperSnap = await keeperRef.get();
            if (!keeperSnap.exists) continue;
            const keeper = keeperSnap.data();

            const update = {};
            let changed = false;

            for (const loserRow of losers) {
                const loserRef = db.collection(loserRow.collection).doc(loserRow.id);
                const loserSnap = await loserRef.get();
                if (!loserSnap.exists) continue;
                const loser = loserSnap.data();

                // Longer prose wins, per field.
                for (const field of ['longDescription', 'description', 'significance', 'symbolism']) {
                    const mine = textOf(update[field] !== undefined ? update : keeper, field);
                    const theirs = textOf(loser, field);
                    if (theirs.length > mine.length * 1.2 && theirs.length > 200) {
                        update[field] = theirs;
                        changed = true;
                    }
                }

                // Sections and relationships are unioned, never replaced.
                const keeperSections = update.extendedContent || keeper.extendedContent;
                if (Array.isArray(loser.extendedContent) && loser.extendedContent.length) {
                    const combined = mergeArrays(keeperSections, loser.extendedContent, (s) => s && s.title);
                    if (combined.length > (Array.isArray(keeperSections) ? keeperSections.length : 0)) {
                        update.extendedContent = combined;
                        changed = true;
                    }
                }
                for (const field of ['relatedItems', 'sources', 'keyMyths']) {
                    const base = update[field] || keeper[field];
                    if (Array.isArray(loser[field]) && loser[field].length) {
                        const combined = mergeArrays(base, loser[field], (x) => (x && (x.id || x.name || x.title)) || null);
                        if (combined.length > (Array.isArray(base) ? base.length : 0)) {
                            update[field] = combined;
                            changed = true;
                        }
                    }
                }

                if (CONFIRM) {
                    await loserRef.update({
                        duplicateOf: keeperRow.id,
                        duplicateOfCollection: keeperRow.collection,
                        status: 'duplicate',
                        _mergedIntoAt: new Date().toISOString()
                    });
                }
                marked++;
            }

            if (changed) {
                if (CONFIRM) {
                    update._preMergeDuplicate = {
                        longDescription: textOf(keeper, 'longDescription').slice(0, 20000),
                        extendedContent: Array.isArray(keeper.extendedContent) ? keeper.extendedContent.length : 0
                    };
                    update._duplicatesMergedAt = new Date().toISOString();
                    await keeperRef.update(update);
                }
                merged++;
            }

            if (groups.length <= 30) {
                console.log(`  ${keeperRow.collection}/${keeperRow.name}`);
                console.log(`      keep ${keeperRow.id}${changed ? '  (enriched)' : ''}`);
                losers.forEach((l) => console.log(`      ->   ${l.id} marked duplicate`));
            }
        } catch (err) {
            failed++;
            console.log(`  FAILED ${keeperRow.collection}/${keeperRow.id}: ${err.message}`);
        }
    }

    console.log(`\n${marked} records marked as duplicates, ${merged} canonical records enriched, ${failed} failed.`);
    if (!CONFIRM) console.log('Dry run — nothing written. Re-run with --confirm.');
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
