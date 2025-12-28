/**
 * Mythologies View
 * Displays a grid of all mythology traditions
 * Each mythology links to its detailed page
 */

class MythologiesView {
    constructor(firestore) {
        this.db = firestore;
        this.cache = window.cacheManager || new FirebaseCacheManager({ db: firestore });
        this.mythologies = [];
    }

    /**
     * Render mythologies grid
     */
    async render(container) {
        console.log('[Mythologies View] Rendering...');

        // Show loading
        container.innerHTML = this.getLoadingHTML();

        try {
            // Load mythologies
            await this.loadMythologies();

            // Render content
            container.innerHTML = this.getMythologiesHTML();
            this.attachEventListeners();

            // Hide loading spinner
            window.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { view: 'mythologies' }
            }));

        } catch (error) {
            console.error('[Mythologies View] Error:', error);
            this.showError(container, error);
        }
    }

    /**
     * Load mythologies from Firebase
     */
    async loadMythologies() {
        try {
            // Try cache first
            const cached = localStorage.getItem('mythologies_cache');
            if (cached) {
                const cache = JSON.parse(cached);
                if (Date.now() - cache.timestamp < 3600000) {
                    this.mythologies = cache.data;
                    console.log('[Mythologies View] Using cached data');
                }
            }

            // Fetch from Firebase
            const mythologies = await this.cache.getList('mythologies', {}, {
                ttl: 3600000,
                orderBy: 'order asc'
            });

            if (mythologies && mythologies.length > 0) {
                this.mythologies = mythologies;
                localStorage.setItem('mythologies_cache', JSON.stringify({
                    data: mythologies,
                    timestamp: Date.now()
                }));
            } else {
                // Use fallback
                this.mythologies = this.getFallbackMythologies();
            }

            console.log(`[Mythologies View] Loaded ${this.mythologies.length} mythologies`);

        } catch (error) {
            console.error('[Mythologies View] Error loading:', error);
            this.mythologies = this.getFallbackMythologies();
        }
    }

    /**
     * Get loading HTML
     */
    getLoadingHTML() {
        return `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading mythologies...</p>
            </div>
        `;
    }

    /**
     * Get mythologies grid HTML
     */
    getMythologiesHTML() {
        return `
            <div class="mythologies-view">
                <!-- Header -->
                <header class="mythologies-header">
                    <div class="header-icon">🏛️</div>
                    <div class="header-content">
                        <h1 class="page-title">World Mythologies</h1>
                        <p class="page-description">
                            Explore gods, heroes, and legends from cultures around the world.
                            Each mythology contains deities, creatures, sacred texts, and more.
                        </p>
                        <div class="mythology-stats">
                            <span class="stat">${this.mythologies.length} traditions</span>
                            <span class="stat">6000+ years of history</span>
                        </div>
                    </div>
                </header>

                <!-- Mythology Grid -->
                <div class="mythology-grid">
                    ${this.mythologies.map(myth => this.getMythologyCardHTML(myth)).join('')}
                </div>
            </div>

            <style>
                /* ===== MYTHOLOGIES VIEW STYLES ===== */
                /* Standardized to match VISUAL_CONSISTENCY_GUIDE.md */

                .mythologies-view {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 var(--spacing-xl, 2rem) var(--spacing-4xl, 4rem);
                }

                /* === Header Section === */
                .mythologies-header {
                    display: flex;
                    gap: var(--spacing-xl, 2rem);
                    align-items: center;
                    margin-bottom: var(--spacing-4xl, 4rem);
                    padding: var(--spacing-xl, 2rem);
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: var(--radius-2xl, 1.5rem);
                    border: 2px solid rgba(var(--color-border-primary-rgb, 42, 47, 74), 0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .header-icon {
                    font-size: 4rem;
                    filter: drop-shadow(0 4px 8px rgba(var(--color-primary-rgb, 139, 127, 255), 0.4));
                    line-height: 1;
                }

                .header-content {
                    flex: 1;
                }

                .page-title {
                    font-family: var(--font-heading, Georgia, serif);
                    font-size: clamp(1.75rem, 4vw, 2.5rem);
                    margin: 0 0 var(--spacing-sm, 0.5rem) 0;
                    color: var(--color-text-primary, #e5e7eb);
                    font-weight: var(--font-bold, 700);
                }

                .page-description {
                    color: var(--color-text-secondary, #9ca3af);
                    font-size: clamp(0.95rem, 2vw, 1.1rem);
                    margin: 0 0 var(--spacing-lg, 1.5rem) 0;
                    line-height: var(--leading-relaxed, 1.75);
                }

                .mythology-stats {
                    display: flex;
                    gap: var(--spacing-xl, 2rem);
                    flex-wrap: wrap;
                }

                .stat {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                    color: var(--color-primary, #8b7fff);
                    font-weight: var(--font-semibold, 600);
                    font-size: 1rem;
                }

                /* === Mythology Grid === */
                .mythology-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: var(--spacing-lg, 1.5rem);
                    margin-bottom: var(--spacing-3xl, 3rem);
                }

                /* === Mythology Cards === */
                .mythology-card {
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
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

                .mythology-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--card-color, linear-gradient(90deg, var(--color-primary), var(--color-secondary)));
                    transform: scaleX(0);
                    transition: transform var(--transition-base, 0.3s ease);
                }

                .mythology-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--card-color, var(--color-primary));
                    box-shadow: 0 12px 40px rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                    background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.8);
                }

                .mythology-card:hover::before {
                    transform: scaleX(1);
                }

                .mythology-icon {
                    width: 2rem;
                    height: 2rem;
                    margin-bottom: var(--spacing-md, 1rem);
                    display: block;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                    transition: transform var(--transition-base, 0.3s ease);
                    line-height: 1;
                    color: var(--card-color, var(--color-primary));
                    opacity: 0.9;
                }

                /* Support both emoji and SVG icons */
                .mythology-icon:not(img) {
                    font-size: 2rem;
                    width: auto;
                    height: auto;
                }

                .mythology-card:hover .mythology-icon {
                    transform: scale(1.15);
                    opacity: 1;
                    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))
                            drop-shadow(0 0 12px var(--card-color));
                }

                .mythology-name {
                    font-size: clamp(1.25rem, 2vw, 1.4rem);
                    font-weight: var(--font-semibold, 600);
                    margin-bottom: var(--spacing-sm, 0.5rem);
                    color: var(--color-text-primary, #e5e7eb);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    line-height: var(--leading-tight, 1.25);
                }

                .mythology-description {
                    font-size: clamp(0.875rem, 1.25vw, 0.95rem);
                    color: var(--color-text-secondary, #9ca3af);
                    line-height: var(--leading-normal, 1.6);
                    margin-bottom: var(--spacing-md, 1rem);
                    flex-grow: 1;
                }

                .mythology-counts {
                    display: flex;
                    gap: var(--spacing-md, 1rem);
                    font-size: clamp(0.75rem, 1vw, 0.85rem);
                    color: var(--color-text-secondary, #9ca3af);
                    flex-wrap: wrap;
                }

                .count-item {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs, 0.25rem);
                }

                /* === Responsive Design === */

                /* Mobile (320px - 767px) */
                @media (max-width: 767px) {
                    .mythologies-view {
                        padding: 0 var(--spacing-sm, 0.5rem) var(--spacing-xl, 2rem);
                    }

                    .mythologies-header {
                        flex-direction: column;
                        text-align: center;
                        padding: var(--spacing-lg, 1.5rem);
                        gap: var(--spacing-lg, 1.5rem);
                        margin-bottom: var(--spacing-xl, 2rem);
                    }

                    .header-icon {
                        font-size: 3rem;
                    }

                    .mythology-stats {
                        justify-content: center;
                    }

                    .mythology-grid {
                        grid-template-columns: 1fr;
                        gap: var(--spacing-md, 1rem);
                    }

                    .mythology-card {
                        padding: var(--spacing-md, 1rem);
                        min-height: 200px;
                    }

                    .mythology-icon {
                        font-size: 2rem;
                    }
                }

                /* Tablet (768px - 1023px) */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .mythology-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* Desktop (1024px+) */
                @media (min-width: 1024px) {
                    .mythology-grid {
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    }
                }

                /* Large Desktop (1400px+) */
                @media (min-width: 1400px) {
                    .mythology-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    }
                }

                /* Touch-friendly adjustments */
                @media (hover: none) and (pointer: coarse) {
                    .mythology-card {
                        min-height: 200px;
                    }
                }

                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .mythology-card,
                    .mythology-card::before,
                    .mythology-icon {
                        transition: none;
                        animation: none;
                    }

                    .mythology-card:hover {
                        transform: none;
                    }

                    .mythology-card:hover .mythology-icon {
                        transform: none;
                    }
                }

                /* High contrast mode */
                @media (prefers-contrast: high) {
                    .mythology-card,
                    .mythologies-header {
                        border-width: 3px;
                    }
                }
            </style>
        `;
    }

    /**
     * Get mythology card HTML
     */
    getMythologyCardHTML(mythology) {
        const color = mythology.color || '#8b7fff';
        const counts = mythology.counts || { deities: 0, heroes: 0, creatures: 0 };

        // Check if icon is SVG path or emoji
        const isSvgIcon = mythology.icon && mythology.icon.includes('/');
        const iconHTML = isSvgIcon
            ? `<img src="${mythology.icon}" alt="${mythology.name} icon" class="mythology-icon" loading="lazy" />`
            : `<span class="mythology-icon">${mythology.icon || '📖'}</span>`;

        return `
            <a href="#/mythology/${mythology.id}"
               class="mythology-card"
               data-mythology="${mythology.id}"
               style="--card-color: ${color}">
                ${iconHTML}
                <h3 class="mythology-name">${mythology.name}</h3>
                <p class="mythology-description">${mythology.description}</p>
                ${counts.deities || counts.heroes || counts.creatures ? `
                    <div class="mythology-counts">
                        ${counts.deities ? `<span class="count-item">⚡ ${counts.deities}</span>` : ''}
                        ${counts.heroes ? `<span class="count-item">🗡️ ${counts.heroes}</span>` : ''}
                        ${counts.creatures ? `<span class="count-item">🐉 ${counts.creatures}</span>` : ''}
                    </div>
                ` : ''}
            </a>
        `;
    }

    /**
     * Get fallback mythologies
     */
    getFallbackMythologies() {
        return [
            { id: 'greek', name: 'Greek Mythology', icon: '🏛️', description: 'Gods of Olympus and heroes of ancient Greece', color: '#8b7fff', order: 1 },
            { id: 'norse', name: 'Norse Mythology', icon: '⚔️', description: 'Warriors of Asgard and the Nine Realms', color: '#4a9eff', order: 2 },
            { id: 'egyptian', name: 'Egyptian Mythology', icon: '𓂀', description: 'Keepers of the Nile and guardians of Ma\'at', color: '#ffd93d', order: 3 },
            { id: 'hindu', name: 'Hindu Mythology', icon: '🕉️', description: 'The Trimurti and cosmic cycles of creation', color: '#ff7eb6', order: 4 },
            { id: 'buddhist', name: 'Buddhist Tradition', icon: '☸️', description: 'Bodhisattvas and the path to enlightenment', color: '#51cf66', order: 5 },
            { id: 'chinese', name: 'Chinese Mythology', icon: '🐉', description: 'Dragons, immortals, and celestial bureaucracy', color: '#f85a8f', order: 6 },
            { id: 'japanese', name: 'Japanese Mythology', icon: '⛩️', description: 'Kami spirits and the creation of Japan', color: '#fb9f7f', order: 7 },
            { id: 'celtic', name: 'Celtic Mythology', icon: '🍀', description: 'Druids, faeries, and the Tuatha Dé Danann', color: '#7fd9d3', order: 8 },
            { id: 'babylonian', name: 'Babylonian Mythology', icon: '🏛️', description: 'The Enuma Elish and gods of Mesopotamia', color: '#b965e6', order: 9 },
            { id: 'persian', name: 'Persian Mythology', icon: '🔥', description: 'Zoroastrian wisdom and the eternal flame', color: '#7fb0f9', order: 10 },
            { id: 'christian', name: 'Christian Tradition', icon: '✟', description: 'Angels, saints, and biblical narratives', color: '#a8edea', order: 11 },
            { id: 'islamic', name: 'Islamic Tradition', icon: '☪️', description: 'Prophets, angels, and divine revelation', color: '#fed6e3', order: 12 },
            { id: 'roman', name: 'Roman Mythology', icon: '🏺', description: 'Gods and goddesses of ancient Rome', color: '#ff6b9d', order: 13 },
            { id: 'sumerian', name: 'Sumerian Mythology', icon: '📜', description: 'The oldest known mythology from ancient Sumer', color: '#c996ff', order: 14 },
            { id: 'aztec', name: 'Aztec Mythology', icon: '🌞', description: 'Gods of the sun and human sacrifice', color: '#ffd43b', order: 15 },
            { id: 'mayan', name: 'Mayan Mythology', icon: '🗿', description: 'Popol Vuh and the Hero Twins', color: '#74c0fc', order: 16 },
            { id: 'native_american', name: 'Native American', icon: '🦅', description: 'Spirits of nature and tribal traditions', color: '#96f2d7', order: 17 },
            { id: 'yoruba', name: 'Yoruba Mythology', icon: '👑', description: 'Orishas and African spiritual traditions', color: '#ffc078', order: 18 },
            { id: 'jewish', name: 'Jewish Tradition', icon: '✡️', description: 'Torah, Talmud, and Kabbalistic wisdom', color: '#91a7ff', order: 19 },
            { id: 'tarot', name: 'Tarot Tradition', icon: '🎴', description: 'Arcana and symbolic divination', color: '#da77f2', order: 20 },
            { id: 'apocryphal', name: 'Apocryphal Texts', icon: '📖', description: 'Hidden texts and esoteric traditions', color: '#868e96', order: 21 },
            { id: 'comparative', name: 'Comparative Mythology', icon: '⚖️', description: 'Cross-cultural patterns and universal themes', color: '#20c997', order: 22 }
        ];
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const cards = document.querySelectorAll('.mythology-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const mythology = card.dataset.mythology;
                console.log('[Mythologies View] Selected:', mythology);
            });
        });
    }

    /**
     * Show error
     */
    showError(container, error) {
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h2>Failed to Load Mythologies</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn-primary">Retry</button>
            </div>
        `;
    }
}

// ES Module Export
export { MythologiesView };

// Legacy global export
if (typeof window !== 'undefined') {
    window.MythologiesView = MythologiesView;
}
