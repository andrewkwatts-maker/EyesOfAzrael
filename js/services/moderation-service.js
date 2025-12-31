/**
 * Content Moderation Service
 * Provides functionality for admin users to moderate user content:
 * - Ban/unban users (hide their contributions)
 * - Flag content for review
 * - View moderation history
 *
 * @requires Firebase Firestore
 */

class ModerationService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isAdmin = false;
        this.adminEmail = 'andrewkwatts@gmail.com';
        this.initialized = false;
    }

    /**
     * Initialize the moderation service
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async init() {
        if (this.initialized) return true;

        try {
            // Wait for Firebase to be available
            if (typeof firebase === 'undefined') {
                console.error('[ModerationService] Firebase not loaded');
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // Listen for auth state changes to update admin status
            this.auth.onAuthStateChanged((user) => {
                this.isAdmin = this.checkAdminStatus(user);
                window.dispatchEvent(new CustomEvent('adminStatusChanged', {
                    detail: { isAdmin: this.isAdmin }
                }));
            });

            this.initialized = true;
            console.log('[ModerationService] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[ModerationService] Initialization error:', error);
            return false;
        }
    }

    /**
     * Check if the current user is an admin
     * @param {firebase.User|null} user - Firebase user object
     * @returns {boolean}
     */
    checkAdminStatus(user) {
        if (!user) return false;
        return user.email === this.adminEmail;
    }

    /**
     * Check if current user is admin
     * @returns {boolean}
     */
    isUserAdmin() {
        const user = this.auth?.currentUser;
        return this.checkAdminStatus(user);
    }

    /**
     * Get current admin status (async version that ensures fresh state)
     * @returns {Promise<boolean>}
     */
    async getAdminStatus() {
        return new Promise((resolve) => {
            const user = this.auth?.currentUser;
            if (user) {
                resolve(this.checkAdminStatus(user));
            } else {
                // Wait briefly for auth state to settle
                const unsubscribe = this.auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(this.checkAdminStatus(user));
                });
            }
        });
    }

    // ===== USER BAN/UNBAN FUNCTIONALITY =====

    /**
     * Ban a user - hide all their content
     * @param {string} userId - User ID to ban
     * @param {string} reason - Reason for the ban
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async banUser(userId, reason = '') {
        if (!this.isUserAdmin()) {
            return { success: false, error: 'Admin access required' };
        }

        try {
            const banData = {
                userId,
                bannedBy: this.auth.currentUser.uid,
                bannedByEmail: this.auth.currentUser.email,
                reason,
                bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            };

            // Add to banned users collection
            await this.db.collection('moderation_bans').doc(userId).set(banData);

            // Log the action
            await this.logModerationAction('ban_user', {
                targetUserId: userId,
                reason
            });

            console.log(`[ModerationService] User ${userId} banned`);
            return { success: true };
        } catch (error) {
            console.error('[ModerationService] Error banning user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unban a user - restore visibility of their content
     * @param {string} userId - User ID to unban
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async unbanUser(userId) {
        if (!this.isUserAdmin()) {
            return { success: false, error: 'Admin access required' };
        }

        try {
            // Update ban status to lifted
            await this.db.collection('moderation_bans').doc(userId).update({
                status: 'lifted',
                unbannedBy: this.auth.currentUser.uid,
                unbannedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Log the action
            await this.logModerationAction('unban_user', {
                targetUserId: userId
            });

            console.log(`[ModerationService] User ${userId} unbanned`);
            return { success: true };
        } catch (error) {
            console.error('[ModerationService] Error unbanning user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if a user is banned
     * @param {string} userId - User ID to check
     * @returns {Promise<boolean>}
     */
    async isUserBanned(userId) {
        try {
            const banDoc = await this.db.collection('moderation_bans').doc(userId).get();
            if (!banDoc.exists) return false;
            return banDoc.data().status === 'active';
        } catch (error) {
            console.error('[ModerationService] Error checking ban status:', error);
            return false;
        }
    }

    /**
     * Get all banned users
     * @returns {Promise<Array>}
     */
    async getBannedUsers() {
        if (!this.isUserAdmin()) {
            return [];
        }

        try {
            const snapshot = await this.db.collection('moderation_bans')
                .where('status', '==', 'active')
                .orderBy('bannedAt', 'desc')
                .get();

            const bannedUsers = [];
            for (const doc of snapshot.docs) {
                const banData = doc.data();
                // Try to get user display info
                let userInfo = null;
                try {
                    const userDoc = await this.db.collection('users').doc(doc.id).get();
                    if (userDoc.exists) {
                        userInfo = userDoc.data();
                    }
                } catch (e) {
                    // User doc may not exist
                }

                bannedUsers.push({
                    id: doc.id,
                    ...banData,
                    userDisplayName: userInfo?.displayName || 'Unknown User',
                    userEmail: userInfo?.email || 'Unknown Email'
                });
            }

            return bannedUsers;
        } catch (error) {
            console.error('[ModerationService] Error fetching banned users:', error);
            return [];
        }
    }

    // ===== CONTENT FLAGGING FUNCTIONALITY =====

    /**
     * Flag content for review
     * @param {string} contentType - Type of content (e.g., 'submission', 'comment', 'theory')
     * @param {string} contentId - ID of the content
     * @param {string} reason - Reason for flagging
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async flagContent(contentType, contentId, reason, metadata = {}) {
        if (!this.isUserAdmin()) {
            return { success: false, error: 'Admin access required' };
        }

        try {
            const flagData = {
                contentType,
                contentId,
                reason,
                metadata,
                flaggedBy: this.auth.currentUser.uid,
                flaggedByEmail: this.auth.currentUser.email,
                flaggedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending', // pending, reviewed, resolved, dismissed
                resolution: null
            };

            const flagRef = await this.db.collection('moderation_flags').add(flagData);

            // Log the action
            await this.logModerationAction('flag_content', {
                contentType,
                contentId,
                reason,
                flagId: flagRef.id
            });

            console.log(`[ModerationService] Content flagged: ${contentType}/${contentId}`);
            return { success: true, flagId: flagRef.id };
        } catch (error) {
            console.error('[ModerationService] Error flagging content:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Resolve a content flag
     * @param {string} flagId - ID of the flag
     * @param {string} resolution - Resolution (e.g., 'removed', 'approved', 'dismissed')
     * @param {string} notes - Resolution notes
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async resolveFlag(flagId, resolution, notes = '') {
        if (!this.isUserAdmin()) {
            return { success: false, error: 'Admin access required' };
        }

        try {
            await this.db.collection('moderation_flags').doc(flagId).update({
                status: 'resolved',
                resolution,
                resolutionNotes: notes,
                resolvedBy: this.auth.currentUser.uid,
                resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Log the action
            await this.logModerationAction('resolve_flag', {
                flagId,
                resolution,
                notes
            });

            console.log(`[ModerationService] Flag ${flagId} resolved: ${resolution}`);
            return { success: true };
        } catch (error) {
            console.error('[ModerationService] Error resolving flag:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get pending flags
     * @param {string} status - Filter by status ('pending', 'resolved', 'all')
     * @returns {Promise<Array>}
     */
    async getFlags(status = 'pending') {
        if (!this.isUserAdmin()) {
            return [];
        }

        try {
            let query = this.db.collection('moderation_flags');

            if (status !== 'all') {
                query = query.where('status', '==', status);
            }

            query = query.orderBy('flaggedAt', 'desc').limit(100);

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('[ModerationService] Error fetching flags:', error);
            return [];
        }
    }

    // ===== MODERATION HISTORY =====

    /**
     * Log a moderation action
     * @param {string} action - Action type
     * @param {Object} details - Action details
     * @returns {Promise<void>}
     */
    async logModerationAction(action, details = {}) {
        try {
            await this.db.collection('moderation_history').add({
                action,
                details,
                performedBy: this.auth.currentUser?.uid || 'system',
                performedByEmail: this.auth.currentUser?.email || 'system',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('[ModerationService] Error logging action:', error);
        }
    }

    /**
     * Get moderation history
     * @param {number} limit - Number of records to fetch
     * @returns {Promise<Array>}
     */
    async getModerationHistory(limit = 50) {
        if (!this.isUserAdmin()) {
            return [];
        }

        try {
            const snapshot = await this.db.collection('moderation_history')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('[ModerationService] Error fetching history:', error);
            return [];
        }
    }

    /**
     * Get moderation statistics
     * @returns {Promise<Object>}
     */
    async getModerationStats() {
        if (!this.isUserAdmin()) {
            return null;
        }

        try {
            const [bannedSnapshot, pendingFlagsSnapshot, resolvedFlagsSnapshot] = await Promise.all([
                this.db.collection('moderation_bans')
                    .where('status', '==', 'active')
                    .get(),
                this.db.collection('moderation_flags')
                    .where('status', '==', 'pending')
                    .get(),
                this.db.collection('moderation_flags')
                    .where('status', '==', 'resolved')
                    .get()
            ]);

            return {
                activeBans: bannedSnapshot.size,
                pendingFlags: pendingFlagsSnapshot.size,
                resolvedFlags: resolvedFlagsSnapshot.size,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('[ModerationService] Error fetching stats:', error);
            return null;
        }
    }

    // ===== CONTENT VISIBILITY =====

    /**
     * Check if content should be hidden (author is banned)
     * @param {string} authorId - Author's user ID
     * @returns {Promise<boolean>}
     */
    async shouldHideContent(authorId) {
        return await this.isUserBanned(authorId);
    }

    /**
     * Filter out content from banned users
     * @param {Array} contentList - List of content items
     * @param {string} authorIdField - Field name containing author ID
     * @returns {Promise<Array>}
     */
    async filterBannedContent(contentList, authorIdField = 'authorId') {
        const bannedUsers = new Set();

        // Get all active bans
        try {
            const snapshot = await this.db.collection('moderation_bans')
                .where('status', '==', 'active')
                .get();

            snapshot.docs.forEach(doc => bannedUsers.add(doc.id));
        } catch (error) {
            console.error('[ModerationService] Error fetching bans for filtering:', error);
            return contentList; // Return unfiltered on error
        }

        // Filter content
        return contentList.filter(item => {
            const authorId = item[authorIdField];
            return !bannedUsers.has(authorId);
        });
    }
}

// Create global instance
window.moderationService = new ModerationService();

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.apps?.length > 0) {
    window.moderationService.init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                window.moderationService.init();
            }
        }, 500);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModerationService;
}
