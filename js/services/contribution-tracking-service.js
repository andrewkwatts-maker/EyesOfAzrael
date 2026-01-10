/**
 * Contribution Tracking Service
 * Eyes of Azrael Project
 *
 * Tracks all user contributions across the platform including:
 * - Asset creation and edits
 * - Section additions
 * - Relationship additions
 * - Source citations
 * - Corpus references
 * - Comments and perspectives
 * - Image uploads
 *
 * Features:
 * - Record and retrieve contributions
 * - Contribution statistics
 * - Leaderboards (global, by mythology, by asset type)
 * - Contribution streaks with badges
 * - Activity feeds
 * - Achievement event triggers
 *
 * Firestore Structure:
 * contributions/{contributionId}
 * ├── userId, userName, userAvatar
 * ├── assetId, assetName, assetType, mythology
 * ├── type: 'ASSET_CREATED' | 'MAJOR_EDIT' | etc.
 * ├── weight: number (points awarded)
 * ├── metadata: { editSummary, sectionTitle, ... }
 * ├── createdAt, status
 *
 * userStats/{userId}
 * ├── totalContributions, totalPoints
 * ├── contributionsByType: { ASSET_CREATED: count, ... }
 * ├── pointsByType: { ASSET_CREATED: points, ... }
 * ├── currentStreak, longestStreak, lastContributionDate
 * ├── streakGracePeriodUsed: boolean
 * ├── mythologyContributions: { greek: count, ... }
 * ├── assetTypeContributions: { deities: count, ... }
 *
 * leaderboards/global
 * ├── allTime: [{ userId, points, rank }, ...]
 * ├── monthly: [{ userId, points, rank, month }, ...]
 * ├── weekly: [{ userId, points, rank, weekStart }, ...]
 *
 * leaderboards/mythology_{mythologyId}
 * leaderboards/assetType_{assetType}
 */

