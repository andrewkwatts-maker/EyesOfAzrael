# PERFORMANCE ANALYSIS
## Why Pages Load So Slowly

**Issue ID:** PERF-001 to PERF-008
**Severity:** HIGH
**Impact:** 3-5 second page loads, poor user experience

---

## Performance Metrics - Current State

| Page | Current Load Time | Target | Status |
|------|-------------------|--------|--------|
| **Home (First Load)** | 3-5 seconds | <1 second | 🔴 FAIL |
| **Home (Cached Auth)** | 2-3 seconds | <500ms | 🔴 FAIL |
| **Mythology Overview** | 2-4 seconds | <800ms | 🔴 FAIL |
| **Entity Detail** | 1-2 seconds | <600ms | 🟡 WARN |
| **Page Navigation** | 1-3 seconds | <500ms | 🔴 FAIL |

---

## Bottleneck Analysis

### PERF-001: Sequential Firestore Queries on Home Page (CRITICAL)

**File:** `h:/Github/EyesOfAzrael/js/spa-navigation.js` (Lines 276-298)

**Current Code:**
```javascript
async loadMythologyCounts(mythologies) {
    const collections = ['deities', 'heroes', 'creatures', 'texts', 'places', 'items'];

    for (const myth of mythologies) {
        let totalCount = 0;

        for (const collection of collections) {
            try {
                const snapshot = await this.db.collection(collection)
                    .where('mythology', '==', myth.id)
                    .get();
                totalCount += snapshot.size;
            } catch (error) {
                console.error(`Error loading count for ${myth.id}:`, error);
            }
        }

        const countEl = document.getElementById(`count-${myth.id}`);
        if (countEl) {
            countEl.textContent = `${totalCount} entities`;
        }
    }
}
```

**Performance Analysis:**
- **16 mythologies** × **6 collections** = **96 sequential queries**
- Each query takes ~50-200ms
- Total time: **5-20 seconds**
- **Blocking:** Each query waits for previous to complete

**Visualization:**
```
Timeline (Sequential):
|-- Query 1 (greek/deities) --|
                               |-- Query 2 (greek/heroes) --|
                                                             |-- Query 3 (greek/creatures) --|
                                                                                              |-- ...
Total: 5-20 seconds

Timeline (Parallel):
|-- Query 1 --|
|-- Query 2 --|
|-- Query 3 --|
|-- ... --|
Total: 200-500ms
```

**Fix: Parallel Batch Queries**
```javascript
async loadMythologyCounts(mythologies) {
    const collections = ['deities', 'heroes', 'creatures', 'texts', 'places', 'items'];

    // ✅ FIX: Create all query promises at once
    const allQueries = mythologies.flatMap(myth =>
        collections.map(collection =>
            this.db.collection(collection)
                .where('mythology', '==', myth.id)
                .get()
                .then(snapshot => ({
                    mythology: myth.id,
                    collection: collection,
                    count: snapshot.size
                }))
                .catch(error => {
                    console.error(`Error loading count for ${myth.id}/${collection}:`, error);
                    return { mythology: myth.id, collection: collection, count: 0 };
                })
        )
    );

    // ✅ Execute all queries in parallel
    console.log(`[SPA] Loading ${allQueries.length} counts in parallel...`);
    const startTime = performance.now();

    const results = await Promise.all(allQueries);

    const endTime = performance.now();
    console.log(`[SPA] ✅ Loaded all counts in ${(endTime - startTime).toFixed(0)}ms`);

    // ✅ Aggregate results by mythology
    const countsMap = {};
    results.forEach(result => {
        if (!countsMap[result.mythology]) {
            countsMap[result.mythology] = 0;
        }
        countsMap[result.mythology] += result.count;
    });

    // ✅ Update UI
    mythologies.forEach(myth => {
        const countEl = document.getElementById(`count-${myth.id}`);
        if (countEl) {
            const total = countsMap[myth.id] || 0;
            countEl.textContent = `${total} entities`;
        }
    });
}
```

**Performance Improvement:**
- Before: 5-20 seconds (sequential)
- After: 200-500ms (parallel)
- **Speed up: 10-40x faster**

