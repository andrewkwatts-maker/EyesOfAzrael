/**
 * Mythologies View
 * Displays a grid of all mythology traditions
 * Each mythology links to its detailed page
 */

class MythologiesView {
    constructor(firestore) {
        this.db = firestore;
        // Use global cache manager if available, otherwise create one (with fallback)
        if (window.cacheManager) {
            this.cache = window.cacheManager;
        } else if (typeof FirebaseCacheManager !== 'undefined') {
            this.cache = new FirebaseCacheManager({ db: firestore });
        } else {
            // Fallback: create a minimal cache interface
            console.warn('[MythologiesView] FirebaseCacheManager not available, using fallback');
            this.cache = {
                getList: async () => null,
                defaultTTL: { mythologies: 3600000 }
            };
        }
        this.mythologies = [];
    }

    /**
     * Render mythologies grid with smooth loading transitions
     */
    async render(container) {
        console.log('[Mythologies View] Rendering...');

        // Show loading with skeleton state
        container.innerHTML = this.getLoadingHTML();
        container.classList.add('has-skeleton');

        try {
            // Load mythologies
            await this.loadMythologies();

            // Fade out loading before replacing content
            const loadingEl = container.querySelector('.loading-container');
            if (loadingEl) {
                loadingEl.classList.add('fade-out');
                loadingEl.style.opacity = '0';
                loadingEl.style.transition = 'opacity 0.2s ease-out';
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Render content with fade-in
            container.innerHTML = this.getMythologiesHTML();
            container.classList.remove('has-skeleton');
            this.attachEventListeners();

            // Trigger fade-in animation
            requestAnimationFrame(() => {
                const content = container.firstElementChild;
                if (content) {
                    content.classList.add('content-loaded');
                }
            });

            // Hide loading spinner (use document for consistency)
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: { view: 'mythologies', timestamp: Date.now() }
            }));

