/**
 * Theory Ownership Management
 * Handles ownership verification for theory editing and deletion
 */

class TheoryOwnership {
    constructor() {
        this.init();
    }

    /**
     * Initialize ownership system
     */
    init() {
        // Listen for auth changes
        window.addEventListener('userLogin', () => this.refreshOwnershipUI());
        window.addEventListener('userLogout', () => this.refreshOwnershipUI());
    }

    /**
     * Check if a theory belongs to the current user
     * @param {string} theoryId - Theory ID to check
     * @param {string|null} userId - User ID/username to check (defaults to current user)
     * @returns {boolean} - True if user owns the theory
     */
    checkOwnership(theoryId, userId = null) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return false;
        }

        const currentUser = window.userAuth.getCurrentUser();
        const targetUserId = userId || currentUser.username;

        const theory = window.userTheories?.getTheory(theoryId);
        if (!theory) {
            return false;
        }

        // Check if authorId matches (for Firebase) or author matches (for localStorage)
        return theory.authorId === targetUserId || theory.author === targetUserId;
    }

    /**
     * Check if current user can edit a theory
     * @param {string} theoryId - Theory ID to check
     * @returns {boolean} - True if user can edit
     */
    canEdit(theoryId) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return false;
        }

        return this.checkOwnership(theoryId);
    }

    /**
     * Check if current user can delete a theory
     * @param {string} theoryId - Theory ID to check
     * @returns {boolean} - True if user can delete
     */
    canDelete(theoryId) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return false;
        }

        return this.checkOwnership(theoryId);
    }

    /**
     * Get theory author information
     * @param {string} theoryId - Theory ID
     * @returns {object|null} - Author info or null if not found
     */
    getTheoryAuthor(theoryId) {
        const theory = window.userTheories?.getTheory(theoryId);
        if (!theory) {
            return null;
        }

        return {
            id: theory.authorId || theory.author,
            username: theory.author,
            avatar: theory.authorAvatar
        };
    }

    /**
     * Verify ownership and return error if not authorized
     * @param {string} theoryId - Theory ID to check
     * @param {string} action - Action being performed (e.g., 'edit', 'delete')
     * @returns {object} - { authorized: boolean, error?: string }
     */
    async verifyOwnership(theoryId, action = 'edit') {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return {
                authorized: false,
                error: `You must be logged in to ${action} theories`
            };
        }

        const theory = await window.userTheories?.getTheory(theoryId);
        if (!theory) {
            return {
                authorized: false,
                error: 'Theory not found'
            };
        }

        if (!this.checkOwnership(theoryId)) {
            return {
                authorized: false,
                error: `You can only ${action} your own theories`
            };
        }

        return { authorized: true };
    }

    /**
     * Show ownership-based UI elements
     * @param {string} theoryId - Theory ID
     * @param {HTMLElement} container - Container to render buttons in
     */
    renderOwnershipActions(theoryId, container) {
        if (!this.canEdit(theoryId) && !this.canDelete(theoryId)) {
            return;
        }

        const actionsHTML = `
            <div class="ownership-actions" style="display: flex; gap: 1rem; margin-top: 1rem;">
                ${this.canEdit(theoryId) ? `
                    <button class="btn btn-edit" onclick="theoryOwnership.handleEdit('${theoryId}')">
                        Edit Theory
                    </button>
                ` : ''}
                ${this.canDelete(theoryId) ? `
                    <button class="btn btn-delete" onclick="theoryOwnership.handleDelete('${theoryId}')">
                        Delete Theory
                    </button>
                ` : ''}
            </div>
        `;

        const actionsDiv = document.createElement('div');
        actionsDiv.innerHTML = actionsHTML;
        container.appendChild(actionsDiv.firstElementChild);
    }

    /**
     * Handle edit button click
     * @param {string} theoryId - Theory ID to edit
     */
    async handleEdit(theoryId) {
        const verification = await this.verifyOwnership(theoryId, 'edit');
        if (!verification.authorized) {
            this.showError(verification.error);
            return;
        }

        // Redirect to edit page
        window.location.href = `edit.html?id=${theoryId}`;
    }

    /**
     * Handle delete button click
     * @param {string} theoryId - Theory ID to delete
     */
    async handleDelete(theoryId) {
        const verification = await this.verifyOwnership(theoryId, 'delete');
        if (!verification.authorized) {
            this.showError(verification.error);
            return;
        }

        // Show delete confirmation modal
        if (window.deleteConfirmationModal) {
            window.deleteConfirmationModal.show(theoryId);
        } else {
            // Fallback to browser confirm
            if (confirm('Are you sure you want to delete this theory? This cannot be undone.')) {
                await this.executeDelete(theoryId);
            }
        }
    }

    /**
     * Execute theory deletion
     * @param {string} theoryId - Theory ID to delete
     */
    async executeDelete(theoryId) {
        const result = await window.userTheories?.deleteTheory(theoryId);

        if (result && result.success) {
            this.showSuccess('Theory deleted successfully. Redirecting...');
            setTimeout(() => {
                window.location.href = 'browse.html';
            }, 1500);
        } else {
            this.showError(result?.error || 'Failed to delete theory');
        }
    }

    /**
     * Refresh ownership-based UI elements
     */
    refreshOwnershipUI() {
        window.dispatchEvent(new CustomEvent('ownershipChanged'));
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Try to use existing modal/notification system
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Try to use existing modal/notification system
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    /**
     * Check ownership for multiple theories (batch operation)
     * @param {string[]} theoryIds - Array of theory IDs
     * @returns {Map<string, boolean>} - Map of theoryId -> canEdit
     */
    checkMultipleOwnership(theoryIds) {
        const results = new Map();
        theoryIds.forEach(id => {
            results.set(id, this.checkOwnership(id));
        });
        return results;
    }

    /**
     * Get all theories owned by current user
     * @returns {Array} - Array of user's theories
     */
    getCurrentUserTheories() {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return [];
        }

        const currentUser = window.userAuth.getCurrentUser();
        return window.userTheories?.getUserTheories(currentUser.username) || [];
    }
}

// Create global instance
window.theoryOwnership = new TheoryOwnership();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TheoryOwnership;
}
