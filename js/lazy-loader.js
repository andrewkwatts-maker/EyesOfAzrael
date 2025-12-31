/**
 * PROGRESSIVE LAZY LOADER
 * Orchestrates progressive loading for optimal perceived performance
 *
 * Loading Phases:
 * 1. Critical HTML + CSS (instant) - Already rendered
 * 2. Auth check + User UI (100ms) - High priority
 * 3. Main content structure (200ms) - Show skeleton screens (if app not ready)
 * 4. Firebase data (300-500ms) - Wait for app initialization
 * 5. Shaders + Enhancements (1s+) - Nice-to-have features
 *
 * IMPORTANT: This loader coordinates with app-init-simple.js and spa-navigation.js
 * to avoid race conditions. It will NOT override content if the app has already
 * started rendering.
 */

class ProgressiveLazyLoader {
    constructor() {
        this.loadStartTime = performance.now();
        this.phases = {
            critical: false,      // HTML + Critical CSS
            auth: false,          // Auth check + User UI
            structure: false,     // Main content skeleton
            data: false,          // Firebase data loaded
            enhanced: false       // Shaders + extras
        };
        this.metrics = {};
        this.observers = new Map();

        // Track coordination state with other components
        this._appInitialized = false;
        this._firstRenderComplete = false;
        this._skeletonActive = false;

        console.log('[Lazy Loader] Initialized');
    }

    /**
     * Start progressive loading sequence
     */
    async start() {
        console.log('[Lazy Loader] Starting progressive loading...');

        // Setup event listeners for coordination with other components
        this._setupEventListeners();

        // Phase 1: Critical (already done by server/HTML)
        this.markPhaseComplete('critical');

        // Phase 2: Auth Check (100ms target)
        await this.loadAuthUI();

        // Phase 3: Structure (200ms target) - only if app hasn't started rendering
        await this.loadStructure();

        // Phase 4: Data (300-500ms target) - coordinate with app initialization
        await this.loadData();

        // Phase 5: Enhancements (1s+ - non-blocking)
        this.loadEnhancements();

        // Report metrics
        this.reportMetrics();
    }

    /**
     * Setup event listeners to coordinate with app-init-simple.js and spa-navigation.js
     */
    _setupEventListeners() {
        // Listen for app initialization
        document.addEventListener('app-initialized', (event) => {
            console.log('[Lazy Loader] App initialized event received');
            this._appInitialized = true;
        }, { once: true });

        // Listen for first render complete from SPA navigation
        document.addEventListener('first-render-complete', (event) => {
            console.log('[Lazy Loader] First render complete event received:', event.detail?.route);
            this._firstRenderComplete = true;

            // Remove skeleton if still active
            if (this._skeletonActive) {
                this._removeSkeleton();
            }
        }, { once: true });

        // Listen for render errors
        document.addEventListener('render-error', (event) => {
            console.warn('[Lazy Loader] Render error event received:', event.detail?.route);
            this._firstRenderComplete = true;

            // Remove skeleton on error too
            if (this._skeletonActive) {
                this._removeSkeleton();
            }
        }, { once: true });
    }

    /**
     * Remove skeleton screen with smooth transition
     */
    _removeSkeleton() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        const skeleton = mainContent.querySelector('.skeleton-mythology-grid');
        if (skeleton) {
            skeleton.classList.add('fade-out');
            setTimeout(() => {
                // Only remove if it's still our skeleton (not replaced by actual content)
                if (mainContent.querySelector('.skeleton-mythology-grid')) {
                    skeleton.remove();
                }
            }, 300);
        }

