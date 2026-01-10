/**
 * Migration Script: relatedDeities -> relatedEntities.deities
 *
 * This script migrates the legacy 'relatedDeities' field to the standardized
 * 'relatedEntities.deities' format across all asset files.
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = 'H:\\Github\\EyesOfAzrael\\backups\\firebase-assets-backup-20260101';
const OUTPUT_DIR = 'H:\\Github\\EyesOfAzrael\\firebase-assets-downloaded';

// Helper: Convert string to kebab-case ID
function toKebabCase(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/['']/g, '') // Remove apostrophes
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

// Helper: Convert kebab-case to Title Case
function toTitleCase(str) {
    if (!str) return '';
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Parse a relatedDeities entry and convert to standard format
function parseDeityEntry(entry) {
    // Already an object with id
    if (typeof entry === 'object' && entry !== null && entry.id) {
        return {
            id: entry.id,
            name: entry.name || toTitleCase(entry.id),
            relationship: entry.relationship || entry.role || 'related'
        };
    }

    // String with description format: "Isis - Great goddess of magic..."
    if (typeof entry === 'string' && entry.includes(' - ')) {
        const parts = entry.split(' - ');
        const name = parts[0].trim();
        const description = parts.slice(1).join(' - ').trim();
        return {
            id: toKebabCase(name),
            name: name,
            relationship: description || 'related'
        };
    }

    // Simple string (ID or name)
    if (typeof entry === 'string') {
        const cleanEntry = entry.trim();
        // Check if it's already kebab-case (likely an ID)
        if (cleanEntry.includes('-') || cleanEntry === cleanEntry.toLowerCase()) {
            return {
                id: cleanEntry,
                name: toTitleCase(cleanEntry),
                relationship: 'related'
            };
        }
        // Otherwise treat as a name
        return {
            id: toKebabCase(cleanEntry),
            name: cleanEntry,
            relationship: 'related'
        };
    }

    // Unknown format
    console.warn('Unknown deity entry format:', entry);
    return null;
}

// Merge deities arrays, avoiding duplicates by ID
function mergeDeities(existing, newDeities) {
    const merged = [...(existing || [])];
    const existingIds = new Set(merged.map(d => d.id));

    for (const deity of newDeities) {
        if (deity && !existingIds.has(deity.id)) {
            merged.push(deity);
            existingIds.add(deity.id);
        }
    }

    return merged;
}

// Process a single JSON file
function processFile(filePath, outputPath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;

    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error(`Error parsing ${filePath}:`, e.message);
        return { success: false, error: 'JSON parse error' };
    }

    let modified = false;
    const changes = [];

    // Check for top-level relatedDeities
    if (data.relatedDeities && Array.isArray(data.relatedDeities)) {
        const convertedDeities = data.relatedDeities
            .map(parseDeityEntry)
            .filter(d => d !== null);

        // Initialize relatedEntities if needed
        if (!data.relatedEntities) {
            data.relatedEntities = {};
        }

        // Merge with existing relatedEntities.deities
        data.relatedEntities.deities = mergeDeities(
            data.relatedEntities.deities,
            convertedDeities
        );

        changes.push({
            field: 'relatedDeities',
            count: data.relatedDeities.length,
            converted: convertedDeities.length
        });

        // Delete the legacy field
        delete data.relatedDeities;
        modified = true;
    }

    // Check for relationships.relatedDeities (nested format)
    if (data.relationships && data.relationships.relatedDeities && Array.isArray(data.relationships.relatedDeities)) {
        const convertedDeities = data.relationships.relatedDeities
            .map(parseDeityEntry)
            .filter(d => d !== null);

        // Initialize relatedEntities if needed
        if (!data.relatedEntities) {
            data.relatedEntities = {};
        }

        // Merge with existing relatedEntities.deities
        data.relatedEntities.deities = mergeDeities(
            data.relatedEntities.deities,
            convertedDeities
        );

        changes.push({
            field: 'relationships.relatedDeities',
            count: data.relationships.relatedDeities.length,
            converted: convertedDeities.length
        });

        // Delete the legacy field
        delete data.relationships.relatedDeities;
        modified = true;
    }

    // Handle nested objects (like babylonian.json with "0", "1" keys)
    for (const key of Object.keys(data)) {
        if (typeof data[key] === 'object' && data[key] !== null && data[key].relatedDeities) {
            const nestedData = data[key];
            if (Array.isArray(nestedData.relatedDeities)) {
                const convertedDeities = nestedData.relatedDeities
                    .map(parseDeityEntry)
                    .filter(d => d !== null);

                if (!nestedData.relatedEntities) {
                    nestedData.relatedEntities = {};
                }

                nestedData.relatedEntities.deities = mergeDeities(
                    nestedData.relatedEntities.deities,
                    convertedDeities
                );

                changes.push({
                    field: `${key}.relatedDeities`,
                    count: nestedData.relatedDeities.length,
                    converted: convertedDeities.length
                });

                delete nestedData.relatedDeities;
                modified = true;
            }
        }
    }

    if (modified) {
        // Update metadata
        data._modified = new Date().toISOString();
        if (data.metadata) {
            data.metadata.migratedRelatedDeities = true;
            data.metadata.migrationDate = new Date().toISOString();
        }

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write the modified file
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

        return { success: true, changes };
    }

    return { success: false, reason: 'No relatedDeities field found' };
}

// Main execution
function main() {
    console.log('='.repeat(60));
    console.log('Migration: relatedDeities -> relatedEntities.deities');
    console.log('='.repeat(60));
    console.log(`Source: ${BACKUP_DIR}`);
    console.log(`Output: ${OUTPUT_DIR}`);
    console.log('');

    // Files with relatedDeities (found via grep)
    const targetFiles = [
        'symbols-backup/chinese_yin-yang.json',
        'symbols-backup/egyptian_ankh.json',
        'symbols-backup/buddhist_dharma-wheel.json',
        'symbols-backup/hermetic_pentagram.json',
        'magic/alchemy.json',
        'magic/tantra.json',
        'magic/greek-theurgy.json',
        'magic/seidr.json',
        'magic/kabbalah.json',
        'magic/shinto-magic.json',
        'magic/vodou.json',
        'magic/druidic-magic.json',
        'magic/galdr.json',
        'magic/heka.json',
        'magic/hermetic-magic.json',
        'magic/taoist-magic.json',
        'symbols/egyptian_ankh.json',
        'symbols/buddhist_dharma-wheel.json',
        'symbols/chinese_yin-yang.json',
        'symbols/hermetic_pentagram.json',
        'rituals/christian_baptism.json',
        'rituals/babylonian_divination.json',
        'rituals/babylonian_akitu.json',
        'rituals/christian.json',
        'rituals/_all.json',
        'rituals/babylonian.json'
    ];

    const results = {
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        details: []
    };

    for (const relativePath of targetFiles) {
        const inputPath = path.join(BACKUP_DIR, relativePath);

        // Determine output path (use same folder structure, excluding backup folders like symbols-backup)
        let outputRelativePath = relativePath;
        if (relativePath.startsWith('symbols-backup/')) {
            outputRelativePath = relativePath.replace('symbols-backup/', 'symbols/');
        }
        const outputPath = path.join(OUTPUT_DIR, outputRelativePath);

        console.log(`Processing: ${relativePath}`);

        if (!fs.existsSync(inputPath)) {
            console.log(`  SKIP: File not found`);
            results.skipped++;
            continue;
        }

        results.processed++;

        try {
            const result = processFile(inputPath, outputPath);

            if (result.success) {
                console.log(`  SUCCESS: Migrated`);
                for (const change of result.changes) {
                    console.log(`    - ${change.field}: ${change.count} entries -> ${change.converted} converted`);
                }
                results.success++;
                results.details.push({
                    file: relativePath,
                    output: outputRelativePath,
                    status: 'success',
                    changes: result.changes
                });
            } else {
                console.log(`  SKIP: ${result.reason || result.error}`);
                results.skipped++;
            }
        } catch (e) {
            console.error(`  ERROR: ${e.message}`);
            results.failed++;
            results.details.push({
                file: relativePath,
                status: 'error',
                error: e.message
            });
        }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total files processed: ${results.processed}`);
    console.log(`Successfully migrated: ${results.success}`);
    console.log(`Skipped (no changes):  ${results.skipped}`);
    console.log(`Failed:                ${results.failed}`);
    console.log('');

    // Write report
    const reportPath = path.join(OUTPUT_DIR, '_relatedDeities_migration_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Report saved to: ${reportPath}`);

    return results;
}

main();
