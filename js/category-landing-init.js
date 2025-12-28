/**
 * Category Landing View Initialization
 * Registers the CategoryLandingView component with the router
 */

(function() {
    'use strict';

    // Wait for both DOM and dependencies to load
    function initCategoryLanding() {
        // Check for required dependencies
        if (!window.DynamicRouter || !window.CategoryLandingView) {
            console.warn('[CategoryLandingInit] Dependencies not ready, retrying...');
            setTimeout(initCategoryLanding, 100);
            return;
        }

        // Get router instance
        const router = window.appRouter;
        if (!router) {
            console.warn('[CategoryLandingInit] Router instance not found, retrying...');
            setTimeout(initCategoryLanding, 100);
            return;
        }

        // Get Firestore instance
        const db = window.firebase && window.firebase.firestore && window.firebase.firestore();
        if (!db) {
            console.warn('[CategoryLandingInit] Firestore not initialized, retrying...');
            setTimeout(initCategoryLanding, 100);
            return;
        }

        // Create CategoryLandingView instance
        const categoryLandingView = new window.CategoryLandingView({
            db: db,
            router: router
        });

        // Register with router
        router.registerComponent('category-landing', categoryLandingView);

        console.log('[CategoryLandingInit] Category landing view initialized and registered');
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryLanding);
    } else {
        initCategoryLanding();
    }
})();
