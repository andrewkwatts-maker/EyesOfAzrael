/**
 * Page Asset Renderer
 *
 * Dynamically loads and renders page assets from Firebase 'pages' collection.
 * Supports landing pages, category pages, and detail pages with panel cards.
 *
 * Features:
 * - Related entities section with horizontal scrolling
 * - Relationship grouping (Family, Allies, Enemies, etc.)
 * - Quick preview on hover
 * - Skeleton loading states
 * - Add relationship functionality for authenticated users
 * - Lazy loading for off-screen sections
 * - Section navigation sticky sidebar (desktop)
 * - Smooth section reveal animations
 * - Polished hero sections with gradient overlays
 */

class PageAssetRenderer {
    constructor(db) {
        this.db = db;
        this.cache = new Map();
        this.collectionCache = new Map();
        this.hoverTimeout = null;
        this.activePreview = null;
        this.currentEntityId = null; // Track current entity for "You are here" indicator
        this.intersectionObserver = null; // For lazy loading sections
        this.sectionNavObserver = null; // For section navigation active state
        this.activeSectionId = null; // Currently active section in navigation
    }

    /**
     * Render a page from Firebase
     * @param {string} pageId - Page ID (e.g., 'home', 'mythologies')
     * @param {HTMLElement} container - Container to render into
     */
    async renderPage(pageId, container) {
        console.log(`[Page Renderer] Loading page: ${pageId}`);

        // Clean up previous observers
        this.cleanup();

        // Show skeleton loading state
        container.innerHTML = this.getPageSkeletonHTML();
        container.classList.add('page-asset-container');

        try {
            // Load page asset
            const pageData = await this.loadPage(pageId);

            if (!pageData) {
                container.innerHTML = this.getNotFoundHTML(pageId);
                return;
            }

            // Render page content with section navigation
            container.innerHTML = await this.getPageHTML(pageData);

            // Initialize lazy loading for sections
            this.initializeLazyLoading(container);

            // Initialize section navigation
            this.initializeSectionNavigation(container, pageData);

            // Attach event listeners
            this.attachEventListeners(container, pageData);

            // Trigger section reveal animations
            this.triggerSectionRevealAnimations(container);

            console.log(`[Page Renderer] Page rendered: ${pageData.title}`);

        } catch (error) {
            console.error(`[Page Renderer] Error rendering page ${pageId}:`, error);
            container.innerHTML = this.getErrorHTML(error);
        }
    }

