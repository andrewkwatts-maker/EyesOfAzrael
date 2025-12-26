/**
 * Hero Renderer Component
 *
 * Dynamically loads and renders hero/demigod content from Firebase
 * Supports: biography, deeds, divine connections, worship, legacy
 *
 * Usage:
 * <div data-hero-content data-mythology="greek" data-entity="heracles" data-allow-edit="true"></div>
 */

class HeroRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.cache = new Map();
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
        container.innerHTML = '<div class="loading-spinner">Loading hero data...</div>';

        const hero = await this.fetchHero(mythology, entityId);

        if (!hero) {
            container.innerHTML = '<div class="error-message">Hero data not found. Content will load from HTML.</div>';
            return;
        }

        let html = '';

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

        container.innerHTML = html;
    }

    /**
     * Render header with title and description
     */
    renderHeader(hero) {
        return `
            <div class="hero-header">
                <h1>${hero.icon || '⭐'} ${hero.name}</h1>
                ${hero.subtitle ? `<p class="subtitle">${hero.subtitle}</p>` : ''}
                ${hero.shortDescription ? `<p class="short-description">${hero.shortDescription}</p>` : ''}
            </div>
        `;
    }

    /**
     * Render biography section
     */
    renderBiography(biography) {
        let html = '<section class="hero-biography"><h2>📖 Biography</h2>';

        if (biography.birth) {
            html += `<div class="biography-section"><h3>Birth & Origins</h3>${this.renderContent(biography.birth)}</div>`;
        }

        if (biography.earlyLife) {
            html += `<div class="biography-section"><h3>Early Life</h3>${this.renderContent(biography.earlyLife)}</div>`;
        }

        if (biography.majorEvents && biography.majorEvents.length > 0) {
            html += '<div class="biography-section"><h3>Major Life Events</h3><ul>';
            biography.majorEvents.forEach(event => {
                html += `<li>${event}</li>`;
            });
            html += '</ul></div>';
        }

        if (biography.death) {
            html += `<div class="biography-section"><h3>Death & Apotheosis</h3>${this.renderContent(biography.death)}</div>`;
        }

        if (biography.legacy) {
            html += `<div class="biography-section"><h3>Legacy</h3>${this.renderContent(biography.legacy)}</div>`;
        }

        html += '</section>';
        return html;
    }

    /**
     * Render deeds/quests/labors
     */
    renderDeeds(deeds) {
        let html = '<section class="hero-deeds"><h2>⚔️ Heroic Deeds</h2>';

        // Sort by order if available
        const sortedDeeds = [...deeds].sort((a, b) => (a.order || 0) - (b.order || 0));

        html += '<div class="deeds-timeline">';
        sortedDeeds.forEach((deed, index) => {
            html += `
                <div class="deed-card">
                    <div class="deed-number">${deed.order || index + 1}</div>
                    <h3>${deed.title}</h3>
                    ${this.renderContent(deed.description)}
                    ${deed.outcome ? `<p class="deed-outcome"><strong>Outcome:</strong> ${deed.outcome}</p>` : ''}
                </div>
            `;
        });
        html += '</div></section>';

        return html;
    }

    /**
     * Render divine connections
     */
    renderDivineConnections(connections) {
        let html = '<section class="divine-connections"><h2>✨ Divine Connections</h2>';

        if (connections.parentDivine) {
            html += `<div class="connection-card"><h3>Divine Parent</h3><p>${connections.parentDivine}</p></div>`;
        }

        if (connections.parentMortal) {
            html += `<div class="connection-card"><h3>Mortal Parent</h3><p>${connections.parentMortal}</p></div>`;
        }

        if (connections.patron) {
            html += `<div class="connection-card"><h3>Divine Patron</h3><p>${connections.patron}</p></div>`;
        }

        if (connections.adversaries && connections.adversaries.length > 0) {
            html += '<div class="connection-card"><h3>Divine Adversaries</h3><ul>';
            connections.adversaries.forEach(adv => {
                html += `<li>${adv}</li>`;
            });
            html += '</ul></div>';
        }

        html += '</section>';
        return html;
    }

    /**
     * Render worship practices
     */
    renderWorship(worship) {
        let html = '<section class="hero-worship"><h2>🙏 Worship & Veneration</h2>';

        if (worship.cultCenters && worship.cultCenters.length > 0) {
            html += '<div class="worship-card"><h3>Cult Centers</h3><ul>';
            worship.cultCenters.forEach(center => {
                html += `<li>${center}</li>`;
            });
            html += '</ul></div>';
        }

        if (worship.festivals && worship.festivals.length > 0) {
            html += '<div class="worship-card"><h3>Festivals</h3><ul>';
            worship.festivals.forEach(festival => {
                html += `<li>${festival}</li>`;
            });
            html += '</ul></div>';
        }

        if (worship.offerings && worship.offerings.length > 0) {
            html += '<div class="worship-card"><h3>Ritual Offerings</h3><ul>';
            worship.offerings.forEach(offering => {
                html += `<li>${offering}</li>`;
            });
            html += '</ul></div>';
        }

        html += '</section>';
        return html;
    }

    /**
     * Render legacy section
     */
    renderLegacy(legacy) {
        let html = '<section class="hero-legacy"><h2>📜 Legacy</h2>';

        if (legacy.culturalImpact) {
            html += `<div class="legacy-card"><h3>Cultural Impact</h3>${this.renderContent(legacy.culturalImpact)}</div>`;
        }

        if (legacy.modernReferences && legacy.modernReferences.length > 0) {
            html += '<div class="legacy-card"><h3>Modern References</h3><ul>';
            legacy.modernReferences.forEach(ref => {
                html += `<li>${ref}</li>`;
            });
            html += '</ul></div>';
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
     * Render edit button
     */
    renderEditButton(mythology, entityId) {
        return `
            <div class="edit-controls">
                <button class="btn-edit" onclick="window.location.href='/admin/edit-hero.html?mythology=${mythology}&id=${entityId}'">
                    ✏️ Edit Hero
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
