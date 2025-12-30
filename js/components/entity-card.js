/**
 * Entity Card Component - Reusable display component for entities
 * Supports mini, compact, and full display modes
 * Integrates with theme system and entity loader
 */

(function() {
    'use strict';

    class EntityCard {
        constructor(options) {
            this.entityId = options.entityId;
            this.entityType = options.entityType;
            this.displayMode = options.displayMode || 'compact'; // 'mini', 'compact', 'full'
            this.container = options.container;
            this.mythology = options.mythology || null;
            this.data = null;
            this.loader = options.loader || window.entityLoader;
            this.onLoad = options.onLoad || null;
            this.interactive = options.interactive !== false;
        }

        /**
         * Load and render the entity card
         */
        async render() {
            try {
                // Load entity data
                this.data = await this.loader.loadEntity(this.entityId, this.entityType);

                // Generate HTML based on display mode
                let html = '';
                switch (this.displayMode) {
                    case 'mini':
                        html = this.renderMini();
                        break;
                    case 'compact':
                        html = this.renderCompact();
                        break;
                    case 'full':
                        html = this.renderFull();
                        break;
                    default:
                        html = this.renderCompact();
                }

                // Insert into container
                if (typeof this.container === 'string') {
                    const element = document.getElementById(this.container) ||
                                  document.querySelector(this.container);
                    if (element) {
                        element.innerHTML = html;
                        this.container = element;
                    }
                } else {
                    this.container.innerHTML = html;
                }

                // Attach event listeners
                if (this.interactive) {
                    this.attachEventListeners();
                }

                // Call onLoad callback
                if (this.onLoad) {
                    this.onLoad(this.data);
                }

                return true;
            } catch (error) {
                console.error('Error rendering entity card:', error);
                this.renderError(error);
                return false;
            }
        }

        /**
         * Render mini mode (inline badge)
         */
        renderMini() {
            const url = this.getEntityUrl();

            return `
                <span class="entity-card entity-card-mini"
                      data-entity-id="${this.entityId}"
                      data-entity-type="${this.entityType}">
                    <a href="${url}" class="entity-mini-link" title="${this.escapeHtml(this.data.shortDescription || this.data.name)}">
                        ${this.data.icon ? `<span class="entity-icon">${this.data.icon}</span>` : ''}
                        <span class="entity-name">${this.escapeHtml(this.data.name)}</span>
                    </a>
                </span>
            `;
        }

        /**
         * Render compact mode (card)
         */
        renderCompact() {
            const colors = this.data.colors || {};
            const primaryColor = colors.primary || '#667eea';
            const mythologies = this.data.mythologies || [];
            const primaryMythology = this.data.primaryMythology || (mythologies.length > 0 ? mythologies[0] : 'unknown');
            const mythologyLower = primaryMythology.toLowerCase();
            const iconContent = this.renderIconWithFallback(this.data.icon, this.data.name);

            return `
                <div class="entity-card entity-card-compact glass-card"
                     data-entity-id="${this.entityId}"
                     data-entity-type="${this.entityType}"
                     data-mythology="${mythologyLower}"
                     style="--entity-primary-color: ${primaryColor};"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeHtml(this.data.name)}">

                    <div class="entity-card-header">
                        <div class="entity-icon-large card-icon" aria-hidden="true">${iconContent}</div>
                        <div class="entity-info">
                            <h3 class="card-title">
                                <a href="${this.getEntityUrl()}">${this.escapeHtml(this.data.name)}</a>
                            </h3>
                            <div class="card-meta">
                                ${this.renderTypeBadge()}
                                ${mythologies.length > 0 ? this.renderMythologyBadges(mythologies) : ''}
                            </div>
                        </div>
                    </div>

                    ${this.data.shortDescription ? `
                        <p class="entity-short-desc card-description">${this.escapeHtml(this.data.shortDescription)}</p>
                    ` : ''}

                    ${this.renderWhisper(primaryMythology)}

                    ${this.renderCompactMetadata()}

                    <div class="entity-card-footer grid-card-footer">
                        <a href="${this.getEntityUrl()}" class="btn-view-details" aria-label="View details for ${this.escapeHtml(this.data.name)}">View Details</a>
                        ${this.interactive ? `<button class="btn-secondary entity-expand" data-id="${this.entityId}" data-type="${this.entityType}" aria-label="Expand ${this.escapeHtml(this.data.name)}">Expand</button>` : ''}
                        <button class="btn-icon entity-favorite"
                                data-entity-id="${this.entityId}"
                                data-entity-type="${this.entityType}"
                                data-entity-name="${this.escapeHtml(this.data.name)}"
                                data-entity-mythology="${mythologyLower}"
                                data-entity-icon="${this.data.icon || ''}"
                                aria-label="Add ${this.escapeHtml(this.data.name)} to favorites"
                                title="Add to Personal Pantheon">
                            <span class="favorite-icon">☆</span>
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Render icon with fallback
         */
        renderIconWithFallback(icon, name) {
            if (!icon) {
                // Generate fallback from first letter of name
                if (name) {
                    return `<span class="icon-fallback">${name.charAt(0).toUpperCase()}</span>`;
                }
                return '✨';
            }

            // Check if icon is an image URL
            if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.startsWith('http'))) {
                return `<img src="${icon}" alt="" class="entity-icon-img" loading="lazy" onerror="this.parentElement.textContent='✨'">`;
            }

            return icon;
        }

        /**
         * Render full mode (detailed panel)
         */
        renderFull() {
            const colors = this.data.colors || {};
            const primary = colors.primary || '#667eea';
            const secondary = colors.secondary || '#764ba2';

            return `
                <div class="entity-card entity-card-full glass-card"
                     data-entity-id="${this.entityId}"
                     data-entity-type="${this.entityType}">

                    <!-- Hero Section -->
                    <div class="entity-hero" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
                        ${this.data.icon ? `<div class="entity-icon-hero">${this.data.icon}</div>` : ''}
                        <h1 class="entity-title">${this.escapeHtml(this.data.name)}</h1>
                        ${this.data.linguistic?.originalName ? `
                            <div class="entity-original-name">${this.data.linguistic.originalName}</div>
                        ` : ''}
                        ${this.data.shortDescription ? `
                            <p class="entity-subtitle">${this.escapeHtml(this.data.shortDescription)}</p>
                        ` : ''}
                        ${this.renderMythologyBadges(this.data.mythologies || [])}
                    </div>

                    <!-- Main Content -->
                    <div class="entity-content">
                        ${this.renderFullDescription()}
                        ${this.renderLinguisticData()}
                        ${this.renderTypeSpecificContent()}
                        ${this.renderMetaphysicalProperties()}
                        ${this.renderGeographicalData()}
                        ${this.renderTemporalData()}
                        ${this.renderRelatedEntities()}
                        ${this.renderSources()}
                        ${this.renderArchetypes()}
                    </div>

                    <!-- Footer Actions -->
                    <div class="entity-card-footer">
                        <a href="${this.getEntityUrl()}" class="btn-primary">Full Page</a>
                        <button class="btn-secondary corpus-search" data-term="${this.escapeHtml(this.data.name)}">
                            📜 Search Texts
                        </button>
                        <button class="btn-secondary share-entity" data-id="${this.entityId}">
                            🔗 Share
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Render type badge
         */
        renderTypeBadge() {
            const typeIcons = {
                deity: '👑',
                item: '⚔️',
                place: '🏛️',
                concept: '💭',
                magic: '✨',
                creature: '🐉',
                hero: '🦸',
                archetype: '🎭'
            };

            const icon = typeIcons[this.entityType] || '📌';
            const label = this.capitalize(this.entityType);

            return `<span class="entity-type-badge" data-type="${this.entityType}">${icon} ${label}</span>`;
        }

        /**
         * Render a mythology whisper - atmospheric quote
         * Only renders 30% of the time to keep it special
         */
        renderWhisper(mythology) {
            // Only show whisper 30% of the time to keep it special
            if (Math.random() > 0.3) return '';

            // Check if MythologyWhispers is available
            if (typeof MythologyWhispers === 'undefined') return '';

            try {
                const whisper = MythologyWhispers.getWhisper(mythology);
                if (!whisper) return '';

                return `
                    <div class="entity-whisper" aria-hidden="true">
                        <span class="entity-whisper-text">${this.escapeHtml(whisper.text)}</span>
                        <span class="entity-whisper-source">${this.escapeHtml(whisper.source)}</span>
                    </div>
                `;
            } catch (error) {
                console.warn('[EntityCard] Failed to render whisper:', error);
                return '';
            }
        }

        /**
         * Render mythology badges
         */
        renderMythologyBadges(mythologies) {
            if (!mythologies || mythologies.length === 0) return '';

            return `
                <div class="entity-mythology-badges">
                    ${mythologies.map(myth => `
                        <span class="mythology-badge" data-mythology="${myth}">
                            ${this.capitalize(myth)}
                        </span>
                    `).join('')}
                </div>
            `;
        }

        /**
         * Render compact metadata (key facts)
         */
        renderCompactMetadata() {
            const metadata = [];

            // Category
            if (this.data.category) {
                metadata.push(`<strong>Category:</strong> ${this.capitalize(this.data.category.replace(/-/g, ' '))}`);
            }

            // Primary element
            const element = this.data.element || this.data.metaphysicalProperties?.primaryElement;
            if (element) {
                metadata.push(`<strong>Element:</strong> ${this.capitalize(element)}`);
            }

            // Connection count
            if (this.data.relatedCount) {
                const total = Object.values(this.data.relatedCount).reduce((sum, n) => sum + n, 0);
                if (total > 0) {
                    metadata.push(`<strong>Connections:</strong> ${total}`);
                }
            }

            if (metadata.length === 0) return '';

            return `
                <div class="entity-metadata-compact">
                    ${metadata.map(m => `<div class="metadata-item">${m}</div>`).join('')}
                </div>
            `;
        }

        /**
         * Render full description
         */
        renderFullDescription() {
            const desc = this.data.fullDescription || this.data.longDescription;
            if (!desc) return '';

            return `
                <div class="entity-section">
                    <h2>Description</h2>
                    <div class="entity-description">${this.renderMarkdown(desc)}</div>
                </div>
            `;
        }

        /**
         * Render linguistic data
         */
        renderLinguisticData() {
            const ling = this.data.linguistic;
            if (!ling) return '';

            return `
                <div class="entity-section linguistic-section">
                    <h2>Linguistic Information</h2>
                    <div class="property-grid">
                        ${ling.originalName ? `
                            <div class="property-card">
                                <div class="property-label">Original Name</div>
                                <div class="property-value">${ling.originalName}</div>
                            </div>
                        ` : ''}
                        ${ling.transliteration ? `
                            <div class="property-card">
                                <div class="property-label">Transliteration</div>
                                <div class="property-value">${ling.transliteration}</div>
                            </div>
                        ` : ''}
                        ${ling.pronunciation ? `
                            <div class="property-card">
                                <div class="property-label">Pronunciation</div>
                                <div class="property-value"><code>${ling.pronunciation}</code></div>
                            </div>
                        ` : ''}
                        ${ling.etymology?.meaning ? `
                            <div class="property-card">
                                <div class="property-label">Etymology</div>
                                <div class="property-value">${this.escapeHtml(ling.etymology.meaning)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render type-specific content
         */
        renderTypeSpecificContent() {
            switch (this.entityType) {
                case 'item':
                    return this.renderItemProperties();
                case 'place':
                    return this.renderPlaceProperties();
                case 'deity':
                    return this.renderDeityProperties();
                case 'concept':
                    return this.renderConceptProperties();
                case 'magic':
                    return this.renderMagicProperties();
                default:
                    return '';
            }
        }

        /**
         * Render item properties
         */
        renderItemProperties() {
            if (!this.data.properties && !this.data.uses) return '';

            return `
                <div class="entity-section">
                    <h2>Properties</h2>
                    ${this.data.properties ? `
                        <div class="property-grid">
                            ${this.data.properties.map(prop => `
                                <div class="property-card">
                                    <div class="property-label">${this.escapeHtml(prop.name)}</div>
                                    <div class="property-value">${this.escapeHtml(prop.value)}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${this.data.uses && this.data.uses.length > 0 ? `
                        <div class="uses-section">
                            <h3>Uses</h3>
                            <div class="tag-list">
                                ${this.data.uses.map(use => `<span class="tag">${this.escapeHtml(use)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render place properties
         */
        renderPlaceProperties() {
            const geo = this.data.geography || this.data.geographical;
            if (!geo) return '';

            return `
                <div class="entity-section">
                    <h2>Location Details</h2>
                    <div class="property-grid">
                        ${geo.realm ? `
                            <div class="property-card">
                                <div class="property-label">Realm</div>
                                <div class="property-value">${this.escapeHtml(geo.realm)}</div>
                            </div>
                        ` : ''}
                        ${geo.region ? `
                            <div class="property-card">
                                <div class="property-label">Region</div>
                                <div class="property-value">${this.escapeHtml(geo.region)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render deity properties
         */
        renderDeityProperties() {
            return `
                <div class="entity-section">
                    <h2>Divine Attributes</h2>
                    ${this.data.domains ? `
                        <div class="attribute-block">
                            <h3>Domains</h3>
                            <div class="tag-list">
                                ${this.data.domains.map(d => `<span class="tag">${this.escapeHtml(d)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${this.data.symbols ? `
                        <div class="attribute-block">
                            <h3>Symbols</h3>
                            <div class="tag-list">
                                ${this.data.symbols.map(s => `<span class="tag">${this.escapeHtml(s)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render concept properties
         */
        renderConceptProperties() {
            return '';
        }

        /**
         * Render magic properties
         */
        renderMagicProperties() {
            return '';
        }

        /**
         * Render metaphysical properties
         */
        renderMetaphysicalProperties() {
            const meta = this.data.metaphysicalProperties;
            if (!meta || Object.keys(meta).length === 0) return '';

            return `
                <div class="entity-section metaphysical-section">
                    <h2>Metaphysical Properties</h2>
                    <div class="property-grid">
                        ${meta.primaryElement ? `
                            <div class="property-card">
                                <div class="property-label">Element</div>
                                <div class="property-value">${this.capitalize(meta.primaryElement)}</div>
                            </div>
                        ` : ''}
                        ${meta.planet ? `
                            <div class="property-card">
                                <div class="property-label">Planet</div>
                                <div class="property-value">${meta.planet}</div>
                            </div>
                        ` : ''}
                        ${meta.sefirot && meta.sefirot.length > 0 ? `
                            <div class="property-card">
                                <div class="property-label">Sefirot</div>
                                <div class="property-value">${meta.sefirot.map(s => this.capitalize(s)).join(', ')}</div>
                            </div>
                        ` : ''}
                        ${meta.chakras && meta.chakras.length > 0 ? `
                            <div class="property-card">
                                <div class="property-label">Chakras</div>
                                <div class="property-value">${meta.chakras.map(c => this.capitalize(c)).join(', ')}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render geographical data
         */
        renderGeographicalData() {
            const geo = this.data.geographical;
            if (!geo) return '';

            return `
                <div class="entity-section geographical-section">
                    <h2>Geography</h2>
                    ${geo.region ? `<p><strong>Region:</strong> ${this.escapeHtml(geo.region)}</p>` : ''}
                    ${geo.modernCountries && geo.modernCountries.length > 0 ? `
                        <p><strong>Modern Countries:</strong> ${geo.modernCountries.join(', ')}</p>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Render temporal data
         */
        renderTemporalData() {
            const temp = this.data.temporal;
            if (!temp) return '';

            return `
                <div class="entity-section temporal-section">
                    <h2>Historical Context</h2>
                    ${temp.culturalPeriod ? `<p><strong>Period:</strong> ${this.escapeHtml(temp.culturalPeriod)}</p>` : ''}
                    ${temp.historicalDate?.display ? `<p><strong>Date:</strong> ${this.escapeHtml(temp.historicalDate.display)}</p>` : ''}
                </div>
            `;
        }

        /**
         * Render related entities
         */
        renderRelatedEntities() {
            const related = this.data.relatedEntities;
            if (!related) return '';

            const hasAny = Object.values(related).some(arr => arr && arr.length > 0);
            if (!hasAny) return '';

            return `
                <div class="entity-section related-entities-section">
                    <h2>Related Entities</h2>
                    ${Object.entries(related).map(([type, entities]) => {
                        if (!entities || entities.length === 0) return '';
                        return `
                            <div class="related-category">
                                <h3>${this.capitalize(type)}</h3>
                                <div class="entity-grid">
                                    ${entities.map(e => this.renderMiniEntityCard(e)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        /**
         * Render mini entity card for related entities
         */
        renderMiniEntityCard(entity) {
            return `
                <a href="${entity.url || ''}" class="entity-mini-card">
                    ${entity.icon ? `<span class="entity-icon">${entity.icon}</span>` : ''}
                    <span class="entity-name">${this.escapeHtml(entity.name)}</span>
                </a>
            `;
        }

        /**
         * Render sources
         */
        renderSources() {
            const sources = this.data.sources;
            if (!sources || sources.length === 0) return '';

            return `
                <div class="entity-section sources-section">
                    <h2>Ancient Sources</h2>
                    <ul class="sources-list">
                        ${sources.map(source => `
                            <li>
                                ${source.author ? `<strong>${this.escapeHtml(source.author)}</strong>, ` : ''}
                                <em>${this.escapeHtml(source.text || source.title)}</em>
                                ${source.passage ? `, ${this.escapeHtml(source.passage)}` : ''}
                                ${source.corpusUrl ? `<a href="${source.corpusUrl}" class="corpus-link">📜 View</a>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        /**
         * Render archetypes
         */
        renderArchetypes() {
            const archetypes = this.data.archetypes;
            if (!archetypes || archetypes.length === 0) return '';

            return `
                <div class="entity-section archetypes-section">
                    <h2>Archetypes</h2>
                    <div class="archetype-grid">
                        ${archetypes.map(arch => `
                            <div class="archetype-card">
                                <h3>${this.escapeHtml(arch.name || arch.category)}</h3>
                                ${arch.score !== undefined ? `
                                    <div class="archetype-score">
                                        <div class="score-bar">
                                            <div class="score-fill" style="width: ${arch.score}%"></div>
                                        </div>
                                        <span class="score-value">${arch.score}%</span>
                                    </div>
                                ` : ''}
                                ${arch.context ? `<p>${this.escapeHtml(arch.context)}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        /**
         * Render error state
         */
        renderError(error) {
            if (typeof this.container === 'string') {
                const element = document.getElementById(this.container) ||
                              document.querySelector(this.container);
                if (element) {
                    this.container = element;
                }
            }

            if (this.container) {
                this.container.innerHTML = `
                    <div class="entity-card entity-card-error">
                        <div class="error-icon">⚠️</div>
                        <p>Failed to load entity: ${this.entityId}</p>
                        <p class="error-detail">${this.escapeHtml(error.message)}</p>
                    </div>
                `;
            }
        }

        /**
         * Get entity URL
         */
        getEntityUrl() {
            // Try to use URL from data
            if (this.data && this.data.url) {
                return this.data.url;
            }

            // Construct URL
            const mythology = this.data?.primaryMythology || 'shared';
            const typeP = this.entityType + 's'; // plural
            return `/mythos/${mythology}/${typeP}/${this.entityId}.html`;
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            // Expand button
            const expandBtn = this.container.querySelector('.entity-expand');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    this.displayMode = 'full';
                    this.render();
                });
            }

            // Corpus search button
            const corpusBtn = this.container.querySelector('.corpus-search');
            if (corpusBtn) {
                corpusBtn.addEventListener('click', () => {
                    const term = corpusBtn.dataset.term;
                    window.location.href = `/corpus-search.html?term=${encodeURIComponent(term)}`;
                });
            }

            // Share button
            const shareBtn = this.container.querySelector('.share-entity');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    this.shareEntity();
                });
            }

            // Favorite button
            const favoriteBtn = this.container.querySelector('.entity-favorite');
            if (favoriteBtn) {
                // Check initial favorite state
                this.checkFavoriteState(favoriteBtn);

                favoriteBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.toggleFavorite(favoriteBtn);
                });
            }
        }

        /**
         * Check if entity is already favorited and update UI
         */
        async checkFavoriteState(button) {
            if (!window.EyesOfAzrael?.favorites) return;

            try {
                const entityId = button.dataset.entityId;
                const entityType = button.dataset.entityType;
                const isFavorited = await window.EyesOfAzrael.favorites.isFavorited(entityId, entityType);

                if (isFavorited) {
                    button.classList.add('favorited');
                    button.querySelector('.favorite-icon').textContent = '★';
                    button.setAttribute('aria-label', `Remove ${button.dataset.entityName} from favorites`);
                }
            } catch (error) {
                console.warn('[EntityCard] Could not check favorite state:', error);
            }
        }

        /**
         * Toggle favorite state
         */
        async toggleFavorite(button) {
            if (!window.EyesOfAzrael?.favorites) {
                console.warn('[EntityCard] FavoritesService not available');
                // Show tooltip or message that login is required
                alert('Please sign in to add favorites');
                return;
            }

            const entity = {
                id: button.dataset.entityId,
                type: button.dataset.entityType,
                name: button.dataset.entityName,
                mythology: button.dataset.entityMythology,
                icon: button.dataset.entityIcon
            };

            try {
                const result = await window.EyesOfAzrael.favorites.toggleFavorite(entity);

                if (result.success) {
                    if (result.isFavorited) {
                        button.classList.add('favorited');
                        button.querySelector('.favorite-icon').textContent = '★';
                        button.setAttribute('aria-label', `Remove ${entity.name} from favorites`);
                    } else {
                        button.classList.remove('favorited');
                        button.querySelector('.favorite-icon').textContent = '☆';
                        button.setAttribute('aria-label', `Add ${entity.name} to favorites`);
                    }
                }
            } catch (error) {
                console.error('[EntityCard] Failed to toggle favorite:', error);
            }
        }

        /**
         * Share entity (copy link)
         */
        async shareEntity() {
            const url = window.location.origin + this.getEntityUrl();

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: this.data.name,
                        text: this.data.shortDescription,
                        url: url
                    });
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard!');
                }
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }

        /**
         * Render markdown (basic)
         */
        renderMarkdown(text) {
            if (!text) return '';
            return text
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
        }

        /**
         * Capitalize string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
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
    }

    // Auto-initialize entity cards on page load
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize global entity loader if not exists
        if (!window.entityLoader) {
            window.entityLoader = new EntityLoader();
            await window.entityLoader.initialize();
        }

        // Find all auto-load entity cards
        document.querySelectorAll('[data-entity-card]').forEach(element => {
            const card = new EntityCard({
                entityId: element.dataset.entityId,
                entityType: element.dataset.entityType,
                displayMode: element.dataset.displayMode || 'compact',
                container: element,
                mythology: element.dataset.mythology || null
            });

            card.render().catch(console.error);
        });
    });

    // Export to window
    window.EntityCard = EntityCard;

})();
