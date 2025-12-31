// First line confirms script loading
console.log('[Startup Checklist] Script loaded');

/**
 * Eyes of Azrael - Startup Checklist
 *
 * Pre-flight validation system that runs before the app initializes.
 * Checks all critical and optional dependencies, showing a diagnostic
 * panel if critical checks fail, or a warning badge for optional failures.
 *
 * Usage:
 *   const results = StartupChecklist.runAll();
 *   if (!results.allCriticalPassed) {
 *       StartupChecklist.showDiagnosticPanel(results);
 *   } else if (!results.allPassed) {
 *       StartupChecklist.showWarningBadge(results);
 *   }
 *
 * @module core/startup-checklist
 */

const StartupChecklist = {
    /**
     * Version for cache busting
     */
    version: '1.0.0',

    /**
     * Check definitions
     * Each check has:
     *   - name: Display name
     *   - check: Function that returns true if passed
     *   - critical: If true, app cannot run without this
     *   - guidance: Help text if check fails
     */
    checks: [
        // Critical checks - app cannot run without these
        // NOTE: DOM Ready removed - it's a timing issue, not a dependency.
        // app-init-simple.js handles waiting for DOM ready separately.
        {
            name: 'Firebase SDK',
            check: () => typeof firebase !== 'undefined' && firebase.apps !== undefined,
            critical: true,
            guidance: 'Ensure Firebase SDK scripts are loaded in index.html'
        },
        {
            name: 'Firebase Config',
            check: () => typeof window.firebaseConfig === 'object' && window.firebaseConfig.projectId,
            critical: true,
            guidance: 'Ensure firebase-config.js is loaded and uses window.firebaseConfig'
        },
        {
            name: 'SPANavigation',
            check: () => typeof window.SPANavigation === 'function',
            critical: true,
            guidance: 'Ensure js/spa-navigation.js is loaded with window.SPANavigation export'
        },
        {
            name: 'UniversalDisplayRenderer',
            check: () => typeof window.UniversalDisplayRenderer === 'function',
            critical: true,
            guidance: 'Ensure js/components/universal-display-renderer.js is loaded'
        },
        {
            name: 'LandingPageView',
            check: () => typeof window.LandingPageView === 'function',
            critical: true,
            guidance: 'Ensure js/views/landing-page-view.js is loaded'
        },

        // Optional checks - app can run with degraded functionality
        {
            name: 'AuthManager',
            check: () => typeof window.AuthManager === 'function',
            critical: false,
            guidance: 'Load js/auth-manager.js for authentication features'
        },
        {
            name: 'ShaderThemeManager',
            check: () => typeof window.ShaderThemeManager === 'function',
            critical: false,
            guidance: 'Load js/shader-theme-picker.js for theme features'
        },
        {
            name: 'EnhancedCorpusSearch',
            check: () => typeof window.EnhancedCorpusSearch === 'function',
            critical: false,
            guidance: 'Load js/components/corpus-search-enhanced.js for search features'
        },
        {
            name: 'FirebaseCRUDManager',
            check: () => typeof window.FirebaseCRUDManager === 'function',
            critical: false,
            guidance: 'Load js/firebase-crud-manager.js for edit features'
        },
        {
            name: 'FavoritesService',
            check: () => typeof window.FavoritesService === 'function',
            critical: false,
            guidance: 'Load js/services/favorites-service.js for favorites features'
        }
    ],

    /**
     * Run all checks and return results
     *
     * @returns {{
     *   allPassed: boolean,
     *   allCriticalPassed: boolean,
     *   results: Array<{name: string, passed: boolean, critical: boolean, guidance: string}>,
     *   criticalFailures: string[],
     *   optionalFailures: string[],
     *   timestamp: number
     * }}
     */
    runAll() {
        const results = {
            allPassed: true,
            allCriticalPassed: true,
            results: [],
            criticalFailures: [],
            optionalFailures: [],
            timestamp: Date.now()
        };

        for (const checkDef of this.checks) {
            let passed = false;

            try {
                passed = checkDef.check();
            } catch (error) {
                console.error(`[Startup Check] Error running ${checkDef.name}:`, error);
                passed = false;
            }

            const result = {
                name: checkDef.name,
                passed,
                critical: checkDef.critical,
                guidance: checkDef.guidance
            };

            results.results.push(result);

            if (!passed) {
                results.allPassed = false;

                if (checkDef.critical) {
                    results.allCriticalPassed = false;
                    results.criticalFailures.push(checkDef.name);
                } else {
                    results.optionalFailures.push(checkDef.name);
                }
            }
        }

        // Log results
        this._logResults(results);

        return results;
    },

    /**
     * Show the full diagnostic panel for critical failures
     *
     * @param {Object} results - Results from runAll()
     */
    showDiagnosticPanel(results) {
        // Check if DiagnosticPanel component is available
        if (typeof window.DiagnosticPanel !== 'undefined') {
            window.DiagnosticPanel.show(results);
            return;
        }

        // Fallback: Create inline diagnostic panel
        const container = document.getElementById('main-content') || document.body;

        const html = `
            <div class="diagnostic-panel diagnostic-panel--critical" role="alert" aria-live="assertive">
                <div class="diagnostic-panel__header">
                    <span class="diagnostic-panel__icon">⚠️</span>
                    <h2 class="diagnostic-panel__title">Initialization Failed</h2>
                </div>

                <p class="diagnostic-panel__message">
                    Some required components failed to load. The app cannot start.
                </p>

                <ul class="diagnostic-panel__checklist">
                    ${results.results.map(r => `
                        <li class="diagnostic-panel__item diagnostic-panel__item--${r.passed ? 'success' : (r.critical ? 'error' : 'warning')}">
                            <span class="diagnostic-panel__status">${r.passed ? '✓' : (r.critical ? '✗' : '!')}</span>
                            <span class="diagnostic-panel__name">${r.name}</span>
                            ${!r.passed ? `<span class="diagnostic-panel__hint">${r.guidance}</span>` : ''}
                        </li>
                    `).join('')}
                </ul>

                <div class="diagnostic-panel__actions">
                    <button onclick="location.reload()" class="btn-primary">
                        Retry
                    </button>
                    <button onclick="this.parentElement.parentElement.querySelector('details').open = true" class="btn-secondary">
                        Technical Details
                    </button>
                </div>

                <details class="diagnostic-panel__details">
                    <summary>Technical Details</summary>
                    <pre>${JSON.stringify(results, null, 2)}</pre>
                    <button onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(results)}, null, 2)).then(() => alert('Copied!'))" class="btn-secondary btn-sm">
                        Copy to Clipboard
                    </button>
                </details>
            </div>
        `;

        container.innerHTML = html;

        // Add minimal styles if diagnostic-panel.css not loaded
        if (!document.querySelector('link[href*="diagnostic-panel"]')) {
            this._injectFallbackStyles();
        }
    },

    /**
     * Show a warning badge in the header for optional failures
     *
     * @param {Object} results - Results from runAll()
     */
    showWarningBadge(results) {
        // Only show if there are optional failures but no critical failures
        if (results.optionalFailures.length === 0) return;

        const header = document.querySelector('.header-actions') ||
                      document.querySelector('.site-header');

        if (!header) {
            console.warn('[Startup Check] Could not find header for warning badge');
            return;
        }

        // Create warning badge
        const badge = document.createElement('button');
        badge.className = 'diagnostic-badge';
        badge.setAttribute('aria-label', `${results.optionalFailures.length} features unavailable`);
        badge.setAttribute('title', 'Some features are unavailable');
        badge.innerHTML = `
            <span class="diagnostic-badge__icon">⚠️</span>
            <span class="diagnostic-badge__count">${results.optionalFailures.length}</span>
        `;

        // Add click handler to show details
        badge.addEventListener('click', () => {
            this._showWarningModal(results);
        });

        // Insert badge before other header actions
        const firstChild = header.querySelector('.icon-btn, button');
        if (firstChild) {
            header.insertBefore(badge, firstChild);
        } else {
            header.appendChild(badge);
        }

        // Add badge styles if not already present
        this._injectBadgeStyles();
    },

    /**
     * Show modal with optional failure details
     * @private
     */
    _showWarningModal(results) {
        // Remove existing modal
        const existing = document.getElementById('diagnostic-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'diagnostic-modal';
        modal.className = 'diagnostic-modal';
        modal.innerHTML = `
            <div class="diagnostic-modal__backdrop" onclick="this.parentElement.remove()"></div>
            <div class="diagnostic-modal__content" role="dialog" aria-labelledby="diagnostic-modal-title">
                <button class="diagnostic-modal__close" onclick="this.closest('.diagnostic-modal').remove()" aria-label="Close">×</button>
                <h3 id="diagnostic-modal-title">Limited Functionality</h3>
                <p>Some optional features couldn't load:</p>
                <ul>
                    ${results.optionalFailures.map(name => {
                        const check = this.checks.find(c => c.name === name);
                        return `<li><strong>${name}</strong>: ${check?.guidance || 'Feature unavailable'}</li>`;
                    }).join('')}
                </ul>
                <p class="diagnostic-modal__note">
                    The app will work, but these features will be disabled.
                </p>
                <button onclick="this.closest('.diagnostic-modal').remove()" class="btn-primary">OK</button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Log results to console
     * @private
     */
    _logResults(results) {
        const criticalCount = results.results.filter(r => r.critical).length;
        const criticalPassed = results.results.filter(r => r.critical && r.passed).length;
        const optionalCount = results.results.filter(r => !r.critical).length;
        const optionalPassed = results.results.filter(r => !r.critical && r.passed).length;

        console.log('[Startup Check] Results:');
        console.log(`  Critical: ${criticalPassed}/${criticalCount} passed`);
        console.log(`  Optional: ${optionalPassed}/${optionalCount} passed`);

        if (results.criticalFailures.length > 0) {
            console.error('[Startup Check] CRITICAL FAILURES:', results.criticalFailures);
        }

        if (results.optionalFailures.length > 0) {
            console.warn('[Startup Check] Optional failures:', results.optionalFailures);
        }
    },

    /**
     * Inject fallback styles for diagnostic panel
     * @private
     */
    _injectFallbackStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .diagnostic-panel {
                max-width: 600px;
                margin: 2rem auto;
                padding: 2rem;
                background: var(--color-bg-card, #1a1f3a);
                border-radius: 12px;
                border: 1px solid var(--color-border-primary, #2a2f4a);
                text-align: center;
            }
            .diagnostic-panel__header {
                margin-bottom: 1.5rem;
            }
            .diagnostic-panel__icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 0.5rem;
            }
            .diagnostic-panel__title {
                color: var(--color-text-primary, #f8f9fa);
                margin: 0;
            }
            .diagnostic-panel__message {
                color: var(--color-text-secondary, #adb5bd);
                margin-bottom: 1.5rem;
            }
            .diagnostic-panel__checklist {
                list-style: none;
                padding: 0;
                margin: 0 0 1.5rem 0;
                text-align: left;
            }
            .diagnostic-panel__item {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 0.75rem;
                border-radius: 6px;
                margin-bottom: 0.5rem;
            }
            .diagnostic-panel__item--success { background: rgba(34, 197, 94, 0.1); }
            .diagnostic-panel__item--error { background: rgba(239, 68, 68, 0.1); }
            .diagnostic-panel__item--warning { background: rgba(234, 179, 8, 0.1); }
            .diagnostic-panel__status {
                font-size: 1.2rem;
                line-height: 1;
            }
            .diagnostic-panel__item--success .diagnostic-panel__status { color: #22c55e; }
            .diagnostic-panel__item--error .diagnostic-panel__status { color: #ef4444; }
            .diagnostic-panel__item--warning .diagnostic-panel__status { color: #eab308; }
            .diagnostic-panel__name {
                font-weight: 500;
                color: var(--color-text-primary, #f8f9fa);
            }
            .diagnostic-panel__hint {
                display: block;
                font-size: 0.85rem;
                color: var(--color-text-secondary, #adb5bd);
                margin-top: 0.25rem;
            }
            .diagnostic-panel__actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-bottom: 1.5rem;
            }
            .diagnostic-panel__details {
                text-align: left;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 6px;
                padding: 1rem;
            }
            .diagnostic-panel__details summary {
                cursor: pointer;
                color: var(--color-text-secondary, #adb5bd);
            }
            .diagnostic-panel__details pre {
                font-size: 0.75rem;
                overflow-x: auto;
                margin: 1rem 0;
                padding: 0.5rem;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Inject styles for warning badge
     * @private
     */
    _injectBadgeStyles() {
        if (document.getElementById('diagnostic-badge-styles')) return;

        const style = document.createElement('style');
        style.id = 'diagnostic-badge-styles';
        style.textContent = `
            .diagnostic-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                background: rgba(234, 179, 8, 0.2);
                border: 1px solid rgba(234, 179, 8, 0.5);
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.85rem;
                color: #eab308;
                transition: all 0.2s;
            }
            .diagnostic-badge:hover {
                background: rgba(234, 179, 8, 0.3);
            }
            .diagnostic-badge__icon {
                font-size: 1rem;
            }
            .diagnostic-badge__count {
                font-weight: 600;
            }

            .diagnostic-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .diagnostic-modal__backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            .diagnostic-modal__content {
                position: relative;
                max-width: 500px;
                width: 90%;
                background: var(--color-bg-card, #1a1f3a);
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            .diagnostic-modal__close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--color-text-secondary, #adb5bd);
                cursor: pointer;
            }
            .diagnostic-modal__content h3 {
                margin: 0 0 1rem 0;
                color: var(--color-text-primary, #f8f9fa);
            }
            .diagnostic-modal__content ul {
                margin: 1rem 0;
                padding-left: 1.5rem;
            }
            .diagnostic-modal__content li {
                margin-bottom: 0.5rem;
                color: var(--color-text-secondary, #adb5bd);
            }
            .diagnostic-modal__note {
                font-size: 0.9rem;
                color: var(--color-text-secondary, #adb5bd);
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }
};

// Export for both module and browser contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StartupChecklist;
}

if (typeof window !== 'undefined') {
    window.StartupChecklist = StartupChecklist;
    console.log('[StartupChecklist] Loaded');
}
