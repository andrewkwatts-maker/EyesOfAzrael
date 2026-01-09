/**
 * Breadcrumb Navigation Component
 * Renders breadcrumb trail for navigation with polished UI/UX
 *
 * Features:
 * - Auto-generated from route
 * - Chevron separators (>)
 * - Responsive design with mobile collapse
 * - Truncate long names with ellipsis
 * - Mobile: Show last 2 items with "..." menu for rest
 * - Smooth animations
 * - Keyboard accessible
 */

class BreadcrumbNav {
    constructor(containerElement) {
        this.container = containerElement || document.getElementById('breadcrumb-nav');
        this.maxLabelLength = 25;
        this.mobileMaxItems = 2;
        this.isCollapsedMenuOpen = false;

        // Chevron separator SVG
        this.separatorSVG = `
            <svg class="breadcrumb-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        // Bind methods
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);

        if (!this.container) {
            console.warn('[BreadcrumbNav] Container element not found');
        }
    }

    /**
     * Update breadcrumbs from route
     * @param {object} route - Route object
     */
    update(route) {
        if (!this.container) return;

        const breadcrumbs = this.generateBreadcrumbs(route);
        const html = this.renderBreadcrumbs(breadcrumbs);

        // Apply transition for smooth update
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateY(-4px)';

        this.container.innerHTML = html;
        this.attachEventListeners();

        // Show or hide container based on breadcrumbs
        if (breadcrumbs.length > 1) {
            this.container.classList.add('visible');

            // Animate in after DOM update
            requestAnimationFrame(() => {
                this.container.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                this.container.style.opacity = '1';
                this.container.style.transform = 'translateY(0)';
            });

            // Announce breadcrumb update to screen readers
            this._announceUpdate(breadcrumbs);
        } else {
            this.container.classList.remove('visible');
            this.container.style.opacity = '1';
            this.container.style.transform = 'translateY(0)';
        }
    }

    /**
     * Announce breadcrumb update to screen readers
     * @param {Array} breadcrumbs - Array of breadcrumb objects
     */
    _announceUpdate(breadcrumbs) {
        const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label;
        const announcer = document.getElementById('spa-route-announcer');

        if (announcer && currentPage) {
            // Delay announcement slightly to allow page content to render
            setTimeout(() => {
                const path = breadcrumbs.map(c => c.label).join(' > ');
                announcer.textContent = `Navigation: ${path}`;
            }, 100);
        }
    }

    /**
     * Generate breadcrumb items from route
     * @param {object} route - Route object
     * @returns {Array} Array of breadcrumb objects
     */
    generateBreadcrumbs(route) {
        const crumbs = [{
            label: 'Home',
            hash: '#/',
            icon: this.getHomeIcon()
        }];

        // Skip breadcrumbs if on home
        if (route.type === 'home') {
            return crumbs;
        }

        // Browse/Category routes
        if (route.type === 'browse' || route.category) {
            if (route.category) {
                crumbs.push({
                    label: this.capitalize(route.category),
                    hash: `#/browse/${route.category}`,
                    icon: null
                });
            }
        }

        // Mythology overview
        if (route.mythology) {
            crumbs.push({
                label: this.capitalize(route.mythology),
                hash: `#/mythology/${route.mythology}`,
                icon: null
            });
        }

        // Entity type list
        if (route.entityTypePlural) {
            crumbs.push({
                label: this.capitalize(route.entityTypePlural),
                hash: `#/mythology/${route.mythology}/${route.entityTypePlural}`,
                icon: null
            });
        }

        // Entity detail
        if (route.entityId) {
            crumbs.push({
                label: this.formatEntityName(route.entityId),
                hash: route.hash,
                icon: null
            });
        }

        // Special routes
        if (route.type === 'search') {
            crumbs.push({
                label: 'Search',
                hash: '#/search',
                icon: null
            });
        }

        if (route.type === 'compare') {
            crumbs.push({
                label: 'Compare',
                hash: '#/compare',
                icon: null
            });
        }

        if (route.type === 'profile') {
            crumbs.push({
                label: 'Profile',
                hash: '#/profile',
                icon: null
            });
        }

        if (route.type === 'dashboard') {
            crumbs.push({
                label: 'Dashboard',
                hash: '#/dashboard',
                icon: null
            });
        }

        if (route.type === 'settings') {
            crumbs.push({
                label: 'Settings',
                hash: '#/settings',
                icon: null
            });
        }

        return crumbs;
    }

    /**
     * Render breadcrumbs HTML
     * @param {Array} breadcrumbs - Array of breadcrumb objects
     * @returns {string} HTML string
     */
    renderBreadcrumbs(breadcrumbs) {
        if (breadcrumbs.length === 0) return '';

        const isMobile = window.innerWidth <= 640;

        // On mobile with more than mobileMaxItems, collapse middle items
        const shouldCollapse = isMobile && breadcrumbs.length > this.mobileMaxItems + 1;

        if (shouldCollapse) {
            return this.renderCollapsedBreadcrumbs(breadcrumbs);
        }

        return `
            <div class="breadcrumb-wrapper">
                <nav class="breadcrumb-container" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">
                        ${breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return this.renderBreadcrumbItem(crumb, isLast, index + 1);
                        }).join('')}
                    </ol>
                </nav>
            </div>
        `;
    }

    /**
     * Render collapsed breadcrumbs for mobile
     * @param {Array} breadcrumbs - Array of breadcrumb objects
     * @returns {string} HTML string
     */
    renderCollapsedBreadcrumbs(breadcrumbs) {
        const first = breadcrumbs[0];
        const middle = breadcrumbs.slice(1, -1);
        const last = breadcrumbs[breadcrumbs.length - 1];

        return `
            <div class="breadcrumb-wrapper">
                <nav class="breadcrumb-container" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list breadcrumb-list--collapsed" itemscope itemtype="https://schema.org/BreadcrumbList">
                        ${this.renderBreadcrumbItem(first, false, 1)}
                        <li class="breadcrumb-item breadcrumb-item--ellipsis">
                            <button
                                class="breadcrumb-ellipsis-btn"
                                aria-expanded="false"
                                aria-haspopup="true"
                                aria-label="Show ${middle.length} more navigation items"
                                type="button"
                            >
                                <span class="breadcrumb-ellipsis-dots">...</span>
                            </button>
                            <div class="breadcrumb-ellipsis-menu" role="menu" aria-hidden="true">
                                ${middle.map((crumb, idx) => `
                                    <a
                                        href="${crumb.hash}"
                                        class="breadcrumb-ellipsis-item"
                                        role="menuitem"
                                        tabindex="-1"
                                    >
                                        ${this.escapeHtml(crumb.label)}
                                    </a>
                                `).join('')}
                            </div>
                            <span class="breadcrumb-separator" aria-hidden="true">${this.separatorSVG}</span>
                        </li>
                        ${this.renderBreadcrumbItem(last, true, breadcrumbs.length)}
                    </ol>
                </nav>
            </div>
        `;
    }

    /**
     * Render individual breadcrumb item
     * @param {object} crumb - Breadcrumb object
     * @param {boolean} isLast - Whether this is the last item
     * @param {number} position - Position for schema.org
     * @returns {string} HTML string
     */
    renderBreadcrumbItem(crumb, isLast, position) {
        const truncatedLabel = this.truncateLabel(crumb.label);
        const needsTooltip = crumb.label.length > this.maxLabelLength;

        if (isLast) {
            return `
                <li
                    class="breadcrumb-item breadcrumb-item--current"
                    itemprop="itemListElement"
                    itemscope
                    itemtype="https://schema.org/ListItem"
                >
                    <span
                        class="breadcrumb-current"
                        aria-current="page"
                        itemprop="name"
                        ${needsTooltip ? `title="${this.escapeHtml(crumb.label)}"` : ''}
                    >
                        ${crumb.icon ? `<span class="breadcrumb-icon" aria-hidden="true">${crumb.icon}</span>` : ''}
                        <span class="breadcrumb-label">${this.escapeHtml(truncatedLabel)}</span>
                    </span>
                    <meta itemprop="position" content="${position}">
                </li>
            `;
        } else {
            return `
                <li
                    class="breadcrumb-item"
                    itemprop="itemListElement"
                    itemscope
                    itemtype="https://schema.org/ListItem"
                >
                    <a
                        href="${crumb.hash}"
                        class="breadcrumb-link"
                        itemprop="item"
                        ${needsTooltip ? `title="${this.escapeHtml(crumb.label)}"` : ''}
                    >
                        ${crumb.icon ? `<span class="breadcrumb-icon" aria-hidden="true">${crumb.icon}</span>` : ''}
                        <span class="breadcrumb-label" itemprop="name">${this.escapeHtml(truncatedLabel)}</span>
                    </a>
                    <meta itemprop="position" content="${position}">
                    <span class="breadcrumb-separator" aria-hidden="true">${this.separatorSVG}</span>
                </li>
            `;
        }
    }

    /**
     * Attach event listeners for collapsed menu
     */
    attachEventListeners() {
        const ellipsisBtn = this.container.querySelector('.breadcrumb-ellipsis-btn');
        if (ellipsisBtn) {
            ellipsisBtn.addEventListener('click', (e) => this.toggleEllipsisMenu(e));
        }

        // Global listeners for closing menu
        document.addEventListener('click', this.handleOutsideClick);
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * Toggle ellipsis dropdown menu
     */
    toggleEllipsisMenu(e) {
        e.preventDefault();
        e.stopPropagation();

        const btn = this.container.querySelector('.breadcrumb-ellipsis-btn');
        const menu = this.container.querySelector('.breadcrumb-ellipsis-menu');

        if (!btn || !menu) return;

        this.isCollapsedMenuOpen = !this.isCollapsedMenuOpen;

        btn.setAttribute('aria-expanded', this.isCollapsedMenuOpen.toString());
        menu.setAttribute('aria-hidden', (!this.isCollapsedMenuOpen).toString());
        menu.classList.toggle('visible', this.isCollapsedMenuOpen);

        if (this.isCollapsedMenuOpen) {
            // Focus first menu item
            const firstItem = menu.querySelector('.breadcrumb-ellipsis-item');
            if (firstItem) {
                requestAnimationFrame(() => firstItem.focus());
            }
        }
    }

    /**
     * Close ellipsis menu
     */
    closeEllipsisMenu() {
        const btn = this.container.querySelector('.breadcrumb-ellipsis-btn');
        const menu = this.container.querySelector('.breadcrumb-ellipsis-menu');

        if (btn && menu) {
            this.isCollapsedMenuOpen = false;
            btn.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            menu.classList.remove('visible');
        }
    }

    /**
     * Handle click outside menu
     */
    handleOutsideClick(e) {
        if (this.isCollapsedMenuOpen) {
            const menu = this.container.querySelector('.breadcrumb-item--ellipsis');
            if (menu && !menu.contains(e.target)) {
                this.closeEllipsisMenu();
            }
        }
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isCollapsedMenuOpen) {
            this.closeEllipsisMenu();
            const btn = this.container.querySelector('.breadcrumb-ellipsis-btn');
            if (btn) btn.focus();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Re-render breadcrumbs on resize to handle mobile/desktop switch
        this.closeEllipsisMenu();
    }

    /**
     * Get home icon SVG
     */
    getHomeIcon() {
        return `
            <svg class="breadcrumb-home-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2.5 6.5L8 2l5.5 4.5V14a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V6.5z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 14.5V9h4v5.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    /**
     * Format entity name from ID
     */
    formatEntityName(entityId) {
        if (!entityId) return '';
        return entityId
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Truncate label if needed
     */
    truncateLabel(label) {
        if (!label) return '';
        if (label.length <= this.maxLabelLength) return label;
        return label.substring(0, this.maxLabelLength - 1) + '\u2026';
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Clear breadcrumbs
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('visible');
        }
        this.cleanup();
    }

    /**
     * Show breadcrumbs
     */
    show() {
        if (this.container) {
            this.container.classList.add('visible');
        }
    }

    /**
     * Hide breadcrumbs
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('visible');
        }
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Destroy component
     */
    destroy() {
        this.clear();
        this.cleanup();
    }
}

// Export
window.BreadcrumbNav = BreadcrumbNav;
