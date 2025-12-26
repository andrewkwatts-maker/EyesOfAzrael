/**
 * DOM State Debugger
 * Logs DOM state changes at key moments during authentication and initialization
 *
 * Usage: Add this script to index.html AFTER auth-guard-simple.js:
 * <script src="js/dom-state-debugger.js"></script>
 *
 * This will automatically log DOM state changes to the console.
 * Remove when debugging is complete.
 */

(function() {
    'use strict';

    console.log('%c[DOM Debugger] 🔍 Activated', 'color: cyan; font-weight: bold; font-size: 14px;');

    // Track state changes
    const stateLog = [];

    /**
     * Log current DOM state
     */
    function logDOMState(label) {
        const timestamp = new Date().toISOString();
        const mainContent = document.getElementById('main-content');
        const authOverlay = document.getElementById('auth-overlay');
        const authLoading = document.getElementById('auth-loading-screen');
        const loadingContainer = document.querySelector('.loading-container');

        const state = {
            timestamp,
            label,
            body: {
                classes: document.body.className,
                classList: Array.from(document.body.classList)
            },
            mainContent: mainContent ? {
                exists: true,
                display: mainContent.style.display,
                computedDisplay: getComputedStyle(mainContent).display,
                visibility: getComputedStyle(mainContent).visibility,
                opacity: getComputedStyle(mainContent).opacity,
                dimensions: mainContent.getBoundingClientRect(),
                isEmpty: mainContent.children.length === 0,
                childCount: mainContent.children.length,
                innerHTML: mainContent.innerHTML.substring(0, 200) + '...'
            } : { exists: false },
            authOverlay: authOverlay ? {
                exists: true,
                display: authOverlay.style.display,
                computedDisplay: getComputedStyle(authOverlay).display
            } : { exists: false },
            authLoading: authLoading ? {
                exists: true,
                display: authLoading.style.display,
                computedDisplay: getComputedStyle(authLoading).display
            } : { exists: false },
            loadingContainer: loadingContainer ? {
                exists: true,
                display: loadingContainer.style.display,
                computedDisplay: getComputedStyle(loadingContainer).display,
                isVisible: getComputedStyle(loadingContainer).display !== 'none'
            } : { exists: false }
        };

        stateLog.push(state);

        // Format console output
        console.group(`%c[DOM Debugger] 📸 ${label}`, 'color: cyan; font-weight: bold;');
        console.log('⏰ Timestamp:', timestamp);
        console.log('🎨 Body Classes:', state.body.classes || '(none)');

        // Main Content
        console.group('📦 #main-content');
        if (state.mainContent.exists) {
            console.log('Display (inline):', state.mainContent.display || '(not set)');
            console.log('Display (computed):', state.mainContent.computedDisplay);
            console.log('Visibility:', state.mainContent.visibility);
            console.log('Opacity:', state.mainContent.opacity);
            console.log('Dimensions:', state.mainContent.dimensions);
            console.log('Is Empty:', state.mainContent.isEmpty);
            console.log('Child Count:', state.mainContent.childCount);
            console.log('Content Preview:', state.mainContent.innerHTML);

            // Visual indicator
            if (state.mainContent.computedDisplay === 'none') {
                console.warn('❌ HIDDEN - Main content is not visible!');
            } else if (state.mainContent.isEmpty) {
                console.warn('⚠️ EMPTY - Main content is visible but has no children!');
            } else {
                console.log('✅ VISIBLE - Main content is showing');
            }
        } else {
            console.error('❌ MISSING - #main-content element not found!');
        }
        console.groupEnd();

        // Loading Container
        console.group('⏳ .loading-container');
        if (state.loadingContainer.exists) {
            console.log('Display (inline):', state.loadingContainer.display || '(not set)');
            console.log('Display (computed):', state.loadingContainer.computedDisplay);
            console.log('Is Visible:', state.loadingContainer.isVisible);

            if (state.loadingContainer.isVisible) {
                console.warn('⚠️ VISIBLE - Loading container is still showing (should be hidden after auth)');
            } else {
                console.log('✅ HIDDEN - Loading container is properly hidden');
            }
        } else {
            console.log('ℹ️ NOT FOUND - Loading container removed from DOM');
        }
        console.groupEnd();

        // Auth Screens
        console.group('🔐 Auth Screens');
        console.log('Auth Overlay:', state.authOverlay.exists ?
            `${state.authOverlay.computedDisplay}` : 'Not found');
        console.log('Auth Loading:', state.authLoading.exists ?
            `${state.authLoading.computedDisplay}` : 'Not found');
        console.groupEnd();

        console.groupEnd();

        return state;
    }

    /**
     * Monitor body class changes
     */
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const oldClasses = mutation.oldValue || '';
                const newClasses = document.body.className;

                if (oldClasses !== newClasses) {
                    console.log('%c[DOM Debugger] 🎨 Body class changed', 'color: yellow; font-weight: bold;');
                    console.log('From:', oldClasses || '(none)');
                    console.log('To:', newClasses || '(none)');

                    logDOMState(`Body class changed: ${newClasses || '(none)'}`);
                }
            }
        });
    });

    bodyObserver.observe(document.body, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['class']
    });

    /**
     * Monitor #main-content style changes
     */
    function setupMainContentObserver() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.warn('[DOM Debugger] #main-content not found yet, will retry...');
            setTimeout(setupMainContentObserver, 100);
            return;
        }

        const mainContentObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    console.log('%c[DOM Debugger] 🎨 #main-content style changed', 'color: orange; font-weight: bold;');
                    console.log('New style:', mainContent.getAttribute('style'));

                    logDOMState('#main-content style changed');
                }

                if (mutation.type === 'childList') {
                    console.log('%c[DOM Debugger] 👶 #main-content children changed', 'color: lightblue; font-weight: bold;');
                    console.log('Added:', mutation.addedNodes.length, 'nodes');
                    console.log('Removed:', mutation.removedNodes.length, 'nodes');

                    logDOMState('#main-content children changed');
                }
            });
        });

        mainContentObserver.observe(mainContent, {
            attributes: true,
            attributeFilter: ['style'],
            childList: true,
            subtree: false
        });

        console.log('[DOM Debugger] ✅ Monitoring #main-content');
    }

    /**
     * Listen for key events
     */

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            logDOMState('DOM Ready');
            setupMainContentObserver();
        });
    } else {
        logDOMState('DOM Already Ready');
        setupMainContentObserver();
    }

    // Auth Ready
    document.addEventListener('auth-ready', (event) => {
        const authenticated = event.detail?.authenticated;
        const user = event.detail?.user;

        console.log('%c[DOM Debugger] 🔐 Auth Ready Event', 'color: lime; font-weight: bold; font-size: 14px;');
        console.log('Authenticated:', authenticated);
        console.log('User:', user ? user.email : 'None');

        logDOMState(`Auth Ready (${authenticated ? 'Logged In' : 'Not Logged In'})`);
    });

    // App Initialized
    document.addEventListener('app-initialized', () => {
        console.log('%c[DOM Debugger] 🚀 App Initialized Event', 'color: lime; font-weight: bold; font-size: 14px;');

        logDOMState('App Initialized');
    });

    // Page Load
    window.addEventListener('load', () => {
        logDOMState('Page Load Complete');
    });

    /**
     * Periodic checks (every 2 seconds for first 30 seconds)
     */
    let checkCount = 0;
    const maxChecks = 15; // 15 checks * 2 seconds = 30 seconds

    const periodicCheck = setInterval(() => {
        checkCount++;
        logDOMState(`Periodic Check ${checkCount}/${maxChecks}`);

        if (checkCount >= maxChecks) {
            clearInterval(periodicCheck);
            console.log('%c[DOM Debugger] ⏹️ Periodic checks complete', 'color: cyan; font-weight: bold;');
        }
    }, 2000);

    /**
     * Export functions for manual debugging
     */
    window.debugDOM = {
        /**
         * Log current state
         */
        logState: () => logDOMState('Manual Check'),

        /**
         * Get full state log
         */
        getLog: () => stateLog,

        /**
         * Print summary
         */
        summary: () => {
            console.group('%c[DOM Debugger] 📊 Summary', 'color: cyan; font-weight: bold; font-size: 16px;');
            console.log('Total state logs:', stateLog.length);

            console.group('Current State');
            const current = logDOMState('Summary Check');
            console.groupEnd();

            console.group('State History');
            stateLog.forEach((state, i) => {
                console.log(`${i + 1}. ${state.label} (${state.timestamp})`);
                console.log('   Body:', state.body.classes || '(none)');
                console.log('   Main Content:', state.mainContent.exists ?
                    `display: ${state.mainContent.computedDisplay}` : 'NOT FOUND');
            });
            console.groupEnd();

            console.groupEnd();
        },

        /**
         * Check if content is visible
         */
        isContentVisible: () => {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return false;

            const style = getComputedStyle(mainContent);
            const isVisible = style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            parseFloat(style.opacity) > 0;

            console.log('Main Content Visible:', isVisible);
            return isVisible;
        },

        /**
         * Force show main content (for testing)
         */
        forceShowContent: () => {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
                mainContent.style.visibility = 'visible';
                mainContent.style.opacity = '1';
                console.log('✅ Forced main content to be visible');
                logDOMState('Forced Visible');
            } else {
                console.error('❌ #main-content not found');
            }
        },

        /**
         * Hide loading container (for testing)
         */
        hideLoading: () => {
            const loadingContainer = document.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
                console.log('✅ Hidden loading container');
                logDOMState('Loading Hidden');
            } else {
                console.warn('⚠️ Loading container not found');
            }
        },

        /**
         * Check all visibility rules
         */
        checkVisibility: () => {
            console.group('%c[DOM Debugger] 👁️ Visibility Check', 'color: cyan; font-weight: bold;');

            const checks = [
                { id: 'main-content', name: 'Main Content' },
                { id: 'auth-overlay', name: 'Auth Overlay' },
                { id: 'auth-loading-screen', name: 'Auth Loading' }
            ];

            checks.forEach(({ id, name }) => {
                const el = document.getElementById(id);
                if (el) {
                    const style = getComputedStyle(el);
                    console.group(name);
                    console.log('Inline display:', el.style.display || '(not set)');
                    console.log('Computed display:', style.display);
                    console.log('Visibility:', style.visibility);
                    console.log('Opacity:', style.opacity);
                    console.log('Z-index:', style.zIndex);
                    console.log('Position:', style.position);

                    const rect = el.getBoundingClientRect();
                    console.log('Dimensions:', {
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        left: rect.left
                    });

                    const isVisible = style.display !== 'none' &&
                                    style.visibility !== 'hidden' &&
                                    parseFloat(style.opacity) > 0 &&
                                    rect.width > 0 &&
                                    rect.height > 0;

                    console.log(isVisible ? '✅ VISIBLE' : '❌ HIDDEN');
                    console.groupEnd();
                } else {
                    console.warn(`❌ ${name} not found`);
                }
            });

            console.groupEnd();
        }
    };

    console.log('%c[DOM Debugger] 💡 Usage:', 'color: yellow; font-weight: bold;');
    console.log('debugDOM.logState()         - Log current state');
    console.log('debugDOM.summary()          - Show state summary');
    console.log('debugDOM.isContentVisible() - Check if content is visible');
    console.log('debugDOM.checkVisibility()  - Check all element visibility');
    console.log('debugDOM.forceShowContent() - Force main content visible (testing)');
    console.log('debugDOM.hideLoading()      - Hide loading container (testing)');
    console.log('debugDOM.getLog()           - Get full state history');

})();
