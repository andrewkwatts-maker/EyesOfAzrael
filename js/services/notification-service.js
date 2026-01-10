/**
 * Notification Service
 *
 * Manages user notifications across the Eyes of Azrael platform.
 * Handles notification creation, retrieval, real-time updates, and preferences.
 *
 * Features:
 * - Create notifications for various events
 * - Get notifications with filters
 * - Mark as read (single or all)
 * - Unread count for badge display
 * - Real-time subscription with callbacks
 * - User notification preferences
 *
 * Notification Types:
 * - ownership_claim_received: Someone claimed your asset
 * - ownership_claim_approved: Your claim was approved
 * - ownership_claim_denied: Your claim was denied
 * - ownership_transferred: Ownership was transferred to/from you
 * - edit_suggested: Someone suggested an edit to your asset
 * - edit_approved: Your edit suggestion was approved
 * - edit_rejected: Your edit suggestion was rejected
 * - comment_reply: Someone replied to your comment
 * - perspective_reply: Someone replied to your perspective
 * - mention: You were mentioned in a discussion
 * - badge_earned: You earned a new badge
 * - asset_flagged: Your asset was flagged for review
 * - contribution_milestone: You reached a contribution milestone
 *
 * Firestore Structure:
 * notifications/{userId}/items/{notificationId}
 * |-- type: string (notification type)
 * |-- title: string
 * |-- message: string
 * |-- data: object (type-specific data)
 * |-- read: boolean
 * |-- createdAt: timestamp
 * |-- expiresAt: timestamp (optional)
 * |-- actionUrl: string (optional, link to related content)
 * |-- actionLabel: string (optional)
 * |-- icon: string (optional, icon identifier)
 *
 * notifications/{userId}/preferences
 * |-- enabled: object { [type]: boolean }
 * |-- emailEnabled: boolean
 * |-- emailDigest: 'immediate' | 'daily' | 'weekly' | 'none'
 * |-- quietHoursStart: number (hour 0-23)
 * |-- quietHoursEnd: number (hour 0-23)
 *
 * @requires Firebase Firestore
 */

