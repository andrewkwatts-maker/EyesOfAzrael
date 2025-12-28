/**
 * Automated Route Tester
 * Tests all SPA routes to ensure they work with Firebase data
 *
 * Usage:
 *   const tester = new RouteTester(db);
 *   await tester.runAllTests();
 *   console.log(tester.getReport());
 */

class RouteTester {
    constructor(firestore) {
        this.db = firestore;
        this.results = [];
        this.routes = this.defineRoutes();
        this.testContainer = null;
    }

    /**
     * Define all routes to test
     */
    defineRoutes() {
        return [
            // Home
            {
                path: '#/',
                name: 'Home',
                pattern: /^#?\/?$/,
                handler: 'renderHome',
                viewClass: 'LandingPageView',
                expectedContent: ['Eyes of Azrael', 'Explore'],
                requiresAuth: true
            },

            // Mythologies Grid
            {
                path: '#/mythologies',
                name: 'Mythologies Grid',
                pattern: /^#?\/mythologies\/?$/,
                handler: 'renderMythologies',
                viewClass: 'MythologiesView',
                expectedContent: ['mythology', 'mythologies'],
                requiresAuth: true
            },

            // Browse Category (Deities)
            {
                path: '#/browse/deities',
                name: 'Browse Deities',
                pattern: /^#?\/browse\/([^\/]+)\/?$/,
                handler: 'renderBrowseCategory',
                viewClass: 'BrowseCategoryView',
                expectedContent: ['Deities', 'Gods'],
                requiresAuth: true,
                testFirebase: true,
                collection: 'deities'
            },

            // Browse Category (Creatures)
            {
                path: '#/browse/creatures',
                name: 'Browse Creatures',
                pattern: /^#?\/browse\/([^\/]+)\/?$/,
                handler: 'renderBrowseCategory',
                viewClass: 'BrowseCategoryView',
                expectedContent: ['Creatures', 'creature'],
                requiresAuth: true,
                testFirebase: true,
                collection: 'creatures'
            },

            // Browse Category (Heroes)
            {
                path: '#/browse/heroes',
                name: 'Browse Heroes',
                pattern: /^#?\/browse\/([^\/]+)\/?$/,
                handler: 'renderBrowseCategory',
                viewClass: 'BrowseCategoryView',
                expectedContent: ['Heroes', 'hero'],
                requiresAuth: true,
                testFirebase: true,
                collection: 'heroes'
            },

            // Browse Category + Mythology
            {
                path: '#/browse/deities/greek',
                name: 'Browse Greek Deities',
                pattern: /^#?\/browse\/([^\/]+)\/([^\/]+)\/?$/,
                handler: 'renderBrowseCategory',
                viewClass: 'BrowseCategoryView',
                expectedContent: ['Greek', 'Deities'],
                requiresAuth: true,
                testFirebase: true,
                collection: 'deities',
                mythologyFilter: 'greek'
            },

            // Mythology Landing Page
            {
                path: '#/mythology/greek',
                name: 'Greek Mythology Page',
                pattern: /^#?\/mythology\/([^\/]+)\/?$/,
                handler: 'renderMythology',
                viewClass: null, // Coming soon page
                expectedContent: ['Greek', 'Mythology'],
                requiresAuth: true
            },

            // Entity Page (Alt format)
            {
                path: '#/entity/deities/greek/zeus',
                name: 'Entity Page (Alt)',
                pattern: /^#?\/entity\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
                handler: 'renderEntity',
                viewClass: 'FirebaseEntityRenderer',
                expectedContent: ['Zeus'],
                requiresAuth: true,
                testFirebase: true,
                collection: 'deities',
                entityId: 'zeus'
            },

            // Entity Page (Standard format)
            {
                path: '#/mythology/greek/deities/zeus',
                name: 'Entity Page (Standard)',
                pattern: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
                handler: 'renderEntity',
                viewClass: 'FirebaseEntityRenderer',
                expectedContent: ['Zeus'],
                requiresAuth: true,
                testFirebase: true,
                collection: 'deities',
                entityId: 'zeus'
            },

            // Search
            {
                path: '#/search',
                name: 'Search Page',
                pattern: /^#?\/search\/?$/,
                handler: 'renderSearch',
                viewClass: 'SearchViewComplete',
                expectedContent: ['Search', 'search'],
                requiresAuth: true
            },

            // Compare
            {
                path: '#/compare',
                name: 'Compare Page',
                pattern: /^#?\/compare\/?$/,
                handler: 'renderCompare',
                viewClass: 'CompareView',
                expectedContent: ['Compare', 'compare'],
                requiresAuth: true
            },

            // Dashboard
            {
                path: '#/dashboard',
                name: 'Dashboard Page',
                pattern: /^#?\/dashboard\/?$/,
                handler: 'renderDashboard',
                viewClass: 'UserDashboard',
                expectedContent: ['Dashboard', 'dashboard'],
                requiresAuth: true
            },

            // About
            {
                path: '#/about',
                name: 'About Page',
                pattern: /^#?\/about\/?$/,
                handler: 'renderAbout',
                viewClass: 'AboutPage',
                expectedContent: ['About', 'about'],
                requiresAuth: true
            },

            // Privacy
            {
                path: '#/privacy',
                name: 'Privacy Page',
                pattern: /^#?\/privacy\/?$/,
                handler: 'renderPrivacy',
                viewClass: 'PrivacyPage',
                expectedContent: ['Privacy', 'privacy'],
                requiresAuth: true
            },

            // Terms
            {
                path: '#/terms',
                name: 'Terms Page',
                pattern: /^#?\/terms\/?$/,
                handler: 'renderTerms',
                viewClass: 'TermsPage',
                expectedContent: ['Terms', 'terms'],
                requiresAuth: true
            },

            // 404
            {
                path: '#/nonexistent-page-12345',
                name: '404 Page',
                pattern: null,
                handler: 'render404',
                viewClass: null,
                expectedContent: ['404', 'not found'],
                requiresAuth: true,
                expect404: true
            }
        ];
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('[Route Tester] 🧪 Starting comprehensive route testing...');
        console.log(`[Route Tester] Testing ${this.routes.length} routes`);

        // Create hidden test container
        this.createTestContainer();

        // Test each route
        for (const route of this.routes) {
            await this.testRoute(route);
        }

        // Clean up
        this.removeTestContainer();

        // Generate summary
        this.generateSummary();

        return this.results;
    }

