#!/usr/bin/env node

/**
 * Port legacy static-HTML mythology pages into Firestore-shaped entity documents.
 *
 * Built for H:\DaedalusSVN\Mythology, an older static site whose pages were never
 * migrated. It is source-agnostic: point --source at any tree laid out as
 * <mythology>/<category>/<entity>.html.
 *
 * WHY THIS IS NOT A BULK IMPORT
 *
 * The live database already holds ~13,400 entities, and a large share of the
 * legacy pages describe things that are already there — often far better than the
 * legacy page does. Some legacy pages are literal stubs ("This page is under
 * development"). Importing indiscriminately would overwrite good records with
 * one-sentence ones, and nothing downstream would flag it: a thin entity renders
 * exactly like a rich one, just emptier. So every candidate is classified against
 * live data first and the default mode writes nothing at all.
 *
 * MATCHING
 *
 * Live document ids are not a usable key. They are a mix of three conventions —
 * "greek_hydra", bare "aarons-rod", and raw display names like "Born from Brahma's
 * mind" — so an id lookup silently misses existing records and reports them as
 * new. Matching is therefore on normalised name plus mythology, with the id used
 * only as a secondary signal.
 *
 * USAGE
 *   node scripts/port-legacy-html.js --source "H:/DaedalusSVN/Mythology"
 *   node scripts/port-legacy-html.js --source "..." --emit
 *   node scripts/port-legacy-html.js --source "..." --emit --only items,places
 *
 * --emit writes one JSON document per NEW entity under --out. Nothing is ever
 * written to Firestore by this script; review the emitted files, then upload them
 * with the existing push tooling.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const SOURCE = getArg('--source');
const OUT_DIR = getArg('--out', path.join(__dirname, '..', 'data', 'legacy-port'));
const ONLY = (getArg('--only') || '').split(',').filter(Boolean);
const EMIT = args.includes('--emit');
const VERBOSE = args.includes('--verbose');

if (!SOURCE) {
    console.error('Missing --source <dir>. See the header of this file for usage.');
    process.exit(1);
}
if (!fs.existsSync(SOURCE)) {
    console.error(`--source does not exist: ${SOURCE}`);
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

/**
 * Legacy directory name -> live collection.
 *
 * Anything not listed is skipped rather than guessed. A wrong collection is worse
 * than no import: the entity becomes unreachable through the browse routes and
 * turns up only in search, which reads as data loss rather than a mapping bug.
 */
const CATEGORY_TO_COLLECTION = {
    deities: 'deities',
    gods: 'deities',
    heroes: 'heroes',
    figures: 'heroes',
    creatures: 'creatures',
    beings: 'creatures',
    monsters: 'creatures',
    angels: 'creatures',
    places: 'places',
    locations: 'places',
    cosmology: 'cosmology',
    items: 'items',
    artifacts: 'items',
    relics: 'items',
    weapons: 'items',
    ritual: 'items',
    texts: 'texts',
    scriptures: 'texts',
    concepts: 'concepts',
    symbols: 'symbols',
    rituals: 'rituals',
    practices: 'rituals',
    herbs: 'herbs',
    herbalism: 'herbs',
    archetypes: 'archetypes',
    magic: 'magic',
    myths: 'myths',
    stories: 'myths',
    tarot: 'tarot',
    pilgrimage: 'places',
    temples: 'places',
    sacred: 'places',

    // Categories the first pass had no entry for, so 26 files were dropped and
    // every mythology's path/ article was invisible. Checked against the pages
    // themselves rather than guessed from the folder name:
    //   realms/   Helheim, Valhalla            -> places (Valhalla is already a live place)
    //   sefirot/  Binah, Chesed, Chokmah, ...  -> concepts (divine emanations)
    //   gnostic/  Sophia, Christ-Redeemer, ... -> concepts
    //   path/     "Egyptian Path" and 14 more  -> concepts (one practice guide per tradition)
    realms: 'places',
    kabbalah: 'concepts',
    sefirot: 'concepts',
    qlippot: 'concepts',
    sparks: 'concepts',
    names: 'concepts',
    gnostic: 'concepts',
    theories: 'concepts',
    path: 'concepts',
    worlds: 'cosmology'
};

/**
 * Top-level legacy trees whose own name carries the category.
 *
 * Each tree gets its own subcategory map, because the same folder name means
 * different things in different trees. "ritual" under spiritual-items holds
 * ritual objects — prayer wheels, vajras — which are items. "ritual" under magic
 * holds practices: Shamanism, Tantra, Hoodoo, Chaos Magic. A single flat lookup
 * filed all six of those magical traditions as physical items.
 */
