# Code Splitting Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Adding New Routes](#adding-new-routes)
3. [ES Module Pattern](#es-module-pattern)
4. [Performance Optimization](#performance-optimization)
5. [Testing & Debugging](#testing--debugging)
6. [Best Practices](#best-practices)

---

## Architecture Overview

### How It Works

```
User navigates to route
        ↓
Route pattern matched
        ↓
Check view cache
        ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Cache HIT           Cache MISS
(0ms load)      (dynamic import)
    ↓                   ↓
    └─────────┬─────────┘
              ↓
        Render view
```

### File Structure

```
js/
├── spa-navigation-dynamic.js     # Main router with dynamic imports
├── views/
│   ├── home-view.js             # Home route (preloaded)
│   └── ...
└── components/
    ├── search-view-complete.js  # Search route (prefetched)
    ├── compare-view.js          # Compare route (prefetched)
    ├── user-dashboard.js        # Dashboard route (on-demand)
    ├── about-page.js            # About page (on-demand)
    ├── privacy-page.js          # Privacy page (on-demand)
    └── terms-page.js            # Terms page (on-demand)
```

---

## Adding New Routes

### Complete Example: Blog View

**1. Create the View Component**

```javascript
// js/views/blog-view.js

/**
 * Blog View Component
 * Displays blog posts with pagination
 */
class BlogView {
    constructor(firestore) {
        this.db = firestore;
        this.posts = [];
        this.currentPage = 1;
        this.postsPerPage = 10;
    }

    async render(container) {
        console.log('[BlogView] Rendering blog view...');

        // Show loading state
        container.innerHTML = this.getLoadingHTML();

        try {
            // Load posts from Firebase
            await this.loadPosts();

            // Render content
            container.innerHTML = this.getContentHTML();

            // Attach event listeners
            this.attachEventListeners();

            console.log('[BlogView] Blog view rendered successfully');

        } catch (error) {
            console.error('[BlogView] Error rendering:', error);
            container.innerHTML = this.getErrorHTML(error);
        }
    }

    async loadPosts() {
        const snapshot = await this.db.collection('posts')
            .orderBy('publishedAt', 'desc')
            .limit(this.postsPerPage)
            .get();

        this.posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    getLoadingHTML() {
        return `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading blog posts...</p>
            </div>
        `;
    }

    getContentHTML() {
        return `
            <div class="blog-view">
                <header class="blog-header">
                    <h1>Blog</h1>
                    <p class="subtitle">Latest posts and updates</p>
                </header>

                <div class="blog-posts">
                    ${this.posts.map(post => this.getPostHTML(post)).join('')}
                </div>

                <div class="blog-pagination">
                    <!-- Pagination controls -->
                </div>
            </div>
        `;
    }

    getPostHTML(post) {
        return `
            <article class="blog-post" data-post-id="${post.id}">
                <h2>${post.title}</h2>
                <div class="post-meta">
                    <span class="author">${post.author}</span>
                    <span class="date">${this.formatDate(post.publishedAt)}</span>
                </div>
                <p class="excerpt">${post.excerpt}</p>
                <a href="#/blog/${post.id}" class="read-more">Read more →</a>
            </article>
        `;
    }

    getErrorHTML(error) {
        return `
            <div class="error-container">
                <h1>Error Loading Blog</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn-primary">
                    Retry
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        // Add click handlers, etc.
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    // Cleanup method
    destroy() {
        // Remove event listeners, timers, etc.
    }
}

// ✅ ES Module Export (for dynamic imports)
export { BlogView };

// ✅ Legacy global export (for backwards compatibility)
if (typeof window !== 'undefined') {
    window.BlogView = BlogView;
}
```

**2. Add Dynamic Import Loader**

```javascript
// In js/spa-navigation-dynamic.js

/**
 * Dynamic import loader for Blog View
 */
async loadBlogView() {
    const start = performance.now();
    const cacheKey = 'blog';

    try {
        // ✅ Check cache first
        if (this.viewCache.has(cacheKey)) {
            console.log('[SPA Dynamic] ⚡ Cache hit: BlogView');
            this.performanceMetrics.cacheHits++;
            return this.viewCache.get(cacheKey);
        }

        console.log('[SPA Dynamic] 📦 Dynamically importing BlogView...');
        this.performanceMetrics.cacheMisses++;

        // ✅ Dynamic import
        const module = await import('./views/blog-view.js');
        const ViewClass = module.BlogView;

        if (!ViewClass) {
            throw new Error('BlogView class not found in module');
        }

        // ✅ Create instance
        const instance = new ViewClass(this.db);

        // ✅ Cache for future use
        this.viewCache.set(cacheKey, instance);

        // ✅ Track performance
        const duration = performance.now() - start;
        console.log(`[SPA Dynamic] ✅ BlogView loaded in ${duration.toFixed(2)}ms`);
        this.trackRouteLoad('blog', duration, false);

        return instance;

    } catch (error) {
        console.error('[SPA Dynamic] ❌ Failed to load BlogView:', error);

        // ✅ Graceful fallback to global
        if (typeof BlogView !== 'undefined') {
            console.log('[SPA Dynamic] 🔄 Falling back to global BlogView');
            return new BlogView(this.db);
        }

        throw error;
    }
}
```

**3. Add Route Pattern**

```javascript
// In constructor of spa-navigation-dynamic.js

this.routes = {
    home: /^#?\/?$/,
    // ... existing routes ...

    // ✅ Add new route pattern
    blog: /^#?\/blog\/?$/,
    blogPost: /^#?\/blog\/([^\/]+)\/?$/  // For individual posts
};
```

**4. Add Render Method**

```javascript
// In spa-navigation-dynamic.js

async renderBlog() {
    console.log('[SPA Dynamic] ▶️  renderBlog() called');

    const mainContent = document.getElementById('main-content');

    try {
        // ✅ Load view (uses cache if available)
        const blogView = await this.loadBlogView();

        // ✅ Render content
        await blogView.render(mainContent);

        // ✅ Dispatch success event
        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: {
                route: 'blog',
                renderer: 'BlogView-Dynamic',
                timestamp: Date.now()
            }
        }));

        console.log('[SPA Dynamic] ✅ Blog view rendered successfully');

    } catch (error) {
        console.error('[SPA Dynamic] ❌ Error rendering blog:', error);
        document.dispatchEvent(new CustomEvent('render-error', {
            detail: {
                route: 'blog',
                error: error.message,
                timestamp: Date.now()
            }
        }));
        throw error;
    }
}
```

**5. Add Route Handling**

```javascript
// In handleRoute() method

