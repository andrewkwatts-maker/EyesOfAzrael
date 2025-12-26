/**
 * Master Script: Fix All Metadata Issues
 *
 * This script runs all metadata fixing scripts in sequence:
 * 1. Fix unknown mythology
 * 2. Add missing metadata
 * 3. Validate and upload to Firebase
 *
 * Usage:
 *   node scripts/fix-all-metadata-issues.js
 *   node scripts/fix-all-metadata-issues.js --upload
 *   node scripts/fix-all-metadata-issues.js --skip-validation
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Execute a script and return a promise
 */
function executeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const scriptName = path.basename(scriptPath);
    console.log(`\n${colors.bright}${colors.blue}=== Running: ${scriptName} ===${colors.reset}\n`);

    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}✓ ${scriptName} completed successfully${colors.reset}\n`);
        resolve({ success: true, script: scriptName });
      } else {
        console.error(`\n${colors.red}✗ ${scriptName} failed with code ${code}${colors.reset}\n`);
        reject(new Error(`${scriptName} failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`\n${colors.red}✗ Failed to execute ${scriptName}: ${error.message}${colors.reset}\n`);
      reject(error);
    });
  });
}

/**
 * Generate final summary report
 */
async function generateSummaryReport() {
  const reports = {
    mythology: null,
    metadata: null,
    validation: null
  };

  // Read individual reports
  try {
    const mythologyReport = await fs.readFile(
      path.join(process.cwd(), 'scripts', 'fix-unknown-mythology-report.json'),
      'utf8'
    );
    reports.mythology = JSON.parse(mythologyReport);
  } catch (e) {
    console.log(`${colors.yellow}Could not read mythology report${colors.reset}`);
  }

  try {
    const metadataReport = await fs.readFile(
      path.join(process.cwd(), 'scripts', 'add-missing-metadata-report.json'),
      'utf8'
    );
    reports.metadata = JSON.parse(metadataReport);
  } catch (e) {
    console.log(`${colors.yellow}Could not read metadata report${colors.reset}`);
  }

  try {
    const validationReport = await fs.readFile(
      path.join(process.cwd(), 'scripts', 'validation-upload-report.json'),
      'utf8'
    );
    reports.validation = JSON.parse(validationReport);
  } catch (e) {
    console.log(`${colors.yellow}Could not read validation report${colors.reset}`);
  }

  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    executionSummary: {
      step1_fixMythology: reports.mythology?.summary || null,
      step2_addMetadata: reports.metadata?.summary || null,
      step3_validation: reports.validation?.summary || null
    },
    overallResults: {
      totalFiles: reports.validation?.statistics?.totalFiles || 0,
      mythologyFixed: reports.mythology?.summary?.successfullyFixed || 0,
      metadataEnhanced: reports.metadata?.summary?.enhanced || 0,
      validEntities: reports.validation?.statistics?.validated || 0,
      invalidEntities: reports.validation?.statistics?.invalid || 0,
      uploadedToFirebase: reports.validation?.statistics?.uploaded || 0
    },
    recommendations: []
  };

  // Add recommendations based on results
  if (summary.overallResults.invalidEntities > 0) {
    summary.recommendations.push(
      `${summary.overallResults.invalidEntities} entities still have validation errors. Review the validation report for details.`
    );
  }

  if (reports.mythology && reports.mythology.summary?.failed > 0) {
    summary.recommendations.push(
      `${reports.mythology.summary.failed} entities could not have their mythology inferred. Manual review needed.`
    );
  }

  if (reports.validation?.validationErrors && Object.keys(reports.validation.validationErrors).length > 0) {
    const topError = Object.entries(reports.validation.validationErrors)
      .sort((a, b) => b[1] - a[1])[0];
    summary.recommendations.push(
      `Most common validation error: "${topError[0]}" (${topError[1]} occurrences)`
    );
  }

  if (summary.overallResults.invalidEntities === 0) {
    summary.recommendations.push(
      'All entities passed validation! Ready for production use.'
    );
  }

  return summary;
}

