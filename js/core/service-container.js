/**
 * Eyes of Azrael - Service Container
 *
 * Lightweight Dependency Injection container following SOLID principles:
 *
 * - Single Responsibility: Each service does one thing
 * - Open/Closed: Easy to add services without changing container code
 * - Liskov Substitution: Services can be substituted with mocks for testing
 * - Interface Segregation: Small, focused interfaces per service
 * - Dependency Inversion: Depend on abstractions (interfaces), not concretions
 *
 * Usage:
 *   // Register services
 *   container.register('db', () => firebase.firestore(), { singleton: true });
 *   container.register('auth', () => new AuthManager(container.resolve('db')));
 *
 *   // Resolve services
 *   const db = container.resolve('db');
 *   const auth = container.resolve('auth');
 *
 *   // Check availability
 *   if (container.has('search')) { ... }
 *
 * @module core/service-container
 */

class ServiceContainer {
    /**
     * Create a new service container
     */
    constructor() {
        /**
         * Service definitions (factories and options)
         * @type {Map<string, {factory: Function, options: Object}>}
         */
        this._services = new Map();

        /**
         * Singleton instances
         * @type {Map<string, *>}
         */
        this._instances = new Map();

        /**
         * Service interface definitions
         * @type {Map<string, string[]>}
         */
        this._interfaces = new Map();

        /**
         * Resolution stack for circular dependency detection
         * @type {Set<string>}
         */
        this._resolving = new Set();

        /**
         * Service aliases
         * @type {Map<string, string>}
         */
        this._aliases = new Map();

        // Register default interfaces
        this._registerDefaultInterfaces();
    }

    /**
     * Register a service with the container
     *
     * @param {string} name - Unique service name
     * @param {Function} factory - Factory function that creates the service
     * @param {Object} [options={}] - Registration options
     * @param {boolean} [options.singleton=true] - If true, only one instance is created
     * @param {string[]} [options.interface] - Required methods for the service
     * @param {boolean} [options.optional=false] - If true, don't error if dependencies missing
     * @param {*} [options.fallback] - Fallback value if service creation fails
     * @returns {ServiceContainer} This container for chaining
     *
     * @example
     * container.register('auth', () => new AuthManager(), {
     *     singleton: true,
     *     interface: ['getCurrentUser', 'signIn', 'signOut']
     * });
     */
    register(name, factory, options = {}) {
        const defaults = {
            singleton: true,
            interface: null,
            optional: false,
            fallback: null
        };

        this._services.set(name, {
            factory,
            options: { ...defaults, ...options }
        });

        // Store interface if provided
        if (options.interface) {
            this._interfaces.set(name, options.interface);
        }

        return this;
    }

    /**
     * Register a pre-created instance
     *
     * @param {string} name - Service name
     * @param {*} instance - The instance to register
     * @returns {ServiceContainer} This container for chaining
     *
     * @example
     * container.instance('firebase', firebase);
     */
    instance(name, instance) {
        this._instances.set(name, instance);
        this._services.set(name, {
            factory: () => instance,
            options: { singleton: true }
        });
        return this;
    }

    /**
     * Create an alias for a service
     *
     * @param {string} alias - Alias name
     * @param {string} target - Target service name
     * @returns {ServiceContainer} This container for chaining
     *
     * @example
     * container.alias('database', 'db');
     */
    alias(alias, target) {
        this._aliases.set(alias, target);
        return this;
    }

