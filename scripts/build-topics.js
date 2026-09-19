#!/usr/bin/env node

/**
 * Build the topic tier that sits between a category and an entity.
 *
 * THE PROBLEM
 *
 * #/mythology/greek/deities says "Showing 24 of 257 deities" and sorts them
 * alphabetically. Every entry a visitor can see is an A-name: Aceso, Achelous,
 * Aeolus, Asopus. Zeus is ten "load more" clicks away and there is no way to
 * ask for him except search. The same is true of every listing on the site, so
 * a 14,000-entity encyclopedia reads as a few hundred entities beginning with A.
 *
 * Alphabetical order is the problem. It is an index, not a way in - useful when
 * you already know the name you want, useless for finding out what is here.
 *
 * WHAT THIS BUILDS
 *
 * Two things, both static, both costing no document reads:
 *
 * 1. Topics - curated cross-tradition themes ("Gods of War", "Shapeshifters")
 *    from data/topics/taxonomy.json. An entity can sit in several, so there is
 *    more than one route to any page: by tradition, by category, or by theme.
 *
 * 2. Prominence - an ordering that puts Zeus above Aceso. Alphabetical is
 *    replaced as the default; it stays available as an explicit choice.
 *
 * PROMINENCE, AND THE TRAP IN IT
 *
 * `popularity` is set on 166 of 2,583 deities, too sparse to sort by. What is
 * dense is `_backlinks` - 77% - and it ranks sensibly on inspection: Zeus 64,
 * Odin 62, Poseidon 44.
 *
 * The trap is that backlinks point at whichever id the *linking* page used, and
 * 901 ids have since been merged away. `zeus` holds 64 backlinks and is a
 * duplicate of `greek_deity_zeus`, which holds 30. Ranking on raw counts puts
 * the survivor below its own merged-away copy and drops the best-known god in
 * Greek myth into the middle of the list. Backlinks are therefore folded into
 * survivors before anything is sorted.
 *
 * MATCHING
 *
 * Whole words and phrases only, never substrings. An earlier pass on this data
 * matched "Jesus Christ (Yeshua Ha-Mashiach)" to a topic on the strength of
 * `ashi` inside `Mashiach`. Word-boundary matching is what stops that.
 *
 * USAGE
 *   node scripts/build-topics.js            # writes static/topics.json
 *   node scripts/build-topics.js --report   # coverage only, writes nothing
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'static', 'entities');
const TAXONOMY = path.join(ROOT, 'data', 'topics', 'taxonomy.json');
const REGIONS = path.join(ROOT, 'data', 'topics', 'regions.json');
const OUT = path.join(ROOT, 'static', 'topics.json');

const REPORT_ONLY = process.argv.includes('--report');

/**
 * How many members to record per topic.
 *
 * Only ids are stored, not copies of the records - the static base is already
 * loaded and holds every field the cards need, so duplicating them here would
 * have made this file megabytes for no new information. Ids are cheap enough
 * that a topic can carry its whole membership and let the view page through it.
 */
const TOPIC_MEMBER_CAP = 400;

/**
 * Names that are not entity names.
 *
 * The collection still holds records whose name is a scraped page title
 * ("Lord of the Afterlife | Egyptian Mythology") or a category heading
 * ("Minor Traditions Deities"), and they carry backlinks, so without this they
 * rank near the top of the very lists this script exists to improve. They are
 * kept out of prominence and topics but not deleted - that is a data repair
 * needing a person, tracked in data/legacy-port/suspect-names.json.
 */
function isNotAName(name) {
    const n = String(name || '').trim();
    if (!n) return true;
    if (n.includes('|')) return true;                       // page title residue
    if (n.length > 60) return true;                         // a sentence, not a name
    if (/\b(deities|gods|goddesses|creatures|heroes|traditions|figures|pantheon)$/i.test(n)) return true;
    if ((n.match(/,/g) || []).length >= 2) return true;     // a list of subjects
    // "Greek Mythology", "Hindu Folklore" - the tradition itself, filed as one
    // of its own members. These carry backlinks, so they rank high and were
    // turning up among the dragons.
    if (/\b(mythology|myth|folklore|religion|tradition|pantheon|legends)$/i.test(n)) return true;
    // Redirect stubs left by an older merge, e.g. "Redirecting to Vishnu".
    if (/^(redirect|see also|see )/i.test(n)) return true;
    return false;
}

