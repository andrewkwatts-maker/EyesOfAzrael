/**
 * WebP Detection Utility
 * Detects browser support for WebP images
 * Adds appropriate classes to HTML element for CSS fallbacks
 */

/**
 * Check if browser supports WebP format
 * @returns {Promise<boolean>} True if WebP is supported
 */
export async function supportsWebP() {
  // Server-side check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // Check if already cached
  if (window._webpSupport !== undefined) {
    return window._webpSupport;
  }

  try {
    // Method 1: Canvas-based check (fast, synchronous)
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      const hasWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

      if (hasWebP) {
        window._webpSupport = true;
        return true;
      }
    }

    // Method 2: Feature detection via image loading (more reliable)
    return await checkWebPWithImage();
  } catch (error) {
    console.warn('WebP detection failed:', error);
    window._webpSupport = false;
    return false;
  }
}

/**
 * Check WebP support by loading a test image
 * @returns {Promise<boolean>} True if WebP is supported
 */
function checkWebPWithImage() {
  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();

    img.onload = () => {
      const result = img.width === 1 && img.height === 1;
      window._webpSupport = result;
      resolve(result);
    };

    img.onerror = () => {
      window._webpSupport = false;
      resolve(false);
    };

    img.src = webpData;
  });
}

/**
 * Check for lossy WebP support
 * @returns {Promise<boolean>} True if lossy WebP is supported
 */
export async function supportsWebPLossy() {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
    const img = new Image();

    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Check for lossless WebP support
 * @returns {Promise<boolean>} True if lossless WebP is supported
 */
export async function supportsWebPLossless() {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const img = new Image();

    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Check for alpha channel WebP support
 * @returns {Promise<boolean>} True if alpha WebP is supported
 */
export async function supportsWebPAlpha() {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==';
    const img = new Image();

    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Check for animated WebP support
 * @returns {Promise<boolean>} True if animated WebP is supported
 */
export async function supportsWebPAnimation() {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA';
    const img = new Image();

    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Get comprehensive WebP support information
 * @returns {Promise<Object>} WebP support details
 */
export async function getWebPSupport() {
  const [basic, lossy, lossless, alpha, animation] = await Promise.all([
    supportsWebP(),
    supportsWebPLossy(),
    supportsWebPLossless(),
    supportsWebPAlpha(),
    supportsWebPAnimation()
  ]);

  return {
    supported: basic,
    lossy,
    lossless,
    alpha,
    animation
  };
}

/**
 * Add WebP support class to HTML element
 * Enables CSS-based fallbacks
 */
export async function addWebPClass() {
  if (typeof document === 'undefined') return;

  const hasWebP = await supportsWebP();
  const html = document.documentElement;

  if (hasWebP) {
    html.classList.add('webp');
    html.classList.remove('no-webp');
  } else {
    html.classList.add('no-webp');
    html.classList.remove('webp');
  }

  // Add detailed support classes
  const support = await getWebPSupport();

  if (support.lossy) html.classList.add('webp-lossy');
  if (support.lossless) html.classList.add('webp-lossless');
  if (support.alpha) html.classList.add('webp-alpha');
  if (support.animation) html.classList.add('webp-animation');

  return hasWebP;
}

/**
 * Get appropriate image source based on WebP support
 * @param {string} webpSrc - WebP image source
 * @param {string} fallbackSrc - Fallback image source
 * @returns {Promise<string>} Appropriate image source
 */
export async function getImageSource(webpSrc, fallbackSrc) {
  const hasWebP = await supportsWebP();
  return hasWebP ? webpSrc : fallbackSrc;
}

/**
 * Preload WebP image with fallback
 * @param {string} webpSrc - WebP image source
 * @param {string} fallbackSrc - Fallback image source
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export async function preloadImage(webpSrc, fallbackSrc) {
  const src = await getImageSource(webpSrc, fallbackSrc);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Update image sources based on WebP support
 * Useful for dynamically loaded content
 */
export async function updateImageSources(container = document) {
  const hasWebP = await supportsWebP();

  if (!hasWebP) {
    // Replace WebP sources with fallbacks
    const images = container.querySelectorAll('img[src*=".webp"], source[srcset*=".webp"]');

    images.forEach(element => {
      if (element.tagName === 'IMG' && element.dataset.fallback) {
        element.src = element.dataset.fallback;
      } else if (element.tagName === 'SOURCE' && element.dataset.fallback) {
        element.srcset = element.dataset.fallback;
      }
    });
  }
}

/**
 * Create a picture element with WebP support
 * @param {string} baseUrl - Base image URL without extension
 * @param {string} alt - Alt text
 * @param {Object} options - Options
 * @returns {HTMLPictureElement} Picture element
 */
export async function createPictureElement(baseUrl, alt, options = {}) {
  const hasWebP = await supportsWebP();
  const picture = document.createElement('picture');

  if (hasWebP && options.webp !== false) {
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.srcset = `${baseUrl}.webp`;
    if (options.srcset) {
      webpSource.srcset = options.srcset.webp;
    }
    picture.appendChild(webpSource);
  }

  const img = document.createElement('img');
  img.src = `${baseUrl}.${options.fallbackExt || 'jpg'}`;
  img.alt = alt;

  if (options.srcset && options.srcset.fallback) {
    img.srcset = options.srcset.fallback;
  }

  if (options.loading) {
    img.loading = options.loading;
  }

  if (options.class) {
    img.className = options.class;
  }

  picture.appendChild(img);
  return picture;
}

// Auto-detect and add class on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addWebPClass();
    });
  } else {
    // DOM already loaded
    addWebPClass();
  }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    supportsWebP,
    supportsWebPLossy,
    supportsWebPLossless,
    supportsWebPAlpha,
    supportsWebPAnimation,
    getWebPSupport,
    addWebPClass,
    getImageSource,
    preloadImage,
    updateImageSources,
    createPictureElement
  };
}
