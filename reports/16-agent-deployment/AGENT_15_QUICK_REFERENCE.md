# Image Optimization Quick Reference

## Quick Start Commands

```bash
# Test optimization (recommended first)
npm run optimize-images:dry-run

# Optimize all images
npm run optimize-images

# Build with automatic optimization
npm run build

# Verbose output for debugging
npm run optimize-images:verbose
```

---

## Component Import Examples

### Responsive Image Component

```javascript
// ES Module
import { ResponsiveImage } from './js/components/responsive-image.js';

// Create responsive image
const html = ResponsiveImage.create(
  'images/deity.jpg',
  'Deity Name',
  {
    sizes: '(max-width: 640px) 100vw, 50vw',
    loading: 'lazy'
  }
);
```

### Lazy Image Loader

```javascript
// ES Module
import { initLazyLoading } from './js/utils/lazy-image-loader.js';

// Auto-initializes on DOM ready
// Or manually initialize
const loader = initLazyLoading({
  threshold: 0.01,
  rootMargin: '50px'
});
```

### WebP Detection

```javascript
// ES Module
import { supportsWebP, addWebPClass } from './js/utils/webp-detection.js';

// Check WebP support
const hasWebP = await supportsWebP();

// Add class to <html> (auto-runs)
// Result: <html class="webp"> or <html class="no-webp">
```

### Entity Renderer Integration

```javascript
// ES Module
import { renderEntityImage, renderEntityCard } from './js/utils/responsive-image-renderer.js';

// Render entity image
const imageHtml = renderEntityImage(entity, {
  loading: 'lazy',
  sizes: '(max-width: 640px) 100vw, 50vw'
});

// Render complete entity card
const cardHtml = renderEntityCard(entity);
```

---

## HTML Template Examples

### Basic Responsive Image

```html
<picture>
  <source
    type="image/webp"
    srcset="image-320w.webp 320w, image-640w.webp 640w, image-960w.webp 960w"
    sizes="(max-width: 640px) 100vw, 50vw"
  />
  <source
    type="image/jpeg"
    srcset="image-320w.jpg 320w, image-640w.jpg 640w, image-960w.jpg 960w"
    sizes="(max-width: 640px) 100vw, 50vw"
  />
  <img src="image-640w.jpg" alt="Description" loading="lazy" decoding="async" />
</picture>
```

### Hero Image

```html
<picture>
  <source
    type="image/webp"
    srcset="hero-640w.webp 640w, hero-1280w.webp 1280w, hero-1920w.webp 1920w"
    sizes="100vw"
  />
  <source
    type="image/jpeg"
    srcset="hero-640w.jpg 640w, hero-1280w.jpg 1280w, hero-1920w.jpg 1920w"
    sizes="100vw"
  />
  <img src="hero-1280w.jpg" alt="Hero" loading="eager" decoding="async" />
</picture>
```

### Lazy Loaded Image

```html
<picture>
  <source type="image/webp" data-srcset="image-640w.webp 640w" />
  <source type="image/jpeg" data-srcset="image-640w.jpg 640w" />
  <img data-src="image-640w.jpg" alt="Lazy" loading="lazy" />
</picture>
```

---

## CSS Examples

### WebP Fallback

```css
/* For browsers with WebP support */
.webp .hero {
  background-image: url('hero.webp');
}

/* Fallback for browsers without WebP */
.no-webp .hero {
  background-image: url('hero.jpg');
}
```

### Responsive Image Styling

```css
picture {
  display: block;
  width: 100%;
}

picture img {
  width: 100%;
  height: auto;
  display: block;
}
```

### Lazy Loading States

```css
/* While loading */
img[loading="lazy"] {
  opacity: 0;
  transition: opacity 0.3s;
}

/* After loaded */
img.lazy-loaded {
  opacity: 1;
}

/* On error */
img.lazy-error {
  background: #f0f0f0;
}
```

---

## Configuration Reference

### Optimization Script Config

```javascript
{
  imageDirs: ['icons', 'dist/icons', 'assets', 'images'],
  responsiveSizes: [320, 640, 960, 1280, 1920],
  webpQuality: 85,
  jpegQuality: 85,
  pngCompressionLevel: 9,
  webpEffort: 6
}
```

### Responsive Image Sizes by Entity Type

```javascript
const sizes = {
  deity: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
  hero: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
  place: '(max-width: 640px) 100vw, (max-width: 1280px) 66vw, 600px',
  item: '(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 300px'
};
```

---

## Performance Metrics

### Expected Savings

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Image Size (WebP) | 100 KB | 30-40 KB | 60-70% |
| Initial Load | 184 KB | ~27 KB | 85% |
| Mobile Load Time | 3.7s | 1.8s | 51% |

### Browser Support

| Browser | WebP | Lazy Loading |
|---------|------|--------------|
| Chrome 76+ | Yes | Native |
| Firefox 75+ | Yes | Native |
| Safari 14+ | Yes | Native |
| Edge 79+ | Yes | Native |

---

## Troubleshooting

### Images Not Optimizing

```bash
# Check if images exist
ls -la icons/

# Run in verbose mode
npm run optimize-images:verbose

# Check for errors
npm run optimize-images 2>&1 | grep Error
```

### WebP Not Loading

```javascript
// Check WebP support in console
import { supportsWebP } from './js/utils/webp-detection.js';
console.log(await supportsWebP());
```

### Lazy Loading Not Working

```javascript
// Check Intersection Observer support
console.log('IntersectionObserver' in window);

// Check loader status
console.log(window.lazyImageLoader.getStats());
```

---

## Best Practices

### 1. Optimize Before Committing

```bash
npm run optimize-images:dry-run  # Preview
npm run optimize-images           # Execute
git add .
```

### 2. Use Appropriate Loading Strategies

```javascript
// Above-the-fold (eager)
loading: 'eager'

// Below-the-fold (lazy)
loading: 'lazy'

// Priority hint for important images
<link rel="preload" as="image" href="hero.webp">
```

### 3. Set Correct Sizes Attribute

```javascript
// Mobile-first approach
sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
```

### 4. Provide Alt Text

```javascript
ResponsiveImage.create(src, 'Descriptive alt text', options)
```

---

## Files Created

```
h:/Github/EyesOfAzrael/
├── js/
│   ├── components/
│   │   └── responsive-image.js
│   └── utils/
│       ├── lazy-image-loader.js
│       ├── webp-detection.js
│       └── responsive-image-renderer.js
├── scripts/
│   └── optimize-images.js
└── package.json (updated)
```

---

## Additional Resources

- [WebP Format Documentation](https://developers.google.com/speed/webp)
- [Responsive Images Guide](https://web.dev/responsive-images/)
- [Lazy Loading Guide](https://web.dev/lazy-loading-images/)
- [Picture Element Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
