# Firebase Cache System - Quick Start Guide

## Installation

### 1. Include Scripts in Your HTML

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- Firebase Configuration -->
<script src="js/firebase-init.js"></script>

<!-- Cache System (order matters!) -->
<script src="js/firebase-cache-manager.js"></script>
<script src="js/version-tracker.js"></script>
<script src="js/firebase-content-loader.js"></script>
```

### 2. Initialize in Your Code

```javascript
// Initialize content loader with caching
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,
  enableLogging: true  // Disable in production
});
```

That's it! Your queries are now automatically cached.

## Basic Usage

### Load Content (Automatically Cached)

```javascript
// First call - queries Firestore
const deities = await contentLoader.loadContent('deities');

// Second call - returns from cache (instant!)
const cachedDeities = await contentLoader.loadContent('deities');
```

### Force Fresh Data

```javascript
// Bypass cache for this query only
const freshData = await contentLoader.loadContent('deities', {
  bypassCache: true
});
```

### Clear Cache

```javascript
// Clear cache for specific content type
contentLoader.clearCache('deities');

// Clear all cache
contentLoader.clearCache();
```

## Common Patterns

### 1. Initial Page Load with Cache

```javascript
async function loadPage() {
  try {
    // This will use cache if available
    const content = await contentLoader.loadContent('deities', {
      mythology: 'greek',
      limit: 50
    });

    renderContent(content);
  } catch (error) {
    console.error('Load failed:', error);
  }
}
```

### 2. Refresh Button

```javascript
function handleRefresh() {
  // Clear cache and reload
  contentLoader.clearCache('deities');
  loadPage();
}
```

### 3. Admin Upload Workflow

```javascript
async function uploadNewData(data) {
  // 1. Upload data to Firestore
  await uploadToFirestore(data);

  // 2. Increment version (invalidates all client caches)
  await contentLoader.incrementVersion({
    uploadType: 'manual',
    collection: 'deities',
    count: data.length
  });

  console.log('Upload complete. All caches will refresh.');
}
```

### 4. Show Cache Statistics

```javascript
// Get and display cache stats
const stats = contentLoader.getCacheStats();
console.log(`Cache Hit Rate: ${stats.hitRate}`);
console.log(`Cache Size: ${stats.sizeFormatted}`);
console.log(`Entries: ${stats.entries}`);
```

## Configuration Examples

### Long-Term Caching (Static Data)

```javascript
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,
  cacheOptions: {
    defaultTTL: 86400000,  // 24 hours
    hourlyInvalidation: false  // Disable hourly cleanup
  }
});
```

### Short-Term Caching (Dynamic Data)

```javascript
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,
  cacheOptions: {
    defaultTTL: 300000,  // 5 minutes
    hourlyInvalidation: true
  }
});
```

### Large Cache for Heavy Sites

```javascript
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,
  cacheOptions: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    storage: 'localStorage'
  }
});
```

### Session-Only Caching

```javascript
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,
  cacheOptions: {
    storage: 'sessionStorage'  // Clears on browser close
  }
});
```

## Monitoring

### View Statistics Dashboard

Open `cache-stats.html` in your browser to see:
- Cache hit/miss rates
- Storage usage
- All cached entries
- Version information

### Programmatic Monitoring

```javascript
// Check cache health every minute
setInterval(() => {
  const stats = contentLoader.getCacheStats();

  if (parseFloat(stats.hitRate) < 50) {
    console.warn('Low cache hit rate!');
  }

  if (parseFloat(stats.utilization) > 90) {
    console.warn('Cache almost full!');
    contentLoader.cacheManager.cleanupLRU();
  }
}, 60000);
```

## Troubleshooting

### Cache Not Working?

```javascript
// Enable logging to see what's happening
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,
  enableLogging: true  // Check console
});
```

### Clear Everything and Start Fresh

```javascript
// Nuclear option - clear all cache and stats
contentLoader.cacheManager.destroy();
```

### Check If Cache Is Being Used

```javascript
// Load data twice and compare timing
console.time('First Load');
await contentLoader.loadContent('deities');
console.timeEnd('First Load');  // ~500ms (network)

console.time('Second Load');
await contentLoader.loadContent('deities');
console.timeEnd('Second Load');  // ~5ms (cache!)
```

## Performance Tips

### 1. Warm Critical Caches on App Start

```javascript
async function initApp() {
  // Pre-load important data
  await Promise.all([
    contentLoader.loadContent('deities'),
    contentLoader.loadContent('heroes'),
    contentLoader.loadContent('myths')
  ]);

  console.log('Critical data cached!');
  showApp();
}
```

### 2. Use Tags for Batch Invalidation

```javascript
// All Greek content with 'greek' tag
await cacheManager.get('greek-deities', queryFn, {
  tags: ['greek', 'deities']
});

await cacheManager.get('greek-heroes', queryFn, {
  tags: ['greek', 'heroes']
});

// Later: Clear all Greek content at once
cacheManager.invalidateByTag('greek');
```

### 3. Implement Smart Refresh

```javascript
// Check version every 5 minutes
setInterval(async () => {
  const hasChanged = await contentLoader.checkVersion();
  if (hasChanged) {
    // Show notification instead of auto-reload
    showUpdateNotification();
  }
}, 300000);

function showUpdateNotification() {
  if (confirm('New content available. Refresh now?')) {
    location.reload();
  }
}
```

## Default Behavior

When you use the cache system with default settings:

- **TTL**: 1 hour (3,600,000 ms)
- **Hourly Invalidation**: Enabled (clears at top of each hour)
- **Max Size**: 5 MB
- **Storage**: localStorage (persists across sessions)
- **Version Checking**: Every 5 minutes (if enabled)
- **Metrics**: Enabled

This works well for most use cases!

## Need More?

See the full documentation: `CACHING_SYSTEM.md`
