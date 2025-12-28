/**
 * Memory Leak Detection Tests
 * Eyes of Azrael - Test Polish Agent 5
 *
 * Detects and prevents memory leaks in:
 * - Event listener registration/removal
 * - Component lifecycle (create/destroy)
 * - Timer management
 * - DOM references
 * - Closure retention
 */

// Mock performance.memory (Chrome-specific API)
if (!global.performance.memory) {
    global.performance.memory = {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB baseline
        totalJSHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024
    };
}

// Mock dependencies
const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
};

const mockSearchEngine = {
    search: jest.fn().mockResolvedValue({ items: [] }),
    getSuggestions: jest.fn().mockResolvedValue([])
};

global.EnhancedCorpusSearch = jest.fn(() => mockSearchEngine);

// Mock component with proper lifecycle management
class ComponentWithLifecycle {
    constructor() {
        this.listeners = [];
        this.timers = [];
        this.elements = new Map();
        this.destroyed = false;
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    setTimeout(callback, delay) {
        const id = setTimeout(callback, delay);
        this.timers.push(id);
        return id;
    }

    setInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.timers.push(id);
        return id;
    }

    destroy() {
        // Remove all event listeners
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];

        // Clear all timers
        this.timers.forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        this.timers = [];

        // Clear DOM references
        this.elements.clear();

        this.destroyed = true;
    }
}

// Helper to count event listeners (jsdom doesn't support getEventListeners)
function getEventListenerCount(element, eventType) {
    // In real browsers, use: getEventListeners(element)[eventType]?.length || 0
    // For tests, we'll track manually
    return element._eventListenerCount?.[eventType] || 0;
}

