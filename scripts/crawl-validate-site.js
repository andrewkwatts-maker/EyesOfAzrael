#!/usr/bin/env node
/**
 * Eyes of Azrael - Comprehensive Website Crawler/Validator
 *
 * Launches a headless browser, crawls the entire SPA following all
 * discoverable links, validates page loads, schema compliance,
 * content completeness, and performance.
 *
 * Usage:
 *   node scripts/crawl-validate-site.js [options]
 *
 * Options:
 *   --url <base>       Base URL (default: http://localhost:3000)
 *   --max-depth <n>    Max crawl depth (default: 5)
 *   --max-pages <n>    Max pages to visit (default: 2000)
 *   --parallel <n>     Concurrent browser contexts (default: 3)
 *   --verbose          Show detailed output
 *   --seed-only        Only visit seed URLs, don't follow links
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const config = require('./crawl-validate-config');

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(name, defaultVal) {
    const idx = args.indexOf(name);
    if (idx === -1) return defaultVal;
    return args[idx + 1] || defaultVal;
}
const verbose = args.includes('--verbose');
const seedOnly = args.includes('--seed-only');
const BASE_URL = getArg('--url', 'http://localhost:3000');
const MAX_DEPTH = parseInt(getArg('--max-depth', config.defaults.maxDepth), 10);
const MAX_PAGES = parseInt(getArg('--max-pages', config.defaults.maxPages), 10);
const PARALLEL = parseInt(getArg('--parallel', config.defaults.parallel), 10);

// ANSI colors
const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m'
};

// ============================================================
// Route Seeder — generates seed URLs from known routes
// ============================================================

function generateSeedUrls() {
    const seeds = [];

    // Static pages
    for (const page of config.staticPages) {
        seeds.push({ url: page, depth: 0 });
    }

    // Browse categories
    for (const cat of config.categories) {
        seeds.push({ url: `#/browse/${cat}`, depth: 1 });
    }

    // Mythologies
    for (const myth of config.mythologies) {
        seeds.push({ url: `#/mythology/${myth}`, depth: 1 });
    }

    return seeds;
}

// ============================================================
// Entity URL parser
// ============================================================

function parseEntityUrl(hash) {
    for (const pattern of config.entityPatterns) {
        const match = hash.match(pattern);
        if (match) {
            // Determine collection type from the URL
            if (pattern.source.includes('mythology')) {
                return { mythology: match[1], collection: match[2], id: match[3] };
            }
            if (match.length === 4) {
                return { collection: match[1], type: match[2], id: match[3] };
            }
            return { collection: match[1], id: match[2] };
        }
    }
    return null;
}

// ============================================================
// Page Validator
// ============================================================

async function validatePage(page, url, loadTime, jsErrors, networkErrors) {
    const result = {
        url,
        status: 'pass',
        loadTime,
        errors: [],
        warnings: [],
        linksFound: 0,
        schemaResult: null
    };

    // Check load time
    if (loadTime > config.performance.slowErrorMs) {
        result.errors.push(`Extremely slow load: ${(loadTime / 1000).toFixed(1)}s`);
        result.status = 'fail';
    } else if (loadTime > config.performance.slowWarningMs) {
        result.warnings.push(`Slow load: ${(loadTime / 1000).toFixed(1)}s`);
        if (result.status === 'pass') result.status = 'warn';
    }

    // Check JS errors
    if (jsErrors.length > 0) {
        for (const err of jsErrors) {
            result.errors.push(`JS Error: ${err}`);
        }
        result.status = 'fail';
    }

    // Check network errors
    if (networkErrors.length > 0) {
        for (const err of networkErrors) {
            // Ignore analytics/tracking failures
            if (err.includes('google-analytics') || err.includes('googletagmanager')) continue;
            result.warnings.push(`Network: ${err}`);
            if (result.status === 'pass') result.status = 'warn';
        }
    }

    // Check content
    try {
        const contentCheckArgs = {
            selectors: config.selectors,
            badPatterns: config.contentIssues.badTextPatterns.map(r => r.source),
            minLen: config.contentIssues.minContentLength
        };
        const contentCheck = await page.evaluate((args) => {
            const { selectors: sel, badPatterns, minLen } = args;
            const main = document.querySelector(sel.mainContent);
            if (!main) return { empty: true, error: 'main-content not found' };

            const text = main.textContent || '';
            const trimmed = text.trim();

            // Check for error states
            const errorEl = main.querySelector(sel.errorMessage);
            if (errorEl && errorEl.offsetParent !== null) {
                return { empty: false, error: `Error displayed: ${errorEl.textContent.trim().substring(0, 100)}` };
            }

            // Check for loading spinners still visible
            const spinner = main.querySelector(sel.loadingSpinner);
            if (spinner && spinner.offsetParent !== null) {
                return { empty: false, error: 'Loading spinner still visible' };
            }

            // Check for empty content
            if (trimmed.length < minLen) {
                return { empty: true, error: `Content too short (${trimmed.length} chars)` };
            }

            // Check for bad text patterns
            const issues = [];
            for (const patternStr of badPatterns) {
                const regex = new RegExp(patternStr);
                const sample = trimmed.substring(0, 5000);
                if (regex.test(sample)) {
                    issues.push(`Contains "${patternStr}" text`);
                }
            }

            // Check for broken images
            const images = main.querySelectorAll('img');
            let brokenImages = 0;
            images.forEach(img => {
                if (img.naturalWidth === 0 && img.offsetParent !== null && img.src) {
                    brokenImages++;
                }
            });

            return {
                empty: false,
                textLength: trimmed.length,
                issues,
                brokenImages,
                error: null
            };
        }, contentCheckArgs);

        if (contentCheck.error) {
            result.errors.push(contentCheck.error);
            result.status = 'fail';
        }
        if (contentCheck.issues && contentCheck.issues.length > 0) {
            for (const issue of contentCheck.issues) {
                result.warnings.push(issue);
            }
            if (result.status === 'pass') result.status = 'warn';
        }
        if (contentCheck.brokenImages > 0) {
            result.warnings.push(`${contentCheck.brokenImages} broken image(s)`);
            if (result.status === 'pass') result.status = 'warn';
        }
    } catch (err) {
        result.errors.push(`Content check failed: ${err.message}`);
        result.status = 'fail';
    }

    // Schema validation for entity pages
    const entityInfo = parseEntityUrl(url);
    if (entityInfo) {
        try {
            const schemaResult = await page.evaluate((sel) => {
                const name = document.querySelector(sel.entityName)?.textContent?.trim();
                const desc = document.querySelector(sel.entityDescription)?.textContent?.trim();
                const type = document.querySelector(sel.entityType)?.textContent?.trim();
                const myth = document.querySelector(sel.mythologyBadge)?.textContent?.trim();
                return { name, description: desc, type, mythology: myth };
            }, config.selectors);

            result.schemaResult = schemaResult;

            if (!schemaResult.name) {
                result.warnings.push('Entity name not rendered');
                if (result.status === 'pass') result.status = 'warn';
            }
            if (!schemaResult.description) {
                result.warnings.push('Entity description not rendered');
                if (result.status === 'pass') result.status = 'warn';
            }
        } catch (err) {
            result.warnings.push(`Schema check failed: ${err.message}`);
        }
    }

    return result;
}

// ============================================================
// Link Extractor
// ============================================================

async function extractLinks(page) {
    try {
        return await page.evaluate(() => {
            const links = new Set();
            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.getAttribute('href');
                if (href && href.startsWith('#/')) {
                    links.add(href);
                }
            });
            return [...links];
        });
    } catch (err) {
        return [];
    }
}

// ============================================================
// Main Crawler
// ============================================================

async function crawl() {
    const startTime = Date.now();
    const visited = new Set();
    const queue = generateSeedUrls();
    const results = [];
    let pagesVisited = 0;

    console.log(`${C.bold}${C.cyan}Crawl Validator${C.reset}`);
    console.log(`${C.dim}Target: ${BASE_URL}${C.reset}`);
    console.log(`${C.dim}Seeds: ${queue.length} | Max depth: ${MAX_DEPTH} | Max pages: ${MAX_PAGES} | Workers: ${PARALLEL}${C.reset}`);
    console.log();

    const browser = await chromium.launch({ headless: true });

    // Worker function
    async function worker(workerId) {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        while (true) {
            // Get next URL from queue
            let item;
            while (queue.length > 0) {
                const candidate = queue.shift();
                if (!visited.has(candidate.url) && candidate.depth <= MAX_DEPTH) {
                    item = candidate;
                    break;
                }
            }

            if (!item || pagesVisited >= MAX_PAGES) break;

            const { url, depth } = item;
            if (visited.has(url)) continue;
            visited.add(url);
            pagesVisited++;

            // Skip protected routes
            if (config.protectedRoutes.some(r => url.startsWith(r))) {
                results.push({
                    url,
                    status: 'skipped',
                    loadTime: 0,
                    errors: [],
                    warnings: ['Skipped: auth required'],
                    linksFound: 0,
                    schemaResult: null
                });
                if (verbose) console.log(`${C.dim}  [W${workerId}] SKIP ${url} (auth)${C.reset}`);
                continue;
            }

            // Visit page
            const jsErrors = [];
            const networkErrors = [];

            page.on('pageerror', err => jsErrors.push(err.message.substring(0, 200)));
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    const text = msg.text();
                    // Filter out common non-critical console errors
                    if (!text.includes('favicon') && !text.includes('404')) {
                        jsErrors.push(text.substring(0, 200));
                    }
                }
            });
            page.on('requestfailed', req => {
                const url = req.url();
                if (!url.includes('favicon') && !url.includes('analytics')) {
                    networkErrors.push(`${req.failure()?.errorText || 'failed'}: ${url.substring(0, 100)}`);
                }
            });

            const fullUrl = `${BASE_URL}/${url}`;
            const pageStart = Date.now();

            try {
                await page.goto(fullUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: config.timeouts.pageLoad
                });

                // Wait for content to render (SPA needs time to process hash route)
                try {
                    await page.waitForSelector(config.selectors.mainContent, {
                        timeout: config.timeouts.contentRender
                    });
                    // Give a bit more time for dynamic content
                    await page.waitForTimeout(1000);
                } catch (e) {
                    // mainContent might not exist on some pages
                }

                const loadTime = Date.now() - pageStart;

                // Validate page
                const result = await validatePage(page, url, loadTime, jsErrors, networkErrors);

                // Extract links for further crawling
                if (!seedOnly) {
                    const links = await extractLinks(page);
                    result.linksFound = links.length;

                    for (const link of links) {
                        if (!visited.has(link)) {
                            queue.push({ url: link, depth: depth + 1 });
                        }
                    }
                }

                results.push(result);

                // Progress output
                const statusIcon = result.status === 'pass' ? `${C.green}✓${C.reset}` :
                                   result.status === 'warn' ? `${C.yellow}!${C.reset}` :
                                   result.status === 'fail' ? `${C.red}✗${C.reset}` :
                                   `${C.dim}-${C.reset}`;
                const depthStr = `d${depth}`;
                if (verbose || result.status !== 'pass') {
                    console.log(`  ${statusIcon} ${C.dim}[${depthStr}]${C.reset} ${url} ${C.dim}(${loadTime}ms, ${result.linksFound} links)${C.reset}`);
                    for (const err of result.errors) {
                        console.log(`    ${C.red}ERROR: ${err}${C.reset}`);
                    }
                    for (const warn of result.warnings) {
                        console.log(`    ${C.yellow}WARN: ${warn}${C.reset}`);
                    }
                } else if (pagesVisited % 25 === 0) {
                    console.log(`  ${C.dim}... ${pagesVisited} pages crawled (${queue.length} queued)${C.reset}`);
                }

            } catch (err) {
                const loadTime = Date.now() - pageStart;
                results.push({
                    url,
                    status: 'fail',
                    loadTime,
                    errors: [`Page load failed: ${err.message.substring(0, 200)}`],
                    warnings: [],
                    linksFound: 0,
                    schemaResult: null
                });
                console.log(`  ${C.red}✗${C.reset} ${C.dim}[d${depth}]${C.reset} ${url} ${C.red}FAILED: ${err.message.substring(0, 100)}${C.reset}`);
            }

            // Remove listeners to avoid leaks
            page.removeAllListeners('pageerror');
            page.removeAllListeners('console');
            page.removeAllListeners('requestfailed');
        }

        await context.close();
    }

    // Launch workers
    const workers = [];
    for (let i = 0; i < PARALLEL; i++) {
        workers.push(worker(i));
    }
    await Promise.all(workers);

    await browser.close();

    const duration = Date.now() - startTime;
    return { results, duration };
}

// ============================================================
// Report Generator
// ============================================================

function generateReport(results, duration) {
    const passed = results.filter(r => r.status === 'pass');
    const warnings = results.filter(r => r.status === 'warn');
    const failed = results.filter(r => r.status === 'fail');
    const skipped = results.filter(r => r.status === 'skipped');

    // Categorize errors
    const loadFailures = failed.filter(r => r.errors.some(e => e.includes('Page load failed') || e.includes('main-content not found')));
    const jsErrors = results.filter(r => r.errors.some(e => e.includes('JS Error')));
    const schemaViolations = results.filter(r => r.warnings.some(w => w.includes('Entity') && w.includes('not rendered')));
    const emptyContent = results.filter(r => r.errors.some(e => e.includes('Content too short') || e.includes('empty')));
    const slowPages = results.filter(r => r.warnings.some(w => w.includes('Slow load')));

    const report = {
        summary: {
            totalPages: results.length,
            passed: passed.length,
            warnings: warnings.length,
            errors: failed.length,
            skipped: skipped.length,
            duration: `${(duration / 1000).toFixed(1)}s`,
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL
        },
        byCategory: {
            load_failures: loadFailures.map(r => ({ url: r.url, errors: r.errors })),
            js_errors: jsErrors.map(r => ({ url: r.url, errors: r.errors.filter(e => e.includes('JS Error')) })),
            schema_violations: schemaViolations.map(r => ({ url: r.url, warnings: r.warnings.filter(w => w.includes('not rendered')) })),
            empty_content: emptyContent.map(r => ({ url: r.url, errors: r.errors })),
            slow_pages: slowPages.map(r => ({ url: r.url, loadTime: r.loadTime }))
        },
        pages: results
    };

    return report;
}

function printSummary(report) {
    console.log();
    console.log(`${C.bold}============================================================${C.reset}`);
    console.log(`${C.bold}  CRAWL VALIDATION COMPLETE${C.reset}`);
    console.log(`${C.bold}============================================================${C.reset}`);
    console.log();
    console.log(`  Pages Crawled:  ${C.bold}${report.summary.totalPages}${C.reset}`);
    console.log(`  ${C.green}Passed:${C.reset}         ${report.summary.passed} (${(report.summary.passed / Math.max(report.summary.totalPages, 1) * 100).toFixed(1)}%)`);
    console.log(`  ${C.yellow}Warnings:${C.reset}       ${report.summary.warnings}`);
    console.log(`  ${C.red}Errors:${C.reset}         ${report.summary.errors}`);
    console.log(`  ${C.dim}Skipped:${C.reset}        ${report.summary.skipped}`);
    console.log(`  Duration:       ${report.summary.duration}`);

    if (report.byCategory.load_failures.length > 0) {
        console.log();
        console.log(`  ${C.red}${C.bold}LOAD FAILURES:${C.reset}`);
        for (const item of report.byCategory.load_failures.slice(0, 10)) {
            console.log(`    ${C.red}✗${C.reset} ${item.url}`);
            for (const err of item.errors.slice(0, 2)) {
                console.log(`      ${C.dim}${err}${C.reset}`);
            }
        }
        if (report.byCategory.load_failures.length > 10) {
            console.log(`    ${C.dim}... and ${report.byCategory.load_failures.length - 10} more${C.reset}`);
        }
    }

    if (report.byCategory.schema_violations.length > 0) {
        console.log();
        console.log(`  ${C.yellow}${C.bold}SCHEMA VIOLATIONS:${C.reset}`);
        for (const item of report.byCategory.schema_violations.slice(0, 10)) {
            console.log(`    ${C.yellow}!${C.reset} ${item.url}`);
            for (const warn of item.warnings) {
                console.log(`      ${C.dim}${warn}${C.reset}`);
            }
        }
        if (report.byCategory.schema_violations.length > 10) {
            console.log(`    ${C.dim}... and ${report.byCategory.schema_violations.length - 10} more${C.reset}`);
        }
    }

    if (report.byCategory.js_errors.length > 0) {
        console.log();
        console.log(`  ${C.red}${C.bold}JS ERRORS:${C.reset}`);
        for (const item of report.byCategory.js_errors.slice(0, 10)) {
            console.log(`    ${C.red}✗${C.reset} ${item.url}`);
            for (const err of item.errors.slice(0, 2)) {
                console.log(`      ${C.dim}${err}${C.reset}`);
            }
        }
        if (report.byCategory.js_errors.length > 10) {
            console.log(`    ${C.dim}... and ${report.byCategory.js_errors.length - 10} more${C.reset}`);
        }
    }

    if (report.byCategory.slow_pages.length > 0) {
        console.log();
        console.log(`  ${C.yellow}${C.bold}SLOW PAGES:${C.reset}`);
        for (const item of report.byCategory.slow_pages.slice(0, 5)) {
            console.log(`    ${C.yellow}!${C.reset} ${item.url} (${(item.loadTime / 1000).toFixed(1)}s)`);
        }
        if (report.byCategory.slow_pages.length > 5) {
            console.log(`    ${C.dim}... and ${report.byCategory.slow_pages.length - 5} more${C.reset}`);
        }
    }

    console.log();
    console.log(`${C.bold}============================================================${C.reset}`);
}

// ============================================================
// Main
// ============================================================

async function main() {
    try {
        const { results, duration } = await crawl();
        const report = generateReport(results, duration);

        // Save report
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, 'crawl-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Print summary
        printSummary(report);

        // Exit with error code if there were failures
        if (report.summary.errors > 0) {
            process.exit(1);
        }

    } catch (error) {
        console.error(`${C.red}Crawl failed: ${error.message}${C.reset}`);
        if (error.message.includes('ECONNREFUSED')) {
            console.error(`${C.yellow}Is the dev server running? Start it with: dev.bat${C.reset}`);
        }
        process.exit(2);
    }
}

main();
