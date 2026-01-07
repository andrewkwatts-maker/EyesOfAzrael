/**
 * Contribute Menu Component
 *
 * Floating action button with contribution options for entity pages.
 * Provides quick access to adding notes, suggesting relationships,
 * and other community contributions.
 *
 * Features:
 * - Floating action button (FAB) with expand animation
 * - Context-aware options based on current entity
 * - Authentication-aware (shows login prompt if not authenticated)
 * - Keyboard accessible (Escape to close, Tab navigation)
 * - Mobile-optimized touch interactions
 */

class ContributeMenu {
    constructor(options = {}) {
        this.container = null;
        this.isOpen = false;
        this.isAuthenticated = false;
        this.currentEntity = null;
        this.currentCollection = null;

        // Options
        this.options = {
            position: options.position || 'bottom-right',
            showLabels: options.showLabels !== false,
            onAddNote: options.onAddNote || null,
            onSuggestRelationship: options.onSuggestRelationship || null,
            onSubmitVariant: options.onSubmitVariant || null,
            onAddPerspective: options.onAddPerspective || null,
            onLogin: options.onLogin || null,
            ...options
        };

        // Bound handlers for cleanup
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleClickOutside = this._handleClickOutside.bind(this);

        this._checkAuth();
    }

    /**
     * Check authentication status
     */
    async _checkAuth() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(user => {
                this.isAuthenticated = !!user;
                this._updateMenuState();
            });
        }
    }

    /**
     * Set the current entity context
     */
    setEntity(entityId, entityType, collection) {
        this.currentEntity = { id: entityId, type: entityType };
        this.currentCollection = collection;
    }

    /**
     * Render the contribute menu
     */
    render(targetContainer) {
        if (this.container) {
            this.destroy();
        }

        this.container = document.createElement('div');
        this.container.className = `contribute-menu contribute-menu--${this.options.position}`;
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Contribution menu');

        this.container.innerHTML = this._getMenuHTML();

        // Add to target or body
        const target = targetContainer || document.body;
        target.appendChild(this.container);

        // Bind events
        this._bindEvents();

        return this.container;
    }

    /**
     * Get menu HTML
     */
    _getMenuHTML() {
        return `
            <div class="contribute-menu__backdrop"></div>

            <nav class="contribute-menu__options" role="menu" aria-hidden="true">
                ${this._getMenuItems()}
            </nav>

            <button class="contribute-menu__fab"
                    type="button"
                    aria-label="Open contribution menu"
                    aria-expanded="false"
                    aria-haspopup="menu">
                <svg class="contribute-menu__icon contribute-menu__icon--plus"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <svg class="contribute-menu__icon contribute-menu__icon--close"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
    }

    /**
     * Get menu items HTML
     */
    _getMenuItems() {
        if (!this.isAuthenticated) {
            return `
                <button class="contribute-menu__item contribute-menu__item--login"
                        type="button" role="menuitem" data-action="login">
                    <span class="contribute-menu__item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                    </span>
                    ${this.options.showLabels ? '<span class="contribute-menu__item-label">Sign in to contribute</span>' : ''}
                </button>
            `;
        }

        return `
            <button class="contribute-menu__item contribute-menu__item--note"
                    type="button" role="menuitem" data-action="add-note">
                <span class="contribute-menu__item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </span>
                ${this.options.showLabels ? '<span class="contribute-menu__item-label">Add Note</span>' : ''}
            </button>

            <button class="contribute-menu__item contribute-menu__item--relationship"
                    type="button" role="menuitem" data-action="suggest-relationship">
                <span class="contribute-menu__item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="5" cy="6" r="3"></circle>
                        <circle cx="19" cy="6" r="3"></circle>
                        <circle cx="12" cy="18" r="3"></circle>
                        <line x1="5" y1="9" x2="12" y2="15"></line>
                        <line x1="19" y1="9" x2="12" y2="15"></line>
                    </svg>
                </span>
                ${this.options.showLabels ? '<span class="contribute-menu__item-label">Suggest Relationship</span>' : ''}
            </button>

            <button class="contribute-menu__item contribute-menu__item--perspective"
                    type="button" role="menuitem" data-action="add-perspective">
                <span class="contribute-menu__item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </span>
                ${this.options.showLabels ? '<span class="contribute-menu__item-label">Add to My Perspective</span>' : ''}
            </button>

            <button class="contribute-menu__item contribute-menu__item--variant"
                    type="button" role="menuitem" data-action="submit-variant">
                <span class="contribute-menu__item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </span>
                ${this.options.showLabels ? '<span class="contribute-menu__item-label">Submit Variant</span>' : ''}
            </button>
        `;
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        const fab = this.container.querySelector('.contribute-menu__fab');
        const backdrop = this.container.querySelector('.contribute-menu__backdrop');
        const items = this.container.querySelectorAll('.contribute-menu__item');

        // FAB click
        fab.addEventListener('click', () => this.toggle());

        // Backdrop click
        backdrop.addEventListener('click', () => this.close());

        // Menu item clicks
        items.forEach(item => {
            item.addEventListener('click', (e) => this._handleItemClick(e));
        });

        // Keyboard navigation
        document.addEventListener('keydown', this._handleKeydown);
    }

    /**
     * Handle menu item clicks
     */
    _handleItemClick(e) {
        const action = e.currentTarget.dataset.action;

        this.close();

        switch (action) {
            case 'add-note':
                if (this.options.onAddNote) {
                    this.options.onAddNote(this.currentEntity, this.currentCollection);
                } else {
                    this._dispatchEvent('contribute:add-note', {
                        entity: this.currentEntity,
                        collection: this.currentCollection
                    });
                }
                break;

            case 'suggest-relationship':
                if (this.options.onSuggestRelationship) {
                    this.options.onSuggestRelationship(this.currentEntity, this.currentCollection);
                } else {
                    this._dispatchEvent('contribute:suggest-relationship', {
                        entity: this.currentEntity,
                        collection: this.currentCollection
                    });
                }
                break;

            case 'add-perspective':
                if (this.options.onAddPerspective) {
                    this.options.onAddPerspective(this.currentEntity, this.currentCollection);
                } else {
                    this._dispatchEvent('contribute:add-perspective', {
                        entity: this.currentEntity,
                        collection: this.currentCollection
                    });
                }
                break;

            case 'submit-variant':
                if (this.options.onSubmitVariant) {
                    this.options.onSubmitVariant(this.currentEntity, this.currentCollection);
                } else {
                    this._dispatchEvent('contribute:submit-variant', {
                        entity: this.currentEntity,
                        collection: this.currentCollection
                    });
                }
                break;

            case 'login':
                if (this.options.onLogin) {
                    this.options.onLogin();
                } else {
                    this._dispatchEvent('contribute:login-required');
                }
                break;
        }
    }

    /**
     * Handle keyboard events
     */
    _handleKeydown(e) {
        if (!this.isOpen) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            this.container.querySelector('.contribute-menu__fab').focus();
        }
    }

    /**
     * Toggle menu open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the menu
     */
    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.container.classList.add('contribute-menu--open');

        const fab = this.container.querySelector('.contribute-menu__fab');
        const options = this.container.querySelector('.contribute-menu__options');

        fab.setAttribute('aria-expanded', 'true');
        options.setAttribute('aria-hidden', 'false');

        // Focus first menu item
        const firstItem = options.querySelector('.contribute-menu__item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 150);
        }

        // Add click outside listener
        document.addEventListener('click', this._handleClickOutside);
    }

    /**
     * Close the menu
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.container.classList.remove('contribute-menu--open');

        const fab = this.container.querySelector('.contribute-menu__fab');
        const options = this.container.querySelector('.contribute-menu__options');

        fab.setAttribute('aria-expanded', 'false');
        options.setAttribute('aria-hidden', 'true');

        // Remove click outside listener
        document.removeEventListener('click', this._handleClickOutside);
    }

    /**
     * Handle clicks outside the menu
     */
    _handleClickOutside(e) {
        if (this.container && !this.container.contains(e.target)) {
            this.close();
        }
    }

    /**
     * Update menu state based on auth
     */
    _updateMenuState() {
        if (!this.container) return;

        const options = this.container.querySelector('.contribute-menu__options');
        if (options) {
            options.innerHTML = this._getMenuItems();

            // Re-bind item events
            const items = options.querySelectorAll('.contribute-menu__item');
            items.forEach(item => {
                item.addEventListener('click', (e) => this._handleItemClick(e));
            });
        }
    }

    /**
     * Dispatch custom event
     */
    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            detail
        });
        this.container.dispatchEvent(event);
    }

    /**
     * Show the menu
     */
    show() {
        if (this.container) {
            this.container.style.display = '';
        }
    }

    /**
     * Hide the menu
     */
    hide() {
        if (this.container) {
            this.close();
            this.container.style.display = 'none';
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        document.removeEventListener('keydown', this._handleKeydown);
        document.removeEventListener('click', this._handleClickOutside);

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = null;
        this.isOpen = false;
    }
}

// CSS for the contribute menu (injected dynamically if not already present)
const contributeMenuStyles = `
.contribute-menu {
    --fab-size: 56px;
    --fab-color: var(--color-primary, #6366f1);
    --fab-hover: var(--color-primary-dark, #4f46e5);
    --item-size: 48px;
    --item-gap: 16px;
    --animation-duration: 0.2s;

    position: fixed;
    z-index: 1000;
    pointer-events: none;
}

.contribute-menu--bottom-right {
    bottom: 24px;
    right: 24px;
}

.contribute-menu--bottom-left {
    bottom: 24px;
    left: 24px;
}

.contribute-menu--bottom-center {
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
}

/* Backdrop */
.contribute-menu__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--animation-duration), visibility var(--animation-duration);
    pointer-events: none;
}

.contribute-menu--open .contribute-menu__backdrop {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
}

/* FAB Button */
.contribute-menu__fab {
    width: var(--fab-size);
    height: var(--fab-size);
    border-radius: 50%;
    border: none;
    background: var(--fab-color);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: transform var(--animation-duration), background var(--animation-duration), box-shadow var(--animation-duration);
    pointer-events: auto;
    position: relative;
    z-index: 2;
}

.contribute-menu__fab:hover {
    background: var(--fab-hover);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.contribute-menu__fab:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
}

/* FAB Icons */
.contribute-menu__icon {
    width: 24px;
    height: 24px;
    transition: transform var(--animation-duration), opacity var(--animation-duration);
    position: absolute;
}

.contribute-menu__icon--plus {
    opacity: 1;
    transform: rotate(0deg);
}

.contribute-menu__icon--close {
    opacity: 0;
    transform: rotate(-90deg);
}

.contribute-menu--open .contribute-menu__icon--plus {
    opacity: 0;
    transform: rotate(90deg);
}

.contribute-menu--open .contribute-menu__icon--close {
    opacity: 1;
    transform: rotate(0deg);
}

/* Menu Options */
.contribute-menu__options {
    position: absolute;
    bottom: calc(var(--fab-size) + 12px);
    right: 4px;
    display: flex;
    flex-direction: column-reverse;
    gap: var(--item-gap);
    pointer-events: none;
}

.contribute-menu--bottom-left .contribute-menu__options {
    right: auto;
    left: 4px;
}

/* Menu Items */
.contribute-menu__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px) scale(0.8);
    transition: opacity var(--animation-duration), transform var(--animation-duration);
    pointer-events: none;
}

