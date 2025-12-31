/**
 * Eyes of Azrael - Diagnostic Panel Component
 *
 * User-facing diagnostics panel that shows when initialization fails.
 * Displays clear status indicators, error messages, and recovery options.
 *
 * Features:
 * - Green/yellow/red status for each check
 * - Clear error messages with fix suggestions
 * - Retry functionality
 * - Technical details (expandable)
 * - Copy diagnostic report button
 *
 * @module components/diagnostic-panel
 */

const DiagnosticPanel = {
    /**
     * Current panel element
     * @type {HTMLElement|null}
     */
    element: null,

    /**
     * Show the diagnostic panel
     *
     * @param {Object} results - Results from StartupChecklist.runAll()
     * @param {Object} [options={}] - Display options
     * @param {string} [options.container='main-content'] - Container element ID
     * @param {boolean} [options.allowDismiss=false] - Allow dismissing critical failures
     */
    show(results, options = {}) {
        const {
            container = 'main-content',
            allowDismiss = false
        } = options;

        // Find container
        const containerEl = document.getElementById(container) || document.body;

        // Determine severity
        const hasCritical = results.criticalFailures?.length > 0;
        const hasWarnings = results.optionalFailures?.length > 0;
        const severity = hasCritical ? 'critical' : (hasWarnings ? 'warning' : 'success');

        // Build panel HTML
        const html = this._buildPanelHTML(results, severity, allowDismiss);

        // Create panel element
        this.element = document.createElement('div');
        this.element.id = 'diagnostic-panel';
        this.element.className = `diagnostic-panel diagnostic-panel--${severity}`;
        this.element.setAttribute('role', 'alert');
        this.element.setAttribute('aria-live', 'assertive');
        this.element.innerHTML = html;

        // Clear container and insert panel
        containerEl.innerHTML = '';
        containerEl.appendChild(this.element);

        // Attach event handlers
        this._attachEventHandlers(results);

        // Log for debugging
        console.log('[DiagnosticPanel] Shown with severity:', severity);
    },

    /**
     * Hide the diagnostic panel
     */
    hide() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    },

    /**
     * Check if panel is currently shown
     * @returns {boolean}
     */
    isVisible() {
        return this.element !== null && document.body.contains(this.element);
    },

    /**
     * Build panel HTML
     * @private
     */
    _buildPanelHTML(results, severity, allowDismiss) {
        const title = this._getTitle(severity);
        const message = this._getMessage(severity, results);
        const icon = this._getIcon(severity);

        return `
            <div class="diagnostic-panel__container">
                <header class="diagnostic-panel__header">
                    <span class="diagnostic-panel__icon" aria-hidden="true">${icon}</span>
                    <h2 class="diagnostic-panel__title">${title}</h2>
                </header>

                <p class="diagnostic-panel__message">${message}</p>

                <section class="diagnostic-panel__checklist" aria-label="Dependency check results">
                    <h3 class="sr-only">Check Results</h3>
                    <ul>
                        ${this._buildChecklistItems(results.results)}
                    </ul>
                </section>

                <div class="diagnostic-panel__actions">
                    <button class="btn-primary diagnostic-panel__retry" type="button">
                        <span aria-hidden="true">↻</span> Retry
                    </button>
                    ${allowDismiss && severity !== 'critical' ? `
                        <button class="btn-secondary diagnostic-panel__dismiss" type="button">
                            Continue Anyway
                        </button>
                    ` : ''}
                    <button class="btn-secondary diagnostic-panel__details-toggle" type="button">
                        Technical Details
                    </button>
                </div>

                <details class="diagnostic-panel__details">
                    <summary class="sr-only">Technical Details</summary>
                    <div class="diagnostic-panel__details-content">
                        <h4>Diagnostic Report</h4>
                        <pre class="diagnostic-panel__json">${this._formatJSON(results)}</pre>
                        <div class="diagnostic-panel__details-actions">
                            <button class="btn-sm btn-secondary diagnostic-panel__copy" type="button">
                                Copy to Clipboard
                            </button>
                            <button class="btn-sm btn-secondary diagnostic-panel__download" type="button">
                                Download Report
                            </button>
                        </div>
                        <h4>Environment</h4>
                        <pre class="diagnostic-panel__env">${this._getEnvironmentInfo()}</pre>
                    </div>
                </details>

                <footer class="diagnostic-panel__footer">
                    <p>
                        Need help? Check the
                        <a href="https://github.com/andrewkwatts-maker/EyesOfAzrael/issues" target="_blank" rel="noopener">
                            GitHub Issues
                        </a>
                        or contact support.
                    </p>
                </footer>
            </div>
        `;
    },

    /**
     * Build checklist items HTML
     * @private
     */
    _buildChecklistItems(results) {
        return results.map(r => {
            const status = r.passed ? 'success' : (r.critical ? 'error' : 'warning');
            const icon = r.passed ? '✓' : (r.critical ? '✗' : '!');

            return `
                <li class="diagnostic-panel__item diagnostic-panel__item--${status}">
                    <span class="diagnostic-panel__item-status" aria-hidden="true">${icon}</span>
                    <div class="diagnostic-panel__item-content">
                        <span class="diagnostic-panel__item-name">${this._escapeHtml(r.name)}</span>
                        ${r.critical ? '<span class="diagnostic-panel__item-badge">Required</span>' : ''}
                        ${!r.passed && r.guidance ? `
                            <span class="diagnostic-panel__item-hint">${this._escapeHtml(r.guidance)}</span>
                        ` : ''}
                    </div>
                </li>
            `;
        }).join('');
    },

    /**
     * Attach event handlers to panel buttons
     * @private
     */
    _attachEventHandlers(results) {
        if (!this.element) return;

        // Retry button
        const retryBtn = this.element.querySelector('.diagnostic-panel__retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        // Dismiss button
        const dismissBtn = this.element.querySelector('.diagnostic-panel__dismiss');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.hide();
                // Emit event for app to continue with warnings
                document.dispatchEvent(new CustomEvent('diagnostic-dismissed', {
                    detail: { results }
                }));
            });
        }

        // Details toggle
        const detailsToggle = this.element.querySelector('.diagnostic-panel__details-toggle');
        const details = this.element.querySelector('.diagnostic-panel__details');
        if (detailsToggle && details) {
            detailsToggle.addEventListener('click', () => {
                details.open = !details.open;
                detailsToggle.textContent = details.open ? 'Hide Details' : 'Technical Details';
            });
        }

        // Copy button
        const copyBtn = this.element.querySelector('.diagnostic-panel__copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 2000);
                } catch (error) {
                    console.error('Failed to copy:', error);
                    copyBtn.textContent = 'Copy failed';
                }
            });
        }

        // Download button
        const downloadBtn = this.element.querySelector('.diagnostic-panel__download');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const report = {
                    ...results,
                    environment: this._getEnvironmentData(),
                    timestamp: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diagnostic-report-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
    },

    /**
     * Get title based on severity
     * @private
     */
    _getTitle(severity) {
        switch (severity) {
            case 'critical': return 'Initialization Failed';
            case 'warning': return 'Limited Functionality';
            case 'success': return 'All Systems Ready';
            default: return 'System Status';
        }
    },

    /**
     * Get message based on severity
     * @private
     */
    _getMessage(severity, results) {
        switch (severity) {
            case 'critical':
                return `${results.criticalFailures.length} required component(s) failed to load. ` +
                       `The application cannot start until these issues are resolved.`;
            case 'warning':
                return `${results.optionalFailures.length} optional feature(s) are unavailable. ` +
                       `The app will work with reduced functionality.`;
            case 'success':
                return 'All components loaded successfully.';
            default:
                return 'Checking system status...';
        }
    },

    /**
     * Get icon based on severity
     * @private
     */
    _getIcon(severity) {
        switch (severity) {
            case 'critical': return '🚫';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    },

    /**
     * Format JSON for display
     * @private
     */
    _formatJSON(data) {
        return this._escapeHtml(JSON.stringify(data, null, 2));
    },

    /**
     * Get environment info string
     * @private
     */
    _getEnvironmentInfo() {
        const data = this._getEnvironmentData();
        return Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
    },

    /**
     * Get environment data object
     * @private
     */
    _getEnvironmentData() {
        return {
            'User Agent': navigator.userAgent,
            'URL': window.location.href,
            'Timestamp': new Date().toISOString(),
            'Screen': `${window.screen.width}x${window.screen.height}`,
            'Viewport': `${window.innerWidth}x${window.innerHeight}`,
            'Online': navigator.onLine ? 'Yes' : 'No',
            'Firebase Loaded': typeof firebase !== 'undefined' ? 'Yes' : 'No',
            'Service Worker': 'serviceWorker' in navigator ? 'Supported' : 'Not supported'
        };
    },

    /**
     * Escape HTML special characters
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
};

// Export for both module and browser contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticPanel;
}

if (typeof window !== 'undefined') {
    window.DiagnosticPanel = DiagnosticPanel;
    console.log('[DiagnosticPanel] Component loaded');
}
