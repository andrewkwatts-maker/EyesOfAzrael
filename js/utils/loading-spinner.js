/**
 * Loading Spinner Utility
 * Provides consistent loading states across all Firebase data fetches
 * Features: Sacred geometry spinners, skeleton screens, rotating messages,
 * minimum display time, progress indicators, modal overlays, and smooth transitions
 *
 * @version 2.0.0
 * Polished loading experiences for Eyes of Azrael mythology encyclopedia
 */

class LoadingSpinner {
    constructor() {
        this.activeSpinners = new Map();
        this.timeouts = new Map();
        this.messageIntervals = new Map();
        this.minimumDisplayTime = 300; // Minimum time to show loading state (ms)
        this.overlayElement = null;
        this.modalOverlayElement = null;
        this.progressState = new Map();

        // Mythology-themed loading messages (enhanced with more variety)
        this.mythologyMessages = [
            'Summoning ancient wisdom...',
            'Consulting the Oracle...',
            'Opening the sacred scrolls...',
            'Traversing the astral plane...',
            'Invoking the divine spirits...',
            'Seeking the hidden truths...',
            'Parting the mystic veil...',
            'Awakening the old gods...',
            'Reading the celestial signs...',
            'Channeling arcane energies...',
            'Unlocking forbidden knowledge...',
            'Communing with the ancestors...',
            'The Eye gazes into eternity...',
            'Weaving threads of fate...',
            'Illuminating the darkness...',
            'Bridging mortal and divine...',
            'Attuning to cosmic frequencies...',
            'Gathering scattered memories...'
        ];

        // Context-specific messages (expanded for all entity types)
        this.contextMessages = {
            deities: [
                'Calling upon the divine...',
                'Invoking celestial beings...',
                'Ascending to Olympus...',
                'The gods stir in their realms...',
                'Summoning divine presence...'
            ],
            creatures: [
                'Summoning mythical beasts...',
                'Awakening ancient monsters...',
                'Entering the bestiary...',
                'Creatures emerge from shadow...',
                'The beasts take form...'
            ],
            heroes: [
                'Gathering the legends...',
                'Recalling heroic deeds...',
                'Forging legendary tales...',
                'Heroes answer the call...',
                'Epic sagas unfold...'
            ],
            places: [
                'Mapping sacred grounds...',
                'Journeying to holy sites...',
                'Discovering hidden realms...',
                'Crossing mystical thresholds...',
                'Realms reveal themselves...'
            ],
            items: [
                'Seeking sacred artifacts...',
                'Unveiling mystical relics...',
                'Gathering ancient treasures...',
                'Relics resonate with power...',
                'Artifacts emerge from vaults...'
            ],
            texts: [
                'Deciphering ancient scripts...',
                'Translating sacred texts...',
                'Unrolling the scrolls...',
                'Words shimmer into being...',
                'Sacred knowledge manifests...'
            ],
            rituals: [
                'Preparing the ceremony...',
                'Invoking sacred rites...',
                'Lighting the ritual fires...',
                'The circle takes shape...',
                'Ceremonial energies gather...'
            ],
            symbols: [
                'Interpreting sacred signs...',
                'Decoding mystic symbols...',
                'Revealing hidden meanings...',
                'Symbols pulse with intent...',
                'Arcane marks illuminate...'
            ],
            herbs: [
                'Gathering sacred plants...',
                'Consulting herbalists...',
                'Preparing the elixirs...',
                'Botanical secrets unfold...',
                'Nature shares its wisdom...'
            ],
            archetypes: [
                'Patterns of existence emerge...',
                'Universal forms crystallize...',
                'Archetypal forces awaken...',
                'The collective speaks...'
            ],
            cosmology: [
                'Mapping celestial spheres...',
                'Cosmic order reveals itself...',
                'The universe unfolds...',
                'Divine architecture appears...'
            ],
            search: [
                'Consulting the oracles...',
                'Scrying the depths...',
                'Seeking through the mists...',
                'The Eye searches all realms...',
                'Patterns emerge from chaos...'
            ],
            save: [
                'Inscribing in the chronicles...',
                'Sealing with divine authority...',
                'Preserving sacred knowledge...',
                'The archives accept your offering...'
            ],
            delete: [
                'Erasing from the records...',
                'Returning to the void...',
                'The chronicle releases its hold...'
            ],
            default: this.mythologyMessages
        };
    }

