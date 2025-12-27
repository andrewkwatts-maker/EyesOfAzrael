/**
 * PROGRESSIVE LAZY LOADER
 * Orchestrates progressive loading for optimal perceived performance
 *
 * Loading Phases:
 * 1. Critical HTML + CSS (instant) - Already rendered
 * 2. Auth check + User UI (100ms) - High priority
 * 3. Main content structure (200ms) - Show skeleton screens
 * 4. Firebase data (300-500ms) - Load actual data
 * 5. Shaders + Enhancements (1s+) - Nice-to-have features
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

        console.log('[Lazy Loader] Initialized');
    }

    /**
     * Start progressive loading sequence
     */
    async start() {
        console.log('[Lazy Loader] Starting progressive loading...');

        // Phase 1: Critical (already done by server/HTML)
        this.markPhaseComplete('critical');

        // Phase 2: Auth Check (100ms target)
        await this.loadAuthUI();

        // Phase 3: Structure (200ms target)
        await this.loadStructure();

        // Phase 4: Data (300-500ms target)
        await this.loadData();

        // Phase 5: Enhancements (1s+ - non-blocking)
        this.loadEnhancements();

        // Report metrics
        this.reportMetrics();
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
     */
    async loadStructure() {
        const phaseStart = performance.now();
        console.log('[Lazy Loader] Phase 3: Loading structure...');

        try {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;

            // Show skeleton screen immediately
            mainContent.innerHTML = this.getSkeletonHTML();

            // Add smooth transition class
            mainContent.classList.add('content-loading');

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
            // Wait for app to be initialized
            await this.waitForApp();

            // Trigger the normal app initialization
            const event = new CustomEvent('lazy-load-data');
            document.dispatchEvent(event);

            // Replace skeleton with real content
            await this.replaceSkeletonWithContent();

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
     */
    async loadShaders() {
        console.log('[Lazy Loader] Loading shaders...');

        try {
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
     */
    async replaceSkeletonWithContent() {
        console.log('[Lazy Loader] Replacing skeleton with content...');

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Add fade-out animation to skeleton
        mainContent.classList.add('content-loaded');

        // Wait for navigation to render the actual page
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                const homeView = mainContent.querySelector('.home-view');
                if (homeView) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);

            // Timeout after 3 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 3000);
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
     */
    async waitForApp() {
        return new Promise((resolve) => {
            if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
                resolve();
            } else {
                document.addEventListener('app-initialized', () => resolve(), { once: true });

                // Timeout after 5 seconds
                setTimeout(() => resolve(), 5000);
            }
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
     * Cleanup observers
     */
    destroy() {
        console.log('[Lazy Loader] Cleaning up...');

        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
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
        return {
            phases: window.lazyLoader.phases,
            metrics: window.lazyLoader.metrics,
            observers: window.lazyLoader.observers.size
        };
    }
    return null;
};
