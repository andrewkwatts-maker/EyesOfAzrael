/**
 * Creature Renderer Component
 *
 * Dynamically loads and renders creature/monster/being content from Firebase
 * Supports: physical description, abilities, habitat, myths, encounters
 *
 * Features:
 * - Polished card-based layout
 * - Animated section reveals
 * - Mobile-friendly responsive design
 * - Accessible markup with proper ARIA
 * - Visual hierarchy with icons
 *
 * Usage:
 * <div data-creature-content data-mythology="greek" data-entity="hydra" data-allow-edit="true"></div>
 */

class CreatureRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.cache = new Map();
        this.animationDelay = 0;
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

        // Image gallery
        if (creature.images && creature.images.length > 0) {
            html += this.renderImageGallery(creature.images);
        }

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
     * Render image gallery
     */
    renderImageGallery(images) {
        if (!images || images.length === 0) return '';

        const galleries = this.groupImagesByCategory(images);
        let html = `<section class="creature-gallery detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">🖼️</span>
                Gallery & Artwork
            </h2>`;

        for (const [category, categoryImages] of Object.entries(galleries)) {
            if (categoryImages.length > 0) {
                html += `<div class="gallery-category">`;
                if (category !== 'default') {
                    html += `<h3 class="gallery-category-title">${this.capitalize(category)}</h3>`;
                }
                html += `<div class="image-grid">`;
                categoryImages.forEach((img, idx) => {
                    html += `
                        <figure class="gallery-item" style="--animation-delay: ${0.05 * idx}s">
                            <img src="${this.escapeHtml(img.url)}"
                                 alt="${img.alt ? this.escapeHtml(img.alt) : 'Creature artwork'}"
                                 class="gallery-image"
                                 loading="lazy">
                            ${img.caption ? `<figcaption class="gallery-caption">${this.escapeHtml(img.caption)}</figcaption>` : ''}
                        </figure>
                    `;
                });
                html += `</div></div>`;
            }
        }

        html += '</section>';
        return html;
    }

    /**
     * Group images by category
     */
    groupImagesByCategory(images) {
        const groups = { default: [] };
        images.forEach(img => {
            const cat = img.category || 'default';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(img);
        });
        return groups;
    }

    /**
     * Get animation style
     */
    getAnimationStyle() {
        const delay = this.animationDelay;
        this.animationDelay += 0.05;
        return `style="--animation-delay: ${delay}s"`;
    }

    /**
     * Render header with title and description
     */
    renderHeader(creature) {
        const mythologyIcon = this.getMythologyIcon(creature.mythology);
        return `
            <header class="creature-header detail-header" ${this.getAnimationStyle()}>
                <div class="creature-icon-large" aria-hidden="true">
                    <span class="icon-float creature-icon-glow">${creature.icon || '&#128009;'}</span>
                </div>
                <div class="creature-header-content">
                    <h1 class="creature-title">${this.escapeHtml(creature.name)}</h1>
                    ${creature.subtitle ? `<p class="creature-subtitle">${this.escapeHtml(creature.subtitle)}</p>` : ''}
                    ${creature.shortDescription ? `<p class="creature-description">${this.escapeHtml(creature.shortDescription)}</p>` : ''}
                    <div class="creature-badges">
                        ${creature.creatureType ? `<span class="creature-type-badge">
                            <span class="badge-icon" aria-hidden="true">🔱</span>
                            ${this.escapeHtml(creature.creatureType)}
                        </span>` : ''}
                        ${creature.classification ? `<span class="creature-classification-badge">
                            <span class="badge-icon" aria-hidden="true">📊</span>
                            ${this.escapeHtml(creature.classification)}
                        </span>` : ''}
                        ${creature.mythology ? `<span class="mythology-badge mythology-origin" data-mythology="${this.escapeHtml(creature.mythology)}">
                            <span class="badge-icon" aria-hidden="true">${mythologyIcon}</span>
                            ${this.capitalize(creature.mythology)}
                        </span>` : ''}
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Get mythology-specific icon
     */
    getMythologyIcon(mythology) {
        const icons = {
            'greek': '⚡',
            'norse': '⚔️',
            'egyptian': '🏛️',
            'hindu': '🕉️',
            'celtic': '🔥',
            'chinese': '☯️',
            'japanese': '⛩️',
            'sumerian': '📜',
            'babylonian': '👑',
            'christian': '✝️',
            'islamic': '☪️',
            'persian': '🌙',
            'mayan': '🌞',
            'aztec': '🦅'
        };
        return icons[mythology?.toLowerCase()] || '🌍';
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
     * Render physical description
     */
    renderPhysicalDescription(description) {
        let html = `<section class="creature-physical detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128065;</span>
                Physical Description
            </h2>`;

        if (typeof description === 'string') {
            html += `<div class="section-prose"><p>${this.escapeHtml(description)}</p></div>`;
        } else if (typeof description === 'object') {
            html += '<div class="description-grid">';
            if (description.appearance) {
                html += `
                    <div class="description-card">
                        <h3 class="card-title">Appearance</h3>
                        <p class="card-content">${this.escapeHtml(description.appearance)}</p>
                    </div>`;
            }
            if (description.size) {
                html += `
                    <div class="description-card">
                        <h3 class="card-title">Size</h3>
                        <p class="card-content">${this.escapeHtml(description.size)}</p>
                    </div>`;
            }
            if (description.features && description.features.length > 0) {
                html += `
                    <div class="description-card description-card-wide">
                        <h3 class="card-title">Notable Features</h3>
                        <ul class="feature-list">
                            ${description.features.map(feature => `<li class="feature-item">${this.escapeHtml(feature)}</li>`).join('')}
                        </ul>
                    </div>`;
            }
            html += '</div>';
        }

        html += '</section>';
        return html;
    }

    /**
     * Render abilities and powers
     */
    renderAbilities(abilities) {
        let html = `<section class="creature-abilities detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">⚡</span>
                Abilities & Powers
            </h2>
            <div class="abilities-grid" role="list">`;

        abilities.forEach((ability, index) => {
            if (typeof ability === 'string') {
                html += `
                    <div class="ability-card ability-card-simple" role="listitem" style="--animation-delay: ${0.05 * index}s">
                        <div class="ability-icon ability-icon-glow" aria-hidden="true">✨</div>
                        <p class="ability-text">${this.escapeHtml(ability)}</p>
                    </div>`;
            } else if (ability.name) {
                const displayIcon = ability.icon || this.getDefaultAbilityIcon(ability.name);
                html += `
                    <div class="ability-card ability-card-detailed" role="listitem" style="--animation-delay: ${0.05 * index}s">
                        <div class="ability-icon-container">
                            <div class="ability-icon ability-icon-glow" aria-hidden="true">${displayIcon}</div>
                        </div>
                        <div class="ability-content">
                            <h3 class="ability-name">${this.escapeHtml(ability.name)}</h3>
                            ${ability.description ? `<p class="ability-description">${this.escapeHtml(ability.description)}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Get default ability icon based on name
     */
    getDefaultAbilityIcon(name) {
        const lower = name.toLowerCase();
        if (lower.includes('breath')) return '💨';
        if (lower.includes('fire') || lower.includes('flame')) return '🔥';
        if (lower.includes('claw') || lower.includes('claw')) return '🪓';
        if (lower.includes('poison') || lower.includes('venom')) return '☠️';
        if (lower.includes('flight') || lower.includes('fly')) return '🪶';
        if (lower.includes('strength')) return '💪';
        if (lower.includes('speed') || lower.includes('swift')) return '💨';
        if (lower.includes('regenerat') || lower.includes('heal')) return '❤️‍🩹';
        if (lower.includes('magic') || lower.includes('spell')) return '✨';
        if (lower.includes('invisible') || lower.includes('cloak')) return '👻';
        if (lower.includes('water')) return '💧';
        if (lower.includes('ice') || lower.includes('cold')) return '❄️';
        if (lower.includes('earth') || lower.includes('stone')) return '⛰️';
        if (lower.includes('darkness') || lower.includes('shadow')) return '🌑';
        if (lower.includes('light') || lower.includes('glow')) return '💫';
        return '⚡';
    }

    /**
     * Render habitat
     */
    renderHabitat(habitat) {
        let html = `<section class="creature-habitat detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#127966;</span>
                Habitat
            </h2>`;

        if (typeof habitat === 'string') {
            html += `<div class="section-prose"><p>${this.escapeHtml(habitat)}</p></div>`;
        } else if (typeof habitat === 'object') {
            html += '<div class="habitat-grid">';
            if (habitat.location) {
                html += `
                    <div class="habitat-item">
                        <span class="habitat-icon" aria-hidden="true">&#128205;</span>
                        <div class="habitat-content">
                            <span class="habitat-label">Location</span>
                            <span class="habitat-value">${this.escapeHtml(habitat.location)}</span>
                        </div>
                    </div>`;
            }
            if (habitat.environment) {
                html += `
                    <div class="habitat-item">
                        <span class="habitat-icon" aria-hidden="true">&#127795;</span>
                        <div class="habitat-content">
                            <span class="habitat-label">Environment</span>
                            <span class="habitat-value">${this.escapeHtml(habitat.environment)}</span>
                        </div>
                    </div>`;
            }
            if (habitat.territory) {
                html += `
                    <div class="habitat-item">
                        <span class="habitat-icon" aria-hidden="true">&#128506;</span>
                        <div class="habitat-content">
                            <span class="habitat-label">Territory</span>
                            <span class="habitat-value">${this.escapeHtml(habitat.territory)}</span>
                        </div>
                    </div>`;
            }
            html += '</div>';
        }

        html += '</section>';
        return html;
    }

    /**
     * Render origin story
     */
    renderOrigin(origin) {
        let html = `<section class="creature-origin detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128214;</span>
                Origin Story
            </h2>
            <div class="section-prose">`;
        html += this.renderContent(origin);
        html += '</div></section>';
        return html;
    }

    /**
     * Render famous encounters
     */
    renderEncounters(encounters) {
        let html = `<section class="creature-encounters detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">⚔️</span>
                Famous Encounters
            </h2>
            <div class="encounters-timeline encounters-timeline-enhanced">`;

        encounters.forEach((encounter, index) => {
            if (typeof encounter === 'string') {
                html += `
                    <div class="encounter-card encounter-card-simple" style="--animation-delay: ${0.1 * index}s">
                        <div class="encounter-marker encounter-marker-glow">${index + 1}</div>
                        <div class="encounter-content">
                            <p class="encounter-text">${this.escapeHtml(encounter)}</p>
                        </div>
                    </div>`;
            } else if (encounter.hero) {
                const outcomeClass = this.getOutcomeClass(encounter.outcome);
                html += `
                    <div class="encounter-card encounter-card-detailed" style="--animation-delay: ${0.1 * index}s">
                        <div class="encounter-marker encounter-marker-glow">${index + 1}</div>
                        <div class="encounter-content">
                            <h3 class="encounter-hero">
                                <span class="hero-icon" aria-hidden="true">⚔️</span>
                                ${this.escapeHtml(encounter.hero)}
                                ${encounter.title ? `<span class="encounter-title-divider">›</span> ${this.escapeHtml(encounter.title)}` : ''}
                            </h3>
                            ${encounter.description ? `<p class="encounter-description">${this.escapeHtml(encounter.description)}</p>` : ''}
                            ${encounter.outcome ? `
                                <div class="encounter-outcome encounter-outcome-${outcomeClass}">
                                    <span class="outcome-label">Outcome:</span>
                                    <span class="outcome-value">${this.escapeHtml(encounter.outcome)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Get outcome class for styling
     */
    getOutcomeClass(outcome) {
        if (!outcome) return 'neutral';
        const lower = outcome.toLowerCase();
        if (lower.includes('defeat') || lower.includes('slain') || lower.includes('death')) return 'defeat';
        if (lower.includes('victory') || lower.includes('triumph') || lower.includes('won')) return 'victory';
        if (lower.includes('draw') || lower.includes('tie') || lower.includes('stalemate')) return 'draw';
        return 'neutral';
    }

    /**
     * Render symbolism
     */
    renderSymbolism(symbolism) {
        let html = `<section class="creature-symbolism detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128302;</span>
                Symbolism & Meaning
            </h2>`;

        if (typeof symbolism === 'string') {
            html += `<div class="section-prose"><p>${this.escapeHtml(symbolism)}</p></div>`;
        } else if (typeof symbolism === 'object') {
            html += '<div class="symbolism-grid">';
            if (symbolism.represents && symbolism.represents.length > 0) {
                html += `
                    <div class="symbolism-card">
                        <h3 class="symbolism-card-title">Represents</h3>
                        <ul class="symbolism-list">
                            ${symbolism.represents.map(rep => `<li class="symbolism-item">${this.escapeHtml(rep)}</li>`).join('')}
                        </ul>
                    </div>`;
            }
            if (symbolism.culturalSignificance) {
                html += `
                    <div class="symbolism-card symbolism-card-wide">
                        <h3 class="symbolism-card-title">Cultural Significance</h3>
                        <p class="symbolism-text">${this.escapeHtml(symbolism.culturalSignificance)}</p>
                    </div>`;
            }
            html += '</div>';
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
        let html = `<section class="sources-section detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128218;</span>
                References & Sources
            </h2>
            <ol class="sources-list" role="list">`;

        sources.forEach((source, index) => {
            if (typeof source === 'string') {
                html += `
                    <li class="source-item" role="listitem">
                        <span class="source-number">${index + 1}</span>
                        <span class="source-text">${this.escapeHtml(source)}</span>
                    </li>`;
            } else if (source.title) {
                html += `
                    <li class="source-item source-item-detailed" role="listitem">
                        <span class="source-number">${index + 1}</span>
                        <div class="source-content">
                            <cite class="source-title">${this.escapeHtml(source.title)}</cite>
                            ${source.author ? `<span class="source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                            ${source.date ? `<span class="source-date">(${this.escapeHtml(source.date)})</span>` : ''}
                            ${source.url ? `<a href="${this.escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" class="source-link">View &#8599;</a>` : ''}
                        </div>
                    </li>`;
            }
        });

        html += '</ol></section>';
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
