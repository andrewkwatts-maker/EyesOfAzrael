/**
 * Private Notes Panel
 *
 * Collapsible section on entity pages showing the user's private annotations.
 * Only visible when authenticated. Notes are private to each user.
 *
 * Features: Add/edit/delete notes, priority stars, section targeting,
 * color-coded borders, sorting, filtering, manual reordering.
 *
 * Usage:
 *   const panel = new PrivateNotesPanel(container, entity);
 *   await panel.init();
 */

class PrivateNotesPanel {
    constructor(container, entity) {
        this.container = container;
        this.entity = entity;
        this.collection = this._getCollectionName(entity.type);
        this.notes = [];
        this.sortBy = 'order';
        this.sectionFilter = null;
        this.isCollapsed = true;
        this.editingNoteId = null;
    }

    async init() {
        if (!window.privateNotesService) {
            console.warn('[PrivateNotes] PrivateNotesService not available');
            this.container.innerHTML = '';
            return;
        }

        // Only show for authenticated users
        const user = firebase.auth?.()?.currentUser;
        if (!user) {
            this.container.innerHTML = '';
            // Reactively show when user signs in
            const authInstance = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
            if (authInstance?.onAuthStateChanged) {
                this._authUnsubscribe = authInstance.onAuthStateChanged(async (u) => {
                    if (u) {
                        try {
                            await window.privateNotesService.init();
                            this.render();
                            await this.loadNotes();
                        } catch (err) {
                            console.error('[PrivateNotes] Init after auth failed:', err);
                        }
                        if (this._authUnsubscribe) {
                            this._authUnsubscribe();
                            this._authUnsubscribe = null;
                        }
                    }
                });
            }
            return;
        }

        try {
            await window.privateNotesService.init();
        } catch (err) {
            console.error('[PrivateNotes] PrivateNotesService init failed:', err);
            this.container.innerHTML = '';
            return;
        }

        this.render();
        await this.loadNotes();
    }

    /**
     * Render the notes panel shell
     */
    render() {
        this.container.innerHTML = `
            <div class="private-notes-section">
                <div class="private-notes-header" id="privateNotesToggle">
                    <div class="private-notes-title-row">
                        <svg class="private-notes-lock" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <h2 class="private-notes-title">My Notes</h2>
                        <span class="private-notes-count" id="privateNotesCount">0</span>
                        <span class="private-notes-badge">Only visible to you</span>
                    </div>
                    <span class="private-notes-toggle-icon" id="privateNotesToggleIcon">&#9654;</span>
                </div>

                <div class="private-notes-body" id="privateNotesBody" style="display:none;">
                    <div class="private-notes-controls">
                        <div class="private-notes-sort">
                            <select id="privateNotesSort" class="private-notes-select">
                                <option value="order">Manual Order</option>
                                <option value="date">Newest First</option>
                                <option value="priority">Highest Priority</option>
                                <option value="section">By Section</option>
                            </select>
                        </div>
                        <div class="private-notes-filter">
                            <select id="privateNotesFilter" class="private-notes-select">
                                <option value="">All Sections</option>
                            </select>
                        </div>
                        <button class="private-notes-add-btn" id="privateNotesAddBtn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Add Note
                        </button>
                    </div>

                    <div class="private-notes-form" id="privateNotesForm" style="display:none;">
                        <textarea id="privateNoteContent" class="private-notes-textarea" placeholder="Write your private note..." rows="4" maxlength="5000"></textarea>
                        <div class="private-notes-form-row">
                            <div class="private-notes-form-group">
                                <label>Priority</label>
                                <div class="private-notes-priority" id="privateNotePriority">
                                    ${[1,2,3,4,5].map(i => `<button class="priority-star ${i <= 3 ? 'active' : ''}" data-value="${i}" title="Priority ${i}">&#9733;</button>`).join('')}
                                </div>
                            </div>
                            <div class="private-notes-form-group">
                                <label>Section</label>
                                <select id="privateNoteSection" class="private-notes-select">
                                    <option value="">Entity-wide</option>
                                </select>
                            </div>
                            <div class="private-notes-form-group">
                                <label>Color</label>
                                <div class="private-notes-colors" id="privateNoteColor">
                                    ${['#8b7fff', '#ff7eb6', '#51cf66', '#ffd93d', '#4a9eff', '#ff6b6b'].map(c =>
                                        `<button class="color-swatch ${c === '#8b7fff' ? 'active' : ''}" data-color="${c}" style="background:${c};" title="${c}"></button>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="private-notes-form-actions">
                            <button class="private-notes-save-btn" id="privateNoteSave">Save Note</button>
                            <button class="private-notes-cancel-btn" id="privateNoteCancel">Cancel</button>
                        </div>
                    </div>

                    <div class="private-notes-list" id="privateNotesList">
                        <div class="private-notes-loading" id="privateNotesLoading">Loading notes...</div>
                    </div>
                </div>
            </div>
        `;

        this._populateSectionOptions();
        this._bindEvents();
    }

    _populateSectionOptions() {
        const sections = this._getEntitySections();
        const filterSelect = document.getElementById('privateNotesFilter');
        const noteSection = document.getElementById('privateNoteSection');

        sections.forEach(s => {
            [filterSelect, noteSection].forEach(select => {
                if (!select) return;
                const opt = document.createElement('option');
                opt.value = s.ref;
                opt.textContent = s.title;
                select.appendChild(opt);
            });
        });
    }

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
        if (e.symbolism) sections.push({ ref: 'symbolism', title: 'Symbolism' });
        return sections;
    }

    _bindEvents() {
        // Toggle collapse
        document.getElementById('privateNotesToggle')?.addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            const body = document.getElementById('privateNotesBody');
            const icon = document.getElementById('privateNotesToggleIcon');
            if (body) body.style.display = this.isCollapsed ? 'none' : '';
            if (icon) icon.innerHTML = this.isCollapsed ? '&#9654;' : '&#9660;';
        });