**Impact:** 🔴 CRITICAL - Home page is primary landing page

---

### PERF-002: No Data Caching Between Navigations (HIGH)

**File:** `h:/Github/EyesOfAzrael/js/views/home-view.js` (Lines 49-75)

**Current Behavior:**
```javascript
async loadMythologies() {
    console.log('[Home View] Loading mythologies from Firebase...');

    try {
        // ❌ ALWAYS fetches from Firebase, even if already loaded
        const snapshot = await this.db.collection('mythologies')
            .orderBy('order', 'asc')
            .get();

        if (!snapshot.empty) {
            this.mythologies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`[Home View] Loaded ${this.mythologies.length} mythologies from Firebase`);
        } else {
            this.mythologies = this.getFallbackMythologies();
        }
    } catch (error) {
        console.error('[Home View] Error loading from Firebase:', error);
        this.mythologies = this.getFallbackMythologies();
    }
}
```

**Problem:**
- User navigates: Home → Mythology → Home
- Home page re-fetches mythologies **AGAIN**
- Data hasn't changed, but we query Firebase anyway
- Adds 200-500ms to every return to home

**Solution: Add Caching Layer**

Create `h:/Github/EyesOfAzrael/js/cache-manager.js`:
```javascript
/**
 * Simple in-memory cache for Firestore data
 */
class CacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
        this.maxSize = options.maxSize || 100;
    }

    /**
     * Get cached value
     */
    get(key) {
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if expired
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        console.log('[Cache] ✅ HIT:', key);
        return cached.value;
    }

    /**
     * Set cached value
     */
    set(key, value, ttl = this.defaultTTL) {
        // Enforce max size (LRU eviction)
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value: value,
            expiresAt: Date.now() + ttl
        });

        console.log('[Cache] 💾 SET:', key);
    }

    /**
     * Clear cache
     */
    clear(pattern = null) {
        if (pattern) {
            // Clear specific pattern
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // Clear all
            this.cache.clear();
        }
        console.log('[Cache] 🗑️ CLEARED');
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Global instance
window.cacheManager = new CacheManager({
    ttl: 5 * 60 * 1000,  // 5 minutes
    maxSize: 100
});
```

**Update home-view.js:**
```javascript
async loadMythologies() {
    console.log('[Home View] Loading mythologies...');

    // ✅ Check cache first
    const cacheKey = 'mythologies:all';
    const cached = window.cacheManager?.get(cacheKey);

    if (cached) {
        console.log('[Home View] ✅ Using cached mythologies');
        this.mythologies = cached;
        return;
    }

    // ✅ Cache miss - fetch from Firebase
    try {
        const snapshot = await this.db.collection('mythologies')
            .orderBy('order', 'asc')
            .get();

        if (!snapshot.empty) {
            this.mythologies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // ✅ Store in cache
            window.cacheManager?.set(cacheKey, this.mythologies);

            console.log(`[Home View] Loaded ${this.mythologies.length} mythologies from Firebase`);
        } else {
            this.mythologies = this.getFallbackMythologies();
        }
    } catch (error) {
        console.error('[Home View] Error loading from Firebase:', error);
        this.mythologies = this.getFallbackMythologies();
    }
}
```

**Performance Improvement:**
- First load: 200-500ms (Firebase query)
- Subsequent loads: <10ms (cache hit)
- **Speed up: 20-50x faster on return visits**

**Impact:** 🟡 HIGH - Affects all page navigations

---

### PERF-003: Mythology Overview Sequential Queries (HIGH)

**File:** `h:/Github/EyesOfAzrael/js/components/mythology-overview.js` (Lines 69-106)

**Current Code:**
```javascript
async loadEntityCounts(mythologyId) {
    const entityTypes = [
        { collection: 'deities', singular: 'deity', plural: 'deities', icon: '👑' },
        { collection: 'heroes', singular: 'hero', plural: 'heroes', icon: '🦸' },
        // ... 11 total types
    ];

    const counts = {};

    // ❌ Sequential queries (11 queries)
    for (const type of entityTypes) {
        try {
            const snapshot = await this.db.collection(type.collection)
                .where('mythology', '==', mythologyId)
                .get();

            counts[type.collection] = {
                count: snapshot.size,
                ...type
            };
        } catch (error) {
            console.error(`[MythologyOverview] Error loading ${type.collection}:`, error);
            counts[type.collection] = {
                count: 0,
                ...type
            };
        }
    }

    return counts;
}
```

