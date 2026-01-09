/**
 * SVG Editor Component
 * Eyes of Azrael Project
 *
 * A visual SVG editor with:
 * - Color picker for customization
 * - Path manipulation tools
 * - Preview in different themes
 * - Code editing with syntax highlighting
 * - Import/Export functionality
 */

class SVGEditor {
    constructor(options = {}) {
        this.containerSelector = options.container || '#svg-editor';
        this.container = null;
        this.currentSvg = options.initialSvg || '';
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.previewTheme = 'night';
        this.zoom = 100;
        this.gridEnabled = true;

        // Theme definitions for preview
        this.themes = {
            night: { bg: '#0a0e27', fg: '#e0e0e0', accent: '#8b7fff' },
            cosmic: { bg: '#0f0a1e', fg: '#e0e0e0', accent: '#ec4899' },
            sacred: { bg: '#140f0a', fg: '#e0e0e0', accent: '#f59e0b' },
            golden: { bg: '#19140a', fg: '#e0e0e0', accent: '#fbbf24' },
            ocean: { bg: '#050f19', fg: '#e0e0e0', accent: '#06b6d4' },
            fire: { bg: '#140505', fg: '#e0e0e0', accent: '#ef4444' },
            nature: { bg: '#0a140a', fg: '#e0e0e0', accent: '#22c55e' },
            light: { bg: '#ffffff', fg: '#1a1a2e', accent: '#8b7fff' }
        };

        // Color palettes for quick selection
        this.colorPalettes = {
            mythological: [
                '#8b7fff', '#667eea', '#a78bfa', // Purple/Violet
                '#f59e0b', '#fbbf24', '#d97706', // Gold/Amber
                '#dc2626', '#ef4444', '#f97316', // Red/Orange
                '#22c55e', '#16a34a', '#059669', // Green
                '#06b6d4', '#0891b2', '#0ea5e9', // Cyan/Blue
                '#ec4899', '#f472b6', '#8b5cf6'  // Pink/Purple
            ],
            metals: [
                '#ffd700', '#daa520', '#c0c0c0', // Gold, Golden, Silver
                '#cd7f32', '#b87333', '#8b4513', // Bronze, Copper, Brown
                '#1a1a2e', '#2d2d44', '#4a4a5e'  // Dark metallics
            ],
            elements: [
                '#ef4444', '#f97316', '#fbbf24', // Fire
                '#06b6d4', '#0ea5e9', '#3b82f6', // Water
                '#22c55e', '#84cc16', '#65a30d', // Earth/Nature
                '#e0e7ff', '#c7d2fe', '#a5b4fc', // Air
                '#8b5cf6', '#7c3aed', '#6366f1'  // Aether/Spirit
            ]
        };

        this.init();
    }

    /**
     * Initialize the editor
     */
    init() {
        this.container = document.querySelector(this.containerSelector);
        if (!this.container) {
            console.error('SVGEditor: Container not found:', this.containerSelector);
            return;
        }

        this.render();
        this.attachEventListeners();

        if (this.currentSvg) {
            this.loadSVG(this.currentSvg);
        }
    }

