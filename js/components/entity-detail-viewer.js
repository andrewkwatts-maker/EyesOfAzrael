/**
 * Entity Detail Viewer Component
 * Displays comprehensive view of a single entity
 *
 * Features:
 * - Hero section with entity info and animated icons
 * - Tabbed content navigation (Overview, Mythology, Relationships, Community)
 * - Sticky sidebar with quick navigation on desktop
 * - Related entities grid (max 6 visible, "See all" link)
 * - Collapsible long descriptions with "Read more"
 * - Image gallery with lightbox
 * - Community section with contribute actions
 * - Corpus queries with primary source citations
 * - Linguistic information with etymology and alternate names
 * - Mobile-friendly responsive layout
 *
 * Performance Features (v3.0.0):
 * - Batched Firebase queries for related entities
 * - Entity caching with 5-minute TTL
 * - Async loading of related entities with loading states
 * - Enhanced error logging with context
 *
 * @version 3.0.0 - Major polish with tabs, sidebar, and community integration
 */

class EntityDetailViewer {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
        this.animationDelay = 0;
        this.useComprehensiveRenderer = options.useComprehensiveRenderer !== false && window.ComprehensiveMetadataRenderer;

        // Cache for related entities
        this.relatedEntityCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        // Maximum IDs per Firebase 'in' query
        this.MAX_IDS_PER_QUERY = 10;

        // Tab state
        this.activeTab = 'overview';

        // Max related entities to show initially
        this.MAX_RELATED_VISIBLE = 6;

