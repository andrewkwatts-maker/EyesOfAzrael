/**
 * Image Lightbox Component
 * Eyes of Azrael Project
 *
 * Features:
 * - Smooth open/close animations
 * - Keyboard navigation (left/right arrows, ESC to close)
 * - Zoom functionality (click to zoom, mouse wheel)
 * - Pan when zoomed (drag to move)
 * - Touch gestures for mobile (swipe, pinch-to-zoom)
 * - Thumbnail navigation
 * - Image counter
 * - Preloading of adjacent images
 * - Focus trap for accessibility
 * - ARIA attributes for screen readers
 */

class ImageLightbox {
    /**
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            enableZoom: options.enableZoom !== false,
            enableKeyboard: options.enableKeyboard !== false,
            enableSwipe: options.enableSwipe !== false,
            enableThumbnails: options.enableThumbnails !== false,
            closeOnBackdrop: options.closeOnBackdrop !== false,
            preloadAdjacent: options.preloadAdjacent !== false,
            animationDuration: options.animationDuration || 300,
            maxZoom: options.maxZoom || 3,
            onOpen: options.onOpen || null,
            onClose: options.onClose || null,
            onNavigate: options.onNavigate || null,
            ...options
        };

        this.images = [];
        this.currentIndex = 0;
        this.isOpen = false;
        this.isZoomed = false;
        this.overlay = null;
        this.previousActiveElement = null;

        // Zoom/pan state
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.initialPinchDistance = 0;

        // Bound handlers for cleanup
        this.boundKeyHandler = this.handleKeyDown.bind(this);
        this.boundWheelHandler = this.handleWheel.bind(this);
        this.boundMouseDown = this.handleMouseDown.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchMove = this.handleTouchMove.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);
    }

    /**
     * Open lightbox with single image or gallery
     * @param {string|string[]|Object|Object[]} images - Image URL(s) or object(s) with src/title
     * @param {number} startIndex - Starting index (default 0)
     */
    open(images, startIndex = 0) {
        // Normalize images to array of objects
        if (typeof images === 'string') {
            this.images = [{ src: images, title: '' }];
        } else if (Array.isArray(images)) {
            this.images = images.map(img =>
                typeof img === 'string' ? { src: img, title: '' } : img
            );
        } else {
            this.images = [images];
        }

        if (this.images.length === 0) {
            console.warn('[Lightbox] No images provided');
            return;
        }

        this.currentIndex = Math.max(0, Math.min(startIndex, this.images.length - 1));
        this.previousActiveElement = document.activeElement;

        this.createOverlay();
        this.renderCurrentImage();
        this.setupEventListeners();
        this.show();

        // Preload adjacent images
        if (this.options.preloadAdjacent) {
            this.preloadAdjacentImages();
        }

        // Callback
        if (typeof this.options.onOpen === 'function') {
            this.options.onOpen(this.images[this.currentIndex], this.currentIndex);
        }
    }

    /**
     * Create lightbox DOM structure
     */
    createOverlay() {
        // Remove existing lightbox
        const existing = document.getElementById('eoa-lightbox');
        if (existing) existing.remove();

        const hasMultiple = this.images.length > 1;

        this.overlay = document.createElement('div');
        this.overlay.id = 'eoa-lightbox';
        this.overlay.className = 'lightbox-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-label', 'Image lightbox');
        this.overlay.innerHTML = `
            <div class="lightbox-controls">
                <div class="lightbox-info">
                    <h3 class="lightbox-title" id="lightbox-title"></h3>
                    ${hasMultiple ? '<span class="lightbox-counter" id="lightbox-counter"></span>' : ''}
                </div>
                <div class="lightbox-actions">
                    ${this.options.enableZoom ? `
                        <button class="lightbox-btn lightbox-zoom" id="lightbox-zoom" aria-label="Toggle zoom" title="Zoom (Z)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                                <path d="M11 8v6M8 11h6"/>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="lightbox-btn lightbox-download" id="lightbox-download" aria-label="Download image" title="Download (D)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="lightbox-btn lightbox-close" id="lightbox-close" aria-label="Close lightbox" title="Close (ESC)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="lightbox-container" id="lightbox-container">
                <div class="lightbox-loading" id="lightbox-loading" style="display: none;">
                    <div class="lightbox-spinner"></div>
                </div>
                <img class="lightbox-image" id="lightbox-image" alt="" draggable="false" />
            </div>

            ${hasMultiple ? `
                <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Previous image" title="Previous (Left Arrow)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Next image" title="Next (Right Arrow)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
            ` : ''}

