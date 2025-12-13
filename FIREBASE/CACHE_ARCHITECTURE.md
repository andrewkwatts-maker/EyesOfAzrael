# Firebase Cache System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE CACHE SYSTEM                         │
│                     Eyes of Azrael                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐          ┌─────────────────────┐        │
│  │  cache-stats.html  │          │  cache-test.html    │        │
│  ├────────────────────┤          ├─────────────────────┤        │
│  │ • Hit/Miss Rates   │          │ • Performance Tests │        │
│  │ • Cache Size       │          │ • Bypass Tests      │        │
│  │ • Entry Browser    │          │ • Invalidation      │        │
│  │ • Clear Controls   │          │ • Version Tests     │        │
│  │ • Version Display  │          │ • Live Statistics   │        │
│  │ • Auto-Refresh     │          │                     │        │
│  └────────────────────┘          └─────────────────────┘        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           FirebaseContentLoader (Enhanced)               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  loadContent(type, options) ──┬──> Check Cache            │   │
│  │                               │                            │   │
│  │  setBypassCache(bypass)       ├──> Execute Query          │   │
│  │                               │                            │   │
│  │  getCacheStats()              ├──> Store Result           │   │
│  │                               │                            │   │
│  │  clearCache(type)             └──> Return Data            │   │
│  │                                                            │   │
│  │  getVersionInfo()                                          │   │
│  │  checkVersion()                                            │   │
│  │  incrementVersion()                                        │   │
│  │                                                            │   │
│  └────────────────┬──────────────────────────┬────────────────┘   │
│                   │                          │                    │
└───────────────────┼──────────────────────────┼────────────────────┘
                    │                          │
        ┌───────────▼──────────┐   ┌──────────▼────────────┐
        │                      │   │                       │
┌───────┴──────────────────────┴───┴───────────────────────┴───────┐
│                        CACHE LAYER                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │              FirebaseCacheManager                         │    │
│  ├───────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  Cache Operations:                                          │    │
│  │  • get(key, queryFn, options)                              │    │
│  │  • setInCache(key, data, ttl, tags)                        │    │
│  │  • getFromCache(key)                                       │    │
│  │                                                             │    │
│  │  Invalidation:                                              │    │
│  │  • invalidate(pattern)      ──> Regex matching             │    │
│  │  • invalidateAll()          ──> Clear everything           │    │
│  │  • invalidateByTag(tag)     ──> Tag-based clear            │    │
│  │                                                             │    │
│  │  Cleanup:                                                   │    │
│  │  • cleanupExpired()         ──> Remove expired             │    │
│  │  • cleanupLRU()             ──> Least Recently Used        │    │
│  │  • getNextHourTimestamp()   ──> Calculate expiry           │    │
│  │                                                             │    │
│  │  Metrics:                                                   │    │
│  │  • recordHit() / recordMiss()                              │    │
│  │  • getStats()                                               │    │
│  │  • getCacheEntries()                                        │    │
│  │                                                             │    │
│  │  Storage:                                                   │    │
│  │  • localStorage (default)                                   │    │
│  │  • sessionStorage (option)                                  │    │
│  │  • Max Size: 5MB (configurable)                            │    │
│  │  • Key Prefix: 'eoa_cache_'                                │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                  VersionTracker                           │    │
│  ├───────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  Version Operations:                                        │    │
│  │  • initialize()                                             │    │
│  │  • getCurrentVersion()                                      │    │
│  │  • incrementVersion(metadata)                               │    │
│  │  • checkForUpdates()                                        │    │
│  │                                                             │    │
│  │  Tracking:                                                  │    │
│  │  • startVersionChecking()   ──> Poll every 5 min           │    │
│  │  • stopVersionChecking()                                    │    │
│  │  • onVersionChange(callback)                                │    │
│  │                                                             │    │
│  │  Storage:                                                   │    │
│  │  • Firestore: /system/version                              │    │
│  │  • Transaction-based updates                               │    │
│  │  • Version history tracking                                │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                    │                          │
        ┌───────────▼──────────┐   ┌──────────▼────────────┐
        │                      │   │                       │
