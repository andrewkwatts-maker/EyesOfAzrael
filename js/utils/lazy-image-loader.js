/**
 * Lazy Image Loader
 * Uses Intersection Observer API to lazy load images on demand
 * Improves initial page load performance
 */

export class LazyImageLoader {
  /**
   * Create a new LazyImageLoader instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.threshold = options.threshold || 0.01;
    this.rootMargin = options.rootMargin || '50px';
    this.onLoad = options.onLoad || null;
    this.onError = options.onError || null;
    this.loadingClass = options.loadingClass || 'lazy-loading';
    this.loadedClass = options.loadedClass || 'lazy-loaded';
    this.errorClass = options.errorClass || 'lazy-error';

    // Statistics
    this.stats = {
      total: 0,
      loaded: 0,
      errors: 0,
      bytesLoaded: 0
    };

    // Create intersection observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin
      }
    );

    // Track observed elements
    this.observedElements = new Set();
  }

  /**
   * Observe an element for lazy loading
   * @param {HTMLElement} element - Element to observe
   */
  observe(element) {
    if (!element || this.observedElements.has(element)) {
      return;
    }

    this.observer.observe(element);
    this.observedElements.add(element);
    this.stats.total++;
  }

  /**
   * Observe multiple elements
   * @param {NodeList|Array} elements - Elements to observe
   */
  observeAll(elements) {
    elements.forEach(element => this.observe(element));
  }

  /**
   * Handle intersection observer callback
   * @param {IntersectionObserverEntry[]} entries - Observed entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
      }
    });
  }

  /**
   * Load an image element
   * @param {HTMLElement} element - Image element to load
   */
  async loadImage(element) {
    // Add loading class
    element.classList.add(this.loadingClass);

    try {
      // Check if it's an img element or has img children
      const img = element.tagName === 'IMG' ? element : element.querySelector('img');

      if (!img) {
        console.warn('No img element found in', element);
        return;
      }

      // Handle picture element sources
      const picture = img.closest('picture');
      if (picture) {
        await this.loadPictureElement(picture);
      } else {
        await this.loadImgElement(img);
      }

      // Mark as loaded
      element.classList.remove(this.loadingClass);
      element.classList.add(this.loadedClass);
      this.stats.loaded++;

      // Callback
      if (this.onLoad) {
        this.onLoad(element, this.stats);
      }

    } catch (error) {
      console.error('Error loading image:', error);
      element.classList.remove(this.loadingClass);
      element.classList.add(this.errorClass);
      this.stats.errors++;

      if (this.onError) {
        this.onError(element, error);
      }
    } finally {
      // Stop observing this element
      this.observer.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  /**
   * Load an img element
   * @param {HTMLImageElement} img - Image element
   */
  async loadImgElement(img) {
    // Load srcset first if available
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      delete img.dataset.srcset;
    }

    // Load src
    if (img.dataset.src) {
      await this.loadSrc(img, img.dataset.src);
      delete img.dataset.src;
    }

    // Load sizes if available
    if (img.dataset.sizes) {
      img.sizes = img.dataset.sizes;
      delete img.dataset.sizes;
    }
  }

  /**
   * Load a picture element with all sources
   * @param {HTMLPictureElement} picture - Picture element
   */
  async loadPictureElement(picture) {
    // Load all source elements first
    const sources = picture.querySelectorAll('source[data-srcset]');
    sources.forEach(source => {
      source.srcset = source.dataset.srcset;
      delete source.dataset.srcset;

      if (source.dataset.sizes) {
        source.sizes = source.dataset.sizes;
        delete source.dataset.sizes;
      }
    });

    // Then load the img element
    const img = picture.querySelector('img');
    if (img) {
      await this.loadImgElement(img);
    }
  }

  /**
   * Load src with promise-based tracking
   * @param {HTMLImageElement} img - Image element
   * @param {string} src - Source URL
   */
  loadSrc(img, src) {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();

      tempImg.onload = () => {
        img.src = src;

        // Track approximate bytes loaded
        if (tempImg.naturalWidth && tempImg.naturalHeight) {
          // Rough estimate based on image dimensions
          this.stats.bytesLoaded += tempImg.naturalWidth * tempImg.naturalHeight * 4;
        }

        resolve();
      };

      tempImg.onerror = reject;
      tempImg.src = src;
    });
  }

  /**
   * Disconnect the observer
   */
  disconnect() {
    this.observer.disconnect();
    this.observedElements.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      pending: this.stats.total - this.stats.loaded - this.stats.errors,
      successRate: this.stats.total > 0
        ? ((this.stats.loaded / this.stats.total) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Force load all remaining images
   */
  loadAll() {
    this.observedElements.forEach(element => {
      this.loadImage(element);
    });
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      total: 0,
      loaded: 0,
      errors: 0,
      bytesLoaded: 0
    };
  }
}

/**
 * Auto-initialize lazy loading for images with loading="lazy"
 */
export function initLazyLoading(options = {}) {
  const loader = new LazyImageLoader(options);

  // Find all lazy images
  const lazyImages = document.querySelectorAll('img[loading="lazy"], picture img[loading="lazy"]');

  loader.observeAll(lazyImages);

  // Store loader instance on window for debugging
  if (typeof window !== 'undefined') {
    window.lazyImageLoader = loader;
  }

  return loader;
}

/**
 * Manually convert images to lazy loading
 */
export function convertToLazyLoading(selector = 'img') {
  const images = document.querySelectorAll(selector);

  images.forEach(img => {
    // Skip if already lazy
    if (img.loading === 'lazy' || img.dataset.src) {
      return;
    }

    // Convert src to data-src
    if (img.src && !img.src.includes('data:')) {
      img.dataset.src = img.src;
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
    }

    // Convert srcset to data-srcset
    if (img.srcset) {
      img.dataset.srcset = img.srcset;
      img.srcset = '';
    }

    // Add loading attribute
    img.loading = 'lazy';
  });

  return images.length;
}

/**
 * Create a loading placeholder
 */
export function createPlaceholder(width = 400, height = 300, color = '#f0f0f0') {
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3Crect width="${width}" height="${height}" fill="${color}"%3E%3C/rect%3E%3C/svg%3E`;
}

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLazyLoading();
    });
  } else {
    // DOM already loaded
    initLazyLoading();
  }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LazyImageLoader,
    initLazyLoading,
    convertToLazyLoading,
    createPlaceholder
  };
}
