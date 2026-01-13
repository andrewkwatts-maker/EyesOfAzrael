/**
 * Router Module Index
 * Exports all router-related utilities for the Eyes of Azrael SPA
 *
 * This modular architecture extracts functionality from the monolithic
 * spa-navigation.js into focused, testable modules.
 *
 * Usage (Browser):
 *   <script src="js/router/index.js"></script>
 *   // All modules available as globals: NavigationMetrics, ScrollManager, etc.
 *
 * Usage (ES Modules):
 *   import { NavigationMetrics, ScrollManager } from './router/index.js';
 *
 * Module Overview:
 * ================
 *
 * Phase 1 - Utility Modules:
 * - NavigationMetrics: Performance tracking for navigation events
 * - ScrollManager: Save/restore scroll positions for history navigation
 * - RouteMatcher: Pattern matching and route parsing utilities
 * - TransitionManager: Page transition animations
 * - RenderUtilities: Shared rendering helpers (loading, errors, etc.)
 * - RoutePreloader: Hover-based prefetching for improved performance
 *
 * Phase 2 - Manager Classes:
 * - AccessibilityManager: Screen reader announcements and focus management
 * - HistoryManager: Navigation history and browser history state
 */

// Load all modules in dependency order
const modules = [
    'navigation-metrics.js',
    'scroll-manager.js',
    'route-matcher.js',
    'transition-manager.js',
    'render-utilities.js',
    'route-preloader.js',
    'accessibility-manager.js',
    'history-manager.js'
];

// For browser script loading
if (typeof document !== 'undefined') {
    // Script loading helper for browsers
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src*="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Expose module loading function
    window.loadRouterModules = async function(basePath = 'js/router/') {
        for (const mod of modules) {
            try {
                await loadScript(basePath + mod);
            } catch (e) {
                console.error(`Failed to load router module: ${mod}`, e);
            }
        }
        console.log('[Router] All modules loaded');
    };
}

// For ES module systems
if (typeof module !== 'undefined' && module.exports) {
    // Node.js exports
    module.exports = {
        NavigationMetrics: require('./navigation-metrics'),
        ScrollManager: require('./scroll-manager'),
        RouteMatcher: require('./route-matcher'),
        TransitionManager: require('./transition-manager'),
        RenderUtilities: require('./render-utilities'),
        RoutePreloader: require('./route-preloader'),
        AccessibilityManager: require('./accessibility-manager'),
        HistoryManager: require('./history-manager')
    };
}

/**
 * Router Module API Reference
 * ===========================
 *
 * NavigationMetrics
 * -----------------
 * Track performance data for navigation events.
 *
 *   NavigationMetrics.startNavigation(route)    // Start timing
 *   NavigationMetrics.recordPhase(metric, name) // Record phase
 *   NavigationMetrics.finishNavigation(metric)  // Complete metric
 *   NavigationMetrics.getMetrics()              // Get all metrics
 *   NavigationMetrics.getAverageTime()          // Average nav time
 *
 * ScrollManager
 * -------------
 * Save and restore scroll positions.
 *
 *   ScrollManager.save(path)                    // Save current position
 *   ScrollManager.restore(path, smooth)         // Restore position
 *   ScrollManager.scrollToTop(smooth)           // Scroll to top
 *
 * RouteMatcher
 * ------------
 * Route pattern matching and parsing.
 *
 *   RouteMatcher.match(path)                    // Match route pattern
 *   RouteMatcher.getCollectionName(type)        // deity -> deities
 *   RouteMatcher.parseBreadcrumbs(path)         // Generate breadcrumbs
 *
 * TransitionManager
 * -----------------
 * Page transition animations.
 *
 *   TransitionManager.applyExitTransition(el)   // Exit animation
 *   TransitionManager.applyEnterTransition(el)  // Enter animation
 *   TransitionManager.fadeOut(el, duration)     // Fade out
 *   TransitionManager.fadeIn(el, duration)      // Fade in
 *
 * RenderUtilities
 * ---------------
 * Shared rendering helpers.
 *
 *   RenderUtilities.escapeHtml(text)            // XSS prevention
 *   RenderUtilities.getLoadingHTML(message)     // Loading state HTML
 *   RenderUtilities.getErrorHTML(title, msg)    // Error state HTML
 *   RenderUtilities.get404HTML(path)            // 404 page HTML
 *   RenderUtilities.showLoading(container)      // Show loading
 *   RenderUtilities.showError(container, err)   // Show error
 *
 * RoutePreloader
 * --------------
 * Hover-based prefetching.
 *
 *   RoutePreloader.init(firestoreDb)            // Initialize
 *   RoutePreloader.prefetch(path)               // Prefetch route
 *   RoutePreloader.getCached(path)              // Get cached data
 *   RoutePreloader.clearCache()                 // Clear cache
 *
 * AccessibilityManager
 * --------------------
 * Screen reader and focus management.
 *
 *   AccessibilityManager.init()                 // Initialize
 *   AccessibilityManager.announceRouteChange()  // Announce route
 *   AccessibilityManager.announceLoading()      // Announce loading
 *   AccessibilityManager.manageFocus()          // Move focus
 *
 * HistoryManager
 * --------------
 * Navigation history tracking.
 *
 *   HistoryManager.add(path, metadata)          // Add to history
 *   HistoryManager.getAll()                     // Get all history
 *   HistoryManager.back()                       // Go back
 *   HistoryManager.forward()                    // Go forward
 *   HistoryManager.pushState(path, state)       // Push browser state
 *   HistoryManager.replaceState(path, state)    // Replace browser state
 */
