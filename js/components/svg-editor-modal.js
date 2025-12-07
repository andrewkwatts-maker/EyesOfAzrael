/**
 * SVG Editor Modal Component
 * Eyes of Azrael Project
 * Features: Code editor, AI generation with Gemini, live preview
 */

class SVGEditorModal {
    constructor() {
        this.isOpen = false;
        this.currentSvg = '';
        this.currentPrompt = '';
        this.currentMode = 'code'; // 'code' or 'ai'
        this.onSaveCallback = null;
        this.generator = null;
        this.debounceTimer = null;
        this.overlay = null;
        this.authUnsubscribe = null;

        // Initialize Gemini generator
        this.initializeGenerator();

        // Listen for auth state changes to update UI
        this.setupAuthListener();
    }

    /**
     * Setup Firebase auth listener
     */
    setupAuthListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
                console.log('SVG Editor: Auth state changed, user:', user ? user.email : 'none');
                // If modal is open, refresh the AI tab when auth state changes
                if (this.isOpen) {
                    this.refreshAITab();
                }
            });
        }
    }

    /**
     * Refresh AI tab content when auth state changes
     */
    refreshAITab() {
        if (!this.overlay) return;

        const aiTabContent = this.overlay.querySelector('[data-content="ai"]');
        if (!aiTabContent) return;

        const leftPanel = aiTabContent.querySelector('.svg-editor-left');
        if (leftPanel) {
            leftPanel.innerHTML = this.getAIGeneratorHTML();

            // Re-attach event listeners for AI tab
            this.attachAITabEventListeners();
        }
    }

    /**
     * Initialize Gemini SVG generator
     */
    initializeGenerator() {
        if (window.GeminiSVGGenerator) {
            this.generator = new window.GeminiSVGGenerator();
        } else {
            console.warn('GeminiSVGGenerator not loaded. AI generation will be disabled.');
        }
    }

    /**
     * Open the SVG editor modal
     * @param {Object} options - {initialSvg, initialPrompt, onSave}
     */
    open(options = {}) {
        if (this.isOpen) {
            console.warn('SVG editor is already open');
            return;
        }

        this.currentSvg = options.initialSvg || '';
        this.currentPrompt = options.initialPrompt || '';
        this.onSaveCallback = options.onSave || null;

        this.render();
        this.attachEventListeners();
        this.updatePreview();
        this.isOpen = true;

        // Focus on first input
        setTimeout(() => {
            const firstInput = this.overlay.querySelector('.svg-code-textarea, .svg-prompt-input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
            this.authUnsubscribe = null;
        }
    }

    /**
     * Close the modal
     */
    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        this.isOpen = false;
        this.currentSvg = '';
        this.currentPrompt = '';
        this.onSaveCallback = null;
    }

    /**
     * Render the modal HTML
     */
    render() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'svg-editor-overlay';
        this.overlay.innerHTML = this.getModalHTML();
        document.body.appendChild(this.overlay);
    }

    /**
     * Get modal HTML structure
     */
    getModalHTML() {
        const hasGenerator = !!this.generator;
        const isConfigured = hasGenerator && this.generator.isConfigured();

        return `
            <div class="svg-editor-modal">
                <!-- Header -->
                <div class="svg-editor-header">
                    <h2 class="svg-editor-title">🎨 SVG Editor</h2>
                    <button class="svg-editor-close" data-action="close" title="Close (Esc)">×</button>
                </div>

                <!-- Tabs -->
                <div class="svg-editor-tabs">
                    <button class="svg-tab active" data-tab="code">Code Editor</button>
                    <button class="svg-tab ${!hasGenerator ? 'disabled' : ''}" data-tab="ai" ${!hasGenerator ? 'disabled title="Gemini API not available"' : ''}>
                        AI Generator ${!isConfigured ? '(Sign In Required)' : ''}
                    </button>
                    <button class="svg-tab" data-tab="browse">Browse My SVGs</button>
                </div>

                <!-- Body -->
                <div class="svg-editor-body">
                    <!-- Code Editor Tab -->
                    <div class="svg-tab-content active" data-content="code">
                        <div class="svg-editor-left">
                            ${this.getCodeEditorHTML()}
                        </div>
                        <div class="svg-editor-right">
                            ${this.getPreviewHTML()}
                        </div>
                    </div>

                    <!-- AI Generator Tab -->
                    <div class="svg-tab-content" data-content="ai">
                        <div class="svg-editor-left">
                            ${this.getAIGeneratorHTML()}
                        </div>
                        <div class="svg-editor-right">
                            ${this.getPreviewHTML()}
                        </div>
                    </div>

                    <!-- Browse SVGs Tab -->
                    <div class="svg-tab-content" data-content="browse">
                        <div class="svg-browse-container" id="svg-browse-container">
                            <p class="svg-browse-loading">Loading your SVGs...</p>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="svg-editor-footer">
                    <label class="svg-save-library">
                        <input type="checkbox" id="svg-save-to-library" />
                        <span>Save to SVG Library (future feature)</span>
                    </label>
                    <div class="svg-footer-actions">
                        <button class="svg-btn-cancel" data-action="close">Cancel</button>
                        <button class="svg-btn-insert" data-action="insert">Insert SVG</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get code editor HTML
     */
    getCodeEditorHTML() {
        return `
            <div class="svg-code-editor-section">
                <label class="svg-code-label">SVG Code</label>
                <textarea
                    class="svg-code-textarea"
                    id="svg-code-input"
                    placeholder="Paste your SVG code here...&#10;&#10;Example:&#10;<svg viewBox=&quot;0 0 400 400&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;>&#10;  <circle cx=&quot;200&quot; cy=&quot;200&quot; r=&quot;100&quot; fill=&quot;#8b7fff&quot; />&#10;</svg>"
                    spellcheck="false"
                >${this.escapeHtml(this.currentSvg)}</textarea>
                <p class="svg-code-hint">Paste SVG code or write it manually. Preview updates automatically.</p>
                <p class="svg-keyboard-hint">Tip: Press Ctrl+Enter (Cmd+Enter) to insert</p>
            </div>
        `;
    }

    /**
     * Get AI generator HTML
     */
    getAIGeneratorHTML() {
        // Check if user is signed in with Firebase
        const isSignedIn = typeof firebase !== 'undefined' &&
                          firebase.auth &&
                          firebase.auth().currentUser !== null;

        if (!isSignedIn) {
            return this.getConfigInstructionsHTML();
        }

        const examples = window.GeminiSVGGenerator.getExamplePrompts();

        return `
            <div class="svg-ai-generator-section">
                <div id="svg-ai-messages"></div>

                <div class="svg-form-group">
                    <label class="svg-form-label">Describe Your SVG</label>
                    <textarea
                        class="svg-prompt-input"
                        id="svg-prompt-input"
                        placeholder="Example: Zeus hurling a lightning bolt with dramatic clouds and golden accents"
                    >${this.escapeHtml(this.currentPrompt)}</textarea>
                    <p class="svg-form-hint">Describe the mythological scene, symbol, or concept you want to visualize</p>
                </div>

                <div class="svg-form-group">
                    <label class="svg-form-label">Style</label>
                    <select class="svg-select" id="svg-style-select">
                        <option value="symbolic">Symbolic - Clean, iconic symbols</option>
                        <option value="detailed">Detailed - Rich, intricate designs</option>
                        <option value="minimalist">Minimalist - Simple, modern aesthetic</option>
                        <option value="geometric">Geometric - Sacred geometry patterns</option>
                    </select>
                </div>

                <div class="svg-form-group">
                    <label class="svg-form-label">Color Scheme</label>
                    <select class="svg-select" id="svg-color-select">
                        <option value="fire">Fire - Oranges, reds, gold</option>
                        <option value="divine">Divine - Purple, gold, white</option>
                        <option value="nature">Nature - Greens, browns, earth tones</option>
                        <option value="water">Water - Blues, teals, aqua</option>
                        <option value="monochrome">Monochrome - Purple shades</option>
                    </select>
                </div>

                <button class="svg-generate-btn" id="svg-generate-btn" data-action="generate">
                    <span id="svg-generate-text">✨ Generate SVG</span>
                    <span id="svg-generate-spinner" class="svg-loading-spinner" style="display: none;"></span>
                </button>

                <div class="svg-examples">
                    <div class="svg-examples-title">💡 Example Prompts</div>
                    <div class="svg-examples-list">
                        ${examples.slice(0, 5).map(ex => `
                            <button class="svg-example-btn" data-action="use-example" data-prompt="${this.escapeHtml(ex.text)}" data-style="${ex.style}" data-color="${ex.colorScheme}">
                                ${this.escapeHtml(ex.text)}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get configuration instructions HTML (when not authenticated)
     */
    getConfigInstructionsHTML() {
        if (!this.generator) {
            return `
                <div class="svg-message error">
                    <strong>Error:</strong> GeminiSVGGenerator component not loaded. Please ensure the script is included.
                </div>
            `;
        }

        const instructions = this.generator.getConfigInstructions();

        return `
            <div class="svg-config-instructions">
                <div class="svg-config-title">${instructions.title}</div>
                <p>${instructions.message}</p>
                <ul class="svg-config-steps">
                    ${instructions.steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
                <p class="svg-form-hint">${instructions.note}</p>
                <p class="svg-form-hint" style="margin-top: 1rem;">
                    You can still use the Code Editor tab to paste SVG code manually without signing in.
                </p>
            </div>
        `;
    }

    /**
     * Get preview panel HTML
     */
    getPreviewHTML() {
        return `
            <div class="svg-preview-section">
                <div class="svg-preview-title">Live Preview</div>
                <div class="svg-preview-container" id="svg-preview-container">
                    <p class="svg-preview-empty">Preview will appear here</p>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        this.overlay.querySelectorAll('[data-action="close"]').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // Tab switching
        this.overlay.querySelectorAll('.svg-tab:not(.disabled)').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Code editor input with debounce
        const codeInput = this.overlay.querySelector('#svg-code-input');
        if (codeInput) {
            codeInput.addEventListener('input', (e) => {
                this.currentSvg = e.target.value;
                this.debounceUpdatePreview();
            });

            // Keyboard shortcut: Ctrl+Enter to insert
            codeInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.insertSVG();
                }
            });
        }

        // Attach AI tab event listeners
        this.attachAITabEventListeners();

        // Insert button
        const insertBtn = this.overlay.querySelector('[data-action="insert"]');
        if (insertBtn) {
            insertBtn.addEventListener('click', () => this.insertSVG());
        }

        // ESC key to close
        this.handleEscKey = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.handleEscKey);

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    }

    /**
     * Attach AI tab specific event listeners
     */
    attachAITabEventListeners() {
        // AI prompt input
        const promptInput = this.overlay.querySelector('#svg-prompt-input');
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                this.currentPrompt = e.target.value;
            });

            // Keyboard shortcut: Ctrl+Enter to generate
            promptInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.generateSVG();
                }
            });
        }

        // Generate button
        const generateBtn = this.overlay.querySelector('#svg-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateSVG());
        }

        // Example prompts
        this.overlay.querySelectorAll('[data-action="use-example"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                const style = e.target.dataset.style;
                const color = e.target.dataset.color;
                this.useExample(prompt, style, color);
            });
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        this.overlay.querySelectorAll('.svg-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        this.overlay.querySelectorAll('.svg-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });

        this.currentMode = tabName;

        // Load user SVGs when switching to browse tab
        if (tabName === 'browse') {
            this.loadUserSVGs();
        }
    }

    /**
     * Load user's SVGs from Firestore
     */
    async loadUserSVGs() {
        const container = document.getElementById('svg-browse-container');
        if (!container) return;

        // Check if user is signed in
        if (!firebase || !firebase.auth || !firebase.auth().currentUser) {
            container.innerHTML = `
                <div class="svg-browse-signin">
                    <h3>Sign In Required</h3>
                    <p>Sign in with Google to browse your saved SVGs.</p>
                </div>
            `;
            return;
        }

        try {
            const userId = firebase.auth().currentUser.uid;
            const db = firebase.firestore();

            // Query user's SVGs from svgGeneration collection
            const svgsRef = db.collection('svgGeneration')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(50);

            const snapshot = await svgsRef.get();

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="svg-browse-empty">
                        <h3>No SVGs Yet</h3>
                        <p>You haven't generated any SVGs yet.</p>
                        <p>Try the <strong>AI Generator</strong> tab to create your first SVG!</p>
                    </div>
                `;
                return;
            }

            const svgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderUserSVGs(svgs, container);
        } catch (error) {
            console.error('Error loading user SVGs:', error);
            container.innerHTML = `
                <div class="svg-browse-error">
                    <p>Error loading SVGs: ${this.escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    /**
     * Render user SVGs in browse tab
     */
    renderUserSVGs(svgs, container) {
        container.innerHTML = `
            <div class="svg-browse-header">
                <h3>My SVGs (${svgs.length})</h3>
                <p>Click an SVG to load it into the editor</p>
            </div>
            <div class="svg-browse-grid">
                ${svgs.map(svg => `
                    <div class="svg-browse-item" data-svg-id="${svg.id}">
                        <div class="svg-browse-preview">
                            ${svg.svgCode || '<p class="svg-no-preview">No preview</p>'}
                        </div>
                        <div class="svg-browse-info">
                            <p class="svg-browse-prompt" title="${this.escapeHtml(svg.prompt || 'No prompt')}">${this.escapeHtml(this.truncate(svg.prompt || 'Untitled', 50))}</p>
                            <p class="svg-browse-date">${this.formatDate(svg.createdAt)}</p>
                        </div>
                        <button class="svg-browse-use-btn" data-svg-id="${svg.id}" title="Use this SVG">
                            Use
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Attach click handlers
        container.querySelectorAll('.svg-browse-use-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const svgId = e.target.dataset.svgId;
                const svg = svgs.find(s => s.id === svgId);
                if (svg) {
                    this.loadSVGIntoEditor(svg);
                }
            });
        });

        // Also allow clicking the whole card
        container.querySelectorAll('.svg-browse-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('svg-browse-use-btn')) return;
                const svgId = item.dataset.svgId;
                const svg = svgs.find(s => s.id === svgId);
                if (svg) {
                    this.loadSVGIntoEditor(svg);
                }
            });
        });
    }

    /**
     * Load selected SVG into editor
     */
    loadSVGIntoEditor(svg) {
        this.currentSvg = svg.svgCode || '';
        this.currentPrompt = svg.prompt || '';

        // Switch to code editor tab and populate
        this.switchTab('code');

        const codeInput = this.overlay.querySelector('#svg-code-input');
        if (codeInput) {
            codeInput.value = this.currentSvg;
        }

        this.updatePreview();
    }

    /**
     * Truncate text to max length
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Format Firestore timestamp
     */
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return 'Unknown date';
        }
    }

    /**
     * Update preview with debounce
     */
    debounceUpdatePreview() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.updatePreview();
        }, 500);
    }

    /**
     * Update SVG preview
     */
    updatePreview() {
        const containers = this.overlay.querySelectorAll('#svg-preview-container');
        containers.forEach(container => {
            if (!this.currentSvg || this.currentSvg.trim() === '') {
                container.innerHTML = '<p class="svg-preview-empty">Preview will appear here</p>';
                return;
            }

            // Validate SVG
            if (!this.generator) {
                // No generator, just display
                container.innerHTML = this.currentSvg;
                return;
            }

            const validation = this.generator.validateSVG(this.currentSvg);
            if (validation.valid) {
                container.innerHTML = this.currentSvg;
            } else {
                container.innerHTML = `
                    <p class="svg-preview-empty" style="color: #fca5a5;">
                        Invalid SVG: ${validation.errors.join(', ')}
                    </p>
                `;
            }
        });
    }

    /**
     * Generate SVG using AI
     */
    async generateSVG() {
        if (!this.generator || !this.generator.isConfigured()) {
            this.showMessage('error', 'AI generation is not configured. Please check the configuration instructions.');
            return;
        }

        const prompt = this.currentPrompt.trim();
        if (!prompt) {
            this.showMessage('error', 'Please enter a description for your SVG.');
            return;
        }

        const style = this.overlay.querySelector('#svg-style-select')?.value || 'symbolic';
        const colorScheme = this.overlay.querySelector('#svg-color-select')?.value || 'divine';

        // Show loading state
        this.setGenerating(true);
        this.showMessage('info', 'Generating SVG with Gemini AI... This may take a few seconds.');

        try {
            const result = await this.generator.generateSVG(prompt, {
                style: style,
                colorScheme: colorScheme
            });

            if (result.success) {
                this.currentSvg = result.svgCode;

                // Update code editor if in AI tab
                const codeInput = this.overlay.querySelector('#svg-code-input');
                if (codeInput) {
                    codeInput.value = this.currentSvg;
                }

                this.updatePreview();
                this.showMessage('success', 'SVG generated successfully! You can edit the code in the Code Editor tab if needed.');
            } else {
                if (result.needsAuth) {
                    this.showMessage('error', 'Not signed in. Please sign in with Google to use AI generation.');
                } else {
                    this.showMessage('error', `Generation failed: ${result.error}`);
                }
            }
        } catch (error) {
            this.showMessage('error', `Unexpected error: ${error.message}`);
        } finally {
            this.setGenerating(false);
        }
    }

    /**
     * Set generating state
     */
    setGenerating(isGenerating) {
        const btn = this.overlay.querySelector('#svg-generate-btn');
        const text = this.overlay.querySelector('#svg-generate-text');
        const spinner = this.overlay.querySelector('#svg-generate-spinner');

        if (btn) btn.disabled = isGenerating;
        if (text) text.textContent = isGenerating ? 'Generating...' : '✨ Generate SVG';
        if (spinner) spinner.style.display = isGenerating ? 'inline-block' : 'none';
    }

    /**
     * Show message
     */
    showMessage(type, message) {
        const container = this.overlay.querySelector('#svg-ai-messages');
        if (!container) return;

        container.innerHTML = `
            <div class="svg-message ${type}">
                ${message}
            </div>
        `;

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (container) container.innerHTML = '';
            }, 5000);
        }
    }

    /**
     * Use example prompt
     */
    useExample(prompt, style, color) {
        this.currentPrompt = prompt;

        const promptInput = this.overlay.querySelector('#svg-prompt-input');
        const styleSelect = this.overlay.querySelector('#svg-style-select');
        const colorSelect = this.overlay.querySelector('#svg-color-select');

        if (promptInput) promptInput.value = prompt;
        if (styleSelect) styleSelect.value = style;
        if (colorSelect) colorSelect.value = color;
    }

    /**
     * Insert SVG and close modal
     */
    insertSVG() {
        if (!this.currentSvg || this.currentSvg.trim() === '') {
            this.showMessage('error', 'No SVG to insert. Please generate or paste SVG code first.');
            return;
        }

        // Validate before inserting
        if (this.generator) {
            const validation = this.generator.validateSVG(this.currentSvg);
            if (!validation.valid) {
                alert(`Cannot insert invalid SVG:\n${validation.errors.join('\n')}`);
                return;
            }
        }

        // Call save callback
        if (this.onSaveCallback) {
            this.onSaveCallback({
                svgCode: this.currentSvg,
                prompt: this.currentPrompt,
                generatedBy: this.currentMode === 'ai' ? 'gemini-ai' : 'user'
            });
        }

        this.close();
    }

    /**
     * Cleanup when closing
     */
    cleanup() {
        if (this.handleEscKey) {
            document.removeEventListener('keydown', this.handleEscKey);
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
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

// Create global singleton instance
if (!window.SVGEditorModal) {
    window.SVGEditorModal = new SVGEditorModal();
}

// Also export the class for creating new instances if needed
window.SVGEditorModalClass = SVGEditorModal;
