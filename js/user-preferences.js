/**
 * User Preferences System
 * Manages user preferences stored in Firebase Firestore
 * Handles blocking, filtering, display settings, and notifications
 *
 * Features:
 * - Block users, topics, categories, mythologies
 * - Hide specific submissions and theories
 * - Display preferences (theme, layout, grid size)
 * - Content filtering (show/hide user content)
 * - Notification preferences
 * - Privacy settings
 * - Bookmarks and recently viewed
 *
 * Usage:
 *   const prefs = new UserPreferences();
 *   await prefs.loadPreferences(userId);
 *   prefs.blockUser('spamUserId');
 *   await prefs.savePreferences();
 *   const filtered = prefs.applyFilters(entities);
 */

class UserPreferences {
    constructor() {
        this.userId = null;
        this.preferences = this.getDefaultPreferences();
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        this.unsavedChanges = false;
        this.db = firebase.firestore();
    }

    /**
     * Get default preferences structure
     */
    getDefaultPreferences() {
        return {
            userId: null,
            blockedUsers: [],
            blockedTopics: [],
            blockedCategories: [],
            blockedMythologies: [],
            hiddenSubmissions: [],
            hiddenTheories: [],
            displayPreferences: {
                theme: 'auto',
                layout: 'grid',
                gridSize: 'medium',
                itemsPerPage: 24,
                showImages: true,
                showIcons: true,
                compactMode: false,
                animationsEnabled: true
            },
            contentFilters: {
                showUserContent: false, // Default: OFF - show only standard content
                showTheories: true,
                showSubmissions: true,
                showApprovedOnly: false,
                hideControversial: false,
                minVoteScore: -10
            },
            notificationPreferences: {
                emailNotifications: true,
                notifyOnTheoryComment: true,
                notifyOnSubmissionUpdate: true,
                notifyOnVote: false,
                notifyOnMention: true,
                notifyOnReply: true,
                digestFrequency: 'weekly'
            },
            privacySettings: {
                profileVisibility: 'public',
                showEmail: false,
                showTheories: true,
                showVotes: false,
                allowMessages: true,
                analyticsOptOut: false
            },
            searchPreferences: {
                defaultSearchScope: ['deities', 'heroes', 'creatures', 'places', 'items', 'concepts', 'magic', 'theories'],
                searchHistory: true,
                autoComplete: true
            },
            bookmarks: [],
            recentlyViewed: [],
            version: 1
        };
    }

    /**
     * Load user preferences from Firestore
     * Uses cache to minimize reads
     * @param {string} userId - Firebase Auth UID
     * @returns {Promise<Object>} Preferences object
     */
    async loadPreferences(userId) {
        if (!userId) {
            console.error('UserPreferences: No userId provided');
            return this.preferences;
        }

        this.userId = userId;

        // Check cache first
        if (this.cache && this.cacheTimestamp &&
            (Date.now() - this.cacheTimestamp) < this.cacheDuration &&
            this.cache.userId === userId) {
            this.preferences = this.cache;
            return this.preferences;
        }

        try {
            const doc = await this.db.collection('user_preferences').doc(userId).get();

            if (doc.exists) {
                // Merge with defaults to ensure all fields exist
                this.preferences = this.mergeWithDefaults(doc.data());
                this.preferences.userId = userId;
            } else {
                // Create new preferences document
                this.preferences = this.getDefaultPreferences();
                this.preferences.userId = userId;
                this.preferences.createdAt = new Date().toISOString();
                this.preferences.updatedAt = new Date().toISOString();
                await this.savePreferences();
            }

            // Update cache
            this.cache = { ...this.preferences };
            this.cacheTimestamp = Date.now();
            this.unsavedChanges = false;

            return this.preferences;

        } catch (error) {
            console.error('Error loading preferences:', error);
            // Return defaults on error
            return this.getDefaultPreferences();
        }
    }

