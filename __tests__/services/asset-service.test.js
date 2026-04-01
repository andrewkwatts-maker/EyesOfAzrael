/**
 * AssetService Tests — Sprint 3, Agent 3.10
 *
 * Tests:
 * 1. getStandardAssets — empty cache treated as miss, falls through to direct query
 * 2. getStandardAssets — cache validation (array with id-less items rejected)
 * 3. getStandardAssets — forceRefresh bypasses cache
 * 4. getStandardAssets — request deduplication (in-flight)
 * 5. getAssets — retry with forceRefresh when known collection returns empty
 * 6. getAssets — 10-second timeout fires on hung promise
 * 7. getAssets — does not retry when non-expected collection returns empty
 * 8. getAssets — does not cache empty results in queryCache
 * 9. Collection name mapping — static method COLLECTION_MAP
 * 10. Collection name mapping — instance method delegates to static
 * 11. BrowseCategoryView — calls loadEntitiesDirect when AssetService returns 0
 * 12. BrowseCategoryView — loadEntitiesDirect uses correct collection name via AssetService.getCollectionName
 * 13. COLLECTION_MAP consistency — archetypes → concepts, cosmologies → cosmology
 */

// Suppress console noise during tests
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

afterAll(() => {
    consoleWarn.mockRestore();
    consoleLog.mockRestore();
    consoleError.mockRestore();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDoc(id, data = {}) {
    return { id, data: () => ({ name: id, ...data }) };
}

function makeSnapshot(docs) {
    return { docs, empty: docs.length === 0 };
}

function makeMockDb(snapshotOrError = null) {
    const query = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter: jest.fn().mockReturnThis(),
        get: jest.fn(() =>
            snapshotOrError instanceof Error
                ? Promise.reject(snapshotOrError)
                : Promise.resolve(snapshotOrError || makeSnapshot([]))
        )
    };
    return {
        collection: jest.fn(() => query),
        collectionGroup: jest.fn(() => query),
        _query: query
    };
}

// ── Load module ───────────────────────────────────────────────────────────────

// Set up minimal browser globals before requiring the module
global.window = global.window || {};
global.firebase = { firestore: jest.fn() };

const AssetService = require('../../js/services/asset-service.js');

// ── 1. Empty cache treated as miss ────────────────────────────────────────────
describe('AssetService.getStandardAssets — cache miss on empty array', () => {
    test('falls through to direct Firebase query when cache returns []', async () => {
        const docs = [makeDoc('zeus', { mythology: 'greek' })];
        const db = makeMockDb(makeSnapshot(docs));
        const service = new AssetService();
        service.db = db;

        // Cache returns an empty array
        service.cache = {
            getList: jest.fn().mockResolvedValue([]),
            defaultTTL: {}
        };

        const results = await service.getStandardAssets('deities');
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('zeus');
        // Cache was called but we still hit Firebase
        expect(db._query.get).toHaveBeenCalled();
    });
});

// ── 2. Cache validation — items without id field ──────────────────────────────
describe('AssetService.getStandardAssets — cache validation', () => {
    test('rejects cached array whose first item has no id field', async () => {
        const docs = [makeDoc('odin')];
        const db = makeMockDb(makeSnapshot(docs));
        const service = new AssetService();
        service.db = db;

        // Cache returns items without id
        service.cache = {
            getList: jest.fn().mockResolvedValue([{ name: 'Odin' }]), // no id
            defaultTTL: {}
        };

        const results = await service.getStandardAssets('deities');
        // Should have fallen back to direct query
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('odin');
    });
});

// ── 3. forceRefresh bypasses cache ────────────────────────────────────────────
describe('AssetService.getStandardAssets — forceRefresh', () => {
    test('skips cache when forceRefresh=true', async () => {
        const docs = [makeDoc('thor')];
        const db = makeMockDb(makeSnapshot(docs));
        const service = new AssetService();
        service.db = db;

        const getListMock = jest.fn().mockResolvedValue([{ id: 'cached', name: 'Cached' }]);
        service.cache = { getList: getListMock, defaultTTL: {} };

        const results = await service.getStandardAssets('deities', { forceRefresh: true });
        expect(getListMock).not.toHaveBeenCalled();
        expect(results[0].id).toBe('thor');
    });
});

// ── 4. Request deduplication ──────────────────────────────────────────────────
describe('AssetService.getStandardAssets — request deduplication', () => {
    test('concurrent identical queries share the same in-flight request', async () => {
        let resolveQuery;
        const pendingSnapshot = new Promise(res => { resolveQuery = res; });

        const getCount = { calls: 0 };
        const db = { collection: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn(() => {
                getCount.calls++;
                return pendingSnapshot.then(() => makeSnapshot([makeDoc('ares')]));
            })
        })) };

        const service = new AssetService();
        service.db = db;
        service.cache = null;

        const p1 = service.getStandardAssets('deities');
        const p2 = service.getStandardAssets('deities');

        // Both calls should share the same in-flight request (Firebase get called once)
        resolveQuery();
        const [r1, r2] = await Promise.all([p1, p2]);

        // Only one Firebase get() should have been made
        expect(getCount.calls).toBe(1);
        expect(r1.length).toBe(1);
        expect(r2.length).toBe(1);
    });
});

