/**
 * Reputation Service
 *
 * Manages user reputation/karma and badge display.
 * Reputation is calculated server-side (via Cloud Functions) to prevent cheating.
 * This service only READS reputation data and displays it.
 *
 * Features:
 * - Fetch user reputation and level
 * - Get reputation breakdown
 * - Display badges
 * - Get leaderboard
 * - Track activity for display
 *
 * Firestore Structure (READ-ONLY):
 * user_reputation/{userId}
 * ├── totalPoints, level, levelName
 * ├── pointsBreakdown: { perspectivesCreated, relationshipsSuggested, ... }
 * ├── activityCounts: { perspectivesCreated, votesGiven, ... }
 * ├── trustScore: 0.0-1.0
 * └── currentStreak, longestStreak
 *
 * badge_awards/{awardId}
 * ├── userId, badgeId, badgeName, badgeTier
 * ├── awardedAt, pointsAwarded
 * └── isPinned, displayOrder
 */

class ReputationService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Cache
        this.reputationCache = new Map();
        this.badgeCache = new Map();
        this.CACHE_TTL = 2 * 60 * 1000; // 2 minutes

        // Reputation levels (for client-side display)
        this.LEVELS = [
            { minPoints: 0, level: 1, name: 'Newcomer', icon: '🌱' },
            { minPoints: 25, level: 2, name: 'Member', icon: '👤' },
            { minPoints: 100, level: 3, name: 'Contributor', icon: '📝' },
            { minPoints: 250, level: 4, name: 'Expert', icon: '⭐' },
            { minPoints: 500, level: 5, name: 'Master', icon: '🏆' },
            { minPoints: 1000, level: 6, name: 'Legend', icon: '👑' }
        ];

        // Badge tiers for styling
        this.BADGE_TIERS = {
            bronze: { color: '#cd7f32', textColor: '#fff' },
            silver: { color: '#c0c0c0', textColor: '#333' },
            gold: { color: '#ffd700', textColor: '#333' },
            platinum: { color: '#e5e4e2', textColor: '#333' },
            legendary: { color: '#9b59b6', textColor: '#fff' }
        };

        // Point values (informational only - actual calculation is server-side)
        this.POINT_VALUES = {
            note_written: 10,
            note_upvote_received: 2,
            perspective_created: 10,
            perspective_upvote_received: 3,
            relationship_suggested: 20,
            relationship_approved: 50,
            entity_submitted: 25,
            entity_approved: 100,
            badge_earned: 'varies'
        };
    }

    /**
     * Initialize the service
     */
    async init() {
        if (this.initialized) return;

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase not initialized');
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.initialized = true;

        console.log('[ReputationService] Initialized');
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // ==================== REPUTATION ====================

    /**
     * Get reputation for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Reputation data
     */
    async getReputation(userId) {
        await this.init();

        // Check cache
        const cached = this._getFromCache(this.reputationCache, userId);
        if (cached) return cached;

        const doc = await this.db.collection('user_reputation').doc(userId).get();

        if (!doc.exists) {
            // Return default reputation for new users
            const defaultRep = this._getDefaultReputation(userId);
            this._setCache(this.reputationCache, userId, defaultRep);
            return defaultRep;
        }

        const reputation = { userId, ...doc.data() };
        this._setCache(this.reputationCache, userId, reputation);

        return reputation;
    }

    /**
     * Get current user's reputation
     * @returns {Promise<Object|null>}
     */
    async getMyReputation() {
        const user = this.getCurrentUser();
        if (!user) return null;
        return await this.getReputation(user.uid);
    }

    /**
     * Get reputation level info from points
     * @param {number} points - Total reputation points
     * @returns {Object} Level info { level, name, icon, nextLevel, pointsToNext }
     */
    getReputationLevel(points) {
        let current = this.LEVELS[0];

        for (const level of this.LEVELS) {
            if (points >= level.minPoints) {
                current = level;
            } else {
                break;
            }
        }

        // Find next level
        const currentIndex = this.LEVELS.indexOf(current);
        const nextLevel = this.LEVELS[currentIndex + 1] || null;
        const pointsToNext = nextLevel ? nextLevel.minPoints - points : 0;

        return {
            level: current.level,
            name: current.name,
            icon: current.icon,
            points: points,
            nextLevel: nextLevel?.name || null,
            pointsToNext: Math.max(0, pointsToNext),
            progressPercent: nextLevel
                ? Math.min(100, ((points - current.minPoints) / (nextLevel.minPoints - current.minPoints)) * 100)
                : 100
        };
    }

    /**
     * Get leaderboard
     * @param {number} limit - Number of users to return
     * @returns {Promise<Array>} Top users by reputation
     */
    async getLeaderboard(limit = 10) {
        await this.init();

        const query = this.db.collection('user_reputation')
            .orderBy('totalPoints', 'desc')
            .limit(limit);

        const snapshot = await query.get();

        const leaderboard = [];
        let rank = 1;

        snapshot.forEach(doc => {
            const data = doc.data();
            leaderboard.push({
                rank: rank++,
                userId: doc.id,
                displayName: data.displayName || 'Anonymous',
                photoURL: data.photoURL || null,
                totalPoints: data.totalPoints || 0,
                level: this.getReputationLevel(data.totalPoints || 0)
            });
        });

        return leaderboard;
    }

    /**
     * Get reputation breakdown for display
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Breakdown with labels
     */
    async getReputationBreakdown(userId) {
        const reputation = await this.getReputation(userId);

        const breakdown = reputation.pointsBreakdown || {};

        return {
            notes: {
                label: 'Notes Written',
                count: reputation.activityCounts?.notesWritten || 0,
                points: breakdown.notesWritten || 0,
                icon: '💬'
            },
            perspectives: {
                label: 'Perspectives Created',
                count: reputation.activityCounts?.perspectivesCreated || 0,
                points: breakdown.perspectivesCreated || 0,
                icon: '👁️'
            },
            relationships: {
                label: 'Relationships Suggested',
                count: reputation.activityCounts?.relationshipsSuggested || 0,
                points: breakdown.relationshipsSuggested || 0,
                icon: '🔗'
            },
            entities: {
                label: 'Entities Submitted',
                count: reputation.activityCounts?.entitiesSubmitted || 0,
                points: breakdown.entitiesSubmitted || 0,
                icon: '📚'
            },
            upvotesReceived: {
                label: 'Upvotes Received',
                count: reputation.activityCounts?.upvotesReceived || 0,
                points: breakdown.upvotesReceived || 0,
                icon: '👍'
            },
            badges: {
                label: 'Badges Earned',
                count: reputation.activityCounts?.badgesEarned || 0,
                points: breakdown.badgesEarned || 0,
                icon: '🏅'
            }
        };
    }

    // ==================== BADGES ====================

    /**
     * Get badges for a user
     * @param {string} userId - User ID
     * @param {Object} options - { pinnedOnly, limit }
     * @returns {Promise<Array>} User's badges
     */
    async getUserBadges(userId, options = {}) {
        await this.init();

        const { pinnedOnly = false, limit = 50 } = options;

        // Check cache
        const cacheKey = `${userId}_${pinnedOnly}`;
        const cached = this._getFromCache(this.badgeCache, cacheKey);
        if (cached) return cached;

        let query = this.db.collection('badge_awards')
            .where('userId', '==', userId)
            .orderBy('awardedAt', 'desc');

        if (pinnedOnly) {
            query = query.where('isPinned', '==', true);
        }

        query = query.limit(limit);

        const snapshot = await query.get();

        const badges = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            badges.push({
                id: doc.id,
                ...data,
                tierStyle: this.BADGE_TIERS[data.badgeTier] || this.BADGE_TIERS.bronze
            });
        });

        this._setCache(this.badgeCache, cacheKey, badges);

        return badges;
    }

    /**
     * Get current user's badges
     * @param {Object} options - Options
     * @returns {Promise<Array>}
     */
    async getMyBadges(options = {}) {
        const user = this.getCurrentUser();
        if (!user) return [];
        return await this.getUserBadges(user.uid, options);
    }

    /**
     * Get available badge definitions
     * @returns {Promise<Array>} All badge definitions
     */
    async getBadgeDefinitions() {
        await this.init();

        const snapshot = await this.db.collection('badges')
            .where('isActive', '==', true)
            .orderBy('tier')
            .get();

        const badges = [];
        snapshot.forEach(doc => {
            badges.push({ id: doc.id, ...doc.data() });
        });

        return badges;
    }

    /**
     * Pin/unpin a badge on profile
     * @param {string} awardId - Badge award ID
     * @param {boolean} pinned - Whether to pin
     */
    async toggleBadgePin(awardId, pinned) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in');
        }

        const docRef = this.db.collection('badge_awards').doc(awardId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Badge award not found');
        }

        if (doc.data().userId !== user.uid) {
            throw new Error('You can only modify your own badges');
        }

        await docRef.update({ isPinned: pinned });

        // Clear cache
        this.badgeCache.clear();
    }

    // ==================== ACTIVITY STATS ====================

    /**
     * Get activity statistics for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Activity stats
     */
    async getActivityStats(userId) {
        const reputation = await this.getReputation(userId);

        return {
            currentStreak: reputation.currentStreak || 0,
            longestStreak: reputation.longestStreak || 0,
            lastActiveDate: reputation.lastActiveDate || null,
            trustScore: reputation.trustScore || 0,
            ...reputation.activityCounts
        };
    }

    /**
     * Get trust score explanation
     * @param {number} trustScore - Trust score 0-1
     * @returns {Object} Trust level info
     */
    getTrustLevel(trustScore) {
        if (trustScore >= 0.9) {
            return { level: 'Trusted', color: '#22c55e', icon: '✓' };
        } else if (trustScore >= 0.7) {
            return { level: 'Verified', color: '#3b82f6', icon: '✓' };
        } else if (trustScore >= 0.5) {
            return { level: 'Established', color: '#eab308', icon: '•' };
        } else {
            return { level: 'New', color: '#6b7280', icon: '•' };
        }
    }

    // ==================== PRIVATE HELPERS ====================

    _getDefaultReputation(userId) {
        return {
            userId,
            totalPoints: 0,
            level: 1,
            levelName: 'Newcomer',
            pointsBreakdown: {},
            activityCounts: {},
            trustScore: 0.5,
            currentStreak: 0,
            longestStreak: 0
        };
    }

    _getFromCache(cache, key) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }

    _setCache(cache, key, data) {
        cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.reputationCache.clear();
        this.badgeCache.clear();
    }
}

// Create singleton instance
window.reputationService = window.reputationService || new ReputationService();

// Export class
if (typeof window !== 'undefined') {
    window.ReputationService = ReputationService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Get user reputation:
 *    const reputation = await reputationService.getReputation('userId');
 *    console.log(reputation.totalPoints, reputation.levelName);
 *
 * 2. Get level info from points:
 *    const level = reputationService.getReputationLevel(350);
 *    console.log(level.name); // "Expert"
 *    console.log(level.pointsToNext); // 150 (to reach Master)
 *
 * 3. Get user badges:
 *    const badges = await reputationService.getUserBadges('userId');
 *
 * 4. Get leaderboard:
 *    const top10 = await reputationService.getLeaderboard(10);
 *
 * 5. Display reputation breakdown:
 *    const breakdown = await reputationService.getReputationBreakdown('userId');
 *    Object.entries(breakdown).forEach(([key, data]) => {
 *      console.log(`${data.icon} ${data.label}: ${data.points} pts (${data.count})`);
 *    });
 */
