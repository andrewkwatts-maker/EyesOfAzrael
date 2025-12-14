/**
 * Universal Entity Display Component
 * Renders any entity type (deity, hero, creature, item, place, concept, magic, theory, mythology)
 * Maintains visual theming from original Eyes of Azrael website
 *
 * Usage:
 *   const card = EntityDisplay.renderCard(entity);
 *   const detail = EntityDisplay.renderDetail(entity);
 */

class EntityDisplay {
    /**
     * Render entity as a card (grid view)
     * @param {Object} entity - Entity data from Firestore
     * @returns {HTMLElement} Card element
     */
    static renderCard(entity) {
        const card = document.createElement('div');
        card.className = 'entity-card';
        card.dataset.entityId = entity.id;
        card.dataset.entityType = entity.type;

        // Click handler to navigate to detail page
        card.addEventListener('click', () => {
            window.location.href = `/${entity.mythology}/${entity.type}s/${entity.id}.html`;
        });

        const icon = this.getEntityIcon(entity);
        const mythologyBadge = this.getMythologyBadge(entity);

        card.innerHTML = `
            <div class="entity-icon">${icon}</div>
            <h3 class="entity-name">${this.escapeHtml(entity.name || entity.title)}</h3>
            <p class="entity-subtitle">${this.escapeHtml(entity.subtitle || entity.shortDescription || '')}</p>
            ${mythologyBadge}
            <div class="entity-type-badge">${this.getTypeLabel(entity.type)}</div>
        `;

        return card;
    }

    /**
     * Render entity as detailed page
     * @param {Object} entity - Entity data from Firestore
     * @param {HTMLElement} container - Container to render into
     */
    static renderDetail(entity, container) {
        container.className = 'entity-detail-page';

        const sections = [];

        // Header
        sections.push(this.renderHeader(entity));

        // Main description
        sections.push(this.renderDescription(entity));

        // Extended content
        if (entity.content || entity.longDescription) {
            sections.push(this.renderContent(entity));
        }

        // Type-specific sections
        sections.push(this.renderTypeSpecificSections(entity));

        // Metadata sidebar
        sections.push(this.renderMetadata(entity));

        // Related entities
        if (entity.relatedEntities) {
            sections.push(this.renderRelatedEntities(entity.relatedEntities));
        }

        // Cross-references
        if (entity.crossReferences) {
            sections.push(this.renderCrossReferences(entity.crossReferences));
        }

        // Sources
        if (entity.sources && entity.sources.length > 0) {
            sections.push(this.renderSources(entity.sources));
        }

        // Edit button (if user is author)
        sections.push(this.renderEditButton(entity));

        container.innerHTML = sections.filter(s => s).join('');
    }

