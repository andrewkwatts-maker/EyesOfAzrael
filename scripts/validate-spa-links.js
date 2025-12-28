/**
 * SPA Link Validator (Improved)
 * Validates only SPA navigation links (excludes page anchors)
 *
 * Usage:
 *   node scripts/validate-spa-links.js
 */

const fs = require('fs');
const path = require('path');

class SPALinkValidator {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.links = new Map();
        this.results = {
            total: 0,
            ok: 0,
            broken: 0,
            warnings: 0,
            errors: []
        };

        // SPA route patterns (from spa-navigation.js)
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

        this.categories = [
            'deities', 'heroes', 'creatures', 'texts', 'rituals',
            'herbs', 'cosmology', 'magic', 'items', 'places', 'symbols'
        ];

        this.mythologies = [
            'greek', 'norse', 'egyptian', 'hindu', 'chinese',
            'japanese', 'celtic', 'babylonian', 'sumerian', 'persian',
            'roman', 'aztec', 'mayan', 'buddhist', 'christian',
            'jewish', 'islamic', 'yoruba', 'native_american', 'apocryphal'
        ];
    }

    /**
     * Check if link is a page anchor (not SPA route)
     */
    isPageAnchor(url) {
        // Page anchors: #section-id, #L123 (code line numbers), etc.
        // NOT SPA routes: #/, #/search, #/mythology/greek/deities/zeus
        return url.startsWith('#') && !url.includes('/');
    }

    /**
     * Extract all SPA navigation links
     */
    async extractLinks() {
        console.log('🔍 Extracting SPA navigation links from HTML files...\n');

        const htmlFiles = this.findHtmlFiles(this.baseDir);
        let linkCount = 0;
        let anchorCount = 0;

        for (const file of htmlFiles) {
            // Skip coverage, dist, and other generated files
            const relativePath = path.relative(this.baseDir, file);
            if (relativePath.includes('coverage') ||
                relativePath.includes('node_modules') ||
                relativePath.includes('dist')) {
                continue;
            }

            const content = fs.readFileSync(file, 'utf-8');
            const links = this.extractLinksFromContent(content, file);

            for (const link of links) {
                // Skip page anchors
                if (this.isPageAnchor(link.url)) {
                    anchorCount++;
                    continue;
                }

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

        console.log(`✅ Found ${linkCount} SPA navigation links (${this.links.size} unique)`);
        console.log(`ℹ️  Skipped ${anchorCount} page anchors (not SPA routes)\n`);

        return Array.from(this.links.values());
    }

    /**
     * Find HTML files
     */
    findHtmlFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                if (['node_modules', 'dist', 'BACKUP_PRE_MIGRATION', 'FIREBASE', 'coverage'].includes(file)) {
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
     * Extract links from content
     */
    extractLinksFromContent(content, sourceFile) {
        const links = [];
        const hrefRegex = /href=["']([^"']+)["']/g;
        let match;

        while ((match = hrefRegex.exec(content)) !== null) {
            const url = match[1];

            // Only process hash routes
            if (url.startsWith('#')) {
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
     * Validate a link
     */
    async validateLink(linkData) {
        const { url, type } = linkData;
        const cleanUrl = url.replace('#', '');

        const result = {
            url,
            type,
            status: 'ok',
            issue: null,
            recommendation: null,
            priority: 'low'
        };

        if (type === 'unknown') {
            result.status = 'broken';
            result.issue = 'missing-route';
            result.recommendation = 'Add route pattern to spa-navigation.js';
            result.priority = 'critical';
            return result;
        }

        // Validate route parameters
        switch (type) {
            case 'browse-category':
                return this.validateBrowseCategory(cleanUrl);

            case 'browse-category-mythology':
                return this.validateBrowseCategoryMythology(cleanUrl);

            case 'mythology':
                return this.validateMythology(cleanUrl);

            case 'category':
                return this.validateCategory(cleanUrl);

            case 'entity':
            case 'entity-alt':
                return this.validateEntity(cleanUrl, type);

            default:
                // Static routes are OK
                return { status: 'ok' };
        }
    }

    validateBrowseCategory(url) {
        const match = url.match(this.routes.browse_category);
        if (!match) return { status: 'broken', issue: 'invalid-format', priority: 'critical' };

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

    validateBrowseCategoryMythology(url) {
        const match = url.match(this.routes.browse_category_mythology);
        if (!match) return { status: 'broken', issue: 'invalid-format', priority: 'critical' };

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

    validateMythology(url) {
        const match = url.match(this.routes.mythology);
        if (!match) return { status: 'broken', issue: 'invalid-format', priority: 'critical' };

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

    validateCategory(url) {
        const match = url.match(this.routes.category);
        if (!match) return { status: 'broken', issue: 'invalid-format', priority: 'critical' };

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

    validateEntity(url, type) {
        const regex = type === 'entity-alt' ? this.routes.entity_alt : this.routes.entity;
        const match = url.match(regex);

        if (!match) return { status: 'broken', issue: 'invalid-format', priority: 'critical' };

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

        if (!entityId || entityId.length === 0) {
            return {
                status: 'broken',
                issue: 'missing-entity-id',
                priority: 'critical'
            };
        }

        return { status: 'ok', note: 'Entity existence not verified (requires Firebase)' };
    }

    /**
     * Run validation
     */
    async validate() {
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║         SPA LINK VALIDATION REPORT                        ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        const links = await this.extractLinks();
        console.log('🔍 Validating SPA navigation links...\n');

        const validationResults = [];

        for (const linkData of links) {
            const result = await this.validateLink(linkData);
            result.sources = linkData.sources;
            validationResults.push(result);

            this.results.total++;

            if (result.status === 'ok') {
                this.results.ok++;
            } else if (result.status === 'broken') {
                this.results.broken++;
                this.results.errors.push(result);
            } else if (result.status === 'warning') {
                this.results.warnings++;
            }
        }

        this.printResults(validationResults);
        this.generateReports(validationResults);

        return validationResults;
    }

    /**
     * Print results
     */
    printResults(results) {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                    SUMMARY                                ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        console.log(`Total SPA Links:  ${this.results.total}`);
        console.log(`✅ OK:            ${this.results.ok} (${((this.results.ok / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`❌ Broken:        ${this.results.broken} (${((this.results.broken / this.results.total) * 100).toFixed(1)}%)`);
        console.log(`⚠️  Warnings:     ${this.results.warnings}`);

        if (this.results.broken > 0) {
            console.log('\n╔═══════════════════════════════════════════════════════════╗');
            console.log('║                  BROKEN LINKS                             ║');
            console.log('╚═══════════════════════════════════════════════════════════╝\n');

            const byIssue = {};
            for (const error of this.results.errors) {
                const issue = error.issue || 'unknown';
                if (!byIssue[issue]) byIssue[issue] = [];
                byIssue[issue].push(error);
            }

            for (const [issue, errors] of Object.entries(byIssue)) {
                console.log(`\n📋 ${issue.toUpperCase().replace(/-/g, ' ')} (${errors.length}):`);
                console.log('─'.repeat(60));

                for (const error of errors.slice(0, 10)) {
                    console.log(`\n  URL: ${error.url}`);
                    console.log(`  Type: ${error.type}`);
                    console.log(`  Priority: ${error.priority || 'medium'}`);
                    if (error.recommendation) {
                        console.log(`  Fix: ${error.recommendation}`);
                    }
                    console.log(`  Found in: ${error.sources.slice(0, 3).join(', ')}${error.sources.length > 3 ? ` (+${error.sources.length - 3})` : ''}`);
                }

                if (errors.length > 10) {
                    console.log(`\n  ... and ${errors.length - 10} more`);
                }
            }
        }
    }

    /**
     * Generate reports
     */
    generateReports(results) {
        console.log('\n\n📄 Generating reports...\n');

        const report = this.buildReport(results);
        fs.writeFileSync(
            path.join(this.baseDir, 'SPA_LINK_VALIDATION.md'),
            report
        );
        console.log('  ✅ SPA_LINK_VALIDATION.md');

        const summary = this.buildQuickSummary();
        fs.writeFileSync(
            path.join(this.baseDir, 'SPA_LINK_FIX_SUMMARY.md'),
            summary
        );
        console.log('  ✅ SPA_LINK_FIX_SUMMARY.md\n');
    }

    buildReport(results) {
        const lines = [];

        lines.push('# SPA Link Validation Report\n');
        lines.push(`**Generated:** ${new Date().toISOString()}\n`);
        lines.push(`**Total SPA Links:** ${this.results.total}\n`);
        lines.push(`**Unique URLs:** ${this.links.size}\n\n`);

        lines.push('## Summary\n');
        lines.push('| Status | Count | Percentage |');
        lines.push('|--------|-------|------------|');
        lines.push(`| ✅ OK | ${this.results.ok} | ${((this.results.ok / this.results.total) * 100).toFixed(1)}% |`);
        lines.push(`| ❌ Broken | ${this.results.broken} | ${((this.results.broken / this.results.total) * 100).toFixed(1)}% |`);
        lines.push(`| ⚠️ Warnings | ${this.results.warnings} | ${((this.results.warnings / this.results.total) * 100).toFixed(1)}% |`);
        lines.push('\n');

        if (this.results.broken > 0) {
            lines.push('## Broken Links\n');

            const byIssue = {};
            for (const error of this.results.errors) {
                const issue = error.issue || 'unknown';
                if (!byIssue[issue]) byIssue[issue] = [];
                byIssue[issue].push(error);
            }

            for (const [issue, errors] of Object.entries(byIssue)) {
                lines.push(`\n### ${issue.toUpperCase().replace(/-/g, ' ')} (${errors.length})\n`);
                lines.push('| URL | Sources | Fix |');
                lines.push('|-----|---------|-----|');

                for (const error of errors) {
                    const sources = error.sources.length > 2
                        ? `${error.sources.slice(0, 2).join(', ')} (+${error.sources.length - 2})`
                        : error.sources.join(', ');

                    lines.push(`| \`${error.url}\` | ${sources} | ${error.recommendation || 'N/A'} |`);
                }
            }
        }

        return lines.join('\n');
    }

    buildQuickSummary() {
        const lines = [];

        lines.push('# SPA Link Fix Summary\n');
        lines.push(`**Generated:** ${new Date().toISOString()}\n\n`);

        if (this.results.broken > 0) {
            const critical = this.results.errors.filter(e => e.priority === 'critical');
            const high = this.results.errors.filter(e => e.priority === 'high');

            if (critical.length > 0) {
                lines.push(`## 🔴 CRITICAL (${critical.length})\n`);
                for (const error of critical.slice(0, 10)) {
                    lines.push(`- [ ] \`${error.url}\``);
                    lines.push(`  - ${error.issue}: ${error.recommendation || 'Manual fix required'}\n`);
                }
            }

            if (high.length > 0) {
                lines.push(`\n## 🟠 HIGH PRIORITY (${high.length})\n`);
                for (const error of high.slice(0, 10)) {
                    lines.push(`- [ ] \`${error.url}\``);
                    lines.push(`  - ${error.issue}: ${error.recommendation || 'Manual fix required'}\n`);
                }
            }
        } else {
            lines.push('## ✅ All Links Valid!\n');
            lines.push('No broken SPA navigation links found.\n');
        }

        return lines.join('\n');
    }
}

// Run
if (require.main === module) {
    const validator = new SPALinkValidator();
    validator.validate().then(() => {
        process.exit(validator.results.broken > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = SPALinkValidator;
