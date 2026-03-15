/**
 * ESLint Flat Config (v10+)
 * Eyes of Azrael
 */

module.exports = [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        HTMLElement: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Promise: 'readonly',
        Symbol: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        // Firebase globals
        firebase: 'readonly',
        firebaseConfig: 'readonly',
        // Google Analytics
        gtag: 'readonly',
        dataLayer: 'readonly',
        // App globals
        EyesOfAzrael: 'writable',
        SPANavigation: 'writable',
        RoutePreloader: 'writable',
        ScrollManager: 'writable',
        NavigationMetrics: 'writable',
        RouterAccessibilityManager: 'writable',
        AccessibilityManager: 'writable',
        // Module exports
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      }
    },
    rules: {
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['warn', 'smart'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'js/**/*.min.js',
      'firebase-assets-*/**',
      'scripts/**',
      '__tests__/**',
      'e2e/**',
      '*.config.js',
    ]
  }
];
