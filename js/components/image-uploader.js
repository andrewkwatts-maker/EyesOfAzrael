/**
 * Image URL Manager Component
 * Simple URL-based image management (no Firebase Storage required)
 * Users paste image URLs from external hosts (Imgur, GitHub, etc.)
 */

class ImageUploader {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            multiple: options.multiple !== false, // Default true
            maxImages: options.maxImages || 10,
            onAdd: options.onAdd || null,
            onRemove: options.onRemove || null
        };

        this.images = [];
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="image-uploader">
                <div class="image-url-input-section">
                    <div class="url-input-header">
                        <span class="input-icon">🖼️</span>
                        <span class="input-label">Add Images by URL</span>
                    </div>
                    <div class="url-input-fields">
                        <input type="url"
                               class="url-input"
                               placeholder="Paste image URL (e.g., https://i.imgur.com/example.jpg)"
                               data-url-input>
                        <button type="button"
                                class="url-add-btn"
                                data-add-url>
                            Add Image
                        </button>
                    </div>
                    <div class="url-input-hints">
                        <p class="hint-title">Supported image hosts:</p>
                        <ul class="hint-list">
                            <li><strong>Imgur:</strong> imgur.com (free, no account needed)</li>
                            <li><strong>GitHub:</strong> raw.githubusercontent.com</li>
                            <li><strong>Wikimedia:</strong> upload.wikimedia.org</li>
                            <li><strong>Direct URLs:</strong> Any public image URL ending in .jpg, .png, .gif, .webp</li>
                        </ul>
                        <p class="hint-tip">💡 <strong>Tip:</strong> Upload to <a href="https://imgur.com/upload" target="_blank">Imgur</a> first, then paste the direct image link here</p>
                    </div>
                </div>

                <div class="image-uploader-previews" data-previews></div>
            </div>
        `;
    }

    attachEventListeners() {
        const urlInput = this.container.querySelector('[data-url-input]');
        const addBtn = this.container.querySelector('[data-add-url]');

        // Add via button
        addBtn.addEventListener('click', () => {
            this.addImageByUrl(urlInput.value.trim());
        });

        // Add via Enter key
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addImageByUrl(urlInput.value.trim());
            }
        });
    }

    async addImageByUrl(url) {
        const urlInput = this.container.querySelector('[data-url-input]');

        if (!url) {
            this.showError('Please enter an image URL');
            return;
        }

        // Check max images limit
        if (this.images.length >= this.options.maxImages) {
            this.showError(`Maximum ${this.options.maxImages} images allowed`);
            return;
        }

        // Validate URL format
        if (!this.isValidUrl(url)) {
            this.showError('Invalid URL format');
            return;
        }

        // Check if URL looks like an image
        if (!this.looksLikeImageUrl(url)) {
            this.showError('URL must point to an image file (.jpg, .png, .gif, .webp)');
            return;
        }

        // Check if already added
        if (this.images.some(img => img.url === url)) {
            this.showError('This image has already been added');
            return;
        }

        // Generate ID
        const imageId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Show loading preview
        this.createLoadingPreview(imageId, url);

        // Test if image loads
        const imageLoaded = await this.testImageUrl(url);

        if (!imageLoaded) {
            this.showErrorInPreview(imageId, 'Failed to load image. Check the URL and try again.');
            return;
        }

        // Add to images array
        this.images.push({
            id: imageId,
            url: url,
            caption: '',
            alt: ''
        });

        // Update preview to loaded state
        this.updatePreviewToLoaded(imageId, url);

        // Clear input
        urlInput.value = '';

        // Callback
        if (this.options.onAdd) {
            this.options.onAdd({ id: imageId, url });
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    looksLikeImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const lowerUrl = url.toLowerCase();

        // Check if URL ends with image extension
        if (imageExtensions.some(ext => lowerUrl.endsWith(ext))) {
            return true;
        }

        // Check for common image hosting patterns
        const imageHostPatterns = [
            /imgur\.com\/\w+/i,
            /i\.imgur\.com/i,
            /raw\.githubusercontent\.com/i,
            /upload\.wikimedia\.org/i,
            /github\.com.*\.(jpg|jpeg|png|gif|webp)/i
        ];

        return imageHostPatterns.some(pattern => pattern.test(url));
    }

    testImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;

            // Timeout after 10 seconds
            setTimeout(() => resolve(false), 10000);
        });
    }

    createLoadingPreview(imageId, url) {
        const previewsContainer = this.container.querySelector('[data-previews]');

        const previewHTML = `
            <div class="image-preview loading" data-image-id="${imageId}">
                <div class="preview-image-container">
                    <div class="preview-loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Loading image...</div>
                    </div>
                </div>
                <div class="preview-url">${this.escapeHtml(this.truncateUrl(url))}</div>
            </div>
        `;

        previewsContainer.insertAdjacentHTML('beforeend', previewHTML);
    }

    updatePreviewToLoaded(imageId, url) {
        const preview = this.container.querySelector(`[data-image-id="${imageId}"]`);
        if (!preview) return;

        preview.classList.remove('loading');
        preview.innerHTML = `
            <div class="preview-image-container">
                <img src="${this.escapeHtml(url)}" alt="Preview" class="preview-image">
            </div>
            <div class="preview-fields">
                <input type="text"
                       class="preview-input"
                       placeholder="Caption (optional)"
                       data-field="caption"
                       data-image-id="${imageId}">
                <input type="text"
                       class="preview-input"
                       placeholder="Alt text for accessibility"
                       data-field="alt"
                       data-image-id="${imageId}">
                <div class="preview-url">${this.escapeHtml(this.truncateUrl(url))}</div>
                <button type="button"
                        class="preview-remove-btn"
                        data-remove="${imageId}">
                    Remove
                </button>
            </div>
        `;

        // Add event listeners
        preview.addEventListener('input', (e) => {
            if (e.target.dataset.field) {
                const field = e.target.dataset.field;
                const imageData = this.images.find(img => img.id === imageId);
                if (imageData) {
                    imageData[field] = e.target.value;
                }
            }
        });

        const removeBtn = preview.querySelector('[data-remove]');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeImage(imageId);
            });
        }
    }

    showErrorInPreview(imageId, error) {
        const preview = this.container.querySelector(`[data-image-id="${imageId}"]`);
        if (!preview) return;

        preview.classList.remove('loading');
        preview.classList.add('error');
        preview.innerHTML = `
            <div class="preview-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">${this.escapeHtml(error)}</div>
                <button type="button" class="error-close-btn" data-close-error="${imageId}">
                    Remove
                </button>
            </div>
        `;

        const closeBtn = preview.querySelector('[data-close-error]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                preview.remove();
            });
        }
    }

    removeImage(imageId) {
        const imageData = this.images.find(img => img.id === imageId);
        if (!imageData) return;

        // Remove from array
        this.images = this.images.filter(img => img.id !== imageId);

        // Remove preview element
        const preview = this.container.querySelector(`[data-image-id="${imageId}"]`);
        if (preview) {
            preview.remove();
        }

        // Callback
        if (this.options.onRemove) {
            this.options.onRemove(imageId);
        }
    }

    showError(message) {
        // Create temporary error message
        const errorHTML = `
            <div class="uploader-error" data-error>
                <span class="error-icon">⚠️</span>
                <span class="error-message">${this.escapeHtml(message)}</span>
                <button type="button" class="error-close" data-close-error>×</button>
            </div>
        `;

        this.container.insertAdjacentHTML('afterbegin', errorHTML);

        const errorElement = this.container.querySelector('[data-error]');
        const closeBtn = errorElement?.querySelector('[data-close-error]');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                errorElement.remove();
            });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorElement && errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }

    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    /**
     * Get all images with their metadata
     * @returns {Array} - Array of image objects
     */
    getImages() {
        return this.images.map(img => ({
            url: img.url,
            caption: img.caption,
            alt: img.alt
        }));
    }

    /**
     * Reset the uploader (clear all images)
     */
    reset() {
        this.images = [];
        const previewsContainer = this.container.querySelector('[data-previews]');
        if (previewsContainer) {
            previewsContainer.innerHTML = '';
        }
    }

    /**
     * Load existing images (for editing)
     * @param {Array} images - Array of image objects with url, caption, alt
     */
    loadExistingImages(images) {
        if (!Array.isArray(images)) return;

        images.forEach((image, index) => {
            const imageId = `existing_${index}`;
            this.images.push({
                id: imageId,
                url: image.url,
                caption: image.caption || '',
                alt: image.alt || ''
            });

            const previewsContainer = this.container.querySelector('[data-previews]');
            const previewHTML = `
                <div class="image-preview" data-image-id="${imageId}">
                    <div class="preview-image-container">
                        <img src="${this.escapeHtml(image.url)}" alt="${this.escapeHtml(image.alt || '')}" class="preview-image">
                    </div>
                    <div class="preview-fields">
                        <input type="text"
                               class="preview-input"
                               placeholder="Caption (optional)"
                               value="${this.escapeHtml(image.caption || '')}"
                               data-field="caption"
                               data-image-id="${imageId}">
                        <input type="text"
                               class="preview-input"
                               placeholder="Alt text for accessibility"
                               value="${this.escapeHtml(image.alt || '')}"
                               data-field="alt"
                               data-image-id="${imageId}">
                        <div class="preview-url">${this.escapeHtml(this.truncateUrl(image.url))}</div>
                        <button type="button"
                                class="preview-remove-btn"
                                data-remove="${imageId}">
                            Remove
                        </button>
                    </div>
                </div>
            `;

            previewsContainer.insertAdjacentHTML('beforeend', previewHTML);

            // Add event listeners
            const preview = previewsContainer.querySelector(`[data-image-id="${imageId}"]`);
            if (preview) {
                preview.addEventListener('input', (e) => {
                    if (e.target.dataset.field) {
                        const field = e.target.dataset.field;
                        const imageData = this.images.find(img => img.id === imageId);
                        if (imageData) {
                            imageData[field] = e.target.value;
                        }
                    }
                });

                const removeBtn = preview.querySelector('[data-remove]');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        this.removeImage(imageId);
                    });
                }
            }
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize on elements with data-image-uploader attribute
document.addEventListener('DOMContentLoaded', () => {
    const uploaderElements = document.querySelectorAll('[data-image-uploader]');

    uploaderElements.forEach(element => {
        const multiple = element.dataset.multiple !== 'false';
        const maxImages = parseInt(element.dataset.maxImages) || 10;

        new ImageUploader(element, {
            multiple,
            maxImages
        });
    });
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploader;
}
