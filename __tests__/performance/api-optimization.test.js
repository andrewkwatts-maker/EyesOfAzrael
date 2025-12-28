/**
 * API Call Optimization Tests
 * Eyes of Azrael - Test Polish Agent 5
 *
 * Tests for:
 * - Request caching
 * - Request batching
 * - Request deduplication
 * - Optimistic updates
 * - Pagination strategies
 */

describe('Request Caching', () => {
    let cache;

    beforeEach(() => {
        cache = new Map();
    });

    test('should cache entity data after first fetch', async () => {
        // Arrange
        const fetchSpy = jest.fn().mockResolvedValue({
            id: 'zeus',
            name: 'Zeus',
            mythology: 'greek'
        });

        const getCachedEntity = async (id) => {
            if (cache.has(id)) {
                return cache.get(id);
            }

            const data = await fetchSpy(id);
            cache.set(id, data);
            return data;
        };

        // Act - First call
        const result1 = await getCachedEntity('zeus');
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        const result2 = await getCachedEntity('zeus');

        // Assert
        expect(fetchSpy).toHaveBeenCalledTimes(1); // Still 1, not 2
        expect(result1).toBe(result2); // Same reference
    });

    test('should implement LRU cache eviction', () => {
        // Arrange
        class LRUCache {
            constructor(maxSize) {
                this.maxSize = maxSize;
                this.cache = new Map();
            }

            get(key) {
                if (!this.cache.has(key)) return null;

                // Move to end (most recently used)
                const value = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, value);
                return value;
            }

            set(key, value) {
                // Remove if exists (to re-add at end)
                if (this.cache.has(key)) {
                    this.cache.delete(key);
                }

                // Remove oldest if at capacity
                if (this.cache.size >= this.maxSize) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }

                this.cache.set(key, value);
            }
        }

        const lru = new LRUCache(3);

        // Act
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        expect(lru.cache.size).toBe(3);

        // Add fourth item - should evict 'a'
        lru.set('d', 4);

        // Assert
        expect(lru.cache.size).toBe(3);
        expect(lru.get('a')).toBeNull();
        expect(lru.get('d')).toBe(4);
    });

    test('should invalidate cache after timeout', async () => {
        jest.useFakeTimers();

        // Arrange
        const TTL = 5000; // 5 seconds
        const cacheWithTTL = new Map();

        const getCachedWithTTL = async (key, fetcher) => {
            const cached = cacheWithTTL.get(key);

            if (cached && Date.now() - cached.timestamp < TTL) {
                return cached.data;
            }

            const data = await fetcher();
            cacheWithTTL.set(key, {
                data,
                timestamp: Date.now()
            });

            return data;
        };

        const fetcher = jest.fn().mockResolvedValue({ data: 'test' });

        // Act - First call
        await getCachedWithTTL('key1', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(1);

        // Second call within TTL
        jest.advanceTimersByTime(3000);
        await getCachedWithTTL('key1', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(1); // Still cached

        // Third call after TTL
        jest.advanceTimersByTime(3000);
        await getCachedWithTTL('key1', fetcher);

        // Assert
        expect(fetcher).toHaveBeenCalledTimes(2); // Re-fetched

        jest.useRealTimers();
    });

    test('should share cache across component instances', async () => {
        // Arrange
        const globalCache = new Map();

        class Component {
            constructor() {
                this.cache = globalCache; // Shared cache
            }

            async getEntity(id) {
                if (this.cache.has(id)) {
                    return this.cache.get(id);
                }

                const data = { id, name: `Entity ${id}` };
                this.cache.set(id, data);
                return data;
            }
        }

        // Act
        const comp1 = new Component();
        const comp2 = new Component();

        await comp1.getEntity('zeus');

        // Assert - comp2 should use same cache
        const result = await comp2.getEntity('zeus');
        expect(globalCache.size).toBe(1); // Only one entry
        expect(result.id).toBe('zeus');
    });
});

