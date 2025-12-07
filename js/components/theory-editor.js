/**
 * Rich Theory Content Editor
 * Advanced editor for creating theories with titles, panels, images, links, and corpus searches
 */

class TheoryEditor {
    constructor(container, initialData = null, options = {}) {
        this.container = container;
        this.data = initialData || {
            title: '',
            panels: [],
            images: [],
            links: [],
            corpusSearches: []
        };
        this.options = {
            userId: options.userId || null,
            theoryId: options.theoryId || null,
            useImageUploader: options.useImageUploader !== false // Default true
        };
        this.imageUploader = null;
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.initializeImageUploader();
    }

    render() {
        this.container.innerHTML = `
            <div class="theory-editor">
                <!-- Title Section -->
                <div class="editor-section">
                    <label class="editor-label">Theory Title *</label>
                    <input type="text"
                           class="editor-title-input"
                           placeholder="Enter a descriptive title"
                           value="${this.escapeHtml(this.data.title)}"
                           required>
                </div>

                <!-- Panels Section -->
                <div class="editor-section">
                    <div class="editor-section-header">
                        <label class="editor-label">Content Panels</label>
                        <button type="button" class="editor-add-btn" data-add="panel">
                            + Add Panel
                        </button>
                    </div>
                    <div class="editor-panels-container">
                        ${this.renderPanels()}
                    </div>
                </div>

                <!-- Images Section -->
                <div class="editor-section">
                    <div class="editor-section-header">
                        <label class="editor-label">Images</label>
                        ${!this.options.useImageUploader ? '<button type="button" class="editor-add-btn" data-add="image">+ Add Image</button>' : ''}
                    </div>
                    <div class="editor-images-container">
                        ${this.options.useImageUploader ? '<div id="theory-image-uploader"></div>' : this.renderImages()}
                    </div>
                </div>

                <!-- Links Section -->
                <div class="editor-section">
                    <div class="editor-section-header">
                        <label class="editor-label">External Links</label>
                        <button type="button" class="editor-add-btn" data-add="link">
                            + Add Link
                        </button>
                    </div>
                    <div class="editor-links-container">
                        ${this.renderLinks()}
                    </div>
                </div>

                <!-- Corpus Searches Section -->
                <div class="editor-section">
                    <div class="editor-section-header">
                        <label class="editor-label">Corpus Searches</label>
                        <button type="button" class="editor-add-btn" data-add="corpus">
                            + Add Search
                        </button>
                    </div>
                    <div class="editor-corpus-container">
                        ${this.renderCorpusSearches()}
                    </div>
                    <small class="editor-hint">Add references to texts in the Eyes of Azrael corpus</small>
                </div>
            </div>
        `;
    }

    renderPanels() {
        if (this.data.panels.length === 0) {
            return '<p class="editor-empty">No panels yet. Click "Add Panel" to start.</p>';
        }

        return this.data.panels.map((panel, index) => `
            <div class="editor-panel" data-index="${index}">
                <div class="editor-panel-header">
                    <span class="editor-panel-number">#${index + 1}</span>
                    <input type="text"
                           class="editor-panel-title"
                           placeholder="Panel title (optional)"
                           value="${this.escapeHtml(panel.title || '')}"
                           data-field="title"
                           data-index="${index}">
                    <button type="button" class="editor-remove-btn" data-remove="panel" data-index="${index}">
                        ×
                    </button>
                </div>
                <textarea class="editor-panel-content"
                          placeholder="Panel content..."
                          data-field="content"
                          data-index="${index}"
                          rows="6">${this.escapeHtml(panel.content || '')}</textarea>
            </div>
        `).join('');
    }

