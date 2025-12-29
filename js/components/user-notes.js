/**
 * User Notes Component
 *
 * Manages the UI and interactions for user notes/annotations on assets.
 * Integrates with NotesService for data operations and provides markdown rendering.
 *
 * Features:
 * - Real-time note updates
 * - Markdown rendering with XSS protection
 * - CRUD operations
 * - User ownership controls
 * - Responsive UI
 */

class UserNotesComponent {
    constructor(containerId = 'userNotesSection') {
        this.container = document.getElementById(containerId);
        this.assetType = null;
        this.assetId = null;
        this.currentSort = 'votes';
        this.editingNoteId = null;
        this.notesListener = null;
        this.currentUser = null;

        // Get service instance
        this.notesService = window.notesService;

        // Markdown renderer with XSS protection
        this.initMarkdownRenderer();

        // Initialize auth state listener
        this.initAuthListener();
    }

    /**
     * Initialize markdown renderer with XSS protection
     */
    initMarkdownRenderer() {
        // Simple markdown patterns (we'll use marked.js if available, otherwise fallback to simple regex)
        this.markdownPatterns = [
            { regex: /\*\*\*(.+?)\*\*\*/g, replace: '<strong><em>$1</em></strong>' }, // Bold + Italic
            { regex: /\*\*(.+?)\*\*/g, replace: '<strong>$1</strong>' },              // Bold
            { regex: /\*(.+?)\*/g, replace: '<em>$1</em>' },                          // Italic
            { regex: /___(.+?)___/g, replace: '<strong><em>$1</em></strong>' },       // Bold + Italic alt
            { regex: /__(.+?)__/g, replace: '<strong>$1</strong>' },                  // Bold alt
            { regex: /_(.+?)_/g, replace: '<em>$1</em>' },                            // Italic alt
            { regex: /\[(.+?)\]\((.+?)\)/g, replace: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>' }, // Links
            { regex: /^- (.+)$/gm, replace: '<li>$1</li>' },                          // Unordered list items
            { regex: /^\d+\. (.+)$/gm, replace: '<li>$1</li>' },                      // Ordered list items
            { regex: /`(.+?)`/g, replace: '<code>$1</code>' },                        // Inline code
        ];

        // XSS protection: allowed HTML tags
        this.allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li', 'code', 'pre'];
    }

    /**
     * Initialize authentication state listener
     */
    initAuthListener() {
        if (firebase && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateAuthUI();
            });
        }
    }

    /**
     * Update UI based on auth state
     */
    updateAuthUI() {
        const addNoteBtn = document.getElementById('addNoteBtn');
        if (addNoteBtn) {
            addNoteBtn.style.display = this.currentUser ? 'flex' : 'none';
        }
    }

    /**
     * Initialize the component
     * @param {string} assetType - Type of asset (deity, hero, etc.)
     * @param {string} assetId - ID of the asset
     */
    async init(assetType, assetId) {
        if (!this.container) {
            console.warn('User notes container not found');
            return;
        }

        this.assetType = assetType;
        this.assetId = assetId;

        // Set data attributes on container
        this.container.setAttribute('data-asset-type', assetType);
        this.container.setAttribute('data-asset-id', assetId);

        // Initialize service
        await this.notesService.init();

        // Set up event listeners
        this.setupEventListeners();

        // Load and listen to notes
        this.loadNotes();

        console.log(`User notes initialized for ${assetType}/${assetId}`);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add note button
        const addNoteBtn = document.getElementById('addNoteBtn');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => this.openNoteEditor());
        }

        // Sort dropdown
        const sortSelect = document.getElementById('notesSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadNotes();
            });
        }

        // Note editor form
        const editorForm = document.getElementById('noteEditorForm');
        if (editorForm) {
            editorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }

        // Editor tabs
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchEditorTab(tab.getAttribute('data-tab'));
            });
        });

        // Character counter
        const textarea = document.getElementById('noteContentInput');
        if (textarea) {
            textarea.addEventListener('input', () => this.updateCharacterCount());
        }

        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeNoteEditor();
            }
        });
    }

    /**
     * Load notes with real-time updates
     */
    loadNotes() {
        // Show loading state
        this.showLoading();

        // Stop existing listener
        if (this.notesListener) {
            this.notesListener();
        }

        // Set up real-time listener
        this.notesListener = this.notesService.listenToNotes(
            this.assetType,
            this.assetId,
            (notes) => {
                this.renderNotes(notes);
                this.updateNoteCount(notes.length);
            },
            this.currentSort
        );
    }

    /**
     * Render notes list
     */
    renderNotes(notes) {
        const notesList = document.getElementById('notesList');
        const notesEmpty = document.getElementById('notesEmpty');
        const notesLoading = document.getElementById('notesLoading');

        if (!notesList) return;

        // Hide loading
        if (notesLoading) {
            notesLoading.style.display = 'none';
        }

        // Show/hide empty state
        if (notes.length === 0) {
            if (notesEmpty) {
                notesEmpty.style.display = 'block';
            }
            // Clear any existing notes
            const existingNotes = notesList.querySelectorAll('.note-card');
            existingNotes.forEach(note => note.remove());
            return;
        } else {
            if (notesEmpty) {
                notesEmpty.style.display = 'none';
            }
        }

        // Clear existing notes
        const existingNotes = notesList.querySelectorAll('.note-card');
        existingNotes.forEach(note => note.remove());

        // Render each note
        notes.forEach(note => {
            const noteCard = this.createNoteCard(note);
            notesList.appendChild(noteCard);
        });
    }

    /**
     * Create a note card element
     */
    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-note-id', note.id);

        // Check if current user owns this note
        const isOwner = this.currentUser && this.currentUser.uid === note.userId;

        // Format timestamp
        const timestamp = this.formatTimestamp(note.createdAt);

        // Render markdown content
        const renderedContent = this.renderMarkdown(note.content);

        card.innerHTML = `
            <div class="note-header">
                <div class="note-author">
                    <img
                        src="${note.userAvatar || this.getDefaultAvatar(note.userName)}"
                        alt="${this.escapeHtml(note.userName)}"
                        class="author-avatar"
                        onerror="this.src='${this.getDefaultAvatar(note.userName)}'"
                    >
                    <div class="author-info">
                        <span class="author-name">${this.escapeHtml(note.userName)}</span>
                        <span class="note-timestamp">${timestamp}</span>
                    </div>
                </div>

                ${isOwner ? `
                    <div class="note-actions">
                        <button class="action-btn edit-btn" title="Edit note" data-note-id="${note.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" title="Delete note" data-note-id="${note.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>

            <div class="note-content">
                ${renderedContent}
            </div>

            <div class="note-footer">
                <div class="vote-section">
                    <button class="vote-btn vote-up" title="Helpful" data-note-id="${note.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span class="vote-count">${note.votes || 0}</span>
                    </button>
                    <button class="vote-btn vote-down" title="Not helpful" data-note-id="${note.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                        </svg>
                    </button>
                </div>

                ${note.isEdited ? '<span class="edited-badge" title="This note was edited">Edited</span>' : ''}
            </div>
        `;

        // Add event listeners
        if (isOwner) {
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');

            editBtn?.addEventListener('click', () => this.editNote(note));
            deleteBtn?.addEventListener('click', () => this.deleteNote(note.id));
        }

        // Vote buttons (placeholder for Agent 8)
        const voteUpBtn = card.querySelector('.vote-up');
        const voteDownBtn = card.querySelector('.vote-down');

        voteUpBtn?.addEventListener('click', () => {
            console.log('Vote up (will be implemented by Agent 8):', note.id);
        });

        voteDownBtn?.addEventListener('click', () => {
            console.log('Vote down (will be implemented by Agent 8):', note.id);
        });

        return card;
    }

    /**
     * Render markdown with XSS protection
     */
    renderMarkdown(content) {
        if (!content) return '';

        let html = this.escapeHtml(content);

        // Apply markdown patterns
        this.markdownPatterns.forEach(pattern => {
            html = html.replace(pattern.regex, pattern.replace);
        });

        // Convert newlines to paragraphs
        const paragraphs = html.split('\n\n').filter(p => p.trim());
        html = paragraphs.map(p => {
            // Check if it's a list
            if (p.includes('<li>')) {
                const isOrdered = /^\d+\./.test(content);
                const tag = isOrdered ? 'ol' : 'ul';
                return `<${tag}>${p}</${tag}>`;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // Sanitize HTML (remove any dangerous tags)
        html = this.sanitizeHtml(html);

        return html;
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHtml(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script tags and event handlers
        const scripts = tempDiv.querySelectorAll('script, iframe, object, embed');
        scripts.forEach(script => script.remove());

        // Remove event handlers from all elements
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            // Remove on* attributes
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });

            // Remove javascript: URLs
            if (el.hasAttribute('href')) {
                const href = el.getAttribute('href');
                if (href && href.toLowerCase().startsWith('javascript:')) {
                    el.removeAttribute('href');
                }
            }
        });

        return tempDiv.innerHTML;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format timestamp to relative time
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Just now';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }

    /**
     * Get default avatar URL
     */
    getDefaultAvatar(userName) {
        const name = encodeURIComponent(userName || 'User');
        return `https://ui-avatars.com/api/?name=${name}&background=random&size=80`;
    }

    /**
     * Update note count display
     */
    updateNoteCount(count) {
        const countElement = document.getElementById('notesCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const notesLoading = document.getElementById('notesLoading');
        const notesEmpty = document.getElementById('notesEmpty');

        if (notesLoading) {
            notesLoading.style.display = 'block';
        }
        if (notesEmpty) {
            notesEmpty.style.display = 'none';
        }
    }

    /**
     * Open note editor modal
     */
    openNoteEditor(note = null) {
        if (!this.currentUser) {
            alert('Please sign in to add notes');
            return;
        }

        const modal = document.getElementById('noteEditorModal');
        const title = document.getElementById('editorModalTitle');
        const textarea = document.getElementById('noteContentInput');
        const errorDiv = document.getElementById('noteError');

        if (!modal || !textarea) return;

        // Set mode (create or edit)
        this.editingNoteId = note ? note.id : null;

        // Update modal title
        if (title) {
            title.textContent = note ? 'Edit Your Note' : 'Add Your Note';
        }

        // Set content
        textarea.value = note ? note.content : '';
        this.updateCharacterCount();

        // Clear errors
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        // Switch to write tab
        this.switchEditorTab('write');

        // Open modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus textarea
        setTimeout(() => textarea.focus(), 100);
    }

    /**
     * Close note editor modal
     */
    closeNoteEditor() {
        const modal = document.getElementById('noteEditorModal');
        const textarea = document.getElementById('noteContentInput');

        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (textarea) {
            textarea.value = '';
        }

        this.editingNoteId = null;
    }

    /**
     * Switch editor tab
     */
    switchEditorTab(tabName) {
        const tabs = document.querySelectorAll('.editor-tab');
        const contents = document.querySelectorAll('.editor-content');

        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        contents.forEach(content => {
            if (content.id === `${tabName}Content`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Update preview if switching to preview tab
        if (tabName === 'preview') {
            this.updatePreview();
        }
    }

    /**
     * Update preview
     */
    updatePreview() {
        const textarea = document.getElementById('noteContentInput');
        const preview = document.getElementById('notePreview');

        if (!textarea || !preview) return;

        const content = textarea.value.trim();

        if (content) {
            preview.innerHTML = this.renderMarkdown(content);
        } else {
            preview.innerHTML = '<p class="preview-placeholder">Nothing to preview yet. Start writing!</p>';
        }
    }

    /**
     * Update character count
     */
    updateCharacterCount() {
        const textarea = document.getElementById('noteContentInput');
        const countElement = document.getElementById('charCount');

        if (!textarea || !countElement) return;

        const count = textarea.value.length;
        countElement.textContent = count;

        // Update color based on length
        if (count < 20) {
            countElement.style.color = 'var(--color-error, #ef4444)';
        } else if (count > 1900) {
            countElement.style.color = 'var(--color-warning, #f59e0b)';
        } else {
            countElement.style.color = 'var(--color-text-secondary)';
        }
    }

    /**
     * Save note (create or update)
     */
    async saveNote() {
        const textarea = document.getElementById('noteContentInput');
        const saveBtn = document.getElementById('saveNoteBtn');
        const errorDiv = document.getElementById('noteError');

        if (!textarea || !saveBtn) return;

        const content = textarea.value.trim();

        // Clear previous errors
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        // Disable save button
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            if (this.editingNoteId) {
                // Update existing note
                await this.notesService.updateNote(
                    this.assetType,
                    this.assetId,
                    this.editingNoteId,
                    content
                );
            } else {
                // Create new note
                await this.notesService.createNote(
                    this.assetType,
                    this.assetId,
                    content
                );
            }

            // Close modal
            this.closeNoteEditor();

        } catch (error) {
            console.error('Error saving note:', error);

            // Show error
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to save note. Please try again.';
                errorDiv.style.display = 'block';
            }

        } finally {
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Note';
        }
    }

    /**
     * Edit note
     */
    editNote(note) {
        this.openNoteEditor(note);
    }

    /**
     * Delete note
     */
    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            await this.notesService.deleteNote(this.assetType, this.assetId, noteId);
            console.log('Note deleted successfully');
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note: ' + error.message);
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.notesListener) {
            this.notesListener();
        }
        this.notesService.stopListening(this.assetType, this.assetId);
    }
}

// Create global instance helper
window.UserNotesComponent = UserNotesComponent;
