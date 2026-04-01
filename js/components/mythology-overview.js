/**
 * Mythology Overview Component
 * Displays a full encyclopedia-style page for a mythology tradition.
 *
 * Layout:
 * 1. Hero section — icon, title, metadata
 * 2. Introduction — long-form description from Firebase
 * 3. Table of contents — anchor links to each category section
 * 4. Expanded category sections — intro paragraph + entity grid per type
 */

class MythologyOverview {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
        this.PREVIEW_LIMIT = 20; // max entities shown per section before "show all"
    }

    // Entity type definitions
    static ENTITY_TYPES = [
        { collection: 'deities', singular: 'deity', plural: 'deities', icon: '👑', label: 'Deities & Gods' },
        { collection: 'heroes', singular: 'hero', plural: 'heroes', icon: '🦸', label: 'Heroes & Legends' },
        { collection: 'creatures', singular: 'creature', plural: 'creatures', icon: '🐉', label: 'Mythical Creatures' },
        { collection: 'cosmology', singular: 'cosmology', plural: 'cosmology', icon: '🌌', label: 'Cosmology' },
        { collection: 'places', singular: 'place', plural: 'places', icon: '🏛️', label: 'Sacred Places' },
        { collection: 'items', singular: 'item', plural: 'items', icon: '⚔️', label: 'Sacred Items' },
        { collection: 'texts', singular: 'text', plural: 'texts', icon: '📜', label: 'Sacred Texts' },
        { collection: 'rituals', singular: 'ritual', plural: 'rituals', icon: '🕯️', label: 'Rituals & Practices' },
        { collection: 'symbols', singular: 'symbol', plural: 'symbols', icon: '⚡', label: 'Symbols' },
        { collection: 'herbs', singular: 'herb', plural: 'herbs', icon: '🌿', label: 'Sacred Herbalism' },
        { collection: 'magic', singular: 'magic', plural: 'magic', icon: '✨', label: 'Magic Systems' },
    ];

    /**
     * Main render entry point
     */
    async render(route) {
        try {
            const { mythology } = route;

            const mythologyData = await this.loadMythology(mythology);
            if (!mythologyData) {
                return this.renderNotFound(mythology);
            }

            const sections = await this.loadCategorySections(mythology);

            return this.generateHTML(mythologyData, sections);
        } catch (error) {
            console.error('[MythologyOverview] Render error:', error);
            return `
                <div class="mythology-error" role="alert" style="padding: 2rem; text-align: center; max-width: 600px; margin: 2rem auto;">
                    <h2 style="color: var(--color-error, #ef4444); margin-bottom: 1rem;">Unable to Load Mythology</h2>
                    <p style="margin-bottom: 1.5rem; color: var(--color-text-secondary, #a0a0a0);">
                        We could not load the mythology details. This may be a temporary issue with the connection.
                    </p>
                    <button class="btn-primary mythology-retry-btn"
                            style="cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Load mythology document from Firestore
     * Handles both raw IDs (e.g., 'norse') and prefixed IDs (e.g., 'mythology-hub-norse')
     */
    async loadMythology(mythologyId) {
        if (!this.db) throw new Error('Firebase Firestore not initialized');

        // Try the exact ID first
        let doc = await this.db.collection('mythologies').doc(mythologyId).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };

        // Try with mythology-hub- prefix (Firebase convention)
        if (!mythologyId.startsWith('mythology-hub-')) {
            doc = await this.db.collection('mythologies').doc(`mythology-hub-${mythologyId}`).get();
            if (doc.exists) return { id: doc.id, ...doc.data() };
        }

        // Fallback: query by mythology field
        const snapshot = await this.db.collection('mythologies')
            .where('mythology', '==', mythologyId)
            .limit(1)
            .get();
        if (!snapshot.empty) {
            const matchedDoc = snapshot.docs[0];
            return { id: matchedDoc.id, ...matchedDoc.data() };
        }

        return null;
    }

    /**
     * Load all category sections with entity data in parallel
     */
    async loadCategorySections(mythologyId) {
        const results = await Promise.all(
            MythologyOverview.ENTITY_TYPES.map(async (type) => {
                try {
                    const snapshot = await this.db.collection(type.collection)
                        .where('mythology', '==', mythologyId)
                        .get();

                    if (snapshot.empty) return null;

                    const entities = [];
                    snapshot.forEach(doc => {
                        entities.push({ id: doc.id, ...doc.data() });
                    });

                    // Sort alphabetically by name
                    entities.sort((a, b) => {
                        const nameA = (a.name || a.title || '').toLowerCase();
                        const nameB = (b.name || b.title || '').toLowerCase();
                        return nameA.localeCompare(nameB);
                    });

                    return {
                        ...type,
                        count: entities.length,
                        entities
                    };
                } catch (error) {
                    console.error(`[MythologyOverview] Error loading ${type.collection}:`, error);
                    return null;
                }
            })
        );

        // Filter out empty categories, sort by count descending
        return results
            .filter(s => s && s.count > 0)
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Generate the full page HTML
     */
    generateHTML(mythology, sections) {
        const colors = mythology.colors || {};
        const primaryColor = colors.primary || '#667eea';
        const secondaryColor = colors.secondary || '#764ba2';
        const mythName = this.escapeHtml(mythology.name);
        const totalEntities = sections.reduce((sum, s) => sum + s.count, 0);

        return `
            <div class="mythology-overview" data-mythology="${mythology.id}">
                <!-- Hero Section -->
                <div class="mythology-hero" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};">
                    <div class="mythology-hero-background"></div>
                    <div class="mythology-hero-content">
                        <div class="mythology-icon-large">${mythology.icon || '📚'}</div>
                        <h1 class="mythology-title">${mythName}</h1>
                        ${mythology.subtitle ? `<p class="mythology-subtitle">${this.escapeHtml(mythology.subtitle)}</p>` : ''}
                        <div class="mythology-meta-info">
                            ${mythology.region ? `<div class="meta-item"><span class="meta-label">Region</span><span class="meta-value">${this.escapeHtml(mythology.region)}</span></div>` : ''}
                            ${mythology.period ? `<div class="meta-item"><span class="meta-label">Period</span><span class="meta-value">${this.escapeHtml(mythology.period)}</span></div>` : ''}
                            ${mythology.language ? `<div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">${this.escapeHtml(mythology.language)}</span></div>` : ''}
                            <div class="meta-item">
                                <span class="meta-label">Entries</span>
                                <span class="meta-value">${totalEntities.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Introduction -->
                ${this.renderIntroSection(mythology)}

                <!-- Table of Contents -->
                ${this.renderTableOfContents(sections, mythology)}

                <!-- Category Sections -->
                <div class="mythology-sections-container">
                    ${sections.length > 0
                        ? sections.map(section => this.renderCategorySection(mythology, section)).join('')
                        : `<div style="text-align: center; padding: 3rem 1.5rem; opacity: 0.7;">
                            <p style="font-size: 1.1rem; margin-bottom: 1rem;">No entities available for this mythology yet. Check back soon!</p>
                            <a href="#/" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px;">Browse All Mythologies</a>
                        </div>`
                    }
                </div>

                ${sections.length > 0 ? `
                <!-- Back to top -->
                <div class="mythology-back-to-top">
                    <button type="button" class="back-to-top-link mythology-back-to-top-btn">Back to top</button>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render the long-form introduction section
     */
    renderIntroSection(mythology) {
        // Try multiple fields for rich content
        const longText = mythology.fullDescription
            || mythology.overview
            || mythology.content
            || mythology.longDescription
            || mythology.description
            || '';

        if (!longText) return '';

        return `
            <div class="mythology-intro-section">
                <div class="mythology-intro-content">
                    ${this.renderLongText(longText)}
                </div>
            </div>
        `;
    }

    /**
     * Render text as multiple paragraphs, splitting on double newlines
     */
    renderLongText(text) {
        if (!text) return '';
        const escaped = this.escapeHtml(text);
        // Split on double newlines or single newlines for paragraph breaks
        const paragraphs = escaped.split(/\n\n+/).filter(p => p.trim());
        if (paragraphs.length <= 1) {
            // If no paragraph breaks, just wrap as a single block
            return `<p>${escaped}</p>`;
        }
        return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }

    /**
     * Render the table of contents as anchor links
     */
    renderTableOfContents(sections, mythology) {
        if (sections.length === 0) return '';

        const mythName = this.escapeHtml(mythology.name);

        return `
            <nav class="mythology-toc" aria-label="Page contents">
                <div class="mythology-toc-header">
                    <h2 class="mythology-toc-title">Contents</h2>
                    <span class="mythology-toc-subtitle">${sections.length} categories in ${mythName}</span>
                </div>
                <div class="mythology-toc-links">
                    ${sections.map(section => `
                        <a href="#section-${section.plural}" class="mythology-toc-link" data-scroll-target="section-${section.plural}">
                            <span class="toc-icon">${section.icon}</span>
                            <span class="toc-label">${section.label}</span>
                            <span class="toc-count">${section.count}</span>
                        </a>
                    `).join('')}
                </div>
            </nav>
        `;
    }

    /**
     * Render a single expanded category section with entity grid
     */
    renderCategorySection(mythology, section) {
        const mythName = this.escapeHtml(mythology.name);
        const mythId = mythology.id;
        const entitiesToShow = section.entities.slice(0, this.PREVIEW_LIMIT);
        const hasMore = section.entities.length > this.PREVIEW_LIMIT;
        const remaining = section.entities.length - this.PREVIEW_LIMIT;

        // Build an intro from the first few entities' context
        const intro = this.generateCategoryIntro(mythology, section);

        return `
            <section class="mythology-category-section" id="section-${section.plural}">
                <div class="category-section-header">
                    <h2 class="category-section-title">
                        <span class="category-section-icon">${section.icon}</span>
                        ${section.label}
                        <span class="category-section-count">${section.count}</span>
                    </h2>
                    <a href="#/mythology/${mythId}/${section.plural}" class="category-browse-link">Browse all</a>
                </div>

                ${intro ? `<p class="category-intro">${intro}</p>` : ''}

                <div class="category-entity-grid">
                    ${entitiesToShow.map(entity =>
                        this.renderEntityMiniCard(entity, mythId, section.collection)
                    ).join('')}
                </div>

                ${hasMore ? `
                    <div class="category-show-more">
                        <a href="#/mythology/${mythId}/${section.plural}" class="category-show-all-link">
                            View all ${section.count} ${section.plural} →
                        </a>
                    </div>
                ` : ''}
            </section>
        `;
    }

    /**
     * Generate an introductory sentence for a category section
     */
    generateCategoryIntro(mythology, section) {
        const mythName = this.escapeHtml(mythology.name);
        const count = section.count;
        const plural = section.plural;

        // Use category-specific intros
        const intros = {
            deities: `The ${mythName} pantheon encompasses ${count} divine figures, each embodying fundamental aspects of the natural and spiritual world.`,
            heroes: `${count} legendary heroes and figures define the heroic tradition of ${mythName} mythology, their stories exploring themes of courage, fate, and the human condition.`,
            creatures: `${mythName} mythology features ${count} mythical creatures and beings, from fearsome monsters to benevolent guardians of the sacred.`,
            cosmology: `The cosmological framework of ${mythName} mythology comprises ${count} entries describing the structure of the universe, creation narratives, and the nature of existence.`,
            places: `${count} sacred locations and mythical realms form the geography of ${mythName} mythology, from divine dwelling places to sites of legendary events.`,
            items: `${count} sacred artifacts, weapons, and objects of power feature in ${mythName} mythology, each carrying deep symbolic and narrative significance.`,
            texts: `${count} sacred texts and literary works preserve the wisdom and stories of ${mythName} mythology for posterity.`,
            rituals: `${count} rituals, ceremonies, and sacred practices connect practitioners to the divine traditions of ${mythName} mythology.`,
            symbols: `${count} sacred symbols and signs carry the visual language of ${mythName} mythology, encoding spiritual meaning in form and pattern.`,
            herbs: `${count} sacred plants and herbal preparations hold special significance within ${mythName} mythological and spiritual practice.`,
            magic: `${count} magical systems and supernatural arts form the esoteric dimension of ${mythName} mythology.`,
        };

        return intros[plural] || `Explore ${count} ${plural} from ${mythName} mythology.`;
    }

    /**
     * Render a compact entity card for the grid
     */
    renderEntityMiniCard(entity, mythologyId, collection) {
        const name = this.escapeHtml(entity.name || entity.title || 'Unnamed');
        const icon = entity.icon || '';
        const subtitle = entity.subtitle || entity.shortDescription || '';
        const domains = entity.domains || entity.domain || [];
        const entityId = entity.id;

        // Build subtitle text: prefer subtitle, then first 2 domains
        let subText = '';
        if (subtitle) {
            subText = this.escapeHtml(this.truncate(subtitle, 60));
        } else if (Array.isArray(domains) && domains.length > 0) {
            subText = domains.slice(0, 2).map(d => this.escapeHtml(d)).join(' · ');
        }

        // Normalize collection name for routing (e.g., archetypes->concepts in Firestore)
        const collectionRouteMap = {
            'archetypes': 'concepts',
            'cosmologies': 'cosmology'
        };
        const normalizedCollection = collectionRouteMap[collection] || collection;
        const href = `#/entity/${normalizedCollection}/${entityId}`;

        return `
            <a href="${href}" class="entity-mini-card" data-entity-id="${entityId}">
                ${icon ? `<span class="mini-card-icon">${this.escapeHtml(icon)}</span>` : ''}
                <span class="mini-card-body">
                    <span class="mini-card-name">${name}</span>
                    ${subText ? `<span class="mini-card-sub">${subText}</span>` : ''}
                </span>
            </a>
        `;
    }

    /**
     * Truncate text to a max length
     */
    truncate(text, maxLen) {
        if (!text || text.length <= maxLen) return text;
        return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
    }

    /**
     * Render not found state
     */
    renderNotFound(mythologyId) {
        return `
            <div class="error-container">
                <div class="error-icon">🔍</div>
                <h2>Mythology Not Found</h2>
                <p class="error-message">
                    The mythology "${this.escapeHtml(mythologyId)}" could not be found.
                </p>
                <div class="error-actions">
                    <a href="#/" class="btn-primary">Browse Mythologies</a>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners after DOM insertion (CSP-safe, replaces inline handlers)
     */
    attachEventListeners() {
        // Back to top button
        const backToTopBtn = document.querySelector('.mythology-back-to-top-btn');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // TOC smooth scroll links
        const tocLinks = document.querySelectorAll('.mythology-toc-link[data-scroll-target]');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.dataset.scrollTarget;
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Retry button in error state
        const retryBtn = document.querySelector('.mythology-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export
window.MythologyOverview = MythologyOverview;
