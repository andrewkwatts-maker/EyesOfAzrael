/**
 * Jest Test Setup
 * Eyes of Azrael - Global Test Configuration
 */

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

global.localStorage = new LocalStorageMock();

// Mock sessionStorage
global.sessionStorage = new LocalStorageMock();

// Mock gtag (Google Analytics)
global.gtag = jest.fn();

// Enhanced Firebase mock with complete Auth support
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString()
  },
  getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
  getIdTokenResult: jest.fn(() => Promise.resolve({
    token: 'mock-id-token',
    claims: { admin: false },
    expirationTime: new Date(Date.now() + 3600000).toISOString()
  })),
  reload: jest.fn(() => Promise.resolve())
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    })),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve({ docs: [] }))
  }))
};

// Mock Firebase
global.firebase = {
  auth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return () => {}; // Unsubscribe function
    }),
    signInWithPopup: jest.fn(() => Promise.resolve({ user: mockUser })),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    signOut: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser }))
  })),
  firestore: jest.fn(() => mockFirestore),
  storage: jest.fn(() => ({
    ref: jest.fn(() => ({
      put: jest.fn(() => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('https://example.com/image.jpg') } })),
      getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/image.jpg'))
    }))
  })),
  analytics: jest.fn(() => ({
    logEvent: jest.fn(),
    setUserProperties: jest.fn(),
    setUserId: jest.fn()
  }))
};

// Export mock user for tests to use
global.mockFirebaseUser = mockUser;
global.mockFirestore = mockFirestore;

// Mock Performance API
if (!global.performance) {
  global.performance = {};
}

global.performance.timing = {
  navigationStart: 1000,
  loadEventEnd: 2000,
  domContentLoadedEventEnd: 1500,
  domainLookupStart: 1100,
  domainLookupEnd: 1150,
  connectStart: 1200,
  connectEnd: 1250
};

global.performance.now = jest.fn(() => Date.now());

// Mock window objects
global.window = global.window || {};
global.window.screen = {
  width: 1920,
  height: 1080
};

global.window.innerWidth = 1920;
global.window.innerHeight = 1080;
global.window.scrollY = 0;

global.window.location = {
  href: 'http://localhost/',
  hostname: 'localhost',
  hash: '',
  search: '',
  pathname: '/'
};

global.window.addEventListener = jest.fn();
global.window.Date = Date;

global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  doNotTrack: '0'
};

// Note: jsdom provides a complete document object, so we don't override it
// We only set properties that need specific values for tests
if (!global.document) {
  global.document = {};
}
// Set default title if not set
if (!global.document.title) {
  global.document.title = 'Test Page';
}

// Mock FirebaseService
global.window.FirebaseService = {
  isAuthenticated: jest.fn(() => false)
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset localStorage
  global.localStorage.clear();
  global.sessionStorage.clear();

  // Reset window location
  global.window.location.hash = '';
  global.window.location.search = '';

  // Reset document title
  global.document.title = 'Test Page';

  // Reset analytics state
  delete global.window.AnalyticsManager;
  delete global.window.trackEvent;
  delete global.window.trackPageView;
  delete global.window.trackSearch;
  delete global.window.trackMythologyView;
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observedElements = new Set();

    // Store instance globally for test control
    if (!global.mockIntersectionObserverInstances) {
      global.mockIntersectionObserverInstances = [];
    }
    global.mockIntersectionObserverInstances.push(this);
  }

  observe(element) {
    this.observedElements.add(element);
  }

  unobserve(element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Test helper to trigger intersection
  triggerIntersection(element, isIntersecting = true) {
    if (this.observedElements.has(element)) {
      const entries = [{
        target: element,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1.0 : 0.0,
        boundingClientRect: element.getBoundingClientRect ? element.getBoundingClientRect() : { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 },
        intersectionRect: isIntersecting ? (element.getBoundingClientRect ? element.getBoundingClientRect() : { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 }) : { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 },
        rootBounds: null,
        time: Date.now()
      }];
      this.callback(entries, this);
    }
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// Helper to trigger all observations
global.triggerIntersection = (element, isIntersecting = true) => {
  global.mockIntersectionObserverInstances?.forEach(observer => {
    observer.triggerIntersection(element, isIntersecting);
  });
};

// Cleanup after each test
afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();

  // Clean up intersection observers
  global.mockIntersectionObserverInstances = [];
});
