/**
 * Grid Panel Editor
 * Handles nested grid panels with auto-sizing and reordering
 * Structure: Root Level → Grid Panels → Sub-items (panels, links, searches, images)
 * Features: Icon picker integration, SVG panel support
 */

class GridPanelEditor {
    constructor(container, initialData = null) {
        this.container = container;
        this.data = initialData || {
            panels: [] // Root level panels (can be 'panel', 'grid', or 'svg' type)
        };
        this.selectedPanelIndex = null;
        this.iconPicker = null;
        this.svgEditor = null;
        this.currentIconTarget = null; // Track which panel is receiving an icon
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.initializeComponentIntegrations();
    }

    /**
     * Initialize integrations with IconPicker and SVGEditorModal
     */
    initializeComponentIntegrations() {
        // Check if IconPicker is available
        if (window.IconPicker) {
            this.iconPicker = window.IconPicker;
        } else {
            console.warn('IconPicker component not loaded. Icon functionality will be disabled.');
        }

        // Check if SVGEditorModal is available
        if (window.SVGEditorModal) {
            this.svgEditor = window.SVGEditorModal;
        } else {
            console.warn('SVGEditorModal component not loaded. SVG functionality will be disabled.');
        }
    }

    /**
     * Render the entire panel editor
     */
    render() {
        this.container.innerHTML = `
            <div class="grid-panel-editor">
                <div class="editor-controls">
                    <button type="button" class="btn-add-panel" data-action="add-simple-panel">
                        ➕ Add Simple Panel
                    </button>
                    <button type="button" class="btn-add-grid" data-action="add-grid-panel">
                        ⊞ Add Grid Panel
                    </button>
                    <button type="button" class="btn-add-svg" data-action="add-svg-panel" ${!this.svgEditor ? 'disabled title="SVG Editor not loaded"' : ''}>
                        🎨 Add SVG Panel
                    </button>
                </div>

                <div class="panels-root-container">
                    ${this.renderRootPanels()}
                </div>
            </div>
        `;
    }

    /**
     * Render root-level panels (sequential order)
     */
    renderRootPanels() {
        if (this.data.panels.length === 0) {
            return '<p class="editor-empty">No panels yet. Add a simple panel, grid panel, or SVG panel to start.</p>';
        }

        // Sort by order
        const sortedPanels = [...this.data.panels].sort((a, b) => a.order - b.order);

        return sortedPanels.map((panel, index) => {
            if (panel.type === 'grid') {
                return this.renderGridPanel(panel, index);
            } else if (panel.type === 'svg') {
                return this.renderSVGPanel(panel, index);
            } else {
                return this.renderSimplePanel(panel, index);
            }
        }).join('');
    }

    /**
     * Render a simple panel
     */
    renderSimplePanel(panel, index) {
        const isFirst = index === 0;
        const isLast = index === this.data.panels.length - 1;
        const titleIcon = panel.titleIcon || '';

        return `
            <div class="panel-item simple-panel" data-index="${index}" data-type="panel">
                <!-- Options bar ABOVE panel -->
                <div class="panel-options-bar">
                    <div class="panel-options-left">
                        <span class="panel-label">#${index + 1} Panel</span>
                    </div>
                    <div class="panel-options-right">
                        <button type="button"
                                class="btn-option"
                                data-action="move-up"
                                data-index="${index}"
                                ${isFirst ? 'disabled' : ''}
                                title="Move Up">↑</button>
                        <button type="button"
                                class="btn-option"
                                data-action="move-down"
                                data-index="${index}"
                                ${isLast ? 'disabled' : ''}
                                title="Move Down">↓</button>
                        <button type="button"
                                class="btn-option btn-delete"
                                data-action="delete-panel"
                                data-index="${index}"
                                title="Delete">🗑️</button>
                    </div>
                </div>

                <!-- Main panel content with title INSIDE -->
                <div class="panel-content-box">
                    <div class="panel-title-section">
                        ${titleIcon ? `<span class="panel-title-icon">${titleIcon}</span>` : ''}
                        <input type="text"
                               class="panel-title-input"
                               placeholder="Panel Title"
                               value="${this.escapeHtml(panel.title || '')}"
                               data-field="title"
                               data-index="${index}">
                        <button type="button"
                                class="btn-icon-picker"
                                data-action="pick-icon"
                                data-index="${index}"
                                ${!this.iconPicker ? 'disabled' : ''}
                                title="${titleIcon ? 'Change/Clear Icon' : 'Add Icon'}">📌</button>
                    </div>

                    <textarea class="panel-content-input"
                              placeholder="Panel content..."
                              rows="6"
                              data-field="content"
                              data-index="${index}">${this.escapeHtml(panel.content || '')}</textarea>
                </div>
            </div>
        `;
    }

