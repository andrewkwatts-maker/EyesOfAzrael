/**
 * Content Filter UI Integration
 * Adds hide/unhide buttons to user content and applies filtering
 */

class ContentFilterUI {
    constructor() {
        this.init();
    }

    /**
     * Initialize the filter UI
     */
    init() {
        // Listen for filter changes to re-render content
        window.addEventListener('contentFilterChanged', () => {
            this.refreshVisibleContent();
        });
    }

    /**
     * Add filter controls to a theory card/item
     * @param {HTMLElement} element - The theory card element
     * @param {Object} theory - The theory data object
     */
    addFilterControls(element, theory) {
        if (!theory || !window.contentFilter) return;

        const currentUserId = window.userAuth?.getCurrentUser()?.uid;
        const isOwnContent = theory.userId && theory.userId === currentUserId;
        const isOfficialContent = !theory.userId || theory.official === true;

        // Don't add controls to official content or own content
        if (isOfficialContent || isOwnContent) return;

        // Create controls container
        const controlsHTML = this.renderFilterControls(theory);

        // Find a good place to inject the controls
        const existingControls = element.querySelector('.filter-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // Insert at the top of the card
        element.insertAdjacentHTML('afterbegin', controlsHTML);

        // Attach event listeners
        this.attachControlListeners(element, theory);
    }

    /**
     * Render filter controls HTML
     * @param {Object} theory - Theory data object
     * @returns {string} HTML string
     */
    renderFilterControls(theory) {
        const isUserHidden = window.contentFilter.isUserHidden(theory.userId);
        const isTopicHidden = theory.userTopic && window.contentFilter.isTopicHidden(theory.userTopic);
        const isSubtopicHidden = theory.userSubtopic && window.contentFilter.isSubtopicHidden(theory.userSubtopic);

        return `
            <div class="filter-controls">
                <div class="filter-controls-dropdown">
                    <button class="filter-controls-btn" type="button" aria-label="Filter options">
                        <span class="filter-controls-icon">⋮</span>
                    </button>
                    <div class="filter-controls-menu">
                        <div class="filter-menu-header">Filter Options</div>

                        ${theory.userId ? `
                            <button class="filter-menu-item"
                                    data-action="toggle-user"
                                    data-user-id="${this.escapeHtml(theory.userId)}">
                                ${isUserHidden ? '👁️ Unhide' : '🚫 Hide'} this user
                            </button>
                        ` : ''}

                        ${theory.userTopic ? `
                            <button class="filter-menu-item"
                                    data-action="toggle-topic"
                                    data-topic-id="${this.escapeHtml(theory.userTopic)}">
                                ${isTopicHidden ? '👁️ Unhide' : '🚫 Hide'} topic: ${this.escapeHtml(theory.userTopic)}
                            </button>
                        ` : ''}

                        ${theory.userSubtopic ? `
                            <button class="filter-menu-item"
                                    data-action="toggle-subtopic"
                                    data-subtopic-id="${this.escapeHtml(theory.userSubtopic)}">
                                ${isSubtopicHidden ? '👁️ Unhide' : '🚫 Hide'} subtopic: ${this.escapeHtml(theory.userSubtopic)}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to filter controls
     * @param {HTMLElement} element - The theory card element
     * @param {Object} theory - Theory data object
     */
    attachControlListeners(element, theory) {
        // Toggle dropdown menu
        const btn = element.querySelector('.filter-controls-btn');
        const menu = element.querySelector('.filter-controls-menu');

        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                menu.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!element.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });
        }

