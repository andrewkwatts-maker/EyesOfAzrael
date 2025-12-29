/**
 * Add Query Button Component
 * Button that opens the CorpusQueryEditor modal for entity pages
 *
 * Features:
 * - Opens query editor in modal
 * - Pre-fills entity reference
 * - Authentication check
 * - Displays user's existing queries for the entity
 * - Shows public queries with voting
 *
 * Dependencies:
 * - CorpusQueryEditor (js/components/corpus-query-editor.js)
 * - UserCorpusQueries (js/services/user-corpus-queries.js)
 * - CorpusQueryVoting (js/services/corpus-query-voting.js)
 */

class AddQueryButton {
    /**
     * Create an Add Query button
     * @param {string} entityType - Entity type (deity, hero, etc.)
     * @param {string} entityId - Entity ID
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} Button element
     */
    static create(entityType, entityId, options = {}) {
        const button = document.createElement('button');
        button.className = 'add-query-btn';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            <span>Add Search Query</span>
        `;

        button.addEventListener('click', () => {
            AddQueryButton.openEditor(entityType, entityId, options);
        });

        return button;
    }

    /**
     * Open the query editor modal
     * @param {string} entityType - Entity type
     * @param {string} entityId - Entity ID
     * @param {Object} options - Configuration options
     */
    static async openEditor(entityType, entityId, options = {}) {
        // Check authentication
        const isAuthenticated = window.FirebaseService?.isAuthenticated() ||
            (window.auth && window.auth.currentUser);

        if (!isAuthenticated) {
            AddQueryButton.showLoginPrompt();
            return;
        }

        // Create modal
        const modal = AddQueryButton.createModal();
        document.body.appendChild(modal);

        // Get the container for the editor
        const editorContainer = modal.querySelector('.query-editor-container');

        // Initialize the editor
        const editor = new CorpusQueryEditor(editorContainer, {
            mode: 'create',
            entityRef: { type: entityType, id: entityId },
            onSave: (queryData) => {
                AddQueryButton.closeModal(modal);
                AddQueryButton.showSuccessMessage('Query created successfully!');

                // Dispatch event for external listeners
                window.dispatchEvent(new CustomEvent('corpusQueryCreated', {
                    detail: { entityType, entityId, queryData }
                }));

                // Refresh the queries display if callback provided
                if (options.onQueryCreated) {
                    options.onQueryCreated(queryData);
                }
            },
            onCancel: () => {
                AddQueryButton.closeModal(modal);
            },
            ...options
        });
    }

    /**
     * Create the modal element
     * @returns {HTMLElement}
     */
    static createModal() {
        const modal = document.createElement('div');
        modal.className = 'query-editor-modal';
        modal.innerHTML = `
            <div class="query-editor-modal-backdrop"></div>
            <div class="query-editor-modal-content">
                <div class="query-editor-container"></div>
            </div>
        `;

        // Close on backdrop click
        const backdrop = modal.querySelector('.query-editor-modal-backdrop');
        backdrop.addEventListener('click', () => {
            AddQueryButton.closeModal(modal);
        });

        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                AddQueryButton.closeModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });

        return modal;
    }

    /**
     * Close the modal
     * @param {HTMLElement} modal - Modal element
     */
    static closeModal(modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    /**
     * Show login prompt
     */
    static showLoginPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'query-login-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <h3>Sign in Required</h3>
                <p>You need to be signed in to create custom search queries.</p>
                <div class="prompt-actions">
                    <button class="btn-secondary prompt-cancel">Cancel</button>
                    <button class="btn-primary prompt-signin">Sign In</button>
                </div>
            </div>
        `;

        document.body.appendChild(prompt);

        // Animate in
        requestAnimationFrame(() => {
            prompt.classList.add('visible');
        });

        const cancelBtn = prompt.querySelector('.prompt-cancel');
        const signinBtn = prompt.querySelector('.prompt-signin');

        cancelBtn.addEventListener('click', () => {
            prompt.classList.remove('visible');
            setTimeout(() => prompt.remove(), 300);
        });

        signinBtn.addEventListener('click', () => {
            prompt.classList.remove('visible');
            setTimeout(() => prompt.remove(), 300);
            // Trigger sign in (using existing auth flow)
            if (window.FirebaseService?.showLoginUI) {
                window.FirebaseService.showLoginUI();
            } else if (window.showLoginModal) {
                window.showLoginModal();
            }
        });
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    static showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'query-toast success';
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

/**
 * User Queries Display Component
 * Displays user queries for an entity with voting
 */
class UserQueriesDisplay {
    /**
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            entityType: null,
            entityId: null,
            showAddButton: true,
            showPublicQueries: true,
            onQuerySelect: null,
            ...options
        };

        // Services
        this.userCorpusQueries = null;
        this.queryVoting = null;

        // State
        this.userQueries = [];
        this.publicQueries = [];
        this.userVotes = {};

        // Initialize
        this.init();
    }

    /**
     * Initialize the display
     */
    async init() {
        try {
            // Wait for Firebase
            if (typeof window.waitForFirebase === 'function') {
                await window.waitForFirebase();
            }

            // Initialize services
            if (window.UserCorpusQueries && window.db && window.auth) {
                this.userCorpusQueries = new window.UserCorpusQueries(window.db, window.auth);
            }

            if (window.CorpusQueryVoting && window.db && window.auth) {
                this.queryVoting = new window.CorpusQueryVoting(window.db, window.auth);
            }

            // Load queries
            await this.loadQueries();

            // Render
            this.render();

            // Listen for new queries
            window.addEventListener('corpusQueryCreated', () => {
                this.loadQueries().then(() => this.render());
            });

            console.log('[UserQueriesDisplay] Initialized');

        } catch (error) {
            console.error('[UserQueriesDisplay] Initialization error:', error);
            this.renderError('Failed to load queries');
        }
    }

    /**
     * Load queries for the entity
     */
    async loadQueries() {
        if (!this.userCorpusQueries) return;

        const { entityType, entityId } = this.options;

        if (entityType && entityId) {
            const result = await this.userCorpusQueries.getEntityQueries(entityType, entityId);
            this.userQueries = result.userQueries || [];
            this.publicQueries = result.publicQueries || [];
        } else {
            // Just get user's queries
            this.userQueries = await this.userCorpusQueries.getUserQueries({ limit: 10 });
            this.publicQueries = [];
        }

        // Load user's votes
        await this.loadUserVotes();
    }

    /**
     * Load user's votes for displayed queries
     */
    async loadUserVotes() {
        if (!this.queryVoting) return;

        const queryIds = [
            ...this.userQueries.map(q => q.id),
            ...this.publicQueries.map(q => q.id)
        ];

        for (const queryId of queryIds) {
            const result = await this.queryVoting.getUserVote(queryId);
            if (result.success) {
                this.userVotes[queryId] = result.vote;
            }
        }
    }

    /**
     * Render the queries display
     */
    render() {
        const hasQueries = this.userQueries.length > 0 || this.publicQueries.length > 0;
        const isAuthenticated = window.auth && window.auth.currentUser;

        let html = `
            <div class="user-queries-display">
                <div class="queries-header">
                    <h4 class="queries-title">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                        Corpus Searches
                    </h4>
                    ${this.options.showAddButton ? `
                        <button class="add-query-btn-small" id="add-query-btn">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
                            Add
                        </button>
                    ` : ''}
                </div>
        `;

        if (!hasQueries) {
            html += `
                <div class="queries-empty">
                    <p>No custom searches yet.</p>
                    ${isAuthenticated ? '<p>Create one to save your favorite searches!</p>' : '<p>Sign in to create custom searches.</p>'}
                </div>
            `;
        } else {
            // User's queries
            if (this.userQueries.length > 0) {
                html += `
                    <div class="queries-section">
                        <h5 class="section-label">Your Queries</h5>
                        <div class="queries-list">
                            ${this.userQueries.map(q => this.renderQueryCard(q, true)).join('')}
                        </div>
                    </div>
                `;
            }

            // Public queries
            if (this.options.showPublicQueries && this.publicQueries.length > 0) {
                html += `
                    <div class="queries-section">
                        <h5 class="section-label">Community Queries</h5>
                        <div class="queries-list">
                            ${this.publicQueries.map(q => this.renderQueryCard(q, false)).join('')}
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Render a single query card
     * @param {Object} query - Query data
     * @param {boolean} isOwned - Whether user owns this query
     * @returns {string} HTML string
     */
    renderQueryCard(query, isOwned) {
        const userVote = this.userVotes[query.id] || 0;
        const voteCount = query.votes || 0;

        return `
            <div class="query-card ${isOwned ? 'owned' : ''}" data-query-id="${query.id}">
                <div class="query-card-header">
                    <span class="query-label">${this.escapeHtml(query.label)}</span>
                    <span class="query-type-badge ${query.queryType}">${query.queryType}</span>
                </div>
                <div class="query-card-meta">
                    <span class="query-term">"${this.escapeHtml(query.query?.searchTerm || '')}"</span>
                    ${query.query?.mythology ? `<span class="query-mythology">${query.query.mythology}</span>` : ''}
                </div>
                <div class="query-card-footer">
                    <div class="query-voting">
                        <button class="vote-btn upvote ${userVote === 1 ? 'active' : ''}"
                                data-vote="1" data-query-id="${query.id}"
                                ${!window.auth?.currentUser ? 'disabled' : ''}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 4l4 4H9v4H7V8H4l4-4z"/>
                            </svg>
                        </button>
                        <span class="vote-count ${voteCount > 0 ? 'positive' : voteCount < 0 ? 'negative' : ''}">${voteCount}</span>
                        <button class="vote-btn downvote ${userVote === -1 ? 'active' : ''}"
                                data-vote="-1" data-query-id="${query.id}"
                                ${!window.auth?.currentUser ? 'disabled' : ''}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 12l-4-4h3V4h2v4h3l-4 4z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="query-actions">
                        <button class="query-action-btn execute" data-query-id="${query.id}" title="Execute Query">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 2v12l8-6-8-6z"/>
                            </svg>
                        </button>
                        ${isOwned ? `
                            <button class="query-action-btn edit" data-query-id="${query.id}" title="Edit">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                </svg>
                            </button>
                            <button class="query-action-btn delete" data-query-id="${query.id}" title="Delete">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                            </button>
                        ` : `
                            <button class="query-action-btn fork" data-query-id="${query.id}" title="Fork Query">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>
                                </svg>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Add query button
        const addBtn = this.container.querySelector('#add-query-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                AddQueryButton.openEditor(
                    this.options.entityType,
                    this.options.entityId,
                    {
                        onQueryCreated: () => {
                            this.loadQueries().then(() => this.render());
                        }
                    }
                );
            });
        }

        // Vote buttons
        this.container.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleVote(e));
        });

        // Execute buttons
        this.container.querySelectorAll('.query-action-btn.execute').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleExecute(e));
        });

        // Edit buttons
        this.container.querySelectorAll('.query-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEdit(e));
        });

        // Delete buttons
        this.container.querySelectorAll('.query-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDelete(e));
        });

        // Fork buttons
        this.container.querySelectorAll('.query-action-btn.fork').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFork(e));
        });
    }

    /**
     * Handle vote click
     */
    async handleVote(e) {
        if (!this.queryVoting) return;

        const btn = e.currentTarget;
        const queryId = btn.dataset.queryId;
        const voteValue = parseInt(btn.dataset.vote);

        btn.disabled = true;

        const result = voteValue === 1
            ? await this.queryVoting.upvote(queryId)
            : await this.queryVoting.downvote(queryId);

        if (result.success) {
            this.userVotes[queryId] = result.userVote;

            // Update UI
            const card = this.container.querySelector(`[data-query-id="${queryId}"]`);
            if (card) {
                const voteCountEl = card.querySelector('.vote-count');
                const upBtn = card.querySelector('.vote-btn.upvote');
                const downBtn = card.querySelector('.vote-btn.downvote');

                voteCountEl.textContent = result.newVotes;
                voteCountEl.className = 'vote-count ' +
                    (result.newVotes > 0 ? 'positive' : result.newVotes < 0 ? 'negative' : '');

                upBtn.classList.toggle('active', result.userVote === 1);
                downBtn.classList.toggle('active', result.userVote === -1);
            }
        }

        btn.disabled = false;
    }

    /**
     * Handle execute click
     */
    async handleExecute(e) {
        const queryId = e.currentTarget.dataset.queryId;
        const query = [...this.userQueries, ...this.publicQueries].find(q => q.id === queryId);

        if (query && this.options.onQuerySelect) {
            this.options.onQuerySelect(query);
        }

        // Dispatch event
        window.dispatchEvent(new CustomEvent('corpusQueryExecute', {
            detail: { query }
        }));
    }

    /**
     * Handle edit click
     */
    handleEdit(e) {
        const queryId = e.currentTarget.dataset.queryId;
        const query = this.userQueries.find(q => q.id === queryId);

        if (query) {
            const modal = AddQueryButton.createModal();
            document.body.appendChild(modal);

            const editorContainer = modal.querySelector('.query-editor-container');

            new CorpusQueryEditor(editorContainer, {
                mode: 'edit',
                queryToEdit: query,
                onSave: () => {
                    AddQueryButton.closeModal(modal);
                    AddQueryButton.showSuccessMessage('Query updated!');
                    this.loadQueries().then(() => this.render());
                },
                onCancel: () => {
                    AddQueryButton.closeModal(modal);
                }
            });
        }
    }

    /**
     * Handle delete click
     */
    async handleDelete(e) {
        const queryId = e.currentTarget.dataset.queryId;

        if (!confirm('Are you sure you want to delete this query?')) {
            return;
        }

        if (this.userCorpusQueries) {
            try {
                await this.userCorpusQueries.deleteQuery(queryId);
                AddQueryButton.showSuccessMessage('Query deleted');
                await this.loadQueries();
                this.render();
            } catch (error) {
                console.error('[UserQueriesDisplay] Delete error:', error);
                alert('Failed to delete query: ' + error.message);
            }
        }
    }

    /**
     * Handle fork click
     */
    async handleFork(e) {
        const queryId = e.currentTarget.dataset.queryId;

        if (this.userCorpusQueries) {
            try {
                await this.userCorpusQueries.duplicateQuery(queryId);
                AddQueryButton.showSuccessMessage('Query forked to your collection!');
                await this.loadQueries();
                this.render();
            } catch (error) {
                console.error('[UserQueriesDisplay] Fork error:', error);
                alert('Failed to fork query: ' + error.message);
            }
        }
    }

    /**
     * Render error state
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="user-queries-display error">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
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
     * Refresh the display
     */
    async refresh() {
        await this.loadQueries();
        this.render();
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
    }
}

// Factory function for easy integration
function addQueryButton(entityType, entityId, options = {}) {
    return AddQueryButton.create(entityType, entityId, options);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AddQueryButton, UserQueriesDisplay, addQueryButton };
}

if (typeof window !== 'undefined') {
    window.AddQueryButton = AddQueryButton;
    window.UserQueriesDisplay = UserQueriesDisplay;
    window.addQueryButton = addQueryButton;
}
