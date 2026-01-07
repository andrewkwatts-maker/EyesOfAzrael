/**
 * Header Navigation Controller
 * Handles the site header, dropdowns, user menu, theme picker, and mobile navigation
 *
 * Features:
 * - Accessible dropdown menus with keyboard navigation
 * - Mobile slide-out navigation panel from right
 * - User menu with avatar/initials dropdown
 * - Theme picker with preview thumbnails
 * - Sticky header with scroll shadow
 * - Touch-friendly interactions
 * - Escape key to close menus
 * - Click outside to close
 */

class HeaderNavController {
    constructor() {
        this.dropdowns = [];
        this.mobileMenuOpen = false;
        this.userMenuOpen = false;
        this.themeMenuOpen = false;
        this.activeDropdown = null;
        this.lastScrollY = 0;
        this.isScrolled = false;

        // DOM elements
        this.header = null;
        this.mobileMenuToggle = null;
        this.mobileNavPanel = null;
        this.mobileNavOverlay = null;
        this.mobileNavClose = null;
        this.userMenuBtn = null;
        this.userMenuDropdown = null;
        this.themePickerBtn = null;
        this.themePickerDropdown = null;

        // Bind methods
        this.handleDropdownTriggerClick = this.handleDropdownTriggerClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleMobileToggle = this.handleMobileToggle.bind(this);
        this.handleMobileClose = this.handleMobileClose.bind(this);
        this.handleMobileLinkClick = this.handleMobileLinkClick.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleUserMenuClick = this.handleUserMenuClick.bind(this);
        this.handleThemePickerClick = this.handleThemePickerClick.bind(this);
    }

    /**
     * Initialize the header navigation controller
     */
    init() {
        console.log('[HeaderNav] Initializing...');

        // Get header element
        this.header = document.querySelector('.site-header');

        // Find all dropdowns
        this.dropdowns = document.querySelectorAll('.nav-dropdown');

        // Get mobile navigation elements
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.mobileNavPanel = document.getElementById('mobileNavPanel');
        this.mobileNavOverlay = document.getElementById('mobileNavOverlay');
        this.mobileNavClose = document.getElementById('mobileNavClose');

        // Get user menu elements
        this.userMenuBtn = document.getElementById('userMenuBtn');
        this.userMenuDropdown = document.getElementById('userMenuDropdown');

        // Get theme picker elements
        this.themePickerBtn = document.getElementById('themeToggle');
        this.themePickerDropdown = document.getElementById('themeDropdown');

        // Set up event listeners
        this.setupDropdownListeners();
        this.setupMobileListeners();
        this.setupUserMenuListeners();
        this.setupThemePickerListeners();
        this.setupGlobalListeners();
        this.setupScrollListener();

        // Inject mobile nav panel if not present
        this.ensureMobileNav();

        // Update active nav state
        this.updateActiveNavState();

        console.log(`[HeaderNav] Initialized with ${this.dropdowns.length} dropdowns`);
    }

    /**
     * Ensure mobile navigation panel exists
     */
    ensureMobileNav() {
        if (!this.mobileNavPanel) {
            this.createMobileNav();
        }
    }

    /**
     * Create mobile navigation panel
     */
    createMobileNav() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'mobileNavOverlay';
        overlay.className = 'mobile-nav-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
        this.mobileNavOverlay = overlay;

        // Create panel
        const panel = document.createElement('aside');
        panel.id = 'mobileNavPanel';
        panel.className = 'mobile-nav-panel';
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Navigation menu');

