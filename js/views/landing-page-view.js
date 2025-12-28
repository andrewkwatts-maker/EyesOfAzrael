/**
 * Landing Page View
 * Displays asset type categories (mythologies, items, archetypes, places, magic, etc.)
 * in a clean grid layout
 */

class LandingPageView {
    constructor(firestore) {
        this.db = firestore;
        this.assetTypes = this.getAssetTypes();
    }

    /**
 * Define all asset type categories for the landing page
     */
    getAssetTypes() {
        return [
            {
                id: 'mythologies',
                name: 'World Mythologies',
                icon: '🏛️',
                description: 'Explore gods, heroes, and legends from cultures around the world',
                route: '#/mythologies',
                color: '#8b7fff',
                order: 1
            },
            {
                id: 'deities',
                name: 'Deities & Gods',
                icon: '⚡',
                description: 'Divine beings and pantheons across traditions',
                route: '#/browse/deities',
                color: '#ffd93d',
                order: 2
            },
            {
                id: 'heroes',
                name: 'Heroes & Legends',
                icon: '🗡️',
                description: 'Epic heroes and legendary figures',
                route: '#/browse/heroes',
                color: '#4a9eff',
                order: 3
            },
            {
                id: 'creatures',
                name: 'Mythical Creatures',
                icon: '🐉',
                description: 'Dragons, monsters, and fantastic beasts',
                route: '#/browse/creatures',
                color: '#ff7eb6',
                order: 4
            },
            {
                id: 'items',
                name: 'Sacred Items',
                icon: '💎',
                description: 'Legendary artifacts and magical objects',
                route: '#/browse/items',
                color: '#51cf66',
                order: 5
            },
            {
                id: 'places',
                name: 'Sacred Places',
                icon: '🏔️',
                description: 'Holy sites, temples, and mystical locations',
                route: '#/browse/places',
                color: '#7fd9d3',
                order: 6
            },
            {
                id: 'archetypes',
                name: 'Archetypes',
                icon: '🎭',
                description: 'Universal patterns in mythology and storytelling',
                route: '#/archetypes',
                color: '#b965e6',
                order: 7
            },
            {
                id: 'magic',
                name: 'Magic Systems',
                icon: '✨',
                description: 'Mystical practices and esoteric traditions',
                route: '#/magic',
                color: '#f85a8f',
                order: 8
            },
            {
                id: 'herbs',
                name: 'Sacred Herbalism',
                icon: '🌿',
                description: 'Plants, preparations, and traditional medicine',
                route: '#/browse/herbs',
                color: '#7fb0f9',
                order: 9
            },
            {
                id: 'rituals',
                name: 'Rituals & Practices',
                icon: '🕯️',
                description: 'Ceremonies, festivals, and sacred rites',
                route: '#/browse/rituals',
                color: '#fb9f7f',
                order: 10
            },
            {
                id: 'texts',
                name: 'Sacred Texts',
                icon: '📜',
                description: 'Holy scriptures and ancient writings',
                route: '#/browse/texts',
                color: '#a8edea',
                order: 11
            },
            {
                id: 'symbols',
                name: 'Sacred Symbols',
                icon: '☯️',
                description: 'Religious icons and mystical symbols',
                route: '#/browse/symbols',
                color: '#fed6e3',
                order: 12
            }
        ];
    }

