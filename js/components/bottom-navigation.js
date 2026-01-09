/**
 * Bottom Navigation Component
 * Fixed bottom navigation bar for mobile devices
 *
 * Features:
 * - Fixed bottom navigation with 4-5 key actions
 * - Active state tracking based on current route
 * - Safe area insets for notched devices
 * - Smooth animations and transitions
 * - Badge support for notifications
 * - Hide on scroll down, show on scroll up
 * - Haptic feedback support
 *
 * Last updated: 2026-01-10
 */

class BottomNavigation {
    constructor(options = {}) {
        this.options = {
            items: this.getDefaultItems(),
            hideOnScroll: true,
            scrollThreshold: 50,
            showBadges: true,
            enableHaptics: true,
            ...options
        };

        this.element = null;
        this.isVisible = true;
        this.lastScrollY = 0;
        this.scrollTimeout = null;
        this.currentRoute = '';

        this.init();
    }

    /**
     * Get default navigation items
     */
    getDefaultItems() {
        return [
            {
                id: 'home',
                label: 'Home',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>`,
                route: '#/',
                matchRoutes: ['#/', '#/home', '']
            },
            {
                id: 'browse',
                label: 'Browse',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>`,
                route: '#/mythologies',
                matchRoutes: ['#/mythologies', '#/browse']
            },
            {
                id: 'search',
                label: 'Search',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>`,
                route: '#/search',
                matchRoutes: ['#/search']
            },
            {
                id: 'compare',
                label: 'Compare',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>`,
                route: '#/compare',
                matchRoutes: ['#/compare']
            },
            {
                id: 'profile',
                label: 'Profile',
                icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>`,
                route: '#/profile',
                matchRoutes: ['#/profile', '#/settings', '#/dashboard']
            }
        ];
    }

    /**
     * Initialize the bottom navigation
     */
    init() {
        // Only show on mobile
        if (!this.isMobile()) {
            console.log('[BottomNavigation] Desktop detected, skipping initialization');
            return;
        }

        this.render();
        this.bindEvents();
        this.updateActiveItem();

        // Add body class to account for bottom nav height
        document.body.classList.add('has-bottom-nav');

        console.log('[BottomNavigation] Initialized');
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 640 ||
               window.matchMedia('(max-width: 640px)').matches ||
               window.matchMedia('(pointer: coarse)').matches;
    }

    /**
     * Render the bottom navigation
     */
    render() {
        // Remove existing if present
        const existing = document.getElementById('bottom-nav');
        if (existing) existing.remove();

        // Create element
        this.element = document.createElement('nav');
        this.element.id = 'bottom-nav';
        this.element.className = 'bottom-nav';
        this.element.setAttribute('role', 'navigation');
        this.element.setAttribute('aria-label', 'Main navigation');

        this.element.innerHTML = this.options.items.map(item => `
            <a href="${item.route}"
               class="bottom-nav-item"
               data-nav-id="${item.id}"
               aria-label="${item.label}"
               role="menuitem">
                <span class="nav-icon" aria-hidden="true">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
                ${this.options.showBadges && item.badge ? `
                    <span class="nav-badge" aria-label="${item.badge} notifications">${item.badge}</span>
                ` : ''}
            </a>
        `).join('');

        document.body.appendChild(this.element);

        // Inject styles
        this.injectStyles();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Route change detection
        window.addEventListener('hashchange', () => this.updateActiveItem());
        window.addEventListener('popstate', () => this.updateActiveItem());

        // Scroll handling for hide/show
        if (this.options.hideOnScroll) {
            window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        }

        // Click handling
        this.element.addEventListener('click', this.handleClick.bind(this));

        // Resize handling
        window.addEventListener('resize', this.handleResize.bind(this));

        // Listen for custom show/hide events
        document.addEventListener('bottom-nav-show', () => this.show());
        document.addEventListener('bottom-nav-hide', () => this.hide());
    }

    /**
     * Handle navigation click
     */
    handleClick(e) {
        const item = e.target.closest('.bottom-nav-item');
        if (!item) return;

        // Haptic feedback
        if (this.options.enableHaptics && navigator.vibrate) {
            navigator.vibrate(10);
        }

        // Update active state immediately for responsiveness
        this.setActiveItem(item.dataset.navId);
    }

    /**
     * Handle scroll for hide/show behavior
     */
    handleScroll() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - this.lastScrollY;

            if (scrollDelta > this.options.scrollThreshold && currentScrollY > 100) {
                // Scrolling down - hide
                this.hide();
            } else if (scrollDelta < -this.options.scrollThreshold) {
                // Scrolling up - show
                this.show();
            }

            this.lastScrollY = currentScrollY;
        }, 50);
    }

    /**
     * Handle resize
     */
    handleResize() {
        if (!this.isMobile()) {
            this.hide();
            document.body.classList.remove('has-bottom-nav');
        } else {
            this.show();
            document.body.classList.add('has-bottom-nav');
        }
    }

    /**
     * Update active item based on current route
     */
    updateActiveItem() {
        const hash = window.location.hash || '#/';
        this.currentRoute = hash;

        // Find matching item
        let activeId = null;

        for (const item of this.options.items) {
            if (item.matchRoutes.some(route => {
                if (route === hash) return true;
                if (route.endsWith('/') && hash.startsWith(route)) return true;
                if (hash.startsWith(route)) return true;
                return false;
            })) {
                activeId = item.id;
                break;
            }
        }

        if (activeId) {
            this.setActiveItem(activeId);
        }
    }

    /**
     * Set active navigation item
     */
    setActiveItem(id) {
        if (!this.element) return;

        // Remove active from all
        this.element.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-current', 'false');
        });

        // Add active to selected
        const activeItem = this.element.querySelector(`[data-nav-id="${id}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.setAttribute('aria-current', 'page');
        }
    }

    /**
     * Show bottom navigation
     */
    show() {
        if (!this.element || this.isVisible) return;

        this.element.classList.remove('hidden');
        this.isVisible = true;
    }

    /**
     * Hide bottom navigation
     */
    hide() {
        if (!this.element || !this.isVisible) return;

        this.element.classList.add('hidden');
        this.isVisible = false;
    }

    /**
     * Update badge for an item
     */
    setBadge(id, count) {
        if (!this.element) return;

        const item = this.element.querySelector(`[data-nav-id="${id}"]`);
        if (!item) return;

        let badge = item.querySelector('.nav-badge');

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                item.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
            badge.setAttribute('aria-label', `${count} notifications`);
        } else if (badge) {
            badge.remove();
        }
    }

    /**
     * Inject component styles
     */
    injectStyles() {
        if (document.getElementById('bottom-nav-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'bottom-nav-styles';
        styles.textContent = `
            /* ============================================
               BOTTOM NAVIGATION STYLES
               ============================================ */

            .bottom-nav {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: calc(64px + env(safe-area-inset-bottom, 0px));
                background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.98);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-top: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.6);
                padding-bottom: env(safe-area-inset-bottom, 0px);
                z-index: 9998;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @media (max-width: 640px) {
                .bottom-nav {
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                }

                /* Adjust body padding for bottom nav */
                body.has-bottom-nav #main-content,
                body.has-bottom-nav .view-container {
                    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
                }
            }

            .bottom-nav.hidden {
                transform: translateY(100%);
            }

            .bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex: 1;
                height: 64px;
                padding: 0.5rem;
                color: var(--color-text-secondary, #adb5bd);
                text-decoration: none;
                font-size: 0.625rem;
                font-weight: 500;
                gap: 0.25rem;
                transition: color 0.2s ease;
                position: relative;
                min-width: 64px;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            }

            .bottom-nav-item .nav-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .bottom-nav-item .nav-icon svg {
                width: 24px;
                height: 24px;
            }

            .bottom-nav-item .nav-label {
                font-size: 0.625rem;
                font-weight: 500;
                letter-spacing: 0.02em;
                transition: opacity 0.2s ease;
            }

            .bottom-nav-item:active .nav-icon {
                transform: scale(0.9);
            }

            .bottom-nav-item.active,
            .bottom-nav-item:hover {
                color: var(--color-primary, #8b7fff);
            }

            .bottom-nav-item.active .nav-icon {
                transform: scale(1.1);
            }

            .bottom-nav-item.active::before {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 3px;
                background: var(--color-primary, #8b7fff);
                border-radius: 0 0 3px 3px;
            }

            /* Badge */
            .nav-badge {
                position: absolute;
                top: 4px;
                right: calc(50% - 20px);
                min-width: 16px;
                height: 16px;
                padding: 0 4px;
                background: #ff6b6b;
                color: white;
                font-size: 0.625rem;
                font-weight: 700;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes badgePop {
                0% {
                    transform: scale(0);
                }
                50% {
                    transform: scale(1.2);
                }
                100% {
                    transform: scale(1);
                }
            }

            /* Hide on landscape mobile */
            @media (max-width: 896px) and (orientation: landscape) {
                .bottom-nav {
                    display: none !important;
                }

                body.has-bottom-nav #main-content,
                body.has-bottom-nav .view-container {
                    padding-bottom: 0;
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .bottom-nav,
                .bottom-nav-item,
                .bottom-nav-item .nav-icon,
                .nav-badge {
                    transition: none !important;
                    animation: none !important;
                }
            }

            /* Print */
            @media print {
                .bottom-nav {
                    display: none !important;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Destroy component
     */
    destroy() {
        if (this.element) {
            this.element.remove();
        }

        document.body.classList.remove('has-bottom-nav');

        const styles = document.getElementById('bottom-nav-styles');
        if (styles) styles.remove();

        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
    }
}

// Global export and auto-initialization
if (typeof window !== 'undefined') {
    window.BottomNavigation = BottomNavigation;

    // Auto-initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        window.bottomNav = new BottomNavigation();
    });
}
