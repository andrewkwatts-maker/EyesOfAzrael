/**
 * Icon Generator Preview Component
 * Provides a UI for generating, previewing, and exporting SVG icons
 *
 * Usage:
 *   const preview = new IconGeneratorPreview({
 *     container: document.getElementById('icon-preview'),
 *     onSelect: (svgCode) => console.log(svgCode)
 *   });
 *   preview.show();
 */

class IconGeneratorPreview {
    constructor(options = {}) {
        this.container = options.container || null;
        this.onSelect = options.onSelect || (() => {});
        this.onSave = options.onSave || null;
        this.mode = options.mode || 'modal'; // 'modal', 'inline', 'panel'

        // Initialize icon generator
        this.generator = new IconGenerator();

        // Current state
        this.currentShape = 'circle';
        this.currentColor = 'primary';
        this.currentSecondaryColor = null;
        this.currentStyle = 'filled';
        this.currentSize = 64;
        this.currentRotation = 0;
        this.currentAnimate = false;

        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;

        // Create UI
        if (this.mode === 'modal') {
            this.createModal();
        } else if (this.container) {
            this.render();
        }
    }

    /**
     * Create modal structure
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'icon-generator-modal';
        this.modal.innerHTML = `
            <div class="icon-generator-overlay"></div>
            <div class="icon-generator-content">
                <div class="icon-generator-header">
                    <h3 class="icon-generator-title">Icon Generator</h3>
                    <button type="button" class="icon-generator-close" aria-label="Close">&times;</button>
                </div>
                <div class="icon-generator-body">
                    ${this.renderBody()}
                </div>
                <div class="icon-generator-footer">
                    ${this.renderFooter()}
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
        this.attachEventListeners();
    }

    /**
     * Render inline/panel mode
     */
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="icon-generator-inline">
                <div class="icon-generator-header">
                    <h3 class="icon-generator-title">Icon Generator</h3>
                </div>
                <div class="icon-generator-body">
                    ${this.renderBody()}
                </div>
                <div class="icon-generator-footer">
                    ${this.renderFooter()}
                </div>
            </div>
        `;
        this.attachEventListeners();
    }

    /**
     * Render main body content
     */
    renderBody() {
        const shapeCategories = this.generator.getShapes();
        const colors = this.generator.getColors();

        return `
            <div class="icon-generator-layout">
                <!-- Preview Area -->
                <div class="icon-generator-preview-area">
                    <div class="icon-preview-container" id="icon-preview-container">
                        <div class="icon-preview-display" id="icon-preview-display">
                            ${this.generateCurrentIcon()}
                        </div>
                    </div>
                    <div class="icon-preview-sizes">
                        <button class="icon-size-btn" data-size="24">24</button>
                        <button class="icon-size-btn" data-size="32">32</button>
                        <button class="icon-size-btn" data-size="48">48</button>
                        <button class="icon-size-btn active" data-size="64">64</button>
                        <button class="icon-size-btn" data-size="128">128</button>
                    </div>
                    <div class="icon-preview-controls">
                        <button class="icon-control-btn" id="icon-rotate-left" title="Rotate Left">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor"/></svg>
                        </button>
                        <button class="icon-control-btn" id="icon-rotate-right" title="Rotate Right">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z" fill="currentColor"/></svg>
                        </button>
                        <span class="icon-rotation-label" id="icon-rotation-label">0</span>
                        <button class="icon-control-btn ${this.currentAnimate ? 'active' : ''}" id="icon-toggle-animate" title="Toggle Animation">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                        </button>
                        <button class="icon-control-btn" id="icon-randomize" title="Random Icon">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" fill="currentColor"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Controls Panel -->
                <div class="icon-generator-controls">
                    <!-- Shape Selection -->
                    <div class="icon-control-section">
                        <h4 class="icon-control-title">Shape</h4>
                        <div class="icon-category-tabs">
                            ${Object.keys(shapeCategories).map((cat, i) =>
                                `<button class="icon-category-tab ${i === 0 ? 'active' : ''}" data-category="${cat}">${this.formatCategoryName(cat)}</button>`
                            ).join('')}
                        </div>
                        <div class="icon-shapes-grid" id="icon-shapes-grid">
                            ${this.renderShapesGrid('geometry')}
                        </div>
                    </div>

