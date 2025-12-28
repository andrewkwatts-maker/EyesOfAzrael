# Performance Testing Quick Reference
**Eyes of Azrael - Test Polish Agent 5**

## Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Watch mode
npm run test:performance:watch

# Run specific test suites
npm run test:performance:benchmarks  # Performance benchmarks
npm run test:performance:memory      # Memory leak detection
npm run test:performance:bundle      # Bundle size analysis

# Individual files
npm test -- __tests__/performance/lazy-loading.test.js
npm test -- __tests__/performance/api-optimization.test.js
npm test -- __tests__/performance/debounce-throttle.test.js
```

## Performance Budgets

### Component Performance
| Operation | Budget | Current |
|-----------|--------|---------|
| Search rendering | < 100ms | ✅ ~50ms |
| Entity cards (24) | < 50ms | ✅ ~12ms |
| Filter 1000 items | < 100ms | ✅ ~2ms |
| Sort 500 items | < 100ms | ✅ ~2ms |
| Pagination | < 10ms | ✅ < 1ms |

### Bundle Size
| Category | Budget | Current |
|----------|--------|---------|
| Individual component | < 100KB | ✅ Pass |
| Critical components | < 50KB | ✅ Pass |
| **Total bundle** | < 500KB | ❌ **727KB** |

## Memory Leak Prevention Checklist

```javascript
class Component {
    constructor() {
        // ✅ Track resources
        this.listeners = [];
        this.timers = [];
        this.elements = new Map();
    }

