/**
 * Firebase Asset Display Mode Verification Script
 *
 * Verifies all Firebase assets can be rendered in all display modes:
 * - page: name, description, type, mythology
 * - panel: name, description, icon, type
 * - card: name, icon, type
 * - table-row: name, type, mythology
 * - short-description: name, description (50+ chars)
 * - link: name, id
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Display mode requirements
const DISPLAY_MODES = {
    page: ['name', 'fullDescription', 'type', 'primaryMythology'],
    panel: ['name', 'fullDescription', 'icon', 'type'],
    card: ['name', 'icon', 'type'],
    'table-row': ['name', 'type', 'primaryMythology'],
    'short-description': ['name', 'shortDescription'],
    link: ['name', 'id']
};

// Type-specific icon fallbacks
const TYPE_ICONS = {
    deity: '✨',
    hero: '⚔️',
    creature: '🐉',
    place: '🏛️',
    item: '⚡',
    concept: '💭',
    magic: '🔮',
    archetype: '🎭'
};

class DisplayModeVerifier {
    constructor() {
        this.issues = [];
        this.fixes = [];
        this.stats = {
            totalEntities: 0,
            fullyCompliant: 0,
            needsFixes: 0,
            byDisplayMode: {},
            byType: {}
        };

        // Initialize stats
        Object.keys(DISPLAY_MODES).forEach(mode => {
            this.stats.byDisplayMode[mode] = { pass: 0, fail: 0 };
        });
    }

    /**
     * Check if a field exists and is valid
     */
    checkField(entity, field, displayMode) {
        const value = this.getNestedValue(entity, field);

        // Special validation rules
        if (field === 'shortDescription') {
            if (!value || value.length < 50) {
                return {
                    valid: false,
                    reason: `shortDescription too short (${value?.length || 0} chars, need 50+)`
                };
            }
        } else if (field === 'fullDescription') {
            if (!value || value.length < 100) {
                return {
                    valid: false,
                    reason: `fullDescription too short (${value?.length || 0} chars, need 100+)`
                };
            }
        } else if (field === 'icon') {
            if (!value || value.trim() === '') {
                return {
                    valid: false,
                    reason: 'icon missing or empty'
                };
            }
        } else if (!value) {
            return {
                valid: false,
                reason: `${field} is missing or null`
            };
        }

        return { valid: true };
    }

    /**
     * Get nested object value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Generate fixes for missing fields
     */
    generateFixes(entity, missingFields) {
        const fixes = {};

        missingFields.forEach(field => {
            switch(field) {
                case 'icon':
                    fixes.icon = this.generateIcon(entity);
                    break;

                case 'shortDescription':
                    fixes.shortDescription = this.generateShortDescription(entity);
                    break;

                case 'fullDescription':
                    fixes.fullDescription = this.generateFullDescription(entity);
                    break;

                case 'primaryMythology':
                    // Use first mythology if available
                    if (entity.mythologies && entity.mythologies.length > 0) {
                        fixes.primaryMythology = entity.mythologies[0];
                    }
                    break;
            }
        });

        return fixes;
    }

    /**
     * Generate icon from name or type
     */
    generateIcon(entity) {
        // Try type-specific icon first
        if (entity.type && TYPE_ICONS[entity.type]) {
            return TYPE_ICONS[entity.type];
        }

        // Fallback: first letter emoji
        if (entity.name) {
            const firstChar = entity.name[0].toUpperCase();
            return `${firstChar}`;
        }

        return '✨';
    }

    /**
     * Generate full description from short description or entity data
     */
    generateFullDescription(entity) {
        // If shortDescription exists and is long enough, expand it
        if (entity.shortDescription && entity.shortDescription.length >= 50) {
            const base = entity.shortDescription;

            // Add mythology context if short
            if (base.length < 100) {
                const mythology = entity.primaryMythology || entity.mythologies?.[0];
                if (mythology) {
                    return `${base} This ${entity.type} holds significant importance in ${mythology} mythology and spiritual traditions.`;
                }
            }

            return base;
        }

        // Build comprehensive description from available data
        const parts = [];
        const mythology = entity.primaryMythology || entity.mythologies?.[0] || 'ancient';

        // Opening statement
        parts.push(`${entity.name} is a significant ${entity.type} from ${mythology} mythology.`);

        // Add type-specific context
        const typeContext = {
            deity: 'This divine being plays an important role in the pantheon and spiritual practices.',
            hero: 'This legendary figure embodies heroic virtues and serves as an exemplar of human potential.',
            creature: 'This mythological being represents powerful forces and archetypal symbols in the tradition.',
            place: 'This sacred location holds deep spiritual significance and features prominently in mythological narratives.',
            item: 'This sacred object possesses special powers and symbolic meaning within the tradition.',
            concept: 'This philosophical and spiritual concept forms a fundamental part of the worldview and practice.',
            magic: 'This mystical practice or ritual tradition forms an important part of the spiritual heritage.'
        };

        if (typeContext[entity.type]) {
            parts.push(typeContext[entity.type]);
        }

        return parts.join(' ');
    }

    /**
     * Generate short description from full description
     */
    generateShortDescription(entity) {
        if (entity.fullDescription && entity.fullDescription.length >= 50) {
            // Take first 150 chars and find last complete word
            let desc = entity.fullDescription.substring(0, 150);
            const lastSpace = desc.lastIndexOf(' ');
            if (lastSpace > 50) {
                desc = desc.substring(0, lastSpace) + '...';
            }
            return desc;
        }

        // Build from available data
        const parts = [entity.name];

        if (entity.type) {
            parts.push(`- ${entity.type}`);
        }

        if (entity.primaryMythology || entity.mythologies?.[0]) {
            const myth = entity.primaryMythology || entity.mythologies[0];
            parts.push(`from ${myth} mythology`);
        }

        return parts.join(' ');
    }

    /**
     * Verify a single entity
     */
    verifyEntity(entity, filePath) {
        this.stats.totalEntities++;

        // Track by type
        const type = entity.type || 'unknown';
        if (!this.stats.byType[type]) {
            this.stats.byType[type] = { total: 0, compliant: 0 };
        }
        this.stats.byType[type].total++;

        const entityIssues = {
            id: entity.id,
            file: path.relative('H:/Github/EyesOfAzrael', filePath),
            type: entity.type,
            name: entity.name,
            modes: {}
        };

        let hasAnyIssue = false;

        // Check each display mode
        Object.entries(DISPLAY_MODES).forEach(([mode, requiredFields]) => {
            const modeIssues = [];

            requiredFields.forEach(field => {
                const check = this.checkField(entity, field, mode);
                if (!check.valid) {
                    modeIssues.push({
                        field,
                        reason: check.reason
                    });
                    hasAnyIssue = true;
                    this.stats.byDisplayMode[mode].fail++;
                } else {
                    this.stats.byDisplayMode[mode].pass++;
                }
            });

            if (modeIssues.length > 0) {
                entityIssues.modes[mode] = modeIssues;
            }
        });

        // Generate fixes if needed
        if (hasAnyIssue) {
            this.stats.needsFixes++;

            // Collect all missing fields
            const allMissingFields = new Set();
            Object.values(entityIssues.modes).forEach(modeIssues => {
                modeIssues.forEach(issue => allMissingFields.add(issue.field));
            });

            const fixes = this.generateFixes(entity, Array.from(allMissingFields));

            this.issues.push(entityIssues);
            this.fixes.push({
                id: entity.id,
                file: filePath,
                fixes
            });
        } else {
            this.stats.fullyCompliant++;
            this.stats.byType[type].compliant++;
        }
    }

    /**
     * Verify all entities
     */
    async verifyAll() {
        console.log('🔍 Scanning for entity files...\n');

        const entityFiles = glob.sync('H:/Github/EyesOfAzrael/data/entities/**/*.json', {
            ignore: ['**/migration-report.json']
        });

        console.log(`Found ${entityFiles.length} entity files\n`);

        entityFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const entity = JSON.parse(content);
                this.verifyEntity(entity, file);
            } catch (error) {
                console.error(`❌ Error reading ${file}:`, error.message);
            }
        });
    }

    /**
     * Generate detailed report
     */
    generateReport() {
        const report = {
            summary: {
                timestamp: new Date().toISOString(),
                totalEntities: this.stats.totalEntities,
                fullyCompliant: this.stats.fullyCompliant,
                needsFixes: this.stats.needsFixes,
                complianceRate: ((this.stats.fullyCompliant / this.stats.totalEntities) * 100).toFixed(2) + '%'
            },
            byDisplayMode: {},
            byType: this.stats.byType,
            issues: this.issues,
            fixes: this.fixes
        };

        // Calculate per-mode stats
        Object.entries(this.stats.byDisplayMode).forEach(([mode, stats]) => {
            const total = stats.pass + stats.fail;
            report.byDisplayMode[mode] = {
                pass: stats.pass,
                fail: stats.fail,
                total,
                passRate: total > 0 ? ((stats.pass / total) * 100).toFixed(2) + '%' : '0%'
            };
        });

        return report;
    }

    /**
     * Print summary to console
     */
    printSummary(report) {
        console.log('\n' + '='.repeat(80));
        console.log('FIREBASE DISPLAY MODE VERIFICATION REPORT');
        console.log('='.repeat(80) + '\n');

        console.log('📊 SUMMARY');
        console.log('-'.repeat(80));
        console.log(`Total Entities:     ${report.summary.totalEntities}`);
        console.log(`Fully Compliant:    ${report.summary.fullyCompliant} (${report.summary.complianceRate})`);
        console.log(`Need Fixes:         ${report.summary.needsFixes}`);
        console.log('');

        console.log('📋 BY DISPLAY MODE');
        console.log('-'.repeat(80));
        Object.entries(report.byDisplayMode).forEach(([mode, stats]) => {
            console.log(`${mode.padEnd(20)} Pass: ${stats.pass.toString().padStart(4)} | Fail: ${stats.fail.toString().padStart(4)} | Rate: ${stats.passRate}`);
        });
        console.log('');

        console.log('🏷️  BY TYPE');
        console.log('-'.repeat(80));
        Object.entries(report.byType).forEach(([type, stats]) => {
            const rate = ((stats.compliant / stats.total) * 100).toFixed(2);
            console.log(`${type.padEnd(15)} Total: ${stats.total.toString().padStart(4)} | Compliant: ${stats.compliant.toString().padStart(4)} | Rate: ${rate}%`);
        });
        console.log('');

        if (this.issues.length > 0) {
            console.log('⚠️  TOP ISSUES (first 10)');
            console.log('-'.repeat(80));
            this.issues.slice(0, 10).forEach(issue => {
                console.log(`\n${issue.name} (${issue.id}) - ${issue.file}`);
                Object.entries(issue.modes).forEach(([mode, modeIssues]) => {
                    console.log(`  ${mode}:`);
                    modeIssues.forEach(mi => {
                        console.log(`    ❌ ${mi.field}: ${mi.reason}`);
                    });
                });
            });
            console.log('');
        }
    }

    /**
     * Save reports to files
     */
    saveReports(report) {
        const reportDir = 'H:/Github/EyesOfAzrael/scripts/reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

        // Full JSON report
        const reportPath = path.join(reportDir, `display-mode-verification-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Full report saved: ${reportPath}`);

        // Fixes batch file
        if (this.fixes.length > 0) {
            const fixesPath = path.join(reportDir, `display-mode-fixes-${timestamp}.json`);
            fs.writeFileSync(fixesPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                totalFixes: this.fixes.length,
                fixes: this.fixes
            }, null, 2));
            console.log(`🔧 Fixes file saved: ${fixesPath}`);
        }
    }
}

// Run verification
async function main() {
    const verifier = new DisplayModeVerifier();

    await verifier.verifyAll();
    const report = verifier.generateReport();

    verifier.printSummary(report);
    verifier.saveReports(report);

    console.log('\n✅ Verification complete!\n');

    // Exit with error code if there are issues
    if (verifier.stats.needsFixes > 0) {
        console.log(`⚠️  ${verifier.stats.needsFixes} entities need fixes. Run apply-display-mode-fixes.js to apply them.\n`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
