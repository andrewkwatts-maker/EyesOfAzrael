/**
 * Attribute Grid Renderer - Firebase-Driven Component
 * Replaces hardcoded attribute grids with dynamic Firebase data
 * Supports user submissions and edits
 */

class AttributeGridRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    /**
     * Initialize all attribute grid elements on the page
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const grids = document.querySelectorAll('[data-attribute-grid]');
            grids.forEach(grid => this.renderGrid(grid));
        });
    }

    /**
     * Render a single attribute grid from Firebase data
     * @param {HTMLElement} element - The container element
     */
    async renderGrid(element) {
        const mythology = element.getAttribute('data-mythology');
        const entityId = element.getAttribute('data-entity');
        const allowEdit = element.getAttribute('data-allow-edit') === 'true';

        if (!mythology || !entityId) {
            console.error('Missing required attributes: data-mythology or data-entity');
            return;
        }

        try {
            // Show loading spinner
            element.innerHTML = this.getLoadingHTML();

            // Fetch data from Firebase
            const data = await this.fetchAttributes(mythology, entityId);

            // Render the grid
            element.innerHTML = this.renderGridHTML(data, allowEdit, mythology, entityId);

            // Attach event listeners for edit buttons
            if (allowEdit) {
                this.attachEditListeners(element, mythology, entityId);
            }

        } catch (error) {
            console.error('Error rendering attribute grid:', error);
            element.innerHTML = this.getErrorHTML(error.message);
        }
    }

    /**
     * Fetch attributes from Firebase
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @returns {Promise<Object>} Attribute data
     */
    async fetchAttributes(mythology, entityId) {
        const docRef = this.db
            .collection('deities')
            .doc(mythology)
            .collection('entities')
            .doc(entityId);

        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error(`Entity not found: ${mythology}/${entityId}`);
        }

        const data = doc.data();
        return data.attributes || {};
    }

    /**
     * Generate HTML for the attribute grid
     * @param {Object} attributes - Attribute data
     * @param {boolean} allowEdit - Whether to show edit buttons
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @returns {string} HTML string
     */
    renderGridHTML(attributes, allowEdit, mythology, entityId) {
        const cards = Object.entries(attributes).map(([label, value]) =>
            this.renderCardHTML(label, value, allowEdit, mythology, entityId)
        ).join('');

        return `
            <div class="attribute-grid" data-mythology="${mythology}" data-entity="${entityId}" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                ${cards}
                ${allowEdit ? this.getAddButtonHTML() : ''}
            </div>
        `;
    }

    /**
     * Generate HTML for a single attribute card
     * @param {string} label - Attribute label
     * @param {string|Array} value - Attribute value(s)
     * @param {boolean} allowEdit - Whether to show edit button
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @returns {string} HTML string
     */
    renderCardHTML(label, value, allowEdit, mythology, entityId) {
        const valueStr = Array.isArray(value) ? value.join(', ') : value;
        const editButton = allowEdit ? `
            <button class="edit-attribute-btn"
                    data-label="${label}"
                    data-value="${valueStr}"
                    title="Edit ${label}"
                    style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(var(--color-primary-rgb), 0.2); border: none; border-radius: 50%; width: 2rem; height: 2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                ✏️
            </button>
        ` : '';

        return `
            <div class="subsection-card" data-label="${label}" style="position: relative;">
                ${editButton}
                <div class="attribute-label">${label}</div>
                <div class="attribute-value">${valueStr}</div>
            </div>
        `;
    }

    /**
     * Get HTML for add new attribute button
     * @returns {string} HTML string
     */
    getAddButtonHTML() {
        return `
            <div class="subsection-card add-attribute-card" style="cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; opacity: 0.7; border: 2px dashed rgba(var(--color-primary-rgb), 0.5);">
                <button class="add-attribute-btn" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--color-primary);">
                    ➕ Add Attribute
                </button>
            </div>
        `;
    }

    /**
     * Get loading spinner HTML
     * @returns {string} HTML string
     */
    getLoadingHTML() {
        return `
            <div class="spinner-container" style="text-align: center; padding: 2rem;">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <p style="margin-top: 1rem; color: var(--color-text-secondary);">Loading attributes...</p>
            </div>
        `;
    }

    /**
     * Get error message HTML
     * @param {string} message - Error message
     * @returns {string} HTML string
     */
    getErrorHTML(message) {
        return `
            <div style="padding: 2rem; text-align: center; color: var(--color-error);">
                <p><strong>Error loading attributes:</strong></p>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners for edit buttons
     * @param {HTMLElement} container - Container element
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     */
    attachEditListeners(container, mythology, entityId) {
        // Edit existing attribute
        container.querySelectorAll('.edit-attribute-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const label = btn.getAttribute('data-label');
                const value = btn.getAttribute('data-value');
                this.showEditModal(mythology, entityId, label, value);
            });
        });

        // Add new attribute
        const addBtn = container.querySelector('.add-attribute-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddModal(mythology, entityId);
            });
        }
    }

    /**
     * Show modal for editing an attribute
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @param {string} label - Attribute label
     * @param {string} value - Current value
     */
    async showEditModal(mythology, entityId, label, value) {
        const user = this.auth.currentUser;
        if (!user) {
            alert('Please sign in to edit content');
            return;
        }

        const newValue = prompt(`Edit ${label}:`, value);
        if (newValue && newValue !== value) {
            await this.submitEdit(mythology, entityId, label, newValue);
        }
    }

    /**
     * Show modal for adding a new attribute
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     */
    async showAddModal(mythology, entityId) {
        const user = this.auth.currentUser;
        if (!user) {
            alert('Please sign in to add content');
            return;
        }

        const label = prompt('Attribute name (e.g., "Sacred Numbers"):');
        if (!label) return;

        const value = prompt(`Value for ${label}:`);
        if (!value) return;

        await this.submitEdit(mythology, entityId, label, value);
    }

    /**
     * Submit an attribute edit/addition to Firebase
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @param {string} label - Attribute label
     * @param {string} value - New value
     */
    async submitEdit(mythology, entityId, label, value) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        try {
            // Store submission for moderation
            await this.db.collection('submissions').add({
                type: 'attribute_edit',
                mythology,
                entityId,
                section: 'attributes',
                label,
                value,
                userId: user.uid,
                userName: user.displayName || user.email,
                status: 'pending_review',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Your edit has been submitted for review. Thank you!');

        } catch (error) {
            console.error('Error submitting edit:', error);
            alert('Error submitting edit. Please try again.');
        }
    }
}

// Initialize the renderer when Firebase is ready
if (typeof firebase !== 'undefined') {
    const attributeGridRenderer = new AttributeGridRenderer();
    attributeGridRenderer.init();
} else {
    console.error('Firebase not loaded - AttributeGridRenderer cannot initialize');
}