        // Handle menu item clicks
        const menuItems = element.querySelectorAll('.filter-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();

                const action = item.dataset.action;

                switch (action) {
                    case 'toggle-user':
                        const userId = item.dataset.userId;
                        if (window.contentFilter.isUserHidden(userId)) {
                            window.contentFilter.unhideUser(userId);
                        } else {
                            window.contentFilter.hideUser(userId);
                        }
                        break;

                    case 'toggle-topic':
                        const topicId = item.dataset.topicId;
                        if (window.contentFilter.isTopicHidden(topicId)) {
                            window.contentFilter.unhideTopic(topicId);
                        } else {
                            window.contentFilter.hideTopic(topicId);
                        }
                        break;

                    case 'toggle-subtopic':
                        const subtopicId = item.dataset.subtopicId;
                        if (window.contentFilter.isSubtopicHidden(subtopicId)) {
                            window.contentFilter.unhideSubtopic(subtopicId);
                        } else {
                            window.contentFilter.hideSubtopic(subtopicId);
                        }
                        break;
                }

                menu.classList.remove('show');
            });
        });
    }

    /**
     * Check if an element should be visible based on filter settings
     * @param {HTMLElement} element - Theory card element
     * @param {Object} theory - Theory data object
     * @returns {boolean}
     */
    shouldShowElement(element, theory) {
        if (!window.contentFilter || !theory) return true;
        return window.contentFilter.shouldShow(theory);
    }

    /**
     * Apply filter to a single theory element
     * @param {HTMLElement} element - Theory card element
     * @param {Object} theory - Theory data object
     */
    applyFilterToElement(element, theory) {
        const shouldShow = this.shouldShowElement(element, theory);

        if (shouldShow) {
            element.style.display = '';
            element.classList.remove('filtered-hidden');
        } else {
            element.style.display = 'none';
            element.classList.add('filtered-hidden');
        }
    }

    /**
     * Refresh visible content based on current filter settings
     * Should be called when filter settings change
     */
    refreshVisibleContent() {
        // Find all theory cards and reapply filters
        const theoryCards = document.querySelectorAll('[data-theory-id]');

        theoryCards.forEach(card => {
            const theoryData = card.dataset.theoryData;
            if (theoryData) {
                try {
                    const theory = JSON.parse(theoryData);
                    this.applyFilterToElement(card, theory);
                } catch (error) {
                    console.error('Error parsing theory data:', error);
                }
            }
        });

        // Dispatch event to notify of content update
        window.dispatchEvent(new CustomEvent('contentFiltered', {
            detail: { timestamp: Date.now() }
        }));
    }

    /**
     * Initialize filters for a list of theories
     * @param {Array} theories - Array of theory objects
     * @param {string} containerSelector - CSS selector for container
     */
    initializeForTheories(theories, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Wait a tick for cards to be rendered
        setTimeout(() => {
            theories.forEach((theory, index) => {
                const card = container.querySelector(`[data-theory-id="${theory.id}"]`);
                if (card) {
                    // Store theory data on element
                    card.dataset.theoryData = JSON.stringify(theory);

                    // Add filter controls
                    this.addFilterControls(card, theory);

                    // Apply initial filter
                    this.applyFilterToElement(card, theory);
                }
            });
        }, 100);
    }

    /**
     * Get filtered theories from a list
     * @param {Array} theories - Array of theory objects
     * @returns {Array} Filtered array
     */
    filterTheories(theories) {
        if (!window.contentFilter) return theories;

        return theories.filter(theory => window.contentFilter.shouldShow(theory));
    }

    /**
     * Get filter summary for display
     * @param {number} totalCount - Total number of items
     * @param {number} filteredCount - Number of visible items after filtering
     * @returns {string} HTML string
     */
    getFilterSummary(totalCount, filteredCount) {
        if (!window.contentFilter || totalCount === filteredCount) {
            return '';
        }

        const hiddenCount = totalCount - filteredCount;
        const mode = window.contentFilter.getModeLabel();

        return `
            <div class="filter-summary">
                <div class="filter-summary-icon">🎛️</div>
                <div class="filter-summary-text">
                    <strong>Content Filter Active:</strong> ${mode}<br>
                    Showing ${filteredCount} of ${totalCount} items (${hiddenCount} hidden)
                </div>
                <button class="btn-adjust-filter" onclick="window.filterSettingsModal?.open()">
                    Adjust Filters
                </button>
            </div>
        `;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.contentFilterUI = new ContentFilterUI();
