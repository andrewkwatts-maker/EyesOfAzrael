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
    const entities = [];

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
                entities.push(obj);
            });
        } catch (e) {
            console.warn(`  ⚠  Skipping ${name}/${file}: ${e.message}`);
        }
    }

    return entities;
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

    const generatedAt = new Date().toISOString();
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
