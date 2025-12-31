/**
 * Entity Detail Viewer Component
 * Displays comprehensive view of a single entity
 *
 * Features:
 * - Hero section with entity info and animated icons
 * - All entity attributes organized by sections
 * - Related entities (using displayOptions and relatedEntities schema)
 * - Corpus queries with primary source citations
 * - Linguistic information with etymology and alternate names
 * - Geographical information with coordinates
 * - Temporal information with dates and cultural periods
 * - Cultural context with worship practices, festivals, and modern legacy
 * - Metaphysical properties (elements, chakras, etc.)
 * - Archetypes section
 * - Edit button for authenticated users
 * - Share/bookmark functionality
 * - Smooth transitions and animations
 * - Mobile-friendly responsive layout
 * - Proper typography hierarchy
 *
 * Performance Features (v2.1.0):
 * - Batched Firebase queries for related entities (fixes N+1 problem)
 * - Entity caching with 5-minute TTL
 * - Async loading of related entities with loading states
 * - Enhanced error logging with context (entity ID, type, step)
 * - Comprehensive entity type to collection name mapping
 *
 * Uses ComprehensiveMetadataRenderer for complete metadata coverage
 *
 * @version 2.1.0 - Performance optimizations and error handling
 */

class EntityDetailViewer {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
        this.animationDelay = 0;
        // Check if ComprehensiveMetadataRenderer is available for extended rendering
        this.useComprehensiveRenderer = options.useComprehensiveRenderer !== false && window.ComprehensiveMetadataRenderer;

        // Cache for related entities to avoid refetching
        this.relatedEntityCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

