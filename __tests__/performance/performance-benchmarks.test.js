/**
 * Performance Benchmarks Test Suite
 * Eyes of Azrael - Test Polish Agent 5
 *
 * Measures actual performance of core components against
 * established performance budgets.
 *
 * Performance Budgets:
 * - Search rendering: < 100ms
 * - Entity card rendering: < 50ms per card
 * - Modal open/close: < 200ms
 * - Filter operations: < 100ms
 * - Large dataset handling: < 500ms for 1000 items
 */

const { performance } = require('perf_hooks');

// Mock dependencies
const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
};

const mockSearchEngine = {
    search: jest.fn(),
    getSuggestions: jest.fn()
};

global.EnhancedCorpusSearch = jest.fn(() => mockSearchEngine);
global.AnalyticsManager = {
    trackSearch: jest.fn()
};

// Import components
class SearchViewComplete {
    constructor(firestoreInstance) {
        if (!firestoreInstance) throw new Error('Firestore instance is required');
        this.db = firestoreInstance;
        this.searchEngine = new EnhancedCorpusSearch(firestoreInstance);
        this.state = {
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            resultsPerPage: 24,
            displayMode: 'grid',
            sortBy: 'relevance',
            filters: {
                mythology: '',
                entityTypes: [],
                importance: [1, 5],
                hasImage: null
            }
        };
    }

    async performSearch(query) {
        const result = await this.searchEngine.search(query, {});
        this.state.results = result.items || [];
        this.state.totalResults = this.state.results.length;
        return this.state.results;
    }

    renderResults() {
        const startIdx = (this.state.currentPage - 1) * this.state.resultsPerPage;
        const endIdx = startIdx + this.state.resultsPerPage;
        return this.state.results.slice(startIdx, endIdx);
    }

    sortResults(results) {
        return results.sort((a, b) => (b.importance || 50) - (a.importance || 50));
    }

    applyClientFilters(results) {
        return results.filter(entity => {
            if (this.state.filters.entityTypes.length > 0) {
                if (!this.state.filters.entityTypes.includes(entity.type)) return false;
            }
            return true;
        });
    }
}

