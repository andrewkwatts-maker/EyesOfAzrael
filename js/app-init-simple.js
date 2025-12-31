/**
 * Simple Application Initialization
 * Ensures proper loading order and error handling
 *
 * INITIALIZATION ORDER:
 * 1. Error monitoring (initErrorMonitoring) - catches all subsequent errors
 * 2. Performance monitoring (initPerformanceMonitoring) - tracks load metrics
 * 3. DOM ready wait (with timeout fallback)
 * 4. Firebase SDK and config validation
 * 5. Firebase services initialization (Firestore, Auth)
 * 6. Core managers (AuthManager, FirebaseCRUDManager)
 * 7. Renderer (UniversalDisplayRenderer)
 * 8. Navigation (SPANavigation - requires renderer)
 * 9. Search (EnhancedCorpusSearch)
 * 10. Shaders (ShaderThemeManager)
 * 11. UI setup (auth UI, error tracking, edit handler)
 * 12. Ready events dispatched
 */

(async function() {
    'use strict';

    // Configuration constants
    const CONFIG = {
        DOM_READY_TIMEOUT: 5000,       // 5 seconds to wait for DOM
        LOADING_HIDE_TIMEOUT: 10000,   // 10 seconds fallback to hide loading
        CRITICAL_DEPENDENCIES: [
            'firebase',
            'firebaseConfig'
        ],
        OPTIONAL_DEPENDENCIES: [
            'AuthManager',
            'FirebaseCRUDManager',
            'UniversalDisplayRenderer',
            'SPANavigation',
            'EnhancedCorpusSearch',
            'ShaderThemeManager',
            'EditEntityModal'
        ]
    };

    // Track initialization state
    const initState = {
        startTime: performance.now(),
        domReady: false,
        firebaseReady: false,
        servicesReady: false,
        navigationReady: false,
        firstRenderComplete: false,
        missingDependencies: [],
        warnings: []
    };

    console.log('[App] Starting initialization...');

    /**
     * Safely call a function if it exists
     * @param {string} funcName - Name of the function to check
     * @param {...any} args - Arguments to pass to the function
     * @returns {any} - Result of function call or undefined
     */
    function safeCall(funcName, ...args) {
        if (typeof window[funcName] === 'function') {
            try {
                return window[funcName](...args);
            } catch (error) {
                console.warn(`[App] Error calling ${funcName}:`, error);
                initState.warnings.push(`Failed to call ${funcName}: ${error.message}`);
            }
        } else if (funcName !== 'initErrorMonitoring' && funcName !== 'initPerformanceMonitoring') {
            // Don't warn for optional monitoring functions at startup
            console.debug(`[App] Function ${funcName} not available`);
        }
        return undefined;
    }

    /**
     * Check if a global dependency exists
     * @param {string} name - Name of the dependency
     * @returns {boolean} - Whether the dependency exists
     */
    function dependencyExists(name) {
        return typeof window[name] !== 'undefined';
    }

    /**
     * Log missing dependencies with guidance
     * @param {string[]} dependencies - List of dependency names to check
     * @param {boolean} critical - Whether these are critical dependencies
     */
    function checkDependencies(dependencies, critical = false) {
        const missing = dependencies.filter(dep => !dependencyExists(dep));

        if (missing.length > 0) {
            const level = critical ? 'error' : 'warn';
            console[level](`[App] Missing ${critical ? 'CRITICAL' : 'optional'} dependencies:`, missing);

            missing.forEach(dep => {
                initState.missingDependencies.push({ name: dep, critical });

                // Provide guidance for common missing dependencies
                const guidance = getDependencyGuidance(dep);
                if (guidance) {
                    console[level](`[App] ${dep}: ${guidance}`);
                }
            });
        }

        return missing;
    }

    /**
     * Get guidance for loading a missing dependency
     * @param {string} dep - Dependency name
     * @returns {string|null} - Guidance string or null
     */
    function getDependencyGuidance(dep) {
        const guidance = {
            'firebase': 'Ensure Firebase SDK is loaded via <script src="https://www.gstatic.com/firebasejs/...">',
            'firebaseConfig': 'Ensure firebase-config.js is loaded before app-init-simple.js',
            'AuthManager': 'Load js/auth-guard-simple.js or js/auth-manager.js',
            'FirebaseCRUDManager': 'Load js/firebase-crud-manager.js',
            'UniversalDisplayRenderer': 'Load js/components/universal-display-renderer.js',
            'SPANavigation': 'Load js/spa-navigation.js - requires UniversalDisplayRenderer first',
            'EnhancedCorpusSearch': 'Load js/enhanced-corpus-search.js',
            'ShaderThemeManager': 'Load js/shader-theme-picker.js',
            'EditEntityModal': 'Load js/edit-entity-modal.js for edit functionality'
        };
        return guidance[dep] || null;
    }

    // Step 1: Initialize error monitoring FIRST (before anything else)
    if (typeof initErrorMonitoring === 'function') {
        try {
            initErrorMonitoring();
            console.log('[App] [1/12] Error monitoring initialized');
        } catch (error) {
            console.warn('[App] Failed to initialize error monitoring:', error);
            initState.warnings.push('Error monitoring failed to initialize');
        }
    } else {
        console.debug('[App] [1/12] Error monitoring not available (optional)');
    }

    // Step 2: Initialize performance monitoring
    if (typeof initPerformanceMonitoring === 'function') {
        try {
            initPerformanceMonitoring();
            console.log('[App] [2/12] Performance monitoring initialized');
        } catch (error) {
            console.warn('[App] Failed to initialize performance monitoring:', error);
            initState.warnings.push('Performance monitoring failed to initialize');
        }
    } else {
        console.debug('[App] [2/12] Performance monitoring not available (optional)');
    }

    // Step 3: Wait for DOM to be ready with timeout fallback
    if (document.readyState === 'loading') {
        console.log('[App] [3/12] Waiting for DOM to be ready...');

        const domReadyPromise = new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', () => {
                initState.domReady = true;
                resolve('ready');
            });
        });

        const timeoutPromise = new Promise(resolve => {
            setTimeout(() => {
                if (!initState.domReady) {
                    console.warn(`[App] DOM ready timeout after ${CONFIG.DOM_READY_TIMEOUT}ms, proceeding anyway`);
                    initState.warnings.push('DOM ready timeout - proceeding with partial state');
                    resolve('timeout');
                }
            }, CONFIG.DOM_READY_TIMEOUT);
        });

        const result = await Promise.race([domReadyPromise, timeoutPromise]);
        console.log(`[App] [3/12] DOM state resolved: ${result}`);
    } else {
        initState.domReady = true;
        console.log('[App] [3/12] DOM already ready');
    }

    try {
        // Add breadcrumb for initialization start
        safeCall('addBreadcrumb', 'app', 'Starting app initialization');

        // Step 4: Check critical dependencies and Firebase
        console.log('[App] [4/12] Checking Firebase SDK and config...');
        const criticalMissing = checkDependencies(CONFIG.CRITICAL_DEPENDENCIES, true);

        if (criticalMissing.includes('firebase')) {
            throw new Error('Firebase SDK not loaded. Ensure Firebase scripts are included in index.html');
        }

        if (criticalMissing.includes('firebaseConfig')) {
            throw new Error('Firebase config not found. Ensure firebase-config.js is loaded');
        }

        // Step 5: Initialize Firebase if not already initialized
        console.log('[App] [5/12] Initializing Firebase services...');
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('[App] Firebase app initialized');
        } else {
            app = firebase.app();
            console.log('[App] Using existing Firebase app');
        }

        // Get Firebase services
        const db = firebase.firestore();
        const auth = firebase.auth();
        initState.firebaseReady = true;
        console.log('[App] [5/12] Firebase services ready');

        // Make services available globally
        window.EyesOfAzrael = window.EyesOfAzrael || {};
        window.EyesOfAzrael.db = db;
        window.EyesOfAzrael.firebaseAuth = auth;
        window.EyesOfAzrael.initState = initState; // Expose for debugging

        // Check optional dependencies and log warnings
        checkDependencies(CONFIG.OPTIONAL_DEPENDENCIES, false);

        // Step 6: Initialize AuthManager
        console.log('[App] [6/12] Initializing AuthManager...');
        if (dependencyExists('AuthManager')) {
            try {
                window.EyesOfAzrael.auth = new AuthManager(app);
                console.log('[App] AuthManager initialized');
            } catch (error) {
                console.error('[App] AuthManager initialization failed:', error);
                initState.warnings.push(`AuthManager failed: ${error.message}`);
            }
        } else {
            console.warn('[App] AuthManager not found - authentication features unavailable');
        }

        // Step 6b: Initialize FirebaseCRUDManager
        console.log('[App] [6b/12] Initializing CRUD Manager...');
        if (dependencyExists('FirebaseCRUDManager')) {
            try {
                window.EyesOfAzrael.crudManager = new FirebaseCRUDManager(db, auth);
                console.log('[App] CRUD Manager initialized');
            } catch (error) {
                console.error('[App] FirebaseCRUDManager initialization failed:', error);
                initState.warnings.push(`FirebaseCRUDManager failed: ${error.message}`);
            }
        } else {
            console.warn('[App] FirebaseCRUDManager not found - edit features unavailable');
        }

        // Step 7: Initialize UniversalDisplayRenderer
        console.log('[App] [7/12] Initializing Renderer...');
        if (dependencyExists('UniversalDisplayRenderer')) {
            try {
                window.EyesOfAzrael.renderer = new UniversalDisplayRenderer({
                    enableHover: true,
                    enableExpand: true,
                    enableCorpusLinks: true
                });
                console.log('[App] Renderer initialized');
            } catch (error) {
                console.error('[App] UniversalDisplayRenderer initialization failed:', error);
                initState.warnings.push(`Renderer failed: ${error.message}`);
            }
        } else {
            console.warn('[App] UniversalDisplayRenderer not found - display features limited');
        }

        // Step 8: Initialize SPANavigation (requires renderer)
        console.log('[App] [8/12] Initializing Navigation...');
        if (dependencyExists('SPANavigation')) {
            if (!window.EyesOfAzrael.renderer) {
                console.error('[App] SPANavigation requires UniversalDisplayRenderer but it is not available');
                initState.warnings.push('SPANavigation skipped - missing renderer dependency');
            } else {
                try {
                    window.EyesOfAzrael.navigation = new SPANavigation(
                        db,
                        window.EyesOfAzrael.auth,
                        window.EyesOfAzrael.renderer
                    );
                    initState.navigationReady = true;
                    console.log('[App] Navigation initialized');
                } catch (error) {
                    console.error('[App] SPANavigation initialization failed:', error);
                    initState.warnings.push(`Navigation failed: ${error.message}`);
                }
            }
        } else {
            console.warn('[App] SPANavigation not found - routing unavailable');
        }

        // Step 9: Initialize EnhancedCorpusSearch
        console.log('[App] [9/12] Initializing Search...');
        if (dependencyExists('EnhancedCorpusSearch')) {
            try {
                window.EyesOfAzrael.search = new EnhancedCorpusSearch(db);
                console.log('[App] Search initialized');
            } catch (error) {
                console.error('[App] EnhancedCorpusSearch initialization failed:', error);
                initState.warnings.push(`Search failed: ${error.message}`);
            }
        } else {
            console.warn('[App] EnhancedCorpusSearch not found - search features unavailable');
        }

        // Step 10: Initialize ShaderThemeManager
        console.log('[App] [10/12] Initializing Shaders...');
        if (dependencyExists('ShaderThemeManager')) {
            try {
                window.EyesOfAzrael.shaders = new ShaderThemeManager({
                    quality: 'auto',
                    targetFPS: 60
                });
                console.log('[App] Shaders initialized');

                // Auto-activate shader based on time of day
                const hour = new Date().getHours();
                const theme = (hour >= 6 && hour < 18) ? 'day' : 'night';
                window.EyesOfAzrael.shaders.activate(theme);
            } catch (error) {
                console.error('[App] ShaderThemeManager initialization failed:', error);
                initState.warnings.push(`Shaders failed: ${error.message}`);
            }
        } else {
            console.debug('[App] ShaderThemeManager not found - shader effects unavailable');
        }

        // Step 11: Setup UI components
        console.log('[App] [11/12] Setting up UI components...');

        // Setup auth UI if auth manager exists
        if (window.EyesOfAzrael.auth) {
            setupAuthUI(auth);
        }

        // Setup global error tracking
        setupErrorTracking();

        // Setup global edit icon handler
        setupEditIconHandler();

        initState.servicesReady = true;
        const initDuration = (performance.now() - initState.startTime).toFixed(2);
        console.log(`[App] [12/12] Initialization complete in ${initDuration}ms`);

        // Log any warnings accumulated during initialization
        if (initState.warnings.length > 0) {
            console.warn('[App] Initialization completed with warnings:', initState.warnings);
        }

        // Add breadcrumb for successful initialization
        safeCall('addBreadcrumb', 'app', 'App initialized successfully');

        // Emit app-initialized event (core systems ready)
        document.dispatchEvent(new CustomEvent('app-initialized', {
            detail: {
                duration: parseFloat(initDuration),
                warnings: initState.warnings,
                missingDependencies: initState.missingDependencies
            }
        }));

        // Track if loading has been hidden to prevent duplicate operations
        let loadingHidden = false;

        /**
         * Hide all loading indicators smoothly
         * Handles both initial loader in #main-content and any other loading containers
         */
        function hideAllLoadingIndicators(source = 'unknown') {
            if (loadingHidden) {
                console.debug(`[App Init] Loading already hidden, skipping (source: ${source})`);
                return;
            }
            loadingHidden = true;

            console.log(`[App Init] Hiding loading indicators (source: ${source})`);

            // Hide all loading containers with smooth transition
            const loadingContainers = document.querySelectorAll('.loading-container');
            loadingContainers.forEach((container, index) => {
                // Add fade-out class for CSS transition
                container.classList.add('fade-out');
                container.style.opacity = '0';
                container.style.transition = 'opacity 0.3s ease-out';
                container.style.pointerEvents = 'none';

                setTimeout(() => {
                    container.style.display = 'none';
                    console.debug(`[App Init] Loading container ${index + 1} hidden`);
                }, 300);
            });

            // Also hide auth loading screen if present
            const authLoadingScreen = document.getElementById('auth-loading-screen');
            if (authLoadingScreen && authLoadingScreen.style.display !== 'none') {
                authLoadingScreen.style.opacity = '0';
                authLoadingScreen.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    authLoadingScreen.style.display = 'none';
                    console.debug('[App Init] Auth loading screen hidden');
                }, 300);
            }
        }

        /**
         * Emit app-ready event after first render
         */
        function emitAppReady(source) {
            if (initState.firstRenderComplete) {
                return; // Already emitted
            }
            initState.firstRenderComplete = true;

            const totalDuration = (performance.now() - initState.startTime).toFixed(2);
            console.log(`[App] App fully ready in ${totalDuration}ms (source: ${source})`);

            document.dispatchEvent(new CustomEvent('app-ready', {
                detail: {
                    source,
                    totalDuration: parseFloat(totalDuration),
                    initState: { ...initState }
                }
            }));
        }

        // Listen for first render complete from SPANavigation
        document.addEventListener('first-render-complete', (event) => {
            const route = event.detail?.route || 'unknown';
            console.log(`[App Init] First render complete for route: ${route}`);
            hideAllLoadingIndicators(`first-render-complete:${route}`);
            emitAppReady(`first-render-complete:${route}`);
        });

        // Also listen for render errors to hide loading on failure
        document.addEventListener('render-error', (event) => {
            const route = event.detail?.route || 'unknown';
            console.warn(`[App Init] Render error for route: ${route}, hiding loading`);
            hideAllLoadingIndicators(`render-error:${route}`);
            // Still emit app-ready on error so the app is interactive
            emitAppReady(`render-error:${route}`);
        });

        // Fallback: Hide loading after timeout if first-render-complete never fires
        setTimeout(() => {
            if (!loadingHidden) {
                console.warn(`[App Init] Fallback timeout: hiding loading container after ${CONFIG.LOADING_HIDE_TIMEOUT}ms`);
                hideAllLoadingIndicators('timeout-fallback');
                emitAppReady('timeout-fallback');
            }
        }, CONFIG.LOADING_HIDE_TIMEOUT);

    } catch (error) {
        console.error('[App] Initialization error:', error);

        // Capture error with monitoring if available
        safeCall('captureError', error, {
            phase: 'initialization',
            timestamp: Date.now(),
            url: window.location.href,
            initState: { ...initState }
        });

        showError(error);

        // CRITICAL: Still dispatch app-initialized even on error
        // This prevents other components (like app-coordinator) from waiting forever
        // The error has already been shown to the user via showError()
        const initDuration = (performance.now() - initState.startTime).toFixed(2);
        document.dispatchEvent(new CustomEvent('app-initialized', {
            detail: {
                duration: parseFloat(initDuration),
                error: error.message,
                warnings: initState.warnings,
                missingDependencies: initState.missingDependencies
            }
        }));
    }

    /**
     * Setup authentication UI
     * @param {firebase.auth.Auth} auth - Firebase auth instance
     */
    function setupAuthUI(auth) {
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const signOutBtn = document.getElementById('signOutBtn');

        if (!userInfo) {
            console.debug('[App] Auth UI elements not found in DOM');
            return;
        }

        auth.onAuthStateChanged((user) => {
            if (user) {
                userInfo.style.display = 'flex';
                if (userName) {
                    userName.textContent = user.displayName || user.email;
                }
                if (userAvatar && user.photoURL) {
                    userAvatar.src = user.photoURL;
                }
            } else {
                userInfo.style.display = 'none';
            }
        });

        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error('[Auth] Sign out error:', error);
                }
            });
        }

        console.debug('[App] Auth UI setup complete');
    }

    /**
     * Setup global error tracking
     * Integrates with AnalyticsManager and Sentry if available
     */
    function setupErrorTracking() {
        // Track uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            const error = event.error || new Error(event.message);
            const context = {
                fatal: true,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript_error'
            };

            // Track with AnalyticsManager if available
            if (window.AnalyticsManager && typeof window.AnalyticsManager.trackCustomError === 'function') {
                window.AnalyticsManager.trackCustomError(error, context);
            }

            // Track with Sentry if available
            safeCall('captureError', error, context);
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error
                ? event.reason
                : new Error(String(event.reason));
            const context = {
                fatal: false,
                type: 'unhandled_promise_rejection'
            };

            // Track with AnalyticsManager if available
            if (window.AnalyticsManager && typeof window.AnalyticsManager.trackCustomError === 'function') {
                window.AnalyticsManager.trackCustomError(error, context);
            }

            // Track with Sentry if available
            safeCall('captureError', error, context);
        });

        console.debug('[App] Global error tracking enabled');
    }

    /**
     * Setup global edit icon click handler
     * Uses event delegation for dynamically created elements
     */
    function setupEditIconHandler() {
        document.addEventListener('click', async (e) => {
            // Check if click was on edit icon button or inside it
            const editBtn = e.target.matches('.edit-icon-btn')
                ? e.target
                : e.target.closest('.edit-icon-btn');

            if (!editBtn) return;

            // Stop propagation to prevent card navigation
            e.preventDefault();
            e.stopPropagation();

            const entityId = editBtn.dataset.entityId;
            const collection = editBtn.dataset.collection;

            if (!entityId || !collection) {
                console.error('[EditIcon] Missing entity ID or collection');
                return;
            }

            // Check if EditEntityModal is available
            if (!dependencyExists('EditEntityModal')) {
                console.error('[EditIcon] EditEntityModal not loaded');
                console.info('[EditIcon] Load js/edit-entity-modal.js to enable edit functionality');
                alert('Edit functionality not available. Please ensure all scripts are loaded.');
                return;
            }

            // Check if CRUD manager is available
            if (!window.EyesOfAzrael || !window.EyesOfAzrael.crudManager) {
                console.error('[EditIcon] CRUD Manager not initialized');
                alert('Edit functionality not available. Please ensure the app is properly initialized.');
                return;
            }

            // Open edit modal
            try {
                const modal = new EditEntityModal(window.EyesOfAzrael.crudManager);
                await modal.open(entityId, collection);
            } catch (error) {
                console.error('[EditIcon] Error opening edit modal:', error);
                alert('Failed to open edit modal: ' + error.message);
            }
        });

        console.debug('[App] Global edit icon handler initialized');
    }

    /**
     * Show error message to user
     * @param {Error} error - The error to display
     */
    function showError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Escape HTML in error message
            const safeMessage = error.message
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            mainContent.innerHTML = `
                <div class="error-container" style="
                    text-align: center;
                    padding: 3rem;
                    max-width: 600px;
                    margin: 2rem auto;
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">!</div>
                    <h1>Initialization Error</h1>
                    <p style="color: #ef4444; margin: 1rem 0;">${safeMessage}</p>
                    <details style="text-align: left; margin: 1rem 0; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 8px;">
                        <summary style="cursor: pointer;">Technical Details</summary>
                        <pre style="margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.85rem;">${error.stack || 'No stack trace available'}</pre>
                    </details>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">Reload Page</button>
                </div>
            `;
        }
    }

    // Expose debug function for troubleshooting
    window.debugApp = function() {
        console.log('[Debug] App State:', initState);
        console.log('[Debug] EyesOfAzrael:', window.EyesOfAzrael || {});
        return {
            initState,
            app: window.EyesOfAzrael || {}
        };
    };

})();