    /**
     * Render the landing page
     */
    async render(container) {
        console.log('[Landing Page] Rendering...');

        container.innerHTML = this.getLandingHTML();
        this.attachEventListeners();

        // Dispatch event to hide loading spinner
        window.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: { view: 'landing', timestamp: Date.now() }
        }));
    }

    /**
     * Get landing page HTML
     */
    getLandingHTML() {
        return `
            <div class="landing-page-view">
                <!-- Hero Section -->
                <section class="hero-section">
                    <div class="hero-content">
                        <h1 class="hero-title">
                            <span class="hero-icon">👁️</span>
                            Eyes of Azrael
                        </h1>
                        <p class="hero-subtitle">
                            Explore the myths, legends, and sacred traditions of humanity
                        </p>
                        <p class="hero-description">
                            Journey through 6000+ years of mythology, from ancient Sumer to modern traditions.
                            Discover deities, heroes, creatures, sacred texts, and mystical practices from cultures across the globe.
                        </p>
                        <div class="hero-actions">
                            <a href="#/mythologies" class="btn-primary">
                                🏛️ Explore Mythologies
                            </a>
                            <a href="#/search" class="btn-secondary">
                                🔍 Browse All Content
                            </a>
                        </div>
                    </div>
                </section>

                <!-- Asset Type Grid -->
                <section class="asset-types-section">
                    <h2 class="section-title">
                        🗂️ World Mythologies
                    </h2>
                    <p class="section-subtitle">
                        Explore gods, heroes, and legends from cultures around the world
                    </p>
                    <div class="asset-type-grid">
                        ${this.assetTypes.map(type => this.getAssetTypeCardHTML(type)).join('')}
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features-section">
                    <h2 class="section-title">Database Features</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📚</div>
                            <h3>Comprehensive Database</h3>
                            <p>Thousands of entities across 22+ mythological traditions</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔗</div>
                            <h3>Cross-Cultural Links</h3>
                            <p>Discover connections between different traditions</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔍</div>
                            <h3>Advanced Search</h3>
                            <p>Find entities by name, type, mythology, or attributes</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">⚖️</div>
                            <h3>Compare Traditions</h3>
                            <p>Side-by-side comparison of entities and concepts</p>
                        </div>
                    </div>
                </section>
            </div>

            <style>
                .landing-page-view {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem 4rem;
                }

                .hero-section {
                    text-align: center;
                    padding: 4rem 2rem;
                    margin-bottom: 3rem;
                }

                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero-icon {
                    font-size: 4rem;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                .hero-subtitle {
                    font-size: 1.5rem;
                    color: var(--color-text-primary);
                    margin-bottom: 1rem;
                }

                .hero-description {
                    font-size: 1.1rem;
                    color: var(--color-text-secondary);
                    max-width: 800px;
                    margin: 0 auto 2rem;
                    line-height: 1.8;
                }

                .hero-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .asset-types-section {
                    margin-bottom: 4rem;
                }

                .section-title {
                    font-size: 2rem;
                    text-align: center;
                    margin-bottom: 0.5rem;
                    color: var(--color-text-primary);
                }

                .section-subtitle {
                    text-align: center;
                    color: var(--color-text-secondary);
                    margin-bottom: 2rem;
                    font-size: 1.1rem;
                }

                .asset-type-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }

                .asset-type-card {
                    background: rgba(var(--color-bg-card-rgb), 0.6);
                    border: 1px solid rgba(var(--color-border-primary-rgb), 0.3);
                    border-radius: 16px;
                    padding: 2rem;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .asset-type-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--card-color);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }

                .asset-type-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--card-color);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .asset-type-card:hover::before {
                    transform: scaleX(1);
                }

                .asset-type-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    display: block;
                }

                .asset-type-name {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--color-text-primary);
                }

                .asset-type-description {
                    font-size: 0.95rem;
                    color: var(--color-text-secondary);
                    line-height: 1.6;
                }

                .features-section {
                    margin-top: 4rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }

                .feature-card {
                    text-align: center;
                    padding: 2rem;
                }

                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .feature-card h3 {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                    color: var(--color-text-primary);
                }

                .feature-card p {
                    color: var(--color-text-secondary);
                    font-size: 0.95rem;
                }

                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 2.5rem;
                    }

                    .asset-type-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 1rem;
                    }
                }
            </style>
        `;
    }

    /**
     * Get asset type card HTML
     */
    getAssetTypeCardHTML(type) {
        return `
            <a href="${type.route}"
               class="asset-type-card"
               data-type="${type.id}"
               style="--card-color: ${type.color}">
                <span class="asset-type-icon">${type.icon}</span>
                <h3 class="asset-type-name">${type.name}</h3>
                <p class="asset-type-description">${type.description}</p>
            </a>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const cards = document.querySelectorAll('.asset-type-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.dataset.type;
                console.log('[Landing Page] Navigating to:', type);
                // SPA navigation will handle the route
            });
        });
    }
}

// ES Module Export
export { LandingPageView };

// Legacy global export
if (typeof window !== 'undefined') {
    window.LandingPageView = LandingPageView;
}
