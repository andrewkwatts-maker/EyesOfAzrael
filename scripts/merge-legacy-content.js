#!/usr/bin/env node

/**
 * Merge richer legacy prose into existing Firestore records.
 *
 * The legacy site holds far more text than the database for many entities that
 * already exist: Reiki is 19,117 characters in the legacy pages against 320 live,
 * Qigong 17,879 against 276. Those live records are placeholders. This copies the
 * long-form content across without disturbing the curated record around it.
 *
 * WHAT IS AND IS NOT TOUCHED
 *
 * Never written: name, id, slug, type, mythology, icon, relationships, tags and
 * every other curated field. Those were chosen deliberately and the legacy page
 * is not a better source for them.
 *
 * Never written: `description`. It is the summary shown on browse cards, and the
 * legacy equivalent runs to tens of thousands of characters. Writing that in
 * would push a wall of text through every card grid on the site — a layout
 * failure that would look like a CSS bug, several screens away from this script.
 *
 * Written: `longDescription` when the legacy version is at least 1.5x longer, and
 * `extendedContent` when the live record has fewer sections than the legacy page.
 * The previous values are preserved in _preMergeLongDescription and
 * _preMergeExtendedContent, so any merge can be undone from the document itself.
 *
 * AMBIGUOUS PAIRS ARE SKIPPED
 *
 * Only pairs with exactly one live candidate are merged. Where the matcher found
 * several, the right target is a judgement about the subject matter, and picking
 * one arbitrarily risks writing an article about Goetia into a record about
 * Theurgy.
 *
 * Dry run by default; --confirm writes. The batch can be found or reverted with:
 *   collection.where('_mergedFrom', '==', 'daedalus-svn-mythology')
 *
 * USAGE
 *   node scripts/merge-legacy-content.js
 *   node scripts/merge-legacy-content.js --confirm
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const REPORT = path.join(__dirname, '..', 'data', 'legacy-port', 'port-report.json');
const SOURCE = (() => {
    const i = args.indexOf('--source');
    return i !== -1 && args[i + 1] ? args[i + 1] : 'H:/DaedalusSVN/Mythology';
})();

const MIN_RATIO = 1.5;

const STOPWORDS = new Set([
    'the', 'a', 'an', 'of', 'and', 'in', 'on', 'to', 'ha', 'al', 'de',
    // Words that describe a record's kind rather than its subject. They matched
    // across unrelated entities and produced the worst pairings in the set:
    // "Ma'at (Concept)" was offered "Deep State Concept" and "Demiurge Concept"
    // on the strength of the word "concept" alone, and "Prophet Ibrahim" was
    // offered "Prophet Musa".
    'concept', 'concepts', 'prophet', 'saint', 'god', 'goddess', 'deity',
    'myth', 'mythology', 'legend', 'story', 'tradition', 'system'
]);

function tokens(name) {
    return new Set(
        String(name || '')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    );
}

/**
 * Choose which live record a legacy page should merge into.
 *
 * Multiple candidates is not the same as undecidable. Most of these have one
 * obviously right answer and one or two that matched on a shared descriptive
 * word: "Prophet Ibrahim (Abraham)" is offered both islamic_ibrahim, which
 * shares two meaningful words, and islamic_musa, which shares only "prophet".
 *
 * Candidates are scored on how many meaningful words they share with the legacy
 * title, with a point for agreeing on tradition. A candidate wins only by
 * scoring strictly higher than every other — a tie is a real tie and goes back
 * to the caller as ambiguous, because picking arbitrarily between two records
 * that are equally good matches is how an article about Jesus ends up on a
 * record about someone else.
 *
 * Returns the winning candidate, or null when there is no clear one.
 */
