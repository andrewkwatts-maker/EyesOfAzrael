/**
 * Application Coordinator - Enhanced Version
 * Manages initialization order and ensures auth + navigation work together
 * With detailed state tracking and diagnostic logging
 *
 * INITIALIZATION FLOW:
 * 1. DOM ready (immediate or via DOMContentLoaded)
 * 2. app-initialized event (from app-init-simple.js)
 * 3. Navigation trigger (handleRoute called)
 * 4. auth-ready event (optional, does not block public routes)
 *
 * ERROR RECOVERY:
 * - Timeout fallback if app-initialized never fires (10 seconds)
 * - Timeout fallback if navigation not available (15 seconds)
 * - Error boundaries to prevent UI blocking
 */

(function() {
    'use strict';

    console.log('[App Coordinator] Starting enhanced coordinator...');

    // Configuration
    const CONFIG = {
        APP_INIT_TIMEOUT: 10000,      // 10 seconds to wait for app-initialized
        NAVIGATION_TIMEOUT: 15000,     // 15 seconds to wait for navigation
        HEALTH_CHECK_INTERVAL: 5000,   // 5 seconds between health checks
        MAX_HEALTH_CHECKS: 12          // Stop after 1 minute
    };

    // Track initialization state with timestamps
    const initState = {
        domReady: { status: false, timestamp: null },
        authReady: { status: false, timestamp: null, user: null },
        appReady: { status: false, timestamp: null },
        navigationReady: { status: false, timestamp: null },
        routeTriggered: { status: false, timestamp: null },
        timedOut: { status: false, timestamp: null, reason: null }
    };

    // Track loaded classes/components
    const componentState = {
        firebase: false,
        firestore: false,
        authManager: false,
        homeView: false,
        spaNavigation: false,
        universalDisplayRenderer: false,
        crudManager: false,
        search: false,
        shaders: false
    };

    // Track window.EyesOfAzrael state
    const globalState = {
        namespaceExists: false,
        db: false,
        firebaseAuth: false,
        auth: false,
        crudManager: false,
        renderer: false,
        navigation: false,
        search: false,
        shaders: false
    };

    // Initialization start time
    const startTime = performance.now();

    /**
     * Log state change with timing
     */
    function logStateChange(category, key, value, details = '') {
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[App Coordinator +${elapsed}ms] ${category}.${key} = ${value}${details ? ' - ' + details : ''}`);
    }

    /**
     * Check component availability
     */
    function checkComponents() {
        componentState.firebase = typeof firebase !== 'undefined';
        componentState.firestore = typeof firebase?.firestore !== 'undefined';
        componentState.authManager = typeof AuthManager !== 'undefined';
        componentState.homeView = typeof HomeView !== 'undefined';
        componentState.spaNavigation = typeof SPANavigation !== 'undefined';
        componentState.universalDisplayRenderer = typeof UniversalDisplayRenderer !== 'undefined';
        componentState.crudManager = typeof FirebaseCRUDManager !== 'undefined';
        componentState.search = typeof EnhancedCorpusSearch !== 'undefined';
        componentState.shaders = typeof ShaderThemeManager !== 'undefined';
    }

    /**
     * Check global state
     */
    function checkGlobalState() {
        globalState.namespaceExists = typeof window.EyesOfAzrael !== 'undefined';
        if (globalState.namespaceExists) {
            globalState.db = !!window.EyesOfAzrael.db;
            globalState.firebaseAuth = !!window.EyesOfAzrael.firebaseAuth;
            globalState.auth = !!window.EyesOfAzrael.auth;
            globalState.crudManager = !!window.EyesOfAzrael.crudManager;
            globalState.renderer = !!window.EyesOfAzrael.renderer;
            globalState.navigation = !!window.EyesOfAzrael.navigation;
            globalState.search = !!window.EyesOfAzrael.search;
            globalState.shaders = !!window.EyesOfAzrael.shaders;
        }
    }

    /**
     * Print diagnostic report
     */
    function printDiagnosticReport() {
        const elapsed = Math.round(performance.now() - startTime);

        console.group(`[App Coordinator] Diagnostic Report (+${elapsed}ms)`);

        console.log('📊 Initialization State:', {
            domReady: initState.domReady.status,
            authReady: initState.authReady.status,
            appReady: initState.appReady.status,
            navigationReady: initState.navigationReady.status,
            routeTriggered: initState.routeTriggered.status
        });

        console.log('🔧 Component Classes:', componentState);
        console.log('🌐 Global State:', globalState);

        // Identify missing components
        const missingClasses = Object.entries(componentState)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingClasses.length > 0) {
            console.warn('⚠️ Missing Classes:', missingClasses);
        }

        const missingGlobals = Object.entries(globalState)
            .filter(([key, value]) => key !== 'namespaceExists' && !value)
            .map(([key]) => key);

        if (missingGlobals.length > 0 && globalState.namespaceExists) {
            console.warn('⚠️ Missing Global Properties:', missingGlobals);
        }

        // Calculate timing
        const timing = {
            domReady: initState.domReady.timestamp,
            authReady: initState.authReady.timestamp,
            appReady: initState.appReady.timestamp,
            navigationReady: initState.navigationReady.timestamp,
            routeTriggered: initState.routeTriggered.timestamp
        };
        console.log('⏱️ Timing:', timing);

        console.groupEnd();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initState.domReady.status = true;
            initState.domReady.timestamp = Math.round(performance.now() - startTime);
            logStateChange('initState', 'domReady', true);
            checkAndInitialize();
        });
    } else {
        initState.domReady.status = true;
        initState.domReady.timestamp = 0;
        logStateChange('initState', 'domReady', true, 'already ready');
        // IMPORTANT: Still need to call checkAndInitialize for already-ready DOM
        // Use setTimeout to ensure this runs after other synchronous script setup
        setTimeout(() => checkAndInitialize(), 0);
    }

    // Listen for auth ready (from auth-guard-simple.js)
    document.addEventListener('auth-ready', (event) => {
        initState.authReady.status = true;
        initState.authReady.timestamp = Math.round(performance.now() - startTime);
        initState.authReady.user = event.detail?.user || null;
        const userStatus = event.detail?.user ? 'Logged in' : 'Not logged in';
        logStateChange('initState', 'authReady', true, userStatus);
        checkAndInitialize();
    });

    // Listen for app initialized (from app-init-simple.js)
    document.addEventListener('app-initialized', (event) => {
        initState.appReady.status = true;
        initState.appReady.timestamp = Math.round(performance.now() - startTime);
        const hasError = event.detail?.error ? ` (with error: ${event.detail.error})` : '';
        logStateChange('initState', 'appReady', true, hasError);
        checkAndInitialize();
    });

    // Timeout fallback: If app-initialized never fires, attempt to proceed anyway
    // This handles cases where app-init-simple.js fails silently
    setTimeout(() => {
        if (!initState.appReady.status) {
            const elapsed = Math.round(performance.now() - startTime);
            console.warn(`[App Coordinator +${elapsed}ms] app-initialized timeout after ${CONFIG.APP_INIT_TIMEOUT}ms`);

            initState.timedOut.status = true;
            initState.timedOut.timestamp = elapsed;
            initState.timedOut.reason = 'app-initialized timeout';

            // Check if we can still proceed (navigation might be available)
            checkComponents();
            checkGlobalState();

            if (globalState.navigation) {
                console.log('[App Coordinator] Navigation available despite timeout, attempting to trigger route...');
                initState.appReady.status = true; // Mark as ready to allow proceeding
                initState.appReady.timestamp = elapsed;
                checkAndInitialize();
            } else {
                console.error('[App Coordinator] Navigation not available after timeout');
                showFallbackContent('Application failed to initialize. Please refresh the page.');
            }
        }
    }, CONFIG.APP_INIT_TIMEOUT);

    /**
     * Check if all prerequisites are met and initialize navigation
     */
    function checkAndInitialize() {
        // Prevent re-entry if already triggered
        if (initState.routeTriggered.status) {
            return;
        }

        // Update component and global states
        checkComponents();
        checkGlobalState();

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[App Coordinator +${elapsed}ms] Checking prerequisites...`);

        // Print diagnostic every check (but not too verbose)
        if (elapsed > 1000 || !initState.appReady.status) {
            printDiagnosticReport();
        }

        // CHANGED: Only need DOM and app ready for public routes
        // Auth is optional - public routes don't require authentication
        // SPANavigation handles auth requirements per-route
        if (initState.domReady.status &&
            initState.appReady.status &&
            !initState.navigationReady.status) {

            initState.navigationReady.status = true;
            initState.navigationReady.timestamp = elapsed;
            logStateChange('initState', 'navigationReady', true, 'All prerequisites met');

            // Small delay to ensure all scripts are loaded
            setTimeout(() => {
                triggerInitialRoute();
            }, 100);
        } else {
            // Log what we're still waiting for
            const waiting = [];
            if (!initState.domReady.status) waiting.push('DOM');
            if (!initState.appReady.status) waiting.push('App');
            // Note: Auth is no longer required for initial navigation

            if (waiting.length > 0) {
                console.log(`[App Coordinator +${elapsed}ms] Still waiting for: ${waiting.join(', ')}`);
            }
        }
    }

    /**
     * Trigger the initial route handling
     * Separated for cleaner error handling and retry logic
     *
     * IMPORTANT: SPANavigation.initRouter() already calls handleRoute() during construction.
     * We should NOT call handleRoute() again unless the first call failed.
     * Instead, we just verify that navigation is ready and the route was handled.
     */
    function triggerInitialRoute() {
        // Prevent double-triggering
        if (initState.routeTriggered.status) {
            return;
        }

        const elapsed = Math.round(performance.now() - startTime);

        // Re-check global state after delay
        checkGlobalState();

        if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
            console.log(`[App Coordinator +${elapsed}ms] Navigation initialized successfully`);

            // Check if SPANavigation already handled the initial route
            // SPANavigation.initRouter() calls handleRoute() during construction
            const navigation = window.EyesOfAzrael.navigation;
            const currentRoute = navigation.currentRoute;

            // If currentRoute is set, SPANavigation already handled the initial route
            if (currentRoute !== null) {
                console.log(`[App Coordinator +${elapsed}ms] Route already handled by SPANavigation: ${currentRoute}`);
                initState.routeTriggered.status = true;
                initState.routeTriggered.timestamp = Math.round(performance.now() - startTime);
                logStateChange('initState', 'routeTriggered', true, 'Route already handled by SPANavigation');
                return;
            }

            // Only call handleRoute if it wasn't already called or if navigation lock is free
            // This handles edge cases where SPANavigation constructor failed to call handleRoute
            if (navigation._isNavigating) {
                console.log(`[App Coordinator +${elapsed}ms] Navigation in progress, waiting...`);
                // Navigation is already in progress, mark as triggered and let it complete
                initState.routeTriggered.status = true;
                initState.routeTriggered.timestamp = Math.round(performance.now() - startTime);
                logStateChange('initState', 'routeTriggered', true, 'Navigation already in progress');
                return;
            }

            // Trigger initial route with error handling (fallback case)
            try {
                console.log(`[App Coordinator +${elapsed}ms] Triggering handleRoute (fallback)...`);
                navigation.handleRoute();
                initState.routeTriggered.status = true;
                initState.routeTriggered.timestamp = Math.round(performance.now() - startTime);
                logStateChange('initState', 'routeTriggered', true, 'Initial route handled (fallback)');
            } catch (error) {
                console.error(`[App Coordinator +${elapsed}ms] Error triggering route:`, error);

                // Attempt recovery: show error content instead of blank page
                showFallbackContent('Failed to load the page. Error: ' + (error.message || 'Unknown error'));

                // Still mark as triggered to prevent infinite loops
                initState.routeTriggered.status = true;
                initState.routeTriggered.timestamp = Math.round(performance.now() - startTime);

                printDiagnosticReport();
            }
        } else {
            console.error(`[App Coordinator +${elapsed}ms] Navigation NOT found!`);

            // Detailed diagnostic
            console.group('Navigation Failure Diagnosis');
            console.log('window.EyesOfAzrael exists:', !!window.EyesOfAzrael);

            if (window.EyesOfAzrael) {
                console.log('window.EyesOfAzrael contents:', Object.keys(window.EyesOfAzrael));
                console.log('renderer exists:', !!window.EyesOfAzrael.renderer);
                console.log('navigation exists:', !!window.EyesOfAzrael.navigation);
            }

            console.log('UniversalDisplayRenderer class defined:', typeof UniversalDisplayRenderer !== 'undefined');
            console.log('SPANavigation class defined:', typeof SPANavigation !== 'undefined');
            console.log('HomeView class defined:', typeof HomeView !== 'undefined');

            // Check if scripts loaded
            const scripts = Array.from(document.querySelectorAll('script[src]'))
                .map(s => s.src.split('/').pop());
            console.log('Loaded scripts:', scripts);

            // Check for specific scripts
            const requiredScripts = [
                'universal-display-renderer.js',
                'spa-navigation.js',
                'home-view.js',
                'app-init-simple.js'
            ];
            const missingScripts = requiredScripts.filter(name =>
                !scripts.some(src => src.includes(name))
            );
            if (missingScripts.length > 0) {
                console.error('Missing required scripts:', missingScripts);
            }

            console.groupEnd();
            printDiagnosticReport();

            // Don't show fallback immediately - let health check handle it
            // This allows more time for async loading
        }
    }

    /**
     * Show fallback content when initialization fails completely
     * This prevents the user from seeing a blank page
     * @param {string} message - Error message to display
     */
    function showFallbackContent(message) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 3rem; max-width: 600px; margin: 2rem auto;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">&#9888;</div>
                    <h1 style="color: #ef4444; margin-bottom: 1rem;">Initialization Error</h1>
                    <p style="color: #9ca3af; margin-bottom: 2rem;">${message}</p>
                    <button onclick="location.reload()" class="btn-primary" style="
                        padding: 0.75rem 1.5rem;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">Reload Page</button>
                </div>
            `;
        }

        // Also hide any loading spinners
        const loadingContainers = document.querySelectorAll('.loading-container');
        loadingContainers.forEach(container => {
            container.style.display = 'none';
        });
    }

    // Expose debugging functions
    window.debugInitState = () => {
        checkComponents();
        checkGlobalState();
        return {
            initState,
            componentState,
            globalState,
            elapsed: Math.round(performance.now() - startTime)
        };
    };

    window.debugCoordinator = () => {
        checkComponents();
        checkGlobalState();
        printDiagnosticReport();
    };

    window.forceRouteCheck = () => {
        console.log('[App Coordinator] Forcing route check...');
        checkAndInitialize();
    };

    // Periodic health check
    let healthCheckCount = 0;
    const healthCheckInterval = setInterval(() => {
        healthCheckCount++;

        if (healthCheckCount > CONFIG.MAX_HEALTH_CHECKS) {
            clearInterval(healthCheckInterval);

            // Final check: if route still not triggered, show fallback
            if (!initState.routeTriggered.status) {
                const elapsed = Math.round(performance.now() - startTime);
                console.error(`[App Coordinator +${elapsed}ms] Route never triggered after ${CONFIG.MAX_HEALTH_CHECKS} health checks`);
                showFallbackContent('The page took too long to load. Please check your connection and refresh.');
            }
            return;
        }

        if (!initState.routeTriggered.status) {
            const elapsed = Math.round(performance.now() - startTime);
            console.warn(`[App Coordinator +${elapsed}ms] Route not triggered yet (check ${healthCheckCount}/${CONFIG.MAX_HEALTH_CHECKS})`);
            checkAndInitialize();
        } else {
            clearInterval(healthCheckInterval);
            console.log('[App Coordinator] Health check passed, stopping monitoring');
        }
    }, CONFIG.HEALTH_CHECK_INTERVAL);

})();