class NotificationService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Active subscriptions
        this.subscriptions = new Map();
        this.unsubscribeFunctions = new Map();

        // Cache
        this.notificationCache = new Map();
        this.preferencesCache = new Map();
        this.unreadCountCache = new Map();
        this.CACHE_TTL = 60 * 1000; // 1 minute

        // Notification type configurations
        this.NOTIFICATION_TYPES = {
            ownership_claim_received: {
                label: 'Ownership Claim Received',
                icon: 'claim',
                category: 'ownership',
                defaultEnabled: true,
                priority: 'high'
            },
            ownership_claim_approved: {
                label: 'Claim Approved',
                icon: 'check',
                category: 'ownership',
                defaultEnabled: true,
                priority: 'high'
            },
            ownership_claim_denied: {
                label: 'Claim Denied',
                icon: 'x',
                category: 'ownership',
                defaultEnabled: true,
                priority: 'high'
            },
            ownership_transferred: {
                label: 'Ownership Transferred',
                icon: 'transfer',
                category: 'ownership',
                defaultEnabled: true,
                priority: 'high'
            },
            edit_suggested: {
                label: 'Edit Suggested',
                icon: 'edit',
                category: 'content',
                defaultEnabled: true,
                priority: 'medium'
            },
            edit_approved: {
                label: 'Edit Approved',
                icon: 'check',
                category: 'content',
                defaultEnabled: true,
                priority: 'medium'
            },
            edit_rejected: {
                label: 'Edit Rejected',
                icon: 'x',
                category: 'content',
                defaultEnabled: true,
                priority: 'medium'
            },
            comment_reply: {
                label: 'Comment Reply',
                icon: 'comment',
                category: 'social',
                defaultEnabled: true,
                priority: 'medium'
            },
            perspective_reply: {
                label: 'Perspective Reply',
                icon: 'eye',
                category: 'social',
                defaultEnabled: true,
                priority: 'medium'
            },
            mention: {
                label: 'Mention',
                icon: 'at',
                category: 'social',
                defaultEnabled: true,
                priority: 'high'
            },
            badge_earned: {
                label: 'Badge Earned',
                icon: 'badge',
                category: 'achievements',
                defaultEnabled: true,
                priority: 'low'
            },
            asset_flagged: {
                label: 'Asset Flagged',
                icon: 'flag',
                category: 'moderation',
                defaultEnabled: true,
                priority: 'high'
            },
            contribution_milestone: {
                label: 'Contribution Milestone',
                icon: 'milestone',
                category: 'achievements',
                defaultEnabled: true,
                priority: 'low'
            }
        };

        // Notification categories for grouping in preferences
        this.CATEGORIES = {
            ownership: { label: 'Ownership', description: 'Asset ownership claims and transfers' },
            content: { label: 'Content', description: 'Edit suggestions and approvals' },
            social: { label: 'Social', description: 'Comments, replies, and mentions' },
            achievements: { label: 'Achievements', description: 'Badges and milestones' },
            moderation: { label: 'Moderation', description: 'Content flags and reviews' }
        };

        // Default notification retention (30 days)
        this.DEFAULT_RETENTION_DAYS = 30;
    }

    /**
     * Initialize the service
     * @returns {Promise<boolean>}
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('[NotificationService] Firebase not loaded');
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;

            console.log('[NotificationService] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[NotificationService] Initialization error:', error);
            return false;
        }
    }

    /**
     * Get current authenticated user
     * @returns {firebase.User|null}
     */
    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // ==================== NOTIFICATION CREATION ====================

    /**
     * Create a notification for a user
     * @param {string} userId - Target user ID
     * @param {string} type - Notification type
     * @param {Object} data - Notification data
     * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
     */
    async notify(userId, type, data = {}) {
        await this.init();

        // Validate notification type
        const typeConfig = this.NOTIFICATION_TYPES[type];
        if (!typeConfig) {
            return { success: false, error: `Invalid notification type: ${type}` };
        }

        try {
            // Check if user has this notification type enabled
            const preferences = await this.getPreferences(userId);
            if (preferences.enabled && preferences.enabled[type] === false) {
                console.log(`[NotificationService] User ${userId} has disabled ${type} notifications`);
                return { success: true, skipped: true };
            }

            // Build notification document
            const now = firebase.firestore.FieldValue.serverTimestamp();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_RETENTION_DAYS);

            const notification = {
                type,
                title: data.title || typeConfig.label,
                message: data.message || '',
                data: data.data || {},
                read: false,
                createdAt: now,
                expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
                actionUrl: data.actionUrl || null,
                actionLabel: data.actionLabel || null,
                icon: data.icon || typeConfig.icon,
                priority: typeConfig.priority,
                category: typeConfig.category
            };

            // Add to user's notifications subcollection
            const docRef = await this.db
                .collection('notifications')
                .doc(userId)
                .collection('items')
                .add(notification);

            // Clear caches
            this._clearUserCache(userId);

            // Dispatch event for real-time UI updates
            this._dispatchEvent('notification-created', {
                userId,
                notificationId: docRef.id,
                type,
                notification
            });

            console.log(`[NotificationService] Created ${type} notification for user ${userId}`);
            return { success: true, notificationId: docRef.id };
        } catch (error) {
            console.error('[NotificationService] Error creating notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create multiple notifications (batch)
     * @param {Array<{userId: string, type: string, data: Object}>} notifications
     * @returns {Promise<{success: boolean, created: number, errors: Array}>}
     */
    async notifyBatch(notifications) {
        await this.init();

        const results = {
            success: true,
            created: 0,
            errors: []
        };

        // Process in batches of 500 (Firestore limit)
        const batchSize = 500;
        const chunks = [];
        for (let i = 0; i < notifications.length; i += batchSize) {
            chunks.push(notifications.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const batch = this.db.batch();
            const usersToInvalidate = new Set();

            for (const notif of chunk) {
                try {
                    const typeConfig = this.NOTIFICATION_TYPES[notif.type];
                    if (!typeConfig) {
                        results.errors.push({ userId: notif.userId, error: `Invalid type: ${notif.type}` });
                        continue;
                    }

                    const now = firebase.firestore.FieldValue.serverTimestamp();
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_RETENTION_DAYS);

                    const notification = {
                        type: notif.type,
                        title: notif.data?.title || typeConfig.label,
                        message: notif.data?.message || '',
                        data: notif.data?.data || {},
                        read: false,
                        createdAt: now,
                        expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
                        actionUrl: notif.data?.actionUrl || null,
                        actionLabel: notif.data?.actionLabel || null,
                        icon: notif.data?.icon || typeConfig.icon,
                        priority: typeConfig.priority,
                        category: typeConfig.category
                    };

                    const docRef = this.db
                        .collection('notifications')
                        .doc(notif.userId)
                        .collection('items')
                        .doc();

                    batch.set(docRef, notification);
                    usersToInvalidate.add(notif.userId);
                    results.created++;
                } catch (error) {
                    results.errors.push({ userId: notif.userId, error: error.message });
                }
            }

            await batch.commit();

            // Clear caches for affected users
            for (const userId of usersToInvalidate) {
                this._clearUserCache(userId);
            }
        }

        if (results.errors.length > 0) {
            results.success = false;
        }

        return results;
    }

    // ==================== NOTIFICATION RETRIEVAL ====================

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {Object} filters - { read, type, category, limit, startAfter }
     * @returns {Promise<{notifications: Array, lastDoc: any}>}
     */
    async getNotifications(userId, filters = {}) {
        await this.init();

        const {
            read = null, // null = all, true = read only, false = unread only
            type = null,
            category = null,
            limit = 20,
            startAfter = null
        } = filters;

        try {
            let query = this.db
                .collection('notifications')
                .doc(userId)
                .collection('items')
                .orderBy('createdAt', 'desc');

            // Apply filters
            if (read !== null) {
                query = query.where('read', '==', read);
            }

            if (type) {
                query = query.where('type', '==', type);
            }

            if (category) {
                query = query.where('category', '==', category);
            }

            // Pagination
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(limit);

            const snapshot = await query.get();

            const notifications = [];
            let lastDoc = null;

            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...this._convertTimestamps(doc.data())
                });
                lastDoc = doc;
            });

            return { notifications, lastDoc };
        } catch (error) {
            console.error('[NotificationService] Error getting notifications:', error);
            return { notifications: [], lastDoc: null };
        }
    }

    /**
     * Get current user's notifications
     * @param {Object} filters - Filter options
     * @returns {Promise<{notifications: Array, lastDoc: any}>}
     */
    async getMyNotifications(filters = {}) {
        const user = this.getCurrentUser();
        if (!user) {
            return { notifications: [], lastDoc: null };
        }
        return await this.getNotifications(user.uid, filters);
    }

    /**
     * Get a single notification by ID
     * @param {string} userId - User ID
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object|null>}
     */
    async getNotification(userId, notificationId) {
        await this.init();

        try {
            const doc = await this.db
                .collection('notifications')
                .doc(userId)
                .collection('items')
                .doc(notificationId)
                .get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...this._convertTimestamps(doc.data())
            };
        } catch (error) {
            console.error('[NotificationService] Error getting notification:', error);
            return null;
        }
    }

    // ==================== MARK AS READ ====================

    /**
     * Mark a single notification as read
     * @param {string} notificationId - Notification ID
     * @param {string} userId - User ID (optional, uses current user)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async markAsRead(notificationId, userId = null) {
        await this.init();

        const targetUserId = userId || this.getCurrentUser()?.uid;
        if (!targetUserId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await this.db
                .collection('notifications')
                .doc(targetUserId)
                .collection('items')
                .doc(notificationId)
                .update({
                    read: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Clear cache
            this._clearUserCache(targetUserId);

            // Dispatch event
            this._dispatchEvent('notification-read', {
                userId: targetUserId,
                notificationId
            });

            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Error marking as read:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Mark all notifications as read
     * @param {string} userId - User ID (optional, uses current user)
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    async markAllRead(userId = null) {
        await this.init();

        const targetUserId = userId || this.getCurrentUser()?.uid;
        if (!targetUserId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            // Get all unread notifications
            const snapshot = await this.db
                .collection('notifications')
                .doc(targetUserId)
                .collection('items')
                .where('read', '==', false)
                .get();

            if (snapshot.empty) {
                return { success: true, count: 0 };
            }

            // Batch update
            const batchSize = 500;
            const docs = snapshot.docs;
            let count = 0;

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = this.db.batch();
                const chunk = docs.slice(i, i + batchSize);

                for (const doc of chunk) {
                    batch.update(doc.ref, {
                        read: true,
                        readAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    count++;
                }

                await batch.commit();
            }

            // Clear cache
            this._clearUserCache(targetUserId);

            // Dispatch event
            this._dispatchEvent('notifications-all-read', {
                userId: targetUserId,
                count
            });

            return { success: true, count };
        } catch (error) {
            console.error('[NotificationService] Error marking all as read:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== UNREAD COUNT ====================

    /**
     * Get unread notification count for badge display
     * @param {string} userId - User ID (optional, uses current user)
     * @returns {Promise<number>}
     */
    async getUnreadCount(userId = null) {
        await this.init();

        const targetUserId = userId || this.getCurrentUser()?.uid;
        if (!targetUserId) {
            return 0;
        }

        // Check cache
        const cached = this._getFromCache(this.unreadCountCache, targetUserId);
        if (cached !== null) {
            return cached;
        }

        try {
            const snapshot = await this.db
                .collection('notifications')
                .doc(targetUserId)
                .collection('items')
                .where('read', '==', false)
                .get();

            const count = snapshot.size;
            this._setCache(this.unreadCountCache, targetUserId, count);

            return count;
        } catch (error) {
            console.error('[NotificationService] Error getting unread count:', error);
            return 0;
        }
    }

    // ==================== REAL-TIME SUBSCRIPTION ====================

    /**
     * Subscribe to real-time notification updates
     * @param {string} userId - User ID
     * @param {Function} callback - Callback function (notifications, unreadCount)
     * @returns {Function} Unsubscribe function
     */
    subscribeToNotifications(userId, callback) {
        if (!this.initialized) {
            console.warn('[NotificationService] Service not initialized, initializing now...');
            this.init();
        }

        // Unsubscribe from existing subscription for this user
        const existingUnsub = this.unsubscribeFunctions.get(userId);
        if (existingUnsub) {
            existingUnsub();
        }

        // Set up new listener
        const unsubscribe = this.db
            .collection('notifications')
            .doc(userId)
            .collection('items')
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(
                (snapshot) => {
                    const notifications = [];
                    snapshot.forEach(doc => {
                        notifications.push({
                            id: doc.id,
                            ...this._convertTimestamps(doc.data())
                        });
                    });

                    const unreadCount = notifications.length;

                    // Update cache
                    this._setCache(this.unreadCountCache, userId, unreadCount);

                    // Check for new notifications (added)
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            this._dispatchEvent('notification-received', {
                                userId,
                                notification: {
                                    id: change.doc.id,
                                    ...this._convertTimestamps(change.doc.data())
                                }
                            });
                        }
                    });

                    // Call the callback
                    callback(notifications, unreadCount);
                },
                (error) => {
                    console.error('[NotificationService] Subscription error:', error);
                    callback([], 0);
                }
            );

        // Store unsubscribe function
        this.unsubscribeFunctions.set(userId, unsubscribe);
        this.subscriptions.set(userId, { callback, active: true });

        return () => {
            unsubscribe();
            this.unsubscribeFunctions.delete(userId);
            this.subscriptions.delete(userId);
        };
    }

    /**
     * Subscribe to current user's notifications
     * @param {Function} callback - Callback function
     * @returns {Function|null} Unsubscribe function or null if not authenticated
     */
    subscribeToMyNotifications(callback) {
        const user = this.getCurrentUser();
        if (!user) {
            console.warn('[NotificationService] Cannot subscribe: user not authenticated');
            return null;
        }
        return this.subscribeToNotifications(user.uid, callback);
    }

    // ==================== NOTIFICATION PREFERENCES ====================

    /**
     * Get notification preferences for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Preferences object
     */
    async getPreferences(userId) {
        await this.init();

        // Check cache
        const cached = this._getFromCache(this.preferencesCache, userId);
        if (cached) {
            return cached;
        }

        try {
            const doc = await this.db
                .collection('notifications')
                .doc(userId)
                .get();

            let preferences;
            if (doc.exists && doc.data().preferences) {
                preferences = doc.data().preferences;
            } else {
                preferences = this._getDefaultPreferences();
            }

            this._setCache(this.preferencesCache, userId, preferences);
            return preferences;
        } catch (error) {
            console.error('[NotificationService] Error getting preferences:', error);
            return this._getDefaultPreferences();
        }
    }

    /**
     * Get current user's preferences
     * @returns {Promise<Object>}
     */
    async getMyPreferences() {
        const user = this.getCurrentUser();
        if (!user) {
            return this._getDefaultPreferences();
        }
        return await this.getPreferences(user.uid);
    }

    /**
     * Update notification preferences
     * @param {string} userId - User ID
     * @param {Object} updates - Preference updates
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updatePreferences(userId, updates) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user || user.uid !== userId) {
            return { success: false, error: 'Authentication required' };
        }

        try {
            await this.db
                .collection('notifications')
                .doc(userId)
                .set({
                    preferences: updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            // Clear cache
            this.preferencesCache.delete(userId);

            // Dispatch event
            this._dispatchEvent('preferences-updated', { userId, preferences: updates });

            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Error updating preferences:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update current user's preferences
     * @param {Object} updates - Preference updates
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateMyPreferences(updates) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }
        return await this.updatePreferences(user.uid, updates);
    }

    /**
     * Toggle a specific notification type
     * @param {string} type - Notification type
     * @param {boolean} enabled - Whether to enable
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async toggleNotificationType(type, enabled) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!this.NOTIFICATION_TYPES[type]) {
            return { success: false, error: `Invalid notification type: ${type}` };
        }

        const preferences = await this.getMyPreferences();
        const updatedEnabled = { ...preferences.enabled, [type]: enabled };

        return await this.updateMyPreferences({
            ...preferences,
            enabled: updatedEnabled
        });
    }

    /**
     * Get default preferences
     * @private
     * @returns {Object}
     */
    _getDefaultPreferences() {
        const enabled = {};
        for (const [type, config] of Object.entries(this.NOTIFICATION_TYPES)) {
            enabled[type] = config.defaultEnabled;
        }

        return {
            enabled,
            emailEnabled: false,
            emailDigest: 'none', // 'immediate', 'daily', 'weekly', 'none'
            quietHoursStart: null,
            quietHoursEnd: null
        };
    }

    // ==================== NOTIFICATION DELETION ====================

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     * @param {string} userId - User ID (optional, uses current user)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteNotification(notificationId, userId = null) {
        await this.init();

        const targetUserId = userId || this.getCurrentUser()?.uid;
        if (!targetUserId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            await this.db
                .collection('notifications')
                .doc(targetUserId)
                .collection('items')
                .doc(notificationId)
                .delete();

            // Clear cache
            this._clearUserCache(targetUserId);

            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Error deleting notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all notifications for a user
     * @param {string} userId - User ID (optional, uses current user)
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    async clearAllNotifications(userId = null) {
        await this.init();

        const targetUserId = userId || this.getCurrentUser()?.uid;
        if (!targetUserId) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const snapshot = await this.db
                .collection('notifications')
                .doc(targetUserId)
                .collection('items')
                .get();

            if (snapshot.empty) {
                return { success: true, count: 0 };
            }

            // Batch delete
            const batchSize = 500;
            const docs = snapshot.docs;
            let count = 0;

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = this.db.batch();
                const chunk = docs.slice(i, i + batchSize);

                for (const doc of chunk) {
                    batch.delete(doc.ref);
                    count++;
                }

                await batch.commit();
            }

            // Clear cache
            this._clearUserCache(targetUserId);

            return { success: true, count };
        } catch (error) {
            console.error('[NotificationService] Error clearing notifications:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get notification type configuration
     * @param {string} type - Notification type
     * @returns {Object|null}
     */
    getTypeConfig(type) {
        return this.NOTIFICATION_TYPES[type] || null;
    }

    /**
     * Get all notification types
     * @returns {Object}
     */
    getNotificationTypes() {
        return { ...this.NOTIFICATION_TYPES };
    }

    /**
     * Get notification categories
     * @returns {Object}
     */
    getCategories() {
        return { ...this.CATEGORIES };
    }

    /**
     * Get types by category
     * @param {string} category - Category name
     * @returns {Array}
     */
    getTypesByCategory(category) {
        return Object.entries(this.NOTIFICATION_TYPES)
            .filter(([_, config]) => config.category === category)
            .map(([type, config]) => ({ type, ...config }));
    }

    /**
     * Group notifications by date
     * @param {Array} notifications - Notifications array
     * @returns {Object} Grouped notifications { today: [], yesterday: [], earlier: [] }
     */
    groupByDate(notifications) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            earlier: []
        };

        for (const notif of notifications) {
            const notifDate = notif.createdAt instanceof Date
                ? notif.createdAt
                : new Date(notif.createdAt);

            if (notifDate >= today) {
                groups.today.push(notif);
            } else if (notifDate >= yesterday) {
                groups.yesterday.push(notif);
            } else if (notifDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
                groups.thisWeek.push(notif);
            } else {
                groups.earlier.push(notif);
            }
        }

        return groups;
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Dispatch custom event
     * @private
     */
    _dispatchEvent(eventName, detail) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        }
    }

    /**
     * Convert Firestore timestamps to JavaScript Date objects
     * @private
     */
    _convertTimestamps(data) {
        if (!data) return data;

        const converted = { ...data };
        const timestampFields = ['createdAt', 'readAt', 'expiresAt'];

        timestampFields.forEach(field => {
            if (converted[field]?.toDate) {
                converted[field] = converted[field].toDate();
            }
        });

        return converted;
    }

    /**
     * Clear all caches for a user
     * @private
     */
    _clearUserCache(userId) {
        this.notificationCache.delete(userId);
        this.unreadCountCache.delete(userId);
    }

    /**
     * Get from cache
     * @private
     */
    _getFromCache(cache, key) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Set cache value
     * @private
     */
    _setCache(cache, key, data) {
        cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.notificationCache.clear();
        this.preferencesCache.clear();
        this.unreadCountCache.clear();
        console.log('[NotificationService] Cache cleared');
    }

    /**
     * Cleanup resources and subscriptions
     */
    cleanup() {
        // Unsubscribe from all listeners
        for (const [userId, unsubscribe] of this.unsubscribeFunctions) {
            unsubscribe();
        }
        this.unsubscribeFunctions.clear();
        this.subscriptions.clear();

        // Clear caches
        this.clearCache();

        console.log('[NotificationService] Cleanup complete');
    }
}

