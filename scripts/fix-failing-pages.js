#!/usr/bin/env node

/**
 * Comprehensive Page Fix Script
 *
 * Automatically fixes common integration issues found during page testing:
 * - Adds Firebase SDK scripts
 * - Adds Firebase authentication system
 * - Adds submission system integration
 * - Adds responsive grid CSS
 * - Adds theme system integration
 * - Adds spinner/loading state CSS
 * - Adds breadcrumb navigation
 */

const fs = require('fs');
const path = require('path');

class PageFixer {
    constructor() {
        this.baseDir = path.resolve(__dirname, '..');
        this.reportPath = path.join(this.baseDir, 'PAGE_TESTING_REPORT.json');
        this.results = {
            processed: 0,
            fixed: 0,
            failed: 0,
            skipped: 0,
            fixes: []
        };
    }

    /**
     * Load testing report
     */
    loadTestReport() {
        if (!fs.existsSync(this.reportPath)) {
            throw new Error('PAGE_TESTING_REPORT.json not found. Run test-random-pages.js first.');
        }

        const report = JSON.parse(fs.readFileSync(this.reportPath, 'utf-8'));
        return report.failed.filter(r => r.status === 'failed');
    }

    /**
     * Fix a single page
     */
    fixPage(pageReport) {
        const filePath = path.join(this.baseDir, pageReport.path);
        const relativePath = pageReport.path;

        console.log(`\n${'='.repeat(80)}`);
        console.log(`Fixing: ${relativePath}`);
        console.log(`Issues found: ${pageReport.issues.length}`);

        try {
            let content = fs.readFileSync(filePath, 'utf-8');
            let modified = false;
            const appliedFixes = [];

            // Calculate relative path depth for correct ../../../ paths
            const depth = relativePath.split(/[\\/]/).length - 1;
            const upPath = '../'.repeat(depth);

            // Fix 1: Add Firebase SDK
            if (pageReport.issues.some(i => i.includes('Missing Firebase SDK'))) {
                if (!content.includes('firebase-app-compat.js')) {
                    const firebaseSnippet = `
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="${upPath}js/firebase-init.js"></script>`;

                    content = content.replace('</head>', firebaseSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added Firebase SDK');
                }
            }

            // Fix 2: Add Theme System
            if (pageReport.issues.some(i => i.includes('Missing theme system'))) {
                if (!content.includes('theme-base.css') && !content.includes('themes/theme-base.css')) {
                    const themeSnippet = `
    <!-- Theme System -->
    <link rel="stylesheet" href="${upPath}themes/theme-base.css">
    <link rel="stylesheet" href="${upPath}css/mythology-colors.css">`;

                    content = content.replace('</head>', themeSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added theme system');
                }
            }

            // Fix 3: Add Responsive Grid CSS
            if (pageReport.issues.some(i => i.includes('Entity grid missing responsive styling'))) {
                if (!content.includes('universal-grid.css')) {
                    const gridSnippet = `
    <!-- Universal Grid System -->
    <link rel="stylesheet" href="${upPath}css/universal-grid.css">`;

                    content = content.replace('</head>', gridSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added universal grid CSS');
                }
            }

            // Fix 4: Add Firebase Authentication
            if (pageReport.issues.some(i => i.includes('Missing Firebase authentication'))) {
                if (!content.includes('firebase-auth.js')) {
                    const authSnippet = `
    <!-- Firebase Auth System -->
    <link rel="stylesheet" href="${upPath}css/user-auth.css">
    <script src="${upPath}js/firebase-auth.js"></script>`;

                    content = content.replace('</head>', authSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added Firebase authentication');

                    // Add auth UI placeholder before closing body if not present
                    if (!content.includes('id="user-auth-nav"')) {
                        const authUISnippet = `
    <!-- User Auth Navigation -->
    <div id="user-auth-nav"></div>
`;
                        content = content.replace('</body>', authUISnippet + '</body>');
                    }
                }
            }

            // Fix 5: Add Submission System
            if (pageReport.issues.some(i => i.includes('Missing user submission integration'))) {
                if (!content.includes('submission-context.js')) {
                    const submissionSnippet = `
    <!-- Submission Link System -->
    <script src="${upPath}js/submission-context.js"></script>
    <script src="${upPath}js/components/submission-link.js"></script>
    <link rel="stylesheet" href="${upPath}css/submission-link.css">`;

                    content = content.replace('</head>', submissionSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added submission system');
                }
            }

            // Fix 6: Add Entity Renderer
            if (pageReport.issues.some(i => i.includes('Missing entity renderer'))) {
                if (!content.includes('universal-entity-renderer.js')) {
                    const rendererSnippet = `
    <!-- Universal Entity Renderer -->
    <script src="${upPath}js/universal-entity-renderer.js"></script>`;

                    content = content.replace('</head>', rendererSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added entity renderer');
                }
            }

            // Fix 7: Add Breadcrumb Navigation
            if (pageReport.issues.some(i => i.includes('Missing breadcrumb navigation'))) {
                if (!content.includes('breadcrumb')) {
                    const breadcrumbSnippet = `
    <!-- Breadcrumb Navigation -->
    <link rel="stylesheet" href="${upPath}css/breadcrumb-nav.css">`;

                    content = content.replace('</head>', breadcrumbSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added breadcrumb navigation');

                    // Add breadcrumb container after opening body if not present
                    if (!content.includes('breadcrumb-nav')) {
                        const breadcrumbUI = `
    <nav class="breadcrumb-nav">
        <a href="${upPath}index.html">Home</a>
    </nav>
`;
                        content = content.replace('<body>', '<body>\n' + breadcrumbUI);
                    }
                }
            }

            // Fix 8: Add Spinner CSS
            if (pageReport.issues.some(i => i.includes('Missing loading spinner CSS'))) {
                if (!content.includes('spinner.css')) {
                    const spinnerSnippet = `
    <!-- Loading Spinner -->
    <link rel="stylesheet" href="${upPath}css/spinner.css">`;

                    content = content.replace('</head>', spinnerSnippet + '\n</head>');
                    modified = true;
                    appliedFixes.push('Added spinner CSS');
                }
            }

            // Write changes if any were made
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf-8');
                this.results.fixed++;
                this.results.fixes.push({
                    path: relativePath,
                    fixes: appliedFixes
                });
                console.log(`✅ Applied ${appliedFixes.length} fixes:`);
                appliedFixes.forEach(fix => console.log(`   • ${fix}`));
            } else {
                this.results.skipped++;
                console.log(`⚠️  No fixes could be automatically applied`);
            }

            this.results.processed++;

        } catch (error) {
            console.error(`❌ Error fixing page: ${error.message}`);
            this.results.failed++;
        }
    }

    /**
     * Run fixes on all failing pages
     */
    async run() {
        console.log('='.repeat(80));
        console.log('COMPREHENSIVE PAGE FIX SCRIPT');
        console.log('='.repeat(80));

        const failingPages = this.loadTestReport();
        console.log(`\nLoaded ${failingPages.length} failing pages from test report`);

        if (failingPages.length === 0) {
            console.log('\n✅ No failing pages found. All tests passed!');
            return;
        }

        // Process each failing page
        for (const pageReport of failingPages) {
            this.fixPage(pageReport);
        }

        this.generateReport();
    }

    /**
     * Generate fix report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('FIX REPORT');
        console.log('='.repeat(80));

        console.log(`\nPages Processed: ${this.results.processed}`);
        console.log(`✅ Successfully Fixed: ${this.results.fixed}`);
        console.log(`⚠️  Skipped (no auto-fix): ${this.results.skipped}`);
        console.log(`❌ Failed to Fix: ${this.results.failed}`);

        if (this.results.fixes.length > 0) {
            console.log('\n📝 Detailed Fixes Applied:\n');
            this.results.fixes.forEach(fix => {
                console.log(`  ${fix.path}`);
                fix.fixes.forEach(f => console.log(`    ✓ ${f}`));
                console.log('');
            });
        }

        // Save report
        const reportPath = path.join(this.baseDir, 'PAGE_FIX_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2), 'utf-8');
        console.log(`📄 Full report saved to: PAGE_FIX_REPORT.json`);

        console.log('\n' + '='.repeat(80));
        console.log('NEXT STEPS');
        console.log('='.repeat(80));
        console.log('\n1. Run test-random-pages.js again to verify fixes');
        console.log('2. Check any pages that could not be auto-fixed');
        console.log('3. Test dynamic navigation with index-dynamic.html\n');
    }
}

// Run if executed directly
if (require.main === module) {
    const fixer = new PageFixer();
    fixer.run().catch(console.error);
}

module.exports = PageFixer;
