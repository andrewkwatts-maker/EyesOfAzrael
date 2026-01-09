/**
 * Mobile Gestures Handler
 * Comprehensive touch gesture system for mobile experience
 *
 * Features:
 * - Swipe gestures (left/right/up/down)
 * - Pull-to-refresh with visual indicator
 * - Long-press context menus
 * - Touch ripple effects
 * - Edge swipe for navigation
 * - Bottom sheet swipe-to-dismiss
 *
 * Last updated: 2026-01-10
 */

class MobileGestures {
    constructor(options = {}) {
        this.options = {
            swipeThreshold: 50,           // Minimum swipe distance
            swipeVelocityThreshold: 0.3,  // Minimum velocity for swipe
            longPressDelay: 500,          // Long press delay in ms
            pullToRefreshThreshold: 80,   // Pull distance to trigger refresh
            edgeSwipeWidth: 20,           // Edge detection width
            enablePullToRefresh: true,
            enableLongPress: true,
            enableSwipeNavigation: true,
            enableEdgeSwipe: true,
            enableRippleEffect: true,
            ...options
        };

        // Touch state
        this.touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            currentX: 0,
            currentY: 0,
            isTracking: false,
            direction: null,
            isPulling: false,
            isLongPress: false,
            longPressTimer: null
        };

        // Pull-to-refresh state
        this.pullToRefresh = {
            enabled: false,
            isPulling: false,
            isRefreshing: false,
            pullDistance: 0,
            threshold: this.options.pullToRefreshThreshold
        };

        // Context menu state
        this.contextMenu = {
            isOpen: false,
            element: null,
            target: null
        };

        // Callbacks
        this.callbacks = {
            onSwipeLeft: null,
            onSwipeRight: null,
            onSwipeUp: null,
            onSwipeDown: null,
            onPullToRefresh: null,
            onLongPress: null,
            onEdgeSwipe: null
        };

