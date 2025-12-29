/**
 * Sort Selector Component
 * Provides UI for sorting content by different voting and metadata criteria
 *
 * Features:
 * - Multiple sort options (votes, contested, recent, alphabetical)
 * - Tooltips explaining each sort method
 * - Persistent sort preferences (localStorage + user preferences)
 * - Debounced sort changes for performance
 * - Analytics tracking for sort usage
 *
 * Usage:
 * const sortSelector = new SortSelector(container, {
 *   defaultSort: 'votes-desc',
 *   onSortChange: (sortBy) => { console.log('Sort changed:', sortBy); }
 * });
 */

class SortSelector {
    /**
     * @param {HTMLElement} container - Container element for the sort selector
     * @param {Object} options - Configuration options
     * @param {string} options.defaultSort - Default sort order ('votes-desc', 'votes-asc', 'contested', 'recent', 'alphabetical')
     * @param {Function} options.onSortChange - Callback when sort order changes
     * @param {string} options.preferenceKey - LocalStorage key for persistence (default: 'content-sort-order')
     * @param {boolean} options.saveToUserPreferences - Save to user preferences in Firestore (default: true)
     * @param {number} options.debounceDelay - Debounce delay in ms (default: 300)
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            defaultSort: 'votes-desc',
            onSortChange: null,
            preferenceKey: 'content-sort-order',
            saveToUserPreferences: true,
            debounceDelay: 300,
            ...options
        };

        this.currentSort = null;
        this.debounceTimer = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        // Load saved preference
        this.currentSort = this.loadSortPreference();

        // Render component
        this.render();

        // Attach event listeners
        this.attachEventListeners();

        // Track component creation
        this.trackAnalytics('component_created', { defaultSort: this.currentSort });
    }

    /**
     * Render the sort selector
     */
    render() {
        this.container.innerHTML = `
            <div class="sort-selector-container">
                <label for="content-sort-order" class="sort-label">
                    <svg class="sort-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18M3 12h15M3 18h12"/>
                        <path d="M15 9l3-3 3 3"/>
                        <path d="M21 15l-3 3-3-3"/>
                    </svg>
                    <span>Sort by:</span>
                </label>

                <select id="content-sort-order" class="sort-select" aria-label="Sort content by">
                    <option value="votes-desc" ${this.currentSort === 'votes-desc' ? 'selected' : ''}>
                        Most Helpful
                    </option>
                    <option value="votes-asc" ${this.currentSort === 'votes-asc' ? 'selected' : ''}>
                        Least Helpful
                    </option>
                    <option value="contested" ${this.currentSort === 'contested' ? 'selected' : ''}>
                        Most Debated
                    </option>
                    <option value="recent" ${this.currentSort === 'recent' ? 'selected' : ''}>
                        Most Recent
                    </option>
                    <option value="alphabetical" ${this.currentSort === 'alphabetical' ? 'selected' : ''}>
                        A-Z
                    </option>
                </select>

                <button
                    class="sort-help-btn"
                    aria-label="Learn about sorting options"
                    data-tooltip-position="left">
                    <svg class="help-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </button>

                <div class="sort-tooltip" role="tooltip" aria-hidden="true">
                    <h4 class="tooltip-title">Sorting Options</h4>
                    <dl class="tooltip-list">
                        <dt>Most Helpful</dt>
                        <dd>Items with the highest net votes (upvotes - downvotes)</dd>

                        <dt>Least Helpful</dt>
                        <dd>Items with the lowest votes, including negative scores</dd>

                        <dt>Most Debated</dt>
                        <dd>
                            Items with high engagement but close scores
                            <br>
                            <small class="tooltip-note">Community can't agree on quality - read carefully!</small>
                        </dd>

                        <dt>Most Recent</dt>
                        <dd>Newest submissions shown first</dd>

                        <dt>A-Z</dt>
                        <dd>Alphabetical order by name</dd>
                    </dl>

                    <div class="tooltip-example">
                        <strong>Example: "Most Debated"</strong>
                        <div class="example-item">
                             100 upvotes, 98 downvotes = Very contested!
                        </div>
                        <div class="example-item">
                             200 upvotes, 5 downvotes = Popular, not contested
                        </div>
                    </div>
                </div>
            </div>

            ${this.getStyles()}
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const select = this.container.querySelector('#content-sort-order');
        if (select) {
            select.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        }

        const helpBtn = this.container.querySelector('.sort-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTooltip();
            });
        }

        // Close tooltip on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideTooltip();
            }
        });

        // Keyboard accessibility for tooltip
        const tooltip = this.container.querySelector('.sort-tooltip');
        if (tooltip) {
            tooltip.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideTooltip();
                    helpBtn.focus();
                }
            });
        }
    }

    /**
     * Handle sort change
     * @param {string} sortBy - New sort order
     */
    handleSortChange(sortBy) {
        if (sortBy === this.currentSort) {
            return; // No change
        }

        this.currentSort = sortBy;

        // Save preference
        this.saveSortPreference(sortBy);

        // Debounce callback
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            // Trigger callback
            if (this.options.onSortChange && typeof this.options.onSortChange === 'function') {
                this.options.onSortChange(sortBy);
            }

            // Dispatch custom event
            this.dispatchSortEvent(sortBy);

            // Track analytics
            this.trackAnalytics('sort_changed', { sortBy });
        }, this.options.debounceDelay);
    }

    /**
     * Load sort preference from localStorage or user preferences
     * @returns {string} Saved sort order or default
     */
    loadSortPreference() {
        // Try localStorage first (instant)
        const localPreference = localStorage.getItem(this.options.preferenceKey);
        if (localPreference) {
            return localPreference;
        }

        // Try user preferences (async, but we'll use local for now)
        // In production, this would be loaded during app init
        return this.options.defaultSort;
    }

    /**
     * Save sort preference to localStorage and optionally to user preferences
     * @param {string} sortBy - Sort order to save
     */
    saveSortPreference(sortBy) {
        // Save to localStorage (instant)
        localStorage.setItem(this.options.preferenceKey, sortBy);

        // Save to user preferences in Firestore (async, non-blocking)
        if (this.options.saveToUserPreferences && window.firebase && window.firebase.auth) {
            const user = window.firebase.auth.currentUser;
            if (user) {
                this.saveToUserPreferences(user.uid, sortBy);
            }
        }
    }

    /**
     * Save to user preferences in Firestore
     * @param {string} userId - User ID
     * @param {string} sortBy - Sort order
     */
    async saveToUserPreferences(userId, sortBy) {
        try {
            const db = window.firebase.firestore;
            if (!db) return;

            await db.collection('user_preferences').doc(userId).set({
                contentSortOrder: sortBy,
                updatedAt: new Date()
            }, { merge: true });

            console.log('[SortSelector] Saved to user preferences:', sortBy);
        } catch (error) {
            console.error('[SortSelector] Error saving to user preferences:', error);
        }
    }

    /**
     * Dispatch custom sort change event
     * @param {string} sortBy - New sort order
     */
    dispatchSortEvent(sortBy) {
        window.dispatchEvent(new CustomEvent('sortOrderChanged', {
            detail: {
                sortBy,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Toggle tooltip visibility
     */
    toggleTooltip() {
        const tooltip = this.container.querySelector('.sort-tooltip');
        if (tooltip) {
            const isVisible = tooltip.getAttribute('aria-hidden') === 'false';
            tooltip.setAttribute('aria-hidden', String(!isVisible));
            tooltip.style.opacity = isVisible ? '0' : '1';
            tooltip.style.visibility = isVisible ? 'hidden' : 'visible';
            tooltip.style.transform = isVisible ? 'translateY(-10px)' : 'translateY(0)';
        }
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = this.container.querySelector('.sort-tooltip');
        if (tooltip) {
            tooltip.setAttribute('aria-hidden', 'true');
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translateY(-10px)';
        }
    }

    /**
     * Get current sort order
     * @returns {string} Current sort order
     */
    getCurrentSort() {
        return this.currentSort;
    }

    /**
     * Set sort order programmatically
     * @param {string} sortBy - Sort order to set
     */
    setSort(sortBy) {
        const select = this.container.querySelector('#content-sort-order');
        if (select) {
            select.value = sortBy;
            this.handleSortChange(sortBy);
        }
    }

    /**
     * Track analytics event
     * @param {string} action - Action name
     * @param {Object} data - Additional data
     */
    trackAnalytics(action, data) {
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent(`sort_selector_${action}`, data);
        }
    }

    /**
     * Get component styles
     * @returns {string} CSS styles
     */
    getStyles() {
        return `
            <style>
                /* Container */
                .sort-selector-container {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    position: relative;
                }

                /* Label */
                .sort-label {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-medium, 500);
                    color: var(--color-text-secondary, #9ca3af);
                    cursor: pointer;
                    user-select: none;
                }

                .sort-icon {
                    width: 1rem;
                    height: 1rem;
                    opacity: 0.7;
                }

                /* Select */
                .sort-select {
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    padding-right: 2.5rem;
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.8);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-lg, 0.75rem);
                    color: var(--color-text-primary, #e5e7eb);
                    font-size: var(--font-size-base, 1rem);
                    font-family: var(--font-primary, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
                    cursor: pointer;
                    transition: all var(--transition-base, 0.3s ease);
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8.825L1.175 4 2.59 2.59 6 6l3.41-3.41L10.825 4z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.75rem center;
                    min-width: 180px;
                }

                .sort-select:hover {
                    border-color: rgba(var(--color-primary-rgb, 139, 92, 246), 0.5);
                }

                .sort-select:focus {
                    outline: none;
                    border-color: var(--color-primary, #8b5cf6);
                    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                }

                /* Help Button */
                .sort-help-btn {
                    padding: var(--spacing-xs, 0.25rem);
                    background: transparent;
                    border: 1px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                    border-radius: var(--radius-full, 9999px);
                    color: var(--color-text-secondary, #9ca3af);
                    cursor: pointer;
                    transition: all var(--transition-fast, 0.15s ease);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2rem;
                    height: 2rem;
                }

                .sort-help-btn:hover {
                    background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.1);
                    border-color: rgba(var(--color-primary-rgb, 139, 92, 246), 0.5);
                    color: var(--color-primary, #8b5cf6);
                }

                .sort-help-btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                }

                .help-icon {
                    width: 1.25rem;
                    height: 1.25rem;
                }

                /* Tooltip */
                .sort-tooltip {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    z-index: 1000;
                    min-width: 320px;
                    max-width: 400px;
                    padding: var(--spacing-lg, 1.5rem);
                    background: rgba(var(--color-surface-rgb, 26, 31, 58), 0.98);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 2px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.4);
                    border-radius: var(--radius-xl, 1rem);
                    box-shadow:
                        0 10px 40px rgba(0, 0, 0, 0.5),
                        0 0 20px rgba(var(--color-primary-rgb, 139, 92, 246), 0.2);
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all var(--transition-base, 0.3s ease);
                    pointer-events: none;
                }

                .sort-help-btn:hover + .sort-tooltip,
                .sort-help-btn:focus + .sort-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                    pointer-events: auto;
                }

