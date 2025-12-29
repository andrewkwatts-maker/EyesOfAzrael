/**
 * Corpus Grid Renderer Component
 *
 * Renders corpus search results in a responsive card grid layout.
 * Supports multiple display densities and interactive features.
 *
 * Features:
 * - Responsive grid with configurable columns
 * - Compact and detailed card styles
 * - Search term highlighting
 * - Lazy loading for large result sets
 * - Keyboard navigation support
 * - Virtual scrolling for performance
 * - Filtering and sorting integration
 *
 * Usage:
 * const renderer = new CorpusGridRenderer(containerElement, { columns: 3, cardStyle: 'detailed' });
 * renderer.render(results, { query: 'Zeus', mode: 'source' });
 */

(function() {
    'use strict';

    class CorpusGridRenderer {
        constructor(container, options = {}) {
            this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;

            this.options = {
                columns: 3,
                cardStyle: 'compact', // 'compact', 'detailed', 'minimal'
                gap: 20,
                animateCards: true,
                showScores: false,
                showMetadata: true,
                highlightMatches: true,
                lazyLoadThreshold: 20,
                virtualScrolling: false,
                emptyStateMessage: 'No results found',
                loadingMessage: 'Loading results...',
                ...options
            };

            // State
            this.results = [];
            this.queryInfo = {};
            this.visibleCount = this.options.lazyLoadThreshold;
            this.isLoading = false;

            // Bind methods
            this.handleCardClick = this.handleCardClick.bind(this);
            this.handleCardKeyDown = this.handleCardKeyDown.bind(this);
            this.handleLoadMore = this.handleLoadMore.bind(this);
            this.handleScroll = this.handleScroll.bind(this);

            // Initialize
            this.init();
        }

        /**
         * Initialize the grid renderer
         */
        init() {
            if (!this.container) {
                console.error('[CorpusGridRenderer] Container element not found');
                return;
            }

            // Add grid container class
            this.container.classList.add('corpus-grid-container');

            // Set up scroll listener for lazy loading
            if (this.options.virtualScrolling) {
                window.addEventListener('scroll', this.handleScroll, { passive: true });
            }
        }

        /**
         * Render results as cards in a grid
         * @param {Array} results - Search results array
         * @param {Object} queryInfo - Query information { query, mode, mythology, total }
         */
        render(results, queryInfo = {}) {
            this.results = results || [];
            this.queryInfo = queryInfo;
            this.visibleCount = Math.min(this.options.lazyLoadThreshold, this.results.length);

            // Clear container
            this.container.innerHTML = '';

            // Handle empty state
            if (this.results.length === 0) {
                this.renderEmptyState();
                return;
            }

            // Build grid
            const gridHtml = this.buildGrid();
            this.container.innerHTML = gridHtml;

            // Initialize event listeners
            this.initializeEvents();

            // Trigger animation if enabled
            if (this.options.animateCards) {
                this.animateCardsIn();
            }
        }

        /**
         * Build grid HTML
         * @returns {string} HTML string for grid
         */
        buildGrid() {
            const visibleResults = this.results.slice(0, this.visibleCount);
            const hasMore = this.results.length > this.visibleCount;

            // Build CSS variables for grid
            const gridStyle = `
                --corpus-grid-columns: ${this.options.columns};
                --corpus-grid-gap: ${this.options.gap}px;
            `;

            // Build cards HTML
            const cardsHtml = visibleResults.map((result, index) =>
                this.renderCard(result, index)
            ).join('');

            // Build load more button if needed
            const loadMoreHtml = hasMore ? this.renderLoadMore() : '';

            // Build results summary
            const summaryHtml = this.renderResultsSummary();

            return `
                <div class="corpus-grid-header">
                    ${summaryHtml}
                </div>
                <div class="corpus-grid corpus-grid-${this.options.cardStyle}"
                     style="${gridStyle}"
                     role="list"
                     aria-label="Search results">
                    ${cardsHtml}
                </div>
                ${loadMoreHtml}
            `;
        }

        /**
         * Render individual card
         * @param {Object} result - Search result
         * @param {number} index - Result index
         * @returns {string} HTML for card
         */
        renderCard(result, index) {
            const id = `corpus-card-${index}-${Date.now()}`;
            const name = this.escapeHtml(result.name || result.title || 'Unknown');
            const entityType = result.entityType || result.type || 'entity';
            const mythology = result.mythology || result.primaryMythology || '';
            const description = result.description || result.shortDescription || result.text || '';
            const url = this.getEntityUrl(result);
            const icon = result.icon || this.getEntityIcon(entityType);
            const score = result._searchScore || 0;
            const matchedFields = result._matchedFields || [];

            // Truncate description based on card style
            const maxDescLength = this.options.cardStyle === 'detailed' ? 200 : 100;
            const truncatedDesc = this.truncateText(description, maxDescLength);

            // Highlight matches if enabled
            const highlightedDesc = this.options.highlightMatches && this.queryInfo.query
                ? this.highlightSearchTerm(truncatedDesc, this.queryInfo.query)
                : this.escapeHtml(truncatedDesc);

            // Build data attributes
            const dataAttrs = [
                `data-entity-id="${this.escapeHtml(result.id || result.entityId || '')}"`,
                `data-entity-type="${this.escapeHtml(entityType)}"`,
                `data-mythology="${this.escapeHtml(mythology)}"`,
                `data-index="${index}"`
            ].join(' ');

            // Build card based on style
            switch (this.options.cardStyle) {
                case 'minimal':
                    return this.renderMinimalCard(id, result, dataAttrs, url);
                case 'detailed':
                    return this.renderDetailedCard(id, result, dataAttrs, url, highlightedDesc);
                default:
                    return this.renderCompactCard(id, result, dataAttrs, url, highlightedDesc);
            }
        }

        /**
         * Render minimal card style
         */
        renderMinimalCard(id, result, dataAttrs, url) {
            const name = this.escapeHtml(result.name || result.title || 'Unknown');
            const entityType = result.entityType || result.type || 'entity';
            const icon = result.icon || this.getEntityIcon(entityType);

            return `
                <div class="corpus-card corpus-card-minimal"
                     id="${id}"
                     ${dataAttrs}
                     role="listitem"
                     tabindex="0">
                    <a href="${url}" class="corpus-card-link">
                        <span class="corpus-card-icon">${icon}</span>
                        <span class="corpus-card-name">${name}</span>
                    </a>
                </div>
            `;
        }

        /**
         * Render compact card style
         */
        renderCompactCard(id, result, dataAttrs, url, highlightedDesc) {
            const name = this.escapeHtml(result.name || result.title || 'Unknown');
            const entityType = result.entityType || result.type || 'entity';
            const mythology = result.mythology || '';
            const icon = result.icon || this.getEntityIcon(entityType);
            const score = result._searchScore || 0;

            const mythologyBadge = mythology
                ? `<span class="corpus-card-badge corpus-card-badge-mythology">${this.escapeHtml(mythology)}</span>`
                : '';

            const typeBadge = `<span class="corpus-card-badge corpus-card-badge-type">${this.capitalize(entityType)}</span>`;

            const scoreBadge = this.options.showScores && score > 0
                ? `<span class="corpus-card-score" title="Relevance score">${score}</span>`
                : '';

            return `
                <div class="corpus-card corpus-card-compact"
                     id="${id}"
                     ${dataAttrs}
                     role="listitem"
                     tabindex="0">
                    <div class="corpus-card-header">
                        <span class="corpus-card-icon">${icon}</span>
                        ${scoreBadge}
                    </div>
                    <div class="corpus-card-body">
                        <h3 class="corpus-card-title">
                            <a href="${url}">${name}</a>
                        </h3>
                        <div class="corpus-card-badges">
                            ${mythologyBadge}
                            ${typeBadge}
                        </div>
                        <p class="corpus-card-description">${highlightedDesc}</p>
                    </div>
                    <div class="corpus-card-footer">
                        <a href="${url}" class="corpus-card-action">View Details</a>
                    </div>
                </div>
            `;
        }

        /**
         * Render detailed card style
         */
        renderDetailedCard(id, result, dataAttrs, url, highlightedDesc) {
            const name = this.escapeHtml(result.name || result.title || 'Unknown');
            const subtitle = this.escapeHtml(result.subtitle || result.shortDescription || '');
            const entityType = result.entityType || result.type || 'entity';
            const mythology = result.mythology || '';
            const icon = result.icon || this.getEntityIcon(entityType);
            const score = result._searchScore || 0;
            const matchedFields = result._matchedFields || [];
            const matchedTerms = result._matchedTerms?.terms || [];

            // Build metadata section
            const metadataHtml = this.options.showMetadata
                ? this.renderCardMetadata(result)
                : '';

            // Build matched info
            const matchedHtml = matchedFields.length > 0
                ? `<div class="corpus-card-matched">
                       <span class="matched-label">Matched in:</span>
                       ${matchedFields.map(f => `<span class="matched-field">${this.capitalize(f)}</span>`).join('')}
                   </div>`
                : '';

            // Build tags section
            const tags = result.tags || result.domains || result.symbols || [];
            const tagsHtml = tags.length > 0
                ? `<div class="corpus-card-tags">
                       ${tags.slice(0, 5).map(tag => `<span class="corpus-card-tag">${this.escapeHtml(tag)}</span>`).join('')}
                   </div>`
                : '';

            const mythologyBadge = mythology
                ? `<span class="corpus-card-badge corpus-card-badge-mythology">${this.escapeHtml(mythology)}</span>`
                : '';

            const scoreBadge = this.options.showScores && score > 0
                ? `<span class="corpus-card-score" title="Relevance score">${score}</span>`
                : '';

            return `
                <div class="corpus-card corpus-card-detailed"
                     id="${id}"
                     ${dataAttrs}
                     role="listitem"
                     tabindex="0">
                    <div class="corpus-card-header">
                        <div class="corpus-card-header-main">
                            <span class="corpus-card-icon corpus-card-icon-large">${icon}</span>
                            <div class="corpus-card-header-text">
                                <h3 class="corpus-card-title">
                                    <a href="${url}">${name}</a>
                                </h3>
                                ${subtitle ? `<p class="corpus-card-subtitle">${subtitle}</p>` : ''}
                            </div>
                        </div>
                        <div class="corpus-card-header-badges">
                            ${mythologyBadge}
                            ${scoreBadge}
                        </div>
                    </div>
                    <div class="corpus-card-body">
                        <p class="corpus-card-description">${highlightedDesc}</p>
                        ${metadataHtml}
                        ${matchedHtml}
                        ${tagsHtml}
                    </div>
                    <div class="corpus-card-footer">
                        <a href="${url}" class="corpus-card-action corpus-card-action-primary">View Details</a>
                        <button class="corpus-card-action corpus-card-action-secondary"
                                data-action="quick-view"
                                aria-label="Quick view ${name}">
                            Quick View
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Render card metadata
         * @param {Object} result - Search result
         * @returns {string} HTML for metadata
         */
        renderCardMetadata(result) {
            const metadata = [];

            // Entity type
            if (result.entityType || result.type) {
                metadata.push({
                    label: 'Type',
                    value: this.capitalize(result.entityType || result.type)
                });
            }

            // Primary element
            const element = result.element || result.metaphysicalProperties?.primaryElement;
            if (element) {
                metadata.push({
                    label: 'Element',
                    value: this.capitalize(element)
                });
            }

            // Importance
            if (result.importance) {
                metadata.push({
                    label: 'Importance',
                    value: `${result.importance}%`
                });
            }

            // Sources count
            if (result.sources && result.sources.length > 0) {
                metadata.push({
                    label: 'Sources',
                    value: result.sources.length
                });
            }

            if (metadata.length === 0) return '';

            return `
                <div class="corpus-card-metadata">
                    ${metadata.map(m => `
                        <div class="corpus-card-meta-item">
                            <span class="meta-label">${m.label}:</span>
                            <span class="meta-value">${m.value}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        /**
         * Render results summary
         * @returns {string} HTML for summary
         */
        renderResultsSummary() {
            const total = this.queryInfo.total || this.results.length;
            const query = this.queryInfo.query || '';
            const mode = this.queryInfo.mode || 'generic';
            const mythology = this.queryInfo.mythology || '';

            const queryInfo = query
                ? `for "<strong>${this.escapeHtml(query)}</strong>"`
                : '';

            const mythologyInfo = mythology
                ? ` in ${this.escapeHtml(mythology)}`
                : '';

            const modeInfo = mode !== 'generic'
                ? ` (${this.capitalize(mode)} search)`
                : '';

            return `
                <div class="corpus-grid-summary">
                    <span class="summary-count">${total} result${total !== 1 ? 's' : ''}</span>
                    <span class="summary-query">${queryInfo}${mythologyInfo}${modeInfo}</span>
                </div>
            `;
        }

        /**
         * Render load more button
         * @returns {string} HTML for load more
         */
        renderLoadMore() {
            const remaining = this.results.length - this.visibleCount;

            return `
                <div class="corpus-grid-load-more">
                    <button class="corpus-load-more-btn"
                            data-action="load-more"
                            aria-label="Load ${Math.min(remaining, this.options.lazyLoadThreshold)} more results">
                        Load More
                        <span class="load-more-count">(${remaining} remaining)</span>
                    </button>
                </div>
            `;
        }

        /**
         * Render empty state
         */
        renderEmptyState() {
            const query = this.queryInfo.query || '';

            this.container.innerHTML = `
                <div class="corpus-grid-empty">
                    <div class="empty-icon">&#x1F50D;</div>
                    <h3 class="empty-title">${this.options.emptyStateMessage}</h3>
                    ${query ? `<p class="empty-query">No matches for "${this.escapeHtml(query)}"</p>` : ''}
                    <div class="empty-suggestions">
                        <p>Try:</p>
                        <ul>
                            <li>Using different keywords</li>
                            <li>Checking your spelling</li>
                            <li>Using a broader search term</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        /**
         * Render loading state
         */
        renderLoading() {
            this.container.innerHTML = `
                <div class="corpus-grid-loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${this.options.loadingMessage}</p>
                </div>
            `;
        }

        /**
         * Initialize event listeners
         */
        initializeEvents() {
            // Card click events
            const cards = this.container.querySelectorAll('.corpus-card');
            cards.forEach(card => {
                card.addEventListener('click', this.handleCardClick);
                card.addEventListener('keydown', this.handleCardKeyDown);
            });

            // Load more button
            const loadMoreBtn = this.container.querySelector('[data-action="load-more"]');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', this.handleLoadMore);
            }

            // Quick view buttons
            const quickViewBtns = this.container.querySelectorAll('[data-action="quick-view"]');
            quickViewBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.corpus-card');
                    this.showQuickView(card);
                });
            });
        }

        /**
         * Handle card click
         * @param {Event} event - Click event
         */
        handleCardClick(event) {
            // Don't handle if clicking on a link or button
            if (event.target.closest('a') || event.target.closest('button')) {
                return;
            }

            const card = event.currentTarget;
            const link = card.querySelector('.corpus-card-title a');

            if (link) {
                // Dispatch custom event before navigation
                const selectEvent = new CustomEvent('corpus-card-select', {
                    bubbles: true,
                    detail: {
                        entityId: card.dataset.entityId,
                        entityType: card.dataset.entityType,
                        element: card
                    }
                });

                card.dispatchEvent(selectEvent);
            }
        }

        /**
         * Handle card keyboard navigation
         * @param {KeyboardEvent} event - Keyboard event
         */
        handleCardKeyDown(event) {
            const card = event.currentTarget;
            const cards = Array.from(this.container.querySelectorAll('.corpus-card'));
            const currentIndex = cards.indexOf(card);

            switch (event.key) {
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    const link = card.querySelector('.corpus-card-title a');
                    if (link) link.click();
                    break;

                case 'ArrowRight':
                    event.preventDefault();
                    if (currentIndex < cards.length - 1) {
                        cards[currentIndex + 1].focus();
                    }
                    break;

                case 'ArrowLeft':
                    event.preventDefault();
                    if (currentIndex > 0) {
                        cards[currentIndex - 1].focus();
                    }
                    break;

                case 'ArrowDown':
                    event.preventDefault();
                    const nextRowIndex = currentIndex + this.options.columns;
                    if (nextRowIndex < cards.length) {
                        cards[nextRowIndex].focus();
                    }
                    break;

                case 'ArrowUp':
                    event.preventDefault();
                    const prevRowIndex = currentIndex - this.options.columns;
                    if (prevRowIndex >= 0) {
                        cards[prevRowIndex].focus();
                    }
                    break;
            }
        }

        /**
         * Handle load more button click
         * @param {Event} event - Click event
         */
        handleLoadMore(event) {
            event.preventDefault();

            this.visibleCount = Math.min(
                this.visibleCount + this.options.lazyLoadThreshold,
                this.results.length
            );

            // Re-render grid
            this.render(this.results, this.queryInfo);

            // Focus first new card
            const cards = this.container.querySelectorAll('.corpus-card');
            const firstNewCard = cards[this.visibleCount - this.options.lazyLoadThreshold];
            if (firstNewCard) {
                firstNewCard.focus();
            }
        }

        /**
         * Handle scroll for virtual scrolling
         * @param {Event} event - Scroll event
         */
        handleScroll(event) {
            if (!this.options.virtualScrolling || this.isLoading) return;

            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Load more when near bottom
            if (scrollTop + windowHeight >= documentHeight - 200) {
                if (this.visibleCount < this.results.length) {
                    this.handleLoadMore({ preventDefault: () => {} });
                }
            }
        }

        /**
         * Show quick view modal
         * @param {HTMLElement} card - Card element
         */
        showQuickView(card) {
            const entityId = card.dataset.entityId;
            const entityType = card.dataset.entityType;

            // Dispatch quick view event for handling by parent
            const quickViewEvent = new CustomEvent('corpus-quick-view', {
                bubbles: true,
                detail: {
                    entityId,
                    entityType,
                    element: card
                }
            });

            card.dispatchEvent(quickViewEvent);
        }

        /**
         * Animate cards entrance
         */
        animateCardsIn() {
            const cards = this.container.querySelectorAll('.corpus-card');

            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50);
            });
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
         * Get entity icon
         * @param {string} entityType - Type of entity
         * @returns {string} Icon character
         */
        getEntityIcon(entityType) {
            const icons = {
                deity: '&#x1F451;',
                hero: '&#x1F9B8;',
                creature: '&#x1F409;',
                item: '&#x2694;',
                place: '&#x1F3DB;',
                text: '&#x1F4DC;',
                concept: '&#x1F4AD;',
                symbol: '&#x269B;',
                ritual: '&#x2728;',
                herb: '&#x1F33F;',
                magic: '&#x2728;'
            };

            return icons[entityType] || '&#x1F4CC;';
        }

        /**
         * Highlight search term
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
         * Truncate text
         * @param {string} text - Text to truncate
         * @param {number} maxLength - Maximum length
         * @returns {string} Truncated text
         */
        truncateText(text, maxLength) {
            if (!text || text.length <= maxLength) return text || '';

            const truncated = text.substring(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');

            return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...';
        }

        /**
         * Escape HTML
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
         * Update grid columns
         * @param {number} columns - Number of columns
         */
        setColumns(columns) {
            this.options.columns = columns;
            this.container.style.setProperty('--corpus-grid-columns', columns);
        }

        /**
         * Update card style
         * @param {string} style - Card style ('compact', 'detailed', 'minimal')
         */
        setCardStyle(style) {
            this.options.cardStyle = style;
            this.render(this.results, this.queryInfo);
        }

        /**
         * Filter visible results
         * @param {Function} filterFn - Filter function
         */
        filter(filterFn) {
            const filteredResults = this.results.filter(filterFn);
            this.render(filteredResults, this.queryInfo);
        }

        /**
         * Sort visible results
         * @param {string} sortBy - Sort field
         * @param {string} direction - Sort direction ('asc' or 'desc')
         */
        sort(sortBy, direction = 'desc') {
            const sortedResults = [...this.results].sort((a, b) => {
                let aVal = a[sortBy] || 0;
                let bVal = b[sortBy] || 0;

                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                }
                return aVal < bVal ? 1 : -1;
            });

            this.render(sortedResults, this.queryInfo);
        }

        /**
         * Destroy renderer and clean up
         */
        destroy() {
            // Remove scroll listener
            if (this.options.virtualScrolling) {
                window.removeEventListener('scroll', this.handleScroll);
            }

            // Remove card event listeners
            const cards = this.container.querySelectorAll('.corpus-card');
            cards.forEach(card => {
                card.removeEventListener('click', this.handleCardClick);
                card.removeEventListener('keydown', this.handleCardKeyDown);
            });

            // Clear container
            this.container.innerHTML = '';
            this.container.classList.remove('corpus-grid-container');

            // Clear state
            this.results = [];
            this.queryInfo = {};
        }
    }

    // Export to window
    if (typeof window !== 'undefined') {
        window.CorpusGridRenderer = CorpusGridRenderer;
    }

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CorpusGridRenderer;
    }

})();