    /**
     * Resolve a service from the container
     *
     * @param {string} name - Service name to resolve
     * @returns {*} The resolved service instance
     * @throws {Error} If service not found or circular dependency detected
     *
     * @example
     * const auth = container.resolve('auth');
     */
    resolve(name) {
        // Resolve alias
        const serviceName = this._aliases.get(name) || name;

        // Check if already instantiated (singleton)
        if (this._instances.has(serviceName)) {
            return this._instances.get(serviceName);
        }

        // Check if service is registered
        if (!this._services.has(serviceName)) {
            throw new Error(
                `Service "${serviceName}" not registered. ` +
                `Available services: ${[...this._services.keys()].join(', ')}`
            );
        }

        // Circular dependency detection
        if (this._resolving.has(serviceName)) {
            const chain = [...this._resolving, serviceName].join(' -> ');
            throw new Error(`Circular dependency detected: ${chain}`);
        }

        const { factory, options } = this._services.get(serviceName);

        // Mark as resolving
        this._resolving.add(serviceName);

        try {
            // Create instance
            let instance;
            try {
                instance = factory(this);
            } catch (error) {
                if (options.optional && options.fallback !== null) {
                    console.warn(`[ServiceContainer] Failed to create ${serviceName}, using fallback:`, error.message);
                    instance = options.fallback;
                } else {
                    throw error;
                }
            }

            // Validate interface if specified
            if (options.interface && instance) {
                this._validateInterface(serviceName, instance, options.interface);
            }

            // Cache singleton
            if (options.singleton) {
                this._instances.set(serviceName, instance);
            }

            return instance;
        } finally {
            this._resolving.delete(serviceName);
        }
    }

    /**
     * Check if a service is registered and can be resolved
     *
     * @param {string} name - Service name
     * @returns {boolean} True if service exists
     */
    has(name) {
        const serviceName = this._aliases.get(name) || name;
        return this._services.has(serviceName) || this._instances.has(serviceName);
    }

    /**
     * Try to resolve a service, returning null if not available
     *
     * @param {string} name - Service name
     * @returns {*|null} The service or null
     */
    tryResolve(name) {
        try {
            if (!this.has(name)) return null;
            return this.resolve(name);
        } catch (error) {
            console.warn(`[ServiceContainer] Failed to resolve ${name}:`, error.message);
            return null;
        }
    }

    /**
     * Get all registered service names
     *
     * @returns {string[]} Array of service names
     */
    getRegisteredServices() {
        return [...this._services.keys()];
    }

    /**
     * Validate all registered services can be resolved
     *
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateAll() {
        const errors = [];

        for (const name of this._services.keys()) {
            try {
                this.resolve(name);
            } catch (error) {
                errors.push(`${name}: ${error.message}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Clear all instances (useful for testing)
     */
    clearInstances() {
        this._instances.clear();
    }

    /**
     * Reset the container completely
     */
    reset() {
        this._services.clear();
        this._instances.clear();
        this._interfaces.clear();
        this._aliases.clear();
        this._resolving.clear();
    }

    // ============================================
    // Internal Methods
    // ============================================

    /**
     * Register default interface definitions
     * @private
     */
    _registerDefaultInterfaces() {
        // Database interface
        this._interfaces.set('db', ['collection', 'doc', 'batch']);

        // Auth interface
        this._interfaces.set('auth', ['getCurrentUser', 'onAuthStateChanged', 'signOut']);

        // Renderer interface
        this._interfaces.set('renderer', ['render', 'renderGrid']);

        // Navigation interface
        this._interfaces.set('navigation', ['navigate', 'handleRoute', 'getCurrentRoute']);

        // Search interface
        this._interfaces.set('search', ['search', 'suggest']);
    }

    /**
     * Validate that an instance implements required methods
     * @private
     */
    _validateInterface(name, instance, requiredMethods) {
        const missing = [];

        for (const method of requiredMethods) {
            // Check instance methods
            if (typeof instance[method] !== 'function') {
                // Also check prototype for classes
                if (instance.constructor && typeof instance.constructor.prototype[method] !== 'function') {
                    missing.push(method);
                }
            }
        }

        if (missing.length > 0) {
            throw new Error(
                `Service "${name}" does not implement required interface. ` +
                `Missing methods: ${missing.join(', ')}`
            );
        }
    }
}

/**
 * Default container instance
 * @type {ServiceContainer}
 */
const container = new ServiceContainer();

// Export for both module and browser contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ServiceContainer, container };
}

if (typeof window !== 'undefined') {
    window.ServiceContainer = ServiceContainer;
    window.container = container;
    console.log('[ServiceContainer] Loaded');
}
