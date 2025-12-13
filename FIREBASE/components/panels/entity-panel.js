/**
 * Entity Panel Component
 * Dynamically loads and displays entity information in a panel format
 * Can be embedded anywhere to show items, places, deities, etc.
 */

class EntityPanel {
    constructor(config) {
        this.entityId = config.entityId;
        this.entityType = config.entityType;
        this.displayMode = config.displayMode || 'full'; // 'full', 'compact', 'mini'
        this.containerId = config.containerId;
        this.mythology = config.mythology || null; // Filter by specific mythology
        this.data = null;
    }

    async load() {
        try {
            // Load entity data from JSON
            const response = await fetch(`/data/entities/${this.entityType}/${this.entityId}.json`);
            if (!response.ok) throw new Error(`Entity not found: ${this.entityId}`);

            this.data = await response.json();
            this.render();
        } catch (error) {
            console.error('Error loading entity:', error);
            this.renderError();
        }
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container not found: ${this.containerId}`);
            return;
        }

        switch (this.displayMode) {
            case 'mini':
                container.innerHTML = this.renderMini();
                break;
            case 'compact':
                container.innerHTML = this.renderCompact();
                break;
            case 'full':
            default:
                container.innerHTML = this.renderFull();
                break;
        }

        this.attachEventListeners();
    }

    renderMini() {
        return `
            <div class="entity-panel mini" data-entity-id="${this.entityId}" data-entity-type="${this.entityType}">
                <a href="${this.getEntityUrl()}" class="entity-mini-link">
                    <span class="entity-icon">${this.data.icon}</span>
                    <span class="entity-name">${this.data.name}</span>
                    ${this.renderMythologyBadges('mini')}
                </a>
            </div>
        `;
    }

    renderCompact() {
        const mythologyContext = this.getMythologyContext();

        return `
            <div class="entity-panel compact glass-card" data-entity-id="${this.entityId}" data-entity-type="${this.entityType}">
                <div class="entity-header">
                    <div class="entity-icon-large">${this.data.icon}</div>
                    <div class="entity-info">
                        <h3 class="entity-name">
                            <a href="${this.getEntityUrl()}">${this.data.name}</a>
                        </h3>
                        <p class="entity-short-desc">${this.data.shortDescription}</p>
                        ${this.renderMythologyBadges('compact')}
                    </div>
                </div>

                ${mythologyContext ? `
                    <div class="entity-mythology-context">
                        <h4>${mythologyContext.mythology} Tradition</h4>
                        <p>${mythologyContext.usage}</p>
                    </div>
                ` : ''}

                <div class="entity-actions">
                    <a href="${this.getEntityUrl()}" class="btn-primary">View Details</a>
                    <button class="btn-secondary expand-panel" data-entity-id="${this.entityId}">
                        Expand
                    </button>
                </div>
            </div>
        `;
    }

    renderFull() {
        return `
            <div class="entity-panel full glass-card" data-entity-id="${this.entityId}" data-entity-type="${this.entityType}">
                <!-- Hero Section -->
                <div class="entity-hero" style="background: linear-gradient(135deg, ${this.data.colors?.primary || '#667eea'}, ${this.data.colors?.secondary || '#764ba2'});">
                    <div class="entity-icon-hero">${this.data.icon}</div>
                    <h2>${this.data.name}</h2>
                    <p class="entity-subtitle">${this.data.shortDescription}</p>
                    ${this.renderMythologyBadges('full')}
                </div>

                <!-- Description -->
                <div class="entity-content">
                    <div class="entity-description">
                        ${this.renderMarkdown(this.data.fullDescription)}
                    </div>

                    <!-- Properties based on entity type -->
                    ${this.renderTypeSpecificContent()}

                    <!-- Metaphysical Properties -->
                    ${this.data.metaphysicalProperties ? this.renderMetaphysicalProperties() : ''}

                    <!-- Mythology Contexts -->
                    ${this.renderMythologyContexts()}

                    <!-- Related Entities -->
                    ${this.renderRelatedEntities()}

                    <!-- Sources -->
                    ${this.data.sources?.length ? this.renderSources() : ''}
                </div>

                <!-- Actions -->
                <div class="entity-footer">
                    <a href="${this.getEntityUrl()}" class="btn-primary">View Full Page</a>
                    <button class="btn-secondary corpus-search" data-term="${this.data.name}">
                        📜 Search Ancient Texts
                    </button>
                </div>
            </div>
        `;
    }

    renderTypeSpecificContent() {
        switch (this.entityType) {
            case 'item':
                return this.renderItemProperties();
            case 'place':
                return this.renderPlaceProperties();
            case 'deity':
                return this.renderDeityProperties();
            case 'concept':
                return this.renderConceptProperties();
            case 'archetype':
                return this.renderArchetypeProperties();
            case 'magic':
                return this.renderMagicProperties();
            default:
                return '';
        }
    }

    renderItemProperties() {
        if (!this.data.properties?.length && !this.data.uses?.length) return '';

        return `
            <div class="entity-section">
                <h3>Properties</h3>
                <div class="property-grid">
                    ${this.data.category ? `
                        <div class="property-card">
                            <div class="property-label">Category</div>
                            <div class="property-value">${this.data.category}</div>
                        </div>
                    ` : ''}

                    ${this.data.properties?.map(prop => `
                        <div class="property-card">
                            <div class="property-label">${prop.name}</div>
                            <div class="property-value">${prop.value}</div>
                        </div>
                    `).join('')}
                </div>

                ${this.data.uses?.length ? `
                    <div class="uses-section">
                        <h4>Uses</h4>
                        <div class="tag-list">
                            ${this.data.uses.map(use => `<span class="tag">${use}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderPlaceProperties() {
        if (!this.data.geography) return '';

        return `
            <div class="entity-section">
                <h3>Location Details</h3>
                <div class="property-grid">
                    ${this.data.geography.realm ? `
                        <div class="property-card">
                            <div class="property-label">Realm</div>
                            <div class="property-value">${this.data.geography.realm}</div>
                        </div>
                    ` : ''}

                    ${this.data.geography.accessibility ? `
                        <div class="property-card">
                            <div class="property-label">Accessibility</div>
                            <div class="property-value">${this.data.geography.accessibility}</div>
                        </div>
                    ` : ''}
                </div>

                ${this.data.inhabitants?.length ? `
                    <div class="inhabitants-section">
                        <h4>Inhabitants</h4>
                        <div class="entity-mini-grid">
                            ${this.data.inhabitants.map(entity => this.renderEntityMiniCard(entity)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderDeityProperties() {
        return `
            <div class="entity-section">
                <h3>Divine Attributes</h3>

                ${this.data.titles?.length ? `
                    <div class="attribute-block">
                        <h4>Titles</h4>
                        <p>${this.data.titles.join(', ')}</p>
                    </div>
                ` : ''}

                ${this.data.domains?.length ? `
                    <div class="attribute-block">
                        <h4>Domains</h4>
                        <p>${this.data.domains.join(', ')}</p>
                    </div>
                ` : ''}

                ${this.data.symbols?.length ? `
                    <div class="attribute-block">
                        <h4>Symbols</h4>
                        <p>${this.data.symbols.join(', ')}</p>
                    </div>
                ` : ''}

                ${this.data.family ? this.renderFamilyTree() : ''}
            </div>
        `;
    }

    renderConceptProperties() {
        return `
            <div class="entity-section">
                ${this.data.opposites?.length ? `
                    <h3>Opposing Concepts</h3>
                    <div class="entity-mini-grid">
                        ${this.data.opposites.map(entity => this.renderEntityMiniCard(entity)).join('')}
                    </div>
                ` : ''}

                ${this.data.manifestations?.length ? `
                    <h3>Manifestations Across Mythologies</h3>
                    ${this.data.manifestations.map(m => `
                        <div class="manifestation-card glass-card">
                            <h4>${m.mythology}</h4>
                            ${m.personification ? `
                                <p>Personified as: ${this.renderEntityMiniCard(m.personification)}</p>
                            ` : ''}
                            <p>${m.description}</p>
                        </div>
                    `).join('')}
                ` : ''}
            </div>
        `;
    }

    renderArchetypeProperties() {
        return `
            <div class="entity-section">
                ${this.data.category ? `
                    <div class="attribute-block">
                        <h4>Archetype Category</h4>
                        <p>${this.data.category}</p>
                    </div>
                ` : ''}

                ${this.data.universalPattern ? `
                    <div class="attribute-block">
                        <h4>Universal Pattern</h4>
                        <p>${this.data.universalPattern}</p>
                    </div>
                ` : ''}

                ${this.data.examples?.length ? `
                    <h3>Examples Across Mythologies</h3>
                    ${this.data.examples.map(ex => `
                        <div class="example-card glass-card">
                            <h4>${ex.mythology}</h4>
                            ${this.renderEntityMiniCard(ex.entity)}
                            <p>${ex.analysis}</p>
                        </div>
                    `).join('')}
                ` : ''}
            </div>
        `;
    }

    renderMagicProperties() {
        return `
            <div class="entity-section">
                ${this.data.method ? `
                    <div class="attribute-block">
                        <h4>Method</h4>
                        <p>${this.data.method}</p>
                    </div>
                ` : ''}

                ${this.data.requirements ? `
                    <h3>Requirements</h3>
                    ${this.data.requirements.items?.length ? `
                        <div class="requirement-block">
                            <h4>Required Items</h4>
                            <div class="entity-mini-grid">
                                ${this.data.requirements.items.map(item => this.renderEntityMiniCard(item)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${this.data.requirements.timing ? `
                        <div class="requirement-block">
                            <h4>Timing</h4>
                            <p>${this.data.requirements.timing}</p>
                        </div>
                    ` : ''}
                ` : ''}

                ${this.data.steps?.length ? `
                    <h3>Procedure</h3>
                    <ol class="magic-steps">
                        ${this.data.steps.map(step => `
                            <li>
                                <strong>${step.action}</strong>
                                <p>${step.description}</p>
                            </li>
                        `).join('')}
                    </ol>
                ` : ''}
            </div>
        `;
    }

    renderMetaphysicalProperties() {
        const props = this.data.metaphysicalProperties;
        const hasProperties = Object.keys(props).some(key => props[key]);

        if (!hasProperties) return '';

        return `
            <div class="entity-section metaphysical-section">
                <h3>Metaphysical Properties</h3>
                <div class="property-grid">
                    ${props.element ? `
                        <div class="property-card">
                            <div class="property-label">Element</div>
                            <div class="property-value">${props.element}</div>
                        </div>
                    ` : ''}
                    ${props.energyType ? `
                        <div class="property-card">
                            <div class="property-label">Energy Type</div>
                            <div class="property-value">${props.energyType}</div>
                        </div>
                    ` : ''}
                    ${props.chakra ? `
                        <div class="property-card">
                            <div class="property-label">Chakra</div>
                            <div class="property-value">${props.chakra}</div>
                        </div>
                    ` : ''}
                    ${props.planet ? `
                        <div class="property-card">
                            <div class="property-label">Planet</div>
                            <div class="property-value">${props.planet}</div>
                        </div>
                    ` : ''}
                    ${props.sefirot?.length ? `
                        <div class="property-card">
                            <div class="property-label">Sefirot</div>
                            <div class="property-value">${props.sefirot.join(', ')}</div>
                        </div>
                    ` : ''}
                    ${props.world ? `
                        <div class="property-card">
                            <div class="property-label">Kabbalistic World</div>
                            <div class="property-value">${props.world}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderMythologyBadges(size = 'normal') {
        if (!this.data.mythologies?.length) return '';

        const badgeClass = size === 'mini' ? 'myth-badge mini' :
                          size === 'compact' ? 'myth-badge compact' :
                          'myth-badge';

        return `
            <div class="mythology-badges">
                ${this.data.mythologies.map(myth => `
                    <span class="${badgeClass}" data-mythology="${myth}">${this.capitalize(myth)}</span>
                `).join('')}
            </div>
        `;
    }

    renderMythologyContexts() {
        if (!this.data.mythologyContexts?.length) return '';

        return `
            <div class="entity-section mythology-contexts">
                <h3>Uses Across Mythologies</h3>
                ${this.data.mythologyContexts.map(context => `
                    <div class="mythology-context-card glass-card" data-mythology="${context.mythology}">
                        <h4>
                            <span class="myth-badge">${this.capitalize(context.mythology)}</span>
                            ${this.capitalize(context.mythology)} Tradition
                        </h4>
                        <p>${context.usage}</p>

                        ${context.associatedDeities?.length ? `
                            <div class="associated-deities">
                                <h5>Associated Deities</h5>
                                <div class="entity-mini-grid">
                                    ${context.associatedDeities.map(deity => this.renderEntityMiniCard(deity)).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${context.rituals?.length ? `
                            <div class="rituals-list">
                                <h5>Related Rituals</h5>
                                <ul>
                                    ${context.rituals.map(ritual => `
                                        <li>
                                            ${ritual.url ? `<a href="${ritual.url}">${ritual.name}</a>` : ritual.name}
                                            - ${ritual.description}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${context.symbolism ? `
                            <div class="symbolism-block">
                                <h5>Symbolism</h5>
                                <p>${context.symbolism}</p>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderRelatedEntities() {
        if (!this.data.relatedEntities) return '';

        const related = this.data.relatedEntities;
        const hasRelated = Object.keys(related).some(key => related[key]?.length);

        if (!hasRelated) return '';

        return `
            <div class="entity-section related-entities">
                <h3>Related Entities</h3>

                ${Object.entries(related).map(([type, entities]) => {
                    if (!entities?.length) return '';
                    return `
                        <div class="related-category">
                            <h4>${this.capitalize(type)}</h4>
                            <div class="entity-mini-grid">
                                ${entities.map(entity => this.renderEntityMiniCard(entity)).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderEntityMiniCard(entity) {
        return `
            <a href="${entity.url || this.getEntityUrl(entity.id, entity.type)}"
               class="entity-mini-card"
               data-entity-id="${entity.id}"
               data-entity-type="${entity.type || 'unknown'}">
                ${entity.icon ? `<span class="entity-icon">${entity.icon}</span>` : ''}
                <span class="entity-name">${entity.name}</span>
                ${entity.mythology ? `<span class="entity-myth">${entity.mythology}</span>` : ''}
            </a>
        `;
    }

    renderFamilyTree() {
        const family = this.data.family;
        const hasFamily = Object.values(family).some(arr => arr?.length);

        if (!hasFamily) return '';

        return `
            <div class="family-tree">
                <h4>Family</h4>
                ${family.parents?.length ? `
                    <div class="family-group">
                        <h5>Parents</h5>
                        <div class="entity-mini-grid">
                            ${family.parents.map(e => this.renderEntityMiniCard(e)).join('')}
                        </div>
                    </div>
                ` : ''}
                ${family.consorts?.length ? `
                    <div class="family-group">
                        <h5>Consorts</h5>
                        <div class="entity-mini-grid">
                            ${family.consorts.map(e => this.renderEntityMiniCard(e)).join('')}
                        </div>
                    </div>
                ` : ''}
                ${family.children?.length ? `
                    <div class="family-group">
                        <h5>Children</h5>
                        <div class="entity-mini-grid">
                            ${family.children.map(e => this.renderEntityMiniCard(e)).join('')}
                        </div>
                    </div>
                ` : ''}
                ${family.siblings?.length ? `
                    <div class="family-group">
                        <h5>Siblings</h5>
                        <div class="entity-mini-grid">
                            ${family.siblings.map(e => this.renderEntityMiniCard(e)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderSources() {
        return `
            <div class="entity-section sources-section">
                <h3>Ancient Sources</h3>
                <ul class="sources-list">
                    ${this.data.sources.map(source => `
                        <li>
                            ${source.author ? `<strong>${source.author}</strong>, ` : ''}
                            <em>${source.text}</em>
                            ${source.passage ? `, ${source.passage}` : ''}
                            ${source.corpusUrl ? `
                                <a href="${source.corpusUrl}" class="corpus-link" title="View in ancient texts">
                                    📜 View
                                </a>
                            ` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    getMythologyContext() {
        if (!this.mythology || !this.data.mythologyContexts) return null;
        return this.data.mythologyContexts.find(c => c.mythology === this.mythology);
    }

    getEntityUrl(id = this.entityId, type = this.entityType) {
        // Generate URL based on entity type and primary mythology
        const primaryMyth = this.data?.primaryMythology || 'shared';
        return `/mythos/${primaryMyth}/${type}s/${id}.html`;
    }

    renderMarkdown(text) {
        if (!text) return '';
        // Basic markdown rendering (can be enhanced with a library)
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    renderError() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="entity-panel error">
                    <p>⚠️ Unable to load entity: ${this.entityId}</p>
                </div>
            `;
        }
    }

    attachEventListeners() {
        // Expand panel button
        const expandBtn = document.querySelector(`[data-entity-id="${this.entityId}"] .expand-panel`);
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.displayMode = 'full';
                this.render();
            });
        }

        // Corpus search button
        const corpusBtn = document.querySelector(`[data-entity-id="${this.entityId}"] .corpus-search`);
        if (corpusBtn) {
            corpusBtn.addEventListener('click', () => {
                const term = corpusBtn.dataset.term;
                window.location.href = `/corpus-search.html?term=${encodeURIComponent(term)}`;
            });
        }
    }
}

// Auto-initialize panels on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-entity-panel]').forEach(el => {
        const panel = new EntityPanel({
            entityId: el.dataset.entityId,
            entityType: el.dataset.entityType,
            displayMode: el.dataset.displayMode || 'full',
            containerId: el.id,
            mythology: el.dataset.mythology || null
        });
        panel.load();
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityPanel;
}
