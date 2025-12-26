#!/usr/bin/env node

/**
 * AGENT 10: DEITY ASSETS VALIDATION & METADATA COMPLETION
 *
 * This script validates all deity assets in Firebase for:
 * - Complete metadata for all 5 rendering modes
 * - Cross-linking completeness
 * - Search and filter metadata
 * - Required fields presence
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEITIES_DIR = 'h:/Github/EyesOfAzrael/firebase-assets-validated/deities';
const OUTPUT_DIR = 'h:/Github/EyesOfAzrael';

// Required fields for complete deity metadata
const REQUIRED_FIELDS = {
    core: ['id', 'type', 'name', 'icon', 'description', 'mythology'],
    metadata: ['metadata.createdBy', 'metadata.source', 'metadata.verified', 'metadata.submissionType'],
    search: ['searchTerms', 'sortName'],
    attributes: ['domains', 'symbols', 'epithets'],
    rendering: ['importance', 'popularity']
};

// Rendering modes to validate
const RENDERING_MODES = {
    hyperlink: 'searchTerms and name for link text',
    expandableRow: 'listDisplay configuration',
    panelCard: 'gridDisplay and panelDisplay configuration',
    subsection: 'description and domains for embedding',
    fullPage: 'all content fields and relatedEntities'
};

// Statistics tracking
const stats = {
    total: 0,
    byMythology: {},
    complete: 0,
    incomplete: 0,
    missingFields: {},
    renderingModes: {
        hyperlink: 0,
        expandableRow: 0,
        panelCard: 0,
        subsection: 0,
        fullPage: 0
    },
    crossLinking: {
        hasRelatedEntities: 0,
        hasRelationships: 0,
        hasArchetypes: 0,
        noCrossLinks: 0
    },
    searchMetadata: {
        hasSearchTerms: 0,
        hasKeywords: 0,
        hasFacets: 0,
        minimal: 0
    }
};

// Issue tracking
const issues = [];
const examples = {
    complete: [],
    incomplete: [],
    missingRendering: []
};

/**
 * Get nested field value
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
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
 * Validate rendering mode completeness
 */
function validateRenderingModes(deity) {
    const modes = {
        hyperlink: false,
        expandableRow: false,
        panelCard: false,
        subsection: false,
        fullPage: false
    };

    // Hyperlink: needs name, searchTerms
    modes.hyperlink = hasField(deity, 'name') && hasField(deity, 'searchTerms');

    // Expandable Row: needs listDisplay config
    modes.expandableRow = hasField(deity, 'listDisplay') ||
                          (hasField(deity, 'name') && hasField(deity, 'description'));

    // Panel Card: needs gridDisplay or panelDisplay
    modes.panelCard = hasField(deity, 'gridDisplay') || hasField(deity, 'panelDisplay') ||
                      (hasField(deity, 'name') && hasField(deity, 'icon') && hasField(deity, 'description'));

    // Subsection: needs description and at least some attributes
    modes.subsection = hasField(deity, 'description') &&
                       (hasField(deity, 'domains') || hasField(deity, 'symbols'));

    // Full Page: needs comprehensive data
    modes.fullPage = hasField(deity, 'description') &&
                     hasField(deity, 'domains') &&
                     hasField(deity, 'symbols') &&
                     hasField(deity, 'primarySources');

    return modes;
}

/**
 * Validate cross-linking
 */
function validateCrossLinking(deity) {
    return {
        hasRelatedEntities: hasField(deity, 'relatedEntities'),
        hasRelationships: hasField(deity, 'relationships'),
        hasArchetypes: hasField(deity, 'archetypes'),
        hasPrimarySources: hasField(deity, 'primarySources')
    };
}

/**
 * Validate search metadata
 */
function validateSearchMetadata(deity) {
    return {
        hasSearchTerms: hasField(deity, 'searchTerms'),
        hasKeywords: hasField(deity, 'corpusSearch'),
        hasSortName: hasField(deity, 'sortName'),
        hasIcon: hasField(deity, 'icon')
    };
}

