/**
 * Entity Quick View Modal Component
 * Eyes of Azrael Project
 *
 * Features:
 * - Quick preview of entity data
 * - Shows key attributes and information
 * - Related entities navigation
 * - Smooth animations and transitions
 * - Keyboard accessible (ESC to close)
 * - Mobile responsive
 */

class EntityQuickViewModal {
    constructor(firestore) {
        this.db = firestore;
        this.currentEntity = null;
        this.overlay = null;
    }

    /**
     * Open modal with entity data
     * @param {string} entityId - Entity document ID
     * @param {string} collection - Firestore collection name
     * @param {string} mythology - Mythology name
     */
    async open(entityId, collection, mythology) {
        console.log('[QuickView] Opening modal for:', { entityId, collection, mythology });

        // Create modal structure first to ensure error handling works
        this.createModal();

        try {
            // Load entity data
            this.currentEntity = await this.loadEntity(entityId, collection, mythology);

            // Render content
            this.renderContent();

        } catch (error) {
            console.error('[QuickView] Error loading entity:', error);
            // showError() is now safe to call since modal exists
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

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'quick-view-modal';
        overlay.className = 'quick-view-overlay';
        overlay.innerHTML = `
            <div class="quick-view-content">
                <button class="quick-view-close" aria-label="Close quick view">×</button>
                <div id="quick-view-body" class="quick-view-body">
                    <div class="loading-content">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <p>Loading entity...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Wire up close handlers
        this.attachCloseHandlers(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
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

        // Load related entities if they exist
        this.loadRelatedEntitiesAsync(entity);
    }

    /**
     * Render header section
     */
    renderHeader(entity) {
        const importance = entity.importance || 0;
        const stars = importance > 0 ? '⭐'.repeat(Math.min(5, importance)) : '';

        return `
            <div class="quick-view-header">
                <div class="entity-icon-large">${this.renderIcon(entity.icon)}</div>
                <div class="entity-title-section">
                    <h2 class="entity-title">${this.escapeHtml(entity.name || entity.title || 'Untitled')}</h2>
                    <div class="entity-meta">
                        <span class="meta-badge mythology">${this.escapeHtml(this.capitalize(entity.mythology))}</span>
                        <span class="meta-badge type">${this.escapeHtml(this.getTypeLabel(entity.collection))}</span>
                        ${stars ? `<span class="meta-badge importance">${stars}</span>` : ''}
                    </div>
                    ${entity.linguistic?.originalName ? `
                        <div class="entity-subtitle">${this.escapeHtml(entity.linguistic.originalName)}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render content section
     */
    renderContentSection(entity) {
        let html = '<div class="quick-view-content-section">';

        // Alternate names
        if (entity.alternateNames && entity.alternateNames.length > 0) {
            html += `
                <div class="info-section">
                    <h3>Also Known As</h3>
                    <p class="alternate-names">${entity.alternateNames.map(n => this.escapeHtml(n)).join(', ')}</p>
                </div>
            `;
        }

        // Description (truncated for modal view)
        const description = entity.fullDescription || entity.shortDescription || entity.description || '';
        if (description) {
            const truncated = this.truncateText(description, 300);
            html += `
                <div class="info-section">
                    <h3>Description</h3>
                    <p class="description">${this.escapeHtml(truncated)}</p>
                </div>
            `;
        }

        // Domains
        if (entity.domains && entity.domains.length > 0) {
            html += `
                <div class="info-section">
                    <h3>Domains</h3>
                    <div class="tag-list">
                        ${entity.domains.map(d => `<span class="tag">${this.escapeHtml(d)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Symbols
        if (entity.symbols && entity.symbols.length > 0) {
            html += `
                <div class="info-section">
                    <h3>Symbols</h3>
                    <div class="tag-list">
                        ${entity.symbols.map(s => `<span class="tag">${this.escapeHtml(s)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Element (for deities)
        if (entity.element) {
            html += `
                <div class="info-section">
                    <h3>Element</h3>
                    <p class="element">${this.escapeHtml(entity.element)}</p>
                </div>
            `;
        }

        // Gender (for deities)
        if (entity.gender) {
            html += `
                <div class="info-section">
                    <h3>Gender</h3>
                    <p class="gender">${this.escapeHtml(entity.gender)}</p>
                </div>
            `;
        }

        // Related entities placeholder
        const relatedIds = this.getRelatedIds(entity);
        if (relatedIds.length > 0) {
            html += `
                <div class="info-section">
                    <h3>Related Entities</h3>
                    <div id="related-entities" class="related-grid">
                        <div class="loading-small">
                            <div class="spinner-ring"></div>
                            <p>Loading related entities...</p>
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
            <div class="quick-view-actions">
                <a href="${fullPageUrl}" class="btn-primary">
                    View Full Page →
                </a>
                <button class="btn-secondary" data-action="close">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Load related entities asynchronously
     */
    async loadRelatedEntitiesAsync(entity) {
        const container = document.getElementById('related-entities');
        if (!container) return;

        const relatedIds = this.getRelatedIds(entity);
        if (relatedIds.length === 0) return;

        try {
            // Load first 6 related entities
            const entities = await this.loadMultipleEntities(relatedIds.slice(0, 6));

            if (entities.length === 0) {
                container.innerHTML = '<p class="no-data">No related entities found</p>';
                return;
            }

            // Render related entity cards
            container.innerHTML = entities.map(e => `
                <div class="related-card"
                     data-entity-id="${e.id}"
                     data-collection="${e.collection}"
                     data-mythology="${e.mythology}"
                     role="button"
                     tabindex="0"
                     aria-label="View ${this.escapeHtml(e.name || e.title)}">
                    <div class="related-icon">${this.renderIcon(e.icon)}</div>
                    <div class="related-name">${this.escapeHtml(e.name || e.title || 'Untitled')}</div>
                </div>
            `).join('');

            // Add click handlers to related cards
            this.attachRelatedCardHandlers(container);

        } catch (error) {
            console.error('[QuickView] Error loading related entities:', error);
            container.innerHTML = '<p class="error-text">Error loading related entities</p>';
        }
    }

    /**
     * Load multiple entities from Firestore
     */
    async loadMultipleEntities(relatedIds) {
        const entities = [];
        const collections = ['deities', 'heroes', 'creatures', 'cosmology', 'rituals', 'herbs', 'texts', 'symbols'];

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
                    console.error(`[QuickView] Error loading from ${col}:`, error);
                }
            }
        }

        return entities;
    }

    /**
     * Attach handlers to related entity cards
     */
    attachRelatedCardHandlers(container) {
        const cards = container.querySelectorAll('.related-card');

        cards.forEach(card => {
            // Click handler
            card.addEventListener('click', () => {
                this.openRelatedEntity(card);
            });

            // Keyboard handler
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
            }, 100);
        }
    }

    /**
     * Attach close handlers
     */
    attachCloseHandlers(overlay) {
        const closeBtn = overlay.querySelector('.quick-view-close');
        closeBtn.addEventListener('click', () => this.close());

        const actionBtn = overlay.querySelector('[data-action="close"]');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => this.close());
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', escHandler);
        overlay._escHandler = escHandler;

        this.setupFocusTrap(overlay);
    }

    /**
     * Setup focus trap for modal
     */
    setupFocusTrap(overlay) {
        const getFocusableElements = () => {
            const selector = [
                'button',
                '[href]',
                'input',
                'select',
                'textarea',
                '[tabindex]:not([tabindex="-1"])',
                '[role="button"]'
            ].join(',');
            return Array.from(overlay.querySelectorAll(selector)).filter(
                el => !el.hasAttribute('disabled') && el.offsetParent !== null
            );
        };

        const handleTabKey = (e) => {
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.key === 'Tab') {
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
            }
        };

        overlay.addEventListener('keydown', handleTabKey);
        overlay._focusTrapHandler = handleTabKey;

        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    /**
     * Close modal
     */
    close() {
        const modal = document.getElementById('quick-view-modal');
        if (!modal) return;

        if (modal._escHandler) {
            document.removeEventListener('keydown', modal._escHandler);
        }

        if (modal._focusTrapHandler) {
            modal.removeEventListener('keydown', modal._focusTrapHandler);
        }

        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            this.overlay = null;
        }, 300);
    }

