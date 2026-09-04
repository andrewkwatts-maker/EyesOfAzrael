/**
 * VoteService Tests
 *
 * Tests for js/services/vote-service.js
 *
 * Firestore is mocked at the SDK boundary with a path-addressable fake, so the
 * vote document (`votes/{itemType}/{itemId}/{userId}`), the aggregate item
 * document (`{itemType}/{itemId}`) and the votes collection can each be
 * configured independently. That matters because handleVote() drives all three
 * inside a single transaction against one aggregate document.
 *
 * Test Categories:
 * 1. Constructor & initialization
 * 2. calculateContestedScore
 * 3. handleVote guard clauses
 * 4. handleVote transaction behaviour (new / toggle / change / failure / retry)
 * 5. Analytics + event dispatch
 * 6. getUserVote / getVoteCounts / getTotalVotes
 * 7. subscribeToVotes (debounce, teardown, errors)
 * 8. Leaderboard queries
 * 9. getUserVotingHistory
 * 10. Rate limiting
 * 11. Controversy service integration (delegation + fallbacks)
 * 12. cleanup
 */

const VoteService = require('../../js/services/vote-service.js');

// ---------------------------------------------------------------------------
// Firestore test doubles
// ---------------------------------------------------------------------------

function docSnap(id, data) {
    return { exists: true, id, data: () => data };
}

function missingSnap(id) {
    return { exists: false, id, data: () => undefined };
}

function querySnap(snaps) {
    return {
        docs: snaps,
        size: snaps.length,
        empty: snaps.length === 0,
        forEach: (cb) => snaps.forEach(cb)
    };
}

/** A vote document snapshot living at the given Firestore path. */
function voteDoc(path, value, timestamp = 0) {
    return {
        id: path.split('/').pop(),
        ref: { path },
        exists: true,
        data: () => ({ value, userId: path.split('/').pop(), timestamp })
    };
}

function createMockDb() {
    const docs = new Map();
    const cols = new Map();
    const transactions = [];

    function docRef(path) {
        if (!docs.has(path)) {
            docs.set(path, {
                id: path.split('/').pop(),
                path,
                get: jest.fn(() => Promise.resolve(missingSnap(path.split('/').pop()))),
                set: jest.fn(() => Promise.resolve()),
                update: jest.fn(() => Promise.resolve()),
                delete: jest.fn(() => Promise.resolve()),
                onSnapshot: jest.fn(() => jest.fn())
            });
        }
        return docs.get(path);
    }

    function collectionRef(path) {
        if (!cols.has(path)) {
            const ref = {
                path,
                doc: jest.fn((id) => docRef(`${path}/${id}`)),
                where: jest.fn(() => ref),
                orderBy: jest.fn(() => ref),
                limit: jest.fn(() => ref),
                get: jest.fn(() => Promise.resolve(querySnap([])))
            };
            cols.set(path, ref);
        }
        return cols.get(path);
    }

    function groupRef(name) {
        return collectionRef(`__group__/${name}`);
    }

    const db = {
        doc: jest.fn((path) => docRef(path)),
        collection: jest.fn((path) => collectionRef(path)),
        collectionGroup: jest.fn((name) => groupRef(name)),
        runTransaction: jest.fn(async (fn) => {
            const transaction = {
                get: jest.fn((ref) => ref.get()),
                set: jest.fn(),
                update: jest.fn(),
                delete: jest.fn()
            };
            transactions.push(transaction);
            return fn(transaction);
        })
    };

    return { db, docRef, collectionRef, groupRef, transactions };
}

function createMockAuth(user = undefined) {
    return {
        currentUser: user === undefined
            ? { uid: 'test-user-123', email: 'test@example.com' }
            : user
    };
}

/** A stand-in for VotingControversyService. */
function createControversyServiceMock() {
    return {
        getVoteCounts: jest.fn(() => Promise.resolve({
            success: true,
            upvotes: 12,
            downvotes: 9,
            score: 3,
            weightedScore: 2.5,
            controversyScore: 0.8,
            isControversial: true,
            totalEngagement: 21,
            trendingScore: 4.2
        })),
        isControversial: jest.fn(() => Promise.resolve(true)),
        getMostControversial: jest.fn(() => Promise.resolve([{ id: 'c1' }])),
        getTrendingAssets: jest.fn(() => Promise.resolve([{ id: 't1' }])),
        getVoteHistory: jest.fn(() => Promise.resolve({ success: true, history: [{ t: 1 }] })),
        getControversyBadge: jest.fn(() => Promise.resolve({ label: 'Hotly debated' })),
        renderBadgeHTML: jest.fn(() => '<span class="badge">Hotly debated</span>'),
        subscribeToVotes: jest.fn(() => jest.fn()),
        calculateControversy: jest.fn(() => 0.42),
        cleanup: jest.fn()
    };
}

