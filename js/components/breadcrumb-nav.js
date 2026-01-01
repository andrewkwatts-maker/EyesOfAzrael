/**
 * Breadcrumb Navigation Component
 * Renders breadcrumb trail for navigation
 *
 * Features:
 * - Auto-generated from route
 * - Sticky positioning
 * - Clickable segments
 * - Responsive design
 */

class BreadcrumbNav {
    constructor(containerElement) {
        this.container = containerElement || document.getElementById('breadcrumb-nav');
        this.separator = '›';

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

        this.container.innerHTML = html;

        // Show or hide container based on breadcrumbs
        if (breadcrumbs.length > 1) {
            this.container.classList.add('visible');
        } else {
            this.container.classList.remove('visible');
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
            icon: '🏠'
        }];

        // Skip breadcrumbs if on home
        if (route.type === 'home') {
            return crumbs;
        }

        // Mythology overview
        if (route.mythology) {
            crumbs.push({
                label: this.capitalize(route.mythology),
                hash: `#/mythology/${route.mythology}`,
                icon: this.getMythologyIcon(route.mythology)
            });
        }

        // Entity type list
        if (route.entityTypePlural) {
            crumbs.push({
                label: this.capitalize(route.entityTypePlural),
                hash: `#/mythology/${route.mythology}/${route.entityTypePlural}`,
                icon: this.getEntityTypeIcon(route.entityType)
            });
        }

        // Entity detail
        if (route.entityId) {
            crumbs.push({
                label: this.capitalize(route.entityId.replace(/-/g, ' ')),
                hash: route.hash,
                icon: null
            });
        }

        // Special routes
        if (route.type === 'search') {
            crumbs.push({
                label: 'Search',
                hash: '#/search',
                icon: '🔍'
            });
        }

        if (route.type === 'compare') {
            crumbs.push({
                label: 'Compare',
                hash: '#/compare',
                icon: '⚖️'
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

        return `
            <nav class="breadcrumb-container" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    ${breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return this.renderBreadcrumbItem(crumb, isLast);
                    }).join('')}
                </ol>
            </nav>
        `;
    }

    /**
     * Render individual breadcrumb item
     * @param {object} crumb - Breadcrumb object
     * @param {boolean} isLast - Whether this is the last item
     * @returns {string} HTML string
     */
    renderBreadcrumbItem(crumb, isLast) {
        if (isLast) {
            return `
                <li class="breadcrumb-item breadcrumb-current">
                    ${crumb.icon ? `<span class="breadcrumb-icon" aria-hidden="true">${crumb.icon}</span>` : ''}
                    <span class="breadcrumb-label" aria-current="page">${this.escapeHtml(crumb.label)}</span>
                </li>
            `;
        } else {
            return `
                <li class="breadcrumb-item">
                    <a href="${crumb.hash}" class="breadcrumb-link" title="${this.escapeHtml(crumb.label)}">
                        ${crumb.icon ? `<span class="breadcrumb-icon" aria-hidden="true">${crumb.icon}</span>` : ''}
                        <span class="breadcrumb-label">${this.escapeHtml(crumb.label)}</span>
                    </a>
                    <span class="breadcrumb-separator" aria-hidden="true">${this.separator}</span>
                </li>
            `;
        }
    }

    /**
     * Get mythology icon
     */
    getMythologyIcon(mythology) {
        const icons = {
            'greek': '🏛️',
            'norse': '⚔️',
            'egyptian': '🔺',
            'roman': '🏛️',
            'celtic': '☘️',
            'hindu': '🕉️',
            'chinese': '🐉',
            'japanese': '⛩️',
            'sumerian': '📿',
            'babylonian': '🌟',
            'persian': '🔥',
            'mayan': '☀️',
            'aztec': '🦅',
            'yoruba': '👑',
            'buddhist': '☸️',
            'christian': '✝️',
            'jewish': '✡️',
            'islamic': '☪️'
        };

        return icons[mythology] || '📚';
    }

    /**
     * Get entity type icon
     */
    getEntityTypeIcon(entityType) {
        const icons = {
            'deity': '👑',
            'hero': '🦸',
            'creature': '🐉',
            'cosmology': '🌌',
            'ritual': '🕯️',
            'herb': '🌿',
            'text': '📜',
            'symbol': '⚡',
            'item': '⚔️',
            'place': '🏛️',
            'magic': '✨'
        };

        return icons[entityType] || '📄';
    }

    /**
     * Clear breadcrumbs
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('visible');
        }
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
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
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
}

// Export
window.BreadcrumbNav = BreadcrumbNav;
