/**
 * VoteService Tests
 *
 * Tests for js/services/vote-service.js
 *
 * Test Categories:
 * 1. Constructor & initialization (3 tests)
 * 2. calculateContestedScore (3 tests)
 * 3. handleVote validation (4 tests)
 * 4. getUserVote (3 tests)
 * 5. getVoteCounts (2 tests)
 * 6. getTotalVotes (2 tests)
 * 7. Rate limiting (2 tests)
 * 8. calculateControversyScore fallback (3 tests)
 * 9. cleanup (2 tests)
 *
 * Total: ~24 tests
 */

const VoteService = require('../../js/services/vote-service.js');

function createMockDb() {
    const mockDocRef = {
        get: jest.fn(() => Promise.resolve({
            exists: true,
            data: () => ({ votes: 5, upvoteCount: 8, downvoteCount: 3 })
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
        onSnapshot: jest.fn((cb, errCb) => {
            cb({ exists: true, data: () => ({ votes: 5, updatedAt: Date.now() }) });
            return jest.fn(); // unsubscribe
        })
    };

    const mockCollectionRef = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({
            docs: [],
            forEach: jest.fn()
        }))
    };

    const db = {
        doc: jest.fn(() => mockDocRef),
        collection: jest.fn(() => mockCollectionRef),
        collectionGroup: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            get: jest.fn(() => Promise.resolve({
                forEach: jest.fn()
            }))
        })),
        runTransaction: jest.fn(async (fn) => {
            const transaction = {
                get: jest.fn((ref) => ref.get()),
                set: jest.fn(),
                update: jest.fn(),
                delete: jest.fn()
            };
            return fn(transaction);
        })
    };

    return { db, mockDocRef, mockCollectionRef };
}

function createMockAuth(user = null) {
    return {
        currentUser: user || {
            uid: 'test-user-123',
            email: 'test@example.com'
        }
    };
}

