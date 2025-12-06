#!/usr/bin/env node

/**
 * Validate All Entities
 * Runs comprehensive validation on all entity JSON files
 * Usage: node scripts/validate-all-entities.js [--fix] [--verbose]
 */

const fs = require('fs').promises;
const path = require('path');
const EntityValidator = require('./entity-validator');

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');
const outputFormat = args.includes('--json') ? 'json' : 'console';

async function getAllEntityFiles(baseDir) {
    const entitiesDir = path.join(baseDir, 'data', 'entities');
    const types = ['deity', 'item', 'place', 'concept', 'magic', 'creature', 'hero'];
    const files = [];

    for (const type of types) {
        const typeDir = path.join(entitiesDir, type);
        try {
            const fileList = await fs.readdir(typeDir);
            for (const file of fileList) {
                if (file.endsWith('.json')) {
                    files.push({
                        path: path.join(typeDir, file),
                        type,
                        id: file.replace('.json', '')
                    });
                }
            }
        } catch (error) {
            if (verbose) {
                console.warn(`Type directory not found: ${type}`);
            }
        }
    }

    return files;
}

async function validateAll() {
    const baseDir = path.join(__dirname, '..');
    const validator = new EntityValidator({ baseDir });

    console.log('🔍 Initializing entity validator...\n');
    await validator.initialize();

    console.log('📂 Scanning for entity files...\n');
    const entityFiles = await getAllEntityFiles(baseDir);
    console.log(`Found ${entityFiles.length} entity files\n`);

    const results = [];
    let processed = 0;

    for (const file of entityFiles) {
        try {
            const content = await fs.readFile(file.path, 'utf-8');
            const entity = JSON.parse(content);

            const result = validator.validateEntity(entity, file.path);
            results.push(result);

            processed++;

            if (verbose) {
                const status = result.isValid ? '✅' : '❌';
                console.log(`${status} ${file.type}/${file.id}`);

                if (result.errors.length > 0) {
                    result.errors.forEach(err => {
                        console.log(`   ERROR: ${err.message}`);
                    });
                }

                if (result.warnings.length > 0 && verbose) {
                    result.warnings.forEach(warn => {
                        console.log(`   WARN: ${warn.message}`);
                    });
                }
            } else {
                // Progress indicator
                if (processed % 10 === 0) {
                    process.stdout.write(`\rValidating... ${processed}/${entityFiles.length}`);
                }
            }
        } catch (error) {
            console.error(`\n❌ Failed to process ${file.path}:`, error.message);
        }
    }

    if (!verbose) {
        process.stdout.write(`\rValidated ${processed}/${entityFiles.length}\n`);
    }

    // Generate summary
    const summary = validator.getSummary(results);

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    console.log(`Total Entities:       ${summary.total}`);
    console.log(`Valid:                ${summary.valid} (${Math.round(summary.valid/summary.total*100)}%)`);
    console.log(`Invalid:              ${summary.invalid} (${Math.round(summary.invalid/summary.total*100)}%)`);
    console.log(`Critical Errors:      ${summary.criticalErrors}`);
    console.log(`Total Errors:         ${summary.totalErrors}`);
    console.log(`Total Warnings:       ${summary.totalWarnings}`);
    console.log(`Avg Completeness:     ${summary.avgCompleteness}%\n`);

    // By Type
    console.log('By Type:');
    Object.entries(summary.byType).forEach(([type, stats]) => {
        const validPct = Math.round(stats.valid/stats.total*100);
        console.log(`  ${type.padEnd(15)} ${stats.valid}/${stats.total} valid (${validPct}%)`);
    });

    // Show critical errors
    if (summary.criticalErrors > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('CRITICAL ERRORS');
        console.log('='.repeat(60) + '\n');

        results.forEach(result => {
            const criticalErrors = result.errors.filter(e => e.severity === 'critical');
            if (criticalErrors.length > 0) {
                console.log(`\n${result.entity.type}/${result.entity.id}:`);
                criticalErrors.forEach(err => {
                    console.log(`  ❌ ${err.field}: ${err.message}`);
                });
            }
        });
    }

    // Show entities with low completeness
    console.log('\n' + '='.repeat(60));
    console.log('LOW COMPLETENESS ENTITIES (< 50%)');
    console.log('='.repeat(60) + '\n');

    const lowCompleteness = results
        .map(r => {
            const comp = r.info.find(i => i.field === 'completeness');
            return {
                entity: r.entity,
                completeness: comp ? comp.percentage : 0
            };
        })
        .filter(r => r.completeness < 50)
        .sort((a, b) => a.completeness - b.completeness);

    if (lowCompleteness.length > 0) {
        lowCompleteness.slice(0, 20).forEach(item => {
            console.log(`  ${item.entity.type}/${item.entity.id}: ${item.completeness}%`);
        });

        if (lowCompleteness.length > 20) {
            console.log(`  ... and ${lowCompleteness.length - 20} more`);
        }
    } else {
        console.log('  All entities have >= 50% completeness!');
    }

    // Save detailed report
    const reportsDir = path.join(baseDir, 'scripts', 'reports');
    try {
        await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = path.join(reportsDir, `entity-validation-${timestamp}.json`);

    const report = {
        generated: new Date().toISOString(),
        summary,
        results: results.map(r => ({
            entity: r.entity,
            isValid: r.isValid,
            errors: r.errors,
            warnings: r.warnings,
            completeness: r.info.find(i => i.field === 'completeness')?.percentage || 0
        }))
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit code based on validation result
    if (summary.criticalErrors > 0) {
        console.log('\n❌ Validation failed with critical errors');
        process.exit(1);
    } else if (summary.invalid > 0) {
        console.log('\n⚠️  Validation completed with warnings');
        process.exit(0);
    } else {
        console.log('\n✅ All entities validated successfully!');
        process.exit(0);
    }
}

// Run validation
validateAll().catch(error => {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
});
