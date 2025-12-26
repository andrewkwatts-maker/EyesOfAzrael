/**
 * Global Error Handler for Eyes of Azrael
 *
 * Catches and logs ALL JavaScript errors in the browser console and displays
 * user-friendly error messages.
 *
 * Features:
 * - Catches unhandled errors
 * - Catches unhandled promise rejections
 * - Logs to console with stack traces
 * - Shows user-friendly error banners
 * - Collects error analytics
 * - Prevents white screen of death
 *
 * LOAD THIS FIRST before any other scripts!
 */

(function() {
    'use strict';

    // Error collection for debugging
    window.ErrorLog = {
        errors: [],
        warnings: [],
        maxErrors: 100,

        addError: function(error) {
            this.errors.push({
                message: error.message || String(error),
                stack: error.stack || '',
                timestamp: new Date().toISOString(),
                type: 'error',
                url: window.location.href
            });

            // Keep only last 100 errors
            if (this.errors.length > this.maxErrors) {
                this.errors.shift();
            }
        },

        addWarning: function(warning) {
            this.warnings.push({
                message: String(warning),
                timestamp: new Date().toISOString(),
                type: 'warning',
                url: window.location.href
            });

            if (this.warnings.length > this.maxErrors) {
                this.warnings.shift();
            }
        },

        getErrors: function() {
            return this.errors;
        },

        getWarnings: function() {
            return this.warnings;
        },

        getAll: function() {
            return [...this.errors, ...this.warnings].sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );
        },

        clear: function() {
            this.errors = [];
            this.warnings = [];
            console.log('[ErrorLog] Cleared all errors and warnings');
        },

        exportLogs: function() {
            const logs = {
                errors: this.errors,
                warnings: this.warnings,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `error-log-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Error categorization
    const ErrorCategories = {
        FIREBASE: 'Firebase',
        MODULE: 'ES6 Module',
        NETWORK: 'Network',
        PERMISSION: 'Permission',
        DOM: 'DOM',
        TYPE: 'Type Error',
        REFERENCE: 'Reference Error',
        SYNTAX: 'Syntax Error',
        SECURITY: 'Security',
        UNKNOWN: 'Unknown'
    };

    /**
     * Categorize error based on message and stack
     */
    function categorizeError(error) {
        const message = error.message || String(error);
        const stack = error.stack || '';

        if (message.includes('Firebase') || message.includes('firestore') || message.includes('auth/')) {
            return ErrorCategories.FIREBASE;
        }
        if (message.includes('import') || message.includes('module')) {
            return ErrorCategories.MODULE;
        }
        if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('CORS')) {
            return ErrorCategories.NETWORK;
        }
        if (message.includes('permission') || message.includes('Permission denied')) {
            return ErrorCategories.PERMISSION;
        }
        if (message.includes('null') || message.includes('undefined') || stack.includes('querySelector')) {
            return ErrorCategories.DOM;
        }
        if (error.name === 'TypeError') {
            return ErrorCategories.TYPE;
        }
        if (error.name === 'ReferenceError') {
            return ErrorCategories.REFERENCE;
        }
        if (error.name === 'SyntaxError') {
            return ErrorCategories.SYNTAX;
        }
        if (message.includes('XSS') || message.includes('script')) {
            return ErrorCategories.SECURITY;
        }

        return ErrorCategories.UNKNOWN;
    }

    /**
     * Get user-friendly error message
     */
    function getUserFriendlyMessage(category, error) {
        const defaultMessage = 'An unexpected error occurred. Please try refreshing the page.';

        const messages = {
            [ErrorCategories.FIREBASE]: 'Database connection issue. Please check your internet connection and try again.',
            [ErrorCategories.MODULE]: 'Application loading error. Please clear your browser cache and refresh.',
            [ErrorCategories.NETWORK]: 'Network error. Please check your internet connection.',
            [ErrorCategories.PERMISSION]: 'Access denied. You may need to sign in to view this content.',
            [ErrorCategories.DOM]: 'Page rendering error. Please refresh the page.',
            [ErrorCategories.TYPE]: 'Application error. Our team has been notified.',
            [ErrorCategories.REFERENCE]: 'Application error. Please refresh the page.',
            [ErrorCategories.SYNTAX]: 'Code error detected. Please report this issue.',
            [ErrorCategories.SECURITY]: 'Security error detected. Please refresh the page.'
        };

        // Check for specific known errors
        const message = error.message || String(error);

        if (message.includes('firebase is not defined')) {
            return 'Firebase SDK failed to load. Please check your internet connection and refresh.';
        }
        if (message.includes('Cannot use import statement')) {
            return 'Application loading error. Please refresh the page.';
        }
        if (message.includes('Firebase initialization timeout')) {
            return 'Database connection timeout. Please refresh the page.';
        }
        if (message.includes('permission-denied') || message.includes('insufficient permissions')) {
            return 'You don\'t have permission to access this content. Please sign in.';
        }
        if (message.includes('404')) {
            return 'Resource not found. The page you\'re looking for may have been moved or deleted.';
        }
        if (message.includes('QuotaExceeded')) {
            return 'Storage quota exceeded. Please clear your browser data.';
        }

        return messages[category] || defaultMessage;
    }

    /**
     * Log error to console with enhanced formatting
     */
    function logError(error, context = {}) {
        const category = categorizeError(error);
        const timestamp = new Date().toISOString();

        console.group(`%c[ERROR] ${category} - ${timestamp}`, 'color: #ff4444; font-weight: bold;');
        console.error('Message:', error.message || String(error));
        console.error('Category:', category);

        if (error.stack) {
            console.error('Stack Trace:', error.stack);
        }

        if (context.source) {
            console.error('Source:', context.source);
        }

        if (context.line) {
            console.error('Line:', context.line);
        }

        if (context.column) {
            console.error('Column:', context.column);
        }

        console.error('URL:', window.location.href);
        console.error('User Agent:', navigator.userAgent);
        console.error('Timestamp:', timestamp);
        console.groupEnd();

        // Add to error log
        window.ErrorLog.addError({
            ...error,
            category,
            context,
            timestamp
        });
    }

    /**
     * Show error banner to user
     */
    function showErrorBanner(message, category, isDismissible = true) {
        // Don't show duplicate banners
        if (document.querySelector('.global-error-banner')) {
            const existing = document.querySelector('.global-error-banner .error-message');
            if (existing && existing.textContent === message) {
                return;
            }
        }

        const banner = document.createElement('div');
        banner.className = 'global-error-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
            padding: 16px 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: slideDown 0.3s ease-out;
        `;

        const content = document.createElement('div');
        content.style.cssText = 'flex: 1; display: flex; align-items: center; gap: 12px;';

        const icon = document.createElement('span');
        icon.textContent = '⚠️';
        icon.style.cssText = 'font-size: 20px;';

        const messageContainer = document.createElement('div');
        messageContainer.style.cssText = 'flex: 1;';

        const categoryLabel = document.createElement('div');
        categoryLabel.textContent = category;
        categoryLabel.style.cssText = 'font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;';

        const messageText = document.createElement('div');
        messageText.className = 'error-message';
        messageText.textContent = message;
        messageText.style.cssText = 'font-size: 14px; font-weight: 500;';

        messageContainer.appendChild(categoryLabel);
        messageContainer.appendChild(messageText);

        content.appendChild(icon);
        content.appendChild(messageContainer);

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 8px;';

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh';
        refreshBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.2s;
        `;
        refreshBtn.onmouseover = () => refreshBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        refreshBtn.onmouseout = () => refreshBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        refreshBtn.onclick = () => window.location.reload();

        if (isDismissible) {
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                background: transparent;
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0 8px;
                opacity: 0.8;
                transition: opacity 0.2s;
            `;
            closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
            closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
            closeBtn.onclick = () => banner.remove();
            actions.appendChild(closeBtn);
        }

        actions.insertBefore(refreshBtn, actions.firstChild);

        banner.appendChild(content);
        banner.appendChild(actions);

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Insert at top of body
        if (document.body) {
            document.body.insertBefore(banner, document.body.firstChild);
        } else {
            // If body doesn't exist yet, wait for it
            document.addEventListener('DOMContentLoaded', () => {
                document.body.insertBefore(banner, document.body.firstChild);
            });
        }

        // Auto-dismiss after 10 seconds for non-critical errors
        if (isDismissible && category !== ErrorCategories.FIREBASE && category !== ErrorCategories.MODULE) {
            setTimeout(() => {
                if (banner.parentElement) {
                    banner.style.animation = 'slideDown 0.3s ease-out reverse';
                    setTimeout(() => banner.remove(), 300);
                }
            }, 10000);
        }
    }

    /**
     * Handle error
     */
    function handleError(error, context = {}, showBanner = true) {
        logError(error, context);

        if (showBanner) {
            const category = categorizeError(error);
            const message = getUserFriendlyMessage(category, error);

            // Don't show banners for minor errors
            const minorErrors = [
                'ResizeObserver loop',
                'Non-Error promise rejection',
                'Script error.'
            ];

            const isMinor = minorErrors.some(minor =>
                (error.message || String(error)).includes(minor)
            );

            if (!isMinor) {
                const isCritical = category === ErrorCategories.FIREBASE ||
                                 category === ErrorCategories.MODULE ||
                                 category === ErrorCategories.NETWORK;
                showErrorBanner(message, category, !isCritical);
            }
        }

        // Send to analytics (if available)
        if (window.gtag) {
            try {
                window.gtag('event', 'exception', {
                    description: error.message || String(error),
                    fatal: false
                });
            } catch (e) {
                // Silently fail if gtag fails
            }
        }
    }

    // ==================== GLOBAL ERROR HANDLERS ====================

    /**
     * Catch unhandled errors
     */
    window.addEventListener('error', function(event) {
        const error = event.error || new Error(event.message);

        handleError(error, {
            source: event.filename,
            line: event.lineno,
            column: event.colno
        });

        // Prevent default browser error handling for known errors
        const knownErrors = [
            'Cannot use import statement',
            'firebase is not defined',
            'ResizeObserver loop'
        ];

        if (knownErrors.some(known => error.message.includes(known))) {
            event.preventDefault();
        }
    }, true);

    /**
     * Catch unhandled promise rejections
     */
    window.addEventListener('unhandledrejection', function(event) {
        const error = event.reason || new Error('Unhandled Promise Rejection');

        // Add promise-specific context
        error.isPromiseRejection = true;

        handleError(error, {
            type: 'unhandledrejection',
            promise: event.promise
        });

        // Prevent default to avoid duplicate console errors
        event.preventDefault();
    });

    /**
     * Catch resource loading errors
     */
    window.addEventListener('error', function(event) {
        if (event.target !== window) {
            const target = event.target;
            const tagName = target.tagName || '';

            if (tagName === 'SCRIPT' || tagName === 'LINK' || tagName === 'IMG') {
                const error = new Error(`Failed to load ${tagName.toLowerCase()}: ${target.src || target.href}`);

                logError(error, {
                    type: 'resource',
                    tagName,
                    src: target.src || target.href
                });

                // Show banner for critical script failures
                if (tagName === 'SCRIPT') {
                    const src = target.src || '';
                    if (src.includes('firebase') || src.includes('config')) {
                        showErrorBanner(
                            'Failed to load critical application files. Please refresh the page.',
                            ErrorCategories.NETWORK,
                            false
                        );
                    }
                }
            }
        }
    }, true);

    /**
     * Override console.error to catch all errors
     */
    const originalConsoleError = console.error;
    console.error = function(...args) {
        // Call original console.error
        originalConsoleError.apply(console, args);

        // Log to error system if first argument looks like an error
        if (args.length > 0) {
            const firstArg = args[0];
            if (firstArg instanceof Error) {
                window.ErrorLog.addError(firstArg);
            } else if (typeof firstArg === 'string' && firstArg.toLowerCase().includes('error')) {
                window.ErrorLog.addWarning(args.join(' '));
            }
        }
    };

    /**
     * Override console.warn to track warnings
     */
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
        originalConsoleWarn.apply(console, args);
        window.ErrorLog.addWarning(args.join(' '));
    };

    // ==================== DEBUGGING UTILITIES ====================

    /**
     * Global debugging helper
     */
    window.debugErrors = function() {
        console.group('%cError Log Summary', 'color: #9370DB; font-size: 16px; font-weight: bold;');
        console.log(`Total Errors: ${window.ErrorLog.errors.length}`);
        console.log(`Total Warnings: ${window.ErrorLog.warnings.length}`);
        console.groupEnd();

        if (window.ErrorLog.errors.length > 0) {
            console.group('%cRecent Errors', 'color: #ff4444; font-size: 14px; font-weight: bold;');
            window.ErrorLog.getErrors().slice(-10).forEach((error, index) => {
                console.group(`Error #${index + 1} - ${error.timestamp}`);
                console.log('Message:', error.message);
                console.log('Category:', error.category);
                if (error.stack) console.log('Stack:', error.stack);
                console.groupEnd();
            });
            console.groupEnd();
        }

        if (window.ErrorLog.warnings.length > 0) {
            console.group('%cRecent Warnings', 'color: #ff9800; font-size: 14px; font-weight: bold;');
            window.ErrorLog.getWarnings().slice(-10).forEach((warning, index) => {
                console.log(`Warning #${index + 1}:`, warning.message, `(${warning.timestamp})`);
            });
            console.groupEnd();
        }

        console.log('\n💡 Commands:');
        console.log('  ErrorLog.exportLogs()  - Download error log as JSON');
        console.log('  ErrorLog.clear()       - Clear all errors');
        console.log('  ErrorLog.getAll()      - Get all errors and warnings');
    };

    // ==================== INITIALIZATION ====================

    console.log('%c🛡️ Global Error Handler Initialized', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    console.log('%cAll errors will be caught and logged. Use debugErrors() to view error summary.', 'color: #999; font-size: 12px;');

    // Export error handler functions for manual error reporting
    window.reportError = function(error, context) {
        handleError(error, context, true);
    };

    window.reportWarning = function(message) {
        window.ErrorLog.addWarning(message);
        console.warn('[Warning]', message);
    };

})();