            ${hasMultiple && this.options.enableThumbnails ? `
                <div class="lightbox-footer">
                    <div class="lightbox-thumbnails" id="lightbox-thumbnails" role="listbox" aria-label="Image thumbnails">
                        ${this.images.map((img, i) => `
                            <button class="lightbox-thumb${i === this.currentIndex ? ' active' : ''}"
                                    data-index="${i}"
                                    role="option"
                                    aria-selected="${i === this.currentIndex}"
                                    aria-label="View image ${i + 1}">
                                <img src="${this.escapeHtml(img.src)}" alt="" loading="lazy" />
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        document.body.appendChild(this.overlay);
        document.body.classList.add('modal-open');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        if (!this.overlay) return;

        const closeBtn = document.getElementById('lightbox-close');
        const zoomBtn = document.getElementById('lightbox-zoom');
        const downloadBtn = document.getElementById('lightbox-download');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        const image = document.getElementById('lightbox-image');
        const thumbnails = document.getElementById('lightbox-thumbnails');

        // Close button
        closeBtn?.addEventListener('click', () => this.close());

        // Backdrop click
        if (this.options.closeOnBackdrop) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        // Zoom button
        zoomBtn?.addEventListener('click', () => this.toggleZoom());

        // Download button
        downloadBtn?.addEventListener('click', () => this.downloadCurrentImage());

        // Navigation buttons
        prevBtn?.addEventListener('click', () => this.prev());
        nextBtn?.addEventListener('click', () => this.next());

        // Image click for zoom
        if (this.options.enableZoom) {
            image?.addEventListener('click', (e) => {
                if (!this.isDragging) {
                    this.toggleZoom(e);
                }
            });
        }

        // Thumbnail clicks
        thumbnails?.addEventListener('click', (e) => {
            const thumb = e.target.closest('.lightbox-thumb');
            if (thumb) {
                const index = parseInt(thumb.dataset.index, 10);
                this.goTo(index);
            }
        });

        // Keyboard navigation
        if (this.options.enableKeyboard) {
            document.addEventListener('keydown', this.boundKeyHandler);
        }

        // Mouse wheel for zoom
        if (this.options.enableZoom) {
            this.overlay.addEventListener('wheel', this.boundWheelHandler, { passive: false });
        }

        // Mouse drag for panning zoomed image
        image?.addEventListener('mousedown', this.boundMouseDown);
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);

        // Touch gestures
        if (this.options.enableSwipe || this.options.enableZoom) {
            image?.addEventListener('touchstart', this.boundTouchStart, { passive: false });
            image?.addEventListener('touchmove', this.boundTouchMove, { passive: false });
            image?.addEventListener('touchend', this.boundTouchEnd);
        }

