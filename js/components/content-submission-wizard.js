/**
 * Content Submission Wizard Component
 * Eyes of Azrael Project
 *
 * A comprehensive multi-step wizard for submitting new mythological content
 * with full complexity matching existing assets.
 *
 * Steps:
 * 1. Select content type (deity, creature, hero, etc.)
 * 2. Fill in all metadata fields
 * 3. Generate/upload icon using AI SVG generator
 * 4. Add relationships and cross-references
 * 5. Preview and submit for review
 */

class ContentSubmissionWizard {
    constructor(containerSelector = '#wizard-container') {
        this.container = document.querySelector(containerSelector);
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = this.initializeFormData();
        this.iconGenerator = null;
        this.svgEditorModal = null;

        // Content type configurations
        this.contentTypes = {
            deity: {
                label: 'Deity',
                icon: '&#9889;',
                description: 'Gods, goddesses, and divine beings',
                collection: 'deities',
                fields: ['domains', 'powers', 'symbols', 'consorts', 'children', 'parents']
            },
            hero: {
                label: 'Hero',
                icon: '&#128481;',
                description: 'Legendary heroes and protagonists',
                collection: 'heroes',
                fields: ['achievements', 'weapons', 'companions', 'quests', 'birthplace', 'deathPlace']
            },
            creature: {
                label: 'Creature',
                icon: '&#128009;',
                description: 'Mythical beasts and monsters',
                collection: 'creatures',
                fields: ['habitat', 'abilities', 'weaknesses', 'behavior', 'physicalTraits']
            },
            item: {
                label: 'Artifact',
                icon: '&#9876;',
                description: 'Magical items and artifacts',
                collection: 'items',
                fields: ['itemType', 'powers', 'materials', 'wielders', 'createdBy', 'currentLocation']
            },
            place: {
                label: 'Place',
                icon: '&#127963;',
                description: 'Sacred sites and mythological locations',
                collection: 'places',
                fields: ['locationType', 'geography', 'inhabitants', 'events', 'significance']
            },
            concept: {
                label: 'Concept',
                icon: '&#128173;',
                description: 'Abstract concepts, ideas, and philosophical themes',
                collection: 'concepts',
                fields: ['category', 'relatedConcepts', 'manifestations', 'symbolism']
            },
            magic: {
                label: 'Magic System',
                icon: '&#128302;',
                description: 'Magical practices and systems',
                collection: 'magic',
                fields: ['magicType', 'practitioners', 'spells', 'rituals', 'requirements', 'limitations']
            },
            ritual: {
                label: 'Ritual',
                icon: '&#128293;',
                description: 'Ceremonies, rites, and sacred practices',
                collection: 'rituals',
                fields: ['ritualType', 'purpose', 'participants', 'timing', 'materials', 'steps']
            },
            text: {
                label: 'Sacred Text',
                icon: '&#128220;',
                description: 'Sacred scriptures and mythological texts',
                collection: 'texts',
                fields: ['textType', 'author', 'dateWritten', 'language', 'chapters', 'themes']
            },
            symbol: {
                label: 'Symbol',
                icon: '&#10024;',
                description: 'Sacred symbols and iconography',
                collection: 'symbols',
                fields: ['symbolType', 'meaning', 'usage', 'relatedSymbols', 'variations']
            }
        };

        // Mythology options
        this.mythologies = [
            'greek', 'roman', 'norse', 'egyptian', 'celtic', 'hindu', 'buddhist',
            'christian', 'jewish', 'islamic', 'japanese', 'chinese', 'sumerian',
            'babylonian', 'aztec', 'mayan', 'yoruba', 'polynesian', 'native-american',
            'slavic', 'finnish', 'persian', 'african', 'other'
        ];

        // Initialize components
        this.init();
    }

    /**
     * Initialize form data structure
     */
    initializeFormData() {
        return {
            // Step 1: Content Type
            type: null,

            // Step 2: Basic Info & Metadata
            name: '',
            icon: '',
            slug: '',
            primaryMythology: '',
            mythologies: [],
            shortDescription: '',
            longDescription: '',
            extendedContent: [],

            // Type-specific fields (populated based on type)
            typeSpecific: {},

            // Step 3: Icon/Visual
            svgIcon: null,
            iconSource: 'ai', // 'ai', 'upload', 'emoji'

            // Step 4: Relationships
            relatedEntities: [],
            sources: [],
            tags: [],

            // Linguistic data
            linguistic: {
                originalName: '',
                originalScript: '',
                transliteration: '',
                pronunciation: '',
                etymology: {
                    origin: '',
                    development: '',
                    protoIndoEuropean: ''
                },
                cognates: []
            },

            // Geographical data
            geographical: {
                region: '',
                culturalArea: '',
                coordinates: null,
                modernLocation: ''
            },

            // Temporal/chronological data
            temporal: {
                firstAttestation: {
                    date: '',
                    type: '',
                    description: '',
                    source: ''
                },
                historicalPeriod: '',
                activeWorship: {
                    start: '',
                    end: ''
                }
            },

            // Cultural data
            cultural: {
                worshipPractices: [],
                festivals: [],
                modernLegacy: ''
            },

            // Metaphysical properties
            metaphysicalProperties: {
                element: '',
                energyType: '',
                planet: '',
                chakra: ''
            },

            // Colors
            colors: {
                primary: '',
                secondary: ''
            },

            // Media references
            mediaReferences: {
                images: [],
                diagrams: []
            }
        };
    }

