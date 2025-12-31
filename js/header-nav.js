/**
 * Header Navigation Controller
 * Handles dropdown menus and mobile navigation for the site header
 *
 * Features:
 * - Accessible dropdown menus with keyboard navigation
 * - Mobile slide-out navigation panel
 * - Touch-friendly interactions
 * - Escape key to close menus
 * - Click outside to close
 */

class HeaderNavController {
    constructor() {
        this.dropdowns = [];
        this.mobileMenuOpen = false;
        this.activeDropdown = null;

        // DOM elements
        this.mobileMenuToggle = null;
        this.mobileNavPanel = null;
        this.mobileNavOverlay = null;
        this.mobileNavClose = null;

        // Bind methods
        this.handleDropdownTriggerClick = this.handleDropdownTriggerClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleMobileToggle = this.handleMobileToggle.bind(this);
        this.handleMobileClose = this.handleMobileClose.bind(this);
        this.handleMobileLinkClick = this.handleMobileLinkClick.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Initialize the header navigation controller
     */
    init() {
        console.log('[HeaderNav] Initializing...');

        // Find all dropdowns
        this.dropdowns = document.querySelectorAll('.nav-dropdown');

        // Get mobile navigation elements
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.mobileNavPanel = document.getElementById('mobileNavPanel');
        this.mobileNavOverlay = document.getElementById('mobileNavOverlay');
        this.mobileNavClose = document.getElementById('mobileNavClose');

        // Set up event listeners
        this.setupDropdownListeners();
        this.setupMobileListeners();
        this.setupGlobalListeners();

        console.log(`[HeaderNav] Initialized with ${this.dropdowns.length} dropdowns`);
    }

    /**
     * Set up dropdown event listeners
     */
    setupDropdownListeners() {
        this.dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            const menu = dropdown.querySelector('.nav-dropdown-menu');

            if (!trigger || !menu) return;

            // Click handler for trigger
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleDropdownTriggerClick(dropdown, trigger);
            });

            // Keyboard navigation within menu
            const menuItems = menu.querySelectorAll('.nav-dropdown-item');
            menuItems.forEach((item, index) => {
                item.addEventListener('keydown', (e) => {
                    this.handleMenuItemKeyDown(e, menuItems, index);
                });
            });

            // Mouse enter/leave for hover behavior (desktop)
            dropdown.addEventListener('mouseenter', () => {
                if (window.innerWidth > 900) {
                    this.openDropdown(dropdown, trigger);
                }
            });

