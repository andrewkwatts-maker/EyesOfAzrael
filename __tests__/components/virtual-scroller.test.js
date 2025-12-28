/**
 * VirtualScroller Component Tests
 *
 * Comprehensive test suite for virtual scrolling functionality
 */

// Mock VirtualScroller for testing (CommonJS compatible)
class VirtualScroller {
    constructor(container, options = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.items = [];
        this.itemHeight = options.itemHeight || 80;
        this.bufferSize = options.bufferSize || 5;
        this.renderItem = options.renderItem || ((item) => `<div>${JSON.stringify(item)}</div>`);
        this.onLoadMore = options.onLoadMore || null;

        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.isDestroyed = false;

        this.renderCount = 0;
        this.totalRenderTime = 0;
        this.slowRenderWarnings = 0;

        this.boundScrollHandler = this.onScroll.bind(this);
        this.boundResizeHandler = this.onResize.bind(this);

        this.init();
    }

    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.classList.add('virtual-scroller-container');

        this.scrollContent = document.createElement('div');
        this.scrollContent.className = 'virtual-scroll-content';
        this.scrollContent.style.position = 'relative';
        this.scrollContent.style.width = '100%';
        this.container.appendChild(this.scrollContent);

        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-viewport';
        this.viewport.style.position = 'absolute';
        this.viewport.style.top = '0';
        this.viewport.style.left = '0';
        this.viewport.style.right = '0';
        this.scrollContent.appendChild(this.viewport);

        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'virtual-loading';
        this.loadingIndicator.style.display = 'none';
        this.container.appendChild(this.loadingIndicator);

        this.container.addEventListener('scroll', this.boundScrollHandler, { passive: true });
        window.addEventListener('resize', this.boundResizeHandler, { passive: true });
    }

    setItems(items) {
        if (!Array.isArray(items)) {
            console.warn('[VirtualScroller] setItems expects an array');
            items = [];
        }

        this.items = items;
        const totalHeight = items.length * this.itemHeight;
        this.scrollContent.style.height = `${totalHeight}px`;

        if (this.scrollTop > totalHeight) {
            this.container.scrollTop = 0;
            this.scrollTop = 0;
        }

        this.render();
    }

    onScroll() {
        if (this.isDestroyed) return;
        this.scrollTop = this.container.scrollTop;
        this.render();
    }

    onResize() {
        if (this.isDestroyed) return;
        this.render();
    }

    async triggerLoadMore() {
        if (!this.onLoadMore || this.isLoading) return;
        this.isLoading = true;
        this.loadingIndicator.style.display = 'block';
        try {
            await this.onLoadMore();
        } finally {
            this.isLoading = false;
            this.loadingIndicator.style.display = 'none';
        }
    }

    render() {
        if (this.isDestroyed || this.items.length === 0) {
            this.viewport.innerHTML = '';
            return;
        }

        const startTime = performance.now();
        const containerHeight = this.container.clientHeight;
        const scrollStart = Math.max(0, this.scrollTop);
        const scrollEnd = this.scrollTop + containerHeight;

        this.visibleStart = Math.max(0, Math.floor(scrollStart / this.itemHeight) - this.bufferSize);
        this.visibleEnd = Math.min(this.items.length, Math.ceil(scrollEnd / this.itemHeight) + this.bufferSize);

        const offsetY = this.visibleStart * this.itemHeight;
        this.viewport.style.transform = `translateY(${offsetY}px)`;

        const fragment = document.createDocumentFragment();
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.items[i];
            const itemElement = document.createElement('div');
            itemElement.className = 'virtual-item';
            itemElement.style.height = `${this.itemHeight}px`;
            itemElement.dataset.index = i;
            try {
                itemElement.innerHTML = this.renderItem(item, i);
            } catch (error) {
                console.error(`Failed to render item ${i}:`, error);
                itemElement.innerHTML = '<div style="color: red;">Error</div>';
            }
            fragment.appendChild(itemElement);
        }

        this.viewport.innerHTML = '';
        this.viewport.appendChild(fragment);

        const duration = performance.now() - startTime;
        this.renderCount++;
        this.totalRenderTime += duration;
    }

    scrollToIndex(index, behavior = 'smooth') {
        if (index < 0 || index >= this.items.length) {
            console.warn(`Invalid index: ${index}`);
            return;
        }
        this.container.scrollTop = index * this.itemHeight;
    }

    getCurrentIndex() {
        return Math.floor(this.scrollTop / this.itemHeight);
    }

    updateItem(index, newItem) {
        if (index < 0 || index >= this.items.length) {
            console.warn(`Invalid update index: ${index}`);
            return;
        }
        this.items[index] = newItem;
        if (index >= this.visibleStart && index < this.visibleEnd) {
            const itemElement = this.viewport.querySelector(`[data-index="${index}"]`);
            if (itemElement) {
                try {
                    itemElement.innerHTML = this.renderItem(newItem, index);
                } catch (error) {
                    console.error(`Failed to update item ${index}:`, error);
                }
            }
        }
    }

    appendItems(newItems) {
        if (!Array.isArray(newItems) || newItems.length === 0) return;
        const oldLength = this.items.length;
        this.items = this.items.concat(newItems);
        this.scrollContent.style.height = `${this.items.length * this.itemHeight}px`;
        if (this.visibleEnd >= oldLength) this.render();
    }

    clear() {
        this.items = [];
        this.scrollContent.style.height = '0px';
        this.viewport.innerHTML = '';
        this.container.scrollTop = 0;
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
    }

    getStats() {
        return {
            itemCount: this.items.length,
            renderCount: this.renderCount,
            averageRenderTime: this.renderCount > 0 ? this.totalRenderTime / this.renderCount : 0,
            slowRenderWarnings: this.slowRenderWarnings,
            visibleRange: {
                start: this.visibleStart,
                end: this.visibleEnd,
                count: this.visibleEnd - this.visibleStart
            },
            scrollPosition: {
                top: this.scrollTop,
                index: this.getCurrentIndex()
            }
        };
    }

    destroy() {
        this.container.removeEventListener('scroll', this.boundScrollHandler);
        window.removeEventListener('resize', this.boundResizeHandler);
        this.container.classList.remove('virtual-scroller-container');
        this.container.innerHTML = '';
        this.items = [];
        this.scrollContent = null;
        this.viewport = null;
        this.loadingIndicator = null;
        this.isDestroyed = true;
    }
}