    renderImages() {
        if (this.data.images.length === 0) {
            return '<p class="editor-empty">No images yet. Click "Add Image" to upload or link.</p>';
        }

        return this.data.images.map((image, index) => `
            <div class="editor-image-item" data-index="${index}">
                <div class="editor-image-preview">
                    ${image.url ? `<img src="${this.escapeHtml(image.url)}" alt="${this.escapeHtml(image.caption || '')}">` :
                                  '<div class="editor-image-placeholder">No URL</div>'}
                </div>
                <div class="editor-image-fields">
                    <input type="text"
                           class="editor-input"
                           placeholder="Image URL"
                           value="${this.escapeHtml(image.url || '')}"
                           data-field="url"
                           data-index="${index}"
                           data-type="image">
                    <input type="text"
                           class="editor-input"
                           placeholder="Caption (optional)"
                           value="${this.escapeHtml(image.caption || '')}"
                           data-field="caption"
                           data-index="${index}"
                           data-type="image">
                    <input type="text"
                           class="editor-input"
                           placeholder="Alt text for accessibility"
                           value="${this.escapeHtml(image.alt || '')}"
                           data-field="alt"
                           data-index="${index}"
                           data-type="image">
                    <button type="button" class="editor-remove-btn" data-remove="image" data-index="${index}">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderLinks() {
        if (this.data.links.length === 0) {
            return '<p class="editor-empty">No links yet. Click "Add Link" to reference external sources.</p>';
        }

        return this.data.links.map((link, index) => `
            <div class="editor-link-item" data-index="${index}">
                <input type="text"
                       class="editor-input"
                       placeholder="Link title"
                       value="${this.escapeHtml(link.title || '')}"
                       data-field="title"
                       data-index="${index}"
                       data-type="link">
                <input type="url"
                       class="editor-input"
                       placeholder="https://..."
                       value="${this.escapeHtml(link.url || '')}"
                       data-field="url"
                       data-index="${index}"
                       data-type="link">
                <textarea class="editor-input"
                          placeholder="Description (optional)"
                          rows="2"
                          data-field="description"
                          data-index="${index}"
                          data-type="link">${this.escapeHtml(link.description || '')}</textarea>
                <button type="button" class="editor-remove-btn" data-remove="link" data-index="${index}">
                    Remove
                </button>
            </div>
        `).join('');
    }

    renderCorpusSearches() {
        if (this.data.corpusSearches.length === 0) {
            return '<p class="editor-empty">No corpus searches yet. Click "Add Search" to reference texts.</p>';
        }

        return this.data.corpusSearches.map((search, index) => `
            <div class="editor-corpus-item" data-index="${index}">
                <input type="text"
                       class="editor-input"
                       placeholder="Search query (e.g., 'flood mythology')"
                       value="${this.escapeHtml(search.query || '')}"
                       data-field="query"
                       data-index="${index}"
                       data-type="corpus">
                <select class="editor-input"
                        data-field="corpus"
                        data-index="${index}"
                        data-type="corpus">
                    <option value="">All Corpora</option>
                    <option value="greek" ${search.corpus === 'greek' ? 'selected' : ''}>Greek Texts</option>
                    <option value="norse" ${search.corpus === 'norse' ? 'selected' : ''}>Norse Texts</option>
                    <option value="egyptian" ${search.corpus === 'egyptian' ? 'selected' : ''}>Egyptian Texts</option>
                    <option value="hindu" ${search.corpus === 'hindu' ? 'selected' : ''}>Hindu Texts</option>
                    <option value="christian" ${search.corpus === 'christian' ? 'selected' : ''}>Christian Texts</option>
                    <option value="jewish" ${search.corpus === 'jewish' ? 'selected' : ''}>Jewish Texts</option>
                </select>
                <input type="text"
                       class="editor-input"
                       placeholder="Description"
                       value="${this.escapeHtml(search.description || '')}"
                       data-field="description"
                       data-index="${index}"
                       data-type="corpus">
                <button type="button" class="editor-remove-btn" data-remove="corpus" data-index="${index}">
                    Remove
                </button>
            </div>
        `).join('');
    }

    initializeImageUploader() {
        if (!this.options.useImageUploader) {
            return;
        }

        const uploaderContainer = this.container.querySelector('#theory-image-uploader');
        if (!uploaderContainer || !window.ImageUploader) {
            return;
        }

        // Initialize image uploader
        this.imageUploader = new ImageUploader(uploaderContainer, {
            userId: this.options.userId,
            theoryId: this.options.theoryId,
            multiple: true,
            maxFiles: 10,
            compress: true,
            onUploadComplete: (imageData) => {
                console.log('Image uploaded:', imageData);
            },
            onUploadError: (error) => {
                console.error('Upload error:', error);
            }
        });

        // Load existing images if any
        if (this.data.images && this.data.images.length > 0) {
            this.imageUploader.loadExistingImages(this.data.images);
        }
    }

    attachEventListeners() {
        // Title input
        this.container.querySelector('.editor-title-input')?.addEventListener('input', (e) => {
            this.data.title = e.target.value;
        });

        // Add buttons
        this.container.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-add]');
            if (addBtn) {
                const type = addBtn.dataset.add;
                this.addItem(type);
            }

            const removeBtn = e.target.closest('[data-remove]');
            if (removeBtn) {
                const type = removeBtn.dataset.remove;
                const index = parseInt(removeBtn.dataset.index);
                this.removeItem(type, index);
            }
        });

        // Input changes (only for non-image fields when using uploader)
        this.container.addEventListener('input', (e) => {
            const field = e.target.dataset.field;
            const index = parseInt(e.target.dataset.index);
            const type = e.target.dataset.type;

            if (field && !isNaN(index)) {
                if (type === 'image' && !this.options.useImageUploader) {
                    this.data.images[index][field] = e.target.value;
                    if (field === 'url') {
                        this.render(); // Re-render to show image preview
                    }
                } else if (type === 'link') {
                    this.data.links[index][field] = e.target.value;
                } else if (type === 'corpus') {
                    this.data.corpusSearches[index][field] = e.target.value;
                }
            }
        });

        // Panel inputs
        this.container.addEventListener('input', (e) => {
            if (e.target.classList.contains('editor-panel-title')) {
                const index = parseInt(e.target.dataset.index);
                this.data.panels[index].title = e.target.value;
            } else if (e.target.classList.contains('editor-panel-content')) {
                const index = parseInt(e.target.dataset.index);
                this.data.panels[index].content = e.target.value;
            }
        });
    }

    addItem(type) {
        switch (type) {
            case 'panel':
                this.data.panels.push({ title: '', content: '' });
                break;
            case 'image':
                this.data.images.push({ url: '', caption: '', alt: '' });
                break;
            case 'link':
                this.data.links.push({ title: '', url: '', description: '' });
                break;
            case 'corpus':
                this.data.corpusSearches.push({ query: '', corpus: '', description: '' });
                break;
        }
        this.render();
    }

    removeItem(type, index) {
        switch (type) {
            case 'panel':
                this.data.panels.splice(index, 1);
                break;
            case 'image':
                this.data.images.splice(index, 1);
                break;
            case 'link':
                this.data.links.splice(index, 1);
                break;
            case 'corpus':
                this.data.corpusSearches.splice(index, 1);
                break;
        }
        this.render();
    }

    getData() {
        // Get images from uploader if using it
        let images;
        if (this.options.useImageUploader && this.imageUploader) {
            images = this.imageUploader.getImages();
        } else {
            images = this.data.images.filter(i => i.url.trim());
        }

        return {
            title: this.data.title,
            panels: this.data.panels.filter(p => p.content.trim()),
            images: images,
            links: this.data.links.filter(l => l.url.trim() && l.title.trim()),
            corpusSearches: this.data.corpusSearches.filter(c => c.query.trim())
        };
    }

    /**
     * Check if there are any pending image uploads
     * @returns {boolean}
     */
    hasPendingUploads() {
        if (this.options.useImageUploader && this.imageUploader) {
            return this.imageUploader.hasPendingUploads();
        }
        return false;
    }

    /**
     * Wait for all pending uploads to complete
     * @returns {Promise}
     */
    async waitForUploads() {
        if (this.options.useImageUploader && this.imageUploader) {
            return await this.imageUploader.waitForUploads();
        }
        return Promise.resolve();
    }

    validate() {
        const data = this.getData();

        if (!data.title.trim()) {
            return { valid: false, error: 'Title is required' };
        }

        if (data.panels.length === 0) {
            return { valid: false, error: 'At least one content panel is required' };
        }

        return { valid: true };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TheoryEditor;
}
