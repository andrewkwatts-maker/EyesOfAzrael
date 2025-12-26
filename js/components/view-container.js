/**
 * View Container Component
 * Manages the main content area for the dynamic SPA
 *
 * Features:
 * - Smooth view transitions (fade in/out)
 * - Loading and error states
 * - Scroll position restoration
 * - Content caching
 */

class ViewContainer {
    constructor(containerElement) {
        this.container = containerElement || document.getElementById('main-content');
        this.currentView = null;
        this.isTransitioning = false;
        this.transitionDuration = 300; // ms

        if (!this.container) {
            console.error('[ViewContainer] Container element not found');
        }
    }

    /**
     * Display content with transition animation
     * @param {string} html - HTML content to display
     * @param {object} options - Display options
     */
    async display(html, options = {}) {
        if (this.isTransitioning) {
            console.warn('[ViewContainer] Transition already in progress');
            return;
        }

        this.isTransitioning = true;

        try {
            // Fade out current content
            await this.transitionOut();

            // Update content
            this.container.innerHTML = html;
            this.currentView = html;

            // Fade in new content
            await this.transitionIn();

            // Execute callback if provided
            if (options.onComplete) {
                options.onComplete();
            }

        } catch (error) {
            console.error('[ViewContainer] Display error:', error);
            this.showError(error);
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Transition out animation
     */
    async transitionOut() {
        return new Promise(resolve => {
            this.container.classList.add('view-transition-out');
            this.container.classList.remove('view-transition-in');

            setTimeout(() => {
                resolve();
            }, this.transitionDuration / 2);
        });
    }

    /**
     * Transition in animation
     */
    async transitionIn() {
        return new Promise(resolve => {
            this.container.classList.remove('view-transition-out', 'view-loading', 'view-error');
            this.container.classList.add('view-transition-in');

            setTimeout(() => {
                this.container.classList.remove('view-transition-in');
                resolve();
            }, this.transitionDuration);
        });
    }

    /**
     * Show loading state
     * @param {string} message - Optional loading message
     */
    showLoading(message = 'Loading...') {
        this.container.classList.add('view-loading');
        this.container.classList.remove('view-error');

        this.container.innerHTML = `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }

    /**
     * Show error state
     * @param {Error|string} error - Error object or message
     */
    showError(error) {
        this.container.classList.add('view-error');
        this.container.classList.remove('view-loading');

        const errorMessage = error?.message || error || 'An unknown error occurred';

        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h2>Error Loading Content</h2>
                <p class="error-message">${this.escapeHtml(errorMessage)}</p>
                <div class="error-actions">
                    <button class="btn-primary" onclick="window.location.reload()">
                        Reload Page
                    </button>
                    <button class="btn-secondary" onclick="window.location.hash = '#/'">
                        Go Home
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show empty state
     * @param {object} options - Empty state options
     */
    showEmpty(options = {}) {
        const {
            icon = '📭',
            title = 'No Content Found',
            message = 'There is no content to display at this time.',
            actionLabel = 'Go Home',
            actionUrl = '#/'
        } = options;

        this.container.innerHTML = `
            <div class="empty-container">
                <div class="empty-icon">${icon}</div>
                <h2>${title}</h2>
                <p class="empty-message">${message}</p>
                ${actionLabel ? `
                    <a href="${actionUrl}" class="btn-primary">${actionLabel}</a>
                ` : ''}
            </div>
        `;
    }

    /**
     * Clear content
     */
    clear() {
        this.container.innerHTML = '';
        this.container.className = 'view-container';
        this.currentView = null;
    }

    /**
     * Get current scroll position
     */
    getScrollPosition() {
        return {
            x: window.scrollX,
            y: window.scrollY
        };
    }

    /**
     * Restore scroll position
     * @param {object} position - Position {x, y}
     */
    restoreScrollPosition(position) {
        if (position) {
            window.scrollTo(position.x, position.y);
        }
    }

    /**
     * Scroll to top smoothly
     */
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add CSS class to container
     */
    addClass(className) {
        this.container.classList.add(className);
    }

    /**
     * Remove CSS class from container
     */
    removeClass(className) {
        this.container.classList.remove(className);
    }

    /**
     * Check if currently transitioning
     */
    isInTransition() {
        return this.isTransitioning;
    }

    /**
     * Get container element
     */
    getElement() {
        return this.container;
    }
}

// Export for use
window.ViewContainer = ViewContainer;
