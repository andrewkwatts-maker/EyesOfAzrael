/**
 * Home Page View
 * Displays mythology topic cards loaded from Firebase
 */

class HomeView {
    constructor(firestore) {
        this.db = firestore;
        this.cache = window.cacheManager || new FirebaseCacheManager({ db: firestore });
        this.mythologies = [];
        this.loadingTimeout = null;
        this.loadingStartTime = null;
        this.minLoadingTime = 300; // Minimum time to show spinner (prevents flash)
        this.maxLoadingTime = 5000; // Timeout after 5 seconds
    }

    /**
     * Render the home page with enhanced loading states
     */
    async render(container) {
        console.log('[Home View] Rendering home page...');
        this.loadingStartTime = Date.now();

        // Enhanced loading state with skeleton screens
        container.innerHTML = `
            <div class="loading-container" role="status" aria-live="polite" aria-label="Loading mythologies">
                <div class="spinner-container" aria-hidden="true">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading mythologies...</p>
                <p class="loading-submessage">Fetching from Firebase...</p>

                <!-- Skeleton cards for better perceived performance -->
                <div class="skeleton-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-top: 2rem;
                    max-width: 1200px;
                    width: 100%;
                    padding: 0 1rem;
                ">
                    ${Array(6).fill(0).map(() => `
                        <div class="skeleton-card" style="
                            height: 200px;
                            background: linear-gradient(90deg,
                                rgba(var(--color-bg-card-rgb, 30, 30, 40), 0.5) 0%,
                                rgba(var(--color-bg-card-rgb, 30, 30, 40), 0.8) 50%,
                                rgba(var(--color-bg-card-rgb, 30, 30, 40), 0.5) 100%);
                            background-size: 200% 100%;
                            animation: skeleton-loading 1.5s ease-in-out infinite;
                            border-radius: 16px;
                            border: 1px solid rgba(var(--color-border-primary-rgb, 139, 127, 255), 0.3);
                        "></div>
                    `).join('')}
                </div>

                <style>
                    @keyframes skeleton-loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }

                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 400px;
                        padding: 2rem;
                    }

                    .loading-message {
                        font-size: 1.2rem;
                        margin-top: 1rem;
                        color: var(--color-text-primary);
                    }

                    .loading-submessage {
                        font-size: 0.9rem;
                        color: var(--color-text-secondary);
                        margin-top: 0.5rem;
                        opacity: 0.7;
                    }
                </style>
            </div>
        `;

        // Set timeout fallback
        this.loadingTimeout = setTimeout(() => {
            this.handleLoadingTimeout(container);
        }, this.maxLoadingTime);

        try {
            // Load mythologies from Firebase
            await this.loadMythologies();

            // Clear timeout
            clearTimeout(this.loadingTimeout);

            // Calculate load time for performance metrics
            const loadTime = Date.now() - this.loadingStartTime;
            console.log(`[Home View] ⚡ Mythologies loaded in ${loadTime}ms`);

            // Ensure minimum loading time for smooth UX (prevents jarring flash)
            const elapsedTime = Date.now() - this.loadingStartTime;
            if (elapsedTime < this.minLoadingTime) {
                await this.delay(this.minLoadingTime - elapsedTime);
            }

            // Smooth transition to content
            await this.transitionToContent(container);

        } catch (error) {
            clearTimeout(this.loadingTimeout);
            console.error('[Home View] Error rendering home page:', error);
            this.showError(container, error);
        }
    }

    /**
     * Smooth transition from loading to content with performance tracking
     */
    async transitionToContent(container) {
        const transitionStart = performance.now();
        console.log('[Home View] 🎬 Starting transition to content...');

        // Add fade-out to loading spinner and skeleton
        const loadingContainer = container.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('loading-fade-out');
            await this.delay(300);
        }

        // Render content with fade-in
        const renderStart = performance.now();
        container.innerHTML = this.getHomeHTML();
        const renderTime = performance.now() - renderStart;
        console.log(`[Home View] 🎨 Content rendered in ${renderTime.toFixed(2)}ms`);

        const homeView = container.querySelector('.home-view');
        if (homeView) {
            homeView.classList.add('loading-fade-in');
        }

