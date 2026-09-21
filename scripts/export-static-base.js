#!/usr/bin/env node
/**
 * Export static entity base for CDN-served JSON.
 *
 * Reads firebase-assets-downloaded/{collection}/*.json and writes:
 *   static/entities/manifest.json                — version hash, generatedAt, per-collection counts
 *   static/entities/{collection}/{facet}.json    — entities filtered to one facet value
 *   static/entities/{collection}/_all.json       — all entities in the collection
 *
 * The facet is the field a collection shards on. Mythology and esoteric shard on
 * `mythology`; history shards on `era` and conspiracy on `category`. Which is
 * which comes from js/config/domains.js, so this script and the browser agree by
 * construction rather than by both hardcoding the same string.
 *
 * Backlinks are computed here rather than queried at runtime. Entities link to
 * each other wiki-style via `relatedEntities`, and those links cross domains, so
 * "what links here" as a live query would mean an array-contains against every
 * collection in every domain on every page view. This script already walks every
 * entity, so it inverts the link graph once and ships the result.
 *
 * Usage:
 *   node scripts/export-static-base.js
 *   node scripts/export-static-base.js --out path/to/out
 *   node scripts/export-static-base.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOMAINS = require('../js/config/domains.js');

const ROOT     = path.join(__dirname, '..');
const ASSETS   = path.join(ROOT, 'firebase-assets-downloaded');
const DRY_RUN  = process.argv.includes('--dry-run');

const outArg = process.argv.indexOf('--out');
const OUT_DIR = outArg !== -1
    ? path.resolve(process.argv[outArg + 1])
    : path.join(ROOT, 'static', 'entities');

// Every collection across every domain. Collections with no directory under
// firebase-assets-downloaded are skipped, so listing a domain here before its
// data exists is harmless — history and conspiracy simply export nothing until
// their seeds are promoted.
const COLLECTIONS = DOMAINS.allCollections();

/**
 * The fields a browse card actually reads.
 *
 * `_all.json` exists to answer one question — "list this collection" — and the
 * browse grid then renders cards and slices to 500. For `concepts` that means
 * downloading 38.7 MB of full entities to draw 500 cards. Every field below is
 * one the browse view reads; projecting to them and nothing else takes concepts
 * to 9.0 MB, deities from 30.4 to 4.1 and creatures from 19.8 to 1.7.
 *
 * The list is deliberately generous. Values are copied whole, never truncated:
 * the grid's own search filters on `description`, so shortening it here would
 * quietly change which entities a reader can find. Cutting 77% with no
 * behavioural change is worth more than cutting 94% with one.
 *
 * A field the browse view starts reading must be added here, or it reads
 * undefined for every entity — `__tests__/services/static-base-cards.test.js`
 * pins the list against the view to make that a test failure rather than a
 * blank column.
 */
const CARD_FIELDS = [
    'id', 'name', 'type', 'category', '_collection',
    // Facet values across all four domains.
    'mythology', 'era',
    // Card body.
    'icon', 'description', 'summary', 'symbols',
    'domains', 'attributes', 'roles', 'altNames',
    // Badges and ownership.
    'isStandard', 'userId',
    // Sorting inputs.
    'views', 'likes', 'shares', 'createdAt', 'dateAdded',
    // Duplicate consolidation. The router reads `duplicateOf` to send an old id
    // to the record it was merged into, and the browse grid reads it to keep the
    // merged-away copies out of the listing. Both happen for every entity on
    // every page, so they have to come from the base — resolving them against
    // Firestore would put a document read back on the hot path the base exists
    // to keep off it.
    'duplicateOf', 'duplicateOfCollection', 'status',
    // The mythologies index draws its cards from the base too, and needs the
    // fields that make it a curated page rather than an alphabetical list:
    // `order` is the sequence someone chose, and without it every tradition
    // sorts by name and the page silently loses its arrangement.
    'order', 'displayName', 'color', 'featured',
];