        // Focus trap
        this.setupFocusTrap();
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.prev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.next();
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                this.toggleZoom();
                break;
            case 'd':
            case 'D':
                e.preventDefault();
                this.downloadCurrentImage();
                break;
            case 'Home':
                e.preventDefault();
                this.goTo(0);
                break;
            case 'End':
                e.preventDefault();
                this.goTo(this.images.length - 1);
                break;
        }
    }

    /**
     * Handle mouse wheel for zoom
     * @param {WheelEvent} e
     */
    handleWheel(e) {
        if (!this.isOpen || !this.options.enableZoom) return;

        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(1, Math.min(this.options.maxZoom, this.scale + delta));

        if (newScale !== this.scale) {
            // Zoom towards cursor position
            const rect = document.getElementById('lightbox-image')?.getBoundingClientRect();
            if (rect) {
                const offsetX = e.clientX - rect.left - rect.width / 2;
                const offsetY = e.clientY - rect.top - rect.height / 2;

                if (newScale > 1) {
                    this.translateX -= offsetX * delta;
                    this.translateY -= offsetY * delta;
                } else {
                    this.translateX = 0;
                    this.translateY = 0;
                }
            }

            this.scale = newScale;
            this.isZoomed = this.scale > 1;
            this.updateImageTransform();
            this.updateZoomUI();
        }
    }

    /**
     * Handle mouse down for drag start
     * @param {MouseEvent} e
     */
    handleMouseDown(e) {
        if (!this.isZoomed) return;

        e.preventDefault();
        this.isDragging = true;
        this.dragStartX = e.clientX - this.translateX;
        this.dragStartY = e.clientY - this.translateY;

        const image = document.getElementById('lightbox-image');
        if (image) {
            image.classList.add('grabbing');
        }
    }

    /**
     * Handle mouse move for dragging
     * @param {MouseEvent} e
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;

        this.translateX = e.clientX - this.dragStartX;
        this.translateY = e.clientY - this.dragStartY;
        this.constrainPan();
        this.updateImageTransform();
    }

    /**
     * Handle mouse up for drag end
     */
    handleMouseUp() {
        this.isDragging = false;
        const image = document.getElementById('lightbox-image');
        if (image) {
            image.classList.remove('grabbing');
        }
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;

            if (this.isZoomed) {
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX - this.translateX;
                this.dragStartY = e.touches[0].clientY - this.translateY;
            }
        } else if (e.touches.length === 2 && this.options.enableZoom) {
            // Pinch start
            e.preventDefault();
            this.initialPinchDistance = this.getPinchDistance(e);
        }
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e
     */
    handleTouchMove(e) {
        if (e.touches.length === 1 && !this.isZoomed) {
            // Swipe navigation (only when not zoomed)
            // Will be handled in touchEnd
        } else if (e.touches.length === 1 && this.isZoomed && this.isDragging) {
            e.preventDefault();
            this.translateX = e.touches[0].clientX - this.dragStartX;
            this.translateY = e.touches[0].clientY - this.dragStartY;
            this.constrainPan();
            this.updateImageTransform();
        } else if (e.touches.length === 2 && this.initialPinchDistance > 0) {
            // Pinch zoom
            e.preventDefault();
            const currentDistance = this.getPinchDistance(e);
            const scaleDelta = currentDistance / this.initialPinchDistance;
            const newScale = Math.max(1, Math.min(this.options.maxZoom, this.scale * scaleDelta));

            this.scale = newScale;
            this.isZoomed = this.scale > 1;
            this.initialPinchDistance = currentDistance;
            this.updateImageTransform();
            this.updateZoomUI();
        }
    }

    /**
     * Handle touch end
     * @param {TouchEvent} e
     */
    handleTouchEnd(e) {
        if (!this.isZoomed && e.changedTouches.length === 1) {
            const deltaX = e.changedTouches[0].clientX - this.touchStartX;
            const deltaY = e.changedTouches[0].clientY - this.touchStartY;

            // Horizontal swipe detection
            if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
                if (deltaX > 0) {
                    this.prev();
                } else {
                    this.next();
                }
            }
        }

        this.isDragging = false;
        this.initialPinchDistance = 0;
    }

    /**
     * Get distance between two touch points
     * @param {TouchEvent} e
     * @returns {number}
     */
    getPinchDistance(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Constrain pan to keep image on screen
     */
    constrainPan() {
        const image = document.getElementById('lightbox-image');
        if (!image) return;

        const rect = image.getBoundingClientRect();
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        const scaledWidth = rect.width * this.scale;
        const scaledHeight = rect.height * this.scale;

        const maxTranslateX = Math.max(0, (scaledWidth - containerWidth) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerHeight) / 2);

        this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX));
        this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY));
    }

    /**
     * Update image transform based on zoom/pan state
     */
    updateImageTransform() {
        const image = document.getElementById('lightbox-image');
        if (image) {
            image.style.transform = `scale(${this.scale}) translate(${this.translateX / this.scale}px, ${this.translateY / this.scale}px)`;
            image.classList.toggle('zoomed', this.isZoomed);
        }
    }

    /**
     * Update zoom UI state
     */
    updateZoomUI() {
        const zoomBtn = document.getElementById('lightbox-zoom');
        if (zoomBtn) {
            zoomBtn.setAttribute('aria-pressed', this.isZoomed.toString());
            zoomBtn.innerHTML = this.isZoomed ? `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                    <path d="M8 11h6"/>
                </svg>
            ` : `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                </svg>
            `;
        }
    }

    /**
     * Setup focus trap
     */
    setupFocusTrap() {
        if (!this.overlay) return;

        const getFocusableElements = () => {
            const selector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
            return Array.from(this.overlay.querySelectorAll(selector)).filter(
                el => el.offsetParent !== null
            );
        };

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            const focusable = getFocusableElements();
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        this.overlay.addEventListener('keydown', handleTab);
        this.focusTrapHandler = handleTab;

        // Focus first button
        const focusable = getFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }

    /**
     * Show lightbox with animation
     */
    show() {
        this.isOpen = true;

        requestAnimationFrame(() => {
            this.overlay?.classList.add('show');
        });
    }

    /**
     * Render current image
     */
    renderCurrentImage() {
        const img = this.images[this.currentIndex];
        if (!img) return;

        const imageEl = document.getElementById('lightbox-image');
        const titleEl = document.getElementById('lightbox-title');
        const counterEl = document.getElementById('lightbox-counter');
        const loadingEl = document.getElementById('lightbox-loading');

        // Reset zoom state
        this.resetZoom();

        // Update title
        if (titleEl) {
            titleEl.textContent = img.title || '';
        }

        // Update counter
        if (counterEl) {
            counterEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }

        // Update navigation buttons
        this.updateNavigationState();

        // Update thumbnails
        this.updateThumbnails();

        // Show loading
        if (loadingEl) loadingEl.style.display = 'flex';

        // Load image
        if (imageEl) {
            imageEl.style.opacity = '0';

            const tempImg = new Image();
            tempImg.onload = () => {
                imageEl.src = img.src;
                imageEl.alt = img.title || 'Lightbox image';
                imageEl.style.opacity = '';
                if (loadingEl) loadingEl.style.display = 'none';
            };
            tempImg.onerror = () => {
                imageEl.src = '';
                imageEl.alt = 'Failed to load image';
                if (loadingEl) loadingEl.style.display = 'none';
            };
            tempImg.src = img.src;
        }
    }

    /**
     * Update navigation button states
     */
    updateNavigationState() {
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.images.length - 1;
        }
    }

    /**
     * Update thumbnail active state
     */
    updateThumbnails() {
        const thumbs = document.querySelectorAll('.lightbox-thumb');
        thumbs.forEach((thumb, i) => {
            const isActive = i === this.currentIndex;
            thumb.classList.toggle('active', isActive);
            thumb.setAttribute('aria-selected', isActive.toString());
        });

        // Scroll active thumbnail into view
        const activeThumb = document.querySelector('.lightbox-thumb.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    /**
     * Preload adjacent images
     */
    preloadAdjacentImages() {
        const preloadIndex = [this.currentIndex - 1, this.currentIndex + 1];

        preloadIndex.forEach(i => {
            if (i >= 0 && i < this.images.length) {
                const img = new Image();
                img.src = this.images[i].src;
            }
        });
    }

    /**
     * Navigate to previous image
     */
    prev() {
        if (this.currentIndex > 0) {
            this.goTo(this.currentIndex - 1);
        }
    }

    /**
     * Navigate to next image
     */
    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.goTo(this.currentIndex + 1);
        }
    }

    /**
     * Go to specific image index
     * @param {number} index
     */
    goTo(index) {
        if (index < 0 || index >= this.images.length || index === this.currentIndex) {
            return;
        }

        this.currentIndex = index;
        this.renderCurrentImage();

        if (this.options.preloadAdjacent) {
            this.preloadAdjacentImages();
        }

        // Callback
        if (typeof this.options.onNavigate === 'function') {
            this.options.onNavigate(this.images[this.currentIndex], this.currentIndex);
        }
    }

    /**
     * Toggle zoom state
     * @param {MouseEvent} e - Optional click event for zoom point
     */
    toggleZoom(e) {
        if (this.isZoomed) {
            this.resetZoom();
        } else {
            this.scale = 2;
            this.isZoomed = true;

            // Zoom to click point if event provided
            if (e && e.clientX !== undefined) {
                const image = document.getElementById('lightbox-image');
                if (image) {
                    const rect = image.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left - rect.width / 2;
                    const offsetY = e.clientY - rect.top - rect.height / 2;
                    this.translateX = -offsetX;
                    this.translateY = -offsetY;
                }
            }

            this.updateImageTransform();
            this.updateZoomUI();
        }
    }

    /**
     * Reset zoom to default
     */
    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isZoomed = false;
        this.updateImageTransform();
        this.updateZoomUI();
    }

    /**
     * Download current image
     */
    downloadCurrentImage() {
        const img = this.images[this.currentIndex];
        if (!img) return;

        const link = document.createElement('a');
        link.href = img.src;
        link.download = img.title || `image-${this.currentIndex + 1}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Close lightbox
     */
    close() {
        if (!this.overlay) return;

        // Remove event listeners
        if (this.options.enableKeyboard) {
            document.removeEventListener('keydown', this.boundKeyHandler);
        }
        this.overlay.removeEventListener('wheel', this.boundWheelHandler);
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);

        // Animate out
        this.overlay.classList.remove('show');

        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            document.body.classList.remove('modal-open');
            this.isOpen = false;
            this.resetZoom();

            // Return focus
            if (this.previousActiveElement && this.previousActiveElement.focus) {
                this.previousActiveElement.focus();
            }

            // Callback
            if (typeof this.options.onClose === 'function') {
                this.options.onClose();
            }
        }, this.options.animationDuration);
    }

    /**
     * Escape HTML for security
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Static method to initialize lightbox for all images matching a selector
     * @param {string} selector - CSS selector for images
     * @param {Object} options - Lightbox options
     */
    static initGallery(selector, options = {}) {
        const images = document.querySelectorAll(selector);
        const imageData = Array.from(images).map(img => ({
            src: img.getAttribute('data-lightbox-src') || img.src || img.getAttribute('href'),
            title: img.getAttribute('data-lightbox-title') || img.alt || img.title || ''
        }));

        const lightbox = new ImageLightbox(options);

        images.forEach((img, index) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                e.preventDefault();
                lightbox.open(imageData, index);
            });
        });

        return lightbox;
    }
}

// Make globally available
window.ImageLightbox = ImageLightbox;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageLightbox;
}
