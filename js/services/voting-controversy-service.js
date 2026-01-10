/**
 * Voting & Controversy Service
 *
 * Enhanced voting system with controversy tracking, user reputation weighting,
 * anti-brigading protection, and real-time updates.
 *
 * Features:
 * - Upvote/downvote with reputation-weighted influence
 * - Controversy score calculation (0-1 scale)
 * - Trending assets by time window
 * - Anti-brigading detection for new accounts
 * - Real-time Firestore listeners with optimistic UI
 * - Controversy badges and indicators
 * - Vote history tracking
 *
 * Firestore Structure:
 * votes/{entityId}/userVotes/{userId}
 * {
 *   value: 1 | -1,
 *   weightedValue: number (factored by reputation),
 *   userId: string,
 *   userReputation: number,
 *   timestamp: number,
 *   createdAt: serverTimestamp
 * }
 *
 * voteAggregates/{entityId}
 * {
 *   entityId: string,
 *   entityType: string (collection name),
 *   upvotes: number,
 *   downvotes: number,
 *   weightedUpvotes: number,
 *   weightedDownvotes: number,
 *   score: number (net votes),
 *   weightedScore: number,
 *   totalEngagement: number,
 *   controversyScore: number (0-1),
 *   isControversial: boolean,
 *   trendingScore: number,
 *   lastVoteAt: timestamp,
 *   updatedAt: serverTimestamp,
 *   voteHistory: [{ timestamp, delta, weightedDelta }] (last 100)
 * }
 *
 * Index requirements:
 * - voteAggregates: controversyScore DESC, entityType
 * - voteAggregates: trendingScore DESC, entityType
 * - voteAggregates: lastVoteAt DESC
 */

class VotingControversyService {
    /**
     * @param {firebase.firestore.Firestore} db - Firestore instance
     * @param {firebase.auth.Auth} auth - Firebase Auth instance
     * @param {ReputationService} reputationService - Optional reputation service
     */
    constructor(db, auth, reputationService = null) {
        this.db = db;
        this.auth = auth;
        this.reputationService = reputationService || window.reputationService;

        // Collection paths
        this.votesCollection = 'votes';
        this.aggregatesCollection = 'voteAggregates';

        // Configuration
        this.controversyThreshold = 0.7; // Score >= 0.7 is controversial
        this.minimumVotesForControversy = 5; // Need at least this many votes
        this.trendingDecayHours = 24; // Time window for trending
        this.maxVoteHistoryEntries = 100;

        // Reputation weight configuration
        this.reputationWeights = {
            minWeight: 0.5,      // New users' votes worth at least 50%
            maxWeight: 1.5,      // High-rep users' votes worth up to 150%
            basePoints: 100,     // Points for 1.0 weight
            maxPoints: 1000      // Points for max weight
        };

        // Anti-brigading configuration
        this.brigadingConfig = {
            newAccountAgeHours: 24,     // Account created within 24 hours
            rapidVoteWindow: 300000,    // 5 minutes
            rapidVoteThreshold: 10,     // More than 10 votes in 5 min = suspicious
            flaggedVoteWeight: 0.1      // Suspicious votes worth only 10%
        };

        // Rate limiting
        this.votesInLastMinute = 0;
        this.maxVotesPerMinute = 60;
        this.rateLimitResetTime = Date.now() + 60000;

        // Active listeners for cleanup
        this.activeListeners = new Map();

        // Debounce timers for real-time updates
        this.debounceTimers = new Map();
        this.debounceDelay = 1000; // 1 second

        // Local cache for optimistic updates
        this.optimisticCache = new Map();
        this.cacheTTL = 30000; // 30 seconds

        // Track user's recent votes for brigading detection
        this.recentVotes = [];
    }

    // ==================== CORE VOTING ====================

