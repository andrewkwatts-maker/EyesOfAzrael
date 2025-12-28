#!/usr/bin/env node

/**
 * Template Validation Script
 * Validates HTML templates for Firebase compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

class TemplateValidator {
    constructor() {
        this.requiredElements = {
            'deity': ['.entity-header', '.entity-content', '[data-firebase-source]'],
            'hero': ['.entity-header', '.entity-content', '[data-firebase-source]'],
            'creature': ['.entity-header', '.entity-content', '[data-firebase-source]'],
            'ritual': ['.entity-header', '.entity-content', '[data-firebase-source]'],
            'index': ['.entity-grid', '[data-firebase-collection]']
        };

        this.requiredScripts = [
            'firebase-asset-loader.js',
            'entity-renderer-firebase.js'
        ];

        this.requiredStyles = [
            'theme-base.css',
            'entity-cards.css'
        ];
    }

    /**
     * Validate a single template file
     */
    async validateTemplate(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const filename = path.basename(filePath);
            const templateType = this.detectTemplateType(filename, content);

            const dom = new JSDOM(content);
            const { document } = dom.window;

            const errors = [];
            const warnings = [];

            // Check for required elements
            const requiredElements = this.requiredElements[templateType] || [];
            for (const selector of requiredElements) {
                if (!document.querySelector(selector)) {
                    errors.push({
                        type: 'missing-element',
                        message: `Required element missing: ${selector}`
                    });
                }
            }

            // Check for required scripts
            const scripts = Array.from(document.querySelectorAll('script[src]'))
                .map(s => s.getAttribute('src'));

            for (const requiredScript of this.requiredScripts) {
                if (!scripts.some(s => s && s.includes(requiredScript))) {
                    warnings.push({
                        type: 'missing-script',
                        message: `Recommended script missing: ${requiredScript}`
                    });
                }
            }

            // Check for required styles
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .map(l => l.getAttribute('href'));

            for (const requiredStyle of this.requiredStyles) {
                if (!styles.some(s => s && s.includes(requiredStyle))) {
                    warnings.push({
                        type: 'missing-style',
                        message: `Recommended stylesheet missing: ${requiredStyle}`
                    });
                }
            }

            // Check charset
            const charset = document.querySelector('meta[charset]');
            if (!charset || charset.getAttribute('charset').toLowerCase() !== 'utf-8') {
                warnings.push({
                    type: 'charset',
                    message: 'Template should specify UTF-8 charset'
                });
            }

            // Check viewport
            if (!document.querySelector('meta[name="viewport"]')) {
                warnings.push({
                    type: 'viewport',
                    message: 'Template should include viewport meta tag'
                });
            }

            // Check for Firebase data attributes
            const firebaseSources = document.querySelectorAll('[data-firebase-source]');
            if (firebaseSources.length === 0 && templateType !== 'index') {
                warnings.push({
                    type: 'firebase-integration',
                    message: 'No Firebase data sources found'
                });
            }

            return {
                isValid: errors.length === 0,
                file: filename,
                path: filePath,
                templateType,
                errors,
                warnings
            };

        } catch (error) {
            return {
                isValid: false,
                file: path.basename(filePath),
                path: filePath,
                templateType: 'unknown',
                errors: [{
                    type: 'file-error',
                    message: `Failed to read/parse template: ${error.message}`
                }],
                warnings: []
            };
        }
    }

    /**
     * Detect template type from filename or content
     */
    detectTemplateType(filename, content) {
        if (filename.includes('deity') || filename.includes('deities')) return 'deity';
        if (filename.includes('hero') || filename.includes('heroes')) return 'hero';
        if (filename.includes('creature')) return 'creature';
        if (filename.includes('ritual')) return 'ritual';
        if (filename.includes('index')) return 'index';

        if (content.includes('data-entity-type="deity"')) return 'deity';
        if (content.includes('data-entity-type="hero"')) return 'hero';
        if (content.includes('data-entity-type="creature"')) return 'creature';
        if (content.includes('data-entity-type="ritual"')) return 'ritual';

        return 'unknown';
    }

    /**
     * Validate all templates in directory
     */
    async validateDirectory(dirPath) {
        const results = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    const subResults = await this.validateDirectory(fullPath);
                    results.push(...subResults);
                } else if (entry.name.endsWith('.html')) {
                    const result = await this.validateTemplate(fullPath);
                    results.push(result);
                }
            }
        } catch (error) {
            console.error(`${colors.red}✗${colors.reset} Error reading directory ${dirPath}:`, error.message);
        }

        return results;
    }

    /**
     * Print validation results
     */
    printResults(results) {
        console.log(`\n${colors.bright}Template Validation Results${colors.reset}`);
        console.log('='.repeat(60));

        let validCount = 0;
        let invalidCount = 0;

        for (const result of results) {
            if (result.isValid) {
                validCount++;
                if (result.warnings.length > 0) {
                    console.log(`${colors.yellow}⚠${colors.reset} ${result.file} (${result.templateType}) - ${result.warnings.length} warnings`);
                } else {
                    console.log(`${colors.green}✓${colors.reset} ${result.file} (${result.templateType})`);
                }
            } else {
                invalidCount++;
                console.log(`${colors.red}✗${colors.reset} ${result.file} (${result.templateType}) - ${result.errors.length} errors`);

                result.errors.forEach(error => {
                    console.log(`  ${colors.red}└─${colors.reset} ${error.message}`);
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`${colors.bright}Summary${colors.reset}`);
        console.log(`Total:   ${results.length}`);
        console.log(`${colors.green}Valid:   ${validCount}${colors.reset}`);
        console.log(`${colors.red}Invalid: ${invalidCount}${colors.reset}`);

        const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);
        if (warningCount > 0) {
            console.log(`${colors.yellow}Warnings: ${warningCount}${colors.reset}`);
        }

        return invalidCount === 0;
    }

    /**
     * Generate validation report
     */
    async generateReport(results, outputPath) {
        const report = {
            timestamp: new Date().toISOString(),
            totalTemplates: results.length,
            validCount: results.filter(r => r.isValid).length,
            invalidCount: results.filter(r => !r.isValid).length,
            results: results.map(r => ({
                file: r.file,
                path: r.path,
                templateType: r.templateType,
                isValid: r.isValid,
                errorCount: r.errors.length,
                warningCount: r.warnings.length,
                errors: r.errors,
                warnings: r.warnings
            }))
        };

        await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n${colors.green}✓${colors.reset} Report saved to ${outputPath}`);

        return report;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    const options = {
        path: args[0] || 'mythos',
        report: args.includes('--report'),
        reportPath: args[args.indexOf('--report') + 1] || 'template-validation-report.json'
    };

    console.log(`${colors.bright}Template Validation Script${colors.reset}`);
    console.log('='.repeat(60));

    const validator = new TemplateValidator();

    try {
        console.log(`\nValidating templates in: ${options.path}`);
        const results = await validator.validateDirectory(options.path);

        const allValid = validator.printResults(results);

        if (options.report) {
            await validator.generateReport(results, options.reportPath);
        }

        process.exit(allValid ? 0 : 1);

    } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Validation failed:`, error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = TemplateValidator;