        panel.innerHTML = `
            <div class="mobile-nav-header">
                <span class="mobile-nav-title">Navigation</span>
                <button id="mobileNavClose" class="mobile-nav-close" aria-label="Close navigation menu">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="mobile-nav-content">
                <nav class="mobile-nav-section">
                    <h3 class="mobile-nav-section-title">Explore</h3>
                    <div class="mobile-nav-links">
                        <a href="#/" class="mobile-nav-link" data-route="home">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                    <path d="M9 22V12h6v10"/>
                                </svg>
                            </span>
                            <span>Home</span>
                        </a>
                        <a href="#/browse/deities" class="mobile-nav-link" data-route="deities">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="8" r="5"/>
                                    <path d="M3 21v-2a7 7 0 0114 0v2"/>
                                </svg>
                            </span>
                            <span>Deities</span>
                        </a>
                        <a href="#/browse/creatures" class="mobile-nav-link" data-route="creatures">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                    <path d="M2 17l10 5 10-5"/>
                                    <path d="M2 12l10 5 10-5"/>
                                </svg>
                            </span>
                            <span>Creatures</span>
                        </a>
                        <a href="#/browse/heroes" class="mobile-nav-link" data-route="heroes">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </span>
                            <span>Heroes</span>
                        </a>
                        <a href="#/browse/items" class="mobile-nav-link" data-route="items">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                            </span>
                            <span>Sacred Items</span>
                        </a>
                        <a href="#/browse/places" class="mobile-nav-link" data-route="places">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                            </span>
                            <span>Sacred Places</span>
                        </a>
                    </div>
                </nav>

                <nav class="mobile-nav-section">
                    <h3 class="mobile-nav-section-title">Tools</h3>
                    <div class="mobile-nav-links">
                        <a href="#/search" class="mobile-nav-link" data-route="search">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                            </span>
                            <span>Search</span>
                        </a>
                        <a href="#/compare" class="mobile-nav-link" data-route="compare">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="20" x2="18" y2="10"/>
                                    <line x1="12" y1="20" x2="12" y2="4"/>
                                    <line x1="6" y1="20" x2="6" y2="14"/>
                                </svg>
                            </span>
                            <span>Compare</span>
                        </a>
                    </div>
                </nav>

                <nav class="mobile-nav-section mobile-nav-user-section" id="mobileUserSection" style="display: none;">
                    <h3 class="mobile-nav-section-title">Account</h3>
                    <div class="mobile-nav-links">
                        <a href="#/profile" class="mobile-nav-link" data-route="profile">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </span>
                            <span>Profile</span>
                        </a>
                        <a href="#/dashboard" class="mobile-nav-link" data-route="dashboard">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="7" height="7"/>
                                    <rect x="14" y="3" width="7" height="7"/>
                                    <rect x="14" y="14" width="7" height="7"/>
                                    <rect x="3" y="14" width="7" height="7"/>
                                </svg>
                            </span>
                            <span>Dashboard</span>
                        </a>
                        <a href="#/settings" class="mobile-nav-link" data-route="settings">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                                </svg>
                            </span>
                            <span>Settings</span>
                        </a>
                        <button class="mobile-nav-link mobile-nav-signout" id="mobileSignOut">
                            <span class="mobile-nav-link-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                            </span>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </nav>
            </div>
        `;

        document.body.appendChild(panel);
        this.mobileNavPanel = panel;
        this.mobileNavClose = panel.querySelector('#mobileNavClose');

        // Add hamburger toggle if not present
        if (!this.mobileMenuToggle) {
            this.createMobileToggle();
        }

