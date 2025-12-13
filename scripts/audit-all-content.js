#!/usr/bin/env node

/**
 * Comprehensive Content Audit Script
 * Eyes of Azrael - Firebase Migration
 *
 * This script scans the entire website to identify all content types
 * and generates a comprehensive migration plan.
 *
 * Content Types:
 * - Deities (MIGRATED ✅)
 * - Heroes (TODO)
 * - Creatures (TODO)
 * - Places/Cosmology (TODO)
 * - Items/Artifacts (TODO)
 * - Herbs (TODO)
 * - Texts/Corpus (TODO)
 * - Symbols (TODO)
 * - Rituals (TODO)
 * - Magic (TODO)
 * - Archetypes (TODO)
 * - Concepts (TODO)
 *
 * Usage:
 *   node audit-all-content.js
 *   node audit-all-content.js --mythology=greek
 *   node audit-all-content.js --output=json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_DIR = path.join(__dirname, '../..');
const MYTHOS_DIR = path.join(BASE_DIR, 'mythos');
const OUTPUT_DIR = path.join(__dirname, '../audit_results');

// Content type patterns
const CONTENT_TYPES = {
    deities: { pattern: /deities\/.*\.html$/, status: 'MIGRATED', priority: 1 },
    heroes: { pattern: /heroes\/.*\.html$/, status: 'TODO', priority: 2 },
    creatures: { pattern: /creatures\/.*\.html$/, status: 'TODO', priority: 3 },
    beings: { pattern: /beings\/.*\.html$/, status: 'TODO', priority: 3 },
    cosmology: { pattern: /cosmology\/.*\.html$/, status: 'TODO', priority: 4 },
    realms: { pattern: /realms\/.*\.html$/, status: 'TODO', priority: 4 },
    places: { pattern: /places\/.*\.html$/, status: 'TODO', priority: 4 },
    items: { pattern: /items\/.*\.html$/, status: 'TODO', priority: 5 },
    artifacts: { pattern: /artifacts\/.*\.html$/, status: 'TODO', priority: 5 },
    herbs: { pattern: /herbs\/.*\.html$/, status: 'TODO', priority: 6 },
    texts: { pattern: /texts\/.*\.html$/, status: 'TODO', priority: 7 },
    symbols: { pattern: /symbols\/.*\.html$/, status: 'TODO', priority: 8 },
    rituals: { pattern: /rituals\/.*\.html$/, status: 'TODO', priority: 9 },
    magic: { pattern: /magic\/.*\.html$/, status: 'TODO', priority: 10 },
    concepts: { pattern: /concepts\/.*\.html$/, status: 'TODO', priority: 11 },
    events: { pattern: /events\/.*\.html$/, status: 'TODO', priority: 12 },
    myths: { pattern: /myths\/.*\.html$/, status: 'TODO', priority: 13 },
    path: { pattern: /path\/.*\.html$/, status: 'TODO', priority: 14 },
    figures: { pattern: /figures\/.*\.html$/, status: 'TODO', priority: 2 },
    angels: { pattern: /angels\/.*\.html$/, status: 'TODO', priority: 3 },
    spirits: { pattern: /spirits\/.*\.html$/, status: 'TODO', priority: 3 }
};

// Mythology directories
const MYTHOLOGIES = [
    'greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist',
    'chinese', 'japanese', 'celtic', 'aztec', 'mayan', 'babylonian',
    'sumerian', 'persian', 'christian', 'islamic', 'jewish',
    'yoruba', 'native_american', 'tarot', 'apocryphal', 'freemasons'
];

/**
 * Recursively scan directory for HTML files
 */
function scanDirectory(dir, mythology = null) {
    const results = {
        files: [],
        errors: []
    };

    try {
        if (!fs.existsSync(dir)) {
            results.errors.push(`Directory not found: ${dir}`);
            return results;
        }

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(BASE_DIR, fullPath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                // Skip common directories
                if (['node_modules', '.git', 'FIREBASE', 'scripts'].includes(entry.name)) {
                    continue;
                }

                // Recursively scan subdirectories
                const subResults = scanDirectory(fullPath, mythology);
                results.files.push(...subResults.files);
                results.errors.push(...subResults.errors);

            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                // Skip index files and special files
                if (entry.name === 'index.html' ||
                    entry.name.includes('corpus-search') ||
                    entry.name.includes('template') ||
                    entry.name.includes('test')) {
                    continue;
                }

                // Categorize by content type
                let contentType = 'unknown';
                for (const [type, config] of Object.entries(CONTENT_TYPES)) {
                    if (config.pattern.test(relativePath)) {
                        contentType = type;
                        break;
                    }
                }

                results.files.push({
                    path: relativePath,
                    fullPath: fullPath,
                    mythology: mythology || detectMythology(relativePath),
                    contentType: contentType,
                    filename: entry.name,
                    size: fs.statSync(fullPath).size,
                    modified: fs.statSync(fullPath).mtime
                });
            }
        }
    } catch (error) {
        results.errors.push(`Error scanning ${dir}: ${error.message}`);
    }

    return results;
}

