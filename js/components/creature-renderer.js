/**
 * Creature Renderer Component
 *
 * Dynamically loads and renders creature/monster/being content from Firebase
 * Supports: physical description, abilities, habitat, myths, encounters
 *
 * Usage:
 * <div data-creature-content data-mythology="greek" data-entity="hydra" data-allow-edit="true"></div>
 */

class CreatureRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.cache = new Map();
    }

    /**
     * Initialize all creature content sections on the page
     */
    init() {
        const creatureSections = document.querySelectorAll('[data-creature-content]');
        creatureSections.forEach(section => {
            const mythology = section.dataset.mythology;
            const entityId = section.dataset.entity;
            const allowEdit = section.dataset.allowEdit === 'true';

            this.renderCreature(section, mythology, entityId, allowEdit);
        });
    }

    /**
     * Fetch creature data from Firestore
     */
    async fetchCreature(mythology, entityId) {
        const cacheKey = `${mythology}/${entityId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const docRef = this.db
                .collection('entities')
                .doc(mythology)
                .collection('creature')
                .doc(entityId);

            const doc = await docRef.get();

            if (!doc.exists) {
                console.warn(`Creature not found: ${mythology}/${entityId}`);
                return null;
            }

            const data = doc.data();
            this.cache.set(cacheKey, data);
            return data;

        } catch (error) {
            console.error('Error fetching creature:', error);
            return null;
        }
    }

    /**
     * Render creature content
     */
    async renderCreature(container, mythology, entityId, allowEdit = false) {
        container.innerHTML = '<div class="loading-spinner">Loading creature data...</div>';

        const creature = await this.fetchCreature(mythology, entityId);

        if (!creature) {
            container.innerHTML = '<div class="error-message">Creature data not found. Content will load from HTML.</div>';
            return;
        }

        // Make container position relative for edit icon
        container.style.position = 'relative';

        let html = '';

        // Add edit icon if allowed and user owns entity
        if (allowEdit && this.canUserEdit(creature)) {
            html += this.renderEditIcon(entityId, 'creatures');
        }

        // Header section
        html += this.renderHeader(creature);

        // Physical description
        if (creature.physicalDescription) {
            html += this.renderPhysicalDescription(creature.physicalDescription);
        }

        // Abilities and powers
        if (creature.abilities && creature.abilities.length > 0) {
            html += this.renderAbilities(creature.abilities);
        }

        // Habitat
        if (creature.habitat) {
            html += this.renderHabitat(creature.habitat);
        }

        // Origin story
        if (creature.origin) {
            html += this.renderOrigin(creature.origin);
        }

        // Famous encounters
        if (creature.encounters && creature.encounters.length > 0) {
            html += this.renderEncounters(creature.encounters);
        }

        // Symbolism
        if (creature.symbolism) {
            html += this.renderSymbolism(creature.symbolism);
        }

        // General content sections
        if (creature.sections && creature.sections.length > 0) {
            html += this.renderSections(creature.sections);
        }

        // Sources
        if (creature.sources && creature.sources.length > 0) {
            html += this.renderSources(creature.sources);
        }

        // Edit button (if allowed)
        if (allowEdit) {
            html += this.renderEditButton(mythology, entityId);
        }

        container.innerHTML = html;
    }

    /**
     * Render header with title and description
     */
    renderHeader(creature) {
        return `
            <div class="creature-header">
                <h1>${creature.icon || '🐉'} ${creature.name}</h1>
                ${creature.subtitle ? `<p class="subtitle">${creature.subtitle}</p>` : ''}
                ${creature.shortDescription ? `<p class="short-description">${creature.shortDescription}</p>` : ''}
                ${creature.creatureType ? `<span class="creature-type-badge">${creature.creatureType}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render physical description
     */
    renderPhysicalDescription(description) {
        let html = '<section class="creature-physical"><h2>👁️ Physical Description</h2>';

        if (typeof description === 'string') {
            html += `<p>${description}</p>`;
        } else if (typeof description === 'object') {
            if (description.appearance) {
                html += `<div class="description-card"><h3>Appearance</h3><p>${description.appearance}</p></div>`;
            }
            if (description.size) {
                html += `<div class="description-card"><h3>Size</h3><p>${description.size}</p></div>`;
            }
            if (description.features && description.features.length > 0) {
                html += '<div class="description-card"><h3>Notable Features</h3><ul>';
                description.features.forEach(feature => {
                    html += `<li>${feature}</li>`;
                });
                html += '</ul></div>';
            }
        }

        html += '</section>';
        return html;
    }

    /**
     * Render abilities and powers
     */
    renderAbilities(abilities) {
        let html = '<section class="creature-abilities"><h2>⚡ Abilities & Powers</h2>';
        html += '<div class="abilities-grid">';

        abilities.forEach(ability => {
            if (typeof ability === 'string') {
                html += `<div class="ability-card"><p>${ability}</p></div>`;
            } else if (ability.name) {
                html += `
                    <div class="ability-card">
                        <h3>${ability.name}</h3>
                        ${ability.description ? `<p>${ability.description}</p>` : ''}
                    </div>
                `;
            }
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Render habitat
     */
    renderHabitat(habitat) {
        let html = '<section class="creature-habitat"><h2>🏞️ Habitat</h2>';

        if (typeof habitat === 'string') {
            html += `<p>${habitat}</p>`;
        } else if (typeof habitat === 'object') {
            if (habitat.location) {
                html += `<p><strong>Location:</strong> ${habitat.location}</p>`;
            }
            if (habitat.environment) {
                html += `<p><strong>Environment:</strong> ${habitat.environment}</p>`;
            }
            if (habitat.territory) {
                html += `<p><strong>Territory:</strong> ${habitat.territory}</p>`;
            }
        }

        html += '</section>';
        return html;
    }

    /**
     * Render origin story
     */
    renderOrigin(origin) {
        let html = '<section class="creature-origin"><h2>📖 Origin</h2>';
        html += this.renderContent(origin);
        html += '</section>';
        return html;
    }

    /**
     * Render famous encounters
     */
    renderEncounters(encounters) {
        let html = '<section class="creature-encounters"><h2>⚔️ Famous Encounters</h2>';
        html += '<div class="encounters-list">';

        encounters.forEach((encounter, index) => {
            if (typeof encounter === 'string') {
                html += `<div class="encounter-card"><p>${encounter}</p></div>`;
            } else if (encounter.hero) {
                html += `
                    <div class="encounter-card">
                        <h3>${encounter.hero}${encounter.title ? ` - ${encounter.title}` : ''}</h3>
                        ${encounter.description ? `<p>${encounter.description}</p>` : ''}
                        ${encounter.outcome ? `<p class="outcome"><strong>Outcome:</strong> ${encounter.outcome}</p>` : ''}
                    </div>
                `;
            }
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Render symbolism
     */
    renderSymbolism(symbolism) {
        let html = '<section class="creature-symbolism"><h2>🔮 Symbolism</h2>';

        if (typeof symbolism === 'string') {
            html += `<p>${symbolism}</p>`;
        } else if (typeof symbolism === 'object') {
            if (symbolism.represents && symbolism.represents.length > 0) {
                html += '<div class="symbolism-card"><h3>Represents</h3><ul>';
                symbolism.represents.forEach(rep => {
                    html += `<li>${rep}</li>`;
                });
                html += '</ul></div>';
            }
            if (symbolism.culturalSignificance) {
                html += `<div class="symbolism-card"><h3>Cultural Significance</h3><p>${symbolism.culturalSignificance}</p></div>`;
            }
        }

        html += '</section>';
        return html;
    }

    /**
     * Render general content sections
     */
    renderSections(sections) {
        let html = '';

        sections.forEach(section => {
            html += `<section class="content-section">`;
            html += `<h2>${section.title}</h2>`;
            html += this.renderContent(section.content);
            html += `</section>`;
        });

        return html;
    }

    /**
     * Render content (handles arrays and strings)
     */
    renderContent(content) {
        if (Array.isArray(content)) {
            return content.map(p => `<p>${p}</p>`).join('');
        } else if (typeof content === 'string') {
            return `<p>${content}</p>`;
        }
        return '';
    }

    /**
     * Render sources section
     */
    renderSources(sources) {
        let html = '<section class="sources-section"><h2>📚 Sources</h2><ul class="sources-list">';

        sources.forEach(source => {
            if (typeof source === 'string') {
                html += `<li>${source}</li>`;
            } else if (source.title) {
                html += `<li><strong>${source.title}</strong>`;
                if (source.author) html += ` by ${source.author}`;
                if (source.date) html += ` (${source.date})`;
                html += `</li>`;
            }
        });

        html += '</ul></section>';
        return html;
    }

    /**
     * Render edit icon
     * @param {string} entityId - Entity ID
     * @param {string} collection - Collection name
     * @returns {string} Edit icon HTML
     */
    renderEditIcon(entityId, collection) {
        return `
            <button class="edit-icon-btn"
                    data-entity-id="${entityId}"
                    data-collection="${collection}"
                    aria-label="Edit creature"
                    title="Edit this creature">
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
        const user = this.auth.currentUser;
        if (!user) return false;

        // Check if user created this entity
        return entity.createdBy === user.uid;
    }

    /**
     * Render edit button (legacy - kept for compatibility)
     */
    renderEditButton(mythology, entityId) {
        return `
            <div class="edit-controls">
                <button class="btn-edit" onclick="window.location.href='/admin/edit-creature.html?mythology=${mythology}&id=${entityId}'">
                    ✏️ Edit Creature
                </button>
            </div>
        `;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const renderer = new CreatureRenderer();
        renderer.init();
    });
} else {
    const renderer = new CreatureRenderer();
    renderer.init();
}

// Export for use in other scripts
window.CreatureRenderer = CreatureRenderer;