        // Re-attach listeners
        this.setupMobileListeners();
    }

    /**
     * Create mobile menu toggle button
     */
    createMobileToggle() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const toggle = document.createElement('button');
        toggle.id = 'mobileMenuToggle';
        toggle.className = 'mobile-menu-toggle';
        toggle.setAttribute('aria-label', 'Open navigation menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'mobileNavPanel');

        toggle.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line class="hamburger-line" x1="3" y1="6" x2="21" y2="6"/>
                <line class="hamburger-line" x1="3" y1="12" x2="21" y2="12"/>
                <line class="hamburger-line" x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        `;

        headerActions.insertBefore(toggle, headerActions.firstChild);
        this.mobileMenuToggle = toggle;
    }

    /**
     * Set up scroll listener for sticky header effects
     */
    setupScrollListener() {
        let ticking = false;

        const onScroll = () => {
            this.lastScrollY = window.scrollY;

            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateHeaderOnScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /**
     * Update header appearance based on scroll position
     */
    updateHeaderOnScroll() {
        if (!this.header) return;

        const scrollThreshold = 10;
        const shouldBeScrolled = this.lastScrollY > scrollThreshold;

        if (shouldBeScrolled !== this.isScrolled) {
            this.isScrolled = shouldBeScrolled;
            this.header.classList.toggle('header--scrolled', shouldBeScrolled);
        }
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
     * Set up user menu listeners
     */
    setupUserMenuListeners() {
        if (!this.userMenuBtn) return;

        this.userMenuBtn.addEventListener('click', this.handleUserMenuClick);
    }

    /**
     * Set up theme picker listeners
     */
    setupThemePickerListeners() {
        if (!this.themePickerBtn) return;

        // Only show dropdown on desktop
        this.themePickerBtn.addEventListener('click', this.handleThemePickerClick);
    }

    /**
     * Handle user menu click
     */
    handleUserMenuClick(e) {
        e.preventDefault();
        e.stopPropagation();

        this.userMenuOpen = !this.userMenuOpen;
        this.updateUserMenuState();
    }

    /**
     * Update user menu DOM state
     */
    updateUserMenuState() {
        if (!this.userMenuBtn || !this.userMenuDropdown) return;

        this.userMenuBtn.setAttribute('aria-expanded', this.userMenuOpen.toString());
        this.userMenuDropdown.classList.toggle('visible', this.userMenuOpen);
        this.userMenuDropdown.setAttribute('aria-hidden', (!this.userMenuOpen).toString());
    }

    /**
     * Handle theme picker click
     */
    handleThemePickerClick(e) {
        // On mobile, just toggle theme directly
        if (window.innerWidth <= 768) {
            return; // Let the shader-theme-picker handle it
        }

        e.preventDefault();
        e.stopPropagation();

        this.themeMenuOpen = !this.themeMenuOpen;
        this.updateThemePickerState();
    }

    /**
     * Update theme picker DOM state
     */
    updateThemePickerState() {
        if (!this.themePickerBtn || !this.themePickerDropdown) return;

        this.themePickerBtn.setAttribute('aria-expanded', this.themeMenuOpen.toString());
        this.themePickerDropdown.classList.toggle('visible', this.themeMenuOpen);
        this.themePickerDropdown.setAttribute('aria-hidden', (!this.themeMenuOpen).toString());
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

            // Handle sign out button
            const signOutBtn = this.mobileNavPanel.querySelector('#mobileSignOut');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', () => {
                    this.closeMobileNav();
                    // Trigger sign out
                    const mainSignOut = document.getElementById('signOutBtn');
                    if (mainSignOut) mainSignOut.click();
                });
            }
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

    handleDropdownTriggerClick(dropdown, trigger) {
        const isOpen = dropdown.classList.contains('open');

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

        // Also close user menu and theme picker
        this.userMenuOpen = false;
        this.themeMenuOpen = false;
        this.updateUserMenuState();
        this.updateThemePickerState();
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
            if (this.activeDropdown || this.userMenuOpen || this.themeMenuOpen) {
                const trigger = this.activeDropdown?.querySelector('.nav-dropdown-trigger');
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
        const isInsideUserMenu = e.target.closest('.user-menu');
        const isInsideThemePicker = e.target.closest('.theme-picker-container');

        if (!isInsideDropdown && !isInsideUserMenu && !isInsideThemePicker) {
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

    openMobileNav() {
        this.mobileMenuOpen = true;

        // Update toggle button
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
            this.mobileMenuToggle.setAttribute('aria-label', 'Close navigation menu');
            this.mobileMenuToggle.classList.add('active');
        }

        // Show overlay with animation
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                this.mobileNavOverlay.classList.add('visible');
            });
        }

        // Show panel with animation
        if (this.mobileNavPanel) {
            this.mobileNavPanel.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                this.mobileNavPanel.classList.add('visible');
            });
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Update user section visibility
        this.updateMobileUserSection();

        // Focus first link after animation
        setTimeout(() => {
            const firstLink = this.mobileNavPanel?.querySelector('.mobile-nav-link');
            if (firstLink) firstLink.focus();
        }, 350);

        console.log('[HeaderNav] Mobile nav opened');
    }

    closeMobileNav() {
        this.mobileMenuOpen = false;

        // Update toggle button
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
            this.mobileMenuToggle.setAttribute('aria-label', 'Open navigation menu');
            this.mobileMenuToggle.classList.remove('active');
        }

        // Hide panel
        if (this.mobileNavPanel) {
            this.mobileNavPanel.classList.remove('visible');
            this.mobileNavPanel.setAttribute('aria-hidden', 'true');
        }

        // Hide overlay
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.classList.remove('visible');
            setTimeout(() => {
                this.mobileNavOverlay.setAttribute('aria-hidden', 'true');
            }, 350);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.focus();
        }

        console.log('[HeaderNav] Mobile nav closed');
    }

    /**
     * Update mobile user section visibility based on auth state
     */
    updateMobileUserSection() {
        const userSection = document.getElementById('mobileUserSection');
        if (!userSection) return;

        const isAuthenticated = document.body.classList.contains('authenticated') ||
                               localStorage.getItem('eoa_auth_cached') === 'true';

        userSection.style.display = isAuthenticated ? 'block' : 'none';
    }

    /**
     * Handle mobile menu close button
     */
    handleMobileClose(e) {
        e.preventDefault();
        this.closeMobileNav();
    }

    handleMobileLinkClick() {
        setTimeout(() => {
            this.closeMobileNav();
        }, 50);
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
     * Update active navigation state based on current route
     */
    updateActiveNavState() {
        const currentHash = window.location.hash || '#/';

        // Update desktop nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            const isActive = currentHash.startsWith(href) && href !== '#/';
            link.classList.toggle('active', isActive);
        });

        // Update mobile nav links
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const isActive = currentHash.startsWith(href) && href !== '#/';
                link.classList.toggle('active', isActive);
            }
        });
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

    // Update active state on hash change
    window.addEventListener('hashchange', () => {
        controller.updateActiveNavState();
    });
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
