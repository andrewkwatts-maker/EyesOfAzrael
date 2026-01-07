/**
 * Entity Form Component
 * Polished dynamic form builder for creating and editing entities
 * with validation, auto-save, rich input types, and multi-step wizard
 * Fully accessible with ARIA attributes and keyboard navigation
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

        // Validate and sanitize callbacks
        this.onSuccess = typeof options.onSuccess === 'function'
            ? options.onSuccess
            : (() => console.warn('[EntityForm] No onSuccess callback'));

        this.onCancel = typeof options.onCancel === 'function'
            ? options.onCancel
            : (() => console.warn('[EntityForm] No onCancel callback'));

        this.formData = {};
        this.errors = {};
        this.validFields = new Set();
        this.isEditing = !!this.entityId;
        this.autoSaveTimer = null;
        this.currentStep = 0;
        this.uploadedImageUrl = null;
        this.uploadedFile = null;
        this.isDragging = false;
        this.lastAutoSave = null;
        this.hasUnsavedChanges = false;

        // Autocomplete suggestions cache
        this.autocompleteSuggestions = {
            domains: ['Thunder', 'Sky', 'War', 'Love', 'Wisdom', 'Sea', 'Death', 'Fertility', 'Sun', 'Moon', 'Fire', 'Harvest', 'Healing'],
            symbols: ['Lightning bolt', 'Trident', 'Owl', 'Eagle', 'Serpent', 'Staff', 'Sword', 'Shield', 'Crown', 'Scales'],
            abilities: ['Flight', 'Invisibility', 'Super strength', 'Fire breathing', 'Shapeshifting', 'Immortality', 'Telepathy'],
            quests: ['Twelve Labors', 'Golden Fleece', 'Underworld Journey', 'Dragon Slaying', 'Holy Grail'],
            weapons: ['Sword', 'Spear', 'Bow', 'Hammer', 'Axe', 'Staff', 'Shield'],
            powers: ['Invincibility', 'Flight', 'Invisibility', 'Elemental control', 'Curse', 'Blessing'],
            uses: ['Healing', 'Protection', 'Divination', 'Purification', 'Love charm', 'Strength'],
            offerings: ['Incense', 'Wine', 'Flowers', 'Food', 'Blood', 'Candles', 'Gold']
        };

        this.schema = this.getSchema(this.collection);
        this.steps = this.organizeFieldsIntoSteps(this.schema.fields);
    }

    /**
     * Organize fields into multi-step form
     * @param {Array} fields - Form fields
     * @returns {Array} Steps array
     */
    organizeFieldsIntoSteps(fields) {
        // Basic info (always first step)
        const basicFields = ['name', 'mythology', 'type', 'icon'];
        const basicStep = fields.filter(f => basicFields.includes(f.name));

        // Description and image (second step)
        const detailsStep = fields.filter(f => ['description', 'image'].includes(f.name));

        // Collection-specific fields (remaining steps)
        const specificFields = fields.filter(f =>
            !basicFields.includes(f.name) && f.name !== 'description' && f.name !== 'image'
        );

        const steps = [
            { title: 'Basic Information', icon: 'info', fields: basicStep },
            { title: 'Details & Description', icon: 'document', fields: detailsStep }
        ];

        // Only add specific step if there are fields
        if (specificFields.length > 0) {
            steps.push({
                title: 'Additional Information',
                icon: 'sparkles',
                fields: specificFields
            });
        }

        return steps;
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
                helpText: 'The primary name of this entity. Use the most commonly known name.',
                autocomplete: 'off',
                maxLength: 100
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
                helpText: 'The mythological tradition this entity belongs to.'
            },
            {
                name: 'type',
                label: 'Type',
                type: 'text',
                required: true,
                placeholder: 'e.g., deity, hero, creature...',
                helpText: 'The category or classification of this entity.',
                autocomplete: 'off',
                maxLength: 50
            },
            {
                name: 'icon',
                label: 'Icon (Emoji)',
                type: 'text',
                required: false,
                placeholder: 'e.g., thunder',
                maxLength: 4,
                helpText: 'An emoji or short symbol to represent this entity.',
                pattern: /^.{1,4}$/
            },
            {
                name: 'description',
                label: 'Description',
                type: 'richtext',
                required: false,
                placeholder: 'Enter a detailed description of this entity...',
                rows: 8,
                helpText: 'Detailed information about this entity. Supports basic formatting.',
                maxLength: 5000
            },
            {
                name: 'image',
                label: 'Image',
                type: 'image',
                required: false,
                helpText: 'Upload an image to represent this entity. Max 5MB. PNG, JPG, GIF, or WebP.',
                accept: 'image/png,image/jpeg,image/gif,image/webp',
                maxSize: 5 * 1024 * 1024
            }
        ];

        // Collection-specific fields
        const specificFields = {
            deities: [
                {
                    name: 'domains',
                    label: 'Domains',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Areas of influence or power (e.g., Thunder, Sky, War).',
                    suggestions: this.autocompleteSuggestions.domains
                },
                {
                    name: 'symbols',
                    label: 'Symbols',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Sacred symbols and objects associated with this deity.',
                    suggestions: this.autocompleteSuggestions.symbols
                },
                {
                    name: 'family',
                    label: 'Family Relationships',
                    type: 'textarea',
                    rows: 3,
                    placeholder: 'Describe parents, siblings, children, consorts...',
                    helpText: 'Family connections and relationships with other deities.',
                    maxLength: 1000
                }
            ],
            creatures: [
                {
                    name: 'habitat',
                    label: 'Habitat',
                    type: 'text',
                    placeholder: 'Where this creature lives...',
                    helpText: 'Natural habitat or dwelling place of this creature.',
                    maxLength: 200
                },
                {
                    name: 'abilities',
                    label: 'Abilities',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Special powers and capabilities of this creature.',
                    suggestions: this.autocompleteSuggestions.abilities
                }
            ],
            heroes: [
                {
                    name: 'quests',
                    label: 'Quests',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Famous quests and adventures undertaken by this hero.',
                    suggestions: this.autocompleteSuggestions.quests
                },
                {
                    name: 'weapons',
                    label: 'Weapons',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Legendary weapons and tools wielded by this hero.',
                    suggestions: this.autocompleteSuggestions.weapons
                }
            ],
            items: [
                {
                    name: 'powers',
                    label: 'Powers',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Magical powers and properties of this item.',
                    suggestions: this.autocompleteSuggestions.powers
                },
                {
                    name: 'owner',
                    label: 'Owner',
                    type: 'text',
                    placeholder: 'Who owns or wields this item...',
                    helpText: 'The deity, hero, or being associated with this item.',
                    maxLength: 200
                }
            ],
            herbs: [
                {
                    name: 'uses',
                    label: 'Uses',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Medicinal, magical, or ritual uses of this herb.',
                    suggestions: this.autocompleteSuggestions.uses
                },
                {
                    name: 'preparation',
                    label: 'Preparation',
                    type: 'textarea',
                    rows: 3,
                    placeholder: 'How to prepare this herb for use...',
                    helpText: 'Methods of preparation and application.',
                    maxLength: 1000
                }
            ],
            rituals: [
                {
                    name: 'purpose',
                    label: 'Purpose',
                    type: 'text',
                    placeholder: 'Purpose of this ritual...',
                    helpText: 'What this ritual achieves or celebrates.',
                    maxLength: 200
                },
                {
                    name: 'steps',
                    label: 'Steps',
                    type: 'textarea',
                    rows: 5,
                    placeholder: 'Describe the ritual steps in order...',
                    helpText: 'Step-by-step procedure for performing this ritual.',
                    maxLength: 2000
                },
                {
                    name: 'offerings',
                    label: 'Offerings',
                    type: 'tags',
                    placeholder: 'Type and press Enter to add...',
                    helpText: 'Required offerings or materials for this ritual.',
                    suggestions: this.autocompleteSuggestions.offerings
                }
            ]
        };

        return {
            fields: [...baseFields, ...(specificFields[collection] || [])]
        };
    }

    /**
     * Get step icon SVG
     * @param {string} iconName - Icon name
     * @returns {string} SVG string
     */
    getStepIconSVG(iconName) {
        const icons = {
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path d="M10 9v5M10 6v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            document: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 3a1 1 0 011-1h6l5 5v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3z" stroke="currentColor" stroke-width="2"/><path d="M11 2v4a1 1 0 001 1h4" stroke="currentColor" stroke-width="2"/><path d="M7 10h6M7 13h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            sparkles: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 13l.75 2.25L18 16l-2.25.75L15 19l-.75-2.25L12 16l2.25-.75L15 13z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
            check: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
        return icons[iconName] || icons.info;
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
                this.uploadedImageUrl = result.data.imageUrl || null;
            }
        }

        // Check for saved draft
        const draftKey = `draft_${this.collection}_${this.entityId || 'new'}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft && !this.isEditing) {
            try {
                const draftData = JSON.parse(savedDraft);
                this.formData = { ...this.formData, ...draftData };
            } catch (e) {
                console.warn('[EntityForm] Could not parse saved draft');
            }
        }

        const totalSteps = this.steps.length;

        return `
            <div class="entity-form-container" role="document" aria-labelledby="form-title">
                <!-- Form Header -->
                <div class="entity-form-header">
                    <div class="form-title-section">
                        <h2 id="form-title" class="form-title">
                            <span class="form-title-icon" aria-hidden="true">
                                ${this.isEditing ? this.getEditIcon() : this.getCreateIcon()}
                            </span>
                            ${this.isEditing ? 'Edit' : 'Create'} ${this.capitalizeFirst(this.collection.slice(0, -1))}
                        </h2>
                        <div class="form-progress" role="progressbar"
                            aria-valuenow="${this.currentStep + 1}"
                            aria-valuemin="1"
                            aria-valuemax="${totalSteps}"
                            aria-label="Form progress: Step ${this.currentStep + 1} of ${totalSteps}">
                            <div class="progress-bar">
                                ${this.renderProgressSteps()}
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill" style="width: ${((this.currentStep + 1) / totalSteps) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <button
                        class="form-close-btn"
                        data-action="cancel"
                        aria-label="Close form"
                        title="Close (Esc)"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Form Body -->
                <form class="entity-form" id="entityForm" novalidate>
                    <!-- Live region for announcements -->
                    <div id="formAnnouncements" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

                    ${this.steps.map((step, index) => this.renderStep(step, index)).join('\n')}

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <div class="form-actions-left">
                            <button
                                type="button"
                                class="btn btn-ghost"
                                id="prevBtn"
                                ${this.currentStep === 0 ? 'disabled' : ''}
                                aria-label="Go to previous step"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M10 12L6 8l4-4"/>
                                </svg>
                                <span>Previous</span>
                            </button>
                        </div>

                        <div class="form-actions-center">
                            <button
                                type="button"
                                class="btn btn-secondary btn-with-icon"
                                id="saveDraftBtn"
                                aria-label="Save as draft"
                                title="Save draft (Ctrl+S)"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                    <path d="M2 2v12a1 1 0 001 1h10a1 1 0 001-1V5l-4-4H3a1 1 0 00-1 1z"/>
                                    <path d="M10 1v4h4M5 10h6M5 13h3"/>
                                </svg>
                                <span>Save Draft</span>
                            </button>

                            <a href="#" class="btn-link" data-action="cancel">
                                Cancel
                            </a>
                        </div>

                        <div class="form-actions-right">
                            <button
                                type="button"
                                class="btn btn-primary"
                                id="nextBtn"
                                ${this.currentStep === totalSteps - 1 ? 'style="display:none"' : ''}
                                aria-label="Go to next step"
                            >
                                <span>Next</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M6 12l4-4-4-4"/>
                                </svg>
                            </button>

                            <button
                                type="submit"
                                class="btn btn-success btn-with-icon"
                                id="submitBtn"
                                ${this.currentStep !== totalSteps - 1 ? 'style="display:none"' : ''}
                                aria-label="${this.isEditing ? 'Update entity' : 'Submit for review'}"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 8l4 4 8-8"/>
                                </svg>
                                <span>${this.isEditing ? 'Update' : 'Submit for Review'}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Form Status -->
                    <div class="form-status-container" id="formStatusContainer">
                        <div class="form-status" id="formStatus" role="status" aria-live="polite"></div>
                    </div>
                </form>

                <!-- Auto-save Indicator -->
                <div class="autosave-indicator" id="autosaveIndicator" aria-live="polite">
                    <div class="autosave-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <path d="M2 8l4 4 8-8"/>
                        </svg>
                    </div>
                    <span class="autosave-text">Draft saved</span>
                    <span class="autosave-time" id="autosaveTime"></span>
                </div>
            </div>
        `;
    }

    /**
     * Get edit icon SVG
     * @returns {string} SVG string
     */
    getEditIcon() {
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    }

    /**
     * Get create icon SVG
     * @returns {string} SVG string
     */
    getCreateIcon() {
        return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>';
    }

    /**
     * Render progress steps
     * @returns {string} HTML string
     */
    renderProgressSteps() {
        return this.steps.map((step, index) => {
            const isActive = index === this.currentStep;
            const isCompleted = index < this.currentStep;
            const stepNumber = index + 1;

            return `
                <button
                    type="button"
                    class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                    data-step="${index}"
                    aria-current="${isActive ? 'step' : 'false'}"
                    aria-label="Step ${stepNumber}: ${step.title}${isCompleted ? ' (completed)' : ''}"
                    ${!isCompleted && !isActive ? 'disabled' : ''}
                >
                    <div class="step-number">
                        ${isCompleted ? this.getStepIconSVG('check') : stepNumber}
                    </div>
                    <div class="step-content">
                        <span class="step-label">${step.title}</span>
                        <span class="step-status">${isCompleted ? 'Complete' : isActive ? 'In progress' : 'Pending'}</span>
                    </div>
                </button>
            `;
        }).join('<div class="step-connector" aria-hidden="true"></div>');
    }

    /**
     * Render a single step
     * @param {Object} step - Step definition
     * @param {number} index - Step index
     * @returns {string} HTML string
     */
    renderStep(step, index) {
        const isActive = index === this.currentStep;

        return `
            <fieldset
                class="form-step ${isActive ? 'active' : ''}"
                data-step="${index}"
                ${!isActive ? 'aria-hidden="true"' : ''}
                ${!isActive ? 'disabled' : ''}
            >
                <legend class="step-title">
                    <span class="step-icon" aria-hidden="true">${this.getStepIconSVG(step.icon)}</span>
                    <span class="step-title-text">${step.title}</span>
                    <span class="step-count">Step ${index + 1} of ${this.steps.length}</span>
                </legend>

                <div class="step-fields">
                    ${step.fields.map(field => this.renderField(field)).join('\n')}
                </div>
            </fieldset>
        `;
    }

    /**
     * Render a single form field
     * @param {Object} field - Field definition
     * @returns {string} HTML string
     */
    renderField(field) {
        const value = this.formData[field.name] || '';
        const error = this.errors[field.name];
        const isValid = this.validFields.has(field.name);
        const fieldId = `field-${field.name}`;
        const errorId = `error-${field.name}`;
        const helpId = `help-${field.name}`;
        const counterId = `counter-${field.name}`;

        let inputHTML = '';

        switch (field.type) {
            case 'text':
                inputHTML = this.renderTextInput(field, value, fieldId, helpId, errorId, counterId, isValid);
                break;

            case 'textarea':
                inputHTML = this.renderTextarea(field, value, fieldId, helpId, errorId, counterId, isValid);
                break;

            case 'richtext':
                inputHTML = this.renderRichTextEditor(field, value, fieldId, helpId, errorId, counterId);
                break;

            case 'select':
                inputHTML = this.renderSelect(field, value, fieldId, helpId, errorId, isValid);
                break;

            case 'tags':
                inputHTML = this.renderTagsInput(field, value, fieldId, helpId, errorId);
                break;

            case 'image':
                inputHTML = this.renderImageUpload(field, fieldId, helpId);
                break;
        }

        return `
            <div class="form-field ${error ? 'has-error' : ''} ${isValid ? 'is-valid' : ''}" data-field="${field.name}">
                <label for="${fieldId}" class="form-label">
                    <span class="label-text">${field.label}</span>
                    ${field.required ? '<span class="required-indicator" aria-label="required" title="Required field">*</span>' : ''}
                </label>
                ${inputHTML}
                <div class="field-footer">
                    ${field.helpText ? `<p class="form-help-text" id="${helpId}">${field.helpText}</p>` : ''}
                    ${error ? `<p class="form-error" id="${errorId}" role="alert"><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 4v3M7 9v1"/></svg><span>${error}</span></p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render text input
     */
    renderTextInput(field, value, fieldId, helpId, errorId, counterId, isValid) {
        const error = this.errors[field.name];
        const showCounter = field.maxLength && field.maxLength > 0;
        const currentLength = String(value).length;

        return `
            <div class="input-wrapper">
                <input
                    type="text"
                    id="${fieldId}"
                    name="${field.name}"
                    value="${this.escapeHtml(value)}"
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required aria-required="true"' : ''}
                    ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                    ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ''}
                    class="form-input ${error ? 'error' : ''} ${isValid ? 'valid' : ''}"
                    aria-describedby="${[field.helpText ? helpId : '', error ? errorId : '', showCounter ? counterId : ''].filter(Boolean).join(' ')}"
                    aria-invalid="${error ? 'true' : 'false'}"
                />
                ${isValid ? '<span class="input-valid-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg></span>' : ''}
                ${showCounter ? `<span class="char-counter ${currentLength >= field.maxLength * 0.9 ? 'warning' : ''}" id="${counterId}">${currentLength}/${field.maxLength}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render textarea
     */
    renderTextarea(field, value, fieldId, helpId, errorId, counterId, isValid) {
        const error = this.errors[field.name];
        const showCounter = field.maxLength && field.maxLength > 0;
        const currentLength = String(value).length;

        return `
            <div class="textarea-wrapper">
                <textarea
                    id="${fieldId}"
                    name="${field.name}"
                    placeholder="${field.placeholder || ''}"
                    ${field.required ? 'required aria-required="true"' : ''}
                    ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                    rows="${field.rows || 4}"
                    class="form-textarea auto-expand ${error ? 'error' : ''} ${isValid ? 'valid' : ''}"
                    aria-describedby="${[field.helpText ? helpId : '', error ? errorId : '', showCounter ? counterId : ''].filter(Boolean).join(' ')}"
                    aria-invalid="${error ? 'true' : 'false'}"
                    data-max-height="300"
                >${this.escapeHtml(value)}</textarea>
                ${showCounter ? `<span class="char-counter textarea-counter ${currentLength >= field.maxLength * 0.9 ? 'warning' : ''}" id="${counterId}">${currentLength}/${field.maxLength}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render rich text editor
     */
    renderRichTextEditor(field, value, fieldId, helpId, errorId, counterId) {
        const error = this.errors[field.name];
        const showCounter = field.maxLength && field.maxLength > 0;
        const currentLength = this.stripHtml(String(value)).length;

        return `
            <div class="richtext-editor ${error ? 'has-error' : ''}">
                <div class="richtext-toolbar" role="toolbar" aria-label="Text formatting options">
                    <div class="toolbar-group" role="group" aria-label="Text style">
                        <button type="button" class="toolbar-btn" data-command="bold" aria-label="Bold" title="Bold (Ctrl+B)">
                            <strong>B</strong>
                        </button>
                        <button type="button" class="toolbar-btn" data-command="italic" aria-label="Italic" title="Italic (Ctrl+I)">
                            <em>I</em>
                        </button>
                        <button type="button" class="toolbar-btn" data-command="underline" aria-label="Underline" title="Underline (Ctrl+U)">
                            <u>U</u>
                        </button>
                    </div>
                    <span class="toolbar-divider" aria-hidden="true"></span>
                    <div class="toolbar-group" role="group" aria-label="Lists">
                        <button type="button" class="toolbar-btn" data-command="insertUnorderedList" aria-label="Bullet list" title="Bullet list">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="4" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="3" cy="12" r="1.5"/><rect x="6" y="3" width="8" height="2" rx="1"/><rect x="6" y="7" width="8" height="2" rx="1"/><rect x="6" y="11" width="8" height="2" rx="1"/></svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-command="insertOrderedList" aria-label="Numbered list" title="Numbered list">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><text x="1" y="5" font-size="5" font-weight="bold">1</text><text x="1" y="9" font-size="5" font-weight="bold">2</text><text x="1" y="13" font-size="5" font-weight="bold">3</text><rect x="6" y="3" width="8" height="2" rx="1"/><rect x="6" y="7" width="8" height="2" rx="1"/><rect x="6" y="11" width="8" height="2" rx="1"/></svg>
                        </button>
                    </div>
                    <span class="toolbar-divider" aria-hidden="true"></span>
                    <div class="toolbar-group" role="group" aria-label="View options">
                        <button type="button" class="toolbar-btn preview-toggle" data-action="preview" aria-label="Toggle preview" title="Preview (Ctrl+P)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
                        </button>
                    </div>
                </div>
                <div class="richtext-body">
                    <div
                        id="${fieldId}"
                        class="richtext-content ${error ? 'error' : ''}"
                        contenteditable="true"
                        data-field="${field.name}"
                        role="textbox"
                        aria-multiline="true"
                        aria-label="${field.label}"
                        aria-describedby="${[field.helpText ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ')}"
                        aria-invalid="${error ? 'true' : 'false'}"
                        ${field.placeholder ? `data-placeholder="${field.placeholder}"` : ''}
                    >${value}</div>
                    <div class="richtext-preview" id="${fieldId}-preview" aria-hidden="true" style="display: none;"></div>
                </div>
                ${showCounter ? `<div class="richtext-footer"><span class="char-counter ${currentLength >= field.maxLength * 0.9 ? 'warning' : ''}" id="${counterId}">${currentLength}/${field.maxLength}</span></div>` : ''}
            </div>
        `;
    }

    /**
     * Render select input
     */
    renderSelect(field, value, fieldId, helpId, errorId, isValid) {
        const error = this.errors[field.name];
        const options = field.options.map(opt => {
            const selected = value === opt ? 'selected' : '';
            return `<option value="${opt}" ${selected}>${this.capitalizeFirst(opt)}</option>`;
        }).join('\n');

        return `
            <div class="select-wrapper">
                <select
                    id="${fieldId}"
                    name="${field.name}"
                    ${field.required ? 'required aria-required="true"' : ''}
                    class="form-select ${error ? 'error' : ''} ${isValid ? 'valid' : ''}"
                    aria-describedby="${[field.helpText ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ')}"
                    aria-invalid="${error ? 'true' : 'false'}"
                >
                    <option value="">Select ${field.label.toLowerCase()}...</option>
                    ${options}
                </select>
                <span class="select-arrow" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 4.5l3 3 3-3"/></svg>
                </span>
                ${isValid ? '<span class="select-valid-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l3 3 7-7"/></svg></span>' : ''}
            </div>
        `;
    }

    /**
     * Render tags input
     */
    renderTagsInput(field, value, fieldId, helpId, errorId) {
        const tags = Array.isArray(value) ? value : [];
        const suggestionsList = field.suggestions || [];

        return `
            <div class="tags-input-container" id="${field.name}_container" data-field="${field.name}">
                <div class="tags-list" role="list" aria-label="${field.label} tags">
                    ${tags.map((tag, index) => `
                        <span class="tag" role="listitem" data-index="${index}">
                            <span class="tag-text">${this.escapeHtml(tag)}</span>
                            <button
                                type="button"
                                class="tag-remove"
                                data-tag="${this.escapeHtml(tag)}"
                                aria-label="Remove ${this.escapeHtml(tag)}"
                                title="Remove tag"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
                            </button>
                        </span>
                    `).join('')}
                    <input
                        type="text"
                        id="${fieldId}_input"
                        placeholder="${tags.length === 0 ? field.placeholder || 'Type and press Enter...' : 'Add more...'}"
                        class="tag-input"
                        data-field="${field.name}"
                        aria-label="Add ${field.label}"
                        aria-describedby="${helpId}"
                        autocomplete="off"
                        role="combobox"
                        aria-expanded="false"
                        aria-controls="${field.name}_suggestions"
                        aria-autocomplete="list"
                    />
                </div>
                <button type="button" class="tag-add-btn" data-field="${field.name}" aria-label="Add tag" title="Add tag">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>
                    <span>Add</span>
                </button>
                ${suggestionsList.length > 0 ? `
                    <ul class="tag-suggestions" id="${field.name}_suggestions" role="listbox" aria-label="Suggestions" style="display: none;">
                        ${suggestionsList.map((suggestion, i) => `
                            <li class="suggestion-item" role="option" data-value="${this.escapeHtml(suggestion)}" id="${field.name}_suggestion_${i}" tabindex="-1">
                                ${this.escapeHtml(suggestion)}
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}
                <p class="tags-hint">Press Enter or comma to add. Drag to reorder.</p>
            </div>
        `;
    }

    /**
     * Render image upload
     */
    renderImageUpload(field, fieldId, helpId) {
        return `
            <div class="image-upload-container" id="${field.name}_upload_container">
                <input
                    type="file"
                    id="${fieldId}"
                    name="${field.name}"
                    accept="${field.accept || 'image/*'}"
                    class="image-input sr-only"
                    aria-label="Upload image"
                    aria-describedby="${helpId}"
                />

                <div class="upload-dropzone ${this.uploadedImageUrl ? 'has-image' : ''}"
                    id="${field.name}_dropzone"
                    role="button"
                    tabindex="0"
                    aria-label="Drop image here or click to upload"
                >
                    <div class="dropzone-content">
                        <div class="dropzone-icon" aria-hidden="true">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="6" y="6" width="36" height="36" rx="4"/>
                                <circle cx="17" cy="17" r="4"/>
                                <path d="M42 30l-10-10-18 18"/>
                            </svg>
                        </div>
                        <div class="dropzone-text">
                            <span class="dropzone-primary">Drag and drop an image</span>
                            <span class="dropzone-secondary">or <span class="dropzone-link">browse files</span></span>
                        </div>
                        <div class="dropzone-requirements">
                            PNG, JPG, GIF, WebP up to 5MB
                        </div>
                    </div>

                    <div class="dropzone-drag-overlay" aria-hidden="true">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 6v20M6 16h20"/></svg>
                        <span>Drop to upload</span>
                    </div>
                </div>

                <div class="image-preview ${this.uploadedImageUrl ? 'visible' : ''}" id="${field.name}_preview">
                    ${this.uploadedImageUrl ? `
                        <img src="${this.uploadedImageUrl}" alt="Preview of uploaded image" />
                        <div class="preview-overlay">
                            <button type="button" class="preview-btn preview-change" aria-label="Change image" title="Change image">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1l3 3-9 9H3v-3L12 1z"/></svg>
                            </button>
                            <button type="button" class="preview-btn preview-remove" aria-label="Remove image" title="Remove image">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
                            </button>
                        </div>
                        <div class="preview-info">
                            <span class="preview-filename">${this.uploadedFile?.name || 'Uploaded image'}</span>
                            <span class="preview-size">${this.formatFileSize(this.uploadedFile?.size)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="upload-progress" id="${field.name}_progress" style="display: none;">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" id="${field.name}_progress_fill"></div>
                    </div>
                    <span class="progress-text">Uploading...</span>
                </div>

                <div class="upload-error" id="${field.name}_error" role="alert" style="display: none;"></div>
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

        if (!this.form) {
            console.error('[EntityForm] Form element not found');
            return;
        }

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Cancel buttons/links
        container.querySelectorAll('[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCancel();
            });
        });

        // Save draft button
        const saveDraftBtn = container.querySelector('#saveDraftBtn');
        saveDraftBtn?.addEventListener('click', () => this.saveDraft(true));

        // Step navigation
        this.initializeStepNavigation();

        // Progress step clicks
        this.initializeProgressStepClicks();

        // Rich text editors
        this.initializeRichTextEditors();

        // Tags input
        this.initializeTagsInputs();

        // Image upload
        this.initializeImageUpload();

        // Auto-expanding textareas
        this.initializeAutoExpand();

        // Character counters
        this.initializeCharCounters();

        // Auto-save (draft)
        this.form.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
            this.scheduleAutoSave();
        });

        // Validation on blur
        this.form.addEventListener('blur', (e) => {
            if (e.target.matches('.form-input, .form-textarea, .form-select, .richtext-content')) {
                this.validateField(e.target);
            }
        }, true);

        // Keyboard shortcuts
        this.initializeKeyboardShortcuts();

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Focus first input
        this.focusFirstInput();
    }

    /**
     * Initialize step navigation
     */
    initializeStepNavigation() {
        const prevBtn = this.form.querySelector('#prevBtn');
        const nextBtn = this.form.querySelector('#nextBtn');

        prevBtn?.addEventListener('click', () => this.previousStep());
        nextBtn?.addEventListener('click', () => this.nextStep());

        // Update buttons
        this.updateStepButtons();
    }

    /**
     * Initialize progress step clicks
     */
    initializeProgressStepClicks() {
        const progressSteps = this.container.querySelectorAll('.progress-step');
        progressSteps.forEach(step => {
            step.addEventListener('click', () => {
                const stepIndex = parseInt(step.dataset.step, 10);
                if (!isNaN(stepIndex) && stepIndex <= this.currentStep) {
                    this.goToStep(stepIndex);
                }
            });
        });
    }

    /**
     * Go to a specific step
     * @param {number} stepIndex - Step index
     */
    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.showCurrentStep();
            this.updateStepButtons();
            this.updateProgress();
            this.focusFirstInput();
            this.announceToScreenReader(`Now on step ${stepIndex + 1}: ${this.steps[stepIndex].title}`);
        }
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            // Validate current step
            if (!this.validateCurrentStep()) {
                this.scrollToFirstError();
                return;
            }

            this.currentStep++;
            this.showCurrentStep();
            this.updateStepButtons();
            this.updateProgress();

            // Focus first input in new step
            this.focusFirstInput();

            // Announce step change
            this.announceToScreenReader(`Step ${this.currentStep + 1}: ${this.steps[this.currentStep].title}`);
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
            this.updateStepButtons();
            this.updateProgress();

            // Focus first input in new step
            this.focusFirstInput();

            // Announce step change
            this.announceToScreenReader(`Step ${this.currentStep + 1}: ${this.steps[this.currentStep].title}`);
        }
    }

    /**
     * Show current step
     */
    showCurrentStep() {
        const steps = this.form.querySelectorAll('.form-step');
        steps.forEach((step, index) => {
            if (index === this.currentStep) {
                step.classList.add('active');
                step.removeAttribute('aria-hidden');
                step.removeAttribute('disabled');
            } else {
                step.classList.remove('active');
                step.setAttribute('aria-hidden', 'true');
                step.setAttribute('disabled', 'true');
            }
        });
    }

    /**
     * Update step buttons
     */
    updateStepButtons() {
        const prevBtn = this.form.querySelector('#prevBtn');
        const nextBtn = this.form.querySelector('#nextBtn');
        const submitBtn = this.form.querySelector('#submitBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
        }

        if (nextBtn && submitBtn) {
            if (this.currentStep === this.steps.length - 1) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
            } else {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            }
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progressBar = this.container.querySelector('.form-progress');
        if (progressBar) {
            progressBar.setAttribute('aria-valuenow', this.currentStep + 1);
        }

        // Update progress fill
        const progressFill = this.container.querySelector('.progress-fill');
        if (progressFill) {
            const percentage = ((this.currentStep + 1) / this.steps.length) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        // Update progress steps
        const progressSteps = this.container.querySelectorAll('.progress-step');
        progressSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            step.removeAttribute('aria-current');

            if (index === this.currentStep) {
                step.classList.add('active');
                step.setAttribute('aria-current', 'step');
                step.removeAttribute('disabled');
            } else if (index < this.currentStep) {
                step.classList.add('completed');
                step.removeAttribute('disabled');
            } else {
                step.setAttribute('disabled', 'true');
            }

            // Update step number/icon
            const stepNumber = step.querySelector('.step-number');
            if (stepNumber) {
                stepNumber.innerHTML = index < this.currentStep ? this.getStepIconSVG('check') : String(index + 1);
            }

            // Update step status
            const stepStatus = step.querySelector('.step-status');
            if (stepStatus) {
                stepStatus.textContent = index < this.currentStep ? 'Complete' :
                                        index === this.currentStep ? 'In progress' : 'Pending';
            }
        });
    }

    /**
     * Focus first input in current step
     */
    focusFirstInput() {
        requestAnimationFrame(() => {
            const currentStepEl = this.form.querySelector(`.form-step[data-step="${this.currentStep}"]`);
            const firstInput = currentStepEl?.querySelector('input:not([type="file"]):not([type="hidden"]), textarea, select, [contenteditable="true"]');
            firstInput?.focus();
        });
    }

    /**
     * Scroll to first error
     */
    scrollToFirstError() {
        const firstError = this.form.querySelector('.form-field.has-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = firstError.querySelector('.form-input, .form-textarea, .form-select, .richtext-content');
            input?.focus();
        }
    }

    /**
     * Validate current step
     * @returns {boolean} Is valid
     */
    validateCurrentStep() {
        const currentStep = this.steps[this.currentStep];
        let isValid = true;
        let firstErrorField = null;

        currentStep.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`) ||
                         this.form.querySelector(`[data-field="${field.name}"]`);
            if (input && !this.validateField(input)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = input;
                }
            }
        });

        if (!isValid && firstErrorField) {
            this.announceToScreenReader('Please correct the errors before continuing');
        }

        return isValid;
    }

    /**
     * Validate a single field
     * @param {HTMLElement} input - Input element
     * @returns {boolean} Is valid
     */
    validateField(input) {
        const fieldName = input.name || input.dataset.field;
        const field = this.schema.fields.find(f => f.name === fieldName);

        if (!field) return true;

        let error = null;
        let value = input.value || input.textContent || '';

        // Trim for validation
        if (typeof value === 'string') {
            value = value.trim();
        }

        // Required validation
        if (field.required && (!value || value === '')) {
            error = `${field.label} is required`;
        }

        // Pattern validation
        if (!error && field.pattern && value) {
            if (!field.pattern.test(value)) {
                error = `${field.label} format is invalid`;
            }
        }

        // Max length validation (for rich text)
        if (!error && field.maxLength && field.type === 'richtext') {
            const plainText = this.stripHtml(value);
            if (plainText.length > field.maxLength) {
                error = `${field.label} exceeds maximum length of ${field.maxLength} characters`;
            }
        }

        if (error) {
            this.errors[fieldName] = error;
            this.validFields.delete(fieldName);
            this.showFieldError(fieldName, error);
            return false;
        } else {
            delete this.errors[fieldName];
            if (value) {
                this.validFields.add(fieldName);
            }
            this.clearFieldError(fieldName);
            this.showFieldValid(fieldName);
            return true;
        }
    }

    /**
     * Show field error
     * @param {string} fieldName - Field name
     * @param {string} error - Error message
     */
    showFieldError(fieldName, error) {
        const fieldEl = this.form.querySelector(`.form-field[data-field="${fieldName}"]`);
        if (!fieldEl) return;

        fieldEl.classList.add('has-error');
        fieldEl.classList.remove('is-valid');

        let errorEl = fieldEl.querySelector('.form-error');
        if (!errorEl) {
            const footer = fieldEl.querySelector('.field-footer');
            errorEl = document.createElement('p');
            errorEl.className = 'form-error';
            errorEl.id = `error-${fieldName}`;
            errorEl.setAttribute('role', 'alert');
            errorEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 4v3M7 9v1"/></svg><span></span>`;
            footer?.appendChild(errorEl);
        }

        const errorSpan = errorEl.querySelector('span');
        if (errorSpan) {
            errorSpan.textContent = error;
        }

        const input = fieldEl.querySelector('.form-input, .form-textarea, .form-select, .richtext-content');
        if (input) {
            input.classList.add('error');
            input.classList.remove('valid');
            input.setAttribute('aria-invalid', 'true');

            // Update aria-describedby
            const currentDesc = input.getAttribute('aria-describedby') || '';
            if (!currentDesc.includes(`error-${fieldName}`)) {
                input.setAttribute('aria-describedby', `${currentDesc} error-${fieldName}`.trim());
            }
        }
    }

    /**
     * Show field as valid
     * @param {string} fieldName - Field name
     */
    showFieldValid(fieldName) {
        const fieldEl = this.form.querySelector(`.form-field[data-field="${fieldName}"]`);
        if (!fieldEl) return;

        const input = fieldEl.querySelector('.form-input, .form-textarea, .form-select');
        if (input && this.validFields.has(fieldName)) {
            fieldEl.classList.add('is-valid');
            input.classList.add('valid');
        }
    }

    /**
     * Clear field error
     * @param {string} fieldName - Field name
     */
    clearFieldError(fieldName) {
        const fieldEl = this.form.querySelector(`.form-field[data-field="${fieldName}"]`);
        if (!fieldEl) return;

        fieldEl.classList.remove('has-error');

        const errorEl = fieldEl.querySelector('.form-error');
        if (errorEl) {
            errorEl.remove();
        }

        const input = fieldEl.querySelector('.form-input, .form-textarea, .form-select, .richtext-content');
        if (input) {
            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');

            // Clean aria-describedby
            const currentDesc = input.getAttribute('aria-describedby') || '';
            input.setAttribute('aria-describedby', currentDesc.replace(`error-${fieldName}`, '').trim());
        }
    }

    /**
     * Initialize rich text editors
     */
    initializeRichTextEditors() {
        const editors = this.form.querySelectorAll('.richtext-content');

        editors.forEach(editor => {
            const fieldName = editor.dataset.field;
            const field = this.schema.fields.find(f => f.name === fieldName);

            // Set initial content
            if (this.formData[fieldName]) {
                editor.innerHTML = this.formData[fieldName];
            }

            // Show/hide placeholder
            const updatePlaceholder = () => {
                if (editor.textContent.trim() === '') {
                    editor.classList.add('empty');
                } else {
                    editor.classList.remove('empty');
                }

                // Update character count
                if (field?.maxLength) {
                    const counter = this.form.querySelector(`#counter-${fieldName}`);
                    if (counter) {
                        const currentLength = this.stripHtml(editor.innerHTML).length;
                        counter.textContent = `${currentLength}/${field.maxLength}`;
                        counter.classList.toggle('warning', currentLength >= field.maxLength * 0.9);
                        counter.classList.toggle('danger', currentLength >= field.maxLength);
                    }
                }
            };

            editor.addEventListener('input', updatePlaceholder);
            editor.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
            });
            updatePlaceholder();

            // Toolbar buttons
            const editorContainer = editor.closest('.richtext-editor');
            const toolbar = editorContainer?.querySelector('.richtext-toolbar');
            if (toolbar) {
                toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();

                        if (btn.dataset.action === 'preview') {
                            this.togglePreview(editor, editorContainer);
                            return;
                        }

                        const command = btn.dataset.command;
                        document.execCommand(command, false, null);
                        editor.focus();
                        btn.classList.toggle('active', document.queryCommandState(command));
                    });
                });
            }
        });
    }

    /**
     * Toggle preview mode for rich text editor
     */
    togglePreview(editor, container) {
        const preview = container.querySelector('.richtext-preview');
        const previewBtn = container.querySelector('.preview-toggle');

        if (!preview) return;

        const isPreviewMode = preview.style.display !== 'none';

        if (isPreviewMode) {
            preview.style.display = 'none';
            editor.style.display = 'block';
            previewBtn?.classList.remove('active');
            editor.focus();
        } else {
            preview.innerHTML = editor.innerHTML || '<p class="preview-empty">Nothing to preview yet...</p>';
            preview.style.display = 'block';
            editor.style.display = 'none';
            previewBtn?.classList.add('active');
        }
    }

    /**
     * Initialize tags inputs
     */
    initializeTagsInputs() {
        this.schema.fields
            .filter(field => field.type === 'tags')
            .forEach(field => {
                const container = this.form.querySelector(`#${field.name}_container`);
                if (!container) return;

                const input = container.querySelector('.tag-input');
                const addBtn = container.querySelector('.tag-add-btn');
                const suggestionsList = container.querySelector('.tag-suggestions');

                // Initialize Sortable for drag and drop
                this.initializeTagsSortable(container, field.name);

                // Input events
                if (input) {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            this.addTagFromInput(field.name, input);
                        } else if (e.key === 'Backspace' && input.value === '') {
                            // Remove last tag on backspace in empty input
                            const tags = container.querySelectorAll('.tag');
                            if (tags.length > 0) {
                                const lastTag = tags[tags.length - 1];
                                const tagValue = lastTag.querySelector('.tag-remove').dataset.tag;
                                this.removeTag(field.name, tagValue);
                            }
                        } else if (e.key === 'ArrowDown' && suggestionsList) {
                            e.preventDefault();
                            this.showSuggestions(field.name, input.value);
                            const firstSuggestion = suggestionsList.querySelector('.suggestion-item');
                            firstSuggestion?.focus();
                        }
                    });

                    input.addEventListener('input', () => {
                        if (suggestionsList) {
                            this.filterSuggestions(field.name, input.value);
                        }
                    });

                    input.addEventListener('focus', () => {
                        if (suggestionsList && input.value) {
                            this.showSuggestions(field.name, input.value);
                        }
                    });

                    input.addEventListener('blur', () => {
                        // Delay hiding suggestions to allow click
                        setTimeout(() => {
                            if (suggestionsList) {
                                suggestionsList.style.display = 'none';
                                input.setAttribute('aria-expanded', 'false');
                            }
                        }, 200);
                    });
                }

                // Add button
                addBtn?.addEventListener('click', () => {
                    this.addTagFromInput(field.name, input);
                });

                // Remove tag buttons
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.tag-remove')) {
                        const btn = e.target.closest('.tag-remove');
                        this.removeTag(field.name, btn.dataset.tag);
                    }
                });

                // Suggestions
                if (suggestionsList) {
                    suggestionsList.addEventListener('click', (e) => {
                        const item = e.target.closest('.suggestion-item');
                        if (item) {
                            this.addTag(field.name, item.dataset.value);
                            input.value = '';
                            input.focus();
                            suggestionsList.style.display = 'none';
                        }
                    });

                    suggestionsList.addEventListener('keydown', (e) => {
                        const items = Array.from(suggestionsList.querySelectorAll('.suggestion-item'));
                        const currentIndex = items.indexOf(document.activeElement);

                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const nextItem = items[currentIndex + 1] || items[0];
                            nextItem?.focus();
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (currentIndex === 0) {
                                input.focus();
                            } else {
                                items[currentIndex - 1]?.focus();
                            }
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const item = items[currentIndex];
                            if (item) {
                                this.addTag(field.name, item.dataset.value);
                                input.value = '';
                                input.focus();
                                suggestionsList.style.display = 'none';
                            }
                        } else if (e.key === 'Escape') {
                            suggestionsList.style.display = 'none';
                            input.focus();
                        }
                    });
                }
            });
    }

    /**
     * Initialize drag and drop for tags
     */
    initializeTagsSortable(container, fieldName) {
        const tagsList = container.querySelector('.tags-list');
        if (!tagsList) return;

        let draggedItem = null;

        tagsList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('tag')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        tagsList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('tag')) {
                e.target.classList.remove('dragging');
                draggedItem = null;
            }
        });

        tagsList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(tagsList, e.clientX);
            if (draggedItem) {
                if (afterElement) {
                    tagsList.insertBefore(draggedItem, afterElement);
                } else {
                    const input = tagsList.querySelector('.tag-input');
                    tagsList.insertBefore(draggedItem, input);
                }
            }
        });

        // Make tags draggable
        container.querySelectorAll('.tag').forEach(tag => {
            tag.setAttribute('draggable', 'true');
        });
    }

    /**
     * Get element to insert dragged item after
     */
    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.tag:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Show suggestions for tags
     */
    showSuggestions(fieldName, value) {
        const container = this.form.querySelector(`#${fieldName}_container`);
        const suggestionsList = container?.querySelector('.tag-suggestions');
        const input = container?.querySelector('.tag-input');

        if (!suggestionsList) return;

        this.filterSuggestions(fieldName, value);
        suggestionsList.style.display = 'block';
        input?.setAttribute('aria-expanded', 'true');
    }

    /**
     * Filter suggestions based on input
     */
    filterSuggestions(fieldName, value) {
        const container = this.form.querySelector(`#${fieldName}_container`);
        const suggestionsList = container?.querySelector('.tag-suggestions');

        if (!suggestionsList) return;

        const existingTags = this.getTags(fieldName).map(t => t.toLowerCase());
        const items = suggestionsList.querySelectorAll('.suggestion-item');
        let hasVisible = false;

        items.forEach(item => {
            const itemValue = item.dataset.value.toLowerCase();
            const matches = itemValue.includes(value.toLowerCase());
            const alreadyAdded = existingTags.includes(itemValue);

            if (matches && !alreadyAdded) {
                item.style.display = '';
                hasVisible = true;
            } else {
                item.style.display = 'none';
            }
        });

        suggestionsList.style.display = hasVisible ? 'block' : 'none';
    }

    /**
     * Add tag from input
     */
    addTagFromInput(fieldName, input) {
        if (!input) return;
        const value = input.value.trim().replace(/,/g, '');
        if (value) {
            this.addTag(fieldName, value);
            input.value = '';
            input.placeholder = 'Add more...';
        }
    }

    /**
     * Add a tag to a tags field
     * @param {string} fieldName - Field name
     * @param {string} value - Tag value
     */
    addTag(fieldName, value) {
        if (!value) return;

        // Check for duplicates
        const existingTags = this.getTags(fieldName);
        if (existingTags.some(t => t.toLowerCase() === value.toLowerCase())) {
            this.announceToScreenReader(`Tag "${value}" already exists`);
            // Shake the duplicate tag to indicate it exists
            const existingTag = Array.from(this.form.querySelectorAll(`#${fieldName}_container .tag`))
                .find(tag => tag.querySelector('.tag-remove')?.dataset.tag?.toLowerCase() === value.toLowerCase());
            if (existingTag) {
                existingTag.classList.add('shake');
                setTimeout(() => existingTag.classList.remove('shake'), 500);
            }
            return;
        }

        const container = this.form.querySelector(`#${fieldName}_container .tags-list`);
        const input = container?.querySelector('.tag-input');

        const tagHTML = document.createElement('span');
        tagHTML.className = 'tag just-added';
        tagHTML.setAttribute('role', 'listitem');
        tagHTML.setAttribute('draggable', 'true');
        tagHTML.innerHTML = `
            <span class="tag-text">${this.escapeHtml(value)}</span>
            <button
                type="button"
                class="tag-remove"
                data-tag="${this.escapeHtml(value)}"
                aria-label="Remove ${this.escapeHtml(value)}"
                title="Remove tag"
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
            </button>
        `;

        container.insertBefore(tagHTML, input);
        this.hasUnsavedChanges = true;

        // Remove just-added class after animation
        setTimeout(() => tagHTML.classList.remove('just-added'), 500);

        // Add drag events
        tagHTML.addEventListener('dragstart', (e) => {
            tagHTML.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        tagHTML.addEventListener('dragend', () => {
            tagHTML.classList.remove('dragging');
        });

        // Announce to screen readers
        this.announceToScreenReader(`Added tag: ${value}`);
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
            const removeBtn = tag.querySelector('.tag-remove');
            if (removeBtn?.dataset.tag === value) {
                tag.classList.add('removing');
                setTimeout(() => {
                    tag.remove();
                    this.announceToScreenReader(`Removed tag: ${value}`);

                    // Update placeholder if no tags
                    const remainingTags = container.querySelectorAll('.tag');
                    const input = container.querySelector('.tag-input');
                    if (remainingTags.length === 0 && input) {
                        const field = this.schema.fields.find(f => f.name === fieldName);
                        input.placeholder = field?.placeholder || 'Type and press Enter...';
                    }
                }, 200);
            }
        });

        this.hasUnsavedChanges = true;
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
            return tag.querySelector('.tag-remove')?.dataset.tag || '';
        }).filter(Boolean);
    }

    /**
     * Initialize image upload
     */
    initializeImageUpload() {
        const imageFields = this.schema.fields.filter(f => f.type === 'image');

        imageFields.forEach(field => {
            const container = this.form.querySelector(`#${field.name}_upload_container`);
            const input = this.form.querySelector(`#field-${field.name}`);
            const dropzone = container?.querySelector('.upload-dropzone');
            const preview = container?.querySelector('.image-preview');

            if (!input || !dropzone) return;

            // Click on dropzone to trigger file input with ripple effect
            dropzone.addEventListener('click', (e) => {
                // Add ripple effect
                this.createRippleEffect(dropzone, e);
                input.click();
            });
            dropzone.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Add ripple effect from center
                    this.createRippleEffect(dropzone, {
                        clientX: dropzone.getBoundingClientRect().left + dropzone.offsetWidth / 2,
                        clientY: dropzone.getBoundingClientRect().top + dropzone.offsetHeight / 2
                    });
                    input.click();
                }
            });

            // File input change
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleImageFile(field, file, container);
            });

            // Drag and drop
            dropzone.addEventListener('dragenter', (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });

            dropzone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                if (!dropzone.contains(e.relatedTarget)) {
                    dropzone.classList.remove('drag-over');
                }
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');

                const file = e.dataTransfer.files[0];
                if (file) this.handleImageFile(field, file, container);
            });

            // Preview buttons (if image already exists)
            if (preview) {
                preview.addEventListener('click', (e) => {
                    if (e.target.closest('.preview-change')) {
                        input.click();
                    } else if (e.target.closest('.preview-remove')) {
                        this.removeImage(field, container);
                    }
                });
            }
        });
    }

    /**
     * Handle image file selection
     */
    handleImageFile(field, file, container) {
        const errorEl = container.querySelector(`#${field.name}_error`);
        const preview = container.querySelector('.image-preview');
        const dropzone = container.querySelector('.upload-dropzone');

        // Reset error
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        // Validate file type
        const validTypes = (field.accept || 'image/*').split(',').map(t => t.trim());
        const isValidType = validTypes.some(type => {
            if (type === 'image/*') return file.type.startsWith('image/');
            return file.type === type || `.${file.name.split('.').pop()}` === type;
        });

        if (!isValidType) {
            this.showUploadError(field.name, 'Invalid file type. Please upload a PNG, JPG, GIF, or WebP image.');
            return;
        }

        // Validate file size
        const maxSize = field.maxSize || 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showUploadError(field.name, `File too large. Maximum size is ${this.formatFileSize(maxSize)}.`);
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImageUrl = e.target.result;
            this.uploadedFile = file;

            if (preview) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview of uploaded image" />
                    <div class="preview-overlay">
                        <button type="button" class="preview-btn preview-change" aria-label="Change image" title="Change image">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1l3 3-9 9H3v-3L12 1z"/></svg>
                        </button>
                        <button type="button" class="preview-btn preview-remove" aria-label="Remove image" title="Remove image">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
                        </button>
                    </div>
                    <div class="preview-info">
                        <span class="preview-filename">${this.escapeHtml(file.name)}</span>
                        <span class="preview-size">${this.formatFileSize(file.size)}</span>
                    </div>
                `;
                preview.classList.add('visible');

                // Re-attach event listeners
                preview.querySelector('.preview-change')?.addEventListener('click', () => {
                    this.form.querySelector(`#field-${field.name}`)?.click();
                });
                preview.querySelector('.preview-remove')?.addEventListener('click', () => {
                    this.removeImage(field, container);
                });
            }

            if (dropzone) {
                dropzone.classList.add('has-image');
            }

            this.hasUnsavedChanges = true;
            this.announceToScreenReader(`Image uploaded: ${file.name}`);
        };

        reader.readAsDataURL(file);
    }

    /**
     * Remove uploaded image
     */
    removeImage(field, container) {
        this.uploadedImageUrl = null;
        this.uploadedFile = null;

        const preview = container.querySelector('.image-preview');
        const dropzone = container.querySelector('.upload-dropzone');
        const input = this.form.querySelector(`#field-${field.name}`);

        if (preview) {
            preview.innerHTML = '';
            preview.classList.remove('visible');
        }

        if (dropzone) {
            dropzone.classList.remove('has-image');
        }

        if (input) {
            input.value = '';
        }

        this.hasUnsavedChanges = true;
        this.announceToScreenReader('Image removed');
    }

    /**
     * Show upload error
     */
    showUploadError(fieldName, message) {
        const errorEl = this.form.querySelector(`#${fieldName}_error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'flex';
        }
        this.announceToScreenReader(message);
    }

    /**
     * Initialize auto-expanding textareas
     */
    initializeAutoExpand() {
        const textareas = this.form.querySelectorAll('.auto-expand');

        textareas.forEach(textarea => {
            const maxHeight = parseInt(textarea.dataset.maxHeight) || 300;

            const resize = () => {
                textarea.style.height = 'auto';
                const newHeight = Math.min(textarea.scrollHeight, maxHeight);
                textarea.style.height = `${newHeight}px`;
                textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
            };

            textarea.addEventListener('input', resize);
            textarea.addEventListener('focus', resize);

            // Initial resize
            resize();
        });
    }

    /**
     * Initialize character counters
     */
    initializeCharCounters() {
        const inputs = this.form.querySelectorAll('[maxlength]');

        inputs.forEach(input => {
            const fieldName = input.name || input.dataset.field;
            const counter = this.form.querySelector(`#counter-${fieldName}`);

            if (counter) {
                const maxLength = parseInt(input.getAttribute('maxlength'));

                const updateCounter = () => {
                    const currentLength = input.value.length;
                    counter.textContent = `${currentLength}/${maxLength}`;
                    counter.classList.toggle('warning', currentLength >= maxLength * 0.9);
                    counter.classList.toggle('danger', currentLength >= maxLength);
                };

                input.addEventListener('input', updateCounter);
                updateCounter();
            }
        });
    }

    /**
     * Initialize keyboard shortcuts
     */
    initializeKeyboardShortcuts() {
        this.form.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (this.currentStep === this.steps.length - 1) {
                    e.preventDefault();
                    this.form.requestSubmit();
                } else {
                    // Move to next step if not on last step
                    e.preventDefault();
                    this.nextStep();
                }
            }

            // Ctrl/Cmd + S to save draft
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveDraft(true);
            }

            // Esc to cancel
            if (e.key === 'Escape') {
                // Close any open dropdowns first
                const openDropdowns = this.form.querySelectorAll('.tag-suggestions[style*="display: block"]');
                if (openDropdowns.length > 0) {
                    openDropdowns.forEach(d => d.style.display = 'none');
                    return;
                }
                this.handleCancel();
            }

            // Ctrl/Cmd + P for preview (in rich text)
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                const editor = e.target.closest('.richtext-editor');
                if (editor) {
                    e.preventDefault();
                    const content = editor.querySelector('.richtext-content');
                    this.togglePreview(content, editor);
                }
            }

            // Alt + Left/Right for step navigation
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousStep();
            }
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextStep();
            }

            // Tab navigation improvements
            if (e.key === 'Tab' && !e.shiftKey) {
                this.handleTabNavigation(e);
            }
        });

        // Initialize field-level keyboard shortcuts
        this.initializeFieldKeyboardShortcuts();
    }

    /**
     * Initialize field-level keyboard shortcuts
     */
    initializeFieldKeyboardShortcuts() {
        // Handle Enter key on text inputs to move to next field
        const textInputs = this.form.querySelectorAll('.form-input:not([type="file"])');
        textInputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    // Find next focusable element
                    const focusableElements = this.getFocusableElements();
                    const currentIndex = focusableElements.indexOf(e.target);
                    if (currentIndex < focusableElements.length - 1) {
                        focusableElements[currentIndex + 1].focus();
                    }
                }
            });
        });
    }

    /**
     * Handle tab navigation within form
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleTabNavigation(e) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);

        // If on last element in current step, check if we should go to next step
        if (currentIndex === focusableElements.length - 1) {
            // Check if there are more steps
            if (this.currentStep < this.steps.length - 1) {
                // Validate current step before moving
                if (this.validateCurrentStep()) {
                    e.preventDefault();
                    this.nextStep();
                }
            }
        }
    }

    /**
     * Get all focusable elements in current step
     * @returns {Array<HTMLElement>} Focusable elements
     */
    getFocusableElements() {
        const currentStepEl = this.form.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (!currentStepEl) return [];

        const selector = [
            'input:not([type="hidden"]):not([type="file"]):not([disabled])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            '[contenteditable="true"]',
            'button:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        return Array.from(currentStepEl.querySelectorAll(selector))
            .filter(el => el.offsetParent !== null); // Only visible elements
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Validate all steps
        let allValid = true;
        const originalStep = this.currentStep;

        for (let i = 0; i < this.steps.length; i++) {
            this.currentStep = i;
            if (!this.validateCurrentStep()) {
                allValid = false;
                this.showCurrentStep();
                this.updateStepButtons();
                this.updateProgress();
                this.scrollToFirstError();
                break;
            }
        }

        if (!allValid) {
            this.showStatus('Please fix the errors before submitting', 'error');
            return;
        }

        // Restore step if all valid
        this.currentStep = originalStep;
        this.showCurrentStep();
        this.updateStepButtons();
        this.updateProgress();

        const data = this.collectFormData();

        // Show loading state
        this.showStatus('Saving...', 'loading');
        this.setFormDisabled(true);

        let result;
        try {
            if (this.isEditing) {
                result = await this.crudManager.update(this.collection, this.entityId, data);
            } else {
                result = await this.crudManager.create(this.collection, data);
            }

            if (result.success) {
                this.hasUnsavedChanges = false;

                // Clear draft
                const draftKey = `draft_${this.collection}_${this.entityId || 'new'}`;
                localStorage.removeItem(draftKey);

                this.showStatus(this.isEditing ? 'Updated successfully!' : 'Submitted for review!', 'success');

                setTimeout(() => {
                    if (typeof this.onSuccess === 'function') {
                        try {
                            this.onSuccess(result);
                        } catch (error) {
                            console.error('[EntityForm] Error in onSuccess callback:', error);
                        }
                    }
                }, 1500);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            this.setFormDisabled(false);
        }
    }

    /**
     * Set form disabled state
     */
    setFormDisabled(disabled) {
        const buttons = this.form.querySelectorAll('button, input, textarea, select, [contenteditable="true"]');
        buttons.forEach(el => {
            if (disabled) {
                el.setAttribute('disabled', 'true');
                if (el.getAttribute('contenteditable')) {
                    el.setAttribute('contenteditable', 'false');
                }
            } else {
                el.removeAttribute('disabled');
                if (el.dataset.field && el.classList.contains('richtext-content')) {
                    el.setAttribute('contenteditable', 'true');
                }
            }
        });
    }

    /**
     * Collect form data
     * @returns {Object} Form data
     */
    collectFormData() {
        const data = {};

        this.schema.fields.forEach(field => {
            if (field.type === 'tags') {
                data[field.name] = this.getTags(field.name);
            } else if (field.type === 'richtext') {
                const editor = this.form.querySelector(`[data-field="${field.name}"]`);
                data[field.name] = editor?.innerHTML || '';
            } else if (field.type === 'image') {
                if (this.uploadedImageUrl) {
                    data.imageUrl = this.uploadedImageUrl;
                }
            } else {
                const input = this.form.querySelector(`[name="${field.name}"]`);
                data[field.name] = input?.value?.trim() || '';
            }
        });

        // Add metadata
        data.updatedAt = new Date().toISOString();
        if (!this.isEditing) {
            data.createdAt = new Date().toISOString();
            data.status = 'pending_review';
        }

        return data;
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                return;
            }
        }

        if (typeof this.onCancel === 'function') {
            try {
                this.onCancel();
            } catch (error) {
                console.error('[EntityForm] Error in onCancel callback:', error);
            }
        }
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft(false);
        }, 3000);
    }

    /**
     * Save draft to localStorage
     * @param {boolean} showIndicator - Show indicator
     */
    saveDraft(showIndicator = false) {
        const data = this.collectFormData();
        const draftKey = `draft_${this.collection}_${this.entityId || 'new'}`;

        localStorage.setItem(draftKey, JSON.stringify(data));
        this.lastAutoSave = new Date();

        // Show indicator
        const indicator = this.container.querySelector('#autosaveIndicator');
        const timeEl = this.container.querySelector('#autosaveTime');

        if (indicator) {
            if (timeEl) {
                timeEl.textContent = this.formatTime(this.lastAutoSave);
            }

            indicator.classList.add('show');

            if (showIndicator) {
                this.announceToScreenReader('Draft saved');
            }

            setTimeout(() => {
                indicator.classList.remove('show');
            }, 3000);
        }

        console.log('[EntityForm] Draft saved');
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Status type (loading, success, error)
     */
    showStatus(message, type) {
        const statusContainer = this.container.querySelector('#formStatusContainer');
        const statusEl = this.container.querySelector('#formStatus');

        if (!statusEl || !statusContainer) return;

        statusEl.textContent = message;
        statusEl.className = `form-status ${type}`;
        statusContainer.classList.add('visible');

        // Announce to screen readers
        this.announceToScreenReader(message);

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                statusContainer.classList.remove('visible');
            }, 5000);
        }
    }

    /**
     * Announce to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        const announcements = this.form.querySelector('#formAnnouncements');
        if (announcements) {
            announcements.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
    }

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * Format time
     * @param {Date} date - Date object
     * @returns {string} Formatted time
     */
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Strip HTML tags from string
     * @param {string} html - HTML string
     * @returns {string} Plain text
     */
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
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
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    /**
     * Create ripple effect on element
     * @param {HTMLElement} element - Element to add ripple to
     * @param {Object} event - Event with clientX and clientY
     */
    createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${event.clientX - rect.left - size / 2}px;
            top: ${event.clientY - rect.top - size / 2}px;
            background: radial-gradient(circle, rgba(139, 127, 255, 0.4) 0%, transparent 70%);
            transform: scale(0);
            animation: uploadRipple 0.6s ease-out forwards;
            pointer-events: none;
            border-radius: 50%;
        `;

        element.style.position = 'relative';
        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => ripple.remove(), 600);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityForm;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.EntityForm = EntityForm;
}
