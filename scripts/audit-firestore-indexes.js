#!/usr/bin/env node
/**
 * Firestore composite-index audit.
 *
 * `firebase deploy --only firestore:indexes` reported 70 composite indexes
 * present in the project but absent from firestore.indexes.json. Deploying
 * with --force would delete all 70, and nobody has established that they are
 * unused — so the question to answer first is which indexes the code actually
 * needs, and that question is answerable from the repository alone.
 *
 * This script reads every `.collection(...)` / `.collectionGroup(...)` query
 * chain in `js/` and derives the composite index each one requires, then
 * compares that set against firestore.indexes.json. It reports:
 *
 *   REQUIRED-BUT-UNDECLARED  a live query with no index. In the delta path a
 *                            `failed-precondition` is deliberately swallowed
 *                            (asset-service.js), so these degrade silently.
 *   DECLARED-BUT-UNUSED      an index no query in this repo needs. A candidate
 *                            for removal — but only a candidate: queries also
 *                            come from the Python packages, from scripts/, and
 *                            from the Firebase console.
 *
 * Firestore builds single-field indexes automatically, so a composite index is
 * required only when a query constrains more than one distinct field:
 * two or more equality filters, or an equality filter plus an orderBy on a
 * different field, or a range/inequality combined with either.
 *
 * Usage:  node scripts/audit-firestore-indexes.js [--json]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['js'];
const INDEX_FILE = path.join(ROOT, 'firestore.indexes.json');

/** Operators that produce a range scan; these must sort last in an index. */
const RANGE_OPS = new Set(['<', '<=', '>', '>=', '!=', 'not-in']);
/** Operators that fan out rather than narrow; they still occupy a field slot. */
const ARRAY_OPS = new Set(['array-contains', 'array-contains-any']);

function listSourceFiles() {
    const out = [];
    for (const dir of SOURCE_DIRS) {
        (function walk(d) {
            if (!fs.existsSync(d)) return;
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) {
                    if (['vendor', 'lib', 'node_modules'].includes(e.name)) continue;
                    walk(p);
                } else if (e.name.endsWith('.js') && !e.name.endsWith('.min.js')) {
                    out.push(path.relative(ROOT, p));
                }
            }
        })(path.join(ROOT, dir));
    }
    return out;
}

