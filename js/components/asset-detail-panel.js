/**
 * Asset Detail Panel
 *
 * Comprehensive large form panel for displaying full asset information.
 * Renders complete entity data with no truncation, including:
 * - Full title and descriptions
 * - All metadata (geographical, chronological, relationships)
 * - Image gallery
 * - Source citations
 * - Related content sections
 * - Collapsible sections for organized presentation
 *
 * Supports all asset types:
 * - deities, creatures, heroes, items, places
 * - herbs, rituals, texts, symbols, archetypes
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    class AssetDetailPanel {
        constructor(options = {}) {
            this.baseUrl = options.baseUrl || '';
            this.showEditButton = options.showEditButton || false;
            this.onEntityClick = options.onEntityClick || null;
            this.onSectionToggle = options.onSectionToggle || null;

            // Component references
            this.geoRenderer = options.geoRenderer || (window.MetadataGeographic ? new window.MetadataGeographic() : null);
            this.chronoRenderer = options.chronoRenderer || (window.MetadataChronological ? new window.MetadataChronological() : null);
            this.relationRenderer = options.relationRenderer || (window.MetadataRelationships ? new window.MetadataRelationships() : null);

            // Section collapse state (persistent per session)
            this.collapsedSections = new Set();
            this.loadCollapseState();
        }

        /**
         * Main render method - generates complete HTML for an asset
         * @param {Object} entity - The entity data object
         * @returns {string} Complete HTML string
         */
        render(entity) {
            if (!entity) {
                return this.renderError('No entity data provided');
            }

            const colors = entity.colors || {};
            const primaryColor = colors.primary || '#667eea';
            const secondaryColor = colors.secondary || '#764ba2';

            return `
                <article class="asset-detail-panel"
                         data-entity-id="${this.escapeAttr(entity.id)}"
                         data-entity-type="${this.escapeAttr(entity.type || 'unknown')}"
                         style="--asset-primary: ${primaryColor}; --asset-secondary: ${secondaryColor}; --asset-primary-rgb: ${this.hexToRgb(primaryColor)}; --asset-secondary-rgb: ${this.hexToRgb(secondaryColor)};">

                    <!-- Full Header Section -->
                    ${this.renderHeader(entity)}

                    <div class="asset-detail-body">
                        <!-- Main Content Area -->
                        <main class="asset-main-content">
                            ${this.renderDescriptionSection(entity)}
                            ${this.renderTypeSpecificContent(entity)}
                            ${this.renderLinguisticSection(entity)}
                            ${this.renderGeographicSection(entity)}
                            ${this.renderChronologicalSection(entity)}
                            ${this.renderRelationshipsSection(entity)}
                            ${this.renderMetaphysicalSection(entity)}
                            ${this.renderCulturalSection(entity)}
                            ${this.renderGallerySection(entity)}
                            ${this.renderSourcesSection(entity)}
                            ${this.renderCorpusSection(entity)}
                        </main>

                        <!-- Sidebar with Quick Info -->
                        <aside class="asset-sidebar">
                            ${this.renderQuickInfoSidebar(entity)}
                            ${this.renderTagsSidebar(entity)}
                            ${this.renderMetadataSidebar(entity)}
                        </aside>
                    </div>
                </article>
            `;
        }

        /**
         * Render the full header section
         */
        renderHeader(entity) {
            const mythologies = entity.mythologies || [entity.primaryMythology || entity.mythology];
            const primaryMythology = entity.primaryMythology || entity.mythology || 'unknown';

            return `
                <header class="asset-header">
                    <div class="asset-header-background"></div>
                    <div class="asset-header-content">
                        <!-- Icon Display -->
                        ${entity.icon ? `
                            <div class="asset-icon-wrapper">
                                <div class="asset-icon-display ${this.isSvg(entity.icon) ? 'asset-icon-svg' : ''}">
                                    ${this.renderIcon(entity.icon)}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Title Block -->
                        <div class="asset-title-block">
                            <h1 class="asset-title">${this.escapeHtml(entity.name || entity.title || 'Unknown Entity')}</h1>

                            ${entity.linguistic?.originalName || entity.originalName ? `
                                <div class="asset-original-name">
                                    ${this.escapeHtml(entity.linguistic?.originalName || entity.originalName)}
                                </div>
                            ` : ''}

                            ${entity.linguistic?.transliteration || entity.transliteration ? `
                                <div class="asset-transliteration">
                                    [${this.escapeHtml(entity.linguistic?.transliteration || entity.transliteration)}]
                                </div>
                            ` : ''}
                        </div>

                        <!-- Badge Row -->
                        <div class="asset-badge-row">
                            <span class="asset-type-badge type-${this.escapeAttr(entity.type || 'unknown')}">
                                ${this.getTypeIcon(entity.type)} ${this.formatType(entity.type)}
                            </span>
                            <span class="asset-mythology-badge">
                                ${this.getMythologyIcon(primaryMythology)} ${this.capitalize(primaryMythology)}
                            </span>
                            ${mythologies.length > 1 ? `
                                <button class="asset-multi-mythology"
                                        title="${mythologies.slice(1).map(m => this.capitalize(m)).join(', ')}"
                                        aria-label="Also found in ${mythologies.length - 1} other mythologies">
                                    +${mythologies.length - 1} more
                                </button>
                            ` : ''}
                        </div>

                        <!-- Epithets and Alternate Names -->
                        ${this.renderEpithetsHeader(entity)}

                        <!-- Short Description -->
                        ${entity.shortDescription ? `
                            <p class="asset-header-description">
                                ${this.escapeHtml(entity.shortDescription)}
                            </p>
                        ` : ''}

                        <!-- Quick Actions -->
                        ${this.renderQuickActions(entity)}
                    </div>
                </header>
            `;
        }

        /**
         * Render epithets in header
         */
        renderEpithetsHeader(entity) {
            const epithets = entity.epithets || [];
            if (epithets.length === 0) return '';

            return `
                <div class="asset-epithets-header">
                    ${epithets.slice(0, 5).map(epithet => `
                        <span class="epithet-badge">"${this.escapeHtml(epithet)}"</span>
                    `).join('')}
                    ${epithets.length > 5 ? `
                        <span class="epithet-more">+${epithets.length - 5} more</span>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render quick actions in header
         */
        renderQuickActions(entity) {
            return `
                <div class="asset-quick-actions">
                    <button class="quick-action-btn" data-action="bookmark" title="Bookmark this ${entity.type || 'entity'}">
                        <span class="action-icon" aria-hidden="true">&#9733;</span>
                        <span class="action-label">Bookmark</span>
                    </button>
                    <button class="quick-action-btn" data-action="share" title="Share">
                        <span class="action-icon" aria-hidden="true">&#8599;</span>
                        <span class="action-label">Share</span>
                    </button>
                    ${this.showEditButton ? `
                        <button class="quick-action-btn quick-action-edit" data-action="edit" title="Edit this ${entity.type || 'entity'}">
                            <span class="action-icon" aria-hidden="true">&#9998;</span>
                            <span class="action-label">Edit</span>
                        </button>
                    ` : ''}
                    <button class="quick-action-btn" data-action="cite" title="Get citation">
                        <span class="action-icon" aria-hidden="true">&#128196;</span>
                        <span class="action-label">Cite</span>
                    </button>
                </div>
            `;
        }

        /**
         * Render full description section (no truncation)
         */
        renderDescriptionSection(entity) {
            const fullDescription = entity.fullDescription || entity.description;
            if (!fullDescription) return '';

            return `
                <section class="asset-section asset-description-section" id="section-description">
                    ${this.renderSectionHeader('Overview', '&#128214;', 'description')}
                    <div class="section-content ${this.collapsedSections.has('description') ? 'collapsed' : ''}">
                        <div class="description-full-content">
                            ${this.formatRichText(fullDescription)}
                        </div>
                    </div>
                </section>
            `;
        }

        /**
         * Render type-specific content based on entity type
         */
        renderTypeSpecificContent(entity) {
            const type = entity.type?.toLowerCase();

            switch (type) {
                case 'deity':
                case 'deities':
                    return this.renderDeityContent(entity);
                case 'creature':
                case 'creatures':
                    return this.renderCreatureContent(entity);
                case 'hero':
                case 'heroes':
                    return this.renderHeroContent(entity);
                case 'item':
                case 'items':
                    return this.renderItemContent(entity);
                case 'place':
                case 'places':
                    return this.renderPlaceContent(entity);
                case 'herb':
                case 'herbs':
                    return this.renderHerbContent(entity);
                case 'ritual':
                case 'rituals':
                    return this.renderRitualContent(entity);
                case 'text':
                case 'texts':
                    return this.renderTextContent(entity);
                case 'symbol':
                case 'symbols':
                    return this.renderSymbolContent(entity);
                case 'archetype':
                case 'archetypes':
                    return this.renderArchetypeContent(entity);
                default:
                    return '';
            }
        }

        /**
         * Render deity-specific content
         */
        renderDeityContent(entity) {
            const domains = entity.domains || entity.metaphysicalProperties?.domains || [];
            const aspects = entity.aspects || [];
            const functions = entity.functions || [];
            const symbols = entity.symbols || [];
            const animals = entity.sacredAnimals || entity.animals || [];
            const attributes = entity.attributes || [];

            if (domains.length === 0 && aspects.length === 0 && functions.length === 0 &&
                symbols.length === 0 && animals.length === 0 && attributes.length === 0) return '';

            return `
                <section class="asset-section asset-deity-section" id="section-deity">
                    ${this.renderSectionHeader('Divine Attributes', '&#128081;', 'deity')}
                    <div class="section-content ${this.collapsedSections.has('deity') ? 'collapsed' : ''}">

                        ${domains.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Domains of Influence</h4>
                                <div class="domain-grid">
                                    ${domains.map(domain => `
                                        <span class="domain-chip">${this.escapeHtml(domain)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${aspects.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Divine Aspects</h4>
                                <ul class="aspects-list">
                                    ${aspects.map(aspect => `
                                        <li class="aspect-item">${this.escapeHtml(typeof aspect === 'string' ? aspect : aspect.name)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${functions.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Divine Functions</h4>
                                <ul class="functions-list">
                                    ${functions.map(func => `
                                        <li class="function-item">${this.escapeHtml(func)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${symbols.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Sacred Symbols</h4>
                                <div class="symbols-grid">
                                    ${symbols.map(symbol => `
                                        <span class="symbol-chip">
                                            <span class="symbol-icon" aria-hidden="true">&#10070;</span>
                                            ${this.escapeHtml(typeof symbol === 'string' ? symbol : symbol.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${animals.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Sacred Animals</h4>
                                <div class="animals-grid">
                                    ${animals.map(animal => `
                                        <span class="animal-chip">
                                            <span class="animal-icon" aria-hidden="true">&#128062;</span>
                                            ${this.escapeHtml(typeof animal === 'string' ? animal : animal.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${attributes.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Visual Attributes</h4>
                                <ul class="attributes-list">
                                    ${attributes.map(attr => `
                                        <li class="attribute-item">${this.escapeHtml(typeof attr === 'string' ? attr : attr.description || attr.name)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render creature-specific content
         */
        renderCreatureContent(entity) {
            const classification = entity.classification || {};
            const physicalTraits = entity.physicalTraits || entity.appearance || {};
            const abilities = entity.abilities || entity.powers || [];
            const habitats = entity.habitats || entity.habitat || [];
            const behaviors = entity.behaviors || [];
            const weaknesses = entity.weaknesses || [];

            const hasContent = Object.keys(classification).length > 0 ||
                              Object.keys(physicalTraits).length > 0 ||
                              abilities.length > 0 || habitats.length > 0 ||
                              behaviors.length > 0 || weaknesses.length > 0;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-creature-section" id="section-creature">
                    ${this.renderSectionHeader('Creature Characteristics', '&#128009;', 'creature')}
                    <div class="section-content ${this.collapsedSections.has('creature') ? 'collapsed' : ''}">

                        ${Object.keys(classification).length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Classification</h4>
                                <div class="classification-grid">
                                    ${classification.kingdom ? `<div class="class-item"><span class="class-label">Kingdom:</span> ${this.escapeHtml(classification.kingdom)}</div>` : ''}
                                    ${classification.type ? `<div class="class-item"><span class="class-label">Type:</span> ${this.escapeHtml(classification.type)}</div>` : ''}
                                    ${classification.subtype ? `<div class="class-item"><span class="class-label">Subtype:</span> ${this.escapeHtml(classification.subtype)}</div>` : ''}
                                    ${classification.rarity ? `<div class="class-item"><span class="class-label">Rarity:</span> <span class="rarity-badge rarity-${classification.rarity}">${this.escapeHtml(classification.rarity)}</span></div>` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${this.renderPhysicalTraits(physicalTraits)}

                        ${abilities.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Powers &amp; Abilities</h4>
                                <div class="abilities-grid">
                                    ${abilities.map(ability => `
                                        <div class="ability-card">
                                            <span class="ability-icon" aria-hidden="true">&#10024;</span>
                                            <span class="ability-name">${this.escapeHtml(typeof ability === 'string' ? ability : ability.name)}</span>
                                            ${typeof ability === 'object' && ability.description ? `
                                                <p class="ability-desc">${this.escapeHtml(ability.description)}</p>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${habitats.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Habitats</h4>
                                <div class="habitat-chips">
                                    ${(Array.isArray(habitats) ? habitats : [habitats]).map(habitat => `
                                        <span class="habitat-chip">
                                            <span class="habitat-icon" aria-hidden="true">&#127968;</span>
                                            ${this.escapeHtml(typeof habitat === 'string' ? habitat : habitat.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${weaknesses.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Weaknesses</h4>
                                <ul class="weaknesses-list">
                                    ${weaknesses.map(w => `
                                        <li class="weakness-item">
                                            <span class="weakness-icon" aria-hidden="true">&#9888;</span>
                                            ${this.escapeHtml(typeof w === 'string' ? w : w.name)}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render physical traits for creatures
         */
        renderPhysicalTraits(traits) {
            if (!traits || Object.keys(traits).length === 0) return '';

            return `
                <div class="attribute-group">
                    <h4 class="attribute-group-title">Physical Characteristics</h4>
                    <div class="traits-grid">
                        ${traits.size ? `<div class="trait-item"><span class="trait-label">Size:</span> ${this.escapeHtml(traits.size)}</div>` : ''}
                        ${traits.height ? `<div class="trait-item"><span class="trait-label">Height:</span> ${this.escapeHtml(traits.height)}</div>` : ''}
                        ${traits.weight ? `<div class="trait-item"><span class="trait-label">Weight:</span> ${this.escapeHtml(traits.weight)}</div>` : ''}
                        ${traits.color ? `<div class="trait-item"><span class="trait-label">Color:</span> ${this.escapeHtml(traits.color)}</div>` : ''}
                        ${traits.eyes ? `<div class="trait-item"><span class="trait-label">Eyes:</span> ${this.escapeHtml(traits.eyes)}</div>` : ''}
                        ${traits.skin ? `<div class="trait-item"><span class="trait-label">Skin/Scales:</span> ${this.escapeHtml(traits.skin)}</div>` : ''}
                        ${traits.wings ? `<div class="trait-item"><span class="trait-label">Wings:</span> ${this.escapeHtml(traits.wings)}</div>` : ''}
                        ${traits.limbs ? `<div class="trait-item"><span class="trait-label">Limbs:</span> ${this.escapeHtml(traits.limbs)}</div>` : ''}
                    </div>
                    ${traits.description ? `
                        <p class="traits-description">${this.escapeHtml(traits.description)}</p>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render hero-specific content
         */
        renderHeroContent(entity) {
            const quests = entity.quests || entity.adventures || [];
            const achievements = entity.achievements || entity.feats || [];
            const companions = entity.companions || [];
            const weapons = entity.weapons || [];
            const skills = entity.skills || [];
            const fate = entity.fate || entity.death || null;

            const hasContent = quests.length > 0 || achievements.length > 0 ||
                              companions.length > 0 || weapons.length > 0 ||
                              skills.length > 0 || fate;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-hero-section" id="section-hero">
                    ${this.renderSectionHeader('Heroic Journey', '&#129409;', 'hero')}
                    <div class="section-content ${this.collapsedSections.has('hero') ? 'collapsed' : ''}">

                        ${achievements.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Notable Achievements</h4>
                                <ol class="achievements-list">
                                    ${achievements.map(achievement => `
                                        <li class="achievement-item">
                                            <span class="achievement-icon" aria-hidden="true">&#127942;</span>
                                            ${this.escapeHtml(typeof achievement === 'string' ? achievement : achievement.name)}
                                        </li>
                                    `).join('')}
                                </ol>
                            </div>
                        ` : ''}

                        ${quests.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Quests &amp; Adventures</h4>
                                <div class="quests-timeline">
                                    ${quests.map((quest, i) => `
                                        <div class="quest-item" data-index="${i}">
                                            <div class="quest-marker"></div>
                                            <div class="quest-content">
                                                <strong>${this.escapeHtml(typeof quest === 'string' ? quest : quest.name)}</strong>
                                                ${typeof quest === 'object' && quest.description ? `
                                                    <p>${this.escapeHtml(quest.description)}</p>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${companions.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Companions</h4>
                                <div class="companions-grid">
                                    ${companions.map(companion => `
                                        <div class="companion-card">
                                            <span class="companion-icon" aria-hidden="true">&#128100;</span>
                                            <span class="companion-name">${this.escapeHtml(typeof companion === 'string' ? companion : companion.name)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${weapons.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Weapons &amp; Equipment</h4>
                                <div class="weapons-grid">
                                    ${weapons.map(weapon => `
                                        <span class="weapon-chip">
                                            <span class="weapon-icon" aria-hidden="true">&#9876;</span>
                                            ${this.escapeHtml(typeof weapon === 'string' ? weapon : weapon.name)}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${fate ? `
                            <div class="attribute-group fate-section">
                                <h4 class="attribute-group-title">Fate</h4>
                                <div class="fate-content">
                                    <span class="fate-icon" aria-hidden="true">&#9760;</span>
                                    <p>${this.escapeHtml(typeof fate === 'string' ? fate : fate.description || fate.manner)}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render item-specific content
         */
        renderItemContent(entity) {
            const itemType = entity.itemType || entity.category || '';
            const properties = entity.properties || entity.magicalProperties || [];
            const materials = entity.materials || [];
            const creators = entity.creators || entity.craftedBy || [];
            const owners = entity.owners || entity.wielders || [];
            const powers = entity.powers || [];
            const history = entity.history || '';

            const hasContent = itemType || properties.length > 0 || materials.length > 0 ||
                              creators.length > 0 || owners.length > 0 || powers.length > 0 || history;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-item-section" id="section-item">
                    ${this.renderSectionHeader('Item Properties', '&#9876;', 'item')}
                    <div class="section-content ${this.collapsedSections.has('item') ? 'collapsed' : ''}">

                        ${itemType ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Item Type</h4>
                                <span class="item-type-badge">${this.escapeHtml(itemType)}</span>
                            </div>
                        ` : ''}

                        ${materials.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Materials</h4>
                                <div class="materials-grid">
                                    ${materials.map(mat => `
                                        <span class="material-chip">${this.escapeHtml(typeof mat === 'string' ? mat : mat.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${powers.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Magical Powers</h4>
                                <div class="powers-list">
                                    ${powers.map(power => `
                                        <div class="power-card">
                                            <span class="power-icon" aria-hidden="true">&#10024;</span>
                                            <span class="power-name">${this.escapeHtml(typeof power === 'string' ? power : power.name)}</span>
                                            ${typeof power === 'object' && power.description ? `
                                                <p class="power-desc">${this.escapeHtml(power.description)}</p>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${creators.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Created By</h4>
                                <div class="creators-list">
                                    ${creators.map(creator => `
                                        <span class="creator-chip">${this.escapeHtml(typeof creator === 'string' ? creator : creator.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${owners.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Notable Owners/Wielders</h4>
                                <ol class="owners-timeline">
                                    ${owners.map(owner => `
                                        <li class="owner-item">${this.escapeHtml(typeof owner === 'string' ? owner : owner.name)}</li>
                                    `).join('')}
                                </ol>
                            </div>
                        ` : ''}

                        ${history ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">History</h4>
                                <div class="history-content">
                                    ${this.formatRichText(history)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render place-specific content
         */
        renderPlaceContent(entity) {
            const placeType = entity.placeType || entity.locationType || '';
            const significance = entity.significance || '';
            const features = entity.features || [];
            const inhabitants = entity.inhabitants || [];
            const events = entity.events || [];
            const access = entity.access || entity.accessibility || '';

            const hasContent = placeType || significance || features.length > 0 ||
                              inhabitants.length > 0 || events.length > 0 || access;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-place-section" id="section-place">
                    ${this.renderSectionHeader('Location Details', '&#127963;', 'place')}
                    <div class="section-content ${this.collapsedSections.has('place') ? 'collapsed' : ''}">

                        ${placeType ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Location Type</h4>
                                <span class="place-type-badge">${this.escapeHtml(placeType)}</span>
                            </div>
                        ` : ''}

                        ${significance ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Significance</h4>
                                <p class="significance-text">${this.escapeHtml(significance)}</p>
                            </div>
                        ` : ''}

                        ${features.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Notable Features</h4>
                                <ul class="features-list">
                                    ${features.map(feature => `
                                        <li class="feature-item">${this.escapeHtml(typeof feature === 'string' ? feature : feature.name)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${inhabitants.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Inhabitants</h4>
                                <div class="inhabitants-grid">
                                    ${inhabitants.map(inhab => `
                                        <span class="inhabitant-chip">${this.escapeHtml(typeof inhab === 'string' ? inhab : inhab.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${events.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Notable Events</h4>
                                <div class="events-timeline">
                                    ${events.map((event, i) => `
                                        <div class="event-item" data-index="${i}">
                                            <div class="event-marker"></div>
                                            <div class="event-content">
                                                <strong>${this.escapeHtml(typeof event === 'string' ? event : event.name)}</strong>
                                                ${typeof event === 'object' && event.description ? `
                                                    <p>${this.escapeHtml(event.description)}</p>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render herb-specific content
         */
        renderHerbContent(entity) {
            const botanicalInfo = entity.botanical || {};
            const properties = entity.properties || entity.medicinialProperties || [];
            const uses = entity.uses || entity.applications || [];
            const preparations = entity.preparations || [];
            const warnings = entity.warnings || entity.contraindications || [];
            const harvest = entity.harvest || entity.harvesting || {};

            const hasContent = Object.keys(botanicalInfo).length > 0 || properties.length > 0 ||
                              uses.length > 0 || preparations.length > 0 || warnings.length > 0;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-herb-section" id="section-herb">
                    ${this.renderSectionHeader('Herbal Properties', '&#127807;', 'herb')}
                    <div class="section-content ${this.collapsedSections.has('herb') ? 'collapsed' : ''}">

                        ${Object.keys(botanicalInfo).length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Botanical Information</h4>
                                <div class="botanical-grid">
                                    ${botanicalInfo.scientificName ? `<div class="botanical-item"><span class="botanical-label">Scientific Name:</span> <em>${this.escapeHtml(botanicalInfo.scientificName)}</em></div>` : ''}
                                    ${botanicalInfo.family ? `<div class="botanical-item"><span class="botanical-label">Family:</span> ${this.escapeHtml(botanicalInfo.family)}</div>` : ''}
                                    ${botanicalInfo.genus ? `<div class="botanical-item"><span class="botanical-label">Genus:</span> ${this.escapeHtml(botanicalInfo.genus)}</div>` : ''}
                                    ${botanicalInfo.parts ? `<div class="botanical-item"><span class="botanical-label">Parts Used:</span> ${this.escapeHtml(Array.isArray(botanicalInfo.parts) ? botanicalInfo.parts.join(', ') : botanicalInfo.parts)}</div>` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${properties.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Medicinal Properties</h4>
                                <div class="properties-grid">
                                    ${properties.map(prop => `
                                        <span class="property-chip">${this.escapeHtml(typeof prop === 'string' ? prop : prop.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${uses.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Traditional Uses</h4>
                                <ul class="uses-list">
                                    ${uses.map(use => `
                                        <li class="use-item">${this.escapeHtml(typeof use === 'string' ? use : use.description || use.name)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${preparations.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Preparations</h4>
                                <div class="preparations-list">
                                    ${preparations.map(prep => `
                                        <div class="preparation-card">
                                            <strong>${this.escapeHtml(typeof prep === 'string' ? prep : prep.name || prep.method)}</strong>
                                            ${typeof prep === 'object' && prep.instructions ? `
                                                <p>${this.escapeHtml(prep.instructions)}</p>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${warnings.length > 0 ? `
                            <div class="attribute-group warnings-group">
                                <h4 class="attribute-group-title">&#9888; Warnings &amp; Contraindications</h4>
                                <ul class="warnings-list">
                                    ${warnings.map(warn => `
                                        <li class="warning-item">${this.escapeHtml(typeof warn === 'string' ? warn : warn.description || warn.text)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render ritual-specific content
         */
        renderRitualContent(entity) {
            const purpose = entity.purpose || '';
            const steps = entity.steps || entity.procedure || [];
            const requirements = entity.requirements || [];
            const timing = entity.timing || entity.when || '';
            const participants = entity.participants || [];
            const outcomes = entity.outcomes || entity.effects || [];

            const hasContent = purpose || steps.length > 0 || requirements.length > 0 ||
                              timing || participants.length > 0 || outcomes.length > 0;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-ritual-section" id="section-ritual">
                    ${this.renderSectionHeader('Ritual Practice', '&#128722;', 'ritual')}
                    <div class="section-content ${this.collapsedSections.has('ritual') ? 'collapsed' : ''}">

                        ${purpose ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Purpose</h4>
                                <p class="purpose-text">${this.escapeHtml(purpose)}</p>
                            </div>
                        ` : ''}

                        ${timing ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Timing</h4>
                                <p class="timing-text">
                                    <span class="timing-icon" aria-hidden="true">&#128336;</span>
                                    ${this.escapeHtml(timing)}
                                </p>
                            </div>
                        ` : ''}

                        ${requirements.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Requirements</h4>
                                <ul class="requirements-list">
                                    ${requirements.map(req => `
                                        <li class="requirement-item">${this.escapeHtml(typeof req === 'string' ? req : req.item || req.name)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${steps.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Procedure</h4>
                                <ol class="steps-list">
                                    ${steps.map(step => `
                                        <li class="step-item">${this.escapeHtml(typeof step === 'string' ? step : step.instruction || step.description)}</li>
                                    `).join('')}
                                </ol>
                            </div>
                        ` : ''}

                        ${participants.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Participants</h4>
                                <div class="participants-grid">
                                    ${participants.map(part => `
                                        <span class="participant-chip">${this.escapeHtml(typeof part === 'string' ? part : part.role || part.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${outcomes.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Expected Outcomes</h4>
                                <ul class="outcomes-list">
                                    ${outcomes.map(outcome => `
                                        <li class="outcome-item">${this.escapeHtml(typeof outcome === 'string' ? outcome : outcome.description)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render text-specific content
         */
        renderTextContent(entity) {
            const textType = entity.textType || entity.genre || '';
            const language = entity.language || entity.originalLanguage || '';
            const contents = entity.contents || entity.chapters || [];
            const themes = entity.themes || [];
            const authorship = entity.authorship || entity.author || '';
            const translation = entity.translation || entity.translations || [];

            const hasContent = textType || language || contents.length > 0 ||
                              themes.length > 0 || authorship || translation.length > 0;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-text-section" id="section-text">
                    ${this.renderSectionHeader('Text Information', '&#128220;', 'text')}
                    <div class="section-content ${this.collapsedSections.has('text') ? 'collapsed' : ''}">

                        <div class="text-meta-grid">
                            ${textType ? `
                                <div class="text-meta-item">
                                    <span class="meta-label">Type/Genre</span>
                                    <span class="meta-value">${this.escapeHtml(textType)}</span>
                                </div>
                            ` : ''}
                            ${language ? `
                                <div class="text-meta-item">
                                    <span class="meta-label">Original Language</span>
                                    <span class="meta-value">${this.escapeHtml(language)}</span>
                                </div>
                            ` : ''}
                            ${authorship ? `
                                <div class="text-meta-item">
                                    <span class="meta-label">Attribution</span>
                                    <span class="meta-value">${this.escapeHtml(typeof authorship === 'string' ? authorship : authorship.name || 'Unknown')}</span>
                                </div>
                            ` : ''}
                        </div>

                        ${themes.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Major Themes</h4>
                                <div class="themes-grid">
                                    ${themes.map(theme => `
                                        <span class="theme-chip">${this.escapeHtml(typeof theme === 'string' ? theme : theme.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${contents.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Contents</h4>
                                <ol class="contents-list">
                                    ${contents.map(item => `
                                        <li class="content-item">${this.escapeHtml(typeof item === 'string' ? item : item.title || item.name)}</li>
                                    `).join('')}
                                </ol>
                            </div>
                        ` : ''}

                        ${translation.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Available Translations</h4>
                                <div class="translations-list">
                                    ${(Array.isArray(translation) ? translation : [translation]).map(trans => `
                                        <div class="translation-card">
                                            ${typeof trans === 'string' ? trans : `
                                                ${trans.language ? `<span class="trans-lang">${this.escapeHtml(trans.language)}</span>` : ''}
                                                ${trans.translator ? `<span class="trans-by">by ${this.escapeHtml(trans.translator)}</span>` : ''}
                                            `}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render symbol-specific content
         */
        renderSymbolContent(entity) {
            const symbolType = entity.symbolType || '';
            const meanings = entity.meanings || [];
            const usages = entity.usages || entity.uses || [];
            const variations = entity.variations || [];
            const associations = entity.associations || [];

            const hasContent = symbolType || meanings.length > 0 || usages.length > 0 ||
                              variations.length > 0 || associations.length > 0;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-symbol-section" id="section-symbol">
                    ${this.renderSectionHeader('Symbol Analysis', '&#10070;', 'symbol')}
                    <div class="section-content ${this.collapsedSections.has('symbol') ? 'collapsed' : ''}">

                        ${symbolType ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Symbol Type</h4>
                                <span class="symbol-type-badge">${this.escapeHtml(symbolType)}</span>
                            </div>
                        ` : ''}

                        ${meanings.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Meanings &amp; Interpretations</h4>
                                <ul class="meanings-list">
                                    ${meanings.map(meaning => `
                                        <li class="meaning-item">${this.escapeHtml(typeof meaning === 'string' ? meaning : meaning.interpretation || meaning.description)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${usages.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Historical Usages</h4>
                                <div class="usages-list">
                                    ${usages.map(usage => `
                                        <div class="usage-card">
                                            <span class="usage-context">${this.escapeHtml(typeof usage === 'string' ? usage : usage.context)}</span>
                                            ${typeof usage === 'object' && usage.description ? `
                                                <p>${this.escapeHtml(usage.description)}</p>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${variations.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Variations</h4>
                                <div class="variations-grid">
                                    ${variations.map(variation => `
                                        <span class="variation-chip">${this.escapeHtml(typeof variation === 'string' ? variation : variation.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${associations.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Associations</h4>
                                <div class="associations-grid">
                                    ${associations.map(assoc => `
                                        <span class="association-chip">${this.escapeHtml(typeof assoc === 'string' ? assoc : assoc.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render archetype-specific content
         */
        renderArchetypeContent(entity) {
            const archetypeType = entity.archetypeType || '';
            const characteristics = entity.characteristics || [];
            const examples = entity.examples || [];
            const manifestations = entity.manifestations || [];
            const shadow = entity.shadow || entity.shadowAspects || [];
            const psychological = entity.psychological || '';

            const hasContent = archetypeType || characteristics.length > 0 || examples.length > 0 ||
                              manifestations.length > 0 || shadow.length > 0 || psychological;

            if (!hasContent) return '';

            return `
                <section class="asset-section asset-archetype-section" id="section-archetype">
                    ${this.renderSectionHeader('Archetype Analysis', '&#127917;', 'archetype')}
                    <div class="section-content ${this.collapsedSections.has('archetype') ? 'collapsed' : ''}">

                        ${archetypeType ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Archetype Category</h4>
                                <span class="archetype-type-badge">${this.escapeHtml(archetypeType)}</span>
                            </div>
                        ` : ''}

                        ${characteristics.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Core Characteristics</h4>
                                <ul class="characteristics-list">
                                    ${characteristics.map(char => `
                                        <li class="characteristic-item">${this.escapeHtml(typeof char === 'string' ? char : char.trait || char.description)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${examples.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Mythological Examples</h4>
                                <div class="examples-grid">
                                    ${examples.map(example => `
                                        <div class="example-card">
                                            <strong>${this.escapeHtml(typeof example === 'string' ? example : example.name)}</strong>
                                            ${typeof example === 'object' && example.mythology ? `
                                                <span class="example-myth">${this.escapeHtml(example.mythology)}</span>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${manifestations.length > 0 ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Manifestations</h4>
                                <ul class="manifestations-list">
                                    ${manifestations.map(man => `
                                        <li class="manifestation-item">${this.escapeHtml(typeof man === 'string' ? man : man.form || man.description)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${shadow.length > 0 ? `
                            <div class="attribute-group shadow-group">
                                <h4 class="attribute-group-title">Shadow Aspects</h4>
                                <ul class="shadow-list">
                                    ${shadow.map(s => `
                                        <li class="shadow-item">${this.escapeHtml(typeof s === 'string' ? s : s.aspect || s.description)}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${psychological ? `
                            <div class="attribute-group">
                                <h4 class="attribute-group-title">Psychological Significance</h4>
                                <div class="psychological-content">
                                    ${this.formatRichText(psychological)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render linguistic section
         */
        renderLinguisticSection(entity) {
            const linguistic = entity.linguistic || {};
            const hasData = linguistic.originalName || linguistic.transliteration ||
                           linguistic.pronunciation || linguistic.etymology ||
                           entity.alternateNames?.length > 0 || entity.epithets?.length > 0 ||
                           entity.meaning;

            if (!hasData) return '';

            return `
                <section class="asset-section asset-linguistic-section" id="section-linguistic">
                    ${this.renderSectionHeader('Linguistic Information', '&#128172;', 'linguistic')}
                    <div class="section-content ${this.collapsedSections.has('linguistic') ? 'collapsed' : ''}">

                        <div class="linguistic-grid">
                            ${linguistic.originalName ? `
                                <div class="linguistic-item">
                                    <span class="linguistic-label">Original Name</span>
                                    <span class="linguistic-value original-script">${this.escapeHtml(linguistic.originalName)}</span>
                                </div>
                            ` : ''}

                            ${linguistic.transliteration ? `
                                <div class="linguistic-item">
                                    <span class="linguistic-label">Transliteration</span>
                                    <span class="linguistic-value">${this.escapeHtml(linguistic.transliteration)}</span>
                                </div>
                            ` : ''}

                            ${linguistic.pronunciation ? `
                                <div class="linguistic-item">
                                    <span class="linguistic-label">Pronunciation</span>
                                    <span class="linguistic-value pronunciation">/${this.escapeHtml(linguistic.pronunciation)}/</span>
                                </div>
                            ` : ''}

                            ${entity.meaning ? `
                                <div class="linguistic-item full-width">
                                    <span class="linguistic-label">Meaning</span>
                                    <span class="linguistic-value">${this.escapeHtml(entity.meaning)}</span>
                                </div>
                            ` : ''}
                        </div>

                        ${linguistic.etymology ? this.renderEtymology(linguistic.etymology) : ''}

                        ${entity.alternateNames?.length > 0 ? `
                            <div class="alternate-names-block">
                                <h4 class="block-title">Alternative Names</h4>
                                <div class="name-tags">
                                    ${entity.alternateNames.map(name => {
                                        const nameStr = typeof name === 'string' ? name : name.name;
                                        const context = typeof name === 'object' ? (name.context || name.language || '') : '';
                                        return `<span class="name-tag" ${context ? `title="${this.escapeAttr(context)}"` : ''}>${this.escapeHtml(nameStr)}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${entity.epithets?.length > 0 ? `
                            <div class="epithets-block">
                                <h4 class="block-title">Epithets &amp; Titles</h4>
                                <ul class="epithets-full-list">
                                    ${entity.epithets.map(epithet => `
                                        <li class="epithet-full-item">"${this.escapeHtml(epithet)}"</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render etymology block
         */
        renderEtymology(etymology) {
            if (!etymology) return '';

            return `
                <div class="etymology-block">
                    <h4 class="block-title">Etymology</h4>
                    <div class="etymology-content">
                        ${etymology.rootLanguage ? `<p><strong>Root Language:</strong> ${this.escapeHtml(etymology.rootLanguage)}</p>` : ''}
                        ${etymology.meaning ? `<p><strong>Meaning:</strong> ${this.escapeHtml(etymology.meaning)}</p>` : ''}
                        ${etymology.derivation ? `<p><strong>Derivation:</strong> ${this.escapeHtml(etymology.derivation)}</p>` : ''}
                        ${etymology.cognates?.length > 0 ? `
                            <div class="cognates-block">
                                <strong>Cognates:</strong>
                                <ul class="cognates-list">
                                    ${etymology.cognates.map(c => `
                                        <li><em>${this.escapeHtml(c.word)}</em> (${this.escapeHtml(c.language)})${c.meaning ? ` - "${this.escapeHtml(c.meaning)}"` : ''}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render geographic section using MetadataGeographic component or fallback
         */
        renderGeographicSection(entity) {
            const geo = entity.geographical || {};
            const hasData = geo.originPoint || geo.primaryLocation || geo.region ||
                           geo.culturalArea || geo.modernCountries?.length > 0 ||
                           geo.spreadPath?.length > 0 || geo.coordinates;

            if (!hasData) return '';

            // Use dedicated component if available
            if (this.geoRenderer) {
                return `
                    <section class="asset-section asset-geographic-section" id="section-geographic">
                        ${this.renderSectionHeader('Geographic Information', '&#127757;', 'geographic')}
                        <div class="section-content ${this.collapsedSections.has('geographic') ? 'collapsed' : ''}">
                            ${this.geoRenderer.render(geo)}
                        </div>
                    </section>
                `;
            }

            // Fallback rendering
            return `
                <section class="asset-section asset-geographic-section" id="section-geographic">
                    ${this.renderSectionHeader('Geographic Information', '&#127757;', 'geographic')}
                    <div class="section-content ${this.collapsedSections.has('geographic') ? 'collapsed' : ''}">

                        <div class="geo-info-grid">
                            ${geo.region ? `
                                <div class="geo-item">
                                    <span class="geo-label">Region</span>
                                    <span class="geo-value">${this.escapeHtml(geo.region)}</span>
                                </div>
                            ` : ''}

                            ${geo.culturalArea ? `
                                <div class="geo-item">
                                    <span class="geo-label">Cultural Area</span>
                                    <span class="geo-value">${this.escapeHtml(geo.culturalArea)}</span>
                                </div>
                            ` : ''}

                            ${geo.modernCountries?.length > 0 ? `
                                <div class="geo-item full-width">
                                    <span class="geo-label">Modern Countries</span>
                                    <span class="geo-value">${geo.modernCountries.map(c => this.escapeHtml(c)).join(', ')}</span>
                                </div>
                            ` : ''}
                        </div>

                        ${this.renderLocationCard(geo.originPoint || geo.primaryLocation)}
                        ${this.renderSpreadPath(geo.spreadPath)}

                        <!-- Map Placeholder -->
                        <div class="map-placeholder" data-geo='${JSON.stringify(geo)}'>
                            <div class="map-placeholder-content">
                                <span class="map-icon" aria-hidden="true">&#127758;</span>
                                <p>Geographic visualization available</p>
                                <button class="btn-load-map" onclick="window.loadGeoMap && window.loadGeoMap(this.parentElement.parentElement)">
                                    Load Map
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        /**
         * Render a location card
         */
        renderLocationCard(location) {
            if (!location) return '';

            const coords = location.coordinates;
            const hasCoords = coords && (coords.latitude !== undefined || coords.lat !== undefined);

            return `
                <div class="location-card">
                    ${location.name ? `<h4 class="location-name">${this.escapeHtml(location.name)}</h4>` : ''}
                    ${location.description ? `<p class="location-description">${this.escapeHtml(location.description)}</p>` : ''}
                    ${location.type ? `<span class="location-type-badge">${this.escapeHtml(location.type)}</span>` : ''}
                    ${location.significance ? `<p class="location-significance"><em>${this.escapeHtml(location.significance)}</em></p>` : ''}
                    ${hasCoords ? `
                        <div class="coordinates-display">
                            <span class="coord-icon" aria-hidden="true">&#128205;</span>
                            <span class="coord-value">${this.formatCoordinates(coords)}</span>
                            ${coords.accuracy ? `<span class="coord-accuracy">(${this.escapeHtml(coords.accuracy)})</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render spread path timeline
         */
        renderSpreadPath(spreadPath) {
            if (!spreadPath || spreadPath.length === 0) return '';

            return `
                <div class="spread-path-block">
                    <h4 class="block-title">Geographic Spread</h4>
                    <div class="spread-timeline">
                        ${spreadPath.map((point, index) => `
                            <div class="spread-point" data-index="${index}">
                                <div class="spread-marker"></div>
                                <div class="spread-content">
                                    ${point.location?.name ? `<strong>${this.escapeHtml(point.location.name)}</strong>` : ''}
                                    ${point.date?.display ? `<span class="spread-date">${this.escapeHtml(point.date.display)}</span>` : ''}
                                    ${point.mechanism ? `<span class="spread-mechanism badge">${this.escapeHtml(point.mechanism)}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render chronological section using MetadataChronological component or fallback
         */
        renderChronologicalSection(entity) {
            const temporal = entity.temporal || {};
            const hasData = temporal.mythologicalDate || temporal.historicalDate ||
                           temporal.firstAttestation || temporal.peakPopularity ||
                           temporal.culturalPeriod || temporal.literaryReferences?.length > 0;

            if (!hasData) return '';

            // Use dedicated component if available
            if (this.chronoRenderer) {
                return `
                    <section class="asset-section asset-chronological-section" id="section-chronological">
                        ${this.renderSectionHeader('Chronological Information', '&#128197;', 'chronological')}
                        <div class="section-content ${this.collapsedSections.has('chronological') ? 'collapsed' : ''}">
                            ${this.chronoRenderer.render(temporal)}
                        </div>
                    </section>
                `;
            }

            // Fallback rendering
            return `
                <section class="asset-section asset-chronological-section" id="section-chronological">
                    ${this.renderSectionHeader('Chronological Information', '&#128197;', 'chronological')}
                    <div class="section-content ${this.collapsedSections.has('chronological') ? 'collapsed' : ''}">

                        <div class="temporal-grid">
                            ${temporal.culturalPeriod ? `
                                <div class="temporal-item">
                                    <span class="temporal-label">Cultural Period</span>
                                    <span class="temporal-value">${this.escapeHtml(temporal.culturalPeriod)}</span>
                                </div>
                            ` : ''}

                            ${temporal.mythologicalDate ? `
                                <div class="temporal-item">
                                    <span class="temporal-label">Mythological Date</span>
                                    <span class="temporal-value">${this.formatDateObject(temporal.mythologicalDate)}</span>
                                </div>
                            ` : ''}

                            ${temporal.historicalDate ? `
                                <div class="temporal-item">
                                    <span class="temporal-label">Historical Date</span>
                                    <span class="temporal-value">${this.formatDateObject(temporal.historicalDate)}</span>
                                </div>
                            ` : ''}
                        </div>

                        ${this.renderFirstAttestation(temporal.firstAttestation)}
                        ${this.renderPeakPopularity(temporal.peakPopularity)}
                        ${this.renderLiteraryReferences(temporal.literaryReferences)}

                        <!-- Timeline Visualization Placeholder -->
                        <div class="timeline-placeholder" data-temporal='${JSON.stringify(temporal)}'>
                            <div class="timeline-vis-content">
                                <span class="timeline-icon" aria-hidden="true">&#128200;</span>
                                <p>Timeline visualization available</p>
                                <button class="btn-load-timeline" onclick="window.loadTimeline && window.loadTimeline(this.parentElement.parentElement)">
                                    Load Timeline
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        /**
         * Render first attestation
         */
        renderFirstAttestation(attestation) {
            if (!attestation) return '';

            return `
                <div class="attestation-card">
                    <h4 class="card-title">First Attestation</h4>
                    ${attestation.date?.display ? `<p><strong>Date:</strong> ${this.escapeHtml(attestation.date.display)}</p>` : ''}
                    ${attestation.source ? `<p><strong>Source:</strong> ${this.escapeHtml(attestation.source)}</p>` : ''}
                    ${attestation.type ? `<span class="attestation-type badge">${this.escapeHtml(attestation.type)}</span>` : ''}
                    ${attestation.confidence ? `<span class="attestation-confidence badge confidence-${attestation.confidence}">${this.escapeHtml(attestation.confidence)}</span>` : ''}
                    ${attestation.description ? `<p class="attestation-desc">${this.escapeHtml(attestation.description)}</p>` : ''}
                </div>
            `;
        }

        /**
         * Render peak popularity
         */
        renderPeakPopularity(peak) {
            if (!peak) return '';

            return `
                <div class="peak-card">
                    <h4 class="card-title">Peak Popularity</h4>
                    ${peak.display ? `<p><strong>Period:</strong> ${this.escapeHtml(peak.display)}</p>` : ''}
                    ${peak.context ? `<p>${this.escapeHtml(peak.context)}</p>` : ''}
                </div>
            `;
        }

        /**
         * Render literary references
         */
        renderLiteraryReferences(references) {
            if (!references || references.length === 0) return '';

            return `
                <div class="literary-refs-block">
                    <h4 class="block-title">Literary References</h4>
                    <ul class="literary-refs-list">
                        ${references.map(ref => `
                            <li class="literary-ref-item">
                                <strong>${this.escapeHtml(ref.work)}</strong>
                                ${ref.author ? ` by ${this.escapeHtml(ref.author)}` : ''}
                                ${ref.date?.display ? ` (${this.escapeHtml(ref.date.display)})` : ''}
                                ${ref.significance ? `<p class="ref-significance">${this.escapeHtml(ref.significance)}</p>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render relationships section using MetadataRelationships component or fallback
         */
        renderRelationshipsSection(entity) {
            const related = entity.relatedEntities || {};
            const family = entity.family || {};

            const hasFamily = family.parents?.length > 0 || family.children?.length > 0 ||
                             family.siblings?.length > 0 || family.consorts?.length > 0;

            const hasRelated = related.deities?.length > 0 || related.heroes?.length > 0 ||
                              related.creatures?.length > 0 || related.places?.length > 0 ||
                              related.items?.length > 0 || related.concepts?.length > 0;

            if (!hasFamily && !hasRelated) return '';

            // Use dedicated component if available
            if (this.relationRenderer) {
                return `
                    <section class="asset-section asset-relationships-section" id="section-relationships">
                        ${this.renderSectionHeader('Relationships', '&#128279;', 'relationships')}
                        <div class="section-content ${this.collapsedSections.has('relationships') ? 'collapsed' : ''}">
                            ${this.relationRenderer.render(entity)}
                        </div>
                    </section>
                `;
            }

            // Fallback rendering
            return `
                <section class="asset-section asset-relationships-section" id="section-relationships">
                    ${this.renderSectionHeader('Relationships', '&#128279;', 'relationships')}
                    <div class="section-content ${this.collapsedSections.has('relationships') ? 'collapsed' : ''}">

                        ${hasFamily ? `
                            <div class="family-block">
                                <h4 class="block-title">Family Tree</h4>

                                <!-- Relationship Graph Placeholder -->
                                <div class="relationship-graph-placeholder" data-family='${JSON.stringify(family)}'>
                                    <div class="graph-placeholder-content">
                                        <span class="graph-icon" aria-hidden="true">&#128101;</span>
                                        <p>Family tree visualization</p>
                                        <button class="btn-load-graph" onclick="window.loadFamilyTree && window.loadFamilyTree(this.parentElement.parentElement)">
                                            Load Family Tree
                                        </button>
                                    </div>
                                </div>

                                <div class="family-grid">
                                    ${family.parents?.length > 0 ? `
                                        <div class="family-group">
                                            <h5 class="family-group-title">Parents</h5>
                                            <div class="family-members">
                                                ${family.parents.map(p => this.renderRelatedEntityLink(p, 'parent')).join('')}
                                            </div>
                                        </div>
                                    ` : ''}

                                    ${family.consorts?.length > 0 ? `
                                        <div class="family-group">
                                            <h5 class="family-group-title">Consorts</h5>
                                            <div class="family-members">
                                                ${family.consorts.map(c => this.renderRelatedEntityLink(c, 'consort')).join('')}
                                            </div>
                                        </div>
                                    ` : ''}

                                    ${family.siblings?.length > 0 ? `
                                        <div class="family-group">
                                            <h5 class="family-group-title">Siblings</h5>
                                            <div class="family-members">
                                                ${family.siblings.map(s => this.renderRelatedEntityLink(s, 'sibling')).join('')}
                                            </div>
                                        </div>
                                    ` : ''}

                                    ${family.children?.length > 0 ? `
                                        <div class="family-group">
                                            <h5 class="family-group-title">Children</h5>
                                            <div class="family-members">
                                                ${family.children.map(c => this.renderRelatedEntityLink(c, 'child')).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${hasRelated ? `
                            <div class="related-entities-block">
                                <h4 class="block-title">Related Entities</h4>
                                <div class="related-entities-grid">
                                    ${this.renderRelatedCategory(related.deities, 'Related Deities', '&#128081;', 'deities')}
                                    ${this.renderRelatedCategory(related.heroes, 'Related Heroes', '&#129409;', 'heroes')}
                                    ${this.renderRelatedCategory(related.creatures, 'Related Creatures', '&#128009;', 'creatures')}
                                    ${this.renderRelatedCategory(related.places, 'Related Places', '&#127963;', 'places')}
                                    ${this.renderRelatedCategory(related.items, 'Related Items', '&#9876;', 'items')}
                                    ${this.renderRelatedCategory(related.concepts, 'Related Concepts', '&#128161;', 'concepts')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render a related entity link
         */
        renderRelatedEntityLink(entity, relation) {
            if (!entity) return '';

            const name = typeof entity === 'string' ? entity : entity.name;
            const id = typeof entity === 'object' ? entity.id : null;
            const url = id ? this.getEntityUrl(entity) : '#';

            return `
                <a href="${this.escapeAttr(url)}" class="related-entity-link" data-relation="${relation}">
                    ${this.escapeHtml(name)}
                </a>
            `;
        }

        /**
         * Render a category of related entities
         */
        renderRelatedCategory(entities, label, icon, type) {
            if (!entities || entities.length === 0) return '';

            return `
                <div class="related-category related-${type}">
                    <h5 class="category-title">${icon} ${label}</h5>
                    <div class="category-entities">
                        ${entities.map(entity => `
                            <a href="${this.getEntityUrl(entity, type)}" class="related-entity-card">
                                ${entity.icon ? `<span class="entity-mini-icon">${this.renderIcon(entity.icon)}</span>` : ''}
                                <span class="entity-name">${this.escapeHtml(entity.name)}</span>
                                ${entity.relationship ? `<span class="entity-relationship">${this.escapeHtml(entity.relationship)}</span>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render metaphysical section
         */
        renderMetaphysicalSection(entity) {
            const meta = entity.metaphysicalProperties || {};
            const hasData = meta.primaryElement || meta.element || meta.domains?.length > 0 ||
                           meta.energyType || meta.chakra || meta.planet ||
                           meta.zodiac?.length > 0 || meta.sefirot?.length > 0;

            if (!hasData) return '';

            return `
                <section class="asset-section asset-metaphysical-section" id="section-metaphysical">
                    ${this.renderSectionHeader('Metaphysical Properties', '&#10024;', 'metaphysical')}
                    <div class="section-content ${this.collapsedSections.has('metaphysical') ? 'collapsed' : ''}">

                        <div class="metaphysical-grid">
                            ${meta.primaryElement || meta.element ? `
                                <div class="meta-item">
                                    <span class="meta-label">Element</span>
                                    <span class="meta-value element-${(meta.primaryElement || meta.element).toLowerCase()}">${this.capitalize(meta.primaryElement || meta.element)}</span>
                                </div>
                            ` : ''}

                            ${meta.energyType ? `
                                <div class="meta-item">
                                    <span class="meta-label">Energy Type</span>
                                    <span class="meta-value">${this.capitalize(meta.energyType)}</span>
                                </div>
                            ` : ''}

                            ${meta.chakra ? `
                                <div class="meta-item">
                                    <span class="meta-label">Chakra</span>
                                    <span class="meta-value chakra-${meta.chakra}">${this.formatChakra(meta.chakra)}</span>
                                </div>
                            ` : ''}

                            ${meta.planet ? `
                                <div class="meta-item">
                                    <span class="meta-label">Planet</span>
                                    <span class="meta-value">${this.formatPlanet(meta.planet)}</span>
                                </div>
                            ` : ''}
                        </div>

                        ${meta.domains?.length > 0 ? `
                            <div class="domains-block">
                                <h4 class="block-title">Domains</h4>
                                <div class="domain-chips">
                                    ${meta.domains.map(d => `<span class="domain-chip">${this.escapeHtml(d)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${meta.zodiac?.length > 0 ? `
                            <div class="zodiac-block">
                                <h4 class="block-title">Zodiac Associations</h4>
                                <div class="zodiac-chips">
                                    ${meta.zodiac.map(z => `<span class="zodiac-chip">${this.formatZodiac(z)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${meta.sefirot?.length > 0 ? `
                            <div class="sefirot-block">
                                <h4 class="block-title">Kabbalistic Sefirot</h4>
                                <div class="sefirot-chips">
                                    ${meta.sefirot.map(s => `<span class="sefirah-chip">${this.capitalize(s)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render cultural section
         */
        renderCulturalSection(entity) {
            const cultural = entity.cultural || {};
            const hasData = cultural.worshipPractices?.length > 0 || cultural.festivals?.length > 0 ||
                           cultural.cultCenters?.length > 0 || cultural.rituals?.length > 0 ||
                           cultural.socialRole || cultural.modernLegacy;

            if (!hasData) return '';

            return `
                <section class="asset-section asset-cultural-section" id="section-cultural">
                    ${this.renderSectionHeader('Cultural Context', '&#127963;', 'cultural')}
                    <div class="section-content ${this.collapsedSections.has('cultural') ? 'collapsed' : ''}">

                        ${cultural.socialRole ? `
                            <div class="social-role-block">
                                <h4 class="block-title">Social Role</h4>
                                <p>${this.escapeHtml(cultural.socialRole)}</p>
                            </div>
                        ` : ''}

                        ${cultural.worshipPractices?.length > 0 ? `
                            <div class="worship-block">
                                <h4 class="block-title">Worship Practices</h4>
                                <ul class="worship-list">
                                    ${cultural.worshipPractices.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${cultural.festivals?.length > 0 ? `
                            <div class="festivals-block">
                                <h4 class="block-title">Associated Festivals</h4>
                                <div class="festivals-grid">
                                    ${cultural.festivals.map(f => `
                                        <div class="festival-card">
                                            <span class="festival-icon" aria-hidden="true">&#127881;</span>
                                            <span class="festival-name">${this.escapeHtml(typeof f === 'string' ? f : f.name)}</span>
                                            ${typeof f === 'object' && f.date ? `<span class="festival-date">${this.escapeHtml(f.date)}</span>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${cultural.cultCenters?.length > 0 ? `
                            <div class="cult-centers-block">
                                <h4 class="block-title">Cult Centers</h4>
                                <div class="cult-center-chips">
                                    ${cultural.cultCenters.map(c => `
                                        <span class="cult-center-chip">
                                            <span class="center-icon" aria-hidden="true">&#127963;</span>
                                            ${this.escapeHtml(c)}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${cultural.modernLegacy ? `
                            <div class="modern-legacy-block">
                                <h4 class="block-title">Modern Legacy</h4>
                                ${this.renderModernLegacy(cultural.modernLegacy)}
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render modern legacy
         */
        renderModernLegacy(legacy) {
            if (typeof legacy === 'string') {
                return `<p>${this.escapeHtml(legacy)}</p>`;
            }

            return `
                <div class="legacy-grid">
                    ${legacy.literature ? `<div class="legacy-item"><span class="legacy-label">Literature</span><span class="legacy-value">${this.escapeHtml(legacy.literature)}</span></div>` : ''}
                    ${legacy.philosophy ? `<div class="legacy-item"><span class="legacy-label">Philosophy</span><span class="legacy-value">${this.escapeHtml(legacy.philosophy)}</span></div>` : ''}
                    ${legacy.art ? `<div class="legacy-item"><span class="legacy-label">Art</span><span class="legacy-value">${this.escapeHtml(legacy.art)}</span></div>` : ''}
                    ${legacy.popCulture ? `<div class="legacy-item"><span class="legacy-label">Pop Culture</span><span class="legacy-value">${this.escapeHtml(legacy.popCulture)}</span></div>` : ''}
                </div>
            `;
        }

        /**
         * Render image gallery section
         */
        renderGallerySection(entity) {
            const images = entity.images || entity.gallery || [];
            const primaryImage = entity.primaryImage || entity.image;

            if (!primaryImage && images.length === 0) return '';

            const allImages = primaryImage ? [primaryImage, ...images] : images;

            return `
                <section class="asset-section asset-gallery-section" id="section-gallery">
                    ${this.renderSectionHeader('Image Gallery', '&#128247;', 'gallery')}
                    <div class="section-content ${this.collapsedSections.has('gallery') ? 'collapsed' : ''}">
                        <div class="gallery-grid">
                            ${allImages.map((img, i) => {
                                const src = typeof img === 'string' ? img : img.url;
                                const caption = typeof img === 'object' ? img.caption || img.alt : '';
                                return `
                                    <div class="gallery-item" data-index="${i}">
                                        <img src="${this.escapeAttr(src)}"
                                             alt="${this.escapeAttr(caption || `Image ${i + 1}`)}"
                                             loading="lazy"
                                             class="gallery-image"
                                             data-src="${this.escapeAttr(src)}"
                                             data-caption="${this.escapeAttr(caption)}" />
                                        ${caption ? `<p class="gallery-caption">${this.escapeHtml(caption)}</p>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </section>
            `;
        }

        /**
         * Render sources section
         */
        renderSourcesSection(entity) {
            const sources = entity.sources || [];
            if (sources.length === 0) return '';

            return `
                <section class="asset-section asset-sources-section" id="section-sources">
                    ${this.renderSectionHeader('Sources &amp; References', '&#128218;', 'sources')}
                    <div class="section-content ${this.collapsedSections.has('sources') ? 'collapsed' : ''}">
                        <div class="sources-list">
                            ${sources.map(source => this.renderSourceItem(source)).join('')}
                        </div>
                    </div>
                </section>
            `;
        }

        /**
         * Render a single source item
         */
        renderSourceItem(source) {
            if (typeof source === 'string') {
                return `<div class="source-item source-simple">${this.escapeHtml(source)}</div>`;
            }

            return `
                <div class="source-item source-detailed">
                    <div class="source-header">
                        <span class="source-title">${this.escapeHtml(source.text || source.title)}</span>
                        ${source.author ? `<span class="source-author">by ${this.escapeHtml(source.author)}</span>` : ''}
                    </div>
                    ${source.passage ? `
                        <blockquote class="source-passage">${this.escapeHtml(source.passage)}</blockquote>
                    ` : ''}
                    ${source.description ? `<p class="source-description">${this.escapeHtml(source.description)}</p>` : ''}
                    <div class="source-meta">
                        ${source.mythology ? `<span class="source-mythology badge">${this.capitalize(source.mythology)}</span>` : ''}
                        ${source.corpusUrl || source.url ? `
                            <a href="${this.escapeAttr(source.corpusUrl || source.url)}" class="source-link" target="_blank" rel="noopener">
                                View in Corpus <span aria-hidden="true">&#8599;</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render corpus queries section
         */
        renderCorpusSection(entity) {
            const queries = entity.corpusQueries || [];
            if (queries.length === 0) return '';

            return `
                <section class="asset-section asset-corpus-section" id="section-corpus">
                    ${this.renderSectionHeader('Research Queries', '&#128269;', 'corpus')}
                    <div class="section-content ${this.collapsedSections.has('corpus') ? 'collapsed' : ''}">
                        <p class="section-intro">Explore primary sources and related texts with these curated searches:</p>
                        <div class="corpus-queries-grid">
                            ${queries.map(query => `
                                <div class="corpus-query-card" data-query-id="${this.escapeAttr(query.id)}">
                                    <h4 class="query-label">${this.escapeHtml(query.label)}</h4>
                                    ${query.description ? `<p class="query-description">${this.escapeHtml(query.description)}</p>` : ''}
                                    ${query.category ? `<span class="query-category badge">${this.escapeHtml(query.category)}</span>` : ''}
                                    <button class="btn-run-query" onclick="window.runCorpusQuery && window.runCorpusQuery('${this.escapeAttr(query.id)}')">
                                        Run Search
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            `;
        }

        /**
         * Render quick info sidebar
         */
        renderQuickInfoSidebar(entity) {
            return `
                <div class="sidebar-section sidebar-quick-info">
                    <h3 class="sidebar-title">Quick Info</h3>
                    <dl class="quick-info-list">
                        <dt>Type</dt>
                        <dd>${this.formatType(entity.type)}</dd>

                        <dt>Mythology</dt>
                        <dd>${this.capitalize(entity.primaryMythology || entity.mythology || 'Unknown')}</dd>

                        ${entity.mythologies?.length > 1 ? `
                            <dt>Also in</dt>
                            <dd>${entity.mythologies.filter(m => m !== entity.primaryMythology).map(m => this.capitalize(m)).join(', ')}</dd>
                        ` : ''}

                        ${entity.temporal?.culturalPeriod ? `
                            <dt>Period</dt>
                            <dd>${this.escapeHtml(entity.temporal.culturalPeriod)}</dd>
                        ` : ''}

                        ${entity.geographical?.region ? `
                            <dt>Region</dt>
                            <dd>${this.escapeHtml(entity.geographical.region)}</dd>
                        ` : ''}
                    </dl>
                </div>
            `;
        }

        /**
         * Render tags sidebar
         */
        renderTagsSidebar(entity) {
            const tags = entity.tags || [];
            if (tags.length === 0) return '';

            return `
                <div class="sidebar-section sidebar-tags">
                    <h3 class="sidebar-title">Tags</h3>
                    <div class="tags-cloud">
                        ${tags.map(tag => `<span class="entity-tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render metadata sidebar
         */
        renderMetadataSidebar(entity) {
            const meta = entity.metadata || {};
            const colors = entity.colors || {};

            return `
                ${meta.version || meta.contributor || meta.completeness !== undefined || meta.lastModified ? `
                    <div class="sidebar-section sidebar-metadata">
                        <h3 class="sidebar-title">Entry Info</h3>
                        <dl class="metadata-list">
                            ${meta.version ? `<dt>Version</dt><dd>${this.escapeHtml(meta.version)}</dd>` : ''}
                            ${meta.contributor ? `<dt>Contributor</dt><dd>${this.escapeHtml(meta.contributor)}</dd>` : ''}
                            ${meta.completeness !== undefined ? `
                                <dt>Completeness</dt>
                                <dd>
                                    <div class="completeness-bar" title="${meta.completeness}% complete">
                                        <div class="completeness-fill" style="width: ${meta.completeness}%"></div>
                                    </div>
                                    <span class="completeness-text">${meta.completeness}%</span>
                                </dd>
                            ` : ''}
                            ${meta.lastModified ? `<dt>Updated</dt><dd>${this.formatDate(meta.lastModified)}</dd>` : ''}
                        </dl>
                    </div>
                ` : ''}

                ${colors.primary || colors.secondary ? `
                    <div class="sidebar-section sidebar-colors">
                        <h3 class="sidebar-title">Visual Theme</h3>
                        <div class="color-swatches">
                            ${colors.primary ? `<div class="color-swatch" style="background: ${colors.primary}" title="Primary: ${colors.primary}"></div>` : ''}
                            ${colors.secondary ? `<div class="color-swatch" style="background: ${colors.secondary}" title="Secondary: ${colors.secondary}"></div>` : ''}
                        </div>
                    </div>
                ` : ''}
            `;
        }

        /**
         * Render section header with collapsible toggle
         */
        renderSectionHeader(title, icon, sectionId) {
            const isCollapsed = this.collapsedSections.has(sectionId);
            return `
                <header class="section-header" data-section="${sectionId}">
                    <h2 class="section-title">
                        <span class="section-icon" aria-hidden="true">${icon}</span>
                        ${title}
                    </h2>
                    <button class="section-toggle"
                            aria-expanded="${!isCollapsed}"
                            aria-controls="section-${sectionId}"
                            title="${isCollapsed ? 'Expand' : 'Collapse'} section">
                        <span class="toggle-icon" aria-hidden="true">${isCollapsed ? '&#9654;' : '&#9660;'}</span>
                    </button>
                </header>
            `;
        }

        // ==================== UTILITY METHODS ====================

        /**
         * Format rich text with basic markdown support
         */
        formatRichText(text) {
            if (!text) return '';

            // Split into paragraphs
            const paragraphs = text.split(/\n\n+/);

            return paragraphs.map(p => {
                // Handle headers
                if (p.startsWith('### ')) {
                    return `<h4>${this.escapeHtml(p.substring(4))}</h4>`;
                }
                if (p.startsWith('## ')) {
                    return `<h3>${this.escapeHtml(p.substring(3))}</h3>`;
                }
                if (p.startsWith('# ')) {
                    return `<h2>${this.escapeHtml(p.substring(2))}</h2>`;
                }

                // Handle lists
                if (p.startsWith('- ') || p.startsWith('* ')) {
                    const items = p.split('\n').filter(line => line.match(/^[-*] /));
                    return `<ul>${items.map(item => `<li>${this.escapeHtml(item.substring(2))}</li>`).join('')}</ul>`;
                }

                // Handle numbered lists
                if (p.match(/^\d+\. /)) {
                    const items = p.split('\n').filter(line => line.match(/^\d+\. /));
                    return `<ol>${items.map(item => `<li>${this.escapeHtml(item.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
                }

                // Regular paragraph with inline formatting
                let formatted = this.escapeHtml(p);
                formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
                formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');

                return `<p>${formatted}</p>`;
            }).join('\n');
        }

        /**
         * Get type icon
         */
        getTypeIcon(type) {
            const icons = {
                'deity': '&#128081;',
                'deities': '&#128081;',
                'creature': '&#128009;',
                'creatures': '&#128009;',
                'hero': '&#129409;',
                'heroes': '&#129409;',
                'item': '&#9876;',
                'items': '&#9876;',
                'place': '&#127963;',
                'places': '&#127963;',
                'herb': '&#127807;',
                'herbs': '&#127807;',
                'ritual': '&#128722;',
                'rituals': '&#128722;',
                'text': '&#128220;',
                'texts': '&#128220;',
                'symbol': '&#10070;',
                'symbols': '&#10070;',
                'archetype': '&#127917;',
                'archetypes': '&#127917;'
            };
            return icons[type?.toLowerCase()] || '&#9733;';
        }

        /**
         * Get mythology icon
         */
        getMythologyIcon(mythology) {
            const icons = {
                'greek': '&#127988;',
                'roman': '&#127963;',
                'norse': '&#9874;',
                'egyptian': '&#128166;',
                'celtic': '&#9752;',
                'hindu': '&#128330;',
                'japanese': '&#127843;',
                'chinese': '&#128009;',
                'mesopotamian': '&#9734;',
                'mesoamerican': '&#127774;'
            };
            return icons[mythology?.toLowerCase()] || '&#127760;';
        }

        /**
         * Format entity type for display
         */
        formatType(type) {
            if (!type) return 'Entity';
            const singular = type.replace(/s$/, '');
            return this.capitalize(singular);
        }

        /**
         * Check if string is SVG
         */
        isSvg(str) {
            if (!str || typeof str !== 'string') return false;
            return str.trim().toLowerCase().startsWith('<svg');
        }

        /**
         * Render icon (SVG or text)
         */
        renderIcon(icon) {
            if (!icon) return '';
            if (this.isSvg(icon)) return icon;
            return this.escapeHtml(icon);
        }

        /**
         * Format coordinates
         */
        formatCoordinates(coords) {
            const lat = coords.latitude ?? coords.lat;
            const lng = coords.longitude ?? coords.lng;
            if (lat === undefined || lng === undefined) return 'Unknown';

            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';
            return `${Math.abs(lat).toFixed(4)}${latDir}, ${Math.abs(lng).toFixed(4)}${lngDir}`;
        }

        /**
         * Format date object
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
         * Format date string
         */
        formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
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
         * Format planet with symbol
         */
        formatPlanet(planet) {
            const planetSymbols = {
                'sun': '&#9737; Sun',
                'moon': '&#9789; Moon',
                'mercury': '&#9791; Mercury',
                'venus': '&#9792; Venus',
                'mars': '&#9794; Mars',
                'jupiter': '&#9795; Jupiter',
                'saturn': '&#9796; Saturn'
            };
            return planetSymbols[planet?.toLowerCase()] || this.capitalize(planet);
        }

        /**
         * Format zodiac with symbol
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
         * Get entity URL
         */
        getEntityUrl(entity, type) {
            if (entity.url) return entity.url;
            const mythology = entity.mythology || 'shared';
            const entityType = type?.replace(/s$/, '') || entity.type || 'entity';
            return `${this.baseUrl}#/mythos/${mythology}/${entityType}s/${entity.id}`;
        }

        /**
         * Convert hex to RGB
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
            }
            return '102, 126, 234';
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
        }

        /**
         * Escape HTML
         */
        escapeHtml(text) {
            if (!text) return '';
            if (typeof text !== 'string') text = String(text);
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Escape attribute value
         */
        escapeAttr(text) {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /**
         * Render error state
         */
        renderError(message) {
            return `
                <div class="asset-error-container">
                    <div class="error-icon" aria-hidden="true">&#9888;</div>
                    <h2>Error Loading Asset</h2>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }

        /**
         * Load collapse state from sessionStorage
         */
        loadCollapseState() {
            try {
                const saved = sessionStorage.getItem('assetPanelCollapsed');
                if (saved) {
                    this.collapsedSections = new Set(JSON.parse(saved));
                }
            } catch (e) {
                // Ignore errors
            }
        }

        /**
         * Save collapse state to sessionStorage
         */
        saveCollapseState() {
            try {
                sessionStorage.setItem('assetPanelCollapsed', JSON.stringify([...this.collapsedSections]));
            } catch (e) {
                // Ignore errors
            }
        }

        /**
         * Toggle section collapse
         */
        toggleSection(sectionId) {
            if (this.collapsedSections.has(sectionId)) {
                this.collapsedSections.delete(sectionId);
            } else {
                this.collapsedSections.add(sectionId);
            }
            this.saveCollapseState();

            if (this.onSectionToggle) {
                this.onSectionToggle(sectionId, this.collapsedSections.has(sectionId));
            }
        }

        /**
         * Attach event listeners to rendered panel
         */
        attachEventListeners() {
            const panel = document.querySelector('.asset-detail-panel');
            if (!panel) return;

            // Section toggle handlers
            panel.querySelectorAll('.section-toggle').forEach(btn => {
                btn.addEventListener('click', () => {
                    const header = btn.closest('.section-header');
                    const sectionId = header?.dataset.section;
                    if (sectionId) {
                        this.toggleSection(sectionId);
                        const content = header.nextElementSibling;
                        if (content?.classList.contains('section-content')) {
                            content.classList.toggle('collapsed');
                        }
                        const icon = btn.querySelector('.toggle-icon');
                        if (icon) {
                            icon.innerHTML = this.collapsedSections.has(sectionId) ? '&#9654;' : '&#9660;';
                        }
                        btn.setAttribute('aria-expanded', !this.collapsedSections.has(sectionId));
                    }
                });
            });

            // Gallery lightbox
            panel.querySelectorAll('.gallery-image').forEach(img => {
                img.addEventListener('click', () => {
                    this.openLightbox(img.dataset.src, img.dataset.caption);
                });
            });

            // Quick action handlers
            panel.querySelectorAll('.quick-action-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    this.handleQuickAction(action, panel.dataset.entityId);
                });
            });
        }

        /**
         * Open lightbox for image
         */
        openLightbox(src, caption) {
            const lightbox = document.createElement('div');
            lightbox.className = 'asset-lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Image viewer">
                    <button class="lightbox-close" aria-label="Close">&times;</button>
                    <div class="lightbox-content">
                        <img src="${this.escapeAttr(src)}" alt="${this.escapeAttr(caption || 'Asset image')}" />
                        ${caption ? `<p class="lightbox-caption">${this.escapeHtml(caption)}</p>` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(lightbox);
            document.body.classList.add('lightbox-open');

            const close = () => {
                lightbox.classList.add('closing');
                setTimeout(() => {
                    lightbox.remove();
                    document.body.classList.remove('lightbox-open');
                }, 200);
            };

            lightbox.querySelector('.lightbox-overlay').addEventListener('click', (e) => {
                if (e.target === e.currentTarget || e.target.classList.contains('lightbox-close')) {
                    close();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') close();
            }, { once: true });

            requestAnimationFrame(() => lightbox.classList.add('open'));
        }

        /**
         * Handle quick action button clicks
         */
        handleQuickAction(action, entityId) {
            switch (action) {
                case 'bookmark':
                    window.dispatchEvent(new CustomEvent('entity:bookmark', { detail: { entityId } }));
                    break;
                case 'share':
                    if (navigator.share) {
                        navigator.share({
                            title: document.title,
                            url: window.location.href
                        });
                    } else {
                        navigator.clipboard?.writeText(window.location.href);
                        window.dispatchEvent(new CustomEvent('toast:show', {
                            detail: { message: 'Link copied to clipboard', type: 'success' }
                        }));
                    }
                    break;
                case 'edit':
                    window.dispatchEvent(new CustomEvent('entity:edit', { detail: { entityId } }));
                    break;
                case 'cite':
                    window.dispatchEvent(new CustomEvent('entity:cite', { detail: { entityId } }));
                    break;
            }
        }
    }

    // Export to window
    window.AssetDetailPanel = AssetDetailPanel;

})();
