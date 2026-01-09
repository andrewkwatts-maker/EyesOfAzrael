/**
 * Landing Page View - Production Quality Polish
 * Displays asset type categories (mythologies, items, archetypes, places, magic, etc.)
 * in a polished, accessible grid layout with smooth animations.
 *
 * Features:
 * - Golden ratio typography (1.618)
 * - Cubic-bezier micro-animations
 * - 8px grid spacing system
 * - Enhanced glass-morphism
 * - SVG icons with emoji fallbacks for error handling
 * - WCAG 2.1 AA compliance
 * - Performance optimized (lazy loading, CSS containment)
 * - Skeleton loading states with fade-in animations
 * - Consistent card dimensions with min-height
 * - Text truncation (1 line titles, 2 line descriptions)
 * - Smooth hover effects with 0.2s transitions
 */

class LandingPageView {
    constructor(firestore) {
        this.db = firestore;
        this.assetTypes = this.getAssetTypes();
        this.isLoaded = false;
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
                route: '#/browse/archetypes',
                color: '#b965e6',
                order: 7
            },
            {
                id: 'magic',
                name: 'Magic Systems',
                icon: 'icons/categories/magic.svg',
                description: 'Mystical practices and esoteric traditions',
                route: '#/browse/magic',
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
     * Render the landing page with skeleton loading state
     */
    async render(container) {
        console.log('[Landing Page] Rendering...');

        try {
            // Validate container
            if (!container) {
                console.error('[Landing Page] ERROR: container is null or undefined');
                throw new Error('Container element is required');
            }
            console.log('[Landing Page] Container valid:', container.tagName, container.id);

            // STEP 1: Show skeleton loading state first for smooth UX
            container.innerHTML = this.getSkeletonHTML();
            container.classList.add('landing-loading');
            console.log('[Landing Page] Skeleton loading state displayed');

            // STEP 2: Brief delay to show skeleton (simulates async data fetch)
            // This ensures users see the loading state for at least 100ms
            await new Promise(resolve => setTimeout(resolve, 100));

            // STEP 3: Render final content with fade-in animation
            console.log('[Landing Page] Setting final HTML...');
            container.innerHTML = this.getLandingHTML();
            container.classList.remove('landing-loading');
            container.classList.add('landing-loaded');

            // CRITICAL: Remove ALL classes that could hide content
            // These classes from skeleton-screens.css and visual-polish.css set opacity: 0
            container.classList.remove('has-skeleton', 'content-loading', 'fade-out', 'transitioning');
            container.classList.add('content-loaded');
            console.log('[Landing Page] Container classes updated');

            // Hide auth overlay if it exists (must come BEFORE showing content)
            // NOTE: Using !important here is REQUIRED because auth-guard-simple.js
            // uses inline styles with !important to show the overlay. We must
            // override those styles to ensure content is visible after auth.
            const authOverlay = document.getElementById('auth-overlay');
            if (authOverlay) {
                authOverlay.style.setProperty('display', 'none', 'important');
                console.log('[Landing Page] Auth overlay hidden');
            }

            // Hide loading screen if it exists
            const loadingScreen = document.getElementById('auth-loading-screen');
            if (loadingScreen) {
                loadingScreen.style.setProperty('display', 'none', 'important');
            }

            // Hide any loading-container elements that might be covering content
            const loadingContainers = document.querySelectorAll('.loading-container');
            loadingContainers.forEach((lc, index) => {
                lc.style.display = 'none';
                console.log(`[Landing Page] Hidden loading-container ${index + 1}`);
            });

            // CRITICAL: Ensure container visibility with inline styles
            // These inline styles have highest specificity and override CSS classes
            // NOTE: !important flags here override potential CSS conflicts from
            // auth states or lazy-loading systems that may hide content initially
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('display', 'block', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            console.log('[Landing Page] Container made visible with inline styles');

            const view = container.querySelector('.landing-page-view');
            if (view) {
                view.style.setProperty('opacity', '1', 'important');
                view.style.setProperty('display', 'block', 'important');
                view.style.setProperty('visibility', 'visible', 'important');
                console.log('[Landing Page] View element made visible');
            } else {
                console.warn('[Landing Page] WARNING: .landing-page-view element not found in container');
            }

            // AGGRESSIVE: Force ALL parent elements to be visible
            let parent = container.parentElement;
            while (parent && parent !== document.body) {
                parent.style.setProperty('opacity', '1', 'important');
                parent.style.setProperty('display', 'block', 'important');
                parent.style.setProperty('visibility', 'visible', 'important');
                parent.style.setProperty('position', 'relative', 'important');
                parent.style.setProperty('z-index', '1', 'important');
                parent = parent.parentElement;
            }
            console.log('[Landing Page] All parent elements made visible');

            // DIAGNOSTIC: Log innerHTML length to verify content exists
            console.log('[Landing Page] Content length:', container.innerHTML.length, 'chars');
            console.log('[Landing Page] Has .landing-hero-title:', !!container.querySelector('.landing-hero-title'));

            this.attachEventListeners();
            this.isLoaded = true;

            // Dispatch event to hide loading spinner
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { view: 'landing', timestamp: Date.now() }
            }));

            console.log('[Landing Page] Render complete');

        } catch (error) {
            console.error('[Landing Page] RENDER ERROR:', error);
            // Show error message in container
            if (container) {
                container.innerHTML = `
                    <div class="error-container" role="alert" style="padding: 2rem; text-align: center; color: #ef4444;">
                        <h2>Error Loading Landing Page</h2>
                        <p>${this.escapeHTML(error.message)}</p>
                        <button onclick="location.reload()"
                                style="margin-top: 1rem; padding: 0.75rem 1.5rem; cursor: pointer;
                                       background: #ef4444; color: white; border: none; border-radius: 8px;
                                       font-size: 1rem; min-height: 44px;"
                                aria-label="Retry loading the page">
                            Retry
                        </button>
                    </div>
                `;
            }
            throw error; // Re-throw so SPA can catch it too
        }
    }

    /**
     * Get skeleton loading HTML for smooth UX
     * Shows placeholder cards while content loads with staggered animations
     */
    getSkeletonHTML() {
        // Generate 12 skeleton cards to match the 12 categories
        const skeletonCards = Array(12).fill('').map((_, index) => `
            <div class="landing-skeleton-card" style="--skeleton-index: ${index};">
                <div class="skeleton-icon"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-description"></div>
                <div class="skeleton-description skeleton-short"></div>
            </div>
        `).join('');

        return `
            <div class="landing-page-view landing-skeleton-container">
                <!-- Skeleton Hero Section -->
                <section class="landing-hero-section landing-skeleton-hero">
                    <div class="skeleton-hero-glow" aria-hidden="true"></div>
                    <div class="skeleton-hero-icon-wrapper">
                        <div class="skeleton-hero-icon"></div>
                        <div class="skeleton-hero-ring"></div>
                    </div>
                    <div class="skeleton-hero-title-small"></div>
                    <div class="skeleton-hero-title"></div>
                    <div class="skeleton-hero-subtitle"></div>
                    <div class="skeleton-hero-description"></div>
                    <div class="skeleton-hero-actions">
                        <div class="skeleton-button skeleton-button-primary"></div>
                        <div class="skeleton-button skeleton-button-secondary"></div>
                    </div>
                </section>

                <!-- Skeleton Category Grid -->
                <section class="landing-categories-section">
                    <div class="skeleton-section-header"></div>
                    <div class="skeleton-section-subtitle"></div>
                    <div class="landing-category-grid">
                        ${skeletonCards}
                    </div>
                </section>
            </div>

            <style>
                /* ===== SKELETON LOADING STYLES - POLISHED ===== */

                /* Skeleton shimmer animation - smoother wave effect */
                @keyframes skeletonShimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }

                /* Skeleton pulse animation - gentler breathing effect */
                @keyframes skeletonPulse {
                    0%, 100% {
                        opacity: 0.5;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }

                /* Skeleton card entrance animation */
                @keyframes skeletonCardEnter {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Base skeleton element styles */
                .landing-skeleton-container [class*="skeleton-"]:not(.landing-skeleton-card):not(.landing-skeleton-hero):not(.landing-skeleton-container) {
                    background: linear-gradient(
                        90deg,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.08) 0%,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.18) 40%,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.18) 60%,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.08) 100%
                    );
                    background-size: 200% 100%;
                    animation: skeletonShimmer 2s ease-in-out infinite;
                    border-radius: var(--radius-md, 8px);
                }

                /* Skeleton Hero - Enhanced */
                .landing-skeleton-hero {
                    position: relative;
                    padding: 72px 40px 64px !important;
                }

                .skeleton-hero-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        circle at center,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.08) 0%,
                        transparent 60%
                    );
                    animation: skeletonPulse 3s ease-in-out infinite;
                }

                .skeleton-hero-icon-wrapper {
                    position: relative;
                    width: 90px;
                    height: 90px;
                    margin: 0 auto 24px;
                }

                .skeleton-hero-icon {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    margin: 10px auto;
                }

                .skeleton-hero-ring {
                    position: absolute;
                    inset: 0;
                    border: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.15);
                    border-radius: 50%;
                    animation: skeletonPulse 2s ease-in-out infinite;
                }

                .skeleton-hero-title-small {
                    width: 120px;
                    height: 18px;
                    margin: 0 auto 8px;
                    border-radius: 4px;
                }

                .skeleton-hero-title {
                    width: 280px;
                    max-width: 80%;
                    height: 52px;
                    margin: 0 auto 20px;
                    border-radius: 8px;
                }

                .skeleton-hero-subtitle {
                    width: 420px;
                    max-width: 90%;
                    height: 24px;
                    margin: 0 auto 16px;
                }

                .skeleton-hero-description {
                    width: 520px;
                    max-width: 85%;
                    height: 40px;
                    margin: 0 auto 32px;
                    border-radius: 8px;
                }

                .skeleton-hero-actions {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .skeleton-button {
                    height: 52px;
                    border-radius: 14px;
                }

                .skeleton-button-primary {
                    width: 200px;
                }

                .skeleton-button-secondary {
                    width: 180px;
                    opacity: 0.7;
                }

                /* Skeleton Section Header */
                .skeleton-section-header {
                    width: 220px;
                    height: 32px;
                    margin: 0 auto 16px;
                }

                .skeleton-section-subtitle {
                    width: 320px;
                    max-width: 85%;
                    height: 18px;
                    margin: 0 auto 32px;
                }

                /* Skeleton Cards - Staggered entrance */
                .landing-skeleton-card {
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5);
                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.25);
                    border-radius: 14px;
                    padding: 22px 20px;
                    min-height: 175px;
                    display: flex;
                    flex-direction: column;
                    opacity: 0;
                    animation:
                        skeletonCardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards,
                        skeletonPulse 2.5s ease-in-out infinite 0.4s;
                    animation-delay: calc(var(--skeleton-index, 0) * 0.05s);
                }

                .landing-skeleton-card .skeleton-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 10px;
                    margin-bottom: 14px;
                }

                .landing-skeleton-card .skeleton-title {
                    width: 70%;
                    height: 18px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }

                .landing-skeleton-card .skeleton-description {
                    width: 100%;
                    height: 12px;
                    margin-bottom: 6px;
                    border-radius: 3px;
                }

                .landing-skeleton-card .skeleton-description.skeleton-short {
                    width: 65%;
                }

                /* Responsive skeleton adjustments */
                @media (max-width: 767px) {
                    .skeleton-hero-icon-wrapper {
                        width: 70px;
                        height: 70px;
                    }

                    .skeleton-hero-icon {
                        width: 50px;
                        height: 50px;
                    }

                    .skeleton-hero-title {
                        height: 40px;
                    }

                    .skeleton-hero-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .skeleton-button {
                        width: 100%;
                        max-width: 280px;
                    }
                }
            </style>
        `;
    }

    /**
     * Get landing page HTML
     */
    getLandingHTML() {
        return `
            <div class="landing-page-view">
                <!-- Hero Section - Enhanced with animated background and quick search -->
                <section class="landing-hero-section" role="banner">
                    <div class="hero-background-glow" aria-hidden="true"></div>
                    <div class="hero-particles" aria-hidden="true">
                        <div class="particle particle-1"></div>
                        <div class="particle particle-2"></div>
                        <div class="particle particle-3"></div>
                        <div class="particle particle-4"></div>
                        <div class="particle particle-5"></div>
                    </div>
                    <div class="hero-sacred-geometry" aria-hidden="true">
                        <svg class="sacred-svg" viewBox="0 0 200 200" width="400" height="400">
                            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
                            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.15"/>
                            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2"/>
                            <polygon points="100,20 170,140 30,140" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
                            <polygon points="100,180 30,60 170,60" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
                        </svg>
                    </div>
                    <div class="hero-content-wrapper">
                        <div class="hero-icon-display" aria-hidden="true">
                            <span class="hero-eye-icon">&#128065;</span>
                            <div class="hero-icon-ring"></div>
                            <div class="hero-icon-ring hero-icon-ring-outer"></div>
                        </div>
                        <h1 class="landing-hero-title">
                            <span class="title-line title-line-1">Eyes of</span>
                            <span class="title-line title-line-2">Azrael</span>
                        </h1>
                        <p class="landing-hero-subtitle">
                            Unveil the Sacred Wisdom of Ancient Worlds
                        </p>
                        <p class="landing-hero-description">
                            Journey through 6000+ years of mythology, from the ziggurats of Sumer to the sacred groves of the Celts.
                            Discover divine beings, legendary heroes, mythical creatures, and the timeless wisdom that shaped civilizations.
                        </p>

                        <!-- Quick Search -->
                        <div class="hero-search-container">
                            <form class="hero-search-form" role="search" aria-label="Search mythology database">
                                <div class="hero-search-input-wrapper">
                                    <span class="hero-search-icon" aria-hidden="true">&#128269;</span>
                                    <input type="search"
                                           class="hero-search-input"
                                           id="heroSearchInput"
                                           placeholder="Search deities, creatures, myths..."
                                           autocomplete="off"
                                           aria-label="Search mythology database">
                                    <button type="submit" class="hero-search-btn" aria-label="Search">
                                        <span class="btn-text">Search</span>
                                        <span class="btn-arrow">&#8594;</span>
                                    </button>
                                </div>
                                <div class="hero-search-suggestions" aria-live="polite">
                                    <span class="search-suggestion-label">Popular:</span>
                                    <a href="#/browse/deities?q=zeus" class="search-suggestion-tag">Zeus</a>
                                    <a href="#/browse/creatures?q=dragon" class="search-suggestion-tag">Dragons</a>
                                    <a href="#/browse/heroes?q=hercules" class="search-suggestion-tag">Hercules</a>
                                    <a href="#/mythologies/norse" class="search-suggestion-tag">Norse</a>
                                    <a href="#/browse/items?q=excalibur" class="search-suggestion-tag">Excalibur</a>
                                </div>
                            </form>
                        </div>

                        <div class="landing-hero-actions">
                            <a href="#/mythologies" class="landing-btn landing-btn-primary">
                                <span class="btn-icon">&#127963;</span>
                                <span class="btn-text">Explore Mythologies</span>
                            </a>
                            <a href="#/search" class="landing-btn landing-btn-secondary">
                                <span class="btn-icon">&#128218;</span>
                                <span class="btn-text">Browse Database</span>
                            </a>
                        </div>
                    </div>
                </section>

                <!-- Asset Type Grid -->
                <section class="landing-categories-section">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">&#128450;</span>
                        Explore by Category
                    </h2>
                    <p class="landing-section-subtitle">
                        Browse our comprehensive collection of mythological content
                    </p>
                    <div class="landing-category-grid">
                        ${this.assetTypes.map((type, index) => this.getAssetTypeCardHTML(type, index)).join('')}
                    </div>
                </section>

                <!-- Featured Entities Section - Dynamically loaded if data available -->
                <section class="landing-featured-section" id="featured-entities-section" style="display: none;">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">&#11088;</span>
                        Featured Entities
                    </h2>
                    <p class="landing-section-subtitle">
                        Popular mythological beings and artifacts
                    </p>
                    <div class="landing-featured-grid" id="featured-entities-grid">
                        <!-- Featured entities will be dynamically loaded here -->
                    </div>
                </section>

                <!-- Stats & Social Proof Section -->
                <section class="landing-stats-section" id="stats-section">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">&#128202;</span>
                        Our Growing Collection
                    </h2>
                    <p class="landing-section-subtitle">
                        A living encyclopedia of world mythology
                    </p>
                    <div class="landing-stats-grid">
                        <div class="landing-stat-card" style="--stat-index: 0;">
                            <div class="stat-icon">&#127760;</div>
                            <div class="stat-number" id="stat-mythologies">22+</div>
                            <div class="stat-label">Mythologies</div>
                            <div class="stat-description">World traditions</div>
                        </div>
                        <div class="landing-stat-card" style="--stat-index: 1;">
                            <div class="stat-icon">&#128081;</div>
                            <div class="stat-number" id="stat-deities">500+</div>
                            <div class="stat-label">Deities</div>
                            <div class="stat-description">Divine beings</div>
                        </div>
                        <div class="landing-stat-card" style="--stat-index: 2;">
                            <div class="stat-icon">&#128009;</div>
                            <div class="stat-number" id="stat-creatures">350+</div>
                            <div class="stat-label">Creatures</div>
                            <div class="stat-description">Mythical beasts</div>
                        </div>
                        <div class="landing-stat-card" style="--stat-index: 3;">
                            <div class="stat-icon">&#9876;</div>
                            <div class="stat-number" id="stat-items">200+</div>
                            <div class="stat-label">Artifacts</div>
                            <div class="stat-description">Sacred objects</div>
                        </div>
                        <div class="landing-stat-card" style="--stat-index: 4;">
                            <div class="stat-icon">&#128220;</div>
                            <div class="stat-number" id="stat-texts">150+</div>
                            <div class="stat-label">Sacred Texts</div>
                            <div class="stat-description">Ancient writings</div>
                        </div>
                        <div class="landing-stat-card" style="--stat-index: 5;">
                            <div class="stat-icon">&#128101;</div>
                            <div class="stat-number" id="stat-contributors">1000+</div>
                            <div class="stat-label">Contributors</div>
                            <div class="stat-description">Community members</div>
                        </div>
                    </div>
                </section>

                <!-- Recent Additions Section -->
                <section class="landing-recent-section" id="recent-additions-section" style="display: none;">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">&#9200;</span>
                        Recently Added
                    </h2>
                    <p class="landing-section-subtitle">
                        Fresh discoveries from our community
                    </p>
                    <div class="landing-recent-grid" id="recent-additions-grid">
                        <!-- Recent additions will be dynamically loaded here -->
                    </div>
                    <div class="landing-section-cta">
                        <a href="#/search?sort=newest" class="landing-btn landing-btn-outline">
                            <span class="btn-icon">&#128196;</span>
                            <span class="btn-text">View All Recent</span>
                        </a>
                    </div>
                </section>

                <!-- Features Section -->
                <section class="landing-features-section">
                    <h2 class="landing-section-header">
                        <span class="landing-section-icon">&#10024;</span>
                        Discover & Explore
                    </h2>
                    <p class="landing-section-subtitle">
                        Powerful tools for mythology research
                    </p>
                    <div class="landing-features-grid">
                        <div class="landing-feature-card" style="--feature-index: 0;">
                            <div class="landing-feature-icon">&#128218;</div>
                            <h3>Comprehensive Database</h3>
                            <p>Thousands of entities across 22+ mythological traditions from every corner of the world</p>
                        </div>
                        <div class="landing-feature-card" style="--feature-index: 1;">
                            <div class="landing-feature-icon">&#128279;</div>
                            <h3>Cross-Cultural Links</h3>
                            <p>Discover fascinating connections and parallels between different mythological traditions</p>
                        </div>
                        <div class="landing-feature-card" style="--feature-index: 2;">
                            <div class="landing-feature-icon">&#128269;</div>
                            <h3>Advanced Search</h3>
                            <p>Find entities by name, type, mythology, attributes, or relationships with powerful filtering</p>
                        </div>
                        <div class="landing-feature-card" style="--feature-index: 3;">
                            <div class="landing-feature-icon">&#9878;</div>
                            <h3>Compare Traditions</h3>
                            <p>Side-by-side comparison of deities, heroes, and concepts across different cultures</p>
                        </div>
                    </div>
                </section>

                <!-- Community CTA Section -->
                <section class="landing-cta-section">
                    <div class="cta-content-wrapper">
                        <div class="cta-icon">&#128640;</div>
                        <h2 class="cta-title">Join Our Community</h2>
                        <p class="cta-description">
                            Become part of a growing community of mythology enthusiasts, scholars, and storytellers.
                            Contribute your knowledge, discuss ancient wisdom, and help preserve humanity's sacred heritage.
                        </p>
                        <div class="cta-actions">
                            <a href="#/signup" class="landing-btn landing-btn-primary cta-btn">
                                <span class="btn-icon">&#9734;</span>
                                <span class="btn-text">Get Started Free</span>
                            </a>
                            <a href="#/about" class="landing-btn landing-btn-ghost cta-btn">
                                <span class="btn-text">Learn More</span>
                                <span class="btn-arrow">&#8594;</span>
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <style>
                /* ===== LANDING PAGE STYLES - PRODUCTION QUALITY POLISH ===== */
                /*
                 * Design System:
                 * - Golden Ratio Typography: 1.618
                 * - 8px Grid Spacing System
                 * - Cubic-Bezier Easing: cubic-bezier(0.4, 0, 0.2, 1)
                 * - Enhanced Glass-morphism with multiple blur layers
                 * - WCAG 2.1 AA Compliant
                 * - Performance optimized with CSS containment
                 * - Consistent card dimensions with min-height
                 * - Text truncation for titles (1 line) and descriptions (2 lines)
                 * - Smooth 0.2s hover transitions
                 */

                /* === Fade-in Animation for Content Load === */
                @keyframes landingFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* === Root Container === */
                /* FIXED: Removed opacity:0 animation that was causing content to stay hidden */
                /* Content is now visible immediately for reliability */
                .landing-page-view {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 max(1rem, env(safe-area-inset-left)) 4rem max(1rem, env(safe-area-inset-right));
                    contain: layout style paint;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: block !important;
                    /* Fade-in animation when content loads */
                    animation: landingFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                /* Loading state class for container */
                .landing-loading .landing-page-view {
                    animation: none;
                }

                /* Loaded state with fade-in */
                .landing-loaded .landing-page-view {
                    animation: landingFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                /* === Hero Section - Enhanced Glass-morphism === */
                .landing-hero-section {
                    /* Multi-layer glass effect */
                    background:
                        linear-gradient(135deg,
                            rgba(var(--color-primary-rgb, 139, 127, 255), 0.12),
                            rgba(var(--color-secondary-rgb, 251, 191, 36), 0.08)),
                        linear-gradient(180deg,
                            rgba(255, 255, 255, 0.06),
                            transparent);

                    border: 1px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.25);
                    border-radius: 28px; /* Slightly larger radius */
                    padding: 72px 40px 64px; /* Extra top padding for visual balance */
                    text-align: center;
                    margin-bottom: 56px;
                    position: relative;
                    overflow: hidden;
                    contain: layout style paint;

                    /* Enhanced glass-morphism */
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);

                    /* Layered shadows for depth */
                    box-shadow:
                        0 12px 40px rgba(0, 0, 0, 0.35),
                        0 1px 0 rgba(255, 255, 255, 0.08) inset,
                        0 -1px 0 rgba(0, 0, 0, 0.2) inset,
                        0 0 100px rgba(var(--color-primary-rgb, 139, 127, 255), 0.08);

                    /* Performance optimization */
                    will-change: transform;
                }

                /* Animated background glow */
                .hero-background-glow {
                    position: absolute;
                    inset: -50%;
                    background:
                        radial-gradient(circle at 30% 20%, rgba(var(--color-primary-rgb, 139, 127, 255), 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(var(--color-secondary-rgb, 251, 191, 36), 0.1) 0%, transparent 50%);
                    animation: heroGlowShift 20s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 0;
                }

                @keyframes heroGlowShift {
                    0%, 100% {
                        transform: translate(0, 0) rotate(0deg);
                        opacity: 0.8;
                    }
                    33% {
                        transform: translate(5%, 3%) rotate(60deg);
                        opacity: 1;
                    }
                    66% {
                        transform: translate(-3%, -2%) rotate(120deg);
                        opacity: 0.9;
                    }
                }

                .hero-content-wrapper {
                    position: relative;
                    z-index: 1;
                }

                /* Hero Icon - Enhanced with Ring Animation */
                .hero-icon-display {
                    position: relative;
                    margin-bottom: 24px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: clamp(80px, 12vw, 100px);
                    height: clamp(80px, 12vw, 100px);
                }

                .hero-eye-icon {
                    font-size: clamp(3rem, 6vw, 4.5rem);
                    line-height: 1;
                    filter: drop-shadow(0 4px 16px rgba(var(--color-primary-rgb, 139, 127, 255), 0.5))
                            drop-shadow(0 0 32px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3));
                    animation: smoothFloat 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    will-change: transform;
                    position: relative;
                    z-index: 2;
                }

                .hero-icon-ring {
                    position: absolute;
                    inset: -8px;
                    border: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    border-radius: 50%;
                    animation: ringPulse 3s ease-in-out infinite;
                }

                .hero-icon-ring::before {
                    content: '';
                    position: absolute;
                    inset: -12px;
                    border: 1px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.15);
                    border-radius: 50%;
                    animation: ringPulse 3s ease-in-out infinite 0.5s;
                }

                @keyframes ringPulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.8;
                    }
                }

                @keyframes smoothFloat {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        transform: translateY(-8px) scale(1.03);
                    }
                }

                /* Hero Title - Enhanced Typography with Split Lines */
                .landing-hero-title {
                    font-family: var(--font-heading, Georgia, serif);
                    font-size: clamp(2.5rem, 5.5vw, 4rem);
                    font-weight: 800;
                    margin-bottom: 20px;
                    letter-spacing: -0.03em;
                    line-height: 1.05;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0;
                }

                .title-line {
                    display: block;
                    background: linear-gradient(
                        135deg,
                        var(--color-primary, #8b7fff) 0%,
                        var(--color-secondary, #fbbf24) 50%,
                        var(--color-primary, #8b7fff) 100%
                    );
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                .title-line-1 {
                    font-size: 0.65em;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    opacity: 0.9;
                    margin-bottom: 4px;
                }

                .title-line-2 {
                    font-size: 1em;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    text-shadow: 0 0 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                /* Hero Subtitle - Golden Ratio */
                .landing-hero-subtitle {
                    /* Golden ratio: base 1rem x 1.618 = 1.618rem */
                    font-size: clamp(1.25rem, 3vw, 1.618rem);
                    color: var(--color-text-primary, #e5e7eb);
                    margin-bottom: 24px; /* 3x8px grid */
                    font-weight: 500;
                    letter-spacing: 0.01em;
                    line-height: 1.618; /* Golden ratio line height */
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                }

                /* Hero Description */
                .landing-hero-description {
                    font-size: clamp(1rem, 2vw, 1.125rem);
                    color: var(--color-text-secondary, #9ca3af);
                    max-width: min(800px, 90%);
                    margin: 0 auto 32px; /* 4x8px grid */
                    line-height: 1.75;
                    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                }

                /* Hero Actions */
                .landing-hero-actions {
                    display: flex;
                    gap: 16px; /* 2x8px grid */
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-top: 32px; /* 4x8px grid */
                }

                /* Button Icon */
                .btn-icon {
                    font-size: 1.15em;
                    line-height: 1;
                    flex-shrink: 0;
                    transition: transform 0.2s ease;
                }

                .btn-text {
                    font-weight: inherit;
                }

                /* Buttons - Smooth 0.2s Micro-animations */
                .landing-btn {
                    font-family: var(--font-primary, sans-serif);
                    font-weight: 600;
                    padding: 14px 28px;
                    border-radius: 14px;
                    border: none;
                    cursor: pointer;
                    font-size: 0.975rem;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    min-height: 52px; /* WCAG 2.1 AA touch target */
                    min-width: 52px;
                    position: relative;
                    overflow: hidden;
                    contain: layout style paint;
                    letter-spacing: 0.01em;

                    /* POLISHED: 0.2s ease transitions for snappy hover */
                    transition:
                        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.2s ease,
                        border-color 0.2s ease;

                    will-change: transform;
                }

                /* Ripple effect on click */
                .landing-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: inherit;
                    opacity: 0;
                    transform: scale(0);
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                                opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .landing-btn:active::after {
                    transform: scale(1);
                    opacity: 1;
                    transition: 0s;
                }

                /* Primary Button - Gradient with enhanced glow */
                .landing-btn-primary {
                    background: linear-gradient(
                        135deg,
                        var(--color-primary, #8b7fff) 0%,
                        #a78bfa 50%,
                        var(--color-secondary, #fbbf24) 100%
                    );
                    background-size: 200% 200%;
                    color: white;
                    font-weight: 600;
                    box-shadow:
                        0 4px 20px rgba(var(--color-primary-rgb, 139, 127, 255), 0.35),
                        0 2px 8px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }

                /* POLISHED: translateY(-3px) hover effect */
                .landing-btn-primary:hover {
                    transform: translateY(-3px);
                    background-position: 100% 50%;
                    box-shadow:
                        0 8px 32px rgba(var(--color-primary-rgb, 139, 127, 255), 0.5),
                        0 4px 16px rgba(0, 0, 0, 0.25),
                        0 0 48px rgba(var(--color-primary-rgb, 139, 127, 255), 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25);
                }

                .landing-btn-primary:hover .btn-icon {
                    transform: scale(1.1);
                }

                .landing-btn-primary:active {
                    transform: translateY(-1px);
                }

                /* Secondary Button - Glass morphism */
                .landing-btn-secondary {
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.08);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1.5px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.4);
                    color: var(--color-text-primary, #e5e7eb);
                    font-weight: 600;
                }

                /* POLISHED: translateY(-3px) hover effect */
                .landing-btn-secondary:hover {
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.15);
                    border-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.7);
                    transform: translateY(-3px);
                    box-shadow:
                        0 8px 28px rgba(var(--color-primary-rgb, 139, 127, 255), 0.25),
                        0 4px 12px rgba(0, 0, 0, 0.15);
                    color: var(--color-primary, #8b7fff);
                }

                .landing-btn-secondary:hover .btn-icon {
                    transform: scale(1.1);
                }

                .landing-btn-secondary:active {
                    transform: translateY(-1px);
                }

                /* === Categories Section === */
                .landing-categories-section {
                    margin-bottom: 80px; /* 10x8px grid */
                }

                /* Section Header - Golden Ratio */
                .landing-section-header {
                    /* Golden ratio: base 1.25rem x 1.618 = 2rem */
                    font-size: clamp(1.75rem, 4vw, 2.618rem);
                    text-align: center;
                    margin-bottom: 16px; /* 2x8px grid */
                    color: var(--color-primary, #8b7fff);
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    text-shadow:
                        0 0 16px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4),
                        0 2px 8px rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 16px; /* 2x8px grid */
                    flex-wrap: wrap;
                }

                .landing-section-icon {
                    font-size: 1.5em;
                    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))
                            drop-shadow(0 0 12px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3));
                    line-height: 1;
                }

                .landing-section-subtitle {
                    text-align: center;
                    color: var(--color-text-secondary, #9ca3af);
                    margin-bottom: 32px; /* 4x8px grid */
                    font-size: clamp(1rem, 2vw, 1.125rem);
                    line-height: 1.618;
                }

                /* Category Grid - Compact Panel Grid for 4+ columns on desktop */
                .landing-category-grid {
                    display: grid;
                    /* Compact cards: 200px min for proper panel sizing - ensures 4+ columns on 900px+ screens */
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px; /* 2x8px grid - tighter for compact look */
                    contain: layout style;
                }

                /* Category Cards - POLISHED: Consistent dimensions, smooth hover */
                .landing-category-card {
                    /* Multi-layer glass effect */
                    background:
                        linear-gradient(145deg,
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.75),
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.55));

                    backdrop-filter: blur(16px) saturate(160%);
                    -webkit-backdrop-filter: blur(16px) saturate(160%);

                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.4);
                    border-radius: 14px;
                    padding: 22px 20px;
                    text-decoration: none;
                    color: inherit;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;

                    /* POLISHED: Consistent card dimensions - prevents layout shift */
                    min-height: 175px;
                    height: 100%;

                    display: flex;
                    flex-direction: column;
                    contain: layout style paint;

                    /* POLISHED: 0.2s cubic-bezier transitions for smooth hover */
                    transition:
                        transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                        border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.25s ease,
                        box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);

                    /* Layered shadows */
                    box-shadow:
                        0 4px 16px rgba(0, 0, 0, 0.12),
                        0 1px 0 rgba(255, 255, 255, 0.04) inset;

                    will-change: transform, box-shadow;

                    /* Staggered fade-in animation with calc for delay */
                    opacity: 0;
                    animation: cardFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    animation-delay: calc(var(--card-index, 0) * 0.06s);
                }

                /* Staggered card fade-in animation */
                @keyframes cardFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(16px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Top accent bar - animated on hover */
                .landing-category-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--card-color), rgba(255, 255, 255, 0.2));
                    transform: scaleX(0);
                    transform-origin: left;
                    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Subtle glow overlay */
                .landing-category-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        ellipse at top left,
                        rgba(255, 255, 255, 0.06),
                        transparent 60%
                    );
                    opacity: 0;
                    transition: opacity 0.25s ease;
                    pointer-events: none;
                }

                .landing-category-card:hover::after {
                    opacity: 1;
                }

                /* POLISHED: Enhanced hover state with subtle scale */
                .landing-category-card:hover {
                    transform: translateY(-6px) scale(1.01);
                    border-color: rgba(var(--card-color-rgb, 139, 127, 255), 0.6);
                    border-color: var(--card-color);
                    background:
                        linear-gradient(145deg,
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.9),
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.75));
                    box-shadow:
                        0 16px 40px rgba(0, 0, 0, 0.2),
                        0 0 0 1px rgba(255, 255, 255, 0.08) inset,
                        0 0 40px -12px var(--card-color);
                }

                .landing-category-card:hover::before {
                    transform: scaleX(1);
                }

                .landing-category-card:active {
                    transform: translateY(-3px) scale(1.005);
                    transition-duration: 0.1s;
                }

                /* Ensure content is above pseudo-elements */
                .landing-category-card > * {
                    position: relative;
                    z-index: 1;
                }

                /* SVG Icon - POLISHED: Consistent 48px sizing */
                .landing-category-icon {
                    /* POLISHED: Fixed 48px size for consistency */
                    width: 48px;
                    height: 48px;
                    margin-bottom: 12px; /* Reduced margin */
                    display: block;
                    object-fit: contain;
                    opacity: 0.9;
                    flex-shrink: 0;

                    /* SVG icons loaded via <img> cannot inherit CSS color.
                     * Use brightness(0) + invert(1) to make white, then sepia and hue-rotate
                     * to approximate the card color. This provides visual consistency. */
                    filter:
                        brightness(0) invert(1)
                        drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))
                        drop-shadow(0 0 12px var(--card-color));

                    transition:
                        transform 0.2s ease,
                        opacity 0.2s ease,
                        filter 0.2s ease;

                    will-change: transform;
                }

                .landing-category-card:hover .landing-category-icon {
                    transform: scale(1.1) rotateZ(3deg);
                    opacity: 1;
                    filter:
                        brightness(0) invert(1)
                        drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))
                        drop-shadow(0 0 24px var(--card-color))
                        brightness(1.2);
                }

                /* Inline SVG Icon - Direct SVG rendering with color inheritance */
                .entity-icon-svg {
                    /* POLISHED: Fixed 48px size for consistency */
                    width: 48px;
                    height: 48px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.9;
                    color: var(--card-color, var(--color-primary, #8b7fff));
                    flex-shrink: 0;

                    /* Inline SVGs inherit color, apply glow effects */
                    filter:
                        drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))
                        drop-shadow(0 0 12px var(--card-color));

                    transition:
                        transform 0.2s ease,
                        opacity 0.2s ease,
                        filter 0.2s ease;

                    will-change: transform;
                }

                /* Style inline SVG elements */
                .entity-icon-svg svg {
                    width: 100%;
                    height: 100%;
                    fill: currentColor;
                    stroke: currentColor;
                }

                .landing-category-card:hover .entity-icon-svg {
                    transform: scale(1.1) rotateZ(3deg);
                    opacity: 1;
                    filter:
                        drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))
                        drop-shadow(0 0 24px var(--card-color))
                        brightness(1.2);
                }

                /* Emoji Fallback Icon - POLISHED: Consistent 48px sizing */
                .landing-category-icon-fallback {
                    /* POLISHED: Fixed 48px size for consistency */
                    width: 48px;
                    height: 48px;
                    margin-bottom: 12px;
                    font-size: 2rem;
                    line-height: 1;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;

                    filter:
                        drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))
                        drop-shadow(0 0 12px var(--card-color));

                    transition:
                        transform 0.2s ease,
                        filter 0.2s ease;
                }

                .landing-category-card:hover .landing-category-icon-fallback {
                    transform: scale(1.1) rotateZ(3deg);
                    filter:
                        drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))
                        drop-shadow(0 0 24px var(--card-color))
                        brightness(1.1);
                }

                /* Category Name - POLISHED: 1 line max with ellipsis */
                .landing-category-name {
                    font-size: clamp(1rem, 2vw, 1.125rem); /* Compact for panel layout */
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--color-text-primary, #e5e7eb);
                    letter-spacing: -0.01em;
                    line-height: 1.25;
                    text-shadow:
                        0 1px 4px rgba(0, 0, 0, 0.4),
                        0 0 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.1);

                    /* POLISHED: 1 line truncation with ellipsis */
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;

                    transition: color 0.2s ease;
                }

                .landing-category-card:hover .landing-category-name {
                    color: var(--card-color, var(--color-text-primary));
                }

                /* Category Description - POLISHED: 2 line clamp */
                .landing-category-description {
                    /* Smaller for compact cards, maintaining readability */
                    font-size: clamp(0.8125rem, 1.25vw, 0.9375rem); /* 13-15px range */
                    color: var(--color-text-secondary, #9ca3af);
                    line-height: 1.5; /* Tighter line height */
                    flex-grow: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

                    /* POLISHED: 2-line clamp for consistent card heights */
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* === Features Section === */
                .landing-features-section {
                    margin-top: 80px; /* 10x8px grid */
                    padding: 48px 0; /* 6x8px grid */
                }

                .landing-features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 24px; /* 3x8px grid */
                    margin-top: 32px; /* 4x8px grid */
                    contain: layout style;
                }

                /* Feature Cards - POLISHED: Consistent with category cards */
                .landing-feature-card {
                    text-align: center;
                    padding: 32px; /* 4x8px grid */
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.3);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 16px; /* 2x8px grid */
                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.3);
                    contain: layout style paint;

                    /* POLISHED: Consistent min-height */
                    min-height: 200px;

                    /* POLISHED: 0.2s transitions */
                    transition:
                        background 0.2s ease,
                        border-color 0.2s ease,
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }

                /* POLISHED: translateY(-4px) hover */
                .landing-feature-card:hover {
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5);
                    border-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.5);
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }

                .landing-feature-icon {
                    font-size: clamp(2rem, 4vw, 2.618rem); /* Golden ratio */
                    margin-bottom: 16px; /* 2x8px grid */
                    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))
                            drop-shadow(0 0 12px rgba(var(--color-primary-rgb, 139, 127, 255), 0.2));
                    line-height: 1;
                }

                .landing-feature-card h3 {
                    font-size: clamp(1.125rem, 2vw, 1.25rem);
                    margin-bottom: 8px; /* 1x8px grid */
                    color: var(--color-text-primary, #e5e7eb);
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    line-height: 1.3;
                    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                }

                .landing-feature-card p {
                    color: var(--color-text-secondary, #9ca3af);
                    /* Minimum 16px (1rem) for WCAG mobile readability */
                    font-size: clamp(1rem, 1.5vw, 1.125rem);
                    line-height: 1.618; /* Golden ratio */
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }

                /* === Hero Search Container === */
                .hero-search-container {
                    max-width: 650px;
                    margin: 0 auto 32px;
                    position: relative;
                    z-index: 2;
                }

                .hero-search-form {
                    width: 100%;
                }

                .hero-search-input-wrapper {
                    display: flex;
                    align-items: center;
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.9);
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    border-radius: 16px;
                    padding: 4px 4px 4px 20px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow:
                        0 8px 32px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }

                .hero-search-input-wrapper:focus-within {
                    border-color: var(--color-primary, #8b7fff);
                    box-shadow:
                        0 8px 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3),
                        0 0 0 4px rgba(var(--color-primary-rgb, 139, 127, 255), 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }

                .hero-search-icon {
                    font-size: 1.25rem;
                    color: var(--color-text-secondary, #9ca3af);
                    margin-right: 12px;
                    flex-shrink: 0;
                }

                .hero-search-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--color-text-primary, #f8f9fa);
                    font-size: 1.1rem;
                    font-family: inherit;
                    padding: 14px 12px 14px 0;
                    outline: none;
                    min-width: 0;
                }

                .hero-search-input::placeholder {
                    color: var(--color-text-muted, #6c757d);
                }

                .hero-search-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, var(--color-primary, #8b7fff), #a78bfa);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 24px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .hero-search-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4);
                }

                .hero-search-btn .btn-arrow {
                    transition: transform 0.2s ease;
                }

                .hero-search-btn:hover .btn-arrow {
                    transform: translateX(4px);
                }

                .hero-search-suggestions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .search-suggestion-label {
                    font-size: 0.875rem;
                    color: var(--color-text-secondary, #9ca3af);
                }

                .search-suggestion-tag {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary, #9ca3af);
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.1);
                    border: 1px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.2);
                    padding: 4px 12px;
                    border-radius: 20px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .search-suggestion-tag:hover {
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.2);
                    border-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.4);
                    color: var(--color-primary, #8b7fff);
                }

                /* === Hero Particles Animation === */
                .hero-particles {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }

                .particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: var(--color-primary, #8b7fff);
                    border-radius: 50%;
                    opacity: 0.4;
                    animation: particleFloat 15s infinite ease-in-out;
                }

                .particle-1 { left: 10%; top: 20%; animation-delay: 0s; }
                .particle-2 { left: 30%; top: 60%; animation-delay: 3s; }
                .particle-3 { left: 60%; top: 15%; animation-delay: 6s; }
                .particle-4 { left: 80%; top: 50%; animation-delay: 9s; }
                .particle-5 { left: 50%; top: 80%; animation-delay: 12s; }

                @keyframes particleFloat {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.4;
                    }
                    25% {
                        transform: translate(20px, -30px) scale(1.2);
                        opacity: 0.7;
                    }
                    50% {
                        transform: translate(-10px, 20px) scale(0.8);
                        opacity: 0.3;
                    }
                    75% {
                        transform: translate(30px, 10px) scale(1.1);
                        opacity: 0.6;
                    }
                }

                /* === Sacred Geometry Background === */
                .hero-sacred-geometry {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    opacity: 0.3;
                    color: var(--color-primary, #8b7fff);
                    animation: sacredRotate 60s linear infinite;
                }

                @keyframes sacredRotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }

                .hero-icon-ring-outer {
                    inset: -20px !important;
                    animation-delay: 1s !important;
                }

                /* === Stats Section === */
                .landing-stats-section {
                    margin: 80px 0;
                    padding: 48px 0;
                }

                .landing-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 20px;
                    margin-top: 32px;
                }

                .landing-stat-card {
                    text-align: center;
                    padding: 28px 20px;
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.3);
                    border-radius: 16px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0;
                    animation: statCardFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    animation-delay: calc(var(--stat-index, 0) * 0.1s);
                }

                @keyframes statCardFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .landing-stat-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.4);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
                }

                .stat-icon {
                    font-size: 2rem;
                    margin-bottom: 12px;
                    filter: drop-shadow(0 2px 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3));
                }

                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--color-primary, #8b7fff), var(--color-secondary, #fbbf24));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1.2;
                    margin-bottom: 4px;
                }

                .stat-label {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--color-text-primary, #f8f9fa);
                    margin-bottom: 4px;
                }

                .stat-description {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary, #9ca3af);
                }

                /* === Recent Additions Section === */
                .landing-recent-section {
                    margin-bottom: 64px;
                }

                .landing-recent-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                    margin-top: 24px;
                }

                .landing-section-cta {
                    text-align: center;
                    margin-top: 32px;
                }

                /* === CTA Section === */
                .landing-cta-section {
                    margin: 80px 0 40px;
                    padding: 64px 32px;
                    background: linear-gradient(135deg,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.15),
                        rgba(var(--color-secondary-rgb, 251, 191, 36), 0.1));
                    border: 1px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.25);
                    border-radius: 28px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .landing-cta-section::before {
                    content: '';
                    position: absolute;
                    inset: -50%;
                    background: radial-gradient(circle at 30% 30%, rgba(var(--color-primary-rgb, 139, 127, 255), 0.1), transparent 60%);
                    animation: ctaGlow 15s ease-in-out infinite;
                }

                @keyframes ctaGlow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(5%, 5%); }
                }

                .cta-content-wrapper {
                    position: relative;
                    z-index: 1;
                }

                .cta-icon {
                    font-size: 3rem;
                    margin-bottom: 20px;
                    filter: drop-shadow(0 4px 16px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4));
                }

                .cta-title {
                    font-size: clamp(1.75rem, 4vw, 2.5rem);
                    font-weight: 700;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, var(--color-primary, #8b7fff), var(--color-secondary, #fbbf24));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .cta-description {
                    font-size: clamp(1rem, 2vw, 1.125rem);
                    color: var(--color-text-secondary, #9ca3af);
                    max-width: 600px;
                    margin: 0 auto 32px;
                    line-height: 1.7;
                }

                .cta-actions {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .landing-btn-outline {
                    background: transparent;
                    border: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.5);
                    color: var(--color-primary, #8b7fff);
                }

                .landing-btn-outline:hover {
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.1);
                    border-color: var(--color-primary, #8b7fff);
                    transform: translateY(-3px);
                }

                .landing-btn-ghost {
                    background: transparent;
                    border: none;
                    color: var(--color-text-secondary, #9ca3af);
                    padding: 14px 20px;
                }

                .landing-btn-ghost:hover {
                    color: var(--color-primary, #8b7fff);
                }

                .landing-btn-ghost .btn-arrow {
                    transition: transform 0.2s ease;
                }

                .landing-btn-ghost:hover .btn-arrow {
                    transform: translateX(4px);
                }

                /* === Featured Entities Section === */
                .landing-featured-section {
                    margin-bottom: 64px;
                    opacity: 0;
                    animation: sectionFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    animation-delay: 0.3s;
                }

                @keyframes sectionFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .landing-featured-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                    margin-top: 24px;
                }

                .landing-featured-card {
                    position: relative;
                }

                .landing-featured-mythology {
                    display: inline-block;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--color-primary, #8b7fff);
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.15);
                    padding: 3px 8px;
                    border-radius: 4px;
                    margin-bottom: 6px;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                }

                /* === Responsive Design - Production Quality === */

                /* Mobile search adjustments */
                @media (max-width: 600px) {
                    .hero-search-input-wrapper {
                        flex-direction: column;
                        padding: 12px;
                        gap: 8px;
                    }

                    .hero-search-icon {
                        display: none;
                    }

                    .hero-search-input {
                        width: 100%;
                        padding: 12px;
                        text-align: center;
                    }

                    .hero-search-btn {
                        width: 100%;
                        justify-content: center;
                        padding: 14px 20px;
                    }

                    .hero-search-suggestions {
                        gap: 6px;
                    }

                    .search-suggestion-tag {
                        font-size: 0.75rem;
                        padding: 3px 10px;
                    }
                }

                /* Stats responsive */
                @media (max-width: 767px) {
                    .landing-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }

                    .landing-stat-card {
                        padding: 20px 16px;
                    }

                    .stat-icon {
                        font-size: 1.5rem;
                    }

                    .stat-number {
                        font-size: 1.75rem;
                    }

                    .stat-label {
                        font-size: 0.9rem;
                    }

                    .stat-description {
                        font-size: 0.75rem;
                    }

                    .landing-cta-section {
                        padding: 40px 20px;
                        margin: 40px 0 20px;
                    }

                    .cta-icon {
                        font-size: 2.5rem;
                    }

                    .cta-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .cta-btn {
                        width: 100%;
                        max-width: 280px;
                    }
                }

                @media (min-width: 768px) and (max-width: 1023px) {
                    .landing-stats-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (min-width: 1024px) {
                    .landing-stats-grid {
                        grid-template-columns: repeat(6, 1fr);
                    }
                }

                /* Extra Small Mobile (320px - 479px) - 2 columns */
                @media (max-width: 479px) {
                    .landing-page-view {
                        padding: 0 12px 32px;
                    }

                    .landing-hero-section {
                        padding: 40px 16px 32px;
                        margin-bottom: 32px;
                        border-radius: 20px;
                    }

                    .hero-icon-display {
                        width: 70px;
                        height: 70px;
                        margin-bottom: 16px;
                    }

                    .hero-eye-icon {
                        font-size: 2.5rem;
                    }

                    .hero-icon-ring {
                        inset: -6px;
                    }

                    .hero-icon-ring::before {
                        inset: -10px;
                    }

                    .title-line-1 {
                        font-size: 0.7em;
                    }

                    /* POLISHED: 2 columns on mobile */
                    .landing-category-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                    }

                    .landing-features-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }

                    .landing-category-card {
                        padding: 16px 14px;
                        min-height: 145px;
                    }

                    .landing-feature-card {
                        padding: 20px;
                        min-height: 160px;
                    }

                    /* POLISHED: Ensure touch targets are WCAG 2.1 AA compliant (44px minimum) */
                    .landing-category-card,
                    .landing-btn {
                        min-height: 44px;
                        touch-action: manipulation;
                    }

                    .landing-hero-actions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                        margin-top: 24px;
                    }

                    .landing-btn {
                        width: 100%;
                        justify-content: center;
                        padding: 14px 20px;
                        font-size: 0.95rem;
                    }

                    .landing-hero-title {
                        font-size: 2rem;
                    }

                    .landing-hero-subtitle {
                        font-size: 1rem;
                        margin-bottom: 16px;
                    }

                    .landing-hero-description {
                        font-size: 0.9rem;
                        margin-bottom: 24px;
                    }

                    .landing-section-header {
                        font-size: 1.4rem;
                        gap: 8px;
                    }

                    .landing-section-subtitle {
                        font-size: 0.9rem;
                    }

                    .landing-category-name {
                        font-size: 0.95rem;
                    }

                    .landing-category-description {
                        font-size: 0.8rem;
                        -webkit-line-clamp: 2;
                    }

                    /* POLISHED: Compact 40px icons on mobile */
                    .landing-category-icon,
                    .entity-icon-svg,
                    .landing-category-icon-fallback {
                        width: 40px;
                        height: 40px;
                        margin-bottom: 10px;
                    }

                    .landing-category-icon-fallback {
                        font-size: 1.75rem;
                    }

                    .landing-featured-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                    }
                }

                /* Mobile (480px - 767px) - 2 columns */
                @media (min-width: 480px) and (max-width: 767px) {
                    .landing-page-view {
                        padding: 0 16px 48px;
                    }

                    .landing-hero-section {
                        padding: 48px 24px;
                        margin-bottom: 40px;
                    }

                    /* POLISHED: 2 columns for category cards on mobile */
                    .landing-category-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 14px;
                    }

                    .landing-category-card {
                        min-height: 155px;
                        padding: 18px 16px;
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 14px;
                    }

                    .landing-feature-card {
                        padding: 20px;
                        min-height: 170px;
                    }

                    /* Ensure buttons are easily tappable */
                    .landing-btn {
                        min-height: 50px;
                        padding: 14px 26px;
                        touch-action: manipulation;
                    }

                    .landing-category-name {
                        font-size: 1rem;
                    }

                    .landing-category-description {
                        font-size: 0.85rem;
                        line-height: 1.5;
                    }

                    .landing-category-icon,
                    .entity-icon-svg,
                    .landing-category-icon-fallback {
                        width: 44px;
                        height: 44px;
                    }

                    .landing-featured-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 14px;
                    }
                }

                /* Tablet (768px - 899px) - 3 columns */
                @media (min-width: 768px) and (max-width: 899px) {
                    /* POLISHED: 3 columns on tablet */
                    .landing-category-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 16px;
                    }

                    .landing-category-card {
                        min-height: 170px;
                        padding: 22px 18px;
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 18px;
                    }

                    /* Touch targets for tablet */
                    .landing-btn {
                        min-height: 50px;
                        touch-action: manipulation;
                    }

                    .landing-featured-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 16px;
                    }
                }

                /* Large Tablet (900px - 1023px) - 3 columns */
                @media (min-width: 900px) and (max-width: 1023px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 18px;
                    }

                    .landing-category-card {
                        min-height: 175px;
                        padding: 22px 20px;
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 18px;
                    }

                    .landing-featured-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 18px;
                    }
                }

                /* Desktop (1024px - 1439px) - 4 columns */
                @media (min-width: 1024px) and (max-width: 1439px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 18px;
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }

                    .landing-featured-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 18px;
                    }
                }

                /* Large Desktop (1440px - 1919px) - 4 columns */
                @media (min-width: 1440px) and (max-width: 1919px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                /* Extra Large Desktop (1920px+) */
                @media (min-width: 1920px) {
                    .landing-page-view {
                        max-width: 1600px;
                    }

                    .landing-category-grid {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 32px; /* 4x8px grid */
                    }
                }

                /* === Accessibility - WCAG 2.1 AA Compliance === */

                /* POLISHED: Touch-friendly adjustments for mobile devices */
                @media (hover: none) and (pointer: coarse) {
                    .landing-btn {
                        min-height: 44px; /* WCAG 2.1 touch target minimum */
                        min-width: 44px;
                        padding: 16px 32px; /* 2x8px, 4x8px grid */
                        touch-action: manipulation; /* Disable double-tap zoom for faster response */
                    }

                    .landing-category-card {
                        min-height: 140px; /* Compact for mobile while maintaining touch area */
                        padding: 24px; /* 3x8px grid */
                        touch-action: manipulation;
                        /* Ensure entire card is clickable with adequate padding */
                        -webkit-tap-highlight-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.2);
                    }

                    /* Active state feedback for touch */
                    .landing-category-card:active {
                        transform: scale(0.98);
                        transition: transform 0.1s ease;
                    }

                    /* Increase tap targets */
                    .landing-category-icon,
                    .entity-icon-svg,
                    .landing-category-icon-fallback {
                        width: 48px;
                        height: 48px;
                    }

                    .landing-category-icon-fallback {
                        font-size: 2rem;
                    }

                    /* Ensure links have adequate touch targets */
                    .landing-hero-actions a {
                        min-height: 44px;
                        min-width: 44px;
                    }

                    /* Feature cards also need touch optimization */
                    .landing-feature-card {
                        touch-action: manipulation;
                        -webkit-tap-highlight-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.2);
                    }
                }

                /* Reduced Motion - Accessibility */
                @media (prefers-reduced-motion: reduce) {
                    *,
                    *::before,
                    *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }

                    .landing-page-view {
                        animation: none;
                    }

                    .hero-icon-display {
                        animation: none;
                    }

                    .landing-hero-title {
                        animation: none;
                    }

                    .landing-category-card {
                        animation: none;
                        opacity: 1;
                    }

                    .landing-category-card:hover,
                    .landing-feature-card:hover,
                    .landing-btn:hover,
                    .landing-btn:active {
                        transform: none;
                    }

                    .landing-category-card:hover .landing-category-icon,
                    .landing-category-card:hover .entity-icon-svg,
                    .landing-category-card:hover .landing-category-icon-fallback {
                        transform: none;
                    }
                }

                /* High Contrast Mode */
                @media (prefers-contrast: high) {
                    .landing-hero-section,
                    .landing-category-card,
                    .landing-feature-card {
                        border-width: 3px;
                    }

                    .landing-btn {
                        border-width: 3px;
                    }

                    .landing-btn-secondary {
                        border-width: 3px;
                    }
                }

                /* Dark Mode Adjustments (if needed beyond CSS vars) */
                @media (prefers-color-scheme: dark) {
                    .landing-hero-section,
                    .landing-category-card,
                    .landing-feature-card {
                        box-shadow:
                            0 8px 32px rgba(0, 0, 0, 0.5),
                            0 1px 1px rgba(255, 255, 255, 0.1) inset;
                    }
                }

                /* Print Styles */
                @media print {
                    .landing-page-view {
                        max-width: 100%;
                        padding: 0;
                    }

                    .landing-hero-section,
                    .landing-category-card,
                    .landing-feature-card {
                        background: white;
                        border: 1px solid #000;
                        backdrop-filter: none;
                        box-shadow: none;
                        page-break-inside: avoid;
                    }

                    .landing-btn {
                        display: none;
                    }
                }

                /* Focus visible for keyboard navigation */
                .landing-btn:focus-visible,
                .landing-category-card:focus-visible {
                    outline: 3px solid var(--color-primary, #8b7fff);
                    outline-offset: 4px;
                }

                /* Performance: Lazy loading images */
                .landing-category-icon[loading="lazy"] {
                    content-visibility: auto;
                }
            </style>
        `;
    }

    /**
     * Escape HTML special characters to prevent XSS
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Emoji fallbacks for each category (used when SVG icons fail to load)
     */
    getEmojiFallbacks() {
        return {
            mythologies: '&#127759;', // Globe
            deities: '&#128081;',    // Crown
            heroes: '&#129464;',     // Superhero
            creatures: '&#128009;',  // Dragon
            items: '&#9876;',        // Sword
            places: '&#127963;',     // Temple
            archetypes: '&#127917;', // Masks
            magic: '&#10024;',       // Sparkles
            herbs: '&#127807;',      // Herb
            rituals: '&#128367;',    // Candle
            texts: '&#128220;',      // Scroll
            symbols: '&#9775;'       // Yin Yang
        };
    }

    /**
     * Truncate text to a maximum length with ellipsis
     * @param {string} text - The text to truncate
     * @param {number} maxLength - Maximum character length (default 100 for descriptions)
     * @returns {string} - Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        // Find last space before maxLength to avoid cutting words
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.7) {
            return truncated.substring(0, lastSpace) + '...';
        }
        return truncated + '...';
    }

    /**
     * Render icon HTML with support for inline SVG, URL paths, and emoji fallbacks
     * @param {string} icon - Icon source (inline SVG, URL path, or emoji)
     * @param {string} fallbackId - Category ID for emoji fallback lookup
     * @param {string} cssClass - CSS class for the icon element
     * @returns {string} - HTML string for the icon
     */
    renderIconHTML(icon, fallbackId, cssClass = 'landing-category-icon') {
        const emojiFallback = this.getEmojiFallbacks()[fallbackId] || '&#128196;';

        // Check if icon is inline SVG (starts with <svg)
        if (icon && typeof icon === 'string' && icon.trim().startsWith('<svg')) {
            return `
                <span class="entity-icon-svg ${cssClass}" aria-hidden="true">${icon}</span>
                <span class="landing-category-icon-fallback" style="display: none;" aria-hidden="true">${emojiFallback}</span>
            `;
        }

        // Check if icon is an emoji (single character or emoji sequence)
        if (icon && typeof icon === 'string' && !icon.includes('/') && !icon.includes('.')) {
            // Likely an emoji or short text, render directly
            return `
                <span class="landing-category-icon-fallback" aria-hidden="true">${icon}</span>
            `;
        }

        // Default: treat as URL path with img tag and fallback
        return `
            <img src="${icon}"
                 alt=""
                 class="${cssClass}"
                 loading="lazy"
                 decoding="async"
                 aria-hidden="true"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <span class="landing-category-icon-fallback" style="display: none;" aria-hidden="true">${emojiFallback}</span>
        `;
    }

    /**
     * Get asset type card HTML
     * Renders SVG icons with error handling and emoji fallbacks
     * @param {object} type - Asset type configuration
     * @param {number} index - Card index for staggered animation
     */
    getAssetTypeCardHTML(type, index = 0) {
        const truncatedDescription = this.truncateText(type.description, 100);

        // Context menu data for long-press on mobile
        const contextMenuItems = JSON.stringify([
            { icon: '&#128279;', label: 'Copy Link', action: 'copy-link' },
            { icon: '&#128203;', label: 'Share', action: 'share' },
            { icon: '&#11088;', label: 'Add to Favorites', action: 'favorite' }
        ]).replace(/"/g, '&quot;');

        return `
            <a href="${type.route}"
               class="landing-category-card touch-ripple"
               data-type="${type.id}"
               data-context-menu="category"
               data-context-menu-items="${contextMenuItems}"
               style="--card-color: ${type.color}; --card-index: ${index};"
               aria-label="${type.name} - ${truncatedDescription}"
               tabindex="0">
                ${this.renderIconHTML(type.icon, type.id, 'landing-category-icon')}
                <h3 class="landing-category-name card-title-truncate">${type.name}</h3>
                <p class="landing-category-description card-desc-truncate">${truncatedDescription}</p>
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

            // Add keyboard support for Enter key
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });

            // Listen for custom context menu events
            card.addEventListener('add-to-favorites', (e) => {
                const type = card.dataset.type;
                console.log('[Landing Page] Adding to favorites:', type);
                // Could integrate with a favorites service here
                this.showToast(`Added ${type} to favorites`);
            });

            card.addEventListener('quick-view', (e) => {
                const type = card.dataset.type;
                console.log('[Landing Page] Quick view:', type);
                // Could show a modal preview here
            });
        });

        // Hero search form handling
        const searchForm = document.querySelector('.hero-search-form');
        const searchInput = document.getElementById('heroSearchInput');
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
                }
            });

            // Enter key handling
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchForm.dispatchEvent(new Event('submit'));
                }
            });
        }

        // Listen for pull-to-refresh event
        document.addEventListener('pull-to-refresh', async () => {
            console.log('[Landing Page] Pull-to-refresh triggered');
            await this.handleRefresh();
        });

        // Load featured entities if database is available
        this.loadFeaturedEntities();

        // Load recent additions
        this.loadRecentAdditions();

        // Load real stats from database
        this.loadStats();

        // Mark images as loaded for lazy loading
        this.initLazyImages();
    }

    /**
     * Handle pull-to-refresh
     */
    async handleRefresh() {
        try {
            // Reload featured entities
            await this.loadFeaturedEntities();

            // Show success feedback
            this.showToast('Content refreshed');
        } catch (error) {
            console.error('[Landing Page] Refresh error:', error);
            this.showToast('Failed to refresh');
        }
    }

    /**
     * Initialize lazy loading for images
     */
    initLazyImages() {
        const images = document.querySelectorAll('.landing-category-icon[loading="lazy"]');
        images.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                img.addEventListener('error', () => {
                    img.classList.add('loaded'); // Still show, fallback will handle it
                });
            }
        });
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        // Use mobile gestures toast if available, otherwise create simple one
        if (window.mobileGestures && window.mobileGestures.showToast) {
            window.mobileGestures.showToast(message);
        } else {
            const toast = document.createElement('div');
            toast.className = 'simple-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(26, 31, 58, 0.95);
                color: #f8f9fa;
                padding: 0.875rem 1.5rem;
                border-radius: 12px;
                font-size: 0.9375rem;
                z-index: 10002;
                animation: fadeIn 0.3s ease;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    }

    /**
     * Load featured entities from the database and display them
     */
    async loadFeaturedEntities() {
        const featuredSection = document.getElementById('featured-entities-section');
        const featuredGrid = document.getElementById('featured-entities-grid');

        if (!featuredSection || !featuredGrid || !this.db) {
            console.log('[Landing Page] Featured entities section not available or no database');
            return;
        }

        try {
            // Attempt to load featured deities and creatures
            const featuredEntities = [];

            // Try to get some featured deities
            const deitiesRef = this.db.collection('deities');
            const deitiesSnapshot = await deitiesRef.limit(4).get();

            deitiesSnapshot.forEach(doc => {
                featuredEntities.push({
                    id: doc.id,
                    type: 'deities',
                    ...doc.data()
                });
            });

            // Try to get some featured creatures
            const creaturesRef = this.db.collection('creatures');
            const creaturesSnapshot = await creaturesRef.limit(4).get();

            creaturesSnapshot.forEach(doc => {
                featuredEntities.push({
                    id: doc.id,
                    type: 'creatures',
                    ...doc.data()
                });
            });

            if (featuredEntities.length > 0) {
                // Render featured entities
                featuredGrid.innerHTML = featuredEntities.map((entity, index) => this.getFeaturedEntityCardHTML(entity, index)).join('');
                featuredSection.style.display = 'block';
                console.log('[Landing Page] Loaded', featuredEntities.length, 'featured entities');
            }
        } catch (error) {
            console.warn('[Landing Page] Could not load featured entities:', error.message);
            // Hide section if loading fails
            featuredSection.style.display = 'none';
        }
    }

    /**
     * Get HTML for a featured entity card
     * @param {object} entity - Entity data
     * @param {number} index - Card index for animation delay
     */
    getFeaturedEntityCardHTML(entity, index = 0) {
        const name = entity.name || entity.title || entity.id || 'Unknown';
        const description = this.truncateText(entity.description || entity.summary || '', 80);
        const mythology = entity.mythology || entity.tradition || '';
        const icon = entity.icon || this.getEmojiFallbacks()[entity.type] || '&#128196;';
        const route = `#/${entity.type}/${entity.id}`;

        return `
            <a href="${route}"
               class="landing-featured-card landing-category-card"
               style="--card-color: var(--color-primary, #8b7fff); --card-index: ${index};"
               aria-label="${name}${mythology ? ' - ' + mythology : ''}">
                ${this.renderIconHTML(icon, entity.type, 'landing-category-icon')}
                <h3 class="landing-category-name card-title-truncate">${this.escapeHTML(name)}</h3>
                ${mythology ? `<span class="landing-featured-mythology">${this.escapeHTML(mythology)}</span>` : ''}
                ${description ? `<p class="landing-category-description card-desc-truncate">${this.escapeHTML(description)}</p>` : ''}
            </a>
        `;
    }

    /**
     * Load stats from database and update the display
     */
    async loadStats() {
        if (!this.db) {
            console.log('[Landing Page] No database available for stats');
            return;
        }

        try {
            const collections = ['mythologies', 'deities', 'creatures', 'items', 'texts'];
            const statElements = {
                'mythologies': document.getElementById('stat-mythologies'),
                'deities': document.getElementById('stat-deities'),
                'creatures': document.getElementById('stat-creatures'),
                'items': document.getElementById('stat-items'),
                'texts': document.getElementById('stat-texts')
            };

            // Load counts for each collection
            for (const collection of collections) {
                try {
                    const snapshot = await this.db.collection(collection).get();
                    const count = snapshot.size;
                    const el = statElements[collection];
                    if (el && count > 0) {
                        // Animate number counting up
                        this.animateNumber(el, count);
                    }
                } catch (err) {
                    console.warn(`[Landing Page] Could not get ${collection} count:`, err.message);
                }
            }

            console.log('[Landing Page] Stats loaded');
        } catch (error) {
            console.warn('[Landing Page] Could not load stats:', error.message);
        }
    }

    /**
     * Animate a number counting up
     * @param {HTMLElement} element - Element to update
     * @param {number} target - Target number
     */
    animateNumber(element, target) {
        const duration = 1500;
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (target - startValue) * easeOut);

            element.textContent = current.toLocaleString() + '+';

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toLocaleString() + '+';
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Load recent additions and display them
     */
    async loadRecentAdditions() {
        const recentSection = document.getElementById('recent-additions-section');
        const recentGrid = document.getElementById('recent-additions-grid');

        if (!recentSection || !recentGrid || !this.db) {
            console.log('[Landing Page] Recent additions section not available or no database');
            return;
        }

        try {
            const recentEntities = [];
            const collections = ['deities', 'creatures', 'heroes', 'items'];

            // Try to get recently added entities from various collections
            for (const collectionName of collections) {
                try {
                    const ref = this.db.collection(collectionName)
                        .orderBy('createdAt', 'desc')
                        .limit(2);
                    const snapshot = await ref.get();

                    snapshot.forEach(doc => {
                        recentEntities.push({
                            id: doc.id,
                            type: collectionName,
                            ...doc.data()
                        });
                    });
                } catch (err) {
                    // Some collections might not have createdAt, try without ordering
                    try {
                        const ref = this.db.collection(collectionName).limit(2);
                        const snapshot = await ref.get();
                        snapshot.forEach(doc => {
                            recentEntities.push({
                                id: doc.id,
                                type: collectionName,
                                ...doc.data()
                            });
                        });
                    } catch (innerErr) {
                        console.warn(`[Landing Page] Could not load recent ${collectionName}`);
                    }
                }
            }

            if (recentEntities.length > 0) {
                // Sort by createdAt if available, limit to 8
                const sorted = recentEntities
                    .sort((a, b) => {
                        const aTime = a.createdAt?.toMillis?.() || 0;
                        const bTime = b.createdAt?.toMillis?.() || 0;
                        return bTime - aTime;
                    })
                    .slice(0, 8);

                recentGrid.innerHTML = sorted.map((entity, index) =>
                    this.getFeaturedEntityCardHTML(entity, index)
                ).join('');
                recentSection.style.display = 'block';
                console.log('[Landing Page] Loaded', sorted.length, 'recent additions');
            }
        } catch (error) {
            console.warn('[Landing Page] Could not load recent additions:', error.message);
            recentSection.style.display = 'none';
        }
    }
}

// Global export for non-module script loading
// Note: ES module export removed to prevent SyntaxError in non-module context
if (typeof window !== 'undefined') {
    window.LandingPageView = LandingPageView;
    console.log('[LandingPageView] Class registered globally');
}
