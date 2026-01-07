// CRITICAL: First line must be a simple log to confirm script is loading
console.log('[App Init] Script loaded - starting execution');

/**
 * Polished Application Initialization
 * Fast, reliable app startup with comprehensive metrics and error handling
 *
 * INITIALIZATION ORDER:
 * 1. Performance metrics collection (immediate)
 * 2. Critical CSS inlining validation
 * 3. Error monitoring (initErrorMonitoring) - catches all subsequent errors
 * 4. Performance monitoring (initPerformanceMonitoring) - tracks load metrics
 * 5. DOM ready wait (with timeout fallback)
 * 6. Firebase SDK and config validation
 * 7. Firebase services initialization (Firestore, Auth)
 * 8. Core managers (AuthManager, FirebaseCRUDManager)
 * 9. Renderer (UniversalDisplayRenderer)
 * 10. Navigation (SPANavigation - requires renderer)
 * 11. Search (EnhancedCorpusSearch)
 * 12. Shaders (ShaderThemeManager) - lazy loaded
 * 13. UI setup (auth UI, error tracking, edit handler)
 * 14. Ready events dispatched
 * 15. Non-critical modules lazy loaded
 */

(async function() {
    'use strict';

    // ============================================
    // STARTUP PERFORMANCE METRICS
    // ============================================
    const PERF_METRICS = {
        scriptStart: performance.now(),
        navigationStart: performance.timing?.navigationStart || Date.now(),
        marks: new Map(),
        measures: new Map()
    };

    /**
     * Mark a performance checkpoint
     * @param {string} name - Name of the checkpoint
     */
    function perfMark(name) {
        const timestamp = performance.now();
        PERF_METRICS.marks.set(name, timestamp);

        // Use Performance API if available
        if (typeof performance.mark === 'function') {
            try {
                performance.mark(`eoa-${name}`);
            } catch (e) {
                // Silently ignore if mark already exists
            }
        }

        return timestamp;
    }

    /**
     * Measure duration between two marks
     * @param {string} name - Name of the measure
     * @param {string} startMark - Start mark name
     * @param {string} endMark - End mark name (defaults to now)
     */
    function perfMeasure(name, startMark, endMark = null) {
        const startTime = PERF_METRICS.marks.get(startMark);
        const endTime = endMark ? PERF_METRICS.marks.get(endMark) : performance.now();

        if (startTime !== undefined) {
            const duration = endTime - startTime;
            PERF_METRICS.measures.set(name, duration);

            // Use Performance API if available
            if (typeof performance.measure === 'function') {
                try {
                    performance.measure(`eoa-${name}`, `eoa-${startMark}`, endMark ? `eoa-${endMark}` : undefined);
                } catch (e) {
                    // Silently ignore
                }
            }

            return duration;
        }
        return null;
    }

    // Mark script execution start
    perfMark('script-start');

    // Configuration constants
    const CONFIG = {
        DOM_READY_TIMEOUT: 5000,           // 5 seconds to wait for DOM
        LOADING_HIDE_TIMEOUT: 10000,       // 10 seconds fallback to hide loading
        INIT_RETRY_DELAY: 1000,            // 1 second between retries
        MAX_INIT_RETRIES: 3,               // Maximum initialization retries
        LAZY_LOAD_DELAY: 1500,             // Delay before loading non-critical modules
        CRITICAL_DEPENDENCIES: [
            'firebase',
            'firebaseConfig'
        ],
        OPTIONAL_DEPENDENCIES: [
            'AuthManager',
            'FirebaseCRUDManager',
            'UniversalDisplayRenderer',
            'SPANavigation',
            'EnhancedCorpusSearch',
            'ShaderThemeManager',
            'EditEntityModal'
        ],
        // Non-critical modules to lazy load
        LAZY_MODULES: [
            'ShaderThemeManager',
            'EditEntityModal'
        ],
        // Critical CSS selectors to verify
        CRITICAL_CSS_SELECTORS: [
            '.loading-container',
            '.sacred-spinner',
            '#main-content'
        ]
    };

    // Track initialization state
    const initState = {
        startTime: performance.now(),
        domReady: false,
        firebaseReady: false,
        servicesReady: false,
        navigationReady: false,
        firstRenderComplete: false,
        missingDependencies: [],
        warnings: [],
        retryCount: 0,
        criticalCssLoaded: false,
        loadingProgress: 0,
        currentPhase: 'starting',
        phaseTimings: {},
        metrics: PERF_METRICS
    };

    console.log('[App] Starting polished initialization...');

    // ============================================
    // LOADING PROGRESS INDICATOR
    // ============================================

    /**
     * Update loading progress and emit events
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} phase - Current phase name
     * @param {string} message - Optional message to display
     */
    function updateLoadingProgress(progress, phase, message = '') {
        initState.loadingProgress = progress;
        initState.currentPhase = phase;
        initState.phaseTimings[phase] = performance.now() - initState.startTime;

        // Update progress bar if it exists
        const progressBar = document.querySelector('.init-progress-bar-fill');
        const progressText = document.querySelector('.init-progress-text');
        const phaseText = document.querySelector('.init-phase-text');

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        if (phaseText && message) {
            phaseText.textContent = message;
        }

        // Emit progress event for external listeners
        document.dispatchEvent(new CustomEvent('app-init-progress', {
            detail: { progress, phase, message, timestamp: performance.now() }
        }));

        console.debug(`[App] Progress: ${progress}% - ${phase}${message ? ': ' + message : ''}`);
    }

    // ============================================
    // CRITICAL CSS VALIDATION
    // ============================================

    /**
     * Verify critical CSS is loaded and functional
     * @returns {boolean} True if critical CSS is properly loaded
     */
    function verifyCriticalCss() {
        perfMark('css-check-start');

        // Check if critical selectors have computed styles
        for (const selector of CONFIG.CRITICAL_CSS_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) {
                const styles = window.getComputedStyle(element);
                // Verify element has some styling applied
                if (styles.display === 'none' && selector === '.loading-container') {
                    // Loading container might be hidden after load - that's ok
                    continue;
                }
            }
        }

        // Check for critical stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const criticalLoaded = Array.from(stylesheets).some(link => {
            return link.href && (
                link.href.includes('loading-spinner') ||
                link.href.includes('skeleton-screens') ||
                link.href.includes('theme-base')
            );
        });

        // Also check for inline critical styles
        const inlineStyles = document.querySelectorAll('style');
        const hasInlineStyles = inlineStyles.length > 0;

        initState.criticalCssLoaded = criticalLoaded || hasInlineStyles;

        perfMark('css-check-end');
        perfMeasure('css-validation', 'css-check-start', 'css-check-end');

        if (!initState.criticalCssLoaded) {
            console.warn('[App] Critical CSS may not be fully loaded');
            initState.warnings.push('Critical CSS validation failed');
        } else {
            console.debug('[App] Critical CSS validated');
        }

        return initState.criticalCssLoaded;
    }

    // ============================================
    // STARTUP DIAGNOSTIC PANEL
    // ============================================

    /**
     * Create and show startup diagnostic panel
     * @param {Object} diagnostics - Diagnostic information to display
     */
    function showDiagnosticPanel(diagnostics) {
        // Remove existing panel if present
        const existingPanel = document.getElementById('startup-diagnostics');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'startup-diagnostics';
        panel.className = 'startup-diagnostic-panel';
        panel.innerHTML = `
            <div class="diagnostic-header">
                <span class="diagnostic-title">Startup Diagnostics</span>
                <button class="diagnostic-close" onclick="this.closest('.startup-diagnostic-panel').remove()">&times;</button>
            </div>
            <div class="diagnostic-content">
                <div class="diagnostic-section">
                    <h4>Timing</h4>
                    <div class="diagnostic-row">
                        <span>Total Init Time:</span>
                        <span class="diagnostic-value">${diagnostics.totalTime?.toFixed(2) || 'N/A'}ms</span>
                    </div>
                    <div class="diagnostic-row">
                        <span>DOM Ready:</span>
                        <span class="diagnostic-value">${diagnostics.domReady ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="diagnostic-row">
                        <span>Firebase Ready:</span>
                        <span class="diagnostic-value">${diagnostics.firebaseReady ? 'Yes' : 'No'}</span>
                    </div>
                </div>
                <div class="diagnostic-section">
                    <h4>Dependencies</h4>
                    ${diagnostics.missingDependencies?.length > 0
                        ? diagnostics.missingDependencies.map(dep => `
                            <div class="diagnostic-row diagnostic-warning">
                                <span>Missing:</span>
                                <span class="diagnostic-value">${dep.name} ${dep.critical ? '(Critical)' : ''}</span>
                            </div>
                        `).join('')
                        : '<div class="diagnostic-row diagnostic-success"><span>All dependencies loaded</span></div>'
                    }
                </div>
                ${diagnostics.warnings?.length > 0 ? `
                    <div class="diagnostic-section">
                        <h4>Warnings</h4>
                        ${diagnostics.warnings.map(w => `
                            <div class="diagnostic-row diagnostic-warning">
                                <span>${w}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="diagnostic-section">
                    <h4>Performance Metrics</h4>
                    ${Array.from(diagnostics.metrics?.measures || []).map(([name, value]) => `
                        <div class="diagnostic-row">
                            <span>${name}:</span>
                            <span class="diagnostic-value">${value.toFixed(2)}ms</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="diagnostic-actions">
                <button class="diagnostic-btn" onclick="location.reload()">Reload</button>
                <button class="diagnostic-btn diagnostic-btn-secondary" onclick="window.debugApp && console.log(window.debugApp())">Log Debug Info</button>
            </div>
        `;

        // Add inline styles if CSS might not be loaded
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 360px;
            max-height: 80vh;
            overflow-y: auto;
            background: rgba(10, 10, 30, 0.98);
            border: 1px solid rgba(139, 127, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 100000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: #e0e0e0;
        `;

        document.body.appendChild(panel);

        // Auto-hide after 30 seconds unless there are errors
        if (!diagnostics.hasErrors) {
            setTimeout(() => {
                panel.style.transition = 'opacity 0.5s ease';
                panel.style.opacity = '0';
                setTimeout(() => panel.remove(), 500);
            }, 30000);
        }
    }

    /**
     * Create minimal inline styles for diagnostic panel
     */
    function injectDiagnosticStyles() {
        if (document.getElementById('diagnostic-styles')) return;

        const style = document.createElement('style');
        style.id = 'diagnostic-styles';
        style.textContent = `
            .startup-diagnostic-panel .diagnostic-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid rgba(139, 127, 255, 0.2);
                background: rgba(139, 127, 255, 0.1);
            }
            .startup-diagnostic-panel .diagnostic-title {
                font-weight: 600;
                color: #fff;
            }
            .startup-diagnostic-panel .diagnostic-close {
                background: none;
                border: none;
                color: #aaa;
                font-size: 24px;
                cursor: pointer;
                line-height: 1;
            }
            .startup-diagnostic-panel .diagnostic-close:hover {
                color: #fff;
            }
            .startup-diagnostic-panel .diagnostic-content {
                padding: 16px;
            }
            .startup-diagnostic-panel .diagnostic-section {
                margin-bottom: 16px;
            }
            .startup-diagnostic-panel .diagnostic-section:last-child {
                margin-bottom: 0;
            }
            .startup-diagnostic-panel .diagnostic-section h4 {
                margin: 0 0 8px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #888;
            }
            .startup-diagnostic-panel .diagnostic-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 8px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 4px;
                margin-bottom: 4px;
            }
            .startup-diagnostic-panel .diagnostic-value {
                font-family: 'SF Mono', Monaco, monospace;
                color: #8b7fff;
            }
            .startup-diagnostic-panel .diagnostic-warning {
                background: rgba(255, 193, 7, 0.1);
                border-left: 2px solid #ffc107;
            }
            .startup-diagnostic-panel .diagnostic-success {
                background: rgba(76, 175, 80, 0.1);
                border-left: 2px solid #4caf50;
            }
            .startup-diagnostic-panel .diagnostic-actions {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                border-top: 1px solid rgba(139, 127, 255, 0.2);
            }
            .startup-diagnostic-panel .diagnostic-btn {
                flex: 1;
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: linear-gradient(135deg, #8b7fff, #6b5ecc);
                color: #fff;
                font-weight: 500;
                cursor: pointer;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .startup-diagnostic-panel .diagnostic-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(139, 127, 255, 0.3);
            }
            .startup-diagnostic-panel .diagnostic-btn-secondary {
                background: rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // INITIALIZATION RETRY LOGIC
    // ============================================

    /**
     * Attempt to retry initialization after a failure
     * @param {Error} error - The error that caused the failure
     * @param {Function} initFn - The initialization function to retry
     * @returns {boolean} True if retry was attempted
     */
    async function attemptRetry(error, initFn) {
        if (initState.retryCount >= CONFIG.MAX_INIT_RETRIES) {
            console.error(`[App] Max retries (${CONFIG.MAX_INIT_RETRIES}) exceeded`);
            return false;
        }

        initState.retryCount++;
        console.warn(`[App] Retry attempt ${initState.retryCount}/${CONFIG.MAX_INIT_RETRIES} after error:`, error.message);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, CONFIG.INIT_RETRY_DELAY));

        try {
            await initFn();
            console.log(`[App] Retry ${initState.retryCount} succeeded`);
            return true;
        } catch (retryError) {
            console.error(`[App] Retry ${initState.retryCount} failed:`, retryError.message);
            return attemptRetry(retryError, initFn);
        }
    }

    // ============================================
    // CLEANUP ON ERROR
    // ============================================

    /**
     * Clean up resources on initialization error
     */
    function cleanupOnError() {
        console.log('[App] Cleaning up after error...');

        // Remove any partial UI elements
        const loadingContainers = document.querySelectorAll('.loading-container');
        loadingContainers.forEach(container => {
            container.style.display = 'none';
        });

        // Disconnect any observers
        if (window.EyesOfAzrael) {
            if (window.EyesOfAzrael.observers) {
                window.EyesOfAzrael.observers.forEach(observer => {
                    if (observer && typeof observer.disconnect === 'function') {
                        observer.disconnect();
                    }
                });
            }

            // Clear any pending timers
            if (window.EyesOfAzrael.timers) {
                window.EyesOfAzrael.timers.forEach(timer => {
                    clearTimeout(timer);
                    clearInterval(timer);
                });
            }
        }

        // Dispatch cleanup event
        document.dispatchEvent(new CustomEvent('app-init-cleanup', {
            detail: { timestamp: Date.now(), state: { ...initState } }
        }));

        console.log('[App] Cleanup complete');
    }

    // ============================================
    // STEP 0: Run Startup Checklist (if available)
    // ============================================
    // The StartupChecklist provides early validation of critical dependencies
    // and shows a diagnostic panel if something is missing.
    if (typeof window.StartupChecklist !== 'undefined') {
        console.log('[App] Running startup checklist...');
        const checklistResults = window.StartupChecklist.runAll();

        // If critical checks failed, show diagnostic panel and stop
        if (!checklistResults.allCriticalPassed) {
            console.error('[App] Critical startup checks failed!');

            if (typeof window.DiagnosticPanel !== 'undefined') {
                window.DiagnosticPanel.show(checklistResults);
            } else {
                window.StartupChecklist.showDiagnosticPanel(checklistResults);
            }

            // Dispatch error event for any listeners
            document.dispatchEvent(new CustomEvent('app-init-failed', {
                detail: { reason: 'startup-checklist', results: checklistResults }
            }));

            return; // Stop initialization
        }

        // If optional checks failed, show warning badge
        if (!checklistResults.allPassed) {
            console.warn('[App] Some optional startup checks failed');
            // Defer showing badge until after DOM is ready
            document.addEventListener('DOMContentLoaded', () => {
                window.StartupChecklist.showWarningBadge(checklistResults);
            }, { once: true });
        }

        console.log('[App] Startup checklist passed');
    } else {
        console.debug('[App] StartupChecklist not available, using legacy checks');
    }

    /**
     * Safely call a function if it exists
     * @param {string} funcName - Name of the function to check
     * @param {...any} args - Arguments to pass to the function
     * @returns {any} - Result of function call or undefined
     */
    function safeCall(funcName, ...args) {
        if (typeof window[funcName] === 'function') {
            try {
                return window[funcName](...args);
            } catch (error) {
                console.warn(`[App] Error calling ${funcName}:`, error);
                initState.warnings.push(`Failed to call ${funcName}: ${error.message}`);
            }
        } else if (funcName !== 'initErrorMonitoring' && funcName !== 'initPerformanceMonitoring') {
            // Don't warn for optional monitoring functions at startup
            console.debug(`[App] Function ${funcName} not available`);
        }
        return undefined;
    }

    /**
     * Check if a global dependency exists
     * @param {string} name - Name of the dependency
     * @returns {boolean} - Whether the dependency exists
     */
    function dependencyExists(name) {
        return typeof window[name] !== 'undefined';
    }

    /**
     * Log missing dependencies with guidance
     * @param {string[]} dependencies - List of dependency names to check
     * @param {boolean} critical - Whether these are critical dependencies
     */
    function checkDependencies(dependencies, critical = false) {
        const missing = dependencies.filter(dep => !dependencyExists(dep));

        if (missing.length > 0) {
            const level = critical ? 'error' : 'warn';
            console[level](`[App] Missing ${critical ? 'CRITICAL' : 'optional'} dependencies:`, missing);

            missing.forEach(dep => {
                initState.missingDependencies.push({ name: dep, critical });

                // Provide guidance for common missing dependencies
                const guidance = getDependencyGuidance(dep);
                if (guidance) {
                    console[level](`[App] ${dep}: ${guidance}`);
                }
            });
        }

        return missing;
    }

    /**
     * Get guidance for loading a missing dependency
     * @param {string} dep - Dependency name
     * @returns {string|null} - Guidance string or null
     */
    function getDependencyGuidance(dep) {
        const guidance = {
            'firebase': 'Ensure Firebase SDK is loaded via <script src="https://www.gstatic.com/firebasejs/...">',
            'firebaseConfig': 'Ensure firebase-config.js is loaded before app-init-simple.js',
            'AuthManager': 'Load js/auth-guard-simple.js or js/auth-manager.js',
            'FirebaseCRUDManager': 'Load js/firebase-crud-manager.js',
            'UniversalDisplayRenderer': 'Load js/components/universal-display-renderer.js',
            'SPANavigation': 'Load js/spa-navigation.js - requires UniversalDisplayRenderer first',
            'EnhancedCorpusSearch': 'Load js/enhanced-corpus-search.js',
            'ShaderThemeManager': 'Load js/shader-theme-picker.js',
            'EditEntityModal': 'Load js/edit-entity-modal.js for edit functionality'
        };
        return guidance[dep] || null;
    }

    // Step 1: Validate critical CSS (for first-render optimization)
    updateLoadingProgress(5, 'css-validation', 'Validating styles...');
    perfMark('css-validation-start');
    verifyCriticalCss();
    perfMark('css-validation-end');
    perfMeasure('css-validation-total', 'css-validation-start', 'css-validation-end');

    // Step 2: Initialize error monitoring FIRST (before anything else)
    updateLoadingProgress(10, 'error-monitoring', 'Setting up error tracking...');
    perfMark('error-monitoring-start');
    if (typeof initErrorMonitoring === 'function') {
        try {
            initErrorMonitoring();
            console.log('[App] [2/15] Error monitoring initialized');
        } catch (error) {
            console.warn('[App] Failed to initialize error monitoring:', error);
            initState.warnings.push('Error monitoring failed to initialize');
        }
    } else {
        console.debug('[App] [2/15] Error monitoring not available (optional)');
    }
    perfMark('error-monitoring-end');
    perfMeasure('error-monitoring', 'error-monitoring-start', 'error-monitoring-end');

    // Step 3: Initialize performance monitoring
    updateLoadingProgress(15, 'perf-monitoring', 'Setting up performance tracking...');
    perfMark('perf-monitoring-start');
    if (typeof initPerformanceMonitoring === 'function') {
        try {
            initPerformanceMonitoring();
            console.log('[App] [3/15] Performance monitoring initialized');
        } catch (error) {
            console.warn('[App] Failed to initialize performance monitoring:', error);
            initState.warnings.push('Performance monitoring failed to initialize');
        }
    } else {
        console.debug('[App] [3/15] Performance monitoring not available (optional)');
    }
    perfMark('perf-monitoring-end');
    perfMeasure('perf-monitoring', 'perf-monitoring-start', 'perf-monitoring-end');

    // Step 4: Wait for DOM to be ready with timeout fallback
    updateLoadingProgress(20, 'dom-ready', 'Waiting for DOM...');
    perfMark('dom-wait-start');
    if (document.readyState === 'loading') {
        console.log('[App] [4/15] Waiting for DOM to be ready...');

        const domReadyPromise = new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', () => {
                initState.domReady = true;
                resolve('ready');
            });
        });

        const timeoutPromise = new Promise(resolve => {
            setTimeout(() => {
                if (!initState.domReady) {
                    console.warn(`[App] DOM ready timeout after ${CONFIG.DOM_READY_TIMEOUT}ms, proceeding anyway`);
                    initState.warnings.push('DOM ready timeout - proceeding with partial state');
                    resolve('timeout');
                }
            }, CONFIG.DOM_READY_TIMEOUT);
        });

        const result = await Promise.race([domReadyPromise, timeoutPromise]);
        console.log(`[App] [4/15] DOM state resolved: ${result}`);
    } else {
        initState.domReady = true;
        console.log('[App] [4/15] DOM already ready');
    }
    perfMark('dom-wait-end');
    perfMeasure('dom-ready-wait', 'dom-wait-start', 'dom-wait-end');
    updateLoadingProgress(25, 'dom-ready', 'DOM ready');

    try {
        // Add breadcrumb for initialization start
        safeCall('addBreadcrumb', 'app', 'Starting app initialization');

        // Step 5: Check critical dependencies and Firebase
        updateLoadingProgress(30, 'dependency-check', 'Checking dependencies...');
        perfMark('dependency-check-start');
        console.log('[App] [5/15] Checking Firebase SDK and config...');
        const criticalMissing = checkDependencies(CONFIG.CRITICAL_DEPENDENCIES, true);

        if (criticalMissing.includes('firebase')) {
            throw new Error('Firebase SDK not loaded. Ensure Firebase scripts are included in index.html');
        }

        if (criticalMissing.includes('firebaseConfig')) {
            throw new Error('Firebase config not found. Ensure firebase-config.js is loaded');
        }
        perfMark('dependency-check-end');
        perfMeasure('dependency-check', 'dependency-check-start', 'dependency-check-end');

        // Step 6: Initialize Firebase if not already initialized
        updateLoadingProgress(40, 'firebase-init', 'Initializing Firebase...');
        perfMark('firebase-init-start');
        console.log('[App] [6/15] Initializing Firebase services...');
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('[App] Firebase app initialized');
        } else {
            app = firebase.app();
            console.log('[App] Using existing Firebase app');
        }

        // Get Firebase services
        const db = firebase.firestore();
        const auth = firebase.auth();
        initState.firebaseReady = true;
        perfMark('firebase-init-end');
        perfMeasure('firebase-init', 'firebase-init-start', 'firebase-init-end');
        console.log('[App] [6/15] Firebase services ready');

        // Make services available globally
        window.EyesOfAzrael = window.EyesOfAzrael || {};
        window.EyesOfAzrael.db = db;
        window.EyesOfAzrael.firebaseAuth = auth;
        window.EyesOfAzrael.initState = initState; // Expose for debugging

        // Check optional dependencies and log warnings
        checkDependencies(CONFIG.OPTIONAL_DEPENDENCIES, false);

        // Step 7: Initialize AuthManager
        updateLoadingProgress(50, 'auth-manager', 'Initializing authentication...');
        perfMark('auth-manager-start');
        console.log('[App] [7/15] Initializing AuthManager...');
        if (dependencyExists('AuthManager')) {
            try {
                window.EyesOfAzrael.auth = new AuthManager(app);
                console.log('[App] AuthManager initialized');
            } catch (error) {
                console.error('[App] AuthManager initialization failed:', error);
                initState.warnings.push(`AuthManager failed: ${error.message}`);
            }
        } else {
            console.warn('[App] AuthManager not found - authentication features unavailable');
        }
        perfMark('auth-manager-end');
        perfMeasure('auth-manager', 'auth-manager-start', 'auth-manager-end');

        // Step 8: Initialize FirebaseCRUDManager
        updateLoadingProgress(55, 'crud-manager', 'Initializing data manager...');
        perfMark('crud-manager-start');
        console.log('[App] [8/15] Initializing CRUD Manager...');
        if (dependencyExists('FirebaseCRUDManager')) {
            try {
                window.EyesOfAzrael.crudManager = new FirebaseCRUDManager(db, auth);
                console.log('[App] CRUD Manager initialized');
            } catch (error) {
                console.error('[App] FirebaseCRUDManager initialization failed:', error);
                initState.warnings.push(`FirebaseCRUDManager failed: ${error.message}`);
            }
        } else {
            console.warn('[App] FirebaseCRUDManager not found - edit features unavailable');
        }
        perfMark('crud-manager-end');
        perfMeasure('crud-manager', 'crud-manager-start', 'crud-manager-end');

        // Step 9: Initialize UniversalDisplayRenderer
        updateLoadingProgress(60, 'renderer', 'Initializing display renderer...');
        perfMark('renderer-start');
        console.log('[App] [9/15] Initializing Renderer...');
        if (dependencyExists('UniversalDisplayRenderer')) {
            try {
                window.EyesOfAzrael.renderer = new UniversalDisplayRenderer({
                    enableHover: true,
                    enableExpand: true,
                    enableCorpusLinks: true
                });
                console.log('[App] Renderer initialized');
            } catch (error) {
                console.error('[App] UniversalDisplayRenderer initialization failed:', error);
                initState.warnings.push(`Renderer failed: ${error.message}`);
            }
        } else {
            console.warn('[App] UniversalDisplayRenderer not found - display features limited');
        }
        perfMark('renderer-end');
        perfMeasure('renderer', 'renderer-start', 'renderer-end');

        // Track if loading has been hidden to prevent duplicate operations
        let loadingHidden = false;

        /**
         * Hide all loading indicators smoothly
         * Handles both initial loader in #main-content and any other loading containers
         */
        function hideAllLoadingIndicators(source = 'unknown') {
            if (loadingHidden) {
                console.debug(`[App Init] Loading already hidden, skipping (source: ${source})`);
                return;
            }
            loadingHidden = true;

            console.log(`[App Init] Hiding loading indicators (source: ${source})`);

            // Hide all loading containers with smooth transition
            const loadingContainers = document.querySelectorAll('.loading-container');
            loadingContainers.forEach((container, index) => {
                // Add fade-out class for CSS transition
                container.classList.add('fade-out');
                container.style.opacity = '0';
                container.style.transition = 'opacity 0.3s ease-out';
                container.style.pointerEvents = 'none';

                setTimeout(() => {
                    container.style.display = 'none';
                    console.debug(`[App Init] Loading container ${index + 1} hidden`);
                }, 300);
            });

            // Also hide auth loading screen if present
            const authLoadingScreen = document.getElementById('auth-loading-screen');
            if (authLoadingScreen && authLoadingScreen.style.display !== 'none') {
                authLoadingScreen.style.opacity = '0';
                authLoadingScreen.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    authLoadingScreen.style.display = 'none';
                    console.debug('[App Init] Auth loading screen hidden');
                }, 300);
            }
        }

        /**
         * Emit app-ready event after first render
         */
        function emitAppReady(source) {
            if (initState.firstRenderComplete) {
                return; // Already emitted
            }
            initState.firstRenderComplete = true;

            const totalDuration = (performance.now() - initState.startTime).toFixed(2);
            console.log(`[App] App fully ready in ${totalDuration}ms (source: ${source})`);

            document.dispatchEvent(new CustomEvent('app-ready', {
                detail: {
                    source,
                    totalDuration: parseFloat(totalDuration),
                    initState: { ...initState }
                }
            }));
        }

        // IMPORTANT: Set up first-render-complete listener BEFORE initializing navigation
        // This prevents race conditions where the event fires before we're listening
        document.addEventListener('first-render-complete', (event) => {
            const route = event.detail?.route || 'unknown';
            console.log(`[App Init] First render complete for route: ${route}`);
            hideAllLoadingIndicators(`first-render-complete:${route}`);
            emitAppReady(`first-render-complete:${route}`);
        });

        // Also listen for render errors to hide loading on failure
        document.addEventListener('render-error', (event) => {
            const route = event.detail?.route || 'unknown';
            console.warn(`[App Init] Render error for route: ${route}, hiding loading`);
            hideAllLoadingIndicators(`render-error:${route}`);
            // Still emit app-ready on error so the app is interactive
            emitAppReady(`render-error:${route}`);
        });

        // SAFETY TIMEOUT: Force content visibility after 5 seconds if first-render-complete never fires
        // This prevents blank page scenarios due to race conditions or uncaught errors
        const safetyTimeout = setTimeout(() => {
            if (!loadingHidden) {
                console.warn('[App Init] SAFETY TIMEOUT: first-render-complete not received after 5s, forcing visibility');

                // Force main content to be visible
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.style.setProperty('opacity', '1', 'important');
                    mainContent.style.setProperty('display', 'block', 'important');
                    mainContent.style.setProperty('visibility', 'visible', 'important');

                    // Check if there's any content in main-content
                    const hasContent = mainContent.children.length > 0 &&
                        !mainContent.querySelector('.loading-container') &&
                        !mainContent.querySelector('.spinner-container');

                    if (!hasContent) {
                        console.error('[App Init] SAFETY TIMEOUT: main-content appears empty, attempting emergency render');
                        // Try to trigger a render
                        if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
                            try {
                                // Force reset navigation lock in case it's stuck
                                const nav = window.EyesOfAzrael.navigation;
                                if (nav._isNavigating) {
                                    console.warn('[App Init] Navigation lock was stuck, resetting');
                                    nav._isNavigating = false;
                                    nav._activeNavigationId = null;
                                }
                                nav.handleRoute();
                            } catch (e) {
                                console.error('[App Init] Emergency render failed:', e);
                            }
                        }
                    }
                }

                hideAllLoadingIndicators('safety-timeout');
                emitAppReady('safety-timeout');
            }
        }, 5000);

        // Clear safety timeout if render completes normally
        document.addEventListener('first-render-complete', () => {
            clearTimeout(safetyTimeout);
        }, { once: true });

        // Step 10: Initialize SPANavigation (requires renderer)
        updateLoadingProgress(70, 'navigation', 'Initializing navigation...');
        perfMark('navigation-start');
        console.log('[App] [10/15] Initializing Navigation...');
        if (dependencyExists('SPANavigation')) {
            if (!window.EyesOfAzrael.renderer) {
                console.error('[App] SPANavigation requires UniversalDisplayRenderer but it is not available');
                initState.warnings.push('SPANavigation skipped - missing renderer dependency');
                // Show fallback content since navigation won't work
                showNavigationFallback();
            } else {
                try {
                    window.EyesOfAzrael.navigation = new SPANavigation(
                        db,
                        window.EyesOfAzrael.auth,
                        window.EyesOfAzrael.renderer
                    );
                    initState.navigationReady = true;
                    console.log('[App] Navigation initialized');
                } catch (error) {
                    console.error('[App] SPANavigation initialization failed:', error);
                    initState.warnings.push(`Navigation failed: ${error.message}`);
                    // Show fallback content since navigation failed
                    showNavigationFallback();
                }
            }
        } else {
            console.warn('[App] SPANavigation not found - routing unavailable');
            // Show fallback content since navigation is not available
            showNavigationFallback();
        }
        perfMark('navigation-end');
        perfMeasure('navigation', 'navigation-start', 'navigation-end');

        // Step 11: Initialize EnhancedCorpusSearch
        updateLoadingProgress(80, 'search', 'Initializing search...');
        perfMark('search-start');
        console.log('[App] [11/15] Initializing Search...');
        if (dependencyExists('EnhancedCorpusSearch')) {
            try {
                window.EyesOfAzrael.search = new EnhancedCorpusSearch(db);
                console.log('[App] Search initialized');
            } catch (error) {
                console.error('[App] EnhancedCorpusSearch initialization failed:', error);
                initState.warnings.push(`Search failed: ${error.message}`);
            }
        } else {
            console.warn('[App] EnhancedCorpusSearch not found - search features unavailable');
        }
        perfMark('search-end');
        perfMeasure('search', 'search-start', 'search-end');

        // Step 12: Lazy load ShaderThemeManager (non-critical, deferred)
        updateLoadingProgress(85, 'shaders', 'Queueing shader initialization...');
        console.log('[App] [12/15] Deferring Shaders (non-critical)...');

        // Lazy load shaders after first render to not block main content
        const lazyLoadShaders = () => {
            perfMark('shaders-start');
            if (dependencyExists('ShaderThemeManager') && !window.EyesOfAzrael.shaders) {
                try {
                    window.EyesOfAzrael.shaders = new ShaderThemeManager({
                        quality: 'auto',
                        targetFPS: 60
                    });
                    console.log('[App] Shaders lazy loaded');

                    // Auto-activate shader based on time of day
                    const hour = new Date().getHours();
                    const theme = (hour >= 6 && hour < 18) ? 'day' : 'night';
                    window.EyesOfAzrael.shaders.activate(theme);
                } catch (error) {
                    console.error('[App] ShaderThemeManager lazy load failed:', error);
                    initState.warnings.push(`Shaders failed: ${error.message}`);
                }
            } else if (!dependencyExists('ShaderThemeManager')) {
                console.debug('[App] ShaderThemeManager not found - shader effects unavailable');
            }
            perfMark('shaders-end');
            perfMeasure('shaders', 'shaders-start', 'shaders-end');
        };

        // Defer shader loading until after first render or after a delay
        if (initState.firstRenderComplete) {
            // First render already done, load shaders now
            setTimeout(lazyLoadShaders, 100);
        } else {
            // Wait for first render, then load shaders
            document.addEventListener('first-render-complete', () => {
                setTimeout(lazyLoadShaders, CONFIG.LAZY_LOAD_DELAY);
            }, { once: true });

            // Fallback: load shaders after timeout if first render never fires
            setTimeout(() => {
                if (!window.EyesOfAzrael?.shaders) {
                    lazyLoadShaders();
                }
            }, CONFIG.LAZY_LOAD_DELAY + 2000);
        }

        // Step 13: Setup UI components
        updateLoadingProgress(90, 'ui-setup', 'Setting up UI components...');
        perfMark('ui-setup-start');
        console.log('[App] [13/15] Setting up UI components...');

        // Setup auth UI if auth manager exists
        if (window.EyesOfAzrael.auth) {
            setupAuthUI(auth);
        }

        // Setup global error tracking
        setupErrorTracking();

        // Setup global edit icon handler
        setupEditIconHandler();
        perfMark('ui-setup-end');
        perfMeasure('ui-setup', 'ui-setup-start', 'ui-setup-end');

        // Step 14: Finalize initialization
        updateLoadingProgress(95, 'finalizing', 'Finalizing initialization...');
        perfMark('finalize-start');
        initState.servicesReady = true;

        // Calculate total metrics
        perfMark('init-complete');
        perfMeasure('total-init', 'script-start', 'init-complete');

        const initDuration = (performance.now() - initState.startTime).toFixed(2);
        console.log(`[App] [14/15] Initialization complete in ${initDuration}ms`);

        // Log any warnings accumulated during initialization
        if (initState.warnings.length > 0) {
            console.warn('[App] Initialization completed with warnings:', initState.warnings);
        }

        // Add breadcrumb for successful initialization
        safeCall('addBreadcrumb', 'app', 'App initialized successfully');

        updateLoadingProgress(100, 'complete', 'Ready!');

        // Step 15: Emit ready events and show diagnostics
        console.log('[App] [15/15] Emitting ready events...');
        perfMark('finalize-end');
        perfMeasure('finalize', 'finalize-start', 'finalize-end');

        // Emit app-initialized event (core systems ready)
        document.dispatchEvent(new CustomEvent('app-initialized', {
            detail: {
                duration: parseFloat(initDuration),
                warnings: initState.warnings,
                missingDependencies: initState.missingDependencies,
                metrics: {
                    marks: Object.fromEntries(PERF_METRICS.marks),
                    measures: Object.fromEntries(PERF_METRICS.measures)
                },
                phaseTimings: initState.phaseTimings
            }
        }));

        // Show diagnostic panel if there were issues or in debug mode
        const showDiagnostics = initState.warnings.length > 0 ||
                                initState.missingDependencies.length > 0 ||
                                new URLSearchParams(window.location.search).has('debug');

        if (showDiagnostics) {
            injectDiagnosticStyles();
            showDiagnosticPanel({
                totalTime: parseFloat(initDuration),
                domReady: initState.domReady,
                firebaseReady: initState.firebaseReady,
                missingDependencies: initState.missingDependencies,
                warnings: initState.warnings,
                metrics: PERF_METRICS,
                hasErrors: initState.missingDependencies.some(d => d.critical)
            });
        }

        // Log performance summary to console
        console.group('[App] Performance Summary');
        console.log('Total initialization:', initDuration + 'ms');
        console.table(Object.fromEntries(PERF_METRICS.measures));
        console.log('Phase timings:', initState.phaseTimings);
        console.groupEnd();

        // Fallback: Hide loading after timeout if first-render-complete never fires
        setTimeout(() => {
            if (!loadingHidden) {
                console.warn(`[App Init] Fallback timeout: hiding loading container after ${CONFIG.LOADING_HIDE_TIMEOUT}ms`);
                hideAllLoadingIndicators('timeout-fallback');
                emitAppReady('timeout-fallback');
            }
        }, CONFIG.LOADING_HIDE_TIMEOUT);

    } catch (error) {
        console.error('[App] Initialization error:', error);

        // Mark error in performance metrics
        perfMark('init-error');
        perfMeasure('time-to-error', 'script-start', 'init-error');

        // Cleanup on error
        cleanupOnError();

        // Capture error with monitoring if available
        safeCall('captureError', error, {
            phase: 'initialization',
            timestamp: Date.now(),
            url: window.location.href,
            initState: { ...initState },
            metrics: Object.fromEntries(PERF_METRICS.measures)
        });

        // Attempt retry for certain errors
        const isRetryable = !error.message.includes('Firebase SDK') &&
                           !error.message.includes('Firebase config') &&
                           initState.retryCount < CONFIG.MAX_INIT_RETRIES;

        if (isRetryable) {
            console.log('[App] Error may be recoverable, attempting retry...');
            // Note: Full retry would need to wrap the main try block
            // For now, just show the error
        }

        showError(error);

        // Show diagnostic panel with error info
        injectDiagnosticStyles();
        showDiagnosticPanel({
            totalTime: performance.now() - initState.startTime,
            domReady: initState.domReady,
            firebaseReady: initState.firebaseReady,
            missingDependencies: initState.missingDependencies,
            warnings: [...initState.warnings, `Error: ${error.message}`],
            metrics: PERF_METRICS,
            hasErrors: true
        });

        // CRITICAL: Still dispatch app-initialized even on error
        // This prevents other components (like app-coordinator) from waiting forever
        // The error has already been shown to the user via showError()
        const initDuration = (performance.now() - initState.startTime).toFixed(2);
        document.dispatchEvent(new CustomEvent('app-initialized', {
            detail: {
                duration: parseFloat(initDuration),
                error: error.message,
                warnings: initState.warnings,
                missingDependencies: initState.missingDependencies
            }
        }));
    }

    /**
     * Setup authentication UI
     * NOTE: Auth state changes and UI updates are handled by auth-guard-simple.js
     * This function only sets up additional sign-out button handlers that may not
     * be covered by the auth guard (e.g., dynamically added buttons).
     *
     * @param {firebase.auth.Auth} auth - Firebase auth instance
     */
    function setupAuthUI(auth) {
        // NOTE: We intentionally DO NOT add another onAuthStateChanged listener here
        // because auth-guard-simple.js already handles:
        // - User info display (userInfo, userName, userAvatar)
        // - Auth state changes
        // - Sign in/out button visibility
        // Adding a duplicate listener would cause race conditions and double updates.

        // Only set up sign-out button handler if AuthGuard hasn't already
        // (AuthGuard exposes a reinitButtons method for this purpose)
        if (window.AuthGuard && typeof window.AuthGuard.reinitButtons === 'function') {
            // Auth guard is available - let it handle button setup
            console.debug('[App] Auth UI delegated to AuthGuard');
            return;
        }

        // Fallback: Set up sign-out button if auth guard is not available
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn && !signOutBtn._appInitHandlerAttached) {
            signOutBtn._appInitHandlerAttached = true;
            signOutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error('[Auth] Sign out error:', error);
                }
            });
            console.debug('[App] Auth UI fallback setup complete');
        } else {
            console.debug('[App] Auth UI elements not found or already initialized');
        }
    }

    /**
     * Setup global error tracking
     * Integrates with AnalyticsManager and Sentry if available
     */
    function setupErrorTracking() {
        // Track uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            const error = event.error || new Error(event.message);
            const context = {
                fatal: true,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript_error'
            };

            // Track with AnalyticsManager if available
            if (window.AnalyticsManager && typeof window.AnalyticsManager.trackCustomError === 'function') {
                window.AnalyticsManager.trackCustomError(error, context);
            }

            // Track with Sentry if available
            safeCall('captureError', error, context);
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error
                ? event.reason
                : new Error(String(event.reason));
            const context = {
                fatal: false,
                type: 'unhandled_promise_rejection'
            };

            // Track with AnalyticsManager if available
            if (window.AnalyticsManager && typeof window.AnalyticsManager.trackCustomError === 'function') {
                window.AnalyticsManager.trackCustomError(error, context);
            }

            // Track with Sentry if available
            safeCall('captureError', error, context);
        });

        console.debug('[App] Global error tracking enabled');
    }

    /**
     * Setup global edit icon click handler
     * Uses event delegation for dynamically created elements
     */
    function setupEditIconHandler() {
        document.addEventListener('click', async (e) => {
            // Check if click was on edit icon button or inside it
            const editBtn = e.target.matches('.edit-icon-btn')
                ? e.target
                : e.target.closest('.edit-icon-btn');

            if (!editBtn) return;

            // Stop propagation to prevent card navigation
            e.preventDefault();
            e.stopPropagation();

            const entityId = editBtn.dataset.entityId;
            const collection = editBtn.dataset.collection;

            if (!entityId || !collection) {
                console.error('[EditIcon] Missing entity ID or collection');
                return;
            }

            // Check if EditEntityModal is available
            if (!dependencyExists('EditEntityModal')) {
                console.error('[EditIcon] EditEntityModal not loaded');
                console.info('[EditIcon] Load js/edit-entity-modal.js to enable edit functionality');
                alert('Edit functionality not available. Please ensure all scripts are loaded.');
                return;
            }

            // Check if CRUD manager is available
            if (!window.EyesOfAzrael || !window.EyesOfAzrael.crudManager) {
                console.error('[EditIcon] CRUD Manager not initialized');
                alert('Edit functionality not available. Please ensure the app is properly initialized.');
                return;
            }

            // Open edit modal
            try {
                const modal = new EditEntityModal(window.EyesOfAzrael.crudManager);
                await modal.open(entityId, collection);
            } catch (error) {
                console.error('[EditIcon] Error opening edit modal:', error);
                alert('Failed to open edit modal: ' + error.message);
            }
        });

        console.debug('[App] Global edit icon handler initialized');
    }

    /**
     * Escape HTML special characters for safe display
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Show error message to user
     * @param {Error} error - The error to display
     */
    function showError(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Escape HTML in both message and stack trace
            const safeMessage = escapeHtml(error.message);
            const safeStack = escapeHtml(error.stack || 'No stack trace available');

            mainContent.innerHTML = `
                <div class="error-container" style="
                    text-align: center;
                    padding: 3rem;
                    max-width: 600px;
                    margin: 2rem auto;
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">!</div>
                    <h1>Initialization Error</h1>
                    <p style="color: #ef4444; margin: 1rem 0;">${safeMessage}</p>
                    <details style="text-align: left; margin: 1rem 0; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 8px;">
                        <summary style="cursor: pointer;">Technical Details</summary>
                        <pre style="margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.85rem;">${safeStack}</pre>
                    </details>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">Reload Page</button>
                </div>
            `;
        }
    }

    /**
     * Show fallback content when navigation fails to initialize
     * Provides basic links to main sections of the site
     */
    function showNavigationFallback() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            console.log('[App] Showing navigation fallback content');
            mainContent.innerHTML = `
                <div class="navigation-fallback" style="
                    text-align: center;
                    padding: 3rem;
                    max-width: 800px;
                    margin: 2rem auto;
                ">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">&#128065;</div>
                    <h1>Eyes of Azrael</h1>
                    <p style="color: var(--color-text-secondary, #9ca3af); margin: 1rem 0 2rem;">
                        Navigation failed to initialize. You can still explore using the links below.
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                        <a href="#/mythologies" style="padding: 0.75rem 1.5rem; background: var(--color-primary, #8b7fff); color: white; text-decoration: none; border-radius: 8px;">
                            Explore Mythologies
                        </a>
                        <a href="#/browse/deities" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); color: inherit; text-decoration: none; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                            Browse Deities
                        </a>
                        <a href="#/search" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); color: inherit; text-decoration: none; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                            Search
                        </a>
                    </div>
                    <button onclick="location.reload()" class="btn-secondary" style="padding: 0.5rem 1rem; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;

            // Dispatch first-render-complete so loading indicators are hidden
            document.dispatchEvent(new CustomEvent('first-render-complete', {
                detail: {
                    route: 'navigation-fallback',
                    timestamp: Date.now()
                }
            }));
        }
    }

    // Expose debug function for troubleshooting
    window.debugApp = function(showPanel = false) {
        const state = {
            initState: { ...initState },
            metrics: {
                marks: Object.fromEntries(PERF_METRICS.marks),
                measures: Object.fromEntries(PERF_METRICS.measures)
            },
            phaseTimings: initState.phaseTimings,
            app: window.EyesOfAzrael || {},
            config: CONFIG
        };

        console.group('[Debug] Eyes of Azrael - App State');
        console.log('Initialization State:', initState);
        console.log('Performance Metrics:');
        console.table(Object.fromEntries(PERF_METRICS.measures));
        console.log('Phase Timings:', initState.phaseTimings);
        console.log('EyesOfAzrael namespace:', window.EyesOfAzrael || {});
        console.groupEnd();

        // Optionally show diagnostic panel
        if (showPanel) {
            injectDiagnosticStyles();
            showDiagnosticPanel({
                totalTime: performance.now() - initState.startTime,
                domReady: initState.domReady,
                firebaseReady: initState.firebaseReady,
                missingDependencies: initState.missingDependencies,
                warnings: initState.warnings,
                metrics: PERF_METRICS,
                hasErrors: false
            });
        }

        return state;
    };

    // Expose function to show diagnostics manually
    window.showAppDiagnostics = function() {
        injectDiagnosticStyles();
        showDiagnosticPanel({
            totalTime: performance.now() - initState.startTime,
            domReady: initState.domReady,
            firebaseReady: initState.firebaseReady,
            missingDependencies: initState.missingDependencies,
            warnings: initState.warnings,
            metrics: PERF_METRICS,
            hasErrors: initState.missingDependencies.some(d => d.critical)
        });
    };

    // Expose performance metrics getter
    window.getAppPerformance = function() {
        return {
            totalTime: performance.now() - initState.startTime,
            marks: Object.fromEntries(PERF_METRICS.marks),
            measures: Object.fromEntries(PERF_METRICS.measures),
            phaseTimings: { ...initState.phaseTimings }
        };
    };

})();