class ContributionTrackingService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Cache
        this.statsCache = new Map();
        this.leaderboardCache = new Map();
        this.CACHE_TTL = 2 * 60 * 1000; // 2 minutes
        this.LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Active listeners for cleanup
        this.activeListeners = new Map();

        // Rate limiting
        this.recordsInLastMinute = 0;
        this.maxRecordsPerMinute = 30;
        this.rateResetTime = Date.now() + 60000;
    }

    /**
     * Contribution types and their point weights
     * Higher weights for more significant contributions
     */
    static CONTRIBUTION_WEIGHTS = {
        ASSET_CREATED: 50,       // Created new asset
        MAJOR_EDIT: 10,          // Significant content change (>500 chars changed)
        MINOR_EDIT: 3,           // Small fixes (<500 chars changed)
        SECTION_ADDED: 15,       // Added new section to asset
        RELATIONSHIP_ADDED: 5,   // Added entity relationship
        SOURCE_ADDED: 5,         // Added citation/source
        CORPUS_CITATION: 5,      // Verified corpus reference
        COMMENT: 1,              // Discussion comment
        PERSPECTIVE_ADDED: 8,    // User perspective
        SUGGESTION_APPROVED: 7,  // Edit suggestion was approved
        IMAGE_UPLOADED: 5        // Added image
    };

    /**
     * Streak badge thresholds
     */
    static STREAK_BADGES = {
        STREAK_7: { days: 7, name: 'Week Warrior', icon: 'fire-7' },
        STREAK_30: { days: 30, name: 'Monthly Master', icon: 'fire-30' },
        STREAK_100: { days: 100, name: 'Century Scholar', icon: 'fire-100' },
        STREAK_365: { days: 365, name: 'Yearly Legend', icon: 'fire-365' }
    };

    /**
     * Grace period for streak recovery (in days)
     */
    static STREAK_GRACE_PERIOD = 1;

    // ==================== INITIALIZATION ====================

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

        console.log('[ContributionTrackingService] Initialized');
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // ==================== RECORD CONTRIBUTIONS ====================

    /**
     * Record a user contribution
     * @param {string} userId - User ID
     * @param {string} assetId - Asset ID that was modified
     * @param {string} type - Contribution type (from CONTRIBUTION_WEIGHTS)
     * @param {Object} metadata - Additional context
     * @returns {Promise<Object>} Created contribution record
     */
    async recordContribution(userId, assetId, type, metadata = {}) {
        await this.init();

        // Validate type
        const weight = ContributionTrackingService.CONTRIBUTION_WEIGHTS[type];
        if (weight === undefined) {
            throw new Error(`Invalid contribution type: ${type}. Valid types: ${Object.keys(ContributionTrackingService.CONTRIBUTION_WEIGHTS).join(', ')}`);
        }

        // Rate limiting
        if (!this._checkRateLimit()) {
            console.warn('[ContributionTrackingService] Rate limit exceeded');
            throw new Error('Too many contributions recorded. Please wait before continuing.');
        }

        // Get user info
        let userName = 'Anonymous';
        let userAvatar = null;

        if (userId) {
            try {
                const userDoc = await this.db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userName = userData.displayName || userData.name || 'Anonymous';
                    userAvatar = userData.photoURL || userData.avatar || null;
                }
            } catch (err) {
                console.warn('[ContributionTrackingService] Could not fetch user info:', err);
            }
        }

        // Build contribution document
        const contribution = {
            // User info
            userId,
            userName,
            userAvatar,

            // Asset info
            assetId,
            assetName: metadata.assetName || null,
            assetType: metadata.assetType || null,
            assetCollection: metadata.assetCollection || null,
            mythology: metadata.mythology || null,

            // Contribution details
            type,
            weight,
            metadata: this._sanitizeMetadata(metadata),

            // Status and timestamps
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),

            // For querying
            createdAtMs: Date.now(),
            dateKey: this._getDateKey(new Date())
        };

        // Use a batch to update contribution and stats atomically
        const batch = this.db.batch();

        // Add contribution document
        const contributionRef = this.db.collection('contributions').doc();
        batch.set(contributionRef, contribution);

        // Update user stats
        const statsRef = this.db.collection('userStats').doc(userId);
        const statsUpdate = {
            totalContributions: firebase.firestore.FieldValue.increment(1),
            totalPoints: firebase.firestore.FieldValue.increment(weight),
            [`contributionsByType.${type}`]: firebase.firestore.FieldValue.increment(1),
            [`pointsByType.${type}`]: firebase.firestore.FieldValue.increment(weight),
            lastContributionDate: firebase.firestore.FieldValue.serverTimestamp(),
            lastContributionDateMs: Date.now(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add mythology and asset type specific counts
        if (metadata.mythology) {
            statsUpdate[`mythologyContributions.${metadata.mythology}`] = firebase.firestore.FieldValue.increment(1);
        }
        if (metadata.assetType) {
            statsUpdate[`assetTypeContributions.${metadata.assetType}`] = firebase.firestore.FieldValue.increment(1);
        }

        batch.set(statsRef, statsUpdate, { merge: true });

        // Commit batch
        await batch.commit();

        // Increment rate limit counter
        this.recordsInLastMinute++;

        // Update streak (async, non-blocking)
        this._updateStreak(userId).catch(err => {
            console.warn('[ContributionTrackingService] Streak update failed:', err);
        });

        // Clear stats cache for this user
        this._clearFromCache(this.statsCache, userId);

        // Dispatch contribution event for badge system
        this._dispatchContributionEvent(userId, type, weight, contribution);

        console.log(`[ContributionTrackingService] Recorded ${type} contribution for user ${userId}`);

        return {
            id: contributionRef.id,
            ...contribution,
            createdAt: new Date()
        };
    }

    // ==================== GET CONTRIBUTIONS ====================

    /**
     * Get user's contribution history
     * @param {string} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of contributions
     */
    async getContributions(userId, filters = {}) {
        await this.init();

        const { type, assetType, mythology, limit = 50, startAfter = null, sortBy = 'recent' } = filters;

        let query = this.db.collection('contributions')
            .where('userId', '==', userId)
            .where('status', '==', 'active');

        // Apply filters
        if (type) {
            query = query.where('type', '==', type);
        }
        if (assetType) {
            query = query.where('assetType', '==', assetType);
        }
        if (mythology) {
            query = query.where('mythology', '==', mythology);
        }

        // Apply sorting
        switch (sortBy) {
            case 'points':
                query = query.orderBy('weight', 'desc').orderBy('createdAtMs', 'desc');
                break;
            case 'recent':
            default:
                query = query.orderBy('createdAtMs', 'desc');
                break;
        }

        // Pagination
        if (startAfter) {
            const startDoc = await this.db.collection('contributions').doc(startAfter).get();
            if (startDoc.exists) {
                query = query.startAfter(startDoc);
            }
        }

        query = query.limit(limit);

        const snapshot = await query.get();

        const contributions = [];
        snapshot.forEach(doc => {
            contributions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return contributions;
    }

    /**
     * Get all contributions for a specific asset
     * @param {string} assetId - Asset ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of contributions
     */
    async getAssetContributions(assetId, options = {}) {
        await this.init();

        const { limit = 50, includeDetails = false } = options;

        const query = this.db.collection('contributions')
            .where('assetId', '==', assetId)
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(limit);

        const snapshot = await query.get();

        const contributions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            contributions.push({
                id: doc.id,
                ...data,
                // Optionally redact metadata for privacy
                metadata: includeDetails ? data.metadata : { editSummary: data.metadata?.editSummary }
            });
        });

        return contributions;
    }

    /**
     * Get contribution statistics for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Statistics object
     */
    async getContributionStats(userId) {
        await this.init();

        // Check cache
        const cached = this._getFromCache(this.statsCache, userId);
        if (cached) return cached;

        const statsDoc = await this.db.collection('userStats').doc(userId).get();

        if (!statsDoc.exists) {
            const defaultStats = this._getDefaultStats(userId);
            this._setCache(this.statsCache, userId, defaultStats);
            return defaultStats;
        }

        const stats = {
            userId,
            ...statsDoc.data()
        };

        // Calculate derived stats
        stats.averagePointsPerContribution = stats.totalContributions > 0
            ? Math.round((stats.totalPoints / stats.totalContributions) * 10) / 10
            : 0;

        // Get top contribution types
        stats.topContributionTypes = this._getTopContributionTypes(stats.contributionsByType || {});

        this._setCache(this.statsCache, userId, stats);

        return stats;
    }

    // ==================== LEADERBOARDS ====================

    /**
     * Get global leaderboard
     * @param {string} timeframe - 'allTime', 'monthly', 'weekly'
     * @param {number} limit - Number of users to return
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getGlobalLeaderboard(timeframe = 'allTime', limit = 10) {
        await this.init();

        const cacheKey = `global_${timeframe}_${limit}`;
        const cached = this._getFromCache(this.leaderboardCache, cacheKey, this.LEADERBOARD_CACHE_TTL);
        if (cached) return cached;

        let query;

        switch (timeframe) {
            case 'weekly':
                const weekStart = this._getWeekStart();
                query = this.db.collection('contributions')
                    .where('status', '==', 'active')
                    .where('createdAtMs', '>=', weekStart.getTime())
                    .orderBy('createdAtMs', 'desc');
                break;

            case 'monthly':
                const monthStart = this._getMonthStart();
                query = this.db.collection('contributions')
                    .where('status', '==', 'active')
                    .where('createdAtMs', '>=', monthStart.getTime())
                    .orderBy('createdAtMs', 'desc');
                break;

            case 'allTime':
            default:
                // For all-time, use aggregated stats
                query = this.db.collection('userStats')
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
                        userName: data.userName || 'Anonymous',
                        userAvatar: data.userAvatar || null,
                        totalPoints: data.totalPoints || 0,
                        totalContributions: data.totalContributions || 0,
                        currentStreak: data.currentStreak || 0
                    });
                });

                this._setCache(this.leaderboardCache, cacheKey, leaderboard);
                return leaderboard;
        }

        // For weekly/monthly, aggregate from contributions
        const snapshot = await query.get();
        const userPoints = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            const current = userPoints.get(userId) || {
                userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                totalPoints: 0,
                contributionCount: 0
            };
            current.totalPoints += data.weight || 0;
            current.contributionCount++;
            userPoints.set(userId, current);
        });

        // Convert to array and sort
        const leaderboard = Array.from(userPoints.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));

        this._setCache(this.leaderboardCache, cacheKey, leaderboard);

        return leaderboard;
    }

    /**
     * Get leaderboard for a specific mythology
     * @param {string} mythology - Mythology ID (e.g., 'greek', 'norse')
     * @param {number} limit - Number of users to return
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getMythologyLeaderboard(mythology, limit = 10) {
        await this.init();

        const cacheKey = `mythology_${mythology}_${limit}`;
        const cached = this._getFromCache(this.leaderboardCache, cacheKey, this.LEADERBOARD_CACHE_TTL);
        if (cached) return cached;

        // Query contributions for this mythology
        const query = this.db.collection('contributions')
            .where('mythology', '==', mythology)
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(1000); // Get enough to aggregate

        const snapshot = await query.get();
        const userPoints = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            const current = userPoints.get(userId) || {
                userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                totalPoints: 0,
                contributionCount: 0
            };
            current.totalPoints += data.weight || 0;
            current.contributionCount++;
            userPoints.set(userId, current);
        });

        const leaderboard = Array.from(userPoints.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
                mythology
            }));

        this._setCache(this.leaderboardCache, cacheKey, leaderboard);

        return leaderboard;
    }

    /**
     * Get leaderboard for a specific asset type
     * @param {string} assetType - Asset type (e.g., 'deities', 'creatures')
     * @param {number} limit - Number of users to return
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getAssetTypeLeaderboard(assetType, limit = 10) {
        await this.init();

        const cacheKey = `assetType_${assetType}_${limit}`;
        const cached = this._getFromCache(this.leaderboardCache, cacheKey, this.LEADERBOARD_CACHE_TTL);
        if (cached) return cached;

        const query = this.db.collection('contributions')
            .where('assetType', '==', assetType)
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(1000);

        const snapshot = await query.get();
        const userPoints = new Map();

        snapshot.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            const current = userPoints.get(userId) || {
                userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                totalPoints: 0,
                contributionCount: 0
            };
            current.totalPoints += data.weight || 0;
            current.contributionCount++;
            userPoints.set(userId, current);
        });

        const leaderboard = Array.from(userPoints.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
                assetType
            }));

        this._setCache(this.leaderboardCache, cacheKey, leaderboard);

        return leaderboard;
    }

    /**
     * Get top contributors for the current week
     * @param {number} limit - Number of users to return
     * @returns {Promise<Array>} Weekly top contributors
     */
    async getWeeklyTopContributors(limit = 10) {
        return this.getGlobalLeaderboard('weekly', limit);
    }

    // ==================== CONTRIBUTION STREAKS ====================

    /**
     * Update user's contribution streak
     * @param {string} userId - User ID
     * @private
     */
    async _updateStreak(userId) {
        const statsRef = this.db.collection('userStats').doc(userId);

        await this.db.runTransaction(async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            const now = new Date();
            const todayKey = this._getDateKey(now);

            if (!statsDoc.exists) {
                // New user - start streak at 1
                transaction.set(statsRef, {
                    currentStreak: 1,
                    longestStreak: 1,
                    lastContributionDateKey: todayKey,
                    streakGracePeriodUsed: false,
                    streakStartDate: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                return;
            }

            const stats = statsDoc.data();
            const lastDateKey = stats.lastContributionDateKey;
            const currentStreak = stats.currentStreak || 0;
            const longestStreak = stats.longestStreak || 0;
            const gracePeriodUsed = stats.streakGracePeriodUsed || false;

            // If already contributed today, no streak update needed
            if (lastDateKey === todayKey) {
                return;
            }

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = this._getDateKey(yesterday);

            const twoDaysAgo = new Date(now);
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoKey = this._getDateKey(twoDaysAgo);

            let newStreak = currentStreak;
            let newGracePeriodUsed = gracePeriodUsed;
            let streakBroken = false;

            if (lastDateKey === yesterdayKey) {
                // Contributed yesterday - continue streak
                newStreak = currentStreak + 1;
                newGracePeriodUsed = false; // Reset grace period
            } else if (lastDateKey === twoDaysAgoKey && !gracePeriodUsed) {
                // Missed yesterday but within grace period
                newStreak = currentStreak + 1;
                newGracePeriodUsed = true; // Used the grace period
                console.log(`[ContributionTrackingService] User ${userId} used streak grace period`);
            } else {
                // Streak broken - start new
                newStreak = 1;
                newGracePeriodUsed = false;
                streakBroken = true;
            }

            const newLongestStreak = Math.max(longestStreak, newStreak);

            const updateData = {
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastContributionDateKey: todayKey,
                streakGracePeriodUsed: newGracePeriodUsed
            };

            if (streakBroken || currentStreak === 0) {
                updateData.streakStartDate = firebase.firestore.FieldValue.serverTimestamp();
            }

            transaction.update(statsRef, updateData);

            // Check for streak achievements
            this._checkStreakAchievements(userId, newStreak);
        });
    }

    /**
     * Get user's current streak info
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Streak information
     */
    async getStreakInfo(userId) {
        await this.init();

        const statsDoc = await this.db.collection('userStats').doc(userId).get();

        if (!statsDoc.exists) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                isActive: false,
                gracePeriodAvailable: true,
                nextBadge: ContributionTrackingService.STREAK_BADGES.STREAK_7
            };
        }

        const stats = statsDoc.data();
        const now = new Date();
        const todayKey = this._getDateKey(now);
        const yesterdayKey = this._getDateKey(new Date(now.setDate(now.getDate() - 1)));

        const isActive = stats.lastContributionDateKey === todayKey ||
                        stats.lastContributionDateKey === yesterdayKey;

        // Find next streak badge
        const currentStreak = stats.currentStreak || 0;
        let nextBadge = null;
        for (const [key, badge] of Object.entries(ContributionTrackingService.STREAK_BADGES)) {
            if (badge.days > currentStreak) {
                nextBadge = { key, ...badge, daysRemaining: badge.days - currentStreak };
                break;
            }
        }

        return {
            currentStreak,
            longestStreak: stats.longestStreak || 0,
            isActive,
            gracePeriodAvailable: !stats.streakGracePeriodUsed,
            streakStartDate: stats.streakStartDate,
            nextBadge,
            earnedBadges: this._getEarnedStreakBadges(stats.longestStreak || 0)
        };
    }

    /**
     * Check for streak achievements and emit events
     * @private
     */
    _checkStreakAchievements(userId, streak) {
        for (const [key, badge] of Object.entries(ContributionTrackingService.STREAK_BADGES)) {
            if (streak === badge.days) {
                this._dispatchStreakEvent(userId, key, badge);
            }
        }
    }

    /**
     * Get earned streak badges based on longest streak
     * @private
     */
    _getEarnedStreakBadges(longestStreak) {
        const earned = [];
        for (const [key, badge] of Object.entries(ContributionTrackingService.STREAK_BADGES)) {
            if (longestStreak >= badge.days) {
                earned.push({ key, ...badge });
            }
        }
        return earned;
    }

    // ==================== ACTIVITY FEED ====================

    /**
     * Get site-wide recent activity
     * @param {number} limit - Number of activities to return
     * @returns {Promise<Array>} Recent activity entries
     */
    async getRecentActivity(limit = 20) {
        await this.init();

        const query = this.db.collection('contributions')
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(limit);

        const snapshot = await query.get();

        const activities = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'contribution',
                contributionType: data.type,
                userId: data.userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                assetId: data.assetId,
                assetName: data.assetName,
                assetType: data.assetType,
                mythology: data.mythology,
                weight: data.weight,
                summary: this._getActivitySummary(data),
                createdAt: data.createdAt,
                createdAtMs: data.createdAtMs
            });
        });

        return activities;
    }

    /**
     * Get activity feed for a specific user
     * @param {string} userId - User ID
     * @param {number} limit - Number of activities to return
     * @returns {Promise<Array>} User's activity entries
     */
    async getUserActivity(userId, limit = 20) {
        await this.init();

        const query = this.db.collection('contributions')
            .where('userId', '==', userId)
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(limit);

        const snapshot = await query.get();

        const activities = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'contribution',
                contributionType: data.type,
                assetId: data.assetId,
                assetName: data.assetName,
                assetType: data.assetType,
                mythology: data.mythology,
                weight: data.weight,
                summary: this._getActivitySummary(data),
                createdAt: data.createdAt,
                createdAtMs: data.createdAtMs
            });
        });

        return activities;
    }

    /**
     * Get activity feed for a specific asset
     * @param {string} assetId - Asset ID
     * @param {number} limit - Number of activities to return
     * @returns {Promise<Array>} Asset's activity entries
     */
    async getAssetActivity(assetId, limit = 20) {
        await this.init();

        const query = this.db.collection('contributions')
            .where('assetId', '==', assetId)
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(limit);

        const snapshot = await query.get();

        const activities = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'contribution',
                contributionType: data.type,
                userId: data.userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                weight: data.weight,
                summary: this._getActivitySummary(data),
                metadata: data.metadata,
                createdAt: data.createdAt,
                createdAtMs: data.createdAtMs
            });
        });

        return activities;
    }

    /**
     * Subscribe to real-time activity updates
     * @param {Function} callback - Callback function
     * @param {Object} options - { userId, assetId, limit }
     * @returns {Function} Unsubscribe function
     */
    subscribeToActivity(callback, options = {}) {
        const { userId, assetId, limit = 10 } = options;
        const listenerKey = `activity_${userId || 'global'}_${assetId || 'all'}`;

        // Cleanup existing listener
        if (this.activeListeners.has(listenerKey)) {
            this.activeListeners.get(listenerKey)();
        }

        let query = this.db.collection('contributions')
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(limit);

        if (userId) {
            query = query.where('userId', '==', userId);
        }
        if (assetId) {
            query = query.where('assetId', '==', assetId);
        }

        const unsubscribe = query.onSnapshot(
            snapshot => {
                const activities = [];
                snapshot.forEach(doc => {
                    activities.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(activities);
            },
            error => {
                console.error('[ContributionTrackingService] Activity listener error:', error);
                callback([]);
            }
        );

        this.activeListeners.set(listenerKey, unsubscribe);

        return () => {
            unsubscribe();
            this.activeListeners.delete(listenerKey);
        };
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Get activity summary text
     */
    _getActivitySummary(contribution) {
        const typeLabels = {
            ASSET_CREATED: `created ${contribution.assetType || 'asset'}`,
            MAJOR_EDIT: 'made significant edits to',
            MINOR_EDIT: 'made minor edits to',
            SECTION_ADDED: 'added a section to',
            RELATIONSHIP_ADDED: 'added a relationship to',
            SOURCE_ADDED: 'added a source to',
            CORPUS_CITATION: 'added a corpus citation to',
            COMMENT: 'commented on',
            PERSPECTIVE_ADDED: 'shared a perspective on',
            SUGGESTION_APPROVED: 'had their suggestion approved for',
            IMAGE_UPLOADED: 'uploaded an image for'
        };

        const action = typeLabels[contribution.type] || 'contributed to';
        const assetName = contribution.assetName || contribution.assetId || 'an asset';

        return `${action} ${assetName}`;
    }

    /**
     * Get default stats for new users
     */
    _getDefaultStats(userId) {
        return {
            userId,
            totalContributions: 0,
            totalPoints: 0,
            contributionsByType: {},
            pointsByType: {},
            currentStreak: 0,
            longestStreak: 0,
            mythologyContributions: {},
            assetTypeContributions: {},
            averagePointsPerContribution: 0,
            topContributionTypes: []
        };
    }

    /**
     * Get top contribution types from counts
     */
    _getTopContributionTypes(contributionsByType) {
        return Object.entries(contributionsByType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({
                type,
                count,
                label: this._getTypeLabel(type)
            }));
    }

    /**
     * Get human-readable label for contribution type
     */
    _getTypeLabel(type) {
        const labels = {
            ASSET_CREATED: 'Assets Created',
            MAJOR_EDIT: 'Major Edits',
            MINOR_EDIT: 'Minor Edits',
            SECTION_ADDED: 'Sections Added',
            RELATIONSHIP_ADDED: 'Relationships Added',
            SOURCE_ADDED: 'Sources Added',
            CORPUS_CITATION: 'Corpus Citations',
            COMMENT: 'Comments',
            PERSPECTIVE_ADDED: 'Perspectives',
            SUGGESTION_APPROVED: 'Approved Suggestions',
            IMAGE_UPLOADED: 'Images Uploaded'
        };
        return labels[type] || type;
    }

    /**
     * Sanitize metadata object
     */
    _sanitizeMetadata(metadata) {
        const sanitized = {};
        const allowedKeys = ['editSummary', 'sectionTitle', 'relationshipType',
            'sourceTitle', 'sourceUrl', 'corpusRef', 'commentId',
            'perspectiveId', 'imageUrl', 'charsDiff', 'assetName',
            'assetType', 'assetCollection', 'mythology'];

        for (const key of allowedKeys) {
            if (metadata[key] !== undefined) {
                const value = metadata[key];
                if (typeof value === 'string') {
                    sanitized[key] = value.slice(0, 500);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[key] = value;
                }
            }
        }

        return sanitized;
    }

    /**
     * Get date key for streak tracking (YYYY-MM-DD)
     */
    _getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Get start of current week (Sunday)
     */
    _getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    /**
     * Get start of current month
     */
    _getMonthStart() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    /**
     * Rate limit check
     */
    _checkRateLimit() {
        const now = Date.now();
        if (now > this.rateResetTime) {
            this.recordsInLastMinute = 0;
            this.rateResetTime = now + 60000;
        }
        return this.recordsInLastMinute < this.maxRecordsPerMinute;
    }

    /**
     * Cache helpers
     */
    _getFromCache(cache, key, ttl = this.CACHE_TTL) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > ttl) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }

    _setCache(cache, key, data) {
        cache.set(key, { data, timestamp: Date.now() });
    }

    _clearFromCache(cache, key) {
        cache.delete(key);
    }

    /**
     * Dispatch contribution event for badge system
     */
    _dispatchContributionEvent(userId, type, weight, contribution) {
        window.dispatchEvent(new CustomEvent('contribution-recorded', {
            detail: {
                userId,
                type,
                weight,
                contributionId: contribution.id,
                assetId: contribution.assetId,
                assetType: contribution.assetType,
                mythology: contribution.mythology
            }
        }));

        // Check for milestones
        this._checkContributionMilestones(userId);
    }

    /**
     * Dispatch streak achievement event
     */
    _dispatchStreakEvent(userId, streakKey, badge) {
        window.dispatchEvent(new CustomEvent('streak-achieved', {
            detail: {
                userId,
                streakKey,
                badge
            }
        }));
    }

    /**
     * Check for contribution milestones
     */
    async _checkContributionMilestones(userId) {
        try {
            const stats = await this.getContributionStats(userId);
            const milestones = [10, 25, 50, 100, 250, 500, 1000];

            if (milestones.includes(stats.totalContributions)) {
                window.dispatchEvent(new CustomEvent('contribution-milestone', {
                    detail: {
                        userId,
                        milestone: stats.totalContributions,
                        totalPoints: stats.totalPoints
                    }
                }));
            }
        } catch (err) {
            console.warn('[ContributionTrackingService] Milestone check failed:', err);
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.activeListeners.forEach(unsubscribe => unsubscribe());
        this.activeListeners.clear();
        this.statsCache.clear();
        this.leaderboardCache.clear();
    }
}

// Create singleton instance
window.contributionTrackingService = window.contributionTrackingService || new ContributionTrackingService();

// Export class
if (typeof window !== 'undefined') {
    window.ContributionTrackingService = ContributionTrackingService;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContributionTrackingService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Record a contribution:
 *    await contributionTrackingService.recordContribution(
 *      'userId123',
 *      'assetId456',
 *      'ASSET_CREATED',
 *      {
 *        assetName: 'Zeus',
 *        assetType: 'deities',
 *        mythology: 'greek',
 *        editSummary: 'Created new deity entry'
 *      }
 *    );
 *
 * 2. Get user's contributions:
 *    const contributions = await contributionTrackingService.getContributions(
 *      'userId123',
 *      { type: 'ASSET_CREATED', limit: 20 }
 *    );
 *
 * 3. Get user's statistics:
 *    const stats = await contributionTrackingService.getContributionStats('userId123');
 *    console.log(stats.totalPoints, stats.currentStreak);
 *
 * 4. Get global leaderboard:
 *    const topUsers = await contributionTrackingService.getGlobalLeaderboard('weekly', 10);
 *
 * 5. Get mythology leaderboard:
 *    const greekExperts = await contributionTrackingService.getMythologyLeaderboard('greek', 10);
 *
 * 6. Get streak info:
 *    const streak = await contributionTrackingService.getStreakInfo('userId123');
 *    console.log(`Current streak: ${streak.currentStreak} days`);
 *    console.log(`Next badge: ${streak.nextBadge?.name} in ${streak.nextBadge?.daysRemaining} days`);
 *
 * 7. Get recent activity:
 *    const activity = await contributionTrackingService.getRecentActivity(20);
 *
 * 8. Subscribe to real-time activity:
 *    const unsubscribe = contributionTrackingService.subscribeToActivity(
 *      (activities) => console.log('New activities:', activities),
 *      { limit: 10 }
 *    );
 *    // Later: unsubscribe();
 *
 * 9. Listen for contribution events:
 *    window.addEventListener('contribution-recorded', (event) => {
 *      const { userId, type, weight } = event.detail;
 *      console.log(`${userId} earned ${weight} points for ${type}`);
 *    });
 *
 *    window.addEventListener('streak-achieved', (event) => {
 *      const { userId, badge } = event.detail;
 *      console.log(`${userId} earned streak badge: ${badge.name}`);
 *    });
 *
 *    window.addEventListener('contribution-milestone', (event) => {
 *      const { userId, milestone } = event.detail;
 *      console.log(`${userId} reached ${milestone} contributions!`);
 *    });
 */