/** Strip quotes from a literal, or return null for a non-literal expression. */
function literal(text) {
    const m = /^\s*([`'"])(.*?)\1\s*$/.exec(text);
    return m ? m[2] : null;
}

/**
 * Extract the query chains in one file.
 * Returns { collection, group, fields: [{path, op, order}], file, line }.
 */
function extractQueries(file) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const queries = [];
    const re = /\.(collection|collectionGroup)\(\s*([^)]*?)\s*\)/g;
    let m;

    while ((m = re.exec(src)) !== null) {
        const isGroup = m[1] === 'collectionGroup';
        const collection = literal(m[2]);
        // A dynamic collection name cannot be resolved statically; the query
        // shape is still worth reporting, but it cannot be matched to an index.
        const start = m.index + m[0].length;
        const window = src.slice(start, start + 1200);

        // Stop at the terminal call or at a statement boundary.
        const term = /\.(get|onSnapshot|stream)\s*\(/.exec(window);
        const chain = term ? window.slice(0, term.index) : null;
        if (chain === null) continue;
        if (/;\s*\n/.test(chain)) continue;

        // `db.collection('assetOwnership').doc(id).collection('claims').where(...)`
        // queries `claims`, not `assetOwnership`. Only the innermost collection
        // in a chain is the one being filtered, so skip an outer one — the
        // inner occurrence is matched separately by this same loop.
        if (/\.collection(Group)?\(/.test(chain)) continue;

        const fields = [];
        const whereRe = /\.where\(\s*([^,]+?)\s*,\s*(['"`])([^'"`]+)\2\s*,/g;
        let w;
        while ((w = whereRe.exec(chain)) !== null) {
            const fieldPath = literal(w[1]);
            fields.push({
                path: fieldPath || `<dynamic:${w[1].trim()}>`,
                op: w[3],
                kind: RANGE_OPS.has(w[3]) ? 'range'
                    : ARRAY_OPS.has(w[3]) ? 'array' : 'eq'
            });
        }

        const orderRe = /\.orderBy\(\s*([^,)]+?)\s*(?:,\s*(['"`])(asc|desc)\2\s*)?\)/g;
        let o;
        while ((o = orderRe.exec(chain)) !== null) {
            const fieldPath = literal(o[1]);
            fields.push({
                path: fieldPath || `<dynamic:${o[1].trim()}>`,
                op: 'orderBy',
                kind: 'order',
                order: (o[3] || 'asc').toUpperCase() === 'DESC' ? 'DESCENDING' : 'ASCENDING'
            });
        }

        if (fields.length === 0) continue;

        const line = src.slice(0, m.index).split('\n').length;
        queries.push({ file, line, collection, isGroup, fields });
    }
    return queries;
}

/** Does this query need a composite index? */
function needsComposite(q) {
    const distinct = new Set(q.fields.map(f => f.path));
    if (distinct.size > 1) return true;
    // A single field constrained by both a filter and an orderBy on that same
    // field is served by the automatic single-field index.
    return false;
}

/**
 * Human-readable signature: equalities (sorted), then array, then range/order.
 * This is what gets printed; matching uses `coverageKey` below.
 */
function signature(q) {
    const eq = q.fields.filter(f => f.kind === 'eq').map(f => f.path);
    const arr = q.fields.filter(f => f.kind === 'array').map(f => f.path);
    const tail = q.fields.filter(f => f.kind === 'range' || f.kind === 'order').map(f => f.path);
    const parts = [...new Set([...eq.sort(), ...arr, ...tail])];
    return `${q.collection || '<dynamic>'} :: ${parts.join(', ')}`;
}

/**
 * Matching key: collection plus the SET of constrained fields.
 *
 * Deliberately order-insensitive and direction-insensitive. Firestore's index
 * selection does care about field order and sort direction, so this check is
 * weaker than the database's — it answers "is there an index over these
 * fields at all", not "is there one this exact query can use". That is the
 * conservative direction for this audit's purpose: a shape reported as
 * UNDECLARED is genuinely uncovered, whereas a shape reported as satisfied
 * may still need its field order checked by hand. The alternative — matching
 * order exactly — reports shapes as missing that are in fact served, and a
 * report full of false alarms is one nobody reads.
 */
function coverageKey(collection, fieldPaths) {
    return `${collection} :: ${[...new Set(fieldPaths)].sort().join('|')}`;
}

function queryCoverageKey(q) {
    return coverageKey(q.collection || '<dynamic>', q.fields.map(f => f.path));
}

function declaredSignatures() {
    const j = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    const map = new Map();
    for (const idx of j.indexes) {
        const fields = idx.fields.map(f => f.fieldPath);
        // Firestore serves a query using a prefix of an index's fields, so
        // every prefix of length >= 2 counts as covered.
        for (let n = 2; n <= fields.length; n++) {
            const pk = coverageKey(idx.collectionGroup, fields.slice(0, n));
            if (!map.has(pk)) map.set(pk, idx);
        }
    }
    return map;
}

/**
 * Query shapes issued against a collection name held in a variable.
 *
 * A purely syntactic scan cannot resolve these, and dropping them would make
 * this audit actively dangerous: the static+delta fetch in
 * `asset-service.js::_fetchDeltas` is exactly such a query, and it is the
 * mechanism the whole site is built on. Reporting its ~40 `<facet> +
 * updatedAt` indexes as "unused" would invite deleting them and silently
 * freezing the site at its last bake.
 *
 * So the one shape that matters is declared here and expanded across the
 * domain registry, which is the same source `_fetchDeltas` itself consults.
 */
function deltaQueryShapes() {
    const registrySrc = fs.readFileSync(path.join(ROOT, 'js/config/domains.js'), 'utf8');
    // The registry is a browser module (`window.DOMAINS = ...`); evaluate it
    // against a stub global rather than duplicating the collection lists here,
    // so this audit cannot drift from the registry it is describing.
    const sandbox = { window: {} };
    // eslint-disable-next-line no-new-func
    new Function('window', registrySrc)(sandbox.window);
    const registry = sandbox.window.DOMAINS;
    if (!registry || typeof registry.list !== 'function') return [];

    const shapes = [];
    for (const domain of registry.list()) {
        for (const collection of domain.collections || []) {
            shapes.push({
                file: 'js/services/asset-service.js',
                line: 268,
                collection,
                isGroup: false,
                origin: 'delta fetch (dynamic collection, resolved via js/config/domains.js)',
                fields: [
                    { path: domain.facetField, op: '==', kind: 'eq' },
                    { path: 'updatedAt', op: '>', kind: 'range' }
                ]
            });
        }
    }
    return shapes;
}

function main() {
    const files = listSourceFiles();
    const queries = [...files.flatMap(extractQueries), ...deltaQueryShapes()];
    const composite = queries.filter(needsComposite);

    const declared = declaredSignatures();
    const required = new Map();
    for (const q of composite) {
        const sig = signature(q);
        if (!required.has(sig)) required.set(sig, { key: queryCoverageKey(q), sites: [] });
        required.get(sig).sites.push(`${q.file}:${q.line}`);
    }

    const missing = [];
    const satisfied = [];
    for (const [sig, { key, sites }] of required) {
        if (sig.startsWith('<dynamic>') || sig.includes('<dynamic:')) continue;
        (declared.has(key) ? satisfied : missing).push({ sig, key, sites });
    }

    // An index counts as used if any query shape resolves to it, including via
    // a prefix — so walk the satisfied shapes back to the index that serves them.
    const usedIndexes = new Set();
    for (const { key } of satisfied) {
        const idx = declared.get(key);
        if (idx) usedIndexes.add(idx);
    }
    const rawDeclared = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')).indexes;
    const unused = rawDeclared
        .filter(idx => ![...usedIndexes].some(u =>
            u.collectionGroup === idx.collectionGroup &&
            JSON.stringify(u.fields) === JSON.stringify(idx.fields)))
        .map(idx => `${idx.collectionGroup} :: ${idx.fields.map(f => f.fieldPath).join(', ')}`);

    if (process.argv.includes('--json')) {
        console.log(JSON.stringify({ missing, satisfied, unused }, null, 2));
        return;
    }

    console.log(`Scanned ${files.length} files; ${queries.length} query chains, ` +
        `${composite.length} needing a composite index (${required.size} distinct shapes).`);
    console.log(`Declared in firestore.indexes.json: ${rawDeclared.length}\n`);

    console.log(`=== REQUIRED BUT UNDECLARED (${missing.length}) ===`);
    console.log('A live query with no index. In the delta path a failed-precondition');
    console.log('is swallowed, so these degrade to base-only results with no warning.\n');
    for (const { sig, sites } of missing.sort((a, b) => a.sig.localeCompare(b.sig))) {
        console.log(`  ${sig}`);
        for (const s of sites) console.log(`      ${s}`);
    }

    console.log(`\n=== DECLARED AND USED BY THIS REPO (${satisfied.length}) ===`);
    for (const { sig } of satisfied.sort((a, b) => a.sig.localeCompare(b.sig))) {
        console.log(`  ${sig}`);
    }

    console.log(`\n=== DECLARED, NOT USED BY ANY QUERY IN js/ (${unused.length}) ===`);
    console.log('Candidates for investigation, NOT a delete list. Three reasons an');
    console.log('index lands here while being genuinely needed:');
    console.log('  - the query lives outside js/ — the Python packages (azrael,');
    console.log('    esoterica, mnema, synomosia), scripts/, or the Firebase console;');
    console.log('  - it is a sibling of a matched index differing only in sort');
    console.log('    direction or trailing sort field, which this set-based match');
    console.log('    cannot tell apart (the `notes` and `posts` families are exactly');
    console.log('    this: one shape matched, its variants did not);');
    console.log('  - it serves a subcollection reached through a variable path.');
    console.log('Do NOT run `firebase deploy --only firestore:indexes --force` on the');
    console.log('strength of this list. Confirm each one against the console first.\n');
    for (const k of unused.sort()) console.log(`  ${k}`);

    process.exitCode = missing.length > 0 ? 1 : 0;
}

main();
