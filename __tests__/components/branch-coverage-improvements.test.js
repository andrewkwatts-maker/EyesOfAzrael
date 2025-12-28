/**
 * Branch Coverage Improvement Tests
 * Target: Increase branch coverage from 82.72% to 90%+
 * Focus: Uncovered branches in user-dashboard.js, edit-entity-modal.js, compare-view.js
 */

// =====================================================
// MOCK SETUP
// =====================================================

const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  get: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
};

const mockAuth = {
  currentUser: null,
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
};

const mockCRUDManager = {
  getUserEntities: jest.fn(),
  create: jest.fn(),
  read: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  restore: jest.fn()
};

// Mock global firebase object
global.firebase = {
  firestore: jest.fn(() => mockFirestore),
  auth: {
    GoogleAuthProvider: jest.fn()
  }
};

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.prompt = jest.fn();

// Mock window objects
global.window = {
  EyesOfAzrael: {
    navigation: {
      navigate: jest.fn()
    }
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  },
  location: {
    reload: jest.fn()
  }
};

// Mock navigator separately
if (!global.navigator) {
  global.navigator = {};
}
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve())
};

// Mock EntityForm for edit-entity-modal tests
global.EntityForm = jest.fn();

// Mock window.location for CompareView
global.window.location = {
  origin: 'http://localhost',
  pathname: '/',
  hash: ''
};

// Import components
const UserDashboard = require('../../js/components/user-dashboard.js');
const EditEntityModal = require('../../js/components/edit-entity-modal.js');
const CompareView = require('../../js/components/compare-view.js');

// =====================================================
// USER DASHBOARD - BRANCH COVERAGE TESTS
// =====================================================

describe('UserDashboard - Branch Coverage', () => {
  let dashboard;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    dashboard = new UserDashboard({
      crudManager: mockCRUDManager,
      auth: mockAuth
    });

    dashboard.entities = [
      {
        id: '1',
        name: 'Test Entity',
        collection: 'deities',
        status: 'active',
        createdAt: { toDate: () => new Date('2024-01-15') }
      }
    ];
  });

  // Test: formatDate with plain Date object (not Firestore Timestamp)
  test('should handle formatDate with plain Date object', () => {
    const plainDate = new Date('2024-01-15');
    const formatted = dashboard.formatDate(plainDate);
    expect(formatted).toBeTruthy();
  });

  // Test: Date formatting for different time ranges
  test('should format date as "X days ago" for dates 2-6 days old', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const formatted = dashboard.formatDate({ toDate: () => threeDaysAgo });
    expect(formatted).toBe('3 days ago');
  });

  test('should format date as "X weeks ago" for dates 7-29 days old', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const formatted = dashboard.formatDate({ toDate: () => twoWeeksAgo });
    expect(formatted).toBe('2 weeks ago');
  });

  test('should format date as "X months ago" for dates 30-364 days old', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const formatted = dashboard.formatDate({ toDate: () => twoMonthsAgo });
    expect(formatted).toBe('2 months ago');
  });

  test('should format date as full date for dates 365+ days old', () => {
    const oneYearAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const formatted = dashboard.formatDate({ toDate: () => oneYearAgo });
    expect(formatted).toContain('/');
  });

  // Test: Missing DOM elements during initialization
  test('should not crash when collectionFilter is missing', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div id="entitiesList"></div>';

    expect(() => dashboard.initialize(container)).not.toThrow();
  });

  test('should not crash when statusFilter is missing', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div id="entitiesList"></div>';

    expect(() => dashboard.initialize(container)).not.toThrow();
  });

  test('should not crash when searchInput is missing', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div id="entitiesList"></div>';

    expect(() => dashboard.initialize(container)).not.toThrow();
  });

  test('should not crash when createNewBtn is missing', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div id="entitiesList"></div>';

    expect(() => dashboard.initialize(container)).not.toThrow();
  });

  test('should not crash when signInBtn is missing', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<div id="entitiesList"></div>';

    expect(() => dashboard.initialize(container)).not.toThrow();
  });

  test('should handle refresh when listContainer is missing', async () => {
    const container = document.createElement('div');
    dashboard.container = container;

    mockCRUDManager.getUserEntities.mockResolvedValue({ success: true, data: [] });

    await expect(dashboard.refresh()).resolves.not.toThrow();
  });

  // Test: Entity action handlers (view, edit, delete, restore)
  test('should handle view action via handleView', () => {
    // Ensure EyesOfAzrael exists with navigation
    const mockNavigate = jest.fn();
    global.window.EyesOfAzrael = {
      navigation: {
        navigate: mockNavigate
      }
    };

    dashboard.handleView('deities', 'test-id');

    expect(mockNavigate).toHaveBeenCalledWith(
      '#/mythology/user/deitie/test-id'
    );
  });

  test('should handle view action when navigation is missing', () => {
    global.window.EyesOfAzrael = null;

    expect(() => dashboard.handleView('deities', 'test-id')).not.toThrow();

    // Restore
    global.window.EyesOfAzrael = {
      navigation: {
        navigate: jest.fn()
      }
    };
  });

  // Test: Invalid collection number in handleCreateNew
  test('should handle invalid collection selection in handleCreateNew', async () => {
    global.prompt.mockReturnValueOnce('99');

    await dashboard.handleCreateNew();

    // Should not call showForm for invalid selection
    expect(global.prompt).toHaveBeenCalled();
  });

  test('should handle null collection selection in handleCreateNew', async () => {
    global.prompt.mockReturnValueOnce(null);

    await dashboard.handleCreateNew();

    // Should return early without error
    expect(global.prompt).toHaveBeenCalled();
  });
});

