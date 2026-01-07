/**
 * Edit Entity Modal Component
 * Eyes of Azrael Project
 *
 * Provides modal interface for editing existing entities
 * Works with EntityForm for form rendering and FirebaseCRUDManager for updates
 *
 * Features:
 * - Loads entity data from Firestore
 * - Pre-fills form with current values
 * - Validates changes before saving
 * - Shows success/error feedback
 * - Focus trap for accessibility
 * - Unsaved changes warning
 * - Loading overlay during save
 * - Mobile responsive with full screen mode
 * - Keyboard accessible (ESC to close)
 * - Smooth animations
 *
 * Usage:
 *   const modal = new EditEntityModal(crudManager);
 *   modal.open(entityId, collection);
 */

class EditEntityModal {
    /**
     * @param {FirebaseCRUDManager} crudManager - CRUD manager instance
     * @param {Object} options - Configuration options
     */
    constructor(crudManager, options = {}) {
        this.crudManager = crudManager;
        this.currentEntity = null;
        this.currentCollection = null;
        this.currentEntityId = null;
        this.modalElement = null;
        this.entityForm = null;
        this.hasUnsavedChanges = false;
        this.isSaving = false;
        this.previousActiveElement = null;

        // Configuration options
        this.options = {
            closeOnBackdropClick: options.closeOnBackdropClick !== false,
            showUnsavedWarning: options.showUnsavedWarning !== false,
            animationDuration: options.animationDuration || 300,
            onClose: options.onClose || null,
            onSave: options.onSave || null,
            ...options
        };

        // Bound event handlers for cleanup
        this.boundEscapeHandler = this.handleEscapeKey.bind(this);
        this.boundBeforeUnload = this.handleBeforeUnload.bind(this);
    }

    /**
     * Open modal for editing an entity
     * @param {string} entityId - Entity document ID
     * @param {string} collection - Firestore collection name
     */
    async open(entityId, collection) {
        try {
            // Store the currently focused element
            this.previousActiveElement = document.activeElement;

            this.currentEntityId = entityId;
            this.currentCollection = collection;
            this.hasUnsavedChanges = false;

            // Show loading modal
            this.showLoadingModal();

            // Load entity data
            this.currentEntity = await this.loadEntity(entityId, collection);

            if (!this.currentEntity) {
                this.showError('Entity not found');
                return;
            }

            // Create the full modal
            this.createModal();

            // Render form inside modal
            await this.renderForm();

            // Show modal with animation
            this.show();

            // Setup event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('[EditEntityModal] Error opening modal:', error);
            this.showError(error.message);
        }
    }

    /**
     * Load entity data from Firestore
     * @param {string} entityId - Entity ID
     * @param {string} collection - Collection name
     * @returns {Promise<Object>} Entity data
     */
    async loadEntity(entityId, collection) {
        const result = await this.crudManager.read(collection, entityId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to load entity');
        }

        return result.data;
    }

