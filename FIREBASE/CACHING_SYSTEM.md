# Firebase Caching System Documentation

## Overview

The Eyes of Azrael Firebase Caching System provides a comprehensive client-side caching solution with hourly invalidation, version-based cache management, and detailed metrics tracking. This system significantly reduces Firestore reads and improves application performance.

## Architecture

### Components

1. **FirebaseCacheManager** (`js/firebase-cache-manager.js`)
   - Core caching engine
   - Manages localStorage/sessionStorage
   - Implements TTL and hourly invalidation
   - Tracks cache metrics

2. **VersionTracker** (`js/version-tracker.js`)
   - Tracks data version in Firestore
   - Detects version changes
   - Triggers cache invalidation on updates
   - Maintains version history

3. **FirebaseContentLoader** (`js/firebase-content-loader.js`)
   - Integrates cache manager and version tracker
   - Provides high-level caching API
   - Handles query execution and caching

4. **Cache Stats Dashboard** (`cache-stats.html`)
   - Visual interface for cache monitoring
   - Real-time statistics display
   - Cache management controls

## How It Works

### Caching Flow

```
1. Query Request
   ↓
2. Check Version (if tracking enabled)
   ↓
3. Version Valid? → No → Invalidate All Caches
   ↓ Yes
4. Check Cache
   ↓
5. Cache Hit? → Yes → Return Cached Data
   ↓ No
6. Execute Firestore Query
   ↓
7. Store Result in Cache
   ↓
8. Return Data
```

### Hourly Invalidation

The cache automatically calculates expiry times to the next hour boundary:

- **Current Time**: 14:32
- **Expiry Time**: 15:00 (next hour)
- **Auto-cleanup**: Scheduled at each hour boundary

This ensures fresh data every hour while maximizing cache utilization.

### Version-Based Invalidation

```
1. Data Upload Event
   ↓
2. Increment Version in Firestore (/system/version)
   ↓
3. Clients Detect Version Change (polling every 5 minutes)
   ↓
4. Invalidate All Caches
   ↓
5. Next Query Fetches Fresh Data
```

## Usage

### Basic Setup

```javascript
// Initialize Firebase
const firebaseApp = firebase.initializeApp(config);

// Create content loader with caching
const contentLoader = new FirebaseContentLoader(firebaseApp, {
  enableCache: true,           // Enable caching
  enableLogging: true,          // Enable debug logs
  cacheOptions: {
    storage: 'localStorage',    // or 'sessionStorage'
    maxSize: 5 * 1024 * 1024,  // 5MB
    defaultTTL: 3600000,        // 1 hour
    hourlyInvalidation: true    // Enable hourly cleanup
  }
});

// Initialize version tracker
await contentLoader.versionTracker.initialize();
```

### Loading Content with Cache

```javascript
// Load deities (automatically cached)
const deities = await contentLoader.loadContent('deities', {
  mythology: 'greek',
  limit: 100
});

// Load with cache bypass (force fresh data)
const freshDeities = await contentLoader.loadContent('deities', {
  bypassCache: true
});

// Load with custom TTL
const heroes = await contentLoader.loadContent('heroes', {
  cacheTTL: 1800000  // 30 minutes
});
```

### Cache Management

```javascript
// Get cache statistics
const stats = contentLoader.getCacheStats();
console.log('Hit Rate:', stats.hitRate);
console.log('Cache Size:', stats.sizeFormatted);

// Clear cache for specific content type
contentLoader.clearCache('deities');

// Clear all cache
contentLoader.clearCache();

// Get cache entries
const entries = contentLoader.getCacheEntries();

// Enable/disable cache bypass
contentLoader.setBypassCache(true);  // Next query bypasses cache
```

### Version Management

```javascript
// Get version information
const versionInfo = await contentLoader.getVersionInfo();
console.log('Current Version:', versionInfo.version);

// Check for version updates (manual)
const hasChanged = await contentLoader.checkVersion();

// Increment version after data upload (admin)
await contentLoader.incrementVersion({
  uploadType: 'bulk',
  collections: ['deities', 'heroes'],
  count: 150
});
```

### Direct Cache Manager Usage

```javascript
// Create standalone cache manager
const cacheManager = new FirebaseCacheManager({
  storage: 'localStorage',
  maxSize: 10 * 1024 * 1024,  // 10MB
  defaultTTL: 7200000,         // 2 hours
  enableLogging: true
});

// Cache a query result
const data = await cacheManager.get(
  'my-custom-key',
  async () => {
    // Query function
    return await fetchDataFromAPI();
  },
  {
    ttl: 3600000,
    tags: ['custom', 'api']
  }
);

// Invalidate by pattern
cacheManager.invalidate('deities_*');

// Invalidate by tag
cacheManager.invalidateByTag('greek');

// Manual cleanup
cacheManager.cleanupExpired();
cacheManager.cleanupLRU();
```

### Version Tracker Usage