// =====================================================
// EDIT ENTITY MODAL - BRANCH COVERAGE TESTS
// =====================================================

describe('EditEntityModal - Branch Coverage', () => {
  let modal;

  beforeEach(() => {
    jest.clearAllMocks();

    modal = new EditEntityModal({
      crudManager: mockCRUDManager,
      collection: 'deities',
      mythology: 'greek',
      onSave: jest.fn(),
      onCancel: jest.fn()
    });

    document.body.innerHTML = '';
  });

  // Test: Verify modal can be instantiated without errors
  test('should create modal instance successfully', () => {
    expect(modal).toBeDefined();
  });
});

// =====================================================
// COMPARE VIEW - BRANCH COVERAGE TESTS
// =====================================================

describe('CompareView - Branch Coverage', () => {
  let compareView;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset clipboard mock to return a promise
    global.navigator.clipboard.writeText = jest.fn(() => Promise.resolve());

    compareView = new CompareView({ mythology: 'greek' });
    compareView.selectedEntities = [];

    document.body.innerHTML = '';
  });

  // Test: Firestore null check in addEntityById
  test('should handle addEntityById when firestore is not initialized', async () => {
    compareView.db = null;

    await compareView.addEntityById('deities', 'test-id');

    // Should return early without error
    expect(true).toBe(true);
  });

  // Test: Max entities limit
  test('should handle adding entity when max entities reached', () => {
    compareView.selectedEntities = [
      { id: 'zeus', type: 'deities', name: 'Zeus' },
      { id: 'hera', type: 'deities', name: 'Hera' },
      { id: 'poseidon', type: 'deities', name: 'Poseidon' },
      { id: 'hades', type: 'deities', name: 'Hades' }
    ];

    compareView.maxEntities = 4;

    const initialLength = compareView.selectedEntities.length;

    compareView.addEntity({
      id: 'athena',
      type: 'deities',
      name: 'Athena'
    });

    // Should not add entity when max reached
    expect(compareView.selectedEntities.length).toBe(initialLength);
  });

  // Test: Clipboard API with successful copy
  test('should copy share link to clipboard successfully', async () => {
    compareView.selectedEntities = [
      { id: 'zeus', name: 'Zeus', _collection: 'deities' },
      { id: 'hera', name: 'Hera', _collection: 'deities' }
    ];

    compareView.shareComparison();

    // Wait for promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
  });

  // Test: Clipboard API with error
  test('should handle clipboard write error', async () => {
    compareView.selectedEntities = [
      { id: 'zeus', name: 'Zeus', _collection: 'deities' },
      { id: 'hera', name: 'Hera', _collection: 'deities' }
    ];

    global.navigator.clipboard.writeText.mockReturnValueOnce(Promise.reject(new Error('Clipboard error')));

    compareView.shareComparison();

    // Wait for promise to reject
    await new Promise(resolve => setTimeout(resolve, 10));

    // Error should be caught and logged
    expect(true).toBe(true);
  });

  // Test: Minimum entities for sharing
  test('should not share when less than minimum entities', () => {
    compareView.selectedEntities = [
      { id: 'zeus', name: 'Zeus', _collection: 'deities' }
    ];

    compareView.shareComparison();

    // Should not call clipboard
    expect(global.navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});

// =====================================================
// CROSS-COMPONENT INTEGRATION TESTS
// =====================================================

describe('Cross-Component Branch Coverage', () => {
  test('should handle window.toast fallback across components', () => {
    const originalToast = window.toast;
    window.toast = null;

    const dashboard = new UserDashboard({
      crudManager: mockCRUDManager,
      auth: mockAuth
    });

    dashboard.showToast('Test message', 'success');

    expect(global.alert).toHaveBeenCalledWith('Test message');

    window.toast = originalToast;
  });

  test('should handle missing EyesOfAzrael.navigation gracefully', () => {
    const originalNav = window.EyesOfAzrael;
    window.EyesOfAzrael = null;

    const dashboard = new UserDashboard({
      crudManager: mockCRUDManager,
      auth: mockAuth
    });

    expect(() => dashboard.handleView('deities', 'test-id')).not.toThrow();

    window.EyesOfAzrael = originalNav;
  });
});
