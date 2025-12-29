/**
 * Corpus Panel Renderer Component
 * Renders corpus search results as expandable panels with rich metadata display
 * Eyes of Azrael - Mythology Knowledge Base
 *
 * Features:
 * - Glass-morphism panel design
 * - Expandable/collapsible results
 * - Search term highlighting
 * - Responsive layout
 * - Full accessibility support (ARIA, keyboard nav, focus management)
 * - Dark/light mode support
 * - Integration with existing topic panel system
 */

class CorpusPanelRenderer {
    /**
     * Create a corpus panel renderer
     * @param {HTMLElement} container - Container element to render panels into
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxResults: 10,
            showContext: true,
            contextWords: 15,
            expandable: true,
            highlightTerms: true,
            showMetadata: true,
            animateExpand: true,
            groupBySource: false,
            ...options
        };

        // State management
        this.expandedPanels = new Set();
        this.focusedIndex = -1;
        this.results = [];
        this.queryInfo = null;

        // Bind methods for event listeners
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handlePanelClick = this.handlePanelClick.bind(this);
    }

    /**
     * Render results from a corpus query
     * @param {Array} results - Array of search result objects
     * @param {Object} queryInfo - Information about the query (term, source, filters)
     */
    render(results, queryInfo = {}) {
        if (!this.container) {
            console.error('[CorpusPanelRenderer] No container element provided');
            return;
        }

        this.results = results || [];
        this.queryInfo = queryInfo;

        // Clear previous content
        this.container.innerHTML = '';

        // Handle empty results
        if (!results || results.length === 0) {
            this.renderEmpty();
            return;
        }

        // Build the panel container
        const panelContainer = document.createElement('div');
        panelContainer.className = 'corpus-panel-container';
        panelContainer.setAttribute('role', 'region');
        panelContainer.setAttribute('aria-label', `Corpus search results for ${queryInfo.term || 'query'}`);

        // Add header
        panelContainer.appendChild(this.buildHeader(results, queryInfo));

        // Add results
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'corpus-panel-results-container';
        resultsContainer.setAttribute('role', 'list');
        resultsContainer.setAttribute('aria-label', 'Search results');

        // Limit results if needed
        const displayResults = results.slice(0, this.options.maxResults);

        // Group by source if enabled
        if (this.options.groupBySource) {
            const grouped = this.groupResultsBySource(displayResults);
            Object.entries(grouped).forEach(([source, sourceResults], groupIndex) => {
                const groupEl = this.buildSourceGroup(source, sourceResults, groupIndex);
                resultsContainer.appendChild(groupEl);
            });
        } else {
            displayResults.forEach((result, index) => {
                const resultEl = this.buildResultPanel(result, index, queryInfo.term);
                resultsContainer.appendChild(resultEl);
            });
        }

        panelContainer.appendChild(resultsContainer);

        // Add "Show More" button if there are more results
        if (results.length > this.options.maxResults) {
            panelContainer.appendChild(this.buildShowMoreButton(results.length));
        }

        this.container.appendChild(panelContainer);

        // Initialize keyboard navigation
        this.initializeKeyboardNav();

        // Auto-expand first panel if enabled
        if (this.options.expandable && displayResults.length > 0) {
            const firstPanel = this.container.querySelector('.corpus-result-panel');
            if (firstPanel) {
                this.expandPanel(firstPanel);
            }
        }
    }