                .tooltip-title {
                    margin: 0 0 var(--spacing-md, 1rem) 0;
                    font-size: var(--font-size-lg, 1.125rem);
                    font-weight: var(--font-semibold, 600);
                    color: var(--color-primary, #8b5cf6);
                }

                .tooltip-list {
                    margin: 0;
                    padding: 0;
                }

                .tooltip-list dt {
                    margin-top: var(--spacing-md, 1rem);
                    font-weight: var(--font-semibold, 600);
                    color: var(--color-text-primary, #e5e7eb);
                    font-size: var(--font-size-sm, 0.875rem);
                }

                .tooltip-list dt:first-child {
                    margin-top: 0;
                }

                .tooltip-list dd {
                    margin: var(--spacing-xs, 0.25rem) 0 0 0;
                    padding-left: var(--spacing-md, 1rem);
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: var(--font-size-sm, 0.875rem);
                    line-height: var(--leading-relaxed, 1.75);
                }

                .tooltip-note {
                    display: block;
                    margin-top: var(--spacing-xs, 0.25rem);
                    color: var(--color-warning, #f59e0b);
                    font-style: italic;
                    font-size: var(--font-size-xs, 0.75rem);
                }

                .tooltip-example {
                    margin-top: var(--spacing-lg, 1.5rem);
                    padding-top: var(--spacing-lg, 1.5rem);
                    border-top: 1px solid rgba(var(--color-border-rgb, 139, 127, 255), 0.3);
                }

                .tooltip-example strong {
                    display: block;
                    margin-bottom: var(--spacing-sm, 0.5rem);
                    color: var(--color-text-primary, #e5e7eb);
                    font-size: var(--font-size-sm, 0.875rem);
                }

                .example-item {
                    padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
                    margin-top: var(--spacing-xs, 0.25rem);
                    background: rgba(var(--color-primary-rgb, 139, 92, 246), 0.1);
                    border-left: 2px solid var(--color-primary, #8b5cf6);
                    border-radius: var(--radius-sm, 0.25rem);
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: var(--font-size-xs, 0.75rem);
                    font-family: var(--font-mono, 'Courier New', monospace);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .sort-selector-container {
                        flex-direction: column;
                        align-items: stretch;
                        gap: var(--spacing-md, 1rem);
                    }

                    .sort-label {
                        justify-content: center;
                    }

                    .sort-select {
                        width: 100%;
                        min-width: auto;
                    }

                    .sort-tooltip {
                        left: 0;
                        right: 0;
                        min-width: auto;
                        max-width: none;
                    }
                }

                @media (max-width: 480px) {
                    .sort-label span {
                        display: none;
                    }

                    .sort-tooltip {
                        max-height: 60vh;
                        overflow-y: auto;
                    }
                }

                /* Accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .sort-select,
                    .sort-help-btn,
                    .sort-tooltip {
                        transition: none;
                    }
                }

                @media (prefers-contrast: high) {
                    .sort-select,
                    .sort-help-btn,
                    .sort-tooltip {
                        border-width: 3px;
                    }
                }
            </style>
        `;
    }

    /**
     * Destroy component and clean up
     */
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.container.innerHTML = '';
    }
}

// ES Module Export
export { SortSelector };

// Legacy global export
if (typeof window !== 'undefined') {
    window.SortSelector = SortSelector;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Basic usage:
 *    const container = document.getElementById('sortContainer');
 *    const sortSelector = new SortSelector(container, {
 *      onSortChange: (sortBy) => {
 *        console.log('Sort changed to:', sortBy);
 *        reloadContent(sortBy);
 *      }
 *    });
 *
 * 2. With custom defaults:
 *    const sortSelector = new SortSelector(container, {
 *      defaultSort: 'contested',
 *      debounceDelay: 500,
 *      preferenceKey: 'my-custom-sort-key'
 *    });
 *
 * 3. Listen for sort events:
 *    window.addEventListener('sortOrderChanged', (event) => {
 *      const { sortBy } = event.detail;
 *      console.log('Sort order changed:', sortBy);
 *    });
 *
 * 4. Programmatic control:
 *    sortSelector.setSort('recent'); // Change sort programmatically
 *    const current = sortSelector.getCurrentSort(); // Get current sort
 */
