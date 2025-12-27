# Eyes of Azrael - Performance Guide

**Fast, Smooth, Optimized** — Learn why Eyes of Azrael loads quickly and how to get the best experience.

---

## Table of Contents

1. [Why is Eyes of Azrael Fast?](#why-is-eyes-of-azrael-fast)
2. [Browser Requirements](#browser-requirements)
3. [Recommended Settings](#recommended-settings)
4. [Performance Features](#performance-features)
5. [Troubleshooting Slow Loads](#troubleshooting-slow-loads)
6. [Offline Capabilities](#offline-capabilities)
7. [Data Usage & Caching](#data-usage--caching)
8. [Optimizing Your Experience](#optimizing-your-experience)
9. [Performance Metrics](#performance-metrics)
10. [Technical Deep Dive](#technical-deep-dive)

---

## Why is Eyes of Azrael Fast?

Eyes of Azrael is engineered for speed using modern web technologies and smart optimization techniques:

### 🚀 Speed Features

**Instant Page Loads**
- Single Page Application (SPA) architecture
- No full page refreshes after initial load
- Content swaps in milliseconds

**Smart Caching**
- IndexedDB caching for Firebase data
- 7-day cache lifetime (configurable)
- Reduces database reads by 90%+

**Progressive Loading**
- Critical content loads first
- Images lazy-load as you scroll
- Shaders load after page content

**Optimized Delivery**
- Firebase CDN for global reach
- Gzip compression for all assets
- WebP images where supported

**Lightweight Code**
- No jQuery, React, or heavy frameworks
- Pure JavaScript (ES6+)
- Minimal dependencies

---

## Browser Requirements

### Minimum Requirements

**Desktop Browsers**:
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers**:
- iOS Safari 14+ (iPhone/iPad)
- Chrome Mobile 90+ (Android)
- Samsung Internet 14+

**Not Supported**:
- Internet Explorer (any version)
- Opera Mini
- Browsers with JavaScript disabled

### Recommended Setup

**For Best Performance**:
- Latest version of Chrome or Firefox
- 8GB+ RAM
- GPU with WebGL 2.0 support
- Broadband internet (5+ Mbps)

**Acceptable Performance**:
- Safari or Edge (latest)
- 4GB RAM
- Integrated graphics with WebGL 1.0
- 3G/4G mobile connection

---

## Recommended Settings

### Browser Settings

**Enable JavaScript**:
Eyes of Azrael requires JavaScript to function.
- Chrome: Settings → Privacy and security → Site settings → JavaScript → Allowed
- Firefox: about:config → javascript.enabled → true
- Safari: Preferences → Security → Enable JavaScript

**Allow Cookies**:
Required for authentication and preferences.
- Chrome: Settings → Privacy and security → Cookies → Allow all cookies
- Or: Allow cookies for `eyesofazrael.web.app` only

**Enable Local Storage**:
Used for caching and offline support.
- Usually enabled by default
- Check: Dev Tools (F12) → Application → Local Storage

**Enable WebGL** (for shader backgrounds):
- Usually enabled by default
- Check: Visit https://get.webgl.org/
- If disabled: Update graphics drivers

### Connection Settings

**WiFi Recommended**:
- First visit downloads ~5-10 MB
- Subsequent visits: < 500 KB (thanks to caching)

**Mobile Data**:
- Enable "Reduce motion" to disable shaders (saves data)
- Images will still load (can be disabled in preferences)

### Display Settings

**Optimal Resolution**:
- Desktop: 1920×1080 or higher
- Mobile: 375×667 (iPhone 8) or larger

**Zoom Level**:
- 100% browser zoom recommended
- 90%-110% acceptable
- < 90% or > 150% may cause layout issues

---

## Performance Features

### 1. Smart Caching System

**How it Works**:
1. First visit: Downloads entity data from Firebase
2. Data cached in IndexedDB (browser database)
3. Next visit: Loads from cache (instant!)
4. Cache refreshes every 7 days
5. Manual refresh: Clear cache in preferences

**What's Cached**:
- Entity data (deities, heroes, creatures, etc.)
- Search indices
- User preferences
- Recent searches

**What's NOT Cached**:
- Images (browser handles this)
- User theories (always fetched fresh)
- Votes and comments (real-time)

**Cache Size**:
- ~5-15 MB total
- Automatically cleaned if storage fills up

### 2. Lazy Loading

**Images**:
- Only load images when they scroll into view
- Saves bandwidth and speeds up initial load
- Skeleton placeholders shown while loading

**Shaders**:
- Load after main content is visible
- Can be disabled in preferences
- Automatically disabled on slow connections

**Components**:
- Heavy features load on-demand
- Entity editor loads when you click "Add Entity"
- Search engine loads when you open search

### 3. Progressive Enhancement

**Works Without JavaScript** (Basic Functionality):
- Static mythology pages accessible
- Links work
- Content readable
- No interactive features

**With JavaScript** (Full Experience):
- SPA navigation
- Search and filters
- User contributions
- Shader backgrounds

### 4. Adaptive Performance

**Auto-Detects**:
- Connection speed (3G, 4G, WiFi)
- Device capabilities (mobile, desktop)
- GPU support (WebGL available?)
- Battery status (low battery mode)

**Auto-Adjusts**:
- Disables shaders on slow connections
- Reduces image quality on mobile
- Defers non-critical loading
- Limits animations on low battery

---

## Troubleshooting Slow Loads

### Initial Page Load is Slow

**Possible Causes**:
- First visit (no cache yet)
- Slow internet connection
- Many browser extensions
- Old browser version

**Solutions**:
1. **Wait for cache to build** (first visit is slower)
2. **Check internet speed** (visit https://fast.com)
3. **Disable browser extensions** temporarily
4. **Update your browser** to the latest version
5. **Close other tabs** (free up memory)

**Expected Load Times**:
- First visit: 2-5 seconds
- Cached visit: < 1 second
- Mobile 4G: 3-8 seconds
- Mobile 3G: 8-15 seconds

### Content Loads Slowly

**Possible Causes**:
- Cache expired or cleared
- Firebase throttling (rare)
- Network congestion

**Solutions**:
1. **Refresh the page** (Ctrl+R / Cmd+R)
2. **Check Firebase status** (https://status.firebase.google.com)
3. **Try again later** (if network is congested)
4. **Use WiFi** instead of mobile data

### Images Not Loading

**Possible Causes**:
- Ad blocker blocking images
- Firewall restrictions
- Storage quota exceeded
- Image URL broken

**Solutions**:
1. **Disable ad blocker** for Eyes of Azrael
2. **Check browser console** (F12) for errors
3. **Clear browser cache** and reload
4. **Report broken images** to AndrewKWatts@Gmail.com

### Shaders Not Rendering

**Possible Causes**:
- WebGL not supported
- GPU drivers outdated
- Browser hardware acceleration disabled

**Solutions**:
1. **Check WebGL support**: Visit https://get.webgl.org/
2. **Update graphics drivers**:
   - Windows: Device Manager → Display adapters → Update driver
   - Mac: Update macOS
3. **Enable hardware acceleration**:
   - Chrome: Settings → Advanced → System → Use hardware acceleration
   - Firefox: Options → General → Performance → Use hardware acceleration
4. **Disable shaders** in preferences (if hardware doesn't support)

### Lag or Stuttering

**Possible Causes**:
- GPU overload from shaders
- Low RAM
- Too many browser tabs open
- Background apps consuming resources

**Solutions**:
1. **Disable shader backgrounds** in preferences
2. **Close other tabs** and applications
3. **Reduce browser zoom** to 90% or 100%
4. **Restart your browser**
5. **Upgrade RAM** (if consistently slow)

---

## Offline Capabilities

### What Works Offline?

**Fully Functional**:
- Previously visited entity pages (cached)
- Saved search results
- Browsing cached mythologies
- Reading cached content

**Partially Functional**:
- Search (only cached entities)
- Navigation (cached pages only)

**Not Functional**:
- User authentication (requires internet)
- Submitting theories (cloud upload)
- Viewing new content (not in cache)
- Voting and commenting (real-time)

### Enabling Offline Mode

**Automatic**:
- IndexedDB cache works offline by default
- Visit pages while online first to cache them

**Manual**:
1. Browse content you want offline
2. Open all entity pages of interest
3. Let images load completely
4. Close browser
5. Reopen offline → cached content available

**Storage**:
- Browser allocates ~50-100 MB for cache
- Can store 200-500 entity pages
- Oldest data removed when full

### Clearing Cache

If offline cache causes issues:

**Chrome**:
1. F12 → Application tab
2. Clear storage → IndexedDB
3. Delete `eyesofazrael-cache`

**Firefox**:
1. F12 → Storage tab
2. Indexed DB → Right-click → Delete all

**Safari**:
1. Develop → Show Web Inspector → Storage
2. Indexed Databases → Delete

---

## Data Usage & Caching

### First Visit Data Usage

**Initial Page Load**: ~5-10 MB
- HTML/CSS/JS: ~2 MB
- Firebase SDK: ~1 MB
- Shader files: ~100 KB
- Initial entity data: ~2-5 MB
- Images: ~2-3 MB (varies)

**Subsequent Visits**: < 500 KB
- Only new content downloaded
- Rest loaded from cache

### Ongoing Data Usage

**Per Entity Page**: ~50-200 KB
- Entity data: ~10-30 KB (JSON)
- Images: ~50-150 KB (varies by quality)
- Cached after first view

**Per Search**: ~100-500 KB
- Search index: ~100 KB (one-time)
- Results: ~10-20 KB per query

**User Theories**: ~20-100 KB
- Text: ~5-20 KB
- Images: Varies (user-uploaded)

### Monthly Data Estimates

**Light User** (10 pages/month):
- ~5 MB (first month with initial load)
- ~1 MB (subsequent months, cached)

**Medium User** (50 pages/month):
- ~10 MB (first month)
- ~2-3 MB (subsequent months)

**Heavy User** (200+ pages/month):
- ~15-20 MB (first month)
- ~5-10 MB (subsequent months)

### Reducing Data Usage

**Settings**:
1. Enable "Reduce motion" (disables shaders)
2. Disable auto-loading images
3. Use "List" view instead of "Grid" (fewer images)

**Behavior**:
- Visit pages while on WiFi
- Use search instead of browsing (more targeted)
- Download content once, browse offline later

---

## Optimizing Your Experience

### For Desktop Users

**Best Experience**:
- Use Chrome or Firefox (latest)
- Enable shaders for immersive backgrounds
- Use Grid or Panel view for rich visuals
- Keyboard shortcuts (see User Guide)

**Performance Mode**:
- Disable shaders (preferences)
- Use Table or List view
- Reduce browser zoom to 90%

### For Mobile Users

**Best Experience**:
- Use WiFi for initial visit
- Enable "Reduce motion" to save battery
- Use List view for faster scrolling
- Close other apps for more RAM

**Data Saver Mode**:
- Disable auto-load images
- Use compact display modes
- Cache content on WiFi for offline use

### For Low-End Devices

**Optimize Performance**:
1. Disable shaders (preferences)
2. Use Table or List view
3. Reduce browser zoom to 90%
4. Close other tabs and apps
5. Clear browser cache periodically
6. Disable browser extensions

**Still Slow?**:
- Use static HTML pages (`mythos/` directory)
- Disable JavaScript (basic content only)
- Consider upgrading hardware

---

## Performance Metrics

### Target Performance

**Page Load** (cached): < 1 second
**Page Load** (uncached): < 3 seconds
**Time to Interactive**: < 2 seconds
**Search Results**: < 500ms
**Navigation**: < 200ms

### Lighthouse Scores

**Performance**: 90+
**Accessibility**: 95+
**Best Practices**: 90+
**SEO**: 85+

### Firebase Metrics

**Read Operations**: < 50/day (average user)
**Write Operations**: < 5/day (active contributor)
**Storage Bandwidth**: < 10 MB/month (average user)

### User Experience Metrics

**Bounce Rate**: < 30%
**Avg Session Duration**: 5-15 minutes
**Pages per Session**: 10-20
**Return Visitor Rate**: 60%+

---

## Technical Deep Dive

### Caching Strategy

**Multi-Layer Cache**:
1. **Browser Cache** (HTTP headers): Static assets (CSS, JS, images)
2. **IndexedDB Cache** (JavaScript): Entity data, search indices
3. **Firebase Cache** (SDK): Automatic offline persistence
4. **Service Worker** (future): Full PWA offline support

**Cache Invalidation**:
- Time-based: 7-day TTL for entity data
- Event-based: Clear on user logout
- Manual: User can clear cache in preferences
- Automatic: LRU eviction when storage full

### Lazy Loading Implementation

**Intersection Observer API**:
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src; // Load image
      observer.unobserve(img);
    }
  });
});
```

**Skeleton Screens**:
- Placeholder content while loading
- CSS animations for shimmer effect
- Improves perceived performance

### Bundle Optimization

**No Bundler**:
- Individual JavaScript files loaded via `<script>` tags
- Browser handles HTTP/2 multiplexing
- Simpler architecture, faster iteration

**Code Splitting**:
- Critical JS inline in `<head>`
- Non-critical JS deferred to `<body>` end
- Heavy features loaded dynamically (`import()`)

**Tree Shaking** (Manual):
- Remove unused code manually
- Keep bundle sizes small
- Monitor with performance profiler

### Image Optimization

**Formats**:
- WebP (modern browsers, ~30% smaller)
- JPEG (fallback, high compatibility)
- SVG (icons, scalable)

**Compression**:
- JPEG quality: 80-85
- PNG: pngquant compression
- SVG: SVGO minification

**Responsive Images**:
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Description">
</picture>
```

### Shader Performance

**Frame Rate Optimization**:
- Target: 60 FPS
- Acceptable: 30 FPS
- Auto-disable: < 20 FPS

**Shader Complexity**:
- Simple shaders: Fire, Water (~60 FPS on most GPUs)
- Complex shaders: Chaos, Order (~45 FPS on mid-range GPUs)
- Auto-downgrade quality on low FPS

**Power Saving**:
- Pause shaders when tab not visible
- Reduce quality on battery saver mode
- Disable on integrated GPUs (optional)

### Firebase Optimization

**Query Optimization**:
- Use composite indexes for complex queries
- Limit results with `.limit()`
- Paginate long lists with cursors

**Read Reduction**:
- Cache frequently accessed data
- Batch reads when possible
- Use `onSnapshot()` for real-time sparingly

**Offline Persistence**:
```javascript
firebase.firestore().enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open
    } else if (err.code == 'unimplemented') {
      // Browser doesn't support
    }
  });
```

---

## Monitoring Performance

### Built-In Performance Monitor

Access performance stats:
1. Open browser console (F12)
2. Type: `window.performanceMonitor.getReport()`
3. View detailed metrics

**Metrics Tracked**:
- Page load time
- Firebase read count
- Cache hit/miss ratio
- Memory usage
- FPS (shader rendering)

### Browser Tools

**Chrome DevTools**:
- Performance tab: Record page load, analyze waterfall
- Network tab: Monitor Firebase requests
- Lighthouse: Run performance audit

**Firefox Developer Tools**:
- Performance: Timeline recording
- Network: Request monitoring
- Accessibility: A11y audit

---

## Getting Help

### Performance Issues?

1. **Check this guide** for common solutions
2. **Clear cache** and try again
3. **Test on different browser** (Chrome recommended)
4. **Check internet speed** (https://fast.com)
5. **Report persistent issues** to AndrewKWatts@Gmail.com

**Include in Report**:
- Browser and version
- Operating system
- Internet speed
- Steps to reproduce issue
- Console errors (F12 → Console)

---

## Future Performance Improvements

**Planned Enhancements**:
- ✅ Service Worker for full PWA support
- ✅ HTTP/3 support (when widely available)
- ✅ Brotli compression (better than gzip)
- ✅ Edge caching for global CDN
- ✅ Predictive prefetching (guess next page)
- ✅ Image lazy loading (native `loading="lazy"`)

**Under Consideration**:
- WebAssembly for heavy computations
- WebGPU for advanced shaders
- Local-first architecture (eventual consistency)

---

**Eyes of Azrael is optimized for speed, but your experience may vary based on device, connection, and browser. For best results, use the latest Chrome or Firefox on a modern device with broadband internet.**

Questions? Contact **AndrewKWatts@Gmail.com**

⚡ **Fast by design. Optimized for discovery.**