    /**
     * Create hidden test container
     */
    createTestContainer() {
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'route-test-container';
        this.testContainer.style.display = 'none';
        document.body.appendChild(this.testContainer);
    }

    /**
     * Remove test container
     */
    removeTestContainer() {
        if (this.testContainer) {
            this.testContainer.remove();
            this.testContainer = null;
        }
    }

    /**
     * Test a single route
     */
    async testRoute(route) {
        console.log(`\n[Route Tester] Testing: ${route.name} (${route.path})`);

        const result = {
            name: route.name,
            path: route.path,
            pattern: route.pattern?.toString(),
            handler: route.handler,
            viewClass: route.viewClass,
            status: 'pending',
            errors: [],
            warnings: [],
            checks: {
                routeMatches: false,
                handlerExists: false,
                viewClassExists: false,
                contentRenders: false,
                firebaseDataLoads: false,
                noErrors: true,
                expectedContentFound: false
            },
            timing: {
                start: Date.now(),
                end: null,
                duration: null
            },
            notes: []
        };

        try {
            // Test 1: Route Pattern Match
            if (route.pattern) {
                const testPath = route.path.replace('#', '');
                result.checks.routeMatches = route.pattern.test(testPath);

                if (!result.checks.routeMatches) {
                    result.errors.push(`Route pattern does not match path: ${testPath}`);
                } else {
                    console.log('  ✓ Route pattern matches');
                }
            } else {
                result.checks.routeMatches = true; // 404 route
                result.notes.push('No pattern (404 route)');
            }

            // Test 2: Handler Function Exists
            if (window.spaNav && typeof window.spaNav[route.handler] === 'function') {
                result.checks.handlerExists = true;
                console.log('  ✓ Handler function exists');
            } else {
                result.errors.push(`Handler function not found: ${route.handler}`);
                console.log('  ✗ Handler function missing');
            }

            // Test 3: View Class Exists
            if (route.viewClass) {
                if (typeof window[route.viewClass] !== 'undefined') {
                    result.checks.viewClassExists = true;
                    console.log('  ✓ View class exists');
                } else {
                    result.warnings.push(`View class not loaded: ${route.viewClass}`);
                    console.log('  ⚠ View class not loaded');
                }
            } else {
                result.checks.viewClassExists = true; // N/A
                result.notes.push('No view class required');
            }

            // Test 4: Firebase Data Loads
            if (route.testFirebase && route.collection) {
                try {
                    const queryResult = await this.testFirebaseQuery(
                        route.collection,
                        route.mythologyFilter,
                        route.entityId
                    );

                    result.checks.firebaseDataLoads = queryResult.success;
                    result.notes.push(`Firebase: ${queryResult.count} documents found`);

                    if (queryResult.success) {
                        console.log(`  ✓ Firebase data loads (${queryResult.count} docs)`);
                    } else {
                        result.warnings.push(queryResult.error || 'No Firebase data found');
                        console.log('  ⚠ No Firebase data');
                    }
                } catch (error) {
                    result.warnings.push(`Firebase error: ${error.message}`);
                    console.log('  ⚠ Firebase query failed');
                }
            } else {
                result.checks.firebaseDataLoads = true; // N/A
            }

            // Test 5: Content Renders
            try {
                await this.testContentRender(route);
                result.checks.contentRenders = true;
                console.log('  ✓ Content renders');
            } catch (error) {
                result.errors.push(`Render error: ${error.message}`);
                result.checks.contentRenders = false;
                result.checks.noErrors = false;
                console.log('  ✗ Content render failed');
            }

            // Test 6: Expected Content Found
            if (route.expectedContent && result.checks.contentRenders) {
                const content = this.testContainer.textContent.toLowerCase();
                const foundContent = route.expectedContent.filter(expected =>
                    content.includes(expected.toLowerCase())
                );

                if (foundContent.length > 0) {
                    result.checks.expectedContentFound = true;
                    console.log(`  ✓ Expected content found (${foundContent.length}/${route.expectedContent.length})`);
                } else {
                    result.warnings.push('Expected content not found in rendered output');
                    console.log('  ⚠ Expected content not found');
                }
            } else {
                result.checks.expectedContentFound = true; // N/A
            }

            // Test 7: No Console Errors
            // (This is tracked via result.checks.noErrors during render)

            // Determine overall status
            const criticalChecks = [
                result.checks.routeMatches,
                result.checks.handlerExists,
                result.checks.contentRenders,
                result.checks.noErrors
            ];

            if (criticalChecks.every(check => check)) {
                result.status = 'pass';
            } else if (result.errors.length > 0) {
                result.status = 'fail';
            } else {
                result.status = 'warning';
            }

        } catch (error) {
            result.status = 'error';
            result.errors.push(`Test error: ${error.message}`);
            result.checks.noErrors = false;
            console.error('  ✗ Test error:', error);
        }

        // Record timing
        result.timing.end = Date.now();
        result.timing.duration = result.timing.end - result.timing.start;

        this.results.push(result);
        console.log(`  ${this.getStatusIcon(result.status)} ${result.status.toUpperCase()} (${result.timing.duration}ms)`);
    }