        // Sort change
        document.getElementById('privateNotesSort')?.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.loadNotes();
        });

        // Filter change
        document.getElementById('privateNotesFilter')?.addEventListener('change', (e) => {
            this.sectionFilter = e.target.value || null;
            this.loadNotes();
        });

        // Add button
        document.getElementById('privateNotesAddBtn')?.addEventListener('click', () => {
            this.editingNoteId = null;
            this._showForm();
        });

        // Priority stars
        document.getElementById('privateNotePriority')?.addEventListener('click', (e) => {
            const star = e.target.closest('.priority-star');
            if (!star) return;
            const value = parseInt(star.dataset.value);
            document.querySelectorAll('#privateNotePriority .priority-star').forEach((s, i) => {
                s.classList.toggle('active', i < value);
            });
        });

        // Color swatches
        document.getElementById('privateNoteColor')?.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (!swatch) return;
            document.querySelectorAll('#privateNoteColor .color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });

        // Save
        document.getElementById('privateNoteSave')?.addEventListener('click', () => this._saveNote());

        // Cancel
        document.getElementById('privateNoteCancel')?.addEventListener('click', () => this._hideForm());

        // Delegation for note actions
        document.getElementById('privateNotesList')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-note-action]');
            if (!btn) return;

            const action = btn.dataset.noteAction;
            const noteId = btn.dataset.noteId;

            switch (action) {
                case 'edit': this._editNote(noteId); break;
                case 'delete': this._deleteNote(noteId); break;
                case 'up': this._reorderNote(noteId, 'up'); break;
                case 'down': this._reorderNote(noteId, 'down'); break;
            }
        });
    }

    async loadNotes() {
        try {
            this.notes = await window.privateNotesService.getNotes(
                this.collection, this.entity.id,
                { sortBy: this.sortBy, sectionFilter: this.sectionFilter }
            );

            const countEl = document.getElementById('privateNotesCount');
            if (countEl) countEl.textContent = this.notes.length;

            this._renderNotes();
        } catch (error) {
            console.error('[PrivateNotes] Error loading:', error);
            const listEl = document.getElementById('privateNotesList');
            if (listEl) listEl.innerHTML = `<div class="private-notes-error">Error: ${error.message}</div>`;
        }
    }

    _renderNotes() {
        const listEl = document.getElementById('privateNotesList');
        if (!listEl) return;

        if (this.notes.length === 0) {
            listEl.innerHTML = `
                <div class="private-notes-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" style="margin-bottom: 0.5rem;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <p style="font-weight: 500; margin-bottom: 0.25rem;">No notes yet</p>
                    <p style="opacity: 0.7; font-size: 0.85rem;">Add private annotations, reminders, or insights about <strong>${this._escapeHtml(this.entity.name || 'this entity')}</strong>. Only you can see these.</p>
                    <button class="private-notes-add-btn private-notes-empty-cta" id="privateNotesEmptyAdd" style="margin-top: 0.75rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Add Your First Note
                    </button>
                </div>
            `;
            // Bind the empty-state add button
            document.getElementById('privateNotesEmptyAdd')?.addEventListener('click', () => {
                this.editingNoteId = null;
                this._showForm();
            });
            return;
        }

        listEl.innerHTML = this.notes.map((note, index) => this._renderNoteCard(note, index)).join('');
    }

    _renderNoteCard(note, index) {
        const timestamp = window.privateNotesService?.formatTimestamp(note.createdAt) || '';
        const priorityStars = '&#9733;'.repeat(note.priority || 3) + '<span class="star-empty">' + '&#9733;'.repeat(5 - (note.priority || 3)) + '</span>';

        return `
            <div class="private-note-card" style="--note-color: ${note.color || '#8b7fff'}">
                <div class="private-note-card-header">
                    <div class="private-note-meta">
                        <span class="private-note-priority">${priorityStars}</span>
                        ${note.sectionTitle ? `<span class="private-note-section-badge">${this._escapeHtml(note.sectionTitle)}</span>` : ''}
                        <span class="private-note-timestamp">${timestamp}</span>
                    </div>
                    <div class="private-note-actions">
                        ${this.sortBy === 'order' ? `
                            <button class="private-note-action-btn" data-note-action="up" data-note-id="${note.id}" title="Move up" ${index === 0 ? 'disabled' : ''}>&#9650;</button>
                            <button class="private-note-action-btn" data-note-action="down" data-note-id="${note.id}" title="Move down" ${index === this.notes.length - 1 ? 'disabled' : ''}>&#9660;</button>
                        ` : ''}
                        <button class="private-note-action-btn" data-note-action="edit" data-note-id="${note.id}" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button class="private-note-action-btn private-note-delete" data-note-action="delete" data-note-id="${note.id}" title="Delete">&#10005;</button>
                    </div>
                </div>
                <div class="private-note-content">${this._formatContent(note.content)}</div>
                ${note.tags?.length ? `
                    <div class="private-note-tags">
                        ${note.tags.map(t => `<span class="private-note-tag">${this._escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _showForm(note = null) {
        const form = document.getElementById('privateNotesForm');
        if (!form) return;

        form.style.display = '';

        const contentEl = document.getElementById('privateNoteContent');
        const sectionEl = document.getElementById('privateNoteSection');

        if (note) {
            // Edit mode
            if (contentEl) contentEl.value = note.content || '';
            if (sectionEl) sectionEl.value = note.sectionRef || '';

            // Set priority
            const priorityValue = note.priority || 3;
            document.querySelectorAll('#privateNotePriority .priority-star').forEach((s, i) => {
                s.classList.toggle('active', i < priorityValue);
            });

            // Set color
            document.querySelectorAll('#privateNoteColor .color-swatch').forEach(s => {
                s.classList.toggle('active', s.dataset.color === (note.color || '#8b7fff'));
            });

            document.getElementById('privateNoteSave').textContent = 'Update Note';
        } else {
            // New note
            if (contentEl) contentEl.value = '';
            if (sectionEl) sectionEl.value = '';
            document.querySelectorAll('#privateNotePriority .priority-star').forEach((s, i) => {
                s.classList.toggle('active', i < 3);
            });
            document.querySelectorAll('#privateNoteColor .color-swatch').forEach((s, i) => {
                s.classList.toggle('active', i === 0);
            });
            document.getElementById('privateNoteSave').textContent = 'Save Note';
        }

        contentEl?.focus();
    }

    _hideForm() {
        const form = document.getElementById('privateNotesForm');
        if (form) form.style.display = 'none';
        this.editingNoteId = null;
    }

    async _saveNote() {
        const content = document.getElementById('privateNoteContent')?.value?.trim();
        if (!content) return;

        const sectionRef = document.getElementById('privateNoteSection')?.value || null;
        const sectionTitle = sectionRef ?
            document.getElementById('privateNoteSection').options[document.getElementById('privateNoteSection').selectedIndex].text : null;

        const activeStars = document.querySelectorAll('#privateNotePriority .priority-star.active');
        const priority = activeStars.length || 3;

        const activeColor = document.querySelector('#privateNoteColor .color-swatch.active');
        const color = activeColor?.dataset?.color || '#8b7fff';

        const saveBtn = document.getElementById('privateNoteSave');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

        try {
            if (this.editingNoteId) {
                await window.privateNotesService.updateNote(this.editingNoteId, {
                    content, sectionRef, sectionTitle, priority, color
                });
            } else {
                await window.privateNotesService.createNote({
                    entityCollection: this.collection,
                    entityId: this.entity.id,
                    entityName: this.entity.name || this.entity.title,
                    content, sectionRef, sectionTitle, priority, color
                });
            }

            this._hideForm();
            await this.loadNotes();

        } catch (error) {
            console.error('[PrivateNotes] Save error:', error);
            alert('Error saving note: ' + error.message);
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Note'; }
        }
    }

    async _editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        this.editingNoteId = noteId;
        this._showForm(note);
    }

    async _deleteNote(noteId) {
        if (!confirm('Delete this note?')) return;
        try {
            await window.privateNotesService.deleteNote(noteId);
            await this.loadNotes();
        } catch (error) {
            console.error('[PrivateNotes] Delete error:', error);
            alert('Error deleting note: ' + error.message);
        }
    }

    async _reorderNote(noteId, direction) {
        try {
            await window.privateNotesService.reorderNote(noteId, direction);
            await this.loadNotes();
        } catch (error) {
            console.error('[PrivateNotes] Reorder error:', error);
        }
    }

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
}

// Global export
if (typeof window !== 'undefined') {
    window.PrivateNotesPanel = PrivateNotesPanel;
}