    addEventListener(element, event, handler) {
        // ✅ Track all listeners
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    setTimeout(callback, delay) {
        // ✅ Track all timers
        const id = setTimeout(callback, delay);
        this.timers.push(id);
        return id;
    }

    destroy() {
        // ✅ Clean up everything
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.timers.forEach(id => clearTimeout(id));
        this.elements.clear();

        this.listeners = [];
        this.timers = [];
    }
}
```

## Optimization Patterns

### 1. Debounce (User Input)
```javascript
const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

// Usage
const debouncedSearch = debounce(performSearch, 300);
searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

### 2. Throttle (Scroll/Resize)
```javascript
const throttle = (fn, delay) => {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
};

// Usage
const throttledScroll = throttle(handleScroll, 100);
window.addEventListener('scroll', throttledScroll);
```

### 3. Request Caching
```javascript
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value); // Move to end
        return value;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

const cache = new LRUCache(100);
```

### 4. Request Batching
```javascript
const pendingRequests = [];
let batchTimeout = null;

const batchedFetch = (id) => {
    return new Promise((resolve) => {
        pendingRequests.push({ id, resolve });

        clearTimeout(batchTimeout);
        batchTimeout = setTimeout(async () => {
            const ids = pendingRequests.map(req => req.id);
            const results = await fetchBatch(ids);

            pendingRequests.forEach((req) => {
                const result = results.find(r => r.id === req.id);
                req.resolve(result);
            });

            pendingRequests.length = 0;
        }, 10);
    });
};
```

### 5. Lazy Loading Images
```javascript
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
        }
    });
}, { rootMargin: '200px' });

document.querySelectorAll('img[data-src]').forEach(img => {
    observer.observe(img);
});
```

### 6. Virtual Scrolling
```javascript
const getVisibleRange = (scrollTop, itemHeight, viewportHeight) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    return {
        start: Math.max(0, startIndex - 2), // Buffer
        end: startIndex + visibleCount + 2
    };
};

// Render only visible items
const range = getVisibleRange(scrollTop, 50, 600);
const visibleItems = allItems.slice(range.start, range.end);
```

## Common Performance Issues

### ❌ Bad Patterns
```javascript
// 1. Memory leak - listeners not removed
element.addEventListener('click', handler);
// Component destroyed, listener still active!

// 2. Unnecessary re-renders
results.forEach(item => {
    container.appendChild(createCard(item));
    // Multiple reflows!
});

// 3. No debouncing
input.addEventListener('input', (e) => {
    performSearch(e.target.value);
    // API call on every keystroke!
});

// 4. Uncached requests
async function getEntity(id) {
    return await fetch(`/api/entities/${id}`);
    // Fetches every time!
}
```

### ✅ Good Patterns
```javascript
// 1. Proper cleanup
class Component {
    destroy() {
        this.listeners.forEach(({ el, ev, handler }) => {
            el.removeEventListener(ev, handler);
        });
    }
}

// 2. Batched DOM updates
const fragment = document.createDocumentFragment();
results.forEach(item => {
    fragment.appendChild(createCard(item));
});
container.appendChild(fragment);
// Single reflow!

// 3. Debounced input
const debouncedSearch = debounce(performSearch, 300);
input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// 4. Cached requests
const cache = new Map();
async function getEntity(id) {
    if (cache.has(id)) return cache.get(id);
    const data = await fetch(`/api/entities/${id}`);
    cache.set(id, data);
    return data;
}
```

## Performance Monitoring

### Chrome DevTools
```javascript
// Mark performance points
performance.mark('search-start');
await performSearch('zeus');
performance.mark('search-end');

performance.measure('search-duration', 'search-start', 'search-end');
const measure = performance.getEntriesByName('search-duration')[0];
console.log(`Search took ${measure.duration}ms`);
```

### Long Task Detection
```javascript
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.warn('Long task detected:', entry.duration);
    }
});
observer.observe({ entryTypes: ['longtask'] });
```

### Memory Usage (Chrome only)
```javascript
if (performance.memory) {
    console.log('Memory:', {
        usedJS: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        totalJS: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    });
}
```

## Bundle Size Optimization

### 1. Code Splitting
```javascript
// Route-based splitting
const routes = {
    '/search': () => import('./pages/search.js'),
    '/compare': () => import('./pages/compare.js'),
    '/dashboard': () => import('./pages/dashboard.js')
};
```

### 2. Tree Shaking
```javascript
// ✅ Named exports (tree-shakeable)
export const SearchView = class { ... };
export const CompareView = class { ... };

// ❌ Default export (not tree-shakeable)
export default {
    SearchView: class { ... },
    CompareView: class { ... }
};
```

### 3. Dynamic Imports
```javascript
// Load only when needed
button.addEventListener('click', async () => {
    const { HeavyComponent } = await import('./heavy-component.js');
    const instance = new HeavyComponent();
    instance.render();
});
```

## Quick Win Optimizations

1. **Enable Minification**
   - Expected: 40-60% size reduction
   - Tools: Terser, UglifyJS

2. **Enable Compression**
   - Expected: 70-80% size reduction
   - Enable: gzip or brotli

3. **Lazy Load Images**
   - Add: `loading="lazy"`
   - Impact: Faster initial load

4. **Debounce Search**
   - Delay: 300ms
   - Impact: 99% fewer API calls

5. **Implement Caching**
   - TTL: 5 seconds
   - Impact: 90% fewer requests

6. **Virtual Scrolling**
   - For: Lists > 100 items
   - Impact: Constant performance

## Performance Test Files

```
__tests__/performance/
├── performance-benchmarks.test.js  (101 lines)
│   ├── Search performance
│   ├── Large dataset handling
│   ├── Rendering performance
│   └── Load testing
│
├── memory-leak.test.js            (429 lines)
│   ├── Event listener leaks
│   ├── Timer leaks
│   ├── DOM reference cleanup
│   └── Cache management
│
├── debounce-throttle.test.js      (319 lines)
│   ├── Debounce implementation
│   ├── Throttle implementation
│   └── Performance impact
│
├── bundle-size.test.js            (354 lines)
│   ├── Component size analysis
│   ├── Bundle budget enforcement
│   └── Tree shaking opportunities
│
├── lazy-loading.test.js           (397 lines)
│   ├── Image lazy loading
│   ├── Component lazy loading
│   └── Virtual scrolling
│
└── api-optimization.test.js       (489 lines)
    ├── Request caching
    ├── Request batching
    └── Optimistic updates

Total: 2,089 lines of performance tests
```

## Performance Checklist

### Before Deployment
- [ ] Run `npm run test:performance`
- [ ] Check bundle size (< 500KB budget)
- [ ] Verify no memory leaks
- [ ] Test with slow 3G throttling
- [ ] Check Lighthouse score (> 90)
- [ ] Verify lazy loading working
- [ ] Test with 1000+ items
- [ ] Check API call counts

### During Development
- [ ] Use debounce for user input
- [ ] Use throttle for scroll/resize
- [ ] Implement proper cleanup
- [ ] Cache API responses
- [ ] Batch DOM updates
- [ ] Use `loading="lazy"` on images
- [ ] Implement pagination for large lists

### Code Review
- [ ] No memory leaks
- [ ] Event listeners removed
- [ ] Timers cleared
- [ ] DOM references cleared
- [ ] Caching implemented
- [ ] Bundle size within budget
- [ ] Performance tests passing

## Useful Commands

```bash
# Run all performance tests
npm run test:performance

# Watch specific test
npm run test:performance:watch

# Check bundle size
npm run test:performance:bundle

# Memory leak tests
npm run test:performance:memory

# Benchmarks
npm run test:performance:benchmarks

# Coverage with performance tests
npm test -- __tests__/performance --coverage

# Run single test file
npm test -- __tests__/performance/lazy-loading.test.js
```

## Resources

- **Performance Report:** `PERFORMANCE_TESTING_REPORT.md`
- **Test Files:** `__tests__/performance/`
- **Component Examples:** See individual test files
- **Best Practices:** Section 8 of Performance Report

## Quick Fixes for Common Issues

### Bundle Too Large
```bash
# 1. Enable minification in build
# 2. Implement code splitting
# 3. Remove unused dependencies
# 4. Enable gzip/brotli compression
```

### Memory Leaks
```javascript
// Always implement destroy()
destroy() {
    this.listeners.forEach(({ el, ev, handler }) => {
        el.removeEventListener(ev, handler);
    });
    this.timers.forEach(id => clearTimeout(id));
    this.elements.clear();
}
```

### Slow Search
```javascript
// Add debouncing
const debouncedSearch = debounce(performSearch, 300);
```

### Too Many API Calls
```javascript
// Add caching
const cache = new LRUCache(100);
if (cache.has(key)) return cache.get(key);
```

---

**Last Updated:** 2025-12-28
**Agent:** Test Polish Agent 5
**Tests:** 101 performance tests (91% passing)
