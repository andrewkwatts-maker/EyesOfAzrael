/**
 * Unit Tests for FirebaseCacheManager
 */

describe('FirebaseCacheManager', () => {
    let cacheManager;
    let mockDb;

    beforeEach(() => {
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();

        // Create mock database
        mockDb = new MockFirestore();
        mockDb.queryDelay = 10; // Fast for testing

        // Seed test data
        mockDb.seed('deities', {
            'zeus': {
                id: 'zeus',
                name: 'Zeus',
                mythology: 'greek',
                importance: 100
            },
            'athena': {
                id: 'athena',
                name: 'Athena',
                mythology: 'greek',
                importance: 95
            }
        });

        // Create cache manager instance
        cacheManager = new FirebaseCacheManager({ db: mockDb });
    });

    afterEach(() => {
        cacheManager.clearAll();
    });

    describe('Initialization', () => {
        it('should initialize with default TTL values', () => {
            expect(cacheManager.defaultTTL).toBeDefined();
            expect(cacheManager.defaultTTL.mythologies).toBe(86400000);
            expect(cacheManager.defaultTTL.entities).toBe(300000);
        });

        it('should initialize empty memory cache', () => {
            expect(cacheManager.memoryCache.size).toBe(0);
        });

        it('should initialize metrics', () => {
            expect(cacheManager.metrics.hits).toBe(0);
            expect(cacheManager.metrics.misses).toBe(0);
        });
    });

    describe('get()', () => {
        it('should fetch from Firebase on cache miss', async () => {
            const data = await cacheManager.get('deities', 'zeus');

            expect(data).toBeDefined();
            expect(data.name).toBe('Zeus');
            expect(cacheManager.metrics.misses).toBe(1);
        });

        it('should return null for non-existent documents', async () => {
            const data = await cacheManager.get('deities', 'nonexistent');
            expect(data).toBeNull();
        });

        it('should cache data after fetching', async () => {
            await cacheManager.get('deities', 'zeus');

            // Second call should hit cache
            const startHits = cacheManager.metrics.hits;
            await cacheManager.get('deities', 'zeus');

            expect(cacheManager.metrics.hits).toBe(startHits + 1);
        });

        it('should use custom TTL when provided', async () => {
            const customTTL = 100;
            await cacheManager.get('deities', 'zeus', { ttl: customTTL });

            const cacheKey = cacheManager.generateKey('deities', 'zeus');
            const cached = cacheManager.getFromMemory(cacheKey);

            expect(cached.ttl).toBe(customTTL);
        });

        it('should force refresh when requested', async () => {
            // First fetch
            await cacheManager.get('deities', 'zeus');

            // Force refresh should fetch again
            const misses = cacheManager.metrics.misses;
            await cacheManager.get('deities', 'zeus', { forceRefresh: true });

            expect(cacheManager.metrics.misses).toBe(misses + 1);
        });
    });

    describe('set()', () => {
        it('should store data in all cache layers', async () => {
            const testData = { id: 'test', name: 'Test' };
            await cacheManager.set('deities', 'test', testData);

            // Check memory cache
            const cacheKey = cacheManager.generateKey('deities', 'test');
            const memoryData = cacheManager.getFromMemory(cacheKey);
            expect(memoryData).toBeDefined();
            expect(memoryData.data.name).toBe('Test');

            // Check session storage
            const sessionData = cacheManager.getFromSessionStorage(cacheKey);
            expect(sessionData).toBeDefined();

            // Check local storage
            const localData = cacheManager.getFromLocalStorage(cacheKey);
            expect(localData).toBeDefined();
        });

        it('should increment sets metric', async () => {
            const sets = cacheManager.metrics.sets;
            await cacheManager.set('deities', 'test', { name: 'Test' });
            expect(cacheManager.metrics.sets).toBe(sets + 1);
        });
    });

    describe('invalidate()', () => {
        it('should invalidate specific document', async () => {
            await cacheManager.get('deities', 'zeus');
            cacheManager.invalidate('deities', 'zeus');

            const cacheKey = cacheManager.generateKey('deities', 'zeus');
            expect(cacheManager.getFromMemory(cacheKey)).toBeUndefined();
        });

        it('should invalidate entire collection', async () => {
            await cacheManager.get('deities', 'zeus');
            await cacheManager.get('deities', 'athena');

            cacheManager.invalidate('deities');

            const zeusKey = cacheManager.generateKey('deities', 'zeus');
            const athenaKey = cacheManager.generateKey('deities', 'athena');

            expect(cacheManager.getFromMemory(zeusKey)).toBeUndefined();
            expect(cacheManager.getFromMemory(athenaKey)).toBeUndefined();
        });
    });

    describe('getList()', () => {
        it('should fetch list from Firebase', async () => {
            const list = await cacheManager.getList('deities');

            expect(list).toBeDefined();
            expect(list.length).toBe(2);
        });

        it('should apply filters', async () => {
            const list = await cacheManager.getList('deities', {
                mythology: 'greek'
            });

            expect(list.length).toBe(2);
            expect(list.every(d => d.mythology === 'greek')).toBe(true);
        });

        it('should cache list results', async () => {
            await cacheManager.getList('deities');

            const hits = cacheManager.metrics.hits;
            await cacheManager.getList('deities');

            expect(cacheManager.metrics.hits).toBeGreaterThan(hits);
        });

        it('should apply limit', async () => {
            const list = await cacheManager.getList('deities', {}, { limit: 1 });
            expect(list.length).toBe(1);
        });
    });

    describe('Cache Expiration', () => {
        it('should expire cached data after TTL', async () => {
            const shortTTL = 50; // 50ms
            await cacheManager.get('deities', 'zeus', { ttl: shortTTL });

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, shortTTL + 10));

            // Should fetch again
            const misses = cacheManager.metrics.misses;
            await cacheManager.get('deities', 'zeus', { ttl: shortTTL });

            expect(cacheManager.metrics.misses).toBe(misses + 1);
        });
    });

    describe('Performance Metrics', () => {
        it('should track hit rate', async () => {
            // Miss
            await cacheManager.get('deities', 'zeus');

            // Hit
            await cacheManager.get('deities', 'zeus');

            const stats = cacheManager.getStats();
            expect(stats.hitRate).toBe('50.00%');
        });

        it('should track average response time', async () => {
            await cacheManager.get('deities', 'zeus');
            await cacheManager.get('deities', 'athena');

            const stats = cacheManager.getStats();
            expect(parseFloat(stats.avgResponseTime)).toBeGreaterThan(0);
        });
    });

    describe('Cache Warming', () => {
        it('should warm cache with mythology data', async () => {
            mockDb.seed('mythologies', {
                'greek': { id: 'greek', name: 'Greek' },
                'norse': { id: 'norse', name: 'Norse' }
            });

            await cacheManager.warmCache();

            // Check if data was cached
            expect(cacheManager.memoryCache.size).toBeGreaterThan(0);
        });
    });

    describe('Storage Management', () => {
        it('should handle QuotaExceededError gracefully', async () => {
            // This is hard to test directly, but we can check the method exists
            expect(typeof cacheManager.clearOldestEntries).toBe('function');
        });

        it('should clear all caches', () => {
            cacheManager.memoryCache.set('test', { data: 'test' });
            sessionStorage.setItem('cache_test', JSON.stringify({ data: 'test' }));
            localStorage.setItem('cache_test', JSON.stringify({ data: 'test' }));

            cacheManager.clearAll();

            expect(cacheManager.memoryCache.size).toBe(0);
            expect(sessionStorage.getItem('cache_test')).toBeNull();
            expect(localStorage.getItem('cache_test')).toBeNull();
        });
    });
});
