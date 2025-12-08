/**
 * Submission Link Component
 *
 * Reusable component for adding "Submit Content" buttons/links to pages.
 * Provides contextual awareness and multiple styling options.
 *
 * Usage:
 *   // Auto-inject FAB button
 *   SubmissionLink.autoInject();
 *
 *   // Manual placement
 *   const button = SubmissionLink.render({ style: 'inline', label: 'Add Hero' });
 *   container.innerHTML = button;
 *
 *   // Create instance
 *   const link = new SubmissionLink({ context: 'deities', style: 'card' });
 *   container.appendChild(link.element);
 */

class SubmissionLink {
    /**
     * Context detection patterns
     * Maps URL patterns to context types and labels
     */
    static CONTEXT_PATTERNS = [
        { pattern: /\/deities\//i, context: 'deity', label: 'Add Deity', icon: '➕' },
        { pattern: /\/heroes\//i, context: 'hero', label: 'Add Hero', icon: '➕' },
        { pattern: /\/creatures\//i, context: 'creature', label: 'Add Creature', icon: '➕' },
        { pattern: /\/texts\//i, context: 'text', label: 'Add Text', icon: '➕' },
        { pattern: /\/teachings\//i, context: 'teaching', label: 'Add Teaching', icon: '➕' },
        { pattern: /\/theology\//i, context: 'theology', label: 'Add Theology', icon: '➕' },
        { pattern: /\/lineage\//i, context: 'lineage', label: 'Add Lineage', icon: '➕' },
        { pattern: /\/mythos\/(christian|jewish|greek|norse|egyptian)/i, context: 'mythology', label: 'Submit Content', icon: '➕' },
        { pattern: /\/theories\//i, context: 'theory', label: 'Submit Theory', icon: '📝' }
    ];

    /**
     * Default submission URL
     */
    static DEFAULT_SUBMISSION_URL = '/theories/user-submissions/submit.html';

    /**
     * Constructor
     * @param {Object} options - Configuration options
     * @param {string} options.style - Button style: 'fab', 'inline', 'dropdown', 'card'
     * @param {string} options.label - Custom label text
     * @param {string} options.icon - Custom icon
     * @param {string} options.context - Force specific context
     * @param {string} options.url - Custom submission URL
     * @param {string} options.className - Additional CSS classes
     */
    constructor(options = {}) {
        this.options = {
            style: options.style || 'fab',
            label: options.label || null,
            icon: options.icon || null,
            context: options.context || null,
            url: options.url || null,
            className: options.className || ''
        };

        // Detect context if not provided
        if (!this.options.context) {
            this.options.context = this.detectContext();
        }

        // Set label and icon based on context
        this.setContextualDefaults();

        // Create element
        this.element = this.createElement();
    }

    /**
     * Detect page context from URL
     * @returns {Object} Context information
     */
    detectContext() {
        const path = window.location.pathname;

        for (const pattern of SubmissionLink.CONTEXT_PATTERNS) {
            if (pattern.pattern.test(path)) {
                return {
                    type: pattern.context,
                    label: pattern.label,
                    icon: pattern.icon
                };
            }
        }

        // Default context
        return {
            type: 'general',
            label: 'Contribute',
            icon: '➕'
        };
    }

    /**
     * Set default label and icon based on context
     */
    setContextualDefaults() {
        if (typeof this.options.context === 'object') {
            if (!this.options.label) {
                this.options.label = this.options.context.label;
            }
            if (!this.options.icon) {
                this.options.icon = this.options.context.icon;
            }
        }

        // Ensure defaults
        if (!this.options.label) {
            this.options.label = 'Contribute';
        }
        if (!this.options.icon) {
            this.options.icon = '➕';
        }
    }

    /**
     * Get submission URL based on context
     * @returns {string} Submission URL
     */
    getSubmissionUrl() {
        if (this.options.url) {
            return this.options.url;
        }

        // Calculate relative path to submission page
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;
        const prefix = depth > 0 ? '../'.repeat(depth) : './';

        return `${prefix}theories/user-submissions/submit.html`;
    }

    /**
     * Create button element
     * @returns {HTMLElement} Button element
     */
    createElement() {
        const url = this.getSubmissionUrl();
        const { style, label, icon, className } = this.options;

        // Create link element
        const link = document.createElement('a');
        link.href = url;
        link.className = `submission-link submission-link--${style} ${className}`.trim();
        link.setAttribute('aria-label', label);

        // Create content based on style
        switch (style) {
            case 'fab':
                link.innerHTML = `
                    <span class="submission-link__icon">${icon}</span>
                    <span class="submission-link__label">${label}</span>
                `;
                link.setAttribute('title', label);
                break;

            case 'inline':
                link.innerHTML = `
                    <span class="submission-link__icon">${icon}</span>
                    <span class="submission-link__text">${label}</span>
                `;
                break;

            case 'dropdown':
                link.innerHTML = `
                    <span class="submission-link__icon">${icon}</span>
                    <span class="submission-link__text">${label}</span>
                `;
                break;

            case 'card':
                link.innerHTML = `
                    <span class="submission-link__icon">${icon}</span>
                    <span class="submission-link__text">${label}</span>
                `;
                break;

            default:
                link.innerHTML = `
                    <span class="submission-link__icon">${icon}</span>
                    <span class="submission-link__text">${label}</span>
                `;
        }

        return link;
    }

    /**
     * Append to container
     * @param {HTMLElement} container - Container element
     */
    appendTo(container) {
        container.appendChild(this.element);
        return this;
    }

    /**
     * Static method to render HTML string
     * @param {Object} options - Configuration options
     * @returns {string} HTML string
     */
    static render(options = {}) {
        const instance = new SubmissionLink(options);
        return instance.element.outerHTML;
    }

    /**
     * Check if current page is submission page
     * @returns {boolean} True if on submission page
     */
    static isSubmissionPage() {
        const path = window.location.pathname;
        return path.includes('/submit.html') || path.includes('/edit.html');
    }

    /**
     * Auto-inject FAB button to page
     * @param {Object} options - Configuration options
     * @returns {SubmissionLink|null} Instance or null if not injected
     */
    static autoInject(options = {}) {
        // Don't inject if already on submission page
        if (this.isSubmissionPage()) {
            return null;
        }

        // Check if FAB already exists
        if (document.querySelector('.submission-link--fab')) {
            return null;
        }

        // Wait for DOM to be ready
        const inject = () => {
            const defaultOptions = {
                style: 'fab',
                ...options
            };

            const instance = new SubmissionLink(defaultOptions);
            document.body.appendChild(instance.element);

            // Add pulse animation class after a short delay
            setTimeout(() => {
                instance.element.classList.add('submission-link--pulse');
            }, 1000);

            return instance;
        };

        // Inject when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inject);
            return null;
        } else {
            return inject();
        }
    }

    /**
     * Create inline button
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} Button element
     */
    static createInline(options = {}) {
        return new SubmissionLink({ ...options, style: 'inline' }).element;
    }

    /**
     * Create dropdown menu item
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} Menu item element
     */
    static createDropdownItem(options = {}) {
        return new SubmissionLink({ ...options, style: 'dropdown' }).element;
    }

    /**
     * Create card action button
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} Button element
     */
    static createCardButton(options = {}) {
        return new SubmissionLink({ ...options, style: 'card' }).element;
    }

    /**
     * Remove all submission links from page
     */
    static removeAll() {
        document.querySelectorAll('.submission-link').forEach(el => el.remove());
    }

    /**
     * Update all submission links with new options
     * @param {Object} options - New options
     */
    static updateAll(options = {}) {
        const links = document.querySelectorAll('.submission-link');
        links.forEach(link => {
            const style = Array.from(link.classList)
                .find(c => c.startsWith('submission-link--'))
                ?.replace('submission-link--', '');

            const instance = new SubmissionLink({ ...options, style });
            link.replaceWith(instance.element);
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubmissionLink;
}

// Make available globally
window.SubmissionLink = SubmissionLink;