┌───────┴──────────────────────┴───┴───────────────────────┴───────┐
│                      STORAGE LAYER                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────┐      ┌──────────────────────────┐   │
│  │   Browser localStorage   │      │   Firestore Database     │   │
│  ├──────────────────────────┤      ├──────────────────────────┤   │
│  │                          │      │                          │   │
│  │ Cache Entries:           │      │ Version Document:        │   │
│  │ eoa_cache_deities_a1b2   │      │ /system/version          │   │
│  │ eoa_cache_heroes_c3d4    │      │ {                        │   │
│  │ eoa_cache_myths_e5f6     │      │   version: 42,           │   │
│  │                          │      │   lastUpdated: T,        │   │
│  │ Statistics:              │      │   updateCount: 150       │   │
│  │ eoa_cache_stats          │      │ }                        │   │
│  │ {                        │      │                          │   │
│  │   hits: 450,             │      │ Collection Data:         │   │
│  │   misses: 150,           │      │ /deities/doc1            │   │
│  │   currentSize: 2.3MB     │      │ /heroes/doc2             │   │
│  │ }                        │      │ /myths/doc3              │   │
│  │                          │      │ ...                      │   │
│  │ Version:                 │      │                          │   │
│  │ eoa_cache_version: 42    │      │                          │   │
│  │                          │      │                          │   │
│  └──────────────────────────┘      └──────────────────────────┘   │
│         5MB Limit                       Firestore Quotas          │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Query with Cache (Cache Hit)

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. loadContent('deities')
     ▼
┌─────────────────────┐
│  ContentLoader      │
└──────┬──────────────┘
       │
       │ 2. Check cache enabled
       ▼
┌─────────────────────┐
│  CacheManager       │
└──────┬──────────────┘
       │
       │ 3. generateKey('deities', {...})
       │    key: "eoa_cache_deities_a1b2"
       ▼
┌─────────────────────┐
│  localStorage       │
│  Get item by key    │
└──────┬──────────────┘
       │
       │ 4. Found cached entry
       │    Check expiry: VALID
       │    Check version: VALID
       ▼
┌─────────────────────┐
│  CacheManager       │
│  • recordHit()      │
│  • Return data      │
└──────┬──────────────┘
       │
       │ 5. Return cached data (~5ms)
       ▼
┌─────────────────────┐
│   User              │
│   (Data displayed)  │
└─────────────────────┘

Performance: ~5ms (60-100x faster than Firestore)
```

### Query with Cache (Cache Miss)

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. loadContent('heroes')
     ▼
┌─────────────────────┐
│  ContentLoader      │
└──────┬──────────────┘
       │
       │ 2. Check cache enabled
       ▼
┌─────────────────────┐
│  CacheManager       │
└──────┬──────────────┘
       │
       │ 3. generateKey('heroes', {...})
       │    key: "eoa_cache_heroes_c3d4"
       ▼
┌─────────────────────┐
│  localStorage       │
│  Get item by key    │
└──────┬──────────────┘
       │
       │ 4. NOT FOUND
       ▼
┌─────────────────────┐
│  CacheManager       │
│  • recordMiss()     │
│  • Execute queryFn  │
└──────┬──────────────┘
       │
       │ 5. Query Firestore
       ▼
┌─────────────────────┐
│  Firestore          │
│  Execute query      │
└──────┬──────────────┘
       │
       │ 6. Return data (~300ms)
       ▼
┌─────────────────────┐
│  CacheManager       │
│  • Calculate expiry │
│  • Add tags         │
│  • Store in cache   │
└──────┬──────────────┘
       │
       │ 7. setInCache()
       ▼
┌─────────────────────┐
│  localStorage       │
│  Store entry        │
└──────┬──────────────┘
       │
       │ 8. Return data
       ▼
┌─────────────────────┐
│   User              │
│   (Data displayed)  │
└─────────────────────┘

Performance: ~300ms (first time, then cached)
```

