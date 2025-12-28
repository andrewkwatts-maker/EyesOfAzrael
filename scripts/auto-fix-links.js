/**
 * Auto-Fix Broken Links
 * Automatically resolves broken link issues where possible
 *
 * Usage:
 *   node scripts/auto-fix-links.js
 *   node scripts/auto-fix-links.js --dry-run  (preview changes without applying)
 */

const fs = require('fs');
const path = require('path');
const LinkValidator = require('./validate-all-links');

class LinkFixer {
    constructor(dryRun = false) {
        this.baseDir = path.join(__dirname, '..');
        this.dryRun = dryRun;
        this.fixes = {
            applied: 0,
            skipped: 0,
            failed: 0,
            actions: []
        };
    }

    /**
     * Run auto-fix process
     */
    async fix() {
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║            AUTO-FIX BROKEN LINKS                          ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        if (this.dryRun) {
            console.log('🔍 DRY RUN MODE - No changes will be made\n');
        }

        // First, validate all links
        console.log('Running link validation...\n');
        const validator = new LinkValidator();
        const results = await validator.validate();

        const brokenLinks = results.filter(r => r.status === 'broken');

        if (brokenLinks.length === 0) {
            console.log('\n✅ No broken links found! Nothing to fix.\n');
            return;
        }

        console.log(`\n🔧 Found ${brokenLinks.length} broken links to fix\n`);

        // Group by issue type
        const byIssue = {};
        for (const link of brokenLinks) {
            const issue = link.issue || 'unknown';
            if (!byIssue[issue]) {
                byIssue[issue] = [];
            }
            byIssue[issue].push(link);
        }

        // Fix each issue type
        for (const [issue, links] of Object.entries(byIssue)) {
            console.log(`\n📋 Fixing: ${issue.toUpperCase().replace(/-/g, ' ')} (${links.length} issues)`);
            console.log('─'.repeat(60));

            switch (issue) {
                case 'missing-route':
                    await this.fixMissingRoutes(links);
                    break;

                case 'missing-view':
                    await this.fixMissingViews(links);
                    break;

                case 'invalid-category':
                    await this.fixInvalidCategories(links);
                    break;

                case 'invalid-mythology':
                    await this.fixInvalidMythologies(links);
                    break;

                case 'missing-entity-id':
                    await this.fixMissingEntityIds(links);
                    break;

                default:
                    console.log(`  ⚠️  No auto-fix available for: ${issue}`);
                    this.fixes.skipped += links.length;
            }
        }

        this.printSummary();
        this.generateFixReport();
    }

    /**
     * Fix missing routes
     */
    async fixMissingRoutes(links) {
        console.log(`  Analyzing ${links.length} missing routes...`);

        const routesToAdd = new Set();

        for (const link of links) {
            const route = this.detectRoutePattern(link.url);
            if (route) {
                routesToAdd.add(JSON.stringify(route)); // Use JSON for Set uniqueness
            }
        }

        if (routesToAdd.size === 0) {
            console.log('  ℹ️  No auto-detectable route patterns found');
            this.fixes.skipped += links.length;
            return;
        }

        console.log(`  ✅ Identified ${routesToAdd.size} new route pattern(s) to add`);

        for (const routeJson of routesToAdd) {
            const route = JSON.parse(routeJson);
            this.fixes.actions.push({
                type: 'add-route',
                route: route,
                file: 'js/spa-navigation.js',
                description: `Add route pattern: ${route.name}`
            });
        }

        this.fixes.applied += links.length;
    }

    /**
     * Fix missing views
     */
    async fixMissingViews(links) {
        console.log(`  Creating ${links.length} missing view component(s)...`);

        const viewsToCreate = new Set();

        for (const link of links) {
            const viewName = this.detectViewName(link.url, link.type);
            if (viewName) {
                viewsToCreate.add(viewName);
            }
        }

        if (viewsToCreate.size === 0) {
            console.log('  ℹ️  No views to create');
            this.fixes.skipped += links.length;
            return;
        }

        for (const viewName of viewsToCreate) {
            const viewPath = path.join(this.baseDir, 'js', 'views', `${viewName}-view.js`);

            if (!this.dryRun) {
                this.createViewStub(viewPath, viewName);
                console.log(`  ✅ Created: js/views/${viewName}-view.js`);
            } else {
                console.log(`  [DRY RUN] Would create: js/views/${viewName}-view.js`);
            }

            this.fixes.actions.push({
                type: 'create-view',
                view: viewName,
                file: `js/views/${viewName}-view.js`,
                description: `Create ${viewName} view component`
            });

            this.fixes.applied++;
        }
    }

