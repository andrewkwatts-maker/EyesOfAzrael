/**
 * Navigation Route Test Script
 *
 * Run this in browser console to test all navigation routes
 * Usage: Copy and paste into browser console on the app
 */

(function testNavigationRoutes() {
    const testCases = [
        // Home routes
        { name: 'Home (hash)', hash: '#/', expected: 'home' },
        { name: 'Home (empty)', hash: '', expected: 'home' },

        // Mythologies route
        { name: 'Mythologies list', hash: '#/mythologies', expected: 'mythologies list' },

        // Mythology detail
        { name: 'Greek mythology', hash: '#/mythology/greek', expected: 'mythology detail' },
        { name: 'Norse mythology', hash: '#/mythology/norse', expected: 'mythology detail' },

        // Entity routes - 2-param (NEW)
        { name: 'Entity simple (deities/zeus)', hash: '#/entity/deities/zeus', expected: 'entity detail' },
        { name: 'Entity simple (heroes/heracles)', hash: '#/entity/heroes/heracles', expected: 'entity detail' },
        { name: 'Entity simple (creatures/cerberus)', hash: '#/entity/creatures/cerberus', expected: 'entity detail' },

        // Entity routes - singular form (should convert)
        { name: 'Entity singular (deity/zeus)', hash: '#/entity/deity/zeus', expected: 'entity detail' },
        { name: 'Entity singular (hero/achilles)', hash: '#/entity/hero/achilles', expected: 'entity detail' },

        // Entity routes - 3-param alt format
        { name: 'Entity alt (deities/greek/zeus)', hash: '#/entity/deities/greek/zeus', expected: 'entity detail' },
        { name: 'Entity alt (heroes/greek/heracles)', hash: '#/entity/heroes/greek/heracles', expected: 'entity detail' },

        // Entity routes - mythology/type/id format
        { name: 'Entity (mythology/greek/deity/zeus)', hash: '#/mythology/greek/deity/zeus', expected: 'entity detail' },
        { name: 'Entity (mythology/norse/deity/odin)', hash: '#/mythology/norse/deity/odin', expected: 'entity detail' },
        { name: 'Entity plural (mythology/greek/deities/zeus)', hash: '#/mythology/greek/deities/zeus', expected: 'entity detail' },

        // Category browse
        { name: 'Browse category', hash: '#/browse/deities', expected: 'browse category' },
        { name: 'Browse deities/greek', hash: '#/browse/deities/greek', expected: 'browse filtered' },

        // Search
        { name: 'Search page', hash: '#/search', expected: 'search' },
        { name: 'Corpus explorer', hash: '#/corpus-explorer', expected: 'corpus explorer' },

        // User routes
        { name: 'Profile', hash: '#/profile', expected: 'profile' },
        { name: 'Saved', hash: '#/saved', expected: 'saved' },
    ];

    console.log('%c═══════════════════════════════════════════════', 'color: #8b7fff; font-weight: bold');
    console.log('%c   NAVIGATION ROUTE TEST SUITE', 'color: #8b7fff; font-weight: bold; font-size: 14px');
    console.log('%c═══════════════════════════════════════════════', 'color: #8b7fff; font-weight: bold');
    console.log('');

    let passed = 0;
    let failed = 0;

    // Get SPA navigation instance
    const spa = window.spaNav || window.SPANavigationInstance;
    if (!spa) {
        console.error('SPA Navigation instance not found! Make sure the app is loaded.');
        return;
    }

    console.log('%cTesting route patterns...', 'color: #51cf66');
    console.log('');

    testCases.forEach((test, index) => {
        const path = test.hash || '';

        // Test route matching
        let matched = false;
        let matchedRoute = null;

        for (const [routeName, pattern] of Object.entries(spa.routes)) {
            if (pattern.test(path)) {
                matched = true;
                matchedRoute = routeName;
                break;
            }
        }

        // Log result
        const status = matched ? '✓' : '✗';
        const color = matched ? '#51cf66' : '#ff6b6b';

        console.log(
            `%c${status} ${index + 1}. ${test.name}`,
            `color: ${color}; font-weight: bold`
        );
        console.log(`   Hash: ${test.hash || '(empty)'}`);
        console.log(`   Matched: ${matchedRoute || 'none'}`);
        console.log('');

        if (matched) passed++;
        else failed++;
    });

    // Summary
    console.log('%c═══════════════════════════════════════════════', 'color: #8b7fff; font-weight: bold');
    console.log(`%c   RESULTS: ${passed} passed, ${failed} failed`,
        `color: ${failed > 0 ? '#ff6b6b' : '#51cf66'}; font-weight: bold`);
    console.log('%c═══════════════════════════════════════════════', 'color: #8b7fff; font-weight: bold');

    // Test getCollectionName
    console.log('');
    console.log('%cTesting getCollectionName() conversions...', 'color: #51cf66');
    console.log('');

    const collectionTests = [
        { input: 'deity', expected: 'deities' },
        { input: 'Deity', expected: 'deities' },
        { input: 'DEITY', expected: 'deities' },
        { input: 'hero', expected: 'heroes' },
        { input: 'heroes', expected: 'heroes' },
        { input: 'creature', expected: 'creatures' },
        { input: 'creatures', expected: 'creatures' },
        { input: 'item', expected: 'items' },
        { input: 'mythology', expected: 'mythologies' },
        { input: 'cosmology', expected: 'cosmology' },
    ];

    collectionTests.forEach(test => {
        const result = spa.getCollectionName(test.input);
        const pass = result === test.expected;
        const status = pass ? '✓' : '✗';
        const color = pass ? '#51cf66' : '#ff6b6b';

        console.log(
            `%c${status} "${test.input}" → "${result}" (expected: "${test.expected}")`,
            `color: ${color}`
        );
    });

    return { passed, failed, total: testCases.length };
})();
