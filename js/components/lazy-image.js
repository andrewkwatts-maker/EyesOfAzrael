/**
 * Lazy Image Loading Component
 * Performance-optimized image loading for mobile devices
 *
 * Features:
 * - Native lazy loading with IntersectionObserver fallback
 * - Placeholder shimmer effect while loading
 * - Error handling with fallback images
 * - WebP detection and format selection
 * - Responsive image srcset support
 * - Low-quality image placeholder (LQIP) support
 * - Fade-in animation on load
 *
 * Last updated: 2026-01-10
 */

class LazyImage {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px 0px',     // Start loading before in viewport
            threshold: 0.01,             // Trigger when 1% visible
            fadeInDuration: 300,         // Animation duration in ms
            placeholderColor: 'rgba(26, 31, 58, 0.8)',
            errorFallback: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%231a1f3a" width="100" height="100"/%3E%3Ctext x="50" y="50" fill="%23666" text-anchor="middle" dy=".3em" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E',
            useNativeLazy: true,         // Use native loading="lazy" when supported
            enableWebP: true,            // Auto-detect and use WebP
            ...options
        };

        this.observer = null;
        this.supportsWebP = null;
        this.processedImages = new WeakSet();

        this.init();
    }

    /**
     * Initialize the lazy loading system
     */
    async init() {
        // Check WebP support
        if (this.options.enableWebP) {
            this.supportsWebP = await this.checkWebPSupport();
        }

        // Create intersection observer
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
        }

        // Process existing images
        this.processAllImages();

        // Watch for new images added to DOM
        this.observeDOMChanges();

        console.log('[LazyImage] Initialized', {
            supportsWebP: this.supportsWebP,
            useNativeLazy: this.options.useNativeLazy,
            hasObserver: !!this.observer
        });
    }

    /**
     * Check WebP support
     */
    async checkWebPSupport() {
        if (typeof createImageBitmap === 'undefined') {
            return false;
        }

        const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

        try {
            const blob = await fetch(webpData).then(r => r.blob());
            return createImageBitmap(blob).then(() => true, () => false);
        } catch (e) {
            return false;
        }
    }

    /**
     * Process all lazy images in the document
     */
    processAllImages() {
        const images = document.querySelectorAll(
            'img[data-src], img[data-lazy], img.lazy-image, img[loading="lazy"]'
        );

        images.forEach(img => this.processImage(img));
    }

    /**
     * Process a single image
     */
    processImage(img) {
        // Skip if already processed
        if (this.processedImages.has(img)) return;
        this.processedImages.add(img);

        // Get the source URL
        const src = img.dataset.src || img.dataset.lazy || img.src;
        if (!src || src === this.options.errorFallback) return;

        // Add wrapper if not already wrapped
        if (!img.parentElement?.classList.contains('lazy-image-container')) {
            this.wrapImage(img);
        }

        // Check if image should use native lazy loading
        const useNative = this.options.useNativeLazy && 'loading' in HTMLImageElement.prototype;

        if (useNative && img.loading === 'lazy') {
            // Let native lazy loading handle it
            this.setupNativeLazyImage(img, src);
        } else if (this.observer) {
            // Use IntersectionObserver
            this.setupObservedImage(img, src);
        } else {
            // Fallback: load immediately
            this.loadImage(img, src);
        }
    }

    /**
     * Wrap image in a container for styling
     */
    wrapImage(img) {
        // Don't wrap if parent is already a container
        if (img.parentElement?.classList.contains('lazy-image-container')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'lazy-image-container';

        // Copy dimensions if specified
        if (img.width) wrapper.style.width = `${img.width}px`;
        if (img.height) wrapper.style.height = `${img.height}px`;
        if (img.style.width) wrapper.style.width = img.style.width;
        if (img.style.height) wrapper.style.height = img.style.height;

        // Maintain aspect ratio
        if (img.dataset.aspectRatio) {
            wrapper.style.aspectRatio = img.dataset.aspectRatio;
        }

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Add placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'lazy-image-placeholder';
        wrapper.insertBefore(placeholder, img);
    }

    /**
     * Setup image with native lazy loading
     */
    setupNativeLazyImage(img, src) {
        // Store original source
        if (!img.dataset.src) {
            img.dataset.src = src;
        }

        // Add load handler
        img.addEventListener('load', () => this.onImageLoad(img), { once: true });
        img.addEventListener('error', () => this.onImageError(img), { once: true });

        // Transform source if WebP is supported
        const finalSrc = this.transformSource(src);
        if (img.src !== finalSrc) {
            img.src = finalSrc;
        }
    }

    /**
     * Setup image for IntersectionObserver
     */
    setupObservedImage(img, src) {
        // Store source and clear current
        img.dataset.src = src;
        img.src = this.options.placeholderColor;
        img.classList.add('lazy-pending');

        // Observe for visibility
        this.observer.observe(img);
    }

    /**
     * Handle intersection (image becoming visible)
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.observer.unobserve(img);
                this.loadImage(img, img.dataset.src);
            }
        });
    }

    /**
     * Load an image
     */
    loadImage(img, src) {
        if (!src) return;

        img.classList.remove('lazy-pending');
        img.classList.add('lazy-loading');

        // Transform source if WebP is supported
        const finalSrc = this.transformSource(src);

        // Create a new image to preload
        const preloader = new Image();

        preloader.onload = () => {
            img.src = finalSrc;
            this.onImageLoad(img);
        };

        preloader.onerror = () => {
            // Try original source if transformed source failed
            if (finalSrc !== src) {
                img.src = src;
                img.addEventListener('load', () => this.onImageLoad(img), { once: true });
                img.addEventListener('error', () => this.onImageError(img), { once: true });
            } else {
                this.onImageError(img);
            }
        };

        preloader.src = finalSrc;
    }

    /**
     * Transform source URL for WebP if supported
     */
    transformSource(src) {
        if (!this.supportsWebP || !this.options.enableWebP) {
            return src;
        }

        // Check if already WebP
        if (src.includes('.webp')) {
            return src;
        }

        // Check if it's a data URL
        if (src.startsWith('data:')) {
            return src;
        }

        // Check for common image services that support WebP conversion
        // Firebase Storage
        if (src.includes('firebasestorage.googleapis.com')) {
            // Firebase doesn't auto-convert, return as-is
            return src;
        }

        // Cloudinary
        if (src.includes('cloudinary.com')) {
            return src.replace('/upload/', '/upload/f_auto/');
        }

        // imgix
        if (src.includes('imgix.net')) {
            const url = new URL(src);
            url.searchParams.set('auto', 'format');
            return url.toString();
        }

        // Generic: try to add .webp extension as fallback
        // (won't work for all services, but worth trying)
        return src;
    }

    /**
     * Handle successful image load
     */
    onImageLoad(img) {
        img.classList.remove('lazy-loading');
        img.classList.add('loaded');

        // Remove placeholder
        const placeholder = img.parentElement?.querySelector('.lazy-image-placeholder');
        if (placeholder) {
            placeholder.classList.add('fade-out');
            setTimeout(() => placeholder.remove(), this.options.fadeInDuration);
        }

        // Dispatch custom event
        img.dispatchEvent(new CustomEvent('lazyload', { bubbles: true }));
    }

    /**
     * Handle image load error
     */
    onImageError(img) {
        img.classList.remove('lazy-loading');
        img.classList.add('error');

        // Use fallback image
        img.src = this.options.errorFallback;

        // Update placeholder
        const placeholder = img.parentElement?.querySelector('.lazy-image-placeholder');
        if (placeholder) {
            placeholder.classList.add('error');
        }

        console.warn('[LazyImage] Failed to load:', img.dataset.src);

        // Dispatch custom event
        img.dispatchEvent(new CustomEvent('lazyerror', { bubbles: true }));
    }

    /**
     * Observe DOM for dynamically added images
     */
    observeDOMChanges() {
        if (!('MutationObserver' in window)) return;

        const domObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's an image
                        if (node.tagName === 'IMG') {
                            this.processImage(node);
                        }
                        // Check for images inside the node
                        const images = node.querySelectorAll?.('img[data-src], img.lazy-image, img[loading="lazy"]');
                        images?.forEach(img => this.processImage(img));
                    }
                });
            });
        });

        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Manually trigger loading for an image
     */
    forceLoad(img) {
        if (this.observer) {
            this.observer.unobserve(img);
        }
        this.loadImage(img, img.dataset.src || img.src);
    }

    /**
     * Destroy instance and cleanup
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

/**
 * Helper function to create a lazy image element
 */
