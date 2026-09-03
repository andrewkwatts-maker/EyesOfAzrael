#!/usr/bin/env node
/**
 * Repair references that name an existing entity under the wrong collection.
 *
 * `scripts/export-static-base.js` walks every entity's `relatedEntities` map and
 * reports each reference that resolves to nothing. Those failures split into two
 * completely different problems that look identical in a naive check:
 *
 *   - **wrong collection** — the entity exists, filed somewhere else. A hero
 *     referenced under `deities`, say. One field is wrong; the content is there.
 *   - **no such entity** — nothing anywhere has that id. This is missing content
 *     and no script can invent it.
 *
 * Only the first is repairable mechanically, and only some of it. This script
 * applies that subset to the source JSON under `firebase-assets-downloaded/` and
 * reports everything it declined to touch, with the reason.
 *
 * ── What counts as mechanically safe ────────────────────────────────────────
 *
 * A reference is rewritten only when all three hold:
 *
 *   1. **Exactly one candidate collection** holds that id. Two or three
 *      candidates means picking one is a guess, and a guess that silently
 *      rewrites content is worse than a reported break — the report at least
 *      tells a human where to look.
 *   2. **The id exists there with identical case.** The export's diagnosis
 *      indexes ids case-insensitively so it can spot a near-miss, but writing
 *      back a differently-cased id produces a reference that is still broken —
 *      it would just stop being reported, which is the worst outcome available.
 *   3. **The destination is a collection the domain registry knows.** Moving a
 *      reference into a collection nothing serves trades one broken link for
 *      another.
 *
 * Everything else is reported, not touched.
 *
 * ── What this deliberately does not do ──────────────────────────────────────
 *
 * It does not write to Firestore. The fixes land in local source JSON and reach
 * the site only when the static base is re-exported and pushed, which is a
 * separate, reviewable step.
 *
 * Usage:
 *   node scripts/fix-broken-references.js              # dry run (default)
 *   node scripts/fix-broken-references.js --apply      # write the files
 *   node scripts/fix-broken-references.js --report path/to/report.json
 */

const fs = require('fs');
const path = require('path');

const DOMAINS = require('../js/config/domains.js');
const { readCollection, buildBacklinks, COLLECTIONS, ASSETS } = require('./export-static-base.js');

const APPLY = process.argv.includes('--apply');

const reportArg = process.argv.indexOf('--report');
const REPORT_PATH = reportArg !== -1
    ? path.resolve(process.argv[reportArg + 1])
    : path.join(__dirname, 'reports', 'broken-reference-fixes.json');

// ── analysis ─────────────────────────────────────────────────────────────────

/**
 * Read every collection that has data on disk.
 * @returns {Map<string, object[]>}
 */
function loadAll() {
    const byCollection = new Map();
    for (const collection of COLLECTIONS) {
        const entities = readCollection(collection);
        if (entities.length) byCollection.set(collection, entities);
    }
    return byCollection;
}

/**
 * Decide, for every distinct broken target, whether it can be repaired.
 *
 * Keyed by the *target* reference rather than by the referencing entity: the
 * repair depends only on where the target actually lives, so one decision
 * serves every entity that points at it.
 *
 * @returns {{ fixes: Map<string, string>, declined: object[] }}
 *   fixes maps a broken "collection/id" to the ref it should become.
 */
function planFixes(broken, byCollection) {
    // Exact ids per collection, so a case-only near-miss is caught rather than
    // written back as a still-broken reference.
    const exactIds = new Map();
    for (const [collection, entities] of byCollection) {
        exactIds.set(collection, new Set(entities.map(e => String(e.id))));
    }

    const fixes = new Map();
    const declined = new Map();
    const referrers = new Map();

    for (const item of broken) {
        const key = item.to;
        if (!referrers.has(key)) referrers.set(key, new Set());
        referrers.get(key).add(item.from);

        if (fixes.has(key) || declined.has(key)) continue;

        const decline = (reason, extra = {}) =>
            declined.set(key, { to: key, reason, ...extra });

        if (item.reason !== 'wrong collection') {
            decline('no such entity');
            continue;
        }

        const candidates = item.foundIn || [];
        if (candidates.length !== 1) {
            decline('ambiguous target', { foundIn: candidates });
            continue;
        }

        const target = candidates[0];
        const parsed = DOMAINS.parseRef(key);
        const id = parsed ? parsed.id : null;

        if (!id) {
            decline('unparseable reference');
            continue;
        }

        if (!exactIds.has(target) || !exactIds.get(target).has(id)) {
            // The id matched case-insensitively during diagnosis but not
            // exactly. Rewriting it would stop the report without fixing the
            // link.
            decline('case mismatch in target id', { foundIn: candidates });
            continue;
        }

        if (!DOMAINS.domainForCollection(target)) {
            decline('target collection not in the domain registry', { foundIn: candidates });
            continue;
        }

        fixes.set(key, DOMAINS.makeRef(target, id));
    }

    // Attach who pointed at each declined target, so the report says where to look.
    const declinedList = Array.from(declined.values()).map(d => ({
        ...d,
        referencedBy: Array.from(referrers.get(d.to) || []).sort().slice(0, 10),
        referenceCount: (referrers.get(d.to) || new Set()).size,
    }));

    return { fixes, declined: declinedList, referrers };
}

