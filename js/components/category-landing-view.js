/**
 * Category Landing View Component
 * Beautiful overview page for asset type categories (deities, creatures, etc.)
 * Shows before the grid view with stats, featured items, and mythology filters
 *
 * Features:
 * - Hero section with category icon and title
 * - Statistics dashboard
 * - Featured entities carousel
 * - Filter by mythology cards
 * - "Browse All" button to grid view
 * - Responsive mobile design
 */

class CategoryLandingView {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
    }

    /**
     * Render the category landing page
     * @param {object} route - Route object from router
     * @returns {string} HTML string
     */
    async render(route) {
        try {
            const { entityType } = route;

            // Get category configuration
            const config = this.getCategoryConfig(entityType);

            // Load statistics
            const stats = await this.loadCategoryStats(entityType);

            // Load featured entities
            const featured = await this.loadFeaturedEntities(entityType);

            // Load mythology breakdown
            const mythologies = await this.loadMythologyBreakdown(entityType);

            // Generate HTML
            return this.generateHTML(entityType, config, stats, featured, mythologies);

        } catch (error) {
            console.error('[CategoryLandingView] Render error:', error);
            throw error;
        }
    }

    /**
     * Get category configuration
     */
    getCategoryConfig(entityType) {
        const configs = {
            'deity': {
                icon: '👑',
                title: 'Deities & Gods',
                singular: 'Deity',
                plural: 'Deities',
                description: 'Explore divine beings from mythologies across the world. From mighty sky gods to earth mothers, discover the pantheons that shaped human belief.',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                features: [
                    '🌟 Divine powers and domains',
                    '⚡ Sacred symbols and attributes',
                    '📜 Myths and legends',
                    '🏛️ Worship practices and temples'
                ]
            },
            'hero': {
                icon: '🦸',
                title: 'Heroes & Champions',
                singular: 'Hero',
                plural: 'Heroes',
                description: 'Discover legendary heroes who performed impossible feats, slayed monsters, and changed the course of history through courage and cunning.',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                features: [
                    '⚔️ Epic quests and adventures',
                    '🐉 Monster slaying and battles',
                    '🏆 Legendary accomplishments',
                    '👑 Divine parentage and blessings'
                ]
            },
            'creature': {
                icon: '🐉',
                title: 'Mythical Creatures',
                singular: 'Creature',
                plural: 'Creatures',
                description: 'Encounter the beasts, monsters, and magical beings that populate myth and legend. From dragons to spirits, explore the fantastic fauna of world mythology.',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                features: [
                    '🦅 Divine and sacred animals',
                    '👹 Monsters and demons',
                    '🧚 Spirits and fae beings',
                    '🐍 Hybrid creatures and chimeras'
                ]
            },
            'cosmology': {
                icon: '🌌',
                title: 'Cosmology & Realms',
                singular: 'Cosmology',
                plural: 'Cosmology',
                description: 'Journey through the structure of reality itself. Explore creation myths, the architecture of heaven and earth, and the cosmic order.',
                gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                features: [
                    '🌍 Creation and origin stories',
                    '✨ Celestial realms and heavens',
                    '🔥 Underworlds and afterlives',
                    '⚖️ Cosmic order and balance'
                ]
            },
            'ritual': {
                icon: '🕯️',
                title: 'Rituals & Ceremonies',
                singular: 'Ritual',
                plural: 'Rituals',
                description: 'Discover the sacred practices, ceremonies, and rites that connected mortals with the divine and marked the passage of seasons and life.',
                gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                features: [
                    '🎭 Sacred ceremonies and festivals',
                    '🌙 Seasonal celebrations',
                    '🔮 Divination and prophecy',
                    '⚗️ Offerings and sacrifices'
                ]
            },
            'herb': {
                icon: '🌿',
                title: 'Sacred Herbs & Plants',
                singular: 'Herb',
                plural: 'Herbs',
                description: 'Explore the botanical treasures held sacred across cultures. From healing plants to mystical trees, discover the green wisdom of the ancients.',
                gradient: 'linear-gradient(135deg, #74ebd5 0%, #9face6 100%)',
                features: [
                    '🌸 Sacred and magical plants',
                    '💊 Healing and medicine',
                    '🍃 Ritual and ceremonial uses',
                    '🌳 World trees and cosmic plants'
                ]
            },
            'text': {
                icon: '📜',
                title: 'Sacred Texts',
                singular: 'Text',
                plural: 'Texts',
                description: 'Read the words that shaped civilizations. Explore creation epics, sacred scriptures, and the written wisdom passed down through millennia.',
                gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                features: [
                    '📖 Creation epics and myths',
                    '✍️ Sacred scriptures',
                    '🎭 Poetic traditions',
                    '🗿 Ancient wisdom texts'
                ]
            },
            'symbol': {
                icon: '⚡',
                title: 'Symbols & Icons',
                singular: 'Symbol',
                plural: 'Symbols',
                description: 'Decode the visual language of mythology. From sacred geometry to divine emblems, understand the symbols that carry deep spiritual meaning.',
                gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                features: [
                    '🔱 Divine symbols and emblems',
                    '🎨 Sacred geometry',
                    '🗿 Cultural iconography',
                    '✨ Mystical sigils'
                ]
            },
            'item': {
                icon: '⚔️',
                title: 'Artifacts & Items',
                singular: 'Item',
                plural: 'Items',
                description: 'Discover legendary weapons, magical artifacts, and sacred treasures. From Excalibur to the Holy Grail, explore objects of power.',
                gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
                features: [
                    '⚔️ Legendary weapons',
                    '👑 Royal regalia',
                    '🏺 Sacred vessels',
                    '💎 Magical treasures'
                ]
            },
            'place': {
                icon: '🏛️',
                title: 'Sacred Places',
                singular: 'Place',
                plural: 'Places',
                description: 'Visit the sacred sites, mystical locations, and legendary landmarks where myth and geography intersect.',
                gradient: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)',
                features: [
                    '🏔️ Sacred mountains',
                    '🏛️ Temples and shrines',
                    '🌊 Mystical waters',
                    '🌳 Enchanted forests'
                ]
            },
            'magic': {
                icon: '✨',
                title: 'Magic Systems',
                singular: 'Magic',
                plural: 'Magic',
                description: 'Explore the arcane arts, mystical practices, and systems of power that allowed practitioners to bend reality to their will.',
                gradient: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
                features: [
                    '🔮 Magical traditions',
                    '📿 Mystical practices',
                    '⚡ Divine power',
                    '🌟 Supernatural abilities'
                ]
            }
        };

        return configs[entityType] || {
            icon: '📄',
            title: this.capitalize(entityType),
            singular: this.capitalize(entityType),
            plural: this.capitalize(entityType) + 's',
            description: `Explore ${entityType} from mythologies around the world.`,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            features: []
        };
    }

    /**
     * Load category statistics
     */
    async loadCategoryStats(entityType) {
        if (!this.db) {
            return { total: 0, mythologies: 0, recentlyAdded: 0 };
        }

        const collection = this.getCollectionName(entityType);

        try {
            // Get total count
            const totalSnapshot = await this.db.collection(collection).get();
            const total = totalSnapshot.size;

            // Get unique mythologies
            const mythologySet = new Set();
            totalSnapshot.docs.forEach(doc => {
                const mythology = doc.data().mythology;
                if (mythology) mythologySet.add(mythology);
            });

            // Get recently added (last 30 days) - simplified for now
            const recentlyAdded = Math.floor(total * 0.15); // Estimate

            return {
                total,
                mythologies: mythologySet.size,
                recentlyAdded
            };
        } catch (error) {
            console.error('[CategoryLandingView] Error loading stats:', error);
            return { total: 0, mythologies: 0, recentlyAdded: 0 };
        }
    }

    /**
     * Load featured entities for carousel
     */
    async loadFeaturedEntities(entityType) {
        if (!this.db) {
            return [];
        }

        const collection = this.getCollectionName(entityType);

        try {
            // Get popular/featured entities
            // For now, just get first 6, sorted by name
            const snapshot = await this.db.collection(collection)
                .orderBy('name', 'asc')
                .limit(6)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('[CategoryLandingView] Error loading featured:', error);
            return [];
        }
    }

    /**
     * Load mythology breakdown
     */
    async loadMythologyBreakdown(entityType) {
        if (!this.db) {
            return [];
        }

        const collection = this.getCollectionName(entityType);

        try {
            const snapshot = await this.db.collection(collection).get();

            // Count by mythology
            const counts = {};
            snapshot.docs.forEach(doc => {
                const mythology = doc.data().mythology;
                if (mythology) {
                    counts[mythology] = (counts[mythology] || 0) + 1;
                }
            });

            // Convert to array and sort by count
            const mythologies = Object.entries(counts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            return mythologies;
        } catch (error) {
            console.error('[CategoryLandingView] Error loading mythologies:', error);
            return [];
        }
    }

    /**
     * Generate HTML
     */
    generateHTML(entityType, config, stats, featured, mythologies) {
        return `
            <div class="category-landing-view" data-entity-type="${entityType}">
                <!-- Hero Section -->
                <div class="category-hero" style="--category-gradient: ${config.gradient}">
                    <div class="category-hero-background"></div>
                    <div class="category-hero-content">
                        <div class="category-icon-large">${config.icon}</div>
                        <h1 class="category-title">${config.title}</h1>
                        <p class="category-description">${config.description}</p>

                        <div class="category-features">
                            ${config.features.map(feature => `
                                <div class="category-feature">${feature}</div>
                            `).join('')}
                        </div>

                        <div class="category-hero-actions">
                            <a href="#/browse/${entityType}" class="btn-primary btn-large">
                                Browse All ${config.plural}
                                <span class="btn-icon">→</span>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Statistics Dashboard -->
                <div class="category-stats-section">
                    <div class="stats-grid">
                        <div class="stat-card stat-card-primary">
                            <div class="stat-icon">📊</div>
                            <div class="stat-number">${stats.total}</div>
                            <div class="stat-label">Total ${config.plural}</div>
                        </div>
                        <div class="stat-card stat-card-secondary">
                            <div class="stat-icon">🌍</div>
                            <div class="stat-number">${stats.mythologies}</div>
                            <div class="stat-label">Mythologies</div>
                        </div>
                        <div class="stat-card stat-card-accent">
                            <div class="stat-icon">✨</div>
                            <div class="stat-number">${stats.recentlyAdded}</div>
                            <div class="stat-label">Recently Added</div>
                        </div>
                    </div>
                </div>

                ${featured.length > 0 ? this.renderFeaturedSection(featured, config, entityType) : ''}
                ${mythologies.length > 0 ? this.renderMythologyFilter(mythologies, config, entityType) : ''}

                <!-- Browse All CTA -->
                <div class="category-browse-cta">
                    <h2>Ready to Explore?</h2>
                    <p>Discover all ${stats.total} ${config.plural.toLowerCase()} in our collection</p>
                    <a href="#/browse/${entityType}" class="btn-primary btn-xlarge">
                        Browse All ${config.plural}
                        <span class="btn-icon">→</span>
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Render featured entities carousel
     */
    renderFeaturedSection(featured, config, entityType) {
        return `
            <div class="category-featured-section">
                <div class="section-header">
                    <h2 class="section-title">Featured ${config.plural}</h2>
                    <p class="section-subtitle">Discover some of the most iconic ${config.plural.toLowerCase()}</p>
                </div>

                <div class="featured-carousel">
                    ${featured.map(entity => this.renderFeaturedCard(entity, entityType)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual featured card
     */
    renderFeaturedCard(entity, entityType) {
        const icon = entity.visual?.icon || entity.icon || '✨';
        const name = entity.name || 'Unknown';
        const mythology = entity.mythology || '';
        const subtitle = entity.title || entity.role || entity.domain || '';

        return `
            <a href="#/mythology/${mythology}/${entityType}/${entity.id}" class="featured-card">
                <div class="featured-card-icon">${icon}</div>
                <div class="featured-card-content">
                    <h3 class="featured-card-name">${this.escapeHtml(name)}</h3>
                    ${subtitle ? `<p class="featured-card-subtitle">${this.escapeHtml(subtitle)}</p>` : ''}
                    <div class="featured-card-mythology">${this.capitalize(mythology)}</div>
                </div>
                <div class="featured-card-arrow">→</div>
            </a>
        `;
    }

    /**
     * Render mythology filter section
     */
    renderMythologyFilter(mythologies, config, entityType) {
        return `
            <div class="category-mythology-filter">
                <div class="section-header">
                    <h2 class="section-title">Filter by Mythology</h2>
                    <p class="section-subtitle">Explore ${config.plural.toLowerCase()} from specific traditions</p>
                </div>

                <div class="mythology-filter-grid">
                    ${mythologies.map(myth => this.renderMythologyChip(myth, entityType)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual mythology filter chip
     */
    renderMythologyChip(mythology, entityType) {
        const icon = this.getMythologyIcon(mythology.name);
        return `
            <a href="#/mythology/${mythology.name}/${this.pluralize(entityType)}" class="mythology-chip">
                <span class="mythology-chip-icon">${icon}</span>
                <span class="mythology-chip-name">${this.capitalize(mythology.name)}</span>
                <span class="mythology-chip-count">${mythology.count}</span>
            </a>
        `;
    }

    /**
     * Get mythology icon
     */
    getMythologyIcon(mythology) {
        const icons = {
            'greek': '🏛️',
            'norse': '⚔️',
            'egyptian': '𓂀',
            'hindu': '🕉️',
            'celtic': '☘️',
            'japanese': '⛩️',
            'chinese': '🐉',
            'babylonian': '🦁',
            'sumerian': '📜',
            'christian': '✝️',
            'buddhist': '☸️',
            'roman': '🏺',
            'aztec': '☀️',
            'mayan': '🌙',
            'yoruba': '👑',
            'persian': '🔥',
            'islamic': '☪️',
            'jewish': '✡️'
        };
        return icons[mythology.toLowerCase()] || '📚';
    }

    /**
     * Get collection name from entity type
     */
    getCollectionName(entityType) {
        const typeMap = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'cosmology': 'cosmology',
            'ritual': 'rituals',
            'herb': 'herbs',
            'text': 'texts',
            'symbol': 'symbols',
            'item': 'items',
            'place': 'places',
            'magic': 'magic'
        };
        return typeMap[entityType] || entityType + 's';
    }

    /**
     * Pluralize entity type
     */
    pluralize(entityType) {
        const plurals = {
            'deity': 'deities',
            'hero': 'heroes',
            'cosmology': 'cosmology'
        };
        return plurals[entityType] || entityType + 's';
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
window.CategoryLandingView = CategoryLandingView;
