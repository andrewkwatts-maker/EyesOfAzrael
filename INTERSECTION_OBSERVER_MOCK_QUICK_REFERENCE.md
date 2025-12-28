# IntersectionObserver Mock - Quick Reference

## Quick Start

```javascript
test('lazy load image', () => {
  const img = document.createElement('img');
  img.dataset.src = 'image.jpg';

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      entries[0].target.src = entries[0].target.dataset.src;
    }
  });

  observer.observe(img);
  observer.triggerIntersection(img, true);

  expect(img.src).toContain('image.jpg');
});
```

## API

### Constructor
```javascript
new IntersectionObserver(callback, options)
```

### Methods
```javascript
observe(element)                      // Start watching
unobserve(element)                    // Stop watching
disconnect()                          // Stop all
triggerIntersection(element, true)    // TEST HELPER - Element visible
triggerIntersection(element, false)   // TEST HELPER - Element hidden
```

### Global Helper
```javascript
global.triggerIntersection(element, isIntersecting)
```
Triggers ALL observers watching this element.

## Common Patterns

### Pattern 1: Basic Lazy Loading
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
});

observer.observe(img);
observer.triggerIntersection(img, true);
```

### Pattern 2: Async Loading
```javascript
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    await loadData();
    container.innerHTML = '<div>Loaded</div>';
  }
});

observer.observe(container);
observer.triggerIntersection(container, true);

await new Promise(resolve => setTimeout(resolve, 0));
expect(container.innerHTML).toContain('Loaded');
```

### Pattern 3: Multiple Elements
```javascript
const images = [...Array(5)].map(() => {
  const img = document.createElement('img');
  img.dataset.src = 'image.jpg';
  return img;
});

images.forEach(img => observer.observe(img));
images.forEach(img => observer.triggerIntersection(img, true));
```

### Pattern 4: Enter/Exit Tracking
```javascript
const states = [];

const observer = new IntersectionObserver((entries) => {
  states.push(entries[0].isIntersecting);
});

observer.observe(element);
observer.triggerIntersection(element, true);   // Enter
observer.triggerIntersection(element, false);  // Exit

expect(states).toEqual([true, false]);
```

## Entry Object

```javascript
{
  target: HTMLElement,              // The observed element
  isIntersecting: true/false,       // Is visible?
  intersectionRatio: 0.0 to 1.0,   // How much is visible
  boundingClientRect: DOMRect,      // Element position
  intersectionRect: DOMRect,        // Visible portion
  rootBounds: null,                 // Viewport bounds
  time: number                      // Timestamp
}
```

## Options

```javascript
new IntersectionObserver(callback, {
  rootMargin: '50px',    // Load before visible
  threshold: 0.5,        // Trigger at 50% visible
  root: null             // Viewport (default)
});

// Access options in tests
expect(observer.options.rootMargin).toBe('50px');
```

## Troubleshooting

### Callback not firing?
```javascript
// ❌ Wrong - element not observed
observer.triggerIntersection(img, true);

// ✅ Right - observe first
observer.observe(img);
observer.triggerIntersection(img, true);
```

### Async not working?
```javascript
// ❌ Wrong - doesn't wait
observer.triggerIntersection(container, true);
expect(container.innerHTML).toContain('Loaded'); // Fails!

// ✅ Right - wait for async
observer.triggerIntersection(container, true);
await new Promise(resolve => setTimeout(resolve, 0));
expect(container.innerHTML).toContain('Loaded'); // Passes!
```

### Loading attribute fails?
```javascript
// ❌ Wrong - jsdom doesn't support property
img.loading = 'lazy';
expect(img.getAttribute('loading')).toBe('lazy'); // Fails!

// ✅ Right - use setAttribute
img.setAttribute('loading', 'lazy');
expect(img.getAttribute('loading')).toBe('lazy'); // Passes!
```

### Test timing out?
```javascript
// ❌ Wrong - insufficient timeout
test('batch load', (done) => {
  // ... loads 100 items over 960ms ...
  setTimeout(() => done(), 200); // Too short!
});

// ✅ Right - adequate timeout
test('batch load', (done) => {
  // ... loads 100 items over 960ms ...
  setTimeout(() => done(), 1100); // Enough time!
}, 15000); // Prevent Jest timeout
```

## Examples Location

See `__tests__/examples/intersection-observer-mock-usage.test.js` for 11 complete examples.

## Integration with ProgressiveLazyLoader

```javascript
// The mock works with real production code
const loader = new ProgressiveLazyLoader();
loader.setupImageLazyLoading();

// In tests, manually trigger
const lazyImg = document.querySelector('img[data-src]');
global.triggerIntersection(lazyImg, true);

expect(lazyImg.src).toBeTruthy();
expect(lazyImg.classList.contains('lazy-loaded')).toBe(true);
```

## Best Practices

✅ **DO:**
- Use `setAttribute` for attributes in jsdom
- Wait for async operations with proper delays
- Increase test timeout for long operations
- Clean up observers with `disconnect()`
- Unobserve elements after one-time loads

❌ **DON'T:**
- Assume property assignments work in jsdom
- Use short timeouts for async operations
- Forget to observe before triggering
- Leave observers running between tests
- Mix different mock implementations

## Quick Tips

💡 **Tip 1:** Use instance method for specific observer control
```javascript
observer.triggerIntersection(element, true)  // This observer only
```

💡 **Tip 2:** Use global helper for broadcast testing
```javascript
global.triggerIntersection(element, true)  // ALL observers
```

💡 **Tip 3:** Check observer state
```javascript
expect(observer.observedElements.size).toBe(5)  // How many watching?
```

💡 **Tip 4:** Test options
```javascript
expect(observer.options.rootMargin).toBe('200px')
```

💡 **Tip 5:** Verify cleanup
```javascript
observer.disconnect();
expect(observer.observedElements.size).toBe(0)
```

---

**For full documentation, see:** `FINAL_POLISH_AGENT_5_REPORT.md`