describe('VoteService', () => {
    let service;
    let mockDb;
    let mockAuth;

    beforeEach(() => {
        jest.clearAllMocks();
        delete window.votingControversyService;
        delete window.AnalyticsManager;

        const mocks = createMockDb();
        mockDb = mocks.db;
        mockAuth = createMockAuth();

        // Mock firebase.firestore.FieldValue
        global.firebase = {
            firestore: Object.assign(jest.fn(), {
                FieldValue: {
                    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
                    increment: jest.fn(n => `INCREMENT_${n}`)
                }
            })
        };

        service = new VoteService(mockDb, mockAuth);
    });

    // ==========================================
    // 1. Constructor & initialization
    // ==========================================

    describe('constructor', () => {
        test('should store db and auth references', () => {
            expect(service.db).toBe(mockDb);
            expect(service.auth).toBe(mockAuth);
        });

        test('should initialize rate limiting defaults', () => {
            expect(service.votesInLastMinute).toBe(0);
            expect(service.maxVotesPerMinute).toBe(100);
        });

        test('should initialize empty listener and debounce maps', () => {
            expect(service.activeListeners.size).toBe(0);
            expect(service.updateDebounceTimers.size).toBe(0);
        });
    });

    // ==========================================
    // 2. calculateContestedScore
    // ==========================================

    describe('calculateContestedScore', () => {
        test('should return high score for evenly split votes', () => {
            // 100 up, 98 down = (198 * 1000) - 2 = 197998
            const score = service.calculateContestedScore(100, 98);
            expect(score).toBe(197998);
        });

        test('should return lower score for lopsided votes', () => {
            // 50 up, 2 down = (52 * 1000) - 48 = 51952
            const score = service.calculateContestedScore(50, 2);
            expect(score).toBe(51952);
        });

        test('should return 0 for no votes', () => {
            const score = service.calculateContestedScore(0, 0);
            expect(score).toBe(0);
        });
    });

    // ==========================================
    // 3. handleVote validation
    // ==========================================

    describe('handleVote', () => {
        test('should fail when user is not logged in', async () => {
            mockAuth.currentUser = null;
            const result = await service.handleVote('item1', 'assets', 1);
            expect(result.success).toBe(false);
            expect(result.error).toContain('logged in');
        });

        test('should fail with invalid item type', async () => {
            const result = await service.handleVote('item1', 'invalid', 1);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid item type');
        });

        test('should fail with invalid vote value', async () => {
            const result = await service.handleVote('item1', 'assets', 5);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid vote value');
        });

        test('should fail when rate limited', async () => {
            service.votesInLastMinute = 200;
            service.rateLimitResetTime = Date.now() + 60000;

            const result = await service.handleVote('item1', 'assets', 1);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many votes');
        });
    });

    // ==========================================
    // 4. getUserVote
    // ==========================================

    describe('getUserVote', () => {
        test('should return 0 when user is not logged in', async () => {
            mockAuth.currentUser = null;
            const result = await service.getUserVote('item1', 'assets');
            expect(result.success).toBe(true);
            expect(result.vote).toBe(0);
        });

        test('should return vote value when vote exists', async () => {
            mockDb.doc.mockReturnValue({
                get: jest.fn(() => Promise.resolve({
                    exists: true,
                    data: () => ({ value: 1 })
                }))
            });

            const result = await service.getUserVote('item1', 'assets');
            expect(result.success).toBe(true);
            expect(result.vote).toBe(1);
        });

        test('should return 0 when no vote exists', async () => {
            mockDb.doc.mockReturnValue({
                get: jest.fn(() => Promise.resolve({ exists: false }))
            });

            const result = await service.getUserVote('item1', 'assets');
            expect(result.success).toBe(true);
            expect(result.vote).toBe(0);
        });
    });

    // ==========================================
    // 5. getVoteCounts
    // ==========================================

    describe('getVoteCounts', () => {
        test('should count upvotes and downvotes from snapshot', async () => {
            const mockDocs = [
                { data: () => ({ value: 1 }) },
                { data: () => ({ value: 1 }) },
                { data: () => ({ value: -1 }) }
            ];

            mockDb.collection.mockReturnValue({
                get: jest.fn(() => Promise.resolve({
                    forEach: (cb) => mockDocs.forEach(cb)
                }))
            });

            const result = await service.getVoteCounts('item1', 'assets');
            expect(result.success).toBe(true);
            expect(result.upvotes).toBe(2);
            expect(result.downvotes).toBe(1);
            expect(result.total).toBe(1);
        });

        test('should return error on failure', async () => {
            mockDb.collection.mockReturnValue({
                get: jest.fn(() => Promise.reject(new Error('Network error')))
            });

            const result = await service.getVoteCounts('item1', 'assets');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
        });
    });

    // ==========================================
    // 6. getTotalVotes
    // ==========================================

    describe('getTotalVotes', () => {
        test('should return cached vote total from item document', async () => {
            mockDb.doc.mockReturnValue({
                get: jest.fn(() => Promise.resolve({
                    exists: true,
                    data: () => ({ votes: 42 })
                }))
            });

            const result = await service.getTotalVotes('item1', 'assets');
            expect(result.success).toBe(true);
            expect(result.votes).toBe(42);
        });

        test('should fail when item does not exist', async () => {
            mockDb.doc.mockReturnValue({
                get: jest.fn(() => Promise.resolve({ exists: false }))
            });

            const result = await service.getTotalVotes('item1', 'assets');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Item not found');
        });
    });

    // ==========================================
    // 7. Rate limiting
    // ==========================================

    describe('rate limiting', () => {
        test('_checkRateLimit should return true when under limit', () => {
            service.votesInLastMinute = 0;
            expect(service._checkRateLimit()).toBe(true);
        });

        test('_checkRateLimit should reset counter when minute has passed', () => {
            service.votesInLastMinute = 150;
            service.rateLimitResetTime = Date.now() - 1000; // expired

            expect(service._checkRateLimit()).toBe(true);
            expect(service.votesInLastMinute).toBe(0);
        });
    });

    // ==========================================
    // 8. calculateControversyScore fallback
    // ==========================================

    describe('calculateControversyScore', () => {
        test('should return 0 for zero votes', () => {
            expect(service.calculateControversyScore(0, 0)).toBe(0);
        });

        test('should return 0 when only one side has votes', () => {
            expect(service.calculateControversyScore(10, 0)).toBe(0);
            expect(service.calculateControversyScore(0, 10)).toBe(0);
        });

        test('should return high score for balanced high-engagement votes', () => {
            const score = service.calculateControversyScore(100, 95);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
        });
    });

    // ==========================================
    // 9. cleanup
    // ==========================================

    describe('cleanup', () => {
        test('should clear active listeners', () => {
            const unsub = jest.fn();
            service.activeListeners.set('test/item1', unsub);

            service.cleanup();

            expect(unsub).toHaveBeenCalled();
            expect(service.activeListeners.size).toBe(0);
        });

        test('should clear debounce timers', () => {
            jest.useFakeTimers();
            service.updateDebounceTimers.set('test/item1', setTimeout(() => {}, 5000));

            service.cleanup();

            expect(service.updateDebounceTimers.size).toBe(0);
            jest.useRealTimers();
        });
    });
});
