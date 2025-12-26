/**
 * Display Options Editor
 *
 * Visual interface for configuring how nested/related entities are displayed
 * on entity pages. Supports multiple display modes: Grid, List, Table, and Panel.
 *
 * Features:
 * - Visual layout builder with live preview
 * - Drag-and-drop grid configuration
 * - Table column selector
 * - List categorization options
 * - Per-relationship type customization
 * - Sensible defaults with full customization
 */

class DisplayOptionsEditor {
    constructor(container, initialData = null) {
        this.container = container;
        this.data = initialData || {
            displayOptions: {}
        };
        this.relationshipTypes = [
            { key: 'relatedDeities', label: 'Related Deities', icon: '⚡' },
            { key: 'relatedHeroes', label: 'Related Heroes', icon: '🗡️' },
            { key: 'relatedCreatures', label: 'Related Creatures', icon: '🐉' },
            { key: 'relatedMyths', label: 'Related Myths', icon: '📜' },
            { key: 'relatedPlaces', label: 'Related Places', icon: '🏛️' },
            { key: 'relatedItems', label: 'Related Items', icon: '⚔️' },
            { key: 'relatedTexts', label: 'Related Texts', icon: '📖' },
            { key: 'relatedConcepts', label: 'Related Concepts', icon: '💭' },
            { key: 'family', label: 'Family Relationships', icon: '👥' },
            { key: 'allies', label: 'Allies & Associates', icon: '🤝' },
            { key: 'enemies', label: 'Enemies & Rivals', icon: '⚔️' }
        ];
        this.displayModes = ['grid', 'list', 'table', 'panel'];
        this.currentEditingType = null;
        this.previewTimeout = null;
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Main render function
     */
    render() {
        this.container.innerHTML = `
            <div class="display-options-editor">
                <div class="editor-header">
                    <h3>Related Entities Display Options</h3>
                    <p class="editor-description">
                        Configure how different types of related entities will be displayed on your page.
                        Choose from grid layouts, lists, tables, or detailed panels.
                    </p>
                </div>

                <div class="relationship-type-selector">
                    <h4>Select Relationship Type to Configure</h4>
                    <div class="type-buttons">
                        ${this.renderRelationshipTypeButtons()}
                    </div>
                </div>

                <div id="display-mode-configurator" class="display-mode-configurator" style="display: none;">
                    <!-- Dynamically populated based on selected relationship type -->
                </div>

                <div class="configured-options-summary">
                    <h4>Configured Display Options</h4>
                    ${this.renderConfiguredSummary()}
                </div>

                <div class="editor-actions">
                    <button type="button" class="btn-reset-all" data-action="reset-all">
                        Reset All to Defaults
                    </button>
                    <button type="button" class="btn-preview-layout" data-action="preview">
                        Preview Layout
                    </button>
                </div>

                <div id="layout-preview-modal" class="layout-preview-modal" style="display: none;">
                    <div class="modal-overlay" data-action="close-preview"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Layout Preview</h3>
                            <button type="button" class="btn-close" data-action="close-preview">×</button>
                        </div>
                        <div class="modal-body" id="preview-container">
                            <!-- Preview rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render relationship type selection buttons
     */
    renderRelationshipTypeButtons() {
        return this.relationshipTypes.map(type => {
            const isConfigured = this.data.displayOptions[type.key];
            const activeClass = this.currentEditingType === type.key ? 'active' : '';
            const configuredClass = isConfigured ? 'configured' : '';

            return `
                <button type="button"
                        class="type-button ${activeClass} ${configuredClass}"
                        data-action="select-type"
                        data-type="${type.key}">
                    <span class="type-icon">${type.icon}</span>
                    <span class="type-label">${type.label}</span>
                    ${isConfigured ? '<span class="configured-badge">✓</span>' : ''}
                </button>
            `;
        }).join('');
    }

    /**
     * Render display mode configurator for selected relationship type
     */
    renderModeConfigurator(typeKey) {
        const currentConfig = this.data.displayOptions[typeKey] || this.getDefaultConfig();
        const typeInfo = this.relationshipTypes.find(t => t.key === typeKey);

        return `
            <div class="configurator-content">
                <div class="configurator-header">
                    <h4>${typeInfo.icon} ${typeInfo.label}</h4>
                    <button type="button"
                            class="btn-remove-config"
                            data-action="remove-config"
                            data-type="${typeKey}">
                        Remove Configuration
                    </button>
                </div>

                <div class="mode-selector">
                    <label>Display Mode:</label>
                    <div class="mode-options">
                        ${this.renderModeOptions(typeKey, currentConfig.mode)}
                    </div>
                </div>

                <div class="mode-settings">
                    ${this.renderModeSettings(typeKey, currentConfig)}
                </div>

                <div class="live-preview">
                    <h5>Live Preview</h5>
                    <div class="preview-box" id="live-preview-${typeKey}">
                        ${this.renderModePreview(currentConfig)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render mode selection options
     */
    renderModeOptions(typeKey, currentMode) {
        const modes = [
            { value: 'grid', label: 'Grid', icon: '▦', description: 'Cards in a responsive grid' },
            { value: 'list', label: 'List', icon: '≡', description: 'Vertical list with optional grouping' },
            { value: 'table', label: 'Table', icon: '⊞', description: 'Tabular data with sortable columns' },
            { value: 'panel', label: 'Panel', icon: '▭', description: 'Detailed cards with full information' }
        ];

        return modes.map(mode => `
            <div class="mode-option ${currentMode === mode.value ? 'selected' : ''}"
                 data-action="select-mode"
                 data-type="${typeKey}"
                 data-mode="${mode.value}">
                <div class="mode-icon">${mode.icon}</div>
                <div class="mode-info">
                    <div class="mode-name">${mode.label}</div>
                    <div class="mode-desc">${mode.description}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render settings for the selected mode
     */
    renderModeSettings(typeKey, config) {
        const mode = config.mode || 'grid';

        switch (mode) {
            case 'grid':
                return this.renderGridSettings(typeKey, config);
            case 'list':
                return this.renderListSettings(typeKey, config);
            case 'table':
                return this.renderTableSettings(typeKey, config);
            case 'panel':
                return this.renderPanelSettings(typeKey, config);
            default:
                return '';
        }
    }

    /**
     * Render grid mode settings
     */
    renderGridSettings(typeKey, config) {
        const columns = config.columns || 4;
        const sort = config.sort || 'name';
        const showIcons = config.showIcons !== false;
        const cardStyle = config.cardStyle || 'compact';

        return `
            <div class="settings-group grid-settings">
                <div class="setting-item">
                    <label for="grid-columns-${typeKey}">Number of Columns</label>
                    <div class="column-selector">
                        ${[1, 2, 3, 4, 6].map(num => `
                            <button type="button"
                                    class="column-btn ${columns === num ? 'active' : ''}"
                                    data-action="set-columns"
                                    data-type="${typeKey}"
                                    data-value="${num}">
                                ${num}
                            </button>
                        `).join('')}
                    </div>
                    <input type="range"
                           id="grid-columns-${typeKey}"
                           class="column-slider"
                           min="1"
                           max="6"
                           value="${columns}"
                           data-field="columns"
                           data-type="${typeKey}">
                    <small class="form-hint">Controls how many items appear per row</small>
                </div>

                <div class="setting-item">
                    <label for="grid-sort-${typeKey}">Sort By</label>
                    <select id="grid-sort-${typeKey}"
                            data-field="sort"
                            data-type="${typeKey}">
                        <option value="name" ${sort === 'name' ? 'selected' : ''}>Name (A-Z)</option>
                        <option value="name-desc" ${sort === 'name-desc' ? 'selected' : ''}>Name (Z-A)</option>
                        <option value="importance" ${sort === 'importance' ? 'selected' : ''}>Importance</option>
                        <option value="date" ${sort === 'date' ? 'selected' : ''}>Date</option>
                        <option value="custom" ${sort === 'custom' ? 'selected' : ''}>Custom Order</option>
                    </select>
                </div>

                <div class="setting-item">
                    <label for="grid-card-style-${typeKey}">Card Style</label>
                    <select id="grid-card-style-${typeKey}"
                            data-field="cardStyle"
                            data-type="${typeKey}">
                        <option value="compact" ${cardStyle === 'compact' ? 'selected' : ''}>Compact</option>
                        <option value="detailed" ${cardStyle === 'detailed' ? 'selected' : ''}>Detailed</option>
                        <option value="minimal" ${cardStyle === 'minimal' ? 'selected' : ''}>Minimal</option>
                    </select>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="grid-show-icons-${typeKey}"
                               ${showIcons ? 'checked' : ''}
                               data-field="showIcons"
                               data-type="${typeKey}">
                        Show Icons
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Render list mode settings
     */
    renderListSettings(typeKey, config) {
        const categorize = config.categorize || 'none';
        const sort = config.sort || 'name';
        const showIcons = config.showIcons !== false;
        const compact = config.compact || false;

        return `
            <div class="settings-group list-settings">
                <div class="setting-item">
                    <label for="list-categorize-${typeKey}">Group By</label>
                    <select id="list-categorize-${typeKey}"
                            data-field="categorize"
                            data-type="${typeKey}">
                        <option value="none" ${categorize === 'none' ? 'selected' : ''}>No Grouping</option>
                        <option value="by_domain" ${categorize === 'by_domain' ? 'selected' : ''}>Domain/Type</option>
                        <option value="by_mythology" ${categorize === 'by_mythology' ? 'selected' : ''}>Mythology</option>
                        <option value="by_importance" ${categorize === 'by_importance' ? 'selected' : ''}>Importance</option>
                        <option value="alphabetical" ${categorize === 'alphabetical' ? 'selected' : ''}>Alphabetical (A-D, E-H, etc.)</option>
                    </select>
                    <small class="form-hint">Organize items into categories</small>
                </div>

                <div class="setting-item">
                    <label for="list-sort-${typeKey}">Sort By</label>
                    <select id="list-sort-${typeKey}"
                            data-field="sort"
                            data-type="${typeKey}">
                        <option value="name" ${sort === 'name' ? 'selected' : ''}>Name (A-Z)</option>
                        <option value="name-desc" ${sort === 'name-desc' ? 'selected' : ''}>Name (Z-A)</option>
                        <option value="importance" ${sort === 'importance' ? 'selected' : ''}>Importance</option>
                        <option value="date" ${sort === 'date' ? 'selected' : ''}>Date</option>
                    </select>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="list-show-icons-${typeKey}"
                               ${showIcons ? 'checked' : ''}
                               data-field="showIcons"
                               data-type="${typeKey}">
                        Show Icons
                    </label>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="list-compact-${typeKey}"
                               ${compact ? 'checked' : ''}
                               data-field="compact"
                               data-type="${typeKey}">
                        Compact Mode
                    </label>
                    <small class="form-hint">Reduces spacing and shows minimal details</small>
                </div>
            </div>
        `;
    }

    /**
     * Render table mode settings
     */
    renderTableSettings(typeKey, config) {
        const columns = config.columns || ['name', 'description', 'mythology'];
        const sortable = config.sortable !== false;
        const filterable = config.filterable || false;
        const pagination = config.pagination || 'none';

        const availableColumns = [
            { value: 'name', label: 'Name' },
            { value: 'description', label: 'Description' },
            { value: 'mythology', label: 'Mythology' },
            { value: 'domain', label: 'Domain/Type' },
            { value: 'symbols', label: 'Symbols' },
            { value: 'titles', label: 'Titles' },
            { value: 'relationship', label: 'Relationship' },
            { value: 'source', label: 'Source' },
            { value: 'theme', label: 'Theme' }
        ];

        return `
            <div class="settings-group table-settings">
                <div class="setting-item">
                    <label>Columns to Display</label>
                    <div class="column-checkboxes">
                        ${availableColumns.map(col => `
                            <label class="checkbox-label column-checkbox">
                                <input type="checkbox"
                                       value="${col.value}"
                                       ${columns.includes(col.value) ? 'checked' : ''}
                                       data-field="columns"
                                       data-type="${typeKey}"
                                       data-column="${col.value}">
                                ${col.label}
                            </label>
                        `).join('')}
                    </div>
                    <small class="form-hint">Select which columns to show in the table</small>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="table-sortable-${typeKey}"
                               ${sortable ? 'checked' : ''}
                               data-field="sortable"
                               data-type="${typeKey}">
                        Enable Column Sorting
                    </label>
                    <small class="form-hint">Allow users to sort by clicking column headers</small>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="table-filterable-${typeKey}"
                               ${filterable ? 'checked' : ''}
                               data-field="filterable"
                               data-type="${typeKey}">
                        Enable Filtering
                    </label>
                    <small class="form-hint">Add search/filter controls to the table</small>
                </div>

                <div class="setting-item">
                    <label for="table-pagination-${typeKey}">Pagination</label>
                    <select id="table-pagination-${typeKey}"
                            data-field="pagination"
                            data-type="${typeKey}">
                        <option value="none" ${pagination === 'none' ? 'selected' : ''}>No Pagination</option>
                        <option value="10" ${pagination === '10' ? 'selected' : ''}>10 per page</option>
                        <option value="25" ${pagination === '25' ? 'selected' : ''}>25 per page</option>
                        <option value="50" ${pagination === '50' ? 'selected' : ''}>50 per page</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Render panel mode settings
     */
    renderPanelSettings(typeKey, config) {
        const layout = config.layout || 'stacked';
        const showAllDetails = config.showAllDetails !== false;
        const expandable = config.expandable || false;

        return `
            <div class="settings-group panel-settings">
                <div class="setting-item">
                    <label for="panel-layout-${typeKey}">Panel Layout</label>
                    <select id="panel-layout-${typeKey}"
                            data-field="layout"
                            data-type="${typeKey}">
                        <option value="stacked" ${layout === 'stacked' ? 'selected' : ''}>Stacked (vertical)</option>
                        <option value="accordion" ${layout === 'accordion' ? 'selected' : ''}>Accordion</option>
                        <option value="tabs" ${layout === 'tabs' ? 'selected' : ''}>Tabs</option>
                    </select>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="panel-show-all-${typeKey}"
                               ${showAllDetails ? 'checked' : ''}
                               data-field="showAllDetails"
                               data-type="${typeKey}">
                        Show All Details
                    </label>
                    <small class="form-hint">Display comprehensive information in each panel</small>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox"
                               id="panel-expandable-${typeKey}"
                               ${expandable ? 'checked' : ''}
                               data-field="expandable"
                               data-type="${typeKey}">
                        Make Panels Expandable
                    </label>
                    <small class="form-hint">Allow users to expand/collapse individual panels</small>
                </div>
            </div>
        `;
    }

    /**
     * Render live preview of the configured mode
     */
    renderModePreview(config) {
        const mode = config.mode || 'grid';

        // Sample data for preview
        const sampleData = [
            { name: 'Zeus', description: 'King of the gods', mythology: 'Greek', icon: '⚡' },
            { name: 'Hera', description: 'Queen of the gods', mythology: 'Greek', icon: '👑' },
            { name: 'Apollo', description: 'God of light and music', mythology: 'Greek', icon: '☀️' },
            { name: 'Artemis', description: 'Goddess of the hunt', mythology: 'Greek', icon: '🏹' }
        ];

        switch (mode) {
            case 'grid':
                return this.renderGridPreview(sampleData, config);
            case 'list':
                return this.renderListPreview(sampleData, config);
            case 'table':
                return this.renderTablePreview(sampleData, config);
            case 'panel':
                return this.renderPanelPreview(sampleData, config);
            default:
                return '<p>Select a display mode to see preview</p>';
        }
    }

    renderGridPreview(data, config) {
        const columns = config.columns || 4;
        const showIcons = config.showIcons !== false;

        return `
            <div class="preview-grid" style="grid-template-columns: repeat(${columns}, 1fr);">
                ${data.map(item => `
                    <div class="preview-card">
                        ${showIcons ? `<div class="preview-icon">${item.icon}</div>` : ''}
                        <div class="preview-name">${item.name}</div>
                        ${config.cardStyle !== 'minimal' ? `<div class="preview-desc">${item.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderListPreview(data, config) {
        const showIcons = config.showIcons !== false;
        const compact = config.compact || false;

        return `
            <div class="preview-list ${compact ? 'compact' : ''}">
                ${data.map(item => `
                    <div class="preview-list-item">
                        ${showIcons ? `<span class="preview-icon">${item.icon}</span>` : ''}
                        <span class="preview-name">${item.name}</span>
                        ${!compact ? `<span class="preview-desc">${item.description}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTablePreview(data, config) {
        const columns = config.columns || ['name', 'description', 'mythology'];

        return `
            <table class="preview-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${this.capitalize(col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${columns.map(col => `<td>${item[col] || '-'}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderPanelPreview(data, config) {
        const showAllDetails = config.showAllDetails !== false;

        return `
            <div class="preview-panels">
                ${data.slice(0, 2).map(item => `
                    <div class="preview-panel">
                        <h5>${item.icon} ${item.name}</h5>
                        <p>${item.description}</p>
                        ${showAllDetails ? `<small>Mythology: ${item.mythology}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render summary of configured options
     */
    renderConfiguredSummary() {
        const configured = Object.keys(this.data.displayOptions);

        if (configured.length === 0) {
            return '<p class="no-config">No custom display options configured. Default settings will be used.</p>';
        }

        return `
            <div class="summary-list">
                ${configured.map(key => {
                    const config = this.data.displayOptions[key];
                    const typeInfo = this.relationshipTypes.find(t => t.key === key);
                    if (!typeInfo) return '';

                    return `
                        <div class="summary-item">
                            <span class="summary-icon">${typeInfo.icon}</span>
                            <span class="summary-label">${typeInfo.label}:</span>
                            <span class="summary-mode">${this.capitalize(config.mode)}</span>
                            <span class="summary-details">${this.getConfigSummary(config)}</span>
                            <button type="button"
                                    class="btn-edit-summary"
                                    data-action="select-type"
                                    data-type="${key}">
                                Edit
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Get human-readable summary of config
     */
    getConfigSummary(config) {
        const parts = [];

        if (config.mode === 'grid' && config.columns) {
            parts.push(`${config.columns} columns`);
        }
        if (config.mode === 'list' && config.categorize && config.categorize !== 'none') {
            parts.push(`grouped ${config.categorize.replace('by_', 'by ')}`);
        }
        if (config.mode === 'table' && config.columns) {
            parts.push(`${config.columns.length} columns`);
        }
        if (config.sort && config.sort !== 'name') {
            parts.push(`sorted by ${config.sort}`);
        }

        return parts.length > 0 ? `(${parts.join(', ')})` : '';
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.container.addEventListener('click', this.handleClick.bind(this));
        this.container.addEventListener('change', this.handleChange.bind(this));
        this.container.addEventListener('input', this.handleInput.bind(this));
    }

    handleClick(e) {
        const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        const target = e.target.closest('[data-action]');

        switch (action) {
            case 'select-type':
                this.selectType(target.dataset.type);
                break;
            case 'select-mode':
                this.selectMode(target.dataset.type, target.dataset.mode);
                break;
            case 'set-columns':
                this.setColumns(target.dataset.type, parseInt(target.dataset.value));
                break;
            case 'remove-config':
                this.removeConfig(target.dataset.type);
                break;
            case 'reset-all':
                this.resetAll();
                break;
            case 'preview':
                this.showPreview();
                break;
            case 'close-preview':
                this.closePreview();
                break;
        }
    }

    handleChange(e) {
        const field = e.target.dataset.field;
        const type = e.target.dataset.type;

        if (!field || !type) return;

        if (field === 'columns' && e.target.type === 'checkbox') {
            // Table column checkboxes
            this.updateTableColumns(type, e.target.dataset.column, e.target.checked);
        } else if (e.target.type === 'checkbox') {
            this.updateField(type, field, e.target.checked);
        } else {
            this.updateField(type, field, e.target.value);
        }
    }

    handleInput(e) {
        const field = e.target.dataset.field;
        const type = e.target.dataset.type;

        if (!field || !type) return;

        if (e.target.type === 'range') {
            this.updateField(type, field, parseInt(e.target.value));
        }
    }

    /**
     * Select a relationship type to configure
     */
    selectType(typeKey) {
        this.currentEditingType = typeKey;

        // Initialize config if it doesn't exist
        if (!this.data.displayOptions[typeKey]) {
            this.data.displayOptions[typeKey] = this.getDefaultConfig();
        }

        // Update UI
        const configurator = this.container.querySelector('#display-mode-configurator');
        configurator.innerHTML = this.renderModeConfigurator(typeKey);
        configurator.style.display = 'block';

        // Update type button states
        this.container.querySelectorAll('.type-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === typeKey);
        });

        // Scroll to configurator
        configurator.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Select a display mode
     */
    selectMode(typeKey, mode) {
        if (!this.data.displayOptions[typeKey]) {
            this.data.displayOptions[typeKey] = {};
        }

        this.data.displayOptions[typeKey].mode = mode;

        // Apply mode-specific defaults
        const defaults = this.getModeDefaults(mode);
        Object.assign(this.data.displayOptions[typeKey], defaults);

        this.refreshConfigurator(typeKey);
        this.updatePreview(typeKey);
    }

    /**
     * Set grid columns
     */
    setColumns(typeKey, columns) {
        if (!this.data.displayOptions[typeKey]) {
            this.data.displayOptions[typeKey] = this.getDefaultConfig();
        }

        this.data.displayOptions[typeKey].columns = columns;
        this.refreshConfigurator(typeKey);
        this.updatePreview(typeKey);
    }

    /**
     * Update a field value
     */
    updateField(typeKey, field, value) {
        if (!this.data.displayOptions[typeKey]) {
            this.data.displayOptions[typeKey] = this.getDefaultConfig();
        }

        this.data.displayOptions[typeKey][field] = value;
        this.updatePreview(typeKey);
    }

    /**
     * Update table columns
     */
    updateTableColumns(typeKey, column, checked) {
        if (!this.data.displayOptions[typeKey]) {
            this.data.displayOptions[typeKey] = this.getDefaultConfig();
        }

        if (!this.data.displayOptions[typeKey].columns) {
            this.data.displayOptions[typeKey].columns = [];
        }

        const columns = this.data.displayOptions[typeKey].columns;

        if (checked && !columns.includes(column)) {
            columns.push(column);
        } else if (!checked) {
            const index = columns.indexOf(column);
            if (index > -1) columns.splice(index, 1);
        }

        this.updatePreview(typeKey);
    }

    /**
     * Remove configuration for a type
     */
    removeConfig(typeKey) {
        if (confirm(`Remove custom display configuration for ${this.relationshipTypes.find(t => t.key === typeKey)?.label}?`)) {
            delete this.data.displayOptions[typeKey];
            this.currentEditingType = null;
            this.render();
        }
    }

    /**
     * Reset all configurations
     */
    resetAll() {
        if (confirm('Reset all display options to defaults?')) {
            this.data.displayOptions = {};
            this.currentEditingType = null;
            this.render();
        }
    }

    /**
     * Refresh configurator panel
     */
    refreshConfigurator(typeKey) {
        const configurator = this.container.querySelector('#display-mode-configurator');
        if (configurator && this.currentEditingType === typeKey) {
            configurator.innerHTML = this.renderModeConfigurator(typeKey);
        }

        // Update summary
        const summary = this.container.querySelector('.configured-options-summary');
        if (summary) {
            summary.querySelector('h4').insertAdjacentHTML('afterend', this.renderConfiguredSummary());
            summary.querySelector('.summary-list, .no-config')?.remove();
        }
    }

    /**
     * Update live preview
     */
    updatePreview(typeKey) {
        clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => {
            const previewBox = this.container.querySelector(`#live-preview-${typeKey}`);
            if (previewBox) {
                const config = this.data.displayOptions[typeKey];
                previewBox.innerHTML = this.renderModePreview(config);
            }
        }, 300);
    }

    /**
     * Show full preview modal
     */
    showPreview() {
        const modal = this.container.querySelector('#layout-preview-modal');
        const previewContainer = this.container.querySelector('#preview-container');

        // Render all configured types
        const configured = Object.keys(this.data.displayOptions);

        if (configured.length === 0) {
            previewContainer.innerHTML = '<p>No display options configured yet.</p>';
        } else {
            previewContainer.innerHTML = configured.map(key => {
                const config = this.data.displayOptions[key];
                const typeInfo = this.relationshipTypes.find(t => t.key === key);

                return `
                    <div class="preview-section">
                        <h4>${typeInfo.icon} ${typeInfo.label}</h4>
                        <div class="preview-content">
                            ${this.renderModePreview(config)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close preview modal
     */
    closePreview() {
        const modal = this.container.querySelector('#layout-preview-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            mode: 'grid',
            columns: 4,
            sort: 'name',
            showIcons: true
        };
    }

    /**
     * Get mode-specific defaults
     */
    getModeDefaults(mode) {
        const defaults = {
            grid: { columns: 4, sort: 'name', showIcons: true, cardStyle: 'compact' },
            list: { categorize: 'none', sort: 'name', showIcons: true, compact: false },
            table: { columns: ['name', 'description', 'mythology'], sortable: true, filterable: false, pagination: 'none' },
            panel: { layout: 'stacked', showAllDetails: true, expandable: false }
        };

        return { mode, ...defaults[mode] };
    }

    /**
     * Get current data
     */
    getData() {
        return this.data;
    }

    /**
     * Set data (for loading existing configurations)
     */
    setData(data) {
        this.data = data || { displayOptions: {} };
        this.render();
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export globally
window.DisplayOptionsEditor = DisplayOptionsEditor;