    /**
     * Show a loading spinner in a container
     * @param {HTMLElement|string} container - Container element or ID
     * @param {Object} options - Configuration options
     * @returns {string} - Spinner ID for later removal
     */
    show(container, options = {}) {
        const {
            message = 'Loading...',
            size = 'md', // 'sm' (16px), 'md' (32px), 'lg' (48px)
            timeout = 30000,
            onTimeout = null,
            inline = false,
            className = '',
            context = 'default',
            rotateMessages = true,
            showProgress = false
        } = options;

        const containerEl = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        if (!containerEl) {
            console.warn(`[LoadingSpinner] Container not found: ${container}`);
            return null;
        }

        const spinnerId = `spinner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const originalContent = inline ? null : containerEl.innerHTML;

        // Create spinner HTML with sacred geometry design
        const spinnerHTML = this._getSpinnerHTML({
            message: this._getAtmosphericMessage(message, context),
            size,
            spinnerId,
            className,
            showProgress
        });

        // Insert spinner
        if (inline) {
            const wrapper = document.createElement('div');
            wrapper.className = 'loading-spinner-inline';
            wrapper.innerHTML = spinnerHTML;
            containerEl.appendChild(wrapper);
        } else {
            containerEl.innerHTML = spinnerHTML;
        }

        // Track spinner
        this.activeSpinners.set(spinnerId, {
            containerId: typeof container === 'string' ? container : containerEl.id,
            containerEl,
            originalContent,
            inline,
            startTime: Date.now(),
            context
        });

        // Start message rotation after 2 seconds
        if (rotateMessages && !inline) {
            const intervalId = setTimeout(() => {
                this._startMessageRotation(spinnerId, context);
            }, 2000);
            this.messageIntervals.set(spinnerId, intervalId);
        }

        // Set timeout
        if (timeout > 0) {
            const timeoutId = setTimeout(() => {
                console.warn(`[LoadingSpinner] Timeout reached (${timeout}ms)`);
                this.hide(spinnerId);
                if (onTimeout) onTimeout();
            }, timeout);
            this.timeouts.set(spinnerId, timeoutId);
        }

        return spinnerId;
    }

    /**
     * Hide a loading spinner with smooth transition
     * @param {string} spinnerId - Spinner ID
     * @param {string|null} replacementHTML - HTML to replace spinner with
     * @param {Object} options - Transition options
     */
    async hide(spinnerId, replacementHTML = null, options = {}) {
        const { fadeOut = true, fadeOutDuration = 300, isError = false } = options;

        if (!this.activeSpinners.has(spinnerId)) {
            return;
        }

        const spinner = this.activeSpinners.get(spinnerId);
        const containerEl = spinner.containerEl || document.getElementById(spinner.containerId);

        if (!containerEl) {
            this.activeSpinners.delete(spinnerId);
            return;
        }

        // Clear timeout and message interval
        if (this.timeouts.has(spinnerId)) {
            clearTimeout(this.timeouts.get(spinnerId));
            this.timeouts.delete(spinnerId);
        }
        if (this.messageIntervals.has(spinnerId)) {
            clearInterval(this.messageIntervals.get(spinnerId));
            this.messageIntervals.delete(spinnerId);
        }

        // Ensure minimum display time
        const elapsed = Date.now() - spinner.startTime;
        if (elapsed < this.minimumDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, this.minimumDisplayTime - elapsed));
        }

        const spinnerElement = containerEl.querySelector(`[data-spinner-id="${spinnerId}"]`);

        const replaceContent = () => {
            if (spinner.inline && spinnerElement) {
                spinnerElement.remove();
            } else {
                const newContent = replacementHTML || spinner.originalContent || '';
                containerEl.innerHTML = newContent;

                // Add appropriate transition class
                if (isError) {
                    containerEl.classList.add('content-error');
                } else {
                    containerEl.classList.add('content-loaded');
                }

                // Remove transition class after animation
                setTimeout(() => {
                    containerEl.classList.remove('content-loaded', 'content-error');
                }, 450);
            }
            this.activeSpinners.delete(spinnerId);
        };

        if (fadeOut && spinnerElement) {
            spinnerElement.classList.add('spinner-fade-out');
            setTimeout(replaceContent, fadeOutDuration);
        } else {
            replaceContent();
        }
    }

    /**
     * Show a full-page overlay spinner
     * @param {string} message - Loading message
     * @param {Object} options - Configuration options
     * @returns {Function} - Function to hide the overlay
     */
    showOverlay(message = 'Loading...', options = {}) {
        const { showProgress = false, steps = null } = options;

        if (this.overlayElement) {
            this.hideOverlay();
        }

        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'loading-overlay';
        this.overlayElement.setAttribute('role', 'dialog');
        this.overlayElement.setAttribute('aria-modal', 'true');
        this.overlayElement.setAttribute('aria-label', 'Loading');

        const content = `
            <div class="loading-overlay-content">
                ${this._getSacredSpinnerSVG('lg')}
                <p class="loading-overlay-message">${this._getAtmosphericMessage(message)}</p>
                ${showProgress ? this._getProgressBarHTML() : ''}
                ${steps ? this._getStepIndicatorHTML(steps) : ''}
            </div>
        `;

        this.overlayElement.innerHTML = content;
        document.body.appendChild(this.overlayElement);
        document.body.classList.add('loading-overlay-active');

        // Trap focus in overlay
        this.overlayElement.focus();

        // Start message rotation after 2s
        const overlayId = 'overlay-' + Date.now();
        this.activeSpinners.set(overlayId, {
            startTime: Date.now(),
            isOverlay: true
        });

        setTimeout(() => {
            if (this.overlayElement) {
                this._startOverlayMessageRotation();
            }
        }, 2000);

        return () => this.hideOverlay();
    }

    /**
     * Hide the overlay spinner
     */
    hideOverlay() {
        if (!this.overlayElement) return;

        this.overlayElement.classList.add('overlay-fade-out');

        setTimeout(() => {
            if (this.overlayElement) {
                this.overlayElement.remove();
                this.overlayElement = null;
            }
            document.body.classList.remove('loading-overlay-active');
        }, 300);
    }

    /**
     * Show a modal save overlay for form operations
     * @param {HTMLElement} modalElement - The modal element to overlay
     * @param {string} message - Loading message
     * @param {Object} options - Configuration options
     * @returns {Function} - Function to hide the overlay
     */
    showModalSaveOverlay(modalElement, message = 'Saving...', options = {}) {
        const { context = 'save', showProgress = false } = options;

        if (this.modalOverlayElement) {
            this.hideModalSaveOverlay();
        }

        this.modalOverlayElement = document.createElement('div');
        this.modalOverlayElement.className = 'modal-save-overlay';
        this.modalOverlayElement.setAttribute('role', 'status');
        this.modalOverlayElement.setAttribute('aria-live', 'polite');

        const atmosphericMessage = this._getAtmosphericMessage(message, context);

        const content = `
            <div class="modal-save-overlay-content">
                ${this._getSacredSpinnerSVG('md')}
                <p class="modal-save-message">${atmosphericMessage}</p>
                ${showProgress ? this._getProgressBarHTML() : ''}
            </div>
        `;

        this.modalOverlayElement.innerHTML = content;

        // Position relative to the modal
        if (modalElement) {
            modalElement.style.position = 'relative';
            modalElement.appendChild(this.modalOverlayElement);
        } else {
            document.body.appendChild(this.modalOverlayElement);
        }

        // Start message rotation after 2s for longer operations
        const overlayId = 'modal-overlay-' + Date.now();
        this.activeSpinners.set(overlayId, {
            startTime: Date.now(),
            isModalOverlay: true,
            context
        });

        setTimeout(() => {
            if (this.modalOverlayElement) {
                this._startModalOverlayMessageRotation(context);
            }
        }, 2000);

        return () => this.hideModalSaveOverlay();
    }

    /**
     * Hide the modal save overlay
     */
    hideModalSaveOverlay() {
        if (!this.modalOverlayElement) return;

        this.modalOverlayElement.classList.add('modal-overlay-fade-out');

        setTimeout(() => {
            if (this.modalOverlayElement) {
                this.modalOverlayElement.remove();
                this.modalOverlayElement = null;
            }
        }, 300);
    }

    /**
     * Update modal save overlay message
     * @param {string} message - New message
     */
    updateModalSaveMessage(message) {
        if (!this.modalOverlayElement) return;

        const messageEl = this.modalOverlayElement.querySelector('.modal-save-message');
        if (messageEl) {
            messageEl.classList.add('message-updating');
            setTimeout(() => {
                messageEl.textContent = message;
                messageEl.classList.remove('message-updating');
            }, 150);
        }
    }

    /**
     * Start message rotation for modal overlay
     * @private
     */
    _startModalOverlayMessageRotation(context = 'save') {
        if (!this.modalOverlayElement) return;

        const messageEl = this.modalOverlayElement.querySelector('.modal-save-message');
        if (!messageEl) return;

        const interval = setInterval(() => {
            if (!this.modalOverlayElement) {
                clearInterval(interval);
                return;
            }
            messageEl.classList.add('message-updating');
            setTimeout(() => {
                messageEl.textContent = this._getRandomMessage(context);
                messageEl.classList.remove('message-updating');
            }, 150);
        }, 3000);
    }

    /**
     * Update overlay progress
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} message - Optional status message
     */
    updateProgress(percent, message = null) {
        if (!this.overlayElement) return;

        const progressBar = this.overlayElement.querySelector('.progress-bar-fill');
        const progressText = this.overlayElement.querySelector('.progress-text');
        const messageEl = this.overlayElement.querySelector('.loading-overlay-message');

        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
        if (message && messageEl) {
            messageEl.textContent = message;
        }
    }

    /**
     * Update step indicator
     * @param {number} currentStep - Current step (1-indexed)
     */
    updateStep(currentStep) {
        if (!this.overlayElement) return;

        const steps = this.overlayElement.querySelectorAll('.step-indicator-item');
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index < currentStep - 1) {
                step.classList.add('completed');
            } else if (index === currentStep - 1) {
                step.classList.add('active');
            }
        });
    }

    /**
     * Update spinner message
     * @param {string} spinnerId - Spinner ID
     * @param {string} message - New message
     */
    updateMessage(spinnerId, message) {
        if (!this.activeSpinners.has(spinnerId)) return;

        const spinner = this.activeSpinners.get(spinnerId);
        const containerEl = spinner.containerEl || document.getElementById(spinner.containerId);
        if (!containerEl) return;

        const messageEl = containerEl.querySelector('.spinner-message');
        if (messageEl) {
            messageEl.classList.add('message-updating');
            setTimeout(() => {
                messageEl.textContent = message;
                messageEl.classList.remove('message-updating');
            }, 150);
        }
    }

    // ============================================
    // SKELETON SCREEN GENERATORS
    // ============================================

    /**
     * Get card skeleton HTML (standard entity card)
     * @param {Object} options - Configuration
     * @returns {string} HTML string
     */
    getCardSkeleton(options = {}) {
        const {
            showImage = true,
            showBadges = true,
            lines = 2,
            variant = 'default', // 'default', 'compact', 'featured', 'minimal'
            showIcon = false,
            showActions = false
        } = options;

        const variantClass = variant !== 'default' ? `skeleton-card--${variant}` : '';

        return `
            <div class="skeleton-card ${variantClass}">
                ${showImage ? '<div class="skeleton skeleton-card-image shimmer-enhanced"></div>' : ''}
                ${showIcon && !showImage ? '<div class="skeleton skeleton-card-icon shimmer-enhanced"></div>' : ''}
                <div class="skeleton-card-body">
                    <div class="skeleton skeleton-card-title shimmer-enhanced"></div>
                    ${showBadges ? `
                        <div class="skeleton-card-badges">
                            <div class="skeleton skeleton-badge shimmer-enhanced"></div>
                            <div class="skeleton skeleton-badge skeleton-badge-sm shimmer-enhanced"></div>
                        </div>
                    ` : ''}
                    ${Array(lines).fill(0).map((_, i) => `
                        <div class="skeleton skeleton-text shimmer-enhanced" style="width: ${100 - i * 15}%; animation-delay: ${i * 0.1}s"></div>
                    `).join('')}
                    ${showActions ? `
                        <div class="skeleton-card-actions">
                            <div class="skeleton skeleton-btn-sm shimmer-enhanced"></div>
                            <div class="skeleton skeleton-btn-sm shimmer-enhanced"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get entity card skeleton (for mythology entities)
     * @param {Object} options - Configuration
     * @returns {string} HTML string
     */
    getEntityCardSkeleton(options = {}) {
        const {
            showMythology = true,
            showDescription = true,
            animationDelay = 0
        } = options;

        return `
            <div class="skeleton-entity-card" style="animation-delay: ${animationDelay}s">
                <div class="skeleton-entity-card-header">
                    <div class="skeleton skeleton-entity-icon shimmer-enhanced"></div>
                    <div class="skeleton skeleton-entity-title shimmer-enhanced"></div>
                </div>
                ${showMythology ? `
                    <div class="skeleton-entity-badges">
                        <div class="skeleton skeleton-mythology-badge shimmer-enhanced"></div>
                        <div class="skeleton skeleton-type-badge shimmer-enhanced"></div>
                    </div>
                ` : ''}
                ${showDescription ? `
                    <div class="skeleton-entity-description">
                        <div class="skeleton skeleton-text full shimmer-enhanced"></div>
                        <div class="skeleton skeleton-text three-quarter shimmer-enhanced"></div>
                    </div>
                ` : ''}
                <div class="skeleton-entity-footer">
                    <div class="skeleton skeleton-entity-stat shimmer-enhanced"></div>
                    <div class="skeleton skeleton-entity-stat shimmer-enhanced"></div>
                </div>
            </div>
        `;
    }

    /**
     * Get deity card skeleton
     * @returns {string} HTML string
     */
    getDeityCardSkeleton() {
        return `
            <div class="skeleton-deity-card">
                <div class="skeleton skeleton-deity-portrait shimmer-enhanced"></div>
                <div class="skeleton-deity-info">
                    <div class="skeleton skeleton-deity-name shimmer-enhanced"></div>
                    <div class="skeleton skeleton-deity-domain shimmer-enhanced"></div>
                    <div class="skeleton-deity-attributes">
                        <div class="skeleton skeleton-attribute shimmer-enhanced"></div>
                        <div class="skeleton skeleton-attribute shimmer-enhanced"></div>
                        <div class="skeleton skeleton-attribute shimmer-enhanced"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get creature card skeleton
     * @returns {string} HTML string
     */
    getCreatureCardSkeleton() {
        return `
            <div class="skeleton-creature-card">
                <div class="skeleton skeleton-creature-silhouette shimmer-enhanced"></div>
                <div class="skeleton-creature-info">
                    <div class="skeleton skeleton-creature-name shimmer-enhanced"></div>
                    <div class="skeleton skeleton-creature-type shimmer-enhanced"></div>
                    <div class="skeleton skeleton-creature-origin shimmer-enhanced"></div>
                </div>
            </div>
        `;
    }

    /**
     * Get hero card skeleton
     * @returns {string} HTML string
     */
    getHeroCardSkeleton() {
        return `
            <div class="skeleton-hero-card">
                <div class="skeleton skeleton-hero-emblem shimmer-enhanced"></div>
                <div class="skeleton-hero-info">
                    <div class="skeleton skeleton-hero-name shimmer-enhanced"></div>
                    <div class="skeleton skeleton-hero-title shimmer-enhanced"></div>
                    <div class="skeleton-hero-feats">
                        <div class="skeleton skeleton-feat shimmer-enhanced"></div>
                        <div class="skeleton skeleton-feat shimmer-enhanced"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get place card skeleton
     * @returns {string} HTML string
     */
    getPlaceCardSkeleton() {
        return `
            <div class="skeleton-place-card">
                <div class="skeleton skeleton-place-image shimmer-enhanced"></div>
                <div class="skeleton-place-overlay">
                    <div class="skeleton skeleton-place-name shimmer-enhanced"></div>
                    <div class="skeleton skeleton-place-region shimmer-enhanced"></div>
                </div>
            </div>
        `;
    }

    /**
     * Get item card skeleton
     * @returns {string} HTML string
     */
    getItemCardSkeleton() {
        return `
            <div class="skeleton-item-card">
                <div class="skeleton skeleton-item-icon shimmer-enhanced"></div>
                <div class="skeleton-item-info">
                    <div class="skeleton skeleton-item-name shimmer-enhanced"></div>
                    <div class="skeleton skeleton-item-power shimmer-enhanced"></div>
                    <div class="skeleton skeleton-item-owner shimmer-enhanced"></div>
                </div>
            </div>
        `;
    }

    /**
     * Get compact card skeleton (for search results, related items)
     * @returns {string} HTML string
     */
    getCompactCardSkeleton() {
        return `
            <div class="skeleton-compact-card">
                <div class="skeleton skeleton-compact-icon shimmer-enhanced"></div>
                <div class="skeleton-compact-content">
                    <div class="skeleton skeleton-compact-title shimmer-enhanced"></div>
                    <div class="skeleton skeleton-compact-meta shimmer-enhanced"></div>
                </div>
                <div class="skeleton skeleton-compact-arrow shimmer-enhanced"></div>
            </div>
        `;
    }

    /**
     * Get mythology landing card skeleton
     * @returns {string} HTML string
     */
    getMythologyCardSkeleton() {
        return `
            <div class="skeleton-mythology-card shimmer-container">
                <div class="skeleton skeleton-mythology-icon shimmer-enhanced"></div>
                <div class="skeleton skeleton-mythology-title shimmer-enhanced"></div>
                <div class="skeleton skeleton-mythology-desc shimmer-enhanced"></div>
                <div class="skeleton skeleton-mythology-desc-2 shimmer-enhanced"></div>
                <div class="skeleton skeleton-mythology-arrow shimmer-enhanced"></div>
            </div>
        `;
    }

    /**
     * Get list skeleton HTML
     * @param {number} count - Number of rows
     * @returns {string} HTML string
     */
    getListSkeleton(count = 5) {
        const rows = Array(count).fill(0).map((_, i) => `
            <div class="skeleton-list-item" style="--item-index: ${i}">
                <div class="skeleton skeleton-list-icon"></div>
                <div class="skeleton-list-content">
                    <div class="skeleton skeleton-list-title"></div>
                    <div class="skeleton skeleton-list-subtitle"></div>
                </div>
                <div class="skeleton skeleton-list-action"></div>
            </div>
        `).join('');

        return `<div class="skeleton-list">${rows}</div>`;
    }

    /**
     * Get detail page skeleton HTML
     * @returns {string} HTML string
     */
    getDetailSkeleton() {
        return `
            <div class="skeleton-detail">
                <div class="skeleton-detail-hero">
                    <div class="skeleton skeleton-detail-icon"></div>
                    <div class="skeleton skeleton-detail-title"></div>
                    <div class="skeleton skeleton-detail-subtitle"></div>
                    <div class="skeleton-detail-meta">
                        <div class="skeleton skeleton-badge"></div>
                        <div class="skeleton skeleton-badge"></div>
                        <div class="skeleton skeleton-badge"></div>
                    </div>
                </div>
                <div class="skeleton-detail-content">
                    <div class="skeleton-detail-section">
                        <div class="skeleton skeleton-section-title"></div>
                        <div class="skeleton skeleton-text full"></div>
                        <div class="skeleton skeleton-text full"></div>
                        <div class="skeleton skeleton-text three-quarter"></div>
                    </div>
                    <div class="skeleton-detail-section">
                        <div class="skeleton skeleton-section-title"></div>
                        <div class="skeleton-detail-grid">
                            <div class="skeleton skeleton-detail-grid-item"></div>
                            <div class="skeleton skeleton-detail-grid-item"></div>
                            <div class="skeleton skeleton-detail-grid-item"></div>
                        </div>
                    </div>
                    <div class="skeleton-detail-section">
                        <div class="skeleton skeleton-section-title"></div>
                        <div class="skeleton skeleton-text full"></div>
                        <div class="skeleton skeleton-text full"></div>
                        <div class="skeleton skeleton-text half"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get grid skeleton HTML
     * @param {number} count - Number of cards
     * @param {Object} options - Grid and card options
     * @returns {string} HTML string
     */
    getGridSkeleton(count = 6, options = {}) {
        const {
            cardType = 'default', // 'default', 'entity', 'deity', 'creature', 'hero', 'place', 'item', 'compact', 'mythology'
            columns = 'auto',
            gap = '1.5rem',
            staggerDelay = 0.06
        } = options;

        const getCardHTML = (index) => {
            const delay = index * staggerDelay;
            switch (cardType) {
                case 'entity':
                    return this.getEntityCardSkeleton({ animationDelay: delay });
                case 'deity':
                    return this.getDeityCardSkeleton();
                case 'creature':
                    return this.getCreatureCardSkeleton();
                case 'hero':
                    return this.getHeroCardSkeleton();
                case 'place':
                    return this.getPlaceCardSkeleton();
                case 'item':
                    return this.getItemCardSkeleton();
                case 'compact':
                    return this.getCompactCardSkeleton();
                case 'mythology':
                    return this.getMythologyCardSkeleton();
                default:
                    return this.getCardSkeleton(options);
            }
        };

        const cards = Array(count).fill(0).map((_, i) => `
            <div class="skeleton-grid-item" style="--item-index: ${i}">
                ${getCardHTML(i)}
            </div>
        `).join('');

        const columnStyle = columns === 'auto'
            ? 'grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))'
            : `grid-template-columns: repeat(${columns}, 1fr)`;

        return `<div class="skeleton-grid" style="${columnStyle}; gap: ${gap}">${cards}</div>`;
    }

    /**
     * Get entity grid skeleton (convenience method)
     * @param {number} count - Number of cards
     * @param {string} entityType - Type of entity
     * @returns {string} HTML string
     */
    getEntityGridSkeleton(count = 6, entityType = 'default') {
        return this.getGridSkeleton(count, { cardType: entityType });
    }

    /**
     * Get search results skeleton
     * @param {number} count - Number of results
     * @returns {string} HTML string
     */
    getSearchResultsSkeleton(count = 8) {
        const results = Array(count).fill(0).map((_, i) => `
            <div class="skeleton-search-result" style="--item-index: ${i}">
                <div class="skeleton skeleton-search-icon shimmer-enhanced"></div>
                <div class="skeleton-search-content">
                    <div class="skeleton skeleton-search-title shimmer-enhanced"></div>
                    <div class="skeleton skeleton-search-type shimmer-enhanced"></div>
                    <div class="skeleton skeleton-search-excerpt shimmer-enhanced"></div>
                </div>
                <div class="skeleton skeleton-search-score shimmer-enhanced"></div>
            </div>
        `).join('');

        return `
            <div class="skeleton-search-results">
                <div class="skeleton skeleton-search-header shimmer-enhanced"></div>
                ${results}
            </div>
        `;
    }

    /**
     * Get browse category skeleton
     * @param {number} categoryCount - Number of category items
     * @returns {string} HTML string
     */
    getBrowseCategorySkeleton(categoryCount = 12) {
        const categories = Array(categoryCount).fill(0).map((_, i) => `
            <div class="skeleton-category-item" style="--item-index: ${i}">
                ${this.getMythologyCardSkeleton()}
            </div>
        `).join('');

        return `
            <div class="skeleton-browse-category">
                <div class="skeleton-category-header">
                    <div class="skeleton skeleton-category-title shimmer-enhanced"></div>
                    <div class="skeleton skeleton-category-subtitle shimmer-enhanced"></div>
                </div>
                <div class="skeleton-category-grid">${categories}</div>
            </div>
        `;
    }

    /**
     * Get quick view modal skeleton
     * @returns {string} HTML string
     */
    getQuickViewSkeleton() {
        return `
            <div class="skeleton-quick-view">
                <div class="skeleton-quick-view-header">
                    <div class="skeleton skeleton-qv-icon shimmer-enhanced"></div>
                    <div class="skeleton-qv-titles">
                        <div class="skeleton skeleton-qv-title shimmer-enhanced"></div>
                        <div class="skeleton skeleton-qv-subtitle shimmer-enhanced"></div>
                    </div>
                </div>
                <div class="skeleton-qv-badges">
                    <div class="skeleton skeleton-badge shimmer-enhanced"></div>
                    <div class="skeleton skeleton-badge shimmer-enhanced"></div>
                    <div class="skeleton skeleton-badge shimmer-enhanced"></div>
                </div>
                <div class="skeleton-qv-content">
                    <div class="skeleton skeleton-text full shimmer-enhanced"></div>
                    <div class="skeleton skeleton-text full shimmer-enhanced"></div>
                    <div class="skeleton skeleton-text three-quarter shimmer-enhanced"></div>
                </div>
                <div class="skeleton-qv-actions">
                    <div class="skeleton skeleton-qv-btn shimmer-enhanced"></div>
                    <div class="skeleton skeleton-qv-btn shimmer-enhanced"></div>
                </div>
            </div>
        `;
    }

    /**
     * Get compare view skeleton
     * @param {number} columns - Number of compare columns
     * @returns {string} HTML string
     */
    getCompareViewSkeleton(columns = 2) {
        const cols = Array(columns).fill(0).map((_, i) => `
            <div class="skeleton-compare-column" style="--item-index: ${i}">
                <div class="skeleton skeleton-compare-header shimmer-enhanced"></div>
                <div class="skeleton skeleton-compare-icon shimmer-enhanced"></div>
                <div class="skeleton skeleton-compare-title shimmer-enhanced"></div>
                <div class="skeleton-compare-fields">
                    ${Array(5).fill(0).map(() => `
                        <div class="skeleton-compare-field">
                            <div class="skeleton skeleton-compare-label shimmer-enhanced"></div>
                            <div class="skeleton skeleton-compare-value shimmer-enhanced"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        return `<div class="skeleton-compare-view">${cols}</div>`;
    }

    /**
     * Get table skeleton HTML
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     * @returns {string} HTML string
     */
    getTableSkeleton(rows = 5, cols = 4) {
        const headerCells = Array(cols).fill(0).map(() => `
            <div class="skeleton-table-th">
                <div class="skeleton skeleton-table-header"></div>
            </div>
        `).join('');

        const bodyRows = Array(rows).fill(0).map((_, ri) => `
            <div class="skeleton-table-row" style="--item-index: ${ri}">
                ${Array(cols).fill(0).map((_, ci) => `
                    <div class="skeleton-table-td">
                        <div class="skeleton skeleton-table-cell" style="width: ${70 + Math.random() * 30}%"></div>
                    </div>
                `).join('')}
            </div>
        `).join('');

        return `
            <div class="skeleton-table">
                <div class="skeleton-table-header-row">${headerCells}</div>
                <div class="skeleton-table-body">${bodyRows}</div>
            </div>
        `;
    }

    // ============================================
    // PROMISE WRAPPERS
    // ============================================

    /**
     * Wrap a Promise with a loading spinner
     * @param {HTMLElement|string} container - Container
     * @param {Promise} promise - Promise to wrap
     * @param {Object} options - Spinner options
     * @returns {Promise} - Original promise result
     */
    async wrapPromise(container, promise, options = {}) {
        const { errorHTML = null, onError = null } = options;
        const spinnerId = this.show(container, options);

        try {
            const result = await promise;
            await this.hide(spinnerId);
            return result;
        } catch (error) {
            const errorContent = errorHTML || this._getErrorHTML(error);
            await this.hide(spinnerId, errorContent, { isError: true });
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Wrap multiple promises with progress tracking
     * @param {HTMLElement|string} container - Container
     * @param {Array<Promise>} promises - Promises to track
     * @param {Object} options - Options
     * @returns {Promise<Array>} - All results
     */
    async wrapAll(container, promises, options = {}) {
        const { progressUpdates = true, message = 'Loading...' } = options;
        const spinnerId = this.show(container, { ...options, message, showProgress: progressUpdates });

        if (progressUpdates) {
            let completed = 0;
            const total = promises.length;

            const tracked = promises.map(async (promise) => {
                const result = await promise;
                completed++;
                const percent = Math.round((completed / total) * 100);
                this.updateMessage(spinnerId, `${this._getAtmosphericMessage('Loading...')} ${percent}%`);
                return result;
            });

            try {
                const results = await Promise.all(tracked);
                await this.hide(spinnerId);
                return results;
            } catch (error) {
                await this.hide(spinnerId, this._getErrorHTML(error), { isError: true });
                throw error;
            }
        } else {
            try {
                const results = await Promise.all(promises);
                await this.hide(spinnerId);
                return results;
            } catch (error) {
                await this.hide(spinnerId, this._getErrorHTML(error), { isError: true });
                throw error;
            }
        }
    }

    /**
     * Clear all active spinners
     */
    clearAll() {
        for (const spinnerId of this.activeSpinners.keys()) {
            this.hide(spinnerId);
        }
        this.hideOverlay();
    }

    /**
     * Get count of active spinners
     * @returns {number}
     */
    getActiveCount() {
        return this.activeSpinners.size;
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================

    _getSpinnerHTML({ message, size, spinnerId, className, showProgress }) {
        const sizeClass = `spinner-${size}`;

        return `
            <div class="loading-spinner-wrapper ${className}" data-spinner-id="${spinnerId}">
                ${this._getSacredSpinnerSVG(size)}
                ${message ? `<p class="spinner-message">${message}</p>` : ''}
                ${showProgress ? this._getProgressBarHTML() : ''}
            </div>
        `;
    }

    _getSacredSpinnerSVG(size = 'md') {
        const sizes = { sm: 16, md: 32, lg: 48 };
        const s = sizes[size] || 32;
        const strokeWidth = size === 'sm' ? 1.5 : size === 'lg' ? 2.5 : 2;

        return `
            <div class="sacred-spinner spinner-${size}" role="status" aria-label="Loading">
                <svg class="sacred-spinner-svg" width="${s}" height="${s}" viewBox="0 0 50 50">
                    <!-- Outer ring -->
                    <circle class="sacred-ring sacred-ring-outer"
                        cx="25" cy="25" r="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="${strokeWidth}"
                        stroke-linecap="round"/>
                    <!-- Middle ring (reverse) -->
                    <circle class="sacred-ring sacred-ring-middle"
                        cx="25" cy="25" r="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="${strokeWidth}"
                        stroke-linecap="round"/>
                    <!-- Inner ring -->
                    <circle class="sacred-ring sacred-ring-inner"
                        cx="25" cy="25" r="10"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="${strokeWidth}"
                        stroke-linecap="round"/>
                    <!-- Eye center -->
                    <circle class="sacred-eye-center"
                        cx="25" cy="25" r="3"
                        fill="currentColor"/>
                    <!-- Sacred geometry lines (hidden on small) -->
                    ${size !== 'sm' ? `
                        <line class="sacred-line" x1="25" y1="3" x2="25" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/>
                        <line class="sacred-line" x1="25" y1="40" x2="25" y2="47" stroke="currentColor" stroke-width="1" opacity="0.3"/>
                        <line class="sacred-line" x1="3" y1="25" x2="10" y2="25" stroke="currentColor" stroke-width="1" opacity="0.3"/>
                        <line class="sacred-line" x1="40" y1="25" x2="47" y2="25" stroke="currentColor" stroke-width="1" opacity="0.3"/>
                    ` : ''}
                </svg>
            </div>
        `;
    }

    _getProgressBarHTML() {
        return `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
                <span class="progress-text">0%</span>
            </div>
        `;
    }

    _getStepIndicatorHTML(steps) {
        const stepItems = steps.map((step, i) => `
            <div class="step-indicator-item ${i === 0 ? 'active' : ''}">
                <div class="step-indicator-number">${i + 1}</div>
                <div class="step-indicator-label">${step}</div>
            </div>
        `).join('<div class="step-indicator-connector"></div>');

        return `<div class="step-indicator">${stepItems}</div>`;
    }

    _getErrorHTML(error) {
        const message = error?.message || 'An unexpected error occurred';
        return `
            <div class="loading-error">
                <div class="loading-error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                    </svg>
                </div>
                <h3 class="loading-error-title">Something went wrong</h3>
                <p class="loading-error-message">${message}</p>
                <button class="loading-error-retry" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }

    _getAtmosphericMessage(message, context = 'default') {
        const transforms = {
            'Loading...': () => this._getRandomMessage(context),
            'Loading': () => this._getRandomMessage(context),
            'loading...': () => this._getRandomMessage(context),
            'Loading entities...': 'Awakening the old gods...',
            'Loading entity...': 'Invoking the spirit...',
            'Searching...': 'Consulting the oracles...',
            'Please wait...': 'The veil parts slowly...',
            'Fetching data...': 'Reading the sacred texts...',
            'Loading content...': 'Unveiling the mysteries...',
            'Loading page...': 'Traversing the realms...',
            'Loading deities...': 'Calling upon the divine...',
            'Loading creatures...': 'Summoning the beasts...',
            'Loading places...': 'Visiting sacred grounds...',
            'Loading items...': 'Seeking sacred artifacts...',
            'Loading heroes...': 'Gathering the legends...',
            'Loading texts...': 'Unrolling ancient scrolls...',
            'Loading rituals...': 'Preparing the ceremony...',
            'Loading symbols...': 'Decoding mystic signs...',
            'Loading herbs...': 'Gathering sacred plants...',
            'Loading archetypes...': 'Patterns of existence emerge...',
            'Loading cosmology...': 'Mapping celestial spheres...',
            'Saving...': 'Inscribing in the chronicles...',
            'Deleting...': 'Erasing from the records...',
            'Uploading...': 'Offering to the archives...',
            'Updating...': 'Revising the sacred texts...',
            'Creating...': 'Bringing into existence...',
            'Validating...': 'Testing against ancient law...',
            'Connecting...': 'Establishing ethereal bond...',
            'Authenticating...': 'Verifying your essence...',
            'Signing in...': 'Opening the gates...',
            'Signing out...': 'The gates seal behind you...',
            'Refreshing...': 'Renewing the vision...',
            'Comparing...': 'Weighing on celestial scales...',
            'Filtering...': 'Sifting through the ether...',
            'Sorting...': 'Arranging by divine order...'
        };

        const transform = transforms[message];
        if (typeof transform === 'function') {
            return transform();
        }
        return transform || message;
    }

    /**
     * Get atmospheric message for a specific context
     * @param {string} context - The context (entity type, action, etc.)
     * @returns {string} An atmospheric message
     */
    getAtmosphericMessage(context = 'default') {
        return this._getAtmosphericMessage('Loading...', context);
    }

    _getRandomMessage(context = 'default') {
        const messages = this.contextMessages[context] || this.contextMessages.default;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    _startMessageRotation(spinnerId, context = 'default') {
        if (!this.activeSpinners.has(spinnerId)) return;

        const interval = setInterval(() => {
            if (!this.activeSpinners.has(spinnerId)) {
                clearInterval(interval);
                return;
            }
            const newMessage = this._getRandomMessage(context);
            this.updateMessage(spinnerId, newMessage);
        }, 3000);

        this.messageIntervals.set(spinnerId, interval);
    }

    _startOverlayMessageRotation() {
        if (!this.overlayElement) return;

        const messageEl = this.overlayElement.querySelector('.loading-overlay-message');
        if (!messageEl) return;

        const interval = setInterval(() => {
            if (!this.overlayElement) {
                clearInterval(interval);
                return;
            }
            messageEl.classList.add('message-updating');
            setTimeout(() => {
                messageEl.textContent = this._getRandomMessage();
                messageEl.classList.remove('message-updating');
            }, 150);
        }, 3000);
    }

    // ============================================
    // MULTI-STEP PROGRESS OPERATIONS
    // ============================================

    /**
     * Create a multi-step progress tracker for complex operations
     * @param {HTMLElement|string} container - Container element or ID
     * @param {Array<{name: string, label: string}>} steps - Array of step definitions
     * @param {Object} options - Configuration options
     * @returns {Object} Progress controller
     */
    createMultiStepProgress(container, steps, options = {}) {
        const {
            showPercentage = true,
            animateTransitions = true,
            atmosphericMessages = true
        } = options;

        const containerEl = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        if (!containerEl) {
            console.warn('[LoadingSpinner] Container not found for multi-step progress');
            return null;
        }

        const progressId = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let currentStep = 0;
        let overallProgress = 0;

        const stepsHTML = steps.map((step, i) => `
            <div class="multi-step-item" data-step="${i}" data-step-name="${step.name}">
                <div class="multi-step-indicator">
                    <div class="multi-step-number">${i + 1}</div>
                    <div class="multi-step-check">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="multi-step-label">${step.label}</div>
            </div>
            ${i < steps.length - 1 ? '<div class="multi-step-connector"></div>' : ''}
        `).join('');

        const html = `
            <div class="multi-step-progress" data-progress-id="${progressId}">
                <div class="multi-step-header">
                    ${this._getSacredSpinnerSVG('md')}
                    <p class="multi-step-message">${atmosphericMessages ? this._getRandomMessage() : 'Processing...'}</p>
                </div>
                ${showPercentage ? `
                    <div class="multi-step-percentage">
                        <div class="multi-step-progress-bar">
                            <div class="multi-step-progress-fill"></div>
                        </div>
                        <span class="multi-step-percent-text">0%</span>
                    </div>
                ` : ''}
                <div class="multi-step-steps">
                    ${stepsHTML}
                </div>
            </div>
        `;

        containerEl.innerHTML = html;

        // Store state
        this.progressState.set(progressId, {
            steps,
            currentStep: 0,
            containerEl,
            startTime: Date.now()
        });

        // Start message rotation
        if (atmosphericMessages) {
            const messageEl = containerEl.querySelector('.multi-step-message');
            const interval = setInterval(() => {
                if (!this.progressState.has(progressId)) {
                    clearInterval(interval);
                    return;
                }
                if (messageEl) {
                    messageEl.classList.add('message-updating');
                    setTimeout(() => {
                        messageEl.textContent = this._getRandomMessage();
                        messageEl.classList.remove('message-updating');
                    }, 150);
                }
            }, 3000);
            this.messageIntervals.set(progressId, interval);
        }

        // Return controller object
        return {
            progressId,
            setStep: (stepIndex, status = 'active') => this._setMultiStep(progressId, stepIndex, status),
            completeStep: (stepIndex) => this._setMultiStep(progressId, stepIndex, 'completed'),
            setProgress: (percent) => this._setMultiStepProgress(progressId, percent),
            setMessage: (message) => this._setMultiStepMessage(progressId, message),
            complete: (replacementHTML) => this._completeMultiStep(progressId, replacementHTML),
            error: (errorMessage, errorHTML) => this._errorMultiStep(progressId, errorMessage, errorHTML)
        };
    }

    _setMultiStep(progressId, stepIndex, status) {
        const state = this.progressState.get(progressId);
        if (!state) return;

        const { containerEl, steps } = state;
        const stepItems = containerEl.querySelectorAll('.multi-step-item');

        stepItems.forEach((item, i) => {
            item.classList.remove('active', 'completed', 'error');
            if (i < stepIndex) {
                item.classList.add('completed');
            } else if (i === stepIndex) {
                item.classList.add(status);
            }
        });

        // Update connectors
        const connectors = containerEl.querySelectorAll('.multi-step-connector');
        connectors.forEach((connector, i) => {
            connector.classList.remove('filled');
            if (i < stepIndex) {
                connector.classList.add('filled');
            }
        });

        state.currentStep = stepIndex;
    }

    _setMultiStepProgress(progressId, percent) {
        const state = this.progressState.get(progressId);
        if (!state) return;

        const { containerEl } = state;
        const progressFill = containerEl.querySelector('.multi-step-progress-fill');
        const percentText = containerEl.querySelector('.multi-step-percent-text');

        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        if (percentText) {
            percentText.textContent = `${Math.round(percent)}%`;
        }
    }

    _setMultiStepMessage(progressId, message) {
        const state = this.progressState.get(progressId);
        if (!state) return;

        const { containerEl } = state;
        const messageEl = containerEl.querySelector('.multi-step-message');

        if (messageEl) {
            messageEl.classList.add('message-updating');
            setTimeout(() => {
                messageEl.textContent = message;
                messageEl.classList.remove('message-updating');
            }, 150);
        }
    }

    async _completeMultiStep(progressId, replacementHTML = null) {
        const state = this.progressState.get(progressId);
        if (!state) return;

        const { containerEl, startTime } = state;

        // Ensure minimum display time
        const elapsed = Date.now() - startTime;
        if (elapsed < this.minimumDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, this.minimumDisplayTime - elapsed));
        }

        // Clear message interval
        if (this.messageIntervals.has(progressId)) {
            clearInterval(this.messageIntervals.get(progressId));
            this.messageIntervals.delete(progressId);
        }

        // Mark all steps complete
        const stepItems = containerEl.querySelectorAll('.multi-step-item');
        const connectors = containerEl.querySelectorAll('.multi-step-connector');

        stepItems.forEach(item => {
            item.classList.remove('active', 'error');
            item.classList.add('completed');
        });
        connectors.forEach(connector => connector.classList.add('filled'));

        // Set progress to 100%
        this._setMultiStepProgress(progressId, 100);

        // Fade out and replace
        const progressEl = containerEl.querySelector('.multi-step-progress');
        if (progressEl) {
            progressEl.classList.add('progress-complete');
        }

        setTimeout(() => {
            if (replacementHTML) {
                containerEl.innerHTML = replacementHTML;
                containerEl.classList.add('content-loaded');
                setTimeout(() => containerEl.classList.remove('content-loaded'), 450);
            }
            this.progressState.delete(progressId);
        }, 400);
    }

    _errorMultiStep(progressId, errorMessage, errorHTML = null) {
        const state = this.progressState.get(progressId);
        if (!state) return;

        const { containerEl, currentStep } = state;

        // Clear message interval
        if (this.messageIntervals.has(progressId)) {
            clearInterval(this.messageIntervals.get(progressId));
            this.messageIntervals.delete(progressId);
        }

        // Mark current step as error
        const stepItems = containerEl.querySelectorAll('.multi-step-item');
        if (stepItems[currentStep]) {
            stepItems[currentStep].classList.remove('active');
            stepItems[currentStep].classList.add('error');
        }

        // Update message
        const messageEl = containerEl.querySelector('.multi-step-message');
        if (messageEl) {
            messageEl.textContent = errorMessage || 'An error occurred';
            messageEl.classList.add('error-message');
        }

        // Replace with error HTML after delay
        if (errorHTML) {
            setTimeout(() => {
                containerEl.innerHTML = errorHTML;
                containerEl.classList.add('content-error');
                setTimeout(() => containerEl.classList.remove('content-error'), 450);
                this.progressState.delete(progressId);
            }, 1500);
        } else {
            this.progressState.delete(progressId);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Create an inline loading indicator
     * @param {string} message - Loading message
     * @param {string} size - Size ('sm', 'md', 'lg')
     * @returns {string} HTML string
     */
    getInlineLoadingHTML(message = '', size = 'sm') {
        return `
            <span class="inline-loading">
                ${this._getSacredSpinnerSVG(size)}
                ${message ? `<span class="inline-loading-text">${this._getAtmosphericMessage(message)}</span>` : ''}
            </span>
        `;
    }

    /**
     * Create a button loading state
     * @param {HTMLButtonElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    setButtonLoading(button, loading = true) {
        if (!button) return;

        if (loading) {
            button.dataset.originalContent = button.innerHTML;
            button.disabled = true;
            button.classList.add('btn-loading');
            button.innerHTML = `
                <span class="btn-spinner">${this._getSacredSpinnerSVG('sm')}</span>
                <span class="btn-loading-text">Working...</span>
            `;
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
            if (button.dataset.originalContent) {
                button.innerHTML = button.dataset.originalContent;
                delete button.dataset.originalContent;
            }
        }
    }

    /**
     * Delay execution with minimum time guarantee
     * @param {Promise} promise - Promise to await
     * @param {number} minimumTime - Minimum time in ms
     * @returns {Promise} Result of original promise
     */
    async withMinimumTime(promise, minimumTime = this.minimumDisplayTime) {
        const startTime = Date.now();
        const result = await promise;
        const elapsed = Date.now() - startTime;
        if (elapsed < minimumTime) {
            await new Promise(resolve => setTimeout(resolve, minimumTime - elapsed));
        }
        return result;
    }
}

// Create and export singleton instance
const loadingSpinner = new LoadingSpinner();

// Legacy compatibility - also expose as LoadingSpinnerManager
const LoadingSpinnerManager = LoadingSpinner;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingSpinner, loadingSpinner };
}

// Make available globally
window.LoadingSpinner = LoadingSpinner;
window.loadingSpinner = loadingSpinner;

console.log('[LoadingSpinner] Utility loaded with sacred geometry spinners');
