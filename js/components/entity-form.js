/**
 * Entity Form Component
 * Dynamic form builder for creating and editing entities
 * with validation, auto-save, and rich input types
 */

class EntityForm {
    /**
     * @param {Object} options - Configuration options
     * @param {FirebaseCRUDManager} options.crudManager - CRUD manager instance
     * @param {string} options.collection - Collection name
     * @param {string} [options.entityId] - Entity ID (for editing)
     * @param {Function} [options.onSuccess] - Success callback
     * @param {Function} [options.onCancel] - Cancel callback
     */
    constructor(options) {
        this.crudManager = options.crudManager;
        this.collection = options.collection;
        this.entityId = options.entityId;

        // Validate and sanitize callbacks with proper type checking
        this.onSuccess = typeof options.onSuccess === 'function'
            ? options.onSuccess
            : (() => {
                console.warn('[EntityForm] No onSuccess callback provided');
            });

        this.onCancel = typeof options.onCancel === 'function'
            ? options.onCancel
            : (() => {
                console.warn('[EntityForm] No onCancel callback provided');
            });

        this.formData = {};
        this.errors = {};
        this.isEditing = !!this.entityId;
        this.autoSaveTimer = null;

        this.schema = this.getSchema(this.collection);
    }

    /**
     * Get form schema for collection
     * @param {string} collection - Collection name
     * @returns {Object} Schema definition
     */
    getSchema(collection) {
        const baseFields = [
            {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                placeholder: 'Enter entity name...',
                helpText: 'The primary name of this entity'
            },
            {
                name: 'mythology',
                label: 'Mythology',
                type: 'select',
                required: true,
                options: [
                    'greek', 'norse', 'egyptian', 'hindu', 'buddhist',
                    'christian', 'celtic', 'roman', 'aztec', 'mayan',
                    'chinese', 'japanese', 'sumerian', 'babylonian',
                    'persian', 'yoruba', 'aboriginal', 'polynesian'
                ],
                helpText: 'The mythological tradition this entity belongs to'
            },
            {
                name: 'type',
                label: 'Type',
                type: 'text',
                required: true,
                placeholder: 'e.g., deity, hero, creature...',
                helpText: 'The category or classification'
            },
            {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                required: false,
                placeholder: 'Enter a detailed description...',
                rows: 6,
                helpText: 'Detailed information about this entity'
            },
            {
                name: 'icon',
                label: 'Icon (Emoji)',
                type: 'text',
                required: false,
                placeholder: '⚡',
                maxLength: 2,
                helpText: 'An emoji to represent this entity'
            }
        ];

        // Collection-specific fields
        const specificFields = {
            deities: [
                {
                    name: 'domains',
                    label: 'Domains',
                    type: 'tags',
                    placeholder: 'Add domain (e.g., Thunder, Sky)...',
                    helpText: 'Areas of influence or power'
                },
                {
                    name: 'symbols',
                    label: 'Symbols',
                    type: 'tags',
                    placeholder: 'Add symbol...',
                    helpText: 'Sacred symbols and objects'
                },
                {
                    name: 'family',
                    label: 'Family Relationships',
                    type: 'textarea',
                    rows: 3,
                    placeholder: 'Parents, siblings, children...',
                    helpText: 'Family connections and relationships'
                }
            ],
            creatures: [
                {
                    name: 'habitat',
                    label: 'Habitat',
                    type: 'text',
                    placeholder: 'Where this creature lives...',
                    helpText: 'Natural habitat or dwelling place'
                },
                {
                    name: 'abilities',
                    label: 'Abilities',
                    type: 'tags',
                    placeholder: 'Add ability...',
                    helpText: 'Special powers and capabilities'
                }
            ],
            heroes: [
                {
                    name: 'quests',
                    label: 'Quests',
                    type: 'tags',
                    placeholder: 'Add quest...',
                    helpText: 'Famous quests and adventures'
                },
                {
                    name: 'weapons',
                    label: 'Weapons',
                    type: 'tags',
                    placeholder: 'Add weapon...',
                    helpText: 'Legendary weapons and tools'
                }
            ],
            items: [
                {
                    name: 'powers',
                    label: 'Powers',
                    type: 'tags',
                    placeholder: 'Add power...',
                    helpText: 'Magical powers and properties'
                },
                {
                    name: 'owner',
                    label: 'Owner',
                    type: 'text',
                    placeholder: 'Who owns or wields this item...',
                    helpText: 'The deity, hero, or being associated with this item'
                }
            ],
            herbs: [
                {
                    name: 'uses',
                    label: 'Uses',
                    type: 'tags',
                    placeholder: 'Add use...',
                    helpText: 'Medicinal, magical, or ritual uses'
                },
                {
                    name: 'preparation',
                    label: 'Preparation',
                    type: 'textarea',
                    rows: 3,
                    placeholder: 'How to prepare this herb...',
                    helpText: 'Methods of preparation and application'
                }
            ],
            rituals: [
                {
                    name: 'purpose',
                    label: 'Purpose',
                    type: 'text',
                    placeholder: 'Purpose of this ritual...',
                    helpText: 'What this ritual achieves or celebrates'
                },
                {
                    name: 'steps',
                    label: 'Steps',
                    type: 'textarea',
                    rows: 5,
                    placeholder: 'Ritual steps...',
                    helpText: 'Step-by-step procedure'
                },
                {
                    name: 'offerings',
                    label: 'Offerings',
                    type: 'tags',
                    placeholder: 'Add offering...',
                    helpText: 'Required offerings or materials'
                }
            ]
        };

        return {
            fields: [...baseFields, ...(specificFields[collection] || [])]
        };
    }

