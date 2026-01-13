/**
 * Accessibility Manager Module
 * Screen reader announcements and focus management for SPA navigation
 *
 * Usage:
 *   AccessibilityManager.init();
 *   AccessibilityManager.announceRouteChange('Home');
 *   AccessibilityManager.announceLoading(true, 'Loading content');
 *   AccessibilityManager.manageFocus();
 */

const AccessibilityManager = {
    _initialized: false,
    _routeAnnouncerId: 'spa-route-announcer',
    _loadingAnnouncerId: 'spa-loading-announcer',

    /**
     * Visually hidden styles for screen reader only content
     */
    _srOnlyStyles: `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    `,

    /**
     * Initialize accessibility features
     * Creates ARIA live regions for announcements
     */
    init() {
        if (this._initialized) return;

        this._createRouteAnnouncer();
        this._createLoadingAnnouncer();
        this._initialized = true;
    },

    /**
     * Create the route change announcer element
     * @private
     */
    _createRouteAnnouncer() {
        if (document.getElementById(this._routeAnnouncerId)) return;

        const announcer = document.createElement('div');
        announcer.id = this._routeAnnouncerId;
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = this._srOnlyStyles;
        document.body.appendChild(announcer);
    },

    /**
     * Create the loading state announcer element
     * @private
     */
    _createLoadingAnnouncer() {
        if (document.getElementById(this._loadingAnnouncerId)) return;

        const announcer = document.createElement('div');
        announcer.id = this._loadingAnnouncerId;
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.style.cssText = this._srOnlyStyles;
        document.body.appendChild(announcer);
    },

    /**
     * Announce a route change to screen readers
     * @param {string} routeName - Human-readable route name
     */
    announceRouteChange(routeName) {
        const announcer = document.getElementById(this._routeAnnouncerId);
        if (!announcer) return;

        const message = `Navigated to ${routeName}`;

        // Clear and set to trigger announcement
        announcer.textContent = '';
        requestAnimationFrame(() => {
            announcer.textContent = message;
        });
    },

    /**
     * Announce loading state to screen readers
     * @param {boolean} isLoading - Whether loading is in progress
     * @param {string} message - Custom loading message
     */
    announceLoading(isLoading, message = 'Loading page') {
        const announcer = document.getElementById(this._loadingAnnouncerId);
        if (!announcer) return;

        announcer.textContent = '';
        if (isLoading) {
            requestAnimationFrame(() => {
                announcer.textContent = message;
            });
        }
    },

    /**
     * Custom announcement with specified priority
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        const announcerId = priority === 'assertive'
            ? this._loadingAnnouncerId
            : this._routeAnnouncerId;

        const announcer = document.getElementById(announcerId);
        if (!announcer) return;

        announcer.textContent = '';
        requestAnimationFrame(() => {
            announcer.textContent = message;
        });
    },

    /**
     * Manage focus after navigation for accessibility
     * Moves focus to main content area
     * @param {string} containerId - ID of the main content container
     */
    manageFocus(containerId = 'main-content') {
        const mainContent = document.getElementById(containerId);
        if (!mainContent) return;

        // Find the first focusable element or heading in main content
        const focusTarget = mainContent.querySelector(
            'h1, h2, [tabindex="-1"], a, button, input'
        );

        if (focusTarget) {
            // Make heading focusable if it's a heading without tabindex
            if (focusTarget.tagName.match(/^H[1-6]$/) && !focusTarget.hasAttribute('tabindex')) {
                focusTarget.setAttribute('tabindex', '-1');
            }

            // Delay focus slightly to ensure content is rendered
            requestAnimationFrame(() => {
                focusTarget.focus({ preventScroll: true });
            });
        }
    },

    /**
     * Set focus to a specific element
     * @param {HTMLElement|string} target - Element or selector to focus
     * @param {Object} options - Focus options
     */
    setFocus(target, options = { preventScroll: true }) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!element) return;

        // Make non-focusable elements focusable
        if (!element.hasAttribute('tabindex') && !element.matches('a, button, input, select, textarea')) {
            element.setAttribute('tabindex', '-1');
        }

        requestAnimationFrame(() => {
            element.focus(options);
        });
    },

    /**
     * Create a skip link for keyboard navigation
     * @param {string} targetId - ID of element to skip to
     * @param {string} text - Skip link text
     */
    createSkipLink(targetId, text = 'Skip to main content') {
        if (document.querySelector('.skip-link')) return;

        const skipLink = document.createElement('a');
        skipLink.href = `#${targetId}`;
        skipLink.className = 'skip-link';
        skipLink.textContent = text;
        skipLink.style.cssText = `
            ${this._srOnlyStyles}
            &:focus {
                position: fixed;
                top: 10px;
                left: 10px;
                width: auto;
                height: auto;
                padding: 10px 20px;
                margin: 0;
                overflow: visible;
                clip: auto;
                z-index: 10000;
                background: var(--bg-primary, #fff);
                color: var(--text-primary, #000);
                border: 2px solid currentColor;
            }
        `;

        document.body.insertBefore(skipLink, document.body.firstChild);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}

// Export to window for browser usage
window.AccessibilityManager = AccessibilityManager;
