/**
 * Add Entity Card Component
 * Universal component for authenticated users to add new entities
 * Shows/hides based on Firebase auth state
 * Detects entity type from context and navigates to appropriate submission form
 */

(function() {
    'use strict';

    class AddEntityCard {
        constructor(options) {
            this.containerId = options.containerId;
            this.entityType = options.entityType || this.detectEntityType();
            this.mythology = options.mythology || this.detectMythology();
            this.category = options.category || this.detectCategory();
            this.parentEntity = options.parentEntity || this.detectParentEntity();
            this.relationshipType = options.relationshipType || null;
            this.suggestedEntities = options.suggestedEntities || [];
            this.label = options.label || this.generateLabel();
            this.guestLabel = options.guestLabel || `Sign in to add ${this.capitalizeFirst(this.entityType)}`;
            this.icon = options.icon || '+';
            this.redirectUrl = options.redirectUrl || '/theories/user-submissions/edit.html';
            this.showForGuests = options.showForGuests !== undefined ? options.showForGuests : true;
            this.position = options.position || 'end'; // 'start' or 'end' of grid
            this.prePopulateFields = options.prePopulateFields !== undefined ? options.prePopulateFields : true;

            this.currentUser = null;
            this.cardElement = null;
        }

        /**
         * Initialize the component
         */
        async init() {
            try {
                // Wait for Firebase Auth to be ready
                await this.waitForAuth();

                // Listen for auth state changes
                if (window.firebaseAuth) {
                    window.firebaseAuth.onAuthStateChanged((user) => {
                        this.currentUser = user;
                        this.updateVisibility();
                    });
                }

                // Initial render
                this.render();
            } catch (error) {
                console.error('Error initializing AddEntityCard:', error);
            }
        }

        /**
         * Wait for Firebase Auth to be initialized
         */
        async waitForAuth() {
            return new Promise((resolve) => {
                if (window.firebaseAuth && window.firebaseAuth.auth) {
                    resolve();
                } else {
                    const checkAuth = setInterval(() => {
                        if (window.firebaseAuth && window.firebaseAuth.auth) {
                            clearInterval(checkAuth);
                            resolve();
                        }
                    }, 100);

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        clearInterval(checkAuth);
                        resolve();
                    }, 5000);
                }
            });
        }

        /**
         * Detect mythology from page context
         */
        detectMythology() {
            // Check data attribute on main element
            const mainElement = document.querySelector('main[data-mythology]');
            if (mainElement) {
                return mainElement.getAttribute('data-mythology');
            }

            // Check URL path
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const mythologyIndex = pathParts.indexOf('mythos');
            if (mythologyIndex >= 0 && pathParts[mythologyIndex + 1]) {
                return pathParts[mythologyIndex + 1];
            }

            // Check meta tags
            const metaMythology = document.querySelector('meta[name="mythology"]');
            if (metaMythology) {
                return metaMythology.getAttribute('content');
            }

            return null;
        }

        /**
         * Detect entity type from page context if not provided
         */
        detectEntityType() {
            const pathParts = window.location.pathname.split('/').filter(Boolean);

            // Check for common entity type paths
            const entityTypes = ['deities', 'heroes', 'creatures', 'items', 'places', 'herbs', 'rituals', 'texts', 'symbols', 'figures', 'beings'];
            for (const type of entityTypes) {
                if (pathParts.includes(type)) {
                    // Convert plural to singular
                    return type.endsWith('ies') ? type.slice(0, -3) + 'y' : type.slice(0, -1);
                }
            }

            // Check for entity-type meta tag
            const metaEntityType = document.querySelector('meta[name="entity-type"]');
            if (metaEntityType) {
                return metaEntityType.getAttribute('content');
            }

            // Check data attribute on main grid
            const gridElement = document.querySelector('[class*="-grid"][data-entity-type]');
            if (gridElement) {
                return gridElement.getAttribute('data-entity-type');
            }

            return 'entity';
        }

        /**
         * Detect category from page context
         */
        detectCategory() {
            // Check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('category')) {
                return urlParams.get('category');
            }

            // Check data attribute on main element
            const mainElement = document.querySelector('main[data-category]');
            if (mainElement) {
                return mainElement.getAttribute('data-category');
            }

            // Check meta tag
            const metaCategory = document.querySelector('meta[name="category"]');
            if (metaCategory) {
                return metaCategory.getAttribute('content');
            }

            return null;
        }

        /**
         * Detect parent entity from page context
         */
        detectParentEntity() {
            // Check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('parent')) {
                return urlParams.get('parent');
            }

            // Check entity-id meta tag (for detail pages)
            const metaEntityId = document.querySelector('meta[name="entity-id"]');
            if (metaEntityId) {
                return metaEntityId.getAttribute('content');
            }

            // Check data attribute on main element
            const mainElement = document.querySelector('main[data-entity-id]');
            if (mainElement) {
                return mainElement.getAttribute('data-entity-id');
            }

            return null;
        }

        /**
         * Generate appropriate label based on context
         */
        generateLabel() {
            const typeLabel = this.capitalizeFirst(this.entityType);

            if (this.parentEntity) {
                return `Add Related ${typeLabel}`;
            }

            if (this.mythology) {
                const mythologyName = this.capitalizeFirst(this.mythology);
                return `Add ${mythologyName} ${typeLabel}`;
            }

            return `Add New ${typeLabel}`;
        }

        /**
         * Render the add entity card
         */
        render() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.warn(`Container #${this.containerId} not found`);
                return;
            }

            // Create card element
            this.cardElement = document.createElement('div');
            this.cardElement.className = 'add-entity-card';
            this.cardElement.setAttribute('role', 'button');
            this.cardElement.setAttribute('tabindex', '0');

            // Set data attributes for context
            this.cardElement.setAttribute('data-entity-type', this.entityType);
            if (this.mythology) {
                this.cardElement.setAttribute('data-mythology', this.mythology);
            }
            if (this.parentEntity) {
                this.cardElement.setAttribute('data-parent-entity', this.parentEntity);
            }

            // Render appropriate content based on auth state
            this.renderCardContent();

            // Add click handler
            this.cardElement.addEventListener('click', () => this.handleClick());
            this.cardElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleClick();
                }
            });

            // Insert at correct position
            if (this.position === 'start') {
                container.insertBefore(this.cardElement, container.firstChild);
            } else {
                container.appendChild(this.cardElement);
            }

            // Set initial visibility
            this.updateVisibility();
        }

        /**
         * Render card content based on auth state
         */
        renderCardContent() {
            const isLoggedIn = this.currentUser !== null;
            const displayLabel = isLoggedIn ? this.label : this.guestLabel;
            const icon = isLoggedIn ? this.icon : '🔒';

            this.cardElement.setAttribute('aria-label', displayLabel);

            // Add guest state class if not logged in
            if (!isLoggedIn && this.showForGuests) {
                this.cardElement.classList.add('add-entity-card--guest');
            } else {
                this.cardElement.classList.remove('add-entity-card--guest');
            }

            this.cardElement.innerHTML = `
                <div class="add-entity-card__icon">${icon}</div>
                <div class="add-entity-card__label">${displayLabel}</div>
                ${this.parentEntity ? `<div class="add-entity-card__context">Related to current entity</div>` : ''}
            `;
        }

        /**
         * Handle card click
         */
        handleClick() {
            if (!this.currentUser) {
                // Show login modal for guests
                if (window.firebaseAuth) {
                    window.firebaseAuth.showLoginModal();
                }
                return;
            }

            // Store context for form prepopulation
            this.storeContextForSubmission();

            // Build redirect URL with context
            const url = this.buildRedirectUrl();
            window.location.href = url;
        }

        /**
         * Build redirect URL with query parameters
         */
        buildRedirectUrl() {
            const params = new URLSearchParams();

            params.set('action', 'create');
            params.set('type', this.entityType);

            if (this.mythology) {
                params.set('mythology', this.mythology);
            }

            if (this.category) {
                params.set('category', this.category);
            }

            if (this.parentEntity) {
                params.set('parent', this.parentEntity);
            }

            if (this.relationshipType) {
                params.set('relationshipType', this.relationshipType);
            }

            // Add suggested entities for auto-population
            if (this.suggestedEntities.length > 0) {
                params.set('suggestedEntities', JSON.stringify(this.suggestedEntities));
            }

            // Add prepopulate flag
            if (this.prePopulateFields) {
                params.set('prepopulate', 'true');
            }

            return `${this.redirectUrl}?${params.toString()}`;
        }

        /**
         * Update visibility based on auth state
         */
        updateVisibility() {
            if (!this.cardElement) return;

            const shouldShow = this.showForGuests || (this.currentUser !== null);

            if (shouldShow) {
                this.cardElement.style.display = '';
                this.cardElement.classList.add('add-entity-card--visible');

                // Update content when visibility changes
                this.renderCardContent();
            } else {
                this.cardElement.style.display = 'none';
                this.cardElement.classList.remove('add-entity-card--visible');
            }
        }

        /**
         * Get context metadata for submission
         */
        getContextMetadata() {
            return {
                entityType: this.entityType,
                mythology: this.mythology,
                category: this.category,
                parentEntity: this.parentEntity,
                relationshipType: this.relationshipType,
                suggestedEntities: this.suggestedEntities,
                timestamp: new Date().toISOString(),
                pageUrl: window.location.href,
                pagePath: window.location.pathname
            };
        }

        /**
         * Store context in sessionStorage for form prepopulation
         */
        storeContextForSubmission() {
            const context = this.getContextMetadata();
            try {
                sessionStorage.setItem('submission_context', JSON.stringify(context));
            } catch (error) {
                console.warn('Could not store submission context:', error);
            }
        }

        /**
         * Capitalize first letter
         */
        capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * Destroy the component
         */
        destroy() {
            if (this.cardElement && this.cardElement.parentNode) {
                this.cardElement.parentNode.removeChild(this.cardElement);
            }
            this.cardElement = null;
        }
    }

    // Global render function for easy integration
    window.renderAddEntityCard = function(options) {
        const card = new AddEntityCard(options);
        card.init();
        return card;
    };

    // Auto-inject on elements with data attribute
    document.addEventListener('DOMContentLoaded', () => {
        const autoInjectElements = document.querySelectorAll('[data-add-entity-auto]');

        autoInjectElements.forEach(element => {
            const options = {
                containerId: element.id || `add-entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entityType: element.getAttribute('data-entity-type') || 'entity',
                mythology: element.getAttribute('data-mythology') || null,
                category: element.getAttribute('data-category') || null,
                label: element.getAttribute('data-label') || undefined,
                icon: element.getAttribute('data-icon') || undefined,
                redirectUrl: element.getAttribute('data-redirect-url') || undefined,
                showForGuests: element.getAttribute('data-show-guests') === 'true'
            };

            // Set element ID if not present
            if (!element.id) {
                element.id = options.containerId;
            }

            window.renderAddEntityCard(options);
        });
    });

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AddEntityCard;
    }

    // Make class available globally
    window.AddEntityCard = AddEntityCard;

})();