/**
 * Detect mythology from file path
 */
function detectMythology(filePath) {
    for (const mythology of MYTHOLOGIES) {
        if (filePath.includes(`mythos/${mythology}/`)) {
            return mythology;
        }
    }
    return 'unknown';
}

/**
 * Analyze content file to extract basic metadata
 */
function analyzeContentFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract title
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Check for common HTML structures
        const hasGlassCard = content.includes('class="glass-card"');
        const hasAttributeCard = content.includes('class="attribute-card"');
        const hasHeroSection = content.includes('class="hero-section"');
        const hasBadges = content.includes('class="badge"');
        const hasCorpusRefs = content.includes('class="corpus-ref"');

        // Extract description/summary
        const descMatch = content.match(/<meta name="description" content="(.*?)"/i);
        const description = descMatch ? descMatch[1].trim() : '';

        // Count sections
        const sectionCount = (content.match(/<section/gi) || []).length;
        const divCount = (content.match(/<div/gi) || []).length;

        return {
            title,
            description,
            hasGlassCard,
            hasAttributeCard,
            hasHeroSection,
            hasBadges,
            hasCorpusRefs,
            sectionCount,
            divCount,
            contentLength: content.length
        };
    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Generate comprehensive audit report
 */
function generateAuditReport(files) {
    const report = {
        generatedAt: new Date().toISOString(),
        totalFiles: files.length,
        byMythology: {},
        byContentType: {},
        byStatus: {},
        migrationPriority: [],
        recommendations: [],
        summary: {
            migrated: 0,
            todo: 0,
            totalSize: 0
        }
    };

    // Group by mythology
    files.forEach(file => {
        const mythology = file.mythology;
        if (!report.byMythology[mythology]) {
            report.byMythology[mythology] = {
                count: 0,
                contentTypes: {},
                totalSize: 0,
                files: []
            };
        }
        report.byMythology[mythology].count++;
        report.byMythology[mythology].totalSize += file.size;
        report.byMythology[mythology].files.push({
            path: file.path,
            contentType: file.contentType,
            size: file.size
        });

        // Count content types within mythology
        const contentType = file.contentType;
        if (!report.byMythology[mythology].contentTypes[contentType]) {
            report.byMythology[mythology].contentTypes[contentType] = 0;
        }
        report.byMythology[mythology].contentTypes[contentType]++;
    });

    // Group by content type
    files.forEach(file => {
        const contentType = file.contentType;
        if (!report.byContentType[contentType]) {
            report.byContentType[contentType] = {
                count: 0,
                status: CONTENT_TYPES[contentType]?.status || 'UNKNOWN',
                priority: CONTENT_TYPES[contentType]?.priority || 99,
                mythologies: {},
                totalSize: 0,
                files: []
            };
        }
        report.byContentType[contentType].count++;
        report.byContentType[contentType].totalSize += file.size;
        report.byContentType[contentType].files.push(file.path);

        // Count mythologies within content type
        if (!report.byContentType[contentType].mythologies[file.mythology]) {
            report.byContentType[contentType].mythologies[file.mythology] = 0;
        }
        report.byContentType[contentType].mythologies[file.mythology]++;

        // Update status summary
        const status = CONTENT_TYPES[contentType]?.status || 'UNKNOWN';
        if (status === 'MIGRATED') {
            report.summary.migrated++;
        } else {
            report.summary.todo++;
        }
        report.summary.totalSize += file.size;
    });

    // Create migration priority list
    const contentTypesArray = Object.entries(report.byContentType)
        .map(([type, data]) => ({
            contentType: type,
            ...data
        }))
        .sort((a, b) => a.priority - b.priority);

    report.migrationPriority = contentTypesArray;

    // Generate recommendations
    report.recommendations.push({
        priority: 'HIGH',
        action: 'Migrate Heroes next',
        reason: `${report.byContentType.heroes?.count || 0} hero files found across ${Object.keys(report.byContentType.heroes?.mythologies || {}).length} mythologies`,
        estimatedTime: '30-45 minutes'
    });

    report.recommendations.push({
        priority: 'HIGH',
        action: 'Migrate Creatures/Beings',
        reason: `${(report.byContentType.creatures?.count || 0) + (report.byContentType.beings?.count || 0)} creature/being files found`,
        estimatedTime: '45-60 minutes'
    });

    report.recommendations.push({
        priority: 'MEDIUM',
        action: 'Migrate Cosmology/Realms/Places',
        reason: `${(report.byContentType.cosmology?.count || 0) + (report.byContentType.realms?.count || 0) + (report.byContentType.places?.count || 0)} cosmology-related files`,
        estimatedTime: '60-90 minutes'
    });

    report.recommendations.push({
        priority: 'MEDIUM',
        action: 'Migrate Herbs and Items',
        reason: `${(report.byContentType.herbs?.count || 0) + (report.byContentType.items?.count || 0) + (report.byContentType.artifacts?.count || 0)} herb/item files`,
        estimatedTime: '30-45 minutes'
    });

    report.recommendations.push({
        priority: 'LOW',
        action: 'Migrate Texts, Symbols, Rituals, Magic',
        reason: 'Reference material - can be migrated last',
        estimatedTime: '2-3 hours'
    });

    return report;
}