/**
 * Collapse records that are plainly the same subject.
 *
 * Three separate "Ishtar" records under babylonian survive here because none is
 * marked `duplicateOf` - the merge pass found 901 pairs but not these. Listing
 * them one after another makes a curated topic look broken, so the highest
 * ranked wins the slot.
 *
 * This is a display rule, not a data repair: the other records keep their pages
 * and stay reachable. Merging them properly needs the same judgment the 901 did.
 */
function dedupeBySubject(refs) {
    const seen = new Map();
    for (const ref of refs) {
        const key = `${ref.n}::${ref.m || ''}`;
        const held = seen.get(key);
        if (!held || (ref.s || 0) > (held.s || 0)) seen.set(key, ref);
    }
    return [...seen.values()];
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadCollection(collection) {
    const file = path.join(BASE, collection, '_all.json');
    if (!fs.existsSync(file)) return [];
    const raw = readJson(file);
    const rows = Array.isArray(raw) ? raw : Object.values(raw);
    return rows.filter((r) => r && typeof r === 'object' && r.id);
}

/**
 * Flatten whatever a field holds into lowercase text to search.
 *
 * These fields are inconsistent across 14,000 records imported from several
 * sources: `domains` may be an array, a comma-separated string, or an object
 * of labelled values. All three appear in the live data.
 */
function textOf(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.toLowerCase();
    if (Array.isArray(value)) return value.map(textOf).join(' ; ');
    if (typeof value === 'object') return Object.values(value).map(textOf).join(' ; ');
    return String(value).toLowerCase();
}

/** Regex cache - a few dozen topics x a few thousand entities is a lot of compiles. */
const patternCache = new Map();

function patternFor(term) {
    if (!patternCache.has(term)) {
        const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Bounded on both sides so "war" cannot match "warmth" or "steward".
        patternCache.set(term, new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i'));
    }
    return patternCache.get(term);
}

function matchesTopic(haystack, topic) {
    if (topic.exclude && topic.exclude.some((t) => patternFor(t).test(haystack))) return false;
    return topic.match.some((t) => patternFor(t).test(haystack));
}

/**
 * Fold every duplicate's backlinks into the record that survived the merge.
 *
 * Without this the merged-away id keeps the reputation and the survivor looks
 * obscure. See the header note about Zeus.
 */
function buildProminence(rows) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const score = new Map();

    const canonical = (id, seen = new Set()) => {
        // Chains exist (a -> b -> c); the guard stops a cycle in bad data from
        // hanging the build.
        if (seen.has(id)) return id;
        seen.add(id);
        const row = byId.get(id);
        if (row && row.duplicateOf && byId.has(row.duplicateOf)) {
            return canonical(row.duplicateOf, seen);
        }
        return id;
    };

    for (const row of rows) {
        const target = canonical(row.id);
        const backlinks = Array.isArray(row._backlinks) ? row._backlinks.length : 0;
        const popularity = typeof row.popularity === 'number' ? row.popularity : 0;
        // Backlinks dominate because they are dense and earned by being
        // referenced; popularity is a sparse hand-set field, so it breaks ties
        // rather than driving the order.
        const points = backlinks + popularity / 20;
        score.set(target, (score.get(target) || 0) + points);
    }

    return score;
}

/**
 * A member reference: enough to sort and de-duplicate, nothing the base already
 * holds. The view resolves the id against the loaded collection for everything
 * it renders.
 */
function refOf(row, score) {
    return {
        id: row.id,
        m: String(row.mythology || '').toLowerCase() || null,
        s: Math.round((score.get(row.id) || 0) * 10) / 10,
        n: String(row.name || '').trim().toLowerCase()
    };
}

/** `native american` and `native_american` are the same tradition. */
function traditionKey(value) {
    return String(value || '').toLowerCase().trim().replace(/[\s_-]+/g, ' ');
}

/**
 * Group traditions into regions, and count what each one actually holds.
 *
 * Every entity in the base is counted, not just the five collections with a
 * topic taxonomy, because a region page should report the whole tradition - a
 * reader picking "Egypt & the Nile" wants its myths and texts too, not only its
 * gods.
 */
function buildRegions(spec) {
    const perTradition = new Map();

    for (const collection of fs.readdirSync(BASE)) {
        const file = path.join(BASE, collection, '_all.json');
        if (!fs.existsSync(file)) continue;
        const raw = readJson(file);
        for (const row of (Array.isArray(raw) ? raw : Object.values(raw))) {
            if (!row || typeof row !== 'object' || row.duplicateOf) continue;
            if (!row.mythology || isNotAName(row.name)) continue;
            const key = traditionKey(row.mythology);
            if (!perTradition.has(key)) perTradition.set(key, { key, label: String(row.mythology), total: 0, collections: {} });
            const entry = perTradition.get(key);
            entry.total++;
            entry.collections[collection] = (entry.collections[collection] || 0) + 1;
        }
    }

    const excluded = new Set(spec.notTraditions.map(traditionKey));
    const claimed = new Set();
    const regions = [];

    for (const region of spec.regions) {
        const members = region.members.map(traditionKey);
        const found = [];
        for (const key of members) {
            const entry = perTradition.get(key);
            if (!entry || excluded.has(key)) continue;
            claimed.add(key);
            found.push({ id: entry.label.toLowerCase(), key, name: entry.label, total: entry.total });
        }
        found.sort((a, b) => b.total - a.total);
        regions.push({
            slug: region.slug,
            name: region.name,
            icon: region.icon,
            blurb: region.blurb,
            traditions: found,
            total: found.reduce((sum, t) => sum + t.total, 0)
        });
    }

    // Everything real that no region claimed. Shown as its own group rather than
    // dropped, because a tradition with four entities is still a tradition and
    // silently losing it would be worse than listing it.
    const leftovers = [...perTradition.values()]
        .filter((t) => !claimed.has(t.key) && !excluded.has(t.key))
        .sort((a, b) => b.total - a.total);

    const skipped = [...perTradition.values()]
        .filter((t) => excluded.has(t.key))
        .sort((a, b) => b.total - a.total);

    regions.sort((a, b) => b.total - a.total);
    return { regions, leftovers, skipped, traditionCount: perTradition.size };
}

function main() {
    if (!fs.existsSync(TAXONOMY)) {
        console.error(`No taxonomy at ${TAXONOMY}`);
        process.exit(1);
    }
    const taxonomy = readJson(TAXONOMY);

    const regionSpec = readJson(REGIONS);
    const { regions, leftovers, skipped, traditionCount } = buildRegions(regionSpec);

    const out = {
        generatedAt: new Date().toISOString(),
        collections: {},
        topics: {},
        prominent: {},
        regions,
        otherTraditions: leftovers.map((t) => ({ id: t.label.toLowerCase(), name: t.label, total: t.total }))
    };

    console.log(`  regions    ${regions.length} regions over ${traditionCount} distinct tradition values`);
    console.log(`             ${regions.slice(0, 4).map((r) => `${r.name} (${r.total})`).join(', ')}`);
    console.log(`             ${leftovers.length} unassigned traditions, ${skipped.length} values held back as not-a-tradition`);
    if (skipped.length) {
        console.log(`             held back: ${skipped.slice(0, 8).map((t) => `${t.label}(${t.total})`).join(', ')}`);
    }
    console.log('');

    let totalTopics = 0;
    let totalAssignments = 0;

    for (const [collection, spec] of Object.entries(taxonomy.collections)) {
        const rows = loadCollection(collection);
        if (!rows.length) {
            console.log(`  ${collection}: no base file, skipped`);
            continue;
        }

        const score = buildProminence(rows);

        // Duplicates redirect, so listing them would send a visitor to a page
        // they did not ask for. Mis-named records are held back for the reason
        // in isNotAName.
        const live = rows.filter((r) => !r.duplicateOf && !isNotAName(r.name));

        const searchText = new Map(
            live.map((r) => [r.id, spec.fields.map((f) => textOf(r[f])).join(' ; ')])
        );

        const topicRows = [];
        for (const topic of spec.topics) {
            const members = live.filter((r) => matchesTopic(searchText.get(r.id), topic));
            members.sort((a, b) => (score.get(b.id) || 0) - (score.get(a.id) || 0)
                || String(a.name).localeCompare(String(b.name)));

            // Which traditions this topic actually spans, busiest first. This is
            // what makes the tradition x topic cross-section navigable without a
            // second pass over the data at read time.
            const byMythology = {};
            for (const m of members) {
                const key = String(m.mythology || 'unknown').toLowerCase();
                byMythology[key] = (byMythology[key] || 0) + 1;
            }

            topicRows.push({
                slug: topic.slug,
                name: topic.name,
                icon: topic.icon,
                blurb: topic.blurb,
                collection,
                total: members.length,
                traditions: Object.entries(byMythology)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([id, n]) => ({ id, count: n })),
                // [id, tradition, score] rather than objects: this is the bulk of
                // the file and the shorthand roughly halves it.
                members: dedupeBySubject(members.map((r) => refOf(r, score)))
                    .slice(0, TOPIC_MEMBER_CAP)
                    .map((r) => [r.id, r.m, r.s])
            });
            totalAssignments += members.length;
        }

        topicRows.sort((a, b) => b.total - a.total);
        out.topics[collection] = topicRows;
        totalTopics += topicRows.length;

        // Prominence as a plain id -> score map. The listing views already hold
        // the collection's cards in memory, so they need the ordering, not a
        // second copy of the records: storing one list of cards per tradition
        // per collection had made this file 2.3 MB on its own.
        const scores = {};
        for (const row of live) {
            const value = score.get(row.id) || 0;
            if (value > 0) scores[row.id] = Math.round(value * 10) / 10;
        }
        out.prominent[collection] = scores;

        // The ids a listing should hide because a better record says the same
        // thing - same name, same tradition, lower score. Sent as a list so the
        // views do not each re-derive it.
        const ranked = [...live].sort((a, b) => (score.get(b.id) || 0) - (score.get(a.id) || 0));
        const kept = new Set(dedupeBySubject(ranked.map((r) => refOf(r, score))).map((r) => r.id));
        out.shadowed = out.shadowed || {};
        out.shadowed[collection] = live.filter((r) => !kept.has(r.id)).map((r) => r.id);

        out.collections[collection] = {
            label: spec.label,
            total: kept.size,
            topics: topicRows.length
        };

        const uncovered = live.filter((r) => !topicRows.some((t) => t.members.some((e) => e[0] === r.id)
            || matchesTopic(searchText.get(r.id), spec.topics.find((s) => s.slug === t.slug))));
        const pct = Math.round(((live.length - uncovered.length) / live.length) * 100);
        console.log(`  ${collection.padEnd(10)} ${String(live.length).padStart(5)} live  ${String(topicRows.length).padStart(2)} topics  ${String(pct).padStart(3)}% in at least one`);
        console.log(`             top: ${topicRows.slice(0, 4).map((t) => `${t.name} (${t.total})`).join(', ')}`);
    }

    if (REPORT_ONLY) {
        console.log('\n--report: nothing written.');
        return;
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(out));
    const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
    console.log(`\n${totalTopics} topics, ${totalAssignments} assignments -> ${OUT} (${kb} KB)`);
}

main();
