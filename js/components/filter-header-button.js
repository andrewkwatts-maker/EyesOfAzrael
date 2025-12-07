/**
 * Filter Header Button
 * Adds content filter button to site header
 */

class FilterHeaderButton {
    constructor() {
        this.button = null;
        this.badge = null;
        this.init();
    }

    /**
     * Initialize the filter button
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createButton());
        } else {
            this.createButton();
        }

        // Listen for filter changes to update badge
        window.addEventListener('contentFilterChanged', (e) => {
            this.updateBadge();
        });
    }

    /**
     * Create and inject the filter button into header
     */
    createButton() {
        // Find header or create one if it doesn't exist
        let header = document.querySelector('header .header-content');

        if (!header) {
            // Try to find just header
            header = document.querySelector('header');
            if (!header) {
                console.warn('No header found to add filter button');
                return;
            }
        }

        // Create button HTML
        const buttonHTML = `
            <button id="filter-settings-btn" class="filter-header-btn" title="Content Filter Settings" aria-label="Content Filter Settings">
                <span class="filter-btn-icon">🎛️</span>
                <span class="filter-btn-label">Filter</span>
                <span class="filter-btn-badge" id="filter-badge" style="display: none;">0</span>
            </button>
        `;

        // Try to find a nav or controls container in the header
        let container = header.querySelector('nav, .header-nav, .header-controls');

        if (container) {
            // Append to existing nav/controls
            container.insertAdjacentHTML('beforeend', buttonHTML);
        } else {
            // Create a controls container and append to header
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'header-controls';
            controlsDiv.innerHTML = buttonHTML;
            header.appendChild(controlsDiv);
        }

        // Get reference to button and badge
        this.button = document.getElementById('filter-settings-btn');
        this.badge = document.getElementById('filter-badge');

        // Attach click handler
        if (this.button) {
            this.button.addEventListener('click', () => {
                if (window.filterSettingsModal) {
                    window.filterSettingsModal.open();
                }
            });
        }

        // Initial badge update
        this.updateBadge();
    }

    /**
     * Update the badge to show number of hidden items
     */
    updateBadge() {
        if (!this.badge || !window.contentFilter) return;

        const stats = window.contentFilter.getStats();
        const totalHidden = stats.hiddenUsersCount + stats.hiddenTopicsCount + stats.hiddenSubtopicsCount;

        if (totalHidden > 0) {
            this.badge.textContent = totalHidden;
            this.badge.style.display = 'flex';
        } else {
            this.badge.style.display = 'none';
        }

        // Update button title with current mode
        if (this.button) {
            const modeLabel = window.contentFilter.getModeLabel();
            this.button.title = `Content Filter: ${modeLabel}`;
        }
    }
}

// Initialize when script loads
new FilterHeaderButton();