        // Maximum IDs per Firebase 'in' query
        this.MAX_IDS_PER_QUERY = 10;
    }

    /**
     * Render the entity detail view
     * @param {object} route - Route object from router
     * @returns {string} HTML string
     */
    async render(route) {
        const { mythology, entityType, entityId } = route;
        const context = { mythology, entityType, entityId, step: 'initialization' };

        try {
            // Load entity data
            context.step = 'loading-entity';
            const entity = await this.loadEntity(mythology, entityType, entityId);

            if (!entity) {
                console.warn(`[EntityDetailViewer] Entity not found: ${entityType}/${entityId} in ${mythology}`);
                return this.renderNotFound(entityId);
            }

            // Generate initial HTML with loading placeholder for related entities
            context.step = 'generating-html';
            const relatedEntities = {};
            const html = this.generateHTML(entity, relatedEntities, mythology, entityType);

            // Schedule async loading of related entities
            if (entity.displayOptions?.relatedEntities?.length > 0) {
                this.loadRelatedEntitiesAsync(entity, mythology, entityType);
            }

            return html;

        } catch (error) {
            this.logError('Render error', error, context);
            throw error;
        }
    }

    /**
     * Load related entities asynchronously and update the DOM
     * @param {object} entity - The main entity
     * @param {string} mythology - Mythology name
     * @param {string} entityType - Entity type
     */
    async loadRelatedEntitiesAsync(entity, mythology, entityType) {
        const context = {
            entityId: entity.id,
            entityType,
            step: 'loading-related-entities'
        };

        try {
            // Show loading indicator
            this.showRelatedEntitiesLoading();

            // Load related entities
            const relatedEntities = await this.loadRelatedEntities(entity);

            // Update the DOM with loaded related entities
            if (Object.keys(relatedEntities).length > 0) {
                this.updateRelatedEntitiesSection(relatedEntities, mythology, entityType);
            } else {
                this.hideRelatedEntitiesLoading();
            }
        } catch (error) {
            this.logError('Failed to load related entities', error, context);
            this.hideRelatedEntitiesLoading();
        }
    }

    /**
     * Show loading indicator for related entities section
     */
    showRelatedEntitiesLoading() {
        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        // Check if loading placeholder already exists
        if (container.querySelector('.related-entities-loading')) return;

        const loadingHTML = `
            <section class="entity-section entity-section-related related-entities-loading" style="--animation-delay: 0s">
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128279;</span>
                    Related Entities
                </h2>
                <div class="related-entities-container">
                    <div class="loading-indicator" role="status" aria-live="polite">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Loading related entities...</p>
                    </div>
                </div>
            </section>
        `;

        // Insert before metadata footer or at the end
        const footer = container.querySelector('.entity-metadata-footer');
        if (footer) {
            footer.insertAdjacentHTML('beforebegin', loadingHTML);
        } else {
            const mainContent = container.querySelector('.entity-main-content');
            if (mainContent) {
                mainContent.insertAdjacentHTML('beforeend', loadingHTML);
            }
        }
    }

    /**
     * Hide loading indicator for related entities
     */
    hideRelatedEntitiesLoading() {
        const loadingSection = document.querySelector('.related-entities-loading');
        if (loadingSection) {
            loadingSection.remove();
        }
    }

    /**
     * Update the related entities section in the DOM
     * @param {object} relatedEntities - Loaded related entities
     * @param {string} mythology - Mythology name
     * @param {string} entityType - Entity type
     */
    updateRelatedEntitiesSection(relatedEntities, mythology, entityType) {
        // Remove loading indicator
        this.hideRelatedEntitiesLoading();

        const container = document.querySelector('.entity-detail-viewer');
        if (!container) return;

        // Generate new related entities HTML
        const html = this.renderRelatedEntities(relatedEntities, mythology, entityType);

        // Insert before metadata footer or at the end
        const footer = container.querySelector('.entity-metadata-footer');
        if (footer) {
            footer.insertAdjacentHTML('beforebegin', html);
        } else {
            const mainContent = container.querySelector('.entity-main-content');
            if (mainContent) {
                mainContent.insertAdjacentHTML('beforeend', html);
            }
        }
    }

    /**
     * Load entity from Firebase
     * @param {string} mythology - Mythology name
     * @param {string} entityType - Entity type (deity, hero, creature, etc.)
     * @param {string} entityId - Entity document ID
     * @returns {Promise<object|null>} Entity data or null if not found
     */
    async loadEntity(mythology, entityType, entityId) {
        const context = { mythology, entityType, entityId, step: 'loading-entity' };

        if (!this.db) {
            throw new Error(`[EntityDetailViewer] Firebase Firestore not initialized (${entityType}/${entityId})`);
        }

        try {
            const collection = this.getCollectionName(entityType);
            const doc = await this.db.collection(collection).doc(entityId).get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            this.logError('Failed to load entity from Firebase', error, context);
            throw error;
        }
    }

    /**
     * Load related entities with batched queries to fix N+1 problem
     * @param {object} entity - The main entity containing displayOptions.relatedEntities
     * @returns {Promise<object>} Related entities grouped by relationship type
     */
    async loadRelatedEntities(entity) {
        const related = {};
        const context = {
            entityId: entity.id,
            step: 'loading-related-entities'
        };

        // Check for relationships in displayOptions
        if (!entity.displayOptions?.relatedEntities) {
            return related;
        }

        // Process all relationships in parallel using batched queries
        const relationshipPromises = entity.displayOptions.relatedEntities.map(async (relationship) => {
            const relationshipContext = {
                ...context,
                relationshipType: relationship.type,
                collection: relationship.collection
            };

            try {
                const entities = await this.loadEntitiesByIdsBatched(
                    relationship.collection,
                    relationship.ids || [],
                    relationshipContext
                );

                return {
                    type: relationship.type,
                    data: {
                        label: relationship.label || relationship.type,
                        entities: entities
                    }
                };
            } catch (error) {
                this.logError(`Failed to load ${relationship.type} relationship`, error, relationshipContext);
                return null;
            }
        });

        // Wait for all relationships to load
        const results = await Promise.all(relationshipPromises);

        // Build related entities object
        for (const result of results) {
            if (result && result.data.entities.length > 0) {
                related[result.type] = result.data;
            }
        }

        return related;
    }

    /**
     * Load multiple entities by IDs using batched Firebase 'in' queries
     * Fixes N+1 query problem by fetching up to 10 entities per query
     * Also uses caching to avoid refetching same entities
     *
     * @param {string} collection - Firebase collection name
     * @param {string[]} ids - Array of entity IDs to fetch
     * @param {object} context - Error context for logging
     * @returns {Promise<object[]>} Array of entity objects
     */
    async loadEntitiesByIdsBatched(collection, ids, context = {}) {
        if (!ids || ids.length === 0) return [];

        // Deduplicate IDs
        const uniqueIds = [...new Set(ids)];
        const entities = [];
        const uncachedIds = [];

        // Check cache first
        for (const id of uniqueIds) {
            const cacheKey = `${collection}:${id}`;
            const cached = this.getCachedEntity(cacheKey);
            if (cached) {
                entities.push(cached);
            } else {
                uncachedIds.push(id);
            }
        }

        // If all entities were cached, return early
        if (uncachedIds.length === 0) {
            return entities;
        }

        // Split uncached IDs into chunks of MAX_IDS_PER_QUERY (Firebase 'in' query limit is 10)
        const chunks = this.chunkArray(uncachedIds, this.MAX_IDS_PER_QUERY);

        // Execute batched queries in parallel
        const chunkPromises = chunks.map(async (chunk, chunkIndex) => {
            const chunkContext = { ...context, chunkIndex, chunkSize: chunk.length };

            try {
                // Use Firebase 'in' query to fetch multiple documents at once
                const snapshot = await this.db
                    .collection(collection)
                    .where(window.firebase.firestore.FieldPath.documentId(), 'in', chunk)
                    .get();

                const chunkEntities = [];
                snapshot.forEach(doc => {
                    const entityData = {
                        id: doc.id,
                        ...doc.data()
                    };

                    // Cache the entity
                    const cacheKey = `${collection}:${doc.id}`;
                    this.setCachedEntity(cacheKey, entityData);

                    chunkEntities.push(entityData);
                });

                return chunkEntities;
            } catch (error) {
                this.logError(`Failed to batch fetch entities from ${collection}`, error, chunkContext);
                return [];
            }
        });

        // Wait for all chunks to complete
        const chunkResults = await Promise.all(chunkPromises);

        // Flatten chunk results and add to entities
        for (const chunkEntities of chunkResults) {
            entities.push(...chunkEntities);
        }

        return entities;
    }

    /**
     * Split an array into chunks of specified size
     * @param {any[]} array - Array to split
     * @param {number} size - Maximum chunk size
     * @returns {any[][]} Array of chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Get entity from cache if not expired
     * @param {string} cacheKey - Cache key (collection:id)
     * @returns {object|null} Cached entity or null
     */
    getCachedEntity(cacheKey) {
        const cached = this.relatedEntityCache.get(cacheKey);
        if (!cached) return null;

        // Check if cache has expired
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.relatedEntityCache.delete(cacheKey);
            return null;
        }

        return cached.data;
    }

    /**
     * Store entity in cache
     * @param {string} cacheKey - Cache key (collection:id)
     * @param {object} entity - Entity data to cache
     */
    setCachedEntity(cacheKey, entity) {
        this.relatedEntityCache.set(cacheKey, {
            data: entity,
            timestamp: Date.now()
        });
    }

    /**
     * Clear expired entries from cache
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.relatedEntityCache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL) {
                this.relatedEntityCache.delete(key);
            }
        }
    }

    /**
     * Log error with context information
     * @param {string} message - Error message
     * @param {Error} error - Error object
     * @param {object} context - Context information (entityId, entityType, step, etc.)
     */
    logError(message, error, context = {}) {
        const contextStr = Object.entries(context)
            .map(([key, value]) => `${key}=${value}`)
            .join(', ');

        console.error(
            `[EntityDetailViewer] ${message}` +
            (contextStr ? ` (${contextStr})` : '') +
            ':',
            error
        );
    }

    /**
     * Generate HTML for entity detail
     */
    generateHTML(entity, relatedEntities, mythology, entityType) {
        const colors = entity.colors || {};
        const primaryColor = colors.primary || '#667eea';
        const secondaryColor = colors.secondary || '#764ba2';
        this.animationDelay = 0;

        return `
            <article class="entity-detail-viewer" data-entity-id="${entity.id}" data-entity-type="${entityType}" data-mythology="${mythology}">
                <!-- Breadcrumb Navigation -->
                ${this.renderBreadcrumb(mythology, entityType, entity.name || entity.title)}

                <!-- Hero Section -->
                <header class="entity-hero-enhanced" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor}; --mythos-primary: ${primaryColor}; --mythos-secondary: ${secondaryColor};">
                    <div class="entity-hero-background" aria-hidden="true"></div>
                    <div class="entity-hero-content">
                        ${entity.icon ? `
                            <div class="entity-icon-large" aria-hidden="true">
                                <span class="icon-float">${entity.icon}</span>
                            </div>
                        ` : ''}
                        <div class="entity-hero-text">
                            <h1 class="entity-title">${this.escapeHtml(entity.name || entity.title)}</h1>
                            ${entity.linguistic?.originalName ? `
                                <p class="entity-original-name" lang="${this.getLanguageCode(mythology)}">${this.escapeHtml(entity.linguistic.originalName)}</p>
                            ` : ''}
                            ${entity.linguistic?.pronunciation ? `
                                <p class="entity-pronunciation">/${this.escapeHtml(entity.linguistic.pronunciation)}/</p>
                            ` : ''}

                            <div class="entity-badges" role="list" aria-label="Entity classification">
                                <span class="entity-type-badge" role="listitem">${this.getEntityTypeLabel(entityType)}</span>
                                <span class="mythology-badge mythology-${mythology}" role="listitem">${this.capitalize(mythology)}</span>
                                ${entity.categories?.map(cat => `<span class="category-badge" role="listitem">${this.capitalize(cat)}</span>`).join('') || ''}
                            </div>

                            ${entity.shortDescription ? `
                                <p class="entity-hero-description">${this.escapeHtml(entity.shortDescription)}</p>
                            ` : ''}

                            ${entity.epithets && entity.epithets.length > 0 ? `
                                <div class="entity-epithets" role="list" aria-label="Epithets">
                                    ${entity.epithets.slice(0, 5).map(epithet => `
                                        <span class="epithet-tag" role="listitem">${this.escapeHtml(epithet)}</span>
                                    `).join('')}
                                    ${entity.epithets.length > 5 ? `<span class="epithet-more">+${entity.epithets.length - 5} more</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </header>

                <!-- Quick Actions Bar -->
                <nav class="entity-quick-actions" aria-label="Quick actions">
                    <button class="quick-action-btn" onclick="window.history.back()" aria-label="Go back">
                        <span class="action-icon" aria-hidden="true">&#8592;</span>
                        <span class="action-text">Back</span>
                    </button>
                    <button class="quick-action-btn" onclick="EntityDetailViewer.shareEntity('${this.escapeHtml(entity.name || entity.title)}', '${entity.id}')" aria-label="Share this entity">
                        <span class="action-icon" aria-hidden="true">&#128279;</span>
                        <span class="action-text">Share</span>
                    </button>
                    <button class="quick-action-btn" onclick="EntityDetailViewer.bookmarkEntity('${entity.id}')" aria-label="Bookmark this entity">
                        <span class="action-icon" aria-hidden="true">&#9733;</span>
                        <span class="action-text">Bookmark</span>
                    </button>
                    ${entity.corpusQueries && entity.corpusQueries.length > 0 ? `
                        <button class="quick-action-btn quick-action-primary" onclick="EntityDetailViewer.scrollToSection('corpus-section')" aria-label="View primary sources">
                            <span class="action-icon" aria-hidden="true">&#128214;</span>
                            <span class="action-text">Sources</span>
                        </button>
                    ` : ''}
                </nav>

                <!-- Main Content -->
                <div class="entity-main-content">
                    <!-- Primary Information Grid -->
                    ${this.renderPrimaryInfoGrid(entity, entityType)}

                    <!-- Full Description -->
                    ${entity.fullDescription || entity.description ? `
                        <section class="entity-section entity-section-description" ${this.getAnimationStyle()}>
                            <h2 class="section-title">
                                <span class="section-icon" aria-hidden="true">&#128220;</span>
                                Overview
                            </h2>
                            <div class="entity-description prose">
                                ${this.renderMarkdown(entity.fullDescription || entity.description)}
                            </div>
                        </section>
                    ` : ''}

                    <!-- Type-Specific Sections -->
                    ${this.renderTypeSpecificSections(entity, entityType)}

                    <!-- Linguistic Information -->
                    ${entity.linguistic ? this.renderLinguisticInfo(entity.linguistic, entity) : ''}

                    <!-- Geographical Information -->
                    ${entity.geographical ? this.renderGeographicalInfo(entity.geographical) : ''}

                    <!-- Temporal Information -->
                    ${entity.temporal ? this.renderTemporalInfo(entity.temporal) : ''}

                    <!-- Cultural Context -->
                    ${entity.cultural || entity.culturalContext ? this.renderCulturalContext(entity.cultural || entity.culturalContext) : ''}

                    <!-- Metaphysical Properties -->
                    ${entity.metaphysicalProperties ? this.renderMetaphysicalProperties(entity.metaphysicalProperties) : ''}

                    <!-- Archetypes -->
                    ${entity.archetypes && entity.archetypes.length > 0 ? this.renderArchetypes(entity.archetypes) : ''}

                    <!-- Corpus Queries / Primary Sources -->
                    ${entity.corpusQueries ? this.renderCorpusQueries(entity.corpusQueries) : ''}

                    <!-- Related Entities (from schema) -->
                    ${entity.relatedEntities ? this.renderSchemaRelatedEntities(entity.relatedEntities, mythology) : ''}

                    <!-- Related Entities (from displayOptions) -->
                    ${Object.keys(relatedEntities).length > 0 ? this.renderRelatedEntities(relatedEntities, mythology, entityType) : ''}

                    <!-- Sources & References -->
                    ${entity.sources ? this.renderSources(entity.sources) : ''}

                    <!-- Metadata Footer -->
                    ${this.renderMetadataFooter(entity)}
                </div>
            </article>
        `;
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb(mythology, entityType, entityName) {
        return `
            <nav class="entity-breadcrumb" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    <li class="breadcrumb-item">
                        <a href="#/" class="breadcrumb-link">Home</a>
                    </li>
                    <li class="breadcrumb-separator" aria-hidden="true">&#8250;</li>
                    <li class="breadcrumb-item">
                        <a href="#/mythology/${mythology}" class="breadcrumb-link">${this.capitalize(mythology)}</a>
                    </li>
                    <li class="breadcrumb-separator" aria-hidden="true">&#8250;</li>
                    <li class="breadcrumb-item">
                        <a href="#/mythology/${mythology}/${entityType}" class="breadcrumb-link">${this.getEntityTypeLabel(entityType)}s</a>
                    </li>
                    <li class="breadcrumb-separator" aria-hidden="true">&#8250;</li>
                    <li class="breadcrumb-item breadcrumb-current" aria-current="page">
                        ${this.escapeHtml(entityName)}
                    </li>
                </ol>
            </nav>
        `;
    }

    /**
     * Render primary info as a grid
     */
    renderPrimaryInfoGrid(entity, entityType) {
        const fields = this.getPrimaryFields(entityType);
        const items = fields
            .map(field => {
                const value = this.getNestedValue(entity, field.path);
                if (!value) return null;
                return { ...field, value };
            })
            .filter(Boolean);

        if (items.length === 0) return '';

        return `
            <section class="entity-section entity-section-attributes" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#10024;</span>
                    Key Attributes
                </h2>
                <div class="entity-attributes-grid" role="list">
                    ${items.map(item => `
                        <div class="entity-attribute-card" role="listitem" ${this.getAnimationStyle()}>
                            <div class="attribute-icon" aria-hidden="true">${item.icon || '&#9679;'}</div>
                            <div class="attribute-content">
                                <dt class="attribute-label">${item.label}</dt>
                                <dd class="attribute-value">${this.formatAttributeValue(item.value)}</dd>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Format attribute value for display
     */
    formatAttributeValue(value) {
        if (Array.isArray(value)) {
            return value.map(v => `<span class="attribute-tag">${this.escapeHtml(v)}</span>`).join('');
        }
        return this.escapeHtml(String(value));
    }

    /**
     * Get animation style with incremented delay
     */
    getAnimationStyle() {
        const delay = this.animationDelay;
        this.animationDelay += 0.05;
        return `style="--animation-delay: ${delay}s"`;
    }

    /**
     * Render corpus queries section
     */
    renderCorpusQueries(corpusQueries) {
        if (!corpusQueries || corpusQueries.length === 0) return '';

        return `
            <section class="entity-section entity-section-corpus" id="corpus-section" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128214;</span>
                    Primary Sources
                </h2>
                <p class="section-description">
                    References from ancient texts and scholarly sources
                </p>
                <div class="corpus-queries-list">
                    ${corpusQueries.map((query, index) => `
                        <article class="corpus-query-card" ${this.getAnimationStyle()}>
                            <header class="corpus-query-header">
                                <span class="corpus-source-icon" aria-hidden="true">${this.getSourceIcon(query.source)}</span>
                                <div class="corpus-source-info">
                                    <h3 class="corpus-source-title">${this.escapeHtml(query.source || 'Unknown Source')}</h3>
                                    ${query.reference ? `<p class="corpus-reference">${this.escapeHtml(query.reference)}</p>` : ''}
                                </div>
                            </header>
                            ${query.text ? `
                                <blockquote class="corpus-query-text">
                                    <p>${this.escapeHtml(query.text)}</p>
                                </blockquote>
                            ` : ''}
                            ${query.context ? `
                                <p class="corpus-query-context">${this.escapeHtml(query.context)}</p>
                            ` : ''}
                            <footer class="corpus-query-footer">
                                ${query.date ? `<span class="corpus-date">${this.escapeHtml(query.date)}</span>` : ''}
                                ${query.author ? `<span class="corpus-author">by ${this.escapeHtml(query.author)}</span>` : ''}
                            </footer>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Get source icon based on source type
     */
    getSourceIcon(source) {
        if (!source) return '&#128220;';
        const s = source.toLowerCase();
        if (s.includes('iliad') || s.includes('odyssey')) return '&#9875;';
        if (s.includes('bible') || s.includes('testament')) return '&#10013;';
        if (s.includes('veda') || s.includes('upanishad')) return '&#128329;';
        if (s.includes('edda') || s.includes('norse')) return '&#9889;';
        if (s.includes('egypt')) return '&#9765;';
        if (s.includes('epic') || s.includes('saga')) return '&#9876;';
        return '&#128214;';
    }

    /**
     * Get language code for mythology
     */
    getLanguageCode(mythology) {
        const codes = {
            'greek': 'grc',
            'egyptian': 'egy',
            'norse': 'non',
            'hindu': 'sa',
            'celtic': 'cel',
            'mesopotamian': 'akk',
            'japanese': 'ja',
            'chinese': 'zh'
        };
        return codes[mythology] || 'en';
    }

    /**
     * Render metadata footer
     */
    renderMetadataFooter(entity) {
        const hasMetadata = entity.createdAt || entity.updatedAt || entity.createdBy;
        if (!hasMetadata) return '';

        return `
            <footer class="entity-metadata-footer">
                <div class="metadata-item">
                    <span class="metadata-label">Last updated:</span>
                    <time class="metadata-value" datetime="${entity.updatedAt || entity.createdAt}">
                        ${this.formatDate(entity.updatedAt || entity.createdAt)}
                    </time>
                </div>
                ${entity.version ? `
                    <div class="metadata-item">
                        <span class="metadata-label">Version:</span>
                        <span class="metadata-value">${entity.version}</span>
                    </div>
                ` : ''}
            </footer>
        `;
    }

    /**
     * Format date for display
     */
    formatDate(dateValue) {
        if (!dateValue) return 'Unknown';
        try {
            const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Unknown';
        }
    }

    /**
     * Render markdown-like text
     */
    renderMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .split('</p><p>')
            .map(p => `<p>${p}</p>`)
            .join('');
    }

    /**
     * Static helper for sharing
     */
    static shareEntity(name, id) {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: name,
                text: `Learn about ${name} in mythology`,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url).then(() => {
                EntityDetailViewer.showToast('Link copied to clipboard!');
            }).catch(() => {
                alert('Could not copy link. URL: ' + url);
            });
        }
    }

    /**
     * Static helper for bookmarking
     */
    static bookmarkEntity(id) {
        const bookmarks = JSON.parse(localStorage.getItem('entityBookmarks') || '[]');
        if (bookmarks.includes(id)) {
            EntityDetailViewer.showToast('Already bookmarked!');
        } else {
            bookmarks.push(id);
            localStorage.setItem('entityBookmarks', JSON.stringify(bookmarks));
            EntityDetailViewer.showToast('Bookmarked!');
        }
    }

    /**
     * Static helper to scroll to section
     */
    static scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Show toast notification
     */
    static showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'entity-toast';
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /**
     * Render primary information section
     */
    renderPrimaryInfo(entity, entityType) {
        const fields = this.getPrimaryFields(entityType);
        const hasFields = fields.some(field => this.getNestedValue(entity, field.path));

        if (!hasFields) return '';

        return `
            <div class="entity-section">
                <h2 class="section-title">Key Attributes</h2>
                <div class="entity-attributes-grid">
                    ${fields.map(field => this.renderAttribute(entity, field)).filter(Boolean).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual attribute
     */
    renderAttribute(entity, field) {
        const value = this.getNestedValue(entity, field.path);
        if (!value) return null;

        const displayValue = Array.isArray(value)
            ? value.map(v => `<span class="attribute-tag">${this.escapeHtml(v)}</span>`).join('')
            : this.escapeHtml(value);

        return `
            <div class="entity-attribute">
                <div class="attribute-label">${field.label}:</div>
                <div class="attribute-value">${displayValue}</div>
            </div>
        `;
    }

    /**
     * Render type-specific sections
     */
    renderTypeSpecificSections(entity, entityType) {
        let html = '';

        // Deity-specific
        if (entityType === 'deity') {
            if (entity.mythology_specific) {
                html += this.renderSection('Mythology-Specific Information', entity.mythology_specific);
            }
            if (entity.worship) {
                html += this.renderSection('Worship & Rituals', entity.worship);
            }
        }

        // Hero-specific
        if (entityType === 'hero') {
            if (entity.feats) {
                html += this.renderListSection('Legendary Feats', entity.feats);
            }
            if (entity.weapons) {
                html += this.renderListSection('Weapons & Equipment', entity.weapons);
            }
        }

        // Creature-specific
        if (entityType === 'creature') {
            if (entity.abilities) {
                html += this.renderListSection('Abilities & Powers', entity.abilities);
            }
            if (entity.weaknesses) {
                html += this.renderListSection('Weaknesses', entity.weaknesses);
            }
        }

        return html;
    }

    /**
     * Render linguistic information (enhanced)
     */
    renderLinguisticInfo(linguistic, entity = {}) {
        if (!linguistic || Object.keys(linguistic).length === 0) return '';

        // Also check for alternate names from entity root
        const alternateNames = linguistic.alternativeNames || linguistic.alternateNames || entity.alternateNames || entity.alternativeNames || [];
        const epithets = entity.epithets || [];

        return `
            <section class="entity-section entity-section-linguistic" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127759;</span>
                    Linguistic Information
                </h2>
                <div class="linguistic-grid">
                    ${linguistic.originalName ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Original Name</dt>
                            <dd class="linguistic-value linguistic-original">${this.escapeHtml(linguistic.originalName)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.transliteration ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Transliteration</dt>
                            <dd class="linguistic-value">${this.escapeHtml(linguistic.transliteration)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.pronunciation ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Pronunciation</dt>
                            <dd class="linguistic-value linguistic-pronunciation">${this.escapeHtml(linguistic.pronunciation)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.languageCode || linguistic.originalScript ? `
                        <div class="linguistic-card">
                            <dt class="linguistic-label">Language/Script</dt>
                            <dd class="linguistic-value">${this.escapeHtml(linguistic.originalScript || linguistic.languageCode)}</dd>
                        </div>
                    ` : ''}
                    ${linguistic.etymology ? `
                        <div class="linguistic-card linguistic-card-wide">
                            <dt class="linguistic-label">Etymology</dt>
                            <dd class="linguistic-value">${this.formatEtymology(linguistic.etymology)}</dd>
                        </div>
                    ` : ''}
                    ${alternateNames.length > 0 ? `
                        <div class="linguistic-card linguistic-card-wide">
                            <dt class="linguistic-label">Alternate Names</dt>
                            <dd class="linguistic-value linguistic-alternates">
                                ${alternateNames.map(name => {
                                    if (typeof name === 'object') {
                                        return `<span class="alternate-name" title="${this.escapeHtml(name.context || name.language || '')}">${this.escapeHtml(name.name)}</span>`;
                                    }
                                    return `<span class="alternate-name">${this.escapeHtml(name)}</span>`;
                                }).join('')}
                            </dd>
                        </div>
                    ` : ''}
                    ${epithets.length > 0 ? `
                        <div class="linguistic-card linguistic-card-wide">
                            <dt class="linguistic-label">Epithets &amp; Titles</dt>
                            <dd class="linguistic-value linguistic-epithets">
                                ${epithets.map(epithet => `<span class="epithet-tag">${this.escapeHtml(epithet)}</span>`).join('')}
                            </dd>
                        </div>
                    ` : ''}
                    ${linguistic.cognates && linguistic.cognates.length > 0 ? `
                        <div class="linguistic-card linguistic-card-wide">
                            <dt class="linguistic-label">Related Names in Other Traditions</dt>
                            <dd class="linguistic-value linguistic-cognates">
                                ${linguistic.cognates.map(cog => `
                                    <span class="cognate-item">
                                        <span class="cognate-name">${this.escapeHtml(cog.name || cog.word)}</span>
                                        ${cog.tradition || cog.language ? `<span class="cognate-tradition">(${this.escapeHtml(cog.tradition || cog.language)})</span>` : ''}
                                        ${cog.meaning ? `<span class="cognate-meaning"> - ${this.escapeHtml(cog.meaning)}</span>` : ''}
                                    </span>
                                `).join('')}
                            </dd>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Render geographical information
     */
    renderGeographicalInfo(geographical) {
        if (!geographical || Object.keys(geographical).length === 0) return '';

        const hasData = geographical.originPoint || geographical.primaryLocation ||
                       geographical.region || geographical.culturalArea ||
                       geographical.modernCountries?.length > 0;

        if (!hasData) return '';

        const location = geographical.originPoint || geographical.primaryLocation;
        const coords = location?.coordinates;

        return `
            <section class="entity-section entity-section-geographical" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127757;</span>
                    Geographical Information
                </h2>
                <div class="geographical-grid">
                    ${location ? `
                        <div class="location-card" ${this.getAnimationStyle()}>
                            ${location.name ? `<h3 class="location-name">${this.escapeHtml(location.name)}</h3>` : ''}
                            ${location.description ? `<p class="location-description">${this.escapeHtml(location.description)}</p>` : ''}
                            ${location.type ? `<span class="location-type-badge">${this.escapeHtml(location.type)}</span>` : ''}
                            ${location.significance ? `<p class="location-significance"><em>${this.escapeHtml(location.significance)}</em></p>` : ''}
                            ${coords && (coords.latitude !== undefined || coords.lat !== undefined) ? `
                                <div class="coordinates-display">
                                    <span class="coord-icon" aria-hidden="true">&#128205;</span>
                                    <span class="coord-value">${this.formatCoordinates(coords)}</span>
                                    ${coords.accuracy ? `<span class="coord-accuracy">(${this.escapeHtml(coords.accuracy)})</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div class="geo-details-grid">
                        ${geographical.region ? `
                            <div class="geo-item">
                                <dt class="geo-label">Region</dt>
                                <dd class="geo-value">${this.escapeHtml(geographical.region)}</dd>
                            </div>
                        ` : ''}
                        ${geographical.culturalArea ? `
                            <div class="geo-item">
                                <dt class="geo-label">Cultural Area</dt>
                                <dd class="geo-value">${this.escapeHtml(geographical.culturalArea)}</dd>
                            </div>
                        ` : ''}
                        ${geographical.modernCountries?.length > 0 ? `
                            <div class="geo-item">
                                <dt class="geo-label">Modern Countries</dt>
                                <dd class="geo-value">${geographical.modernCountries.map(c => this.escapeHtml(c)).join(', ')}</dd>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Format coordinates for display
     */
    formatCoordinates(coords) {
        const lat = coords.latitude ?? coords.lat;
        const lng = coords.longitude ?? coords.lng;
        if (lat === undefined || lng === undefined) return 'Unknown';

        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        return `${Math.abs(lat).toFixed(2)}${latDir}, ${Math.abs(lng).toFixed(2)}${lngDir}`;
    }

    /**
     * Render temporal information
     */
    renderTemporalInfo(temporal) {
        if (!temporal || Object.keys(temporal).length === 0) return '';

        const hasData = temporal.mythologicalDate || temporal.historicalDate ||
                       temporal.firstAttestation || temporal.peakPopularity ||
                       temporal.culturalPeriod;

        if (!hasData) return '';

        return `
            <section class="entity-section entity-section-temporal" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128197;</span>
                    Temporal Information
                </h2>
                <div class="temporal-grid">
                    ${temporal.mythologicalDate ? `
                        <div class="temporal-card">
                            <dt class="temporal-label">Mythological Date</dt>
                            <dd class="temporal-value">${this.formatDateObject(temporal.mythologicalDate)}</dd>
                        </div>
                    ` : ''}
                    ${temporal.historicalDate ? `
                        <div class="temporal-card">
                            <dt class="temporal-label">Historical Date</dt>
                            <dd class="temporal-value">${this.formatDateObject(temporal.historicalDate)}</dd>
                        </div>
                    ` : ''}
                    ${temporal.culturalPeriod ? `
                        <div class="temporal-card">
                            <dt class="temporal-label">Cultural Period</dt>
                            <dd class="temporal-value">${this.escapeHtml(temporal.culturalPeriod)}</dd>
                        </div>
                    ` : ''}
                    ${temporal.firstAttestation ? `
                        <div class="temporal-card temporal-card-wide">
                            <dt class="temporal-label">First Attestation</dt>
                            <dd class="temporal-value">
                                ${temporal.firstAttestation.date?.display ? `<span class="attestation-date">${this.escapeHtml(temporal.firstAttestation.date.display)}</span>` : ''}
                                ${temporal.firstAttestation.source ? ` - <span class="attestation-source">${this.escapeHtml(temporal.firstAttestation.source)}</span>` : ''}
                                ${temporal.firstAttestation.type ? `<span class="attestation-type badge">${this.escapeHtml(temporal.firstAttestation.type)}</span>` : ''}
                                ${temporal.firstAttestation.confidence ? `<span class="attestation-confidence badge confidence-${temporal.firstAttestation.confidence}">${this.escapeHtml(temporal.firstAttestation.confidence)}</span>` : ''}
                            </dd>
                        </div>
                    ` : ''}
                    ${temporal.peakPopularity ? `
                        <div class="temporal-card temporal-card-wide">
                            <dt class="temporal-label">Peak Popularity</dt>
                            <dd class="temporal-value">
                                ${temporal.peakPopularity.display ? this.escapeHtml(temporal.peakPopularity.display) : ''}
                                ${temporal.peakPopularity.context ? `<p class="peak-context">${this.escapeHtml(temporal.peakPopularity.context)}</p>` : ''}
                            </dd>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Format date object for display
     */
    formatDateObject(dateObj) {
        if (!dateObj) return '';
        if (dateObj.display) return this.escapeHtml(dateObj.display);
        if (dateObj.start?.display && dateObj.end?.display) {
            return `${this.escapeHtml(dateObj.start.display)} - ${this.escapeHtml(dateObj.end.display)}`;
        }
        if (dateObj.year) {
            const yearStr = dateObj.year < 0 ? `${Math.abs(dateObj.year)} BCE` : `${dateObj.year} CE`;
            return dateObj.circa ? `c. ${yearStr}` : yearStr;
        }
        return '';
    }

    /**
     * Render metaphysical properties
     */
    renderMetaphysicalProperties(metaphysical) {
        if (!metaphysical || Object.keys(metaphysical).length === 0) return '';

        const hasData = metaphysical.primaryElement || metaphysical.element ||
                       metaphysical.domains?.length > 0 || metaphysical.energyType ||
                       metaphysical.chakra || metaphysical.planet || metaphysical.zodiac?.length > 0 ||
                       metaphysical.sefirot?.length > 0;

        if (!hasData) return '';

        return `
            <section class="entity-section entity-section-metaphysical" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#10024;</span>
                    Metaphysical Properties
                </h2>
                <div class="metaphysical-grid">
                    ${metaphysical.primaryElement || metaphysical.element ? `
                        <div class="metaphysical-card element-${(metaphysical.primaryElement || metaphysical.element).toLowerCase()}">
                            <dt class="metaphysical-label">Element</dt>
                            <dd class="metaphysical-value">${this.capitalize(metaphysical.primaryElement || metaphysical.element)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.energyType ? `
                        <div class="metaphysical-card">
                            <dt class="metaphysical-label">Energy Type</dt>
                            <dd class="metaphysical-value">${this.capitalize(metaphysical.energyType)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.chakra ? `
                        <div class="metaphysical-card chakra-${metaphysical.chakra}">
                            <dt class="metaphysical-label">Chakra</dt>
                            <dd class="metaphysical-value">${this.formatChakra(metaphysical.chakra)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.planet ? `
                        <div class="metaphysical-card">
                            <dt class="metaphysical-label">Planet</dt>
                            <dd class="metaphysical-value">${this.formatPlanet(metaphysical.planet)}</dd>
                        </div>
                    ` : ''}
                    ${metaphysical.domains?.length > 0 ? `
                        <div class="metaphysical-card metaphysical-card-wide">
                            <dt class="metaphysical-label">Domains</dt>
                            <dd class="metaphysical-value metaphysical-tags">
                                ${metaphysical.domains.map(domain => `<span class="domain-tag">${this.escapeHtml(domain)}</span>`).join('')}
                            </dd>
                        </div>
                    ` : ''}
                    ${metaphysical.zodiac?.length > 0 ? `
                        <div class="metaphysical-card">
                            <dt class="metaphysical-label">Zodiac</dt>
                            <dd class="metaphysical-value metaphysical-tags">
                                ${metaphysical.zodiac.map(sign => `<span class="zodiac-tag">${this.formatZodiac(sign)}</span>`).join('')}
                            </dd>
                        </div>
                    ` : ''}
                    ${metaphysical.sefirot?.length > 0 ? `
                        <div class="metaphysical-card">
                            <dt class="metaphysical-label">Sefirot</dt>
                            <dd class="metaphysical-value metaphysical-tags">
                                ${metaphysical.sefirot.map(sefirah => `<span class="sefirah-tag">${this.capitalize(sefirah)}</span>`).join('')}
                            </dd>
                        </div>
                    ` : ''}
                </div>
            </section>
        `;
    }

    /**
     * Format chakra name
     */
    formatChakra(chakra) {
        const chakraMap = {
            'root': 'Root (Muladhara)',
            'sacral': 'Sacral (Svadhisthana)',
            'solar-plexus': 'Solar Plexus (Manipura)',
            'heart': 'Heart (Anahata)',
            'throat': 'Throat (Vishuddha)',
            'third-eye': 'Third Eye (Ajna)',
            'crown': 'Crown (Sahasrara)'
        };
        return chakraMap[chakra] || this.capitalize(chakra);
    }

    /**
     * Format planet name with symbol
     */
    formatPlanet(planet) {
        const planetSymbols = {
            'sun': '&#9737; Sun',
            'moon': '&#9789; Moon',
            'mercury': '&#9791; Mercury',
            'venus': '&#9792; Venus',
            'mars': '&#9794; Mars',
            'jupiter': '&#9795; Jupiter',
            'saturn': '&#9796; Saturn',
            'uranus': '&#9797; Uranus',
            'neptune': '&#9798; Neptune',
            'pluto': '&#9799; Pluto'
        };
        return planetSymbols[planet?.toLowerCase()] || this.capitalize(planet);
    }

    /**
     * Format zodiac sign with symbol
     */
    formatZodiac(sign) {
        const zodiacSymbols = {
            'aries': '&#9800; Aries',
            'taurus': '&#9801; Taurus',
            'gemini': '&#9802; Gemini',
            'cancer': '&#9803; Cancer',
            'leo': '&#9804; Leo',
            'virgo': '&#9805; Virgo',
            'libra': '&#9806; Libra',
            'scorpio': '&#9807; Scorpio',
            'sagittarius': '&#9808; Sagittarius',
            'capricorn': '&#9809; Capricorn',
            'aquarius': '&#9810; Aquarius',
            'pisces': '&#9811; Pisces'
        };
        return zodiacSymbols[sign?.toLowerCase()] || this.capitalize(sign);
    }

    /**
     * Render archetypes section
     */
    renderArchetypes(archetypes) {
        if (!archetypes || archetypes.length === 0) return '';

        return `
            <section class="entity-section entity-section-archetypes" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127917;</span>
                    Mythological Archetypes
                </h2>
                <div class="archetypes-grid">
                    ${archetypes.map(archetype => {
                        const archetypeName = typeof archetype === 'string' ? archetype : archetype.name;
                        const archetypeId = typeof archetype === 'string' ? archetype : archetype.id;
                        return `
                            <a href="#/archetypes/${this.escapeHtml(archetypeId)}" class="archetype-card" ${this.getAnimationStyle()}>
                                <span class="archetype-icon" aria-hidden="true">&#127917;</span>
                                <span class="archetype-name">${this.capitalize(archetypeName.replace(/-/g, ' '))}</span>
                            </a>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Render related entities from schema (relatedEntities object)
     */
    renderSchemaRelatedEntities(relatedEntities, mythology) {
        if (!relatedEntities || Object.keys(relatedEntities).length === 0) return '';

        const categories = [
            { key: 'deities', label: 'Related Deities', icon: '&#9734;' },
            { key: 'heroes', label: 'Related Heroes', icon: '&#9876;' },
            { key: 'creatures', label: 'Related Creatures', icon: '&#128009;' },
            { key: 'places', label: 'Related Places', icon: '&#127968;' },
            { key: 'items', label: 'Related Items', icon: '&#9876;' },
            { key: 'concepts', label: 'Related Concepts', icon: '&#128161;' },
            { key: 'archetypes', label: 'Related Archetypes', icon: '&#127917;' }
        ];

        const hasAnyRelated = categories.some(cat => relatedEntities[cat.key]?.length > 0);
        if (!hasAnyRelated) return '';

        return `
            <section class="entity-section entity-section-schema-related" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128279;</span>
                    Connections
                </h2>
                <div class="schema-related-container">
                    ${categories.map(cat => {
                        const entities = relatedEntities[cat.key];
                        if (!entities || entities.length === 0) return '';

                        return `
                            <div class="schema-related-group" ${this.getAnimationStyle()}>
                                <h3 class="related-group-title">${cat.icon} ${cat.label}</h3>
                                <div class="schema-related-grid">
                                    ${entities.map(entity => `
                                        <a href="#/mythology/${entity.mythology || mythology}/${cat.key.replace(/s$/, '')}/${entity.id}"
                                           class="schema-related-card"
                                           title="${this.escapeHtml(entity.relationship || '')}">
                                            ${entity.icon ? `<span class="related-entity-icon">${entity.icon}</span>` : `<span class="related-entity-icon" aria-hidden="true">${cat.icon}</span>`}
                                            <div class="related-entity-info">
                                                <span class="related-entity-name">${this.escapeHtml(entity.name)}</span>
                                                ${entity.relationship ? `<span class="related-entity-relationship">${this.escapeHtml(entity.relationship)}</span>` : ''}
                                            </div>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Format etymology for display
     */
    formatEtymology(etymology) {
        if (typeof etymology === 'string') {
            return this.escapeHtml(etymology);
        }
        if (etymology.meaning) {
            let result = `<strong>Meaning:</strong> ${this.escapeHtml(etymology.meaning)}`;
            if (etymology.root) {
                result += `<br><strong>Root:</strong> ${this.escapeHtml(etymology.root)}`;
            }
            if (etymology.language) {
                result += `<br><strong>Language:</strong> ${this.escapeHtml(etymology.language)}`;
            }
            return result;
        }
        return '';
    }

    /**
     * Render cultural context (enhanced for new schema)
     */
    renderCulturalContext(context) {
        if (!context || Object.keys(context).length === 0) return '';

        const hasData = context.region || context.period || context.socialRole ||
                       context.worshipPractices?.length > 0 || context.worshipCenters?.length > 0 ||
                       context.festivals?.length > 0 || context.modernLegacy ||
                       context.demographicAppeal?.length > 0;

        if (!hasData) return '';

        return `
            <section class="entity-section entity-section-cultural" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#127963;</span>
                    Cultural Context
                </h2>
                <div class="cultural-content-container">
                    ${context.socialRole ? `
                        <div class="cultural-highlight">
                            <h3 class="cultural-subsection-title">Social Role</h3>
                            <p class="cultural-social-role">${this.escapeHtml(context.socialRole)}</p>
                        </div>
                    ` : ''}

                    <div class="cultural-grid">
                        ${context.region ? `
                            <div class="cultural-card">
                                <div class="cultural-icon" aria-hidden="true">&#127758;</div>
                                <div class="cultural-content">
                                    <dt class="cultural-label">Region</dt>
                                    <dd class="cultural-value">${this.escapeHtml(context.region)}</dd>
                                </div>
                            </div>
                        ` : ''}
                        ${context.period ? `
                            <div class="cultural-card">
                                <div class="cultural-icon" aria-hidden="true">&#128197;</div>
                                <div class="cultural-content">
                                    <dt class="cultural-label">Time Period</dt>
                                    <dd class="cultural-value">${this.escapeHtml(context.period)}</dd>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    ${context.worshipPractices?.length > 0 ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#128722; Worship Practices</h3>
                            <ul class="worship-practices-list">
                                ${context.worshipPractices.map(practice => `
                                    <li class="worship-practice-item">${this.escapeHtml(practice)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${context.worshipCenters?.length > 0 ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#127963; Worship Centers</h3>
                            <div class="cultural-tags">
                                ${context.worshipCenters.map(c => `<span class="cultural-tag">${this.escapeHtml(c)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${context.festivals?.length > 0 ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#127881; Festivals</h3>
                            <div class="festivals-grid">
                                ${context.festivals.map(f => {
                                    if (typeof f === 'string') {
                                        return `<div class="festival-card"><span class="festival-icon" aria-hidden="true">&#127881;</span> ${this.escapeHtml(f)}</div>`;
                                    }
                                    return `
                                        <div class="festival-card">
                                            <strong>${this.escapeHtml(f.name)}</strong>
                                            ${f.date ? `<span class="festival-date">${this.escapeHtml(f.date)}</span>` : ''}
                                            ${f.description ? `<p>${this.escapeHtml(f.description)}</p>` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${context.significance ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#128161; Cultural Significance</h3>
                            <p class="cultural-significance">${this.escapeHtml(context.significance)}</p>
                        </div>
                    ` : ''}

                    ${context.demographicAppeal?.length > 0 ? `
                        <div class="cultural-section">
                            <h3 class="cultural-subsection-title">&#128101; Demographic Appeal</h3>
                            <ul class="demographic-list">
                                ${context.demographicAppeal.map(demo => `
                                    <li class="demographic-item">${this.escapeHtml(demo)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${this.renderModernLegacy(context.modernLegacy)}
                </div>
            </section>
        `;
    }

    /**
     * Render modern legacy section
     */
    renderModernLegacy(legacy) {
        if (!legacy) return '';

        if (typeof legacy === 'string') {
            return `
                <div class="cultural-section">
                    <h3 class="cultural-subsection-title">&#127760; Modern Legacy</h3>
                    <p>${this.escapeHtml(legacy)}</p>
                </div>
            `;
        }

        const hasData = legacy.literature || legacy.philosophy || legacy.education ||
                       legacy.art || legacy.popCulture || legacy.references?.length > 0;
        if (!hasData) return '';

        return `
            <div class="cultural-section">
                <h3 class="cultural-subsection-title">&#127760; Modern Legacy</h3>
                <div class="legacy-grid">
                    ${legacy.literature ? `
                        <div class="legacy-item">
                            <dt class="legacy-label">Literature</dt>
                            <dd class="legacy-value">${this.escapeHtml(legacy.literature)}</dd>
                        </div>
                    ` : ''}
                    ${legacy.philosophy ? `
                        <div class="legacy-item">
                            <dt class="legacy-label">Philosophy</dt>
                            <dd class="legacy-value">${this.escapeHtml(legacy.philosophy)}</dd>
                        </div>
                    ` : ''}
                    ${legacy.education ? `
                        <div class="legacy-item">
                            <dt class="legacy-label">Education</dt>
                            <dd class="legacy-value">${this.escapeHtml(legacy.education)}</dd>
                        </div>
                    ` : ''}
                    ${legacy.art ? `
                        <div class="legacy-item">
                            <dt class="legacy-label">Art</dt>
                            <dd class="legacy-value">${this.escapeHtml(legacy.art)}</dd>
                        </div>
                    ` : ''}
                    ${legacy.popCulture ? `
                        <div class="legacy-item">
                            <dt class="legacy-label">Pop Culture</dt>
                            <dd class="legacy-value">${this.escapeHtml(legacy.popCulture)}</dd>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render related entities
     */
    renderRelatedEntities(relatedEntities, mythology, entityType) {
        return `
            <section class="entity-section entity-section-related" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128279;</span>
                    Related Entities
                </h2>
                <div class="related-entities-container">
                    ${Object.entries(relatedEntities).map(([type, data]) => `
                        <div class="related-entities-group" ${this.getAnimationStyle()}>
                            <h3 class="related-group-title">${data.label}</h3>
                            <div class="related-entities-grid" role="list">
                                ${data.entities.map(entity => `
                                    <a href="#/mythology/${mythology}/${type}/${entity.id}"
                                       class="related-entity-card"
                                       role="listitem"
                                       aria-label="View ${this.escapeHtml(entity.name || entity.title)}">
                                        <div class="related-entity-icon" aria-hidden="true">
                                            ${entity.icon || this.getDefaultIcon(type)}
                                        </div>
                                        <div class="related-entity-info">
                                            <span class="related-entity-name">${this.escapeHtml(entity.name || entity.title)}</span>
                                            ${entity.shortDescription ? `
                                                <span class="related-entity-desc">${this.truncate(entity.shortDescription, 60)}</span>
                                            ` : ''}
                                        </div>
                                        <span class="related-entity-arrow" aria-hidden="true">&#8594;</span>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIcon(type) {
        const icons = {
            deity: '&#9734;',
            hero: '&#9876;',
            creature: '&#128009;',
            place: '&#127968;',
            item: '&#9876;',
            concept: '&#128161;',
            ritual: '&#128722;',
            text: '&#128220;'
        };
        return icons[type] || '&#9679;';
    }

    /**
     * Truncate text
     */
    truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return this.escapeHtml(text || '');
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }

    /**
     * Render sources
     */
    renderSources(sources) {
        if (!sources || sources.length === 0) return '';

        return `
            <section class="entity-section entity-section-sources" ${this.getAnimationStyle()}>
                <h2 class="section-title">
                    <span class="section-icon" aria-hidden="true">&#128218;</span>
                    References & Sources
                </h2>
                <ol class="sources-list" role="list">
                    ${sources.map((source, index) => {
                        if (typeof source === 'string') {
                            return `
                                <li class="source-item" role="listitem">
                                    <span class="source-number">${index + 1}</span>
                                    <span class="source-text">${this.escapeHtml(source)}</span>
                                </li>
                            `;
                        }
                        return `
                            <li class="source-item source-item-detailed" role="listitem">
                                <span class="source-number">${index + 1}</span>
                                <div class="source-content">
                                    ${source.title ? `<cite class="source-title">${this.escapeHtml(source.title)}</cite>` : ''}
                                    ${source.author ? `<span class="source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                                    ${source.date || source.year ? `<span class="source-date">(${this.escapeHtml(source.date || source.year)})</span>` : ''}
                                    ${source.publisher ? `<span class="source-publisher">${this.escapeHtml(source.publisher)}</span>` : ''}
                                    ${source.url ? `<a href="${this.escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" class="source-link">View Source &#8599;</a>` : ''}
                                    ${source.citation ? `<p class="source-citation">${this.escapeHtml(source.citation)}</p>` : ''}
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ol>
            </section>
        `;
    }

    /**
     * Render generic section
     */
    renderSection(title, data) {
        if (!data || Object.keys(data).length === 0) return '';

        return `
            <div class="entity-section">
                <h2 class="section-title">${title}</h2>
                <div class="entity-attributes-grid">
                    ${Object.entries(data).map(([key, value]) => `
                        <div class="entity-attribute">
                            <div class="attribute-label">${this.capitalize(key)}:</div>
                            <div class="attribute-value">${this.escapeHtml(value)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render list section
     */
    renderListSection(title, items) {
        if (!items || items.length === 0) return '';

        return `
            <div class="entity-section">
                <h2 class="section-title">${title}</h2>
                <ul class="entity-list">
                    ${items.map(item => `
                        <li class="entity-list-item">${this.escapeHtml(item)}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Render not found
     */
    renderNotFound(entityId) {
        return `
            <div class="error-container">
                <div class="error-icon">🔍</div>
                <h2>Entity Not Found</h2>
                <p class="error-message">
                    The entity "${this.escapeHtml(entityId)}" could not be found.
                </p>
                <div class="error-actions">
                    <button class="btn-primary" onclick="window.history.back()">Go Back</button>
                    <a href="#/" class="btn-secondary">Browse Mythologies</a>
                </div>
            </div>
        `;
    }

    /**
     * Get primary fields for entity type
     */
    getPrimaryFields(entityType) {
        const fieldMap = {
            'deity': [
                { label: 'Domains', path: 'domains', icon: '&#127760;' },
                { label: 'Symbols', path: 'symbols', icon: '&#10024;' },
                { label: 'Element', path: 'element', icon: '&#128293;' },
                { label: 'Gender', path: 'gender', icon: '&#9892;' },
                { label: 'Sacred Animals', path: 'sacredAnimals', icon: '&#128038;' },
                { label: 'Sacred Plants', path: 'sacredPlants', icon: '&#127793;' }
            ],
            'hero': [
                { label: 'Title', path: 'title', icon: '&#128081;' },
                { label: 'Parentage', path: 'parentage', icon: '&#128106;' },
                { label: 'Birthplace', path: 'birthplace', icon: '&#127968;' },
                { label: 'Era', path: 'era', icon: '&#128197;' },
                { label: 'Legacy', path: 'legacy', icon: '&#127942;' },
                { label: 'Weapons', path: 'weapons', icon: '&#9876;' }
            ],
            'creature': [
                { label: 'Classification', path: 'classification', icon: '&#128195;' },
                { label: 'Habitat', path: 'habitat', icon: '&#127966;' },
                { label: 'Abilities', path: 'abilities', icon: '&#9889;' },
                { label: 'Weaknesses', path: 'weaknesses', icon: '&#128683;' },
                { label: 'Origin', path: 'origin', icon: '&#128218;' }
            ],
            'ritual': [
                { label: 'Type', path: 'ritualType', icon: '&#128722;' },
                { label: 'Purpose', path: 'purpose', icon: '&#127919;' },
                { label: 'Frequency', path: 'timing.frequency', icon: '&#128197;' },
                { label: 'Participants', path: 'participants', icon: '&#128101;' }
            ],
            'cosmology': [
                { label: 'Type', path: 'cosmologyType', icon: '&#127760;' },
                { label: 'Realms', path: 'structure.realms', icon: '&#127752;' },
                { label: 'Era', path: 'era', icon: '&#128197;' }
            ],
            'text': [
                { label: 'Author', path: 'author', icon: '&#9997;' },
                { label: 'Period', path: 'period', icon: '&#128197;' },
                { label: 'Language', path: 'language', icon: '&#127759;' },
                { label: 'Genre', path: 'genre', icon: '&#128218;' }
            ],
            'herb': [
                { label: 'Uses', path: 'uses', icon: '&#127807;' },
                { label: 'Properties', path: 'properties', icon: '&#9879;' },
                { label: 'Habitat', path: 'habitat', icon: '&#127966;' }
            ],
            'symbol': [
                { label: 'Meanings', path: 'meanings', icon: '&#128161;' },
                { label: 'Associated Deities', path: 'associatedDeities', icon: '&#9734;' }
            ]
        };

        return fieldMap[entityType] || [];
    }

    /**
     * Get entity type label
     */
    getEntityTypeLabel(entityType) {
        const labels = {
            'deity': 'Deity',
            'hero': 'Hero',
            'creature': 'Creature',
            'cosmology': 'Cosmology',
            'ritual': 'Ritual',
            'herb': 'Herb',
            'text': 'Text',
            'symbol': 'Symbol'
        };

        return labels[entityType] || this.capitalize(entityType);
    }

    /**
     * Get Firebase collection name from entity type
     * Maps singular entity types to their plural collection names
     *
     * @param {string} entityType - Singular entity type (deity, hero, creature, etc.)
     * @returns {string} Firebase collection name
     */
    getCollectionName(entityType) {
        // Comprehensive mapping of entity types to Firebase collections
        const typeMap = {
            // Core entity types
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',

            // Location and object types
            'place': 'places',
            'item': 'items',

            // Cultural and conceptual types
            'archetype': 'archetypes',
            'ritual': 'rituals',
            'text': 'texts',
            'symbol': 'symbols',
            'herb': 'herbs',

            // Special cases (already plural or no change needed)
            'cosmology': 'cosmology',
            'mythology': 'mythologies',
            'magic': 'magic',

            // Alternative naming conventions
            'god': 'deities',
            'goddess': 'deities',
            'monster': 'creatures',
            'beast': 'creatures',
            'artifact': 'items',
            'weapon': 'items',
            'location': 'places',
            'sacred-place': 'places',
            'sacred-text': 'texts',
            'sacred-item': 'items',
            'sacred-herb': 'herbs',
            'practice': 'rituals',
            'ceremony': 'rituals',
            'concept': 'archetypes'
        };

        // Normalize input: lowercase and remove hyphens for lookup
        const normalizedType = entityType.toLowerCase();

        // Check for exact match first
        if (typeMap[normalizedType]) {
            return typeMap[normalizedType];
        }

        // If not found, apply standard pluralization
        // Handle common pluralization rules
        if (normalizedType.endsWith('y')) {
            return normalizedType.slice(0, -1) + 'ies';
        }
        if (normalizedType.endsWith('s') || normalizedType.endsWith('x') ||
            normalizedType.endsWith('ch') || normalizedType.endsWith('sh')) {
            return normalizedType + 'es';
        }

        return normalizedType + 's';
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
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

// Export
window.EntityDetailViewer = EntityDetailViewer;