describe('VoteService', () => {
    let service;
    let mockDb;
    let mockAuth;
    let fs;
    let dispatchSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        delete window.votingControversyService;
        delete window.AnalyticsManager;

        fs = createMockDb();
        mockDb = fs.db;
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

        dispatchSpy = jest.spyOn(window, 'dispatchEvent');

        service = new VoteService(mockDb, mockAuth);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /** Read the CustomEvent of the given type dispatched during the test. */
    function dispatchedEvent(type) {
        const call = dispatchSpy.mock.calls.find(([e]) => e && e.type === type);
        return call ? call[0] : null;
    }

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

        test('should adopt an explicitly injected controversy service', () => {
            const controversy = createControversyServiceMock();
            const s = new VoteService(mockDb, mockAuth, controversy);
            expect(s.getControversyService()).toBe(controversy);
        });

        test('should pick up a controversy service published on window after construction', () => {
            expect(service.getControversyService()).toBeUndefined();

            const controversy = createControversyServiceMock();
            window.votingControversyService = controversy;

            expect(service.getControversyService()).toBe(controversy);
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

        test('should rank a contested item above an equally engaged consensus item', () => {
            expect(service.calculateContestedScore(100, 98))
                .toBeGreaterThan(service.calculateContestedScore(196, 2));
        });
    });

    // ==========================================
    // 3. handleVote guard clauses
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

        test('should not open a transaction when a guard clause rejects the vote', async () => {
            await service.handleVote('item1', 'invalid', 1);
            await service.handleVote('item1', 'assets', 0);
            mockAuth.currentUser = null;
            await service.handleVote('item1', 'assets', 1);

            expect(mockDb.runTransaction).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // 4. handleVote transaction behaviour
    // ==========================================

    describe('handleVote transaction', () => {
        const USER = 'test-user-123';
        const VOTE_PATH = `votes/assets/item1/${USER}`;
        const ITEM_PATH = 'assets/item1';
        const VOTES_COLLECTION = 'votes/assets/item1';

        /**
         * Configure the three documents the transaction touches.
         * @param {Object|null} existingVote - the caller's current vote, or null
         * @param {Array} allVotes - the votes collection contents *after* the write
         * @param {boolean} itemExists - whether the aggregate item document exists
         */
        /**
         * @param existingVote  this user's prior vote document, or null
         * @param allVotes      retained for callers that still describe the whole
         *                      ballot; the service no longer reads the collection
         *                      (see `itemCounts`) but the stub stays harmless
         * @param itemExists    whether the target document is present
         * @param itemCounts    the tallies already stored on the item
         *
         * Counts now come from the item document rather than from a scan of the
         * votes collection. The service used to recount every vote inside the
         * transaction, which was both illegal — a read after a write, and a query
         * where the web SDK allows only a document — and increasingly expensive as
         * an item got popular. Seeding the prior tallies here is what the running
         * system actually provides.
         */
        function stubVoteState(existingVote, allVotes = [], itemExists = true, itemCounts = {}) {
            fs.docRef(VOTE_PATH).get.mockResolvedValue(
                existingVote ? docSnap(USER, existingVote) : missingSnap(USER)
            );
            fs.docRef(ITEM_PATH).get.mockResolvedValue(
                itemExists
                    ? docSnap('item1', { votes: 0, upvoteCount: 0, downvoteCount: 0, ...itemCounts })
                    : missingSnap('item1')
            );
            fs.collectionRef(VOTES_COLLECTION).get.mockResolvedValue(querySnap(allVotes));
        }

        test('should record a brand new upvote', async () => {
            stubVoteState(null, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result).toMatchObject({
                success: true,
                newVotes: 1,
                voteDelta: 1,
                userVote: 1,
                upvoteCount: 1,
                downvoteCount: 0,
                totalEngagement: 1
            });
            const txn = fs.transactions[0];
            expect(txn.set).toHaveBeenCalledWith(
                fs.docRef(VOTE_PATH),
                expect.objectContaining({ value: 1, userId: USER })
            );
        });

        test('should write the aggregate document with all derived metrics', async () => {
            // One upvote and one downvote already stored; this user then upvotes.
            stubVoteState(null, [], true, { upvoteCount: 1, downvoteCount: 1 });

            await service.handleVote('item1', 'assets', 1);

            expect(fs.transactions[0].update).toHaveBeenCalledWith(fs.docRef(ITEM_PATH), {
                votes: 1,
                upvoteCount: 2,
                downvoteCount: 1,
                contestedScore: service.calculateContestedScore(2, 1),
                totalEngagement: 3,
                updatedAt: 'SERVER_TIMESTAMP'
            });
        });

        test('should remove the vote when the same button is pressed again', async () => {
            stubVoteState({ value: 1 }, []);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result).toMatchObject({ success: true, voteDelta: -1, userVote: 0, newVotes: 0 });
            expect(fs.transactions[0].delete).toHaveBeenCalledWith(fs.docRef(VOTE_PATH));
            expect(fs.transactions[0].set).not.toHaveBeenCalled();
        });

        test('should remove a downvote with a positive delta', async () => {
            stubVoteState({ value: -1 }, []);

            const result = await service.handleVote('item1', 'assets', -1);

            expect(result.voteDelta).toBe(1);
            expect(result.userVote).toBe(0);
        });

        test('should change an existing downvote to an upvote with a delta of 2', async () => {
            stubVoteState({ value: -1 }, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result).toMatchObject({ voteDelta: 2, userVote: 1, newVotes: 1 });
            expect(fs.transactions[0].update).toHaveBeenCalledWith(
                fs.docRef(VOTE_PATH),
                expect.objectContaining({ value: 1 })
            );
            expect(fs.transactions[0].delete).not.toHaveBeenCalled();
        });

        test('should change an existing upvote to a downvote with a delta of -2', async () => {
            stubVoteState({ value: 1 }, [voteDoc(`${VOTES_COLLECTION}/${USER}`, -1)]);

            const result = await service.handleVote('item1', 'assets', -1);

            expect(result).toMatchObject({ voteDelta: -2, userVote: -1, newVotes: -1 });
        });

        test('should vote on notes as well as assets', async () => {
            fs.docRef(`votes/notes/note1/${USER}`).get.mockResolvedValue(missingSnap(USER));
            fs.docRef('notes/note1').get.mockResolvedValue(docSnap('note1', {}));
            fs.collectionRef('votes/notes/note1').get.mockResolvedValue(
                querySnap([voteDoc(`votes/notes/note1/${USER}`, 1)])
            );

            const result = await service.handleVote('note1', 'notes', 1);

            expect(result.success).toBe(true);
            expect(mockDb.doc).toHaveBeenCalledWith(`votes/notes/note1/${USER}`);
            expect(mockDb.doc).toHaveBeenCalledWith('notes/note1');
        });

        test('should fail when the item document does not exist', async () => {
            stubVoteState(null, [], false);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Item not found');
        });

        test('should ignore vote documents with an unexpected value', async () => {
            stubVoteState(null, [
                voteDoc(`${VOTES_COLLECTION}/a`, 1),
                voteDoc(`${VOTES_COLLECTION}/b`, 0),
                voteDoc(`${VOTES_COLLECTION}/c`, 7)
            ]);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result.upvoteCount).toBe(1);
            expect(result.downvoteCount).toBe(0);
            expect(result.totalEngagement).toBe(1);
        });

        test('should surface a contended transaction failure as an error result', async () => {
            stubVoteState(null, []);
            const err = new Error('Transaction failed after 5 attempts.');
            err.code = 'aborted';
            mockDb.runTransaction.mockRejectedValue(err);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result).toEqual({ success: false, error: 'Transaction failed after 5 attempts.' });
            expect(dispatchedEvent('voteUpdated')).toBeNull();
        });

        test('should not consume rate limit budget when the transaction fails', async () => {
            stubVoteState(null, []);
            mockDb.runTransaction.mockRejectedValue(new Error('aborted'));

            await service.handleVote('item1', 'assets', 1);

            expect(service.votesInLastMinute).toBe(0);
        });

        test('should consume one unit of rate limit budget per successful vote', async () => {
            stubVoteState(null, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            await service.handleVote('item1', 'assets', 1);
            await service.handleVote('item1', 'assets', 1);

            expect(service.votesInLastMinute).toBe(2);
        });

        test('should yield the same counts when the SDK replays the transaction body', async () => {
            // One downvote already stored; this user upvotes, giving 1/1.
            stubVoteState(null, [], true, { upvoteCount: 0, downvoteCount: 1 });

            const attempts = [];
            mockDb.runTransaction.mockImplementation(async (fn) => {
                for (let i = 0; i < 3; i++) {
                    attempts.push(await fn({
                        get: (ref) => ref.get(),
                        set: jest.fn(), update: jest.fn(), delete: jest.fn()
                    }));
                }
                return attempts[attempts.length - 1];
            });

            const result = await service.handleVote('item1', 'assets', 1);

            // Firestore retries the callback on contention; it must be a pure
            // function of the documents it reads.
            expect(attempts[0]).toEqual(attempts[1]);
            expect(attempts[1]).toEqual(attempts[2]);
            expect(result).toMatchObject({ success: true, newVotes: 0, upvoteCount: 1, downvoteCount: 1 });
        });

        test('performs every read before any write, and reads only documents', async () => {
            // Firestore rejects a transaction that reads after it writes, and the
            // web SDK's transaction.get() accepts a DocumentReference only —
            // querying a collection inside a transaction is Admin-SDK-only. This
            // code violated both: it wrote the vote, then read the whole
            // votes/{type}/{id} collection to recount from scratch. Every vote
            // therefore threw and was swallowed as {success: false}, and the
            // existing double accepted both forms so nothing went red.
            //
            // Asserted structurally rather than by outcome, because the failure is
            // invisible against any mock permissive enough to run.
            stubVoteState({ value: -1 }, [], true, { upvoteCount: 3, downvoteCount: 2 });

            const calls = [];
            mockDb.runTransaction.mockImplementation(async (fn) => fn({
                get: (ref) => { calls.push({ op: 'read', ref }); return ref.get(); },
                set: (ref) => { calls.push({ op: 'write', ref }); },
                update: (ref) => { calls.push({ op: 'write', ref }); },
                delete: (ref) => { calls.push({ op: 'write', ref }); },
            }));

            await service.handleVote('item1', 'assets', 1);

            const firstWrite = calls.findIndex(c => c.op === 'write');
            const lastRead = calls.map(c => c.op).lastIndexOf('read');
            expect(firstWrite).toBeGreaterThan(-1);
            expect(lastRead).toBeLessThan(firstWrite);

            // Every read must target a document. A CollectionReference has no
            // `.id` distinct from its path in this double, so assert on the shape
            // the service actually asked for.
            const readPaths = calls.filter(c => c.op === 'read').map(c => c.ref.path);
            expect(readPaths).toEqual([VOTE_PATH, ITEM_PATH]);
            expect(readPaths).not.toContain(VOTES_COLLECTION);
        });

        test('derives counts from the item document rather than rescanning the ballot', async () => {
            // The recount was also a full collection read on the hottest write
            // path, so cost grew with popularity. Counting incrementally removes
            // it: flipping a downvote to an upvote moves one across.
            stubVoteState({ value: -1 }, [], true, { upvoteCount: 4, downvoteCount: 3 });

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result).toMatchObject({ upvoteCount: 5, downvoteCount: 2, voteDelta: 2 });
            expect(fs.collectionRef(VOTES_COLLECTION).get).not.toHaveBeenCalled();
        });

        test('never reports a negative tally when stored counts are missing or stale', async () => {
            // Voting has been failing in production, so counts may be absent or
            // behind. Retracting a vote that the stored tally does not know about
            // must floor at zero rather than render "-1 upvotes".
            stubVoteState({ value: 1 }, [], true, { upvoteCount: 0, downvoteCount: 0 });

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result.upvoteCount).toBe(0);
            expect(result.downvoteCount).toBe(0);
            expect(result.totalEngagement).toBe(0);
        });

        test('should only increment the rate limiter once even if the body is replayed', async () => {
            stubVoteState(null, []);
            mockDb.runTransaction.mockImplementation(async (fn) => {
                const t = { get: (ref) => ref.get(), set: jest.fn(), update: jest.fn(), delete: jest.fn() };
                await fn(t);
                return fn(t);
            });

            await service.handleVote('item1', 'assets', 1);

            expect(service.votesInLastMinute).toBe(1);
        });

        // ---- events & analytics ----

        test('should dispatch voteUpdated carrying the new totals', async () => {
            stubVoteState(null, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            await service.handleVote('item1', 'assets', 1);

            const event = dispatchedEvent('voteUpdated');
            expect(event).not.toBeNull();
            expect(event.detail).toMatchObject({
                itemId: 'item1', itemType: 'assets', newVotes: 1, userVote: 1
            });
        });

        test('should report a new vote to analytics as vote_added', async () => {
            window.AnalyticsManager = { trackEvent: jest.fn() };
            stubVoteState(null, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            await service.handleVote('item1', 'assets', 1);

            expect(window.AnalyticsManager.trackEvent).toHaveBeenCalledWith('vote_added', {
                itemType: 'assets', itemId: 'item1', voteValue: 1, voteDelta: 1
            });
        });

        test('should report a toggled-off vote to analytics as vote_removed', async () => {
            window.AnalyticsManager = { trackEvent: jest.fn() };
            stubVoteState({ value: 1 }, []);

            await service.handleVote('item1', 'assets', 1);

            expect(window.AnalyticsManager.trackEvent).toHaveBeenCalledWith(
                'vote_removed', expect.objectContaining({ voteDelta: -1 })
            );
        });

        test('should report a flipped vote to analytics as vote_changed', async () => {
            window.AnalyticsManager = { trackEvent: jest.fn() };
            stubVoteState({ value: -1 }, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            await service.handleVote('item1', 'assets', 1);

            expect(window.AnalyticsManager.trackEvent).toHaveBeenCalledWith(
                'vote_changed', expect.objectContaining({ voteDelta: 2 })
            );
        });

        test('should still succeed when no analytics manager is present', async () => {
            stubVoteState(null, [voteDoc(`${VOTES_COLLECTION}/${USER}`, 1)]);

            const result = await service.handleVote('item1', 'assets', 1);

            expect(result.success).toBe(true);
        });

        test('_trackVoteAnalytics should stay silent for a zero delta', () => {
            window.AnalyticsManager = { trackEvent: jest.fn() };

            service._trackVoteAnalytics('assets', 'item1', 1, 0);

            expect(window.AnalyticsManager.trackEvent).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // 6. getUserVote / getVoteCounts / getTotalVotes
    // ==========================================

    describe('getUserVote', () => {
        test('should return 0 when user is not logged in', async () => {
            mockAuth.currentUser = null;
            const result = await service.getUserVote('item1', 'assets');
            expect(result.success).toBe(true);
            expect(result.vote).toBe(0);
        });

        test('should not read Firestore for an anonymous visitor', async () => {
            mockAuth.currentUser = null;
            await service.getUserVote('item1', 'assets');
            expect(mockDb.doc).not.toHaveBeenCalled();
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

        test('should read the per-user vote document path', async () => {
            await service.getUserVote('item1', 'notes');
            expect(mockDb.doc).toHaveBeenCalledWith('votes/notes/item1/test-user-123');
        });

        test('should return an error result when the read fails', async () => {
            fs.docRef('votes/assets/item1/test-user-123').get
                .mockRejectedValue(new Error('permission denied'));

            const result = await service.getUserVote('item1', 'assets');

            expect(result.success).toBe(false);
            expect(result.error).toBe('permission denied');
        });
    });

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

        test('should report zeroes for an item with no votes', async () => {
            const result = await service.getVoteCounts('item1', 'assets');
            expect(result).toEqual({ success: true, upvotes: 0, downvotes: 0, total: 0 });
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

        test('should default to 0 when the item carries no vote total', async () => {
            fs.docRef('assets/item1').get.mockResolvedValue(docSnap('item1', {}));

            const result = await service.getTotalVotes('item1', 'assets');

            expect(result).toEqual({ success: true, votes: 0 });
        });

        test('should fail when item does not exist', async () => {
            mockDb.doc.mockReturnValue({
                get: jest.fn(() => Promise.resolve({ exists: false }))
            });

            const result = await service.getTotalVotes('item1', 'assets');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Item not found');
        });

        test('should return an error result when the read rejects', async () => {
            fs.docRef('assets/item1').get.mockRejectedValue(new Error('offline'));

            const result = await service.getTotalVotes('item1', 'assets');

            expect(result).toEqual({ success: false, error: 'offline' });
        });
    });

    // ==========================================
    // 7. subscribeToVotes
    // ==========================================

    describe('subscribeToVotes', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        /** Capture the onSnapshot handlers the service installs. */
        function captureListener(path = 'assets/item1') {
            const handlers = {};
            const unsubscribe = jest.fn();
            fs.docRef(path).onSnapshot.mockImplementation((onNext, onError) => {
                handlers.onNext = onNext;
                handlers.onError = onError;
                return unsubscribe;
            });
            return { handlers, unsubscribe };
        }

        test('should register the listener and track it for cleanup', () => {
            captureListener();
            service.subscribeToVotes('item1', 'assets', jest.fn());

            expect(service.activeListeners.has('assets/item1')).toBe(true);
        });

        test('should not invoke the callback before the debounce delay elapses', () => {
            const { handlers } = captureListener();
            const callback = jest.fn();
            service.subscribeToVotes('item1', 'assets', callback);

            handlers.onNext(docSnap('item1', { votes: 7, updatedAt: 123 }));
            jest.advanceTimersByTime(service.debounceDelay - 1);

            expect(callback).not.toHaveBeenCalled();
        });

        test('should deliver the vote total after the debounce delay', () => {
            const { handlers } = captureListener();
            const callback = jest.fn();
            service.subscribeToVotes('item1', 'assets', callback);

            handlers.onNext(docSnap('item1', { votes: 7, updatedAt: 123 }));
            jest.advanceTimersByTime(service.debounceDelay);

            expect(callback).toHaveBeenCalledWith({ votes: 7, timestamp: 123 });
        });

        test('should collapse a burst of snapshots into a single callback', () => {
            const { handlers } = captureListener();
            const callback = jest.fn();
            service.subscribeToVotes('item1', 'assets', callback);

            handlers.onNext(docSnap('item1', { votes: 1 }));
            jest.advanceTimersByTime(500);
            handlers.onNext(docSnap('item1', { votes: 2 }));
            jest.advanceTimersByTime(500);
            handlers.onNext(docSnap('item1', { votes: 3 }));
            jest.advanceTimersByTime(service.debounceDelay);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ votes: 3, timestamp: undefined });
        });

        test('should default a missing vote total to 0', () => {
            const { handlers } = captureListener();
            const callback = jest.fn();
            service.subscribeToVotes('item1', 'assets', callback);

            handlers.onNext(docSnap('item1', {}));
            jest.advanceTimersByTime(service.debounceDelay);

            expect(callback).toHaveBeenCalledWith({ votes: 0, timestamp: undefined });
        });

        test('should not call back when the item document has been removed', () => {
            const { handlers } = captureListener();
            const callback = jest.fn();
            service.subscribeToVotes('item1', 'assets', callback);

            handlers.onNext(missingSnap('item1'));
            jest.advanceTimersByTime(service.debounceDelay);

            expect(callback).not.toHaveBeenCalled();
            expect(service.updateDebounceTimers.has('assets/item1')).toBe(false);
        });

        test('should log listener errors without invoking the callback', () => {
            const { handlers } = captureListener();
            const callback = jest.fn();
            service.subscribeToVotes('item1', 'assets', callback);

            handlers.onError(new Error('listener blew up'));

            expect(callback).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
        });

        test('unsubscribing should release the listener and cancel a pending callback', () => {
            const { handlers, unsubscribe } = captureListener();
            const callback = jest.fn();
            const stop = service.subscribeToVotes('item1', 'assets', callback);

            handlers.onNext(docSnap('item1', { votes: 7 }));
            stop();
            jest.advanceTimersByTime(service.debounceDelay * 2);

            expect(unsubscribe).toHaveBeenCalled();
            expect(service.activeListeners.size).toBe(0);
            expect(service.updateDebounceTimers.size).toBe(0);
            expect(callback).not.toHaveBeenCalled();
        });

        test('unsubscribing with no pending update should still be safe', () => {
            const { unsubscribe } = captureListener();
            const stop = service.subscribeToVotes('item1', 'assets', jest.fn());

            expect(() => stop()).not.toThrow();
            expect(unsubscribe).toHaveBeenCalled();
        });
    });

    // ==========================================
    // 8. Leaderboard queries
    // ==========================================

    describe('getMostUpvoted', () => {
        test('should query positively-voted items in descending order', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(
                querySnap([docSnap('a1', { votes: 9 }), docSnap('a2', { votes: 4 })])
            );

            const result = await service.getMostUpvoted('assets', 5);

            expect(result.success).toBe(true);
            expect(result.items).toEqual([
                { id: 'a1', votes: 9 },
                { id: 'a2', votes: 4 }
            ]);
            const col = fs.collectionRef('assets');
            expect(col.where).toHaveBeenCalledWith('votes', '>', 0);
            expect(col.orderBy).toHaveBeenCalledWith('votes', 'desc');
            expect(col.limit).toHaveBeenCalledWith(5);
        });

        test('should default to a limit of 10', async () => {
            await service.getMostUpvoted('assets');
            expect(fs.collectionRef('assets').limit).toHaveBeenCalledWith(10);
        });

        test('should return an error result when the index is missing', async () => {
            const err = new Error('The query requires an index.');
            err.code = 'failed-precondition';
            fs.collectionRef('assets').get.mockRejectedValue(err);

            const result = await service.getMostUpvoted('assets');

            expect(result.success).toBe(false);
            expect(result.error).toContain('requires an index');
        });
    });

    describe('getMostContested', () => {
        test('should filter by minimum engagement and order by contested score', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(
                querySnap([docSnap('a1', { contestedScore: 5000 })])
            );

            const result = await service.getMostContested('assets', 3, 25);

            expect(result.items).toEqual([{ id: 'a1', contestedScore: 5000 }]);
            const col = fs.collectionRef('assets');
            expect(col.where).toHaveBeenCalledWith('totalEngagement', '>=', 25);
            expect(col.orderBy).toHaveBeenCalledWith('contestedScore', 'desc');
            expect(col.limit).toHaveBeenCalledWith(3);
        });

        test('should apply a default minimum engagement of 10', async () => {
            await service.getMostContested('assets');
            expect(fs.collectionRef('assets').where).toHaveBeenCalledWith('totalEngagement', '>=', 10);
        });

        test('should return an error result when the query fails', async () => {
            fs.collectionRef('assets').get.mockRejectedValue(new Error('index missing'));

            const result = await service.getMostContested('assets');

            expect(result).toEqual({ success: false, error: 'index missing' });
        });
    });

    describe('getMostControversial', () => {
        test('should rank items by their weaker-side vote count', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(
                querySnap([docSnap('a1', { name: 'One' }), docSnap('a2', { name: 'Two' })])
            );
            // a1: 1 up / 1 down -> controversyScore 1 ; a2: 5 up / 4 down -> 4
            fs.collectionRef('votes/assets/a1').get.mockResolvedValue(
                querySnap([voteDoc('votes/assets/a1/u1', 1), voteDoc('votes/assets/a1/u2', -1)])
            );
            fs.collectionRef('votes/assets/a2').get.mockResolvedValue(querySnap([
                ...Array.from({ length: 5 }, (_, i) => voteDoc(`votes/assets/a2/up${i}`, 1)),
                ...Array.from({ length: 4 }, (_, i) => voteDoc(`votes/assets/a2/dn${i}`, -1))
            ]));

            const result = await service.getMostControversial('assets');

            expect(result.success).toBe(true);
            expect(result.items.map(i => i.id)).toEqual(['a2', 'a1']);
            expect(result.items[0]).toMatchObject({ totalEngagement: 9, controversyScore: 4 });
        });

        test('should cap the result at the requested limit', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(
                querySnap([docSnap('a1', {}), docSnap('a2', {}), docSnap('a3', {})])
            );

            const result = await service.getMostControversial('assets', 2);

            expect(result.items).toHaveLength(2);
        });

        test('should skip items whose vote counts could not be read', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(
                querySnap([docSnap('a1', {}), docSnap('a2', {})])
            );
            fs.collectionRef('votes/assets/a1').get.mockRejectedValue(new Error('denied'));

            const result = await service.getMostControversial('assets');

            expect(result.success).toBe(true);
            expect(result.items.map(i => i.id)).toEqual(['a2']);
        });

        test('should return an error result when the item listing fails', async () => {
            fs.collectionRef('assets').get.mockRejectedValue(new Error('listing failed'));

            const result = await service.getMostControversial('assets');

            expect(result).toEqual({ success: false, error: 'listing failed' });
        });
    });

    // ==========================================
    // 9. getUserVotingHistory
    // ==========================================

    describe('getUserVotingHistory', () => {
        function stubHistory(snaps) {
            fs.groupRef('votes').get.mockResolvedValue(querySnap(snaps));
        }

        test('should fail when there is no user to query for', async () => {
            mockAuth.currentUser = null;

            const result = await service.getUserVotingHistory();

            expect(result).toEqual({ success: false, error: 'User not authenticated' });
        });

        test('should default to the signed-in user', async () => {
            stubHistory([]);

            await service.getUserVotingHistory();

            expect(fs.groupRef('votes').where).toHaveBeenCalledWith('userId', '==', 'test-user-123');
        });

        test('should accept an explicit user id', async () => {
            stubHistory([]);

            await service.getUserVotingHistory('someone-else');

            expect(fs.groupRef('votes').where).toHaveBeenCalledWith('userId', '==', 'someone-else');
        });

        test('should derive item type and id from the document path, newest first', async () => {
            stubHistory([
                voteDoc('votes/assets/zeus/test-user-123', 1, 100),
                voteDoc('votes/notes/note9/test-user-123', -1, 300),
                voteDoc('votes/assets/hera/test-user-123', 1, 200)
            ]);

            const result = await service.getUserVotingHistory();

            expect(result.success).toBe(true);
            expect(result.votes).toEqual([
                { itemType: 'notes', itemId: 'note9', value: -1, timestamp: 300 },
                { itemType: 'assets', itemId: 'hera', value: 1, timestamp: 200 },
                { itemType: 'assets', itemId: 'zeus', value: 1, timestamp: 100 }
            ]);
        });

        test('should return an error result when the collection group query fails', async () => {
            const err = new Error('The query requires a collection group index.');
            err.code = 'failed-precondition';
            fs.groupRef('votes').get.mockRejectedValue(err);

            const result = await service.getUserVotingHistory();

            expect(result.success).toBe(false);
            expect(result.error).toContain('collection group index');
        });
    });

    // ==========================================
    // 10. Rate limiting
    // ==========================================

    describe('rate limiting', () => {
        test('_checkRateLimit should return true when under limit', () => {
            service.votesInLastMinute = 0;
            expect(service._checkRateLimit()).toBe(true);
        });

        test('_checkRateLimit should return false at the ceiling', () => {
            service.votesInLastMinute = service.maxVotesPerMinute;
            service.rateLimitResetTime = Date.now() + 60000;

            expect(service._checkRateLimit()).toBe(false);
        });

        test('_checkRateLimit should reset counter when minute has passed', () => {
            service.votesInLastMinute = 150;
            service.rateLimitResetTime = Date.now() - 1000; // expired

            expect(service._checkRateLimit()).toBe(true);
            expect(service.votesInLastMinute).toBe(0);
        });

        test('_checkRateLimit should push the reset window forward on reset', () => {
            const before = Date.now();
            service.rateLimitResetTime = before - 1000;

            service._checkRateLimit();

            expect(service.rateLimitResetTime).toBeGreaterThanOrEqual(before + 60000 - 1000);
        });

        test('_incrementVoteCount should raise the counter by one', () => {
            service._incrementVoteCount();
            service._incrementVoteCount();
            expect(service.votesInLastMinute).toBe(2);
        });
    });

    // ==========================================
    // 11. Controversy service integration
    // ==========================================

    describe('setControversyServiceEnabled', () => {
        test('should toggle the integration flag', () => {
            service.setControversyServiceEnabled(false);
            expect(service.useControversyService).toBe(false);
            service.setControversyServiceEnabled(true);
            expect(service.useControversyService).toBe(true);
        });
    });

    describe('getEnhancedVoteCounts', () => {
        test('should return the controversy service payload when available', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            const result = await service.getEnhancedVoteCounts('item1', 'assets');

            expect(controversy.getVoteCounts).toHaveBeenCalledWith('item1');
            expect(result).toEqual({
                success: true,
                upvotes: 12,
                downvotes: 9,
                total: 3,
                weightedScore: 2.5,
                controversyScore: 0.8,
                isControversial: true,
                totalEngagement: 21,
                trendingScore: 4.2
            });
        });

        test('should fall back to raw counts when the controversy lookup fails', async () => {
            const controversy = createControversyServiceMock();
            controversy.getVoteCounts.mockResolvedValue({ success: false });
            service.controversyService = controversy;
            fs.collectionRef('votes/assets/item1').get.mockResolvedValue(
                querySnap([voteDoc('votes/assets/item1/u1', 1)])
            );

            const result = await service.getEnhancedVoteCounts('item1', 'assets');

            expect(result).toEqual({ success: true, upvotes: 1, downvotes: 0, total: 1 });
        });

        test('should fall back to raw counts when the integration is disabled', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;
            service.setControversyServiceEnabled(false);

            const result = await service.getEnhancedVoteCounts('item1', 'assets');

            expect(controversy.getVoteCounts).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.upvotes).toBe(0);
        });

        test('should fall back to raw counts when no controversy service exists', async () => {
            const result = await service.getEnhancedVoteCounts('item1', 'assets');
            expect(result).toEqual({ success: true, upvotes: 0, downvotes: 0, total: 0 });
        });
    });

    describe('isControversial', () => {
        test('should delegate to the controversy service when available', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            await expect(service.isControversial('item1', 'assets')).resolves.toBe(true);
            expect(controversy.isControversial).toHaveBeenCalledWith('item1');
        });

        test('should be false when fewer than five votes have been cast', async () => {
            fs.collectionRef('votes/assets/item1').get.mockResolvedValue(querySnap([
                voteDoc('votes/assets/item1/u1', 1),
                voteDoc('votes/assets/item1/u2', -1)
            ]));

            await expect(service.isControversial('item1', 'assets')).resolves.toBe(false);
        });

        test('should be true when the split is close enough over the threshold', async () => {
            fs.collectionRef('votes/assets/item1').get.mockResolvedValue(querySnap([
                ...Array.from({ length: 5 }, (_, i) => voteDoc(`votes/assets/item1/up${i}`, 1)),
                ...Array.from({ length: 4 }, (_, i) => voteDoc(`votes/assets/item1/dn${i}`, -1))
            ]));

            // ratio = 4/5 = 0.8 >= 0.7
            await expect(service.isControversial('item1', 'assets')).resolves.toBe(true);
        });

        test('should be false for a lopsided but well-engaged item', async () => {
            fs.collectionRef('votes/assets/item1').get.mockResolvedValue(querySnap([
                ...Array.from({ length: 10 }, (_, i) => voteDoc(`votes/assets/item1/up${i}`, 1)),
                voteDoc('votes/assets/item1/dn0', -1)
            ]));

            await expect(service.isControversial('item1', 'assets')).resolves.toBe(false);
        });

        test('should be false when the counts cannot be read', async () => {
            fs.collectionRef('votes/assets/item1').get.mockRejectedValue(new Error('denied'));

            await expect(service.isControversial('item1', 'assets')).resolves.toBe(false);
        });
    });

    describe('getControversialItems', () => {
        test('should delegate to the controversy service when available', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            await expect(service.getControversialItems('assets', 3)).resolves.toEqual([{ id: 'c1' }]);
            expect(controversy.getMostControversial).toHaveBeenCalledWith('assets', 3);
        });

        test('should fall back to the contested query', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(querySnap([docSnap('a1', {})]));

            const result = await service.getControversialItems('assets', 3);

            expect(result).toEqual({ success: true, items: [{ id: 'a1' }] });
        });
    });

    describe('getTrendingItems', () => {
        test('should delegate to the controversy service when available', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            await expect(service.getTrendingItems('assets', 'week', 5)).resolves.toEqual([{ id: 't1' }]);
            expect(controversy.getTrendingAssets).toHaveBeenCalledWith('week', 'assets', 5);
        });

        test('should fall back to the most upvoted items', async () => {
            fs.collectionRef('assets').get.mockResolvedValue(querySnap([docSnap('a1', { votes: 3 })]));

            await expect(service.getTrendingItems('assets')).resolves.toEqual([{ id: 'a1', votes: 3 }]);
        });

        test('should fall back to an empty list when the upvoted query fails', async () => {
            fs.collectionRef('assets').get.mockRejectedValue(new Error('index missing'));

            await expect(service.getTrendingItems('assets')).resolves.toEqual([]);
        });
    });

    describe('getVoteHistory', () => {
        test('should delegate to the controversy service when available', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            const result = await service.getVoteHistory('item1', 'assets');

            expect(result).toEqual({ success: true, history: [{ t: 1 }] });
            expect(controversy.getVoteHistory).toHaveBeenCalledWith('item1');
        });

        test('should synthesise a summary-only history from raw counts', async () => {
            fs.collectionRef('votes/assets/item1').get.mockResolvedValue(querySnap([
                voteDoc('votes/assets/item1/u1', 1),
                voteDoc('votes/assets/item1/u2', 1),
                voteDoc('votes/assets/item1/u3', -1)
            ]));

            const result = await service.getVoteHistory('item1', 'assets');

            expect(result).toEqual({
                success: true,
                history: [],
                detailedHistory: [],
                summary: { upvotes: 2, downvotes: 1, score: 1 }
            });
        });

        test('should report failure and zeroed totals when the counts cannot be read', async () => {
            fs.collectionRef('votes/assets/item1').get.mockRejectedValue(new Error('denied'));

            const result = await service.getVoteHistory('item1', 'assets');

            expect(result.success).toBe(false);
            expect(result.summary).toEqual({ upvotes: 0, downvotes: 0, score: 0 });
        });
    });

    describe('controversy badges', () => {
        test('getControversyBadge should delegate when the service is available', async () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            await expect(service.getControversyBadge('item1')).resolves.toEqual({ label: 'Hotly debated' });
        });

        test('getControversyBadge should be null without a controversy service', async () => {
            await expect(service.getControversyBadge('item1')).resolves.toBeNull();
        });

        test('getControversyBadge should be null when the integration is disabled', async () => {
            service.controversyService = createControversyServiceMock();
            service.setControversyServiceEnabled(false);

            await expect(service.getControversyBadge('item1')).resolves.toBeNull();
        });

        test('renderControversyBadge should render through the controversy service', () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            expect(service.renderControversyBadge({ label: 'x' })).toBe('<span class="badge">Hotly debated</span>');
        });

        test('renderControversyBadge should return an empty string without a badge', () => {
            service.controversyService = createControversyServiceMock();
            expect(service.renderControversyBadge(null)).toBe('');
        });

        test('renderControversyBadge should return an empty string without a service', () => {
            expect(service.renderControversyBadge({ label: 'x' })).toBe('');
        });
    });

    describe('subscribeToControversy', () => {
        test('should delegate to the controversy service when available', () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;
            const callback = jest.fn();

            service.subscribeToControversy('item1', callback);

            expect(controversy.subscribeToVotes).toHaveBeenCalledWith('item1', callback);
        });

        test('should fall back to a plain vote subscription with neutral controversy data', () => {
            jest.useFakeTimers();
            const handlers = {};
            fs.docRef('assets/item1').onSnapshot.mockImplementation((onNext) => {
                handlers.onNext = onNext;
                return jest.fn();
            });
            const callback = jest.fn();

            service.subscribeToControversy('item1', callback);
            handlers.onNext(docSnap('item1', { votes: 4 }));
            jest.advanceTimersByTime(service.debounceDelay);

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ votes: 4, controversyScore: 0, isControversial: false })
            );
            jest.useRealTimers();
        });
    });

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

        test('should score a balanced item above a lopsided one at equal engagement', () => {
            expect(service.calculateControversyScore(100, 95))
                .toBeGreaterThan(service.calculateControversyScore(190, 5));
        });

        test('should delegate to the controversy service when one is present', () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            expect(service.calculateControversyScore(10, 9)).toBe(0.42);
            expect(controversy.calculateControversy).toHaveBeenCalledWith(10, 9);
        });
    });

    // ==========================================
    // 12. cleanup
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

        test('should cancel a pending debounced callback', () => {
            jest.useFakeTimers();
            const pending = jest.fn();
            service.updateDebounceTimers.set('assets/item1', setTimeout(pending, 1000));

            service.cleanup();
            jest.advanceTimersByTime(5000);

            expect(pending).not.toHaveBeenCalled();
            jest.useRealTimers();
        });

        test('should cascade cleanup to the controversy service', () => {
            const controversy = createControversyServiceMock();
            service.controversyService = controversy;

            service.cleanup();

            expect(controversy.cleanup).toHaveBeenCalled();
        });

        test('should be safe with no controversy service attached', () => {
            expect(() => service.cleanup()).not.toThrow();
        });
    });
});
