/**
 * Enhanced Entity Form Component
 *
 * Comprehensive form builder supporting all metadata types:
 * - Text inputs for strings
 * - Tag inputs for arrays (add/remove items)
 * - Key-value editors for objects
 * - Date pickers for dates
 * - Number inputs with validation
 * - File uploads for images
 * - Entity reference autocomplete
 * - Nested object editors
 * - Array of objects editors
 *
 * Features:
 * - Multi-step wizard with progress indicator
 * - Real-time validation with detailed error messages
 * - Auto-save drafts to localStorage
 * - Keyboard navigation and accessibility
 * - Works for creating new entities and editing existing ones
 */

class EntityFormEnhanced {
    /**
     * @param {Object} options - Configuration options
     * @param {Object} options.crudManager - CRUD manager instance for Firebase operations
     * @param {string} options.collection - Collection name (deities, creatures, etc.)
     * @param {string} [options.entityId] - Entity ID for editing mode
     * @param {Function} [options.onSuccess] - Callback on successful save
     * @param {Function} [options.onCancel] - Callback on cancel
     * @param {Object} [options.initialData] - Initial data for the form
     */
    constructor(options) {
        this.crudManager = options.crudManager;
        this.collection = options.collection;
        this.entityId = options.entityId;
        this.onSuccess = typeof options.onSuccess === 'function'
            ? options.onSuccess
            : () => console.warn('[EntityFormEnhanced] No onSuccess callback');
        this.onCancel = typeof options.onCancel === 'function'
            ? options.onCancel
            : () => console.warn('[EntityFormEnhanced] No onCancel callback');

        this.formData = options.initialData || {};
        this.errors = {};
        this.warnings = {};
        this.isEditing = !!this.entityId;
        this.autoSaveTimer = null;
        this.currentStep = 0;
        this.uploadedFiles = {};

        // Entity cache for autocomplete
        this.entityCache = new Map();
        this.autocompleteTimeout = null;

        // Get schema for this collection
        this.schema = this.getEnhancedSchema(this.collection);
        this.steps = this.organizeFieldsIntoSteps(this.schema.fields);

        // Bind methods
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    /**
     * Get comprehensive schema for collection
     * Supports all metadata types found in entity data
     */
    getEnhancedSchema(collection) {
        // Base fields common to all entities
        const baseFields = [
            {
                name: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                placeholder: 'Enter entity name...',
                helpText: 'The primary name of this entity',
                validation: { minLength: 2, maxLength: 100 },
                group: 'basic'
            },
            {
                name: 'displayName',
                label: 'Display Name',
                type: 'text',
                required: false,
                placeholder: 'e.g., "Zeus - King of Gods"',
                helpText: 'Display name with icon/emoji prefix (optional)',
                group: 'basic'
            },
            {
                name: 'mythology',
                label: 'Mythology',
                type: 'select',
                required: true,
                options: this.getMythologyOptions(),
                helpText: 'The mythological tradition this entity belongs to',
                group: 'basic'
            },
            {
                name: 'type',
                label: 'Entity Type',
                type: 'select',
                required: true,
                options: this.getTypeOptions(collection),
                helpText: 'The category or classification',
                group: 'basic'
            },
            {
                name: 'icon',
                label: 'Icon (Emoji)',
                type: 'emoji',
                required: false,
                placeholder: 'Click to select...',
                helpText: 'An emoji to represent this entity',
                group: 'basic'
            },
            {
                name: 'description',
                label: 'Description',
                type: 'richtext',
                required: false,
                placeholder: 'Enter a detailed description...',
                rows: 8,
                helpText: 'Detailed information about this entity (50+ characters recommended)',
                validation: { minLength: 50 },
                group: 'details'
            },
            {
                name: 'summary',
                label: 'Summary',
                type: 'textarea',
                required: false,
                placeholder: 'Brief summary for cards and previews...',
                rows: 3,
                helpText: 'Short summary for display in cards (1-2 sentences)',
                validation: { maxLength: 300 },
                group: 'details'
            },
            {
                name: 'imageUrl',
                label: 'Image',
                type: 'image',
                required: false,
                helpText: 'Upload an image (PNG, JPG, GIF up to 5MB)',
                group: 'details'
            },
            {
                name: 'aliases',
                label: 'Aliases / Alternative Names',
                type: 'tags',
                placeholder: 'Add alias and press Enter...',
                helpText: 'Other names this entity is known by',
                group: 'details'
            },
            {
                name: 'importance',
                label: 'Importance',
                type: 'number',
                required: false,
                min: 0,
                max: 100,
                step: 1,
                placeholder: '50',
                helpText: 'Importance rating (0-100)',
                group: 'metadata'
            },
            {
                name: 'sources',
                label: 'Sources',
                type: 'sources',
                placeholder: 'Add source reference...',
                helpText: 'Academic or historical sources',
                group: 'sources'
            },
            {
                name: 'relatedEntities',
                label: 'Related Entities',
                type: 'entity-references',
                placeholder: 'Search for related entities...',
                helpText: 'Link to other entities in the database',
                group: 'relationships'
            }
        ];

        // Collection-specific fields
        const specificFields = this.getCollectionSpecificFields(collection);

        // Metadata fields (usually auto-managed but editable for admins)
        const metadataFields = [
            {
                name: 'metadata.status',
                label: 'Status',
                type: 'select',
                options: ['draft', 'pending', 'published', 'archived'],
                helpText: 'Publication status',
                group: 'system'
            },
            {
                name: 'metadata.visibility',
                label: 'Visibility',
                type: 'select',
                options: ['public', 'private', 'unlisted'],
                helpText: 'Who can see this entity',
                group: 'system'
            },
            {
                name: 'metadata.featured',
                label: 'Featured',
                type: 'checkbox',
                helpText: 'Show in featured sections',
                group: 'system'
            },
            {
                name: 'metadata.verified',
                label: 'Verified',
                type: 'checkbox',
                helpText: 'Content has been verified',
                group: 'system'
            },
            {
                name: 'metadata.tags',
                label: 'Tags',
                type: 'tags',
                placeholder: 'Add tag...',
                helpText: 'Classification tags for filtering',
                group: 'system'
            }
        ];

        return {
            fields: [...baseFields, ...specificFields, ...metadataFields]
        };
    }

    /**
     * Get collection-specific fields
     */
    getCollectionSpecificFields(collection) {
        const fieldSets = {
            deities: [
                {
                    name: 'domains',
                    label: 'Domains',
                    type: 'tags',
                    placeholder: 'Add domain (e.g., Thunder, Sky)...',
                    helpText: 'Areas of influence or power',
                    group: 'attributes'
                },
                {
                    name: 'epithets',
                    label: 'Epithets',
                    type: 'tags',
                    placeholder: 'Add epithet...',
                    helpText: 'Titles and descriptive names',
                    group: 'attributes'
                },
                {
                    name: 'symbols',
                    label: 'Symbols',
                    type: 'tags',
                    placeholder: 'Add symbol...',
                    helpText: 'Sacred symbols and objects',
                    group: 'attributes'
                },
                {
                    name: 'attributes',
                    label: 'Attributes',
                    type: 'tags',
                    placeholder: 'Add attribute...',
                    helpText: 'Physical or personality attributes',
                    group: 'attributes'
                },
                {
                    name: 'relationships',
                    label: 'Family Relationships',
                    type: 'key-value',
                    keys: ['father', 'mother', 'consort', 'siblings', 'children', 'enemies'],
                    helpText: 'Family and relationship connections',
                    group: 'relationships'
                },
                {
                    name: 'worship.offerings',
                    label: 'Offerings',
                    type: 'textarea',
                    rows: 3,
                    placeholder: 'Describe traditional offerings...',
                    helpText: 'Traditional offerings and sacrifices',
                    group: 'worship'
                },
                {
                    name: 'worship.festivals',
                    label: 'Festivals',
                    type: 'tags',
                    placeholder: 'Add festival...',
                    helpText: 'Religious festivals and celebrations',
                    group: 'worship'
                },
                {
                    name: 'festivals',
                    label: 'Festival List',
                    type: 'tags',
                    placeholder: 'Add festival name...',
                    helpText: 'List of associated festivals',
                    group: 'worship'
                },
                {
                    name: 'sacred_sites',
                    label: 'Sacred Sites',
                    type: 'tags',
                    placeholder: 'Add sacred site...',
                    helpText: 'Temples, shrines, and holy places',
                    group: 'worship'
                },
                {
                    name: 'cross_cultural_parallels',
                    label: 'Cross-Cultural Parallels',
                    type: 'parallel-entities',
                    helpText: 'Similar deities in other traditions',
                    group: 'relationships'
                },
                {
                    name: 'role',
                    label: 'Role',
                    type: 'text',
                    placeholder: 'e.g., King of the Gods, God of Thunder',
                    helpText: 'Primary role or function',
                    group: 'basic'
                },
                {
                    name: 'symbolism',
                    label: 'Symbolism',
                    type: 'tags',
                    placeholder: 'Add symbolic meaning...',
                    helpText: 'What this deity symbolizes',
                    group: 'attributes'
                },
                {
                    name: 'iconography',
                    label: 'Iconography',
                    type: 'text',
                    placeholder: 'Visual representations...',
                    helpText: 'How the deity is depicted in art',
                    group: 'attributes'
                }
            ],
            creatures: [
                {
                    name: 'habitat',
                    label: 'Habitat',
                    type: 'text',
                    placeholder: 'Where this creature lives...',
                    helpText: 'Natural habitat or dwelling place',
                    group: 'attributes'
                },
                {
                    name: 'abilities',
                    label: 'Abilities',
                    type: 'tags',
                    placeholder: 'Add ability...',
                    helpText: 'Special powers and capabilities',
                    group: 'attributes'
                },
                {
                    name: 'weaknesses',
                    label: 'Weaknesses',
                    type: 'tags',
                    placeholder: 'Add weakness...',
                    helpText: 'Known vulnerabilities',
                    group: 'attributes'
                },
                {
                    name: 'classification',
                    label: 'Classification',
                    type: 'text',
                    placeholder: 'e.g., Dragon, Gorgon, Spirit',
                    helpText: 'Creature classification',
                    group: 'basic'
                },
                {
                    name: 'subType',
                    label: 'Sub-Type',
                    type: 'select',
                    options: ['beast', 'spirit', 'hybrid', 'undead', 'elemental', 'divine', 'demonic'],
                    helpText: 'Creature sub-category',
                    group: 'basic'
                },
                {
                    name: 'behavior',
                    label: 'Behavior',
                    type: 'textarea',
                    rows: 3,
                    placeholder: 'Describe typical behavior...',
                    helpText: 'Behavioral patterns and temperament',
                    group: 'attributes'
                },
                {
                    name: 'physicalDescription',
                    label: 'Physical Description',
                    type: 'textarea',
                    rows: 4,
                    placeholder: 'Describe appearance...',
                    helpText: 'Physical appearance and characteristics',
                    group: 'details'
                }
            ],
            heroes: [
                {
                    name: 'quests',
                    label: 'Quests',
                    type: 'tags',
                    placeholder: 'Add quest...',
                    helpText: 'Famous quests and adventures',
                    group: 'attributes'
                },
                {
                    name: 'weapons',
                    label: 'Weapons',
                    type: 'tags',
                    placeholder: 'Add weapon...',
                    helpText: 'Legendary weapons and tools',
                    group: 'attributes'
                },
                {
                    name: 'achievements',
                    label: 'Achievements',
                    type: 'tags',
                    placeholder: 'Add achievement...',
                    helpText: 'Notable accomplishments',
                    group: 'attributes'
                },
                {
                    name: 'parentage',
                    label: 'Parentage',
                    type: 'key-value',
                    keys: ['father', 'mother', 'divine_parent'],
                    helpText: 'Parental lineage',
                    group: 'relationships'
                },
                {
                    name: 'companions',
                    label: 'Companions',
                    type: 'tags',
                    placeholder: 'Add companion...',
                    helpText: 'Allies and traveling companions',
                    group: 'relationships'
                }
            ],
            items: [
                {
                    name: 'powers',
                    label: 'Powers',
                    type: 'tags',
                    placeholder: 'Add power...',
                    helpText: 'Magical powers and properties',
                    group: 'attributes'
                },
                {
                    name: 'wielders',
                    label: 'Wielders',
                    type: 'tags',
                    placeholder: 'Add wielder...',
                    helpText: 'Who has wielded this item',
                    group: 'relationships'
                },
                {
                    name: 'materials',
                    label: 'Materials',
                    type: 'tags',
                    placeholder: 'Add material...',
                    helpText: 'What the item is made from',
                    group: 'attributes'
                },
                {
                    name: 'createdBy',
                    label: 'Created By',
                    type: 'tags',
                    placeholder: 'Add creator...',
                    helpText: 'Who forged or created this item',
                    group: 'attributes'
                },
                {
                    name: 'itemType',
                    label: 'Item Type',
                    type: 'select',
                    options: ['weapon', 'armor', 'jewelry', 'vessel', 'tool', 'relic', 'text', 'plant', 'other'],
                    helpText: 'Category of item',
                    group: 'basic'
                },
                {
                    name: 'usage',
                    label: 'Usage',
                    type: 'textarea',
                    rows: 4,
                    placeholder: 'How the item is used...',
                    helpText: 'Description of use and abilities',
                    group: 'details'
                },
                {
                    name: 'symbolism',
                    label: 'Symbolism',
                    type: 'textarea',
                    rows: 4,
                    placeholder: 'Symbolic meaning...',
                    helpText: 'What the item represents',
                    group: 'attributes'
                }
            ],
            herbs: [
                {
                    name: 'uses',
                    label: 'Uses',
                    type: 'tags',
                    placeholder: 'Add use...',
                    helpText: 'Medicinal, magical, or ritual uses',
                    group: 'attributes'
                },
                {
                    name: 'preparation',
                    label: 'Preparation',
                    type: 'textarea',
                    rows: 4,
                    placeholder: 'How to prepare this herb...',
                    helpText: 'Methods of preparation and application',
                    group: 'details'
                },
                {
                    name: 'properties',
                    label: 'Properties',
                    type: 'tags',
                    placeholder: 'Add property...',
                    helpText: 'Medicinal or magical properties',
                    group: 'attributes'
                },
                {
                    name: 'associations',
                    label: 'Divine Associations',
                    type: 'tags',
                    placeholder: 'Add deity or spirit...',
                    helpText: 'Associated deities or spirits',
                    group: 'relationships'
                }
            ],
            rituals: [
                {
                    name: 'purpose',
                    label: 'Purpose',
                    type: 'text',
                    placeholder: 'Purpose of this ritual...',
                    helpText: 'What this ritual achieves or celebrates',
                    group: 'basic'
                },
                {
                    name: 'steps',
                    label: 'Steps',
                    type: 'ordered-list',
                    placeholder: 'Add ritual step...',
                    helpText: 'Step-by-step procedure',
                    group: 'details'
                },
                {
                    name: 'offerings',
                    label: 'Offerings',
                    type: 'tags',
                    placeholder: 'Add offering...',
                    helpText: 'Required offerings or materials',
                    group: 'attributes'
                },
                {
                    name: 'timing',
                    label: 'Timing',
                    type: 'text',
                    placeholder: 'When performed...',
                    helpText: 'When the ritual should be performed',
                    group: 'attributes'
                },
                {
                    name: 'participants',
                    label: 'Participants',
                    type: 'tags',
                    placeholder: 'Add participant role...',
                    helpText: 'Who participates in the ritual',
                    group: 'attributes'
                }
            ],
            places: [
                {
                    name: 'location',
                    label: 'Location',
                    type: 'text',
                    placeholder: 'Geographic location...',
                    helpText: 'Where this place is located',
                    group: 'basic'
                },
                {
                    name: 'significance',
                    label: 'Significance',
                    type: 'textarea',
                    rows: 4,
                    placeholder: 'Why this place is important...',
                    helpText: 'Religious or mythological significance',
                    group: 'details'
                },
                {
                    name: 'associatedDeities',
                    label: 'Associated Deities',
                    type: 'entity-references',
                    entityType: 'deities',
                    placeholder: 'Search for deities...',
                    helpText: 'Deities associated with this place',
                    group: 'relationships'
                },
                {
                    name: 'coordinates',
                    label: 'Coordinates',
                    type: 'coordinates',
                    helpText: 'Geographic coordinates if known',
                    group: 'attributes'
                }
            ],
            cosmology: [
                {
                    name: 'cosmologyType',
                    label: 'Cosmology Type',
                    type: 'select',
                    options: ['creation', 'afterlife', 'realm', 'concept', 'cycle'],
                    helpText: 'Type of cosmological concept',
                    group: 'basic'
                },
                {
                    name: 'elements',
                    label: 'Key Elements',
                    type: 'tags',
                    placeholder: 'Add element...',
                    helpText: 'Key components of this cosmology',
                    group: 'attributes'
                },
                {
                    name: 'narrative',
                    label: 'Narrative',
                    type: 'richtext',
                    placeholder: 'The story or concept...',
                    helpText: 'Full narrative description',
                    group: 'details'
                }
            ],
            concepts: [
                {
                    name: 'conceptType',
                    label: 'Concept Type',
                    type: 'select',
                    options: ['archetype', 'virtue', 'philosophy', 'practice', 'symbol'],
                    helpText: 'Type of concept',
                    group: 'basic'
                },
                {
                    name: 'manifestations',
                    label: 'Manifestations',
                    type: 'tags',
                    placeholder: 'Add manifestation...',
                    helpText: 'How this concept manifests',
                    group: 'attributes'
                },
                {
                    name: 'examples',
                    label: 'Examples',
                    type: 'entity-references',
                    placeholder: 'Search for examples...',
                    helpText: 'Entities that embody this concept',
                    group: 'relationships'
                }
            ]
        };

        return fieldSets[collection] || [];
    }

    /**
     * Get mythology options
     */
    getMythologyOptions() {
        return [
            'greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist',
            'christian', 'islamic', 'jewish', 'celtic', 'aztec', 'mayan',
            'chinese', 'japanese', 'sumerian', 'babylonian', 'persian',
            'yoruba', 'aboriginal', 'polynesian', 'slavic', 'finnish'
        ];
    }

    /**
     * Get type options based on collection
     */
    getTypeOptions(collection) {
        const typeMap = {
            deities: ['deity', 'god', 'goddess', 'titan', 'primordial', 'spirit', 'angel', 'demon'],
            creatures: ['beast', 'monster', 'spirit', 'hybrid', 'undead', 'dragon', 'giant'],
            heroes: ['hero', 'demigod', 'prophet', 'sage', 'warrior', 'king', 'saint'],
            items: ['weapon', 'armor', 'artifact', 'relic', 'tool', 'vessel', 'plant'],
            places: ['realm', 'mountain', 'river', 'temple', 'city', 'island', 'underworld'],
            rituals: ['ceremony', 'festival', 'rite', 'sacrifice', 'initiation', 'prayer'],
            herbs: ['plant', 'flower', 'tree', 'herb', 'fungus', 'preparation'],
            cosmology: ['creation', 'afterlife', 'realm', 'cycle', 'concept'],
            concepts: ['archetype', 'virtue', 'symbol', 'philosophy', 'practice']
        };
        return typeMap[collection] || ['unknown'];
    }

    /**
     * Organize fields into multi-step form
     */
    organizeFieldsIntoSteps(fields) {
        const groups = {
            basic: { title: 'Basic Information', icon: 'info-circle', fields: [] },
            details: { title: 'Details & Description', icon: 'file-text', fields: [] },
            attributes: { title: 'Attributes', icon: 'tag', fields: [] },
            relationships: { title: 'Relationships', icon: 'link', fields: [] },
            worship: { title: 'Worship & Practice', icon: 'sun', fields: [] },
            sources: { title: 'Sources', icon: 'book', fields: [] },
            system: { title: 'System Settings', icon: 'settings', fields: [] },
            metadata: { title: 'Metadata', icon: 'database', fields: [] }
        };

        fields.forEach(field => {
            const group = field.group || 'details';
            if (groups[group]) {
                groups[group].fields.push(field);
            } else {
                groups.details.fields.push(field);
            }
        });

        // Filter out empty groups and return as array
        return Object.entries(groups)
            .filter(([_, group]) => group.fields.length > 0)
            .map(([key, group]) => ({
                id: key,
                ...group
            }));
    }

    /**
     * Render the complete form
     */
    async render() {
        // Load existing data if editing
        if (this.isEditing && this.crudManager) {
            try {
                const result = await this.crudManager.read(this.collection, this.entityId);
                if (result.success) {
                    this.formData = { ...this.formData, ...result.data };
                }
            } catch (error) {
                console.error('[EntityFormEnhanced] Error loading entity:', error);
            }
        }

        // Check for saved draft
        this.loadDraft();

        const totalSteps = this.steps.length;

        return `
            <div class="entity-form-enhanced" role="document" aria-label="${this.isEditing ? 'Edit' : 'Create'} ${this.collection}">
                <!-- Form Header with Progress -->
                <header class="ef-header">
                    <div class="ef-header-content">
                        <h2 class="ef-title" id="ef-title">
                            ${this.isEditing ? 'Edit' : 'Create New'} ${this.capitalizeFirst(this.collection.slice(0, -1))}
                        </h2>
                        <p class="ef-subtitle">
                            ${this.isEditing ? 'Update the information below' : 'Fill in the details to create a new entry'}
                        </p>
                    </div>
                    <button
                        class="ef-close-btn"
                        data-action="cancel"
                        aria-label="Close form"
                        title="Close (Esc)"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>

                <!-- Step Progress Indicator -->
                <nav class="ef-progress" role="tablist" aria-label="Form progress">
                    ${this.renderProgressSteps()}
                </nav>

                <!-- Form Body -->
                <form class="ef-form" id="entityFormEnhanced" novalidate>
                    <!-- Form Steps -->
                    <div class="ef-steps-container">
                        ${this.steps.map((step, index) => this.renderStep(step, index)).join('')}
                    </div>

                    <!-- Form Actions -->
                    <footer class="ef-actions">
                        <div class="ef-actions-left">
                            <button
                                type="button"
                                class="ef-btn ef-btn-ghost"
                                id="prevBtn"
                                ${this.currentStep === 0 ? 'disabled' : ''}
                                aria-label="Go to previous step"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                Previous
                            </button>
                        </div>

                        <div class="ef-actions-center">
                            <span class="ef-step-indicator">
                                Step ${this.currentStep + 1} of ${totalSteps}
                            </span>
                        </div>

                        <div class="ef-actions-right">
                            <button
                                type="button"
                                class="ef-btn ef-btn-secondary"
                                data-action="cancel"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                class="ef-btn ef-btn-primary"
                                id="nextBtn"
                                ${this.currentStep === totalSteps - 1 ? 'style="display:none"' : ''}
                            >
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>

                            <button
                                type="submit"
                                class="ef-btn ef-btn-success"
                                id="submitBtn"
                                ${this.currentStep !== totalSteps - 1 ? 'style="display:none"' : ''}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                ${this.isEditing ? 'Save Changes' : 'Create Entity'}
                            </button>
                        </div>
                    </footer>

                    <!-- Status Messages -->
                    <div class="ef-status" id="formStatus" role="status" aria-live="polite"></div>
                </form>

                <!-- Draft Indicator -->
                <div class="ef-draft-indicator" id="draftIndicator" aria-live="polite">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Draft saved</span>
                </div>

                <!-- Autocomplete Dropdown (rendered dynamically) -->
                <div class="ef-autocomplete-dropdown" id="autocompleteDropdown" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Render progress steps
     */
    renderProgressSteps() {
        return this.steps.map((step, index) => {
            const isActive = index === this.currentStep;
            const isCompleted = index < this.currentStep;
            const status = isActive ? 'current' : (isCompleted ? 'completed' : 'upcoming');

            return `
                <button
                    type="button"
                    class="ef-progress-step ${status}"
                    data-step="${index}"
                    role="tab"
                    aria-selected="${isActive}"
                    aria-label="${step.title} (Step ${index + 1})"
                    ${!isCompleted && !isActive ? 'disabled' : ''}
                >
                    <span class="ef-step-number">
                        ${isCompleted ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : index + 1}
                    </span>
                    <span class="ef-step-title">${step.title}</span>
                </button>
            `;
        }).join('');
    }

    /**
     * Render a single step
     */
    renderStep(step, index) {
        const isActive = index === this.currentStep;

        return `
            <section
                class="ef-step ${isActive ? 'active' : ''}"
                data-step="${index}"
                role="tabpanel"
                aria-hidden="${!isActive}"
                aria-labelledby="step-${index}-title"
            >
                <h3 class="ef-step-header" id="step-${index}-title">
                    <span class="ef-step-icon" aria-hidden="true">
                        ${this.getStepIcon(step.icon)}
                    </span>
                    ${step.title}
                </h3>

                <div class="ef-fields-grid">
                    ${step.fields.map(field => this.renderField(field)).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Get SVG icon for step
     */
    getStepIcon(iconName) {
        const icons = {
            'info-circle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            'file-text': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
            'tag': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
            'link': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
            'sun': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
            'book': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
            'settings': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            'database': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>'
        };
        return icons[iconName] || icons['info-circle'];
    }

    /**
     * Render a single form field based on type
     */
    renderField(field) {
        const value = this.getNestedValue(this.formData, field.name);
        const error = this.errors[field.name];
        const warning = this.warnings[field.name];
        const fieldId = `field-${field.name.replace(/\./g, '-')}`;
        const errorId = `error-${field.name.replace(/\./g, '-')}`;
        const helpId = `help-${field.name.replace(/\./g, '-')}`;

        let inputHTML = '';

        switch (field.type) {
            case 'text':
                inputHTML = this.renderTextField(field, value, fieldId, helpId, errorId);
                break;
            case 'textarea':
                inputHTML = this.renderTextareaField(field, value, fieldId, helpId, errorId);
                break;
            case 'richtext':
                inputHTML = this.renderRichtextField(field, value, fieldId, helpId, errorId);
                break;
            case 'select':
                inputHTML = this.renderSelectField(field, value, fieldId, helpId, errorId);
                break;
            case 'number':
                inputHTML = this.renderNumberField(field, value, fieldId, helpId, errorId);
                break;
            case 'checkbox':
                inputHTML = this.renderCheckboxField(field, value, fieldId, helpId, errorId);
                break;
            case 'tags':
                inputHTML = this.renderTagsField(field, value, fieldId, helpId, errorId);
                break;
            case 'ordered-list':
                inputHTML = this.renderOrderedListField(field, value, fieldId, helpId, errorId);
                break;
            case 'key-value':
                inputHTML = this.renderKeyValueField(field, value, fieldId, helpId, errorId);
                break;
            case 'entity-references':
                inputHTML = this.renderEntityReferencesField(field, value, fieldId, helpId, errorId);
                break;
            case 'parallel-entities':
                inputHTML = this.renderParallelEntitiesField(field, value, fieldId, helpId, errorId);
                break;
            case 'sources':
                inputHTML = this.renderSourcesField(field, value, fieldId, helpId, errorId);
                break;
            case 'image':
                inputHTML = this.renderImageField(field, value, fieldId, helpId, errorId);
                break;
            case 'emoji':
                inputHTML = this.renderEmojiField(field, value, fieldId, helpId, errorId);
                break;
            case 'date':
                inputHTML = this.renderDateField(field, value, fieldId, helpId, errorId);
                break;
            case 'coordinates':
                inputHTML = this.renderCoordinatesField(field, value, fieldId, helpId, errorId);
                break;
            default:
                inputHTML = this.renderTextField(field, value, fieldId, helpId, errorId);
        }

        const fieldClass = `ef-field ${error ? 'has-error' : ''} ${warning ? 'has-warning' : ''} ${field.required ? 'required' : ''}`;

        return `
            <div class="${fieldClass}" data-field="${field.name}" data-type="${field.type}">
                <label for="${fieldId}" class="ef-label">
                    ${field.label}
                    ${field.required ? '<span class="ef-required" aria-label="required">*</span>' : ''}
                </label>
                ${inputHTML}
                ${field.helpText ? `<p class="ef-help-text" id="${helpId}">${field.helpText}</p>` : ''}
                ${error ? `<p class="ef-error-text" id="${errorId}" role="alert">${error}</p>` : ''}
                ${warning ? `<p class="ef-warning-text">${warning}</p>` : ''}
            </div>
        `;
    }

    // Individual field renderers

    renderTextField(field, value, fieldId, helpId, errorId) {
        return `
            <input
                type="text"
                id="${fieldId}"
                name="${field.name}"
                value="${this.escapeHtml(value || '')}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required aria-required="true"' : ''}
                ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
                class="ef-input"
                aria-describedby="${[field.helpText ? helpId : '', this.errors[field.name] ? errorId : ''].filter(Boolean).join(' ')}"
            />
        `;
    }

    renderTextareaField(field, value, fieldId, helpId, errorId) {
        return `
            <textarea
                id="${fieldId}"
                name="${field.name}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required aria-required="true"' : ''}
                rows="${field.rows || 4}"
                ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
                class="ef-textarea"
                aria-describedby="${[field.helpText ? helpId : '', this.errors[field.name] ? errorId : ''].filter(Boolean).join(' ')}"
            >${this.escapeHtml(value || '')}</textarea>
            ${field.validation?.maxLength ? `<span class="ef-char-count"><span id="${fieldId}-count">${(value || '').length}</span>/${field.validation.maxLength}</span>` : ''}
        `;
    }

    renderRichtextField(field, value, fieldId, helpId, errorId) {
        return `
            <div class="ef-richtext-editor">
                <div class="ef-richtext-toolbar" role="toolbar" aria-label="Text formatting">
                    <button type="button" class="ef-toolbar-btn" data-command="bold" title="Bold (Ctrl+B)">
                        <strong>B</strong>
                    </button>
                    <button type="button" class="ef-toolbar-btn" data-command="italic" title="Italic (Ctrl+I)">
                        <em>I</em>
                    </button>
                    <button type="button" class="ef-toolbar-btn" data-command="underline" title="Underline (Ctrl+U)">
                        <u>U</u>
                    </button>
                    <span class="ef-toolbar-divider"></span>
                    <button type="button" class="ef-toolbar-btn" data-command="insertUnorderedList" title="Bullet list">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/><line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                    <button type="button" class="ef-toolbar-btn" data-command="insertOrderedList" title="Numbered list">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><text x="2" y="8" font-size="8">1</text><text x="2" y="14" font-size="8">2</text><text x="2" y="20" font-size="8">3</text><line x1="10" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2"/><line x1="10" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/><line x1="10" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                    <span class="ef-toolbar-divider"></span>
                    <button type="button" class="ef-toolbar-btn" data-command="createLink" title="Insert link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </button>
                </div>
                <div
                    id="${fieldId}"
                    class="ef-richtext-content"
                    contenteditable="true"
                    data-field="${field.name}"
                    role="textbox"
                    aria-multiline="true"
                    aria-label="${field.label}"
                    data-placeholder="${field.placeholder || 'Enter text...'}"
                >${value || ''}</div>
            </div>
        `;
    }

    renderSelectField(field, value, fieldId, helpId, errorId) {
        const options = (field.options || []).map(opt => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : this.capitalizeFirst(opt);
            return `<option value="${optValue}" ${value === optValue ? 'selected' : ''}>${optLabel}</option>`;
        }).join('');

        return `
            <select
                id="${fieldId}"
                name="${field.name}"
                ${field.required ? 'required aria-required="true"' : ''}
                class="ef-select"
                aria-describedby="${field.helpText ? helpId : ''}"
            >
                <option value="">Select ${field.label}...</option>
                ${options}
            </select>
        `;
    }

    renderNumberField(field, value, fieldId, helpId, errorId) {
        return `
            <div class="ef-number-input-wrapper">
                <button type="button" class="ef-number-btn ef-number-minus" data-field="${field.name}" aria-label="Decrease">-</button>
                <input
                    type="number"
                    id="${fieldId}"
                    name="${field.name}"
                    value="${value !== undefined && value !== null ? value : ''}"
                    placeholder="${field.placeholder || ''}"
                    ${field.min !== undefined ? `min="${field.min}"` : ''}
                    ${field.max !== undefined ? `max="${field.max}"` : ''}
                    ${field.step !== undefined ? `step="${field.step}"` : ''}
                    class="ef-input ef-number-input"
                    aria-describedby="${field.helpText ? helpId : ''}"
                />
                <button type="button" class="ef-number-btn ef-number-plus" data-field="${field.name}" aria-label="Increase">+</button>
            </div>
        `;
    }

    renderCheckboxField(field, value, fieldId, helpId, errorId) {
        return `
            <label class="ef-checkbox-wrapper">
                <input
                    type="checkbox"
                    id="${fieldId}"
                    name="${field.name}"
                    ${value ? 'checked' : ''}
                    class="ef-checkbox"
                />
                <span class="ef-checkbox-label">${field.helpText || field.label}</span>
            </label>
        `;
    }

    renderTagsField(field, value, fieldId, helpId, errorId) {
        const tags = Array.isArray(value) ? value : [];
        return `
            <div class="ef-tags-container" id="${field.name}_container">
                <div class="ef-tags-list" role="list" aria-label="${field.label} tags">
                    ${tags.map((tag, idx) => `
                        <span class="ef-tag" role="listitem" data-index="${idx}">
                            <span class="ef-tag-text">${this.escapeHtml(tag)}</span>
                            <button
                                type="button"
                                class="ef-tag-remove"
                                data-tag="${this.escapeHtml(tag)}"
                                data-field="${field.name}"
                                aria-label="Remove ${this.escapeHtml(tag)}"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </span>
                    `).join('')}
                </div>
                <div class="ef-tag-input-wrapper">
                    <input
                        type="text"
                        id="${fieldId}_input"
                        placeholder="${field.placeholder || 'Add item and press Enter...'}"
                        class="ef-input ef-tag-input"
                        data-field="${field.name}"
                        aria-label="Add ${field.label}"
                    />
                    <button type="button" class="ef-tag-add-btn" data-field="${field.name}" aria-label="Add">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    renderOrderedListField(field, value, fieldId, helpId, errorId) {
        const items = Array.isArray(value) ? value : [];
        return `
            <div class="ef-ordered-list-container" id="${field.name}_container" data-field="${field.name}">
                <ol class="ef-ordered-list" role="list">
                    ${items.map((item, idx) => `
                        <li class="ef-ordered-item" data-index="${idx}">
                            <span class="ef-item-handle" aria-label="Drag to reorder">&#x2630;</span>
                            <input
                                type="text"
                                value="${this.escapeHtml(item)}"
                                class="ef-input ef-ordered-input"
                                data-field="${field.name}"
                                data-index="${idx}"
                            />
                            <button type="button" class="ef-item-remove" data-index="${idx}" aria-label="Remove item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </li>
                    `).join('')}
                </ol>
                <div class="ef-ordered-add">
                    <input
                        type="text"
                        id="${fieldId}_input"
                        placeholder="${field.placeholder || 'Add step...'}"
                        class="ef-input"
                        data-field="${field.name}"
                    />
                    <button type="button" class="ef-btn ef-btn-small" data-action="add-ordered-item" data-field="${field.name}">
                        Add Step
                    </button>
                </div>
            </div>
        `;
    }

    renderKeyValueField(field, value, fieldId, helpId, errorId) {
        const data = typeof value === 'object' && value !== null ? value : {};
        const keys = field.keys || Object.keys(data);

        return `
            <div class="ef-key-value-container" id="${field.name}_container" data-field="${field.name}">
                ${keys.map(key => `
                    <div class="ef-key-value-row">
                        <label class="ef-key-label">${this.capitalizeFirst(key.replace(/_/g, ' '))}</label>
                        <input
                            type="text"
                            name="${field.name}.${key}"
                            value="${this.escapeHtml(data[key] || '')}"
                            placeholder="Enter ${key}..."
                            class="ef-input ef-key-value-input"
                            data-field="${field.name}"
                            data-key="${key}"
                        />
                    </div>
                `).join('')}
                ${!field.keys ? `
                    <div class="ef-key-value-add">
                        <input type="text" placeholder="Key" class="ef-input ef-new-key" />
                        <input type="text" placeholder="Value" class="ef-input ef-new-value" />
                        <button type="button" class="ef-btn ef-btn-small" data-action="add-key-value" data-field="${field.name}">Add</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderEntityReferencesField(field, value, fieldId, helpId, errorId) {
        const refs = Array.isArray(value) ? value : [];
        return `
            <div class="ef-entity-refs-container" id="${field.name}_container" data-field="${field.name}">
                <div class="ef-entity-refs-list">
                    ${refs.map((ref, idx) => `
                        <div class="ef-entity-ref" data-index="${idx}">
                            <span class="ef-entity-ref-icon">${ref.icon || '&#x1F517;'}</span>
                            <span class="ef-entity-ref-name">${this.escapeHtml(ref.name || ref.id || 'Unknown')}</span>
                            <span class="ef-entity-ref-type">${ref.type || ''}</span>
                            <button type="button" class="ef-entity-ref-remove" data-index="${idx}" aria-label="Remove reference">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="ef-entity-search-wrapper">
                    <input
                        type="text"
                        id="${fieldId}_search"
                        placeholder="${field.placeholder || 'Search for entities...'}"
                        class="ef-input ef-entity-search"
                        data-field="${field.name}"
                        data-entity-type="${field.entityType || ''}"
                        autocomplete="off"
                        aria-label="Search entities"
                        aria-autocomplete="list"
                    />
                    <div class="ef-autocomplete-results" id="${field.name}_results"></div>
                </div>
            </div>
        `;
    }

    renderParallelEntitiesField(field, value, fieldId, helpId, errorId) {
        const parallels = Array.isArray(value) ? value : [];
        return `
            <div class="ef-parallel-container" id="${field.name}_container" data-field="${field.name}">
                <div class="ef-parallel-list">
                    ${parallels.map((p, idx) => `
                        <div class="ef-parallel-item" data-index="${idx}">
                            <input type="text" value="${this.escapeHtml(p.name || '')}" placeholder="Entity name" class="ef-input" data-key="name" />
                            <select class="ef-select ef-parallel-tradition" data-key="tradition">
                                <option value="">Tradition...</option>
                                ${this.getMythologyOptions().map(m =>
                                    `<option value="${m}" ${p.tradition === m ? 'selected' : ''}>${this.capitalizeFirst(m)}</option>`
                                ).join('')}
                            </select>
                            <button type="button" class="ef-parallel-remove" data-index="${idx}" aria-label="Remove">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="ef-btn ef-btn-small ef-add-parallel" data-field="${field.name}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Parallel
                </button>
            </div>
        `;
    }

    renderSourcesField(field, value, fieldId, helpId, errorId) {
        const sources = Array.isArray(value) ? value : [];
        return `
            <div class="ef-sources-container" id="${field.name}_container" data-field="${field.name}">
                <div class="ef-sources-list">
                    ${sources.map((src, idx) => `
                        <div class="ef-source-item" data-index="${idx}">
                            <input type="text" value="${this.escapeHtml(src.title || src)}" placeholder="Source title" class="ef-input" data-key="title" />
                            <input type="url" value="${this.escapeHtml(src.url || '')}" placeholder="URL (optional)" class="ef-input" data-key="url" />
                            <button type="button" class="ef-source-remove" data-index="${idx}" aria-label="Remove">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="ef-btn ef-btn-small ef-add-source" data-field="${field.name}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Source
                </button>
            </div>
        `;
    }

    renderImageField(field, value, fieldId, helpId, errorId) {
        const hasImage = value || this.uploadedFiles[field.name];
        return `
            <div class="ef-image-upload">
                <input
                    type="file"
                    id="${fieldId}"
                    name="${field.name}"
                    accept="image/*"
                    class="ef-image-input"
                    aria-label="Upload image"
                />
                <label for="${fieldId}" class="ef-image-label ${hasImage ? 'has-image' : ''}">
                    ${hasImage ? '' : `
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span class="ef-image-label-text">Click or drag to upload</span>
                        <span class="ef-image-label-hint">PNG, JPG, GIF up to 5MB</span>
                    `}
                </label>
                <div class="ef-image-preview" id="${field.name}_preview" ${hasImage ? '' : 'style="display:none"'}>
                    ${hasImage ? `
                        <img src="${value}" alt="Preview" />
                        <button type="button" class="ef-image-remove" data-field="${field.name}" aria-label="Remove image">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Remove
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderEmojiField(field, value, fieldId, helpId, errorId) {
        return `
            <div class="ef-emoji-picker-wrapper">
                <button type="button" class="ef-emoji-trigger" id="${fieldId}_trigger" data-field="${field.name}">
                    <span class="ef-emoji-value">${value || '+'}</span>
                </button>
                <input type="hidden" id="${fieldId}" name="${field.name}" value="${value || ''}" />
                <div class="ef-emoji-panel" id="${field.name}_panel" style="display: none;">
                    <div class="ef-emoji-grid">
                        ${this.getCommonEmojis().map(emoji =>
                            `<button type="button" class="ef-emoji-option" data-emoji="${emoji}">${emoji}</button>`
                        ).join('')}
                    </div>
                    <input type="text" class="ef-emoji-custom" placeholder="Or type custom emoji..." maxlength="2" />
                </div>
            </div>
        `;
    }

    renderDateField(field, value, fieldId, helpId, errorId) {
        let dateValue = '';
        if (value) {
            if (value._seconds) {
                dateValue = new Date(value._seconds * 1000).toISOString().split('T')[0];
            } else if (typeof value === 'string') {
                dateValue = value.split('T')[0];
            }
        }
        return `
            <input
                type="date"
                id="${fieldId}"
                name="${field.name}"
                value="${dateValue}"
                class="ef-input ef-date-input"
                aria-describedby="${field.helpText ? helpId : ''}"
            />
        `;
    }

    renderCoordinatesField(field, value, fieldId, helpId, errorId) {
        const coords = value || {};
        return `
            <div class="ef-coords-container">
                <div class="ef-coord-input">
                    <label>Latitude</label>
                    <input
                        type="number"
                        name="${field.name}.latitude"
                        value="${coords.latitude || ''}"
                        step="0.000001"
                        min="-90"
                        max="90"
                        placeholder="e.g., 37.9838"
                        class="ef-input"
                    />
                </div>
                <div class="ef-coord-input">
                    <label>Longitude</label>
                    <input
                        type="number"
                        name="${field.name}.longitude"
                        value="${coords.longitude || ''}"
                        step="0.000001"
                        min="-180"
                        max="180"
                        placeholder="e.g., 23.7275"
                        class="ef-input"
                    />
                </div>
            </div>
        `;
    }

    /**
     * Get common emojis for the picker
     */
    getCommonEmojis() {
        return [
            // Mythology themed
            '&#x26A1;', '&#x1F525;', '&#x1F30A;', '&#x2728;', '&#x1F31F;', '&#x2600;', '&#x1F319;', '&#x1F300;',
            // Animals
            '&#x1F985;', '&#x1F40D;', '&#x1F40B;', '&#x1F434;', '&#x1F981;', '&#x1F43A;', '&#x1F409;', '&#x1F426;',
            // Objects
            '&#x2694;', '&#x1F5E1;', '&#x1F6E1;', '&#x1F3F9;', '&#x1FA84;', '&#x1F451;', '&#x1F48E;', '&#x1F52E;',
            // Symbols
            '&#x262F;', '&#x2721;', '&#x271D;', '&#x262A;', '&#x2638;', '&#x1F549;', '&#x2696;', '&#x269B;'
        ];
    }

    /**
     * Initialize form after rendering to DOM
     */
    initialize(container) {
        this.container = container;
        this.form = container.querySelector('#entityFormEnhanced');

        if (!this.form) {
            console.error('[EntityFormEnhanced] Form element not found');
            return;
        }

        // Form submission
        this.form.addEventListener('submit', this.handleSubmit);

        // Cancel buttons
        container.querySelectorAll('[data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', this.handleCancel);
        });

        // Step navigation
        this.initializeStepNavigation();

        // Initialize field-specific handlers
        this.initializeRichtextEditors();
        this.initializeTagsInputs();
        this.initializeImageUpload();
        this.initializeNumberInputs();
        this.initializeEmojiPickers();
        this.initializeEntityAutocomplete();
        this.initializeOrderedLists();
        this.initializeKeyValueFields();
        this.initializeParallelFields();
        this.initializeSourcesFields();

        // Auto-save
        this.form.addEventListener('input', () => this.scheduleAutoSave());

        // Keyboard shortcuts
        this.initializeKeyboardShortcuts();

        // Validation on blur
        this.form.addEventListener('blur', (e) => {
            if (e.target.matches('.ef-input, .ef-textarea, .ef-select')) {
                this.validateField(e.target);
            }
        }, true);

        console.log('[EntityFormEnhanced] Initialized');
    }

    /**
     * Initialize step navigation
     */
    initializeStepNavigation() {
        const prevBtn = this.form.querySelector('#prevBtn');
        const nextBtn = this.form.querySelector('#nextBtn');

        prevBtn?.addEventListener('click', () => this.previousStep());
        nextBtn?.addEventListener('click', () => this.nextStep());

        // Progress step clicks
        this.container.querySelectorAll('.ef-progress-step').forEach(step => {
            step.addEventListener('click', (e) => {
                const stepIndex = parseInt(e.currentTarget.dataset.step);
                if (stepIndex <= this.currentStep) {
                    this.goToStep(stepIndex);
                }
            });
        });
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            if (!this.validateCurrentStep()) return;
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
        // Update step panels
        this.container.querySelectorAll('.ef-step').forEach((step, index) => {
            step.classList.toggle('active', index === this.currentStep);
            step.setAttribute('aria-hidden', index !== this.currentStep);
        });

        // Update progress indicators
        this.container.querySelectorAll('.ef-progress-step').forEach((step, index) => {
            step.classList.remove('current', 'completed', 'upcoming');
            if (index === this.currentStep) {
                step.classList.add('current');
                step.setAttribute('aria-selected', 'true');
            } else if (index < this.currentStep) {
                step.classList.add('completed');
                step.removeAttribute('disabled');
            } else {
                step.classList.add('upcoming');
            }
        });

        // Update buttons
        const prevBtn = this.form.querySelector('#prevBtn');
        const nextBtn = this.form.querySelector('#nextBtn');
        const submitBtn = this.form.querySelector('#submitBtn');

        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.style.display = this.currentStep === this.steps.length - 1 ? 'none' : '';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.steps.length - 1 ? '' : 'none';

        // Update step indicator
        const indicator = this.container.querySelector('.ef-step-indicator');
        if (indicator) {
            indicator.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
        }

        // Focus first input in new step
        setTimeout(() => {
            const currentStepEl = this.container.querySelector(`.ef-step[data-step="${this.currentStep}"]`);
            const firstInput = currentStepEl?.querySelector('input:not([type="hidden"]):not([type="file"]), textarea, select, [contenteditable="true"]');
            firstInput?.focus();
        }, 100);
    }

    /**
     * Initialize rich text editors
     */
    initializeRichtextEditors() {
        this.container.querySelectorAll('.ef-richtext-content').forEach(editor => {
            const fieldName = editor.dataset.field;

            // Initialize placeholder
            this.updateRichtextPlaceholder(editor);
            editor.addEventListener('input', () => this.updateRichtextPlaceholder(editor));

            // Toolbar buttons
            const toolbar = editor.previousElementSibling;
            if (toolbar?.classList.contains('ef-richtext-toolbar')) {
                toolbar.querySelectorAll('.ef-toolbar-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const command = btn.dataset.command;

                        if (command === 'createLink') {
                            const url = prompt('Enter URL:');
                            if (url) document.execCommand(command, false, url);
                        } else {
                            document.execCommand(command, false, null);
                        }
                        editor.focus();
                    });
                });
            }
        });
    }

    updateRichtextPlaceholder(editor) {
        if (editor.textContent.trim() === '') {
            editor.classList.add('empty');
        } else {
            editor.classList.remove('empty');
        }
    }

    /**
     * Initialize tags inputs
     */
    initializeTagsInputs() {
        this.schema.fields
            .filter(f => f.type === 'tags')
            .forEach(field => {
                const input = this.form.querySelector(`#field-${field.name.replace(/\./g, '-')}_input`);
                if (!input) return;

                // Add on Enter or comma
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        this.addTag(field.name, input.value.trim());
                        input.value = '';
                    }
                });

                // Add button
                const addBtn = this.container.querySelector(`.ef-tag-add-btn[data-field="${field.name}"]`);
                addBtn?.addEventListener('click', () => {
                    this.addTag(field.name, input.value.trim());
                    input.value = '';
                    input.focus();
                });

                // Remove buttons (delegated)
                const container = this.form.querySelector(`#${field.name}_container`);
                container?.addEventListener('click', (e) => {
                    const removeBtn = e.target.closest('.ef-tag-remove');
                    if (removeBtn) {
                        this.removeTag(field.name, removeBtn.dataset.tag);
                    }
                });
            });
    }

