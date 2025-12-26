/**
 * Mythology Overview Component
 * Displays detailed view of a specific mythology
 *
 * Features:
 * - Hero section with mythology info
 * - Entity type cards (Deities, Heroes, Creatures, etc.)
 * - Statistics dashboard
 * - Navigation to entity type browsers
 */

class MythologyOverview {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
    }

    /**
     * Render the mythology overview
     * @param {object} route - Route object from router
     * @returns {string} HTML string
     */
    async render(route) {
        try {
            const { mythology } = route;

            // Load mythology data
            const mythologyData = await this.loadMythology(mythology);

            if (!mythologyData) {
                return this.renderNotFound(mythology);
            }

            // Load entity type counts
            const entityCounts = await this.loadEntityCounts(mythology);

            // Generate HTML
            return this.generateHTML(mythologyData, entityCounts);

        } catch (error) {
            console.error('[MythologyOverview] Render error:', error);
            throw error;
        }
    }

    /**
     * Load mythology data from Firebase
     */
    async loadMythology(mythologyId) {
        if (!this.db) {
            throw new Error('Firebase Firestore not initialized');
        }

        const doc = await this.db.collection('mythologies').doc(mythologyId).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    }

    /**
     * Load entity counts for all types
     */
    async loadEntityCounts(mythologyId) {
        const entityTypes = [
            { collection: 'deities', singular: 'deity', plural: 'deities', icon: '👑' },
            { collection: 'heroes', singular: 'hero', plural: 'heroes', icon: '🦸' },
            { collection: 'creatures', singular: 'creature', plural: 'creatures', icon: '🐉' },
            { collection: 'cosmology', singular: 'cosmology', plural: 'cosmology', icon: '🌌' },
            { collection: 'rituals', singular: 'ritual', plural: 'rituals', icon: '🕯️' },
            { collection: 'herbs', singular: 'herb', plural: 'herbs', icon: '🌿' },
            { collection: 'texts', singular: 'text', plural: 'texts', icon: '📜' },
            { collection: 'symbols', singular: 'symbol', plural: 'symbols', icon: '⚡' },
            { collection: 'items', singular: 'item', plural: 'items', icon: '⚔️' },
            { collection: 'places', singular: 'place', plural: 'places', icon: '🏛️' },
            { collection: 'magic', singular: 'magic', plural: 'magic', icon: '✨' }
        ];

        const counts = {};

        for (const type of entityTypes) {
            try {
                const snapshot = await this.db.collection(type.collection)
                    .where('mythology', '==', mythologyId)
                    .get();

                counts[type.collection] = {
                    count: snapshot.size,
                    ...type
                };
            } catch (error) {
                console.error(`[MythologyOverview] Error loading ${type.collection}:`, error);
                counts[type.collection] = {
                    count: 0,
                    ...type
                };
            }
        }

        return counts;
    }

    /**
     * Generate HTML for overview
     */
    generateHTML(mythology, entityCounts) {
        const colors = mythology.colors || {};
        const primaryColor = colors.primary || '#667eea';
        const secondaryColor = colors.secondary || '#764ba2';

        return `
            <div class="mythology-overview" data-mythology="${mythology.id}">
                <!-- Hero Section -->
                <div class="mythology-hero" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};">
                    <div class="mythology-hero-background"></div>
                    <div class="mythology-hero-content">
                        <div class="mythology-icon-large">${mythology.icon || '📚'}</div>
                        <h1 class="mythology-title">${this.escapeHtml(mythology.name)} Mythology</h1>
                        ${mythology.description ? `
                            <p class="mythology-description">${this.escapeHtml(mythology.description)}</p>
                        ` : ''}

                        <div class="mythology-meta-info">
                            ${mythology.region ? `
                                <div class="meta-item">
                                    <span class="meta-label">Region:</span>
                                    <span class="meta-value">${this.escapeHtml(mythology.region)}</span>
                                </div>
                            ` : ''}
                            ${mythology.period ? `
                                <div class="meta-item">
                                    <span class="meta-label">Period:</span>
                                    <span class="meta-value">${this.escapeHtml(mythology.period)}</span>
                                </div>
                            ` : ''}
                            ${mythology.language ? `
                                <div class="meta-item">
                                    <span class="meta-label">Language:</span>
                                    <span class="meta-value">${this.escapeHtml(mythology.language)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Stats Dashboard -->
                <div class="entity-stats-dashboard">
                    <h2 class="section-title">Content Statistics</h2>
                    <div class="stats-grid">
                        ${this.renderStatCards(entityCounts)}
                    </div>
                </div>

                <!-- Entity Type Grid -->
                <div class="entity-types-section">
                    <h2 class="section-title">Explore by Category</h2>
                    <div class="entity-types-grid">
                        ${this.renderEntityTypeCards(mythology.id, entityCounts)}
                    </div>
                </div>

                ${mythology.fullDescription ? `
                    <div class="mythology-details-section">
                        <h2 class="section-title">About ${this.escapeHtml(mythology.name)} Mythology</h2>
                        <div class="mythology-full-description">
                            ${this.escapeHtml(mythology.fullDescription)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render stat cards
     */
    renderStatCards(entityCounts) {
        const totalEntities = Object.values(entityCounts).reduce((sum, type) => sum + type.count, 0);

        const majorTypes = ['deities', 'heroes', 'creatures'];
        const majorCounts = majorTypes
            .map(type => entityCounts[type])
            .filter(type => type && type.count > 0);

        return `
            <div class="stat-card">
                <div class="stat-number">${totalEntities}</div>
                <div class="stat-label">Total Entities</div>
            </div>
            ${majorCounts.map(type => `
                <div class="stat-card">
                    <div class="stat-icon">${type.icon}</div>
                    <div class="stat-number">${type.count}</div>
                    <div class="stat-label">${this.capitalize(type.plural)}</div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Render entity type cards
     */
    renderEntityTypeCards(mythologyId, entityCounts) {
        // Sort by count (descending) and show only non-zero
        const sortedTypes = Object.values(entityCounts)
            .filter(type => type.count > 0)
            .sort((a, b) => b.count - a.count);

        if (sortedTypes.length === 0) {
            return `
                <div class="empty-state">
                    <p>No entities available for this mythology yet.</p>
                </div>
            `;
        }

        return sortedTypes.map(type => `
            <a href="#/mythology/${mythologyId}/${type.plural}" class="entity-type-card">
                <div class="entity-type-icon">${type.icon}</div>
                <div class="entity-type-name">${this.capitalize(type.plural)}</div>
                <div class="entity-type-count">${type.count} ${type.count === 1 ? type.singular : type.plural}</div>
                <div class="entity-type-arrow">→</div>
            </a>
        `).join('');
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
window.MythologyOverview = MythologyOverview;
