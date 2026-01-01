/**
 * Entity Card Component - Reusable display component for entities
 * Supports mini, compact, and full display modes
 * Integrates with theme system and entity loader
 */

(function() {
    'use strict';

    class EntityCard {
        constructor(options) {
            // Input validation
            this.entityId = this.validateEntityId(options.entityId);
            this.entityType = this.validateEntityType(options.entityType);
            this.displayMode = options.displayMode || 'compact'; // 'mini', 'compact', 'full'
            this.container = options.container;
            this.mythology = options.mythology || null;
            this.data = null;
            this.loader = options.loader || window.entityLoader;
            this.onLoad = options.onLoad || null;
            this.interactive = options.interactive !== false;

            // Track event listeners for cleanup
            this._eventListeners = [];
            this._isDestroyed = false;
        }

        /**
         * Validate entityId - must be a non-empty string with safe characters
         */
        validateEntityId(entityId) {
            if (!entityId || typeof entityId !== 'string') {
                console.error('[EntityCard] Invalid entityId: must be a non-empty string');
                return null;
            }
            // Sanitize: only allow alphanumeric, hyphens, underscores
            const sanitized = entityId.trim();
            if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
                console.error('[EntityCard] Invalid entityId: contains unsafe characters');
                return null;
            }
            return sanitized;
        }

        /**
         * Validate entityType - must be one of the allowed types
         */
        validateEntityType(entityType) {
            const validTypes = ['deity', 'hero', 'creature', 'item', 'place', 'concept', 'magic', 'archetype', 'text', 'ritual', 'herb', 'symbol', 'cosmology', 'mythology'];
            if (!entityType || typeof entityType !== 'string') {
                console.error('[EntityCard] Invalid entityType: must be a non-empty string');
                return null;
            }
            const normalized = entityType.toLowerCase().trim();
            if (!validTypes.includes(normalized)) {
                console.warn(`[EntityCard] Unknown entityType "${normalized}", proceeding with caution`);
            }
            return normalized;
        }

        /**
         * Load and render the entity card
         */
        async render() {
            // Check if destroyed
            if (this._isDestroyed) {
                console.warn('[EntityCard] Cannot render: card has been destroyed');
                return false;
            }

            // Validate inputs before proceeding
            if (!this.entityId || !this.entityType) {
                const error = new Error('Invalid entityId or entityType');
                this.renderError(error);
                return false;
            }

            // Resolve container element
            if (typeof this.container === 'string') {
                const element = document.getElementById(this.container) ||
                              document.querySelector(this.container);
                if (element) {
                    this.container = element;
                } else {
                    console.error('[EntityCard] Container not found:', this.container);
                    return false;
                }
            }

            // Show loading state
            this.renderLoading();

            try {
                // Load entity data
                this.data = await this.loader.loadEntity(this.entityId, this.entityType);

                // Check if destroyed during async load
                if (this._isDestroyed) {
                    return false;
                }

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
                this.container.innerHTML = html;
                this.container.removeAttribute('aria-busy');

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
         * Render loading placeholder
         */
        renderLoading() {
            if (!this.container) return;

            this.container.setAttribute('aria-busy', 'true');
            this.container.innerHTML = `
                <div class="entity-card entity-card-compact entity-card-loading glass-card skeleton"
                     role="article"
                     aria-label="Loading entity...">
                    <div class="entity-card-header">
                        <div class="entity-icon-large card-icon skeleton-icon" aria-hidden="true"></div>
                        <div class="entity-info">
                            <div class="card-title skeleton-text"></div>
                            <div class="card-meta skeleton-text skeleton-text-sm"></div>
                        </div>
                    </div>
                    <p class="entity-short-desc card-description skeleton-text"></p>
                    <div class="entity-card-footer grid-card-footer">
                        <span class="skeleton-button"></span>
                    </div>
                </div>
            `;
        }

        /**
         * Render mini mode (inline badge)
         */
        renderMini() {
            const url = this.getEntityUrl();

            return `
                <span class="entity-card entity-card-mini"
                      data-entity-id="${this.escapeAttr(this.entityId)}"
                      data-entity-type="${this.escapeAttr(this.entityType)}">
                    <a href="${url}" class="entity-mini-link" title="${this.escapeAttr(this.data.shortDescription || this.data.name)}">
                        ${this.data.icon ? `<span class="entity-icon">${this.escapeHtml(this.data.icon)}</span>` : ''}
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
            const sourceClass = this.getSourceClass();
            const sourceLabel = this.getSourceLabel();

            return `
                <div class="entity-card entity-card-compact glass-card ${sourceClass}"
                     data-entity-id="${this.escapeAttr(this.entityId)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}"
                     data-mythology="${this.escapeAttr(mythologyLower)}"
                     style="--entity-primary-color: ${this.escapeAttr(primaryColor)};"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeAttr(this.data.name)} - ${sourceLabel}">

                    <div class="entity-card-header">
                        <div class="entity-icon-large card-icon" aria-hidden="true">${iconContent}</div>
                        <div class="entity-info">
                            <h2 class="card-title">
                                <a href="${this.getEntityUrl()}">${this.escapeHtml(this.data.name)}</a>
                            </h2>
                            ${this.renderAuthorBadge()}
                            <div class="card-meta" role="doc-subtitle">
                                ${this.renderTypeBadge()}
                                ${mythologies.length > 0 ? this.renderMythologyBadges(mythologies) : ''}
                                ${this.renderPerspectivesIndicator()}
                            </div>
                        </div>
                    </div>

                    ${this.data.shortDescription ? `
                        <p class="entity-short-desc card-description">${this.escapeHtml(this.data.shortDescription)}</p>
                    ` : ''}

                    ${this.renderWhisper(primaryMythology)}

                    ${this.renderCompactMetadata()}

                    <div class="entity-card-footer grid-card-footer">
                        <a href="${this.getEntityUrl()}" class="btn-view-details" aria-label="View full details for ${this.escapeHtml(this.data.name)}">View Details</a>
                        ${this.interactive ? `<button class="btn-secondary entity-expand" data-id="${this.escapeAttr(this.entityId)}" data-type="${this.escapeAttr(this.entityType)}" aria-label="Expand ${this.escapeHtml(this.data.name)}">Expand</button>` : ''}
                        ${this.renderFavoriteButton(mythologyLower)}
                    </div>
                </div>
            `;
        }

        /**
         * Render icon with fallback
         */
        renderIconWithFallback(icon, name) {
            const fallbackLetter = name ? this.escapeHtml(name.charAt(0).toUpperCase()) : '';
            const fallbackHtml = fallbackLetter
                ? `<span class="icon-fallback">${fallbackLetter}</span>`
                : '<span class="icon-fallback" aria-hidden="true">&#10024;</span>';

            if (!icon) {
                return fallbackHtml;
            }

            // Check if it's inline SVG (starts with <svg)
            if (typeof icon === 'string') {
                const iconTrimmed = icon.trim();
                if (iconTrimmed.toLowerCase().startsWith('<svg')) {
                    // Render inline SVG directly (SVG is already safe markup)
                    return `<span class="entity-icon-svg" aria-hidden="true">${icon}</span>`;
                }
            }

            if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.includes('.webp') || icon.startsWith('http'))) {
                const sanitizedUrl = this.sanitizeUrl(icon);
                if (!sanitizedUrl) {
                    return fallbackHtml;
                }
                return `<img src="${this.escapeAttr(sanitizedUrl)}"
                             alt=""
                             class="entity-icon-img"
                             loading="lazy"
                             decoding="async"
                             data-fallback-letter="${this.escapeAttr(fallbackLetter || '&#10024;')}"
                             width="56"
                             height="56"
                             data-fallback-html="${this.escapeAttr(fallbackHtml)}">`;
            }

            // Escape any text/emoji icon to prevent XSS
            return `<span class="entity-icon-text" aria-hidden="true">${this.escapeHtml(icon)}</span>`;
        }

        /**
         * Sanitize URL to prevent XSS attacks via javascript: or data: URLs
         * @param {string} url - The URL to sanitize
         * @returns {string|null} - Sanitized URL or null if invalid
         */
        sanitizeUrl(url) {
            if (!url || typeof url !== 'string') return null;

            // Trim and normalize
            const trimmedUrl = url.trim().toLowerCase();

            // Block dangerous URL schemes
            const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
            for (const scheme of dangerousSchemes) {
                if (trimmedUrl.startsWith(scheme)) {
                    console.warn('[EntityCard] Blocked potentially dangerous URL:', url.substring(0, 50));
                    return null;
                }
            }

            // Allow http, https, and relative URLs
            if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./')) {
                return url;
            }

            // Block any other scheme (anything with : before /)
            if (trimmedUrl.indexOf(':') < trimmedUrl.indexOf('/') && trimmedUrl.indexOf(':') !== -1) {
                console.warn('[EntityCard] Blocked URL with unknown scheme:', url.substring(0, 50));
                return null;
            }

            return url;
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
                     data-entity-id="${this.escapeAttr(this.entityId)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}">

                    <!-- Hero Section -->
                    <div class="entity-hero" style="background: linear-gradient(135deg, ${this.escapeAttr(primary)}, ${this.escapeAttr(secondary)});">
                        ${this.data.icon ? `<div class="entity-icon-hero">${this.escapeHtml(this.data.icon)}</div>` : ''}
                        <h1 class="entity-title">${this.escapeHtml(this.data.name)}</h1>
                        ${this.data.linguistic?.originalName ? `
                            <div class="entity-original-name">${this.escapeHtml(this.data.linguistic.originalName)}</div>
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
                        <button class="btn-secondary corpus-search" data-term="${this.escapeAttr(this.data.name)}">
                            Search Texts
                        </button>
                        <button class="btn-secondary share-entity" data-id="${this.escapeAttr(this.entityId)}">
                            Share
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
                deity: '&#128081;',       // Crown
                item: '&#9876;',          // Crossed swords
                place: '&#127963;',       // Classical building
                concept: '&#128173;',     // Thought bubble
                magic: '&#10024;',        // Sparkles
                creature: '&#128009;',    // Dragon
                hero: '&#129464;',        // Superhero
                archetype: '&#127917;',   // Theater masks
                ritual: '&#128718;',      // Candle
                text: '&#128220;',        // Scroll
                herb: '&#127807;',        // Herb/leaf
                symbol: '&#9889;',        // Lightning bolt
                cosmology: '&#127756;',   // Globe with meridians
                mythology: '&#127760;'    // Globe
            };

            const icon = typeIcons[this.entityType] || '&#10024;';
            const label = this.capitalize(this.entityType);

            return `<span class="entity-type-badge" data-type="${this.escapeAttr(this.entityType)}">${icon} ${this.escapeHtml(label)}</span>`;
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
                        <span class="mythology-badge" data-mythology="${this.escapeAttr(myth)}">
                            ${this.escapeHtml(this.capitalize(myth))}
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

            // Category - escape the value
            if (this.data.category) {
                const categoryDisplay = this.escapeHtml(this.capitalize(this.data.category.replace(/-/g, ' ')));
                metadata.push(`<strong>Category:</strong> ${categoryDisplay}`);
            }

            // Primary element - escape the value
            const element = this.data.element || this.data.metaphysicalProperties?.primaryElement;
            if (element) {
                const elementDisplay = this.escapeHtml(this.capitalize(element));
                metadata.push(`<strong>Element:</strong> ${elementDisplay}`);
            }

            // Connection count - numeric, safe
            if (this.data.relatedCount) {
                const total = Object.values(this.data.relatedCount).reduce((sum, n) => sum + n, 0);
                if (total > 0) {
                    metadata.push(`<strong>Connections:</strong> ${parseInt(total, 10)}`);
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
                                <div class="property-value">${this.escapeHtml(ling.originalName)}</div>
                            </div>
                        ` : ''}
                        ${ling.transliteration ? `
                            <div class="property-card">
                                <div class="property-label">Transliteration</div>
                                <div class="property-value">${this.escapeHtml(ling.transliteration)}</div>
                            </div>
                        ` : ''}
                        ${ling.pronunciation ? `
                            <div class="property-card">
                                <div class="property-label">Pronunciation</div>
                                <div class="property-value"><code>${this.escapeHtml(ling.pronunciation)}</code></div>
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
         * TODO: Implement proper rendering for concept entities.
         * Concepts may include properties such as:
         * - philosophical principles/foundations
         * - related traditions
         * - symbolic meanings
         * - abstract vs. concrete manifestations
         * Currently returns empty string as concept entity data schema is not yet finalized.
         */
        renderConceptProperties() {
            // Return empty until concept schema is finalized
            // Check if we have any concept-specific data to render
            if (!this.data) return '';

            const props = [];

            // Render any available concept-like properties
            if (this.data.principles && this.data.principles.length > 0) {
                props.push(`
                    <div class="attribute-block">
                        <h3>Principles</h3>
                        <div class="tag-list">
                            ${this.data.principles.map(p => `<span class="tag">${this.escapeHtml(p)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (this.data.traditions && this.data.traditions.length > 0) {
                props.push(`
                    <div class="attribute-block">
                        <h3>Traditions</h3>
                        <div class="tag-list">
                            ${this.data.traditions.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (props.length === 0) return '';

            return `
                <div class="entity-section">
                    <h2>Conceptual Attributes</h2>
                    ${props.join('')}
                </div>
            `;
        }

        /**
         * Render magic properties
         * TODO: Implement proper rendering for magic/spell entities.
         * Magic entities may include properties such as:
         * - spell components/ingredients
         * - casting requirements
         * - magical effects and duration
         * - associated traditions/schools
         * - power level/difficulty
         * Currently returns empty string as magic entity data schema is not yet finalized.
         */
        renderMagicProperties() {
            // Return empty until magic schema is finalized
            // Check if we have any magic-specific data to render
            if (!this.data) return '';

            const props = [];

            // Render any available magic-like properties
            if (this.data.components && this.data.components.length > 0) {
                props.push(`
                    <div class="attribute-block">
                        <h3>Components</h3>
                        <div class="tag-list">
                            ${this.data.components.map(c => `<span class="tag">${this.escapeHtml(c)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (this.data.effects && this.data.effects.length > 0) {
                props.push(`
                    <div class="attribute-block">
                        <h3>Effects</h3>
                        <div class="tag-list">
                            ${this.data.effects.map(e => `<span class="tag">${this.escapeHtml(e)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (this.data.school) {
                props.push(`
                    <div class="attribute-block">
                        <h3>School/Tradition</h3>
                        <p>${this.escapeHtml(this.data.school)}</p>
                    </div>
                `);
            }

            if (props.length === 0) return '';

            return `
                <div class="entity-section">
                    <h2>Magical Properties</h2>
                    ${props.join('')}
                </div>
            `;
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
                                <div class="property-value">${this.escapeHtml(this.capitalize(meta.primaryElement))}</div>
                            </div>
                        ` : ''}
                        ${meta.planet ? `
                            <div class="property-card">
                                <div class="property-label">Planet</div>
                                <div class="property-value">${this.escapeHtml(meta.planet)}</div>
                            </div>
                        ` : ''}
                        ${meta.sefirot && meta.sefirot.length > 0 ? `
                            <div class="property-card">
                                <div class="property-label">Sefirot</div>
                                <div class="property-value">${meta.sefirot.map(s => this.escapeHtml(this.capitalize(s))).join(', ')}</div>
                            </div>
                        ` : ''}
                        ${meta.chakras && meta.chakras.length > 0 ? `
                            <div class="property-card">
                                <div class="property-label">Chakras</div>
                                <div class="property-value">${meta.chakras.map(c => this.escapeHtml(this.capitalize(c))).join(', ')}</div>
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
                        <p><strong>Modern Countries:</strong> ${geo.modernCountries.map(c => this.escapeHtml(c)).join(', ')}</p>
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
            const safeUrl = this.sanitizeUrl(entity.url) || '#';
            return `
                <a href="${this.escapeAttr(safeUrl)}" class="entity-mini-card">
                    ${entity.icon ? `<span class="entity-icon">${this.escapeHtml(entity.icon)}</span>` : ''}
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
                        ${sources.map(source => {
                            const safeCorpusUrl = source.corpusUrl ? this.sanitizeUrl(source.corpusUrl) : null;
                            return `
                            <li>
                                ${source.author ? `<strong>${this.escapeHtml(source.author)}</strong>, ` : ''}
                                <em>${this.escapeHtml(source.text || source.title)}</em>
                                ${source.passage ? `, ${this.escapeHtml(source.passage)}` : ''}
                                ${safeCorpusUrl ? `<a href="${this.escapeAttr(safeCorpusUrl)}" class="corpus-link">&#128220; View</a>` : ''}
                            </li>
                        `}).join('')}
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
         * Add event listener with tracking for cleanup
         * @private
         */
        _addTrackedListener(element, event, handler) {
            if (!element) return;
            element.addEventListener(event, handler);
            this._eventListeners.push({ element, event, handler });
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            this._cleanupEventListeners();

            const iconImages = this.container.querySelectorAll('.entity-icon-img');
            iconImages.forEach(img => {
                const errorHandler = () => {
                    const parent = img.parentElement;
                    if (parent) {
                        const fallbackHtml = img.dataset.fallbackHtml || `<span class="icon-fallback" aria-hidden="true">&#10024;</span>`;
                        const span = document.createElement('span');
                        span.className = 'icon-fallback';
                        span.setAttribute('aria-hidden', 'true');
                        span.innerHTML = fallbackHtml.replace(/^<span class="icon-fallback"[^>]*>|<\/span>$/g, '');
                        parent.replaceChild(span, img);
                    }
                };
                const loadHandler = () => {
                    img.style.opacity = '1';
                };
                img.style.opacity = '0.8';
                img.style.transition = 'opacity 0.3s ease';
                this._addTrackedListener(img, 'error', errorHandler);
                this._addTrackedListener(img, 'load', loadHandler);
            });

            // Keyboard navigation for card (Enter/Space to navigate)
            const card = this.container.querySelector('.entity-card[tabindex="0"]');
            if (card) {
                const keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        // Don't trigger if focus is on a button or link inside the card
                        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                            return;
                        }
                        e.preventDefault();
                        const detailsLink = card.querySelector('.btn-view-details');
                        if (detailsLink) {
                            detailsLink.click();
                        }
                    }
                };
                this._addTrackedListener(card, 'keydown', keyHandler);
            }

            // Expand button
            const expandBtn = this.container.querySelector('.entity-expand');
            if (expandBtn) {
                const expandHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.displayMode = 'full';
                    this.render();
                };
                this._addTrackedListener(expandBtn, 'click', expandHandler);
            }

            // Corpus search button
            const corpusBtn = this.container.querySelector('.corpus-search');
            if (corpusBtn) {
                const corpusHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const term = corpusBtn.dataset.term;
                    window.location.href = `/corpus-search.html?term=${encodeURIComponent(term)}`;
                };
                this._addTrackedListener(corpusBtn, 'click', corpusHandler);
            }

            // Share button
            const shareBtn = this.container.querySelector('.share-entity');
            if (shareBtn) {
                const shareHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.shareEntity();
                };
                this._addTrackedListener(shareBtn, 'click', shareHandler);
            }

            // Favorite button - only attach if FavoritesService might be available
            const favoriteBtn = this.container.querySelector('.entity-favorite');
            if (favoriteBtn) {
                // Check initial favorite state (gracefully handles missing service)
                this.checkFavoriteState(favoriteBtn);

                const favoriteHandler = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.toggleFavorite(favoriteBtn);
                };
                this._addTrackedListener(favoriteBtn, 'click', favoriteHandler);
            }
        }

        /**
         * Clean up tracked event listeners
         * @private
         */
        _cleanupEventListeners() {
            this._eventListeners.forEach(({ element, event, handler }) => {
                try {
                    element.removeEventListener(event, handler);
                } catch (e) {
                    // Element may have been removed from DOM
                }
            });
            this._eventListeners = [];
        }

        /**
         * Destroy the entity card and clean up resources
         */
        destroy() {
            this._isDestroyed = true;
            this._cleanupEventListeners();

            // Clear container
            if (this.container && typeof this.container !== 'string') {
                this.container.innerHTML = '';
            }

            // Clear references
            this.data = null;
            this.loader = null;
            this.onLoad = null;
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
                    button.setAttribute('aria-label', `Remove ${button.dataset.entityName} from favorites`);
                    button.setAttribute('aria-pressed', 'true');
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
                alert('Please sign in to add favorites');
                return;
            }

            button.disabled = true;
            button.classList.add('loading');

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
                        button.setAttribute('aria-label', `Remove ${entity.name} from favorites`);
                        button.setAttribute('aria-pressed', 'true');
                    } else {
                        button.classList.remove('favorited');
                        button.setAttribute('aria-label', `Add ${entity.name} to favorites`);
                        button.setAttribute('aria-pressed', 'false');
                    }
                }
            } catch (error) {
                console.error('[EntityCard] Failed to toggle favorite:', error);
            } finally {
                button.disabled = false;
                button.classList.remove('loading');
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
         * Render markdown (basic) with XSS protection
         * First escapes HTML, then applies markdown transformations
         */
        renderMarkdown(text) {
            if (!text) return '';

            // First escape the raw text to prevent XSS
            let escaped = this.escapeHtml(text);

            // Then apply markdown transformations on the escaped text
            return escaped
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
         * Check if FavoritesService is available
         */
        isFavoritesServiceAvailable() {
            return !!(window.EyesOfAzrael?.favorites);
        }

        /**
         * Render favorite button - only if service is potentially available
         * Gracefully degrades if FavoritesService isn't loaded
         */
        renderFavoriteButton(mythologyLower) {
            return `
                <button class="btn-icon entity-favorite"
                        data-entity-id="${this.escapeAttr(this.entityId)}"
                        data-entity-type="${this.escapeAttr(this.entityType)}"
                        data-entity-name="${this.escapeAttr(this.data.name)}"
                        data-entity-mythology="${this.escapeAttr(mythologyLower)}"
                        data-entity-icon="${this.escapeAttr(this.data.icon || '')}"
                        aria-label="Add ${this.escapeHtml(this.data.name)} to favorites"
                        title="Add to Personal Pantheon"
                        type="button">
                    <span class="favorite-icon" aria-hidden="true">★</span>
                </button>
            `;
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
         * Escape attribute value for safe HTML attribute insertion
         * More thorough than escapeHtml for attribute contexts
         */
        escapeAttr(text) {
            if (text === null || text === undefined) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
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
