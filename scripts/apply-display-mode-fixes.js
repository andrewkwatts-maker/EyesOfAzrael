/**
 * Apply Display Mode Fixes
 *
 * Applies fixes from display mode verification to entity files
 */

const fs = require('fs');
const path = require('path');

class FixApplier {
    constructor(fixesFile) {
        this.fixesFile = fixesFile;
        this.stats = {
            totalFixes: 0,
            applied: 0,
            failed: 0,
            skipped: 0
        };
    }

    /**
     * Load fixes from file
     */
    loadFixes() {
        if (!fs.existsSync(this.fixesFile)) {
            throw new Error(`Fixes file not found: ${this.fixesFile}`);
        }

        const content = fs.readFileSync(this.fixesFile, 'utf8');
        const data = JSON.parse(content);

        return data.fixes || [];
    }

    /**
     * Apply fixes to a single entity
     */
    applyEntityFixes(fix) {
        try {
            // Read current entity
            const content = fs.readFileSync(fix.file, 'utf8');
            const entity = JSON.parse(content);

            // Apply fixes
            Object.entries(fix.fixes).forEach(([field, value]) => {
                // Handle nested fields
                if (field.includes('.')) {
                    const parts = field.split('.');
                    let current = entity;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) {
                            current[parts[i]] = {};
                        }
                        current = current[parts[i]];
                    }
                    current[parts[parts.length - 1]] = value;
                } else {
                    entity[field] = value;
                }
            });

            // Update metadata
            if (!entity.metadata) {
                entity.metadata = {};
            }
            entity.metadata.lastModified = new Date().toISOString();
            if (!entity.metadata.version) {
                entity.metadata.version = '2.0';
            }

            // Write back
            fs.writeFileSync(fix.file, JSON.stringify(entity, null, 2) + '\n');

            this.stats.applied++;
            console.log(`✅ ${entity.name || entity.id}: Applied ${Object.keys(fix.fixes).length} fixes`);

            return true;
        } catch (error) {
            this.stats.failed++;
            console.error(`❌ Failed to apply fixes to ${fix.file}:`, error.message);
            return false;
        }
    }

    /**
     * Apply all fixes
     */
    applyAll(dryRun = false) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`APPLYING DISPLAY MODE FIXES${dryRun ? ' (DRY RUN)' : ''}`);
        console.log(`${'='.repeat(80)}\n`);

        const fixes = this.loadFixes();
        this.stats.totalFixes = fixes.length;

        console.log(`📦 Loaded ${fixes.length} fixes from ${this.fixesFile}\n`);

        if (dryRun) {
            console.log('🔍 DRY RUN MODE - No files will be modified\n');
            fixes.forEach(fix => {
                console.log(`\n${fix.id}:`);
                Object.entries(fix.fixes).forEach(([field, value]) => {
                    const preview = typeof value === 'string' && value.length > 60
                        ? value.substring(0, 60) + '...'
                        : value;
                    console.log(`  ${field}: ${preview}`);
                });
            });
            console.log(`\n✅ Dry run complete. ${fixes.length} fixes ready to apply.\n`);
            return;
        }

        console.log('🔧 Applying fixes...\n');

        fixes.forEach(fix => {
            this.applyEntityFixes(fix);
        });

        console.log(`\n${'='.repeat(80)}`);
        console.log('RESULTS');
        console.log(`${'='.repeat(80)}\n`);
        console.log(`Total Fixes:  ${this.stats.totalFixes}`);
        console.log(`Applied:      ${this.stats.applied}`);
        console.log(`Failed:       ${this.stats.failed}`);
        console.log(`Skipped:      ${this.stats.skipped}`);
        console.log('');

        if (this.stats.failed > 0) {
            console.log(`⚠️  ${this.stats.failed} fixes failed. Check errors above.\n`);
            process.exit(1);
        } else {
            console.log(`✅ All fixes applied successfully!\n`);
        }
    }
}

// Main
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
Usage: node apply-display-mode-fixes.js <fixes-file> [--dry-run]

Arguments:
  fixes-file    Path to the fixes JSON file (from verify-display-modes.js)
  --dry-run     Preview fixes without applying them

Example:
  node apply-display-mode-fixes.js scripts/reports/display-mode-fixes-2025-12-27.json
  node apply-display-mode-fixes.js scripts/reports/display-mode-fixes-2025-12-27.json --dry-run
        `);
        process.exit(0);
    }

    const fixesFile = args[0];
    const dryRun = args.includes('--dry-run');

    const applier = new FixApplier(fixesFile);
    applier.applyAll(dryRun);
}

main();
