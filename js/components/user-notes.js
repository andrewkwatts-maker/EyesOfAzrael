/**
 * User Notes Component
 *
 * Manages the UI and interactions for user notes/annotations on entity pages.
 * Integrates with NotesService for data operations and provides markdown rendering.
 *
 * Features:
 * - Real-time note updates via Firebase listeners
 * - Markdown rendering with XSS protection
 * - CRUD operations with optimistic UI updates
 * - Text truncation with expand/collapse
 * - Helpful voting system with score display
 * - Reply and report functionality
 * - User ownership controls
 * - Note categories/tags
 * - Character count with progress indicator
 * - Responsive UI with animations
 *
 * Last updated: 2026-01-07
 */

class UserNotesComponent {
    constructor(containerId = 'communityNotesPanel') {
        this.container = document.getElementById(containerId);
        this.entityCollection = null;
        this.entityId = null;
        this.entityName = null;
        this.currentSort = 'recent';
        this.currentFilter = 'all'; // 'all', 'mine', or category
        this.editingNoteId = null;
        this.notesListener = null;
        this.currentUser = null;
        this.userVotes = new Map(); // Track user's votes: noteId -> 'up' | 'down' | null
        this.expandedNotes = new Set(); // Track expanded notes
        this.notes = []; // Current notes cache
        this.selectedTags = new Set(); // Selected tags for new note

        // Configuration
        this.MAX_LINES = 5;
        this.LINE_HEIGHT = 24; // pixels
        this.MAX_CHARS = 2000;
        this.MIN_CHARS = 20;
        this.WARNING_THRESHOLD = 1800;

        // Note categories/tags
        this.NOTE_CATEGORIES = [
            { id: 'insight', label: 'Insight', icon: 'lightbulb', color: '#f59e0b' },
            { id: 'historical', label: 'Historical Context', icon: 'book', color: '#6366f1' },
            { id: 'interpretation', label: 'Interpretation', icon: 'chat', color: '#8b5cf6' },
            { id: 'connection', label: 'Connection', icon: 'link', color: '#22c55e' },
            { id: 'question', label: 'Question', icon: 'question', color: '#ef4444' },
            { id: 'source', label: 'Source Reference', icon: 'document', color: '#06b6d4' }
        ];

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
        // Simple markdown patterns with XSS-safe replacements
        this.markdownPatterns = [
            { regex: /\*\*\*(.+?)\*\*\*/g, replace: '<strong><em>$1</em></strong>' },
            { regex: /\*\*(.+?)\*\*/g, replace: '<strong>$1</strong>' },
            { regex: /\*(.+?)\*/g, replace: '<em>$1</em>' },
            { regex: /___(.+?)___/g, replace: '<strong><em>$1</em></strong>' },
            { regex: /__(.+?)__/g, replace: '<strong>$1</strong>' },
            { regex: /_(.+?)_/g, replace: '<em>$1</em>' },
            { regex: /\[(.+?)\]\((.+?)\)/g, replace: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>' },
            { regex: /^- (.+)$/gm, replace: '<li>$1</li>' },
            { regex: /^\d+\. (.+)$/gm, replace: '<li>$1</li>' },
            { regex: /`(.+?)`/g, replace: '<code>$1</code>' },
        ];
    }

    /**
     * Initialize authentication state listener
     */
    initAuthListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateAuthUI();
                if (user && this.entityId) {
                    this.loadUserVotes();
                }
            });
        }
    }

    /**
     * Update UI based on auth state
     */
    updateAuthUI() {
        const addNoteForm = this.container?.querySelector('.inline-note-form');
        const loginPrompt = this.container?.querySelector('.notes-login-prompt');

        if (addNoteForm) {
            addNoteForm.style.display = this.currentUser ? 'flex' : 'none';
        }
        if (loginPrompt) {
            loginPrompt.style.display = this.currentUser ? 'none' : 'flex';
        }

        // Update user avatar in form
        if (this.currentUser) {
            const formAvatar = this.container?.querySelector('.form-avatar img');
            if (formAvatar) {
                formAvatar.src = this.currentUser.photoURL || this.getDefaultAvatar(this.currentUser.displayName);
            }
        }
    }

    /**
     * Initialize the component
     * @param {string} entityCollection - Collection name (deities, heroes, creatures, etc.)
     * @param {string} entityId - ID of the entity
     * @param {string} entityName - Display name of the entity (optional)
     */
    async init(entityCollection, entityId, entityName = '') {
        if (!this.container) {
            console.warn('User notes container not found');
            return;
        }

        this.entityCollection = entityCollection;
        this.entityId = entityId;
        this.entityName = entityName || this.formatEntityName(entityId);

        // Render the initial structure
        this.renderStructure();

        // Initialize service
        if (this.notesService) {
            await this.notesService.init();
        }

        // Set up event listeners
        this.setupEventListeners();

        // Load and listen to notes
        this.loadNotes();

        // Load user votes if authenticated
        if (this.currentUser) {
            this.loadUserVotes();
        }

        console.log(`User notes initialized for ${entityCollection}/${entityId}`);
    }

    /**
     * Format entity ID to display name
     */
    formatEntityName(entityId) {
        if (!entityId) return 'Entity';
        return entityId
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Render the component structure
     */
    renderStructure() {
        this.container.innerHTML = `
            <div class="notes-panel-content">
                <!-- Add Note Form (logged in users) -->
                <div class="inline-note-form" style="display: ${this.currentUser ? 'flex' : 'none'}">
                    <div class="form-avatar">
                        <img src="${this.currentUser?.photoURL || this.getDefaultAvatar(this.currentUser?.displayName)}"
                             alt="Your avatar"
                             onerror="this.src='${this.getDefaultAvatar('User')}'">
                    </div>
                    <div class="form-input-wrapper">
                        <!-- Formatting Toolbar -->
                        <div class="formatting-toolbar">
                            <button type="button" class="format-btn" data-format="bold" title="Bold (Ctrl+B)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                                    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                                </svg>
                            </button>
                            <button type="button" class="format-btn" data-format="italic" title="Italic (Ctrl+I)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="19" y1="4" x2="10" y2="4"/>
                                    <line x1="14" y1="20" x2="5" y2="20"/>
                                    <line x1="15" y1="4" x2="9" y2="20"/>
                                </svg>
                            </button>
                            <button type="button" class="format-btn" data-format="link" title="Add Link">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                            </button>
                            <span class="toolbar-divider"></span>
                            <button type="button" class="format-btn" data-format="list" title="Bullet List">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/>
                                    <line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <circle cx="4" cy="6" r="1" fill="currentColor"/>
                                    <circle cx="4" cy="12" r="1" fill="currentColor"/>
                                    <circle cx="4" cy="18" r="1" fill="currentColor"/>
                                </svg>
                            </button>
                            <span class="toolbar-divider"></span>
                            <button type="button" class="format-btn preview-toggle" data-format="preview" title="Preview">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                <span>Preview</span>
                            </button>
                        </div>

                        <!-- Textarea and Preview -->
                        <div class="note-editor-container">
                            <textarea
                                id="noteContentInput"
                                placeholder="Share your thoughts, insights, or interpretations about ${this.entityName || 'this entity'}..."
                                rows="4"
                                maxlength="${this.MAX_CHARS}"
                            ></textarea>
                            <div class="note-preview" id="notePreview" style="display: none;">
                                <div class="preview-content"></div>
                            </div>
                        </div>

                        <!-- Tags Selection -->
                        <div class="note-tags-selection">
                            <span class="tags-label">Add tags:</span>
                            <div class="tags-list">
                                ${this.NOTE_CATEGORIES.map(cat => `
                                    <button type="button" class="tag-btn" data-tag="${cat.id}" style="--tag-color: ${cat.color}">
                                        ${this.getCategoryIcon(cat.icon)}
                                        <span>${cat.label}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Character Count Progress -->
                        <div class="form-actions">
                            <div class="form-meta">
                                <div class="char-count-container">
                                    <div class="char-progress">
                                        <div class="char-progress-bar" id="charProgressBar" style="width: 0%"></div>
                                    </div>
                                    <span class="char-count">
                                        <span id="charCount">0</span> / ${this.MAX_CHARS}
                                    </span>
                                </div>
                                <span class="markdown-hint">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                        <polyline points="13 2 13 9 20 9"/>
                                    </svg>
                                    Markdown supported
                                </span>
                            </div>
                            <div class="form-buttons">
                                <button type="button" class="btn-cancel" id="cancelNoteBtn" style="display: none;">Cancel</button>
                                <button type="submit" class="btn-submit" id="submitNoteBtn" disabled>
                                    <span class="btn-text">Share Note</span>
                                    <span class="btn-loading" style="display: none;">
                                        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div class="note-error" id="noteError" style="display: none;"></div>
                    </div>
                </div>

                <!-- Login Prompt (non-logged in users) -->
                <div class="notes-login-prompt" style="display: ${this.currentUser ? 'none' : 'flex'}">
                    <div class="login-prompt-content">
                        <div class="login-prompt-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <div class="login-prompt-text">
                            <span class="login-prompt-title">Join the conversation</span>
                            <span class="login-prompt-subtitle">Sign in to share your thoughts about ${this.entityName || 'this entity'}</span>
                        </div>
                    </div>
                    <button class="btn-sign-in" onclick="window.showLoginOverlay && window.showLoginOverlay()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                            <polyline points="10 17 15 12 10 7"/>
                            <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Sign In
                    </button>
                </div>

                <!-- Notes Controls -->
                <div class="notes-controls">
                    <div class="notes-filter-tabs">
                        <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                            All Notes
                        </button>
                        ${this.currentUser ? `
                            <button class="filter-tab ${this.currentFilter === 'mine' ? 'active' : ''}" data-filter="mine">
                                My Notes
                            </button>
                        ` : ''}
                    </div>
                    <div class="sort-dropdown">
                        <label for="notesSortSelect">Sort:</label>
                        <select id="notesSortSelect" class="sort-select">
                            <option value="recent" ${this.currentSort === 'recent' ? 'selected' : ''}>Newest</option>
                            <option value="votes" ${this.currentSort === 'votes' ? 'selected' : ''}>Most Helpful</option>
                            <option value="oldest" ${this.currentSort === 'oldest' ? 'selected' : ''}>Oldest</option>
                        </select>
                    </div>
                </div>

                <!-- Loading State -->
                <div class="notes-loading" id="notesLoading">
                    <div class="loading-spinner">
                        <svg width="40" height="40" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-primary)" stroke-width="2" fill="none" stroke-linecap="round">
                                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                            </path>
                        </svg>
                    </div>
                    <p>Loading community notes...</p>
                </div>

                <!-- Notes List -->
                <div class="notes-list" id="notesList"></div>

                <!-- Empty State -->
                <div class="notes-empty-state" id="notesEmpty" style="display: none;">
                    <div class="empty-illustration">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-opacity="0.3"/>
                            <path d="M12 8v4"/>
                            <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">No notes yet</h3>
                    <p class="empty-description">Be the first to share your insights about <strong>${this.entityName || 'this entity'}</strong>. Your knowledge helps the community!</p>
                    ${this.currentUser ? `
                        <button class="btn-action btn-add-first" id="addFirstNoteBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            Write the First Note
                        </button>
                    ` : `
                        <button class="btn-action btn-sign-in-empty" onclick="window.showLoginOverlay && window.showLoginOverlay()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                            Sign In to Contribute
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Get category icon SVG
     */
    getCategoryIcon(iconName) {
        const icons = {
            lightbulb: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/></svg>',
            book: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
            chat: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            link: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
            question: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>',
            document: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
        };
        return icons[iconName] || '';
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Textarea input handling
        const textarea = this.container.querySelector('#noteContentInput');
        if (textarea) {
            textarea.addEventListener('input', () => this.handleTextareaInput());
            textarea.addEventListener('focus', () => this.handleTextareaFocus());
            textarea.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        }

        // Submit button
        const submitBtn = this.container.querySelector('#submitNoteBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }

        // Cancel button
        const cancelBtn = this.container.querySelector('#cancelNoteBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Sort dropdown
        const sortSelect = this.container.querySelector('#notesSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderFilteredNotes();
            });
        }

        // Filter tabs
        const filterTabs = this.container.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.renderFilteredNotes();
            });
        });

        // Formatting toolbar
        const formatBtns = this.container.querySelectorAll('.format-btn');
        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFormatClick(btn.dataset.format));
        });

        // Tags selection
        const tagBtns = this.container.querySelectorAll('.tag-btn');
        tagBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleTag(btn.dataset.tag));
        });

        // Add first note button
        const addFirstBtn = this.container.querySelector('#addFirstNoteBtn');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => {
                const textarea = this.container.querySelector('#noteContentInput');
                if (textarea) {
                    textarea.focus();
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }

        // Delegate click events for note cards
        const notesList = this.container.querySelector('#notesList');
        if (notesList) {
            notesList.addEventListener('click', (e) => this.handleNoteListClick(e));
        }
    }

    /**
     * Handle formatting toolbar clicks
     */
    handleFormatClick(format) {
        const textarea = this.container.querySelector('#noteContentInput');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = '';
        let cursorOffset = 0;

        switch (format) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'link':
                newText = `[${selectedText || 'link text'}](url)`;
                cursorOffset = selectedText ? -1 : -5;
                break;
            case 'list':
                const lines = selectedText ? selectedText.split('\n') : ['item'];
                newText = lines.map(line => `- ${line}`).join('\n');
                break;
            case 'preview':
                this.togglePreview();
                return;
        }

        textarea.value = text.substring(0, start) + newText + text.substring(end);
        textarea.focus();

        const newCursorPos = start + newText.length + cursorOffset;
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        this.handleTextareaInput();
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.handleFormatClick('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.handleFormatClick('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    this.handleFormatClick('link');
                    break;
            }
        }
    }

    /**
     * Toggle markdown preview
     */
    togglePreview() {
        const textarea = this.container.querySelector('#noteContentInput');
        const preview = this.container.querySelector('#notePreview');
        const previewContent = this.container.querySelector('.preview-content');
        const previewBtn = this.container.querySelector('.preview-toggle');

        if (!textarea || !preview || !previewContent) return;

        const isShowing = preview.style.display !== 'none';

        if (isShowing) {
            // Hide preview, show textarea
            preview.style.display = 'none';
            textarea.style.display = 'block';
            previewBtn?.classList.remove('active');
        } else {
            // Show preview, hide textarea
            previewContent.innerHTML = this.renderMarkdown(textarea.value) || '<p class="preview-placeholder">Nothing to preview yet...</p>';
            preview.style.display = 'block';
            textarea.style.display = 'none';
            previewBtn?.classList.add('active');
        }
    }

    /**
     * Toggle tag selection
     */
    toggleTag(tagId) {
        const btn = this.container.querySelector(`.tag-btn[data-tag="${tagId}"]`);
        if (!btn) return;

        if (this.selectedTags.has(tagId)) {
            this.selectedTags.delete(tagId);
            btn.classList.remove('selected');
        } else {
            this.selectedTags.add(tagId);
            btn.classList.add('selected');
        }
    }

    /**
     * Render filtered and sorted notes
     */
    renderFilteredNotes() {
        let filtered = [...this.notes];

        // Apply filter
        if (this.currentFilter === 'mine' && this.currentUser) {
            filtered = filtered.filter(note => note.userId === this.currentUser.uid);
        }

        // Apply sort
        switch (this.currentSort) {
            case 'recent':
                filtered.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
                break;
            case 'oldest':
                filtered.sort((a, b) => (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0));
                break;
            case 'votes':
                filtered.sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
                break;
        }

        this.renderNotes(filtered);
    }

    /**
     * Handle textarea input
     */
    handleTextareaInput() {
        const textarea = this.container.querySelector('#noteContentInput');
        const charCount = this.container.querySelector('#charCount');
        const charProgressBar = this.container.querySelector('#charProgressBar');
        const submitBtn = this.container.querySelector('#submitNoteBtn');
        const charCountContainer = this.container.querySelector('.char-count-container');

        if (!textarea || !charCount || !submitBtn) return;

        const count = textarea.value.length;
        charCount.textContent = count;

        // Update progress bar
        const percentage = Math.min((count / this.MAX_CHARS) * 100, 100);
        if (charProgressBar) {
            charProgressBar.style.width = `${percentage}%`;

            // Update progress bar color based on state
            charProgressBar.classList.remove('warning', 'error', 'valid');
            if (count < this.MIN_CHARS) {
                charProgressBar.classList.add('error');
            } else if (count > this.WARNING_THRESHOLD) {
                charProgressBar.classList.add('warning');
            } else {
                charProgressBar.classList.add('valid');
            }
        }

        // Update character count styling
        if (charCountContainer) {
            charCountContainer.classList.remove('warning', 'error', 'valid');

            if (count < this.MIN_CHARS) {
                charCountContainer.classList.add('error');
            } else if (count > this.WARNING_THRESHOLD) {
                charCountContainer.classList.add('warning');
            } else {
                charCountContainer.classList.add('valid');
            }
        }

        // Enable/disable submit button
        submitBtn.disabled = count < this.MIN_CHARS || count > this.MAX_CHARS;

        // Auto-resize textarea
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
    }

    /**
     * Handle textarea focus
     */
    handleTextareaFocus() {
        const cancelBtn = this.container.querySelector('#cancelNoteBtn');
        if (cancelBtn && this.editingNoteId) {
            cancelBtn.style.display = 'inline-flex';
        }
    }

    /**
     * Handle clicks within the notes list (event delegation)
     */
    handleNoteListClick(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const noteCard = target.closest('.note-card');
        if (!noteCard) return;

        const noteId = noteCard.dataset.noteId;

        // Handle vote buttons by data attribute
        if (target.dataset.vote === 'up' || target.classList.contains('helpful-btn')) {
            this.handleVote(noteId, 'up');
        } else if (target.dataset.vote === 'down' || target.classList.contains('unhelpful-btn')) {
            this.handleVote(noteId, 'down');
        } else if (target.classList.contains('btn-reply')) {
            this.handleReply(noteId);
        } else if (target.classList.contains('btn-report')) {
            this.handleReport(noteId);
        } else if (target.classList.contains('btn-edit')) {
            this.handleEdit(noteId);
        } else if (target.classList.contains('btn-delete')) {
            this.handleDelete(noteId);
        } else if (target.classList.contains('btn-expand')) {
            this.toggleNoteExpansion(noteId);
        }
    }

    /**
     * Load notes with real-time updates
     */
    loadNotes() {
        this.showLoading();

        // Stop existing listener
        if (this.notesListener) {
            this.notesListener();
        }

        // Set up real-time listener
        this.notesListener = this.notesService.listenToNotes(
            this.entityCollection,
            this.entityId,
            (notes) => {
                this.notes = notes;
                this.renderNotes(notes);
                this.updateNoteCount(notes.length);
            },
            this.currentSort
        );
    }

    /**
     * Load user's votes from localStorage or Firebase
     */
    async loadUserVotes() {
        if (!this.currentUser) return;

        // For now, use localStorage. Could be expanded to Firebase for persistence
        const storageKey = `eoa_votes_${this.currentUser.uid}`;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const votes = JSON.parse(stored);
                this.userVotes = new Map(Object.entries(votes));
            }
        } catch (e) {
            console.warn('Error loading user votes:', e);
        }
    }

    /**
     * Save user's votes to localStorage
     */
    saveUserVotes() {
        if (!this.currentUser) return;

        const storageKey = `eoa_votes_${this.currentUser.uid}`;
        try {
            const votesObj = Object.fromEntries(this.userVotes);
            localStorage.setItem(storageKey, JSON.stringify(votesObj));
        } catch (e) {
            console.warn('Error saving user votes:', e);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loading = this.container.querySelector('#notesLoading');
        const empty = this.container.querySelector('#notesEmpty');
        const list = this.container.querySelector('#notesList');

        if (loading) loading.style.display = 'flex';
        if (empty) empty.style.display = 'none';
        if (list) list.innerHTML = '';
    }

    /**
     * Render notes list
     */
    renderNotes(notes) {
        const loading = this.container.querySelector('#notesLoading');
        const empty = this.container.querySelector('#notesEmpty');
        const list = this.container.querySelector('#notesList');

        if (loading) loading.style.display = 'none';

        if (notes.length === 0) {
            if (empty) empty.style.display = 'flex';
            if (list) list.innerHTML = '';
            return;
        }

        if (empty) empty.style.display = 'none';
        if (!list) return;

        list.innerHTML = notes.map(note => this.createNoteCard(note)).join('');

        // Apply truncation after render
        this.applyTextTruncation();
    }

    /**
     * Create a note card HTML string
     */
    createNoteCard(note) {
        const isOwner = this.currentUser && this.currentUser.uid === note.userId;
        const timestamp = this.formatTimestamp(note.createdAt);
        const renderedContent = this.renderMarkdown(note.content);
        const userVote = this.userVotes.get(note.id);
        const isExpanded = this.expandedNotes.has(note.id);

        // Calculate vote score
        const upvotes = note.upvotes || 0;
        const downvotes = note.downvotes || 0;
        const helpfulScore = upvotes - downvotes;

        // Get tags display
        const tags = note.tags || [];
        const tagsHtml = tags.length > 0 ? `
            <div class="note-tags">
                ${tags.map(tagId => {
                    const cat = this.NOTE_CATEGORIES.find(c => c.id === tagId);
                    if (!cat) return '';
                    return `<span class="note-tag" style="--tag-color: ${cat.color}">${this.getCategoryIcon(cat.icon)} ${cat.label}</span>`;
                }).join('')}
            </div>
        ` : '';

        // Author badge (contributor status)
        const authorBadge = this.getAuthorBadge(note);

        return `
            <div class="note-card ${isExpanded ? 'expanded' : ''} ${isOwner ? 'is-owner' : ''}" data-note-id="${note.id}">
                <div class="note-card-header">
                    <div class="note-author">
                        <div class="note-author-avatar-wrapper">
                            <img
                                class="note-author-avatar"
                                src="${note.userAvatar || this.getDefaultAvatar(note.userName)}"
                                alt="${this.escapeHtml(note.userName)}"
                                onerror="this.src='${this.getDefaultAvatar(note.userName)}'"
                            >
                            ${isOwner ? '<span class="owner-indicator" title="Your note"></span>' : ''}
                        </div>
                        <div class="note-author-info">
                            <div class="note-author-name-row">
                                <span class="note-author-name">${this.escapeHtml(note.userName)}</span>
                                ${authorBadge}
                            </div>
                            <div class="note-meta-row">
                                <span class="note-timestamp">${timestamp}</span>
                                ${note.isEdited ? '<span class="note-edited-indicator">edited</span>' : ''}
                            </div>
                        </div>
                    </div>
                    ${helpfulScore > 0 ? `
                        <div class="helpful-score ${helpfulScore >= 5 ? 'high' : ''}" title="${upvotes} found this helpful">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>${helpfulScore}</span>
                        </div>
                    ` : ''}
                </div>

                ${tagsHtml}

                <div class="note-content-wrapper">
                    <div class="note-content ${isExpanded ? 'expanded' : 'truncated'}">
                        ${renderedContent}
                    </div>
                    <button class="btn-expand" style="display: none;">
                        <span class="expand-text">Show more</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>

                <div class="note-card-footer">
                    <div class="vote-buttons compact">
                        <button class="vote-btn helpful-btn ${userVote === 'up' ? 'active' : ''}"
                                title="Mark as helpful"
                                aria-label="Mark as helpful"
                                data-vote="up">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                            <span class="vote-label">Helpful</span>
                            <span class="vote-count upvote-count">${upvotes}</span>
                        </button>
                        <button class="vote-btn unhelpful-btn ${userVote === 'down' ? 'active' : ''}"
                                title="Not helpful"
                                aria-label="Not helpful"
                                data-vote="down">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                            </svg>
                            ${downvotes > 0 ? `<span class="vote-count downvote-count">${downvotes}</span>` : ''}
                        </button>
                    </div>

                    <div class="note-actions">
                        <button class="note-action-btn btn-reply" title="Reply to this note">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 17 4 12 9 7"/>
                                <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                            </svg>
                            <span class="action-label">Reply</span>
                        </button>
                        ${isOwner ? `
                            <button class="note-action-btn btn-edit" title="Edit your note">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                <span class="action-label">Edit</span>
                            </button>
                            <button class="note-action-btn btn-delete" title="Delete your note">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                <span class="action-label">Delete</span>
                            </button>
                        ` : `
                            <button class="note-action-btn btn-report" title="Report this note">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                                    <line x1="4" y1="22" x2="4" y2="15"/>
                                </svg>
                                <span class="action-label">Report</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get author badge based on contribution status
     */
    getAuthorBadge(note) {
        // Could be expanded to check user's contribution count, etc.
        if (note.userBadge === 'scholar') {
            return '<span class="author-badge badge-scholar" title="Mythology Scholar">Scholar</span>';
        }
        if (note.userBadge === 'contributor') {
            return '<span class="author-badge badge-contributor" title="Active Contributor">Contributor</span>';
        }
        return '';
    }

    /**
     * Apply text truncation to note content
     */
    applyTextTruncation() {
        const noteCards = this.container.querySelectorAll('.note-card');

        noteCards.forEach(card => {
            const noteId = card.dataset.noteId;
            const content = card.querySelector('.note-content');
            const expandBtn = card.querySelector('.btn-expand');

            if (!content || !expandBtn) return;

            // Check if content exceeds max lines
            const lineHeight = parseInt(getComputedStyle(content).lineHeight) || this.LINE_HEIGHT;
            const maxHeight = lineHeight * this.MAX_LINES;

            if (content.scrollHeight > maxHeight && !this.expandedNotes.has(noteId)) {
                content.classList.add('truncated');
                content.style.maxHeight = maxHeight + 'px';
                expandBtn.style.display = 'flex';
            } else if (this.expandedNotes.has(noteId)) {
                content.classList.remove('truncated');
                content.classList.add('expanded');
                content.style.maxHeight = 'none';
                expandBtn.style.display = content.scrollHeight > maxHeight ? 'flex' : 'none';
                expandBtn.querySelector('.expand-text').textContent = 'Show less';
                expandBtn.querySelector('svg').style.transform = 'rotate(180deg)';
            }
        });
    }

    /**
     * Toggle note expansion
     */
    toggleNoteExpansion(noteId) {
        const card = this.container.querySelector(`.note-card[data-note-id="${noteId}"]`);
        if (!card) return;

        const content = card.querySelector('.note-content');
        const expandBtn = card.querySelector('.btn-expand');
        const expandText = expandBtn?.querySelector('.expand-text');
        const expandIcon = expandBtn?.querySelector('svg');

        if (this.expandedNotes.has(noteId)) {
            // Collapse
            this.expandedNotes.delete(noteId);
            content.classList.remove('expanded');
            content.classList.add('truncated');
            const lineHeight = parseInt(getComputedStyle(content).lineHeight) || this.LINE_HEIGHT;
            content.style.maxHeight = (lineHeight * this.MAX_LINES) + 'px';
            if (expandText) expandText.textContent = 'Show more';
            if (expandIcon) expandIcon.style.transform = 'rotate(0deg)';
        } else {
            // Expand
            this.expandedNotes.add(noteId);
            content.classList.remove('truncated');
            content.classList.add('expanded');
            content.style.maxHeight = 'none';
            if (expandText) expandText.textContent = 'Show less';
            if (expandIcon) expandIcon.style.transform = 'rotate(180deg)';
        }
    }

    /**
     * Handle vote (upvote/downvote)
     */
    async handleVote(noteId, voteType) {
        if (!this.currentUser) {
            this.showToast('Please sign in to vote', 'info');
            return;
        }

        const currentVote = this.userVotes.get(noteId);
        const card = this.container.querySelector(`.note-card[data-note-id="${noteId}"]`);
        if (!card) return;

        const upvoteBtn = card.querySelector('.vote-btn.upvote');
        const downvoteBtn = card.querySelector('.vote-btn.downvote');
        const upvoteCount = card.querySelector('.upvote-count');
        const downvoteCount = card.querySelector('.downvote-count');

        // Optimistic UI update
        let newVote = voteType;
        let upvoteDelta = 0;
        let downvoteDelta = 0;

        if (currentVote === voteType) {
            // Toggle off
            newVote = null;
            if (voteType === 'up') upvoteDelta = -1;
            else downvoteDelta = -1;
        } else {
            // New vote or change vote
            if (voteType === 'up') {
                upvoteDelta = 1;
                if (currentVote === 'down') downvoteDelta = -1;
            } else {
                downvoteDelta = 1;
                if (currentVote === 'up') upvoteDelta = -1;
            }
        }

        // Update UI immediately
        if (newVote === 'up') {
            upvoteBtn.classList.add('active');
            downvoteBtn.classList.remove('active');
        } else if (newVote === 'down') {
            downvoteBtn.classList.add('active');
            upvoteBtn.classList.remove('active');
        } else {
            upvoteBtn.classList.remove('active');
            downvoteBtn.classList.remove('active');
        }

        if (upvoteCount) {
            upvoteCount.textContent = parseInt(upvoteCount.textContent) + upvoteDelta;
        }
        if (downvoteCount) {
            downvoteCount.textContent = parseInt(downvoteCount.textContent) + downvoteDelta;
        }

        // Update local state
        if (newVote) {
            this.userVotes.set(noteId, newVote);
        } else {
            this.userVotes.delete(noteId);
        }
        this.saveUserVotes();

        // Update Firebase (async, don't wait)
        try {
            // This would integrate with a voting service
            // For now, we'll just update the note document
            if (this.notesService && this.notesService.db) {
                const noteRef = this.notesService.db
                    .collection('user_notes')
                    .doc(this.entityCollection)
                    .collection(this.entityId)
                    .doc(noteId);

                await noteRef.update({
                    upvotes: firebase.firestore.FieldValue.increment(upvoteDelta),
                    downvotes: firebase.firestore.FieldValue.increment(downvoteDelta)
                });
            }
        } catch (error) {
            console.error('Error updating vote:', error);
            // Revert on error - would need to refresh the UI
        }
    }

    /**
     * Handle reply
     */
    handleReply(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        const textarea = this.container.querySelector('#noteContentInput');
        if (textarea) {
            textarea.value = `@${note.userName} `;
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.handleTextareaInput();
        }
    }

    /**
     * Handle report
     */
    async handleReport(noteId) {
        if (!this.currentUser) {
            this.showToast('Please sign in to report', 'info');
            return;
        }

        const note = this.notes.find(n => n.id === noteId);
        if (!note) {
            this.showToast('Note not found', 'error');
            return;
        }

        // Show report confirmation
        if (confirm('Report this note for inappropriate content?\n\nReports are reviewed by moderators. False reports may result in account restrictions.')) {
            try {
                // Submit report to contentReports collection
                const db = this.notesService?.db || firebase.firestore();
                await db.collection('contentReports').add({
                    contentType: 'user_note',
                    contentId: noteId,
                    entityCollection: this.entityCollection,
                    entityId: this.entityId,
                    reportedBy: this.currentUser.uid,
                    reportedByEmail: this.currentUser.email,
                    reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending',
                    content: {
                        id: noteId,
                        authorId: note.userId,
                        authorName: note.userName || 'Anonymous',
                        contentPreview: (note.content || '').substring(0, 200)
                    }
                });

                this.showToast('Note reported. Thank you for helping keep our community safe.', 'success');
            } catch (error) {
                console.error('Error reporting note:', error);
                this.showToast('Failed to submit report. Please try again.', 'error');
            }
        }
    }

    /**
     * Handle edit
     */
    handleEdit(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.editingNoteId = noteId;

        const textarea = this.container.querySelector('#noteContentInput');
        const submitBtn = this.container.querySelector('#submitNoteBtn');
        const cancelBtn = this.container.querySelector('#cancelNoteBtn');

        if (textarea) {
            textarea.value = note.content;
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.handleTextareaInput();
        }

        if (submitBtn) {
            submitBtn.querySelector('.btn-text').textContent = 'Save Changes';
        }

        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
        }
    }

    /**
     * Handle delete
     */
    async handleDelete(noteId) {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            await this.notesService.deleteNote(this.entityCollection, this.entityId, noteId);
            this.showToast('Note deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showToast('Failed to delete note: ' + error.message, 'error');
        }
    }

    /**
     * Cancel edit mode
     */
    cancelEdit() {
        this.editingNoteId = null;

        const textarea = this.container.querySelector('#noteContentInput');
        const preview = this.container.querySelector('#notePreview');
        const submitBtn = this.container.querySelector('#submitNoteBtn');
        const cancelBtn = this.container.querySelector('#cancelNoteBtn');
        const previewBtn = this.container.querySelector('.preview-toggle');

        if (textarea) {
            textarea.value = '';
            textarea.style.height = 'auto';
            textarea.style.display = 'block';
        }

        // Hide preview if showing
        if (preview) {
            preview.style.display = 'none';
        }
        if (previewBtn) {
            previewBtn.classList.remove('active');
        }

        if (submitBtn) {
            submitBtn.querySelector('.btn-text').textContent = 'Share Note';
            submitBtn.disabled = true;
        }

        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }

        // Clear selected tags
        this.selectedTags.clear();
        const tagBtns = this.container.querySelectorAll('.tag-btn');
        tagBtns.forEach(btn => btn.classList.remove('selected'));

        // Reset progress bar
        const charProgressBar = this.container.querySelector('#charProgressBar');
        if (charProgressBar) {
            charProgressBar.style.width = '0%';
            charProgressBar.classList.remove('warning', 'error', 'valid');
        }

        this.handleTextareaInput();
    }

    /**
     * Save note (create or update)
     */
    async saveNote() {
        const textarea = this.container.querySelector('#noteContentInput');
        const submitBtn = this.container.querySelector('#submitNoteBtn');
        const errorDiv = this.container.querySelector('#noteError');

        if (!textarea || !submitBtn) return;

        const content = textarea.value.trim();

        // Validate
        if (content.length < this.MIN_CHARS) {
            this.showError(`Note must be at least ${this.MIN_CHARS} characters`);
            return;
        }

        // Show loading state
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-flex';

        // Clear previous errors
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        // Get selected tags
        const tags = Array.from(this.selectedTags);

        try {
            if (this.editingNoteId) {
                await this.notesService.updateNote(
                    this.entityCollection,
                    this.entityId,
                    this.editingNoteId,
                    content,
                    tags
                );
                this.showToast('Note updated successfully', 'success');
            } else {
                // Optimistic UI update
                const optimisticNote = this.createOptimisticNote(content, tags);
                this.addOptimisticNote(optimisticNote);

                await this.notesService.createNote(
                    this.entityCollection,
                    this.entityId,
                    content,
                    this.entityName,
                    tags
                );
                this.showToast('Note shared successfully', 'success');
            }

            // Reset form
            this.cancelEdit();

        } catch (error) {
            console.error('Error saving note:', error);
            this.showError(error.message || 'Failed to save note. Please try again.');
            // Remove optimistic note on failure
            this.removeOptimisticNote();

        } finally {
            submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    /**
     * Create an optimistic note for immediate display
     */
    createOptimisticNote(content, tags) {
        return {
            id: 'optimistic-' + Date.now(),
            content,
            tags,
            userId: this.currentUser?.uid,
            userName: this.currentUser?.displayName || 'You',
            userAvatar: this.currentUser?.photoURL,
            createdAt: new Date(),
            updatedAt: new Date(),
            upvotes: 0,
            downvotes: 0,
            isOptimistic: true
        };
    }

    /**
     * Add optimistic note to the list
     */
    addOptimisticNote(note) {
        const notesList = this.container.querySelector('#notesList');
        if (!notesList) return;

        const noteHtml = this.createNoteCard(note);
        notesList.insertAdjacentHTML('afterbegin', `<div class="note-card-wrapper optimistic">${noteHtml}</div>`);
    }

    /**
     * Remove optimistic note from the list
     */
    removeOptimisticNote() {
        const optimistic = this.container.querySelector('.note-card-wrapper.optimistic');
        if (optimistic) {
            optimistic.remove();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = this.container.querySelector('#noteError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Use global toast if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Fallback: Create simple toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
            if (p.includes('<li>')) {
                const isOrdered = /^\d+\./.test(content);
                const tag = isOrdered ? 'ol' : 'ul';
                return `<${tag}>${p}</${tag}>`;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // Sanitize HTML
        html = this.sanitizeHtml(html);

        return html;
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHtml(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove dangerous elements
        const dangerous = tempDiv.querySelectorAll('script, iframe, object, embed, form');
        dangerous.forEach(el => el.remove());

        // Remove event handlers and dangerous attributes
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on') ||
                    (attr.name === 'href' && attr.value.toLowerCase().startsWith('javascript:'))) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return tempDiv.innerHTML;
    }

    /**
     * Escape HTML entities
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
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 4) return `${weeks}w ago`;
        if (months < 12) return `${months}mo ago`;

        return date.toLocaleDateString();
    }

    /**
     * Get default avatar URL
     */
    getDefaultAvatar(userName) {
        const name = encodeURIComponent(userName || 'User');
        return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&size=80`;
    }

    /**
     * Update note count in tab badge
     */
    updateNoteCount(count) {
        const countBadge = document.querySelector('.notes-tab-count');
        if (countBadge) {
            countBadge.textContent = count;
        }

        // Also update in community section header if exists
        const headerCount = document.querySelector('#notesCount');
        if (headerCount) {
            headerCount.textContent = count;
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.notesListener) {
            this.notesListener();
            this.notesListener = null;
        }
        if (this.notesService) {
            this.notesService.stopListening(this.entityCollection, this.entityId);
        }
        this.expandedNotes.clear();
        this.notes = [];
    }
}

// Create global instance helper
window.UserNotesComponent = UserNotesComponent;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    // Check for community notes panel
    const container = document.getElementById('communityNotesPanel');
    if (container) {
        const entityCollection = container.dataset.entityCollection;
        const entityId = container.dataset.entityId;

        if (entityCollection && entityId) {
            window.userNotesComponent = new UserNotesComponent('communityNotesPanel');
            window.userNotesComponent.init(entityCollection, entityId);
        }
    }
});