    addTag(fieldName, value) {
        if (!value) return;

        const container = this.form.querySelector(`#${fieldName}_container .ef-tags-list`);
        if (!container) return;

        // Check for duplicates
        const existingTags = Array.from(container.querySelectorAll('.ef-tag-text')).map(t => t.textContent.toLowerCase());
        if (existingTags.includes(value.toLowerCase())) {
            return;
        }

        const tagHTML = `
            <span class="ef-tag" role="listitem">
                <span class="ef-tag-text">${this.escapeHtml(value)}</span>
                <button
                    type="button"
                    class="ef-tag-remove"
                    data-tag="${this.escapeHtml(value)}"
                    data-field="${fieldName}"
                    aria-label="Remove ${this.escapeHtml(value)}"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </span>
        `;
        container.insertAdjacentHTML('beforeend', tagHTML);
    }

    removeTag(fieldName, value) {
        const container = this.form.querySelector(`#${fieldName}_container .ef-tags-list`);
        const tags = container?.querySelectorAll('.ef-tag');

        tags?.forEach(tag => {
            if (tag.querySelector('.ef-tag-remove')?.dataset.tag === value) {
                tag.remove();
            }
        });
    }

    getTags(fieldName) {
        const container = this.form.querySelector(`#${fieldName}_container .ef-tags-list`);
        if (!container) return [];

        return Array.from(container.querySelectorAll('.ef-tag-text')).map(t => t.textContent);
    }