    /**
     * Build the header section
     * @param {Array} results - Search results
     * @param {Object} queryInfo - Query information
     * @returns {HTMLElement}
     */
    buildHeader(results, queryInfo) {
        const header = document.createElement('div');
        header.className = 'corpus-panel-header';

        // Title with query info
        const titleSection = document.createElement('div');
        titleSection.className = 'corpus-panel-title-section';

        const title = document.createElement('h3');
        title.className = 'corpus-panel-title';
        title.textContent = this.formatTitle(queryInfo);
        titleSection.appendChild(title);

        // Subtitle with source info
        if (queryInfo.source) {
            const subtitle = document.createElement('p');
            subtitle.className = 'corpus-panel-subtitle';
            subtitle.textContent = `from ${queryInfo.source}`;
            titleSection.appendChild(subtitle);
        }

        header.appendChild(titleSection);

        // Result count and controls
        const controls = document.createElement('div');
        controls.className = 'corpus-panel-controls';

        const resultCount = document.createElement('span');
        resultCount.className = 'corpus-result-count';
        resultCount.setAttribute('aria-live', 'polite');
        resultCount.innerHTML = `<strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''}`;
        controls.appendChild(resultCount);

        // Expand/Collapse all button
        if (this.options.expandable && results.length > 1) {
            const expandAllBtn = document.createElement('button');
            expandAllBtn.className = 'corpus-expand-all-btn';
            expandAllBtn.setAttribute('aria-label', 'Expand all results');
            expandAllBtn.innerHTML = `
                <span class="expand-icon" aria-hidden="true"></span>
                <span class="btn-text">Expand All</span>
            `;
            expandAllBtn.addEventListener('click', () => this.toggleAllPanels(expandAllBtn));
            controls.appendChild(expandAllBtn);
        }

        header.appendChild(controls);

        return header;
    }

    /**
     * Format the panel title based on query info
     * @param {Object} queryInfo - Query information
     * @returns {string}
     */
    formatTitle(queryInfo) {
        if (queryInfo.entityName && queryInfo.source) {
            return `${queryInfo.entityName} in ${queryInfo.source}`;
        }
        if (queryInfo.term) {
            return `Results for "${queryInfo.term}"`;
        }
        return 'Corpus Search Results';
    }

