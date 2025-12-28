/**
 * Responsive Image Component
 * Generates optimized <picture> elements with WebP support and responsive sizes
 */

export class ResponsiveImage {
  /**
   * Create a responsive image with WebP support
   * @param {string} src - Original image source path
   * @param {string} alt - Alternative text for accessibility
   * @param {Object} options - Configuration options
   * @returns {string} HTML string for the responsive image
   */
  static create(src, alt, options = {}) {
    // Default configuration
    const config = {
      sizes: options.sizes || '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw',
      loading: options.loading || 'lazy',
      decoding: options.decoding || 'async',
      width: options.width || null,
      height: options.height || null,
      class: options.class || '',
      responsiveSizes: options.responsiveSizes || [320, 640, 960, 1280, 1920],
      useWebP: options.useWebP !== false, // Default true
      usePlaceholder: options.usePlaceholder !== false // Default true
    };

    // Extract base path and extension
    const ext = src.match(/\.(jpg|jpeg|png|gif)$/i);
    if (!ext) {
      // If no extension or unsupported format, return simple img
      return this.createFallbackImage(src, alt, config);
    }

    const basePath = src.replace(/\.(jpg|jpeg|png|gif)$/i, '');
    const extension = ext[0];
    const imageType = extension.match(/\.png$/i) ? 'png' : 'jpeg';

    // Build srcset strings
    const webpSrcset = config.responsiveSizes
      .map(size => `${basePath}-${size}w.webp ${size}w`)
      .join(',\n            ');

    const regularSrcset = config.responsiveSizes
      .map(size => `${basePath}-${size}w${extension} ${size}w`)
      .join(',\n            ');

    // Build attributes
    const attrs = [
      config.class ? `class="${config.class}"` : '',
      `loading="${config.loading}"`,
      `decoding="${config.decoding}"`,
      config.width ? `width="${config.width}"` : '',
      config.height ? `height="${config.height}"` : ''
    ].filter(Boolean).join(' ');

    // Build the picture element
    return `
      <picture>
        ${config.useWebP ? `
        <!-- WebP sources with responsive sizes -->
        <source
          type="image/webp"
          srcset="${webpSrcset}"
          sizes="${config.sizes}"
        />` : ''}

        <!-- Fallback with responsive sizes -->
        <source
          type="image/${imageType}"
          srcset="${regularSrcset}"
          sizes="${config.sizes}"
        />

        <!-- Final fallback -->
        <img
          src="${basePath}-640w${extension}"
          alt="${alt}"
          ${attrs}
        />
      </picture>
    `.trim();
  }

  /**
   * Create a simple fallback image for unsupported formats
   */
  static createFallbackImage(src, alt, config) {
    const attrs = [
      config.class ? `class="${config.class}"` : '',
      `loading="${config.loading}"`,
      `decoding="${config.decoding}"`,
      config.width ? `width="${config.width}"` : '',
      config.height ? `height="${config.height}"` : ''
    ].filter(Boolean).join(' ');

    return `<img src="${src}" alt="${alt}" ${attrs} />`;
  }

  /**
   * Create a responsive background image with CSS
   */
  static createBackgroundImage(src, options = {}) {
    const ext = src.match(/\.(jpg|jpeg|png|gif)$/i);
    if (!ext) return null;

    const basePath = src.replace(/\.(jpg|jpeg|png|gif)$/i, '');
    const extension = ext[0];
    const responsiveSizes = options.responsiveSizes || [320, 640, 960, 1280, 1920];

    // Generate image-set CSS
    const webpSet = responsiveSizes
      .map(size => `url('${basePath}-${size}w.webp') ${size}w`)
      .join(', ');

    const regularSet = responsiveSizes
      .map(size => `url('${basePath}-${size}w${extension}') ${size}w`)
      .join(', ');

    return {
      webp: `image-set(${webpSet})`,
      regular: `image-set(${regularSet})`,
      fallback: `url('${basePath}-640w${extension}')`
    };
  }

  /**
   * Create a lazy-loaded responsive image with data attributes
   */
  static createLazy(src, alt, options = {}) {
    const config = {
      ...options,
      loading: 'lazy'
    };

    // Generate the standard responsive image
    let html = this.create(src, alt, config);

    // Replace src/srcset with data- attributes for manual lazy loading
    if (options.manualLazy) {
      html = html
        .replace(/srcset="/g, 'data-srcset="')
        .replace(/src="/g, 'data-src="');
    }

    return html;
  }

  /**
   * Preload critical images for performance
   */
  static createPreloadLink(src, options = {}) {
    const ext = src.match(/\.(jpg|jpeg|png|gif)$/i);
    if (!ext) return '';

    const basePath = src.replace(/\.(jpg|jpeg|png|gif)$/i, '');
    const extension = ext[0];
    const sizes = options.sizes || '100vw';
    const responsiveSizes = options.responsiveSizes || [320, 640, 960, 1280, 1920];

    // Generate srcset for preload
    const srcset = responsiveSizes
      .map(size => `${basePath}-${size}w${extension} ${size}w`)
      .join(', ');

    return `<link rel="preload" as="image" imagesrcset="${srcset}" imagesizes="${sizes}">`;
  }

  /**
   * Get optimal image size for current viewport
   */
  static getOptimalSize(viewportWidth) {
    const sizes = [320, 640, 960, 1280, 1920];

    // Find the smallest size that's larger than viewport
    for (const size of sizes) {
      if (size >= viewportWidth) {
        return size;
      }
    }

    // Return largest if viewport is bigger than all sizes
    return sizes[sizes.length - 1];
  }

  /**
   * Check if browser supports WebP
   */
  static async supportsWebP() {
    if (typeof document === 'undefined') return false;

    // Check via canvas
    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    return false;
  }

  /**
   * Add responsive image to DOM element
   */
  static render(containerElement, src, alt, options = {}) {
    if (!containerElement) return;

    const html = this.create(src, alt, options);
    containerElement.innerHTML = html;

    // Return the img element for further manipulation
    return containerElement.querySelector('img');
  }

  /**
   * Batch create multiple responsive images
   */
  static createBatch(images, defaultOptions = {}) {
    return images.map(img => {
      const options = { ...defaultOptions, ...img.options };
      return {
        ...img,
        html: this.create(img.src, img.alt, options)
      };
    });
  }

  /**
   * Create an art-directed responsive image with different images for different viewports
   */
  static createArtDirected(sources, defaultSrc, alt, options = {}) {
    const sourcesHtml = sources.map(source => {
      const ext = source.src.match(/\.(jpg|jpeg|png|gif)$/i);
      if (!ext) return '';

      const basePath = source.src.replace(/\.(jpg|jpeg|png|gif)$/i, '');
      const extension = ext[0];
      const responsiveSizes = source.sizes || options.responsiveSizes || [320, 640, 960, 1280];

      const srcset = responsiveSizes
        .map(size => `${basePath}-${size}w${extension} ${size}w`)
        .join(', ');

      return `
        <source
          media="${source.media}"
          srcset="${srcset}"
          sizes="${source.sizes || '100vw'}"
        />
      `.trim();
    }).join('\n        ');

    const attrs = [
      options.class ? `class="${options.class}"` : '',
      `loading="${options.loading || 'lazy'}"`,
      `decoding="${options.decoding || 'async'}"`,
      options.width ? `width="${options.width}"` : '',
      options.height ? `height="${options.height}"` : ''
    ].filter(Boolean).join(' ');

    return `
      <picture>
        ${sourcesHtml}
        <img src="${defaultSrc}" alt="${alt}" ${attrs} />
      </picture>
    `.trim();
  }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResponsiveImage };
}