    /**
     * Initialize the wizard
     */
    init() {
        // Initialize AI Icon Generator
        if (window.AIIconGenerator) {
            this.iconGenerator = new window.AIIconGenerator();
        }

        // Initialize SVG Editor Modal
        if (window.SVGEditorModalClass) {
            this.svgEditorModal = new window.SVGEditorModalClass();
        }

        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the wizard
     */
    render() {
        if (!this.container) {
            console.error('ContentSubmissionWizard: Container not found');
            return;
        }

        this.container.innerHTML = this.getWizardHTML();
        this.updateProgress();
        this.showStep(this.currentStep);
    }

    /**
     * Get wizard HTML
     */
    getWizardHTML() {
        return `
            <div class="csw-wizard">
                <!-- Progress Bar -->
                <div class="csw-progress">
                    <div class="csw-progress-bar">
                        <div class="csw-progress-fill" id="csw-progress-fill"></div>
                    </div>
                    <div class="csw-progress-steps">
                        ${this.getProgressStepsHTML()}
                    </div>
                </div>

                <!-- Wizard Body -->
                <div class="csw-body">
                    <!-- Step 1: Select Type -->
                    <div class="csw-step" data-step="1">
                        <h2 class="csw-step-title">Select Content Type</h2>
                        <p class="csw-step-description">What type of mythological content would you like to submit?</p>
                        <div class="csw-type-grid" id="csw-type-grid">
                            ${this.getTypeGridHTML()}
                        </div>
                    </div>

                    <!-- Step 2: Metadata -->
                    <div class="csw-step" data-step="2">
                        <h2 class="csw-step-title">Basic Information</h2>
                        <p class="csw-step-description">Provide detailed information about this entity.</p>
                        <div class="csw-form-container" id="csw-metadata-form">
                            ${this.getMetadataFormHTML()}
                        </div>
                    </div>

                    <!-- Step 3: Icon -->
                    <div class="csw-step" data-step="3">
                        <h2 class="csw-step-title">Icon & Visual</h2>
                        <p class="csw-step-description">Create or upload an icon for this entity.</p>
                        <div class="csw-icon-section" id="csw-icon-section">
                            ${this.getIconSectionHTML()}
                        </div>
                    </div>

                    <!-- Step 4: Relationships -->
                    <div class="csw-step" data-step="4">
                        <h2 class="csw-step-title">Relationships & References</h2>
                        <p class="csw-step-description">Add connections to other entities and source references.</p>
                        <div class="csw-relationships-section" id="csw-relationships-section">
                            ${this.getRelationshipsSectionHTML()}
                        </div>
                    </div>

                    <!-- Step 5: Preview & Submit -->
                    <div class="csw-step" data-step="5">
                        <h2 class="csw-step-title">Preview & Submit</h2>
                        <p class="csw-step-description">Review your submission before sending for moderation.</p>
                        <div class="csw-preview-section" id="csw-preview-section">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Navigation -->
                <div class="csw-nav">
                    <button class="csw-btn csw-btn-secondary" id="csw-btn-prev" disabled>
                        <span class="csw-btn-icon">&larr;</span> Previous
                    </button>
                    <div class="csw-step-indicator">
                        Step <span id="csw-current-step">1</span> of ${this.totalSteps}
                    </div>
                    <button class="csw-btn csw-btn-primary" id="csw-btn-next">
                        Next <span class="csw-btn-icon">&rarr;</span>
                    </button>
                    <button class="csw-btn csw-btn-success" id="csw-btn-submit" style="display: none;">
                        <span class="csw-btn-icon">&#10003;</span> Submit for Review
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get progress steps HTML
     */
    getProgressStepsHTML() {
        const steps = [
            { num: 1, label: 'Type' },
            { num: 2, label: 'Details' },
            { num: 3, label: 'Icon' },
            { num: 4, label: 'Relations' },
            { num: 5, label: 'Submit' }
        ];

        return steps.map(step => `
            <div class="csw-progress-step ${step.num === 1 ? 'active' : ''}" data-step="${step.num}">
                <div class="csw-step-circle">${step.num}</div>
                <div class="csw-step-label">${step.label}</div>
            </div>
        `).join('');
    }

    /**
     * Get type selection grid HTML
     */
    getTypeGridHTML() {
        return Object.entries(this.contentTypes).map(([type, config]) => `
            <div class="csw-type-card" data-type="${type}">
                <div class="csw-type-icon">${config.icon}</div>
                <div class="csw-type-label">${config.label}</div>
                <div class="csw-type-description">${config.description}</div>
            </div>
        `).join('');
    }

    /**
     * Get metadata form HTML
     */
    getMetadataFormHTML() {
        return `
            <!-- Basic Information -->
            <div class="csw-form-section">
                <h3 class="csw-section-title">Basic Information</h3>

                <div class="csw-form-row">
                    <div class="csw-form-group csw-form-group-lg">
                        <label class="csw-label" for="csw-name">Name <span class="csw-required">*</span></label>
                        <input type="text" id="csw-name" class="csw-input" placeholder="e.g., Zeus, Excalibur, Mount Olympus" required>
                        <p class="csw-hint">The primary name of this entity</p>
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label" for="csw-emoji-icon">Emoji Icon</label>
                        <input type="text" id="csw-emoji-icon" class="csw-input csw-input-emoji" maxlength="4" placeholder="&#9889;">
                        <p class="csw-hint">Optional emoji representation</p>
                    </div>
                </div>

                <div class="csw-form-row">
                    <div class="csw-form-group">
                        <label class="csw-label" for="csw-primary-mythology">Primary Mythology <span class="csw-required">*</span></label>
                        <select id="csw-primary-mythology" class="csw-select" required>
                            <option value="">Select mythology...</option>
                            ${this.mythologies.map(m => `<option value="${m}">${this.capitalize(m.replace('-', ' '))}</option>`).join('')}
                        </select>
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label" for="csw-mythologies">Additional Mythologies</label>
                        <select id="csw-mythologies" class="csw-select" multiple>
                            ${this.mythologies.map(m => `<option value="${m}">${this.capitalize(m.replace('-', ' '))}</option>`).join('')}
                        </select>
                        <p class="csw-hint">Hold Ctrl/Cmd to select multiple</p>
                    </div>
                </div>

                <div class="csw-form-group">
                    <label class="csw-label" for="csw-short-description">Short Description <span class="csw-required">*</span></label>
                    <textarea id="csw-short-description" class="csw-textarea" rows="2" maxlength="300" placeholder="A brief one-sentence summary..." required></textarea>
                    <p class="csw-hint"><span id="csw-short-desc-count">0</span>/300 characters</p>
                </div>

                <div class="csw-form-group">
                    <label class="csw-label" for="csw-long-description">Full Description <span class="csw-required">*</span></label>
                    <textarea id="csw-long-description" class="csw-textarea" rows="8" placeholder="Provide a comprehensive description. Markdown is supported." required></textarea>
                    <p class="csw-hint">Supports Markdown formatting</p>
                </div>
            </div>

            <!-- Type-Specific Fields -->
            <div class="csw-form-section" id="csw-type-specific-section">
                <h3 class="csw-section-title">Type-Specific Details</h3>
                <div id="csw-type-specific-fields">
                    <p class="csw-placeholder-text">Select a content type to see specific fields</p>
                </div>
            </div>

            <!-- Linguistic Data -->
            <div class="csw-form-section csw-collapsible">
                <h3 class="csw-section-title csw-collapsible-header">
                    <span>Linguistic Information</span>
                    <span class="csw-collapse-icon">+</span>
                </h3>
                <div class="csw-collapsible-content" style="display: none;">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-original-name">Original Name</label>
                            <input type="text" id="csw-original-name" class="csw-input" placeholder="e.g., Name in original language">
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-original-script">Original Script</label>
                            <input type="text" id="csw-original-script" class="csw-input" placeholder="e.g., Original writing system">
                        </div>
                    </div>
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-transliteration">Transliteration</label>
                            <input type="text" id="csw-transliteration" class="csw-input" placeholder="e.g., Romanized form">
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-pronunciation">Pronunciation</label>
                            <input type="text" id="csw-pronunciation" class="csw-input" placeholder="e.g., IPA or phonetic">
                        </div>
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label" for="csw-etymology">Etymology</label>
                        <textarea id="csw-etymology" class="csw-textarea" rows="3" placeholder="Origin and development of the name..."></textarea>
                    </div>
                </div>
            </div>

            <!-- Geographical Data -->
            <div class="csw-form-section csw-collapsible">
                <h3 class="csw-section-title csw-collapsible-header">
                    <span>Geographical Information</span>
                    <span class="csw-collapse-icon">+</span>
                </h3>
                <div class="csw-collapsible-content" style="display: none;">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-region">Region</label>
                            <input type="text" id="csw-region" class="csw-input" placeholder="e.g., Mediterranean, Northern Europe">
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-cultural-area">Cultural Area</label>
                            <input type="text" id="csw-cultural-area" class="csw-input" placeholder="e.g., Ancient Greece, Scandinavia">
                        </div>
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label" for="csw-modern-location">Modern Location</label>
                        <input type="text" id="csw-modern-location" class="csw-input" placeholder="e.g., Modern country or city">
                    </div>
                </div>
            </div>

            <!-- Temporal Data -->
            <div class="csw-form-section csw-collapsible">
                <h3 class="csw-section-title csw-collapsible-header">
                    <span>Historical/Temporal Information</span>
                    <span class="csw-collapse-icon">+</span>
                </h3>
                <div class="csw-collapsible-content" style="display: none;">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-first-attestation">First Attestation</label>
                            <input type="text" id="csw-first-attestation" class="csw-input" placeholder="e.g., c. 800 BCE">
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-historical-period">Historical Period</label>
                            <input type="text" id="csw-historical-period" class="csw-input" placeholder="e.g., Archaic Greece, Viking Age">
                        </div>
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label" for="csw-first-attestation-source">First Attestation Source</label>
                        <input type="text" id="csw-first-attestation-source" class="csw-input" placeholder="e.g., Homer's Iliad, Poetic Edda">
                    </div>
                </div>
            </div>

            <!-- Metaphysical Properties -->
            <div class="csw-form-section csw-collapsible">
                <h3 class="csw-section-title csw-collapsible-header">
                    <span>Metaphysical Properties</span>
                    <span class="csw-collapse-icon">+</span>
                </h3>
                <div class="csw-collapsible-content" style="display: none;">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-element">Element</label>
                            <select id="csw-element" class="csw-select">
                                <option value="">Select element...</option>
                                <option value="fire">Fire</option>
                                <option value="water">Water</option>
                                <option value="earth">Earth</option>
                                <option value="air">Air</option>
                                <option value="aether">Aether</option>
                                <option value="spirit">Spirit</option>
                                <option value="void">Void</option>
                            </select>
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-planet">Associated Planet</label>
                            <select id="csw-planet" class="csw-select">
                                <option value="">Select planet...</option>
                                <option value="sun">Sun</option>
                                <option value="moon">Moon</option>
                                <option value="mercury">Mercury</option>
                                <option value="venus">Venus</option>
                                <option value="mars">Mars</option>
                                <option value="jupiter">Jupiter</option>
                                <option value="saturn">Saturn</option>
                                <option value="uranus">Uranus</option>
                                <option value="neptune">Neptune</option>
                                <option value="pluto">Pluto</option>
                            </select>
                        </div>
                    </div>
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-energy-type">Energy Type</label>
                            <input type="text" id="csw-energy-type" class="csw-input" placeholder="e.g., divine, arcane, nature">
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-chakra">Associated Chakra</label>
                            <select id="csw-chakra" class="csw-select">
                                <option value="">Select chakra...</option>
                                <option value="root">Root (Muladhara)</option>
                                <option value="sacral">Sacral (Svadhisthana)</option>
                                <option value="solar-plexus">Solar Plexus (Manipura)</option>
                                <option value="heart">Heart (Anahata)</option>
                                <option value="throat">Throat (Vishuddha)</option>
                                <option value="third-eye">Third Eye (Ajna)</option>
                                <option value="crown">Crown (Sahasrara)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Colors -->
            <div class="csw-form-section csw-collapsible">
                <h3 class="csw-section-title csw-collapsible-header">
                    <span>Associated Colors</span>
                    <span class="csw-collapse-icon">+</span>
                </h3>
                <div class="csw-collapsible-content" style="display: none;">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-primary-color">Primary Color</label>
                            <div class="csw-color-picker">
                                <input type="color" id="csw-primary-color" class="csw-input-color" value="#8b7fff">
                                <input type="text" id="csw-primary-color-hex" class="csw-input csw-input-sm" value="#8b7fff">
                            </div>
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label" for="csw-secondary-color">Secondary Color</label>
                            <div class="csw-color-picker">
                                <input type="color" id="csw-secondary-color" class="csw-input-color" value="#f59e0b">
                                <input type="text" id="csw-secondary-color-hex" class="csw-input csw-input-sm" value="#f59e0b">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get icon section HTML
     */
    getIconSectionHTML() {
        return `
            <div class="csw-icon-options">
                <div class="csw-icon-option active" data-source="ai">
                    <div class="csw-icon-option-icon">&#129302;</div>
                    <div class="csw-icon-option-label">AI Generate</div>
                    <div class="csw-icon-option-desc">Generate an icon using AI based on entity data</div>
                </div>
                <div class="csw-icon-option" data-source="editor">
                    <div class="csw-icon-option-icon">&#127912;</div>
                    <div class="csw-icon-option-label">SVG Editor</div>
                    <div class="csw-icon-option-desc">Create or paste custom SVG code</div>
                </div>
                <div class="csw-icon-option" data-source="emoji">
                    <div class="csw-icon-option-icon">&#128516;</div>
                    <div class="csw-icon-option-label">Use Emoji</div>
                    <div class="csw-icon-option-desc">Use the emoji specified in basic info</div>
                </div>
            </div>

            <div class="csw-icon-generator" id="csw-icon-generator">
                <div class="csw-icon-controls">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label">Style</label>
                            <select id="csw-icon-style" class="csw-select">
                                <option value="symbolic">Symbolic - Clean icons</option>
                                <option value="detailed">Detailed - Rich designs</option>
                                <option value="minimalist">Minimalist - Simple lines</option>
                                <option value="geometric">Geometric - Sacred patterns</option>
                                <option value="vintage">Vintage - Classic look</option>
                                <option value="neon">Neon - Glowing effect</option>
                            </select>
                        </div>
                        <div class="csw-form-group">
                            <label class="csw-label">Theme</label>
                            <select id="csw-icon-theme" class="csw-select">
                                <option value="night">Night - Purple tones</option>
                                <option value="cosmic">Cosmic - Pink/Purple</option>
                                <option value="sacred">Sacred - Amber tones</option>
                                <option value="golden">Golden - Gold/Yellow</option>
                                <option value="ocean">Ocean - Blue/Cyan</option>
                                <option value="fire">Fire - Red/Orange</option>
                                <option value="nature">Nature - Green tones</option>
                            </select>
                        </div>
                    </div>
                    <button class="csw-btn csw-btn-primary" id="csw-generate-icon-btn">
                        <span class="csw-btn-icon">&#10024;</span> Generate Icon
                    </button>
                </div>

                <div class="csw-icon-preview">
                    <div class="csw-icon-preview-container" id="csw-icon-preview">
                        <p class="csw-placeholder-text">Icon preview will appear here</p>
                    </div>
                    <div class="csw-icon-actions">
                        <button class="csw-btn csw-btn-secondary" id="csw-regenerate-icon-btn" disabled>
                            <span class="csw-btn-icon">&#128260;</span> Regenerate
                        </button>
                        <button class="csw-btn csw-btn-secondary" id="csw-edit-svg-btn" disabled>
                            <span class="csw-btn-icon">&#9998;</span> Edit SVG
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get relationships section HTML
     */
    getRelationshipsSectionHTML() {
        return `
            <!-- Related Entities -->
            <div class="csw-form-section">
                <h3 class="csw-section-title">Related Entities</h3>
                <p class="csw-section-description">Link this entity to others in the database</p>

                <div class="csw-relationship-list" id="csw-relationship-list">
                    <p class="csw-placeholder-text">No relationships added yet</p>
                </div>

                <div class="csw-add-relationship">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label">Relationship Type</label>
                            <select id="csw-rel-type" class="csw-select">
                                <option value="parent">Parent of</option>
                                <option value="child">Child of</option>
                                <option value="sibling">Sibling of</option>
                                <option value="consort">Consort/Spouse of</option>
                                <option value="ally">Ally of</option>
                                <option value="enemy">Enemy of</option>
                                <option value="created">Created by</option>
                                <option value="creator">Creator of</option>
                                <option value="wielder">Wielder of</option>
                                <option value="location">Located at</option>
                                <option value="related">Related to</option>
                                <option value="aspect">Aspect of</option>
                                <option value="syncretized">Syncretized with</option>
                            </select>
                        </div>
                        <div class="csw-form-group csw-form-group-lg">
                            <label class="csw-label">Related Entity Name</label>
                            <input type="text" id="csw-rel-entity" class="csw-input" placeholder="Start typing to search...">
                        </div>
                        <div class="csw-form-group csw-form-group-btn">
                            <button class="csw-btn csw-btn-secondary" id="csw-add-relationship-btn">
                                + Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tags -->
            <div class="csw-form-section">
                <h3 class="csw-section-title">Tags</h3>
                <p class="csw-section-description">Add searchable tags for this entity</p>

                <div class="csw-tag-list" id="csw-tag-list">
                    <!-- Tags will be added here -->
                </div>

                <div class="csw-add-tag">
                    <input type="text" id="csw-new-tag" class="csw-input" placeholder="Add a tag...">
                    <button class="csw-btn csw-btn-secondary" id="csw-add-tag-btn">+ Add Tag</button>
                </div>
            </div>

            <!-- Sources -->
            <div class="csw-form-section">
                <h3 class="csw-section-title">Sources & References</h3>
                <p class="csw-section-description">Cite your sources for academic credibility</p>

                <div class="csw-source-list" id="csw-source-list">
                    <p class="csw-placeholder-text">No sources added yet</p>
                </div>

                <div class="csw-add-source">
                    <div class="csw-form-row">
                        <div class="csw-form-group">
                            <label class="csw-label">Source Type</label>
                            <select id="csw-source-type" class="csw-select">
                                <option value="book">Book</option>
                                <option value="article">Article</option>
                                <option value="website">Website</option>
                                <option value="primary">Primary Source</option>
                                <option value="academic">Academic Paper</option>
                            </select>
                        </div>
                        <div class="csw-form-group csw-form-group-lg">
                            <label class="csw-label">Citation</label>
                            <input type="text" id="csw-source-citation" class="csw-input" placeholder="e.g., Homer, Iliad, Book 1">
                        </div>
                        <div class="csw-form-group csw-form-group-btn">
                            <button class="csw-btn csw-btn-secondary" id="csw-add-source-btn">
                                + Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Extended Content Sections -->
            <div class="csw-form-section">
                <h3 class="csw-section-title">Extended Content Sections</h3>
                <p class="csw-section-description">Add detailed content sections (like myths, stories, analysis)</p>

                <div class="csw-extended-sections" id="csw-extended-sections">
                    <p class="csw-placeholder-text">No extended sections added yet</p>
                </div>

                <div class="csw-add-section">
                    <div class="csw-form-group">
                        <label class="csw-label">Section Title</label>
                        <input type="text" id="csw-section-title" class="csw-input" placeholder="e.g., Origin Story, Powers and Abilities">
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label">Section Content</label>
                        <textarea id="csw-section-content" class="csw-textarea" rows="4" placeholder="Write the content for this section... Markdown supported."></textarea>
                    </div>
                    <button class="csw-btn csw-btn-secondary" id="csw-add-section-btn">
                        + Add Section
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('csw-btn-prev');
        const nextBtn = document.getElementById('csw-btn-next');
        const submitBtn = document.getElementById('csw-btn-submit');

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (submitBtn) submitBtn.addEventListener('click', () => this.submit());

        // Type selection
        document.querySelectorAll('.csw-type-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectType(card.dataset.type);
            });
        });

