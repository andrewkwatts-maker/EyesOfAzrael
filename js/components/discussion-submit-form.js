/**
 * Discussion Submit Form Component
 * Form for submitting new comments with required corpus search validation
 *
 * Features:
 * - Text input for user perspective/comment
 * - REQUIRED corpus search query input
 * - "Validate & Preview" button with AI validation
 * - Preview of contribution with corpus results
 * - Submit only enabled after validation passes
 * - Reply form mode for inline replies
 * - Character counting and limits
 * - Markdown preview
 *
 * Dependencies:
 * - CorpusQueryService (js/services/corpus-query-service.js)
 * - DiscussionValidator (js/services/discussion-validator.js)
 * - discussion-system.css
 */

class DiscussionSubmitForm {
    /**
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            throw new Error('[DiscussionSubmitForm] Container element not found');
        }

        // Configuration
        this.options = {
            assetId: options.assetId,
            assetType: options.assetType || 'assets',
            assetName: options.assetName || 'this asset',
            mythology: options.mythology || '',
            parentId: options.parentId || null,
            isReply: options.isReply || false,
            placeholder: options.placeholder || 'Share your perspective...',
            minContentLength: options.minContentLength || 10,
            maxContentLength: options.maxContentLength || 5000,
            minQueryLength: options.minQueryLength || 3,
            requireCorpusQuery: options.requireCorpusQuery !== false,
            onSubmit: options.onSubmit || (() => {}),
            onCancel: options.onCancel || (() => {}),
            ...options
        };

        if (!this.options.assetId) {
            throw new Error('[DiscussionSubmitForm] assetId is required');
        }

        // State
        this.isValidating = false;
        this.isSubmitting = false;
        this.isValidated = false;
        this.validationResult = null;
        this.corpusResults = null;
        this.previewMode = false;

        // Services
        this.db = null;
        this.auth = null;
        this.corpusService = null;
        this.validator = null;

        // UI elements
        this.formEl = null;
        this.contentInput = null;
        this.corpusQueryInput = null;
        this.charCountEl = null;
        this.validateBtn = null;
        this.submitBtn = null;
        this.cancelBtn = null;
        this.previewContainer = null;
        this.corpusPreviewContainer = null;
        this.validationStatusEl = null;
        this.errorEl = null;

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

            // Render UI
            this.render();

            console.log(`[DiscussionSubmitForm] Initialized for ${this.options.assetId}`);

        } catch (error) {
            console.error('[DiscussionSubmitForm] Initialization error:', error);
        }
    }

    /**
     * Render the form
     */
    render() {
        const isReply = this.options.isReply;

        this.container.className = `discussion-submit-form ${isReply ? 'reply-form' : 'main-form'}`;
        this.container.innerHTML = `
            <form class="submit-form" novalidate>
                ${!isReply ? `
                    <div class="form-header">
                        <h4 class="form-title">Share Your Perspective</h4>
                        <p class="form-subtitle">
                            Contribute your insights about ${this._escapeHtml(this.options.assetName)}.
                            All contributions require a corpus search citation for verification.
                        </p>
                    </div>
                ` : ''}

                <div class="form-auth-check">
                    ${this.auth?.currentUser ? `
                        <div class="form-user-info">
                            ${this.auth.currentUser.photoURL ? `
                                <img src="${this._escapeAttr(this.auth.currentUser.photoURL)}"
                                     alt=""
                                     class="form-user-avatar">
                            ` : `
                                <div class="form-user-avatar placeholder">
                                    ${this._getInitials(this.auth.currentUser.displayName)}
                                </div>
                            `}
                            <span class="form-user-name">
                                Commenting as ${this._escapeHtml(this.auth.currentUser.displayName || 'Anonymous')}
                            </span>
                        </div>
                    ` : `
                        <div class="form-login-prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>Sign in to join the discussion</span>
                            <button type="button" class="form-login-btn">Sign In</button>
                        </div>
                    `}
                </div>

                ${this.auth?.currentUser ? `
                    <div class="form-fields">
                        <div class="form-group content-group">
                            <label for="discussion-content-${this.options.assetId}" class="form-label">
                                Your Perspective
                                <span class="required-indicator">*</span>
                            </label>
                            <div class="textarea-wrapper">
                                <textarea
                                    id="discussion-content-${this.options.assetId}"
                                    class="form-textarea"
                                    name="content"
                                    placeholder="${this._escapeAttr(this.options.placeholder)}"
                                    maxlength="${this.options.maxContentLength}"
                                    rows="${isReply ? 3 : 5}"
                                    required
                                    aria-describedby="content-hint-${this.options.assetId}"></textarea>
                                <div class="char-count">
                                    <span class="char-current">0</span>/<span class="char-max">${this.options.maxContentLength}</span>
                                </div>
                            </div>
                            <p id="content-hint-${this.options.assetId}" class="form-hint">
                                Share your knowledge, interpretation, or perspective. Markdown formatting is supported (*italic*, **bold**).
                            </p>
                        </div>

                        <div class="form-group corpus-group">
                            <label for="corpus-query-${this.options.assetId}" class="form-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="corpus-icon">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                                Corpus Search Query
                                <span class="required-indicator">*</span>
                            </label>
                            <div class="corpus-input-wrapper">
                                <input
                                    type="text"
                                    id="corpus-query-${this.options.assetId}"
                                    class="form-input"
                                    name="corpusQuery"
                                    placeholder="Enter search terms to find supporting evidence..."
                                    required
                                    aria-describedby="corpus-hint-${this.options.assetId}">
                                <button type="button" class="corpus-search-btn" title="Search corpus">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="M21 21l-4.35-4.35"/>
                                    </svg>
                                </button>
                            </div>
                            <p id="corpus-hint-${this.options.assetId}" class="form-hint">
                                Enter a search query to find evidence in sacred texts supporting your perspective.
                                This helps ensure contributions are grounded in primary sources.
                            </p>
                        </div>

                        <div class="corpus-preview-container" style="display: none;">
                            <div class="corpus-preview-header">
                                <h5 class="corpus-preview-title">Corpus Search Results</h5>
                                <button type="button" class="corpus-preview-close" title="Clear results">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="corpus-preview-results"></div>
                        </div>

                        <div class="validation-status" style="display: none;">
                            <div class="validation-icon"></div>
                            <div class="validation-message"></div>
                        </div>

                        <div class="preview-container" style="display: none;">
                            <div class="preview-header">
                                <h5 class="preview-title">Preview</h5>
                                <button type="button" class="preview-toggle" title="Toggle preview">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                    Preview
                                </button>
                            </div>
                            <div class="preview-content"></div>
                        </div>

                        <div class="form-actions">
                            ${isReply ? `
                                <button type="button" class="form-btn cancel-btn">
                                    Cancel
                                </button>
                            ` : ''}

                            <button type="button" class="form-btn validate-btn" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                                <span class="btn-text">Validate & Preview</span>
                                <span class="btn-loading">
                                    <span class="spinner"></span>
                                    Validating...
                                </span>
                            </button>

                            <button type="submit" class="form-btn submit-btn" disabled>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                </svg>
                                <span class="btn-text">${isReply ? 'Reply' : 'Submit'}</span>
                                <span class="btn-loading">
                                    <span class="spinner"></span>
                                    Submitting...
                                </span>
                            </button>
                        </div>
                    </div>

                    <div class="form-error" role="alert" style="display: none;"></div>
                ` : ''}
            </form>
        `;

        // Get element references
        this.formEl = this.container.querySelector('.submit-form');
        this.contentInput = this.container.querySelector('.form-textarea');
        this.corpusQueryInput = this.container.querySelector('.form-input[name="corpusQuery"]');
        this.charCountEl = this.container.querySelector('.char-current');
        this.validateBtn = this.container.querySelector('.validate-btn');
        this.submitBtn = this.container.querySelector('.submit-btn');
        this.cancelBtn = this.container.querySelector('.cancel-btn');
        this.previewContainer = this.container.querySelector('.preview-container');
        this.corpusPreviewContainer = this.container.querySelector('.corpus-preview-container');
        this.validationStatusEl = this.container.querySelector('.validation-status');
        this.errorEl = this.container.querySelector('.form-error');

        // Bind events
        this._bindEvents();
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        // Login button
        const loginBtn = this.container.querySelector('.form-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this._handleLogin());
        }

        // Content input
        if (this.contentInput) {
            this.contentInput.addEventListener('input', () => this._handleContentChange());
            this.contentInput.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Enter to validate
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!this.validateBtn.disabled) {
                        this._handleValidate();
                    }
                }
            });
        }

        // Corpus query input
        if (this.corpusQueryInput) {
            this.corpusQueryInput.addEventListener('input', () => this._handleQueryChange());
            this.corpusQueryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this._runCorpusSearch();
                }
            });
        }

        // Corpus search button
        const corpusSearchBtn = this.container.querySelector('.corpus-search-btn');
        if (corpusSearchBtn) {
            corpusSearchBtn.addEventListener('click', () => this._runCorpusSearch());
        }

        // Corpus preview close
        const corpusCloseBtn = this.container.querySelector('.corpus-preview-close');
        if (corpusCloseBtn) {
            corpusCloseBtn.addEventListener('click', () => {
                this.corpusPreviewContainer.style.display = 'none';
                this.corpusResults = null;
            });
        }

        // Validate button
        if (this.validateBtn) {
            this.validateBtn.addEventListener('click', () => this._handleValidate());
        }

        // Submit button
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._handleSubmit();
            });
        }

        // Cancel button
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                this.options.onCancel();
            });
        }

        // Form submit
        if (this.formEl) {
            this.formEl.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.submitBtn.disabled) {
                    this._handleSubmit();
                }
            });
        }

        // Preview toggle
        const previewToggle = this.container.querySelector('.preview-toggle');
        if (previewToggle) {
            previewToggle.addEventListener('click', () => {
                this.previewMode = !this.previewMode;
                this._updatePreview();
            });
        }
    }

    /**
     * Handle content input change
     */
    _handleContentChange() {
        const content = this.contentInput.value;
        const length = content.length;

        // Update character count
        if (this.charCountEl) {
            this.charCountEl.textContent = length;
            this.charCountEl.classList.toggle('over-limit', length > this.options.maxContentLength);
            this.charCountEl.classList.toggle('near-limit', length > this.options.maxContentLength * 0.9);
        }

        // Reset validation when content changes
        if (this.isValidated) {
            this.isValidated = false;
            this._updateValidationStatus(null);
            this.submitBtn.disabled = true;
        }

        // Update validate button state
        this._updateValidateButtonState();

        // Update preview
        if (this.previewMode) {
            this._updatePreview();
        }
    }

    /**
     * Handle corpus query input change
     */
    _handleQueryChange() {
        // Reset validation when query changes
        if (this.isValidated) {
            this.isValidated = false;
            this._updateValidationStatus(null);
            this.submitBtn.disabled = true;
        }

        // Update validate button state
        this._updateValidateButtonState();
    }

    /**
     * Update validate button state
     */
    _updateValidateButtonState() {
        const content = this.contentInput?.value?.trim() || '';
        const query = this.corpusQueryInput?.value?.trim() || '';

        const contentValid = content.length >= this.options.minContentLength;
        const queryValid = !this.options.requireCorpusQuery || query.length >= this.options.minQueryLength;

        this.validateBtn.disabled = !contentValid || !queryValid || this.isValidating;
    }

    /**
     * Run corpus search
     */
    async _runCorpusSearch() {
        const query = this.corpusQueryInput?.value?.trim();
        if (!query || query.length < this.options.minQueryLength) {
            this._showError('Please enter a search query with at least 3 characters.');
            return;
        }

        if (!this.corpusService) {
            this._showError('Corpus search is not available.');
            return;
        }

        // Show loading state
        const searchBtn = this.container.querySelector('.corpus-search-btn');
        searchBtn?.classList.add('loading');

        try {
            // Execute combined search (GitHub + Firebase)
            const result = await this.corpusService.executeQuery({
                queryType: 'combined',
                query: {
                    term: query,
                    options: {
                        maxResults: 10,
                        contextWords: 20
                    }
                }
            });

            this.corpusResults = result;

            // Display results
            this._displayCorpusResults(result);

        } catch (error) {
            console.error('[DiscussionSubmitForm] Corpus search error:', error);
            this._showError('Failed to search corpus. Please try again.');
        } finally {
            searchBtn?.classList.remove('loading');
        }
    }

    /**
     * Display corpus search results
     */
    _displayCorpusResults(result) {
        if (!this.corpusPreviewContainer) return;

        const resultsContainer = this.corpusPreviewContainer.querySelector('.corpus-preview-results');
        const combined = result.combined || [];

        if (combined.length === 0) {
            resultsContainer.innerHTML = `
                <div class="corpus-no-results">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>
                    </svg>
                    <p>No results found for this query.</p>
                    <p class="hint">Try different search terms or broaden your query.</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = `
                <div class="corpus-results-count">
                    Found ${combined.length} result${combined.length === 1 ? '' : 's'}
                </div>
                <ul class="corpus-results-list">
                    ${combined.slice(0, 5).map(item => this._renderCorpusResult(item)).join('')}
                </ul>
                ${combined.length > 5 ? `
                    <p class="corpus-results-more">
                        + ${combined.length - 5} more results
                    </p>
                ` : ''}
            `;
        }

        this.corpusPreviewContainer.style.display = 'block';
    }

    /**
     * Render a single corpus result
     */
    _renderCorpusResult(item) {
        const source = item._source || 'unknown';
        const title = item.title || item.name || item.file || 'Unknown Source';
        const context = item.context || item.description || item.excerpt || '';
        const highlights = item.highlights || [];

        return `
            <li class="corpus-result-item" data-source="${this._escapeAttr(source)}">
                <div class="corpus-result-header">
                    <span class="corpus-result-source ${source}">${source}</span>
                    <span class="corpus-result-title">${this._escapeHtml(title)}</span>
                </div>
                ${context ? `
                    <div class="corpus-result-context">
                        ${this._highlightText(context, highlights)}
                    </div>
                ` : ''}
            </li>
        `;
    }

    /**
     * Highlight text with search matches
     */
    _highlightText(text, highlights) {
        let html = this._escapeHtml(text);
        if (highlights && highlights.length > 0) {
            highlights.forEach(term => {
                const regex = new RegExp(`(${this._escapeRegex(term)})`, 'gi');
                html = html.replace(regex, '<mark>$1</mark>');
            });
        }
        return html;
    }

    /**
     * Handle validation
     */
    async _handleValidate() {
        if (this.isValidating) return;

        const content = this.contentInput?.value?.trim();
        const query = this.corpusQueryInput?.value?.trim();

        if (!content || content.length < this.options.minContentLength) {
            this._showError(`Please enter at least ${this.options.minContentLength} characters.`);
            return;
        }

        if (this.options.requireCorpusQuery && (!query || query.length < this.options.minQueryLength)) {
            this._showError('Please enter a corpus search query.');
            return;
        }

        this.isValidating = true;
        this.validateBtn.classList.add('loading');
        this._hideError();

        try {
            // Run corpus search if not already done
            if (!this.corpusResults && query) {
                await this._runCorpusSearch();
            }

            // Validate with AI
            if (this.validator) {
                const validationResult = await this.validator.validate({
                    content: content,
                    corpusQuery: query,
                    corpusResults: this.corpusResults,
                    assetName: this.options.assetName
                });

                this.validationResult = validationResult;
                this.isValidated = validationResult.isValid;

                // Update UI
                this._updateValidationStatus(validationResult);

                if (validationResult.isValid) {
                    this.submitBtn.disabled = false;
                    this._updatePreview();
                } else {
                    this.submitBtn.disabled = true;
                    this._showError(validationResult.message || 'Validation failed. Please revise your contribution.');
                }
            } else {
                // No validator available - allow submission with corpus results
                if (this.corpusResults && this.corpusResults.combined?.length > 0) {
                    this.isValidated = true;
                    this.submitBtn.disabled = false;
                    this._updateValidationStatus({
                        isValid: true,
                        message: 'Corpus citation verified. Ready to submit.'
                    });
                    this._updatePreview();
                } else {
                    this._showError('No corpus results found. Please adjust your search query.');
                }
            }

        } catch (error) {
            console.error('[DiscussionSubmitForm] Validation error:', error);
            this._showError('Validation failed. Please try again.');
        } finally {
            this.isValidating = false;
            this.validateBtn.classList.remove('loading');
        }
    }

    /**
     * Handle submission
     */
    async _handleSubmit() {
        if (this.isSubmitting || !this.isValidated) return;

        const content = this.contentInput?.value?.trim();
        const query = this.corpusQueryInput?.value?.trim();

        if (!content) {
            this._showError('Please enter your perspective.');
            return;
        }

        if (!this.auth?.currentUser) {
            this._showError('Please sign in to submit.');
            return;
        }

        this.isSubmitting = true;
        this.submitBtn.classList.add('loading');
        this._hideError();

        try {
            const user = this.auth.currentUser;
            const collectionPath = `discussions/${this.options.assetId}/comments`;

            // Prepare comment data
            const commentData = {
                content: content,
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                authorEmail: user.email,
                assetId: this.options.assetId,
                assetType: this.options.assetType,
                mythology: this.options.mythology,
                parentId: this.options.parentId || null,
                corpusQuery: this.corpusResults ? {
                    term: query,
                    id: this.corpusResults.metadata?.queryId || null,
                    resultCount: this.corpusResults.combined?.length || 0,
                    executedAt: this.corpusResults.metadata?.executedAt || new Date().toISOString()
                } : null,
                validationResult: this.validationResult ? {
                    isValid: this.validationResult.isValid,
                    score: this.validationResult.score,
                    validatedAt: new Date().toISOString()
                } : null,
                netVotes: 0,
                upvoteCount: 0,
                downvoteCount: 0,
                contestedScore: 0,
                replyCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add to Firestore
            const docRef = await this.db.collection(collectionPath).add(commentData);

            // Create comment object with ID for callback
            const comment = {
                id: docRef.id,
                ...commentData,
                createdAt: new Date() // Local timestamp for immediate display
            };

            // Update parent's reply count if this is a reply
            if (this.options.parentId) {
                await this.db.collection(collectionPath).doc(this.options.parentId).update({
                    replyCount: firebase.firestore.FieldValue.increment(1)
                });
            }

            // Reset form
            this._resetForm();

            // Notify parent component
            this.options.onSubmit(comment);

            console.log('[DiscussionSubmitForm] Comment submitted:', docRef.id);

        } catch (error) {
            console.error('[DiscussionSubmitForm] Submit error:', error);
            this._showError('Failed to submit comment. Please try again.');
        } finally {
            this.isSubmitting = false;
            this.submitBtn.classList.remove('loading');
        }
    }

    /**
     * Update validation status UI
     */
    _updateValidationStatus(result) {
        if (!this.validationStatusEl) return;

        if (!result) {
            this.validationStatusEl.style.display = 'none';
            return;
        }

        const iconEl = this.validationStatusEl.querySelector('.validation-icon');
        const messageEl = this.validationStatusEl.querySelector('.validation-message');

        this.validationStatusEl.className = `validation-status ${result.isValid ? 'valid' : 'invalid'}`;

        if (result.isValid) {
            iconEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                </svg>
            `;
        } else {
            iconEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
            `;
        }

        messageEl.textContent = result.message || (result.isValid ? 'Validated' : 'Not validated');
        this.validationStatusEl.style.display = 'flex';
    }

    /**
     * Update content preview
     */
    _updatePreview() {
        if (!this.previewContainer) return;

        const content = this.contentInput?.value || '';
        const previewContent = this.previewContainer.querySelector('.preview-content');

        if (this.previewMode && content) {
            previewContent.innerHTML = this._renderMarkdown(content);
            this.previewContainer.style.display = 'block';
        } else {
            this.previewContainer.style.display = 'none';
        }
    }

    /**
     * Simple markdown rendering
     */
    _renderMarkdown(text) {
        let html = this._escapeHtml(text);

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        return html;
    }

    /**
     * Reset form to initial state
     */
    _resetForm() {
        if (this.contentInput) {
            this.contentInput.value = '';
        }
        if (this.corpusQueryInput) {
            this.corpusQueryInput.value = '';
        }
        if (this.charCountEl) {
            this.charCountEl.textContent = '0';
        }

        this.isValidated = false;
        this.validationResult = null;
        this.corpusResults = null;
        this.previewMode = false;

        this.validateBtn.disabled = true;
        this.submitBtn.disabled = true;

        this._updateValidationStatus(null);

        if (this.previewContainer) {
            this.previewContainer.style.display = 'none';
        }
        if (this.corpusPreviewContainer) {
            this.corpusPreviewContainer.style.display = 'none';
        }

        this._hideError();
    }

    /**
     * Handle login
     */
    _handleLogin() {
        const event = new CustomEvent('requestLogin', {
            bubbles: true,
            detail: { source: 'discussion-submit-form' }
        });
        this.container.dispatchEvent(event);

        if (window.FirebaseService?.signInWithGoogle) {
            window.FirebaseService.signInWithGoogle();
        }
    }

    /**
     * Show error message
     */
    _showError(message) {
        if (this.errorEl) {
            this.errorEl.textContent = message;
            this.errorEl.style.display = 'block';
        }
    }

    /**
     * Hide error message
     */
    _hideError() {
        if (this.errorEl) {
            this.errorEl.style.display = 'none';
        }
    }

    // ==================== Helper Methods ====================

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

    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Destroy component
     */
    destroy() {
        this.container.innerHTML = '';
        console.log('[DiscussionSubmitForm] Destroyed');
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiscussionSubmitForm };
}

// Global export
if (typeof window !== 'undefined') {
    window.DiscussionSubmitForm = DiscussionSubmitForm;
}
