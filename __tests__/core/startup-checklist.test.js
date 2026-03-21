/**
 * StartupChecklist Module Tests
 * Tests for js/core/startup-checklist.js
 */

describe('StartupChecklist', () => {
    let StartupChecklist;

    beforeEach(() => {
        // Reset window globals that the checks depend on
        delete window.StartupChecklist;
        delete window.firebase;
        delete window.firebaseConfig;
        delete window.SPANavigation;
        delete window.UniversalDisplayRenderer;
        delete window.LandingPageView;
        delete window.AuthManager;
        delete window.ShaderThemeManager;
        delete window.EnhancedCorpusSearch;
        delete window.FirebaseCRUDManager;
        delete window.FavoritesService;
        delete window.DiagnosticPanel;

        document.body.innerHTML = '';
        document.head.querySelectorAll('style').forEach(s => s.remove());

        // Load the module
        StartupChecklist = require('../../js/core/startup-checklist.js');
    });

    describe('runAll', () => {
        test('should return results object with expected structure', () => {
            const results = StartupChecklist.runAll();
            expect(results).toHaveProperty('allPassed');
            expect(results).toHaveProperty('allCriticalPassed');
            expect(results).toHaveProperty('results');
            expect(results).toHaveProperty('criticalFailures');
            expect(results).toHaveProperty('optionalFailures');
            expect(results).toHaveProperty('timestamp');
            expect(Array.isArray(results.results)).toBe(true);
        });

        test('should report critical failures when dependencies are missing', () => {
            const results = StartupChecklist.runAll();
            expect(results.allCriticalPassed).toBe(false);
            expect(results.criticalFailures.length).toBeGreaterThan(0);
            expect(results.criticalFailures).toContain('Firebase SDK');
        });

        test('should pass critical checks when all dependencies are present', () => {
            // Set up all critical dependencies
            window.firebase = { apps: [] };
            window.firebaseConfig = { projectId: 'test' };
            window.SPANavigation = function() {};
            window.UniversalDisplayRenderer = function() {};
            window.LandingPageView = function() {};

            const results = StartupChecklist.runAll();
            expect(results.allCriticalPassed).toBe(true);
            expect(results.criticalFailures).toHaveLength(0);
        });

        test('should report optional failures separately from critical', () => {
            window.firebase = { apps: [] };
            window.firebaseConfig = { projectId: 'test' };
            window.SPANavigation = function() {};
            window.UniversalDisplayRenderer = function() {};
            window.LandingPageView = function() {};

            const results = StartupChecklist.runAll();
            expect(results.allCriticalPassed).toBe(true);
            expect(results.allPassed).toBe(false);
            expect(results.optionalFailures.length).toBeGreaterThan(0);
        });

        test('should report allPassed true when all dependencies are present', () => {
            window.firebase = { apps: [] };
            window.firebaseConfig = { projectId: 'test' };
            window.SPANavigation = function() {};
            window.UniversalDisplayRenderer = function() {};
            window.LandingPageView = function() {};
            window.AuthManager = function() {};
            window.ShaderThemeManager = function() {};
            window.EnhancedCorpusSearch = function() {};
            window.FirebaseCRUDManager = function() {};
            window.FavoritesService = function() {};

            const results = StartupChecklist.runAll();
            expect(results.allPassed).toBe(true);
            expect(results.allCriticalPassed).toBe(true);
        });

        test('should handle check functions that throw errors', () => {
            // Replace a check with one that throws
            const origChecks = StartupChecklist.checks;
            StartupChecklist.checks = [{
                name: 'Broken Check',
                check: () => { throw new Error('boom'); },
                critical: true,
                guidance: 'Fix it'
            }];

            const results = StartupChecklist.runAll();
            expect(results.criticalFailures).toContain('Broken Check');

            StartupChecklist.checks = origChecks;
        });

        test('should include guidance text in each result', () => {
            const results = StartupChecklist.runAll();
            for (const result of results.results) {
                expect(typeof result.guidance).toBe('string');
                expect(result.guidance.length).toBeGreaterThan(0);
            }
        });
    });

    describe('showDiagnosticPanel', () => {
        test('should delegate to DiagnosticPanel component if available', () => {
            const showSpy = jest.fn();
            window.DiagnosticPanel = { show: showSpy };

            const mockResults = { results: [], criticalFailures: [] };
            StartupChecklist.showDiagnosticPanel(mockResults);
            expect(showSpy).toHaveBeenCalledWith(mockResults);
        });

        test('should render inline fallback panel when DiagnosticPanel is not available', () => {
            document.body.innerHTML = '<div id="main-content"></div>';
            const mockResults = {
                results: [
                    { name: 'Firebase SDK', passed: false, critical: true, guidance: 'Load it' },
                    { name: 'AuthManager', passed: true, critical: false, guidance: '' }
                ],
                criticalFailures: ['Firebase SDK'],
                optionalFailures: []
            };

            StartupChecklist.showDiagnosticPanel(mockResults);

            const panel = document.querySelector('.diagnostic-panel');
            expect(panel).not.toBeNull();
            expect(panel.getAttribute('role')).toBe('alert');
            expect(panel.textContent).toContain('Firebase SDK');
        });
    });

    describe('showWarningBadge', () => {
        test('should not create badge when there are no optional failures', () => {
            document.body.innerHTML = '<header class="site-header"></header>';
            const results = { optionalFailures: [] };

            StartupChecklist.showWarningBadge(results);
            expect(document.querySelector('.diagnostic-badge')).toBeNull();
        });

        test('should create badge in header when optional failures exist', () => {
            document.body.innerHTML = '<div class="header-actions"></div>';
            const results = {
                optionalFailures: ['AuthManager', 'ShaderThemeManager'],
                results: []
            };

            StartupChecklist.showWarningBadge(results);

            const badge = document.querySelector('.diagnostic-badge');
            expect(badge).not.toBeNull();
            expect(badge.getAttribute('aria-label')).toBe('2 features unavailable');
        });

        test('should not create badge when no header element is found', () => {
            document.body.innerHTML = '<div id="no-header"></div>';
            const results = { optionalFailures: ['AuthManager'] };

            StartupChecklist.showWarningBadge(results);
            expect(document.querySelector('.diagnostic-badge')).toBeNull();
        });
    });
});