    /**
     * Render entity header
     */
    static renderHeader(entity) {
        const icon = this.getEntityIcon(entity);
        const mythologyTags = (entity.mythologies || [entity.mythology]).map(m =>
            `<span class="mythology-tag">${this.capitalize(m)}</span>`
        ).join('');

        return `
            <header class="entity-header">
                <div class="entity-header-icon">${icon}</div>
                <div class="entity-header-content">
                    <h1 class="entity-title">${this.escapeHtml(entity.name || entity.title)}</h1>
                    <p class="entity-subtitle">${this.escapeHtml(entity.subtitle || entity.shortDescription || '')}</p>
                    <div class="entity-tags">
                        <span class="type-tag">${this.getTypeLabel(entity.type)}</span>
                        ${mythologyTags}
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Render main description
     */
    static renderDescription(entity) {
        const description = entity.description || entity.shortDescription || entity.longDescription || '';
        if (!description) return '';

        return `
            <section class="entity-description">
                <div class="description-content">
                    ${this.renderMarkdown(description)}
                </div>
            </section>
        `;
    }

    /**
     * Render extended content
     */
    static renderContent(entity) {
        const content = entity.content || entity.longDescription || '';
        if (!content || content === entity.description) return '';

        return `
            <section class="entity-content">
                <h2>Detailed Information</h2>
                <div class="content-body">
                    ${this.renderMarkdown(content)}
                </div>
            </section>
        `;
    }

    /**
     * Render type-specific sections
     */
    static renderTypeSpecificSections(entity) {
        switch (entity.type) {
            case 'deity':
                return this.renderDeitySections(entity);
            case 'hero':
                return this.renderHeroSections(entity);
            case 'creature':
                return this.renderCreatureSections(entity);
            case 'item':
                return this.renderItemSections(entity);
            case 'place':
                return this.renderPlaceSections(entity);
            case 'concept':
                return this.renderConceptSections(entity);
            case 'magic':
                return this.renderMagicSections(entity);
            case 'theory':
                return this.renderTheorySections(entity);
            case 'mythology':
                return this.renderMythologySections(entity);
            default:
                return '';
        }
    }

    /**
     * Deity-specific sections
     */
    static renderDeitySections(deity) {
        let sections = [];

        // Domains
        if (deity.domains && deity.domains.length > 0) {
            sections.push(`
                <section class="deity-domains">
                    <h2>Domains</h2>
                    <div class="domain-tags">
                        ${deity.domains.map(d => `<span class="domain-tag">${this.capitalize(d)}</span>`).join('')}
                    </div>
                </section>
            `);
        }

        // Symbols
        if (deity.symbols && deity.symbols.length > 0) {
            sections.push(`
                <section class="deity-symbols">
                    <h2>Symbols</h2>
                    <div class="symbol-list">
                        ${deity.symbols.map(s => `<span class="symbol-item">⚡ ${this.capitalize(s)}</span>`).join('')}
                    </div>
                </section>
            `);
        }

        // Relationships
        if (deity.relationships) {
            sections.push(this.renderRelationships(deity.relationships));
        }

        // Sacred animals/plants
        if (deity.sacredAnimals || deity.sacredPlants) {
            sections.push(this.renderSacredItems(deity));
        }

        // Epithets
        if (deity.epithets && deity.epithets.length > 0) {
            sections.push(`
                <section class="deity-epithets">
                    <h2>Epithets & Titles</h2>
                    <ul class="epithets-list">
                        ${deity.epithets.map(e => `<li>${this.escapeHtml(e)}</li>`).join('')}
                    </ul>
                </section>
            `);
        }

        // Archetypes
        if (deity.archetypes && deity.archetypes.length > 0) {
            sections.push(this.renderArchetypes(deity.archetypes));
        }

        return sections.join('');
    }

    /**
     * Hero-specific sections
     */
    static renderHeroSections(hero) {
        let sections = [];

        // Parentage
        if (hero.parentage) {
            sections.push(`
                <section class="hero-parentage">
                    <h2>Parentage</h2>
                    <div class="parentage-info">
                        ${hero.parentage.father ? `<p><strong>Father:</strong> ${this.createEntityLink(hero.parentage.father, 'deity')}</p>` : ''}
                        ${hero.parentage.mother ? `<p><strong>Mother:</strong> ${this.createEntityLink(hero.parentage.mother, 'deity')}</p>` : ''}
                        ${hero.parentage.divine ? `<p class="divine-tag">⚡ Divine Heritage</p>` : ''}
                    </div>
                </section>
            `);
        }

        // Quests
        if (hero.quests && hero.quests.length > 0) {
            sections.push(`
                <section class="hero-quests">
                    <h2>Legendary Quests</h2>
                    <ul class="quests-list">
                        ${hero.quests.map(q => `<li>${this.escapeHtml(q)}</li>`).join('')}
                    </ul>
                </section>
            `);
        }

        // Weapons
        if (hero.weapons && hero.weapons.length > 0) {
            sections.push(`
                <section class="hero-weapons">
                    <h2>Weapons & Equipment</h2>
                    <div class="weapons-grid">
                        ${hero.weapons.map(w => this.createEntityCard({id: w, type: 'item'})).join('')}
                    </div>
                </section>
            `);
        }

        // Abilities
        if (hero.abilities && hero.abilities.length > 0) {
            sections.push(`
                <section class="hero-abilities">
                    <h2>Abilities</h2>
                    <div class="abilities-list">
                        ${hero.abilities.map(a => `<span class="ability-tag">✨ ${this.escapeHtml(a)}</span>`).join('')}
                    </div>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Creature-specific sections
     */
    static renderCreatureSections(creature) {
        let sections = [];

        // Physical description
        if (creature.physicalDescription) {
            sections.push(`
                <section class="creature-appearance">
                    <h2>Physical Appearance</h2>
                    <p>${this.renderMarkdown(creature.physicalDescription)}</p>
                </section>
            `);
        }

        // Abilities
        if (creature.abilities && creature.abilities.length > 0) {
            sections.push(`
                <section class="creature-abilities">
                    <h2>Abilities</h2>
                    <div class="abilities-grid">
                        ${creature.abilities.map(a => `<div class="ability-card">⚡ ${this.escapeHtml(a)}</div>`).join('')}
                    </div>
                </section>
            `);
        }

        // Weaknesses
        if (creature.weaknesses && creature.weaknesses.length > 0) {
            sections.push(`
                <section class="creature-weaknesses">
                    <h2>Weaknesses</h2>
                    <div class="weaknesses-list">
                        ${creature.weaknesses.map(w => `<span class="weakness-tag">🛡️ ${this.escapeHtml(w)}</span>`).join('')}
                    </div>
                </section>
            `);
        }

        // Slain by
        if (creature.slainBy && creature.slainBy.length > 0) {
            sections.push(`
                <section class="creature-slayers">
                    <h2>Defeated By</h2>
                    <div class="slayers-list">
                        ${creature.slainBy.map(h => this.createEntityLink(h, 'hero')).join(', ')}
                    </div>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Item-specific sections
     */
    static renderItemSections(item) {
        let sections = [];

        // Powers
        if (item.powers && item.powers.length > 0) {
            sections.push(`
                <section class="item-powers">
                    <h2>Powers & Abilities</h2>
                    <ul class="powers-list">
                        ${item.powers.map(p => `<li>⚡ ${this.escapeHtml(p)}</li>`).join('')}
                    </ul>
                </section>
            `);
        }

        // Materials
        if (item.materials && item.materials.length > 0) {
            sections.push(`
                <section class="item-materials">
                    <h2>Materials</h2>
                    <div class="materials-tags">
                        ${item.materials.map(m => `<span class="material-tag">${this.escapeHtml(m)}</span>`).join('')}
                    </div>
                </section>
            `);
        }

        // Wielders
        if (item.wielders && item.wielders.length > 0) {
            sections.push(`
                <section class="item-wielders">
                    <h2>Notable Wielders</h2>
                    <div class="wielders-grid">
                        ${item.wielders.map(w => this.createEntityLink(w, 'deity')).join(', ')}
                    </div>
                </section>
            `);
        }

        // Created by
        if (item.createdBy && item.createdBy.length > 0) {
            sections.push(`
                <section class="item-creator">
                    <h2>Created By</h2>
                    <p>${item.createdBy.map(c => this.createEntityLink(c, 'deity')).join(', ')}</p>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Place-specific sections
     */
    static renderPlaceSections(place) {
        let sections = [];

        // Map (if coordinates exist)
        if (place.geographical?.primaryLocation?.coordinates) {
            sections.push(this.renderMap(place.geographical.primaryLocation.coordinates));
        }

        // Inhabitants
        if (place.inhabitants && place.inhabitants.length > 0) {
            sections.push(`
                <section class="place-inhabitants">
                    <h2>Inhabitants</h2>
                    <div class="inhabitants-grid">
                        ${place.inhabitants.map(i => this.createEntityLink(i, 'deity')).join(', ')}
                    </div>
                </section>
            `);
        }

        // Major events
        if (place.events && place.events.length > 0) {
            sections.push(`
                <section class="place-events">
                    <h2>Major Events</h2>
                    <ul class="events-list">
                        ${place.events.map(e => `<li>${this.escapeHtml(e)}</li>`).join('')}
                    </ul>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Concept-specific sections
     */
    static renderConceptSections(concept) {
        let sections = [];

        if (concept.opposites && concept.opposites.length > 0) {
            sections.push(`
                <section class="concept-opposites">
                    <h2>Opposing Concepts</h2>
                    <div class="opposites-list">
                        ${concept.opposites.map(o => this.createEntityLink(o, 'concept')).join(', ')}
                    </div>
                </section>
            `);
        }

        if (concept.personifications && concept.personifications.length > 0) {
            sections.push(`
                <section class="concept-personifications">
                    <h2>Personified As</h2>
                    <div class="personifications-grid">
                        ${concept.personifications.map(p => this.createEntityLink(p, 'deity')).join(', ')}
                    </div>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Magic system-specific sections
     */
    static renderMagicSections(magic) {
        let sections = [];

        // Techniques
        if (magic.techniques && magic.techniques.length > 0) {
            sections.push(`
                <section class="magic-techniques">
                    <h2>Techniques & Methods</h2>
                    <ul class="techniques-list">
                        ${magic.techniques.map(t => `<li>${this.escapeHtml(t)}</li>`).join('')}
                    </ul>
                </section>
            `);
        }

        // Tools
        if (magic.tools && magic.tools.length > 0) {
            sections.push(`
                <section class="magic-tools">
                    <h2>Tools & Materials</h2>
                    <div class="tools-list">
                        ${magic.tools.map(t => `<span class="tool-tag">🔮 ${this.escapeHtml(t)}</span>`).join('')}
                    </div>
                </section>
            `);
        }

        // Safety warnings
        if (magic.safetyWarnings && magic.safetyWarnings.length > 0) {
            sections.push(`
                <section class="magic-warnings">
                    <h2>⚠️ Safety Warnings</h2>
                    <div class="warnings-box">
                        ${magic.safetyWarnings.map(w => `<p>⚠️ ${this.escapeHtml(w)}</p>`).join('')}
                    </div>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Theory-specific sections
     */
    static renderTheorySections(theory) {
        let sections = [];

        // Intellectual honesty warning
        if (theory.intellectualHonestyWarning) {
            sections.push(`
                <section class="theory-warning">
                    <div class="intellectual-honesty-warning">
                        <h3>⚠️ Intellectual Honesty Statement</h3>
                        <p>${this.escapeHtml(theory.intellectualHonestyWarning)}</p>
                    </div>
                </section>
            `);
        }

        // Confidence score
        if (typeof theory.confidence === 'number') {
            sections.push(`
                <section class="theory-confidence">
                    <h2>Confidence Score</h2>
                    <div class="confidence-meter">
                        <div class="confidence-bar" style="width: ${theory.confidence}%">
                            ${theory.confidence}%
                        </div>
                    </div>
                </section>
            `);
        }

        // Key correlations
        if (theory.keyCorrelations && theory.keyCorrelations.length > 0) {
            sections.push(`
                <section class="theory-correlations">
                    <h2>Key Correlations</h2>
                    <div class="correlations-list">
                        ${theory.keyCorrelations.map(c => `
                            <div class="correlation-card">
                                <div class="correlation-row">
                                    <span class="correlation-label">Mythological:</span>
                                    <span>${this.escapeHtml(c.mythological || c.kabbalistic)}</span>
                                </div>
                                <div class="correlation-row">
                                    <span class="correlation-label">Scientific:</span>
                                    <span>${this.escapeHtml(c.scientific || c.physics)}</span>
                                </div>
                                <div class="correlation-confidence">
                                    Confidence: ${c.confidence}%
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `);
        }

        // Alternative explanations
        if (theory.alternativeExplanations && theory.alternativeExplanations.length > 0) {
            sections.push(`
                <section class="theory-alternatives">
                    <h2>Alternative Explanations</h2>
                    <ul class="alternatives-list">
                        ${theory.alternativeExplanations.map(a => `<li>${this.escapeHtml(a)}</li>`).join('')}
                    </ul>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Mythology-specific sections
     */
    static renderMythologySections(mythology) {
        let sections = [];

        if (mythology.creationMyth) {
            sections.push(`
                <section class="mythology-creation">
                    <h2>Creation Myth</h2>
                    <p>${this.renderMarkdown(mythology.creationMyth)}</p>
                </section>
            `);
        }

        if (mythology.cosmology) {
            sections.push(`
                <section class="mythology-cosmology">
                    <h2>Cosmology</h2>
                    <p>${this.renderMarkdown(mythology.cosmology)}</p>
                </section>
            `);
        }

        if (mythology.majorDeities && mythology.majorDeities.length > 0) {
            sections.push(`
                <section class="mythology-deities">
                    <h2>Major Deities</h2>
                    <div class="deities-grid">
                        ${mythology.majorDeities.map(d => this.createEntityLink(d, 'deity')).join(', ')}
                    </div>
                </section>
            `);
        }

        return sections.join('');
    }

    /**
     * Render metadata sidebar
     */
    static renderMetadata(entity) {
        let metadata = [];

        // Linguistic data
        if (entity.linguistic) {
            metadata.push(`
                <div class="metadata-section linguistic-data">
                    <h3>Linguistic Information</h3>
                    ${entity.linguistic.originalName ? `<p><strong>Original Name:</strong> ${this.escapeHtml(entity.linguistic.originalName)}</p>` : ''}
                    ${entity.linguistic.pronunciation ? `<p><strong>Pronunciation:</strong> ${this.escapeHtml(entity.linguistic.pronunciation)}</p>` : ''}
                    ${entity.linguistic.etymology ? `<p><strong>Etymology:</strong> ${this.escapeHtml(entity.linguistic.etymology.meaning || '')}</p>` : ''}
                </div>
            `);
        }

        // Geographical data
        if (entity.geographical) {
            metadata.push(`
                <div class="metadata-section geographical-data">
                    <h3>Geographical Information</h3>
                    ${entity.geographical.region ? `<p><strong>Region:</strong> ${this.escapeHtml(entity.geographical.region)}</p>` : ''}
                    ${entity.geographical.primaryLocation?.name ? `<p><strong>Location:</strong> ${this.escapeHtml(entity.geographical.primaryLocation.name)}</p>` : ''}
                </div>
            `);
        }

        // Temporal data
        if (entity.temporal) {
            metadata.push(`
                <div class="metadata-section temporal-data">
                    <h3>Historical Information</h3>
                    ${entity.temporal.firstAttestation?.date ? `<p><strong>First Attested:</strong> ${this.escapeHtml(entity.temporal.firstAttestation.date)}</p>` : ''}
                    ${entity.temporal.historicalPeriod ? `<p><strong>Period:</strong> ${this.escapeHtml(entity.temporal.historicalPeriod)}</p>` : ''}
                </div>
            `);
        }

        if (metadata.length === 0) return '';

        return `
            <aside class="entity-metadata">
                ${metadata.join('')}
            </aside>
        `;
    }

    /**
     * Render relationships section
     */
    static renderRelationships(relationships) {
        if (!relationships || Object.keys(relationships).length === 0) return '';

        const relationshipItems = Object.entries(relationships).map(([rel, id]) => {
            if (Array.isArray(id)) {
                return `<p><strong>${this.capitalize(rel)}:</strong> ${id.map(i => this.createEntityLink(i, 'deity')).join(', ')}</p>`;
            } else {
                return `<p><strong>${this.capitalize(rel)}:</strong> ${this.createEntityLink(id, 'deity')}</p>`;
            }
        }).join('');

        return `
            <section class="entity-relationships">
                <h2>Family & Relationships</h2>
                <div class="relationships-info">
                    ${relationshipItems}
                </div>
            </section>
        `;
    }

    /**
     * Render archetypes section
     */
    static renderArchetypes(archetypes) {
        if (!archetypes || archetypes.length === 0) return '';

        const archetypeItems = archetypes
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map(arch => `
                <div class="archetype-card">
                    <span class="archetype-name">${this.formatArchetype(arch.category)}</span>
                    <div class="archetype-score">
                        <div class="score-bar" style="width: ${arch.score}%"></div>
                        <span class="score-text">${arch.score}%</span>
                    </div>
                    ${arch.inferred ? '<span class="inferred-tag">Inferred</span>' : ''}
                </div>
            `).join('');

        return `
            <section class="entity-archetypes">
                <h2>Archetypes</h2>
                <div class="archetypes-list">
                    ${archetypeItems}
                </div>
            </section>
        `;
    }

    /**
     * Render related entities section
     */
    static renderRelatedEntities(relatedEntities) {
        if (!relatedEntities || Object.keys(relatedEntities).length === 0) return '';

        const sections = [];

        Object.entries(relatedEntities).forEach(([type, ids]) => {
            if (ids && ids.length > 0) {
                sections.push(`
                    <div class="related-${type}">
                        <h3>Related ${this.capitalize(type)}</h3>
                        <div class="related-grid">
                            ${ids.map(id => this.createEntityLink(id, type.replace(/s$/, ''))).join(', ')}
                        </div>
                    </div>
                `);
            }
        });

        if (sections.length === 0) return '';

        return `
            <section class="entity-related">
                <h2>Related Entities</h2>
                ${sections.join('')}
            </section>
        `;
    }

    /**
     * Render cross-references section
     */
    static renderCrossReferences(crossRefs) {
        if (!crossRefs || Object.keys(crossRefs).length === 0) return '';

        return this.renderRelatedEntities(crossRefs);
    }

    /**
     * Render sources section
     */
    static renderSources(sources) {
        if (!sources || sources.length === 0) return '';

        const sourceItems = sources.map(s => `
            <div class="source-item">
                <p class="source-title">${this.escapeHtml(s.title)}</p>
                ${s.author ? `<p class="source-author">${this.escapeHtml(s.author)}</p>` : ''}
                ${s.citation ? `<p class="source-citation">${this.escapeHtml(s.citation)}</p>` : ''}
                ${s.url ? `<a href="${this.escapeHtml(s.url)}" target="_blank" class="source-link">View Source</a>` : ''}
            </div>
        `).join('');

        return `
            <section class="entity-sources">
                <h2>Sources</h2>
                <div class="sources-list">
                    ${sourceItems}
                </div>
            </section>
        `;
    }

    /**
     * Render map for place
     */
    static renderMap(coordinates) {
        return `
            <section class="place-map">
                <h2>Location</h2>
                <div class="map-container" data-lat="${coordinates.latitude}" data-lng="${coordinates.longitude}">
                    <p>📍 ${coordinates.latitude}, ${coordinates.longitude}</p>
                    <p class="map-placeholder">Map will be rendered here</p>
                </div>
            </section>
        `;
    }

    /**
     * Render edit button
     */
    static renderEditButton(entity) {
        return `
            <div class="entity-actions">
                <button class="btn-edit" onclick="EntityDisplay.editEntity('${entity.id}', '${entity.type}')">
                    ✏️ Edit This ${this.getTypeLabel(entity.type)}
                </button>
            </div>
        `;
    }

    /**
     * Helper: Create entity link
     */
    static createEntityLink(id, type) {
        if (!id) return '';
        // TODO: Fetch entity name from Firestore
        return `<a href="/${type}s/${id}.html" class="entity-link" data-entity-id="${id}" data-entity-type="${type}">${id}</a>`;
    }

    /**
     * Helper: Create entity card (mini version)
     */
    static createEntityCard(entity) {
        return `
            <div class="mini-entity-card" data-entity-id="${entity.id}">
                <span class="mini-entity-name">${entity.name || entity.id}</span>
            </div>
        `;
    }

    /**
     * Helper: Get entity icon
     */
    static getEntityIcon(entity) {
        if (entity.visual?.icon || entity.icon) {
            return entity.visual?.icon || entity.icon;
        }

        const iconMap = {
            deity: '⚡',
            hero: '🗡️',
            creature: '🐉',
            item: '⚔️',
            place: '🏛️',
            concept: '💭',
            magic: '🔮',
            theory: '🔬',
            mythology: '📜'
        };

        return iconMap[entity.type] || '✨';
    }

    /**
     * Helper: Get mythology badge
     */
    static getMythologyBadge(entity) {
        const mythologies = entity.mythologies || [entity.mythology];
        if (!mythologies || mythologies.length === 0) return '';

        return `
            <div class="mythology-badges">
                ${mythologies.map(m => `<span class="mythology-badge mythology-${m}">${this.capitalize(m)}</span>`).join('')}
            </div>
        `;
    }

    /**
     * Helper: Get type label
     */
    static getTypeLabel(type) {
        const labels = {
            deity: 'Deity',
            hero: 'Hero',
            creature: 'Creature',
            item: 'Artifact',
            place: 'Place',
            concept: 'Concept',
            magic: 'Magic System',
            theory: 'Theory',
            mythology: 'Mythology'
        };
        return labels[type] || this.capitalize(type);
    }

    /**
     * Helper: Format archetype name
     */
    static formatArchetype(category) {
        return category.split('-').map(w => this.capitalize(w)).join(' ');
    }

    /**
     * Helper: Render markdown
     */
    static renderMarkdown(text) {
        if (!text) return '';
        // Simple markdown rendering (can be enhanced with library)
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Helper: Escape HTML
     */
    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Helper: Capitalize
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Navigate to edit page
     */
    static editEntity(id, type) {
        window.location.href = `/edit.html?type=${type}&id=${id}`;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityDisplay;
}