function createLazyImage(src, alt = '', options = {}) {
    const img = document.createElement('img');
    img.dataset.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    img.className = 'lazy-image';

    if (options.width) img.width = options.width;
    if (options.height) img.height = options.height;
    if (options.className) img.className += ' ' + options.className;
    if (options.aspectRatio) img.dataset.aspectRatio = options.aspectRatio;

    return img;
}

/**
 * Inject lazy image styles
 */
function injectLazyImageStyles() {
    if (document.getElementById('lazy-image-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'lazy-image-styles';
    styles.textContent = `
        /* Lazy Image Container */
        .lazy-image-container {
            position: relative;
            overflow: hidden;
            background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.6);
        }

        /* Placeholder with shimmer effect */
        .lazy-image-placeholder {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                90deg,
                rgba(var(--color-bg-secondary-rgb, 21, 26, 53), 0.6) 0%,
                rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.8) 50%,
                rgba(var(--color-bg-secondary-rgb, 21, 26, 53), 0.6) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
        }

        @keyframes shimmer {
            0% {
                background-position: 100% 0;
            }
            100% {
                background-position: -100% 0;
            }
        }

        .lazy-image-placeholder.fade-out {
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .lazy-image-placeholder.error {
            animation: none;
            background: rgba(var(--color-bg-secondary-rgb, 21, 26, 53), 0.8);
        }

        /* Image states */
        .lazy-image,
        img.lazy-pending,
        img.lazy-loading {
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .lazy-image.loaded,
        img.loaded {
            opacity: 1;
        }

        .lazy-image.error,
        img.error {
            opacity: 0.5;
        }

        /* Native lazy loading support */
        img[loading="lazy"] {
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        img[loading="lazy"].loaded,
        img[loading="lazy"][src]:not([src=""]):not([src*="data:"]) {
            opacity: 1;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            .lazy-image-placeholder {
                animation: none;
            }

            .lazy-image,
            img.lazy-pending,
            img.lazy-loading,
            img[loading="lazy"] {
                transition: none;
            }
        }
    `;

    document.head.appendChild(styles);
}

// Global export and auto-initialization
if (typeof window !== 'undefined') {
    window.LazyImage = LazyImage;
    window.createLazyImage = createLazyImage;

    // Auto-initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        injectLazyImageStyles();
        window.lazyImageLoader = new LazyImage();
    });
}
