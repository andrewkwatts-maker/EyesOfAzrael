# Production Features - Quick Reference Guide

Quick guide for developers on how to use the new production features.

---

## 🔧 SEO Manager

### Basic Usage
```javascript
// Initialize on page load
const seoManager = new SEOManager();

// Set page meta tags
seoManager.setPageMeta({
    title: 'Zeus - Greek Mythology',
    description: 'King of the gods in Greek mythology...',
    keywords: ['zeus', 'greek mythology', 'olympian gods'],
    image: 'https://example.com/zeus.jpg',
    type: 'article'
});
```

### For Deity Pages
```javascript
seoManager.init('deity', {
    title: 'Zeus - Greek Mythology',
    description: 'King of the Olympian gods...',
    entity: {
        name: 'Zeus',
        description: 'King of the gods...',
        image: 'https://example.com/zeus.jpg',
        sameAs: ['https://en.wikipedia.org/wiki/Zeus']
    }
});
```

### Add Breadcrumbs
```javascript
seoManager.addStructuredData(
    seoManager.generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Greek Mythology', url: '/mythos/greek/' },
        { name: 'Zeus', url: '/mythos/greek/deities/zeus.html' }
    ])
);
```

---

## 📱 Toast Notifications

### Show Toasts
```javascript
// Success
toast.success('Profile updated successfully!');

// Error
toast.error('Failed to save changes');

// Warning
toast.warning('Your session will expire soon');

// Info
toast.info('New content available');

// Custom options
toast.success('Saved!', {
    title: 'Success',
    duration: 3000,
    dismissible: true
});
```

### Manual Control
```javascript
// Show toast without auto-dismiss
const myToast = toast.info('Important message', {
    duration: 0, // Don't auto-dismiss
    dismissible: true
});

// Manually remove later
toast.remove(myToast);

// Clear all toasts
toast.clearAll();
```

---

## 🖼️ Image Optimization

### Lazy Loading Images
```html
<!-- Basic lazy loading -->
<img data-src="/images/deity.jpg" alt="Deity" loading="lazy">

<!-- With srcset for responsive images -->
<img
    data-src="/images/deity.jpg"
    data-srcset="/images/deity-320.jpg 320w,
                 /images/deity-640.jpg 640w,
                 /images/deity-960.jpg 960w"
    sizes="(max-width: 768px) 100vw, 50vw"
    alt="Deity"
    loading="lazy">
```

### JavaScript API
```javascript
// Create responsive image
const img = imageOptimizer.createResponsiveImage({
    src: '/images/deity.jpg',
    alt: 'Deity Name',
    sizes: '(max-width: 768px) 100vw, 50vw',
    widths: [320, 640, 960, 1280],
    lazy: true
});
document.querySelector('.container').appendChild(img);

// Add new images to lazy loading
imageOptimizer.addImages('img[data-src]');

// Preload critical images
imageOptimizer.preloadImages([
    '/images/hero.jpg',
    '/images/logo.png'
]);
```

---

## 🗺️ Sitemap Generation

### Generate Sitemap
```javascript
const sitemapGen = new SitemapGenerator();

// Generate complete sitemap
const xml = await sitemapGen.generateSitemap();

// Download sitemap
await sitemapGen.downloadSitemap();

// Save to Firebase Storage (admin only)
await sitemapGen.saveSitemap();
```

### Custom URL Addition
```javascript
// Add custom pages
const customUrls = [
    {
        loc: 'https://eyesofazrael.com/special-page',
        lastmod: '2025-12-15',
        changefreq: 'monthly',
        priority: 0.8
    }
];
```

---

## 🎨 Loading Skeletons

### HTML Usage
```html
<!-- Card skeleton -->
<div class="skeleton-card">
    <div class="skeleton-card-content">
        <div class="skeleton-title skeleton"></div>
        <div class="skeleton-text skeleton"></div>
        <div class="skeleton-text skeleton"></div>
        <div class="skeleton-text skeleton"></div>
    </div>
</div>

<!-- Image skeleton -->
<div class="skeleton-image skeleton"></div>

<!-- Avatar skeleton -->
<div class="skeleton-avatar skeleton"></div>
```

### Grid of Skeletons
```html
<div class="skeleton-grid">
    <div class="skeleton-card">...</div>
    <div class="skeleton-card">...</div>
    <div class="skeleton-card">...</div>
</div>
```

---

## ♿ Accessibility Features

### Skip to Main Content
```html
<a href="#main-content" class="skip-to-main">Skip to main content</a>
<main id="main-content">
    <!-- Content -->
</main>
```

