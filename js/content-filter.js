/**
 * Content Filter System
 * Manages user preferences for which user-submitted content to display
 * - Global filter modes: defaults-only, defaults+self, everyone
 * - Per-user blocking
 * - Per-topic/subtopic hiding
 * - Wiki-like experience with community curation
 */

class ContentFilter {
    constructor() {
        this.db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
        this.auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;

        // Default filter settings
        this.defaultSettings = {
            mode: 'defaults-self', // 'defaults-only', 'defaults-self', 'everyone'
            hiddenUsers: [],       // Array of userIds to hide
            hiddenTopics: [],      // Array of topic IDs to hide
            hiddenSubtopics: []    // Array of subtopic IDs to hide
        };

        this.settings = this.loadSettings();
        this.init();
    }

    /**
     * Initialize the content filter system
     */
    init() {
        // Listen for auth state changes
        if (this.auth) {
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.loadUserSettings();
                }
            });
        }

        // Dispatch event when settings change
        this.dispatchFilterChangeEvent();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem('contentFilterSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                return { ...this.defaultSettings, ...settings };
            }
        } catch (error) {
            console.error('Error loading filter settings:', error);
        }
        return { ...this.defaultSettings };
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('contentFilterSettings', JSON.stringify(this.settings));
            this.dispatchFilterChangeEvent();
        } catch (error) {
            console.error('Error saving filter settings:', error);
        }
    }

    /**
     * Load user-specific settings from Firestore (if signed in)
     */
    async loadUserSettings() {
        if (!this.db || !this.auth || !this.auth.currentUser) {
            return;
        }

        try {
            const userId = this.auth.currentUser.uid;
            const doc = await this.db.collection('userSettings').doc(userId).get();

            if (doc.exists) {
                const cloudSettings = doc.data().contentFilter;
                if (cloudSettings) {
                    this.settings = { ...this.defaultSettings, ...cloudSettings };
                    this.saveSettings(); // Sync to localStorage
                }
            }
        } catch (error) {
            console.error('Error loading user settings from cloud:', error);
        }
    }

    /**
     * Save user-specific settings to Firestore (if signed in)
     */
    async saveUserSettings() {
        if (!this.db || !this.auth || !this.auth.currentUser) {
            return;
        }

        try {
            const userId = this.auth.currentUser.uid;
            await this.db.collection('userSettings').doc(userId).set({
                contentFilter: this.settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error saving user settings to cloud:', error);
        }
    }

    /**
     * Get current filter mode
     */
    getMode() {
        return this.settings.mode;
    }

    /**
     * Set filter mode
     * @param {string} mode - 'defaults-only', 'defaults-self', 'everyone'
     */
    setMode(mode) {
        const validModes = ['defaults-only', 'defaults-self', 'everyone'];
        if (!validModes.includes(mode)) {
            console.error('Invalid filter mode:', mode);
            return;
        }

        this.settings.mode = mode;
        this.saveSettings();
        this.saveUserSettings();
    }

    /**
     * Check if a theory/content should be shown
     * @param {Object} theory - Theory object
     * @returns {boolean} - True if should be shown
     */
    shouldShow(theory) {
        if (!theory) return false;

        const currentUserId = this.auth?.currentUser?.uid;
        const isOfficialContent = !theory.userId || theory.official === true;
        const isCurrentUser = theory.userId && theory.userId === currentUserId;

        // Check if user is hidden
        if (theory.userId && this.settings.hiddenUsers.includes(theory.userId)) {
            return false;
        }

        // Check if topic is hidden
        if (theory.userTopic && this.settings.hiddenTopics.includes(theory.userTopic)) {
            return false;
        }

        // Check if subtopic is hidden
        if (theory.userSubtopic && this.settings.hiddenSubtopics.includes(theory.userSubtopic)) {
            return false;
        }

        // Apply mode filter
        switch (this.settings.mode) {
            case 'defaults-only':
                return isOfficialContent;

            case 'defaults-self':
                return isOfficialContent || isCurrentUser;

            case 'everyone':
                return true;

            default:
                return true;
        }
    }

    /**
     * Hide a specific user's content
     * @param {string} userId - User ID to hide
     */
    hideUser(userId) {
        if (!userId) return;
        if (!this.settings.hiddenUsers.includes(userId)) {
            this.settings.hiddenUsers.push(userId);
            this.saveSettings();
            this.saveUserSettings();
        }
    }

    /**
     * Unhide a specific user's content
     * @param {string} userId - User ID to unhide
     */
    unhideUser(userId) {
        if (!userId) return;
        const index = this.settings.hiddenUsers.indexOf(userId);
        if (index > -1) {
            this.settings.hiddenUsers.splice(index, 1);
            this.saveSettings();
            this.saveUserSettings();
        }
    }

    /**
     * Check if a user is hidden
     * @param {string} userId - User ID to check
     * @returns {boolean}
     */
    isUserHidden(userId) {
        return this.settings.hiddenUsers.includes(userId);
    }

    /**
     * Hide a specific topic
     * @param {string} topicId - Topic ID to hide
     */
    hideTopic(topicId) {
        if (!topicId) return;
        if (!this.settings.hiddenTopics.includes(topicId)) {
            this.settings.hiddenTopics.push(topicId);
            this.saveSettings();
            this.saveUserSettings();
        }
    }

    /**
     * Unhide a specific topic
     * @param {string} topicId - Topic ID to unhide
     */
    unhideTopic(topicId) {
        if (!topicId) return;
        const index = this.settings.hiddenTopics.indexOf(topicId);
        if (index > -1) {
            this.settings.hiddenTopics.splice(index, 1);
            this.saveSettings();
            this.saveUserSettings();
        }
    }

    /**
     * Check if a topic is hidden
     * @param {string} topicId - Topic ID to check
     * @returns {boolean}
     */
    isTopicHidden(topicId) {
        return this.settings.hiddenTopics.includes(topicId);
    }

    /**
     * Hide a specific subtopic
     * @param {string} subtopicId - Subtopic ID to hide
     */
    hideSubtopic(subtopicId) {
        if (!subtopicId) return;
        if (!this.settings.hiddenSubtopics.includes(subtopicId)) {
            this.settings.hiddenSubtopics.push(subtopicId);
            this.saveSettings();
            this.saveUserSettings();
        }
    }

    /**
     * Unhide a specific subtopic
     * @param {string} subtopicId - Subtopic ID to unhide
     */
    unhideSubtopic(subtopicId) {
        if (!subtopicId) return;
        const index = this.settings.hiddenSubtopics.indexOf(subtopicId);
        if (index > -1) {
            this.settings.hiddenSubtopics.splice(index, 1);
            this.saveSettings();
            this.saveUserSettings();
        }
    }

    /**
     * Check if a subtopic is hidden
     * @param {string} subtopicId - Subtopic ID to check
     * @returns {boolean}
     */
    isSubtopicHidden(subtopicId) {
        return this.settings.hiddenSubtopics.includes(subtopicId);
    }

    /**
     * Get all hidden users
     * @returns {Array}
     */
    getHiddenUsers() {
        return [...this.settings.hiddenUsers];
    }

    /**
     * Get all hidden topics
     * @returns {Array}
     */
    getHiddenTopics() {
        return [...this.settings.hiddenTopics];
    }

    /**
     * Get all hidden subtopics
     * @returns {Array}
     */
    getHiddenSubtopics() {
        return [...this.settings.hiddenSubtopics];
    }

    /**
     * Clear all hidden items
     */
    clearAllHidden() {
        this.settings.hiddenUsers = [];
        this.settings.hiddenTopics = [];
        this.settings.hiddenSubtopics = [];
        this.saveSettings();
        this.saveUserSettings();
    }

    /**
     * Get filter statistics
     * @returns {Object}
     */
    getStats() {
        return {
            mode: this.settings.mode,
            hiddenUsersCount: this.settings.hiddenUsers.length,
            hiddenTopicsCount: this.settings.hiddenTopics.length,
            hiddenSubtopicsCount: this.settings.hiddenSubtopics.length
        };
    }

    /**
     * Dispatch custom event when filter settings change
     */
    dispatchFilterChangeEvent() {
        const event = new CustomEvent('contentFilterChanged', {
            detail: {
                mode: this.settings.mode,
                stats: this.getStats()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get user-friendly mode label
     * @param {string} mode - Mode to get label for
     * @returns {string}
     */
    getModeLabel(mode = this.settings.mode) {
        const labels = {
            'defaults-only': '🏛️ Official Content Only',
            'defaults-self': '🏛️ + 👤 Official + My Content',
            'everyone': '🌍 Everyone\'s Content'
        };
        return labels[mode] || mode;
    }

    /**
     * Get user-friendly mode description
     * @param {string} mode - Mode to get description for
     * @returns {string}
     */
    getModeDescription(mode = this.settings.mode) {
        const descriptions = {
            'defaults-only': 'Show only official Eyes of Azrael content. User submissions are hidden.',
            'defaults-self': 'Show official content plus your own submissions. Other users\' content is hidden.',
            'everyone': 'Show all content from all users. Full wiki experience.'
        };
        return descriptions[mode] || '';
    }
}

// Create global instance
window.contentFilter = new ContentFilter();