        // Description collapse threshold (characters)
        this.DESCRIPTION_COLLAPSE_THRESHOLD = 500;
    }

    /**
     * Render the entity detail view
     */
    async render(route) {
        const { mythology, entityType, entityId } = route;
        const context = { mythology, entityType, entityId, step: 'initialization' };

        try {
            // Show loading skeleton immediately
            const skeletonHtml = this.renderLoadingSkeleton(mythology, entityType, entityId);

            // Schedule skeleton update after initial render
            setTimeout(() => {
                this.loadEntityAndRender(mythology, entityType, entityId, context);
            }, 0);

            return skeletonHtml;

        } catch (error) {
            this.logError('Render error', error, context);
            throw error;
        }
    }

    /**
     * Load entity and update DOM with real content
     */
    async loadEntityAndRender(mythology, entityType, entityId, context) {
        try {
            context.step = 'loading-entity';
            const entity = await this.loadEntity(mythology, entityType, entityId);

            if (!entity) {
                console.warn(`[EntityDetailViewer] Entity not found: ${entityType}/${entityId} in ${mythology}`);
                const container = document.querySelector('.entity-detail-viewer');
                if (container) {
                    container.outerHTML = this.renderNotFound(entityId);
                }
                return;
            }

            context.step = 'generating-html';
            const relatedEntities = {};
            const html = this.generateHTML(entity, relatedEntities, mythology, entityType);

            // Replace skeleton with actual content
            const container = document.querySelector('.entity-detail-viewer');
            if (container) {
                container.outerHTML = html;
            }

            // Async load related entities
            if (entity.displayOptions?.relatedEntities?.length > 0) {
                this.loadRelatedEntitiesAsync(entity, mythology, entityType);
            }

            // Schedule event listener attachment
            requestAnimationFrame(() => {
                this.attachEventListeners();
                this.initializeComponents();
            });

        } catch (error) {
            this.logError('Render error', error, context);
            const container = document.querySelector('.entity-detail-viewer');
            if (container) {
                container.innerHTML = this.renderErrorState(error.message);
            }
        }
    }

    /**
     * Render loading skeleton
     */
    renderLoadingSkeleton(mythology, entityType, entityId) {
        return `
            <article class="entity-detail-viewer entity-detail-loading"
                     data-entity-id="${this.escapeAttr(entityId)}"
                     data-entity-type="${this.escapeAttr(entityType)}"
                     data-mythology="${this.escapeAttr(mythology)}">

                <!-- Breadcrumb Skeleton -->
                <nav class="entity-breadcrumb skeleton-container" aria-label="Loading breadcrumb">
                    <div class="skeleton-breadcrumb">
                        <span class="skeleton-line skeleton-short"></span>
                        <span class="skeleton-separator"></span>
                        <span class="skeleton-line skeleton-short"></span>
                        <span class="skeleton-separator"></span>
                        <span class="skeleton-line skeleton-medium"></span>
                    </div>
                </nav>

                <!-- Hero Skeleton -->
                <header class="entity-hero-enhanced skeleton-hero">
                    <div class="entity-hero-background" aria-hidden="true"></div>
                    <div class="entity-hero-content">
                        <div class="entity-hero-main">
                            <div class="skeleton-icon-large skeleton-pulse"></div>
                            <div class="entity-hero-text">
                                <div class="skeleton-title skeleton-pulse"></div>
                                <div class="skeleton-badges">
                                    <span class="skeleton-badge skeleton-pulse"></span>
                                    <span class="skeleton-badge skeleton-pulse"></span>
                                </div>
                                <div class="skeleton-description skeleton-pulse"></div>
                                <div class="skeleton-description skeleton-short skeleton-pulse"></div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Quick Actions Skeleton -->
                <nav class="entity-quick-actions skeleton-container" aria-hidden="true">
                    <div class="skeleton-button skeleton-pulse"></div>
                    <div class="skeleton-button skeleton-pulse"></div>
                    <div class="skeleton-button skeleton-pulse"></div>
                </nav>

                <!-- Main Layout Skeleton -->
                <div class="entity-layout">
                    <main class="entity-main-content">
                        <!-- Tabs Skeleton -->
                        <nav class="entity-tabs skeleton-container" aria-hidden="true">
                            <div class="skeleton-tab skeleton-pulse"></div>
                            <div class="skeleton-tab skeleton-pulse"></div>
                            <div class="skeleton-tab skeleton-pulse"></div>
                            <div class="skeleton-tab skeleton-pulse"></div>
                        </nav>

                        <!-- Content Skeleton -->
                        <div class="entity-tab-panels">
                            <section class="entity-section skeleton-section">
                                <div class="skeleton-section-title skeleton-pulse"></div>
                                <div class="skeleton-content">
                                    <div class="skeleton-line skeleton-full skeleton-pulse"></div>
                                    <div class="skeleton-line skeleton-full skeleton-pulse"></div>
                                    <div class="skeleton-line skeleton-medium skeleton-pulse"></div>
                                </div>
                            </section>

                            <section class="entity-section skeleton-section">
                                <div class="skeleton-section-title skeleton-pulse"></div>
                                <div class="skeleton-grid">
                                    <div class="skeleton-card skeleton-pulse"></div>
                                    <div class="skeleton-card skeleton-pulse"></div>
                                    <div class="skeleton-card skeleton-pulse"></div>
                                    <div class="skeleton-card skeleton-pulse"></div>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>

                <!-- Loading indicator -->
                <div class="entity-loading-overlay" role="status" aria-live="polite">
                    <div class="loading-spinner-large"></div>
                    <p class="loading-text">Loading entity details...</p>
                </div>
            </article>
        `;
    }

    /**
     * Render error state
     */
    renderErrorState(message) {
        return `
            <div class="error-container">
                <div class="error-icon" aria-hidden="true">&#9888;</div>
                <h2>Error Loading Entity</h2>
                <p class="error-message">${this.escapeHtml(message || 'An unexpected error occurred.')}</p>
                <div class="error-actions">
                    <button class="btn-primary" onclick="window.location.reload()">Retry</button>
                    <button class="btn-secondary" onclick="window.history.back()">Go Back</button>
                </div>
            </div>
        `;
    }

    /**
     * Initialize interactive components after render
     */
    initializeComponents() {
        this.initializeTabs();
        this.initializeLightbox();
        this.initializeReadMore();
        this.initializeStickyNavigation();
        this.initializeMobileCollapsibleSections();
        this.initializeQuickNavLinks();
        this.updateBreadcrumb();
    }

    /**
     * Initialize mobile collapsible sections
     */
    initializeMobileCollapsibleSections() {
        if (window.innerWidth > 768) return; // Only on mobile

        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const sections = container.querySelectorAll('.entity-section');

        sections.forEach(section => {
            const title = section.querySelector('.section-title');
            if (!title) return;

            // Add collapsible indicator
            if (!title.querySelector('.section-collapse-icon')) {
                const collapseIcon = document.createElement('span');
                collapseIcon.className = 'section-collapse-icon';
                collapseIcon.innerHTML = '&#9660;';
                collapseIcon.setAttribute('aria-hidden', 'true');
                title.appendChild(collapseIcon);
            }

            // Make title clickable
            title.setAttribute('role', 'button');
            title.setAttribute('tabindex', '0');
            title.setAttribute('aria-expanded', 'true');

            const toggleSection = () => {
                const isCollapsed = section.classList.toggle('section-collapsed');
                title.setAttribute('aria-expanded', !isCollapsed);
                const icon = title.querySelector('.section-collapse-icon');
                if (icon) {
                    icon.innerHTML = isCollapsed ? '&#9654;' : '&#9660;';
                }
            };

            title.addEventListener('click', toggleSection);
            title.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection();
                }
            });
        });
    }

    /**
     * Initialize quick navigation links with smooth scroll
     */
    initializeQuickNavLinks() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const navLinks = container.querySelectorAll('.quick-nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    EntityDetailViewer.scrollToSection(href.substring(1));
                }
            });
        });
    }

    /**
     * Initialize tab navigation with keyboard support
     */
    initializeTabs() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const tabs = container.querySelectorAll('.entity-tab-btn');
        const panels = container.querySelectorAll('.entity-tab-panel');
        const tabsArray = Array.from(tabs);

        const activateTab = (tab, focus = false) => {
            const tabId = tab.dataset.tab;

            // Update ARIA states
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');

            const panel = container.querySelector(`#panel-${tabId}`);
            if (panel) {
                panel.classList.add('active');
                // Scroll to top of panel on mobile
                if (window.innerWidth < 768) {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }

            if (focus) {
                tab.focus();
            }

            this.activeTab = tabId;
        };

        tabs.forEach((tab, index) => {
            // Click handler
            tab.addEventListener('click', () => activateTab(tab));

            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                let targetIndex = index;

                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        targetIndex = (index + 1) % tabsArray.length;
                        activateTab(tabsArray[targetIndex], true);
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        targetIndex = (index - 1 + tabsArray.length) % tabsArray.length;
                        activateTab(tabsArray[targetIndex], true);
                        break;
                    case 'Home':
                        e.preventDefault();
                        activateTab(tabsArray[0], true);
                        break;
                    case 'End':
                        e.preventDefault();
                        activateTab(tabsArray[tabsArray.length - 1], true);
                        break;
                }
            });
        });

        // Set initial tabindex values
        tabs.forEach((tab, index) => {
            tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
        });
    }

    /**
     * Initialize lightbox for image gallery
     */
    initializeLightbox() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const galleryImages = container.querySelectorAll('.gallery-image');
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                this.openLightbox(img.dataset.src, img.dataset.caption);
            });
        });
    }

    /**
     * Open lightbox with image
     */
    openLightbox(src, caption) {
        const lightbox = document.createElement('div');
        lightbox.className = 'entity-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Image viewer">
                <button class="lightbox-close" aria-label="Close">&times;</button>
                <div class="lightbox-content">
                    <img src="${this.escapeAttr(src)}" alt="${this.escapeAttr(caption || 'Entity image')}" />
                    ${caption ? `<p class="lightbox-caption">${this.escapeHtml(caption)}</p>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(lightbox);
        document.body.classList.add('lightbox-open');

        const close = () => {
            lightbox.classList.add('closing');
            setTimeout(() => {
                lightbox.remove();
                document.body.classList.remove('lightbox-open');
            }, 200);
        };

        lightbox.querySelector('.lightbox-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget || e.target.classList.contains('lightbox-close')) {
                close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        }, { once: true });

        requestAnimationFrame(() => lightbox.classList.add('open'));
    }

    /**
     * Initialize "Read more" functionality for long descriptions with smooth transitions
     */
    initializeReadMore() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const collapsibleTexts = container.querySelectorAll('.collapsible-text');
        collapsibleTexts.forEach(wrapper => {
            const content = wrapper.querySelector('.collapsible-content');
            const toggle = wrapper.querySelector('.read-more-toggle');
            const toggleText = toggle?.querySelector('.toggle-text');
            const toggleIcon = toggle?.querySelector('.toggle-icon');
            const fade = wrapper.querySelector('.collapsible-fade');

            if (content && toggle) {
                toggle.addEventListener('click', () => {
                    const isExpanded = wrapper.classList.contains('expanded');

                    if (isExpanded) {
                        // Collapse
                        wrapper.classList.remove('expanded');
                        wrapper.dataset.collapsed = 'true';
                        if (toggleText) toggleText.textContent = 'Show more';
                        if (toggleIcon) toggleIcon.innerHTML = '&#9660;';
                        toggle.setAttribute('aria-expanded', 'false');
                        if (fade) fade.style.opacity = '1';

                        // Smooth scroll back to section top
                        const section = wrapper.closest('.entity-section');
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    } else {
                        // Expand
                        wrapper.classList.add('expanded');
                        wrapper.dataset.collapsed = 'false';
                        if (toggleText) toggleText.textContent = 'Show less';
                        if (toggleIcon) toggleIcon.innerHTML = '&#9650;';
                        toggle.setAttribute('aria-expanded', 'true');
                        if (fade) fade.style.opacity = '0';
                    }
                });

                // Keyboard support
                toggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle.click();
                    }
                });
            }
        });
    }

    /**
     * Initialize sticky sidebar navigation
     */
    initializeStickyNavigation() {
        const sidebar = document.querySelector('.entity-quick-nav');
        if (!sidebar || window.innerWidth < 1024) return;

        const sections = document.querySelectorAll('.entity-section[id]');
        const navLinks = sidebar.querySelectorAll('.quick-nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    const activeLink = sidebar.querySelector(`[href="#${entry.target.id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, { rootMargin: '-100px 0px -80% 0px' });

        sections.forEach(section => observer.observe(section));
    }

    /**
     * Update breadcrumb via custom event
     */
    updateBreadcrumb() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const entityId = container.dataset.entityId;
        const entityType = container.dataset.entityType;
        const mythology = container.dataset.mythology;
        const entityName = container.querySelector('.entity-title')?.textContent;

        // Dispatch event for breadcrumb component
        window.dispatchEvent(new CustomEvent('entity:loaded', {
            detail: { entityId, entityType, mythology, entityName }
        }));
    }

    /**
     * Load related entities asynchronously
     */
    async loadRelatedEntitiesAsync(entity, mythology, entityType) {
        const context = { entityId: entity.id, entityType, step: 'loading-related-entities' };

        try {
            this.showRelatedEntitiesLoading();
            const relatedEntities = await this.loadRelatedEntities(entity);

            if (Object.keys(relatedEntities).length > 0) {
                this.updateRelatedEntitiesSection(relatedEntities, mythology, entityType);
            } else {
                this.hideRelatedEntitiesLoading();
            }
        } catch (error) {
            this.logError('Failed to load related entities', error, context);
            this.hideRelatedEntitiesLoading();
        }
    }

    /**
     * Show loading indicator for related entities
     */
    showRelatedEntitiesLoading() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container || container.querySelector('.related-entities-loading')) return;

        const loadingHTML = `
            <section class="entity-section entity-section-related related-entities-loading" style="--animation-delay: 0s">
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128279;</span>
                    Related Entities
                </h2>
                <div class="related-entities-container">
                    <div class="loading-indicator" role="status" aria-live="polite">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Loading related entities...</p>
                    </div>
                </div>
            </section>
        `;

        const relatedPanel = container.querySelector('#panel-relationships');
        if (relatedPanel) {
            relatedPanel.insertAdjacentHTML('beforeend', loadingHTML);
        }
    }

    /**
     * Hide loading indicator
     */
    hideRelatedEntitiesLoading() {
        const loadingSection = document.querySelector('.related-entities-loading');
        if (loadingSection) loadingSection.remove();
    }

    /**
     * Update related entities section in DOM
     */
    updateRelatedEntitiesSection(relatedEntities, mythology, entityType) {
        this.hideRelatedEntitiesLoading();

        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        const html = this.renderRelatedEntities(relatedEntities, mythology, entityType);
        const relatedPanel = container.querySelector('#panel-relationships');
        if (relatedPanel) {
            relatedPanel.insertAdjacentHTML('beforeend', html);
        }
    }

    /**
     * Load entity from Firebase
     */
    async loadEntity(mythology, entityType, entityId) {
        if (!this.db) {
            throw new Error(`[EntityDetailViewer] Firebase Firestore not initialized`);
        }

        try {
            const collection = this.getCollectionName(entityType);
            const doc = await this.db.collection(collection).doc(entityId).get();

            if (!doc.exists) return null;

            return { id: doc.id, ...doc.data() };
        } catch (error) {
            this.logError('Failed to load entity', error, { mythology, entityType, entityId });
            throw error;
        }
    }

    /**
     * Load related entities with batched queries
     */
    async loadRelatedEntities(entity) {
        const related = {};
        if (!entity.displayOptions?.relatedEntities) return related;

        const relationshipPromises = entity.displayOptions.relatedEntities.map(async (relationship) => {
            try {
                const entities = await this.loadEntitiesByIdsBatched(
                    relationship.collection,
                    relationship.ids || []
                );

                return {
                    type: relationship.type,
                    data: {
                        label: relationship.label || relationship.type,
                        entities: entities
                    }
                };
            } catch (error) {
                return null;
            }
        });

        const results = await Promise.all(relationshipPromises);

        for (const result of results) {
            if (result && result.data.entities.length > 0) {
                related[result.type] = result.data;
            }
        }

        return related;
    }

    /**
     * Batch load entities by IDs
     */
    async loadEntitiesByIdsBatched(collection, ids) {
        if (!ids || ids.length === 0) return [];

        const uniqueIds = [...new Set(ids)];
        const entities = [];
        const uncachedIds = [];

        for (const id of uniqueIds) {
            const cacheKey = `${collection}:${id}`;
            const cached = this.getCachedEntity(cacheKey);
            if (cached) {
                entities.push(cached);
            } else {
                uncachedIds.push(id);
            }
        }

        if (uncachedIds.length === 0) return entities;

        const chunks = this.chunkArray(uncachedIds, this.MAX_IDS_PER_QUERY);

        const chunkPromises = chunks.map(async (chunk) => {
            try {
                const snapshot = await this.db
                    .collection(collection)
                    .where(window.firebase.firestore.FieldPath.documentId(), 'in', chunk)
                    .get();

                const chunkEntities = [];
                snapshot.forEach(doc => {
                    const entityData = { id: doc.id, ...doc.data() };
                    this.setCachedEntity(`${collection}:${doc.id}`, entityData);
                    chunkEntities.push(entityData);
                });

                return chunkEntities;
            } catch (error) {
                return [];
            }
        });

        const chunkResults = await Promise.all(chunkPromises);
        for (const chunkEntities of chunkResults) {
            entities.push(...chunkEntities);
        }

        return entities;
    }

    /**
     * Chunk array helper
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Get cached entity
     */
    getCachedEntity(cacheKey) {
        const cached = this.relatedEntityCache.get(cacheKey);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.relatedEntityCache.delete(cacheKey);
            return null;
        }
        return cached.data;
    }

    /**
     * Set cached entity
     */
    setCachedEntity(cacheKey, entity) {
        this.relatedEntityCache.set(cacheKey, { data: entity, timestamp: Date.now() });
    }

    /**
     * Log error with context
     */
    logError(message, error, context = {}) {
        const contextStr = Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ');
        console.error(`[EntityDetailViewer] ${message}${contextStr ? ` (${contextStr})` : ''}:`, error);
    }

    /**
     * Generate main HTML structure
     */
    generateHTML(entity, relatedEntities, mythology, entityType) {
        const colors = entity.colors || {};
        const primaryColor = colors.primary || '#667eea';
        const secondaryColor = colors.secondary || '#764ba2';
        this.animationDelay = 0;

        const hasImages = entity.images && entity.images.length > 0;
        const hasCommunity = true; // Always show community section for contribute actions

        return `
            <article class="entity-detail-viewer"
                     data-entity-id="${this.escapeAttr(entity.id)}"
                     data-entity-type="${this.escapeAttr(entityType)}"
                     data-mythology="${this.escapeAttr(mythology)}">

                <!-- Breadcrumb Navigation -->
                ${this.renderBreadcrumb(mythology, entityType, entity.name || entity.title)}

                <!-- Hero Section -->
                <header class="entity-hero-enhanced" style="--primary-color: ${this.escapeAttr(primaryColor)}; --secondary-color: ${this.escapeAttr(secondaryColor)};">
                    <div class="entity-hero-background" aria-hidden="true"></div>
                    <div class="entity-hero-content">
                        <div class="entity-hero-main">
                            ${entity.icon ? `
                                <div class="entity-icon-large" aria-hidden="true">
                                    <span class="icon-float">${this.renderIcon(entity.icon)}</span>
                                </div>
                            ` : ''}
                            <div class="entity-hero-text">
                                <h1 class="entity-title">${this.escapeHtml(entity.name || entity.title)}</h1>
                                ${entity.linguistic?.originalName ? `
                                    <p class="entity-original-name" lang="${this.getLanguageCode(mythology)}">${this.escapeHtml(entity.linguistic.originalName)}</p>
                                ` : ''}
                                ${entity.linguistic?.pronunciation ? `
                                    <p class="entity-pronunciation">/${this.escapeHtml(entity.linguistic.pronunciation)}/</p>
                                ` : ''}

                                <div class="entity-badges" role="list" aria-label="Entity classification">
                                    <span class="entity-type-badge" role="listitem">${this.getEntityTypeLabel(entityType)}</span>
                                    <span class="mythology-badge mythology-${mythology}" role="listitem">${this.capitalize(mythology)}</span>
                                    ${entity.categories?.map(cat => `<span class="category-badge" role="listitem">${this.capitalize(cat)}</span>`).join('') || ''}
                                </div>

                                ${entity.shortDescription ? `
                                    <p class="entity-hero-description">${this.escapeHtml(entity.shortDescription)}</p>
                                ` : ''}

                                ${entity.epithets && entity.epithets.length > 0 ? `
                                    <div class="entity-epithets" role="list" aria-label="Epithets">
                                        ${entity.epithets.slice(0, 5).map(epithet => `
                                            <span class="epithet-tag" role="listitem">${this.escapeHtml(epithet)}</span>
                                        `).join('')}
                                        ${entity.epithets.length > 5 ? `<span class="epithet-more">+${entity.epithets.length - 5} more</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Quick Stats in Hero -->
                        ${this.renderQuickStats(entity, entityType)}

                        <!-- Hero Action Buttons -->
                        ${this.renderHeroActions(entity)}
                    </div>
                </header>

                <!-- Quick Actions Bar -->
                <nav class="entity-quick-actions" aria-label="Quick actions">
                    <button class="quick-action-btn" onclick="window.history.back()" aria-label="Go back">
                        <span class="action-icon" aria-hidden="true">&#8592;</span>
                        <span class="action-text">Back</span>
                    </button>
                    <button class="quick-action-btn" data-action="share" data-entity-name="${this.escapeAttr(entity.name || entity.title)}" data-entity-id="${this.escapeAttr(entity.id)}" aria-label="Share">
                        <span class="action-icon" aria-hidden="true">&#128279;</span>
                        <span class="action-text">Share</span>
                    </button>
                    <button class="quick-action-btn${EntityDetailViewer.isBookmarked(entity.id) ? ' bookmarked' : ''}" data-action="bookmark" data-entity-id="${this.escapeAttr(entity.id)}" aria-label="Bookmark">
                        <span class="action-icon" aria-hidden="true">${EntityDetailViewer.isBookmarked(entity.id) ? '&#9733;' : '&#9734;'}</span>
                        <span class="action-text">Bookmark</span>
                    </button>
                    ${entity.corpusQueries && entity.corpusQueries.length > 0 ? `
                        <button class="quick-action-btn quick-action-primary" data-action="scroll-to" data-section="corpus-section" aria-label="View sources">
                            <span class="action-icon" aria-hidden="true">&#128214;</span>
                            <span class="action-text">Sources</span>
                        </button>
                    ` : ''}
                </nav>

                <!-- Main Layout: Content + Sidebar -->
                <div class="entity-layout">
                    <!-- Main Content Area -->
                    <main class="entity-main-content">
                        <!-- Tab Navigation -->
                        <nav class="entity-tabs" role="tablist" aria-label="Entity content sections">
                            <button class="entity-tab-btn active" role="tab" data-tab="overview" aria-selected="true" aria-controls="panel-overview">
                                <span class="tab-icon">&#128220;</span>
                                Overview
                            </button>
                            <button class="entity-tab-btn" role="tab" data-tab="mythology" aria-selected="false" aria-controls="panel-mythology">
                                <span class="tab-icon">&#128218;</span>
                                Mythology
                            </button>
                            <button class="entity-tab-btn" role="tab" data-tab="relationships" aria-selected="false" aria-controls="panel-relationships">
                                <span class="tab-icon">&#128279;</span>
                                Relationships
                            </button>
                            <button class="entity-tab-btn" role="tab" data-tab="community" aria-selected="false" aria-controls="panel-community">
                                <span class="tab-icon">&#128101;</span>
                                Community
                            </button>
                        </nav>

                        <!-- Tab Panels -->
                        <div class="entity-tab-panels">
                            <!-- Overview Panel -->
                            <section id="panel-overview" class="entity-tab-panel active" role="tabpanel" aria-labelledby="tab-overview">
                                ${this.renderOverviewPanel(entity, entityType)}
                            </section>

                            <!-- Mythology Panel -->
                            <section id="panel-mythology" class="entity-tab-panel" role="tabpanel" aria-labelledby="tab-mythology">
                                ${this.renderMythologyPanel(entity, entityType)}
                            </section>

                            <!-- Relationships Panel -->
                            <section id="panel-relationships" class="entity-tab-panel" role="tabpanel" aria-labelledby="tab-relationships">
                                ${this.renderRelationshipsPanel(entity, relatedEntities, mythology, entityType)}
                            </section>

                            <!-- Community Panel -->
                            <section id="panel-community" class="entity-tab-panel" role="tabpanel" aria-labelledby="tab-community">
                                ${this.renderCommunityPanel(entity)}
                            </section>
                        </div>

                        <!-- Image Gallery (if multiple images) -->
                        ${hasImages ? this.renderImageGallery(entity.images) : ''}

                        <!-- Metadata Footer -->
                        ${this.renderMetadataFooter(entity)}
                    </main>

                    <!-- Sticky Sidebar (Desktop) -->
                    <aside class="entity-sidebar">
                        ${this.renderQuickNavigation(entity, entityType)}
                        ${this.renderKeyAttributes(entity, entityType)}
                    </aside>
                </div>

                <!-- Contribute Button Container (for floating action) -->
                <div class="entity-contribute-container" id="contribute-menu-container"></div>
            </article>
        `;
    }

    /**
     * Render quick stats in hero section
     */
    renderQuickStats(entity, entityType) {
        const stats = [];

        if (entity.domains?.length) {
            stats.push({ label: 'Domains', value: entity.domains.length, icon: '&#127760;' });
        }
        if (entity.feats?.length) {
            stats.push({ label: 'Feats', value: entity.feats.length, icon: '&#127942;' });
        }
        if (entity.abilities?.length) {
            stats.push({ label: 'Abilities', value: entity.abilities.length, icon: '&#9889;' });
        }
        if (entity.powers?.length) {
            stats.push({ label: 'Powers', value: entity.powers.length, icon: '&#10024;' });
        }
        if (entity.corpusQueries?.length) {
            stats.push({ label: 'Sources', value: entity.corpusQueries.length, icon: '&#128214;' });
        }

        if (stats.length === 0) return '';

        return `
            <div class="entity-quick-stats">
                ${stats.slice(0, 4).map(stat => `
                    <div class="quick-stat">
                        <span class="quick-stat-icon" aria-hidden="true">${stat.icon}</span>
                        <span class="quick-stat-value">${stat.value}</span>
                        <span class="quick-stat-label">${stat.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render hero action buttons
     */
    renderHeroActions(entity) {
        const isFavorite = EntityDetailViewer.isBookmarked(entity.id);

        return `
            <div class="entity-hero-actions">
                <button class="hero-action-btn hero-action-btn--favorite${isFavorite ? ' active' : ''}"
                        data-action="bookmark"
                        data-entity-id="${this.escapeAttr(entity.id)}"
                        aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        aria-pressed="${isFavorite}">
                    <span class="action-icon" aria-hidden="true">${isFavorite ? '&#9829;' : '&#9825;'}</span>
                    <span class="action-text">${isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>
                <button class="hero-action-btn"
                        data-action="share"
                        data-entity-name="${this.escapeAttr(entity.name || entity.title)}"
                        data-entity-id="${this.escapeAttr(entity.id)}"
                        aria-label="Share this entity">
                    <span class="action-icon" aria-hidden="true">&#128279;</span>
                    <span class="action-text">Share</span>
                </button>
                <button class="hero-action-btn"
                        data-action="add-note"
                        data-entity-id="${this.escapeAttr(entity.id)}"
                        aria-label="Add personal note">
                    <span class="action-icon" aria-hidden="true">&#128221;</span>
                    <span class="action-text">Add Note</span>
                </button>
                ${entity.editLink ? `
                    <a href="${this.escapeAttr(entity.editLink)}" class="hero-action-btn hero-action-btn--primary" aria-label="Edit this entity">
                        <span class="action-icon" aria-hidden="true">&#9998;</span>
                        <span class="action-text">Edit</span>
                    </a>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render Overview tab panel
     */
    renderOverviewPanel(entity, entityType) {
        return `
            <!-- Primary Information Grid -->
            ${this.renderPrimaryInfoGrid(entity, entityType)}

            <!-- Full Description with Read More -->
            ${this.renderCollapsibleDescription(entity)}

            <!-- Symbolism -->
            ${entity.symbolism ? `
                <section class="entity-section entity-section-symbolism" id="symbolism-section" ${this.getAnimationStyle()}>
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">&#128302;</span>
                        Symbolism & Meaning
                    </h2>
                    <div class="entity-description prose">
                        ${this.renderMarkdown(entity.symbolism)}
                    </div>
                </section>
            ` : ''}

            <!-- Type-Specific Sections -->
            ${this.renderTypeSpecificSections(entity, entityType)}

            <!-- Metaphysical Properties -->
            ${entity.metaphysicalProperties ? this.renderMetaphysicalProperties(entity.metaphysicalProperties) : ''}

            <!-- Archetypes -->
            ${entity.archetypes && entity.archetypes.length > 0 ? this.renderArchetypes(entity.archetypes) : ''}
        `;
    }

    /**
     * Render Mythology tab panel
     */
    renderMythologyPanel(entity, entityType) {
        return `
            <!-- Extended Content Sections -->
            ${entity.extendedContent && entity.extendedContent.length > 0 ? this.renderExtendedContent(entity.extendedContent) : ''}

            <!-- Linguistic Information -->
            ${entity.linguistic ? this.renderLinguisticInfo(entity.linguistic, entity) : ''}

            <!-- Geographical Information -->
            ${entity.geographical ? this.renderGeographicalInfo(entity.geographical) : ''}

            <!-- Temporal Information -->
            ${entity.temporal ? this.renderTemporalInfo(entity.temporal) : ''}

            <!-- Cultural Context -->
            ${entity.cultural || entity.culturalContext ? this.renderCulturalContext(entity.cultural || entity.culturalContext) : ''}

            <!-- Corpus Queries / Primary Sources -->
            ${entity.corpusQueries ? this.renderCorpusQueries(entity.corpusQueries) : ''}

            <!-- Sources & References -->
            ${entity.sources ? this.renderSources(entity.sources) : ''}

            <!-- Dynamic Metadata Sections -->
            ${this.renderAllMetadata(entity, entityType)}
        `;
    }

    /**
     * Render Relationships tab panel
     */
    renderRelationshipsPanel(entity, relatedEntities, mythology, entityType) {
        return `
            <!-- Related Entities from schema -->
            ${entity.relatedEntities ? this.renderSchemaRelatedEntities(entity.relatedEntities, mythology) : ''}

            <!-- Related Entities from displayOptions (loaded async) -->
            ${Object.keys(relatedEntities).length > 0 ? this.renderRelatedEntities(relatedEntities, mythology, entityType) : ''}
        `;
    }

    /**
     * Render Community tab panel with contribution actions
     */
    renderCommunityPanel(entity) {
        return `
            <section class="entity-section entity-section-community" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128101;</span>
                    Community Contributions
                </h2>

                <!-- Community Sub-tabs -->
                <div class="community-tabs" role="tablist">
                    <button class="community-tab active" data-community-tab="discussion" role="tab" aria-selected="true">
                        <span class="tab-icon" aria-hidden="true">&#128172;</span>
                        Discussion
                    </button>
                    <button class="community-tab" data-community-tab="notes" role="tab" aria-selected="false">
                        <span class="tab-icon" aria-hidden="true">&#128221;</span>
                        Notes
                    </button>
                    <button class="community-tab" data-community-tab="perspectives" role="tab" aria-selected="false">
                        <span class="tab-icon" aria-hidden="true">&#128065;</span>
                        Perspectives
                    </button>
                    <button class="community-tab" data-community-tab="connections" role="tab" aria-selected="false">
                        <span class="tab-icon" aria-hidden="true">&#128279;</span>
                        Connections
                    </button>
                </div>

                <!-- Community Content Panels -->
                <div class="community-panels">
                    <!-- Discussion Panel (Reddit-style threaded discussions) -->
                    <div class="community-panel active" data-panel="discussion" role="tabpanel">
                        <div class="asset-discussion-container"
                             id="discussion-${this.escapeAttr(entity.id)}"
                             data-asset-id="${this.escapeAttr(entity.id)}"
                             data-asset-type="${this.escapeAttr(entity.entityType || 'entities')}"
                             data-asset-name="${this.escapeAttr(entity.name || '')}"
                             data-mythology="${this.escapeAttr(entity.mythology || '')}">
                            <!-- AssetDiscussion component will be initialized here -->
                            <div class="discussion-loading">
                                <div class="loading-spinner"></div>
                                <p class="loading-text">Loading discussions...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Notes Panel -->
                    <div class="community-panel" data-panel="notes" role="tabpanel">
                        <div class="community-notes-list" id="notes-list">
                            <div class="community-empty-state">
                                <span class="empty-icon" aria-hidden="true">&#128221;</span>
                                <h3>Share Your Research Notes</h3>
                                <p>Add personal notes, observations, or research about ${this.escapeHtml(entity.name || 'this entity')}.</p>
                                <button class="btn-contribute" data-action="add-note" data-entity-id="${this.escapeAttr(entity.id)}">
                                    <span class="btn-icon" aria-hidden="true">&#10133;</span>
                                    Add Note
                                </button>
                            </div>
                        </div>
                        <!-- Add Note Form (hidden by default) -->
                        <div class="add-contribution-form" id="add-note-form" style="display: none;">
                            <h4>Add Your Note</h4>
                            <textarea class="contribution-textarea" placeholder="Share your research notes, observations, or insights about ${this.escapeHtml(entity.name || 'this entity')}..." aria-label="Note content"></textarea>
                            <div class="contribution-actions">
                                <button class="btn-secondary" data-action="cancel-note">Cancel</button>
                                <button class="btn-primary" data-action="submit-note" data-entity-id="${this.escapeAttr(entity.id)}">
                                    <span class="btn-icon" aria-hidden="true">&#10003;</span>
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Perspectives Panel -->
                    <div class="community-panel" data-panel="perspectives" role="tabpanel">
                        <div class="community-perspectives-list" id="perspectives-list">
                            <div class="community-empty-state">
                                <span class="empty-icon" aria-hidden="true">&#128065;</span>
                                <h3>Share Your Interpretation</h3>
                                <p>What does ${this.escapeHtml(entity.name || 'this entity')} mean to you? Share your unique perspective.</p>
                                <button class="btn-contribute" data-action="add-perspective" data-entity-id="${this.escapeAttr(entity.id)}">
                                    <span class="btn-icon" aria-hidden="true">&#10133;</span>
                                    Add Perspective
                                </button>
                            </div>
                        </div>
                        <!-- Add Perspective Form (hidden by default) -->
                        <div class="add-contribution-form" id="add-perspective-form" style="display: none;">
                            <h4>Share Your Perspective</h4>
                            <textarea class="contribution-textarea" placeholder="Share your interpretation, analysis, or personal insights about ${this.escapeHtml(entity.name || 'this entity')}..." aria-label="Perspective content"></textarea>
                            <div class="contribution-actions">
                                <button class="btn-secondary" data-action="cancel-perspective">Cancel</button>
                                <button class="btn-primary" data-action="submit-perspective" data-entity-id="${this.escapeAttr(entity.id)}">
                                    <span class="btn-icon" aria-hidden="true">&#10003;</span>
                                    Share Perspective
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Connections Panel -->
                    <div class="community-panel" data-panel="connections" role="tabpanel">
                        <div class="community-connections-list" id="connections-list">
                            <div class="community-empty-state">
                                <span class="empty-icon" aria-hidden="true">&#128279;</span>
                                <h3>Suggest Connections</h3>
                                <p>Help map relationships between ${this.escapeHtml(entity.name || 'this entity')} and other mythological figures.</p>
                                <button class="btn-contribute" data-action="add-connection" data-entity-id="${this.escapeAttr(entity.id)}">
                                    <span class="btn-icon" aria-hidden="true">&#10133;</span>
                                    Suggest Connection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Render quick navigation sidebar
     */
    renderQuickNavigation(entity, entityType) {
        const sections = [];

        if (entity.fullDescription || entity.description) {
            sections.push({ id: 'description-section', label: 'Overview', icon: '&#128220;' });
        }
        if (entity.symbolism) {
            sections.push({ id: 'symbolism-section', label: 'Symbolism', icon: '&#128302;' });
        }
        if (entity.corpusQueries?.length) {
            sections.push({ id: 'corpus-section', label: 'Sources', icon: '&#128214;' });
        }
        if (entity.linguistic) {
            sections.push({ id: 'linguistic-section', label: 'Linguistics', icon: '&#127759;' });
        }
        if (entity.extendedContent?.length) {
            sections.push({ id: 'extended-section', label: 'Deep Dive', icon: '&#128218;' });
        }
        if (entity.metaphysicalProperties) {
            sections.push({ id: 'metaphysical-section', label: 'Metaphysics', icon: '&#10024;' });
        }

        if (sections.length === 0) return '';

        return `
            <nav class="entity-toc" aria-label="Table of contents">
                <h3 class="toc-title">Contents</h3>
                <ul class="toc-list">
                    ${sections.map((section, index) => `
                        <li class="toc-item${index === 0 ? ' active' : ''}" data-section="${section.id}">
                            <a href="#${section.id}" class="toc-link" data-toc-link="${section.id}">
                                <span class="nav-icon" aria-hidden="true">${section.icon}</span>
                                ${section.label}
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div class="toc-progress" aria-hidden="true">
                    <div class="toc-progress-bar" style="width: 0%"></div>
                </div>
            </nav>
            <nav class="entity-quick-nav" aria-label="Section navigation">
                <h3 class="quick-nav-title">Quick Navigation</h3>
                <ul class="quick-nav-list">
                    ${sections.map(section => `
                        <li>
                            <a href="#${section.id}" class="quick-nav-link">
                                <span class="nav-icon" aria-hidden="true">${section.icon}</span>
                                ${section.label}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </nav>
        `;
    }

    /**
     * Render key attributes sidebar
     */
    renderKeyAttributes(entity, entityType) {
        const fields = this.getPrimaryFields(entityType);
        const items = fields
            .map(field => {
                const value = this.getNestedValue(entity, field.path);
                if (!value) return null;
                return { ...field, value };
            })
            .filter(Boolean)
            .slice(0, 6);

        if (items.length === 0) return '';

        return `
            <div class="entity-key-attributes">
                <h3 class="key-attributes-title">Key Attributes</h3>
                <dl class="key-attributes-list">
                    ${items.map(item => `
                        <div class="key-attribute">
                            <dt class="key-attribute-label">
                                <span class="attr-icon" aria-hidden="true">${this.renderIcon(item.icon, '&#9679;')}</span>
                                ${item.label}
                            </dt>
                            <dd class="key-attribute-value" title="${this.escapeAttr(this.formatAttributeValuePlain(item.value))}">
                                ${this.truncateValue(this.formatAttributeValue(item.value), 100)}
                            </dd>
                        </div>
                    `).join('')}
                </dl>
            </div>
        `;
    }

    /**
     * Render collapsible description with CSS line-clamp and "Show more"
     */
    renderCollapsibleDescription(entity) {
        const description = entity.fullDescription || entity.description;
        if (!description) return '';

        const needsCollapse = description.length > this.DESCRIPTION_COLLAPSE_THRESHOLD;

        if (!needsCollapse) {
            return `
                <section class="entity-section entity-section-description" id="description-section" ${this.getAnimationStyle()}>
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">&#128220;</span>
                        Overview
                    </h2>
                    <div class="entity-description prose">
                        ${this.renderMarkdown(description)}
                    </div>
                </section>
            `;
        }

        return `
            <section class="entity-section entity-section-description" id="description-section" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128220;</span>
                    Overview
                </h2>
                <div class="collapsible-text" data-collapsed="true">
                    <div class="collapsible-content entity-description prose line-clamp-container">
                        ${this.renderMarkdown(description)}
                    </div>
                    <div class="collapsible-fade" aria-hidden="true"></div>
                    <button class="read-more-toggle" aria-expanded="false" aria-controls="description-content">
                        <span class="toggle-text">Show more</span>
                        <span class="toggle-icon" aria-hidden="true">&#9660;</span>
                    </button>
                </div>
            </section>
        `;
    }

    /**
     * Render image gallery
     */
    renderImageGallery(images) {
        if (!images || images.length === 0) return '';

        const showThumbnails = images.length > 1 && images.length <= 8;
        const showGrid = images.length > 8;

        return `
            <section class="entity-section entity-section-gallery" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127912;</span>
                    Gallery
                    <span class="tab-badge">${images.length}</span>
                </h2>
                <div class="gallery-container" data-gallery-id="${Date.now()}">
                    ${showGrid ? `
                        <!-- Grid View for many images -->
                        <div class="gallery-grid">
                            ${images.map((img, index) => `
                                <div class="gallery-grid-item"
                                     data-index="${index}"
                                     data-src="${this.escapeAttr(img.url)}"
                                     data-caption="${this.escapeAttr(img.caption || '')}"
                                     role="button"
                                     tabindex="0"
                                     aria-label="View image ${index + 1}: ${this.escapeAttr(img.caption || 'Gallery image')}">
                                    <img src="${this.escapeAttr(img.thumbnail || img.url)}"
                                         alt="${this.escapeAttr(img.caption || 'Entity image')}"
                                         loading="lazy" />
                                    <span class="gallery-grid-zoom" aria-hidden="true">&#128269;</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : images.length > 1 ? `
                        <!-- Carousel View -->
                        <div class="gallery-carousel">
                            <span class="gallery-counter" aria-live="polite">1 / ${images.length}</span>
                            <button class="gallery-nav gallery-prev" aria-label="Previous image">&#8249;</button>
                            <div class="gallery-track">
                                ${images.map((img, index) => `
                                    <div class="gallery-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                                        <img src="${this.escapeAttr(img.thumbnail || img.url)}"
                                             alt="${this.escapeAttr(img.caption || 'Entity image')}"
                                             class="gallery-image"
                                             data-src="${this.escapeAttr(img.url)}"
                                             data-caption="${this.escapeAttr(img.caption || '')}"
                                             loading="lazy"
                                             role="button"
                                             tabindex="0"
                                             aria-label="Click to enlarge" />
                                    </div>
                                `).join('')}
                            </div>
                            <button class="gallery-nav gallery-next" aria-label="Next image">&#8250;</button>
                        </div>
                        ${showThumbnails ? `
                            <div class="gallery-thumbnails" role="listbox" aria-label="Image thumbnails">
                                ${images.map((img, index) => `
                                    <button class="gallery-thumbnail ${index === 0 ? 'active' : ''}"
                                            data-index="${index}"
                                            role="option"
                                            aria-selected="${index === 0}"
                                            aria-label="View image ${index + 1}">
                                        <img src="${this.escapeAttr(img.thumbnail || img.url)}"
                                             alt=""
                                             loading="lazy" />
                                    </button>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="gallery-indicators" role="tablist">
                                ${images.map((_, index) => `
                                    <button class="gallery-indicator ${index === 0 ? 'active' : ''}"
                                            data-index="${index}"
                                            role="tab"
                                            aria-selected="${index === 0}"
                                            aria-label="Go to image ${index + 1}"></button>
                                `).join('')}
                            </div>
                        `}
                        ${images[0].caption ? `
                            <p class="gallery-caption">${this.escapeHtml(images[0].caption)}</p>
                        ` : ''}
                    ` : `
                        <!-- Single Image View -->
                        <div class="gallery-single">
                            <img src="${this.escapeAttr(images[0].thumbnail || images[0].url)}"
                                 alt="${this.escapeAttr(images[0].caption || 'Entity image')}"
                                 class="gallery-image"
                                 data-src="${this.escapeAttr(images[0].url)}"
                                 data-caption="${this.escapeAttr(images[0].caption || '')}"
                                 loading="lazy"
                                 role="button"
                                 tabindex="0"
                                 aria-label="Click to enlarge" />
                            ${images[0].caption ? `
                                <p class="gallery-caption">${this.escapeHtml(images[0].caption)}</p>
                            ` : ''}
                        </div>
                    `}
                </div>
            </section>
        `;
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb(mythology, entityType, entityName) {
        return `
            <nav class="entity-breadcrumb" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    <li class="breadcrumb-item">
                        <a href="#/" class="breadcrumb-link">Home</a>
                    </li>
                    <li class="breadcrumb-separator" aria-hidden="true">&#8250;</li>
                    <li class="breadcrumb-item">
                        <a href="#/mythology/${mythology}" class="breadcrumb-link">${this.capitalize(mythology)}</a>
                    </li>
                    <li class="breadcrumb-separator" aria-hidden="true">&#8250;</li>
                    <li class="breadcrumb-item">
                        <a href="#/mythology/${mythology}/${entityType}" class="breadcrumb-link">${this.getEntityTypeLabel(entityType)}s</a>
                    </li>
                    <li class="breadcrumb-separator" aria-hidden="true">&#8250;</li>
                    <li class="breadcrumb-item breadcrumb-current" aria-current="page">
                        ${this.escapeHtml(entityName)}
                    </li>
                </ol>
            </nav>
        `;
    }

    /**
     * Render primary info as a grid
     */
    renderPrimaryInfoGrid(entity, entityType) {
        const fields = this.getPrimaryFields(entityType);
        const items = fields
            .map(field => {
                const value = this.getNestedValue(entity, field.path);
                if (!value) return null;
                return { ...field, value };
            })
            .filter(Boolean);

        if (items.length === 0) return '';

        return `
            <section class="entity-section entity-section-attributes" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#10024;</span>
                    Key Attributes
                </h2>
                <div class="entity-attributes-grid" role="list">
                    ${items.map(item => `
                        <div class="entity-attribute-card" role="listitem" ${this.getAnimationStyle()}>
                            <div class="attribute-icon" aria-hidden="true">${this.renderIcon(item.icon, '&#9679;')}</div>
                            <div class="attribute-content">
                                <dt class="attribute-label">${item.label}</dt>
                                <dd class="attribute-value">${this.formatAttributeValue(item.value)}</dd>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Format attribute value for display
     */
    formatAttributeValue(value) {
        if (Array.isArray(value)) {
            return value.map(v => `<span class="attribute-tag">${this.escapeHtml(v)}</span>`).join('');
        }
        return this.escapeHtml(String(value));
    }

    /**
     * Format attribute value as plain text
     */
    formatAttributeValuePlain(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return String(value);
    }

    /**
     * Truncate value with tooltip indicator
     */
    truncateValue(html, maxLength) {
        // Strip HTML for length check
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText;

        if (text.length <= maxLength) return html;

        // Return truncated with ellipsis
        return `<span class="truncated-value">${html}</span>`;
    }

    /**
     * Get animation style with incremented delay
     */
    getAnimationStyle() {
        const delay = this.animationDelay;
        this.animationDelay += 0.05;
        return `style="--animation-delay: ${delay}s"`;
    }

    /**
     * Render related entities with "See all" functionality
     */
    renderRelatedEntities(relatedEntities, mythology, entityType) {
        return `
            <section class="entity-section entity-section-related" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128279;</span>
                    Related Entities
                </h2>
                <div class="related-entities-container">
                    ${Object.entries(relatedEntities).map(([type, data]) => {
                        const routeType = this.normalizeEntityTypeForRoute(type);
                        const allEntities = data.entities;
                        const visibleEntities = allEntities.slice(0, this.MAX_RELATED_VISIBLE);
                        const hasMore = allEntities.length > this.MAX_RELATED_VISIBLE;

                        return `
                            <div class="related-entities-group" ${this.getAnimationStyle()}>
                                <div class="related-group-header">
                                    <h3 class="related-group-title">${data.label}</h3>
                                    ${hasMore ? `
                                        <a href="#/mythology/${mythology}/${routeType}" class="see-all-link">
                                            See all ${allEntities.length} &rarr;
                                        </a>
                                    ` : ''}
                                </div>
                                <div class="related-entities-grid" role="list">
                                    ${visibleEntities.map(entity => {
                                        const entityRouteType = entity.type ? this.normalizeEntityTypeForRoute(entity.type) : routeType;
                                        return `
                                            <a href="#/mythology/${entity.mythology || mythology}/${entityRouteType}/${entity.id}"
                                               class="related-entity-card"
                                               role="listitem"
                                               aria-label="View ${this.escapeHtml(entity.name || entity.title)}">
                                                <div class="related-entity-icon" aria-hidden="true">
                                                    ${this.renderIcon(entity.icon, this.getDefaultIcon(entityRouteType))}
                                                </div>
                                                <div class="related-entity-info">
                                                    <span class="related-entity-name">${this.escapeHtml(entity.name || entity.title)}</span>
                                                    ${entity.shortDescription ? `
                                                        <span class="related-entity-desc">${this.truncate(entity.shortDescription, 60)}</span>
                                                    ` : ''}
                                                </div>
                                                <span class="related-entity-arrow" aria-hidden="true">&#8594;</span>
                                            </a>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render corpus queries section
     */
    renderCorpusQueries(corpusQueries) {
        if (!corpusQueries || corpusQueries.length === 0) return '';

        return `
            <section class="entity-section entity-section-corpus" id="corpus-section" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128214;</span>
                    Primary Sources
                </h2>
                <p class="section-description">
                    References from ancient texts and scholarly sources
                </p>
                <div class="corpus-queries-list">
                    ${corpusQueries.map((query, index) => `
                        <article class="corpus-query-card" ${this.getAnimationStyle()}>
                            <header class="corpus-query-header">
                                <span class="corpus-source-icon" aria-hidden="true">${this.getSourceIcon(query.source)}</span>
                                <div class="corpus-source-info">
                                    <h3 class="corpus-source-title">${this.escapeHtml(query.source || 'Unknown Source')}</h3>
                                    ${query.reference ? `<p class="corpus-reference">${this.escapeHtml(query.reference)}</p>` : ''}
                                </div>
                            </header>
                            ${query.text ? `
                                <blockquote class="corpus-query-text">
                                    <p>${this.escapeHtml(query.text)}</p>
                                </blockquote>
                            ` : ''}
                            ${query.context ? `
                                <p class="corpus-query-context">${this.escapeHtml(query.context)}</p>
                            ` : ''}
                            <footer class="corpus-query-footer">
                                ${query.date ? `<span class="corpus-date">${this.escapeHtml(query.date)}</span>` : ''}
                                ${query.author ? `<span class="corpus-author">by ${this.escapeHtml(query.author)}</span>` : ''}
                            </footer>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Get source icon based on source type
     */
    getSourceIcon(source) {
        if (!source) return '&#128220;';
        const s = source.toLowerCase();
        if (s.includes('iliad') || s.includes('odyssey')) return '&#9875;';
        if (s.includes('bible') || s.includes('testament')) return '&#10013;';
        if (s.includes('veda') || s.includes('upanishad')) return '&#128329;';
        if (s.includes('edda') || s.includes('norse')) return '&#9889;';
        if (s.includes('egypt')) return '&#9765;';
        if (s.includes('epic') || s.includes('saga')) return '&#9876;';
        return '&#128214;';
    }

    /**
     * Get language code for mythology
     */
    getLanguageCode(mythology) {
        const codes = {
            'greek': 'grc', 'egyptian': 'egy', 'norse': 'non',
            'hindu': 'sa', 'celtic': 'cel', 'mesopotamian': 'akk',
            'japanese': 'ja', 'chinese': 'zh'
        };
        return codes[mythology] || 'en';
    }

    /**
     * Render metadata footer
     */
    renderMetadataFooter(entity) {
        const hasMetadata = entity.createdAt || entity.updatedAt || entity.createdBy;
        if (!hasMetadata) return '';

        return `
            <footer class="entity-metadata-footer">
                <div class="metadata-item">
                    <span class="metadata-label">Last updated:</span>
                    <time class="metadata-value" datetime="${entity.updatedAt || entity.createdAt}">
                        ${this.formatDate(entity.updatedAt || entity.createdAt)}
                    </time>
                </div>
                ${entity.version ? `
                    <div class="metadata-item">
                        <span class="metadata-label">Version:</span>
                        <span class="metadata-value">${entity.version}</span>
                    </div>
                ` : ''}
            </footer>
        `;
    }

    /**
     * Format date for display
     */
    formatDate(dateValue) {
        if (!dateValue) return 'Unknown';
        try {
            const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
            return date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch (e) {
            return 'Unknown';
        }
    }

    /**
     * Render markdown-like text with XSS protection
     */
    renderMarkdown(text) {
        if (!text) return '';

        let escaped = this.escapeHtml(text);

        escaped = escaped
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');

        const paragraphs = escaped.split(/\n\n+/);
        return paragraphs
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    /**
     * Static helper for sharing with enhanced feedback
     */
    static shareEntity(name, id) {
        const url = window.location.href;
        const shareBtn = document.querySelector('[data-action="share"]');

        if (navigator.share) {
            navigator.share({
                title: name,
                text: `Learn about ${name} in mythology`,
                url: url
            }).catch((err) => {
                // User cancelled - fallback to clipboard
                if (err.name !== 'AbortError') {
                    EntityDetailViewer.copyToClipboard(url, shareBtn);
                }
            });
        } else {
            EntityDetailViewer.copyToClipboard(url, shareBtn);
        }
    }

    /**
     * Copy to clipboard with visual feedback
     */
    static copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success feedback on button
            if (button) {
                const originalIcon = button.querySelector('.action-icon')?.innerHTML;
                const originalText = button.querySelector('.action-text')?.textContent;

                button.classList.add('copy-success');
                const icon = button.querySelector('.action-icon');
                const textEl = button.querySelector('.action-text');

                if (icon) icon.innerHTML = '&#10003;';
                if (textEl) textEl.textContent = 'Copied!';

                setTimeout(() => {
                    button.classList.remove('copy-success');
                    if (icon && originalIcon) icon.innerHTML = originalIcon;
                    if (textEl && originalText) textEl.textContent = originalText;
                }, 2000);
            }

            EntityDetailViewer.showToast('Link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                EntityDetailViewer.showToast('Link copied to clipboard!');
            } catch (e) {
                EntityDetailViewer.showToast('Could not copy link. Press Ctrl+C to copy.', 'error');
                window.prompt('Copy this URL:', text);
            }
            document.body.removeChild(textarea);
        });
    }

    /**
     * Static helper for bookmarking (toggle)
     */
    static bookmarkEntity(id) {
        const bookmarks = JSON.parse(localStorage.getItem('entityBookmarks') || '[]');
        const index = bookmarks.indexOf(id);

        if (index !== -1) {
            bookmarks.splice(index, 1);
            localStorage.setItem('entityBookmarks', JSON.stringify(bookmarks));
            EntityDetailViewer.showToast('Bookmark removed');
            EntityDetailViewer.updateBookmarkButton(id, false);
        } else {
            bookmarks.push(id);
            localStorage.setItem('entityBookmarks', JSON.stringify(bookmarks));
            EntityDetailViewer.showToast('Bookmarked!');
            EntityDetailViewer.updateBookmarkButton(id, true);
        }
    }

    /**
     * Update bookmark button visual state
     */
    static updateBookmarkButton(entityId, isBookmarked) {
        const btn = document.querySelector(`[data-action="bookmark"][data-entity-id="${entityId}"]`);
        if (btn) {
            const icon = btn.querySelector('.action-icon');
            if (icon) icon.innerHTML = isBookmarked ? '&#9733;' : '&#9734;';
            btn.classList.toggle('bookmarked', isBookmarked);
        }
    }

    /**
     * Check if entity is bookmarked
     */
    static isBookmarked(id) {
        const bookmarks = JSON.parse(localStorage.getItem('entityBookmarks') || '[]');
        return bookmarks.includes(id);
    }

    /**
     * Static helper to scroll to section with smooth animation and offset
     */
    static scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Account for sticky header
        const stickyHeader = document.querySelector('.entity-quick-actions');
        const offset = stickyHeader ? stickyHeader.offsetHeight + 20 : 80;

        const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;

        // Use smooth scroll with fallback
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            // Fallback for older browsers - animate manually
            EntityDetailViewer.smoothScrollTo(targetPosition, 500);
        }

        // Update URL hash without triggering scroll
        history.pushState(null, null, `#${sectionId}`);

        // Focus section for accessibility
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
    }

    /**
     * Manual smooth scroll animation for older browsers
     */
    static smoothScrollTo(targetY, duration) {
        const startY = window.pageYOffset;
        const difference = targetY - startY;
        const startTime = performance.now();

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-cubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            window.scrollTo(0, startY + difference * easeProgress);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    /**
     * Show toast notification
     */
    static showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'entity-toast';
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /**
     * Static method to toggle section collapse
     */
    static toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.toggle('collapsed');
            const indicator = section.querySelector('.collapse-indicator');
            if (indicator) {
                indicator.innerHTML = section.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
            }
        }
    }

    /**
     * Render type-specific sections
     */
    renderTypeSpecificSections(entity, entityType) {
        let html = '';

        if (entityType === 'deity') {
            if (entity.mythology_specific) {
                html += this.renderSection('Mythology-Specific Information', entity.mythology_specific);
            }
            if (entity.worship) {
                html += this.renderSection('Worship & Rituals', entity.worship);
            }
        }

        if (entityType === 'hero') {
            if (entity.feats) {
                html += this.renderListSection('Legendary Feats', entity.feats);
            }
            if (entity.weapons) {
                html += this.renderListSection('Weapons & Equipment', entity.weapons);
            }
        }

        if (entityType === 'creature') {
            if (entity.abilities) {
                html += this.renderListSection('Abilities & Powers', entity.abilities);
            }
            if (entity.weaknesses) {
                html += this.renderListSection('Weaknesses', entity.weaknesses);
            }
        }

        return html;
    }

    /**
     * Render linguistic information
     */
    renderLinguisticInfo(linguistic, entity = {}) {
        if (!linguistic || Object.keys(linguistic).length === 0) return '';

        const alternateNames = linguistic.alternativeNames || linguistic.alternateNames || entity.alternateNames || [];
        const epithets = entity.epithets || [];

        return `
            <section class="entity-section entity-section-linguistic" id="linguistic-section" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127759;</span>
                    Linguistic Information
                </h2>
                <div class="linguistic-grid">
                    ${linguistic.originalName ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Original Name</dt>
                            <dd class="linguistic-value linguistic-original">${this.escapeHtml(linguistic.originalName)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.transliteration ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Transliteration</dt>
                            <dd class="linguistic-value">${this.escapeHtml(linguistic.transliteration)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.pronunciation ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Pronunciation</dt>
                            <dd class="linguistic-value linguistic-pronunciation">${this.escapeHtml(linguistic.pronunciation)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.etymology ? `
                        <div class="linguistic-card linguistic-card-wide">
                            <dt class="linguistic-label">Etymology</dt>
                            <dd class="linguistic-value">${this.formatEtymology(linguistic.etymology)}</dd>
                        </div>
                    ` : ''}
                    ${alternateNames.length > 0 ? `
                        <div class="linguistic-card linguistic-card-wide">
                            <dt class="linguistic-label">Alternate Names</dt>
                            <dd class="linguistic-value linguistic-alternates">
                                ${alternateNames.map(name => {
                                    if (typeof name === 'object') {
                                        return `<span class="alternate-name" title="${this.escapeHtml(name.context || name.language || '')}">${this.escapeHtml(name.name)}</span>`;
                                    }
                                    return `<span class="alternate-name">${this.escapeHtml(name)}</span>`;
                                }).join('')}
                            </dd>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Format etymology for display
     */
    formatEtymology(etymology) {
        if (typeof etymology === 'string') {
            return this.escapeHtml(etymology);
        }
        if (etymology.meaning) {
            let result = `<strong>Meaning:</strong> ${this.escapeHtml(etymology.meaning)}`;
            if (etymology.root) result += `<br><strong>Root:</strong> ${this.escapeHtml(etymology.root)}`;
            if (etymology.language) result += `<br><strong>Language:</strong> ${this.escapeHtml(etymology.language)}`;
            return result;
        }
        return '';
    }

    /**
     * Render geographical information
     */
    renderGeographicalInfo(geographical) {
        if (!geographical || Object.keys(geographical).length === 0) return '';

        const hasData = geographical.originPoint || geographical.primaryLocation ||
                       geographical.region || geographical.culturalArea ||
                       geographical.modernCountries?.length > 0;

        if (!hasData) return '';

        const location = geographical.originPoint || geographical.primaryLocation;
        const coords = location?.coordinates;

        return `
            <section class="entity-section entity-section-geographical" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127757;</span>
                    Geographical Information
                </h2>
                <div class="geographical-grid">
                    ${location ? `
                        <div class="location-card">
                            ${location.name ? `<h3 class="location-name">${this.escapeHtml(location.name)}</h3>` : ''}
                            ${location.description ? `<p class="location-description">${this.escapeHtml(location.description)}</p>` : ''}
                            ${location.type ? `<span class="location-type-badge">${this.escapeHtml(location.type)}</span>` : ''}
                            ${coords && (coords.latitude !== undefined || coords.lat !== undefined) ? `
                                <div class="coordinates-display">
                                    <span class="coord-icon" aria-hidden="true">&#128205;</span>
                                    <span class="coord-value">${this.formatCoordinates(coords)}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <div class="geo-details-grid">
                        ${geographical.region ? `
                            <div class="geo-item">
                                <dt class="geo-label">Region</dt>
                                <dd class="geo-value">${this.escapeHtml(geographical.region)}</dd>
                            </div>
                        ` : ''}
                        ${geographical.culturalArea ? `
                            <div class="geo-item">
                                <dt class="geo-label">Cultural Area</dt>
                                <dd class="geo-value">${this.escapeHtml(geographical.culturalArea)}</dd>
                            </div>
                        ` : ''}
                        ${geographical.modernCountries?.length > 0 ? `
                            <div class="geo-item">
                                <dt class="geo-label">Modern Countries</dt>
                                <dd class="geo-value">${geographical.modernCountries.map(c => this.escapeHtml(c)).join(', ')}</dd>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Format coordinates for display
     */
    formatCoordinates(coords) {
        const lat = coords.latitude ?? coords.lat;
        const lng = coords.longitude ?? coords.lng;
        if (lat === undefined || lng === undefined) return 'Unknown';

        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        return `${Math.abs(lat).toFixed(2)}${latDir}, ${Math.abs(lng).toFixed(2)}${lngDir}`;
    }

    /**
     * Render temporal information
     */
    renderTemporalInfo(temporal) {
        if (!temporal || Object.keys(temporal).length === 0) return '';

        const hasData = temporal.mythologicalDate || temporal.historicalDate ||
                       temporal.firstAttestation || temporal.peakPopularity ||
                       temporal.culturalPeriod;

        if (!hasData) return '';

        return `
            <section class="entity-section entity-section-temporal" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128197;</span>
                    Temporal Information
                </h2>
                <div class="temporal-grid">
                    ${temporal.mythologicalDate ? `
                        <div class="temporal-card">
                            <dt class="temporal-label">Mythological Date</dt>
                            <dd class="temporal-value">${this.formatDateObject(temporal.mythologicalDate)}</dd>
                        </div>
                    ` : ''}
                    ${temporal.historicalDate ? `
                        <div class="temporal-card">
                            <dt class="temporal-label">Historical Date</dt>
                            <dd class="temporal-value">${this.formatDateObject(temporal.historicalDate)}</dd>
                        </div>
                    ` : ''}
                    ${temporal.culturalPeriod ? `
                        <div class="temporal-card">
                            <dt class="temporal-label">Cultural Period</dt>
                            <dd class="temporal-value">${this.escapeHtml(temporal.culturalPeriod)}</dd>
                        </div>
                    ` : ''}
                    ${temporal.firstAttestation ? `
                        <div class="temporal-card temporal-card-wide">
                            <dt class="temporal-label">First Attestation</dt>
                            <dd class="temporal-value">
                                ${temporal.firstAttestation.date?.display ? `<span class="attestation-date">${this.escapeHtml(temporal.firstAttestation.date.display)}</span>` : ''}
                                ${temporal.firstAttestation.source ? ` - <span class="attestation-source">${this.escapeHtml(temporal.firstAttestation.source)}</span>` : ''}
                            </dd>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Format date object for display
     */
    formatDateObject(dateObj) {
        if (!dateObj) return '';
        if (dateObj.display) return this.escapeHtml(dateObj.display);
        if (dateObj.start?.display && dateObj.end?.display) {
            return `${this.escapeHtml(dateObj.start.display)} - ${this.escapeHtml(dateObj.end.display)}`;
        }
        if (dateObj.year) {
            const yearStr = dateObj.year < 0 ? `${Math.abs(dateObj.year)} BCE` : `${dateObj.year} CE`;
            return dateObj.circa ? `c. ${yearStr}` : yearStr;
        }
        return '';
    }

    /**
     * Render metaphysical properties
     */
    renderMetaphysicalProperties(metaphysical) {
        if (!metaphysical || Object.keys(metaphysical).length === 0) return '';

        const hasData = metaphysical.primaryElement || metaphysical.element ||
                       metaphysical.domains?.length > 0 || metaphysical.energyType ||
                       metaphysical.chakra || metaphysical.planet || metaphysical.zodiac?.length > 0;

        if (!hasData) return '';

        return `
            <section class="entity-section entity-section-metaphysical" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#10024;</span>
                    Metaphysical Properties
                </h2>
                <div class="metaphysical-grid">
                    ${metaphysical.primaryElement || metaphysical.element ? `
                        <div class="metaphysical-card element-${(metaphysical.primaryElement || metaphysical.element).toLowerCase()}">
                            <dt class="metaphysical-label">Element</dt>
                            <dd class="metaphysical-value">${this.capitalize(metaphysical.primaryElement || metaphysical.element)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.energyType ? `
                        <div class="metaphysical-card">
                            <dt class="metaphysical-label">Energy Type</dt>
                            <dd class="metaphysical-value">${this.capitalize(metaphysical.energyType)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.planet ? `
                        <div class="metaphysical-card">
                            <dt class="metaphysical-label">Planet</dt>
                            <dd class="metaphysical-value">${this.formatPlanet(metaphysical.planet)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.domains?.length > 0 ? `
                        <div class="metaphysical-card metaphysical-card-wide">
                            <dt class="metaphysical-label">Domains</dt>
                            <dd class="metaphysical-value metaphysical-tags">
                                ${metaphysical.domains.map(domain => `<span class="domain-tag">${this.escapeHtml(domain)}</span>`).join('')}
                            </dd>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Format planet name with symbol
     */
    formatPlanet(planet) {
        const planetSymbols = {
            'sun': '&#9737; Sun', 'moon': '&#9789; Moon', 'mercury': '&#9791; Mercury',
            'venus': '&#9792; Venus', 'mars': '&#9794; Mars', 'jupiter': '&#9795; Jupiter',
            'saturn': '&#9796; Saturn', 'uranus': '&#9797; Uranus', 'neptune': '&#9798; Neptune'
        };
        return planetSymbols[planet?.toLowerCase()] || this.capitalize(planet);
    }

    /**
     * Render extended content sections
     */
    renderExtendedContent(extendedContent) {
        if (!extendedContent || extendedContent.length === 0) return '';

        return extendedContent.map((section, index) => {
            if (!section.content) return '';

            const icon = this.getSectionIcon(section.title);

            return `
                <section class="entity-section entity-section-extended" ${this.getAnimationStyle()}>
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">${icon}</span>
                        ${this.escapeHtml(section.title || `Section ${index + 1}`)}
                    </h2>
                    <div class="entity-description prose extended-content">
                        ${this.renderMarkdown(section.content)}
                    </div>
                </section>
            `;
        }).join('');
    }

    /**
     * Get section icon based on title
     */
    getSectionIcon(title) {
        if (!title) return '&#128214;';
        const t = title.toLowerCase();
        if (t.includes('creation') || t.includes('origin')) return '&#10024;';
        if (t.includes('power') || t.includes('abilit')) return '&#9889;';
        if (t.includes('myth') || t.includes('legend')) return '&#128218;';
        if (t.includes('symbol') || t.includes('meaning')) return '&#128302;';
        if (t.includes('modern') || t.includes('culture')) return '&#127916;';
        if (t.includes('worship') || t.includes('ritual')) return '&#128722;';
        return '&#128214;';
    }

    /**
     * Render archetypes section
     */
    renderArchetypes(archetypes) {
        if (!archetypes || archetypes.length === 0) return '';

        return `
            <section class="entity-section entity-section-archetypes" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127917;</span>
                    Mythological Archetypes
                </h2>
                <div class="archetypes-grid">
                    ${archetypes.map(archetype => {
                        const archetypeName = typeof archetype === 'string' ? archetype : archetype.name;
                        const archetypeId = typeof archetype === 'string' ? archetype : archetype.id;
                        return `
                            <a href="#/archetypes/${this.escapeHtml(archetypeId)}" class="archetype-card" ${this.getAnimationStyle()}>
                                <span class="archetype-icon" aria-hidden="true">&#127917;</span>
                                <span class="archetype-name">${this.capitalize(archetypeName.replace(/-/g, ' '))}</span>
                            </a>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render schema related entities
     */
    renderSchemaRelatedEntities(relatedEntities, mythology) {
        if (!relatedEntities || Object.keys(relatedEntities).length === 0) return '';

        const categories = [
            { key: 'deities', singular: 'deity', label: 'Related Deities', icon: '&#9734;' },
            { key: 'heroes', singular: 'hero', label: 'Related Heroes', icon: '&#9876;' },
            { key: 'creatures', singular: 'creature', label: 'Related Creatures', icon: '&#128009;' },
            { key: 'places', singular: 'place', label: 'Related Places', icon: '&#127968;' },
            { key: 'items', singular: 'item', label: 'Related Items', icon: '&#9876;' }
        ];

        const hasAnyRelated = categories.some(cat => relatedEntities[cat.key]?.length > 0);
        if (!hasAnyRelated) return '';

        return `
            <section class="entity-section entity-section-schema-related" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128279;</span>
                    Connections
                </h2>
                <div class="schema-related-container">
                    ${categories.map(cat => {
                        const entities = relatedEntities[cat.key];
                        if (!entities || entities.length === 0) return '';

                        const visibleEntities = entities.slice(0, this.MAX_RELATED_VISIBLE);
                        const hasMore = entities.length > this.MAX_RELATED_VISIBLE;

                        return `
                            <div class="schema-related-group" ${this.getAnimationStyle()}>
                                <div class="related-group-header">
                                    <h3 class="related-group-title">${cat.icon} ${cat.label}</h3>
                                    ${hasMore ? `
                                        <span class="see-all-link">+${entities.length - this.MAX_RELATED_VISIBLE} more</span>
                                    ` : ''}
                                </div>
                                <div class="schema-related-grid">
                                    ${visibleEntities.map(entity => `
                                        <a href="#/mythology/${entity.mythology || mythology}/${cat.singular}/${entity.id}"
                                           class="schema-related-card"
                                           title="${this.escapeHtml(entity.relationship || '')}">
                                            <span class="related-entity-icon" aria-hidden="true">${this.renderIcon(entity.icon, cat.icon)}</span>
                                            <div class="related-entity-info">
                                                <span class="related-entity-name">${this.escapeHtml(entity.name)}</span>
                                                ${entity.relationship ? `<span class="related-entity-relationship">${this.escapeHtml(entity.relationship)}</span>` : ''}
                                            </div>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render cultural context
     */
    renderCulturalContext(context) {
        if (!context || Object.keys(context).length === 0) return '';

        const hasData = context.region || context.period || context.socialRole ||
                       context.worshipPractices?.length > 0 || context.festivals?.length > 0;

        if (!hasData) return '';

        return `
            <section class="entity-section entity-section-cultural" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127963;</span>
                    Cultural Context
                </h2>
                <div class="cultural-content-container">
                    ${context.socialRole ? `
                        <div class="cultural-highlight">
                            <h3 class="cultural-subsection-title">Social Role</h3>
                            <p class="cultural-social-role">${this.escapeHtml(context.socialRole)}</p>
                        </div>
                    ` : ''}
                    ${context.worshipPractices?.length > 0 ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#128722; Worship Practices</h3>
                            <ul class="worship-practices-list">
                                ${context.worshipPractices.map(practice => `
                                    <li class="worship-practice-item">${this.escapeHtml(practice)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${context.festivals?.length > 0 ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#127881; Festivals</h3>
                            <div class="festivals-grid">
                                ${context.festivals.map(f => {
                                    if (typeof f === 'string') {
                                        return `<div class="festival-card">${this.escapeHtml(f)}</div>`;
                                    }
                                    return `
                                        <div class="festival-card">
                                            <strong>${this.escapeHtml(f.name)}</strong>
                                            ${f.date ? `<span class="festival-date">${this.escapeHtml(f.date)}</span>` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Render sources
     */
    renderSources(sources) {
        if (!sources || sources.length === 0) return '';

        return `
            <section class="entity-section entity-section-sources" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128218;</span>
                    References & Sources
                </h2>
                <ol class="sources-list" role="list">
                    ${sources.map((source, index) => {
                        if (typeof source === 'string') {
                            return `
                                <li class="source-item" role="listitem">
                                    <span class="source-number">${index + 1}</span>
                                    <span class="source-text">${this.escapeHtml(source)}</span>
                                </li>
                            `;
                        }
                        const safeUrl = source.url ? this.sanitizeUrl(source.url) : null;
                        return `
                            <li class="source-item source-item-detailed" role="listitem">
                                <span class="source-number">${index + 1}</span>
                                <div class="source-content">
                                    ${source.title ? `<cite class="source-title">${this.escapeHtml(source.title)}</cite>` : ''}
                                    ${source.author ? `<span class="source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                                    ${safeUrl ? `<a href="${this.escapeAttr(safeUrl)}" target="_blank" rel="noopener noreferrer" class="source-link">View Source &#8599;</a>` : ''}
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ol>
            </section>
        `;
    }

    /**
     * Render generic section
     */
    renderSection(title, data) {
        if (!data || Object.keys(data).length === 0) return '';

        return `
            <section class="entity-section" ${this.getAnimationStyle()}>
                <h2 class="section-title">${title}</h2>
                <div class="entity-attributes-grid">
                    ${Object.entries(data).map(([key, value]) => `
                        <div class="entity-attribute">
                            <div class="attribute-label">${this.capitalize(key)}:</div>
                            <div class="attribute-value">${this.escapeHtml(value)}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render list section
     */
    renderListSection(title, items) {
        if (!items || items.length === 0) return '';

        return `
            <section class="entity-section" ${this.getAnimationStyle()}>
                <h2 class="section-title">${title}</h2>
                <ul class="entity-list">
                    ${items.map(item => `
                        <li class="entity-list-item">${this.escapeHtml(item)}</li>
                    `).join('')}
                </ul>
            </section>
        `;
    }

    /**
     * Render all metadata fields
     */
    renderAllMetadata(entity, entityType) {
        if (!entity) return '';

        const excludedFields = new Set([
            'id', 'name', 'title', 'displayName', 'slug',
            'description', 'shortDescription', 'fullDescription', 'longDescription',
            'icon', 'iconType', 'color', 'colors',
            'mythology', 'mythologies', 'type', 'entityType',
            'metadata', 'search', 'displayOptions', 'relatedEntities',
            'linguistic', 'geographical', 'temporal', 'cultural', 'culturalContext',
            'metaphysicalProperties', 'archetypes', 'corpusQueries', 'sources',
            'extendedContent', 'createdAt', 'updatedAt', 'version', 'categories',
            'epithets', 'symbolism', 'images'
        ]);

        let html = '';

        for (const [fieldName, value] of Object.entries(entity)) {
            if (excludedFields.has(fieldName) || fieldName.startsWith('_')) continue;
            if (value !== null && value !== undefined) {
                if (Array.isArray(value) && value.length === 0) continue;
                if (typeof value === 'object' && Object.keys(value).length === 0) continue;
                html += this.renderMetadataSection(fieldName, value);
            }
        }

        return html;
    }

    /**
     * Render a metadata section
     */
    renderMetadataSection(fieldName, value) {
        const label = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ');

        if (Array.isArray(value)) {
            return `
                <section class="entity-section entity-section-metadata" ${this.getAnimationStyle()}>
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">&#128196;</span>
                        ${this.escapeHtml(label)}
                    </h2>
                    <div class="metadata-tags-container">
                        ${value.map(item => {
                            const displayText = typeof item === 'object' ? (item.name || JSON.stringify(item)) : String(item);
                            return `<span class="metadata-tag">${this.escapeHtml(displayText)}</span>`;
                        }).join('')}
                    </div>
                </section>
            `;
        } else if (typeof value === 'object') {
            return '';
        } else {
            return `
                <section class="entity-section entity-section-metadata" ${this.getAnimationStyle()}>
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">&#128196;</span>
                        ${this.escapeHtml(label)}
                    </h2>
                    <div class="entity-description prose">
                        ${this.renderMarkdown(String(value))}
                    </div>
                </section>
            `;
        }
    }

    /**
     * Render not found
     */
    renderNotFound(entityId) {
        return `
            <div class="error-container">
                <div class="error-icon">&#128270;</div>
                <h2>Entity Not Found</h2>
                <p class="error-message">
                    The entity "${this.escapeHtml(entityId)}" could not be found.
                </p>
                <div class="error-actions">
                    <button class="btn-primary" onclick="window.history.back()">Go Back</button>
                    <a href="#/" class="btn-secondary">Browse Mythologies</a>
                </div>
            </div>
        `;
    }

    /**
     * Get primary fields for entity type
     */
    getPrimaryFields(entityType) {
        const fieldMap = {
            'deity': [
                { label: 'Domains', path: 'domains', icon: '&#127760;' },
                { label: 'Symbols', path: 'symbols', icon: '&#10024;' },
                { label: 'Element', path: 'element', icon: '&#128293;' },
                { label: 'Sacred Animals', path: 'sacredAnimals', icon: '&#128038;' },
                { label: 'Sacred Plants', path: 'sacredPlants', icon: '&#127793;' }
            ],
            'hero': [
                { label: 'Parentage', path: 'parentage', icon: '&#128106;' },
                { label: 'Birthplace', path: 'birthplace', icon: '&#127968;' },
                { label: 'Era', path: 'era', icon: '&#128197;' },
                { label: 'Weapons', path: 'weapons', icon: '&#9876;' }
            ],
            'creature': [
                { label: 'Classification', path: 'classification', icon: '&#128195;' },
                { label: 'Habitat', path: 'habitat', icon: '&#127966;' },
                { label: 'Abilities', path: 'abilities', icon: '&#9889;' },
                { label: 'Weaknesses', path: 'weaknesses', icon: '&#128683;' }
            ],
            'item': [
                { label: 'Item Type', path: 'itemType', icon: '&#128295;' },
                { label: 'Materials', path: 'materials', icon: '&#128302;' },
                { label: 'Wielders', path: 'wielders', icon: '&#9876;' },
                { label: 'Powers', path: 'powers', icon: '&#10024;' }
            ],
            'place': [
                { label: 'Place Type', path: 'placeType', icon: '&#127968;' },
                { label: 'Location', path: 'location', icon: '&#128205;' },
                { label: 'Inhabitants', path: 'inhabitants', icon: '&#128101;' }
            ]
        };

        return fieldMap[entityType] || [];
    }

    /**
     * Get entity type label
     */
    getEntityTypeLabel(entityType) {
        const labels = {
            'deity': 'Deity', 'hero': 'Hero', 'creature': 'Creature',
            'cosmology': 'Cosmology', 'ritual': 'Ritual', 'herb': 'Herb',
            'text': 'Text', 'symbol': 'Symbol', 'item': 'Item', 'place': 'Place'
        };
        return labels[entityType] || this.capitalize(entityType);
    }

    /**
     * Get Firebase collection name
     */
    getCollectionName(entityType) {
        const typeMap = {
            'deity': 'deities', 'hero': 'heroes', 'creature': 'creatures',
            'place': 'places', 'item': 'items', 'archetype': 'archetypes',
            'ritual': 'rituals', 'text': 'texts', 'symbol': 'symbols',
            'herb': 'herbs', 'cosmology': 'cosmology', 'mythology': 'mythologies'
        };

        const normalizedType = entityType.toLowerCase();
        if (typeMap[normalizedType]) return typeMap[normalizedType];

        if (normalizedType.endsWith('y')) return normalizedType.slice(0, -1) + 'ies';
        return normalizedType + 's';
    }

    /**
     * Normalize entity type for routing
     */
    normalizeEntityTypeForRoute(type) {
        if (!type) return 'entity';

        const normalized = type.toLowerCase();
        const typeMap = {
            'deities': 'deity', 'heroes': 'hero', 'creatures': 'creature',
            'places': 'place', 'items': 'item', 'texts': 'text',
            'rituals': 'ritual', 'symbols': 'symbol', 'herbs': 'herb',
            'archetypes': 'archetype', 'concepts': 'concept'
        };

        return typeMap[normalized] || normalized;
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIcon(type) {
        const icons = {
            deity: '&#9734;', hero: '&#9876;', creature: '&#128009;',
            place: '&#127968;', item: '&#9876;', concept: '&#128161;',
            ritual: '&#128722;', text: '&#128220;'
        };
        return icons[type] || '&#9679;';
    }

    /**
     * Truncate text
     */
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return this.escapeHtml(text || '');
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
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

    /**
     * Render icon safely - handles inline SVG, URLs, emoji, and HTML entities
     */
    renderIcon(icon, fallback = '&#9679;') {
        if (!icon) return fallback;

        if (typeof icon !== 'string') {
            return fallback;
        }

        const iconTrimmed = icon.trim();

        // Handle inline SVG
        if (iconTrimmed.toLowerCase().startsWith('<svg')) {
            return `<span class="entity-icon-svg" aria-hidden="true">${icon}</span>`;
        }

        // Handle URL-based icons (images)
        if (iconTrimmed.startsWith('http://') || iconTrimmed.startsWith('https://') ||
            iconTrimmed.startsWith('data:image/') || iconTrimmed.startsWith('/')) {
            return `<img src="${this.escapeAttr(iconTrimmed)}" alt="" class="entity-icon-img" loading="lazy" aria-hidden="true" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" /><span class="entity-icon-fallback" style="display:none">${fallback}</span>`;
        }

        // Handle HTML entities (&#...; or &..;)
        if (iconTrimmed.startsWith('&#') || (iconTrimmed.startsWith('&') && iconTrimmed.endsWith(';'))) {
            return iconTrimmed;
        }

        // Handle emoji (check if it's a single grapheme cluster / emoji)
        const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}][\u{FE00}-\u{FE0F}]?(?:\u{200D}[\p{Emoji_Presentation}\p{Extended_Pictographic}][\u{FE00}-\u{FE0F}]?)*$/u;
        if (emojiRegex.test(iconTrimmed)) {
            return `<span class="entity-icon-emoji" aria-hidden="true">${iconTrimmed}</span>`;
        }

        // Handle icon class names (e.g., "fas fa-star", "material-icons")
        if (iconTrimmed.includes('fa-') || iconTrimmed.includes('icon-') || iconTrimmed.includes('material')) {
            return `<i class="${this.escapeAttr(iconTrimmed)}" aria-hidden="true"></i>`;
        }

        // Handle simple text icons (single character or short string)
        if (iconTrimmed.length <= 4) {
            return `<span class="entity-icon-text" aria-hidden="true">${this.escapeHtml(iconTrimmed)}</span>`;
        }

        // Default: escape and return
        return this.escapeHtml(icon);
    }

    /**
     * Escape attribute value
     */
    escapeAttr(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Sanitize URL
     */
    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return null;

        const trimmedUrl = url.trim().toLowerCase();
        const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];

        for (const scheme of dangerousSchemes) {
            if (trimmedUrl.startsWith(scheme)) return null;
        }

        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') ||
            trimmedUrl.startsWith('#') || trimmedUrl.startsWith('/')) {
            return url;
        }

        if (trimmedUrl.indexOf(':') < trimmedUrl.indexOf('/') && trimmedUrl.indexOf(':') !== -1) {
            return null;
        }

        return url;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        // Main action button handler
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;

            switch (action) {
                case 'share':
                    EntityDetailViewer.shareEntity(btn.dataset.entityName, btn.dataset.entityId);
                    break;
                case 'bookmark':
                    this.handleBookmarkAction(btn);
                    break;
                case 'scroll-to':
                    EntityDetailViewer.scrollToSection(btn.dataset.section);
                    break;
                case 'add-note':
                case 'add-perspective':
                case 'add-connection':
                    this.handleContributeAction(action, btn.dataset.entityId);
                    break;
            }
        });

        // Tab navigation
        this.initializeTabNavigation(container);

        // Community tab switching
        this.initializeCommunityTabs(container);

        // Gallery interactions
        this.initializeGallery(container);

        // Lightbox interactions
        this.initializeLightbox(container);

        // TOC scroll tracking
        this.initializeTocTracking(container);

        // Smooth scroll for anchor links
        this.initializeSmoothScroll(container);

        // Initialize discussion component if Discussion tab is initially active
        const activeTab = container.querySelector('.community-tab.active');
        if (activeTab && activeTab.dataset.communityTab === 'discussion') {
            this.initializeDiscussion(container);
        }
    }

    /**
     * Handle bookmark action with visual feedback
     */
    handleBookmarkAction(btn) {
        const entityId = btn.dataset.entityId;
        EntityDetailViewer.bookmarkEntity(entityId);

        // Update all bookmark buttons on the page
        const isBookmarked = EntityDetailViewer.isBookmarked(entityId);
        const bookmarkBtns = document.querySelectorAll(`[data-action="bookmark"][data-entity-id="${entityId}"]`);

        bookmarkBtns.forEach(bookmarkBtn => {
            bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
            bookmarkBtn.classList.toggle('active', isBookmarked);
            const icon = bookmarkBtn.querySelector('.action-icon');
            const text = bookmarkBtn.querySelector('.action-text');
            if (icon) {
                icon.innerHTML = isBookmarked ? '&#9829;' : '&#9825;';
            }
            if (text) {
                text.textContent = isBookmarked ? 'Favorited' : 'Favorite';
            }
        });
    }

    /**
     * Initialize main tab navigation
     */
    initializeTabNavigation(container) {
        const tabBtns = container.querySelectorAll('.entity-tab-btn');
        const tabPanels = container.querySelectorAll('.entity-tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;

                // Update tab buttons
                tabBtns.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                // Update tab panels with animation
                tabPanels.forEach(panel => {
                    if (panel.classList.contains('active')) {
                        panel.classList.add('exiting');
                        setTimeout(() => {
                            panel.classList.remove('active', 'exiting');
                        }, 200);
                    }
                });

                setTimeout(() => {
                    const activePanel = container.querySelector(`#panel-${tabId}`);
                    if (activePanel) {
                        activePanel.classList.add('active');
                    }
                }, 200);
            });
        });
    }

    /**
     * Initialize community tabs
     */
    initializeCommunityTabs(container) {
        const communityTabs = container.querySelectorAll('.community-tab');
        const communityPanels = container.querySelectorAll('.community-panel');

        communityTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.communityTab;

                communityTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                communityPanels.forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                const panel = container.querySelector(`[data-panel="${tabId}"]`);
                if (panel) panel.classList.add('active');

                // Initialize discussion component when Discussion tab is clicked
                if (tabId === 'discussion') {
                    this.initializeDiscussion(container);
                }
            });
        });
    }

    /**
     * Initialize gallery interactions
     */
    initializeGallery(container) {
        const galleryContainer = container.querySelector('.gallery-container');
        if (!galleryContainer) return;

        // Carousel navigation
        const prevBtn = galleryContainer.querySelector('.gallery-prev');
        const nextBtn = galleryContainer.querySelector('.gallery-next');
        const slides = galleryContainer.querySelectorAll('.gallery-slide');
        const indicators = galleryContainer.querySelectorAll('.gallery-indicator');
        const thumbnails = galleryContainer.querySelectorAll('.gallery-thumbnail');
        const counter = galleryContainer.querySelector('.gallery-counter');
        const caption = galleryContainer.querySelector('.gallery-caption');

        let currentIndex = 0;

        const updateGallery = (index) => {
            currentIndex = index;

            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });

            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
                indicator.setAttribute('aria-selected', i === index);
            });

            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
                thumb.setAttribute('aria-selected', i === index);
            });

            if (counter) {
                counter.textContent = `${index + 1} / ${slides.length}`;
            }

            if (caption && slides[index]) {
                const img = slides[index].querySelector('img');
                const captionText = img?.dataset.caption || '';
                caption.textContent = captionText;
                caption.style.display = captionText ? 'block' : 'none';
            }
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
                updateGallery(newIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
                updateGallery(newIndex);
            });
        }

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => updateGallery(index));
        });

        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => updateGallery(index));
        });

        // Grid items click to open lightbox
        const gridItems = galleryContainer.querySelectorAll('.gallery-grid-item');
        gridItems.forEach(item => {
            item.addEventListener('click', () => {
                this.openLightbox(item.dataset.src, item.dataset.caption);
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openLightbox(item.dataset.src, item.dataset.caption);
                }
            });
        });

        // Gallery images click to open lightbox
        const galleryImages = galleryContainer.querySelectorAll('.gallery-image');
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                this.openLightbox(img.dataset.src || img.src, img.dataset.caption || img.alt);
            });

            img.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openLightbox(img.dataset.src || img.src, img.dataset.caption || img.alt);
                }
            });
        });
    }

    /**
     * Initialize lightbox functionality
     */
    initializeLightbox(container) {
        // Create lightbox element if it doesn't exist
        if (!document.querySelector('.entity-lightbox')) {
            const lightboxHTML = `
                <div class="entity-lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
                    <div class="lightbox-overlay">
                        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
                        <div class="lightbox-content">
                            <img src="" alt="" />
                            <p class="lightbox-caption"></p>
                        </div>
                        <div class="lightbox-keyboard-hint">
                            <kbd>Esc</kbd> to close
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        }

        const lightbox = document.querySelector('.entity-lightbox');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const overlay = lightbox.querySelector('.lightbox-overlay');

        // Close button handler
        closeBtn?.addEventListener('click', () => this.closeLightbox());

        // Click outside to close
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('lightbox-overlay')) {
                this.closeLightbox();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) {
                this.closeLightbox();
            }
        });
    }

    /**
     * Open lightbox with image
     */
    openLightbox(src, caption = '') {
        const lightbox = document.querySelector('.entity-lightbox');
        if (!lightbox) return;

        const img = lightbox.querySelector('.lightbox-content img');
        const captionEl = lightbox.querySelector('.lightbox-caption');

        if (img) img.src = src;
        if (captionEl) {
            captionEl.textContent = caption;
            captionEl.style.display = caption ? 'block' : 'none';
        }

        lightbox.classList.add('open');
        document.body.classList.add('lightbox-open');

        // Focus trap
        lightbox.querySelector('.lightbox-close')?.focus();
    }

    /**
     * Close lightbox
     */
    closeLightbox() {
        const lightbox = document.querySelector('.entity-lightbox');
        if (!lightbox) return;

        lightbox.classList.add('closing');
        setTimeout(() => {
            lightbox.classList.remove('open', 'closing');
            document.body.classList.remove('lightbox-open');
        }, 300);
    }

    /**
     * Initialize TOC scroll tracking
     */
    initializeTocTracking(container) {
        const tocItems = container.querySelectorAll('.toc-item');
        const progressBar = container.querySelector('.toc-progress-bar');
        const sections = container.querySelectorAll('.entity-section[id]');

        if (tocItems.length === 0 || sections.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    tocItems.forEach(item => {
                        item.classList.toggle('active', item.dataset.section === sectionId);
                    });
                }
            });
        }, { rootMargin: '-100px 0px -80% 0px' });

        sections.forEach(section => observer.observe(section));

        // Update progress bar on scroll
        if (progressBar) {
            window.addEventListener('scroll', () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollProgress = (window.scrollY / scrollHeight) * 100;
                progressBar.style.width = `${Math.min(100, scrollProgress)}%`;
            });
        }
    }

    /**
     * Initialize smooth scroll for anchor links
     */
    initializeSmoothScroll(container) {
        container.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without triggering navigation
                    history.pushState(null, '', `#${targetId}`);
                }
            });
        });
    }

    /**
     * Initialize the AssetDiscussion component for Reddit-style discussions
     */
    initializeDiscussion(container) {
        const discussionContainer = container.querySelector('.asset-discussion-container');
        if (!discussionContainer) return;

        // Check if already initialized
        if (discussionContainer.dataset.initialized === 'true') return;

        // Check if AssetDiscussion is available
        if (!window.AssetDiscussion) {
            console.warn('[EntityDetailViewer] AssetDiscussion component not loaded');
            discussionContainer.innerHTML = `
                <div class="discussion-load-error">
                    <p>Discussion system is currently unavailable.</p>
                </div>
            `;
            return;
        }

        try {
            // Initialize the discussion component
            const discussion = new window.AssetDiscussion(discussionContainer, {
                assetId: discussionContainer.dataset.assetId,
                assetType: discussionContainer.dataset.assetType,
                assetName: discussionContainer.dataset.assetName,
                mythology: discussionContainer.dataset.mythology,
                enableRealTime: true,
                enableCorpusCitations: true,
                showSubmitForm: true
            });

            // Store reference for cleanup
            discussionContainer._discussionComponent = discussion;
            discussionContainer.dataset.initialized = 'true';

            console.log('[EntityDetailViewer] Discussion initialized for:', discussionContainer.dataset.assetId);
        } catch (error) {
            console.error('[EntityDetailViewer] Failed to initialize discussion:', error);
            discussionContainer.innerHTML = `
                <div class="discussion-load-error">
                    <p>Failed to load discussion. Please refresh the page.</p>
                </div>
            `;
        }
    }

    /**
     * Handle contribute action
     */
    handleContributeAction(action, entityId) {
        // Dispatch event for ContributeMenu component
        window.dispatchEvent(new CustomEvent('entity:contribute', {
            detail: { action, entityId }
        }));
    }
}

// Export
window.EntityDetailViewer = EntityDetailViewer;
