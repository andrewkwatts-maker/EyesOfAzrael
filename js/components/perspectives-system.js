/**
 * Perspectives System Component
 * Reddit-style community perspectives on mythology assets with corpus citations
 *
 * Features:
 * - Perspective Card with user info, votes, citations
 * - Add Perspective Form with required corpus validation
 * - Perspectives List with sorting/filtering
 * - Nested reply threads (Reddit-style)
 * - Citation validation with verification badges
 * - Quick reactions (Agree, Disagree, Insightful)
 * - Markdown content support
 *
 * Dependencies:
 * - DiscussionValidator (js/services/discussion-validator.js)
 * - CorpusQueryService (js/services/corpus-query-service.js)
 * - VoteService (js/services/vote-service.js)
 * - css/perspectives.css
 */

class PerspectivesSystem {
    /**
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            throw new Error('[PerspectivesSystem] Container element not found');
        }

        // Configuration
        this.options = {
            assetId: options.assetId,
            assetType: options.assetType || 'assets',
            assetName: options.assetName || 'this asset',
            mythology: options.mythology || '',
            collectionPath: options.collectionPath || `perspectives/${options.assetId}/entries`,
            initialSort: options.initialSort || 'best',
            initialFilter: options.initialFilter || 'all',
            pageSize: options.pageSize || 10,
            maxDepth: options.maxDepth || 5,
            requireCorpusCitation: options.requireCorpusCitation !== false,
            onPerspectiveClick: options.onPerspectiveClick || null,
            ...options
        };

        if (!this.options.assetId) {
            throw new Error('[PerspectivesSystem] assetId is required');
        }

        // State
        this.perspectives = [];
        this.sortBy = this.options.initialSort;
        this.filterBy = this.options.initialFilter;
        this.expandedPerspectives = new Set();
        this.collapsedThreads = new Set();
        this.isLoading = false;
        this.hasMore = true;
        this.lastDoc = null;

        // Services
        this.db = null;
        this.auth = null;
        this.corpusService = null;
        this.validator = null;
        this.unsubscribe = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        try {
            // Wait for Firebase
            if (typeof window.waitForFirebase === 'function') {
                await window.waitForFirebase();
            }

            // Initialize Firebase references
            if (typeof firebase !== 'undefined') {
                this.db = firebase.firestore();
                this.auth = firebase.auth();
            }

            // Initialize corpus service
            if (window.CorpusQueryService) {
                this.corpusService = window.corpusQueryService || new window.CorpusQueryService(this.db);
                await this.corpusService.init({});
            }

            // Initialize validator
            if (window.DiscussionValidator) {
                this.validator = new window.DiscussionValidator({
                    assetId: this.options.assetId,
                    assetType: this.options.assetType,
                    mythology: this.options.mythology
                });
            }

            // Render initial UI
            this.render();

            // Load perspectives
            await this.loadPerspectives();

            // Listen for auth changes
            if (this.auth) {
                this.auth.onAuthStateChanged(() => this.renderForm());
            }

            console.log(`[PerspectivesSystem] Initialized for ${this.options.assetId}`);

        } catch (error) {
            console.error('[PerspectivesSystem] Initialization error:', error);
            this.renderError('Failed to initialize perspectives');
        }
    }

    /**
     * Render the main container
     */
    render() {
        this.container.className = 'perspectives-system';
        this.container.innerHTML = `
            <div class="perspectives-header">
                <div class="perspectives-title-section">
                    <svg class="perspectives-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <h3 class="perspectives-title">Community Perspectives</h3>
                    <span class="perspectives-count">(0)</span>
                </div>
                <div class="perspectives-controls">
                    ${this._renderSortDropdown()}
                    ${this._renderFilterDropdown()}
                    <button class="perspectives-collapse-all-btn" title="Collapse all">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 15l-6-6-6 6"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="perspectives-form-container"></div>

            <div class="perspectives-list"></div>

            <div class="perspectives-load-more-container" style="display: none;">
                <button class="perspectives-load-more-btn">
                    <span class="btn-text">Load More Perspectives</span>
                    <span class="btn-loading">
                        <span class="spinner"></span>
                        Loading...
                    </span>
                </button>
            </div>

            <div class="perspectives-empty" style="display: none;">
                <div class="empty-illustration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                </div>
                <h4 class="empty-title">No perspectives yet</h4>
                <p class="empty-subtitle">Be the first to share your insights about ${this._escapeHtml(this.options.assetName)}</p>
            </div>
        `;

        // Bind header events
        this._bindHeaderEvents();

        // Render form
        this.renderForm();
    }

    /**
     * Render sort dropdown
     */
    _renderSortDropdown() {
        return `
            <select class="perspectives-sort-select" aria-label="Sort perspectives">
                <option value="best" ${this.sortBy === 'best' ? 'selected' : ''}>Best</option>
                <option value="new" ${this.sortBy === 'new' ? 'selected' : ''}>New</option>
                <option value="controversial" ${this.sortBy === 'controversial' ? 'selected' : ''}>Controversial</option>
                <option value="old" ${this.sortBy === 'old' ? 'selected' : ''}>Old</option>
            </select>
        `;
    }

    /**
     * Render filter dropdown
     */
    _renderFilterDropdown() {
        return `
            <select class="perspectives-filter-select" aria-label="Filter perspectives">
                <option value="all" ${this.filterBy === 'all' ? 'selected' : ''}>All</option>
                <option value="cited" ${this.filterBy === 'cited' ? 'selected' : ''}>Has Citations</option>
                <option value="verified" ${this.filterBy === 'verified' ? 'selected' : ''}>Verified Only</option>
            </select>
        `;
    }