/**
 * Analyze a single deity file
 */
function analyzeDeity(filePath, mythology) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const deity = JSON.parse(content);

        stats.total++;
        stats.byMythology[mythology] = (stats.byMythology[mythology] || 0) + 1;

        // Track missing fields
        const missing = [];

        // Check core fields
        REQUIRED_FIELDS.core.forEach(field => {
            if (!hasField(deity, field)) {
                missing.push(field);
                stats.missingFields[field] = (stats.missingFields[field] || 0) + 1;
            }
        });

        // Check metadata fields
        REQUIRED_FIELDS.metadata.forEach(field => {
            if (!hasField(deity, field)) {
                missing.push(field);
                stats.missingFields[field] = (stats.missingFields[field] || 0) + 1;
            }
        });

        // Check search fields
        REQUIRED_FIELDS.search.forEach(field => {
            if (!hasField(deity, field)) {
                missing.push(field);
                stats.missingFields[field] = (stats.missingFields[field] || 0) + 1;
            }
        });

        // Check attribute fields (at least one should be present)
        const hasAnyAttribute = REQUIRED_FIELDS.attributes.some(field => hasField(deity, field));
        if (!hasAnyAttribute) {
            missing.push('attributes (domains/symbols/epithets)');
            stats.missingFields['attributes'] = (stats.missingFields['attributes'] || 0) + 1;
        }

        // Validate rendering modes
        const renderingModes = validateRenderingModes(deity);
        Object.keys(renderingModes).forEach(mode => {
            if (renderingModes[mode]) {
                stats.renderingModes[mode]++;
            }
        });

        // Validate cross-linking
        const crossLinks = validateCrossLinking(deity);
        if (crossLinks.hasRelatedEntities) stats.crossLinking.hasRelatedEntities++;
        if (crossLinks.hasRelationships) stats.crossLinking.hasRelationships++;
        if (crossLinks.hasArchetypes) stats.crossLinking.hasArchetypes++;
        if (!crossLinks.hasRelatedEntities && !crossLinks.hasRelationships) {
            stats.crossLinking.noCrossLinks++;
        }

        // Validate search metadata
        const searchMeta = validateSearchMetadata(deity);
        if (searchMeta.hasSearchTerms) stats.searchMetadata.hasSearchTerms++;
        if (searchMeta.hasKeywords) stats.searchMetadata.hasKeywords++;
        if (!searchMeta.hasSearchTerms && !searchMeta.hasKeywords) {
            stats.searchMetadata.minimal++;
        }

        // Determine completeness
        const isComplete = missing.length === 0 &&
                          Object.values(renderingModes).every(v => v) &&
                          (crossLinks.hasRelatedEntities || crossLinks.hasRelationships);

        if (isComplete) {
            stats.complete++;
            if (examples.complete.length < 3) {
                examples.complete.push({ id: deity.id, mythology, file: path.basename(filePath) });
            }
        } else {
            stats.incomplete++;
            if (examples.incomplete.length < 10) {
                examples.incomplete.push({
                    id: deity.id,
                    mythology,
                    file: path.basename(filePath),
                    missing,
                    renderingModes
                });
            }
        }

        // Track rendering mode issues
        const missingModes = Object.keys(renderingModes).filter(mode => !renderingModes[mode]);
        if (missingModes.length > 0 && examples.missingRendering.length < 5) {
            examples.missingRendering.push({
                id: deity.id,
                mythology,
                file: path.basename(filePath),
                missingModes
            });
        }

        return { deity, missing, renderingModes, crossLinks, searchMeta };
    } catch (error) {
        issues.push({
            file: filePath,
            error: error.message
        });
        return null;
    }
}

/**
 * Scan all deity files
 */