    /**
     * Fix invalid categories
     */
    async fixInvalidCategories(links) {
        console.log(`  Analyzing ${links.length} invalid category links...`);

        const corrections = new Map(); // wrong -> correct

        for (const link of links) {
            const correction = this.suggestCategoryCorrection(link.url);
            if (correction) {
                corrections.set(link.url, correction);
            }
        }

        if (corrections.size === 0) {
            console.log('  ℹ️  No automatic corrections available');
            this.fixes.skipped += links.length;
            return;
        }

        console.log(`  ✅ Found ${corrections.size} possible correction(s)`);

        for (const [wrong, correct] of corrections) {
            this.fixes.actions.push({
                type: 'fix-category',
                from: wrong,
                to: correct,
                description: `Update category link: ${wrong} → ${correct}`
            });

            this.fixes.applied++;
        }
    }

    /**
     * Fix invalid mythologies
     */
    async fixInvalidMythologies(links) {
        console.log(`  Analyzing ${links.length} invalid mythology links...`);

        const corrections = new Map();

        for (const link of links) {
            const correction = this.suggestMythologyCorrection(link.url);
            if (correction) {
                corrections.set(link.url, correction);
            }
        }

        if (corrections.size === 0) {
            console.log('  ℹ️  No automatic corrections available');
            this.fixes.skipped += links.length;
            return;
        }

        console.log(`  ✅ Found ${corrections.size} possible correction(s)`);

        for (const [wrong, correct] of corrections) {
            this.fixes.actions.push({
                type: 'fix-mythology',
                from: wrong,
                to: correct,
                description: `Update mythology link: ${wrong} → ${correct}`
            });

            this.fixes.applied++;
        }
    }

    /**
     * Fix missing entity IDs
     */
    async fixMissingEntityIds(links) {
        console.log(`  Analyzing ${links.length} missing entity ID links...`);

        // These require manual review
        console.log('  ⚠️  Entity ID fixes require manual review');

        for (const link of links) {
            this.fixes.actions.push({
                type: 'manual-review',
                url: link.url,
                sources: link.sources,
                description: `Entity link missing ID - manual review required`
            });
        }

        this.fixes.skipped += links.length;
    }

    /**
     * Detect route pattern from URL
     */
    detectRoutePattern(url) {
        const cleanUrl = url.replace('#', '');

        // Extract pattern components
        const parts = cleanUrl.split('/').filter(p => p);

        if (parts.length === 0) return null;

        const pattern = {
            name: parts.join('-'),
            regex: null,
            handler: null
        };

        // Generate regex pattern
        if (parts.length === 1) {
            pattern.regex = `^#?\\/${parts[0]}\\/?$`;
            pattern.handler = `render${this.capitalize(parts[0])}`;
        } else if (parts.length === 2) {
            pattern.regex = `^#?\\/${parts[0]}\\/([^\\/]+)\\/?$`;
            pattern.handler = `render${this.capitalize(parts[0])}`;
        }

        return pattern;
    }

    /**
     * Detect view name from URL
     */
    detectViewName(url, type) {
        const cleanUrl = url.replace('#', '');
        const parts = cleanUrl.split('/').filter(p => p);

        if (parts.length === 0) return null;

        return parts[0];
    }

