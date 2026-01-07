/**
 * Entity Card Component - Polished Reusable Display Component
 * Supports mini, compact, and full display modes
 * Integrates with theme system and entity loader
 *
 * Features:
 * - Image handling with 16:9 aspect ratio and fallbacks
 * - CSS line-clamp text truncation (title: 2 lines, desc: 3 lines)
 * - Hover states with subtle lift and image zoom
 * - Full keyboard accessibility with focus states
 * - Mythology and type badge pills
 * - Quick action buttons (favorite, quick view)
 *
 * Updated: 2026-01-07
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
            this.showQuickActions = options.showQuickActions !== false;

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
         * Render loading placeholder with skeleton animation
         */
        renderLoading() {
            if (!this.container) return;

            this.container.setAttribute('aria-busy', 'true');
            this.container.innerHTML = `
                <article class="entity-card entity-card-compact entity-card--loading glass-card"
                     role="article"
                     aria-label="Loading entity...">
                    <!-- Image skeleton -->
                    <div class="entity-card__image-wrapper">
                        <div class="entity-card__image-skeleton skeleton-shimmer"></div>
                    </div>

                    <div class="entity-card__content">
                        <!-- Icon and title skeleton -->
                        <div class="entity-card__header">
                            <div class="entity-card__icon skeleton-shimmer"></div>
                            <div class="entity-card__title-skeleton skeleton-shimmer"></div>
                        </div>

                        <!-- Description skeleton -->
                        <div class="entity-card__desc-skeleton skeleton-shimmer"></div>
                        <div class="entity-card__desc-skeleton entity-card__desc-skeleton--short skeleton-shimmer"></div>

                        <!-- Badge skeleton -->
                        <div class="entity-card__badges">
                            <span class="entity-card__badge-skeleton skeleton-shimmer"></span>
                            <span class="entity-card__badge-skeleton skeleton-shimmer"></span>
                        </div>
                    </div>
                </article>
            `;
        }

        /**
         * Render card image with fallback
         */
        renderCardImage() {
            const imageUrl = this.data.image || this.data.imageUrl || this.data.thumbnail;
            const fallbackLetter = this.data.name ? this.data.name.charAt(0).toUpperCase() : '?';

            if (imageUrl) {
                const sanitizedUrl = this.sanitizeUrl(imageUrl);
                if (sanitizedUrl) {
                    return `
                        <div class="entity-card__image-wrapper">
                            <img
                                src="${this.escapeAttr(sanitizedUrl)}"
                                alt="${this.escapeAttr(this.data.name || 'Entity image')}"
                                class="entity-card__image"
                                loading="lazy"
                                decoding="async"
                                onerror="this.parentElement.innerHTML='<div class=\\'entity-card__image-fallback\\'><span>${this.escapeAttr(fallbackLetter)}</span></div>'"
                            />
                            <div class="entity-card__image-overlay"></div>
                        </div>
                    `;
                }
            }

            // Return placeholder/fallback image
            return `
                <div class="entity-card__image-wrapper">
                    <div class="entity-card__image-fallback" data-mythology="${this.escapeAttr(this.data.primaryMythology || 'unknown')}">
                        <span class="entity-card__image-fallback-letter">${this.escapeHtml(fallbackLetter)}</span>
                        <svg class="entity-card__image-fallback-pattern" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <pattern id="sacred-pattern-${this.entityId}" patternUnits="userSpaceOnUse" width="20" height="20">
                                    <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.1"/>
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#sacred-pattern-${this.entityId})"/>
                        </svg>
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
                <span class="entity-card entity-card--mini"
                      data-entity-id="${this.escapeAttr(this.entityId)}"
                      data-entity-type="${this.escapeAttr(this.entityType)}">
                    <a href="${url}" class="entity-card__mini-link" title="${this.escapeAttr(this.data.shortDescription || this.data.name)}">
                        ${this.data.icon ? `<span class="entity-card__mini-icon">${this.renderIconWithFallback(this.data.icon, this.data.name)}</span>` : ''}
                        <span class="entity-card__mini-name">${this.escapeHtml(this.data.name)}</span>
                    </a>
                </span>
            `;
        }

        /**
         * Render compact mode (card) - main card format
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
                <article class="entity-card entity-card--compact glass-card ${sourceClass}"
                     data-entity-id="${this.escapeAttr(this.entityId)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}"
                     data-mythology="${this.escapeAttr(mythologyLower)}"
                     style="--entity-primary-color: ${this.escapeAttr(primaryColor)};"
                     tabindex="0"
                     role="article"
                     aria-label="${this.escapeAttr(this.data.name)} - ${sourceLabel}">

                    <!-- Card Image Section (16:9) -->
                    ${this.renderCardImage()}

                    <!-- Card Content -->
                    <div class="entity-card__content">
                        <!-- Header with Icon and Title -->
                        <div class="entity-card__header">
                            <div class="entity-card__icon" aria-hidden="true">${iconContent}</div>
                            <h2 class="entity-card__title">
                                <a href="${this.getEntityUrl()}" class="entity-card__title-link">
                                    ${this.escapeHtml(this.data.name)}
                                </a>
                            </h2>
                        </div>

                        ${this.renderAuthorBadge()}

                        <!-- Description (max 3 lines via CSS) -->
                        ${this.data.shortDescription ? `
                            <p class="entity-card__description">${this.escapeHtml(this.data.shortDescription)}</p>
                        ` : ''}

                        <!-- Metadata Pills -->
                        <div class="entity-card__badges">
                            ${this.renderMythologyPill(primaryMythology)}
                            ${this.renderTypePill()}
                        </div>

                        ${this.renderWhisper(primaryMythology)}

                        ${this.renderCompactMetadata()}
                    </div>

                    <!-- Quick Actions (show on hover) -->
                    ${this.showQuickActions ? this.renderQuickActions(mythologyLower) : ''}

                    <!-- Card Footer -->
                    <div class="entity-card__footer">
                        <a href="${this.getEntityUrl()}" class="entity-card__btn entity-card__btn--primary" aria-label="View full details for ${this.escapeHtml(this.data.name)}">
                            View Details
                        </a>
                        ${this.interactive ? `
                            <button class="entity-card__btn entity-card__btn--secondary entity-expand"
                                    data-id="${this.escapeAttr(this.entityId)}"
                                    data-type="${this.escapeAttr(this.entityType)}"
                                    aria-label="Expand ${this.escapeHtml(this.data.name)}">
                                Expand
                            </button>
                        ` : ''}
                    </div>
                </article>
            `;
        }

        /**
         * Render quick action buttons (favorite, quick view, compare)
         */
        renderQuickActions(mythologyLower) {
            // Check if entity is already in comparison
            const isInComparison = window.CompareView?.isInComparison?.(this.entityId, this.entityType + 's') || false;

            return `
                <div class="entity-card__quick-actions" aria-label="Quick actions">
                    <!-- Compare Button -->
                    <button class="entity-card__action-btn entity-card__action-btn--compare entity-compare ${isInComparison ? 'entity-card__action-btn--in-compare' : ''}"
                            data-entity-id="${this.escapeAttr(this.entityId)}"
                            data-entity-type="${this.escapeAttr(this.entityType)}"
                            data-entity-name="${this.escapeAttr(this.data.name)}"
                            data-entity-mythology="${this.escapeAttr(mythologyLower)}"
                            data-entity-icon="${this.escapeAttr(this.data.icon || '')}"
                            aria-label="${isInComparison ? 'Already in comparison' : `Add ${this.escapeHtml(this.data.name)} to comparison`}"
                            title="${isInComparison ? 'In comparison' : 'Add to comparison'}"
                            type="button"
                            ${isInComparison ? 'disabled' : ''}>
                        <svg class="entity-card__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="9" rx="1"/>
                            <rect x="14" y="3" width="7" height="9" rx="1"/>
                            <path d="M10 7h4"/>
                            <path d="M7 15v6M17 15v6"/>
                        </svg>
                    </button>

                    <!-- Favorite Button -->
                    <button class="entity-card__action-btn entity-card__action-btn--favorite entity-favorite"
                            data-entity-id="${this.escapeAttr(this.entityId)}"
                            data-entity-type="${this.escapeAttr(this.entityType)}"
                            data-entity-name="${this.escapeAttr(this.data.name)}"
                            data-entity-mythology="${this.escapeAttr(mythologyLower)}"
                            data-entity-icon="${this.escapeAttr(this.data.icon || '')}"
                            aria-label="Add ${this.escapeHtml(this.data.name)} to favorites"
                            aria-pressed="false"
                            title="Add to favorites"
                            type="button">
                        <svg class="entity-card__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>

                    <!-- Quick View Button -->
                    <button class="entity-card__action-btn entity-card__action-btn--quickview entity-quickview"
                            data-entity-id="${this.escapeAttr(this.entityId)}"
                            data-entity-type="${this.escapeAttr(this.entityType)}"
                            aria-label="Quick view ${this.escapeHtml(this.data.name)}"
                            title="Quick view"
                            type="button">
                        <svg class="entity-card__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </div>
            `;
        }

        /**
         * Render mythology pill badge
         */
        renderMythologyPill(mythology) {
            if (!mythology || mythology === 'unknown') return '';

            return `
                <span class="entity-card__pill entity-card__pill--mythology" data-mythology="${this.escapeAttr(mythology.toLowerCase())}">
                    ${this.escapeHtml(this.capitalize(mythology))}
                </span>
            `;
        }

        /**
         * Render entity type pill badge
         */
        renderTypePill() {
            const typeIcons = {
                deity: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 1l2 4 4.5.7-3.3 3.2.8 4.5L8 11.4l-4 2 .8-4.5L1.5 5.7 6 5z"/></svg>',
                item: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M14.5 3L8 0 1.5 3v6L8 16l6.5-7V3z"/></svg>',
                place: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 0C5.2 0 3 2.2 3 5c0 3.5 5 11 5 11s5-7.5 5-11c0-2.8-2.2-5-5-5zm0 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>',
                creature: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M13 2c-1.7 0-3.4.7-4.6 1.9L7 5.3l-1.4-1.4C4.4 2.7 2.7 2 1 2v2c1.1 0 2.2.4 3 1.2L5.4 6.6 3 9H0v2h4l3-3 1.4 1.4c.8.8 1.9 1.2 3 1.2V8.4L13 10v4h2V2h-2z"/></svg>',
                hero: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 0L6 6H0l5 4-2 6 5-4 5 4-2-6 5-4h-6z"/></svg>',
                concept: '<svg viewBox="0 0 16 16" class="pill-icon"><circle fill="currentColor" cx="8" cy="8" r="7"/></svg>',
                magic: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 0l1.5 5H15l-4.5 3.5L12 14l-4-3-4 3 1.5-5.5L1 5h5.5z"/></svg>',
                archetype: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/></svg>',
                ritual: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 2c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1s1-.4 1-1V3c0-.6-.4-1-1-1zM4 12h8v2H4z"/></svg>',
                text: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M2 0v16h12V4l-4-4H2zm8 1.4L13.6 5H10V1.4zM3 15V1h6v5h4v9H3z"/></svg>',
                herb: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 0c-2 4-6 6-6 10 0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-4-6-6-10z"/></svg>',
                symbol: '<svg viewBox="0 0 16 16" class="pill-icon"><path fill="currentColor" d="M8 0L0 8l8 8 8-8-8-8zm0 2.8L13.2 8 8 13.2 2.8 8 8 2.8z"/></svg>',
                cosmology: '<svg viewBox="0 0 16 16" class="pill-icon"><circle fill="currentColor" cx="8" cy="8" r="6"/><ellipse fill="none" stroke="currentColor" cx="8" cy="8" rx="6" ry="2.5"/></svg>',
                mythology: '<svg viewBox="0 0 16 16" class="pill-icon"><circle fill="currentColor" cx="8" cy="8" r="7"/></svg>'
            };

            const icon = typeIcons[this.entityType] || typeIcons.concept;
            const label = this.capitalize(this.entityType);

            return `
                <span class="entity-card__pill entity-card__pill--type" data-type="${this.escapeAttr(this.entityType)}">
                    ${icon}
                    <span class="pill-text">${this.escapeHtml(label)}</span>
                </span>
            `;
        }

        /**
         * Render icon with fallback
         */
        renderIconWithFallback(icon, name) {
            const fallbackLetter = name ? this.escapeHtml(name.charAt(0).toUpperCase()) : '';
            const fallbackHtml = fallbackLetter
                ? `<span class="entity-card__icon-fallback">${fallbackLetter}</span>`
                : '<span class="entity-card__icon-fallback" aria-hidden="true">&#10024;</span>';

            if (!icon) {
                return fallbackHtml;
            }

            // Check if it's inline SVG (starts with <svg)
            if (typeof icon === 'string') {
                const iconTrimmed = icon.trim();
                if (iconTrimmed.toLowerCase().startsWith('<svg')) {
                    // Render inline SVG directly (SVG is already safe markup)
                    return `<span class="entity-card__icon-svg" aria-hidden="true">${icon}</span>`;
                }
            }

            if (typeof icon === 'string' && (icon.includes('.svg') || icon.includes('.png') || icon.includes('.jpg') || icon.includes('.webp') || icon.startsWith('http'))) {
                const sanitizedUrl = this.sanitizeUrl(icon);
                if (!sanitizedUrl) {
                    return fallbackHtml;
                }
                return `<img src="${this.escapeAttr(sanitizedUrl)}"
                             alt=""
                             class="entity-card__icon-img"
                             loading="lazy"
                             decoding="async"
                             data-fallback-letter="${this.escapeAttr(fallbackLetter || '&#10024;')}"
                             width="40"
                             height="40"
                             data-fallback-html="${this.escapeAttr(fallbackHtml)}">`;
            }

            // Escape any text/emoji icon to prevent XSS
            return `<span class="entity-card__icon-text" aria-hidden="true">${this.escapeHtml(icon)}</span>`;
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
                <article class="entity-card entity-card--full glass-card"
                     data-entity-id="${this.escapeAttr(this.entityId)}"
                     data-entity-type="${this.escapeAttr(this.entityType)}">

                    <!-- Hero Section -->
                    <div class="entity-card__hero" style="background: linear-gradient(135deg, ${this.escapeAttr(primary)}, ${this.escapeAttr(secondary)});">
                        ${this.data.icon ? `<div class="entity-card__hero-icon">${this.renderIconWithFallback(this.data.icon, this.data.name)}</div>` : ''}
                        <h1 class="entity-card__hero-title">${this.escapeHtml(this.data.name)}</h1>
                        ${this.data.linguistic?.originalName ? `
                            <div class="entity-card__hero-original">${this.escapeHtml(this.data.linguistic.originalName)}</div>
                        ` : ''}
                        ${this.data.shortDescription ? `
                            <p class="entity-card__hero-subtitle">${this.escapeHtml(this.data.shortDescription)}</p>
                        ` : ''}
                        ${this.renderMythologyBadges(this.data.mythologies || [])}
                    </div>

                    <!-- Main Content -->
                    <div class="entity-card__body">
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
                    <div class="entity-card__footer entity-card__footer--full">
                        <a href="${this.getEntityUrl()}" class="entity-card__btn entity-card__btn--primary">Full Page</a>
                        <button class="entity-card__btn entity-card__btn--secondary corpus-search" data-term="${this.escapeAttr(this.data.name)}">
                            Search Texts
                        </button>
                        <button class="entity-card__btn entity-card__btn--secondary share-entity" data-id="${this.escapeAttr(this.entityId)}">
                            Share
                        </button>
                    </div>
                </article>
            `;
        }

        /**
         * Render type badge (legacy support)
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
                    <div class="entity-card__whisper" aria-hidden="true">
                        <span class="entity-card__whisper-text">${this.escapeHtml(whisper.text)}</span>
                        <span class="entity-card__whisper-source">${this.escapeHtml(whisper.source)}</span>
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
                <div class="entity-card__mythology-badges">
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
                <div class="entity-card__metadata">
                    ${metadata.map(m => `<div class="entity-card__metadata-item">${m}</div>`).join('')}
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
                <section class="entity-card__section">
                    <h2 class="entity-card__section-title">Description</h2>
                    <div class="entity-card__section-content">${this.renderMarkdown(desc)}</div>
                </section>
            `;
        }

        /**
         * Render linguistic data
         */
        renderLinguisticData() {
            const ling = this.data.linguistic;
            if (!ling) return '';

            return `
                <section class="entity-card__section entity-card__section--linguistic">
                    <h2 class="entity-card__section-title">Linguistic Information</h2>
                    <div class="entity-card__property-grid">
                        ${ling.originalName ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Original Name</div>
                                <div class="entity-card__property-value">${this.escapeHtml(ling.originalName)}</div>
                            </div>
                        ` : ''}
                        ${ling.transliteration ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Transliteration</div>
                                <div class="entity-card__property-value">${this.escapeHtml(ling.transliteration)}</div>
                            </div>
                        ` : ''}
                        ${ling.pronunciation ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Pronunciation</div>
                                <div class="entity-card__property-value"><code>${this.escapeHtml(ling.pronunciation)}</code></div>
                            </div>
                        ` : ''}
                        ${ling.etymology?.meaning ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Etymology</div>
                                <div class="entity-card__property-value">${this.escapeHtml(ling.etymology.meaning)}</div>
                            </div>
                        ` : ''}
                    </div>
                </section>
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
                <section class="entity-card__section">
                    <h2 class="entity-card__section-title">Properties</h2>
                    ${this.data.properties ? `
                        <div class="entity-card__property-grid">
                            ${this.data.properties.map(prop => `
                                <div class="entity-card__property">
                                    <div class="entity-card__property-label">${this.escapeHtml(prop.name)}</div>
                                    <div class="entity-card__property-value">${this.escapeHtml(prop.value)}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${this.data.uses && this.data.uses.length > 0 ? `
                        <div class="entity-card__tags-section">
                            <h3 class="entity-card__tags-title">Uses</h3>
                            <div class="entity-card__tags">
                                ${this.data.uses.map(use => `<span class="entity-card__tag">${this.escapeHtml(use)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </section>
            `;
        }

        /**
         * Render place properties
         */
        renderPlaceProperties() {
            const geo = this.data.geography || this.data.geographical;
            if (!geo) return '';

            return `
                <section class="entity-card__section">
                    <h2 class="entity-card__section-title">Location Details</h2>
                    <div class="entity-card__property-grid">
                        ${geo.realm ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Realm</div>
                                <div class="entity-card__property-value">${this.escapeHtml(geo.realm)}</div>
                            </div>
                        ` : ''}
                        ${geo.region ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Region</div>
                                <div class="entity-card__property-value">${this.escapeHtml(geo.region)}</div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render deity properties
         */
        renderDeityProperties() {
            return `
                <section class="entity-card__section">
                    <h2 class="entity-card__section-title">Divine Attributes</h2>
                    ${this.data.domains ? `
                        <div class="entity-card__tags-section">
                            <h3 class="entity-card__tags-title">Domains</h3>
                            <div class="entity-card__tags">
                                ${this.data.domains.map(d => `<span class="entity-card__tag">${this.escapeHtml(d)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${this.data.symbols ? `
                        <div class="entity-card__tags-section">
                            <h3 class="entity-card__tags-title">Symbols</h3>
                            <div class="entity-card__tags">
                                ${this.data.symbols.map(s => `<span class="entity-card__tag">${this.escapeHtml(s)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </section>
            `;
        }

        /**
         * Render concept properties
         */
        renderConceptProperties() {
            if (!this.data) return '';

            const props = [];

            if (this.data.principles && this.data.principles.length > 0) {
                props.push(`
                    <div class="entity-card__tags-section">
                        <h3 class="entity-card__tags-title">Principles</h3>
                        <div class="entity-card__tags">
                            ${this.data.principles.map(p => `<span class="entity-card__tag">${this.escapeHtml(p)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (this.data.traditions && this.data.traditions.length > 0) {
                props.push(`
                    <div class="entity-card__tags-section">
                        <h3 class="entity-card__tags-title">Traditions</h3>
                        <div class="entity-card__tags">
                            ${this.data.traditions.map(t => `<span class="entity-card__tag">${this.escapeHtml(t)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (props.length === 0) return '';

            return `
                <section class="entity-card__section">
                    <h2 class="entity-card__section-title">Conceptual Attributes</h2>
                    ${props.join('')}
                </section>
            `;
        }

        /**
         * Render magic properties
         */
        renderMagicProperties() {
            if (!this.data) return '';

            const props = [];

            if (this.data.components && this.data.components.length > 0) {
                props.push(`
                    <div class="entity-card__tags-section">
                        <h3 class="entity-card__tags-title">Components</h3>
                        <div class="entity-card__tags">
                            ${this.data.components.map(c => `<span class="entity-card__tag">${this.escapeHtml(c)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (this.data.effects && this.data.effects.length > 0) {
                props.push(`
                    <div class="entity-card__tags-section">
                        <h3 class="entity-card__tags-title">Effects</h3>
                        <div class="entity-card__tags">
                            ${this.data.effects.map(e => `<span class="entity-card__tag">${this.escapeHtml(e)}</span>`).join('')}
                        </div>
                    </div>
                `);
            }

            if (this.data.school) {
                props.push(`
                    <div class="entity-card__tags-section">
                        <h3 class="entity-card__tags-title">School/Tradition</h3>
                        <p class="entity-card__school">${this.escapeHtml(this.data.school)}</p>
                    </div>
                `);
            }

            if (props.length === 0) return '';

            return `
                <section class="entity-card__section">
                    <h2 class="entity-card__section-title">Magical Properties</h2>
                    ${props.join('')}
                </section>
            `;
        }

        /**
         * Render metaphysical properties
         */
        renderMetaphysicalProperties() {
            const meta = this.data.metaphysicalProperties;
            if (!meta || Object.keys(meta).length === 0) return '';

            return `
                <section class="entity-card__section entity-card__section--metaphysical">
                    <h2 class="entity-card__section-title">Metaphysical Properties</h2>
                    <div class="entity-card__property-grid">
                        ${meta.primaryElement ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Element</div>
                                <div class="entity-card__property-value">${this.escapeHtml(this.capitalize(meta.primaryElement))}</div>
                            </div>
                        ` : ''}
                        ${meta.planet ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Planet</div>
                                <div class="entity-card__property-value">${this.escapeHtml(meta.planet)}</div>
                            </div>
                        ` : ''}
                        ${meta.sefirot && meta.sefirot.length > 0 ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Sefirot</div>
                                <div class="entity-card__property-value">${meta.sefirot.map(s => this.escapeHtml(this.capitalize(s))).join(', ')}</div>
                            </div>
                        ` : ''}
                        ${meta.chakras && meta.chakras.length > 0 ? `
                            <div class="entity-card__property">
                                <div class="entity-card__property-label">Chakras</div>
                                <div class="entity-card__property-value">${meta.chakras.map(c => this.escapeHtml(this.capitalize(c))).join(', ')}</div>
                            </div>
                        ` : ''}
                    </div>
                </section>
            `;
        }

        /**
         * Render geographical data
         */
        renderGeographicalData() {
            const geo = this.data.geographical;
            if (!geo) return '';

            return `
                <section class="entity-card__section entity-card__section--geographical">
                    <h2 class="entity-card__section-title">Geography</h2>
                    ${geo.region ? `<p><strong>Region:</strong> ${this.escapeHtml(geo.region)}</p>` : ''}
                    ${geo.modernCountries && geo.modernCountries.length > 0 ? `
                        <p><strong>Modern Countries:</strong> ${geo.modernCountries.map(c => this.escapeHtml(c)).join(', ')}</p>
                    ` : ''}
                </section>
            `;
        }

        /**
         * Render temporal data
         */
        renderTemporalData() {
            const temp = this.data.temporal;
            if (!temp) return '';

            return `
                <section class="entity-card__section entity-card__section--temporal">
                    <h2 class="entity-card__section-title">Historical Context</h2>
                    ${temp.culturalPeriod ? `<p><strong>Period:</strong> ${this.escapeHtml(temp.culturalPeriod)}</p>` : ''}
                    ${temp.historicalDate?.display ? `<p><strong>Date:</strong> ${this.escapeHtml(temp.historicalDate.display)}</p>` : ''}
                </section>
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
                <section class="entity-card__section entity-card__section--related">
                    <h2 class="entity-card__section-title">Related Entities</h2>
                    ${Object.entries(related).map(([type, entities]) => {
                        if (!entities || entities.length === 0) return '';
                        return `
                            <div class="entity-card__related-category">
                                <h3 class="entity-card__related-title">${this.capitalize(type)}</h3>
                                <div class="entity-card__related-grid">
                                    ${entities.map(e => this.renderMiniEntityCard(e)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </section>
            `;
        }

        /**
         * Render mini entity card for related entities
         */
        renderMiniEntityCard(entity) {
            const safeUrl = this.sanitizeUrl(entity.url) || '#';
            return `
                <a href="${this.escapeAttr(safeUrl)}" class="entity-card__mini-entity">
                    ${entity.icon ? `<span class="entity-card__mini-entity-icon">${this.renderIconWithFallback(entity.icon, entity.name)}</span>` : ''}
                    <span class="entity-card__mini-entity-name">${this.escapeHtml(entity.name)}</span>
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
                <section class="entity-card__section entity-card__section--sources">
                    <h2 class="entity-card__section-title">Ancient Sources</h2>
                    <ul class="entity-card__sources-list">
                        ${sources.map(source => {
                            const safeCorpusUrl = source.corpusUrl ? this.sanitizeUrl(source.corpusUrl) : null;
                            return `
                            <li class="entity-card__source">
                                ${source.author ? `<strong>${this.escapeHtml(source.author)}</strong>, ` : ''}
                                <em>${this.escapeHtml(source.text || source.title)}</em>
                                ${source.passage ? `, ${this.escapeHtml(source.passage)}` : ''}
                                ${safeCorpusUrl ? `<a href="${this.escapeAttr(safeCorpusUrl)}" class="entity-card__source-link">&#128220; View</a>` : ''}
                            </li>
                        `}).join('')}
                    </ul>
                </section>
            `;
        }

        /**
         * Render archetypes
         */
        renderArchetypes() {
            const archetypes = this.data.archetypes;
            if (!archetypes || archetypes.length === 0) return '';

            return `
                <section class="entity-card__section entity-card__section--archetypes">
                    <h2 class="entity-card__section-title">Archetypes</h2>
                    <div class="entity-card__archetypes-grid">
                        ${archetypes.map(arch => `
                            <div class="entity-card__archetype">
                                <h3 class="entity-card__archetype-name">${this.escapeHtml(arch.name || arch.category)}</h3>
                                ${arch.score !== undefined ? `
                                    <div class="entity-card__archetype-score">
                                        <div class="entity-card__score-bar">
                                            <div class="entity-card__score-fill" style="width: ${arch.score}%"></div>
                                        </div>
                                        <span class="entity-card__score-value">${arch.score}%</span>
                                    </div>
                                ` : ''}
                                ${arch.context ? `<p class="entity-card__archetype-context">${this.escapeHtml(arch.context)}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </section>
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
                    <article class="entity-card entity-card--error" role="alert">
                        <div class="entity-card__error-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <p class="entity-card__error-title">Failed to load entity</p>
                        <p class="entity-card__error-id">${this.escapeHtml(this.entityId)}</p>
                        <p class="entity-card__error-detail">${this.escapeHtml(error.message)}</p>
                    </article>
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
         * Get source class for user-generated content distinction
         */
        getSourceClass() {
            if (this.data?.isUserGenerated) {
                return 'entity-card--user-generated';
            }
            if (this.data?.isVerified) {
                return 'entity-card--verified';
            }
            return 'entity-card--canonical';
        }

        /**
         * Get source label for accessibility
         */
        getSourceLabel() {
            if (this.data?.isUserGenerated) {
                return 'User-generated content';
            }
            if (this.data?.isVerified) {
                return 'Verified content';
            }
            return this.capitalize(this.entityType);
        }

        /**
         * Render author badge if user-generated
         */
        renderAuthorBadge() {
            if (!this.data?.author) return '';

            return `
                <div class="entity-card__author">
                    <span class="entity-card__author-label">by</span>
                    <span class="entity-card__author-name">${this.escapeHtml(this.data.author)}</span>
                </div>
            `;
        }

        /**
         * Render perspectives indicator
         */
        renderPerspectivesIndicator() {
            if (!this.data?.perspectiveCount || this.data.perspectiveCount <= 1) return '';

            return `
                <span class="entity-card__perspectives" title="${this.data.perspectiveCount} perspectives available">
                    <svg viewBox="0 0 16 16" class="perspectives-icon">
                        <circle cx="4" cy="8" r="2" fill="currentColor"/>
                        <circle cx="8" cy="8" r="2" fill="currentColor"/>
                        <circle cx="12" cy="8" r="2" fill="currentColor"/>
                    </svg>
                    ${this.data.perspectiveCount}
                </span>
            `;
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

            // Image error handling and load animation
            const iconImages = this.container.querySelectorAll('.entity-card__icon-img');
            iconImages.forEach(img => {
                const errorHandler = () => {
                    const parent = img.parentElement;
                    if (parent) {
                        const fallbackHtml = img.dataset.fallbackHtml || `<span class="entity-card__icon-fallback" aria-hidden="true">&#10024;</span>`;
                        const span = document.createElement('span');
                        span.className = 'entity-card__icon-fallback';
                        span.setAttribute('aria-hidden', 'true');
                        span.innerHTML = fallbackHtml.replace(/^<span class="entity-card__icon-fallback"[^>]*>|<\/span>$/g, '');
                        parent.replaceChild(span, img);
                    }
                };
                const loadHandler = () => {
                    img.style.opacity = '1';
                    img.classList.add('entity-card__icon-img--loaded');
                };
                img.style.opacity = '0.8';
                img.style.transition = 'opacity 0.3s ease';
                this._addTrackedListener(img, 'error', errorHandler);
                this._addTrackedListener(img, 'load', loadHandler);
            });

            // Card image error handling
            const cardImages = this.container.querySelectorAll('.entity-card__image');
            cardImages.forEach(img => {
                const loadHandler = () => {
                    img.classList.add('entity-card__image--loaded');
                };
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
                        const detailsLink = card.querySelector('.entity-card__btn--primary');
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

            // Favorite button
            const favoriteBtn = this.container.querySelector('.entity-favorite');
            if (favoriteBtn) {
                this.checkFavoriteState(favoriteBtn);

                const favoriteHandler = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.toggleFavorite(favoriteBtn);
                };
                this._addTrackedListener(favoriteBtn, 'click', favoriteHandler);
            }

            // Quick view button
            const quickViewBtn = this.container.querySelector('.entity-quickview');
            if (quickViewBtn) {
                const quickViewHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showQuickView();
                };
                this._addTrackedListener(quickViewBtn, 'click', quickViewHandler);
            }

            // Compare button
            const compareBtn = this.container.querySelector('.entity-compare');
            if (compareBtn) {
                const compareHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.addToComparison(compareBtn);
                };
                this._addTrackedListener(compareBtn, 'click', compareHandler);
            }
        }

        /**
         * Add entity to comparison
         */
        addToComparison(button) {
            if (!window.CompareView?.addToComparison) {
                console.warn('[EntityCard] CompareView not available');
                alert('Comparison feature not available');
                return;
            }

            const entity = {
                id: button.dataset.entityId,
                name: button.dataset.entityName,
                type: button.dataset.entityType,
                mythology: button.dataset.entityMythology,
                icon: button.dataset.entityIcon || this.data?.icon,
                shortDescription: this.data?.shortDescription,
                ...this.data
            };

            // Use plural collection name (deity -> deities)
            const collection = button.dataset.entityType + 's';

            const success = window.CompareView.addToComparison(entity, collection);

            if (success) {
                // Update button state
                button.classList.add('entity-card__action-btn--in-compare');
                button.disabled = true;
                button.setAttribute('title', 'In comparison');
                button.setAttribute('aria-label', 'Already in comparison');
            }
        }

        /**
         * Show quick view modal/panel
         */
        showQuickView() {
            // Dispatch custom event for quick view
            const event = new CustomEvent('entityQuickView', {
                detail: {
                    entityId: this.entityId,
                    entityType: this.entityType,
                    data: this.data
                },
                bubbles: true
            });
            this.container.dispatchEvent(event);
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
                    button.classList.add('entity-card__action-btn--favorited');
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
            button.classList.add('entity-card__action-btn--loading');

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
                        button.classList.add('entity-card__action-btn--favorited');
                        button.setAttribute('aria-label', `Remove ${entity.name} from favorites`);
                        button.setAttribute('aria-pressed', 'true');
                    } else {
                        button.classList.remove('entity-card__action-btn--favorited');
                        button.setAttribute('aria-label', `Add ${entity.name} to favorites`);
                        button.setAttribute('aria-pressed', 'false');
                    }
                }
            } catch (error) {
                console.error('[EntityCard] Failed to toggle favorite:', error);
            } finally {
                button.disabled = false;
                button.classList.remove('entity-card__action-btn--loading');
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
         * @deprecated Use renderQuickActions instead
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
                    <span class="favorite-icon" aria-hidden="true">&#9733;</span>
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
                mythology: element.dataset.mythology || null,
                showQuickActions: element.dataset.showQuickActions !== 'false'
            });

            card.render().catch(console.error);
        });
    });

    // Export to window
    window.EntityCard = EntityCard;

})();
