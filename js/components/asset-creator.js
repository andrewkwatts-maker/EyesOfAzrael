/**
 * Asset Creator Component
 * Handles the modal interface for creating new user-submitted entities
 * Features: Multi-step form, validation, draft system, dynamic field generation
 */

class AssetCreator {
    constructor() {
        this.modal = null;
        this.form = null;
        this.currentStep = 1;
        this.totalSteps = 3;
        this.entityType = null;
        this.formData = {};
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30 seconds
        this.draftKey = null;

        // Field configurations for each entity type
        this.typeFields = {
            deities: [
                { name: 'domains', label: 'Domains/Spheres', type: 'tags', placeholder: 'e.g., Sky, Thunder, Justice', hint: 'Separate with commas' },
                { name: 'symbols', label: 'Symbols', type: 'tags', placeholder: 'e.g., Eagle, Lightning Bolt', hint: 'Sacred symbols associated with this deity' },
                { name: 'family', label: 'Family/Relations', type: 'text', placeholder: 'e.g., Son of Cronus and Rhea', hint: 'Optional' }
            ],
            creatures: [
                { name: 'creatureType', label: 'Creature Type', type: 'select', options: ['Dragon', 'Beast', 'Spirit', 'Hybrid', 'Monster', 'Guardian', 'Other'], required: true },
                { name: 'habitat', label: 'Habitat', type: 'text', placeholder: 'e.g., Mountains, Underworld', hint: 'Where does this creature live?' },
                { name: 'abilities', label: 'Abilities/Powers', type: 'tags', placeholder: 'e.g., Flight, Fire Breath', hint: 'Separate with commas' }
            ],
            heroes: [
                { name: 'heroType', label: 'Hero Type', type: 'select', options: ['Warrior', 'Demigod', 'King', 'Prophet', 'Trickster', 'Martyr', 'Other'], required: true },
                { name: 'quests', label: 'Famous Quests', type: 'tags', placeholder: 'e.g., Twelve Labors', hint: 'Major accomplishments or quests' },
                { name: 'weapons', label: 'Weapons/Tools', type: 'tags', placeholder: 'e.g., Sword, Shield', hint: 'Associated weapons or artifacts' }
            ],
            items: [
                { name: 'itemType', label: 'Item Type', type: 'select', options: ['Weapon', 'Armor', 'Artifact', 'Relic', 'Jewelry', 'Tool', 'Other'], required: true },
                { name: 'powers', label: 'Powers/Abilities', type: 'tags', placeholder: 'e.g., Invincibility, Flight', hint: 'Magical properties' },
                { name: 'owner', label: 'Owner/Wielder', type: 'text', placeholder: 'e.g., Thor', hint: 'Who possesses this item?' }
            ],
            places: [
                { name: 'placeType', label: 'Place Type', type: 'select', options: ['Temple', 'Mountain', 'Realm', 'City', 'Underworld', 'Paradise', 'Other'], required: true },
                { name: 'significance', label: 'Significance', type: 'text', placeholder: 'e.g., Birthplace of the gods', hint: 'Why is this place important?' },
                { name: 'inhabitants', label: 'Inhabitants', type: 'tags', placeholder: 'e.g., Gods, Spirits', hint: 'Who lives here?' }
            ],
            herbs: [
                { name: 'botanicalName', label: 'Botanical Name', type: 'text', placeholder: 'e.g., Cannabis sativa', hint: 'Scientific name (optional)' },
                { name: 'uses', label: 'Uses/Properties', type: 'tags', placeholder: 'e.g., Healing, Protection', hint: 'Medicinal or spiritual uses' },
                { name: 'preparation', label: 'Preparation', type: 'text', placeholder: 'e.g., Tea, Incense', hint: 'How is it used?' }
            ],
            rituals: [
                { name: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g., Harvest festival, Purification', hint: 'What is this ritual for?', required: true },
                { name: 'steps', label: 'Ritual Steps', type: 'textarea', placeholder: 'Describe the ritual procedure...', hint: 'Main steps or procedure' },
                { name: 'offerings', label: 'Offerings', type: 'tags', placeholder: 'e.g., Wine, Incense', hint: 'What is offered?' }
            ],
            texts: [
                { name: 'textType', label: 'Text Type', type: 'select', options: ['Scripture', 'Epic', 'Hymn', 'Prayer', 'Philosophy', 'History', 'Other'], required: true },
                { name: 'author', label: 'Author', type: 'text', placeholder: 'e.g., Homer', hint: 'If known' },
                { name: 'date', label: 'Date/Period', type: 'text', placeholder: 'e.g., 8th century BCE', hint: 'When was it written?' }
            ],
            symbols: [
                { name: 'symbolType', label: 'Symbol Type', type: 'select', options: ['Geometric', 'Animal', 'Celestial', 'Plant', 'Object', 'Abstract', 'Other'], required: true },
                { name: 'meaning', label: 'Meaning', type: 'text', placeholder: 'e.g., Unity, Protection', hint: 'What does it represent?', required: true },
                { name: 'usage', label: 'Usage', type: 'text', placeholder: 'e.g., Worn as amulet', hint: 'How is it used?' }
            ]
        };

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        // Load the modal HTML if not already present
        this.ensureModalExists();

        // Cache DOM elements
        this.modal = document.getElementById('assetCreatorModal');
        this.form = document.getElementById('assetCreatorForm');

        if (!this.modal || !this.form) {
            console.error('[AssetCreator] Modal or form not found');
            return;
        }

        // Attach event listeners
        this.attachEventListeners();

        console.log('[AssetCreator] Initialized');
    }

    /**
     * Ensure modal HTML exists in DOM
     */
    ensureModalExists() {
        if (!document.getElementById('assetCreatorModal')) {
            // Load from component file
            fetch('/components/asset-creator-modal.html')
                .then(response => response.text())
                .then(html => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    document.body.appendChild(tempDiv.firstElementChild);
                    this.init(); // Re-initialize
                })
                .catch(error => {
                    console.error('[AssetCreator] Failed to load modal:', error);
                });
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        this.modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Navigation buttons
        document.getElementById('nextStepBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevStepBtn')?.addEventListener('click', () => this.prevStep());

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Save draft
        document.getElementById('saveDraftBtn')?.addEventListener('click', () => this.saveDraft());

        // Draft recovery
        document.getElementById('resumeDraftBtn')?.addEventListener('click', () => this.resumeDraft());
        document.getElementById('discardDraftBtn')?.addEventListener('click', () => this.discardDraft());

        // Success actions
        document.getElementById('viewAssetBtn')?.addEventListener('click', () => this.viewCreatedAsset());
        document.getElementById('createAnotherBtn')?.addEventListener('click', () => this.createAnother());

        // Character count for description
        const descTextarea = document.getElementById('entityDescription');
        if (descTextarea) {
            descTextarea.addEventListener('input', (e) => this.updateCharCount(e.target));
        }

        // Real-time validation
        this.form.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
        });

