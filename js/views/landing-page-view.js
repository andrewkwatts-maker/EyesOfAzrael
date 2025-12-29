/**
 * Landing Page View - Production Quality
 * Displays asset type categories (mythologies, items, archetypes, places, magic, etc.)
 * in a polished, accessible grid layout with smooth animations.
 *
 * Features:
 * - Golden ratio typography (1.618)
 * - Cubic-bezier micro-animations
 * - 8px grid spacing system
 * - Enhanced glass-morphism
 * - Skeleton loading states
 * - WCAG 2.1 AA compliance
 * - Performance optimized (lazy loading, CSS containment)
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
            console.log('[Landing Page] Container valid:', container.tagName);

            // RENDER IMMEDIATELY - no skeleton delay (prevents race condition with lazy loader)
            console.log('[Landing Page] Setting final HTML...');
            container.innerHTML = this.getLandingHTML();
            container.classList.remove('has-skeleton', 'content-loading');
            container.classList.add('content-loaded');

            // FORCE body to authenticated state FIRST (before setting styles)
            // This is critical - CSS uses !important rules based on body class
            document.body.classList.add('authenticated');
            document.body.classList.remove('not-authenticated', 'auth-loading');
            console.log('[Landing Page] Body classes updated to authenticated');

            // Hide auth overlay if it exists (must come BEFORE showing content)
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

            // Force container and view to be visible with !important
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('display', 'block', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            console.log('[Landing Page] Container made visible');

            const view = container.querySelector('.landing-page-view');
            if (view) {
                view.style.setProperty('opacity', '1', 'important');
                view.style.setProperty('display', 'block', 'important');
                view.style.setProperty('visibility', 'visible', 'important');
                console.log('[Landing Page] View element made visible');
            } else {
                console.warn('[Landing Page] WARNING: .landing-page-view element not found in container');
            }

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
                    <div class="error-container" style="padding: 2rem; text-align: center; color: #ef4444;">
                        <h2>Error Loading Landing Page</h2>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                `;
            }
            throw error; // Re-throw so SPA can catch it too
        }
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
                /* ===== LANDING PAGE STYLES - PRODUCTION QUALITY ===== */
                /*
                 * Design System:
                 * - Golden Ratio Typography: 1.618
                 * - 8px Grid Spacing System
                 * - Cubic-Bezier Easing: cubic-bezier(0.4, 0, 0.2, 1)
                 * - Enhanced Glass-morphism with multiple blur layers
                 * - WCAG 2.1 AA Compliant
                 * - Performance optimized with CSS containment
                 */

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
                }

                /* === Hero Section - Enhanced Glass-morphism === */
                .landing-hero-section {
                    /* Multi-layer glass effect */
                    background:
                        linear-gradient(135deg,
                            rgba(var(--color-primary-rgb, 139, 127, 255), 0.15),
                            rgba(var(--color-secondary-rgb, 251, 191, 36), 0.1)),
                        linear-gradient(180deg,
                            rgba(255, 255, 255, 0.05),
                            transparent);

                    border: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    border-radius: 24px; /* 3x8px grid */
                    padding: 64px 32px; /* 8x8px, 4x8px grid */
                    text-align: center;
                    margin-bottom: 64px; /* 8x8px grid */
                    position: relative;
                    overflow: hidden;
                    contain: layout style paint;

                    /* Enhanced glass-morphism */
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);

                    /* Layered shadows for depth */
                    box-shadow:
                        0 8px 32px rgba(0, 0, 0, 0.3),
                        0 1px 1px rgba(255, 255, 255, 0.1) inset,
                        0 0 80px rgba(var(--color-primary-rgb, 139, 127, 255), 0.1);

                    /* Performance optimization */
                    will-change: transform;
                }

                /* Subtle gradient overlay for depth */
                .landing-hero-section::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        circle at top center,
                        rgba(var(--color-primary-rgb, 139, 127, 255), 0.1),
                        transparent 70%
                    );
                    pointer-events: none;
                    z-index: 0;
                }

                .landing-hero-section > * {
                    position: relative;
                    z-index: 1;
                }

                /* Hero Icon - Smooth Float Animation */
                .hero-icon-display {
                    font-size: clamp(3.5rem, 7vw, 5rem); /* Golden ratio from base */
                    margin-bottom: 16px; /* 2x8px grid */
                    filter: drop-shadow(0 4px 12px rgba(var(--color-primary-rgb, 139, 127, 255), 0.6))
                            drop-shadow(0 0 24px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3));
                    animation: smoothFloat 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    will-change: transform;
                    line-height: 1;
                    display: inline-block;
                }

                @keyframes smoothFloat {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        transform: translateY(-12px) scale(1.02);
                    }
                }

                /* Hero Title - Golden Ratio Typography */
                .landing-hero-title {
                    font-family: var(--font-heading, Georgia, serif);
                    /* Golden ratio: base 2rem × 1.618³ ≈ 3.5rem */
                    font-size: clamp(2.618rem, 6vw, 4.236rem);
                    font-weight: 700;
                    margin-bottom: 16px; /* 2x8px grid */
                    letter-spacing: -0.02em;
                    line-height: 1.1;

                    /* Vibrant gradient text */
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

                    /* Enhanced glow effect */
                    filter: drop-shadow(0 2px 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4))
                            drop-shadow(0 0 24px rgba(var(--color-primary-rgb, 139, 127, 255), 0.2));

                    animation: gradientShift 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                /* Hero Subtitle - Golden Ratio */
                .landing-hero-subtitle {
                    /* Golden ratio: base 1rem × 1.618 ≈ 1.618rem */
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

                /* Buttons - Smooth Micro-animations */
                .landing-btn {
                    font-family: var(--font-primary, sans-serif);
                    font-weight: 600;
                    padding: 16px 32px; /* 2x8px, 4x8px grid */
                    border-radius: 12px; /* 1.5x8px grid */
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px; /* 1x8px grid */
                    min-height: 48px; /* WCAG 2.1 AA touch target */
                    min-width: 48px;
                    position: relative;
                    overflow: hidden;
                    contain: layout style paint;

                    /* Smooth cubic-bezier transitions */
                    transition:
                        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        color 0.3s cubic-bezier(0.4, 0, 0.2, 1);

                    will-change: transform;
                }

                /* Ripple effect on click */
                .landing-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    opacity: 0;
                    transform: scale(0);
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                                opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
                        var(--color-secondary, #fbbf24) 100%
                    );
                    color: white;
                    font-weight: 600;
                    box-shadow:
                        0 4px 16px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3),
                        0 2px 8px rgba(0, 0, 0, 0.2);
                }

                .landing-btn-primary:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow:
                        0 8px 32px rgba(var(--color-primary-rgb, 139, 127, 255), 0.5),
                        0 4px 16px rgba(0, 0, 0, 0.3),
                        0 0 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.2);
                }

                .landing-btn-primary:active {
                    transform: translateY(-1px) scale(0.98);
                }

                /* Secondary Button - Glass morphism */
                .landing-btn-secondary {
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.1);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 2px solid rgba(var(--color-primary-rgb, 139, 127, 255), 0.5);
                    color: var(--color-primary, #8b7fff);
                    font-weight: 600;
                }

                .landing-btn-secondary:hover {
                    background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.2);
                    border-color: var(--color-primary, #8b7fff);
                    transform: translateY(-3px) scale(1.02);
                    box-shadow:
                        0 8px 32px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3),
                        0 4px 16px rgba(0, 0, 0, 0.2);
                }

                .landing-btn-secondary:active {
                    transform: translateY(-1px) scale(0.98);
                }

                /* === Categories Section === */
                .landing-categories-section {
                    margin-bottom: 80px; /* 10x8px grid */
                }

                /* Section Header - Golden Ratio */
                .landing-section-header {
                    /* Golden ratio: base 1.25rem × 1.618 ≈ 2rem */
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

                /* Category Cards - Compact Glass-morphism Panels */
                .landing-category-card {
                    /* Multi-layer glass effect */
                    background:
                        linear-gradient(135deg,
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.7),
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5));

                    backdrop-filter: blur(16px) saturate(150%);
                    -webkit-backdrop-filter: blur(16px) saturate(150%);

                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.5);
                    border-radius: 12px; /* Slightly smaller radius for compact look */
                    padding: 20px; /* Reduced padding for compact cards */
                    text-decoration: none;
                    color: inherit;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    min-height: 150px; /* Reduced from 200px for compact sizing */
                    display: flex;
                    flex-direction: column;
                    contain: layout style paint;

                    /* Smooth cubic-bezier transitions */
                    transition:
                        transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        background 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);

                    /* Layered shadows */
                    box-shadow:
                        0 4px 16px rgba(0, 0, 0, 0.15),
                        0 1px 1px rgba(255, 255, 255, 0.05) inset;

                    will-change: transform;
                }

                /* Top accent bar - animated on hover */
                .landing-category-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--card-color), transparent);
                    transform: scaleX(0);
                    transform-origin: left;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Subtle glow overlay */
                .landing-category-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        circle at top left,
                        rgba(255, 255, 255, 0.08),
                        transparent 50%
                    );
                    opacity: 0;
                    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                }

                .landing-category-card:hover::after {
                    opacity: 1;
                }

                /* Enhanced hover state */
                .landing-category-card:hover {
                    transform: translateY(-10px) scale(1.01);
                    border-color: var(--card-color);
                    background:
                        linear-gradient(135deg,
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.85),
                            rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.7));
                    box-shadow:
                        0 16px 48px rgba(0, 0, 0, 0.25),
                        0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                        0 0 40px -10px var(--card-color);
                }

                .landing-category-card:hover::before {
                    transform: scaleX(1);
                }

                .landing-category-card:active {
                    transform: translateY(-6px) scale(0.99);
                }

                /* Ensure content is above pseudo-elements */
                .landing-category-card > * {
                    position: relative;
                    z-index: 1;
                }

                /* SVG Icon - Compact sizing for panel layout */
                .landing-category-icon {
                    width: clamp(2rem, 3vw, 2.5rem); /* Smaller icon for compact cards */
                    height: clamp(2rem, 3vw, 2.5rem);
                    margin-bottom: 12px; /* Reduced margin */
                    display: block;
                    object-fit: contain;
                    opacity: 0.9;

                    /* Color theming for SVG */
                    filter:
                        drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))
                        drop-shadow(0 0 12px var(--card-color));

                    transition:
                        transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                        filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);

                    will-change: transform;
                }

                .landing-category-card:hover .landing-category-icon {
                    transform: scale(1.15) rotateZ(5deg);
                    opacity: 1;
                    filter:
                        drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))
                        drop-shadow(0 0 24px var(--card-color))
                        brightness(1.1);
                }

                /* Category Name - Compact sizing */
                .landing-category-name {
                    font-size: clamp(1rem, 2vw, 1.125rem); /* Compact for panel layout */
                    font-weight: 600;
                    margin-bottom: 6px; /* Tighter spacing */
                    color: var(--color-text-primary, #e5e7eb);
                    letter-spacing: -0.01em;
                    line-height: 1.25;
                    text-shadow:
                        0 1px 4px rgba(0, 0, 0, 0.4),
                        0 0 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.1);

                    transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .landing-category-card:hover .landing-category-name {
                    color: var(--card-color, var(--color-text-primary));
                }

                /* Category Description - Compact */
                .landing-category-description {
                    /* Smaller for compact cards, maintaining readability */
                    font-size: clamp(0.8125rem, 1.25vw, 0.9375rem); /* 13-15px range */
                    color: var(--color-text-secondary, #9ca3af);
                    line-height: 1.5; /* Tighter line height */
                    flex-grow: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    /* Limit to 2-3 lines for compact appearance */
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
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

                /* Feature Cards - Subtle Glass */
                .landing-feature-card {
                    text-align: center;
                    padding: 32px; /* 4x8px grid */
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.3);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 16px; /* 2x8px grid */
                    border: 1px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.3);
                    contain: layout style paint;

                    transition:
                        background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .landing-feature-card:hover {
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5);
                    border-color: rgba(var(--color-primary-rgb, 139, 127, 255), 0.5);
                    transform: translateY(-6px);
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

                /* === Responsive Design - Production Quality === */

                /* Extra Small Mobile (320px - 479px) */
                @media (max-width: 479px) {
                    .landing-page-view {
                        padding: 0 12px 32px; /* Increased from 8px for better edge spacing */
                    }

                    .landing-hero-section {
                        padding: 32px 16px; /* Reduced top padding for small screens */
                        margin-bottom: 32px; /* 4x8px grid */
                        border-radius: 16px; /* 2x8px grid */
                    }

                    .landing-category-grid,
                    .landing-features-grid {
                        grid-template-columns: 1fr;
                        gap: 12px; /* Tighter gap on very small screens */
                    }

                    .landing-category-card {
                        padding: 20px; /* Slightly reduced padding */
                        min-height: 160px; /* Reduced height for mobile */
                    }

                    .landing-feature-card {
                        padding: 20px;
                    }

                    /* Ensure touch targets are WCAG 2.1 AA compliant (48px minimum) */
                    .landing-category-card,
                    .landing-btn {
                        min-height: 48px;
                        /* Ensure adequate touch target with padding */
                        touch-action: manipulation;
                    }

                    .landing-hero-actions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px; /* 1.5x8px grid */
                    }

                    .landing-btn {
                        width: 100%;
                        justify-content: center;
                        padding: 14px 24px; /* Ensure comfortable tap target */
                        font-size: 1rem; /* Maintain readability */
                    }

                    /* Ensure text remains readable on small screens */
                    .landing-hero-title {
                        font-size: 1.75rem; /* Explicit small screen size */
                    }

                    .landing-hero-subtitle {
                        font-size: 1.125rem;
                    }

                    .landing-section-header {
                        font-size: 1.5rem;
                        gap: 8px;
                    }

                    .landing-category-name {
                        font-size: 1.125rem; /* Ensure readable on small screens */
                    }

                    .landing-category-icon {
                        width: 2.5rem;
                        height: 2.5rem;
                        margin-bottom: 12px;
                    }
                }

                /* Mobile (480px - 767px) */
                @media (min-width: 480px) and (max-width: 767px) {
                    .landing-page-view {
                        padding: 0 16px 48px; /* 2x8px, 6x8px grid */
                    }

                    .landing-hero-section {
                        padding: 48px 24px; /* 6x8px, 3x8px grid */
                        margin-bottom: 48px; /* 6x8px grid */
                    }

                    /* Single column for category cards on mobile for readability */
                    .landing-category-grid {
                        grid-template-columns: 1fr;
                        gap: 16px; /* 2x8px grid */
                    }

                    .landing-category-card {
                        min-height: 140px; /* Compact but still touchable */
                        padding: 24px;
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px; /* 2x8px grid */
                    }

                    .landing-feature-card {
                        padding: 20px;
                        min-height: 180px;
                    }

                    /* Ensure buttons are easily tappable */
                    .landing-btn {
                        min-height: 48px;
                        padding: 14px 28px;
                        touch-action: manipulation;
                    }

                    /* Readable typography */
                    .landing-category-description {
                        font-size: 1rem;
                        line-height: 1.6;
                    }
                }

                /* Tablet (768px - 1023px) */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px; /* 2.5x8px grid */
                    }

                    .landing-category-card {
                        min-height: 180px;
                        padding: 28px;
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                    }

                    /* Touch targets for tablet */
                    .landing-btn {
                        min-height: 48px;
                        touch-action: manipulation;
                    }
                }

                /* Desktop (1024px - 1439px) */
                @media (min-width: 1024px) and (max-width: 1439px) {
                    .landing-category-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }

                    .landing-features-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                /* Large Desktop (1440px - 1919px) */
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

                /* Touch-friendly adjustments for mobile devices */
                @media (hover: none) and (pointer: coarse) {
                    .landing-btn {
                        min-height: 48px; /* WCAG 2.1 touch target minimum */
                        min-width: 48px;
                        padding: 16px 32px; /* 2x8px, 4x8px grid */
                        touch-action: manipulation; /* Disable double-tap zoom for faster response */
                    }

                    .landing-category-card {
                        min-height: 160px; /* Compact for mobile while maintaining touch area */
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
                    .landing-category-icon {
                        width: 3rem;
                        height: 3rem;
                    }

                    /* Ensure links have adequate touch targets */
                    .landing-hero-actions a {
                        min-height: 48px;
                        min-width: 48px;
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

                    .landing-category-card:hover,
                    .landing-feature-card:hover,
                    .landing-btn:hover,
                    .landing-btn:active {
                        transform: none;
                    }

                    .landing-category-card:hover .landing-category-icon {
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
     * Get skeleton loading HTML (shown while content loads)
     */
    getSkeletonHTML() {
        return `
            <div class="landing-page-view">
                <section class="landing-hero-section skeleton-loading">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-subtitle"></div>
                    <div class="skeleton-description"></div>
                </section>

                <section class="landing-categories-section">
                    <div class="skeleton-section-header"></div>
                    <div class="landing-category-grid">
                        ${Array(12).fill(0).map(() => `
                            <div class="landing-category-card skeleton-card">
                                <div class="skeleton-icon small"></div>
                                <div class="skeleton-text"></div>
                                <div class="skeleton-text short"></div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>

            <style>
                .skeleton-loading {
                    pointer-events: none;
                    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
                }

                .skeleton-loading.fade-out {
                    opacity: 0;
                    transform: scale(0.98);
                    pointer-events: none;
                }

                .skeleton-icon,
                .skeleton-icon.small,
                .skeleton-title,
                .skeleton-subtitle,
                .skeleton-description,
                .skeleton-section-header,
                .skeleton-text {
                    background: linear-gradient(
                        90deg,
                        rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5) 0%,
                        rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.8) 50%,
                        rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.5) 100%
                    );
                    background-size: 200% 100%;
                    animation: skeletonLoading 1.5s ease-in-out infinite;
                    border-radius: 8px;
                }

                @keyframes skeletonLoading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .skeleton-icon {
                    width: 5rem;
                    height: 5rem;
                    margin: 0 auto 16px;
                    border-radius: 50%;
                }

                .skeleton-icon.small {
                    width: 3rem;
                    height: 3rem;
                    margin-bottom: 16px;
                }

                .skeleton-title {
                    width: 60%;
                    height: 3rem;
                    margin: 0 auto 16px;
                }

                .skeleton-subtitle {
                    width: 80%;
                    height: 1.5rem;
                    margin: 0 auto 24px;
                }

                .skeleton-description {
                    width: 90%;
                    height: 1rem;
                    margin: 0 auto 8px;
                }

                .skeleton-section-header {
                    width: 40%;
                    height: 2rem;
                    margin: 0 auto 32px;
                }

                .skeleton-text {
                    width: 100%;
                    height: 1rem;
                    margin-bottom: 8px;
                }

                .skeleton-text.short {
                    width: 70%;
                }

                .skeleton-card {
                    pointer-events: none;
                }
            </style>
        `;
    }

    /**
     * Get asset type card HTML
     * Now renders SVG icons with proper styling and accessibility
     */
    getAssetTypeCardHTML(type) {
        return `
            <a href="${type.route}"
               class="landing-category-card"
               data-type="${type.id}"
               style="--card-color: ${type.color}"
               role="link"
               aria-label="Navigate to ${type.name}: ${type.description}">
                <img src="${type.icon}"
                     alt="${type.name} icon"
                     class="landing-category-icon"
                     loading="lazy"
                     decoding="async" />
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

// Global export for non-module script loading
// Note: ES module export removed to prevent SyntaxError in non-module context
if (typeof window !== 'undefined') {
    window.LandingPageView = LandingPageView;
    console.log('[LandingPageView] Class registered globally');
}
