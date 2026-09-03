/**
 * AssetService — the static + delta path
 *
 * This is the correctness core of the whole static-base design: the page shows
 * a baked snapshot patched with everything Firestore has changed since. Every
 * failure here is silent by construction — a wrong facet field, a saturated
 * delta query or a missing index all look exactly like "nothing has changed" —
 * so the tests below are mostly about what gets *said* when something is wrong,
 * not just what gets returned.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

window.DOMAINS = require('../../js/config/domains.js');

/** A Firestore stub recording the query it was asked to build. */
function firestoreStub(docs = [], { throws = null } = {}) {
    const calls = { collection: null, where: [], limit: null };

    const query = {
        where: jest.fn((field, op, value) => {
            calls.where.push({ field, op, value });
            return query;
        }),
        limit: jest.fn(n => { calls.limit = n; return query; }),
        get: jest.fn(() => {
            if (throws) return Promise.reject(throws);
            return Promise.resolve({
                docs: docs.map(d => ({ id: d.id, data: () => d })),
                empty: docs.length === 0,
            });
        }),
        orderBy: jest.fn(() => query),
    };

    return {
        calls,
        db: {
            collection: jest.fn(name => { calls.collection = name; return query; }),
        },
    };
}

/** A base loader stub returning a fixed base map and epoch. */
function loaderStub(entities = [], generatedAt = '2026-08-30T06:05:03.548Z') {
    return {
        load: jest.fn(async () => new Map(entities.map(e => [String(e.id), e]))),
        getGeneratedAt: jest.fn(async () => generatedAt),
        getManifest: jest.fn(async () => ({ collections: {} })),
    };
}

let AssetService;

beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    global.firebase = { firestore: () => ({ collection: () => ({}) }) };
    window.cacheManager = null;
    window.FEATURES = { ENTITY_SOURCE: 'static+delta' };
    AssetService = require('../../js/services/asset-service.js');
});

describe('_fetchDeltas — which field it filters on', () => {
    test('filters mythology collections on `mythology`', async () => {
        const { db, calls } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;

        await service._fetchDeltas('deities', 'greek', loaderStub());

        expect(calls.where.map(w => w.field)).toEqual(['updatedAt', 'mythology']);
    });

    test('filters history collections on `era`, not `mythology`', async () => {
        // Filtering the wrong field returns nothing and is indistinguishable
        // from "no changes since the bake" — every recent history edit would
        // just quietly not appear.
        const { db, calls } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;

        await service._fetchDeltas('hist_events', 'medieval', loaderStub());

        expect(calls.where.map(w => w.field)).toEqual(['updatedAt', 'era']);
    });

    test('filters conspiracy collections on `category`', async () => {
        const { db, calls } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;

        await service._fetchDeltas('con_theories', 'political', loaderStub());

        expect(calls.where.map(w => w.field)).toEqual(['updatedAt', 'category']);
    });

    test('adds no facet filter when none was requested', async () => {
        const { db, calls } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;

        await service._fetchDeltas('deities', null, loaderStub());

        expect(calls.where.map(w => w.field)).toEqual(['updatedAt']);
    });

    test('compares updatedAt against the base epoch as a Date', async () => {
        // The query is `where('updatedAt', '>', date)`. Passing the ISO string
        // instead never matches a Timestamp field.
        const { db, calls } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;

        await service._fetchDeltas('deities', null, loaderStub([], '2026-08-30T06:05:03.548Z'));

        const clause = calls.where.find(w => w.field === 'updatedAt');
        expect(clause.op).toBe('>');
        expect(clause.value).toBeInstanceOf(Date);
        expect(clause.value.toISOString()).toBe('2026-08-30T06:05:03.548Z');
    });
});

describe('_fetchDeltas — failure modes that would otherwise be silent', () => {
    test('shouts when the delta query saturates its cap', async () => {
        // At the cap there is no way to know how many changes were dropped, and
        // the dropped ones are simply missing from the page.
        const docs = Array.from({ length: 200 }, (_, i) => ({ id: `d${i}` }));
        const { db } = firestoreStub(docs);
        const service = new AssetService();
        service.db = db;

        const deltas = await service._fetchDeltas('deities', null, loaderStub());

        expect(deltas).toHaveLength(200);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('cap'));
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('needs regenerating'));
    });

    test('stays quiet below the cap', async () => {
        const { db } = firestoreStub([{ id: 'a' }]);
        const service = new AssetService();
        service.db = db;

        await service._fetchDeltas('deities', null, loaderStub());

        expect(console.error).not.toHaveBeenCalled();
    });

    test('reports a missing composite index instead of swallowing it', async () => {
        // A missing index degrades the page to base-only, so every edit since
        // the last bake vanishes. Without this the failure is completely mute.
        const err = Object.assign(new Error('The query requires an index.'), {
            code: 'failed-precondition',
        });
        const { db } = firestoreStub([], { throws: err });
        const service = new AssetService();
        service.db = db;

        const deltas = await service._fetchDeltas('deities', null, loaderStub());

        expect(deltas).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('composite index'));
    });

    test('other query errors are non-blocking and warned about', async () => {
        const { db } = firestoreStub([], { throws: new Error('offline') });
        const service = new AssetService();
        service.db = db;

        expect(await service._fetchDeltas('deities', null, loaderStub())).toEqual([]);
        expect(console.warn).toHaveBeenCalled();
    });

    test('returns nothing when there is no base epoch to compare against', async () => {
        const { db } = firestoreStub([{ id: 'a' }]);
        const service = new AssetService();
        service.db = db;

        const loader = loaderStub([], null);
        expect(await service._fetchDeltas('deities', null, loader)).toEqual([]);
    });

    test('returns nothing without a database', async () => {
        const service = new AssetService();
        service.db = null;

        expect(await service._fetchDeltas('deities', null, loaderStub())).toEqual([]);
    });
});

