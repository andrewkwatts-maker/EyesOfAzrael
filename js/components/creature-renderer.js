/**
 * Creature Renderer Component - Polished Version
 *
 * Dynamically loads and renders creature/monster/being content from Firebase
 * Supports: physical description, abilities, habitat, myths, encounters
 *
 * Features:
 * - Type badge (dragon, serpent, chimera, etc.) with type-specific styling
 * - Habitat/realm indication with visual cards
 * - Powers/abilities as detailed cards with icons
 * - Associated mythology prominently shown
 * - Description with truncation
 * - Danger rating indicator with visual feedback
 * - Polished card-based layout
 * - Animated section reveals
 * - Mobile-friendly responsive design
 * - Accessible markup with proper ARIA
 * - Visual hierarchy with icons
 * - Content distinction (Official vs Community)
 * - Origin/lore showcase section
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

        // Creature type icons mapping with expanded categories
        this.creatureTypeIcons = {
            dragon: '\u{1F409}',      // dragon
            serpent: '\u{1F40D}',     // snake
            chimera: '\u{1F479}',     // ogre/chimera
            beast: '\u{1F43B}',       // bear/beast
            bird: '\u{1F985}',        // eagle
            phoenix: '\u{1F525}',     // fire (phoenix)
            aquatic: '\u{1F419}',     // octopus
            sea: '\u{1F30A}',         // wave
            undead: '\u{1F480}',      // skull
            spirit: '\u{1F47B}',      // ghost
            ghost: '\u{1F47B}',       // ghost
            giant: '\u{1F9D4}',       // person
            titan: '\u26C8\uFE0F',    // cloud with lightning
            humanoid: '\u{1F9DC}',    // merperson
            shapeshifter: '\u{1F3AD}', // masks
            elemental: '\u{1F525}',   // fire
            guardian: '\u{1F6E1}',    // shield
            protector: '\u{1F6E1}',   // shield
            hybrid: '\u{1FAB6}',      // feather
            divine: '\u2728',         // sparkles
            celestial: '\u2B50',      // star
            demonic: '\u{1F608}',     // smiling imp
            demon: '\u{1F47F}',       // angry imp
            mythic: '\u{1F31F}',      // glowing star
            trickster: '\u{1F3AD}',   // masks
            wolf: '\u{1F43A}',        // wolf
            cat: '\u{1F408}',         // cat
            horse: '\u{1F40E}',       // horse
            insect: '\u{1F41C}',      // ant
            plant: '\u{1F33F}',       // herb
            construct: '\u{1F916}',   // robot
            golem: '\u{1F5FF}',       // moai
            fairy: '\u{1F9DA}',       // fairy
            nymph: '\u{1F33A}',       // hibiscus
            vampire: '\u{1F9DB}',     // vampire
            werewolf: '\u{1F43A}',    // wolf
            mummy: '\u{1F9DF}',       // zombie
            sphinx: '\u{1F981}',      // lion
            centaur: '\u{1F40E}',     // horse
            minotaur: '\u{1F402}',    // ox
            default: '\u{1F432}'      // dragon face
        };

        // Habitat icons mapping with expanded locations
        this.habitatIcons = {
            underworld: '\u{1F525}',
            hell: '\u{1F525}',
            hades: '\u{1F480}',
            ocean: '\u{1F30A}',
            sea: '\u{1F30A}',
            deep: '\u{1F30A}',
            mountain: '\u26F0\uFE0F',
            peak: '\u26F0\uFE0F',
            forest: '\u{1F332}',
            wood: '\u{1F332}',
            jungle: '\u{1F334}',
            sky: '\u2601\uFE0F',
            air: '\u{1F4A8}',
            heaven: '\u2728',
            cave: '\u{1F5FF}',
            cavern: '\u{1F5FF}',
            swamp: '\u{1F33F}',
            marsh: '\u{1F33F}',
            bog: '\u{1F33F}',
            desert: '\u{1F3DC}\uFE0F',
            wasteland: '\u{1F3DC}\uFE0F',
            river: '\u{1F4A7}',
            lake: '\u{1F4A7}',
            island: '\u{1F3DD}\uFE0F',
            labyrinth: '\u{1F3DB}\uFE0F',
            maze: '\u{1F3DB}\uFE0F',
            realm: '\u2728',
            dimension: '\u{1F30C}',
            void: '\u{1F311}',
            arctic: '\u2744\uFE0F',
            ice: '\u2744\uFE0F',
            volcano: '\u{1F30B}',
            fire: '\u{1F525}',
            ruins: '\u{1F3DB}\uFE0F',
            temple: '\u{1F3DB}\uFE0F',
            cemetery: '\u{1FAA6}',
            graveyard: '\u{1FAA6}',
            default: '\u{1F30D}'
        };

        // Creature type color themes for styling
        this.creatureTypeColors = {
            dragon: { primary: '#FF6B35', secondary: '#F7931E', glow: 'rgba(255, 107, 53, 0.3)' },
            serpent: { primary: '#4CAF50', secondary: '#8BC34A', glow: 'rgba(76, 175, 80, 0.3)' },
            chimera: { primary: '#9C27B0', secondary: '#E91E63', glow: 'rgba(156, 39, 176, 0.3)' },
            beast: { primary: '#795548', secondary: '#A1887F', glow: 'rgba(121, 85, 72, 0.3)' },
            bird: { primary: '#00BCD4', secondary: '#4DD0E1', glow: 'rgba(0, 188, 212, 0.3)' },
            phoenix: { primary: '#FF5722', secondary: '#FFAB40', glow: 'rgba(255, 87, 34, 0.4)' },
            aquatic: { primary: '#2196F3', secondary: '#64B5F6', glow: 'rgba(33, 150, 243, 0.3)' },
            undead: { primary: '#37474F', secondary: '#78909C', glow: 'rgba(55, 71, 79, 0.3)' },
            spirit: { primary: '#B39DDB', secondary: '#D1C4E9', glow: 'rgba(179, 157, 219, 0.4)' },
            giant: { primary: '#5D4037', secondary: '#8D6E63', glow: 'rgba(93, 64, 55, 0.3)' },
            humanoid: { primary: '#00897B', secondary: '#4DB6AC', glow: 'rgba(0, 137, 123, 0.3)' },
            shapeshifter: { primary: '#7C4DFF', secondary: '#B388FF', glow: 'rgba(124, 77, 255, 0.3)' },
            elemental: { primary: '#FF9800', secondary: '#FFB74D', glow: 'rgba(255, 152, 0, 0.3)' },
            guardian: { primary: '#FFD700', secondary: '#FFF176', glow: 'rgba(255, 215, 0, 0.3)' },
            divine: { primary: '#FFC107', secondary: '#FFE082', glow: 'rgba(255, 193, 7, 0.4)' },
            demonic: { primary: '#B71C1C', secondary: '#E53935', glow: 'rgba(183, 28, 28, 0.3)' },
            mythic: { primary: '#673AB7', secondary: '#9575CD', glow: 'rgba(103, 58, 183, 0.3)' },
            fairy: { primary: '#E91E63', secondary: '#F48FB1', glow: 'rgba(233, 30, 99, 0.3)' },
            default: { primary: '#667eea', secondary: '#764ba2', glow: 'rgba(102, 126, 234, 0.3)' }
        };

        // Danger level configurations
        this.dangerLevels = {
            extreme: { color: '#B71C1C', icon: '\u2620\uFE0F', bars: 5, label: 'Extremely Dangerous' },
            deadly: { color: '#C62828', icon: '\u26A0\uFE0F', bars: 5, label: 'Deadly' },
            high: { color: '#E53935', icon: '\u26A0\uFE0F', bars: 4, label: 'High Danger' },
            dangerous: { color: '#EF5350', icon: '\u26A0\uFE0F', bars: 4, label: 'Dangerous' },
            moderate: { color: '#FF9800', icon: '\u{1F536}', bars: 3, label: 'Moderate Danger' },
            medium: { color: '#FFA726', icon: '\u{1F536}', bars: 3, label: 'Medium Risk' },
            low: { color: '#4CAF50', icon: '\u{1F7E2}', bars: 2, label: 'Low Danger' },
            mild: { color: '#66BB6A', icon: '\u{1F7E2}', bars: 2, label: 'Mild' },
            harmless: { color: '#81C784', icon: '\u2714\uFE0F', bars: 1, label: 'Generally Harmless' },
            unknown: { color: '#9E9E9E', icon: '\u2753', bars: 0, label: 'Unknown' }
        };

        // Ability type icons for detailed ability cards
        this.abilityTypeIcons = {
            offensive: '\u2694\uFE0F',
            defensive: '\u{1F6E1}\uFE0F',
            passive: '\u{1F504}',
            magical: '\u2728',
            physical: '\u{1F4AA}',
            elemental: '\u{1F525}',
            psychic: '\u{1F9E0}',
            healing: '\u2764\uFE0F',
            movement: '\u{1F4A8}',
            transformation: '\u{1F3AD}',
            default: '\u26A1'
        };
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
        container.innerHTML = `
            <div class="loading-state creature-loading">
                <div class="loading-spinner-ring"></div>
                <p class="loading-text">Summoning creature data...</p>
            </div>`;

        this.animationDelay = 0;
        const creature = await this.fetchCreature(mythology, entityId);

        if (!creature) {
            container.innerHTML = `
                <div class="error-state creature-error">
                    <span class="error-icon" aria-hidden="true">\u26A0\uFE0F</span>
                    <p class="error-text">Creature data not found. Content will load from HTML.</p>
                </div>`;
            return;
        }

        // Determine content source for distinction styling
        const contentSource = creature.source || (creature.createdBy ? 'community' : 'official');

        // Make container position relative for edit icon
        container.style.position = 'relative';
        container.classList.add('creature-detail-container');
        container.setAttribute('data-content-source', contentSource);

        let html = `<article class="creature-detail-article entity-card--creature ${contentSource === 'official' ? 'official' : 'user-submitted'}">`;

        // Content source badge
        html += this.renderContentSourceBadge(contentSource, creature.createdBy);

        // Add edit icon if allowed and user owns entity
        if (allowEdit && this.canUserEdit(creature)) {
            html += this.renderEditIcon(entityId, 'creatures');
        }

        // Header section with type badge and mythology
        html += this.renderHeader(creature);

        // Quick info bar (type, habitat, mythology)
        html += this.renderQuickInfoBar(creature);

        // Image gallery
        if (creature.images && creature.images.length > 0) {
            html += this.renderImageGallery(creature.images);
        }

        // Physical description (Appearance section)
        if (creature.physicalDescription) {
            html += this.renderPhysicalDescription(creature.physicalDescription);
        }

        // Abilities and powers (as pills, max 5 visible)
        if (creature.abilities && creature.abilities.length > 0) {
            html += this.renderAbilities(creature.abilities);
        }

        // Habitat
        if (creature.habitat) {
            html += this.renderHabitat(creature.habitat);
        }

        // Origin story (Mythology section)
        if (creature.origin) {
            html += this.renderOrigin(creature.origin);
        }

        // Famous encounters (Stories section)
        if (creature.encounters && creature.encounters.length > 0) {
            html += this.renderEncounters(creature.encounters);
        }

        // Related myths/stories
        if (creature.relatedMyths && creature.relatedMyths.length > 0) {
            html += this.renderRelatedMyths(creature.relatedMyths);
        }

        // Symbolism
        if (creature.symbolism) {
            html += this.renderSymbolism(creature.symbolism);
        }

        // Weaknesses (if any)
        if (creature.weaknesses && creature.weaknesses.length > 0) {
            html += this.renderWeaknesses(creature.weaknesses);
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

        html += '</article>';
        container.innerHTML = html;

        // Initialize expand/collapse for abilities
        this.initAbilitiesExpand(container);
    }

    /**
     * Render content source badge
     */
    renderContentSourceBadge(source, createdBy) {
        if (source === 'official') {
            return `
                <div class="content-source-badge content-source-badge--official">
                    <span class="badge-icon" aria-hidden="true">\u2713</span>
                    <span class="badge-text">Official Content</span>
                </div>`;
        } else {
            return `
                <div class="content-source-badge content-source-badge--community">
                    <span class="badge-icon" aria-hidden="true">\u{1F465}</span>
                    <span class="badge-text">Community Contribution</span>
                    ${createdBy ? `<span class="badge-author">by ${this.escapeHtml(createdBy)}</span>` : ''}
                </div>`;
        }
    }

    /**
     * Render image gallery
     */
    renderImageGallery(images) {
        if (!images || images.length === 0) return '';

        const galleries = this.groupImagesByCategory(images);
        let html = `<section class="creature-gallery detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F5BC}\uFE0F</span>
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
     * Render header with title, type badge, and description
     */
    renderHeader(creature) {
        const typeIcon = this.getCreatureTypeIcon(creature.creatureType);
        const mythologyIcon = this.getMythologyIcon(creature.mythology);

        return `
            <header class="creature-header detail-header" ${this.getAnimationStyle()}>
                <div class="creature-icon-large" aria-hidden="true">
                    <span class="icon-float creature-icon-glow">${creature.icon || '\u{1F409}'}</span>
                </div>
                <div class="creature-header-content">
                    <h1 class="creature-title">${this.escapeHtml(creature.name)}</h1>
                    ${creature.subtitle ? `<p class="creature-subtitle">${this.escapeHtml(creature.subtitle)}</p>` : ''}

                    <div class="creature-badges creature-badges--prominent">
                        ${creature.creatureType ? `
                            <span class="creature-type-badge creature-type-badge--${this.slugify(creature.creatureType)}" data-type="${this.escapeHtml(creature.creatureType)}">
                                <span class="badge-icon" aria-hidden="true">${typeIcon}</span>
                                <span class="badge-label">${this.escapeHtml(creature.creatureType)}</span>
                            </span>
                        ` : ''}
                        ${creature.mythology ? `
                            <span class="mythology-badge mythology-origin mythology-badge--prominent" data-mythology="${this.escapeHtml(creature.mythology)}">
                                <span class="badge-icon" aria-hidden="true">${mythologyIcon}</span>
                                <span class="badge-label">${this.capitalize(creature.mythology)} Mythology</span>
                            </span>
                        ` : ''}
                        ${creature.classification ? `
                            <span class="creature-classification-badge">
                                <span class="badge-icon" aria-hidden="true">\u{1F4CA}</span>
                                <span class="badge-label">${this.escapeHtml(creature.classification)}</span>
                            </span>
                        ` : ''}
                    </div>

                    ${creature.shortDescription ? `
                        <p class="creature-description creature-description--truncated" data-full-text="${this.escapeHtml(creature.shortDescription)}">
                            ${this.truncateText(creature.shortDescription, 200)}
                        </p>
                    ` : ''}
                </div>
            </header>
        `;
    }

    /**
     * Render quick info bar with enhanced danger indicator
     */
    renderQuickInfoBar(creature) {
        const items = [];

        if (creature.habitat) {
            const habitatName = typeof creature.habitat === 'string' ? creature.habitat : creature.habitat.location || creature.habitat.environment;
            const habitatIcon = this.getHabitatIcon(habitatName);
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">${habitatIcon}</span>
                    <span class="quick-info-label">Habitat</span>
                    <span class="quick-info-value">${this.escapeHtml(this.truncateText(habitatName, 30))}</span>
                </div>
            `);
        }

        if (creature.realm) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u2728</span>
                    <span class="quick-info-label">Realm</span>
                    <span class="quick-info-value">${this.escapeHtml(creature.realm)}</span>
                </div>
            `);
        }

        if (creature.dangerLevel) {
            items.push(this.renderDangerRatingCompact(creature.dangerLevel));
        }

        if (creature.era) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u{1F551}</span>
                    <span class="quick-info-label">Era</span>
                    <span class="quick-info-value">${this.escapeHtml(creature.era)}</span>
                </div>
            `);
        }

        if (creature.size) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u{1F4CF}</span>
                    <span class="quick-info-label">Size</span>
                    <span class="quick-info-value">${this.escapeHtml(creature.size)}</span>
                </div>
            `);
        }

        if (items.length === 0) return '';

        return `
            <div class="quick-info-bar creature-quick-info" ${this.getAnimationStyle()}>
                ${items.join('')}
            </div>
        `;
    }

    /**
     * Render compact danger rating for quick info bar
     */
    renderDangerRatingCompact(dangerLevel) {
        const config = this.getDangerConfig(dangerLevel);
        const bars = [];

        for (let i = 1; i <= 5; i++) {
            const filled = i <= config.bars;
            bars.push(`<span class="danger-bar ${filled ? 'danger-bar--filled' : ''}" style="${filled ? `background-color: ${config.color};` : ''}"></span>`);
        }

        return `
            <div class="quick-info-item quick-info-item--danger" style="--danger-color: ${config.color};">
                <span class="quick-info-icon" aria-hidden="true">${config.icon}</span>
                <span class="quick-info-label">Danger</span>
                <div class="danger-rating-compact">
                    <div class="danger-bars" aria-label="${config.label}">${bars.join('')}</div>
                    <span class="danger-label">${this.escapeHtml(config.label)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Get danger level configuration
     */
    getDangerConfig(level) {
        if (!level) return this.dangerLevels.unknown;
        const lower = level.toLowerCase();
        for (const [key, config] of Object.entries(this.dangerLevels)) {
            if (lower.includes(key)) return config;
        }
        return this.dangerLevels.unknown;
    }

    /**
     * Get creature type icon
     */
    getCreatureTypeIcon(type) {
        if (!type) return this.creatureTypeIcons.default;
        const lower = type.toLowerCase();
        for (const [key, icon] of Object.entries(this.creatureTypeIcons)) {
            if (lower.includes(key)) return icon;
        }
        return this.creatureTypeIcons.default;
    }

    /**
     * Get habitat icon
     */
    getHabitatIcon(habitat) {
        if (!habitat) return this.habitatIcons.default;
        const lower = habitat.toLowerCase();
        for (const [key, icon] of Object.entries(this.habitatIcons)) {
            if (lower.includes(key)) return icon;
        }
        return this.habitatIcons.default;
    }

    /**
     * Get danger level class
     */
    getDangerClass(level) {
        if (!level) return 'unknown';
        const lower = level.toLowerCase();
        if (lower.includes('extreme') || lower.includes('deadly')) return 'extreme';
        if (lower.includes('high') || lower.includes('dangerous')) return 'high';
        if (lower.includes('moderate') || lower.includes('medium')) return 'moderate';
        if (lower.includes('low') || lower.includes('mild')) return 'low';
        return 'unknown';
    }

    /**
     * Get mythology-specific icon
     */
    getMythologyIcon(mythology) {
        const icons = {
            'greek': '\u26A1',
            'norse': '\u2694\uFE0F',
            'egyptian': '\u{1F3DB}\uFE0F',
            'hindu': '\u{1F549}\uFE0F',
            'celtic': '\u{1F525}',
            'chinese': '\u262F\uFE0F',
            'japanese': '\u26E9\uFE0F',
            'sumerian': '\u{1F4DC}',
            'babylonian': '\u{1F451}',
            'christian': '\u271D\uFE0F',
            'islamic': '\u262A\uFE0F',
            'persian': '\u{1F319}',
            'mayan': '\u{1F31E}',
            'aztec': '\u{1F985}'
        };
        return icons[mythology?.toLowerCase()] || '\u{1F30D}';
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
     * Slugify string for CSS classes
     */
    slugify(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    /**
     * Truncate text with ellipsis
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Render physical description (Appearance section)
     */
    renderPhysicalDescription(description) {
        let html = `<section class="creature-physical detail-section creature-section--appearance" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F441}\uFE0F</span>
                Appearance
            </h2>`;

        if (typeof description === 'string') {
            html += `<div class="section-prose section-prose--truncated" data-max-lines="4">
                <p>${this.escapeHtml(description)}</p>
            </div>`;
        } else if (typeof description === 'object') {
            html += '<div class="description-grid">';
            if (description.appearance) {
                html += `
                    <div class="description-card">
                        <h3 class="card-title">General Appearance</h3>
                        <p class="card-content card-content--truncated">${this.escapeHtml(description.appearance)}</p>
                    </div>`;
            }
            if (description.size) {
                html += `
                    <div class="description-card">
                        <h3 class="card-title">Size & Scale</h3>
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
     * Render abilities and powers with enhanced ability cards
     */
    renderAbilities(abilities) {
        const maxVisible = 6;
        const hasMore = abilities.length > maxVisible;
        const visibleAbilities = abilities.slice(0, maxVisible);
        const hiddenAbilities = abilities.slice(maxVisible);

        let html = `<section class="creature-abilities detail-section creature-section--abilities" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u26A1</span>
                Abilities & Powers
                <span class="ability-count">${abilities.length} total</span>
            </h2>`;

        // Render abilities as enhanced cards
        html += `<div class="abilities-card-grid" role="list">`;
        visibleAbilities.forEach((ability, index) => {
            html += this.renderAbilityCardEnhanced(ability, index, false);
        });
        html += '</div>';

        // Hidden abilities (expandable)
        if (hasMore) {
            html += `
                <div class="abilities-hidden-cards" role="list" aria-hidden="true">
                    ${hiddenAbilities.map((ability, index) => this.renderAbilityCardEnhanced(ability, index + maxVisible, true)).join('')}
                </div>
                <button class="abilities-expand-btn" type="button" aria-expanded="false">
                    <span class="expand-text">Show ${hiddenAbilities.length} more abilities</span>
                    <span class="collapse-text" hidden>Show less</span>
                    <span class="expand-icon" aria-hidden="true">\u25BC</span>
                </button>
            `;
        }

        // Quick pills summary
        html += `
            <div class="abilities-pills-summary">
                <h3 class="abilities-pills-title">Quick Reference</h3>
                <div class="abilities-pills-container" role="list">
                    ${abilities.map((ability, index) => this.renderAbilityPill(ability, index, false)).join('')}
                </div>
            </div>
        `;

        html += '</section>';
        return html;
    }

    /**
     * Render enhanced ability card with full details
     */
    renderAbilityCardEnhanced(ability, index, hidden) {
        const name = typeof ability === 'string' ? ability : ability.name;
        const description = typeof ability === 'object' ? ability.description : null;
        const type = typeof ability === 'object' ? ability.type : null;
        const power = typeof ability === 'object' ? ability.power : null;
        const cooldown = typeof ability === 'object' ? ability.cooldown : null;

        const icon = typeof ability === 'object' && ability.icon ? ability.icon : this.getDefaultAbilityIcon(name);
        const typeIcon = type ? (this.abilityTypeIcons[type.toLowerCase()] || this.abilityTypeIcons.default) : null;
        const typeClass = type ? this.slugify(type) : 'default';

        return `
            <article class="ability-card-enhanced ${hidden ? 'ability-card--hidden' : ''}"
                     role="listitem"
                     style="--animation-delay: ${0.05 * index}s"
                     data-ability-type="${typeClass}">
                <div class="ability-card-header">
                    <div class="ability-icon-container">
                        <span class="ability-icon ability-icon-glow" aria-hidden="true">${icon}</span>
                    </div>
                    <div class="ability-title-section">
                        <h4 class="ability-name">${this.escapeHtml(name)}</h4>
                        ${type ? `
                            <span class="ability-type-badge ability-type-badge--${typeClass}">
                                <span class="type-icon" aria-hidden="true">${typeIcon}</span>
                                ${this.escapeHtml(type)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                ${description ? `
                    <p class="ability-description">${this.escapeHtml(description)}</p>
                ` : ''}
                ${(power || cooldown) ? `
                    <div class="ability-stats">
                        ${power ? `
                            <div class="ability-stat">
                                <span class="stat-icon" aria-hidden="true">\u{1F4AA}</span>
                                <span class="stat-label">Power</span>
                                <span class="stat-value">${this.escapeHtml(power)}</span>
                            </div>
                        ` : ''}
                        ${cooldown ? `
                            <div class="ability-stat">
                                <span class="stat-icon" aria-hidden="true">\u23F1\uFE0F</span>
                                <span class="stat-label">Cooldown</span>
                                <span class="stat-value">${this.escapeHtml(cooldown)}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </article>
        `;
    }

    /**
     * Render a single ability pill
     */
    renderAbilityPill(ability, index, hidden) {
        const name = typeof ability === 'string' ? ability : ability.name;
        const icon = typeof ability === 'object' && ability.icon ? ability.icon : this.getDefaultAbilityIcon(name);

        return `
            <span class="ability-pill${hidden ? ' ability-pill--hidden' : ''}"
                  role="listitem"
                  style="--animation-delay: ${0.03 * index}s"
                  title="${this.escapeHtml(name)}">
                <span class="ability-pill-icon" aria-hidden="true">${icon}</span>
                <span class="ability-pill-text">${this.escapeHtml(this.truncateText(name, 25))}</span>
            </span>
        `;
    }

    /**
     * Render a detailed ability card
     */
    renderAbilityCard(ability, index) {
        if (typeof ability === 'string') {
            return `
                <div class="ability-card ability-card-simple" role="listitem" style="--animation-delay: ${0.05 * index}s">
                    <div class="ability-icon ability-icon-glow" aria-hidden="true">\u2728</div>
                    <p class="ability-text">${this.escapeHtml(ability)}</p>
                </div>`;
        }

        const displayIcon = ability.icon || this.getDefaultAbilityIcon(ability.name);
        return `
            <div class="ability-card ability-card-detailed" role="listitem" style="--animation-delay: ${0.05 * index}s">
                <div class="ability-icon-container">
                    <div class="ability-icon ability-icon-glow" aria-hidden="true">${displayIcon}</div>
                </div>
                <div class="ability-content">
                    <h4 class="ability-name">${this.escapeHtml(ability.name)}</h4>
                    ${ability.description ? `<p class="ability-description ability-description--truncated">${this.escapeHtml(ability.description)}</p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Initialize abilities expand/collapse functionality
     */
    initAbilitiesExpand(container) {
        const expandBtn = container.querySelector('.abilities-expand-btn');
        if (!expandBtn) return;

        expandBtn.addEventListener('click', () => {
            const isExpanded = expandBtn.getAttribute('aria-expanded') === 'true';
            const hiddenContainer = container.querySelector('.abilities-hidden');
            const expandText = expandBtn.querySelector('.expand-text');
            const collapseText = expandBtn.querySelector('.collapse-text');
            const expandIcon = expandBtn.querySelector('.expand-icon');

            if (isExpanded) {
                hiddenContainer.setAttribute('aria-hidden', 'true');
                hiddenContainer.style.display = 'none';
                expandBtn.setAttribute('aria-expanded', 'false');
                expandText.hidden = false;
                collapseText.hidden = true;
                expandIcon.style.transform = 'rotate(0deg)';
            } else {
                hiddenContainer.setAttribute('aria-hidden', 'false');
                hiddenContainer.style.display = 'flex';
                expandBtn.setAttribute('aria-expanded', 'true');
                expandText.hidden = true;
                collapseText.hidden = false;
                expandIcon.style.transform = 'rotate(180deg)';
            }
        });
    }

    /**
     * Get default ability icon based on name
     */
    getDefaultAbilityIcon(name) {
        const lower = (name || '').toLowerCase();
        if (lower.includes('breath')) return '\u{1F4A8}';
        if (lower.includes('fire') || lower.includes('flame')) return '\u{1F525}';
        if (lower.includes('claw')) return '\u{1FA93}';
        if (lower.includes('poison') || lower.includes('venom')) return '\u2620\uFE0F';
        if (lower.includes('flight') || lower.includes('fly')) return '\u{1FAB6}';
        if (lower.includes('strength')) return '\u{1F4AA}';
        if (lower.includes('speed') || lower.includes('swift')) return '\u{1F4A8}';
        if (lower.includes('regenerat') || lower.includes('heal')) return '\u2764\uFE0F\u200D\u{1FA79}';
        if (lower.includes('magic') || lower.includes('spell')) return '\u2728';
        if (lower.includes('invisible') || lower.includes('cloak')) return '\u{1F47B}';
        if (lower.includes('water')) return '\u{1F4A7}';
        if (lower.includes('ice') || lower.includes('cold') || lower.includes('frost')) return '\u2744\uFE0F';
        if (lower.includes('earth') || lower.includes('stone')) return '\u26F0\uFE0F';
        if (lower.includes('darkness') || lower.includes('shadow')) return '\u{1F311}';
        if (lower.includes('light') || lower.includes('glow')) return '\u{1F4AB}';
        if (lower.includes('hypno') || lower.includes('gaze')) return '\u{1F440}';
        if (lower.includes('petrif') || lower.includes('stone gaze')) return '\u{1F5FF}';
        if (lower.includes('telepat') || lower.includes('mind')) return '\u{1F9E0}';
        if (lower.includes('immortal')) return '\u267E\uFE0F';
        return '\u26A1';
    }

    /**
     * Render habitat with enhanced visual display
     */
    renderHabitat(habitat) {
        let html = `<section class="creature-habitat detail-section creature-section--habitat" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F3DE}\uFE0F</span>
                Habitat & Domain
            </h2>`;

        if (typeof habitat === 'string') {
            const habitatIcon = this.getHabitatIcon(habitat);
            const habitatClass = this.getHabitatClass(habitat);
            html += `
                <div class="habitat-showcase habitat-showcase--${habitatClass}">
                    <div class="habitat-icon-large" aria-hidden="true">
                        <span class="habitat-icon-glow">${habitatIcon}</span>
                    </div>
                    <div class="habitat-details">
                        <h3 class="habitat-name">${this.escapeHtml(habitat)}</h3>
                        <p class="habitat-description">This creature makes its home in ${this.escapeHtml(habitat.toLowerCase())} environments.</p>
                    </div>
                </div>`;
        } else if (typeof habitat === 'object') {
            const primaryHabitat = habitat.location || habitat.environment || 'Unknown';
            const habitatIcon = this.getHabitatIcon(primaryHabitat);
            const habitatClass = this.getHabitatClass(primaryHabitat);

            html += `
                <div class="habitat-showcase habitat-showcase--${habitatClass}">
                    <div class="habitat-icon-large" aria-hidden="true">
                        <span class="habitat-icon-glow">${habitatIcon}</span>
                    </div>
                    <div class="habitat-primary">
                        <h3 class="habitat-name">${this.escapeHtml(primaryHabitat)}</h3>
                        ${habitat.description ? `<p class="habitat-description">${this.escapeHtml(habitat.description)}</p>` : ''}
                    </div>
                </div>
            `;

            // Detailed habitat cards
            html += '<div class="habitat-details-grid">';

            if (habitat.location) {
                html += `
                    <div class="habitat-card habitat-card--location">
                        <div class="habitat-card-icon" aria-hidden="true">\u{1F4CD}</div>
                        <div class="habitat-card-content">
                            <span class="habitat-card-label">Primary Location</span>
                            <span class="habitat-card-value">${this.escapeHtml(habitat.location)}</span>
                        </div>
                    </div>`;
            }

            if (habitat.environment) {
                html += `
                    <div class="habitat-card habitat-card--environment">
                        <div class="habitat-card-icon" aria-hidden="true">\u{1F333}</div>
                        <div class="habitat-card-content">
                            <span class="habitat-card-label">Environment Type</span>
                            <span class="habitat-card-value">${this.escapeHtml(habitat.environment)}</span>
                        </div>
                    </div>`;
            }

            if (habitat.territory) {
                html += `
                    <div class="habitat-card habitat-card--territory">
                        <div class="habitat-card-icon" aria-hidden="true">\u{1F5FA}\uFE0F</div>
                        <div class="habitat-card-content">
                            <span class="habitat-card-label">Territory Range</span>
                            <span class="habitat-card-value">${this.escapeHtml(habitat.territory)}</span>
                        </div>
                    </div>`;
            }

            if (habitat.climate) {
                html += `
                    <div class="habitat-card habitat-card--climate">
                        <div class="habitat-card-icon" aria-hidden="true">\u{1F321}\uFE0F</div>
                        <div class="habitat-card-content">
                            <span class="habitat-card-label">Climate</span>
                            <span class="habitat-card-value">${this.escapeHtml(habitat.climate)}</span>
                        </div>
                    </div>`;
            }

            if (habitat.regions && habitat.regions.length > 0) {
                html += `
                    <div class="habitat-card habitat-card--regions habitat-card--wide">
                        <div class="habitat-card-icon" aria-hidden="true">\u{1F30D}</div>
                        <div class="habitat-card-content">
                            <span class="habitat-card-label">Known Regions</span>
                            <div class="habitat-regions-list">
                                ${habitat.regions.map(region => `<span class="region-tag">${this.escapeHtml(region)}</span>`).join('')}
                            </div>
                        </div>
                    </div>`;
            }

            if (habitat.lairDescription) {
                html += `
                    <div class="habitat-card habitat-card--lair habitat-card--wide">
                        <div class="habitat-card-icon" aria-hidden="true">\u{1F5FF}</div>
                        <div class="habitat-card-content">
                            <span class="habitat-card-label">Lair Description</span>
                            <p class="habitat-lair-text">${this.escapeHtml(habitat.lairDescription)}</p>
                        </div>
                    </div>`;
            }

            html += '</div>';
        }

        html += '</section>';
        return html;
    }

    /**
     * Get habitat class for styling
     */
    getHabitatClass(habitat) {
        if (!habitat) return 'default';
        const lower = habitat.toLowerCase();
        if (lower.includes('underworld') || lower.includes('hell') || lower.includes('fire')) return 'underworld';
        if (lower.includes('ocean') || lower.includes('sea') || lower.includes('water')) return 'aquatic';
        if (lower.includes('mountain') || lower.includes('peak') || lower.includes('cliff')) return 'mountain';
        if (lower.includes('forest') || lower.includes('wood') || lower.includes('jungle')) return 'forest';
        if (lower.includes('sky') || lower.includes('air') || lower.includes('cloud')) return 'sky';
        if (lower.includes('cave') || lower.includes('cavern') || lower.includes('underground')) return 'cave';
        if (lower.includes('desert') || lower.includes('sand') || lower.includes('wasteland')) return 'desert';
        if (lower.includes('swamp') || lower.includes('marsh') || lower.includes('bog')) return 'swamp';
        if (lower.includes('arctic') || lower.includes('ice') || lower.includes('snow')) return 'arctic';
        if (lower.includes('volcano') || lower.includes('lava')) return 'volcanic';
        return 'default';
    }

    /**
     * Render origin story (Mythology section)
     */
    renderOrigin(origin) {
        let html = `<section class="creature-origin detail-section creature-section--mythology" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F4D6}</span>
                Origin & Mythology
            </h2>
            <div class="section-prose section-prose--expandable" data-max-lines="4">`;
        html += this.renderContent(origin);
        html += `</div>
            <button class="prose-expand-btn" type="button" aria-expanded="false" hidden>
                <span>Read more</span>
            </button>
        </section>`;
        return html;
    }

    /**
     * Render famous encounters (Stories section)
     */
    renderEncounters(encounters) {
        let html = `<section class="creature-encounters detail-section creature-section--stories" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u2694\uFE0F</span>
                Famous Encounters
            </h2>
            <div class="encounters-timeline encounters-timeline-enhanced">`;

        encounters.forEach((encounter, index) => {
            if (typeof encounter === 'string') {
                html += `
                    <div class="encounter-card encounter-card-simple" style="--animation-delay: ${0.1 * index}s">
                        <div class="encounter-marker encounter-marker-glow">${index + 1}</div>
                        <div class="encounter-content">
                            <p class="encounter-text encounter-text--truncated">${this.escapeHtml(encounter)}</p>
                        </div>
                    </div>`;
            } else if (encounter.hero || encounter.title) {
                const outcomeClass = this.getOutcomeClass(encounter.outcome);
                html += `
                    <div class="encounter-card encounter-card-detailed" style="--animation-delay: ${0.1 * index}s">
                        <div class="encounter-marker encounter-marker-glow">${index + 1}</div>
                        <div class="encounter-content">
                            <h3 class="encounter-hero">
                                <span class="hero-icon" aria-hidden="true">\u2694\uFE0F</span>
                                ${encounter.hero ? this.escapeHtml(encounter.hero) : ''}
                                ${encounter.title ? `<span class="encounter-title-divider">\u203A</span> ${this.escapeHtml(encounter.title)}` : ''}
                            </h3>
                            ${encounter.description ? `<p class="encounter-description encounter-description--truncated">${this.escapeHtml(encounter.description)}</p>` : ''}
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
     * Render related myths
     */
    renderRelatedMyths(myths) {
        let html = `<section class="creature-related-myths detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F4DA}</span>
                Related Stories & Myths
            </h2>
            <ul class="related-myths-list">`;

        myths.forEach((myth, index) => {
            if (typeof myth === 'string') {
                html += `<li class="myth-item" style="--animation-delay: ${0.05 * index}s">${this.escapeHtml(myth)}</li>`;
            } else if (myth.title) {
                html += `
                    <li class="myth-item myth-item--linked" style="--animation-delay: ${0.05 * index}s">
                        ${myth.link ? `<a href="${this.escapeHtml(myth.link)}" class="myth-link">` : ''}
                        <span class="myth-title">${this.escapeHtml(myth.title)}</span>
                        ${myth.source ? `<span class="myth-source">${this.escapeHtml(myth.source)}</span>` : ''}
                        ${myth.link ? '</a>' : ''}
                    </li>`;
            }
        });

        html += '</ul></section>';
        return html;
    }

    /**
     * Get outcome class for styling
     */
    getOutcomeClass(outcome) {
        if (!outcome) return 'neutral';
        const lower = outcome.toLowerCase();
        if (lower.includes('defeat') || lower.includes('slain') || lower.includes('death') || lower.includes('kill')) return 'defeat';
        if (lower.includes('victory') || lower.includes('triumph') || lower.includes('won') || lower.includes('escape')) return 'victory';
        if (lower.includes('draw') || lower.includes('tie') || lower.includes('stalemate')) return 'draw';
        return 'neutral';
    }

    /**
     * Render symbolism
     */
    renderSymbolism(symbolism) {
        let html = `<section class="creature-symbolism detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F52E}</span>
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
            if (symbolism.modernInterpretation) {
                html += `
                    <div class="symbolism-card">
                        <h3 class="symbolism-card-title">Modern Interpretation</h3>
                        <p class="symbolism-text">${this.escapeHtml(symbolism.modernInterpretation)}</p>
                    </div>`;
            }
            html += '</div>';
        }

        html += '</section>';
        return html;
    }

    /**
     * Render weaknesses
     */
    renderWeaknesses(weaknesses) {
        let html = `<section class="creature-weaknesses detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F6E1}\uFE0F</span>
                Known Weaknesses
            </h2>
            <ul class="weaknesses-list">`;

        weaknesses.forEach((weakness, index) => {
            if (typeof weakness === 'string') {
                html += `<li class="weakness-item" style="--animation-delay: ${0.05 * index}s">
                    <span class="weakness-icon" aria-hidden="true">\u2022</span>
                    ${this.escapeHtml(weakness)}
                </li>`;
            } else if (weakness.name) {
                html += `<li class="weakness-item weakness-item--detailed" style="--animation-delay: ${0.05 * index}s">
                    <span class="weakness-name">${this.escapeHtml(weakness.name)}</span>
                    ${weakness.description ? `<span class="weakness-description">${this.escapeHtml(weakness.description)}</span>` : ''}
                </li>`;
            }
        });

        html += '</ul></section>';
        return html;
    }

    /**
     * Render general content sections
     */
    renderSections(sections) {
        let html = '';

        sections.forEach(section => {
            html += `<section class="content-section detail-section" ${this.getAnimationStyle()}>`;
            html += `<h2 class="section-title">${this.escapeHtml(section.title)}</h2>`;
            html += `<div class="section-prose">`;
            html += this.renderContent(section.content);
            html += `</div></section>`;
        });

        return html;
    }

    /**
     * Render content (handles arrays and strings)
     */
    renderContent(content) {
        if (Array.isArray(content)) {
            return content.map(p => `<p>${this.escapeHtml(p)}</p>`).join('');
        } else if (typeof content === 'string') {
            return `<p>${this.escapeHtml(content)}</p>`;
        }
        return '';
    }

    /**
     * Render sources section
     */
    renderSources(sources) {
        let html = `<section class="sources-section detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F4DA}</span>
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
                            ${source.url ? `<a href="${this.escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" class="source-link">View \u2197</a>` : ''}
                        </div>
                    </li>`;
            }
        });

        html += '</ol></section>';
        return html;
    }

    /**
     * Render edit icon
     */
    renderEditIcon(entityId, collection) {
        return `
            <button class="edit-icon-btn"
                    data-entity-id="${entityId}"
                    data-collection="${collection}"
                    aria-label="Edit creature"
                    title="Edit this creature">
                \u270F\uFE0F
            </button>
        `;
    }

    /**
     * Check if current user can edit this entity
     */
    canUserEdit(entity) {
        const user = this.auth.currentUser;
        if (!user) return false;
        return entity.createdBy === user.uid;
    }

    /**
     * Render edit button (legacy)
     */
    renderEditButton(mythology, entityId) {
        return `
            <div class="edit-controls">
                <button class="btn-edit" onclick="window.location.href='/admin/edit-creature.html?mythology=${mythology}&id=${entityId}'" aria-label="Edit this creature">
                    <span aria-hidden="true">\u270F\uFE0F</span> Edit Creature
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