    /**
     * Save preferences to Firestore
     * @returns {Promise<boolean>} Success status
     */
    async savePreferences() {
        if (!this.userId) {
            console.error('UserPreferences: Cannot save - no userId');
            return false;
        }

        try {
            this.preferences.updatedAt = new Date().toISOString();

            await this.db.collection('user_preferences').doc(this.userId).set(this.preferences, { merge: true });

            // Update cache
            this.cache = { ...this.preferences };
            this.cacheTimestamp = Date.now();
            this.unsavedChanges = false;

            return true;

        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    }

    /**
     * Merge loaded data with defaults to ensure all fields exist
     */
    mergeWithDefaults(data) {
        const defaults = this.getDefaultPreferences();
        return {
            ...defaults,
            ...data,
            displayPreferences: { ...defaults.displayPreferences, ...(data.displayPreferences || {}) },
            contentFilters: { ...defaults.contentFilters, ...(data.contentFilters || {}) },
            notificationPreferences: { ...defaults.notificationPreferences, ...(data.notificationPreferences || {}) },
            privacySettings: { ...defaults.privacySettings, ...(data.privacySettings || {}) },
            searchPreferences: { ...defaults.searchPreferences, ...(data.searchPreferences || {}) }
        };
    }

    // ===== BLOCKING METHODS =====

    /**
     * Block a user
     * @param {string} userId - User ID to block
     */
    blockUser(userId) {
        if (!this.preferences.blockedUsers.includes(userId)) {
            this.preferences.blockedUsers.push(userId);
            this.unsavedChanges = true;
        }
    }

    /**
     * Unblock a user
     * @param {string} userId - User ID to unblock
     */
    unblockUser(userId) {
        const index = this.preferences.blockedUsers.indexOf(userId);
        if (index > -1) {
            this.preferences.blockedUsers.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    /**
     * Check if user is blocked
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isUserBlocked(userId) {
        return this.preferences.blockedUsers.includes(userId);
    }

    /**
     * Block a topic/tag
     * @param {string} topic - Topic to block
     */
    blockTopic(topic) {
        const normalizedTopic = topic.toLowerCase().trim();
        if (!this.preferences.blockedTopics.includes(normalizedTopic)) {
            this.preferences.blockedTopics.push(normalizedTopic);
            this.unsavedChanges = true;
        }
    }

    /**
     * Unblock a topic/tag
     * @param {string} topic - Topic to unblock
     */
    unblockTopic(topic) {
        const normalizedTopic = topic.toLowerCase().trim();
        const index = this.preferences.blockedTopics.indexOf(normalizedTopic);
        if (index > -1) {
            this.preferences.blockedTopics.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    /**
     * Check if topic is blocked
     * @param {string} topic - Topic to check
     * @returns {boolean}
     */
    isTopicBlocked(topic) {
        const normalizedTopic = topic.toLowerCase().trim();
        return this.preferences.blockedTopics.includes(normalizedTopic);
    }

    /**
     * Block a category (entity type)
     * @param {string} category - Category to block
     */
    blockCategory(category) {
        if (!this.preferences.blockedCategories.includes(category)) {
            this.preferences.blockedCategories.push(category);
            this.unsavedChanges = true;
        }
    }

    /**
     * Unblock a category
     * @param {string} category - Category to unblock
     */
    unblockCategory(category) {
        const index = this.preferences.blockedCategories.indexOf(category);
        if (index > -1) {
            this.preferences.blockedCategories.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    /**
     * Check if category is blocked
     * @param {string} category - Category to check
     * @returns {boolean}
     */
    isCategoryBlocked(category) {
        return this.preferences.blockedCategories.includes(category);
    }

    /**
     * Block a mythology
     * @param {string} mythology - Mythology to block
     */
    blockMythology(mythology) {
        if (!this.preferences.blockedMythologies.includes(mythology)) {
            this.preferences.blockedMythologies.push(mythology);
            this.unsavedChanges = true;
        }
    }

    /**
     * Unblock a mythology
     * @param {string} mythology - Mythology to unblock
     */
    unblockMythology(mythology) {
        const index = this.preferences.blockedMythologies.indexOf(mythology);
        if (index > -1) {
            this.preferences.blockedMythologies.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    /**
     * Check if mythology is blocked
     * @param {string} mythology - Mythology to check
     * @returns {boolean}
     */
    isMythologyBlocked(mythology) {
        return this.preferences.blockedMythologies.includes(mythology);
    }

    /**
     * Hide a submission
     * @param {string} submissionId - Submission ID to hide
     */
    hideSubmission(submissionId) {
        if (!this.preferences.hiddenSubmissions.includes(submissionId)) {
            this.preferences.hiddenSubmissions.push(submissionId);
            this.unsavedChanges = true;
        }
    }

    /**
     * Unhide a submission
     * @param {string} submissionId - Submission ID to unhide
     */
    unhideSubmission(submissionId) {
        const index = this.preferences.hiddenSubmissions.indexOf(submissionId);
        if (index > -1) {
            this.preferences.hiddenSubmissions.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    /**
     * Hide a theory
     * @param {string} theoryId - Theory ID to hide
     */
    hideTheory(theoryId) {
        if (!this.preferences.hiddenTheories.includes(theoryId)) {
            this.preferences.hiddenTheories.push(theoryId);
            this.unsavedChanges = true;
        }
    }

    /**
     * Unhide a theory
     * @param {string} theoryId - Theory ID to unhide
     */
    unhideTheory(theoryId) {
        const index = this.preferences.hiddenTheories.indexOf(theoryId);
        if (index > -1) {
            this.preferences.hiddenTheories.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    // ===== FILTERING METHODS =====

    /**
     * Check if an entity should be blocked based on preferences
     * @param {Object} entity - Entity object to check
     * @returns {boolean} True if entity should be blocked
     */
    isContentBlocked(entity) {
        if (!entity) return false;

        // Check blocked user
        if (entity.authorId && this.isUserBlocked(entity.authorId)) {
            return true;
        }
        if (entity.submittedBy && this.isUserBlocked(entity.submittedBy)) {
            return true;
        }
        if (entity.contributedBy && this.isUserBlocked(entity.contributedBy)) {
            return true;
        }

        // Check blocked category/type
        if (entity.type && this.isCategoryBlocked(entity.type)) {
            return true;
        }

        // Check blocked mythology
        if (entity.mythology && this.isMythologyBlocked(entity.mythology)) {
            return true;
        }
        if (entity.primaryMythology && this.isMythologyBlocked(entity.primaryMythology)) {
            return true;
        }
        if (entity.mythologies && Array.isArray(entity.mythologies)) {
            if (entity.mythologies.some(m => this.isMythologyBlocked(m))) {
                return true;
            }
        }

        // Check blocked topics/tags
        if (entity.tags && Array.isArray(entity.tags)) {
            if (entity.tags.some(tag => this.isTopicBlocked(tag))) {
                return true;
            }
        }
        if (entity.topics && Array.isArray(entity.topics)) {
            if (entity.topics.some(topic => this.isTopicBlocked(topic))) {
                return true;
            }
        }

        // Check hidden submissions
        if (entity.id && this.preferences.hiddenSubmissions.includes(entity.id)) {
            return true;
        }

        // Check hidden theories
        if (entity.id && this.preferences.hiddenTheories.includes(entity.id)) {
            return true;
        }

        // Check content filters
        const { contentFilters } = this.preferences;

        // Show approved only
        if (contentFilters.showApprovedOnly && entity.status !== 'approved' && entity.status !== 'published') {
            return true;
        }

        // Hide user content
        if (!contentFilters.showUserContent && (entity.authorId || entity.submittedBy || entity.contributedBy)) {
            return true;
        }

        // Hide theories
        if (!contentFilters.showTheories && entity.type === 'user_theory') {
            return true;
        }

        // Hide submissions
        if (!contentFilters.showSubmissions && entity.type === 'submission') {
            return true;
        }

        // Hide controversial
        if (contentFilters.hideControversial && entity.controversial) {
            return true;
        }

        // Check minimum vote score
        if (entity.voteScore !== undefined && entity.voteScore < contentFilters.minVoteScore) {
            return true;
        }

        return false;
    }

    /**
     * Apply filters to an array of entities
     * @param {Array} entities - Array of entities to filter
     * @returns {Array} Filtered array
     */
    applyFilters(entities) {
        if (!Array.isArray(entities)) {
            return entities;
        }

        return entities.filter(entity => !this.isContentBlocked(entity));
    }

    // ===== DISPLAY PREFERENCES =====

    /**
     * Update display preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    setDisplayPreference(key, value) {
        if (this.preferences.displayPreferences.hasOwnProperty(key)) {
            this.preferences.displayPreferences[key] = value;
            this.unsavedChanges = true;
        }
    }

    /**
     * Get display preference
     * @param {string} key - Preference key
     * @returns {*} Preference value
     */
    getDisplayPreference(key) {
        return this.preferences.displayPreferences[key];
    }

    /**
     * Update content filter
     * @param {string} key - Filter key
     * @param {*} value - Filter value
     */
    setContentFilter(key, value) {
        if (this.preferences.contentFilters.hasOwnProperty(key)) {
            this.preferences.contentFilters[key] = value;
            this.unsavedChanges = true;
        }
    }

    /**
     * Get content filter
     * @param {string} key - Filter key
     * @returns {*} Filter value
     */
    getContentFilter(key) {
        return this.preferences.contentFilters[key];
    }

    /**
     * Update notification preference
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    setNotificationPreference(key, value) {
        if (this.preferences.notificationPreferences.hasOwnProperty(key)) {
            this.preferences.notificationPreferences[key] = value;
            this.unsavedChanges = true;
        }
    }

    /**
     * Get notification preference
     * @param {string} key - Preference key
     * @returns {*} Preference value
     */
    getNotificationPreference(key) {
        return this.preferences.notificationPreferences[key];
    }

    /**
     * Update privacy setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    setPrivacySetting(key, value) {
        if (this.preferences.privacySettings.hasOwnProperty(key)) {
            this.preferences.privacySettings[key] = value;
            this.unsavedChanges = true;
        }
    }

    /**
     * Get privacy setting
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    getPrivacySetting(key) {
        return this.preferences.privacySettings[key];
    }

    // ===== BOOKMARKS & RECENTLY VIEWED =====

    /**
     * Add bookmark
     * @param {string} id - Entity ID
     * @param {string} type - Entity type
     */
    addBookmark(id, type) {
        const exists = this.preferences.bookmarks.find(b => b.id === id && b.type === type);
        if (!exists) {
            this.preferences.bookmarks.push({
                id,
                type,
                addedAt: new Date().toISOString()
            });
            this.unsavedChanges = true;
        }
    }

    /**
     * Remove bookmark
     * @param {string} id - Entity ID
     * @param {string} type - Entity type
     */
    removeBookmark(id, type) {
        const index = this.preferences.bookmarks.findIndex(b => b.id === id && b.type === type);
        if (index > -1) {
            this.preferences.bookmarks.splice(index, 1);
            this.unsavedChanges = true;
        }
    }

    /**
     * Check if entity is bookmarked
     * @param {string} id - Entity ID
     * @param {string} type - Entity type
     * @returns {boolean}
     */
    isBookmarked(id, type) {
        return this.preferences.bookmarks.some(b => b.id === id && b.type === type);
    }

    /**
     * Add to recently viewed (max 50)
     * @param {string} id - Entity ID
     * @param {string} type - Entity type
     */
    addRecentlyViewed(id, type) {
        // Remove if already exists
        const index = this.preferences.recentlyViewed.findIndex(r => r.id === id && r.type === type);
        if (index > -1) {
            this.preferences.recentlyViewed.splice(index, 1);
        }

        // Add to front
        this.preferences.recentlyViewed.unshift({
            id,
            type,
            viewedAt: new Date().toISOString()
        });

        // Keep only 50 most recent
        if (this.preferences.recentlyViewed.length > 50) {
            this.preferences.recentlyViewed = this.preferences.recentlyViewed.slice(0, 50);
        }

        this.unsavedChanges = true;
    }

    /**
     * Get recently viewed entities
     * @param {number} limit - Max number to return
     * @returns {Array}
     */
    getRecentlyViewed(limit = 10) {
        return this.preferences.recentlyViewed.slice(0, limit);
    }

    /**
     * Clear recently viewed
     */
    clearRecentlyViewed() {
        this.preferences.recentlyViewed = [];
        this.unsavedChanges = true;
    }

    // ===== UTILITY METHODS =====

    /**
     * Check if there are unsaved changes
     * @returns {boolean}
     */
    hasUnsavedChanges() {
        return this.unsavedChanges;
    }

    /**
     * Reset preferences to defaults
     */
    resetToDefaults() {
        this.preferences = this.getDefaultPreferences();
        this.preferences.userId = this.userId;
        this.unsavedChanges = true;
    }

    /**
     * Export preferences as JSON
     * @returns {string} JSON string
     */
    exportPreferences() {
        return JSON.stringify(this.preferences, null, 2);
    }

    /**
     * Import preferences from JSON
     * @param {string} json - JSON string
     * @returns {boolean} Success status
     */
    importPreferences(json) {
        try {
            const imported = JSON.parse(json);
            this.preferences = this.mergeWithDefaults(imported);
            this.preferences.userId = this.userId;
            this.unsavedChanges = true;
            return true;
        } catch (error) {
            console.error('Error importing preferences:', error);
            return false;
        }
    }

    /**
     * Get statistics about blocked content
     * @returns {Object} Statistics object
     */
    getBlockingStats() {
        return {
            blockedUsers: this.preferences.blockedUsers.length,
            blockedTopics: this.preferences.blockedTopics.length,
            blockedCategories: this.preferences.blockedCategories.length,
            blockedMythologies: this.preferences.blockedMythologies.length,
            hiddenSubmissions: this.preferences.hiddenSubmissions.length,
            hiddenTheories: this.preferences.hiddenTheories.length,
            bookmarks: this.preferences.bookmarks.length,
            recentlyViewed: this.preferences.recentlyViewed.length
        };
    }

    /**
     * Apply theme preference to document
     */
    applyTheme() {
        const theme = this.preferences.displayPreferences.theme;

        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    /**
     * Apply display preferences to UI
     */
    applyDisplayPreferences() {
        this.applyTheme();

        // Apply animations setting
        if (!this.preferences.displayPreferences.animationsEnabled) {
            document.documentElement.style.setProperty('--animation-duration', '0ms');
        } else {
            document.documentElement.style.removeProperty('--animation-duration');
        }

        // Dispatch event for other components to respond
        window.dispatchEvent(new CustomEvent('preferencesApplied', {
            detail: this.preferences
        }));
    }
}

// Create global instance
window.userPreferences = new UserPreferences();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPreferences;
}
