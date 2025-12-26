#!/usr/bin/env node

/**
 * AGENT 10: DEITY METADATA MIGRATION SCRIPT
 *
 * This script automatically adds missing metadata to deity assets:
 * - Adds missing metadata fields (createdBy, source, verified, submissionType)
 * - Adds rendering mode configuration
 * - Enhances search/filter metadata
 * - Preserves all existing data
 *
 * Usage:
 *   node AGENT_10_DEITY_MIGRATION_SCRIPT.js [--dry-run] [--mythology=greek]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEITIES_DIR = 'h:/Github/EyesOfAzrael/firebase-assets-validated/deities';
const BACKUP_DIR = 'h:/Github/EyesOfAzrael/firebase-assets-backup-' + new Date().toISOString().replace(/[:.]/g, '-');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const mythologyFilter = args.find(arg => arg.startsWith('--mythology='))?.split('=')[1];

// Statistics
const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    changes: {
        addedMetadata: 0,
        addedRendering: 0,
        addedSearchFacets: 0,
        enhancedAttributes: 0
    }
};

/**
 * Get nested field value
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

/**
 * Set nested field value
 */
function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((curr, prop) => {
        if (!(prop in curr)) curr[prop] = {};
        return curr[prop];
    }, obj);
    target[last] = value;
}

/**
 * Check if deity has field
 */
function hasField(deity, fieldPath) {
    const value = getNestedValue(deity, fieldPath);
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== '';
}

/**
 * Add missing metadata fields
 */
function addMissingMetadata(deity) {
    let changed = false;

    if (!hasField(deity, 'metadata')) {
        deity.metadata = {};
        changed = true;
    }

    if (!hasField(deity, 'metadata.createdBy')) {
        deity.metadata.createdBy = 'system';
        changed = true;
    }

    if (!hasField(deity, 'metadata.source')) {
        deity.metadata.source = 'migration_enhancement';
        changed = true;
    }

    if (!hasField(deity, 'metadata.verified')) {
        deity.metadata.verified = false;
        changed = true;
    }

    if (!hasField(deity, 'metadata.submissionType')) {
        deity.metadata.submissionType = 'system';
        changed = true;
    }

    if (!hasField(deity, 'metadata.updatedAt')) {
        deity.metadata.updatedAt = {
            _seconds: Math.floor(Date.now() / 1000),
            _nanoseconds: 0
        };
        changed = true;
    }

    if (changed) {
        stats.changes.addedMetadata++;
    }

    return changed;
}

/**
 * Add rendering configuration
 */
function addRenderingConfig(deity) {
    let changed = false;

    if (!hasField(deity, 'rendering')) {
        deity.rendering = {
            modes: {
                hyperlink: true,
                expandableRow: true,
                panelCard: true,
                subsection: hasField(deity, 'description') && (hasField(deity, 'domains') || hasField(deity, 'symbols')),
                fullPage: hasField(deity, 'description') && hasField(deity, 'domains') && hasField(deity, 'symbols') && hasField(deity, 'primarySources')
            },
            defaultMode: 'panelCard',
            defaultAction: 'page'
        };
        changed = true;
        stats.changes.addedRendering++;
    }

    return changed;
}

/**
 * Enhance search metadata
 */
function enhanceSearchMetadata(deity) {
    let changed = false;

    // Add search facets if missing
    if (!hasField(deity, 'search')) {
        deity.search = {
            facets: {
                culture: deity.mythology || 'unknown',
                domain: deity.domains || [],
                gender: 'unknown',
                powerLevel: deity.importance > 80 ? 'supreme' : deity.importance > 60 ? 'major' : 'minor',
                role: [],
                archetype: deity.archetypes || []
            },
            keywords: deity.searchTerms || [],
            aliases: deity.displayName ? [deity.displayName] : [],
            searchableText: generateSearchableText(deity)
        };
        changed = true;
        stats.changes.addedSearchFacets++;
    }

    return changed;
}

