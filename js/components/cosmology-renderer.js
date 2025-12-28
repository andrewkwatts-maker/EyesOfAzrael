/**
 * Cosmology Content Renderer
 *
 * Renders cosmological concepts from Firebase including:
 * - Creation myths with timelines
 * - Afterlife concepts
 * - Cosmic structures and realms
 * - Fundamental principles
 *
 * Usage:
 *   <div data-cosmology-content
 *        data-mythology="greek"
 *        data-entity="creation"
 *        data-allow-edit="true"></div>
 */

class CosmologyRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    /**
     * Initialize all cosmology content elements on the page
     */
    async initializeAll() {
        const elements = document.querySelectorAll('[data-cosmology-content]');
        for (const element of elements) {
            await this.initialize(element);
        }
    }

    /**
     * Initialize a single cosmology content element
     */
    async initialize(element) {
        const mythology = element.getAttribute('data-mythology');
        const entityId = element.getAttribute('data-entity');
        const allowEdit = element.getAttribute('data-allow-edit') === 'true';

        if (!mythology || !entityId) {
            console.error('Cosmology renderer: missing mythology or entity ID');
            return;
        }

        try {
            // Show loading state
            element.innerHTML = '<div class="loading-spinner">Loading cosmology data from Firebase...</div>';

            // Fetch from Firebase
            const data = await this.fetchCosmology(mythology, entityId);

            if (!data) {
                element.innerHTML = '<div class="error-message">Cosmology data not found</div>';
                return;
            }

            // Render based on cosmology type
            element.innerHTML = this.renderCosmology(data, allowEdit, mythology, entityId);

            // Attach event listeners if editing is allowed
            if (allowEdit && this.auth.currentUser) {
                this.attachEditListeners(element, mythology, entityId);
            }

        } catch (error) {
            console.error('Error loading cosmology:', error);
            element.innerHTML = `<div class="error-message">Error loading cosmology: ${error.message}</div>`;
        }
    }

    /**
     * Fetch cosmology data from Firestore
     */
    async fetchCosmology(mythology, entityId) {
        const docRef = this.db
            .collection('entities')
            .doc(mythology)
            .collection('cosmology')
            .doc(entityId);

        const doc = await docRef.get();
        return doc.exists ? doc.data() : null;
    }

    /**
     * Render cosmology content based on type
     */
    renderCosmology(data, allowEdit, mythology, entityId) {
        let html = '';

        // Render timeline if exists (for creation myths)
        if (data.timeline && data.timeline.length > 0) {
            html += this.renderTimeline(data.timeline);
        }

        // Render structure (for realms, cosmic layers)
        if (data.structure && Object.keys(data.structure).length > 0) {
            html += this.renderStructure(data.structure);
        }

        // Render principles (for fundamental concepts)
        if (data.principles && data.principles.length > 0) {
            html += this.renderPrinciples(data.principles);
        }

        // Render sections
        if (data.sections && data.sections.length > 0) {
            html += this.renderSections(data.sections);
        }

        // Add edit button if allowed
        if (allowEdit && this.auth.currentUser) {
            html += `
                <div class="edit-actions">
                    <button class="btn-edit-cosmology" data-mythology="${mythology}" data-entity="${entityId}">
                        ✏️ Suggest Edit
                    </button>
                </div>
            `;
        }

        return html;
    }

    /**
     * Render timeline for creation myths
     */
    renderTimeline(timeline) {
        let html = '<div class="cosmology-timeline">';

        timeline.forEach((stage, index) => {
            html += `
                <div class="timeline-stage" data-stage="${index}">
                    <div class="timeline-marker">${index + 1}</div>
                    <div class="timeline-content">
                        <h3>${this.escapeHtml(stage.title)}</h3>
                        ${this.renderContent(stage.description)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Render cosmic structure (realms, layers)
     */
    renderStructure(structure) {
        let html = '<div class="cosmology-structure">';

        if (structure.realms && structure.realms.length > 0) {
            html += '<div class="structure-section"><h3>Realms</h3>';
            html += '<div class="realms-grid">';
            structure.realms.forEach(realm => {
                html += `
                    <div class="realm-card">
                        <h4>${this.escapeHtml(realm.name)}</h4>
                        <p>${this.escapeHtml(realm.description)}</p>
                        ${realm.ruler ? `<div class="realm-ruler">Ruled by: ${this.escapeHtml(realm.ruler)}</div>` : ''}
                    </div>
                `;
            });
            html += '</div></div>';
        }

        if (structure.layers && structure.layers.length > 0) {
            html += '<div class="structure-section"><h3>Cosmic Layers</h3>';
            structure.layers.forEach(layer => {
                html += `
                    <div class="layer-item">
                        <strong>${this.escapeHtml(layer.name)}</strong>: ${this.escapeHtml(layer.description)}
                    </div>
                `;
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Render fundamental principles
     */
    renderPrinciples(principles) {
        let html = '<div class="cosmology-principles">';

        principles.forEach(principle => {
            html += `
                <div class="principle-card">
                    <h4>${this.escapeHtml(principle.name)}</h4>
                    ${this.renderContent(principle.description)}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Render content sections
     */
    renderSections(sections) {
        let html = '<div class="cosmology-sections">';

        sections.forEach(section => {
            html += `
                <div class="cosmology-section" data-section-id="${section.id}">
                    <h3>${this.escapeHtml(section.title)}</h3>
                    ${this.renderContent(section.content)}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Render content (paragraphs, lists, etc.)
     */
    renderContent(content) {
        if (!content) return '';

        if (typeof content === 'string') {
            return `<p>${this.escapeHtml(content)}</p>`;
        }

        if (Array.isArray(content)) {
            let html = '';
            content.forEach(item => {
                if (item.type === 'paragraph') {
                    html += `<p>${this.escapeHtml(item.text)}</p>`;
                } else if (item.type === 'list') {
                    html += '<ul>';
                    item.items.forEach(listItem => {
                        html += `<li>${this.escapeHtml(listItem)}</li>`;
                    });
                    html += '</ul>';
                } else if (item.type === 'heading') {
                    html += `<h${item.level}>${this.escapeHtml(item.text)}</h${item.level}>`;
                }
            });
            return html;
        }

        return '';
    }

    /**
     * Attach event listeners for editing
     */
    attachEditListeners(element, mythology, entityId) {
        const editBtn = element.querySelector('.btn-edit-cosmology');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.showEditModal(mythology, entityId);
            });
        }
    }

    /**
     * Show edit modal
     */
    async showEditModal(mythology, entityId) {
        // Check if EditEntityModal is available
        if (typeof EditEntityModal === 'undefined') {
            console.error('EditEntityModal not loaded');
            alert('Edit functionality not available. Please ensure all scripts are loaded.');
            return;
        }

        // Check if CRUD manager is available
        if (!window.EyesOfAzrael || !window.EyesOfAzrael.crudManager) {
            console.error('CRUD Manager not initialized');
            alert('Edit functionality not available. Please ensure the app is properly initialized.');
            return;
        }

        // Open edit modal
        const modal = new EditEntityModal(window.EyesOfAzrael.crudManager);
        await modal.open(entityId, 'cosmology');
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be ready
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        const renderer = new CosmologyRenderer();
        await renderer.initializeAll();
    } else {
        console.error('Firebase not initialized');
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CosmologyRenderer;
}