        // ENHANCEMENT: Activate shader background
        const shaderStart = performance.now();
        this.activateShaderBackground();
        const shaderTime = performance.now() - shaderStart;
        console.log(`[Home View] ✨ Shader activated in ${shaderTime.toFixed(2)}ms`);

        // Add event listeners
        const listenerStart = performance.now();
        this.attachEventListeners();
        const listenerTime = performance.now() - listenerStart;
        console.log(`[Home View] 🎯 Event listeners attached in ${listenerTime.toFixed(2)}ms`);

        // Save to cache
        this.saveMythologiesCache(this.mythologies);

        // Log total transition time
        const totalTransitionTime = performance.now() - transitionStart;
        const totalLoadTime = performance.now() - this.loadingStartTime;
        console.log(`[Home View] 🏁 Transition complete!
            - Transition time: ${totalTransitionTime.toFixed(2)}ms
            - Total load time: ${totalLoadTime.toFixed(2)}ms
            - Mythologies displayed: ${this.mythologies.length}`);
    }

    /**
     * Handle loading timeout (>5 seconds)
     */
    handleLoadingTimeout(container) {
        console.warn('[Home View] Loading timeout - Firebase taking too long');

        // Check if we already have data (slow but successful load)
        if (this.mythologies.length > 0) {
            this.transitionToContent(container);
            return;
        }

        // Show timeout warning
        container.innerHTML = `
            <div class="loading-container">
                <div class="timeout-warning" style="
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255, 193, 7, 0.1);
                    border: 2px solid rgba(255, 193, 7, 0.4);
                    border-radius: 16px;
                    margin-bottom: 2rem;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                ">
                    <div class="warning-icon" style="font-size: 4rem; margin-bottom: 1rem;">⏱️</div>
                    <h2 style="color: #ffc107; margin-bottom: 1rem;">Loading is taking longer than expected</h2>
                    <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1.5rem;">
                        This could be due to a slow connection or Firebase issues.
                    </p>
                    <div class="timeout-actions" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="location.reload()">
                            🔄 Retry Loading
                        </button>
                        <button class="btn-secondary" id="useCachedDataBtn">
                            💾 Use Cached Data
                        </button>
                    </div>
                </div>
                <div class="spinner-container" aria-hidden="true" style="--spinner-size: 60px;">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Still trying to connect...</p>
            </div>
        `;

        // Attach cached data button handler
        const cachedBtn = container.querySelector('#useCachedDataBtn');
        if (cachedBtn) {
            cachedBtn.addEventListener('click', () => {
                this.useFallbackData();
                this.transitionToContent(container);
            });
        }
    }

    /**
     * ENHANCEMENT: Activate shader background for home page
     * This ensures shaders are always visible on the home page
     */
    activateShaderBackground() {
        console.log('[Home View] 🎨 Activating shader background...');

        // Check if ShaderThemeManager exists
        if (window.EyesOfAzrael && window.EyesOfAzrael.shaders) {
            const shaderManager = window.EyesOfAzrael.shaders;

            // Determine appropriate theme based on time of day
            const hour = new Date().getHours();
            let theme;

            if (hour >= 5 && hour < 12) {
                theme = 'day'; // Morning - bright daylight
            } else if (hour >= 12 && hour < 17) {
                theme = 'light'; // Afternoon - warm light
            } else if (hour >= 17 && hour < 20) {
                theme = 'fire'; // Evening - sunset colors
            } else {
                theme = 'night'; // Night - stars and cosmic
            }

            console.log(`[Home View] ✨ Activating "${theme}" shader theme (hour: ${hour})`);

            // Activate the shader
            shaderManager.activate(theme);

            // Verify shader is running
            setTimeout(() => {
                const status = shaderManager.getStatus();
                console.log('[Home View] 📊 Shader status:', status);

                if (!status.enabled || !status.theme) {
                    console.warn('[Home View] ⚠️ Shader may not be active, attempting to reactivate...');
                    shaderManager.activate(theme);
                }
            }, 500);

        } else {
            console.warn('[Home View] ⚠️ ShaderThemeManager not available');
            console.log('[Home View] 💡 Make sure js/shaders/shader-themes.js is loaded');
        }
    }

    /**
     * Load mythologies from Firebase with intelligent caching and performance tracking
     */
    async loadMythologies() {
        const perfStart = performance.now();
        console.log('[Home View] Loading mythologies with cache manager...');

        try {
            // Try cache first for instant display
            const cacheStart = performance.now();
            const cached = this.loadFromCache();
            const cacheTime = performance.now() - cacheStart;

            if (cached) {
                console.log(`[Home View] ⚡ Cache hit in ${cacheTime.toFixed(2)}ms - Using cached mythologies while fetching fresh data`);
                this.mythologies = cached;
            } else {
                console.log(`[Home View] 📭 Cache miss (checked in ${cacheTime.toFixed(2)}ms)`);
            }

            // Try to load from cache manager (multi-layer cache)
            const fetchStart = performance.now();
            const mythologies = await this.cache.getList('mythologies', {}, {
                ttl: this.cache.defaultTTL.mythologies,
                orderBy: 'order asc',
                limit: 50
            });
            const fetchTime = performance.now() - fetchStart;

            if (mythologies && mythologies.length > 0) {
                this.mythologies = mythologies;
                console.log(`[Home View] ✅ Loaded ${mythologies.length} mythologies in ${fetchTime.toFixed(2)}ms`);

                // Log performance breakdown
                const totalTime = performance.now() - perfStart;
                console.log(`[Home View] 📊 Performance breakdown:
                    - Cache check: ${cacheTime.toFixed(2)}ms
                    - Firebase fetch: ${fetchTime.toFixed(2)}ms
                    - Total: ${totalTime.toFixed(2)}ms`);

                // Load counts from metadata collection in background
                this.loadCountsInBackground();
            } else {
                // Use fallback hardcoded list
                console.warn('[Home View] ⚠️ No mythologies found, using fallback');
                this.useFallbackData();
            }

        } catch (error) {
            const totalTime = performance.now() - perfStart;
            console.error(`[Home View] ❌ Error loading from Firebase after ${totalTime.toFixed(2)}ms:`, error);
            console.log('[Home View] Using fallback mythologies');
            this.useFallbackData();
        }
    }

    /**
     * Load entity counts from metadata collection (background)
     */
    async loadCountsInBackground() {
        try {
            const metadata = await this.cache.getMetadata('mythology_counts');

            if (metadata && metadata.length > 0) {
                // Map metadata to mythologies
                this.mythologies.forEach(myth => {
                    const meta = metadata.find(m => m.mythology === myth.id);
                    if (meta) {
                        myth.counts = meta.counts || {
                            deities: 0,
                            heroes: 0,
                            creatures: 0,
                            total: 0
                        };
                    }
                });
                console.log('[Home View] Counts loaded from metadata');

                // Update cache
                this.saveMythologiesCache(this.mythologies);
            }
        } catch (error) {
            console.warn('[Home View] Could not load counts from metadata:', error);
        }
    }

    /**
     * Use fallback mythologies (cache or hardcoded)
     */
    useFallbackData() {
        // Try cache first
        const cached = this.loadFromCache();
        if (cached && cached.length > 0) {
            console.log('[Home View] Using cached mythologies');
            this.mythologies = cached;
            return;
        }

        // Use hardcoded fallback
        console.log('[Home View] Using hardcoded fallback mythologies');
        this.mythologies = this.getFallbackMythologies();
    }

    /**
     * Save mythologies to localStorage cache
     */
    saveMythologiesCache(mythologies) {
        if (!mythologies || mythologies.length === 0) return;

        try {
            localStorage.setItem('mythologies_cache', JSON.stringify({
                data: mythologies,
                timestamp: Date.now()
            }));
            console.log('[Home View] Cached mythologies to localStorage');
        } catch (e) {
            console.warn('[Home View] Could not cache mythologies:', e);
        }
    }

    /**
     * Load mythologies from cache
     */
    loadFromCache() {
        try {
            const cacheStr = localStorage.getItem('mythologies_cache');
            if (!cacheStr) return null;

            const cache = JSON.parse(cacheStr);
            const cacheAge = Date.now() - cache.timestamp;
            const maxAge = 3600000; // 1 hour

            if (cacheAge < maxAge && cache.data && cache.data.length > 0) {
                const ageInSeconds = Math.round(cacheAge / 1000);
                console.log(`[Home View] Found cached mythologies (age: ${ageInSeconds}s)`);
                return cache.data;
            }

            // Cache expired
            console.log('[Home View] Cache expired, will fetch fresh data');
            return null;

        } catch (e) {
            console.warn('[Home View] Error loading cache:', e);
            return null;
        }
    }

    /**
     * Get fallback mythologies if Firebase fails
     */
    getFallbackMythologies() {
        return [
            {
                id: 'greek',
                name: 'Greek Mythology',
                icon: '🏛️',
                description: 'Gods of Olympus and heroes of ancient Greece',
                color: 'var(--color-primary, #8b7fff)',
                order: 1
            },
            {
                id: 'norse',
                name: 'Norse Mythology',
                icon: '⚔️',
                description: 'Warriors of Asgard and the Nine Realms',
                color: '#4a9eff',
                order: 2
            },
            {
                id: 'egyptian',
                name: 'Egyptian Mythology',
                icon: '𓂀',
                description: 'Keepers of the Nile and guardians of Ma\'at',
                color: '#ffd93d',
                order: 3
            },
            {
                id: 'hindu',
                name: 'Hindu Mythology',
                icon: '🕉️',
                description: 'The Trimurti and cosmic cycles of creation',
                color: '#ff7eb6',
                order: 4
            },
            {
                id: 'buddhist',
                name: 'Buddhist Tradition',
                icon: '☸️',
                description: 'Bodhisattvas and the path to enlightenment',
                color: '#51cf66',
                order: 5
            },
            {
                id: 'chinese',
                name: 'Chinese Mythology',
                icon: '🐉',
                description: 'Dragons, immortals, and celestial bureaucracy',
                color: '#f85a8f',
                order: 6
            },
            {
                id: 'japanese',
                name: 'Japanese Mythology',
                icon: '⛩️',
                description: 'Kami spirits and the creation of Japan',
                color: '#fb9f7f',
                order: 7
            },
            {
                id: 'celtic',
                name: 'Celtic Mythology',
                icon: '🍀',
                description: 'Druids, faeries, and the Tuatha Dé Danann',
                color: '#7fd9d3',
                order: 8
            },
            {
                id: 'babylonian',
                name: 'Babylonian Mythology',
                icon: '🏛️',
                description: 'The Enuma Elish and gods of Mesopotamia',
                color: '#b965e6',
                order: 9
            },
            {
                id: 'persian',
                name: 'Persian Mythology',
                icon: '🔥',
                description: 'Zoroastrian wisdom and the eternal flame',
                color: '#7fb0f9',
                order: 10
            },
            {
                id: 'christian',
                name: 'Christian Tradition',
                icon: '✟',
                description: 'Angels, saints, and biblical narratives',
                color: '#a8edea',
                order: 11
            },
            {
                id: 'islamic',
                name: 'Islamic Tradition',
                icon: '☪️',
                description: 'Prophets, angels, and divine revelation',
                color: '#fed6e3',
                order: 12
            }
        ];
    }

    /**
     * Get home page HTML
     */
    getHomeHTML() {
        return `
            <div class="home-view">
                <!-- Hero Section -->
                <section class="hero-section">
                    <div class="hero-content">
                        <h1 class="hero-title">
                            <span class="hero-icon">👁️</span>
                            Eyes of Azrael
                        </h1>
                        <p class="hero-subtitle">
                            Explore World Mythologies
                        </p>
                        <p class="hero-description">
                            Journey through 6000+ years of human mythology, from ancient Sumer to modern traditions.
                            Discover deities, heroes, creatures, and sacred texts from cultures across the globe.
                        </p>
                        <div class="hero-actions">
                            <a href="#/search" class="btn-primary">
                                🔍 Search Database
                            </a>
                            <a href="#/compare" class="btn-secondary">
                                ⚖️ Compare Traditions
                            </a>
                        </div>
                    </div>
                </section>

                <!-- Mythology Cards Grid -->
                <section class="mythology-grid-section">
                    <h2 class="section-title">Explore Mythologies</h2>
                    <div class="mythology-grid">
                        ${this.mythologies.map(myth => this.getMythologyCardHTML(myth)).join('')}
                    </div>
                </section>

                <!-- Features Section -->
                <section class="features-section">
                    <h2 class="section-title">Database Features</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📚</div>
                            <h3>Comprehensive Database</h3>
                            <p>Thousands of entities across 12+ mythological traditions</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔗</div>
                            <h3>Cross-Cultural Links</h3>
                            <p>Discover connections between different traditions</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🌿</div>
                            <h3>Sacred Herbalism</h3>
                            <p>Explore plants, rituals, and traditional practices</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">✨</div>
                            <h3>Magic Systems</h3>
                            <p>Study mystical practices and esoteric traditions</p>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Get mythology card HTML
     */
    getMythologyCardHTML(mythology) {
        const borderColor = mythology.color || 'var(--color-primary, #8b7fff)';

        return `
            <a href="#/mythology/${mythology.id}" class="mythology-card" data-mythology="${mythology.id}">
                <div class="mythology-card-icon" style="color: ${borderColor};">
                    ${mythology.icon || '📖'}
                </div>
                <h3 class="mythology-card-title">${mythology.name}</h3>
                <p class="mythology-card-description">${mythology.description}</p>
                <div class="mythology-card-arrow" style="color: ${borderColor};">→</div>
            </a>
        `;
    }

    /**
     * Show enhanced error HTML with retry options and helpful information
     */
    showError(container, error) {
        console.error('[Home View] Showing error state:', error);

        // Determine error type for better messaging
        const isNetworkError = error.message?.includes('network') || error.message?.includes('fetch');
        const isFirebaseError = error.message?.includes('Firebase') || error.message?.includes('firestore');

        container.innerHTML = `
            <div class="error-container" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 400px;
                padding: 3rem;
                text-align: center;
            ">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>

                <h2 style="color: var(--color-text-primary); margin-bottom: 1rem; font-size: 2rem;">
                    Failed to Load Mythologies
                </h2>

                <p style="color: var(--color-text-secondary); margin-bottom: 0.5rem; font-size: 1.1rem;">
                    ${error.message || 'Unknown error occurred'}
                </p>

                <p style="color: var(--color-text-secondary); margin-bottom: 2rem; font-size: 0.9rem; max-width: 500px;">
                    ${isNetworkError ? 'Please check your internet connection and try again.' :
                      isFirebaseError ? 'There may be an issue connecting to Firebase. Try reloading.' :
                      'This could be due to network issues or Firebase connectivity problems.'}
                </p>

                <!-- Error details for debugging -->
                <details style="margin-bottom: 2rem; max-width: 600px; width: 100%;">
                    <summary style="
                        cursor: pointer;
                        color: var(--color-text-secondary);
                        font-size: 0.9rem;
                        padding: 0.5rem;
                        border-radius: 8px;
                        background: rgba(255, 193, 7, 0.1);
                    ">
                        🔍 View Error Details
                    </summary>
                    <pre style="
                        text-align: left;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 1rem;
                        border-radius: 8px;
                        margin-top: 1rem;
                        overflow-x: auto;
                        font-size: 0.85rem;
                        color: var(--color-text-secondary);
                    ">${error.stack || error.message || 'No additional details available'}</pre>
                </details>

                <!-- Action buttons -->
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" style="
                        padding: 0.75rem 1.5rem;
                        background: var(--color-primary, #8b7fff);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(139, 127, 255, 0.4)'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        🔄 Retry Loading
                    </button>

                    <button id="useFallbackBtn" style="
                        padding: 0.75rem 1.5rem;
                        background: rgba(var(--color-bg-card-rgb, 30, 30, 40), 1);
                        color: var(--color-text-primary);
                        border: 1px solid var(--color-border-primary, #8b7fff);
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='var(--color-accent, #00d4ff)'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--color-border-primary, #8b7fff)'">
                        💾 Use Cached Data
                    </button>
                </div>

                <!-- Help text -->
                <p style="
                    margin-top: 2rem;
                    color: var(--color-text-secondary);
                    font-size: 0.85rem;
                    opacity: 0.7;
                ">
                    Need help? Check the browser console for more details (F12).
                </p>
            </div>
        `;

        // Attach fallback button handler
        const fallbackBtn = container.querySelector('#useFallbackBtn');
        if (fallbackBtn) {
            fallbackBtn.addEventListener('click', () => {
                console.log('[Home View] Using fallback data after error');
                this.useFallbackData();
                this.transitionToContent(container);
            });
        }
    }

    /**
     * Utility: Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Add hover effects or click tracking if needed
        const cards = document.querySelectorAll('.mythology-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                console.log('[Home View] Hovering over:', card.dataset.mythology);
            });
        });
    }
}

// Export for use in SPA navigation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeView;
}
