/**
 * Entity Form Component
 * Dynamic form builder for creating and editing entities
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
        this.isEditing = !!this.entityId;
        this.autoSaveTimer = null;
        this.currentStep = 0;
        this.uploadedImageUrl = null;

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
            { title: 'Basic Information', icon: '📝', fields: basicStep },
            { title: 'Details & Description', icon: '📄', fields: detailsStep }
        ];

        // Only add specific step if there are fields
        if (specificFields.length > 0) {
            steps.push({
                title: 'Additional Information',
                icon: '✨',
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
                helpText: 'The primary name of this entity',
                autocomplete: 'off'
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
                helpText: 'The category or classification',
                autocomplete: 'off'
            },
            {
                name: 'icon',
                label: 'Icon (Emoji)',
                type: 'text',
                required: false,
                placeholder: '⚡',
                maxLength: 2,
                helpText: 'An emoji to represent this entity',
                pattern: /^.{1,2}$/
            },
            {
                name: 'description',
                label: 'Description',
                type: 'richtext',
                required: false,
                placeholder: 'Enter a detailed description...',
                rows: 8,
                helpText: 'Detailed information about this entity'
            },
            {
                name: 'image',
                label: 'Image',
                type: 'image',
                required: false,
                helpText: 'Upload an image to represent this entity'
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
                this.uploadedImageUrl = result.data.imageUrl || null;
            }
        }

        const totalSteps = this.steps.length;

        return `
            <div class="entity-form-container" role="document">
                <!-- Form Header -->
                <div class="entity-form-header">
                    <div class="form-title-section">
                        <h2 id="form-title">
                            ${this.isEditing ? 'Edit' : 'Create'} ${this.capitalizeFirst(this.collection.slice(0, -1))}
                        </h2>
                        <div class="form-progress" role="progressbar" aria-valuenow="${this.currentStep + 1}" aria-valuemin="1" aria-valuemax="${totalSteps}">
                            <div class="progress-bar">
                                ${this.renderProgressSteps()}
                            </div>
                        </div>
                    </div>
                    <button
                        class="form-close-btn"
                        data-action="cancel"
                        aria-label="Close form"
                    >×</button>
                </div>

                <!-- Form Body -->
                <form class="entity-form" id="entityForm" novalidate>
                    ${this.steps.map((step, index) => this.renderStep(step, index)).join('\n')}

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            id="prevBtn"
                            ${this.currentStep === 0 ? 'disabled' : ''}
                            aria-label="Previous step"
                        >
                            <span aria-hidden="true">←</span> Previous
                        </button>

                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-action="cancel"
                            aria-label="Cancel form"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="btn btn-primary"
                            id="nextBtn"
                            ${this.currentStep === totalSteps - 1 ? 'style="display:none"' : ''}
                            aria-label="Next step"
                        >
                            Next <span aria-hidden="true">→</span>
                        </button>

                        <button
                            type="submit"
                            class="btn btn-primary"
                            id="submitBtn"
                            ${this.currentStep !== totalSteps - 1 ? 'style="display:none"' : ''}
                            aria-label="${this.isEditing ? 'Update' : 'Create'} entity"
                        >
                            <span aria-hidden="true">✓</span>
                            ${this.isEditing ? 'Update' : 'Create'}
                        </button>
                    </div>

                    <!-- Form Status -->
                    <div class="form-status" id="formStatus" role="status" aria-live="polite"></div>

                    <!-- Draft Save Indicator -->
                    <div class="draft-indicator" id="draftIndicator" aria-live="polite">
                        <span class="draft-icon">💾</span>
                        <span class="draft-text">Draft auto-saved</span>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Render progress steps
     * @returns {string} HTML string
     */
    renderProgressSteps() {
        return this.steps.map((step, index) => {
            const isActive = index === this.currentStep;
            const isCompleted = index < this.currentStep;

            return `
                <div class="progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="step-icon">${step.icon}</div>
                    <div class="step-label">${step.title}</div>
                </div>
            `;
        }).join('');
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
            <div
                class="form-step ${isActive ? 'active' : ''}"
                data-step="${index}"
                ${!isActive ? 'aria-hidden="true"' : ''}
            >
                <h3 class="step-title">
                    <span class="step-icon" aria-hidden="true">${step.icon}</span>
                    ${step.title}
                </h3>
                ${step.fields.map(field => this.renderField(field)).join('\n')}
            </div>
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
        const fieldId = `field-${field.name}`;
        const errorId = `error-${field.name}`;
        const helpId = `help-${field.name}`;

        let inputHTML = '';

        switch (field.type) {
            case 'text':
                inputHTML = `
                    <input
                        type="text"
                        id="${fieldId}"
                        name="${field.name}"
                        value="${this.escapeHtml(value)}"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required aria-required="true"' : ''}
                        ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
                        ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ''}
                        class="form-input ${error ? 'error' : ''}"
                        aria-describedby="${field.helpText ? helpId : ''} ${error ? errorId : ''}"
                        aria-invalid="${error ? 'true' : 'false'}"
                    />
                `;
                break;

            case 'textarea':
                inputHTML = `
                    <textarea
                        id="${fieldId}"
                        name="${field.name}"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required aria-required="true"' : ''}
                        rows="${field.rows || 4}"
                        class="form-textarea ${error ? 'error' : ''}"
                        aria-describedby="${field.helpText ? helpId : ''} ${error ? errorId : ''}"
                        aria-invalid="${error ? 'true' : 'false'}"
                    >${this.escapeHtml(value)}</textarea>
                `;
                break;

            case 'richtext':
                inputHTML = `
                    <div class="richtext-editor">
                        <div class="richtext-toolbar" role="toolbar" aria-label="Text formatting">
                            <button type="button" class="toolbar-btn" data-command="bold" aria-label="Bold" title="Bold (Ctrl+B)">
                                <strong>B</strong>
                            </button>
                            <button type="button" class="toolbar-btn" data-command="italic" aria-label="Italic" title="Italic (Ctrl+I)">
                                <em>I</em>
                            </button>
                            <button type="button" class="toolbar-btn" data-command="underline" aria-label="Underline" title="Underline (Ctrl+U)">
                                <u>U</u>
                            </button>
                            <span class="toolbar-divider" aria-hidden="true">|</span>
                            <button type="button" class="toolbar-btn" data-command="insertUnorderedList" aria-label="Bullet list" title="Bullet list">
                                •
                            </button>
                            <button type="button" class="toolbar-btn" data-command="insertOrderedList" aria-label="Numbered list" title="Numbered list">
                                1.
                            </button>
                        </div>
                        <div
                            id="${fieldId}"
                            class="richtext-content ${error ? 'error' : ''}"
                            contenteditable="true"
                            data-field="${field.name}"
                            role="textbox"
                            aria-multiline="true"
                            aria-label="${field.label}"
                            aria-describedby="${field.helpText ? helpId : ''} ${error ? errorId : ''}"
                            aria-invalid="${error ? 'true' : 'false'}"
                            ${field.placeholder ? `data-placeholder="${field.placeholder}"` : ''}
                        >${value}</div>
                    </div>
                `;
                break;

            case 'select':
                const options = field.options.map(opt => {
                    const selected = value === opt ? 'selected' : '';
                    return `<option value="${opt}" ${selected}>${this.capitalizeFirst(opt)}</option>`;
                }).join('\n');

                inputHTML = `
                    <select
                        id="${fieldId}"
                        name="${field.name}"
                        ${field.required ? 'required aria-required="true"' : ''}
                        class="form-select ${error ? 'error' : ''}"
                        aria-describedby="${field.helpText ? helpId : ''} ${error ? errorId : ''}"
                        aria-invalid="${error ? 'true' : 'false'}"
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
                        <div class="tags-list" role="list" aria-label="${field.label} tags">
                            ${tags.map(tag => `
                                <span class="tag" role="listitem">
                                    ${this.escapeHtml(tag)}
                                    <button
                                        type="button"
                                        class="tag-remove"
                                        data-tag="${this.escapeHtml(tag)}"
                                        aria-label="Remove ${this.escapeHtml(tag)}"
                                    >×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input
                            type="text"
                            id="${fieldId}_input"
                            placeholder="${field.placeholder || 'Add tag...'}"
                            class="form-input"
                            data-field="${field.name}"
                            aria-label="Add ${field.label}"
                            aria-describedby="${helpId}"
                        />
                    </div>
                `;
                break;

            case 'image':
                inputHTML = `
                    <div class="image-upload-container">
                        <input
                            type="file"
                            id="${fieldId}"
                            name="${field.name}"
                            accept="image/*"
                            class="image-input"
                            aria-label="Upload image"
                            aria-describedby="${helpId}"
                        />
                        <label for="${fieldId}" class="image-upload-label">
                            <div class="upload-icon" aria-hidden="true">📷</div>
                            <div class="upload-text">Click to upload image</div>
                            <div class="upload-subtext">PNG, JPG, GIF up to 5MB</div>
                        </label>
                        <div class="image-preview" id="${field.name}_preview" ${this.uploadedImageUrl ? '' : 'style="display:none"'}>
                            ${this.uploadedImageUrl ? `
                                <img src="${this.uploadedImageUrl}" alt="Preview" />
                                <button type="button" class="remove-image" aria-label="Remove image">
                                    <span aria-hidden="true">×</span> Remove
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                break;
        }

        return `
            <div class="form-field ${error ? 'has-error' : ''}" data-field="${field.name}">
                <label for="${fieldId}" class="form-label">
                    ${field.label}
                    ${field.required ? '<span class="required" aria-label="required">*</span>' : ''}
                </label>
                ${inputHTML}
                ${field.helpText ? `<p class="form-help-text" id="${helpId}">${field.helpText}</p>` : ''}
                ${error ? `<p class="form-error" id="${errorId}" role="alert">${error}</p>` : ''}
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

        // Step navigation
        this.initializeStepNavigation();

        // Rich text editors
        this.initializeRichTextEditors();

        // Tags input
        this.initializeTagsInputs();

        // Image upload
        this.initializeImageUpload();

        // Auto-save (draft)
        this.form.addEventListener('input', () => this.scheduleAutoSave());

        // Validation on blur
        this.form.addEventListener('blur', (e) => {
            if (e.target.matches('.form-input, .form-textarea, .form-select')) {
                this.validateField(e.target);
            }
        }, true);

        // Keyboard shortcuts
        this.initializeKeyboardShortcuts();
    }

    /**
     * Initialize step navigation
     */
    initializeStepNavigation() {
        const prevBtn = this.form.querySelector('#prevBtn');
        const nextBtn = this.form.querySelector('#nextBtn');
        const submitBtn = this.form.querySelector('#submitBtn');

        prevBtn?.addEventListener('click', () => this.previousStep());
        nextBtn?.addEventListener('click', () => this.nextStep());

        // Update buttons
        this.updateStepButtons();
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            // Validate current step
            if (!this.validateCurrentStep()) {
                return;
            }

            this.currentStep++;
            this.showCurrentStep();
            this.updateStepButtons();
            this.updateProgress();

            // Focus first input in new step
            this.focusFirstInput();
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
            } else {
                step.classList.remove('active');
                step.setAttribute('aria-hidden', 'true');
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
                submitBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
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

        // Update progress steps
        const progressSteps = this.container.querySelectorAll('.progress-step');
        progressSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index === this.currentStep) {
                step.classList.add('active');
            } else if (index < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    /**
     * Focus first input in current step
     */
    focusFirstInput() {
        const currentStepEl = this.form.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const firstInput = currentStepEl?.querySelector('input:not([type="file"]), textarea, select');
        firstInput?.focus();
    }

    /**
     * Validate current step
     * @returns {boolean} Is valid
     */
    validateCurrentStep() {
        const currentStep = this.steps[this.currentStep];
        let isValid = true;

        currentStep.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
            if (input && !this.validateField(input)) {
                isValid = false;
            }
        });

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

        if (field.required) {
            const value = input.value || input.textContent;
            if (!value || value.trim() === '') {
                error = `${field.label} is required`;
            }
        }

        if (error) {
            this.errors[fieldName] = error;
            this.showFieldError(fieldName, error);
            return false;
        } else {
            delete this.errors[fieldName];
            this.clearFieldError(fieldName);
            return true;
        }
    }

    /**
     * Show field error
     * @param {string} fieldName - Field name
     * @param {string} error - Error message
     */
    showFieldError(fieldName, error) {
        const fieldEl = this.form.querySelector(`[data-field="${fieldName}"]`);
        if (!fieldEl) return;

        fieldEl.classList.add('has-error');

        let errorEl = fieldEl.querySelector('.form-error');
        if (!errorEl) {
            errorEl = document.createElement('p');
            errorEl.className = 'form-error';
            errorEl.id = `error-${fieldName}`;
            errorEl.setAttribute('role', 'alert');
            fieldEl.appendChild(errorEl);
        }

        errorEl.textContent = error;

        const input = fieldEl.querySelector('.form-input, .form-textarea, .form-select, .richtext-content');
        if (input) {
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', errorEl.id);
        }
    }

    /**
     * Clear field error
     * @param {string} fieldName - Field name
     */
    clearFieldError(fieldName) {
        const fieldEl = this.form.querySelector(`[data-field="${fieldName}"]`);
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
        }
    }

    /**
     * Initialize rich text editors
     */
    initializeRichTextEditors() {
        const editors = this.form.querySelectorAll('.richtext-content');

        editors.forEach(editor => {
            const fieldName = editor.dataset.field;

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
            };

            editor.addEventListener('input', updatePlaceholder);
            updatePlaceholder();

            // Toolbar buttons
            const toolbar = editor.previousElementSibling;
            if (toolbar && toolbar.classList.contains('richtext-toolbar')) {
                toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const command = btn.dataset.command;
                        document.execCommand(command, false, null);
                        editor.focus();
                    });
                });
            }
        });
    }

    /**
     * Initialize tags inputs
     */
    initializeTagsInputs() {
        this.schema.fields
            .filter(field => field.type === 'tags')
            .forEach(field => {
                const input = this.form.querySelector(`#field-${field.name}_input`);
                if (!input) return;

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        this.addTag(field.name, input.value.trim());
                        input.value = '';
                    }
                });

                const container = this.form.querySelector(`#${field.name}_container`);
                container?.addEventListener('click', (e) => {
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
            <span class="tag" role="listitem">
                ${this.escapeHtml(value)}
                <button
                    type="button"
                    class="tag-remove"
                    data-tag="${this.escapeHtml(value)}"
                    aria-label="Remove ${this.escapeHtml(value)}"
                >×</button>
            </span>
        `;

        container.insertAdjacentHTML('beforeend', tagHTML);

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
            if (tag.querySelector('.tag-remove').dataset.tag === value) {
                tag.remove();
                this.announceToScreenReader(`Removed tag: ${value}`);
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
     * Initialize image upload
     */
    initializeImageUpload() {
        const imageFields = this.schema.fields.filter(f => f.type === 'image');

        imageFields.forEach(field => {
            const input = this.form.querySelector(`#field-${field.name}`);
            if (!input) return;

            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image must be smaller than 5MB');
                    input.value = '';
                    return;
                }

                // Show preview
                const preview = this.form.querySelector(`#${field.name}_preview`);
                const reader = new FileReader();

                reader.onload = (e) => {
                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" />
                        <button type="button" class="remove-image" aria-label="Remove image">
                            <span aria-hidden="true">×</span> Remove
                        </button>
                    `;
                    preview.style.display = 'block';

                    // Store for upload
                    this.uploadedImageUrl = e.target.result;

                    // Remove image button
                    preview.querySelector('.remove-image')?.addEventListener('click', () => {
                        input.value = '';
                        this.uploadedImageUrl = null;
                        preview.style.display = 'none';
                        preview.innerHTML = '';
                    });
                };

                reader.readAsDataURL(file);
            });
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
                }
            }

            // Ctrl/Cmd + S to save draft
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveDraft();
            }

            // Esc to cancel
            if (e.key === 'Escape') {
                this.handleCancel();
            }
        });
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Validate all steps
        let allValid = true;
        for (let i = 0; i < this.steps.length; i++) {
            this.currentStep = i;
            if (!this.validateCurrentStep()) {
                allValid = false;
                this.showCurrentStep();
                this.updateStepButtons();
                this.updateProgress();
                break;
            }
        }

        if (!allValid) {
            this.showStatus('Please fix the errors before submitting', 'error');
            return;
        }

        const data = this.collectFormData();

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
                if (typeof this.onSuccess === 'function') {
                    try {
                        this.onSuccess(result);
                    } catch (error) {
                        console.error('[EntityForm] Error in onSuccess callback:', error);
                    }
                }
            }, 1000);
        } else {
            this.showStatus(`Error: ${result.error}`, 'error');
        }
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
                data[field.name] = input?.value || '';
            }
        });

        return data;
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            if (typeof this.onCancel === 'function') {
                try {
                    this.onCancel();
                } catch (error) {
                    console.error('[EntityForm] Error in onCancel callback:', error);
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
        const data = this.collectFormData();
        const draftKey = `draft_${this.collection}_${this.entityId || 'new'}`;

        localStorage.setItem(draftKey, JSON.stringify(data));

        // Show indicator
        const indicator = this.form.querySelector('#draftIndicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }

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

        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    /**
     * Announce to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
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

// Browser global export
if (typeof window !== 'undefined') {
    window.EntityForm = EntityForm;
}
