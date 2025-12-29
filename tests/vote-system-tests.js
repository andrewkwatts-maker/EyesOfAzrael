/**
 * Voting System Test Suite
 * Tests vote service, vote buttons, and analytics
 *
 * Test Coverage:
 * - Transaction-based vote logic
 * - Race condition handling
 * - Vote state transitions
 * - Real-time updates
 * - Rate limiting
 * - Analytics tracking
 * - Security rules
 *
 * Run with: npm test tests/vote-system-tests.js
 */

describe('Voting System', () => {
    let voteService;
    let voteAnalytics;
    let mockDb;
    let mockAuth;
    let testUser;

    beforeEach(() => {
        // Mock Firestore database
        mockDb = {
            collection: jest.fn(),
            doc: jest.fn(),
            runTransaction: jest.fn()
        };

        // Mock Firebase Auth
        testUser = {
            uid: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User'
        };

        mockAuth = {
            currentUser: testUser
        };

        // Initialize services
        voteService = new VoteService(mockDb, mockAuth);
        voteAnalytics = new VoteAnalyticsService(mockDb, mockAuth);
    });

    describe('VoteService', () => {
        describe('handleVote()', () => {
            test('should add new upvote', async () => {
                const mockTransaction = {
                    get: jest.fn().mockResolvedValue({
                        exists: false
                    }),
                    set: jest.fn(),
                    update: jest.fn()
                };

                mockDb.runTransaction.mockImplementation(async (callback) => {
                    return callback(mockTransaction);
                });

                const result = await voteService.handleVote('item123', 'assets', 1);

                expect(result.success).toBe(true);
                expect(result.userVote).toBe(1);
                expect(mockTransaction.set).toHaveBeenCalled();
            });

            test('should change vote from upvote to downvote', async () => {
                const mockVoteDoc = {
                    exists: true,
                    data: () => ({ value: 1, userId: testUser.uid })
                };

                const mockTransaction = {
                    get: jest.fn().mockResolvedValue(mockVoteDoc),
                    update: jest.fn()
                };

                mockDb.runTransaction.mockImplementation(async (callback) => {
                    return callback(mockTransaction);
                });

                const result = await voteService.handleVote('item123', 'assets', -1);

                expect(result.success).toBe(true);
                expect(result.userVote).toBe(-1);
                expect(result.voteDelta).toBe(-2); // Changed from +1 to -1
            });

            test('should remove vote when clicking same button', async () => {
                const mockVoteDoc = {
                    exists: true,
                    data: () => ({ value: 1, userId: testUser.uid })
                };

                const mockTransaction = {
                    get: jest.fn().mockResolvedValue(mockVoteDoc),
                    delete: jest.fn(),
                    update: jest.fn()
                };

                mockDb.runTransaction.mockImplementation(async (callback) => {
                    return callback(mockTransaction);
                });

                const result = await voteService.handleVote('item123', 'assets', 1);

                expect(result.success).toBe(true);
                expect(result.userVote).toBe(0);
                expect(mockTransaction.delete).toHaveBeenCalled();
            });

            test('should enforce rate limiting', async () => {
                // Simulate rapid voting
                voteService.votesInLastMinute = voteService.maxVotesPerMinute;

                const result = await voteService.handleVote('item123', 'assets', 1);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Too many votes');
            });

            test('should reject invalid vote value', async () => {
                const result = await voteService.handleVote('item123', 'assets', 5);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Invalid vote value');
            });

            test('should reject invalid item type', async () => {
                const result = await voteService.handleVote('item123', 'invalid', 1);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Invalid item type');
            });

            test('should require authentication', async () => {
                mockAuth.currentUser = null;

                const result = await voteService.handleVote('item123', 'assets', 1);

                expect(result.success).toBe(false);
                expect(result.error).toContain('must be logged in');
            });
        });

        describe('Race Condition Handling', () => {
            test('should handle concurrent votes with transactions', async () => {
                let transactionCount = 0;

                mockDb.runTransaction.mockImplementation(async (callback) => {
                    transactionCount++;

                    // Simulate concurrent transaction
                    if (transactionCount === 1) {
                        // First transaction succeeds
                        const mockTransaction = {
                            get: jest.fn().mockResolvedValue({ exists: false }),
                            set: jest.fn(),
                            update: jest.fn()
                        };
                        return callback(mockTransaction);
                    } else {
                        // Second transaction sees updated data
                        const mockTransaction = {
                            get: jest.fn().mockResolvedValue({
                                exists: true,
                                data: () => ({ value: 1, userId: testUser.uid })
                            }),
                            update: jest.fn()
                        };
                        return callback(mockTransaction);
                    }
                });

                // Simulate two concurrent votes
                const [result1, result2] = await Promise.all([
                    voteService.handleVote('item123', 'assets', 1),
                    voteService.handleVote('item123', 'assets', -1)
                ]);

                expect(result1.success).toBe(true);
                expect(result2.success).toBe(true);
                expect(transactionCount).toBe(2);
            });
        });

        describe('getUserVote()', () => {
            test('should return user vote if exists', async () => {
                const mockVoteDoc = {
                    exists: true,
                    data: () => ({ value: 1, userId: testUser.uid })
                };

                const mockDocRef = {
                    get: jest.fn().mockResolvedValue(mockVoteDoc)
                };

                mockDb.doc = jest.fn().mockReturnValue(mockDocRef);

                const result = await voteService.getUserVote('item123', 'assets');

                expect(result.success).toBe(true);
                expect(result.vote).toBe(1);
            });

            test('should return 0 if no vote exists', async () => {
                const mockVoteDoc = {
                    exists: false
                };

                const mockDocRef = {
                    get: jest.fn().mockResolvedValue(mockVoteDoc)
                };

                mockDb.doc = jest.fn().mockReturnValue(mockDocRef);

                const result = await voteService.getUserVote('item123', 'assets');

                expect(result.success).toBe(true);
                expect(result.vote).toBe(0);
            });
        });

        describe('getVoteCounts()', () => {
            test('should calculate vote counts correctly', async () => {
                const mockDocs = [
                    { data: () => ({ value: 1 }) },
                    { data: () => ({ value: 1 }) },
                    { data: () => ({ value: -1 }) },
                    { data: () => ({ value: 1 }) },
                    { data: () => ({ value: -1 }) }
                ];

                const mockSnapshot = {
                    forEach: (callback) => mockDocs.forEach(callback)
                };

                const mockCollection = {
                    get: jest.fn().mockResolvedValue(mockSnapshot)
                };

                mockDb.collection = jest.fn().mockReturnValue(mockCollection);

                const result = await voteService.getVoteCounts('item123', 'assets');

                expect(result.success).toBe(true);
                expect(result.upvotes).toBe(3);
                expect(result.downvotes).toBe(2);
                expect(result.total).toBe(1); // 3 - 2 = 1
            });
        });

        describe('calculateContestedScore()', () => {
            test('should calculate high contested score for balanced votes', () => {
                const score = voteService.calculateContestedScore(100, 98);
                // (100 + 98) * 1000 - |100 - 98| = 198000 - 2 = 197998
                expect(score).toBe(197998);
            });

            test('should calculate low contested score for skewed votes', () => {
                const score = voteService.calculateContestedScore(100, 10);
                // (100 + 10) * 1000 - |100 - 10| = 110000 - 90 = 109910
                expect(score).toBe(109910);
            });

            test('should return 0 for no votes', () => {
                const score = voteService.calculateContestedScore(0, 0);
                expect(score).toBe(0);
            });
        });
    });

    describe('VoteButtonsComponent', () => {
        let container;
        let component;

        beforeEach(() => {
            // Create test container
            container = document.createElement('div');
            container.className = 'vote-buttons';
            container.dataset.itemId = 'test-item-123';
            container.dataset.itemType = 'assets';
            document.body.appendChild(container);

            // Mock VoteService
            window.VoteService = VoteService;
            window.FirebaseService = {
                isAuthenticated: () => true,
                getCurrentUser: () => testUser
            };
            window.db = mockDb;
            window.auth = mockAuth;
        });

        afterEach(() => {
            if (component) {
                component.destroy();
            }
            document.body.removeChild(container);
        });

        test('should initialize with correct item data', () => {
            component = new VoteButtonsComponent(container);

            expect(component.itemId).toBe('test-item-123');
            expect(component.itemType).toBe('assets');
        });

        test('should render vote buttons', () => {
            component = new VoteButtonsComponent(container);
            component.render();

            expect(container.querySelector('.upvote-btn')).toBeTruthy();
            expect(container.querySelector('.downvote-btn')).toBeTruthy();
            expect(container.querySelector('.total-votes-value')).toBeTruthy();
        });

        test('should update UI on vote', async () => {
            component = new VoteButtonsComponent(container);
            component.render();

            component.userVote = 1;
            component.totalVotes = 10;
            component.updateUI();

            const upvoteBtn = container.querySelector('.upvote-btn');
            expect(upvoteBtn.dataset.active).toBe('true');
        });

        test('should show login prompt when not authenticated', () => {
            window.FirebaseService.isAuthenticated = () => false;

            component = new VoteButtonsComponent(container);
            component.render();
            component.showLoginPrompt();

            const loginPrompt = container.querySelector('.vote-login-prompt');
            expect(loginPrompt.style.display).not.toBe('none');
        });

        test('should apply optimistic update', () => {
            component = new VoteButtonsComponent(container);
            component.userVote = 0;
            component.totalVotes = 5;
            component.upvoteCount = 3;
            component.downvoteCount = 2;

            component.applyOptimisticUpdate(1);

            expect(component.userVote).toBe(1);
            expect(component.totalVotes).toBe(6);
            expect(component.upvoteCount).toBe(4);
        });
    });

    describe('VoteAnalyticsService', () => {
        describe('trackVoteAction()', () => {
            test('should track vote event', async () => {
                const mockAdd = jest.fn().mockResolvedValue({ id: 'event123' });
                const mockCollection = {
                    add: mockAdd
                };
                mockDb.collection = jest.fn().mockReturnValue(mockCollection);

                await voteAnalytics.trackVoteAction('vote_added', 'assets', 'item123', 1, 1);

                expect(mockAdd).toHaveBeenCalled();
                const eventData = mockAdd.mock.calls[0][0];
                expect(eventData.action).toBe('vote_added');
                expect(eventData.itemType).toBe('assets');
                expect(eventData.voteValue).toBe(1);
            });
        });

        describe('calculateControversyRating()', () => {
            test('should return 100 for perfectly split votes', () => {
                const rating = voteAnalytics.calculateControversyRating({
                    upvoteCount: 50,
                    downvoteCount: 50
                });
                expect(rating).toBe(100);
            });

            test('should return 0 for no downvotes', () => {
                const rating = voteAnalytics.calculateControversyRating({
                    upvoteCount: 100,
                    downvoteCount: 0
                });
                expect(rating).toBe(0);
            });

            test('should return moderate rating for 75/25 split', () => {
                const rating = voteAnalytics.calculateControversyRating({
                    upvoteCount: 75,
                    downvoteCount: 25
                });
                // (25 / 100) * 200 = 50
                expect(rating).toBe(50);
            });
        });

        describe('generateReport()', () => {
            test('should generate voting report for date range', async () => {
                const mockDocs = [
                    { data: () => ({ action: 'vote_added', voteValue: 1, userId: 'user1', itemType: 'assets', date: '2025-01-01' }) },
                    { data: () => ({ action: 'vote_added', voteValue: -1, userId: 'user2', itemType: 'assets', date: '2025-01-02' }) },
                    { data: () => ({ action: 'vote_changed', voteValue: 1, userId: 'user1', itemType: 'notes', date: '2025-01-03' }) }
                ];

                const mockSnapshot = {
                    docs: mockDocs
                };

                const mockQuery = {
                    get: jest.fn().mockResolvedValue(mockSnapshot)
                };

                mockDb.collection = jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue(mockQuery)
                    })
                });

                const startDate = new Date('2025-01-01');
                const endDate = new Date('2025-01-31');
                const report = await voteAnalytics.generateReport(startDate, endDate);

                expect(report.totalVotes).toBe(3);
                expect(report.totalUpvotes).toBe(2);
                expect(report.totalDownvotes).toBe(1);
                expect(report.uniqueVoters).toBe(2);
            });
        });
    });

    describe('Integration Tests', () => {
        test('should handle complete vote flow', async () => {
            // Mock successful transaction
            const mockTransaction = {
                get: jest.fn()
                    .mockResolvedValueOnce({ exists: false }) // Vote doesn't exist
                    .mockResolvedValueOnce({ exists: true, data: () => ({ votes: 0 }) }), // Item exists
                set: jest.fn(),
                update: jest.fn()
            };

            mockDb.runTransaction.mockImplementation(async (callback) => {
                return callback(mockTransaction);
            });

            // Track analytics
            const mockAnalyticsAdd = jest.fn().mockResolvedValue({ id: 'event123' });
            mockDb.collection = jest.fn().mockReturnValue({ add: mockAnalyticsAdd });

            // Perform vote
            const result = await voteService.handleVote('item123', 'assets', 1);

            expect(result.success).toBe(true);
            expect(result.userVote).toBe(1);
            expect(mockTransaction.set).toHaveBeenCalled();

            // Track analytics
            await voteAnalytics.trackVoteAction('vote_added', 'assets', 'item123', 1, 1);
            expect(mockAnalyticsAdd).toHaveBeenCalled();
        });
    });
});

/**
 * Manual Testing Checklist
 *
 * Browser Tests:
 * □ Vote button appears on asset cards
 * □ Click upvote - button turns green
 * □ Click upvote again - vote removed, button gray
 * □ Click downvote - button turns red
 * □ Switch from upvote to downvote - net change of 2
 * □ Total vote count updates in real-time
 * □ Login prompt shows when not authenticated
 * □ Rate limit warning appears after 100 votes
 * □ Optimistic UI updates (instant feedback)
 * □ Vote persists across page refresh
 *
 * Transaction Tests:
 * □ Open same item in two browser windows
 * □ Vote simultaneously in both windows
 * □ Both votes should be recorded correctly
 * □ No vote count race conditions
 *
 * Analytics Tests:
 * □ Vote events logged to Firestore
 * □ Daily stats updated correctly
 * □ Most upvoted items query works
 * □ Most controversial items query works
 * □ Contested score calculated correctly
 *
 * Security Tests:
 * □ Cannot vote without authentication
 * □ Cannot modify another user's vote
 * □ Cannot create vote with invalid value
 * □ Cannot exceed rate limits
 * □ Firestore rules enforce security
 */

module.exports = {
    VoteService,
    VoteButtonsComponent,
    VoteAnalyticsService
};
