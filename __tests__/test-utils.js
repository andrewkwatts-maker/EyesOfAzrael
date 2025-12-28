/**
 * Test Utilities
 * Common helpers, mock factories, and assertion utilities for Eyes of Azrael tests
 *
 * @module test-utils
 */

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Creates a mock entity with default values and optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock entity object
 */
function createMockEntity(overrides = {}) {
    return {
        id: 'entity-123',
        name: 'Zeus',
        mythology: 'greek',
        collection: 'deities',
        type: 'deity',
        description: 'King of the gods',
        icon: '⚡',
        importance: 5,
        fullDescription: 'Supreme ruler of Mount Olympus and god of the sky, thunder, and justice.',
        domains: ['Sky', 'Thunder', 'Justice'],
        symbols: ['Lightning Bolt', 'Eagle', 'Oak'],
        element: 'Air',
        gender: 'Male',
        status: 'active',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-15') },
        createdBy: 'user-123',
        ...overrides
    };
}

/**
 * Creates a mock user object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user object
 */
function createMockUser(overrides = {}) {
    return {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
        ...overrides
    };
}

/**
 * Creates a mock Firestore instance with full query chaining support
 * @param {Object} options - Configuration options
 * @param {Array} options.docs - Array of mock documents to return
 * @param {Object} options.data - Default data for single document
 * @param {boolean} options.exists - Whether document exists (default: true)
 * @param {string} options.id - Document ID (default: 'doc-123')
 * @returns {Object} Mock Firestore instance with full chaining
 */
function createMockFirestore(options = {}) {
    // Create mock document
    const mockDoc = {
        exists: options.exists !== undefined ? options.exists : true,
        id: options.id || 'doc-123',
        data: jest.fn(() => options.data || createMockEntity())
    };

    // Create mock snapshot
    const mockSnapshot = {
        docs: options.docs || [mockDoc],
        empty: (options.docs && options.docs.length === 0) || false,
        size: (options.docs && options.docs.length) || 1,
        forEach: function(callback) {
            this.docs.forEach(callback);
        }
    };

    // Create chainable query mock
    const createQueryMock = () => {
        const queryMock = {
            where: jest.fn(function() { return this; }),
            orderBy: jest.fn(function() { return this; }),
            limit: jest.fn(function() { return this; }),
            startAfter: jest.fn(function() { return this; }),
            endBefore: jest.fn(function() { return this; }),
            startAt: jest.fn(function() { return this; }),
            endAt: jest.fn(function() { return this; }),
            get: jest.fn(() => Promise.resolve(mockSnapshot))
        };
        return queryMock;
    };

    // Create mock document reference
    const mockDocRef = {
        get: jest.fn(() => Promise.resolve(mockDoc)),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
        onSnapshot: jest.fn((callback) => {
            callback(mockDoc);
            return () => {}; // unsubscribe function
        })
    };

    // Create mock collection reference with full chaining
    const mockCollection = {
        doc: jest.fn((id) => {
            if (id) {
                // Return a specific document reference that respects current mockDoc state
                return {
                    get: jest.fn(() => Promise.resolve(mockDoc)),
                    set: jest.fn(() => Promise.resolve()),
                    update: jest.fn(() => Promise.resolve()),
                    delete: jest.fn(() => Promise.resolve()),
                    onSnapshot: jest.fn((callback) => {
                        callback(mockDoc);
                        return () => {};
                    })
                };
            }
            return mockDocRef;
        }),
        where: jest.fn(() => createQueryMock()),
        orderBy: jest.fn(() => createQueryMock()),
        limit: jest.fn(() => createQueryMock()),
        startAfter: jest.fn(() => createQueryMock()),
        endBefore: jest.fn(() => createQueryMock()),
        get: jest.fn(() => Promise.resolve(mockSnapshot)),
        add: jest.fn((data) => Promise.resolve({ id: 'new-doc-id', ...mockDocRef })),
        onSnapshot: jest.fn((callback) => {
            callback(mockSnapshot);
            return () => {}; // unsubscribe function
        })
    };

    // Create mock Firestore database instance
    const mockDb = {
        collection: jest.fn(() => mockCollection),
        doc: jest.fn(() => mockDocRef),
        runTransaction: jest.fn((callback) => callback({
            get: jest.fn(() => Promise.resolve(mockDoc)),
            set: jest.fn(() => Promise.resolve()),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve())
        })),
        batch: jest.fn(() => ({
            set: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            commit: jest.fn(() => Promise.resolve())
        }))
    };

    // Expose internal mocks for testing purposes
    mockDb._mockCollection = mockCollection;
    mockDb._mockDocRef = mockDocRef;
    mockDb._mockDoc = mockDoc;
    mockDb._mockSnapshot = mockSnapshot;

    return mockDb;
}