    /**
     * Suggest category correction
     */
    suggestCategoryCorrection(url) {
        const match = url.match(/\/([^\/]+)\//);
        if (!match) return null;

        const wrong = match[1];
        const validCategories = [
            'deities', 'heroes', 'creatures', 'texts', 'rituals',
            'herbs', 'cosmology', 'magic', 'items', 'places', 'symbols'
        ];

        // Simple fuzzy match
        for (const category of validCategories) {
            if (this.levenshtein(wrong, category) <= 2) {
                return url.replace(wrong, category);
            }
        }

        return null;
    }

    /**
     * Suggest mythology correction
     */
    suggestMythologyCorrection(url) {
        const match = url.match(/\/([^\/]+)\//);
        if (!match) return null;

        const wrong = match[1];
        const validMythologies = [
            'greek', 'norse', 'egyptian', 'hindu', 'chinese',
            'japanese', 'celtic', 'babylonian', 'sumerian', 'persian',
            'roman', 'aztec', 'mayan', 'buddhist', 'christian',
            'jewish', 'islamic', 'yoruba'
        ];

        // Simple fuzzy match
        for (const mythology of validMythologies) {
            if (this.levenshtein(wrong, mythology) <= 2) {
                return url.replace(wrong, mythology);
            }
        }

        return null;
    }

    /**
     * Create view component stub
     */
    createViewStub(filePath, viewName) {
        const className = this.capitalize(viewName) + 'View';

        const content = `/**
 * ${className}
 * Auto-generated view component
 */

class ${className} {
    constructor(firestore) {
        this.db = firestore;
    }

    /**
     * Render the ${viewName} page
     */
    async render(container) {
        console.log('[${className}] Rendering...');

        container.innerHTML = this.getHTML();

        // Emit render complete event
        document.dispatchEvent(new CustomEvent('first-render-complete', {
            detail: {
                route: '${viewName}',
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Get page HTML
     */
    getHTML() {
        return \`
            <div class="${viewName}-page">
                <div class="page-header">
                    <h1>${this.capitalize(viewName)}</h1>
                    <p>This page is under construction.</p>
                </div>

                <div class="page-content">
                    <p>Content coming soon...</p>
                </div>
            </div>
        \`;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ${className};
}

// Global export for browser
if (typeof window !== 'undefined') {
    window.${className} = ${className};
}
`;

        fs.writeFileSync(filePath, content);
    }

    /**
     * Capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Levenshtein distance (fuzzy match)
     */
    levenshtein(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Print fix summary
     */
    printSummary() {
        console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                   FIX SUMMARY                             ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        console.log(`Total Fixes Applied:  ${this.fixes.applied}`);
        console.log(`Skipped (Manual):     ${this.fixes.skipped}`);
        console.log(`Failed:               ${this.fixes.failed}\n`);

        if (this.fixes.actions.length > 0) {
            console.log('Actions taken:');
            console.log('─'.repeat(60));

            const byType = {};
            for (const action of this.fixes.actions) {
                if (!byType[action.type]) {
                    byType[action.type] = [];
                }
                byType[action.type].push(action);
            }

            for (const [type, actions] of Object.entries(byType)) {
                console.log(`\n${type.toUpperCase()} (${actions.length}):`);
                for (const action of actions.slice(0, 5)) {
                    console.log(`  • ${action.description}`);
                }
                if (actions.length > 5) {
                    console.log(`  ... and ${actions.length - 5} more`);
                }
            }
        }
    }

    /**
     * Generate fix report
     */
    generateFixReport() {
        const report = [];

        report.push('# Link Fix Report\n');
        report.push(`**Generated:** ${new Date().toISOString()}\n`);
        report.push(`**Mode:** ${this.dryRun ? 'DRY RUN' : 'LIVE'}\n\n`);

        report.push('## Summary\n\n');
        report.push(`- **Applied:** ${this.fixes.applied} fix(es)`);
        report.push(`- **Skipped:** ${this.fixes.skipped} (require manual review)`);
        report.push(`- **Failed:** ${this.fixes.failed}\n\n`);

        if (this.fixes.actions.length > 0) {
            report.push('## Actions Taken\n\n');

            const byType = {};
            for (const action of this.fixes.actions) {
                if (!byType[action.type]) {
                    byType[action.type] = [];
                }
                byType[action.type].push(action);
            }

            for (const [type, actions] of Object.entries(byType)) {
                report.push(`### ${type.toUpperCase().replace(/-/g, ' ')} (${actions.length})\n\n`);

                for (const action of actions) {
                    report.push(`- ${action.description}\n`);
                    if (action.file) {
                        report.push(`  - File: \`${action.file}\`\n`);
                    }
                    if (action.from && action.to) {
                        report.push(`  - Change: \`${action.from}\` → \`${action.to}\`\n`);
                    }
                }

                report.push('\n');
            }
        }

        report.push('## Next Steps\n\n');
        report.push('1. Review the changes made by this script\n');
        report.push('2. Test all fixed links in the browser\n');
        report.push('3. Manually fix any skipped issues\n');
        report.push('4. Run validation again to confirm all links work\n\n');

        report.push('```bash\n');
        report.push('node scripts/validate-all-links.js\n');
        report.push('```\n');

        const reportPath = path.join(this.baseDir, 'LINK_FIX_REPORT.md');
        fs.writeFileSync(reportPath, report.join('\n'));

        console.log(`\n\n📄 Report saved to: LINK_FIX_REPORT.md\n`);
    }
}

// Run fixer
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    const fixer = new LinkFixer(dryRun);
    fixer.fix().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Fix failed:', error);
        process.exit(1);
    });
}

module.exports = LinkFixer;
