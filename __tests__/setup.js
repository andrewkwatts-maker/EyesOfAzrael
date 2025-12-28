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

// Mock Firebase
global.firebase = {
  analytics: jest.fn(() => ({
    logEvent: jest.fn(),
    setUserProperties: jest.fn(),
    setUserId: jest.fn()
  }))
};

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

// Cleanup after each test
afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();
});
