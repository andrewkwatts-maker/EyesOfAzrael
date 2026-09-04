/**
 * MythologyOverview — Firestore read cost
 *
 * Companion to spa-navigation-read-cost.test.js, and the more important of the
 * two. That suite pinned the counters in `renderBasicMythologyPage`, which is
 * only the *fallback* renderer: spa-navigation.js routes every mythology page
 * to `MythologyOverview` first and reaches the basic page only when the
 * component throws. So the expensive path was the one still unguarded.
 *
 * `loadCategorySections` fans out across ENTITY_TYPES — eleven collections —
 * on every mythology page view. Fetching each collection's full result set to
 * render twenty cards and a number is how a static+delta site with almost no
 * traffic still manages to spend 50,000 reads in an afternoon.
 *
 * As in the sibling suite, these tests assert the *shape* of the queries
 * rather than the specific fix, so the next unbounded call site in this file
 * is caught by structure rather than by memory.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

/**
 * A Firestore double that records the shape of each query rather than its data.
 *
 * `docsPerFacet` maps a `mythology` value to how many documents match it, so a
 * test can force the casing-fallback path by giving the lowercase value zero.
 */
function recordingFirestore(docsPerFacet = {}) {
    const issued = [];

    function makeQuery(collection, state) {
        return {
            where(field, op, value) {
                return makeQuery(collection, {
                    ...state,
                    wheres: [...state.wheres, field],
                    facet: field === 'mythology' ? value : state.facet
                });
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
            doc(id) {
                return {
                    get: async () => {
                        issued.push({ collection, docId: id, isDoc: true, wheres: [], limit: 1 });
                        return { exists: false, data: () => ({}) };
                    }
                };
            },
            async get() {
                issued.push({ collection, ...state });
                const total = docsPerFacet[state.facet] || 0;
                if (state.isCount) {
                    return { data: () => ({ count: total }) };
                }
                const n = state.limit === null ? total : Math.min(total, state.limit);
                const docs = Array.from({ length: n }, (_, i) => ({
                    id: `d${i}`,
                    data: () => ({ mythology: state.facet, name: `Entity ${i}` })
                }));
                return {
                    empty: docs.length === 0,
                    size: docs.length,
                    docs,
                    forEach: (fn) => docs.forEach(fn)
                };
            }
        };
    }

    return {
        issued,
        collection: (name) => makeQuery(name, {
            wheres: [], limit: null, isCount: false, facet: null
        })
    };
}

/** Queries that read rows without bounding how many. */
function unbounded(issued) {
    return issued.filter(q => !q.isCount && !q.isDoc && q.limit === null);
}

describe('MythologyOverview read cost', () => {
    let MythologyOverview;

    beforeEach(() => {
        jest.resetModules();
        global.window = global.window || {};
        require('../../js/components/mythology-overview.js');
        MythologyOverview = window.MythologyOverview;
    });

    test('never reads a category without a bound or a count', async () => {
        // 400 Greek deities, and the page shows twenty of them.
        const db = recordingFirestore({ greek: 400 });
        const view = new MythologyOverview({ db });

        await view.loadCategorySections('greek');

        expect(db.issued.length).toBeGreaterThan(0);
        expect(unbounded(db.issued)).toEqual([]);
    });

    test('reads at most PREVIEW_LIMIT rows per category', async () => {
        const db = recordingFirestore({ greek: 400 });
        const view = new MythologyOverview({ db });

        await view.loadCategorySections('greek');

        const rowReads = db.issued.filter(q => !q.isCount && !q.isDoc);
        expect(rowReads.length).toBeGreaterThan(0);
        for (const q of rowReads) {
            expect(q.limit).toBe(view.PREVIEW_LIMIT);
        }
    });

    test('reports the true total, not the number of rows fetched', async () => {
        const db = recordingFirestore({ greek: 400 });
        const view = new MythologyOverview({ db });

        const sections = await view.loadCategorySections('greek');

        expect(sections.length).toBe(MythologyOverview.ENTITY_TYPES.length);
        for (const section of sections) {
            expect(section.count).toBe(400);
            expect(section.entities.length).toBe(view.PREVIEW_LIMIT);
        }
    });

    test('an empty category costs a count, not a fetch', async () => {
        const db = recordingFirestore({});
        const view = new MythologyOverview({ db });

        const sections = await view.loadCategorySections('greek');

        expect(sections).toEqual([]);
        expect(db.issued.every(q => q.isCount)).toBe(true);
    });

    test('the casing fallback asks a second narrow question, not a wider one', async () => {
        // Only the capitalized value matches, which is the shape the fallback
        // exists for. It must not widen to the whole collection to find it.
        const db = recordingFirestore({ Polynesian: 30 });
        const view = new MythologyOverview({ db });

        const sections = await view.loadCategorySections('polynesian');

        expect(sections.length).toBe(MythologyOverview.ENTITY_TYPES.length);
        expect(unbounded(db.issued)).toEqual([]);
        // Every query narrows by mythology — none walks a bare collection.
        expect(db.issued.every(q => q.wheres.includes('mythology'))).toBe(true);
        expect(sections[0].count).toBe(30);
    });

    test('"View all" is driven by the count, not by the rows fetched', async () => {
        const db = recordingFirestore({ greek: 400 });
        const view = new MythologyOverview({ db });
        const [section] = await view.loadCategorySections('greek');

        const html = view.renderCategorySection({ id: 'greek', name: 'Greek' }, section);

        expect(html).toContain('View all 400');
        // ...and it is absent when everything already fits in the preview.
        const small = { ...section, count: 5, entities: section.entities.slice(0, 5) };
        expect(view.renderCategorySection({ id: 'greek', name: 'Greek' }, small))
            .not.toContain('View all');
    });

    describe('the guard itself', () => {
        test('the recorder would notice an unbounded read', async () => {
            const db = recordingFirestore({ greek: 10 });
            await db.collection('deities').where('mythology', '==', 'greek').get();
            expect(unbounded(db.issued)).toHaveLength(1);
        });

        test('a limited or counted query is not flagged', async () => {
            const db = recordingFirestore({ greek: 10 });
            await db.collection('deities').where('mythology', '==', 'greek').limit(5).get();
            await db.collection('deities').where('mythology', '==', 'greek').count().get();
            expect(unbounded(db.issued)).toEqual([]);
        });
    });
});
