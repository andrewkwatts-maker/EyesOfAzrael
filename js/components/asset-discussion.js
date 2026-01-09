/**
 * Asset Discussion Component
 * Reddit-style threaded discussion system for asset pages
 *
 * Features:
 * - Threaded comment display with reply nesting
 * - Integration with VoteService for upvote/downvote
 * - User attribution with BadgeDisplay
 * - Real-time updates via Firestore listeners
 * - Corpus citation display for validated contributions
 * - Sort options (best, new, controversial)
 * - Collapsible threads
 * - Moderation controls
 *
 * Dependencies:
 * - VoteService (js/services/vote-service.js)
 * - BadgeDisplay (js/components/badge-display.js)
 * - CorpusQueryService (js/services/corpus-query-service.js)
 * - DiscussionSubmitForm (js/components/discussion-submit-form.js)
 * - discussion-system.css
 */

class AssetDiscussion {
    /**
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            throw new Error('[AssetDiscussion] Container element not found');
        }

        // Configuration
        this.options = {
            assetId: options.assetId || this.container.dataset.assetId,
            assetType: options.assetType || this.container.dataset.assetType || 'assets',
            assetName: options.assetName || this.container.dataset.assetName || 'this asset',
            mythology: options.mythology || this.container.dataset.mythology || '',
            maxNestingLevel: options.maxNestingLevel || 5,
            commentsPerPage: options.commentsPerPage || 20,
            defaultSort: options.defaultSort || 'best', // best, new, controversial
            enableRealTime: options.enableRealTime !== false,
            enableCorpusCitations: options.enableCorpusCitations !== false,
            showSubmitForm: options.showSubmitForm !== false,
            ...options
        };

        if (!this.options.assetId) {
            throw new Error('[AssetDiscussion] assetId is required');
        }

        // State
        this.comments = [];
        this.commentMap = new Map(); // id -> comment object
        this.sortBy = this.options.defaultSort;
        this.isLoading = false;
        this.hasMore = true;
        this.lastDoc = null;
        this.collapsedThreads = new Set();
        this.highlightedCommentId = null;

        // Services
        this.db = null;
        this.auth = null;
        this.voteService = null;
        this.unsubscribe = null;

        // UI elements
        this.headerEl = null;
        this.sortSelectEl = null;
        this.commentsListEl = null;
        this.loadMoreBtn = null;
        this.submitFormContainer = null;

        // Bound methods
        this._handleSortChange = this._handleSortChange.bind(this);
        this._handleVoteClick = this._handleVoteClick.bind(this);
        this._handleReplyClick = this._handleReplyClick.bind(this);
        this._handleCollapseClick = this._handleCollapseClick.bind(this);
        this._handleDeleteClick = this._handleDeleteClick.bind(this);
        this._handleLoadMore = this._handleLoadMore.bind(this);

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

                if (window.VoteService) {
                    this.voteService = new window.VoteService(this.db, this.auth);
                }
            }

            // Render initial UI
            this.render();

            // Load comments
            await this.loadComments();

            // Subscribe to real-time updates if enabled
            if (this.options.enableRealTime && this.db) {
                this.subscribeToUpdates();
            }

            // Check for highlighted comment in URL hash
            this._checkUrlHash();

            console.log(`[AssetDiscussion] Initialized for ${this.options.assetType}/${this.options.assetId}`);

        } catch (error) {
            console.error('[AssetDiscussion] Initialization error:', error);
            this._showError('Failed to load discussion. Please refresh the page.');
        }
    }

    /**
     * Render the discussion component
     */
    render() {
        this.container.className = 'asset-discussion';
        this.container.innerHTML = `
            <div class="discussion-header">
                <h3 class="discussion-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="discussion-icon">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    Discussion
                    <span class="comment-count" aria-live="polite">(0 comments)</span>
                </h3>
                <div class="discussion-controls">
                    <label for="discussion-sort" class="sr-only">Sort comments by</label>
                    <select id="discussion-sort" class="discussion-sort-select">
                        <option value="best" ${this.sortBy === 'best' ? 'selected' : ''}>Best</option>
                        <option value="new" ${this.sortBy === 'new' ? 'selected' : ''}>New</option>
                        <option value="controversial" ${this.sortBy === 'controversial' ? 'selected' : ''}>Controversial</option>
                        <option value="old" ${this.sortBy === 'old' ? 'selected' : ''}>Old</option>
                    </select>
                </div>
            </div>

            ${this.options.showSubmitForm ? `
                <div class="discussion-submit-container" id="discussion-submit-${this.options.assetId}"></div>
            ` : ''}

            <div class="discussion-comments-list" role="feed" aria-label="Comments">
                <div class="discussion-loading">
                    <div class="discussion-spinner"></div>
                    <span>Loading discussion...</span>
                </div>
            </div>

            <button type="button" class="discussion-load-more" style="display: none;">
                Load more comments
            </button>

            <div class="discussion-error" role="alert" style="display: none;"></div>
        `;

        // Get element references
        this.headerEl = this.container.querySelector('.discussion-header');
        this.sortSelectEl = this.container.querySelector('.discussion-sort-select');
        this.commentsListEl = this.container.querySelector('.discussion-comments-list');
        this.loadMoreBtn = this.container.querySelector('.discussion-load-more');
        this.submitFormContainer = this.container.querySelector('.discussion-submit-container');
        this.commentCountEl = this.container.querySelector('.comment-count');
        this.errorEl = this.container.querySelector('.discussion-error');

        // Bind events
        this.sortSelectEl.addEventListener('change', this._handleSortChange);
        this.loadMoreBtn.addEventListener('click', this._handleLoadMore);

        // Initialize submit form if enabled
        if (this.options.showSubmitForm && window.DiscussionSubmitForm) {
            this.submitForm = new window.DiscussionSubmitForm(this.submitFormContainer, {
                assetId: this.options.assetId,
                assetType: this.options.assetType,
                assetName: this.options.assetName,
                mythology: this.options.mythology,
                onSubmit: (comment) => this._handleNewComment(comment)
            });
        }

        // Delegate event listeners
        this.commentsListEl.addEventListener('click', (e) => {
            const voteBtn = e.target.closest('.comment-vote-btn');
            if (voteBtn) {
                this._handleVoteClick(e, voteBtn);
                return;
            }

            const replyBtn = e.target.closest('.comment-reply-btn');
            if (replyBtn) {
                this._handleReplyClick(e, replyBtn);
                return;
            }

            const collapseBtn = e.target.closest('.comment-collapse-btn');
            if (collapseBtn) {
                this._handleCollapseClick(e, collapseBtn);
                return;
            }

            const deleteBtn = e.target.closest('.comment-delete-btn');
            if (deleteBtn) {
                this._handleDeleteClick(e, deleteBtn);
                return;
            }

            const corpusLink = e.target.closest('.corpus-citation-link');
            if (corpusLink) {
                this._handleCorpusLinkClick(e, corpusLink);
                return;
            }
        });
    }

