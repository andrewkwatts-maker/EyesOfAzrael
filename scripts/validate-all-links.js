/**
 * Comprehensive Link Validator
 * Crawls the entire SPA, extracts all links, and validates them
 *
 * Usage:
 *   node scripts/validate-all-links.js
 *   node scripts/validate-all-links.js --fix  (auto-fix broken links)
 */

const fs = require('fs');
const path = require('path');

class LinkValidator {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.links = new Map(); // url -> metadata
        this.results = {
            total: 0,
            ok: 0,
            broken: 0,
            comingSoon: 0,
            errors: []
        };

        // Route patterns from spa-navigation.js
        this.routes = {
            home: /^#?\/?$/,
            mythologies: /^#?\/mythologies\/?$/,
            browse_category: /^#?\/browse\/([^\/]+)\/?$/,
            browse_category_mythology: /^#?\/browse\/([^\/]+)\/([^\/]+)\/?$/,
            mythology: /^#?\/mythology\/([^\/]+)\/?$/,
            entity: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
            entity_alt: /^#?\/entity\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
            category: /^#?\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
            search: /^#?\/search\/?$/,
            compare: /^#?\/compare\/?$/,
            dashboard: /^#?\/dashboard\/?$/,
            about: /^#?\/about\/?$/,
            privacy: /^#?\/privacy\/?$/,
            terms: /^#?\/terms\/?$/,
            archetypes: /^#?\/archetypes\/?$/,
            magic: /^#?\/magic\/?$/,
        };

        // Valid categories
        this.categories = [
            'deities', 'heroes', 'creatures', 'texts', 'rituals',
            'herbs', 'cosmology', 'magic', 'items', 'places', 'symbols'
        ];