            console.log('[Mythologies View] Render complete');

        } catch (error) {
            console.error('[Mythologies View] Error:', error);
            this.showError(container, error);

            // Emit error event
            document.dispatchEvent(new CustomEvent('render-error', {
                detail: { view: 'mythologies', error: error.message }
            }));
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
        // Group mythologies by region for the index
        const regions = this.groupByRegion(this.mythologies);
        const totalEntities = this.mythologies.reduce((sum, m) => {
            const counts = m.counts || {};
            return sum + (counts.deities || 0) + (counts.heroes || 0) + (counts.creatures || 0);
        }, 0);

        return `
            <div class="mythologies-view">
                <!-- Hero Section -->
                <div class="mythologies-hero">
                    <div class="mythologies-hero-background"></div>
                    <div class="mythologies-hero-content">
                        <div class="mythologies-hero-icon">🏛️</div>
                        <h1 class="mythologies-hero-title">World Mythologies</h1>
                        <p class="mythologies-hero-subtitle">A living encyclopedia of humanity's sacred traditions</p>
                        <div class="mythologies-hero-meta">
                            <div class="hero-meta-item">
                                <span class="hero-meta-value">${this.mythologies.length}</span>
                                <span class="hero-meta-label">Traditions</span>
                            </div>
                            <div class="hero-meta-item">
                                <span class="hero-meta-value">6000+</span>
                                <span class="hero-meta-label">Years of History</span>
                            </div>
                            ${totalEntities > 0 ? `
                                <div class="hero-meta-item">
                                    <span class="hero-meta-value">${totalEntities.toLocaleString()}</span>
                                    <span class="hero-meta-label">Entities</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Introduction -->
                <div class="mythologies-intro">
                    <div class="mythologies-intro-content">
                        <p>From the thundering halls of Asgard to the sun-drenched temples of the Nile, mythology has been the lens through which civilizations have understood creation, morality, and the forces that shape existence. These are not merely ancient stories — they are the foundational narratives that defined law, art, science, and spirituality for billions of people across thousands of years.</p>
                        <p>Each tradition represented here offers a complete worldview: a cosmology explaining how the universe came to be, a pantheon of divine beings who govern its forces, heroes whose journeys mirror the human condition, and sacred texts that preserve accumulated wisdom. Explore any tradition to discover its deities, creatures, artifacts, and rituals.</p>
                    </div>
                </div>

                <!-- Region Index -->
                ${Object.keys(regions).length > 1 ? `
                    <nav class="mythologies-region-index" aria-label="Browse by region">
                        <div class="region-index-header">
                            <h2 class="region-index-title">Browse by Region</h2>
                            <span class="region-index-subtitle">${Object.keys(regions).length} cultural regions</span>
                        </div>
                        <div class="region-index-chips">
                            <button class="region-chip active" data-region="all" onclick="document.querySelectorAll('.mythology-card').forEach(c=>c.style.display='');document.querySelectorAll('.region-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">
                                All Traditions
                                <span class="region-chip-count">${this.mythologies.length}</span>
                            </button>
                            ${Object.entries(regions).map(([region, myths]) => `
                                <button class="region-chip" data-region="${region}" onclick="document.querySelectorAll('.mythology-card').forEach(c=>{c.style.display=c.dataset.region==='${region}'?'':'none'});document.querySelectorAll('.region-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">
                                    ${region}
                                    <span class="region-chip-count">${myths.length}</span>
                                </button>
                            `).join('')}
                        </div>
                    </nav>
                ` : ''}

                <!-- Mythology Grid -->
                <div class="mythology-grid">
                    ${this.mythologies.map(myth => this.getMythologyCardHTML(myth)).join('')}
                </div>

                <!-- Back to top -->
                <div class="mythologies-back-to-top">
                    <a href="#" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;" class="back-to-top-link">Back to top</a>
                </div>
            </div>
        `;
    }

    /**
     * Group mythologies by region
     */
    groupByRegion(mythologies) {
        const regions = {};
        mythologies.forEach(m => {
            const region = m.region || this.inferRegion(m.id);
            if (!regions[region]) regions[region] = [];
            regions[region].push(m);
        });
        return regions;
    }

    /**
     * Infer region from mythology ID
     */
    inferRegion(id) {
        const regionMap = {
            greek: 'Mediterranean', roman: 'Mediterranean',
            norse: 'Northern Europe', celtic: 'Northern Europe',
            egyptian: 'Africa & Middle East', babylonian: 'Africa & Middle East',
            sumerian: 'Africa & Middle East', persian: 'Africa & Middle East',
            hindu: 'South & Central Asia', buddhist: 'South & Central Asia',
            chinese: 'East Asia', japanese: 'East Asia',
            aztec: 'Americas', mayan: 'Americas', native_american: 'Americas',
            yoruba: 'Africa & Middle East',
            christian: 'Abrahamic', islamic: 'Abrahamic', jewish: 'Abrahamic',
            tarot: 'Esoteric', apocryphal: 'Esoteric', comparative: 'Esoteric'
        };
        return regionMap[id] || 'Other';
    }

    /**
     * Get mythology card HTML
     */
    getMythologyCardHTML(mythology) {
        const color = mythology.color || '#8b7fff';
        const counts = mythology.counts || { deities: 0, heroes: 0, creatures: 0 };

        // Check if icon is an image URL or emoji
        const icon = (mythology.icon || '').trim();
        const isImageUrl = icon.startsWith('http://') ||
                           icon.startsWith('https://') ||
                           icon.startsWith('./') ||
                           icon.startsWith('icons/') ||
                           /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(icon);
        const fallbackEmoji = '📖';
        const iconHTML = isImageUrl
            ? `<img src="${icon}" alt="" class="mythology-icon" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="mythology-icon mythology-icon-fallback" style="display:none;">${fallbackEmoji}</span>`
            : `<span class="mythology-icon">${icon || fallbackEmoji}</span>`;

        const region = mythology.region || this.inferRegion(mythology.id);

        return `
            <a href="#/mythology/${mythology.id}"
               class="mythology-card"
               data-mythology="${mythology.id}"
               data-region="${region}"
               style="--card-color: ${color}">
                <div class="mythology-card-top">
                    ${iconHTML}
                    ${mythology.region ? `<span class="mythology-region-tag">${mythology.region}</span>` : ''}
                </div>
                <h3 class="mythology-name">${mythology.name}</h3>
                <p class="mythology-description">${mythology.description || ''}</p>
                ${counts.deities || counts.heroes || counts.creatures ? `
                    <div class="mythology-counts">
                        ${counts.deities ? `<span class="count-item"><span class="count-icon">⚡</span>${counts.deities} deities</span>` : ''}
                        ${counts.heroes ? `<span class="count-item"><span class="count-icon">🗡️</span>${counts.heroes} heroes</span>` : ''}
                        ${counts.creatures ? `<span class="count-item"><span class="count-icon">🐉</span>${counts.creatures} creatures</span>` : ''}
                    </div>
                ` : ''}
                <span class="mythology-card-arrow">Explore &rarr;</span>
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

// Global export for non-module script loading
// Note: ES module export removed to prevent SyntaxError in non-module context
if (typeof window !== 'undefined') {
    window.MythologiesView = MythologiesView;
    console.log('[MythologiesView] Class registered globally');
}
