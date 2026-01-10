/**
 * AI Auto-Population Service
 * Eyes of Azrael Project
 *
 * Handles automatic content generation for mythology entities using template-based
 * generation (no external API calls). Generates placeholder content that maintains
 * mythology-appropriate tone and structure.
 *
 * Features:
 * - Auto-population triggers (deletion recovery, sparse content, new mythology)
 * - Template-based content generation per asset type
 * - Content quality markers and review flags
 * - Integration with deletion-recovery-service, ownership-service, content-submission-service
 *
 * @version 1.0.0
 */

class AIPopulationService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Confidence thresholds
        this.SPARSE_CONTENT_THRESHOLD = 500; // chars
        this.MIN_DESCRIPTION_LENGTH = 100;

        // Entity type to collection mapping
        this.collectionMap = {
            deity: 'deities',
            hero: 'heroes',
            creature: 'creatures',
            item: 'items',
            place: 'places',
            concept: 'concepts',
            archetype: 'concepts',
            magic: 'magic',
            ritual: 'rituals',
            text: 'texts',
            symbol: 'symbols',
            herb: 'herbs',
            mythology: 'mythologies'
        };

        // Event listeners
        this.listeners = new Map();

        // Templates storage
        this.templates = this._initializeTemplates();
    }

    /**
     * Initialize the service
     * @returns {Promise<boolean>}
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined') {
                console.warn('[AIPopulationService] Firebase not loaded yet');
                return false;
            }

            if (!firebase.firestore || !firebase.auth) {
                console.warn('[AIPopulationService] Firebase services not available');
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // Set up event listeners for integration
            this._setupEventListeners();

            this.initialized = true;
            console.log('[AIPopulationService] Initialized');
            return true;
        } catch (error) {
            console.error('[AIPopulationService] Init error:', error);
            return false;
        }
    }

    /**
     * Ensure service is initialized
     */
    async ensureInit() {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) {
                throw new Error('AI Population service not initialized');
            }
        }
    }

    // ==========================================
    // AUTO-POPULATION TRIGGERS
    // ==========================================

    /**
     * Check if entity needs auto-population
     * @param {Object} entity - Entity data
     * @returns {boolean}
     */
    needsAutoPopulation(entity) {
        if (!entity) return false;

        // Check for deleted/shell status
        if (entity.isDeleted || entity.isShell) {
            return true;
        }

        // Check for sparse content
        const descriptionLength = (entity.longDescription || entity.description || '').length;
        if (descriptionLength < this.SPARSE_CONTENT_THRESHOLD) {
            return true;
        }

        // Check for missing required sections
        const requiredSections = this._getRequiredSections(entity.type);
        const existingSections = entity.extendedContent || entity.sections || [];
        const existingTitles = existingSections.map(s => s.title?.toLowerCase() || '');

        const missingSections = requiredSections.filter(
            section => !existingTitles.some(title => title.includes(section.toLowerCase()))
        );

        if (missingSections.length > requiredSections.length / 2) {
            return true;
        }

        return false;
    }

    /**
     * Auto-populate entity after deletion (keep shell, populate basics)
     * @param {string} entityType - Type of entity
     * @param {string} entityId - Entity ID
     * @param {Object} originalData - Original entity data before deletion
     * @returns {Promise<Object>}
     */
    async populateAfterDeletion(entityType, entityId, originalData = {}) {
        await this.ensureInit();

        console.log(`[AIPopulationService] Populating shell after deletion: ${entityType}/${entityId}`);

        const name = originalData.name || entityId;
        const mythology = originalData.mythology || originalData.primaryMythology || 'unknown';

        // Generate basic content
        const generatedContent = await this.generateFullEntity({
            name,
            type: entityType,
            mythology,
            originalData
        });

        // Mark as auto-generated shell
        const shellEntity = {
            ...generatedContent,
            id: entityId,
            name,
            type: entityType,
            mythology,
            primaryMythology: mythology,

            // Shell status
            isShell: true,
            shellCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            originalDeletedAt: firebase.firestore.FieldValue.serverTimestamp(),

            // Quality markers
            autoGenerated: true,
            generatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            needsReview: true,
            confidence: 0.3, // Low confidence for shell content
            sources: ['AI Generated - Needs Verification'],

            // Ownership
            ownerId: null,
            ownerName: null,
            claimable: true
        };

        // Save to Firebase
        const collection = this.collectionMap[entityType] || entityType;
        await this.db.collection(collection).doc(entityId).set(shellEntity, { merge: true });

        // Dispatch event for other services
        this._dispatchEvent('entityAutoPopulated', {
            entityType,
            entityId,
            reason: 'deletion_recovery',
            data: shellEntity
        });

        return shellEntity;
    }

    /**
     * Generate starter entities for a new mythology
     * @param {Object} mythologyData - New mythology data
     * @returns {Promise<Array>}
     */
    async generateStarterEntities(mythologyData) {
        await this.ensureInit();

        console.log(`[AIPopulationService] Generating starter entities for: ${mythologyData.name}`);

        const mythology = mythologyData.slug || mythologyData.name?.toLowerCase().replace(/\s+/g, '-');
        const starterEntities = [];

        // Define starter entity types and counts
        const starterConfig = [
            { type: 'deity', count: 3, role: 'primary gods' },
            { type: 'hero', count: 2, role: 'legendary heroes' },
            { type: 'creature', count: 2, role: 'mythical beasts' },
            { type: 'place', count: 1, role: 'sacred locations' },
            { type: 'item', count: 1, role: 'legendary artifacts' }
        ];

        for (const config of starterConfig) {
            const placeholders = this._generatePlaceholderNames(
                config.type,
                mythology,
                config.count,
                mythologyData
            );

            for (const placeholder of placeholders) {
                const entity = await this.generateFullEntity({
                    name: placeholder.name,
                    type: config.type,
                    mythology,
                    mythologyData,
                    isStarter: true,
                    role: placeholder.role
                });

                entity.isStarter = true;
                entity.starterRole = config.role;
                entity.autoGenerated = true;
                entity.generatedAt = firebase.firestore.FieldValue.serverTimestamp();
                entity.needsReview = true;
                entity.confidence = 0.2;
                entity.sources = ['AI Generated - Placeholder for ' + mythologyData.name];

                starterEntities.push(entity);
            }
        }

        // Dispatch event
        this._dispatchEvent('starterEntitiesGenerated', {
            mythology,
            count: starterEntities.length,
            entities: starterEntities
        });

        return starterEntities;
    }

    /**
     * Populate sparse entity content
     * @param {Object} entity - Existing sparse entity
     * @returns {Promise<Object>}
     */
    async populateSparseEntity(entity) {
        await this.ensureInit();

        console.log(`[AIPopulationService] Enriching sparse entity: ${entity.name}`);

        const enrichedContent = {};
        const type = entity.type || this._inferEntityType(entity);
        const mythology = entity.mythology || entity.primaryMythology || 'unknown';

        // Generate missing description
        if ((entity.longDescription || '').length < this.MIN_DESCRIPTION_LENGTH) {
            enrichedContent.longDescription = this.generateBasicDescription(
                entity.name,
                type,
                mythology
            );
        }

        // Generate missing sections
        const existingSections = entity.extendedContent || entity.sections || [];
        const generatedSections = this.generateSections({
            ...entity,
            type,
            mythology
        });

        // Merge sections (keep existing, add missing)
        const existingTitles = new Set(existingSections.map(s => s.title?.toLowerCase()));
        const newSections = generatedSections.filter(
            s => !existingTitles.has(s.title?.toLowerCase())
        );

        if (newSections.length > 0) {
            enrichedContent.extendedContent = [...existingSections, ...newSections];
        }

        // Generate relationships if missing
        if (!entity.relatedEntities || entity.relatedEntities.length === 0) {
            enrichedContent.suggestedRelationships = this.generateRelationships({
                ...entity,
                type,
                mythology
            });
        }

        // Generate corpus queries if missing
        if (!entity.corpusQueries || entity.corpusQueries.length === 0) {
            enrichedContent.suggestedCorpusQueries = this.generateCorpusQueries({
                ...entity,
                type,
                mythology
            });
        }

        // Generate metadata if sparse
        if (!entity.attributes || Object.keys(entity.attributes || {}).length < 3) {
            enrichedContent.suggestedMetadata = this.generateMetadata({
                ...entity,
                type,
                mythology
            });
        }

        // Add quality markers
        enrichedContent.enrichedAt = firebase.firestore.FieldValue.serverTimestamp();
        enrichedContent.enrichmentSource = 'ai_population_service';
        enrichedContent.needsReview = true;
        enrichedContent.enrichmentConfidence = 0.5;

        return enrichedContent;
    }

    /**
     * Manual trigger for moderators
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @param {Object} options - Generation options
     * @returns {Promise<Object>}
     */
    async manualPopulate(entityType, entityId, options = {}) {
        await this.ensureInit();

        // Check moderator status
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Authentication required');
        }

        // TODO: Check if user is moderator via moderation-service
        // For now, allow any authenticated user

        console.log(`[AIPopulationService] Manual populate triggered: ${entityType}/${entityId}`);

        // Fetch existing entity
        const collection = this.collectionMap[entityType] || entityType;
        const doc = await this.db.collection(collection).doc(entityId).get();

        if (!doc.exists) {
            throw new Error('Entity not found');
        }

        const existingData = doc.data();
        const mythology = existingData.mythology || existingData.primaryMythology || 'unknown';

        // Generate content based on options
        let generatedContent;

        if (options.fullRegenerate) {
            generatedContent = await this.generateFullEntity({
                name: existingData.name,
                type: entityType,
                mythology,
                originalData: existingData
            });
        } else {
            generatedContent = await this.populateSparseEntity({
                ...existingData,
                type: entityType
            });
        }

        // Add moderation metadata
        generatedContent.manuallyPopulated = true;
        generatedContent.populatedBy = user.uid;
        generatedContent.populatedByName = user.displayName || user.email;
        generatedContent.populatedAt = firebase.firestore.FieldValue.serverTimestamp();
        generatedContent.needsReview = !options.skipReview;
        generatedContent.confidence = options.confidence || 0.6;

        // Save if requested
        if (options.saveImmediately) {
            await this.db.collection(collection).doc(entityId).update(generatedContent);
        }

        // Dispatch event
        this._dispatchEvent('entityManuallyPopulated', {
            entityType,
            entityId,
            populatedBy: user.uid,
            data: generatedContent
        });

        return generatedContent;
    }

    // ==========================================
    // GENERATION FUNCTIONS
    // ==========================================

    /**
     * Generate basic description for an entity
     * @param {string} name - Entity name
     * @param {string} type - Entity type
     * @param {string} mythology - Mythology system
     * @returns {string}
     */
    generateBasicDescription(name, type, mythology) {
        const template = this.templates.descriptions[type] || this.templates.descriptions.default;
        const mythologyName = this._formatMythologyName(mythology);

        return template
            .replace(/{name}/g, name)
            .replace(/{type}/g, type)
            .replace(/{mythology}/g, mythologyName)
            .replace(/{article}/g, this._getArticle(type));
    }

    /**
     * Generate standard sections for entity type
     * @param {Object} entity - Entity object
     * @returns {Array}
     */
    generateSections(entity) {
        const type = entity.type || 'default';
        const sectionTemplates = this.templates.sections[type] || this.templates.sections.default;
        const mythology = this._formatMythologyName(entity.mythology);

        return sectionTemplates.map(template => ({
            title: template.title,
            content: template.content
                .replace(/{name}/g, entity.name)
                .replace(/{type}/g, type)
                .replace(/{mythology}/g, mythology),
            autoGenerated: true,
            needsExpansion: true
        }));
    }

    /**
     * Generate relationship suggestions
     * @param {Object} entity - Entity object
     * @returns {Array}
     */
    generateRelationships(entity) {
        const type = entity.type || 'default';
        const relationshipTemplates = this.templates.relationships[type] || this.templates.relationships.default;

        return relationshipTemplates.map(template => ({
            relationshipType: template.type,
            description: template.description.replace(/{name}/g, entity.name),
            targetEntityType: template.targetType,
            placeholder: true,
            needsResolution: true
        }));
    }

    /**
     * Generate corpus query suggestions
     * @param {Object} entity - Entity object
     * @returns {Array}
     */
    generateCorpusQueries(entity) {
        const type = entity.type || 'default';
        const queryTemplates = this.templates.corpusQueries[type] || this.templates.corpusQueries.default;
        const mythology = entity.mythology || 'mythology';

        return queryTemplates.map(template => ({
            label: template.label.replace(/{name}/g, entity.name),
            query: {
                term: template.term
                    .replace(/{name}/g, entity.name)
                    .replace(/{mythology}/g, mythology),
                options: {
                    contextWords: 20,
                    maxResults: 50
                }
            },
            queryType: template.queryType || 'combined',
            autoGenerated: true
        }));
    }

    /**
     * Generate metadata suggestions
     * @param {Object} entity - Entity object
     * @returns {Object}
     */
    generateMetadata(entity) {
        const type = entity.type || 'default';
        const metadataTemplate = this.templates.metadata[type] || this.templates.metadata.default;

        const metadata = {
            attributes: {},
            temporal: {},
            geographical: {},
            autoGenerated: true
        };

        // Generate attributes based on type
        if (metadataTemplate.attributes) {
            for (const [key, defaultValue] of Object.entries(metadataTemplate.attributes)) {
                metadata.attributes[key] = {
                    value: defaultValue,
                    needsVerification: true
                };
            }
        }

        // Generate temporal data
        if (metadataTemplate.temporal) {
            metadata.temporal = {
                era: metadataTemplate.temporal.era || 'Ancient',
                period: metadataTemplate.temporal.period || 'Unknown',
                needsVerification: true
            };
        }

        // Generate geographical data
        if (metadataTemplate.geographical) {
            metadata.geographical = {
                region: this._getMythologyRegion(entity.mythology),
                origin: 'Unknown',
                needsVerification: true
            };
        }

        return metadata;
    }

    /**
     * Generate full entity content
     * @param {Object} params - Generation parameters
     * @returns {Promise<Object>}
     */
    async generateFullEntity(params) {
        const { name, type, mythology, originalData = {}, isStarter = false, role = '' } = params;

        const entity = {
            name,
            type,
            mythology,
            primaryMythology: mythology,

            // Generate descriptions
            shortDescription: this._generateShortDescription(name, type, mythology),
            longDescription: this.generateBasicDescription(name, type, mythology),

            // Generate sections
            extendedContent: this.generateSections({ name, type, mythology }),

            // Generate suggestions
            suggestedRelationships: this.generateRelationships({ name, type, mythology }),
            suggestedCorpusQueries: this.generateCorpusQueries({ name, type, mythology }),
            suggestedMetadata: this.generateMetadata({ name, type, mythology }),

            // Generate tags
            tags: this._generateTags(type, mythology, role),

            // Quality markers
            autoGenerated: true,
            generatedAt: new Date().toISOString(),
            needsReview: true,
            confidence: isStarter ? 0.2 : 0.4,
            sources: ['AI Generated - Needs Verification'],

            // Preserve original data fields that should be kept
            ...(originalData.slug && { slug: originalData.slug }),
            ...(originalData.svgIcon && { svgIcon: originalData.svgIcon }),
            ...(originalData.imageUrl && { imageUrl: originalData.imageUrl })
        };

        return entity;
    }

    // ==========================================
    // BANNER TEXT GENERATION
    // ==========================================

    /**
     * Get auto-populated content banner
     * @param {Object} entity - Entity with auto-generated content
     * @returns {Object}
     */
    getAutoPopulatedBanner(entity) {
        const type = entity.type || 'entry';
        const typeName = this._formatTypeName(type);

        if (entity.isShell) {
            return {
                title: 'Placeholder Content',
                message: `This ${typeName} entry was auto-populated after the original content was removed. The information shown is placeholder content that requires verification and expansion.`,
                cta: 'Claim Ownership & Update',
                ctaAction: 'claimOwnership',
                severity: 'warning',
                icon: 'info-circle'
            };
        }

        if (entity.isStarter) {
            return {
                title: 'Starter Entry',
                message: `This ${typeName} is a starter entry for a newly created mythology. Help build this entry by contributing verified content!`,
                cta: 'Contribute Content',
                ctaAction: 'contribute',
                severity: 'info',
                icon: 'plus-circle'
            };
        }

        if (entity.autoGenerated) {
            return {
                title: 'Auto-Generated Content',
                message: `This ${typeName} entry contains auto-generated content that needs community verification. Some details may be inaccurate or incomplete.`,
                cta: 'Help Improve This Entry',
                ctaAction: 'edit',
                severity: 'info',
                icon: 'edit'
            };
        }

        if (entity.needsReview) {
            return {
                title: 'Pending Review',
                message: `This ${typeName} entry has been flagged for review. Content accuracy is being verified.`,
                cta: null,
                severity: 'notice',
                icon: 'clock'
            };
        }

        return null;
    }

    /**
     * Generate banner HTML
     * @param {Object} entity - Entity data
     * @returns {string}
     */
    renderAutoPopulatedBanner(entity) {
        const banner = this.getAutoPopulatedBanner(entity);
        if (!banner) return '';

        const severityClass = `banner-${banner.severity}`;
        const ctaHTML = banner.cta ? `
            <button class="banner-cta" data-action="${banner.ctaAction}" data-entity-id="${entity.id}" data-entity-type="${entity.type}">
                ${banner.cta}
            </button>
        ` : '';

        return `
            <div class="auto-populated-banner ${severityClass}">
                <div class="banner-icon">
                    <svg class="icon"><use href="#icon-${banner.icon}"></use></svg>
                </div>
                <div class="banner-content">
                    <h4 class="banner-title">${banner.title}</h4>
                    <p class="banner-message">${banner.message}</p>
                </div>
                ${ctaHTML}
            </div>
        `;
    }

    // ==========================================
    // CONTENT QUALITY MARKERS
    // ==========================================

    /**
     * Add quality markers to entity
     * @param {Object} entity - Entity data
     * @param {Object} options - Marker options
     * @returns {Object}
     */
    addQualityMarkers(entity, options = {}) {
        return {
            ...entity,
            autoGenerated: options.autoGenerated !== false,
            generatedAt: options.generatedAt || firebase.firestore.FieldValue.serverTimestamp(),
            needsReview: options.needsReview !== false,
            confidence: options.confidence || this._calculateConfidence(entity),
            sources: options.sources || ['AI Generated - Needs Verification'],
            qualityScore: this._calculateQualityScore(entity),
            completenessScore: this._calculateCompletenessScore(entity)
        };
    }

    /**
     * Calculate confidence score based on content
     * @param {Object} entity - Entity data
     * @returns {number} 0-1 confidence score
     */
    _calculateConfidence(entity) {
        let score = 0.3; // Base score for auto-generated

        // Increase if has original data
        if (entity.originalData) score += 0.1;

        // Increase if has verified sources
        if (entity.sources?.some(s => !s.includes('AI Generated'))) score += 0.2;

        // Increase if has user contributions
        if (entity.lastEditedBy) score += 0.1;

        // Increase based on content length
        const descLength = (entity.longDescription || '').length;
        if (descLength > 1000) score += 0.1;
        if (descLength > 2000) score += 0.1;

        return Math.min(score, 1.0);
    }

    /**
     * Calculate quality score
     * @param {Object} entity - Entity data
     * @returns {number} 0-100 quality score
     */
    _calculateQualityScore(entity) {
        let score = 0;

        // Description quality
        const descLength = (entity.longDescription || '').length;
        score += Math.min(descLength / 50, 20); // Max 20 points

        // Sections completeness
        const sections = entity.extendedContent || [];
        score += Math.min(sections.length * 5, 25); // Max 25 points

        // Has relationships
        if (entity.relatedEntities?.length > 0 || entity.suggestedRelationships?.length > 0) {
            score += 15;
        }

        // Has sources
        if (entity.sources?.length > 0) {
            const verifiedSources = entity.sources.filter(s => !s.includes('AI Generated'));
            score += Math.min(verifiedSources.length * 5, 20);
        }

        // Has metadata
        if (entity.attributes && Object.keys(entity.attributes).length > 0) {
            score += 10;
        }

        // Has corpus queries
        if (entity.corpusQueries?.length > 0 || entity.suggestedCorpusQueries?.length > 0) {
            score += 10;
        }

        return Math.min(Math.round(score), 100);
    }

    /**
     * Calculate completeness score
     * @param {Object} entity - Entity data
     * @returns {number} 0-100 completeness score
     */
    _calculateCompletenessScore(entity) {
        const type = entity.type || 'default';
        const requiredFields = this._getRequiredFields(type);
        const optionalFields = this._getOptionalFields(type);

        let requiredComplete = 0;
        let optionalComplete = 0;

        // Check required fields
        for (const field of requiredFields) {
            if (this._hasValue(entity, field)) {
                requiredComplete++;
            }
        }

        // Check optional fields
        for (const field of optionalFields) {
            if (this._hasValue(entity, field)) {
                optionalComplete++;
            }
        }

        const requiredScore = (requiredComplete / requiredFields.length) * 70;
        const optionalScore = (optionalComplete / optionalFields.length) * 30;

        return Math.round(requiredScore + optionalScore);
    }

    // ==========================================
    // TEMPLATE INITIALIZATION
    // ==========================================

    /**
     * Initialize content templates
     * @returns {Object}
     */
    _initializeTemplates() {
        return {
            descriptions: {
                deity: `{name} is {article} deity in {mythology} mythology. As a divine figure, {name} holds significance in the religious and cultural traditions of ancient peoples. This entry requires further research and verification from primary sources.`,

                hero: `{name} is a legendary hero from {mythology} mythology. Known for extraordinary deeds and adventures, {name} represents the heroic ideals celebrated in {mythology} tradition. Further scholarly research is needed to complete this entry.`,

                creature: `{name} is a mythical creature from {mythology} mythology. This legendary being features prominently in the folklore and religious narratives of the {mythology} tradition. Additional research is required to verify and expand this entry.`,

                item: `{name} is a sacred or legendary artifact from {mythology} mythology. This item holds special significance in the myths and legends of the {mythology} tradition. Scholarly verification and expansion of this entry is needed.`,

                place: `{name} is a sacred or mythological location in {mythology} mythology. This place features in the religious geography and mythic narratives of the {mythology} tradition. Further research is needed to complete this entry.`,

                ritual: `{name} is a ritual or ceremonial practice from {mythology} tradition. This practice holds religious and cultural significance in {mythology} belief systems. Scholarly verification is required for this entry.`,

                text: `{name} is a sacred text or literary work from {mythology} tradition. This text contains important mythological, religious, or cultural content relevant to understanding {mythology} beliefs. Further academic research is needed.`,

                symbol: `{name} is a sacred symbol from {mythology} tradition. This symbol carries deep religious, spiritual, or cultural meaning in {mythology} iconography. Additional research is required to verify this entry.`,

                herb: `{name} is a sacred plant or herb from {mythology} tradition. This botanical specimen holds religious, medicinal, or magical significance in {mythology} practices. Scholarly verification is needed.`,

                archetype: `{name} is an archetypal concept found in {mythology} mythology and beyond. As a universal pattern, this archetype appears across multiple cultural traditions. Further comparative analysis is needed.`,

                magic: `{name} is a magical system or practice from {mythology} tradition. This magical tradition encompasses beliefs and practices related to supernatural forces. Additional research is required.`,

                default: `{name} is an entity from {mythology} mythology. This entry requires further research and scholarly verification to provide accurate and comprehensive information.`
            },

            sections: {
                deity: [
                    {
                        title: 'Domains & Powers',
                        content: `As a deity in {mythology} mythology, {name} is associated with various domains and divine powers. The exact nature of these domains requires further scholarly research and verification from primary sources.`
                    },
                    {
                        title: 'Worship & Cult',
                        content: `The worship of {name} in {mythology} tradition involved specific rituals, offerings, and sacred sites. Details about these religious practices require verification from historical and archaeological sources.`
                    },
                    {
                        title: 'Symbols & Iconography',
                        content: `{name} is represented through various symbols and artistic depictions in {mythology} art and literature. The specific iconographic attributes associated with this deity need scholarly documentation.`
                    },
                    {
                        title: 'Myths & Stories',
                        content: `{name} appears in various myths and sacred narratives from {mythology} tradition. These stories require compilation and analysis from primary textual sources.`
                    }
                ],

                hero: [
                    {
                        title: 'Origin & Birth',
                        content: `The origins of {name} in {mythology} mythology involve circumstances surrounding their birth and early life. Details require verification from primary sources.`
                    },
                    {
                        title: 'Quests & Adventures',
                        content: `{name} is known for legendary quests and heroic adventures in {mythology} tradition. The specific deeds and challenges faced by this hero need scholarly documentation.`
                    },
                    {
                        title: 'Companions & Allies',
                        content: `Throughout their adventures, {name} encountered various companions and allies. The relationships and interactions require further research.`
                    },
                    {
                        title: 'Legacy & Influence',
                        content: `The legacy of {name} in {mythology} culture and beyond encompasses their lasting impact on art, literature, and popular imagination. Further analysis is needed.`
                    }
                ],

                creature: [
                    {
                        title: 'Description & Appearance',
                        content: `{name} is described in {mythology} sources with specific physical characteristics. The exact appearance and form require verification from primary texts.`
                    },
                    {
                        title: 'Habitat & Origin',
                        content: `In {mythology} mythology, {name} is associated with specific locations and origins. The mythological geography requires further research.`
                    },
                    {
                        title: 'Abilities & Powers',
                        content: `{name} possesses various supernatural abilities according to {mythology} tradition. These powers and their nature need scholarly verification.`
                    },
                    {
                        title: 'Encounters & Stories',
                        content: `{name} appears in various myths and legends from {mythology} tradition, often encountering gods, heroes, or mortals. These narratives require documentation.`
                    }
                ],

                item: [
                    {
                        title: 'Description & Properties',
                        content: `{name} is described as having specific physical and magical properties in {mythology} tradition. Details require verification from primary sources.`
                    },
                    {
                        title: 'Origin & Creation',
                        content: `The origins of {name} in {mythology} mythology involve specific creation myths or divine craftsmanship. These accounts need scholarly documentation.`
                    },
                    {
                        title: 'Powers & Abilities',
                        content: `{name} is attributed with various magical or symbolic powers in {mythology} tradition. The exact nature of these abilities requires research.`
                    },
                    {
                        title: 'Bearers & History',
                        content: `Throughout {mythology} mythology, {name} has been wielded or possessed by various figures. This history needs compilation from primary sources.`
                    }
                ],

                place: [
                    {
                        title: 'Location & Geography',
                        content: `{name} is situated in the mythological geography of {mythology} tradition. The exact location and surrounding landscape require scholarly research.`
                    },
                    {
                        title: 'Significance & Symbolism',
                        content: `In {mythology} mythology, {name} holds particular religious and symbolic significance. The deeper meanings require analysis and verification.`
                    },
                    {
                        title: 'Associated Deities',
                        content: `{name} is connected with various divine figures in {mythology} tradition. These associations need documentation from primary sources.`
                    },
                    {
                        title: 'Events & Myths',
                        content: `Important mythological events in {mythology} tradition took place at {name}. These narratives require compilation and verification.`
                    }
                ],

                default: [
                    {
                        title: 'Overview',
                        content: `{name} is an element of {mythology} mythology that requires further scholarly research and documentation from primary sources.`
                    },
                    {
                        title: 'Significance',
                        content: `The significance of {name} in {mythology} tradition encompasses religious, cultural, and symbolic dimensions. Further analysis is needed.`
                    },
                    {
                        title: 'Related Elements',
                        content: `{name} is connected to various other elements in {mythology} mythology. These relationships require documentation and verification.`
                    }
                ]
            },

            relationships: {
                deity: [
                    { type: 'family', description: 'Divine family relationships of {name}', targetType: 'deity' },
                    { type: 'parallel', description: 'Cross-cultural parallels to {name}', targetType: 'deity' },
                    { type: 'mythological', description: 'Mythological connections of {name}', targetType: 'hero' },
                    { type: 'symbolic', description: 'Symbolic associations of {name}', targetType: 'symbol' }
                ],
                hero: [
                    { type: 'family', description: 'Family and lineage of {name}', targetType: 'hero' },
                    { type: 'mythological', description: 'Divine patrons of {name}', targetType: 'deity' },
                    { type: 'parallel', description: 'Heroic parallels to {name}', targetType: 'hero' },
                    { type: 'encounter', description: 'Creatures encountered by {name}', targetType: 'creature' }
                ],
                creature: [
                    { type: 'mythological', description: 'Divine connections of {name}', targetType: 'deity' },
                    { type: 'encounter', description: 'Heroes who faced {name}', targetType: 'hero' },
                    { type: 'parallel', description: 'Similar creatures to {name}', targetType: 'creature' },
                    { type: 'habitat', description: 'Locations associated with {name}', targetType: 'place' }
                ],
                default: [
                    { type: 'related', description: 'Related elements to {name}', targetType: 'any' },
                    { type: 'parallel', description: 'Cross-cultural parallels', targetType: 'any' }
                ]
            },

            corpusQueries: {
                deity: [
                    { label: 'Primary sources for {name}', term: '"{name}"', queryType: 'github' },
                    { label: 'Hymns and prayers to {name}', term: '{name} AND (hymn OR prayer OR invocation)', queryType: 'github' },
                    { label: 'Related entities in {mythology}', term: '{name}', queryType: 'firebase' }
                ],
                hero: [
                    { label: 'Epic narratives of {name}', term: '"{name}"', queryType: 'github' },
                    { label: 'Deeds and adventures of {name}', term: '{name} AND (quest OR adventure OR deed)', queryType: 'github' },
                    { label: 'Related heroes in {mythology}', term: '{name}', queryType: 'firebase' }
                ],
                creature: [
                    { label: 'Descriptions of {name}', term: '"{name}"', queryType: 'github' },
                    { label: 'Encounters with {name}', term: '{name} AND (encounter OR battle OR slew)', queryType: 'github' },
                    { label: 'Similar creatures', term: '{name}', queryType: 'firebase' }
                ],
                default: [
                    { label: 'References to {name}', term: '"{name}"', queryType: 'combined' },
                    { label: 'Related entities', term: '{name}', queryType: 'firebase' }
                ]
            },

            metadata: {
                deity: {
                    attributes: {
                        divineType: 'Unknown',
                        gender: 'Unknown',
                        element: 'Unknown',
                        domain: 'Unknown'
                    },
                    temporal: { era: 'Ancient', period: 'Pre-Classical to Classical' },
                    geographical: true
                },
                hero: {
                    attributes: {
                        heroType: 'Unknown',
                        mortality: 'Unknown',
                        parentage: 'Unknown'
                    },
                    temporal: { era: 'Heroic Age', period: 'Unknown' },
                    geographical: true
                },
                creature: {
                    attributes: {
                        creatureType: 'Unknown',
                        disposition: 'Unknown',
                        size: 'Unknown'
                    },
                    temporal: { era: 'Mythic', period: 'Unknown' },
                    geographical: true
                },
                default: {
                    attributes: {
                        category: 'Unknown'
                    },
                    temporal: { era: 'Ancient', period: 'Unknown' },
                    geographical: true
                }
            }
        };
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    /**
     * Set up event listeners for integration
     */
    _setupEventListeners() {
        // Listen for deletion events (from deletion-recovery-service)
        window.addEventListener('entityDeleted', async (event) => {
            const { entityType, entityId, originalData, keepShell } = event.detail || {};
            if (keepShell && entityType && entityId) {
                try {
                    await this.populateAfterDeletion(entityType, entityId, originalData);
                } catch (error) {
                    console.error('[AIPopulationService] Error on deletion recovery:', error);
                }
            }
        });

        // Listen for new mythology creation
        window.addEventListener('mythologyCreated', async (event) => {
            const { mythologyData, generateStarters } = event.detail || {};
            if (generateStarters && mythologyData) {
                try {
                    await this.generateStarterEntities(mythologyData);
                } catch (error) {
                    console.error('[AIPopulationService] Error generating starters:', error);
                }
            }
        });

        // Listen for ownership claims (from ownership-service)
        window.addEventListener('ownershipClaimed', (event) => {
            const { entityType, entityId, userId } = event.detail || {};
            console.log(`[AIPopulationService] Ownership claimed: ${entityType}/${entityId} by ${userId}`);
            // Can trigger additional population if needed
        });
    }

    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event details
     */
    _dispatchEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Get required sections for entity type
     * @param {string} type - Entity type
     * @returns {Array}
     */
    _getRequiredSections(type) {
        const sectionMap = {
            deity: ['Domains', 'Worship', 'Symbols', 'Myths'],
            hero: ['Origin', 'Quests', 'Companions', 'Legacy'],
            creature: ['Description', 'Habitat', 'Abilities', 'Encounters'],
            item: ['Description', 'Origin', 'Powers', 'Bearers'],
            place: ['Location', 'Significance', 'Deities', 'Events'],
            default: ['Overview', 'Significance']
        };
        return sectionMap[type] || sectionMap.default;
    }

    /**
     * Get required fields for entity type
     * @param {string} type - Entity type
     * @returns {Array}
     */
    _getRequiredFields(type) {
        return ['name', 'type', 'mythology', 'shortDescription', 'longDescription'];
    }

    /**
     * Get optional fields for entity type
     * @param {string} type - Entity type
     * @returns {Array}
     */
    _getOptionalFields(type) {
        return ['extendedContent', 'tags', 'relatedEntities', 'sources', 'attributes', 'svgIcon', 'imageUrl'];
    }

    /**
     * Check if entity has value for field
     * @param {Object} entity - Entity data
     * @param {string} field - Field name
     * @returns {boolean}
     */
    _hasValue(entity, field) {
        const value = entity[field];
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    }

    /**
     * Format mythology name
     * @param {string} mythology - Mythology slug
     * @returns {string}
     */
    _formatMythologyName(mythology) {
        if (!mythology || mythology === 'unknown') return 'world';
        return mythology
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Format type name
     * @param {string} type - Entity type
     * @returns {string}
     */
    _formatTypeName(type) {
        const typeNames = {
            deity: 'deity',
            hero: 'hero',
            creature: 'creature',
            item: 'artifact',
            place: 'location',
            ritual: 'ritual',
            text: 'text',
            symbol: 'symbol',
            herb: 'herb',
            archetype: 'archetype',
            magic: 'magic system'
        };
        return typeNames[type] || type;
    }

    /**
     * Get article for type
     * @param {string} type - Entity type
     * @returns {string}
     */
    _getArticle(type) {
        const vowelTypes = ['archetype', 'artifact', 'item'];
        return vowelTypes.includes(type) ? 'an' : 'a';
    }

    /**
     * Get mythology region
     * @param {string} mythology - Mythology slug
     * @returns {string}
     */
    _getMythologyRegion(mythology) {
        const regionMap = {
            greek: 'Mediterranean',
            roman: 'Mediterranean',
            norse: 'Scandinavia',
            egyptian: 'North Africa',
            celtic: 'Western Europe',
            hindu: 'South Asia',
            buddhist: 'Asia',
            japanese: 'East Asia',
            chinese: 'East Asia',
            sumerian: 'Mesopotamia',
            babylonian: 'Mesopotamia',
            aztec: 'Mesoamerica',
            mayan: 'Mesoamerica',
            yoruba: 'West Africa',
            polynesian: 'Pacific Islands',
            slavic: 'Eastern Europe',
            persian: 'Middle East'
        };
        return regionMap[mythology] || 'Unknown Region';
    }

    /**
     * Infer entity type from data
     * @param {Object} entity - Entity data
     * @returns {string}
     */
    _inferEntityType(entity) {
        if (entity.domains || entity.divineType) return 'deity';
        if (entity.quests || entity.heroType) return 'hero';
        if (entity.habitat || entity.creatureType) return 'creature';
        if (entity.powers && entity.bearers) return 'item';
        if (entity.coordinates || entity.locationType) return 'place';
        return 'default';
    }

    /**
     * Generate short description
     * @param {string} name - Entity name
     * @param {string} type - Entity type
     * @param {string} mythology - Mythology
     * @returns {string}
     */
    _generateShortDescription(name, type, mythology) {
        const mythologyName = this._formatMythologyName(mythology);
        const typeName = this._formatTypeName(type);
        return `A ${typeName} from ${mythologyName} mythology.`;
    }

    /**
     * Generate placeholder names for starter entities
     * @param {string} type - Entity type
     * @param {string} mythology - Mythology slug
     * @param {number} count - Number of names
     * @param {Object} mythologyData - Mythology data
     * @returns {Array}
     */
    _generatePlaceholderNames(type, mythology, count, mythologyData) {
        const mythologyName = this._formatMythologyName(mythology);
        const placeholders = [];

        const roleMap = {
            deity: ['Chief God', 'Earth Deity', 'Sky Deity', 'War God', 'Wisdom Deity'],
            hero: ['Great Hero', 'Culture Hero', 'Trickster Hero', 'Warrior Hero'],
            creature: ['Guardian Beast', 'Chaos Monster', 'Sacred Animal'],
            place: ['Sacred Mountain', 'Underworld', 'Divine Realm'],
            item: ['Divine Weapon', 'Sacred Vessel', 'Magical Artifact']
        };

        const roles = roleMap[type] || ['Entity'];

        for (let i = 0; i < count; i++) {
            const role = roles[i % roles.length];
            placeholders.push({
                name: `${mythologyName} ${role}`,
                role: role
            });
        }

        return placeholders;
    }

    /**
     * Generate tags for entity
     * @param {string} type - Entity type
     * @param {string} mythology - Mythology
     * @param {string} role - Entity role
     * @returns {Array}
     */
    _generateTags(type, mythology, role = '') {
        const tags = [type, mythology, 'auto-generated', 'needs-review'];

        if (role) {
            tags.push(role.toLowerCase().replace(/\s+/g, '-'));
        }

        return tags;
    }

    /**
     * Cleanup service
     */
    cleanup() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.AIPopulationService = AIPopulationService;
    window.aiPopulationService = new AIPopulationService();
}

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.apps?.length > 0) {
    window.aiPopulationService?.init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                window.aiPopulationService?.init();
            }
        }, 500);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPopulationService;
}