    /**
     * Bind header control events
     */
    _bindHeaderEvents() {
        // Sort dropdown
        const sortSelect = this.container.querySelector('.perspectives-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.perspectives = [];
                this.lastDoc = null;
                this.loadPerspectives();
            });
        }

        // Filter dropdown
        const filterSelect = this.container.querySelector('.perspectives-filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterBy = e.target.value;
                this.perspectives = [];
                this.lastDoc = null;
                this.loadPerspectives();
            });
        }

        // Collapse all button
        const collapseAllBtn = this.container.querySelector('.perspectives-collapse-all-btn');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => this.toggleCollapseAll());
        }

        // Load more button
        const loadMoreBtn = this.container.querySelector('.perspectives-load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMore());
        }
    }

    /**
     * Render the add perspective form
     */
    renderForm() {
        const formContainer = this.container.querySelector('.perspectives-form-container');
        if (!formContainer) return;

        const user = this.auth?.currentUser;

        formContainer.innerHTML = `
            <div class="perspective-form ${user ? '' : 'logged-out'}">
                ${user ? this._renderAuthenticatedForm(user) : this._renderLoginPrompt()}
            </div>
        `;

        if (user) {
            this._bindFormEvents();
        } else {
            const loginBtn = formContainer.querySelector('.perspective-login-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => this._handleLogin());
            }
        }
    }

    /**
     * Render authenticated form
     */
    _renderAuthenticatedForm(user) {
        return `
            <div class="perspective-form-header">
                <div class="perspective-user-info">
                    ${user.photoURL ? `
                        <img src="${this._escapeAttr(user.photoURL)}" alt="" class="perspective-user-avatar">
                    ` : `
                        <div class="perspective-user-avatar placeholder">${this._getInitials(user.displayName)}</div>
                    `}
                    <span class="perspective-user-name">Share your perspective as ${this._escapeHtml(user.displayName || 'Anonymous')}</span>
                </div>
            </div>

            <form class="perspective-submit-form" novalidate>
                <div class="form-group">
                    <label for="perspective-title-${this.options.assetId}" class="form-label">
                        Title
                        <span class="required-indicator">*</span>
                    </label>
                    <input
                        type="text"
                        id="perspective-title-${this.options.assetId}"
                        name="title"
                        class="form-input"
                        placeholder="Give your perspective a descriptive title..."
                        maxlength="200"
                        required>
                </div>

                <div class="form-group">
                    <label for="perspective-body-${this.options.assetId}" class="form-label">
                        Your Perspective
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="textarea-wrapper">
                        <textarea
                            id="perspective-body-${this.options.assetId}"
                            name="body"
                            class="form-textarea"
                            placeholder="Share your knowledge, interpretation, or insights about ${this._escapeAttr(this.options.assetName)}. Markdown is supported..."
                            rows="6"
                            maxlength="10000"
                            required></textarea>
                        <div class="char-count">
                            <span class="char-current">0</span>/<span class="char-max">10000</span>
                        </div>
                    </div>
                    <p class="form-hint">Supports **bold**, *italic*, and [links](url)</p>
                </div>

                <div class="form-group corpus-group">
                    <label for="perspective-corpus-${this.options.assetId}" class="form-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="corpus-icon">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        Corpus Citation Query
                        <span class="required-indicator">*</span>
                    </label>
                    <div class="corpus-input-wrapper">
                        <input
                            type="text"
                            id="perspective-corpus-${this.options.assetId}"
                            name="corpusQuery"
                            class="form-input"
                            placeholder="Search sacred texts for supporting evidence..."
                            required>
                        <button type="button" class="corpus-search-btn" title="Search corpus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                            </svg>
                        </button>
                    </div>
                    <p class="form-hint">Required: Find primary source evidence to support your perspective</p>
                </div>

                <div class="corpus-preview-container" style="display: none;"></div>

                <div class="validation-container" style="display: none;">
                    <button type="button" class="validate-citation-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        <span class="btn-text">Validate Citation</span>
                        <span class="btn-loading">
                            <span class="spinner"></span>
                            Validating...
                        </span>
                    </button>
                    <div class="validation-status"></div>
                </div>

                <div class="preview-container" style="display: none;">
                    <div class="preview-header">
                        <h5 class="preview-title">Preview</h5>
                        <button type="button" class="preview-close-btn" title="Close preview">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="preview-content"></div>
                </div>

                <div class="form-actions">
                    <button type="button" class="preview-toggle-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Preview
                    </button>
                    <button type="submit" class="submit-perspective-btn" disabled>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                        <span class="btn-text">Submit Perspective</span>
                        <span class="btn-loading">
                            <span class="spinner"></span>
                            Submitting...
                        </span>
                    </button>
                </div>

                <div class="form-error" role="alert" style="display: none;"></div>
            </form>
        `;
    }

    /**
     * Render login prompt
     */
    _renderLoginPrompt() {
        return `
            <div class="perspective-login-prompt">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Sign in to share your perspective</span>
                <button type="button" class="perspective-login-btn">Sign In</button>
            </div>
        `;
    }

    /**
     * Bind form events
     */
    _bindFormEvents() {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form) return;

        // Title input
        const titleInput = form.querySelector('input[name="title"]');
        if (titleInput) {
            titleInput.addEventListener('input', () => this._updateFormState());
        }

        // Body textarea
        const bodyTextarea = form.querySelector('textarea[name="body"]');
        if (bodyTextarea) {
            bodyTextarea.addEventListener('input', () => {
                this._updateCharCount(bodyTextarea);
                this._updateFormState();
            });
        }

        // Corpus query input
        const corpusInput = form.querySelector('input[name="corpusQuery"]');
        if (corpusInput) {
            corpusInput.addEventListener('input', () => this._updateFormState());
            corpusInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._runCorpusSearch();
                }
            });
        }

        // Corpus search button
        const corpusSearchBtn = form.querySelector('.corpus-search-btn');
        if (corpusSearchBtn) {
            corpusSearchBtn.addEventListener('click', () => this._runCorpusSearch());
        }

        // Validate citation button
        const validateBtn = form.querySelector('.validate-citation-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => this._validateCitation());
        }

        // Preview toggle
        const previewToggleBtn = form.querySelector('.preview-toggle-btn');
        if (previewToggleBtn) {
            previewToggleBtn.addEventListener('click', () => this._togglePreview());
        }

        // Preview close
        const previewCloseBtn = form.querySelector('.preview-close-btn');
        if (previewCloseBtn) {
            previewCloseBtn.addEventListener('click', () => this._togglePreview(false));
        }

        // Submit button
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._submitPerspective();
        });
    }

    /**
     * Update character count display
     */
    _updateCharCount(textarea) {
        const charCurrent = this.container.querySelector('.char-current');
        if (charCurrent) {
            const length = textarea.value.length;
            charCurrent.textContent = length;
            charCurrent.classList.toggle('near-limit', length > 9000);
            charCurrent.classList.toggle('over-limit', length > 10000);
        }
    }

    /**
     * Update form state (enable/disable submit)
     */
    _updateFormState() {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form) return;

        const title = form.querySelector('input[name="title"]')?.value?.trim() || '';
        const body = form.querySelector('textarea[name="body"]')?.value?.trim() || '';
        const corpus = form.querySelector('input[name="corpusQuery"]')?.value?.trim() || '';

        const submitBtn = form.querySelector('.submit-perspective-btn');
        const validateContainer = form.querySelector('.validation-container');

        const hasRequiredFields = title.length >= 5 && body.length >= 20 && corpus.length >= 3;

        // Show validation container when fields are filled
        if (validateContainer) {
            validateContainer.style.display = hasRequiredFields ? 'flex' : 'none';
        }

        // Reset validation state when content changes
        this._validationPassed = false;
        this._corpusResults = null;

        if (submitBtn) {
            submitBtn.disabled = !hasRequiredFields || !this._validationPassed;
        }
    }

    /**
     * Run corpus search
     */
    async _runCorpusSearch() {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form) return;

        const corpusInput = form.querySelector('input[name="corpusQuery"]');
        const query = corpusInput?.value?.trim();

        if (!query || query.length < 3) {
            this._showFormError('Please enter at least 3 characters for corpus search');
            return;
        }

        if (!this.corpusService) {
            this._showFormError('Corpus search is not available');
            return;
        }

        const searchBtn = form.querySelector('.corpus-search-btn');
        searchBtn?.classList.add('loading');

        try {
            const result = await this.corpusService.executeQuery({
                queryType: 'combined',
                query: {
                    term: query,
                    options: {
                        maxResults: 10,
                        contextWords: 25
                    }
                }
            });

            this._corpusResults = result;
            this._displayCorpusResults(result);

        } catch (error) {
            console.error('[PerspectivesSystem] Corpus search error:', error);
            this._showFormError('Corpus search failed. Please try again.');
        } finally {
            searchBtn?.classList.remove('loading');
        }
    }

    /**
     * Display corpus search results
     */
    _displayCorpusResults(result) {
        const previewContainer = this.container.querySelector('.corpus-preview-container');
        if (!previewContainer) return;

        const combined = result.combined || [];

        if (combined.length === 0) {
            previewContainer.innerHTML = `
                <div class="corpus-no-results">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>
                    </svg>
                    <p>No results found. Try different search terms.</p>
                </div>
            `;
        } else {
            previewContainer.innerHTML = `
                <div class="corpus-results-header">
                    <span class="corpus-results-count">Found ${combined.length} source${combined.length === 1 ? '' : 's'}</span>
                    <button type="button" class="corpus-results-close" title="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <ul class="corpus-results-list">
                    ${combined.slice(0, 5).map(item => this._renderCorpusResultItem(item)).join('')}
                </ul>
                ${combined.length > 5 ? `<p class="corpus-results-more">+ ${combined.length - 5} more results</p>` : ''}
            `;

            // Bind close button
            const closeBtn = previewContainer.querySelector('.corpus-results-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    previewContainer.style.display = 'none';
                });
            }
        }

        previewContainer.style.display = 'block';
    }

    /**
     * Render corpus result item
     */
    _renderCorpusResultItem(item) {
        const source = item._source || 'unknown';
        const title = item.title || item.name || item.file || 'Unknown Source';
        const context = item.context || item.description || item.excerpt || '';

        return `
            <li class="corpus-result-item" data-source="${this._escapeAttr(source)}">
                <div class="corpus-result-header">
                    <span class="corpus-result-source ${source}">${source}</span>
                    <span class="corpus-result-title">${this._escapeHtml(title)}</span>
                </div>
                ${context ? `<div class="corpus-result-context">${this._escapeHtml(context.substring(0, 200))}${context.length > 200 ? '...' : ''}</div>` : ''}
            </li>
        `;
    }

    /**
     * Validate citation
     */
    async _validateCitation() {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form) return;

        const title = form.querySelector('input[name="title"]')?.value?.trim();
        const body = form.querySelector('textarea[name="body"]')?.value?.trim();
        const corpusQuery = form.querySelector('input[name="corpusQuery"]')?.value?.trim();

        if (!this._corpusResults) {
            await this._runCorpusSearch();
        }

        const validateBtn = form.querySelector('.validate-citation-btn');
        const validationStatus = form.querySelector('.validation-status');
        const submitBtn = form.querySelector('.submit-perspective-btn');

        validateBtn?.classList.add('loading');

        try {
            let validationResult;

            if (this.validator) {
                validationResult = await this.validator.validate({
                    content: `${title}\n\n${body}`,
                    corpusQuery: corpusQuery,
                    corpusResults: this._corpusResults,
                    assetName: this.options.assetName
                });
            } else {
                // Fallback validation
                validationResult = {
                    isValid: this._corpusResults && this._corpusResults.combined?.length > 0,
                    score: this._corpusResults?.combined?.length > 0 ? 0.7 : 0,
                    message: this._corpusResults?.combined?.length > 0
                        ? 'Citation verified. Ready to submit.'
                        : 'No corpus results found. Please adjust your search.'
                };
            }

            this._validationPassed = validationResult.isValid;

            // Update validation status
            if (validationStatus) {
                validationStatus.className = `validation-status ${validationResult.isValid ? 'valid' : 'invalid'}`;
                validationStatus.innerHTML = `
                    <div class="validation-icon">
                        ${validationResult.isValid ? `
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <path d="M22 4L12 14.01l-3-3"/>
                            </svg>
                        ` : `
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M15 9l-6 6M9 9l6 6"/>
                            </svg>
                        `}
                    </div>
                    <div class="validation-message">${this._escapeHtml(validationResult.message)}</div>
                    ${validationResult.score ? `<div class="validation-score">Relevance: ${Math.round(validationResult.score * 100)}%</div>` : ''}
                `;
                validationStatus.style.display = 'flex';
            }

            // Enable/disable submit
            if (submitBtn) {
                submitBtn.disabled = !validationResult.isValid;
            }

        } catch (error) {
            console.error('[PerspectivesSystem] Validation error:', error);
            this._showFormError('Validation failed. Please try again.');
        } finally {
            validateBtn?.classList.remove('loading');
        }
    }

    /**
     * Toggle preview mode
     */
    _togglePreview(show = null) {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form) return;

        const previewContainer = form.querySelector('.preview-container');
        const previewContent = form.querySelector('.preview-content');

        if (!previewContainer || !previewContent) return;

        const shouldShow = show !== null ? show : previewContainer.style.display === 'none';

        if (shouldShow) {
            const title = form.querySelector('input[name="title"]')?.value?.trim() || '';
            const body = form.querySelector('textarea[name="body"]')?.value?.trim() || '';

            previewContent.innerHTML = `
                <h4 class="preview-perspective-title">${this._escapeHtml(title) || '<em>No title</em>'}</h4>
                <div class="preview-perspective-body">${this._renderMarkdown(body) || '<em>No content</em>'}</div>
            `;
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    }

    /**
     * Submit perspective
     */
    async _submitPerspective() {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form || !this._validationPassed) return;

        const submitBtn = form.querySelector('.submit-perspective-btn');
        submitBtn?.classList.add('loading');

        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('Please sign in to submit');
            }

            const title = form.querySelector('input[name="title"]')?.value?.trim();
            const body = form.querySelector('textarea[name="body"]')?.value?.trim();
            const corpusQuery = form.querySelector('input[name="corpusQuery"]')?.value?.trim();

            // Build perspective data
            const perspectiveData = {
                title: title,
                body: body,
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                authorEmail: user.email,
                assetId: this.options.assetId,
                assetType: this.options.assetType,
                mythology: this.options.mythology,
                parentId: null,
                corpusCitation: {
                    query: corpusQuery,
                    resultCount: this._corpusResults?.combined?.length || 0,
                    topResults: (this._corpusResults?.combined || []).slice(0, 3).map(r => ({
                        source: r._source,
                        title: r.title || r.name,
                        excerpt: (r.context || r.description || '').substring(0, 150)
                    })),
                    validatedAt: new Date().toISOString()
                },
                isVerified: true,
                netVotes: 0,
                upvoteCount: 0,
                downvoteCount: 0,
                contestedScore: 0,
                replyCount: 0,
                reactions: {
                    agree: 0,
                    disagree: 0,
                    insightful: 0
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save to Firestore
            const docRef = await this.db.collection(this.options.collectionPath).add(perspectiveData);

            // Reset form
            this._resetForm();

            // Add to local list
            const newPerspective = {
                id: docRef.id,
                ...perspectiveData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.perspectives.unshift(newPerspective);
            this._renderPerspectivesList();

            // Show success toast
            this._showToast('Perspective submitted successfully!');

            console.log('[PerspectivesSystem] Perspective submitted:', docRef.id);

        } catch (error) {
            console.error('[PerspectivesSystem] Submit error:', error);
            this._showFormError(error.message || 'Failed to submit perspective');
        } finally {
            submitBtn?.classList.remove('loading');
        }
    }

    /**
     * Reset form
     */
    _resetForm() {
        const form = this.container.querySelector('.perspective-submit-form');
        if (!form) return;

        form.reset();

        const charCurrent = form.querySelector('.char-current');
        if (charCurrent) charCurrent.textContent = '0';

        const corpusPreview = form.querySelector('.corpus-preview-container');
        if (corpusPreview) corpusPreview.style.display = 'none';

        const validationStatus = form.querySelector('.validation-status');
        if (validationStatus) validationStatus.style.display = 'none';

        const previewContainer = form.querySelector('.preview-container');
        if (previewContainer) previewContainer.style.display = 'none';

        const validationContainer = form.querySelector('.validation-container');
        if (validationContainer) validationContainer.style.display = 'none';

        const submitBtn = form.querySelector('.submit-perspective-btn');
        if (submitBtn) submitBtn.disabled = true;

        this._validationPassed = false;
        this._corpusResults = null;

        this._hideFormError();
    }

    /**
     * Load perspectives from Firestore
     */
    async loadPerspectives() {
        if (this.isLoading) return;

        this.isLoading = true;
        this._showLoading();

        try {
            let query = this.db.collection(this.options.collectionPath)
                .where('parentId', '==', null);

            // Apply sorting
            switch (this.sortBy) {
                case 'best':
                    query = query.orderBy('netVotes', 'desc');
                    break;
                case 'new':
                    query = query.orderBy('createdAt', 'desc');
                    break;
                case 'controversial':
                    query = query.orderBy('contestedScore', 'desc');
                    break;
                case 'old':
                    query = query.orderBy('createdAt', 'asc');
                    break;
                default:
                    query = query.orderBy('netVotes', 'desc');
            }

            // Apply filtering
            if (this.filterBy === 'cited') {
                query = query.where('corpusCitation.resultCount', '>', 0);
            } else if (this.filterBy === 'verified') {
                query = query.where('isVerified', '==', true);
            }

            // Apply pagination
            if (this.lastDoc) {
                query = query.startAfter(this.lastDoc);
            }

            query = query.limit(this.options.pageSize);

            const snapshot = await query.get();

            const newPerspectives = [];
            snapshot.forEach(doc => {
                newPerspectives.push({ id: doc.id, ...doc.data() });
            });

            this.perspectives = [...this.perspectives, ...newPerspectives];
            this.hasMore = newPerspectives.length === this.options.pageSize;
            this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

            this._renderPerspectivesList();
            this._updateCount();

        } catch (error) {
            console.error('[PerspectivesSystem] Load error:', error);
            this.renderError('Failed to load perspectives');
        } finally {
            this.isLoading = false;
            this._hideLoading();
        }
    }

    /**
     * Load more perspectives
     */
    async loadMore() {
        if (!this.hasMore || this.isLoading) return;

        const loadMoreBtn = this.container.querySelector('.perspectives-load-more-btn');
        loadMoreBtn?.classList.add('loading');

        await this.loadPerspectives();

        loadMoreBtn?.classList.remove('loading');
    }

    /**
     * Render perspectives list
     */
    _renderPerspectivesList() {
        const listContainer = this.container.querySelector('.perspectives-list');
        const emptyState = this.container.querySelector('.perspectives-empty');
        const loadMoreContainer = this.container.querySelector('.perspectives-load-more-container');

        if (!listContainer) return;

        if (this.perspectives.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'flex';
            loadMoreContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        loadMoreContainer.style.display = this.hasMore ? 'block' : 'none';

        listContainer.innerHTML = this.perspectives.map(p => this._renderPerspectiveCard(p, 0)).join('');

        // Bind perspective events
        this._bindPerspectiveEvents();
    }

    /**
     * Render a perspective card
     */
    _renderPerspectiveCard(perspective, depth = 0) {
        const user = this.auth?.currentUser;
        const isAuthor = user && user.uid === perspective.authorId;
        const isCollapsed = this.collapsedThreads.has(perspective.id);
        const isExpanded = this.expandedPerspectives.has(perspective.id);
        const depthClass = depth > 0 ? 'nested' : 'root';
        const maxDepthReached = depth >= this.options.maxDepth;

        const timestamp = perspective.createdAt?.toDate
            ? perspective.createdAt.toDate()
            : new Date(perspective.createdAt);

        const timeAgo = this._formatTimeAgo(timestamp);

        return `
            <div class="perspective-card ${depthClass} ${isCollapsed ? 'collapsed' : ''}"
                 data-perspective-id="${perspective.id}"
                 data-depth="${depth}"
                 style="--depth: ${depth}">

                <div class="perspective-vote-column">
                    <button class="perspective-vote-btn upvote ${perspective._userVote === 1 ? 'active' : ''}"
                            data-vote="up"
                            data-perspective-id="${perspective.id}"
                            title="Upvote">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                    </button>
                    <span class="perspective-vote-count ${perspective.netVotes > 0 ? 'positive' : perspective.netVotes < 0 ? 'negative' : ''}">${this._formatVoteCount(perspective.netVotes)}</span>
                    <button class="perspective-vote-btn downvote ${perspective._userVote === -1 ? 'active' : ''}"
                            data-vote="down"
                            data-perspective-id="${perspective.id}"
                            title="Downvote">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12l7 7 7-7"/>
                        </svg>
                    </button>
                </div>

                <div class="perspective-main">
                    <div class="perspective-header">
                        <button class="perspective-collapse-btn" data-collapse="${perspective.id}" title="${isCollapsed ? 'Expand' : 'Collapse'}">
                            [${isCollapsed ? '+' : '-'}]
                        </button>
                        <div class="perspective-author">
                            ${perspective.authorPhoto ? `
                                <img src="${this._escapeAttr(perspective.authorPhoto)}" alt="" class="perspective-author-avatar">
                            ` : `
                                <div class="perspective-author-avatar placeholder">${this._getInitials(perspective.authorName)}</div>
                            `}
                            <span class="perspective-author-name">${this._escapeHtml(perspective.authorName)}</span>
                        </div>
                        ${perspective.isVerified ? `
                            <span class="perspective-verified-badge" title="Citation verified">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <path d="M22 4L12 14.01l-3-3"/>
                                </svg>
                                Verified
                            </span>
                        ` : ''}
                        <span class="perspective-separator">-</span>
                        <time class="perspective-time" datetime="${timestamp.toISOString()}" title="${timestamp.toLocaleString()}">${timeAgo}</time>
                        ${isCollapsed ? `<span class="perspective-collapsed-info">(${perspective.replyCount || 0} replies)</span>` : ''}
                    </div>

                    ${!isCollapsed ? `
                        <h4 class="perspective-title">${this._escapeHtml(perspective.title)}</h4>

                        <div class="perspective-content ${isExpanded ? 'expanded' : ''}">
                            ${this._renderMarkdown(perspective.body)}
                        </div>

                        ${perspective.body.length > 500 && !isExpanded ? `
                            <button class="perspective-expand-btn" data-expand="${perspective.id}">Read more</button>
                        ` : ''}

                        ${perspective.corpusCitation ? `
                            <div class="perspective-citation">
                                <div class="citation-header">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="citation-icon">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                    </svg>
                                    <span class="citation-label">Corpus Citation</span>
                                </div>
                                <div class="citation-query">
                                    <span class="citation-query-label">Query:</span>
                                    <span class="citation-query-text">"${this._escapeHtml(perspective.corpusCitation.query)}"</span>
                                    <span class="citation-result-count">(${perspective.corpusCitation.resultCount} sources)</span>
                                </div>
                                ${perspective.corpusCitation.topResults?.length > 0 ? `
                                    <ul class="citation-sources">
                                        ${perspective.corpusCitation.topResults.slice(0, 2).map(r => `
                                            <li class="citation-source">
                                                <span class="citation-source-badge ${r.source}">${r.source}</span>
                                                <span class="citation-source-title">${this._escapeHtml(r.title)}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        ` : ''}

                        <div class="perspective-actions">
                            ${!maxDepthReached ? `
                                <button class="perspective-action-btn reply-btn" data-reply="${perspective.id}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    Reply
                                </button>
                            ` : ''}

                            <div class="perspective-reactions">
                                <button class="reaction-btn ${perspective._userReaction === 'agree' ? 'active' : ''}" data-reaction="agree" data-perspective-id="${perspective.id}" title="Agree">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                                    </svg>
                                    <span class="reaction-count">${perspective.reactions?.agree || 0}</span>
                                </button>
                                <button class="reaction-btn ${perspective._userReaction === 'disagree' ? 'active' : ''}" data-reaction="disagree" data-perspective-id="${perspective.id}" title="Disagree">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                                    </svg>
                                    <span class="reaction-count">${perspective.reactions?.disagree || 0}</span>
                                </button>
                                <button class="reaction-btn insightful ${perspective._userReaction === 'insightful' ? 'active' : ''}" data-reaction="insightful" data-perspective-id="${perspective.id}" title="Insightful">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2v8M12 18v4M4.93 4.93l5.66 5.66M13.41 13.41l5.66 5.66M2 12h8M18 12h4M4.93 19.07l5.66-5.66M13.41 10.59l5.66-5.66"/>
                                    </svg>
                                    <span class="reaction-count">${perspective.reactions?.insightful || 0}</span>
                                </button>
                            </div>

                            ${isAuthor ? `
                                <button class="perspective-action-btn edit-btn" data-edit="${perspective.id}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Edit
                                </button>
                                <button class="perspective-action-btn delete-btn" data-delete="${perspective.id}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                    Delete
                                </button>
                            ` : ''}
                        </div>

                        <div class="perspective-reply-form-container" data-reply-form="${perspective.id}" style="display: none;"></div>

                        ${perspective._replies && perspective._replies.length > 0 ? `
                            <div class="perspective-replies">
                                ${perspective._replies.map(reply => this._renderPerspectiveCard(reply, depth + 1)).join('')}
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Bind perspective card events
     */
    _bindPerspectiveEvents() {
        const listContainer = this.container.querySelector('.perspectives-list');
        if (!listContainer) return;

        // Vote buttons
        listContainer.querySelectorAll('.perspective-vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const perspectiveId = btn.dataset.perspectiveId;
                const direction = btn.dataset.vote === 'up' ? 1 : -1;
                this._handleVote(perspectiveId, direction);
            });
        });

        // Collapse buttons
        listContainer.querySelectorAll('.perspective-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perspectiveId = btn.dataset.collapse;
                this._toggleCollapse(perspectiveId);
            });
        });

        // Expand content buttons
        listContainer.querySelectorAll('.perspective-expand-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perspectiveId = btn.dataset.expand;
                this.expandedPerspectives.add(perspectiveId);
                this._renderPerspectivesList();
            });
        });

        // Reply buttons
        listContainer.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perspectiveId = btn.dataset.reply;
                this._showReplyForm(perspectiveId);
            });
        });

        // Reaction buttons
        listContainer.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perspectiveId = btn.dataset.perspectiveId;
                const reaction = btn.dataset.reaction;
                this._handleReaction(perspectiveId, reaction);
            });
        });

        // Delete buttons
        listContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const perspectiveId = btn.dataset.delete;
                this._handleDelete(perspectiveId);
            });
        });
    }

    /**
     * Handle vote
     */
    async _handleVote(perspectiveId, direction) {
        const user = this.auth?.currentUser;
        if (!user) {
            this._showToast('Please sign in to vote');
            return;
        }

        try {
            // Update UI optimistically
            const perspective = this.perspectives.find(p => p.id === perspectiveId);
            if (!perspective) return;

            const previousVote = perspective._userVote || 0;
            const newVote = previousVote === direction ? 0 : direction;

            // Calculate vote change
            let voteChange = 0;
            if (previousVote === direction) {
                voteChange = -direction;
            } else if (previousVote === -direction) {
                voteChange = direction * 2;
            } else {
                voteChange = direction;
            }

            perspective._userVote = newVote;
            perspective.netVotes += voteChange;

            this._renderPerspectivesList();

            // Update Firestore
            await this.db.collection(this.options.collectionPath).doc(perspectiveId).update({
                netVotes: firebase.firestore.FieldValue.increment(voteChange),
                [`upvoteCount`]: firebase.firestore.FieldValue.increment(direction === 1 && newVote === 1 ? 1 : (direction === 1 && newVote === 0 ? -1 : 0)),
                [`downvoteCount`]: firebase.firestore.FieldValue.increment(direction === -1 && newVote === -1 ? 1 : (direction === -1 && newVote === 0 ? -1 : 0))
            });

            // Record user vote
            await this.db.collection(`${this.options.collectionPath}/${perspectiveId}/votes`).doc(user.uid).set({
                vote: newVote,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('[PerspectivesSystem] Vote error:', error);
            this._showToast('Failed to record vote');
        }
    }

    /**
     * Handle reaction
     */
    async _handleReaction(perspectiveId, reactionType) {
        const user = this.auth?.currentUser;
        if (!user) {
            this._showToast('Please sign in to react');
            return;
        }

        try {
            const perspective = this.perspectives.find(p => p.id === perspectiveId);
            if (!perspective) return;

            const previousReaction = perspective._userReaction;
            const newReaction = previousReaction === reactionType ? null : reactionType;

            // Update UI optimistically
            if (!perspective.reactions) perspective.reactions = { agree: 0, disagree: 0, insightful: 0 };

            if (previousReaction) {
                perspective.reactions[previousReaction]--;
            }
            if (newReaction) {
                perspective.reactions[newReaction]++;
            }
            perspective._userReaction = newReaction;

            this._renderPerspectivesList();

            // Update Firestore
            const updates = {};
            if (previousReaction) {
                updates[`reactions.${previousReaction}`] = firebase.firestore.FieldValue.increment(-1);
            }
            if (newReaction) {
                updates[`reactions.${newReaction}`] = firebase.firestore.FieldValue.increment(1);
            }

            await this.db.collection(this.options.collectionPath).doc(perspectiveId).update(updates);

            // Record user reaction
            await this.db.collection(`${this.options.collectionPath}/${perspectiveId}/reactions`).doc(user.uid).set({
                reaction: newReaction,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('[PerspectivesSystem] Reaction error:', error);
            this._showToast('Failed to record reaction');
        }
    }

    /**
     * Toggle collapse state
     */
    _toggleCollapse(perspectiveId) {
        if (this.collapsedThreads.has(perspectiveId)) {
            this.collapsedThreads.delete(perspectiveId);
        } else {
            this.collapsedThreads.add(perspectiveId);
        }
        this._renderPerspectivesList();
    }

    /**
     * Toggle collapse all
     */
    toggleCollapseAll() {
        if (this.collapsedThreads.size === this.perspectives.length) {
            // Expand all
            this.collapsedThreads.clear();
        } else {
            // Collapse all
            this.perspectives.forEach(p => this.collapsedThreads.add(p.id));
        }
        this._renderPerspectivesList();
    }

    /**
     * Show reply form
     */
    _showReplyForm(parentId) {
        const container = this.container.querySelector(`[data-reply-form="${parentId}"]`);
        if (!container) return;

        const user = this.auth?.currentUser;
        if (!user) {
            this._showToast('Please sign in to reply');
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <form class="perspective-reply-form" data-parent-id="${parentId}">
                <div class="reply-form-header">
                    <span class="reply-to-label">Replying to thread</span>
                </div>
                <textarea
                    class="reply-textarea"
                    placeholder="Share your thoughts (corpus citation required)..."
                    rows="3"
                    required></textarea>
                <div class="reply-corpus-group">
                    <input
                        type="text"
                        class="reply-corpus-input"
                        placeholder="Corpus search query..."
                        required>
                    <button type="button" class="reply-corpus-search-btn" title="Search">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                        </svg>
                    </button>
                </div>
                <div class="reply-corpus-preview" style="display: none;"></div>
                <div class="reply-form-actions">
                    <button type="button" class="reply-cancel-btn">Cancel</button>
                    <button type="submit" class="reply-submit-btn" disabled>
                        <span class="btn-text">Reply</span>
                        <span class="btn-loading">
                            <span class="spinner"></span>
                        </span>
                    </button>
                </div>
            </form>
        `;

        // Bind reply form events
        const form = container.querySelector('.perspective-reply-form');
        const textarea = form.querySelector('.reply-textarea');
        const corpusInput = form.querySelector('.reply-corpus-input');
        const searchBtn = form.querySelector('.reply-corpus-search-btn');
        const cancelBtn = form.querySelector('.reply-cancel-btn');
        const submitBtn = form.querySelector('.reply-submit-btn');

        textarea.addEventListener('input', () => {
            submitBtn.disabled = textarea.value.trim().length < 10 || !form._corpusResults;
        });

        searchBtn.addEventListener('click', async () => {
            const query = corpusInput.value.trim();
            if (query.length < 3) return;

            searchBtn.classList.add('loading');
            try {
                const result = await this.corpusService.executeQuery({
                    queryType: 'combined',
                    query: { term: query, options: { maxResults: 5 } }
                });
                form._corpusResults = result;

                const preview = form.querySelector('.reply-corpus-preview');
                preview.innerHTML = `<span class="corpus-found">${result.combined?.length || 0} sources found</span>`;
                preview.style.display = 'block';

                submitBtn.disabled = textarea.value.trim().length < 10 || !result.combined?.length;
            } catch (error) {
                console.error('Reply corpus search error:', error);
            } finally {
                searchBtn.classList.remove('loading');
            }
        });

        cancelBtn.addEventListener('click', () => {
            container.style.display = 'none';
            container.innerHTML = '';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this._submitReply(parentId, form);
        });

        textarea.focus();
    }

    /**
     * Submit reply
     */
    async _submitReply(parentId, form) {
        const user = this.auth?.currentUser;
        if (!user) return;

        const textarea = form.querySelector('.reply-textarea');
        const corpusInput = form.querySelector('.reply-corpus-input');
        const submitBtn = form.querySelector('.reply-submit-btn');

        submitBtn.classList.add('loading');

        try {
            const replyData = {
                title: '',
                body: textarea.value.trim(),
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                authorEmail: user.email,
                assetId: this.options.assetId,
                assetType: this.options.assetType,
                mythology: this.options.mythology,
                parentId: parentId,
                corpusCitation: {
                    query: corpusInput.value.trim(),
                    resultCount: form._corpusResults?.combined?.length || 0,
                    topResults: (form._corpusResults?.combined || []).slice(0, 2).map(r => ({
                        source: r._source,
                        title: r.title || r.name,
                        excerpt: (r.context || '').substring(0, 100)
                    })),
                    validatedAt: new Date().toISOString()
                },
                isVerified: form._corpusResults?.combined?.length > 0,
                netVotes: 0,
                upvoteCount: 0,
                downvoteCount: 0,
                replyCount: 0,
                reactions: { agree: 0, disagree: 0, insightful: 0 },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection(this.options.collectionPath).add(replyData);

            // Update parent reply count
            await this.db.collection(this.options.collectionPath).doc(parentId).update({
                replyCount: firebase.firestore.FieldValue.increment(1)
            });

            // Hide form
            const container = form.closest('[data-reply-form]');
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }

            // Reload perspectives
            this.perspectives = [];
            this.lastDoc = null;
            await this.loadPerspectives();

            this._showToast('Reply submitted!');

        } catch (error) {
            console.error('[PerspectivesSystem] Reply error:', error);
            this._showToast('Failed to submit reply');
        } finally {
            submitBtn.classList.remove('loading');
        }
    }

    /**
     * Handle delete
     */
    async _handleDelete(perspectiveId) {
        if (!confirm('Are you sure you want to delete this perspective?')) return;

        try {
            await this.db.collection(this.options.collectionPath).doc(perspectiveId).delete();

            this.perspectives = this.perspectives.filter(p => p.id !== perspectiveId);
            this._renderPerspectivesList();
            this._updateCount();

            this._showToast('Perspective deleted');

        } catch (error) {
            console.error('[PerspectivesSystem] Delete error:', error);
            this._showToast('Failed to delete perspective');
        }
    }

    /**
     * Update perspectives count
     */
    _updateCount() {
        const countEl = this.container.querySelector('.perspectives-count');
        if (countEl) {
            countEl.textContent = `(${this.perspectives.length})`;
        }
    }

    // ==================== UI HELPERS ====================

    _showLoading() {
        const list = this.container.querySelector('.perspectives-list');
        if (list && this.perspectives.length === 0) {
            list.innerHTML = `
                <div class="perspectives-loading">
                    <div class="perspectives-spinner"></div>
                    <span>Loading perspectives...</span>
                </div>
            `;
        }
    }

    _hideLoading() {
        const loading = this.container.querySelector('.perspectives-loading');
        if (loading) loading.remove();
    }

    renderError(message) {
        const list = this.container.querySelector('.perspectives-list');
        if (list) {
            list.innerHTML = `
                <div class="perspectives-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                    <p>${this._escapeHtml(message)}</p>
                    <button class="perspectives-retry-btn" onclick="this.closest('.perspectives-system').__component?.loadPerspectives()">Retry</button>
                </div>
            `;
        }
    }

    _showFormError(message) {
        const errorEl = this.container.querySelector('.form-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    _hideFormError() {
        const errorEl = this.container.querySelector('.form-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    _showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.perspectives-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'perspectives-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    _handleLogin() {
        const event = new CustomEvent('requestLogin', {
            bubbles: true,
            detail: { source: 'perspectives-system' }
        });
        this.container.dispatchEvent(event);

        if (window.FirebaseService?.signInWithGoogle) {
            window.FirebaseService.signInWithGoogle();
        }
    }

    // ==================== FORMATTERS ====================

    _renderMarkdown(text) {
        if (!text) return '';
        let html = this._escapeHtml(text);

        // Line breaks
        html = html.replace(/\n/g, '<br>');
        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        // Blockquotes
        html = html.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');

        return html;
    }

    _formatTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
        return `${Math.floor(seconds / 31536000)}y ago`;
    }

    _formatVoteCount(count) {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return count.toString();
    }

    _getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    _escapeHtml(str) {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    _escapeAttr(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Destroy component
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.container.innerHTML = '';
        console.log('[PerspectivesSystem] Destroyed');
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerspectivesSystem };
}

// Global export
if (typeof window !== 'undefined') {
    window.PerspectivesSystem = PerspectivesSystem;
}