function scanDeities() {
    const mythologies = fs.readdirSync(DEITIES_DIR);

    mythologies.forEach(mythology => {
        const mythologyPath = path.join(DEITIES_DIR, mythology);
        const stat = fs.statSync(mythologyPath);

        if (stat.isDirectory()) {
            const files = fs.readdirSync(mythologyPath)
                .filter(f => f.endsWith('.json'));

            files.forEach(file => {
                const filePath = path.join(mythologyPath, file);
                analyzeDeity(filePath, mythology);
            });
        }
    });
}

/**
 * Generate validation report
 */
function generateReport() {
    const completenessPercent = ((stats.complete / stats.total) * 100).toFixed(2);

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalDeities: stats.total,
            complete: stats.complete,
            incomplete: stats.incomplete,
            completenessPercent: `${completenessPercent}%`
        },
        byMythology: stats.byMythology,
        renderingModes: {
            ...stats.renderingModes,
            percentages: Object.keys(stats.renderingModes).reduce((acc, mode) => {
                acc[mode] = `${((stats.renderingModes[mode] / stats.total) * 100).toFixed(2)}%`;
                return acc;
            }, {})
        },
        crossLinking: {
            ...stats.crossLinking,
            percentages: {
                hasRelatedEntities: `${((stats.crossLinking.hasRelatedEntities / stats.total) * 100).toFixed(2)}%`,
                hasRelationships: `${((stats.crossLinking.hasRelationships / stats.total) * 100).toFixed(2)}%`,
                noCrossLinks: `${((stats.crossLinking.noCrossLinks / stats.total) * 100).toFixed(2)}%`
            }
        },
        searchMetadata: {
            ...stats.searchMetadata,
            percentages: {
                hasSearchTerms: `${((stats.searchMetadata.hasSearchTerms / stats.total) * 100).toFixed(2)}%`,
                minimal: `${((stats.searchMetadata.minimal / stats.total) * 100).toFixed(2)}%`
            }
        },
        topMissingFields: Object.entries(stats.missingFields)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([field, count]) => ({
                field,
                count,
                percent: `${((count / stats.total) * 100).toFixed(2)}%`
            })),
        examples: examples,
        issues: issues
    };

    return report;
}

/**
 * Main execution
 */