    /**
     * Cast a vote on an entity
     * @param {string} entityId - Entity ID
     * @param {string} userId - User ID (defaults to current user)
     * @param {number} voteType - 1 for upvote, -1 for downvote
     * @param {string} entityType - Collection name (assets, notes, etc.)
     * @returns {Promise<Object>} Vote result
     */
    async vote(entityId, userId = null, voteType, entityType = 'assets') {
        try {
            const currentUser = this.auth.currentUser;
            const voterId = userId || currentUser?.uid;

            if (!voterId) {
                throw new Error('You must be logged in to vote');
            }

            if (![1, -1].includes(voteType)) {
                throw new Error('Invalid vote type. Must be 1 (upvote) or -1 (downvote)');
            }

            // Check rate limiting
            if (!this._checkRateLimit()) {
                throw new Error('Too many votes. Please wait a moment before voting again.');
            }

            // Get user's reputation for vote weighting
            const userReputation = await this._getUserReputation(voterId);
            const voteWeight = this._calculateVoteWeight(userReputation);

            // Check for brigading
            const brigadingCheck = await this._checkBrigading(voterId, userReputation);
            const effectiveWeight = brigadingCheck.isFlagged
                ? this.brigadingConfig.flaggedVoteWeight
                : voteWeight;

            // Apply optimistic update immediately
            const optimisticResult = this._applyOptimisticUpdate(entityId, voteType, effectiveWeight);

            // Perform the actual vote transaction
            const result = await this._executeVoteTransaction(
                entityId,
                voterId,
                voteType,
                entityType,
                userReputation,
                effectiveWeight,
                brigadingCheck
            );

            // Track vote for rate limiting
            this._incrementVoteCount();

            // Track for brigading detection
            this._trackRecentVote(voterId, entityId, voteType);

            // Dispatch event for UI updates
            this._dispatchVoteEvent(entityId, entityType, result);

            console.log(`[VotingControversy] Vote recorded: ${entityId}`, result);

            return {
                success: true,
                ...result,
                brigadingWarning: brigadingCheck.isFlagged ? 'Vote recorded with reduced weight' : null
            };

        } catch (error) {
            console.error('[VotingControversy] Vote error:', error);

            // Revert optimistic update
            this.optimisticCache.delete(entityId);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute vote transaction
     * @private
     */
    async _executeVoteTransaction(entityId, userId, voteType, entityType, userReputation, effectiveWeight, brigadingCheck) {
        const voteRef = this.db.doc(`${this.votesCollection}/${entityId}/userVotes/${userId}`);
        const aggregateRef = this.db.doc(`${this.aggregatesCollection}/${entityId}`);
        const entityRef = this.db.doc(`${entityType}/${entityId}`);

        return await this.db.runTransaction(async (transaction) => {
            const [voteDoc, aggregateDoc, entityDoc] = await Promise.all([
                transaction.get(voteRef),
                transaction.get(aggregateRef),
                transaction.get(entityRef)
            ]);

            if (!entityDoc.exists) {
                throw new Error('Entity not found');
            }

            // Initialize or get current aggregate data
            let aggregate = aggregateDoc.exists ? aggregateDoc.data() : this._getDefaultAggregate(entityId, entityType);

            let voteDelta = 0;
            let weightedDelta = 0;
            let upvoteDelta = 0;
            let downvoteDelta = 0;
            let weightedUpvoteDelta = 0;
            let weightedDownvoteDelta = 0;
            let newUserVote = 0;

            const weightedValue = voteType * effectiveWeight;

            if (voteDoc.exists) {
                const oldVote = voteDoc.data();
                const oldValue = oldVote.value;
                const oldWeightedValue = oldVote.weightedValue || oldValue;

                if (oldValue === voteType) {
                    // Remove vote (clicked same button again)
                    transaction.delete(voteRef);
                    voteDelta = -oldValue;
                    weightedDelta = -oldWeightedValue;
                    newUserVote = 0;

                    if (oldValue === 1) {
                        upvoteDelta = -1;
                        weightedUpvoteDelta = -oldWeightedValue;
                    } else {
                        downvoteDelta = -1;
                        weightedDownvoteDelta = -Math.abs(oldWeightedValue);
                    }
                } else {
                    // Change vote
                    transaction.update(voteRef, {
                        value: voteType,
                        weightedValue: weightedValue,
                        userReputation: userReputation,
                        timestamp: Date.now(),
                        isFlagged: brigadingCheck.isFlagged,
                        flagReason: brigadingCheck.reason || null
                    });

                    voteDelta = voteType - oldValue; // +2 or -2
                    weightedDelta = weightedValue - oldWeightedValue;
                    newUserVote = voteType;

                    if (voteType === 1) {
                        upvoteDelta = 1;
                        downvoteDelta = -1;
                        weightedUpvoteDelta = Math.abs(weightedValue);
                        weightedDownvoteDelta = -Math.abs(oldWeightedValue);
                    } else {
                        upvoteDelta = -1;
                        downvoteDelta = 1;
                        weightedUpvoteDelta = -Math.abs(oldWeightedValue);
                        weightedDownvoteDelta = Math.abs(weightedValue);
                    }
                }
            } else {
                // New vote
                transaction.set(voteRef, {
                    value: voteType,
                    weightedValue: weightedValue,
                    userId: userId,
                    userReputation: userReputation,
                    timestamp: Date.now(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isFlagged: brigadingCheck.isFlagged,
                    flagReason: brigadingCheck.reason || null
                });

                voteDelta = voteType;
                weightedDelta = weightedValue;
                newUserVote = voteType;

                if (voteType === 1) {
                    upvoteDelta = 1;
                    weightedUpvoteDelta = Math.abs(weightedValue);
                } else {
                    downvoteDelta = 1;
                    weightedDownvoteDelta = Math.abs(weightedValue);
                }
            }

            // Update aggregate
            const newUpvotes = Math.max(0, (aggregate.upvotes || 0) + upvoteDelta);
            const newDownvotes = Math.max(0, (aggregate.downvotes || 0) + downvoteDelta);
            const newWeightedUpvotes = Math.max(0, (aggregate.weightedUpvotes || 0) + weightedUpvoteDelta);
            const newWeightedDownvotes = Math.max(0, (aggregate.weightedDownvotes || 0) + weightedDownvoteDelta);
            const newScore = newUpvotes - newDownvotes;
            const newWeightedScore = newWeightedUpvotes - newWeightedDownvotes;
            const totalEngagement = newUpvotes + newDownvotes;

            // Calculate controversy score
            const controversyScore = this.calculateControversy(newUpvotes, newDownvotes);
            const isControversial = this.isControversialScore(controversyScore, totalEngagement);

            // Calculate trending score
            const trendingScore = this._calculateTrendingScore(aggregate, totalEngagement);

            // Update vote history (keep last 100)
            const voteHistory = aggregate.voteHistory || [];
            voteHistory.unshift({
                timestamp: Date.now(),
                delta: voteDelta,
                weightedDelta: weightedDelta,
                userId: userId.substring(0, 8) + '...' // Anonymized
            });
            if (voteHistory.length > this.maxVoteHistoryEntries) {
                voteHistory.pop();
            }

            const newAggregate = {
                entityId,
                entityType,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                weightedUpvotes: newWeightedUpvotes,
                weightedDownvotes: newWeightedDownvotes,
                score: newScore,
                weightedScore: newWeightedScore,
                totalEngagement,
                controversyScore,
                isControversial,
                trendingScore,
                lastVoteAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                voteHistory
            };

            // Set or update aggregate document
            if (aggregateDoc.exists) {
                transaction.update(aggregateRef, newAggregate);
            } else {
                transaction.set(aggregateRef, {
                    ...newAggregate,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Also update the entity itself with cached vote data
            transaction.update(entityRef, {
                votes: newScore,
                upvoteCount: newUpvotes,
                downvoteCount: newDownvotes,
                controversyScore,
                isControversial,
                totalEngagement,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                userVote: newUserVote,
                voteDelta,
                weightedDelta,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                score: newScore,
                weightedScore: newWeightedScore,
                controversyScore,
                isControversial,
                totalEngagement,
                trendingScore,
                voteWeight: effectiveWeight
            };
        });
    }

    /**
     * Get vote counts for an entity
     * @param {string} entityId - Entity ID
     * @returns {Promise<Object>} Vote counts including controversy score
     */
    async getVoteCounts(entityId) {
        try {
            // Check optimistic cache first
            const cached = this._getFromOptimisticCache(entityId);
            if (cached) {
                return { success: true, ...cached };
            }

            const aggregateRef = this.db.doc(`${this.aggregatesCollection}/${entityId}`);
            const aggregateDoc = await aggregateRef.get();

            if (!aggregateDoc.exists) {
                return {
                    success: true,
                    upvotes: 0,
                    downvotes: 0,
                    score: 0,
                    weightedScore: 0,
                    controversyScore: 0,
                    isControversial: false,
                    totalEngagement: 0
                };
            }

            const data = aggregateDoc.data();
            return {
                success: true,
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0,
                score: data.score || 0,
                weightedScore: data.weightedScore || 0,
                controversyScore: data.controversyScore || 0,
                isControversial: data.isControversial || false,
                totalEngagement: data.totalEngagement || 0,
                trendingScore: data.trendingScore || 0
            };

        } catch (error) {
            console.error('[VotingControversy] Get vote counts error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current user's vote on an entity
     * @param {string} entityId - Entity ID
     * @param {string} userId - Optional user ID (defaults to current user)
     * @returns {Promise<Object>} User's vote (1, -1, or 0)
     */
    async getUserVote(entityId, userId = null) {
        try {
            const voterId = userId || this.auth.currentUser?.uid;

            if (!voterId) {
                return { success: true, vote: 0 };
            }

            const voteRef = this.db.doc(`${this.votesCollection}/${entityId}/userVotes/${voterId}`);
            const voteDoc = await voteRef.get();

            if (voteDoc.exists) {
                const data = voteDoc.data();
                return {
                    success: true,
                    vote: data.value,
                    weightedValue: data.weightedValue,
                    timestamp: data.timestamp,
                    isFlagged: data.isFlagged || false
                };
            }

            return { success: true, vote: 0 };

        } catch (error) {
            console.error('[VotingControversy] Get user vote error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get full vote history for an entity
     * @param {string} entityId - Entity ID
     * @returns {Promise<Object>} Vote history with timestamps
     */
    async getVoteHistory(entityId) {
        try {
            // Get from aggregate
            const aggregateRef = this.db.doc(`${this.aggregatesCollection}/${entityId}`);
            const aggregateDoc = await aggregateRef.get();

            if (!aggregateDoc.exists) {
                return {
                    success: true,
                    history: [],
                    summary: { upvotes: 0, downvotes: 0, score: 0 }
                };
            }

            const data = aggregateDoc.data();

            // Also get individual votes for detailed history
            const votesSnapshot = await this.db
                .collection(`${this.votesCollection}/${entityId}/userVotes`)
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();

            const detailedHistory = [];
            votesSnapshot.forEach(doc => {
                const vote = doc.data();
                detailedHistory.push({
                    timestamp: vote.timestamp,
                    value: vote.value,
                    weightedValue: vote.weightedValue,
                    userReputation: vote.userReputation,
                    isFlagged: vote.isFlagged
                });
            });

            return {
                success: true,
                history: data.voteHistory || [],
                detailedHistory,
                summary: {
                    upvotes: data.upvotes || 0,
                    downvotes: data.downvotes || 0,
                    score: data.score || 0,
                    weightedScore: data.weightedScore || 0,
                    controversyScore: data.controversyScore || 0
                }
            };

        } catch (error) {
            console.error('[VotingControversy] Get vote history error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get trending assets within a time window
     * @param {string} timeWindow - 'hour', 'day', 'week', 'month'
     * @param {string} entityType - Optional entity type filter
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Trending assets
     */
    async getTrendingAssets(timeWindow = 'day', entityType = null, limit = 20) {
        try {
            const windowMs = this._getTimeWindowMs(timeWindow);
            const cutoffTime = new Date(Date.now() - windowMs);

            let query = this.db.collection(this.aggregatesCollection)
                .where('lastVoteAt', '>=', cutoffTime)
                .orderBy('lastVoteAt', 'desc')
                .orderBy('trendingScore', 'desc');

            if (entityType) {
                query = query.where('entityType', '==', entityType);
            }

            query = query.limit(limit);

            const snapshot = await query.get();

            const trending = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                trending.push({
                    entityId: doc.id,
                    ...data,
                    trendingRank: trending.length + 1
                });
            });

            // Sort by trending score
            trending.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));

            return trending;

        } catch (error) {
            console.error('[VotingControversy] Get trending assets error:', error);
            return [];
        }
    }

    // ==================== CONTROVERSY SYSTEM ====================

    /**
     * Calculate controversy score (0-1)
     * Higher scores indicate more divisive content
     *
     * Formula based on Reddit's controversy algorithm:
     * controversy = (upvotes + downvotes)^balance where balance = min(up,down)/max(up,down)
     * Normalized to 0-1 scale
     *
     * @param {number} upvotes - Total upvotes
     * @param {number} downvotes - Total downvotes
     * @returns {number} Controversy score 0-1
     */
    calculateControversy(upvotes, downvotes) {
        const total = upvotes + downvotes;

        if (total === 0) return 0;
        if (upvotes === 0 || downvotes === 0) return 0;

        // Balance ratio: how evenly split the votes are
        const min = Math.min(upvotes, downvotes);
        const max = Math.max(upvotes, downvotes);
        const balance = min / max;

        // Engagement factor: more votes = more significant controversy
        // Log scale to prevent huge vote counts from dominating
        const engagementFactor = Math.min(1, Math.log10(total + 1) / 3);

        // Controversy = balance * engagement factor
        // Perfect 50/50 split with high engagement = 1.0
        const controversy = balance * engagementFactor;

        // Normalize to ensure we get 0-1 range
        return Math.min(1, Math.max(0, controversy));
    }

    /**
     * Check if controversy score meets threshold
     * @param {number} controversyScore - Controversy score
     * @param {number} totalEngagement - Total votes
     * @returns {boolean}
     */
    isControversialScore(controversyScore, totalEngagement) {
        return controversyScore >= this.controversyThreshold &&
               totalEngagement >= this.minimumVotesForControversy;
    }

    /**
     * Check if an entity is controversial
     * @param {string} entityId - Entity ID
     * @returns {Promise<boolean>}
     */
    async isControversial(entityId) {
        const counts = await this.getVoteCounts(entityId);
        if (!counts.success) return false;

        return counts.isControversial;
    }

    /**
     * Get list of controversial content
     * @param {number} limit - Max results
     * @param {string} entityType - Optional entity type filter
     * @returns {Promise<Array>} Controversial items
     */
    async getControversialContent(limit = 20, entityType = null) {
        try {
            let query = this.db.collection(this.aggregatesCollection)
                .where('isControversial', '==', true)
                .orderBy('controversyScore', 'desc');

            if (entityType) {
                query = query.where('entityType', '==', entityType);
            }

            query = query.limit(limit);

            const snapshot = await query.get();

            const controversial = [];
            snapshot.forEach(doc => {
                controversial.push({
                    entityId: doc.id,
                    ...doc.data()
                });
            });

            return controversial;

        } catch (error) {
            console.error('[VotingControversy] Get controversial content error:', error);
            return [];
        }
    }

    /**
     * Get most controversial items in a specific collection
     * @param {string} collection - Collection name
     * @param {number} limit - Max results
     * @param {number} minEngagement - Minimum total engagement
     * @returns {Promise<Array>}
     */
    async getMostControversial(collection, limit = 10, minEngagement = 5) {
        try {
            const snapshot = await this.db.collection(this.aggregatesCollection)
                .where('entityType', '==', collection)
                .where('totalEngagement', '>=', minEngagement)
                .orderBy('totalEngagement') // Required for compound query
                .orderBy('controversyScore', 'desc')
                .limit(limit)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                results.push({
                    entityId: doc.id,
                    ...doc.data()
                });
            });

            // Re-sort by controversy score (Firestore limitation)
            results.sort((a, b) => (b.controversyScore || 0) - (a.controversyScore || 0));

            return results;

        } catch (error) {
            console.error('[VotingControversy] Get most controversial error:', error);
            return [];
        }
    }

    /**
     * Get controversy trends over time
     * @param {string} entityId - Entity ID
     * @returns {Promise<Object>} Controversy trend data
     */
    async getControversyTrends(entityId) {
        try {
            const historyResult = await this.getVoteHistory(entityId);
            if (!historyResult.success) {
                return { success: false, error: historyResult.error };
            }

            // Analyze trends from history
            const history = historyResult.history || [];
            const trends = [];
            let runningUp = 0;
            let runningDown = 0;

            // Process history in reverse (oldest first)
            for (let i = history.length - 1; i >= 0; i--) {
                const entry = history[i];
                if (entry.delta > 0) runningUp += entry.delta;
                else runningDown += Math.abs(entry.delta);

                trends.push({
                    timestamp: entry.timestamp,
                    controversyScore: this.calculateControversy(runningUp, runningDown),
                    upvotes: runningUp,
                    downvotes: runningDown
                });
            }

            return {
                success: true,
                trends,
                currentControversy: historyResult.summary.controversyScore,
                isControversial: historyResult.summary.controversyScore >= this.controversyThreshold
            };

        } catch (error) {
            console.error('[VotingControversy] Get controversy trends error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== VOTE WEIGHTING ====================

    /**
     * Calculate vote weight based on user reputation
     * @param {number} reputationPoints - User's reputation points
     * @returns {number} Vote weight (0.5 - 1.5)
     */
    _calculateVoteWeight(reputationPoints) {
        const { minWeight, maxWeight, basePoints, maxPoints } = this.reputationWeights;

        if (reputationPoints <= 0) {
            return minWeight;
        }

        if (reputationPoints >= maxPoints) {
            return maxWeight;
        }

        // Linear interpolation between min and max weight
        const ratio = Math.min(1, reputationPoints / maxPoints);
        return minWeight + (maxWeight - minWeight) * ratio;
    }

    /**
     * Get user's reputation points
     * @param {string} userId - User ID
     * @returns {Promise<number>} Reputation points
     * @private
     */
    async _getUserReputation(userId) {
        try {
            if (this.reputationService && typeof this.reputationService.getReputation === 'function') {
                const reputation = await this.reputationService.getReputation(userId);
                return reputation?.totalPoints || 0;
            }

            // Fallback: check Firestore directly
            const repDoc = await this.db.doc(`user_reputation/${userId}`).get();
            if (repDoc.exists) {
                return repDoc.data().totalPoints || 0;
            }

            return 0;
        } catch (error) {
            console.warn('[VotingControversy] Error getting reputation:', error);
            return 0;
        }
    }

    // ==================== ANTI-BRIGADING ====================

    /**
     * Check for brigading behavior
     * @param {string} userId - User ID
     * @param {number} userReputation - User's reputation
     * @returns {Promise<Object>} Brigading check result
     * @private
     */
    async _checkBrigading(userId, userReputation) {
        const result = {
            isFlagged: false,
            reason: null
        };

        try {
            // Check 1: New account
            const userDoc = await this.db.doc(`users/${userId}`).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const accountAge = Date.now() - (userData.createdAt?.toMillis() || Date.now());
                const isNewAccount = accountAge < this.brigadingConfig.newAccountAgeHours * 60 * 60 * 1000;

                if (isNewAccount && userReputation < 10) {
                    result.isFlagged = true;
                    result.reason = 'new_account';
                    return result;
                }
            }

            // Check 2: Rapid voting pattern
            const recentVotesInWindow = this.recentVotes.filter(
                v => v.userId === userId &&
                Date.now() - v.timestamp < this.brigadingConfig.rapidVoteWindow
            );

            if (recentVotesInWindow.length >= this.brigadingConfig.rapidVoteThreshold) {
                result.isFlagged = true;
                result.reason = 'rapid_voting';
                return result;
            }

            // Check 3: Very low reputation with high activity (suspicious)
            if (userReputation === 0 && recentVotesInWindow.length >= 5) {
                result.isFlagged = true;
                result.reason = 'suspicious_activity';
                return result;
            }

        } catch (error) {
            console.warn('[VotingControversy] Error checking brigading:', error);
        }

        return result;
    }

    /**
     * Track recent vote for brigading detection
     * @param {string} userId - User ID
     * @param {string} entityId - Entity ID
     * @param {number} voteType - Vote type
     * @private
     */
    _trackRecentVote(userId, entityId, voteType) {
        this.recentVotes.push({
            userId,
            entityId,
            voteType,
            timestamp: Date.now()
        });

        // Clean up old entries (keep last 5 minutes)
        const cutoff = Date.now() - this.brigadingConfig.rapidVoteWindow;
        this.recentVotes = this.recentVotes.filter(v => v.timestamp > cutoff);
    }

    // ==================== REAL-TIME UPDATES ====================

    /**
     * Subscribe to real-time vote updates
     * @param {string} entityId - Entity ID
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribeToVotes(entityId, callback) {
        const aggregateRef = this.db.doc(`${this.aggregatesCollection}/${entityId}`);

        // Debounced callback to prevent excessive updates
        const debouncedCallback = (snapshot) => {
            if (this.debounceTimers.has(entityId)) {
                clearTimeout(this.debounceTimers.get(entityId));
            }

            const timer = setTimeout(() => {
                if (snapshot.exists) {
                    const data = snapshot.data();
                    callback({
                        entityId,
                        upvotes: data.upvotes || 0,
                        downvotes: data.downvotes || 0,
                        score: data.score || 0,
                        weightedScore: data.weightedScore || 0,
                        controversyScore: data.controversyScore || 0,
                        isControversial: data.isControversial || false,
                        totalEngagement: data.totalEngagement || 0,
                        trendingScore: data.trendingScore || 0,
                        lastVoteAt: data.lastVoteAt
                    });
                }
                this.debounceTimers.delete(entityId);
            }, this.debounceDelay);

            this.debounceTimers.set(entityId, timer);
        };

        const unsubscribe = aggregateRef.onSnapshot(debouncedCallback, (error) => {
            console.error('[VotingControversy] Subscription error:', error);
        });

        this.activeListeners.set(entityId, unsubscribe);

        return () => {
            unsubscribe();
            this.activeListeners.delete(entityId);
            if (this.debounceTimers.has(entityId)) {
                clearTimeout(this.debounceTimers.get(entityId));
                this.debounceTimers.delete(entityId);
            }
        };
    }

    /**
     * Subscribe to controversy updates (any controversial item)
     * @param {Function} callback - Callback function
     * @param {string} entityType - Optional entity type filter
     * @returns {Function} Unsubscribe function
     */
    subscribeToControversial(callback, entityType = null) {
        let query = this.db.collection(this.aggregatesCollection)
            .where('isControversial', '==', true)
            .orderBy('controversyScore', 'desc')
            .limit(20);

        if (entityType) {
            query = query.where('entityType', '==', entityType);
        }

        const unsubscribe = query.onSnapshot((snapshot) => {
            const items = [];
            snapshot.forEach(doc => {
                items.push({
                    entityId: doc.id,
                    ...doc.data()
                });
            });
            callback(items);
        }, (error) => {
            console.error('[VotingControversy] Controversial subscription error:', error);
        });

        const listenerKey = `controversial_${entityType || 'all'}`;
        this.activeListeners.set(listenerKey, unsubscribe);

        return () => {
            unsubscribe();
            this.activeListeners.delete(listenerKey);
        };
    }

    // ==================== CONTROVERSY BADGES ====================

    /**
     * Get controversy badge info for an entity
     * @param {string} entityId - Entity ID
     * @returns {Promise<Object|null>} Badge info or null
     */
    async getControversyBadge(entityId) {
        const counts = await this.getVoteCounts(entityId);
        if (!counts.success) return null;

        if (!counts.isControversial) return null;

        // Determine badge level based on engagement and controversy
        const { controversyScore, totalEngagement } = counts;

        let badgeLevel = 'debated';
        let badgeIcon = '~';
        let badgeColor = '#f59e0b'; // Amber

        if (controversyScore >= 0.9 && totalEngagement >= 50) {
            badgeLevel = 'firestorm';
            badgeIcon = '!';
            badgeColor = '#ef4444'; // Red
        } else if (controversyScore >= 0.8 && totalEngagement >= 20) {
            badgeLevel = 'hotDebate';
            badgeIcon = '!';
            badgeColor = '#f97316'; // Orange
        } else if (controversyScore >= 0.7 && totalEngagement >= 10) {
            badgeLevel = 'debated';
            badgeIcon = '~';
            badgeColor = '#f59e0b'; // Amber
        }

        return {
            entityId,
            badgeLevel,
            badgeIcon,
            badgeColor,
            controversyScore,
            totalEngagement,
            label: this._getBadgeLabel(badgeLevel),
            tooltip: this._getBadgeTooltip(badgeLevel, controversyScore, totalEngagement)
        };
    }

    /**
     * Get badge label
     * @param {string} level - Badge level
     * @returns {string}
     * @private
     */
    _getBadgeLabel(level) {
        const labels = {
            firestorm: 'Firestorm',
            hotDebate: 'Hot Debate',
            debated: 'Debated'
        };
        return labels[level] || 'Controversial';
    }

    /**
     * Get badge tooltip text
     * @param {string} level - Badge level
     * @param {number} score - Controversy score
     * @param {number} engagement - Total engagement
     * @returns {string}
     * @private
     */
    _getBadgeTooltip(level, score, engagement) {
        const scorePercent = Math.round(score * 100);
        return `${this._getBadgeLabel(level)}: ${scorePercent}% controversy score with ${engagement} votes`;
    }

    /**
     * Render controversy badge HTML
     * @param {Object} badge - Badge info from getControversyBadge
     * @returns {string} HTML string
     */
    renderBadgeHTML(badge) {
        if (!badge) return '';

        return `
            <span class="controversy-badge controversy-badge--${badge.badgeLevel}"
                  style="background-color: ${badge.badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"
                  title="${badge.tooltip}">
                <span class="controversy-badge__icon">${badge.badgeIcon}</span>
                <span class="controversy-badge__label">${badge.label}</span>
            </span>
        `;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get default aggregate structure
     * @param {string} entityId - Entity ID
     * @param {string} entityType - Entity type
     * @returns {Object}
     * @private
     */
    _getDefaultAggregate(entityId, entityType) {
        return {
            entityId,
            entityType,
            upvotes: 0,
            downvotes: 0,
            weightedUpvotes: 0,
            weightedDownvotes: 0,
            score: 0,
            weightedScore: 0,
            totalEngagement: 0,
            controversyScore: 0,
            isControversial: false,
            trendingScore: 0,
            voteHistory: []
        };
    }

    /**
     * Calculate trending score
     * @param {Object} aggregate - Current aggregate data
     * @param {number} totalEngagement - Total engagement
     * @returns {number}
     * @private
     */
    _calculateTrendingScore(aggregate, totalEngagement) {
        // Time decay factor
        const lastVoteTime = aggregate.lastVoteAt?.toMillis() || Date.now();
        const hoursSinceLastVote = (Date.now() - lastVoteTime) / (1000 * 60 * 60);
        const decayFactor = Math.exp(-hoursSinceLastVote / this.trendingDecayHours);

        // Engagement factor (log scale)
        const engagementFactor = Math.log10(totalEngagement + 1);

        // Velocity factor (recent votes from history)
        const recentHistory = (aggregate.voteHistory || []).slice(0, 10);
        const recentVotes = recentHistory.length;
        const velocityFactor = recentVotes / 10;

        // Combined trending score
        return (engagementFactor * decayFactor * (1 + velocityFactor)) * 100;
    }

    /**
     * Get time window in milliseconds
     * @param {string} window - Time window string
     * @returns {number}
     * @private
     */
    _getTimeWindowMs(window) {
        const windows = {
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };
        return windows[window] || windows.day;
    }

    /**
     * Apply optimistic update to cache
     * @param {string} entityId - Entity ID
     * @param {number} voteType - Vote type
     * @param {number} weight - Vote weight
     * @returns {Object}
     * @private
     */
    _applyOptimisticUpdate(entityId, voteType, weight) {
        const current = this.optimisticCache.get(entityId) || {
            upvotes: 0,
            downvotes: 0,
            score: 0
        };

        const updated = { ...current };
        if (voteType === 1) {
            updated.upvotes += 1;
            updated.score += 1;
        } else {
            updated.downvotes += 1;
            updated.score -= 1;
        }

        updated.controversyScore = this.calculateControversy(updated.upvotes, updated.downvotes);
        updated.timestamp = Date.now();

        this.optimisticCache.set(entityId, updated);
        return updated;
    }

    /**
     * Get from optimistic cache if fresh
     * @param {string} entityId - Entity ID
     * @returns {Object|null}
     * @private
     */
    _getFromOptimisticCache(entityId) {
        const cached = this.optimisticCache.get(entityId);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.optimisticCache.delete(entityId);
            return null;
        }

        return cached;
    }

    /**
     * Check rate limiting
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
     * Dispatch vote update event
     * @param {string} entityId - Entity ID
     * @param {string} entityType - Entity type
     * @param {Object} result - Vote result
     * @private
     */
    _dispatchVoteEvent(entityId, entityType, result) {
        window.dispatchEvent(new CustomEvent('controversyVoteUpdated', {
            detail: {
                entityId,
                entityType,
                ...result
            }
        }));
    }

    /**
     * Clean up all listeners and timers
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();

        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        this.optimisticCache.clear();
        this.recentVotes = [];

        console.log('[VotingControversy] Cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VotingControversyService;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VotingControversyService = VotingControversyService;

    // Create singleton instance when Firebase is ready
    window.initVotingControversyService = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth) {
            window.votingControversyService = new VotingControversyService(
                firebase.firestore(),
                firebase.auth(),
                window.reputationService
            );
            console.log('[VotingControversy] Service initialized');
            return window.votingControversyService;
        }
        return null;
    };
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize service:
 *    const votingService = new VotingControversyService(db, auth, reputationService);
 *    // Or use the global instance:
 *    window.initVotingControversyService();
 *
 * 2. Cast a vote:
 *    const result = await votingService.vote('entityId123', null, 1, 'assets');
 *    if (result.success) {
 *      console.log('Score:', result.score);
 *      console.log('Controversy:', result.controversyScore);
 *      console.log('Vote weight applied:', result.voteWeight);
 *    }
 *
 * 3. Get vote counts with controversy:
 *    const counts = await votingService.getVoteCounts('entityId123');
 *    console.log(`${counts.upvotes} up, ${counts.downvotes} down`);
 *    console.log(`Controversy: ${counts.controversyScore}`);
 *    console.log(`Is controversial: ${counts.isControversial}`);
 *
 * 4. Get user's vote:
 *    const { vote, weightedValue } = await votingService.getUserVote('entityId123');
 *    // vote: 1, -1, or 0
 *
 * 5. Get vote history:
 *    const history = await votingService.getVoteHistory('entityId123');
 *    console.log('Vote trends:', history.history);
 *
 * 6. Get trending assets:
 *    const trending = await votingService.getTrendingAssets('day', 'assets', 20);
 *    trending.forEach(item => console.log(item.entityId, item.trendingScore));
 *
 * 7. Check if controversial:
 *    if (await votingService.isControversial('entityId123')) {
 *      console.log('This content is controversial!');
 *    }
 *
 * 8. Get controversial content:
 *    const controversial = await votingService.getControversialContent(20, 'assets');
 *
 * 9. Get most controversial in collection:
 *    const mostControversial = await votingService.getMostControversial('notes', 10);
 *
 * 10. Subscribe to real-time updates:
 *     const unsubscribe = votingService.subscribeToVotes('entityId123', (data) => {
 *       console.log('Vote update:', data.score, 'Controversy:', data.controversyScore);
 *     });
 *     // Later: unsubscribe();
 *
 * 11. Get controversy badge:
 *     const badge = await votingService.getControversyBadge('entityId123');
 *     if (badge) {
 *       document.querySelector('.badge-container').innerHTML = votingService.renderBadgeHTML(badge);
 *     }
 *
 * 12. Listen for vote events:
 *     window.addEventListener('controversyVoteUpdated', (e) => {
 *       console.log('Vote updated:', e.detail);
 *     });
 *
 * 13. Calculate controversy manually:
 *     const score = votingService.calculateControversy(100, 95);
 *     console.log('Controversy score:', score); // ~0.9 (very controversial)
 *
 * 14. Get controversy trends:
 *     const trends = await votingService.getControversyTrends('entityId123');
 *     // Use trends.trends for charting over time
 */