        // Auto-save form data
        this.form.addEventListener('input', () => {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => this.autoSaveDraft(), this.autoSaveDelay);
        });
    }

    /**
     * Open modal for creating a new entity
     */
    open(entityType, options = {}) {
        this.entityType = entityType;
        this.currentStep = 1;
        this.formData = {};
        this.draftKey = `draft_${entityType}_${Date.now()}`;

        // Set entity type
        document.getElementById('entityType').value = entityType;

        // Update modal title and icon
        this.updateModalHeader(entityType);

        // Pre-fill mythology if provided
        if (options.mythology) {
            document.getElementById('entityMythology').value = options.mythology;
        }

        // Generate dynamic fields
        this.generateDynamicFields(entityType);

        // Check for existing draft
        this.checkForDraft();

        // Reset form and show first step
        this.form.reset();
        this.showStep(1);

        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log(`[AssetCreator] Opened for ${entityType}`);
    }

    /**
     * Close modal
     */
    close() {
        // Clear auto-save
        clearTimeout(this.autoSaveTimeout);

        // Hide modal
        this.modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset form
        this.form.reset();
        this.currentStep = 1;

        console.log('[AssetCreator] Closed');
    }

    /**
     * Update modal header based on entity type
     */
    updateModalHeader(entityType) {
        const typeInfo = {
            deities: { icon: '⚡', title: 'Create New Deity', subtitle: 'Share knowledge about a divine being' },
            creatures: { icon: '🐉', title: 'Create New Creature', subtitle: 'Document a mythical being' },
            heroes: { icon: '🗡️', title: 'Create New Hero', subtitle: 'Honor a legendary figure' },
            items: { icon: '💎', title: 'Create New Sacred Item', subtitle: 'Catalog a legendary artifact' },
            places: { icon: '🏔️', title: 'Create New Sacred Place', subtitle: 'Map a mystical location' },
            herbs: { icon: '🌿', title: 'Create New Sacred Herb', subtitle: 'Share herbal wisdom' },
            rituals: { icon: '🕯️', title: 'Create New Ritual', subtitle: 'Document a sacred ceremony' },
            texts: { icon: '📜', title: 'Create New Sacred Text', subtitle: 'Preserve ancient writings' },
            symbols: { icon: '☯️', title: 'Create New Symbol', subtitle: 'Explain sacred symbolism' }
        };

        const info = typeInfo[entityType] || { icon: '✨', title: 'Create New Asset', subtitle: '' };

        document.getElementById('creatorIcon').textContent = info.icon;
        document.getElementById('creatorTitle').textContent = info.title;
        document.getElementById('creatorSubtitle').textContent = info.subtitle;
    }

    /**
     * Generate dynamic fields based on entity type
     */
    generateDynamicFields(entityType) {
        const container = document.getElementById('dynamicFields');
        if (!container) return;

        container.innerHTML = '';

        const fields = this.typeFields[entityType] || [];

        fields.forEach(field => {
            const fieldHTML = this.generateFieldHTML(field);
            container.insertAdjacentHTML('beforeend', fieldHTML);
        });
    }

    /**
     * Generate HTML for a dynamic field
     */
    generateFieldHTML(field) {
        const required = field.required ? '<span class="label-required">*</span>' : '<span class="label-optional">(Optional)</span>';

        let inputHTML = '';

        switch (field.type) {
            case 'text':
                inputHTML = `
                    <input
                        type="text"
                        id="field_${field.name}"
                        name="${field.name}"
                        class="form-input"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}>
                `;
                break;

            case 'textarea':
                inputHTML = `
                    <textarea
                        id="field_${field.name}"
                        name="${field.name}"
                        class="form-input form-textarea"
                        rows="4"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}></textarea>
                `;
                break;

            case 'select':
                inputHTML = `
                    <select id="field_${field.name}" name="${field.name}" class="form-input" ${field.required ? 'required' : ''}>
                        <option value="">Select ${field.label.toLowerCase()}...</option>
                        ${field.options.map(opt => `<option value="${opt.toLowerCase()}">${opt}</option>`).join('')}
                    </select>
                `;
                break;

            case 'tags':
                inputHTML = `
                    <input
                        type="text"
                        id="field_${field.name}"
                        name="${field.name}"
                        class="form-input"
                        placeholder="${field.placeholder || ''}"
                        ${field.required ? 'required' : ''}>
                `;
                break;
        }

        return `
            <div class="form-group">
                <label for="field_${field.name}" class="form-label">
                    <span class="label-text">${field.label}</span>
                    ${required}
                </label>
                ${inputHTML}
                ${field.hint ? `<span class="form-hint">${field.hint}</span>` : ''}
            </div>
        `;
    }

    /**
     * Show specific step
     */
    showStep(step) {
        // Hide all steps
        this.form.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

        // Show target step
        const targetStep = this.form.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        // Update progress indicator
        this.form.closest('.modal-content').querySelectorAll('.progress-step').forEach((s, i) => {
            s.classList.remove('active', 'completed');
            if (i + 1 < step) {
                s.classList.add('completed');
            } else if (i + 1 === step) {
                s.classList.add('active');
            }
        });

        // Show/hide navigation buttons
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const submitBtns = document.getElementById('submitButtons');
        const navBtns = nextBtn.parentElement;

        if (step === 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = '';
        }

        if (step === this.totalSteps) {
            navBtns.style.display = 'none';
            submitBtns.style.display = 'flex';
            this.generatePreview();
        } else {
            navBtns.style.display = 'flex';
            submitBtns.style.display = 'none';
        }

        this.currentStep = step;
    }

    /**
     * Next step
     */
    nextStep() {
        // Validate current step
        if (!this.validateStep(this.currentStep)) {
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
        }
    }

    /**
     * Previous step
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Validate current step
     */
    validateStep(step) {
        const stepElement = this.form.querySelector(`.form-step[data-step="${step}"]`);
        if (!stepElement) return true;

        const requiredFields = stepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Description length check
        if (fieldName === 'description' && value) {
            if (value.length < 50) {
                isValid = false;
                errorMessage = 'Description must be at least 50 characters';
            } else if (value.length > 5000) {
                isValid = false;
                errorMessage = 'Description must be less than 5000 characters';
            }
        }

        // URL validation
        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                errorMessage = 'Please enter a valid URL';
            }
        }

        // Show/hide error
        const errorId = `${fieldName}Error`;
        const errorEl = document.getElementById(errorId);

        if (errorEl) {
            if (!isValid) {
                errorEl.textContent = errorMessage;
                errorEl.classList.add('visible');
                field.classList.add('error');
            } else {
                errorEl.classList.remove('visible');
                field.classList.remove('error');
            }
        }

        return isValid;
    }

    /**
     * Update character count for textarea
     */
    updateCharCount(textarea) {
        const charCount = document.getElementById('descCharCount');
        if (charCount) {
            const count = textarea.value.length;
            charCount.textContent = `${count} / 5000`;

            if (count > 5000) {
                charCount.style.color = 'var(--color-danger, #ef4444)';
            } else {
                charCount.style.color = '';
            }
        }
    }

    /**
     * Generate preview card
     */
    generatePreview() {
        const previewCard = document.getElementById('previewCard');
        if (!previewCard) return;

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        const icon = data.icon || this.getDefaultIcon(this.entityType);
        const name = data.name || 'Untitled';
        const mythology = data.mythology ? this.capitalizeFirst(data.mythology) : 'Unknown';
        const description = data.description || 'No description provided';

        previewCard.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
                <div style="font-size: 2.5rem;">${icon}</div>
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--color-text-primary);">${this.escapeHtml(name)}</h3>
                    <span style="display: inline-block; padding: 0.25rem 0.75rem; background: rgba(var(--color-primary-rgb), 0.2); border: 1px solid rgba(var(--color-primary-rgb), 0.4); border-radius: 9999px; color: var(--color-primary); font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">
                        ${mythology}
                    </span>
                </div>
            </div>
            <p style="color: var(--color-text-secondary); line-height: 1.75; margin: 0;">
                ${this.escapeHtml(description).substring(0, 200)}${description.length > 200 ? '...' : ''}
            </p>
        `;
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Final validation
        if (!this.validateStep(this.totalSteps)) {
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Collect form data
            const formData = new FormData(this.form);
            const data = this.processFormData(formData);

            // Submit to Firebase
            const result = await window.userAssetService.createAsset(this.entityType, data);

            if (result.success) {
                this.showSuccess(result);
                this.clearDraft();
            } else {
                throw new Error(result.error || 'Failed to create asset');
            }

        } catch (error) {
            console.error('[AssetCreator] Submission error:', error);
            alert(`Failed to create asset: ${error.message}`);
            this.showLoading(false);
        }
    }

    /**
     * Process form data
     */
    processFormData(formData) {
        const data = Object.fromEntries(formData);

        // Convert comma-separated strings to arrays
        const arrayFields = ['altNames', 'tags', 'domains', 'symbols', 'abilities', 'quests', 'weapons', 'powers', 'inhabitants', 'uses', 'offerings'];

        arrayFields.forEach(field => {
            if (data[field]) {
                data[field] = data[field].split(',').map(s => s.trim()).filter(s => s);
            }
        });

        // Add metadata
        data.createdVia = 'asset-creator';
        data.version = 1;

        return data;
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Show success message
     */
    showSuccess(result) {
        this.showLoading(false);

        const successMsg = document.getElementById('successMessage');
        const successText = document.getElementById('successText');

        if (successMsg && successText) {
            successText.textContent = `Your ${this.entityType.slice(0, -1)} has been created and is now ${result.data.visibility === 'public' ? 'visible to all users' : 'private to your account'}.`;
            successMsg.style.display = 'flex';

            // Store created asset ID for viewing later
            this.createdAssetId = result.id;
        }
    }

    /**
     * View created asset
     */
    viewCreatedAsset() {
        if (this.createdAssetId) {
            const mythology = document.getElementById('entityMythology').value;
            window.location.hash = `#/entity/${this.entityType}/${mythology}/${this.createdAssetId}`;
            this.close();
        }
    }

    /**
     * Create another asset
     */
    createAnother() {
        // Hide success message
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.style.display = 'none';
        }

        // Reset form
        this.form.reset();
        this.showStep(1);
        this.createdAssetId = null;
    }

    /**
     * Check for existing draft
     */
    checkForDraft() {
        const draftKey = `draft_${this.entityType}`;
        const draft = localStorage.getItem(draftKey);

        if (draft) {
            try {
                const draftData = JSON.parse(draft);
                const draftNotice = document.getElementById('draftNotice');
                const draftTimestamp = document.getElementById('draftTimestamp');

                if (draftNotice && draftTimestamp) {
                    const draftDate = new Date(draftData.savedAt);
                    draftTimestamp.textContent = draftDate.toLocaleString();
                    draftNotice.style.display = 'flex';
                }
            } catch (error) {
                console.error('[AssetCreator] Failed to parse draft:', error);
            }
        }
    }

    /**
     * Auto-save draft
     */
    autoSaveDraft() {
        if (!this.form) return;

        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);

        const draft = {
            data,
            savedAt: Date.now(),
            step: this.currentStep
        };

        const draftKey = `draft_${this.entityType}`;
        localStorage.setItem(draftKey, JSON.stringify(draft));

        console.log('[AssetCreator] Auto-saved draft');
    }

    /**
     * Save draft manually
     */
    saveDraft() {
        this.autoSaveDraft();
        alert('Draft saved successfully!');
    }

    /**
     * Resume draft
     */
    resumeDraft() {
        const draftKey = `draft_${this.entityType}`;
        const draft = localStorage.getItem(draftKey);

        if (draft) {
            try {
                const draftData = JSON.parse(draft);

                // Populate form
                Object.entries(draftData.data).forEach(([key, value]) => {
                    const field = this.form.elements[key];
                    if (field) {
                        field.value = value;
                    }
                });

                // Go to saved step
                this.showStep(draftData.step || 1);

                // Hide notice
                const draftNotice = document.getElementById('draftNotice');
                if (draftNotice) {
                    draftNotice.style.display = 'none';
                }

            } catch (error) {
                console.error('[AssetCreator] Failed to resume draft:', error);
            }
        }
    }

    /**
     * Discard draft
     */
    discardDraft() {
        const draftKey = `draft_${this.entityType}`;
        localStorage.removeItem(draftKey);

        const draftNotice = document.getElementById('draftNotice');
        if (draftNotice) {
            draftNotice.style.display = 'none';
        }
    }

    /**
     * Clear draft
     */
    clearDraft() {
        const draftKey = `draft_${this.entityType}`;
        localStorage.removeItem(draftKey);
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIcon(type) {
        const icons = {
            deities: '⚡',
            creatures: '🐉',
            heroes: '🗡️',
            items: '💎',
            places: '🏔️',
            herbs: '🌿',
            rituals: '🕯️',
            texts: '📜',
            symbols: '☯️'
        };
        return icons[type] || '✨';
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.assetCreator = new AssetCreator();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetCreator;
}
