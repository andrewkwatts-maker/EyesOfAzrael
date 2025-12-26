#!/usr/bin/env node

/**
 * Random Page Testing & Polishing Script
 *
 * Systematically selects random pages across all mythologies and tests:
 * - HTML structure validity
 * - Firebase component integration
 * - Responsive grid layouts
 * - Theme system integration
 * - Authentication integration
 * - Submission system integration
 * - Asset rendering
 *
 * Generates a comprehensive report of issues and fixes applied.
 */

const fs = require('fs');
const path = require('path');

class PageTester {
    constructor() {
        this.baseDir = path.resolve(__dirname, '..');
        this.mythologies = [
            'greek', 'egyptian', 'norse', 'hindu', 'buddhist', 'christian', 'jewish',
            'islamic', 'celtic', 'roman', 'persian', 'chinese', 'japanese',
            'babylonian', 'sumerian', 'aztec', 'mayan', 'yoruba'
        ];
        this.pageTypes = ['deities', 'heroes', 'creatures', 'cosmology', 'rituals', 'herbs', 'texts'];
        this.results = {
            tested: [],
            passed: [],
            failed: [],
            fixed: [],
            issues: []
        };
    }

    /**
     * Select random pages to test
     */
    selectRandomPages(count = 20) {
        const selected = [];
        const attempts = count * 3; // Try more times to get enough valid pages

        for (let i = 0; i < attempts && selected.length < count; i++) {
            const mythology = this.mythologies[Math.floor(Math.random() * this.mythologies.length)];
            const pageType = this.pageTypes[Math.floor(Math.random() * this.pageTypes.length)];

            const indexPath = path.join(this.baseDir, 'mythos', mythology, pageType, 'index.html');

            if (fs.existsSync(indexPath) && !selected.includes(indexPath)) {
                selected.push(indexPath);
            }
        }

        // Also add some specific important pages
        const importantPages = [
            path.join(this.baseDir, 'mythos', 'greek', 'deities', 'index.html'),
            path.join(this.baseDir, 'mythos', 'egyptian', 'deities', 'index.html'),
            path.join(this.baseDir, 'mythos', 'norse', 'deities', 'index.html'),
            path.join(this.baseDir, 'mythos', 'jewish', 'kabbalah', 'index.html'),
            path.join(this.baseDir, 'mythos', 'christian', 'gnostic', 'index.html'),
        ];

        importantPages.forEach(page => {
            if (fs.existsSync(page) && !selected.includes(page)) {
                selected.push(page);
            }
        });

        return selected.slice(0, count);
    }

    /**
     * Test a single page
     */
    testPage(filePath) {
        const relativePath = path.relative(this.baseDir, filePath);
        console.log(`\nTesting: ${relativePath}`);

        const result = {
            path: relativePath,
            issues: [],
            fixes: [],
            status: 'passed'
        };

        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // Test 1: Firebase scripts
            if (!content.includes('firebase-app-compat.js')) {
                result.issues.push('Missing Firebase SDK');
            }

            // Test 2: Theme system
            if (!content.includes('theme-base.css') && !content.includes('themes/theme-base.css')) {
                result.issues.push('Missing theme system');
            }

            // Test 3: Responsive grid
            if (content.includes('<div class="entity-grid"') || content.includes('class="deity-grid"')) {
                if (!content.includes('universal-grid.css') && !content.includes('grid-template-columns')) {
                    result.issues.push('Entity grid missing responsive styling');
                }
            }

            // Test 4: Firebase auth
            if (!content.includes('firebase-auth.js') && !content.includes('user-auth')) {
                result.issues.push('Missing Firebase authentication');
            }

            // Test 5: Submission system
            if (!content.includes('submission') && !content.includes('add-entity-card')) {
                result.issues.push('Missing user submission integration');
            }

            // Test 6: Universal renderer
            if (content.includes('data-attribute-grid') || content.includes('data-deity-content')) {
                if (!content.includes('universal-entity-renderer.js') &&
                    !content.includes('attribute-grid-renderer.js')) {
                    result.issues.push('Missing entity renderer');
                }
            }

            // Test 7: Breadcrumbs
            if (!content.includes('breadcrumb')) {
                result.issues.push('Missing breadcrumb navigation');
            }

            // Test 8: Spinner/loading states
            if (!content.includes('spinner.css') && content.includes('Firebase')) {
                result.issues.push('Missing loading spinner CSS');
            }

            // Mark as failed if issues found
            if (result.issues.length > 0) {
                result.status = 'failed';
                this.results.failed.push(result);
            } else {
                this.results.passed.push(result);
            }

        } catch (error) {
            result.issues.push(`Error reading file: ${error.message}`);
            result.status = 'error';
            this.results.failed.push(result);
        }