/**
 * Generate searchable text from deity data
 */
function generateSearchableText(deity) {
    const parts = [
        deity.name,
        deity.displayName,
        deity.description,
        deity.subtitle,
        ...(deity.domains || []),
        ...(deity.symbols || []),
        ...(deity.epithets || []),
        deity.mythology
    ];

    return parts
        .filter(p => p)
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Enhance deity attributes
 */
function enhanceAttributes(deity) {
    let changed = false;

    // Ensure arrays exist
    if (!hasField(deity, 'domains') && !hasField(deity, 'symbols') && !hasField(deity, 'epithets')) {
        // Try to extract from rawMetadata or description
        if (hasField(deity, 'rawMetadata.domains')) {
            deity.domains = deity.rawMetadata.domains;
            changed = true;
        }
        if (hasField(deity, 'rawMetadata.symbols')) {
            deity.symbols = deity.rawMetadata.symbols;
            changed = true;
        }
        if (hasField(deity, 'rawMetadata.epithets')) {
            deity.epithets = deity.rawMetadata.epithets;
            changed = true;
        }

        if (changed) {
            stats.changes.enhancedAttributes++;
        }
    }

    return changed;
}

/**
 * Add display configurations if missing
 */
function addDisplayConfigs(deity) {
    let changed = false;

    // Add listDisplay if missing
    if (!hasField(deity, 'listDisplay')) {
        deity.listDisplay = {
            icon: deity.icon || '🔷',
            primary: deity.name || 'Unknown',
            secondary: deity.subtitle || deity.description?.substring(0, 100) || '',
            meta: `${deity.mythology || 'Unknown'} Mythology`,
            expandable: true,
            expandedContent: deity.description || ''
        };
        changed = true;
    }

    // Add gridDisplay if missing
    if (!hasField(deity, 'gridDisplay')) {
        deity.gridDisplay = {
            title: deity.name || 'Unknown',
            subtitle: deity.subtitle || (deity.domains?.[0] || 'Deity'),
            badge: deity.mythology ? deity.mythology.charAt(0).toUpperCase() + deity.mythology.slice(1) : 'Unknown',
            image: deity.icon || '🔷',
            stats: [
                {
                    label: 'Domain',
                    value: deity.domains?.[0] || 'Unknown'
                },
                {
                    label: 'Symbol',
                    value: deity.symbols?.[0] || deity.icon || '🔷'
                }
            ],
            hoverInfo: {
                quick: deity.description?.substring(0, 150) || '',
                domains: deity.domains?.slice(0, 4) || []
            }
        };
        changed = true;
    }

    return changed;
}

/**
 * Migrate a single deity file
 */
function migrateDeity(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const deity = JSON.parse(content);

        let hasChanges = false;

        // Apply migrations
        hasChanges = addMissingMetadata(deity) || hasChanges;
        hasChanges = addRenderingConfig(deity) || hasChanges;
        hasChanges = enhanceSearchMetadata(deity) || hasChanges;
        hasChanges = enhanceAttributes(deity) || hasChanges;
        hasChanges = addDisplayConfigs(deity) || hasChanges;

        if (hasChanges) {
            // Update version tracking
            deity._version = '2.1';
            deity._modified = new Date().toISOString();
            deity._migrated = true;
            deity._migratedAt = new Date().toISOString();

            if (!isDryRun) {
                fs.writeFileSync(filePath, JSON.stringify(deity, null, 2));
            }

            stats.updated++;
            return { updated: true, deity };
        } else {
            stats.skipped++;
            return { updated: false, deity };
        }
    } catch (error) {
        stats.errors++;
        console.error(`Error processing ${filePath}: ${error.message}`);
        return { updated: false, error: error.message };
    }
}

/**
 * Create backup before migration
 */