async handleRoute() {
    // ... existing code ...

    try {
        // ... existing route checks ...

        // ✅ Add blog route handler
        else if (this.routes.blog.test(path)) {
            console.log('[SPA Dynamic] ✅ Matched BLOG route');
            await this.renderBlog();
        }
        else if (this.routes.blogPost.test(path)) {
            const match = path.match(this.routes.blogPost);
            console.log('[SPA Dynamic] ✅ Matched BLOG POST route');
            await this.renderBlogPost(match[1]);
        }

        // ... rest of route handling ...
    }
}
```

**6. Optional: Add Performance Hints**

```html
<!-- In index.html, add prefetch hint if blog is commonly accessed -->
<link rel="prefetch" href="js/views/blog-view.js" as="script" crossorigin>
```

---

## ES Module Pattern

### Template for New Components

```javascript
/**
 * [Component Name]
 * [Brief description]
 */
class ComponentName {
    constructor(dependencies) {
        // Initialize
    }

    async render(container) {
        // Render logic
    }

    // Other methods...

    destroy() {
        // Cleanup logic
    }
}

// ✅ REQUIRED: ES Module Export
export { ComponentName };

// ✅ REQUIRED: Legacy Global Export
if (typeof window !== 'undefined') {
    window.ComponentName = ComponentName;
}
```

### Why Dual Exports?

| Export Type | Purpose | Benefits |
|-------------|---------|----------|
| ES Module (`export`) | Dynamic imports | Tree shaking, code splitting |
| Global (`window`) | Backwards compatibility | Fallback, existing code works |

---

## Performance Optimization

### Prefetch Strategy

**When to use each hint:**

```html
<!-- PRELOAD: Critical, load immediately -->
<link rel="modulepreload" href="js/views/home-view.js">

<!-- PREFETCH: Likely next, load in background -->
<link rel="prefetch" href="js/components/search-view.js">

