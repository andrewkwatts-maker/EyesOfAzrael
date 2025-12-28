/**
 * Entity Card Quick View Handler
 * Eyes of Azrael Project
 *
 * Global click handler for entity cards to open quick view modals
 * Automatically initializes when app is ready
 */

(function() {
    'use strict';

    /**
     * Initialize entity card click handlers
     */
    function initializeEntityCardQuickView() {
        console.log('[EntityCardQuickView] Initializing global click handler...');

        // Wait for app initialization
        const initHandler = () => {
            const db = window.EyesOfAzrael?.db;

            if (!db) {
                console.warn('[EntityCardQuickView] Firestore not available, skipping initialization');
                return;
            }

            if (typeof EntityQuickViewModal === 'undefined') {
                console.warn('[EntityCardQuickView] EntityQuickViewModal not loaded, skipping initialization');
                return;
            }

            // Add global click handler to document
            document.addEventListener('click', handleEntityCardClick);
            console.log('[EntityCardQuickView] Global click handler attached');
        };

        // Check if app is already initialized
        if (window.EyesOfAzrael?.db) {
            initHandler();
        } else {
            // Wait for app-initialized event
            document.addEventListener('app-initialized', initHandler, { once: true });
        }
    }

    /**
     * Handle clicks on entity cards
     */
    function handleEntityCardClick(e) {
        // Check if clicked element or parent is an entity card
        const card = e.target.closest('.entity-card, .mythology-card, .deity-card, .hero-card, .creature-card, .panel-card, .related-entity-card');

        if (!card) return;

        // Don't trigger if clicking on a link, button, or interactive element
        if (e.target.matches('a, button, input, select, textarea, .edit-icon-btn, .delete-btn, .btn-primary, .btn-secondary')) {
            return;
        }

        // Don't trigger if clicking inside a link or button
        if (e.target.closest('a, button, .edit-icon-btn, .delete-btn')) {
            return;
        }

        // Check if card has required data attributes
        const entityId = card.dataset.entityId || card.dataset.id;
        const collection = card.dataset.collection || card.dataset.type;
        const mythology = card.dataset.mythology;

        if (!entityId || !collection) {
            console.log('[EntityCardQuickView] Card missing required data attributes:', {
                entityId,
                collection,
                mythology
            });
            return;
        }

        // Prevent default card behavior
        e.preventDefault();
        e.stopPropagation();

        // Open quick view modal
        openQuickViewModal(entityId, collection, mythology);
    }

    /**
     * Open entity quick view modal
     */
    function openQuickViewModal(entityId, collection, mythology) {
        const db = window.EyesOfAzrael?.db;

        if (!db) {
            console.error('[EntityCardQuickView] Firestore not available');
            return;
        }

        if (typeof EntityQuickViewModal === 'undefined') {
            console.error('[EntityCardQuickView] EntityQuickViewModal not loaded');
            // Fallback to navigation
            const fallbackUrl = `#/mythology/${mythology}/${collection}/${entityId}`;
            window.location.hash = fallbackUrl;
            return;
        }

        try {
            console.log('[EntityCardQuickView] Opening modal for:', {
                entityId,
                collection,
                mythology: mythology || 'unknown'
            });

            const modal = new EntityQuickViewModal(db);
            modal.open(entityId, collection, mythology || 'unknown');

        } catch (error) {
            console.error('[EntityCardQuickView] Error opening modal:', error);
            // Fallback to navigation
            const fallbackUrl = `#/mythology/${mythology}/${collection}/${entityId}`;
            window.location.hash = fallbackUrl;
        }
    }

    /**
     * Add data attributes to entity cards that don't have them
     * This helps ensure compatibility with existing cards
     */
    function enrichEntityCards() {
        // This is called periodically to catch dynamically added cards
        const cards = document.querySelectorAll('.entity-card, .mythology-card, .deity-card, .hero-card, .creature-card, .panel-card');

        cards.forEach(card => {
            // Skip cards that already have all attributes
            if (card.dataset.entityId && card.dataset.collection && card.dataset.mythology) {
                return;
            }

            // Try to extract from href if it's a link
            const link = card.href || card.querySelector('a')?.href;
            if (link) {
                const match = link.match(/#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
                if (match) {
                    card.dataset.mythology = card.dataset.mythology || match[1];
                    card.dataset.collection = card.dataset.collection || match[2];
                    card.dataset.entityId = card.dataset.entityId || match[3];
                }
            }
        });
    }

    // Initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEntityCardQuickView);
    } else {
        initializeEntityCardQuickView();
    }

    // Periodically enrich entity cards (for dynamically added content)
    // This ensures cards added after page load also get quick view functionality
    setInterval(enrichEntityCards, 2000);

    // Export for manual initialization if needed
    window.EntityCardQuickView = {
        initialize: initializeEntityCardQuickView,
        enrichCards: enrichEntityCards
    };

})();