function createBackup() {
    if (isDryRun) {
        console.log('Dry run mode - skipping backup');
        return;
    }

    console.log(`Creating backup at: ${BACKUP_DIR}`);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const mythologies = fs.readdirSync(DEITIES_DIR);
    mythologies.forEach(mythology => {
        const mythologyPath = path.join(DEITIES_DIR, mythology);
        const stat = fs.statSync(mythologyPath);

        if (stat.isDirectory()) {
            const backupMythPath = path.join(BACKUP_DIR, mythology);
            fs.mkdirSync(backupMythPath, { recursive: true });

            const files = fs.readdirSync(mythologyPath).filter(f => f.endsWith('.json'));
            files.forEach(file => {
                const srcPath = path.join(mythologyPath, file);
                const dstPath = path.join(backupMythPath, file);
                fs.copyFileSync(srcPath, dstPath);
            });
        }
    });

    console.log(`Backup created successfully\n`);
}

/**
 * Scan and migrate all deity files
 */
function migrateAllDeities() {
    const mythologies = fs.readdirSync(DEITIES_DIR);

    mythologies.forEach(mythology => {
        // Skip if mythology filter is specified and doesn't match
        if (mythologyFilter && mythology !== mythologyFilter) {
            return;
        }

        const mythologyPath = path.join(DEITIES_DIR, mythology);
        const stat = fs.statSync(mythologyPath);

        if (stat.isDirectory()) {
            console.log(`Processing ${mythology}...`);

            const files = fs.readdirSync(mythologyPath)
                .filter(f => f.endsWith('.json'));

            files.forEach(file => {
                const filePath = path.join(mythologyPath, file);
                stats.total++;
                migrateDeity(filePath);
            });
        }
    });
}

/**
 * Generate migration report
 */
function generateReport() {
    const report = {
        timestamp: new Date().toISOString(),
        mode: isDryRun ? 'DRY RUN' : 'LIVE',
        filter: mythologyFilter || 'ALL',
        summary: {
            total: stats.total,
            updated: stats.updated,
            skipped: stats.skipped,
            errors: stats.errors,
            updatePercent: ((stats.updated / stats.total) * 100).toFixed(2) + '%'
        },
        changes: stats.changes
    };

    const reportPath = 'h:/Github/EyesOfAzrael/AGENT_10_MIGRATION_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
}

/**
 * Main execution
 */
function main() {
    console.log('🔧 AGENT 10: Deity Metadata Migration');
    console.log('======================================\n');

    if (isDryRun) {
        console.log('⚠️  DRY RUN MODE - No files will be modified\n');
    }

    if (mythologyFilter) {
        console.log(`📁 Filtering to mythology: ${mythologyFilter}\n`);
    }

    // Create backup
    if (!isDryRun) {
        createBackup();
    }

    // Run migration
    console.log('Migrating deity files...\n');
    migrateAllDeities();

    // Generate report
    const report = generateReport();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Mode: ${report.mode}`);
    console.log(`Total Files: ${report.summary.total}`);
    console.log(`Updated: ${report.summary.updated}`);
    console.log(`Skipped: ${report.summary.skipped}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Update Rate: ${report.summary.updatePercent}`);
    console.log('\nChanges Applied:');
    console.log(`  - Added Metadata: ${report.changes.addedMetadata}`);
    console.log(`  - Added Rendering Config: ${report.changes.addedRendering}`);
    console.log(`  - Added Search Facets: ${report.changes.addedSearchFacets}`);
    console.log(`  - Enhanced Attributes: ${report.changes.enhancedAttributes}`);
    console.log('='.repeat(50) + '\n');

    if (isDryRun) {
        console.log('✅ Dry run complete - Review changes and run without --dry-run to apply');
    } else {
        console.log('✅ Migration complete!');
        console.log(`📦 Backup saved to: ${BACKUP_DIR}`);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { migrateDeity, addMissingMetadata, enhanceSearchMetadata };
