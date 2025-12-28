/**
 * Responsive Image Renderer Utility
 * Integrates responsive images into entity rendering system
 * Works with entity-renderer-firebase.js
 */

import { ResponsiveImage } from '../components/responsive-image.js';

/**
 * Render a responsive entity image
 * @param {Object} entity - Entity data with image information
 * @param {Object} options - Rendering options
 * @returns {string} HTML for responsive image
 */
export function renderEntityImage(entity, options = {}) {
  if (!entity || !entity.image) {
    return renderPlaceholderImage(entity, options);
  }

  const imageConfig = {
    sizes: options.sizes || getEntityImageSizes(entity.type),
    loading: options.loading || (options.priority ? 'eager' : 'lazy'),
    decoding: 'async',
    width: options.width || null,
    height: options.height || null,
    class: `entity-image ${entity.type}-image ${options.class || ''}`.trim()
  };

  return ResponsiveImage.create(
    entity.image,
    entity.imageAlt || entity.name || 'Entity image',
    imageConfig
  );
}

/**
 * Get appropriate sizes attribute for entity type
 * @param {string} entityType - Type of entity
 * @returns {string} Sizes attribute value
 */
function getEntityImageSizes(entityType) {
  const sizeMap = {
    deity: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    hero: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    creature: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    place: '(max-width: 640px) 100vw, (max-width: 1280px) 66vw, 600px',
    item: '(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 300px',
    concept: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    default: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
  };

  return sizeMap[entityType] || sizeMap.default;
}

/**
 * Render placeholder image when no image is available
 * @param {Object} entity - Entity data
 * @param {Object} options - Rendering options
 * @returns {string} HTML for placeholder
 */
function renderPlaceholderImage(entity, options = {}) {
  const type = entity?.type || 'entity';
  const mythology = entity?.mythology || 'default';

  return `
    <div class="entity-image-placeholder ${type}-placeholder ${mythology}-placeholder ${options.class || ''}">
      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="var(--mythology-primary, #6b46c1)"/>
        <text x="200" y="150" text-anchor="middle" fill="white" font-size="48" opacity="0.3">
          ${entity?.name?.charAt(0) || '?'}
        </text>
      </svg>
    </div>
  `.trim();
}

/**
 * Render entity card with responsive image
 * @param {Object} entity - Entity data
 * @param {Object} options - Rendering options
 * @returns {string} HTML for entity card
 */
export function renderEntityCard(entity, options = {}) {
  const imageHtml = renderEntityImage(entity, {
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 300px',
    loading: 'lazy',
    class: 'entity-card-image',
    ...options.imageOptions
  });

  const mythology = entity.mythology || entity.mythologies?.[0] || 'default';

  return `
    <div class="entity-card ${entity.type}-card ${mythology}-card ${options.class || ''}" data-entity-id="${entity.id}">
      <div class="entity-card-image-wrapper">
        ${imageHtml}
      </div>
      <div class="entity-card-content">
        <h3 class="entity-card-title">${entity.name || 'Unknown'}</h3>
        ${entity.title ? `<p class="entity-card-subtitle">${entity.title}</p>` : ''}
        ${entity.description ? `<p class="entity-card-description">${truncateText(entity.description, 150)}</p>` : ''}
        ${renderEntityMeta(entity)}
      </div>
      ${options.showActions ? renderEntityActions(entity) : ''}
    </div>
  `.trim();
}

/**
 * Render entity metadata badges
 * @param {Object} entity - Entity data
 * @returns {string} HTML for metadata
 */
function renderEntityMeta(entity) {
  const badges = [];

  if (entity.mythology) {
    badges.push(`<span class="entity-badge mythology-badge">${entity.mythology}</span>`);
  }

  if (entity.type) {
    badges.push(`<span class="entity-badge type-badge">${entity.type}</span>`);
  }

  if (entity.domains && entity.domains.length > 0) {
    const domainBadges = entity.domains.slice(0, 3).map(domain =>
      `<span class="entity-badge domain-badge">${domain}</span>`
    ).join('');
    badges.push(domainBadges);
  }

  if (badges.length === 0) return '';

  return `<div class="entity-card-meta">${badges.join('')}</div>`;
}

/**
 * Render entity action buttons
 * @param {Object} entity - Entity data
 * @returns {string} HTML for actions
 */
