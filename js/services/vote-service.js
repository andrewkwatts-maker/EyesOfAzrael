/**
 * Vote Service
 * Handles upvote/downvote functionality with transaction-based vote counting
 *
 * Features:
 * - Firestore transactions prevent race conditions
 * - One vote per user per item
 * - Can change vote (upvote → downvote)
 * - Can remove vote (click same button again)
 * - Real-time vote count updates
 * - Rate limiting to prevent spam
 * - Analytics tracking
 *
 * Vote Schema:
 * votes/
 * ├── assets/{assetId}/{userId}
 * │   ├── value: 1 | -1
 * │   ├── userId: string
 * │   └── timestamp: number
 * └── notes/{noteId}/{userId}
 *     ├── value: 1 | -1
 *     ├── userId: string
 *     └── timestamp: number
 *
 * Item Schema (cached totals):
 * assets/{assetId}
 * ├── votes: number (net votes: upvotes - downvotes)
 * ├── upvoteCount: number (total upvotes)
 * ├── downvoteCount: number (total downvotes)
 * ├── contestedScore: number ((upvotes + downvotes) * 1000 - Math.abs(netVotes))
 * └── totalEngagement: number (upvotes + downvotes)
 *
 * notes/{noteId}
 * ├── votes: number (net votes)
 * ├── upvoteCount: number
 * ├── downvoteCount: number
 * ├── contestedScore: number
 * └── totalEngagement: number
 *
 * Contested Score Formula:
 * contestedScore = (upvotes + downvotes) * 1000 - Math.abs(netVotes)
 *
 * Examples:
 * - Item A: 100 up, 98 down = (198 * 1000) - 2 = 197,998 (very contested!)
 * - Item B: 50 up, 2 down = (52 * 1000) - 48 = 51,952 (not contested)
 * - Item C: 200 up, 5 down = (205 * 1000) - 195 = 204,805 (popular, not contested)
 */

class VoteService {
    /**
     * @param {firebase.firestore.Firestore} db - Firestore instance
     * @param {firebase.auth.Auth} auth - Firebase Auth instance
     */
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;

        // Rate limiting: max 100 votes per minute
        this.votesInLastMinute = 0;
        this.maxVotesPerMinute = 100;
        this.rateLimitResetTime = Date.now() + 60000;

        // Track active listeners for cleanup
        this.activeListeners = new Map();

