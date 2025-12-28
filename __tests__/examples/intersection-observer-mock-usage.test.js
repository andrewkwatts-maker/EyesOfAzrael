/**
 * IntersectionObserver Mock Usage Examples
 * Eyes of Azrael - Test Polish Agent 5
 *
 * This file demonstrates how to use the global IntersectionObserver mock
 * that's configured in __tests__/setup.js
 */

/* ============================================================================
 * BASIC USAGE EXAMPLE
 * ========================================================================== */

test('Example: Basic lazy image loading', () => {
    // Arrange - Create an image with data-src
    const img = document.createElement('img');
    img.setAttribute('data-src', 'deity-image.jpg');
    img.setAttribute('loading', 'lazy');
    document.body.appendChild(img);

    // Create observer that loads images when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                target.src = target.dataset.src;
                observer.unobserve(target);
            }
        });
    });

    observer.observe(img);

    // Initially not loaded
    expect(img.src).toBe('');

    // Act - Trigger intersection using the global helper
    global.triggerIntersection(img, true);

    // Assert - Image is now loaded
    expect(img.src).toContain('deity-image.jpg');

    // Cleanup
    document.body.removeChild(img);
});

/* ============================================================================
 * MANUAL TRIGGER EXAMPLE
 * ========================================================================== */

test('Example: Manually trigger intersection on specific observer', () => {
    const element = document.createElement('div');
    let wasIntersecting = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                wasIntersecting = true;
            }
        });
    });

    observer.observe(element);

    // Act - Manually trigger on this observer instance
    observer.triggerIntersection(element, true);

    // Assert
    expect(wasIntersecting).toBe(true);
});

/* ============================================================================
 * MULTIPLE ELEMENTS EXAMPLE
 * ========================================================================== */

test('Example: Observe multiple elements', () => {
    const images = Array.from({ length: 5 }, (_, i) => {
        const img = document.createElement('img');
        img.dataset.src = `image-${i}.jpg`;
        return img;
    });

    let loadedCount = 0;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.src = entry.target.dataset.src;
                loadedCount++;
                observer.unobserve(entry.target);
            }
        });
    });

    // Observe all images
    images.forEach(img => observer.observe(img));

    // Trigger intersection for each image
    images.forEach(img => observer.triggerIntersection(img, true));

    // All images loaded
    expect(loadedCount).toBe(5);
    images.forEach((img, i) => {
        expect(img.src).toContain(`image-${i}.jpg`);
    });
});

/* ============================================================================
 * ASYNC LOADING EXAMPLE
 * ========================================================================== */

test('Example: Async component loading', async () => {
    const container = document.createElement('div');
    container.dataset.component = 'MythologyCard';

    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const target = entry.target;
                const componentName = target.dataset.component;

                // Simulate async component load
                await new Promise(resolve => setTimeout(resolve, 10));
                target.innerHTML = `<div class="${componentName}">Loaded</div>`;

                observer.unobserve(target);
            }
        }
    });

    observer.observe(container);

    // Trigger intersection
    observer.triggerIntersection(container, true);

    // Wait for async load
    await new Promise(resolve => setTimeout(resolve, 20));

    // Component should be loaded
    expect(container.innerHTML).toContain('MythologyCard');
});

/* ============================================================================
 * OPTIONS TESTING EXAMPLE
 * ========================================================================== */

test('Example: Test observer with rootMargin option', () => {
    const observer = new IntersectionObserver(() => {}, {
        rootMargin: '200px',
        threshold: 0.5
    });

    // Options are stored and can be tested
    expect(observer.options.rootMargin).toBe('200px');
    expect(observer.options.threshold).toBe(0.5);
});

/* ============================================================================
 * ENTER/EXIT VIEWPORT EXAMPLE
 * ========================================================================== */

test('Example: Track element entering and exiting viewport', () => {
    const element = document.createElement('div');
    const visibilityStates = [];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            visibilityStates.push({
                isIntersecting: entry.isIntersecting,
                ratio: entry.intersectionRatio
            });
        });
    });

    observer.observe(element);

    // Element enters viewport
    observer.triggerIntersection(element, true);

    // Element exits viewport
    observer.triggerIntersection(element, false);

    // Check visibility states
    expect(visibilityStates).toHaveLength(2);
    expect(visibilityStates[0].isIntersecting).toBe(true);
    expect(visibilityStates[0].ratio).toBe(1.0);
    expect(visibilityStates[1].isIntersecting).toBe(false);
    expect(visibilityStates[1].ratio).toBe(0.0);
});

