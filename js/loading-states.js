/**
 * Loading States Utilities
 * Provides consistent loading, error, and skeleton UI patterns
 */

const LoadingStates = {
    /**
     * Show loading spinner in container
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - Loading message to display
     */
    showLoading(container, message = 'Loading...') {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        el.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    },

    /**
     * Hide loading state and clear container
     * @param {HTMLElement|string} container - DOM element or selector
     */
    hideLoading(container) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const loadingState = el.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    },

    /**
     * Show skeleton placeholders for content
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} type - Type of skeleton ('card', 'list', 'text', 'form')
     * @param {number} count - Number of skeleton items to show
     */
    showSkeleton(container, type = 'card', count = 3) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        let skeletonHTML = '';

        switch (type) {
            case 'card':
                skeletonHTML = this.generateSkeletonCards(count);
                break;
            case 'list':
                skeletonHTML = this.generateSkeletonList(count);
                break;
            case 'text':
                skeletonHTML = this.generateSkeletonText(count);
                break;
            case 'form':
                skeletonHTML = this.generateSkeletonForm();
                break;
            default:
                skeletonHTML = this.generateSkeletonCards(count);
        }

        el.innerHTML = `<div class="skeleton-container">${skeletonHTML}</div>`;
    },

    /**
     * Show error message in container
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - Error message to display
     * @param {Object} options - Additional options
     */
    showError(container, message, options = {}) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const {
            title = 'Error',
            retry = null,
            icon = '❌'
        } = options;

        el.innerHTML = `
            <div class="error-state">
                <div class="error-icon">${icon}</div>
                <h3 class="error-title">${this.escapeHtml(title)}</h3>
                <p class="error-message">${this.escapeHtml(message)}</p>
                ${retry ? `
                    <button class="error-retry-btn" onclick="${retry}">
                        Try Again
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Show success message
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - Success message
     */
    showSuccess(container, message) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        el.innerHTML = `
            <div class="success-state">
                <div class="success-icon">✅</div>
                <p class="success-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    },

    /**
     * Show empty state (no data)
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - Empty state message
     * @param {Object} options - Additional options
     */
    showEmpty(container, message = 'No data found', options = {}) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const {
            icon = '📭',
            action = null,
            actionLabel = 'Add New'
        } = options;

        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <p class="empty-message">${this.escapeHtml(message)}</p>
                ${action ? `
                    <button class="empty-action-btn" onclick="${action}">
                        ${this.escapeHtml(actionLabel)}
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Show inline loading indicator (for buttons, etc.)
     * @returns {string} HTML for inline spinner
     */
    inlineSpinner() {
        return '<span class="inline-spinner"></span>';
    },

    /**
     * Add loading overlay to element
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - Loading message
     */
    showOverlay(container, message = 'Processing...') {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        // Remove existing overlay if any
        this.hideOverlay(container);

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-overlay-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;

        el.style.position = 'relative';
        el.appendChild(overlay);
    },

    /**
     * Remove loading overlay
     * @param {HTMLElement|string} container - DOM element or selector
     */
    hideOverlay(container) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const overlay = el.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    // Helper methods

    generateSkeletonCards(count) {
        let html = '<div class="skeleton-cards">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton-header">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-text skeleton-text-short"></div>
                    </div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-footer">
                        <div class="skeleton-text skeleton-text-xs"></div>
                        <div class="skeleton-text skeleton-text-xs"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    },

    generateSkeletonList(count) {
        let html = '<div class="skeleton-list">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-list-item">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-list-content">
                        <div class="skeleton-text skeleton-text-short"></div>
                        <div class="skeleton-text"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    },

    generateSkeletonText(count) {
        let html = '<div class="skeleton-text-block">';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-text"></div>';
        }
        html += '</div>';
        return html;
    },

    generateSkeletonForm() {
        return `
            <div class="skeleton-form">
                <div class="skeleton-form-group">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-input"></div>
                </div>
                <div class="skeleton-form-group">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-input"></div>
                </div>
                <div class="skeleton-form-group">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-textarea"></div>
                </div>
                <div class="skeleton-button"></div>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LoadingStates = LoadingStates;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingStates;
}