// Create singleton instance
window.notificationService = window.notificationService || new NotificationService();

// Export class for modules
if (typeof window !== 'undefined') {
    window.NotificationService = NotificationService;
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Create a notification:
 *    await notificationService.notify('userId123', 'badge_earned', {
 *      title: 'New Badge!',
 *      message: 'You earned the "First Edit" badge',
 *      data: { badgeId: 'first_edit', badgeName: 'First Edit' },
 *      actionUrl: '#/profile/badges',
 *      actionLabel: 'View Badge'
 *    });
 *
 * 2. Get notifications with filters:
 *    const { notifications, lastDoc } = await notificationService.getMyNotifications({
 *      read: false,     // Unread only
 *      category: 'social',
 *      limit: 10
 *    });
 *
 * 3. Mark as read:
 *    await notificationService.markAsRead('notificationId123');
 *    await notificationService.markAllRead();
 *
 * 4. Get unread count:
 *    const count = await notificationService.getUnreadCount();
 *    console.log(`You have ${count} unread notifications`);
 *
 * 5. Subscribe to real-time updates:
 *    const unsubscribe = notificationService.subscribeToMyNotifications(
 *      (notifications, unreadCount) => {
 *        console.log(`Unread: ${unreadCount}`, notifications);
 *        updateBadge(unreadCount);
 *      }
 *    );
 *    // Later: unsubscribe();
 *
 * 6. Listen for new notifications:
 *    window.addEventListener('notification-received', (e) => {
 *      const { notification } = e.detail;
 *      showToast(notification.title, notification.message);
 *    });
 *
 * 7. Manage preferences:
 *    const prefs = await notificationService.getMyPreferences();
 *    await notificationService.toggleNotificationType('badge_earned', false);
 *    await notificationService.updateMyPreferences({
 *      ...prefs,
 *      emailDigest: 'daily'
 *    });
 *
 * 8. Group notifications by date:
 *    const { notifications } = await notificationService.getMyNotifications();
 *    const grouped = notificationService.groupByDate(notifications);
 *    console.log('Today:', grouped.today);
 *    console.log('Yesterday:', grouped.yesterday);
 */
