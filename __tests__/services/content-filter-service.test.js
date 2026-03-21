/**
 * ContentFilterService Tests
 *
 * Tests for js/services/content-filter-service.js
 *
 * Test Categories:
 * 1. Constructor & init (2 tests)
 * 2. Controversy score calculation (4 tests)
 * 3. Contribution size calculation (3 tests)
 * 4. Sorting functions (5 tests)
 * 5. Filter functions (5 tests)
 * 6. Pagination (4 tests)
 * 7. Label helpers (2 tests)
 *
 * Total: ~25 tests
 */

const {
    ContentFilterService,
    SortOptions,
    FilterTypes,
    ContentStatus
} = require('../../js/services/content-filter-service.js');

describe('ContentFilterService', () => {
    let service;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ContentFilterService();
    });

    // ==========================================
    // 1. Constructor & init
    // ==========================================

    describe('constructor', () => {
        test('should initialize with null db and auth', () => {
            expect(service.db).toBeNull();
            expect(service.auth).toBeNull();
            expect(service.initialized).toBe(false);
        });

        test('should export SortOptions and FilterTypes enumerations', () => {
            expect(SortOptions.MOST_POPULAR).toBe('most_popular');
            expect(SortOptions.NEWEST).toBe('newest');
            expect(FilterTypes.MYTHOLOGY).toBe('mythology');
            expect(ContentStatus.APPROVED).toBe('approved');
        });
    });

    // ==========================================
    // 2. Controversy score calculation
    // ==========================================

    describe('calculateControversyScore', () => {
        test('should return 0 for zero votes', () => {
            expect(service.calculateControversyScore(0, 0)).toBe(0);
        });

        test('should return 0 when only one side has votes', () => {
            expect(service.calculateControversyScore(10, 0)).toBe(0);
        });

        test('should return high score for balanced votes with high engagement', () => {
            const balanced = service.calculateControversyScore(50, 50);
            const unbalanced = service.calculateControversyScore(100, 10);
            expect(balanced).toBeGreaterThan(unbalanced);
        });

        test('should handle negative or null values safely', () => {
            expect(service.calculateControversyScore(-5, 10)).toBe(0);
            expect(service.calculateControversyScore(null, undefined)).toBe(0);
        });
    });

    describe('getControversyLevel', () => {
        test('should return correct levels for different scores', () => {
            expect(service.getControversyLevel(5)).toBe('highly_controversial');
            expect(service.getControversyLevel(3)).toBe('controversial');
            expect(service.getControversyLevel(1.5)).toBe('somewhat_controversial');
            expect(service.getControversyLevel(0.7)).toBe('mildly_controversial');
            expect(service.getControversyLevel(0.1)).toBe('not_controversial');
        });
    });

    // ==========================================
    // 3. Contribution size calculation
    // ==========================================

    describe('calculateContributionSize', () => {
        test('should return 0 for null asset', () => {
            expect(service.calculateContributionSize(null)).toBe(0);
            expect(service.calculateContributionSize(undefined)).toBe(0);
        });

        test('should score text content based on length', () => {
            const asset = {
                description: 'A'.repeat(500) // 500 chars = 5 points
            };
            const score = service.calculateContributionSize(asset);
            expect(score).toBeGreaterThanOrEqual(5);
        });

        test('should score multiple content dimensions', () => {
            const richAsset = {
                description: 'A'.repeat(1000),
                sections: [{ title: 'Origins', content: 'Long content...' }, { title: 'Powers', content: 'More...' }],
                relationships: [{ name: 'Zeus' }, { name: 'Hera' }],
                sources: [{ title: 'Iliad' }],
                images: ['img1.jpg', 'img2.jpg']
            };

            const sparseAsset = {
                description: 'Short'
            };

            const richScore = service.calculateContributionSize(richAsset);
            const sparseScore = service.calculateContributionSize(sparseAsset);
            expect(richScore).toBeGreaterThan(sparseScore);
        });
    });

    describe('getContributionSizeLabel', () => {
        test('should return correct labels for score ranges', () => {
            expect(service.getContributionSizeLabel(120)).toBe('comprehensive');
            expect(service.getContributionSizeLabel(80)).toBe('detailed');
            expect(service.getContributionSizeLabel(50)).toBe('moderate');
            expect(service.getContributionSizeLabel(25)).toBe('basic');
            expect(service.getContributionSizeLabel(5)).toBe('minimal');
        });
    });

    describe('getContributionBreakdown', () => {
        test('should return zero breakdown for null asset', () => {
            const breakdown = service.getContributionBreakdown(null);
            expect(breakdown.totalScore).toBe(0);
            expect(breakdown.textLength).toBe(0);
        });
    });

    // ==========================================
    // 4. Sorting functions
    // ==========================================

    describe('sortByOption', () => {
        const assets = [
            { id: 'a', upvotes: 10, createdAt: 100 },
            { id: 'b', upvotes: 50, createdAt: 300 },
            { id: 'c', upvotes: 25, createdAt: 200 }
        ];

        test('should return empty array for empty input', () => {
            expect(service.sortByOption([], SortOptions.MOST_POPULAR)).toEqual([]);
            expect(service.sortByOption(null, SortOptions.MOST_POPULAR)).toEqual([]);
        });

        test('should sort by most popular (descending upvotes)', () => {
            const result = service.sortByOption(assets, SortOptions.MOST_POPULAR);
            expect(result[0].id).toBe('b');
            expect(result[1].id).toBe('c');
            expect(result[2].id).toBe('a');
        });

        test('should sort by least popular (ascending upvotes)', () => {
            const result = service.sortByOption(assets, SortOptions.LEAST_POPULAR);
            expect(result[0].id).toBe('a');
        });

        test('should sort by newest (descending date)', () => {
            const result = service.sortByOption(assets, SortOptions.NEWEST);
            expect(result[0].id).toBe('b');
        });

        test('should sort by oldest (ascending date)', () => {
            const result = service.sortByOption(assets, SortOptions.OLDEST);
            expect(result[0].id).toBe('a');
        });
    });

    describe('sortByMostControversial', () => {
        test('should sort by controversy score descending', () => {
            const assets = [
                { id: 'a', upvotes: 10, downvotes: 1 },    // low controversy
                { id: 'b', upvotes: 50, downvotes: 48 },    // high controversy
                { id: 'c', upvotes: 30, downvotes: 15 }     // medium controversy
            ];

            const result = service.sortByMostControversial([...assets]);
            expect(result[0].id).toBe('b');
        });
    });

    // ==========================================
    // 5. Filter functions
    // ==========================================

    describe('filterByMythology', () => {
        const assets = [
            { id: 'zeus', mythology: 'Greek' },
            { id: 'ra', mythology: 'Egyptian' },
            { id: 'thor', mythology: 'Norse' }
        ];

        test('should filter by mythology (case insensitive)', () => {
            const result = service.filterByMythology(assets, 'greek');
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('zeus');
        });

        test('should return all when mythology is empty', () => {
            expect(service.filterByMythology(assets, '')).toEqual(assets);
            expect(service.filterByMythology(assets, null)).toEqual(assets);
        });
    });

    describe('filterByType', () => {
        test('should handle singular/plural matching', () => {
            const assets = [
                { id: 'zeus', type: 'deity' },
                { id: 'hydra', type: 'creature' }
            ];

            // Singular filter, singular type
            expect(service.filterByType(assets, 'deity').length).toBe(1);
            // Plural filter should match singular type
            expect(service.filterByType(assets, 'deitys').length).toBe(1);
        });
    });

    describe('filterByOwner', () => {
        test('should filter by createdBy field', () => {
            const assets = [
                { id: 'a', createdBy: 'user1' },
                { id: 'b', createdBy: 'user2' },
                { id: 'c', userId: 'user1' }
            ];

            const result = service.filterByOwner(assets, 'user1');
            expect(result.length).toBe(2);
        });
    });

    describe('filterByStatus', () => {
        test('should filter by status field', () => {
            const assets = [
                { id: 'a', status: 'approved' },
                { id: 'b', status: 'pending' },
                { id: 'c', status: 'approved' }
            ];

            const result = service.filterByStatus(assets, 'approved');
            expect(result.length).toBe(2);
        });
    });

    describe('combineFilters', () => {
        test('should apply multiple filters sequentially', () => {
            const assets = [
                { id: 'zeus', mythology: 'Greek', status: 'approved', type: 'deity' },
                { id: 'ra', mythology: 'Egyptian', status: 'approved', type: 'deity' },
                { id: 'hydra', mythology: 'Greek', status: 'pending', type: 'creature' }
            ];

            const result = service.combineFilters(assets, [
                { type: FilterTypes.MYTHOLOGY, value: 'Greek' },
                { type: FilterTypes.STATUS, value: 'approved' }
            ]);

            expect(result.length).toBe(1);
            expect(result[0].id).toBe('zeus');
        });

        test('should return all assets when no filters provided', () => {
            const assets = [{ id: 'a' }, { id: 'b' }];
            expect(service.combineFilters(assets, [])).toEqual(assets);
        });

        test('should return empty array for non-array input', () => {
            expect(service.combineFilters(null, [])).toEqual([]);
        });
    });

    describe('filterByDateRange', () => {
        test('should filter assets within date range', () => {
            const assets = [
                { id: 'a', createdAt: 1000 },
                { id: 'b', createdAt: 2000 },
                { id: 'c', createdAt: 3000 }
            ];

            const result = service.filterByDateRange(assets, 1500, 2500);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('b');
        });
    });

    // ==========================================
    // 6. Pagination
    // ==========================================

    describe('paginate', () => {
        const assets = Array.from({ length: 50 }, (_, i) => ({ id: `item${i}` }));

        test('should return first page of items', () => {
            const page = service.paginate(assets, 1, 10);
            expect(page.length).toBe(10);
            expect(page[0].id).toBe('item0');
        });

        test('should return second page of items', () => {
            const page = service.paginate(assets, 2, 10);
            expect(page.length).toBe(10);
            expect(page[0].id).toBe('item10');
        });

        test('should return empty array for out-of-range page', () => {
            const page = service.paginate(assets, 100, 10);
            expect(page.length).toBe(0);
        });

        test('should handle non-array input', () => {
            expect(service.paginate(null, 1, 10)).toEqual([]);
        });
    });

    describe('getPageInfo', () => {
        test('should return correct pagination metadata', () => {
            const info = service.getPageInfo(50, 2, 10);
            expect(info.currentPage).toBe(2);
            expect(info.totalPages).toBe(5);
            expect(info.totalItems).toBe(50);
            expect(info.hasNextPage).toBe(true);
            expect(info.hasPrevPage).toBe(true);
            expect(info.startItem).toBe(11);
            expect(info.endItem).toBe(20);
        });

        test('should indicate first page correctly', () => {
            const info = service.getPageInfo(50, 1, 10);
            expect(info.isFirstPage).toBe(true);
            expect(info.hasPrevPage).toBe(false);
        });

        test('should indicate last page correctly', () => {
            const info = service.getPageInfo(50, 5, 10);
            expect(info.isLastPage).toBe(true);
            expect(info.hasNextPage).toBe(false);
        });

        test('should handle zero total items', () => {
            const info = service.getPageInfo(0, 1, 10);
            expect(info.totalPages).toBe(0);
            expect(info.startItem).toBe(0);
            expect(info.endItem).toBe(0);
        });
    });

    // ==========================================
    // 7. Private helper coverage
    // ==========================================

    describe('_getTimestamp', () => {
        test('should handle Firestore Timestamp objects', () => {
            const asset = {
                createdAt: { toMillis: () => 1234567890 }
            };
            const ts = service._getTimestamp(asset);
            expect(ts).toBe(1234567890);
        });

        test('should handle Firestore seconds-based timestamps', () => {
            const asset = {
                createdAt: { seconds: 1234 }
            };
            const ts = service._getTimestamp(asset);
            expect(ts).toBe(1234000);
        });

        test('should handle ISO string dates', () => {
            const asset = {
                createdAt: '2024-01-15T00:00:00Z'
            };
            const ts = service._getTimestamp(asset);
            expect(ts).toBeGreaterThan(0);
        });

        test('should return 0 for missing timestamp', () => {
            expect(service._getTimestamp({})).toBe(0);
        });
    });
});