/* ============================================================================
 * CLEANUP EXAMPLE
 * ========================================================================== */

test('Example: Observer cleanup and disconnection', () => {
    const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
    ];

    const observer = new IntersectionObserver(() => {});

    // Observe multiple elements
    elements.forEach(el => observer.observe(el));

    expect(observer.observedElements.size).toBe(3);

    // Unobserve one
    observer.unobserve(elements[0]);
    expect(observer.observedElements.size).toBe(2);

    // Disconnect all
    observer.disconnect();
    expect(observer.observedElements.size).toBe(0);
});

/* ============================================================================
 * GLOBAL HELPER EXAMPLE
 * ========================================================================== */

test('Example: Using global triggerIntersection helper', () => {
    const img1 = document.createElement('img');
    const img2 = document.createElement('img');
    let img1Loaded = false;
    let img2Loaded = false;

    const observer1 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target === img1) {
                img1Loaded = true;
            }
        });
    });

    const observer2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target === img2) {
                img2Loaded = true;
            }
        });
    });

    observer1.observe(img1);
    observer2.observe(img2);

    // Global helper triggers ALL observers
    global.triggerIntersection(img1, true);

    // Only img1 should be loaded
    expect(img1Loaded).toBe(true);
    expect(img2Loaded).toBe(false);
});

/* ============================================================================
 * PROGRESSIVE LAZY LOADER INTEGRATION EXAMPLE
 * ========================================================================== */

test('Example: Integration with ProgressiveLazyLoader pattern', () => {
    // Setup lazy images
    const lazyImages = Array.from({ length: 10 }, (_, i) => {
        const img = document.createElement('img');
        img.dataset.src = `https://example.com/deity-${i}.jpg`;
        img.className = 'lazy-image';
        return img;
    });

    // Simulate the setupImageLazyLoading method
    const setupImageLazyLoading = () => {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // Load the actual image
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }

                    // Add loaded class for fade-in effect
                    img.classList.add('lazy-loaded');

                    // Stop observing this image
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before entering viewport
        });

        return imageObserver;
    };

    const observer = setupImageLazyLoading();
    lazyImages.forEach(img => observer.observe(img));

    // Trigger intersection for first 3 images
    lazyImages.slice(0, 3).forEach(img => {
        observer.triggerIntersection(img, true);
    });

    // First 3 should be loaded
    expect(lazyImages[0].src).toContain('deity-0.jpg');
    expect(lazyImages[1].src).toContain('deity-1.jpg');
    expect(lazyImages[2].src).toContain('deity-2.jpg');
    expect(lazyImages[0].classList.contains('lazy-loaded')).toBe(true);

    // Rest should not be loaded
    expect(lazyImages[3].src).toBe('');
    expect(lazyImages[9].src).toBe('');

    // First 3 should be unobserved
    expect(observer.observedElements.size).toBe(7);
});

/* ============================================================================
 * EDGE CASES
 * ========================================================================== */

test('Example: Handle elements without getBoundingClientRect', () => {
    // Create a minimal element without the method
    const element = {};

    const observer = new IntersectionObserver((entries) => {
        // Should receive entry with fallback bounds
        expect(entries[0].boundingClientRect).toBeDefined();
        expect(entries[0].intersectionRect).toBeDefined();
    });

    observer.observedElements.add(element);
    observer.triggerIntersection(element, true);
});

test('Example: Multiple observers on same element', () => {
    const element = document.createElement('div');
    let observer1Triggered = false;
    let observer2Triggered = false;

    const observer1 = new IntersectionObserver(() => {
        observer1Triggered = true;
    });

    const observer2 = new IntersectionObserver(() => {
        observer2Triggered = true;
    });

    observer1.observe(element);
    observer2.observe(element);

    // Trigger on observer1 only
    observer1.triggerIntersection(element, true);

    expect(observer1Triggered).toBe(true);
    expect(observer2Triggered).toBe(false);
});