### Version Change Flow

```
┌──────────┐
│  Admin   │ Upload new data
└────┬─────┘
     │
     │ 1. uploadDataToFirestore()
     ▼
┌─────────────────────┐
│  Firestore          │
│  Store new data     │
└──────┬──────────────┘
       │
       │ 2. incrementVersion()
       ▼
┌─────────────────────┐
│  VersionTracker     │
│  Transaction:       │
│  version 42 → 43    │
└──────┬──────────────┘
       │
       │ 3. Update /system/version
       ▼
┌─────────────────────┐
│  Firestore          │
│  version: 43        │
└─────────────────────┘
       │
       │ 4. Wait (up to 5 min)
       ▼
┌─────────────────────┐
│  Client             │
│  Periodic check     │
│  every 5 minutes    │
└──────┬──────────────┘
       │
       │ 5. checkForUpdates()
       ▼
┌─────────────────────┐
│  VersionTracker     │
│  Compare versions:  │
│  Local: 42          │
│  Remote: 43         │
│  MISMATCH!          │
└──────┬──────────────┘
       │
       │ 6. onVersionChange(43, 42)
       ▼
┌─────────────────────┐
│  CacheManager       │
│  setVersion(43)     │
│  invalidateAll()    │
└──────┬──────────────┘
       │
       │ 7. Clear localStorage
       ▼
┌─────────────────────┐
│  localStorage       │
│  All cache cleared  │
└──────┬──────────────┘
       │
       │ 8. Next query = fresh data
       ▼
┌─────────────────────┐
│   User              │
│   (New data shown)  │
└─────────────────────┘

Sync Time: 0-5 minutes (configurable)
```

### Hourly Invalidation Flow

```
Current Time: 14:32

┌─────────────────────┐
│  CacheManager       │
│  Initialize         │
└──────┬──────────────┘
       │
       │ 1. setupHourlyInvalidation()
       ▼
┌─────────────────────┐
│  Calculate:         │
│  Now: 14:32         │
│  Next Hour: 15:00   │
│  Delay: 28 minutes  │
└──────┬──────────────┘
       │
       │ 2. setTimeout(cleanup, 1680000ms)
       ▼
┌─────────────────────┐
│  Wait...            │
│  (28 minutes)       │
└──────┬──────────────┘
       │
       │ 3. Time = 15:00
       ▼
┌─────────────────────┐
│  cleanupExpired()   │
│  Remove all entries │
│  with expiry < now  │
└──────┬──────────────┘
       │
       │ 4. Schedule next cleanup
       │    Next: 16:00
       ▼
┌─────────────────────┐
│  Wait...            │
│  (60 minutes)       │
└─────────────────────┘

Ensures: Fresh data every hour
```

## Cache Entry Structure

```
localStorage["eoa_cache_deities_a1b2"] = {
  "data": {
    // Array of deity objects from Firestore
    [
      { id: "zeus", name: "Zeus", mythology: "greek", ... },
      { id: "hera", name: "Hera", mythology: "greek", ... },
      ...
    ]
  },
  "expiry": 1702483200000,        // Next hour boundary
  "created": 1702479600000,       // Creation timestamp
  "ttl": 3600000,                 // 1 hour in ms
  "tags": [                       // For batch invalidation
    "deities",
    "greek",
    "mythology"
  ],
  "version": 42                   // Version when cached
}
```

## Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                      Dependencies                            │
└─────────────────────────────────────────────────────────────┘

firebase-content-loader.js
  ├─── Depends on: firebase-cache-manager.js
  ├─── Depends on: version-tracker.js
  └─── Depends on: firebase (SDK)

firebase-cache-manager.js
  ├─── Depends on: localStorage/sessionStorage (Browser API)
  └─── No external dependencies

version-tracker.js
  ├─── Depends on: firebase (SDK)
  └─── Depends on: Firestore