                    <!-- Style Selection -->
                    <div class="icon-control-section">
                        <h4 class="icon-control-title">Style</h4>
                        <div class="icon-style-buttons">
                            <button class="icon-style-btn active" data-style="filled">Filled</button>
                            <button class="icon-style-btn" data-style="outline">Outline</button>
                            <button class="icon-style-btn" data-style="gradient">Gradient</button>
                            <button class="icon-style-btn" data-style="glow">Glow</button>
                        </div>
                    </div>

                    <!-- Color Selection -->
                    <div class="icon-control-section">
                        <h4 class="icon-control-title">Primary Color</h4>
                        <div class="icon-color-grid" id="icon-color-grid">
                            ${this.renderColorGrid()}
                        </div>
                        <div class="icon-custom-color">
                            <label>Custom:</label>
                            <input type="color" id="icon-custom-color" value="#8b7fff">
                        </div>
                    </div>

                    <!-- Secondary Color -->
                    <div class="icon-control-section">
                        <h4 class="icon-control-title">Secondary Color (Optional)</h4>
                        <div class="icon-color-grid icon-color-grid-secondary" id="icon-secondary-color-grid">
                            <button class="icon-color-btn active" data-color="none" title="None">
                                <span class="icon-color-none">X</span>
                            </button>
                            ${this.renderColorGrid(true)}
                        </div>
                    </div>

