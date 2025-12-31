/**
 * User Preferences Service
 * Simplified interface for accessing user preferences
 * Wraps the global UserPreferences class
 *
 * Usage:
 *   import { UserPreferencesService } from './user-preferences-service.js';
 *   const prefs = new UserPreferencesService();
 *   await prefs.init();
 *   const showUserContent = prefs.shouldShowUserContent();
 */

class UserPreferencesService {
    constructor() {
        this.prefs = window.userPreferences || new UserPreferences();
        this.userId = null;
        this.initialized = false;
    }

    /**
     * Initialize service with current user
     */
    async init() {
        const auth = firebase.auth();
        const user = auth.currentUser;

        if (user) {
            this.userId = user.uid;
            await this.prefs.loadPreferences(user.uid);
        } else {
            // Use defaults for anonymous users
            this.prefs.preferences = this.prefs.getDefaultPreferences();
        }

        this.initialized = true;

        // Listen for auth changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.userId = user.uid;
                await this.prefs.loadPreferences(user.uid);
            } else {
                this.userId = null;
                this.prefs.preferences = this.prefs.getDefaultPreferences();
            }
        });
    }

    /**
     * Check if user content should be shown
     * Falls back to localStorage for anonymous users
     */
    shouldShowUserContent() {
        if (this.userId) {
            return this.prefs.getContentFilter('showUserContent');
        } else {
            // Anonymous user - check localStorage
            const saved = localStorage.getItem('showUserContent');
            return saved === 'true'; // Default: false
        }
    }

    /**
     * Set user content visibility preference
     */
    async setShowUserContent(value) {
        if (this.userId) {
            this.prefs.setContentFilter('showUserContent', value);
            await this.prefs.savePreferences();
        } else {
            // Anonymous user - save to localStorage
            localStorage.setItem('showUserContent', value);
        }
    }

    /**
     * Get all content filters
     */
    getContentFilters() {
        return this.prefs.preferences.contentFilters;
    }

    /**
     * Get specific content filter
     */
    getContentFilter(key) {
        return this.prefs.getContentFilter(key);
    }

    /**
     * Set content filter
     */
    async setContentFilter(key, value) {
        this.prefs.setContentFilter(key, value);

        if (this.userId) {
            await this.prefs.savePreferences();
        }
    }

    /**
     * Get display preferences
     */
    getDisplayPreferences() {
        return this.prefs.preferences.displayPreferences;
    }

    /**
     * Get specific display preference
     */
    getDisplayPreference(key) {
        return this.prefs.getDisplayPreference(key);
    }

    /**
     * Set display preference
     */
    async setDisplayPreference(key, value) {
        this.prefs.setDisplayPreference(key, value);

        if (this.userId) {
            await this.prefs.savePreferences();
        }
    }

    /**
     * Apply filters to entities
     */
    applyFilters(entities) {
        return this.prefs.applyFilters(entities);
    }

    /**
     * Check if entity should be blocked
     */
    isContentBlocked(entity) {
        return this.prefs.isContentBlocked(entity);
    }

    /**
     * Get user preferences instance
     */
    getPreferences() {
        return this.prefs;
    }
}

// Global export for browser usage
if (typeof window !== 'undefined') {
    window.UserPreferencesService = UserPreferencesService;
}

// CommonJS export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPreferencesService;
}
