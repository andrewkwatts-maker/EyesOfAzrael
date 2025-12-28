#!/usr/bin/env node

/**
 * Entity Validation Script
 * Validates entity JSON files against schemas
 */

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

class EntityValidator {
    constructor() {
        this.ajv = new Ajv({ allErrors: true, verbose: true });
        addFormats(this.ajv);
        this.schemas = new Map();
        this.stats = {
            total: 0,
            valid: 0,
            invalid: 0,
            errors: [],
            warnings: []
        };
    }

    /**
     * Load all schemas
     */
    async loadSchemas() {
        const schemaDir = path.join(__dirname, '..', 'schemas');
        const schemaFiles = await fs.readdir(schemaDir);

        for (const file of schemaFiles) {
            if (!file.endsWith('.schema.json')) continue;

            const schemaPath = path.join(schemaDir, file);
            const schemaContent = await fs.readFile(schemaPath, 'utf8');
            const schema = JSON.parse(schemaContent);

            const schemaName = file.replace('.schema.json', '');
            this.schemas.set(schemaName, schema);

            // Add schema to AJV
            if (schema.$id) {
                this.ajv.addSchema(schema, schema.$id);
            }
        }

        console.log(`${colors.green}✓${colors.reset} Loaded ${this.schemas.size} schemas`);
    }

    /**
     * Validate a single entity file
     */
    async validateEntityFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const entity = JSON.parse(content);

            return this.validateEntity(entity, path.basename(filePath));

        } catch (error) {
            return {
                isValid: false,
                file: path.basename(filePath),
                errors: [{
                    message: `Failed to read/parse file: ${error.message}`
                }],
                warnings: []
            };
        }
    }

    /**
     * Validate a single entity object
     */
    validateEntity(entity, filename = 'unknown') {
        const entityType = entity.type || 'unknown';
        const schema = this.schemas.get(entityType) || this.schemas.get('entity-base');

        if (!schema) {
            return {
                isValid: false,
                file: filename,
                entity: entity.id || 'unknown',
                type: entityType,
                errors: [{ message: `No schema found for type: ${entityType}` }],
                warnings: []
            };
        }

        const validate = this.ajv.compile(schema);
        const valid = validate(entity);

        const errors = validate.errors || [];
        const warnings = [];

        // Add custom validation warnings
        if (!entity.description || entity.description.length < 50) {
            warnings.push({
                field: 'description',
                message: 'Description should be at least 50 characters'
            });
        }

        if (!entity.sources || entity.sources.length === 0) {
            warnings.push({
                field: 'sources',
                message: 'Adding sources improves credibility'
            });
        }

        return {
            isValid: valid,
            file: filename,
            entity: entity.id || 'unknown',
            name: entity.name || 'unknown',
            type: entityType,
            errors: errors.map(e => ({
                field: e.instancePath || e.dataPath,
                message: e.message,
                params: e.params
            })),
            warnings
        };
    }

    /**
     * Validate all entities in directory
     */
    async validateDirectory(dirPath) {
        const results = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Recursively validate subdirectories
                    const subResults = await this.validateDirectory(fullPath);
                    results.push(...subResults);
                } else if (entry.name.endsWith('.json')) {
                    const result = await this.validateEntityFile(fullPath);
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
        console.log(`\n${colors.bright}Validation Results${colors.reset}`);
        console.log('='.repeat(60));

        let validCount = 0;
        let invalidCount = 0;

        for (const result of results) {
            if (result.isValid) {
                validCount++;
                if (result.warnings.length > 0) {
                    console.log(`${colors.yellow}⚠${colors.reset} ${result.entity} (${result.type}) - ${result.warnings.length} warnings`);
                }
            } else {
                invalidCount++;
                console.log(`${colors.red}✗${colors.reset} ${result.entity} (${result.type}) - ${result.errors.length} errors`);

                // Print first 3 errors
                result.errors.slice(0, 3).forEach(error => {
                    console.log(`  ${colors.red}└─${colors.reset} ${error.field}: ${error.message}`);
                });

                if (result.errors.length > 3) {
                    console.log(`  ${colors.red}└─${colors.reset} ... and ${result.errors.length - 3} more errors`);
                }
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
            totalEntities: results.length,
            validCount: results.filter(r => r.isValid).length,
            invalidCount: results.filter(r => !r.isValid).length,
            results: results.map(r => ({
                entity: r.entity,
                name: r.name,
                type: r.type,
                file: r.file,
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
        path: args[0] || 'firebase-assets-enhanced',
        report: args.includes('--report'),
        reportPath: args[args.indexOf('--report') + 1] || 'validation-report.json'
    };

    console.log(`${colors.bright}Entity Validation Script${colors.reset}`);
    console.log('='.repeat(60));

    const validator = new EntityValidator();

    try {
        // Load schemas
        await validator.loadSchemas();

        // Validate entities
        console.log(`\nValidating entities in: ${options.path}`);
        const results = await validator.validateDirectory(options.path);

        // Print results
        const allValid = validator.printResults(results);

        // Generate report if requested
        if (options.report) {
            await validator.generateReport(results, options.reportPath);
        }

        // Exit with appropriate code
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

module.exports = EntityValidator;