        // Debounce real-time updates (max 1 update per 2 seconds per item)
        this.updateDebounceTimers = new Map();
        this.debounceDelay = 2000;
    }

    /**
     * Calculate contested score
     * Formula: (upvotes + downvotes) * 1000 - Math.abs(netVotes)
     *
     * High contested scores indicate items with many votes but close to 0 net score
     * (i.e., lots of engagement but community can't agree on quality)
     *
     * @param {number} upvoteCount - Total upvotes
     * @param {number} downvoteCount - Total downvotes
     * @returns {number} Contested score
     */
    calculateContestedScore(upvoteCount, downvoteCount) {
        const totalEngagement = upvoteCount + downvoteCount;
        const netVotes = upvoteCount - downvoteCount;
        return totalEngagement * 1000 - Math.abs(netVotes);
    }

    /**
     * Handle vote action (add, change, or remove vote)
     * @param {string} itemId - Item ID (asset or note)
     * @param {string} itemType - 'assets' or 'notes'
     * @param {number} voteValue - 1 for upvote, -1 for downvote
     * @returns {Promise<{success: boolean, newVotes?: number, voteDelta?: number, userVote?: number, error?: string}>}
     */
    async handleVote(itemId, itemType, voteValue) {
        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to vote');
            }

            // Validate parameters
            if (!['assets', 'notes'].includes(itemType)) {
                throw new Error('Invalid item type. Must be "assets" or "notes"');
            }

            if (![1, -1].includes(voteValue)) {
                throw new Error('Invalid vote value. Must be 1 (upvote) or -1 (downvote)');
            }

            // Check rate limiting
            if (!this._checkRateLimit()) {
                throw new Error('Too many votes. Please wait a moment before voting again.');
            }

            const userId = user.uid;
            const voteRef = this.db.doc(`votes/${itemType}/${itemId}/${userId}`);
            const itemRef = this.db.doc(`${itemType}/${itemId}`);

            // Use transaction to prevent race conditions
            const result = await this.db.runTransaction(async (transaction) => {
                const voteDoc = await transaction.get(voteRef);
                const itemDoc = await transaction.get(itemRef);

                if (!itemDoc.exists) {
                    throw new Error('Item not found');
                }

                let voteDelta = 0;
                let newUserVote = 0;

                if (voteDoc.exists) {
                    const oldVote = voteDoc.data().value;

                    if (oldVote === voteValue) {
                        // Remove vote (clicked same button again)
                        transaction.delete(voteRef);
                        voteDelta = -voteValue;
                        newUserVote = 0;

                        console.log(`[VoteService] Removed vote for ${itemType}/${itemId}`);
                    } else {
                        // Change vote (upvote → downvote or vice versa)
                        transaction.update(voteRef, {
                            value: voteValue,
                            timestamp: Date.now()
                        });
                        voteDelta = voteValue - oldVote; // Will be +2 or -2
                        newUserVote = voteValue;

                        console.log(`[VoteService] Changed vote for ${itemType}/${itemId} from ${oldVote} to ${voteValue}`);
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

                    console.log(`[VoteService] New vote for ${itemType}/${itemId}: ${voteValue}`);
                }

                // Get current vote counts (need to count individual votes for accuracy)
                const votesCollectionRef = this.db.collection(`votes/${itemType}/${itemId}`);
                const votesSnapshot = await transaction.get(votesCollectionRef);

                let upvoteCount = 0;
                let downvoteCount = 0;

                votesSnapshot.forEach(doc => {
                    const voteData = doc.data();
                    if (voteData.value === 1) upvoteCount++;
                    else if (voteData.value === -1) downvoteCount++;
                });

                // Calculate metrics
                const newVotes = upvoteCount - downvoteCount;
                const totalEngagement = upvoteCount + downvoteCount;
                const contestedScore = this.calculateContestedScore(upvoteCount, downvoteCount);

                // Update item with comprehensive vote data
                transaction.update(itemRef, {
                    votes: newVotes,
                    upvoteCount,
                    downvoteCount,
                    contestedScore,
                    totalEngagement,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return {
                    newVotes,
                    voteDelta,
                    userVote: newUserVote,
                    upvoteCount,
                    downvoteCount,
                    contestedScore,
                    totalEngagement
                };
            });

            // Track vote in rate limiter
            this._incrementVoteCount();

            // Track analytics
            this._trackVoteAnalytics(itemType, itemId, voteValue, result.voteDelta);

            // Dispatch custom event for UI updates
            this._dispatchVoteEvent(itemId, itemType, result);

            return {
                success: true,
                ...result
            };

        } catch (error) {
            console.error('[VoteService] Vote error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's current vote for an item
     * @param {string} itemId - Item ID
     * @param {string} itemType - 'assets' or 'notes'
     * @returns {Promise<{success: boolean, vote?: number, error?: string}>}
     */
    async getUserVote(itemId, itemType) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return { success: true, vote: 0 };
            }

            const userId = user.uid;
            const voteRef = this.db.doc(`votes/${itemType}/${itemId}/${userId}`);
            const voteDoc = await voteRef.get();

            if (voteDoc.exists) {
                return {
                    success: true,
                    vote: voteDoc.data().value
                };
            }

            return {
                success: true,
                vote: 0
            };

        } catch (error) {
            console.error('[VoteService] Get user vote error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get vote counts for an item
     * @param {string} itemId - Item ID
     * @param {string} itemType - 'assets' or 'notes'
     * @returns {Promise<{success: boolean, upvotes?: number, downvotes?: number, total?: number, error?: string}>}
     */
    async getVoteCounts(itemId, itemType) {
        try {
            const votesRef = this.db.collection(`votes/${itemType}/${itemId}`);
            const snapshot = await votesRef.get();

            let upvotes = 0;
            let downvotes = 0;

            snapshot.forEach(doc => {
                const vote = doc.data().value;
                if (vote === 1) upvotes++;
                else if (vote === -1) downvotes++;
            });

            const total = upvotes - downvotes;

            return {
                success: true,
                upvotes,
                downvotes,
                total
            };

        } catch (error) {
            console.error('[VoteService] Get vote counts error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get total votes from cached value on item
     * @param {string} itemId - Item ID
     * @param {string} itemType - 'assets' or 'notes'
     * @returns {Promise<{success: boolean, votes?: number, error?: string}>}
     */
    async getTotalVotes(itemId, itemType) {
        try {
            const itemRef = this.db.doc(`${itemType}/${itemId}`);
            const itemDoc = await itemRef.get();

            if (!itemDoc.exists) {
                throw new Error('Item not found');
            }

            return {
                success: true,
                votes: itemDoc.data().votes || 0
            };

        } catch (error) {
            console.error('[VoteService] Get total votes error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Listen for real-time vote updates on an item
     * @param {string} itemId - Item ID
     * @param {string} itemType - 'assets' or 'notes'
     * @param {Function} callback - Callback function (receives vote data)
     * @returns {Function} Unsubscribe function
     */
    subscribeToVotes(itemId, itemType, callback) {
        const itemRef = this.db.doc(`${itemType}/${itemId}`);
        const listenerKey = `${itemType}/${itemId}`;

        // Debounce updates to prevent excessive callbacks
        const debouncedCallback = (snapshot) => {
            // Clear existing debounce timer
            if (this.updateDebounceTimers.has(listenerKey)) {
                clearTimeout(this.updateDebounceTimers.get(listenerKey));
            }

            // Set new debounce timer
            const timer = setTimeout(() => {
                if (snapshot.exists) {
                    const data = snapshot.data();
                    callback({
                        votes: data.votes || 0,
                        timestamp: data.updatedAt
                    });
                }
                this.updateDebounceTimers.delete(listenerKey);
            }, this.debounceDelay);

            this.updateDebounceTimers.set(listenerKey, timer);
        };

        // Set up real-time listener
        const unsubscribe = itemRef.onSnapshot(debouncedCallback, (error) => {
            console.error('[VoteService] Real-time listener error:', error);
        });

        // Track listener for cleanup
        this.activeListeners.set(listenerKey, unsubscribe);

        // Return unsubscribe function
        return () => {
            unsubscribe();
            this.activeListeners.delete(listenerKey);
            if (this.updateDebounceTimers.has(listenerKey)) {
                clearTimeout(this.updateDebounceTimers.get(listenerKey));
                this.updateDebounceTimers.delete(listenerKey);
            }
        };
    }

    /**
     * Get most upvoted items in a collection
     * @param {string} itemType - 'assets' or 'notes'
     * @param {number} limit - Number of items to return
     * @returns {Promise<{success: boolean, items?: Array, error?: string}>}
     */
    async getMostUpvoted(itemType, limit = 10) {
        try {
            const itemsRef = this.db.collection(itemType)
                .where('votes', '>', 0)
                .orderBy('votes', 'desc')
                .limit(limit);

            const snapshot = await itemsRef.get();

            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                items
            };

        } catch (error) {
            console.error('[VoteService] Get most upvoted error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get most controversial items (high total engagement)
     * @param {string} itemType - 'assets' or 'notes'
     * @param {number} limit - Number of items to return
     * @returns {Promise<{success: boolean, items?: Array, error?: string}>}
     */
    async getMostControversial(itemType, limit = 10) {
        try {
            const itemsRef = this.db.collection(itemType);
            const snapshot = await itemsRef.get();

            const items = [];

            for (const doc of snapshot.docs) {
                const itemId = doc.id;
                const voteCounts = await this.getVoteCounts(itemId, itemType);

                if (voteCounts.success) {
                    const totalEngagement = voteCounts.upvotes + voteCounts.downvotes;
                    const controversyScore = Math.min(voteCounts.upvotes, voteCounts.downvotes);

                    items.push({
                        id: itemId,
                        ...doc.data(),
                        totalEngagement,
                        controversyScore
                    });
                }
            }

            // Sort by controversy score (items with balanced up/down votes)
            items.sort((a, b) => b.controversyScore - a.controversyScore);

            return {
                success: true,
                items: items.slice(0, limit)
            };

        } catch (error) {
            console.error('[VoteService] Get most controversial error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get most contested items (high engagement but close net votes)
     * Uses contestedScore: (upvotes + downvotes) * 1000 - Math.abs(netVotes)
     *
     * @param {string} itemType - 'assets' or 'notes'
     * @param {number} limit - Number of items to return
     * @param {number} minEngagement - Minimum total engagement (default: 10)
     * @returns {Promise<{success: boolean, items?: Array, error?: string}>}
     */
    async getMostContested(itemType, limit = 10, minEngagement = 10) {
        try {
            const itemsRef = this.db.collection(itemType)
                .where('totalEngagement', '>=', minEngagement)
                .orderBy('contestedScore', 'desc')
                .limit(limit);

            const snapshot = await itemsRef.get();

            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                items
            };

        } catch (error) {
            console.error('[VoteService] Get most contested error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's voting history
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<{success: boolean, votes?: Array, error?: string}>}
     */
    async getUserVotingHistory(userId = null) {
        try {
            const targetUserId = userId || this.auth.currentUser?.uid;

            if (!targetUserId) {
                throw new Error('User not authenticated');
            }

            const votes = [];

            // Get votes from assets
            const assetVotesRef = this.db.collectionGroup('votes')
                .where('userId', '==', targetUserId);

            const assetSnapshot = await assetVotesRef.get();

            assetSnapshot.forEach(doc => {
                const pathParts = doc.ref.path.split('/');
                votes.push({
                    itemType: pathParts[1], // 'assets' or 'notes'
                    itemId: pathParts[2],
                    value: doc.data().value,
                    timestamp: doc.data().timestamp
                });
            });

            // Sort by timestamp (most recent first)
            votes.sort((a, b) => b.timestamp - a.timestamp);

            return {
                success: true,
                votes
            };

        } catch (error) {
            console.error('[VoteService] Get user voting history error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clean up all active listeners
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();

        this.updateDebounceTimers.forEach(timer => clearTimeout(timer));
        this.updateDebounceTimers.clear();
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Check rate limiting
     * @returns {boolean} True if within rate limit
     * @private
     */
    _checkRateLimit() {
        const now = Date.now();

        // Reset counter if minute has passed
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
     * Track vote analytics
     * @param {string} itemType - Item type
     * @param {string} itemId - Item ID
     * @param {number} voteValue - Vote value (1 or -1)
     * @param {number} voteDelta - Change in vote (-2, -1, 0, 1, 2)
     * @private
     */
    _trackVoteAnalytics(itemType, itemId, voteValue, voteDelta) {
        if (!window.AnalyticsManager) return;

        // Determine action based on vote delta
        let action = 'vote_added';
        if (voteDelta === 0) {
            return; // No change
        } else if (voteDelta === -voteValue) {
            action = 'vote_removed';
        } else if (Math.abs(voteDelta) === 2) {
            action = 'vote_changed';
        }

        window.AnalyticsManager.trackEvent(action, {
            itemType,
            itemId,
            voteValue,
            voteDelta
        });
    }

    /**
     * Dispatch custom vote event for UI updates
     * @param {string} itemId - Item ID
     * @param {string} itemType - Item type
     * @param {Object} result - Vote result data
     * @private
     */
    _dispatchVoteEvent(itemId, itemType, result) {
        window.dispatchEvent(new CustomEvent('voteUpdated', {
            detail: {
                itemId,
                itemType,
                ...result
            }
        }));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoteService;
}

// Make available globally if Firebase is loaded
if (typeof window !== 'undefined') {
    window.VoteService = VoteService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize service:
 *    const voteService = new VoteService(db, auth);
 *
 * 2. Handle upvote:
 *    const result = await voteService.handleVote('assetId123', 'assets', 1);
 *    if (result.success) {
 *      console.log('New vote count:', result.newVotes);
 *    }
 *
 * 3. Handle downvote:
 *    await voteService.handleVote('noteId456', 'notes', -1);
 *
 * 4. Get user's current vote:
 *    const { vote } = await voteService.getUserVote('assetId123', 'assets');
 *    // vote will be 1, -1, or 0
 *
 * 5. Get vote counts:
 *    const counts = await voteService.getVoteCounts('assetId123', 'assets');
 *    console.log(`Total: ${counts.total} (${counts.upvotes} up, ${counts.downvotes} down)`);
 *
 * 6. Subscribe to real-time updates:
 *    const unsubscribe = voteService.subscribeToVotes('assetId123', 'assets', (data) => {
 *      console.log('New vote count:', data.votes);
 *    });
 *    // Later: unsubscribe();
 *
 * 7. Get most upvoted items:
 *    const { items } = await voteService.getMostUpvoted('assets', 10);
 *
 * 8. Listen for vote events:
 *    window.addEventListener('voteUpdated', (event) => {
 *      const { itemId, newVotes, userVote } = event.detail;
 *      console.log('Vote updated:', itemId, newVotes);
 *    });
 */