/**
 * Creates a mock CRUD manager
 * @returns {Object} Mock CRUD manager instance
 */
function createMockCRUDManager() {
    return {
        create: jest.fn(() => Promise.resolve({ success: true, id: 'new-123' })),
        read: jest.fn(() => Promise.resolve({ success: true, data: createMockEntity() })),
        update: jest.fn(() => Promise.resolve({ success: true, id: 'entity-123' })),
        delete: jest.fn(() => Promise.resolve({ success: true })),
        restore: jest.fn(() => Promise.resolve({ success: true })),
        getUserEntities: jest.fn(() => Promise.resolve({ success: true, data: [] }))
    };
}

/**
 * Creates a mock analytics instance
 * @returns {Object} Mock analytics instance
 */
function createMockAnalytics() {
    return {
        trackPageView: jest.fn(),
        trackEvent: jest.fn(),
        trackSearch: jest.fn(),
        trackEntityView: jest.fn(),
        trackComparison: jest.fn(),
        trackContribution: jest.fn(),
        trackError: jest.fn()
    };
}

// ============================================================================
// DOM UTILITIES
// ============================================================================

/**
 * Creates a container element and appends it to document.body
 * @param {string} id - Container ID (default: 'test-container')
 * @returns {HTMLElement} Container element
 */
function createContainer(id = 'test-container') {
    const container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
    return container;
}

/**
 * Removes a container from the DOM
 * @param {HTMLElement} container - Container to remove
 */
function cleanupContainer(container) {
    if (container && container.parentElement) {
        container.parentElement.removeChild(container);
    }
}

/**
 * Creates a mock button element with event listeners
 * @param {Object} options - Button options
 * @returns {HTMLButtonElement} Button element
 */
function createMockButton(options = {}) {
    const button = document.createElement('button');
    button.id = options.id || 'test-button';
    button.className = options.className || '';
    button.textContent = options.text || 'Button';
    if (options.onClick) {
        button.addEventListener('click', options.onClick);
    }
    return button;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function waitFor(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Condition function to evaluate
 * @param {Object} options - Options (timeout, interval)
 * @returns {Promise<void>}
 */
async function waitForCondition(condition, options = {}) {
    const timeout = options.timeout || 5000;
    const interval = options.interval || 50;
    const startTime = Date.now();

    while (!condition()) {
        if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for condition');
        }
        await waitFor(interval);
    }
}

/**
 * Flushes all pending promises
 * @returns {Promise<void>}
 */
async function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
}

// ============================================================================
// MOCK GLOBAL OBJECTS
// ============================================================================

/**
 * Sets up common global mocks
 */
function setupGlobalMocks() {
    // Mock window methods
    global.window = global.window || {};
    global.window.alert = jest.fn();
    global.window.confirm = jest.fn(() => true);
    global.window.scrollTo = jest.fn();
    global.window.print = jest.fn();

    // Mock showToast if not present
    global.window.showToast = jest.fn((message, type) => {
        // console.log(`[TOAST ${type}]: ${message}`);
    });

    // Mock navigator.clipboard
    global.navigator = global.navigator || {};
    global.navigator.clipboard = {
        writeText: jest.fn(() => Promise.resolve()),
        readText: jest.fn(() => Promise.resolve(''))
    };

    // Mock console methods (non-intrusive)
    global.console = {
        ...console,
        log: jest.fn(console.log),
        warn: jest.fn(console.warn),
        error: jest.fn(console.error)
    };

    // Mock localStorage
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
            removeItem: jest.fn(key => { delete store[key]; }),
            clear: jest.fn(() => { store = {}; })
        };
    })();
    global.localStorage = localStorageMock;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
}

/**
 * Resets all global mocks
 */
