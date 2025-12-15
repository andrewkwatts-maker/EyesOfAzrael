/**
 * Firebase Entity Renderer
 *
 * Loads entity data from Firebase and renders it with mythology-specific styling,
 * preserving the rich visual identity of each tradition while enabling dynamic content.
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
        const html = `
            <!-- Deity Header -->
            <section class="deity-header">
                <div class="deity-icon">${entity.visual?.icon || entity.icon || this.getDefaultIcon('deity')}</div>
                <h2>${this.escapeHtml(entity.name || entity.title)}</h2>
                ${entity.subtitle ? `<p class="subtitle" style="font-size: 1.5rem; margin: 0.5rem 0;">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                ${entity.description ? `<p style="font-size: 1.1rem; margin-top: 1rem;">${this.escapeHtml(entity.description)}</p>` : ''}
            </section>

            <!-- Attributes & Domains -->
            <section>
                <h2 style="color: var(--mythos-primary);">Attributes & Domains</h2>
                <div class="attribute-grid">
                    ${this.renderDeityAttributes(entity)}
                </div>
            </section>

            <!-- Mythology & Stories -->
            ${entity.mythsAndLegends?.length ? `
            <section>
                <h2 style="color: var(--mythos-primary);">Mythology & Stories</h2>
                <div class="glass-card">
                    ${entity.mythsAndLegends.map(myth => `
                        <div class="subsection-card accent-border-left" style="margin-bottom: 1rem;">
                            <h4 style="color: var(--mythos-secondary);">${this.escapeHtml(myth.title || myth.name)}</h4>
                            <p>${this.escapeHtml(myth.description || myth.summary)}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            <!-- Family Relationships -->
            ${entity.family ? `
            <section>
                <h2 style="color: var(--mythos-primary);">Family & Relationships</h2>
                <div class="glass-card">
                    ${this.renderFamilyRelationships(entity.family)}
                </div>
            </section>
            ` : ''}

            <!-- Worship & Sacred Sites -->
            ${entity.worship || entity.cultCenters ? `
            <section>
                <h2 style="color: var(--mythos-primary);">Worship & Sacred Sites</h2>
                <div class="glass-card">
                    ${entity.worship ? `<p>${this.escapeHtml(entity.worship)}</p>` : ''}
                    ${entity.cultCenters?.length ? `
                        <h4 style="color: var(--mythos-secondary); margin-top: 1rem;">Sacred Sites</h4>
                        <ul>
                            ${entity.cultCenters.map(site => `<li>${this.escapeHtml(site)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
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
                <div class="deity-grid">
                    ${this.renderRelatedEntities(entity.relatedEntities)}
                </div>
            </section>
            ` : ''}

            <!-- Sources -->
            ${entity.sources?.length ? `
            <section>
                <h3 style="color: var(--mythos-secondary);">Sources & References</h3>
                <div class="glass-card">
                    <ul>
                        ${entity.sources.map(source => `<li>${this.escapeHtml(source)}</li>`).join('')}
                    </ul>
                </div>
            </section>
            ` : ''}
        `;

        container.innerHTML = html;
    }

    /**
     * Render deity-specific attributes
     */
    renderDeityAttributes(entity) {
        const attributes = [];

        // Titles
        if (entity.titles?.length || entity.epithets?.length) {
            attributes.push(`
                <div class="attribute-card">
                    <div class="attribute-label">Titles</div>
                    <div class="attribute-value">${(entity.titles || entity.epithets || []).join(', ')}</div>
                </div>
            `);
        }

        // Domains
        if (entity.domains?.length) {
            attributes.push(`
                <div class="attribute-card">
                    <div class="attribute-label">Domains</div>
                    <div class="attribute-value">${entity.domains.join(', ')}</div>
                </div>
            `);
        }

        // Symbols
        if (entity.symbols?.length) {
            attributes.push(`
                <div class="attribute-card">
                    <div class="attribute-label">Symbols</div>
                    <div class="attribute-value">${entity.symbols.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Animals
        if (entity.sacredAnimals?.length) {
            attributes.push(`
                <div class="attribute-card">
                    <div class="attribute-label">Sacred Animals</div>
                    <div class="attribute-value">${entity.sacredAnimals.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Plants
        if (entity.sacredPlants?.length) {
            attributes.push(`
                <div class="attribute-card">
                    <div class="attribute-label">Sacred Plants</div>
                    <div class="attribute-value">${entity.sacredPlants.join(', ')}</div>
                </div>
            `);
        }

        // Sacred Places
        if (entity.sacredPlaces?.length) {
            attributes.push(`
                <div class="attribute-card">
                    <div class="attribute-label">Sacred Places</div>
                    <div class="attribute-value">${entity.sacredPlaces.join(', ')}</div>
                </div>
            `);
        }

        return attributes.join('');
    }

    /**
     * Render family relationships
     */
    renderFamilyRelationships(family) {
        const sections = [];

        if (family.parents?.length) {
            sections.push(`
                <div class="subsection-card">
                    <div class="subsection-title">Parents</div>
                    <p>${family.parents.join(', ')}</p>
                </div>
            `);
        }

        if (family.consorts?.length || family.spouses?.length) {
            const consorts = family.consorts || family.spouses || [];
            sections.push(`
                <div class="subsection-card">
                    <div class="subsection-title">Consorts</div>
                    <p>${consorts.join(', ')}</p>
                </div>
            `);
        }

        if (family.children?.length || family.offspring?.length) {
            const children = family.children || family.offspring || [];
            sections.push(`
                <div class="subsection-card">
                    <div class="subsection-title">Children</div>
                    <p>${children.join(', ')}</p>
                </div>
            `);
        }

        if (family.siblings?.length) {
            sections.push(`
                <div class="subsection-card">
                    <div class="subsection-title">Siblings</div>
                    <p>${family.siblings.join(', ')}</p>
                </div>
            `);
        }

        return sections.join('');
    }

    /**
     * Render related entities
     */
    renderRelatedEntities(relatedEntities) {
        return relatedEntities.map(related => `
            <div class="glass-card" style="padding: 1rem;">
                <h4 style="color: var(--mythos-primary); margin: 0 0 0.5rem 0;">
                    ${this.escapeHtml(related.name)}
                </h4>
                <p style="font-size: 0.9rem; margin: 0;">
                    ${this.escapeHtml(related.relationship || related.type)}
                </p>
            </div>
        `).join('');
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
        this.renderGenericEntity(entity, container);
    }

    /**
     * Render generic entity (fallback)
     */
    renderGenericEntity(entity, container) {
        const html = `
            <section class="entity-header">
                <div class="entity-icon">${entity.visual?.icon || entity.icon || this.getDefaultIcon(entity.type)}</div>
                <h2>${this.escapeHtml(entity.name || entity.title)}</h2>
                ${entity.subtitle ? `<p class="subtitle">${this.escapeHtml(entity.subtitle)}</p>` : ''}
                ${entity.description ? `<p>${this.escapeHtml(entity.description)}</p>` : ''}
            </section>

            ${entity.content ? `
            <section class="glass-card">
                ${this.renderMarkdown(entity.content)}
            </section>
            ` : ''}
        `;

        container.innerHTML = html;
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