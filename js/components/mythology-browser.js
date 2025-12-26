/**
 * Mythology Browser Component
 * Displays grid of all mythologies on the home page
 *
 * Features:
 * - Loads mythologies from Firebase
 * - Displays as responsive grid
 * - Shows stats (deity count, hero count, etc.)
 * - Clicking navigates to mythology overview
 */

class MythologyBrowser {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Render the mythology browser
     * @param {object} route - Route object from router
     * @returns {string} HTML string
     */
    async render(route) {
        try {
            // Load mythologies
            const mythologies = await this.loadMythologies();

            if (!mythologies || mythologies.length === 0) {
                return this.renderEmpty();
            }

            // Generate HTML
            return this.generateHTML(mythologies);

        } catch (error) {
            console.error('[MythologyBrowser] Render error:', error);
            throw error;
        }
    }

    /**
     * Load mythologies from Firebase
     */
    async loadMythologies() {
        // Check cache
        if (this.cache && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.cacheTimeout)) {
            console.log('[MythologyBrowser] Using cached mythologies');
            return this.cache;
        }

        if (!this.db) {
            throw new Error('Firebase Firestore not initialized');
        }

        // Query mythologies collection
        const snapshot = await this.db.collection('mythologies')
            .orderBy('name', 'asc')
            .get();

        // Exclude special categories
        const excludedCategories = ['comparative', 'herbalism', 'themes', 'freemasons', 'tarot'];

        const mythologies = [];
        for (const doc of snapshot.docs) {
            if (!excludedCategories.includes(doc.id)) {
                const data = doc.data();

                // Get entity counts
                const stats = await this.getEntityCounts(doc.id);

                mythologies.push({
                    id: doc.id,
                    ...data,
                    stats
                });
            }
        }

        // Cache results
        this.cache = mythologies;
        this.cacheTimestamp = Date.now();

        return mythologies;
    }

    /**
     * Get entity counts for a mythology
     */
    async getEntityCounts(mythologyId) {
        try {
            const [deitiesSnap, heroesSnap, creaturesSnap] = await Promise.all([
                this.db.collection('deities').where('mythology', '==', mythologyId).get(),
                this.db.collection('heroes').where('mythology', '==', mythologyId).get(),
                this.db.collection('creatures').where('mythology', '==', mythologyId).get()
            ]);

            return {
                deities: deitiesSnap.size,
                heroes: heroesSnap.size,
                creatures: creaturesSnap.size,
                total: deitiesSnap.size + heroesSnap.size + creaturesSnap.size
            };
        } catch (error) {
            console.error(`[MythologyBrowser] Error getting counts for ${mythologyId}:`, error);
            return { deities: 0, heroes: 0, creatures: 0, total: 0 };
        }
    }

    /**
     * Generate HTML for mythology grid
     */
    generateHTML(mythologies) {
        const sortedMythologies = this.sortMythologies(mythologies);

        return `
            <div class="mythology-browser">
                <div class="browser-header">
                    <h1 class="browser-title">Explore World Mythologies</h1>
                    <p class="browser-description">
                        Journey through ${mythologies.length} mythological traditions spanning thousands of years
                    </p>
                </div>

                <div class="mythology-stats-bar">
                    <div class="stat-item">
                        <span class="stat-number">${mythologies.length}</span>
                        <span class="stat-label">Mythologies</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.getTotalEntities(mythologies)}</span>
                        <span class="stat-label">Total Entities</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.getTotalDeities(mythologies)}</span>
                        <span class="stat-label">Deities</span>
                    </div>
                </div>

                <div class="universal-grid mythology-grid">
                    ${sortedMythologies.map(mythology => this.renderMythologyCard(mythology)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual mythology card
     */
    renderMythologyCard(mythology) {
        const colors = mythology.colors || {};
        const primaryColor = colors.primary || '#667eea';
        const secondaryColor = colors.secondary || '#764ba2';

        return `
            <div class="universal-grid-card mythology-card"
                 data-mythology-id="${mythology.id}"
                 style="--entity-color: ${primaryColor}; --entity-secondary: ${secondaryColor}">

                <div class="grid-card-header">
                    <div class="grid-card-icon">${mythology.icon || '📚'}</div>
                </div>

                <div class="grid-card-body">
                    <h3 class="grid-card-title">
                        <a href="#/mythology/${mythology.id}">${this.escapeHtml(mythology.name)}</a>
                    </h3>

                    <div class="grid-card-meta">
                        ${mythology.region ? `<span class="mythology-badge">${this.escapeHtml(mythology.region)}</span>` : ''}
                        ${mythology.period ? `<span class="entity-type-badge">${this.escapeHtml(mythology.period)}</span>` : ''}
                    </div>

                    ${mythology.description ? `
                        <p class="grid-card-description">${this.escapeHtml(mythology.description)}</p>
                    ` : ''}

                    <div class="mythology-stats">
                        ${mythology.stats.deities > 0 ? `
                            <div class="stat-badge">
                                <span class="stat-icon">👑</span>
                                <span class="stat-value">${mythology.stats.deities}</span>
                                <span class="stat-name">Deities</span>
                            </div>
                        ` : ''}
                        ${mythology.stats.heroes > 0 ? `
                            <div class="stat-badge">
                                <span class="stat-icon">🦸</span>
                                <span class="stat-value">${mythology.stats.heroes}</span>
                                <span class="stat-name">Heroes</span>
                            </div>
                        ` : ''}
                        ${mythology.stats.creatures > 0 ? `
                            <div class="stat-badge">
                                <span class="stat-icon">🐉</span>
                                <span class="stat-value">${mythology.stats.creatures}</span>
                                <span class="stat-name">Creatures</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="grid-card-footer">
                    <a href="#/mythology/${mythology.id}" class="btn-view-details">
                        Explore ${this.escapeHtml(mythology.name)}
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        return `
            <div class="empty-container">
                <div class="empty-icon">📚</div>
                <h2>No Mythologies Available</h2>
                <p class="empty-message">
                    Mythology data is being loaded. Please check back soon.
                </p>
                <button class="btn-primary" onclick="window.location.reload()">
                    Refresh
                </button>
            </div>
        `;
    }

    /**
     * Sort mythologies by name
     */
    sortMythologies(mythologies) {
        return [...mythologies].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get total entity count
     */
    getTotalEntities(mythologies) {
        return mythologies.reduce((sum, m) => sum + (m.stats?.total || 0), 0);
    }

    /**
     * Get total deity count
     */
    getTotalDeities(mythologies) {
        return mythologies.reduce((sum, m) => sum + (m.stats?.deities || 0), 0);
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
     * Clear cache
     */
    clearCache() {
        this.cache = null;
        this.cacheTimestamp = null;
    }
}

// Export
window.MythologyBrowser = MythologyBrowser;