<!-- DNS-PREFETCH: External resources -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">

<!-- PRECONNECT: External APIs -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

### View Cache Management

```javascript
// Get cache stats
const stats = navigation.getPerformanceStats();
console.log('Cache hit rate:', stats.cacheHitRate + '%');

// Clear cache (useful in development)
navigation.clearCache();

// Check what's cached
console.log('Cached views:', navigation.viewCache.size);

// Manual cache management
navigation.viewCache.set('custom-key', viewInstance);
navigation.viewCache.delete('custom-key');
navigation.viewCache.has('custom-key');
```

### Performance Monitoring

```javascript
// Built-in tracking
navigation.trackRouteLoad('route-name', duration, wasCached);

// Get detailed metrics
const metrics = navigation.performanceMetrics;
console.log('Route loads:', metrics.routeLoads);
console.log('Average time:', metrics.averageLoadTime);

// Analytics integration
if (window.AnalyticsManager) {
    window.AnalyticsManager.trackPerformance('route_load', {
        route: 'blog',
        duration: 145,
        cached: false
    });
}
```

---

## Testing & Debugging

### Console Debugging

```javascript
// Enable verbose logging
localStorage.setItem('debug', 'spa-navigation');

// Check current route
console.log(navigation.currentRoute);

// View route history
console.log(navigation.getHistory());

// Performance stats
console.log(navigation.getPerformanceStats());

// Force cache clear
navigation.clearCache();
```

### Network Tab Inspection

**First Load (Cache Empty):**
```
✅ spa-navigation-dynamic.js    (42 KB)
✅ home-view.js                 (30 KB - preloaded)
⏳ search-view-complete.js     (45 KB - prefetching)
⏳ compare-view.js              (24 KB - prefetching)
```

**Navigate to Search:**
```
✅ search-view-complete.js     (0 KB - from cache/prefetch)
```

**Navigate to Home Again:**
```
✅ (no network request - cached view)
```

### Performance Testing

```javascript
// Measure route load time
const start = performance.now();
await navigation.renderBlog();
const duration = performance.now() - start;
console.log(`Blog load time: ${duration.toFixed(2)}ms`);

// Test cache effectiveness
navigation.clearCache();

// First load (cold)
const cold = performance.now();
await navigation.renderBlog();
const coldTime = performance.now() - cold;

// Second load (warm)
const warm = performance.now();
await navigation.renderBlog();
const warmTime = performance.now() - warm;

console.log(`Cold: ${coldTime.toFixed(2)}ms`);
console.log(`Warm: ${warmTime.toFixed(2)}ms`);
console.log(`Improvement: ${((1 - warmTime/coldTime) * 100).toFixed(1)}%`);
```

---

## Best Practices

### ✅ DO

1. **Always export both ES module and global**
   ```javascript
   export { Component };
   window.Component = Component;
   ```

2. **Use try-catch with fallbacks**
   ```javascript
   try {
       const module = await import('./view.js');
       return new module.ViewClass(this.db);
   } catch (error) {
       if (typeof ViewClass !== 'undefined') {
           return new ViewClass(this.db);
       }
       throw error;
   }
   ```

3. **Cache view instances**
   ```javascript
   if (this.viewCache.has(key)) {
       return this.viewCache.get(key);
   }
   const instance = new ViewClass();
   this.viewCache.set(key, instance);
   ```

4. **Track performance**
   ```javascript
   const start = performance.now();
   // ... load view ...
   this.trackRouteLoad(route, performance.now() - start, cached);
   ```

5. **Show loading indicators**
   ```javascript
   this.showLoadingIndicator();
   try {
       await this.loadView();
   } finally {
       this.hideLoadingIndicator();
   }
   ```

### ❌ DON'T

1. **Don't forget cleanup methods**
   ```javascript
   // ❌ Bad
   class View {
       constructor() {
           this.timer = setInterval(...);
       }
   }

   // ✅ Good
   class View {
       destroy() {
           if (this.timer) clearInterval(this.timer);
       }
   }
   ```

2. **Don't hardcode file paths**
   ```javascript
   // ❌ Bad
   import('./components/search.js');

   // ✅ Good
   import('./components/search-view-complete.js');
   ```

