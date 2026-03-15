/**
 * Firebase Cache Manager Tests
 * Tests for js/firebase-cache-manager.js
 */

describe('FirebaseCacheManager', () => {
    let FirebaseCacheManager;
    let cache;

    beforeEach(() => {
        // Set cache version so checkCacheVersion doesn't clear
        localStorage.setItem('cache_version', '2.0.0');

        FirebaseCacheManager = require('../../js/firebase-cache-manager.js');
        cache = new FirebaseCacheManager({ db: null });
    });

    afterEach(() => {
        cache = null;
    });

    describe('constructor', () => {
        test('should initialize with default TTL values', () => {
            expect(cache.defaultTTL.mythologies).toBe(86400000);
            expect(cache.defaultTTL.entities).toBe(300000);
            expect(cache.defaultTTL.temporary).toBe(60000);
        });

        test('should initialize empty memory cache', () => {
            expect(cache.memoryCache.size).toBe(0);
        });

        test('should initialize metrics', () => {
            expect(cache.metrics.hits).toBe(0);
            expect(cache.metrics.misses).toBe(0);
            expect(cache.metrics.sets).toBe(0);
        });

        test('should have correct cache version', () => {
            expect(cache.CACHE_VERSION).toBe('2.0.0');
        });
    });

    describe('generateKey()', () => {
        test('should create key from collection and id', () => {
            expect(cache.generateKey('deities', 'zeus')).toBe('cache_deities_zeus');
        });

        test('should handle special characters', () => {
            expect(cache.generateKey('items', 'mjolnir-hammer')).toBe('cache_items_mjolnir-hammer');
        });
    });

    describe('generateListKey()', () => {
        test('should create key with filters', () => {
            const key = cache.generateListKey('deities', { mythology: 'greek' });
            expect(key).toContain('cache_list_deities_');
            expect(key).toContain('mythology:greek');
        });

        test('should include orderBy and limit', () => {
            const key = cache.generateListKey('deities', {}, { orderBy: 'name asc', limit: 10 });
            expect(key).toContain('name asc');
            expect(key).toContain('10');
        });

        test('should sort filter keys for deterministic keys', () => {
            const key1 = cache.generateListKey('deities', { a: '1', b: '2' });
            const key2 = cache.generateListKey('deities', { b: '2', a: '1' });
            expect(key1).toBe(key2);
        });
    });

    describe('getDefaultTTL()', () => {
        test('should return collection-specific TTL', () => {
            expect(cache.getDefaultTTL('mythologies')).toBe(86400000);
            expect(cache.getDefaultTTL('deities')).toBe(1800000);
        });

        test('should return temporary TTL for unknown collections', () => {
            expect(cache.getDefaultTTL('unknown_collection')).toBe(60000);
        });
    });

    describe('isExpired()', () => {
        test('should return true for null entry', () => {
            expect(cache.isExpired(null, 60000)).toBe(true);
        });

        test('should return true for entry without timestamp', () => {
            expect(cache.isExpired({ data: 'test' }, 60000)).toBe(true);
        });

        test('should return false for fresh entry', () => {
            const entry = { timestamp: Date.now(), ttl: 60000, data: 'test' };
            expect(cache.isExpired(entry, 60000)).toBe(false);
        });

        test('should return true for expired entry', () => {
            const entry = { timestamp: Date.now() - 120000, ttl: 60000, data: 'test' };
            expect(cache.isExpired(entry, 60000)).toBe(true);
        });

        test('should use entry ttl over fallback', () => {
            const entry = { timestamp: Date.now() - 30000, ttl: 60000, data: 'test' };
            // fallbackTTL is 1ms (expired), but entry.ttl is 60000 (not expired)
            expect(cache.isExpired(entry, 1)).toBe(false);
        });
    });

    describe('set()', () => {
        test('should store data in memory cache', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const key = cache.generateKey('deities', 'zeus');
            const entry = cache.memoryCache.get(key);
            expect(entry).toBeDefined();
            expect(entry.data.name).toBe('Zeus');
            expect(entry.timestamp).toBeDefined();
        });

        test('should store data in sessionStorage', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const key = cache.generateKey('deities', 'zeus');
            const stored = JSON.parse(sessionStorage.getItem(key));
            expect(stored.data.name).toBe('Zeus');
        });

        test('should store data in localStorage', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const key = cache.generateKey('deities', 'zeus');
            const stored = JSON.parse(localStorage.getItem(key));
            expect(stored.data.name).toBe('Zeus');
        });

        test('should increment sets metric', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            expect(cache.metrics.sets).toBe(1);
        });
    });

    describe('getFromMemory()', () => {
        test('should return cached data', () => {
            const key = 'cache_test_key';
            cache.memoryCache.set(key, { data: 'test', timestamp: Date.now() });
            expect(cache.getFromMemory(key)).toBeDefined();
        });

        test('should return undefined for missing key', () => {
            expect(cache.getFromMemory('nonexistent')).toBeUndefined();
        });
    });

    describe('getFromSessionStorage()', () => {
        test('should return parsed data', () => {
            sessionStorage.setItem('test_key', JSON.stringify({ data: 'test' }));
            const result = cache.getFromSessionStorage('test_key');
            expect(result.data).toBe('test');
        });

        test('should return null for missing key', () => {
            expect(cache.getFromSessionStorage('nonexistent')).toBeNull();
        });

        test('should handle corrupt data gracefully', () => {
            sessionStorage.setItem('bad_key', 'not-json{{{');
            expect(cache.getFromSessionStorage('bad_key')).toBeNull();
        });
    });

    describe('getFromLocalStorage()', () => {
        test('should return parsed data', () => {
            localStorage.setItem('test_key', JSON.stringify({ data: 'test' }));
            const result = cache.getFromLocalStorage('test_key');
            expect(result.data).toBe('test');
        });

        test('should return null for missing key', () => {
            expect(cache.getFromLocalStorage('nonexistent')).toBeNull();
        });
    });

    describe('invalidate()', () => {
        test('should remove specific entry from all layers', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const key = cache.generateKey('deities', 'zeus');

            cache.invalidate('deities', 'zeus');

            expect(cache.memoryCache.get(key)).toBeUndefined();
            expect(sessionStorage.getItem(key)).toBeNull();
            expect(localStorage.getItem(key)).toBeNull();
        });

        test('should return invalidated keys', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const keys = cache.invalidate('deities', 'zeus');
            expect(keys).toContain('cache_deities_zeus');
        });

        test('should invalidate entire collection when no id given', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            await cache.set('deities', 'athena', { name: 'Athena' });

            const keys = cache.invalidate('deities');
            expect(keys.length).toBeGreaterThanOrEqual(2);
            expect(cache.memoryCache.size).toBe(0);
        });

        test('should cascade to dependent caches', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            await cache.set('deities', 'athena', { name: 'Athena' });

            const sourceKey = cache.generateKey('deities', 'zeus');
            const depKey = cache.generateKey('deities', 'athena');
            cache.addDependency(sourceKey, depKey);

            const keys = cache.invalidate('deities', 'zeus');
            expect(keys).toContain(depKey);
        });

        test('should increment invalidations metric', () => {
            cache.invalidate('deities', 'zeus');
            expect(cache.metrics.invalidations).toBe(1);
        });

        test('should notify invalidation listeners', async () => {
            const listener = jest.fn();
            cache.onInvalidate(listener);
            cache.invalidate('deities', 'zeus');
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                collection: 'deities',
                id: 'zeus'
            }));
        });
    });

    describe('addDependency() / removeDependency()', () => {
        test('should add dependency between keys', () => {
            cache.addDependency('source', 'dependent');
            expect(cache.cacheDependencies.get('source').has('dependent')).toBe(true);
        });

        test('should remove dependency', () => {
            cache.addDependency('source', 'dependent');
            cache.removeDependency('source', 'dependent');
            expect(cache.cacheDependencies.has('source')).toBe(false);
        });

        test('should handle removing from non-existent source', () => {
            expect(() => cache.removeDependency('nope', 'nah')).not.toThrow();
        });
    });

    describe('onInvalidate()', () => {
        test('should return unsubscribe function', () => {
            const listener = jest.fn();
            const unsub = cache.onInvalidate(listener);
            expect(typeof unsub).toBe('function');

            cache.invalidate('test');
            expect(listener).toHaveBeenCalledTimes(1);

            unsub();
            cache.invalidate('test');
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('batchInvalidate()', () => {
        test('should invalidate multiple items', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            await cache.set('heroes', 'hercules', { name: 'Hercules' });

            const keys = cache.batchInvalidate([
                { collection: 'deities', id: 'zeus' },
                { collection: 'heroes', id: 'hercules' }
            ]);

            expect(keys.length).toBe(2);
        });
    });

    describe('invalidateByPattern()', () => {
        test('should invalidate matching memory entries', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            await cache.set('heroes', 'hercules', { name: 'Hercules' });

            const count = cache.invalidateByPattern(/deities/);
            expect(count).toBeGreaterThanOrEqual(1);
            expect(cache.memoryCache.has('cache_deities_zeus')).toBe(false);
            expect(cache.memoryCache.has('cache_heroes_hercules')).toBe(true);
        });

        test('should accept string pattern', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const count = cache.invalidateByPattern('deities');
            expect(count).toBeGreaterThanOrEqual(1);
        });
    });

    describe('clearAll()', () => {
        test('should clear memory cache', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            cache.clearAll();
            expect(cache.memoryCache.size).toBe(0);
        });

        test('should clear dependencies', () => {
            cache.addDependency('a', 'b');
            cache.clearAll();
            expect(cache.cacheDependencies.size).toBe(0);
        });
    });

    describe('clearStorageByPrefix()', () => {
        test('should remove matching keys from storage', () => {
            localStorage.setItem('cache_test_1', 'data1');
            localStorage.setItem('cache_test_2', 'data2');
            localStorage.setItem('other_key', 'data3');

            cache.clearStorageByPrefix(localStorage, 'cache_test_');

            expect(localStorage.getItem('cache_test_1')).toBeNull();
            expect(localStorage.getItem('cache_test_2')).toBeNull();
            expect(localStorage.getItem('other_key')).toBe('data3');
        });
    });

    describe('recordHit() / recordMiss() / recordQuery()', () => {
        test('should increment hit count', () => {
            cache.recordHit(performance.now());
            expect(cache.metrics.hits).toBe(1);
        });

        test('should increment miss count', () => {
            cache.recordMiss();
            expect(cache.metrics.misses).toBe(1);
        });

        test('should track query response time', () => {
            cache.recordQuery(100);
            cache.recordQuery(200);
            expect(cache.metrics.queries).toBe(2);
            expect(cache.metrics.totalResponseTime).toBe(300);
            expect(cache.metrics.avgResponseTime).toBe(150);
        });
    });

    describe('getStats()', () => {
        test('should return hit rate', () => {
            cache.metrics.hits = 7;
            cache.metrics.misses = 3;
            const stats = cache.getStats();
            expect(stats.hitRate).toBe('70.00%');
        });

        test('should return 0 hit rate when no queries', () => {
            const stats = cache.getStats();
            expect(stats.hitRate).toBe('0%');
        });

        test('should include memory cache size', async () => {
            await cache.set('deities', 'zeus', { name: 'Zeus' });
            const stats = cache.getStats();
            expect(stats.memoryCacheSize).toBe(1);
        });
    });

    describe('saveMetrics() / loadMetrics()', () => {
        test('should persist and restore metrics', () => {
            cache.metrics.hits = 42;
            cache.metrics.misses = 10;
            cache.saveMetrics();

            const cache2 = new FirebaseCacheManager({ db: null });
            expect(cache2.metrics.hits).toBe(42);
            expect(cache2.metrics.misses).toBe(10);
        });
    });

    describe('checkCacheVersion()', () => {
        test('should clear cache on version mismatch', () => {
            localStorage.setItem('cache_version', '1.0.0');
            const spy = jest.spyOn(FirebaseCacheManager.prototype, 'clearAll');
            const newCache = new FirebaseCacheManager({ db: null });
            expect(spy).toHaveBeenCalled();
            expect(localStorage.getItem('cache_version')).toBe('2.0.0');
            spy.mockRestore();
        });

        test('should not clear cache on matching version', () => {
            localStorage.setItem('cache_version', '2.0.0');
            const spy = jest.spyOn(FirebaseCacheManager.prototype, 'clearAll');
            const newCache = new FirebaseCacheManager({ db: null });
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('isOnline()', () => {
        test('should return navigator.onLine', () => {
            Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
            expect(cache.isOnline()).toBe(true);
        });
    });

    describe('invalidateListCaches()', () => {
        test('should clear list caches for collection', async () => {
            const listKey = 'cache_list_deities_mythology:greek_default_20';
            cache.memoryCache.set(listKey, { data: [], timestamp: Date.now() });
            sessionStorage.setItem(listKey, JSON.stringify({ data: [] }));

            cache.invalidateListCaches('deities');
            expect(cache.memoryCache.has(listKey)).toBe(false);
        });
    });

    describe('destroy()', () => {
        test('should clear all state and save metrics', () => {
            cache.addDependency('a', 'b');
            const listener = jest.fn();
            cache.onInvalidate(listener);

            cache.destroy();
            expect(cache.memoryCache.size).toBe(0);
            expect(cache.invalidationListeners.size).toBe(0);
        });
    });

    describe('get() with memory hit', () => {
        test('should return from memory cache on hit', async () => {
            const key = cache.generateKey('deities', 'zeus');
            cache.memoryCache.set(key, {
                data: { name: 'Zeus' },
                timestamp: Date.now(),
                ttl: 300000
            });

            const result = await cache.get('deities', 'zeus');
            expect(result.name).toBe('Zeus');
            expect(cache.metrics.hits).toBe(1);
        });
    });

    describe('clearOldestEntries()', () => {
        test('should remove oldest 25% of entries', () => {
            for (let i = 0; i < 8; i++) {
                localStorage.setItem(`cache_item_${i}`, JSON.stringify({
                    data: `item-${i}`,
                    timestamp: Date.now() - (8 - i) * 1000
                }));
            }

            cache.clearOldestEntries(localStorage);

            // Should have removed 2 (25% of 8)
            let remaining = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cache_item_')) remaining++;
            }
            expect(remaining).toBe(6);
        });
    });

    describe('get() with session storage hit', () => {
        test('should return from sessionStorage and promote to memory', async () => {
            const key = cache.generateKey('deities', 'athena');
            const entry = { data: { name: 'Athena' }, timestamp: Date.now(), ttl: 300000 };
            sessionStorage.setItem(key, JSON.stringify(entry));

            const result = await cache.get('deities', 'athena');
            expect(result.name).toBe('Athena');
            expect(cache.metrics.hits).toBe(1);
            expect(cache.memoryCache.has(key)).toBe(true);
        });
    });

    describe('get() with localStorage hit', () => {
        test('should return from localStorage and promote to memory+session', async () => {
            const key = cache.generateKey('creatures', 'minotaur');
            const entry = { data: { name: 'Minotaur' }, timestamp: Date.now(), ttl: 300000 };
            localStorage.setItem(key, JSON.stringify(entry));

            const result = await cache.get('creatures', 'minotaur');
            expect(result.name).toBe('Minotaur');
            expect(cache.metrics.hits).toBe(1);
            expect(cache.memoryCache.has(key)).toBe(true);
        });
    });

    describe('get() with forceRefresh', () => {
        test('should skip cache when forceRefresh is true', async () => {
            const key = cache.generateKey('deities', 'zeus');
            cache.memoryCache.set(key, {
                data: { name: 'Zeus - cached' },
                timestamp: Date.now(),
                ttl: 300000
            });

            // Without db, this will throw
            await expect(cache.get('deities', 'zeus', { forceRefresh: true })).rejects.toThrow();
            expect(cache.metrics.misses).toBe(1);
        });
    });

    describe('fetchFromFirebase()', () => {
        test('should throw when db not initialized', async () => {
            await expect(cache.fetchFromFirebase('deities', 'zeus')).rejects.toThrow('Firebase Firestore not initialized');
        });

        test('should return null for non-existent document', async () => {
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({ exists: false }))
                    }))
                }))
            };
            const result = await cache.fetchFromFirebase('deities', 'nonexistent');
            expect(result).toBeNull();
        });

        test('should return document data', async () => {
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({
                            exists: true,
                            id: 'zeus',
                            data: () => ({ name: 'Zeus', type: 'deity' })
                        }))
                    }))
                }))
            };
            const result = await cache.fetchFromFirebase('deities', 'zeus');
            expect(result.name).toBe('Zeus');
            expect(result.id).toBe('zeus');
        });

        test('should serve stale cache when offline and fetch fails', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.reject(new Error('offline')))
                    }))
                }))
            };

            // Put stale data in memory
            const key = cache.generateKey('deities', 'zeus');
            cache.memoryCache.set(key, {
                data: { name: 'Zeus - stale' },
                timestamp: Date.now() - 999999,
                ttl: 1
            });

            const result = await cache.fetchFromFirebase('deities', 'zeus');
            expect(result.name).toBe('Zeus - stale');
            expect(cache.metrics.staleFallbacks).toBe(1);
        });

        test('should throw when offline with no stale data', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.reject(new Error('offline')))
                    }))
                }))
            };

            await expect(cache.fetchFromFirebase('deities', 'unknown')).rejects.toThrow('offline');
        });
    });

    describe('getList()', () => {
        let mockDb;

        beforeEach(() => {
            const mockQuery = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                startAfter: jest.fn().mockReturnThis(),
                get: jest.fn(() => Promise.resolve({
                    docs: [
                        { id: 'zeus', data: () => ({ name: 'Zeus' }) },
                        { id: 'athena', data: () => ({ name: 'Athena' }) }
                    ]
                }))
            };
            mockDb = {
                collection: jest.fn(() => mockQuery)
            };
        });

        test('should fetch list from Firebase', async () => {
            cache.db = mockDb;
            const result = await cache.getList('deities', { mythology: 'greek' });
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Zeus');
        });

        test('should cache list results', async () => {
            cache.db = mockDb;
            await cache.getList('deities', { mythology: 'greek' });
            const key = cache.generateListKey('deities', { mythology: 'greek' });
            expect(cache.memoryCache.has(key)).toBe(true);
        });

        test('should return cached list on second call', async () => {
            cache.db = mockDb;
            await cache.getList('deities', { mythology: 'greek' });
            const result = await cache.getList('deities', { mythology: 'greek' });
            expect(result).toHaveLength(2);
            // Should have only called Firebase once
            expect(mockDb.collection).toHaveBeenCalledTimes(1);
        });

        test('should apply filters', async () => {
            cache.db = mockDb;
            await cache.getList('deities', { mythology: 'greek', type: 'olympian' });
            const col = mockDb.collection('deities');
            expect(col.where).toHaveBeenCalledWith('mythology', '==', 'greek');
        });

        test('should apply ordering', async () => {
            cache.db = mockDb;
            await cache.getList('deities', {}, { orderBy: 'name asc' });
            const col = mockDb.collection('deities');
            expect(col.orderBy).toHaveBeenCalledWith('name', 'asc');
        });

        test('should apply limit', async () => {
            cache.db = mockDb;
            await cache.getList('deities', {}, { limit: 5 });
            const col = mockDb.collection('deities');
            expect(col.limit).toHaveBeenCalledWith(5);
        });

        test('should serve stale list when offline', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
            const failDb = {
                collection: jest.fn(() => ({
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis(),
                    get: jest.fn(() => Promise.reject(new Error('offline')))
                }))
            };
            cache.db = failDb;

            // Put stale list in memory
            const key = cache.generateListKey('deities', {});
            cache.memoryCache.set(key, {
                data: [{ id: 'zeus', name: 'Zeus' }],
                timestamp: Date.now() - 999999,
                ttl: 1
            });

            const result = await cache.getList('deities', {});
            expect(result).toHaveLength(1);
            expect(cache.metrics.staleFallbacks).toBe(1);
        });

        test('should force refresh when option is set', async () => {
            cache.db = mockDb;
            // Pre-cache a list
            const key = cache.generateListKey('deities', {});
            cache.memoryCache.set(key, {
                data: [{ id: 'old', name: 'Old' }],
                timestamp: Date.now(),
                ttl: 300000
            });
            const result = await cache.getList('deities', {}, { forceRefresh: true });
            expect(result).toHaveLength(2);
            expect(mockDb.collection).toHaveBeenCalled();
        });
    });

    describe('getMetadata()', () => {
        test('should fetch metadata with id', async () => {
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({
                            exists: true,
                            data: () => ({ count: 42 })
                        }))
                    }))
                }))
            };
            const result = await cache.getMetadata('deity_count', 'greek');
            expect(result.count).toBe(42);
        });

        test('should fetch metadata without id', async () => {
            cache.db = {
                collection: jest.fn(() => ({
                    where: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({
                            docs: [{ data: () => ({ count: 10 }) }]
                        }))
                    }))
                }))
            };
            const result = await cache.getMetadata('counts');
            expect(result).toHaveLength(1);
        });

        test('should cache metadata result', async () => {
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({
                            exists: true,
                            data: () => ({ count: 5 })
                        }))
                    }))
                }))
            };
            await cache.getMetadata('test', 'id1');
            const key = 'cache_metadata_test_id1';
            expect(cache.memoryCache.has(key)).toBe(true);
        });

        test('should return cached metadata on second call', async () => {
            const key = 'cache_metadata_test';
            cache.memoryCache.set(key, {
                data: { count: 99 },
                timestamp: Date.now(),
                ttl: 86400000
            });
            const result = await cache.getMetadata('test');
            expect(result.count).toBe(99);
            expect(cache.metrics.hits).toBe(1);
        });

        test('should return null on fetch error when online', async () => {
            Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.reject(new Error('fail')))
                    }))
                }))
            };
            const result = await cache.getMetadata('test', 'id1');
            expect(result).toBeNull();
        });
    });

    describe('getWithRevalidate()', () => {
        test('should return fresh cached data without revalidating', async () => {
            const key = cache.generateKey('deities', 'zeus');
            cache.memoryCache.set(key, {
                data: { name: 'Zeus' },
                timestamp: Date.now(),
                ttl: 300000
            });
            const result = await cache.getWithRevalidate('deities', 'zeus');
            expect(result.name).toBe('Zeus');
        });

        test('should return stale data and revalidate in background', async () => {
            const key = cache.generateKey('deities', 'zeus');
            cache.memoryCache.set(key, {
                data: { name: 'Zeus - stale' },
                timestamp: Date.now() - 999999,
                ttl: 1
            });
            // Mock fetchFromFirebase to avoid actually calling Firebase
            cache.fetchFromFirebase = jest.fn().mockResolvedValue({ name: 'Zeus - fresh' });
            const result = await cache.getWithRevalidate('deities', 'zeus');
            expect(result.name).toBe('Zeus - stale');
            expect(cache.metrics.staleFallbacks).toBe(1);
        });

        test('should fall back to get() when no cached data', async () => {
            cache.db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({
                            exists: true,
                            id: 'zeus',
                            data: () => ({ name: 'Zeus' })
                        }))
                    }))
                }))
            };
            const result = await cache.getWithRevalidate('deities', 'zeus');
            expect(result.name).toBe('Zeus');
        });
    });

    describe('clearStaleEntries()', () => {
        test('should remove expired memory entries', () => {
            cache.memoryCache.set('cache_old', {
                data: 'old',
                timestamp: Date.now() - 999999,
                ttl: 1
            });
            cache.memoryCache.set('cache_fresh', {
                data: 'fresh',
                timestamp: Date.now(),
                ttl: 999999
            });
            const count = cache.clearStaleEntries();
            expect(count).toBeGreaterThanOrEqual(1);
            expect(cache.memoryCache.has('cache_old')).toBe(false);
            expect(cache.memoryCache.has('cache_fresh')).toBe(true);
        });

        test('should remove expired session entries', () => {
            sessionStorage.setItem('cache_expired', JSON.stringify({
                data: 'old',
                timestamp: Date.now() - 999999,
                ttl: 1
            }));
            cache.clearStaleEntries();
            expect(sessionStorage.getItem('cache_expired')).toBeNull();
        });

        test('should remove expired localStorage entries', () => {
            localStorage.setItem('cache_expired_local', JSON.stringify({
                data: 'old',
                timestamp: Date.now() - 999999,
                ttl: 1
            }));
            cache.clearStaleEntries();
            expect(localStorage.getItem('cache_expired_local')).toBeNull();
        });

        test('should remove invalid JSON entries from sessionStorage', () => {
            sessionStorage.setItem('cache_bad_json', 'not{json');
            cache.clearStaleEntries();
            expect(sessionStorage.getItem('cache_bad_json')).toBeNull();
        });
    });

    describe('getCacheHealth()', () => {
        test('should return health stats', () => {
            cache.memoryCache.set('cache_a', {
                data: 'fresh',
                timestamp: Date.now(),
                ttl: 999999
            });
            cache.memoryCache.set('cache_b', {
                data: 'expired',
                timestamp: Date.now() - 999999,
                ttl: 1
            });
            const health = cache.getCacheHealth();
            expect(health.memoryEntries).toBe(2);
            expect(health.totalEntries).toBe(2);
            expect(health.freshEntries).toBe(1);
            expect(health.expiredEntries).toBe(1);
            expect(health.storageSizeKB).toBeDefined();
            expect(typeof health.healthy).toBe('boolean');
        });

        test('should be healthy when few expired', () => {
            cache.memoryCache.set('cache_a', {
                data: 'fresh',
                timestamp: Date.now(),
                ttl: 999999
            });
            const health = cache.getCacheHealth();
            expect(health.healthy).toBe(true);
        });
    });

    describe('printStats()', () => {
        test('should log stats without error', () => {
            cache.metrics.hits = 5;
            cache.metrics.misses = 3;
            const logSpy = jest.spyOn(console, 'log').mockImplementation();
            cache.printStats();
            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });
    });

    describe('setupCRUDListeners()', () => {
        test('should register event listener', () => {
            const addSpy = jest.spyOn(window, 'addEventListener');
            cache.setupCRUDListeners();
            expect(addSpy).toHaveBeenCalledWith('crud:success', expect.any(Function));
            addSpy.mockRestore();
        });

        test('should call addEventListener with crud:success', () => {
            // Capture the handler registered
            let handler = null;
            window.addEventListener = jest.fn((event, fn) => { handler = fn; });
            cache.setupCRUDListeners();
            expect(window.addEventListener).toHaveBeenCalledWith('crud:success', expect.any(Function));

            // Simulate the event by calling handler directly
            const spy = jest.spyOn(cache, 'invalidate');
            handler({ detail: { type: 'update', collection: 'deities', entityId: 'zeus' } });
            expect(spy).toHaveBeenCalledWith('deities', 'zeus');
        });
    });

    describe('setToSessionStorage() quota handling', () => {
        test('should handle quota exceeded error', () => {
            const original = sessionStorage.setItem;
            let callCount = 0;
            sessionStorage.setItem = jest.fn((key, value) => {
                callCount++;
                if (callCount === 1) {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                // Second call succeeds (after cleanup)
            });
            expect(() => cache.setToSessionStorage('test', { data: 'test' })).not.toThrow();
            sessionStorage.setItem = original;
        });
    });

    describe('setToLocalStorage() quota handling', () => {
        test('should handle quota exceeded error', () => {
            const original = localStorage.setItem;
            let callCount = 0;
            localStorage.setItem = jest.fn((key, value) => {
                callCount++;
                if (callCount === 1) {
                    const error = new Error('QuotaExceededError');
                    error.name = 'QuotaExceededError';
                    throw error;
                }
                // Second call succeeds
            });
            expect(() => cache.setToLocalStorage('test', { data: 'test' })).not.toThrow();
            localStorage.setItem = original;
        });
    });
});
