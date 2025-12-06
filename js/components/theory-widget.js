/**
 * Universal Theory Widget
 * Can be embedded on any page to show/submit user theories
 * Usage: <div data-theory-widget data-page="deity/zeus" data-title="Zeus"></div>
 */

class TheoryWidget {
    constructor(element) {
        this.element = element;
        this.pageId = element.dataset.page || window.location.pathname;
        this.pageTitle = element.dataset.title || document.title;
        this.mode = element.dataset.mode || 'button'; // button, inline, modal
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();

        // Listen for theory updates
        window.addEventListener('theoriesUpdated', () => this.refreshTheories());
        window.addEventListener('userLogin', () => this.render());
        window.addEventListener('userLogout', () => this.render());
    }

    render() {
        if (this.mode === 'button') {
            this.renderButton();
        } else if (this.mode === 'inline') {
            this.renderInline();
        }
    }

    renderButton() {
        const theories = this.getPageTheories();
        const count = theories.length;

        this.element.innerHTML = `
            <button class="theory-widget-button" data-theory-toggle>
                <span class="theory-icon">💭</span>
                <span class="theory-text">User Theories</span>
                ${count > 0 ? `<span class="theory-count">${count}</span>` : ''}
            </button>
        `;
    }

    renderInline() {
        const theories = this.getPageTheories();
        const isLoggedIn = window.userAuth && window.userAuth.isLoggedIn();

        this.element.innerHTML = `
            <div class="theory-widget-inline">
                <div class="theory-widget-header">
                    <h3>
                        <span class="theory-icon">💭</span>
                        User Theories
                        ${theories.length > 0 ? `<span class="theory-count">${theories.length}</span>` : ''}
                    </h3>
                    ${isLoggedIn ? `
                        <button class="theory-add-btn" data-theory-add>
                            <span>+</span> Add Theory
                        </button>
                    ` : `
                        <button class="theory-login-btn" data-theory-login>
                            <span>🔒</span> Login to Add
                        </button>
                    `}
                </div>

                <div class="theory-widget-content">
                    ${theories.length > 0 ? this.renderTheoryList(theories) : this.renderEmpty()}
                </div>
            </div>
        `;
    }

    renderTheoryList(theories) {
        return `
            <div class="theory-list">
                ${theories.map(theory => this.renderTheoryCard(theory)).join('')}
            </div>
        `;
    }

