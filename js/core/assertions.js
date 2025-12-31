console.log('[LAYER13-DEBUG] assertions.js started loading');
/**
 * Eyes of Azrael - Assertion Utilities
 *
 * Strong type-checking and validation utilities for robust dependency management.
 * These assertions provide clear, actionable error messages when things fail.
 *
 * Usage:
 *   Assertions.assertNonNull(myService, 'MyService');
 *   Assertions.assertType(value, 'function', 'callback');
 *   Assertions.assertDependency('SPANavigation', window.SPANavigation, ['navigate', 'handleRoute']);
 *
 * @module core/assertions
 */

const Assertions = {
    /**
     * Configuration for assertion behavior
     */
    config: {
        throwOnFailure: true,     // If false, just logs errors
        logLevel: 'error',        // 'error', 'warn', 'none'
        collectFailures: true     // Collect all failures for diagnostic report
    },

    /**
     * Collected assertion failures for diagnostics
     * @type {Array<{assertion: string, context: string, message: string, timestamp: number}>}
     */
    failures: [],

    /**
     * Assert that a value is not null or undefined
     *
     * @param {*} value - Value to check
     * @param {string} name - Name of the value for error messages
     * @throws {Error} If value is null or undefined
     * @returns {*} The value if valid
     *
     * @example
     * const user = Assertions.assertNonNull(getUser(), 'User');
     */
    assertNonNull(value, name) {
        if (value === null || value === undefined) {
            return this._fail('assertNonNull', name,
                `Expected ${name} to be non-null, got ${value === null ? 'null' : 'undefined'}`);
        }
        return value;
    },

    /**
     * Assert that a value is of a specific type
     *
     * @param {*} value - Value to check
     * @param {string} expectedType - Expected type ('string', 'number', 'function', 'object', 'array', etc.)
     * @param {string} context - Context for error messages
     * @throws {Error} If type doesn't match
     * @returns {*} The value if valid
     *
     * @example
     * Assertions.assertType(callback, 'function', 'onClick handler');
     * Assertions.assertType(items, 'array', 'menu items');
     */
    assertType(value, expectedType, context) {
        const actualType = this._getType(value);

        if (actualType !== expectedType) {
            return this._fail('assertType', context,
                `Expected ${context} to be ${expectedType}, got ${actualType}`);
        }
        return value;
    },

    /**
     * Assert that an object has specific properties
     *
     * @param {Object} obj - Object to check
     * @param {string[]} props - Required property names
     * @param {string} context - Context for error messages
     * @throws {Error} If any property is missing
     * @returns {Object} The object if valid
     *
     * @example
     * Assertions.assertHasProperties(config, ['apiKey', 'projectId'], 'Firebase config');
     */
    assertHasProperties(obj, props, context) {
        this.assertNonNull(obj, context);
        this.assertType(obj, 'object', context);

        const missing = props.filter(prop => !(prop in obj));

        if (missing.length > 0) {
            return this._fail('assertHasProperties', context,
                `${context} is missing required properties: ${missing.join(', ')}`);
        }
        return obj;
    },

    /**
     * Assert that a dependency exists and implements required methods
     *
     * @param {string} name - Name of the dependency
     * @param {*} instance - The dependency instance
     * @param {string[]} requiredMethods - Methods the dependency must have
     * @throws {Error} If dependency doesn't exist or is missing methods
     * @returns {*} The dependency if valid
     *
     * @example
     * const nav = Assertions.assertDependency('SPANavigation', window.SPANavigation, ['navigate', 'handleRoute']);
     */
    assertDependency(name, instance, requiredMethods = []) {
        // Check existence
        if (instance === null || instance === undefined) {
            return this._fail('assertDependency', name,
                `Dependency "${name}" not found. ` +
                this._getDependencyGuidance(name));
        }

        // If it's a class constructor, check prototype methods
        const target = typeof instance === 'function' ? instance.prototype : instance;

        // Check required methods
        const missingMethods = requiredMethods.filter(method => {
            if (typeof instance === 'function') {
                // Class constructor - check prototype
                return typeof instance.prototype[method] !== 'function';
            } else {
                // Instance - check directly
                return typeof instance[method] !== 'function';
            }
        });

        if (missingMethods.length > 0) {
            return this._fail('assertDependency', name,
                `Dependency "${name}" is missing required methods: ${missingMethods.join(', ')}`);
        }

        return instance;
    },

    /**
     * Assert that a condition is true
     *
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if condition is false
     * @param {string} [context='assertion'] - Context for the assertion
     * @throws {Error} If condition is false
     *
     * @example
     * Assertions.assert(items.length > 0, 'Items array must not be empty');
     */
    assert(condition, message, context = 'assertion') {
        if (!condition) {
            return this._fail('assert', context, message);
        }
        return true;
    },

    /**
     * Assert that a value is one of the allowed values
     *
     * @param {*} value - Value to check
     * @param {Array} allowedValues - Array of allowed values
     * @param {string} context - Context for error messages
     * @throws {Error} If value is not in allowedValues
     * @returns {*} The value if valid
     *
     * @example
     * Assertions.assertOneOf(theme, ['light', 'dark', 'system'], 'theme');
     */
    assertOneOf(value, allowedValues, context) {
        if (!allowedValues.includes(value)) {
            return this._fail('assertOneOf', context,
                `Expected ${context} to be one of [${allowedValues.join(', ')}], got "${value}"`);
        }
        return value;
    },

    /**
     * Assert that an array is not empty
     *
     * @param {Array} arr - Array to check
     * @param {string} context - Context for error messages
     * @throws {Error} If array is empty or not an array
     * @returns {Array} The array if valid
     */
    assertNonEmptyArray(arr, context) {
        this.assertType(arr, 'array', context);
        if (arr.length === 0) {
            return this._fail('assertNonEmptyArray', context,
                `Expected ${context} to be a non-empty array`);
        }
        return arr;
    },

    /**
     * Assert that a string matches a pattern
     *
     * @param {string} value - String to check
     * @param {RegExp} pattern - Pattern to match
     * @param {string} context - Context for error messages
     * @throws {Error} If string doesn't match pattern
     * @returns {string} The string if valid
     */
    assertMatches(value, pattern, context) {
        this.assertType(value, 'string', context);
        if (!pattern.test(value)) {
            return this._fail('assertMatches', context,
                `Expected ${context} to match pattern ${pattern}, got "${value}"`);
        }
        return value;
    },

    /**
     * Get all collected failures
     *
     * @returns {Array} Array of failure objects
     */
    getFailures() {
        return [...this.failures];
    },

    /**
     * Clear collected failures
     */
    clearFailures() {
        this.failures = [];
    },

    /**
     * Check if any failures have been collected
     *
     * @returns {boolean} True if there are failures
     */
    hasFailures() {
        return this.failures.length > 0;
    },

    // ============================================
    // Internal Methods
    // ============================================

    /**
     * Get the type of a value (more specific than typeof)
     * @private
     */
    _getType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    },

    /**
     * Handle assertion failure
     * @private
     */
    _fail(assertion, context, message) {
        const failure = {
            assertion,
            context,
            message,
            timestamp: Date.now(),
            stack: new Error().stack
        };

        // Collect failure
        if (this.config.collectFailures) {
            this.failures.push(failure);
        }

        // Log failure
        if (this.config.logLevel === 'error') {
            console.error(`[Assertion Failed] ${message}`);
        } else if (this.config.logLevel === 'warn') {
            console.warn(`[Assertion Failed] ${message}`);
        }

        // Throw or return undefined
        if (this.config.throwOnFailure) {
            const error = new Error(message);
            error.name = 'AssertionError';
            error.assertion = assertion;
            error.context = context;
            throw error;
        }

        return undefined;
    },

    /**
     * Get guidance for loading a missing dependency
     * @private
     */
    _getDependencyGuidance(dep) {
        const guidance = {
            'firebase': 'Ensure Firebase SDK is loaded via <script src="https://www.gstatic.com/firebasejs/...">',
            'firebaseConfig': 'Ensure firebase-config.js is loaded before app initialization',
            'AuthManager': 'Load js/auth-guard-simple.js or js/auth-manager.js',
            'FirebaseCRUDManager': 'Load js/firebase-crud-manager.js',
            'UniversalDisplayRenderer': 'Load js/components/universal-display-renderer.js',
            'SPANavigation': 'Load js/spa-navigation.js (requires UniversalDisplayRenderer first)',
            'EnhancedCorpusSearch': 'Load js/components/corpus-search-enhanced.js',
            'ShaderThemeManager': 'Load js/shader-theme-picker.js',
            'LandingPageView': 'Load js/views/landing-page-view.js',
            'HomeView': 'Load js/views/home-view.js'
        };
        return guidance[dep] || `Ensure ${dep} is loaded before this script.`;
    }
};

// Export for both module and browser contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Assertions;
}

if (typeof window !== 'undefined') {
    window.Assertions = Assertions;
    console.log('[Assertions] Utility loaded');
}
