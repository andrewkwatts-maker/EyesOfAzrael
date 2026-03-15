/**
 * Corpus Search Integration
 *
 * Integrates AssetCorpusSearch component with entity detail pages.
 * This module auto-initializes when included and adds the "Explore Further"
 * section to entity detail views.
 *
 * Integration Points:
 * - EntityDetailViewer - adds corpus search after entity loads
 * - Universal Display Renderer - can add corpus search to any entity view
 * - Standalone initialization for custom pages
 *
 * @version 1.0.0
 */

(function(window, document) {
    'use strict';

    /**
     * Corpus Search Integration Manager
     */
    class CorpusSearchIntegration {
        constructor() {
            this.initialized = false;
            this.activeInstances = new Map();
            this.observer = null;
        }

        /**
         * Initialize the integration
         */
        init() {
            if (this.initialized) return;

            // Wait for DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }

            this.initialized = true;
        }

        /**
         * Setup integration hooks
         */
        setup() {
            // Listen for entity load events
            window.addEventListener('entity:loaded', (e) => {
                this.handleEntityLoaded(e.detail);
            });

            // Listen for SPA navigation
            window.addEventListener('spa:contentLoaded', (e) => {
                this.checkForEntityViews();
            });

            // Observe DOM for dynamically added entity viewers
            this.setupMutationObserver();

            // Check for existing entity viewers
            this.checkForEntityViews();

            console.log('[CorpusSearchIntegration] Initialized');
        }

        /**
         * Setup mutation observer for dynamic content
         */
        setupMutationObserver() {
            if (this.observer) return;

            this.observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList?.contains('entity-detail-viewer')) {
                                this.initializeForElement(node);
                            } else if (node.querySelector) {
                                const viewer = node.querySelector('.entity-detail-viewer');
                                if (viewer) {
                                    this.initializeForElement(viewer);
                                }
                            }
                        }
                    }
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * Handle entity loaded event
         * @param {Object} detail - Event detail with entity info
         */
        handleEntityLoaded(detail) {
            const { entityId, entityType, mythology, entityName } = detail;

            // Find the entity viewer
            const viewer = document.querySelector('.entity-detail-viewer');
            if (!viewer) return;

            // Create entity object from available data
            const entity = {
                id: entityId,
                type: entityType,
                mythology: mythology,
                name: entityName
            };

            this.initializeCorpusSearch(viewer, entity);
        }

        /**
         * Check for entity views on page
         */
        checkForEntityViews() {
            const viewers = document.querySelectorAll('.entity-detail-viewer');
            viewers.forEach(viewer => {
                if (!this.activeInstances.has(viewer)) {
                    this.initializeForElement(viewer);
                }
            });
        }

        /**
         * Initialize corpus search for a viewer element
         * @param {HTMLElement} viewer - Entity detail viewer element
         */
        initializeForElement(viewer) {
            if (this.activeInstances.has(viewer)) return;

            // Get entity data from viewer attributes
            const entityId = viewer.dataset.entityId;
            const entityType = viewer.dataset.entityType;
            const mythology = viewer.dataset.mythology;
            const entityName = viewer.querySelector('.entity-title')?.textContent || '';

            if (!entityId) return;

            const entity = {
                id: entityId,
                type: entityType,
                mythology: mythology,
                name: entityName
            };

            // Small delay to ensure viewer is fully rendered
            setTimeout(() => {
                this.initializeCorpusSearch(viewer, entity);
            }, 100);
        }

        /**
         * Initialize corpus search for a specific entity viewer
         * @param {HTMLElement} viewer - Entity detail viewer element
         * @param {Object} entity - Entity data
         */
        initializeCorpusSearch(viewer, entity) {
            if (this.activeInstances.has(viewer)) return;

            // Find or create container
            let container = viewer.querySelector('#embedded-corpus-search');
            if (!container) {
                container = document.createElement('div');
                container.id = 'embedded-corpus-search';
                container.className = 'corpus-search-container';

                // Find best insertion point
                const mythologyPanel = viewer.querySelector('#panel-mythology');
                const metadataFooter = viewer.querySelector('.entity-metadata-footer');
                const mainContent = viewer.querySelector('.entity-main-content');

                if (mythologyPanel) {
                    mythologyPanel.appendChild(container);
                } else if (metadataFooter && metadataFooter.parentNode) {
                    metadataFooter.parentNode.insertBefore(container, metadataFooter);
                } else if (mainContent) {
                    mainContent.appendChild(container);
                } else {
                    viewer.appendChild(container);
                }
            }

            // Try to get full entity data from global state
            let fullEntity = entity;
            if (window.currentEntityData && window.currentEntityData.id === entity.id) {
                fullEntity = { ...entity, ...window.currentEntityData };
            }

            // Initialize AssetCorpusSearch if available
            if (typeof AssetCorpusSearch !== 'undefined') {
                const instance = new AssetCorpusSearch(container, fullEntity, {
                    maxResultsPerSection: 5,
                    expandFirstSection: true,
                    showCorpusExplorerLink: true
                });

                instance.init().then(() => {
                    this.activeInstances.set(viewer, instance);
                    console.log('[CorpusSearchIntegration] Initialized corpus search for', entity.name);
                }).catch(err => {
                    console.warn('[CorpusSearchIntegration] Init error:', err);
                    this.renderFallback(container, fullEntity);
                });
            } else {
                // Fallback: render basic links
                this.renderFallback(container, fullEntity);
            }
        }

        /**
         * Render fallback content when AssetCorpusSearch is not available
         * @param {HTMLElement} container - Container element
         * @param {Object} entity - Entity data
         */
        renderFallback(container, entity) {
            const entityName = entity.name || entity.title || '';
            const entityType = entity.type || 'deities';
            const entityId = entity.id || '';
            const isSaved = this.isEntitySaved(entityId);

            container.innerHTML = `
                <section class="entity-section entity-section-explore corpus-fallback" style="margin-top: 2rem;">
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">&#128269;</span>
                        Explore Further
                    </h2>
                    <p class="section-description" style="margin-bottom: 1rem; opacity: 0.8;">
                        Discover more references, connections, and parallels
                    </p>
                    <div class="explore-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <a href="#/search"
                           class="btn-primary explore-btn"
                           style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--color-primary, #6366f1); color: white; text-decoration: none; border-radius: 8px;"
                           onclick="event.preventDefault(); window.location.hash='#/search'; setTimeout(function(){ var inp = document.getElementById('search-input'); if(inp){ inp.value='${entityName.replace(/'/g, "\\'")}'; inp.dispatchEvent(new Event('input')); } }, 500);">
                            <span class="btn-icon">&#128269;</span>
                            Search for "${entityName}"
                        </a>
                        <a href="#/browse/${entityType}"
                           class="btn-secondary explore-btn"
                           style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--color-surface, #1a1a2e); color: var(--color-text-primary, #fff); text-decoration: none; border-radius: 8px; border: 1px solid var(--color-border, rgba(255,255,255,0.1));">
                            <span class="btn-icon">&#128279;</span>
                            Browse Related Entities
                        </a>
                        <button class="btn-secondary save-entity-btn"
                           data-entity-id="${entityId}"
                           data-entity-name="${entityName}"
                           data-entity-type="${entityType}"
                           style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: ${isSaved ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-surface, #1a1a2e)'}; color: var(--color-text-primary, #fff); border-radius: 8px; border: 1px solid ${isSaved ? 'rgba(245, 158, 11, 0.5)' : 'var(--color-border, rgba(255,255,255,0.1))'}; cursor: pointer; font-size: inherit;">
                            <span class="btn-icon">${isSaved ? '&#9733;' : '&#9734;'}</span>
                            ${isSaved ? 'Saved' : 'Save to Favorites'}
                        </button>
                    </div>
                </section>
            `;

            // Attach save button handler
            const saveBtn = container.querySelector('.save-entity-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.toggleSaveEntity(saveBtn, entity);
                });
            }
        }

        /**
         * Check if an entity is saved in favorites
         * @param {string} entityId
         * @returns {boolean}
         */
        isEntitySaved(entityId) {
            try {
                const saved = JSON.parse(localStorage.getItem('eoa_saved_entities') || '[]');
                return saved.some(function(e) { return e.id === entityId; });
            } catch (e) {
                return false;
            }
        }

        /**
         * Toggle save/unsave an entity to favorites
         * @param {HTMLElement} btn - The save button element
         * @param {Object} entity - Entity data
         */
        toggleSaveEntity(btn, entity) {
            try {
                var saved = JSON.parse(localStorage.getItem('eoa_saved_entities') || '[]');
                var entityId = entity.id || '';
                var existingIndex = -1;
                for (var i = 0; i < saved.length; i++) {
                    if (saved[i].id === entityId) {
                        existingIndex = i;
                        break;
                    }
                }

                if (existingIndex >= 0) {
                    // Remove from saved
                    saved.splice(existingIndex, 1);
                    btn.querySelector('.btn-icon').innerHTML = '&#9734;';
                    btn.childNodes[btn.childNodes.length - 1].textContent = ' Save to Favorites';
                    btn.style.background = 'var(--color-surface, #1a1a2e)';
                    btn.style.borderColor = 'var(--color-border, rgba(255,255,255,0.1))';
                    console.log('[CorpusSearchIntegration] Removed from favorites:', entity.name);
                } else {
                    // Add to saved
                    saved.push({
                        id: entityId,
                        name: entity.name || entity.title || '',
                        type: entity.type || 'entity',
                        mythology: entity.mythology || '',
                        savedAt: Date.now()
                    });
                    btn.querySelector('.btn-icon').innerHTML = '&#9733;';
                    btn.childNodes[btn.childNodes.length - 1].textContent = ' Saved';
                    btn.style.background = 'rgba(245, 158, 11, 0.2)';
                    btn.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                    console.log('[CorpusSearchIntegration] Saved to favorites:', entity.name);
                }

                localStorage.setItem('eoa_saved_entities', JSON.stringify(saved));
            } catch (e) {
                console.warn('[CorpusSearchIntegration] Could not toggle save:', e);
            }
        }

        /**
         * Cleanup when entity view is removed
         * @param {HTMLElement} viewer - Entity viewer element
         */
        cleanup(viewer) {
            const instance = this.activeInstances.get(viewer);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
            this.activeInstances.delete(viewer);
        }

        /**
         * Cleanup all instances
         */
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.activeInstances.forEach((instance, viewer) => {
                this.cleanup(viewer);
            });
            this.activeInstances.clear();
            this.initialized = false;
        }
    }

    // Create global instance
    const integration = new CorpusSearchIntegration();

    // Auto-initialize
    integration.init();

    // Expose globally
    window.CorpusSearchIntegration = integration;

    // Extend EntityDetailViewer if it exists
    if (typeof EntityDetailViewer !== 'undefined') {
        // Add method to EntityDetailViewer prototype
        const originalInitializeComponents = EntityDetailViewer.prototype.initializeComponents;
        EntityDetailViewer.prototype.initializeComponents = function() {
            // Call original method
            if (originalInitializeComponents) {
                originalInitializeComponents.call(this);
            }

            // Store current entity for corpus search
            window.currentEntityData = this.currentEntity;

            // Trigger corpus search initialization
            const viewer = document.querySelector('.entity-detail-viewer');
            if (viewer && this.currentEntity) {
                integration.initializeCorpusSearch(viewer, this.currentEntity);
            }
        };
    }

})(window, document);