    /**
     * Show loading modal
     */
    showLoadingModal() {
        const existing = document.getElementById('edit-entity-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'edit-entity-modal';
        modal.className = 'edit-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'edit-modal-title');
        modal.innerHTML = `
            <div class="edit-modal-content edit-modal-loading">
                <div class="edit-modal-loading-container">
                    <div class="edit-modal-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <p class="edit-modal-loading-text">Loading entity...</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        this.modalElement = modal;

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }

    /**
     * Create modal structure
     */
    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById('edit-entity-modal');
        if (existing) existing.remove();

        const entityTypeSingular = this.getSingularType(this.currentCollection);
        const entityName = this.currentEntity?.name || this.currentEntity?.title || 'Entity';

        const modal = document.createElement('div');
        modal.id = 'edit-entity-modal';
        modal.className = 'edit-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'edit-modal-title');
        modal.innerHTML = `
            <div class="edit-modal-content edit-modal-large" tabindex="-1">
                <header class="edit-modal-header">
                    <div class="edit-modal-title-section">
                        <h2 id="edit-modal-title">Edit ${this.escapeHtml(entityTypeSingular)}</h2>
                        <span class="edit-modal-subtitle">${this.escapeHtml(entityName)}</span>
                    </div>
                    <button class="edit-modal-close" aria-label="Close modal" title="Close (ESC)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>
                <div id="edit-modal-form-container" class="edit-modal-body">
                    <!-- EntityForm renders here -->
                </div>
                <div class="edit-modal-save-overlay" id="edit-modal-save-overlay">
                    <div class="edit-modal-save-spinner">
                        <div class="spinner-ring"></div>
                    </div>
                    <p>Saving changes...</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        this.modalElement = modal;
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        if (!this.modalElement) return;

        const closeBtn = this.modalElement.querySelector('.edit-modal-close');
        const content = this.modalElement.querySelector('.edit-modal-content');

        // Close button
        closeBtn?.addEventListener('click', () => this.attemptClose());

        // Backdrop click
        if (this.options.closeOnBackdropClick) {
            this.modalElement.addEventListener('click', (e) => {
                if (e.target === this.modalElement) {
                    this.attemptClose();
                }
            });
        }

        // ESC key handler
        document.addEventListener('keydown', this.boundEscapeHandler);

        // Unsaved changes warning
        if (this.options.showUnsavedWarning) {
            window.addEventListener('beforeunload', this.boundBeforeUnload);
        }

        // Focus trap
        this.setupFocusTrap();

        // Track form changes
        this.setupChangeTracking();

        // Focus the modal content
        content?.focus();
    }

    /**
     * Handle ESC key press
     * @param {KeyboardEvent} e
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape' && this.isOpen()) {
            e.preventDefault();
            this.attemptClose();
        }
    }

    /**
     * Handle beforeunload event for unsaved changes
     * @param {BeforeUnloadEvent} e
     */
    handleBeforeUnload(e) {
        if (this.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }

    /**
     * Setup focus trap within modal
     */
    setupFocusTrap() {
        if (!this.modalElement) return;

        const content = this.modalElement.querySelector('.edit-modal-content');

        const getFocusableElements = () => {
            const selector = [
                'button:not([disabled])',
                '[href]',
                'input:not([disabled]):not([type="hidden"])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
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
    }

    /**
     * Setup change tracking for unsaved changes warning
     */
    setupChangeTracking() {
        const formContainer = this.modalElement?.querySelector('#edit-modal-form-container');
        if (!formContainer) return;

        const trackChange = () => {
            this.hasUnsavedChanges = true;
        };

        // Use event delegation for form inputs
        formContainer.addEventListener('input', trackChange);
        formContainer.addEventListener('change', trackChange);
    }

    /**
     * Render form using EntityForm component
     */
    async renderForm() {
        if (typeof EntityForm === 'undefined') {
            this.showError('EntityForm component not loaded');
            return;
        }

        const formContainer = this.modalElement.querySelector('#edit-modal-form-container');

        // Create EntityForm instance with validated callbacks
        this.entityForm = new EntityForm({
            crudManager: this.crudManager,
            collection: this.currentCollection,
            entityId: this.currentEntityId,
            onSuccess: (result) => {
                try {
                    this.handleSuccess(result);
                } catch (error) {
                    console.error('[EditModal] onSuccess callback error:', error);
                    this.showError('An error occurred after saving. Please refresh the page.');
                }
            },
            onCancel: () => {
                try {
                    this.attemptClose();
                } catch (error) {
                    console.error('[EditModal] onCancel callback error:', error);
                    this.forceClose();
                }
            },
            onSaveStart: () => {
                this.showSaveOverlay();
            },
            onSaveEnd: () => {
                this.hideSaveOverlay();
            }
        });

        // Render form
        const formHTML = await this.entityForm.render();
        formContainer.innerHTML = formHTML;

        // Initialize form (attach event listeners)
        this.entityForm.initialize(formContainer);
    }

    /**
     * Show the saving overlay
     */
    showSaveOverlay() {
        this.isSaving = true;
        const overlay = this.modalElement?.querySelector('#edit-modal-save-overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    }

    /**
     * Hide the saving overlay
     */
    hideSaveOverlay() {
        this.isSaving = false;
        const overlay = this.modalElement?.querySelector('#edit-modal-save-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    /**
     * Show modal with animation
     */
    show() {
        if (this.modalElement) {
            requestAnimationFrame(() => {
                this.modalElement.classList.add('show');
            });
        }
    }

    /**
     * Attempt to close modal (with unsaved changes check)
     */
    attemptClose() {
        if (this.isSaving) {
            return; // Don't close while saving
        }

        if (this.hasUnsavedChanges && this.options.showUnsavedWarning) {
            this.showUnsavedWarningDialog();
        } else {
            this.close();
        }
    }

    /**
     * Show unsaved changes warning dialog
     */
    showUnsavedWarningDialog() {
        const existingDialog = document.getElementById('unsaved-changes-dialog');
        if (existingDialog) existingDialog.remove();

        const dialog = document.createElement('div');
        dialog.id = 'unsaved-changes-dialog';
        dialog.className = 'edit-modal-confirm-overlay';
        dialog.innerHTML = `
            <div class="edit-modal-confirm-dialog">
                <div class="edit-modal-confirm-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <h3>Unsaved Changes</h3>
                <p>You have unsaved changes. Are you sure you want to close without saving?</p>
                <div class="edit-modal-confirm-actions">
                    <button class="edit-modal-btn edit-modal-btn-secondary" data-action="cancel">
                        Keep Editing
                    </button>
                    <button class="edit-modal-btn edit-modal-btn-danger" data-action="discard">
                        Discard Changes
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Animate in
        requestAnimationFrame(() => {
            dialog.classList.add('show');
        });

        // Wire up buttons
        dialog.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
            dialog.classList.remove('show');
            setTimeout(() => dialog.remove(), 200);
        });

        dialog.querySelector('[data-action="discard"]')?.addEventListener('click', () => {
            dialog.classList.remove('show');
            setTimeout(() => {
                dialog.remove();
                this.close();
            }, 200);
        });

        // Close on backdrop click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.remove('show');
                setTimeout(() => dialog.remove(), 200);
            }
        });
    }

    /**
     * Close modal with animation
     */
    close() {
        if (!this.modalElement) return;

        // Cleanup event listeners
        document.removeEventListener('keydown', this.boundEscapeHandler);
        window.removeEventListener('beforeunload', this.boundBeforeUnload);

        // Animate out
        this.modalElement.classList.remove('show');

        // Remove after animation
        setTimeout(() => {
            if (this.modalElement && this.modalElement.parentNode) {
                this.modalElement.remove();
            }
            document.body.classList.remove('modal-open');
            this.modalElement = null;
            this.entityForm = null;
            this.hasUnsavedChanges = false;

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
     * Force close without animation (fallback)
     */
    forceClose() {
        document.removeEventListener('keydown', this.boundEscapeHandler);
        window.removeEventListener('beforeunload', this.boundBeforeUnload);

        const modal = document.getElementById('edit-entity-modal');
        if (modal) modal.remove();

        document.body.classList.remove('modal-open');
        this.modalElement = null;
        this.entityForm = null;
    }

    /**
     * Check if modal is open
     * @returns {boolean}
     */
    isOpen() {
        return !!this.modalElement && this.modalElement.classList.contains('show');
    }

    /**
     * Handle successful save
     * @param {Object} result - Save result from CRUD manager
     */
    handleSuccess(result) {
        // Reset unsaved changes flag
        this.hasUnsavedChanges = false;

        // Validate result parameter
        if (!result || typeof result !== 'object') {
            console.warn('[EditModal] handleSuccess called with invalid result:', result);
        }

        this.showToast('Entity updated successfully!', 'success');

        // Call onSave callback
        if (typeof this.options.onSave === 'function') {
            this.options.onSave(result);
        }

        // Close modal after brief delay
        setTimeout(() => {
            this.close();

            // Reload page to show updated content
            window.location.reload();
        }, 1000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const formContainer = this.modalElement?.querySelector('#edit-modal-form-container');

        if (formContainer) {
            formContainer.innerHTML = `
                <div class="edit-modal-error">
                    <div class="edit-modal-error-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>Error</h3>
                    <p class="edit-modal-error-message">${this.escapeHtml(message)}</p>
                    <button class="edit-modal-btn edit-modal-btn-secondary" onclick="this.closest('.edit-modal-overlay').remove(); document.body.classList.remove('modal-open');">
                        Close
                    </button>
                </div>
            `;
        }

        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        // Check if global toast system exists
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Remove existing toast
        const existingToast = document.querySelector('.edit-modal-toast');
        if (existingToast) existingToast.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.className = `edit-modal-toast edit-modal-toast-${type}`;

        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        toast.innerHTML = `
            <span class="edit-modal-toast-icon">${icons[type] || icons.info}</span>
            <span class="edit-modal-toast-message">${this.escapeHtml(message)}</span>
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Get singular form of collection type
     * @param {string} collection - Collection name
     * @returns {string}
     */
    getSingularType(collection) {
        const singularMap = {
            deities: 'Deity',
            heroes: 'Hero',
            creatures: 'Creature',
            items: 'Item',
            places: 'Place',
            texts: 'Text',
            rituals: 'Ritual',
            herbs: 'Herb',
            symbols: 'Symbol',
            archetypes: 'Archetype',
            mythologies: 'Mythology'
        };

        return singularMap[collection] || this.capitalizeFirst(collection.slice(0, -1));
    }

    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string}
     */
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Make globally available
window.EditEntityModal = EditEntityModal;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditEntityModal;
}