    /**
     * Render a grid panel with children
     */
    renderGridPanel(panel, index) {
        const isFirst = index === 0;
        const isLast = index === this.data.panels.length - 1;
        const children = panel.children || [];
        const gridWidth = panel.gridWidth || 4;
        const titleIcon = panel.titleIcon || '';

        return `
            <div class="panel-item grid-panel" data-index="${index}" data-type="grid">
                <!-- Options bar ABOVE panel -->
                <div class="panel-options-bar">
                    <div class="panel-options-left">
                        <span class="panel-label">#${index + 1} Grid</span>
                        <button type="button" class="btn-option-add" data-action="add-child-panel" data-parent="${index}" title="Add Sub-Panel">
                            <span class="btn-icon-text">📄</span> Panel
                        </button>
                        <button type="button" class="btn-option-add" data-action="add-child-link" data-parent="${index}" title="Add Link">
                            <span class="btn-icon-text">🔗</span> Link
                        </button>
                        <button type="button" class="btn-option-add" data-action="add-child-search" data-parent="${index}" title="Add Search">
                            <span class="btn-icon-text">🔍</span> Search
                        </button>
                        <button type="button" class="btn-option-add" data-action="add-child-image" data-parent="${index}" title="Add Image">
                            <span class="btn-icon-text">🖼️</span> Image
                        </button>
                        <button type="button" class="btn-option-add" data-action="add-child-svg" data-parent="${index}" title="Add SVG" ${!this.svgEditor ? 'disabled' : ''}>
                            <span class="btn-icon-text">🎨</span> SVG
                        </button>
                    </div>
                    <div class="panel-options-right">
                        <label class="grid-columns-label">
                            Columns:
                            <input type="number"
                                   class="grid-columns-input"
                                   min="1"
                                   max="12"
                                   value="${gridWidth}"
                                   data-field="gridWidth"
                                   data-index="${index}">
                        </label>
                        <button type="button"
                                class="btn-option"
                                data-action="move-up"
                                data-index="${index}"
                                ${isFirst ? 'disabled' : ''}
                                title="Move Up">↑</button>
                        <button type="button"
                                class="btn-option"
                                data-action="move-down"
                                data-index="${index}"
                                ${isLast ? 'disabled' : ''}
                                title="Move Down">↓</button>
                        <button type="button"
                                class="btn-option btn-delete"
                                data-action="delete-panel"
                                data-index="${index}"
                                title="Delete">🗑️</button>
                    </div>
                </div>

                <!-- Main panel content with title INSIDE -->
                <div class="panel-content-box">
                    <div class="panel-title-section">
                        ${titleIcon ? `<span class="panel-title-icon">${titleIcon}</span>` : ''}
                        <input type="text"
                               class="panel-title-input"
                               placeholder="Grid Panel Title"
                               value="${this.escapeHtml(panel.title || '')}"
                               data-field="title"
                               data-index="${index}">
                        <button type="button"
                                class="btn-icon-picker"
                                data-action="pick-icon"
                                data-index="${index}"
                                ${!this.iconPicker ? 'disabled' : ''}
                                title="${titleIcon ? 'Change/Clear Icon' : 'Add Icon'}">📌</button>
                    </div>

                    <!-- Grid content -->
                    <div class="grid-children-container" data-grid-width="${gridWidth}">
                        ${children.length === 0 ? '<p class="editor-empty">No items in grid. Use buttons above to add content.</p>' :
                          this.renderGridChildren(children, index, gridWidth)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render an SVG panel
     */
    renderSVGPanel(panel, index) {
        const isFirst = index === 0;
        const isLast = index === this.data.panels.length - 1;
        const titleIcon = panel.titleIcon || '';
        const svgCode = panel.svgCode || '';
        const svgPrompt = panel.svgPrompt || '';
        const svgGeneratedBy = panel.svgGeneratedBy || '';

        return `
            <div class="panel-item svg-panel" data-index="${index}" data-type="svg">
                <!-- Slim control panel -->
                <div class="panel-controls-top">
                    <div class="panel-move-controls">
                        <button type="button"
                                class="btn-icon"
                                data-action="move-up"
                                data-index="${index}"
                                ${isFirst ? 'disabled' : ''}
                                title="Move Up">↑</button>
                        <button type="button"
                                class="btn-icon"
                                data-action="move-down"
                                data-index="${index}"
                                ${isLast ? 'disabled' : ''}
                                title="Move Down">↓</button>
                        <button type="button"
                                class="btn-icon btn-delete"
                                data-action="delete-panel"
                                data-index="${index}"
                                title="Delete">🗑️</button>
                    </div>
                </div>

                <!-- Main panel content -->
                <div class="panel-content-wrapper">
                    <div class="panel-header">
                        <span class="panel-number">#${index + 1} SVG</span>
                        ${titleIcon ? `<span class="panel-title-icon">${titleIcon}</span>` : ''}
                        <input type="text"
                               class="panel-title-input"
                               placeholder="SVG Panel Title"
                               value="${this.escapeHtml(panel.title || '')}"
                               data-field="title"
                               data-index="${index}">
                        <button type="button"
                                class="btn-icon-picker"
                                data-action="pick-icon"
                                data-index="${index}"
                                ${!this.iconPicker ? 'disabled' : ''}
                                title="${titleIcon ? 'Change/Clear Icon' : 'Add Icon'}">📌</button>
                        <button type="button"
                                class="btn-edit-svg"
                                data-action="edit-svg"
                                data-index="${index}"
                                ${!this.svgEditor ? 'disabled' : ''}
                                title="Edit SVG">🎨 Edit SVG</button>
                    </div>

                    <div class="svg-preview-container">
                        ${svgCode ? svgCode : '<p class="svg-empty-state">No SVG generated yet. Click "Edit SVG" to create one.</p>'}
                    </div>

                    ${svgPrompt ? `<p class="svg-prompt"><strong>Prompt:</strong> ${this.escapeHtml(svgPrompt)}</p>` : ''}
                    ${svgGeneratedBy ? `<p class="svg-metadata"><small>Generated by: ${this.escapeHtml(svgGeneratedBy)}</small></p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render grid children (sub-panels, links, searches, images, SVGs)
     */
    renderGridChildren(children, parentIndex, gridWidth) {
        const sortedChildren = [...children].sort((a, b) => a.order - b.order);

        return `
            <div class="grid-layout" style="grid-template-columns: repeat(${gridWidth}, 1fr);">
                ${sortedChildren.map((child, childIndex) => {
                    return this.renderGridChild(child, parentIndex, childIndex);
                }).join('')}
            </div>
        `;
    }

    /**
     * Render a single grid child item
     */
    renderGridChild(child, parentIndex, childIndex) {
        const isFirst = childIndex === 0;
        const parent = this.data.panels[parentIndex];
        const isLast = childIndex === (parent.children || []).length - 1;

        switch (child.type) {
            case 'panel':
                return this.renderGridChildPanel(child, parentIndex, childIndex, isFirst, isLast);
            case 'link':
                return this.renderGridChildLink(child, parentIndex, childIndex, isFirst, isLast);
            case 'search':
                return this.renderGridChildSearch(child, parentIndex, childIndex, isFirst, isLast);
            case 'image':
                return this.renderGridChildImage(child, parentIndex, childIndex, isFirst, isLast);
            case 'svg':
                return this.renderGridChildSVG(child, parentIndex, childIndex, isFirst, isLast);
            default:
                return '';
        }
    }

    renderGridChildPanel(child, parentIndex, childIndex, isFirst, isLast) {
        return `
            <div class="grid-item grid-item-panel" data-parent="${parentIndex}" data-child="${childIndex}">
                <!-- Options bar ABOVE child panel -->
                <div class="child-options-bar">
                    <span class="child-label">Panel</span>
                    <div class="child-options-right">
                        <button type="button" class="btn-child-option" data-action="move-left" data-parent="${parentIndex}" data-child="${childIndex}" ${isFirst ? 'disabled' : ''} title="Move Left">←</button>
                        <button type="button" class="btn-child-option" data-action="move-right" data-parent="${parentIndex}" data-child="${childIndex}" ${isLast ? 'disabled' : ''} title="Move Right">→</button>
                        <button type="button" class="btn-child-option btn-delete" data-action="delete-child" data-parent="${parentIndex}" data-child="${childIndex}" title="Delete">×</button>
                    </div>
                </div>
                <!-- Content box with title INSIDE -->
                <div class="child-content-box">
                    <input type="text"
                           class="child-title-input"
                           placeholder="Sub-Panel Title"
                           value="${this.escapeHtml(child.title || '')}"
                           data-field="title"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                    <textarea class="child-content-textarea"
                              placeholder="Content..."
                              rows="4"
                              data-field="content"
                              data-parent="${parentIndex}"
                              data-child="${childIndex}">${this.escapeHtml(child.content || '')}</textarea>
                </div>
            </div>
        `;
    }

    renderGridChildLink(child, parentIndex, childIndex, isFirst, isLast) {
        return `
            <div class="grid-item grid-item-link" data-parent="${parentIndex}" data-child="${childIndex}">
                <!-- Options bar ABOVE link -->
                <div class="child-options-bar">
                    <span class="child-label">🔗 Link</span>
                    <div class="child-options-right">
                        <button type="button" class="btn-child-option" data-action="move-left" data-parent="${parentIndex}" data-child="${childIndex}" ${isFirst ? 'disabled' : ''}>←</button>
                        <button type="button" class="btn-child-option" data-action="move-right" data-parent="${parentIndex}" data-child="${childIndex}" ${isLast ? 'disabled' : ''}>→</button>
                        <button type="button" class="btn-child-option btn-delete" data-action="delete-child" data-parent="${parentIndex}" data-child="${childIndex}">×</button>
                    </div>
                </div>
                <!-- Content box -->
                <div class="child-content-box">
                    <input type="text"
                           class="child-input"
                           placeholder="Link Text"
                           value="${this.escapeHtml(child.text || '')}"
                           data-field="text"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                    <input type="text"
                           class="child-input"
                           placeholder="URL"
                           value="${this.escapeHtml(child.url || '')}"
                           data-field="url"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                </div>
            </div>
        `;
    }

    renderGridChildSearch(child, parentIndex, childIndex, isFirst, isLast) {
        return `
            <div class="grid-item grid-item-search" data-parent="${parentIndex}" data-child="${childIndex}">
                <!-- Options bar ABOVE search -->
                <div class="child-options-bar">
                    <span class="child-label">🔍 Search</span>
                    <div class="child-options-right">
                        <button type="button" class="btn-child-option" data-action="move-left" data-parent="${parentIndex}" data-child="${childIndex}" ${isFirst ? 'disabled' : ''}>←</button>
                        <button type="button" class="btn-child-option" data-action="move-right" data-parent="${parentIndex}" data-child="${childIndex}" ${isLast ? 'disabled' : ''}>→</button>
                        <button type="button" class="btn-child-option btn-delete" data-action="delete-child" data-parent="${parentIndex}" data-child="${childIndex}">×</button>
                    </div>
                </div>
                <!-- Content box -->
                <div class="child-content-box">
                    <input type="text"
                           class="child-input"
                           placeholder="Search Term"
                           value="${this.escapeHtml(child.term || '')}"
                           data-field="term"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                    <select class="child-select"
                            data-field="searchType"
                            data-parent="${parentIndex}"
                            data-child="${childIndex}">
                        <option value="corpus" ${child.searchType === 'corpus' ? 'selected' : ''}>Corpus Search</option>
                        <option value="page" ${child.searchType === 'page' ? 'selected' : ''}>Page Search</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderGridChildImage(child, parentIndex, childIndex, isFirst, isLast) {
        return `
            <div class="grid-item grid-item-image" data-parent="${parentIndex}" data-child="${childIndex}">
                <!-- Options bar ABOVE image -->
                <div class="child-options-bar">
                    <span class="child-label">🖼️ Image</span>
                    <div class="child-options-right">
                        <button type="button" class="btn-child-option" data-action="move-left" data-parent="${parentIndex}" data-child="${childIndex}" ${isFirst ? 'disabled' : ''}>←</button>
                        <button type="button" class="btn-child-option" data-action="move-right" data-parent="${parentIndex}" data-child="${childIndex}" ${isLast ? 'disabled' : ''}>→</button>
                        <button type="button" class="btn-child-option btn-delete" data-action="delete-child" data-parent="${parentIndex}" data-child="${childIndex}">×</button>
                    </div>
                </div>
                <!-- Content box -->
                <div class="child-content-box">
                    ${child.url ? `<img src="${this.escapeHtml(child.url)}" alt="${this.escapeHtml(child.alt || '')}" class="child-image-preview">` : ''}
                    <input type="text"
                           class="child-input"
                           placeholder="Image URL"
                           value="${this.escapeHtml(child.url || '')}"
                           data-field="url"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                    <input type="text"
                           class="child-input"
                           placeholder="Caption"
                           value="${this.escapeHtml(child.caption || '')}"
                           data-field="caption"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                    <input type="text"
                           class="child-input"
                           placeholder="Alt Text"
                           value="${this.escapeHtml(child.alt || '')}"
                           data-field="alt"
                           data-parent="${parentIndex}"
                           data-child="${childIndex}">
                </div>
            </div>
        `;
    }

    renderGridChildSVG(child, parentIndex, childIndex, isFirst, isLast) {
        const svgCode = child.svgCode || '';
        const svgPrompt = child.svgPrompt || '';

        return `
            <div class="grid-item grid-item-svg" data-parent="${parentIndex}" data-child="${childIndex}">
                <!-- Options bar ABOVE SVG -->
                <div class="child-options-bar">
                    <span class="child-label">🎨 SVG</span>
                    <div class="child-options-right">
                        <button type="button" class="btn-child-option" data-action="edit-child-svg" data-parent="${parentIndex}" data-child="${childIndex}" ${!this.svgEditor ? 'disabled' : ''} title="Edit SVG">✏️</button>
                        <button type="button" class="btn-child-option" data-action="move-left" data-parent="${parentIndex}" data-child="${childIndex}" ${isFirst ? 'disabled' : ''}>←</button>
                        <button type="button" class="btn-child-option" data-action="move-right" data-parent="${parentIndex}" data-child="${childIndex}" ${isLast ? 'disabled' : ''}>→</button>
                        <button type="button" class="btn-child-option btn-delete" data-action="delete-child" data-parent="${parentIndex}" data-child="${childIndex}">×</button>
                    </div>
                </div>
                <!-- Content box -->
                <div class="child-content-box">
                    <div class="child-svg-preview">
                        ${svgCode ? svgCode : '<p class="svg-empty-state">No SVG</p>'}
                    </div>
                    ${svgPrompt ? `<p class="child-svg-prompt">${this.escapeHtml(svgPrompt)}</p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action) return;

            const index = parseInt(e.target.dataset.index);
            const parent = parseInt(e.target.dataset.parent);
            const child = parseInt(e.target.dataset.child);

            switch (action) {
                case 'add-simple-panel':
                    this.addSimplePanel();
                    break;
                case 'add-grid-panel':
                    this.addGridPanel();
                    break;
                case 'add-svg-panel':
                    this.addSVGPanel();
                    break;
                case 'move-up':
                    this.movePanelUp(index);
                    break;
                case 'move-down':
                    this.movePanelDown(index);
                    break;
                case 'delete-panel':
                    this.deletePanel(index);
                    break;
                case 'pick-icon':
                    this.pickIcon(index);
                    break;
                case 'edit-svg':
                    this.editSVG(index);
                    break;
                case 'add-child-panel':
                    this.addChildPanel(parent);
                    break;
                case 'add-child-link':
                    this.addChildLink(parent);
                    break;
                case 'add-child-search':
                    this.addChildSearch(parent);
                    break;
                case 'add-child-image':
                    this.addChildImage(parent);
                    break;
                case 'add-child-svg':
                    this.addChildSVG(parent);
                    break;
                case 'edit-child-svg':
                    this.editChildSVG(parent, child);
                    break;
                case 'move-left':
                    this.moveChildLeft(parent, child);
                    break;
                case 'move-right':
                    this.moveChildRight(parent, child);
                    break;
                case 'delete-child':
                    this.deleteChild(parent, child);
                    break;
            }
        });

