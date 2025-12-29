/**
 * Corpus Query Editor Component
 * Editor for creating and editing user corpus queries
 *
 * Features:
 * - Create/edit corpus search queries
 * - Query type selection (github/firebase/combined)
 * - Repository/collection selector
 * - Render mode selection (panel/inline/modal)
 * - Preview functionality
 * - Auto-load toggle
 * - Entity reference linking
 * - Validation and error handling
 *
 * Dependencies:
 * - UserCorpusQueries (js/services/user-corpus-queries.js)
 * - CorpusSearch (js/components/corpus-search.js)
 * - GitHubBrowser (corpus-github-browser.js)
 */

class CorpusQueryEditor {
    /**
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            mode: 'create', // 'create' or 'edit'
            queryToEdit: null,
            onSave: null,
            onCancel: null,
            onPreview: null,
            entityRef: null, // { type: 'deity', id: 'zeus' }
            userId: null,
            ...options
        };

        // State
        this.formData = this.getDefaultFormData();
        this.isLoading = false;
        this.previewResults = null;
        this.errors = {};

        // Services (will be initialized)
        this.userCorpusQueries = null;
        this.corpusSearch = null;
        this.githubBrowser = null;

        // Initialize
        this.init();
    }

    /**
     * Get default form data
     */
    getDefaultFormData() {
        return {
            label: '',
            queryType: 'firebase', // 'github', 'firebase', 'combined'
            searchTerm: '',
            searchMode: 'generic', // 'generic', 'language', 'source', 'term', 'advanced'
            repository: '', // For GitHub queries
            branch: 'main',
            collection: '', // For Firebase queries
            mythology: '',
            renderMode: 'panel', // 'panel', 'inline', 'modal', 'collapsed'
            autoLoad: false,
            isPublic: true,
            entityRef: null,
            filters: {
                extensions: ['json', 'xml', 'txt'],
                path: '',
                minRelevance: 0
            }
        };
    }

    /**
     * Initialize the editor
     */
    async init() {
        try {
            // Initialize services
            await this.initServices();

            // If editing, load existing data
            if (this.options.mode === 'edit' && this.options.queryToEdit) {
                this.formData = { ...this.getDefaultFormData(), ...this.options.queryToEdit };
            }

            // If entity reference provided, set it
            if (this.options.entityRef) {
                this.formData.entityRef = this.options.entityRef;
            }

            // Render the editor
            this.render();
            this.attachEventListeners();

            console.log('[CorpusQueryEditor] Initialized in', this.options.mode, 'mode');

        } catch (error) {
            console.error('[CorpusQueryEditor] Initialization error:', error);
            this.showError('Failed to initialize editor: ' + error.message);
        }
    }

    /**
     * Initialize required services
     */
    async initServices() {
        // Wait for Firebase
        if (typeof window.waitForFirebase === 'function') {
            await window.waitForFirebase();
        }

        // Initialize UserCorpusQueries service
        if (window.UserCorpusQueries && window.db && window.auth) {
            this.userCorpusQueries = new window.UserCorpusQueries(window.db, window.auth);
        }

        // Initialize CorpusSearch
        if (window.EnhancedCorpusSearch && window.db) {
            this.corpusSearch = new window.EnhancedCorpusSearch(window.db);
        } else if (window.CorpusSearch && window.db) {
            this.corpusSearch = new window.CorpusSearch(window.db);
        }

        // Initialize GitHub browser
        if (window.GitHubBrowser) {
            this.githubBrowser = new window.GitHubBrowser();
        }
    }

