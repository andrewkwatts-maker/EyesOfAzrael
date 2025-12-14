/**
 * Dynamic Navigation System
 * Provides universal navigation components that load mythology lists dynamically from Firebase
 * Includes breadcrumb generation, mythology menu, and recently viewed tracking
 */

import { ENTITY_ICONS, getEntityIcon } from './constants/entity-types.js';

class NavigationSystem {
    constructor() {
        this.mythologies = [];
        this.recentlyViewed = this.loadRecentlyViewed();
        this.initialized = false;
    }

    /**
     * Initialize the navigation system
     */
    async init() {
        if (this.initialized) return;

        try {
            await this.loadMythologies();
            this.initialized = true;
            console.log('[Navigation] System initialized successfully');
        } catch (error) {
            console.error('[Navigation] Initialization error:', error);
        }
    }

    /**
     * Load mythologies from Firestore
     */
    async loadMythologies() {
        try {
            const snapshot = await firebase.firestore()
                .collection('mythologies')
                .orderBy('name', 'asc')
                .get();

            this.mythologies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`[Navigation] Loaded ${this.mythologies.length} mythologies`);
        } catch (error) {
            console.error('[Navigation] Error loading mythologies:', error);
            // Use fallback mythologies
            this.mythologies = this.getFallbackMythologies();
        }
    }

    /**
     * Get fallback mythologies if Firebase fails
     */
    getFallbackMythologies() {
        return [
            { id: 'greek', name: 'Greek', icon: '⚡' },
            { id: 'norse', name: 'Norse', icon: '⚔️' },
            { id: 'egyptian', name: 'Egyptian', icon: '𓂀' },
            { id: 'hindu', name: 'Hindu', icon: '🕉️' },
            { id: 'buddhist', name: 'Buddhist', icon: '☸️' },
            { id: 'chinese', name: 'Chinese', icon: '☯️' },
            { id: 'japanese', name: 'Japanese', icon: '⛩️' },
            { id: 'celtic', name: 'Celtic', icon: '☘️' },
            { id: 'aztec', name: 'Aztec', icon: '🦅' },
            { id: 'mayan', name: 'Mayan', icon: '🐆' },
            { id: 'christian', name: 'Christian', icon: '✝️' },
            { id: 'islamic', name: 'Islamic', icon: '☪️' },
            { id: 'jewish', name: 'Jewish', icon: '✡️' },
            { id: 'roman', name: 'Roman', icon: '🏛️' },
            { id: 'sumerian', name: 'Sumerian', icon: '𒀭' },
            { id: 'babylonian', name: 'Babylonian', icon: '🦁' }
        ];
    }

    /**
     * Render dynamic mythology menu
     * @param {string} containerId - ID of container element
     * @param {Object} options - Menu options
     */
    renderMythologyMenu(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[Navigation] Container not found: ${containerId}`);
            return;
        }

        const {
            maxItems = 12,
            showIcons = true,
            layout = 'grid', // 'grid', 'list', 'dropdown'
            currentMythology = null
        } = options;

        // Limit mythologies
        const displayMythologies = this.mythologies.slice(0, maxItems);

        if (layout === 'grid') {
            container.innerHTML = `
                <div class="mythology-menu-grid">
                    ${displayMythologies.map(myth => `
                        <a href="/mythos/${myth.id}/index.html"
                           class="mythology-menu-item ${myth.id === currentMythology ? 'active' : ''}"
                           data-mythology="${myth.id}">
                            ${showIcons ? `<span class="mythology-icon">${myth.icon || '🌍'}</span>` : ''}
                            <span class="mythology-name">${myth.name}</span>
                        </a>
                    `).join('')}
                </div>
            `;
        } else if (layout === 'list') {
            container.innerHTML = `
                <ul class="mythology-menu-list">
                    ${displayMythologies.map(myth => `
                        <li>
                            <a href="/mythos/${myth.id}/index.html"
                               class="${myth.id === currentMythology ? 'active' : ''}"
                               data-mythology="${myth.id}">
                                ${showIcons ? `${myth.icon || '🌍'} ` : ''}${myth.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else if (layout === 'dropdown') {
            container.innerHTML = `
                <select class="mythology-dropdown" onchange="window.location.href = this.value">
                    <option value="">Select Mythology...</option>
                    ${displayMythologies.map(myth => `
                        <option value="/mythos/${myth.id}/index.html"
                                ${myth.id === currentMythology ? 'selected' : ''}>
                            ${showIcons ? `${myth.icon || '🌍'} ` : ''}${myth.name}
                        </option>
                    `).join('')}
                </select>
            `;
        }
    }

    /**
     * Generate breadcrumb navigation
     * @param {Object} context - Current page context
     * @returns {string} Breadcrumb HTML
     */
    generateBreadcrumb(context) {
        const { mythology, entityType, entityName, customPath } = context;
        const crumbs = [{ label: 'Home', url: '/index.html' }];

        if (customPath) {
            // Use custom breadcrumb path
            crumbs.push(...customPath);
        } else {
            // Auto-generate from context
            if (mythology) {
                crumbs.push(
                    { label: 'Mythologies', url: '/mythos/index.html' },
                    { label: this.capitalize(mythology), url: `/mythos/${mythology}/index.html` }
                );
            }

            if (entityType) {
                crumbs.push({
                    label: this.capitalize(entityType) + 's',
                    url: `/templates/entity-grid.html?type=${entityType}&mythology=${mythology}`
                });
            }

            if (entityName) {
                crumbs.push({ label: entityName, url: null }); // Current page
            }
        }

        return this.renderBreadcrumb(crumbs);
    }

    /**
     * Render breadcrumb HTML
     * @param {Array} crumbs - Breadcrumb items
     * @returns {string} HTML string
     */
    renderBreadcrumb(crumbs) {
        return crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            if (isLast) {
                return `<span aria-current="page">${crumb.label}</span>`;
            } else {
                return `<a href="${crumb.url}">${crumb.label}</a>`;
            }
        }).join(' → ');
    }

    /**
     * Inject breadcrumb into page
     * @param {string} containerId - Container element ID
     * @param {Object} context - Page context
     */
    injectBreadcrumb(containerId, context) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[Navigation] Breadcrumb container not found: ${containerId}`);
            return;
        }

        container.innerHTML = this.generateBreadcrumb(context);
    }

    /**
     * Track entity view in recently viewed
     * @param {Object} entity - Entity data
     */
    trackEntityView(entity) {
        // Create view record
        const viewRecord = {
            id: entity.id,
            type: entity.type,
            name: entity.name || entity.title,
            mythology: entity.mythology,
            icon: this.getEntityIcon(entity),
            timestamp: Date.now()
        };

        // Remove if already exists
        this.recentlyViewed = this.recentlyViewed.filter(v => v.id !== entity.id);

        // Add to beginning
        this.recentlyViewed.unshift(viewRecord);

        // Limit to 10 items
        this.recentlyViewed = this.recentlyViewed.slice(0, 10);

        // Save to localStorage
        this.saveRecentlyViewed();

        console.log('[Navigation] Tracked view:', viewRecord);
    }

    /**
     * Get recently viewed entities
     * @param {number} limit - Max items to return
     * @returns {Array} Recently viewed entities
     */
    getRecentlyViewed(limit = 5) {
        return this.recentlyViewed.slice(0, limit);
    }

    /**
     * Render recently viewed component
     * @param {string} containerId - Container element ID
     * @param {Object} options - Render options
     */
    renderRecentlyViewed(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[Navigation] Container not found: ${containerId}`);
            return;
        }

        const { limit = 5, showIcons = true, excludeCurrentId = null } = options;

        let items = this.getRecentlyViewed(limit + 1); // Get one extra in case we need to exclude current

        // Exclude current entity if specified
        if (excludeCurrentId) {
            items = items.filter(item => item.id !== excludeCurrentId);
        }

        items = items.slice(0, limit);

        if (items.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <h3>Recently Viewed</h3>
            <div class="recently-viewed-list">
                ${items.map(item => `
                    <a href="/templates/entity-detail.html?type=${item.type}&id=${item.id}"
                       class="recently-viewed-item">
                        ${showIcons ? `<span class="recently-viewed-icon">${item.icon}</span>` : ''}
                        <div class="recently-viewed-info">
                            <span class="recently-viewed-name">${item.name}</span>
                            <span class="recently-viewed-type">${this.capitalize(item.mythology)} ${this.capitalize(item.type)}</span>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;

        container.style.display = 'block';
    }

    /**
     * Clear recently viewed history
     */
    clearRecentlyViewed() {
        this.recentlyViewed = [];
        this.saveRecentlyViewed();
        console.log('[Navigation] Recently viewed cleared');
    }

    /**
     * Load recently viewed from localStorage
     */
    loadRecentlyViewed() {
        try {
            const stored = localStorage.getItem('recentlyViewed');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[Navigation] Error loading recently viewed:', error);
            return [];
        }
    }

    /**
     * Save recently viewed to localStorage
     */
    saveRecentlyViewed() {
        try {
            localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
        } catch (error) {
            console.error('[Navigation] Error saving recently viewed:', error);
        }
    }

    /**
     * Get entity icon
     */
    getEntityIcon(entity) {
        return getEntityIcon(entity);
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Create related entities sidebar
     * @param {Object} entity - Current entity
     * @param {string} containerId - Container element ID
     */
    async renderRelatedEntities(entity, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`[Navigation] Container not found: ${containerId}`);
            return;
        }

        if (!entity.relatedEntities && !entity.crossReferences) {
            container.style.display = 'none';
            return;
        }

        // Show loading state
        container.innerHTML = '<p>Loading related entities...</p>';
        container.style.display = 'block';

        try {
            // Load cross-references using EntityLoader
            const crossRefs = await EntityLoader.loadCrossReferences(entity);

            if (Object.keys(crossRefs).length === 0) {
                container.style.display = 'none';
                return;
            }

            let html = '<h3>Related Entities</h3>';

            Object.entries(crossRefs).forEach(([type, entities]) => {
                if (entities && entities.length > 0) {
                    html += `<h4>${this.capitalize(type)}</h4>`;
                    html += '<div class="related-entities-list">';
                    entities.forEach(relatedEntity => {
                        html += `
                            <a href="/templates/entity-detail.html?type=${relatedEntity.type}&id=${relatedEntity.id}"
                               class="related-entity-item">
                                <span class="related-entity-icon">${this.getEntityIcon(relatedEntity)}</span>
                                <span class="related-entity-name">${relatedEntity.name || relatedEntity.title}</span>
                            </a>
                        `;
                    });
                    html += '</div>';
                }
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('[Navigation] Error loading related entities:', error);
            container.innerHTML = '<p>Error loading related entities</p>';
        }
    }

    /**
     * Auto-detect and populate navigation based on URL
     */
    autoPopulateNavigation() {
        // Parse current URL
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);

        // Extract context
        const context = {
            mythology: params.get('mythology') || this.extractMythologyFromPath(path),
            entityType: params.get('type'),
            entityId: params.get('id')
        };

        // Update breadcrumb if element exists
        const breadcrumbEl = document.getElementById('breadcrumb-nav');
        if (breadcrumbEl) {
            this.injectBreadcrumb('breadcrumb-nav', context);
        }

        // Render mythology menu if element exists
        const mythMenuEl = document.getElementById('mythology-menu');
        if (mythMenuEl) {
            this.renderMythologyMenu('mythology-menu', {
                currentMythology: context.mythology
            });
        }

        // Render recently viewed if element exists
        const recentEl = document.getElementById('recently-viewed');
        if (recentEl) {
            this.renderRecentlyViewed('recently-viewed', {
                excludeCurrentId: context.entityId
            });
        }

        // Initialize header filters integration
        this.setupHeaderFiltersIntegration();
    }

    /**
     * Set up integration with header filters
     */
    setupHeaderFiltersIntegration() {
        // Wait for header filters to be initialized
        const checkHeaderFilters = setInterval(() => {
            if (window.headerFilters && window.headerFilters.initialized) {
                clearInterval(checkHeaderFilters);

                // Register listener for filter changes
                window.headerFilters.onFilterChange((filters) => {
                    console.log('[Navigation] Header filters changed:', filters);
                    this.handleFilterChange(filters);
                });

                console.log('[Navigation] Header filters integration ready');
            }
        }, 100);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkHeaderFilters), 10000);
    }

    /**
     * Handle filter changes from header filters
     * @param {Object} filters - Current filter state
     */
    handleFilterChange(filters) {
        // Update mythology menu to reflect active filters
        const mythMenuEl = document.getElementById('mythology-menu');
        if (mythMenuEl && filters.mythologies.length > 0) {
            // Highlight active mythologies in menu
            mythMenuEl.querySelectorAll('[data-mythology]').forEach(item => {
                const mythology = item.dataset.mythology;
                if (filters.mythologies.includes(mythology)) {
                    item.classList.add('filtered-active');
                } else {
                    item.classList.remove('filtered-active');
                }
            });
        }

        // Trigger reload of entity grids if EntityLoader is available
        if (window.EntityLoader) {
            // EntityLoader will handle the reload through its own listener
            console.log('[Navigation] Entity grids will reload automatically');
        }
    }

    /**
     * Extract mythology from URL path
     */
    extractMythologyFromPath(path) {
        const match = path.match(/\/mythos\/([^\/]+)/);
        return match ? match[1] : null;
    }
}

// Create global instance
window.NavigationSystem = NavigationSystem;

// Auto-initialize when DOM is ready and Firebase is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}

async function initNavigation() {
    // Wait for Firebase to be ready
    const waitForFirebase = () => {
        return new Promise((resolve) => {
            if (window.firebaseApp && window.firebaseDb) {
                resolve();
            } else {
                setTimeout(() => waitForFirebase().then(resolve), 100);
            }
        });
    };

    await waitForFirebase();

    // Initialize navigation system
    window.navigationSystem = new NavigationSystem();
    await window.navigationSystem.init();

    // Auto-populate navigation
    window.navigationSystem.autoPopulateNavigation();

    console.log('[Navigation] Ready');
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationSystem;
}