cache-stats.html
  ├─── Depends on: firebase-cache-manager.js
  ├─── Depends on: version-tracker.js
  ├─── Depends on: firebase-content-loader.js
  └─── Depends on: firebase-init.js

cache-test.html
  ├─── Depends on: firebase-cache-manager.js
  ├─── Depends on: version-tracker.js
  ├─── Depends on: firebase-content-loader.js
  └─── Depends on: firebase-init.js
```

## Load Order

**Critical: Scripts MUST be loaded in this order**

```
1. Firebase SDK
   ├─── firebase-app-compat.js
   └─── firebase-firestore-compat.js

2. Firebase Configuration
   └─── firebase-init.js

3. Cache System (ORDER CRITICAL!)
   ├─── firebase-cache-manager.js   (First - no dependencies)
   ├─── version-tracker.js           (Second - needs Firebase)
   └─── firebase-content-loader.js   (Third - needs above)

4. Your Application Code
   └─── app.js
```

## Performance Characteristics

```
┌──────────────────────────────────────────────────────────────┐
│                    Performance Profile                        │
└──────────────────────────────────────────────────────────────┘

Operation                 | Time      | Notes
─────────────────────────────────────────────────────────────
Cache Hit (localStorage)  | ~5ms      | Near-instant
Cache Miss (Firestore)    | ~200-500ms| Network + DB
Version Check (Firestore) | ~100ms    | Every 5 minutes
Invalidation (pattern)    | ~10ms     | Depends on cache size
Cleanup (LRU)             | ~20ms     | Depends on entries
Statistics calculation    | ~5ms      | Fast iteration

Storage
─────────────────────────────────────────────────────────────
localStorage read         | ~0.1ms    | Synchronous
localStorage write        | ~1ms      | Synchronous
Firestore read           | ~200ms    | Network latency
Firestore write          | ~300ms    | Network + validation

Memory
─────────────────────────────────────────────────────────────
Cache Manager instance    | ~2KB      | Minimal overhead
Version Tracker instance  | ~1KB      | Minimal overhead
Content Loader instance   | ~3KB      | Includes both
Cached entry overhead     | ~100B     | Per entry metadata
```

## System Limits

```
┌──────────────────────────────────────────────────────────────┐
│                      System Limits                            │
└──────────────────────────────────────────────────────────────┘

localStorage
─────────────────────────────────────────────────────────────
Total Quota (Chrome)      | ~10MB     | Browser dependent
Total Quota (Firefox)     | ~10MB     | Browser dependent
Total Quota (Safari)      | ~5MB      | Most restrictive
Default Cache Max         | 5MB       | Configurable
Recommended Max           | 3-5MB     | Safe for all browsers

Firestore
─────────────────────────────────────────────────────────────
Free Tier Reads/Day       | 50,000    | Per project
Free Tier Writes/Day      | 20,000    | Per project
Document Size             | 1MB       | Maximum
Collection Size           | Unlimited | No limit

Performance
─────────────────────────────────────────────────────────────
Max Cache Entries         | ~1000     | Before cleanup recommended
Version Check Interval    | 5 min     | Configurable
Hourly Cleanup            | Top of hr | Automatic
TTL Range                 | 1min-24hr | Recommended
```

## Monitoring Points

```
Key Metrics to Track:
─────────────────────────────────────────────────────────────
✓ Cache Hit Rate          Target: >60%
✓ Cache Miss Rate         Target: <40%
✓ Storage Utilization     Target: <80%
✓ Firestore Read Count    Target: -75% vs no cache
✓ Page Load Time          Target: <500ms (cached)
✓ Version Sync Delay      Target: <5 minutes
✓ Error Rate              Target: <0.1%

Dashboard: cache-stats.html
Testing: cache-test.html
Logging: enableLogging: true
```

---

**Architecture Status**: ✅ Stable and Production-Ready
**Last Updated**: 2025-12-13
**Version**: 1.0.0
