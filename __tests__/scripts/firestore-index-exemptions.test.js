/**
 * Firestore single-field index exemption guard.
 *
 * `firestore.indexes.json` carries a `fieldOverrides` block whose entries each
 * say "stop automatically indexing this field on this collection group". That
 * is worth real storage and write cost — Firestore otherwise maintains an
 * ascending index, a descending index and, for arrays, one entry per element,
 * on every field of every document.
 *
 * The mistake this file exists to prevent is the contradiction: exempting a
 * field that something actually queries. Firestore does not reject that. It
 * accepts the deploy, and then the query fails at runtime with
 * `failed-precondition` — and in the delta path that error is deliberately
 * swallowed (`js/services/asset-service.js`), so the site silently degrades to
 * base-only results with nothing logged. A unit test is the only cheap place
 * to catch it.
 *
 * The rules enforced here:
 *   1. No exempted field path may appear in any composite index on the same
 *      collection group.
 *   2. No exempted field path may appear in any `.where(...)` or `.orderBy(...)`
 *      string literal anywhere under `js/`. This is deliberately stricter than
 *      rule 1 — the scan cannot tell which collection a call site queries, so
 *      it treats a name match anywhere as a contradiction.
 *   3. No exempted field path may be a prefix of a queried map path (exempting
 *      `cultural` while something queries `cultural.festivals`).
 *   4. The database stays under Firestore's cap of 200 single-field index
 *      exemptions.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const INDEXES = path.join(ROOT, 'firestore.indexes.json');
const JS_ROOT = path.join(ROOT, 'js');

/** Firestore allows at most 200 single-field index exemptions per database. */
const MAX_EXEMPTIONS = 200;

/**
 * Field names that appear in a `.where()` or `.orderBy()` as a string literal
 * but are not really document fields, so a name collision with an exemption
 * would be a false alarm rather than a broken query.
 */
const NOT_DOCUMENT_FIELDS = new Set([
    '==', '!=', '<', '<=', '>', '>=', 'in', 'not-in',
    'array-contains', 'array-contains-any',
    'asc', 'desc',
]);

function readIndexes() {
    // Parsed with a plain JSON.parse rather than a tolerant reader on purpose:
    // the file must be strict JSON for anything other than the Firebase CLI to
    // read it (`.firebaserc` in this repo is the cautionary example).
    return JSON.parse(fs.readFileSync(INDEXES, 'utf8'));
}

/** Every .js file under js/, excluding vendored and minified code. */
function collectJsFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'vendor' || entry.name === 'lib' || entry.name === 'node_modules') continue;
            collectJsFiles(full, out);
        } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Field paths passed as a string literal to `.where()` or `.orderBy()`.
 * @returns {Map<string, string[]>} field path → call sites that use it
 */
