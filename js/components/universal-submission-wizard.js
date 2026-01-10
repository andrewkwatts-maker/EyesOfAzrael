/**
 * Universal Submission Wizard
 * Eyes of Azrael Project
 *
 * Multi-step wizard supporting all 12 asset types with:
 * - Step 1: Select asset type
 * - Step 2: Basic info (name, mythology, description)
 * - Step 3: Extended info (type-specific fields)
 * - Step 4: Relationships
 * - Step 5: Media (AI SVG or upload)
 * - Step 6: Sources & Citations
 * - Step 7: Preview & Submit
 */

class UniversalSubmissionWizard {
    constructor(options = {}) {
        this.container = null;
        this.currentStep = 1;
        this.totalSteps = 7;
        this.formData = this.getDefaultFormData();
        this.drafts = [];
        this.autoSaveInterval = null;
        this.lastSaveTime = null;
        this.isDirty = false;

        // Services
        this.submissionService = window.contentSubmissionService || null;

        // Callbacks
        this.onSubmitSuccess = options.onSubmitSuccess || null;
        this.onCancel = options.onCancel || null;

        // Asset type definitions
        this.assetTypes = this.getAssetTypeDefinitions();

        // Mythology options
        this.mythologies = this.getMythologyOptions();
    }

    /**
     * Get default empty form data
     */
    getDefaultFormData() {
        return {
            type: '',
            name: '',
            mythology: '',
            alternateMythologies: [],
            shortDescription: '',
            longDescription: '',
            emoji: '',
            domains: [],
            attributes: [],
            powers: [],
            symbols: [],
            relationships: [],
            svgIcon: '',
            imageUrl: '',
            iconMethod: 'generate',
            sources: [],
            tags: [],
            extendedSections: [],
            // Type-specific fields
            typeSpecific: {}
        };
    }

    /**
     * Define all 12 asset types with their configurations
     */
    getAssetTypeDefinitions() {
        return {
            deity: {
                id: 'deity',
                name: 'Deity / God',
                icon: 'icons/categories/deities.svg',
                emoji: '⚡',
                description: 'Divine beings, gods, and goddesses',
                color: '#ffd93d',
                requiredFields: ['domains'],
                optionalFields: ['epithets', 'consorts', 'children', 'parents', 'worship'],
                extendedSections: [
                    { id: 'mythology', title: 'Mythological Origins', placeholder: 'Describe the origin story...' },
                    { id: 'worship', title: 'Worship & Rituals', placeholder: 'Describe how this deity was worshipped...' },
                    { id: 'symbols', title: 'Sacred Symbols', placeholder: 'List and describe sacred symbols...' },
                    { id: 'stories', title: 'Famous Myths', placeholder: 'Describe famous myths involving this deity...' }
                ]
            },
            creature: {
                id: 'creature',
                name: 'Mythical Creature',
                icon: 'icons/categories/creatures.svg',
                emoji: '🐉',
                description: 'Dragons, monsters, and fantastic beasts',
                color: '#ff7eb6',
                requiredFields: [],
                optionalFields: ['habitat', 'diet', 'abilities', 'weaknesses', 'appearance'],
                extendedSections: [
                    { id: 'appearance', title: 'Physical Description', placeholder: 'Describe the creature\'s appearance...' },
                    { id: 'behavior', title: 'Behavior & Habits', placeholder: 'Describe the creature\'s behavior...' },
                    { id: 'encounters', title: 'Famous Encounters', placeholder: 'Describe famous encounters with this creature...' },
                    { id: 'symbolism', title: 'Symbolism', placeholder: 'What does this creature symbolize...' }
                ]
            },
            hero: {
                id: 'hero',
                name: 'Hero / Legend',
                icon: 'icons/categories/heroes.svg',
                emoji: '⚔️',
                description: 'Epic heroes and legendary figures',
                color: '#4a9eff',
                requiredFields: [],
                optionalFields: ['titles', 'birthplace', 'deathplace', 'weapons', 'companions'],
                extendedSections: [
                    { id: 'origin', title: 'Origin Story', placeholder: 'Describe the hero\'s origins...' },
                    { id: 'quests', title: 'Quests & Adventures', placeholder: 'Describe famous quests...' },
                    { id: 'death', title: 'Death & Legacy', placeholder: 'How did they die and what was their legacy...' },
                    { id: 'lessons', title: 'Moral Lessons', placeholder: 'What lessons does this story teach...' }
                ]
            },
            item: {
                id: 'item',
                name: 'Sacred Item',
                icon: 'icons/categories/items.svg',
                emoji: '🗡️',
                description: 'Legendary artifacts and magical objects',
                color: '#51cf66',
                requiredFields: [],
                optionalFields: ['creator', 'material', 'powers', 'location', 'currentHolder'],
                extendedSections: [
                    { id: 'creation', title: 'Creation Story', placeholder: 'How was this item created...' },
                    { id: 'powers', title: 'Powers & Abilities', placeholder: 'Describe the item\'s powers...' },
                    { id: 'history', title: 'Notable History', placeholder: 'Describe the item\'s journey through history...' },
                    { id: 'significance', title: 'Cultural Significance', placeholder: 'What does this item represent...' }
                ]
            },
            place: {
                id: 'place',
                name: 'Sacred Place',
                icon: 'icons/categories/places.svg',
                emoji: '🏛️',
                description: 'Holy sites, temples, and mystical locations',
                color: '#7fd9d3',
                requiredFields: [],
                optionalFields: ['location', 'inhabitants', 'access', 'significance'],
                extendedSections: [
                    { id: 'description', title: 'Physical Description', placeholder: 'Describe the location...' },
                    { id: 'history', title: 'Mythological History', placeholder: 'Describe the place\'s mythological history...' },
                    { id: 'inhabitants', title: 'Inhabitants', placeholder: 'Who or what lives here...' },
                    { id: 'significance', title: 'Religious Significance', placeholder: 'Why is this place sacred...' }
                ]
            },
            text: {
                id: 'text',
                name: 'Sacred Text',
                icon: 'icons/categories/texts.svg',
                emoji: '📜',
                description: 'Holy scriptures and ancient writings',
                color: '#a8edea',
                requiredFields: [],
                optionalFields: ['author', 'dateWritten', 'language', 'chapters', 'themes'],
                extendedSections: [
                    { id: 'contents', title: 'Contents & Structure', placeholder: 'Describe the text\'s contents...' },
                    { id: 'history', title: 'Historical Context', placeholder: 'When and why was this written...' },
                    { id: 'teachings', title: 'Key Teachings', placeholder: 'What are the main teachings...' },
                    { id: 'influence', title: 'Influence', placeholder: 'How has this text influenced culture...' }
                ]
            },
            ritual: {
                id: 'ritual',
                name: 'Ritual / Practice',
                icon: 'icons/categories/rituals.svg',
                emoji: '🔥',
                description: 'Ceremonies, festivals, and sacred rites',
                color: '#fb9f7f',
                requiredFields: [],
                optionalFields: ['timing', 'participants', 'materials', 'purpose'],
                extendedSections: [
                    { id: 'procedure', title: 'Procedure', placeholder: 'Describe how the ritual is performed...' },
                    { id: 'symbolism', title: 'Symbolism', placeholder: 'What does each element symbolize...' },
                    { id: 'history', title: 'Historical Origins', placeholder: 'Where did this ritual originate...' },
                    { id: 'modern', title: 'Modern Practice', placeholder: 'How is this practiced today...' }
                ]
            },
            symbol: {
                id: 'symbol',
                name: 'Sacred Symbol',
                icon: 'icons/categories/symbols.svg',
                emoji: '☯️',
                description: 'Religious icons and mystical symbols',
                color: '#fed6e3',
                requiredFields: [],
                optionalFields: ['elements', 'colors', 'usage', 'variations'],
                extendedSections: [
                    { id: 'description', title: 'Visual Description', placeholder: 'Describe the symbol\'s appearance...' },
                    { id: 'meaning', title: 'Meaning & Interpretation', placeholder: 'What does this symbol mean...' },
                    { id: 'history', title: 'Historical Origins', placeholder: 'Where did this symbol originate...' },
                    { id: 'usage', title: 'Usage & Context', placeholder: 'How and where is this symbol used...' }
                ]
            },
            archetype: {
                id: 'archetype',
                name: 'Archetype',
                icon: 'icons/categories/archetypes.svg',
                emoji: '🎭',
                description: 'Universal patterns in mythology',
                color: '#b965e6',
                requiredFields: [],
                optionalFields: ['characteristics', 'examples', 'shadow', 'journey'],
                extendedSections: [
                    { id: 'definition', title: 'Definition', placeholder: 'Define this archetype...' },
                    { id: 'characteristics', title: 'Core Characteristics', placeholder: 'What defines this archetype...' },
                    { id: 'examples', title: 'Examples in Mythology', placeholder: 'List examples from various mythologies...' },
                    { id: 'psychology', title: 'Psychological Interpretation', placeholder: 'How is this interpreted psychologically...' }
                ]
            },
            magic: {
                id: 'magic',
                name: 'Magic System',
                icon: 'icons/categories/magic.svg',
                emoji: '✨',
                description: 'Mystical practices and esoteric traditions',
                color: '#f85a8f',
                requiredFields: [],
                optionalFields: ['practitioners', 'techniques', 'requirements', 'limitations'],
                extendedSections: [
                    { id: 'principles', title: 'Core Principles', placeholder: 'Describe the core principles...' },
                    { id: 'techniques', title: 'Techniques & Methods', placeholder: 'What techniques are used...' },
                    { id: 'practitioners', title: 'Practitioners', placeholder: 'Who practices this magic...' },
                    { id: 'history', title: 'Historical Context', placeholder: 'Describe the historical background...' }
                ]
            },
            herb: {
                id: 'herb',
                name: 'Sacred Herb',
                icon: 'icons/categories/herbs.svg',
                emoji: '🌿',
                description: 'Sacred plants and traditional medicine',
                color: '#7fb0f9',
                requiredFields: [],
                optionalFields: ['scientificName', 'habitat', 'preparation', 'effects', 'warnings'],
                extendedSections: [
                    { id: 'description', title: 'Botanical Description', placeholder: 'Describe the plant...' },
                    { id: 'mythology', title: 'Mythological Significance', placeholder: 'What myths involve this plant...' },
                    { id: 'usage', title: 'Traditional Uses', placeholder: 'How was this plant used...' },
                    { id: 'preparation', title: 'Preparation Methods', placeholder: 'How is it prepared...' }
                ]
            },
            mythology: {
                id: 'mythology',
                name: 'Mythology System',
                icon: 'icons/categories/mythologies.svg',
                emoji: '🌍',
                description: 'Complete mythology traditions',
                color: '#8b7fff',
                requiredFields: ['region', 'period'],
                optionalFields: ['pantheon', 'cosmology', 'afterlife', 'creation'],
                extendedSections: [
                    { id: 'overview', title: 'Overview', placeholder: 'Provide an overview of this mythology...' },
                    { id: 'cosmology', title: 'Cosmology', placeholder: 'Describe the creation and structure of the world...' },
                    { id: 'pantheon', title: 'Pantheon', placeholder: 'Describe the major gods and their relationships...' },
                    { id: 'afterlife', title: 'Afterlife Beliefs', placeholder: 'What happens after death...' }
                ]
            }
        };
    }