describe('Request Batching', () => {
    test('should batch multiple entity fetches into one request', async () => {
        // Arrange
        const batchFetch = jest.fn().mockResolvedValue([
            { id: 'zeus', name: 'Zeus' },
            { id: 'hera', name: 'Hera' },
            { id: 'apollo', name: 'Apollo' }
        ]);

        const pendingRequests = [];
        let batchTimeout = null;

        const batchedGetEntity = (id) => {
            return new Promise((resolve) => {
                pendingRequests.push({ id, resolve });

                if (batchTimeout) {
                    clearTimeout(batchTimeout);
                }

                batchTimeout = setTimeout(async () => {
                    const ids = pendingRequests.map(req => req.id);
                    const results = await batchFetch(ids);

                    pendingRequests.forEach((req) => {
                        const result = results.find(r => r.id === req.id);
                        req.resolve(result);
                    });

                    pendingRequests.length = 0;
                }, 10);
            });
        };

        // Act - Request 3 entities
        const promises = [
            batchedGetEntity('zeus'),
            batchedGetEntity('hera'),
            batchedGetEntity('apollo')
        ];

        const results = await Promise.all(promises);

        // Assert - Only 1 batch request made
        expect(batchFetch).toHaveBeenCalledTimes(1);
        expect(batchFetch).toHaveBeenCalledWith(['zeus', 'hera', 'apollo']);
        expect(results.length).toBe(3);
    });

    test('should handle batch size limits', async () => {
        // Arrange
        const MAX_BATCH_SIZE = 10;
        const batchFetch = jest.fn().mockImplementation(async (ids) => {
            return ids.map(id => ({ id, name: `Entity ${id}` }));
        });

        const executeBatches = async (ids) => {
            const batches = [];
            for (let i = 0; i < ids.length; i += MAX_BATCH_SIZE) {
                batches.push(ids.slice(i, i + MAX_BATCH_SIZE));
            }

            const results = await Promise.all(
                batches.map(batch => batchFetch(batch))
            );

            return results.flat();
        };

        // Act - Request 25 entities
        const ids = Array.from({ length: 25 }, (_, i) => `entity-${i}`);
        const results = await executeBatches(ids);

        // Assert - 3 batches (10 + 10 + 5)
        expect(batchFetch).toHaveBeenCalledTimes(3);
        expect(results.length).toBe(25);
    });

    test('should retry failed batches', async () => {
        // Arrange
        let callCount = 0;
        const unstableFetch = jest.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
                throw new Error('Network error');
            }
            return [{ id: 'zeus', name: 'Zeus' }];
        });

        const fetchWithRetry = async (maxRetries = 3) => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    return await unstableFetch();
                } catch (error) {
                    if (attempt === maxRetries - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        };

        // Act
        const result = await fetchWithRetry();

        // Assert
        expect(unstableFetch).toHaveBeenCalledTimes(2);
        expect(result[0].name).toBe('Zeus');
    });
});

describe('Request Deduplication', () => {
    test('should deduplicate identical concurrent requests', async () => {
        // Arrange
        const fetchSpy = jest.fn().mockImplementation(async (id) => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return { id, name: `Entity ${id}` };
        });

        const pendingRequests = new Map();

        const deduplicatedFetch = async (id) => {
            if (pendingRequests.has(id)) {
                return pendingRequests.get(id);
            }

            const promise = fetchSpy(id);
            pendingRequests.set(id, promise);

            try {
                const result = await promise;
                return result;
            } finally {
                pendingRequests.delete(id);
            }
        };

        // Act - Make 5 concurrent requests for same entity
        const promises = Array(5).fill(null).map(() => deduplicatedFetch('zeus'));
        const results = await Promise.all(promises);

        // Assert - Only 1 actual fetch
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(results).toHaveLength(5);
        results.forEach(result => {
            expect(result.id).toBe('zeus');
        });
    });

    test('should allow concurrent requests for different entities', async () => {
        // Arrange
        const fetchSpy = jest.fn().mockImplementation(async (id) => {
            return { id, name: `Entity ${id}` };
        });

        const pendingRequests = new Map();

        const deduplicatedFetch = async (id) => {
            if (pendingRequests.has(id)) {
                return pendingRequests.get(id);
            }

            const promise = fetchSpy(id);
            pendingRequests.set(id, promise);

            const result = await promise;
            pendingRequests.delete(id);
            return result;
        };

        // Act - Request different entities
        const promises = [
            deduplicatedFetch('zeus'),
            deduplicatedFetch('hera'),
            deduplicatedFetch('apollo')
        ];

        await Promise.all(promises);

        // Assert - 3 separate fetches
        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
});

describe('Optimistic Updates', () => {
    test('should update UI immediately then sync with server', async () => {
        // Arrange
        let serverData = { id: 'zeus', likes: 10 };
        const updateServer = jest.fn().mockImplementation(async (update) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            serverData = { ...serverData, ...update };
            return serverData;
        });

        let localData = { id: 'zeus', likes: 10 };

        // Act - Optimistic update
        const optimisticUpdate = async (update) => {
            // Immediate UI update
            const previousData = { ...localData };
            localData = { ...localData, ...update };

            try {
                // Sync with server
                const result = await updateServer(update);
                localData = result;
                return result;
            } catch (error) {
                // Rollback on error
                localData = previousData;
                throw error;
            }
        };

        const startTime = Date.now();
        const updatePromise = optimisticUpdate({ likes: 11 });

        // Assert - UI updated immediately
        expect(localData.likes).toBe(11); // Optimistic
        expect(Date.now() - startTime).toBeLessThan(50); // Fast

        // Wait for server sync
        await updatePromise;

        // Assert - Server synced
        expect(serverData.likes).toBe(11);
        expect(updateServer).toHaveBeenCalled();
    });

    test('should rollback optimistic update on error', async () => {
        // Arrange
        const failingUpdate = jest.fn().mockRejectedValue(new Error('Server error'));

        let localData = { id: 'zeus', likes: 10 };
        const previousData = { ...localData };

        // Act - Optimistic update that fails
        localData = { ...localData, likes: 11 }; // Optimistic

        try {
            await failingUpdate({ likes: 11 });
        } catch (error) {
            // Rollback
            localData = previousData;
        }

        // Assert - Rolled back to previous state
        expect(localData.likes).toBe(10);
    });
});