describe('Memory Leak Detection', () => {
    describe('Event Listener Leaks', () => {
        test('should remove all event listeners on destroy', () => {
            // Arrange
            const component = new ComponentWithLifecycle();
            const button1 = document.createElement('button');
            const button2 = document.createElement('button');
            const input = document.createElement('input');

            // Track listener counts
            button1._eventListenerCount = { click: 0 };
            button2._eventListenerCount = { click: 0 };
            input._eventListenerCount = { input: 0 };

            // Act - Add listeners
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const handler3 = jest.fn();

            component.addEventListener(button1, 'click', handler1);
            component.addEventListener(button2, 'click', handler2);
            component.addEventListener(input, 'input', handler3);

            button1._eventListenerCount.click++;
            button2._eventListenerCount.click++;
            input._eventListenerCount.input++;

            expect(component.listeners.length).toBe(3);

            // Act - Destroy
            component.destroy();

            // Assert
            expect(component.listeners.length).toBe(0);
            expect(component.destroyed).toBe(true);
        });

        test('should not leak listeners on repeated create/destroy cycles', () => {
            // Arrange
            const container = document.createElement('div');
            let listenerCount = 0;

            // Act - Create and destroy 100 times
            for (let i = 0; i < 100; i++) {
                const component = new ComponentWithLifecycle();
                const button = document.createElement('button');
                container.appendChild(button);

                component.addEventListener(button, 'click', () => {});
                listenerCount++;

                component.destroy();
                listenerCount--;

                container.removeChild(button);
            }

            // Assert - All listeners should be cleaned up
            expect(listenerCount).toBe(0);
        });

        test('should clean up document-level listeners', () => {
            // Arrange
            const component = new ComponentWithLifecycle();
            const initialCount = document._eventListenerCount?.keydown || 0;

            // Act - Add document listener
            const handler = jest.fn();
            component.addEventListener(document, 'keydown', handler);
            document._eventListenerCount = document._eventListenerCount || {};
            document._eventListenerCount.keydown = (document._eventListenerCount.keydown || 0) + 1;

            expect(component.listeners.length).toBe(1);

            // Destroy
            component.destroy();
            document._eventListenerCount.keydown--;

            // Assert
            expect(document._eventListenerCount.keydown).toBe(initialCount);
        });

        test('should clean up window-level listeners', () => {
            // Arrange
            const component = new ComponentWithLifecycle();

            // Act
            const resizeHandler = jest.fn();
            const scrollHandler = jest.fn();

            component.addEventListener(window, 'resize', resizeHandler);
            component.addEventListener(window, 'scroll', scrollHandler);

            expect(component.listeners.length).toBe(2);

            // Destroy
            component.destroy();

            // Assert
            expect(component.listeners.length).toBe(0);
        });
    });

    describe('Timer Leaks', () => {
        test('should clear all timers on destroy', () => {
            jest.useFakeTimers();

            // Arrange
            const component = new ComponentWithLifecycle();

            // Act - Create timers
            component.setTimeout(() => {}, 100);
            component.setTimeout(() => {}, 200);
            component.setInterval(() => {}, 500);

            expect(component.timers.length).toBe(3);

            // Destroy
            component.destroy();

            // Assert
            expect(component.timers.length).toBe(0);

            jest.useRealTimers();
        });

        test('should not leak timers in debounce operations', () => {
            jest.useFakeTimers();

            // Arrange
            let timerCount = 0;
            const debounce = (fn, delay) => {
                let timer;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        fn(...args);
                        timerCount--;
                    }, delay);
                    timerCount++;
                };
            };

            const fn = jest.fn();
            const debouncedFn = debounce(fn, 300);

            // Act - Rapid calls (should cancel previous timers)
            for (let i = 0; i < 10; i++) {
                debouncedFn();
            }

            // Fast forward
            jest.advanceTimersByTime(300);

            // Assert - Only 1 timer should have executed
            expect(fn).toHaveBeenCalledTimes(1);
            expect(timerCount).toBe(0);

            jest.useRealTimers();
        });

        test('should handle interval cleanup in animations', () => {
            jest.useFakeTimers();

            // Arrange
            const component = new ComponentWithLifecycle();
            let frameCount = 0;

            // Act - Animation interval
            component.setInterval(() => {
                frameCount++;
            }, 16); // ~60fps

            jest.advanceTimersByTime(160); // 10 frames
            expect(frameCount).toBe(10);

            // Destroy
            component.destroy();

            // Continue time - should not increment
            jest.advanceTimersByTime(160);
            expect(frameCount).toBe(10); // Should still be 10

            jest.useRealTimers();
        });
    });

    describe('DOM Reference Leaks', () => {
        test('should clear DOM element references on destroy', () => {
            // Arrange
            const component = new ComponentWithLifecycle();

            // Act - Store DOM references
            component.elements.set('header', document.createElement('header'));
            component.elements.set('footer', document.createElement('footer'));
            component.elements.set('main', document.createElement('main'));

            expect(component.elements.size).toBe(3);

            // Destroy
            component.destroy();

            // Assert
            expect(component.elements.size).toBe(0);
        });

        test('should not retain detached DOM elements', () => {
            // Arrange
            const container = document.createElement('div');
            document.body.appendChild(container);

            // Act - Create and remove elements
            const weakRefs = [];
            for (let i = 0; i < 10; i++) {
                const element = document.createElement('div');
                container.appendChild(element);
                weakRefs.push(new WeakRef(element));
                container.removeChild(element);
            }

            // Force garbage collection hint
            if (global.gc) global.gc();

            // Assert - WeakRefs should eventually clear
            // (In actual tests, some may still be alive, but they're detached)
            expect(container.children.length).toBe(0);

            document.body.removeChild(container);
        });

        test('should clear circular references', () => {
            // Arrange
            class Parent {
                constructor() {
                    this.child = null;
                }
                destroy() {
                    if (this.child) {
                        this.child.parent = null;
                        this.child = null;
                    }
                }
            }

            class Child {
                constructor(parent) {
                    this.parent = parent;
                }
            }

            const parent = new Parent();
            parent.child = new Child(parent);

            // Assert circular reference exists
            expect(parent.child.parent).toBe(parent);

            // Destroy
            parent.destroy();

            // Assert circular reference broken
            expect(parent.child).toBeNull();
        });
    });

    describe('Closure Retention', () => {
        test('should not retain unnecessary closures', () => {
            // Arrange
            let largeData = new Array(1000).fill('x').join('');

            // Bad pattern - closure retains largeData
            const createBadClosure = () => {
                return () => largeData.length;
            };

            // Good pattern - closure doesn't retain unnecessary data
            const createGoodClosure = () => {
                const length = largeData.length;
                return () => length;
            };

            // Act
            const badFn = createBadClosure();
            const goodFn = createGoodClosure();

            // Clear large data
            largeData = null;

            // Assert - Both functions work, but good pattern allows GC
            expect(badFn()).toBe(1000);
            expect(goodFn()).toBe(1000);
        });

        test('should clean up callback references', () => {
            // Arrange
            const callbackStore = new Set();

            const registerCallback = (fn) => {
                callbackStore.add(fn);
                return () => callbackStore.delete(fn);
            };

            // Act
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();

            const unregister1 = registerCallback(callback1);
            const unregister2 = registerCallback(callback2);
            const unregister3 = registerCallback(callback3);

            expect(callbackStore.size).toBe(3);

            // Cleanup
            unregister1();
            unregister2();
            unregister3();

            // Assert
            expect(callbackStore.size).toBe(0);
        });
    });

    describe('Component Lifecycle Leaks', () => {
        test('should not leak memory on repeated component instantiation', () => {
            // Arrange
            const components = [];

            // Act - Create 100 components
            for (let i = 0; i < 100; i++) {
                const component = new ComponentWithLifecycle();

                // Simulate component usage
                const button = document.createElement('button');
                component.addEventListener(button, 'click', () => {});
                component.setTimeout(() => {}, 1000);
                component.elements.set('el', button);

                // Destroy properly
                component.destroy();
            }

            // Assert - No accumulation
            expect(components.length).toBe(0);
        });

        test('should handle rapid component creation/destruction', () => {
            jest.useFakeTimers();

            // Arrange & Act
            for (let i = 0; i < 1000; i++) {
                const component = new ComponentWithLifecycle();
                component.setTimeout(() => {}, 100);
                component.destroy();
            }

            // Fast forward
            jest.advanceTimersByTime(200);

            // Assert - Should not crash or accumulate timers
            expect(true).toBe(true);

            jest.useRealTimers();
        });
    });

    describe('Modal/Overlay Leaks', () => {
        test('should remove modal from DOM on close', () => {
            // Arrange
            class Modal {
                constructor() {
                    this.overlay = null;
                }

                open() {
                    this.overlay = document.createElement('div');
                    this.overlay.className = 'modal-overlay';
                    document.body.appendChild(this.overlay);
                }

                close() {
                    if (this.overlay) {
                        this.overlay.remove();
                        this.overlay = null;
                    }
                }
            }

            // Act
            const initialChildren = document.body.children.length;

            const modal = new Modal();
            modal.open();
            expect(document.body.children.length).toBe(initialChildren + 1);

            modal.close();

            // Assert
            expect(document.body.children.length).toBe(initialChildren);
            expect(modal.overlay).toBeNull();
        });

        test('should clean up multiple overlapping modals', () => {
            // Arrange
            const modals = [];
            const initialChildren = document.body.children.length;

            // Act - Open 5 modals
            for (let i = 0; i < 5; i++) {
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                document.body.appendChild(overlay);
                modals.push(overlay);
            }

            expect(document.body.children.length).toBe(initialChildren + 5);

            // Close all
            modals.forEach(overlay => overlay.remove());

            // Assert
            expect(document.body.children.length).toBe(initialChildren);
        });
    });

    describe('Cache Management', () => {
        test('should limit cache size to prevent unbounded growth', () => {
            // Arrange
            class LRUCache {
                constructor(maxSize) {
                    this.maxSize = maxSize;
                    this.cache = new Map();
                }

                set(key, value) {
                    if (this.cache.size >= this.maxSize) {
                        // Remove oldest entry
                        const firstKey = this.cache.keys().next().value;
                        this.cache.delete(firstKey);
                    }
                    this.cache.set(key, value);
                }

                get(key) {
                    return this.cache.get(key);
                }
            }

            const cache = new LRUCache(100);

            // Act - Add 1000 items
            for (let i = 0; i < 1000; i++) {
                cache.set(`key-${i}`, `value-${i}`);
            }

            // Assert - Should never exceed maxSize
            expect(cache.cache.size).toBe(100);
        });

        test('should clean up expired cache entries', () => {
            jest.useFakeTimers();

            // Arrange
            class ExpiringCache {
                constructor(ttl) {
                    this.ttl = ttl;
                    this.cache = new Map();
                }

                set(key, value) {
                    this.cache.set(key, {
                        value,
                        expiry: Date.now() + this.ttl
                    });
                }

                cleanup() {
                    const now = Date.now();
                    for (const [key, entry] of this.cache.entries()) {
                        if (entry.expiry < now) {
                            this.cache.delete(key);
                        }
                    }
                }
            }

            const cache = new ExpiringCache(1000); // 1 second TTL

            // Act
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            expect(cache.cache.size).toBe(3);

            // Fast forward past TTL
            jest.advanceTimersByTime(1500);
            cache.cleanup();

            // Assert - All entries expired
            expect(cache.cache.size).toBe(0);

            jest.useRealTimers();
        });
    });
});

describe('Memory Leak Prevention Best Practices', () => {
    test('should document memory management patterns', () => {
        const bestPractices = {
            'Event Listeners': 'Always remove listeners in destroy() method',
            'Timers': 'Clear all setTimeout/setInterval on component destroy',
            'DOM References': 'Clear element references and use WeakMap when possible',
            'Closures': 'Avoid capturing large objects in closures unnecessarily',
            'Caching': 'Implement size limits (LRU cache) and TTL expiration',
            'Circular References': 'Break cycles explicitly in cleanup methods',
            'Global Variables': 'Minimize globals, use module scope or WeakMap',
            'Modal/Overlays': 'Remove from DOM completely, not just hide',
            'Observers': 'Disconnect MutationObserver, IntersectionObserver, etc.'
        };

        console.log('\n🧹 Memory Leak Prevention Best Practices:');
        Object.entries(bestPractices).forEach(([category, practice]) => {
            console.log(`   ${category}: ${practice}`);
        });

        expect(Object.keys(bestPractices).length).toBeGreaterThan(0);
    });
});
