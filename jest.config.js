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

  // Coverage configuration — collect from tested modules only
  collectCoverageFrom: [
    'js/components/**/*.js',
    'js/router/**/*.js',
    'js/views/**/*.js',
    'js/services/**/*.js',
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
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
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
