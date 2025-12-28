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
 * Now using SVG icons instead of emoji for better visual quality
     */
    getAssetTypes() {
        return [
            {
                id: 'mythologies',
                name: 'World Mythologies',
                icon: 'icons/categories/mythologies.svg',
                description: 'Explore gods, heroes, and legends from cultures around the world',
                route: '#/mythologies',
                color: '#8b7fff',
                order: 1
            },
            {
                id: 'deities',
                name: 'Deities & Gods',
                icon: 'icons/categories/deities.svg',
                description: 'Divine beings and pantheons across traditions',
                route: '#/browse/deities',
                color: '#ffd93d',
                order: 2
            },
            {
                id: 'heroes',
                name: 'Heroes & Legends',
                icon: 'icons/categories/heroes.svg',
                description: 'Epic heroes and legendary figures',
                route: '#/browse/heroes',
                color: '#4a9eff',
                order: 3
            },
            {
                id: 'creatures',
                name: 'Mythical Creatures',
                icon: 'icons/categories/creatures.svg',
                description: 'Dragons, monsters, and fantastic beasts',
                route: '#/browse/creatures',
                color: '#ff7eb6',
                order: 4
            },
            {
                id: 'items',
                name: 'Sacred Items',
                icon: 'icons/categories/items.svg',
                description: 'Legendary artifacts and magical objects',
                route: '#/browse/items',
                color: '#51cf66',
                order: 5
            },
            {
                id: 'places',
                name: 'Sacred Places',
                icon: 'icons/categories/places.svg',
                description: 'Holy sites, temples, and mystical locations',
                route: '#/browse/places',
                color: '#7fd9d3',
                order: 6
            },
            {
                id: 'archetypes',
                name: 'Archetypes',
                icon: 'icons/categories/archetypes.svg',
                description: 'Universal patterns in mythology and storytelling',
                route: '#/archetypes',
                color: '#b965e6',
                order: 7
            },
            {
                id: 'magic',
                name: 'Magic Systems',
                icon: 'icons/categories/magic.svg',
                description: 'Mystical practices and esoteric traditions',
                route: '#/magic',
                color: '#f85a8f',
                order: 8
            },
            {
                id: 'herbs',
                name: 'Sacred Herbalism',
                icon: 'icons/categories/herbs.svg',
                description: 'Plants, preparations, and traditional medicine',
                route: '#/browse/herbs',
                color: '#7fb0f9',
                order: 9
            },
            {
                id: 'rituals',
                name: 'Rituals & Practices',
                icon: 'icons/categories/rituals.svg',
                description: 'Ceremonies, festivals, and sacred rites',
                route: '#/browse/rituals',
                color: '#fb9f7f',
                order: 10
            },
            {
                id: 'texts',
                name: 'Sacred Texts',
                icon: 'icons/categories/texts.svg',
                description: 'Holy scriptures and ancient writings',
                route: '#/browse/texts',
                color: '#a8edea',
                order: 11
            },
            {
                id: 'symbols',
                name: 'Sacred Symbols',
                icon: 'icons/categories/symbols.svg',
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
                <section class="landing-hero-section">
                    <div class="hero-icon-display">👁️</div>
                    <h1 class="landing-hero-title">Eyes of Azrael</h1>
                    <p class="landing-hero-subtitle">
                        Explore the myths, legends, and sacred traditions of humanity
                    </p>
                    <p class="landing-hero-description">
                        Journey through 6000+ years of mythology, from ancient Sumer to modern traditions.
                        Discover deities, heroes, creatures, sacred texts, and mystical practices from cultures across the globe.
                    </p>
                    <div class="landing-hero-actions">
                        <a href="#/mythologies" class="landing-btn landing-btn-primary">
                            🏛️ Explore Mythologies
                        </a>
                        <a href="#/search" class="landing-btn landing-btn-secondary">
                            🔍 Browse All Content
                        </a>
                    </div>
                </section>

                <!-- Asset Type Grid -->
                <section class="landing-categories-section">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">🗂️</span>
                        Explore by Category
                    </h2>
                    <p class="landing-section-subtitle">
                        Browse our comprehensive collection of mythological content
                    </p>
                    <div class="landing-category-grid">
                        ${this.assetTypes.map(type => this.getAssetTypeCardHTML(type)).join('')}
                    </div>
                </section>

                <!-- Features Section -->
                <section class="landing-features-section">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">✨</span>
                        Database Features
                    </h2>
                    <div class="landing-features-grid">
                        <div class="landing-feature-card">
                            <div class="landing-feature-icon">📚</div>
                            <h3>Comprehensive Database</h3>
                            <p>Thousands of entities across 22+ mythological traditions</p>
                        </div>
                        <div class="landing-feature-card">
                            <div class="landing-feature-icon">🔗</div>
                            <h3>Cross-Cultural Links</h3>
                            <p>Discover connections between different traditions</p>
                        </div>
                        <div class="landing-feature-card">
                            <div class="landing-feature-icon">🔍</div>
                            <h3>Advanced Search</h3>
                            <p>Find entities by name, type, mythology, or attributes</p>
                        </div>
                        <div class="landing-feature-card">
                            <div class="landing-feature-icon">⚖️</div>
                            <h3>Compare Traditions</h3>
                            <p>Side-by-side comparison of entities and concepts</p>
                        </div>
                    </div>
                </section>
            </div>

            <style>
                /* ===== LANDING PAGE STYLES ===== */
                /* Using modern design matching historic HTML files (zeus.html) */

                .landing-page-view {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 var(--spacing-md, 1rem) var(--spacing-4xl, 4rem);
                }

                /* === Hero Section === */
                .landing-hero-section {
                    background: linear-gradient(135deg,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.2),
                        rgba(var(--color-secondary-rgb, 255, 126, 182), 0.2));
                    border: 2px solid var(--color-primary, #8b7fff);
                    border-radius: var(--radius-2xl, 1.5rem);
                    padding: var(--spacing-4xl, 4rem) var(--spacing-xl, 2rem);
                    text-align: center;
                    margin-bottom: var(--spacing-4xl, 4rem);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .hero-icon-display {
                    font-size: 4.5rem;
                    margin-bottom: var(--spacing-md, 1rem);
                    filter: drop-shadow(0 4px 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.5));
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                .landing-hero-title {
                    font-family: var(--font-heading, Georgia, serif);
                    font-size: clamp(2.5rem, 5vw, 3.5rem);
                    font-weight: 700;
                    margin-bottom: var(--spacing-md, 1rem);
                    background: linear-gradient(135deg, var(--color-primary, #8b7fff) 0%, var(--color-secondary, #fbbf24) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 10px rgba(var(--color-primary-rgb, 139, 127, 255), 0.5),
                                 0 0 20px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3),
                                 0 2px 4px rgba(0, 0, 0, 0.5);
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                }

                .landing-hero-subtitle {
                    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
                    color: var(--color-text-primary, #e5e7eb);
                    margin-bottom: var(--spacing-lg, 1.5rem);
                    font-weight: 500;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }

                .landing-hero-description {
                    font-size: clamp(1rem, 1.5vw, 1.125rem);
                    color: var(--color-text-secondary, #9ca3af);
                    max-width: 800px;
                    margin: 0 auto var(--spacing-xl, 2rem);
                    line-height: var(--leading-relaxed, 1.75);
                }

                .landing-hero-actions {
                    display: flex;
                    gap: var(--spacing-md, 1rem);
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: var(--spacing-xl, 2rem);
                }

                .landing-btn {
                    font-family: var(--font-primary, sans-serif);
                    font-weight: var(--font-semibold, 600);
                    padding: var(--spacing-md, 1rem) var(--spacing-xl, 2rem);
                    border-radius: var(--radius-lg, 0.75rem);
                    border: none;
                    cursor: pointer;
                    transition: all var(--transition-base, 0.3s ease);
                    font-size: var(--font-size-base, 1rem);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    min-height: 44px;
                    min-width: 44px;
                }

                .landing-btn-primary {
                    background: linear-gradient(135deg, var(--color-primary, #8b7fff), var(--color-secondary, #fbbf24));
                    color: white;
                    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                }

                .landing-btn-primary:hover {
                    box-shadow: 0 8px 24px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4),
                                0 0 20px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    transform: translateY(-2px);
                }

                .landing-btn-secondary {
                    background: transparent;
                    border: 2px solid var(--color-primary, #8b7fff);
                    color: var(--color-primary, #8b7fff);
                }

                .landing-btn-secondary:hover {
                    background: var(--color-primary, #8b7fff);
                    color: white;
                    box-shadow: 0 8px 24px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    transform: translateY(-2px);
                }

                /* === Categories Section === */
                .landing-categories-section {
                    margin-bottom: var(--spacing-5xl, 5rem);
                }

                .landing-section-header {
                    font-size: clamp(1.75rem, 3vw, 2.25rem);
                    text-align: center;
                    margin-bottom: var(--spacing-md, 1rem);
                    color: var(--color-primary, #8b7fff);
                    font-weight: var(--font-semibold, 600);
                    text-shadow: 0 0 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-md, 1rem);
                    flex-wrap: wrap;
                }

                .landing-section-icon {
                    font-size: 1.5em;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                }

                .landing-section-subtitle {
                    text-align: center;
                    color: var(--color-text-secondary, #9ca3af);
                    margin-bottom: var(--spacing-xl, 2rem);
                    font-size: clamp(1rem, 1.5vw, 1.125rem);
                }

                .landing-category-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: var(--spacing-lg, 1.5rem);
                }

                .landing-category-card {
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.5);
                    border-radius: var(--radius-xl, 1rem);
                    padding: var(--spacing-xl, 2rem);
                    text-decoration: none;
                    color: inherit;
                    transition: all var(--transition-base, 0.3s ease);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    min-height: 180px;
                    display: flex;
                    flex-direction: column;
                }

                .landing-category-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--card-color);
                    transform: scaleX(0);
                    transition: transform var(--transition-base, 0.3s ease);
                }

                .landing-category-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--card-color);
                    box-shadow: 0 12px 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.8);
                }

                .landing-category-card:hover::before {
                    transform: scaleX(1);
                }

                .landing-category-icon {
                    width: clamp(2rem, 3vw, 2.5rem);
                    height: clamp(2rem, 3vw, 2.5rem);
                    margin-bottom: var(--spacing-md, 1rem);
                    display: block;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                    transition: transform var(--transition-base, 0.3s ease);
                    color: var(--card-color);
                    opacity: 0.9;
                }

                .landing-category-card:hover .landing-category-icon {
                    transform: scale(1.15);
                    opacity: 1;
                    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))
                            drop-shadow(0 0 12px var(--card-color));
                }

                .landing-category-name {
                    font-size: clamp(1.25rem, 2vw, 1.4rem);
                    font-weight: var(--font-semibold, 600);
                    margin-bottom: var(--spacing-sm, 0.5rem);
                    color: var(--color-text-primary, #e5e7eb);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .landing-category-description {
                    font-size: clamp(0.875rem, 1.25vw, 0.95rem);
                    color: var(--color-text-secondary, #9ca3af);
                    line-height: var(--leading-normal, 1.6);
                    flex-grow: 1;
                }

                /* === Features Section === */
                .landing-features-section {
                    margin-top: var(--spacing-5xl, 5rem);
                    padding: var(--spacing-3xl, 3rem) 0;
                }

                .landing-features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: var(--spacing-xl, 2rem);
                    margin-top: var(--spacing-xl, 2rem);
                }

                .landing-feature-card {
                    text-align: center;
                    padding: var(--spacing-xl, 2rem);
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.4);
                    border-radius: var(--radius-xl, 1rem);
                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.3);
                    transition: all var(--transition-base, 0.3s ease);
                }

                .landing-feature-card:hover {
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
                    border-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.5);
                    transform: translateY(-4px);
                }

                .landing-feature-icon {
                    font-size: clamp(1.75rem, 3vw, 2.25rem);
                    margin-bottom: var(--spacing-md, 1rem);
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                }

                .landing-feature-card h3 {
                    font-size: clamp(1.125rem, 1.75vw, 1.25rem);
                    margin-bottom: var(--spacing-sm, 0.5rem);
                    color: var(--color-text-primary, #e5e7eb);
                    font-weight: var(--font-semibold, 600);
                }

                .landing-feature-card p {
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: clamp(0.875rem, 1.25vw, 0.95rem);
                    line-height: var(--leading-normal, 1.6);
                }

                /* === Responsive Design === */

                /* Mobile (320px - 767px) */
                @media (max-width: 767px) {
                    .landing-page-view {
                        padding: 0 var(--spacing-sm, 0.5rem) var(--spacing-xl, 2rem);
                    }

                    .landing-hero-section {
                        padding: var(--spacing-2xl, 2.5rem) var(--spacing-md, 1rem);
                        margin-bottom: var(--spacing-xl, 2rem);
                    }

                    .landing-category-grid {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-md, 1rem);
                    }

                    .landing-features-grid {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-md, 1rem);
                    }

                    .landing-hero-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .landing-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }

                /* Tablet (768px - 1023px) */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* Desktop (1024px+) */
                @media (min-width: 1024px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                /* Large Desktop (1400px+) */
                @media (min-width: 1400px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                /* Touch-friendly adjustments */
                @media (hover: none) and (pointer: coarse) {
                    .landing-btn {
                        min-height: 48px;
                        padding: var(--spacing-md, 1rem) var(--spacing-lg, 1.5rem);
                    }

                    .landing-category-card {
                        min-height: 200px;
                    }
                }

                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .landing-category-card,
                    .landing-feature-card,
                    .landing-btn,
                    .hero-icon-display {
                        transition: none;
                        animation: none;
                    }
                }
            </style>
        `;
    }

    /**
     * Get asset type card HTML
     * Now renders SVG icons with proper styling
     */
    getAssetTypeCardHTML(type) {
        return `
            <a href="${type.route}"
               class="landing-category-card"
               data-type="${type.id}"
               style="--card-color: ${type.color}">
                <img src="${type.icon}"
                     alt="${type.name} icon"
                     class="landing-category-icon"
                     loading="lazy" />
                <h3 class="landing-category-name">${type.name}</h3>
                <p class="landing-category-description">${type.description}</p>
            </a>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const cards = document.querySelectorAll('.landing-category-card');
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
