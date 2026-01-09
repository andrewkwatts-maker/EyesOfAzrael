/**
 * Navigation Enhancements Component
 * Provides UX polish for navigation including:
 * - Scroll-to-top button
 * - Keyboard shortcuts hint and modal
 * - Navigation loading indicator
 * - Focus management
 *
 * @version 1.0.0
 * @author Eyes of Azrael
 */

class NavigationEnhancements {
    constructor() {
        this.scrollToTopBtn = null;
        this.keyboardShortcutsHint = null;
        this.keyboardShortcutsModal = null;
        this.navLoadingIndicator = null;

        // Configuration
        this.config = {
            scrollToTopThreshold: 400,
            showKeyboardHintAfter: 5000, // Show hint after 5 seconds
            hideKeyboardHintOnScroll: true
        };

        // State
        this.isKeyboardUser = false;
        this.hasShownKeyboardHint = false;
        this.keyboardHintDismissed = false;

        // Keyboard shortcuts definition
        this.shortcuts = [
            { keys: ['Alt', 'ArrowLeft'], label: 'Go back', action: () => window.history.back() },
            { keys: ['Alt', 'ArrowRight'], label: 'Go forward', action: () => window.history.forward() },
            { keys: ['Alt', 'Home'], label: 'Go to home', action: () => window.location.hash = '#/' },
            { keys: ['/'], label: 'Focus search', action: () => this.focusSearch() },
            { keys: ['?'], label: 'Show shortcuts', action: () => this.showKeyboardShortcuts() },
            { keys: ['Escape'], label: 'Close modal / menu', action: null }
        ];

        // Bind methods
        this.handleScroll = this.handleScroll.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleScrollToTop = this.handleScrollToTop.bind(this);
    }

    /**
     * Initialize all enhancements
     */
    init() {
        console.log('[NavigationEnhancements] Initializing...');

        this.createScrollToTopButton();
        this.createKeyboardShortcutsHint();
        this.createKeyboardShortcutsModal();
        this.createNavLoadingIndicator();
        this.setupEventListeners();
        this.checkInitialScroll();

        // Show keyboard hint after delay (for desktop users)
        if (window.innerWidth > 768) {
            setTimeout(() => {
                this.showKeyboardHint();
            }, this.config.showKeyboardHintAfter);
        }

        console.log('[NavigationEnhancements] Initialized');
    }