/**
 * Generate detailed analysis for each file
 */
function generateDetailedAnalysis(files, sampleSize = 100) {
    const analyzed = [];
    const filesToAnalyze = files.slice(0, sampleSize);

    console.log(`\n🔍 Analyzing ${filesToAnalyze.length} files (sample)...`);

    for (const file of filesToAnalyze) {
        const analysis = analyzeContentFile(file.fullPath);
        analyzed.push({
            ...file,
            analysis
        });
    }

    return analyzed;
}

/**
 * Print summary report to console
 */
function printSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CONTENT AUDIT REPORT - Eyes of Azrael');
    console.log('='.repeat(80));

    console.log(`\n📅 Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    console.log(`📁 Total Files: ${report.totalFiles}`);
    console.log(`✅ Migrated: ${report.summary.migrated} files`);
    console.log(`⏳ TODO: ${report.summary.todo} files`);
    console.log(`💾 Total Size: ${(report.summary.totalSize / 1024).toFixed(2)} KB`);

    // Content Types Summary
    console.log('\n' + '─'.repeat(80));
    console.log('📑 CONTENT TYPES BY PRIORITY');
    console.log('─'.repeat(80));
    console.log(sprintf('%-20s %8s %12s %8s %s',
        'Type', 'Count', 'Status', 'Priority', 'Mythologies'));
    console.log('─'.repeat(80));

    report.migrationPriority.forEach(item => {
        const statusIcon = item.status === 'MIGRATED' ? '✅' : '⏳';
        console.log(sprintf('%-20s %8d %12s %8d %s',
            item.contentType,
            item.count,
            `${statusIcon} ${item.status}`,
            item.priority,
            Object.keys(item.mythologies).length
        ));
    });

    // Mythology Breakdown
    console.log('\n' + '─'.repeat(80));
    console.log('🌍 CONTENT BY MYTHOLOGY');
    console.log('─'.repeat(80));
    console.log(sprintf('%-20s %8s %12s %s',
        'Mythology', 'Files', 'Size (KB)', 'Top Content Types'));
    console.log('─'.repeat(80));

    Object.entries(report.byMythology)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([mythology, data]) => {
            const topTypes = Object.entries(data.contentTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([type, count]) => `${type}(${count})`)
                .join(', ');

            console.log(sprintf('%-20s %8d %12s %s',
                mythology,
                data.count,
                (data.totalSize / 1024).toFixed(1),
                topTypes
            ));
        });

    // Recommendations
    console.log('\n' + '─'.repeat(80));
    console.log('💡 MIGRATION RECOMMENDATIONS');
    console.log('─'.repeat(80));

    report.recommendations.forEach((rec, idx) => {
        const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`\n${idx + 1}. ${priorityIcon} ${rec.priority} - ${rec.action}`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   Time: ${rec.estimatedTime}`);
    });

    console.log('\n' + '='.repeat(80));
}

/**
 * Simple sprintf implementation
 */