// ── rewriting ────────────────────────────────────────────────────────────────

/**
 * Apply the planned moves to one entity object, in place.
 *
 * `relatedEntities` is `{ collectionName: [ref, ...] }` where a ref is a bare id
 * string or `{ id, name, relationship }`. A move takes the ref out of the wrong
 * collection's array and puts it under the right one, preserving whatever
 * metadata the ref carried.
 *
 * @returns {object[]} the moves made, for the report
 */
function rewriteEntity(entity, fixes) {
    const related = entity && entity.relatedEntities;
    if (!related || typeof related !== 'object' || Array.isArray(related)) return [];

    const moves = [];

    for (const [collection, refs] of Object.entries(related)) {
        if (!Array.isArray(refs)) continue;

        const keep = [];
        for (const ref of refs) {
            const id = typeof ref === 'string' ? ref : (ref && ref.id);
            if (!id) { keep.push(ref); continue; }

            const from = DOMAINS.makeRef(collection, id);
            const to = fixes.get(from);
            if (!to) { keep.push(ref); continue; }

            const parsed = DOMAINS.parseRef(to);
            const destination = parsed.collection;

            if (!Array.isArray(related[destination])) related[destination] = [];

            // The destination may already carry this id — merging blindly would
            // duplicate the link. Dropping it from the wrong collection is still
            // the right repair.
            const alreadyThere = related[destination].some(existing => {
                const existingId = typeof existing === 'string' ? existing : (existing && existing.id);
                return existingId === parsed.id;
            });

            if (!alreadyThere) related[destination].push(ref);
            moves.push({ from, to, duplicate: alreadyThere });
        }

        if (keep.length !== refs.length) related[collection] = keep;
    }

    // An array emptied by the moves is noise in the data; drop the key.
    for (const [collection, refs] of Object.entries(related)) {
        if (Array.isArray(refs) && refs.length === 0) delete related[collection];
    }

    return moves;
}

/**
 * Walk the source files and rewrite the ones carrying a repairable reference.
 *
 * Files are read and written individually rather than reconstructed from the
 * in-memory entities, because `readCollection` synthesises an `id` for files
 * that lack one and expands arrays — writing that back would change documents
 * this script was never asked to touch.
 */
function rewriteFiles(fixes) {
    const changedFiles = [];
    let totalMoves = 0;

    for (const collection of COLLECTIONS) {
        const dir = path.join(ASSETS, collection);
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.json') && !f.startsWith('_'));

        for (const file of files) {
            const filePath = path.join(dir, file);
            let parsed;
            let raw;
            try {
                raw = fs.readFileSync(filePath, 'utf8');
                parsed = JSON.parse(raw);
            } catch (e) {
                console.warn(`  ⚠  Skipping ${collection}/${file}: ${e.message}`);
                continue;
            }

            const items = Array.isArray(parsed) ? parsed : [parsed];
            const moves = [];
            for (const item of items) {
                if (item && typeof item === 'object') moves.push(...rewriteEntity(item, fixes));
            }

            if (!moves.length) continue;

            totalMoves += moves.length;
            changedFiles.push({ file: `${collection}/${file}`, moves });

            if (APPLY) {
                // 2-space indent with a trailing newline matches the existing
                // files, so the diff shows only the references that moved.
                fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
            }
        }
    }

    return { changedFiles, totalMoves };
}

// ── main ─────────────────────────────────────────────────────────────────────

function main() {
    console.log(APPLY
        ? '\n🔧 Repairing broken references in firebase-assets-downloaded/\n'
        : '\n🔍 DRY RUN — no files written (pass --apply to write)\n');

    const byCollection = loadAll();
    const { broken } = buildBacklinks(byCollection);

    const distinct = new Set(broken.map(b => b.to)).size;
    console.log(`  ${broken.length} broken reference(s) across ${distinct} distinct target(s)\n`);

    const { fixes, declined } = planFixes(broken, byCollection);
    const { changedFiles, totalMoves } = rewriteFiles(fixes);

    const byReason = {};
    for (const d of declined) byReason[d.reason] = (byReason[d.reason] || 0) + 1;

    console.log(`  ✓  repairable targets : ${fixes.size}`);
    console.log(`     references moved   : ${totalMoves} across ${changedFiles.length} file(s)`);
    console.log(`  ⏭  left alone         : ${declined.length} target(s)`);
    for (const [reason, count] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
        console.log(`       ${String(count).padStart(5)}  ${reason}`);
    }

    const report = {
        generatedAt: new Date().toISOString(),
        applied: APPLY,
        totals: {
            brokenReferences: broken.length,
            distinctTargets: distinct,
            repairableTargets: fixes.size,
            referencesMoved: totalMoves,
            filesChanged: changedFiles.length,
            declinedTargets: declined.length,
        },
        declinedByReason: byReason,
        fixes: Array.from(fixes.entries()).map(([from, to]) => ({ from, to })),
        declined,
        changedFiles,
    };

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
    console.log(`\n  📄 ${path.relative(path.join(__dirname, '..'), REPORT_PATH)}`);

    if (!APPLY) console.log('\n  (dry run — re-run with --apply to write)');
    console.log();
}

if (require.main === module) {
    main();
}

module.exports = { planFixes, rewriteEntity };