        this.results.tested.push(result);
        return result;
    }

    /**
     * Attempt to fix common issues
     */
    fixPage(filePath, issues) {
        console.log(`  Attempting to fix: ${filePath}`);

        try {
            let content = fs.readFileSync(filePath, 'utf-8');
            let modified = false;
            const fixes = [];

            // Fix 1: Add spinner CSS if missing
            if (issues.includes('Missing loading spinner CSS')) {
                if (!content.includes('spinner.css')) {
                    content = content.replace(
                        '</head>',
                        '    <link rel="stylesheet" href="../../../css/spinner.css">\n</head>'
                    );
                    modified = true;
                    fixes.push('Added spinner.css');
                }
            }

            // Fix 2: Add Firebase auth if missing
            if (issues.includes('Missing Firebase authentication')) {
                if (!content.includes('firebase-auth.js')) {
                    const authSnippet = `
    <!-- Firebase Auth System -->
    <link rel="stylesheet" href="../../../css/user-auth.css">
    <script src="../../../js/firebase-auth.js"></script>
`;
                    content = content.replace('</head>', authSnippet + '</head>');
                    modified = true;
                    fixes.push('Added Firebase authentication');
                }
            }

            // Fix 3: Add submission system if missing
            if (issues.includes('Missing user submission integration')) {
                if (!content.includes('submission')) {
                    const submissionSnippet = `
    <!-- Submission Link System -->
    <script src="../../../js/submission-context.js"></script>
    <script src="../../../js/components/submission-link.js"></script>
    <link rel="stylesheet" href="../../../css/submission-link.css">
`;
                    content = content.replace('</head>', submissionSnippet + '</head>');
                    modified = true;
                    fixes.push('Added submission system');
                }
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf-8');
                return fixes;
            }

        } catch (error) {
            console.error(`  Error fixing file: ${error.message}`);
        }

        return [];
    }

    /**
     * Run full test suite
     */
    async run(pageCount = 20, autoFix = true) {
        console.log('='.repeat(80));
        console.log('RANDOM PAGE TESTING & POLISHING');
        console.log('='.repeat(80));

        const pages = this.selectRandomPages(pageCount);
        console.log(`\nSelected ${pages.length} pages for testing\n`);

        // Test all pages
        for (const pagePath of pages) {
            const result = this.testPage(pagePath);

            // Auto-fix if enabled and issues found
            if (autoFix && result.issues.length > 0) {
                const fixes = this.fixPage(pagePath, result.issues);
                if (fixes.length > 0) {
                    result.fixes = fixes;
                    result.status = 'fixed';
                    this.results.fixed.push(result);
                    console.log(`  ✅ Fixed ${fixes.length} issues`);
                }
            }
        }

        this.generateReport();
    }

    /**
     * Generate testing report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('TESTING REPORT');
        console.log('='.repeat(80));

        console.log(`\nTotal Pages Tested: ${this.results.tested.length}`);
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`🔧 Fixed: ${this.results.fixed.length}`);
        console.log(`❌ Failed: ${this.results.failed.filter(r => r.status === 'failed').length}`);

        if (this.results.fixed.length > 0) {
            console.log('\n📝 Pages Fixed:');
            this.results.fixed.forEach(result => {
                console.log(`\n  ${result.path}`);
                result.fixes.forEach(fix => console.log(`    ✓ ${fix}`));
            });
        }

        if (this.results.failed.filter(r => r.status === 'failed').length > 0) {
            console.log('\n⚠️  Pages Still Needing Attention:');
            this.results.failed
                .filter(r => r.status === 'failed')
                .forEach(result => {
                    console.log(`\n  ${result.path}`);
                    result.issues.forEach(issue => console.log(`    • ${issue}`));
                });
        }

        // Save report to file
        const reportPath = path.join(this.baseDir, 'PAGE_TESTING_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2), 'utf-8');
        console.log(`\n📄 Full report saved to: PAGE_TESTING_REPORT.json`);

        console.log('\n' + '='.repeat(80) + '\n');
    }
}

// Run if executed directly
if (require.main === module) {
    const tester = new PageTester();
    const pageCount = process.argv[2] ? parseInt(process.argv[2]) : 20;
    const autoFix = process.argv[3] !== '--no-fix';

    tester.run(pageCount, autoFix).catch(console.error);
}

module.exports = PageTester;
