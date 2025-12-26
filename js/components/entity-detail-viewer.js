/**
 * Entity Detail Viewer Component
 * Displays comprehensive view of a single entity
 *
 * Features:
 * - Hero section with entity info
 * - All entity attributes organized by sections
 * - Related entities (using displayOptions)
 * - Edit button for authenticated users
 * - Share/bookmark functionality
 */

class EntityDetailViewer {
    constructor(options = {}) {
        this.db = options.db || (window.firebase && window.firebase.firestore());
        this.router = options.router;
    }

    /**
     * Render the entity detail view
     * @param {object} route - Route object from router
     * @returns {string} HTML string
     */
    async render(route) {
        try {
            const { mythology, entityType, entityId } = route;

            // Load entity data
            const entity = await this.loadEntity(mythology, entityType, entityId);

            if (!entity) {
                return this.renderNotFound(entityId);
            }

            // Load related entities
            const relatedEntities = await this.loadRelatedEntities(entity);

            // Generate HTML
            return this.generateHTML(entity, relatedEntities, mythology, entityType);

        } catch (error) {
            console.error('[EntityDetailViewer] Render error:', error);
            throw error;
        }
    }

    /**
     * Load entity from Firebase
     */
    async loadEntity(mythology, entityType, entityId) {
        if (!this.db) {
            throw new Error('Firebase Firestore not initialized');
        }

        const collection = this.getCollectionName(entityType);

        const doc = await this.db.collection(collection).doc(entityId).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        };
    }

    /**
     * Load related entities
     */
    async loadRelatedEntities(entity) {
        const related = {};

        // Check for relationships in displayOptions
        if (entity.displayOptions?.relatedEntities) {
            for (const relationship of entity.displayOptions.relatedEntities) {
                try {
                    const entities = await this.loadEntitiesByIds(
                        relationship.collection,
                        relationship.ids || []
                    );
                    related[relationship.type] = {
                        label: relationship.label || relationship.type,
                        entities: entities
                    };
                } catch (error) {
                    console.error(`[EntityDetailViewer] Error loading ${relationship.type}:`, error);
                }
            }
        }

        return related;
    }

    /**
     * Load multiple entities by IDs
     */
    async loadEntitiesByIds(collection, ids) {
        if (!ids || ids.length === 0) return [];

        const entities = [];
        for (const id of ids.slice(0, 10)) { // Limit to 10
            try {
                const doc = await this.db.collection(collection).doc(id).get();
                if (doc.exists) {
                    entities.push({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            } catch (error) {
                console.error(`[EntityDetailViewer] Error loading entity ${id}:`, error);
            }
        }

        return entities;
    }

    /**
     * Generate HTML for entity detail
     */
    generateHTML(entity, relatedEntities, mythology, entityType) {
        const colors = entity.colors || {};
        const primaryColor = colors.primary || '#667eea';
        const secondaryColor = colors.secondary || '#764ba2';

        return `
            <div class="entity-detail-viewer" data-entity-id="${entity.id}">
                <!-- Hero Section -->
                <div class="entity-hero" style="--primary-color: ${primaryColor}; --secondary-color: ${secondaryColor};">
                    <div class="entity-hero-background"></div>
                    <div class="entity-hero-content">
                        ${entity.icon ? `<div class="entity-icon-large">${entity.icon}</div>` : ''}
                        <h1 class="entity-title">${this.escapeHtml(entity.name || entity.title)}</h1>
                        ${entity.linguistic?.originalName ? `
                            <div class="entity-subtitle">${this.escapeHtml(entity.linguistic.originalName)}</div>
                        ` : ''}

                        <div class="entity-badges">
                            <span class="entity-type-badge">${this.getEntityTypeLabel(entityType)}</span>
                            <span class="mythology-badge">${this.capitalize(mythology)}</span>
                        </div>

                        ${entity.shortDescription ? `
                            <p class="entity-hero-description">${this.escapeHtml(entity.shortDescription)}</p>
                        ` : ''}

                        <!-- Actions -->
                        <div class="entity-actions">
                            <button class="btn-secondary" onclick="window.history.back()">
                                ← Back
                            </button>
                            <button class="btn-secondary" onclick="navigator.share ? navigator.share({title: '${this.escapeHtml(entity.name)}', url: window.location.href}) : alert('Sharing not supported')">
                                Share
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="entity-content">
                    <!-- Primary Information -->
                    ${this.renderPrimaryInfo(entity, entityType)}

                    <!-- Full Description -->
                    ${entity.fullDescription ? `
                        <div class="entity-section">
                            <h2 class="section-title">Overview</h2>
                            <div class="entity-description">
                                ${this.escapeHtml(entity.fullDescription)}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Type-Specific Sections -->
                    ${this.renderTypeSpecificSections(entity, entityType)}

                    <!-- Linguistic Information -->
                    ${entity.linguistic ? this.renderLinguisticInfo(entity.linguistic) : ''}

                    <!-- Cultural Context -->
                    ${entity.culturalContext ? this.renderCulturalContext(entity.culturalContext) : ''}

                    <!-- Related Entities -->
                    ${Object.keys(relatedEntities).length > 0 ? this.renderRelatedEntities(relatedEntities, mythology) : ''}

                    <!-- Sources -->
                    ${entity.sources ? this.renderSources(entity.sources) : ''}
                </div>
            </div>
        `;
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
     * Render linguistic information
     */
    renderLinguisticInfo(linguistic) {
        if (!linguistic || Object.keys(linguistic).length === 0) return '';

        return `
            <div class="entity-section">
                <h2 class="section-title">Linguistic Information</h2>
                <div class="entity-attributes-grid">
                    ${linguistic.originalName ? `
                        <div class="entity-attribute">
                            <div class="attribute-label">Original Name:</div>
                            <div class="attribute-value">${this.escapeHtml(linguistic.originalName)}</div>
                        </div>
                    ` : ''}
                    ${linguistic.etymology ? `
                        <div class="entity-attribute">
                            <div class="attribute-label">Etymology:</div>
                            <div class="attribute-value">${this.escapeHtml(linguistic.etymology)}</div>
                        </div>
                    ` : ''}
                    ${linguistic.pronunciation ? `
                        <div class="entity-attribute">
                            <div class="attribute-label">Pronunciation:</div>
                            <div class="attribute-value">${this.escapeHtml(linguistic.pronunciation)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render cultural context
     */
    renderCulturalContext(context) {
        if (!context || Object.keys(context).length === 0) return '';

        return `
            <div class="entity-section">
                <h2 class="section-title">Cultural Context</h2>
                <div class="entity-attributes-grid">
                    ${context.region ? `
                        <div class="entity-attribute">
                            <div class="attribute-label">Region:</div>
                            <div class="attribute-value">${this.escapeHtml(context.region)}</div>
                        </div>
                    ` : ''}
                    ${context.period ? `
                        <div class="entity-attribute">
                            <div class="attribute-label">Time Period:</div>
                            <div class="attribute-value">${this.escapeHtml(context.period)}</div>
                        </div>
                    ` : ''}
                    ${context.significance ? `
                        <div class="entity-attribute full-width">
                            <div class="attribute-label">Cultural Significance:</div>
                            <div class="attribute-value">${this.escapeHtml(context.significance)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render related entities
     */
    renderRelatedEntities(relatedEntities, mythology) {
        return `
            <div class="entity-section">
                <h2 class="section-title">Related Entities</h2>
                ${Object.entries(relatedEntities).map(([type, data]) => `
                    <div class="related-entities-group">
                        <h3 class="related-group-title">${data.label}</h3>
                        <div class="related-entities-list">
                            ${data.entities.map(entity => `
                                <a href="#/mythology/${mythology}/${type}/${entity.id}" class="related-entity-card">
                                    ${entity.icon ? `<span class="related-entity-icon">${entity.icon}</span>` : ''}
                                    <span class="related-entity-name">${this.escapeHtml(entity.name || entity.title)}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render sources
     */
    renderSources(sources) {
        if (!sources || sources.length === 0) return '';

        return `
            <div class="entity-section">
                <h2 class="section-title">Sources</h2>
                <ul class="sources-list">
                    ${sources.map(source => `
                        <li class="source-item">${this.escapeHtml(source)}</li>
                    `).join('')}
                </ul>
            </div>
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
                { label: 'Domains', path: 'domains' },
                { label: 'Symbols', path: 'symbols' },
                { label: 'Element', path: 'element' },
                { label: 'Gender', path: 'gender' }
            ],
            'hero': [
                { label: 'Parentage', path: 'parentage' },
                { label: 'Legacy', path: 'legacy' },
                { label: 'Era', path: 'era' }
            ],
            'creature': [
                { label: 'Type', path: 'type' },
                { label: 'Habitat', path: 'habitat' },
                { label: 'Abilities', path: 'abilities' }
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
     * Get collection name
     */
    getCollectionName(entityType) {
        const typeMap = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'cosmology': 'cosmology',
            'ritual': 'rituals',
            'herb': 'herbs',
            'text': 'texts',
            'symbol': 'symbols'
        };

        return typeMap[entityType] || entityType + 's';
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
