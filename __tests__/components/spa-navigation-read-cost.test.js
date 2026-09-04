/**
 * SPANavigation — Firestore read cost
 *
 * The site serves content from a baked static base precisely so that Firestore
 * carries almost no read traffic. That design is defeated by a single unbounded
 * query, and it fails quietly: the page still renders, the bill or the free-tier
 * quota absorbs it, and nobody notices until reads stop being served.
 *
 * That is not hypothetical here. The project exhausted its 50,000-reads-per-day
 * allowance in about four hours, and the causes were in this file — a browse
 * fallback that fetched an entire collection to filter it client-side, and two
 * counters that downloaded every matching document in order to call `.size` on
 * the result.
 *
 * These tests assert the shape of every query this file issues rather than the
 * three fixes specifically, because the next instance of this bug will be a
 * fourth call site written by someone who never read this comment. A collection
 * query must either bound itself with `limit()` or ask for a count instead of
 * the rows.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

/**
 * A Firestore double that records the shape of each query rather than its data.
 *
 * Every terminal `.get()` pushes one entry describing how the chain was built,
 * so a test can ask "was anything read without a bound?" instead of having to
 * anticipate which method a future call site might use.
 */
function recordingFirestore(docsPerQuery = 0) {
    const issued = [];

    function makeQuery(collection, state) {
        const q = {
            where(field, op, value) {
                return makeQuery(collection, { ...state, wheres: [...state.wheres, field] });
            },
            orderBy(field) {
                return makeQuery(collection, { ...state, orderBy: field });
            },
            limit(n) {
                return makeQuery(collection, { ...state, limit: n });
            },
            count() {
                return makeQuery(collection, { ...state, isCount: true });
            },
            doc() {
                return { get: async () => ({ exists: false, data: () => ({}) }) };
            },
            async get() {
                issued.push({ collection, ...state });
                if (state.isCount) {
                    return { data: () => ({ count: docsPerQuery }) };
                }
                const docs = Array.from({ length: docsPerQuery }, (_, i) => ({
                    id: `d${i}`,
                    data: () => ({ mythology: 'greek', name: `E${i}` }),
                }));
                return { empty: docs.length === 0, size: docs.length, docs };
            },
        };
        return q;
    }

    return {
        issued,
        collection: (name) => makeQuery(name, { wheres: [], limit: null, isCount: false }),
    };
}

/** Queries that read rows without bounding how many. */
function unbounded(issued) {
    return issued.filter(q => !q.isCount && q.limit === null);
}

describe('SPANavigation read cost', () => {
    let SPANavigation;

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = '';
        // The constructor reads firebase.auth().currentUser synchronously.
        global.firebase = {
            auth: jest.fn(() => ({
                currentUser: null,
                onAuthStateChanged: jest.fn(),
            })),
        };
        SPANavigation = require('../../js/spa-navigation.js');
    });

    afterEach(() => { delete global.firebase; });

    describe('mythology overview counts', () => {
        test('counts by aggregation instead of downloading the rows', async () => {
            // The regression: `.get()` then `snapshot.size`, which reads every
            // matching document to learn how many there are. Across ~105
            // mythologies and six collections that is a walk of the whole corpus,
            // billed per document, every time the overview renders.
            const db = recordingFirestore(300);
            const spa = new SPANavigation(db, {}, {});

            await spa.loadMythologyCounts([{ id: 'greek' }, { id: 'norse' }]);

            expect(db.issued.length).toBeGreaterThan(0);
            expect(db.issued.every(q => q.isCount)).toBe(true);
            expect(unbounded(db.issued)).toEqual([]);
        });
    });

    describe('mythology page entity-type counts', () => {
        test('counts by aggregation, and the casing fallback stays narrow', async () => {
            // Zero results forces the fallback path. It used to fetch up to 500
            // documents and filter them; it should now ask the same narrow
            // question of the lowercased value.
            const db = recordingFirestore(0);
            const spa = new SPANavigation(db, {}, {});

            await spa.renderBasicMythologyPage('Greek');

            expect(db.issued.length).toBeGreaterThan(0);
            expect(db.issued.every(q => q.isCount)).toBe(true);
            expect(unbounded(db.issued)).toEqual([]);
            // Every query narrows by mythology — none walks a bare collection.
            expect(db.issued.every(q => q.wheres.includes('mythology'))).toBe(true);
        });
    });

    describe('basic category page fallback', () => {
        test('never fetches a whole collection when the exact match misses', async () => {
            // The worst instance: `db.collection(category).get()` with no limit,
            // filtered client-side "to handle inconsistent casing". For `concepts`
            // that is 5,313 reads in one call.
            const db = recordingFirestore(0);
            const spa = new SPANavigation(db, {}, {});

            await spa.renderBasicCategoryPage('Greek', 'concepts');

            expect(unbounded(db.issued)).toEqual([]);
            // A bare collection read — no `where` at all — is the specific shape
            // that made this expensive.
            expect(db.issued.filter(q => q.wheres.length === 0)).toEqual([]);
        });

        test('bounds the query even when the exact match succeeds', async () => {
            const db = recordingFirestore(50);
            const spa = new SPANavigation(db, {}, {});

            await spa.renderBasicCategoryPage('greek', 'deities');

            expect(unbounded(db.issued)).toEqual([]);
            expect(db.issued[0].limit).toBeGreaterThan(0);
        });
    });

    describe('the guard itself', () => {
        test('the recorder would notice an unbounded read', () => {
            // A test that cannot fail is not a test. Prove the detector fires on
            // exactly the shape it is meant to catch.
            const db = recordingFirestore(10);
            return db.collection('deities').get().then(() => {
                expect(unbounded(db.issued)).toHaveLength(1);
            });
        });

        test('a limited or counted query is not flagged', async () => {
            const db = recordingFirestore(10);
            await db.collection('deities').limit(5).get();
            await db.collection('deities').where('mythology', '==', 'greek').count().get();
            expect(unbounded(db.issued)).toEqual([]);
        });
    });
});