/** Project one entity down to the card fields it actually needs. */
function toCard(entity) {
    const card = {};
    for (const field of CARD_FIELDS) {
        if (entity[field] !== undefined) card[field] = entity[field];
    }
    return card;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function readCollection(name) {
    const dir = path.join(ASSETS, name);
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'));

    // Keyed by id, because the same entity reaches this function more than once:
    // some snapshot files hold an array that repeats a record, and some records
    // are present both in their own file and inside someone else's array. Pushing
    // blindly put 442 repeated ids into the base — cosmology had 136 rows for 73
    // entities. Every count the site displayed was inflated by that margin and
    // listings rendered the same card twice.
    const byId = new Map();

    /** How much an entity actually carries, used to pick between two copies. */
    const weight = (obj) => Object.values(obj).filter(
        (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)
    ).length;

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(dir, file), 'utf8');
            const parsed = JSON.parse(raw);
            const fileBase = path.basename(file, '.json');

            // Some files contain an array of entities; expand them individually
            const items = Array.isArray(parsed) ? parsed : [parsed];
            items.forEach((obj, i) => {
                if (!obj || typeof obj !== 'object') return;
                if (!obj.id) obj.id = items.length === 1 ? fileBase : `${fileBase}_${i}`;

                const held = byId.get(obj.id);
                if (!held) {
                    byId.set(obj.id, { obj, file: fileBase, weight: weight(obj) });
                    return;
                }
                // Prefer the record in the file named after it — that is the
                // canonical one the rest of the pipeline writes to — and
                // otherwise the copy carrying more fields.
                const incoming = { obj, file: fileBase, weight: weight(obj) };
                const heldIsCanonical = held.file === obj.id;
                const incomingIsCanonical = fileBase === obj.id;
                if ((incomingIsCanonical && !heldIsCanonical) ||
                    (incomingIsCanonical === heldIsCanonical && incoming.weight > held.weight)) {
                    byId.set(obj.id, incoming);
                }
            });
        } catch (e) {
            console.warn(`  ⚠  Skipping ${name}/${file}: ${e.message}`);
        }
    }

    return [...byId.values()].map((entry) => entry.obj);
}

function ensureDir(dir) {
    if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
    if (DRY_RUN) return;
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
}

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 12);
}

/**
 * The facet value an entity is filed under, lowercased.
 *
 * Some documents carry a non-string facet — an array of traditions, or a map —
 * so coerce to the first array element, else 'other'.
 */
function facetValueOf(entity, facetField) {
    let raw = entity[facetField];
    if (Array.isArray(raw)) raw = raw[0];
    if (typeof raw !== 'string' || !raw.trim()) raw = 'other';
    return raw.toLowerCase().trim();
}

/**
 * Invert the link graph across every collection in every domain.
 *
 * `relatedEntities` is shaped { collectionName: [{ id, name, relationship }] },
 * which is already keyed by collection — and because history and conspiracy
 * collections are prefixed, collection names are globally unique. So a link to
 * `hist_figures` is unambiguous and needs no domain segment.
 *
 * @returns {{ backlinks: Map<string, object[]>, broken: object[] }}
 *   backlinks maps "collection/id" to the entities pointing at it.
 */
function buildBacklinks(byCollection) {
    const backlinks = new Map();
    const broken = [];

    // Which ids actually exist, so a link to a deleted entity is reported rather
    // than silently producing a backlink from nowhere.
    const known = new Map();
    for (const [collection, entities] of byCollection) {
        known.set(collection, new Set(entities.map(e => String(e.id))));
    }

    // id → collections holding it, case-insensitively. Used to tell a genuinely
    // dangling reference apart from one that names the wrong collection — a hero
    // referenced under `deities`, say. They look identical in a naive check but
    // are completely different problems: one is missing content, the other is a
    // one-line fix, and only the second can be repaired mechanically.
    const idIndex = new Map();
    for (const [collection, entities] of byCollection) {
        for (const e of entities) {
            const k = String(e.id).toLowerCase();
            if (!idIndex.has(k)) idIndex.set(k, new Set());
            idIndex.get(k).add(collection);
        }
    }

    /** Describe why a reference failed, as specifically as the data allows. */
    function diagnose(toCollection, toId) {
        const elsewhere = idIndex.get(String(toId).toLowerCase());
        if (elsewhere && elsewhere.size) {
            const found = Array.from(elsewhere).filter(c => c !== toCollection);
            if (found.length) {
                return {
                    reason: 'wrong collection',
                    foundIn: found,
                    suggestion: DOMAINS.makeRef(found[0], toId),
                };
            }
        }
        return { reason: 'no such entity' };
    }

    for (const [fromCollection, entities] of byCollection) {
        for (const entity of entities) {
            const related = entity.relatedEntities;
            if (!related || typeof related !== 'object' || Array.isArray(related)) continue;

            for (const [toCollection, refs] of Object.entries(related)) {
                if (!Array.isArray(refs)) continue;

                for (const ref of refs) {
                    const toId = ref && (typeof ref === 'string' ? ref : ref.id);
                    if (!toId) continue;

                    const targetIds = known.get(toCollection);
                    if (!targetIds || !targetIds.has(String(toId))) {
                        broken.push({
                            from: DOMAINS.makeRef(fromCollection, entity.id),
                            to: DOMAINS.makeRef(toCollection, toId),
                            ...diagnose(toCollection, toId),
                        });
                        continue;
                    }

                    const key = DOMAINS.makeRef(toCollection, toId);
                    const entry = {
                        ref: DOMAINS.makeRef(fromCollection, entity.id),
                        name: entity.name || String(entity.id),
                        collection: fromCollection,
                    };
                    const fromDomain = DOMAINS.domainForCollection(fromCollection);
                    if (fromDomain) entry.domain = fromDomain.id;
                    if (ref && ref.relationship) entry.relationship = ref.relationship;

                    if (!backlinks.has(key)) backlinks.set(key, []);
                    backlinks.get(key).push(entry);
                }
            }
        }
    }

    return { backlinks, broken };
}