function resetGlobalMocks() {
    jest.clearAllMocks();
    if (global.localStorage) {
        global.localStorage.clear();
    }
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Asserts that an element has specific attributes
 * @param {HTMLElement} element - Element to check
 * @param {Object} attributes - Expected attributes
 */
function expectElementAttributes(element, attributes) {
    expect(element).toBeTruthy();
    Object.entries(attributes).forEach(([key, value]) => {
        expect(element.getAttribute(key)).toBe(value);
    });
}

/**
 * Asserts that an element has specific classes
 * @param {HTMLElement} element - Element to check
 * @param {string[]} classes - Expected classes
 */
function expectElementClasses(element, classes) {
    expect(element).toBeTruthy();
    classes.forEach(className => {
        expect(element.classList.contains(className)).toBe(true);
    });
}

/**
 * Asserts that a mock was called with specific arguments
 * @param {jest.Mock} mockFn - Mock function
 * @param {Array} expectedArgs - Expected arguments
 */
function expectCalledWith(mockFn, expectedArgs) {
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
}

/**
 * Asserts that an async function resolves successfully
 * @param {Function} asyncFn - Async function to test
 * @returns {Promise<any>} Result of the function
 */
async function expectAsyncSuccess(asyncFn) {
    const result = await asyncFn();
    expect(result).toBeDefined();
    return result;
}

/**
 * Asserts that an async function throws an error
 * @param {Function} asyncFn - Async function to test
 * @param {string} errorMessage - Expected error message (optional)
 */
async function expectAsyncError(asyncFn, errorMessage) {
    await expect(asyncFn()).rejects.toThrow(errorMessage);
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Generates an array of mock entities
 * @param {number} count - Number of entities to generate
 * @param {Object} baseOverrides - Base overrides for all entities
 * @returns {Array<Object>} Array of mock entities
 */
function generateMockEntities(count, baseOverrides = {}) {
    return Array.from({ length: count }, (_, i) => createMockEntity({
        id: `entity-${i}`,
        name: `Entity ${i}`,
        ...baseOverrides
    }));
}

/**
 * Generates realistic test data for different mythologies
 * @param {string} mythology - Mythology name
 * @returns {Object} Mock entity for that mythology
 */
function generateMythologyEntity(mythology) {
    const mythologyData = {
        greek: {
            name: 'Zeus',
            icon: '⚡',
            domains: ['Sky', 'Thunder'],
            symbols: ['Lightning Bolt', 'Eagle']
        },
        norse: {
            name: 'Odin',
            icon: '🔱',
            domains: ['War', 'Wisdom'],
            symbols: ['Spear', 'Ravens']
        },
        egyptian: {
            name: 'Ra',
            icon: '☀️',
            domains: ['Sun', 'Creation'],
            symbols: ['Sun Disk', 'Falcon']
        }
    };

    return createMockEntity({
        mythology,
        ...(mythologyData[mythology] || {})
    });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates that a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validates that HTML does not contain XSS vulnerabilities
 * @param {string} html - HTML string to check
 * @returns {boolean} True if safe
 */
function isSafeHTML(html) {
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onclick=/i,
        /<iframe/i
    ];
    return !dangerousPatterns.some(pattern => pattern.test(html));
}

// ============================================================================
// CUSTOM JEST MATCHERS
// ============================================================================

/**
 * Extends Jest with custom matchers
 */
function extendJestMatchers() {
    expect.extend({
        toBeValidEntity(received) {
            const pass = received &&
                typeof received.id === 'string' &&
                typeof received.name === 'string' &&
                typeof received.mythology === 'string' &&
                typeof received.collection === 'string';

            return {
                pass,
                message: () => pass
                    ? `Expected ${JSON.stringify(received)} not to be a valid entity`
                    : `Expected ${JSON.stringify(received)} to be a valid entity`
            };
        },

        toHaveBeenCalledWithEntityId(mockFn, entityId) {
            const pass = mockFn.mock.calls.some(call =>
                call.some(arg => arg === entityId || arg?.id === entityId)
            );

            return {
                pass,
                message: () => pass
                    ? `Expected mock not to have been called with entity ID "${entityId}"`
                    : `Expected mock to have been called with entity ID "${entityId}"`
            };
        }
    });
}

// ============================================================================
// TEST SETUP HELPERS
// ============================================================================

/**
 * Common beforeEach setup for component tests
 * @param {Object} options - Setup options
 * @returns {Object} Setup objects
 */
function setupComponentTest(options = {}) {
    const container = createContainer();
    const mockFirestore = createMockFirestore();
    const mockCRUD = createMockCRUDManager();
    const mockAnalytics = createMockAnalytics();

    setupGlobalMocks();

    return {
        container,
        mockFirestore,
        mockCRUD,
        mockAnalytics,
        cleanup: () => {
            cleanupContainer(container);
            resetGlobalMocks();
        }
    };
}

/**
 * Common afterEach cleanup
 * @param {Object} setupObjects - Objects returned from setupComponentTest
 */
function cleanupComponentTest(setupObjects) {
    if (setupObjects && setupObjects.cleanup) {
        setupObjects.cleanup();
    }
}

// ============================================================================
// COMMONJS EXPORTS (for Jest compatibility)
// ============================================================================

// Export all functions for CommonJS require()
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createMockEntity,
        createMockUser,
        createMockFirestore,
        createMockCRUDManager,
        createMockAnalytics,
        createContainer,
        cleanupContainer,
        createMockButton,
        waitFor,
        waitForCondition,
        flushPromises,
        setupGlobalMocks,
        resetGlobalMocks,
        expectElementAttributes,
        expectElementClasses,
        expectCalledWith,
        expectAsyncSuccess,
        expectAsyncError,
        generateMockEntities,
        generateMythologyEntity,
        isValidUrl,
        isSafeHTML,
        extendJestMatchers,
        setupComponentTest,
        cleanupComponentTest
    };
}
