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

  // Coverage configuration
  collectCoverageFrom: [
    'js/**/*.js',
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
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    },
    './js/analytics.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
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