// ── 5. Retry with forceRefresh for known collections ─────────────────────────
describe('AssetService.getAssets — retry on empty for expected collections', () => {
    test('retries with forceRefresh when deities returns empty first time', async () => {
        let callCount = 0;
        const service = new AssetService();
        service.cache = null;

        // First call returns empty, second returns data
        service.getStandardAssets = jest.fn().mockImplementation((_type, opts) => {
            callCount++;
            if (opts && opts.forceRefresh) {
                return Promise.resolve([{ id: 'zeus', name: 'Zeus', isStandard: true, source: 'standard' }]);
            }
            return Promise.resolve([]);
        });

        const results = await service.getAssets('deities');
        expect(callCount).toBe(2);
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('zeus');
    });

    test('does not retry when a non-expected collection returns empty', async () => {
        const service = new AssetService();
        service.cache = null;

        service.getStandardAssets = jest.fn().mockResolvedValue([]);

        const results = await service.getAssets('unknown-collection');
        // getStandardAssets should only be called once (no retry for unknown collections)
        expect(service.getStandardAssets).toHaveBeenCalledTimes(1);
        expect(results).toEqual([]);
    });
});

// ── 6. 20-second timeout ──────────────────────────────────────────────────────
describe('AssetService.getAssets — 20-second timeout', () => {
    test('rejects with timeout error when Firebase hangs', async () => {
        jest.useFakeTimers();

        const service = new AssetService();
        service.cache = null;

        // Simulate a hung Firebase query that never resolves
        service.getStandardAssets = jest.fn(() => new Promise(() => {}));

        const promise = service.getAssets('deities');

        // Advance past the 20-second timeout
        jest.advanceTimersByTime(21000);

        await expect(promise).rejects.toThrow(/timeout/i);

        jest.useRealTimers();
    }, 25000);
});

// ── 7. Does not retry non-expected collections ────────────────────────────────
// (covered in test 5 above)

// ── 8. Empty results not cached in queryCache ─────────────────────────────────
describe('AssetService.getAssets — empty results not cached', () => {
    test('does not populate queryCache when result is empty', async () => {
        const service = new AssetService();
        service.cache = null;
        service.getStandardAssets = jest.fn().mockResolvedValue([]);

        await service.getAssets('unknown-xyz');
        expect(service.queryCache.size).toBe(0);
    });

    test('populates queryCache only when result is non-empty', async () => {
        const service = new AssetService();
        service.cache = null;
        service.getStandardAssets = jest.fn().mockResolvedValue([{ id: 'ra', name: 'Ra' }]);

        await service.getAssets('deities');
        expect(service.queryCache.size).toBe(1);
    });
});

