/**
 * Content Filter Component
 * Manages the toggle for showing/hiding community-contributed content
 *
 * Features:
 * - Toggle standard/community content visibility
 * - Sync preferences with Firestore (authenticated) or localStorage (anonymous)
 * - Display community content count badge
 * - Info modal explaining community content
 * - Real-time query updates when toggled
 *
 * Usage:
 *   const filter = new ContentFilter({
 *     container: document.getElementById('filterContainer'),
 *     category: 'deities',
 *     mythology: 'greek',
 *     onToggle: async (showUserContent) => { ... }
 *   });
 */

class ContentFilter {
    constructor(options = {}) {
        this.container = options.container;
        this.category = options.category || 'deities';
        this.mythology = options.mythology || null;
        this.onToggle = options.onToggle || null;

        this.showUserContent = false;
        this.communityCount = 0;
        this.isLoading = false;

        // Get Firebase and user preferences
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.userPrefs = window.userPreferences || null;

        // Cache for community count (5 minutes)
        this.countCache = null;
        this.countCacheTimestamp = null;
        this.countCacheDuration = 5 * 60 * 1000; // 5 minutes

        this.init();
    }

    /**
     * Initialize the content filter
     */
    async init() {
        // Load preference
        await this.loadPreference();

        // Render UI
        this.render();

        // Load community count
        await this.loadCommunityCount();

        // Attach event listeners
        this.attachEventListeners();

        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                // Sync localStorage to Firestore on login
                this.syncLocalStorageToFirestore(user.uid);
            }
        });
    }

    /**
     * Load user preference from Firestore or localStorage
     */
    async loadPreference() {
        const user = this.auth.currentUser;

        if (user && this.userPrefs) {
            // Load from Firestore via user preferences service
            await this.userPrefs.loadPreferences(user.uid);
            this.showUserContent = this.userPrefs.getContentFilter('showUserContent');
        } else {
            // Load from localStorage for anonymous users
            const saved = localStorage.getItem('showUserContent');
            this.showUserContent = saved === 'true'; // Default: false
        }
    }

    /**
     * Save preference to Firestore or localStorage
     */
    async savePreference(value) {
        const user = this.auth.currentUser;

        if (user && this.userPrefs) {
            // Save to Firestore
            this.userPrefs.setContentFilter('showUserContent', value);
            await this.userPrefs.savePreferences();
        } else {
            // Save to localStorage
            localStorage.setItem('showUserContent', value);
        }

        this.showUserContent = value;
    }

    /**
     * Sync localStorage preference to Firestore on login
     */
    async syncLocalStorageToFirestore(userId) {
        const localPref = localStorage.getItem('showUserContent');

        if (localPref !== null && this.userPrefs) {
            await this.userPrefs.loadPreferences(userId);
            this.userPrefs.setContentFilter('showUserContent', localPref === 'true');
            await this.userPrefs.savePreferences();

            console.log('[ContentFilter] Synced localStorage to Firestore');
        }
    }

    /**
     * Load count of community content
     */
    async loadCommunityCount() {
        // Check cache first
        if (this.countCache !== null && this.countCacheTimestamp &&
            (Date.now() - this.countCacheTimestamp) < this.countCacheDuration) {
            this.communityCount = this.countCache;
            this.updateCountBadge();
            return;
        }

        try {
            // Query community content count using collectionGroup
            const query = this.db.collectionGroup(this.category)
                .where('isPublic', '==', true);

            // Apply mythology filter if specified
            let finalQuery = query;
            if (this.mythology) {
                finalQuery = query.where('mythology', '==', this.mythology);
            }

            // Get count
            const snapshot = await finalQuery.count().get();
            this.communityCount = snapshot.data().count;

            // Update cache
            this.countCache = this.communityCount;
            this.countCacheTimestamp = Date.now();

            // Update UI
            this.updateCountBadge();

        } catch (error) {
            console.error('[ContentFilter] Error loading community count:', error);
            this.communityCount = 0;
        }
    }

    /**
     * Render the content filter UI
     */
    render() {
        if (!this.container) return;

        // Load template
        const template = document.getElementById('content-filter-toggle-template');
        if (!template) {
            console.error('[ContentFilter] Template not found: content-filter-toggle-template');
            return;
        }

        // Clone template
        const clone = template.content.cloneNode(true);

        // Set initial toggle state
        const toggle = clone.getElementById('show-community-content');
        if (toggle) {
            toggle.checked = this.showUserContent;
        }

        // Append to container
        this.container.appendChild(clone);

        // Update count badge
        this.updateCountBadge();
    }

    /**
     * Update count badge visibility and value
     */
    updateCountBadge() {
        const badge = document.getElementById('communityContentCount');
        if (!badge) return;

        const countSpan = badge.querySelector('.badge-count');

        if (this.communityCount > 0) {
            badge.style.display = 'inline-flex';
            if (countSpan) {
                countSpan.textContent = this.communityCount;
            }
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle switch
        const toggle = document.getElementById('show-community-content');
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                await this.handleToggleChange(e.target.checked);
            });
        }

        // Info button
        const infoBtn = document.getElementById('contentFilterInfoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                this.showInfoModal();
            });
        }
    }

    /**
     * Handle toggle change
     */
    async handleToggleChange(checked) {
        // Show loading state
        this.setLoadingState(true);

        try {
            // Save preference
            await this.savePreference(checked);

            // Trigger callback to re-query content
            if (this.onToggle) {
                await this.onToggle(checked);
            }

            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('contentFilterChanged', {
                detail: {
                    showUserContent: checked,
                    category: this.category,
                    mythology: this.mythology
                }
            }));

        } catch (error) {
            console.error('[ContentFilter] Error toggling filter:', error);

            // Revert toggle on error
            const toggle = document.getElementById('show-community-content');
            if (toggle) {
                toggle.checked = !checked;
            }

            // Show error message
            this.showError('Failed to update filter. Please try again.');

        } finally {
            // Hide loading state
            this.setLoadingState(false);
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;

        const loadingEl = document.getElementById('filterLoading');
        const filterBar = document.getElementById('contentFilterBar');

        if (loadingEl) {
            loadingEl.style.display = loading ? 'flex' : 'none';
        }

        if (filterBar) {
            filterBar.style.opacity = loading ? '0.6' : '1';
            filterBar.style.pointerEvents = loading ? 'none' : 'auto';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create temporary error toast
        const toast = document.createElement('div');
        toast.className = 'filter-error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: var(--spacing-xl, 2rem);
            right: var(--spacing-xl, 2rem);
            padding: var(--spacing-md, 1rem) var(--spacing-lg, 1.5rem);
            background: var(--color-danger, #ef4444);
            color: white;
            border-radius: var(--radius-lg, 0.75rem);
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Show info modal
     */
    showInfoModal() {
        // Check if modal already exists
        let modal = document.getElementById('communityContentModal');

        if (!modal) {
            // Load template
            const template = document.getElementById('community-content-info-modal-template');
            if (!template) {
                console.error('[ContentFilter] Modal template not found');
                return;
            }

            // Clone and append to body
            const clone = template.content.cloneNode(true);
            document.body.appendChild(clone);

            // Get reference
            modal = document.getElementById('communityContentModal');

            // Attach close event listeners
            const closeBtn = document.getElementById('closeModalBtn');
            const closeFooterBtn = document.getElementById('closeModalFooterBtn');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideInfoModal());
            }

            if (closeFooterBtn) {
                closeFooterBtn.addEventListener('click', () => this.hideInfoModal());
            }

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideInfoModal();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideInfoModal();
                }
            });
        } else {
            // Show existing modal
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide info modal
     */
    hideInfoModal() {
        const modal = document.getElementById('communityContentModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Get current filter state
     */
    getState() {
        return {
            showUserContent: this.showUserContent,
            communityCount: this.communityCount,
            isLoading: this.isLoading
        };
    }

    /**
     * Refresh community count
     */
    async refreshCount() {
        // Clear cache
        this.countCache = null;
        this.countCacheTimestamp = null;

        // Reload count
        await this.loadCommunityCount();
    }

    /**
     * Destroy component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Remove modal if exists
        const modal = document.getElementById('communityContentModal');
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }
}

// ES Module Export
export { ContentFilter };

// Legacy global export
if (typeof window !== 'undefined') {
    window.ContentFilter = ContentFilter;
}