    /**
     * Get mythology dropdown options
     */
    getMythologyOptions() {
        return [
            { value: '', label: 'Select a mythology...' },
            { value: 'greek', label: 'Greek' },
            { value: 'roman', label: 'Roman' },
            { value: 'norse', label: 'Norse' },
            { value: 'egyptian', label: 'Egyptian' },
            { value: 'celtic', label: 'Celtic' },
            { value: 'hindu', label: 'Hindu' },
            { value: 'buddhist', label: 'Buddhist' },
            { value: 'christian', label: 'Christian' },
            { value: 'jewish', label: 'Jewish' },
            { value: 'islamic', label: 'Islamic' },
            { value: 'japanese', label: 'Japanese (Shinto)' },
            { value: 'chinese', label: 'Chinese' },
            { value: 'sumerian', label: 'Sumerian' },
            { value: 'babylonian', label: 'Babylonian' },
            { value: 'aztec', label: 'Aztec' },
            { value: 'mayan', label: 'Mayan' },
            { value: 'yoruba', label: 'Yoruba' },
            { value: 'polynesian', label: 'Polynesian' },
            { value: 'native-american', label: 'Native American' },
            { value: 'slavic', label: 'Slavic' },
            { value: 'finnish', label: 'Finnish' },
            { value: 'persian', label: 'Persian' },
            { value: 'african', label: 'African (Other)' },
            { value: 'other', label: 'Other' }
        ];
    }

    /**
     * Render the wizard into a container
     */
    render(container) {
        this.container = container;
        this.container.innerHTML = this.getWizardHTML();
        this.attachEventListeners();
        this.loadDrafts();
        this.startAutoSave();
        this.updateProgressBar();
    }

    /**
     * Get main wizard HTML structure
     */
    getWizardHTML() {
        return `
            <div class="usw-wizard">
                <!-- Progress Bar -->
                ${this.getProgressBarHTML()}

                <!-- Wizard Body -->
                <div class="usw-body">
                    <!-- Step 1: Select Type -->
                    <div class="usw-step ${this.currentStep === 1 ? 'active' : ''}" data-step="1">
                        ${this.getStep1HTML()}
                    </div>

                    <!-- Step 2: Basic Info -->
                    <div class="usw-step ${this.currentStep === 2 ? 'active' : ''}" data-step="2">
                        ${this.getStep2HTML()}
                    </div>

                    <!-- Step 3: Extended Info -->
                    <div class="usw-step ${this.currentStep === 3 ? 'active' : ''}" data-step="3">
                        ${this.getStep3HTML()}
                    </div>

                    <!-- Step 4: Relationships -->
                    <div class="usw-step ${this.currentStep === 4 ? 'active' : ''}" data-step="4">
                        ${this.getStep4HTML()}
                    </div>

                    <!-- Step 5: Media -->
                    <div class="usw-step ${this.currentStep === 5 ? 'active' : ''}" data-step="5">
                        ${this.getStep5HTML()}
                    </div>

                    <!-- Step 6: Sources -->
                    <div class="usw-step ${this.currentStep === 6 ? 'active' : ''}" data-step="6">
                        ${this.getStep6HTML()}
                    </div>

                    <!-- Step 7: Preview -->
                    <div class="usw-step ${this.currentStep === 7 ? 'active' : ''}" data-step="7">
                        ${this.getStep7HTML()}
                    </div>
                </div>

                <!-- Navigation -->
                ${this.getNavigationHTML()}

                <!-- Draft indicator -->
                <div class="usw-draft-indicator" id="usw-draft-indicator">
                    <span class="usw-draft-status"></span>
                </div>
            </div>
        `;
    }

