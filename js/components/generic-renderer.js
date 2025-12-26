/**
 * Generic Content Renderer Component
 *
 * Dynamically loads and renders generic content types from Firebase
 * Supports: herbs, symbols, concepts, figures, texts, locations, magic, paths
 *
 * Usage:
 * <div data-content data-type="herb" data-mythology="greek" data-entity="laurel" data-allow-edit="true"></div>
 */

class GenericRenderer {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.cache = new Map();
    }

    /**
     * Initialize all content sections on the page
     */
    init() {
        const contentSections = document.querySelectorAll('[data-content]');
        contentSections.forEach(section => {
            const entityType = section.dataset.type;
            const mythology = section.dataset.mythology;
            const entityId = section.dataset.entity;
            const allowEdit = section.dataset.allowEdit === 'true';

            this.renderContent(section, entityType, mythology, entityId, allowEdit);
        });
    }

    /**
     * Fetch content from Firestore
     */
    async fetchContent(entityType, mythology, entityId) {
        const cacheKey = `${entityType}/${mythology}/${entityId}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const docRef = this.db
                .collection('entities')
                .doc(mythology)
                .collection(entityType)
                .doc(entityId);

            const doc = await docRef.get();

            if (!doc.exists) {
                console.warn(`Content not found: ${entityType}/${mythology}/${entityId}`);
                return null;
            }

            const data = doc.data();
            this.cache.set(cacheKey, data);
            return data;

        } catch (error) {
            console.error('Error fetching content:', error);
            return null;
        }
    }

    /**
     * Render content
     */
    async renderContent(container, entityType, mythology, entityId, allowEdit = false) {
        container.innerHTML = '<div class="loading-spinner">Loading content...</div>';

        const content = await this.fetchContent(entityType, mythology, entityId);

        if (!content) {
            container.innerHTML = '<div class="error-message">Content not found. Will load from HTML.</div>';
            return;
        }

        let html = '';

        // Header section
        html += this.renderHeader(content, entityType);

        // Type-specific sections
        html += this.renderTypeSpecific(content, entityType);

        // General content sections
        if (content.sections && content.sections.length > 0) {
            html += this.renderSections(content.sections);
        }

        // Sources
        if (content.sources && content.sources.length > 0) {
            html += this.renderSources(content.sources);
        }

        // Edit button (if allowed)
        if (allowEdit) {
            html += this.renderEditButton(entityType, mythology, entityId);
        }

        container.innerHTML = html;
    }

    /**
     * Render header
     */
    renderHeader(content, entityType) {
        const typeIcons = {
            herb: '🌿',
            symbol: '⚛️',
            concept: '💡',
            figure: '👤',
            text: '📜',
            location: '📍',
            magic: '✨',
            path: '🛤️'
        };

        const icon = content.icon || typeIcons[entityType] || '⭐';

        return `
            <div class="content-header">
                <h1>${icon} ${content.name}</h1>
                ${content.subtitle ? `<p class="subtitle">${content.subtitle}</p>` : ''}
                ${content.shortDescription ? `<p class="short-description">${content.shortDescription}</p>` : ''}
                <span class="entity-type-badge">${entityType}</span>
            </div>
        `;
    }

    /**
     * Render type-specific content
     */
    renderTypeSpecific(content, entityType) {
        switch (entityType) {
            case 'herb':
                return this.renderHerb(content);
            case 'symbol':
                return this.renderSymbol(content);
            case 'concept':
                return this.renderConcept(content);
            case 'figure':
                return this.renderFigure(content);
            case 'text':
                return this.renderText(content);
            case 'location':
                return this.renderLocation(content);
            case 'magic':
                return this.renderMagic(content);
            default:
                return '';
        }
    }

    /**
     * Render herb-specific content
     */
    renderHerb(herb) {
        let html = '';

        if (herb.uses && herb.uses.length > 0) {
            html += '<section class="herb-uses"><h2>🎯 Uses & Applications</h2><ul>';
            herb.uses.forEach(use => {
                html += `<li>${use}</li>`;
            });
            html += '</ul></section>';
        }

        if (herb.properties && herb.properties.length > 0) {
            html += '<section class="herb-properties"><h2>⚗️ Properties</h2><ul>';
            herb.properties.forEach(prop => {
                html += `<li>${prop}</li>`;
            });
            html += '</ul></section>';
        }

        if (herb.preparation && herb.preparation.length > 0) {
            html += '<section class="herb-preparation"><h2>📋 Preparation</h2><ul>';
            herb.preparation.forEach(prep => {
                html += `<li>${prep}</li>`;
            });
            html += '</ul></section>';
        }

        return html;
    }

    /**
     * Render symbol-specific content
     */
    renderSymbol(symbol) {
        let html = '';

        if (symbol.meanings && symbol.meanings.length > 0) {
            html += '<section class="symbol-meanings"><h2>🔮 Meanings</h2><ul>';
            symbol.meanings.forEach(meaning => {
                html += `<li>${meaning}</li>`;
            });
            html += '</ul></section>';
        }

        return html;
    }

    /**
     * Render concept-specific content
     */
    renderConcept(concept) {
        let html = '';

        if (concept.principles && concept.principles.length > 0) {
            html += '<section class="concept-principles"><h2>📖 Key Principles</h2><ul>';
            concept.principles.forEach(principle => {
                html += `<li>${principle}</li>`;
            });
            html += '</ul></section>';
        }

        if (concept.applications && concept.applications.length > 0) {
            html += '<section class="concept-applications"><h2>🎯 Applications</h2><ul>';
            concept.applications.forEach(app => {
                html += `<li>${app}</li>`;
            });
            html += '</ul></section>';
        }

        return html;
    }

    /**
     * Render figure-specific content
     */
    renderFigure(figure) {
        let html = '';

        if (figure.achievements && figure.achievements.length > 0) {
            html += '<section class="figure-achievements"><h2>🏆 Achievements</h2><ul>';
            figure.achievements.forEach(achievement => {
                html += `<li>${achievement}</li>`;
            });
            html += '</ul></section>';
        }

        return html;
    }

    /**
     * Render text-specific content
     */
    renderText(text) {
        let html = '';

        if (text.themes && text.themes.length > 0) {
            html += '<section class="text-themes"><h2>📚 Themes</h2><ul>';
            text.themes.forEach(theme => {
                html += `<li>${theme}</li>`;
            });
            html += '</ul></section>';
        }

        return html;
    }

    /**
     * Render location-specific content
     */
    renderLocation(location) {
        let html = '';

        if (location.coordinates) {
            html += `<section class="location-coords"><h2>📍 Coordinates</h2>`;
            html += `<p>Lat: ${location.coordinates.lat}, Long: ${location.coordinates.lng}</p>`;
            html += '</section>';
        }

        return html;
    }

    /**
     * Render magic-specific content
     */
    renderMagic(magic) {
        let html = '';

        if (magic.components && magic.components.length > 0) {
            html += '<section class="magic-components"><h2>🧪 Components</h2><ul>';
            magic.components.forEach(comp => {
                html += `<li>${comp}</li>`;
            });
            html += '</ul></section>';
        }

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
    renderEditButton(entityType, mythology, entityId) {
        return `
            <div class="edit-controls">
                <button class="btn-edit" onclick="window.location.href='/admin/edit-content.html?type=${entityType}&mythology=${mythology}&id=${entityId}'">
                    ✏️ Edit Content
                </button>
            </div>
        `;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const renderer = new GenericRenderer();
        renderer.init();
    });
} else {
    const renderer = new GenericRenderer();
    renderer.init();
}

// Export for use in other scripts
window.GenericRenderer = GenericRenderer;
