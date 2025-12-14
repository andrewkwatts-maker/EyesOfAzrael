/**
 * Universal Entity Editor
 * Eyes of Azrael - Entity Creation and Editing System
 *
 * Provides a comprehensive interface for creating and editing all entity types:
 * - Deities, Heroes, Creatures, Items, Places, Concepts, Magic, Theories, Mythologies
 *
 * Features:
 * - Type-specific field rendering
 * - Auto-save to Firebase with user authentication
 * - Markdown preview for description fields
 * - Cross-reference picker
 * - Image upload for hero images
 * - Tag input system
 * - Form validation
 * - Draft vs Submit workflow
 */

class EntityEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.options = {
            mode: options.mode || 'create', // 'create' or 'edit'
            entityType: options.entityType || null,
            entityId: options.entityId || null,
            onSave: options.onSave || null,
            onError: options.onError || null,
            autoSave: options.autoSave !== false,
            autoSaveInterval: options.autoSaveInterval || 30000, // 30 seconds
            ...options
        };

        this.currentEntity = null;
        this.currentType = this.options.entityType;
        this.formData = {};
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.crossReferenceCache = {};
        this.validationErrors = {};

        this.init();
    }

    /**
     * Initialize the editor
     */
    async init() {
        try {
            // Wait for Firebase to be ready
            await waitForFirebase();

            // Load existing entity if in edit mode
            if (this.options.mode === 'edit' && this.options.entityId) {
                await this.loadEntity(this.options.entityId, this.options.entityType);
            }

            // Render the editor
            this.render();

            // Setup auto-save
            if (this.options.autoSave) {
                this.setupAutoSave();
            }

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

        } catch (error) {
            console.error('Error initializing entity editor:', error);
            this.showError('Failed to initialize editor: ' + error.message);
        }
    }

    /**
     * Load existing entity from Firestore
     */
    async loadEntity(id, type) {
        try {
            const collection = EntityLoader.getCollectionName(type);
            const doc = await db.collection(collection).doc(id).get();

            if (!doc.exists) {
                throw new Error(`Entity ${id} not found in ${collection}`);
            }

            this.currentEntity = { id: doc.id, ...doc.data() };
            this.currentType = type;
            this.formData = { ...this.currentEntity };
            this.isDirty = false;

        } catch (error) {
            console.error('Error loading entity:', error);
            throw error;
        }
    }

    /**
     * Render the complete editor interface
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'entity-editor-container';

        // Header
        const header = this.renderHeader();
        this.container.appendChild(header);

        // Type selector (only in create mode)
        if (this.options.mode === 'create') {
            const typeSelector = this.renderTypeSelector();
            this.container.appendChild(typeSelector);
        }

        // Main form (only if type is selected)
        if (this.currentType) {
            const form = this.renderForm();
            this.container.appendChild(form);

            // Preview panel
            const preview = this.renderPreviewPanel();
            this.container.appendChild(preview);

            // Actions footer
            const footer = this.renderFooter();
            this.container.appendChild(footer);
        }

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Render editor header
     */
    renderHeader() {
        const header = document.createElement('div');
        header.className = 'editor-header';
        header.innerHTML = `
            <div class="editor-header-content">
                <h1 class="editor-title">
                    ${this.options.mode === 'edit' ? 'Edit' : 'Create'}
                    ${this.currentType ? EntityDisplay.getTypeLabel(this.currentType) : 'Entity'}
                </h1>
                ${this.currentEntity ? `<p class="editor-subtitle">Editing: ${this.currentEntity.name || this.currentEntity.id}</p>` : ''}
            </div>
            <div class="editor-header-actions">
                <button class="btn-help" data-action="show-help">
                    ❓ Help
                </button>
                ${this.isDirty ? '<span class="unsaved-indicator">● Unsaved changes</span>' : ''}
            </div>
        `;
        return header;
    }

    /**
     * Render type selector dropdown
     */
    renderTypeSelector() {
        const section = document.createElement('div');
        section.className = 'editor-section type-selector-section';

        const types = [
            { value: 'deity', label: 'Deity', icon: '⚡', description: 'Gods, goddesses, and divine beings' },
            { value: 'hero', label: 'Hero', icon: '🗡️', description: 'Legendary heroes and protagonists' },
            { value: 'creature', label: 'Creature', icon: '🐉', description: 'Mythical beasts and monsters' },
            { value: 'item', label: 'Artifact', icon: '⚔️', description: 'Magical items and artifacts' },
            { value: 'place', label: 'Place', icon: '🏛️', description: 'Sacred sites and locations' },
            { value: 'concept', label: 'Concept', icon: '💭', description: 'Abstract concepts and ideas' },
            { value: 'magic', label: 'Magic System', icon: '🔮', description: 'Magical practices and systems' },
            { value: 'theory', label: 'Theory', icon: '🔬', description: 'Comparative mythology theories' },
            { value: 'mythology', label: 'Mythology', icon: '📜', description: 'Complete mythological systems' }
        ];

        const options = types.map(t => `
            <option value="${t.value}" data-icon="${t.icon}">
                ${t.icon} ${t.label} - ${t.description}
            </option>
        `).join('');

        section.innerHTML = `
            <h2>Select Entity Type</h2>
            <div class="type-selector-grid">
                ${types.map(t => `
                    <div class="type-option" data-type="${t.value}">
                        <div class="type-icon">${t.icon}</div>
                        <div class="type-label">${t.label}</div>
                        <div class="type-description">${t.description}</div>
                    </div>
                `).join('')}
            </div>
        `;

        return section;
    }

    /**
     * Render main form based on entity type
     */
    renderForm() {
        const form = document.createElement('form');
        form.className = 'entity-editor-form';
        form.id = 'entityEditorForm';

        // Common fields (all entity types)
        form.appendChild(this.renderCommonFields());

        // Type-specific fields
        form.appendChild(this.renderTypeSpecificFields());

        // Metadata fields (linguistic, geographical, temporal)
        form.appendChild(this.renderMetadataFields());

        // Cross-references
        form.appendChild(this.renderCrossReferencesSection());

        // Sources
        form.appendChild(this.renderSourcesSection());

        return form;
    }

    /**
     * Render common fields (all entity types have these)
     */
    renderCommonFields() {
        const section = document.createElement('div');
        section.className = 'editor-section common-fields';

        section.innerHTML = `
            <h2>Basic Information</h2>

            <div class="form-group required">
                <label for="entity-name">Name</label>
                <input
                    type="text"
                    id="entity-name"
                    name="name"
                    required
                    maxlength="100"
                    placeholder="Entity name in English"
                    value="${this.formData.name || ''}"
                >
                <span class="field-hint">Primary display name (required)</span>
            </div>

            <div class="form-group">
                <label for="entity-icon">Icon</label>
                <input
                    type="text"
                    id="entity-icon"
                    name="icon"
                    maxlength="10"
                    placeholder="📜 (emoji or unicode character)"
                    value="${this.formData.icon || ''}"
                >
                <span class="field-hint">Single emoji or unicode character for visual identification</span>
            </div>

            <div class="form-group required">
                <label for="entity-mythologies">Mythologies</label>
                <div class="tag-input-container" id="mythologies-tags">
                    ${this.renderTagInput('mythologies', this.formData.mythologies || [], this.getMythologySuggestions())}
                </div>
                <span class="field-hint">Which mythologies does this entity appear in? (at least one required)</span>
            </div>

            <div class="form-group">
                <label for="entity-short-description">Short Description</label>
                <textarea
                    id="entity-short-description"
                    name="shortDescription"
                    maxlength="200"
                    rows="2"
                    placeholder="One-sentence summary (max 200 characters)"
                >${this.formData.shortDescription || ''}</textarea>
                <span class="char-counter">
                    <span class="current">${(this.formData.shortDescription || '').length}</span> / 200
                </span>
            </div>

            <div class="form-group">
                <label for="entity-long-description">
                    Full Description
                    <button type="button" class="btn-preview-toggle" data-field="longDescription">
                        👁️ Toggle Preview
                    </button>
                </label>
                <div class="markdown-editor">
                    <textarea
                        id="entity-long-description"
                        name="longDescription"
                        rows="10"
                        placeholder="Detailed description (Markdown supported)"
                    >${this.formData.longDescription || ''}</textarea>
                    <div class="markdown-preview" id="preview-longDescription" style="display: none;">
                        ${this.renderMarkdown(this.formData.longDescription || '')}
                    </div>
                </div>
                <span class="field-hint">Full description with rich formatting (Markdown supported: **bold**, *italic*, lists, etc.)</span>
            </div>

            <div class="form-group">
                <label for="entity-tags">Tags</label>
                <div class="tag-input-container" id="tags-input">
                    ${this.renderTagInput('tags', this.formData.tags || [])}
                </div>
                <span class="field-hint">Searchable tags for discovery (press Enter to add)</span>
            </div>
        `;

        return section;
    }

    /**
     * Render type-specific fields based on entity type
     */
    renderTypeSpecificFields() {
        const section = document.createElement('div');
        section.className = 'editor-section type-specific-fields';

        switch (this.currentType) {
            case 'deity':
                section.appendChild(this.renderDeityFields());
                break;
            case 'hero':
                section.appendChild(this.renderHeroFields());
                break;
            case 'creature':
                section.appendChild(this.renderCreatureFields());
                break;
            case 'item':
                section.appendChild(this.renderItemFields());
                break;
            case 'place':
                section.appendChild(this.renderPlaceFields());
                break;
            case 'concept':
                section.appendChild(this.renderConceptFields());
                break;
            case 'magic':
                section.appendChild(this.renderMagicFields());
                break;
            case 'theory':
                section.appendChild(this.renderTheoryFields());
                break;
            case 'mythology':
                section.appendChild(this.renderMythologyFields());
                break;
        }

        return section;
    }

    /**
     * Deity-specific fields
     */
    renderDeityFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Deity-Specific Information</h2>

            <div class="form-group">
                <label for="deity-domains">Domains</label>
                <div class="tag-input-container" id="domains-tags">
                    ${this.renderTagInput('domains', this.formData.domains || [], ['war', 'wisdom', 'love', 'death', 'nature', 'fertility', 'sky', 'sea', 'underworld', 'sun', 'moon', 'fire', 'water', 'earth', 'air'])}
                </div>
                <span class="field-hint">Areas of divine influence (e.g., war, wisdom, love)</span>
            </div>

            <div class="form-group">
                <label for="deity-symbols">Symbols</label>
                <div class="tag-input-container" id="symbols-tags">
                    ${this.renderTagInput('symbols', this.formData.symbols || [], ['eagle', 'lightning bolt', 'trident', 'sword', 'crown', 'scepter', 'owl', 'dove', 'serpent'])}
                </div>
                <span class="field-hint">Sacred symbols and emblems</span>
            </div>

            <div class="form-group">
                <label for="deity-epithets">Epithets & Titles</label>
                <div class="dynamic-list" id="epithets-list">
                    ${this.renderDynamicList('epithets', this.formData.epithets || [], 'Add epithet or title')}
                </div>
                <span class="field-hint">Alternative names, titles, and epithets</span>
            </div>

            <div class="form-group">
                <label for="deity-relationships">Relationships</label>
                <div class="relationships-editor" id="relationships-editor">
                    ${this.renderRelationshipsEditor(this.formData.relationships || {})}
                </div>
                <span class="field-hint">Family relationships and divine connections</span>
            </div>
        `;
        return container;
    }

    /**
     * Hero-specific fields
     */
    renderHeroFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Hero-Specific Information</h2>

            <div class="form-group">
                <label>Parentage</label>
                <div class="parentage-editor">
                    <div class="form-group">
                        <label for="hero-father">Father</label>
                        <input type="text" id="hero-father" name="parentage.father"
                            value="${this.formData.parentage?.father || ''}"
                            placeholder="Father's name (or 'unknown')">
                    </div>
                    <div class="form-group">
                        <label for="hero-mother">Mother</label>
                        <input type="text" id="hero-mother" name="parentage.mother"
                            value="${this.formData.parentage?.mother || ''}"
                            placeholder="Mother's name (or 'unknown')">
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="hero-divine" name="parentage.divine"
                                ${this.formData.parentage?.divine ? 'checked' : ''}>
                            <span>Divine Heritage</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="hero-quests">Legendary Quests</label>
                <div class="dynamic-list" id="quests-list">
                    ${this.renderDynamicList('quests', this.formData.quests || [], 'Add quest or accomplishment')}
                </div>
                <span class="field-hint">Major quests and accomplishments</span>
            </div>

            <div class="form-group">
                <label for="hero-abilities">Abilities</label>
                <div class="tag-input-container" id="abilities-tags">
                    ${this.renderTagInput('abilities', this.formData.abilities || [], ['superhuman strength', 'invulnerability', 'divine favor', 'combat mastery', 'archery', 'swordsmanship'])}
                </div>
                <span class="field-hint">Special abilities and powers</span>
            </div>

            <div class="form-group">
                <label for="hero-weapons">Weapons & Equipment</label>
                <div class="cross-reference-picker" id="weapons-picker">
                    ${this.renderCrossReferencePicker('weapons', 'item', this.formData.weapons || [])}
                </div>
                <span class="field-hint">Associated artifacts and weapons</span>
            </div>
        `;
        return container;
    }

    /**
     * Creature-specific fields
     */
    renderCreatureFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Creature-Specific Information</h2>

            <div class="form-group">
                <label for="creature-physical">Physical Description</label>
                <textarea id="creature-physical" name="physicalDescription" rows="5"
                    placeholder="Detailed physical appearance">${this.formData.physicalDescription || ''}</textarea>
            </div>

            <div class="form-group">
                <label for="creature-abilities">Abilities & Powers</label>
                <div class="tag-input-container" id="creature-abilities-tags">
                    ${this.renderTagInput('abilities', this.formData.abilities || [], ['flight', 'fire breath', 'regeneration', 'shape-shifting', 'petrification'])}
                </div>
            </div>

            <div class="form-group">
                <label for="creature-weaknesses">Weaknesses</label>
                <div class="tag-input-container" id="weaknesses-tags">
                    ${this.renderTagInput('weaknesses', this.formData.weaknesses || [], ['silver', 'iron', 'sunlight', 'holy water', 'decapitation'])}
                </div>
            </div>

            <div class="form-group">
                <label for="creature-slain-by">Defeated By</label>
                <div class="cross-reference-picker" id="slain-by-picker">
                    ${this.renderCrossReferencePicker('slainBy', 'hero', this.formData.slainBy || [])}
                </div>
                <span class="field-hint">Heroes who defeated this creature</span>
            </div>
        `;
        return container;
    }

    /**
     * Item/Artifact-specific fields
     */
    renderItemFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Artifact-Specific Information</h2>

            <div class="form-group">
                <label for="item-powers">Powers & Abilities</label>
                <div class="dynamic-list" id="powers-list">
                    ${this.renderDynamicList('powers', this.formData.powers || [], 'Add power or ability')}
                </div>
            </div>

            <div class="form-group">
                <label for="item-materials">Materials</label>
                <div class="tag-input-container" id="materials-tags">
                    ${this.renderTagInput('materials', this.formData.materials || [], ['gold', 'silver', 'bronze', 'iron', 'adamantine', 'celestial metal'])}
                </div>
            </div>

            <div class="form-group">
                <label for="item-created-by">Created By</label>
                <div class="cross-reference-picker" id="created-by-picker">
                    ${this.renderCrossReferencePicker('createdBy', 'deity', this.formData.createdBy || [])}
                </div>
            </div>

            <div class="form-group">
                <label for="item-wielders">Notable Wielders</label>
                <div class="cross-reference-picker" id="wielders-picker">
                    ${this.renderCrossReferencePicker('wielders', 'deity,hero', this.formData.wielders || [])}
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Place-specific fields
     */
    renderPlaceFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Place-Specific Information</h2>

            <div class="form-group">
                <label for="place-location">Coordinates (if known)</label>
                <div class="coordinates-input">
                    <input type="number" step="0.0001" min="-90" max="90"
                        id="place-latitude" name="geographical.primaryLocation.coordinates.latitude"
                        placeholder="Latitude" value="${this.formData.geographical?.primaryLocation?.coordinates?.latitude || ''}">
                    <input type="number" step="0.0001" min="-180" max="180"
                        id="place-longitude" name="geographical.primaryLocation.coordinates.longitude"
                        placeholder="Longitude" value="${this.formData.geographical?.primaryLocation?.coordinates?.longitude || ''}">
                </div>
                <span class="field-hint">Geographical coordinates for real-world locations</span>
            </div>

            <div class="form-group">
                <label for="place-inhabitants">Inhabitants</label>
                <div class="cross-reference-picker" id="inhabitants-picker">
                    ${this.renderCrossReferencePicker('inhabitants', 'deity,creature,hero', this.formData.inhabitants || [])}
                </div>
            </div>

            <div class="form-group">
                <label for="place-events">Major Events</label>
                <div class="dynamic-list" id="events-list">
                    ${this.renderDynamicList('events', this.formData.events || [], 'Add significant event')}
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Concept-specific fields
     */
    renderConceptFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Concept-Specific Information</h2>

            <div class="form-group">
                <label for="concept-opposites">Opposing Concepts</label>
                <div class="cross-reference-picker" id="opposites-picker">
                    ${this.renderCrossReferencePicker('opposites', 'concept', this.formData.opposites || [])}
                </div>
            </div>

            <div class="form-group">
                <label for="concept-personifications">Personified As</label>
                <div class="cross-reference-picker" id="personifications-picker">
                    ${this.renderCrossReferencePicker('personifications', 'deity', this.formData.personifications || [])}
                </div>
                <span class="field-hint">Deities who personify this concept</span>
            </div>
        `;
        return container;
    }

    /**
     * Magic system-specific fields
     */
    renderMagicFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Magic System Information</h2>

            <div class="form-group">
                <label for="magic-techniques">Techniques & Methods</label>
                <div class="dynamic-list" id="techniques-list">
                    ${this.renderDynamicList('techniques', this.formData.techniques || [], 'Add technique or method')}
                </div>
            </div>

            <div class="form-group">
                <label for="magic-tools">Tools & Materials</label>
                <div class="tag-input-container" id="tools-tags">
                    ${this.renderTagInput('tools', this.formData.tools || [], ['wand', 'staff', 'crystal', 'herbs', 'candles', 'runes', 'sigils'])}
                </div>
            </div>

            <div class="form-group">
                <label for="magic-warnings">Safety Warnings</label>
                <div class="dynamic-list" id="warnings-list">
                    ${this.renderDynamicList('safetyWarnings', this.formData.safetyWarnings || [], 'Add safety warning')}
                </div>
                <span class="field-hint">Important cautions for practitioners</span>
            </div>
        `;
        return container;
    }

    /**
     * Theory-specific fields
     */
    renderTheoryFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Theory Information</h2>

            <div class="form-group">
                <label for="theory-warning">Intellectual Honesty Warning</label>
                <textarea id="theory-warning" name="intellectualHonestyWarning" rows="3"
                    placeholder="Statement about the speculative nature of this theory">${this.formData.intellectualHonestyWarning || ''}</textarea>
                <span class="field-hint">Required disclaimer about evidence and speculation</span>
            </div>

            <div class="form-group">
                <label for="theory-confidence">Confidence Score (0-100)</label>
                <input type="range" id="theory-confidence" name="confidence"
                    min="0" max="100" value="${this.formData.confidence || 50}">
                <output id="confidence-value">${this.formData.confidence || 50}%</output>
            </div>

            <div class="form-group">
                <label for="theory-alternatives">Alternative Explanations</label>
                <div class="dynamic-list" id="alternatives-list">
                    ${this.renderDynamicList('alternativeExplanations', this.formData.alternativeExplanations || [], 'Add alternative explanation')}
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Mythology-specific fields
     */
    renderMythologyFields() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h2>Mythology System Information</h2>

            <div class="form-group">
                <label for="mythology-creation">Creation Myth</label>
                <textarea id="mythology-creation" name="creationMyth" rows="8"
                    placeholder="How this mythology explains the origin of the world">${this.formData.creationMyth || ''}</textarea>
            </div>

            <div class="form-group">
                <label for="mythology-cosmology">Cosmology</label>
                <textarea id="mythology-cosmology" name="cosmology" rows="8"
                    placeholder="Structure of the universe in this mythology">${this.formData.cosmology || ''}</textarea>
            </div>

            <div class="form-group">
                <label for="mythology-major-deities">Major Deities</label>
                <div class="cross-reference-picker" id="major-deities-picker">
                    ${this.renderCrossReferencePicker('majorDeities', 'deity', this.formData.majorDeities || [])}
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Render metadata fields (linguistic, geographical, temporal)
     */
    renderMetadataFields() {
        const section = document.createElement('div');
        section.className = 'editor-section metadata-fields collapsible collapsed';

        section.innerHTML = `
            <h2 class="collapsible-header">
                <button type="button" class="collapse-toggle">▶</button>
                Advanced Metadata (Optional)
            </h2>
            <div class="collapsible-content">
                ${this.renderLinguisticFields()}
                ${this.renderGeographicalFields()}
                ${this.renderTemporalFields()}
            </div>
        `;

        return section;
    }

    /**
     * Render linguistic metadata fields
     */
    renderLinguisticFields() {
        return `
            <div class="metadata-subsection">
                <h3>Linguistic Information</h3>

                <div class="form-group">
                    <label for="ling-original-name">Original Name</label>
                    <input type="text" id="ling-original-name" name="linguistic.originalName"
                        value="${this.formData.linguistic?.originalName || ''}"
                        placeholder="Name in original script (e.g., Ζεύς, יהוה)">
                </div>

                <div class="form-group">
                    <label for="ling-pronunciation">Pronunciation (IPA)</label>
                    <input type="text" id="ling-pronunciation" name="linguistic.pronunciation"
                        value="${this.formData.linguistic?.pronunciation || ''}"
                        placeholder="/zju:s/">
                </div>

                <div class="form-group">
                    <label for="ling-etymology">Etymology</label>
                    <textarea id="ling-etymology" name="linguistic.etymology.meaning" rows="3"
                        placeholder="Word origin and meaning">${this.formData.linguistic?.etymology?.meaning || ''}</textarea>
                </div>
            </div>
        `;
    }

    /**
     * Render geographical metadata fields
     */
    renderGeographicalFields() {
        return `
            <div class="metadata-subsection">
                <h3>Geographical Information</h3>

                <div class="form-group">
                    <label for="geo-region">Region</label>
                    <input type="text" id="geo-region" name="geographical.region"
                        value="${this.formData.geographical?.region || ''}"
                        placeholder="e.g., Mediterranean, Scandinavia">
                </div>

                <div class="form-group">
                    <label for="geo-cultural-area">Cultural Area</label>
                    <input type="text" id="geo-cultural-area" name="geographical.culturalArea"
                        value="${this.formData.geographical?.culturalArea || ''}"
                        placeholder="e.g., Hellenistic World, Viking Age Scandinavia">
                </div>
            </div>
        `;
    }

    /**
     * Render temporal metadata fields
     */
    renderTemporalFields() {
        return `
            <div class="metadata-subsection">
                <h3>Historical Information</h3>

                <div class="form-group">
                    <label for="temp-period">Historical Period</label>
                    <input type="text" id="temp-period" name="temporal.historicalPeriod"
                        value="${this.formData.temporal?.historicalPeriod || ''}"
                        placeholder="e.g., Bronze Age, Classical Period">
                </div>

                <div class="form-group">
                    <label for="temp-first-attestation">First Attestation</label>
                    <input type="text" id="temp-first-attestation" name="temporal.firstAttestation.date"
                        value="${this.formData.temporal?.firstAttestation?.date || ''}"
                        placeholder="e.g., c. 750 BCE">
                </div>
            </div>
        `;
    }

    /**
     * Render cross-references section
     */
    renderCrossReferencesSection() {
        const section = document.createElement('div');
        section.className = 'editor-section cross-references-section collapsible collapsed';

        section.innerHTML = `
            <h2 class="collapsible-header">
                <button type="button" class="collapse-toggle">▶</button>
                Cross-References
            </h2>
            <div class="collapsible-content">
                <p class="section-description">Link this entity to related deities, heroes, creatures, items, places, and concepts.</p>

                <div class="form-group">
                    <label>Related Deities</label>
                    <div class="cross-reference-picker" id="related-deities-picker">
                        ${this.renderCrossReferencePicker('relatedEntities.deities', 'deity', this.formData.relatedEntities?.deities || [])}
                    </div>
                </div>

                <div class="form-group">
                    <label>Related Heroes</label>
                    <div class="cross-reference-picker" id="related-heroes-picker">
                        ${this.renderCrossReferencePicker('relatedEntities.heroes', 'hero', this.formData.relatedEntities?.heroes || [])}
                    </div>
                </div>

                <div class="form-group">
                    <label>Related Creatures</label>
                    <div class="cross-reference-picker" id="related-creatures-picker">
                        ${this.renderCrossReferencePicker('relatedEntities.creatures', 'creature', this.formData.relatedEntities?.creatures || [])}
                    </div>
                </div>

                <div class="form-group">
                    <label>Related Items</label>
                    <div class="cross-reference-picker" id="related-items-picker">
                        ${this.renderCrossReferencePicker('relatedEntities.items', 'item', this.formData.relatedEntities?.items || [])}
                    </div>
                </div>

                <div class="form-group">
                    <label>Related Places</label>
                    <div class="cross-reference-picker" id="related-places-picker">
                        ${this.renderCrossReferencePicker('relatedEntities.places', 'place', this.formData.relatedEntities?.places || [])}
                    </div>
                </div>

                <div class="form-group">
                    <label>Related Concepts</label>
                    <div class="cross-reference-picker" id="related-concepts-picker">
                        ${this.renderCrossReferencePicker('relatedEntities.concepts', 'concept', this.formData.relatedEntities?.concepts || [])}
                    </div>
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Render sources section
     */
    renderSourcesSection() {
        const section = document.createElement('div');
        section.className = 'editor-section sources-section collapsible collapsed';

        const sources = this.formData.sources || [];

        section.innerHTML = `
            <h2 class="collapsible-header">
                <button type="button" class="collapse-toggle">▶</button>
                Sources & Citations
            </h2>
            <div class="collapsible-content">
                <p class="section-description">Add academic sources, primary texts, and references.</p>

                <div id="sources-list">
                    ${sources.map((source, index) => this.renderSourceItem(source, index)).join('')}
                </div>

                <button type="button" class="btn-add-source" data-action="add-source">
                    ➕ Add Source
                </button>
            </div>
        `;

        return section;
    }

    /**
     * Render a single source item
     */
    renderSourceItem(source = {}, index = 0) {
        return `
            <div class="source-item" data-index="${index}">
                <div class="source-item-header">
                    <span class="source-number">#${index + 1}</span>
                    <button type="button" class="btn-remove-source" data-index="${index}">✕</button>
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" name="sources[${index}].title" value="${source.title || ''}" placeholder="Source title">
                </div>
                <div class="form-group">
                    <label>Author</label>
                    <input type="text" name="sources[${index}].author" value="${source.author || ''}" placeholder="Author name">
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select name="sources[${index}].type">
                        <option value="primary" ${source.type === 'primary' ? 'selected' : ''}>Primary Source</option>
                        <option value="secondary" ${source.type === 'secondary' ? 'selected' : ''}>Secondary Source</option>
                        <option value="archaeological" ${source.type === 'archaeological' ? 'selected' : ''}>Archaeological</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>URL (optional)</label>
                    <input type="url" name="sources[${index}].url" value="${source.url || ''}" placeholder="https://...">
                </div>
            </div>
        `;
    }

    /**
     * Render preview panel
     */
    renderPreviewPanel() {
        const panel = document.createElement('div');
        panel.className = 'preview-panel collapsed';
        panel.id = 'preview-panel';

        panel.innerHTML = `
            <div class="preview-header">
                <h3>Live Preview</h3>
                <button type="button" class="btn-toggle-preview" data-action="toggle-preview">
                    👁️ Toggle
                </button>
            </div>
            <div class="preview-content">
                <div id="entity-preview">
                    ${this.renderEntityPreview()}
                </div>
            </div>
        `;

        return panel;
    }

    /**
     * Render entity preview (simulated display)
     */
    renderEntityPreview() {
        if (!this.formData.name) {
            return '<p class="preview-empty">Fill in entity details to see preview...</p>';
        }

        const previewEntity = {
            ...this.formData,
            type: this.currentType
        };

        return EntityDisplay.renderCard(previewEntity).outerHTML;
    }

    /**
     * Render footer with action buttons
     */
    renderFooter() {
        const footer = document.createElement('div');
        footer.className = 'editor-footer';

        const isUserLoggedIn = FirebaseService.isAuthenticated();

        footer.innerHTML = `
            <div class="footer-actions">
                <button type="button" class="btn-cancel" data-action="cancel">
                    Cancel
                </button>

                ${isUserLoggedIn ? `
                    <button type="button" class="btn-save-draft" data-action="save-draft">
                        💾 Save Draft
                    </button>
                    <button type="button" class="btn-submit" data-action="submit">
                        ✅ ${this.options.mode === 'edit' ? 'Update' : 'Submit for Review'}
                    </button>
                ` : `
                    <div class="login-required">
                        <span class="warning-icon">⚠️</span>
                        <span>Please <a href="#" data-action="sign-in">sign in</a> to save entities</span>
                    </div>
                `}
            </div>

            <div class="footer-info">
                <span class="auto-save-status" id="auto-save-status">
                    ${this.options.autoSave ? 'Auto-save enabled' : 'Auto-save disabled'}
                </span>
            </div>
        `;

        return footer;
    }

    /**
     * Helper: Render tag input component
     */
    renderTagInput(fieldName, values = [], suggestions = []) {
        const tags = values.map(tag => `
            <span class="tag">
                ${this.escapeHtml(tag)}
                <button type="button" class="tag-remove" data-field="${fieldName}" data-value="${this.escapeHtml(tag)}">×</button>
            </span>
        `).join('');

        const suggestionsHtml = suggestions.length > 0 ? `
            <datalist id="${fieldName}-suggestions">
                ${suggestions.map(s => `<option value="${s}">`).join('')}
            </datalist>
        ` : '';

        return `
            <div class="tag-input-wrapper">
                <div class="tags-display">${tags}</div>
                <input
                    type="text"
                    class="tag-input"
                    data-field="${fieldName}"
                    list="${fieldName}-suggestions"
                    placeholder="Type and press Enter..."
                >
                ${suggestionsHtml}
            </div>
        `;
    }

    /**
     * Helper: Render dynamic list component (add/remove items)
     */
    renderDynamicList(fieldName, items = [], placeholder = 'Add item') {
        const itemsHtml = items.map((item, index) => `
            <div class="dynamic-list-item" data-index="${index}">
                <input type="text" name="${fieldName}[${index}]" value="${this.escapeHtml(item)}" placeholder="${placeholder}">
                <button type="button" class="btn-remove-item" data-field="${fieldName}" data-index="${index}">×</button>
            </div>
        `).join('');

        return `
            <div class="dynamic-list-wrapper" data-field="${fieldName}">
                ${itemsHtml}
                <button type="button" class="btn-add-item" data-field="${fieldName}">
                    ➕ ${placeholder}
                </button>
            </div>
        `;
    }

    /**
     * Helper: Render cross-reference picker
     */
    renderCrossReferencePicker(fieldName, entityTypes, selectedIds = []) {
        const types = entityTypes.split(',');

        return `
            <div class="cross-ref-picker-wrapper" data-field="${fieldName}" data-types="${entityTypes}">
                <div class="selected-refs">
                    ${selectedIds.map(id => `
                        <div class="ref-tag" data-id="${id}">
                            <span class="ref-name">${id}</span>
                            <button type="button" class="ref-remove" data-field="${fieldName}" data-id="${id}">×</button>
                        </div>
                    `).join('')}
                </div>
                <div class="ref-search-box">
                    <input
                        type="text"
                        class="ref-search-input"
                        data-field="${fieldName}"
                        placeholder="Search ${types.join('/')}..."
                    >
                    <div class="ref-search-results" id="ref-results-${fieldName}"></div>
                </div>
            </div>
        `;
    }

    /**
     * Helper: Render relationships editor
     */
    renderRelationshipsEditor(relationships = {}) {
        const relationTypes = ['father', 'mother', 'spouse', 'children', 'siblings'];

        return `
            <div class="relationships-editor-wrapper">
                ${relationTypes.map(rel => `
                    <div class="relationship-row">
                        <label>${this.capitalize(rel)}</label>
                        <input type="text" name="relationships.${rel}"
                            value="${relationships[rel] || ''}"
                            placeholder="Entity ID or name">
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Type selector
        this.container.querySelectorAll('.type-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.selectType(type);
            });
        });

        // Form inputs - track changes
        this.container.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => {
                this.isDirty = true;
                this.updateFormData();
            });
        });

        // Character counter
        this.container.querySelectorAll('textarea[maxlength]').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const counter = e.target.parentElement.querySelector('.char-counter .current');
                if (counter) {
                    counter.textContent = e.target.value.length;
                }
            });
        });

        // Markdown preview toggle
        this.container.querySelectorAll('.btn-preview-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const field = e.currentTarget.dataset.field;
                this.toggleMarkdownPreview(field);
            });
        });

        // Tag input
        this.container.querySelectorAll('.tag-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag(e.target);
                }
            });
        });

        // Tag remove
        this.container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeTag(e.currentTarget);
            });
        });

        // Dynamic list - add item
        this.container.querySelectorAll('.btn-add-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.addListItem(e.currentTarget.dataset.field);
            });
        });

        // Dynamic list - remove item
        this.container.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeListItem(e.currentTarget);
            });
        });

        // Cross-reference search
        this.container.querySelectorAll('.ref-search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.searchCrossReferences(e.target);
            });
        });

        // Collapsible sections
        this.container.querySelectorAll('.collapse-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.closest('.collapsible');
                section.classList.toggle('collapsed');
                e.currentTarget.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
            });
        });

        // Sources
        this.container.querySelector('[data-action="add-source"]')?.addEventListener('click', () => {
            this.addSource();
        });

        this.container.querySelectorAll('.btn-remove-source').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeSource(e.currentTarget.dataset.index);
            });
        });

        // Action buttons
        this.container.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
            this.cancel();
        });

        this.container.querySelector('[data-action="save-draft"]')?.addEventListener('click', () => {
            this.saveDraft();
        });

        this.container.querySelector('[data-action="submit"]')?.addEventListener('click', () => {
            this.submit();
        });

        this.container.querySelector('[data-action="toggle-preview"]')?.addEventListener('click', () => {
            this.togglePreview();
        });

        this.container.querySelector('[data-action="show-help"]')?.addEventListener('click', () => {
            this.showHelp();
        });

        // Confidence slider
        const confidenceSlider = this.container.querySelector('#theory-confidence');
        if (confidenceSlider) {
            confidenceSlider.addEventListener('input', (e) => {
                const output = this.container.querySelector('#confidence-value');
                if (output) {
                    output.textContent = e.target.value + '%';
                }
            });
        }
    }

    /**
     * Select entity type
     */
    selectType(type) {
        this.currentType = type;
        this.formData.type = type;
        this.isDirty = true;
        this.render();
    }

    /**
     * Update form data from inputs
     */
    updateFormData() {
        const form = this.container.querySelector('#entityEditorForm');
        if (!form) return;

        const formDataObj = new FormData(form);

        // Convert FormData to nested object
        for (const [key, value] of formDataObj.entries()) {
            this.setNestedValue(this.formData, key, value);
        }

        // Update preview if visible
        if (!this.container.querySelector('.preview-panel').classList.contains('collapsed')) {
            this.updatePreview();
        }
    }

    /**
     * Set nested object value from dot notation
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Toggle markdown preview
     */
    toggleMarkdownPreview(fieldName) {
        const textarea = this.container.querySelector(`#entity-${fieldName}`);
        const preview = this.container.querySelector(`#preview-${fieldName}`);

        if (!textarea || !preview) return;

        if (preview.style.display === 'none') {
            preview.innerHTML = this.renderMarkdown(textarea.value);
            preview.style.display = 'block';
            textarea.style.display = 'none';
        } else {
            preview.style.display = 'none';
            textarea.style.display = 'block';
        }
    }

    /**
     * Add tag to tag input
     */
    addTag(input) {
        const value = input.value.trim();
        if (!value) return;

        const field = input.dataset.field;
        if (!this.formData[field]) {
            this.formData[field] = [];
        }

        if (!this.formData[field].includes(value)) {
            this.formData[field].push(value);
            this.isDirty = true;

            // Re-render tag input
            const container = input.closest('.tag-input-container');
            container.innerHTML = this.renderTagInput(field, this.formData[field]);

            // Re-attach listeners
            this.attachEventListeners();
        }

        input.value = '';
    }

    /**
     * Remove tag from tag input
     */
    removeTag(button) {
        const field = button.dataset.field;
        const value = button.dataset.value;

        if (this.formData[field]) {
            this.formData[field] = this.formData[field].filter(v => v !== value);
            this.isDirty = true;

            // Re-render tag input
            const container = button.closest('.tag-input-container');
            container.innerHTML = this.renderTagInput(field, this.formData[field]);

            // Re-attach listeners
            this.attachEventListeners();
        }
    }

    /**
     * Add item to dynamic list
     */
    addListItem(fieldName) {
        if (!this.formData[fieldName]) {
            this.formData[fieldName] = [];
        }

        this.formData[fieldName].push('');
        this.isDirty = true;

        // Re-render list
        const wrapper = this.container.querySelector(`[data-field="${fieldName}"]`);
        if (wrapper && wrapper.classList.contains('dynamic-list-wrapper')) {
            const placeholder = wrapper.querySelector('.btn-add-item').textContent.replace('➕ ', '');
            wrapper.innerHTML = this.renderDynamicList(fieldName, this.formData[fieldName], placeholder);
            this.attachEventListeners();
        }
    }

    /**
     * Remove item from dynamic list
     */
    removeListItem(button) {
        const field = button.dataset.field;
        const index = parseInt(button.dataset.index);

        if (this.formData[field]) {
            this.formData[field].splice(index, 1);
            this.isDirty = true;

            // Re-render list
            const wrapper = this.container.querySelector(`[data-field="${field}"]`);
            if (wrapper) {
                const placeholder = wrapper.querySelector('.btn-add-item').textContent.replace('➕ ', '');
                wrapper.innerHTML = this.renderDynamicList(field, this.formData[field], placeholder);
                this.attachEventListeners();
            }
        }
    }

    /**
     * Search cross-references
     */
    async searchCrossReferences(input) {
        const query = input.value.trim().toLowerCase();
        const field = input.dataset.field;
        const types = input.closest('.cross-ref-picker-wrapper').dataset.types.split(',');

        if (query.length < 2) {
            const results = this.container.querySelector(`#ref-results-${field}`);
            if (results) results.innerHTML = '';
            return;
        }

        try {
            const searchResults = await EntityLoader.search(query, { collections: types.map(t => EntityLoader.getCollectionName(t)) });

            const resultsHtml = searchResults.slice(0, 10).map(entity => `
                <div class="ref-result-item" data-id="${entity.id}" data-name="${entity.name}">
                    ${EntityDisplay.getEntityIcon({ type: entity.type })} ${entity.name}
                    <span class="ref-type">${entity.type}</span>
                </div>
            `).join('');

            const resultsContainer = this.container.querySelector(`#ref-results-${field}`);
            if (resultsContainer) {
                resultsContainer.innerHTML = resultsHtml;

                // Attach click handlers
                resultsContainer.querySelectorAll('.ref-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.addCrossReference(field, item.dataset.id, item.dataset.name);
                        input.value = '';
                        resultsContainer.innerHTML = '';
                    });
                });
            }

        } catch (error) {
            console.error('Error searching cross-references:', error);
        }
    }

    /**
     * Add cross-reference
     */
    addCrossReference(field, id, name) {
        const keys = field.split('.');
        let current = this.formData;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        if (!current[lastKey]) {
            current[lastKey] = [];
        }

        if (!current[lastKey].includes(id)) {
            current[lastKey].push(id);
            this.isDirty = true;

            // Re-render picker
            const wrapper = this.container.querySelector(`[data-field="${field}"]`);
            if (wrapper) {
                const types = wrapper.dataset.types;
                wrapper.innerHTML = this.renderCrossReferencePicker(field, types, current[lastKey]);
                this.attachEventListeners();
            }
        }
    }

    /**
     * Add source
     */
    addSource() {
        if (!this.formData.sources) {
            this.formData.sources = [];
        }

        this.formData.sources.push({
            title: '',
            author: '',
            type: 'secondary',
            url: ''
        });

        this.isDirty = true;

        // Re-render sources section
        const sourcesList = this.container.querySelector('#sources-list');
        if (sourcesList) {
            sourcesList.innerHTML = this.formData.sources.map((s, i) => this.renderSourceItem(s, i)).join('');
            this.attachEventListeners();
        }
    }

    /**
     * Remove source
     */
    removeSource(index) {
        if (this.formData.sources) {
            this.formData.sources.splice(parseInt(index), 1);
            this.isDirty = true;

            // Re-render sources section
            const sourcesList = this.container.querySelector('#sources-list');
            if (sourcesList) {
                sourcesList.innerHTML = this.formData.sources.map((s, i) => this.renderSourceItem(s, i)).join('');
                this.attachEventListeners();
            }
        }
    }

    /**
     * Toggle preview panel
     */
    togglePreview() {
        const panel = this.container.querySelector('.preview-panel');
        if (panel) {
            panel.classList.toggle('collapsed');
            if (!panel.classList.contains('collapsed')) {
                this.updatePreview();
            }
        }
    }

    /**
     * Update preview
     */
    updatePreview() {
        const previewContainer = this.container.querySelector('#entity-preview');
        if (previewContainer) {
            previewContainer.innerHTML = this.renderEntityPreview();
        }
    }

    /**
     * Validate form
     */
    validate() {
        this.validationErrors = {};

        // Required fields
        if (!this.formData.name) {
            this.validationErrors.name = 'Name is required';
        }

        if (!this.formData.mythologies || this.formData.mythologies.length === 0) {
            this.validationErrors.mythologies = 'At least one mythology is required';
        }

        // Type-specific validation
        if (this.currentType === 'theory' && !this.formData.intellectualHonestyWarning) {
            this.validationErrors.intellectualHonestyWarning = 'Intellectual honesty warning is required for theories';
        }

        return Object.keys(this.validationErrors).length === 0;
    }

    /**
     * Show validation errors
     */
    showValidationErrors() {
        // Clear previous errors
        this.container.querySelectorAll('.field-error').forEach(el => el.remove());

        // Show new errors
        Object.entries(this.validationErrors).forEach(([field, message]) => {
            const input = this.container.querySelector(`[name="${field}"]`);
            if (input) {
                const error = document.createElement('span');
                error.className = 'field-error';
                error.textContent = message;
                input.parentElement.appendChild(error);
                input.classList.add('error');
            }
        });
    }

    /**
     * Save draft
     */
    async saveDraft() {
        try {
            if (!FirebaseService.isAuthenticated()) {
                this.showError('Please sign in to save drafts');
                return;
            }

            this.updateFormData();

            // Add metadata
            const draftData = {
                ...this.formData,
                type: this.currentType,
                status: 'draft',
                authorId: FirebaseService.getUserId(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!draftData.createdAt) {
                draftData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }

            // Save to Firestore
            const collection = EntityLoader.getCollectionName(this.currentType);

            if (this.currentEntity && this.currentEntity.id) {
                // Update existing
                await db.collection(collection).doc(this.currentEntity.id).update(draftData);
                this.showSuccess('Draft saved successfully');
            } else {
                // Create new
                const docRef = await db.collection(collection).add(draftData);
                this.currentEntity = { id: docRef.id, ...draftData };
                this.showSuccess('Draft created successfully');
            }

            this.isDirty = false;

            if (this.options.onSave) {
                this.options.onSave(this.currentEntity);
            }

        } catch (error) {
            console.error('Error saving draft:', error);
            this.showError('Failed to save draft: ' + error.message);

            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }

    /**
     * Submit for review
     */
    async submit() {
        try {
            if (!FirebaseService.isAuthenticated()) {
                this.showError('Please sign in to submit entities');
                return;
            }

            this.updateFormData();

            // Validate
            if (!this.validate()) {
                this.showValidationErrors();
                this.showError('Please fix validation errors before submitting');
                return;
            }

            // Add metadata
            const entityData = {
                ...this.formData,
                type: this.currentType,
                status: this.options.mode === 'edit' ? 'published' : 'pending_review',
                authorId: FirebaseService.getUserId(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!entityData.createdAt) {
                entityData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }

            // Generate ID if needed
            if (!entityData.id) {
                entityData.id = this.generateEntityId(entityData.name);
            }

            // Save to Firestore
            const collection = EntityLoader.getCollectionName(this.currentType);

            if (this.currentEntity && this.currentEntity.id) {
                // Update existing
                await db.collection(collection).doc(this.currentEntity.id).set(entityData, { merge: true });
                this.showSuccess('Entity updated successfully');
            } else {
                // Create new
                await db.collection(collection).doc(entityData.id).set(entityData);
                this.showSuccess('Entity submitted for review');
            }

            this.isDirty = false;

            if (this.options.onSave) {
                this.options.onSave(entityData);
            }

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = `/view.html?type=${this.currentType}&id=${entityData.id}`;
            }, 1500);

        } catch (error) {
            console.error('Error submitting entity:', error);
            this.showError('Failed to submit entity: ' + error.message);

            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }

    /**
     * Cancel editing
     */
    cancel() {
        if (this.isDirty) {
            const confirmCancel = confirm('You have unsaved changes. Are you sure you want to cancel?');
            if (!confirmCancel) return;
        }

        // Navigate back or to entities list
        if (this.currentEntity && this.currentEntity.id) {
            window.location.href = `/view.html?type=${this.currentType}&id=${this.currentEntity.id}`;
        } else {
            window.location.href = '/index.html';
        }
    }

    /**
     * Show help dialog
     */
    showHelp() {
        window.open('/ENTITY_EDITOR_GUIDE.md', '_blank');
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            if (this.isDirty && FirebaseService.isAuthenticated()) {
                this.saveDraft();
                this.updateAutoSaveStatus('Auto-saved at ' + new Date().toLocaleTimeString());
            }
        }, this.options.autoSaveInterval);
    }

    /**
     * Update auto-save status
     */
    updateAutoSaveStatus(message) {
        const status = this.container.querySelector('#auto-save-status');
        if (status) {
            status.textContent = message;
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveDraft();
            }

            // Ctrl+Enter or Cmd+Enter to submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }

            // Esc to cancel
            if (e.key === 'Escape') {
                this.cancel();
            }
        });
    }

    /**
     * Generate entity ID from name
     */
    generateEntityId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get mythology suggestions
     */
    getMythologySuggestions() {
        return [
            'greek', 'roman', 'norse', 'egyptian', 'celtic', 'hindu',
            'buddhist', 'christian', 'jewish', 'islamic', 'japanese',
            'chinese', 'sumerian', 'babylonian', 'aztec', 'mayan',
            'yoruba', 'native_american', 'persian', 'tarot', 'apocryphal'
        ];
    }

    /**
     * Render markdown (simple implementation)
     */
    renderMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `editor-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">
                ${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        `;

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityEditor;
}