            dropdown.addEventListener('mouseleave', () => {
                if (window.innerWidth > 900) {
                    this.closeDropdown(dropdown, trigger);
                }
            });
        });
    }

    /**
     * Set up mobile navigation listeners
     */
    setupMobileListeners() {
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', this.handleMobileToggle);
        }

        // Close button
        if (this.mobileNavClose) {
            this.mobileNavClose.addEventListener('click', this.handleMobileClose);
        }

        // Overlay click to close
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.addEventListener('click', this.handleMobileClose);
        }

        // Close mobile nav when clicking links
        if (this.mobileNavPanel) {
            const links = this.mobileNavPanel.querySelectorAll('.mobile-nav-link');
            links.forEach(link => {
                link.addEventListener('click', this.handleMobileLinkClick);
            });
        }
    }

    /**
     * Set up global event listeners
     */
    setupGlobalListeners() {
        // Global keyboard handler
        document.addEventListener('keydown', this.handleKeyDown);

        // Click outside to close dropdowns
        document.addEventListener('click', this.handleClickOutside);

        // Handle window resize
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * Handle dropdown trigger click
     */
    handleDropdownTriggerClick(dropdown, trigger) {
        const isOpen = dropdown.classList.contains('open');

        // Close all other dropdowns first
        this.closeAllDropdowns();

        if (!isOpen) {
            this.openDropdown(dropdown, trigger);
        }
    }

    /**
     * Open a dropdown
     */
    openDropdown(dropdown, trigger) {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        this.activeDropdown = dropdown;

        // Focus first menu item for keyboard users
        const firstItem = dropdown.querySelector('.nav-dropdown-item');
        if (firstItem && document.activeElement === trigger) {
            // Only focus if they're using keyboard
            const isKeyboardUser = document.body.classList.contains('keyboard-nav');
            if (isKeyboardUser) {
                setTimeout(() => firstItem.focus(), 100);
            }
        }
    }

    /**
     * Close a dropdown
     */
    closeDropdown(dropdown, trigger) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');

        if (this.activeDropdown === dropdown) {
            this.activeDropdown = null;
        }
    }

    /**
     * Close all dropdowns
     */
    closeAllDropdowns() {
        this.dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.nav-dropdown-trigger');
            if (trigger) {
                this.closeDropdown(dropdown, trigger);
            }
        });
    }

    /**
     * Handle keyboard navigation within menu items
     */
    handleMenuItemKeyDown(e, items, currentIndex) {
        const key = e.key;

        switch (key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
                break;

            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
                break;

            case 'Home':
                e.preventDefault();
                items[0].focus();
                break;

            case 'End':
                e.preventDefault();
                items[items.length - 1].focus();
                break;

            case 'Escape':
                this.closeAllDropdowns();
                // Return focus to the trigger
                if (this.activeDropdown) {
                    const trigger = this.activeDropdown.querySelector('.nav-dropdown-trigger');
                    if (trigger) trigger.focus();
                }
                break;
        }
    }

    /**
     * Global keyboard handler
     */
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            // Close dropdowns
            if (this.activeDropdown) {
                const trigger = this.activeDropdown.querySelector('.nav-dropdown-trigger');
                this.closeAllDropdowns();
                if (trigger) trigger.focus();
            }

            // Close mobile menu
            if (this.mobileMenuOpen) {
                this.closeMobileNav();
            }
        }

        // Track keyboard navigation for focus styling
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    }

    /**
     * Handle click outside dropdowns
     */
    handleClickOutside(e) {
        // Check if click is outside any dropdown
        const isInsideDropdown = e.target.closest('.nav-dropdown');

        if (!isInsideDropdown && this.activeDropdown) {
            this.closeAllDropdowns();
        }

        // Remove keyboard navigation class on mouse click
        document.body.classList.remove('keyboard-nav');
    }

    /**
     * Handle mobile menu toggle
     */
    handleMobileToggle(e) {
        e.preventDefault();

        if (this.mobileMenuOpen) {
            this.closeMobileNav();
        } else {
            this.openMobileNav();
        }
    }

    /**
     * Open mobile navigation
     */
    openMobileNav() {
        this.mobileMenuOpen = true;

        // Update toggle button
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
            this.mobileMenuToggle.setAttribute('aria-label', 'Close navigation menu');
        }

        // Show overlay
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.setAttribute('aria-hidden', 'false');
            // Force reflow before adding visible class for animation
            this.mobileNavOverlay.offsetHeight;
            this.mobileNavOverlay.classList.add('visible');
        }

        // Show panel
        if (this.mobileNavPanel) {
            this.mobileNavPanel.setAttribute('aria-hidden', 'false');
            // Force reflow before adding visible class for animation
            this.mobileNavPanel.offsetHeight;
            this.mobileNavPanel.classList.add('visible');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus first link for accessibility
        setTimeout(() => {
            const firstLink = this.mobileNavPanel?.querySelector('.mobile-nav-link');
            if (firstLink) firstLink.focus();
        }, 300);

        console.log('[HeaderNav] Mobile nav opened');
    }

    /**
     * Close mobile navigation
     */
    closeMobileNav() {
        this.mobileMenuOpen = false;

        // Update toggle button
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
            this.mobileMenuToggle.setAttribute('aria-label', 'Open navigation menu');
        }

        // Hide panel first (slides out)
        if (this.mobileNavPanel) {
            this.mobileNavPanel.classList.remove('visible');
            this.mobileNavPanel.setAttribute('aria-hidden', 'true');
        }

        // Hide overlay with slight delay
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.classList.remove('visible');
            setTimeout(() => {
                this.mobileNavOverlay.setAttribute('aria-hidden', 'true');
            }, 300);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to toggle button
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.focus();
        }

        console.log('[HeaderNav] Mobile nav closed');
    }

    /**
     * Handle mobile menu close button
     */
    handleMobileClose(e) {
        e.preventDefault();
        this.closeMobileNav();
    }

    /**
     * Handle mobile link click (close menu after navigation)
     */
    handleMobileLinkClick() {
        // Small delay to allow the navigation to register
        setTimeout(() => {
            this.closeMobileNav();
        }, 100);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile menu if window is resized to desktop width
        if (window.innerWidth > 900 && this.mobileMenuOpen) {
            this.closeMobileNav();
        }

        // Close dropdowns on resize
        this.closeAllDropdowns();
    }

    /**
     * Destroy the controller (cleanup)
     */
    destroy() {
        // Remove global listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.handleClickOutside);
        window.removeEventListener('resize', this.handleResize);

        // Remove mobile listeners
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.removeEventListener('click', this.handleMobileToggle);
        }
        if (this.mobileNavClose) {
            this.mobileNavClose.removeEventListener('click', this.handleMobileClose);
        }
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.removeEventListener('click', this.handleMobileClose);
        }

        console.log('[HeaderNav] Destroyed');
    }
}

// Create global instance
window.HeaderNavController = HeaderNavController;

// Initialize when DOM is ready
function initHeaderNav() {
    const controller = new HeaderNavController();
    controller.init();
    window.headerNavController = controller;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderNav);
} else {
    initHeaderNav();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderNavController;
}
