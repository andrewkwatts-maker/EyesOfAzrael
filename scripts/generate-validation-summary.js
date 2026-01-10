/**
 * Generate Validation Summary
 * Aggregates all validation reports into a comprehensive summary
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');

function loadJsonReport(filename) {
    const filepath = path.join(REPORTS_DIR, filename);
    if (fs.existsSync(filepath)) {
        try {
            return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        } catch (e) {
            console.error(`  Failed to load ${filename}: ${e.message}`);
            return null;
        }
    }
    return null;
}

function generateSummary() {
    console.log('='.repeat(60));
    console.log('Generating Validation Summary');
    console.log('='.repeat(60));
    console.log();

    const summary = {
        generatedAt: new Date().toISOString(),
        overallHealth: 'unknown',
        scores: {},
        issues: {
            critical: [],
            warnings: [],
            info: []
        },
        reports: {}
    };

    // Load duplicate assets report
    const duplicateReport = loadJsonReport('duplicate-assets-report.json');
    if (duplicateReport) {
        summary.reports.duplicates = {
            totalAssets: duplicateReport.summary?.totalAssets || 0,
            duplicateIds: duplicateReport.summary?.duplicateIds || 0,
            similarNames: duplicateReport.summary?.similarNames || 0,
            crossCategoryDuplicates: duplicateReport.summary?.crossCategoryDuplicates || 0
        };

        if (duplicateReport.summary?.duplicateIds > 0) {
            summary.issues.critical.push({
                type: 'duplicate_ids',
                count: duplicateReport.summary.duplicateIds,
                message: `${duplicateReport.summary.duplicateIds} duplicate asset IDs found`
            });
        }

        if (duplicateReport.summary?.similarNames > 0) {
            summary.issues.warnings.push({
                type: 'similar_names',
                count: duplicateReport.summary.similarNames,
                message: `${duplicateReport.summary.similarNames} potential duplicate names found`
            });
        }

        console.log('  [OK] Loaded duplicate assets report');
    } else {
        console.log('  [--] No duplicate assets report found');
    }

    // Load connection validation report
    const connectionReport = loadJsonReport('connection-validation-report.json');
    if (connectionReport) {
        summary.reports.connections = {
            totalAssets: connectionReport.summary?.totalAssets || 0,
            complianceRate: connectionReport.summary?.complianceRate || 0,
            brokenLinks: connectionReport.summary?.brokenLinks || 0,
            legacyFields: connectionReport.summary?.legacyFieldsFound || 0,
            formatIssues: connectionReport.summary?.formatIssues || 0
        };

        summary.scores.connectionCompliance = connectionReport.summary?.complianceRate || 0;

        if (connectionReport.summary?.brokenLinks > 0) {
            summary.issues.warnings.push({
                type: 'broken_links',
                count: connectionReport.summary.brokenLinks,
                message: `${connectionReport.summary.brokenLinks} broken entity links (marked as _unverified)`
            });
        }

        if (connectionReport.summary?.legacyFieldsFound > 0) {
            summary.issues.critical.push({
                type: 'legacy_fields',
                count: connectionReport.summary.legacyFieldsFound,
                message: `${connectionReport.summary.legacyFieldsFound} legacy field patterns need migration`
            });
        }

        console.log('  [OK] Loaded connection validation report');
    } else {
        console.log('  [--] No connection validation report found');
    }

    // Load mythology links report
    const mythologyReport = loadJsonReport('mythology-links-report.json');
    if (mythologyReport) {
        const totalSuspicious = Object.values(mythologyReport.mythologies || {})
            .reduce((sum, m) => sum + (m.suspiciousLinks?.length || 0), 0);

        const avgInternalRatio = Object.values(mythologyReport.mythologies || {})
            .filter(m => m.stats)
            .reduce((sum, m, _, arr) => sum + (m.stats.internalLinkRatio || 0) / arr.length, 0);

        summary.reports.mythologyLinks = {
            mythologiesChecked: Object.keys(mythologyReport.mythologies || {}).length,
            suspiciousLinks: totalSuspicious,
            averageInternalLinkRatio: Math.round(avgInternalRatio * 100) / 100
        };

        summary.scores.mythologyLinkHealth = Math.round(avgInternalRatio * 100);

        if (totalSuspicious > 0) {
            summary.issues.warnings.push({
                type: 'suspicious_mythology_links',
                count: totalSuspicious,
                message: `${totalSuspicious} suspicious cross-mythology links found`
            });
        }

        console.log('  [OK] Loaded mythology links report');
    } else {
        console.log('  [--] No mythology links report found');
    }

    // Calculate overall health
    const criticalCount = summary.issues.critical.length;
    const warningCount = summary.issues.warnings.length;

    if (criticalCount > 0) {
        summary.overallHealth = 'critical';
    } else if (warningCount > 5) {
        summary.overallHealth = 'poor';
    } else if (warningCount > 0) {
        summary.overallHealth = 'fair';
    } else {
        summary.overallHealth = 'good';
    }

    // Calculate overall score
    const scores = Object.values(summary.scores).filter(s => typeof s === 'number');
    if (scores.length > 0) {
        summary.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // Save summary
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const summaryPath = path.join(REPORTS_DIR, 'validation-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log();
    console.log(`Summary saved to: ${summaryPath}`);

    // Generate markdown summary
    const markdownSummary = generateMarkdownSummary(summary);
    const markdownPath = path.join(REPORTS_DIR, 'validation-summary.md');
    fs.writeFileSync(markdownPath, markdownSummary);
    console.log(`Markdown summary saved to: ${markdownPath}`);

    // Print summary to console
    console.log();
    console.log('='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log();
    console.log(`Overall Health: ${summary.overallHealth.toUpperCase()}`);
    if (summary.overallScore !== undefined) {
        console.log(`Overall Score: ${summary.overallScore}%`);
    }
    console.log();

    if (summary.issues.critical.length > 0) {
        console.log('CRITICAL ISSUES:');
        summary.issues.critical.forEach(issue => {
            console.log(`  [!] ${issue.message}`);
        });
        console.log();
    }

    if (summary.issues.warnings.length > 0) {
        console.log('WARNINGS:');
        summary.issues.warnings.forEach(issue => {
            console.log(`  [*] ${issue.message}`);
        });
        console.log();
    }

    if (summary.issues.critical.length === 0 && summary.issues.warnings.length === 0) {
        console.log('No issues found! All validations passed.');
    }

    return summary;
}

function generateMarkdownSummary(summary) {
    let md = `# Validation Summary Report\n\n`;
    md += `**Generated:** ${summary.generatedAt}\n\n`;
    md += `**Overall Health:** ${summary.overallHealth.toUpperCase()}\n`;
    if (summary.overallScore !== undefined) {
        md += `**Overall Score:** ${summary.overallScore}%\n`;
    }
    md += '\n---\n\n';

    // Scores
    if (Object.keys(summary.scores).length > 0) {
        md += `## Scores\n\n`;
        md += `| Metric | Score |\n`;
        md += `|--------|-------|\n`;
        for (const [key, value] of Object.entries(summary.scores)) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            md += `| ${label} | ${value}% |\n`;
        }
        md += '\n';
    }

    // Critical Issues
    if (summary.issues.critical.length > 0) {
        md += `## Critical Issues\n\n`;
        summary.issues.critical.forEach(issue => {
            md += `- **${issue.type}**: ${issue.message}\n`;
        });
        md += '\n';
    }

    // Warnings
    if (summary.issues.warnings.length > 0) {
        md += `## Warnings\n\n`;
        summary.issues.warnings.forEach(issue => {
            md += `- **${issue.type}**: ${issue.message}\n`;
        });
        md += '\n';
    }

    // Reports
    md += `## Report Details\n\n`;

    if (summary.reports.duplicates) {
        md += `### Duplicate Assets\n\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Total Assets | ${summary.reports.duplicates.totalAssets} |\n`;
        md += `| Duplicate IDs | ${summary.reports.duplicates.duplicateIds} |\n`;
        md += `| Similar Names | ${summary.reports.duplicates.similarNames} |\n`;
        md += `| Cross-Category Duplicates | ${summary.reports.duplicates.crossCategoryDuplicates} |\n`;
        md += '\n';
    }

    if (summary.reports.connections) {
        md += `### Connection Validation\n\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Total Assets | ${summary.reports.connections.totalAssets} |\n`;
        md += `| Compliance Rate | ${summary.reports.connections.complianceRate}% |\n`;
        md += `| Broken Links | ${summary.reports.connections.brokenLinks} |\n`;
        md += `| Legacy Fields | ${summary.reports.connections.legacyFields} |\n`;
        md += '\n';
    }

    if (summary.reports.mythologyLinks) {
        md += `### Mythology Links\n\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Mythologies Checked | ${summary.reports.mythologyLinks.mythologiesChecked} |\n`;
        md += `| Suspicious Links | ${summary.reports.mythologyLinks.suspiciousLinks} |\n`;
        md += `| Avg Internal Link Ratio | ${summary.reports.mythologyLinks.averageInternalLinkRatio} |\n`;
        md += '\n';
    }

    return md;
}

// Run if called directly
if (require.main === module) {
    generateSummary();
}

module.exports = { generateSummary };