        // Valid mythologies
        this.mythologies = [
            'greek', 'norse', 'egyptian', 'hindu', 'chinese',
            'japanese', 'celtic', 'babylonian', 'sumerian', 'persian',
            'roman', 'aztec', 'mayan', 'buddhist', 'christian',
            'jewish', 'islamic', 'yoruba', 'native_american', 'apocryphal'
        ];
    }

    /**
     * Extract all links from HTML files
     */
    async extractLinks() {
        console.log('🔍 Extracting links from HTML files...\n');

        const htmlFiles = this.findHtmlFiles(this.baseDir);
        let linkCount = 0;

        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const links = this.extractLinksFromContent(content, file);

            for (const link of links) {
                if (!this.links.has(link.url)) {
                    this.links.set(link.url, {
                        url: link.url,
                        sources: [link.source],
                        type: this.detectLinkType(link.url)
                    });
                } else {
                    this.links.get(link.url).sources.push(link.source);
                }
                linkCount++;
            }
        }

        console.log(`✅ Found ${linkCount} total links (${this.links.size} unique)\n`);
        return Array.from(this.links.values());
    }

    /**
     * Find all HTML files (excluding node_modules, dist, BACKUP)
     */
    findHtmlFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Skip excluded directories
                if (['node_modules', 'dist', 'BACKUP_PRE_MIGRATION', 'FIREBASE'].includes(file)) {
                    continue;
                }
                this.findHtmlFiles(filePath, fileList);
            } else if (file.endsWith('.html')) {
                fileList.push(filePath);
            }
        }

        return fileList;
    }

    /**
     * Extract links from HTML content
     */
    extractLinksFromContent(content, sourceFile) {
        const links = [];

        // Extract href attributes
        const hrefRegex = /href=["']([^"']+)["']/g;
        let match;

        while ((match = hrefRegex.exec(content)) !== null) {
            const url = match[1];

            // Only process internal hash routes
            if (url.startsWith('#/') || url.startsWith('#')) {
                links.push({
                    url: url,
                    source: path.relative(this.baseDir, sourceFile)
                });
            }
        }

        return links;
    }

    /**
     * Detect link type
     */
    detectLinkType(url) {
        const cleanUrl = url.replace('#', '');

        if (this.routes.home.test(cleanUrl)) return 'home';
        if (this.routes.mythologies.test(cleanUrl)) return 'mythologies';
        if (this.routes.browse_category_mythology.test(cleanUrl)) return 'browse-category-mythology';
        if (this.routes.browse_category.test(cleanUrl)) return 'browse-category';
        if (this.routes.entity_alt.test(cleanUrl)) return 'entity-alt';
        if (this.routes.entity.test(cleanUrl)) return 'entity';
        if (this.routes.category.test(cleanUrl)) return 'category';
        if (this.routes.mythology.test(cleanUrl)) return 'mythology';
        if (this.routes.search.test(cleanUrl)) return 'search';
        if (this.routes.compare.test(cleanUrl)) return 'compare';
        if (this.routes.dashboard.test(cleanUrl)) return 'dashboard';
        if (this.routes.about.test(cleanUrl)) return 'about';
        if (this.routes.privacy.test(cleanUrl)) return 'privacy';
        if (this.routes.terms.test(cleanUrl)) return 'terms';
        if (this.routes.archetypes.test(cleanUrl)) return 'archetypes';
        if (this.routes.magic.test(cleanUrl)) return 'magic';

        return 'unknown';
    }

    /**
     * Validate a single link
     */
    async validateLink(linkData) {
        const { url, type } = linkData;
        const cleanUrl = url.replace('#', '');

        const result = {
            url,
            type,
            status: 'unknown',
            issue: null,
            recommendation: null,
            priority: 'low'
        };

        // Check if route pattern exists
        if (type === 'unknown') {
            result.status = 'broken';
            result.issue = 'missing-route';
            result.recommendation = 'Add route pattern to spa-navigation.js';
            result.priority = 'critical';
            return result;
        }

        // Validate based on type
        switch (type) {
            case 'home':
            case 'mythologies':
            case 'search':
            case 'compare':
            case 'dashboard':
            case 'about':
            case 'privacy':
            case 'terms':
                // Static routes - always OK if router handles them
                result.status = 'ok';
                break;

            case 'browse-category':
                result.status = await this.validateBrowseCategory(cleanUrl);
                break;

            case 'browse-category-mythology':
                result.status = await this.validateBrowseCategoryMythology(cleanUrl);
                break;

            case 'mythology':
                result.status = await this.validateMythology(cleanUrl);
                break;

            case 'category':
                result.status = await this.validateCategory(cleanUrl);
                break;

            case 'entity':
            case 'entity-alt':
                result.status = await this.validateEntity(cleanUrl, type);
                break;

            case 'archetypes':
            case 'magic':
                result.status = await this.validateSpecialPage(cleanUrl, type);
                break;

            default:
                result.status = 'unknown';
                result.issue = 'unhandled-type';
                result.recommendation = `Add validation for type: ${type}`;
                result.priority = 'medium';
        }

        return result;
    }

    /**
     * Validate browse category route
     */
    async validateBrowseCategory(url) {
        const match = url.match(this.routes.browse_category);
        if (!match) return { status: 'broken', issue: 'invalid-format' };

        const category = match[1];

        if (!this.categories.includes(category)) {
            return {
                status: 'broken',
                issue: 'invalid-category',
                recommendation: `Valid categories: ${this.categories.join(', ')}`,
                priority: 'high'
            };
        }

        return { status: 'ok' };
    }

    /**
     * Validate browse category + mythology route
     */
    async validateBrowseCategoryMythology(url) {
        const match = url.match(this.routes.browse_category_mythology);
        if (!match) return { status: 'broken', issue: 'invalid-format' };

        const [_, category, mythology] = match;

        if (!this.categories.includes(category)) {
            return {
                status: 'broken',
                issue: 'invalid-category',
                recommendation: `Valid categories: ${this.categories.join(', ')}`,
                priority: 'high'
            };
        }

        if (!this.mythologies.includes(mythology)) {
            return {
                status: 'broken',
                issue: 'invalid-mythology',
                recommendation: `Valid mythologies: ${this.mythologies.join(', ')}`,
                priority: 'high'
            };
        }

        return { status: 'ok' };
    }

    /**
     * Validate mythology route
     */
    async validateMythology(url) {
        const match = url.match(this.routes.mythology);
        if (!match) return { status: 'broken', issue: 'invalid-format' };

        const mythology = match[1];

        if (!this.mythologies.includes(mythology)) {
            return {
                status: 'broken',
                issue: 'invalid-mythology',
                recommendation: `Valid mythologies: ${this.mythologies.join(', ')}`,
                priority: 'high'
            };
        }

        return { status: 'ok' };
    }

    /**
     * Validate category route
     */
    async validateCategory(url) {
        const match = url.match(this.routes.category);
        if (!match) return { status: 'broken', issue: 'invalid-format' };

        const [_, mythology, category] = match;

        if (!this.mythologies.includes(mythology)) {
            return {
                status: 'broken',
                issue: 'invalid-mythology',
                recommendation: `Valid mythologies: ${this.mythologies.join(', ')}`,
                priority: 'high'
            };
        }

        if (!this.categories.includes(category)) {
            return {
                status: 'broken',
                issue: 'invalid-category',
                recommendation: `Valid categories: ${this.categories.join(', ')}`,
                priority: 'high'
            };
        }

        return { status: 'ok' };
    }

    /**
     * Validate entity route
     */
    async validateEntity(url, type) {
        const regex = type === 'entity-alt' ? this.routes.entity_alt : this.routes.entity;
        const match = url.match(regex);

        if (!match) return { status: 'broken', issue: 'invalid-format' };

        // For entity-alt: match[1]=category, match[2]=mythology, match[3]=entityId
        // For entity: match[1]=mythology, match[2]=category, match[3]=entityId
        const mythology = type === 'entity-alt' ? match[2] : match[1];
        const category = type === 'entity-alt' ? match[1] : match[2];
        const entityId = match[3];

        if (!this.mythologies.includes(mythology)) {
            return {
                status: 'broken',
                issue: 'invalid-mythology',
                recommendation: `Valid mythologies: ${this.mythologies.join(', ')}`,
                priority: 'high'
            };
        }

        if (!this.categories.includes(category)) {
            return {
                status: 'broken',
                issue: 'invalid-category',
                recommendation: `Valid categories: ${this.categories.join(', ')}`,
                priority: 'high'
            };
        }

        // Entity ID validation would require Firebase connection
        // For now, just check format
        if (!entityId || entityId.length === 0) {
            return {
                status: 'broken',
                issue: 'missing-entity-id',
                priority: 'critical'
            };
        }

        return {
            status: 'ok',
            note: 'Entity existence not verified (requires Firebase)'
        };
    }

    /**
     * Validate special pages (archetypes, magic)
     */
    async validateSpecialPage(url, type) {
        // Check if corresponding view component exists
        const viewFile = path.join(this.baseDir, 'js', 'views', `${type}-view.js`);

        if (!fs.existsSync(viewFile)) {
            return {
                status: 'broken',
                issue: 'missing-view',
                recommendation: `Create ${type}-view.js component`,
                priority: 'high'
            };
        }

        return { status: 'ok' };
    }

    /**
     * Run complete validation
     */
    async validate() {
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║       COMPREHENSIVE LINK VALIDATION REPORT               ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        const links = await this.extractLinks();

        console.log('🔍 Validating links...\n');

        const validationResults = [];

        for (const linkData of links) {
            const result = await this.validateLink(linkData);

            if (typeof result.status === 'object') {
                // Merge status object into result
                Object.assign(result, result.status);
            }

            result.sources = linkData.sources;
            validationResults.push(result);

            this.results.total++;

            if (result.status === 'ok') {
                this.results.ok++;
            } else if (result.status === 'broken') {
                this.results.broken++;
                this.results.errors.push(result);
            } else if (result.status === 'coming-soon') {
                this.results.comingSoon++;
            }
        }

        this.printResults(validationResults);
        this.generateReports(validationResults);

        return validationResults;
    }

    /**
     * Print validation results
     */
    printResults(results) {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                    SUMMARY                                ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        console.log(`Total Links:      ${this.results.total}`);
        console.log(`✅ OK:            ${this.results.ok} (${((this.results.ok / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`❌ Broken:        ${this.results.broken} (${((this.results.broken / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`⏳ Coming Soon:   ${this.results.comingSoon}`);

        if (this.results.broken > 0) {
            console.log('\n╔═══════════════════════════════════════════════════════════╗');
            console.log('║                  BROKEN LINKS                             ║');
            console.log('╚═══════════════════════════════════════════════════════════╝\n');

            // Group by issue type
            const byIssue = {};
            for (const error of this.results.errors) {
                const issue = error.issue || 'unknown';
                if (!byIssue[issue]) {
                    byIssue[issue] = [];
                }
                byIssue[issue].push(error);
            }

            for (const [issue, errors] of Object.entries(byIssue)) {
                console.log(`\n📋 ${issue.toUpperCase().replace(/-/g, ' ')} (${errors.length} issues):`);
                console.log('─'.repeat(60));

                for (const error of errors.slice(0, 5)) { // Show first 5
                    console.log(`\n  URL: ${error.url}`);
                    console.log(`  Type: ${error.type}`);
                    console.log(`  Priority: ${error.priority || 'medium'}`);
                    if (error.recommendation) {
                        console.log(`  Fix: ${error.recommendation}`);
                    }
                    console.log(`  Found in: ${error.sources.slice(0, 3).join(', ')}${error.sources.length > 3 ? ` (+${error.sources.length - 3} more)` : ''}`);
                }

                if (errors.length > 5) {
                    console.log(`\n  ... and ${errors.length - 5} more`);
                }
            }
        }
    }

    /**
     * Generate markdown reports
     */
    generateReports(results) {
        console.log('\n\n📄 Generating reports...\n');

        // Generate comprehensive report
        this.generateComprehensiveReport(results);

        // Generate quick fix summary
        this.generateQuickFixSummary(results);

        console.log('✅ Reports generated successfully!\n');
    }

    /**
     * Generate comprehensive report
     */
    generateComprehensiveReport(results) {
        const report = [];

        report.push('# Comprehensive Link Validation Report\n');
        report.push(`**Generated:** ${new Date().toISOString()}\n`);
        report.push(`**Total Links:** ${this.results.total}\n`);
        report.push(`**Unique URLs:** ${this.links.size}\n\n`);

        report.push('## Summary\n');
        report.push('| Status | Count | Percentage |');
        report.push('|--------|-------|------------|');
        report.push(`| ✅ OK | ${this.results.ok} | ${((this.results.ok / this.results.total) * 100).toFixed(1)}% |`);
        report.push(`| ❌ Broken | ${this.results.broken} | ${((this.results.broken / this.results.total) * 100).toFixed(1)}% |`);
        report.push(`| ⏳ Coming Soon | ${this.results.comingSoon} | ${((this.results.comingSoon / this.results.total) * 100).toFixed(1)}% |`);
        report.push('\n');

        if (this.results.broken > 0) {
            report.push('## Broken Links by Category\n');

            const byIssue = {};
            for (const error of this.results.errors) {
                const issue = error.issue || 'unknown';
                if (!byIssue[issue]) {
                    byIssue[issue] = [];
                }
                byIssue[issue].push(error);
            }

            for (const [issue, errors] of Object.entries(byIssue)) {
                report.push(`\n### ${issue.replace(/-/g, ' ').toUpperCase()} (${errors.length} issues)\n`);

                report.push('| URL | Type | Priority | Sources | Fix |');
                report.push('|-----|------|----------|---------|-----|');

                for (const error of errors) {
                    const sources = error.sources.length > 2
                        ? `${error.sources.slice(0, 2).join(', ')} (+${error.sources.length - 2})`
                        : error.sources.join(', ');

                    report.push(`| \`${error.url}\` | ${error.type} | ${error.priority || 'medium'} | ${sources} | ${error.recommendation || 'N/A'} |`);
                }

                report.push('\n');
            }
        }

        report.push('## Link Type Distribution\n');

        const byType = {};
        for (const result of results) {
            if (!byType[result.type]) {
                byType[result.type] = { total: 0, ok: 0, broken: 0 };
            }
            byType[result.type].total++;
            if (result.status === 'ok') byType[result.type].ok++;
            if (result.status === 'broken') byType[result.type].broken++;
        }

        report.push('| Type | Total | OK | Broken |');
        report.push('|------|-------|-----|--------|');

        for (const [type, stats] of Object.entries(byType)) {
            report.push(`| ${type} | ${stats.total} | ${stats.ok} | ${stats.broken} |`);
        }

        report.push('\n');

        fs.writeFileSync(
            path.join(this.baseDir, 'COMPREHENSIVE_LINK_VALIDATION.md'),
            report.join('\n')
        );

        console.log('  ✅ COMPREHENSIVE_LINK_VALIDATION.md');
    }

    /**
     * Generate quick fix summary
     */
    generateQuickFixSummary(results) {
        const summary = [];

        summary.push('# Quick Fix Summary\n');
        summary.push(`**Generated:** ${new Date().toISOString()}\n\n`);

        summary.push('## Immediate Actions Required\n\n');

        // Critical issues
        const critical = this.results.errors.filter(e => e.priority === 'critical');
        if (critical.length > 0) {
            summary.push(`### 🔴 CRITICAL (${critical.length} issues)\n`);
            summary.push('**Fix immediately - site is broken**\n\n');

            for (const error of critical) {
                summary.push(`- [ ] **${error.url}**`);
                summary.push(`  - Issue: ${error.issue}`);
                summary.push(`  - Fix: ${error.recommendation || 'Manual review required'}`);
                summary.push(`  - Found in: ${error.sources.length} file(s)\n`);
            }
        }

        // High priority
        const high = this.results.errors.filter(e => e.priority === 'high');
        if (high.length > 0) {
            summary.push(`\n### 🟠 HIGH PRIORITY (${high.length} issues)\n`);
            summary.push('**Fix this week**\n\n');

            for (const error of high.slice(0, 10)) {
                summary.push(`- [ ] **${error.url}**`);
                summary.push(`  - Issue: ${error.issue}`);
                summary.push(`  - Fix: ${error.recommendation || 'Manual review required'}\n`);
            }

            if (high.length > 10) {
                summary.push(`\n*... and ${high.length - 10} more high priority issues*\n`);
            }
        }

        // Medium priority
        const medium = this.results.errors.filter(e => e.priority === 'medium');
        if (medium.length > 0) {
            summary.push(`\n### 🟡 MEDIUM PRIORITY (${medium.length} issues)\n`);
            summary.push('**Fix this month**\n\n');

            for (const error of medium.slice(0, 5)) {
                summary.push(`- [ ] ${error.url} - ${error.issue}\n`);
            }

            if (medium.length > 5) {
                summary.push(`\n*... and ${medium.length - 5} more medium priority issues*\n`);
            }
        }

        summary.push('\n## Auto-Fix Available\n\n');
        summary.push('Run the auto-fix script to automatically resolve some issues:\n\n');
        summary.push('```bash\n');
        summary.push('node scripts/fix-broken-links.js\n');
        summary.push('```\n\n');

        summary.push('This will:\n');
        summary.push('- Create missing Firebase page stubs\n');
        summary.push('- Add missing routes to spa-navigation.js\n');
        summary.push('- Create fallback view components\n');
        summary.push('- Update link references where possible\n');

        fs.writeFileSync(
            path.join(this.baseDir, 'QUICK_FIX_SUMMARY.md'),
            summary.join('\n')
        );

        console.log('  ✅ QUICK_FIX_SUMMARY.md');
    }
}

// Run validation
if (require.main === module) {
    const validator = new LinkValidator();
    validator.validate().then(() => {
        process.exit(validator.results.broken > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = LinkValidator;
