/**
 * Render Utilities Module
 * Shared rendering helpers for the SPA
 *
 * Usage:
 *   const safe = RenderUtilities.escapeHtml(userInput);
 *   RenderUtilities.showLoading(container, 'Loading...');
 *   RenderUtilities.showError(container, error);
 */

const RenderUtilities = {
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength = 150) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    },

    /**
     * Get loading HTML
     * @param {string} message - Loading message
     * @returns {string} HTML string
     */
    getLoadingHTML(message = 'Loading...') {
        return `
            <div class="loading-state" role="status" aria-live="polite">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    },

    /**
     * Get error HTML
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {string} HTML string
     */
    getErrorHTML(title = 'Error', message = 'Something went wrong', options = {}) {
        const { showRetry = true, showHome = true, retryText = 'Try Again' } = options;

        return `
            <div class="error-state" role="alert">
                <div class="error-icon">⚠️</div>
                <h2 class="error-title">${this.escapeHtml(title)}</h2>
                <p class="error-message">${this.escapeHtml(message)}</p>
                <div class="error-actions">
                    ${showRetry ? `<button class="btn btn-primary error-retry">${this.escapeHtml(retryText)}</button>` : ''}
                    ${showHome ? `<a href="#/" class="btn btn-secondary">Go Home</a>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Get 404 HTML
     * @param {string} path - The path that wasn't found
     * @returns {string} HTML string
     */
    get404HTML(path = '') {
        return `
            <div class="error-state error-404" role="alert">
                <div class="error-icon">🔍</div>
                <h1 class="error-title">Page Not Found</h1>
                <p class="error-message">
                    The page you're looking for doesn't exist or has been moved.
                    ${path ? `<br><code>${this.escapeHtml(path)}</code>` : ''}
                </p>
                <div class="error-actions">
                    <a href="#/" class="btn btn-primary">Go Home</a>
                    <a href="#/search" class="btn btn-secondary">Search</a>
                </div>
            </div>
        `;
    },

    /**
     * Show loading state in container
     * @param {HTMLElement} container - Container element
     * @param {string} message - Loading message
     */
    showLoading(container, message = 'Loading...') {
        if (!container) return;
        container.innerHTML = this.getLoadingHTML(message);
        container.classList.add('is-loading');
    },

    /**
     * Hide loading state
     * @param {HTMLElement} container - Container element
     */
    hideLoading(container) {
        if (!container) return;
        container.classList.remove('is-loading');
    },

    /**
     * Show error state in container
     * @param {HTMLElement} container - Container element
     * @param {Error|string} error - Error object or message
     * @param {Object} options - Display options
     */
    showError(container, error, options = {}) {
        if (!container) return;

        const message = error instanceof Error ? error.message : String(error);
        const title = options.title || 'Error';

        container.innerHTML = this.getErrorHTML(title, message, options);
        container.classList.remove('is-loading');
        container.classList.add('has-error');

        // Attach retry handler if callback provided
        if (options.onRetry) {
            const retryBtn = container.querySelector('.error-retry');
            if (retryBtn) {
                retryBtn.addEventListener('click', options.onRetry);
            }
        }
    },

    /**
     * Clear container state classes
     * @param {HTMLElement} container - Container element
     */
    clearState(container) {
        if (!container) return;
        container.classList.remove('is-loading', 'has-error');
    },

    /**
     * Show auth waiting state
     * @param {HTMLElement} container - Container element
     */
    showAuthWaiting(container) {
        if (!container) return;

        container.innerHTML = `
            <div class="auth-waiting-state">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h2>Checking Authentication</h2>
                <p>Please wait while we verify your session...</p>
            </div>
        `;
    },

    /**
     * Render markdown (basic)
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string
     */
    renderMarkdown(markdown) {
        if (!markdown) return '';

        // Basic markdown conversion
        return markdown
            // Headers
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    },

    /**
     * Announce to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('route-announcer') ||
            document.querySelector('[role="status"]');

        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderUtilities;
}

// Export to window for browser usage
window.RenderUtilities = RenderUtilities;