    /**
     * Test Firebase query
     */
    async testFirebaseQuery(collection, mythology = null, entityId = null) {
        try {
            let query = this.db.collection(collection);

            if (entityId) {
                const doc = await query.doc(entityId).get();
                return {
                    success: doc.exists,
                    count: doc.exists ? 1 : 0,
                    error: doc.exists ? null : `Entity ${entityId} not found`
                };
            }

            if (mythology) {
                query = query.where('mythology', '==', mythology);
            }

            const snapshot = await query.limit(1).get();

            return {
                success: !snapshot.empty,
                count: snapshot.size,
                error: snapshot.empty ? 'No documents found' : null
            };

        } catch (error) {
            return {
                success: false,
                count: 0,
                error: error.message
            };
        }
    }

    /**
     * Test content rendering
     */
    async testContentRender(route) {
        // Clear test container
        this.testContainer.innerHTML = '';

        // Simulate navigation
        if (window.spaNav) {
            // Temporarily set hash without triggering navigation
            const originalHash = window.location.hash;

            try {
                // Manually call the handler
                if (typeof window.spaNav[route.handler] === 'function') {
                    await window.spaNav[route.handler]();

                    // Wait for content to render
                    await this.waitForContent(500);
                } else {
                    throw new Error(`Handler ${route.handler} not callable`);
                }
            } finally {
                // Restore original hash
                if (originalHash !== window.location.hash) {
                    window.location.hash = originalHash;
                }
            }
        } else {
            throw new Error('SPA navigation not initialized');
        }

        // Check if content was rendered
        const hasContent = this.testContainer.innerHTML.length > 0 ||
                          document.getElementById('main-content')?.innerHTML.length > 0;

        if (!hasContent) {
            throw new Error('No content rendered');
        }
    }

