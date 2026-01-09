/**
 * Loading States Utilities - Polished Edition
 * Provides consistent loading, error, and skeleton UI patterns
 *
 * Features:
 * - Multiple spinner sizes (sm, md, lg, xl)
 * - Progress bars (determinate and indeterminate)
 * - Skeleton screens for various content types
 * - Smooth transitions between states
 * - Error states with retry functionality
 * - Empty states with helpful actions
 * - Form submission loading states
 * - File upload progress tracking
 */

const LoadingStates = {
    // Configuration
    config: {
        minLoadingTime: 300, // Minimum loading display time in ms
        fadeOutDuration: 200,
        fadeInDuration: 300,
        spinnerSizes: {
            sm: 'loading-spinner--sm',
            md: 'loading-spinner--md',
            lg: 'loading-spinner--lg',
            xl: 'loading-spinner--xl'
        }
    },

    /**
     * Show loading spinner in container
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - Loading message to display
     * @param {Object} options - Additional options
     */
    showLoading(container, message = 'Loading...', options = {}) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const {
            size = 'lg',
            variant = 'default', // 'default', 'compact', 'inline', 'fullscreen'
            showProgress = false,
            progress = 0
        } = options;

        const sizeClass = this.config.spinnerSizes[size] || '';
        const variantClass = variant !== 'default' ? `loading-state--${variant}` : '';

        el.innerHTML = `
            <div class="loading-state ${variantClass}" role="status" aria-live="polite">
                <div class="loading-spinner ${sizeClass}" aria-hidden="true"></div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
                ${showProgress ? this.getProgressBarHTML(progress) : ''}
            </div>
        `;

        // Store reference for updates
        el._loadingState = {
            startTime: Date.now(),
            message,
            progress
        };
    },

    /**
     * Update loading message without re-rendering
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {string} message - New message
     */
    updateLoadingMessage(container, message) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const msgEl = el.querySelector('.loading-message');
        if (msgEl) {
            msgEl.classList.add('message-updating');
            setTimeout(() => {
                msgEl.textContent = message;
                msgEl.classList.remove('message-updating');
            }, 150);
        }
    },

    /**
     * Update progress bar
     * @param {HTMLElement|string} container - DOM element or selector
     * @param {number} progress - Progress value (0-100)
     */
    updateProgress(container, progress) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const fillEl = el.querySelector('.progress-bar-fill');
        const textEl = el.querySelector('.progress-bar-percent');

        if (fillEl) {
            fillEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
        if (textEl) {
            textEl.textContent = `${Math.round(progress)}%`;
        }
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
     * Get progress bar HTML
     * @param {number} progress - Progress value (0-100)
     * @param {Object} options - Additional options
     * @returns {string} Progress bar HTML
     */
    getProgressBarHTML(progress = 0, options = {}) {
        const {
            label = '',
            showPercent = true,
            indeterminate = false
        } = options;

        const trackClass = indeterminate ? 'progress-bar-track--indeterminate' : '';

        return `
            <div class="progress-bar-container">
                ${label ? `
                    <div class="progress-bar-label">
                        <span>${this.escapeHtml(label)}</span>
                        ${showPercent ? `<span class="progress-bar-percent">${Math.round(progress)}%</span>` : ''}
                    </div>
                ` : ''}
                <div class="progress-bar-track ${trackClass}">
                    <div class="progress-bar-fill" style="width: ${indeterminate ? 30 : progress}%"></div>
                </div>
            </div>
        `;
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
            title = 'Something went wrong',
            retry = null,
            retryLabel = 'Try Again',
            goBack = null,
            goBackLabel = 'Go Back',
            icon = null, // Will use SVG if null
            variant = 'default', // 'default', 'warning', 'info', 'compact'
            details = null
        } = options;

        const variantClass = variant !== 'default' ? `error-state--${variant}` : '';

        // Use SVG icon by default for better visuals
        const iconHTML = icon ? `<div class="error-icon">${icon}</div>` : `
            <div class="error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
        `;

        el.innerHTML = `
            <div class="error-state ${variantClass}" role="alert" aria-live="assertive">
                ${iconHTML}
                <h3 class="error-title">${this.escapeHtml(title)}</h3>
                <p class="error-message">${this.escapeHtml(message)}</p>
                ${details ? `<code class="error-details">${this.escapeHtml(details)}</code>` : ''}
                <div class="error-actions">
                    ${retry ? `
                        <button class="error-retry-btn btn-retry" data-retry-action>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            ${this.escapeHtml(retryLabel)}
                        </button>
                    ` : ''}
                    ${goBack ? `
                        <button class="btn-go-back" data-goback-action>
                            ${this.escapeHtml(goBackLabel)}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Attach event listeners
        if (retry && typeof retry === 'function') {
            const retryBtn = el.querySelector('[data-retry-action]');
            if (retryBtn) {
                retryBtn.addEventListener('click', retry);
            }
        }

        if (goBack && typeof goBack === 'function') {
            const backBtn = el.querySelector('[data-goback-action]');
            if (backBtn) {
                backBtn.addEventListener('click', goBack);
            }
        }
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
    showEmpty(container, message = 'No items found', options = {}) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const {
            title = '',
            icon = null, // Will use SVG if null
            action = null,
            actionLabel = 'Add New',
            secondaryAction = null,
            secondaryLabel = 'Learn More',
            suggestions = [],
            variant = 'default' // 'default', 'compact', 'inline', 'card', 'search', 'list'
        } = options;

        const variantClass = variant !== 'default' ? `empty-state--${variant}` : '';

        // Use SVG icon by default
        const iconHTML = icon ? `<div class="empty-icon">${icon}</div>` : `
            <div class="empty-visual">
                <svg class="empty-icon-svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            </div>
        `;

        el.innerHTML = `
            <div class="empty-state ${variantClass}" role="status">
                ${iconHTML}
                ${title ? `<h3 class="empty-title">${this.escapeHtml(title)}</h3>` : ''}
                <p class="empty-message">${this.escapeHtml(message)}</p>
                <div class="empty-actions">
                    ${action ? `
                        <button class="empty-action-btn btn-empty-action" data-empty-action>
                            ${this.escapeHtml(actionLabel)}
                        </button>
                    ` : ''}
                    ${secondaryAction ? `
                        <button class="btn-empty-secondary" data-empty-secondary>
                            ${this.escapeHtml(secondaryLabel)}
                        </button>
                    ` : ''}
                </div>
                ${suggestions.length > 0 ? `
                    <div class="empty-suggestions">
                        <p class="empty-suggestions-label">You might try:</p>
                        <div class="empty-suggestions-list">
                            ${suggestions.map(s => `
                                <button class="empty-suggestion-chip" data-suggestion="${this.escapeHtml(s)}">
                                    ${this.escapeHtml(s)}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Attach event listeners
        if (action && typeof action === 'function') {
            const actionBtn = el.querySelector('[data-empty-action]');
            if (actionBtn) {
                actionBtn.addEventListener('click', action);
            }
        }

        if (secondaryAction && typeof secondaryAction === 'function') {
            const secondaryBtn = el.querySelector('[data-empty-secondary]');
            if (secondaryBtn) {
                secondaryBtn.addEventListener('click', secondaryAction);
            }
        }

        // Suggestion click handlers
        if (suggestions.length > 0 && options.onSuggestionClick) {
            el.querySelectorAll('[data-suggestion]').forEach(chip => {
                chip.addEventListener('click', () => {
                    options.onSuggestionClick(chip.dataset.suggestion);
                });
            });
        }
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

    /**
     * Generate entity-specific skeleton cards
     * @param {string} entityType - Type of entity ('deity', 'creature', 'hero', 'item', 'place')
     * @param {number} count - Number of cards
     * @returns {string} HTML for skeleton cards
     */
    generateEntitySkeletons(entityType, count = 6) {
        const templates = {
            deity: this.generateDeitySkeletonCard,
            creature: this.generateCreatureSkeletonCard,
            hero: this.generateHeroSkeletonCard,
            item: this.generateItemSkeletonCard,
            place: this.generatePlaceSkeletonCard,
            default: this.generateEntitySkeletonCard
        };

        const template = templates[entityType] || templates.default;
        let html = '<div class="skeleton-grid">';

        for (let i = 0; i < count; i++) {
            html += `<div class="skeleton-grid-item" style="--item-index: ${i}">`;
            html += template.call(this);
            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    generateEntitySkeletonCard() {
        return `
            <div class="skeleton-entity-card skeleton shimmer-container">
                <div class="skeleton-entity-card-header">
                    <div class="skeleton-entity-icon skeleton"></div>
                    <div class="skeleton-entity-title skeleton"></div>
                </div>
                <div class="skeleton-entity-badges">
                    <div class="skeleton-mythology-badge skeleton"></div>
                    <div class="skeleton-type-badge skeleton"></div>
                </div>
                <div class="skeleton-entity-description">
                    <div class="skeleton-text skeleton full"></div>
                    <div class="skeleton-text skeleton three-quarter"></div>
                </div>
            </div>
        `;
    },

    generateDeitySkeletonCard() {
        return `
            <div class="skeleton-deity-card shimmer-container">
                <div class="skeleton-deity-portrait skeleton"></div>
                <div class="skeleton-deity-info">
                    <div class="skeleton-deity-name skeleton"></div>
                    <div class="skeleton-deity-domain skeleton"></div>
                    <div class="skeleton-deity-attributes">
                        <div class="skeleton-attribute skeleton"></div>
                        <div class="skeleton-attribute skeleton"></div>
                        <div class="skeleton-attribute skeleton"></div>
                    </div>
                </div>
            </div>
        `;
    },

    generateCreatureSkeletonCard() {
        return `
            <div class="skeleton-creature-card shimmer-container">
                <div class="skeleton-creature-silhouette skeleton"></div>
                <div class="skeleton-creature-info">
                    <div class="skeleton-creature-name skeleton"></div>
                    <div class="skeleton-creature-type skeleton"></div>
                    <div class="skeleton-creature-origin skeleton"></div>
                </div>
            </div>
        `;
    },

    generateHeroSkeletonCard() {
        return `
            <div class="skeleton-hero-card shimmer-container">
                <div class="skeleton-hero-emblem skeleton"></div>
                <div class="skeleton-hero-info">
                    <div class="skeleton-hero-name skeleton"></div>
                    <div class="skeleton-hero-title skeleton"></div>
                    <div class="skeleton-hero-feats">
                        <div class="skeleton-feat skeleton"></div>
                        <div class="skeleton-feat skeleton"></div>
                    </div>
                </div>
            </div>
        `;
    },

    generateItemSkeletonCard() {
        return `
            <div class="skeleton-item-card shimmer-container">
                <div class="skeleton-item-icon skeleton"></div>
                <div class="skeleton-item-info">
                    <div class="skeleton-item-name skeleton"></div>
                    <div class="skeleton-item-power skeleton"></div>
                    <div class="skeleton-item-owner skeleton"></div>
                </div>
            </div>
        `;
    },

    generatePlaceSkeletonCard() {
        return `
            <div class="skeleton-place-card shimmer-container">
                <div class="skeleton-place-image skeleton"></div>
                <div class="skeleton-place-overlay">
                    <div class="skeleton-place-name skeleton"></div>
                    <div class="skeleton-place-region skeleton"></div>
                </div>
            </div>
        `;
    },

    // ============================================
    // Form Submission Loading States
    // ============================================

    /**
     * Show form submission loading state
     * @param {HTMLFormElement|string} form - Form element or selector
     * @param {string} message - Loading message
     */
    showFormSubmitting(form, message = 'Submitting...') {
        const el = typeof form === 'string' ? document.querySelector(form) : form;
        if (!el) return;

        el.classList.add('form-submitting');

        const overlay = document.createElement('div');
        overlay.className = 'form-submit-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner loading-spinner--md"></div>
            <p class="form-submit-message">${this.escapeHtml(message)}</p>
        `;

        el.style.position = 'relative';
        el.appendChild(overlay);
    },

    /**
     * Hide form submission loading state
     * @param {HTMLFormElement|string} form - Form element or selector
     */
    hideFormSubmitting(form) {
        const el = typeof form === 'string' ? document.querySelector(form) : form;
        if (!el) return;

        el.classList.remove('form-submitting');
        const overlay = el.querySelector('.form-submit-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Set button loading state
     * @param {HTMLButtonElement|string} button - Button element or selector
     * @param {boolean} loading - Whether button is loading
     * @param {string} loadingText - Text to show while loading
     */
    setButtonLoading(button, loading = true, loadingText = null) {
        const el = typeof button === 'string' ? document.querySelector(button) : button;
        if (!el) return;

        if (loading) {
            el._originalText = el.innerHTML;
            el._originalDisabled = el.disabled;
            el.classList.add('btn-loading');
            el.disabled = true;

            const spinnerHTML = '<span class="btn-spinner"><span class="loading-spinner loading-spinner--sm"></span></span>';
            const textHTML = `<span class="btn-text">${loadingText || el.textContent}</span>`;
            el.innerHTML = spinnerHTML + textHTML;
        } else {
            el.classList.remove('btn-loading');
            el.disabled = el._originalDisabled || false;
            if (el._originalText) {
                el.innerHTML = el._originalText;
            }
        }
    },

    // ============================================
    // File Upload Progress
    // ============================================

    /**
     * Show file upload progress
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} fileInfo - File information { name, size }
     * @param {number} progress - Upload progress (0-100)
     */
    showUploadProgress(container, fileInfo, progress = 0) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const { name = 'File', size = 0 } = fileInfo;
        const formattedSize = this.formatFileSize(size);

        el.innerHTML = `
            <div class="upload-progress-container">
                <div class="upload-file-info">
                    <div class="upload-file-icon">📄</div>
                    <div class="upload-file-details">
                        <div class="upload-file-name">${this.escapeHtml(name)}</div>
                        <div class="upload-file-size">${formattedSize}</div>
                    </div>
                </div>
                <div class="upload-progress-bar">
                    ${this.getProgressBarHTML(progress, { showPercent: true })}
                </div>
                <div class="upload-progress-status">
                    <span>Uploading...</span>
                    <span>${Math.round(progress)}%</span>
                </div>
            </div>
        `;
    },

    /**
     * Update upload progress
     * @param {HTMLElement|string} container - Container element or selector
     * @param {number} progress - Upload progress (0-100)
     */
    updateUploadProgress(container, progress) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        this.updateProgress(el, progress);

        const statusEl = el.querySelector('.upload-progress-status span:last-child');
        if (statusEl) {
            statusEl.textContent = `${Math.round(progress)}%`;
        }
    },

    /**
     * Show upload complete
     * @param {HTMLElement|string} container - Container element or selector
     */
    showUploadComplete(container) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const statusEl = el.querySelector('.upload-progress-status');
        if (statusEl) {
            statusEl.classList.add('upload-progress-status--success');
            statusEl.innerHTML = '<span>Upload complete</span><span>100%</span>';
        }

        this.updateProgress(el, 100);
    },

    /**
     * Show upload error
     * @param {HTMLElement|string} container - Container element or selector
     * @param {string} error - Error message
     */
    showUploadError(container, error = 'Upload failed') {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const statusEl = el.querySelector('.upload-progress-status');
        if (statusEl) {
            statusEl.classList.add('upload-progress-status--error');
            statusEl.innerHTML = `<span>${this.escapeHtml(error)}</span><span>Failed</span>`;
        }
    },

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    /**
     * Transition from loading to content with smooth animation
     * @param {HTMLElement|string} container - Container element
     * @param {string} content - HTML content to show
     * @param {Object} options - Transition options
     */
    async transitionToContent(container, content, options = {}) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;

        const { minDelay = this.config.minLoadingTime } = options;

        // Ensure minimum loading time
        const loadingState = el._loadingState;
        if (loadingState) {
            const elapsed = Date.now() - loadingState.startTime;
            if (elapsed < minDelay) {
                await new Promise(r => setTimeout(r, minDelay - elapsed));
            }
        }

        // Fade out loading
        const loadingEl = el.querySelector('.loading-state, .skeleton-container');
        if (loadingEl) {
            loadingEl.classList.add('content-fade-exit');
            loadingEl.classList.add('content-fade-exit-active');
            await new Promise(r => setTimeout(r, this.config.fadeOutDuration));
        }

        // Set new content
        el.innerHTML = content;

        // Fade in content
        const newContent = el.firstElementChild;
        if (newContent) {
            newContent.classList.add('content-fade-enter');
            requestAnimationFrame(() => {
                newContent.classList.add('content-fade-enter-active');
                newContent.classList.remove('content-fade-enter');
            });
        }

        // Clear loading state reference
        delete el._loadingState;
    },

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
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
