/**
 * Jest Configuration
 * Eyes of Azrael - Unit Testing Setup
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test file patterns
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],

  // The security-rules suite needs a running Firestore emulator and a node
  // environment, so it is driven separately by `npm run test:rules`
  // (jest.rules.config.js) rather than from the default jsdom run.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/rules/'],

  // Coverage configuration — collect from tested modules only
  collectCoverageFrom: [
    'js/components/**/*.js',
    'js/core/**/*.js',
    'js/router/**/*.js',
    'js/views/**/*.js',
    'js/services/**/*.js',
    'js/utils/**/*.js',
    'js/spa-navigation.js',
    'js/app-init-simple.js',
    'js/auth-guard-simple.js',
    'js/firebase-cache-manager.js',
    'js/entity-renderer-firebase.js',
    'js/simple-theme-toggle.js',
    'js/toast-notifications.js',
    'js/offline-event-logger.js',
    'js/global-error-handler.js',
    '!js/**/*.min.js',
    '!js/vendor/**',
    '!js/lib/**'
  ],

  // Collect coverage from specific files
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/vendor/',
    '/lib/',
    '\\.min\\.js$'
  ],

  // Coverage thresholds
  // Ratchet, not target: set just under current coverage so the suite fails
  // on regression but not on new (yet-untested) feature code. Re-raise as
  // coverage for the static+delta path grows.
  coverageThreshold: {
    global: {
      branches: 48,
      functions: 57,
      lines: 55,
      statements: 55
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Module name mapper for CSS imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Transform files
  transform: {},

  // Test timeout
  testTimeout: 10000,

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true
};