.contribute-menu--bottom-left .contribute-menu__item {
    flex-direction: row-reverse;
}

.contribute-menu--open .contribute-menu__item {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
}

/* Staggered animation */
.contribute-menu--open .contribute-menu__item:nth-child(1) { transition-delay: 0.05s; }
.contribute-menu--open .contribute-menu__item:nth-child(2) { transition-delay: 0.1s; }
.contribute-menu--open .contribute-menu__item:nth-child(3) { transition-delay: 0.15s; }
.contribute-menu--open .contribute-menu__item:nth-child(4) { transition-delay: 0.2s; }

/* Item Icon */
.contribute-menu__item-icon {
    width: var(--item-size);
    height: var(--item-size);
    border-radius: 50%;
    background: var(--color-surface, #1f2937);
    border: 2px solid var(--color-border, rgba(255, 255, 255, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text, white);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s, background 0.15s, border-color 0.15s;
}

.contribute-menu__item-icon svg {
    width: 20px;
    height: 20px;
}

.contribute-menu__item:hover .contribute-menu__item-icon,
.contribute-menu__item:focus-visible .contribute-menu__item-icon {
    transform: scale(1.1);
    background: var(--fab-color);
    border-color: var(--fab-color);
}

/* Item Label */
.contribute-menu__item-label {
    padding: 8px 16px;
    background: var(--color-surface, #1f2937);
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
    border-radius: 8px;
    color: var(--color-text, white);
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Action-specific colors */
.contribute-menu__item--note .contribute-menu__item-icon {
    --action-color: #10b981;
}
.contribute-menu__item--relationship .contribute-menu__item-icon {
    --action-color: #8b5cf6;
}
.contribute-menu__item--perspective .contribute-menu__item-icon {
    --action-color: #3b82f6;
}
.contribute-menu__item--variant .contribute-menu__item-icon {
    --action-color: #f59e0b;
}
.contribute-menu__item--login .contribute-menu__item-icon {
    --action-color: #6366f1;
}

.contribute-menu__item:hover .contribute-menu__item-icon,
.contribute-menu__item:focus-visible .contribute-menu__item-icon {
    background: var(--action-color, var(--fab-color));
    border-color: var(--action-color, var(--fab-color));
}

/* Mobile adjustments */
@media (max-width: 640px) {
    .contribute-menu {
        --fab-size: 48px;
        --item-size: 44px;
        bottom: 16px;
        right: 16px;
    }

    .contribute-menu--bottom-left {
        left: 16px;
        right: auto;
    }

    .contribute-menu__item-label {
        display: none;
    }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
    .contribute-menu,
    .contribute-menu__fab,
    .contribute-menu__icon,
    .contribute-menu__item,
    .contribute-menu__item-icon,
    .contribute-menu__backdrop {
        transition-duration: 0.01ms !important;
    }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('contribute-menu-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'contribute-menu-styles';
    styleSheet.textContent = contributeMenuStyles;
    document.head.appendChild(styleSheet);
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContributeMenu };
}

if (typeof window !== 'undefined') {
    window.ContributeMenu = ContributeMenu;
}