    /**
     * Create scroll-to-top button
     */
    createScrollToTopButton() {
        if (document.querySelector('.scroll-to-top-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'scroll-to-top-btn';
        btn.setAttribute('aria-label', 'Scroll to top of page');
        btn.setAttribute('type', 'button');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="18 15 12 9 6 15"/>
            </svg>
        `;

        document.body.appendChild(btn);
        this.scrollToTopBtn = btn;

        btn.addEventListener('click', this.handleScrollToTop);
    }

    /**
     * Create keyboard shortcuts hint
     */
    createKeyboardShortcutsHint() {
        if (document.querySelector('.keyboard-shortcuts-hint')) return;

        const hint = document.createElement('button');
        hint.className = 'keyboard-shortcuts-hint';
        hint.setAttribute('aria-label', 'View keyboard shortcuts');
        hint.setAttribute('type', 'button');
        hint.innerHTML = `
            <svg class="keyboard-shortcuts-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01"/>
                <path d="M6 12h.01M10 12h4M18 12h.01"/>
                <path d="M6 16h12"/>
            </svg>
            <span>Press <kbd>?</kbd> for shortcuts</span>
        `;

        document.body.appendChild(hint);
        this.keyboardShortcutsHint = hint;

        hint.addEventListener('click', () => this.showKeyboardShortcuts());
    }

    /**
     * Create keyboard shortcuts modal
     */
    createKeyboardShortcutsModal() {
        if (document.querySelector('.keyboard-shortcuts-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'keyboard-shortcuts-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'keyboard-shortcuts-title');
        modal.setAttribute('aria-modal', 'true');

        modal.innerHTML = `
            <div class="keyboard-shortcuts-modal-backdrop"></div>
            <div class="keyboard-shortcuts-modal-content">
                <div class="keyboard-shortcuts-modal-header">
                    <h3 id="keyboard-shortcuts-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01"/>
                            <path d="M6 12h.01M10 12h4M18 12h.01"/>
                            <path d="M6 16h12"/>
                        </svg>
                        Keyboard Shortcuts
                    </h3>
                    <button class="keyboard-shortcuts-modal-close" aria-label="Close shortcuts">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="keyboard-shortcuts-list">
                    ${this.shortcuts.map(shortcut => `
                        <div class="keyboard-shortcut-item">
                            <span class="keyboard-shortcut-label">${shortcut.label}</span>
                            <span class="keyboard-shortcut-keys">
                                ${shortcut.keys.map((key, i) => `
                                    <kbd>${this.formatKeyName(key)}</kbd>
                                    ${i < shortcut.keys.length - 1 ? '<span class="key-plus">+</span>' : ''}
                                `).join('')}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.keyboardShortcutsModal = modal;

        // Close handlers
        const backdrop = modal.querySelector('.keyboard-shortcuts-modal-backdrop');
        const closeBtn = modal.querySelector('.keyboard-shortcuts-modal-close');

        backdrop.addEventListener('click', () => this.hideKeyboardShortcuts());
        closeBtn.addEventListener('click', () => this.hideKeyboardShortcuts());
    }

    /**
     * Create navigation loading indicator
     */
    createNavLoadingIndicator() {
        if (document.querySelector('.nav-loading-indicator')) return;

        const indicator = document.createElement('div');
        indicator.className = 'nav-loading-indicator';
        indicator.setAttribute('role', 'progressbar');
        indicator.setAttribute('aria-label', 'Page loading');

        document.body.prepend(indicator);
        this.navLoadingIndicator = indicator;

        // Listen for navigation events
        document.addEventListener('navigation-start', () => this.showLoadingIndicator());
        document.addEventListener('navigation-complete', () => this.hideLoadingIndicator());
        document.addEventListener('first-render-complete', () => this.hideLoadingIndicator());
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Scroll listener with throttling
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown);

        // Track keyboard vs mouse users
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.isKeyboardUser = true;
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', () => {
            this.isKeyboardUser = false;
            document.body.classList.remove('keyboard-nav');
        });

        // Hash change to update nav state
        window.addEventListener('hashchange', () => {
            this.updateActiveNavState();
        });
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const scrollY = window.scrollY;

        // Scroll to top button visibility
        if (this.scrollToTopBtn) {
            if (scrollY > this.config.scrollToTopThreshold) {
                this.scrollToTopBtn.classList.add('visible');
            } else {
                this.scrollToTopBtn.classList.remove('visible');
            }
        }

        // Hide keyboard hint on scroll
        if (this.config.hideKeyboardHintOnScroll && this.keyboardShortcutsHint && scrollY > 100) {
            this.keyboardShortcutsHint.classList.remove('visible');
        }
    }

    /**
     * Check initial scroll position
     */
    checkInitialScroll() {
        if (window.scrollY > this.config.scrollToTopThreshold && this.scrollToTopBtn) {
            this.scrollToTopBtn.classList.add('visible');
        }
    }

    /**
     * Handle scroll to top click
     */
    handleScrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Announce to screen readers
        this.announce('Scrolled to top of page');

        // Focus main content for accessibility
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const firstHeading = mainContent.querySelector('h1, h2');
            if (firstHeading) {
                firstHeading.setAttribute('tabindex', '-1');
                firstHeading.focus({ preventScroll: true });
            }
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.matches('input, textarea, select, [contenteditable="true"]')) {
            // Allow Escape in inputs
            if (e.key !== 'Escape') return;
        }

        // ? key for shortcuts (shift + /)
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            this.showKeyboardShortcuts();
            return;
        }

        // / key to focus search
        if (e.key === '/' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.focusSearch();
            return;
        }

        // Alt + Left Arrow = Back
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            window.history.back();
            return;
        }

        // Alt + Right Arrow = Forward
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            window.history.forward();
            return;
        }

        // Alt + Home = Go home
        if (e.altKey && e.key === 'Home') {
            e.preventDefault();
            window.location.hash = '#/';
            return;
        }

        // Escape key - close modal
        if (e.key === 'Escape') {
            if (this.keyboardShortcutsModal?.classList.contains('visible')) {
                this.hideKeyboardShortcuts();
            }
        }
    }

    /**
     * Focus search input
     */
    focusSearch() {
        const searchInput = document.querySelector('.search-input, #searchBox, [type="search"], input[placeholder*="search" i]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            this.announce('Search focused');
        } else {
            // Navigate to search page if not on one
            window.location.hash = '#/search';
        }
    }

    /**
     * Show keyboard shortcuts hint
     */
    showKeyboardHint() {
        if (this.keyboardHintDismissed) return;
        if (!this.hasShownKeyboardHint && this.keyboardShortcutsHint) {
            this.keyboardShortcutsHint.classList.add('visible');
            this.hasShownKeyboardHint = true;

            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.keyboardShortcutsHint?.classList.remove('visible');
            }, 10000);
        }
    }

    /**
     * Show keyboard shortcuts modal
     */
    showKeyboardShortcuts() {
        if (this.keyboardShortcutsModal) {
            this.keyboardShortcutsModal.classList.add('visible');
            this.keyboardShortcutsModal.setAttribute('aria-hidden', 'false');

            // Hide hint
            if (this.keyboardShortcutsHint) {
                this.keyboardShortcutsHint.classList.remove('visible');
                this.keyboardHintDismissed = true;
            }

            // Focus close button
            const closeBtn = this.keyboardShortcutsModal.querySelector('.keyboard-shortcuts-modal-close');
            if (closeBtn) {
                setTimeout(() => closeBtn.focus(), 100);
            }

            // Trap focus within modal
            this.trapFocus(this.keyboardShortcutsModal);
        }
    }

    /**
     * Hide keyboard shortcuts modal
     */
    hideKeyboardShortcuts() {
        if (this.keyboardShortcutsModal) {
            this.keyboardShortcutsModal.classList.remove('visible');
            this.keyboardShortcutsModal.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Show navigation loading indicator
     */
    showLoadingIndicator() {
        if (this.navLoadingIndicator) {
            this.navLoadingIndicator.classList.add('active');
        }
    }

    /**
     * Hide navigation loading indicator
     */
    hideLoadingIndicator() {
        if (this.navLoadingIndicator) {
            this.navLoadingIndicator.classList.remove('active');
        }
    }

    /**
     * Update active navigation state
     */
    updateActiveNavState() {
        const currentHash = window.location.hash || '#/';

        // Update desktop nav
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            const isActive = this.isRouteActive(href, currentHash);
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        // Update mobile nav
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            const isActive = this.isRouteActive(href, currentHash);
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    /**
     * Check if a route is active
     */
    isRouteActive(href, currentHash) {
        if (href === '#/' || href === '#') {
            return currentHash === '#/' || currentHash === '#' || currentHash === '';
        }
        return currentHash.startsWith(href) && href.length > 2;
    }

    /**
     * Format key name for display
     */
    formatKeyName(key) {
        const keyMap = {
            'ArrowLeft': '\u2190',
            'ArrowRight': '\u2192',
            'ArrowUp': '\u2191',
            'ArrowDown': '\u2193',
            'Home': 'Home',
            'Escape': 'Esc',
            'Control': 'Ctrl',
            'Meta': '\u2318'
        };
        return keyMap[key] || key;
    }

    /**
     * Announce message to screen readers
     */
    announce(message) {
        const announcer = document.getElementById('spa-route-announcer');
        if (announcer) {
            announcer.textContent = '';
            requestAnimationFrame(() => {
                announcer.textContent = message;
            });
        }
    }

    /**
     * Trap focus within element
     */
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);

        this.scrollToTopBtn?.remove();
        this.keyboardShortcutsHint?.remove();
        this.keyboardShortcutsModal?.remove();
        this.navLoadingIndicator?.remove();

        console.log('[NavigationEnhancements] Destroyed');
    }
}

// Create global instance
window.NavigationEnhancements = NavigationEnhancements;

// Initialize when DOM is ready
function initNavigationEnhancements() {
    const enhancements = new NavigationEnhancements();
    enhancements.init();
    window.navigationEnhancements = enhancements;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationEnhancements);
} else {
    initNavigationEnhancements();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationEnhancements;
}
