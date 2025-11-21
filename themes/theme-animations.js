/**
 * Theme Animations Performance Manager
 * Handles pausing/resuming animations based on page visibility
 */

(function() {
    'use strict';

    // Track visibility state
    function handleVisibilityChange() {
        if (document.hidden) {
            document.body.classList.remove('tab-visible');
        } else {
            document.body.classList.add('tab-visible');
        }
    }

    // Initialize visibility tracking
    if (typeof document.hidden !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Set initial state
        if (!document.hidden) {
            document.body.classList.add('tab-visible');
        }
    }

    // Add staggered animation delays to prevent all elements animating in sync
    function staggerAnimations() {
        const animatedElements = document.querySelectorAll(
            '.glass-card, .nav-card, .mythos-card, .stat-card, .herb-card, .magic-card'
        );

        animatedElements.forEach((element, index) => {
            // Add a slight delay offset (0-2s) based on element index
            const delay = (index % 10) * 0.2;
            element.style.animationDelay = `${delay}s`;
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', staggerAnimations);
    } else {
        staggerAnimations();
    }

    // Re-apply on theme change (listen for theme picker events)
    window.addEventListener('themeChanged', staggerAnimations);

})();
