/**
 * Route Preloader Tests
 * Tests for js/router/route-preloader.js
 */

describe('RoutePreloader', () => {
    let RoutePreloader;
    let mockDb;

    beforeEach(() => {
        // Reset module
        delete window.RoutePreloader;

        mockDb = {
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        exists: true,
                        id: 'zeus',
                        data: () => ({ name: 'Zeus', type: 'deity' })
                    }))
                })),
                limit: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        docs: [
                            { id: 'zeus', data: () => ({ name: 'Zeus' }) },
                            { id: 'athena', data: () => ({ name: 'Athena' }) }
                        ]
                    }))
                }))
            }))
        };

        // Mock document event listeners
        document.addEventListener = jest.fn();

        RoutePreloader = require('../../js/router/route-preloader.js');
    });

    afterEach(() => {
        RoutePreloader.clearCache();
        RoutePreloader._initialized = false;
    });

    describe('init()', () => {
        test('should set db reference', () => {
            RoutePreloader.init(mockDb);
            expect(RoutePreloader._db).toBe(mockDb);
        });

        test('should set initialized flag', () => {
            RoutePreloader.init(mockDb);
            expect(RoutePreloader._initialized).toBe(true);
        });

        test('should not reinitialize', () => {
            RoutePreloader.init(mockDb);
            const db2 = { different: true };
            RoutePreloader.init(db2);
            expect(RoutePreloader._db).toBe(mockDb); // should keep first db
        });
    });

    describe('prefetch()', () => {
        beforeEach(() => {
            RoutePreloader._initialized = true;
            RoutePreloader._db = mockDb;
        });

        test('should return cached data for entity route', async () => {
            const data = await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(data).toBeDefined();
            expect(data.name).toBe('Zeus');
        });

        test('should return cached data for browse route', async () => {
            const data = await RoutePreloader.prefetch('#/browse/deities');
            expect(data).toBeInstanceOf(Array);
            expect(data).toHaveLength(2);
        });

        test('should return null for unrecognized route', async () => {
            const data = await RoutePreloader.prefetch('#/');
            expect(data).toBeNull();
        });

        test('should cache fetched data', async () => {
            await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(RoutePreloader._cache.size).toBe(1);
        });

        test('should return cached data on subsequent calls', async () => {
            await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            // Reset mock to verify it's not called again
            mockDb.collection.mockClear();
            const data = await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(data.name).toBe('Zeus');
            expect(mockDb.collection).not.toHaveBeenCalled();
        });

        test('should handle fetch errors gracefully', async () => {
            mockDb.collection = jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.reject(new Error('Network error')))
                })),
                limit: jest.fn(() => ({
                    get: jest.fn(() => Promise.reject(new Error('Network error')))
                }))
            }));

            const data = await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(data).toBeNull();
        });

        test('should not duplicate pending requests', async () => {
            const promise1 = RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            const promise2 = RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            const [data1, data2] = await Promise.all([promise1, promise2]);
            expect(data1).toEqual(data2);
        });

        test('should return null when no db', async () => {
            RoutePreloader._db = null;
            const data = await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(data).toBeNull();
        });
    });

    describe('getCached()', () => {
        beforeEach(() => {
            RoutePreloader._initialized = true;
            RoutePreloader._db = mockDb;
        });

        test('should return cached data', async () => {
            await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            const data = RoutePreloader.getCached('#/mythology/greek/deities/zeus');
            expect(data).toBeDefined();
            expect(data.name).toBe('Zeus');
        });

        test('should return null for non-cached path', () => {
            expect(RoutePreloader.getCached('#/unknown')).toBeNull();
        });

        test('should return null for expired cache', async () => {
            await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            // Manually expire the cache entry
            const normalizedPath = 'mythology/greek/deities/zeus';
            const cached = RoutePreloader._cache.get(normalizedPath);
            cached.timestamp = Date.now() - RoutePreloader._cacheExpiry - 1000;
            expect(RoutePreloader.getCached('#/mythology/greek/deities/zeus')).toBeNull();
        });
    });

    describe('clearCache()', () => {
        test('should clear all cached data', async () => {
            RoutePreloader._initialized = true;
            RoutePreloader._db = mockDb;
            await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(RoutePreloader._cache.size).toBeGreaterThan(0);

            RoutePreloader.clearCache();
            expect(RoutePreloader._cache.size).toBe(0);
            expect(RoutePreloader._pending.size).toBe(0);
        });
    });

    describe('getStats()', () => {
        test('should return cache statistics', () => {
            const stats = RoutePreloader.getStats();
            expect(stats.cacheSize).toBeDefined();
            expect(stats.pendingRequests).toBeDefined();
            expect(stats.maxCacheSize).toBe(20);
            expect(stats.cacheExpiry).toBe(60000);
        });
    });

    describe('LRU cache eviction', () => {
        test('should evict oldest entry when cache exceeds max size', async () => {
            RoutePreloader._initialized = true;
            RoutePreloader._db = mockDb;
            RoutePreloader._maxCacheSize = 2;

            await RoutePreloader.prefetch('#/browse/deities');
            await RoutePreloader.prefetch('#/browse/heroes');
            await RoutePreloader.prefetch('#/browse/creatures');

            expect(RoutePreloader._cache.size).toBeLessThanOrEqual(2);
        });
    });

    describe('hover listener behavior', () => {
        test('should register mouseover and mouseout listeners', () => {
            RoutePreloader._setupHoverListeners();
            const calls = document.addEventListener.mock.calls;
            const events = calls.map(c => c[0]);
            expect(events).toContain('mouseover');
            expect(events).toContain('mouseout');
        });

        test('mouseover handler should skip non-link targets', () => {
            RoutePreloader._setupHoverListeners();
            const mouseoverCall = document.addEventListener.mock.calls.find(c => c[0] === 'mouseover');
            const handler = mouseoverCall[1];
            // Create a non-link element
            const div = document.createElement('div');
            div.closest = jest.fn().mockReturnValue(null);
            // Should not throw
            handler({ target: div });
        });

        test('mouseover handler should skip # and #/ hrefs', () => {
            RoutePreloader._setupHoverListeners();
            const mouseoverCall = document.addEventListener.mock.calls.find(c => c[0] === 'mouseover');
            const handler = mouseoverCall[1];
            const link = document.createElement('a');
            link.setAttribute('href', '#');
            link.closest = jest.fn().mockReturnValue(link);
            link.getAttribute = jest.fn().mockReturnValue('#');
            handler({ target: link });
            // Should not start a timer
            expect(link._prefetchTimer).toBeUndefined();
        });

        test('mouseout handler should clear timer', () => {
            RoutePreloader._setupHoverListeners();
            const mouseoutCall = document.addEventListener.mock.calls.find(c => c[0] === 'mouseout');
            const handler = mouseoutCall[1];
            const link = document.createElement('a');
            link._prefetchTimer = 12345;
            link.closest = jest.fn().mockReturnValue(link);
            handler({ target: link });
            expect(link._prefetchTimer).toBeNull();
        });
    });

    describe('prefetch error handling', () => {
        test('should return null on prefetch error', async () => {
            RoutePreloader._initialized = true;
            RoutePreloader._db = {
                collection: jest.fn(() => { throw new Error('DB error'); })
            };
            const result = await RoutePreloader.prefetch('#/mythology/greek/deities/zeus');
            expect(result).toBeNull();
        });

        test('should return null for browse route error', async () => {
            RoutePreloader._initialized = true;
            RoutePreloader._db = {
                collection: jest.fn(() => ({
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.reject(new Error('fail')))
                    })),
                    limit: jest.fn(() => ({
                        get: jest.fn(() => Promise.reject(new Error('fail')))
                    }))
                }))
            };
            const result = await RoutePreloader.prefetch('#/browse/deities');
            expect(result).toBeNull();
        });
    });
});