    /**
     * Load comments from Firestore
     */
    async loadComments(append = false) {
        if (this.isLoading) return;

        this.isLoading = true;
        this._showLoading(true);

        try {
            if (!this.db) {
                throw new Error('Firebase not initialized');
            }

            const collectionPath = `discussions/${this.options.assetId}/comments`;
            let query = this.db.collection(collectionPath);

            // Apply sorting
            switch (this.sortBy) {
                case 'new':
                    query = query.orderBy('createdAt', 'desc');
                    break;
                case 'old':
                    query = query.orderBy('createdAt', 'asc');
                    break;
                case 'controversial':
                    query = query.orderBy('contestedScore', 'desc');
                    break;
                case 'best':
                default:
                    query = query.orderBy('netVotes', 'desc');
                    break;
            }

            // Only get top-level comments (parentId is null)
            query = query.where('parentId', '==', null);

            // Pagination
            if (append && this.lastDoc) {
                query = query.startAfter(this.lastDoc);
            }

            query = query.limit(this.options.commentsPerPage);

            const snapshot = await query.get();

            if (!append) {
                this.comments = [];
                this.commentMap.clear();
            }

            const newComments = [];
            snapshot.forEach(doc => {
                const comment = { id: doc.id, ...doc.data() };
                newComments.push(comment);
                this.commentMap.set(doc.id, comment);
            });

            // Load replies for each comment
            for (const comment of newComments) {
                comment.replies = await this._loadReplies(comment.id);
            }

            if (append) {
                this.comments = [...this.comments, ...newComments];
            } else {
                this.comments = newComments;
            }

            this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
            this.hasMore = snapshot.docs.length === this.options.commentsPerPage;

            // Update UI
            this._renderComments();
            this._updateCommentCount();
            this.loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';

        } catch (error) {
            console.error('[AssetDiscussion] Load comments error:', error);
            this._showError('Failed to load comments. Please try again.');
        } finally {
            this.isLoading = false;
            this._showLoading(false);
        }
    }

