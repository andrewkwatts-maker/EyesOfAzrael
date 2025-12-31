/**
 * Hero Renderer Component
 *
 * Dynamically loads and renders hero/demigod content from Firebase
 * Supports: biography, deeds, divine connections, worship, legacy
 *
 * Features:
 * - Polished card-based layout with timeline support
 * - Animated section reveals
 * - Mobile-friendly responsive design
 * - Accessible markup with proper ARIA
 * - Visual hierarchy with icons
 * - Quest/achievement timeline displays
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
            <div class="loading-state">
                <div class="loading-spinner-ring"></div>
                <p>Loading hero data...</p>
            </div>`;

        this.animationDelay = 0;
        const hero = await this.fetchHero(mythology, entityId);

        if (!hero) {
            container.innerHTML = `
                <div class="error-state">
                    <span class="error-icon" aria-hidden="true">&#9888;</span>
                    <p>Hero data not found. Content will load from HTML.</p>
                </div>`;
            return;
        }

        let html = '<article class="hero-detail-article">';

        // Header section
        html += this.renderHeader(hero);

        // Biography section
        if (hero.biography) {
            html += this.renderBiography(hero.biography);
        }

        // Deeds/Quests/Labors section
        if (hero.deeds && hero.deeds.length > 0) {
            html += this.renderDeeds(hero.deeds);
        }

        // Divine connections
        if (hero.divineConnections) {
            html += this.renderDivineConnections(hero.divineConnections);
        }

        // Worship section
        if (hero.worship) {
            html += this.renderWorship(hero.worship);
        }

        // Legacy section
        if (hero.legacy) {
            html += this.renderLegacy(hero.legacy);
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
    }

    /**
     * Render header with title and description
     */
    renderHeader(hero) {
        return `
            <header class="hero-header detail-header" ${this.getAnimationStyle()}>
                <div class="hero-icon-large" aria-hidden="true">
                    <span class="icon-float">${hero.icon || '&#9734;'}</span>
                </div>
                <div class="hero-header-content">
                    <h1 class="hero-title">${this.escapeHtml(hero.name)}</h1>
                    ${hero.subtitle ? `<p class="hero-subtitle">${this.escapeHtml(hero.subtitle)}</p>` : ''}
                    ${hero.shortDescription ? `<p class="hero-description">${this.escapeHtml(hero.shortDescription)}</p>` : ''}
                    <div class="hero-badges">
                        <span class="entity-type-badge">Hero</span>
                        ${hero.mythology ? `<span class="mythology-badge">${this.capitalize(hero.mythology)}</span>` : ''}
                        ${hero.era ? `<span class="era-badge">${this.escapeHtml(hero.era)}</span>` : ''}
                    </div>
                </div>
            </header>
        `;
    }

    /**
     * Render biography section
     */
    renderBiography(biography) {
        let html = `<section class="hero-biography detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128214;</span>
                Biography
            </h2>
            <div class="biography-grid">`;

        if (biography.birth) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">&#127774;</span>
                        Birth & Origins
                    </h3>
                    <div class="biography-card-content">${this.renderContent(biography.birth)}</div>
                </div>`;
        }

        if (biography.earlyLife) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">&#127793;</span>
                        Early Life
                    </h3>
                    <div class="biography-card-content">${this.renderContent(biography.earlyLife)}</div>
                </div>`;
        }

        if (biography.majorEvents && biography.majorEvents.length > 0) {
            html += `
                <div class="biography-card biography-card-wide" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">&#128197;</span>
                        Major Life Events
                    </h3>
                    <ul class="major-events-list">
                        ${biography.majorEvents.map((event, i) => `
                            <li class="major-event-item" style="--animation-delay: ${0.05 * i}s">
                                <span class="event-bullet" aria-hidden="true">&#9679;</span>
                                ${this.escapeHtml(event)}
                            </li>
                        `).join('')}
                    </ul>
                </div>`;
        }

        if (biography.death) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">&#9876;</span>
                        Death & Apotheosis
                    </h3>
                    <div class="biography-card-content">${this.renderContent(biography.death)}</div>
                </div>`;
        }

        if (biography.legacy) {
            html += `
                <div class="biography-card" ${this.getAnimationStyle()}>
                    <h3 class="biography-card-title">
                        <span class="card-icon" aria-hidden="true">&#127942;</span>
                        Legacy
                    </h3>
                    <div class="biography-card-content">${this.renderContent(biography.legacy)}</div>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render deeds/quests/labors
     */
    renderDeeds(deeds) {
        let html = `<section class="hero-deeds detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#9876;</span>
                Heroic Deeds
            </h2>`;

        // Sort by order if available
        const sortedDeeds = [...deeds].sort((a, b) => (a.order || 0) - (b.order || 0));

        html += '<div class="deeds-timeline" role="list">';
        sortedDeeds.forEach((deed, index) => {
            html += `
                <article class="deed-card" role="listitem" style="--animation-delay: ${0.1 * index}s">
                    <div class="deed-marker">
                        <span class="deed-number">${deed.order || index + 1}</span>
                    </div>
                    <div class="deed-content">
                        <h3 class="deed-title">${this.escapeHtml(deed.title)}</h3>
                        <div class="deed-description">${this.renderContent(deed.description)}</div>
                        ${deed.outcome ? `
                            <div class="deed-outcome">
                                <span class="outcome-label">Outcome:</span>
                                <span class="outcome-value">${this.escapeHtml(deed.outcome)}</span>
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
     * Render divine connections
     */
    renderDivineConnections(connections) {
        let html = `<section class="divine-connections detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#10024;</span>
                Divine Connections
            </h2>
            <div class="connections-grid">`;

        if (connections.parentDivine) {
            html += `
                <div class="connection-card" ${this.getAnimationStyle()}>
                    <div class="connection-icon" aria-hidden="true">&#9734;</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Divine Parent</h3>
                        <p class="connection-value">${this.escapeHtml(connections.parentDivine)}</p>
                    </div>
                </div>`;
        }

        if (connections.parentMortal) {
            html += `
                <div class="connection-card" ${this.getAnimationStyle()}>
                    <div class="connection-icon" aria-hidden="true">&#128101;</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Mortal Parent</h3>
                        <p class="connection-value">${this.escapeHtml(connections.parentMortal)}</p>
                    </div>
                </div>`;
        }

        if (connections.patron) {
            html += `
                <div class="connection-card" ${this.getAnimationStyle()}>
                    <div class="connection-icon" aria-hidden="true">&#128588;</div>
                    <div class="connection-content">
                        <h3 class="connection-title">Divine Patron</h3>
                        <p class="connection-value">${this.escapeHtml(connections.patron)}</p>
                    </div>
                </div>`;
        }

        if (connections.adversaries && connections.adversaries.length > 0) {
            html += `
                <div class="connection-card connection-card-wide" ${this.getAnimationStyle()}>
                    <div class="connection-icon adversary-icon" aria-hidden="true">&#9888;</div>
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
     * Render worship practices
     */
    renderWorship(worship) {
        let html = `<section class="hero-worship detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128588;</span>
                Worship & Veneration
            </h2>
            <div class="worship-grid">`;

        if (worship.cultCenters && worship.cultCenters.length > 0) {
            html += `
                <div class="worship-card" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">&#127963;</div>
                    <h3 class="worship-card-title">Cult Centers</h3>
                    <ul class="worship-list">
                        ${worship.cultCenters.map(center => `<li class="worship-item">${this.escapeHtml(center)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (worship.festivals && worship.festivals.length > 0) {
            html += `
                <div class="worship-card" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">&#127881;</div>
                    <h3 class="worship-card-title">Festivals</h3>
                    <ul class="worship-list">
                        ${worship.festivals.map(festival => `<li class="worship-item">${this.escapeHtml(festival)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        if (worship.offerings && worship.offerings.length > 0) {
            html += `
                <div class="worship-card" ${this.getAnimationStyle()}>
                    <div class="worship-card-icon" aria-hidden="true">&#127860;</div>
                    <h3 class="worship-card-title">Ritual Offerings</h3>
                    <ul class="worship-list">
                        ${worship.offerings.map(offering => `<li class="worship-item">${this.escapeHtml(offering)}</li>`).join('')}
                    </ul>
                </div>`;
        }

        html += '</div></section>';
        return html;
    }

    /**
     * Render legacy section
     */
    renderLegacy(legacy) {
        let html = `<section class="hero-legacy detail-section" ${this.getAnimationStyle()}>
            <h2 class="section-title">
                <span class="section-icon" aria-hidden="true">&#128220;</span>
                Legacy
            </h2>
            <div class="legacy-grid">`;

        if (legacy.culturalImpact) {
            html += `
                <div class="legacy-card legacy-card-wide" ${this.getAnimationStyle()}>
                    <h3 class="legacy-card-title">Cultural Impact</h3>
                    <div class="legacy-card-content">${this.renderContent(legacy.culturalImpact)}</div>
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
            html += `<div class="section-prose">${this.renderContent(section.content)}</div>`;
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
                    <span aria-hidden="true">&#9998;</span> Edit Hero
                </button>
            </div>
        `;
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