    /**
     * Progress bar HTML
     */
    getProgressBarHTML() {
        const steps = [
            { num: 1, label: 'Type' },
            { num: 2, label: 'Basic' },
            { num: 3, label: 'Extended' },
            { num: 4, label: 'Relations' },
            { num: 5, label: 'Media' },
            { num: 6, label: 'Sources' },
            { num: 7, label: 'Submit' }
        ];

        return `
            <div class="usw-progress">
                <div class="usw-progress-bar">
                    <div class="usw-progress-fill" id="usw-progress-fill"></div>
                </div>
                <div class="usw-progress-steps">
                    ${steps.map(step => `
                        <div class="usw-progress-step ${this.currentStep === step.num ? 'active' : ''} ${this.currentStep > step.num ? 'completed' : ''}" data-step="${step.num}">
                            <div class="usw-step-circle">${this.currentStep > step.num ? '&#10003;' : step.num}</div>
                            <span class="usw-step-label">${step.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Step 1: Asset Type Selection
     */
    getStep1HTML() {
        const types = Object.values(this.assetTypes);

        return `
            <h2 class="usw-step-title">Select Asset Type</h2>
            <p class="usw-step-description">Choose the type of mythological content you want to submit</p>

            <div class="usw-type-grid">
                ${types.map(type => `
                    <div class="usw-type-card ${this.formData.type === type.id ? 'selected' : ''}"
                         data-type="${type.id}"
                         style="--type-color: ${type.color}">
                        <div class="usw-type-icon">
                            <img src="${type.icon}" alt="${type.name}" onerror="this.outerHTML='<span class=\\'usw-type-emoji\\'>${type.emoji}</span>'">
                        </div>
                        <div class="usw-type-label">${type.name}</div>
                        <div class="usw-type-description">${type.description}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Drafts section -->
            <div class="usw-drafts-section" id="usw-drafts-section" style="display: none;">
                <h3 class="usw-section-title">Resume from Draft</h3>
                <div class="usw-drafts-list" id="usw-drafts-list"></div>
            </div>
        `;
    }

    /**
     * Step 2: Basic Information
     */
    getStep2HTML() {
        const selectedType = this.assetTypes[this.formData.type] || {};

        return `
            <h2 class="usw-step-title">Basic Information</h2>
            <p class="usw-step-description">Enter the essential details for your ${selectedType.name || 'entry'}</p>

            <div class="usw-form-container">
                <!-- Name -->
                <div class="usw-form-section">
                    <div class="usw-form-row">
                        <div class="usw-form-group usw-form-group-lg">
                            <label class="usw-label">Name <span class="usw-required">*</span></label>
                            <input type="text" class="usw-input" id="usw-name"
                                   value="${this.escapeHtml(this.formData.name)}"
                                   placeholder="Enter the name..." maxlength="200">
                            <span class="usw-hint">The primary name for this entity</span>
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">Emoji</label>
                            <input type="text" class="usw-input usw-input-emoji" id="usw-emoji"
                                   value="${this.formData.emoji}" placeholder="📌" maxlength="4">
                        </div>
                    </div>
                </div>

                <!-- Mythology -->
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Mythology</h3>
                    <div class="usw-form-row">
                        <div class="usw-form-group">
                            <label class="usw-label">Primary Mythology <span class="usw-required">*</span></label>
                            <select class="usw-select" id="usw-mythology">
                                ${this.mythologies.map(m =>
                                    `<option value="${m.value}" ${this.formData.mythology === m.value ? 'selected' : ''}>${m.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="usw-form-group">
                        <label class="usw-label">Also appears in</label>
                        <div class="usw-tag-list" id="usw-alt-mythologies-list">
                            ${this.formData.alternateMythologies.map(m =>
                                `<span class="usw-tag">${m}<button class="usw-tag-remove" data-value="${m}">&times;</button></span>`
                            ).join('')}
                        </div>
                        <div class="usw-add-tag">
                            <select class="usw-select" id="usw-alt-mythology-select">
                                ${this.mythologies.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
                            </select>
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-alt-mythology">Add</button>
                        </div>
                    </div>
                </div>

                <!-- Descriptions -->
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Descriptions</h3>
                    <div class="usw-form-group">
                        <label class="usw-label">Short Description <span class="usw-required">*</span></label>
                        <textarea class="usw-textarea" id="usw-short-desc" rows="2"
                                  placeholder="A brief one-line description..." maxlength="500">${this.escapeHtml(this.formData.shortDescription)}</textarea>
                        <span class="usw-hint"><span id="usw-short-desc-count">${this.formData.shortDescription.length}</span>/500 characters</span>
                    </div>
                    <div class="usw-form-group">
                        <label class="usw-label">Full Description <span class="usw-required">*</span></label>
                        <textarea class="usw-textarea" id="usw-long-desc" rows="6"
                                  placeholder="A comprehensive description...">${this.escapeHtml(this.formData.longDescription)}</textarea>
                        <span class="usw-hint">Supports basic markdown formatting</span>
                    </div>
                </div>

                <!-- Tags -->
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Tags</h3>
                    <div class="usw-tag-list" id="usw-tags-list">
                        ${this.formData.tags.map(tag =>
                            `<span class="usw-tag">${tag}<button class="usw-tag-remove" data-tag="${tag}">&times;</button></span>`
                        ).join('')}
                    </div>
                    <div class="usw-add-tag">
                        <input type="text" class="usw-input" id="usw-tag-input" placeholder="Add a tag..." maxlength="50">
                        <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-tag">Add</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 3: Extended Information (type-specific)
     */
    getStep3HTML() {
        const selectedType = this.assetTypes[this.formData.type];
        if (!selectedType) {
            return `
                <h2 class="usw-step-title">Extended Information</h2>
                <p class="usw-step-description">Please select an asset type first</p>
            `;
        }

        return `
            <h2 class="usw-step-title">Extended Information</h2>
            <p class="usw-step-description">Add detailed information specific to ${selectedType.name}</p>

            <div class="usw-form-container">
                <!-- Type-specific fields -->
                ${this.getTypeSpecificFieldsHTML(selectedType)}

                <!-- Extended sections -->
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Detailed Sections</h3>
                    <p class="usw-section-description">Add comprehensive information in structured sections</p>

                    ${selectedType.extendedSections.map((section, idx) => `
                        <div class="usw-extended-section" data-section="${section.id}">
                            <div class="usw-collapsible-header" data-collapse="${section.id}">
                                <h4 class="usw-subsection-title">${section.title}</h4>
                                <span class="usw-collapse-icon">&#9660;</span>
                            </div>
                            <div class="usw-collapsible-content" id="usw-collapse-${section.id}">
                                <textarea class="usw-textarea" id="usw-section-${section.id}" rows="4"
                                          placeholder="${section.placeholder}">${this.getExtendedSectionContent(section.id)}</textarea>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get type-specific form fields
     */
    getTypeSpecificFieldsHTML(type) {
        const fields = {
            deity: `
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Divine Attributes</h3>
                    <div class="usw-form-group">
                        <label class="usw-label">Domains <span class="usw-required">*</span></label>
                        <div class="usw-tag-list" id="usw-domains-list">
                            ${(this.formData.domains || []).map(d =>
                                `<span class="usw-tag">${d}<button class="usw-tag-remove" data-domain="${d}">&times;</button></span>`
                            ).join('')}
                        </div>
                        <div class="usw-add-tag">
                            <input type="text" class="usw-input" id="usw-domain-input" placeholder="e.g., War, Love, Wisdom...">
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-domain">Add</button>
                        </div>
                        <span class="usw-hint">Areas of influence or power</span>
                    </div>
                    <div class="usw-form-group">
                        <label class="usw-label">Symbols</label>
                        <div class="usw-tag-list" id="usw-symbols-list">
                            ${(this.formData.symbols || []).map(s =>
                                `<span class="usw-tag">${s}<button class="usw-tag-remove" data-symbol="${s}">&times;</button></span>`
                            ).join('')}
                        </div>
                        <div class="usw-add-tag">
                            <input type="text" class="usw-input" id="usw-symbol-input" placeholder="e.g., Lightning bolt, Owl...">
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-symbol">Add</button>
                        </div>
                    </div>
                </div>
            `,
            creature: `
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Creature Details</h3>
                    <div class="usw-form-row">
                        <div class="usw-form-group">
                            <label class="usw-label">Habitat</label>
                            <input type="text" class="usw-input" id="usw-habitat"
                                   value="${this.escapeHtml(this.formData.typeSpecific.habitat || '')}"
                                   placeholder="Where does it live?">
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">Diet</label>
                            <input type="text" class="usw-input" id="usw-diet"
                                   value="${this.escapeHtml(this.formData.typeSpecific.diet || '')}"
                                   placeholder="What does it eat?">
                        </div>
                    </div>
                    <div class="usw-form-group">
                        <label class="usw-label">Abilities</label>
                        <div class="usw-tag-list" id="usw-abilities-list">
                            ${(this.formData.powers || []).map(p =>
                                `<span class="usw-tag">${p}<button class="usw-tag-remove" data-ability="${p}">&times;</button></span>`
                            ).join('')}
                        </div>
                        <div class="usw-add-tag">
                            <input type="text" class="usw-input" id="usw-ability-input" placeholder="e.g., Fire breathing...">
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-ability">Add</button>
                        </div>
                    </div>
                </div>
            `,
            hero: `
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Hero Details</h3>
                    <div class="usw-form-row">
                        <div class="usw-form-group">
                            <label class="usw-label">Titles / Epithets</label>
                            <input type="text" class="usw-input" id="usw-titles"
                                   value="${this.escapeHtml(this.formData.typeSpecific.titles || '')}"
                                   placeholder="e.g., The Great, Son of Zeus...">
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">Birthplace</label>
                            <input type="text" class="usw-input" id="usw-birthplace"
                                   value="${this.escapeHtml(this.formData.typeSpecific.birthplace || '')}"
                                   placeholder="Where were they born?">
                        </div>
                    </div>
                    <div class="usw-form-group">
                        <label class="usw-label">Notable Weapons / Items</label>
                        <div class="usw-tag-list" id="usw-weapons-list">
                            ${(this.formData.typeSpecific.weapons || []).map(w =>
                                `<span class="usw-tag">${w}<button class="usw-tag-remove" data-weapon="${w}">&times;</button></span>`
                            ).join('')}
                        </div>
                        <div class="usw-add-tag">
                            <input type="text" class="usw-input" id="usw-weapon-input" placeholder="e.g., Excalibur...">
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-weapon">Add</button>
                        </div>
                    </div>
                </div>
            `,
            mythology: `
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Mythology System Details</h3>
                    <div class="usw-form-row">
                        <div class="usw-form-group">
                            <label class="usw-label">Region <span class="usw-required">*</span></label>
                            <input type="text" class="usw-input" id="usw-region"
                                   value="${this.escapeHtml(this.formData.typeSpecific.region || '')}"
                                   placeholder="e.g., Scandinavia, Mediterranean...">
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">Time Period <span class="usw-required">*</span></label>
                            <input type="text" class="usw-input" id="usw-period"
                                   value="${this.escapeHtml(this.formData.typeSpecific.period || '')}"
                                   placeholder="e.g., 3000 BCE - 500 CE">
                        </div>
                    </div>
                </div>
            `
        };

        return fields[type.id] || `
            <div class="usw-form-section">
                <h3 class="usw-section-title">Attributes</h3>
                <div class="usw-form-group">
                    <label class="usw-label">Key Attributes</label>
                    <div class="usw-tag-list" id="usw-attributes-list">
                        ${(this.formData.attributes || []).map(a =>
                            `<span class="usw-tag">${a}<button class="usw-tag-remove" data-attribute="${a}">&times;</button></span>`
                        ).join('')}
                    </div>
                    <div class="usw-add-tag">
                        <input type="text" class="usw-input" id="usw-attribute-input" placeholder="Add an attribute...">
                        <button type="button" class="usw-btn usw-btn-secondary" id="usw-add-attribute">Add</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 4: Relationships
     */
    getStep4HTML() {
        return `
            <h2 class="usw-step-title">Relationships</h2>
            <p class="usw-step-description">Connect this entry to other entities in the encyclopedia</p>

            <div class="usw-form-container">
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Related Entities</h3>

                    <div class="usw-relationship-list" id="usw-relationship-list">
                        ${this.formData.relationships.map((rel, idx) => `
                            <div class="usw-relationship-item" data-index="${idx}">
                                <span class="usw-rel-type-badge">${rel.type}</span>
                                <span class="usw-rel-entity-name">${rel.name}</span>
                                <span class="usw-rel-mythology">${rel.mythology || ''}</span>
                                <button class="usw-btn-remove" data-rel-index="${idx}">&times;</button>
                            </div>
                        `).join('')}
                        ${this.formData.relationships.length === 0 ?
                            '<p class="usw-placeholder-text">No relationships added yet</p>' : ''}
                    </div>

                    <div class="usw-add-relationship">
                        <h4 class="usw-subsection-title">Add Relationship</h4>
                        <div class="usw-form-row">
                            <div class="usw-form-group">
                                <label class="usw-label">Relationship Type</label>
                                <select class="usw-select" id="usw-rel-type">
                                    <option value="">Select type...</option>
                                    <option value="parent">Parent of</option>
                                    <option value="child">Child of</option>
                                    <option value="sibling">Sibling of</option>
                                    <option value="spouse">Spouse of</option>
                                    <option value="enemy">Enemy of</option>
                                    <option value="ally">Ally of</option>
                                    <option value="creator">Creator of</option>
                                    <option value="created_by">Created by</option>
                                    <option value="associated">Associated with</option>
                                    <option value="variant">Variant of</option>
                                    <option value="aspect">Aspect of</option>
                                    <option value="worshipped_by">Worshipped by</option>
                                    <option value="slayer">Slayer of</option>
                                    <option value="slain_by">Slain by</option>
                                </select>
                            </div>
                            <div class="usw-form-group usw-form-group-lg">
                                <label class="usw-label">Entity Name</label>
                                <input type="text" class="usw-input" id="usw-rel-name" placeholder="Search or enter entity name...">
                            </div>
                        </div>
                        <div class="usw-form-row">
                            <div class="usw-form-group">
                                <label class="usw-label">Entity Type</label>
                                <select class="usw-select" id="usw-rel-entity-type">
                                    <option value="">Any type</option>
                                    ${Object.values(this.assetTypes).map(t =>
                                        `<option value="${t.id}">${t.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="usw-form-group">
                                <label class="usw-label">Mythology</label>
                                <select class="usw-select" id="usw-rel-mythology">
                                    ${this.mythologies.map(m =>
                                        `<option value="${m.value}">${m.label}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="usw-form-group-btn">
                                <button type="button" class="usw-btn usw-btn-primary" id="usw-add-relationship">Add</button>
                            </div>
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">Notes (optional)</label>
                            <input type="text" class="usw-input" id="usw-rel-notes" placeholder="Additional context about this relationship...">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 5: Media
     */
    getStep5HTML() {
        return `
            <h2 class="usw-step-title">Media & Icon</h2>
            <p class="usw-step-description">Add a visual representation for your entry</p>

            <div class="usw-form-container">
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Icon Options</h3>

                    <div class="usw-icon-options">
                        <div class="usw-icon-option ${this.formData.iconMethod === 'generate' ? 'active' : ''}" data-method="generate">
                            <div class="usw-icon-option-icon">&#10024;</div>
                            <div class="usw-icon-option-label">AI Generate</div>
                            <div class="usw-icon-option-desc">Create SVG with AI</div>
                        </div>
                        <div class="usw-icon-option ${this.formData.iconMethod === 'upload' ? 'active' : ''}" data-method="upload">
                            <div class="usw-icon-option-icon">&#128247;</div>
                            <div class="usw-icon-option-label">Upload Image</div>
                            <div class="usw-icon-option-desc">JPG, PNG, or SVG</div>
                        </div>
                        <div class="usw-icon-option ${this.formData.iconMethod === 'url' ? 'active' : ''}" data-method="url">
                            <div class="usw-icon-option-icon">&#128279;</div>
                            <div class="usw-icon-option-label">Image URL</div>
                            <div class="usw-icon-option-desc">Link to existing image</div>
                        </div>
                    </div>

                    <!-- AI Generator Panel -->
                    <div class="usw-icon-panel" id="usw-icon-generate" ${this.formData.iconMethod !== 'generate' ? 'style="display:none"' : ''}>
                        <div class="usw-icon-generator">
                            <div class="usw-form-group">
                                <label class="usw-label">Describe the icon you want</label>
                                <textarea class="usw-textarea" id="usw-svg-prompt" rows="3"
                                          placeholder="e.g., A majestic eagle with spread wings, holding a lightning bolt, Greek style...">${this.formData.svgPrompt || ''}</textarea>
                            </div>
                            <div class="usw-form-row">
                                <div class="usw-form-group">
                                    <label class="usw-label">Style</label>
                                    <select class="usw-select" id="usw-svg-style">
                                        <option value="minimalist">Minimalist</option>
                                        <option value="detailed">Detailed</option>
                                        <option value="ancient">Ancient/Classical</option>
                                        <option value="modern">Modern</option>
                                        <option value="symbolic">Symbolic</option>
                                    </select>
                                </div>
                                <div class="usw-form-group">
                                    <label class="usw-label">Primary Color</label>
                                    <input type="color" class="usw-input-color" id="usw-svg-color" value="#9370DB">
                                </div>
                            </div>
                            <button type="button" class="usw-btn usw-btn-primary" id="usw-generate-svg">
                                <span class="usw-btn-icon">&#10024;</span> Generate SVG
                            </button>
                        </div>

                        <div class="usw-icon-preview">
                            <div class="usw-icon-preview-container" id="usw-svg-preview">
                                ${this.formData.svgIcon || '<span class="usw-preview-placeholder">Preview will appear here</span>'}
                            </div>
                            <div class="usw-icon-actions" ${!this.formData.svgIcon ? 'style="display:none"' : ''}>
                                <button type="button" class="usw-btn usw-btn-secondary" id="usw-regenerate-svg">Regenerate</button>
                                <button type="button" class="usw-btn usw-btn-secondary" id="usw-edit-svg">Edit SVG</button>
                            </div>
                        </div>
                    </div>

                    <!-- Upload Panel -->
                    <div class="usw-icon-panel" id="usw-icon-upload" ${this.formData.iconMethod !== 'upload' ? 'style="display:none"' : ''}>
                        <div class="usw-upload-zone" id="usw-upload-zone">
                            <div class="usw-upload-icon">&#128194;</div>
                            <div class="usw-upload-text">Drag & drop an image here</div>
                            <div class="usw-upload-or">or</div>
                            <input type="file" id="usw-file-input" accept="image/*" style="display:none">
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-browse-files">Browse Files</button>
                            <div class="usw-upload-hint">Max 5MB, JPG, PNG, or SVG</div>
                        </div>
                        <div class="usw-upload-preview" id="usw-upload-preview" style="display:none">
                            <img id="usw-uploaded-image" src="" alt="Preview">
                            <button type="button" class="usw-btn usw-btn-secondary" id="usw-remove-upload">Remove</button>
                        </div>
                    </div>

                    <!-- URL Panel -->
                    <div class="usw-icon-panel" id="usw-icon-url" ${this.formData.iconMethod !== 'url' ? 'style="display:none"' : ''}>
                        <div class="usw-form-group">
                            <label class="usw-label">Image URL</label>
                            <input type="url" class="usw-input" id="usw-image-url"
                                   value="${this.escapeHtml(this.formData.imageUrl)}"
                                   placeholder="https://example.com/image.png">
                        </div>
                        <button type="button" class="usw-btn usw-btn-secondary" id="usw-preview-url">Preview</button>
                        <div class="usw-url-preview" id="usw-url-preview" style="display:none">
                            <img id="usw-url-image" src="" alt="Preview">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 6: Sources & Citations
     */
    getStep6HTML() {
        return `
            <h2 class="usw-step-title">Sources & Citations</h2>
            <p class="usw-step-description">Add references to support your submission</p>

            <div class="usw-form-container">
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Sources</h3>

                    <div class="usw-source-list" id="usw-source-list">
                        ${this.formData.sources.map((source, idx) => `
                            <div class="usw-source-item" data-index="${idx}">
                                <span class="usw-source-type-badge">${source.type}</span>
                                <div class="usw-source-info">
                                    <span class="usw-source-title">${this.escapeHtml(source.title)}</span>
                                    ${source.author ? `<span class="usw-source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                                </div>
                                <button class="usw-btn-remove" data-source-index="${idx}">&times;</button>
                            </div>
                        `).join('')}
                        ${this.formData.sources.length === 0 ?
                            '<p class="usw-placeholder-text">No sources added yet. Adding sources improves credibility.</p>' : ''}
                    </div>

                    <div class="usw-add-source">
                        <h4 class="usw-subsection-title">Add Source</h4>
                        <div class="usw-form-row">
                            <div class="usw-form-group">
                                <label class="usw-label">Source Type</label>
                                <select class="usw-select" id="usw-source-type">
                                    <option value="book">Book</option>
                                    <option value="article">Academic Article</option>
                                    <option value="website">Website</option>
                                    <option value="primary">Primary Source</option>
                                    <option value="encyclopedia">Encyclopedia</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div class="usw-form-group usw-form-group-lg">
                                <label class="usw-label">Title</label>
                                <input type="text" class="usw-input" id="usw-source-title" placeholder="Title of the source...">
                            </div>
                        </div>
                        <div class="usw-form-row">
                            <div class="usw-form-group">
                                <label class="usw-label">Author(s)</label>
                                <input type="text" class="usw-input" id="usw-source-author" placeholder="Author name(s)...">
                            </div>
                            <div class="usw-form-group">
                                <label class="usw-label">Year</label>
                                <input type="text" class="usw-input usw-input-sm" id="usw-source-year" placeholder="YYYY">
                            </div>
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">URL (if applicable)</label>
                            <input type="url" class="usw-input" id="usw-source-url" placeholder="https://...">
                        </div>
                        <div class="usw-form-group">
                            <label class="usw-label">Notes / Page Numbers</label>
                            <input type="text" class="usw-input" id="usw-source-notes" placeholder="pp. 45-67, Chapter 3...">
                        </div>
                        <button type="button" class="usw-btn usw-btn-primary" id="usw-add-source">Add Source</button>
                    </div>
                </div>

                <!-- Corpus Query Builder -->
                <div class="usw-form-section">
                    <h3 class="usw-section-title">Corpus Citation Finder</h3>
                    <p class="usw-section-description">Search our corpus for relevant citations</p>

                    <div class="usw-corpus-search">
                        <div class="usw-form-row">
                            <div class="usw-form-group usw-form-group-lg">
                                <input type="text" class="usw-input" id="usw-corpus-query"
                                       placeholder="Search for citations about ${this.formData.name || 'your topic'}...">
                            </div>
                            <div class="usw-form-group-btn">
                                <button type="button" class="usw-btn usw-btn-secondary" id="usw-search-corpus">Search</button>
                            </div>
                        </div>
                        <div class="usw-corpus-results" id="usw-corpus-results" style="display:none">
                            <!-- Results will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Step 7: Preview & Submit
     */
    getStep7HTML() {
        const selectedType = this.assetTypes[this.formData.type] || {};

        return `
            <h2 class="usw-step-title">Preview & Submit</h2>
            <p class="usw-step-description">Review your submission before sending</p>

            <div class="usw-preview">
                <div class="usw-preview-header">
                    <div class="usw-preview-icon" id="usw-preview-icon">
                        ${this.formData.svgIcon ||
                          (this.formData.imageUrl ? `<img src="${this.formData.imageUrl}" alt="">` :
                           `<span class="usw-preview-emoji">${this.formData.emoji || selectedType.emoji || '📌'}</span>`)}
                    </div>
                    <div class="usw-preview-title-section">
                        <h3 class="usw-preview-name">${this.escapeHtml(this.formData.name) || 'Untitled'}</h3>
                        <div class="usw-preview-badges">
                            <span class="usw-badge usw-badge-type">${selectedType.name || 'Unknown Type'}</span>
                            <span class="usw-badge usw-badge-mythology">${this.formData.mythology || 'No mythology'}</span>
                        </div>
                    </div>
                </div>

                <div class="usw-preview-section">
                    <h4>Short Description</h4>
                    <p class="usw-preview-short">${this.escapeHtml(this.formData.shortDescription) || 'No description provided'}</p>
                </div>

                <div class="usw-preview-section">
                    <h4>Full Description</h4>
                    <p class="usw-preview-content">${this.escapeHtml(this.formData.longDescription) || 'No description provided'}</p>
                </div>

                ${this.formData.domains && this.formData.domains.length > 0 ? `
                    <div class="usw-preview-section">
                        <h4>Domains</h4>
                        <div class="usw-preview-tags">
                            ${this.formData.domains.map(d => `<span class="usw-tag">${d}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${this.formData.tags && this.formData.tags.length > 0 ? `
                    <div class="usw-preview-section">
                        <h4>Tags</h4>
                        <div class="usw-preview-tags">
                            ${this.formData.tags.map(t => `<span class="usw-tag">${t}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${this.formData.relationships && this.formData.relationships.length > 0 ? `
                    <div class="usw-preview-section">
                        <h4>Relationships</h4>
                        <ul class="usw-preview-relationships">
                            ${this.formData.relationships.map(r =>
                                `<li><strong>${r.type}:</strong> ${r.name}${r.mythology ? ` (${r.mythology})` : ''}</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${this.formData.sources && this.formData.sources.length > 0 ? `
                    <div class="usw-preview-section">
                        <h4>Sources (${this.formData.sources.length})</h4>
                        <ul class="usw-preview-sources">
                            ${this.formData.sources.map(s =>
                                `<li>${s.author ? s.author + '. ' : ''}${s.title}${s.year ? ` (${s.year})` : ''}</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="usw-preview-notice">
                    <p><strong>Note:</strong> Your submission will be reviewed by our team before publication.
                    You will receive a notification when your submission is approved or if changes are needed.</p>
                </div>
            </div>

            <!-- Validation Summary -->
            <div class="usw-validation-summary" id="usw-validation-summary"></div>
        `;
    }

    /**
     * Get navigation HTML
     */
    getNavigationHTML() {
        return `
            <div class="usw-nav">
                <button type="button" class="usw-btn usw-btn-secondary" id="usw-prev" ${this.currentStep === 1 ? 'disabled' : ''}>
                    <span class="usw-btn-icon">&#8592;</span> Previous
                </button>
                <span class="usw-step-indicator">Step ${this.currentStep} of ${this.totalSteps}</span>
                <button type="button" class="usw-btn usw-btn-primary" id="usw-next" ${this.currentStep === 1 && !this.formData.type ? 'disabled' : ''}>
                    ${this.currentStep === this.totalSteps ?
                        '<span class="usw-btn-icon">&#10003;</span> Submit' :
                        'Next <span class="usw-btn-icon">&#8594;</span>'}
                </button>
            </div>
        `;
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Navigation
        this.container.querySelector('#usw-prev')?.addEventListener('click', () => this.previousStep());
        this.container.querySelector('#usw-next')?.addEventListener('click', () => this.nextStep());

        // Type selection
        this.container.querySelectorAll('.usw-type-card').forEach(card => {
            card.addEventListener('click', () => this.selectType(card.dataset.type));
        });

        // Step-specific listeners
        this.attachStep2Listeners();
        this.attachStep3Listeners();
        this.attachStep4Listeners();
        this.attachStep5Listeners();
        this.attachStep6Listeners();

        // Progress step clicks
        this.container.querySelectorAll('.usw-progress-step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNum = parseInt(step.dataset.step);
                if (stepNum < this.currentStep) {
                    this.goToStep(stepNum);
                }
            });
        });

        // Mark form as dirty on any input change
        this.container.addEventListener('input', () => { this.isDirty = true; });
        this.container.addEventListener('change', () => { this.isDirty = true; });
    }

    /**
     * Attach Step 2 listeners
     */
    attachStep2Listeners() {
        // Name input
        this.container.querySelector('#usw-name')?.addEventListener('input', (e) => {
            this.formData.name = e.target.value;
        });

        // Emoji
        this.container.querySelector('#usw-emoji')?.addEventListener('input', (e) => {
            this.formData.emoji = e.target.value;
        });

        // Mythology
        this.container.querySelector('#usw-mythology')?.addEventListener('change', (e) => {
            this.formData.mythology = e.target.value;
        });

        // Add alternate mythology
        this.container.querySelector('#usw-add-alt-mythology')?.addEventListener('click', () => {
            const select = this.container.querySelector('#usw-alt-mythology-select');
            const value = select.value;
            if (value && !this.formData.alternateMythologies.includes(value)) {
                this.formData.alternateMythologies.push(value);
                this.refreshTagList('usw-alt-mythologies-list', this.formData.alternateMythologies, 'value');
            }
        });

        // Descriptions
        this.container.querySelector('#usw-short-desc')?.addEventListener('input', (e) => {
            this.formData.shortDescription = e.target.value;
            const counter = this.container.querySelector('#usw-short-desc-count');
            if (counter) counter.textContent = e.target.value.length;
        });

        this.container.querySelector('#usw-long-desc')?.addEventListener('input', (e) => {
            this.formData.longDescription = e.target.value;
        });

        // Tags
        this.container.querySelector('#usw-add-tag')?.addEventListener('click', () => {
            const input = this.container.querySelector('#usw-tag-input');
            const tag = input.value.trim().toLowerCase();
            if (tag && !this.formData.tags.includes(tag)) {
                this.formData.tags.push(tag);
                this.refreshTagList('usw-tags-list', this.formData.tags, 'tag');
                input.value = '';
            }
        });

        // Handle tag input Enter key
        this.container.querySelector('#usw-tag-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.container.querySelector('#usw-add-tag')?.click();
            }
        });

        // Tag removal delegation
        this.container.querySelector('#usw-tags-list')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('usw-tag-remove')) {
                const tag = e.target.dataset.tag;
                this.formData.tags = this.formData.tags.filter(t => t !== tag);
                this.refreshTagList('usw-tags-list', this.formData.tags, 'tag');
            }
        });
    }

    /**
     * Attach Step 3 listeners (type-specific)
     */
    attachStep3Listeners() {
        // Domains (for deities)
        this.container.querySelector('#usw-add-domain')?.addEventListener('click', () => {
            const input = this.container.querySelector('#usw-domain-input');
            const domain = input.value.trim();
            if (domain && !this.formData.domains.includes(domain)) {
                this.formData.domains.push(domain);
                this.refreshTagList('usw-domains-list', this.formData.domains, 'domain');
                input.value = '';
            }
        });

        // Symbols
        this.container.querySelector('#usw-add-symbol')?.addEventListener('click', () => {
            const input = this.container.querySelector('#usw-symbol-input');
            const symbol = input.value.trim();
            if (symbol && !this.formData.symbols.includes(symbol)) {
                this.formData.symbols.push(symbol);
                this.refreshTagList('usw-symbols-list', this.formData.symbols, 'symbol');
                input.value = '';
            }
        });

        // Abilities (for creatures)
        this.container.querySelector('#usw-add-ability')?.addEventListener('click', () => {
            const input = this.container.querySelector('#usw-ability-input');
            const ability = input.value.trim();
            if (ability && !this.formData.powers.includes(ability)) {
                this.formData.powers.push(ability);
                this.refreshTagList('usw-abilities-list', this.formData.powers, 'ability');
                input.value = '';
            }
        });

        // Collapsible sections
        this.container.querySelectorAll('.usw-collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const sectionId = header.dataset.collapse;
                const content = this.container.querySelector(`#usw-collapse-${sectionId}`);
                const icon = header.querySelector('.usw-collapse-icon');
                if (content) {
                    content.classList.toggle('collapsed');
                    icon.textContent = content.classList.contains('collapsed') ? '\u25B6' : '\u25BC';
                }
            });
        });

        // Extended section content
        this.container.querySelectorAll('[id^="usw-section-"]').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const sectionId = e.target.id.replace('usw-section-', '');
                this.setExtendedSectionContent(sectionId, e.target.value);
            });
        });

        // Type-specific fields
        ['habitat', 'diet', 'titles', 'birthplace', 'region', 'period'].forEach(field => {
            this.container.querySelector(`#usw-${field}`)?.addEventListener('input', (e) => {
                this.formData.typeSpecific[field] = e.target.value;
            });
        });
    }

    /**
     * Attach Step 4 listeners (Relationships)
     */
    attachStep4Listeners() {
        // Add relationship
        this.container.querySelector('#usw-add-relationship')?.addEventListener('click', () => {
            const type = this.container.querySelector('#usw-rel-type')?.value;
            const name = this.container.querySelector('#usw-rel-name')?.value.trim();
            const entityType = this.container.querySelector('#usw-rel-entity-type')?.value;
            const mythology = this.container.querySelector('#usw-rel-mythology')?.value;
            const notes = this.container.querySelector('#usw-rel-notes')?.value.trim();

            if (type && name) {
                this.formData.relationships.push({ type, name, entityType, mythology, notes });
                this.refreshRelationshipList();

                // Clear inputs
                this.container.querySelector('#usw-rel-type').value = '';
                this.container.querySelector('#usw-rel-name').value = '';
                this.container.querySelector('#usw-rel-notes').value = '';
            }
        });

        // Remove relationship delegation
        this.container.querySelector('#usw-relationship-list')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('usw-btn-remove')) {
                const idx = parseInt(e.target.dataset.relIndex);
                this.formData.relationships.splice(idx, 1);
                this.refreshRelationshipList();
            }
        });
    }

    /**
     * Attach Step 5 listeners (Media)
     */
    attachStep5Listeners() {
        // Icon method selection
        this.container.querySelectorAll('.usw-icon-option').forEach(option => {
            option.addEventListener('click', () => {
                const method = option.dataset.method;
                this.formData.iconMethod = method;

                // Update active state
                this.container.querySelectorAll('.usw-icon-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                // Show/hide panels
                this.container.querySelectorAll('.usw-icon-panel').forEach(p => p.style.display = 'none');
                this.container.querySelector(`#usw-icon-${method}`).style.display = 'block';
            });
        });

        // SVG generation
        this.container.querySelector('#usw-generate-svg')?.addEventListener('click', () => this.generateSVG());
        this.container.querySelector('#usw-regenerate-svg')?.addEventListener('click', () => this.generateSVG());

        // File upload
        this.container.querySelector('#usw-browse-files')?.addEventListener('click', () => {
            this.container.querySelector('#usw-file-input')?.click();
        });

        this.container.querySelector('#usw-file-input')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Drag and drop
        const uploadZone = this.container.querySelector('#usw-upload-zone');
        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });
            uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) this.handleFileUpload(file);
            });
        }

        // URL preview
        this.container.querySelector('#usw-preview-url')?.addEventListener('click', () => {
            const url = this.container.querySelector('#usw-image-url')?.value;
            if (url) {
                this.formData.imageUrl = url;
                const preview = this.container.querySelector('#usw-url-preview');
                const img = this.container.querySelector('#usw-url-image');
                img.src = url;
                preview.style.display = 'block';
            }
        });

        this.container.querySelector('#usw-image-url')?.addEventListener('input', (e) => {
            this.formData.imageUrl = e.target.value;
        });
    }

    /**
     * Attach Step 6 listeners (Sources)
     */
    attachStep6Listeners() {
        // Add source
        this.container.querySelector('#usw-add-source')?.addEventListener('click', () => {
            const type = this.container.querySelector('#usw-source-type')?.value;
            const title = this.container.querySelector('#usw-source-title')?.value.trim();
            const author = this.container.querySelector('#usw-source-author')?.value.trim();
            const year = this.container.querySelector('#usw-source-year')?.value.trim();
            const url = this.container.querySelector('#usw-source-url')?.value.trim();
            const notes = this.container.querySelector('#usw-source-notes')?.value.trim();

            if (title) {
                this.formData.sources.push({ type, title, author, year, url, notes });
                this.refreshSourceList();

                // Clear inputs
                this.container.querySelector('#usw-source-title').value = '';
                this.container.querySelector('#usw-source-author').value = '';
                this.container.querySelector('#usw-source-year').value = '';
                this.container.querySelector('#usw-source-url').value = '';
                this.container.querySelector('#usw-source-notes').value = '';
            }
        });

        // Remove source delegation
        this.container.querySelector('#usw-source-list')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('usw-btn-remove')) {
                const idx = parseInt(e.target.dataset.sourceIndex);
                this.formData.sources.splice(idx, 1);
                this.refreshSourceList();
            }
        });

        // Corpus search
        this.container.querySelector('#usw-search-corpus')?.addEventListener('click', () => this.searchCorpus());
    }

    /**
     * Select asset type
     */
    selectType(typeId) {
        this.formData.type = typeId;

        // Update UI
        this.container.querySelectorAll('.usw-type-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.type === typeId);
        });

        // Enable next button
        const nextBtn = this.container.querySelector('#usw-next');
        if (nextBtn) nextBtn.disabled = false;

        this.isDirty = true;
    }

    /**
     * Navigate to next step
     */
    async nextStep() {
        // Validate current step
        const validation = this.validateStep(this.currentStep);
        if (!validation.valid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // If on last step, submit
        if (this.currentStep === this.totalSteps) {
            await this.submit();
            return;
        }

        // Save form data from current step before moving
        this.saveCurrentStepData();

        this.currentStep++;
        this.updateWizardUI();
    }

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.saveCurrentStepData();
            this.currentStep--;
            this.updateWizardUI();
        }
    }

    /**
     * Go to specific step
     */
    goToStep(stepNum) {
        if (stepNum >= 1 && stepNum <= this.totalSteps) {
            this.saveCurrentStepData();
            this.currentStep = stepNum;
            this.updateWizardUI();
        }
    }

    /**
     * Update wizard UI after step change
     */
    updateWizardUI() {
        // Update step visibility
        this.container.querySelectorAll('.usw-step').forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === this.currentStep);
        });

        // Re-render current step content
        const currentStepEl = this.container.querySelector(`.usw-step[data-step="${this.currentStep}"]`);
        if (currentStepEl) {
            switch (this.currentStep) {
                case 2: currentStepEl.innerHTML = this.getStep2HTML(); this.attachStep2Listeners(); break;
                case 3: currentStepEl.innerHTML = this.getStep3HTML(); this.attachStep3Listeners(); break;
                case 4: currentStepEl.innerHTML = this.getStep4HTML(); this.attachStep4Listeners(); break;
                case 5: currentStepEl.innerHTML = this.getStep5HTML(); this.attachStep5Listeners(); break;
                case 6: currentStepEl.innerHTML = this.getStep6HTML(); this.attachStep6Listeners(); break;
                case 7: currentStepEl.innerHTML = this.getStep7HTML(); break;
            }
        }

        // Update progress bar
        this.updateProgressBar();

        // Update navigation
        const navContainer = this.container.querySelector('.usw-nav');
        if (navContainer) {
            navContainer.outerHTML = this.getNavigationHTML();
            this.container.querySelector('#usw-prev')?.addEventListener('click', () => this.previousStep());
            this.container.querySelector('#usw-next')?.addEventListener('click', () => this.nextStep());
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const fill = this.container.querySelector('#usw-progress-fill');
        if (fill) {
            const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
            fill.style.width = `${progress}%`;
        }

        this.container.querySelectorAll('.usw-progress-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === this.currentStep);
            step.classList.toggle('completed', stepNum < this.currentStep);

            const circle = step.querySelector('.usw-step-circle');
            if (circle) {
                circle.innerHTML = stepNum < this.currentStep ? '&#10003;' : stepNum;
            }
        });
    }

    /**
     * Validate current step
     */
    validateStep(stepNum) {
        const errors = [];

        switch (stepNum) {
            case 1:
                if (!this.formData.type) errors.push('Please select an asset type');
                break;
            case 2:
                if (!this.formData.name?.trim()) errors.push('Name is required');
                if (!this.formData.mythology) errors.push('Primary mythology is required');
                if (!this.formData.shortDescription?.trim()) errors.push('Short description is required');
                if (!this.formData.longDescription?.trim()) errors.push('Full description is required');
                break;
            case 3:
                const type = this.assetTypes[this.formData.type];
                if (type?.requiredFields) {
                    type.requiredFields.forEach(field => {
                        if (field === 'domains' && (!this.formData.domains || this.formData.domains.length === 0)) {
                            errors.push('At least one domain is required for deities');
                        }
                        if (field === 'region' && !this.formData.typeSpecific?.region?.trim()) {
                            errors.push('Region is required for mythology systems');
                        }
                        if (field === 'period' && !this.formData.typeSpecific?.period?.trim()) {
                            errors.push('Time period is required for mythology systems');
                        }
                    });
                }
                break;
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        const summary = this.container.querySelector('#usw-validation-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="usw-validation-errors">
                    <h4>Please fix the following:</h4>
                    <ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>
                </div>
            `;
            summary.style.display = 'block';
        } else {
            alert(errors.join('\n'));
        }
    }

    /**
     * Submit the form
     */
    async submit() {
        try {
            const nextBtn = this.container.querySelector('#usw-next');
            if (nextBtn) {
                nextBtn.disabled = true;
                nextBtn.innerHTML = '<span class="usw-spinner"></span> Submitting...';
            }

            // Prepare submission data
            const submissionData = this.prepareSubmissionData();

            // Submit through service
            if (this.submissionService) {
                const result = await this.submissionService.submitContent(submissionData, this.formData.type);

                if (result.success) {
                    this.showSuccessState(result.submissionId);
                    this.clearDraft();
                    if (this.onSubmitSuccess) this.onSubmitSuccess(result);
                } else {
                    throw new Error(result.error || 'Submission failed');
                }
            } else {
                // Fallback: just show success for demo
                console.log('Submission data:', submissionData);
                this.showSuccessState('demo-' + Date.now());
            }

        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit: ' + error.message);

            const nextBtn = this.container.querySelector('#usw-next');
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.innerHTML = '<span class="usw-btn-icon">&#10003;</span> Submit';
            }
        }
    }

    /**
     * Prepare data for submission
     */
    prepareSubmissionData() {
        return {
            name: this.formData.name,
            primaryMythology: this.formData.mythology,
            alternateMythologies: this.formData.alternateMythologies,
            shortDescription: this.formData.shortDescription,
            longDescription: this.formData.longDescription,
            type: this.formData.type,
            emoji: this.formData.emoji,
            domains: this.formData.domains,
            attributes: this.formData.attributes,
            powers: this.formData.powers,
            symbols: this.formData.symbols,
            relationships: this.formData.relationships,
            svgIcon: this.formData.svgIcon,
            imageUrl: this.formData.imageUrl,
            sources: this.formData.sources,
            tags: this.formData.tags,
            extendedContent: this.formData.extendedSections,
            ...this.formData.typeSpecific
        };
    }

    /**
     * Show success state
     */
    showSuccessState(submissionId) {
        const body = this.container.querySelector('.usw-body');
        body.innerHTML = `
            <div class="usw-success-state">
                <div class="usw-success-icon">&#10003;</div>
                <h2 class="usw-success-title">Submission Complete!</h2>
                <p class="usw-success-message">Your ${this.assetTypes[this.formData.type]?.name || 'content'} "${this.formData.name}" has been submitted for review.</p>
                <p class="usw-success-info">Submission ID: <code>${submissionId}</code></p>
                <p class="usw-success-note">You will receive a notification when your submission is reviewed.</p>
                <div class="usw-success-actions">
                    <button class="usw-btn usw-btn-primary" onclick="window.location.reload()">Submit Another</button>
                    <button class="usw-btn usw-btn-secondary" onclick="window.location.hash='#/dashboard'">View My Submissions</button>
                </div>
            </div>
        `;

        // Hide navigation and progress
        this.container.querySelector('.usw-nav').style.display = 'none';
        this.container.querySelector('.usw-progress').style.display = 'none';
    }

    // Helper methods

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    refreshTagList(listId, items, dataAttr) {
        const list = this.container.querySelector(`#${listId}`);
        if (list) {
            list.innerHTML = items.map(item =>
                `<span class="usw-tag">${item}<button class="usw-tag-remove" data-${dataAttr}="${item}">&times;</button></span>`
            ).join('');
        }
    }

    refreshRelationshipList() {
        const list = this.container.querySelector('#usw-relationship-list');
        if (list) {
            if (this.formData.relationships.length === 0) {
                list.innerHTML = '<p class="usw-placeholder-text">No relationships added yet</p>';
            } else {
                list.innerHTML = this.formData.relationships.map((rel, idx) => `
                    <div class="usw-relationship-item" data-index="${idx}">
                        <span class="usw-rel-type-badge">${rel.type}</span>
                        <span class="usw-rel-entity-name">${rel.name}</span>
                        <span class="usw-rel-mythology">${rel.mythology || ''}</span>
                        <button class="usw-btn-remove" data-rel-index="${idx}">&times;</button>
                    </div>
                `).join('');
            }
        }
    }

    refreshSourceList() {
        const list = this.container.querySelector('#usw-source-list');
        if (list) {
            if (this.formData.sources.length === 0) {
                list.innerHTML = '<p class="usw-placeholder-text">No sources added yet. Adding sources improves credibility.</p>';
            } else {
                list.innerHTML = this.formData.sources.map((source, idx) => `
                    <div class="usw-source-item" data-index="${idx}">
                        <span class="usw-source-type-badge">${source.type}</span>
                        <div class="usw-source-info">
                            <span class="usw-source-title">${this.escapeHtml(source.title)}</span>
                            ${source.author ? `<span class="usw-source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                        </div>
                        <button class="usw-btn-remove" data-source-index="${idx}">&times;</button>
                    </div>
                `).join('');
            }
        }
    }

    getExtendedSectionContent(sectionId) {
        const section = this.formData.extendedSections.find(s => s.id === sectionId);
        return section ? section.content : '';
    }

    setExtendedSectionContent(sectionId, content) {
        const idx = this.formData.extendedSections.findIndex(s => s.id === sectionId);
        if (idx >= 0) {
            this.formData.extendedSections[idx].content = content;
        } else {
            this.formData.extendedSections.push({ id: sectionId, content });
        }
    }

    saveCurrentStepData() {
        // Data is saved via event listeners, but we can add additional logic here
        this.isDirty = true;
    }

    // Draft management

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty) {
                this.saveDraft();
            }
        }, 30000); // 30 seconds
    }

    saveDraft() {
        try {
            const draftKey = `usw_draft_${Date.now()}`;
            const draft = {
                id: draftKey,
                formData: this.formData,
                currentStep: this.currentStep,
                savedAt: new Date().toISOString(),
                type: this.formData.type,
                name: this.formData.name || 'Untitled'
            };

            // Get existing drafts
            const drafts = JSON.parse(localStorage.getItem('usw_drafts') || '[]');

            // Remove old draft for same type/name if exists
            const existing = drafts.findIndex(d => d.type === draft.type && d.name === draft.name);
            if (existing >= 0) drafts.splice(existing, 1);

            // Add new draft
            drafts.unshift(draft);

            // Keep only last 5 drafts
            while (drafts.length > 5) drafts.pop();

            localStorage.setItem('usw_drafts', JSON.stringify(drafts));

            this.isDirty = false;
            this.lastSaveTime = new Date();
            this.updateDraftIndicator('Saved');

        } catch (error) {
            console.error('Failed to save draft:', error);
        }
    }

    loadDrafts() {
        try {
            this.drafts = JSON.parse(localStorage.getItem('usw_drafts') || '[]');

            if (this.drafts.length > 0) {
                const section = this.container.querySelector('#usw-drafts-section');
                const list = this.container.querySelector('#usw-drafts-list');

                if (section && list) {
                    section.style.display = 'block';
                    list.innerHTML = this.drafts.map(draft => `
                        <div class="usw-draft-item" data-draft-id="${draft.id}">
                            <span class="usw-draft-type">${this.assetTypes[draft.type]?.emoji || '📄'}</span>
                            <div class="usw-draft-info">
                                <span class="usw-draft-name">${draft.name}</span>
                                <span class="usw-draft-date">${new Date(draft.savedAt).toLocaleString()}</span>
                            </div>
                            <button class="usw-btn usw-btn-secondary usw-btn-sm" onclick="window.universalWizard.loadDraft('${draft.id}')">Resume</button>
                            <button class="usw-btn-remove" onclick="window.universalWizard.deleteDraft('${draft.id}')">&times;</button>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Failed to load drafts:', error);
        }
    }

    loadDraft(draftId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (draft) {
            this.formData = draft.formData;
            this.currentStep = draft.currentStep || 1;
            this.updateWizardUI();
        }
    }

    deleteDraft(draftId) {
        this.drafts = this.drafts.filter(d => d.id !== draftId);
        localStorage.setItem('usw_drafts', JSON.stringify(this.drafts));
        this.loadDrafts();
    }

    clearDraft() {
        if (this.formData.type && this.formData.name) {
            this.drafts = this.drafts.filter(d => !(d.type === this.formData.type && d.name === this.formData.name));
            localStorage.setItem('usw_drafts', JSON.stringify(this.drafts));
        }
    }

    updateDraftIndicator(status) {
        const indicator = this.container.querySelector('.usw-draft-status');
        if (indicator) {
            indicator.textContent = status;
            indicator.parentElement.classList.add('show');
            setTimeout(() => indicator.parentElement.classList.remove('show'), 2000);
        }
    }

    // Media methods

    async generateSVG() {
        const prompt = this.container.querySelector('#usw-svg-prompt')?.value;
        const style = this.container.querySelector('#usw-svg-style')?.value;
        const color = this.container.querySelector('#usw-svg-color')?.value;

        if (!prompt) {
            alert('Please describe the icon you want to generate');
            return;
        }

        // Show loading state
        const preview = this.container.querySelector('#usw-svg-preview');
        preview.innerHTML = '<div class="usw-spinner"></div><p>Generating...</p>';

        try {
            // This would connect to an AI service - for now, generate a placeholder
            const svg = this.generatePlaceholderSVG(prompt, color);
            this.formData.svgIcon = svg;
            preview.innerHTML = svg;

            // Show action buttons
            this.container.querySelector('.usw-icon-actions').style.display = 'flex';

        } catch (error) {
            console.error('SVG generation failed:', error);
            preview.innerHTML = '<p class="usw-error">Failed to generate SVG. Please try again.</p>';
        }
    }

    generatePlaceholderSVG(prompt, color) {
        // Simple placeholder SVG generator
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="2"/>
            <text x="50" y="55" text-anchor="middle" fill="${color}" font-size="12" font-family="sans-serif">Generated</text>
        </svg>`;
    }

    async handleFileUpload(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.formData.imageUrl = e.target.result;

            const preview = this.container.querySelector('#usw-upload-preview');
            const img = this.container.querySelector('#usw-uploaded-image');
            const zone = this.container.querySelector('#usw-upload-zone');

            img.src = e.target.result;
            preview.style.display = 'block';
            zone.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    async searchCorpus() {
        const query = this.container.querySelector('#usw-corpus-query')?.value;
        if (!query) return;

        const results = this.container.querySelector('#usw-corpus-results');
        results.style.display = 'block';
        results.innerHTML = '<div class="usw-spinner"></div><p>Searching...</p>';

        // Placeholder - would connect to corpus search service
        setTimeout(() => {
            results.innerHTML = `
                <p class="usw-placeholder-text">Corpus search is not yet implemented.
                Please add sources manually using the form above.</p>
            `;
        }, 1000);
    }

    // Cleanup
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        if (this.isDirty) {
            this.saveDraft();
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.UniversalSubmissionWizard = UniversalSubmissionWizard;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalSubmissionWizard;
}