### ARIA Labels
```html
<!-- Buttons -->
<button aria-label="Close modal">×</button>

<!-- Forms -->
<input type="text" id="name" aria-required="true">
<span id="name-error" role="alert">Please enter your name</span>

<!-- Live regions -->
<div aria-live="polite" role="status">
    Loading content...
</div>
```

### Focus Management
```javascript
// Focus first input in modal
modal.querySelector('input').focus();

// Trap focus in modal
modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
```

---

## 🔄 Service Worker

### Cache Management
```javascript
// Clear all caches
navigator.serviceWorker.controller.postMessage({
    type: 'CLEAR_CACHE'
});

// Cache specific URLs
navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_URLS',
    urls: ['/page1.html', '/page2.html']
});

// Force update service worker
navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING'
});
```

### Check Online Status
```javascript
if (navigator.onLine) {
    console.log('Online');
} else {
    console.log('Offline');
}

// Listen for changes
window.addEventListener('online', () => {
    toast.success('Connection restored!');
});

window.addEventListener('offline', () => {
    toast.warning('You are offline');
});
```

---

## 🎭 UI Components

### Progress Bar
```html
<div class="progress-bar">
    <div class="progress-fill" style="width: 60%"></div>
</div>

<!-- Indeterminate -->
<div class="progress-bar">
    <div class="progress-fill indeterminate"></div>
</div>
```

### Badges
```html
<span class="badge">New</span>
<span class="badge success">Complete</span>
<span class="badge error">Error</span>
<span class="badge warning">Warning</span>
```

### Empty States
```html
<div class="empty-state">
    <div class="empty-state-icon">📭</div>
    <h3 class="empty-state-title">No items found</h3>
    <p class="empty-state-description">
        Get started by creating your first item.
    </p>
    <div class="empty-state-action">
        <button class="btn btn-primary">Create Item</button>
    </div>
</div>
```

### Spinners
```html
<!-- Small spinner -->
<div class="loading-spinner"></div>

<!-- Large spinner -->
<div class="loading-spinner loading-spinner-large"></div>

<!-- Loading dots -->
<div class="loading-dots">
    <span></span>
    <span></span>
    <span></span>
</div>
```

---

## 🔐 Security Headers

Already configured in `firebase.json`:
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Referrer-Policy
- Permissions-Policy

No additional setup needed!

---

## 📊 Performance Monitoring

### Check Performance
```javascript
// Monitor page load
window.addEventListener('load', () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log('Page load time:', pageLoadTime, 'ms');
});

// Monitor Firebase performance
// (Setup Firebase Performance Monitoring in console)
```

### Lighthouse CLI
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://eyesofazrael.com --view

# Mobile audit
lighthouse https://eyesofazrael.com --preset=mobile --view
```

---

## 🚀 Deployment

### Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Preview before deploying
firebase hosting:channel:deploy preview

# Deploy with message
firebase deploy -m "Phase 6 production polish complete"
```

### Verify Deployment
```bash
# Check hosting URL
firebase hosting:sites:list

# View deployment history
firebase hosting:deployments:list
```

---

## 📱 PWA Installation

### Test PWA
1. Open Chrome DevTools
2. Go to Application tab
3. Check "Manifest" section
4. Verify all icons load
5. Check Service Worker status

### Install PWA
- Desktop: Click install icon in address bar
- Mobile: Add to Home Screen option
- iOS: Share > Add to Home Screen

---

## 🧪 Testing Checklist

### Accessibility
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Navigate with keyboard only
- [ ] Check color contrast with DevTools
- [ ] Verify skip links work
- [ ] Test with Lighthouse accessibility audit

### Performance
- [ ] Run Lighthouse audit (95+ score)
- [ ] Test on 3G connection
- [ ] Check service worker caching
- [ ] Verify lazy loading works
- [ ] Test offline mode

### SEO
- [ ] Check meta tags in source
- [ ] Verify structured data with Google's tool
- [ ] Test robots.txt
- [ ] Generate and check sitemap
- [ ] Test social media sharing

### PWA
- [ ] Install app on desktop
- [ ] Install app on mobile
- [ ] Test offline functionality
- [ ] Check app manifest
- [ ] Verify service worker updates

---

## 📞 Support

For issues or questions:
1. Check `PRODUCTION_READY_CHECKLIST.md`
2. Review `PHASE_6_PRODUCTION_POLISH_COMPLETE.md`
3. Consult Firebase documentation
4. Check browser console for errors

---

*Quick Reference Guide - Eyes of Azrael Production Features*
*Last Updated: December 15, 2025*