    /**
     * Show error state
     */
    showError(message) {
        const modal = document.getElementById('quick-view-modal');
        if (!modal) {
            console.error('[QuickView] Cannot show error - modal not found:', message);
            // Create modal if it doesn't exist (defensive programming)
            this.createModal();
            // Try again after creating modal
            setTimeout(() => this.showError(message), 50);
            return;
        }

        const body = modal.querySelector('.quick-view-body');
        if (!body) {
            console.error('[QuickView] Cannot show error - modal body not found:', message);
            return;
        }

        body.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2>Error</h2>
                <p class="error-message">${this.escapeHtml(message)}</p>
                <button class="btn-primary" onclick="this.closest('.quick-view-overlay').remove()">
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
            symbols: 'Symbol'
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
            return '<span class="entity-icon-fallback">📖</span>';
        }

        // Check if it's inline SVG (starts with <svg)
        if (typeof icon === 'string') {
            const iconTrimmed = icon.trim();
            if (iconTrimmed.toLowerCase().startsWith('<svg')) {
                // Render inline SVG directly (SVG is already safe markup)
                return `<span class="entity-icon-svg">${icon}</span>`;
            }

            // Check if it's a URL (http, https, or relative path, or image extension)
            const isUrl = iconTrimmed.startsWith('http://') ||
                          iconTrimmed.startsWith('https://') ||
                          iconTrimmed.startsWith('/') ||
                          iconTrimmed.startsWith('./') ||
                          /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(iconTrimmed);

            if (isUrl) {
                return `<img src="${this.escapeHtml(iconTrimmed)}" alt="" class="entity-icon-img" loading="lazy" />`;
            }
        }

        // Otherwise, treat as emoji or text (escaped)
        return `<span class="entity-icon-text">${this.escapeHtml(icon)}</span>`;
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
