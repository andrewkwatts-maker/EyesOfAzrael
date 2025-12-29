/**
 * Corpus Query Voting Service
 * Integrates voting functionality with user corpus queries
 *
 * Features:
 * - Upvote/downvote corpus queries
 * - Vote tracking per user
 * - Real-time vote updates
 * - Integration with existing VoteService
 * - Contested score calculation
 *
 * Vote Structure:
 * votes/corpus_queries/{queryId}/{userId}
 * {
 *   value: 1 | -1,
 *   userId: string,
 *   timestamp: number
 * }
 */

class CorpusQueryVoting {
    /**
     * @param {firebase.firestore.Firestore} db - Firestore instance
     * @param {firebase.auth.Auth} auth - Firebase Auth instance
     */
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;

        // Collection paths
        this.votesPath = 'votes/corpus_queries';
        this.publicQueriesPath = 'public_corpus_queries';
        this.userQueriesPath = 'user_corpus_queries';

        // Rate limiting
        this.votesInLastMinute = 0;
        this.maxVotesPerMinute = 50;
        this.rateLimitResetTime = Date.now() + 60000;

        // Active listeners for cleanup
        this.activeListeners = new Map();
    }

    /**
     * Calculate contested score
     * High scores indicate items with many votes but close to 0 net
     * @param {number} upvotes - Total upvotes
     * @param {number} downvotes - Total downvotes
     * @returns {number}
     */
    calculateContestedScore(upvotes, downvotes) {
        const total = upvotes + downvotes;
        const net = upvotes - downvotes;
        return total * 1000 - Math.abs(net);
    }

    /**
     * Upvote a query
     * @param {string} queryId - Query ID
     * @returns {Promise<Object>}
     */
    async upvote(queryId) {
        return this.handleVote(queryId, 1);
    }

    /**
     * Downvote a query
     * @param {string} queryId - Query ID
     * @returns {Promise<Object>}
     */
    async downvote(queryId) {
        return this.handleVote(queryId, -1);
    }

    /**
     * Handle vote action
     * @param {string} queryId - Query ID
     * @param {number} voteValue - 1 for upvote, -1 for downvote
     * @returns {Promise<Object>}
     */
    async handleVote(queryId, voteValue) {
        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to vote');
            }

            // Validate vote value
            if (![1, -1].includes(voteValue)) {
                throw new Error('Invalid vote value');
            }

            // Check rate limiting
            if (!this._checkRateLimit()) {
                throw new Error('Too many votes. Please wait a moment.');
            }

            const userId = user.uid;
            const voteRef = this.db.doc(`${this.votesPath}/${queryId}/${userId}`);
            const publicQueryRef = this.db.doc(`${this.publicQueriesPath}/${queryId}`);

            // Use transaction for consistency
            const result = await this.db.runTransaction(async (transaction) => {
                const voteDoc = await transaction.get(voteRef);
                const queryDoc = await transaction.get(publicQueryRef);

                if (!queryDoc.exists) {
                    throw new Error('Query not found or is not public');
                }

                let voteDelta = 0;
                let newUserVote = 0;
                let upvoteDelta = 0;
                let downvoteDelta = 0;

                if (voteDoc.exists) {
                    const oldVote = voteDoc.data().value;

                    if (oldVote === voteValue) {
                        // Remove vote (clicked same button)
                        transaction.delete(voteRef);
                        voteDelta = -voteValue;
                        newUserVote = 0;
                        if (voteValue === 1) {
                            upvoteDelta = -1;
                        } else {
                            downvoteDelta = -1;
                        }
                    } else {
                        // Change vote
                        transaction.update(voteRef, {
                            value: voteValue,
                            timestamp: Date.now()
                        });
                        voteDelta = voteValue - oldVote; // Will be +2 or -2
                        newUserVote = voteValue;
                        if (voteValue === 1) {
                            upvoteDelta = 1;
                            downvoteDelta = -1;
                        } else {
                            upvoteDelta = -1;
                            downvoteDelta = 1;
                        }
                    }
                } else {
                    // New vote
                    transaction.set(voteRef, {
                        value: voteValue,
                        userId: userId,
                        timestamp: Date.now()
                    });
                    voteDelta = voteValue;
                    newUserVote = voteValue;
                    if (voteValue === 1) {
                        upvoteDelta = 1;
                    } else {
                        downvoteDelta = 1;
                    }
                }

                // Calculate new totals
                const currentData = queryDoc.data();
                const newUpvotes = (currentData.upvoteCount || 0) + upvoteDelta;
                const newDownvotes = (currentData.downvoteCount || 0) + downvoteDelta;
                const newVotes = newUpvotes - newDownvotes;
                const contestedScore = this.calculateContestedScore(newUpvotes, newDownvotes);

                // Update public query
                transaction.update(publicQueryRef, {
                    votes: newVotes,
                    upvoteCount: newUpvotes,
                    downvoteCount: newDownvotes,
                    contestedScore: contestedScore,
                    totalEngagement: newUpvotes + newDownvotes,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Also update user's copy if they own it
                if (currentData.userId) {
                    const userQueryRef = this.db
                        .collection(this.userQueriesPath)
                        .doc(currentData.userId)
                        .collection('queries')
                        .doc(queryId);

                    transaction.update(userQueryRef, {
                        votes: newVotes,
                        upvoteCount: newUpvotes,
                        downvoteCount: newDownvotes,
                        contestedScore: contestedScore,
                        totalEngagement: newUpvotes + newDownvotes
                    });
                }

                return {
                    newVotes,
                    voteDelta,
                    userVote: newUserVote,
                    upvoteCount: newUpvotes,
                    downvoteCount: newDownvotes,
                    contestedScore
                };
            });

            // Track vote in rate limiter
            this._incrementVoteCount();

            // Dispatch event for UI updates
            this._dispatchVoteEvent(queryId, result);

            console.log('[CorpusQueryVoting] Vote recorded:', queryId, result);

            return {
                success: true,
                ...result
            };

        } catch (error) {
            console.error('[CorpusQueryVoting] Vote error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's current vote for a query
     * @param {string} queryId - Query ID
     * @returns {Promise<Object>}
     */
    async getUserVote(queryId) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return { success: true, vote: 0 };
            }

            const voteRef = this.db.doc(`${this.votesPath}/${queryId}/${user.uid}`);
            const voteDoc = await voteRef.get();

            if (voteDoc.exists) {
                return {
                    success: true,
                    vote: voteDoc.data().value
                };
            }

            return { success: true, vote: 0 };

        } catch (error) {
            console.error('[CorpusQueryVoting] Get user vote error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get vote counts for a query
     * @param {string} queryId - Query ID
     * @returns {Promise<Object>}
     */
    async getVoteCounts(queryId) {
        try {
            // Try to get from public query doc (cached values)
            const queryDoc = await this.db.doc(`${this.publicQueriesPath}/${queryId}`).get();

            if (queryDoc.exists) {
                const data = queryDoc.data();
                return {
                    success: true,
                    upvotes: data.upvoteCount || 0,
                    downvotes: data.downvoteCount || 0,
                    total: data.votes || 0,
                    contestedScore: data.contestedScore || 0
                };
            }

            // Fall back to counting votes directly
            const votesSnapshot = await this.db
                .collection(`${this.votesPath}/${queryId}`)
                .get();

            let upvotes = 0;
            let downvotes = 0;

            votesSnapshot.forEach(doc => {
                const vote = doc.data().value;
                if (vote === 1) upvotes++;
                else if (vote === -1) downvotes++;
            });

            return {
                success: true,
                upvotes,
                downvotes,
                total: upvotes - downvotes,
                contestedScore: this.calculateContestedScore(upvotes, downvotes)
            };

        } catch (error) {
            console.error('[CorpusQueryVoting] Get vote counts error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Subscribe to real-time vote updates
     * @param {string} queryId - Query ID
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribeToVotes(queryId, callback) {
        const queryRef = this.db.doc(`${this.publicQueriesPath}/${queryId}`);

        const unsubscribe = queryRef.onSnapshot((snapshot) => {
            if (snapshot.exists) {
                const data = snapshot.data();
                callback({
                    votes: data.votes || 0,
                    upvoteCount: data.upvoteCount || 0,
                    downvoteCount: data.downvoteCount || 0,
                    contestedScore: data.contestedScore || 0
                });
            }
        }, (error) => {
            console.error('[CorpusQueryVoting] Subscription error:', error);
        });

        this.activeListeners.set(queryId, unsubscribe);

        return () => {
            unsubscribe();
            this.activeListeners.delete(queryId);
        };
    }

    /**
     * Get user's voting history for queries
     * @param {number} limit - Max number of votes to return
     * @returns {Promise<Array>}
     */
    async getUserVotingHistory(limit = 50) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('Must be logged in');
            }

            // This requires a collection group query
            const votesSnapshot = await this.db
                .collectionGroup('votes')
                .where('userId', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const votes = [];
            votesSnapshot.forEach(doc => {
                const pathParts = doc.ref.path.split('/');
                // Path: votes/corpus_queries/{queryId}/{userId}
                if (pathParts[1] === 'corpus_queries') {
                    votes.push({
                        queryId: pathParts[2],
                        value: doc.data().value,
                        timestamp: doc.data().timestamp
                    });
                }
            });

            return votes;

        } catch (error) {
            console.error('[CorpusQueryVoting] Get voting history error:', error);
            return [];
        }
    }

    /**
     * Get most voted queries
     * @param {number} limit - Max queries to return
     * @returns {Promise<Array>}
     */
    async getMostVotedQueries(limit = 10) {
        try {
            const snapshot = await this.db
                .collection(this.publicQueriesPath)
                .where('votes', '>', 0)
                .orderBy('votes', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('[CorpusQueryVoting] Get most voted error:', error);
            return [];
        }
    }

    /**
     * Get most contested queries
     * @param {number} limit - Max queries to return
     * @param {number} minEngagement - Minimum total engagement
     * @returns {Promise<Array>}
     */
    async getMostContestedQueries(limit = 10, minEngagement = 5) {
        try {
            const snapshot = await this.db
                .collection(this.publicQueriesPath)
                .where('totalEngagement', '>=', minEngagement)
                .orderBy('contestedScore', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('[CorpusQueryVoting] Get most contested error:', error);
            return [];
        }
    }

    /**
     * Check if current user has voted on a query
     * @param {string} queryId - Query ID
     * @returns {Promise<boolean>}
     */
    async hasUserVoted(queryId) {
        const result = await this.getUserVote(queryId);
        return result.success && result.vote !== 0;
    }

    /**
     * Clean up all listeners
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Check rate limit
     * @returns {boolean}
     * @private
     */
    _checkRateLimit() {
        const now = Date.now();

        if (now > this.rateLimitResetTime) {
            this.votesInLastMinute = 0;
            this.rateLimitResetTime = now + 60000;
        }

        return this.votesInLastMinute < this.maxVotesPerMinute;
    }

    /**
     * Increment vote count for rate limiting
     * @private
     */
    _incrementVoteCount() {
        this.votesInLastMinute++;
    }

    /**
     * Dispatch custom vote event
     * @param {string} queryId - Query ID
     * @param {Object} result - Vote result
     * @private
     */
    _dispatchVoteEvent(queryId, result) {
        window.dispatchEvent(new CustomEvent('corpusQueryVoteUpdated', {
            detail: {
                queryId,
                ...result
            }
        }));
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorpusQueryVoting;
}

if (typeof window !== 'undefined') {
    window.CorpusQueryVoting = CorpusQueryVoting;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize:
 *    const voting = new CorpusQueryVoting(db, auth);
 *
 * 2. Upvote:
 *    const result = await voting.upvote('queryId123');
 *    if (result.success) {
 *      console.log('New vote count:', result.newVotes);
 *    }
 *
 * 3. Downvote:
 *    await voting.downvote('queryId123');
 *
 * 4. Get user's vote:
 *    const { vote } = await voting.getUserVote('queryId123');
 *    // vote will be 1, -1, or 0
 *
 * 5. Get vote counts:
 *    const counts = await voting.getVoteCounts('queryId123');
 *    console.log(`${counts.total} (${counts.upvotes} up, ${counts.downvotes} down)`);
 *
 * 6. Subscribe to updates:
 *    const unsubscribe = voting.subscribeToVotes('queryId123', (data) => {
 *      console.log('Vote update:', data.votes);
 *    });
 *
 * 7. Listen for vote events:
 *    window.addEventListener('corpusQueryVoteUpdated', (e) => {
 *      console.log('Query voted:', e.detail);
 *    });
 */
