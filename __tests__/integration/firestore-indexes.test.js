/**
 * firestore.indexes.json — coverage for the delta layer.
 *
 * The static+delta design turns on one query, issued once per collection per
 * browse: `where(<facet>, '==', value).where('updatedAt', '>', baseDate)`
 * (asset-service.js::_fetchDeltas). It needs a `<facet> + updatedAt` composite
 * index on every collection the domain registry lists.
 *
 * When the index is absent Firestore rejects the query with
 * `failed-precondition` — and `_fetchDeltas` deliberately swallows that,
 * returning an empty delta array. The page then renders the baked base alone,
 * looking completely healthy while showing none of the edits made since the
 * last bake. There is no error, no empty state, and no way for a reader to
 * tell. That is the worst failure mode the site has, and it was live for seven
 * collections: `figures`, `grimoires`, `ingredients`, `practitioners`,
 * `spells`, `teachings` and `traditions`.
 *
 * So this asserts the invariant instead of the seven fixes: every collection
 * in the registry has the index its own facet field needs. Adding a domain or
 * a collection without its index fails here rather than in production silence.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function loadRegistry() {
    const src = fs.readFileSync(path.join(ROOT, 'js/config/domains.js'), 'utf8');
    const win = {};
    // eslint-disable-next-line no-new-func
    new Function('window', src)(win);
    return win.DOMAINS;
}

function loadIndexes() {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'firestore.indexes.json'), 'utf8'));
}

/** Does an index exist whose first two fields are exactly [facet, updatedAt]? */
function hasDeltaIndex(indexes, collection, facetField) {
    return indexes.some(idx =>
        idx.collectionGroup === collection &&
        idx.fields.length >= 2 &&
        idx.fields[0].fieldPath === facetField &&
        idx.fields[1].fieldPath === 'updatedAt'
    );
}

describe('firestore.indexes.json', () => {
    let registry;
    let indexes;

    beforeAll(() => {
        registry = loadRegistry();
        indexes = loadIndexes().indexes;
    });

    test('is valid JSON with an indexes array', () => {
        expect(Array.isArray(indexes)).toBe(true);
        expect(indexes.length).toBeGreaterThan(0);
    });

    test('every registry collection has its delta index', () => {
        const missing = [];
        for (const domain of registry.list()) {
            for (const collection of domain.collections) {
                if (!hasDeltaIndex(indexes, collection, domain.facetField)) {
                    missing.push(`${collection} (${domain.id}, facet "${domain.facetField}")`);
                }
            }
        }
        // Named rather than counted, so a failure says which collection went
        // dark rather than that a number changed.
        expect(missing).toEqual([]);
    });

    test('the check would notice a missing index', () => {
        // A test that cannot fail is not a test.
        expect(hasDeltaIndex(indexes, 'deities', 'mythology')).toBe(true);
        expect(hasDeltaIndex(indexes, 'deities', 'era')).toBe(false);
        expect(hasDeltaIndex(indexes, 'no_such_collection', 'mythology')).toBe(false);
    });

    test('the facet field leads the index, because Firestore requires it', () => {
        // The equality filter must precede the range filter in the index, so an
        // `updatedAt`-first index does not serve the delta query however
        // suggestive its field list looks.
        for (const domain of registry.list()) {
            for (const collection of domain.collections) {
                const candidates = indexes.filter(i => i.collectionGroup === collection);
                const serving = candidates.filter(i =>
                    i.fields[0] && i.fields[0].fieldPath === domain.facetField &&
                    i.fields[1] && i.fields[1].fieldPath === 'updatedAt');
                expect(serving.length).toBeGreaterThan(0);
            }
        }
    });

    test('no two indexes are byte-identical duplicates', () => {
        const seen = new Map();
        const dupes = [];
        for (const idx of indexes) {
            const key = `${idx.collectionGroup}::${JSON.stringify(idx.fields)}`;
            if (seen.has(key)) dupes.push(key);
            seen.set(key, true);
        }
        // A duplicate is not an error to Firestore, but it is a sign the file
        // has been edited by hand in two places and is drifting.
        expect(dupes).toEqual([]);
    });
});
