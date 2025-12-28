/**
 * VirtualScroller Component
 *
 * Renders only visible items in a large list for constant O(1) performance
 * regardless of list size. Maintains smooth 60fps scrolling even with 10,000+ items.
 *
 * Features:
 * - Only renders visible items + buffer
 * - Constant rendering time regardless of list size
 * - Smooth scrolling performance
 * - Memory efficient (low DOM node count)
 * - Infinite scroll support
 * - Performance monitoring
 *
 * @example
 * const scroller = new VirtualScroller(container, {
 *   itemHeight: 120,
 *   bufferSize: 10,
 *   renderItem: (item, index) => `<div>${item.name}</div>`
 * });
 * scroller.setItems(largeArray);
 */

export class VirtualScroller {
    constructor(container, options = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.items = [];

        // Configuration
        this.itemHeight = options.itemHeight || 80;
        this.bufferSize = options.bufferSize || 5;
        this.renderItem = options.renderItem || ((item) => `<div>${JSON.stringify(item)}</div>`);
        this.onLoadMore = options.onLoadMore || null;

        // State
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.isDestroyed = false;

        // Performance tracking
        this.renderCount = 0;
        this.totalRenderTime = 0;
        this.slowRenderWarnings = 0;

        // Scroll event handler (bound for cleanup)
        this.boundScrollHandler = this.onScroll.bind(this);
        this.boundResizeHandler = this.onResize.bind(this);

        this.init();
    }

    /**
     * Initialize the virtual scroller DOM structure and event listeners
     */
    init() {
        // Set container styles
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        this.container.classList.add('virtual-scroller-container');

        // Create scrollable content (spacer to enable scrolling)
        this.scrollContent = document.createElement('div');
        this.scrollContent.className = 'virtual-scroll-content';
        this.scrollContent.style.position = 'relative';
        this.scrollContent.style.width = '100%';
        this.container.appendChild(this.scrollContent);

        // Create viewport for visible items
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-viewport';
        this.viewport.style.position = 'absolute';
        this.viewport.style.top = '0';
        this.viewport.style.left = '0';
        this.viewport.style.right = '0';
        this.viewport.style.willChange = 'transform';
        this.scrollContent.appendChild(this.viewport);

        // Create loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'virtual-loading';
        this.loadingIndicator.innerHTML = '<div class="spinner"></div><p>Loading more...</p>';
        this.loadingIndicator.style.display = 'none';
        this.container.appendChild(this.loadingIndicator);

        // Attach event listeners
        this.container.addEventListener('scroll', this.boundScrollHandler, { passive: true });
        window.addEventListener('resize', this.boundResizeHandler, { passive: true });

        console.log('[VirtualScroller] Initialized with itemHeight:', this.itemHeight, 'bufferSize:', this.bufferSize);
    }

    /**
     * Set items to display
     * @param {Array} items - Array of items to render
     */
    setItems(items) {
        if (!Array.isArray(items)) {
            console.warn('[VirtualScroller] setItems expects an array, got:', typeof items);
            items = [];
        }

        this.items = items;

        // Update scroll content height to accommodate all items
        const totalHeight = items.length * this.itemHeight;
        this.scrollContent.style.height = `${totalHeight}px`;

        console.log(`[VirtualScroller] Set ${items.length} items (total height: ${totalHeight}px)`);

        // Reset scroll position if items changed significantly
        if (this.scrollTop > totalHeight) {
            this.container.scrollTop = 0;
            this.scrollTop = 0;
        }

        // Initial render
        this.render();
    }

    /**
     * Handle scroll events
     */
    onScroll() {
        if (this.isDestroyed) return;

        this.scrollTop = this.container.scrollTop;

        // Check if we need to load more items (infinite scroll)
        if (this.onLoadMore) {
            const scrollHeight = this.container.scrollHeight;
            const clientHeight = this.container.clientHeight;
            const scrollBottom = this.scrollTop + clientHeight;

            // Trigger load more when within 200px of bottom
            if (scrollHeight - scrollBottom < 200 && !this.isLoading) {
                this.triggerLoadMore();
            }
        }

        // Re-render visible items
        this.render();
    }

    /**
     * Handle window resize
     */
    onResize() {
        if (this.isDestroyed) return;

        // Re-render to adjust for new viewport size
        this.render();
    }

