/**
 * Application Coordinator
 * Manages initialization order and ensures auth + navigation work together
 */

(function() {
    'use strict';

    console.log('[App Coordinator] Starting...');

    // Track initialization state
    const initState = {
        domReady: false,
        authReady: false,
        appReady: false,
        navigationReady: false
    };

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initState.domReady = true;
            console.log('[App Coordinator] DOM ready');
            checkAndInitialize();
        });
    } else {
        initState.domReady = true;
        console.log('[App Coordinator] DOM already ready');
    }

    // Listen for auth ready (from auth-guard-simple.js)
    document.addEventListener('auth-ready', (event) => {
        initState.authReady = true;
        console.log('[App Coordinator] Auth ready, user:', event.detail?.user ? 'Logged in' : 'Not logged in');
        checkAndInitialize();
    });

    // Listen for app initialized (from app-init-simple.js)
    document.addEventListener('app-initialized', () => {
        initState.appReady = true;
        console.log('[App Coordinator] App initialized');
        checkAndInitialize();
    });

    /**
     * Check if all prerequisites are met and initialize navigation
     */
    function checkAndInitialize() {
        console.log('[App Coordinator] State check:', initState);

        // Need DOM and auth ready before initializing navigation
        if (initState.domReady && initState.authReady && !initState.navigationReady) {
            initState.navigationReady = true;
            console.log('[App Coordinator] All prerequisites met, initializing navigation...');

            // Small delay to ensure all scripts are loaded
            setTimeout(() => {
                if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
                    console.log('[App Coordinator] ✅ Navigation already initialized by app-init');
                    // Navigation is already initialized, just trigger initial route
                    window.EyesOfAzrael.navigation.handleRoute();
                } else {
                    console.warn('[App Coordinator] ⚠️ Navigation not found, waiting for app-init');
                }
            }, 100);
        }
    }

    // Expose state for debugging
    window.debugInitState = () => initState;

})();
