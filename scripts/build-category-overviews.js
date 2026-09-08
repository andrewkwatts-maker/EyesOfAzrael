#!/usr/bin/env node

/**
 * Build the mythology/category tier: "Greek Deities", "Norse Heroes", and so on.
 *
 * The site already routes #/mythology/greek/deities and lists the matching
 * entities there, but the page's prose is generated from a hardcoded template in
 * js/views/browse-category-view.js — the same sentence for every tradition with
 * the name swapped in. The legacy site wrote each of these by hand, some to
 * 13,000 characters.
 *
 * Those pages were held back from the entity import for good reason: a page about
 * the Greek deities is not itself a deity, and importing it into `deities` would
 * have put "Greek Deities" in the grid beside Zeus. They belong to the tier
 * between a tradition and its entities, which is what this collection is.
 *
 * WHY A SEPARATE COLLECTION
 *
 * Keyed <mythology>_<category>, matching the route exactly, so the view can fetch
 * one document by id with no query. Embedding them in the `mythologies`
 * documents would mean pulling all ten categories' prose to render one, and
 * `mythologies` is already loaded on the hub page where none of it is shown.
 *
 * Dry run by default; --confirm writes to Firestore.
 *
 * USAGE
 *   node scripts/build-category-overviews.js
 *   node scripts/build-category-overviews.js --confirm
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const REPORT = path.join(__dirname, '..', 'data', 'legacy-port', 'port-report.json');
const OUT_DIR = path.join(__dirname, '..', 'data', 'legacy-port', 'mythology_categories');
const SOURCE = (() => {
    const i = args.indexOf('--source');
    return i !== -1 && args[i + 1] ? args[i + 1] : 'H:/DaedalusSVN/Mythology';
})();

/** Legacy folder -> the collection the route uses, mirroring port-legacy-html.js. */
const CATEGORY_TO_COLLECTION = {
    deities: 'deities', gods: 'deities', heroes: 'heroes', figures: 'heroes',
    creatures: 'creatures', beings: 'creatures', monsters: 'creatures',
    places: 'places', locations: 'places', realms: 'places', cosmology: 'cosmology',
    items: 'items', artifacts: 'items', relics: 'items', weapons: 'items',
    texts: 'texts', scriptures: 'texts', concepts: 'concepts', symbols: 'symbols',
    rituals: 'rituals', practices: 'rituals', herbs: 'herbs', magic: 'magic',
    myths: 'myths', stories: 'myths', tarot: 'tarot', path: 'concepts',
    kabbalah: 'concepts', gnostic: 'concepts', worlds: 'cosmology'
};

function extractPage(relPath) {
    const file = path.join(SOURCE, relPath);
    if (!fs.existsSync(file)) return null;
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));

    const heading = ($('h1').first().text() || '').replace(/\s+/g, ' ').trim();
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

    const icon = (heading.match(/^([\p{Extended_Pictographic}]+)/u) || [])[1] || '';
    return {
        heading: heading.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim(),
        icon,
        paragraphs,
        sections
    };
}

async function main() {
    if (!fs.existsSync(REPORT)) {
        console.error(`No report at ${REPORT}. Run port-legacy-html.js first.`);
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
    const hubs = (report.categoryHubs || []).filter((h) => {
        const parts = h.sourceFile.split('/');
        return (parts[0] === 'mythos' || parts[0] === 'mythos2') && parts.length === 4;
    });

    // mythos2/ forks mythos/, so the same tradition+category appears twice.
    // Keep whichever page carries more prose.
    const byId = new Map();
    let collisions = 0;

    for (const hub of hubs) {
        const parts = hub.sourceFile.split('/');
        const mythology = parts[1];
        const legacyCategory = parts[2];
        const category = CATEGORY_TO_COLLECTION[legacyCategory];
        if (!category) continue;

        const id = `${mythology}_${category}`;
        const page = extractPage(hub.sourceFile);
        if (!page || !page.paragraphs.length) continue;

        const longDescription = page.paragraphs.join('\n\n');
        const prev = byId.get(id);
        if (prev) {
            collisions++;
            if (longDescription.length <= prev.longDescription.length) continue;
        }

        const pretty = mythology.charAt(0).toUpperCase() + mythology.slice(1);
        byId.set(id, {
            id,
            mythology,
            category,
            legacyCategory,
            name: page.heading || `${pretty} ${category}`,
            // Kept short on purpose: this is the lead paragraph shown under the
            // page title, not the whole article.
            description: page.paragraphs[0].slice(0, 400),
            longDescription,
            sections: page.sections,
            icon: page.icon,
            route: `#/mythology/${mythology}/${category}`,
            status: 'published',
            visibility: 'public',
            migratedFrom: 'daedalus-svn-mythology',
            _legacySource: hub.sourceFile,
            _portedBy: 'scripts/build-category-overviews.js',
            _portedAt: new Date().toISOString()
        });
    }

    const docs = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
    console.log(`mythology/category overviews: ${docs.length}  (${collisions} mythos2 duplicates collapsed)\n`);
    docs.slice(0, 14).forEach((d) => console.log(
        `  ${d.id.padEnd(26)} ${String(d.longDescription.length).padStart(6)} chars, ${String(d.sections.length).padStart(2)} sections  "${d.name.slice(0, 34)}"`
    ));
    if (docs.length > 14) console.log(`  ... and ${docs.length - 14} more`);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const d of docs) {
        fs.writeFileSync(path.join(OUT_DIR, `${d.id}.json`), JSON.stringify(d, null, 2));
    }
    console.log(`\nWritten to ${OUT_DIR}`);

    if (!CONFIRM) {
        console.log('Dry run — nothing sent to Firestore. Re-run with --confirm.');
        return;
    }

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
        process.exit(1);
    }
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'eyesofazrael'
    });
    const db = admin.firestore();

    let written = 0;
    for (const d of docs) {
        // set() is correct here, unlike the entity import: these documents are
        // generated wholly from the legacy page and this collection holds nothing
        // else, so a re-run should refresh rather than refuse.
        await db.collection('mythology_categories').doc(d.id).set(d, { merge: true });
        written++;
    }
    console.log(`${written} overview documents written to mythology_categories.`);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
