/**
 * Edit Icon Component
 * Renders edit icons on entity cards for content created by current user
 * Compares entity.createdBy with firebase.auth().currentUser.uid
 * Stops event propagation to prevent navigation to detail page
 */

(function() {
    'use strict';

    class EditIcon {
        constructor(options) {
            this.cardElement = options.cardElement;
            this.entityId = options.entityId;
            this.entityType = options.entityType || 'entity';
            this.createdBy = options.createdBy;
            this.mythology = options.mythology || null;
            this.redirectUrl = options.redirectUrl || '/theories/user-submissions/edit.html';
            this.icon = options.icon || '✏️';
            this.position = options.position || 'top-right'; // top-right, top-left, bottom-right, bottom-left
            this.size = options.size || 'medium'; // small, medium, large
            this.showTooltip = options.showTooltip !== false;

            this.currentUser = null;
            this.iconElement = null;
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
                console.error('Error initializing EditIcon:', error);
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
         * Check if current user owns this entity
         */
        isOwner() {
            if (!this.currentUser || !this.createdBy) {
                return false;
            }

            return this.currentUser.uid === this.createdBy;
        }

        /**
         * Render the edit icon
         */
        render() {
            if (!this.cardElement) {
                console.warn('Card element not provided for EditIcon');
                return;
            }

            // Create icon element
            this.iconElement = document.createElement('button');
            this.iconElement.className = `edit-icon edit-icon--${this.position} edit-icon--${this.size}`;
            this.iconElement.setAttribute('type', 'button');
            this.iconElement.setAttribute('aria-label', 'Edit entity');

            // Add tooltip if enabled
            if (this.showTooltip) {
                this.iconElement.setAttribute('title', 'Edit this entity');
            }

            // Set icon content
            this.iconElement.innerHTML = `
                <span class="edit-icon__symbol">${this.icon}</span>
            `;

            // Add click handler
            this.iconElement.addEventListener('click', (e) => this.handleClick(e));

            // Make card position relative if not already
            const computedStyle = window.getComputedStyle(this.cardElement);
            if (computedStyle.position === 'static') {
                this.cardElement.style.position = 'relative';
            }

            // Append to card
            this.cardElement.appendChild(this.iconElement);

            // Set initial visibility
            this.updateVisibility();
        }

        /**
         * Handle click event
         */
        handleClick(event) {
            // Stop propagation to prevent card navigation
            event.stopPropagation();
            event.preventDefault();

            // Build edit URL
            const url = this.buildEditUrl();

            // Navigate to edit page
            window.location.href = url;
        }

        /**
         * Build edit URL with query parameters
         */
        buildEditUrl() {
            const params = new URLSearchParams();

            params.set('action', 'edit');
            params.set('id', this.entityId);
            params.set('type', this.entityType);

            if (this.mythology) {
                params.set('mythology', this.mythology);
            }

            return `${this.redirectUrl}?${params.toString()}`;
        }

        /**
         * Update visibility based on ownership
         */
        updateVisibility() {
            if (!this.iconElement) return;

            if (this.isOwner()) {
                this.iconElement.style.display = '';
                this.iconElement.classList.add('edit-icon--visible');
            } else {
                this.iconElement.style.display = 'none';
                this.iconElement.classList.remove('edit-icon--visible');
            }
        }

        /**
         * Destroy the component
         */
        destroy() {
            if (this.iconElement && this.iconElement.parentNode) {
                this.iconElement.parentNode.removeChild(this.iconElement);
            }
            this.iconElement = null;
        }
    }

    // Global render function for easy integration
    window.renderEditIcon = function(options) {
        const icon = new EditIcon(options);
        icon.init();
        return icon;
    };

    // Auto-inject on cards with data attribute
    document.addEventListener('DOMContentLoaded', () => {
        const autoInjectCards = document.querySelectorAll('[data-edit-icon]');

        autoInjectCards.forEach(card => {
            const options = {
                cardElement: card,
                entityId: card.getAttribute('data-entity-id'),
                entityType: card.getAttribute('data-entity-type') || 'entity',
                createdBy: card.getAttribute('data-created-by'),
                mythology: card.getAttribute('data-mythology') || null,
                redirectUrl: card.getAttribute('data-edit-url') || undefined,
                icon: card.getAttribute('data-edit-icon-symbol') || undefined,
                position: card.getAttribute('data-edit-position') || undefined,
                size: card.getAttribute('data-edit-size') || undefined
            };

            window.renderEditIcon(options);
        });
    });

    // Batch render edit icons on multiple cards
    window.renderEditIconsOnCards = function(cards, defaultOptions = {}) {
        if (!cards || cards.length === 0) return [];

        const icons = [];

        cards.forEach(cardData => {
            const cardElement = typeof cardData.element === 'string'
                ? document.querySelector(cardData.element)
                : cardData.element;

            if (!cardElement) return;

            const options = {
                cardElement,
                entityId: cardData.entityId || cardElement.getAttribute('data-entity-id'),
                entityType: cardData.entityType || cardElement.getAttribute('data-entity-type') || defaultOptions.entityType,
                createdBy: cardData.createdBy || cardElement.getAttribute('data-created-by'),
                mythology: cardData.mythology || cardElement.getAttribute('data-mythology') || defaultOptions.mythology,
                redirectUrl: defaultOptions.redirectUrl,
                icon: defaultOptions.icon,
                position: defaultOptions.position,
                size: defaultOptions.size
            };

            const icon = window.renderEditIcon(options);
            icons.push(icon);
        });

        return icons;
    };

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EditIcon;
    }

    // Make class available globally
    window.EditIcon = EditIcon;

})();
