/**
 * Accessibility Manager
 * Centralized accessibility features for WCAG 2.1 AA compliance
 *
 * Features:
 * - Keyboard shortcuts management
 * - Focus trap for modals
 * - Screen reader announcements
 * - Reduced motion detection
 * - High contrast mode support
 * - Dynamic content accessibility
 */

class AccessibilityManager {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        this.focusTrapStack = [];
        this.lastFocusedElement = null;
        this.keyboardShortcutsEnabled = true;
        this.announcer = null;
        this.loadingAnnouncer = null;

        this.init();
    }

    /**
     * Initialize accessibility features
     */
    init() {
        this.createAnnouncers();
        this.setupKeyboardNavigation();
        this.setupMediaQueryListeners();
        this.observeDynamicContent();
        this.enhanceExistingContent();

        console.log('[Accessibility] Manager initialized', {
            prefersReducedMotion: this.prefersReducedMotion,
            prefersHighContrast: this.prefersHighContrast
        });
    }

    /**
     * Create screen reader announcement regions
     */
    createAnnouncers() {
        // Main announcer for route changes and general updates
        if (!document.getElementById('a11y-announcer')) {
            this.announcer = document.createElement('div');
            this.announcer.id = 'a11y-announcer';
            this.announcer.setAttribute('role', 'status');
            this.announcer.setAttribute('aria-live', 'polite');
            this.announcer.setAttribute('aria-atomic', 'true');
            this.announcer.className = 'sr-only';
            document.body.appendChild(this.announcer);
        } else {
            this.announcer = document.getElementById('a11y-announcer');
        }

        // Loading announcer for immediate feedback
        if (!document.getElementById('a11y-loading-announcer')) {
            this.loadingAnnouncer = document.createElement('div');
            this.loadingAnnouncer.id = 'a11y-loading-announcer';
            this.loadingAnnouncer.setAttribute('role', 'status');
            this.loadingAnnouncer.setAttribute('aria-live', 'assertive');
            this.loadingAnnouncer.setAttribute('aria-atomic', 'true');
            this.loadingAnnouncer.className = 'sr-only';
            document.body.appendChild(this.loadingAnnouncer);
        } else {
            this.loadingAnnouncer = document.getElementById('a11y-loading-announcer');
        }
    }

    /**
     * Setup keyboard navigation and shortcuts
     */
    setupKeyboardNavigation() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.keyboardShortcutsEnabled) return;

            // Skip to main content: Alt + 1
            if (e.altKey && e.key === '1') {
                e.preventDefault();
                this.skipToMainContent();
                return;
            }

            // Show keyboard shortcuts help: Shift + ?
            if (e.shiftKey && e.key === '?') {
                e.preventDefault();
                this.showKeyboardShortcutsHelp();
                return;
            }

            // Search: Ctrl/Cmd + K or /
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
                return;
            }
            if (e.key === '/' && !this.isInputFocused()) {
                e.preventDefault();
                this.focusSearch();
                return;
            }

            // Escape key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }

            // Tab key handling for focus trap
            if (e.key === 'Tab' && this.focusTrapStack.length > 0) {
                this.handleTabKey(e);
            }
        });

        // Enhance all interactive elements
        this.setupInteractiveElements();
    }

    /**
     * Check if an input element is currently focused
     */
    isInputFocused() {
        const activeElement = document.activeElement;
        const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
        return inputTags.includes(activeElement.tagName) ||
               activeElement.isContentEditable ||
               activeElement.getAttribute('role') === 'textbox';
    }

    /**
     * Setup interactive elements with proper keyboard support
     */
    setupInteractiveElements() {
        // Add keyboard support to clickable elements without proper roles
        document.querySelectorAll('[data-clickable]:not([role]):not(button):not(a)').forEach(el => {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            if (!el.hasAttribute('role')) {
                el.setAttribute('role', 'button');
            }
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        });
    }

    /**
     * Setup media query listeners for accessibility preferences
     */
    setupMediaQueryListeners() {
        // Reduced motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', (e) => {
            this.prefersReducedMotion = e.matches;
            document.documentElement.classList.toggle('reduce-motion', e.matches);
            this.announce(e.matches ? 'Reduced motion enabled' : 'Reduced motion disabled');
        });

        // High contrast preference
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        contrastQuery.addEventListener('change', (e) => {
            this.prefersHighContrast = e.matches;
            document.documentElement.classList.toggle('high-contrast', e.matches);
            this.announce(e.matches ? 'High contrast mode enabled' : 'High contrast mode disabled');
        });

        // Initialize classes
        if (this.prefersReducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        }
        if (this.prefersHighContrast) {
            document.documentElement.classList.add('high-contrast');
        }
    }

    /**
     * Observe dynamic content for accessibility updates
     */
    observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.enhanceElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Enhance dynamically added elements
     */
    enhanceElement(element) {
        // Add keyboard support to cards and clickable elements
        const cards = element.querySelectorAll ?
            element.querySelectorAll('.entity-card, .category-card, .landing-category-card, .mythology-card, [data-clickable]') :
            [];

        cards.forEach(card => {
            if (!card.hasAttribute('tabindex') && !card.matches('a, button')) {
                card.setAttribute('tabindex', '0');
            }
            if (!card.hasAttribute('role') && !card.matches('a, button')) {
                card.setAttribute('role', 'button');
            }
        });

        // Ensure images have alt text
        const images = element.querySelectorAll ? element.querySelectorAll('img:not([alt])') : [];
        images.forEach(img => {
            // If decorative, set empty alt
            if (img.classList.contains('decorative') || img.getAttribute('aria-hidden') === 'true') {
                img.setAttribute('alt', '');
            } else {
                // Try to derive alt from context
                const label = img.closest('[aria-label]')?.getAttribute('aria-label') ||
                             img.closest('figure')?.querySelector('figcaption')?.textContent ||
                             img.getAttribute('title') ||
                             'Image';
                img.setAttribute('alt', label);
            }
        });

        // Ensure buttons have accessible names
        const buttons = element.querySelectorAll ?
            element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])') :
            [];

        buttons.forEach(btn => {
            if (!btn.textContent.trim() && !btn.querySelector('svg[aria-label]')) {
                // Check for title attribute
                const title = btn.getAttribute('title');
                if (title) {
                    btn.setAttribute('aria-label', title);
                }
            }
        });

        // Add aria-describedby for form fields with help text
        const formFields = element.querySelectorAll ?
            element.querySelectorAll('input, textarea, select') :
            [];

        formFields.forEach(field => {
            const wrapper = field.closest('.form-field, .form-group');
            if (wrapper) {
                const helpText = wrapper.querySelector('.form-help-text, .field-description');
                if (helpText && helpText.id && !field.getAttribute('aria-describedby')?.includes(helpText.id)) {
                    const currentDescribedBy = field.getAttribute('aria-describedby') || '';
                    field.setAttribute('aria-describedby', (currentDescribedBy + ' ' + helpText.id).trim());
                }
            }
        });
    }

    /**
     * Enhance existing content on page load
     */
    enhanceExistingContent() {
        this.enhanceElement(document.body);
    }

    /**
     * Skip to main content
     */
    skipToMainContent() {
        const mainContent = document.getElementById('main-content') ||
                           document.querySelector('main') ||
                           document.querySelector('[role="main"]');

        if (mainContent) {
            // Ensure main content is focusable
            if (!mainContent.hasAttribute('tabindex')) {
                mainContent.setAttribute('tabindex', '-1');
            }
            mainContent.focus({ preventScroll: false });
            mainContent.scrollIntoView({ behavior: this.prefersReducedMotion ? 'instant' : 'smooth' });
            this.announce('Skipped to main content');
        }
    }

    /**
     * Focus search input
     */
    focusSearch() {
        const searchInput = document.querySelector(
            '#search-input, ' +
            '.search-input, ' +
            'input[type="search"], ' +
            'input[name="search"], ' +
            '[role="searchbox"]'
        );

        if (searchInput) {
            searchInput.focus();
            this.announce('Search field focused');
        } else {
            // Navigate to search page
            if (window.location.hash !== '#/search') {
                window.location.hash = '#/search';
                this.announce('Navigating to search page');
            }
        }
    }

    /**
     * Show keyboard shortcuts help dialog
     */
    showKeyboardShortcutsHelp() {
        // Check if dialog already exists
        let dialog = document.querySelector('.keyboard-shortcuts-dialog');
        let overlay = document.querySelector('.keyboard-shortcuts-overlay');

        if (dialog && !dialog.hasAttribute('aria-hidden')) {
            // Already open, close it
            this.closeKeyboardShortcutsHelp();
            return;
        }

        // Create overlay
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'keyboard-shortcuts-overlay';
            overlay.addEventListener('click', () => this.closeKeyboardShortcutsHelp());
            document.body.appendChild(overlay);
        }
        overlay.removeAttribute('aria-hidden');

        // Create or show dialog
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.className = 'keyboard-shortcuts-dialog';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('aria-labelledby', 'keyboard-shortcuts-title');

            dialog.innerHTML = `
                <h2 id="keyboard-shortcuts-title">Keyboard Shortcuts</h2>
                <button class="close-btn" aria-label="Close keyboard shortcuts">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
                <ul class="keyboard-shortcuts-list">
                    <li>
                        <span class="shortcut-description">Skip to main content</span>
                        <span class="shortcut-key"><kbd>Alt</kbd><span>+</span><kbd>1</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Open search</span>
                        <span class="shortcut-key"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Quick search</span>
                        <span class="shortcut-key"><kbd>/</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Go back</span>
                        <span class="shortcut-key"><kbd>Alt</kbd><span>+</span><kbd>&#8592;</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Go forward</span>
                        <span class="shortcut-key"><kbd>Alt</kbd><span>+</span><kbd>&#8594;</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Go to home</span>
                        <span class="shortcut-key"><kbd>Alt</kbd><span>+</span><kbd>Home</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Close modal/dialog</span>
                        <span class="shortcut-key"><kbd>Esc</kbd></span>
                    </li>
                    <li>
                        <span class="shortcut-description">Show this help</span>
                        <span class="shortcut-key"><kbd>Shift</kbd><span>+</span><kbd>?</kbd></span>
                    </li>
                </ul>
            `;

            document.body.appendChild(dialog);

            // Setup close button
            dialog.querySelector('.close-btn').addEventListener('click', () => {
                this.closeKeyboardShortcutsHelp();
            });
        }

        dialog.removeAttribute('aria-hidden');

        // Focus the dialog
        this.trapFocus(dialog);
        dialog.querySelector('.close-btn').focus();

        this.announce('Keyboard shortcuts dialog opened. Press Escape to close.');
    }

    /**
     * Close keyboard shortcuts help dialog
     */
    closeKeyboardShortcutsHelp() {
        const dialog = document.querySelector('.keyboard-shortcuts-dialog');
        const overlay = document.querySelector('.keyboard-shortcuts-overlay');

        if (dialog) {
            dialog.setAttribute('aria-hidden', 'true');
        }
        if (overlay) {
            overlay.setAttribute('aria-hidden', 'true');
        }

        this.releaseFocusTrap();
        this.announce('Keyboard shortcuts dialog closed');
    }

    /**
     * Handle escape key
     */
    handleEscapeKey() {
        // Close keyboard shortcuts dialog
        const shortcutsDialog = document.querySelector('.keyboard-shortcuts-dialog:not([aria-hidden="true"])');
        if (shortcutsDialog) {
            this.closeKeyboardShortcutsHelp();
            return;
        }

        // Close any open modals
        const openModals = document.querySelectorAll(
            '.modal:not([aria-hidden="true"]), ' +
            '[role="dialog"]:not([aria-hidden="true"]), ' +
            '.lightbox:not([aria-hidden="true"])'
        );

        if (openModals.length > 0) {
            const lastModal = openModals[openModals.length - 1];
            const closeBtn = lastModal.querySelector('[aria-label*="lose"], .close-btn, .modal-close');
            if (closeBtn) {
                closeBtn.click();
            }
        }
    }

    /**
     * Trap focus within an element
     */
    trapFocus(element) {
        this.lastFocusedElement = document.activeElement;
        this.focusTrapStack.push(element);

        const focusableElements = this.getFocusableElements(element);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Handle tab key within focus trap
     */
    handleTabKey(e) {
        const currentTrap = this.focusTrapStack[this.focusTrapStack.length - 1];
        if (!currentTrap) return;

        const focusableElements = this.getFocusableElements(currentTrap);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Release focus trap
     */
    releaseFocusTrap() {
        this.focusTrapStack.pop();

        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
    }

    /**
     * Get focusable elements within a container
     */
    getFocusableElements(container) {
        const selector = [
            'a[href]:not([disabled]):not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'input:not([disabled]):not([tabindex="-1"]):not([type="hidden"])',
            'select:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"]):not([disabled])',
            '[contenteditable="true"]:not([disabled])'
        ].join(', ');

        return Array.from(container.querySelectorAll(selector)).filter(el => {
            return el.offsetParent !== null; // Only visible elements
        });
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        const announcer = priority === 'assertive' ? this.loadingAnnouncer : this.announcer;
        if (!announcer) return;

        // Clear and set message for announcement
        announcer.textContent = '';
        requestAnimationFrame(() => {
            announcer.textContent = message;
        });
    }

    /**
     * Announce loading state
     */
    announceLoading(isLoading, message = 'Loading content') {
        if (isLoading) {
            this.announce(message, 'assertive');
        } else {
            this.announce('Content loaded', 'polite');
        }
    }

    /**
     * Announce page change
     */
    announcePageChange(pageName) {
        this.announce(`Navigated to ${pageName}`);
    }

    /**
     * Announce form errors
     */
    announceFormError(errorMessage) {
        this.announce(`Error: ${errorMessage}`, 'assertive');
    }

    /**
     * Announce success message
     */
    announceSuccess(message) {
        this.announce(message);
    }

    /**
     * Check if reduced motion is preferred
     */
    shouldReduceMotion() {
        return this.prefersReducedMotion;
    }

    /**
     * Get appropriate animation duration
     */
    getAnimationDuration(normalDuration) {
        return this.prefersReducedMotion ? 0 : normalDuration;
    }

    /**
     * Enable/disable keyboard shortcuts
     */
    setKeyboardShortcutsEnabled(enabled) {
        this.keyboardShortcutsEnabled = enabled;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.AccessibilityManager = AccessibilityManager;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.a11yManager = new AccessibilityManager();
        });
    } else {
        window.a11yManager = new AccessibilityManager();
    }

    console.log('[AccessibilityManager] Module loaded');
}
