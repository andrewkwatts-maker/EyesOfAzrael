/**
 * Admin Inline Edit Panel
 *
 * Right-side panel for editing entity fields inline.
 * Modeled on DebugDataPanel — fixed position, glass-morphism,
 * activated by clicking pencil icons next to editable fields.
 *
 * Only visible to admins (andrewkwatts@gmail.com).
 */

class AdminInlineEditPanel {
    constructor() {
        this.isActive = false;
        this.panelEl = null;
        this.db = null;
        this.currentField = null; // { collection, entityId, fieldName, fieldType, currentValue, entity }
        this.hasUnsavedChanges = false;
    }

    /**
     * Initialize the panel
     */
    init() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            this.db = firebase.firestore();
        }

        this._createPanel();
        this._bindEvents();

        console.log('[AdminInlineEditPanel] Initialized');
    }

    /**
     * Create the panel DOM
     */
    _createPanel() {
        const panel = document.createElement('div');
        panel.className = 'admin-edit-panel';
        panel.id = 'adminEditPanel';
        panel.innerHTML = `
            <div class="admin-edit-panel-header">
                <h3>Edit Field</h3>
                <button class="admin-edit-panel-close" id="adminEditPanelClose" title="Close (Esc)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="admin-edit-panel-meta" id="adminEditMeta">
                <div class="admin-edit-field-label" id="adminEditFieldLabel">—</div>
                <div class="admin-edit-entity-info" id="adminEditEntityInfo">—</div>
            </div>
            <div class="admin-edit-panel-body" id="adminEditBody">
                <div class="admin-edit-empty">Click a pencil icon to edit a field</div>
            </div>
            <div class="admin-edit-panel-footer" id="adminEditFooter" style="display:none;">
                <div class="admin-edit-footer-status" id="adminEditStatus"></div>
                <div class="admin-edit-footer-actions">
                    <button class="admin-edit-btn-cancel" id="adminEditCancel">Cancel</button>
                    <button class="admin-edit-btn-save" id="adminEditSave">Save Changes</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        this.panelEl = panel;
    }

    /**
     * Bind events
     */
    _bindEvents() {
        // Close button
        document.getElementById('adminEditPanelClose').addEventListener('click', () => this.close());

        // Cancel button
        document.getElementById('adminEditCancel').addEventListener('click', () => this.close());

        // Save button
        document.getElementById('adminEditSave').addEventListener('click', () => this._save());

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                if (this.hasUnsavedChanges) {
                    if (confirm('Discard unsaved changes?')) {
                        this.close();
                    }
                } else {
                    this.close();
                }
            }
        });

        // Ctrl+S to save
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.isActive && this.hasUnsavedChanges) {
                e.preventDefault();
                this._save();
            }
        });

        // Listen for admin edit icon clicks (event delegation)
        document.addEventListener('click', (e) => {
            const editIcon = e.target.closest('.admin-field-edit-icon');
            if (editIcon) {
                e.preventDefault();
                e.stopPropagation();
                this._handleEditClick(editIcon);
            }
        });
    }

    /**
     * Handle edit icon click
     */
    _handleEditClick(iconEl) {
        const fieldName = iconEl.dataset.fieldName;
        const collection = iconEl.dataset.collection;
        const entityId = iconEl.dataset.entityId;
        const fieldType = iconEl.dataset.fieldType || 'string';
        const entityName = iconEl.dataset.entityName || entityId;

        if (!fieldName || !collection || !entityId) {
            console.error('[AdminInlineEditPanel] Missing data attributes on edit icon');
            return;
        }

        // Check for unsaved changes before switching fields
        if (this.hasUnsavedChanges && this.currentField) {
            if (!confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }

        this.open(collection, entityId, fieldName, fieldType, entityName);
    }

    /**
     * Open the panel and load field data
     */
    async open(collection, entityId, fieldName, fieldType, entityName) {
        this.isActive = true;
        this.hasUnsavedChanges = false;
        document.body.classList.add('admin-edit-active');

        // Update meta
        document.getElementById('adminEditFieldLabel').textContent = this._formatFieldName(fieldName);
        document.getElementById('adminEditEntityInfo').textContent = `${entityName} (${collection}/${entityId})`;

        // Show loading
        const body = document.getElementById('adminEditBody');
        body.innerHTML = '<div class="admin-edit-loading">Loading field data...</div>';
        document.getElementById('adminEditFooter').style.display = 'none';

        try {
            // Fetch current value from Firestore
            const doc = await this.db.collection(collection).doc(entityId).get();
            if (!doc.exists) {
                body.innerHTML = '<div class="admin-edit-error">Entity not found in Firestore</div>';
                return;
            }

            const entity = { id: doc.id, ...doc.data() };
            const currentValue = this._getNestedValue(entity, fieldName);

            this.currentField = {
                collection,
                entityId,
                fieldName,
                fieldType,
                currentValue,
                entity
            };

            // Render appropriate editor
            this._renderEditor(fieldName, fieldType, currentValue);
            document.getElementById('adminEditFooter').style.display = '';

        } catch (error) {
            console.error('[AdminInlineEditPanel] Error loading field:', error);
            body.innerHTML = `<div class="admin-edit-error">Error: ${error.message}</div>`;
        }
    }

    /**
     * Close the panel
     */
    close() {
        this.isActive = false;
        this.hasUnsavedChanges = false;
        this.currentField = null;
        document.body.classList.remove('admin-edit-active');
        document.getElementById('adminEditBody').innerHTML =
            '<div class="admin-edit-empty">Click a pencil icon to edit a field</div>';
        document.getElementById('adminEditFooter').style.display = 'none';
        document.getElementById('adminEditStatus').textContent = '';
    }

    /**
     * Render the editor based on field type
     */
    _renderEditor(fieldName, fieldType, currentValue) {
        const body = document.getElementById('adminEditBody');

        switch (fieldType) {
            case 'array':
                this._renderArrayEditor(body, fieldName, currentValue || []);
                break;
            case 'keyMyths':
                this._renderKeyMythsEditor(body, currentValue || []);
                break;
            case 'extendedContent':
                this._renderExtendedContentEditor(body, currentValue || []);
                break;
            case 'sources':
                this._renderSourcesEditor(body, currentValue || []);
                break;
            case 'icon':
                this._renderIconEditor(body, currentValue || '');
                break;
            default:
                this._renderTextEditor(body, fieldName, currentValue || '');
                break;
        }
    }

    /**
     * Render text/textarea editor for string fields
     */
    _renderTextEditor(body, fieldName, currentValue) {
        const isLong = typeof currentValue === 'string' && currentValue.length > 100;
        const rows = isLong ? Math.min(20, Math.ceil(currentValue.length / 80)) : 6;

        body.innerHTML = `
            <div class="admin-edit-text-editor">
                <label class="admin-edit-label" for="adminEditTextarea">Value</label>
                <textarea id="adminEditTextarea"
                          class="admin-edit-textarea"
                          rows="${rows}"
                          placeholder="Enter value...">${this._escapeHtml(String(currentValue || ''))}</textarea>
                <div class="admin-edit-char-count">
                    <span id="adminEditCharCount">${String(currentValue || '').length}</span> characters
                </div>
            </div>
        `;

        const textarea = document.getElementById('adminEditTextarea');
        textarea.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
            document.getElementById('adminEditCharCount').textContent = textarea.value.length;
            this._autoResize(textarea);
        });
        this._autoResize(textarea);
    }

    /**
     * Render array editor (simple string arrays like domains, symbols, tags)
     */
    _renderArrayEditor(body, fieldName, currentValue) {
        const items = Array.isArray(currentValue) ? currentValue : [];

        body.innerHTML = `
            <div class="admin-edit-array-editor">
                <div class="admin-edit-array-list" id="adminEditArrayList">
                    ${items.map((item, i) => this._renderArrayItem(item, i)).join('')}
                </div>
                <div class="admin-edit-array-add">
                    <input type="text" id="adminEditArrayInput" class="admin-edit-input" placeholder="Add new item..." />
                    <button class="admin-edit-btn-add" id="adminEditArrayAdd">Add</button>
                </div>
            </div>
        `;

        // Add item button
        document.getElementById('adminEditArrayAdd').addEventListener('click', () => this._addArrayItem());

        // Enter key to add
        document.getElementById('adminEditArrayInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._addArrayItem();
            }
        });

        // Delete + reorder buttons via delegation
        document.getElementById('adminEditArrayList').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const index = parseInt(btn.dataset.index);
            if (btn.classList.contains('admin-edit-array-delete')) {
                this._removeArrayItem(index);
            } else if (btn.classList.contains('admin-edit-array-up') && index > 0) {
                this._moveArrayItem(index, index - 1);
            } else if (btn.classList.contains('admin-edit-array-down')) {
                this._moveArrayItem(index, index + 1);
            }
        });
    }

    _renderArrayItem(item, index) {
        return `
            <div class="admin-edit-array-item" data-index="${index}">
                <span class="admin-edit-array-item-text">${this._escapeHtml(String(item))}</span>
                <div class="admin-edit-array-item-actions">
                    <button class="admin-edit-array-up" data-index="${index}" title="Move up">&#9650;</button>
                    <button class="admin-edit-array-down" data-index="${index}" title="Move down">&#9660;</button>
                    <button class="admin-edit-array-delete" data-index="${index}" title="Remove">&#10005;</button>
                </div>
            </div>
        `;
    }

    _addArrayItem() {
        const input = document.getElementById('adminEditArrayInput');
        const value = input.value.trim();
        if (!value) return;

        const items = this._getArrayItems();
        items.push(value);
        this._updateArrayList(items);
        input.value = '';
        input.focus();
        this.hasUnsavedChanges = true;
    }

    _removeArrayItem(index) {
        const items = this._getArrayItems();
        items.splice(index, 1);
        this._updateArrayList(items);
        this.hasUnsavedChanges = true;
    }

    _moveArrayItem(fromIndex, toIndex) {
        const items = this._getArrayItems();
        if (toIndex < 0 || toIndex >= items.length) return;
        const [item] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, item);
        this._updateArrayList(items);
        this.hasUnsavedChanges = true;
    }

    _getArrayItems() {
        const list = document.getElementById('adminEditArrayList');
        if (!list) return [];
        return Array.from(list.querySelectorAll('.admin-edit-array-item-text'))
            .map(el => el.textContent);
    }

    _updateArrayList(items) {
        const list = document.getElementById('adminEditArrayList');
        if (list) {
            list.innerHTML = items.map((item, i) => this._renderArrayItem(item, i)).join('');
        }
    }

    /**
     * Render keyMyths editor (array of objects with title, description, source)
     */
    _renderKeyMythsEditor(body, myths) {
        body.innerHTML = `
            <div class="admin-edit-keymyths-editor">
                <div class="admin-edit-keymyths-list" id="adminEditKeyMythsList">
                    ${myths.map((myth, i) => this._renderKeyMythItem(myth, i)).join('')}
                </div>
                <button class="admin-edit-btn-add-myth" id="adminEditAddMyth">+ Add Key Myth</button>
            </div>
        `;

        document.getElementById('adminEditAddMyth').addEventListener('click', () => {
            const myths = this._getKeyMythsData();
            myths.push({ title: '', description: '', source: '' });
            this._updateKeyMythsList(myths);
            this.hasUnsavedChanges = true;
        });

        this._bindKeyMythsEvents();
    }

    _renderKeyMythItem(myth, index) {
        return `
            <div class="admin-edit-myth-item" data-index="${index}">
                <div class="admin-edit-myth-header">
                    <span class="admin-edit-myth-number">#${index + 1}</span>
                    <button class="admin-edit-myth-delete" data-index="${index}" title="Remove myth">&#10005;</button>
                </div>
                <div class="admin-edit-myth-fields">
                    <label>Title</label>
                    <input type="text" class="admin-edit-input myth-title" value="${this._escapeAttr(myth.title || '')}" data-index="${index}" />
                    <label>Description</label>
                    <textarea class="admin-edit-textarea myth-description" rows="3" data-index="${index}">${this._escapeHtml(myth.description || '')}</textarea>
                    <label>Source</label>
                    <input type="text" class="admin-edit-input myth-source" value="${this._escapeAttr(myth.source || '')}" data-index="${index}" />
                </div>
            </div>
        `;
    }

    _bindKeyMythsEvents() {
        const list = document.getElementById('adminEditKeyMythsList');
        if (!list) return;

        list.addEventListener('click', (e) => {
            const btn = e.target.closest('.admin-edit-myth-delete');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                const myths = this._getKeyMythsData();
                myths.splice(index, 1);
                this._updateKeyMythsList(myths);
                this.hasUnsavedChanges = true;
            }
        });

        list.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
        });
    }

    _getKeyMythsData() {
        const items = document.querySelectorAll('#adminEditKeyMythsList .admin-edit-myth-item');
        return Array.from(items).map(item => ({
            title: item.querySelector('.myth-title')?.value || '',
            description: item.querySelector('.myth-description')?.value || '',
            source: item.querySelector('.myth-source')?.value || ''
        }));
    }

    _updateKeyMythsList(myths) {
        const list = document.getElementById('adminEditKeyMythsList');
        if (list) {
            list.innerHTML = myths.map((m, i) => this._renderKeyMythItem(m, i)).join('');
            this._bindKeyMythsEvents();
        }
    }

    /**
     * Render extendedContent editor (array of objects with title and content)
     */
    _renderExtendedContentEditor(body, sections) {
        body.innerHTML = `
            <div class="admin-edit-extended-editor">
                <div class="admin-edit-extended-list" id="adminEditExtendedList">
                    ${sections.map((sec, i) => this._renderExtendedItem(sec, i)).join('')}
                </div>
                <button class="admin-edit-btn-add-myth" id="adminEditAddSection">+ Add Section</button>
            </div>
        `;

        document.getElementById('adminEditAddSection').addEventListener('click', () => {
            const secs = this._getExtendedContentData();
            secs.push({ title: '', content: '' });
            this._updateExtendedList(secs);
            this.hasUnsavedChanges = true;
        });

        this._bindExtendedEvents();
    }

    _renderExtendedItem(section, index) {
        return `
            <div class="admin-edit-extended-item" data-index="${index}">
                <div class="admin-edit-myth-header">
                    <span class="admin-edit-myth-number">#${index + 1}</span>
                    <button class="admin-edit-myth-delete" data-index="${index}" title="Remove section">&#10005;</button>
                </div>
                <div class="admin-edit-myth-fields">
                    <label>Title</label>
                    <input type="text" class="admin-edit-input ext-title" value="${this._escapeAttr(section.title || '')}" data-index="${index}" />
                    <label>Content</label>
                    <textarea class="admin-edit-textarea ext-content" rows="5" data-index="${index}">${this._escapeHtml(section.content || '')}</textarea>
                </div>
            </div>
        `;
    }

    _bindExtendedEvents() {
        const list = document.getElementById('adminEditExtendedList');
        if (!list) return;

        list.addEventListener('click', (e) => {
            const btn = e.target.closest('.admin-edit-myth-delete');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                const secs = this._getExtendedContentData();
                secs.splice(index, 1);
                this._updateExtendedList(secs);
                this.hasUnsavedChanges = true;
            }
        });

        list.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
        });
    }

    _getExtendedContentData() {
        const items = document.querySelectorAll('#adminEditExtendedList .admin-edit-extended-item');
        return Array.from(items).map(item => ({
            title: item.querySelector('.ext-title')?.value || '',
            content: item.querySelector('.ext-content')?.value || ''
        }));
    }

    _updateExtendedList(sections) {
        const list = document.getElementById('adminEditExtendedList');
        if (list) {
            list.innerHTML = sections.map((s, i) => this._renderExtendedItem(s, i)).join('');
            this._bindExtendedEvents();
        }
    }

    /**
     * Render sources editor
     */
    _renderSourcesEditor(body, sources) {
        body.innerHTML = `
            <div class="admin-edit-sources-editor">
                <div class="admin-edit-sources-list" id="adminEditSourcesList">
                    ${sources.map((src, i) => this._renderSourceItem(src, i)).join('')}
                </div>
                <button class="admin-edit-btn-add-myth" id="adminEditAddSource">+ Add Source</button>
            </div>
        `;

        document.getElementById('adminEditAddSource').addEventListener('click', () => {
            const srcs = this._getSourcesData();
            srcs.push({ source: '', text: '', reference: '' });
            this._updateSourcesList(srcs);
            this.hasUnsavedChanges = true;
        });

        this._bindSourcesEvents();
    }

    _renderSourceItem(source, index) {
        return `
            <div class="admin-edit-source-item" data-index="${index}">
                <div class="admin-edit-myth-header">
                    <span class="admin-edit-myth-number">#${index + 1}</span>
                    <button class="admin-edit-myth-delete" data-index="${index}" title="Remove source">&#10005;</button>
                </div>
                <div class="admin-edit-myth-fields">
                    <label>Source</label>
                    <input type="text" class="admin-edit-input src-source" value="${this._escapeAttr(source.source || '')}" data-index="${index}" />
                    <label>Text / Content</label>
                    <textarea class="admin-edit-textarea src-text" rows="3" data-index="${index}">${this._escapeHtml(source.text || source.content || source.verse || '')}</textarea>
                    <label>Reference</label>
                    <input type="text" class="admin-edit-input src-reference" value="${this._escapeAttr(source.reference || '')}" data-index="${index}" />
                </div>
            </div>
        `;
    }

    _bindSourcesEvents() {
        const list = document.getElementById('adminEditSourcesList');
        if (!list) return;

        list.addEventListener('click', (e) => {
            const btn = e.target.closest('.admin-edit-myth-delete');
            if (btn) {
                const index = parseInt(btn.dataset.index);
                const srcs = this._getSourcesData();
                srcs.splice(index, 1);
                this._updateSourcesList(srcs);
                this.hasUnsavedChanges = true;
            }
        });

        list.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
        });
    }

    _getSourcesData() {
        const items = document.querySelectorAll('#adminEditSourcesList .admin-edit-source-item');
        return Array.from(items).map(item => ({
            source: item.querySelector('.src-source')?.value || '',
            text: item.querySelector('.src-text')?.value || '',
            reference: item.querySelector('.src-reference')?.value || ''
        }));
    }

    _updateSourcesList(sources) {
        const list = document.getElementById('adminEditSourcesList');
        if (list) {
            list.innerHTML = sources.map((s, i) => this._renderSourceItem(s, i)).join('');
            this._bindSourcesEvents();
        }
    }

    /**
     * Render icon editor with SVG preview and AI generation
     */
    _renderIconEditor(body, currentValue) {
        const previewSvg = currentValue && currentValue.trim().startsWith('<svg')
            ? currentValue
            : '<svg viewBox="0 0 100 100" width="80" height="80"><circle cx="50" cy="50" r="40" fill="none" stroke="#666" stroke-width="2" stroke-dasharray="8 4"/><text x="50" y="55" text-anchor="middle" fill="#666" font-size="14">No icon</text></svg>';

        body.innerHTML = `
            <div class="admin-edit-icon-editor">
                <div class="admin-edit-icon-preview" id="adminEditIconPreview">
                    ${previewSvg}
                </div>
                <div class="admin-edit-icon-actions">
                    <button type="button" class="admin-edit-icon-btn" id="adminEditIconGenerate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        AI Generate
                    </button>
                    <button type="button" class="admin-edit-icon-btn" id="adminEditIconEdit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        Edit SVG
                    </button>
                </div>
                <textarea id="adminEditTextarea"
                          class="admin-edit-textarea admin-edit-icon-textarea"
                          rows="6"
                          placeholder="Paste SVG code here...">${this._escapeHtml(String(currentValue || ''))}</textarea>
            </div>
        `;

        const textarea = document.getElementById('adminEditTextarea');
        const preview = document.getElementById('adminEditIconPreview');

        // Update preview on textarea change
        textarea.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
            const val = textarea.value.trim();
            if (val.startsWith('<svg')) {
                preview.innerHTML = val;
            }
        });

        // AI Generate button
        document.getElementById('adminEditIconGenerate').addEventListener('click', () => {
            if (window.AIIconGenerator && this.currentField?.entity) {
                const generator = new AIIconGenerator();
                const svg = generator.generateIcon(this.currentField.entity);
                if (svg) {
                    textarea.value = svg;
                    preview.innerHTML = svg;
                    this.hasUnsavedChanges = true;
                }
            } else if (window.SVGEditorModal) {
                window.SVGEditorModal.open({
                    initialSvg: textarea.value,
                    entityData: this.currentField?.entity,
                    onSave: (data) => {
                        textarea.value = data.svgCode || data;
                        preview.innerHTML = data.svgCode || data;
                        this.hasUnsavedChanges = true;
                    }
                });
            }
        });

        // Edit SVG button - open full editor
        document.getElementById('adminEditIconEdit').addEventListener('click', () => {
            if (window.SVGEditorModal) {
                window.SVGEditorModal.open({
                    initialSvg: textarea.value,
                    entityData: this.currentField?.entity,
                    onSave: (data) => {
                        textarea.value = data.svgCode || data;
                        preview.innerHTML = data.svgCode || data;
                        this.hasUnsavedChanges = true;
                    }
                });
            }
        });
    }

    /**
     * Get the current editor value based on field type
     */
    _getEditorValue() {
        if (!this.currentField) return null;

        switch (this.currentField.fieldType) {
            case 'array':
                return this._getArrayItems();
            case 'keyMyths':
                return this._getKeyMythsData().filter(m => m.title || m.description);
            case 'extendedContent':
                return this._getExtendedContentData().filter(s => s.title || s.content);
            case 'sources':
                return this._getSourcesData().filter(s => s.source || s.text);
            case 'icon': {
                const textarea = document.getElementById('adminEditTextarea');
                return textarea ? textarea.value : null;
            }
            default: {
                const textarea = document.getElementById('adminEditTextarea');
                return textarea ? textarea.value : null;
            }
        }
    }

    /**
     * Save changes to Firestore
     */
    async _save() {
        if (!this.currentField || !this.db) return;

        const { collection, entityId, fieldName } = this.currentField;
        const newValue = this._getEditorValue();

        if (newValue === null) return;

        const saveBtn = document.getElementById('adminEditSave');
        const statusEl = document.getElementById('adminEditStatus');

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        statusEl.textContent = '';

        try {
            // Build update object (supports nested fields via dot notation)
            const updateData = {};
            updateData[fieldName] = newValue;
            updateData['lastModified'] = firebase.firestore.FieldValue.serverTimestamp();
            updateData['lastModifiedBy'] = firebase.auth().currentUser?.email || 'admin';

            await this.db.collection(collection).doc(entityId).update(updateData);

            // Log to moderation_history
            await this._logEdit(collection, entityId, fieldName, newValue);

            // Mark saved
            this.hasUnsavedChanges = false;
            statusEl.textContent = 'Saved successfully';
            statusEl.className = 'admin-edit-footer-status admin-edit-status-success';
            saveBtn.textContent = 'Saved';

            // Emit event for renderer to refresh
            document.dispatchEvent(new CustomEvent('adminEditComplete', {
                detail: { collection, entityId, fieldName, newValue }
            }));

            // Reset button after delay
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }, 2000);

            // Refresh the page content
            setTimeout(() => {
                // Trigger a hash re-navigation to refresh the entity
                const hash = window.location.hash;
                window.location.hash = '';
                requestAnimationFrame(() => {
                    window.location.hash = hash;
                });
            }, 500);

        } catch (error) {
            console.error('[AdminInlineEditPanel] Save error:', error);
            statusEl.textContent = `Error: ${error.message}`;
            statusEl.className = 'admin-edit-footer-status admin-edit-status-error';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }

    /**
     * Log edit to moderation_history
     */
    async _logEdit(collection, entityId, fieldName, newValue) {
        try {
            const user = firebase.auth().currentUser;
            await this.db.collection('moderation_history').add({
                action: 'admin_inline_edit',
                collection,
                entityId,
                fieldName,
                userId: user?.uid || 'unknown',
                userEmail: user?.email || 'unknown',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: `Edited field "${fieldName}" on ${collection}/${entityId}`
            });
        } catch (e) {
            console.warn('[AdminInlineEditPanel] Failed to log edit:', e);
        }
    }

    /**
     * Get a nested value from an object using dot notation
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Format field name for display
     */
    _formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/[._]/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
            .trim();
    }

    /**
     * Auto-resize textarea
     */
    _autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
    }

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    _escapeAttr(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

// Auto-initialize
(function() {
    function initAdminEditPanel() {
        if (window._adminEditPanel) return;
        window._adminEditPanel = new AdminInlineEditPanel();
        window._adminEditPanel.init();

        // Public API
        window.AdminInlineEditPanel = {
            open: (col, id, field, type, name) => window._adminEditPanel.open(col, id, field, type, name),
            close: () => window._adminEditPanel.close(),
            isActive: () => window._adminEditPanel.isActive
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminEditPanel);
    } else {
        initAdminEditPanel();
    }
})();