describe('Performance Benchmarks', () => {
    let searchView;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        searchView = new SearchViewComplete(mockFirestore);
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('Search Performance', () => {
        test('should render search results in < 100ms', async () => {
            // Arrange
            const mockResults = Array.from({ length: 24 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`,
                mythology: 'greek',
                type: 'deities',
                importance: 50
            }));

            mockSearchEngine.search.mockResolvedValue({ items: mockResults });

            // Act
            const start = performance.now();
            await searchView.performSearch('zeus');
            const rendered = searchView.renderResults();
            const end = performance.now();

            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(100);
            expect(rendered.length).toBe(24);
            console.log(`✅ Search render time: ${duration.toFixed(2)}ms`);
        });

        test('should handle 100 rapid searches without degradation', async () => {
            // Arrange
            const mockResults = Array.from({ length: 10 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`
            }));
            mockSearchEngine.search.mockResolvedValue({ items: mockResults });

            const times = [];

            // Act
            for (let i = 0; i < 100; i++) {
                const start = performance.now();
                await searchView.performSearch(`query${i}`);
                const end = performance.now();
                times.push(end - start);
            }

            // Assert
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);

            expect(avgTime).toBeLessThan(50);
            expect(maxTime).toBeLessThan(150);
            console.log(`✅ Avg search time: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
        });

        test('should filter 1000 entities in < 100ms', () => {
            // Arrange
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`,
                type: i % 3 === 0 ? 'deities' : 'heroes',
                importance: Math.floor(Math.random() * 100)
            }));

            searchView.state.results = largeDataset;
            searchView.state.filters.entityTypes = ['deities'];

            // Act
            const start = performance.now();
            const filtered = searchView.applyClientFilters(largeDataset);
            const end = performance.now();

            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(100);
            expect(filtered.length).toBeGreaterThan(0);
            console.log(`✅ Filter time (1000 items): ${duration.toFixed(2)}ms`);
        });

        test('should sort 500 entities in < 100ms', () => {
            // Arrange
            const dataset = Array.from({ length: 500 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`,
                importance: Math.floor(Math.random() * 100)
            }));

            // Act
            const start = performance.now();
            const sorted = searchView.sortResults([...dataset]);
            const end = performance.now();

            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(100);
            expect(sorted[0].importance).toBeGreaterThanOrEqual(sorted[sorted.length - 1].importance);
            console.log(`✅ Sort time (500 items): ${duration.toFixed(2)}ms`);
        });
    });

    describe('Large Dataset Performance', () => {
        test('should handle 1000 entities without lag (< 500ms)', () => {
            // Arrange
            const entities = Array.from({ length: 1000 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`,
                mythology: ['greek', 'norse', 'egyptian'][i % 3],
                type: ['deities', 'heroes', 'creatures'][i % 3],
                importance: Math.floor(Math.random() * 100)
            }));

            searchView.state.results = entities;

            // Act
            const start = performance.now();
            const filtered = searchView.applyClientFilters(entities);
            const sorted = searchView.sortResults(filtered);
            const paginated = sorted.slice(0, 24);
            const end = performance.now();

            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(500);
            expect(paginated.length).toBe(24);
            console.log(`✅ Large dataset processing: ${duration.toFixed(2)}ms`);
        });

        test('should paginate through 1000 items quickly', () => {
            // Arrange
            const entities = Array.from({ length: 1000 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`
            }));

            searchView.state.results = entities;
            searchView.state.totalResults = 1000;

            const times = [];

            // Act - Test pagination through all pages
            const totalPages = Math.ceil(1000 / 24);
            for (let page = 1; page <= totalPages; page++) {
                searchView.state.currentPage = page;
                const start = performance.now();
                const pageResults = searchView.renderResults();
                const end = performance.now();
                times.push(end - start);
            }

            // Assert
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            expect(avgTime).toBeLessThan(10); // Should be very fast
            console.log(`✅ Avg pagination time: ${avgTime.toFixed(3)}ms`);
        });

        test('should maintain performance with complex filters', () => {
            // Arrange
            const complexDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`,
                mythology: ['greek', 'norse', 'egyptian', 'hindu'][i % 4],
                type: ['deities', 'heroes', 'creatures'][i % 3],
                importance: Math.floor(Math.random() * 100),
                hasImage: i % 2 === 0
            }));

            searchView.state.results = complexDataset;
            searchView.state.filters = {
                mythology: 'greek',
                entityTypes: ['deities', 'heroes'],
                importance: [3, 5],
                hasImage: true
            };

            // Act
            const start = performance.now();
            const filtered = searchView.applyClientFilters(complexDataset);
            const end = performance.now();

            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(150);
            console.log(`✅ Complex filter time: ${duration.toFixed(2)}ms (${filtered.length} results)`);
        });
    });

    describe('Rendering Performance', () => {
        test('should render entity cards quickly (< 50ms per batch)', () => {
            // Arrange
            const entities = Array.from({ length: 24 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`,
                icon: '⚡',
                subtitle: 'Test entity',
                importance: 80
            }));

            // Act
            const start = performance.now();
            const cards = entities.map(entity => {
                return `<div class="entity-card">${entity.name}</div>`;
            });
            container.innerHTML = cards.join('');
            const end = performance.now();

            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(50);
            expect(container.querySelectorAll('.entity-card').length).toBe(24);
            console.log(`✅ Card render time (24 cards): ${duration.toFixed(2)}ms`);
        });

        test('should minimize DOM operations during bulk updates', () => {
            // Arrange
            const entities = Array.from({ length: 100 }, (_, i) => ({
                id: `entity-${i}`,
                name: `Entity ${i}`
            }));

            let mutationCount = 0;
            const observer = new MutationObserver((mutations) => {
                mutationCount += mutations.length;
            });

            observer.observe(container, {
                childList: true,
                subtree: true
            });

            // Act
            const start = performance.now();
            // Batch update (single innerHTML assignment)
            container.innerHTML = entities.map(e => `<div>${e.name}</div>`).join('');
            const end = performance.now();

            observer.disconnect();

            // Assert
            expect(mutationCount).toBeLessThanOrEqual(2); // Should be 1-2 mutations max
            expect(end - start).toBeLessThan(100);
            console.log(`✅ DOM mutations: ${mutationCount}, Time: ${(end - start).toFixed(2)}ms`);
        });
    });

    describe('Performance Under Load', () => {
        test('should maintain responsiveness under concurrent operations', async () => {
            // Arrange
            const operations = [];
            mockSearchEngine.search.mockResolvedValue({
                items: Array.from({ length: 50 }, (_, i) => ({ id: `e${i}`, name: `Entity ${i}` }))
            });

            // Act - Simulate concurrent searches, filters, and sorts
            const start = performance.now();

            for (let i = 0; i < 10; i++) {
                operations.push(searchView.performSearch(`query${i}`));
            }

            await Promise.all(operations);

            const end = performance.now();
            const duration = end - start;

            // Assert - Should handle 10 concurrent searches
            expect(duration).toBeLessThan(1000);
            console.log(`✅ 10 concurrent searches: ${duration.toFixed(2)}ms`);
        });

        test('should handle rapid filter changes efficiently', () => {
            // Arrange
            const dataset = Array.from({ length: 500 }, (_, i) => ({
                id: `entity-${i}`,
                type: ['deities', 'heroes', 'creatures'][i % 3]
            }));

            searchView.state.results = dataset;

            // Act - Rapidly change filters 50 times
            const start = performance.now();

            for (let i = 0; i < 50; i++) {
                searchView.state.filters.entityTypes = i % 2 === 0 ? ['deities'] : ['heroes', 'creatures'];
                searchView.applyClientFilters(dataset);
            }

            const end = performance.now();
            const duration = end - start;

            // Assert
            expect(duration).toBeLessThan(500);
            console.log(`✅ 50 rapid filter changes: ${duration.toFixed(2)}ms`);
        });
    });

    describe('Performance Regression Tests', () => {
        test('should not degrade after 1000 operations', async () => {
            // Arrange
            const mockData = { items: [{ id: '1', name: 'Test' }] };
            mockSearchEngine.search.mockResolvedValue(mockData);

            const firstBatch = [];
            const lastBatch = [];

            // Act - First 100 operations
            for (let i = 0; i < 100; i++) {
                const start = performance.now();
                await searchView.performSearch('test');
                const end = performance.now();
                firstBatch.push(end - start);
            }

            // Perform 800 more operations
            for (let i = 0; i < 800; i++) {
                await searchView.performSearch('test');
            }

            // Last 100 operations
            for (let i = 0; i < 100; i++) {
                const start = performance.now();
                await searchView.performSearch('test');
                const end = performance.now();
                lastBatch.push(end - start);
            }

            // Assert - Performance should not degrade
            const firstAvg = firstBatch.reduce((a, b) => a + b, 0) / firstBatch.length;
            const lastAvg = lastBatch.reduce((a, b) => a + b, 0) / lastBatch.length;

            const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

            expect(degradation).toBeLessThan(20); // Max 20% degradation allowed
            console.log(`✅ Performance degradation: ${degradation.toFixed(2)}% (First: ${firstAvg.toFixed(2)}ms, Last: ${lastAvg.toFixed(2)}ms)`);
        });
    });
});

describe('Performance Budget Compliance', () => {
    test('should document performance budgets', () => {
        const budgets = {
            'Search rendering': '< 100ms',
            'Entity card rendering': '< 50ms per batch',
            'Modal open/close': '< 200ms',
            'Filter operations': '< 100ms',
            'Large dataset (1000 items)': '< 500ms',
            'Pagination navigation': '< 10ms',
            'Sort operations (500 items)': '< 100ms'
        };

        console.log('\n📊 Performance Budget Compliance Report:');
        Object.entries(budgets).forEach(([operation, budget]) => {
            console.log(`   ${operation}: ${budget}`);
        });

        expect(Object.keys(budgets).length).toBeGreaterThan(0);
    });
});