const TOP_LEVEL_TREES = {
    'spiritual-items': { default: 'items' },
    'spiritual-places': { default: 'places' },
    archetypes: { default: 'archetypes' },
    herbalism: { default: 'herbs' },
    // Everything under magic/ is a practice or system, except its source texts.
    magic: { default: 'magic', sub: { texts: 'texts' } }
};

/**
 * Pages that are navigation or tooling, never entities.
 *
 * index.html is NOT on this list, deliberately. Excluding it by name discarded
 * 140 pages carrying real prose — mythos/christian/gnostic/jesus-teachings/index.html
 * alone is 46,711 characters across 94 paragraphs with 6 links. In this corpus a
 * folder's index is often the article about that subject, not a menu pointing at
 * one. Navigation is detected by shape instead; see looksLikeNavigation().
 */
const NOT_AN_ENTITY = [
    /index_old\.html$/i,
    /_corpus-search-template\.html$/i,
    /corpus-search\.html$/i,
    /corpus-results\//i,
    /(^|\/)components\//i,
    /(^|\/)themes\//i,
    /(^|\/)_dev\//i,
    /cross-reference-matrix\.html$/i,
    /-visualizations?\.html$/i,
    /-map\.html$/i,
    /(^|\/)about\.html$/i
];

const STUB_MARKER = /under development|coming soon/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a display name into a comparison key.
 *
 * Strips diacritics, punctuation and leading articles so that "Athena", "athena"
 * and "Athena " collapse together. Deliberately NOT a slug: slugs vary between
 * the legacy site and the database, but the human-facing name is stable.
 */
