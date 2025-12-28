/**
 * Myth List Renderer - Firebase-Driven Component
 * Replaces hardcoded myth/story arrays with dynamic Firebase data
 * Supports user submissions of new myths
 */

class MythListRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    /**
     * Initialize all myth list elements on the page
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const lists = document.querySelectorAll('[data-myth-list]');
            lists.forEach(list => this.renderList(list));
        });
    }

    /**
     * Render a single myth list from Firebase data
     * @param {HTMLElement} element - The container element
     */
    async renderList(element) {
        const mythology = element.getAttribute('data-mythology');
        const entityId = element.getAttribute('data-entity');
        const allowSubmissions = element.getAttribute('data-allow-submissions') === 'true';
        const sectionTitle = element.getAttribute('data-section-title') || 'Key Myths';

        if (!mythology || !entityId) {
            console.error('Missing required attributes: data-mythology or data-entity');
            return;
        }

        try {
            // Show loading spinner
            element.innerHTML = this.getLoadingHTML();

            // Fetch data from Firebase
            const myths = await this.fetchMyths(mythology, entityId);

            // Render the list
            element.innerHTML = this.renderListHTML(myths, allowSubmissions, sectionTitle, mythology, entityId);

            // Attach event listeners
            if (allowSubmissions) {
                this.attachSubmissionListener(element, mythology, entityId);
            }

        } catch (error) {
            console.error('Error rendering myth list:', error);
            element.innerHTML = this.getErrorHTML(error.message);
        }
    }

    /**
     * Fetch myths from Firebase
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @returns {Promise<Array>} Array of myth objects
     */
    async fetchMyths(mythology, entityId) {
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
        return data.myths || [];
    }

    /**
     * Generate HTML for the myth list
     * @param {Array} myths - Array of myth objects
     * @param {boolean} allowSubmissions - Whether to show submission button
     * @param {string} sectionTitle - Section title
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @returns {string} HTML string
     */
    renderListHTML(myths, allowSubmissions, sectionTitle, mythology, entityId) {
        const mythItems = myths.map(myth => this.renderMythHTML(myth)).join('');

        return `
            <div class="myth-list-container" data-mythology="${mythology}" data-entity="${entityId}">
                <h3 style="color: var(--color-text-primary); margin-top: 1.5rem;">${sectionTitle}:</h3>
                ${myths.length > 0 ? `
                    <ul style="margin: 1rem 0 0 2rem; line-height: 1.8;">
                        ${mythItems}
                    </ul>
                ` : `
                    <p style="color: var(--color-text-secondary); font-style: italic;">
                        No myths have been added yet.
                        ${allowSubmissions ? 'Be the first to contribute!' : ''}
                    </p>
                `}
                ${allowSubmissions ? this.getSubmissionButtonHTML() : ''}
            </div>
        `;
    }

    /**
     * Generate HTML for a single myth item
     * @param {Object} myth - Myth object {title, content, source, submittedBy}
     * @returns {string} HTML string
     */
    renderMythHTML(myth) {
        const isExpandable = myth.content && myth.content.length > 200;
        const source = myth.source ? `
            <div class="citation" style="margin-top: 0.5rem;">
                <em>Source: ${this.escapeHtml(myth.source)}</em>
            </div>
        ` : '';

        const submittedBy = myth.submittedBy ? `
            <div class="myth-contributor" style="font-size: 0.85rem; color: var(--color-text-secondary); opacity: 0.7; margin-top: 0.25rem;">
                Contributed by: ${this.escapeHtml(myth.submittedBy)}
            </div>
        ` : '';

        return `
            <li class="myth-item" data-myth-id="${myth.id || ''}" style="margin-bottom: 1rem;">
                <strong>${this.escapeHtml(myth.title)}:</strong> ${this.escapeHtml(myth.content || myth.description)}
                ${source}
                ${submittedBy}
            </li>
        `;
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
     * Get HTML for submission button
     * @returns {string} HTML string
     */
    getSubmissionButtonHTML() {
        return `
            <div style="margin-top: 1.5rem; text-align: center;">
                <button class="submit-myth-btn"
                        style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                               color: white;
                               border: none;
                               padding: 0.75rem 1.5rem;
                               border-radius: var(--radius-md);
                               cursor: pointer;
                               font-weight: 600;
                               transition: transform 0.2s;">
                    ➕ Submit a New Myth
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
                <p style="margin-top: 1rem; color: var(--color-text-secondary);">Loading myths...</p>
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
                <p><strong>Error loading myths:</strong></p>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }

    /**
     * Attach submission button listener
     * @param {HTMLElement} container - Container element
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     */
    attachSubmissionListener(container, mythology, entityId) {
        const submitBtn = container.querySelector('.submit-myth-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.showSubmissionModal(mythology, entityId);
            });
        }
    }

    /**
     * Show modal for submitting a new myth
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     */
    async showSubmissionModal(mythology, entityId) {
        const user = this.auth.currentUser;
        if (!user) {
            alert('Please sign in to submit content');
            // Optionally trigger auth modal
            return;
        }

        // Simple prompt-based submission (can be replaced with modal)
        const title = prompt('Myth title (e.g., "The Titanomachy"):');
        if (!title) return;

        const content = prompt('Myth content:');
        if (!content) return;

        const source = prompt('Source (optional, e.g., "Homer\'s Iliad"):') || '';

        await this.submitMyth(mythology, entityId, {
            title,
            content,
            source,
            submittedBy: user.displayName || user.email
        });
    }

    /**
     * Submit a new myth to Firebase
     * @param {string} mythology - Mythology ID
     * @param {string} entityId - Entity ID
     * @param {Object} mythData - Myth data {title, content, source, submittedBy}
     */
    async submitMyth(mythology, entityId, mythData) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }

        try {
            // Store submission for moderation
            await this.db.collection('submissions').add({
                type: 'myth_submission',
                mythology,
                entityId,
                section: 'myths',
                data: mythData,
                userId: user.uid,
                userName: user.displayName || user.email,
                status: 'pending_review',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Your myth has been submitted for review. Thank you for contributing!');

            // Optionally refresh the list to show pending submission
            const container = document.querySelector(`[data-myth-list][data-mythology="${mythology}"][data-entity="${entityId}"]`);
            if (container) {
                this.renderList(container);
            }

        } catch (error) {
            console.error('Error submitting myth:', error);
            alert('Error submitting myth. Please try again.');
        }
    }
}

// Initialize the renderer when Firebase is ready
if (typeof firebase !== 'undefined') {
    const mythListRenderer = new MythListRenderer();
    mythListRenderer.init();
} else {
    console.error('Firebase not loaded - MythListRenderer cannot initialize');
}