    /**
     * Clean up observers and event listeners
     */
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        if (this.sectionNavObserver) {
            this.sectionNavObserver.disconnect();
            this.sectionNavObserver = null;
        }
        this.clearHoverTimeout();
        this.hideQuickPreview();
    }

    /**
     * Initialize lazy loading for off-screen sections
     * @param {HTMLElement} container - Page container
     */
    initializeLazyLoading(container) {
        const lazyElements = container.querySelectorAll('[data-lazy-load="true"]');

        if (lazyElements.length === 0) return;

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.classList.add('lazy-loaded');
                    element.classList.remove('lazy-hidden');

                    // Load deferred content if data attribute is present
                    const deferredCollection = element.dataset.deferredCollection;
                    if (deferredCollection) {
                        this.loadDeferredSectionContent(element, deferredCollection);
                    }

                    this.intersectionObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '100px 0px', // Load 100px before entering viewport
            threshold: 0.1
        });

        lazyElements.forEach(el => {
            el.classList.add('lazy-hidden');
            this.intersectionObserver.observe(el);
        });
    }

    /**
     * Load deferred section content
     * @param {HTMLElement} sectionElement - Section element
     * @param {string} collection - Collection name to load
     */
    async loadDeferredSectionContent(sectionElement, collection) {
        const contentContainer = sectionElement.querySelector('.section-content');
        if (!contentContainer) return;

        try {
            const cards = await this.loadSectionCards({
                collection,
                displayCount: parseInt(sectionElement.dataset.displayCount || '12'),
                sortBy: sectionElement.dataset.sortBy || 'order'
            });

            contentContainer.innerHTML = this.getCardsHTML(cards, { collection });

            // Re-attach card event listeners
            const cardElements = contentContainer.querySelectorAll('.panel-card');
            cardElements.forEach(card => {
                card.addEventListener('click', (e) => {
                    console.log('[Page Renderer] Card clicked:', card.dataset.cardId);
                });
            });
        } catch (error) {
            console.error('[Page Renderer] Error loading deferred content:', error);
            contentContainer.innerHTML = '<p class="no-content">Failed to load content</p>';
        }
    }

    /**
     * Initialize section navigation sidebar
     * @param {HTMLElement} container - Page container
     * @param {Object} pageData - Page data with sections
     */
    initializeSectionNavigation(container, pageData) {
        const sections = pageData.sections || [];
        if (sections.length < 3) return; // Only show nav for 3+ sections

        // Create section navigation
        const sectionNav = container.querySelector('.section-nav-sidebar');
        if (!sectionNav) return;

        // Set up intersection observer for active state
        this.sectionNavObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                    const sectionId = entry.target.dataset.section;
                    this.updateActiveSectionNav(container, sectionId);
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: [0.3, 0.5, 0.7]
        });

        // Observe all sections
        const sectionElements = container.querySelectorAll('.page-section[data-section]');
        sectionElements.forEach(section => {
            this.sectionNavObserver.observe(section);
        });

        // Attach click handlers for section nav items
        const navItems = sectionNav.querySelectorAll('.section-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.dataset.target;
                const targetSection = container.querySelector(`[data-section="${targetId}"]`);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /**
     * Update active section in navigation
     * @param {HTMLElement} container - Page container
     * @param {string} sectionId - Active section ID
     */
    updateActiveSectionNav(container, sectionId) {
        if (this.activeSectionId === sectionId) return;
        this.activeSectionId = sectionId;

        const navItems = container.querySelectorAll('.section-nav-item');
        navItems.forEach(item => {
            const isActive = item.dataset.target === sectionId;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    /**
     * Trigger section reveal animations with stagger
     * @param {HTMLElement} container - Page container
     */
    triggerSectionRevealAnimations(container) {
        const sections = container.querySelectorAll('.page-section');

        sections.forEach((section, index) => {
            // Apply staggered animation delay
            section.style.setProperty('--section-index', index);
            section.classList.add('section-reveal');

            // Trigger animation after a small delay
            requestAnimationFrame(() => {
                setTimeout(() => {
                    section.classList.add('section-revealed');
                }, index * 100); // 100ms stagger between sections
            });
        });
    }

    /**
     * Load page data from Firebase
     */
    async loadPage(pageId) {
        // Check cache first
        if (this.cache.has(pageId)) {
            console.log(`[Page Renderer] Using cached page: ${pageId}`);
            return this.cache.get(pageId);
        }

        try {
            const doc = await this.db.collection('pages').doc(pageId).get();

            if (!doc.exists) {
                console.warn(`[Page Renderer] Page not found: ${pageId}`);
                return null;
            }

            const pageData = { id: doc.id, ...doc.data() };

            // Load panel cards for each section
            for (const section of pageData.sections || []) {
                if (section.collection) {
                    section.cards = await this.loadSectionCards(section);
                }
            }

            // Cache the page data
            this.cache.set(pageId, pageData);

            return pageData;

        } catch (error) {
            console.error(`[Page Renderer] Error loading page ${pageId}:`, error);
            throw error;
        }
    }

    /**
     * Load cards for a section from Firebase collection
     */
    async loadSectionCards(section) {
        const { collection, displayCount = 0, sortBy = 'order', filters = {} } = section;

        // Check cache
        const cacheKey = `${collection}-${displayCount}-${sortBy}`;
        if (this.collectionCache.has(cacheKey)) {
            console.log(`[Page Renderer] Using cached collection: ${cacheKey}`);
            return this.collectionCache.get(cacheKey);
        }

        try {
            let query = this.db.collection(collection);

            // Apply filters
            Object.entries(filters).forEach(([field, value]) => {
                query = query.where(field, '==', value);
            });

            // Apply sorting
            if (sortBy) {
                query = query.orderBy(sortBy);
            }

            // Apply limit
            if (displayCount > 0) {
                query = query.limit(displayCount);
            }

            const snapshot = await query.get();
            const cards = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`[Page Renderer] Loaded ${cards.length} cards from ${collection}`);

            // Cache the results
            this.collectionCache.set(cacheKey, cards);

            return cards;

        } catch (error) {
            console.error(`[Page Renderer] Error loading cards from ${collection}:`, error);
            return [];
        }
    }

    /**
     * Generate HTML for a page
     */
    async getPageHTML(pageData) {
        const { hero, sections = [] } = pageData;

        let html = '';

        // Hero section (if present)
        if (hero) {
            html += this.getHeroHTML(hero);
        }

        // Page layout with optional section navigation
        const hasSectionNav = sections.length >= 3;

        if (hasSectionNav) {
            html += `<div class="page-layout-with-nav">`;
            html += this.getSectionNavHTML(sections);
            html += `<div class="page-main-content">`;
        }

        // Sections with lazy loading for sections beyond the first 2
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const shouldLazyLoad = i >= 2; // Lazy load sections after the first 2
            html += this.getSectionHTML(section, { lazyLoad: shouldLazyLoad, index: i });
        }

        if (hasSectionNav) {
            html += `</div></div>`;
        }

        return html;
    }

    /**
     * Generate section navigation sidebar HTML
     * @param {Array} sections - Array of section objects
     * @returns {string} HTML for section navigation
     */
    getSectionNavHTML(sections) {
        if (!sections || sections.length < 3) return '';

        return `
            <nav class="section-nav-sidebar" aria-label="Page sections">
                <div class="section-nav-header">
                    <span class="section-nav-title">On This Page</span>
                </div>
                <ul class="section-nav-list">
                    ${sections.map((section, index) => {
                        const sectionId = section.id || `section-${index}`;
                        const icon = section.icon || '';
                        const title = section.title || 'Section';
                        return `
                            <li>
                                <button class="section-nav-item ${index === 0 ? 'active' : ''}"
                                        data-target="${this.escapeAttr(sectionId)}"
                                        aria-current="${index === 0 ? 'true' : 'false'}">
                                    ${icon ? `<span class="nav-item-icon">${this.renderIcon(icon)}</span>` : ''}
                                    <span class="nav-item-label">${this.escapeHtml(this.truncateText(title, 25))}</span>
                                </button>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </nav>
        `;
    }

    /**
     * Generate hero section HTML with gradient overlays and polished styling
     */
    getHeroHTML(hero) {
        const { title = '', subtitle = '', icon = '', cta = [], backgroundImage = '', theme = 'default' } = hero;

        // Skip rendering if no title
        if (!title) {
            console.warn('[Page Renderer] Hero section has no title, skipping render');
            return '';
        }

        // Background style for optional image
        const bgStyle = backgroundImage ? `background-image: url('${this.escapeAttr(backgroundImage)}')` : '';

        return `
            <section class="page-hero-section hero-theme-${this.escapeAttr(theme)}" ${bgStyle ? `style="${bgStyle}"` : ''}>
                <div class="hero-gradient-overlay"></div>
                <div class="hero-particle-bg" aria-hidden="true"></div>
                <div class="hero-content">
                    ${icon ? `
                        <div class="hero-icon-display">
                            <div class="hero-icon-glow" aria-hidden="true"></div>
                            ${this.renderIcon(icon)}
                        </div>
                    ` : ''}
                    <h1 class="hero-title">
                        <span class="hero-title-text">${this.escapeHtml(title)}</span>
                    </h1>
                    ${subtitle ? `
                        <p class="hero-subtitle">
                            <span class="hero-subtitle-text">${this.escapeHtml(subtitle)}</span>
                        </p>
                    ` : ''}
                    ${cta.length > 0 ? `
                        <div class="hero-actions">
                            ${cta.map((button, index) => `
                                <a href="${this.escapeAttr(button.link || '#/')}"
                                   class="btn ${button.primary ? 'btn-primary btn-hero-primary' : 'btn-secondary btn-hero-secondary'}"
                                   style="--cta-index: ${index}">
                                    ${button.icon ? `<span class="btn-icon">${this.renderIcon(button.icon)}</span>` : ''}
                                    <span class="btn-text">${this.escapeHtml(button.text || '')}</span>
                                    ${button.primary ? '<span class="btn-shine" aria-hidden="true"></span>' : ''}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="hero-bottom-fade" aria-hidden="true"></div>
            </section>
        `;
    }

    /**
     * Render icon - handles inline SVG, image URLs, and emoji/text
     * @param {string} icon - Icon string (inline SVG, URL, emoji, or text)
     * @returns {string} Rendered icon HTML
     */
    renderIcon(icon) {
        if (!icon) return '';
        if (typeof icon !== 'string') return '';

        const trimmed = icon.trim();

        // Check if icon is inline SVG - render directly without escaping
        if (trimmed.toLowerCase().startsWith('<svg')) {
            return `<span class="entity-icon-svg">${icon}</span>`;
        }

        // Check if icon is an image URL
        if (trimmed.startsWith('http') || /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(trimmed)) {
            const sanitizedUrl = this.sanitizeUrl(trimmed);
            if (!sanitizedUrl) return '';
            return `<img src="${this.escapeAttr(sanitizedUrl)}" alt="" class="entity-icon" loading="lazy" onerror="this.style.display='none'">`;
        }

        // For emoji or text icons, escape HTML
        return `<span class="entity-icon">${this.escapeHtml(icon)}</span>`;
    }

    /**
     * Sanitize a URL to prevent javascript: and data: XSS attacks
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL or empty string if unsafe
     */
    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim().toLowerCase();
        // Block javascript:, data:, and vbscript: protocols
        if (trimmed.startsWith('javascript:') ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('vbscript:')) {
            console.warn('[Page Renderer] Blocked potentially dangerous URL:', url);
            return '';
        }
        return url;
    }

    /**
     * Escape string for use in HTML attributes
     * @param {*} str - String to escape
     * @returns {string} Escaped string safe for HTML attributes
     */
    escapeAttr(str) {
        if (str == null) return '';
        const strValue = String(str);
        return strValue
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Generate section HTML with lazy loading support and polished styling
     * @param {Object} section - Section data
     * @param {Object} options - Rendering options
     * @returns {string} Section HTML
     */
    getSectionHTML(section, options = {}) {
        const { title = '', description = '', cards = [], icon = '', collection = '' } = section;
        const { lazyLoad = false, index = 0 } = options;
        const sectionId = section.id || `section-${index}`;

        // Skip rendering if no title
        if (!title) {
            console.warn('[Page Renderer] Section has no title, skipping render');
            return '';
        }

        // Determine if section should lazy load its content
        const lazyAttrs = lazyLoad
            ? `data-lazy-load="true" data-deferred-collection="${this.escapeAttr(collection)}" data-display-count="${section.displayCount || 12}" data-sort-by="${section.sortBy || 'order'}"`
            : '';

        // Determine content: show skeleton for lazy sections, actual cards for immediate load
        const contentHTML = lazyLoad
            ? this.getSectionSkeletonHTML(section.displayCount || 6)
            : this.getCardsHTML(cards, section);

        return `
            <section class="page-section"
                     data-section="${this.escapeAttr(sectionId)}"
                     ${lazyAttrs}
                     style="--section-index: ${index}">
                <div class="section-divider" aria-hidden="true">
                    <div class="section-divider-line"></div>
                    <div class="section-divider-ornament"></div>
                    <div class="section-divider-line"></div>
                </div>
                <div class="section-header">
                    <div class="section-header-content">
                        <h2 class="section-title">
                            ${icon ? `<span class="section-icon">${this.renderIcon(icon)}</span>` : ''}
                            <span class="section-title-text">${this.escapeHtml(title)}</span>
                        </h2>
                        ${description ? `
                            <p class="section-description">${this.escapeHtml(description)}</p>
                        ` : ''}
                    </div>
                    ${section.link ? `
                        <a href="${this.escapeAttr(section.link)}" class="section-view-all-link">
                            <span class="link-text">View All</span>
                            <span class="link-arrow" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </a>
                    ` : ''}
                </div>
                <div class="section-content">
                    ${contentHTML}
                </div>
            </section>
        `;
    }

    /**
     * Generate skeleton loading HTML for a section
     * @param {number} count - Number of skeleton cards to show
     * @returns {string} Skeleton HTML
     */
    getSectionSkeletonHTML(count = 6) {
        return `
            <div class="card-grid card-grid-skeleton">
                ${Array(count).fill(0).map((_, i) => `
                    <div class="panel-card skeleton-card" style="--card-index: ${i}" aria-hidden="true">
                        <div class="skeleton-card-icon skeleton-shimmer"></div>
                        <div class="skeleton-card-title skeleton-shimmer"></div>
                        <div class="skeleton-card-desc skeleton-shimmer"></div>
                        <div class="skeleton-card-desc-2 skeleton-shimmer"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Generate cards HTML with polished empty state
     */
    getCardsHTML(cards, section) {
        if (!cards || cards.length === 0) {
            return this.getEmptyStateHTML(section);
        }

        return `
            <div class="card-grid">
                ${cards.map((card, index) => this.getCardHTML(card, section, index)).join('')}
            </div>
        `;
    }

    /**
     * Generate polished empty state HTML
     * @param {Object} section - Section configuration
     * @returns {string} Empty state HTML
     */
    getEmptyStateHTML(section) {
        const collectionName = this.capitalize(section.collection || 'content');
        const icon = section.icon || '&#128269;';

        return `
            <div class="section-empty-state">
                <div class="empty-state-icon" aria-hidden="true">
                    ${this.renderIcon(icon)}
                </div>
                <h3 class="empty-state-title">No ${this.escapeHtml(collectionName)} Yet</h3>
                <p class="empty-state-description">
                    Content for this section is coming soon. Check back later for updates.
                </p>
                ${section.link ? `
                    <a href="${this.escapeAttr(section.link)}" class="empty-state-link">
                        <span>Explore ${this.escapeHtml(collectionName)}</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                ` : ''}
            </div>
        `;
    }

    /**
     * Generate individual card HTML (matching standardized card styling)
     * @param {Object} card - Card data
     * @param {Object} section - Section configuration
     * @param {number} index - Card index for animation delay
     * @returns {string} Card HTML
     */
    getCardHTML(card, section, index = 0) {
        if (!card) return '';

        const link = this.getCardLink(card, section);
        const icon = card.icon || section.icon || '';
        const name = card.name || card.title || 'Untitled';
        const description = card.description || card.subtitle || '';
        const cardId = card.id || '';
        const category = card.category || card.mythology || '';

        return `
            <a href="${this.escapeAttr(link)}"
               class="panel-card"
               data-card-id="${this.escapeAttr(cardId)}"
               style="--card-index: ${index}">
                <div class="card-accent-border" aria-hidden="true"></div>
                ${icon ? `
                    <div class="card-icon-wrapper">
                        <span class="card-icon">${this.renderIcon(icon)}</span>
                    </div>
                ` : ''}
                <div class="card-content">
                    <h3 class="card-title">${this.escapeHtml(name)}</h3>
                    ${category ? `
                        <span class="card-category">${this.escapeHtml(this.capitalize(category))}</span>
                    ` : ''}
                    ${description ? `
                        <p class="card-description">${this.escapeHtml(this.truncateText(description, 180))}</p>
                    ` : ''}
                </div>
                <div class="card-footer">
                    ${card.metadata?.status ? `
                        <span class="card-status">${this.escapeHtml(card.metadata.status)}</span>
                    ` : ''}
                    <span class="card-arrow" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                </div>
            </a>
        `;
    }

    // =====================================================
    // RELATED ENTITIES SECTION
    // =====================================================

    /**
     * Render related entities section with horizontal scrolling and grouped relationships
     * @param {Object} relatedEntities - Object with relationship types as keys
     * @param {Object} options - Rendering options
     * @returns {string} HTML string
     */
    renderRelatedEntitiesSection(relatedEntities, options = {}) {
        const {
            mythology = '',
            entityType = '',
            currentEntityId = null,
            showAddButton = false,
            maxVisible = 8
        } = options;

        // Store current entity ID for "You are here" highlighting
        this.currentEntityId = currentEntityId;

        if (!relatedEntities || Object.keys(relatedEntities).length === 0) {
            return this.getEmptyRelatedEntitiesHTML(showAddButton);
        }

        // Group entities by relationship type
        const groupedRelations = this.groupRelationshipsByType(relatedEntities);
        const relationshipTypes = Object.keys(groupedRelations);

        if (relationshipTypes.length === 0) {
            return this.getEmptyRelatedEntitiesHTML(showAddButton);
        }

        // Check if we should use tabs or show all groups
        const useTabs = relationshipTypes.length > 3;

        return `
            <section class="related-entities-section" data-current-entity="${this.escapeAttr(currentEntityId || '')}">
                <div class="related-entities-header">
                    <h2 class="related-entities-title">
                        <span class="related-icon" aria-hidden="true">&#128279;</span>
                        Related Entities
                    </h2>
                    ${this.getTotalCountBadge(groupedRelations)}
                    <a href="#/browse/${entityType}?related=${currentEntityId || ''}" class="related-see-all-link">
                        See All <span class="see-all-arrow">&#8594;</span>
                    </a>
                </div>

                ${useTabs ? this.renderRelationshipTabs(groupedRelations, options) : ''}

                <div class="related-entities-content ${useTabs ? 'with-tabs' : ''}">
                    ${relationshipTypes.map((type, index) =>
                        this.renderRelationshipGroup(type, groupedRelations[type], {
                            ...options,
                            isActive: !useTabs || index === 0,
                            maxVisible
                        })
                    ).join('')}
                </div>

                ${showAddButton ? this.getAddRelationshipButton() : ''}
            </section>
        `;
    }

    /**
     * Group related entities by relationship type
     */
    groupRelationshipsByType(relatedEntities) {
        const groups = {};

        // Standard relationship categories
        const categoryMap = {
            'family': { label: 'Family', icon: '&#128106;', order: 1 },
            'parent': { label: 'Parents', icon: '&#128106;', order: 1 },
            'child': { label: 'Children', icon: '&#128118;', order: 2 },
            'sibling': { label: 'Siblings', icon: '&#128101;', order: 3 },
            'spouse': { label: 'Consorts', icon: '&#128149;', order: 4 },
            'ally': { label: 'Allies', icon: '&#129309;', order: 5 },
            'allies': { label: 'Allies', icon: '&#129309;', order: 5 },
            'enemy': { label: 'Enemies', icon: '&#9876;', order: 6 },
            'enemies': { label: 'Enemies', icon: '&#9876;', order: 6 },
            'associated': { label: 'Associated', icon: '&#128279;', order: 7 },
            'related': { label: 'Related', icon: '&#128279;', order: 8 },
            'mentioned': { label: 'Mentioned In', icon: '&#128214;', order: 9 },
            'appears': { label: 'Appears With', icon: '&#127917;', order: 10 }
        };

        // Process each relationship entry
        Object.entries(relatedEntities).forEach(([key, value]) => {
            const type = key.toLowerCase();
            const category = categoryMap[type] || {
                label: this.capitalize(type.replace(/-/g, ' ')),
                icon: '&#128279;',
                order: 99
            };

            if (!groups[category.label]) {
                groups[category.label] = {
                    ...category,
                    entities: []
                };
            }

            // Handle both array and object formats
            if (Array.isArray(value)) {
                groups[category.label].entities.push(...value);
            } else if (value && typeof value === 'object') {
                if (value.entities) {
                    groups[category.label].entities.push(...value.entities);
                } else {
                    groups[category.label].entities.push(value);
                }
            }
        });

        // Sort groups by order
        const sortedGroups = {};
        Object.keys(groups)
            .sort((a, b) => groups[a].order - groups[b].order)
            .forEach(key => {
                if (groups[key].entities.length > 0) {
                    sortedGroups[key] = groups[key];
                }
            });

        return sortedGroups;
    }

    /**
     * Render relationship type tabs
     */
    renderRelationshipTabs(groupedRelations, options) {
        const types = Object.keys(groupedRelations);

        return `
            <div class="relationship-tabs" role="tablist" aria-label="Relationship types">
                ${types.map((type, index) => `
                    <button class="relationship-tab ${index === 0 ? 'active' : ''}"
                            role="tab"
                            aria-selected="${index === 0}"
                            aria-controls="rel-panel-${this.slugify(type)}"
                            data-tab="${this.slugify(type)}">
                        <span class="tab-icon">${groupedRelations[type].icon}</span>
                        <span class="tab-label">${this.escapeHtml(type)}</span>
                        <span class="tab-count">${groupedRelations[type].entities.length}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render a single relationship group with horizontal scrolling cards
     */
    renderRelationshipGroup(type, groupData, options = {}) {
        const {
            mythology = '',
            entityType = '',
            isActive = true,
            maxVisible = 8
        } = options;

        const entities = groupData.entities || [];
        const hasMore = entities.length > maxVisible;
        const visibleEntities = entities.slice(0, maxVisible);
        const groupId = this.slugify(type);

        return `
            <div class="relationship-group ${isActive ? 'active' : ''}"
                 id="rel-panel-${groupId}"
                 role="tabpanel"
                 aria-labelledby="tab-${groupId}"
                 ${!isActive ? 'hidden' : ''}>

                <div class="relationship-group-header">
                    <h3 class="relationship-group-title">
                        <span class="group-icon">${groupData.icon}</span>
                        ${this.escapeHtml(type)}
                        <span class="group-count-badge">${entities.length}</span>
                    </h3>
                </div>

                <div class="related-scroll-container">
                    <button class="scroll-arrow scroll-arrow-left"
                            aria-label="Scroll left"
                            disabled>
                        <span aria-hidden="true">&#8249;</span>
                    </button>

                    <div class="related-entities-scroll"
                         role="list"
                         aria-label="${this.escapeAttr(type)} entities">
                        ${visibleEntities.map((entity, index) =>
                            this.renderRelatedEntityCard(entity, {
                                ...options,
                                animationDelay: index * 0.05
                            })
                        ).join('')}

                        ${hasMore ? this.renderShowMoreCard(entities.length - maxVisible, type) : ''}
                    </div>

                    <button class="scroll-arrow scroll-arrow-right"
                            aria-label="Scroll right">
                        <span aria-hidden="true">&#8250;</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render a compact related entity card
     */
    renderRelatedEntityCard(entity, options = {}) {
        const { mythology = '', entityType = '', animationDelay = 0 } = options;

        const entityId = entity.id || '';
        const name = entity.name || entity.title || 'Unknown';
        const icon = entity.icon || this.getDefaultIconForType(entity.type || entityType);
        const type = entity.type || entityType || 'entity';
        const relationship = entity.relationship || '';
        const entityMythology = entity.mythology || mythology;

        // Check if this is the current entity
        const isCurrentEntity = this.currentEntityId && entityId === this.currentEntityId;

        // Build the link
        const link = this.getEntityLink(entity, entityMythology, type);

        return `
            <a href="${this.escapeAttr(link)}"
               class="related-entity-card ${isCurrentEntity ? 'current-entity' : ''}"
               role="listitem"
               data-entity-id="${this.escapeAttr(entityId)}"
               data-entity-type="${this.escapeAttr(type)}"
               data-mythology="${this.escapeAttr(entityMythology)}"
               style="--animation-delay: ${animationDelay}s"
               aria-label="${this.escapeAttr(name)}${isCurrentEntity ? ' (current)' : ''}">

                ${isCurrentEntity ? '<span class="current-entity-indicator" title="You are here">&#9679;</span>' : ''}

                <div class="related-card-icon">
                    ${this.renderIcon(icon)}
                </div>

                <div class="related-card-content">
                    <span class="related-card-name">${this.escapeHtml(this.truncateText(name, 30))}</span>
                    <span class="related-card-type-badge">${this.escapeHtml(this.capitalize(type))}</span>
                    ${relationship ? `
                        <span class="related-card-relationship">${this.escapeHtml(this.truncateText(relationship, 40))}</span>
                    ` : ''}
                </div>
            </a>
        `;
    }

    /**
     * Render "Show More" card for overflow
     */
    renderShowMoreCard(remainingCount, relationshipType) {
        return `
            <button class="related-entity-card show-more-card"
                    role="listitem"
                    data-action="show-more"
                    data-relationship="${this.escapeAttr(relationshipType)}"
                    aria-label="Show ${remainingCount} more ${relationshipType}">
                <div class="show-more-content">
                    <span class="show-more-count">+${remainingCount}</span>
                    <span class="show-more-label">more</span>
                </div>
            </button>
        `;
    }

    /**
     * Get total count badge HTML
     */
    getTotalCountBadge(groupedRelations) {
        const total = Object.values(groupedRelations)
            .reduce((sum, group) => sum + (group.entities?.length || 0), 0);

        return `<span class="related-total-badge">${total} connections</span>`;
    }

    /**
     * Get empty state HTML for related entities
     */
    getEmptyRelatedEntitiesHTML(showAddButton = false) {
        return `
            <section class="related-entities-section related-entities-empty">
                <div class="related-entities-header">
                    <h2 class="related-entities-title">
                        <span class="related-icon" aria-hidden="true">&#128279;</span>
                        Related Entities
                    </h2>
                </div>
                <div class="related-empty-state">
                    <div class="empty-icon" aria-hidden="true">&#128268;</div>
                    <p class="empty-title">No related entities found</p>
                    <p class="empty-description">
                        This entity doesn't have any documented relationships yet.
                    </p>
                    ${showAddButton ? `
                        <button class="btn btn-secondary add-relationship-btn" data-action="suggest-relationship">
                            <span class="btn-icon">&#43;</span>
                            Suggest a Relationship
                        </button>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Get "Add Relationship" button HTML
     */
    getAddRelationshipButton() {
        return `
            <div class="add-relationship-container">
                <button class="add-relationship-btn" data-action="suggest-relationship">
                    <span class="add-icon">&#43;</span>
                    <span class="add-label">Suggest Relationship</span>
                </button>
            </div>
        `;
    }

    /**
     * Render skeleton loading cards for related entities
     */
    renderRelatedEntitiesSkeletonHTML(count = 6) {
        return `
            <section class="related-entities-section related-entities-loading">
                <div class="related-entities-header">
                    <h2 class="related-entities-title">
                        <span class="related-icon" aria-hidden="true">&#128279;</span>
                        Related Entities
                    </h2>
                    <div class="skeleton-badge"></div>
                </div>
                <div class="related-scroll-container">
                    <div class="related-entities-scroll" role="status" aria-live="polite">
                        ${Array(count).fill(0).map((_, i) => `
                            <div class="related-entity-card skeleton"
                                 style="--animation-delay: ${i * 0.1}s"
                                 aria-hidden="true">
                                <div class="skeleton-icon"></div>
                                <div class="skeleton-content">
                                    <div class="skeleton-name"></div>
                                    <div class="skeleton-type"></div>
                                </div>
                            </div>
                        `).join('')}
                        <span class="sr-only">Loading related entities...</span>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Render quick preview popup for related entity
     */
    renderQuickPreviewHTML(entity) {
        if (!entity) return '';

        const name = entity.name || entity.title || 'Unknown';
        const description = entity.shortDescription || entity.description || '';
        const type = entity.type || '';
        const mythology = entity.mythology || '';
        const domains = entity.domains || [];

        return `
            <div class="related-quick-preview" role="tooltip">
                <div class="preview-header">
                    <div class="preview-icon">${this.renderIcon(entity.icon)}</div>
                    <div class="preview-title-section">
                        <h4 class="preview-title">${this.escapeHtml(name)}</h4>
                        <div class="preview-meta">
                            ${mythology ? `<span class="preview-mythology">${this.escapeHtml(this.capitalize(mythology))}</span>` : ''}
                            ${type ? `<span class="preview-type">${this.escapeHtml(this.capitalize(type))}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${description ? `
                    <p class="preview-description">${this.escapeHtml(this.truncateText(description, 150))}</p>
                ` : ''}
                ${domains.length > 0 ? `
                    <div class="preview-domains">
                        ${domains.slice(0, 4).map(d => `<span class="preview-domain">${this.escapeHtml(d)}</span>`).join('')}
                        ${domains.length > 4 ? `<span class="preview-domain-more">+${domains.length - 4}</span>` : ''}
                    </div>
                ` : ''}
                <div class="preview-cta">Click to view details</div>
            </div>
        `;
    }

    /**
     * Get entity link for navigation
     */
    getEntityLink(entity, mythology, type) {
        const entityId = entity.id || '';
        if (!entityId) return '#/';

        // Normalize type for routing
        const normalizedType = this.normalizeTypeForRoute(type);

        if (mythology) {
            return `#/mythology/${mythology}/${normalizedType}/${entityId}`;
        }
        return `#/browse/${normalizedType}/${entityId}`;
    }

    /**
     * Normalize entity type for URL routing
     */
    normalizeTypeForRoute(type) {
        if (!type) return 'entity';

        const typeMap = {
            'deity': 'deity',
            'deities': 'deity',
            'god': 'deity',
            'gods': 'deity',
            'hero': 'hero',
            'heroes': 'hero',
            'creature': 'creature',
            'creatures': 'creature',
            'item': 'item',
            'items': 'item',
            'artifact': 'item',
            'place': 'place',
            'places': 'place',
            'location': 'place',
            'text': 'text',
            'texts': 'text',
            'symbol': 'symbol',
            'symbols': 'symbol',
            'ritual': 'ritual',
            'rituals': 'ritual',
            'herb': 'herb',
            'herbs': 'herb',
            'archetype': 'archetype',
            'archetypes': 'archetype'
        };

        return typeMap[type.toLowerCase()] || type.toLowerCase();
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIconForType(type) {
        const iconMap = {
            'deity': '&#9734;',
            'hero': '&#9876;',
            'creature': '&#128009;',
            'item': '&#128302;',
            'place': '&#127968;',
            'text': '&#128214;',
            'symbol': '&#10070;',
            'ritual': '&#128367;',
            'herb': '&#127807;',
            'archetype': '&#127917;'
        };
        return iconMap[type?.toLowerCase()] || '&#128279;';
    }

    /**
     * Truncate text to a maximum length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length (default 250 chars for cards)
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength = 250) {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        // Try to break at a word boundary
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace).trim() + '...';
        }
        return truncated.trim() + '...';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Capitalize first letter of each word
     */
    capitalize(str) {
        if (!str) return '';
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Convert string to URL-safe slug
     */
    slugify(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    /**
     * Get link for a card
     * @param {Object} card - Card data
     * @param {Object} section - Section configuration
     * @returns {string} Navigation link
     */
    getCardLink(card, section) {
        const collection = section?.collection || '';
        const cardId = card?.id || '';

        // Return home if no valid card ID
        if (!cardId) return '#/';

        switch (collection) {
            case 'mythologies':
                return `#/mythology/${cardId}`;
            case 'deities':
                return `#/browse/deities/${cardId}`;
            case 'heroes':
                return `#/browse/heroes/${cardId}`;
            case 'creatures':
                return `#/browse/creatures/${cardId}`;
            case 'places':
                return `#/browse/places/${cardId}`;
            case 'items':
                return `#/browse/items/${cardId}`;
            case 'archetypes':
                return `#/browse/archetypes/${cardId}`;
            case 'rituals':
                return `#/browse/rituals/${cardId}`;
            case 'herbs':
                return `#/browse/herbs/${cardId}`;
            case 'texts':
                return `#/browse/texts/${cardId}`;
            case 'symbols':
                return `#/browse/symbols/${cardId}`;
            case 'magic':
                return `#/browse/magic/${cardId}`;
            case 'theories':
                return `#/theory/${cardId}`;
            case 'submissions':
                return `#/submission/${cardId}`;
            default:
                // Fallback: use collection as route segment if available
                return collection ? `#/${collection}/${cardId}` : `#/entity/${cardId}`;
        }
    }

    /**
     * Attach event listeners to rendered content
     */
    attachEventListeners(container, pageData) {
        // Card click events
        const cards = container.querySelectorAll('.panel-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                console.log('[Page Renderer] Card clicked:', card.dataset.cardId);
            });
        });

        // Related entities scroll functionality
        this.attachScrollListeners(container);

        // Tab switching for relationship groups
        this.attachTabListeners(container);

        // Quick preview on hover
        this.attachHoverPreviewListeners(container);

        // Add relationship button
        this.attachAddRelationshipListener(container);

        // Show more button
        this.attachShowMoreListener(container);
    }

    /**
     * Attach horizontal scroll listeners
     */
    attachScrollListeners(container) {
        const scrollContainers = container.querySelectorAll('.related-scroll-container');

        scrollContainers.forEach(scrollContainer => {
            const scrollArea = scrollContainer.querySelector('.related-entities-scroll');
            const leftArrow = scrollContainer.querySelector('.scroll-arrow-left');
            const rightArrow = scrollContainer.querySelector('.scroll-arrow-right');

            if (!scrollArea) return;

            // Update arrow visibility
            const updateArrows = () => {
                if (leftArrow) {
                    leftArrow.disabled = scrollArea.scrollLeft <= 0;
                }
                if (rightArrow) {
                    rightArrow.disabled =
                        scrollArea.scrollLeft >= scrollArea.scrollWidth - scrollArea.clientWidth - 10;
                }
            };

            // Scroll by card width
            const scrollByCard = (direction) => {
                const cardWidth = scrollArea.querySelector('.related-entity-card')?.offsetWidth || 180;
                const gap = 16; // CSS gap value
                scrollArea.scrollBy({
                    left: direction * (cardWidth + gap) * 2,
                    behavior: 'smooth'
                });
            };

            // Arrow click handlers
            if (leftArrow) {
                leftArrow.addEventListener('click', () => scrollByCard(-1));
            }
            if (rightArrow) {
                rightArrow.addEventListener('click', () => scrollByCard(1));
            }

            // Update arrows on scroll
            scrollArea.addEventListener('scroll', updateArrows, { passive: true });

            // Initial arrow state
            updateArrows();

            // Touch swipe support
            let touchStartX = 0;
            let touchEndX = 0;

            scrollArea.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            scrollArea.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    scrollByCard(diff > 0 ? 1 : -1);
                }
            }, { passive: true });
        });
    }

    /**
     * Attach tab switching listeners
     */
    attachTabListeners(container) {
        const tabs = container.querySelectorAll('.relationship-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;

                // Deactivate all tabs
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });

                // Activate clicked tab
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                // Hide all panels
                const panels = container.querySelectorAll('.relationship-group');
                panels.forEach(p => {
                    p.classList.remove('active');
                    p.hidden = true;
                });

                // Show target panel
                const targetPanel = container.querySelector(`#rel-panel-${tabId}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.hidden = false;
                }
            });
        });
    }

    /**
     * Attach hover preview listeners for related entity cards
     */
    attachHoverPreviewListeners(container) {
        const relatedCards = container.querySelectorAll('.related-entity-card:not(.skeleton):not(.show-more-card)');

        relatedCards.forEach(card => {
            // Mouse enter - show preview after delay
            card.addEventListener('mouseenter', (e) => {
                this.clearHoverTimeout();

                this.hoverTimeout = setTimeout(async () => {
                    const entityId = card.dataset.entityId;
                    const entityType = card.dataset.entityType;
                    const mythology = card.dataset.mythology;

                    if (entityId) {
                        await this.showQuickPreview(card, entityId, entityType, mythology);
                    }
                }, 200);
            });

            // Mouse leave - hide preview
            card.addEventListener('mouseleave', () => {
                this.clearHoverTimeout();
                this.hideQuickPreview();
            });

            // Focus events for accessibility
            card.addEventListener('focus', (e) => {
                this.clearHoverTimeout();
                // Show preview on focus for keyboard users
                this.hoverTimeout = setTimeout(async () => {
                    const entityId = card.dataset.entityId;
                    const entityType = card.dataset.entityType;
                    const mythology = card.dataset.mythology;

                    if (entityId) {
                        await this.showQuickPreview(card, entityId, entityType, mythology);
                    }
                }, 300);
            });

            card.addEventListener('blur', () => {
                this.clearHoverTimeout();
                this.hideQuickPreview();
            });
        });
    }

    /**
     * Show quick preview popup
     */
    async showQuickPreview(targetCard, entityId, entityType, mythology) {
        try {
            // Try to load entity data
            const collection = entityType ? `${entityType}s` : 'entities';
            let entity = null;

            // Check cache first
            const cacheKey = `${collection}-${entityId}`;
            if (this.collectionCache.has(cacheKey)) {
                entity = this.collectionCache.get(cacheKey);
            } else if (this.db) {
                // Load from Firebase
                const doc = await this.db.collection(collection).doc(entityId).get();
                if (doc.exists) {
                    entity = { id: doc.id, ...doc.data() };
                    this.collectionCache.set(cacheKey, entity);
                }
            }

            if (!entity) return;

            // Create preview element
            const previewHTML = this.renderQuickPreviewHTML(entity);

            // Remove existing preview
            this.hideQuickPreview();

            // Create and position new preview
            const preview = document.createElement('div');
            preview.className = 'quick-preview-container';
            preview.innerHTML = previewHTML;
            document.body.appendChild(preview);

            // Position preview smartly
            this.positionQuickPreview(preview, targetCard);

            // Animate in
            requestAnimationFrame(() => {
                preview.classList.add('visible');
            });

            this.activePreview = preview;

        } catch (error) {
            console.warn('[Page Renderer] Failed to load preview:', error);
        }
    }

    /**
     * Position quick preview to avoid viewport overflow
     */
    positionQuickPreview(preview, targetCard) {
        const cardRect = targetCard.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 16;

        let top = cardRect.bottom + 8;
        let left = cardRect.left + (cardRect.width / 2) - (previewRect.width / 2);

        // Adjust horizontal position if overflow
        if (left < padding) {
            left = padding;
        } else if (left + previewRect.width > viewportWidth - padding) {
            left = viewportWidth - previewRect.width - padding;
        }

        // If preview would overflow bottom, show above the card
        if (top + previewRect.height > viewportHeight - padding) {
            top = cardRect.top - previewRect.height - 8;
            preview.classList.add('above');
        }

        preview.style.top = `${top}px`;
        preview.style.left = `${left}px`;
    }

    /**
     * Hide quick preview popup
     */
    hideQuickPreview() {
        if (this.activePreview) {
            this.activePreview.classList.remove('visible');
            setTimeout(() => {
                this.activePreview?.remove();
                this.activePreview = null;
            }, 200);
        }
    }

    /**
     * Clear hover timeout
     */
    clearHoverTimeout() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
    }

    /**
     * Attach add relationship button listener
     */
    attachAddRelationshipListener(container) {
        const addButtons = container.querySelectorAll('[data-action="suggest-relationship"]');

        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[Page Renderer] Suggest relationship clicked');

                // Dispatch custom event for relationship suggestion
                const event = new CustomEvent('suggest-relationship', {
                    bubbles: true,
                    detail: {
                        currentEntityId: this.currentEntityId
                    }
                });
                container.dispatchEvent(event);

                // If RelationshipSuggestionForm is available globally, open it
                if (window.RelationshipSuggestionForm) {
                    const form = new window.RelationshipSuggestionForm();
                    form.open(this.currentEntityId);
                }
            });
        });
    }

    /**
     * Attach show more button listener
     */
    attachShowMoreListener(container) {
        const showMoreBtns = container.querySelectorAll('[data-action="show-more"]');

        showMoreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const relationshipType = btn.dataset.relationship;
                console.log('[Page Renderer] Show more clicked for:', relationshipType);

                // Dispatch custom event
                const event = new CustomEvent('show-more-relationships', {
                    bubbles: true,
                    detail: { relationshipType }
                });
                container.dispatchEvent(event);
            });
        });
    }

    /**
     * Generate full page skeleton loading state
     * @returns {string} Page skeleton HTML
     */
    getPageSkeletonHTML() {
        return `
            <div class="page-skeleton" role="status" aria-live="polite" aria-busy="true">
                <!-- Hero Skeleton -->
                <div class="hero-skeleton">
                    <div class="skeleton-hero-icon skeleton-shimmer"></div>
                    <div class="skeleton-hero-title skeleton-shimmer"></div>
                    <div class="skeleton-hero-subtitle skeleton-shimmer"></div>
                    <div class="skeleton-hero-cta">
                        <div class="skeleton-btn skeleton-shimmer"></div>
                        <div class="skeleton-btn skeleton-shimmer"></div>
                    </div>
                </div>

                <!-- Section Skeletons -->
                ${[1, 2].map(i => `
                    <div class="section-skeleton" style="--section-index: ${i}">
                        <div class="skeleton-section-header">
                            <div class="skeleton-section-title skeleton-shimmer"></div>
                            <div class="skeleton-section-desc skeleton-shimmer"></div>
                        </div>
                        <div class="skeleton-card-grid">
                            ${[1, 2, 3, 4].map(j => `
                                <div class="skeleton-panel-card" style="--card-index: ${j}">
                                    <div class="skeleton-card-icon skeleton-shimmer"></div>
                                    <div class="skeleton-card-title skeleton-shimmer"></div>
                                    <div class="skeleton-card-desc skeleton-shimmer"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}

                <span class="sr-only">Loading page content...</span>
            </div>
        `;
    }

    /**
     * Loading state HTML
     * @param {string} message - Optional loading message
     * @returns {string} Loading HTML
     */
    getLoadingHTML(message = 'Loading page...') {
        return `
            <div class="loading-container" role="status" aria-live="polite">
                <div class="loading-spinner-wrapper">
                    <div class="spinner-container">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <div class="spinner-glow" aria-hidden="true"></div>
                </div>
                <p class="loading-message">${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    /**
     * Not found HTML
     * @param {string} pageId - Page ID that was not found
     * @returns {string} Not found HTML
     */
    getNotFoundHTML(pageId) {
        const escapedPageId = this.escapeHtml(pageId || 'unknown');
        return `
            <div class="error-container" role="alert" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">&#128269;</div>
                <h1 style="color: var(--color-text-primary, #e5e7eb); margin-bottom: 1rem;">Page Not Found</h1>
                <p style="color: var(--color-text-secondary, #9ca3af); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
                    The page "${escapedPageId}" could not be found. It may have been moved or deleted.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="#/" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none;">
                        Return Home
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Error HTML
     * @param {Error|string} error - Error object or message
     * @returns {string} Error HTML
     */
    getErrorHTML(error) {
        const errorMessage = this.escapeHtml(
            (error && typeof error === 'object' && error.message) ? error.message : String(error || 'An unexpected error occurred')
        );
        return `
            <div class="error-container" role="alert" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">&#9888;</div>
                <h1 style="color: var(--color-error, #ef4444); margin-bottom: 1rem;">Error Loading Page</h1>
                <p style="color: var(--color-text-secondary, #9ca3af); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">
                    ${errorMessage}
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        Retry
                    </button>
                    <a href="#/" class="btn btn-secondary" style="padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none;">
                        Return Home
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.collectionCache.clear();
        console.log('[Page Renderer] Cache cleared');
    }
}

// Make globally available
window.PageAssetRenderer = PageAssetRenderer;