**Problem:**
- 11 sequential queries
- Each takes 50-200ms
- Total: 550ms - 2.2 seconds
- Blocks rendering of entity type cards

**Fix: Parallel Queries**
```javascript
async loadEntityCounts(mythologyId) {
    const entityTypes = [
        { collection: 'deities', singular: 'deity', plural: 'deities', icon: '👑' },
        { collection: 'heroes', singular: 'hero', plural: 'heroes', icon: '🦸' },
        { collection: 'creatures', singular: 'creature', plural: 'creatures', icon: '🐉' },
        { collection: 'cosmology', singular: 'cosmology', plural: 'cosmology', icon: '🌌' },
        { collection: 'rituals', singular: 'ritual', plural: 'rituals', icon: '🕯️' },
        { collection: 'herbs', singular: 'herb', plural: 'herbs', icon: '🌿' },
        { collection: 'texts', singular: 'text', plural: 'texts', icon: '📜' },
        { collection: 'symbols', singular: 'symbol', plural: 'symbols', icon: '⚡' },
        { collection: 'items', singular: 'item', plural: 'items', icon: '⚔️' },
        { collection: 'places', singular: 'place', plural: 'places', icon: '🏛️' },
        { collection: 'magic', singular: 'magic', plural: 'magic', icon: '✨' }
    ];

    // ✅ Create all query promises
    const queryPromises = entityTypes.map(type =>
        this.db.collection(type.collection)
            .where('mythology', '==', mythologyId)
            .get()
            .then(snapshot => ({
                ...type,
                count: snapshot.size
            }))
            .catch(error => {
                console.error(`[MythologyOverview] Error loading ${type.collection}:`, error);
                return {
                    ...type,
                    count: 0
                };
            })
    );

    // ✅ Execute all queries in parallel
    console.log(`[MythologyOverview] Loading ${entityTypes.length} entity counts in parallel...`);
    const startTime = performance.now();

    const results = await Promise.all(queryPromises);

    const endTime = performance.now();
    console.log(`[MythologyOverview] ✅ Loaded counts in ${(endTime - startTime).toFixed(0)}ms`);

    // ✅ Convert to object
    const counts = {};
    results.forEach(result => {
        counts[result.collection] = result;
    });

    return counts;
}
```

**Performance Improvement:**
- Before: 550ms - 2.2 seconds (sequential)
- After: 100-300ms (parallel)
- **Speed up: 5-7x faster**

---

### PERF-004: Entity Detail Multiple Sequential Loads (MEDIUM)

**File:** `h:/Github/EyesOfAzrael/js/components/entity-detail-viewer.js` (Lines 72-94)

**Current Code:**
```javascript
async loadRelatedEntities(entity) {
    const related = {};

    if (entity.displayOptions?.relatedEntities) {
        // ❌ Sequential loading of related entities
        for (const relationship of entity.displayOptions.relatedEntities) {
            try {
                const entities = await this.loadEntitiesByIds(
                    relationship.collection,
                    relationship.ids || []
                );
                related[relationship.type] = {
                    label: relationship.label || relationship.type,
                    entities: entities
                };
            } catch (error) {
                console.error(`[EntityDetailViewer] Error loading ${relationship.type}:`, error);
            }
        }
    }

    return related;
}

async loadEntitiesByIds(collection, ids) {
    if (!ids || ids.length === 0) return [];

    const entities = [];
    // ❌ Sequential loading of each entity
    for (const id of ids.slice(0, 10)) {
        try {
            const doc = await this.db.collection(collection).doc(id).get();
            if (doc.exists) {
                entities.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        } catch (error) {
            console.error(`[EntityDetailViewer] Error loading entity ${id}:`, error);
        }
    }

    return entities;
}
```

