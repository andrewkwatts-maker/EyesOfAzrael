#!/usr/bin/env node

/**
 * Fill in the tradition tier from the legacy hub pages.
 *
 * #/mythology/greek is the top of every route that goes through a tradition, and
 * 147 of the 181 tradition records carry under 400 characters of prose — most
 * around 130, which is a single sentence. The legacy site wrote a proper
 * introduction for sixteen of them, between 1,500 and 9,300 characters each.
 *
 * Those pages were skipped by the entity import for the right reason: a page
 * about Greek mythology is not an entity and does not belong in a collection
 * beside Zeus. They belong here, on the tradition record itself.
 *
 * WHAT IS WRITTEN
 *
 * longDescription only, and only where the legacy version is substantially
 * longer than what is there. `description` is left alone — it is the summary on
 * tradition cards and listings, and replacing a one-line summary with nine
 * thousand characters would wreck every grid it appears in. `sections`, `name`,
 * `stats` and `entityCounts` are untouched.
 *
 * The previous value is kept in _preMergeLongDescription and the batch is
 * findable by _hubImportedFrom, so this is reversible from the documents.
 *
 * mythos2/ duplicates three of these; the longer page wins.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/import-tradition-hubs.js
 *   node scripts/import-tradition-hubs.js --confirm
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const SOURCE = (() => {
    const i = args.indexOf('--source');
    return i !== -1 && args[i + 1] ? args[i + 1] : 'H:/DaedalusSVN/Mythology';
})();

const MIN_RATIO = 1.5;

function extractHub(relPath) {
    const file = path.join(SOURCE, relPath);
    if (!fs.existsSync(file)) return null;
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
    const $main = $('main').length ? $('main') : $('body');
    $main.find('script, style, nav, footer, header').remove();

    const paragraphs = $main.find('p')
        .map((i, el) => $(el).text().replace(/\s+/g, ' ').trim()).get()
        .filter((t) => t.length > 40 && !/under development|coming soon/i.test(t));

    const sections = [];
    $main.find('section').each((i, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3').first().text().replace(/\s+/g, ' ').trim();
        const content = $el.find('p, li')
            .map((j, p) => $(p).text().replace(/\s+/g, ' ').trim()).get()
            .filter(Boolean).join('\n\n');
        if (title && content.length > 80) sections.push({ title, content });
    });

    return { longDescription: paragraphs.join('\n\n'), sections };
}

function findHubPages() {
    const found = new Map();
    for (const tree of ['mythos', 'mythos2']) {
        const dir = path.join(SOURCE, tree);
        if (!fs.existsSync(dir)) continue;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
            const rel = `${tree}/${entry.name}/index.html`;
            const page = extractHub(rel);
            if (!page || page.longDescription.length < 400) continue;

            const prior = found.get(entry.name);
            if (!prior || page.longDescription.length > prior.page.longDescription.length) {
                found.set(entry.name, { mythology: entry.name, sourceFile: rel, page });
            }
        }
    }
    return [...found.values()];
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

    const hubs = findHubPages();
    const planned = [];
    const skipped = [];

    for (const hub of hubs) {
        const ref = db.collection('mythologies').doc(hub.mythology);
        const snap = await ref.get();
        if (!snap.exists) {
            skipped.push(`${hub.mythology}: no tradition record`);
            continue;
        }

        const live = snap.data();
        const liveLong = typeof live.longDescription === 'string' ? live.longDescription : '';
        const legacyLong = hub.page.longDescription;

        if (legacyLong.length <= Math.max(liveLong.length * MIN_RATIO, 400)) {
            skipped.push(`${hub.mythology}: live already comparable (${liveLong.length} vs ${legacyLong.length})`);
            continue;
        }

        planned.push({
            id: hub.mythology,
            sourceFile: hub.sourceFile,
            liveLen: liveLong.length,
            legacyLen: legacyLong.length,
            liveSections: Array.isArray(live.sections) ? live.sections.length : 0,
            legacySections: hub.page.sections.length,
            longDescription: legacyLong,
            preMerge: liveLong
        });
    }

    planned.sort((a, b) => b.legacyLen - a.legacyLen);

    console.log(`legacy tradition hub pages found : ${hubs.length}`);
    console.log(`  to import                      : ${planned.length}`);
    console.log(`  skipped                        : ${skipped.length}\n`);
    console.log('   live  legacy  sections  tradition');
    planned.forEach((p) => console.log(
        `  ${String(p.liveLen).padStart(5)}  ${String(p.legacyLen).padStart(6)}  ${String(p.liveSections).padStart(8)}  ${p.id}`
    ));
    if (skipped.length) {
        console.log('\nskipped:');
        skipped.slice(0, 6).forEach((s) => console.log('  ' + s));
    }

    if (!CONFIRM) {
        console.log('\nDry run — nothing written. Re-run with --confirm.');
        return;
    }

    let written = 0;
    for (const p of planned) {
        await db.collection('mythologies').doc(p.id).update({
            longDescription: p.longDescription,
            _preMergeLongDescription: p.preMerge,
            _hubImportedFrom: 'daedalus-svn-mythology',
            _hubImportedAt: new Date().toISOString(),
            _hubSourceFile: p.sourceFile
        });
        written++;
        console.log(`  imported  ${p.id}  (${p.liveLen} -> ${p.legacyLen} chars)`);
    }

    console.log(`\n${written} tradition records enriched.`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
