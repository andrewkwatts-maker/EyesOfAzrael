/**
 * Generate Report
 * Compiles all validation results into HTML and JSON reports
 * Eyes of Azrael Validation System
 *
 * Usage: node generate-report.js [--output=dir] [--format=html|json|both]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    reportsDir: path.resolve(__dirname, '../../reports'),
    schemaReport: 'schema-validation.json',
    renderingReport: 'rendering-validation.json',
    linksReport: 'links-validation.json'
};

// Parse command line arguments
function parseArgs() {
    const args = {
        output: null,
        format: 'both',
        help: false
    };

    process.argv.slice(2).forEach(arg => {
        if (arg === '--help' || arg === '-h') {
            args.help = true;
        } else if (arg.startsWith('--output=')) {
            args.output = arg.split('=')[1];
        } else if (arg.startsWith('--format=')) {
            args.format = arg.split('=')[1];
        }
    });

    return args;
}

// Show help message
function showHelp() {
    console.log(`
Generate Report - Eyes of Azrael Validation System

Compiles all validation results into comprehensive reports.

Usage: node generate-report.js [options]

Options:
  --output=dir      Output directory for reports (default: reports/)
  --format=type     Output format: html, json, or both (default: both)
  --help, -h        Show this help message

Examples:
  node generate-report.js                   # Generate both HTML and JSON
  node generate-report.js --format=html     # Generate only HTML report
`);
}

/**
 * Load a validation report if it exists
 */
