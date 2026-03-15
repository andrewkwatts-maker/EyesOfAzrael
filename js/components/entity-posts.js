/**
 * Entity Posts Component
 *
 * Renders a Reddit-style discussion section on entity detail pages.
 * Supports: posting, voting, threaded replies, sorting, section filtering.
 *
 * Usage:
 *   const posts = new EntityPostsComponent(container, entity);
 *   await posts.init();
 */

class EntityPostsComponent {
    constructor(container, entity) {
        this.container = container;
        this.entity = entity;
        this.collection = this._getCollectionName(entity.type);
        this.posts = [];
        this.sortBy = 'newest';
        this.sectionFilter = null;
        this.isLoading = false;
        this.userVotes = new Map();
    }

    async init() {
        if (!window.postsService) {
            console.warn('[EntityPosts] PostsService not available');
            this.container.innerHTML = '';
            return;
        }

        try {
            await window.postsService.init();
        } catch (err) {
            console.error('[EntityPosts] PostsService init failed:', err);
            this.container.innerHTML = '';
            return;
        }

        this.render();
        await this.loadPosts();
    }

    /**
     * Render the discussion section shell
     */
    render() {
        const user = firebase.auth?.()?.currentUser;

        this.container.innerHTML = `
            <div class="entity-posts-section">
                <div class="entity-posts-header">
                    <div class="entity-posts-title-row">
                        <h2 class="entity-posts-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            Discussion
                            <span class="entity-posts-count" id="entityPostsCount">0</span>
                        </h2>
                    </div>

                    <div class="entity-posts-controls">
                        <div class="entity-posts-sort">
                            <select id="entityPostsSort" class="entity-posts-select">
                                <option value="newest">Newest</option>
                                <option value="votes">Highest Rated</option>
                                <option value="discussed">Most Discussed</option>
                            </select>
                        </div>
                        <div class="entity-posts-filter">
                            <select id="entityPostsFilter" class="entity-posts-select">
                                <option value="">All Sections</option>
                            </select>
                        </div>
                    </div>
                </div>

                ${user ? `
                    <div class="entity-posts-compose" id="entityPostsCompose">
                        <div class="entity-posts-compose-header">
                            <img src="${this._escapeHtml(user.photoURL || '')}" alt="" class="compose-avatar" onerror="this.style.display='none'" />
                            <span class="compose-user-name">${this._escapeHtml(user.displayName || 'Anonymous')}</span>
                        </div>
                        <textarea id="entityPostContent" class="entity-posts-textarea" placeholder="Share your thoughts, insights, or questions..." rows="3" maxlength="5000"></textarea>
                        <div class="entity-posts-compose-footer">
                            <div class="compose-footer-left">
                                <select id="entityPostSection" class="entity-posts-select entity-posts-section-select">
                                    <option value="">Entity-wide</option>
                                </select>
                                <span class="compose-char-count"><span id="composeCharCount">0</span> / 5000</span>
                            </div>
                            <button class="entity-posts-submit-btn" id="entityPostSubmit" disabled>Post</button>
                        </div>
                        <div class="entity-posts-compose-error" id="entityPostError" style="display:none;"></div>
                    </div>
                ` : `
                    <div class="entity-posts-login-prompt">
                        <p>Sign in to join the discussion</p>
                    </div>
                `}

                <div class="entity-posts-list" id="entityPostsList">
                    <div class="entity-posts-loading" id="entityPostsLoading">
                        <div class="spinner-container">
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                            <div class="spinner-ring"></div>
                        </div>
                        <p>Loading discussion...</p>
                    </div>
                </div>

                <div class="entity-posts-empty" id="entityPostsEmpty" style="display:none;">
                    <div class="entity-posts-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <h3>Start the conversation</h3>
                    <p>No one has discussed <strong>${this._escapeHtml(this.entity.name || 'this entity')}</strong> yet. Share your insights, ask a question, or start a debate!</p>
                    ${user ? `<p class="entity-posts-empty-hint">Use the text box above to write the first post.</p>` : `<p class="entity-posts-empty-hint">Sign in to be the first to contribute.</p>`}
                </div>
            </div>
        `;

        this._populateSectionFilters();
        this._bindEvents();
    }

