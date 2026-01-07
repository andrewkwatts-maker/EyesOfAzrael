/**
 * Entity Quick View Modal Component
 * Eyes of Azrael Project
 *
 * Features:
 * - Quick preview of entity data without leaving the page
 * - Shows key attributes and information
 * - Related entities navigation
 * - Smooth animations and transitions
 * - Focus trap for accessibility
 * - Keyboard accessible (ESC to close)
 * - Mobile responsive with bottom sheet option
 * - Swipe down to close on mobile
 */

class EntityQuickViewModal {
    /**
     * @param {Object} firestore - Firestore instance
     * @param {Object} options - Configuration options
     */
    constructor(firestore, options = {}) {
        this.db = firestore;
        this.currentEntity = null;
        this.overlay = null;
        this.previousActiveElement = null;

        // Configuration options
        this.options = {
            closeOnBackdropClick: options.closeOnBackdropClick !== false,
            enableSwipeToClose: options.enableSwipeToClose !== false,
            animationDuration: options.animationDuration || 300,
            onClose: options.onClose || null,
            onNavigate: options.onNavigate || null,
            ...options
        };

        // Touch handling for swipe to close
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.isDragging = false;

        // Bound handlers for cleanup
        this.boundEscHandler = this.handleEscapeKey.bind(this);
        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchMove = this.handleTouchMove.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);
    }

    /**
     * Open modal with entity data
     * @param {string} entityId - Entity document ID
     * @param {string} collection - Firestore collection name
     * @param {string} mythology - Mythology name
     */
    async open(entityId, collection, mythology) {
        console.log('[QuickView] Opening modal for:', { entityId, collection, mythology });

        // Store focused element for focus restoration
        this.previousActiveElement = document.activeElement;

        // Create modal structure first
        this.createModal();

        try {
            // Load entity data
            this.currentEntity = await this.loadEntity(entityId, collection, mythology);

            // Render content
            this.renderContent();

            // Setup all event handlers
            this.setupEventListeners();

        } catch (error) {
            console.error('[QuickView] Error loading entity:', error);
            this.showError(error.message);
        }
    }

    /**
     * Load entity from Firestore
     */
    async loadEntity(entityId, collection, mythology) {
        if (!this.db) {
            throw new Error('Firestore not initialized');
        }

        const doc = await this.db
            .collection(collection)
            .doc(entityId)
            .get();

        if (!doc.exists) {
            throw new Error('Entity not found');
        }

        return {
            id: doc.id,
            collection,
            mythology,
            ...doc.data()
        };
    }

    /**
     * Create modal DOM structure
     */
    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('quick-view-modal');
        if (existing) existing.remove();

        // Detect mobile for bottom sheet behavior
        const isMobile = window.innerWidth < 640;

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'quick-view-modal';
        overlay.className = `quick-view-overlay${isMobile ? ' quick-view-mobile' : ''}`;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'quick-view-title');

        overlay.innerHTML = `
            <div class="quick-view-content" tabindex="-1">
                ${isMobile ? '<div class="quick-view-drag-handle"><span></span></div>' : ''}
                <button class="quick-view-close" aria-label="Close quick view" title="Close (ESC)">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div id="quick-view-body" class="quick-view-body">
                    <div class="quick-view-loading">
                        <div class="quick-view-spinner">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <p>Loading entity...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.classList.add('modal-open');
        this.overlay = overlay;

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        if (!this.overlay) return;

        const content = this.overlay.querySelector('.quick-view-content');
        const closeBtn = this.overlay.querySelector('.quick-view-close');

        // Close button
        closeBtn?.addEventListener('click', () => this.close());

        // Backdrop click
        if (this.options.closeOnBackdropClick) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        // ESC key handler
        document.addEventListener('keydown', this.boundEscHandler);

        // Focus trap
        this.setupFocusTrap();

        // Swipe to close on mobile
        if (this.options.enableSwipeToClose && this.overlay.classList.contains('quick-view-mobile')) {
            this.setupSwipeToClose();
        }

        // Focus content
        content?.focus();
    }

    /**
     * Handle ESC key press
     * @param {KeyboardEvent} e
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    /**
     * Setup focus trap for modal
     */
    setupFocusTrap() {
        if (!this.overlay) return;

        const content = this.overlay.querySelector('.quick-view-content');

        const getFocusableElements = () => {
            const selector = [
                'button:not([disabled])',
                '[href]',
                'input:not([disabled]):not([type="hidden"])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
                '[role="button"]'
            ].join(',');
            return Array.from(content.querySelectorAll(selector)).filter(
                el => el.offsetParent !== null
            );
        };

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        content.addEventListener('keydown', handleTabKey);
        this.focusTrapHandler = handleTabKey;

        // Focus first focusable element
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Setup swipe to close for mobile
     */
    setupSwipeToClose() {
        const content = this.overlay.querySelector('.quick-view-content');
        const dragHandle = this.overlay.querySelector('.quick-view-drag-handle');

        if (!content || !dragHandle) return;

        dragHandle.addEventListener('touchstart', this.boundTouchStart, { passive: true });
        dragHandle.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        dragHandle.addEventListener('touchend', this.boundTouchEnd);
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e
     */
    handleTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = true;

        const content = this.overlay.querySelector('.quick-view-content');
        if (content) {
            content.style.transition = 'none';
        }
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e
     */
    handleTouchMove(e) {
        if (!this.isDragging) return;

        this.touchCurrentY = e.touches[0].clientY;
        const deltaY = this.touchCurrentY - this.touchStartY;

        // Only allow dragging down
        if (deltaY > 0) {
            e.preventDefault();
            const content = this.overlay.querySelector('.quick-view-content');
            if (content) {
                content.style.transform = `translateY(${deltaY}px)`;
                // Fade backdrop as user drags
                this.overlay.style.backgroundColor = `rgba(0, 0, 0, ${0.6 * (1 - deltaY / 300)})`;
            }
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd() {
        if (!this.isDragging) return;

        const deltaY = this.touchCurrentY - this.touchStartY;
        const content = this.overlay.querySelector('.quick-view-content');

        if (content) {
            content.style.transition = '';
            content.style.transform = '';
        }

        this.overlay.style.backgroundColor = '';
        this.isDragging = false;

        // If dragged more than 100px, close the modal
        if (deltaY > 100) {
            this.close();
        }
    }

    /**
     * Render entity content
     */
    renderContent() {
        const body = document.getElementById('quick-view-body');
        if (!body || !this.currentEntity) return;

        const entity = this.currentEntity;

        // Build HTML
        body.innerHTML = `
            ${this.renderHeader(entity)}
            ${this.renderContentSection(entity)}
            ${this.renderActions(entity)}
        `;

        // Wire up action button handlers
        this.wireUpActionButtons();

        // Load related entities if they exist
        this.loadRelatedEntitiesAsync(entity);
    }

    /**
     * Render header section
     */
    renderHeader(entity) {
        const importance = entity.importance || 0;
        const stars = importance > 0 ? this.renderStars(Math.min(5, importance)) : '';

        return `
            <div class="quick-view-header">
                <div class="quick-view-icon-container">
                    ${this.renderIcon(entity.icon)}
                </div>
                <div class="quick-view-title-section">
                    <h2 id="quick-view-title" class="quick-view-title">${this.escapeHtml(entity.name || entity.title || 'Untitled')}</h2>
                    <div class="quick-view-meta">
                        <span class="quick-view-badge quick-view-badge-mythology">${this.escapeHtml(this.capitalize(entity.mythology))}</span>
                        <span class="quick-view-badge quick-view-badge-type">${this.escapeHtml(this.getTypeLabel(entity.collection))}</span>
                        ${stars ? `<span class="quick-view-badge quick-view-badge-importance">${stars}</span>` : ''}
                    </div>
                    ${entity.linguistic?.originalName ? `
                        <div class="quick-view-subtitle">${this.escapeHtml(entity.linguistic.originalName)}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render star icons for importance
     * @param {number} count - Number of stars
     * @returns {string} HTML string
     */
    renderStars(count) {
        let stars = '';
        for (let i = 0; i < count; i++) {
            stars += '<svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        }
        return stars;
    }

    /**
     * Render content section
     */
    renderContentSection(entity) {
        let html = '<div class="quick-view-content-section">';

        // Alternate names
        if (entity.alternateNames && entity.alternateNames.length > 0) {
            html += `
                <div class="quick-view-info-section">
                    <h3>Also Known As</h3>
                    <p class="quick-view-alt-names">${entity.alternateNames.map(n => this.escapeHtml(n)).join(', ')}</p>
                </div>
            `;
        }

        // Description (truncated for modal view)
        const description = entity.fullDescription || entity.shortDescription || entity.description || '';
        if (description) {
            const truncated = this.truncateText(description, 300);
            html += `
                <div class="quick-view-info-section">
                    <h3>Description</h3>
                    <p class="quick-view-description">${this.escapeHtml(truncated)}</p>
                </div>
            `;
        }

        // Domains
        if (entity.domains && entity.domains.length > 0) {
            html += `
                <div class="quick-view-info-section">
                    <h3>Domains</h3>
                    <div class="quick-view-tags">
                        ${entity.domains.map(d => `<span class="quick-view-tag">${this.escapeHtml(d)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Symbols
        if (entity.symbols && entity.symbols.length > 0) {
            html += `
                <div class="quick-view-info-section">
                    <h3>Symbols</h3>
                    <div class="quick-view-tags">
                        ${entity.symbols.map(s => `<span class="quick-view-tag">${this.escapeHtml(s)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Element (for deities)
        if (entity.element) {
            html += `
                <div class="quick-view-info-section quick-view-info-inline">
                    <h3>Element</h3>
                    <span class="quick-view-tag quick-view-tag-element">${this.escapeHtml(entity.element)}</span>
                </div>
            `;
        }

        // Gender (for deities)
        if (entity.gender) {
            html += `
                <div class="quick-view-info-section quick-view-info-inline">
                    <h3>Gender</h3>
                    <span class="quick-view-value">${this.escapeHtml(entity.gender)}</span>
                </div>
            `;
        }

        // Related entities placeholder
        const relatedIds = this.getRelatedIds(entity);
        if (relatedIds.length > 0) {
            html += `
                <div class="quick-view-info-section">
                    <h3>Related Entities</h3>
                    <div id="quick-view-related" class="quick-view-related-grid">
                        <div class="quick-view-related-loading">
                            <div class="spinner-ring spinner-ring-small"></div>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Render actions section
     */
    renderActions(entity) {
        const fullPageUrl = this.getFullPageUrl(entity);

        return `
            <footer class="quick-view-footer">
                <a href="${fullPageUrl}" class="quick-view-btn quick-view-btn-primary" data-action="view-full">
                    <span>View Full Page</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
                <button class="quick-view-btn quick-view-btn-secondary" data-action="close">
                    Close
                </button>
            </footer>
        `;
    }

    /**
     * Wire up action button handlers
     */
    wireUpActionButtons() {
        const closeBtn = this.overlay?.querySelector('[data-action="close"]');
        const viewFullBtn = this.overlay?.querySelector('[data-action="view-full"]');

        closeBtn?.addEventListener('click', () => this.close());

        viewFullBtn?.addEventListener('click', (e) => {
            if (typeof this.options.onNavigate === 'function') {
                e.preventDefault();
                this.options.onNavigate(this.currentEntity);
                this.close();
            }
        });
    }

    /**
     * Load related entities asynchronously
     */
    async loadRelatedEntitiesAsync(entity) {
        const container = document.getElementById('quick-view-related');
        if (!container) return;

        const relatedIds = this.getRelatedIds(entity);
        if (relatedIds.length === 0) return;

        try {
            // Load first 6 related entities
            const entities = await this.loadMultipleEntities(relatedIds.slice(0, 6));

            if (entities.length === 0) {
                container.innerHTML = '<p class="quick-view-no-data">No related entities found</p>';
                return;
            }

            // Render related entity cards
            container.innerHTML = entities.map(e => `
                <button class="quick-view-related-card"
                     data-entity-id="${e.id}"
                     data-collection="${e.collection}"
                     data-mythology="${e.mythology}"
                     aria-label="View ${this.escapeHtml(e.name || e.title)}">
                    <div class="quick-view-related-icon">${this.renderIcon(e.icon)}</div>
                    <div class="quick-view-related-name">${this.escapeHtml(e.name || e.title || 'Untitled')}</div>
                </button>
            `).join('');

            // Add click handlers to related cards
            this.attachRelatedCardHandlers(container);

        } catch (error) {
            console.error('[QuickView] Error loading related entities:', error);
            container.innerHTML = '<p class="quick-view-error-text">Error loading related entities</p>';
        }
    }

    /**
     * Load multiple entities from Firestore
     */
    async loadMultipleEntities(relatedIds) {
        const entities = [];
        const collections = ['deities', 'heroes', 'creatures', 'cosmology', 'rituals', 'herbs', 'texts', 'symbols', 'items', 'places'];

        for (const relatedId of relatedIds) {
            // Try to find entity across collections
            for (const col of collections) {
                try {
                    const doc = await this.db.collection(col).doc(relatedId).get();
                    if (doc.exists) {
                        const data = doc.data();
                        entities.push({
                            id: doc.id,
                            collection: col,
                            mythology: data.mythology || 'unknown',
                            ...data
                        });
                        break;
                    }
                } catch (error) {
                    // Continue to next collection
                }
            }
        }

        return entities;
    }

    /**
     * Attach handlers to related entity cards
     */
    attachRelatedCardHandlers(container) {
        const cards = container.querySelectorAll('.quick-view-related-card');

        cards.forEach(card => {
            card.addEventListener('click', () => {
                this.openRelatedEntity(card);
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openRelatedEntity(card);
                }
            });
        });
    }

    /**
     * Open related entity in modal
     */
    openRelatedEntity(card) {
        const entityId = card.dataset.entityId;
        const collection = card.dataset.collection;
        const mythology = card.dataset.mythology;

        if (entityId && collection && mythology) {
            // Close current modal and open new one
            this.close();
            setTimeout(() => {
                this.open(entityId, collection, mythology);
            }, this.options.animationDuration + 50);
        }
    }

    /**
     * Close modal
     */
    close() {
        const modal = document.getElementById('quick-view-modal');
        if (!modal) return;

        // Cleanup event listeners
        document.removeEventListener('keydown', this.boundEscHandler);

        // Cleanup touch listeners if mobile
        const dragHandle = modal.querySelector('.quick-view-drag-handle');
        if (dragHandle) {
            dragHandle.removeEventListener('touchstart', this.boundTouchStart);
            dragHandle.removeEventListener('touchmove', this.boundTouchMove);
            dragHandle.removeEventListener('touchend', this.boundTouchEnd);
        }

        // Animate out
        modal.classList.remove('show');

        setTimeout(() => {
            modal.remove();
            document.body.classList.remove('modal-open');
            this.overlay = null;
            this.currentEntity = null;

            // Return focus to previous element
            if (this.previousActiveElement && this.previousActiveElement.focus) {
                this.previousActiveElement.focus();
            }

            // Call onClose callback
            if (typeof this.options.onClose === 'function') {
                this.options.onClose();
            }
        }, this.options.animationDuration);
    }

    /**
     * Show error state
     */
    showError(message) {
        const body = document.getElementById('quick-view-body');
        if (!body) {
            console.error('[QuickView] Cannot show error - modal body not found:', message);
            return;
        }

        body.innerHTML = `
            <div class="quick-view-error">
                <div class="quick-view-error-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h2>Error</h2>
                <p class="quick-view-error-message">${this.escapeHtml(message)}</p>
                <button class="quick-view-btn quick-view-btn-primary" onclick="document.getElementById('quick-view-modal').remove(); document.body.classList.remove('modal-open');">
                    Close
                </button>
            </div>
        `;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Get related entity IDs from various sources
     */
    getRelatedIds(entity) {
        const ids = [];

        // Check displayOptions
        if (entity.displayOptions?.relatedEntities) {
            entity.displayOptions.relatedEntities.forEach(rel => {
                if (rel.ids && Array.isArray(rel.ids)) {
                    ids.push(...rel.ids);
                }
            });
        }

        // Check direct relationships
        if (entity.relationships?.relatedIds) {
            ids.push(...entity.relationships.relatedIds);
        }

        // Remove duplicates
        return [...new Set(ids)];
    }

    /**
     * Get full page URL
     */
    getFullPageUrl(entity) {
        const mythology = entity.mythology || 'unknown';
        const collection = entity.collection || 'entities';
        const id = entity.id;

        return `#/mythology/${mythology}/${collection}/${id}`;
    }

    /**
     * Get type label
     */
    getTypeLabel(collection) {
        const labels = {
            deities: 'Deity',
            heroes: 'Hero',
            creatures: 'Creature',
            cosmology: 'Cosmology',
            rituals: 'Ritual',
            herbs: 'Herb',
            texts: 'Text',
            symbols: 'Symbol',
            items: 'Item',
            places: 'Place',
            archetypes: 'Archetype'
        };

        return labels[collection] || this.capitalize(collection);
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render icon - handles inline SVG, URLs, and emoji/text icons
     * @param {string} icon - The icon value
     * @returns {string} HTML string for the icon
     */
    renderIcon(icon) {
        if (!icon) {
            return '<span class="quick-view-icon-fallback"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></span>';
        }

        // Check if it's inline SVG (starts with <svg)
        if (typeof icon === 'string') {
            const iconTrimmed = icon.trim();
            if (iconTrimmed.toLowerCase().startsWith('<svg')) {
                // Render inline SVG directly
                return `<span class="quick-view-icon-svg">${icon}</span>`;
            }

            // Check if it's a URL
            const isUrl = iconTrimmed.startsWith('http://') ||
                          iconTrimmed.startsWith('https://') ||
                          iconTrimmed.startsWith('/') ||
                          iconTrimmed.startsWith('./') ||
                          /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(iconTrimmed);

            if (isUrl) {
                return `<img src="${this.escapeHtml(iconTrimmed)}" alt="" class="quick-view-icon-img" loading="lazy" />`;
            }
        }

        // Otherwise, treat as emoji or text (escaped)
        return `<span class="quick-view-icon-text">${this.escapeHtml(icon)}</span>`;
    }

    /**
     * Truncate text to a maximum length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 300) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Make globally available
window.EntityQuickViewModal = EntityQuickViewModal;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityQuickViewModal;
}
