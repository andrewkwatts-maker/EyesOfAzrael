/**
 * Display Preview Component
 * Provides real-time preview of submissions in different display modes
 * Supports Grid, List, Table, and Panel views using renderer components
 */

class DisplayPreview {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            initialMode: options.initialMode || 'grid',
            onModeChange: options.onModeChange || null,
            autoUpdate: options.autoUpdate !== false,
            ...options
        };

        this.currentMode = this.options.initialMode;
        this.previewData = null;
        this.renderers = {};

        this.init();
    }

    /**
     * Initialize the preview component
     */
    init() {
        this.render();
        this.attachEventListeners();
        this.initializeRenderers();
    }

    /**
     * Initialize renderer instances
     */
    initializeRenderers() {
        // Grid renderer
        if (window.AttributeGridRenderer) {
            this.renderers.grid = window.AttributeGridRenderer;
        }

        // List renderer
        if (window.MythListRenderer) {
            this.renderers.list = window.MythListRenderer;
        }

        // Panel renderer (uses grid panel structure)
        if (window.GridPanelEditor) {
            this.renderers.panel = window.GridPanelEditor;
        }
    }

    /**
     * Render the preview interface
     */
    render() {
        this.container.innerHTML = `
            <div class="display-preview">
                <!-- Mode Switcher Tabs -->
                <div class="preview-mode-tabs">
                    <button type="button"
                            class="preview-tab ${this.currentMode === 'grid' ? 'active' : ''}"
                            data-mode="grid"
                            title="Grid View">
                        <span class="tab-icon">⊞</span>
                        <span class="tab-label">Grid</span>
                    </button>
                    <button type="button"
                            class="preview-tab ${this.currentMode === 'list' ? 'active' : ''}"
                            data-mode="list"
                            title="List View">
                        <span class="tab-icon">☰</span>
                        <span class="tab-label">List</span>
                    </button>
                    <button type="button"
                            class="preview-tab ${this.currentMode === 'table' ? 'active' : ''}"
                            data-mode="table"
                            title="Table View">
                        <span class="tab-icon">⊟</span>
                        <span class="tab-label">Table</span>
                    </button>
                    <button type="button"
                            class="preview-tab ${this.currentMode === 'panel' ? 'active' : ''}"
                            data-mode="panel"
                            title="Panel View">
                        <span class="tab-icon">📋</span>
                        <span class="tab-label">Panel</span>
                    </button>
                </div>

                <!-- Preview Content Area -->
                <div class="preview-content-wrapper">
                    <div class="preview-header">
                        <h3 class="preview-title">Live Preview</h3>
                        <div class="preview-controls">
                            <button type="button"
                                    class="btn-preview-refresh"
                                    data-action="refresh"
                                    title="Refresh Preview">
                                🔄 Refresh
                            </button>
                            <button type="button"
                                    class="btn-preview-fullscreen"
                                    data-action="fullscreen"
                                    title="Toggle Fullscreen">
                                ⛶ Fullscreen
                            </button>
                        </div>
                    </div>

                    <div class="preview-content" id="preview-render-area">
                        ${this.renderEmptyState()}
                    </div>
                </div>

                <!-- Preview Info Bar -->
                <div class="preview-info-bar">
                    <span class="preview-mode-indicator">
                        Current Mode: <strong>${this.getModeLabel(this.currentMode)}</strong>
                    </span>
                    <span class="preview-update-time" id="preview-update-time">
                        Never updated
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="preview-empty-state">
                <div class="empty-state-icon">👁️</div>
                <p class="empty-state-text">Fill in the form to see a preview</p>
                <p class="empty-state-hint">Your submission will appear here as you type</p>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.container.addEventListener('click', (e) => {
            const tab = e.target.closest('.preview-tab');
            if (tab) {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
                return;
            }

            const action = e.target.dataset.action;
            if (action === 'refresh') {
                this.refresh();
            } else if (action === 'fullscreen') {
                this.toggleFullscreen();
            }
        });
    }

    /**
     * Switch display mode
     */
    switchMode(mode) {
        if (this.currentMode === mode) return;

        this.currentMode = mode;

        // Update tabs
        this.container.querySelectorAll('.preview-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Update mode indicator
        const modeIndicator = this.container.querySelector('.preview-mode-indicator strong');
        if (modeIndicator) {
            modeIndicator.textContent = this.getModeLabel(mode);
        }

        // Re-render preview
        if (this.previewData) {
            this.updatePreview(this.previewData);
        }

        // Callback
        if (this.options.onModeChange) {
            this.options.onModeChange(mode);
        }
    }

    /**
     * Update preview with data
     */
    updatePreview(data) {
        this.previewData = data;
        const contentArea = this.container.querySelector('#preview-render-area');

        if (!data || Object.keys(data).length === 0) {
            contentArea.innerHTML = this.renderEmptyState();
            return;
        }

        try {
            let html = '';

            switch (this.currentMode) {
                case 'grid':
                    html = this.renderGridView(data);
                    break;
                case 'list':
                    html = this.renderListView(data);
                    break;
                case 'table':
                    html = this.renderTableView(data);
                    break;
                case 'panel':
                    html = this.renderPanelView(data);
                    break;
                default:
                    html = this.renderEmptyState();
            }

            contentArea.innerHTML = html;
            this.updateTimestamp();
        } catch (error) {
            console.error('Preview render error:', error);
            contentArea.innerHTML = `
                <div class="preview-error">
                    <p>Error rendering preview</p>
                    <small>${this.escapeHtml(error.message)}</small>
                </div>
            `;
        }
    }

    /**
     * Render Grid View
     */
    renderGridView(data) {
        const gridSize = data.displayOptions?.gridSize || 3;

        return `
            <div class="preview-grid-container">
                <div class="preview-grid" style="grid-template-columns: repeat(${gridSize}, 1fr);">
                    ${this.renderGridItems(data)}
                </div>
            </div>
        `;
    }

    /**
     * Render grid items
     */
    renderGridItems(data) {
        const items = [];

        // Title card
        if (data.title) {
            items.push(`
                <div class="preview-grid-item preview-item-title">
                    <h3>${this.escapeHtml(data.title)}</h3>
                    ${data.subtitle ? `<p class="item-subtitle">${this.escapeHtml(data.subtitle)}</p>` : ''}
                </div>
            `);
        }

        // Description card
        if (data.description) {
            items.push(`
                <div class="preview-grid-item preview-item-description">
                    <h4>Description</h4>
                    <p>${this.escapeHtml(data.description)}</p>
                </div>
            `);
        }

        // Metadata cards
        if (data.category) {
            items.push(`
                <div class="preview-grid-item preview-item-metadata">
                    <h4>Category</h4>
                    <p>${this.escapeHtml(data.category)}</p>
                </div>
            `);
        }

        if (data.mythology) {
            items.push(`
                <div class="preview-grid-item preview-item-metadata">
                    <h4>Mythology</h4>
                    <p>${this.escapeHtml(data.mythology)}</p>
                </div>
            `);
        }

        // Custom fields
        if (data.customFields && Array.isArray(data.customFields)) {
            data.customFields.forEach(field => {
                if (field.value) {
                    items.push(`
                        <div class="preview-grid-item preview-item-field">
                            <h4>${this.escapeHtml(field.label || field.name)}</h4>
                            <p>${this.escapeHtml(field.value)}</p>
                        </div>
                    `);
                }
            });
        }

        return items.join('') || '<p class="preview-no-content">No content to display</p>';
    }

    /**
     * Render List View
     */
    renderListView(data) {
        return `
            <div class="preview-list-container">
                ${data.title ? `<h2 class="preview-list-title">${this.escapeHtml(data.title)}</h2>` : ''}
                ${data.subtitle ? `<p class="preview-list-subtitle">${this.escapeHtml(data.subtitle)}</p>` : ''}

                <div class="preview-list-content">
                    ${this.renderListItems(data)}
                </div>
            </div>
        `;
    }

    /**
     * Render list items
     */
    renderListItems(data) {
        const items = [];

        if (data.description) {
            items.push(`
                <div class="preview-list-item">
                    <span class="list-item-label">Description:</span>
                    <span class="list-item-value">${this.escapeHtml(data.description)}</span>
                </div>
            `);
        }

        if (data.category) {
            items.push(`
                <div class="preview-list-item">
                    <span class="list-item-label">Category:</span>
                    <span class="list-item-value">${this.escapeHtml(data.category)}</span>
                </div>
            `);
        }

        if (data.mythology) {
            items.push(`
                <div class="preview-list-item">
                    <span class="list-item-label">Mythology:</span>
                    <span class="list-item-value">${this.escapeHtml(data.mythology)}</span>
                </div>
            `);
        }

        // Custom fields
        if (data.customFields && Array.isArray(data.customFields)) {
            data.customFields.forEach(field => {
                if (field.value) {
                    items.push(`
                        <div class="preview-list-item">
                            <span class="list-item-label">${this.escapeHtml(field.label || field.name)}:</span>
                            <span class="list-item-value">${this.escapeHtml(field.value)}</span>
                        </div>
                    `);
                }
            });
        }

        return items.join('') || '<p class="preview-no-content">No content to display</p>';
    }

    /**
     * Render Table View
     */
    renderTableView(data) {
        return `
            <div class="preview-table-container">
                ${data.title ? `<h2 class="preview-table-title">${this.escapeHtml(data.title)}</h2>` : ''}

                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderTableRows(data)}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render table rows
     */
    renderTableRows(data) {
        const rows = [];

        if (data.title) {
            rows.push(`
                <tr>
                    <td class="table-label">Title</td>
                    <td class="table-value">${this.escapeHtml(data.title)}</td>
                </tr>
            `);
        }

        if (data.subtitle) {
            rows.push(`
                <tr>
                    <td class="table-label">Subtitle</td>
                    <td class="table-value">${this.escapeHtml(data.subtitle)}</td>
                </tr>
            `);
        }

        if (data.description) {
            rows.push(`
                <tr>
                    <td class="table-label">Description</td>
                    <td class="table-value">${this.escapeHtml(data.description)}</td>
                </tr>
            `);
        }

        if (data.category) {
            rows.push(`
                <tr>
                    <td class="table-label">Category</td>
                    <td class="table-value">${this.escapeHtml(data.category)}</td>
                </tr>
            `);
        }

        if (data.mythology) {
            rows.push(`
                <tr>
                    <td class="table-label">Mythology</td>
                    <td class="table-value">${this.escapeHtml(data.mythology)}</td>
                </tr>
            `);
        }

        // Custom fields
        if (data.customFields && Array.isArray(data.customFields)) {
            data.customFields.forEach(field => {
                if (field.value) {
                    rows.push(`
                        <tr>
                            <td class="table-label">${this.escapeHtml(field.label || field.name)}</td>
                            <td class="table-value">${this.escapeHtml(field.value)}</td>
                        </tr>
                    `);
                }
            });
        }

        return rows.join('') || '<tr><td colspan="2" class="preview-no-content">No content to display</td></tr>';
    }

    /**
     * Render Panel View
     */
    renderPanelView(data) {
        return `
            <div class="preview-panel-container">
                <div class="preview-panel">
                    ${data.title ? `
                        <div class="panel-header">
                            <h2 class="panel-title">${this.escapeHtml(data.title)}</h2>
                            ${data.subtitle ? `<p class="panel-subtitle">${this.escapeHtml(data.subtitle)}</p>` : ''}
                        </div>
                    ` : ''}

                    <div class="panel-body">
                        ${this.renderPanelSections(data)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render panel sections
     */
    renderPanelSections(data) {
        const sections = [];

        if (data.description) {
            sections.push(`
                <div class="panel-section">
                    <h3 class="section-heading">Description</h3>
                    <p class="section-content">${this.escapeHtml(data.description)}</p>
                </div>
            `);
        }

        // Metadata section
        const metadata = [];
        if (data.category) metadata.push(`<p><strong>Category:</strong> ${this.escapeHtml(data.category)}</p>`);
        if (data.mythology) metadata.push(`<p><strong>Mythology:</strong> ${this.escapeHtml(data.mythology)}</p>`);

        if (metadata.length > 0) {
            sections.push(`
                <div class="panel-section">
                    <h3 class="section-heading">Details</h3>
                    <div class="section-content">
                        ${metadata.join('')}
                    </div>
                </div>
            `);
        }

        // Custom fields section
        if (data.customFields && Array.isArray(data.customFields) && data.customFields.length > 0) {
            const hasValues = data.customFields.some(f => f.value);
            if (hasValues) {
                sections.push(`
                    <div class="panel-section">
                        <h3 class="section-heading">Additional Information</h3>
                        <div class="section-content">
                            ${data.customFields.filter(f => f.value).map(field => `
                                <p><strong>${this.escapeHtml(field.label || field.name)}:</strong> ${this.escapeHtml(field.value)}</p>
                            `).join('')}
                        </div>
                    </div>
                `);
            }
        }

        return sections.join('') || '<p class="preview-no-content">No content to display</p>';
    }

    /**
     * Refresh preview
     */
    refresh() {
        if (this.previewData) {
            this.updatePreview(this.previewData);
        }
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        const wrapper = this.container.querySelector('.preview-content-wrapper');
        if (!wrapper) return;

        if (!wrapper.classList.contains('fullscreen')) {
            wrapper.classList.add('fullscreen');
            const btn = this.container.querySelector('.btn-preview-fullscreen');
            if (btn) btn.textContent = '⛶ Exit Fullscreen';
        } else {
            wrapper.classList.remove('fullscreen');
            const btn = this.container.querySelector('.btn-preview-fullscreen');
            if (btn) btn.textContent = '⛶ Fullscreen';
        }
    }

    /**
     * Update timestamp
     */
    updateTimestamp() {
        const timeEl = this.container.querySelector('#preview-update-time');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Get mode label
     */
    getModeLabel(mode) {
        const labels = {
            grid: 'Grid View',
            list: 'List View',
            table: 'Table View',
            panel: 'Panel View'
        };
        return labels[mode] || mode;
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Set data programmatically
     */
    setData(data) {
        this.updatePreview(data);
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
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
        this.previewData = null;
        this.renderers = {};
    }
}

// Export globally
window.DisplayPreview = DisplayPreview;
