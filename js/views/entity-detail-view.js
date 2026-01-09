/**
 * Entity Detail View
 * Full-page view for displaying comprehensive entity information
 *
 * Integrates:
 * - AssetDetailPanel (main renderer)
 * - MetadataGeographic (geographic information)
 * - MetadataChronological (temporal/historical data)
 * - MetadataRelationships (family trees, connections)
 * - EntityDetailViewer (legacy compatibility)
 *
 * Features:
 * - Full asset information with no truncation
 * - Collapsible sections for all metadata categories
 * - Timeline visualization for chronological data
 * - Map placeholders for geographic data
 * - Relationship graph visualization
 * - Image gallery with lightbox
 * - Source citations and references
 * - Print-friendly layout
 * - Responsive mobile design
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class EntityDetailView {
        constructor(options = {}) {
            // Firebase references
            this.db = options.db || (window.firebase && window.firebase.firestore());
            this.router = options.router;

            // Component instances
            this.assetDetailPanel = null;
            this.geoRenderer = null;
            this.chronoRenderer = null;
            this.relationRenderer = null;

            // Configuration
            this.useNewComponents = options.useNewComponents !== false;
            this.useLegacyViewer = options.useLegacyViewer || false;
            this.showEditButton = options.showEditButton || false;
            this.enablePrintStyles = options.enablePrintStyles !== false;

            // Cache
            this.entityCache = new Map();
            this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes

            // State
            this.currentEntity = null;
            this.currentRoute = null;
            this.isLoading = false;

            // Initialize components
            this.initializeComponents();
        }

        /**
         * Initialize sub-components
         */
        initializeComponents() {
            // Initialize geographic metadata renderer
            if (window.MetadataGeographic) {
                this.geoRenderer = new window.MetadataGeographic({
                    showInteractiveMap: true,
                    mapProvider: 'leaflet'
                });
            }

            // Initialize chronological metadata renderer
            if (window.MetadataChronological) {
                this.chronoRenderer = new window.MetadataChronological({
                    showTimeline: true,
                    timelineProvider: 'native'
                });
            }

            // Initialize relationship metadata renderer
            if (window.MetadataRelationships) {
                this.relationRenderer = new window.MetadataRelationships({
                    showFamilyTree: true,
                    showRelationshipGraph: true
                });
            }

            // Initialize main asset detail panel
            if (window.AssetDetailPanel) {
                this.assetDetailPanel = new window.AssetDetailPanel({
                    baseUrl: '',
                    showEditButton: this.showEditButton,
                    geoRenderer: this.geoRenderer,
                    chronoRenderer: this.chronoRenderer,
                    relationRenderer: this.relationRenderer
                });
            }
        }

        /**
         * Main render method - called by router
         * @param {Object} route - Route information { mythology, entityType, entityId }
         * @returns {string} Initial HTML (loading state)
         */
        async render(route) {
            this.currentRoute = route;
            const { mythology, entityType, entityId } = route;

            // Show loading state immediately
            const loadingHtml = this.renderLoadingState(mythology, entityType, entityId);

            // Schedule async data loading
            setTimeout(() => {
                this.loadAndRenderEntity(mythology, entityType, entityId);
            }, 0);

            return loadingHtml;
        }

        /**
         * Load entity and render full content
         */
        async loadAndRenderEntity(mythology, entityType, entityId) {
            if (this.isLoading) return;
            this.isLoading = true;

            try {
                // Load entity from Firebase
                const entity = await this.loadEntity(mythology, entityType, entityId);

                if (!entity) {
                    this.renderNotFound(entityId, entityType);
                    return;
                }

                this.currentEntity = entity;

                // Render the full detail view
                const html = this.renderEntityDetail(entity, mythology, entityType);

                // Update DOM
                const container = document.querySelector('.entity-detail-view');
                if (container) {
                    container.outerHTML = html;
                }

                // Initialize interactive components
                requestAnimationFrame(() => {
                    this.attachEventListeners();
                    this.initializeInteractiveFeatures();
                    this.loadAdditionalData(entity, mythology, entityType);
                });

            } catch (error) {
                console.error('[EntityDetailView] Error loading entity:', error);
                this.renderError(error.message);
            } finally {
                this.isLoading = false;
            }
        }

        /**
         * Load entity from Firebase with caching
         */
        async loadEntity(mythology, entityType, entityId) {
            const cacheKey = `${mythology}:${entityType}:${entityId}`;

            // Check cache
            const cached = this.entityCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return cached.data;
            }

            if (!this.db) {
                throw new Error('Firebase Firestore not initialized');
            }

            const collection = this.getCollectionName(entityType);
            const doc = await this.db.collection(collection).doc(entityId).get();

            if (!doc.exists) return null;

            const entity = {
                id: doc.id,
                ...doc.data(),
                mythology: mythology,
                entityType: entityType
            };

            // Cache the entity
            this.entityCache.set(cacheKey, { data: entity, timestamp: Date.now() });

            return entity;
        }

        /**
         * Get Firebase collection name from entity type
         */
        getCollectionName(entityType) {
            const collectionMap = {
                'deity': 'deities',
                'deities': 'deities',
                'god': 'deities',
                'gods': 'deities',
                'creature': 'creatures',
                'creatures': 'creatures',
                'hero': 'heroes',
                'heroes': 'heroes',
                'item': 'items',
                'items': 'items',
                'artifact': 'items',
                'place': 'places',
                'places': 'places',
                'location': 'places',
                'text': 'texts',
                'texts': 'texts',
                'ritual': 'rituals',
                'rituals': 'rituals',
                'herb': 'herbs',
                'herbs': 'herbs',
                'archetype': 'archetypes',
                'archetypes': 'archetypes',
                'symbol': 'symbols',
                'symbols': 'symbols',
                'mythology': 'mythologies',
                'mythologies': 'mythologies'
            };

            return collectionMap[entityType.toLowerCase()] || entityType;
        }

        /**
         * Render loading state
         */
        renderLoadingState(mythology, entityType, entityId) {
            return `
                <article class="entity-detail-view entity-detail-view--loading"
                         data-entity-id="${this.escapeAttr(entityId)}"
                         data-entity-type="${this.escapeAttr(entityType)}"
                         data-mythology="${this.escapeAttr(mythology)}">

                    <!-- Breadcrumb Skeleton -->
                    <nav class="edv-breadcrumb edv-skeleton" aria-label="Loading navigation">
                        <div class="edv-skeleton-line edv-skeleton--short"></div>
                        <span class="edv-skeleton-sep"></span>
                        <div class="edv-skeleton-line edv-skeleton--short"></div>
                        <span class="edv-skeleton-sep"></span>
                        <div class="edv-skeleton-line edv-skeleton--medium"></div>
                    </nav>

                    <!-- Hero Skeleton -->
                    <header class="edv-hero edv-skeleton">
                        <div class="edv-hero__background"></div>
                        <div class="edv-hero__content">
                            <div class="edv-hero__icon edv-skeleton-pulse"></div>
                            <div class="edv-hero__text">
                                <div class="edv-skeleton-title edv-skeleton-pulse"></div>
                                <div class="edv-skeleton-badges">
                                    <span class="edv-skeleton-badge edv-skeleton-pulse"></span>
                                    <span class="edv-skeleton-badge edv-skeleton-pulse"></span>
                                </div>
                                <div class="edv-skeleton-line edv-skeleton--full edv-skeleton-pulse"></div>
                                <div class="edv-skeleton-line edv-skeleton--medium edv-skeleton-pulse"></div>
                            </div>
                        </div>
                    </header>

                    <!-- Content Skeleton -->
                    <div class="edv-layout">
                        <main class="edv-main">
                            <!-- Section Skeletons -->
                            <section class="edv-section edv-skeleton">
                                <div class="edv-skeleton-section-title edv-skeleton-pulse"></div>
                                <div class="edv-skeleton-content">
                                    <div class="edv-skeleton-line edv-skeleton--full edv-skeleton-pulse"></div>
                                    <div class="edv-skeleton-line edv-skeleton--full edv-skeleton-pulse"></div>
                                    <div class="edv-skeleton-line edv-skeleton--medium edv-skeleton-pulse"></div>
                                </div>
                            </section>

                            <section class="edv-section edv-skeleton">
                                <div class="edv-skeleton-section-title edv-skeleton-pulse"></div>
                                <div class="edv-skeleton-grid">
                                    <div class="edv-skeleton-card edv-skeleton-pulse"></div>
                                    <div class="edv-skeleton-card edv-skeleton-pulse"></div>
                                    <div class="edv-skeleton-card edv-skeleton-pulse"></div>
                                </div>
                            </section>

                            <section class="edv-section edv-skeleton">
                                <div class="edv-skeleton-section-title edv-skeleton-pulse"></div>
                                <div class="edv-skeleton-content">
                                    <div class="edv-skeleton-line edv-skeleton--full edv-skeleton-pulse"></div>
                                    <div class="edv-skeleton-line edv-skeleton--full edv-skeleton-pulse"></div>
                                </div>
                            </section>
                        </main>

                        <aside class="edv-sidebar edv-skeleton">
                            <div class="edv-skeleton-sidebar-card edv-skeleton-pulse"></div>
                            <div class="edv-skeleton-sidebar-card edv-skeleton-pulse"></div>
                        </aside>
                    </div>

                    <!-- Loading Overlay -->
                    <div class="edv-loading-overlay" role="status" aria-live="polite">
                        <div class="edv-spinner">
                            <div class="edv-spinner__ring"></div>
                            <div class="edv-spinner__ring"></div>
                            <div class="edv-spinner__ring"></div>
                        </div>
                        <p class="edv-loading-text">Loading entity details...</p>
                    </div>
                </article>
            `;
        }

        /**
         * Render full entity detail
         */
        renderEntityDetail(entity, mythology, entityType) {
            // Use AssetDetailPanel if available
            if (this.assetDetailPanel && this.useNewComponents) {
                return this.renderWithAssetDetailPanel(entity, mythology, entityType);
            }

            // Fallback to legacy EntityDetailViewer
            if (window.EntityDetailViewer && this.useLegacyViewer) {
                const legacyViewer = new window.EntityDetailViewer({
                    db: this.db,
                    router: this.router
                });
                return legacyViewer.generateHTML(entity, {}, mythology, entityType);
            }

            // Ultimate fallback: inline rendering
            return this.renderInlineDetail(entity, mythology, entityType);
        }

        /**
         * Render using the new AssetDetailPanel component
         */
        renderWithAssetDetailPanel(entity, mythology, entityType) {
            const colors = entity.colors || {};
            const primaryColor = colors.primary || this.getTypeColor(entityType);
            const secondaryColor = colors.secondary || this.darkenColor(primaryColor, 20);

            return `
                <article class="entity-detail-view"
                         data-entity-id="${this.escapeAttr(entity.id)}"
                         data-entity-type="${this.escapeAttr(entityType)}"
                         data-mythology="${this.escapeAttr(mythology)}"
                         style="--entity-primary: ${primaryColor}; --entity-secondary: ${secondaryColor};">

                    <!-- Breadcrumb Navigation -->
                    ${this.renderBreadcrumb(mythology, entityType, entity.name || entity.title)}

                    <!-- Main Asset Detail Panel -->
                    ${this.assetDetailPanel.render(entity, entityType, mythology)}

                    <!-- Print Footer -->
                    ${this.enablePrintStyles ? this.renderPrintFooter(entity) : ''}
                </article>
            `;
        }

        /**
         * Render inline detail (fallback)
         */
        renderInlineDetail(entity, mythology, entityType) {
            const colors = entity.colors || {};
            const primaryColor = colors.primary || this.getTypeColor(entityType);

            return `
                <article class="entity-detail-view entity-detail-view--fallback"
                         data-entity-id="${this.escapeAttr(entity.id)}"
                         data-entity-type="${this.escapeAttr(entityType)}"
                         data-mythology="${this.escapeAttr(mythology)}"
                         style="--entity-primary: ${primaryColor};">

                    <!-- Breadcrumb -->
                    ${this.renderBreadcrumb(mythology, entityType, entity.name || entity.title)}

                    <!-- Header -->
                    <header class="edv-fallback-hero">
                        ${entity.icon ? `<div class="edv-fallback-icon">${this.renderIcon(entity.icon)}</div>` : ''}
                        <div class="edv-fallback-header-text">
                            <h1 class="edv-fallback-title">${this.escapeHtml(entity.name || entity.title)}</h1>
                            <div class="edv-fallback-badges">
                                <span class="edv-badge edv-badge--type">${this.getEntityTypeLabel(entityType)}</span>
                                <span class="edv-badge edv-badge--mythology">${this.capitalize(mythology)}</span>
                            </div>
                        </div>
                    </header>

                    <!-- Main Content -->
                    <div class="edv-fallback-content">
                        <!-- Description -->
                        ${entity.description ? `
                            <section class="edv-fallback-section">
                                <h2>Description</h2>
                                <div class="edv-prose">${this.renderMarkdown(entity.description)}</div>
                            </section>
                        ` : ''}

                        <!-- Attributes Grid -->
                        ${this.renderFallbackAttributes(entity, entityType)}

                        <!-- Geographic Information -->
                        ${entity.geographical && this.geoRenderer ? `
                            <section class="edv-fallback-section">
                                <h2>Geographic Information</h2>
                                ${this.geoRenderer.render(entity.geographical)}
                            </section>
                        ` : ''}

                        <!-- Chronological Information -->
                        ${entity.temporal && this.chronoRenderer ? `
                            <section class="edv-fallback-section">
                                <h2>Historical Timeline</h2>
                                ${this.chronoRenderer.render(entity.temporal)}
                            </section>
                        ` : ''}

                        <!-- Relationships -->
                        ${this.relationRenderer ? `
                            <section class="edv-fallback-section">
                                <h2>Relationships</h2>
                                ${this.relationRenderer.render(entity)}
                            </section>
                        ` : ''}

                        <!-- Sources -->
                        ${entity.sources && entity.sources.length > 0 ? `
                            <section class="edv-fallback-section">
                                <h2>Sources & References</h2>
                                <ul class="edv-fallback-sources">
                                    ${entity.sources.map(source => `
                                        <li>${this.escapeHtml(typeof source === 'string' ? source : source.title || source.name)}</li>
                                    `).join('')}
                                </ul>
                            </section>
                        ` : ''}
                    </div>
                </article>
            `;
        }

        /**
         * Render fallback attributes grid
         */
        renderFallbackAttributes(entity, entityType) {
            const attributes = [];

            // Common attributes
            if (entity.domains?.length) attributes.push({ label: 'Domains', value: entity.domains.join(', ') });
            if (entity.powers?.length) attributes.push({ label: 'Powers', value: entity.powers.join(', ') });
            if (entity.symbols?.length) attributes.push({ label: 'Symbols', value: entity.symbols.join(', ') });
            if (entity.epithets?.length) attributes.push({ label: 'Epithets', value: entity.epithets.join(', ') });

            // Type-specific
            if (entityType === 'creatures' && entity.habitat) attributes.push({ label: 'Habitat', value: entity.habitat });
            if (entityType === 'heroes' && entity.weapon) attributes.push({ label: 'Weapon', value: entity.weapon });
            if (entityType === 'items' && entity.material) attributes.push({ label: 'Material', value: entity.material });
            if (entityType === 'places' && entity.locationType) attributes.push({ label: 'Type', value: entity.locationType });

            if (attributes.length === 0) return '';

            return `
                <section class="edv-fallback-section">
                    <h2>Attributes</h2>
                    <div class="edv-fallback-grid">
                        ${attributes.map(attr => `
                            <div class="edv-fallback-attr">
                                <span class="edv-fallback-attr-label">${attr.label}</span>
                                <span class="edv-fallback-attr-value">${this.escapeHtml(attr.value)}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        /**
         * Render breadcrumb navigation
         */
        renderBreadcrumb(mythology, entityType, entityName) {
            return `
                <nav class="edv-breadcrumb" aria-label="Breadcrumb navigation">
                    <ol class="edv-breadcrumb__list">
                        <li class="edv-breadcrumb__item">
                            <a href="#/" class="edv-breadcrumb__link">Home</a>
                        </li>
                        <li class="edv-breadcrumb__item">
                            <a href="#/browse/${entityType}" class="edv-breadcrumb__link">${this.getEntityTypeLabel(entityType)}</a>
                        </li>
                        <li class="edv-breadcrumb__item">
                            <a href="#/mythologies/${mythology}" class="edv-breadcrumb__link">${this.capitalize(mythology)}</a>
                        </li>
                        <li class="edv-breadcrumb__item edv-breadcrumb__item--current" aria-current="page">
                            <span>${this.escapeHtml(entityName)}</span>
                        </li>
                    </ol>
                </nav>
            `;
        }

        /**
         * Render print footer
         */
        renderPrintFooter(entity) {
            const printDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            return `
                <footer class="edv-print-footer">
                    <div class="edv-print-footer__content">
                        <p class="edv-print-footer__title">Eyes of Azrael - Mythology Encyclopedia</p>
                        <p class="edv-print-footer__entity">${this.escapeHtml(entity.name || entity.title)}</p>
                        <p class="edv-print-footer__date">Printed on ${printDate}</p>
                        <p class="edv-print-footer__url">${window.location.href}</p>
                    </div>
                </footer>
            `;
        }

        /**
         * Render not found state
         */
        renderNotFound(entityId, entityType) {
            const container = document.querySelector('.entity-detail-view');
            if (!container) return;

            container.innerHTML = `
                <div class="edv-not-found">
                    <div class="edv-not-found__icon" aria-hidden="true">&#128533;</div>
                    <h2 class="edv-not-found__title">Entity Not Found</h2>
                    <p class="edv-not-found__message">
                        The ${this.getEntityTypeLabel(entityType).toLowerCase()} "${this.escapeHtml(entityId)}" could not be found.
                    </p>
                    <div class="edv-not-found__actions">
                        <button class="edv-btn edv-btn--primary" onclick="window.history.back()">
                            Go Back
                        </button>
                        <a href="#/browse/${entityType}" class="edv-btn edv-btn--secondary">
                            Browse ${this.getEntityTypeLabel(entityType)}
                        </a>
                    </div>
                </div>
            `;
        }

        /**
         * Render error state
         */
        renderError(message) {
            const container = document.querySelector('.entity-detail-view');
            if (!container) return;

            container.innerHTML = `
                <div class="edv-error">
                    <div class="edv-error__icon" aria-hidden="true">&#9888;</div>
                    <h2 class="edv-error__title">Error Loading Entity</h2>
                    <p class="edv-error__message">${this.escapeHtml(message || 'An unexpected error occurred.')}</p>
                    <div class="edv-error__actions">
                        <button class="edv-btn edv-btn--primary" onclick="window.location.reload()">
                            Retry
                        </button>
                        <button class="edv-btn edv-btn--secondary" onclick="window.history.back()">
                            Go Back
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            const container = document.querySelector('.entity-detail-view');
            if (!container) return;

            // Delegate event handling
            container.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;

                const action = target.dataset.action;
                this.handleAction(action, target, e);
            });

            // Collapsible sections
            container.querySelectorAll('.edv-section-header--collapsible').forEach(header => {
                header.addEventListener('click', () => this.toggleSection(header));
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleSection(header);
                    }
                });
            });

            // Print button
            container.querySelector('[data-action="print"]')?.addEventListener('click', () => {
                window.print();
            });
        }

        /**
         * Handle action buttons
         */
        handleAction(action, target, event) {
            switch (action) {
                case 'share':
                    this.handleShare(target);
                    break;
                case 'bookmark':
                    this.handleBookmark(target);
                    break;
                case 'edit':
                    this.handleEdit(target);
                    break;
                case 'expand-section':
                    this.toggleSection(target.closest('.edv-section'));
                    break;
                case 'scroll-to':
                    this.scrollToSection(target.dataset.section);
                    break;
                case 'print':
                    window.print();
                    break;
                default:
                    console.log('[EntityDetailView] Unknown action:', action);
            }
        }

        /**
         * Toggle section collapse
         */
        toggleSection(header) {
            const section = header.closest('.edv-section') || header.parentElement;
            const isCollapsed = section.classList.toggle('edv-section--collapsed');
            header.setAttribute('aria-expanded', !isCollapsed);

            // Save state
            const sectionId = section.id || section.dataset.section;
            if (sectionId) {
                this.saveSectionState(sectionId, isCollapsed);
            }
        }

        /**
         * Save section collapse state
         */
        saveSectionState(sectionId, isCollapsed) {
            try {
                const state = JSON.parse(sessionStorage.getItem('edv_collapsed_sections') || '{}');
                state[sectionId] = isCollapsed;
                sessionStorage.setItem('edv_collapsed_sections', JSON.stringify(state));
            } catch (e) {
                // Ignore storage errors
            }
        }

        /**
         * Restore section collapse states
         */
        restoreSectionStates() {
            try {
                const state = JSON.parse(sessionStorage.getItem('edv_collapsed_sections') || '{}');
                Object.entries(state).forEach(([sectionId, isCollapsed]) => {
                    if (isCollapsed) {
                        const section = document.querySelector(`#${sectionId}, [data-section="${sectionId}"]`);
                        if (section) {
                            section.classList.add('edv-section--collapsed');
                            const header = section.querySelector('.edv-section-header--collapsible');
                            if (header) header.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
            } catch (e) {
                // Ignore storage errors
            }
        }

        /**
         * Scroll to section
         */
        scrollToSection(sectionId) {
            const section = document.getElementById(sectionId) ||
                           document.querySelector(`[data-section="${sectionId}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Expand if collapsed
                if (section.classList.contains('edv-section--collapsed')) {
                    this.toggleSection(section.querySelector('.edv-section-header--collapsible'));
                }
            }
        }

        /**
         * Handle share action
         */
        async handleShare(target) {
            const entityName = target.dataset.entityName || this.currentEntity?.name || 'Entity';
            const url = window.location.href;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${entityName} - Eyes of Azrael`,
                        text: `Learn about ${entityName} in the Eyes of Azrael mythology encyclopedia`,
                        url: url
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        this.copyToClipboard(url);
                    }
                }
            } else {
                this.copyToClipboard(url);
            }
        }

        /**
         * Copy URL to clipboard
         */
        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Link copied to clipboard');
            }).catch(() => {
                // Fallback
                const input = document.createElement('input');
                input.value = text;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                this.showToast('Link copied to clipboard');
            });
        }

        /**
         * Handle bookmark action
         */
        handleBookmark(target) {
            const entityId = target.dataset.entityId || this.currentEntity?.id;
            if (!entityId) return;

            const isBookmarked = this.toggleBookmark(entityId);
            target.classList.toggle('edv-btn--bookmarked', isBookmarked);

            const icon = target.querySelector('.edv-btn__icon');
            if (icon) {
                icon.innerHTML = isBookmarked ? '&#9733;' : '&#9734;';
            }

            this.showToast(isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
        }

        /**
         * Toggle bookmark state
         */
        toggleBookmark(entityId) {
            const bookmarks = this.getBookmarks();
            const index = bookmarks.indexOf(entityId);

            if (index === -1) {
                bookmarks.push(entityId);
            } else {
                bookmarks.splice(index, 1);
            }

            localStorage.setItem('eoa_bookmarks', JSON.stringify(bookmarks));
            return index === -1;
        }

        /**
         * Get bookmarks from storage
         */
        getBookmarks() {
            try {
                return JSON.parse(localStorage.getItem('eoa_bookmarks') || '[]');
            } catch {
                return [];
            }
        }

        /**
         * Check if entity is bookmarked
         */
        isBookmarked(entityId) {
            return this.getBookmarks().includes(entityId);
        }

        /**
         * Handle edit action
         */
        handleEdit(target) {
            const entityId = target.dataset.entityId || this.currentEntity?.id;
            const entityType = target.dataset.entityType || this.currentEntity?.entityType;

            if (entityId && entityType) {
                window.location.hash = `#/edit/${entityType}/${entityId}`;
            }
        }

        /**
         * Show toast notification
         */
        showToast(message, duration = 3000) {
            // Remove existing toast
            document.querySelector('.edv-toast')?.remove();

            const toast = document.createElement('div');
            toast.className = 'edv-toast';
            toast.textContent = message;
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');

            document.body.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('edv-toast--visible'));

            setTimeout(() => {
                toast.classList.remove('edv-toast--visible');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        /**
         * Initialize interactive features after render
         */
        initializeInteractiveFeatures() {
            this.restoreSectionStates();
            this.initializeLightbox();
            this.initializeTabs();
            this.updateBreadcrumb();

            // Initialize AssetDetailPanel's features if used
            if (this.assetDetailPanel && this.useNewComponents) {
                this.assetDetailPanel.attachEventListeners();
            }
        }

        /**
         * Initialize image lightbox
         */
        initializeLightbox() {
            const container = document.querySelector('.entity-detail-view');
            if (!container) return;

            container.querySelectorAll('[data-lightbox]').forEach(img => {
                img.addEventListener('click', () => {
                    this.openLightbox(img.dataset.src || img.src, img.dataset.caption || img.alt);
                });
            });
        }

        /**
         * Open lightbox
         */
        openLightbox(src, caption) {
            const lightbox = document.createElement('div');
            lightbox.className = 'edv-lightbox';
            lightbox.innerHTML = `
                <div class="edv-lightbox__overlay" role="dialog" aria-modal="true" aria-label="Image viewer">
                    <button class="edv-lightbox__close" aria-label="Close">&times;</button>
                    <div class="edv-lightbox__content">
                        <img src="${this.escapeAttr(src)}" alt="${this.escapeAttr(caption || 'Image')}" />
                        ${caption ? `<p class="edv-lightbox__caption">${this.escapeHtml(caption)}</p>` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(lightbox);
            document.body.classList.add('edv-lightbox-open');

            const close = () => {
                lightbox.classList.add('edv-lightbox--closing');
                setTimeout(() => {
                    lightbox.remove();
                    document.body.classList.remove('edv-lightbox-open');
                }, 200);
            };

            lightbox.querySelector('.edv-lightbox__overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget || e.target.classList.contains('edv-lightbox__close')) {
                    close();
                }
            });

            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', escHandler);
                }
            });

            requestAnimationFrame(() => lightbox.classList.add('edv-lightbox--open'));
        }

        /**
         * Initialize tabs
         */
        initializeTabs() {
            const container = document.querySelector('.entity-detail-view');
            if (!container) return;

            const tabList = container.querySelector('[role="tablist"]');
            if (!tabList) return;

            const tabs = tabList.querySelectorAll('[role="tab"]');
            const panels = container.querySelectorAll('[role="tabpanel"]');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => this.activateTab(tab, tabs, panels));
                tab.addEventListener('keydown', (e) => {
                    const tabsArray = Array.from(tabs);
                    const currentIndex = tabsArray.indexOf(tab);
                    let targetIndex = currentIndex;

                    switch (e.key) {
                        case 'ArrowRight':
                        case 'ArrowDown':
                            e.preventDefault();
                            targetIndex = (currentIndex + 1) % tabsArray.length;
                            break;
                        case 'ArrowLeft':
                        case 'ArrowUp':
                            e.preventDefault();
                            targetIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
                            break;
                        case 'Home':
                            e.preventDefault();
                            targetIndex = 0;
                            break;
                        case 'End':
                            e.preventDefault();
                            targetIndex = tabsArray.length - 1;
                            break;
                        default:
                            return;
                    }

                    this.activateTab(tabsArray[targetIndex], tabs, panels, true);
                });
            });
        }

        /**
         * Activate tab
         */
        activateTab(tab, tabs, panels, focus = false) {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });

            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');

            const panelId = tab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) panel.classList.add('active');

            if (focus) tab.focus();
        }

        /**
         * Update breadcrumb component
         */
        updateBreadcrumb() {
            if (!this.currentEntity) return;

            window.dispatchEvent(new CustomEvent('entity:loaded', {
                detail: {
                    entityId: this.currentEntity.id,
                    entityType: this.currentEntity.entityType,
                    mythology: this.currentEntity.mythology,
                    entityName: this.currentEntity.name || this.currentEntity.title
                }
            }));
        }

        /**
         * Load additional data asynchronously
         */
        async loadAdditionalData(entity, mythology, entityType) {
            // Load related entities
            if (entity.displayOptions?.relatedEntities?.length > 0) {
                await this.loadRelatedEntities(entity, mythology, entityType);
            }

            // Initialize community components
            this.initializeCommunityComponents(entity);
        }

        /**
         * Load related entities
         */
        async loadRelatedEntities(entity, mythology, entityType) {
            // Delegate to AssetDetailPanel or EntityDetailViewer
            if (this.assetDetailPanel) {
                // AssetDetailPanel handles this internally
                return;
            }

            // Otherwise use legacy loading
            if (window.EntityDetailViewer) {
                const viewer = new window.EntityDetailViewer({ db: this.db });
                await viewer.loadRelatedEntitiesAsync(entity, mythology, entityType);
            }
        }

        /**
         * Initialize community discussion components
         */
        initializeCommunityComponents(entity) {
            const discussionContainer = document.querySelector('.asset-discussion-container');
            if (discussionContainer && window.AssetDiscussion) {
                const discussion = new window.AssetDiscussion({
                    container: discussionContainer,
                    assetId: entity.id,
                    assetType: entity.entityType,
                    assetName: entity.name || entity.title,
                    mythology: entity.mythology
                });
                discussion.render();
            }
        }

        // ==================== Utility Methods ====================

        /**
         * Escape HTML special characters
         */
        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        /**
         * Escape attribute value
         */
        escapeAttr(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /**
         * Render icon (supports SVG URLs and emoji)
         */
        renderIcon(icon) {
            if (!icon) return '';

            if (icon.startsWith('<svg') || icon.startsWith('<?xml')) {
                return icon;
            }

            if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('./')) {
                return `<img src="${this.escapeAttr(icon)}" alt="" class="edv-icon-img" loading="lazy" />`;
            }

            return `<span class="edv-icon-emoji">${icon}</span>`;
        }

        /**
         * Render markdown to HTML
         */
        renderMarkdown(text) {
            if (!text) return '';

            // Use marked.js if available
            if (window.marked) {
                return window.marked.parse(text);
            }

            // Basic markdown conversion
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/^(.+)$/, '<p>$1</p>');
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }

        /**
         * Get entity type label
         */
        getEntityTypeLabel(entityType) {
            const labels = {
                'deities': 'Deity',
                'deity': 'Deity',
                'creatures': 'Creature',
                'creature': 'Creature',
                'heroes': 'Hero',
                'hero': 'Hero',
                'items': 'Item',
                'item': 'Item',
                'places': 'Place',
                'place': 'Place',
                'texts': 'Text',
                'text': 'Text',
                'rituals': 'Ritual',
                'ritual': 'Ritual',
                'herbs': 'Herb',
                'herb': 'Herb',
                'archetypes': 'Archetype',
                'archetype': 'Archetype',
                'symbols': 'Symbol',
                'symbol': 'Symbol',
                'mythologies': 'Mythology',
                'mythology': 'Mythology'
            };

            return labels[entityType.toLowerCase()] || this.capitalize(entityType);
        }

        /**
         * Get color for entity type
         */
        getTypeColor(entityType) {
            const colors = {
                'deities': '#ffd700',
                'creatures': '#ff6b6b',
                'heroes': '#4dabf7',
                'items': '#69db7c',
                'places': '#cc5de8',
                'texts': '#ffa94d',
                'rituals': '#be4bdb',
                'herbs': '#51cf66',
                'archetypes': '#20c997',
                'symbols': '#748ffc'
            };

            return colors[entityType.toLowerCase()] || '#667eea';
        }

        /**
         * Darken a color by percentage
         */
        darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        /**
         * Clean up when view is destroyed
         */
        destroy() {
            this.currentEntity = null;
            this.currentRoute = null;
            this.entityCache.clear();
        }
    }

    // Export to window
    window.EntityDetailView = EntityDetailView;

    // Auto-register with SPA navigation if available
    if (window.SPANavigation) {
        const entityDetailView = new EntityDetailView();
        window.SPANavigation.registerView('entity-detail', entityDetailView);
    }

})();
