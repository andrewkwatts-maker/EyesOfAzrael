/**
 * Firebase Entity Renderer
 *
 * Loads entity data from Firebase and renders it with mythology-specific styling,
 * preserving the rich visual identity of each tradition while enabling dynamic content.
 *
 * NOTE: An enhanced version with modern UX features is available:
 * - See: entity-renderer-enhanced.js
 * - Features: Tabbed interface, timeline views, family trees, SEO metadata
 * - Documentation: ENTITY_DETAIL_ENHANCEMENTS.md
 */

class FirebaseEntityRenderer {
    constructor() {
        this.db = null;
        this.currentEntity = null;
        this.mythology = null;
    }

    /**
     * Initialize Firebase connection
     */
    async init() {
        if (this.db) return;

        if (!firebase || !firebase.firestore) {
            throw new Error('Firebase not initialized. Include Firebase SDK before this script.');
        }

        this.db = firebase.firestore();
    }

    /**
     * Load entity from Firestore and render it
     * @param {string} type - Entity type (deity, hero, creature, etc.)
     * @param {string} id - Entity ID
     * @param {string} mythology - Mythology tradition
     * @param {HTMLElement} container - Container to render into
     */
    async loadAndRender(type, id, mythology, container) {
        await this.init();

        try {
            // Fetch entity from Firestore
            const entity = await this.fetchEntity(type, id);

            if (!entity) {
                this.renderError(container, `Entity not found: ${type}/${id}`);
                return;
            }

            // Store current state
            this.currentEntity = entity;
            this.mythology = mythology || entity.mythology || entity.mythologies?.[0];

            // Apply mythology styling to container
            this.applyMythologyStyles(container, this.mythology);

            // Render entity based on type
            switch (entity.type) {
                case 'deity':
                    this.renderDeity(entity, container);
                    break;
                case 'hero':
                    this.renderHero(entity, container);
                    break;
                case 'creature':
                    this.renderCreature(entity, container);
                    break;
                case 'item':
                    this.renderItem(entity, container);
                    break;
                case 'place':
                    this.renderPlace(entity, container);
                    break;
                case 'concept':
                    this.renderConcept(entity, container);
                    break;
                case 'magic':
                    this.renderMagicSystem(entity, container);
                    break;
                case 'theory':
                    this.renderTheory(entity, container);
                    break;
                default:
                    this.renderGenericEntity(entity, container);
            }

            // Update page metadata
            this.updatePageMetadata(entity);

        } catch (error) {
            console.error('Error loading entity:', error);
            this.renderError(container, `Failed to load entity: ${error.message}`);
        }
    }

    /**
     * Fetch entity from Firestore
     */
    async fetchEntity(type, id) {
        const collectionName = this.getCollectionName(type);
        const doc = await this.db.collection(collectionName).doc(id).get();

        if (!doc.exists) {
            return null;
        }

        return { id: doc.id, ...doc.data() };
    }