    /**
     * Initialize image upload
     */
    initializeImageUpload() {
        this.schema.fields
            .filter(f => f.type === 'image')
            .forEach(field => {
                const input = this.form.querySelector(`#field-${field.name.replace(/\./g, '-')}`);
                if (!input) return;

                input.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    // Validate file
                    if (file.size > 5 * 1024 * 1024) {
                        this.showStatus('Image must be smaller than 5MB', 'error');
                        input.value = '';
                        return;
                    }

                    if (!file.type.startsWith('image/')) {
                        this.showStatus('Please select an image file', 'error');
                        input.value = '';
                        return;
                    }

                    // Show preview
                    const preview = this.form.querySelector(`#${field.name}_preview`);
                    const label = this.form.querySelector(`label[for="field-${field.name.replace(/\./g, '-')}"]`);
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="Preview" />
                            <button type="button" class="ef-image-remove" data-field="${field.name}" aria-label="Remove image">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Remove
                            </button>
                        `;
                        preview.style.display = 'block';
                        label?.classList.add('has-image');

                        this.uploadedFiles[field.name] = e.target.result;

                        // Remove button handler
                        preview.querySelector('.ef-image-remove')?.addEventListener('click', () => {
                            input.value = '';
                            delete this.uploadedFiles[field.name];
                            preview.style.display = 'none';
                            preview.innerHTML = '';
                            label?.classList.remove('has-image');
                        });
                    };

                    reader.readAsDataURL(file);
                });
            });
    }

    /**
     * Initialize number inputs with +/- buttons
     */
    initializeNumberInputs() {
        this.container.querySelectorAll('.ef-number-minus, .ef-number-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldName = btn.dataset.field;
                const input = this.form.querySelector(`input[name="${fieldName}"]`);
                if (!input) return;

                const step = parseFloat(input.step) || 1;
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                let value = parseFloat(input.value) || 0;

                if (btn.classList.contains('ef-number-plus')) {
                    value += step;
                    if (!isNaN(max)) value = Math.min(value, max);
                } else {
                    value -= step;
                    if (!isNaN(min)) value = Math.max(value, min);
                }

                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    }

    /**
     * Initialize emoji pickers
     */
    initializeEmojiPickers() {
        this.container.querySelectorAll('.ef-emoji-trigger').forEach(trigger => {
            const fieldName = trigger.dataset.field;
            const panel = this.container.querySelector(`#${fieldName}_panel`);
            const hiddenInput = this.form.querySelector(`input[name="${fieldName}"]`);

            trigger.addEventListener('click', () => {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });

            // Emoji selection
            panel?.querySelectorAll('.ef-emoji-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const emoji = opt.dataset.emoji;
                    trigger.querySelector('.ef-emoji-value').innerHTML = emoji;
                    hiddenInput.value = emoji;
                    panel.style.display = 'none';
                });
            });