    /**
     * Build a single result panel
     * @param {Object} result - Result object
     * @param {number} index - Result index
     * @param {string} searchTerm - Search term for highlighting
     * @returns {HTMLElement}
     */
    buildResultPanel(result, index, searchTerm) {
        const panel = document.createElement('div');
        panel.className = 'corpus-result-panel';
        panel.setAttribute('role', 'listitem');
        panel.setAttribute('data-index', index);
        panel.setAttribute('tabindex', '0');

        // Panel header (always visible)
        const panelHeader = document.createElement('div');
        panelHeader.className = 'corpus-result-header';
        panelHeader.setAttribute('role', 'button');
        panelHeader.setAttribute('aria-expanded', 'false');
        panelHeader.setAttribute('aria-controls', `corpus-result-content-${index}`);
        panelHeader.setAttribute('tabindex', '0');

        // Source info
        const sourceInfo = document.createElement('div');
        sourceInfo.className = 'corpus-result-source';

        const sourceIcon = document.createElement('span');
        sourceIcon.className = 'source-icon';
        sourceIcon.setAttribute('aria-hidden', 'true');
        sourceIcon.textContent = this.getSourceIcon(result.source || result.corpus);
        sourceInfo.appendChild(sourceIcon);

        const sourceText = document.createElement('span');
        sourceText.className = 'source-text';
        sourceText.textContent = result.source || result.corpus || 'Unknown Source';
        sourceInfo.appendChild(sourceText);

        if (result.book || result.chapter) {
            const sourceLocation = document.createElement('span');
            sourceLocation.className = 'source-location';
            sourceLocation.textContent = this.formatLocation(result);
            sourceInfo.appendChild(sourceLocation);
        }

        panelHeader.appendChild(sourceInfo);

        // Preview text
        const previewText = document.createElement('div');
        previewText.className = 'corpus-result-preview';
        const previewContent = this.getPreviewText(result.text || result.content, searchTerm);
        previewText.innerHTML = this.options.highlightTerms ?
            this.highlightSearchTerm(previewContent, searchTerm) :
            this.escapeHtml(previewContent);
        panelHeader.appendChild(previewText);

        // Expand indicator
        if (this.options.expandable) {
            const expandIndicator = document.createElement('span');
            expandIndicator.className = 'corpus-expand-indicator';
            expandIndicator.setAttribute('aria-hidden', 'true');
            expandIndicator.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>';
            panelHeader.appendChild(expandIndicator);
        }

        panel.appendChild(panelHeader);

        // Panel content (expandable)
        const panelContent = document.createElement('div');
        panelContent.className = 'corpus-result-content';
        panelContent.id = `corpus-result-content-${index}`;
        panelContent.setAttribute('aria-hidden', 'true');

        // Full text
        const fullText = document.createElement('div');
        fullText.className = 'corpus-result-text';
        const textContent = result.text || result.content || '';
        fullText.innerHTML = this.options.highlightTerms ?
            this.highlightSearchTerm(this.escapeHtml(textContent), searchTerm) :
            this.escapeHtml(textContent);
        panelContent.appendChild(fullText);

        // Context/metadata section
        if (this.options.showMetadata) {
            const metadata = this.buildMetadataSection(result);
            if (metadata) {
                panelContent.appendChild(metadata);
            }
        }

        // Actions
        const actions = this.buildActionsSection(result);
        panelContent.appendChild(actions);

        panel.appendChild(panelContent);

        // Event listeners
        panelHeader.addEventListener('click', (e) => this.handlePanelClick(e, panel));
        panelHeader.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.togglePanel(panel);
            }
        });

        return panel;
    }

    /**
     * Build a source group container
     * @param {string} source - Source name
     * @param {Array} results - Results for this source
     * @param {number} groupIndex - Group index
     * @returns {HTMLElement}
     */
    buildSourceGroup(source, results, groupIndex) {
        const group = document.createElement('div');
        group.className = 'corpus-source-group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', `Results from ${source}`);

        // Group header
        const groupHeader = document.createElement('div');
        groupHeader.className = 'corpus-source-group-header';
        groupHeader.innerHTML = `
            <span class="group-icon" aria-hidden="true">${this.getSourceIcon(source)}</span>
            <span class="group-title">${this.escapeHtml(source)}</span>
            <span class="group-count">${results.length} result${results.length !== 1 ? 's' : ''}</span>
        `;
        group.appendChild(groupHeader);

        // Group results
        const groupResults = document.createElement('div');
        groupResults.className = 'corpus-source-group-results';

        results.forEach((result, index) => {
            const resultEl = this.buildResultPanel(result, `${groupIndex}-${index}`, this.queryInfo?.term);
            groupResults.appendChild(resultEl);
        });

        group.appendChild(groupResults);

        return group;
    }

    /**
     * Build metadata section for a result
     * @param {Object} result - Result object
     * @returns {HTMLElement|null}
     */
    buildMetadataSection(result) {
        const metadata = [];

        if (result.citation) {
            metadata.push({ label: 'Citation', value: result.citation });
        }
        if (result.reference) {
            metadata.push({ label: 'Reference', value: result.reference });
        }
        if (result.date) {
            metadata.push({ label: 'Date', value: result.date });
        }
        if (result.author) {
            metadata.push({ label: 'Author', value: result.author });
        }
        if (result.line || result.verse) {
            metadata.push({ label: 'Line/Verse', value: result.line || result.verse });
        }
        if (result.context) {
            metadata.push({ label: 'Context', value: result.context });
        }

        if (metadata.length === 0) {
            return null;
        }

        const section = document.createElement('div');
        section.className = 'corpus-result-metadata';

        const metaGrid = document.createElement('dl');
        metaGrid.className = 'metadata-grid';

        metadata.forEach(({ label, value }) => {
            const dt = document.createElement('dt');
            dt.textContent = label;
            metaGrid.appendChild(dt);

            const dd = document.createElement('dd');
            dd.textContent = value;
            metaGrid.appendChild(dd);
        });

        section.appendChild(metaGrid);

        return section;
    }

    /**
     * Build actions section for a result
     * @param {Object} result - Result object
     * @returns {HTMLElement}
     */
    buildActionsSection(result) {
        const actions = document.createElement('div');
        actions.className = 'corpus-result-actions';

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'corpus-action-btn corpus-copy-btn';
        copyBtn.setAttribute('aria-label', 'Copy text to clipboard');
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            <span>Copy</span>
        `;
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyToClipboard(result.text || result.content, copyBtn);
        });
        actions.appendChild(copyBtn);

        // View source link
        if (result.url || result.link || result.corpusUrl) {
            const viewLink = document.createElement('a');
            viewLink.className = 'corpus-action-btn corpus-view-btn';
            viewLink.href = result.url || result.link || result.corpusUrl;
            viewLink.target = '_blank';
            viewLink.rel = 'noopener noreferrer';
            viewLink.setAttribute('aria-label', 'View full source');
            viewLink.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
                <span>View Source</span>
            `;
            actions.appendChild(viewLink);
        }

        // Cite button
        const citeBtn = document.createElement('button');
        citeBtn.className = 'corpus-action-btn corpus-cite-btn';
        citeBtn.setAttribute('aria-label', 'Generate citation');
        citeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
            <span>Cite</span>
        `;
        citeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.generateCitation(result, citeBtn);
        });
        actions.appendChild(citeBtn);

        return actions;
    }

    /**
     * Build "Show More" button
     * @param {number} totalResults - Total number of results
     * @returns {HTMLElement}
     */
    buildShowMoreButton(totalResults) {
        const remaining = totalResults - this.options.maxResults;

        const container = document.createElement('div');
        container.className = 'corpus-show-more-container';

        const button = document.createElement('button');
        button.className = 'corpus-show-more-btn';
        button.setAttribute('aria-label', `Show ${remaining} more results`);
        button.innerHTML = `
            <span>Show ${remaining} more result${remaining !== 1 ? 's' : ''}</span>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
        `;
        button.addEventListener('click', () => this.showMoreResults(button));

        container.appendChild(button);
        return container;
    }

    /**
     * Render loading state
     */
    renderLoading() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="corpus-panel-loading" role="status" aria-live="polite">
                <div class="corpus-loading-spinner" aria-hidden="true">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="corpus-loading-text">Searching corpus...</p>
                <p class="corpus-loading-subtext">Analyzing ancient texts and sources</p>
            </div>
        `;
    }

    /**
     * Render error state
     * @param {Error|string} error - Error object or message
     */
    renderError(error) {
        if (!this.container) return;

        const errorMessage = error instanceof Error ? error.message : String(error);

        this.container.innerHTML = `
            <div class="corpus-panel-error" role="alert">
                <div class="corpus-error-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </div>
                <h3 class="corpus-error-title">Search Error</h3>
                <p class="corpus-error-message">${this.escapeHtml(errorMessage)}</p>
                <button class="corpus-retry-btn" onclick="location.reload()">
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        if (!this.container) return;

        const term = this.queryInfo?.term || '';

        this.container.innerHTML = `
            <div class="corpus-panel-empty" role="status">
                <div class="corpus-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="64" height="64">
                        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                </div>
                <h3 class="corpus-empty-title">No Results Found</h3>
                <p class="corpus-empty-message">
                    ${term ? `No corpus entries found for "${this.escapeHtml(term)}"` : 'No results match your search criteria'}
                </p>
                <div class="corpus-empty-suggestions">
                    <p>Suggestions:</p>
                    <ul>
                        <li>Try different search terms</li>
                        <li>Check the spelling of your query</li>
                        <li>Use broader terms or synonyms</li>
                        <li>Search across different sources</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // ============================================
    // Panel Interaction Methods
    // ============================================

    /**
     * Handle panel click
     * @param {Event} event - Click event
     * @param {HTMLElement} panel - Panel element
     */
    handlePanelClick(event, panel) {
        if (this.options.expandable) {
            this.togglePanel(panel);
        }
    }

    /**
     * Toggle a single panel
     * @param {HTMLElement} panel - Panel to toggle
     */
    togglePanel(panel) {
        const isExpanded = panel.classList.contains('expanded');

        if (isExpanded) {
            this.collapsePanel(panel);
        } else {
            this.expandPanel(panel);
        }
    }

    /**
     * Expand a panel
     * @param {HTMLElement} panel - Panel to expand
     */
    expandPanel(panel) {
        const header = panel.querySelector('.corpus-result-header');
        const content = panel.querySelector('.corpus-result-content');
        const index = panel.getAttribute('data-index');

        panel.classList.add('expanded');
        header.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');

        // Animate expansion
        if (this.options.animateExpand) {
            content.style.maxHeight = content.scrollHeight + 'px';
        }

        this.expandedPanels.add(index);

        // Focus management
        const firstFocusable = content.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }

    /**
     * Collapse a panel
     * @param {HTMLElement} panel - Panel to collapse
     */
    collapsePanel(panel) {
        const header = panel.querySelector('.corpus-result-header');
        const content = panel.querySelector('.corpus-result-content');
        const index = panel.getAttribute('data-index');

        panel.classList.remove('expanded');
        header.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');

        if (this.options.animateExpand) {
            content.style.maxHeight = '0';
        }

        this.expandedPanels.delete(index);

        // Return focus to header
        header.focus();
    }

    /**
     * Toggle all panels
     * @param {HTMLElement} button - Toggle button
     */
    toggleAllPanels(button) {
        const panels = this.container.querySelectorAll('.corpus-result-panel');
        const allExpanded = this.expandedPanels.size === panels.length;

        panels.forEach(panel => {
            if (allExpanded) {
                this.collapsePanel(panel);
            } else {
                this.expandPanel(panel);
            }
        });

        // Update button text
        const btnText = button.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = allExpanded ? 'Expand All' : 'Collapse All';
        }
        button.setAttribute('aria-label', allExpanded ? 'Expand all results' : 'Collapse all results');
    }

    /**
     * Show more results
     * @param {HTMLElement} button - Show more button
     */
    showMoreResults(button) {
        const currentMax = this.options.maxResults;
        this.options.maxResults = currentMax + 10;

        // Re-render with new limit
        this.render(this.results, this.queryInfo);
    }

    // ============================================
    // Keyboard Navigation
    // ============================================

    /**
     * Initialize keyboard navigation
     */
    initializeKeyboardNav() {
        this.container.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        const panels = Array.from(this.container.querySelectorAll('.corpus-result-panel'));
        if (panels.length === 0) return;

        const currentPanel = document.activeElement.closest('.corpus-result-panel');
        const currentIndex = currentPanel ? panels.indexOf(currentPanel) : -1;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (currentIndex < panels.length - 1) {
                    const nextHeader = panels[currentIndex + 1].querySelector('.corpus-result-header');
                    nextHeader?.focus();
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (currentIndex > 0) {
                    const prevHeader = panels[currentIndex - 1].querySelector('.corpus-result-header');
                    prevHeader?.focus();
                }
                break;

            case 'Home':
                event.preventDefault();
                panels[0]?.querySelector('.corpus-result-header')?.focus();
                break;

            case 'End':
                event.preventDefault();
                panels[panels.length - 1]?.querySelector('.corpus-result-header')?.focus();
                break;

            case 'Escape':
                if (currentPanel && currentPanel.classList.contains('expanded')) {
                    this.collapsePanel(currentPanel);
                }
                break;
        }
    }

    // ============================================
    // Utility Methods
    // ============================================

    /**
     * Get icon for source type
     * @param {string} source - Source name
     * @returns {string}
     */
    getSourceIcon(source) {
        if (!source) return '\uD83D\uDCDC'; // scroll

        const sourceLower = source.toLowerCase();

        if (sourceLower.includes('iliad') || sourceLower.includes('odyssey')) return '\u2693'; // anchor
        if (sourceLower.includes('bible') || sourceLower.includes('testament')) return '\u271D'; // cross
        if (sourceLower.includes('veda') || sourceLower.includes('upanishad')) return '\uD83D\uDD49'; // om
        if (sourceLower.includes('quran') || sourceLower.includes('koran')) return '\u262A'; // star and crescent
        if (sourceLower.includes('edda') || sourceLower.includes('norse')) return '\u26A1'; // lightning
        if (sourceLower.includes('egypt')) return '\uD83C\uDFFA'; // amphora
        if (sourceLower.includes('sutra') || sourceLower.includes('buddha')) return '\u2638'; // dharma wheel
        if (sourceLower.includes('talmud') || sourceLower.includes('torah')) return '\u2721'; // star of david
        if (sourceLower.includes('epic') || sourceLower.includes('saga')) return '\u2694'; // crossed swords

        return '\uD83D\uDCD6'; // book
    }

    /**
     * Format location string
     * @param {Object} result - Result object
     * @returns {string}
     */
    formatLocation(result) {
        const parts = [];
        if (result.book) parts.push(`Book ${result.book}`);
        if (result.chapter) parts.push(`Ch. ${result.chapter}`);
        if (result.verse) parts.push(`v. ${result.verse}`);
        if (result.line) parts.push(`Line ${result.line}`);
        return parts.join(', ');
    }

    /**
     * Get preview text with context around search term
     * @param {string} text - Full text
     * @param {string} searchTerm - Search term
     * @returns {string}
     */
    getPreviewText(text, searchTerm) {
        if (!text) return '';
        if (!searchTerm || !this.options.showContext) {
            return text.substring(0, 150) + (text.length > 150 ? '...' : '');
        }

        const termIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase());
        if (termIndex === -1) {
            return text.substring(0, 150) + (text.length > 150 ? '...' : '');
        }

        const words = text.split(/\s+/);
        const termWordIndex = text.substring(0, termIndex).split(/\s+/).length - 1;

        const start = Math.max(0, termWordIndex - this.options.contextWords);
        const end = Math.min(words.length, termWordIndex + this.options.contextWords + 1);

        let preview = words.slice(start, end).join(' ');
        if (start > 0) preview = '...' + preview;
        if (end < words.length) preview = preview + '...';

        return preview;
    }

    /**
     * Highlight search term in text
     * @param {string} text - Text to highlight
     * @param {string} searchTerm - Term to highlight
     * @returns {string}
     */
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;

        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');

        return text.replace(regex, '<mark class="corpus-highlight">$1</mark>');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Group results by source
     * @param {Array} results - Results to group
     * @returns {Object}
     */
    groupResultsBySource(results) {
        return results.reduce((groups, result) => {
            const source = result.source || result.corpus || 'Unknown Source';
            if (!groups[source]) {
                groups[source] = [];
            }
            groups[source].push(result);
            return groups;
        }, {});
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @param {HTMLElement} button - Copy button for feedback
     */
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);

            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Copied!</span>
            `;
            button.classList.add('copied');

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('[CorpusPanelRenderer] Copy failed:', err);
        }
    }

    /**
     * Generate citation for a result
     * @param {Object} result - Result object
     * @param {HTMLElement} button - Cite button for feedback
     */
    async generateCitation(result, button) {
        const citation = this.formatCitation(result);

        try {
            await navigator.clipboard.writeText(citation);

            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Citation Copied!</span>
            `;
            button.classList.add('copied');

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('[CorpusPanelRenderer] Citation copy failed:', err);
        }
    }

    /**
     * Format citation string
     * @param {Object} result - Result object
     * @returns {string}
     */
    formatCitation(result) {
        const parts = [];

        if (result.author) {
            parts.push(result.author);
        }

        if (result.source || result.corpus) {
            parts.push(`"${result.source || result.corpus}"`);
        }

        const location = this.formatLocation(result);
        if (location) {
            parts.push(location);
        }

        if (result.date) {
            parts.push(`(${result.date})`);
        }

        return parts.join(', ') || 'Citation unavailable';
    }

    /**
     * Destroy the renderer and clean up
     */
    destroy() {
        if (this.container) {
            this.container.removeEventListener('keydown', this.handleKeyDown);
            this.container.innerHTML = '';
        }
        this.expandedPanels.clear();
        this.results = [];
        this.queryInfo = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorpusPanelRenderer;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.CorpusPanelRenderer = CorpusPanelRenderer;
}