// ── main ─────────────────────────────────────────────────────────────────────

function main() {
    console.log(DRY_RUN ? '\n📦 DRY RUN — no files written\n' : `\n📦 Exporting static entity base → ${OUT_DIR}\n`);

    // `generatedAt` is the epoch the delta layer measures against: the site
    // fetches Firestore documents with `updatedAt > generatedAt` and trusts the
    // base for everything older. So this timestamp must describe **when the
    // source content was captured**, not when this script happened to run.
    //
    // Those differ whenever the export runs over a `firebase-assets-downloaded/`
    // snapshot that was not refreshed first. Stamping "now" onto older content
    // tells the site there is nothing to fetch between the snapshot date and now,
    // and every live edit made in that window disappears — silently, and in the
    // direction that loses data rather than the direction that shows too much.
    //
    // `--generated-at <iso>` pins the epoch to when the snapshot was actually
    // taken. Preserving an older epoch is always safe: the worst case is
    // re-fetching a few documents the base already has, and the merge prefers the
    // Firestore copy anyway.
    const genArg = process.argv.indexOf('--generated-at');
    const pinnedEpoch = genArg !== -1 ? process.argv[genArg + 1] : null;
    if (pinnedEpoch && Number.isNaN(Date.parse(pinnedEpoch))) {
        console.error(`--generated-at "${pinnedEpoch}" is not a parsable date. Refusing to guess.`);
        process.exit(1);
    }
    const generatedAt = pinnedEpoch || new Date().toISOString();
    if (pinnedEpoch) {
        console.log(`  ⏱  Epoch pinned to ${pinnedEpoch} (source snapshot date, not now)\n`);
    }
    const manifest = { version: null, generatedAt, collections: {} };
    let hashInput = generatedAt;
    let totalEntities = 0;

    // Pass 1 — read everything, because backlinks need the whole graph before any
    // file can be written.
    const byCollection = new Map();
    for (const collection of COLLECTIONS) {
        const entities = readCollection(collection);
        if (entities.length === 0) {
            console.log(`  ⏭  ${collection}: not found, skipping`);
            continue;
        }
        byCollection.set(collection, entities);
    }

    // Pass 2 — invert the link graph across domains.
    const { backlinks, broken } = buildBacklinks(byCollection);
    console.log(`\n  🔗 ${backlinks.size} entities have inbound links` +
                (broken.length ? `, ${broken.length} broken reference(s)` : '') + '\n');

    // Pass 3 — attach backlinks, shard by facet, write.
    for (const [collection, entities] of byCollection) {
        const domain = DOMAINS.domainForCollection(collection);
        const facetField = DOMAINS.facetFieldFor(collection);

        for (const entity of entities) {
            const inbound = backlinks.get(DOMAINS.makeRef(collection, entity.id));
            if (inbound && inbound.length) entity._backlinks = inbound;
        }

        const byFacet = {};
        for (const entity of entities) {
            const value = facetValueOf(entity, facetField);
            (byFacet[value] = byFacet[value] || []).push(entity);
        }

        const facets = Object.keys(byFacet).sort();
        const collDir = path.join(OUT_DIR, collection);
        ensureDir(collDir);

        for (const facet of facets) {
            writeJson(path.join(collDir, `${facet}.json`), byFacet[facet]);
        }
        writeJson(path.join(collDir, '_all.json'), entities);

        // The card projection an unfiltered browse actually needs. `_all.json`
        // stays for anything wanting whole entities; the loader prefers this
        // when the manifest declares it, which is why the flag is written here
        // rather than assumed — a deployed base that predates this export has
        // no `_cards.json`, and a client must not request one that 404s.
        const cards = entities.map(toCard);
        const cardsJson = JSON.stringify(cards);
        writeJson(path.join(collDir, '_cards.json'), cards);

        // Inbound links, as their own file.
        //
        // The graph is built above and attached to `_all.json`, but the card
        // projection drops it — deliberately, since `_cards.json` is already
        // 3.9 MB for deities and is fetched to draw any listing. So the site
        // computed 26,000 backlinks across 10,628 entities and then had no way
        // to show a single one: an entity page reads cards, and cards have no
        // `_backlinks`.
        //
        // A separate per-collection file is the compromise. An entity page
        // fetches only its own collection's index (320 KB for deities, 126 KB
        // for creatures) and only when something asks for it, while listings
        // keep paying nothing for a field they never render.
        //
        // Shape is [name, collection, id] or [name, collection, id,
        // relationship] — positional to keep the file small, since the
        // property names would otherwise outweigh the values.
        const backlinkIndex = {};
        for (const entity of entities) {
            const inbound = entity._backlinks;
            if (!Array.isArray(inbound) || !inbound.length) continue;
            backlinkIndex[entity.id] = inbound.slice(0, 40).map((b) => {
                const id = String(b.ref || '').split('/').pop();
                return b.relationship
                    ? [b.name, b.collection, id, b.relationship]
                    : [b.name, b.collection, id];
            });
        }
        if (Object.keys(backlinkIndex).length) {
            ensureDir(path.join(OUT_DIR, '_backlinks'));
            writeJson(path.join(OUT_DIR, '_backlinks', `${collection}.json`), backlinkIndex);
        }

        const facetCounts = {};
        for (const facet of facets) facetCounts[facet] = byFacet[facet].length;

        manifest.collections[collection] = {
            total: entities.length,
            domain: domain ? domain.id : null,
            facetField,
            facets,
            facetCounts,
            cards: true,
            cardBytes: cardsJson.length,
            // Legacy keys, kept so a browser running the previously deployed
            // bundle against a newly generated manifest still resolves shards.
            // Remove once no cached client predates the domain registry.
            mythologies: facets,
            mythologyCounts: facetCounts,
        };

        hashInput += `|${collection}:${entities.length}`;
        totalEntities += entities.length;

        const summary = facets.length > 6
            ? `${facets.slice(0, 6).join(', ')}, … (${facets.length} total)`
            : facets.join(', ');
        console.log(`  ✓  ${collection} [${domain ? domain.id : 'unregistered'}/${facetField}]: ` +
                    `${entities.length} entities (${summary})`);
    }

    manifest.version = sha256(hashInput);

    ensureDir(OUT_DIR);
    writeJson(path.join(OUT_DIR, 'manifest.json'), manifest);

    // One lean index for search, and a short list for the landing page.
    //
    // Search was downloading every collection's _cards.json — 20.5 MB across
    // 32 requests, and twice over, because the loader's memory cache holds four
    // collections and search touches eight. The landing page was fetching four
    // whole collections, 8.5 MB, to show eight cards in two decorative strips.
    //
    // Cards carry the fields needed to DRAW a card. Search needs the fields
    // needed to MATCH and list one, which is a fifth of the bytes: dropping the
    // long description, icons, symbols, domains and sort inputs takes the whole
    // corpus to 2.3 MB in a single file. Rows are positional for the same
    // reason topics.json uses tuples — at 13,632 rows the property names would
    // outweigh the values.
    const searchRows = [];
    const featured = {};
    const recent = {};
    for (const [collection, entities] of byCollection) {
        const live = entities.filter((e) => e && e.id && !e.duplicateOf);

        for (const e of live) {
            searchRows.push([
                e.id,
                e.name || e.id,
                e.type || collection,
                collection,
                String(e.mythology || e.era || '').toLowerCase(),
                String(e.shortDescription || e.description || '').replace(/\s+/g, ' ').slice(0, 110)
            ]);
        }

        // The landing strips want a handful of well-formed entries each. Taking
        // them here means the page fetches one small file instead of pulling
        // whole collections and throwing away 99.9% of each.
        const pick = live
            .filter((e) => e.name && (e.icon || e.shortDescription || e.description))
            .slice(0, 8)
            .map((e) => ({
                id: e.id,
                name: e.name,
                collection,
                icon: e.icon || null,
                mythology: e.mythology || null,
                description: String(e.shortDescription || e.description || '').replace(/\s+/g, ' ').slice(0, 140)
            }));
        if (pick.length) featured[collection] = pick;

        // And the newest few, for the "recently added" strip.
        //
        // Sorting by date needs the whole collection, which is exactly why that
        // strip kept downloading one: four collections, 8.5 MB, to show eight
        // cards. Doing the sort here once means the page does not have to.
        const dated = live
            .filter((e) => e.dateAdded || e.createdAt)
            .sort((a, b) => new Date(b.dateAdded || b.createdAt) - new Date(a.dateAdded || a.createdAt))
            .slice(0, 8)
            .map((e) => ({
                id: e.id,
                name: e.name,
                collection,
                icon: e.icon || null,
                mythology: e.mythology || null,
                dateAdded: e.dateAdded || e.createdAt || null,
                description: String(e.shortDescription || e.description || '').replace(/\s+/g, ' ').slice(0, 140)
            }));
        if (dated.length) recent[collection] = dated;
    }

    writeJson(path.join(OUT_DIR, 'search-index.json'), {
        generatedAt,
        fields: ['id', 'name', 'type', 'collection', 'facet', 'blurb'],
        rows: searchRows
    });
    writeJson(path.join(OUT_DIR, 'featured.json'), { generatedAt, byCollection: featured, recentByCollection: recent });

    const searchKb = Math.round(fs.statSync(path.join(OUT_DIR, 'search-index.json')).size / 1024);
    const featuredKb = Math.round(fs.statSync(path.join(OUT_DIR, 'featured.json')).size / 1024);
    console.log(`\n  🔎 search-index.json ${searchRows.length.toLocaleString()} rows (${searchKb} KB), featured.json (${featuredKb} KB)`);

    if (broken.length) {
        // Written rather than only logged: with four domains cross-linking, this
        // list is the only way to find a reference that points nowhere.
        writeJson(path.join(OUT_DIR, '_broken-links.json'), broken);

        const wrongCollection = broken.filter(b => b.reason === 'wrong collection');
        const missing = broken.filter(b => b.reason !== 'wrong collection');

        console.log(`\n  ⚠  ${broken.length} broken reference(s) → _broken-links.json`);
        console.log(`       ${wrongCollection.length} name an existing entity in the wrong collection (mechanically fixable)`);
        console.log(`       ${missing.length} point at nothing (missing content)`);
        for (const b of wrongCollection.slice(0, 3)) {
            console.log(`       ${b.from} → ${b.to} — did you mean ${b.suggestion}?`);
        }
        for (const b of missing.slice(0, 3)) {
            console.log(`       ${b.from} → ${b.to} (${b.reason})`);
        }
    }

    const collectionCount = Object.keys(manifest.collections).length;
    const domainsSeen = new Set(
        Object.values(manifest.collections).map(c => c.domain).filter(Boolean)
    );

    console.log(`\n✅ Done`);
    console.log(`   Version    : ${manifest.version}`);
    console.log(`   GeneratedAt: ${manifest.generatedAt}`);
    console.log(`   Domains    : ${domainsSeen.size} (${Array.from(domainsSeen).join(', ')})`);
    console.log(`   Collections: ${collectionCount}`);
    console.log(`   Entities   : ${totalEntities}`);
    console.log(`   Backlinked : ${backlinks.size}`);
    if (DRY_RUN) console.log('\n   (dry run — nothing written)');
    console.log();
}

if (require.main === module) {
    main();
}

// Exported so the broken-reference fixer analyses the link graph with *this*
// code rather than a second implementation of "what counts as broken". Two
// implementations would drift, and the fixer would then repair references the
// export still reports, or miss ones it does not.
module.exports = {
    readCollection,
    buildBacklinks,
    facetValueOf,
    toCard,
    CARD_FIELDS,
    COLLECTIONS,
    ASSETS,
};