    /**
     * Wait for content to render
     */
    waitForContent(timeout = 1000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const mainContent = document.getElementById('main-content');
                if (mainContent && mainContent.innerHTML.length > 100) {
                    resolve();
                } else if (Date.now() - start > timeout) {
                    resolve(); // Timeout
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            pass: '✅',
            fail: '❌',
            warning: '⚠️',
            error: '💥',
            pending: '⏳'
        };
        return icons[status] || '❓';
    }

    /**
     * Generate summary
     */
    generateSummary() {
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const warnings = this.results.filter(r => r.status === 'warning').length;
        const errors = this.results.filter(r => r.status === 'error').length;

        console.log('\n' + '='.repeat(60));
        console.log('ROUTE TESTING SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Routes: ${this.results.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`💥 Errors: ${errors}`);
        console.log('='.repeat(60));
    }

    /**
     * Get detailed report
     */
    getReport() {
        return {
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.status === 'pass').length,
                failed: this.results.filter(r => r.status === 'fail').length,
                warnings: this.results.filter(r => r.status === 'warning').length,
                errors: this.results.filter(r => r.status === 'error').length,
                totalTime: this.results.reduce((sum, r) => sum + r.timing.duration, 0)
            },
            results: this.results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Export report as JSON
     */
    exportReportJSON() {
        return JSON.stringify(this.getReport(), null, 2);
    }

    /**
     * Export report as Markdown
     */
    exportReportMarkdown() {
        const report = this.getReport();
        let md = '# Route Testing Report\n\n';
        md += `**Generated:** ${report.timestamp}\n\n`;
        md += '## Summary\n\n';
        md += `- **Total Routes:** ${report.summary.total}\n`;
        md += `- **Passed:** ${report.summary.passed} ✅\n`;
        md += `- **Failed:** ${report.summary.failed} ❌\n`;
        md += `- **Warnings:** ${report.summary.warnings} ⚠️\n`;
        md += `- **Errors:** ${report.summary.errors} 💥\n`;
        md += `- **Total Time:** ${report.summary.totalTime}ms\n\n`;

        md += '## Validation Matrix\n\n';
        md += '| Route | Status | Data Exists | View Works | Notes |\n';
        md += '|-------|--------|-------------|------------|-------|\n';

        for (const result of this.results) {
            const status = this.getStatusIcon(result.status);
            const dataExists = result.checks.firebaseDataLoads ? '✅' : '⚠️';
            const viewWorks = result.checks.contentRenders ? '✅' : '❌';
            const notes = [...result.errors, ...result.warnings, ...result.notes].join('; ');

            md += `| ${result.name} | ${status} | ${dataExists} | ${viewWorks} | ${notes || '-'} |\n`;
        }

        md += '\n## Detailed Results\n\n';
        for (const result of this.results) {
            md += `### ${result.name}\n\n`;
            md += `- **Path:** \`${result.path}\`\n`;
            md += `- **Status:** ${this.getStatusIcon(result.status)} ${result.status}\n`;
            md += `- **Duration:** ${result.timing.duration}ms\n\n`;

            md += '**Checks:**\n';
            for (const [check, passed] of Object.entries(result.checks)) {
                md += `- ${passed ? '✅' : '❌'} ${check}\n`;
            }

            if (result.errors.length > 0) {
                md += '\n**Errors:**\n';
                result.errors.forEach(err => md += `- ❌ ${err}\n`);
            }

            if (result.warnings.length > 0) {
                md += '\n**Warnings:**\n';
                result.warnings.forEach(warn => md += `- ⚠️ ${warn}\n`);
            }

            if (result.notes.length > 0) {
                md += '\n**Notes:**\n';
                result.notes.forEach(note => md += `- 💡 ${note}\n`);
            }

            md += '\n';
        }

        return md;
    }

    /**
     * Export report as HTML
     */
    exportReportHTML() {
        const report = this.getReport();
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Route Testing Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: #0f1419;
            color: #e5e7eb;
        }
        h1 { color: #8b7fff; }
        h2 { color: #fbbf24; border-bottom: 2px solid #8b7fff; padding-bottom: 0.5rem; }
        .summary {
            background: rgba(139, 127, 255, 0.1);
            border: 2px solid #8b7fff;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .stat {
            background: rgba(26, 31, 58, 0.8);
            padding: 1rem;
            border-radius: 4px;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 2rem 0;
            background: rgba(26, 31, 58, 0.6);
            border-radius: 8px;
            overflow: hidden;
        }
        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid rgba(139, 127, 255, 0.2);
        }
        th {
            background: rgba(139, 127, 255, 0.2);
            color: #8b7fff;
            font-weight: 600;
        }
        .pass { color: #51cf66; }
        .fail { color: #ff6b6b; }
        .warning { color: #fbbf24; }
        .error { color: #ff9900; }
        .detail-card {
            background: rgba(26, 31, 58, 0.6);
            border: 1px solid rgba(139, 127, 255, 0.3);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .checks { margin: 1rem 0; }
        .check-item { padding: 0.25rem 0; }
    </style>
</head>
<body>
    <h1>🧪 Route Testing Report</h1>
    <p><strong>Generated:</strong> ${report.timestamp}</p>

    <div class="summary">
        <h2>Summary</h2>
        <div class="summary-grid">
            <div class="stat">
                <div style="font-size: 2rem; font-weight: bold;">${report.summary.total}</div>
                <div>Total Routes</div>
            </div>
            <div class="stat pass">
                <div style="font-size: 2rem; font-weight: bold;">✅ ${report.summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="stat fail">
                <div style="font-size: 2rem; font-weight: bold;">❌ ${report.summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="stat warning">
                <div style="font-size: 2rem; font-weight: bold;">⚠️ ${report.summary.warnings}</div>
                <div>Warnings</div>
            </div>
            <div class="stat">
                <div style="font-size: 2rem; font-weight: bold;">${report.summary.totalTime}ms</div>
                <div>Total Time</div>
            </div>
        </div>
    </div>

    <h2>Validation Matrix</h2>
    <table>
        <thead>
            <tr>
                <th>Route</th>
                <th>Status</th>
                <th>Data Exists</th>
                <th>View Works</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            ${report.results.map(result => `
                <tr class="${result.status}">
                    <td><strong>${result.name}</strong><br><code>${result.path}</code></td>
                    <td>${this.getStatusIcon(result.status)} ${result.status.toUpperCase()}</td>
                    <td>${result.checks.firebaseDataLoads ? '✅' : '⚠️'}</td>
                    <td>${result.checks.contentRenders ? '✅' : '❌'}</td>
                    <td>${[...result.errors, ...result.warnings, ...result.notes].join('<br>') || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Detailed Results</h2>
    ${report.results.map(result => `
        <div class="detail-card">
            <h3>${this.getStatusIcon(result.status)} ${result.name}</h3>
            <p><strong>Path:</strong> <code>${result.path}</code></p>
            <p><strong>Duration:</strong> ${result.timing.duration}ms</p>

            <div class="checks">
                <strong>Checks:</strong>
                ${Object.entries(result.checks).map(([check, passed]) =>
                    `<div class="check-item">${passed ? '✅' : '❌'} ${check}</div>`
                ).join('')}
            </div>

            ${result.errors.length > 0 ? `
                <div style="color: #ff6b6b;">
                    <strong>Errors:</strong>
                    ${result.errors.map(err => `<div>❌ ${err}</div>`).join('')}
                </div>
            ` : ''}

            ${result.warnings.length > 0 ? `
                <div style="color: #fbbf24;">
                    <strong>Warnings:</strong>
                    ${result.warnings.map(warn => `<div>⚠️ ${warn}</div>`).join('')}
                </div>
            ` : ''}

            ${result.notes.length > 0 ? `
                <div style="color: #9ca3af;">
                    <strong>Notes:</strong>
                    ${result.notes.map(note => `<div>💡 ${note}</div>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
        `;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteTester;
}

// Global export
if (typeof window !== 'undefined') {
    window.RouteTester = RouteTester;
}
