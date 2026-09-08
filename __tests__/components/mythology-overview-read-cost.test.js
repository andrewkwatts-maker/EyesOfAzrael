/**
 * MythologyOverview — Firestore read cost
 *
 * `loadCategorySections` fans out across ENTITY_TYPES — eleven collections — on
 * every mythology page view, and this is the primary renderer: spa-navigation.js
 * routes every mythology page here first and reaches renderBasicMythologyPage
 * only when this component throws.
 *
 * It used to size each category by downloading it. Measured against the live
 * database, one view of #/mythology/greek cost 2,329 document reads, of which
 * 1,934 were counting — eleven collections pulled in full so that .size could
 * produce eleven integers. Every other route on the site cost between 36 and 67.
 *
 * The counts are now precomputed onto mythologies/{id}.entityCounts by
 * scripts/recompute-mythology-stats.js, so all eleven categories share a single
 * document read. The previous version of this suite asserted the old cost as a
 * deliberate trade-off and said, in as many words, that when the fix landed the
 * test should start failing and its replacement should assert that no unlimited
 * read happens at all. This is that replacement.
 *
 * As before, these assert the *shape* of the queries rather than a specific
 * implementation, so the next unbounded call site is caught by structure rather
 * than by memory.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

/**
 * A Firestore double that records the shape of each query rather than its data.
 *
 * `docsPerFacet` maps a `mythology` value to how many documents match it.
 * `storedCounts`, when given, is served as mythologies/{id}.entityCounts — the
 * precomputed path. Omitting it exercises the fallback for a tradition that has
 * never been through the stats script.
 */
function recordingFirestore(docsPerFacet = {}, storedCounts = null) {
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
            // Deliberately NO count(). The compat SDK does not have it, and a mock
            // that invents methods the real client lacks is how .count().get()
            // reached production and threw on every mythology page.
            doc(id) {
                return {
                    get: async () => {
                        issued.push({ collection, docId: id, isDoc: true, wheres: [], limit: 1 });
                        if (collection === 'mythologies' && storedCounts) {
                            return { exists: true, data: () => ({ entityCounts: storedCounts }) };
                        }
                        return { exists: false, data: () => ({}) };
                    }
                };
            },
            async get() {
                issued.push({ collection, ...state });
                const total = docsPerFacet[state.facet] || 0;
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
            wheres: [], limit: null, facet: null
        })
    };
}

/** Queries that read a collection with nothing to bound how much comes back. */
function unbounded(issued) {
    return issued.filter(q => !q.isDoc && q.limit === null);
}

/** Every entity collection the component fans out across. */
const ALL_TYPES = () => {
    const counts = {};
    for (const t of window.MythologyOverview.ENTITY_TYPES) counts[t.collection] = 400;
    return counts;
};

describe('MythologyOverview read cost', () => {
    let MythologyOverview;

    beforeEach(() => {
        jest.resetModules();
        global.window = global.window || {};
        require('../../js/components/mythology-overview.js');
        MythologyOverview = window.MythologyOverview;
    });

    test('no query reads a collection without a limit', async () => {
        // The invariant that replaced the old "counting costs a full read"
        // allowance. Nothing in this component may issue an unbounded read now,
        // whether it is counting or fetching.
        const db = recordingFirestore({ greek: 400 }, ALL_TYPES());
        const view = new MythologyOverview({ db });

        await view.loadCategorySections('greek');

        expect(db.issued.length).toBeGreaterThan(0);
        expect(unbounded(db.issued)).toEqual([]);
    });

    test('counts come from one document read, not from counting rows', async () => {
        const db = recordingFirestore({ greek: 400 }, ALL_TYPES());
        const view = new MythologyOverview({ db });

        await view.loadCategorySections('greek');

        const mythologyDocReads = db.issued.filter(q => q.isDoc && q.collection === 'mythologies');
        // One read shared across all eleven categories. The component resolves
        // them in parallel, so the promise — not the resolved value — has to be
        // cached; caching the value alone would let eleven callers each start
        // their own identical read before the first returned.
        expect(mythologyDocReads).toHaveLength(1);

        // And no collection was scanned to produce a number.
        const countingScans = db.issued.filter(q => !q.isDoc && q.limit === null);
        expect(countingScans).toEqual([]);
    });

    test('the preview grid reads at most PREVIEW_LIMIT rows per category', async () => {
        const db = recordingFirestore({ greek: 400 }, ALL_TYPES());
        const view = new MythologyOverview({ db });

        await view.loadCategorySections('greek');

        const previewReads = db.issued.filter(q => !q.isDoc);
        expect(previewReads.length).toBeGreaterThan(0);
        for (const q of previewReads) {
            expect(q.limit).toBe(view.PREVIEW_LIMIT);
        }
    });

    test('reports the stored total, not the number of rows fetched', async () => {
        const db = recordingFirestore({ greek: 400 }, ALL_TYPES());
        const view = new MythologyOverview({ db });

        const sections = await view.loadCategorySections('greek');

        expect(sections.length).toBe(MythologyOverview.ENTITY_TYPES.length);
        for (const section of sections) {
            expect(section.count).toBe(400);
            expect(section.entities.length).toBe(view.PREVIEW_LIMIT);
        }
    });

    describe('without stored counts', () => {
        test('falls back to a bounded read rather than an unbounded one', async () => {
            // A tradition that has never been through the stats script must still
            // render. The fallback is capped: a card reading "500+" is worth far
            // more than an exact number that costs a thousand reads.
            const db = recordingFirestore({ greek: 4000 });
            const view = new MythologyOverview({ db });

            const sections = await view.loadCategorySections('greek');

            expect(unbounded(db.issued)).toEqual([]);
            expect(sections.length).toBeGreaterThan(0);
            for (const q of db.issued.filter(x => !x.isDoc)) {
                expect(q.limit).not.toBeNull();
                expect(q.wheres).toContain('mythology');
            }
        });

        test('an empty category issues no preview fetch', async () => {
            const db = recordingFirestore({});
            const view = new MythologyOverview({ db });

            const sections = await view.loadCategorySections('greek');

            expect(sections).toEqual([]);
            expect(unbounded(db.issued)).toEqual([]);
            // Every collection query narrows by mythology; the only unfiltered
            // read is the single mythologies/{id} document lookup.
            for (const q of db.issued.filter(x => !x.isDoc)) {
                expect(q.wheres).toContain('mythology');
            }
        });

        test('the casing fallback asks a second narrow question, not a wider one', async () => {
            const db = recordingFirestore({ Polynesian: 30 });
            const view = new MythologyOverview({ db });

            const sections = await view.loadCategorySections('polynesian');

            expect(sections.length).toBe(MythologyOverview.ENTITY_TYPES.length);
            expect(unbounded(db.issued)).toEqual([]);
            for (const q of db.issued.filter(x => !x.isDoc)) {
                expect(q.wheres).toContain('mythology');
            }
            expect(sections[0].count).toBe(30);
        });
    });

    test('"View all" is driven by the count, not by the rows fetched', async () => {
        const db = recordingFirestore({ greek: 400 }, ALL_TYPES());
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
            await db.collection('deities').get();   // no filter, no limit
            expect(unbounded(db.issued)).toHaveLength(1);
        });

        test('a limited query is not flagged', async () => {
            const db = recordingFirestore({ greek: 10 });
            await db.collection('deities').where('mythology', '==', 'greek').limit(5).get();
            expect(unbounded(db.issued)).toEqual([]);
        });
    });
});