/**
 * Print final summary
 */
function printSummary(summary) {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║         METADATA FIXING - FINAL SUMMARY REPORT             ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Timestamp:${colors.reset} ${summary.timestamp}\n`);

  console.log(`${colors.bright}Overall Results:${colors.reset}`);
  console.log(`  Total Files: ${colors.cyan}${summary.overallResults.totalFiles}${colors.reset}`);
  console.log(`  Mythology Fixed: ${colors.green}${summary.overallResults.mythologyFixed}${colors.reset}`);
  console.log(`  Metadata Enhanced: ${colors.green}${summary.overallResults.metadataEnhanced}${colors.reset}`);
  console.log(`  Valid Entities: ${colors.green}${summary.overallResults.validEntities}${colors.reset}`);
  console.log(`  Invalid Entities: ${colors.red}${summary.overallResults.invalidEntities}${colors.reset}`);
  console.log(`  Uploaded to Firebase: ${colors.green}${summary.overallResults.uploadedToFirebase}${colors.reset}\n`);

  if (summary.recommendations.length > 0) {
    console.log(`${colors.bright}Recommendations:${colors.reset}`);
    summary.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
    console.log();
  }

  console.log(`${colors.cyan}Detailed reports available:${colors.reset}`);
  console.log(`  - scripts/fix-unknown-mythology-report.json`);
  console.log(`  - scripts/add-missing-metadata-report.json`);
  console.log(`  - scripts/validation-upload-report.json`);
  console.log(`  - scripts/metadata-fixing-summary.json`);
  console.log();
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    upload: args.includes('--upload'),
    skipValidation: args.includes('--skip-validation')
  };

  console.log(`${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║              FIX ALL METADATA ISSUES - MASTER              ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Options:${colors.reset}`);
  console.log(`  Upload to Firebase: ${options.upload ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
  console.log(`  Skip Validation: ${options.skipValidation ? colors.yellow + 'YES' : colors.green + 'NO'}${colors.reset}`);
  console.log();

  const startTime = Date.now();
  const results = [];

  try {
    // Step 1: Fix unknown mythology
    console.log(`${colors.bright}STEP 1/3: Fixing Unknown Mythology${colors.reset}`);
    const step1 = await executeScript(
      path.join(__dirname, 'fix-unknown-mythology.js')
    );
    results.push(step1);

    // Step 2: Add missing metadata
    console.log(`${colors.bright}STEP 2/3: Adding Missing Metadata${colors.reset}`);
    const step2 = await executeScript(
      path.join(__dirname, 'add-missing-metadata.js')
    );
    results.push(step2);

    // Step 3: Validate and optionally upload
    if (!options.skipValidation) {
      console.log(`${colors.bright}STEP 3/3: Validation ${options.upload ? 'and Upload' : ''}${colors.reset}`);
      const validationArgs = options.upload ? ['--upload'] : [];
      const step3 = await executeScript(
        path.join(__dirname, 'validate-and-upload-fixed.js'),
        validationArgs
      );
      results.push(step3);
    } else {
      console.log(`${colors.yellow}Skipping validation step${colors.reset}`);
    }

    // Generate and save summary report
    console.log(`\n${colors.cyan}Generating summary report...${colors.reset}`);
    const summary = await generateSummaryReport();
    const summaryPath = path.join(process.cwd(), 'scripts', 'metadata-fixing-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    // Print summary
    printSummary(summary);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`${colors.green}${colors.bright}✓ All steps completed successfully in ${totalDuration}s${colors.reset}\n`);

    // Exit with success
    process.exit(0);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Process failed: ${error.message}${colors.reset}\n`);
    console.error(`${colors.yellow}Completed steps: ${results.map(r => r.script).join(', ')}${colors.reset}\n`);

    // Exit with error
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