function loadReport(filename) {
    const filepath = path.join(CONFIG.reportsDir, filename);
    if (fs.existsSync(filepath)) {
        try {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (error) {
            console.warn(`[Warning] Could not load ${filename}: ${error.message}`);
        }
    }
    return null;
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(schemaReport, renderingReport, linksReport) {
    const scores = [];

    if (schemaReport) {
        scores.push({
            name: 'Schema Validation',
            score: schemaReport.summary.passRate || 0,
            weight: 0.4
        });
    }

    if (renderingReport) {
        scores.push({
            name: 'Rendering',
            score: renderingReport.summary.renderRate || 0,
            weight: 0.3
        });
    }

    if (linksReport) {
        scores.push({
            name: 'Link Integrity',
            score: linksReport.summary.linkIntegrity || 0,
            weight: 0.3
        });
    }

    if (scores.length === 0) return 0;

    const weightedSum = scores.reduce((sum, s) => sum + (s.score * s.weight), 0);
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);

    return Math.round(weightedSum / totalWeight);
}

/**
 * Get status badge class based on score
 */
function getStatusClass(score) {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Generate combined JSON report
 */
function generateJsonReport(schemaReport, renderingReport, linksReport, outputDir) {
    const report = {
        generated: new Date().toISOString(),
        healthScore: calculateHealthScore(schemaReport, renderingReport, linksReport),
        summary: {
            schema: schemaReport ? schemaReport.summary : null,
            rendering: renderingReport ? renderingReport.summary : null,
            links: linksReport ? linksReport.summary : null
        },
        details: {
            schema: schemaReport,
            rendering: renderingReport,
            links: linksReport
        }
    };

    const outputPath = path.join(outputDir, 'validation-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`[Generated] JSON report: ${outputPath}`);

    return report;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(schemaReport, renderingReport, linksReport, outputDir) {
    const healthScore = calculateHealthScore(schemaReport, renderingReport, linksReport);
    const statusClass = getStatusClass(healthScore);

    // Generate collection rows for schema
    let schemaCollectionRows = '';
    if (schemaReport && schemaReport.collections) {
        for (const [name, data] of Object.entries(schemaReport.collections)) {
            const rowClass = getStatusClass(data.passRate);
            schemaCollectionRows += `
                <tr class="${rowClass}">
                    <td>${name}</td>
                    <td>${data.totalAssets}</td>
                    <td>${data.validAssets}</td>
                    <td>${data.invalidAssets}</td>
                    <td>${data.totalErrors}</td>
                    <td>${data.totalWarnings}</td>
                    <td class="score">${data.passRate}%</td>
                </tr>
            `;
        }
    }

    // Generate collection rows for rendering
    let renderingCollectionRows = '';
    if (renderingReport && renderingReport.collections) {
        for (const [name, data] of Object.entries(renderingReport.collections)) {
            const rowClass = getStatusClass(data.renderRate);
            renderingCollectionRows += `
                <tr class="${rowClass}">
                    <td>${name}</td>
                    <td>${data.totalAssets}</td>
                    <td>${data.renderableAssets}</td>
                    <td>${data.unrenderableAssets}</td>
                    <td>${data.totalErrors}</td>
                    <td class="score">${data.renderRate}%</td>
                </tr>
            `;
        }
    }

    // Generate collection rows for links
    let linksCollectionRows = '';
    if (linksReport && linksReport.collections) {
        for (const [name, data] of Object.entries(linksReport.collections)) {
            const rowClass = getStatusClass(data.linkIntegrity);
            linksCollectionRows += `
                <tr class="${rowClass}">
                    <td>${name}</td>
                    <td>${data.totalLinks}</td>
                    <td>${data.validLinks}</td>
                    <td>${data.brokenLinks}</td>
                    <td>${data.externalLinks}</td>
                    <td class="score">${data.linkIntegrity}%</td>
                </tr>
            `;
        }
    }

    // Generate top broken links
    let brokenLinksRows = '';
    if (linksReport && linksReport.brokenLinksByTarget) {
        const topBroken = Object.entries(linksReport.brokenLinksByTarget).slice(0, 20);
        for (const [target, refs] of topBroken) {
            brokenLinksRows += `
                <tr>
                    <td><code>${escapeHtml(target)}</code></td>
                    <td>${refs.length}</td>
                    <td>${refs.slice(0, 3).map(r => `${r.collection}/${r.asset}`).join(', ')}${refs.length > 3 ? '...' : ''}</td>
                </tr>
            `;
        }
    }

    // Generate common errors
    let commonErrorsRows = '';
    if (schemaReport && schemaReport.errorsByType) {
        const topErrors = Object.entries(schemaReport.errorsByType)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 10);
        for (const [field, errors] of topErrors) {
            commonErrorsRows += `
                <tr>
                    <td><code>${escapeHtml(field)}</code></td>
                    <td>${errors.length}</td>
                    <td>${errors.slice(0, 2).map(e => `${e.collection}/${e.asset}`).join(', ')}${errors.length > 2 ? '...' : ''}</td>
                </tr>
            `;
        }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eyes of Azrael - Validation Report</title>
    <style>
        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #12121a;
            --bg-card: #1a1a25;
            --text-primary: #e8e6e3;
            --text-secondary: #a0a0a0;
            --accent-gold: #c9a227;
            --accent-purple: #8b7fff;
            --success: #28a745;
            --warning: #ffc107;
            --error: #dc3545;
            --border: #2a2a35;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            padding: 2rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border);
        }

        h1 {
            font-size: 2.5rem;
            color: var(--accent-gold);
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .timestamp {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }

        .health-score {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin: 2rem 0;
        }

        .score-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: bold;
            border: 4px solid;
        }

        .score-circle.success {
            border-color: var(--success);
            color: var(--success);
        }

        .score-circle.warning {
            border-color: var(--warning);
            color: var(--warning);
        }

        .score-circle.error {
            border-color: var(--error);
            color: var(--error);
        }

        .score-circle span {
            font-size: 1rem;
            color: var(--text-secondary);
        }

        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid var(--border);
        }

        .card h3 {
            color: var(--accent-purple);
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }

        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--border);
        }

        .stat-row:last-child {
            border-bottom: none;
        }

        .stat-label {
            color: var(--text-secondary);
        }

        .stat-value {
            font-weight: bold;
        }

        .stat-value.success { color: var(--success); }
        .stat-value.warning { color: var(--warning); }
        .stat-value.error { color: var(--error); }

        section {
            margin-bottom: 3rem;
        }

        section h2 {
            color: var(--accent-gold);
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--accent-gold);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        th {
            background: var(--bg-secondary);
            color: var(--accent-purple);
            font-weight: 600;
        }

        tr:hover {
            background: var(--bg-secondary);
        }

        tr.success td:last-child { color: var(--success); }
        tr.warning td:last-child { color: var(--warning); }
        tr.error td:last-child { color: var(--error); }

        td.score {
            font-weight: bold;
        }

        code {
            background: var(--bg-secondary);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
            font-size: 0.9rem;
        }

        .no-data {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
            font-style: italic;
        }

        footer {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
            color: var(--text-secondary);
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .health-score {
                flex-direction: column;
            }

            table {
                font-size: 0.9rem;
            }

            th, td {
                padding: 0.75rem 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Eyes of Azrael</h1>
            <p class="subtitle">Validation Report</p>
            <p class="timestamp">Generated: ${formatTimestamp(new Date().toISOString())}</p>
        </header>

        <div class="health-score">
            <div class="score-circle ${statusClass}">
                ${healthScore}%
                <span>Health Score</span>
            </div>
        </div>

        <div class="summary-cards">
            <div class="card">
                <h3>Schema Validation</h3>
                ${schemaReport ? `
                    <div class="stat-row">
                        <span class="stat-label">Total Assets</span>
                        <span class="stat-value">${schemaReport.summary.totalAssets}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Valid</span>
                        <span class="stat-value success">${schemaReport.summary.validAssets}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Invalid</span>
                        <span class="stat-value ${schemaReport.summary.invalidAssets > 0 ? 'error' : ''}">${schemaReport.summary.invalidAssets}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Pass Rate</span>
                        <span class="stat-value ${getStatusClass(schemaReport.summary.passRate)}">${schemaReport.summary.passRate}%</span>
                    </div>
                ` : '<p class="no-data">No data available</p>'}
            </div>

            <div class="card">
                <h3>Rendering Validation</h3>
                ${renderingReport ? `
                    <div class="stat-row">
                        <span class="stat-label">Total Assets</span>
                        <span class="stat-value">${renderingReport.summary.totalAssets}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Renderable</span>
                        <span class="stat-value success">${renderingReport.summary.renderableAssets}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Unrenderable</span>
                        <span class="stat-value ${renderingReport.summary.unrenderableAssets > 0 ? 'error' : ''}">${renderingReport.summary.unrenderableAssets}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Render Rate</span>
                        <span class="stat-value ${getStatusClass(renderingReport.summary.renderRate)}">${renderingReport.summary.renderRate}%</span>
                    </div>
                ` : '<p class="no-data">No data available</p>'}
            </div>

            <div class="card">
                <h3>Link Validation</h3>
                ${linksReport ? `
                    <div class="stat-row">
                        <span class="stat-label">Total Links</span>
                        <span class="stat-value">${linksReport.summary.totalLinks}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Valid</span>
                        <span class="stat-value success">${linksReport.summary.validLinks}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Broken</span>
                        <span class="stat-value ${linksReport.summary.brokenLinks > 0 ? 'error' : ''}">${linksReport.summary.brokenLinks}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Link Integrity</span>
                        <span class="stat-value ${getStatusClass(linksReport.summary.linkIntegrity)}">${linksReport.summary.linkIntegrity}%</span>
                    </div>
                ` : '<p class="no-data">No data available</p>'}
            </div>
        </div>

        ${schemaReport ? `
        <section>
            <h2>Schema Validation by Collection</h2>
            <table>
                <thead>
                    <tr>
                        <th>Collection</th>
                        <th>Total</th>
                        <th>Valid</th>
                        <th>Invalid</th>
                        <th>Errors</th>
                        <th>Warnings</th>
                        <th>Pass Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${schemaCollectionRows}
                </tbody>
            </table>
        </section>
        ` : ''}

        ${renderingReport ? `
        <section>
            <h2>Rendering Validation by Collection</h2>
            <table>
                <thead>
                    <tr>
                        <th>Collection</th>
                        <th>Total</th>
                        <th>Renderable</th>
                        <th>Unrenderable</th>
                        <th>Errors</th>
                        <th>Render Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderingCollectionRows}
                </tbody>
            </table>
        </section>
        ` : ''}

        ${linksReport ? `
        <section>
            <h2>Link Validation by Collection</h2>
            <table>
                <thead>
                    <tr>
                        <th>Collection</th>
                        <th>Total Links</th>
                        <th>Valid</th>
                        <th>Broken</th>
                        <th>External</th>
                        <th>Integrity</th>
                    </tr>
                </thead>
                <tbody>
                    ${linksCollectionRows}
                </tbody>
            </table>
        </section>
        ` : ''}

        ${brokenLinksRows ? `
        <section>
            <h2>Top Broken Link Targets</h2>
            <table>
                <thead>
                    <tr>
                        <th>Target</th>
                        <th>References</th>
                        <th>Referenced By</th>
                    </tr>
                </thead>
                <tbody>
                    ${brokenLinksRows}
                </tbody>
            </table>
        </section>
        ` : ''}

        ${commonErrorsRows ? `
        <section>
            <h2>Common Schema Errors</h2>
            <table>
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Occurrences</th>
                        <th>Examples</th>
                    </tr>
                </thead>
                <tbody>
                    ${commonErrorsRows}
                </tbody>
            </table>
        </section>
        ` : ''}

        <footer>
            <p>Eyes of Azrael Validation System</p>
            <p>Report generated automatically</p>
        </footer>
    </div>
</body>
</html>`;

    const outputPath = path.join(outputDir, 'validation-report.html');
    fs.writeFileSync(outputPath, html);
    console.log(`[Generated] HTML report: ${outputPath}`);

    return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Main execution
async function main() {
    const args = parseArgs();

    if (args.help) {
        showHelp();
        process.exit(0);
    }

    console.log('='.repeat(60));
    console.log('Generate Report - Eyes of Azrael');
    console.log('='.repeat(60));

    // Determine output directory
    const outputDir = args.output || CONFIG.reportsDir;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load validation reports
    console.log('\n[Loading] Validation reports...');
    const schemaReport = loadReport(CONFIG.schemaReport);
    const renderingReport = loadReport(CONFIG.renderingReport);
    const linksReport = loadReport(CONFIG.linksReport);

    if (!schemaReport && !renderingReport && !linksReport) {
        console.error('[Error] No validation reports found.');
        console.error('Run the validation scripts first:');
        console.error('  node validate-schema.js');
        console.error('  node validate-rendering.js');
        console.error('  node validate-links.js');
        process.exit(1);
    }

    console.log(`  Schema report: ${schemaReport ? 'Loaded' : 'Not found'}`);
    console.log(`  Rendering report: ${renderingReport ? 'Loaded' : 'Not found'}`);
    console.log(`  Links report: ${linksReport ? 'Loaded' : 'Not found'}`);

    // Generate reports
    console.log('\n[Generating] Reports...');

    if (args.format === 'json' || args.format === 'both') {
        generateJsonReport(schemaReport, renderingReport, linksReport, outputDir);
    }

    if (args.format === 'html' || args.format === 'both') {
        generateHtmlReport(schemaReport, renderingReport, linksReport, outputDir);
    }

    // Calculate and display health score
    const healthScore = calculateHealthScore(schemaReport, renderingReport, linksReport);

    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`Overall Health Score: ${healthScore}%`);
    console.log(`Status: ${getStatusClass(healthScore).toUpperCase()}`);
    console.log(`Output Directory: ${outputDir}`);
}

// Export for use as module
module.exports = {
    CONFIG,
    loadReport,
    calculateHealthScore,
    generateJsonReport,
    generateHtmlReport
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