        // Character counter for short description
        const shortDesc = document.getElementById('csw-short-description');
        if (shortDesc) {
            shortDesc.addEventListener('input', (e) => {
                const count = e.target.value.length;
                document.getElementById('csw-short-desc-count').textContent = count;
            });
        }

        // Collapsible sections
        document.querySelectorAll('.csw-collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('.csw-collapse-icon');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.textContent = '-';
                } else {
                    content.style.display = 'none';
                    icon.textContent = '+';
                }
            });
        });

        // Icon source options
        document.querySelectorAll('.csw-icon-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.csw-icon-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.formData.iconSource = option.dataset.source;
                this.updateIconGenerator();
            });
        });

        // Generate icon button
        const generateIconBtn = document.getElementById('csw-generate-icon-btn');
        if (generateIconBtn) {
            generateIconBtn.addEventListener('click', () => this.generateIcon());
        }

        // Regenerate icon button
        const regenerateBtn = document.getElementById('csw-regenerate-icon-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.generateIcon(true));
        }

        // Edit SVG button
        const editSvgBtn = document.getElementById('csw-edit-svg-btn');
        if (editSvgBtn) {
            editSvgBtn.addEventListener('click', () => this.openSVGEditor());
        }

        // Color picker sync
        this.setupColorPickers();

        // Add relationship button
        const addRelBtn = document.getElementById('csw-add-relationship-btn');
        if (addRelBtn) {
            addRelBtn.addEventListener('click', () => this.addRelationship());
        }

        // Add tag
        const addTagBtn = document.getElementById('csw-add-tag-btn');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => this.addTag());
        }

        // Add source
        const addSourceBtn = document.getElementById('csw-add-source-btn');
        if (addSourceBtn) {
            addSourceBtn.addEventListener('click', () => this.addSource());
        }

        // Add extended section
        const addSectionBtn = document.getElementById('csw-add-section-btn');
        if (addSectionBtn) {
            addSectionBtn.addEventListener('click', () => this.addExtendedSection());
        }
    }

    /**
     * Setup color picker sync
     */
    setupColorPickers() {
        const primaryColor = document.getElementById('csw-primary-color');
        const primaryHex = document.getElementById('csw-primary-color-hex');
        const secondaryColor = document.getElementById('csw-secondary-color');
        const secondaryHex = document.getElementById('csw-secondary-color-hex');

        if (primaryColor && primaryHex) {
            primaryColor.addEventListener('input', (e) => {
                primaryHex.value = e.target.value;
            });
            primaryHex.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    primaryColor.value = e.target.value;
                }
            });
        }

        if (secondaryColor && secondaryHex) {
            secondaryColor.addEventListener('input', (e) => {
                secondaryHex.value = e.target.value;
            });
            secondaryHex.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    secondaryColor.value = e.target.value;
                }
            });
        }
    }

    /**
     * Select content type
     */
    selectType(type) {
        // Update UI
        document.querySelectorAll('.csw-type-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.type === type);
        });

        // Store selection
        this.formData.type = type;

        // Update type-specific fields
        this.updateTypeSpecificFields(type);
    }

    /**
     * Update type-specific fields based on selected type
     */
    updateTypeSpecificFields(type) {
        const container = document.getElementById('csw-type-specific-fields');
        if (!container) return;

        const config = this.contentTypes[type];
        if (!config) {
            container.innerHTML = '<p class="csw-placeholder-text">Select a content type to see specific fields</p>';
            return;
        }

        const fieldsHTML = this.getTypeSpecificFieldsHTML(type, config.fields);
        container.innerHTML = fieldsHTML;
    }

    /**
     * Get HTML for type-specific fields
     */
    getTypeSpecificFieldsHTML(type, fields) {
        const fieldTemplates = {
            // Deity fields
            domains: `
                <div class="csw-form-group">
                    <label class="csw-label">Domains/Spheres of Influence</label>
                    <input type="text" id="csw-domains" class="csw-input" placeholder="e.g., Sky, Thunder, Justice (comma-separated)">
                    <p class="csw-hint">Areas over which this deity holds power</p>
                </div>`,
            powers: `
                <div class="csw-form-group">
                    <label class="csw-label">Powers & Abilities</label>
                    <textarea id="csw-powers" class="csw-textarea" rows="3" placeholder="List powers and abilities (one per line)"></textarea>
                </div>`,
            symbols: `
                <div class="csw-form-group">
                    <label class="csw-label">Sacred Symbols</label>
                    <input type="text" id="csw-symbols" class="csw-input" placeholder="e.g., Lightning bolt, Eagle, Oak tree (comma-separated)">
                </div>`,
            consorts: `
                <div class="csw-form-group">
                    <label class="csw-label">Consorts/Spouses</label>
                    <input type="text" id="csw-consorts" class="csw-input" placeholder="e.g., Hera, Leto, Metis (comma-separated)">
                </div>`,
            children: `
                <div class="csw-form-group">
                    <label class="csw-label">Children/Offspring</label>
                    <input type="text" id="csw-children" class="csw-input" placeholder="e.g., Athena, Apollo, Hermes (comma-separated)">
                </div>`,
            parents: `
                <div class="csw-form-group">
                    <label class="csw-label">Parents</label>
                    <input type="text" id="csw-parents" class="csw-input" placeholder="e.g., Cronus, Rhea (comma-separated)">
                </div>`,

            // Hero fields
            achievements: `
                <div class="csw-form-group">
                    <label class="csw-label">Notable Achievements</label>
                    <textarea id="csw-achievements" class="csw-textarea" rows="3" placeholder="List major achievements (one per line)"></textarea>
                </div>`,
            weapons: `
                <div class="csw-form-group">
                    <label class="csw-label">Weapons & Equipment</label>
                    <input type="text" id="csw-weapons" class="csw-input" placeholder="e.g., Sword, Shield, Bow (comma-separated)">
                </div>`,
            companions: `
                <div class="csw-form-group">
                    <label class="csw-label">Companions</label>
                    <input type="text" id="csw-companions" class="csw-input" placeholder="e.g., Patrocles, Argonauts (comma-separated)">
                </div>`,
            quests: `
                <div class="csw-form-group">
                    <label class="csw-label">Quests & Adventures</label>
                    <textarea id="csw-quests" class="csw-textarea" rows="3" placeholder="Major quests and adventures"></textarea>
                </div>`,
            birthplace: `
                <div class="csw-form-group">
                    <label class="csw-label">Birthplace</label>
                    <input type="text" id="csw-birthplace" class="csw-input" placeholder="e.g., Thebes, Mount Ida">
                </div>`,
            deathPlace: `
                <div class="csw-form-group">
                    <label class="csw-label">Place of Death</label>
                    <input type="text" id="csw-death-place" class="csw-input" placeholder="e.g., Mount Oeta, Troy">
                </div>`,

            // Creature fields
            habitat: `
                <div class="csw-form-group">
                    <label class="csw-label">Habitat</label>
                    <input type="text" id="csw-habitat" class="csw-input" placeholder="e.g., Mountains, Forests, Underworld">
                </div>`,
            abilities: `
                <div class="csw-form-group">
                    <label class="csw-label">Special Abilities</label>
                    <textarea id="csw-abilities" class="csw-textarea" rows="3" placeholder="List abilities (one per line)"></textarea>
                </div>`,
            weaknesses: `
                <div class="csw-form-group">
                    <label class="csw-label">Weaknesses</label>
                    <input type="text" id="csw-weaknesses" class="csw-input" placeholder="e.g., Sunlight, Silver (comma-separated)">
                </div>`,
            behavior: `
                <div class="csw-form-group">
                    <label class="csw-label">Behavior/Temperament</label>
                    <textarea id="csw-behavior" class="csw-textarea" rows="2" placeholder="Describe typical behavior"></textarea>
                </div>`,
            physicalTraits: `
                <div class="csw-form-group">
                    <label class="csw-label">Physical Traits</label>
                    <textarea id="csw-physical-traits" class="csw-textarea" rows="3" placeholder="Describe physical characteristics"></textarea>
                </div>`,

            // Item fields
            itemType: `
                <div class="csw-form-group">
                    <label class="csw-label">Item Type</label>
                    <select id="csw-item-type" class="csw-select">
                        <option value="">Select type...</option>
                        <option value="weapon">Weapon</option>
                        <option value="armor">Armor</option>
                        <option value="jewelry">Jewelry</option>
                        <option value="tool">Tool</option>
                        <option value="vessel">Vessel/Container</option>
                        <option value="relic">Relic</option>
                        <option value="talisman">Talisman</option>
                        <option value="other">Other</option>
                    </select>
                </div>`,
            materials: `
                <div class="csw-form-group">
                    <label class="csw-label">Materials</label>
                    <input type="text" id="csw-materials" class="csw-input" placeholder="e.g., Gold, Bronze, Divine metal (comma-separated)">
                </div>`,
            wielders: `
                <div class="csw-form-group">
                    <label class="csw-label">Notable Wielders/Owners</label>
                    <input type="text" id="csw-wielders" class="csw-input" placeholder="e.g., Zeus, Arthur, Perseus (comma-separated)">
                </div>`,
            createdBy: `
                <div class="csw-form-group">
                    <label class="csw-label">Created By</label>
                    <input type="text" id="csw-created-by" class="csw-input" placeholder="e.g., Hephaestus, Dwarves">
                </div>`,
            currentLocation: `
                <div class="csw-form-group">
                    <label class="csw-label">Current Location (if known)</label>
                    <input type="text" id="csw-current-location" class="csw-input" placeholder="e.g., Lost, British Museum">
                </div>`,

            // Place fields
            locationType: `
                <div class="csw-form-group">
                    <label class="csw-label">Location Type</label>
                    <select id="csw-location-type" class="csw-select">
                        <option value="">Select type...</option>
                        <option value="mountain">Mountain</option>
                        <option value="temple">Temple</option>
                        <option value="city">City</option>
                        <option value="realm">Realm/Dimension</option>
                        <option value="underworld">Underworld</option>
                        <option value="celestial">Celestial</option>
                        <option value="forest">Forest</option>
                        <option value="body-of-water">Body of Water</option>
                        <option value="other">Other</option>
                    </select>
                </div>`,
            geography: `
                <div class="csw-form-group">
                    <label class="csw-label">Geography/Landscape</label>
                    <textarea id="csw-geography" class="csw-textarea" rows="2" placeholder="Describe the landscape and features"></textarea>
                </div>`,
            inhabitants: `
                <div class="csw-form-group">
                    <label class="csw-label">Inhabitants</label>
                    <input type="text" id="csw-inhabitants" class="csw-input" placeholder="e.g., Gods, Spirits, Monsters (comma-separated)">
                </div>`,
            events: `
                <div class="csw-form-group">
                    <label class="csw-label">Notable Events</label>
                    <textarea id="csw-events" class="csw-textarea" rows="3" placeholder="Important events that occurred here"></textarea>
                </div>`,
            significance: `
                <div class="csw-form-group">
                    <label class="csw-label">Mythological Significance</label>
                    <textarea id="csw-significance" class="csw-textarea" rows="2" placeholder="Why this place is important"></textarea>
                </div>`,

            // Default fallback for any field
            default: (fieldName) => `
                <div class="csw-form-group">
                    <label class="csw-label">${this.capitalize(fieldName.replace(/([A-Z])/g, ' $1').trim())}</label>
                    <input type="text" id="csw-${fieldName.toLowerCase()}" class="csw-input" placeholder="Enter ${fieldName}...">
                </div>`
        };

        let html = '';
        for (const field of fields) {
            if (fieldTemplates[field]) {
                html += fieldTemplates[field];
            } else {
                html += fieldTemplates.default(field);
            }
        }

        return html || '<p class="csw-placeholder-text">No additional fields for this type</p>';
    }

    /**
     * Update icon generator section based on source
     */
    updateIconGenerator() {
        const generator = document.getElementById('csw-icon-generator');
        if (!generator) return;

        if (this.formData.iconSource === 'emoji') {
            generator.innerHTML = `
                <div class="csw-emoji-preview">
                    <div class="csw-emoji-display" id="csw-emoji-display">
                        ${this.formData.icon || '?'}
                    </div>
                    <p class="csw-hint">The emoji from your basic information will be used as the icon.</p>
                </div>
            `;
        } else if (this.formData.iconSource === 'editor') {
            generator.innerHTML = `
                <div class="csw-svg-editor-prompt">
                    <button class="csw-btn csw-btn-primary" id="csw-open-svg-editor">
                        <span class="csw-btn-icon">&#127912;</span> Open SVG Editor
                    </button>
                    <div class="csw-icon-preview">
                        <div class="csw-icon-preview-container" id="csw-icon-preview">
                            ${this.formData.svgIcon ? this.formData.svgIcon : '<p class="csw-placeholder-text">Create or paste SVG code</p>'}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('csw-open-svg-editor')?.addEventListener('click', () => this.openSVGEditor());
        } else {
            // AI generator - restore default
            generator.innerHTML = this.getIconGeneratorControlsHTML();
            this.attachIconGeneratorListeners();
        }
    }

    /**
     * Get icon generator controls HTML
     */
    getIconGeneratorControlsHTML() {
        return `
            <div class="csw-icon-controls">
                <div class="csw-form-row">
                    <div class="csw-form-group">
                        <label class="csw-label">Style</label>
                        <select id="csw-icon-style" class="csw-select">
                            <option value="symbolic">Symbolic - Clean icons</option>
                            <option value="detailed">Detailed - Rich designs</option>
                            <option value="minimalist">Minimalist - Simple lines</option>
                            <option value="geometric">Geometric - Sacred patterns</option>
                            <option value="vintage">Vintage - Classic look</option>
                            <option value="neon">Neon - Glowing effect</option>
                        </select>
                    </div>
                    <div class="csw-form-group">
                        <label class="csw-label">Theme</label>
                        <select id="csw-icon-theme" class="csw-select">
                            <option value="night">Night - Purple tones</option>
                            <option value="cosmic">Cosmic - Pink/Purple</option>
                            <option value="sacred">Sacred - Amber tones</option>
                            <option value="golden">Golden - Gold/Yellow</option>
                            <option value="ocean">Ocean - Blue/Cyan</option>
                            <option value="fire">Fire - Red/Orange</option>
                            <option value="nature">Nature - Green tones</option>
                        </select>
                    </div>
                </div>
                <button class="csw-btn csw-btn-primary" id="csw-generate-icon-btn">
                    <span class="csw-btn-icon">&#10024;</span> Generate Icon
                </button>
            </div>

            <div class="csw-icon-preview">
                <div class="csw-icon-preview-container" id="csw-icon-preview">
                    ${this.formData.svgIcon ? this.formData.svgIcon : '<p class="csw-placeholder-text">Icon preview will appear here</p>'}
                </div>
                <div class="csw-icon-actions">
                    <button class="csw-btn csw-btn-secondary" id="csw-regenerate-icon-btn" ${!this.formData.svgIcon ? 'disabled' : ''}>
                        <span class="csw-btn-icon">&#128260;</span> Regenerate
                    </button>
                    <button class="csw-btn csw-btn-secondary" id="csw-edit-svg-btn" ${!this.formData.svgIcon ? 'disabled' : ''}>
                        <span class="csw-btn-icon">&#9998;</span> Edit SVG
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach icon generator listeners
     */
    attachIconGeneratorListeners() {
        document.getElementById('csw-generate-icon-btn')?.addEventListener('click', () => this.generateIcon());
        document.getElementById('csw-regenerate-icon-btn')?.addEventListener('click', () => this.generateIcon(true));
        document.getElementById('csw-edit-svg-btn')?.addEventListener('click', () => this.openSVGEditor());
    }

    /**
     * Generate icon using AI
     */
    generateIcon(regenerate = false) {
        if (!this.iconGenerator) {
            this.showNotification('AI Icon Generator not available', 'error');
            return;
        }

        // Collect entity data from form
        this.collectFormData();

        const entityData = {
            name: this.formData.name || 'Entity',
            type: this.formData.type || 'deity',
            mythology: this.formData.primaryMythology || 'greek',
            domains: this.formData.typeSpecific.domains ? this.formData.typeSpecific.domains.split(',').map(d => d.trim()) : [],
            symbols: this.formData.typeSpecific.symbols ? this.formData.typeSpecific.symbols.split(',').map(s => s.trim()) : [],
            description: this.formData.shortDescription || ''
        };

        const style = document.getElementById('csw-icon-style')?.value || 'symbolic';
        const theme = document.getElementById('csw-icon-theme')?.value || 'night';

        // Generate icon
        const result = this.iconGenerator.generateWithStyle(entityData, style, theme);

        if (result.success) {
            this.formData.svgIcon = result.svgCode;

            // Update preview
            const preview = document.getElementById('csw-icon-preview');
            if (preview) {
                preview.innerHTML = result.svgCode;
            }

            // Enable action buttons
            const regenerateBtn = document.getElementById('csw-regenerate-icon-btn');
            const editBtn = document.getElementById('csw-edit-svg-btn');
            if (regenerateBtn) regenerateBtn.disabled = false;
            if (editBtn) editBtn.disabled = false;

            this.showNotification('Icon generated successfully!', 'success');
        } else {
            this.showNotification('Failed to generate icon: ' + result.error, 'error');
        }
    }

    /**
     * Open SVG editor modal
     */
    openSVGEditor() {
        if (this.svgEditorModal) {
            this.svgEditorModal.open({
                initialSvg: this.formData.svgIcon || '',
                entityData: {
                    name: this.formData.name,
                    type: this.formData.type,
                    mythology: this.formData.primaryMythology
                },
                onSave: (result) => {
                    this.formData.svgIcon = result.svgCode;
                    const preview = document.getElementById('csw-icon-preview');
                    if (preview) {
                        preview.innerHTML = result.svgCode;
                    }
                    this.showNotification('SVG saved successfully!', 'success');
                }
            });
        } else if (window.SVGEditorModal) {
            window.SVGEditorModal.open({
                initialSvg: this.formData.svgIcon || '',
                entityData: {
                    name: this.formData.name,
                    type: this.formData.type,
                    mythology: this.formData.primaryMythology
                },
                onSave: (result) => {
                    this.formData.svgIcon = result.svgCode;
                    const preview = document.getElementById('csw-icon-preview');
                    if (preview) {
                        preview.innerHTML = result.svgCode;
                    }
                }
            });
        } else {
            this.showNotification('SVG Editor not available', 'error');
        }
    }

    /**
     * Add a relationship
     */
    addRelationship() {
        const type = document.getElementById('csw-rel-type')?.value;
        const entity = document.getElementById('csw-rel-entity')?.value?.trim();

        if (!entity) {
            this.showNotification('Please enter a related entity name', 'warning');
            return;
        }

        this.formData.relatedEntities.push({ type, entity });
        this.updateRelationshipList();

        // Clear input
        document.getElementById('csw-rel-entity').value = '';
    }

    /**
     * Update relationship list display
     */
    updateRelationshipList() {
        const container = document.getElementById('csw-relationship-list');
        if (!container) return;

        if (this.formData.relatedEntities.length === 0) {
            container.innerHTML = '<p class="csw-placeholder-text">No relationships added yet</p>';
            return;
        }

        container.innerHTML = this.formData.relatedEntities.map((rel, idx) => `
            <div class="csw-relationship-item">
                <span class="csw-rel-type-badge">${rel.type}</span>
                <span class="csw-rel-entity-name">${this.escapeHtml(rel.entity)}</span>
                <button class="csw-btn-remove" data-idx="${idx}" onclick="contentWizard.removeRelationship(${idx})">&times;</button>
            </div>
        `).join('');
    }

    /**
     * Remove a relationship
     */
    removeRelationship(idx) {
        this.formData.relatedEntities.splice(idx, 1);
        this.updateRelationshipList();
    }

    /**
     * Add a tag
     */
    addTag() {
        const input = document.getElementById('csw-new-tag');
        const tag = input?.value?.trim().toLowerCase();

        if (!tag) return;

        if (!this.formData.tags.includes(tag)) {
            this.formData.tags.push(tag);
            this.updateTagList();
        }

        input.value = '';
    }

    /**
     * Update tag list display
     */
    updateTagList() {
        const container = document.getElementById('csw-tag-list');
        if (!container) return;

        if (this.formData.tags.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.formData.tags.map((tag, idx) => `
            <span class="csw-tag">
                ${this.escapeHtml(tag)}
                <button class="csw-tag-remove" onclick="contentWizard.removeTag(${idx})">&times;</button>
            </span>
        `).join('');
    }

    /**
     * Remove a tag
     */
    removeTag(idx) {
        this.formData.tags.splice(idx, 1);
        this.updateTagList();
    }

    /**
     * Add a source
     */
    addSource() {
        const type = document.getElementById('csw-source-type')?.value;
        const citation = document.getElementById('csw-source-citation')?.value?.trim();

        if (!citation) {
            this.showNotification('Please enter a citation', 'warning');
            return;
        }

        this.formData.sources.push({ type, citation });
        this.updateSourceList();

        document.getElementById('csw-source-citation').value = '';
    }

    /**
     * Update source list display
     */
    updateSourceList() {
        const container = document.getElementById('csw-source-list');
        if (!container) return;

        if (this.formData.sources.length === 0) {
            container.innerHTML = '<p class="csw-placeholder-text">No sources added yet</p>';
            return;
        }

        container.innerHTML = this.formData.sources.map((source, idx) => `
            <div class="csw-source-item">
                <span class="csw-source-type-badge">${source.type}</span>
                <span class="csw-source-citation">${this.escapeHtml(source.citation)}</span>
                <button class="csw-btn-remove" onclick="contentWizard.removeSource(${idx})">&times;</button>
            </div>
        `).join('');
    }

    /**
     * Remove a source
     */
    removeSource(idx) {
        this.formData.sources.splice(idx, 1);
        this.updateSourceList();
    }

    /**
     * Add extended content section
     */
    addExtendedSection() {
        const title = document.getElementById('csw-section-title')?.value?.trim();
        const content = document.getElementById('csw-section-content')?.value?.trim();

        if (!title || !content) {
            this.showNotification('Please provide both title and content', 'warning');
            return;
        }

        this.formData.extendedContent.push({ title, content });
        this.updateExtendedSectionsList();

        document.getElementById('csw-section-title').value = '';
        document.getElementById('csw-section-content').value = '';
    }

    /**
     * Update extended sections display
     */
    updateExtendedSectionsList() {
        const container = document.getElementById('csw-extended-sections');
        if (!container) return;

        if (this.formData.extendedContent.length === 0) {
            container.innerHTML = '<p class="csw-placeholder-text">No extended sections added yet</p>';
            return;
        }

        container.innerHTML = this.formData.extendedContent.map((section, idx) => `
            <div class="csw-extended-section-item">
                <h4 class="csw-section-item-title">${this.escapeHtml(section.title)}</h4>
                <p class="csw-section-item-preview">${this.escapeHtml(section.content.substring(0, 150))}${section.content.length > 150 ? '...' : ''}</p>
                <button class="csw-btn-remove" onclick="contentWizard.removeExtendedSection(${idx})">&times;</button>
            </div>
        `).join('');
    }

    /**
     * Remove extended section
     */
    removeExtendedSection(idx) {
        this.formData.extendedContent.splice(idx, 1);
        this.updateExtendedSectionsList();
    }

    /**
     * Navigate to next step
     */
    nextStep() {
        if (!this.validateCurrentStep()) return;

        this.collectFormData();

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    /**
     * Show specific step
     */
    showStep(stepNum) {
        document.querySelectorAll('.csw-step').forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === stepNum);
        });

        // Update step indicator
        const indicator = document.getElementById('csw-current-step');
        if (indicator) indicator.textContent = stepNum;

        // If preview step, generate preview
        if (stepNum === 5) {
            this.generatePreview();
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const percent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        const fill = document.getElementById('csw-progress-fill');
        if (fill) fill.style.width = percent + '%';

        // Update step indicators
        document.querySelectorAll('.csw-progress-step').forEach(step => {
            const num = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');

            if (num < this.currentStep) {
                step.classList.add('completed');
                step.querySelector('.csw-step-circle').innerHTML = '&#10003;';
            } else if (num === this.currentStep) {
                step.classList.add('active');
                step.querySelector('.csw-step-circle').innerHTML = num;
            } else {
                step.querySelector('.csw-step-circle').innerHTML = num;
            }
        });
    }

    /**
     * Update navigation buttons
     */
    updateNavigation() {
        const prevBtn = document.getElementById('csw-btn-prev');
        const nextBtn = document.getElementById('csw-btn-next');
        const submitBtn = document.getElementById('csw-btn-submit');

        if (prevBtn) prevBtn.disabled = this.currentStep === 1;

        if (this.currentStep === this.totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.formData.type) {
                    this.showNotification('Please select a content type', 'warning');
                    return false;
                }
                return true;

            case 2:
                const name = document.getElementById('csw-name')?.value?.trim();
                const mythology = document.getElementById('csw-primary-mythology')?.value;
                const shortDesc = document.getElementById('csw-short-description')?.value?.trim();
                const longDesc = document.getElementById('csw-long-description')?.value?.trim();

                if (!name) {
                    this.showNotification('Please enter a name', 'warning');
                    return false;
                }
                if (!mythology) {
                    this.showNotification('Please select a primary mythology', 'warning');
                    return false;
                }
                if (!shortDesc) {
                    this.showNotification('Please enter a short description', 'warning');
                    return false;
                }
                if (!longDesc) {
                    this.showNotification('Please enter a full description', 'warning');
                    return false;
                }
                return true;

            case 3:
                // Icon is optional
                return true;

            case 4:
                // Relationships are optional
                return true;

            default:
                return true;
        }
    }

    /**
     * Collect form data from all inputs
     */
    collectFormData() {
        // Basic info
        this.formData.name = document.getElementById('csw-name')?.value?.trim() || '';
        this.formData.icon = document.getElementById('csw-emoji-icon')?.value || '';
        this.formData.primaryMythology = document.getElementById('csw-primary-mythology')?.value || '';
        this.formData.shortDescription = document.getElementById('csw-short-description')?.value?.trim() || '';
        this.formData.longDescription = document.getElementById('csw-long-description')?.value?.trim() || '';

        // Generate slug
        this.formData.slug = this.formData.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');

        // Multiple mythologies
        const mythSelect = document.getElementById('csw-mythologies');
        if (mythSelect) {
            this.formData.mythologies = Array.from(mythSelect.selectedOptions).map(opt => opt.value);
        }

        // Add primary mythology to mythologies array if not present
        if (this.formData.primaryMythology && !this.formData.mythologies.includes(this.formData.primaryMythology)) {
            this.formData.mythologies.unshift(this.formData.primaryMythology);
        }

        // Linguistic data
        this.formData.linguistic.originalName = document.getElementById('csw-original-name')?.value?.trim() || '';
        this.formData.linguistic.originalScript = document.getElementById('csw-original-script')?.value?.trim() || '';
        this.formData.linguistic.transliteration = document.getElementById('csw-transliteration')?.value?.trim() || '';
        this.formData.linguistic.pronunciation = document.getElementById('csw-pronunciation')?.value?.trim() || '';
        this.formData.linguistic.etymology.origin = document.getElementById('csw-etymology')?.value?.trim() || '';

        // Geographical data
        this.formData.geographical.region = document.getElementById('csw-region')?.value?.trim() || '';
        this.formData.geographical.culturalArea = document.getElementById('csw-cultural-area')?.value?.trim() || '';
        this.formData.geographical.modernLocation = document.getElementById('csw-modern-location')?.value?.trim() || '';

        // Temporal data
        this.formData.temporal.firstAttestation.date = document.getElementById('csw-first-attestation')?.value?.trim() || '';
        this.formData.temporal.historicalPeriod = document.getElementById('csw-historical-period')?.value?.trim() || '';
        this.formData.temporal.firstAttestation.source = document.getElementById('csw-first-attestation-source')?.value?.trim() || '';

        // Metaphysical properties
        this.formData.metaphysicalProperties.element = document.getElementById('csw-element')?.value || '';
        this.formData.metaphysicalProperties.planet = document.getElementById('csw-planet')?.value || '';
        this.formData.metaphysicalProperties.energyType = document.getElementById('csw-energy-type')?.value?.trim() || '';
        this.formData.metaphysicalProperties.chakra = document.getElementById('csw-chakra')?.value || '';

        // Colors
        this.formData.colors.primary = document.getElementById('csw-primary-color-hex')?.value || '';
        this.formData.colors.secondary = document.getElementById('csw-secondary-color-hex')?.value || '';

        // Type-specific fields
        this.collectTypeSpecificFields();
    }

    /**
     * Collect type-specific field values
     */
    collectTypeSpecificFields() {
        const typeConfig = this.contentTypes[this.formData.type];
        if (!typeConfig) return;

        for (const field of typeConfig.fields) {
            const input = document.getElementById(`csw-${field.toLowerCase().replace(/([A-Z])/g, '-$1')}`);
            if (input) {
                this.formData.typeSpecific[field] = input.value?.trim() || '';
            }
        }

        // Handle special multi-value fields
        const multiFields = ['domains', 'powers', 'symbols', 'materials', 'wielders', 'consorts', 'children', 'parents', 'companions', 'weaknesses', 'inhabitants'];
        for (const field of multiFields) {
            if (this.formData.typeSpecific[field]) {
                this.formData.typeSpecific[field] = this.formData.typeSpecific[field]
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => v);
            }
        }
    }

    /**
     * Generate preview for step 5
     */
    generatePreview() {
        const container = document.getElementById('csw-preview-section');
        if (!container) return;

        this.collectFormData();

        container.innerHTML = `
            <div class="csw-preview">
                <div class="csw-preview-header">
                    <div class="csw-preview-icon">
                        ${this.formData.svgIcon || `<span class="csw-preview-emoji">${this.formData.icon || '?'}</span>`}
                    </div>
                    <div class="csw-preview-title-section">
                        <h3 class="csw-preview-name">${this.escapeHtml(this.formData.name)}</h3>
                        <div class="csw-preview-badges">
                            <span class="csw-badge csw-badge-type">${this.contentTypes[this.formData.type]?.label || this.formData.type}</span>
                            <span class="csw-badge csw-badge-mythology">${this.capitalize(this.formData.primaryMythology || '')}</span>
                        </div>
                    </div>
                </div>

                <div class="csw-preview-description">
                    <h4>Description</h4>
                    <p class="csw-preview-short">${this.escapeHtml(this.formData.shortDescription)}</p>
                </div>

                ${this.formData.longDescription ? `
                    <div class="csw-preview-section">
                        <h4>Full Description</h4>
                        <div class="csw-preview-content">${this.escapeHtml(this.formData.longDescription.substring(0, 500))}${this.formData.longDescription.length > 500 ? '...' : ''}</div>
                    </div>
                ` : ''}

                ${Object.keys(this.formData.typeSpecific).length > 0 ? `
                    <div class="csw-preview-section">
                        <h4>Details</h4>
                        <div class="csw-preview-details">
                            ${this.getPreviewDetailsHTML()}
                        </div>
                    </div>
                ` : ''}

                ${this.formData.tags.length > 0 ? `
                    <div class="csw-preview-section">
                        <h4>Tags</h4>
                        <div class="csw-preview-tags">
                            ${this.formData.tags.map(tag => `<span class="csw-tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${this.formData.relatedEntities.length > 0 ? `
                    <div class="csw-preview-section">
                        <h4>Relationships</h4>
                        <ul class="csw-preview-relationships">
                            ${this.formData.relatedEntities.map(rel => `
                                <li><strong>${rel.type}:</strong> ${this.escapeHtml(rel.entity)}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${this.formData.sources.length > 0 ? `
                    <div class="csw-preview-section">
                        <h4>Sources</h4>
                        <ul class="csw-preview-sources">
                            ${this.formData.sources.map(src => `
                                <li><span class="csw-source-type">${src.type}:</span> ${this.escapeHtml(src.citation)}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="csw-preview-notice">
                    <p><strong>Note:</strong> Your submission will be reviewed by moderators before being published. You will be notified when it's approved or if changes are needed.</p>
                </div>
            </div>
        `;
    }

    /**
     * Get preview details HTML for type-specific fields
     */
    getPreviewDetailsHTML() {
        const details = [];

        for (const [key, value] of Object.entries(this.formData.typeSpecific)) {
            if (!value || (Array.isArray(value) && value.length === 0)) continue;

            const label = this.capitalize(key.replace(/([A-Z])/g, ' $1').trim());
            const displayValue = Array.isArray(value) ? value.join(', ') : value;

            details.push(`<div class="csw-preview-detail"><strong>${label}:</strong> ${this.escapeHtml(displayValue)}</div>`);
        }

        return details.join('') || '<p>No additional details provided</p>';
    }

    /**
     * Submit the form
     */
    async submit() {
        this.collectFormData();

        // Build submission data
        const submissionData = this.buildSubmissionData();

        // Show loading state
        const submitBtn = document.getElementById('csw-btn-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="csw-spinner"></span> Submitting...';
        }

        try {
            // Use content submission service if available
            if (window.contentSubmissionService) {
                const result = await window.contentSubmissionService.submitContent(submissionData, this.formData.type);

                if (result.success) {
                    this.showSuccessState(result.submissionId);
                } else {
                    throw new Error(result.error || 'Submission failed');
                }
            } else if (window.submissionWorkflow) {
                // Fallback to submission workflow
                const result = await window.submissionWorkflow.createSubmission(submissionData, this.formData.type);

                if (result.success) {
                    this.showSuccessState(result.submissionId);
                } else {
                    throw new Error('Submission failed');
                }
            } else {
                throw new Error('No submission service available. Please ensure you are signed in.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showNotification('Failed to submit: ' + error.message, 'error');

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="csw-btn-icon">&#10003;</span> Submit for Review';
            }
        }
    }

    /**
     * Build submission data object
     */
    buildSubmissionData() {
        return {
            id: this.formData.slug,
            type: this.formData.type,
            name: this.formData.name,
            icon: this.formData.icon,
            svgIcon: this.formData.svgIcon,
            slug: this.formData.slug,
            primaryMythology: this.formData.primaryMythology,
            mythologies: this.formData.mythologies,
            shortDescription: this.formData.shortDescription,
            longDescription: this.formData.longDescription,
            extendedContent: this.formData.extendedContent,

            // Type-specific data merged in
            ...this.formData.typeSpecific,

            // Additional metadata
            linguistic: this.cleanObject(this.formData.linguistic),
            geographical: this.cleanObject(this.formData.geographical),
            temporal: this.cleanObject(this.formData.temporal),
            metaphysicalProperties: this.cleanObject(this.formData.metaphysicalProperties),
            colors: this.cleanObject(this.formData.colors),

            // Relationships and references
            relatedEntities: this.formData.relatedEntities,
            sources: this.formData.sources,
            tags: this.formData.tags,

            // Media
            mediaReferences: this.formData.mediaReferences,

            // System fields
            visibility: 'public',
            status: 'pending'
        };
    }

    /**
     * Remove empty values from object
     */
    cleanObject(obj) {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value && (typeof value !== 'object' || Object.keys(value).length > 0)) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    const cleanedNested = this.cleanObject(value);
                    if (Object.keys(cleanedNested).length > 0) {
                        cleaned[key] = cleanedNested;
                    }
                } else if (value !== '' && value !== null && value !== undefined) {
                    cleaned[key] = value;
                }
            }
        }
        return cleaned;
    }

    /**
     * Show success state after submission
     */
    showSuccessState(submissionId) {
        const body = document.querySelector('.csw-body');
        if (body) {
            body.innerHTML = `
                <div class="csw-success-state">
                    <div class="csw-success-icon">&#10003;</div>
                    <h2 class="csw-success-title">Submission Successful!</h2>
                    <p class="csw-success-message">
                        Your ${this.contentTypes[this.formData.type]?.label || 'content'} <strong>${this.escapeHtml(this.formData.name)}</strong>
                        has been submitted for review.
                    </p>
                    <p class="csw-success-info">
                        Submission ID: <code>${submissionId}</code>
                    </p>
                    <p class="csw-success-note">
                        You will be notified when your submission is reviewed.
                        This typically takes 1-3 business days.
                    </p>
                    <div class="csw-success-actions">
                        <button class="csw-btn csw-btn-primary" onclick="contentWizard.reset()">
                            Submit Another
                        </button>
                        <a href="dashboard.html" class="csw-btn csw-btn-secondary">
                            View My Submissions
                        </a>
                    </div>
                </div>
            `;
        }

        // Hide navigation
        const nav = document.querySelector('.csw-nav');
        if (nav) nav.style.display = 'none';

        const progress = document.querySelector('.csw-progress');
        if (progress) progress.style.display = 'none';
    }

    /**
     * Reset the wizard
     */
    reset() {
        this.currentStep = 1;
        this.formData = this.initializeFormData();
        this.render();
        this.attachEventListeners();
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Check if notification container exists
        let container = document.querySelector('.csw-notifications');
        if (!container) {
            container = document.createElement('div');
            container.className = 'csw-notifications';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `csw-notification csw-notification-${type}`;
        notification.innerHTML = `
            <span class="csw-notification-message">${this.escapeHtml(message)}</span>
            <button class="csw-notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Close button
        notification.querySelector('.csw-notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('csw-notification-fade');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
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
}

// Create global instance
if (typeof window !== 'undefined') {
    window.ContentSubmissionWizard = ContentSubmissionWizard;

    // Auto-initialize if container exists
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.querySelector('#wizard-container, [data-content-wizard]');
        if (container) {
            window.contentWizard = new ContentSubmissionWizard(container.id ? `#${container.id}` : '[data-content-wizard]');
        }
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSubmissionWizard;
}