        this._skeletonActive = false;
        console.log('[Lazy Loader] Skeleton removed');
    }

    /**
     * Phase 2: Load Auth UI (Target: 100ms)
     */
    async loadAuthUI() {
        const phaseStart = performance.now();
        console.log('[Lazy Loader] Phase 2: Loading Auth UI...');

        try {
            // Check if Firebase Auth is available
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const auth = firebase.auth();

                // Quick auth state check (don't wait for full auth)
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    this.updateUserUI(user);
                    unsubscribe(); // Only need first update
                }, (error) => {
                    console.warn('[Lazy Loader] Auth check failed:', error);
                });
            }

            this.markPhaseComplete('auth', phaseStart);
        } catch (error) {
            console.error('[Lazy Loader] Auth UI error:', error);
            this.markPhaseComplete('auth', phaseStart);
        }
    }

    /**
     * Phase 3: Load Structure with Skeleton Screens (Target: 200ms)
     * Only shows skeleton if app hasn't already started rendering content
     */
    async loadStructure() {
        const phaseStart = performance.now();
        console.log('[Lazy Loader] Phase 3: Loading structure...');

        try {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;

            // Check if content has already been rendered by SPA navigation
            // Look for view-specific classes that indicate real content
            const hasRealContent = mainContent.querySelector(
                '.landing-page-view, .home-view, .mythologies-grid, .browse-category-view, ' +
                '.entity-page, .search-container, .compare-view, .dashboard-view'
            );

            // Also check if the loading container is still showing (default state)
            const hasOnlyLoader = mainContent.querySelector('.loading-container') &&
                                  mainContent.children.length === 1;

            if (hasRealContent) {
                console.log('[Lazy Loader] Real content already rendered, skipping skeleton');
                this.markPhaseComplete('structure', phaseStart);
                return;
            }

            // Only show skeleton if we still have the initial loading spinner
            if (hasOnlyLoader) {
                console.log('[Lazy Loader] Showing skeleton screen');
                mainContent.innerHTML = this.getSkeletonHTML();
                this._skeletonActive = true;

                // Add smooth transition class
                mainContent.classList.add('content-loading');
            } else {
                console.log('[Lazy Loader] Content state unclear, preserving current content');
            }

            this.markPhaseComplete('structure', phaseStart);
        } catch (error) {
            console.error('[Lazy Loader] Structure error:', error);
            this.markPhaseComplete('structure', phaseStart);
        }
    }

    /**
     * Phase 4: Load Firebase Data (Target: 300-500ms)
     */
    async loadData() {
        const phaseStart = performance.now();
        console.log('[Lazy Loader] Phase 4: Loading data...');

        try {
            // Wait for app to be initialized (with timeout)
            const appReady = await this.waitForApp();

            if (!appReady) {
                console.warn('[Lazy Loader] App initialization timed out, proceeding anyway');
            }

            // Trigger the lazy-load-data event (for any components listening)
            document.dispatchEvent(new CustomEvent('lazy-load-data'));

            // Wait for content replacement if skeleton is active
            if (this._skeletonActive) {
                await this.replaceSkeletonWithContent();
            } else {
                console.log('[Lazy Loader] No skeleton active, skipping replacement');
            }

            this.markPhaseComplete('data', phaseStart);
        } catch (error) {
            console.error('[Lazy Loader] Data loading error:', error);
            this.markPhaseComplete('data', phaseStart);
        }
    }

    /**
     * Phase 5: Load Enhancements (Non-blocking, 1s+ delay)
     */
    loadEnhancements() {
        const phaseStart = performance.now();
        console.log('[Lazy Loader] Phase 5: Loading enhancements...');

        // Defer shader initialization
        setTimeout(() => {
            this.loadShaders();
        }, 1000);

        // Lazy load images
        this.setupImageLazyLoading();

        // Defer analytics/tracking
        setTimeout(() => {
            this.loadAnalytics();
        }, 2000);

        // Load non-essential scripts
        setTimeout(() => {
            this.loadNonEssentialScripts();
        }, 1500);

        this.markPhaseComplete('enhanced', phaseStart);
    }

    /**
     * Load shaders (deferred)
     * Note: app-init-simple.js may have already initialized shaders
     */
    async loadShaders() {
        console.log('[Lazy Loader] Loading shaders...');

        try {
            // Check if shaders are already initialized by app-init-simple.js
            if (window.EyesOfAzrael?.shaders) {
                console.log('[Lazy Loader] Shaders already initialized by app, skipping');
                return;
            }

            if (typeof ShaderThemeManager !== 'undefined') {
                window.EyesOfAzrael = window.EyesOfAzrael || {};
                window.EyesOfAzrael.shaders = new ShaderThemeManager({
                    quality: 'auto',
                    targetFPS: 60
                });

                // Auto-activate based on time of day
                const hour = new Date().getHours();
                const theme = (hour >= 6 && hour < 18) ? 'day' : 'night';
                window.EyesOfAzrael.shaders.activate(theme);

                console.log('[Lazy Loader] Shaders loaded');
            }
        } catch (error) {
            console.warn('[Lazy Loader] Shader loading failed:', error);
        }
    }

    /**
     * Setup lazy loading for images using Intersection Observer
     */
    setupImageLazyLoading() {
        console.log('[Lazy Loader] Setting up image lazy loading...');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // Load the actual image
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }

                    // Load srcset if available
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                        img.removeAttribute('data-srcset');
                    }

                    // Add loaded class for fade-in effect
                    img.classList.add('lazy-loaded');

                    // Stop observing this image
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before entering viewport
        });

        // Observe all lazy images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));

        this.observers.set('images', imageObserver);
    }

    /**
     * Load analytics/tracking (deferred)
     */
    loadAnalytics() {
        console.log('[Lazy Loader] Loading analytics...');

        // Only load if user has consented
        if (localStorage.getItem('analytics-consent') === 'true') {
            // Add analytics scripts here
            console.log('[Lazy Loader] Analytics consent granted');
        } else {
            console.log('[Lazy Loader] Analytics consent not granted');
        }
    }

    /**
     * Load non-essential scripts
     */
    loadNonEssentialScripts() {
        console.log('[Lazy Loader] Loading non-essential scripts...');

        const scripts = [
            // Add non-essential scripts here
            // Example: '/js/advanced-features.js'
        ];

        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        });
    }

    /**
     * Get skeleton screen HTML
     */
    getSkeletonHTML() {
        return `
            <div class="skeleton-mythology-grid">
                <!-- Skeleton Hero -->
                <div class="skeleton-hero">
                    <div class="skeleton skeleton-hero-icon"></div>
                    <div class="skeleton skeleton-hero-title"></div>
                    <div class="skeleton skeleton-hero-subtitle"></div>
                    <div class="skeleton skeleton-hero-description"></div>
                    <div class="skeleton skeleton-hero-description-2"></div>
                    <div class="skeleton-hero-actions">
                        <div class="skeleton skeleton-btn"></div>
                        <div class="skeleton skeleton-btn"></div>
                    </div>
                </div>

                <!-- Skeleton Section Title -->
                <div class="skeleton skeleton-section-title"></div>

                <!-- Skeleton Grid -->
                <div class="skeleton-grid">
                    ${this.getSkeletonCards(12)}
                </div>

                <!-- Skeleton Features -->
                <div style="margin-top: 4rem;">
                    <div class="skeleton skeleton-section-title"></div>
                    <div class="skeleton-features-grid">
                        ${this.getSkeletonFeatureCards(4)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get skeleton mythology cards
     */
    getSkeletonCards(count = 12) {
        return Array.from({ length: count }, (_, i) => `
            <div class="skeleton-mythology-card" style="--item-index: ${i}">
                <div class="skeleton skeleton-card-icon"></div>
                <div class="skeleton skeleton-card-title"></div>
                <div class="skeleton skeleton-card-description"></div>
                <div class="skeleton skeleton-card-description-2"></div>
                <div class="skeleton skeleton-card-arrow"></div>
            </div>
        `).join('');
    }

    /**
     * Get skeleton feature cards
     */
    getSkeletonFeatureCards(count = 4) {
        return Array.from({ length: count }, (_, i) => `
            <div class="skeleton-feature-card" style="--item-index: ${i}">
                <div class="skeleton skeleton-feature-icon"></div>
                <div class="skeleton skeleton-feature-title"></div>
                <div class="skeleton skeleton-feature-description"></div>
                <div class="skeleton skeleton-feature-description-2"></div>
            </div>
        `).join('');
    }

    /**
     * Replace skeleton with actual content
     * Waits for SPA navigation to render the actual view
     */
    async replaceSkeletonWithContent() {
        console.log('[Lazy Loader] Replacing skeleton with content...');

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // If first render is already complete, just remove skeleton
        if (this._firstRenderComplete) {
            console.log('[Lazy Loader] First render already complete');
            this._removeSkeleton();
            mainContent.classList.add('content-loaded');
            return;
        }

        // Wait for navigation to render the actual page
        await new Promise(resolve => {
            let resolved = false;

            const checkInterval = setInterval(() => {
                // Check for any view-specific content classes
                const hasView = mainContent.querySelector(
                    '.landing-page-view, .home-view, .mythologies-grid, .browse-category-view, ' +
                    '.entity-page, .search-container, .compare-view, .dashboard-view, ' +
                    '.mythology-page, .category-page, .error-page'
                );

                if (hasView || this._firstRenderComplete) {
                    clearInterval(checkInterval);
                    if (!resolved) {
                        resolved = true;
                        console.log('[Lazy Loader] Content detected, completing replacement');
                        this._removeSkeleton();
                        mainContent.classList.add('content-loaded');
                        resolve();
                    }
                }
            }, 50);

            // Timeout after 5 seconds (increased from 3s for slower connections)
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!resolved) {
                    resolved = true;
                    console.warn('[Lazy Loader] Content replacement timeout');
                    this._removeSkeleton();
                    mainContent.classList.add('content-loaded');
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Update user UI based on auth state
     */
    updateUserUI(user) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (!userInfo) return;

        if (user) {
            userInfo.style.display = 'flex';
            if (userName) userName.textContent = user.displayName || user.email;
            if (userAvatar && user.photoURL) userAvatar.src = user.photoURL;
        } else {
            userInfo.style.display = 'none';
        }
    }

    /**
     * Wait for app to be initialized
     * @returns {Promise<boolean>} True if app initialized, false if timed out
     */
    async waitForApp() {
        return new Promise((resolve) => {
            // Check if already initialized
            if (this._appInitialized || (window.EyesOfAzrael && window.EyesOfAzrael.navigation)) {
                console.log('[Lazy Loader] App already initialized');
                resolve(true);
                return;
            }

            let resolved = false;

            // Listen for app-initialized event
            const handleInit = () => {
                if (!resolved) {
                    resolved = true;
                    console.log('[Lazy Loader] App initialized via event');
                    resolve(true);
                }
            };

            document.addEventListener('app-initialized', handleInit, { once: true });

            // Also check for first-render-complete as a fallback
            document.addEventListener('first-render-complete', () => {
                if (!resolved) {
                    resolved = true;
                    console.log('[Lazy Loader] First render complete, app ready');
                    resolve(true);
                }
            }, { once: true });

            // Timeout after 8 seconds (increased for slow connections)
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn('[Lazy Loader] waitForApp timed out after 8s');
                    resolve(false);
                }
            }, 8000);
        });
    }

    /**
     * Mark phase as complete and record timing
     */
    markPhaseComplete(phase, startTime = null) {
        this.phases[phase] = true;

        if (startTime) {
            const duration = performance.now() - startTime;
            this.metrics[phase] = {
                duration: Math.round(duration),
                timestamp: Math.round(performance.now() - this.loadStartTime)
            };
        }

        console.log(`[Lazy Loader] ✓ Phase ${phase} complete`, this.metrics[phase]);
    }

    /**
     * Report performance metrics
     */
    reportMetrics() {
        const totalTime = performance.now() - this.loadStartTime;

        console.group('[Lazy Loader] Performance Metrics');
        console.log('Total Load Time:', Math.round(totalTime), 'ms');
        console.table(this.metrics);
        console.log('Phases:', this.phases);
        console.groupEnd();

        // Emit metrics event for analytics
        document.dispatchEvent(new CustomEvent('lazy-load-complete', {
            detail: {
                totalTime: Math.round(totalTime),
                phases: this.phases,
                metrics: this.metrics
            }
        }));
    }

    /**
     * Cleanup observers and reset state
     */
    destroy() {
        console.log('[Lazy Loader] Cleaning up...');

        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Reset state
        this._appInitialized = false;
        this._firstRenderComplete = false;
        this._skeletonActive = false;

        console.log('[Lazy Loader] Cleanup complete');
    }

    /**
     * Get current state for debugging
     */
    getState() {
        return {
            phases: { ...this.phases },
            metrics: { ...this.metrics },
            appInitialized: this._appInitialized,
            firstRenderComplete: this._firstRenderComplete,
            skeletonActive: this._skeletonActive,
            observerCount: this.observers.size,
            elapsedTime: Math.round(performance.now() - this.loadStartTime)
        };
    }
}

// Auto-start on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lazyLoader = new ProgressiveLazyLoader();
        window.lazyLoader.start();
    });
} else {
    window.lazyLoader = new ProgressiveLazyLoader();
    window.lazyLoader.start();
}

// Expose for debugging
window.debugLazyLoader = () => {
    if (window.lazyLoader) {
        return window.lazyLoader.getState();
    }
    return null;
};
