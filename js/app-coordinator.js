/**
 * Application Coordinator - Enhanced Version
 * Manages initialization order and ensures auth + navigation work together
 * With detailed state tracking and diagnostic logging
 */

(function() {
    'use strict';

    console.log('[App Coordinator] Starting enhanced coordinator...');

    // Track initialization state with timestamps
    const initState = {
        domReady: { status: false, timestamp: null },
        authReady: { status: false, timestamp: null, user: null },
        appReady: { status: false, timestamp: null },
        navigationReady: { status: false, timestamp: null },
        routeTriggered: { status: false, timestamp: null }
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
    document.addEventListener('app-initialized', () => {
        initState.appReady.status = true;
        initState.appReady.timestamp = Math.round(performance.now() - startTime);
        logStateChange('initState', 'appReady', true);
        checkAndInitialize();
    });

    /**
     * Check if all prerequisites are met and initialize navigation
     */
    function checkAndInitialize() {
        // Update component and global states
        checkComponents();
        checkGlobalState();

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`[App Coordinator +${elapsed}ms] Checking prerequisites...`);

        // Print diagnostic every check
        printDiagnosticReport();

        // Need DOM, auth, and app ready before initializing navigation
        if (initState.domReady.status &&
            initState.authReady.status &&
            initState.appReady.status &&
            !initState.navigationReady.status) {

            initState.navigationReady.status = true;
            initState.navigationReady.timestamp = elapsed;
            logStateChange('initState', 'navigationReady', true, 'All prerequisites met');

            // Small delay to ensure all scripts are loaded
            setTimeout(() => {
                const delayedElapsed = Math.round(performance.now() - startTime);

                // Re-check global state after delay
                checkGlobalState();

                if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
                    console.log(`[App Coordinator +${delayedElapsed}ms] ✅ Navigation initialized successfully`);

                    // Trigger initial route
                    try {
                        window.EyesOfAzrael.navigation.handleRoute();
                        initState.routeTriggered.status = true;
                        initState.routeTriggered.timestamp = Math.round(performance.now() - startTime);
                        logStateChange('initState', 'routeTriggered', true, 'Initial route handled');
                    } catch (error) {
                        console.error(`[App Coordinator +${delayedElapsed}ms] ❌ Error triggering route:`, error);
                        printDiagnosticReport();
                    }
                } else {
                    console.error(`[App Coordinator +${delayedElapsed}ms] ❌ Navigation NOT found!`);

                    // Detailed diagnostic
                    console.group('🔍 Navigation Failure Diagnosis');
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
                        console.error('❌ Missing required scripts:', missingScripts);
                    }

                    console.groupEnd();
                    printDiagnosticReport();
                }
            }, 100);
        } else {
            // Log what we're still waiting for
            const waiting = [];
            if (!initState.domReady.status) waiting.push('DOM');
            if (!initState.authReady.status) waiting.push('Auth');
            if (!initState.appReady.status) waiting.push('App');

            if (waiting.length > 0) {
                console.log(`[App Coordinator +${elapsed}ms] Still waiting for: ${waiting.join(', ')}`);
            }
        }
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

    // Periodic health check (every 5 seconds for first minute)
    let healthCheckCount = 0;
    const healthCheckInterval = setInterval(() => {
        healthCheckCount++;

        if (healthCheckCount > 12) { // Stop after 1 minute
            clearInterval(healthCheckInterval);
            return;
        }

        if (!initState.routeTriggered.status) {
            const elapsed = Math.round(performance.now() - startTime);
            console.warn(`[App Coordinator +${elapsed}ms] ⚠️ Route not triggered yet (check ${healthCheckCount}/12)`);
            checkAndInitialize();
        } else {
            clearInterval(healthCheckInterval);
            console.log('[App Coordinator] ✅ Health check passed, stopping monitoring');
        }
    }, 5000);

})();
