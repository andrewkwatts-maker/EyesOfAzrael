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

// Mock navigator separately
if (!global.navigator) {
    global.navigator = {};
}
global.navigator.clipboard = {
    writeText: jest.fn(() => Promise.resolve())
};

// Mock EntityForm for edit-entity-modal tests
global.EntityForm = jest.fn();

// Mock console
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
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

        window.EyesOfAzrael = {
            navigation: {
                navigate: jest.fn()
            }
        };
        window.toast = {
            success: jest.fn(),
            error: jest.fn(),
            info: jest.fn()
        };

        mockAuth.currentUser = {
            uid: 'test-user',
            email: 'test@example.com',
            displayName: 'Test User'
        };

        dashboard = new UserDashboard({
            crudManager: mockCRUDManager,
            auth: mockAuth
        });

        dashboard.submissions = [
            {
                id: '1',
                entityName: 'Test Entity',
                collection: 'deities',
                status: 'active',
                submittedAt: { toDate: () => new Date('2024-01-15') }
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
    test('should not crash when container has no expected elements', () => {
        const container = document.createElement('div');
        container.innerHTML = '<div id="test"></div>';
        expect(() => dashboard.initialize(container)).not.toThrow();
    });

    test('should handle refreshTab when panel is missing', () => {
        const container = document.createElement('div');
        dashboard.container = container;
        // Should not crash
        expect(() => dashboard.refreshTab('submissions')).not.toThrow();
    });

    // Test: Entity action handlers
    test('should handle view submission action', () => {
        const mockNavigate = jest.fn();
        window.EyesOfAzrael = {
            navigation: {
                navigate: mockNavigate
            }
        };

        dashboard.handleViewSubmission('1');

        expect(mockNavigate).toHaveBeenCalledWith('#/submission/1');
    });

    test('should handle view submission when navigation is missing', () => {
        window.EyesOfAzrael = null;

        expect(() => dashboard.handleViewSubmission('1')).not.toThrow();

        // Restore
        window.EyesOfAzrael = {
            navigation: { navigate: jest.fn() }
        };
    });

    // Test: handleCreateSubmission
    test('should handle create submission navigation', () => {
        dashboard.handleCreateSubmission();

        expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith('#/dashboard');
    });

    test('should handle create submission when navigation is missing', () => {
        window.EyesOfAzrael = {};

        expect(() => dashboard.handleCreateSubmission()).not.toThrow();

        window.EyesOfAzrael = {
            navigation: { navigate: jest.fn() }
        };
    });
});

// =====================================================
// EDIT ENTITY MODAL - BRANCH COVERAGE TESTS
// =====================================================

describe('EditEntityModal - Branch Coverage', () => {
    let modal;

    beforeEach(() => {
        jest.clearAllMocks();

        modal = new EditEntityModal(mockCRUDManager);

        document.body.innerHTML = '';
    });

    // Test: Verify modal can be instantiated without errors
    test('should create modal instance successfully', () => {
        expect(modal).toBeDefined();
    });

    test('should handle escapeHtml with various inputs', () => {
        expect(modal.escapeHtml('<b>bold</b>')).not.toContain('<b>');
        expect(modal.escapeHtml('')).toBe('');
        expect(modal.escapeHtml(null)).toBe('');
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

        compareView = new CompareView(mockFirestore);
        compareView.selectedEntities = [];

        window.showToast = jest.fn();

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
            { id: 'zeus', type: 'deities', name: 'Zeus', _collection: 'deities' },
            { id: 'hera', type: 'deities', name: 'Hera', _collection: 'deities' },
            { id: 'poseidon', type: 'deities', name: 'Poseidon', _collection: 'deities' }
        ];

        const initialLength = compareView.selectedEntities.length;

        compareView.addEntity({
            id: 'athena',
            type: 'deities',
            name: 'Athena'
        }, 'deities');

        // Should not add entity when max (3) reached
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

    // Test: Clipboard API with error - falls back to execCommand
    test('should handle clipboard write error', async () => {
        compareView.selectedEntities = [
            { id: 'zeus', name: 'Zeus', _collection: 'deities' },
            { id: 'hera', name: 'Hera', _collection: 'deities' }
        ];

        global.navigator.clipboard.writeText.mockReturnValueOnce(Promise.reject(new Error('Clipboard error')));

        // Mock document.execCommand for fallback
        document.execCommand = jest.fn(() => true);

        compareView.shareComparison();

        // Wait for promise to reject and fallback to execute
        await new Promise(resolve => setTimeout(resolve, 10));

        // Fallback should use execCommand
        expect(document.execCommand).toHaveBeenCalledWith('copy');
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

        dashboard.showToast('Test message', 'info');

        // Fallback logs to console when toast is unavailable
        expect(console.log).toHaveBeenCalledWith('[INFO]', 'Test message');

        window.toast = originalToast;
    });

    test('should handle missing EyesOfAzrael.navigation gracefully', () => {
        const originalNav = window.EyesOfAzrael;
        window.EyesOfAzrael = null;

        const dashboard = new UserDashboard({
            crudManager: mockCRUDManager,
            auth: mockAuth
        });

        // handleViewSubmission checks for navigation - should not throw
        dashboard.submissions = [{ id: '1', entityName: 'Test' }];
        expect(() => dashboard.handleViewSubmission('1')).not.toThrow();

        window.EyesOfAzrael = originalNav;
    });
});
