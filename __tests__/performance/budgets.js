/**
 * Performance Budgets Configuration
 * Eyes of Azrael - Final Polish Agent 3
 *
 * Defines performance thresholds for both local development
 * and CI environments. CI budgets are more lenient due to
 * slower hardware.
 *
 * Usage:
 *   const { PERFORMANCE_BUDGETS, getTimeout } = require('./budgets.js');
 *   expect(duration).toBeLessThan(getTimeout('search'));
 */

// Detect CI environment
const isCI = process.env.CI === 'true' ||
             process.env.GITHUB_ACTIONS === 'true' ||
             process.env.TRAVIS === 'true' ||
             process.env.CIRCLECI === 'true';

// Timeout multiplier for CI
const CI_MULTIPLIER = 2.5;
const LOCAL_MULTIPLIER = 1.0;

/**
 * Performance budgets (in milliseconds)
 * Each budget has local and CI values
 */
const PERFORMANCE_BUDGETS = {
    // Search operations
    search: {
        local: 100,
        ci: 250,
        description: 'Search rendering time'
    },
    searchAverage: {
        local: 50,
        ci: 125,
        description: 'Average search time over 100 operations'
    },
    searchMax: {
        local: 150,
        ci: 375,
        description: 'Maximum search time in stress test'
    },

    // Rendering operations
    render: {
        local: 50,
        ci: 125,
        description: 'Entity card batch rendering'
    },
    renderDOM: {
        local: 100,
        ci: 250,
        description: 'DOM bulk update operations'
    },

    // Filter and sort operations
    filter: {
        local: 100,
        ci: 250,
        description: 'Client-side filtering (1000 items)'
    },
    filterComplex: {
        local: 150,
        ci: 375,
        description: 'Complex multi-filter operations'
    },
    sort: {
        local: 100,
        ci: 250,
        description: 'Sorting operations (500 items)'
    },

    // Large dataset operations
    largeDataset: {
        local: 500,
        ci: 1250,
        description: 'Large dataset processing (1000 items)'
    },
    pagination: {
        local: 10,
        ci: 25,
        description: 'Pagination navigation'
    },

    // Concurrent operations
    concurrent: {
        local: 1000,
        ci: 2500,
        description: '10 concurrent searches'
    },
    rapidFilters: {
        local: 500,
        ci: 1250,
        description: '50 rapid filter changes'
    },

    // Batch operations - use multipliers for relative thresholds
    batchDegradation: {
        local: 2.0,   // Max 2x degradation
        ci: 2.5,      // Max 2.5x degradation
        description: 'Performance degradation ratio (last/first batch)'
    },
    performanceDegradation: {
        local: 20,    // Max 20% degradation
        ci: 30,       // Max 30% degradation allowed in CI
        description: 'Performance degradation percentage over 1000 operations'
    }
};

/**
 * Get timeout value based on environment
 * @param {string} operation - Operation name from PERFORMANCE_BUDGETS
 * @returns {number} Timeout in milliseconds
 */
function getTimeout(operation) {
    const budget = PERFORMANCE_BUDGETS[operation];
    if (!budget) {
        throw new Error(`Unknown performance budget: ${operation}`);
    }

    return isCI ? budget.ci : budget.local;
}

/**
 * Get multiplier value based on environment
 * @param {string} operation - Operation name from PERFORMANCE_BUDGETS
 * @returns {number} Multiplier value
 */
function getMultiplier(operation) {
    const budget = PERFORMANCE_BUDGETS[operation];
    if (!budget) {
        throw new Error(`Unknown performance budget: ${operation}`);
    }

    return isCI ? budget.ci : budget.local;
}

/**
 * Get environment description for logging
 * @returns {string} Environment description
 */
function getEnvironment() {
    return isCI ? 'CI' : 'LOCAL';
}

/**
 * Log performance budget for test
 * @param {string} operation - Operation name
 * @param {number} actual - Actual measurement
 * @param {string} unit - Unit (ms, %, x, etc.)
 */
function logPerformance(operation, actual, unit = 'ms') {
    const budget = PERFORMANCE_BUDGETS[operation];
    const threshold = isCI ? budget.ci : budget.local;
    const passed = actual < threshold;
    const status = passed ? '✅' : '❌';
    const env = getEnvironment();

    console.log(
        `${status} ${operation}: ${actual.toFixed(2)}${unit} ` +
        `(threshold: ${threshold}${unit}, env: ${env})`
    );
}

/**
 * Generate performance report
 */
function generateReport() {
    console.log('\n📊 Performance Budget Configuration');
    console.log('═'.repeat(70));
    console.log(`Environment: ${getEnvironment()}`);
    console.log(`CI Multiplier: ${CI_MULTIPLIER}x`);
    console.log('');
    console.log('Operation'.padEnd(30) + 'Local'.padEnd(15) + 'CI'.padEnd(15) + 'Active');
    console.log('─'.repeat(70));

    Object.entries(PERFORMANCE_BUDGETS).forEach(([key, budget]) => {
        const active = isCI ? budget.ci : budget.local;
        const unit = key.includes('Degradation') || key.includes('batch') ? '' : 'ms';

        console.log(
            key.padEnd(30) +
            `${budget.local}${unit}`.padEnd(15) +
            `${budget.ci}${unit}`.padEnd(15) +
            `${active}${unit}`
        );
    });

    console.log('═'.repeat(70));
    console.log('');
}

// Auto-generate report when CI environment variable changes
if (process.env.DEBUG_PERF === 'true') {
    generateReport();
}

// Export for CommonJS (Jest)
module.exports = {
    isCI,
    CI_MULTIPLIER,
    LOCAL_MULTIPLIER,
    PERFORMANCE_BUDGETS,
    getTimeout,
    getMultiplier,
    getEnvironment,
    logPerformance,
    generateReport
};
