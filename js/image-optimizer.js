/**
 * Image Optimization System
 * Handles lazy loading, WebP support, and responsive images
 */

class ImageOptimizer {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.01,
            placeholderColor: '#1a1a2e',
            enableWebP: true,
            ...options
        };

        this.supportsWebP = false;
        this.observer = null;

        this.init();
    }

    /**
     * Initialize image optimizer
     */
    async init() {
        // Check WebP support
        this.supportsWebP = await this.checkWebPSupport();

        // Set up intersection observer for lazy loading
        this.setupLazyLoading();

        // Process existing images
        this.processImages();
    }

    /**
     * Check if browser supports WebP
     */
    async checkWebPSupport() {
        if (!self.createImageBitmap) return false;

        const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';

        try {
            const blob = await fetch(webpData).then(r => r.blob());
            return await createImageBitmap(blob).then(() => true, () => false);
        } catch {
            return false;
        }
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupLazyLoading() {
        const config = {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, config);
    }

    /**
     * Process all images on the page
     */
    processImages() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => this.observeImage(img));
    }

    /**
     * Observe an image for lazy loading
     */
    observeImage(img) {
        // Add placeholder
        if (!img.src && !img.style.backgroundColor) {
            img.style.backgroundColor = this.options.placeholderColor;
        }

        // Add loading class
        img.classList.add('lazy-loading');

        // Observe
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(img);
        }
    }

    /**
     * Load an image
     */
    loadImage(img) {
        const src = img.dataset.src || img.src;
        const srcset = img.dataset.srcset;

        if (!src) return;

        // Create new image to preload
        const imageLoader = new Image();

        // Set up load handlers
        imageLoader.onload = () => {
            this.applyImage(img, imageLoader);
        };

        imageLoader.onerror = () => {
            this.handleImageError(img);
        };

        // Determine best image format
        const finalSrc = this.getBestImageSrc(src);

        // Load the image
        if (srcset) {
            imageLoader.srcset = srcset;
        }
        imageLoader.src = finalSrc;
    }

    /**
     * Get best image source based on browser support
     */
    getBestImageSrc(src) {
        if (!this.options.enableWebP || !this.supportsWebP) {
            return src;
        }

        // If src already has extension, try WebP version
        const ext = src.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(ext)) {
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            return webpSrc;
        }

        return src;
    }

    /**
     * Apply loaded image to img element
     */
    applyImage(img, loadedImage) {
        // Fade in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';

        // Set source
        img.src = loadedImage.src;
        if (loadedImage.srcset) {
            img.srcset = loadedImage.srcset;
        }

        // Update classes
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');

        // Fade in
        requestAnimationFrame(() => {
            img.style.opacity = '1';
        });

        // Remove placeholder background
        setTimeout(() => {
            img.style.backgroundColor = '';
        }, 300);

        // Dispatch event
        img.dispatchEvent(new CustomEvent('lazyloaded', { bubbles: true }));
    }

    /**
     * Handle image loading error
     */
    handleImageError(img) {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');

        // Set placeholder or error image
        img.alt = img.alt || 'Image failed to load';
        img.style.backgroundColor = '#2a2a3e';

        // Add error indicator
        const errorText = document.createElement('div');
        errorText.className = 'image-error-text';
        errorText.textContent = '⚠ Image unavailable';
        errorText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #888;
            font-size: 0.9rem;
            text-align: center;
        `;

        const wrapper = img.parentElement;
        if (wrapper && wrapper.style.position !== 'absolute' && wrapper.style.position !== 'relative') {
            wrapper.style.position = 'relative';
        }
        wrapper.appendChild(errorText);

        // Dispatch error event
        img.dispatchEvent(new CustomEvent('lazyerror', { bubbles: true }));
    }

    /**
     * Create responsive image element
     */
    createResponsiveImage(config) {
        const {
            src,
            alt = '',
            sizes = '100vw',
            widths = [320, 640, 960, 1280, 1920],
            className = '',
            lazy = true
        } = config;

        const img = document.createElement('img');
        img.alt = alt;
        img.className = className;

        if (lazy) {
            img.dataset.src = src;
            img.loading = 'lazy';

            // Generate srcset
            const srcset = widths
                .map(w => {
                    const srcsetUrl = this.getResizedImageUrl(src, w);
                    return `${srcsetUrl} ${w}w`;
                })
                .join(', ');

            img.dataset.srcset = srcset;
            img.sizes = sizes;

            this.observeImage(img);
        } else {
            img.src = src;
        }

        return img;
    }

    /**
     * Get resized image URL (would integrate with your image CDN)
     */
    getResizedImageUrl(src, width) {
        // This would integrate with your image processing service
        // For now, return original
        // Example: return `${src}?w=${width}&q=80`;
        return src;
    }

    /**
     * Preload critical images
     */
    preloadImages(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    /**
     * Add new images to be observed
     */
    addImages(selector) {
        const images = document.querySelectorAll(selector);
        images.forEach(img => this.observeImage(img));
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new ImageOptimizer();
    });
} else {
    window.imageOptimizer = new ImageOptimizer();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}
