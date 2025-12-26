#!/usr/bin/env node

/**
 * Comprehensive Site-Wide Index Page Fix
 *
 * Scans ALL index.html pages across the entire mythos directory
 * and ensures they have proper Firebase integration.
 */

const fs = require('fs');
const path = require('path');

class SiteWideFixer {
    constructor() {
        this.baseDir = path.resolve(__dirname, '..');
        this.mythosDir = path.join(this.baseDir, 'mythos');
        this.results = {
            scanned: 0,
            alreadyGood: 0,
            fixed: 0,
            failed: 0,
            details: []
        };
    }

    /**
     * Recursively find all index.html files
     */
    findAllIndexPages(dir = this.mythosDir) {
        const pages = [];

        const scan = (currentDir) => {
            try {
                const entries = fs.readdirSync(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);

                    if (entry.isDirectory()) {
                        scan(fullPath);
                    } else if (entry.name === 'index.html') {
                        pages.push(fullPath);
                    }
                }
            } catch (error) {
                console.error(`Error scanning ${currentDir}: ${error.message}`);
            }
        };

        scan(dir);
        return pages;
    }

    /**
     * Check if page needs fixing
     */
    checkPage(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const issues = [];

        if (!content.includes('firebase-app-compat.js')) {
            issues.push('Missing Firebase SDK');
        }

        if (!content.includes('theme-base.css') && !content.includes('themes/theme-base.css')) {
            issues.push('Missing theme system');
        }

        if ((content.includes('entity-grid') || content.includes('deity-grid')) &&
            !content.includes('universal-grid.css')) {
            issues.push('Missing responsive grid CSS');
        }

        return issues;
    }

    /**
     * Fix a single page
     */
    fixPage(filePath, issues) {
        const relativePath = path.relative(this.baseDir, filePath);

        try {
            let content = fs.readFileSync(filePath, 'utf-8');
            const appliedFixes = [];

            // Calculate relative path depth
            const depth = relativePath.split(/[\\/]/).length - 1;
            const upPath = '../'.repeat(depth);

            // Fix 1: Add Firebase SDK
            if (issues.includes('Missing Firebase SDK')) {
                const firebaseSnippet = `
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="${upPath}js/firebase-init.js"></script>`;

                content = content.replace('</head>', firebaseSnippet + '\n</head>');
                appliedFixes.push('Firebase SDK');
            }

            // Fix 2: Add Theme System
            if (issues.includes('Missing theme system')) {
                const themeSnippet = `
    <!-- Theme System -->
    <link rel="stylesheet" href="${upPath}themes/theme-base.css">
    <link rel="stylesheet" href="${upPath}css/mythology-colors.css">`;

                content = content.replace('</head>', themeSnippet + '\n</head>');
                appliedFixes.push('Theme system');
            }

            // Fix 3: Add Responsive Grid CSS
            if (issues.includes('Missing responsive grid CSS')) {
                const gridSnippet = `
    <!-- Universal Grid System -->
    <link rel="stylesheet" href="${upPath}css/universal-grid.css">`;

                content = content.replace('</head>', gridSnippet + '\n</head>');
                appliedFixes.push('Responsive grid CSS');
            }

            // Write changes
            fs.writeFileSync(filePath, content, 'utf-8');

            return appliedFixes;

        } catch (error) {
            throw new Error(`Failed to fix ${relativePath}: ${error.message}`);
        }
    }

    /**
     * Run site-wide fix
     */
    async run() {
        console.log('='.repeat(80));
        console.log('SITE-WIDE INDEX PAGE FIX');
        console.log('='.repeat(80));

        console.log('\n🔍 Scanning for all index.html pages...');
        const allPages = this.findAllIndexPages();
        console.log(`Found ${allPages.length} index pages`);

        console.log('\n📋 Checking and fixing pages...\n');

        for (const pagePath of allPages) {
            const relativePath = path.relative(this.baseDir, pagePath);
            this.results.scanned++;

            const issues = this.checkPage(pagePath);

            if (issues.length === 0) {
                this.results.alreadyGood++;
                console.log(`✅ ${relativePath}`);
            } else {
                try {
                    const fixes = this.fixPage(pagePath, issues);
                    this.results.fixed++;
                    this.results.details.push({
                        path: relativePath,
                        fixes: fixes
                    });
                    console.log(`🔧 ${relativePath} - Fixed: ${fixes.join(', ')}`);
                } catch (error) {
                    this.results.failed++;
                    console.error(`❌ ${relativePath} - ${error.message}`);
                }
            }
        }

        this.generateReport();
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('SITE-WIDE FIX REPORT');
        console.log('='.repeat(80));

        console.log(`\nTotal Pages Scanned: ${this.results.scanned}`);
        console.log(`✅ Already Compliant: ${this.results.alreadyGood}`);
        console.log(`🔧 Fixed: ${this.results.fixed}`);
        console.log(`❌ Failed: ${this.results.failed}`);

        const complianceRate = ((this.results.alreadyGood + this.results.fixed) / this.results.scanned * 100).toFixed(1);
        console.log(`\n📊 Compliance Rate: ${complianceRate}%`);

        if (this.results.details.length > 0) {
            console.log(`\n📝 Fixed ${this.results.details.length} pages:`);

            // Group by fix type
            const byFix = {};
            this.results.details.forEach(detail => {
                detail.fixes.forEach(fix => {
                    if (!byFix[fix]) byFix[fix] = 0;
                    byFix[fix]++;
                });
            });

            console.log('\nFixes Applied:');
            Object.entries(byFix).forEach(([fix, count]) => {
                console.log(`  • ${fix}: ${count} pages`);
            });
        }

        // Save detailed report
        const reportPath = path.join(this.baseDir, 'SITE_WIDE_FIX_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2), 'utf-8');
        console.log(`\n📄 Detailed report saved to: SITE_WIDE_FIX_REPORT.json`);

        console.log('\n' + '='.repeat(80) + '\n');
    }
}

// Run if executed directly
if (require.main === module) {
    const fixer = new SiteWideFixer();
    fixer.run().catch(console.error);
}

module.exports = SiteWideFixer;