```javascript
// Create standalone version tracker
const versionTracker = new VersionTracker(firebaseApp, {
  collection: 'system',
  document: 'version',
  checkInterval: 300000,  // 5 minutes
  enableLogging: true
});

// Initialize
await versionTracker.initialize();

// Listen for version changes
const unsubscribe = versionTracker.onVersionChange((newVersion, oldVersion) => {
  console.log(`Version changed: ${oldVersion} → ${newVersion}`);
  // Invalidate caches, show notification, etc.
});

// Increment version
const newVersion = await versionTracker.incrementVersion({
  reason: 'New deity data uploaded',
  count: 50
});

// Get version history
const history = await versionTracker.getVersionHistory(10);
```

## Configuration Options

### FirebaseCacheManager Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storage` | string | 'localStorage' | Storage type: 'localStorage' or 'sessionStorage' |
| `maxSize` | number | 5242880 (5MB) | Maximum cache size in bytes |
| `defaultTTL` | number | 3600000 (1 hour) | Default time-to-live in milliseconds |
| `keyPrefix` | string | 'eoa_cache_' | Prefix for all cache keys |
| `versionKey` | string | 'eoa_cache_version' | Key for storing version |
| `statsKey` | string | 'eoa_cache_stats' | Key for storing statistics |
| `enableMetrics` | boolean | true | Enable metrics tracking |
| `enableLogging` | boolean | false | Enable console logging |
| `hourlyInvalidation` | boolean | true | Enable hourly cache invalidation |

### VersionTracker Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collection` | string | 'system' | Firestore collection name |
| `document` | string | 'version' | Firestore document name |
| `autoIncrement` | boolean | true | Auto-increment on updates |
| `checkInterval` | number | 300000 (5 min) | Version check interval in milliseconds |
| `enableLogging` | boolean | false | Enable console logging |
| `onVersionChange` | function | null | Callback for version changes |

## Cache Statistics

### Available Metrics

- **Hits**: Number of successful cache retrievals
- **Misses**: Number of cache misses (query required)
- **Hit Rate**: Percentage of requests served from cache
- **Total Requests**: Hits + Misses
- **Cache Size**: Current size in bytes
- **Entries**: Number of cached items
- **Utilization**: Percentage of max size used
- **Last Hit/Miss**: Timestamps of last cache operations

### Viewing Statistics

Access the dashboard at: `cache-stats.html`

Or programmatically:

```javascript
const stats = cacheManager.getStats();
console.log('Cache Statistics:', stats);

// Output:
{
  hits: 150,
  misses: 50,
  total: 200,
  hitRate: "75.00%",
  size: 524288,
  sizeFormatted: "512 KB",
  maxSize: 5242880,
  maxSizeFormatted: "5 MB",
  utilization: "10.00%",
  entries: 15,
  lastHit: "2025-12-13T10:30:00.000Z",
  lastMiss: "2025-12-13T10:15:00.000Z",
  version: 42,
  storage: "localStorage"
}
```

## Performance Benefits

### Read Reduction

With 75% hit rate:
- **Before**: 1000 Firestore reads/hour
- **After**: 250 Firestore reads/hour
- **Savings**: 75% reduction in reads

### Cost Savings

Firestore pricing (as of 2023):
- 50,000 reads/day free
- $0.06 per 100,000 reads after

**Example Savings**:
- App with 100,000 reads/day
- With 75% cache hit rate: 25,000 reads/day
- **Result**: Stays within free tier!

### Response Time

- **Cached Query**: ~5ms (localStorage read)
- **Firestore Query**: ~200-500ms (network + database)
- **Speed Improvement**: 40-100x faster

## Best Practices

### 1. Cache Appropriate Data

**Good Candidates**:
- Static reference data (deities, myths, etc.)
- Frequently accessed lists
- User preferences
- Search results

**Poor Candidates**:
- Real-time data
- User-specific private data
- Rapidly changing data
- Large binary files

### 2. Set Appropriate TTLs

```javascript
// Reference data - long TTL
const deities = await loader.loadContent('deities', {
  cacheTTL: 86400000  // 24 hours
});

// Dynamic data - short TTL
const recentSubmissions = await loader.loadContent('submissions', {
  cacheTTL: 300000  // 5 minutes
});

// Real-time data - no cache
const liveData = await loader.loadContent('live', {
  bypassCache: true
});
```

### 3. Tag Your Caches

```javascript
await cacheManager.get('greek-deities', queryFn, {
  tags: ['deities', 'greek', 'mythology']
});

// Later, invalidate all Greek content
cacheManager.invalidateByTag('greek');
```

### 4. Monitor Cache Performance

```javascript
// Check cache effectiveness
setInterval(() => {
  const stats = cacheManager.getStats();
  const hitRate = parseFloat(stats.hitRate);

  if (hitRate < 50) {
    console.warn('Low cache hit rate! Consider adjusting TTLs.');
  }

  const utilization = parseFloat(stats.utilization);
  if (utilization > 90) {
    console.warn('Cache nearly full! Running cleanup...');
    cacheManager.cleanupLRU();
  }
}, 60000);  // Check every minute
```

### 5. Handle Version Changes

