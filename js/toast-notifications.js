/**
 * Toast Notification System - Polished Edition
 * Beautiful, accessible toast notifications with comprehensive error handling
 *
 * Features:
 * - Multiple toast types (success, error, warning, info, loading)
 * - Slide-in animation from bottom with smooth stacking
 * - Progress bar for auto-dismiss
 * - Swipe to dismiss on mobile
 * - Action buttons (Retry, Undo, etc.)
 * - Haptic feedback for mobile devices
 * - Accessibility support (aria-live, focus management)
 * - Error boundaries integration
 * - Offline state detection with banner
 * - Form validation error support
 */

class ToastNotifications {
    constructor(options = {}) {
        this.options = {
            position: 'bottom-right',
            maxToasts: 5,
            defaultDurations: {
                success: 3000,
                error: 5000,
                warning: 4000,
                info: 3000,
                loading: 0
            },
            enableSwipeToDismiss: true,
            enableHapticFeedback: true,
            stackDirection: 'up',
            stackGap: 12,
            animationDuration: 350,
            ...options
        };

        this.container = null;
        this.toasts = new Map();
        this.toastIdCounter = 0;
        this.isOnline = navigator.onLine;
        this.offlineBanner = null;
        this.pausedToasts = new Set();

        this.init();
        this.setupNetworkListeners();
    }

    /**
     * Initialize toast container and offline banner
     */
    init() {
        // Main toast container with accessibility attributes
        this.container = document.createElement('div');
        this.container.className = `toast-container toast-container--${this.options.position}`;
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Notifications');
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(this.container);

        // Create screen reader announcement element
        this.srAnnouncer = document.createElement('div');
        this.srAnnouncer.className = 'sr-only toast-announcer';
        this.srAnnouncer.setAttribute('aria-live', 'assertive');
        this.srAnnouncer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.srAnnouncer);

