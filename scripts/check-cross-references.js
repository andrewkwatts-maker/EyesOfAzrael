#!/usr/bin/env node

/**
 * Check Cross-References
 * Validates that all entity cross-references point to existing entities
 * Usage: node scripts/check-cross-references.js [--verbose] [--fix]
 */

const fs = require('fs').promises;
const path = require('path');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const shouldFix = args.includes('--fix');

const baseDir = path.join(__dirname, '..');
const entitiesDir = path.join(baseDir, 'data', 'entities');

// Track all entities
const allEntities = new Map(); // key: "type:id", value: entity data
const brokenReferences = [];
const orphanedEntities = [];

async function loadAllEntities() {
    const types = ['deity', 'item', 'place', 'concept', 'magic', 'creature', 'hero'];
    console.log('📂 Loading all entities...\n');

    for (const type of types) {
        const typeDir = path.join(entitiesDir, type);
        try {
            const files = await fs.readdir(typeDir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filepath = path.join(typeDir, file);
                const content = await fs.readFile(filepath, 'utf-8');
                const entity = JSON.parse(content);

                const key = `${type}:${entity.id}`;
                allEntities.set(key, {
                    ...entity,
                    _filepath: filepath,
                    _type: type
                });

                if (verbose) {
                    console.log(`  Loaded ${key}`);
                }
            }
        } catch (error) {
            if (verbose) {
                console.warn(`  Type directory not found: ${type}`);
            }
        }
    }

    console.log(`\n✅ Loaded ${allEntities.size} entities\n`);
}

async function checkCrossReferences() {
    console.log('🔍 Checking cross-references...\n');

    const entityKeys = Array.from(allEntities.keys());
    const referencedEntities = new Set();

    for (const key of entityKeys) {
        const entity = allEntities.get(key);
        const related = entity.relatedEntities;

        if (!related) continue;

        // Check each category of related entities
        for (const [category, entities] of Object.entries(related)) {
            if (!Array.isArray(entities)) continue;

            for (const ref of entities) {
                if (!ref.id) {
                    brokenReferences.push({
                        source: key,
                        category,
                        issue: 'Missing id in reference',
                        reference: ref
                    });
                    continue;
                }

                // Determine expected type from category
                const expectedType = category.replace(/s$/, ''); // Remove trailing 's'
                const refKey = ref.type ? `${ref.type}:${ref.id}` : `${expectedType}:${ref.id}`;

                // Mark as referenced
                referencedEntities.add(refKey);

                // Check if entity exists
                if (!allEntities.has(refKey)) {
                    brokenReferences.push({
                        source: key,
                        category,
                        reference: refKey,
                        issue: `Referenced entity not found: ${refKey}`,
                        name: ref.name
                    });

                    if (verbose) {
                        console.log(`  ❌ ${key} -> ${refKey} (NOT FOUND)`);
                    }
                }

                // Validate URL if present
                if (ref.url) {
                    const urlCheck = validateURL(ref.url, ref.id, ref.type || expectedType);
                    if (!urlCheck.valid) {
                        brokenReferences.push({
                            source: key,
                            category,
                            reference: refKey,
                            issue: `Invalid URL: ${urlCheck.error}`,
                            url: ref.url
                        });
                    }
                }
            }
        }

        // Check mythology contexts references
        if (entity.mythologyContexts) {
            for (const context of entity.mythologyContexts) {
                if (context.associatedDeities) {
                    for (const deity of context.associatedDeities) {
                        const refKey = `deity:${deity.id}`;
                        referencedEntities.add(refKey);

                        if (!allEntities.has(refKey)) {
                            brokenReferences.push({
                                source: key,
                                category: 'mythologyContexts.associatedDeities',
                                reference: refKey,
                                issue: `Referenced deity not found: ${refKey}`,
                                name: deity.name
                            });
                        }
                    }
                }
            }
        }
    }

    // Find orphaned entities (never referenced by others)
    for (const key of entityKeys) {
        if (!referencedEntities.has(key)) {
            orphanedEntities.push(key);
        }
    }

    console.log(`✅ Cross-reference check complete\n`);
}

function validateURL(url, id, type) {
    // Expected URL format: /mythos/{mythology}/{type}s/{id}.html
    const pattern = /^\/mythos\/[a-z]+\/[a-z]+s\/[a-z0-9-]+\.html$/;

    if (!pattern.test(url)) {
        return {
            valid: false,
            error: `URL doesn't match expected pattern: ${url}`
        };
    }

    // Extract ID from URL
    const parts = url.split('/');
    const urlId = parts[parts.length - 1].replace('.html', '');

    if (urlId !== id) {
        return {
            valid: false,
            error: `URL ID (${urlId}) doesn't match entity ID (${id})`
        };
    }

    return { valid: true };
}

async function printReport() {
    console.log('='.repeat(60));
    console.log('CROSS-REFERENCE VALIDATION REPORT');
    console.log('='.repeat(60) + '\n');

    console.log(`Total Entities:        ${allEntities.size}`);
    console.log(`Broken References:     ${brokenReferences.length}`);
    console.log(`Orphaned Entities:     ${orphanedEntities.length}\n`);

    if (brokenReferences.length > 0) {
        console.log('='.repeat(60));
        console.log('BROKEN REFERENCES');
        console.log('='.repeat(60) + '\n');

        // Group by issue type
        const byIssue = {};
        brokenReferences.forEach(ref => {
            const issue = ref.issue.split(':')[0];
            if (!byIssue[issue]) {
                byIssue[issue] = [];
            }
            byIssue[issue].push(ref);
        });

        Object.entries(byIssue).forEach(([issue, refs]) => {
            console.log(`\n${issue} (${refs.length}):`);
            refs.slice(0, 10).forEach(ref => {
                console.log(`  ${ref.source} -> ${ref.reference || ref.name}`);
                console.log(`    ${ref.issue}`);
            });

            if (refs.length > 10) {
                console.log(`  ... and ${refs.length - 10} more`);
            }
        });
    } else {
        console.log('✅ No broken references found!\n');
    }

    if (orphanedEntities.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('ORPHANED ENTITIES (Never Referenced)');
        console.log('='.repeat(60) + '\n');

        orphanedEntities.slice(0, 20).forEach(key => {
            const entity = allEntities.get(key);
            console.log(`  ${key} - ${entity.name}`);
        });

        if (orphanedEntities.length > 20) {
            console.log(`  ... and ${orphanedEntities.length - 20} more`);
        }

        console.log('\nNote: Orphaned entities are not necessarily errors.');
        console.log('They may be new entities or standalone concepts.');
    }

    // Save detailed report
    const reportsDir = path.join(baseDir, 'scripts', 'reports');
    try {
        await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = path.join(reportsDir, `cross-reference-check-${timestamp}.json`);

    const report = {
        generated: new Date().toISOString(),
        summary: {
            totalEntities: allEntities.size,
            brokenReferences: brokenReferences.length,
            orphanedEntities: orphanedEntities.length
        },
        brokenReferences,
        orphanedEntities: orphanedEntities.map(key => ({
            key,
            name: allEntities.get(key)?.name
        }))
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit code
    if (brokenReferences.length > 0) {
        console.log('\n❌ Cross-reference validation failed');
        process.exit(1);
    } else {
        console.log('\n✅ All cross-references valid!');
        process.exit(0);
    }
}

async function main() {
    try {
        await loadAllEntities();
        await checkCrossReferences();
        await printReport();
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