    /**
     * Populate section filter dropdowns based on entity content
     */
    _populateSectionFilters() {
        const sections = this._getEntitySections();
        const filterSelect = document.getElementById('entityPostsFilter');
        const postSectionSelect = document.getElementById('entityPostSection');

        sections.forEach(section => {
            if (filterSelect) {
                const opt = document.createElement('option');
                opt.value = section.ref;
                opt.textContent = section.title;
                filterSelect.appendChild(opt);
            }
            if (postSectionSelect) {
                const opt = document.createElement('option');
                opt.value = section.ref;
                opt.textContent = section.title;
                postSectionSelect.appendChild(opt);
            }
        });
    }

    /**
     * Get available sections from the entity
     */
    _getEntitySections() {
        const sections = [];
        const e = this.entity;

        if (e.description) sections.push({ ref: 'description', title: 'Description' });
        if (e.appearance) sections.push({ ref: 'appearance', title: 'Appearance' });
        if (e.behavior) sections.push({ ref: 'behavior', title: 'Behavior' });
        if (e.habitat) sections.push({ ref: 'habitat', title: 'Habitat' });
        if (e.keyMyths?.length) sections.push({ ref: 'keyMyths', title: 'Key Myths' });
        if (e.extendedContent?.length) sections.push({ ref: 'extendedContent', title: 'Extended Content' });
        if (e.worship) sections.push({ ref: 'worship', title: 'Worship & Rituals' });
        if (e.family) sections.push({ ref: 'family', title: 'Relationships' });
        if (e.symbolism) sections.push({ ref: 'symbolism', title: 'Symbolism' });
        if (e.cultural) sections.push({ ref: 'cultural', title: 'Cultural Impact' });

        return sections;
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        // Sort change
        const sortSelect = document.getElementById('entityPostsSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortBy = sortSelect.value;
                this.loadPosts();
            });
        }

        // Filter change
        const filterSelect = document.getElementById('entityPostsFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.sectionFilter = filterSelect.value || null;
                this.loadPosts();
            });
        }

        // Compose textarea
        const textarea = document.getElementById('entityPostContent');
        if (textarea) {
            textarea.addEventListener('input', () => {
                const len = textarea.value.trim().length;
                document.getElementById('composeCharCount').textContent = textarea.value.length;
                document.getElementById('entityPostSubmit').disabled = len < 10;
            });
        }

        // Submit button
        const submitBtn = document.getElementById('entityPostSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this._submitPost());
        }

        // Event delegation for votes, replies, deletes
        const list = document.getElementById('entityPostsList');
        if (list) {
            list.addEventListener('click', (e) => {
                const target = e.target.closest('[data-action]');
                if (!target) return;

                const action = target.dataset.action;
                const postId = target.dataset.postId;

                switch (action) {
                    case 'upvote':
                        this._handleVote(postId, 1);
                        break;
                    case 'downvote':
                        this._handleVote(postId, -1);
                        break;
                    case 'reply':
                        this._showReplyForm(postId);
                        break;
                    case 'edit':
                        this._handleEdit(postId);
                        break;
                    case 'save-edit':
                        this._handleSaveEdit(postId);
                        break;
                    case 'cancel-edit':
                        this._handleCancelEdit(postId);
                        break;
                    case 'delete':
                        this._handleDelete(postId);
                        break;
                    case 'load-replies':
                        this._loadReplies(postId);
                        break;
                }
            });
        }
    }

    /**
     * Load posts from Firestore
     */
    async loadPosts() {
        const loadingEl = document.getElementById('entityPostsLoading');
        const emptyEl = document.getElementById('entityPostsEmpty');
        const listEl = document.getElementById('entityPostsList');

        if (loadingEl) loadingEl.style.display = '';
        if (emptyEl) emptyEl.style.display = 'none';

        try {
            this.posts = await window.postsService.getPosts(
                this.collection, this.entity.id,
                { sortBy: this.sortBy, sectionFilter: this.sectionFilter }
            );

            // Load user votes for all posts
            await this._loadUserVotes();

            // Update count
            const countEl = document.getElementById('entityPostsCount');
            if (countEl) countEl.textContent = this.posts.length;

            // Render posts
            if (loadingEl) loadingEl.style.display = 'none';

            if (this.posts.length === 0) {
                if (emptyEl) emptyEl.style.display = '';
                if (listEl) {
                    // Keep loading div but hide it
                    const existingPosts = listEl.querySelectorAll('.post-card');
                    existingPosts.forEach(p => p.remove());
                }
            } else {
                if (emptyEl) emptyEl.style.display = 'none';
                this._renderPosts();
            }

        } catch (error) {
            console.error('[EntityPosts] Error loading posts:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (listEl) {
                listEl.innerHTML = `<div class="entity-posts-error">Failed to load posts: ${error.message}</div>`;
            }
        }
    }

    /**
     * Load user votes for displayed posts
     */
    async _loadUserVotes() {
        const user = firebase.auth?.()?.currentUser;
        if (!user) return;

        for (const post of this.posts) {
            try {
                const vote = await window.postsService.getUserVote(this.collection, this.entity.id, post.id);
                this.userVotes.set(post.id, vote);
            } catch (e) {
                // Silently fail for vote checks
            }
        }
    }

    /**
     * Render posts into the list
     */
    _renderPosts() {
        const listEl = document.getElementById('entityPostsList');
        if (!listEl) return;

        const postsHTML = this.posts.map(post => this._renderPostCard(post)).join('');
        listEl.innerHTML = postsHTML;
    }

    /**
     * Render a single post card
     */
    _renderPostCard(post, isReply = false) {
        const userVote = this.userVotes.get(post.id) || 0;
        const user = firebase.auth?.()?.currentUser;
        const isAuthor = user && post.authorId === user.uid;
        const isAdmin = user?.email === 'andrewkwatts@gmail.com';
        const canDelete = isAuthor || isAdmin;
        const timestamp = window.postsService?.formatTimestamp(post.createdAt) || '';

        return `
            <div class="post-card ${isReply ? 'post-card-reply' : ''}" data-post-id="${post.id}">
                <div class="post-vote-column">
                    <button class="post-vote-btn post-vote-up ${userVote === 1 ? 'active' : ''}"
                            data-action="upvote" data-post-id="${post.id}" title="Upvote">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${userVote === 1 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                    </button>
                    <span class="post-vote-count ${post.netVotes > 0 ? 'positive' : post.netVotes < 0 ? 'negative' : ''}">${post.netVotes || 0}</span>
                    <button class="post-vote-btn post-vote-down ${userVote === -1 ? 'active' : ''}"
                            data-action="downvote" data-post-id="${post.id}" title="Downvote">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${userVote === -1 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>
                <div class="post-content-column">
                    <div class="post-meta">
                        ${post.authorAvatar ? `<img src="${post.authorAvatar}" alt="" class="post-avatar" onerror="this.style.display='none'" />` : ''}
                        <span class="post-author">${this._escapeHtml(post.authorName || 'Anonymous')}</span>
                        <span class="post-timestamp">${timestamp}</span>
                        ${post.sectionTitle ? `<span class="post-section-badge">${this._escapeHtml(post.sectionTitle)}</span>` : ''}
                    </div>
                    <div class="post-body">${this._formatContent(post.content)}</div>
                    <div class="post-actions">
                        ${user ? `<button class="post-action-btn" data-action="reply" data-post-id="${post.id}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Reply
                        </button>` : ''}
                        ${post.replyCount > 0 ? `<button class="post-action-btn" data-action="load-replies" data-post-id="${post.id}">
                            ${post.replyCount} ${post.replyCount === 1 ? 'reply' : 'replies'}
                        </button>` : ''}
                        ${isAuthor ? `<button class="post-action-btn post-action-edit" data-action="edit" data-post-id="${post.id}">Edit</button>` : ''}
                        ${post.edited ? `<span class="post-edited-badge">(edited)</span>` : ''}
                        ${canDelete ? `<button class="post-action-btn post-action-delete" data-action="delete" data-post-id="${post.id}">Delete</button>` : ''}
                    </div>
                    <div class="post-reply-form" id="replyForm-${post.id}" style="display:none;"></div>
                    <div class="post-replies" id="replies-${post.id}"></div>
                </div>
            </div>
        `;
    }

    /**
     * Submit a new post
     */
    async _submitPost() {
        const textarea = document.getElementById('entityPostContent');
        const submitBtn = document.getElementById('entityPostSubmit');
        const errorEl = document.getElementById('entityPostError');
        const sectionSelect = document.getElementById('entityPostSection');

        if (!textarea || !submitBtn) return;

        const content = textarea.value.trim();
        if (content.length < 10) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        if (errorEl) errorEl.style.display = 'none';

        try {
            const sectionRef = sectionSelect?.value || null;
            const sectionTitle = sectionRef ? sectionSelect.options[sectionSelect.selectedIndex].text : null;

            await window.postsService.createPost({
                collection: this.collection,
                entityId: this.entity.id,
                entityName: this.entity.name || this.entity.title,
                content,
                sectionRef,
                sectionTitle
            });

            // Clear form
            textarea.value = '';
            document.getElementById('composeCharCount').textContent = '0';

            // Reload posts
            await this.loadPosts();

        } catch (error) {
            console.error('[EntityPosts] Post error:', error);
            if (errorEl) {
                errorEl.textContent = error.message;
                errorEl.style.display = '';
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post';
        }
    }

    /**
     * Handle vote click
     */
    async _handleVote(postId, value) {
        try {
            const result = await window.postsService.vote(
                this.collection, this.entity.id, postId, value
            );
            this.userVotes.set(postId, result.userVote);
            await this.loadPosts();
        } catch (error) {
            console.error('[EntityPosts] Vote error:', error);
        }
    }

    /**
     * Show reply form for a post
     */
    _showReplyForm(postId) {
        const formContainer = document.getElementById(`replyForm-${postId}`);
        if (!formContainer) return;

        if (formContainer.style.display !== 'none') {
            formContainer.style.display = 'none';
            formContainer.innerHTML = '';
            return;
        }

        formContainer.style.display = '';
        formContainer.innerHTML = `
            <div class="post-reply-compose">
                <textarea class="entity-posts-textarea reply-textarea" placeholder="Write a reply..." rows="2" maxlength="5000" id="replyContent-${postId}"></textarea>
                <div class="reply-compose-actions">
                    <button class="entity-posts-submit-btn reply-submit-btn" id="replySubmit-${postId}">Reply</button>
                    <button class="post-action-btn reply-cancel-btn" id="replyCancel-${postId}">Cancel</button>
                </div>
            </div>
        `;

        document.getElementById(`replySubmit-${postId}`).addEventListener('click', () => this._submitReply(postId));
        document.getElementById(`replyCancel-${postId}`).addEventListener('click', () => {
            formContainer.style.display = 'none';
            formContainer.innerHTML = '';
        });
    }

    /**
     * Submit a reply
     */
    async _submitReply(parentId) {
        const textarea = document.getElementById(`replyContent-${parentId}`);
        const submitBtn = document.getElementById(`replySubmit-${parentId}`);
        if (!textarea || !submitBtn) return;

        const content = textarea.value.trim();
        if (content.length < 10) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        try {
            await window.postsService.createPost({
                collection: this.collection,
                entityId: this.entity.id,
                entityName: this.entity.name || this.entity.title,
                content,
                parentId
            });

            // Close form and reload
            const formContainer = document.getElementById(`replyForm-${parentId}`);
            if (formContainer) {
                formContainer.style.display = 'none';
                formContainer.innerHTML = '';
            }

            // Load replies for this parent
            await this._loadReplies(parentId);
            await this.loadPosts();

        } catch (error) {
            console.error('[EntityPosts] Reply error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reply';
        }
    }

    /**
     * Load and render replies for a post
     */
    async _loadReplies(parentId) {
        const repliesContainer = document.getElementById(`replies-${parentId}`);
        if (!repliesContainer) return;

        try {
            const replies = await window.postsService.getReplies(
                this.collection, this.entity.id, parentId
            );

            if (replies.length === 0) {
                repliesContainer.innerHTML = '';
                return;
            }

            // Load user votes for replies
            const user = firebase.auth?.()?.currentUser;
            if (user) {
                for (const reply of replies) {
                    try {
                        const vote = await window.postsService.getUserVote(this.collection, this.entity.id, reply.id);
                        this.userVotes.set(reply.id, vote);
                    } catch (e) {}
                }
            }

            repliesContainer.innerHTML = replies
                .map(reply => this._renderPostCard(reply, true))
                .join('');

        } catch (error) {
            console.error('[EntityPosts] Error loading replies:', error);
        }
    }

    /**
     * Handle post edit - show inline edit form
     */
    _handleEdit(postId) {
        const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (!card) return;

        const bodyEl = card.querySelector('.post-body');
        if (!bodyEl) return;

        const currentContent = bodyEl.textContent.trim();
        bodyEl.dataset.originalContent = bodyEl.innerHTML;

        bodyEl.innerHTML = `
            <textarea class="post-edit-textarea" data-post-id="${postId}" rows="4">${this._escapeHtml(currentContent)}</textarea>
            <div class="post-edit-actions">
                <button class="post-action-btn post-action-save" data-action="save-edit" data-post-id="${postId}">Save</button>
                <button class="post-action-btn post-action-cancel" data-action="cancel-edit" data-post-id="${postId}">Cancel</button>
            </div>
        `;

        const textarea = bodyEl.querySelector('textarea');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }

    /**
     * Save edited post
     */
    async _handleSaveEdit(postId) {
        const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (!card) return;

        const textarea = card.querySelector('.post-edit-textarea');
        if (!textarea) return;

        const newContent = textarea.value.trim();
        if (newContent.length < 10) {
            alert('Post must be at least 10 characters');
            return;
        }

        try {
            await window.postsService.updatePost(this.collection, this.entity.id, postId, newContent);
            await this.loadPosts();
        } catch (error) {
            console.error('[EntityPosts] Edit error:', error);
            alert('Failed to save: ' + error.message);
        }
    }

    /**
     * Cancel post edit
     */
    _handleCancelEdit(postId) {
        const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (!card) return;

        const bodyEl = card.querySelector('.post-body');
        if (!bodyEl || !bodyEl.dataset.originalContent) return;

        bodyEl.innerHTML = bodyEl.dataset.originalContent;
        delete bodyEl.dataset.originalContent;
    }

    /**
     * Handle post deletion
     */
    async _handleDelete(postId) {
        if (!confirm('Delete this post?')) return;

        try {
            await window.postsService.deletePost(this.collection, this.entity.id, postId);
            await this.loadPosts();
        } catch (error) {
            console.error('[EntityPosts] Delete error:', error);
            alert('Failed to delete: ' + error.message);
        }
    }

    /**
     * Format post content (basic markdown-like formatting)
     */
    _formatContent(content) {
        if (!content) return '';
        return this._escapeHtml(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    _getCollectionName(type) {
        const map = {
            'deity': 'deities', 'hero': 'heroes', 'creature': 'creatures',
            'item': 'items', 'place': 'places', 'concept': 'concepts',
            'magic': 'magic', 'ritual': 'rituals', 'text': 'texts',
            'archetype': 'archetypes', 'symbol': 'symbols', 'herb': 'herbs',
            'cosmology': 'cosmology', 'event': 'events'
        };
        return map[type] || type;
    }

    /**
     * Cleanup listeners
     */
    destroy() {
        if (window.postsService) {
            window.postsService.stopAllListeners();
        }
    }
}

// Global export
if (typeof window !== 'undefined') {
    window.EntityPostsComponent = EntityPostsComponent;
}