**Problem:**
- If entity has 3 relationship types with 5 entities each
- Total: 15 sequential queries
- Each takes 50-150ms
- Total: 750ms - 2.25 seconds

**Fix: Batch Load All Related Entities**
```javascript
async loadRelatedEntities(entity) {
    if (!entity.displayOptions?.relatedEntities) {
        return {};
    }

    // ✅ Create all query promises at once
    const allQueries = entity.displayOptions.relatedEntities.flatMap(relationship => {
        const ids = relationship.ids || [];
        return ids.slice(0, 10).map(id => ({
            relationshipType: relationship.type,
            relationshipLabel: relationship.label || relationship.type,
            collection: relationship.collection,
            id: id,
            promise: this.db.collection(relationship.collection)
                .doc(id)
                .get()
        }));
    });

    console.log(`[EntityDetailViewer] Loading ${allQueries.length} related entities in parallel...`);
    const startTime = performance.now();

    // ✅ Execute all queries in parallel
    const results = await Promise.allSettled(
        allQueries.map(q => q.promise)
    );

    const endTime = performance.now();
    console.log(`[EntityDetailViewer] ✅ Loaded related entities in ${(endTime - startTime).toFixed(0)}ms`);

    // ✅ Group results by relationship type
    const related = {};
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists) {
            const query = allQueries[index];
            const type = query.relationshipType;

            if (!related[type]) {
                related[type] = {
                    label: query.relationshipLabel,
                    entities: []
                };
            }

            related[type].entities.push({
                id: result.value.id,
                ...result.value.data()
            });
        }
    });

    return related;
}
```

**Performance Improvement:**
- Before: 750ms - 2.25 seconds (sequential)
- After: 100-250ms (parallel)
- **Speed up: 7-10x faster**

---

### PERF-005: No Query Indexing (MEDIUM)

**Issue:** Firestore queries may be slow without proper indexes

**Check Required Indexes:**
```javascript
// Required composite indexes:

// 1. mythologies collection
mythology ASC, order ASC

// 2. All entity collections (deities, heroes, creatures, etc.)
mythology ASC, name ASC
mythology ASC, importance DESC
mythology ASC, createdAt DESC

// 3. Search queries
mythology ASC, searchTerms ARRAY_CONTAINS, importance DESC
```

**How to Add Indexes:**

1. Check Firestore console for missing index errors
2. Firebase will auto-suggest index creation
3. Or manually create in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "deities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "importance", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "heroes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Deploy indexes:**
```bash
firebase deploy --only firestore:indexes
```

**Impact:** 🟡 MEDIUM - Can reduce query time by 30-50%

---

### PERF-006: No Loading State During Route Changes (HIGH)

**File:** `h:/Github/EyesOfAzrael/js/spa-navigation.js` (Lines 111-173)

