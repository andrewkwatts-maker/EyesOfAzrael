/**
 * Debug Loading Issues
 * Add to index.html temporarily to diagnose loading problems
 */

(function() {
    const startTime = performance.now();
    const events = [];

    function log(message, data = {}) {
        const timestamp = performance.now() - startTime;
        const logEntry = {
            time: timestamp.toFixed(2) + 'ms',
            message,
            ...data
        };
        events.push(logEntry);
        console.log(`[DEBUG ${logEntry.time}]`, message, data);
    }

    log('Debug script started');

    // Track readyState changes
    log('Initial readyState', { readyState: document.readyState });

    document.addEventListener('readystatechange', () => {
        log('ReadyState changed', { readyState: document.readyState });
    });

    // Track DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        log('DOMContentLoaded fired');
    });

    // Track window load
    window.addEventListener('load', () => {
        log('Window load fired');
    });

    // Track app initialization
    document.addEventListener('app-initialized', () => {
        log('App initialized event fired');
    });

    // Track first render
    document.addEventListener('first-render-complete', () => {
        log('First render complete event fired');
    });

    // Check for Firebase
    setTimeout(() => {
        log('Firebase check', {
            loaded: typeof firebase !== 'undefined',
            apps: typeof firebase !== 'undefined' ? firebase.apps.length : 0
        });
    }, 100);

    // Check for critical components
    setTimeout(() => {
        log('Component check', {
            SPANavigation: typeof SPANavigation !== 'undefined',
            HomeView: typeof HomeView !== 'undefined',
            AuthManager: typeof AuthManager !== 'undefined',
            UniversalDisplayRenderer: typeof UniversalDisplayRenderer !== 'undefined'
        });
    }, 500);

    // Check loading container
    setInterval(() => {
        const loading = document.querySelector('.loading-container');
        if (loading) {
            log('Loading container still visible', {
                display: window.getComputedStyle(loading).display,
                opacity: window.getComputedStyle(loading).opacity
            });
        }
    }, 2000);

    // Expose debug info
    window.debugLoading = function() {
        console.table(events);
        return {
            events,
            firebase: {
                loaded: typeof firebase !== 'undefined',
                apps: typeof firebase !== 'undefined' ? firebase.apps.length : 0,
                auth: typeof firebase !== 'undefined' && firebase.apps.length > 0 ?
                    firebase.auth().currentUser : null
            },
            components: {
                SPANavigation: typeof SPANavigation !== 'undefined',
                HomeView: typeof HomeView !== 'undefined',
                AuthManager: typeof AuthManager !== 'undefined',
                UniversalDisplayRenderer: typeof UniversalDisplayRenderer !== 'undefined'
            },
            dom: {
                readyState: document.readyState,
                loadingVisible: !!document.querySelector('.loading-container[style*="display: none"]')
            },
            eyesOfAzrael: window.EyesOfAzrael || {}
        };
    };

    log('Debug functions available: window.debugLoading()');
})();