function nameKey(name) {
    return String(name || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(the|a|an)\s+/, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
}

function slugify(name) {
    return String(name || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        // Drop apostrophes rather than treating them as separators, so
        // "Inanna's Descent" slugs to inannas-descent and not inanna-s-descent.
        .replace(/['\u2019]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Traditions that may legitimately fill the `mythology` field.
 *
 * Read from the source tree's own mythos/ folders, so it cannot drift from the
 * corpus being imported. Breadcrumbs on the standalone trees name their section
 * rather than a tradition \u2014 "Magic", "Herbalism", "Magical Systems" \u2014 and taking
 * those at face value stamped mythology="magic" onto records and produced ids
 * like magical-systems_picatrix. Those values then appear as traditions in the
 * mythology filter, inventing cultures that do not exist.
 */
function loadKnownMythologies(sourceRoot) {
    const known = new Set();
    for (const tree of ['mythos', 'mythos2']) {
        const dir = path.join(sourceRoot, tree);
        if (!fs.existsSync(dir)) continue;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_')) {
                known.add(entry.name.toLowerCase());
            }
        }
    }
    return known;
}

/**
 * Characters the legacy pages use decoratively in headings.
 *
 * Emoji, plus historic scripts used as ornament rather than as the name: the
 * Sumerian pages prefix headings with cuneiform (𒀭𒈹) and the Egyptian ones with
 * hieroglyphs. Those are not letters of the entity's name, and leaving them in
 * produces an unmatchable name and an unusable slug.
 */
const DECORATIVE_GLYPHS = '\\p{Extended_Pictographic}\\u{1F000}-\\u{1FAFF}\\u{12000}-\\u{123FF}\\u{13000}-\\u{1342F}';

/** Leading decorative glyph on a heading, which becomes the entity icon. */
function extractLeadingEmoji(text) {
    const m = String(text || '').trim().match(new RegExp(`^([${DECORATIVE_GLYPHS}]+)`, 'u'));
    return m ? m[1] : null;
}

function stripEmoji(text) {
    return String(text || '')
        .replace(new RegExp(`[${DECORATIVE_GLYPHS}]`, 'gu'), '')
        // Variation selectors and joiners survive the pictographic strip and are
        // invisible, so a name that looks clean ("Qigong") silently carries a
        // leading U+FE0F and no longer matches its live record.
        .replace(/[‍︎️\u{1F3FB}-\u{1F3FF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Decide whether a page is a menu or an article, by shape rather than filename.
 *
 * Excluding every index.html by name threw away 140 pages holding real prose.
 * In this corpus a folder's index is frequently the article about that subject:
 * mythos/christian/gnostic/jesus-teachings/index.html runs to 94 paragraphs and
 * 6 links, while a true category index is the mirror image — a wall of anchors
 * with a sentence of preamble.
 *
 * Paragraph count separates them far more reliably than length does, because a
 * long menu and a long essay have similar character counts. A page needs real
 * prose in real paragraphs to qualify as an entity.
 */
function looksLikeNavigation(mainHtml, textLength) {
    const paragraphs = (mainHtml.match(/<p\b/gi) || []).length;
    const anchors = (mainHtml.match(/<a\b/gi) || []).length;
    if (paragraphs >= 5 && textLength >= 2000) return false;
    // Short pages that are mostly links are menus.
    if (anchors > paragraphs * 3) return true;
    return textLength < 2000;
}

function walkHtml(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '.svn' || entry.name === '.claude' || entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkHtml(full, out);
        else if (entry.name.toLowerCase().endsWith('.html')) out.push(full);
    }
    return out;
}

/**
 * Work out mythology and collection from the file's position in the tree.
 *
 * Legacy paths take two shapes: mythos/<mythology>/<category>/<entity>.html, and
 * top-level trees such as spiritual-items/<subtype>/<entity>.html where the tree
 * names the category and the mythology has to come from the page itself.
 */
function classifyPath(relPath) {
    const parts = relPath.split('/').filter(Boolean);
    if (parts[0] === 'mythos' || parts[0] === 'mythos2') {
        // Categories are not always at a fixed depth:
        //   mythos/greek/creatures/hydra.html          -> creatures
        //   mythos/jewish/kabbalah/sefirot/binah.html  -> sefirot
        //   mythos/christian/gnostic/texts/index.html  -> texts, not gnostic
        // Looking only at parts[2] missed the deeper ones entirely. Scanning
        // deepest-first takes the most specific category that maps, so
        // gnostic/texts resolves as texts while gnostic/sophia falls back to
        // gnostic.
        const middle = parts.slice(2, -1);
        let collection = null;
        let legacyCategory = parts[2] || null;
        for (let i = middle.length - 1; i >= 0; i--) {
            const mapped = CATEGORY_TO_COLLECTION[middle[i]];
            if (mapped) { collection = mapped; legacyCategory = middle[i]; break; }
        }
        return { mythology: parts[1] || null, collection, legacyCategory };
    }
    const tree = TOP_LEVEL_TREES[parts[0]];
    if (tree) {
        const sub = parts[1] || '';
        return {
            mythology: null, // resolved from page content
            collection: (tree.sub && tree.sub[sub]) || tree.default,
            legacyCategory: sub || parts[0]
        };
    }
    return { mythology: null, collection: null, legacyCategory: parts[0] || null };
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Pull an entity out of one legacy page.
 *
 * Returns null when the page is navigation, a stub, or has too little prose to be
 * worth a record. Returning null is the common case and is not an error.
 */
function extractEntity(file, relPath, knownMythologies) {
    const html = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(html);

    const { mythology: pathMythology, collection, legacyCategory } = classifyPath(relPath);

    const rawHeading = $('h1').first().text().trim() || $('title').first().text().trim();
    const icon = extractLeadingEmoji(rawHeading);

    // Headings use two different orders, and guessing wrong renames the entity.
    //
    //   mythos/greek/creatures/hydra.html   <title>Greek - Hydra</title>     tradition first
    //   spiritual-items/weapons/mjolnir.html <h1>Mjolnir - Thor's Hammer</h1> name first
    //
    // Taking a fixed side of the separator mislabels half the corpus: it named
    // Mjolnir "Thor's Hammer", Gungnir "Odin's Spear" and Frankincense "The
    // Sacred Incense". Those are epithets, and because the diff matches on name,
    // each one missed its existing live record and was reported as new — Mjolnir
    // and Gungnir are both already published. Left alone it would have created
    // duplicates under subtitles-as-names, which is precisely the defect that
    // produced the ~184 misleading records already in the database.
    //
    // The filename is canonical in both conventions, so it decides which segment
    // is the name and the rest becomes the subtitle. For a folder's index page
    // the folder is the subject — gnostic/sophia/index.html is Sophia — so the
    // parent directory stands in; "index" would match nothing and leave the
    // heading unarbitrated.
    const base = path.basename(relPath, '.html');
    const fileSlug = base === 'index' ? path.basename(path.dirname(relPath)) : base;
    const segments = rawHeading
        .split(/\s+[-–—:|]\s+/)
        .map((s) => stripEmoji(s).trim())
        .filter(Boolean);

    const SITE_NOISE = /^(world )?mythos( explorer)?$|^mythology$|^explorer$/i;
    const usable = segments.filter((s) => !SITE_NOISE.test(s));

    let name = usable.find((s) => nameKey(s) === nameKey(fileSlug));
    let subtitle = '';
    if (name) {
        subtitle = usable.filter((s) => s !== name).join(' - ');
    } else if (usable.length > 1 && pathMythology && nameKey(usable[0]) === nameKey(pathMythology)) {
        // "Greek - Hydra": first segment is the tradition, not the entity.
        name = usable[1];
        subtitle = usable.slice(2).join(' - ');
    } else {
        name = usable[0] || stripEmoji(rawHeading);
        subtitle = usable.slice(1).join(' - ');
    }

    name = stripEmoji(name || '').trim();
    if (!name) return null;

    // Breadcrumbs name the tradition on pages outside mythos/.
    const breadcrumb = $('nav.breadcrumb a, nav[aria-label="Breadcrumb"] a')
        .map((i, el) => $(el).text().trim()).get();
    // Only accept a breadcrumb tradition if it is a real one.
        const crumb = breadcrumb[1] ? slugify(breadcrumb[1]) : null;
        const mythology = pathMythology
            || (crumb && knownMythologies.has(crumb) ? crumb : null);

    const $main = $('main').length ? $('main') : $('body');
    $main.find('script, style, nav, footer, header').remove();

    const paragraphs = $main.find('p')
        .map((i, el) => $(el).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter((t) => t.length > 0 && !STUB_MARKER.test(t));

    // Each <section> with a heading becomes one extendedContent block, matching
    // the shape live documents already use.
    const extendedContent = [];
    $main.find('section').each((i, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3').first().text().replace(/\s+/g, ' ').trim();
        const content = $el.find('p, li')
            .map((j, p) => $(p).text().replace(/\s+/g, ' ').trim()).get()
            .filter(Boolean).join('\n\n');
        if (title && content.length > 60 && !STUB_MARKER.test(content)) {
            extendedContent.push({ title: stripEmoji(title), content });
        }
    });

    const bodyText = $main.text().replace(/\s+/g, ' ').trim();

    // A stub is a page that is *mostly* the placeholder notice, not any page
    // that happens to contain the words. Matching the marker alone threw away 26
    // substantial pages — gnostic/sophia/index.html is 30,806 characters with one
    // stray "coming soon" line, and the four Kabbalistic worlds (Assiah,
    // Yetzirah, Beriah) went the same way. Real stubs here are a sentence or two.
    const isStub = STUB_MARKER.test(bodyText) && bodyText.length < 1500;
    const isNavigation = looksLikeNavigation($main.html() || '', bodyText.length);

    // Internal links to sibling entity pages become relationship candidates.
    const related = [];
    const seen = new Set();
    $main.find('a[href$=".html"]').each((i, el) => {
        const href = $(el).attr('href') || '';
        if (/index\.html$/i.test(href) || /corpus-results/i.test(href)) return;
        const label = stripEmoji($(el).text().trim());
        const key = nameKey(label);
        if (!label || !key || key === nameKey(name) || seen.has(key)) return;
        seen.add(key);
        related.push({ id: slugify(label), name: label });
    });

    return {
        sourceFile: relPath,
        name,
        slug: slugify(name),
        icon,
        mythology,
        collection,
        legacyCategory,
        isStub,
        isNavigation,
        subtitle,
        // The epithet from the heading ("Thor's Hammer") is a better one-line
        // summary than the opening paragraph, when the page carries one.
        shortDescription: subtitle || paragraphs[0] || '',
        description: paragraphs.join('\n\n'),
        extendedContent,
        related,
        textLength: bodyText.length
    };
}

/**
 * Shape an extracted entity as a Firestore document.
 *
 * Field names mirror what live documents already carry so the record renders
 * through the same code path as everything else. Provenance fields record where
 * it came from, so a bad batch can be found and removed by query later.
 */
function toFirestoreDoc(entity) {
    const now = new Date().toISOString();
    const singular = {
        deities: 'deity', heroes: 'hero', creatures: 'creature', places: 'place',
        items: 'item', texts: 'text', concepts: 'concept', symbols: 'symbol',
        rituals: 'ritual', herbs: 'herb', archetypes: 'archetype', magic: 'magic',
        cosmology: 'cosmology', myths: 'myth', tarot: 'tarot'
    }[entity.collection] || 'entity';

    const id = entity.mythology ? `${entity.mythology}_${entity.slug}` : entity.slug;

    return {
        id,
        slug: entity.slug,
        name: entity.name,
        type: singular,
        mythology: entity.mythology || '',
        primaryMythology: entity.mythology || '',
        mythologies: entity.mythology ? [entity.mythology] : [],
        shortDescription: entity.shortDescription,
        description: entity.description,
        longDescription: entity.description,
        extendedContent: entity.extendedContent,
        relatedItems: entity.related,
        icon: entity.icon || '',
        iconType: entity.icon ? 'emoji' : '',
        tags: [entity.mythology, entity.legacyCategory].filter(Boolean),
        searchTerms: [entity.name.toLowerCase(), entity.slug, entity.mythology].filter(Boolean),
        status: 'published',
        visibility: 'public',
        createdAt: now,
        updatedAt: now,
        // Provenance — lets a whole batch be located or reverted with one query.
        migratedFrom: 'daedalus-svn-mythology',
        _legacySource: entity.sourceFile,
        _portedBy: 'scripts/port-legacy-html.js',
        _portedAt: now
    };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function loadLiveIndex() {
    const p = path.join(process.env.TEMP || '.', 'live-ids.json');
    if (!fs.existsSync(p)) {
        console.error(`Live index not found at ${p}.`);
        console.error('Generate it first (see scripts/fetch-live-index.js), or the diff cannot run.');
        process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    const byCollection = {};
    for (const [col, rows] of Object.entries(raw)) {
        const map = new Map();
        for (const r of rows) {
            map.set(nameKey(r.name || r.id), r);
            map.set(nameKey(String(r.id).replace(/^[a-z]+_/, '')), r);
        }
        byCollection[col] = map;
    }
    return byCollection;
}

function main() {
    const live = loadLiveIndex();
    const knownMythologies = loadKnownMythologies(SOURCE);
    const files = walkHtml(SOURCE);

    const stats = {
        scanned: files.length, skippedNav: 0, skippedStub: 0, skippedThin: 0,
        unmapped: 0, existing: 0, newEntities: 0, possibleDuplicates: 0
    };
    const newOnes = [];
    const possibleDuplicates = [];
    const existing = [];
    const unmapped = [];

    for (const file of files) {
        const rel = path.relative(SOURCE, file).split(path.sep).join('/');
        if (NOT_AN_ENTITY.some((re) => re.test(rel))) { stats.skippedNav++; continue; }

        let entity;
        try {
            entity = extractEntity(file, rel, knownMythologies);
        } catch (err) {
            if (VERBOSE) console.warn(`  parse failed: ${rel} — ${err.message}`);
            continue;
        }
        if (!entity) { stats.skippedNav++; continue; }
        if (entity.isStub) { stats.skippedStub++; continue; }
        if (entity.isNavigation) { stats.skippedNav++; continue; }
        if (entity.textLength < 400) { stats.skippedThin++; continue; }
        if (!entity.collection) { stats.unmapped++; unmapped.push(rel); continue; }
        if (ONLY.length && !ONLY.includes(entity.collection)) continue;

        const index = live[entity.collection];
        const key = nameKey(entity.name);
        const hit = index ? index.get(key) : null;
        if (hit) {
            stats.existing++;
            existing.push({ ...entity, liveId: hit.id });
            continue;
        }

        // An exact-key miss is not proof the entity is absent. Legacy headings
        // carry qualifiers the database does not: "Hoodoo & Rootwork" here is
        // "hoodoo" live, so a strict comparison calls it new and a blind import
        // would publish a second copy. Anything where one name contains the other
        // is held back for a human rather than decided automatically.
        const near = [];
        if (index) {
            for (const [liveKey, row] of index) {
                if (!liveKey || liveKey.length < 4) continue;
                if (liveKey.includes(key) || key.includes(liveKey)) {
                    near.push({ liveId: row.id, liveName: row.name || row.id });
                    if (near.length >= 3) break;
                }
            }
        }

        // The category boundary is not where the database drew it. "Astrology"
        // is filed under magic_systems, not magic, so a lookup confined to the
        // mapped collection reports it as new and a second copy gets published
        // in the wrong place. An exact name match anywhere is a duplicate.
        if (!near.length) {
            for (const [otherCol, otherIndex] of Object.entries(live)) {
                if (otherCol === entity.collection) continue;
                const elsewhere = otherIndex.get(key);
                if (elsewhere) {
                    near.push({
                        liveId: elsewhere.id,
                        liveName: `${elsewhere.name || elsewhere.id} (in ${otherCol})`
                    });
                    break;
                }
            }
        }

        if (near.length) {
            stats.possibleDuplicates++;
            possibleDuplicates.push({
                name: entity.name, collection: entity.collection,
                sourceFile: entity.sourceFile, textLength: entity.textLength,
                candidates: near
            });
        } else {
            stats.newEntities++;
            newOnes.push(entity);
        }
    }

    // ---- report -----------------------------------------------------------
    console.log(`\nSource: ${SOURCE}`);
    console.log(`  html files scanned      ${String(stats.scanned).padStart(5)}`);
    console.log(`  skipped: navigation     ${String(stats.skippedNav).padStart(5)}`);
    console.log(`  skipped: stub pages     ${String(stats.skippedStub).padStart(5)}`);
    console.log(`  skipped: under 400 ch   ${String(stats.skippedThin).padStart(5)}`);
    console.log(`  skipped: unmapped dir   ${String(stats.unmapped).padStart(5)}`);
    console.log(`  ALREADY in Firestore    ${String(stats.existing).padStart(5)}`);
    console.log(`  needs review (near dup) ${String(stats.possibleDuplicates).padStart(5)}`);
    console.log(`  NEW candidates          ${String(stats.newEntities).padStart(5)}`);

    const byCollection = {};
    for (const e of newOnes) byCollection[e.collection] = (byCollection[e.collection] || 0) + 1;
    if (Object.keys(byCollection).length) {
        console.log('\nNew candidates by collection:');
        Object.entries(byCollection).sort((a, b) => b[1] - a[1])
            .forEach(([c, n]) => console.log(`  ${c.padEnd(16)} ${String(n).padStart(4)}`));
    }

    console.log('\nRichest new candidates:');
    newOnes.slice().sort((a, b) => b.textLength - a.textLength).slice(0, 12)
        .forEach((e) => console.log(`  ${String(e.textLength).padStart(6)}  ${e.collection.padEnd(12)} ${e.name}`));

    if (unmapped.length && VERBOSE) {
        console.log('\nUnmapped directories (add to CATEGORY_TO_COLLECTION if wanted):');
        [...new Set(unmapped.map((u) => u.split('/').slice(0, 2).join('/')))]
            .slice(0, 20).forEach((u) => console.log('  ' + u));
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const reportPath = path.join(OUT_DIR, 'port-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        generatedAt: new Date().toISOString(), source: SOURCE, stats,
        newEntities: newOnes, possibleDuplicates, existingEntities: existing.map((e) => ({
            name: e.name, collection: e.collection, liveId: e.liveId,
            sourceFile: e.sourceFile, textLength: e.textLength
        })),
        unmapped
    }, null, 2));
    console.log(`\nReport written: ${reportPath}`);

    if (EMIT) {
        // mythos2/ is a partial fork of mythos/ — the same pages exist in both,
        // so two candidates can land on one id. Writing them in sequence let the
        // second silently overwrite the first, and the only visible symptom was
        // an emitted-file count that quietly disagreed with the reported total.
        // Keep the longer page and say which was dropped.
        const byId = new Map();
        const collisions = [];
        for (const e of newOnes) {
            const doc = toFirestoreDoc(e);
            const key = `${e.collection}/${doc.id}`;
            const prev = byId.get(key);
            if (!prev) {
                byId.set(key, { doc, entity: e });
            } else if (e.textLength > prev.entity.textLength) {
                collisions.push(`${key}: kept ${e.sourceFile}, dropped ${prev.entity.sourceFile}`);
                byId.set(key, { doc, entity: e });
            } else {
                collisions.push(`${key}: kept ${prev.entity.sourceFile}, dropped ${e.sourceFile}`);
            }
        }

        let written = 0;
        for (const [key, { doc }] of byId) {
            const dir = path.join(OUT_DIR, key.split('/')[0]);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, `${doc.id}.json`), JSON.stringify(doc, null, 2));
            written++;
        }

        if (collisions.length) {
            console.log(`\nDuplicate ids resolved (${collisions.length}):`);
            collisions.forEach((c) => console.log('  ' + c));
        }
        console.log(`Emitted ${written} Firestore-shaped documents under ${OUT_DIR}`);
        console.log('Nothing was written to Firestore. Review these, then upload with the push tooling.');
    } else {
        console.log('Dry run — no documents emitted. Re-run with --emit to write them.');
    }
}

main();