function sprintf(format, ...args) {
    let result = format;
    args.forEach(arg => {
        result = result.replace(/%(-?)(\d*)s|%(-?)(\d*)d/, (match, leftAlign1, width1, leftAlign2, width2) => {
            const leftAlign = leftAlign1 || leftAlign2;
            const width = parseInt(width1 || width2 || 0);
            let str = String(arg);

            if (width > str.length) {
                const padding = ' '.repeat(width - str.length);
                str = leftAlign ? str + padding : padding + str;
            }

            return str;
        });
    });
    return result;
}

/**
 * Save reports to files
 */
function saveReports(report, detailedAnalysis) {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save full report as JSON
    const reportPath = path.join(OUTPUT_DIR, 'content_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved: ${reportPath}`);

    // Save detailed analysis
    const analysisPath = path.join(OUTPUT_DIR, 'detailed_analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(detailedAnalysis, null, 2));
    console.log(`💾 Detailed analysis saved: ${analysisPath}`);

    // Save migration checklist
    const checklistPath = path.join(OUTPUT_DIR, 'migration_checklist.md');
    const checklist = generateMigrationChecklist(report);
    fs.writeFileSync(checklistPath, checklist);
    console.log(`💾 Migration checklist saved: ${checklistPath}`);

    // Save CSV for spreadsheet import
    const csvPath = path.join(OUTPUT_DIR, 'content_inventory.csv');
    const csv = generateCSV(report);
    fs.writeFileSync(csvPath, csv);
    console.log(`💾 CSV inventory saved: ${csvPath}`);
}

/**
 * Generate migration checklist markdown
 */
function generateMigrationChecklist(report) {
    let md = '# Content Migration Checklist\n\n';
    md += `Generated: ${new Date().toLocaleString()}\n\n`;
    md += `## Summary\n\n`;
    md += `- Total Files: ${report.totalFiles}\n`;
    md += `- ✅ Migrated: ${report.summary.migrated}\n`;
    md += `- ⏳ TODO: ${report.summary.todo}\n\n`;

    md += `## Migration Priority\n\n`;

    report.migrationPriority.forEach((item, idx) => {
        const checkbox = item.status === 'MIGRATED' ? '[x]' : '[ ]';
        md += `### ${idx + 1}. ${checkbox} ${item.contentType} (Priority ${item.priority})\n\n`;
        md += `- **Count:** ${item.count} files\n`;
        md += `- **Status:** ${item.status}\n`;
        md += `- **Mythologies:** ${Object.keys(item.mythologies).length}\n`;
        md += `- **Total Size:** ${(item.totalSize / 1024).toFixed(2)} KB\n\n`;

        // List mythologies
        md += `**Breakdown by Mythology:**\n\n`;
        Object.entries(item.mythologies)
            .sort((a, b) => b[1] - a[1])
            .forEach(([mythology, count]) => {
                md += `- ${mythology}: ${count} files\n`;
            });
        md += '\n';
    });

    return md;
}

/**
 * Generate CSV inventory
 */
function generateCSV(report) {
    let csv = 'Mythology,Content Type,File Path,Status,Priority\n';

    report.migrationPriority.forEach(item => {
        item.files.forEach(filePath => {
            const mythology = detectMythology(filePath);
            csv += `"${mythology}","${item.contentType}","${filePath}","${item.status}",${item.priority}\n`;
        });
    });

    return csv;
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting comprehensive content audit...\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const mythologyFilter = args.find(arg => arg.startsWith('--mythology='))?.split('=')[1];
    const outputFormat = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'console';

    // Scan all mythology directories
    let allFiles = [];
    const mythologiesToScan = mythologyFilter ? [mythologyFilter] : MYTHOLOGIES;

    for (const mythology of mythologiesToScan) {
        const mythologyDir = path.join(MYTHOS_DIR, mythology);
        console.log(`📁 Scanning ${mythology}...`);
        const result = scanDirectory(mythologyDir, mythology);
        allFiles.push(...result.files);

        if (result.errors.length > 0) {
            console.log(`⚠️  Errors in ${mythology}:`);
            result.errors.forEach(err => console.log(`   ${err}`));
        }
    }

    console.log(`\n✅ Scanned ${allFiles.length} content files`);

    // Generate reports
    const report = generateAuditReport(allFiles);
    const detailedAnalysis = generateDetailedAnalysis(allFiles, 100);

    // Output results
    if (outputFormat === 'json') {
        console.log(JSON.stringify(report, null, 2));
    } else {
        printSummary(report);
    }

    // Save reports to files
    saveReports(report, detailedAnalysis);

    console.log('\n✨ Audit complete!\n');
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
}

module.exports = {
    scanDirectory,
    generateAuditReport,
    analyzeContentFile
};
