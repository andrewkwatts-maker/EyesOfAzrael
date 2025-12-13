#!/usr/bin/env node

/**
 * Validation Script for Parsed Data
 *
 * This script validates the quality and completeness of parsed data
 * before uploading to Firestore.
 *
 * Checks:
 * - Required fields present
 * - Data types correct
 * - No missing mythology references
 * - Archetype consistency
 * - Relationship validity
 *
 * Usage:
 *   node validate-parsed-data.js
 *   node validate-parsed-data.js --mythology=greek
 *   node validate-parsed-data.js --strict
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const PARSED_DATA_DIR = path.join(BASE_DIR, 'parsed_data');

// Validation rules
const VALIDATION_RULES = {
    mythology: {
        required: ['id', 'title', 'icon'],
        optional: ['description', 'heroTitle', 'sections', 'stats'],
        types: {
            id: 'string',
            title: 'string',
            icon: 'string',
            description: 'string',
            sections: 'array',
            stats: 'object'
        }
    },
    deity: {
        required: ['id', 'mythology', 'name'],
        optional: ['displayName', 'description', 'archetypes', 'domains', 'symbols',
                   'epithets', 'relationships', 'primarySources', 'relatedEntities'],
        types: {
            id: 'string',
            mythology: 'string',
            name: 'string',
            displayName: 'string',
            description: 'string',
            archetypes: 'array',
            domains: 'array',
            symbols: 'array',
            epithets: 'array',
            relationships: 'object'
        }
    }
};

class Validator {
    constructor(strict = false) {
        this.strict = strict;
        this.errors = [];
        this.warnings = [];
        this.stats = {
            totalMythologies: 0,
            totalDeities: 0,
            validMythologies: 0,
            validDeities: 0,
            invalidMythologies: 0,
            invalidDeities: 0
        };
    }

    error(message, context = {}) {
        this.errors.push({ message, context, level: 'error' });
    }

    warn(message, context = {}) {
        this.warnings.push({ message, context, level: 'warning' });
    }

    validateField(obj, field, expectedType, required = false, context = {}) {
        const value = obj[field];

        if (value === undefined || value === null) {
            if (required) {
                this.error(`Missing required field: ${field}`, context);
                return false;
            }
            return true; // Optional field, OK if missing
        }

        const actualType = Array.isArray(value) ? 'array' :
                          typeof value === 'object' ? 'object' :
                          typeof value;

        if (actualType !== expectedType) {
            this.error(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`, context);
            return false;
        }

        // Additional validations
        if (expectedType === 'string' && value.trim().length === 0) {
            this.warn(`Empty string for ${field}`, context);
        }

        if (expectedType === 'array' && value.length === 0) {
            if (this.strict && required) {
                this.warn(`Empty array for ${field}`, context);
            }
        }

        return true;
    }

    validateMythology(mythology) {
        const context = { type: 'mythology', id: mythology.id };
        const rules = VALIDATION_RULES.mythology;
        let isValid = true;

        // Check required fields
        rules.required.forEach(field => {
            if (!this.validateField(mythology, field, rules.types[field], true, context)) {
                isValid = false;
            }
        });

        // Check optional fields if present
        rules.optional.forEach(field => {
            if (mythology[field] !== undefined) {
                this.validateField(mythology, field, rules.types[field], false, context);
            }
        });

        // Custom validations
        if (mythology.icon && mythology.icon.length > 10) {
            this.warn(`Icon seems too long (emoji expected): ${mythology.icon}`, context);
        }

        if (mythology.description && mythology.description.length < 50) {
            this.warn(`Description seems short: ${mythology.description.length} characters`, context);
        }

        if (mythology.stats) {
            if (mythology.stats.deityCount === 0) {
                this.warn(`No deities found`, context);
            }
        }

        return isValid;
    }

    validateDeity(deity) {
        const context = { type: 'deity', id: deity.id, mythology: deity.mythology };
        const rules = VALIDATION_RULES.deity;
        let isValid = true;

        // Check required fields
        rules.required.forEach(field => {
            if (!this.validateField(deity, field, rules.types[field], true, context)) {
                isValid = false;
            }
        });

        // Check optional fields if present
        rules.optional.forEach(field => {
            if (deity[field] !== undefined) {
                this.validateField(deity, field, rules.types[field], false, context);
            }
        });

        // Custom validations
        if (this.strict) {
            if (!deity.archetypes || deity.archetypes.length === 0) {
                this.warn(`No archetypes assigned`, context);
            }

            if (!deity.domains || deity.domains.length === 0) {
                this.warn(`No domains assigned`, context);
            }

            if (!deity.description || deity.description.length < 100) {
                this.warn(`Description seems incomplete`, context);
            }
        }

        // Check for common data quality issues
        if (deity.name.includes('undefined') || deity.name.includes('null')) {
            this.error(`Invalid deity name: ${deity.name}`, context);
            isValid = false;
        }

        if (deity.archetypes) {
            deity.archetypes.forEach(archetype => {
                if (archetype.includes('undefined') || archetype.length < 3) {
                    this.warn(`Suspicious archetype: ${archetype}`, context);
                }
            });
        }

        return isValid;
    }

    validateMythologyData(data) {
        this.stats.totalMythologies++;

        const mythologyValid = this.validateMythology(data.mythology);
        if (mythologyValid) {
            this.stats.validMythologies++;
        } else {
            this.stats.invalidMythologies++;
        }

        if (data.deities && Array.isArray(data.deities)) {
            data.deities.forEach(deity => {
                this.stats.totalDeities++;

                const deityValid = this.validateDeity(deity);
                if (deityValid) {
                    this.stats.validDeities++;
                } else {
                    this.stats.invalidDeities++;
                }
            });
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                mythologyValidRate: ((this.stats.validMythologies / this.stats.totalMythologies) * 100).toFixed(2) + '%',
                deityValidRate: ((this.stats.validDeities / this.stats.totalDeities) * 100).toFixed(2) + '%',
                passed: this.errors.length === 0
            },
            errors: this.errors,
            warnings: this.warnings
        };

        return report;
    }

    printReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('📋 VALIDATION REPORT');
        console.log('═'.repeat(60));

        console.log('\n📊 Statistics:');
        console.log(`   Mythologies: ${this.stats.validMythologies}/${this.stats.totalMythologies} valid`);
        console.log(`   Deities: ${this.stats.validDeities}/${this.stats.totalDeities} valid`);

        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.slice(0, 10).forEach(err => {
                console.log(`   - ${err.message}`);
                if (err.context.id) {
                    console.log(`     Context: ${err.context.type} ${err.context.id}`);
                }
            });
            if (this.errors.length > 10) {
                console.log(`   ... and ${this.errors.length - 10} more errors`);
            }
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.slice(0, 10).forEach(warn => {
                console.log(`   - ${warn.message}`);
            });
            if (this.warnings.length > 10) {
                console.log(`   ... and ${this.warnings.length - 10} more warnings`);
            }
        }

        if (this.errors.length === 0) {
            console.log('\n✅ All validations passed!');
        } else {
            console.log('\n❌ Validation failed - fix errors before uploading');
        }
    }
}

// Main validation function
function validateParsedData(mythologyId = null, strict = false) {
    const validator = new Validator(strict);

    if (mythologyId) {
        // Validate single mythology
        const filepath = path.join(PARSED_DATA_DIR, `${mythologyId}_parsed.json`);

        if (!fs.existsSync(filepath)) {
            console.error(`❌ Parsed data not found: ${filepath}`);
            return null;
        }

        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        validator.validateMythologyData(data);

    } else {
        // Validate all mythologies
        const filepath = path.join(PARSED_DATA_DIR, 'all_mythologies_parsed.json');

        if (!fs.existsSync(filepath)) {
            console.error(`❌ Parsed data not found: ${filepath}`);
            console.error(`   Run: node parse-html-to-firestore.js --all`);
            return null;
        }

        const allData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        Object.entries(allData).forEach(([mythId, data]) => {
            console.log(`\n🔍 Validating: ${mythId}`);
            validator.validateMythologyData(data);
        });
    }

    return validator.generateReport();
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const mythologyArg = args.find(arg => arg.startsWith('--mythology='));
    const strict = args.includes('--strict');

    console.log('🔍 Parsed Data Validator');
    console.log('━'.repeat(60));

    if (strict) {
        console.log('⚠️  Running in STRICT mode\n');
    }

    const mythId = mythologyArg ? mythologyArg.split('=')[1] : null;
    const report = validateParsedData(mythId, strict);

    if (!report) {
        process.exit(1);
    }

    const validator = new Validator(strict);
    validator.errors = report.errors;
    validator.warnings = report.warnings;
    validator.stats = report.stats;

    validator.printReport();

    // Save report
    const reportPath = path.join(PARSED_DATA_DIR, 'validation_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);

    process.exit(report.summary.passed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    Validator,
    validateParsedData
};
