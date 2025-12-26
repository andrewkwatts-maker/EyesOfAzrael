/**
 * Script Load Verification Tool
 * Monitors and reports on script loading sequence and timing
 */

(function() {
    'use strict';

    // Track script loading
    const scriptLoadTracker = {
        startTime: performance.now(),
        scripts: [],
        order: [],
        errors: []
    };

    /**
     * Monitor script tags
     */
    function monitorScripts() {
        // Get all script tags
        const scripts = document.querySelectorAll('script');

        scripts.forEach((script, index) => {
            const info = {
                index,
                src: script.src || '(inline)',
                type: script.type || 'text/javascript',
                async: script.async,
                defer: script.defer,
                module: script.type === 'module',
                loaded: false,
                error: false,
                loadTime: null
            };

            scriptLoadTracker.scripts.push(info);

            // Monitor load events
            if (script.src) {
                script.addEventListener('load', () => {
                    info.loaded = true;
                    info.loadTime = Math.round(performance.now() - scriptLoadTracker.startTime);
                    scriptLoadTracker.order.push(script.src.split('/').pop());
                    console.log(`[Script Verify +${info.loadTime}ms] ✅ Loaded: ${script.src.split('/').pop()}`);
                });

                script.addEventListener('error', (e) => {
                    info.error = true;
                    info.loadTime = Math.round(performance.now() - scriptLoadTracker.startTime);
                    scriptLoadTracker.errors.push({
                        script: script.src.split('/').pop(),
                        time: info.loadTime,
                        error: e
                    });
                    console.error(`[Script Verify +${info.loadTime}ms] ❌ Failed: ${script.src.split('/').pop()}`, e);
                });
            }
        });
    }

    /**
     * Check required scripts
     */
    function checkRequiredScripts() {
        const required = [
            // Core libraries
            'firebase-app-compat.js',
            'firebase-firestore-compat.js',
            'firebase-auth-compat.js',
            'firebase-config.js',

            // Core utilities
            'app-coordinator.js',
            'auth-guard-simple.js',

            // Authentication
            'auth-manager.js',

            // Component classes
            'home-view.js',
            'universal-display-renderer.js', // CRITICAL
            'entity-renderer-firebase.js',
            'search-firebase.js',
            'spa-navigation.js',

            // CRUD system
            'firebase-crud-manager.js',

            // App initialization
            'app-init-simple.js'
        ];

        const loaded = scriptLoadTracker.scripts
            .filter(s => s.src)
            .map(s => s.src.split('/').pop());

        const missing = required.filter(name =>
            !loaded.some(src => src.includes(name))
        );

        return { required, loaded, missing };
    }

    /**
     * Check class definitions
     */
    function checkClassDefinitions() {
        const classes = {
            // Firebase
            firebase: typeof firebase !== 'undefined',
            firestore: typeof firebase?.firestore !== 'undefined',
            auth: typeof firebase?.auth !== 'undefined',

            // Classes
            AuthManager: typeof AuthManager !== 'undefined',
            HomeView: typeof HomeView !== 'undefined',
            SPANavigation: typeof SPANavigation !== 'undefined',
            UniversalDisplayRenderer: typeof UniversalDisplayRenderer !== 'undefined',
            FirebaseCRUDManager: typeof FirebaseCRUDManager !== 'undefined',
            EnhancedCorpusSearch: typeof EnhancedCorpusSearch !== 'undefined',
            ShaderThemeManager: typeof ShaderThemeManager !== 'undefined',
            PageAssetRenderer: typeof PageAssetRenderer !== 'undefined',
            FirebaseEntityRenderer: typeof FirebaseEntityRenderer !== 'undefined'
        };

        const undefined_classes = Object.entries(classes)
            .filter(([name, defined]) => !defined)
            .map(([name]) => name);

        return { classes, undefined: undefined_classes };
    }

    /**
     * Generate verification report
     */
    function generateReport() {
        const elapsed = Math.round(performance.now() - scriptLoadTracker.startTime);

        const scriptCheck = checkRequiredScripts();
        const classCheck = checkClassDefinitions();

        const report = {
            timing: {
                elapsed,
                scriptsCount: scriptLoadTracker.scripts.length,
                loadedCount: scriptLoadTracker.scripts.filter(s => s.loaded).length,
                errorCount: scriptLoadTracker.errors.length
            },
            scripts: scriptCheck,
            classes: classCheck,
            errors: scriptLoadTracker.errors,
            loadOrder: scriptLoadTracker.order
        };

        return report;
    }

    /**
     * Print verification report
     */
    function printReport() {
        const report = generateReport();

        console.group('[Script Verification] Report');

        console.log('⏱️ Timing:', report.timing);

        // Scripts
        console.group('📜 Scripts');
        console.log('Required:', report.scripts.required.length);
        console.log('Loaded:', report.scripts.loaded.length);
        if (report.scripts.missing.length > 0) {
            console.error('❌ Missing:', report.scripts.missing);
        } else {
            console.log('✅ All required scripts present');
        }
        console.groupEnd();

        // Classes
        console.group('🏗️ Class Definitions');
        console.log('Total:', Object.keys(report.classes.classes).length);
        console.log('Defined:', Object.keys(report.classes.classes).length - report.classes.undefined.length);
        if (report.classes.undefined.length > 0) {
            console.error('❌ Undefined:', report.classes.undefined);
        } else {
            console.log('✅ All classes defined');
        }
        console.groupEnd();

        // Errors
        if (report.errors.length > 0) {
            console.group('❌ Script Load Errors');
            report.errors.forEach(err => {
                console.error(`${err.script} failed at +${err.time}ms:`, err.error);
            });
            console.groupEnd();
        }

        // Load order
        console.group('📋 Load Order');
        report.loadOrder.forEach((script, index) => {
            console.log(`${index + 1}. ${script}`);
        });
        console.groupEnd();

        console.groupEnd();

        return report;
    }

    /**
     * Check for critical issues
     */
    function checkCriticalIssues() {
        const report = generateReport();
        const issues = [];

        // Missing critical scripts
        const critical = [
            'universal-display-renderer.js',
            'spa-navigation.js',
            'home-view.js',
            'app-init-simple.js'
        ];

        const missingCritical = report.scripts.missing.filter(name =>
            critical.some(c => name.includes(c))
        );

        if (missingCritical.length > 0) {
            issues.push({
                severity: 'CRITICAL',
                type: 'MISSING_SCRIPT',
                scripts: missingCritical,
                message: `Critical scripts not loaded: ${missingCritical.join(', ')}`
            });
        }

        // Missing critical classes
        const criticalClasses = [
            'UniversalDisplayRenderer',
            'SPANavigation',
            'HomeView'
        ];

        const missingClasses = report.classes.undefined.filter(name =>
            criticalClasses.includes(name)
        );

        if (missingClasses.length > 0) {
            issues.push({
                severity: 'CRITICAL',
                type: 'UNDEFINED_CLASS',
                classes: missingClasses,
                message: `Critical classes undefined: ${missingClasses.join(', ')}`
            });
        }

        // Script load errors
        if (report.errors.length > 0) {
            issues.push({
                severity: 'ERROR',
                type: 'LOAD_ERROR',
                errors: report.errors,
                message: `Script load errors: ${report.errors.map(e => e.script).join(', ')}`
            });
        }

        return issues;
    }

    /**
     * Run verification
     */
    function runVerification() {
        console.log('[Script Verification] Starting verification...');

        monitorScripts();

        // Wait for all scripts to load or timeout
        const timeout = setTimeout(() => {
            console.log('[Script Verification] Verification timeout reached');
            printReport();

            const issues = checkCriticalIssues();
            if (issues.length > 0) {
                console.error('[Script Verification] ❌ Critical issues found:', issues);
            } else {
                console.log('[Script Verification] ✅ No critical issues');
            }
        }, 5000);

        // Also check when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                clearTimeout(timeout);
                console.log('[Script Verification] DOM ready, running verification');
                printReport();

                const issues = checkCriticalIssues();
                if (issues.length > 0) {
                    console.error('[Script Verification] ❌ Critical issues found:', issues);
                } else {
                    console.log('[Script Verification] ✅ No critical issues');
                }
            });
        }
    }

    // Expose functions
    window.ScriptVerification = {
        run: runVerification,
        report: generateReport,
        print: printReport,
        checkIssues: checkCriticalIssues,
        tracker: scriptLoadTracker
    };

    // Auto-run on load
    runVerification();

})();