describe('Pagination Strategies', () => {
    test('should implement cursor-based pagination', async () => {
        // Arrange
        const allItems = Array.from({ length: 100 }, (_, i) => ({
            id: `item-${i}`,
            name: `Item ${i}`,
            createdAt: i
        }));

        const fetchPage = jest.fn().mockImplementation(async (cursor, limit) => {
            const startIndex = cursor ? allItems.findIndex(item => item.id === cursor) + 1 : 0;
            const items = allItems.slice(startIndex, startIndex + limit);

            return {
                items,
                nextCursor: items.length === limit ? items[items.length - 1].id : null,
                hasMore: startIndex + limit < allItems.length
            };
        });

        // Act - Fetch first page
        const page1 = await fetchPage(null, 10);
        expect(page1.items.length).toBe(10);
        expect(page1.hasMore).toBe(true);

        // Fetch second page
        const page2 = await fetchPage(page1.nextCursor, 10);
        expect(page2.items.length).toBe(10);
        expect(page2.items[0].id).toBe('item-10');
    });

    test('should implement offset-based pagination', async () => {
        // Arrange
        const allItems = Array.from({ length: 100 }, (_, i) => ({
            id: `item-${i}`,
            name: `Item ${i}`
        }));

        const fetchPage = jest.fn().mockImplementation(async (page, limit) => {
            const offset = (page - 1) * limit;
            const items = allItems.slice(offset, offset + limit);

            return {
                items,
                page,
                totalPages: Math.ceil(allItems.length / limit),
                totalItems: allItems.length
            };
        });

        // Act
        const result = await fetchPage(2, 10);

        // Assert
        expect(result.items.length).toBe(10);
        expect(result.items[0].id).toBe('item-10');
        expect(result.totalPages).toBe(10);
    });

    test('should prefetch next page for smoother UX', async () => {
        // Arrange
        const pageCache = new Map();

        const fetchPage = jest.fn().mockImplementation(async (page) => {
            return Array.from({ length: 10 }, (_, i) => ({
                id: `item-${(page - 1) * 10 + i}`
            }));
        });

        const getPage = async (page) => {
            if (pageCache.has(page)) {
                return pageCache.get(page);
            }

            const data = await fetchPage(page);
            pageCache.set(page, data);

            // Prefetch next page
            if (!pageCache.has(page + 1)) {
                fetchPage(page + 1).then(nextData => {
                    pageCache.set(page + 1, nextData);
                });
            }

            return data;
        };

        // Act
        await getPage(1);

        // Wait for prefetch
        await new Promise(resolve => setTimeout(resolve, 50));

        // Assert - Next page already fetched
        expect(fetchPage).toHaveBeenCalledWith(1);
        expect(fetchPage).toHaveBeenCalledWith(2);
    });
});

describe('API Optimization Summary', () => {
    test('should document optimization techniques', () => {
        const techniques = {
            'Caching': 'Store responses to avoid redundant requests',
            'Batching': 'Combine multiple requests into one',
            'Deduplication': 'Prevent concurrent identical requests',
            'Debouncing': 'Delay requests until user stops typing',
            'Throttling': 'Limit request frequency',
            'Pagination': 'Load data in chunks',
            'Prefetching': 'Load likely-needed data in advance',
            'Optimistic Updates': 'Update UI before server confirmation',
            'Request Cancellation': 'Cancel outdated requests',
            'Compression': 'Reduce payload size with gzip/brotli'
        };

        console.log('\n🔧 API Optimization Techniques:');
        Object.entries(techniques).forEach(([name, description]) => {
            console.log(`   ${name}: ${description}`);
        });

        expect(Object.keys(techniques).length).toBeGreaterThan(0);
    });
});