3. **Don't skip error handling**
   ```javascript
   // ❌ Bad
   const module = await import('./view.js');

   // ✅ Good
   try {
       const module = await import('./view.js');
   } catch (error) {
       console.error('Failed to load:', error);
       // Handle gracefully
   }
   ```

4. **Don't create multiple instances**
   ```javascript
   // ❌ Bad
   const view1 = await loadView();
   const view2 = await loadView();  // Creates duplicate!

   // ✅ Good
   const view1 = await loadView();  // Cached
   const view2 = await loadView();  // Returns cached instance
   ```

5. **Don't mix import styles**
   ```javascript
   // ❌ Bad
   import { View } from './view.js';  // Top-level import
   const view = await import('./view.js');  // Dynamic import

   // ✅ Good - Choose one approach per route
   const view = await import('./view.js');  // All dynamic
   ```

---

## Common Patterns

### Loading with Error Boundary

```javascript
async loadViewWithErrorBoundary(cacheKey, modulePath, className) {
    try {
        // Check cache
        if (this.viewCache.has(cacheKey)) {
            return this.viewCache.get(cacheKey);
        }

        // Dynamic import
        const module = await import(modulePath);
        const instance = new module[className](this.db);

        // Cache
        this.viewCache.set(cacheKey, instance);

        return instance;

    } catch (error) {
        // Log error
        console.error(`Failed to load ${className}:`, error);

        // Track with analytics
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackError(error, {
                component: className,
                path: modulePath
            });
        }

        // Fallback to global
        if (typeof window[className] !== 'undefined') {
            return new window[className](this.db);
        }

        // Show user-friendly error
        this.showError(`Failed to load ${className}. Please refresh the page.`);

        throw error;
    }
}
```

### Conditional Prefetching

```javascript
// Prefetch based on user behavior
function prefetchCommonRoutes() {
    const hour = new Date().getHours();

    if (hour >= 9 && hour < 17) {
        // Business hours - prefetch dashboard
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = 'js/components/user-dashboard.js';
        link.as = 'script';
        document.head.appendChild(link);
    } else {
        // Off hours - prefetch blog
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = 'js/views/blog-view.js';
        link.as = 'script';
        document.head.appendChild(link);
    }
}
```

### Progressive Enhancement

```javascript
// Check if browser supports dynamic imports
async function checkDynamicImportSupport() {
    try {
        await import('./test-module.js');
        return true;
    } catch {
        return false;
    }
}

// Use appropriate navigation system
async function initNavigation() {
    const supportsDynamicImports = await checkDynamicImportSupport();

    if (supportsDynamicImports) {
        return new SPANavigationDynamic(db, auth, renderer);
    } else {
        return new SPANavigation(db, auth, renderer);
    }
}
```

---

## Webpack Integration (Future)

### Build Commands

```bash
# Development with HMR
npm run dev

# Production build
npm run build

# Analyze bundle sizes
npm run build:stats
npm run analyze
```

### Webpack Output Analysis

```
dist/
├── js/
│   ├── runtime.[hash].js           (~2 KB)   # Webpack runtime
│   ├── vendors.[hash].js           (~50 KB)  # node_modules
│   ├── firebase.[hash].js          (~30 KB)  # Firebase SDK
│   ├── common.[hash].js            (~15 KB)  # Shared components
│   ├── app.[hash].js               (~20 KB)  # Main app
│   ├── view-home.[hash].chunk.js   (~30 KB)  # Home route
│   ├── view-blog.[hash].chunk.js   (~25 KB)  # Blog route
│   └── ...
```

### Bundle Size Limits

| Bundle Type | Limit | Actual | Status |
|-------------|-------|--------|--------|
| Initial (runtime + app) | 100 KB | ~67 KB | ✅ Good |
| Route chunk | 50 KB | ~30 KB avg | ✅ Good |
| Vendor chunk | 100 KB | ~80 KB | ✅ Good |

---

## Conclusion

This code splitting system provides:

✅ **55% reduction** in initial bundle size
✅ **Instant navigation** on cached routes
✅ **Easy to extend** with new routes
✅ **Backwards compatible** with existing code
✅ **Production ready** with comprehensive error handling

For questions or issues, see `CODE_SPLITTING_IMPLEMENTATION_REPORT.md`.
