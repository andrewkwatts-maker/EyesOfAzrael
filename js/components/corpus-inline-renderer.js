/**
 * Corpus Inline Renderer Component
 *
 * Renders corpus search results as inline elements within text.
 * Supports inline links with hover previews and blockquote citations.
 *
 * Features:
 * - Inline links with tooltip-style previews
 * - Blockquote rendering with citations
 * - Configurable preview length and source display
 * - Click-to-expand functionality
 * - Accessible keyboard navigation
 * - Performance optimized with lazy loading
 *
 * Usage:
 * const renderer = new CorpusInlineRenderer({ maxPreviewLength: 150 });
 * const linkHtml = renderer.renderLink(result, { query: 'Zeus', mode: 'source' });
 * const quoteHtml = renderer.renderQuote(result);
 */

(function() {
    'use strict';

    class CorpusInlineRenderer {
        constructor(options = {}) {
            this.options = {
                maxPreviewLength: 100,
                showSource: true,
                clickToExpand: true,
                highlightMatches: true,
                tooltipDelay: 300,
                animatePreview: true,
                previewPosition: 'bottom', // 'top', 'bottom', 'auto'
                ...options
            };

            // Track active tooltips for cleanup
            this.activeTooltips = new Set();

            // Unique ID counter for accessibility
            this.idCounter = 0;

            // Bind methods for event handlers
            this.handleMouseEnter = this.handleMouseEnter.bind(this);
            this.handleMouseLeave = this.handleMouseLeave.bind(this);
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleClick = this.handleClick.bind(this);
        }

        /**
         * Generate unique ID for accessibility
         */
        generateId() {
            return `corpus-inline-${++this.idCounter}-${Date.now()}`;
        }

        /**
         * Render as inline link that shows preview on hover
         * @param {Object} result - Search result object
         * @param {Object} queryInfo - Query information { query, mode, mythology }
         * @returns {string} HTML string for inline link
         */
        renderLink(result, queryInfo = {}) {
            const id = this.generateId();
            const name = this.escapeHtml(result.name || result.title || 'Unknown');
            const source = result.source || result.corpus || result.mythology || '';
            const preview = this.truncateText(
                result.description || result.text || result.content || '',
                this.options.maxPreviewLength
            );
            const entityType = result.entityType || result.type || 'entity';
            const url = this.getEntityUrl(result);
            const searchScore = result._searchScore || 0;

            // Matched fields for highlighting
            const matchedFields = result._matchedFields || [];
            const matchedTerms = result._matchedTerms?.terms || [];

            // Build data attributes
            const dataAttrs = [
                `data-entity-id="${this.escapeHtml(result.id || result.entityId || '')}"`,
                `data-entity-type="${this.escapeHtml(entityType)}"`,
                `data-query="${this.escapeHtml(queryInfo.query || '')}"`,
                `data-mode="${this.escapeHtml(queryInfo.mode || 'generic')}"`,
                `data-score="${searchScore}"`,
                `data-expandable="${this.options.clickToExpand}"`
            ].join(' ');

            // Build source badge if enabled
            const sourceBadge = this.options.showSource && source
                ? `<span class="corpus-inline-source">${this.escapeHtml(source)}</span>`
                : '';

            // Build matched terms indicator
            const matchIndicator = matchedTerms.length > 0
                ? `<span class="corpus-inline-match-indicator" title="Matched: ${matchedTerms.join(', ')}">${matchedTerms.length}</span>`
                : '';

            // Build preview content
            const previewContent = this.buildPreviewContent(result, queryInfo);

            return `
                <span class="corpus-inline-link"
                      id="${id}"
                      ${dataAttrs}
                      role="button"
                      tabindex="0"
                      aria-describedby="${id}-preview">
                    <a href="${url}" class="corpus-inline-name" tabindex="-1">
                        ${this.renderEntityIcon(entityType)}
                        <span class="corpus-inline-text">${name}</span>
                        ${matchIndicator}
                    </a>
                    ${sourceBadge}
                    <span class="corpus-inline-preview"
                          id="${id}-preview"
                          role="tooltip"
                          aria-hidden="true">
                        ${previewContent}
                    </span>
                </span>
            `;
        }

        /**
         * Build preview content for tooltip
         * @param {Object} result - Search result
         * @param {Object} queryInfo - Query information
         * @returns {string} HTML for preview content
         */
        buildPreviewContent(result, queryInfo = {}) {
            const preview = this.truncateText(
                result.description || result.text || result.content || result.shortDescription || '',
                this.options.maxPreviewLength
            );
            const source = result.source || result.corpus || '';
            const mythology = result.mythology || '';
            const entityType = result.entityType || result.type || '';

            // Highlight search terms if enabled
            const highlightedPreview = this.options.highlightMatches && queryInfo.query
                ? this.highlightSearchTerm(preview, queryInfo.query)
                : this.escapeHtml(preview);

            // Build metadata section
            const metadata = [];
            if (mythology) metadata.push(`<span class="preview-mythology">${this.escapeHtml(mythology)}</span>`);
            if (entityType) metadata.push(`<span class="preview-type">${this.capitalize(entityType)}</span>`);
            if (source) metadata.push(`<span class="preview-source">${this.escapeHtml(source)}</span>`);

            const metadataHtml = metadata.length > 0
                ? `<div class="preview-metadata">${metadata.join(' ')}</div>`
                : '';

            // Build matched fields section
            const matchedFields = result._matchedFields || [];
            const matchedHtml = matchedFields.length > 0
                ? `<div class="preview-matched">Matched in: ${matchedFields.join(', ')}</div>`
                : '';

            // Build action hint
            const actionHint = this.options.clickToExpand
                ? '<div class="preview-action-hint">Click to expand</div>'
                : '';

            return `
                <div class="preview-header">
                    ${this.renderEntityIcon(entityType)}
                    <span class="preview-name">${this.escapeHtml(result.name || result.title || '')}</span>
                </div>
                ${metadataHtml}
                <div class="preview-text">${highlightedPreview}</div>
                ${matchedHtml}
                ${actionHint}
            `;
        }

        /**
         * Render as inline quote with citation
         * @param {Object} result - Search result object
         * @param {Object} options - Quote rendering options
         * @returns {string} HTML string for blockquote
         */
        renderQuote(result, options = {}) {
            const id = this.generateId();
            const quoteOptions = {
                showFullText: false,
                maxLength: 300,
                showLink: true,
                style: 'default', // 'default', 'minimal', 'decorated'
                ...options
            };

            const text = result.text || result.content || result.description || '';
            const displayText = quoteOptions.showFullText
                ? text
                : this.truncateText(text, quoteOptions.maxLength);

            const source = result.source || result.corpus || '';
            const author = result.author || '';
            const work = result.work || result.title || '';
            const passage = result.passage || result.citation || '';
            const url = this.getEntityUrl(result);
            const entityType = result.entityType || result.type || 'text';

            // Build citation parts
            const citationParts = [];
            if (author) citationParts.push(this.escapeHtml(author));
            if (work) citationParts.push(`<em>${this.escapeHtml(work)}</em>`);
            if (passage) citationParts.push(this.escapeHtml(passage));
            if (source && !work) citationParts.push(this.escapeHtml(source));

            const citationHtml = citationParts.length > 0
                ? citationParts.join(', ')
                : 'Unknown Source';

            // Build data attributes
            const dataAttrs = [
                `data-entity-id="${this.escapeHtml(result.id || result.entityId || '')}"`,
                `data-entity-type="${this.escapeHtml(entityType)}"`,
                `data-source="${this.escapeHtml(source)}"`
            ].join(' ');

            // Add view link if enabled
            const viewLink = quoteOptions.showLink && url
                ? `<a href="${url}" class="corpus-quote-link" aria-label="View full source">View Source</a>`
                : '';

            return `
                <blockquote class="corpus-quote corpus-quote-${quoteOptions.style}"
                            id="${id}"
                            ${dataAttrs}>
                    <div class="corpus-quote-content">
                        <span class="corpus-quote-mark corpus-quote-mark-open">"</span>
                        <span class="corpus-quote-text">${this.escapeHtml(displayText)}</span>
                        <span class="corpus-quote-mark corpus-quote-mark-close">"</span>
                    </div>
                    <footer class="corpus-quote-footer">
                        <cite class="corpus-quote-cite">
                            ${this.renderEntityIcon(entityType)}
                            ${citationHtml}
                        </cite>
                        ${viewLink}
                    </footer>
                </blockquote>
            `;
        }

        /**
         * Render as compact inline reference
         * @param {Object} result - Search result
         * @returns {string} HTML for compact reference
         */
        renderCompactRef(result) {
            const id = this.generateId();
            const name = this.escapeHtml(result.name || result.title || 'Ref');
            const entityType = result.entityType || result.type || 'entity';
            const url = this.getEntityUrl(result);

            return `
                <span class="corpus-compact-ref" id="${id}">
                    <a href="${url}" class="corpus-compact-link">
                        ${this.renderEntityIcon(entityType)}${name}
                    </a>
                </span>
            `;
        }

        /**
         * Render multiple results as inline list
         * @param {Array} results - Array of search results
         * @param {Object} queryInfo - Query information
         * @param {Object} options - Rendering options
         * @returns {string} HTML for inline list
         */
        renderInlineList(results, queryInfo = {}, options = {}) {
            const listOptions = {
                maxItems: 5,
                separator: ', ',
                showMoreText: 'and {count} more',
                linkToAll: true,
                ...options
            };

            if (!results || results.length === 0) {
                return '<span class="corpus-inline-empty">No results</span>';
            }

            const displayResults = results.slice(0, listOptions.maxItems);
            const remainingCount = results.length - listOptions.maxItems;

            const items = displayResults.map(result =>
                this.renderCompactRef(result)
            ).join(listOptions.separator);

            const moreLink = remainingCount > 0
                ? `<span class="corpus-inline-more">${listOptions.showMoreText.replace('{count}', remainingCount)}</span>`
                : '';

            return `
                <span class="corpus-inline-list">
                    ${items}${moreLink}
                </span>
            `;
        }

        /**
         * Render entity type icon
         * @param {string} entityType - Type of entity
         * @returns {string} HTML for icon
         */
        renderEntityIcon(entityType) {
            const icons = {
                deity: '<span class="corpus-icon corpus-icon-deity" aria-hidden="true">&#x1F451;</span>',
                hero: '<span class="corpus-icon corpus-icon-hero" aria-hidden="true">&#x1F9B8;</span>',
                creature: '<span class="corpus-icon corpus-icon-creature" aria-hidden="true">&#x1F409;</span>',
                item: '<span class="corpus-icon corpus-icon-item" aria-hidden="true">&#x2694;</span>',
                place: '<span class="corpus-icon corpus-icon-place" aria-hidden="true">&#x1F3DB;</span>',
                text: '<span class="corpus-icon corpus-icon-text" aria-hidden="true">&#x1F4DC;</span>',
                concept: '<span class="corpus-icon corpus-icon-concept" aria-hidden="true">&#x1F4AD;</span>',
                symbol: '<span class="corpus-icon corpus-icon-symbol" aria-hidden="true">&#x269B;</span>',
                ritual: '<span class="corpus-icon corpus-icon-ritual" aria-hidden="true">&#x2728;</span>',
                herb: '<span class="corpus-icon corpus-icon-herb" aria-hidden="true">&#x1F33F;</span>',
                magic: '<span class="corpus-icon corpus-icon-magic" aria-hidden="true">&#x2728;</span>',
                entity: '<span class="corpus-icon corpus-icon-default" aria-hidden="true">&#x1F4CC;</span>'
            };

            return icons[entityType] || icons.entity;
        }

        /**
         * Get entity URL
         * @param {Object} result - Search result
         * @returns {string} URL to entity page
         */
        getEntityUrl(result) {
            if (result.url) return result.url;

            const mythology = result.mythology || result.primaryMythology || 'shared';
            const entityType = result.entityType || result.type || 'entities';
            const id = result.id || result.entityId || result.name?.toLowerCase().replace(/\s+/g, '-') || '';

            return `/mythos/${mythology}/${entityType}s/${id}.html`;
        }

        /**
         * Truncate text with ellipsis
         * @param {string} text - Text to truncate
         * @param {number} maxLength - Maximum length
         * @returns {string} Truncated text
         */
        truncateText(text, maxLength) {
            if (!text || text.length <= maxLength) return text || '';

            // Find last space before maxLength to avoid cutting words
            const truncated = text.substring(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');

            return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...';
        }

        /**
         * Highlight search term in text
         * @param {string} text - Text to highlight
         * @param {string} searchTerm - Term to highlight
         * @returns {string} HTML with highlights
         */
        highlightSearchTerm(text, searchTerm) {
            if (!searchTerm || !text) return this.escapeHtml(text);

            const escapedText = this.escapeHtml(text);
            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');

            return escapedText.replace(regex, '<mark class="corpus-highlight">$1</mark>');
        }

        /**
         * Escape HTML characters
         * @param {string} text - Text to escape
         * @returns {string} Escaped text
         */
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Capitalize string
         * @param {string} str - String to capitalize
         * @returns {string} Capitalized string
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * Initialize event listeners for inline links
         * @param {HTMLElement} container - Container element
         */
        initializeEvents(container) {
            const links = container.querySelectorAll('.corpus-inline-link');

            links.forEach(link => {
                // Mouse events for preview
                link.addEventListener('mouseenter', this.handleMouseEnter);
                link.addEventListener('mouseleave', this.handleMouseLeave);

                // Keyboard events for accessibility
                link.addEventListener('keydown', this.handleKeyDown);

                // Click events for expansion
                if (this.options.clickToExpand) {
                    link.addEventListener('click', this.handleClick);
                }
            });
        }

        /**
         * Handle mouse enter event
         * @param {Event} event - Mouse event
         */
        handleMouseEnter(event) {
            const link = event.currentTarget;
            const preview = link.querySelector('.corpus-inline-preview');

            if (!preview) return;

            // Clear any existing hide timer
            if (link._hideTimer) {
                clearTimeout(link._hideTimer);
            }

            // Show preview after delay
            link._showTimer = setTimeout(() => {
                preview.setAttribute('aria-hidden', 'false');
                link.classList.add('corpus-inline-active');
                this.positionPreview(link, preview);
                this.activeTooltips.add(link);
            }, this.options.tooltipDelay);
        }

        /**
         * Handle mouse leave event
         * @param {Event} event - Mouse event
         */
        handleMouseLeave(event) {
            const link = event.currentTarget;
            const preview = link.querySelector('.corpus-inline-preview');

            if (!preview) return;

            // Clear show timer
            if (link._showTimer) {
                clearTimeout(link._showTimer);
            }

            // Hide preview after short delay
            link._hideTimer = setTimeout(() => {
                preview.setAttribute('aria-hidden', 'true');
                link.classList.remove('corpus-inline-active');
                this.activeTooltips.delete(link);
            }, 100);
        }

        /**
         * Handle keyboard events
         * @param {KeyboardEvent} event - Keyboard event
         */
        handleKeyDown(event) {
            const link = event.currentTarget;

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const anchor = link.querySelector('.corpus-inline-name');
                if (anchor) {
                    anchor.click();
                }
            } else if (event.key === 'Escape') {
                const preview = link.querySelector('.corpus-inline-preview');
                if (preview) {
                    preview.setAttribute('aria-hidden', 'true');
                    link.classList.remove('corpus-inline-active');
                }
            }
        }

        /**
         * Handle click event for expansion
         * @param {Event} event - Click event
         */
        handleClick(event) {
            const link = event.currentTarget;
            const isExpandable = link.dataset.expandable === 'true';

            if (isExpandable && !event.target.closest('a')) {
                event.preventDefault();
                this.expandResult(link);
            }
        }

        /**
         * Position preview tooltip
         * @param {HTMLElement} link - Link element
         * @param {HTMLElement} preview - Preview element
         */
        positionPreview(link, preview) {
            const linkRect = link.getBoundingClientRect();
            const previewRect = preview.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Calculate available space
            const spaceBelow = viewportHeight - linkRect.bottom;
            const spaceAbove = linkRect.top;

            // Determine position based on available space
            let position = this.options.previewPosition;

            if (position === 'auto') {
                position = spaceBelow >= previewRect.height + 10 ? 'bottom' : 'top';
            }

            preview.classList.remove('preview-top', 'preview-bottom');
            preview.classList.add(`preview-${position}`);

            // Horizontal positioning to keep in viewport
            const previewWidth = preview.offsetWidth;
            const linkCenter = linkRect.left + linkRect.width / 2;

            if (linkCenter - previewWidth / 2 < 10) {
                preview.style.left = '0';
                preview.style.transform = 'translateX(0)';
            } else if (linkCenter + previewWidth / 2 > viewportWidth - 10) {
                preview.style.left = 'auto';
                preview.style.right = '0';
                preview.style.transform = 'translateX(0)';
            } else {
                preview.style.left = '50%';
                preview.style.right = 'auto';
                preview.style.transform = 'translateX(-50%)';
            }
        }

        /**
         * Expand result to show full details
         * @param {HTMLElement} link - Link element to expand
         */
        expandResult(link) {
            const entityId = link.dataset.entityId;
            const entityType = link.dataset.entityType;

            // Dispatch custom event for handling by parent components
            const expandEvent = new CustomEvent('corpus-expand', {
                bubbles: true,
                detail: {
                    entityId,
                    entityType,
                    element: link
                }
            });

            link.dispatchEvent(expandEvent);
        }

        /**
         * Hide all active tooltips
         */
        hideAllTooltips() {
            this.activeTooltips.forEach(link => {
                const preview = link.querySelector('.corpus-inline-preview');
                if (preview) {
                    preview.setAttribute('aria-hidden', 'true');
                    link.classList.remove('corpus-inline-active');
                }
            });
            this.activeTooltips.clear();
        }

        /**
         * Destroy renderer and clean up events
         * @param {HTMLElement} container - Container element
         */
        destroy(container) {
            const links = container.querySelectorAll('.corpus-inline-link');

            links.forEach(link => {
                link.removeEventListener('mouseenter', this.handleMouseEnter);
                link.removeEventListener('mouseleave', this.handleMouseLeave);
                link.removeEventListener('keydown', this.handleKeyDown);
                link.removeEventListener('click', this.handleClick);

                if (link._showTimer) clearTimeout(link._showTimer);
                if (link._hideTimer) clearTimeout(link._hideTimer);
            });

            this.hideAllTooltips();
        }
    }

    // Export to window
    if (typeof window !== 'undefined') {
        window.CorpusInlineRenderer = CorpusInlineRenderer;
    }

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CorpusInlineRenderer;
    }

})();
