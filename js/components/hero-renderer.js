/**
 * Hero Renderer Component - Polished Version
 *
 * Dynamically loads and renders hero/demigod content from Firebase
 * Supports: biography, deeds, divine connections, worship, legacy
 *
 * Features:
 * - Notable deeds section with enhanced timeline
 * - Associated deities prominently displayed
 * - Weapons/items carried with artifact showcase
 * - Mythology and era badges
 * - Family tree preview with relationship visualization
 * - Epic/saga section for major storylines
 * - Achievement timeline with visual markers
 * - Polished card-based layout with timeline support
 * - Animated section reveals
 * - Mobile-friendly responsive design
 * - Accessible markup with proper ARIA
 * - Visual hierarchy with icons
 * - Content distinction (Official vs Community)
 * - Detail View Sections: Biography, Deeds, Relationships, Legacy, Epics
 *
 * Usage:
 * <div data-hero-content data-mythology="greek" data-entity="heracles" data-allow-edit="true"></div>
 */

class HeroRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.cache = new Map();
        this.animationDelay = 0;

        // Hero type icons - expanded
        this.heroTypeIcons = {
            demigod: '\u{1F31F}',      // glowing star
            warrior: '\u2694\uFE0F',   // crossed swords
            knight: '\u{1F6E1}\uFE0F', // shield
            king: '\u{1F451}',         // crown
            queen: '\u{1F451}',        // crown
            prince: '\u{1F451}',       // crown
            prophet: '\u{1F4DC}',      // scroll
            sage: '\u{1F9D9}',         // mage
            wizard: '\u{1F9D9}',       // mage
            trickster: '\u{1F3AD}',    // masks
            adventurer: '\u{1F5FA}\uFE0F', // map
            explorer: '\u{1F9ED}',     // compass
            hunter: '\u{1F3F9}',       // bow
            archer: '\u{1F3F9}',       // bow
            founder: '\u{1F3DB}\uFE0F', // temple
            savior: '\u{1F6E1}\uFE0F', // shield
            champion: '\u{1F3C6}',     // trophy
            leader: '\u{1F3C1}',       // flag
            martyr: '\u{1FA78}',       // drop of blood
            healer: '\u2764\uFE0F',    // heart
            voyager: '\u{1F6F6}',      // canoe
            sailor: '\u2693',          // anchor
            guardian: '\u{1F6E1}\uFE0F', // shield
            avenger: '\u2694\uFE0F',   // crossed swords
            liberator: '\u{1F5FD}',    // statue of liberty
            conqueror: '\u{1F3F0}',    // castle
            inventor: '\u{1F9EA}',     // test tube
            poet: '\u{1F3B6}',         // notes
            musician: '\u{1F3B5}',     // note
            default: '\u{1F9D1}'       // person
        };

        // Mythology icons - expanded
        this.mythologyIcons = {
            greek: '\u26A1',           // lightning
            roman: '\u{1F985}',        // eagle
            norse: '\u2694\uFE0F',     // crossed swords
            egyptian: '\u{1F3DB}\uFE0F', // temple
            hindu: '\u{1F549}\uFE0F',  // om
            buddhist: '\u2638\uFE0F',  // wheel of dharma
            celtic: '\u{1F525}',       // fire
            chinese: '\u262F\uFE0F',   // yin-yang
            japanese: '\u26E9\uFE0F',  // shinto shrine
            sumerian: '\u{1F4DC}',     // scroll
            babylonian: '\u{1F451}',   // crown
            assyrian: '\u{1F981}',     // lion
            christian: '\u271D\uFE0F', // cross
            islamic: '\u262A\uFE0F',   // star and crescent
            jewish: '\u2721\uFE0F',    // star of david
            persian: '\u{1F319}',      // crescent moon
            mayan: '\u{1F31E}',        // sun
            aztec: '\u{1F985}',        // eagle
            inca: '\u{1F31E}',         // sun
            african: '\u{1F30D}',      // earth
            native: '\u{1FAB6}',       // feather
            polynesian: '\u{1F30A}',   // wave
            arthurian: '\u{1F5E1}\uFE0F', // dagger
            default: '\u{1F30D}'       // globe
        };

        // Weapon type icons for artifact showcase
        this.weaponIcons = {
            sword: '\u{1F5E1}\uFE0F',
            spear: '\u{1F531}',
            bow: '\u{1F3F9}',
            axe: '\u{1FA93}',
            hammer: '\u{1F528}',
            staff: '\u{1FA84}',
            shield: '\u{1F6E1}\uFE0F',
            armor: '\u{1F6E1}\uFE0F',
            helmet: '\u{1FA96}',
            ring: '\u{1F48D}',
            amulet: '\u{1F4FF}',
            cloak: '\u{1F9E5}',
            boots: '\u{1F97E}',
            gauntlet: '\u{1F91C}',
            chariot: '\u{1F3CE}\uFE0F',
            ship: '\u{1F6F3}\uFE0F',
            horse: '\u{1F40E}',
            default: '\u2694\uFE0F'
        };

        // Achievement categories for timeline
        this.achievementCategories = {
            quest: { icon: '\u{1F5FA}\uFE0F', color: '#4CAF50', label: 'Quest' },
            battle: { icon: '\u2694\uFE0F', color: '#F44336', label: 'Battle' },
            discovery: { icon: '\u{1F4A1}', color: '#2196F3', label: 'Discovery' },
            founding: { icon: '\u{1F3DB}\uFE0F', color: '#9C27B0', label: 'Founding' },
            marriage: { icon: '\u{1F48D}', color: '#E91E63', label: 'Marriage' },
            birth: { icon: '\u{1F476}', color: '#FFC107', label: 'Birth' },
            death: { icon: '\u{1F480}', color: '#607D8B', label: 'Death' },
            transformation: { icon: '\u2728', color: '#FF9800', label: 'Transformation' },
            trial: { icon: '\u{1F525}', color: '#FF5722', label: 'Trial' },
            victory: { icon: '\u{1F3C6}', color: '#FFD700', label: 'Victory' },
            defeat: { icon: '\u{1F494}', color: '#795548', label: 'Defeat' },
            default: { icon: '\u{1F31F}', color: '#667eea', label: 'Event' }
        };

        // Relationship type configurations
        this.relationshipTypes = {
            parent: { icon: '\u{1F9D1}\u200D\u{1F467}', color: '#4CAF50', line: 'solid' },
            child: { icon: '\u{1F476}', color: '#4CAF50', line: 'solid' },
            spouse: { icon: '\u{1F48D}', color: '#E91E63', line: 'dashed' },
            lover: { icon: '\u2764\uFE0F', color: '#E91E63', line: 'dotted' },
            sibling: { icon: '\u{1F46C}', color: '#2196F3', line: 'solid' },
            mentor: { icon: '\u{1F9D9}', color: '#9C27B0', line: 'dashed' },
            student: { icon: '\u{1F4DA}', color: '#9C27B0', line: 'dashed' },
            rival: { icon: '\u2694\uFE0F', color: '#F44336', line: 'dotted' },
            enemy: { icon: '\u{1F47F}', color: '#B71C1C', line: 'dotted' },
            ally: { icon: '\u{1F91D}', color: '#4CAF50', line: 'dashed' },
            companion: { icon: '\u{1F465}', color: '#00BCD4', line: 'solid' },
            divine: { icon: '\u2728', color: '#FFD700', line: 'double' },
            default: { icon: '\u{1F517}', color: '#9E9E9E', line: 'solid' }
        };
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
     * Escape HTML for security
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
     * Initialize all hero content sections on the page
     */
    init() {
        const heroSections = document.querySelectorAll('[data-hero-content]');
        heroSections.forEach(section => {
            const mythology = section.dataset.mythology;
            const entityId = section.dataset.entity;
            const allowEdit = section.dataset.allowEdit === 'true';

            this.renderHero(section, mythology, entityId, allowEdit);
        });
    }

    /**
     * Fetch hero data from Firestore
     */
    async fetchHero(mythology, entityId) {
        const cacheKey = `${mythology}/${entityId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const docRef = this.db
                .collection('entities')
                .doc(mythology)
                .collection('hero')
                .doc(entityId);

            const doc = await docRef.get();

            if (!doc.exists) {
                console.warn(`Hero not found: ${mythology}/${entityId}`);
                return null;
            }

            const data = doc.data();
            this.cache.set(cacheKey, data);
            return data;

        } catch (error) {
            console.error('Error fetching hero:', error);
            return null;
        }
    }

    /**
     * Render hero content
     */
    async renderHero(container, mythology, entityId, allowEdit = false) {
        container.innerHTML = `
            <div class="loading-state hero-loading">
                <div class="loading-spinner-ring"></div>
                <p class="loading-text">Summoning hero's legend...</p>
            </div>`;

        this.animationDelay = 0;
        const hero = await this.fetchHero(mythology, entityId);

        if (!hero) {
            container.innerHTML = `
                <div class="error-state hero-error">
                    <span class="error-icon" aria-hidden="true">\u26A0\uFE0F</span>
                    <p class="error-text">Hero data not found. Content will load from HTML.</p>
                </div>`;
            return;
        }

        // Determine content source for distinction styling
        const contentSource = hero.source || (hero.createdBy ? 'community' : 'official');

        // Configure container
        container.style.position = 'relative';
        container.classList.add('hero-detail-container');
        container.setAttribute('data-content-source', contentSource);

        let html = `<article class="hero-detail-article entity-card--hero ${contentSource === 'official' ? 'official' : 'user-submitted'}">`;

        // Content source badge
        html += this.renderContentSourceBadge(contentSource, hero.createdBy);

        // Header section
        html += this.renderHeader(hero);

        // Quick info bar (era, type, mythology)
        html += this.renderQuickInfoBar(hero);

        // Associated deities (prominent section)
        if (hero.divineConnections || hero.patronDeity || hero.divineParent) {
            html += this.renderDivineConnections(hero.divineConnections || {
                parentDivine: hero.divineParent,
                patron: hero.patronDeity
            });
        }

        // Biography section
        if (hero.biography) {
            html += this.renderBiography(hero.biography);
        }

        // Weapons and items carried (enhanced showcase)
        if (hero.weapons || hero.items || hero.artifacts) {
            html += this.renderWeaponShowcase(hero);
        }

        // Deeds/Quests/Labors section (Notable Deeds)
        if (hero.deeds && hero.deeds.length > 0) {
            html += this.renderDeeds(hero.deeds);
        }

        // Family tree preview
        if (hero.family || hero.parents || hero.children || hero.spouse) {
            html += this.renderFamilyTree(hero);
        }

        // Relationships section
        if (hero.relationships && hero.relationships.length > 0) {
            html += this.renderRelationships(hero.relationships);
        }

        // Worship section
        if (hero.worship) {
            html += this.renderWorship(hero.worship);
        }

        // Legacy section
        if (hero.legacy) {
            html += this.renderLegacy(hero.legacy);
        }

        // Epic/Saga section (new)
        if (hero.epics || hero.sagas || hero.tales) {
            html += this.renderEpicsSagas(hero);
        }

        // Achievement timeline (new)
        if (hero.achievements && hero.achievements.length > 0) {
            html += this.renderAchievementTimeline(hero.achievements);
        }

        // General content sections
        if (hero.sections && hero.sections.length > 0) {
            html += this.renderSections(hero.sections);
        }

        // Sources
        if (hero.sources && hero.sources.length > 0) {
            html += this.renderSources(hero.sources);
        }

        // Edit button (if allowed)
        if (allowEdit) {
            html += this.renderEditButton(mythology, entityId);
        }

        html += '</article>';
        container.innerHTML = html;

        // Initialize interactive elements
        this.initTimelineInteractions(container);
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
     * Render header with title and description
     */
    renderHeader(hero) {
        const typeIcon = this.getHeroTypeIcon(hero.heroType);
        const mythologyIcon = this.getMythologyIcon(hero.mythology);

        return `
            <header class="hero-header detail-header" ${this.getAnimationStyle()}>
                <div class="hero-icon-large" aria-hidden="true">
                    <span class="icon-float hero-icon-glow">${hero.icon || '\u2694\uFE0F'}</span>
                </div>
                <div class="hero-header-content">
                    <h1 class="hero-title">${this.escapeHtml(hero.name)}</h1>
                    ${hero.epithet ? `<p class="hero-epithet">"${this.escapeHtml(hero.epithet)}"</p>` : ''}
                    ${hero.subtitle ? `<p class="hero-subtitle">${this.escapeHtml(hero.subtitle)}</p>` : ''}

                    <div class="hero-badges hero-badges--prominent">
                        <span class="entity-type-badge entity-type-badge--hero">
                            <span class="badge-icon" aria-hidden="true">${typeIcon}</span>
                            <span class="badge-label">${hero.heroType || 'Hero'}</span>
                        </span>
                        ${hero.mythology ? `
                            <span class="mythology-badge mythology-badge--prominent" data-mythology="${this.escapeHtml(hero.mythology)}">
                                <span class="badge-icon" aria-hidden="true">${mythologyIcon}</span>
                                <span class="badge-label">${this.capitalize(hero.mythology)} Mythology</span>
                            </span>
                        ` : ''}
                        ${hero.era ? `
                            <span class="era-badge">
                                <span class="badge-icon" aria-hidden="true">\u{1F551}</span>
                                <span class="badge-label">${this.escapeHtml(hero.era)}</span>
                            </span>
                        ` : ''}
                    </div>

                    ${hero.shortDescription ? `
                        <p class="hero-description hero-description--truncated" data-max-lines="4">
                            ${this.escapeHtml(hero.shortDescription)}
                        </p>
                    ` : ''}
                </div>
            </header>
        `;
    }

    /**
     * Render quick info bar
     */
    renderQuickInfoBar(hero) {
        const items = [];

        if (hero.birthplace) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u{1F3E0}</span>
                    <span class="quick-info-label">Birthplace</span>
                    <span class="quick-info-value">${this.escapeHtml(this.truncateText(hero.birthplace, 25))}</span>
                </div>
            `);
        }

        if (hero.lifespan || hero.dates) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u{1F4C5}</span>
                    <span class="quick-info-label">Period</span>
                    <span class="quick-info-value">${this.escapeHtml(hero.lifespan || hero.dates)}</span>
                </div>
            `);
        }

        if (hero.titles && hero.titles.length > 0) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u{1F451}</span>
                    <span class="quick-info-label">Title</span>
                    <span class="quick-info-value">${this.escapeHtml(hero.titles[0])}</span>
                </div>
            `);
        }

        if (hero.status) {
            items.push(`
                <div class="quick-info-item">
                    <span class="quick-info-icon" aria-hidden="true">\u{1F31F}</span>
                    <span class="quick-info-label">Status</span>
                    <span class="quick-info-value">${this.escapeHtml(hero.status)}</span>
                </div>
            `);
        }

        if (items.length === 0) return '';

        return `
            <div class="quick-info-bar hero-quick-info" ${this.getAnimationStyle()}>
                ${items.join('')}
            </div>
        `;
    }

    /**
     * Get hero type icon
     */
    getHeroTypeIcon(type) {
        if (!type) return this.heroTypeIcons.default;
        const lower = type.toLowerCase();
        for (const [key, icon] of Object.entries(this.heroTypeIcons)) {
            if (lower.includes(key)) return icon;
        }
        return this.heroTypeIcons.default;
    }

    /**
     * Get mythology icon
     */
    getMythologyIcon(mythology) {
        if (!mythology) return this.mythologyIcons.default;
        return this.mythologyIcons[mythology.toLowerCase()] || this.mythologyIcons.default;
    }

    /**
     * Render biography section
     */
    renderBiography(biography) {
        let html = `<section class="hero-biography detail-section hero-section--biography" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F4D6}</span>
                Biography
            </h2>
            <div class="biography-grid">`;

        if (biography.birth) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">\u{1F31E}</span>
                        Birth & Origins
                    </h3>
                    <div class="biography-card-content biography-card-content--truncated" data-max-lines="4">
                        ${this.renderContent(biography.birth)}
                    </div>
                </div>`;
        }

        if (biography.earlyLife) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">\u{1F331}</span>
                        Early Life
                    </h3>
                    <div class="biography-card-content biography-card-content--truncated" data-max-lines="4">
                        ${this.renderContent(biography.earlyLife)}
                    </div>
                </div>`;
        }

        if (biography.training) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">\u{1F3CB}\uFE0F</span>
                        Training & Education
                    </h3>
                    <div class="biography-card-content biography-card-content--truncated" data-max-lines="4">
                        ${this.renderContent(biography.training)}
                    </div>
                </div>`;
        }

        if (biography.majorEvents && biography.majorEvents.length > 0) {
            html += `
                <div class="biography-card biography-card-wide" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">\u{1F4C5}</span>
                        Major Life Events
                    </h3>
                    <ul class="major-events-list">
                        ${biography.majorEvents.map((event, i) => `
                            <li class="major-event-item" style="--animation-delay: ${0.05 * i}s">
                                <span class="event-bullet" aria-hidden="true">\u2022</span>
                                <span class="event-text">${this.escapeHtml(event)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>`;
        }

        if (biography.death) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">\u2694\uFE0F</span>
                        Death & Apotheosis
                    </h3>
                    <div class="biography-card-content biography-card-content--truncated" data-max-lines="4">
                        ${this.renderContent(biography.death)}
                    </div>
                </div>`;
        }

        if (biography.afterlife) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">\u2728</span>
                        Afterlife & Immortality
                    </h3>
                    <div class="biography-card-content biography-card-content--truncated" data-max-lines="4">
                        ${this.renderContent(biography.afterlife)}
                    </div>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render weapons and items section
     */
    renderWeaponsAndItems(hero) {
        const items = [];

        if (hero.weapons) {
            const weaponList = Array.isArray(hero.weapons) ? hero.weapons : [hero.weapons];
            weaponList.forEach(w => items.push({ ...w, category: 'weapon' }));
        }

        if (hero.items) {
            const itemList = Array.isArray(hero.items) ? hero.items : [hero.items];
            itemList.forEach(i => items.push({ ...i, category: 'item' }));
        }

        if (hero.artifacts) {
            const artifactList = Array.isArray(hero.artifacts) ? hero.artifacts : [hero.artifacts];
            artifactList.forEach(a => items.push({ ...a, category: 'artifact' }));
        }

        if (items.length === 0) return '';

        let html = `<section class="hero-weapons-items detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u2694\uFE0F</span>
                Weapons & Sacred Items
            </h2>
            <div class="items-grid" role="list">`;

        items.forEach((item, index) => {
            const name = typeof item === 'string' ? item : item.name;
            const description = typeof item === 'object' ? item.description : null;
            const icon = this.getItemIcon(item.category || 'item');

            html += `
                <div class="item-card item-card--${item.category || 'item'}" role="listitem" style="--animation-delay: ${0.05 * index}s">
                    <div class="item-icon" aria-hidden="true">${icon}</div>
                    <div class="item-content">
                        <h4 class="item-name">${this.escapeHtml(name)}</h4>
                        ${description ? `<p class="item-description item-description--truncated">${this.escapeHtml(description)}</p>` : ''}
                        ${item.powers ? `<span class="item-powers">${this.escapeHtml(item.powers)}</span>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Get item icon based on category
     */
    getItemIcon(category) {
        const icons = {
            weapon: '\u2694\uFE0F',
            sword: '\u{1F5E1}\uFE0F',
            bow: '\u{1F3F9}',
            shield: '\u{1F6E1}\uFE0F',
            armor: '\u{1F6E1}\uFE0F',
            artifact: '\u2728',
            item: '\u{1F48E}',
            default: '\u{1F48E}'
        };
        return icons[category] || icons.default;
    }

    /**
     * Render deeds/quests/labors (Notable Deeds section)
     */
    renderDeeds(deeds) {
        let html = `<section class="hero-deeds detail-section hero-section--deeds" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F3C6}</span>
                Heroic Deeds
                <span class="deeds-count">${deeds.length} legendary feats</span>
            </h2>`;

        // Sort by order if available
        const sortedDeeds = [...deeds].sort((a, b) => (a.order || 0) - (b.order || 0));

        html += '<div class="deeds-timeline" role="list">';
        sortedDeeds.forEach((deed, index) => {
            const outcomeClass = this.getDeedOutcomeClass(deed.outcome);
            html += `
                <article class="deed-card" role="listitem" style="--animation-delay: ${0.1 * index}s">
                    <div class="deed-marker">
                        <span class="deed-number">${deed.order || index + 1}</span>
                    </div>
                    <div class="deed-content">
                        <h3 class="deed-title">${this.escapeHtml(deed.title || deed.name)}</h3>
                        <div class="deed-description deed-description--truncated" data-max-lines="4">
                            ${this.renderContent(deed.description)}
                        </div>
                        ${deed.location ? `
                            <div class="deed-meta">
                                <span class="deed-location">
                                    <span class="meta-icon" aria-hidden="true">\u{1F4CD}</span>
                                    ${this.escapeHtml(deed.location)}
                                </span>
                            </div>
                        ` : ''}
                        ${deed.outcome ? `
                            <div class="deed-outcome deed-outcome--${outcomeClass}">
                                <span class="outcome-label">Outcome:</span>
                                <span class="outcome-value">${this.escapeHtml(deed.outcome)}</span>
                            </div>
                        ` : ''}
                        ${deed.significance ? `
                            <div class="deed-significance">
                                <span class="significance-label">Significance:</span>
                                <span class="significance-value">${this.escapeHtml(deed.significance)}</span>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        });
        html += '</div></section>';

        return html;
    }

    /**
     * Get deed outcome class for styling
     */
    getDeedOutcomeClass(outcome) {
        if (!outcome) return 'neutral';
        const lower = outcome.toLowerCase();
        if (lower.includes('success') || lower.includes('victory') || lower.includes('triumph') || lower.includes('completed')) return 'success';
        if (lower.includes('fail') || lower.includes('defeat') || lower.includes('death')) return 'failure';
        if (lower.includes('partial') || lower.includes('mixed')) return 'partial';
        return 'neutral';
    }

    /**
     * Render family tree preview
     */
    renderFamilyTree(hero) {
        let html = `<section class="hero-family-tree detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F333}</span>
                Family & Lineage
            </h2>
            <div class="family-tree-preview">`;

        // Parents
        if (hero.parents || (hero.family && hero.family.parents)) {
            const parents = hero.parents || hero.family.parents;
            html += `
                <div class="family-row family-row--parents">
                    <h4 class="family-row-title">Parents</h4>
                    <div class="family-members">
                        ${this.renderFamilyMembers(parents)}
                    </div>
                </div>`;
        }

        // Divine parent (if any)
        if (hero.divineParent) {
            html += `
                <div class="family-row family-row--divine">
                    <h4 class="family-row-title">Divine Parent</h4>
                    <div class="family-members">
                        <div class="family-member family-member--divine">
                            <span class="member-icon" aria-hidden="true">\u2728</span>
                            <span class="member-name">${this.escapeHtml(typeof hero.divineParent === 'string' ? hero.divineParent : hero.divineParent.name)}</span>
                        </div>
                    </div>
                </div>`;
        }

        // Mortal parent (if any)
        if (hero.mortalParent) {
            html += `
                <div class="family-row family-row--mortal">
                    <h4 class="family-row-title">Mortal Parent</h4>
                    <div class="family-members">
                        <div class="family-member family-member--mortal">
                            <span class="member-icon" aria-hidden="true">\u{1F464}</span>
                            <span class="member-name">${this.escapeHtml(typeof hero.mortalParent === 'string' ? hero.mortalParent : hero.mortalParent.name)}</span>
                        </div>
                    </div>
                </div>`;
        }

        // Spouse(s)
        if (hero.spouse || (hero.family && hero.family.spouse)) {
            const spouses = hero.spouse || hero.family.spouse;
            html += `
                <div class="family-row family-row--spouse">
                    <h4 class="family-row-title">Spouse</h4>
                    <div class="family-members">
                        ${this.renderFamilyMembers(spouses)}
                    </div>
                </div>`;
        }

        // Children
        if (hero.children || (hero.family && hero.family.children)) {
            const children = hero.children || hero.family.children;
            html += `
                <div class="family-row family-row--children">
                    <h4 class="family-row-title">Children</h4>
                    <div class="family-members">
                        ${this.renderFamilyMembers(children)}
                    </div>
                </div>`;
        }

        // Siblings
        if (hero.siblings || (hero.family && hero.family.siblings)) {
            const siblings = hero.siblings || hero.family.siblings;
            html += `
                <div class="family-row family-row--siblings">
                    <h4 class="family-row-title">Siblings</h4>
                    <div class="family-members">
                        ${this.renderFamilyMembers(siblings)}
                    </div>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render family members
     */
    renderFamilyMembers(members) {
        if (!members) return '';

        const memberList = Array.isArray(members) ? members : [members];
        return memberList.map((member, index) => {
            const name = typeof member === 'string' ? member : member.name;
            const role = typeof member === 'object' ? member.role : null;
            const isDivine = typeof member === 'object' ? member.divine : false;

            return `
                <div class="family-member ${isDivine ? 'family-member--divine' : ''}" style="--animation-delay: ${0.03 * index}s">
                    <span class="member-icon" aria-hidden="true">${isDivine ? '\u2728' : '\u{1F464}'}</span>
                    <span class="member-name">${this.escapeHtml(name)}</span>
                    ${role ? `<span class="member-role">(${this.escapeHtml(role)})</span>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Render divine connections (Associated Deities - prominent section)
     */
    renderDivineConnections(connections) {
        let html = `<section class="divine-connections detail-section hero-section--relationships" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u2728</span>
                Divine Connections
            </h2>
            <div class="connections-grid">`;

        if (connections.parentDivine) {
            html += `
                <div class="connection-card connection-card--parent" ${this.getAnimationStyle()}>
                    <div class="connection-icon connection-icon--glow" aria-hidden="true">\u2B50</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Divine Parent</h3>
                        <p class="connection-value connection-value--prominent">${this.escapeHtml(connections.parentDivine)}</p>
                    </div>
                </div>`;
        }

        if (connections.parentMortal) {
            html += `
                <div class="connection-card connection-card--mortal" ${this.getAnimationStyle()}>
                    <div class="connection-icon" aria-hidden="true">\u{1F465}</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Mortal Parent</h3>
                        <p class="connection-value">${this.escapeHtml(connections.parentMortal)}</p>
                    </div>
                </div>`;
        }

        if (connections.patron) {
            html += `
                <div class="connection-card connection-card--patron" ${this.getAnimationStyle()}>
                    <div class="connection-icon connection-icon--glow" aria-hidden="true">\u{1F64C}</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Divine Patron</h3>
                        <p class="connection-value connection-value--prominent">${this.escapeHtml(connections.patron)}</p>
                    </div>
                </div>`;
        }

        if (connections.allies && connections.allies.length > 0) {
            html += `
                <div class="connection-card connection-card--wide" ${this.getAnimationStyle()}>
                    <div class="connection-icon" aria-hidden="true">\u{1F91D}</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Divine Allies</h3>
                        <ul class="allies-list">
                            ${connections.allies.map(ally => `<li class="ally-item">${this.escapeHtml(ally)}</li>`).join('')}
                        </ul>
                    </div>
                </div>`;
        }

        if (connections.adversaries && connections.adversaries.length > 0) {
            html += `
                <div class="connection-card connection-card--adversary connection-card--wide" ${this.getAnimationStyle()}>
                    <div class="connection-icon adversary-icon" aria-hidden="true">\u26A0\uFE0F</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Divine Adversaries</h3>
                        <ul class="adversaries-list">
                            ${connections.adversaries.map(adv => `<li class="adversary-item">${this.escapeHtml(adv)}</li>`).join('')}
                        </ul>
                    </div>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render relationships section with tree visualization
     */
    renderRelationships(relationships) {
        // Group relationships by type
        const grouped = this.groupRelationshipsByType(relationships);

        let html = `<section class="hero-relationships detail-section hero-section--relationships" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F91D}</span>
                Key Relationships
                <span class="relationships-count">${relationships.length}</span>
            </h2>`;

        // Relationship tree visualization (if there are multiple relationship types)
        if (Object.keys(grouped).length > 1) {
            html += `
                <div class="relationship-tree" role="tree" aria-label="Relationship tree">
                    <div class="tree-center">
                        <div class="tree-hero-node">
                            <span class="node-icon" aria-hidden="true">\u{1F9D1}</span>
                            <span class="node-label">Hero</span>
                        </div>
                    </div>
                    <div class="tree-branches">`;

            // Render grouped relationships in tree form
            Object.entries(grouped).forEach(([type, rels], groupIndex) => {
                const config = this.relationshipTypes[type] || this.relationshipTypes.default;
                html += `
                    <div class="tree-branch tree-branch--${type}" style="--branch-color: ${config.color}; --branch-index: ${groupIndex};">
                        <div class="branch-label">
                            <span class="branch-icon" aria-hidden="true">${config.icon}</span>
                            <span class="branch-type">${this.capitalizeFirst(type)}</span>
                            <span class="branch-count">${rels.length}</span>
                        </div>
                        <div class="branch-nodes">
                            ${rels.map((rel, i) => this.renderRelationshipNode(rel, i, config)).join('')}
                        </div>
                    </div>`;
            });

            html += `
                    </div>
                </div>`;
        }

        // Card grid view
        html += `
            <div class="relationships-grid">`;

        relationships.forEach((rel, index) => {
            html += this.renderRelationshipCard(rel, index);
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Group relationships by type
     */
    groupRelationshipsByType(relationships) {
        const grouped = {};
        relationships.forEach(rel => {
            const type = (rel.type || 'other').toLowerCase();
            if (!grouped[type]) grouped[type] = [];
            grouped[type].push(rel);
        });
        return grouped;
    }

    /**
     * Render a relationship node for tree view
     */
    renderRelationshipNode(rel, index, config) {
        const name = typeof rel === 'string' ? rel : rel.name;
        const id = typeof rel === 'object' ? rel.id : null;
        const entityType = typeof rel === 'object' ? rel.entityType : 'heroes';

        return `
            <div class="tree-node" style="--animation-delay: ${0.05 * index}s">
                <div class="node-connector" style="border-color: ${config.color};"></div>
                <div class="node-content">
                    ${id ? `<a href="#/${entityType}/${id}" class="node-link">` : ''}
                        <span class="node-icon" aria-hidden="true">${config.icon}</span>
                        <span class="node-name">${this.escapeHtml(name)}</span>
                    ${id ? '</a>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render relationship card for grid view
     */
    renderRelationshipCard(rel, index) {
        const relationshipType = rel.type || 'connection';
        const config = this.relationshipTypes[relationshipType?.toLowerCase()] || this.relationshipTypes.default;
        const icon = config.icon;

        return `
            <article class="relationship-card relationship-card--${this.slugify(relationshipType)}"
                     style="--animation-delay: ${0.05 * index}s; --rel-color: ${config.color};">
                <div class="relationship-card-header">
                    <div class="relationship-icon-wrapper" style="background: ${config.color}15;">
                        <span class="relationship-icon" aria-hidden="true">${icon}</span>
                    </div>
                    <div class="relationship-info">
                        <h4 class="relationship-name">${this.escapeHtml(rel.name)}</h4>
                        <span class="relationship-type-badge" style="background: ${config.color}20; color: ${config.color};">
                            ${this.capitalizeFirst(relationshipType)}
                        </span>
                    </div>
                </div>
                ${rel.description ? `<p class="relationship-description">${this.escapeHtml(rel.description)}</p>` : ''}
                ${rel.significance ? `
                    <div class="relationship-significance">
                        <span class="significance-label">Significance:</span>
                        <span class="significance-value">${this.escapeHtml(rel.significance)}</span>
                    </div>
                ` : ''}
            </article>
        `;
    }

    /**
     * Get relationship icon
     */
    getRelationshipIcon(type) {
        const icons = {
            mentor: '\u{1F9D9}',
            friend: '\u{1F91D}',
            ally: '\u{1F91D}',
            rival: '\u2694\uFE0F',
            enemy: '\u{1F608}',
            lover: '\u2764\uFE0F',
            spouse: '\u{1F48D}',
            student: '\u{1F4DA}',
            companion: '\u{1F465}',
            servant: '\u{1F64F}',
            default: '\u{1F517}'
        };
        return icons[type?.toLowerCase()] || icons.default;
    }

    /**
     * Render worship practices
     */
    renderWorship(worship) {
        let html = `<section class="hero-worship detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F64C}</span>
                Worship & Veneration
            </h2>
            <div class="worship-grid">`;

        if (worship.cultCenters && worship.cultCenters.length > 0) {
            html += `
                <div class="worship-card" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">\u{1F3DB}\uFE0F</div>
                    <h3 class="worship-card-title">Cult Centers</h3>
                    <ul class="worship-list">
                        ${worship.cultCenters.map(center => `<li class="worship-item">${this.escapeHtml(center)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (worship.festivals && worship.festivals.length > 0) {
            html += `
                <div class="worship-card" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">\u{1F389}</div>
                    <h3 class="worship-card-title">Festivals</h3>
                    <ul class="worship-list">
                        ${worship.festivals.map(festival => `<li class="worship-item">${this.escapeHtml(festival)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (worship.offerings && worship.offerings.length > 0) {
            html += `
                <div class="worship-card" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">\u{1F374}</div>
                    <h3 class="worship-card-title">Ritual Offerings</h3>
                    <ul class="worship-list">
                        ${worship.offerings.map(offering => `<li class="worship-item">${this.escapeHtml(offering)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (worship.practices) {
            html += `
                <div class="worship-card worship-card--wide" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">\u{1F64F}</div>
                    <h3 class="worship-card-title">Worship Practices</h3>
                    <div class="worship-description">${this.renderContent(worship.practices)}</div>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render legacy section
     */
    renderLegacy(legacy) {
        let html = `<section class="hero-legacy detail-section hero-section--legacy" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F4DC}</span>
                Legacy & Influence
            </h2>
            <div class="legacy-grid">`;

        if (legacy.culturalImpact) {
            html += `
                <div class="legacy-card legacy-card-wide" ${this.getAnimationStyle()}>
                    <h3 class="legacy-card-title">Cultural Impact</h3>
                    <div class="legacy-card-content legacy-card-content--truncated" data-max-lines="4">
                        ${this.renderContent(legacy.culturalImpact)}
                    </div>
                </div>`;
        }

        if (legacy.symbolism) {
            html += `
                <div class="legacy-card" ${this.getAnimationStyle()}>
                    <h3 class="legacy-card-title">Symbolic Meaning</h3>
                    <div class="legacy-card-content">${this.renderContent(legacy.symbolism)}</div>
                </div>`;
        }

        if (legacy.modernReferences && legacy.modernReferences.length > 0) {
            html += `
                <div class="legacy-card" ${this.getAnimationStyle()}>
                    <h3 class="legacy-card-title">Modern References</h3>
                    <ul class="modern-refs-list">
                        ${legacy.modernReferences.map(ref => `<li class="modern-ref-item">${this.escapeHtml(ref)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (legacy.litteraryDepictions && legacy.litteraryDepictions.length > 0) {
            html += `
                <div class="legacy-card" ${this.getAnimationStyle()}>
                    <h3 class="legacy-card-title">Literary Depictions</h3>
                    <ul class="literary-list">
                        ${legacy.litteraryDepictions.map(dep => `<li class="literary-item">${this.escapeHtml(dep)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (legacy.influence) {
            html += `
                <div class="legacy-card legacy-card-wide" ${this.getAnimationStyle()}>
                    <h3 class="legacy-card-title">Historical Influence</h3>
                    <div class="legacy-card-content">${this.renderContent(legacy.influence)}</div>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render general content sections
     */
    renderSections(sections) {
        let html = '';

        sections.forEach((section, index) => {
            html += `<section class="content-section detail-section" ${this.getAnimationStyle()}>`;
            html += `<h2 class="section-title">${this.escapeHtml(section.title)}</h2>`;
            html += `<div class="section-prose section-prose--truncated" data-max-lines="4">${this.renderContent(section.content)}</div>`;
            html += `</section>`;
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
     * Render edit button
     */
    renderEditButton(mythology, entityId) {
        return `
            <div class="edit-controls">
                <button class="btn-edit" onclick="window.location.href='/admin/edit-hero.html?mythology=${mythology}&id=${entityId}'" aria-label="Edit this hero">
                    <span aria-hidden="true">\u270E</span> Edit Hero
                </button>
            </div>
        `;
    }

    /**
     * Render Epic/Saga section
     */
    renderEpicsSagas(hero) {
        const epics = hero.epics || hero.sagas || hero.tales || [];
        const epicList = Array.isArray(epics) ? epics : [epics];

        if (epicList.length === 0) return '';

        let html = `<section class="hero-epics detail-section hero-section--epics" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F4DC}</span>
                Epics & Sagas
                <span class="epics-count">${epicList.length} tales</span>
            </h2>
            <div class="epics-showcase">`;

        epicList.forEach((epic, index) => {
            const title = typeof epic === 'string' ? epic : epic.title || epic.name;
            const description = typeof epic === 'object' ? epic.description || epic.summary : null;
            const source = typeof epic === 'object' ? epic.source : null;
            const period = typeof epic === 'object' ? epic.period || epic.era : null;
            const significance = typeof epic === 'object' ? epic.significance : null;

            html += `
                <article class="epic-card" style="--animation-delay: ${0.1 * index}s">
                    <div class="epic-card-header">
                        <div class="epic-icon-wrapper">
                            <span class="epic-icon" aria-hidden="true">\u{1F4D6}</span>
                        </div>
                        <div class="epic-title-section">
                            <h3 class="epic-title">${this.escapeHtml(title)}</h3>
                            ${period ? `<span class="epic-period">${this.escapeHtml(period)}</span>` : ''}
                        </div>
                    </div>
                    ${description ? `
                        <div class="epic-description">
                            <p>${this.escapeHtml(description)}</p>
                        </div>
                    ` : ''}
                    <div class="epic-footer">
                        ${source ? `
                            <div class="epic-source">
                                <span class="source-icon" aria-hidden="true">\u{1F4DA}</span>
                                <span class="source-text">Source: ${this.escapeHtml(source)}</span>
                            </div>
                        ` : ''}
                        ${significance ? `
                            <div class="epic-significance">
                                <span class="significance-icon" aria-hidden="true">\u2728</span>
                                <span class="significance-text">${this.escapeHtml(significance)}</span>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Render Achievement Timeline with visual markers
     */
    renderAchievementTimeline(achievements) {
        let html = `<section class="hero-achievements detail-section hero-section--achievements" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u{1F3C6}</span>
                Achievement Timeline
                <span class="achievements-count">${achievements.length} milestones</span>
            </h2>
            <div class="achievement-timeline-wrapper">
                <div class="timeline-line" aria-hidden="true"></div>
                <div class="timeline-items">`;

        achievements.forEach((achievement, index) => {
            const title = typeof achievement === 'string' ? achievement : achievement.title || achievement.name;
            const description = typeof achievement === 'object' ? achievement.description : null;
            const date = typeof achievement === 'object' ? achievement.date || achievement.year || achievement.age : null;
            const category = typeof achievement === 'object' ? achievement.category || achievement.type : 'default';
            const location = typeof achievement === 'object' ? achievement.location : null;
            const outcome = typeof achievement === 'object' ? achievement.outcome : null;

            const categoryConfig = this.achievementCategories[category?.toLowerCase()] || this.achievementCategories.default;
            const isLeft = index % 2 === 0;

            html += `
                <div class="timeline-item timeline-item--${isLeft ? 'left' : 'right'}"
                     style="--animation-delay: ${0.1 * index}s; --timeline-color: ${categoryConfig.color};">
                    <div class="timeline-marker">
                        <span class="marker-icon" aria-hidden="true">${categoryConfig.icon}</span>
                    </div>
                    <div class="timeline-card">
                        <div class="timeline-card-header">
                            ${date ? `<span class="timeline-date">${this.escapeHtml(date)}</span>` : ''}
                            <span class="timeline-category" style="background: ${categoryConfig.color}20; color: ${categoryConfig.color};">
                                ${categoryConfig.label}
                            </span>
                        </div>
                        <h4 class="timeline-title">${this.escapeHtml(title)}</h4>
                        ${description ? `<p class="timeline-description">${this.escapeHtml(description)}</p>` : ''}
                        <div class="timeline-meta">
                            ${location ? `
                                <span class="timeline-location">
                                    <span class="meta-icon" aria-hidden="true">\u{1F4CD}</span>
                                    ${this.escapeHtml(location)}
                                </span>
                            ` : ''}
                            ${outcome ? `
                                <span class="timeline-outcome timeline-outcome--${this.getOutcomeClass(outcome)}">
                                    ${this.escapeHtml(outcome)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div></section>';
        return html;
    }

    /**
     * Get outcome class for styling
     */
    getOutcomeClass(outcome) {
        if (!outcome) return 'neutral';
        const lower = outcome.toLowerCase();
        if (lower.includes('success') || lower.includes('victory') || lower.includes('triumph')) return 'success';
        if (lower.includes('fail') || lower.includes('defeat') || lower.includes('death')) return 'failure';
        if (lower.includes('partial') || lower.includes('mixed')) return 'partial';
        return 'neutral';
    }

    /**
     * Enhanced Weapons and Artifacts showcase
     */
    renderWeaponShowcase(hero) {
        const items = [];

        // Collect all items
        if (hero.weapons) {
            const weaponList = Array.isArray(hero.weapons) ? hero.weapons : [hero.weapons];
            weaponList.forEach(w => {
                if (typeof w === 'string') {
                    items.push({ name: w, category: 'weapon' });
                } else {
                    items.push({ ...w, category: 'weapon' });
                }
            });
        }

        if (hero.artifacts) {
            const artifactList = Array.isArray(hero.artifacts) ? hero.artifacts : [hero.artifacts];
            artifactList.forEach(a => {
                if (typeof a === 'string') {
                    items.push({ name: a, category: 'artifact' });
                } else {
                    items.push({ ...a, category: 'artifact' });
                }
            });
        }

        if (hero.items) {
            const itemList = Array.isArray(hero.items) ? hero.items : [hero.items];
            itemList.forEach(i => {
                if (typeof i === 'string') {
                    items.push({ name: i, category: 'item' });
                } else {
                    items.push({ ...i, category: 'item' });
                }
            });
        }

        if (items.length === 0) return '';

        let html = `<section class="hero-artifacts-showcase detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">\u2694\uFE0F</span>
                Weapons & Artifacts
                <span class="artifacts-count">${items.length} items</span>
            </h2>
            <div class="artifacts-grid">`;

        items.forEach((item, index) => {
            const icon = this.getWeaponIcon(item);
            const rarity = item.rarity || 'legendary';
            const rarityClass = rarity.toLowerCase();

            html += `
                <article class="artifact-showcase-card artifact-showcase-card--${item.category} artifact-showcase-card--${rarityClass}"
                         style="--animation-delay: ${0.08 * index}s">
                    <div class="artifact-icon-wrapper">
                        <div class="artifact-icon-glow" aria-hidden="true"></div>
                        <span class="artifact-icon" aria-hidden="true">${icon}</span>
                    </div>
                    <div class="artifact-content">
                        <div class="artifact-header">
                            <h4 class="artifact-name">${this.escapeHtml(item.name)}</h4>
                            <div class="artifact-badges">
                                <span class="artifact-category-badge">${this.capitalizeFirst(item.category)}</span>
                                ${item.rarity ? `<span class="artifact-rarity-badge artifact-rarity--${rarityClass}">${item.rarity}</span>` : ''}
                            </div>
                        </div>
                        ${item.description ? `<p class="artifact-description">${this.escapeHtml(item.description)}</p>` : ''}
                        ${item.powers ? `
                            <div class="artifact-powers">
                                <span class="powers-label">Powers:</span>
                                <span class="powers-value">${this.escapeHtml(item.powers)}</span>
                            </div>
                        ` : ''}
                        ${item.origin ? `
                            <div class="artifact-origin">
                                <span class="origin-label">Origin:</span>
                                <span class="origin-value">${this.escapeHtml(item.origin)}</span>
                            </div>
                        ` : ''}
                        ${item.currentLocation ? `
                            <div class="artifact-location">
                                <span class="location-icon" aria-hidden="true">\u{1F4CD}</span>
                                <span class="location-value">${this.escapeHtml(item.currentLocation)}</span>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        });

        html += '</div></section>';
        return html;
    }

    /**
     * Get weapon icon based on item properties
     */
    getWeaponIcon(item) {
        if (!item) return this.weaponIcons.default;

        // Check item type/name for specific weapon types
        const name = (item.name || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const category = (item.category || '').toLowerCase();

        for (const [key, icon] of Object.entries(this.weaponIcons)) {
            if (name.includes(key) || type.includes(key) || category.includes(key)) {
                return icon;
            }
        }

        // Category-based fallback
        if (category === 'weapon') return '\u2694\uFE0F';
        if (category === 'artifact') return '\u2728';
        if (category === 'item') return '\u{1F48E}';

        return this.weaponIcons.default;
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Initialize timeline interactions
     */
    initTimelineInteractions(container) {
        // Add click handlers for expandable sections
        const expandBtns = container.querySelectorAll('.timeline-card');
        expandBtns.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a')) return; // Don't interfere with links
                card.classList.toggle('timeline-card--expanded');
            });
        });

        // Initialize relationship tree hover effects
        const treeNodes = container.querySelectorAll('.tree-node');
        treeNodes.forEach(node => {
            node.addEventListener('mouseenter', () => {
                node.classList.add('tree-node--highlighted');
            });
            node.addEventListener('mouseleave', () => {
                node.classList.remove('tree-node--highlighted');
            });
        });
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const renderer = new HeroRenderer();
        renderer.init();
    });
} else {
    const renderer = new HeroRenderer();
    renderer.init();
}

// Export for use in other scripts
window.HeroRenderer = HeroRenderer;