            // Custom emoji input
            const customInput = panel?.querySelector('.ef-emoji-custom');
            customInput?.addEventListener('input', () => {
                if (customInput.value) {
                    trigger.querySelector('.ef-emoji-value').textContent = customInput.value;
                    hiddenInput.value = customInput.value;
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!trigger.contains(e.target) && !panel.contains(e.target)) {
                    panel.style.display = 'none';
                }
            });
        });
    }

    /**
     * Initialize entity autocomplete
     */
    initializeEntityAutocomplete() {
        this.container.querySelectorAll('.ef-entity-search').forEach(input => {
            const fieldName = input.dataset.field;
            const entityType = input.dataset.entityType;
            const resultsContainer = this.container.querySelector(`#${fieldName}_results`);

            input.addEventListener('input', () => {
                clearTimeout(this.autocompleteTimeout);
                const query = input.value.trim();

                if (query.length < 2) {
                    resultsContainer.style.display = 'none';
                    return;
                }

                this.autocompleteTimeout = setTimeout(async () => {
                    const results = await this.searchEntities(query, entityType);
                    this.renderAutocompleteResults(results, resultsContainer, fieldName);
                }, 300);
            });

            // Handle selection from results
            resultsContainer?.addEventListener('click', (e) => {
                const item = e.target.closest('.ef-autocomplete-item');
                if (item) {
                    this.addEntityReference(fieldName, {
                        id: item.dataset.id,
                        name: item.dataset.name,
                        type: item.dataset.type,
                        icon: item.dataset.icon
                    });
                    input.value = '';
                    resultsContainer.style.display = 'none';
                }
            });

            // Handle remove
            const container = this.container.querySelector(`#${fieldName}_container`);
            container?.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.ef-entity-ref-remove');
                if (removeBtn) {
                    const index = parseInt(removeBtn.dataset.index);
                    this.removeEntityReference(fieldName, index);
                }
            });
        });
    }

    async searchEntities(query, entityType) {
        // Check cache
        const cacheKey = `${entityType || 'all'}_${query.toLowerCase()}`;
        if (this.entityCache.has(cacheKey)) {
            return this.entityCache.get(cacheKey);
        }

        try {
            // Try to use global search if available
            if (window.firebase?.firestore) {
                const db = window.firebase.firestore();
                const collections = entityType ? [entityType] : ['deities', 'creatures', 'heroes', 'items', 'places'];
                const results = [];

                for (const collection of collections) {
                    try {
                        const snapshot = await db.collection(collection)
                            .where('searchTerms', 'array-contains', query.toLowerCase())
                            .limit(5)
                            .get();

                        snapshot.docs.forEach(doc => {
                            const data = doc.data();
                            results.push({
                                id: doc.id,
                                name: data.name || data.displayName,
                                type: data.type || collection.slice(0, -1),
                                icon: data.icon || '',
                                mythology: data.mythology
                            });
                        });
                    } catch (e) {
                        // Collection might not support this query
                    }
                }

                this.entityCache.set(cacheKey, results);
                return results;
            }
        } catch (error) {
            console.error('[EntityFormEnhanced] Search error:', error);
        }

        return [];
    }

    renderAutocompleteResults(results, container, fieldName) {
        if (!results.length) {
            container.innerHTML = '<div class="ef-autocomplete-empty">No results found</div>';
            container.style.display = 'block';
            return;
        }

        container.innerHTML = results.map(r => `
            <div class="ef-autocomplete-item"
                 data-id="${r.id}"
                 data-name="${this.escapeHtml(r.name)}"
                 data-type="${r.type}"
                 data-icon="${r.icon || ''}">
                <span class="ef-autocomplete-icon">${r.icon || '&#x1F517;'}</span>
                <span class="ef-autocomplete-name">${this.escapeHtml(r.name)}</span>
                <span class="ef-autocomplete-meta">${r.mythology ? this.capitalizeFirst(r.mythology) : ''} ${r.type}</span>
            </div>
        `).join('');
        container.style.display = 'block';
    }

    addEntityReference(fieldName, ref) {
        const container = this.container.querySelector(`#${fieldName}_container .ef-entity-refs-list`);
        if (!container) return;

        const index = container.children.length;
        const html = `
            <div class="ef-entity-ref" data-index="${index}">
                <span class="ef-entity-ref-icon">${ref.icon || '&#x1F517;'}</span>
                <span class="ef-entity-ref-name">${this.escapeHtml(ref.name)}</span>
                <span class="ef-entity-ref-type">${ref.type || ''}</span>
                <button type="button" class="ef-entity-ref-remove" data-index="${index}" aria-label="Remove reference">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }

    removeEntityReference(fieldName, index) {
        const container = this.container.querySelector(`#${fieldName}_container .ef-entity-refs-list`);
        const item = container?.querySelector(`[data-index="${index}"]`);
        item?.remove();

        // Reindex remaining items
        container?.querySelectorAll('.ef-entity-ref').forEach((el, i) => {
            el.dataset.index = i;
            el.querySelector('.ef-entity-ref-remove').dataset.index = i;
        });
    }

    /**
     * Initialize ordered list fields
     */
    initializeOrderedLists() {
        this.container.querySelectorAll('.ef-ordered-list-container').forEach(container => {
            const fieldName = container.dataset.field;

            // Add item
            const addBtn = container.querySelector('[data-action="add-ordered-item"]');
            const addInput = container.querySelector(`#field-${fieldName.replace(/\./g, '-')}_input`);

            addBtn?.addEventListener('click', () => {
                const value = addInput?.value.trim();
                if (value) {
                    this.addOrderedItem(fieldName, value);
                    addInput.value = '';
                    addInput.focus();
                }
            });

            addInput?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addBtn?.click();
                }
            });

            // Remove items
            container.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.ef-item-remove');
                if (removeBtn) {
                    const li = removeBtn.closest('.ef-ordered-item');
                    li?.remove();
                    this.reindexOrderedList(fieldName);
                }
            });
        });
    }

    addOrderedItem(fieldName, value) {
        const list = this.container.querySelector(`#${fieldName}_container .ef-ordered-list`);
        if (!list) return;

        const index = list.children.length;
        const html = `
            <li class="ef-ordered-item" data-index="${index}">
                <span class="ef-item-handle" aria-label="Drag to reorder">&#x2630;</span>
                <input
                    type="text"
                    value="${this.escapeHtml(value)}"
                    class="ef-input ef-ordered-input"
                    data-field="${fieldName}"
                    data-index="${index}"
                />
                <button type="button" class="ef-item-remove" data-index="${index}" aria-label="Remove item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </li>
        `;
        list.insertAdjacentHTML('beforeend', html);
    }

    reindexOrderedList(fieldName) {
        const list = this.container.querySelector(`#${fieldName}_container .ef-ordered-list`);
        list?.querySelectorAll('.ef-ordered-item').forEach((li, i) => {
            li.dataset.index = i;
            li.querySelector('.ef-ordered-input').dataset.index = i;
            li.querySelector('.ef-item-remove').dataset.index = i;
        });
    }

    /**
     * Initialize key-value fields
     */
    initializeKeyValueFields() {
        this.container.querySelectorAll('[data-action="add-key-value"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldName = btn.dataset.field;
                const container = this.container.querySelector(`#${fieldName}_container`);
                const keyInput = container?.querySelector('.ef-new-key');
                const valueInput = container?.querySelector('.ef-new-value');

                const key = keyInput?.value.trim();
                const value = valueInput?.value.trim();

                if (key) {
                    const row = document.createElement('div');
                    row.className = 'ef-key-value-row';
                    row.innerHTML = `
                        <label class="ef-key-label">${this.capitalizeFirst(key)}</label>
                        <input
                            type="text"
                            name="${fieldName}.${key}"
                            value="${this.escapeHtml(value)}"
                            class="ef-input ef-key-value-input"
                            data-field="${fieldName}"
                            data-key="${key}"
                        />
                        <button type="button" class="ef-kv-remove" aria-label="Remove">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    `;
                    container.insertBefore(row, container.querySelector('.ef-key-value-add'));

                    row.querySelector('.ef-kv-remove')?.addEventListener('click', () => row.remove());

                    keyInput.value = '';
                    valueInput.value = '';
                }
            });
        });
    }

    /**
     * Initialize parallel entity fields
     */
    initializeParallelFields() {
        this.container.querySelectorAll('.ef-add-parallel').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldName = btn.dataset.field;
                const list = this.container.querySelector(`#${fieldName}_container .ef-parallel-list`);
                if (!list) return;

                const index = list.children.length;
                const html = `
                    <div class="ef-parallel-item" data-index="${index}">
                        <input type="text" placeholder="Entity name" class="ef-input" data-key="name" />
                        <select class="ef-select ef-parallel-tradition" data-key="tradition">
                            <option value="">Tradition...</option>
                            ${this.getMythologyOptions().map(m =>
                                `<option value="${m}">${this.capitalizeFirst(m)}</option>`
                            ).join('')}
                        </select>
                        <button type="button" class="ef-parallel-remove" data-index="${index}" aria-label="Remove">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
                list.insertAdjacentHTML('beforeend', html);
            });
        });

        // Remove handlers
        this.container.querySelectorAll('.ef-parallel-container').forEach(container => {
            container.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.ef-parallel-remove');
                if (removeBtn) {
                    removeBtn.closest('.ef-parallel-item')?.remove();
                }
            });
        });
    }

    /**
     * Initialize sources fields
     */
    initializeSourcesFields() {
        this.container.querySelectorAll('.ef-add-source').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldName = btn.dataset.field;
                const list = this.container.querySelector(`#${fieldName}_container .ef-sources-list`);
                if (!list) return;

                const index = list.children.length;
                const html = `
                    <div class="ef-source-item" data-index="${index}">
                        <input type="text" placeholder="Source title" class="ef-input" data-key="title" />
                        <input type="url" placeholder="URL (optional)" class="ef-input" data-key="url" />
                        <button type="button" class="ef-source-remove" data-index="${index}" aria-label="Remove">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
                list.insertAdjacentHTML('beforeend', html);
            });
        });

        // Remove handlers
        this.container.querySelectorAll('.ef-sources-container').forEach(container => {
            container.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.ef-source-remove');
                if (removeBtn) {
                    removeBtn.closest('.ef-source-item')?.remove();
                }
            });
        });
    }

    /**
     * Initialize keyboard shortcuts
     */
    initializeKeyboardShortcuts() {
        this.container.addEventListener('keydown', (e) => {
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
                this.showDraftIndicator();
            }

            // Escape to cancel
            if (e.key === 'Escape') {
                this.handleCancel();
            }
        });
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        const currentStepFields = this.steps[this.currentStep]?.fields || [];
        let isValid = true;

        currentStepFields.forEach(field => {
            if (!this.validateFieldByName(field.name)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate a single field by name
     */
    validateFieldByName(fieldName) {
        const field = this.schema.fields.find(f => f.name === fieldName);
        if (!field) return true;

        const value = this.getFieldValue(fieldName);
        let error = null;

        // Required validation
        if (field.required) {
            if (value === null || value === undefined || value === '' ||
                (Array.isArray(value) && value.length === 0)) {
                error = `${field.label} is required`;
            }
        }

        // Type-specific validation
        if (!error && value) {
            if (field.validation?.minLength && typeof value === 'string' && value.length < field.validation.minLength) {
                error = `${field.label} must be at least ${field.validation.minLength} characters`;
            }
            if (field.validation?.maxLength && typeof value === 'string' && value.length > field.validation.maxLength) {
                error = `${field.label} must be at most ${field.validation.maxLength} characters`;
            }
            if (field.type === 'number') {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    error = `${field.label} must be a valid number`;
                } else if (field.min !== undefined && num < field.min) {
                    error = `${field.label} must be at least ${field.min}`;
                } else if (field.max !== undefined && num > field.max) {
                    error = `${field.label} must be at most ${field.max}`;
                }
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

    validateField(input) {
        const fieldName = input.name || input.dataset.field;
        if (fieldName) {
            this.validateFieldByName(fieldName);
        }
    }

    showFieldError(fieldName, error) {
        const fieldEl = this.container.querySelector(`[data-field="${fieldName}"]`);
        if (!fieldEl) return;

        fieldEl.classList.add('has-error');

        let errorEl = fieldEl.querySelector('.ef-error-text');
        if (!errorEl) {
            errorEl = document.createElement('p');
            errorEl.className = 'ef-error-text';
            errorEl.setAttribute('role', 'alert');
            fieldEl.appendChild(errorEl);
        }
        errorEl.textContent = error;
    }

    clearFieldError(fieldName) {
        const fieldEl = this.container.querySelector(`[data-field="${fieldName}"]`);
        if (!fieldEl) return;

        fieldEl.classList.remove('has-error');
        const errorEl = fieldEl.querySelector('.ef-error-text');
        errorEl?.remove();
    }

    /**
     * Get field value by name
     */
    getFieldValue(fieldName) {
        const field = this.schema.fields.find(f => f.name === fieldName);
        if (!field) return null;

        switch (field.type) {
            case 'tags':
                return this.getTags(fieldName);

            case 'richtext':
                const editor = this.container.querySelector(`[data-field="${fieldName}"].ef-richtext-content`);
                return editor?.innerHTML || '';

            case 'checkbox':
                const checkbox = this.form.querySelector(`input[name="${fieldName}"]`);
                return checkbox?.checked || false;

            case 'entity-references':
                return this.getEntityReferences(fieldName);

            case 'parallel-entities':
                return this.getParallelEntities(fieldName);

            case 'sources':
                return this.getSources(fieldName);

            case 'ordered-list':
                return this.getOrderedList(fieldName);

            case 'key-value':
                return this.getKeyValueData(fieldName);

            case 'image':
                return this.uploadedFiles[fieldName] || this.formData[fieldName];

            default:
                const input = this.form.querySelector(`[name="${fieldName}"]`);
                return input?.value || '';
        }
    }

    getEntityReferences(fieldName) {
        const container = this.container.querySelector(`#${fieldName}_container .ef-entity-refs-list`);
        if (!container) return [];

        return Array.from(container.querySelectorAll('.ef-entity-ref')).map(ref => ({
            id: ref.dataset.id,
            name: ref.querySelector('.ef-entity-ref-name')?.textContent || '',
            type: ref.querySelector('.ef-entity-ref-type')?.textContent || '',
            icon: ref.querySelector('.ef-entity-ref-icon')?.textContent || ''
        }));
    }

    getParallelEntities(fieldName) {
        const container = this.container.querySelector(`#${fieldName}_container .ef-parallel-list`);
        if (!container) return [];

        return Array.from(container.querySelectorAll('.ef-parallel-item')).map(item => ({
            name: item.querySelector('[data-key="name"]')?.value || '',
            tradition: item.querySelector('[data-key="tradition"]')?.value || ''
        })).filter(p => p.name);
    }

    getSources(fieldName) {
        const container = this.container.querySelector(`#${fieldName}_container .ef-sources-list`);
        if (!container) return [];

        return Array.from(container.querySelectorAll('.ef-source-item')).map(item => ({
            title: item.querySelector('[data-key="title"]')?.value || '',
            url: item.querySelector('[data-key="url"]')?.value || ''
        })).filter(s => s.title);
    }

    getOrderedList(fieldName) {
        const container = this.container.querySelector(`#${fieldName}_container .ef-ordered-list`);
        if (!container) return [];

        return Array.from(container.querySelectorAll('.ef-ordered-input')).map(input => input.value).filter(Boolean);
    }

    getKeyValueData(fieldName) {
        const container = this.container.querySelector(`#${fieldName}_container`);
        if (!container) return {};

        const data = {};
        container.querySelectorAll('.ef-key-value-input').forEach(input => {
            const key = input.dataset.key;
            if (key && input.value) {
                data[key] = input.value;
            }
        });
        return data;
    }

    /**
     * Collect all form data
     */
    collectFormData() {
        const data = { ...this.formData };

        this.schema.fields.forEach(field => {
            const value = this.getFieldValue(field.name);

            // Handle nested field names
            if (field.name.includes('.')) {
                const parts = field.name.split('.');
                let current = data;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            } else {
                data[field.name] = value;
            }
        });

        // Add metadata
        data.metadata = data.metadata || {};
        data.metadata.updatedAt = new Date().toISOString();

        if (!this.isEditing) {
            data.metadata.createdAt = new Date().toISOString();
            data.metadata.createdBy = 'user';
        }

        return data;
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Validate all steps
        let hasErrors = false;
        for (let i = 0; i < this.steps.length; i++) {
            this.currentStep = i;
            if (!this.validateCurrentStep()) {
                hasErrors = true;
                this.updateStepDisplay();
                break;
            }
        }

        if (hasErrors) {
            this.showStatus('Please fix the errors before submitting', 'error');
            return;
        }

        const data = this.collectFormData();
        this.showStatus('Saving...', 'loading');

        try {
            let result;
            if (this.isEditing) {
                result = await this.crudManager.update(this.collection, this.entityId, data);
            } else {
                result = await this.crudManager.create(this.collection, data);
            }

            if (result.success) {
                this.showStatus('Saved successfully!', 'success');
                this.clearDraft();
                setTimeout(() => this.onSuccess(result), 1000);
            } else {
                this.showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('[EntityFormEnhanced] Submit error:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (Object.keys(this.collectFormData()).length > Object.keys(this.formData).length) {
            if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
        }
        this.onCancel();
    }

    /**
     * Auto-save functionality
     */
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveDraft();
            this.showDraftIndicator();
        }, 3000);
    }

    saveDraft() {
        const data = this.collectFormData();
        const draftKey = `ef_draft_${this.collection}_${this.entityId || 'new'}`;
        try {
            localStorage.setItem(draftKey, JSON.stringify(data));
        } catch (e) {
            console.warn('[EntityFormEnhanced] Could not save draft:', e);
        }
    }

    loadDraft() {
        const draftKey = `ef_draft_${this.collection}_${this.entityId || 'new'}`;
        try {
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                this.formData = { ...this.formData, ...JSON.parse(draft) };
            }
        } catch (e) {
            console.warn('[EntityFormEnhanced] Could not load draft:', e);
        }
    }

    clearDraft() {
        const draftKey = `ef_draft_${this.collection}_${this.entityId || 'new'}`;
        localStorage.removeItem(draftKey);
    }

    showDraftIndicator() {
        const indicator = this.container.querySelector('#draftIndicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 2000);
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type) {
        const statusEl = this.container.querySelector('#formStatus');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `ef-status ef-status-${type}`;
        statusEl.style.display = 'block';

        if (type !== 'loading') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Utility methods
     */
    getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityFormEnhanced;
}

// Browser global
if (typeof window !== 'undefined') {
    window.EntityFormEnhanced = EntityFormEnhanced;
}