    renderTheoryCard(theory) {
        const isLoggedIn = window.userAuth && window.userAuth.isLoggedIn();
        const currentUser = isLoggedIn ? window.userAuth.getCurrentUser() : null;
        const isAuthor = currentUser && currentUser.username === theory.author;
        const userVote = theory.voters.find(v => currentUser && v.username === currentUser.username);

        return `
            <div class="theory-card" data-theory-id="${theory.id}">
                <div class="theory-card-header">
                    <div class="theory-author">
                        <img src="${theory.authorAvatar}" alt="${theory.author}" class="theory-avatar">
                        <div>
                            <div class="theory-author-name">${theory.author}</div>
                            <div class="theory-date">${window.userTheories.formatDate(theory.createdAt)}</div>
                        </div>
                    </div>
                    <div class="theory-category">
                        <span class="category-icon">${window.userTheories.getCategoryIcon(theory.category)}</span>
                        <span class="category-name">${window.userTheories.getCategoryName(theory.category)}</span>
                    </div>
                </div>

                <h4 class="theory-title">${this.escapeHtml(theory.title)}</h4>

                ${theory.summary ? `
                    <p class="theory-summary">${this.escapeHtml(theory.summary)}</p>
                ` : ''}

                <div class="theory-content-preview">
                    ${this.truncateText(this.escapeHtml(theory.content), 200)}
                </div>

                <div class="theory-card-footer">
                    <div class="theory-stats">
                        <span class="stat">
                            <span>👁️</span> ${theory.views || 0}
                        </span>
                        <span class="stat">
                            <span>💬</span> ${theory.comments.length}
                        </span>
                    </div>

                    <div class="theory-actions">
                        ${isLoggedIn ? `
                            <button class="vote-btn ${userVote?.direction === 1 ? 'voted' : ''}"
                                    data-theory-vote="${theory.id}" data-direction="1">
                                <span>👍</span> ${theory.votes > 0 ? theory.votes : ''}
                            </button>
                            <button class="vote-btn ${userVote?.direction === -1 ? 'voted' : ''}"
                                    data-theory-vote="${theory.id}" data-direction="-1">
                                <span>👎</span>
                            </button>
                        ` : `
                            <span class="vote-display">
                                <span>👍</span> ${theory.votes}
                            </span>
                        `}

                        <button class="theory-view-btn" data-theory-view="${theory.id}">
                            View Full Theory →
                        </button>

                        ${isAuthor ? `
                            <button class="theory-edit-btn" data-theory-edit="${theory.id}">
                                ✏️ Edit
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderEmpty() {
        const isLoggedIn = window.userAuth && window.userAuth.isLoggedIn();

        return `
            <div class="theory-empty">
                <div class="theory-empty-icon">💡</div>
                <p class="theory-empty-text">No theories yet for this topic</p>
                ${isLoggedIn ? `
                    <button class="theory-add-btn-large" data-theory-add>
                        <span>+</span> Be the First to Share
                    </button>
                ` : `
                    <p class="theory-empty-subtext">
                        <button class="theory-login-link" data-theory-login>Login</button>
                        to share your insights
                    </p>
                `}
            </div>
        `;
    }

    attachEventListeners() {
        this.element.addEventListener('click', (e) => {
            // Toggle widget
            if (e.target.closest('[data-theory-toggle]')) {
                this.toggleModal();
            }

            // Add theory
            if (e.target.closest('[data-theory-add]')) {
                this.showTheoryForm();
            }

            // Login
            if (e.target.closest('[data-theory-login]')) {
                window.userAuth?.showLoginModal();
            }

            // Vote
            const voteBtn = e.target.closest('[data-theory-vote]');
            if (voteBtn) {
                const theoryId = voteBtn.dataset.theoryVote;
                const direction = parseInt(voteBtn.dataset.direction);
                this.handleVote(theoryId, direction);
            }

            // View theory
            const viewBtn = e.target.closest('[data-theory-view]');
            if (viewBtn) {
                const theoryId = viewBtn.dataset.theoryView;
                this.showTheoryDetail(theoryId);
            }

            // Edit theory
            const editBtn = e.target.closest('[data-theory-edit]');
            if (editBtn) {
                const theoryId = editBtn.dataset.theoryEdit;
                this.showTheoryForm(theoryId);
            }
        });
    }

    getPageTheories() {
        if (!window.userTheories) return [];
        return window.userTheories.getAllTheories({ relatedPage: this.pageId });
    }

    toggleModal() {
        const modal = this.getOrCreateModal();
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';

        if (modal.style.display === 'flex') {
            this.renderModalContent();
        }
    }

    getOrCreateModal() {
        let modal = document.getElementById('theory-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'theory-modal';
            modal.className = 'theory-modal';
            modal.innerHTML = `
                <div class="theory-modal-content">
                    <button class="theory-modal-close" data-theory-modal-close>×</button>
                    <div class="theory-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('[data-theory-modal-close]')) {
                    modal.style.display = 'none';
                }
            });
        }
        return modal;
    }

    renderModalContent() {
        const modal = document.getElementById('theory-modal');
        const body = modal.querySelector('.theory-modal-body');

        const theories = this.getPageTheories();
        const isLoggedIn = window.userAuth && window.userAuth.isLoggedIn();

        body.innerHTML = `
            <div class="theory-modal-header">
                <h2>
                    <span class="theory-icon">💭</span>
                    Theories about ${this.escapeHtml(this.pageTitle)}
                </h2>
                ${isLoggedIn ? `
                    <button class="theory-add-btn" data-theory-add>
                        <span>+</span> Add Theory
                    </button>
                ` : ''}
            </div>

            <div class="theory-modal-content-area">
                ${theories.length > 0 ? this.renderTheoryList(theories) : this.renderEmpty()}
            </div>
        `;
    }

    showTheoryForm(theoryId = null) {
        const modal = this.getOrCreateModal();
        const body = modal.querySelector('.theory-modal-body');

        const isEdit = !!theoryId;
        const theory = isEdit ? window.userTheories.getTheory(theoryId) : null;

        if (isEdit && !theory) {
            alert('Theory not found');
            return;
        }

        body.innerHTML = `
            <div class="theory-form-container">
                <h2>${isEdit ? 'Edit' : 'Add'} Theory</h2>
                <p class="theory-form-subtitle">Sharing about: ${this.escapeHtml(this.pageTitle)}</p>

                <form id="theory-submit-form" class="theory-form">
                    <div class="form-group">
                        <label for="theory-title">Theory Title *</label>
                        <input type="text" id="theory-title" name="title"
                               value="${isEdit ? this.escapeHtml(theory.title) : ''}"
                               placeholder="Enter a descriptive title" required>
                    </div>

                    <div class="form-group">
                        <label for="theory-category">Category *</label>
                        <select id="theory-category" name="category" required>
                            <option value="">Select a category...</option>
                            <option value="pattern" ${theory?.category === 'pattern' ? 'selected' : ''}>🔗 Pattern Connections</option>
                            <option value="archaeological" ${theory?.category === 'archaeological' ? 'selected' : ''}>🏛️ Archaeological Correlations</option>
                            <option value="textual" ${theory?.category === 'textual' ? 'selected' : ''}>📖 Textual Analysis</option>
                            <option value="alternative" ${theory?.category === 'alternative' ? 'selected' : ''}>🧬 Alternative Interpretations</option>
                            <option value="geographic" ${theory?.category === 'geographic' ? 'selected' : ''}>🗺️ Geographic Correlations</option>
                            <option value="timeline" ${theory?.category === 'timeline' ? 'selected' : ''}>⏳ Timeline Analysis</option>
                            <option value="physics" ${theory?.category === 'physics' ? 'selected' : ''}>⚛️ Physics Integration</option>
                            <option value="general" ${theory?.category === 'general' ? 'selected' : ''}>💡 General Theory</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="theory-summary">Summary</label>
                        <textarea id="theory-summary" name="summary" rows="2"
                                  placeholder="Brief summary (optional)">${isEdit ? this.escapeHtml(theory.summary || '') : ''}</textarea>
                        <small>2-3 sentences summarizing your theory</small>
                    </div>

                    <div class="form-group">
                        <label for="theory-content">Full Theory *</label>
                        <textarea id="theory-content" name="content" rows="10" required
                                  placeholder="Present your theory in detail...">${isEdit ? this.escapeHtml(theory.content) : ''}</textarea>
                        <small>Minimum 50 characters</small>
                    </div>

                    <div class="form-group">
                        <label for="theory-sources">Sources & References</label>
                        <textarea id="theory-sources" name="sources" rows="4"
                                  placeholder="List your sources, citations, or links">${isEdit ? this.escapeHtml(theory.sources || '') : ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="theory-mythologies">Related Mythologies</label>
                        <input type="text" id="theory-mythologies" name="mythologies"
                               value="${isEdit ? (theory.relatedMythologies || []).join(', ') : ''}"
                               placeholder="e.g., Greek, Egyptian, Norse (comma-separated)">
                    </div>

                    <div class="form-message" id="theory-form-message"></div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" data-theory-modal-close>
                            Cancel
                        </button>
                        <button type="submit" class="btn-primary">
                            ${isEdit ? 'Update' : 'Submit'} Theory
                        </button>
                    </div>
                </form>
            </div>
        `;

        modal.style.display = 'flex';

        // Handle form submission
        const form = body.querySelector('#theory-submit-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTheorySubmit(form, isEdit ? theoryId : null);
        });
    }

    handleTheorySubmit(form, theoryId = null) {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            summary: formData.get('summary'),
            content: formData.get('content'),
            category: formData.get('category'),
            sources: formData.get('sources'),
            relatedMythologies: formData.get('mythologies')
                .split(',')
                .map(m => m.trim())
                .filter(m => m),
            relatedPage: this.pageId
        };

        let result;
        if (theoryId) {
            result = window.userTheories.updateTheory(theoryId, data);
        } else {
            result = window.userTheories.submitTheory(data);
        }

        const messageEl = form.querySelector('#theory-form-message');
        if (result.success) {
            messageEl.textContent = result.message;
            messageEl.className = 'form-message form-message-success';
            messageEl.style.display = 'block';

            // Refresh and close after delay
            setTimeout(() => {
                this.refreshTheories();
                this.getOrCreateModal().style.display = 'none';
            }, 1500);
        } else {
            messageEl.textContent = result.error;
            messageEl.className = 'form-message form-message-error';
            messageEl.style.display = 'block';
        }
    }

    handleVote(theoryId, direction) {
        const result = window.userTheories.voteTheory(theoryId, direction);
        if (result.success) {
            this.refreshTheories();
        } else {
            alert(result.error);
        }
    }

    showTheoryDetail(theoryId) {
        const theory = window.userTheories.getTheory(theoryId);
        if (!theory) {
            alert('Theory not found');
            return;
        }

        // Increment views
        window.userTheories.incrementViews(theoryId);

        const modal = this.getOrCreateModal();
        const body = modal.querySelector('.theory-modal-body');

        const isLoggedIn = window.userAuth && window.userAuth.isLoggedIn();
        const currentUser = isLoggedIn ? window.userAuth.getCurrentUser() : null;
        const isAuthor = currentUser && currentUser.username === theory.author;
        const userVote = theory.voters.find(v => currentUser && v.username === currentUser.username);

        body.innerHTML = `
            <div class="theory-detail">
                <div class="theory-detail-header">
                    <div class="theory-meta">
                        <span class="theory-category">
                            <span class="category-icon">${window.userTheories.getCategoryIcon(theory.category)}</span>
                            ${window.userTheories.getCategoryName(theory.category)}
                        </span>
                        <span class="theory-date">${window.userTheories.formatDate(theory.createdAt)}</span>
                    </div>
                    <h1 class="theory-detail-title">${this.escapeHtml(theory.title)}</h1>

                    <div class="theory-author-detail">
                        <img src="${theory.authorAvatar}" alt="${theory.author}" class="theory-avatar-large">
                        <div>
                            <div class="theory-author-name">${theory.author}</div>
                            <div class="theory-stats-inline">
                                <span>👁️ ${theory.views} views</span>
                                <span>💬 ${theory.comments.length} comments</span>
                                <span>👍 ${theory.votes} votes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="theory-detail-content">
                    ${this.formatContent(theory.content)}
                </div>

                ${theory.sources ? `
                    <div class="theory-sources">
                        <h3>Sources & References</h3>
                        ${this.formatContent(theory.sources)}
                    </div>
                ` : ''}

                ${theory.relatedMythologies.length > 0 ? `
                    <div class="theory-mythologies">
                        <strong>Related Mythologies:</strong>
                        ${theory.relatedMythologies.map(m => `<span class="mythology-tag">${m}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="theory-actions-detail">
                    ${isLoggedIn ? `
                        <button class="vote-btn-large ${userVote?.direction === 1 ? 'voted' : ''}"
                                data-theory-vote="${theory.id}" data-direction="1">
                            <span>👍</span> Upvote ${theory.votes > 0 ? `(${theory.votes})` : ''}
                        </button>
                        <button class="vote-btn-large ${userVote?.direction === -1 ? 'voted' : ''}"
                                data-theory-vote="${theory.id}" data-direction="-1">
                            <span>👎</span> Downvote
                        </button>
                    ` : ''}

                    ${isAuthor ? `
                        <button class="btn-edit" data-theory-edit="${theory.id}">
                            ✏️ Edit Theory
                        </button>
                        <button class="btn-delete" data-theory-delete="${theory.id}">
                            🗑️ Delete
                        </button>
                    ` : ''}
                </div>

                <div class="theory-comments">
                    <h3>Comments (${theory.comments.length})</h3>

                    ${isLoggedIn ? `
                        <form class="comment-form" data-comment-form="${theory.id}">
                            <textarea placeholder="Add your thoughts..." rows="3" required></textarea>
                            <button type="submit" class="btn-primary">Post Comment</button>
                        </form>
                    ` : `
                        <p class="comments-login-prompt">
                            <button class="theory-login-link" data-theory-login>Login</button> to comment
                        </p>
                    `}

                    <div class="comments-list">
                        ${theory.comments.map(comment => `
                            <div class="comment">
                                <img src="${comment.authorAvatar}" alt="${comment.author}" class="comment-avatar">
                                <div class="comment-content">
                                    <div class="comment-header">
                                        <span class="comment-author">${comment.author}</span>
                                        <span class="comment-date">${window.userTheories.formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p>${this.escapeHtml(comment.content)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button class="btn-back" data-theory-modal-close>← Back to List</button>
            </div>
        `;

        modal.style.display = 'flex';

        // Handle comment submission
        const commentForm = body.querySelector(`[data-comment-form="${theoryId}"]`);
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const textarea = commentForm.querySelector('textarea');
                const result = window.userTheories.addComment(theoryId, textarea.value);
                if (result.success) {
                    textarea.value = '';
                    this.showTheoryDetail(theoryId); // Refresh
                } else {
                    alert(result.error);
                }
            });
        }

        // Handle delete
        const deleteBtn = body.querySelector(`[data-theory-delete="${theoryId}"]`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this theory?')) {
                    const result = window.userTheories.deleteTheory(theoryId);
                    if (result.success) {
                        this.refreshTheories();
                        modal.style.display = 'none';
                    } else {
                        alert(result.error);
                    }
                }
            });
        }
    }

    refreshTheories() {
        this.render();

        // If modal is open, refresh it
        const modal = document.getElementById('theory-modal');
        if (modal && modal.style.display === 'flex') {
            this.renderModalContent();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    formatContent(text) {
        // Convert newlines to paragraphs
        return text
            .split('\n\n')
            .map(para => `<p>${this.escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }
}

// Auto-initialize all theory widgets on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theory-widget]').forEach(element => {
        new TheoryWidget(element);
    });
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TheoryWidget;
}
