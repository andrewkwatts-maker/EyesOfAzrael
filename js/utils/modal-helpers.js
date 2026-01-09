/**
 * Modal Helper Utilities
 * Eyes of Azrael Project
 *
 * Provides convenient helper functions for common modal operations:
 * - Confirmation dialogs
 * - Alert dialogs
 * - Prompt dialogs
 * - Loading overlays
 * - Focus management
 */

const ModalHelpers = {
    /**
     * Show a confirmation dialog
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
     */
    confirm: function(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm Action',
                message = 'Are you sure you want to proceed?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning', // warning, danger, info, success
                confirmButtonClass = type === 'danger' ? 'modal-btn-danger' : 'modal-btn-primary',
                icon = null
            } = options;

            // Remove existing dialog
            const existing = document.getElementById('eoa-confirm-dialog');
            if (existing) existing.remove();

            // Store previous focus
            const previousActiveElement = document.activeElement;

            // Create dialog
            const overlay = document.createElement('div');
            overlay.id = 'eoa-confirm-dialog';
            overlay.className = 'confirm-dialog-overlay';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'confirm-dialog-title');
            overlay.setAttribute('aria-describedby', 'confirm-dialog-message');

            const iconSVG = this.getDialogIcon(type, icon);

            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-dialog-icon ${type}">
                        ${iconSVG}
                    </div>
                    <h3 id="confirm-dialog-title">${this.escapeHtml(title)}</h3>
                    <p id="confirm-dialog-message">${this.escapeHtml(message)}</p>
                    <div class="confirm-dialog-actions">
                        <button class="modal-btn modal-btn-secondary" data-action="cancel">
                            ${this.escapeHtml(cancelText)}
                        </button>
                        <button class="modal-btn ${confirmButtonClass}" data-action="confirm">
                            ${this.escapeHtml(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.classList.add('modal-open');

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });

            const cleanup = (result) => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    document.body.classList.remove('modal-open');
                    if (previousActiveElement && previousActiveElement.focus) {
                        previousActiveElement.focus();
                    }
                    resolve(result);
                }, 200);
            };

            // Button handlers
            overlay.querySelector('[data-action="confirm"]')?.addEventListener('click', () => cleanup(true));
            overlay.querySelector('[data-action="cancel"]')?.addEventListener('click', () => cleanup(false));

            // Backdrop click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cleanup(false);
            });

            // ESC key
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    cleanup(false);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Focus trap
            this.setupFocusTrap(overlay);

            // Focus confirm button (cancel is default safer choice)
            const cancelBtn = overlay.querySelector('[data-action="cancel"]');
            if (cancelBtn) cancelBtn.focus();
        });
    },

    /**
     * Show an alert dialog (single button)
     * @param {Object} options - Dialog options
     * @returns {Promise<void>}
     */
    alert: function(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Alert',
                message = '',
                buttonText = 'OK',
                type = 'info' // info, success, warning, error
            } = options;

            // Remove existing dialog
            const existing = document.getElementById('eoa-alert-dialog');
            if (existing) existing.remove();

            const previousActiveElement = document.activeElement;

            const overlay = document.createElement('div');
            overlay.id = 'eoa-alert-dialog';
            overlay.className = 'confirm-dialog-overlay';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'alert-dialog-title');
            overlay.setAttribute('aria-describedby', 'alert-dialog-message');

            const iconSVG = this.getDialogIcon(type);

            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-dialog-icon ${type}">
                        ${iconSVG}
                    </div>
                    <h3 id="alert-dialog-title">${this.escapeHtml(title)}</h3>
                    <p id="alert-dialog-message">${this.escapeHtml(message)}</p>
                    <div class="confirm-dialog-actions">
                        <button class="modal-btn modal-btn-primary" data-action="ok">
                            ${this.escapeHtml(buttonText)}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.classList.add('modal-open');

            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });

            const cleanup = () => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    document.body.classList.remove('modal-open');
                    if (previousActiveElement && previousActiveElement.focus) {
                        previousActiveElement.focus();
                    }
                    resolve();
                }, 200);
            };

            overlay.querySelector('[data-action="ok"]')?.addEventListener('click', cleanup);

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cleanup();
            });

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    cleanup();
                }
            };
            document.addEventListener('keydown', escHandler);

            const okBtn = overlay.querySelector('[data-action="ok"]');
            if (okBtn) okBtn.focus();
        });
    },

    /**
     * Show a delete confirmation with extra warning
     * @param {Object} options - Dialog options
     * @returns {Promise<boolean>}
     */
    confirmDelete: function(options = {}) {
        return this.confirm({
            title: options.title || 'Delete Confirmation',
            message: options.message || 'This action cannot be undone. Are you sure you want to delete this item?',
            confirmText: options.confirmText || 'Delete Forever',
            cancelText: options.cancelText || 'Cancel',
            type: 'danger',
            confirmButtonClass: 'modal-btn-danger',
            ...options
        });
    },

    /**
     * Show a loading overlay on an element
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} message - Loading message
     * @returns {Function} - Cleanup function to remove the overlay
     */
    showLoading: function(element, message = 'Loading...') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return () => {};

        // Store original position
        const originalPosition = el.style.position;
        if (getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-loading-overlay show';
        overlay.innerHTML = `
            <div class="modal-loading-spinner"></div>
            <p class="modal-loading-text">${this.escapeHtml(message)}</p>
        `;

        el.appendChild(overlay);

        return () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                if (originalPosition !== undefined) {
                    el.style.position = originalPosition;
                }
            }, 200);
        };
    },

    /**
     * Create and manage focus trap for a modal element
     * @param {HTMLElement} container
     */
    setupFocusTrap: function(container) {
        const getFocusable = () => {
            const selector = [
                'button:not([disabled])',
                '[href]',
                'input:not([disabled]):not([type="hidden"])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ].join(',');
            return Array.from(container.querySelectorAll(selector))
                .filter(el => el.offsetParent !== null);
        };

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            const focusable = getFocusable();
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        container.addEventListener('keydown', handleTab);

        return () => {
            container.removeEventListener('keydown', handleTab);
        };
    },

    /**
     * Get dialog icon SVG based on type
     * @param {string} type
     * @param {string} customIcon
     * @returns {string}
     */
    getDialogIcon: function(type, customIcon = null) {
        if (customIcon) return customIcon;

        const icons = {
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
            danger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>`
        };

        return icons[type] || icons.info;
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str
     * @returns {string}
     */
    escapeHtml: function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Calculate scrollbar width to prevent layout shift
     * @returns {number}
     */
    getScrollbarWidth: function() {
        const scrollDiv = document.createElement('div');
        scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
        document.body.appendChild(scrollDiv);
        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return scrollbarWidth;
    },

    /**
     * Apply scrollbar width CSS variable to prevent layout shift
     */
    applyScrollbarCompensation: function() {
        document.documentElement.style.setProperty('--scrollbar-width', this.getScrollbarWidth() + 'px');
    }
};

// Auto-apply scrollbar compensation on load
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ModalHelpers.applyScrollbarCompensation();
        });
    } else {
        ModalHelpers.applyScrollbarCompensation();
    }
}

// Make globally available
window.ModalHelpers = ModalHelpers;

// Convenience aliases
window.confirmDialog = ModalHelpers.confirm.bind(ModalHelpers);
window.alertDialog = ModalHelpers.alert.bind(ModalHelpers);
window.confirmDelete = ModalHelpers.confirmDelete.bind(ModalHelpers);
window.showLoading = ModalHelpers.showLoading.bind(ModalHelpers);

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalHelpers;
}