function main() {
    console.log('🔍 AGENT 10: Deity Assets Validation');
    console.log('=====================================\n');

    console.log('Scanning deity files...');
    scanDeities();

    console.log(`\n✅ Scanned ${stats.total} deity assets`);
    console.log(`📊 Generating validation report...\n`);

    const report = generateReport();

    // Save JSON report
    const jsonPath = path.join(OUTPUT_DIR, 'AGENT_10_DEITY_VALIDATION_REPORT.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 Saved JSON report: ${jsonPath}`);

    // Generate markdown summary
    const mdReport = generateMarkdownReport(report);
    const mdPath = path.join(OUTPUT_DIR, 'AGENT_10_DEITY_VALIDATION_REPORT.md');
    fs.writeFileSync(mdPath, mdReport);
    console.log(`📄 Saved Markdown report: ${mdPath}`);

    // Print summary to console
    console.log('\n' + '='.repeat(50));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Deities: ${report.summary.totalDeities}`);
    console.log(`Complete: ${report.summary.complete} (${report.summary.completenessPercent})`);
    console.log(`Incomplete: ${report.summary.incomplete}`);
    console.log('\nTop Missing Fields:');
    report.topMissingFields.slice(0, 5).forEach(({ field, count, percent }) => {
        console.log(`  - ${field}: ${count} (${percent})`);
    });
    console.log('='.repeat(50) + '\n');
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report) {
    return `# AGENT 10: Deity Assets Validation Report

**Generated:** ${report.timestamp}

## Executive Summary

- **Total Deities:** ${report.summary.totalDeities}
- **Complete:** ${report.summary.complete} (${report.summary.completenessPercent})
- **Incomplete:** ${report.summary.incomplete}

## Breakdown by Mythology

${Object.entries(report.byMythology)
    .sort((a, b) => b[1] - a[1])
    .map(([myth, count]) => `- **${myth}:** ${count} deities`)
    .join('\n')}

## Rendering Mode Support

${Object.entries(report.renderingModes.percentages)
    .map(([mode, percent]) => `- **${mode}:** ${report.renderingModes[mode]}/${report.summary.totalDeities} (${percent})`)
    .join('\n')}

### Rendering Mode Descriptions

- **Hyperlink:** Entity name as clickable link (requires: name, searchTerms)
- **Expandable Row:** List item that expands to show details (requires: listDisplay config)
- **Panel Card:** Visual card with image/icon (requires: gridDisplay/panelDisplay)
- **Subsection:** Embedded content in another page (requires: description, attributes)
- **Full Page:** Complete dedicated page (requires: all fields, relatedEntities)

## Cross-Linking Status

${Object.entries(report.crossLinking.percentages)
    .map(([key, percent]) => `- **${key}:** ${report.crossLinking[key]}/${report.summary.totalDeities} (${percent})`)
    .join('\n')}

## Search & Filter Metadata

${Object.entries(report.searchMetadata.percentages)
    .map(([key, percent]) => `- **${key}:** ${report.searchMetadata[key]}/${report.summary.totalDeities} (${percent})`)
    .join('\n')}

## Top Missing Fields

${report.topMissingFields
    .map((item, i) => `${i + 1}. **${item.field}** - Missing in ${item.count} deities (${item.percent})`)
    .join('\n')}

## Examples

### Complete Deities (Well-Formed)

${report.examples.complete.map(ex => `- **${ex.id}** (${ex.mythology}) - \`${ex.file}\``).join('\n')}

### Incomplete Deities

${report.examples.incomplete.slice(0, 5).map(ex =>
    `- **${ex.id}** (${ex.mythology}) - Missing: ${ex.missing.join(', ')}`
).join('\n')}

### Rendering Mode Issues

${report.examples.missingRendering.map(ex =>
    `- **${ex.id}** (${ex.mythology}) - Missing modes: ${ex.missingModes.join(', ')}`
).join('\n')}

## Issues Encountered

${report.issues.length > 0
    ? report.issues.map(issue => `- **${issue.file}:** ${issue.error}`).join('\n')
    : 'No issues encountered during validation.'}

## Recommendations

### Priority 1: Critical Missing Fields

${report.topMissingFields.slice(0, 3).map(item =>
    `- Add **${item.field}** to ${item.count} deities (${item.percent} of total)`
).join('\n')}

### Priority 2: Rendering Mode Completion

${Object.entries(report.renderingModes)
    .filter(([mode, count]) => mode !== 'percentages' && count < report.summary.totalDeities * 0.9)
    .map(([mode, count]) => {
        const missing = report.summary.totalDeities - count;
        return `- Enhance **${mode}** support for ${missing} deities`;
    })
    .join('\n')}

### Priority 3: Cross-Linking Enhancement

- Add relatedEntities to ${report.summary.totalDeities - report.crossLinking.hasRelatedEntities} deities
- Add relationships to ${report.summary.totalDeities - report.crossLinking.hasRelationships} deities
- ${report.crossLinking.noCrossLinks} deities have NO cross-links at all (critical issue)

### Priority 4: Search Optimization

- Add searchTerms to ${report.summary.totalDeities - report.searchMetadata.hasSearchTerms} deities
- Add corpus search keywords to ${report.summary.totalDeities - report.searchMetadata.hasKeywords} deities

## Next Steps

1. Run the migration script to add missing metadata
2. Manually review the ${report.examples.incomplete.length}+ incomplete deity examples
3. Validate cross-linking references point to valid entities
4. Test all 5 rendering modes with sample deities
5. Generate deity template from complete examples

---

*Report generated by AGENT 10: Deity Assets Validation & Metadata Completion*
`;
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { analyzeDeity, validateRenderingModes, validateCrossLinking, validateSearchMetadata };