    /**
     * Load replies for a comment recursively
     */
    async _loadReplies(parentId, depth = 0) {
        if (depth >= this.options.maxNestingLevel) {
            return [];
        }

        try {
            const collectionPath = `discussions/${this.options.assetId}/comments`;
            const snapshot = await this.db.collection(collectionPath)
                .where('parentId', '==', parentId)
                .orderBy('createdAt', 'asc')
                .get();

            const replies = [];
            for (const doc of snapshot.docs) {
                const reply = { id: doc.id, ...doc.data() };
                reply.replies = await this._loadReplies(doc.id, depth + 1);
                replies.push(reply);
                this.commentMap.set(doc.id, reply);
            }

            return replies;

        } catch (error) {
            console.error('[AssetDiscussion] Load replies error:', error);
            return [];
        }
    }

    /**
     * Subscribe to real-time updates
     */
    subscribeToUpdates() {
        if (!this.db) return;

        const collectionPath = `discussions/${this.options.assetId}/comments`;

        this.unsubscribe = this.db.collection(collectionPath)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    const comment = { id: change.doc.id, ...change.doc.data() };

                    if (change.type === 'added' && !this.commentMap.has(comment.id)) {
                        // New comment added
                        this._handleNewComment(comment);
                    } else if (change.type === 'modified') {
                        // Comment updated (e.g., vote count changed)
                        this._handleCommentUpdate(comment);
                    } else if (change.type === 'removed') {
                        // Comment deleted
                        this._handleCommentRemove(comment.id);
                    }
                });
            }, error => {
                console.error('[AssetDiscussion] Real-time subscription error:', error);
            });
    }

    /**
     * Render comments list
     */
    _renderComments() {
        if (this.comments.length === 0) {
            this.commentsListEl.innerHTML = `
                <div class="discussion-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <p class="empty-title">No discussion yet</p>
                    <p class="empty-subtitle">Be the first to share your perspective on ${this._escapeHtml(this.options.assetName)}</p>
                </div>
            `;
            return;
        }

        const commentsHtml = this.comments
            .map(comment => this._renderComment(comment, 0))
            .join('');

        this.commentsListEl.innerHTML = commentsHtml;

        // Initialize vote buttons and badge displays
        this._initializeCommentComponents();

        // Highlight comment if needed
        if (this.highlightedCommentId) {
            this._scrollToComment(this.highlightedCommentId);
        }
    }

    /**
     * Render a single comment with replies
     */
    _renderComment(comment, depth = 0) {
        const isCollapsed = this.collapsedThreads.has(comment.id);
        const isHighlighted = this.highlightedCommentId === comment.id;
        const hasReplies = comment.replies && comment.replies.length > 0;
        const isOwner = this.auth?.currentUser?.uid === comment.authorId;
        const isModerator = this._isUserModerator();
        const userVote = comment._userVote || 0;
        const netVotes = comment.netVotes || 0;

        const repliesHtml = hasReplies && !isCollapsed
            ? comment.replies.map(reply => this._renderComment(reply, depth + 1)).join('')
            : '';

        const collapsedRepliesCount = hasReplies && isCollapsed
            ? comment.replies.length + this._countNestedReplies(comment.replies)
            : 0;

        return `
            <article class="discussion-comment ${isCollapsed ? 'collapsed' : ''} ${isHighlighted ? 'highlighted' : ''}"
                     data-comment-id="${this._escapeAttr(comment.id)}"
                     data-depth="${depth}"
                     style="--depth: ${depth}"
                     id="comment-${this._escapeAttr(comment.id)}">

                <div class="comment-vote-column">
                    <button type="button"
                            class="comment-vote-btn upvote ${userVote === 1 ? 'active' : ''}"
                            data-comment-id="${this._escapeAttr(comment.id)}"
                            data-vote="1"
                            aria-label="Upvote"
                            aria-pressed="${userVote === 1}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                    </button>
                    <span class="comment-vote-count ${netVotes > 0 ? 'positive' : netVotes < 0 ? 'negative' : ''}"
                          title="${(comment.upvoteCount || 0)} upvotes, ${(comment.downvoteCount || 0)} downvotes">
                        ${this._formatVoteCount(netVotes)}
                    </span>
                    <button type="button"
                            class="comment-vote-btn downvote ${userVote === -1 ? 'active' : ''}"
                            data-comment-id="${this._escapeAttr(comment.id)}"
                            data-vote="-1"
                            aria-label="Downvote"
                            aria-pressed="${userVote === -1}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M12 5v14M5 12l7 7 7-7"/>
                        </svg>
                    </button>
                </div>

                <div class="comment-main">
                    <header class="comment-header">
                        ${hasReplies ? `
                            <button type="button"
                                    class="comment-collapse-btn"
                                    data-comment-id="${this._escapeAttr(comment.id)}"
                                    aria-expanded="${!isCollapsed}"
                                    aria-label="${isCollapsed ? 'Expand thread' : 'Collapse thread'}">
                                <span class="collapse-indicator">${isCollapsed ? '[+]' : '[-]'}</span>
                            </button>
                        ` : ''}

                        <div class="comment-author">
                            ${comment.authorPhoto ? `
                                <img src="${this._escapeAttr(comment.authorPhoto)}"
                                     alt=""
                                     class="comment-author-avatar"
                                     loading="lazy">
                            ` : `
                                <div class="comment-author-avatar placeholder">
                                    ${this._getInitials(comment.authorName)}
                                </div>
                            `}
                            <span class="comment-author-name">${this._escapeHtml(comment.authorName || 'Anonymous')}</span>
                            <div class="comment-author-badges" data-user-id="${this._escapeAttr(comment.authorId)}"></div>
                        </div>

                        <span class="comment-separator" aria-hidden="true">-</span>

                        <time class="comment-time"
                              datetime="${comment.createdAt?.toDate?.()?.toISOString() || ''}"
                              title="${this._formatFullDate(comment.createdAt)}">
                            ${this._formatRelativeTime(comment.createdAt)}
                        </time>

                        ${comment.editedAt ? `
                            <span class="comment-edited" title="Edited ${this._formatRelativeTime(comment.editedAt)}">
                                (edited)
                            </span>
                        ` : ''}

                        ${isCollapsed ? `
                            <span class="comment-collapsed-info">
                                (${collapsedRepliesCount} ${collapsedRepliesCount === 1 ? 'reply' : 'replies'} hidden)
                            </span>
                        ` : ''}
                    </header>

                    ${!isCollapsed ? `
                        <div class="comment-content">
                            ${this._renderCommentContent(comment.content)}
                        </div>

                        ${this.options.enableCorpusCitations && comment.corpusQuery ? `
                            <div class="comment-corpus-citation">
                                <div class="corpus-citation-header">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="corpus-icon">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                    </svg>
                                    <span class="corpus-citation-label">Corpus Citation</span>
                                </div>
                                <a href="#/corpus-search?query=${encodeURIComponent(comment.corpusQuery.term)}"
                                   class="corpus-citation-link"
                                   data-query-id="${this._escapeAttr(comment.corpusQuery.id || '')}">
                                    <span class="corpus-query-term">"${this._escapeHtml(comment.corpusQuery.term)}"</span>
                                    ${comment.corpusQuery.resultCount ? `
                                        <span class="corpus-result-count">(${comment.corpusQuery.resultCount} results)</span>
                                    ` : ''}
                                </a>
                            </div>
                        ` : ''}

                        <footer class="comment-actions">
                            <button type="button"
                                    class="comment-action-btn comment-reply-btn"
                                    data-comment-id="${this._escapeAttr(comment.id)}"
                                    data-author-name="${this._escapeAttr(comment.authorName)}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 10h10a8 8 0 0 1 8 8v4M3 10l6 6M3 10l6-6"/>
                                </svg>
                                Reply
                            </button>

                            <button type="button"
                                    class="comment-action-btn comment-share-btn"
                                    data-comment-id="${this._escapeAttr(comment.id)}"
                                    title="Copy link to comment">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                Share
                            </button>

                            ${(isOwner || isModerator) ? `
                                <button type="button"
                                        class="comment-action-btn comment-delete-btn"
                                        data-comment-id="${this._escapeAttr(comment.id)}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                    Delete
                                </button>
                            ` : ''}

                            ${isModerator && !isOwner ? `
                                <span class="comment-mod-badge">Mod</span>
                            ` : ''}
                        </footer>

                        <div class="comment-reply-form-container" data-parent-id="${this._escapeAttr(comment.id)}"></div>

                        ${hasReplies ? `
                            <div class="comment-replies" role="list">
                                ${repliesHtml}
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
            </article>
        `;
    }

    /**
     * Initialize components within comments (vote buttons, badges)
     */
    _initializeCommentComponents() {
        // Initialize badge displays
        if (window.BadgeDisplay) {
            const badgeContainers = this.commentsListEl.querySelectorAll('.comment-author-badges[data-user-id]');
            badgeContainers.forEach(async container => {
                const userId = container.dataset.userId;
                if (!userId) return;

                try {
                    // Load user badges from Firestore
                    const badgeAwards = await this._loadUserBadges(userId);
                    if (badgeAwards.length > 0) {
                        const badgeDisplay = new window.BadgeDisplay({
                            maxDisplay: 3,
                            compact: true,
                            showPoints: false
                        });
                        badgeDisplay.setBadges(badgeAwards);
                        badgeDisplay.render(container);
                    }
                } catch (error) {
                    console.warn('[AssetDiscussion] Failed to load badges for user:', userId);
                }
            });
        }

        // Load user votes for all visible comments
        this._loadUserVotes();
    }

    /**
     * Load user's badges
     */
    async _loadUserBadges(userId) {
        if (!this.db) return [];

        try {
            const snapshot = await this.db.collection('badge_awards')
                .where('userId', '==', userId)
                .limit(5)
                .get();

            return snapshot.docs.map(doc => ({
                badgeId: doc.data().badgeId,
                awardedAt: doc.data().awardedAt,
                isPinned: doc.data().isPinned || false
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Load user votes for displayed comments
     */
    async _loadUserVotes() {
        if (!this.voteService || !this.auth?.currentUser) return;

        try {
            const commentIds = Array.from(this.commentMap.keys());

            for (const commentId of commentIds) {
                const result = await this.voteService.getUserVote(commentId, 'discussions');
                if (result.success) {
                    const comment = this.commentMap.get(commentId);
                    if (comment) {
                        comment._userVote = result.vote || 0;
                    }

                    // Update vote button UI
                    const commentEl = this.commentsListEl.querySelector(`[data-comment-id="${commentId}"]`);
                    if (commentEl) {
                        const upvoteBtn = commentEl.querySelector('.comment-vote-btn.upvote');
                        const downvoteBtn = commentEl.querySelector('.comment-vote-btn.downvote');

                        if (upvoteBtn) {
                            upvoteBtn.classList.toggle('active', result.vote === 1);
                            upvoteBtn.setAttribute('aria-pressed', (result.vote === 1).toString());
                        }
                        if (downvoteBtn) {
                            downvoteBtn.classList.toggle('active', result.vote === -1);
                            downvoteBtn.setAttribute('aria-pressed', (result.vote === -1).toString());
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[AssetDiscussion] Load user votes error:', error);
        }
    }

    // ==================== Event Handlers ====================

    _handleSortChange(e) {
        this.sortBy = e.target.value;
        this.lastDoc = null;
        this.loadComments();
    }

    async _handleVoteClick(e, btn) {
        e.preventDefault();

        if (!this.auth?.currentUser) {
            this._showLoginPrompt();
            return;
        }

        const commentId = btn.dataset.commentId;
        const voteValue = parseInt(btn.dataset.vote);

        if (!this.voteService) {
            this._showError('Voting is currently unavailable.');
            return;
        }

        // Optimistic UI update
        const commentEl = btn.closest('.discussion-comment');
        const voteCountEl = commentEl.querySelector('.comment-vote-count');
        const comment = this.commentMap.get(commentId);

        const oldVote = comment?._userVote || 0;
        let voteDelta = 0;

        if (oldVote === voteValue) {
            voteDelta = -voteValue;
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        } else {
            voteDelta = voteValue - oldVote;
            const siblingBtn = commentEl.querySelector(`.comment-vote-btn:not([data-vote="${voteValue}"])`);
            siblingBtn?.classList.remove('active');
            siblingBtn?.setAttribute('aria-pressed', 'false');
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        }

        const newNetVotes = (comment?.netVotes || 0) + voteDelta;
        if (voteCountEl) {
            voteCountEl.textContent = this._formatVoteCount(newNetVotes);
            voteCountEl.className = 'comment-vote-count ' + (newNetVotes > 0 ? 'positive' : newNetVotes < 0 ? 'negative' : '');
        }

        try {
            const result = await this.voteService.handleVote(commentId, 'discussions', voteValue);

            if (result.success) {
                if (comment) {
                    comment._userVote = result.userVote;
                    comment.netVotes = result.newVotes;
                }
            } else {
                // Revert on error
                this._revertVoteUI(commentEl, comment, oldVote);
                this._showError(result.error || 'Failed to register vote.');
            }
        } catch (error) {
            this._revertVoteUI(commentEl, comment, oldVote);
            this._showError('Failed to register vote. Please try again.');
        }
    }

    _revertVoteUI(commentEl, comment, oldVote) {
        if (!commentEl || !comment) return;

        const voteCountEl = commentEl.querySelector('.comment-vote-count');
        const upvoteBtn = commentEl.querySelector('.comment-vote-btn.upvote');
        const downvoteBtn = commentEl.querySelector('.comment-vote-btn.downvote');

        if (voteCountEl) {
            voteCountEl.textContent = this._formatVoteCount(comment.netVotes || 0);
        }

        upvoteBtn?.classList.toggle('active', oldVote === 1);
        downvoteBtn?.classList.toggle('active', oldVote === -1);
    }

    _handleReplyClick(e, btn) {
        e.preventDefault();

        if (!this.auth?.currentUser) {
            this._showLoginPrompt();
            return;
        }

        const commentId = btn.dataset.commentId;
        const authorName = btn.dataset.authorName;
        const commentEl = btn.closest('.discussion-comment');
        const formContainer = commentEl.querySelector(`.comment-reply-form-container[data-parent-id="${commentId}"]`);

        if (!formContainer) return;

        // Toggle reply form
        if (formContainer.innerHTML.trim()) {
            formContainer.innerHTML = '';
            return;
        }

        // Create inline reply form
        if (window.DiscussionSubmitForm) {
            const replyForm = new window.DiscussionSubmitForm(formContainer, {
                assetId: this.options.assetId,
                assetType: this.options.assetType,
                assetName: this.options.assetName,
                mythology: this.options.mythology,
                parentId: commentId,
                isReply: true,
                placeholder: `Reply to ${authorName}...`,
                onSubmit: (comment) => {
                    formContainer.innerHTML = '';
                    this._handleNewComment(comment);
                },
                onCancel: () => {
                    formContainer.innerHTML = '';
                }
            });
        }
    }

    _handleCollapseClick(e, btn) {
        const commentId = btn.dataset.commentId;

        if (this.collapsedThreads.has(commentId)) {
            this.collapsedThreads.delete(commentId);
        } else {
            this.collapsedThreads.add(commentId);
        }

        // Re-render just this comment and its replies
        const commentEl = btn.closest('.discussion-comment');
        const comment = this.commentMap.get(commentId);

        if (commentEl && comment) {
            const newHtml = this._renderComment(comment, parseInt(commentEl.dataset.depth) || 0);
            commentEl.outerHTML = newHtml;
            this._initializeCommentComponents();
        }
    }

    async _handleDeleteClick(e, btn) {
        e.preventDefault();

        const commentId = btn.dataset.commentId;

        if (!confirm('Are you sure you want to delete this comment? This cannot be undone.')) {
            return;
        }

        try {
            const collectionPath = `discussions/${this.options.assetId}/comments`;
            await this.db.collection(collectionPath).doc(commentId).delete();

            // Remove from local state
            this.commentMap.delete(commentId);
            this.comments = this.comments.filter(c => c.id !== commentId);

            // Update UI
            const commentEl = this.commentsListEl.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentEl) {
                commentEl.remove();
            }

            this._updateCommentCount();
            this._showToast('Comment deleted');

        } catch (error) {
            console.error('[AssetDiscussion] Delete comment error:', error);
            this._showError('Failed to delete comment. Please try again.');
        }
    }

    _handleCorpusLinkClick(e, link) {
        // Let the link navigate normally, but track analytics if available
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent('corpus_citation_click', {
                assetId: this.options.assetId,
                queryId: link.dataset.queryId
            });
        }
    }

    _handleLoadMore() {
        this.loadComments(true);
    }

    _handleNewComment(comment) {
        if (comment.parentId) {
            // It's a reply - find parent and add
            const parent = this.commentMap.get(comment.parentId);
            if (parent) {
                if (!parent.replies) parent.replies = [];
                parent.replies.push(comment);
            }
        } else {
            // Top-level comment
            this.comments.unshift(comment);
        }

        this.commentMap.set(comment.id, comment);
        this._renderComments();
        this._updateCommentCount();

        // Scroll to new comment
        setTimeout(() => {
            this._scrollToComment(comment.id);
        }, 100);
    }

    _handleCommentUpdate(comment) {
        const existing = this.commentMap.get(comment.id);
        if (existing) {
            // Preserve replies and user vote
            comment.replies = existing.replies;
            comment._userVote = existing._userVote;
            this.commentMap.set(comment.id, comment);

            // Update UI for just this comment
            const commentEl = this.commentsListEl.querySelector(`[data-comment-id="${comment.id}"]`);
            if (commentEl) {
                const voteCountEl = commentEl.querySelector('.comment-vote-count');
                if (voteCountEl) {
                    voteCountEl.textContent = this._formatVoteCount(comment.netVotes || 0);
                    voteCountEl.className = 'comment-vote-count ' +
                        (comment.netVotes > 0 ? 'positive' : comment.netVotes < 0 ? 'negative' : '');
                }
            }
        }
    }

    _handleCommentRemove(commentId) {
        this.commentMap.delete(commentId);
        this.comments = this.comments.filter(c => c.id !== commentId);

        // Also remove from any parent's replies
        this.commentMap.forEach(comment => {
            if (comment.replies) {
                comment.replies = comment.replies.filter(r => r.id !== commentId);
            }
        });

        const commentEl = this.commentsListEl.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentEl) {
            commentEl.remove();
        }

        this._updateCommentCount();
    }

    // ==================== Helper Methods ====================

    _countNestedReplies(replies) {
        if (!replies || replies.length === 0) return 0;
        return replies.reduce((count, reply) => {
            return count + 1 + this._countNestedReplies(reply.replies);
        }, 0);
    }

    _getTotalCommentCount() {
        let count = this.comments.length;
        this.commentMap.forEach(comment => {
            if (comment.replies) {
                count += this._countNestedReplies([comment]) - 1;
            }
        });
        return count;
    }

    _updateCommentCount() {
        const count = this._getTotalCommentCount();
        if (this.commentCountEl) {
            this.commentCountEl.textContent = `(${count} ${count === 1 ? 'comment' : 'comments'})`;
        }
    }

    _checkUrlHash() {
        const hash = window.location.hash;
        const match = hash.match(/comment-([a-zA-Z0-9_-]+)/);
        if (match) {
            this.highlightedCommentId = match[1];
        }
    }

    _scrollToComment(commentId) {
        const commentEl = document.getElementById(`comment-${commentId}`);
        if (commentEl) {
            commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            commentEl.classList.add('highlighted');
            setTimeout(() => commentEl.classList.remove('highlighted'), 3000);
        }
    }

    _isUserModerator() {
        // Check if current user has moderator role
        const user = this.auth?.currentUser;
        if (!user) return false;

        // Admin email check
        if (user.email === 'andrewkwatts@gmail.com') return true;

        // Could also check user role in Firestore
        return false;
    }

    _renderCommentContent(content) {
        if (!content) return '';

        // Basic markdown-like formatting
        let html = this._escapeHtml(content);

        // Convert line breaks
        html = html.replace(/\n/g, '<br>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        return html;
    }

    _formatVoteCount(count) {
        if (count === 0) return '0';
        const sign = count > 0 ? '+' : '';
        if (Math.abs(count) >= 1000) {
            return sign + (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return sign + count;
    }

    _formatRelativeTime(timestamp) {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        if (diffWeek < 4) return `${diffWeek}w ago`;
        if (diffMonth < 12) return `${diffMonth}mo ago`;
        return `${diffYear}y ago`;
    }

    _formatFullDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    }

    _getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    _showLoading(show) {
        const loadingEl = this.commentsListEl.querySelector('.discussion-loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }

    _showError(message) {
        if (this.errorEl) {
            this.errorEl.textContent = message;
            this.errorEl.style.display = 'block';
            setTimeout(() => {
                this.errorEl.style.display = 'none';
            }, 5000);
        }
    }

    _showLoginPrompt() {
        // Dispatch login request event
        const event = new CustomEvent('requestLogin', {
            bubbles: true,
            detail: { source: 'asset-discussion' }
        });
        this.container.dispatchEvent(event);

        // Also try direct Firebase auth
        if (window.FirebaseService?.signInWithGoogle) {
            window.FirebaseService.signInWithGoogle();
        }
    }

    _showToast(message) {
        // Use existing toast system if available
        let toast = document.querySelector('.discussion-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'discussion-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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
     * Cleanup and destroy component
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        if (this.voteService) {
            this.voteService.cleanup?.();
        }

        if (this.submitForm?.destroy) {
            this.submitForm.destroy();
        }

        this.sortSelectEl?.removeEventListener('change', this._handleSortChange);
        this.loadMoreBtn?.removeEventListener('click', this._handleLoadMore);

        this.container.innerHTML = '';
        console.log(`[AssetDiscussion] Destroyed for ${this.options.assetType}/${this.options.assetId}`);
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AssetDiscussion };
}

// Global export
if (typeof window !== 'undefined') {
    window.AssetDiscussion = AssetDiscussion;
}