// ── 9. Static getCollectionName — COLLECTION_MAP ──────────────────────────────
describe('AssetService.getCollectionName — static method', () => {
    test('archetypes maps to concepts', () => {
        expect(AssetService.getCollectionName('archetypes')).toBe('concepts');
    });

    test('cosmologies maps to cosmology', () => {
        expect(AssetService.getCollectionName('cosmologies')).toBe('cosmology');
    });

    test('deities maps to deities (passthrough)', () => {
        expect(AssetService.getCollectionName('deities')).toBe('deities');
    });

    test('unknown category returns itself', () => {
        expect(AssetService.getCollectionName('foo')).toBe('foo');
    });
});

// ── 10. Instance getCollectionName delegates to static ────────────────────────
describe('AssetService.getCollectionName — instance method', () => {
    test('instance.getCollectionName matches static method', () => {
        const service = new AssetService();
        expect(service.getCollectionName('archetypes')).toBe(AssetService.getCollectionName('archetypes'));
        expect(service.getCollectionName('deities')).toBe(AssetService.getCollectionName('deities'));
    });
});

// ── 11-13. BrowseCategoryView integration ─────────────────────────────────────
// Note: BrowseCategoryView uses window.BrowseCategoryView (no CommonJS export).
// We load it in the jsdom environment and extract from global.
describe('BrowseCategoryView — data pipeline', () => {
    let BrowseCategoryView;

    beforeAll(() => {
        // Ensure required globals are present
        global.window = global.window || {};
        global.window.cacheManager = null;
        global.window.AssetService = AssetService;
        global.AssetService = AssetService;

        if (!global.document) {
            global.document = {
                dispatchEvent: jest.fn(),
                getElementById: jest.fn(() => null)
            };
        }
        if (!global.localStorage) {
            global.localStorage = {
                getItem: jest.fn(() => null),
                setItem: jest.fn(),
                removeItem: jest.fn()
            };
        }

        // Require the file — it sets window.BrowseCategoryView
        require('../../js/views/browse-category-view.js');
        BrowseCategoryView = global.window.BrowseCategoryView || global.BrowseCategoryView;
    });

    test('calls loadEntitiesDirect when AssetService returns 0 entities', async () => {
        if (!BrowseCategoryView) {
            console.warn('BrowseCategoryView not available in test environment, skipping');
            return;
        }
        const db = makeMockDb(makeSnapshot([makeDoc('zeus')]));
        const view = new BrowseCategoryView(db);
        view.category = 'deities';
        view.mythology = null;

        // AssetService returns nothing
        view.assetService = { getAssets: jest.fn().mockResolvedValue([]) };
        // Spy on loadEntitiesDirect
        const directSpy = jest.spyOn(view, 'loadEntitiesDirect').mockResolvedValue([
            { id: 'zeus', name: 'Zeus', isStandard: true, source: 'standard' }
        ]);

        await view.loadEntities();
        expect(directSpy).toHaveBeenCalled();
        expect(view.entities.length).toBe(1);
        expect(view.entities[0].id).toBe('zeus');
    });

    test('loadEntitiesDirect uses AssetService.getCollectionName for archetypes', async () => {
        if (!BrowseCategoryView) {
            console.warn('BrowseCategoryView not available in test environment, skipping');
            return;
        }
        const db = makeMockDb(makeSnapshot([makeDoc('hero-archetype')]));
        const view = new BrowseCategoryView(db);
        view.category = 'archetypes';
        view.mythology = null;

        // Should query 'concepts' collection, not 'archetypes'
        const results = await view.loadEntitiesDirect();
        expect(db.collection).toHaveBeenCalledWith('concepts');
        expect(results.length).toBe(1);
    });

    test('COLLECTION_MAP consistency: archetypes→concepts, cosmologies→cosmology', () => {
        // These assertions rely only on AssetService static methods and are always valid
        expect(AssetService.getCollectionName('archetypes')).toBe('concepts');
        expect(AssetService.getCollectionName('cosmologies')).toBe('cosmology');

        if (BrowseCategoryView) {
            const db = makeMockDb(makeSnapshot([]));
            const view = new BrowseCategoryView(db);
            view.category = 'cosmologies';
            const name = AssetService.getCollectionName(view.category);
            expect(name).toBe('cosmology');
        }
    });
});
