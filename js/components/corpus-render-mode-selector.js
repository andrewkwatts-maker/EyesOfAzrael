/**
 * Corpus Render Mode Selector
 *
 * Factory utility for selecting and instantiating the appropriate
 * corpus search renderer based on display mode requirements.
 *
 * Features:
 * - Unified interface for all render modes
 * - Automatic renderer selection
 * - Configuration merging
 * - Renderer lifecycle management
 * - Event delegation support
 *
 * Supported Modes:
 * - 'panel': Full panel display (CorpusPanelRenderer)
 * - 'inline': Inline links with previews (CorpusInlineRenderer)
 * - 'inline-grid': Grid of cards (CorpusGridRenderer)
 * - 'inline-quote': Blockquote citations (CorpusInlineRenderer)
 * - 'inline-list': Compact inline list (CorpusInlineRenderer)
 * - 'table': Table display (uses existing table renderer)
 *
 * Usage:
 * const renderer = CorpusRenderModeSelector.getRenderer('inline-grid', container, options);
 * renderer.render(results, queryInfo);
 */

(function() {
    'use strict';

    class CorpusRenderModeSelector {
        /**
         * Renderer registry
         */
        static renderers = {
            panel: 'CorpusPanelRenderer',
            inline: 'CorpusInlineRenderer',
            'inline-link': 'CorpusInlineRenderer',
            'inline-grid': 'CorpusGridRenderer',
            'inline-quote': 'CorpusInlineRenderer',
            'inline-list': 'CorpusInlineRenderer',
            grid: 'CorpusGridRenderer',
            table: 'CorpusTableRenderer'
        };

        /**
         * Default options for each mode
         */
        static defaultOptions = {
            panel: {
                expandable: true,
                showMetrics: true,
                showFilters: true
            },
            inline: {
                maxPreviewLength: 100,
                showSource: true,
                clickToExpand: true
            },
            'inline-link': {
                maxPreviewLength: 80,
                showSource: false,
                clickToExpand: false
            },
            'inline-grid': {
                columns: 3,
                cardStyle: 'compact',
                animateCards: true
            },
            'inline-quote': {
                style: 'default',
                showLink: true
            },
            'inline-list': {
                maxItems: 5,
                separator: ', '
            },
            grid: {
                columns: 4,
                cardStyle: 'minimal'
            },
            table: {
                sortable: true,
                paginated: true
            }
        };

        /**
         * Get appropriate renderer based on mode
         * @param {string} mode - Display mode
         * @param {HTMLElement|string} container - Container element or selector
         * @param {Object} options - Renderer options
         * @returns {Object} Renderer instance
         */
        static getRenderer(mode, container, options = {}) {
            const normalizedMode = mode.toLowerCase().replace(/\s+/g, '-');

            // Get renderer class name
            const rendererName = this.renderers[normalizedMode];

            if (!rendererName) {
                console.warn(`[CorpusRenderModeSelector] Unknown mode: ${mode}, falling back to inline-grid`);
                return this.getRenderer('inline-grid', container, options);
            }

            // Get renderer class from window
            const RendererClass = window[rendererName];

            if (!RendererClass) {
                console.error(`[CorpusRenderModeSelector] Renderer class not found: ${rendererName}`);
                return null;
            }

            // Merge default options with provided options
            const mergedOptions = {
                ...this.defaultOptions[normalizedMode],
                ...options
            };

            // Instantiate renderer
            return this.createRenderer(normalizedMode, RendererClass, container, mergedOptions);
        }

        /**
         * Create renderer instance
         * @param {string} mode - Display mode
         * @param {Function} RendererClass - Renderer class
         * @param {HTMLElement|string} container - Container element
         * @param {Object} options - Merged options
         * @returns {Object} Renderer instance with unified interface
         */
        static createRenderer(mode, RendererClass, container, options) {
            let renderer;

            // Some renderers need container in constructor, others don't
            const needsContainer = ['CorpusGridRenderer', 'CorpusPanelRenderer', 'CorpusTableRenderer'];

            if (needsContainer.includes(RendererClass.name)) {
                renderer = new RendererClass(container, options);
            } else {
                renderer = new RendererClass(options);
            }

            // Wrap with unified interface
            return new UnifiedRendererWrapper(renderer, mode, container, options);
        }

        /**
         * Get available render modes
         * @returns {Array} Array of mode names
         */
        static getAvailableModes() {
            return Object.keys(this.renderers);
        }

        /**
         * Check if a mode is available
         * @param {string} mode - Mode to check
         * @returns {boolean} True if mode is available
         */
        static isModeAvailable(mode) {
            const normalizedMode = mode.toLowerCase().replace(/\s+/g, '-');
            const rendererName = this.renderers[normalizedMode];
            return rendererName && typeof window[rendererName] === 'function';
        }

        /**
         * Get recommended mode based on context
         * @param {Object} context - Context information
         * @returns {string} Recommended mode
         */
        static getRecommendedMode(context = {}) {
            const {
                resultCount = 0,
                containerWidth = window.innerWidth,
                isInline = false,
                hasImages = false,
                isMobile = window.innerWidth < 768
            } = context;

            // For inline contexts, use inline renderer
            if (isInline) {
                return 'inline';
            }

            // For mobile, prefer simpler layouts
            if (isMobile) {
                return resultCount > 10 ? 'inline-list' : 'inline-grid';
            }

            // For many results, use grid
            if (resultCount > 20) {
                return 'inline-grid';
            }

            // For few results with details, use panel
            if (resultCount <= 5) {
                return 'panel';
            }

            // Default to grid
            return 'inline-grid';
        }

        /**
         * Register a custom renderer
         * @param {string} mode - Mode name
         * @param {string} rendererName - Global class name
         * @param {Object} defaultOpts - Default options
         */
        static registerRenderer(mode, rendererName, defaultOpts = {}) {
            this.renderers[mode] = rendererName;
            this.defaultOptions[mode] = defaultOpts;
        }
    }

    /**
     * Unified Renderer Wrapper
     *
     * Provides a consistent interface regardless of underlying renderer type.
     */
    class UnifiedRendererWrapper {
        constructor(renderer, mode, container, options) {
            this.renderer = renderer;
            this.mode = mode;
            this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;
            this.options = options;

            // Store rendered results for re-rendering
            this.lastResults = [];
            this.lastQueryInfo = {};

            // Event handlers
            this.eventHandlers = new Map();
        }

        /**
         * Render results using the appropriate method for the mode
         * @param {Array} results - Search results
         * @param {Object} queryInfo - Query information
         * @returns {string|void} HTML string or void (depends on renderer)
         */
        render(results, queryInfo = {}) {
            this.lastResults = results;
            this.lastQueryInfo = queryInfo;

            // Handle different renderer types
            switch (this.mode) {
                case 'inline':
                case 'inline-link':
                    return this.renderInlineLinks(results, queryInfo);

                case 'inline-quote':
                    return this.renderQuotes(results);

                case 'inline-list':
                    return this.renderInlineList(results, queryInfo);

                case 'inline-grid':
                case 'grid':
                    this.renderer.render(results, queryInfo);
                    this.initializeEvents();
                    return;

                case 'panel':
                    this.renderer.render(results, queryInfo);
                    return;

                case 'table':
                    this.renderer.render(results, queryInfo);
                    return;

                default:
                    console.warn(`[UnifiedRendererWrapper] Unknown mode: ${this.mode}`);
                    return '';
            }
        }

        /**
         * Render as inline links
         */
        renderInlineLinks(results, queryInfo) {
            if (!results || results.length === 0) {
                return '<span class="corpus-inline-empty">No results</span>';
            }

            const html = results.map(result =>
                this.renderer.renderLink(result, queryInfo)
            ).join(' ');

            if (this.container) {
                this.container.innerHTML = html;
                this.renderer.initializeEvents(this.container);
            }

            return html;
        }

        /**
         * Render as blockquotes
         */
        renderQuotes(results) {
            if (!results || results.length === 0) {
                return '<p class="corpus-inline-empty">No quotes available</p>';
            }

            const html = results.map(result =>
                this.renderer.renderQuote(result, this.options)
            ).join('');

            if (this.container) {
                this.container.innerHTML = html;
            }

            return html;
        }

        /**
         * Render as inline list
         */
        renderInlineList(results, queryInfo) {
            const html = this.renderer.renderInlineList(results, queryInfo, this.options);

            if (this.container) {
                this.container.innerHTML = html;
                this.renderer.initializeEvents(this.container);
            }

            return html;
        }

        /**
         * Initialize event handlers
         */
        initializeEvents() {
            if (!this.container) return;

            // Set up event delegation
            this.container.addEventListener('corpus-expand', (e) => {
                this.emit('expand', e.detail);
            });

            this.container.addEventListener('corpus-card-select', (e) => {
                this.emit('select', e.detail);
            });

            this.container.addEventListener('corpus-quick-view', (e) => {
                this.emit('quickView', e.detail);
            });
        }

        /**
         * Add event listener
         * @param {string} event - Event name
         * @param {Function} handler - Event handler
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
            return this;
        }

        /**
         * Remove event listener
         * @param {string} event - Event name
         * @param {Function} handler - Event handler
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
            return this;
        }

        /**
         * Emit event
         * @param {string} event - Event name
         * @param {Object} data - Event data
         */
        emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (e) {
                        console.error(`[UnifiedRendererWrapper] Event handler error:`, e);
                    }
                });
            }
        }

        /**
         * Update options and re-render
         * @param {Object} newOptions - New options
         */
        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions };

            // Update underlying renderer if it has setters
            if (this.renderer.setColumns && newOptions.columns) {
                this.renderer.setColumns(newOptions.columns);
            }
            if (this.renderer.setCardStyle && newOptions.cardStyle) {
                this.renderer.setCardStyle(newOptions.cardStyle);
            }

            // Re-render if we have stored results
            if (this.lastResults.length > 0) {
                this.render(this.lastResults, this.lastQueryInfo);
            }
        }

        /**
         * Filter displayed results
         * @param {Function} filterFn - Filter function
         */
        filter(filterFn) {
            const filtered = this.lastResults.filter(filterFn);
            this.render(filtered, this.lastQueryInfo);
        }

        /**
         * Sort displayed results
         * @param {string} sortBy - Sort field
         * @param {string} direction - Sort direction
         */
        sort(sortBy, direction = 'desc') {
            if (this.renderer.sort) {
                this.renderer.sort(sortBy, direction);
            } else {
                const sorted = [...this.lastResults].sort((a, b) => {
                    const aVal = a[sortBy] || 0;
                    const bVal = b[sortBy] || 0;
                    return direction === 'asc' ? aVal - bVal : bVal - aVal;
                });
                this.render(sorted, this.lastQueryInfo);
            }
        }

        /**
         * Clear display
         */
        clear() {
            if (this.container) {
                this.container.innerHTML = '';
            }
            this.lastResults = [];
            this.lastQueryInfo = {};
        }

        /**
         * Show loading state
         */
        showLoading() {
            if (this.renderer.renderLoading) {
                this.renderer.renderLoading();
            } else if (this.container) {
                this.container.innerHTML = `
                    <div class="corpus-grid-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading results...</p>
                    </div>
                `;
            }
        }

        /**
         * Show error state
         * @param {string|Error} error - Error message or object
         */
        showError(error) {
            const message = error instanceof Error ? error.message : error;

            if (this.container) {
                this.container.innerHTML = `
                    <div class="corpus-grid-empty corpus-error">
                        <div class="empty-icon">&#x26A0;</div>
                        <h3 class="empty-title">Error Loading Results</h3>
                        <p class="empty-query">${this.escapeHtml(message)}</p>
                    </div>
                `;
            }
        }

        /**
         * Get current mode
         * @returns {string} Current mode
         */
        getMode() {
            return this.mode;
        }

        /**
         * Get result count
         * @returns {number} Number of results
         */
        getResultCount() {
            return this.lastResults.length;
        }

        /**
         * Destroy wrapper and underlying renderer
         */
        destroy() {
            if (this.renderer.destroy) {
                this.renderer.destroy();
            }

            if (this.container) {
                this.container.innerHTML = '';
            }

            this.eventHandlers.clear();
            this.lastResults = [];
            this.lastQueryInfo = {};
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

    /**
     * Render Mode Switcher UI Component
     *
     * Provides a UI for switching between render modes.
     */
    class RenderModeSwitcher {
        constructor(container, options = {}) {
            this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;

            this.options = {
                modes: ['inline-grid', 'panel', 'inline-list'],
                defaultMode: 'inline-grid',
                icons: {
                    'inline-grid': '&#x25A6;',
                    'panel': '&#x25A3;',
                    'inline-list': '&#x2630;',
                    'table': '&#x25A4;',
                    'inline': '&#x1F517;'
                },
                labels: {
                    'inline-grid': 'Grid',
                    'panel': 'Panel',
                    'inline-list': 'List',
                    'table': 'Table',
                    'inline': 'Inline'
                },
                onChange: null,
                ...options
            };

            this.currentMode = this.options.defaultMode;
            this.render();
        }

        /**
         * Render switcher UI
         */
        render() {
            if (!this.container) return;

            const buttonsHtml = this.options.modes.map(mode => {
                const isActive = mode === this.currentMode;
                const icon = this.options.icons[mode] || '&#x25A3;';
                const label = this.options.labels[mode] || mode;

                return `
                    <button class="mode-switch-btn ${isActive ? 'active' : ''}"
                            data-mode="${mode}"
                            title="${label}"
                            aria-pressed="${isActive}">
                        <span class="mode-icon">${icon}</span>
                        <span class="mode-label">${label}</span>
                    </button>
                `;
            }).join('');

            this.container.innerHTML = `
                <div class="render-mode-switcher" role="group" aria-label="Display mode">
                    ${buttonsHtml}
                </div>
            `;

            this.attachEvents();
        }

        /**
         * Attach event listeners
         */
        attachEvents() {
            const buttons = this.container.querySelectorAll('.mode-switch-btn');

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.dataset.mode;
                    this.setMode(mode);
                });
            });
        }

        /**
         * Set current mode
         * @param {string} mode - Mode to set
         */
        setMode(mode) {
            if (mode === this.currentMode) return;

            this.currentMode = mode;

            // Update UI
            const buttons = this.container.querySelectorAll('.mode-switch-btn');
            buttons.forEach(btn => {
                const isActive = btn.dataset.mode === mode;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-pressed', isActive);
            });

            // Trigger callback
            if (this.options.onChange) {
                this.options.onChange(mode);
            }
        }

        /**
         * Get current mode
         * @returns {string} Current mode
         */
        getMode() {
            return this.currentMode;
        }
    }

    // Export to window
    if (typeof window !== 'undefined') {
        window.CorpusRenderModeSelector = CorpusRenderModeSelector;
        window.UnifiedRendererWrapper = UnifiedRendererWrapper;
        window.RenderModeSwitcher = RenderModeSwitcher;
    }

    // Export for modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CorpusRenderModeSelector,
            UnifiedRendererWrapper,
            RenderModeSwitcher
        };
    }

})();