    /**
     * Render the form
     * @returns {Promise<string>} HTML string
     */
    async render() {
        // Load existing data if editing
        if (this.isEditing) {
            const result = await this.crudManager.read(this.collection, this.entityId);
            if (result.success) {
                this.formData = result.data;
            }
        }

        const formHTML = `
            <div class="entity-form-container">
                <div class="entity-form-header">
                    <h2>${this.isEditing ? 'Edit' : 'Create'} ${this.capitalizeFirst(this.collection.slice(0, -1))}</h2>
                    <button class="form-close-btn" data-action="cancel">×</button>
                </div>

                <form class="entity-form" id="entityForm">
                    ${this.schema.fields.map(field => this.renderField(field)).join('\n')}

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" data-action="cancel">
                            Cancel
                        </button>
                        <button type="submit" class="btn-primary">
                            ${this.isEditing ? 'Update' : 'Create'} ${this.capitalizeFirst(this.collection.slice(0, -1))}
                        </button>
                    </div>

                    <div class="form-status" id="formStatus"></div>
                </form>
            </div>
        `;

        return formHTML;
    }

    /**
     * Render a single form field
     * @param {Object} field - Field definition
     * @returns {string} HTML string
     */
    renderField(field) {
        const value = this.formData[field.name] || '';
        const error = this.errors[field.name];

        let inputHTML = '';

        switch (field.type) {
            case 'text':
                inputHTML = `
                    <input
                        type="text"
                        id="${field.name}"
                        name="${field.name}"
                        value="${this.escapeHtml(value)}"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}
                        ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                        class="form-input"
                    />
                `;
                break;

            case 'textarea':
                inputHTML = `
                    <textarea
                        id="${field.name}"
                        name="${field.name}"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}
                        rows="${field.rows || 4}"
                        class="form-textarea"
                    >${this.escapeHtml(value)}</textarea>
                `;
                break;

            case 'select':
                const options = field.options.map(opt => {
                    const selected = value === opt ? 'selected' : '';
                    return `<option value="${opt}" ${selected}>${this.capitalizeFirst(opt)}</option>`;
                }).join('\n');

                inputHTML = `
                    <select
                        id="${field.name}"
                        name="${field.name}"
                        ${field.required ? 'required' : ''}
                        class="form-select"
                    >
                        <option value="">Select ${field.label}...</option>
                        ${options}
                    </select>
                `;
                break;

            case 'tags':
                const tags = Array.isArray(value) ? value : [];
                inputHTML = `
                    <div class="form-tags-input" id="${field.name}_container">
                        <div class="tags-list">
                            ${tags.map(tag => `
                                <span class="tag">
                                    ${this.escapeHtml(tag)}
                                    <button type="button" class="tag-remove" data-tag="${this.escapeHtml(tag)}">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input
                            type="text"
                            id="${field.name}_input"
                            placeholder="${field.placeholder || 'Add tag...'}"
                            class="form-input"
                            data-field="${field.name}"
                        />
                    </div>
                `;
                break;
        }

        return `
            <div class="form-field ${error ? 'has-error' : ''}">
                <label for="${field.name}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="required">*</span>' : ''}
                </label>
                ${inputHTML}
                ${field.helpText ? `<p class="form-help-text">${field.helpText}</p>` : ''}
                ${error ? `<p class="form-error">${error}</p>` : ''}
            </div>
        `;
    }

    /**
     * Initialize form after rendering to DOM
     * @param {HTMLElement} container - Container element
     */
    initialize(container) {
        this.container = container;
        this.form = container.querySelector('#entityForm');

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Cancel buttons
        container.querySelectorAll('[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleCancel());
        });

        // Tags input
        this.initializeTagsInputs();

        // Auto-save (draft)
        this.form.addEventListener('input', () => this.scheduleAutoSave());
    }

    /**
     * Initialize tags input fields
     */
    initializeTagsInputs() {
        this.schema.fields
            .filter(field => field.type === 'tags')
            .forEach(field => {
                const input = this.form.querySelector(`#${field.name}_input`);
                if (!input) return;

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addTag(field.name, input.value.trim());
                        input.value = '';
                    }
                });

                const container = this.form.querySelector(`#${field.name}_container`);
                container.addEventListener('click', (e) => {
                    if (e.target.classList.contains('tag-remove')) {
                        this.removeTag(field.name, e.target.dataset.tag);
                    }
                });
            });
    }

    /**
     * Add a tag to a tags field
     * @param {string} fieldName - Field name
     * @param {string} value - Tag value
     */
    addTag(fieldName, value) {
        if (!value) return;

        const container = this.form.querySelector(`#${fieldName}_container .tags-list`);
        const tagHTML = `
            <span class="tag">
                ${this.escapeHtml(value)}
                <button type="button" class="tag-remove" data-tag="${this.escapeHtml(value)}">×</button>
            </span>
        `;

        container.insertAdjacentHTML('beforeend', tagHTML);
    }

    /**
     * Remove a tag from a tags field
     * @param {string} fieldName - Field name
     * @param {string} value - Tag value
     */
    removeTag(fieldName, value) {
        const container = this.form.querySelector(`#${fieldName}_container .tags-list`);
        const tags = container.querySelectorAll('.tag');

        tags.forEach(tag => {
            if (tag.querySelector('.tag-remove').dataset.tag === value) {
                tag.remove();
            }
        });
    }

    /**
     * Get all tags from a tags field
     * @param {string} fieldName - Field name
     * @returns {Array<string>} Tags array
     */
    getTags(fieldName) {
        const container = this.form.querySelector(`#${fieldName}_container .tags-list`);
        if (!container) return [];

        const tags = container.querySelectorAll('.tag');
        return Array.from(tags).map(tag => {
            return tag.querySelector('.tag-remove').dataset.tag;
        });
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const data = {};

        // Collect form data
        this.schema.fields.forEach(field => {
            if (field.type === 'tags') {
                data[field.name] = this.getTags(field.name);
            } else {
                data[field.name] = formData.get(field.name) || '';
            }
        });

        // Show loading state
        this.showStatus('Saving...', 'loading');

        let result;
        if (this.isEditing) {
            result = await this.crudManager.update(this.collection, this.entityId, data);
        } else {
            result = await this.crudManager.create(this.collection, data);
        }

        if (result.success) {
            this.showStatus('Success!', 'success');
            setTimeout(() => {
                // Safely invoke success callback with error handling
                if (typeof this.onSuccess === 'function') {
                    try {
                        this.onSuccess(result);
                    } catch (error) {
                        console.error('[EntityForm] Error in onSuccess callback:', error);
                        // Don't show error to user since save was successful
                        // Just log it for debugging
                    }
                }
            }, 1000);
        } else {
            this.showStatus(`Error: ${result.error}`, 'error');
        }
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            // Safely invoke cancel callback with error handling
            if (typeof this.onCancel === 'function') {
                try {
                    this.onCancel();
                } catch (error) {
                    console.error('[EntityForm] Error in onCancel callback:', error);
                    // Fallback: try to close any open modals
                    const modals = document.querySelectorAll('.modal-overlay');
                    modals.forEach(modal => modal.remove());
                }
            }
        }
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft();
        }, 2000);
    }

    /**
     * Save draft to localStorage
     */
    saveDraft() {
        const formData = new FormData(this.form);
        const data = {};

        this.schema.fields.forEach(field => {
            if (field.type === 'tags') {
                data[field.name] = this.getTags(field.name);
            } else {
                data[field.name] = formData.get(field.name);
            }
        });

        const draftKey = `draft_${this.collection}_${this.entityId || 'new'}`;
        localStorage.setItem(draftKey, JSON.stringify(data));

        console.log('[Form] Draft saved');
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Status type (loading, success, error)
     */
    showStatus(message, type) {
        const statusEl = this.container.querySelector('#formStatus');
        statusEl.textContent = message;
        statusEl.className = `form-status ${type}`;
    }

    /**
     * Utility: Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Utility: Escape HTML
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityForm;
}