                    <!-- Mythology Presets -->
                    <div class="icon-control-section">
                        <h4 class="icon-control-title">Mythology Presets</h4>
                        <div class="icon-mythology-grid">
                            ${['egyptian', 'greek', 'norse', 'celtic', 'hindu', 'buddhist', 'japanese', 'chinese'].map(myth =>
                                `<button class="icon-mythology-btn" data-mythology="${myth}" title="${this.formatCategoryName(myth)}">${this.getMythologyEmoji(myth)}</button>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render footer with action buttons
     */
    renderFooter() {
        return `
            <div class="icon-generator-actions-left">
                <button type="button" class="icon-action-btn icon-action-secondary" id="icon-undo" disabled title="Undo">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor"/></svg>
                </button>
                <button type="button" class="icon-action-btn icon-action-secondary" id="icon-redo" disabled title="Redo">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" fill="currentColor"/></svg>
                </button>
            </div>
            <div class="icon-generator-actions-right">
                <button type="button" class="icon-action-btn icon-action-secondary" id="icon-copy-svg" title="Copy SVG Code">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
                    <span>Copy SVG</span>
                </button>
                <button type="button" class="icon-action-btn icon-action-secondary" id="icon-download-svg" title="Download SVG">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" fill="currentColor"/></svg>
                    <span>Download</span>
                </button>
                ${this.onSave ? `
                <button type="button" class="icon-action-btn icon-action-secondary" id="icon-save-entity" title="Save to Entity">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" fill="currentColor"/></svg>
                    <span>Save</span>
                </button>
                ` : ''}
                <button type="button" class="icon-action-btn icon-action-primary" id="icon-use-icon">
                    <span>Use Icon</span>
                </button>
            </div>
        `;
    }

    /**
     * Render shapes grid for a category
     */
    renderShapesGrid(category) {
        const shapes = this.generator.getShapesByCategory(category);
        return shapes.map(shape => {
            const icon = this.generator.generate({ shape, size: 32, style: 'outline', color: 'text' });
            return `
                <button class="icon-shape-btn ${shape === this.currentShape ? 'active' : ''}"
                        data-shape="${shape}"
                        title="${this.formatShapeName(shape)}">
                    ${icon}
                </button>
            `;
        }).join('');
    }

    /**
     * Render color grid
     */
    renderColorGrid(isSecondary = false) {
        const colorNames = [
            'primary', 'secondary', 'accent', 'gold', 'silver',
            'egyptian', 'greek', 'norse', 'celtic', 'hindu',
            'buddhist', 'christian', 'islamic', 'japanese', 'chinese',
            'white', 'black'
        ];

        return colorNames.map(colorName => {
            const colorValue = this.generator.getColor(colorName);
            const isActive = isSecondary
                ? this.currentSecondaryColor === colorName
                : this.currentColor === colorName;
            return `
                <button class="icon-color-btn ${isActive ? 'active' : ''}"
                        data-color="${colorName}"
                        style="background-color: ${colorValue}"
                        title="${this.formatCategoryName(colorName)}">
                </button>
            `;
        }).join('');
    }

    /**
     * Generate current icon SVG
     */
    generateCurrentIcon() {
        return this.generator.generate({
            shape: this.currentShape,
            color: this.currentColor,
            secondaryColor: this.currentSecondaryColor,
            style: this.currentStyle,
            size: this.currentSize,
            rotation: this.currentRotation,
            animate: this.currentAnimate
        });
    }

    /**
     * Update preview display
     */
    updatePreview() {
        const display = document.getElementById('icon-preview-display');
        if (display) {
            display.innerHTML = this.generateCurrentIcon();
        }
    }

    /**
     * Save state to history
     */
    saveToHistory() {
        // Remove any redo history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push({
            shape: this.currentShape,
            color: this.currentColor,
            secondaryColor: this.currentSecondaryColor,
            style: this.currentStyle,
            size: this.currentSize,
            rotation: this.currentRotation,
            animate: this.currentAnimate
        });
        this.historyIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateUndoRedoButtons();
    }

    /**
     * Restore state from history entry
     */
    restoreFromHistory(entry) {
        this.currentShape = entry.shape;
        this.currentColor = entry.color;
        this.currentSecondaryColor = entry.secondaryColor;
        this.currentStyle = entry.style;
        this.currentSize = entry.size;
        this.currentRotation = entry.rotation;
        this.currentAnimate = entry.animate;

        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory(this.history[this.historyIndex]);
            this.updateUndoRedoButtons();
        }
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory(this.history[this.historyIndex]);
            this.updateUndoRedoButtons();
        }
    }

    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('icon-undo');
        const redoBtn = document.getElementById('icon-redo');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    /**
     * Update active states for all controls
     */
    updateActiveStates() {
        // Update shape buttons
        document.querySelectorAll('.icon-shape-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shape === this.currentShape);
        });

        // Update style buttons
        document.querySelectorAll('.icon-style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === this.currentStyle);
        });

        // Update color buttons
        document.querySelectorAll('#icon-color-grid .icon-color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.currentColor);
        });

        // Update secondary color buttons
        document.querySelectorAll('#icon-secondary-color-grid .icon-color-btn').forEach(btn => {
            const isNone = btn.dataset.color === 'none';
            btn.classList.toggle('active', isNone
                ? this.currentSecondaryColor === null
                : btn.dataset.color === this.currentSecondaryColor);
        });

        // Update size buttons
        document.querySelectorAll('.icon-size-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.size) === this.currentSize);
        });

        // Update rotation label
        const rotationLabel = document.getElementById('icon-rotation-label');
        if (rotationLabel) {
            rotationLabel.textContent = `${this.currentRotation}`;
        }

        // Update animate button
        const animateBtn = document.getElementById('icon-toggle-animate');
        if (animateBtn) {
            animateBtn.classList.toggle('active', this.currentAnimate);
        }
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        const root = this.mode === 'modal' ? this.modal : this.container;
        if (!root) return;

        // Close button (modal only)
        const closeBtn = root.querySelector('.icon-generator-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Overlay click to close (modal only)
        const overlay = root.querySelector('.icon-generator-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hide());
        }

        // Category tabs
        root.querySelectorAll('.icon-category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Shape selection
        root.addEventListener('click', (e) => {
            const shapeBtn = e.target.closest('.icon-shape-btn');
            if (shapeBtn) {
                this.selectShape(shapeBtn.dataset.shape);
            }
        });

        // Style buttons
        root.querySelectorAll('.icon-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectStyle(e.target.dataset.style);
            });
        });

        // Primary color buttons
        const colorGrid = root.querySelector('#icon-color-grid');
        if (colorGrid) {
            colorGrid.addEventListener('click', (e) => {
                const colorBtn = e.target.closest('.icon-color-btn');
                if (colorBtn) {
                    this.selectColor(colorBtn.dataset.color);
                }
            });
        }

        // Secondary color buttons
        const secondaryColorGrid = root.querySelector('#icon-secondary-color-grid');
        if (secondaryColorGrid) {
            secondaryColorGrid.addEventListener('click', (e) => {
                const colorBtn = e.target.closest('.icon-color-btn');
                if (colorBtn) {
                    const color = colorBtn.dataset.color;
                    this.selectSecondaryColor(color === 'none' ? null : color);
                }
            });
        }

        // Custom color picker
        const customColorInput = root.querySelector('#icon-custom-color');
        if (customColorInput) {
            customColorInput.addEventListener('change', (e) => {
                this.selectColor(e.target.value);
            });
        }

        // Size buttons
        root.querySelectorAll('.icon-size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectSize(parseInt(e.target.dataset.size));
            });
        });

        // Rotation controls
        const rotateLeftBtn = root.querySelector('#icon-rotate-left');
        const rotateRightBtn = root.querySelector('#icon-rotate-right');
        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => this.rotate(-15));
        }
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => this.rotate(15));
        }

        // Animation toggle
        const animateBtn = root.querySelector('#icon-toggle-animate');
        if (animateBtn) {
            animateBtn.addEventListener('click', () => this.toggleAnimation());
        }

        // Randomize
        const randomizeBtn = root.querySelector('#icon-randomize');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => this.randomize());
        }

        // Mythology presets
        root.querySelectorAll('.icon-mythology-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyMythologyPreset(e.target.closest('.icon-mythology-btn').dataset.mythology);
            });
        });

        // Undo/Redo
        const undoBtn = root.querySelector('#icon-undo');
        const redoBtn = root.querySelector('#icon-redo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }

        // Copy SVG
        const copyBtn = root.querySelector('#icon-copy-svg');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySVG());
        }

        // Download SVG
        const downloadBtn = root.querySelector('#icon-download-svg');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadSVG());
        }

        // Save to entity
        const saveBtn = root.querySelector('#icon-save-entity');
        if (saveBtn && this.onSave) {
            saveBtn.addEventListener('click', () => this.saveToEntity());
        }

        // Use icon
        const useBtn = root.querySelector('#icon-use-icon');
        if (useBtn) {
            useBtn.addEventListener('click', () => this.useIcon());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible()) return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                } else if (e.key === 'c' && e.shiftKey) {
                    e.preventDefault();
                    this.copySVG();
                } else if (e.key === 's') {
                    e.preventDefault();
                    this.downloadSVG();
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Save initial state
        this.saveToHistory();
    }

    /**
     * Switch shape category
     */
    switchCategory(category) {
        // Update tab active state
        document.querySelectorAll('.icon-category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Update shapes grid
        const grid = document.getElementById('icon-shapes-grid');
        if (grid) {
            grid.innerHTML = this.renderShapesGrid(category);
        }
    }

    /**
     * Select a shape
     */
    selectShape(shape) {
        this.currentShape = shape;
        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Select a style
     */
    selectStyle(style) {
        this.currentStyle = style;
        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Select primary color
     */
    selectColor(color) {
        this.currentColor = color;
        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Select secondary color
     */
    selectSecondaryColor(color) {
        this.currentSecondaryColor = color;
        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Select size
     */
    selectSize(size) {
        this.currentSize = size;
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Rotate icon
     */
    rotate(degrees) {
        this.currentRotation = (this.currentRotation + degrees + 360) % 360;
        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Toggle animation
     */
    toggleAnimation() {
        this.currentAnimate = !this.currentAnimate;
        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();
    }

    /**
     * Randomize icon
     */
    randomize() {
        const shapes = this.generator.getAllShapeNames();
        const colors = this.generator.getColors();
        const styles = ['filled', 'outline', 'gradient', 'glow'];

        this.currentShape = shapes[Math.floor(Math.random() * shapes.length)];
        this.currentColor = colors[Math.floor(Math.random() * colors.length)];
        this.currentStyle = styles[Math.floor(Math.random() * styles.length)];
        this.currentRotation = Math.floor(Math.random() * 8) * 45;

        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();

        // Find and select the category containing this shape
        const shapeCategories = this.generator.getShapes();
        for (const [category, shapes] of Object.entries(shapeCategories)) {
            if (shapes.includes(this.currentShape)) {
                this.switchCategory(category);
                break;
            }
        }
    }

    /**
     * Apply mythology preset
     */
    applyMythologyPreset(mythology) {
        const mythologyShapes = {
            egyptian: 'ankh',
            greek: 'caduceus',
            norse: 'mjolnir',
            celtic: 'triskelion',
            hindu: 'om',
            buddhist: 'lotus',
            japanese: 'wave',
            chinese: 'dragon-head'
        };

        this.currentShape = mythologyShapes[mythology] || 'circle';
        this.currentColor = mythology;
        this.currentStyle = 'filled';

        this.saveToHistory();
        this.updatePreview();
        this.updateActiveStates();

        // Switch to the appropriate category
        const shapeCategories = this.generator.getShapes();
        for (const [category, shapes] of Object.entries(shapeCategories)) {
            if (shapes.includes(this.currentShape)) {
                this.switchCategory(category);
                break;
            }
        }
    }

    /**
     * Copy SVG to clipboard
     */
    async copySVG() {
        const svg = this.generateCurrentIcon();
        try {
            await navigator.clipboard.writeText(svg);
            this.showNotification('SVG copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = svg;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('SVG copied to clipboard!', 'success');
        }
    }

    /**
     * Download SVG file
     */
    downloadSVG() {
        const svg = this.generateCurrentIcon();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `icon-${this.currentShape}-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('SVG downloaded!', 'success');
    }

    /**
     * Save icon to entity
     */
    saveToEntity() {
        if (this.onSave) {
            const svg = this.generateCurrentIcon();
            this.onSave(svg, {
                shape: this.currentShape,
                color: this.currentColor,
                style: this.currentStyle,
                size: this.currentSize,
                rotation: this.currentRotation
            });
            this.showNotification('Icon saved!', 'success');
        }
    }

    /**
     * Use the current icon (select it)
     */
    useIcon() {
        const svg = this.generateCurrentIcon();
        this.onSelect(svg, {
            shape: this.currentShape,
            color: this.currentColor,
            style: this.currentStyle,
            size: this.currentSize,
            rotation: this.currentRotation
        });
        this.hide();
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `icon-generator-notification icon-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Show the modal
     */
    show() {
        if (this.mode === 'modal' && this.modal) {
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.generator.refreshColors();
            this.updatePreview();
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        if (this.mode === 'modal' && this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Check if visible
     */
    isVisible() {
        if (this.mode === 'modal' && this.modal) {
            return this.modal.classList.contains('active');
        }
        return true;
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.mode === 'modal' && this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Format category name for display
     */
    formatCategoryName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    }

    /**
     * Format shape name for display
     */
    formatShapeName(name) {
        return name.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Get emoji for mythology
     */
    getMythologyEmoji(mythology) {
        const emojis = {
            egyptian: '\u{1F3DB}', // Classical building
            greek: '\u{26A1}', // Lightning
            norse: '\u{1FA93}', // Axe (closest to hammer)
            celtic: '\u{2618}', // Shamrock
            hindu: '\u{1F549}', // Om
            buddhist: '\u{2638}', // Wheel of dharma
            japanese: '\u{1F5FB}', // Mt Fuji
            chinese: '\u{1F409}' // Dragon
        };
        return emojis[mythology] || '\u{2728}'; // Sparkles as fallback
    }

    /**
     * Get current SVG code
     */
    getSVG() {
        return this.generateCurrentIcon();
    }

    /**
     * Get current icon configuration
     */
    getConfig() {
        return {
            shape: this.currentShape,
            color: this.currentColor,
            secondaryColor: this.currentSecondaryColor,
            style: this.currentStyle,
            size: this.currentSize,
            rotation: this.currentRotation,
            animate: this.currentAnimate
        };
    }

    /**
     * Set icon configuration
     */
    setConfig(config) {
        if (config.shape) this.currentShape = config.shape;
        if (config.color) this.currentColor = config.color;
        if (config.secondaryColor !== undefined) this.currentSecondaryColor = config.secondaryColor;
        if (config.style) this.currentStyle = config.style;
        if (config.size) this.currentSize = config.size;
        if (config.rotation !== undefined) this.currentRotation = config.rotation;
        if (config.animate !== undefined) this.currentAnimate = config.animate;

        this.updatePreview();
        this.updateActiveStates();
    }
}

// Export globally
window.IconGeneratorPreview = IconGeneratorPreview;