```javascript
versionTracker.onVersionChange((newVersion, oldVersion) => {
  // Show notification to user
  showNotification('New content available! Refreshing...');

  // Invalidate all caches
  cacheManager.invalidateAll();

  // Reload current page data
  reloadCurrentView();
});
```

### 6. Admin Operations

```javascript
// After bulk data upload
async function afterDataUpload(collections, count) {
  // Increment version
  const newVersion = await versionTracker.incrementVersion({
    uploadType: 'bulk',
    collections: collections,
    count: count,
    timestamp: new Date().toISOString()
  });

  console.log(`Data uploaded. New version: ${newVersion}`);
  console.log('All client caches will invalidate within 5 minutes.');
}
```

## Troubleshooting

### Cache Not Working

**Check**:
1. Is `FirebaseCacheManager` loaded before `FirebaseContentLoader`?
2. Is caching enabled? `enableCache: true`
3. Check browser console for errors
4. Verify localStorage is available (not in private mode)

```javascript
// Test cache manager
const test = new FirebaseCacheManager({ enableLogging: true });
await test.get('test-key', async () => 'test-value');
console.log(test.getStats());
```

### High Cache Misses

**Possible Causes**:
- TTL too short
- Hourly invalidation resetting cache frequently
- Version changes triggering invalidation
- Different query parameters creating new cache keys

**Solutions**:
- Increase TTL for stable data
- Disable hourly invalidation if not needed
- Normalize query parameters
- Use cache bypass sparingly

### Storage Quota Exceeded

**Solutions**:
1. Reduce `maxSize` setting
2. Implement aggressive LRU cleanup
3. Use sessionStorage instead of localStorage
4. Clear old caches

```javascript
// Automatic cleanup on quota errors
cacheManager.options.maxSize = 3 * 1024 * 1024;  // Reduce to 3MB
cacheManager.cleanupLRU();
```

### Version Not Updating

**Check**:
1. Is Firestore `/system/version` document accessible?
2. Is version tracker initialized?
3. Check network connectivity
4. Verify Firestore security rules allow reads

```javascript
// Debug version tracking
const versionInfo = await versionTracker.getStats();
console.log('Version Info:', versionInfo);

// Force version check
const changed = await versionTracker.checkForUpdates();
console.log('Version changed:', changed);
```

### Cache Growing Too Large

**Monitor and manage**:

```javascript
// Set size limit
const MAX_SIZE = 4 * 1024 * 1024;  // 4MB

setInterval(() => {
  const stats = cacheManager.getStats();
  if (stats.size > MAX_SIZE) {
    console.log('Cache too large, running LRU cleanup');
    cacheManager.cleanupLRU(MAX_SIZE * 0.7);  // Clean to 70%
  }
}, 300000);  // Check every 5 minutes
```

## Security Considerations

### Data Sensitivity

- **Do NOT cache**: Personal user data, authentication tokens, sensitive information
- **Safe to cache**: Public reference data, static content, UI strings

### Cache Isolation

- Each user's localStorage is isolated by domain
- No cross-user data leakage
- Clear cache on logout for security

```javascript
// Clear cache on logout
function handleLogout() {
  if (contentLoader) {
    contentLoader.clearCache();
  }
  // ... other logout logic
}
```

### Version Integrity

The version system uses Firestore transactions to ensure atomic increments:

```javascript
// Transaction ensures version consistency
await db.runTransaction(async (transaction) => {
  const doc = await transaction.get(versionRef);
  const newVersion = doc.data().version + 1;
  transaction.update(versionRef, { version: newVersion });
  return newVersion;
});
```

## Advanced Usage

### Custom Cache Keys

```javascript
// Generate consistent cache keys
const cacheKey = FirebaseCacheManager.generateKey('custom-query', {
  userId: 123,
  filter: 'active',
  sort: 'name'
});

// Use custom key
await cacheManager.get(cacheKey, queryFn);
```

### Conditional Caching

```javascript
// Only cache successful results
async function loadWithConditionalCache(contentType) {
  try {
    const data = await loadData(contentType);

    // Only cache if we got good data
    if (data && data.length > 0) {
      await cacheManager.setInCache(cacheKey, data, ttl);
    }

    return data;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
}
```

### Cache Warming

```javascript
// Pre-load critical data on app start
async function warmCache() {
  const criticalContent = ['deities', 'heroes', 'myths'];

  await Promise.all(
    criticalContent.map(type =>
      contentLoader.loadContent(type, { mythology: 'greek' })
    )
  );

  console.log('Cache warmed with critical content');
}
```

## API Reference

See inline JSDoc comments in source files for complete API documentation:

- `js/firebase-cache-manager.js` - Full cache manager API
- `js/version-tracker.js` - Version tracking API
- `js/firebase-content-loader.js` - Content loader API

## Support

For issues, questions, or contributions:

1. Check this documentation first
2. Review browser console logs (enable logging)
3. Check cache-stats.html for diagnostics
4. Review source code comments

## License

Part of the Eyes of Azrael project.