    /**
     * Get Firestore collection name for entity type
     */
    getCollectionName(type) {
        const map = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'item': 'items',
            'place': 'places',
            'concept': 'concepts',
            'magic': 'magic',
            'theory': 'user_theories',
            'mythology': 'mythologies'
        };
        return map[type] || type;
    }

    /**
     * Apply mythology-specific styling to container
     */
    applyMythologyStyles(container, mythology) {
        // Remove any existing mythology data attribute
        container.removeAttribute('data-mythology');

        // Apply new mythology
        if (mythology) {
            container.setAttribute('data-mythology', mythology.toLowerCase());
        }

        // Ensure mythology-colors.css is loaded
        if (!document.querySelector('link[href*="mythology-colors.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/themes/mythology-colors.css';
            document.head.appendChild(link);
        }
    }

    /**
     * Render deity entity
     */
    renderDeity(entity, container) {
        // Make container position relative for edit icon
        container.style.position = 'relative';

        const html = `
            ${this.renderEditIcon(entity)}

            <!-- Hero Section with Large Icon -->
            <section class="hero-section">
                <div class="hero-icon-display">${entity.visual?.icon || entity.icon || this.getDefaultIcon('deity')}</div>
                <h2>${this.escapeHtml(entity.name || entity.title)}</h2>
                ${entity.subtitle ? `<p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                ${entity.description ? `<p style="font-size: 1.1rem; margin-top: 1rem;">${this.escapeHtml(entity.description)}</p>` : ''}
            </section>

            <!-- Attributes & Domains -->
            <section>
                <h2 style="color: var(--color-primary);">
                    <a data-mythos="${this.mythology}" data-smart href="#attributes">Attributes</a> &amp; Domains
                </h2>
                <div class="attribute-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    ${this.renderDeityAttributes(entity)}
                </div>
            </section>

            <!-- Mythology & Stories -->
            ${entity.mythsAndLegends?.length ? `
            <section style="margin-top: 2rem;">
                <h2 style="color: var(--color-primary);">
                    <a data-mythos="${this.mythology}" data-smart href="#mythology">Mythology</a> &amp; Stories
                </h2>
                <p>${this.escapeHtml(entity.name || 'This entity')}'s mythology spans numerous tales and legends. These stories reveal the nature of divine power, wisdom, and the relationship between the divine and humanity.</p>
                <h3 style="color: var(--color-text-primary); margin-top: 1.5rem;">Key Myths:</h3>
                <ul style="margin: 1rem 0 0 2rem; line-height: 1.8;">
                    ${entity.mythsAndLegends.map(myth => `
                        <li>
                            <strong>${this.escapeHtml(myth.title || myth.name)}:</strong> ${this.escapeHtml(myth.description || myth.summary)}
                            ${myth.source ? `<div class="citation" style="margin-top: 0.5rem;"><em>Source: ${this.escapeHtml(myth.source)}</em></div>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </section>
            ` : ''}

            <!-- Family Relationships -->
            ${entity.family ? `
            <section style="margin-top: 2rem;">
                <h2 style="color: var(--color-primary);">
                    <a data-mythos="${this.mythology}" data-smart href="#relationships">Relationships</a>
                </h2>
                <h3 style="color: var(--color-text-primary);">Family</h3>
                <ul style="margin: 0.5rem 0 0 2rem;">
                    ${this.renderFamilyRelationships(entity.family)}
                </ul>
            </section>
            ` : ''}

            <!-- Worship & Sacred Sites -->
            ${entity.worship || entity.cultCenters ? `
            <section style="margin-top: 2rem;">
                <h2 style="color: var(--color-primary);">
                    <a data-mythos="${this.mythology}" data-smart href="#worship">Worship</a> &amp; Rituals
                </h2>
                <h3 style="color: var(--color-text-primary);">Sacred Sites</h3>
                ${entity.worship ? `<p>${this.escapeHtml(entity.worship)}</p>` : ''}
                ${entity.cultCenters?.length ? `
                    <ul style="margin: 0.5rem 0 0 2rem;">
                        ${entity.cultCenters.map(site => `<li>${this.escapeHtml(site)}</li>`).join('')}
                    </ul>
                ` : ''}
            </section>
            ` : ''}

            <!-- Content (Markdown) -->
            ${entity.content ? `
            <section>
                <div class="glass-card">
                    ${this.renderMarkdown(entity.content)}
                </div>
            </section>
            ` : ''}

            <!-- Related Entities -->
            ${entity.relatedEntities?.length ? `
            <section>
                <h2 style="color: var(--mythos-primary);">Related Entities</h2>
                ${this.renderRelatedEntities(entity.relatedEntities, 'relatedEntities', entity.displayOptions)}
            </section>
            ` : ''}

            <!-- Sacred Texts / Primary Sources -->
            ${entity.texts?.length || entity.sources?.length ? this.renderSacredTexts(entity) : ''}

            <!-- Corpus Search Queries Section -->
            <div id="corpus-queries-section-${entity.id || 'main'}" class="corpus-queries-wrapper"></div>

            <!-- Sources -->
            ${entity.sources?.length && !entity.texts?.length ? `
            <section>
                <div class="citation" style="margin-top: 1rem;">
                    <strong>Sources:</strong> ${entity.sources.map(source => this.escapeHtml(source)).join(', ')}
                </div>
            </section>
            ` : ''}
        `;

        container.innerHTML = html + this.renderUserNotesSection(entity);
        this.initializeUserNotes(entity);
        this.initializeCorpusSection(entity);
    }

    /**
     * Render deity-specific attributes
     */
    renderDeityAttributes(entity) {
        const attributes = [];

        // Titles
        if (entity.titles?.length || entity.epithets?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Titles</div>
                    <div class="attribute-value">${(entity.titles || entity.epithets || []).join(', ')}</div>
                </div>
            `);
        }

        // Domains
        if (entity.domains?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Domains</div>
                    <div class="attribute-value">${entity.domains.join(', ')}</div>
                </div>
            `);
        }

        // Symbols
        if (entity.symbols?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Symbols</div>
                    <div class="attribute-value">${entity.symbols.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Animals
        if (entity.sacredAnimals?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Sacred Animals</div>
                    <div class="attribute-value">${entity.sacredAnimals.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Plants
        if (entity.sacredPlants?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Sacred Plants</div>
                    <div class="attribute-value">${entity.sacredPlants.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Places
        if (entity.sacredPlaces?.length) {
            attributes.push(`
                <div class="subsection-card">
                    <div class="attribute-label">Sacred Places</div>
                    <div class="attribute-value">${entity.sacredPlaces.join(', ')}</div>
                </div>
            `);
        }

        return attributes.length > 0 ? attributes.join('') : '<p style="color: var(--color-text-secondary);">No attributes recorded yet.</p>';
    }

    /**
     * Render family relationships
     */
    renderFamilyRelationships(family) {
        const sections = [];

        if (family.parents?.length) {
            sections.push(`
                <li><strong>Parents:</strong> ${family.parents.join(', ')}</li>
            `);
        }

        if (family.consorts?.length || family.spouses?.length) {
            const consorts = family.consorts || family.spouses || [];
            sections.push(`
                <li><strong>Consort(s):</strong> ${consorts.join(', ')}</li>
            `);
        }

        if (family.children?.length || family.offspring?.length) {
            const children = family.children || family.offspring || [];
            sections.push(`
                <li><strong>Children:</strong> ${children.join(', ')}</li>
            `);
        }

        if (family.siblings?.length) {
            sections.push(`
                <li><strong>Siblings:</strong> ${family.siblings.join(', ')}</li>
            `);
        }

        return sections.join('');
    }

    /**
     * Render sacred texts section with collapsible verses (like mushussu.html)
     */
    renderSacredTexts(entity) {
        const texts = entity.texts || [];

        if (!texts.length && !entity.sources?.length) {
            return '';
        }

        return `
            <div class="codex-search-section">
                <div class="codex-search-header" onclick="toggleCodexSearch(this)">
                    <h3>📚 Primary Sources: ${this.escapeHtml(entity.name)}</h3>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="codex-search-content">
                    ${texts.map(text => `
                        <div class="search-result-item">
                            <div class="citation" onclick="toggleVerse(this)">
                                ${this.escapeHtml(text.source)}${text.section ? `:${this.escapeHtml(text.section)}` : ''}${text.lines ? `:Lines ${this.escapeHtml(text.lines)}` : ''}
                            </div>
                            <div class="verse-text">
                                ${this.escapeHtml(text.text || text.content || text.verse)}
                            </div>
                            ${text.reference ? `
                                <div class="book-reference">
                                    Source: ${this.escapeHtml(text.reference)}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            <script>
                function toggleCodexSearch(header) {
                    const section = header.parentElement;
                    const content = section.querySelector('.codex-search-content');
                    section.classList.toggle('expanded');
                    content.classList.toggle('show');
                }

                function toggleVerse(citation) {
                    const verseText = citation.nextElementSibling;
                    verseText.classList.toggle('show');
                }
            </script>
        `;
    }

    /**
     * Render related entities with display options support
     */
    renderRelatedEntities(relatedEntities, relationshipType = 'relatedEntities', displayOptions = null) {
        // Get display configuration for this relationship type
        const config = displayOptions?.[relationshipType] || this.getDefaultDisplayConfig();

        // Render based on display mode
        switch (config.mode) {
            case 'grid':
                return this.renderRelatedEntitiesGrid(relatedEntities, config);
            case 'list':
                return this.renderRelatedEntitiesList(relatedEntities, config);
            case 'table':
                return this.renderRelatedEntitiesTable(relatedEntities, config);
            case 'panel':
                return this.renderRelatedEntitiesPanel(relatedEntities, config);
            default:
                return this.renderRelatedEntitiesGrid(relatedEntities, config);
        }
    }

    /**
     * Render related entities as grid
     */
    renderRelatedEntitiesGrid(entities, config) {
        const columns = config.columns || 4;
        const showIcons = config.showIcons !== false;
        const cardStyle = config.cardStyle || 'compact';

        // Sort entities
        const sorted = this.sortEntities(entities, config.sort);

        return `
            <div class="entity-grid" style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 1rem;">
                ${sorted.map(entity => `
                    <div class="glass-card entity-card entity-card-${cardStyle}" style="padding: 1rem;">
                        ${showIcons && entity.icon ? `<div class="entity-icon" style="font-size: 1.5rem; text-align: center; margin-bottom: 0.5rem;">${entity.icon}</div>` : ''}
                        <h4 style="color: var(--mythos-primary); margin: 0 0 0.5rem 0; font-size: ${cardStyle === 'minimal' ? '0.9rem' : '1rem'};">
                            ${this.escapeHtml(entity.name)}
                        </h4>
                        ${cardStyle !== 'minimal' ? `
                            <p style="font-size: 0.85rem; margin: 0; color: var(--mythos-text-secondary);">
                                ${this.escapeHtml(entity.relationship || entity.description || entity.type || '')}
                            </p>
                        ` : ''}
                        ${cardStyle === 'detailed' && entity.mythology ? `
                            <small style="display: block; margin-top: 0.5rem; opacity: 0.7;">
                                ${this.escapeHtml(entity.mythology)}
                            </small>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render related entities as list
     */
    renderRelatedEntitiesList(entities, config) {
        const showIcons = config.showIcons !== false;
        const compact = config.compact || false;
        const categorize = config.categorize || 'none';

        // Sort entities
        let sorted = this.sortEntities(entities, config.sort);

        // Categorize if requested
        if (categorize !== 'none') {
            return this.renderCategorizedList(sorted, config, categorize);
        }

        return `
            <div class="entity-list" style="display: flex; flex-direction: column; gap: ${compact ? '0.5rem' : '1rem'};">
                ${sorted.map(entity => `
                    <div class="glass-card entity-list-item" style="padding: ${compact ? '0.75rem' : '1rem'}; display: flex; align-items: center; gap: 1rem;">
                        ${showIcons && entity.icon ? `<span class="entity-icon" style="font-size: 1.25rem;">${entity.icon}</span>` : ''}
                        <div style="flex: 1;">
                            <strong style="color: var(--mythos-primary);">${this.escapeHtml(entity.name)}</strong>
                            ${!compact && entity.relationship ? `
                                <span style="margin-left: 0.5rem; opacity: 0.8;">- ${this.escapeHtml(entity.relationship)}</span>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render categorized list
     */
    renderCategorizedList(entities, config, categorizeBy) {
        const categories = {};

        // Group entities by category
        entities.forEach(entity => {
            let category = 'Other';

            switch (categorizeBy) {
                case 'by_domain':
                    category = entity.domain || entity.type || 'Other';
                    break;
                case 'by_mythology':
                    category = entity.mythology || 'Other';
                    break;
                case 'by_importance':
                    category = entity.importance || 'Standard';
                    break;
                case 'alphabetical':
                    category = entity.name ? entity.name.charAt(0).toUpperCase() : 'Other';
                    break;
            }

            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(entity);
        });

        const showIcons = config.showIcons !== false;
        const compact = config.compact || false;

        return Object.keys(categories).sort().map(category => `
            <div class="entity-category" style="margin-bottom: 1.5rem;">
                <h4 style="color: var(--mythos-secondary); margin-bottom: 0.75rem; font-size: 1rem;">
                    ${this.escapeHtml(category)}
                </h4>
                <div class="entity-list" style="display: flex; flex-direction: column; gap: ${compact ? '0.5rem' : '0.75rem'};">
                    ${categories[category].map(entity => `
                        <div class="glass-card entity-list-item" style="padding: ${compact ? '0.5rem 0.75rem' : '0.75rem 1rem'}; display: flex; align-items: center; gap: 0.75rem;">
                            ${showIcons && entity.icon ? `<span style="font-size: 1rem;">${entity.icon}</span>` : ''}
                            <strong style="color: var(--mythos-primary); font-size: ${compact ? '0.9rem' : '1rem'};">
                                ${this.escapeHtml(entity.name)}
                            </strong>
                            ${!compact && entity.relationship ? `
                                <span style="margin-left: 0.5rem; opacity: 0.8; font-size: 0.85rem;">
                                    ${this.escapeHtml(entity.relationship)}
                                </span>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Render related entities as table
     */
    renderRelatedEntitiesTable(entities, config) {
        const columns = config.columns || ['name', 'description', 'mythology'];
        const sortable = config.sortable !== false;

        // Sort entities
        const sorted = this.sortEntities(entities, config.sort || 'name');

        return `
            <div class="glass-card" style="padding: 1rem; overflow-x: auto;">
                <table class="entity-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            ${columns.map(col => `
                                <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--mythos-border); color: var(--mythos-primary); font-weight: 600;">
                                    ${this.capitalize(col.replace('_', ' '))}
                                    ${sortable ? '<span style="opacity: 0.5; margin-left: 0.25rem;">⇅</span>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(entity => `
                            <tr style="border-bottom: 1px solid var(--mythos-border);">
                                ${columns.map(col => {
                                    let value = entity[col] || '-';
                                    if (col === 'name') {
                                        value = `<strong style="color: var(--mythos-primary);">${this.escapeHtml(entity.name)}</strong>`;
                                    } else if (Array.isArray(value)) {
                                        value = value.join(', ');
                                    }
                                    return `<td style="padding: 0.75rem;">${typeof value === 'string' && !col.includes('name') ? this.escapeHtml(value) : value}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render related entities as detailed panels
     */
    renderRelatedEntitiesPanel(entities, config) {
        const showAllDetails = config.showAllDetails !== false;
        const expandable = config.expandable || false;
        const layout = config.layout || 'stacked';

        // Sort entities
        const sorted = this.sortEntities(entities, config.sort || 'name');

        if (layout === 'accordion') {
            return this.renderAccordionPanels(sorted, showAllDetails);
        }

        return `
            <div class="entity-panels" style="display: flex; flex-direction: column; gap: 1rem;">
                ${sorted.map((entity, index) => `
                    <div class="glass-card entity-panel ${expandable ? 'expandable' : ''}"
                         style="padding: 1.5rem; ${expandable ? 'cursor: pointer;' : ''}"
                         ${expandable ? `data-panel-id="${index}"` : ''}>
                        <div class="panel-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: ${showAllDetails ? '1rem' : '0'};">
                            ${entity.icon ? `<span style="font-size: 1.5rem;">${entity.icon}</span>` : ''}
                            <h4 style="color: var(--mythos-primary); margin: 0; flex: 1;">
                                ${this.escapeHtml(entity.name)}
                            </h4>
                            ${expandable ? '<span class="expand-indicator">▼</span>' : ''}
                        </div>
                        ${showAllDetails ? `
                            <div class="panel-content" style="opacity: 0.9;">
                                ${entity.relationship ? `<p style="margin: 0 0 0.5rem 0;"><strong>Relationship:</strong> ${this.escapeHtml(entity.relationship)}</p>` : ''}
                                ${entity.description ? `<p style="margin: 0 0 0.5rem 0;">${this.escapeHtml(entity.description)}</p>` : ''}
                                ${entity.mythology ? `<p style="margin: 0; font-size: 0.9rem; opacity: 0.7;"><strong>Mythology:</strong> ${this.escapeHtml(entity.mythology)}</p>` : ''}
                                ${entity.domain ? `<p style="margin: 0; font-size: 0.9rem; opacity: 0.7;"><strong>Domain:</strong> ${this.escapeHtml(entity.domain)}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render accordion-style panels
     */
    renderAccordionPanels(entities, showAllDetails) {
        return `
            <div class="entity-accordion" style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${entities.map((entity, index) => `
                    <div class="glass-card accordion-item" style="overflow: hidden;">
                        <div class="accordion-header"
                             style="padding: 1rem; cursor: pointer; display: flex; align-items: center; gap: 1rem;"
                             onclick="this.parentElement.classList.toggle('expanded')">
                            ${entity.icon ? `<span style="font-size: 1.25rem;">${entity.icon}</span>` : ''}
                            <strong style="color: var(--mythos-primary); flex: 1;">${this.escapeHtml(entity.name)}</strong>
                            <span class="accordion-indicator" style="transition: transform 0.3s;">▼</span>
                        </div>
                        <div class="accordion-content" style="max-height: 0; overflow: hidden; transition: max-height 0.3s;">
                            <div style="padding: 0 1rem 1rem 1rem; opacity: 0.9;">
                                ${entity.relationship ? `<p style="margin: 0 0 0.5rem 0;"><strong>Relationship:</strong> ${this.escapeHtml(entity.relationship)}</p>` : ''}
                                ${entity.description ? `<p style="margin: 0 0 0.5rem 0;">${this.escapeHtml(entity.description)}</p>` : ''}
                                ${entity.mythology ? `<p style="margin: 0; font-size: 0.9rem; opacity: 0.7;">${this.escapeHtml(entity.mythology)}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <style>
                .accordion-item.expanded .accordion-content {
                    max-height: 500px;
                }
                .accordion-item.expanded .accordion-indicator {
                    transform: rotate(180deg);
                }
            </style>
        `;
    }

    /**
     * Sort entities based on sort configuration
     */
    sortEntities(entities, sortBy) {
        const sorted = [...entities];

        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'importance':
                sorted.sort((a, b) => (b.importance || 0) - (a.importance || 0));
                break;
            case 'date':
                sorted.sort((a, b) => (a.date || 0) - (b.date || 0));
                break;
            case 'custom':
                // Keep original order
                break;
            default:
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return sorted;
    }

    /**
     * Get default display configuration
     */
    getDefaultDisplayConfig() {
        return {
            mode: 'grid',
            columns: 4,
            sort: 'name',
            showIcons: true
        };
    }

    /**
     * Render hero entity (similar structure, hero-specific fields)
     */
    renderHero(entity, container) {
        // Similar to renderDeity but with hero-specific sections
        // (quests, accomplishments, weapons, etc.)
        this.renderGenericEntity(entity, container);
    }

    /**
     * Render creature entity
     */
    renderCreature(entity, container) {
        // Make container position relative for edit icon
        container.style.position = 'relative';

        const html = `
            ${this.renderEditIcon(entity)}

            <!-- Hero Section with Large Icon -->
            <section class="hero-section">
                <div class="hero-icon-display">${entity.visual?.icon || entity.icon || this.getDefaultIcon('creature')}</div>
                <h2>${this.escapeHtml(entity.name || entity.title)}</h2>
                ${entity.subtitle ? `<p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                ${entity.description ? `<p style="font-size: 1.1rem; margin-top: 1rem;">${this.escapeHtml(entity.description)}</p>` : ''}
            </section>

            <!-- Attributes -->
            ${entity.attributes || entity.characteristics ? `
            <section>
                <h2 style="color: var(--color-primary);">
                    <a data-mythos="${this.mythology}" data-smart href="#attributes">Attributes</a>
                </h2>
                <div class="attribute-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    ${this.renderCreatureAttributes(entity)}
                </div>
            </section>
            ` : ''}

            <!-- Content (Markdown) -->
            ${entity.content ? `
            <section style="margin-top: 2rem;">
                <div class="glass-card">
                    ${this.renderMarkdown(entity.content)}
                </div>
            </section>
            ` : ''}

            <!-- Sacred Texts / Primary Sources -->
            ${entity.texts?.length ? this.renderSacredTexts(entity) : ''}

            <!-- Related Entities -->
            ${entity.relatedEntities?.length ? `
            <section style="margin-top: 2rem;">
                <h2 style="color: var(--color-primary);">Related Entities</h2>
                ${this.renderRelatedEntities(entity.relatedEntities, 'relatedEntities', entity.displayOptions)}
            </section>
            ` : ''}
        `;

        container.innerHTML = html + this.renderUserNotesSection(entity);
        this.initializeUserNotes(entity);
    }

    /**
     * Render creature-specific attributes
     */
    renderCreatureAttributes(entity) {
        const attributes = [];
        const data = entity.attributes || entity.characteristics || {};

        // Handle both object and array formats
        if (Array.isArray(data)) {
            data.forEach(attr => {
                attributes.push(`
                    <div class="subsection-card">
                        <div class="attribute-label">${this.escapeHtml(attr.label || attr.name)}</div>
                        <div class="attribute-value">${this.escapeHtml(attr.value || attr.description)}</div>
                    </div>
                `);
            });
        } else {
            // Object format
            Object.entries(data).forEach(([key, value]) => {
                const displayValue = Array.isArray(value) ? value.join(', ') : value;
                attributes.push(`
                    <div class="subsection-card">
                        <div class="attribute-label">${this.capitalize(key.replace(/_/g, ' '))}</div>
                        <div class="attribute-value">${this.escapeHtml(displayValue)}</div>
                    </div>
                `);
            });
        }

        return attributes.length > 0 ? attributes.join('') : '<p style="color: var(--color-text-secondary);">No attributes recorded yet.</p>';
    }

    /**
     * Render generic entity (fallback)
     */
    renderGenericEntity(entity, container) {
        // Make container position relative for edit icon
        container.style.position = 'relative';

        const html = `
            ${this.renderEditIcon(entity)}

            <!-- Hero Section with Large Icon -->
            <section class="hero-section">
                <div class="hero-icon-display">${entity.visual?.icon || entity.icon || this.getDefaultIcon(entity.type)}</div>
                <h2>${this.escapeHtml(entity.name || entity.title)}</h2>
                ${entity.subtitle ? `<p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                ${entity.description ? `<p style="font-size: 1.1rem; margin-top: 1rem;">${this.escapeHtml(entity.description)}</p>` : ''}
            </section>

            ${entity.content ? `
            <section class="glass-card" style="margin-top: 2rem;">
                ${this.renderMarkdown(entity.content)}
            </section>
            ` : ''}
        `;

        container.innerHTML = html + this.renderUserNotesSection(entity);
        this.initializeUserNotes(entity);
    }

    /**
     * Render edit icon if user owns entity
     * @param {Object} entity - Entity data
     * @returns {string} Edit icon HTML or empty string
     */
    renderEditIcon(entity) {
        if (!this.canUserEdit(entity)) {
            return '';
        }

        const collection = this.getCollectionName(entity.type);

        return `
            <button class="edit-icon-btn"
                    data-entity-id="${entity.id}"
                    data-collection="${collection}"
                    aria-label="Edit ${entity.name}"
                    title="Edit this ${entity.type}">
                ✏️
            </button>
        `;
    }

    /**
     * Check if current user can edit this entity
     * @param {Object} entity - Entity data
     * @returns {boolean}
     */
    canUserEdit(entity) {
        if (!firebase || !firebase.auth) return false;

        const user = firebase.auth().currentUser;
        if (!user) return false;

        // Check if user created this entity
        return entity.createdBy === user.uid;
    }

    /**
     * Render markdown content
     */
    renderMarkdown(markdown) {
        // Basic markdown rendering (can be enhanced with a proper markdown library)
        return markdown
            .replace(/^### (.*$)/gim, '<h3 style="color: var(--mythos-secondary);">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 style="color: var(--mythos-primary);">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Get default icon for entity type
     */
    getDefaultIcon(type) {
        const icons = {
            'deity': '⚡',
            'hero': '🗡️',
            'creature': '🐉',
            'item': '⚔️',
            'place': '🏛️',
            'concept': '💭',
            'magic': '🔮',
            'theory': '🔬',
            'mythology': '📜'
        };
        return icons[type] || '✨';
    }

    /**
     * Update page metadata (title, description)
     */
    /**
     * Render user notes section
     * @param {Object} entity - Entity data
     * @returns {string} HTML for user notes section
     */
    renderUserNotesSection(entity) {
        return `
            <!-- User Notes Section -->
            <section class="user-notes-section" id="userNotesSection" data-asset-type="${entity.type}" data-asset-id="${entity.id}">
                <div class="notes-header">
                    <div class="notes-title-wrapper">
                        <h2 class="notes-title">
                            Community Notes
                            <span class="notes-count" id="notesCount">0</span>
                        </h2>
                        <p class="notes-subtitle">Share your insights and annotations</p>
                    </div>
                    <button class="btn-add-note" id="addNoteBtn" style="display: none;">
                        <svg class="icon-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Add Your Note
                    </button>
                </div>
                <div class="notes-controls">
                    <div class="sort-dropdown">
                        <label for="notesSortSelect">Sort by:</label>
                        <select id="notesSortSelect" class="sort-select">
                            <option value="votes">Most Helpful</option>
                            <option value="recent">Most Recent</option>
                            <option value="debated">Most Debated</option>
                        </select>
                    </div>
                </div>
                <div class="notes-list" id="notesList">
                    <div class="notes-empty" id="notesEmpty">
                        <div class="empty-icon">📝</div>
                        <h3>No notes yet</h3>
                        <p>Be the first to share your insights on this topic!</p>
                    </div>
                    <div class="notes-loading" id="notesLoading" style="display: none;">
                        <div class="spinner-container">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <p>Loading notes...</p>
                    </div>
                </div>
            </section>
            <div class="modal note-editor-modal" id="noteEditorModal">
                <div class="modal-overlay" onclick="window.userNotesComponentInstance?.closeNoteEditor()"></div>
                <div class="modal-content modal-large">
                    <button class="modal-close" onclick="window.userNotesComponentInstance?.closeNoteEditor()" aria-label="Close">×</button>
                    <h2 id="editorModalTitle">Add Your Note</h2>
                    <form class="note-editor-form" id="noteEditorForm">
                        <div class="editor-tabs">
                            <button type="button" class="editor-tab active" data-tab="write" id="writeTab">Write</button>
                            <button type="button" class="editor-tab" data-tab="preview" id="previewTab">Preview</button>
                        </div>
                        <div class="editor-content active" id="writeContent">
                            <textarea id="noteContentInput" class="note-textarea" placeholder="Share your insights, interpretations, or additional context... (Markdown supported: **bold**, *italic*, [links](url), - lists)" maxlength="2000" rows="10"></textarea>
                            <div class="editor-footer">
                                <div class="character-count">
                                    <span id="charCount">0</span> / 2000 characters
                                    <span class="char-minimum">(minimum 20)</span>
                                </div>
                                <div class="markdown-help">
                                    <span class="help-icon" title="Markdown supported">ℹ️</span>
                                    <span class="help-text">Markdown formatting supported</span>
                                </div>
                            </div>
                        </div>
                        <div class="editor-content" id="previewContent">
                            <div class="note-preview" id="notePreview">
                                <p class="preview-placeholder">Nothing to preview yet. Start writing!</p>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary" id="saveNoteBtn">Save Note</button>
                            <button type="button" class="btn btn-secondary" onclick="window.userNotesComponentInstance?.closeNoteEditor()">Cancel</button>
                        </div>
                        <div class="error-message" id="noteError" style="display: none;"></div>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Initialize user notes component after rendering
     * @param {Object} entity - Entity data
     */
    initializeUserNotes(entity) {
        if (!document.querySelector('link[href*="user-notes.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/user-notes.css';
            document.head.appendChild(link);
        }
        if (!document.querySelector('link[href*="spinner.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/spinner.css';
            document.head.appendChild(link);
        }
        setTimeout(() => {
            if (window.UserNotesComponent) {
                const notesComponent = new UserNotesComponent('userNotesSection');
                notesComponent.init(entity.type, entity.id);
                window.userNotesComponentInstance = notesComponent;
            } else {
                console.warn('UserNotesComponent not loaded. Include user-notes.js script.');
            }
        }, 100);
    }

    /**
     * Initialize corpus search section for entity
     * @param {Object} entity - Entity data
     */
    initializeCorpusSection(entity) {
        // Only show for entities that might have corpus queries
        const corpusEnabledTypes = ['deity', 'hero', 'creature', 'text', 'item', 'place', 'concept'];
        if (!corpusEnabledTypes.includes(entity.type) && !entity.corpusQueries?.length) {
            return;
        }

        const containerId = `corpus-queries-section-${entity.id || 'main'}`;
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn('Corpus queries container not found:', containerId);
            return;
        }

        // Use setTimeout to ensure DOM is ready
        setTimeout(async () => {
            if (typeof RelatedTextsSection !== 'undefined') {
                const textsSection = new RelatedTextsSection(container, entity, {
                    showUserQueries: true,
                    maxQueries: 10,
                    autoLoadFirst: false,
                    showCorpusExplorerLink: true
                });
                await textsSection.init();
            } else if (entity.corpusQueries?.length > 0) {
                // Fallback: render simple links to corpus explorer
                this.renderSimpleCorpusLinks(container, entity);
            }
        }, 150);
    }

    /**
     * Render simple corpus query links (fallback when RelatedTextsSection not loaded)
     */
    renderSimpleCorpusLinks(container, entity) {
        const queries = entity.corpusQueries || [];

        if (queries.length === 0) {
            // Just show link to corpus explorer
            container.innerHTML = `
                <section class="corpus-search-section glass-card" style="padding: 1.5rem; margin-top: 2rem;">
                    <h3 style="margin: 0 0 1rem; color: var(--color-primary);">
                        <span style="margin-right: 0.5rem;">📚</span>
                        Primary Source References
                    </h3>
                    <p style="opacity: 0.8; margin: 0 0 1rem;">
                        Search ancient texts for references to ${this.escapeHtml(entity.name)}.
                    </p>
                    <a href="/corpus-explorer.html?term=${encodeURIComponent(entity.name)}"
                       style="display: inline-block; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; background: var(--color-primary); color: white;">
                        🔍 Search Ancient Texts
                    </a>
                </section>
            `;
            return;
        }

        container.innerHTML = `
            <section class="corpus-search-section" style="margin-top: 2rem;">
                <h3 style="margin: 0 0 1rem; color: var(--color-primary);">
                    <span style="margin-right: 0.5rem;">📚</span>
                    Primary Source References
                </h3>
                <div class="corpus-queries-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${queries.map(query => `
                        <a href="/corpus-explorer.html?term=${encodeURIComponent(query.query?.term || entity.name)}&type=${query.queryType || 'github'}"
                           class="glass-card"
                           style="display: flex; align-items: center; gap: 1rem; padding: 1rem; text-decoration: none; border-radius: 8px;">
                            <span style="font-size: 1.25rem;">${query.queryType === 'github' ? '📜' : '🔍'}</span>
                            <div style="flex: 1;">
                                <strong style="color: var(--color-primary);">${this.escapeHtml(query.label)}</strong>
                                ${query.description ? `<p style="margin: 0.25rem 0 0; font-size: 0.85rem; opacity: 0.7;">${this.escapeHtml(query.description)}</p>` : ''}
                            </div>
                            <span style="opacity: 0.5;">→</span>
                        </a>
                    `).join('')}
                </div>
                <div style="margin-top: 1rem; text-align: center;">
                    <a href="/corpus-explorer.html?term=${encodeURIComponent(entity.name)}"
                       style="color: var(--color-primary); font-size: 0.9rem;">
                        Search for more references →
                    </a>
                </div>
            </section>
        `;
    }

    updatePageMetadata(entity) {
        // Update page title
        document.title = `${entity.name} - ${this.capitalize(this.mythology)} Mythology - Eyes of Azrael`;

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = entity.description || `Learn about ${entity.name}, ${entity.subtitle || entity.type} in ${this.capitalize(this.mythology)} mythology.`;
    }

    /**
     * Render error message
     */
    renderError(container, message) {
        container.innerHTML = `
            <div class="glass-card" style="border-color: #DC143C; background: rgba(220, 20, 60, 0.1);">
                <h2 style="color: #DC143C;">Error</h2>
                <p>${this.escapeHtml(message)}</p>
                <p><a href="/mythos/index.html">Return to Home</a></p>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Create global instance
window.FirebaseEntityRenderer = FirebaseEntityRenderer;

// Auto-load if URL parameters are present
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const id = params.get('id');
    const mythology = params.get('mythology');
    const autoLoad = params.get('firebase') === 'true';

    if (autoLoad && type && id) {
        const container = document.querySelector('main') || document.body;
        const renderer = new FirebaseEntityRenderer();
        await renderer.loadAndRender(type, id, mythology, container);
    }
});