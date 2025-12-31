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
        const { title = '', subtitle = '', icon = '', cta = [] } = hero;

        // Skip rendering if no title
        if (!title) {
            console.warn('[Page Renderer] Hero section has no title, skipping render');
            return '';
        }

        return `
            <section class="page-hero-section">
                ${icon ? `<div class="hero-icon-display">${this.renderIcon(icon)}</div>` : ''}
                <h1 class="hero-title">${this.escapeHtml(title)}</h1>
                ${subtitle ? `<p class="hero-subtitle">${this.escapeHtml(subtitle)}</p>` : ''}
                ${cta.length > 0 ? `
                    <div class="hero-actions">
                        ${cta.map(button => `
                            <a href="${this.escapeAttr(button.link || '#/')}"
                               class="btn ${button.primary ? 'btn-primary' : 'btn-secondary'}">
                                ${button.icon ? this.renderIcon(button.icon) : ''} ${this.escapeHtml(button.text || '')}
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </section>
        `;
    }

    /**
     * Render icon - handles both emoji/text and image URLs
     * @param {string} icon - Icon string (emoji, text, or URL)
     * @returns {string} Rendered icon HTML
     */
    renderIcon(icon) {
        if (!icon) return '';

        // Check if icon is an image URL
        if (typeof icon === 'string' &&
            (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.startsWith('http'))) {
            const sanitizedUrl = this.sanitizeUrl(icon);
            if (!sanitizedUrl) return '';
            return `<img src="${this.escapeAttr(sanitizedUrl)}" alt="" class="icon-img" loading="lazy" onerror="this.style.display='none'">`;
        }

        // For emoji or text icons, escape HTML
        return this.escapeHtml(icon);
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
     * Generate section HTML
     */
    getSectionHTML(section) {
        const { title = '', description = '', cards = [], icon = '' } = section;
        const sectionId = section.id || '';

        // Skip rendering if no title
        if (!title) {
            console.warn('[Page Renderer] Section has no title, skipping render');
            return '';
        }

        return `
            <section class="page-section" data-section="${this.escapeAttr(sectionId)}">
                <div class="section-header">
                    <h2 class="section-title">
                        ${icon ? `<span class="section-icon">${this.renderIcon(icon)}</span>` : ''}
                        ${this.escapeHtml(title)}
                    </h2>
                    ${description ? `<p class="section-description">${this.escapeHtml(description)}</p>` : ''}
                    ${section.link ? `
                        <a href="${this.escapeAttr(section.link)}" class="section-link">View All</a>
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
            const collectionName = this.escapeHtml(section.collection || 'content');
            return `<p class="no-content">No ${collectionName} available yet.</p>`;
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
        if (!card) return '';

        const link = this.getCardLink(card, section);
        const icon = card.icon || section.icon || '';
        const name = card.name || card.title || 'Untitled';
        const description = card.description || card.subtitle || '';
        const cardId = card.id || '';

        return `
            <a href="${this.escapeAttr(link)}" class="panel-card" data-card-id="${this.escapeAttr(cardId)}">
                ${icon ? `<span class="card-icon">${this.renderIcon(icon)}</span>` : ''}
                <h3 class="card-title">${this.escapeHtml(name)}</h3>
                ${description ? `<p class="card-description">${this.escapeHtml(this.truncateText(description, 150))}</p>` : ''}
                ${card.metadata?.status ? `
                    <span class="card-status">${this.escapeHtml(card.metadata.status)}</span>
                ` : ''}
            </a>
        `;
    }

    /**
     * Truncate text to a maximum length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength = 150) {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
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
    }

    /**
     * Loading state HTML
     * @param {string} message - Optional loading message
     * @returns {string} Loading HTML
     */
    getLoadingHTML(message = 'Loading page...') {
        return `
            <div class="loading-container" role="status" aria-live="polite">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
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
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">🔍</div>
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
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
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
