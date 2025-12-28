/**
 * Edit Entity Modal Component
 *
 * Provides modal interface for editing existing entities
 * Works with EntityForm for form rendering and FirebaseCRUDManager for updates
 *
 * Features:
 * - Loads entity data from Firestore
 * - Pre-fills form with current values
 * - Validates changes before saving
 * - Shows success/error feedback
 * - Closes on ESC/overlay click
 *
 * Usage:
 *   const modal = new EditEntityModal(crudManager);
 *   modal.open(entityId, collection);
 */

class EditEntityModal {
    /**
     * @param {FirebaseCRUDManager} crudManager - CRUD manager instance
     */
    constructor(crudManager) {
        this.crudManager = crudManager;
        this.currentEntity = null;
        this.currentCollection = null;
        this.currentEntityId = null;
        this.modalElement = null;
        this.entityForm = null;
    }

    /**
     * Open modal for editing an entity
     * @param {string} entityId - Entity document ID
     * @param {string} collection - Firestore collection name
     */
    async open(entityId, collection) {
        try {
            this.currentEntityId = entityId;
            this.currentCollection = collection;

            // Load entity data
            this.showLoadingModal();
            this.currentEntity = await this.loadEntity(entityId, collection);

            if (!this.currentEntity) {
                this.showError('Entity not found');
                return;
            }

            // Create modal
            this.createModal();

            // Render form inside modal
            await this.renderForm();

            // Show modal
            this.show();

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
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="loading-spinner-container">
                    <div class="loading-spinner">Loading entity...</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modalElement = modal;

        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Create modal structure
     */
    createModal() {
        // Remove existing modal if present
        const existing = document.getElementById('edit-entity-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'edit-entity-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2>Edit ${this.capitalizeFirst(this.currentCollection.slice(0, -1))}</h2>
                    <button class="modal-close" aria-label="Close" title="Close (ESC)">×</button>
                </div>
                <div id="modal-form-container" class="modal-body">
                    <!-- EntityForm renders here -->
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modalElement = modal;

        // Wire up close button
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close());

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Close on ESC key
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * Render form using EntityForm component
     */
    async renderForm() {
        if (typeof EntityForm === 'undefined') {
            this.showError('EntityForm component not loaded');
            return;
        }

        const formContainer = this.modalElement.querySelector('#modal-form-container');

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
                    this.close();
                } catch (error) {
                    console.error('[EditModal] onCancel callback error:', error);
                    // Fallback: try to remove modal directly
                    const modal = document.getElementById('edit-entity-modal');
                    if (modal) modal.remove();
                }
            }
        });

        // Render form
        const formHTML = await this.entityForm.render();
        formContainer.innerHTML = formHTML;

        // Initialize form (attach event listeners)
        this.entityForm.initialize(formContainer);
    }

    /**
     * Show modal
     */
    show() {
        if (this.modalElement) {
            setTimeout(() => this.modalElement.classList.add('show'), 10);
        }
    }

    /**
     * Close modal
     */
    close() {
        if (!this.modalElement) return;

        // Remove ESC handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }

        // Fade out
        this.modalElement.classList.remove('show');

        // Remove after animation
        setTimeout(() => {
            if (this.modalElement && this.modalElement.parentNode) {
                this.modalElement.remove();
            }
            this.modalElement = null;
            this.entityForm = null;
        }, 300);
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
        // Validate result parameter
        if (!result || typeof result !== 'object') {
            console.warn('[EditModal] handleSuccess called with invalid result:', result);
            // Still show success since the save operation completed
        }

        this.showToast('Entity updated successfully!', 'success');

        // Close modal after brief delay
        setTimeout(() => {
            this.close();

            // Reload page to show updated content
            // In a more sophisticated app, we'd update the UI directly
            window.location.reload();
        }, 1000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const formContainer = this.modalElement?.querySelector('#modal-form-container');

        if (formContainer) {
            formContainer.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3>Error</h3>
                    <p style="color: #ef4444; margin: 1rem 0;">${this.escapeHtml(message)}</p>
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
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

        // Fallback: Create simple toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 99999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