        // Initialize
        this.init();
    }

    /**
     * Initialize gesture handlers
     */
    init() {
        // Only initialize on touch devices
        if (!this.isTouchDevice()) {
            console.log('[MobileGestures] Non-touch device detected, skipping initialization');
            return;
        }

        console.log('[MobileGestures] Initializing...');

        // Bind touch events
        this.bindTouchEvents();

        // Initialize pull-to-refresh if enabled
        if (this.options.enablePullToRefresh) {
            this.initPullToRefresh();
        }

        // Initialize ripple effect if enabled
        if (this.options.enableRippleEffect) {
            this.initRippleEffect();
        }

        // Inject required styles
        this.injectStyles();

        console.log('[MobileGestures] Initialization complete');
    }

    /**
     * Check if device supports touch
     */
    isTouchDevice() {
        return 'ontouchstart' in window ||
               navigator.maxTouchPoints > 0 ||
               window.matchMedia('(pointer: coarse)').matches;
    }

    /**
     * Bind global touch events
     */
    bindTouchEvents() {
        const options = { passive: false };

        document.addEventListener('touchstart', this.handleTouchStart.bind(this), options);
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), options);
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), options);
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), options);

        // Long press handling
        if (this.options.enableLongPress) {
            document.addEventListener('contextmenu', this.handleContextMenu.bind(this), options);
        }
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        const touch = e.touches[0];

        this.touchState = {
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
            currentX: touch.clientX,
            currentY: touch.clientY,
            isTracking: true,
            direction: null,
            isPulling: false,
            isLongPress: false,
            longPressTimer: null
        };

        // Check for edge swipe
        if (this.options.enableEdgeSwipe) {
            const isLeftEdge = touch.clientX < this.options.edgeSwipeWidth;
            const isRightEdge = touch.clientX > window.innerWidth - this.options.edgeSwipeWidth;

            if (isLeftEdge || isRightEdge) {
                this.touchState.isEdgeSwipe = true;
                this.touchState.edgeSide = isLeftEdge ? 'left' : 'right';
            }
        }

        // Start long press timer
        if (this.options.enableLongPress) {
            this.touchState.longPressTimer = setTimeout(() => {
                if (this.touchState.isTracking && !this.hasMovedSignificantly()) {
                    this.handleLongPress(e.target, touch.clientX, touch.clientY);
                }
            }, this.options.longPressDelay);
        }

        // Check if pulling from top for pull-to-refresh
        if (this.options.enablePullToRefresh && this.canPullToRefresh()) {
            this.pullToRefresh.isPulling = true;
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.touchState.isTracking) return;

        const touch = e.touches[0];
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;

        const deltaX = this.touchState.currentX - this.touchState.startX;
        const deltaY = this.touchState.currentY - this.touchState.startY;

        // Cancel long press if moved
        if (this.hasMovedSignificantly()) {
            this.cancelLongPress();
        }

        // Determine direction if not set
        if (!this.touchState.direction) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.touchState.direction = deltaX > 0 ? 'right' : 'left';
            } else {
                this.touchState.direction = deltaY > 0 ? 'down' : 'up';
            }
        }

        // Handle pull-to-refresh
        if (this.pullToRefresh.isPulling && deltaY > 0) {
            e.preventDefault();
            this.updatePullToRefresh(deltaY);
        }

        // Handle swipeable elements
        this.handleSwipeableElement(e.target, deltaX, deltaY);
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (!this.touchState.isTracking) return;

        this.cancelLongPress();

        const deltaX = this.touchState.currentX - this.touchState.startX;
        const deltaY = this.touchState.currentY - this.touchState.startY;
        const deltaTime = Date.now() - this.touchState.startTime;
        const velocityX = Math.abs(deltaX) / deltaTime;
        const velocityY = Math.abs(deltaY) / deltaTime;

        // Handle pull-to-refresh
        if (this.pullToRefresh.isPulling) {
            this.finishPullToRefresh();
        }

        // Detect swipe gestures
        if (this.isSwipe(deltaX, deltaY, velocityX, velocityY)) {
            this.handleSwipe(deltaX, deltaY);
        }

        // Handle edge swipe
        if (this.touchState.isEdgeSwipe && Math.abs(deltaX) > this.options.swipeThreshold) {
            this.handleEdgeSwipe(this.touchState.edgeSide, deltaX);
        }

        // Reset state
        this.resetTouchState();
    }

    /**
     * Handle touch cancel
     */
    handleTouchCancel(e) {
        this.cancelLongPress();
        this.resetTouchState();

        if (this.pullToRefresh.isPulling) {
            this.cancelPullToRefresh();
        }
    }

    /**
     * Check if gesture qualifies as a swipe
     */
    isSwipe(deltaX, deltaY, velocityX, velocityY) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = Math.max(velocityX, velocityY);

        return distance > this.options.swipeThreshold ||
               velocity > this.options.swipeVelocityThreshold;
    }

    /**
     * Handle swipe gesture
     */
    handleSwipe(deltaX, deltaY) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

        if (isHorizontal) {
            if (deltaX > 0) {
                this.triggerCallback('onSwipeRight', { deltaX, deltaY });
            } else {
                this.triggerCallback('onSwipeLeft', { deltaX, deltaY });
            }
        } else {
            if (deltaY > 0) {
                this.triggerCallback('onSwipeDown', { deltaX, deltaY });
            } else {
                this.triggerCallback('onSwipeUp', { deltaX, deltaY });
            }
        }
    }

    /**
     * Handle edge swipe for navigation
     */
    handleEdgeSwipe(side, deltaX) {
        if (side === 'left' && deltaX > this.options.swipeThreshold) {
            // Left edge swipe right = go back
            this.triggerCallback('onEdgeSwipe', { side, direction: 'right' });

            // Default: trigger browser back
            if (!this.callbacks.onEdgeSwipe) {
                window.history.back();
            }
        }
    }

    /**
     * Check if touch has moved significantly
     */
    hasMovedSignificantly() {
        const deltaX = Math.abs(this.touchState.currentX - this.touchState.startX);
        const deltaY = Math.abs(this.touchState.currentY - this.touchState.startY);
        return deltaX > 10 || deltaY > 10;
    }

    /**
     * Cancel long press timer
     */
    cancelLongPress() {
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }
    }

    /**
     * Handle long press
     */
    handleLongPress(target, x, y) {
        this.touchState.isLongPress = true;

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // Find the closest context-menu-enabled element
        const contextTarget = target.closest('[data-context-menu]');

        if (contextTarget) {
            this.showContextMenu(contextTarget, x, y);
        }

        this.triggerCallback('onLongPress', { target, x, y });
    }

    /**
     * Handle native context menu
     */
    handleContextMenu(e) {
        const target = e.target.closest('[data-context-menu]');
        if (target) {
            e.preventDefault();
            this.showContextMenu(target, e.clientX, e.clientY);
        }
    }

    /**
     * Show context menu
     */
    showContextMenu(target, x, y) {
        // Close existing menu
        this.closeContextMenu();

        const menuId = target.dataset.contextMenu;
        const menuData = this.getContextMenuData(target, menuId);

        if (!menuData || menuData.length === 0) return;

        // Create menu element
        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        menu.setAttribute('role', 'menu');
        menu.innerHTML = `
            <div class="context-menu-backdrop"></div>
            <div class="context-menu-content">
                <div class="context-menu-handle"></div>
                ${menuData.map((item, index) => `
                    <button class="context-menu-item ${item.destructive ? 'destructive' : ''}"
                            role="menuitem"
                            data-action="${item.action}"
                            style="--item-index: ${index};">
                        ${item.icon ? `<span class="context-menu-icon">${item.icon}</span>` : ''}
                        <span class="context-menu-label">${item.label}</span>
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(menu);

        // Position menu (bottom sheet style on mobile)
        requestAnimationFrame(() => {
            menu.classList.add('active');
        });

        // Bind menu events
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            const backdrop = e.target.closest('.context-menu-backdrop');

            if (item) {
                const action = item.dataset.action;
                this.handleContextMenuAction(target, action);
                this.closeContextMenu();
            } else if (backdrop) {
                this.closeContextMenu();
            }
        });

        this.contextMenu = { isOpen: true, element: menu, target };
    }

    /**
     * Get context menu data from element
     */
    getContextMenuData(target, menuId) {
        // Default menu items based on element type
        const defaultItems = [];

        // Check for custom menu data
        if (target.dataset.contextMenuItems) {
            try {
                return JSON.parse(target.dataset.contextMenuItems);
            } catch (e) {
                console.warn('[MobileGestures] Invalid context menu data');
            }
        }

        // Entity card context menu
        if (target.classList.contains('entity-card') || target.classList.contains('landing-category-card')) {
            return [
                { icon: '&#128279;', label: 'Copy Link', action: 'copy-link' },
                { icon: '&#128203;', label: 'Share', action: 'share' },
                { icon: '&#11088;', label: 'Add to Favorites', action: 'favorite' },
                { icon: '&#128065;', label: 'Quick View', action: 'quick-view' }
            ];
        }

        // Image context menu
        if (target.tagName === 'IMG') {
            return [
                { icon: '&#128190;', label: 'Save Image', action: 'save-image' },
                { icon: '&#128279;', label: 'Copy Image Link', action: 'copy-image-link' },
                { icon: '&#128203;', label: 'Share Image', action: 'share-image' }
            ];
        }

        // Link context menu
        if (target.tagName === 'A') {
            return [
                { icon: '&#128279;', label: 'Copy Link', action: 'copy-link' },
                { icon: '&#128203;', label: 'Share', action: 'share' },
                { icon: '&#128450;', label: 'Open in New Tab', action: 'open-new-tab' }
            ];
        }

        return defaultItems;
    }

    /**
     * Handle context menu action
     */
    handleContextMenuAction(target, action) {
        const href = target.href || target.closest('a')?.href || window.location.href;

        switch (action) {
            case 'copy-link':
            case 'copy-image-link':
                navigator.clipboard.writeText(href).then(() => {
                    this.showToast('Link copied to clipboard');
                });
                break;

            case 'share':
            case 'share-image':
                if (navigator.share) {
                    navigator.share({
                        title: target.title || document.title,
                        url: href
                    }).catch(() => {});
                } else {
                    navigator.clipboard.writeText(href);
                    this.showToast('Link copied to clipboard');
                }
                break;

            case 'favorite':
                this.dispatchCustomEvent(target, 'add-to-favorites');
                break;

            case 'quick-view':
                this.dispatchCustomEvent(target, 'quick-view');
                break;

            case 'open-new-tab':
                window.open(href, '_blank');
                break;

            case 'save-image':
                // Trigger image download
                const link = document.createElement('a');
                link.href = target.src;
                link.download = target.alt || 'image';
                link.click();
                break;
        }
    }

    /**
     * Close context menu
     */
    closeContextMenu() {
        if (this.contextMenu.element) {
            this.contextMenu.element.classList.add('closing');
            setTimeout(() => {
                this.contextMenu.element.remove();
                this.contextMenu = { isOpen: false, element: null, target: null };
            }, 300);
        }
    }

    /**
     * Initialize pull-to-refresh
     */
    initPullToRefresh() {
        // Create pull-to-refresh indicator
        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh-indicator';
        indicator.innerHTML = `
            <div class="ptr-progress">
                <div class="ptr-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12l7-7 7 7"/>
                    </svg>
                </div>
            </div>
            <span class="ptr-text">Pull to refresh</span>
        `;

        document.body.insertBefore(indicator, document.body.firstChild);
        this.pullToRefresh.indicator = indicator;
    }

    /**
     * Check if can pull to refresh
     */
    canPullToRefresh() {
        // Only at top of page
        return window.scrollY <= 0 && !this.pullToRefresh.isRefreshing;
    }

    /**
     * Update pull-to-refresh visual
     */
    updatePullToRefresh(distance) {
        const indicator = this.pullToRefresh.indicator;
        if (!indicator) return;

        this.pullToRefresh.pullDistance = distance;

        // Cap at 150px
        const cappedDistance = Math.min(distance, 150);
        const progress = Math.min(distance / this.pullToRefresh.threshold, 1);

        indicator.classList.add('visible', 'pulling');
        indicator.style.transform = `translateY(${cappedDistance - indicator.offsetHeight}px)`;

        // Rotate arrow based on progress
        const arrow = indicator.querySelector('.ptr-arrow');
        if (arrow) {
            arrow.style.transform = `rotate(${progress >= 1 ? 180 : 0}deg)`;
        }

        // Update text
        const text = indicator.querySelector('.ptr-text');
        if (text) {
            text.textContent = distance >= this.pullToRefresh.threshold
                ? 'Release to refresh'
                : 'Pull to refresh';
        }

        if (distance >= this.pullToRefresh.threshold) {
            indicator.classList.add('threshold-reached');
        } else {
            indicator.classList.remove('threshold-reached');
        }
    }

    /**
     * Finish pull-to-refresh
     */
    finishPullToRefresh() {
        const indicator = this.pullToRefresh.indicator;
        if (!indicator) return;

        if (this.pullToRefresh.pullDistance >= this.pullToRefresh.threshold) {
            // Trigger refresh
            this.pullToRefresh.isRefreshing = true;
            indicator.classList.add('refreshing');
            indicator.classList.remove('threshold-reached');

            const text = indicator.querySelector('.ptr-text');
            if (text) text.textContent = 'Refreshing...';

            // Execute refresh callback
            const refreshPromise = this.triggerCallback('onPullToRefresh');

            // Handle callback result
            if (refreshPromise instanceof Promise) {
                refreshPromise.finally(() => this.completePullToRefresh());
            } else {
                // Default: reload page after delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } else {
            this.cancelPullToRefresh();
        }

        this.pullToRefresh.isPulling = false;
    }

    /**
     * Complete pull-to-refresh
     */
    completePullToRefresh() {
        const indicator = this.pullToRefresh.indicator;
        if (!indicator) return;

        indicator.classList.add('success');
        indicator.classList.remove('refreshing');

        const text = indicator.querySelector('.ptr-text');
        if (text) text.textContent = 'Done!';

        setTimeout(() => {
            this.cancelPullToRefresh();
        }, 500);
    }

    /**
     * Cancel pull-to-refresh
     */
    cancelPullToRefresh() {
        const indicator = this.pullToRefresh.indicator;
        if (!indicator) return;

        indicator.classList.remove('visible', 'pulling', 'threshold-reached', 'refreshing', 'success');
        indicator.style.transform = '';

        this.pullToRefresh.isPulling = false;
        this.pullToRefresh.isRefreshing = false;
        this.pullToRefresh.pullDistance = 0;
    }

    /**
     * Handle swipeable elements
     */
    handleSwipeableElement(target, deltaX, deltaY) {
        const swipeable = target.closest('.swipeable');
        if (!swipeable || Math.abs(deltaY) > Math.abs(deltaX)) return;

        swipeable.classList.add('swiping');

        if (deltaX > 0) {
            swipeable.classList.add('swiping-right');
            swipeable.classList.remove('swiping-left');
        } else {
            swipeable.classList.add('swiping-left');
            swipeable.classList.remove('swiping-right');
        }

        // Apply transform
        swipeable.style.transform = `translateX(${deltaX}px)`;
    }

    /**
     * Initialize ripple effect
     */
    initRippleEffect() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.touch-ripple, button, .btn, .landing-category-card, .entity-card');
            if (!target) return;

            this.createRipple(target, e.clientX, e.clientY);
        });
    }

    /**
     * Create ripple effect
     */
    createRipple(element, x, y) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = `${size * 2}px`;
        ripple.style.left = `${x - rect.left - size}px`;
        ripple.style.top = `${y - rect.top - size}px`;

        element.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    /**
     * Reset touch state
     */
    resetTouchState() {
        this.touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            currentX: 0,
            currentY: 0,
            isTracking: false,
            direction: null,
            isPulling: false,
            isLongPress: false,
            longPressTimer: null
        };
    }

    /**
     * Trigger callback
     */
    triggerCallback(name, data = {}) {
        if (this.callbacks[name]) {
            return this.callbacks[name](data);
        }
        return null;
    }

    /**
     * Register callback
     */
    on(event, callback) {
        const callbackName = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
        if (callbackName in this.callbacks) {
            this.callbacks[callbackName] = callback;
        }
        return this;
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Dispatch custom event
     */
    dispatchCustomEvent(target, eventName) {
        target.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            detail: { target }
        }));
    }

    /**
     * Inject required styles
     */
    injectStyles() {
        if (document.getElementById('mobile-gestures-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'mobile-gestures-styles';
        styles.textContent = `
            /* ============================================
               MOBILE GESTURES STYLES
               ============================================ */

            /* Context Menu - Bottom Sheet Style */
            .mobile-context-menu {
                position: fixed;
                inset: 0;
                z-index: 10001;
                display: flex;
                align-items: flex-end;
                pointer-events: none;
            }

            .mobile-context-menu.active {
                pointer-events: auto;
            }

            .context-menu-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .mobile-context-menu.active .context-menu-backdrop {
                opacity: 1;
            }

            .context-menu-content {
                position: relative;
                width: 100%;
                background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.98);
                backdrop-filter: blur(30px);
                -webkit-backdrop-filter: blur(30px);
                border-radius: 20px 20px 0 0;
                padding: 0.75rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 1;
            }

            .mobile-context-menu.active .context-menu-content {
                transform: translateY(0);
            }

            .mobile-context-menu.closing .context-menu-content {
                transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.7, 0, 0.84, 0);
            }

            .context-menu-handle {
                width: 40px;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                margin: 0 auto 16px;
            }

            .context-menu-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                width: 100%;
                padding: 1rem 1.25rem;
                background: transparent;
                border: none;
                border-radius: 12px;
                color: var(--color-text-primary, #f8f9fa);
                font-size: 1rem;
                font-weight: 500;
                text-align: left;
                cursor: pointer;
                min-height: 56px;
                transition: background 0.2s ease;
                opacity: 0;
                transform: translateY(20px);
                animation: contextMenuItemIn 0.3s ease forwards;
                animation-delay: calc(var(--item-index, 0) * 0.05s + 0.1s);
            }

            @keyframes contextMenuItemIn {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .context-menu-item:active {
                background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.15);
            }

            .context-menu-item.destructive {
                color: #ff6b6b;
            }

            .context-menu-icon {
                font-size: 1.25rem;
                width: 28px;
                text-align: center;
            }

            .context-menu-label {
                flex: 1;
            }

            /* Ripple Effect */
            .ripple-effect {
                position: absolute;
                border-radius: 50%;
                background: rgba(var(--color-primary-rgb, 139, 127, 255), 0.3);
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            }

            @keyframes ripple {
                to {
                    transform: scale(1);
                    opacity: 0;
                }
            }

            /* Elements that can have ripples need position relative */
            button, .btn, .landing-category-card, .entity-card {
                position: relative;
                overflow: hidden;
            }

            /* Mobile Toast */
            .mobile-toast {
                position: fixed;
                bottom: calc(80px + env(safe-area-inset-bottom, 0px));
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: rgba(var(--color-bg-card-rgb, 26, 31, 58), 0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                color: var(--color-text-primary, #f8f9fa);
                padding: 0.875rem 1.5rem;
                border-radius: 12px;
                font-size: 0.9375rem;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10002;
                opacity: 0;
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                            opacity 0.3s ease;
            }

            .mobile-toast.visible {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }

            /* Pull-to-Refresh Enhancement */
            .pull-to-refresh-indicator .ptr-arrow svg {
                transition: transform 0.2s ease;
            }

            /* Swipeable Elements */
            .swipeable.swiping {
                transition: none !important;
            }

            .swipeable:not(.swiping) {
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .mobile-context-menu,
                .context-menu-content,
                .context-menu-item,
                .ripple-effect,
                .mobile-toast {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Destroy instance and cleanup
     */
    destroy() {
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchcancel', this.handleTouchCancel);

        if (this.pullToRefresh.indicator) {
            this.pullToRefresh.indicator.remove();
        }

        this.closeContextMenu();

        const styles = document.getElementById('mobile-gestures-styles');
        if (styles) styles.remove();
    }
}

/**
 * Mobile Back Button Handler
 * Shows/hides mobile back button based on route depth
 */
class MobileBackButton {
    constructor() {
        this.backBtn = null;
        this.init();
    }

    init() {
        this.backBtn = document.getElementById('mobileBackBtn');
        if (!this.backBtn) return;

        // Listen for route changes
        window.addEventListener('hashchange', () => this.updateVisibility());
        window.addEventListener('popstate', () => this.updateVisibility());

        // Initial check
        this.updateVisibility();
    }

    /**
     * Determine if current route is a detail page
     */
    isDetailPage() {
        const hash = window.location.hash || '#/';
        const path = hash.replace('#', '');

        // Detail pages typically have format: /category/id
        // Home routes: /, /home, /mythologies
        const homeRoutes = ['/', '/home', '/mythologies', '/search', '/compare', '/profile', '/settings', '/dashboard'];

        // Check if it's a detail page (has an ID after category)
        const segments = path.split('/').filter(s => s);

        // More than 1 segment typically means detail page
        // e.g., /deities/zeus, /creatures/dragon, /mythologies/norse/deities
        if (segments.length >= 2) {
            // Exclude browse routes: /browse/deities, /browse/creatures
            if (segments[0] === 'browse' && segments.length === 2) {
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Update back button visibility
     */
    updateVisibility() {
        if (!this.backBtn) return;

        const shouldShow = this.isDetailPage();
        const header = document.querySelector('.site-header');

        if (shouldShow) {
            document.body.classList.add('has-back-button');
            header?.classList.add('has-back-button');
        } else {
            document.body.classList.remove('has-back-button');
            header?.classList.remove('has-back-button');
        }
    }
}

// Global initialization
if (typeof window !== 'undefined') {
    window.MobileGestures = MobileGestures;
    window.MobileBackButton = MobileBackButton;

    // Auto-initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileGestures = new MobileGestures({
            enablePullToRefresh: true,
            enableLongPress: true,
            enableSwipeNavigation: true,
            enableEdgeSwipe: true,
            enableRippleEffect: true
        });

        // Initialize mobile back button handler
        window.mobileBackButton = new MobileBackButton();

        // Set up default pull-to-refresh handler
        window.mobileGestures.on('pullToRefresh', async () => {
            // Dispatch event for views to handle
            document.dispatchEvent(new CustomEvent('pull-to-refresh'));

            // Wait for any handlers to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        console.log('[MobileGestures] Auto-initialized');
    });
}