function renderEntityActions(entity) {
  return `
    <div class="entity-card-actions">
      <a href="${entity.url || '#'}" class="entity-action-link">View Details</a>
    </div>
  `;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Render entity gallery with responsive images
 * @param {Array} images - Array of image objects
 * @param {Object} options - Rendering options
 * @returns {string} HTML for gallery
 */
export function renderEntityGallery(images, options = {}) {
  if (!images || images.length === 0) return '';

  const galleryHtml = images.map((image, index) => {
    const imageHtml = ResponsiveImage.create(
      image.url || image.src,
      image.alt || `Gallery image ${index + 1}`,
      {
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
        loading: index < 2 ? 'eager' : 'lazy',
        class: 'gallery-image'
      }
    );

    return `
      <div class="gallery-item" data-index="${index}">
        ${imageHtml}
        ${image.caption ? `<p class="gallery-caption">${image.caption}</p>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="entity-gallery ${options.class || ''}">
      ${galleryHtml}
    </div>
  `.trim();
}

/**
 * Render entity hero image (large banner)
 * @param {Object} entity - Entity data
 * @param {Object} options - Rendering options
 * @returns {string} HTML for hero image
 */
export function renderEntityHeroImage(entity, options = {}) {
  if (!entity || !entity.heroImage && !entity.image) {
    return '';
  }

  const imageUrl = entity.heroImage || entity.image;

  const imageHtml = ResponsiveImage.create(
    imageUrl,
    entity.name || 'Hero image',
    {
      sizes: '100vw',
      loading: 'eager', // Hero images should load immediately
      class: 'entity-hero-image',
      responsiveSizes: [640, 960, 1280, 1920, 2560]
    }
  );

  return `
    <div class="entity-hero ${options.class || ''}">
      ${imageHtml}
      ${entity.name ? `
        <div class="entity-hero-overlay">
          <h1 class="entity-hero-title">${entity.name}</h1>
          ${entity.title ? `<p class="entity-hero-subtitle">${entity.title}</p>` : ''}
        </div>
      ` : ''}
    </div>
  `.trim();
}

/**
 * Render entity thumbnail (small icon)
 * @param {Object} entity - Entity data
 * @param {Object} options - Rendering options
 * @returns {string} HTML for thumbnail
 */
export function renderEntityThumbnail(entity, options = {}) {
  if (!entity || !entity.thumbnail && !entity.image) {
    return renderPlaceholderImage(entity, { class: 'entity-thumbnail-placeholder' });
  }

  const imageUrl = entity.thumbnail || entity.image;

  return ResponsiveImage.create(
    imageUrl,
    entity.name || 'Thumbnail',
    {
      sizes: '(max-width: 640px) 80px, 64px',
      loading: 'lazy',
      class: 'entity-thumbnail',
      width: 64,
      height: 64,
      responsiveSizes: [64, 128, 256] // Smaller sizes for thumbnails
    }
  );
}

/**
 * Batch render entity cards with responsive images
 * @param {Array} entities - Array of entity objects
 * @param {Object} options - Rendering options
 * @returns {string} HTML for all cards
 */
export function renderEntityGrid(entities, options = {}) {
  if (!entities || entities.length === 0) {
    return '<p class="no-entities">No entities found</p>';
  }

  const cardsHtml = entities.map(entity =>
    renderEntityCard(entity, options)
  ).join('');

  return `
    <div class="entity-grid ${options.class || ''}">
      ${cardsHtml}
    </div>
  `.trim();
}

/**
 * Inject responsive image utilities into existing entity renderer
 * @param {Object} renderer - Entity renderer instance
 */
export function enhanceEntityRenderer(renderer) {
  // Store original methods
  const originalMethods = {
    renderImage: renderer.renderImage,
    renderCard: renderer.renderCard,
    renderGallery: renderer.renderGallery
  };

  // Replace with responsive versions
  renderer.renderImage = function(entity, options) {
    return renderEntityImage(entity, options);
  };

  renderer.renderCard = function(entity, options) {
    return renderEntityCard(entity, options);
  };

  renderer.renderGallery = function(images, options) {
    return renderEntityGallery(images, options);
  };

  // Add new methods
  renderer.renderHeroImage = function(entity, options) {
    return renderEntityHeroImage(entity, options);
  };

  renderer.renderThumbnail = function(entity, options) {
    return renderEntityThumbnail(entity, options);
  };

  renderer.renderGrid = function(entities, options) {
    return renderEntityGrid(entities, options);
  };

  // Store reference to original methods for restoration if needed
  renderer._originalMethods = originalMethods;

  return renderer;
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderEntityImage,
    renderEntityCard,
    renderEntityGallery,
    renderEntityHeroImage,
    renderEntityThumbnail,
    renderEntityGrid,
    enhanceEntityRenderer
  };
}
