/**
 * Vote Analytics Service
 * Tracks voting events and aggregates voting statistics
 *
 * Metrics Tracked:
 * - Vote actions (added, changed, removed)
 * - Most upvoted items
 * - Most controversial items (high engagement, close net votes)
 * - User engagement rate (% of viewers who vote)
 * - Voting patterns over time
 * - Vote distribution by item type
 *
 * Integration:
 * - Works with VoteService
 * - Sends events to AnalyticsManager (if available)
 * - Stores aggregated stats in Firestore
 * - Provides reporting API
 */

class VoteAnalyticsService {
    /**
     * @param {firebase.firestore.Firestore} db - Firestore instance
     * @param {firebase.auth.Auth} auth - Firebase Auth instance
     */
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;

        // Analytics collection for storing aggregated stats
        this.analyticsCollection = 'vote_analytics';

        // In-memory cache for frequently accessed stats
        this.statsCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Track vote action
     * @param {string} action - 'vote_added', 'vote_changed', 'vote_removed'
     * @param {string} itemType - 'assets' or 'notes'
     * @param {string} itemId - Item ID
     * @param {number} voteValue - 1 or -1
     * @param {number} voteDelta - Change in vote count
     */
    async trackVoteAction(action, itemType, itemId, voteValue, voteDelta) {
        try {
            const event = {
                action,
                itemType,
                itemId,
                voteValue,
                voteDelta,
                userId: this.auth.currentUser?.uid || 'anonymous',
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
            };

            // Send to AnalyticsManager if available
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackEvent(action, {
                    itemType,
                    itemId,
                    voteValue,
                    voteDelta
                });
            }

            // Store event in Firestore for historical analysis
            await this.db.collection('vote_events').add(event);

            // Update aggregated daily stats
            await this.updateDailyStats(event);

            console.log('[VoteAnalytics] Tracked vote action:', action);

        } catch (error) {
            console.error('[VoteAnalytics] Error tracking vote action:', error);
        }
    }

    /**
     * Update daily aggregated statistics
     * @param {Object} event - Vote event
     */
    async updateDailyStats(event) {
        try {
            const statsDocId = `${event.date}_${event.itemType}`;
            const statsRef = this.db.collection(this.analyticsCollection).doc(statsDocId);

            await this.db.runTransaction(async (transaction) => {
                const statsDoc = await transaction.get(statsRef);

                if (statsDoc.exists) {
                    // Update existing stats
                    const stats = statsDoc.data();

                    transaction.update(statsRef, {
                        totalVotes: firebase.firestore.FieldValue.increment(1),
                        totalUpvotes: event.voteValue === 1 ? firebase.firestore.FieldValue.increment(1) : stats.totalUpvotes,
                        totalDownvotes: event.voteValue === -1 ? firebase.firestore.FieldValue.increment(1) : stats.totalDownvotes,
                        uniqueVoters: firebase.firestore.FieldValue.arrayUnion(event.userId),
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Create new stats document
                    transaction.set(statsRef, {
                        date: event.date,
                        itemType: event.itemType,
                        totalVotes: 1,
                        totalUpvotes: event.voteValue === 1 ? 1 : 0,
                        totalDownvotes: event.voteValue === -1 ? 1 : 0,
                        uniqueVoters: [event.userId],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });

        } catch (error) {
            console.error('[VoteAnalytics] Error updating daily stats:', error);
        }
    }

    /**
     * Get most upvoted items across all time
     * @param {string} itemType - 'assets' or 'notes'
     * @param {number} limit - Number of results
     * @returns {Promise<Array>}
     */
    async getMostUpvoted(itemType, limit = 10) {
        try {
            const cacheKey = `most_upvoted_${itemType}_${limit}`;

            // Check cache
            if (this.statsCache.has(cacheKey)) {
                const cached = this.statsCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTTL) {
                    return cached.data;
                }
            }

            // Query Firestore
            const snapshot = await this.db.collection(itemType)
                .where('votes', '>', 0)
                .orderBy('votes', 'desc')
                .limit(limit)
                .get();

            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Cache result
            this.statsCache.set(cacheKey, {
                data: items,
                timestamp: Date.now()
            });

            return items;

        } catch (error) {
            console.error('[VoteAnalytics] Error getting most upvoted:', error);
            return [];
        }
    }

    /**
     * Get most controversial items (high engagement, close to 0 net votes)
     * @param {string} itemType - 'assets' or 'notes'
     * @param {number} limit - Number of results
     * @param {number} minEngagement - Minimum total votes
     * @returns {Promise<Array>}
     */
    async getMostControversial(itemType, limit = 10, minEngagement = 10) {
        try {
            const cacheKey = `most_controversial_${itemType}_${limit}_${minEngagement}`;

            // Check cache
            if (this.statsCache.has(cacheKey)) {
                const cached = this.statsCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTTL) {
                    return cached.data;
                }
            }

            // Query Firestore using contestedScore
            const snapshot = await this.db.collection(itemType)
                .where('totalEngagement', '>=', minEngagement)
                .orderBy('contestedScore', 'desc')
                .limit(limit)
                .get();

            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Cache result
            this.statsCache.set(cacheKey, {
                data: items,
                timestamp: Date.now()
            });

            return items;

        } catch (error) {
            console.error('[VoteAnalytics] Error getting most controversial:', error);
            return [];
        }
    }

    /**
     * Get voting statistics for a specific item
     * @param {string} itemType - 'assets' or 'notes'
     * @param {string} itemId - Item ID
     * @returns {Promise<Object>}
     */
    async getItemStats(itemType, itemId) {
        try {
            const itemRef = this.db.doc(`${itemType}/${itemId}`);
            const itemDoc = await itemRef.get();

            if (!itemDoc.exists) {
                return null;
            }

            const data = itemDoc.data();

            return {
                itemId,
                itemType,
                votes: data.votes || 0,
                upvoteCount: data.upvoteCount || 0,
                downvoteCount: data.downvoteCount || 0,
                totalEngagement: data.totalEngagement || 0,
                contestedScore: data.contestedScore || 0,
                engagementRate: this.calculateEngagementRate(data),
                controversyRating: this.calculateControversyRating(data)
            };

        } catch (error) {
            console.error('[VoteAnalytics] Error getting item stats:', error);
            return null;
        }
    }

    /**
     * Get daily voting trends
     * @param {number} days - Number of days to retrieve
     * @returns {Promise<Array>}
     */
    async getDailyTrends(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startDateStr = startDate.toISOString().split('T')[0];

            const snapshot = await this.db.collection(this.analyticsCollection)
                .where('date', '>=', startDateStr)
                .orderBy('date', 'desc')
                .get();

            const trends = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return trends;

        } catch (error) {
            console.error('[VoteAnalytics] Error getting daily trends:', error);
            return [];
        }
    }

    /**
     * Get user voting statistics
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<Object>}
     */
    async getUserVotingStats(userId = null) {
        try {
            const targetUserId = userId || this.auth.currentUser?.uid;

            if (!targetUserId) {
                return null;
            }

            // Count votes across all items
            const assetsVotes = await this.db.collectionGroup('votes')
                .where('userId', '==', targetUserId)
                .get();

            let totalVotes = 0;
            let totalUpvotes = 0;
            let totalDownvotes = 0;
            const votedItems = new Set();

            assetsVotes.forEach(doc => {
                const vote = doc.data();
                totalVotes++;
                if (vote.value === 1) totalUpvotes++;
                else if (vote.value === -1) totalDownvotes++;

                // Extract item ID from path
                const pathParts = doc.ref.path.split('/');
                if (pathParts.length >= 3) {
                    votedItems.add(`${pathParts[1]}/${pathParts[2]}`);
                }
            });

            return {
                userId: targetUserId,
                totalVotes,
                totalUpvotes,
                totalDownvotes,
                uniqueItems: votedItems.size,
                upvoteRate: totalVotes > 0 ? (totalUpvotes / totalVotes) * 100 : 0,
                downvoteRate: totalVotes > 0 ? (totalDownvotes / totalVotes) * 100 : 0
            };

        } catch (error) {
            console.error('[VoteAnalytics] Error getting user voting stats:', error);
            return null;
        }
    }

    /**
     * Calculate engagement rate
     * @param {Object} itemData - Item data
     * @returns {number} Engagement rate percentage
     */
    calculateEngagementRate(itemData) {
        // Engagement rate = (votes / views) * 100
        // If views not tracked, return 0
        const views = itemData.views || 0;
        const engagement = itemData.totalEngagement || 0;

        return views > 0 ? (engagement / views) * 100 : 0;
    }

    /**
     * Calculate controversy rating (0-100)
     * @param {Object} itemData - Item data
     * @returns {number} Controversy rating
     */
    calculateControversyRating(itemData) {
        const upvotes = itemData.upvoteCount || 0;
        const downvotes = itemData.downvoteCount || 0;
        const total = upvotes + downvotes;

        if (total === 0) return 0;

        // Controversy is high when votes are split 50/50
        // Low when heavily skewed to one side
        const ratio = Math.min(upvotes, downvotes) / total;

        // Normalize to 0-100 scale
        // 50/50 split = 100, 100/0 split = 0
        return Math.round(ratio * 200);
    }

    /**
     * Generate voting report for a time period
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Object>}
     */
    async generateReport(startDate, endDate) {
        try {
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const snapshot = await this.db.collection('vote_events')
                .where('date', '>=', startDateStr)
                .where('date', '<=', endDateStr)
                .get();

            const events = snapshot.docs.map(doc => doc.data());

            // Aggregate statistics
            const report = {
                period: {
                    start: startDateStr,
                    end: endDateStr
                },
                totalVotes: events.length,
                totalUpvotes: events.filter(e => e.voteValue === 1).length,
                totalDownvotes: events.filter(e => e.voteValue === -1).length,
                uniqueVoters: new Set(events.map(e => e.userId)).size,
                byItemType: {},
                byAction: {},
                topItems: {}
            };

            // Group by item type
            events.forEach(event => {
                if (!report.byItemType[event.itemType]) {
                    report.byItemType[event.itemType] = {
                        total: 0,
                        upvotes: 0,
                        downvotes: 0
                    };
                }
                report.byItemType[event.itemType].total++;
                if (event.voteValue === 1) report.byItemType[event.itemType].upvotes++;
                else report.byItemType[event.itemType].downvotes++;

                // Group by action
                if (!report.byAction[event.action]) {
                    report.byAction[event.action] = 0;
                }
                report.byAction[event.action]++;
            });

            return report;

        } catch (error) {
            console.error('[VoteAnalytics] Error generating report:', error);
            return null;
        }
    }

    /**
     * Clear analytics cache
     */
    clearCache() {
        this.statsCache.clear();
        console.log('[VoteAnalytics] Cache cleared');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoteAnalyticsService;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VoteAnalyticsService = VoteAnalyticsService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize service:
 *    const voteAnalytics = new VoteAnalyticsService(db, auth);
 *
 * 2. Track vote action:
 *    await voteAnalytics.trackVoteAction('vote_added', 'assets', 'assetId123', 1, 1);
 *
 * 3. Get most upvoted items:
 *    const topItems = await voteAnalytics.getMostUpvoted('assets', 10);
 *
 * 4. Get most controversial items:
 *    const controversial = await voteAnalytics.getMostControversial('notes', 10, 20);
 *
 * 5. Get item statistics:
 *    const stats = await voteAnalytics.getItemStats('assets', 'assetId123');
 *    console.log('Controversy rating:', stats.controversyRating);
 *
 * 6. Get user voting stats:
 *    const userStats = await voteAnalytics.getUserVotingStats();
 *    console.log('Upvote rate:', userStats.upvoteRate + '%');
 *
 * 7. Generate report:
 *    const startDate = new Date('2025-01-01');
 *    const endDate = new Date('2025-01-31');
 *    const report = await voteAnalytics.generateReport(startDate, endDate);
 *    console.log('Total votes in January:', report.totalVotes);
 */