    /**
     * Render the editor UI
     */
    render() {
        const isEdit = this.options.mode === 'edit';

        this.container.innerHTML = `
            <div class="corpus-query-editor">
                <div class="editor-header">
                    <h3 class="editor-title">
                        ${isEdit ? 'Edit Corpus Query' : 'Create New Corpus Query'}
                    </h3>
                    <button type="button" class="editor-close-btn" aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                        </svg>
                    </button>
                </div>

                <form class="editor-form" novalidate>
                    <!-- Label Input -->
                    <div class="form-group">
                        <label for="query-label" class="form-label">Query Label *</label>
                        <input type="text"
                               id="query-label"
                               class="form-input"
                               placeholder="e.g., Zeus Lightning Myths"
                               value="${this.escapeHtml(this.formData.label)}"
                               required
                               maxlength="100">
                        <span class="form-hint">A descriptive name for your query</span>
                        <span class="form-error" id="label-error"></span>
                    </div>

                    <!-- Query Type Selector -->
                    <div class="form-group">
                        <label class="form-label">Query Type *</label>
                        <div class="query-type-selector">
                            <label class="type-option ${this.formData.queryType === 'firebase' ? 'selected' : ''}">
                                <input type="radio"
                                       name="queryType"
                                       value="firebase"
                                       ${this.formData.queryType === 'firebase' ? 'checked' : ''}>
                                <span class="type-icon">🔥</span>
                                <span class="type-label">Firebase</span>
                                <span class="type-desc">Search entity collections</span>
                            </label>
                            <label class="type-option ${this.formData.queryType === 'github' ? 'selected' : ''}">
                                <input type="radio"
                                       name="queryType"
                                       value="github"
                                       ${this.formData.queryType === 'github' ? 'checked' : ''}>
                                <span class="type-icon">📦</span>
                                <span class="type-label">GitHub</span>
                                <span class="type-desc">Search text repositories</span>
                            </label>
                            <label class="type-option ${this.formData.queryType === 'combined' ? 'selected' : ''}">
                                <input type="radio"
                                       name="queryType"
                                       value="combined"
                                       ${this.formData.queryType === 'combined' ? 'checked' : ''}>
                                <span class="type-icon">🔗</span>
                                <span class="type-label">Combined</span>
                                <span class="type-desc">Search both sources</span>
                            </label>
                        </div>
                    </div>

                    <!-- Search Term Input -->
                    <div class="form-group">
                        <label for="search-term" class="form-label">Search Term *</label>
                        <input type="text"
                               id="search-term"
                               class="form-input"
                               placeholder="e.g., thunderbolt, storm deity"
                               value="${this.escapeHtml(this.formData.searchTerm)}"
                               required>
                        <span class="form-hint">The term or phrase to search for</span>
                        <span class="form-error" id="search-term-error"></span>
                    </div>

                    <!-- Firebase-specific options -->
                    <div class="form-group firebase-options ${this.formData.queryType !== 'firebase' && this.formData.queryType !== 'combined' ? 'hidden' : ''}">
                        <label class="form-label">Search Mode</label>
                        <select id="search-mode" class="form-select">
                            <option value="generic" ${this.formData.searchMode === 'generic' ? 'selected' : ''}>Generic (Full-text)</option>
                            <option value="language" ${this.formData.searchMode === 'language' ? 'selected' : ''}>Language (Scripts, Names)</option>
                            <option value="source" ${this.formData.searchMode === 'source' ? 'selected' : ''}>Sources (Texts, Citations)</option>
                            <option value="term" ${this.formData.searchMode === 'term' ? 'selected' : ''}>Corpus Terms (Epithets, Domains)</option>
                        </select>

                        <div class="form-row">
                            <div class="form-col">
                                <label for="collection" class="form-label">Collection</label>
                                <select id="collection" class="form-select">
                                    <option value="">All Collections</option>
                                    <option value="deities" ${this.formData.collection === 'deities' ? 'selected' : ''}>Deities</option>
                                    <option value="heroes" ${this.formData.collection === 'heroes' ? 'selected' : ''}>Heroes</option>
                                    <option value="creatures" ${this.formData.collection === 'creatures' ? 'selected' : ''}>Creatures</option>
                                    <option value="texts" ${this.formData.collection === 'texts' ? 'selected' : ''}>Texts</option>
                                    <option value="cosmology" ${this.formData.collection === 'cosmology' ? 'selected' : ''}>Cosmology</option>
                                    <option value="rituals" ${this.formData.collection === 'rituals' ? 'selected' : ''}>Rituals</option>
                                    <option value="symbols" ${this.formData.collection === 'symbols' ? 'selected' : ''}>Symbols</option>
                                    <option value="herbs" ${this.formData.collection === 'herbs' ? 'selected' : ''}>Herbs</option>
                                    <option value="items" ${this.formData.collection === 'items' ? 'selected' : ''}>Items</option>
                                    <option value="places" ${this.formData.collection === 'places' ? 'selected' : ''}>Places</option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label for="mythology" class="form-label">Mythology</label>
                                <select id="mythology" class="form-select">
                                    <option value="">All Mythologies</option>
                                    <option value="greek" ${this.formData.mythology === 'greek' ? 'selected' : ''}>Greek</option>
                                    <option value="norse" ${this.formData.mythology === 'norse' ? 'selected' : ''}>Norse</option>
                                    <option value="egyptian" ${this.formData.mythology === 'egyptian' ? 'selected' : ''}>Egyptian</option>
                                    <option value="hindu" ${this.formData.mythology === 'hindu' ? 'selected' : ''}>Hindu</option>
                                    <option value="roman" ${this.formData.mythology === 'roman' ? 'selected' : ''}>Roman</option>
                                    <option value="celtic" ${this.formData.mythology === 'celtic' ? 'selected' : ''}>Celtic</option>
                                    <option value="japanese" ${this.formData.mythology === 'japanese' ? 'selected' : ''}>Japanese</option>
                                    <option value="chinese" ${this.formData.mythology === 'chinese' ? 'selected' : ''}>Chinese</option>
                                    <option value="babylonian" ${this.formData.mythology === 'babylonian' ? 'selected' : ''}>Babylonian</option>
                                    <option value="persian" ${this.formData.mythology === 'persian' ? 'selected' : ''}>Persian</option>
                                    <option value="christian" ${this.formData.mythology === 'christian' ? 'selected' : ''}>Christian</option>
                                    <option value="jewish" ${this.formData.mythology === 'jewish' ? 'selected' : ''}>Jewish</option>
                                    <option value="islamic" ${this.formData.mythology === 'islamic' ? 'selected' : ''}>Islamic</option>
                                    <option value="buddhist" ${this.formData.mythology === 'buddhist' ? 'selected' : ''}>Buddhist</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- GitHub-specific options -->
                    <div class="form-group github-options ${this.formData.queryType !== 'github' && this.formData.queryType !== 'combined' ? 'hidden' : ''}">
                        <label for="repository" class="form-label">Repository</label>
                        <input type="text"
                               id="repository"
                               class="form-input"
                               placeholder="owner/repo or full GitHub URL"
                               value="${this.escapeHtml(this.formData.repository)}">
                        <span class="form-hint">e.g., sacred-texts/greek-mythology</span>

                        <div class="form-row">
                            <div class="form-col">
                                <label for="branch" class="form-label">Branch</label>
                                <input type="text"
                                       id="branch"
                                       class="form-input"
                                       placeholder="main"
                                       value="${this.escapeHtml(this.formData.branch)}">
                            </div>
                            <div class="form-col">
                                <label for="path-filter" class="form-label">Path Filter</label>
                                <input type="text"
                                       id="path-filter"
                                       class="form-input"
                                       placeholder="texts/"
                                       value="${this.escapeHtml(this.formData.filters?.path || '')}">
                            </div>
                        </div>
                    </div>

                    <!-- Render Mode Selector -->
                    <div class="form-group">
                        <label class="form-label">Display Mode</label>
                        <div class="render-mode-selector">
                            <label class="render-option ${this.formData.renderMode === 'panel' ? 'selected' : ''}">
                                <input type="radio"
                                       name="renderMode"
                                       value="panel"
                                       ${this.formData.renderMode === 'panel' ? 'checked' : ''}>
                                <span class="render-icon">📋</span>
                                <span class="render-label">Panel</span>
                            </label>
                            <label class="render-option ${this.formData.renderMode === 'inline' ? 'selected' : ''}">
                                <input type="radio"
                                       name="renderMode"
                                       value="inline"
                                       ${this.formData.renderMode === 'inline' ? 'checked' : ''}>
                                <span class="render-icon">📝</span>
                                <span class="render-label">Inline</span>
                            </label>
                            <label class="render-option ${this.formData.renderMode === 'collapsed' ? 'selected' : ''}">
                                <input type="radio"
                                       name="renderMode"
                                       value="collapsed"
                                       ${this.formData.renderMode === 'collapsed' ? 'checked' : ''}>
                                <span class="render-icon">📂</span>
                                <span class="render-label">Collapsed</span>
                            </label>
                            <label class="render-option ${this.formData.renderMode === 'modal' ? 'selected' : ''}">
                                <input type="radio"
                                       name="renderMode"
                                       value="modal"
                                       ${this.formData.renderMode === 'modal' ? 'checked' : ''}>
                                <span class="render-icon">🪟</span>
                                <span class="render-label">Modal</span>
                            </label>
                        </div>
                    </div>

                    <!-- Options Row -->
                    <div class="form-group options-row">
                        <label class="checkbox-option">
                            <input type="checkbox"
                                   id="auto-load"
                                   ${this.formData.autoLoad ? 'checked' : ''}>
                            <span class="checkbox-label">Auto-load results</span>
                            <span class="checkbox-hint">Execute query when page loads</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox"
                                   id="is-public"
                                   ${this.formData.isPublic ? 'checked' : ''}>
                            <span class="checkbox-label">Public query</span>
                            <span class="checkbox-hint">Allow others to see and vote</span>
                        </label>
                    </div>

                    <!-- Entity Reference (if applicable) -->
                    ${this.formData.entityRef ? `
                        <div class="form-group entity-ref-display">
                            <label class="form-label">Linked Entity</label>
                            <div class="entity-ref-badge">
                                <span class="entity-type">${this.escapeHtml(this.formData.entityRef.type)}</span>
                                <span class="entity-id">${this.escapeHtml(this.formData.entityRef.id)}</span>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Preview Section -->
                    <div class="preview-section">
                        <button type="button" class="preview-btn" id="preview-btn">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                            </svg>
                            Preview Query
                        </button>
                        <div class="preview-loading hidden" id="preview-loading">
                            <div class="spinner"></div>
                            <span>Executing query...</span>
                        </div>
                        <div class="preview-results hidden" id="preview-results">
                            <div class="preview-header">
                                <span class="preview-count" id="preview-count">0 results</span>
                                <button type="button" class="preview-close" id="preview-close">Close</button>
                            </div>
                            <div class="preview-content" id="preview-content"></div>
                        </div>
                    </div>

                    <!-- Error Display -->
                    <div class="form-error-global hidden" id="global-error"></div>

                    <!-- Action Buttons -->
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" class="btn-primary" id="save-btn">
                            <span class="btn-text">${isEdit ? 'Save Changes' : 'Create Query'}</span>
                            <span class="btn-loading hidden">
                                <div class="spinner-small"></div>
                                Saving...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Form submission
        const form = this.container.querySelector('.editor-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Close button
        const closeBtn = this.container.querySelector('.editor-close-btn');
        closeBtn.addEventListener('click', () => this.handleCancel());

        // Cancel button
        const cancelBtn = this.container.querySelector('#cancel-btn');
        cancelBtn.addEventListener('click', () => this.handleCancel());

        // Query type selection
        const queryTypeInputs = this.container.querySelectorAll('input[name="queryType"]');
        queryTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleQueryTypeChange(e.target.value));
        });

        // Render mode selection
        const renderModeInputs = this.container.querySelectorAll('input[name="renderMode"]');
        renderModeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.formData.renderMode = e.target.value;
                this.updateRenderModeUI();
            });
        });

        // Text inputs
        const labelInput = this.container.querySelector('#query-label');
        labelInput.addEventListener('input', (e) => {
            this.formData.label = e.target.value;
            this.validateField('label', e.target.value);
        });

        const searchTermInput = this.container.querySelector('#search-term');
        searchTermInput.addEventListener('input', (e) => {
            this.formData.searchTerm = e.target.value;
            this.validateField('searchTerm', e.target.value);
        });

        // Select inputs
        const searchModeSelect = this.container.querySelector('#search-mode');
        if (searchModeSelect) {
            searchModeSelect.addEventListener('change', (e) => {
                this.formData.searchMode = e.target.value;
            });
        }

        const collectionSelect = this.container.querySelector('#collection');
        if (collectionSelect) {
            collectionSelect.addEventListener('change', (e) => {
                this.formData.collection = e.target.value;
            });
        }

        const mythologySelect = this.container.querySelector('#mythology');
        if (mythologySelect) {
            mythologySelect.addEventListener('change', (e) => {
                this.formData.mythology = e.target.value;
            });
        }

        // GitHub inputs
        const repoInput = this.container.querySelector('#repository');
        if (repoInput) {
            repoInput.addEventListener('input', (e) => {
                this.formData.repository = e.target.value;
            });
        }

        const branchInput = this.container.querySelector('#branch');
        if (branchInput) {
            branchInput.addEventListener('input', (e) => {
                this.formData.branch = e.target.value;
            });
        }

        const pathFilterInput = this.container.querySelector('#path-filter');
        if (pathFilterInput) {
            pathFilterInput.addEventListener('input', (e) => {
                this.formData.filters.path = e.target.value;
            });
        }

        // Checkbox inputs
        const autoLoadCheckbox = this.container.querySelector('#auto-load');
        autoLoadCheckbox.addEventListener('change', (e) => {
            this.formData.autoLoad = e.target.checked;
        });

        const isPublicCheckbox = this.container.querySelector('#is-public');
        isPublicCheckbox.addEventListener('change', (e) => {
            this.formData.isPublic = e.target.checked;
        });

        // Preview button
        const previewBtn = this.container.querySelector('#preview-btn');
        previewBtn.addEventListener('click', () => this.previewQuery());

        // Preview close
        const previewClose = this.container.querySelector('#preview-close');
        if (previewClose) {
            previewClose.addEventListener('click', () => this.hidePreview());
        }
    }

    /**
     * Handle query type change
     */
    handleQueryTypeChange(queryType) {
        this.formData.queryType = queryType;

        // Update UI
        const typeOptions = this.container.querySelectorAll('.type-option');
        typeOptions.forEach(option => {
            const input = option.querySelector('input');
            option.classList.toggle('selected', input.value === queryType);
        });

        // Show/hide relevant options
        const firebaseOptions = this.container.querySelector('.firebase-options');
        const githubOptions = this.container.querySelector('.github-options');

        if (firebaseOptions) {
            firebaseOptions.classList.toggle('hidden',
                queryType !== 'firebase' && queryType !== 'combined');
        }

        if (githubOptions) {
            githubOptions.classList.toggle('hidden',
                queryType !== 'github' && queryType !== 'combined');
        }
    }

    /**
     * Update render mode UI
     */
    updateRenderModeUI() {
        const renderOptions = this.container.querySelectorAll('.render-option');
        renderOptions.forEach(option => {
            const input = option.querySelector('input');
            option.classList.toggle('selected', input.value === this.formData.renderMode);
        });
    }

    /**
     * Validate a single field
     */
    validateField(field, value) {
        const errorEl = this.container.querySelector(`#${field}-error`);

        switch (field) {
            case 'label':
                if (!value || value.trim().length < 3) {
                    this.errors.label = 'Label must be at least 3 characters';
                } else if (value.length > 100) {
                    this.errors.label = 'Label must be less than 100 characters';
                } else {
                    delete this.errors.label;
                }
                break;

            case 'searchTerm':
                if (!value || value.trim().length < 2) {
                    this.errors.searchTerm = 'Search term must be at least 2 characters';
                } else {
                    delete this.errors.searchTerm;
                }
                break;
        }

        if (errorEl) {
            errorEl.textContent = this.errors[field] || '';
        }

        return !this.errors[field];
    }

    /**
     * Validate entire form
     */
    validateForm() {
        this.validateField('label', this.formData.label);
        this.validateField('searchTerm', this.formData.searchTerm);

        // Additional validations based on query type
        if ((this.formData.queryType === 'github' || this.formData.queryType === 'combined') &&
            !this.formData.repository) {
            this.errors.repository = 'Repository is required for GitHub queries';
        } else {
            delete this.errors.repository;
        }

        return Object.keys(this.errors).length === 0;
    }

    /**
     * Preview the query
     */
    async previewQuery() {
        if (!this.validateForm()) {
            this.showGlobalError('Please fix the errors before previewing');
            return;
        }

        this.showPreviewLoading(true);
        this.hideGlobalError();

        try {
            let results = [];

            if (this.formData.queryType === 'firebase' || this.formData.queryType === 'combined') {
                // Execute Firebase search
                if (this.corpusSearch) {
                    const searchResults = await this.corpusSearch.search(this.formData.searchTerm, {
                        mode: this.formData.searchMode,
                        mythology: this.formData.mythology || null,
                        entityType: this.formData.collection || null,
                        limit: 10
                    });
                    results = results.concat(searchResults.items || []);
                }
            }

            if (this.formData.queryType === 'github' || this.formData.queryType === 'combined') {
                // For GitHub, we just show what would be searched
                results.push({
                    _source: 'github',
                    _preview: true,
                    repository: this.formData.repository,
                    searchTerm: this.formData.searchTerm,
                    message: 'GitHub search will query the specified repository'
                });
            }

            this.previewResults = results;
            this.showPreviewResults(results);

            if (this.options.onPreview) {
                this.options.onPreview(results);
            }

        } catch (error) {
            console.error('[CorpusQueryEditor] Preview error:', error);
            this.showGlobalError('Preview failed: ' + error.message);
        } finally {
            this.showPreviewLoading(false);
        }
    }

    /**
     * Show preview loading state
     */
    showPreviewLoading(show) {
        const loadingEl = this.container.querySelector('#preview-loading');
        const previewBtn = this.container.querySelector('#preview-btn');

        if (loadingEl) {
            loadingEl.classList.toggle('hidden', !show);
        }
        if (previewBtn) {
            previewBtn.disabled = show;
        }
    }

    /**
     * Show preview results
     */
    showPreviewResults(results) {
        const resultsEl = this.container.querySelector('#preview-results');
        const countEl = this.container.querySelector('#preview-count');
        const contentEl = this.container.querySelector('#preview-content');

        if (!resultsEl || !contentEl) return;

        resultsEl.classList.remove('hidden');
        countEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;

        let html = '';
        results.forEach((result, index) => {
            if (result._preview) {
                // GitHub preview placeholder
                html += `
                    <div class="preview-item preview-github">
                        <div class="preview-item-header">
                            <span class="preview-source">GitHub</span>
                            <span class="preview-repo">${this.escapeHtml(result.repository)}</span>
                        </div>
                        <div class="preview-item-content">
                            <p>${this.escapeHtml(result.message)}</p>
                        </div>
                    </div>
                `;
            } else {
                // Firebase result
                html += `
                    <div class="preview-item">
                        <div class="preview-item-header">
                            <span class="preview-name">${this.escapeHtml(result.name || result.title || 'Untitled')}</span>
                            ${result.mythology ? `<span class="preview-mythology">${this.escapeHtml(result.mythology)}</span>` : ''}
                        </div>
                        ${result.shortDescription ? `
                            <div class="preview-item-content">
                                <p>${this.escapeHtml(result.shortDescription.substring(0, 150))}...</p>
                            </div>
                        ` : ''}
                        ${result._searchScore ? `
                            <div class="preview-item-score">
                                Relevance: ${Math.round(result._searchScore)}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        });

        if (results.length === 0) {
            html = '<div class="preview-empty">No results found for this query</div>';
        }

        contentEl.innerHTML = html;
    }

    /**
     * Hide preview
     */
    hidePreview() {
        const resultsEl = this.container.querySelector('#preview-results');
        if (resultsEl) {
            resultsEl.classList.add('hidden');
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            this.showGlobalError('Please fix the errors before saving');
            return;
        }

        this.setLoading(true);
        this.hideGlobalError();

        try {
            await this.saveQuery();

            console.log('[CorpusQueryEditor] Query saved successfully');

            if (this.options.onSave) {
                this.options.onSave(this.formData);
            }

        } catch (error) {
            console.error('[CorpusQueryEditor] Save error:', error);
            this.showGlobalError('Failed to save query: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Save the query to Firestore
     */
    async saveQuery() {
        if (!this.userCorpusQueries) {
            throw new Error('Query service not initialized');
        }

        const queryData = {
            label: this.formData.label.trim(),
            queryType: this.formData.queryType,
            query: {
                searchTerm: this.formData.searchTerm.trim(),
                searchMode: this.formData.searchMode,
                collection: this.formData.collection,
                mythology: this.formData.mythology,
                repository: this.formData.repository,
                branch: this.formData.branch,
                filters: this.formData.filters
            },
            renderMode: this.formData.renderMode,
            autoLoad: this.formData.autoLoad,
            isPublic: this.formData.isPublic,
            entityRef: this.formData.entityRef
        };

        if (this.options.mode === 'edit' && this.formData.id) {
            return await this.userCorpusQueries.updateQuery(this.formData.id, queryData);
        } else {
            return await this.userCorpusQueries.createQuery(queryData);
        }
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (this.options.onCancel) {
            this.options.onCancel();
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const saveBtn = this.container.querySelector('#save-btn');
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoading = saveBtn.querySelector('.btn-loading');

        saveBtn.disabled = loading;
        btnText.classList.toggle('hidden', loading);
        btnLoading.classList.toggle('hidden', !loading);
    }

    /**
     * Show global error
     */
    showGlobalError(message) {
        const errorEl = this.container.querySelector('#global-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    /**
     * Hide global error
     */
    hideGlobalError() {
        const errorEl = this.container.querySelector('#global-error');
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    }

    /**
     * Show error (public method)
     */
    showError(message) {
        this.showGlobalError(message);
    }

    /**
     * Get current form data
     */
    getFormData() {
        return { ...this.formData };
    }

    /**
     * Set form data
     */
    setFormData(data) {
        this.formData = { ...this.getDefaultFormData(), ...data };
        this.render();
        this.attachEventListeners();
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
     * Destroy the editor
     */
    destroy() {
        this.container.innerHTML = '';
        this.previewResults = null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorpusQueryEditor;
}

if (typeof window !== 'undefined') {
    window.CorpusQueryEditor = CorpusQueryEditor;
}
