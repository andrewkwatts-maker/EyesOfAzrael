/**
 * Jest configuration for the Firestore security-rules suite.
 *
 * Separate from jest.config.js because these tests need a node environment
 * and a running Firestore emulator, whereas the main suite is jsdom-only and
 * must stay runnable with no external processes. Driven by `npm run test:rules`.
 */
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__/rules'],
    testMatch: ['**/__tests__/rules/**/*.test.js'],
    // The emulator is cold on the first assertion and the suite clears the
    // database between tests, so the 10s default of the unit suite is tight.
    testTimeout: 30000,
    verbose: true
};