    /**
     * Trigger load more callback
     */
    async triggerLoadMore() {
        if (!this.onLoadMore || this.isLoading) return;

        this.isLoading = true;
        this.loadingIndicator.style.display = 'block';

        try {
            await this.onLoadMore();
        } catch (error) {
            console.error('[VirtualScroller] Load more failed:', error);
        } finally {
            this.isLoading = false;
            this.loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Render only visible items
     */
    render() {
        if (this.isDestroyed || this.items.length === 0) {
            this.viewport.innerHTML = '';
            return;
        }

        const startTime = performance.now();

        const containerHeight = this.container.clientHeight;

        // Calculate visible range with buffer
        const scrollStart = Math.max(0, this.scrollTop);
        const scrollEnd = this.scrollTop + containerHeight;

        this.visibleStart = Math.max(0,
            Math.floor(scrollStart / this.itemHeight) - this.bufferSize
        );
        this.visibleEnd = Math.min(this.items.length,
            Math.ceil(scrollEnd / this.itemHeight) + this.bufferSize
        );

        // Calculate viewport offset (for smooth scrolling)
        const offsetY = this.visibleStart * this.itemHeight;
        this.viewport.style.transform = `translateY(${offsetY}px)`;

        // Render only visible items
        const fragment = document.createDocumentFragment();

        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.items[i];
            const itemElement = document.createElement('div');
            itemElement.className = 'virtual-item';
            itemElement.style.height = `${this.itemHeight}px`;
            itemElement.style.overflow = 'hidden';
            itemElement.dataset.index = i;

            try {
                const renderedContent = this.renderItem(item, i);
                itemElement.innerHTML = renderedContent;
            } catch (error) {
                console.error(`[VirtualScroller] Failed to render item ${i}:`, error);
                itemElement.innerHTML = '<div style="color: red;">Error rendering item</div>';
            }

            fragment.appendChild(itemElement);
        }

        // Replace viewport content
        this.viewport.innerHTML = '';
        this.viewport.appendChild(fragment);

        // Performance tracking
        const duration = performance.now() - startTime;
        this.renderCount++;
        this.totalRenderTime += duration;

        const visibleCount = this.visibleEnd - this.visibleStart;

        // Log performance metrics
        if (duration > 16) { // >16ms = <60fps
            this.slowRenderWarnings++;
            console.warn(`[VirtualScroller] Slow render: ${duration.toFixed(2)}ms (${visibleCount} items)`);
        }

        // Track analytics
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackPerformance('virtual_scroll_render', {
                itemCount: this.items.length,
                visibleCount: visibleCount,
                duration: duration,
                fps: duration > 0 ? Math.round(1000 / duration) : 60
            });
        }

        // Detailed logging for debugging
        if (this.renderCount % 10 === 0) { // Log every 10th render
            const avgRenderTime = this.totalRenderTime / this.renderCount;
            console.log(`[VirtualScroller] Stats: ${this.renderCount} renders, avg ${avgRenderTime.toFixed(2)}ms, ${this.slowRenderWarnings} slow renders`);
        }
    }

    /**
     * Scroll to specific item index
     * @param {number} index - Item index to scroll to
     * @param {string} behavior - Scroll behavior ('auto' or 'smooth')
     */
    scrollToIndex(index, behavior = 'smooth') {
        if (index < 0 || index >= this.items.length) {
            console.warn(`[VirtualScroller] Invalid index: ${index}`);
            return;
        }

        const targetScrollTop = index * this.itemHeight;

        this.container.scrollTo({
            top: targetScrollTop,
            behavior: behavior
        });

        console.log(`[VirtualScroller] Scrolled to index ${index} (${targetScrollTop}px)`);
    }

    /**
     * Get current scroll position as item index
     * @returns {number} Current top visible item index
     */
    getCurrentIndex() {
        return Math.floor(this.scrollTop / this.itemHeight);
    }

    /**
     * Update a single item without full re-render
     * @param {number} index - Item index to update
     * @param {Object} newItem - New item data
     */
    updateItem(index, newItem) {
        if (index < 0 || index >= this.items.length) {
            console.warn(`[VirtualScroller] Invalid update index: ${index}`);
            return;
        }

        this.items[index] = newItem;

        // If item is currently visible, re-render just that item
        if (index >= this.visibleStart && index < this.visibleEnd) {
            const itemElement = this.viewport.querySelector(`[data-index="${index}"]`);
            if (itemElement) {
                try {
                    itemElement.innerHTML = this.renderItem(newItem, index);
                } catch (error) {
                    console.error(`[VirtualScroller] Failed to update item ${index}:`, error);
                }
            }
        }
    }

    /**
     * Add items to the list (for infinite scroll)
     * @param {Array} newItems - Items to append
     */
    appendItems(newItems) {
        if (!Array.isArray(newItems) || newItems.length === 0) {
            return;
        }

        const oldLength = this.items.length;
        this.items = this.items.concat(newItems);

        // Update scroll content height
        const totalHeight = this.items.length * this.itemHeight;
        this.scrollContent.style.height = `${totalHeight}px`;

        console.log(`[VirtualScroller] Appended ${newItems.length} items (total: ${this.items.length})`);

        // Re-render if new items are in visible range
        if (this.visibleEnd >= oldLength) {
            this.render();
        }
    }

    /**
     * Clear all items
     */
    clear() {
        this.items = [];
        this.scrollContent.style.height = '0px';
        this.viewport.innerHTML = '';
        this.container.scrollTop = 0;
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;

        console.log('[VirtualScroller] Cleared all items');
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance metrics
     */
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

    /**
     * Clean up and destroy the virtual scroller
     */
    destroy() {
        console.log('[VirtualScroller] Destroying instance');

        // Remove event listeners
        this.container.removeEventListener('scroll', this.boundScrollHandler);
        window.removeEventListener('resize', this.boundResizeHandler);

        // Clear DOM
        this.container.classList.remove('virtual-scroller-container');
        this.container.innerHTML = '';

        // Clear references
        this.items = [];
        this.scrollContent = null;
        this.viewport = null;
        this.loadingIndicator = null;
        this.isDestroyed = true;

        // Log final stats
        const stats = this.getStats();
        console.log('[VirtualScroller] Final stats:', stats);
    }
}

// ES Module export
export default VirtualScroller;

// Legacy global export for backwards compatibility
if (typeof window !== 'undefined') {
    window.VirtualScroller = VirtualScroller;
}