describe('_executeStaticDeltaQuery — merging base with deltas', () => {
    test('a delta overrides the base entry of the same id', async () => {
        const { db } = firestoreStub([{ id: 'zeus', name: 'Zeus (edited)' }]);
        const service = new AssetService();
        service.db = db;
        window.entityBaseLoader = loaderStub([
            { id: 'zeus', name: 'Zeus' },
            { id: 'hera', name: 'Hera' },
        ]);

        const results = await service._executeStaticDeltaQuery('deities', {});

        expect(results).toHaveLength(2);
        expect(results.find(e => e.id === 'zeus').name).toBe('Zeus (edited)');
    });

    test('a delta for an id absent from the base is added', async () => {
        const { db } = firestoreStub([{ id: 'new', name: 'Newcomer' }]);
        const service = new AssetService();
        service.db = db;
        window.entityBaseLoader = loaderStub([{ id: 'zeus', name: 'Zeus' }]);

        const results = await service._executeStaticDeltaQuery('deities', {});

        expect(results.map(e => e.id).sort()).toEqual(['new', 'zeus']);
    });

    test('results are ordered and capped by the requested limit', async () => {
        const { db } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;
        window.entityBaseLoader = loaderStub([
            { id: 'c', name: 'Ceres' },
            { id: 'a', name: 'Apollo' },
            { id: 'b', name: 'Bacchus' },
        ]);

        const results = await service._executeStaticDeltaQuery('deities', { limit: 2 });

        expect(results.map(e => e.name)).toEqual(['Apollo', 'Bacchus']);
    });

    test('maps a URL category to its Firebase collection', async () => {
        const { db } = firestoreStub([]);
        const service = new AssetService();
        service.db = db;
        const loader = loaderStub([]);
        window.entityBaseLoader = loader;

        await service._executeStaticDeltaQuery('archetypes', {});

        expect(loader.load).toHaveBeenCalledWith('concepts', null);
    });

    test('falls back to Firestore when the loader is missing', async () => {
        const service = new AssetService();
        service.db = firestoreStub([]).db;
        window.entityBaseLoader = null;

        const spy = jest.spyOn(service, '_executeFirestoreQuery').mockResolvedValue(['fallback']);

        expect(await service._executeStaticDeltaQuery('deities', {})).toEqual(['fallback']);
        expect(spy).toHaveBeenCalled();
    });

    test('falls back to Firestore when the base cannot be loaded', async () => {
        const service = new AssetService();
        service.db = firestoreStub([]).db;
        window.entityBaseLoader = {
            load: jest.fn(async () => { throw new Error('404'); }),
            getGeneratedAt: jest.fn(async () => null),
        };

        const spy = jest.spyOn(service, '_executeFirestoreQuery').mockResolvedValue(['fallback']);

        expect(await service._executeStaticDeltaQuery('deities', {})).toEqual(['fallback']);
        expect(spy).toHaveBeenCalled();
    });

    test('falls back when the base loads as null rather than treating it as empty', async () => {
        // An empty result and "no base at all" mean different things: the first
        // is a real answer, the second must not render as "nothing found".
        const service = new AssetService();
        service.db = firestoreStub([]).db;
        window.entityBaseLoader = {
            load: jest.fn(async () => null),
            getGeneratedAt: jest.fn(async () => null),
        };

        const spy = jest.spyOn(service, '_executeFirestoreQuery').mockResolvedValue(['fallback']);

        expect(await service._executeStaticDeltaQuery('deities', {})).toEqual(['fallback']);
        expect(spy).toHaveBeenCalled();
    });
});

describe('getCollectionName', () => {
    test('maps the known aliases and passes everything else through', () => {
        const service = new AssetService();

        expect(service.getCollectionName('archetypes')).toBe('concepts');
        expect(service.getCollectionName('cosmologies')).toBe('cosmology');
        expect(service.getCollectionName('deities')).toBe('deities');
        expect(service.getCollectionName('hist_figures')).toBe('hist_figures');
    });
});
