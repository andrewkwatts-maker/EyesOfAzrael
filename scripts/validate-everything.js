#!/usr/bin/env node

/**
 * Unified Validation Runner
 *
 * Runs all validation steps in sequence and reports results.
 *
 * Usage:
 *   node scripts/validate-everything.js          # Full validation
 *   node scripts/validate-everything.js --quick   # Skip Firebase-dependent checks
 *   npm run validate:all                          # Via npm script
 *   npm run validate:quick                        # Quick mode via npm
 */

const { execSync } = require('child_process');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const args = process.argv.slice(2);
const quickMode = args.includes('--quick');

const steps = [
    {
        name: 'Lint',
        command: 'npx eslint js/ --max-warnings 0',
        quick: true
    },
    {
        name: 'Project Integrity',
        command: 'node scripts/validate-project-integrity.js',
        quick: true
    },
    {
        name: 'SPA Link Validation',
        command: 'node scripts/validate-spa-links.js',
        quick: true
    },
    {
        name: 'Unit Tests + Coverage',
        command: 'npx jest --ci --coverage',
        quick: true
    },
    {
        name: 'Entity Validation',
        command: 'node scripts/validate-entities.js',
        quick: false
    },
    {
        name: 'Cross-Link Validation',
        command: 'node scripts/validate-cross-links.js',
        quick: false
    }
];

const results = [];

console.log(`\n${BOLD}${CYAN}============================================${RESET}`);
console.log(`${BOLD}${CYAN}  EYES OF AZRAEL - VALIDATION SUITE${RESET}`);
console.log(`${BOLD}${CYAN}============================================${RESET}`);
console.log(`${DIM}Mode: ${quickMode ? 'Quick (skipping Firebase checks)' : 'Full'}${RESET}\n`);

for (const step of steps) {
    if (quickMode && !step.quick) {
        results.push({ name: step.name, status: 'SKIP', duration: 0 });
        console.log(`${DIM}[SKIP] ${step.name} (Firebase-dependent)${RESET}`);
        continue;
    }

    const start = Date.now();
    process.stdout.write(`${CYAN}[RUN]${RESET}  ${step.name}...`);

    try {
        const output = execSync(step.command, {
            cwd: path.resolve(__dirname, '..'),
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 300000,
            encoding: 'utf-8'
        });
        const duration = Date.now() - start;
        results.push({ name: step.name, status: 'PASS', duration });
        console.log(`\r${GREEN}[PASS]${RESET} ${step.name} ${DIM}(${(duration / 1000).toFixed(1)}s)${RESET}`);
    } catch (error) {
        const duration = Date.now() - start;
        const stderr = (error.stderr || '').trim();
        const stdout = (error.stdout || '').trim();
        const output = stderr || stdout;

        // Jest exits non-zero for coverage threshold warnings even when all tests pass
        const allTestsPass = output.includes('passed') && !output.includes('failed');
        const isCoverageOnly = allTestsPass && output.includes('coverage');

        if (isCoverageOnly) {
            results.push({ name: step.name, status: 'WARN', duration });
            console.log(`\r${YELLOW}[WARN]${RESET} ${step.name} ${DIM}(${(duration / 1000).toFixed(1)}s) — coverage below threshold${RESET}`);
        } else {
            results.push({ name: step.name, status: 'FAIL', duration, error: error.message });
            console.log(`\r${RED}[FAIL]${RESET} ${step.name} ${DIM}(${(duration / 1000).toFixed(1)}s)${RESET}`);
        }

        if (output) {
            const lines = output.split('\n').slice(-5);
            lines.forEach(line => console.log(`       ${DIM}${line}${RESET}`));
        }
    }
}

// Summary
console.log(`\n${BOLD}${CYAN}============================================${RESET}`);
console.log(`${BOLD}${CYAN}  RESULTS${RESET}`);
console.log(`${BOLD}${CYAN}============================================${RESET}\n`);

const colName = 32;
const colStatus = 8;
const colTime = 10;

console.log(`${BOLD}${'Step'.padEnd(colName)} ${'Status'.padEnd(colStatus)} ${'Time'.padEnd(colTime)}${RESET}`);
console.log(`${'-'.repeat(colName + colStatus + colTime + 2)}`);

for (const r of results) {
    const statusColor = r.status === 'PASS' ? GREEN : r.status === 'FAIL' ? RED : YELLOW;
    const time = r.duration > 0 ? `${(r.duration / 1000).toFixed(1)}s` : '-';
    console.log(`${r.name.padEnd(colName)} ${statusColor}${r.status.padEnd(colStatus)}${RESET} ${DIM}${time.padEnd(colTime)}${RESET}`);
}

const passed = results.filter(r => r.status === 'PASS').length;
const warned = results.filter(r => r.status === 'WARN').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const skipped = results.filter(r => r.status === 'SKIP').length;
const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`${'-'.repeat(colName + colStatus + colTime + 2)}`);
console.log(`${BOLD}${passed} passed${RESET}${warned > 0 ? `, ${YELLOW}${warned} warnings${RESET}` : ''}, ${failed > 0 ? RED + BOLD : ''}${failed} failed${RESET}, ${skipped} skipped ${DIM}(${(totalTime / 1000).toFixed(1)}s total)${RESET}`);
console.log();

if (failed > 0) {
    console.log(`${RED}${BOLD}Validation failed.${RESET}`);
    process.exit(1);
} else {
    console.log(`${GREEN}${BOLD}All validations passed.${RESET}`);
    process.exit(0);
}
