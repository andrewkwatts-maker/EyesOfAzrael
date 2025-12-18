/**
 * Toast Notification System
 * Beautiful, accessible toast notifications
 */

class ToastNotifications {
    constructor(options = {}) {
        this.options = {
            position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
            duration: 5000,
            maxToasts: 5,
            ...options
        };

        this.container = null;
        this.toasts = [];
        this.init();
    }

    /**
     * Initialize toast container
     */
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Notifications');
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     */
    show(message, options = {}) {
        const {
            type = 'info',
            title = '',
            duration = this.options.duration,
            dismissible = true,
            icon = this.getDefaultIcon(type)
        } = options;

        // Remove oldest toast if at max
        if (this.toasts.length >= this.options.maxToasts) {
            this.remove(this.toasts[0]);
        }

        // Create toast element
        const toast = this.createToast({
            type,
            title,
            message,
            icon,
            dismissible,
            duration
        });

        // Add to container
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Create toast element
     */
    createToast(config) {
        const { type, title, message, icon, dismissible, duration } = config;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        // Icon
        const iconEl = document.createElement('div');
        iconEl.className = 'toast-icon';
        iconEl.textContent = icon;
        iconEl.setAttribute('aria-hidden', 'true');
        toast.appendChild(iconEl);

        // Content
        const content = document.createElement('div');
        content.className = 'toast-content';

        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'toast-title';
            titleEl.textContent = title;
            content.appendChild(titleEl);
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);

        toast.appendChild(content);

        // Close button
        if (dismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.onclick = () => this.remove(toast);
            toast.appendChild(closeBtn);
        }

        // Progress bar
        if (duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            progress.style.animationDuration = `${duration}ms`;
            toast.appendChild(progress);
        }

        return toast;
    }

    /**
     * Remove a toast
     */
    remove(toast) {
        if (!toast || !toast.parentElement) return;

        toast.classList.add('removing');

        setTimeout(() => {
            if (toast.parentElement) {
                this.container.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    /**
     * Get default icon for toast type
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Success toast
     */
    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    /**
     * Error toast
     */
    error(message, options = {}) {
        return this.show(message, { ...options, type: 'error' });
    }

    /**
     * Warning toast
     */
    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning' });
    }

    /**
     * Info toast
     */
    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }

    /**
     * Clear all toasts
     */
    clearAll() {
        [...this.toasts].forEach(toast => this.remove(toast));
    }

    /**
     * Cleanup
     */
    destroy() {
        this.clearAll();
        if (this.container && this.container.parentElement) {
            document.body.removeChild(this.container);
        }
    }
}

// Auto-initialize global toast system
if (typeof window !== 'undefined') {
    window.toast = new ToastNotifications();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastNotifications;
}