        // Offline banner container
        this.offlineBanner = document.createElement('div');
        this.offlineBanner.className = 'offline-banner';
        this.offlineBanner.setAttribute('role', 'alert');
        this.offlineBanner.setAttribute('aria-live', 'assertive');
        this.offlineBanner.innerHTML = `
            <div class="offline-banner__content">
                <div class="offline-banner__pulse"></div>
                <svg class="offline-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
                </svg>
                <span class="offline-banner__text">You are offline. Some features may be unavailable.</span>
                <button class="offline-banner__retry" aria-label="Retry connection">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(this.offlineBanner);

        // Retry button listener
        const retryBtn = this.offlineBanner.querySelector('.offline-banner__retry');
        retryBtn.addEventListener('click', () => this.checkConnection());

        // Add visibility change listener to pause/resume toasts
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllTimers();
            } else {
                this.resumeAllTimers();
            }
        });
    }

    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.offlineBanner.classList.remove('offline-banner--visible');
            this.success('You are back online', {
                title: 'Connection Restored',
                icon: 'wifi'
            });
            this.triggerHaptic('success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.offlineBanner.classList.add('offline-banner--visible');
            this.triggerHaptic('warning');
        });

        // Initial check
        if (!navigator.onLine) {
            this.offlineBanner.classList.add('offline-banner--visible');
        }
    }

    /**
     * Trigger haptic feedback on mobile devices
     */
    triggerHaptic(type = 'light') {
        if (!this.options.enableHapticFeedback) return;

        // Vibration API support
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
                success: [10, 50, 10],
                error: [50, 30, 50],
                warning: [30, 20, 30]
            };
            navigator.vibrate(patterns[type] || patterns.light);
        }

        // iOS Taptic Engine via webkit (if available)
        if (window.webkit?.messageHandlers?.haptic) {
            window.webkit.messageHandlers.haptic.postMessage({ type });
        }
    }

    /**
     * Check connection status
     */
    async checkConnection() {
        const retryBtn = this.offlineBanner.querySelector('.offline-banner__retry');
        retryBtn.classList.add('offline-banner__retry--loading');

        try {
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-store'
            });
            if (response.ok) {
                this.isOnline = true;
                this.offlineBanner.classList.remove('offline-banner--visible');
                this.success('Connection restored');
                this.triggerHaptic('success');
            }
        } catch (e) {
            this.warning('Still offline. Please check your connection.');
            this.triggerHaptic('error');
        } finally {
            retryBtn.classList.remove('offline-banner__retry--loading');
        }
    }

    /**
     * Generate unique toast ID
     */
    generateId() {
        return `toast-${++this.toastIdCounter}-${Date.now()}`;
    }

    /**
     * Announce to screen readers
     */
    announce(message, priority = 'polite') {
        this.srAnnouncer.setAttribute('aria-live', priority);
        this.srAnnouncer.textContent = '';
        // Force reflow
        void this.srAnnouncer.offsetHeight;
        this.srAnnouncer.textContent = message;
    }

    /**
     * Show a toast notification
     */
    show(message, options = {}) {
        const {
            type = 'info',
            title = '',
            duration = this.options.defaultDurations[type] || 3000,
            dismissible = true,
            icon = null,
            actions = [],
            persistent = false,
            id = this.generateId(),
            onDismiss = null,
            pauseOnHover = true,
            pauseOnFocusLoss = true
        } = options;

        // Remove oldest toast if at max
        if (this.toasts.size >= this.options.maxToasts) {
            const oldestId = this.toasts.keys().next().value;
            this.dismiss(oldestId);
        }

        // Create toast element
        const toast = this.createToast({
            id,
            type,
            title,
            message,
            icon: icon || this.getDefaultIcon(type),
            dismissible,
            duration: persistent ? 0 : duration,
            actions,
            pauseOnHover
        });

        // Store toast data
        const toastData = {
            element: toast,
            timeoutId: null,
            duration: persistent ? 0 : duration,
            remainingTime: persistent ? 0 : duration,
            startTime: null,
            onDismiss,
            pauseOnHover,
            pauseOnFocusLoss
        };

        this.toasts.set(id, toastData);

        // Add to container
        this.container.appendChild(toast);

        // Trigger haptic feedback
        this.triggerHaptic(type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'light');

        // Announce to screen readers
        const announcement = title ? `${title}: ${message}` : message;
        this.announce(announcement, type === 'error' ? 'assertive' : 'polite');

        // Force reflow for animation
        void toast.offsetHeight;

        // Add visible class with stagger for multiple toasts
        requestAnimationFrame(() => {
            toast.classList.add('toast--visible');
            this.updateStackPositions();
        });

        // Setup interactions
        if (this.options.enableSwipeToDismiss) {
            this.setupSwipeToDismiss(toast, id);
        }

        if (pauseOnHover) {
            this.setupPauseOnHover(toast, id);
        }

        // Auto-dismiss
        if (duration > 0 && !persistent) {
            this.startTimer(id);
        }

        return id;
    }

    /**
     * Start auto-dismiss timer
     */
    startTimer(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData || toastData.duration <= 0) return;

        toastData.startTime = Date.now();
        toastData.timeoutId = setTimeout(() => {
            this.dismiss(toastId);
        }, toastData.remainingTime);

        // Update progress bar
        const progress = toastData.element.querySelector('.toast__progress');
        if (progress) {
            progress.style.animationDuration = `${toastData.remainingTime}ms`;
            progress.style.animationPlayState = 'running';
        }
    }

    /**
     * Pause timer for a toast
     */
    pauseTimer(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData || !toastData.timeoutId) return;

        clearTimeout(toastData.timeoutId);
        toastData.timeoutId = null;

        // Calculate remaining time
        if (toastData.startTime) {
            const elapsed = Date.now() - toastData.startTime;
            toastData.remainingTime = Math.max(0, toastData.remainingTime - elapsed);
        }

        // Pause progress bar
        const progress = toastData.element.querySelector('.toast__progress');
        if (progress) {
            progress.style.animationPlayState = 'paused';
        }

        this.pausedToasts.add(toastId);
    }

    /**
     * Resume timer for a toast
     */
    resumeTimer(toastId) {
        if (!this.pausedToasts.has(toastId)) return;

        const toastData = this.toasts.get(toastId);
        if (!toastData || toastData.remainingTime <= 0) return;

        this.pausedToasts.delete(toastId);
        this.startTimer(toastId);
    }

    /**
     * Pause all toast timers
     */
    pauseAllTimers() {
        this.toasts.forEach((_, id) => this.pauseTimer(id));
    }

    /**
     * Resume all toast timers
     */
    resumeAllTimers() {
        this.pausedToasts.forEach(id => this.resumeTimer(id));
    }

    /**
     * Setup pause on hover
     */
    setupPauseOnHover(toast, id) {
        toast.addEventListener('mouseenter', () => this.pauseTimer(id));
        toast.addEventListener('mouseleave', () => this.resumeTimer(id));
        toast.addEventListener('focusin', () => this.pauseTimer(id));
        toast.addEventListener('focusout', () => this.resumeTimer(id));
    }

    /**
     * Create toast element
     */
    createToast(config) {
        const { id, type, title, message, icon, dismissible, duration, actions, pauseOnHover } = config;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.id = id;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        toast.setAttribute('data-toast-id', id);
        toast.tabIndex = -1;

        // Icon with animation
        const iconEl = document.createElement('div');
        iconEl.className = `toast__icon toast__icon--${type}`;
        iconEl.innerHTML = this.getIconSVG(icon, type);
        iconEl.setAttribute('aria-hidden', 'true');
        toast.appendChild(iconEl);

        // Content wrapper
        const content = document.createElement('div');
        content.className = 'toast__content';

        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'toast__title';
            titleEl.textContent = title;
            content.appendChild(titleEl);
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'toast__message';
        messageEl.textContent = message;
        content.appendChild(messageEl);

        // Actions with proper styling
        if (actions.length > 0) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'toast__actions';

            actions.forEach((action, index) => {
                const btn = document.createElement('button');
                btn.className = `toast__action ${action.primary ? 'toast__action--primary' : 'toast__action--secondary'}`;
                btn.textContent = action.label;
                btn.setAttribute('aria-label', action.ariaLabel || action.label);

                // Add icon to action if provided
                if (action.icon) {
                    btn.innerHTML = `
                        <svg class="toast__action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${this.getActionIconPath(action.icon)}
                        </svg>
                        <span>${action.label}</span>
                    `;
                }

                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.triggerHaptic('light');
                    action.onClick?.();
                    if (action.dismissOnClick !== false) {
                        this.dismiss(id);
                    }
                };

                actionsEl.appendChild(btn);
            });

            content.appendChild(actionsEl);
        }

        toast.appendChild(content);

        // Close button with better accessibility
        if (dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast__close';
            closeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            `;
            closeBtn.setAttribute('aria-label', 'Dismiss notification');
            closeBtn.setAttribute('type', 'button');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.triggerHaptic('light');
                this.dismiss(id);
            };
            toast.appendChild(closeBtn);
        }

        // Progress bar for auto-dismiss
        if (duration > 0) {
            const progressWrapper = document.createElement('div');
            progressWrapper.className = 'toast__progress-wrapper';

            const progress = document.createElement('div');
            progress.className = `toast__progress toast__progress--${type}`;
            progress.style.animationDuration = `${duration}ms`;

            progressWrapper.appendChild(progress);
            toast.appendChild(progressWrapper);
        }

        // Loading spinner for loading type
        if (type === 'loading' || icon === 'loading') {
            const spinner = iconEl.querySelector('svg');
            if (spinner) {
                spinner.classList.add('toast__icon--spinning');
            }
        }

        return toast;
    }

    /**
     * Get action icon path
     */
    getActionIconPath(icon) {
        const paths = {
            retry: '<path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>',
            undo: '<path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>',
            close: '<path d="M18 6L6 18M6 6l12 12"/>',
            check: '<path d="M20 6L9 17l-5-5"/>',
            settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
            link: '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>'
        };
        return paths[icon] || paths.check;
    }

    /**
     * Setup swipe to dismiss for mobile
     */
    setupSwipeToDismiss(toast, id) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let hasMoved = false;

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            hasMoved = false;
            toast.style.transition = 'none';
            this.pauseTimer(id);
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;

            currentX = e.touches[0].clientX - startX;
            const currentY = e.touches[0].clientY - startY;

            // Only allow horizontal swipes
            if (Math.abs(currentX) > Math.abs(currentY) && Math.abs(currentX) > 10) {
                hasMoved = true;
                e.preventDefault();

                const resistance = 0.5;
                const dampedX = currentX * resistance;

                toast.style.transform = `translateX(${dampedX}px)`;
                toast.style.opacity = Math.max(0.3, 1 - Math.abs(currentX) / 250);
            }
        };

        const handleTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            toast.style.transition = '';

            if (Math.abs(currentX) > 80) {
                // Swipe threshold reached - dismiss with direction
                this.triggerHaptic('light');
                toast.style.transform = `translateX(${currentX > 0 ? '120%' : '-120%'})`;
                toast.style.opacity = '0';
                setTimeout(() => this.dismiss(id), 150);
            } else {
                // Reset position
                toast.style.transform = '';
                toast.style.opacity = '';
                if (!hasMoved) {
                    this.resumeTimer(id);
                }
            }
            currentX = 0;
        };

        toast.addEventListener('touchstart', handleTouchStart, { passive: true });
        toast.addEventListener('touchmove', handleTouchMove, { passive: false });
        toast.addEventListener('touchend', handleTouchEnd, { passive: true });
        toast.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    }

    /**
     * Update stack positions for smooth reflow
     */
    updateStackPositions() {
        const toastElements = Array.from(this.container.children);
        const gap = this.options.stackGap;

        toastElements.forEach((toast, index) => {
            const reverseIndex = toastElements.length - 1 - index;
            toast.style.setProperty('--toast-index', reverseIndex);

            // Scale down older toasts slightly
            if (reverseIndex > 0) {
                const scale = Math.max(0.95, 1 - reverseIndex * 0.02);
                const opacity = Math.max(0.7, 1 - reverseIndex * 0.1);
                toast.style.setProperty('--toast-scale', scale);
                toast.style.setProperty('--toast-opacity', opacity);
            } else {
                toast.style.setProperty('--toast-scale', 1);
                toast.style.setProperty('--toast-opacity', 1);
            }
        });
    }

    /**
     * Get SVG icon for toast type
     */
    getIconSVG(icon, type) {
        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast__icon-svg">
                <circle cx="12" cy="12" r="10" class="toast__icon-circle"/>
                <path d="M9 12l2 2 4-4" class="toast__icon-check"/>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast__icon-svg">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast__icon-svg">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast__icon-svg">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
            </svg>`,
            wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast__icon-svg">
                <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
            </svg>`,
            loading: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast__icon-svg toast__icon--spinning">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" stroke-linecap="round"/>
            </svg>`
        };

        return icons[icon] || icons[type] || icons.info;
    }

    /**
     * Get default icon for toast type
     */
    getDefaultIcon(type) {
        return type;
    }

    /**
     * Dismiss a specific toast by ID
     */
    dismiss(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const { element, timeoutId, onDismiss } = toastData;

        // Clear auto-dismiss timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Remove from paused set
        this.pausedToasts.delete(toastId);

        // Call dismiss callback
        onDismiss?.();

        // Animate out
        element.classList.remove('toast--visible');
        element.classList.add('toast--removing');

        // Remove after animation
        setTimeout(() => {
            if (element.parentElement) {
                this.container.removeChild(element);
            }
            this.toasts.delete(toastId);
            this.updateStackPositions();
        }, this.options.animationDuration);
    }

    /**
     * Dismiss all toasts
     */
    dismissAll() {
        this.toasts.forEach((_, id) => this.dismiss(id));
    }

    /**
     * Convenience methods with proper durations
     */
    success(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'success',
            duration: options.duration ?? 3000
        });
    }

    error(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'error',
            duration: options.duration ?? 5000
        });
    }

    warning(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'warning',
            duration: options.duration ?? 4000
        });
    }

    info(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'info',
            duration: options.duration ?? 3000
        });
    }

    /**
     * Show loading toast (persistent until dismissed)
     */
    loading(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'info',
            persistent: true,
            dismissible: false,
            icon: 'loading'
        });
    }

    /**
     * Show error with retry action
     */
    errorWithRetry(message, retryCallback, options = {}) {
        return this.show(message, {
            ...options,
            type: 'error',
            duration: 0,
            persistent: true,
            actions: [
                {
                    label: 'Retry',
                    icon: 'retry',
                    primary: true,
                    onClick: retryCallback
                },
                {
                    label: 'Dismiss',
                    onClick: () => {}
                }
            ]
        });
    }

    /**
     * Show success with undo action
     */
    successWithUndo(message, undoCallback, options = {}) {
        return this.show(message, {
            ...options,
            type: 'success',
            duration: 5000,
            actions: [
                {
                    label: 'Undo',
                    icon: 'undo',
                    primary: true,
                    onClick: undoCallback,
                    dismissOnClick: true
                }
            ]
        });
    }

    /**
     * Update an existing toast
     */
    update(toastId, updates = {}) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;

        const { element } = toastData;

        if (updates.message) {
            const messageEl = element.querySelector('.toast__message');
            if (messageEl) messageEl.textContent = updates.message;
        }

        if (updates.title !== undefined) {
            let titleEl = element.querySelector('.toast__title');
            if (updates.title) {
                if (!titleEl) {
                    titleEl = document.createElement('div');
                    titleEl.className = 'toast__title';
                    const content = element.querySelector('.toast__content');
                    content.insertBefore(titleEl, content.firstChild);
                }
                titleEl.textContent = updates.title;
            } else if (titleEl) {
                titleEl.remove();
            }
        }

        if (updates.type) {
            // Remove old type class
            element.className = element.className.replace(/toast--\w+/g, '');
            element.classList.add('toast', `toast--${updates.type}`, 'toast--visible');

            const iconEl = element.querySelector('.toast__icon');
            if (iconEl) {
                iconEl.className = `toast__icon toast__icon--${updates.type}`;
                iconEl.innerHTML = this.getIconSVG(updates.type, updates.type);
            }

            // Update progress bar type
            const progress = element.querySelector('.toast__progress');
            if (progress) {
                progress.className = `toast__progress toast__progress--${updates.type}`;
            }
        }

        // Announce update to screen readers
        if (updates.message || updates.title) {
            const announcement = updates.title
                ? `${updates.title}: ${updates.message || ''}`
                : updates.message;
            this.announce(announcement);
        }
    }

    /**
     * Promise-based toast for async operations
     */
    async promise(promise, messages = {}) {
        const {
            loading = 'Loading...',
            success = 'Success!',
            error = 'Something went wrong'
        } = messages;

        const toastId = this.loading(loading);

        try {
            const result = await promise;

            this.update(toastId, {
                message: typeof success === 'function' ? success(result) : success,
                type: 'success'
            });

            // Make it dismissible and auto-dismiss
            const toastData = this.toasts.get(toastId);
            if (toastData) {
                toastData.duration = 3000;
                toastData.remainingTime = 3000;

                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'toast__close';
                closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
                closeBtn.setAttribute('aria-label', 'Dismiss notification');
                closeBtn.onclick = () => this.dismiss(toastId);
                toastData.element.appendChild(closeBtn);

                this.startTimer(toastId);
            }

            this.triggerHaptic('success');
            return result;
        } catch (err) {
            this.update(toastId, {
                message: typeof error === 'function' ? error(err) : error,
                type: 'error'
            });

            const toastData = this.toasts.get(toastId);
            if (toastData) {
                toastData.duration = 5000;
                toastData.remainingTime = 5000;

                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'toast__close';
                closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
                closeBtn.setAttribute('aria-label', 'Dismiss notification');
                closeBtn.onclick = () => this.dismiss(toastId);
                toastData.element.appendChild(closeBtn);

                this.startTimer(toastId);
            }

            this.triggerHaptic('error');
            throw err;
        }
    }

    /**
     * Clear all toasts (alias for dismissAll)
     */
    clearAll() {
        this.dismissAll();
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.dismissAll();
        if (this.container?.parentElement) {
            document.body.removeChild(this.container);
        }
        if (this.offlineBanner?.parentElement) {
            document.body.removeChild(this.offlineBanner);
        }
        if (this.srAnnouncer?.parentElement) {
            document.body.removeChild(this.srAnnouncer);
        }
        window.removeEventListener('online', this.setupNetworkListeners);
        window.removeEventListener('offline', this.setupNetworkListeners);
    }
}

/**
 * Error Boundary Component
 * Catches JavaScript errors and displays friendly error UI
 */
class ErrorBoundary {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            fallbackMessage: 'Something went wrong',
            showRetry: true,
            showDetails: false,
            onError: null,
            onRetry: null,
            retryLabel: 'Try Again',
            ...options
        };
        this.hasError = false;
        this.originalContent = null;
        this.errorStack = [];
    }

    /**
     * Wrap async function with error boundary
     */
    async wrap(fn) {
        try {
            this.hasError = false;
            return await fn();
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Wrap sync function with error boundary
     */
    wrapSync(fn) {
        try {
            this.hasError = false;
            return fn();
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Handle caught error
     */
    handleError(error) {
        this.hasError = true;
        this.errorStack.push({
            error,
            timestamp: Date.now()
        });

        console.error('ErrorBoundary caught:', error);

        // Call optional error handler
        this.options.onError?.(error);

        // Save original content
        if (!this.originalContent) {
            this.originalContent = this.container.innerHTML;
        }

        // Render error UI
        this.container.innerHTML = this.renderErrorUI(error);

        // Setup retry button
        const retryBtn = this.container.querySelector('.error-boundary__retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retry());
        }

        // Setup details toggle
        const detailsToggle = this.container.querySelector('.error-boundary__details-toggle');
        if (detailsToggle) {
            detailsToggle.addEventListener('click', () => {
                const details = this.container.querySelector('.error-boundary__details');
                details?.classList.toggle('error-boundary__details--visible');
                detailsToggle.classList.toggle('error-boundary__details-toggle--open');
            });
        }

        // Announce error to screen readers
        this.container.setAttribute('role', 'alert');
        this.container.setAttribute('aria-live', 'assertive');
    }

    /**
     * Render error UI
     */
    renderErrorUI(error) {
        const showDetails = this.options.showDetails && error.stack;

        return `
            <div class="error-boundary" role="alert">
                <div class="error-boundary__icon-wrapper">
                    <div class="error-boundary__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                    </div>
                    <div class="error-boundary__pulse"></div>
                </div>
                <h3 class="error-boundary__title">${this.options.fallbackMessage}</h3>
                <p class="error-boundary__message">${this.sanitizeMessage(error.message) || 'An unexpected error occurred'}</p>
                ${this.options.showRetry ? `
                    <button class="error-boundary__retry" type="button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                        </svg>
                        <span>${this.options.retryLabel}</span>
                    </button>
                ` : ''}
                ${showDetails ? `
                    <button class="error-boundary__details-toggle" type="button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                        <span>Show Details</span>
                    </button>
                    <pre class="error-boundary__details">${this.sanitizeMessage(error.stack)}</pre>
                ` : ''}
            </div>
        `;
    }

    /**
     * Sanitize error message for HTML display
     */
    sanitizeMessage(message) {
        if (!message) return '';
        return message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Retry - restore original content and call retry handler
     */
    retry() {
        if (this.originalContent) {
            this.container.innerHTML = this.originalContent;
            this.hasError = false;
            this.container.removeAttribute('role');
            this.container.removeAttribute('aria-live');
        }
        this.options.onRetry?.();
    }

    /**
     * Reset error state
     */
    reset() {
        this.hasError = false;
        this.originalContent = null;
        this.errorStack = [];
    }

    /**
     * Get error history
     */
    getErrorHistory() {
        return [...this.errorStack];
    }
}

/**
 * Form Validation Error Handler
 * Manages inline field errors and form-level validation
 */
class FormValidation {
    constructor(form, options = {}) {
        this.form = form;
        this.options = {
            scrollToError: true,
            showSummary: true,
            validateOnBlur: true,
            validateOnInput: false,
            debounceDelay: 300,
            customValidators: {},
            ...options
        };
        this.errors = new Map();
        this.debounceTimers = new Map();

        this.init();
    }

    /**
     * Initialize form validation
     */
    init() {
        const inputs = this.form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            if (this.options.validateOnBlur) {
                input.addEventListener('blur', () => this.validateField(input));
            }
            if (this.options.validateOnInput) {
                input.addEventListener('input', () => this.debouncedValidate(input));
            }

            // Clear error on input (immediate feedback)
            input.addEventListener('input', () => {
                if (this.errors.has(input.id || input.name)) {
                    this.clearFieldError(input);
                }
            });
        });

        // Handle form submission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateAll()) {
                e.preventDefault();
            }
        });
    }

    /**
     * Debounced validation
     */
    debouncedValidate(field) {
        const fieldId = field.id || field.name;
        if (this.debounceTimers.has(fieldId)) {
            clearTimeout(this.debounceTimers.get(fieldId));
        }

        const timer = setTimeout(() => {
            this.validateField(field);
            this.debounceTimers.delete(fieldId);
        }, this.options.debounceDelay);

        this.debounceTimers.set(fieldId, timer);
    }

    /**
     * Validate single field
     */
    validateField(field) {
        const rules = this.getFieldRules(field);
        const value = field.value.trim();
        let error = null;

        // Check each rule
        for (const rule of rules) {
            if (rule.type === 'required' && !value) {
                error = rule.message || 'This field is required';
                break;
            }
            if (rule.type === 'email' && value && !this.isValidEmail(value)) {
                error = rule.message || 'Please enter a valid email address';
                break;
            }
            if (rule.type === 'minLength' && value.length < rule.value) {
                error = rule.message || `Must be at least ${rule.value} characters`;
                break;
            }
            if (rule.type === 'maxLength' && value.length > rule.value) {
                error = rule.message || `Must be no more than ${rule.value} characters`;
                break;
            }
            if (rule.type === 'pattern' && value && !rule.value.test(value)) {
                error = rule.message || 'Invalid format';
                break;
            }
            if (rule.type === 'match') {
                const matchField = this.form.querySelector(`[name="${rule.value}"]`);
                if (matchField && value !== matchField.value) {
                    error = rule.message || 'Fields do not match';
                    break;
                }
            }
            if (rule.type === 'custom' && !rule.validate(value, field)) {
                error = rule.message || 'Invalid value';
                break;
            }
        }

        // Check custom validators
        const fieldName = field.name || field.id;
        if (!error && this.options.customValidators[fieldName]) {
            const customResult = this.options.customValidators[fieldName](value, field);
            if (customResult !== true) {
                error = customResult;
            }
        }

        if (error) {
            this.setFieldError(field, error);
            return false;
        } else {
            this.clearFieldError(field);
            return true;
        }
    }

    /**
     * Get validation rules from field attributes
     */
    getFieldRules(field) {
        const rules = [];

        if (field.required || field.hasAttribute('data-required')) {
            rules.push({
                type: 'required',
                message: field.getAttribute('data-error-required')
            });
        }
        if (field.type === 'email') {
            rules.push({
                type: 'email',
                message: field.getAttribute('data-error-email')
            });
        }
        if (field.minLength > 0) {
            rules.push({
                type: 'minLength',
                value: field.minLength,
                message: field.getAttribute('data-error-minlength')
            });
        }
        if (field.maxLength > 0 && field.maxLength < 524288) {
            rules.push({
                type: 'maxLength',
                value: field.maxLength,
                message: field.getAttribute('data-error-maxlength')
            });
        }
        if (field.pattern) {
            rules.push({
                type: 'pattern',
                value: new RegExp(field.pattern),
                message: field.getAttribute('data-error-pattern')
            });
        }
        if (field.hasAttribute('data-match')) {
            rules.push({
                type: 'match',
                value: field.getAttribute('data-match'),
                message: field.getAttribute('data-error-match')
            });
        }

        return rules;
    }

    /**
     * Set error on field
     */
    setFieldError(field, message) {
        const fieldId = field.id || field.name;
        this.errors.set(fieldId, message);

        // Add error class to field
        field.classList.add('field--error');
        field.setAttribute('aria-invalid', 'true');

        // Create or update error message element
        let errorEl = this.getErrorElement(field);
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.id = `${fieldId}-error`;
            field.setAttribute('aria-describedby', errorEl.id);

            // Insert after field or field wrapper
            const wrapper = field.closest('.form-field') || field.parentElement;
            wrapper.appendChild(errorEl);
        }

        errorEl.textContent = message;
        errorEl.classList.add('field-error--visible');

        // Trigger haptic on mobile
        if (window.toast) {
            window.toast.triggerHaptic('error');
        }
    }

    /**
     * Clear error from field
     */
    clearFieldError(field) {
        const fieldId = field.id || field.name;
        this.errors.delete(fieldId);

        field.classList.remove('field--error');
        field.removeAttribute('aria-invalid');

        const errorEl = this.getErrorElement(field);
        if (errorEl) {
            errorEl.classList.remove('field-error--visible');
        }
    }

    /**
     * Get error element for field
     */
    getErrorElement(field) {
        const wrapper = field.closest('.form-field') || field.parentElement;
        return wrapper.querySelector('.field-error');
    }

    /**
     * Validate all fields
     */
    validateAll() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            if (this.options.showSummary) {
                this.showErrorSummary();
            }

            if (this.options.scrollToError) {
                this.scrollToFirstError();
            }

            // Trigger haptic
            if (window.toast) {
                window.toast.triggerHaptic('error');
            }
        } else {
            this.hideErrorSummary();
        }

        return isValid;
    }

    /**
     * Show error summary at top of form
     */
    showErrorSummary() {
        let summary = this.form.querySelector('.form-error-summary');

        if (!summary) {
            summary = document.createElement('div');
            summary.className = 'form-error-summary';
            summary.setAttribute('role', 'alert');
            summary.setAttribute('aria-live', 'polite');
            this.form.insertBefore(summary, this.form.firstChild);
        }

        const errorCount = this.errors.size;
        summary.innerHTML = `
            <div class="form-error-summary__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
            </div>
            <div class="form-error-summary__content">
                <div class="form-error-summary__title">
                    Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before continuing
                </div>
                <ul class="form-error-summary__list">
                    ${Array.from(this.errors.entries()).map(([fieldId, message]) => `
                        <li><a href="#${fieldId}" onclick="document.getElementById('${fieldId}')?.focus(); return false;">${message}</a></li>
                    `).join('')}
                </ul>
            </div>
        `;

        summary.classList.add('form-error-summary--visible');
    }

    /**
     * Hide error summary
     */
    hideErrorSummary() {
        const summary = this.form.querySelector('.form-error-summary');
        if (summary) {
            summary.classList.remove('form-error-summary--visible');
        }
    }

    /**
     * Scroll to first error
     */
    scrollToFirstError() {
        const firstError = this.form.querySelector('.field--error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => firstError.focus(), 300);
        }
    }

    /**
     * Email validation helper
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Clear all errors
     */
    clearAll() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => this.clearFieldError(input));
        this.hideErrorSummary();
    }

    /**
     * Add custom validator
     */
    addValidator(fieldName, validator) {
        this.options.customValidators[fieldName] = validator;
    }

    /**
     * Remove custom validator
     */
    removeValidator(fieldName) {
        delete this.options.customValidators[fieldName];
    }
}

/**
 * Empty State Component Generator
 */
class EmptyState {
    static render(options = {}) {
        const {
            icon = 'search',
            title = 'Nothing to show',
            message = 'There is no content to display at this time.',
            action = null,
            secondaryAction = null,
            variant = 'default',
            illustration = null
        } = options;

        const icons = {
            search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
            </svg>`,
            folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>`,
            compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>`,
            inbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
            </svg>`,
            users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>`,
            bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>`,
            '404': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
            </svg>`,
            offline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
            </svg>`,
            filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>`,
            star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>`
        };

        const actionHtml = action ? `
            <div class="empty-state__action">
                ${action.href
                    ? `<a href="${action.href}" class="empty-state__button empty-state__button--primary">${action.icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${EmptyState.getActionIconPath(action.icon)}</svg>` : ''}${action.label}</a>`
                    : `<button class="empty-state__button empty-state__button--primary" type="button">${action.icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${EmptyState.getActionIconPath(action.icon)}</svg>` : ''}${action.label}</button>`
                }
            </div>
        ` : '';

        const secondaryActionHtml = secondaryAction ? `
            <div class="empty-state__secondary-action">
                ${secondaryAction.href
                    ? `<a href="${secondaryAction.href}" class="empty-state__button empty-state__button--secondary">${secondaryAction.label}</a>`
                    : `<button class="empty-state__button empty-state__button--secondary" type="button">${secondaryAction.label}</button>`
                }
            </div>
        ` : '';

        return `
            <div class="empty-state empty-state--${variant}" role="status" aria-label="${title}">
                ${illustration ? `<div class="empty-state__illustration">${illustration}</div>` : ''}
                <div class="empty-state__icon">
                    ${icons[icon] || icons.search}
                </div>
                <h3 class="empty-state__title">${title}</h3>
                <p class="empty-state__message">${message}</p>
                <div class="empty-state__actions">
                    ${actionHtml}
                    ${secondaryActionHtml}
                </div>
            </div>
        `;
    }

    static getActionIconPath(icon) {
        const paths = {
            plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
            search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
            refresh: '<path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>',
            home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
            arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
            filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
        };
        return paths[icon] || paths.plus;
    }

    /**
     * No search results template
     */
    static renderNoResults(query, options = {}) {
        return EmptyState.render({
            icon: 'search',
            title: 'No results found',
            message: query
                ? `We couldn't find anything matching "${query}". Try adjusting your search terms.`
                : 'Try adjusting your search or filter criteria.',
            variant: 'search',
            action: options.onClear ? {
                label: 'Clear Search',
                icon: 'refresh'
            } : null,
            ...options
        });
    }

    /**
     * No items in list template
     */
    static renderNoItems(itemType = 'items', options = {}) {
        return EmptyState.render({
            icon: 'inbox',
            title: `No ${itemType} yet`,
            message: `When you add ${itemType}, they will appear here.`,
            variant: 'default',
            ...options
        });
    }

    /**
     * No favorites template
     */
    static renderNoFavorites(options = {}) {
        return EmptyState.render({
            icon: 'star',
            title: 'No favorites yet',
            message: 'Items you favorite will appear here for quick access.',
            variant: 'default',
            action: {
                label: 'Explore Content',
                href: '#/mythologies',
                icon: 'search'
            },
            ...options
        });
    }

    /**
     * Error state template
     */
    static renderError(message, options = {}) {
        return EmptyState.render({
            icon: 'error',
            title: 'Something went wrong',
            message: message || 'An error occurred while loading content.',
            variant: 'error',
            action: options.onRetry ? {
                label: 'Try Again',
                icon: 'refresh'
            } : null,
            ...options
        });
    }

    /**
     * Offline state template
     */
    static renderOffline(options = {}) {
        return EmptyState.render({
            icon: 'offline',
            title: 'You are offline',
            message: 'Please check your internet connection and try again.',
            variant: 'offline',
            action: {
                label: 'Retry',
                icon: 'refresh'
            },
            ...options
        });
    }

    /**
     * 404 Page template
     */
    static render404() {
        return `
            <div class="page-404">
                <div class="page-404__content">
                    <div class="page-404__illustration">
                        <svg viewBox="0 0 200 200" fill="none">
                            <!-- Mystical eye background -->
                            <circle cx="100" cy="100" r="80" stroke="rgba(147, 112, 219, 0.3)" stroke-width="2" fill="none" class="page-404__ring page-404__ring--outer"/>
                            <circle cx="100" cy="100" r="60" stroke="rgba(147, 112, 219, 0.4)" stroke-width="1.5" fill="none" class="page-404__ring page-404__ring--middle"/>
                            <circle cx="100" cy="100" r="40" stroke="rgba(147, 112, 219, 0.5)" stroke-width="1" fill="none" class="page-404__ring page-404__ring--inner"/>

                            <!-- Eye shape -->
                            <path d="M20 100c0 0 35-50 80-50s80 50 80 50s-35 50-80 50S20 100 20 100z"
                                  stroke="rgba(218, 165, 32, 0.6)" stroke-width="2" fill="rgba(147, 112, 219, 0.1)" class="page-404__eye"/>

                            <!-- Iris -->
                            <circle cx="100" cy="100" r="25" fill="rgba(147, 112, 219, 0.3)" stroke="rgba(147, 112, 219, 0.6)" stroke-width="2" class="page-404__iris"/>

                            <!-- Pupil -->
                            <circle cx="100" cy="100" r="12" fill="rgba(26, 31, 58, 0.9)" class="page-404__pupil"/>

                            <!-- Question mark in pupil -->
                            <text x="100" y="108" text-anchor="middle" fill="rgba(218, 165, 32, 0.8)" font-size="18" font-family="serif" class="page-404__question">?</text>

                            <!-- Decorative lines -->
                            <path d="M100 10 L100 25" stroke="rgba(147, 112, 219, 0.4)" stroke-width="1"/>
                            <path d="M100 175 L100 190" stroke="rgba(147, 112, 219, 0.4)" stroke-width="1"/>
                            <path d="M10 100 L25 100" stroke="rgba(147, 112, 219, 0.4)" stroke-width="1"/>
                            <path d="M175 100 L190 100" stroke="rgba(147, 112, 219, 0.4)" stroke-width="1"/>
                        </svg>
                    </div>

                    <h1 class="page-404__code">404</h1>
                    <h2 class="page-404__title">This myth has yet to be written...</h2>
                    <p class="page-404__message">
                        The sacred text you seek remains hidden in the mists of time.
                        Perhaps the ancient ones have concealed this knowledge,
                        or it exists in a realm yet to be discovered.
                    </p>

                    <div class="page-404__search">
                        <input type="text" class="page-404__search-input" placeholder="Search the archives..." aria-label="Search"/>
                        <button class="page-404__search-button" aria-label="Search">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                            </svg>
                        </button>
                    </div>

                    <div class="page-404__actions">
                        <a href="#/" class="page-404__button page-404__button--primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            Return Home
                        </a>
                        <a href="#/mythologies" class="page-404__button page-404__button--secondary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10"/>
                            </svg>
                            Explore Mythologies
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Auto-initialize global toast system
if (typeof window !== 'undefined') {
    window.toast = new ToastNotifications();
    window.ToastNotifications = ToastNotifications;
    window.ErrorBoundary = ErrorBoundary;
    window.FormValidation = FormValidation;
    window.EmptyState = EmptyState;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToastNotifications, ErrorBoundary, FormValidation, EmptyState };
}