function collectQueriedFields() {
    const pattern = /\.(where|orderBy)\(\s*['"`]([^'"`\n]+)['"`]/g;
    const found = new Map();

    for (const file of collectJsFiles(JS_ROOT)) {
        const source = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = pattern.exec(source)) !== null) {
            const field = match[2];
            if (NOT_DOCUMENT_FIELDS.has(field)) continue;
            const rel = path.relative(ROOT, file).replace(/\\/g, '/');
            const line = source.slice(0, match.index).split('\n').length;
            if (!found.has(field)) found.set(field, []);
            found.get(field).push(`${rel}:${line}`);
        }
    }
    return found;
}

describe('firestore single-field index exemptions', () => {
    const config = readIndexes();
    const overrides = config.fieldOverrides || [];
    const queried = collectQueriedFields();

    test('firestore.indexes.json is strict JSON with the expected shape', () => {
        expect(Array.isArray(config.indexes)).toBe(true);
        expect(Array.isArray(config.fieldOverrides)).toBe(true);

        for (const override of overrides) {
            expect(typeof override.collectionGroup).toBe('string');
            expect(override.collectionGroup.length).toBeGreaterThan(0);
            expect(typeof override.fieldPath).toBe('string');
            expect(override.fieldPath.length).toBeGreaterThan(0);
            // An empty `indexes` array is what actually disables automatic
            // indexing. Anything else here is a re-enable, not an exemption.
            expect(override.indexes).toEqual([]);
            expect(override.ttl).toBe(false);
        }
    });

    test('no duplicate (collection group, field path) exemptions', () => {
        const seen = new Set();
        const duplicates = [];
        for (const { collectionGroup, fieldPath } of overrides) {
            const key = `${collectionGroup}::${fieldPath}`;
            if (seen.has(key)) duplicates.push(key);
            seen.add(key);
        }
        expect(duplicates).toEqual([]);
    });

    test('the query scan actually finds queries', () => {
        // Without this, a broken regex or a moved js/ directory would make
        // every check below pass vacuously — the worst outcome for a guard.
        expect(collectJsFiles(JS_ROOT).length).toBeGreaterThan(50);
        expect(queried.size).toBeGreaterThan(20);
        for (const field of ['updatedAt', 'mythology', 'status', 'userId']) {
            expect(queried.has(field)).toBe(true);
        }
    });

    test('no exempted field appears in a composite index on the same collection group', () => {
        const exempt = new Set(overrides.map(o => `${o.collectionGroup}::${o.fieldPath}`));
        const conflicts = [];

        for (const index of config.indexes) {
            for (const field of index.fields) {
                const key = `${index.collectionGroup}::${field.fieldPath}`;
                if (exempt.has(key)) {
                    conflicts.push(
                        `${key} is exempted but is part of a composite index on ` +
                        `${index.collectionGroup} (${index.fields.map(f => f.fieldPath).join(' + ')})`
                    );
                }
            }
        }

        expect(conflicts).toEqual([]);
    });

    test('no exempted field is used in a .where() or .orderBy() under js/', () => {
        const conflicts = [];

        for (const { collectionGroup, fieldPath } of overrides) {
            const sites = queried.get(fieldPath);
            if (sites) {
                conflicts.push(
                    `${collectionGroup}.${fieldPath} is exempted from indexing but is ` +
                    `queried at ${[...new Set(sites)].slice(0, 3).join(', ')}`
                );
            }
        }

        // Deduplicated by field so a field exempted on 27 collections reports
        // once per collection rather than 27 near-identical lines of noise.
        expect(conflicts).toEqual([]);
    });

    test('no exempted map field is the prefix of a queried subfield path', () => {
        // Exempting `cultural` while something orders by `cultural.festivals`
        // is the same contradiction one level down, and a plain name match
        // would not see it.
        const conflicts = [];

        for (const { collectionGroup, fieldPath } of overrides) {
            for (const [queriedPath, sites] of queried) {
                if (queriedPath.startsWith(fieldPath + '.')) {
                    conflicts.push(
                        `${collectionGroup}.${fieldPath} is exempted but the subfield ` +
                        `${queriedPath} is queried at ${sites[0]}`
                    );
                }
            }
        }

        expect(conflicts).toEqual([]);
    });

    test('the fields the delta layer and the domain facets depend on are never exempted', () => {
        // Belt and braces over the scan above. `updatedAt` drives the entire
        // static+delta sync; the facet fields shard every browse query. If the
        // scan above ever regressed, losing these silently would be the most
        // expensive possible failure, so they are named.
        const NEVER_EXEMPT = [
            'updatedAt', 'createdAt', 'mythology', 'era', 'category',
            'type', 'name', 'status', 'userId', 'votes', 'netVotes',
            'contestedScore', 'entityId', 'entityCollection', 'parentId',
        ];
        const exemptedPaths = new Set(overrides.map(o => o.fieldPath));
        const violations = NEVER_EXEMPT.filter(f => exemptedPaths.has(f));
        expect(violations).toEqual([]);
    });

    test('exemption count stays within the Firestore per-database cap', () => {
        expect(overrides.length).toBeLessThanOrEqual(MAX_EXEMPTIONS);
    });

    test('every exempted collection group is one this site actually uses', () => {
        // A typo'd collection group is a silent no-op: Firestore accepts the
        // exemption, it matches nothing, and the storage is never reclaimed.
        const DOMAINS = require(path.join(ROOT, 'js', 'config', 'domains.js'));
        const known = new Set(DOMAINS.allCollections());
        const unknown = [...new Set(overrides.map(o => o.collectionGroup))]
            .filter(c => !known.has(c));
        expect(unknown).toEqual([]);
    });
});