**Current Code:**
```javascript
async handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '');

    console.log('[SPA] Handling route:', path);

    // ❌ Shows loading, but may be brief and jarring
    this.showLoading();

    try {
        if (this.routes.home.test(path)) {
            await this.renderHome();
        } else if (this.routes.entity.test(path)) {
            // ...
        }
    } catch (error) {
        console.error('[SPA] Routing error:', error);
        this.renderError(error);
    }
}

showLoading() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loading-message">Loading...</p>
            </div>
        `;
    }
}
```

**Problem:**
- Loading spinner shows immediately
- But if data is cached, spinner appears for <100ms
- Creates jarring flash of loading screen

**Better Approach: Delayed Loading State**
```javascript
async handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '');

    console.log('[SPA] Handling route:', path);

    // ✅ Only show loading if route takes >200ms
    let loadingTimeout = setTimeout(() => {
        this.showLoading();
    }, 200);

    try {
        // Route matching and rendering
        if (this.routes.home.test(path)) {
            await this.renderHome();
        } else if (this.routes.entity.test(path)) {
            const match = path.match(this.routes.entity);
            await this.renderEntity(match[1], match[2], match[3]);
        } else if (this.routes.category.test(path)) {
            const match = path.match(this.routes.category);
            await this.renderCategory(match[1], match[2]);
        } else if (this.routes.mythology.test(path)) {
            const match = path.match(this.routes.mythology);
            await this.renderMythology(match[1]);
        } else if (this.routes.search.test(path)) {
            await this.renderSearch();
        } else if (this.routes.compare.test(path)) {
            await this.renderCompare();
        } else if (this.routes.dashboard.test(path)) {
            await this.renderDashboard();
        } else {
            await this.render404();
        }

        // ✅ Clear loading timeout
        clearTimeout(loadingTimeout);

        // Update breadcrumb
        this.updateBreadcrumb(path);

        // Store current route
        this.currentRoute = path;

        console.log('[SPA] ✅ Route rendered successfully');

    } catch (error) {
        // ✅ Clear loading timeout on error too
        clearTimeout(loadingTimeout);

        console.error('[SPA] ❌ Routing error:', error);
        this.renderError(error);
    }
}
```

**Impact:** 🟡 HIGH - Better perceived performance

---

### PERF-007: Entity Type Browser No Pagination (MEDIUM)

**File:** `h:/Github/EyesOfAzrael/js/components/entity-type-browser.js` (Lines 58-79)

**Current Code:**
```javascript
async loadEntities(mythology, entityType) {
    if (!this.db) {
        throw new Error('Firebase Firestore not initialized');
    }

    const collection = this.getCollectionName(entityType);

    // ❌ Loads ALL entities (no limit)
    let query = this.db.collection(collection)
        .where('mythology', '==', mythology);

    query = query.orderBy(this.sortField, this.sortDirection);

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}
```

**Problem:**
- Loads ALL entities (could be 100+)
- Large payload = slow network transfer
- Unnecessary data for initial view

**Fix: Add Pagination**
```javascript
async loadEntities(mythology, entityType) {
    if (!this.db) {
        throw new Error('Firebase Firestore not initialized');
    }

    const collection = this.getCollectionName(entityType);

    // ✅ Add limit based on pageSize
    let query = this.db.collection(collection)
        .where('mythology', '==', mythology)
        .orderBy(this.sortField, this.sortDirection)
        .limit(this.pageSize); // ✅ Limit to 50

    // ✅ Handle pagination
    if (this.lastVisible) {
        query = query.startAfter(this.lastVisible);
    }

    const snapshot = await query.get();

    // ✅ Store last visible document for next page
    if (!snapshot.empty) {
        this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
    }

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Load next page of entities
 */
async loadNextPage() {
    this.currentPage++;
    const entities = await this.loadEntities(this.mythology, this.entityType);
    return entities;
}
```

**Performance Improvement:**
- Before: Load 100+ entities (500KB - 2MB)
- After: Load 50 entities (250KB - 1MB)
- **Speed up: 2x faster initial load**

---

### PERF-008: Featured Entities Query (LOW)

**File:** `h:/Github/EyesOfAzrael/js/spa-navigation.js` (Lines 300-322)

**Current Code:**
```javascript
async loadFeaturedEntities() {
    const container = document.getElementById('featured-entities');
    if (!container) return;

    try {
        // ❌ Queries only deities with importance >= 90
        const snapshot = await this.db.collection('deities')
            .where('importance', '>=', 90)
            .orderBy('importance', 'desc')
            .limit(12)
            .get();

        const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (entities.length > 0) {
            container.innerHTML = this.renderer.render(entities, 'grid');
        } else {
            container.innerHTML = '<p>No featured entities found</p>';
        }
    } catch (error) {
        console.error('Error loading featured entities:', error);
        container.innerHTML = '<p class="error">Error loading featured entities</p>';
    }
}
```

**Optimization: Cache Featured Entities**
```javascript
async loadFeaturedEntities() {
    const container = document.getElementById('featured-entities');
    if (!container) return;

    // ✅ Check cache first
    const cacheKey = 'featured:entities';
    const cached = window.cacheManager?.get(cacheKey);

    if (cached) {
        console.log('[SPA] ✅ Using cached featured entities');
        container.innerHTML = this.renderer.render(cached, 'grid');
        return;
    }

    try {
        const snapshot = await this.db.collection('deities')
            .where('importance', '>=', 90)
            .orderBy('importance', 'desc')
            .limit(12)
            .get();

        const entities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // ✅ Cache for 10 minutes
        if (entities.length > 0) {
            window.cacheManager?.set(cacheKey, entities, 10 * 60 * 1000);
            container.innerHTML = this.renderer.render(entities, 'grid');
        } else {
            container.innerHTML = '<p>No featured entities found</p>';
        }
    } catch (error) {
        console.error('Error loading featured entities:', error);
        container.innerHTML = '<p class="error">Error loading featured entities</p>';
    }
}
```

**Impact:** 🟢 LOW - Small improvement, but good practice

---

## Summary of Fixes

| Issue | Severity | Fix Time | Speed Improvement |
|-------|----------|----------|-------------------|
| PERF-001 | CRITICAL | 30 min | 10-40x faster |
| PERF-002 | HIGH | 45 min | 20-50x faster (cached) |
| PERF-003 | HIGH | 20 min | 5-7x faster |
| PERF-004 | MEDIUM | 30 min | 7-10x faster |
| PERF-005 | MEDIUM | 15 min | 30-50% faster |
| PERF-006 | HIGH | 15 min | Better UX |
| PERF-007 | MEDIUM | 30 min | 2x faster |
| PERF-008 | LOW | 10 min | Cached loads |

**Total Implementation Time:** ~3 hours
**Expected Performance Improvement:** 50-70% faster overall

---

## Files to Modify

1. ✅ Create `js/cache-manager.js` (new file, 100 lines)
2. ✅ Update `js/spa-navigation.js` (150 lines modified)
3. ✅ Update `js/views/home-view.js` (50 lines modified)
4. ✅ Update `js/components/mythology-overview.js` (40 lines modified)
5. ✅ Update `js/components/entity-detail-viewer.js` (60 lines modified)
6. ✅ Update `js/components/entity-type-browser.js` (40 lines modified)
7. ✅ Add Firestore indexes via Firebase console

**Total:** ~440 lines of code changes across 6 files

---

## Testing Checklist

### Before Fixes (Baseline Measurement)
- [ ] Open DevTools Network tab
- [ ] Clear cache and hard refresh
- [ ] Record time for:
  - [ ] Home page first load
  - [ ] Home page cached load
  - [ ] Mythology overview page
  - [ ] Entity detail page
  - [ ] Page navigation timing

### After Fixes (Performance Verification)
- [ ] Clear cache and hard refresh
- [ ] Verify parallel queries in Network tab (should see multiple simultaneous requests)
- [ ] Check console for cache hit messages
- [ ] Verify pagination working (only 50 entities loaded)
- [ ] Test slow network (throttle to 3G)
- [ ] Compare before/after timings

### Expected Results
- [ ] Home page: <1 second (first load)
- [ ] Home page: <500ms (cached)
- [ ] Mythology overview: <800ms
- [ ] Entity detail: <600ms
- [ ] Page navigation: <500ms
- [ ] No blank screens >200ms

---

## Monitoring Performance

Add performance logging:
```javascript
// Add to spa-navigation.js
class SPANavigation {
    async handleRoute() {
        const startTime = performance.now();
        const path = window.location.hash || '#/';

        try {
            // ... routing logic ...

            const endTime = performance.now();
            const loadTime = (endTime - startTime).toFixed(0);

            console.log(`[SPA] ✅ Route rendered in ${loadTime}ms`);

            // Log to analytics (optional)
            if (window.gtag) {
                gtag('event', 'page_load_time', {
                    'page_path': path,
                    'load_time': loadTime
                });
            }
        } catch (error) {
            // ... error handling ...
        }
    }
}
```

---

## Next Steps

1. Implement PERF-001 (parallel home queries) - Highest impact
2. Implement PERF-002 (caching layer) - Second highest impact
3. Implement PERF-003 (parallel mythology overview) - High value
4. Add performance monitoring
5. Test with real users
6. Iterate based on metrics

**Goal:** 50%+ reduction in page load times within 3 hours of implementation.