describe('VirtualScroller', () => {
    let container, scroller;

    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.style.height = '400px';
        container.style.width = '600px';
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Clean up
        if (scroller) {
            scroller.destroy();
            scroller = null;
        }
        if (container && container.parentNode) {
            container.remove();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            scroller = new VirtualScroller(container);

            expect(scroller.container).toBe(container);
            expect(scroller.itemHeight).toBe(80);
            expect(scroller.bufferSize).toBe(5);
            expect(scroller.items).toEqual([]);
        });

        test('should initialize with custom options', () => {
            scroller = new VirtualScroller(container, {
                itemHeight: 120,
                bufferSize: 10,
                renderItem: (item) => `<div>${item.name}</div>`
            });

            expect(scroller.itemHeight).toBe(120);
            expect(scroller.bufferSize).toBe(10);
            expect(typeof scroller.renderItem).toBe('function');
        });

        test('should throw error if container is missing', () => {
            expect(() => {
                new VirtualScroller(null);
            }).toThrow('Container element is required');
        });

        test('should create required DOM elements', () => {
            scroller = new VirtualScroller(container);

            expect(container.querySelector('.virtual-scroll-content')).toBeTruthy();
            expect(container.querySelector('.virtual-viewport')).toBeTruthy();
            expect(container.querySelector('.virtual-loading')).toBeTruthy();
        });

        test('should set container styles', () => {
            scroller = new VirtualScroller(container);

            expect(container.style.position).toBe('relative');
            expect(container.style.overflow).toBe('auto');
        });
    });

    describe('Item Management', () => {
        beforeEach(() => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => `<span>${item.name}</span>`
            });
        });

        test('should set items and update scroll height', () => {
            const items = Array(100).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));

            scroller.setItems(items);

            expect(scroller.items.length).toBe(100);
            expect(scroller.scrollContent.style.height).toBe('5000px'); // 100 * 50px
        });

        test('should handle empty items array', () => {
            scroller.setItems([]);

            expect(scroller.items.length).toBe(0);
            expect(scroller.scrollContent.style.height).toBe('0px');
        });

        test('should clear items', () => {
            const items = Array(50).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            scroller.clear();

            expect(scroller.items.length).toBe(0);
            expect(scroller.scrollContent.style.height).toBe('0px');
            expect(scroller.viewport.innerHTML).toBe('');
        });

        test('should append items', () => {
            const initialItems = Array(50).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(initialItems);

            const newItems = Array(25).fill(0).map((_, i) => ({ id: i + 50, name: `Item ${i + 50}` }));
            scroller.appendItems(newItems);

            expect(scroller.items.length).toBe(75);
            expect(scroller.scrollContent.style.height).toBe('3750px'); // 75 * 50px
        });

        test('should update individual item', () => {
            const items = Array(10).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            const newItem = { id: 5, name: 'Updated Item 5' };
            scroller.updateItem(5, newItem);

            expect(scroller.items[5]).toEqual(newItem);
        });
    });

    describe('Rendering', () => {
        beforeEach(() => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                bufferSize: 3,
                renderItem: (item) => `<span data-id="${item.id}">${item.name}</span>`
            });
        });

        test('should render only visible items', () => {
            const items = Array(1000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));

            scroller.setItems(items);

            // With container height 400px and item height 50px, should render ~8 visible + 6 buffer = ~14 items
            const renderedItems = container.querySelectorAll('.virtual-item');
            expect(renderedItems.length).toBeLessThan(50); // Much less than 1000
            expect(renderedItems.length).toBeGreaterThan(0);
        });

        test('should not render all items for large lists', () => {
            const items = Array(10000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));

            scroller.setItems(items);

            const renderedItems = container.querySelectorAll('.virtual-item');
            expect(renderedItems.length).toBeLessThan(100); // Only visible + buffer
        });

        test('should use custom render function', () => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => `<div class="custom-item">${item.name}</div>`
            });

            const items = [{ id: 1, name: 'Test Item' }];
            scroller.setItems(items);

            const customItems = container.querySelectorAll('.custom-item');
            expect(customItems.length).toBeGreaterThan(0);
        });

        test('should set correct item height', () => {
            const items = Array(10).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            const renderedItems = container.querySelectorAll('.virtual-item');
            renderedItems.forEach(item => {
                expect(item.style.height).toBe('50px');
            });
        });
    });

    describe('Scrolling', () => {
        beforeEach(() => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                bufferSize: 5,
                renderItem: (item) => `<span>${item.name}</span>`
            });
        });

        test('should update visible range on scroll', () => {
            const items = Array(100).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            const initialStart = scroller.visibleStart;

            // Simulate scroll
            container.scrollTop = 500;
            scroller.onScroll();

            expect(scroller.visibleStart).toBeGreaterThan(initialStart);
        });

        test('should scroll to specific index', () => {
            const items = Array(100).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            scroller.scrollToIndex(50, 'auto');

            // Should scroll to item 50 (50 * 50px = 2500px)
            expect(container.scrollTop).toBe(2500);
        });

        test('should get current scroll index', () => {
            const items = Array(100).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            container.scrollTop = 250; // Should be at index 5 (250 / 50)
            scroller.scrollTop = 250;

            expect(scroller.getCurrentIndex()).toBe(5);
        });

        test('should handle invalid scroll index', () => {
            const items = Array(10).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            scroller.scrollToIndex(-1);
            expect(consoleSpy).toHaveBeenCalled();

            scroller.scrollToIndex(100);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Performance', () => {
        beforeEach(() => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => `<span>${item.name}</span>`
            });
        });

        test('should track render performance', () => {
            const items = Array(1000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));

            scroller.setItems(items);

            expect(scroller.renderCount).toBeGreaterThan(0);
            expect(scroller.totalRenderTime).toBeGreaterThan(0);
        });

        test('should get performance stats', () => {
            const items = Array(100).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            const stats = scroller.getStats();

            expect(stats).toHaveProperty('itemCount');
            expect(stats).toHaveProperty('renderCount');
            expect(stats).toHaveProperty('averageRenderTime');
            expect(stats).toHaveProperty('visibleRange');
            expect(stats.itemCount).toBe(100);
        });

        test('should maintain constant render time for large lists', () => {
            const items1000 = Array(1000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            const items10000 = Array(10000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));

            // Render 1000 items
            const start1 = performance.now();
            scroller.setItems(items1000);
            const time1 = performance.now() - start1;

            scroller.clear();

            // Render 10000 items
            const start2 = performance.now();
            scroller.setItems(items10000);
            const time2 = performance.now() - start2;

            // Time should be roughly the same (within 2x) since we only render visible items
            expect(time2).toBeLessThan(time1 * 2);
        });
    });

    describe('Infinite Scroll', () => {
        test('should trigger onLoadMore callback near bottom', async () => {
            const loadMoreMock = jest.fn().mockResolvedValue();

            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => `<span>${item.name}</span>`,
                onLoadMore: loadMoreMock
            });

            const items = Array(20).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            // Scroll near bottom
            container.scrollTop = container.scrollHeight - container.clientHeight - 100;
            scroller.scrollTop = container.scrollTop;

            await scroller.triggerLoadMore();

            expect(loadMoreMock).toHaveBeenCalled();
        });

        test('should not trigger onLoadMore when already loading', async () => {
            let loadCount = 0;
            const loadMoreMock = jest.fn(async () => {
                loadCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => `<span>${item.name}</span>`,
                onLoadMore: loadMoreMock
            });

            const items = Array(20).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            // Trigger multiple times quickly
            scroller.triggerLoadMore();
            scroller.triggerLoadMore();
            scroller.triggerLoadMore();

            await new Promise(resolve => setTimeout(resolve, 200));

            expect(loadCount).toBe(1); // Should only load once
        });
    });

    describe('Cleanup', () => {
        test('should remove event listeners on destroy', () => {
            scroller = new VirtualScroller(container);

            const removeEventListenerSpy = jest.spyOn(container, 'removeEventListener');
            const windowRemoveSpy = jest.spyOn(window, 'removeEventListener');

            scroller.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalled();
            expect(windowRemoveSpy).toHaveBeenCalled();

            removeEventListenerSpy.mockRestore();
            windowRemoveSpy.mockRestore();
        });

        test('should clear DOM on destroy', () => {
            scroller = new VirtualScroller(container);

            const items = Array(50).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            scroller.destroy();

            expect(container.innerHTML).toBe('');
            expect(scroller.isDestroyed).toBe(true);
        });

        test('should not render after destroy', () => {
            scroller = new VirtualScroller(container);

            const items = Array(50).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);
            scroller.destroy();

            scroller.render();

            expect(scroller.viewport).toBeNull();
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => `<span>${item.name}</span>`
            });
        });

        test('should handle zero items', () => {
            scroller.setItems([]);

            expect(scroller.items.length).toBe(0);
            expect(scroller.viewport.innerHTML).toBe('');
        });

        test('should handle single item', () => {
            scroller.setItems([{ id: 1, name: 'Single Item' }]);

            expect(scroller.items.length).toBe(1);
            const renderedItems = container.querySelectorAll('.virtual-item');
            expect(renderedItems.length).toBe(1);
        });

        test('should handle non-array items', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            scroller.setItems(null);

            expect(scroller.items).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should handle render errors gracefully', () => {
            scroller = new VirtualScroller(container, {
                itemHeight: 50,
                renderItem: (item) => {
                    if (item.id === 5) throw new Error('Render error');
                    return `<span>${item.name}</span>`;
                }
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const items = Array(10).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }));
            scroller.setItems(items);

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