        // Handle input changes
        this.container.addEventListener('input', (e) => {
            const field = e.target.dataset.field;
            if (!field) return;

            const index = parseInt(e.target.dataset.index);
            const parent = parseInt(e.target.dataset.parent);
            const child = parseInt(e.target.dataset.child);

            if (!isNaN(parent) && !isNaN(child)) {
                // Child field update
                this.updateChildField(parent, child, field, e.target.value);
            } else if (!isNaN(index)) {
                // Root panel field update
                this.updatePanelField(index, field, e.target.value);
            }
        });
    }

    /**
     * Add a simple panel
     */
    addSimplePanel() {
        const newPanel = {
            type: 'panel',
            title: '',
            content: '',
            order: this.data.panels.length,
            children: []
        };
        this.data.panels.push(newPanel);
        this.refresh();
    }

    /**
     * Add a grid panel
     */
    addGridPanel() {
        const gridWidth = prompt('Grid width (number of columns):', '4');
        if (!gridWidth || isNaN(gridWidth)) return;

        const width = parseInt(gridWidth);
        if (width < 1 || width > 12) {
            alert('Grid width must be between 1 and 12');
            return;
        }

        const newPanel = {
            type: 'grid',
            title: '',
            gridWidth: width,
            order: this.data.panels.length,
            children: []
        };
        this.data.panels.push(newPanel);
        this.refresh();
    }

    /**
     * Add an SVG panel
     */
    addSVGPanel() {
        if (!this.svgEditor) {
            alert('SVG Editor component is not loaded. Please ensure SVGEditorModal is included.');
            return;
        }

        // Create panel first, then open editor
        const newPanel = {
            type: 'svg',
            title: '',
            svgCode: '',
            svgPrompt: '',
            svgGeneratedBy: '',
            order: this.data.panels.length
        };
        this.data.panels.push(newPanel);
        const panelIndex = this.data.panels.length - 1;

        this.refresh();

        // Open SVG editor for this new panel
        setTimeout(() => this.editSVG(panelIndex), 100);
    }

    /**
     * Pick an icon for a panel
     */
    pickIcon(index) {
        if (!this.iconPicker) {
            alert('Icon Picker component is not loaded. Please ensure IconPicker is included.');
            return;
        }

        const panel = this.data.panels[index];

        // Create icon picker instance
        const picker = new window.IconPicker({
            currentIcon: panel.titleIcon || '',
            allowCustomClass: true,
            onSelect: (selectedIcon) => {
                panel.titleIcon = selectedIcon;
                this.refresh();
            }
        });

        // Show the picker
        picker.show();
    }

    /**
     * Edit SVG for a panel
     */
    editSVG(index) {
        if (!this.svgEditor) {
            alert('SVG Editor component is not loaded. Please ensure SVGEditorModal is included.');
            return;
        }

        const panel = this.data.panels[index];

        // Open SVG editor (implementation depends on SVGEditorModal API)
        // This is a placeholder - actual implementation will depend on SVGEditorModal component
        if (window.SVGEditorModal && window.SVGEditorModal.open) {
            window.SVGEditorModal.open({
                initialPrompt: panel.svgPrompt || '',
                initialSvg: panel.svgCode || '',
                onSave: (svgData) => {
                    panel.svgCode = svgData.svgCode || '';
                    panel.svgPrompt = svgData.prompt || '';
                    panel.svgGeneratedBy = svgData.generatedBy || '';
                    this.refresh();
                }
            });
        } else {
            alert('SVG Editor not properly initialized.');
        }
    }

    /**
     * Move panel up
     */
    movePanelUp(index) {
        if (index === 0) return;
        const temp = this.data.panels[index];
        this.data.panels[index] = this.data.panels[index - 1];
        this.data.panels[index - 1] = temp;
        this.reorderPanels();
        this.refresh();
    }

    /**
     * Move panel down
     */
    movePanelDown(index) {
        if (index === this.data.panels.length - 1) return;
        const temp = this.data.panels[index];
        this.data.panels[index] = this.data.panels[index + 1];
        this.data.panels[index + 1] = temp;
        this.reorderPanels();
        this.refresh();
    }

    /**
     * Delete panel
     */
    deletePanel(index) {
        if (!confirm('Delete this panel?')) return;
        this.data.panels.splice(index, 1);
        this.reorderPanels();
        this.refresh();
    }

    /**
     * Add child panel to grid
     */
    addChildPanel(parentIndex) {
        const panel = this.data.panels[parentIndex];
        if (!panel.children) panel.children = [];

        panel.children.push({
            type: 'panel',
            title: '',
            content: '',
            order: panel.children.length
        });
        this.refresh();
    }

    /**
     * Add child link to grid
     */
    addChildLink(parentIndex) {
        const panel = this.data.panels[parentIndex];
        if (!panel.children) panel.children = [];

        panel.children.push({
            type: 'link',
            text: '',
            url: '',
            order: panel.children.length
        });
        this.refresh();
    }

    /**
     * Add child search to grid
     */
    addChildSearch(parentIndex) {
        const panel = this.data.panels[parentIndex];
        if (!panel.children) panel.children = [];

        panel.children.push({
            type: 'search',
            term: '',
            searchType: 'corpus',
            order: panel.children.length
        });
        this.refresh();
    }

    /**
     * Add child image to grid
     */
    addChildImage(parentIndex) {
        const panel = this.data.panels[parentIndex];
        if (!panel.children) panel.children = [];

        panel.children.push({
            type: 'image',
            url: '',
            caption: '',
            alt: '',
            order: panel.children.length
        });
        this.refresh();
    }

    /**
     * Add child SVG to grid
     */
    addChildSVG(parentIndex) {
        if (!this.svgEditor) {
            alert('SVG Editor component is not loaded. Please ensure SVGEditorModal is included.');
            return;
        }

        const panel = this.data.panels[parentIndex];
        if (!panel.children) panel.children = [];

        const newChild = {
            type: 'svg',
            svgCode: '',
            svgPrompt: '',
            svgGeneratedBy: '',
            order: panel.children.length
        };

        panel.children.push(newChild);
        const childIndex = panel.children.length - 1;

        this.refresh();

        // Open SVG editor for this new child
        setTimeout(() => this.editChildSVG(parentIndex, childIndex), 100);
    }

    /**
     * Edit SVG for a grid child item
     */
    editChildSVG(parentIndex, childIndex) {
        if (!this.svgEditor) {
            alert('SVG Editor component is not loaded. Please ensure SVGEditorModal is included.');
            return;
        }

        const panel = this.data.panels[parentIndex];
        const child = panel.children[childIndex];

        // Open SVG editor (implementation depends on SVGEditorModal API)
        if (window.SVGEditorModal && window.SVGEditorModal.open) {
            window.SVGEditorModal.open({
                initialPrompt: child.svgPrompt || '',
                initialSvg: child.svgCode || '',
                onSave: (svgData) => {
                    child.svgCode = svgData.svgCode || '';
                    child.svgPrompt = svgData.prompt || '';
                    child.svgGeneratedBy = svgData.generatedBy || '';
                    this.refresh();
                }
            });
        } else {
            alert('SVG Editor not properly initialized.');
        }
    }

    /**
     * Move child left in grid
     */
    moveChildLeft(parentIndex, childIndex) {
        const panel = this.data.panels[parentIndex];
        if (childIndex === 0) return;

        const temp = panel.children[childIndex];
        panel.children[childIndex] = panel.children[childIndex - 1];
        panel.children[childIndex - 1] = temp;
        this.reorderChildren(parentIndex);
        this.refresh();
    }

    /**
     * Move child right in grid
     */
    moveChildRight(parentIndex, childIndex) {
        const panel = this.data.panels[parentIndex];
        if (childIndex === panel.children.length - 1) return;

        const temp = panel.children[childIndex];
        panel.children[childIndex] = panel.children[childIndex + 1];
        panel.children[childIndex + 1] = temp;
        this.reorderChildren(parentIndex);
        this.refresh();
    }

    /**
     * Delete child from grid
     */
    deleteChild(parentIndex, childIndex) {
        if (!confirm('Delete this item?')) return;
        const panel = this.data.panels[parentIndex];
        panel.children.splice(childIndex, 1);
        this.reorderChildren(parentIndex);
        this.refresh();
    }

    /**
     * Update panel field
     */
    updatePanelField(index, field, value) {
        if (field === 'gridWidth') {
            this.data.panels[index][field] = parseInt(value) || 4;
        } else {
            this.data.panels[index][field] = value;
        }
    }

    /**
     * Update child field
     */
    updateChildField(parentIndex, childIndex, field, value) {
        this.data.panels[parentIndex].children[childIndex][field] = value;
    }

    /**
     * Reorder panels to ensure sequential order values
     */
    reorderPanels() {
        this.data.panels.forEach((panel, index) => {
            panel.order = index;
        });
    }

    /**
     * Reorder children to ensure sequential order values
     */
    reorderChildren(parentIndex) {
        const panel = this.data.panels[parentIndex];
        if (panel.children) {
            panel.children.forEach((child, index) => {
                child.order = index;
            });
        }
    }

    /**
     * Refresh the editor (re-render without re-attaching listeners)
     */
    refresh() {
        this.render();
    }

    /**
     * Get current data
     */
    getData() {
        return this.data;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export globally
window.GridPanelEditor = GridPanelEditor;
