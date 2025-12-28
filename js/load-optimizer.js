/**
 * Dynamic Script Loader with Environment Detection
 * Automatically loads minified scripts in production
 * Regular scripts in development
 */

(function() {
    'use strict';

    // Detect environment
    const isDev = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port === '5000' || // Firebase serve
                  window.location.search.includes('debug=true');

    const ext = isDev ? '.js' : '.min.js';

    console.log(`[LoadOptimizer] Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`[LoadOptimizer] Loading ${isDev ? 'regular' : 'minified'} scripts`);

    /**
     * Core scripts that load immediately
     * These are essential for app initialization
     */
    const coreScripts = [
        'js/app-init-simple',
        'js/spa-navigation-optimized' // Use optimized version with code splitting
    ];

    /**
     * Load script dynamically
     */
    function loadScript(src, isModule = true) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src + ext;

            if (isModule) {
                script.type = 'module';
            }

            script.onload = () => {
                console.log(`[LoadOptimizer] ✓ Loaded: ${src}${ext}`);
                resolve();
            };

            script.onerror = () => {
                console.error(`[LoadOptimizer] ✗ Failed: ${src}${ext}`);
                reject(new Error(`Failed to load ${src}${ext}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Load all core scripts in parallel
     */
    async function loadCoreScripts() {
        console.log('[LoadOptimizer] Loading core scripts...');

        try {
            await Promise.all(coreScripts.map(src => loadScript(src)));
            console.log('[LoadOptimizer] ✅ All core scripts loaded');

            // Dispatch event when ready
            document.dispatchEvent(new CustomEvent('core-scripts-loaded', {
                detail: {
                    environment: isDev ? 'development' : 'production',
                    timestamp: Date.now()
                }
            }));

        } catch (error) {
            console.error('[LoadOptimizer] ❌ Failed to load core scripts:', error);

            // Show error to user
            document.body.innerHTML = `
                <div style="padding: 40px; text-align: center; font-family: system-ui;">
                    <h1>⚠️ Loading Error</h1>
                    <p>Failed to load required scripts. Please refresh the page.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCoreScripts);
    } else {
        loadCoreScripts();
    }

    // Expose loader for dynamic imports
    window.LoadOptimizer = {
        isDev,
        ext,
        loadScript
    };
})();
