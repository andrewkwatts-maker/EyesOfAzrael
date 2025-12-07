/**
 * Delete Confirmation Modal Component
 * Shows a confirmation dialog before deleting theories
 */

class DeleteConfirmationModal {
    constructor() {
        this.modal = null;
        this.currentTheoryId = null;
        this.onConfirmCallback = null;
        this.init();
    }

    /**
     * Initialize the modal
     */
    init() {
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create modal HTML structure
     */
    createModal() {
        const modalHTML = `
            <div id="delete-confirmation-modal" class="modal-overlay" style="display: none;">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2 class="modal-title">Delete Theory</h2>
                        <button class="modal-close" aria-label="Close modal">&times;</button>
                    </div>

                    <div class="modal-body">
                        <div class="delete-warning">
                            <div class="warning-icon">⚠️</div>
                            <h3>Are you sure you want to delete this theory?</h3>
                            <p>This action cannot be undone. All data associated with this theory will be permanently deleted, including:</p>
                            <ul>
                                <li>Theory content and images</li>
                                <li>All votes and voting history</li>
                                <li>All comments and discussions</li>
                                <li>View statistics</li>
                            </ul>
                        </div>

                        <div id="delete-error" class="error-message" style="display: none;"></div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-cancel" id="delete-cancel-btn">
                            Cancel
                        </button>
                        <button class="btn btn-danger" id="delete-confirm-btn">
                            Delete Forever
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Create modal element
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv.firstElementChild);

        this.modal = document.getElementById('delete-confirmation-modal');

        // Add modal styles
        this.injectStyles();
    }

    /**
     * Inject modal styles
     */
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease-out;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .modal-container {
                background: linear-gradient(135deg, rgba(20, 20, 40, 0.98) 0%, rgba(30, 20, 50, 0.98) 100%);
                border: 2px solid rgba(147, 51, 234, 0.4);
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease-out;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem 2rem;
                border-bottom: 2px solid rgba(147, 51, 234, 0.3);
            }

            .modal-title {
                margin: 0;
                font-size: 1.5rem;
                color: var(--accent-purple, #9333ea);
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 2rem;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .modal-body {
                padding: 2rem;
            }

            .delete-warning {
                text-align: center;
                color: rgba(255, 255, 255, 0.9);
            }

            .warning-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
            }

            .delete-warning h3 {
                margin-bottom: 1rem;
                font-size: 1.3rem;
                color: #ef4444;
            }

            .delete-warning p {
                margin-bottom: 1rem;
                line-height: 1.6;
                opacity: 0.9;
            }

            .delete-warning ul {
                text-align: left;
                max-width: 400px;
                margin: 1rem auto;
                padding-left: 1.5rem;
                opacity: 0.8;
            }

            .delete-warning li {
                margin-bottom: 0.5rem;
            }

            .modal-footer {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                padding: 1.5rem 2rem;
                border-top: 2px solid rgba(147, 51, 234, 0.3);
            }

            .btn {
                padding: 0.75rem 2rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .btn-cancel {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 2px solid rgba(147, 51, 234, 0.3);
            }

            .btn-cancel:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(147, 51, 234, 0.5);
            }

            .btn-danger {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                border: 2px solid #dc2626;
            }

            .btn-danger:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
            }

            .btn-danger:active {
                transform: translateY(0);
            }

            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }

            .error-message {
                background: rgba(239, 68, 68, 0.2);
                border: 2px solid rgba(239, 68, 68, 0.5);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
                color: #fca5a5;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Cancel button
        const cancelBtn = document.getElementById('delete-cancel-btn');
        cancelBtn.addEventListener('click', () => this.hide());

        // Confirm button
        const confirmBtn = document.getElementById('delete-confirm-btn');
        confirmBtn.addEventListener('click', () => this.confirm());

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hide();
            }
        });
    }

    /**
     * Show the modal
     * @param {string} theoryId - Theory ID to delete
     * @param {Function} onConfirm - Optional callback on confirmation
     */
    show(theoryId, onConfirm = null) {
        this.currentTheoryId = theoryId;
        this.onConfirmCallback = onConfirm;

        // Hide error message
        const errorDiv = document.getElementById('delete-error');
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        // Show modal
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus on cancel button (safer default)
        setTimeout(() => {
            document.getElementById('delete-cancel-btn').focus();
        }, 100);
    }

    /**
     * Hide the modal
     */
    hide() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentTheoryId = null;
        this.onConfirmCallback = null;
    }

    /**
     * Confirm deletion
     */
    async confirm() {
        if (!this.currentTheoryId) {
            return;
        }

        const confirmBtn = document.getElementById('delete-confirm-btn');
        const cancelBtn = document.getElementById('delete-cancel-btn');
        const errorDiv = document.getElementById('delete-error');

        // Disable buttons
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';

        try {
            // Use custom callback if provided
            if (this.onConfirmCallback) {
                await this.onConfirmCallback(this.currentTheoryId);
            } else {
                // Default deletion using theoryOwnership
                if (window.theoryOwnership) {
                    await window.theoryOwnership.executeDelete(this.currentTheoryId);
                } else {
                    throw new Error('Deletion system not available');
                }
            }

            // Hide modal on success
            this.hide();
        } catch (error) {
            // Show error
            errorDiv.textContent = error.message || 'Failed to delete theory';
            errorDiv.style.display = 'block';

            // Re-enable buttons
            confirmBtn.disabled = false;
            cancelBtn.disabled = false;
            confirmBtn.textContent = 'Delete Forever';
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Create temporary success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }
}

// Create global instance
window.deleteConfirmationModal = new DeleteConfirmationModal();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeleteConfirmationModal;
}
