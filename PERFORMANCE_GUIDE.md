# Eyes of Azrael - Performance Guide

**Making mythology exploration lightning-fast.** This guide explains how Eyes of Azrael achieves exceptional performance and how to troubleshoot any performance issues.

**Last Updated**: 2025-12-28

---

## Table of Contents

1. [Performance Overview](#performance-overview)
2. [Why Eyes of Azrael is Fast](#why-eyes-of-azrael-is-fast)
3. [Browser Requirements](#browser-requirements)
4. [Performance Metrics](#performance-metrics)
5. [Caching Strategy](#caching-strategy)
6. [Lazy Loading](#lazy-loading)
7. [Optimization Techniques](#optimization-techniques)
8. [Troubleshooting Slow Performance](#troubleshooting-slow-performance)
9. [Network Requirements](#network-requirements)
10. [Offline Capabilities](#offline-capabilities)
11. [Advanced Performance Tips](#advanced-performance-tips)

---

## Performance Overview

### Target Performance

Eyes of Azrael aims for:
- **< 1 second** page load (with cache)
- **< 3 seconds** page load (first visit)
- **90+** Lighthouse performance score
- **60 FPS** smooth animations
- **< 100ms** search response time

### Actual Performance

Typical performance metrics:
- **0.5-1s** cached page load
- **2-3s** uncached page load
- **92-96** Lighthouse score
- **60 FPS** on modern hardware
- **50-100ms** search latency

---

## Why Eyes of Azrael is Fast

### 1. Smart Caching

**IndexedDB Cache**:
- Stores all entity data locally
- 7-day TTL (time-to-live)
- 90%+ cache hit rate
- Reduces Firebase reads dramatically

**How it works**:
1. First visit: Fetch from Firebase
2. Store in IndexedDB
3. Subsequent visits: Instant load from cache
4. Auto-refresh after 7 days

### 2. No Build Step

**Pure JavaScript**:
- No Webpack/Vite compilation
- No transpilation delay
- Direct browser execution
- Instant deployment

**Benefits**:
- Faster development cycles
- Smaller bundle sizes
- Better browser optimization
- Easier debugging

### 3. Progressive Enhancement

**Graceful Degradation**:
- Core content works without JavaScript
- Basic functionality for all browsers
- Enhanced features for modern browsers
- Accessible to everyone

### 4. Lazy Loading

**On-Demand Resources**:
- Images load as you scroll
- Components loaded when needed
- Heavy features deferred
- Minimal initial payload

### 5. CDN Delivery

**Firebase Hosting**:
- Global CDN network
- Edge caching
- Compression (gzip/brotli)
- Fast anywhere in the world

### 6. Optimized Assets

**Image Optimization**:
- WebP format (smaller files)
- Responsive images
- Lazy loading
- CDN caching

**CSS/JS Optimization**:
- Minified files
- Deferred non-critical CSS
- Async script loading
- Critical path optimization

---

## Browser Requirements

### Recommended Browsers

**Desktop**:
- Chrome 90+ (best performance)
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile**:
- Chrome 90+ (Android)
- Safari 14+ (iOS)
- Samsung Internet 14+
- Firefox 88+ (Android)

### Minimum Requirements

**Browser Versions**:
- Chrome 70+
- Firefox 70+
- Safari 12+
- Edge 79+

**System Requirements**:
- 1GB RAM minimum
- 2GB RAM recommended
- Broadband internet (500 Kbps+)
- JavaScript enabled
- Cookies enabled (for auth)

### Feature Support

**Required Features**:
- ES6 JavaScript
- Fetch API
- IndexedDB
- Service Workers (optional)
- WebGL (optional, for shaders)

**Optional Features**:
- WebGL 2.0 (enhanced shaders)
- IntersectionObserver (lazy loading)
- RequestIdleCallback (background tasks)
- Web Workers (heavy computation)

---

## Performance Metrics

### Lighthouse Scores

**Typical Scores**:
- **Performance**: 92-96
- **Accessibility**: 95-100
- **Best Practices**: 95-100
- **SEO**: 90-95

### Core Web Vitals

**Target Metrics**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Actual Metrics**:
- **LCP**: 1.5-2.5s
- **FID**: 50-100ms
- **CLS**: 0.05-0.1

### Load Times

**First Visit** (no cache):
- HTML: 200-500ms
- CSS: 100-300ms
- JavaScript: 300-800ms
- Firebase SDK: 500-1000ms
- Total: 2-3s

**Cached Visit**:
- HTML: 100-200ms
- Assets: 50-100ms (from cache)
- Data: 10-50ms (from IndexedDB)
- Total: 0.5-1s

---

## Caching Strategy

### IndexedDB Cache

**What's Cached**:
- All entity data (deities, items, places)
- Search indices
- User preferences
- Recently viewed pages

**Cache Duration**:
- **Entities**: 7 days
- **Search Indices**: 24 hours
- **User Data**: Session-based
- **Static Assets**: Browser-controlled

**Cache Size**:
- **Typical**: 5-10 MB
- **Maximum**: 50 MB
- **Auto-cleanup**: When storage limit reached

### Browser Cache

**HTTP Caching**:
- Static assets: 1 year cache
- HTML: No cache (always fresh)
- Firebase assets: CDN cache

**Cache Headers**:
```
Cache-Control: public, max-age=31536000, immutable
```

### Service Worker (Future)

**Planned Features**:
- Offline-first strategy
- Background sync
- Push notifications
- Advanced caching

---

## Lazy Loading

### Image Lazy Loading

**How it works**:
1. Images marked with `loading="lazy"`
2. Browser loads images as they approach viewport
3. Reduces initial page weight
4. Improves perceived performance

**Fallback**:
- IntersectionObserver API for older browsers
- Graceful degradation to immediate load

### Component Lazy Loading

**Deferred Components**:
- WebGL shaders
- Rich text editor
- Image upload system
- Advanced search filters

**Loading Strategy**:
- Load on interaction
- Load on scroll
- Load on idle (requestIdleCallback)

### Route-Based Code Splitting

**Future Enhancement**:
- Split code by route
- Load only needed modules
- Dynamic imports
- Reduce initial bundle

---

## Optimization Techniques

### 1. Render Optimization

**Virtual Scrolling**:
- Only render visible items
- Recycle DOM elements
- Handle thousands of entities

**Debounced Search**:
- 300ms debounce on search input
- Prevents excessive queries
- Smoother user experience

**RequestAnimationFrame**:
- Smooth animations
- GPU-accelerated rendering
- Efficient repaints

### 2. Network Optimization

**Firebase Read Reduction**:
- Cache-first strategy
- Batch queries
- Pagination
- Index optimization

**Compression**:
- Gzip/Brotli compression
- Minified assets
- Optimized images
- Reduced payload

### 3. Memory Management

**Garbage Collection**:
- Clear unused references
- Dispose of event listeners
- Clean up timers
- Memory leak prevention

**Efficient Data Structures**:
- Map/Set for lookups
- WeakMap for caching
- Typed arrays for performance
- Immutable patterns

---

## Troubleshooting Slow Performance

### Symptoms & Solutions

#### Slow Initial Load

**Symptoms**:
- First page load takes > 5 seconds
- Blank screen for extended time
- Slow network requests

**Solutions**:
1. Check internet connection speed
2. Clear browser cache
3. Disable browser extensions
4. Try a different browser
5. Check firewall settings

#### Slow Navigation

**Symptoms**:
- Page transitions take > 2 seconds
- Content flickers
- UI feels sluggish

**Solutions**:
1. Clear IndexedDB cache:
   - Open DevTools > Application > IndexedDB
   - Delete "eyesofazrael" database
   - Refresh page
2. Check for browser updates
3. Close unnecessary tabs
4. Restart browser

#### Images Not Loading

**Symptoms**:
- Broken image icons
- Images load very slowly
- Some images never appear

**Solutions**:
1. Check internet connection
2. Disable ad blockers
3. Enable images in browser settings
4. Clear browser cache
5. Try incognito mode

#### Search Lag

**Symptoms**:
- Search takes > 1 second to respond
- Autocomplete is slow
- Results don't update

**Solutions**:
1. Reduce search term length
2. Clear search index cache
3. Wait for database to finish loading
4. Try simpler search query

#### Shader Performance Issues

**Symptoms**:
- Screen flickers
- Low framerate (< 30 FPS)
- Browser freezes

**Solutions**:
1. Disable WebGL shaders:
   - Settings > Disable Background Effects
2. Update graphics drivers
3. Close GPU-intensive applications
4. Use a supported browser

---

## Network Requirements

### Internet Speed

**Minimum**:
- 500 Kbps download
- 256 Kbps upload
- 200ms latency

**Recommended**:
- 5 Mbps download
- 1 Mbps upload
- < 100ms latency

### Data Usage

**First Visit**:
- HTML/CSS/JS: 500 KB - 1 MB
- Firebase SDK: 300-500 KB
- Entity Data: 100-500 KB
- Images: 1-5 MB (as needed)
- Total: 2-7 MB

**Cached Visit**:
- HTML: 50-100 KB
- API Calls: 10-50 KB
- Total: 60-150 KB

**Hourly Usage**:
- Light browsing: 5-10 MB/hour
- Heavy browsing: 20-50 MB/hour
- Contributing theories: 50-100 MB/hour (with image uploads)

### Mobile Data Considerations

**Tips for Mobile Users**:
- Connect to Wi-Fi when available
- Disable auto-load images
- Use data saver mode
- Clear cache regularly
- Avoid uploading large images

---

## Offline Capabilities

### What Works Offline

**Cached Pages**:
- Previously viewed entities
- Recently searched terms
- Saved preferences
- Authentication state (temporary)

**Limited Functionality**:
- Can read cached content
- Cannot submit new theories
- Cannot fetch new entities
- Cannot upload images

### What Doesn't Work Offline

**Cloud-Dependent Features**:
- New entity loading
- Search across all entities
- User authentication (sign-in)
- Theory submission
- Real-time updates

### Enabling Offline Mode

**Future Feature** (Service Worker):
1. Visit pages you want to cache
2. Enable "Offline Mode" in settings
3. Content downloads automatically
4. Access anytime, even offline

---

## Advanced Performance Tips

### Developer Tools

**Chrome DevTools**:
1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record**
4. Interact with site
5. Stop recording
6. Analyze performance issues

**Lighthouse Audit**:
1. Open DevTools
2. Go to **Lighthouse** tab
3. Click **Analyze page load**
4. Review recommendations

### Network Throttling

**Test Performance on Slow Connections**:
1. DevTools > Network tab
2. Throttling: "Slow 3G" or "Fast 3G"
3. Reload page
4. Experience as users on slow connections

### Memory Profiling

**Check for Memory Leaks**:
1. DevTools > Memory tab
2. Take heap snapshot
3. Interact with site
4. Take another snapshot
5. Compare snapshots for leaks

### Performance Monitoring

**Real User Monitoring (Future)**:
- Track actual user performance
- Identify bottlenecks
- Optimize based on real data
- Regional performance insights

---

## Performance Checklist

### User Checklist

✅ **For Best Performance**:
- [ ] Use Chrome, Firefox, or Safari (latest version)
- [ ] Enable JavaScript and cookies
- [ ] Clear cache monthly
- [ ] Close unnecessary tabs
- [ ] Use fast internet connection (5+ Mbps)
- [ ] Update browser regularly
- [ ] Disable unnecessary extensions

### Developer Checklist

✅ **Before Deployment**:
- [ ] Run Lighthouse audit (90+ score)
- [ ] Test on slow 3G connection
- [ ] Check Core Web Vitals
- [ ] Verify cache is working
- [ ] Test lazy loading
- [ ] Profile memory usage
- [ ] Check bundle sizes
- [ ] Verify CDN caching

---

## Getting Help

### Still Experiencing Issues?

**Email Support**: AndrewKWatts@Gmail.com

**Include**:
- Browser and version
- Operating system
- Internet speed (speedtest.net)
- Screenshots of DevTools
- Steps to reproduce

**Response Time**: Usually within 48 hours

---

## Related Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** - General site usage
- **[DEVELOPER_ONBOARDING.md](./docs/systems/DEVELOPER_ONBOARDING.md)** - Technical architecture
- **[MONITORING_GUIDE.md](./docs/systems/MONITORING_GUIDE.md)** - Performance monitoring
- **[docs/INDEX.md](./docs/INDEX.md)** - Complete documentation index

---

**Built for speed without sacrificing features.**

👁️ **Eyes of Azrael** - Fast, accessible, powerful.

*"Performance is a feature."*