    /**
     * Render the editor
     */
    render() {
        this.container.innerHTML = `
            <div class="svge-editor">
                <!-- Toolbar -->
                <div class="svge-toolbar">
                    <div class="svge-toolbar-group">
                        <button class="svge-tool-btn" data-action="undo" title="Undo (Ctrl+Z)" disabled>
                            <span class="svge-icon">&#x21B6;</span>
                        </button>
                        <button class="svge-tool-btn" data-action="redo" title="Redo (Ctrl+Y)" disabled>
                            <span class="svge-icon">&#x21B7;</span>
                        </button>
                    </div>

                    <div class="svge-toolbar-separator"></div>

                    <div class="svge-toolbar-group">
                        <button class="svge-tool-btn active" data-action="select" title="Select Tool (V)">
                            <span class="svge-icon">&#x25A1;</span>
                        </button>
                        <button class="svge-tool-btn" data-action="move" title="Move Tool (M)">
                            <span class="svge-icon">&#x2725;</span>
                        </button>
                        <button class="svge-tool-btn" data-action="scale" title="Scale Tool (S)">
                            <span class="svge-icon">&#x2922;</span>
                        </button>
                    </div>

                    <div class="svge-toolbar-separator"></div>

                    <div class="svge-toolbar-group">
                        <label class="svge-toolbar-label">Fill:</label>
                        <input type="color" class="svge-color-input" id="svge-fill-color" value="#8b7fff" title="Fill Color">
                        <button class="svge-tool-btn svge-tool-btn-sm" data-action="no-fill" title="No Fill">
                            <span class="svge-icon">&#x2298;</span>
                        </button>
                    </div>

                    <div class="svge-toolbar-group">
                        <label class="svge-toolbar-label">Stroke:</label>
                        <input type="color" class="svge-color-input" id="svge-stroke-color" value="#667eea" title="Stroke Color">
                        <input type="number" class="svge-number-input" id="svge-stroke-width" value="2" min="0" max="20" step="0.5" title="Stroke Width">
                    </div>

                    <div class="svge-toolbar-separator"></div>

                    <div class="svge-toolbar-group">
                        <select class="svge-select" id="svge-theme-select" title="Preview Theme">
                            <option value="night">Night Theme</option>
                            <option value="cosmic">Cosmic Theme</option>
                            <option value="sacred">Sacred Theme</option>
                            <option value="golden">Golden Theme</option>
                            <option value="ocean">Ocean Theme</option>
                            <option value="fire">Fire Theme</option>
                            <option value="nature">Nature Theme</option>
                            <option value="light">Light Theme</option>
                        </select>
                    </div>

                    <div class="svge-toolbar-group">
                        <button class="svge-tool-btn" data-action="zoom-out" title="Zoom Out">-</button>
                        <span class="svge-zoom-display" id="svge-zoom-display">100%</span>
                        <button class="svge-tool-btn" data-action="zoom-in" title="Zoom In">+</button>
                        <button class="svge-tool-btn" data-action="zoom-reset" title="Reset Zoom">&#x25CE;</button>
                    </div>

                    <div class="svge-toolbar-group svge-toolbar-right">
                        <button class="svge-tool-btn" data-action="toggle-grid" title="Toggle Grid">
                            <span class="svge-icon">&#x25A6;</span>
                        </button>
                        <button class="svge-tool-btn" data-action="toggle-code" title="Toggle Code View">
                            <span class="svge-icon">&lt;/&gt;</span>
                        </button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="svge-main">
                    <!-- Canvas Area -->
                    <div class="svge-canvas-container">
                        <div class="svge-canvas-wrapper" id="svge-canvas-wrapper">
                            <div class="svge-canvas-grid" id="svge-canvas-grid"></div>
                            <div class="svge-canvas" id="svge-canvas">
                                <!-- SVG will be rendered here -->
                            </div>
                            <div class="svge-selection-box" id="svge-selection-box" style="display: none;"></div>
                        </div>
                    </div>

                    <!-- Right Panel -->
                    <div class="svge-panel">
                        <!-- Properties Panel -->
                        <div class="svge-panel-section">
                            <div class="svge-panel-header">
                                <span>Properties</span>
                                <button class="svge-panel-toggle">-</button>
                            </div>
                            <div class="svge-panel-content" id="svge-properties-panel">
                                <p class="svge-panel-empty">Select an element to edit its properties</p>
                            </div>
                        </div>

                        <!-- Elements Panel -->
                        <div class="svge-panel-section">
                            <div class="svge-panel-header">
                                <span>Elements</span>
                                <button class="svge-panel-toggle">-</button>
                            </div>
                            <div class="svge-panel-content" id="svge-elements-panel">
                                <p class="svge-panel-empty">No SVG loaded</p>
                            </div>
                        </div>

                        <!-- Color Palette Panel -->
                        <div class="svge-panel-section">
                            <div class="svge-panel-header">
                                <span>Color Palette</span>
                                <button class="svge-panel-toggle">-</button>
                            </div>
                            <div class="svge-panel-content">
                                <div class="svge-palette-tabs">
                                    <button class="svge-palette-tab active" data-palette="mythological">Mythological</button>
                                    <button class="svge-palette-tab" data-palette="metals">Metals</button>
                                    <button class="svge-palette-tab" data-palette="elements">Elements</button>
                                </div>
                                <div class="svge-palette-grid" id="svge-palette-grid">
                                    ${this.renderPalette('mythological')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Code Panel (Hidden by default) -->
                <div class="svge-code-panel" id="svge-code-panel" style="display: none;">
                    <div class="svge-code-header">
                        <span>SVG Code</span>
                        <div class="svge-code-actions">
                            <button class="svge-btn svge-btn-sm" data-action="format-code">Format</button>
                            <button class="svge-btn svge-btn-sm" data-action="copy-code">Copy</button>
                            <button class="svge-btn svge-btn-sm" data-action="apply-code">Apply</button>
                        </div>
                    </div>
                    <textarea class="svge-code-editor" id="svge-code-editor" spellcheck="false"></textarea>
                </div>

                <!-- Bottom Bar -->
                <div class="svge-bottom-bar">
                    <div class="svge-status">
                        <span id="svge-status-text">Ready</span>
                    </div>
                    <div class="svge-dimensions">
                        <span id="svge-dimensions-text">ViewBox: 0 0 100 100</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render color palette
     */
    renderPalette(paletteName) {
        const colors = this.colorPalettes[paletteName] || this.colorPalettes.mythological;
        return colors.map(color => `
            <button class="svge-palette-color" data-color="${color}" style="background-color: ${color};" title="${color}"></button>
        `).join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toolbar buttons
        this.container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAction(e.target.closest('[data-action]').dataset.action));
        });

        // Color inputs
        const fillColor = this.container.querySelector('#svge-fill-color');
        const strokeColor = this.container.querySelector('#svge-stroke-color');
        const strokeWidth = this.container.querySelector('#svge-stroke-width');

        if (fillColor) fillColor.addEventListener('input', (e) => this.applyFillColor(e.target.value));
        if (strokeColor) strokeColor.addEventListener('input', (e) => this.applyStrokeColor(e.target.value));
        if (strokeWidth) strokeWidth.addEventListener('input', (e) => this.applyStrokeWidth(e.target.value));

        // Theme select
        const themeSelect = this.container.querySelector('#svge-theme-select');
        if (themeSelect) themeSelect.addEventListener('change', (e) => this.setPreviewTheme(e.target.value));

        // Palette tabs
        this.container.querySelectorAll('.svge-palette-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.container.querySelectorAll('.svge-palette-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const paletteGrid = this.container.querySelector('#svge-palette-grid');
                if (paletteGrid) {
                    paletteGrid.innerHTML = this.renderPalette(e.target.dataset.palette);
                    this.attachPaletteListeners();
                }
            });
        });

        // Palette colors
        this.attachPaletteListeners();

        // Panel toggles
        this.container.querySelectorAll('.svge-panel-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const content = e.target.closest('.svge-panel-section').querySelector('.svge-panel-content');
                if (content) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    e.target.textContent = content.style.display === 'none' ? '+' : '-';
                }
            });
        });

        // Canvas click for selection
        const canvas = this.container.querySelector('#svge-canvas');
        if (canvas) {
            canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        }

        // Code editor
        const codeEditor = this.container.querySelector('#svge-code-editor');
        if (codeEditor) {
            codeEditor.addEventListener('input', () => {
                this.setStatus('Code modified - click Apply to update');
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Attach palette color listeners
     */
    attachPaletteListeners() {
        this.container.querySelectorAll('.svge-palette-color').forEach(colorBtn => {
            colorBtn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.applyFillColor(color);
                // Update color input
                const fillInput = this.container.querySelector('#svge-fill-color');
                if (fillInput) fillInput.value = color;
            });
        });
    }

    /**
     * Handle toolbar actions
     */
    handleAction(action) {
        switch (action) {
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'select':
            case 'move':
            case 'scale':
                this.setTool(action);
                break;
            case 'no-fill':
                this.applyFillColor('none');
                break;
            case 'zoom-in':
                this.setZoom(this.zoom + 10);
                break;
            case 'zoom-out':
                this.setZoom(this.zoom - 10);
                break;
            case 'zoom-reset':
                this.setZoom(100);
                break;
            case 'toggle-grid':
                this.toggleGrid();
                break;
            case 'toggle-code':
                this.toggleCodePanel();
                break;
            case 'format-code':
                this.formatCode();
                break;
            case 'copy-code':
                this.copyCode();
                break;
            case 'apply-code':
                this.applyCode();
                break;
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        if (!this.container.contains(document.activeElement) && document.activeElement.tagName !== 'BODY') {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    if (this.selectedElement) {
                        // Copy element - handled by browser
                    }
                    break;
            }
        } else {
            switch (e.key.toLowerCase()) {
                case 'v':
                    this.setTool('select');
                    break;
                case 'm':
                    this.setTool('move');
                    break;
                case 's':
                    this.setTool('scale');
                    break;
                case 'delete':
                case 'backspace':
                    if (this.selectedElement) {
                        this.deleteSelectedElement();
                    }
                    break;
            }
        }
    }

    /**
     * Load SVG into editor
     */
    loadSVG(svgCode) {
        this.currentSvg = svgCode;
        this.addToHistory(svgCode);
        this.renderSVG();
        this.updateElementsPanel();
        this.updateCodeEditor();
        this.updateDimensions();
    }

    /**
     * Render SVG to canvas
     */
    renderSVG() {
        const canvas = this.container.querySelector('#svge-canvas');
        if (!canvas) return;

        if (!this.currentSvg) {
            canvas.innerHTML = '<p class="svge-canvas-empty">Paste or load an SVG to edit</p>';
            return;
        }

        // Parse and sanitize SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.currentSvg, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        if (!svg || doc.querySelector('parsererror')) {
            canvas.innerHTML = '<p class="svge-canvas-error">Invalid SVG code</p>';
            return;
        }

        // Apply theme background
        const theme = this.themes[this.previewTheme];
        const wrapper = this.container.querySelector('#svge-canvas-wrapper');
        if (wrapper) {
            wrapper.style.backgroundColor = theme.bg;
        }

        // Make elements selectable
        svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline, line, text, g').forEach((el, idx) => {
            el.setAttribute('data-svge-id', `el-${idx}`);
            el.style.cursor = 'pointer';
        });

        canvas.innerHTML = '';
        canvas.appendChild(svg);

        // Apply zoom
        this.applyZoom();
    }

    /**
     * Handle canvas click for element selection
     */
    handleCanvasClick(e) {
        const target = e.target.closest('[data-svge-id]');

        // Deselect previous
        if (this.selectedElement) {
            this.selectedElement.classList.remove('svge-selected');
        }

        if (target) {
            this.selectedElement = target;
            target.classList.add('svge-selected');
            this.showElementProperties(target);
            this.highlightInElementsList(target.dataset.svgeId);
        } else {
            this.selectedElement = null;
            this.clearPropertiesPanel();
        }
    }

    /**
     * Show element properties in panel
     */
    showElementProperties(element) {
        const panel = this.container.querySelector('#svge-properties-panel');
        if (!panel) return;

        const tagName = element.tagName.toLowerCase();
        const fill = element.getAttribute('fill') || 'none';
        const stroke = element.getAttribute('stroke') || 'none';
        const strokeWidth = element.getAttribute('stroke-width') || '1';
        const opacity = element.getAttribute('opacity') || '1';
        const fillOpacity = element.getAttribute('fill-opacity') || '1';
        const strokeOpacity = element.getAttribute('stroke-opacity') || '1';

        let specificProps = '';

        switch (tagName) {
            case 'circle':
                specificProps = `
                    <div class="svge-prop-row">
                        <label>CX:</label>
                        <input type="number" class="svge-prop-input" data-attr="cx" value="${element.getAttribute('cx') || 0}">
                    </div>
                    <div class="svge-prop-row">
                        <label>CY:</label>
                        <input type="number" class="svge-prop-input" data-attr="cy" value="${element.getAttribute('cy') || 0}">
                    </div>
                    <div class="svge-prop-row">
                        <label>Radius:</label>
                        <input type="number" class="svge-prop-input" data-attr="r" value="${element.getAttribute('r') || 0}">
                    </div>
                `;
                break;
            case 'rect':
                specificProps = `
                    <div class="svge-prop-row">
                        <label>X:</label>
                        <input type="number" class="svge-prop-input" data-attr="x" value="${element.getAttribute('x') || 0}">
                    </div>
                    <div class="svge-prop-row">
                        <label>Y:</label>
                        <input type="number" class="svge-prop-input" data-attr="y" value="${element.getAttribute('y') || 0}">
                    </div>
                    <div class="svge-prop-row">
                        <label>Width:</label>
                        <input type="number" class="svge-prop-input" data-attr="width" value="${element.getAttribute('width') || 0}">
                    </div>
                    <div class="svge-prop-row">
                        <label>Height:</label>
                        <input type="number" class="svge-prop-input" data-attr="height" value="${element.getAttribute('height') || 0}">
                    </div>
                    <div class="svge-prop-row">
                        <label>Rx:</label>
                        <input type="number" class="svge-prop-input" data-attr="rx" value="${element.getAttribute('rx') || 0}">
                    </div>
                `;
                break;
            case 'path':
                specificProps = `
                    <div class="svge-prop-row svge-prop-full">
                        <label>Path Data:</label>
                        <textarea class="svge-prop-textarea" data-attr="d">${element.getAttribute('d') || ''}</textarea>
                    </div>
                `;
                break;
        }

        panel.innerHTML = `
            <div class="svge-properties">
                <div class="svge-prop-header">
                    <span class="svge-prop-tag">&lt;${tagName}&gt;</span>
                    <button class="svge-btn svge-btn-danger svge-btn-sm" data-action="delete-element">Delete</button>
                </div>

                <div class="svge-prop-section">
                    <div class="svge-prop-section-title">Fill & Stroke</div>
                    <div class="svge-prop-row">
                        <label>Fill:</label>
                        <input type="color" class="svge-prop-color" id="svge-prop-fill" value="${fill !== 'none' ? fill : '#000000'}">
                        <button class="svge-btn svge-btn-sm ${fill === 'none' ? 'active' : ''}" data-action="toggle-fill">
                            ${fill === 'none' ? 'No Fill' : 'Fill'}
                        </button>
                    </div>
                    <div class="svge-prop-row">
                        <label>Stroke:</label>
                        <input type="color" class="svge-prop-color" id="svge-prop-stroke" value="${stroke !== 'none' ? stroke : '#000000'}">
                        <input type="number" class="svge-prop-input svge-prop-input-sm" id="svge-prop-stroke-width" value="${strokeWidth}" min="0" max="20" step="0.5">
                    </div>
                </div>

                <div class="svge-prop-section">
                    <div class="svge-prop-section-title">Opacity</div>
                    <div class="svge-prop-row">
                        <label>Overall:</label>
                        <input type="range" class="svge-prop-range" data-attr="opacity" value="${parseFloat(opacity) * 100}" min="0" max="100">
                        <span class="svge-prop-value">${Math.round(parseFloat(opacity) * 100)}%</span>
                    </div>
                    <div class="svge-prop-row">
                        <label>Fill:</label>
                        <input type="range" class="svge-prop-range" data-attr="fill-opacity" value="${parseFloat(fillOpacity) * 100}" min="0" max="100">
                        <span class="svge-prop-value">${Math.round(parseFloat(fillOpacity) * 100)}%</span>
                    </div>
                    <div class="svge-prop-row">
                        <label>Stroke:</label>
                        <input type="range" class="svge-prop-range" data-attr="stroke-opacity" value="${parseFloat(strokeOpacity) * 100}" min="0" max="100">
                        <span class="svge-prop-value">${Math.round(parseFloat(strokeOpacity) * 100)}%</span>
                    </div>
                </div>

                ${specificProps ? `
                    <div class="svge-prop-section">
                        <div class="svge-prop-section-title">Geometry</div>
                        ${specificProps}
                    </div>
                ` : ''}

                <div class="svge-prop-section">
                    <div class="svge-prop-section-title">Transform</div>
                    <div class="svge-prop-row">
                        <label>Rotate:</label>
                        <input type="number" class="svge-prop-input" id="svge-prop-rotate" value="0" min="-360" max="360">
                        <span>deg</span>
                    </div>
                    <div class="svge-prop-row">
                        <label>Scale:</label>
                        <input type="number" class="svge-prop-input" id="svge-prop-scale" value="100" min="1" max="500" step="5">
                        <span>%</span>
                    </div>
                </div>
            </div>
        `;

        // Attach property change listeners
        this.attachPropertyListeners();
    }

    /**
     * Attach property panel listeners
     */
    attachPropertyListeners() {
        const panel = this.container.querySelector('#svge-properties-panel');
        if (!panel) return;

        // Delete button
        panel.querySelector('[data-action="delete-element"]')?.addEventListener('click', () => {
            this.deleteSelectedElement();
        });

        // Fill color
        panel.querySelector('#svge-prop-fill')?.addEventListener('input', (e) => {
            this.applyFillColor(e.target.value);
        });

        // Stroke color
        panel.querySelector('#svge-prop-stroke')?.addEventListener('input', (e) => {
            this.applyStrokeColor(e.target.value);
        });

        // Stroke width
        panel.querySelector('#svge-prop-stroke-width')?.addEventListener('input', (e) => {
            this.applyStrokeWidth(e.target.value);
        });

        // Toggle fill
        panel.querySelector('[data-action="toggle-fill"]')?.addEventListener('click', (e) => {
            const btn = e.target;
            if (btn.textContent.trim() === 'No Fill') {
                // Restore fill
                this.applyFillColor(panel.querySelector('#svge-prop-fill')?.value || '#8b7fff');
                btn.textContent = 'Fill';
                btn.classList.remove('active');
            } else {
                // Remove fill
                this.applyFillColor('none');
                btn.textContent = 'No Fill';
                btn.classList.add('active');
            }
        });

        // Opacity sliders
        panel.querySelectorAll('.svge-prop-range').forEach(range => {
            range.addEventListener('input', (e) => {
                const attr = e.target.dataset.attr;
                const value = parseFloat(e.target.value) / 100;
                this.applyAttribute(attr, value);
                e.target.nextElementSibling.textContent = `${Math.round(e.target.value)}%`;
            });
        });

        // Geometry inputs
        panel.querySelectorAll('.svge-prop-input[data-attr]').forEach(input => {
            input.addEventListener('input', (e) => {
                const attr = e.target.dataset.attr;
                this.applyAttribute(attr, e.target.value);
            });
        });

        // Path data textarea
        panel.querySelector('.svge-prop-textarea[data-attr="d"]')?.addEventListener('input', (e) => {
            this.applyAttribute('d', e.target.value);
        });

        // Rotate
        panel.querySelector('#svge-prop-rotate')?.addEventListener('input', (e) => {
            this.applyRotation(parseFloat(e.target.value));
        });

        // Scale
        panel.querySelector('#svge-prop-scale')?.addEventListener('input', (e) => {
            this.applyScale(parseFloat(e.target.value) / 100);
        });
    }

    /**
     * Clear properties panel
     */
    clearPropertiesPanel() {
        const panel = this.container.querySelector('#svge-properties-panel');
        if (panel) {
            panel.innerHTML = '<p class="svge-panel-empty">Select an element to edit its properties</p>';
        }
    }

    /**
     * Update elements panel
     */
    updateElementsPanel() {
        const panel = this.container.querySelector('#svge-elements-panel');
        if (!panel) return;

        const canvas = this.container.querySelector('#svge-canvas svg');
        if (!canvas) {
            panel.innerHTML = '<p class="svge-panel-empty">No SVG loaded</p>';
            return;
        }

        const elements = canvas.querySelectorAll('[data-svge-id]');
        if (elements.length === 0) {
            panel.innerHTML = '<p class="svge-panel-empty">No elements found</p>';
            return;
        }

        panel.innerHTML = `
            <div class="svge-elements-list">
                ${Array.from(elements).map(el => `
                    <div class="svge-element-item" data-target="${el.dataset.svgeId}">
                        <span class="svge-element-icon">${this.getElementIcon(el.tagName.toLowerCase())}</span>
                        <span class="svge-element-name">${el.tagName.toLowerCase()}</span>
                        <button class="svge-element-visibility" title="Toggle Visibility">&#128065;</button>
                    </div>
                `).join('')}
            </div>
        `;

        // Attach click listeners
        panel.querySelectorAll('.svge-element-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('svge-element-visibility')) {
                    this.toggleElementVisibility(item.dataset.target);
                } else {
                    this.selectElementById(item.dataset.target);
                }
            });
        });
    }

    /**
     * Get icon for element type
     */
    getElementIcon(tagName) {
        const icons = {
            'path': '&#9998;',
            'circle': '&#9679;',
            'rect': '&#9632;',
            'ellipse': '&#11044;',
            'polygon': '&#9670;',
            'polyline': '&#8212;',
            'line': '&#8212;',
            'text': 'T',
            'g': '&#128193;'
        };
        return icons[tagName] || '&#9632;';
    }

    /**
     * Select element by ID
     */
    selectElementById(id) {
        const canvas = this.container.querySelector('#svge-canvas');
        const element = canvas?.querySelector(`[data-svge-id="${id}"]`);

        if (element) {
            // Deselect previous
            if (this.selectedElement) {
                this.selectedElement.classList.remove('svge-selected');
            }

            this.selectedElement = element;
            element.classList.add('svge-selected');
            this.showElementProperties(element);
            this.highlightInElementsList(id);
        }
    }

    /**
     * Highlight element in elements list
     */
    highlightInElementsList(id) {
        this.container.querySelectorAll('.svge-element-item').forEach(item => {
            item.classList.toggle('active', item.dataset.target === id);
        });
    }

    /**
     * Toggle element visibility
     */
    toggleElementVisibility(id) {
        const canvas = this.container.querySelector('#svge-canvas');
        const element = canvas?.querySelector(`[data-svge-id="${id}"]`);

        if (element) {
            const currentDisplay = element.style.display;
            element.style.display = currentDisplay === 'none' ? '' : 'none';
            this.updateSVGCode();
        }
    }

    /**
     * Apply fill color to selected element
     */
    applyFillColor(color) {
        if (!this.selectedElement) return;

        this.saveState();
        this.selectedElement.setAttribute('fill', color);
        this.updateSVGCode();
    }

    /**
     * Apply stroke color to selected element
     */
    applyStrokeColor(color) {
        if (!this.selectedElement) return;

        this.saveState();
        this.selectedElement.setAttribute('stroke', color);
        this.updateSVGCode();
    }

    /**
     * Apply stroke width to selected element
     */
    applyStrokeWidth(width) {
        if (!this.selectedElement) return;

        this.saveState();
        this.selectedElement.setAttribute('stroke-width', width);
        this.updateSVGCode();
    }

    /**
     * Apply generic attribute to selected element
     */
    applyAttribute(attr, value) {
        if (!this.selectedElement) return;

        this.saveState();
        this.selectedElement.setAttribute(attr, value);
        this.updateSVGCode();
    }

    /**
     * Apply rotation to selected element
     */
    applyRotation(degrees) {
        if (!this.selectedElement) return;

        this.saveState();

        // Get element center
        const bbox = this.selectedElement.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;

        // Apply rotation transform
        this.selectedElement.setAttribute('transform', `rotate(${degrees} ${cx} ${cy})`);
        this.updateSVGCode();
    }

    /**
     * Apply scale to selected element
     */
    applyScale(scale) {
        if (!this.selectedElement) return;

        this.saveState();

        // Get element center
        const bbox = this.selectedElement.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;

        // Apply scale transform (translate to origin, scale, translate back)
        this.selectedElement.setAttribute('transform',
            `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`
        );
        this.updateSVGCode();
    }

    /**
     * Delete selected element
     */
    deleteSelectedElement() {
        if (!this.selectedElement) return;

        this.saveState();
        this.selectedElement.remove();
        this.selectedElement = null;
        this.clearPropertiesPanel();
        this.updateElementsPanel();
        this.updateSVGCode();
        this.setStatus('Element deleted');
    }

    /**
     * Set active tool
     */
    setTool(toolName) {
        this.container.querySelectorAll('.svge-tool-btn[data-action="select"], .svge-tool-btn[data-action="move"], .svge-tool-btn[data-action="scale"]')
            .forEach(btn => btn.classList.remove('active'));

        this.container.querySelector(`[data-action="${toolName}"]`)?.classList.add('active');
        this.currentTool = toolName;
    }

    /**
     * Set zoom level
     */
    setZoom(level) {
        this.zoom = Math.max(25, Math.min(400, level));
        this.applyZoom();

        const display = this.container.querySelector('#svge-zoom-display');
        if (display) display.textContent = `${this.zoom}%`;
    }

    /**
     * Apply zoom to canvas
     */
    applyZoom() {
        const canvas = this.container.querySelector('#svge-canvas');
        if (canvas) {
            canvas.style.transform = `scale(${this.zoom / 100})`;
        }
    }

    /**
     * Toggle grid display
     */
    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
        const grid = this.container.querySelector('#svge-canvas-grid');
        if (grid) {
            grid.style.display = this.gridEnabled ? 'block' : 'none';
        }
    }

    /**
     * Toggle code panel
     */
    toggleCodePanel() {
        const panel = this.container.querySelector('#svge-code-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            if (panel.style.display !== 'none') {
                this.updateCodeEditor();
            }
        }
    }

    /**
     * Set preview theme
     */
    setPreviewTheme(themeName) {
        this.previewTheme = themeName;
        const theme = this.themes[themeName];
        const wrapper = this.container.querySelector('#svge-canvas-wrapper');
        if (wrapper && theme) {
            wrapper.style.backgroundColor = theme.bg;
        }
    }

    /**
     * Update SVG code from canvas
     */
    updateSVGCode() {
        const canvas = this.container.querySelector('#svge-canvas');
        const svg = canvas?.querySelector('svg');

        if (svg) {
            // Clone and clean up
            const clone = svg.cloneNode(true);
            clone.querySelectorAll('[data-svge-id]').forEach(el => {
                el.removeAttribute('data-svge-id');
                el.style.cursor = '';
            });
            clone.querySelectorAll('.svge-selected').forEach(el => {
                el.classList.remove('svge-selected');
            });

            this.currentSvg = clone.outerHTML;
            this.updateCodeEditor();
        }
    }

    /**
     * Update code editor content
     */
    updateCodeEditor() {
        const editor = this.container.querySelector('#svge-code-editor');
        if (editor) {
            editor.value = this.formatSVGCode(this.currentSvg);
        }
    }

    /**
     * Format SVG code for readability
     */
    formatSVGCode(code) {
        if (!code) return '';

        // Basic formatting
        let formatted = code
            .replace(/></g, '>\n<')
            .replace(/(<[^/][^>]*[^/]>)\n</g, '$1\n    <')
            .trim();

        return formatted;
    }

    /**
     * Format code in editor
     */
    formatCode() {
        const editor = this.container.querySelector('#svge-code-editor');
        if (editor) {
            editor.value = this.formatSVGCode(editor.value);
        }
    }

    /**
     * Copy code to clipboard
     */
    async copyCode() {
        try {
            await navigator.clipboard.writeText(this.currentSvg);
            this.setStatus('Code copied to clipboard');
        } catch (err) {
            this.setStatus('Failed to copy code', 'error');
        }
    }

    /**
     * Apply code from editor to canvas
     */
    applyCode() {
        const editor = this.container.querySelector('#svge-code-editor');
        if (!editor) return;

        this.saveState();
        this.loadSVG(editor.value);
        this.setStatus('Code applied');
    }

    /**
     * Update dimensions display
     */
    updateDimensions() {
        const display = this.container.querySelector('#svge-dimensions-text');
        if (!display) return;

        const canvas = this.container.querySelector('#svge-canvas svg');
        if (canvas) {
            const viewBox = canvas.getAttribute('viewBox') || 'Not set';
            display.textContent = `ViewBox: ${viewBox}`;
        }
    }

    /**
     * Set status message
     */
    setStatus(message, type = 'info') {
        const status = this.container.querySelector('#svge-status-text');
        if (status) {
            status.textContent = message;
            status.className = `svge-status-${type}`;
        }
    }

    /**
     * Save current state for undo
     */
    saveState() {
        // Remove future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.addToHistory(this.currentSvg);
    }

    /**
     * Add SVG to history
     */
    addToHistory(svg) {
        this.history.push(svg);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
        this.updateUndoRedoButtons();
    }

    /**
     * Undo last change
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentSvg = this.history[this.historyIndex];
            this.renderSVG();
            this.updateElementsPanel();
            this.updateCodeEditor();
            this.clearPropertiesPanel();
            this.selectedElement = null;
            this.updateUndoRedoButtons();
            this.setStatus('Undo');
        }
    }

    /**
     * Redo last undone change
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentSvg = this.history[this.historyIndex];
            this.renderSVG();
            this.updateElementsPanel();
            this.updateCodeEditor();
            this.clearPropertiesPanel();
            this.selectedElement = null;
            this.updateUndoRedoButtons();
            this.setStatus('Redo');
        }
    }

    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = this.container.querySelector('[data-action="undo"]');
        const redoBtn = this.container.querySelector('[data-action="redo"]');

        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    /**
     * Get current SVG code
     */
    getSVG() {
        return this.currentSvg;
    }

    /**
     * Set SVG code
     */
    setSVG(svgCode) {
        this.loadSVG(svgCode);
    }

    /**
     * Export SVG as file
     */
    exportSVG(filename = 'icon.svg') {
        const blob = new Blob([this.currentSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Destroy editor
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.SVGEditor = SVGEditor;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGEditor;
}
