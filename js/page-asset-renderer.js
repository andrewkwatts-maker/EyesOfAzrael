/**
 * Page Asset Renderer
 *
 * Dynamically loads and renders page assets from Firebase 'pages' collection.
 * Supports landing pages, category pages, and detail pages with panel cards.
 */

class PageAssetRenderer {
    constructor(db) {
        this.db = db;
        this.cache = new Map();
        this.collectionCache = new Map();
    }

    /**
     * Render a page from Firebase
     * @param {string} pageId - Page ID (e.g., 'home', 'mythologies')
     * @param {HTMLElement} container - Container to render into
     */
    async renderPage(pageId, container) {
        console.log(`[Page Renderer] Loading page: ${pageId}`);

        // Show loading state
        container.innerHTML = this.getLoadingHTML();

        try {
            // Load page asset
            const pageData = await this.loadPage(pageId);

            if (!pageData) {
                container.innerHTML = this.getNotFoundHTML(pageId);
                return;
            }

            // Render page content
            container.innerHTML = await this.getPageHTML(pageData);

            // Attach event listeners
            this.attachEventListeners(container, pageData);

            console.log(`[Page Renderer] Page rendered: ${pageData.title}`);

        } catch (error) {
            console.error(`[Page Renderer] Error rendering page ${pageId}:`, error);
            container.innerHTML = this.getErrorHTML(error);
        }
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

        // Sections
        for (const section of sections) {
            html += this.getSectionHTML(section);
        }

        return html;
    }

    /**
     * Generate hero section HTML
     */
    getHeroHTML(hero) {
        const { title, subtitle, icon, cta = [] } = hero;

        return `
            <section class="page-hero-section">
                ${icon ? `<div class="hero-icon-display">${icon}</div>` : ''}
                <h1 class="hero-title">${title}</h1>
                ${subtitle ? `<p class="hero-subtitle">${subtitle}</p>` : ''}
                ${cta.length > 0 ? `
                    <div class="hero-actions">
                        ${cta.map(button => `
                            <a href="${button.link}"
                               class="btn ${button.primary ? 'btn-primary' : 'btn-secondary'}">
                                ${button.icon || ''} ${button.text}
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </section>
        `;
    }

    /**
     * Generate section HTML
     */
    getSectionHTML(section) {
        const { title, description, cards = [], icon = '📄' } = section;

        return `
            <section class="page-section" data-section="${section.id}">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="section-icon">${icon}</span>
                        ${title}
                    </h2>
                    ${description ? `<p class="section-description">${description}</p>` : ''}
                    ${section.link ? `
                        <a href="${section.link}" class="section-link">View All →</a>
                    ` : ''}
                </div>
                <div class="section-content">
                    ${this.getCardsHTML(cards, section)}
                </div>
            </section>
        `;
    }

    /**
     * Generate cards HTML
     */
    getCardsHTML(cards, section) {
        if (!cards || cards.length === 0) {
            return `<p class="no-content">No ${section.collection} available yet.</p>`;
        }

        return `
            <div class="card-grid">
                ${cards.map(card => this.getCardHTML(card, section)).join('')}
            </div>
        `;
    }

    /**
     * Generate individual card HTML (matching standardized card styling)
     */
    getCardHTML(card, section) {
        const link = this.getCardLink(card, section);
        const icon = card.icon || section.icon || '📄';
        const name = card.name || card.title || 'Untitled';
        const description = card.description || card.subtitle || '';

        return `
            <a href="${link}" class="panel-card" data-card-id="${card.id}">
                <span class="card-icon">${icon}</span>
                <h3 class="card-title">${this.escapeHtml(name)}</h3>
                ${description ? `<p class="card-description">${this.escapeHtml(description)}</p>` : ''}
                ${card.metadata?.status ? `
                    <span class="card-status">${card.metadata.status}</span>
                ` : ''}
            </a>
        `;
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
     * Get link for a card
     */
    getCardLink(card, section) {
        const collection = section.collection;

        switch (collection) {
            case 'mythologies':
                return `#/mythology/${card.id}`;
            case 'places':
                return `#/place/${card.id}`;
            case 'items':
                return `#/item/${card.id}`;
            case 'archetypes':
                return `#/archetype/${card.id}`;
            case 'theories':
                return `#/theory/${card.id}`;
            case 'submissions':
                return `#/submission/${card.id}`;
            default:
                return `#/${collection}/${card.id}`;
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
    }

    /**
     * Loading state HTML
     */
    getLoadingHTML() {
        return `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading page...</p>
            </div>
        `;
    }

    /**
     * Not found HTML
     */
    getNotFoundHTML(pageId) {
        return `
            <div class="error-container">
                <h1>Page Not Found</h1>
                <p>The page "${pageId}" could not be found.</p>
                <a href="#/" class="btn btn-primary">Return Home</a>
            </div>
        `;
    }

    /**
     * Error HTML
     */
    getErrorHTML(error) {
        return `
            <div class="error-container">
                <h1>Error Loading Page</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
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
