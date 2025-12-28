#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Generates comprehensive markdown coverage report from Jest coverage data
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper functions
function getStatus(percentage) {
  if (percentage >= 90) return '✅ Excellent';
  if (percentage >= 80) return '✓ Good';
  if (percentage >= 70) return '⚠️ Fair';
  return '❌ Poor';
}

function getStatusEmoji(percentage) {
  if (percentage >= 90) return '✅';
  if (percentage >= 80) return '✓';
  if (percentage >= 70) return '⚠️';
  return '❌';
}

function getColor(percentage) {
  if (percentage >= 90) return colors.green;
  if (percentage >= 80) return colors.cyan;
  if (percentage >= 70) return colors.yellow;
  return colors.red;
}

function formatPercentage(pct) {
  return `${pct.toFixed(2)}%`;
}

function calculateTrend(current, previous) {
  if (!previous) return '';
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return '→ (no change)';
  if (diff > 0) return `↗ (+${diff.toFixed(2)}%)`;
  return `↘ (${diff.toFixed(2)}%)`;
}

// Main function
function generateCoverageReport() {
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  const reportPath = path.join(__dirname, '..', 'COVERAGE_REPORT.md');
  const previousReportPath = path.join(__dirname, '..', 'coverage', 'previous-coverage.json');

  // Check if coverage file exists
  if (!fs.existsSync(coveragePath)) {
    console.error(`${colors.red}Error: Coverage file not found at ${coveragePath}${colors.reset}`);
    console.error('Run "npm run test:coverage" first to generate coverage data.');
    process.exit(1);
  }

  // Read coverage data
  let coverage;
  try {
    coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}Error reading coverage file: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Read previous coverage if exists
  let previousCoverage = null;
  if (fs.existsSync(previousReportPath)) {
    try {
      previousCoverage = JSON.parse(fs.readFileSync(previousReportPath, 'utf8'));
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not read previous coverage${colors.reset}`);
    }
  }

  // Start building report
  let report = '# Test Coverage Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Project:** Eyes of Azrael\n`;
  report += `**Test Framework:** Jest\n\n`;

  // Overall Coverage
  const total = coverage.total;
  report += '## Overall Coverage\n\n';
  report += '| Metric | Coverage | Status | Threshold | Trend |\n';
  report += '|--------|----------|--------|-----------|-------|\n';

  const metrics = [
    { name: 'Statements', key: 'statements', threshold: 80 },
    { name: 'Branches', key: 'branches', threshold: 80 },
    { name: 'Functions', key: 'functions', threshold: 85 },
    { name: 'Lines', key: 'lines', threshold: 80 }
  ];

  metrics.forEach(metric => {
    const pct = total[metric.key].pct;
    const status = getStatusEmoji(pct);
    const meetsThreshold = pct >= metric.threshold ? '✓' : '✗';
    const trend = previousCoverage ?
      calculateTrend(pct, previousCoverage.total[metric.key].pct) :
      'N/A';

    report += `| ${metric.name} | ${formatPercentage(pct)} | ${status} | ${metric.threshold}% ${meetsThreshold} | ${trend} |\n`;
  });

  report += '\n';

  // Coverage Summary
  const avgCoverage = (total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4;
  report += '### Summary\n\n';
  report += `- **Average Coverage:** ${formatPercentage(avgCoverage)}\n`;
  report += `- **Total Files:** ${Object.keys(coverage).length - 1}\n`;
  report += `- **Covered Statements:** ${total.statements.covered} / ${total.statements.total}\n`;
  report += `- **Covered Branches:** ${total.branches.covered} / ${total.branches.total}\n`;
  report += `- **Covered Functions:** ${total.functions.covered} / ${total.functions.total}\n`;
  report += `- **Covered Lines:** ${total.lines.covered} / ${total.lines.total}\n\n`;

  // Per-File Coverage
  report += '## Per-File Coverage\n\n';
  report += '| File | Statements | Branches | Functions | Lines | Status |\n';
  report += '|------|------------|----------|-----------|-------|--------|\n';

  // Sort files by average coverage (lowest first to highlight problem areas)
  const files = Object.entries(coverage)
    .filter(([key]) => key !== 'total')
    .map(([file, data]) => {
      const avg = (data.statements.pct + data.branches.pct + data.functions.pct + data.lines.pct) / 4;
      return { file, data, avg };
    })
    .sort((a, b) => a.avg - b.avg);

  files.forEach(({ file, data, avg }) => {
    const fileName = file.replace(/^.*[\\\/]/, ''); // Get filename only
    const status = getStatusEmoji(avg);
    report += `| ${fileName} | ${formatPercentage(data.statements.pct)} | ${formatPercentage(data.branches.pct)} | ${formatPercentage(data.functions.pct)} | ${formatPercentage(data.lines.pct)} | ${status} |\n`;
  });

  report += '\n';

  // Files Needing Attention
  const needsAttention = files.filter(f => f.avg < 80);
  if (needsAttention.length > 0) {
    report += '## Files Needing Attention\n\n';
    report += 'The following files have coverage below 80%:\n\n';
    needsAttention.forEach(({ file, avg }) => {
      const fileName = file.replace(/^.*[\\\/]/, '');
      report += `- **${fileName}**: ${formatPercentage(avg)} coverage\n`;
    });
    report += '\n';
  }

  // Well-Covered Files
  const wellCovered = files.filter(f => f.avg >= 90);
  if (wellCovered.length > 0) {
    report += '## Well-Covered Files\n\n';
    report += 'The following files have excellent coverage (≥90%):\n\n';
    wellCovered.forEach(({ file, avg }) => {
      const fileName = file.replace(/^.*[\\\/]/, '');
      report += `- **${fileName}**: ${formatPercentage(avg)} coverage\n`;
    });
    report += '\n';
  }

  // Coverage Goals
  report += '## Coverage Goals\n\n';
  report += '### Current Thresholds\n\n';
  report += '- Statements: 80%\n';
  report += '- Branches: 80%\n';
  report += '- Functions: 85%\n';
  report += '- Lines: 80%\n\n';

  const allMet = metrics.every(m => total[m.key].pct >= m.threshold);
  if (allMet) {
    report += '✅ **All coverage thresholds met!**\n\n';
  } else {
    report += '❌ **Some coverage thresholds not met**\n\n';
    report += 'Please add tests to improve coverage for:\n\n';
    metrics.forEach(metric => {
      if (total[metric.key].pct < metric.threshold) {
        const gap = metric.threshold - total[metric.key].pct;
        report += `- ${metric.name}: Currently ${formatPercentage(total[metric.key].pct)}, need ${formatPercentage(gap)} more\n`;
      }
    });
    report += '\n';
  }

  // Recommendations
  report += '## Recommendations\n\n';
  if (avgCoverage >= 90) {
    report += '✅ Excellent coverage! Focus on maintaining this level.\n\n';
  } else if (avgCoverage >= 80) {
    report += '✓ Good coverage. Consider adding more edge case tests.\n\n';
  } else {
    report += '⚠️ Coverage could be improved. Focus on:\n\n';
    report += '1. Adding tests for uncovered files\n';
    report += '2. Testing error handling paths\n';
    report += '3. Adding edge case tests\n';
    report += '4. Testing async operations\n\n';
  }

  // How to Improve
  report += '### How to Improve Coverage\n\n';
  report += '1. Run `npm run test:coverage` to see detailed coverage\n';
  report += '2. Open `coverage/lcov-report/index.html` in browser\n';
  report += '3. Click on files with low coverage\n';
  report += '4. Add tests for highlighted uncovered lines\n';
  report += '5. Focus on critical paths and error handling\n\n';

  // Next Steps
  report += '## Next Steps\n\n';
  report += '- [ ] Review files with coverage below 80%\n';
  report += '- [ ] Add tests for uncovered branches\n';
  report += '- [ ] Add error handling tests\n';
  report += '- [ ] Add edge case tests\n';
  report += '- [ ] Review and update this report regularly\n\n';

  // Footer
  report += '---\n\n';
  report += '**How to use this report:**\n\n';
  report += '1. Focus on files in "Needing Attention" section first\n';
  report += '2. Open coverage HTML report: `npm run coverage:open`\n';
  report += '3. Click on low-coverage files to see uncovered lines\n';
  report += '4. Add tests for uncovered code\n';
  report += '5. Re-run coverage: `npm run test:coverage`\n\n';
  report += '*This report is automatically generated. Do not edit manually.*\n';

  // Write report
  try {
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`${colors.green}✓ Coverage report generated: ${reportPath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error writing report: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Save current coverage as previous for next run
  try {
    fs.writeFileSync(previousReportPath, JSON.stringify(coverage, null, 2), 'utf8');
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not save coverage for comparison${colors.reset}`);
  }

  // Console output
  console.log(`\n${colors.bright}Coverage Summary:${colors.reset}`);
  console.log(`${getColor(total.statements.pct)}Statements: ${formatPercentage(total.statements.pct)}${colors.reset}`);
  console.log(`${getColor(total.branches.pct)}Branches:   ${formatPercentage(total.branches.pct)}${colors.reset}`);
  console.log(`${getColor(total.functions.pct)}Functions:  ${formatPercentage(total.functions.pct)}${colors.reset}`);
  console.log(`${getColor(total.lines.pct)}Lines:      ${formatPercentage(total.lines.pct)}${colors.reset}`);
  console.log(`${getColor(avgCoverage)}Average:    ${formatPercentage(avgCoverage)}${colors.reset}\n`);

  if (allMet) {
    console.log(`${colors.green}✅ All coverage thresholds met!${colors.reset}\n`);
    return 0;
  } else {
    console.log(`${colors.yellow}⚠️  Some coverage thresholds not met${colors.reset}\n`);
    return 1;
  }
}

// Run if called directly
if (require.main === module) {
  const exitCode = generateCoverageReport();
  process.exit(exitCode);
}

module.exports = { generateCoverageReport };