function pickBestCandidate(pair) {
    const candidates = pair.candidates || [];
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    const sourceMythology = (pair.sourceFile.match(/^mythos2?\/([^/]+)\//) || [])[1] || null;
    const nameTokens = tokens(pair.name);

    const scored = candidates.map((candidate) => {
        const candidateTokens = tokens(candidate.liveName || candidate.liveId);
        let score = 0;
        for (const t of nameTokens) if (candidateTokens.has(t)) score += 2;
        // Agreeing on tradition breaks ties between otherwise equal matches and
        // rejects cross-tradition accidents outright.
        if (sourceMythology && String(candidate.liveId).toLowerCase().startsWith(`${sourceMythology}_`)) {
            score += 1;
        }
        return { candidate, score };
    }).sort((a, b) => b.score - a.score);

    if (scored[0].score === 0) return null;
    if (scored.length > 1 && scored[0].score === scored[1].score) return null;
    return scored[0].candidate;
}

/** Re-read the legacy page for its full prose, which the report does not store. */
function readLegacy(relPath) {
    const file = path.join(SOURCE, relPath);
    if (!fs.existsSync(file)) return null;
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
    const $main = $('main').length ? $('main') : $('body');
    $main.find('script, style, nav, footer, header').remove();

    const paragraphs = $main.find('p')
        .map((i, el) => $(el).text().replace(/\s+/g, ' ').trim()).get()
        .filter((t) => t.length > 0);

    const extendedContent = [];
    $main.find('section').each((i, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3').first().text().replace(/\s+/g, ' ').trim();
        const content = $el.find('p, li')
            .map((j, p) => $(p).text().replace(/\s+/g, ' ').trim()).get()
            .filter(Boolean).join('\n\n');
        if (title && content.length > 60) extendedContent.push({ title, content });
    });

    return { longDescription: paragraphs.join('\n\n'), extendedContent };
}

async function main() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        process.exit(1);
    }
    if (!fs.existsSync(REPORT)) {
        console.error(`No report at ${REPORT}. Run port-legacy-html.js first.`);
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });
    const db = admin.firestore();

    const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
    const pairs = report.possibleDuplicates || [];

    const planned = [];
    const ambiguous = [];
    const notRicher = [];

    for (const pair of pairs) {
        const target = pickBestCandidate(pair);
        if (!target) {
            ambiguous.push(pair);
            continue;
        }
        const collection = (target.liveName.match(/\(in ([a-z_]+)\)/) || [])[1] || pair.collection;

        const snap = await db.collection(collection).doc(target.liveId).get();
        if (!snap.exists) continue;
        const liveDoc = snap.data();

        const legacy = readLegacy(pair.sourceFile);
        if (!legacy) continue;

        const liveLong = typeof liveDoc.longDescription === 'string' ? liveDoc.longDescription : '';
        const liveSections = Array.isArray(liveDoc.extendedContent) ? liveDoc.extendedContent.length : 0;

        // Fill gaps; do not contest content that is already substantial.
        //
        // Nearly every target here has an empty longDescription or a placeholder
        // of a few hundred characters, so filling those captures the value
        // without ever arguing with real editorial work. A live field carrying
        // 500+ characters is someone's writing, and replacing it is a content
        // decision rather than a migration one.
        const wantsLong = legacy.longDescription.length > 200
            && liveLong.length < 500
            && legacy.longDescription.length > liveLong.length * MIN_RATIO;
        const wantsSections = liveSections === 0 && legacy.extendedContent.length > 0;

        if (!wantsLong && !wantsSections) { notRicher.push(pair); continue; }

        // A cross-collection merge is where mis-targeting does damage: the
        // matcher paired the Tarot overview with a record in `creatures`.
        // Equivalences that genuinely span collections are listed; anything else
        // needs a person to confirm the two are the same subject.
        const EQUIVALENT = {
            magic: ['magic', 'magic_systems', 'rituals'],
            magic_systems: ['magic', 'magic_systems'],
            concepts: ['concepts', 'cosmology'],
            cosmology: ['concepts', 'cosmology'],
            rituals: ['rituals', 'magic'],
            items: ['items'], texts: ['texts'], deities: ['deities'],
            heroes: ['heroes'], creatures: ['creatures'], places: ['places'],
            herbs: ['herbs'], symbols: ['symbols'], myths: ['myths'],
            archetypes: ['archetypes'], tarot: ['tarot']
        };
        const allowed = EQUIVALENT[pair.collection] || [pair.collection];
        if (!allowed.includes(collection)) {
            ambiguous.push({ ...pair, reason: `${pair.collection} -> ${collection}` });
            continue;
        }

        planned.push({
            collection, id: target.liveId, name: pair.name, sourceFile: pair.sourceFile,
            liveLong: liveLong.length, legacyLong: legacy.longDescription.length,
            liveSections, legacySections: legacy.extendedContent.length,
            legacy, wantsLong, wantsSections
        });
    }

    // mythos2/ forks the same pages, so two entries can target one document.
    // Writing both is harmless but does the work twice and makes the merged
    // count disagree with the number of documents actually changed.
    const seen = new Set();
    const deduped = [];
    for (const p of planned) {
        const k = `${p.collection}/${p.id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        deduped.push(p);
    }
    const duplicateTargets = planned.length - deduped.length;
    planned.length = 0;
    planned.push(...deduped);

    console.log(`near-duplicate pairs        : ${pairs.length}`);
    console.log(`  duplicate targets collapsed: ${duplicateTargets}`);
    console.log(`  ambiguous (>1 candidate)  : ${ambiguous.length}  skipped`);
    console.log(`  live already as good      : ${notRicher.length}  skipped`);
    console.log(`  to merge                  : ${planned.length}\n`);

    planned.sort((a, b) => (b.legacyLong - b.liveLong) - (a.legacyLong - a.liveLong));
    console.log('  legacy    live  sections  entity');
    planned.slice(0, 20).forEach((p) => console.log(
        `  ${String(p.legacyLong).padStart(6)}  ${String(p.liveLong).padStart(6)}  ` +
        `${String(p.liveSections)}->${String(p.legacySections).padEnd(6)}  ${p.name.slice(0, 34)} -> ${p.collection}/${p.id}`
    ));

    if (!CONFIRM) {
        console.log('\nDry run — nothing written. Re-run with --confirm to merge.');
        return;
    }

    let merged = 0;
    const failures = [];
    for (const p of planned) {
        const update = {
            _mergedFrom: 'daedalus-svn-mythology',
            _mergedAt: new Date().toISOString(),
            _mergeSourceFile: p.sourceFile
        };
        if (p.wantsLong) {
            update._preMergeLongDescription = p.liveLong ? undefined : '';
            update.longDescription = p.legacy.longDescription;
        }
        if (p.wantsSections) {
            update.extendedContent = p.legacy.extendedContent;
        }

        try {
            const ref = db.collection(p.collection).doc(p.id);
            const snap = await ref.get();
            const before = snap.data() || {};
            // Preserve whatever is being replaced, so the merge is reversible.
            if (p.wantsLong) update._preMergeLongDescription = before.longDescription || '';
            if (p.wantsSections) update._preMergeExtendedContent = before.extendedContent || [];
            await ref.update(update);
            merged++;
            console.log(`  merged  ${p.collection}/${p.id}  (${p.liveLong} -> ${p.legacyLong} chars)`);
        } catch (err) {
            failures.push(`${p.collection}/${p.id}: ${err.message}`);
            console.log(`  FAILED  ${p.collection}/${p.id} — ${err.message}`);
        }
    }

    console.log(`\n${merged} merged, ${failures.length} failed.`);
    if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
