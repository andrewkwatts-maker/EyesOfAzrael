/**
 * User Dashboard Component - Unit Tests
 * Testing: Dashboard initialization, data loading, tab management,
 * action handling, utility methods, and error handling
 *
 * @coverage-target 85%
 * @total-tests 42
 */

// Mock console methods
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock Firebase
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
    delete: jest.fn()
};

// Mock global firebase object
global.firebase = {
    firestore: jest.fn(),
    auth: {
        GoogleAuthProvider: jest.fn()
    }
};

// Mock alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Import UserDashboard after mocks
const UserDashboard = require('../../js/components/user-dashboard.js');

describe('UserDashboard Component', () => {
    let dashboard;
    let mockContainer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup window mocks
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

        // Create fresh dashboard instance
        dashboard = new UserDashboard({
            crudManager: mockCRUDManager,
            auth: mockAuth
        });

        // Create mock container
        mockContainer = document.createElement('div');
        document.body.appendChild(mockContainer);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    // ========================================
    // 1. Dashboard Initialization (6 tests)
    // ========================================

    describe('Dashboard Initialization', () => {
        test('should initialize with correct properties', () => {
            // Assert
            expect(dashboard.auth).toBe(mockAuth);
            expect(dashboard.crudManager).toBe(mockCRUDManager);
            expect(dashboard.submissions).toEqual([]);
            expect(dashboard.favorites).toEqual([]);
            expect(dashboard.notes).toEqual([]);
        });

        test('should initialize pagination state', () => {
            expect(dashboard.pagination.submissions).toEqual({ page: 1, perPage: 8, total: 0 });
            expect(dashboard.pagination.favorites).toEqual({ page: 1, perPage: 12, total: 0 });
            expect(dashboard.pagination.notes).toEqual({ page: 1, perPage: 10, total: 0 });
        });

        test('should default to submissions tab', () => {
            expect(dashboard.activeTab).toBe('submissions');
        });

        test('should initialize stats to zero', () => {
            expect(dashboard.stats).toEqual({
                submissions: 0,
                favorites: 0,
                notes: 0,
                badges: 0
            });
        });

        test('should render not-authenticated view when no user', async () => {
            mockAuth.currentUser = null;
            const html = await dashboard.render();
            expect(html).toContain('Sign In');
        });

        test('should require authentication to show dashboard', async () => {
            mockAuth.currentUser = null;
            const html = await dashboard.render();
            expect(html).not.toContain('user-dashboard');
        });
    });

    // ========================================
    // 2. Data Loading (7 tests)
    // ========================================

    describe('Data Loading', () => {
        test('should load submissions from submissionWorkflow', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            const mockSubmissions = [{ id: '1', entityName: 'Zeus' }];
            window.submissionWorkflow = {
                getUserSubmissions: jest.fn().mockResolvedValue(mockSubmissions)
            };

            const result = await dashboard.loadSubmissions();
            expect(result).toEqual(mockSubmissions);

            delete window.submissionWorkflow;
        });

        test('should return empty array when no user for submissions', async () => {
            mockAuth.currentUser = null;
            const result = await dashboard.loadSubmissions();
            expect(result).toEqual([]);
        });

        test('should load favorites from EyesOfAzrael.favorites', async () => {
            const mockFavorites = [{ entityId: '1', entityType: 'deities' }];
            window.EyesOfAzrael.favorites = {
                getFavorites: jest.fn().mockResolvedValue({ success: true, data: mockFavorites })
            };

            const result = await dashboard.loadFavorites();
            expect(result).toEqual(mockFavorites);
        });

        test('should return empty array when favorites service unavailable', async () => {
            delete window.EyesOfAzrael.favorites;
            const result = await dashboard.loadFavorites();
            expect(result).toEqual([]);
        });

        test('should load notes from notesService', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            const mockNotes = [{ id: 'n1', text: 'Test note' }];
            window.notesService = {
                getUserNotes: jest.fn().mockResolvedValue(mockNotes)
            };

            const result = await dashboard.loadNotes();
            expect(result).toEqual(mockNotes);

            delete window.notesService;
        });

        test('should return empty array when no user for notes', async () => {
            mockAuth.currentUser = null;
            const result = await dashboard.loadNotes();
            expect(result).toEqual([]);
        });

        test('should handle errors in loadSubmissions gracefully', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            window.submissionWorkflow = {
                getUserSubmissions: jest.fn().mockRejectedValue(new Error('Network error'))
            };

            const result = await dashboard.loadSubmissions();
            expect(result).toEqual([]);

            delete window.submissionWorkflow;
        });
    });

    // ========================================
    // 3. Action Handling (8 tests)
    // ========================================

    describe('Action Handling', () => {
        test('should handle view submission', () => {
            dashboard.submissions = [{ id: 's1', entityName: 'Zeus' }];
            dashboard.handleViewSubmission('s1');

            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith('#/submission/s1');
        });

        test('should handle view submission when not found', () => {
            dashboard.submissions = [];
            dashboard.handleViewSubmission('nonexistent');

            expect(window.EyesOfAzrael.navigation.navigate).not.toHaveBeenCalled();
        });

        test('should handle edit submission', () => {
            dashboard.handleEditSubmission('s1');
            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith('#/submission/s1/edit');
        });

        test('should handle delete submission with confirmation', async () => {
            dashboard.submissions = [{ id: 's1', entityName: 'Zeus' }];
            dashboard.container = mockContainer;
            global.confirm.mockReturnValue(true);

            window.submissionWorkflow = {
                deleteSubmission: jest.fn().mockResolvedValue()
            };

            await dashboard.handleDeleteSubmission('s1');
            expect(dashboard.submissions).toEqual([]);
            expect(window.toast.success).toHaveBeenCalledWith('Submission deleted successfully');

            delete window.submissionWorkflow;
        });

        test('should cancel delete when not confirmed', async () => {
            dashboard.submissions = [{ id: 's1', entityName: 'Zeus' }];
            global.confirm.mockReturnValue(false);

            await dashboard.handleDeleteSubmission('s1');
            expect(dashboard.submissions.length).toBe(1);
        });

        test('should handle view favorite', () => {
            dashboard.handleViewFavorite('e1', 'deities');
            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith(
                '#/mythology/user/deities/e1'
            );
        });

        test('should handle create submission', () => {
            dashboard.handleCreateSubmission();
            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith('#/contribute');
        });

        test('should handle action dispatch', async () => {
            const viewSpy = jest.spyOn(dashboard, 'handleViewSubmission');
            await dashboard.handleAction('view', { id: 's1' });
            expect(viewSpy).toHaveBeenCalledWith('s1');
        });
    });

    // ========================================
    // 4. Tab Management (5 tests)
    // ========================================

    describe('Tab Management', () => {
        test('should switch active tab', () => {
            // Setup tabs in container
            mockContainer.innerHTML = `
                <button class="dashboard-tab" data-tab="submissions" aria-selected="true"></button>
                <button class="dashboard-tab" data-tab="favorites" aria-selected="false"></button>
                <div class="dashboard-panel" id="panel-submissions"></div>
                <div class="dashboard-panel" id="panel-favorites"></div>
            `;
            dashboard.container = mockContainer;

            dashboard.switchTab('favorites');
            expect(dashboard.activeTab).toBe('favorites');
        });

        test('should handle pagination', () => {
            dashboard.container = mockContainer;
            mockContainer.innerHTML = '<div id="panel-submissions"></div>';

            dashboard.handlePagination('submissions', 3);
            expect(dashboard.pagination.submissions.page).toBe(3);
        });

        test('should handle edit profile', () => {
            dashboard.handleEditProfile();
            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith('#/profile/edit');
        });

        test('should handle navigate with fallback', () => {
            delete window.EyesOfAzrael.navigation;
            dashboard.handleNavigate('#/mythologies');
            expect(window.location.hash).toBe('#/mythologies');
        });

        test('should handle navigate with EyesOfAzrael', () => {
            window.EyesOfAzrael.navigation = { navigate: jest.fn() };
            dashboard.handleNavigate('#/mythologies');
            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith('#/mythologies');
        });
    });

    // ========================================
    // 5. Utility Methods (8 tests)
    // ========================================

    describe('Utility Methods', () => {
        test('should format dates correctly', () => {
            const now = new Date();
            expect(dashboard.formatDate(now)).toBe('Today');
        });

        test('should format yesterday', () => {
            const yesterday = new Date(Date.now() - 86400000);
            expect(dashboard.formatDate(yesterday)).toBe('Yesterday');
        });

        test('should handle null date', () => {
            expect(dashboard.formatDate(null)).toBe('Unknown');
        });

        test('should handle Firestore timestamp format', () => {
            const timestamp = { seconds: Math.floor(Date.now() / 1000) };
            expect(dashboard.formatDate(timestamp)).toBe('Today');
        });

        test('should truncate long text', () => {
            const longText = 'A'.repeat(200);
            const result = dashboard.truncate(longText, 50);
            expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
            expect(result).toContain('...');
        });

        test('should not truncate short text', () => {
            expect(dashboard.truncate('Hello', 50)).toBe('Hello');
        });

        test('should capitalize first letter', () => {
            expect(dashboard.capitalizeFirst('deities')).toBe('Deities');
            expect(dashboard.capitalizeFirst('')).toBe('');
            expect(dashboard.capitalizeFirst(null)).toBe('');
        });

        test('should escape HTML', () => {
            const result = dashboard.escapeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
        });
    });

    // ========================================
    // 6. Toast Notifications (3 tests)
    // ========================================

    describe('Toast Notifications', () => {
        test('should show success toast', () => {
            dashboard.showToast('Done!', 'success');
            expect(window.toast.success).toHaveBeenCalledWith('Done!');
        });

        test('should show error toast', () => {
            dashboard.showToast('Failed!', 'error');
            expect(window.toast.error).toHaveBeenCalledWith('Failed!');
        });

        test('should fallback to console when toast not available', () => {
            window.toast = null;
            dashboard.showToast('Test message', 'info');
            expect(console.log).toHaveBeenCalledWith('[INFO]', 'Test message');
        });
    });

    // ========================================
    // 7. Error Handling (5 tests)
    // ========================================

    describe('Error Handling', () => {
        test('should handle loadFavorites errors gracefully', async () => {
            window.EyesOfAzrael.favorites = {
                getFavorites: jest.fn().mockRejectedValue(new Error('Network error'))
            };

            const result = await dashboard.loadFavorites();
            expect(result).toEqual([]);
        });

        test('should handle loadNotes errors gracefully', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            window.notesService = {
                getUserNotes: jest.fn().mockRejectedValue(new Error('DB error'))
            };

            const result = await dashboard.loadNotes();
            expect(result).toEqual([]);

            delete window.notesService;
        });

        test('should handle delete submission errors', async () => {
            dashboard.submissions = [{ id: 's1', entityName: 'Zeus' }];
            dashboard.container = mockContainer;
            global.confirm.mockReturnValue(true);

            window.submissionWorkflow = {
                deleteSubmission: jest.fn().mockRejectedValue(new Error('Delete failed'))
            };

            await dashboard.handleDeleteSubmission('s1');
            expect(window.toast.error).toHaveBeenCalledWith('Failed to delete submission: Delete failed');

            delete window.submissionWorkflow;
        });

        test('should handle sign in errors', async () => {
            mockAuth.signInWithPopup.mockRejectedValue(new Error('Auth failed'));

            await dashboard.handleSignIn();
            expect(window.toast.error).toHaveBeenCalledWith('Failed to sign in: Auth failed');
        });

        test('should handle delete submission not found', async () => {
            dashboard.submissions = [];
            await dashboard.handleDeleteSubmission('nonexistent');
            expect(global.confirm).not.toHaveBeenCalled();
        });
    });

    // ========================================
    // 8. Default Avatar & Icons (4 tests)
    // ========================================

    describe('Avatar and Icons', () => {
        test('should generate default avatar SVG', () => {
            const avatar = dashboard.getDefaultAvatar();
            expect(avatar).toContain('data:image/svg+xml');
        });

        test('should return type icon for known types', () => {
            const icon = dashboard.getTypeIcon('deities');
            expect(icon).toContain('svg');
        });

        test('should return fallback icon for unknown types', () => {
            const icon = dashboard.getTypeIcon('unknown');
            expect(icon).toContain('svg');
        });

        test('should return status icon', () => {
            const icon = dashboard.getStatusIcon('approved');
            expect(icon).toContain('svg');
        });
    });

    // ========================================
    // 9. Format Member Since (2 tests)
    // ========================================

    describe('Format Member Since', () => {
        test('should format valid date', () => {
            const result = dashboard.formatMemberSince('2024-01-15T00:00:00.000Z');
            expect(result).toContain('2024');
        });

        test('should handle missing date', () => {
            expect(dashboard.formatMemberSince(null)).toBe('Unknown');
        });
    });

    // ========================================
    // 10. Render with Authenticated User
    // ========================================

    describe('Render with authenticated user', () => {
        beforeEach(() => {
            mockAuth.currentUser = {
                uid: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: 'https://photo.url/avatar.jpg',
                metadata: { creationTime: '2024-01-01T00:00:00.000Z' }
            };
        });

        test('should render dashboard with user info', async () => {
            // Mock loadAllUserData
            jest.spyOn(dashboard, 'loadAllUserData').mockResolvedValue();
            const html = await dashboard.render();
            expect(html).toContain('user-dashboard');
            expect(html).toContain('Test User');
            expect(html).toContain('test@example.com');
        });

        test('should use email prefix when no displayName', async () => {
            mockAuth.currentUser.displayName = null;
            jest.spyOn(dashboard, 'loadAllUserData').mockResolvedValue();
            const html = await dashboard.render();
            expect(html).toContain('test');
        });

        test('should use default avatar when no photoURL', async () => {
            mockAuth.currentUser.photoURL = null;
            jest.spyOn(dashboard, 'loadAllUserData').mockResolvedValue();
            const html = await dashboard.render();
            expect(html).toContain('data:image/svg+xml');
        });

        test('should render tabs', async () => {
            jest.spyOn(dashboard, 'loadAllUserData').mockResolvedValue();
            const html = await dashboard.render();
            expect(html).toContain('tab-submissions');
            expect(html).toContain('tab-favorites');
            expect(html).toContain('tab-notes');
        });

        test('should render stats section', async () => {
            jest.spyOn(dashboard, 'loadAllUserData').mockResolvedValue();
            const html = await dashboard.render();
            expect(html).toContain('dashboard-stats');
        });
    });

    // ========================================
    // 11. renderStatsCards
    // ========================================

    describe('renderStatsCards', () => {
        test('should render 4 stat cards', () => {
            const html = dashboard.renderStatsCards();
            expect(html).toContain('stat-card--gold');
            expect(html).toContain('stat-card--rose');
            expect(html).toContain('stat-card--cyan');
            expect(html).toContain('stat-card--purple');
        });

        test('should include stat values', () => {
            dashboard.stats = { submissions: 5, favorites: 10, notes: 3, badges: 2 };
            dashboard.submissions = [
                { status: 'draft' },
                { status: 'pending' },
                { status: 'approved' },
                { status: 'approved' },
                { status: 'rejected' }
            ];
            const html = dashboard.renderStatsCards();
            expect(html).toContain('data-target="5"');
            expect(html).toContain('data-target="10"');
        });
    });

    // ========================================
    // 12. getSubmissionBreakdown
    // ========================================

    describe('getSubmissionBreakdown', () => {
        test('should count each status correctly', () => {
            dashboard.submissions = [
                { status: 'draft' },
                { status: 'draft' },
                { status: 'pending' },
                { status: 'approved' },
                { status: 'rejected' }
            ];
            const html = dashboard.getSubmissionBreakdown();
            expect(html).toContain('Draft: 2');
            expect(html).toContain('Pending: 1');
            expect(html).toContain('Approved: 1');
            expect(html).toContain('Rejected: 1');
        });
    });

    // ========================================
    // 13. renderSubmissionsTab
    // ========================================

    describe('renderSubmissionsTab', () => {
        test('should render empty state when no submissions', () => {
            dashboard.submissions = [];
            const html = dashboard.renderSubmissionsTab();
            expect(html).toContain('empty-state');
            expect(html).toContain('No Submissions Yet');
        });

        test('should render submission cards with pagination', () => {
            dashboard.submissions = Array.from({ length: 10 }, (_, i) => ({
                id: `s${i}`,
                entityName: `Entity ${i}`,
                status: 'draft',
                type: 'deity'
            }));
            dashboard.pagination.submissions = { page: 1, perPage: 8, total: 10 };
            const html = dashboard.renderSubmissionsTab();
            expect(html).toContain('submission-card');
            expect(html).toContain('pagination');
        });
    });

    // ========================================
    // 14. renderSubmissionCard
    // ========================================

    describe('renderSubmissionCard', () => {
        test('should render card with name and status', () => {
            const html = dashboard.renderSubmissionCard({
                id: 's1',
                entityName: 'Zeus',
                status: 'approved',
                type: 'deity',
                submittedAt: new Date()
            });
            expect(html).toContain('Zeus');
            expect(html).toContain('status--approved');
            expect(html).toContain('Approved');
        });

        test('should show edit button for draft submissions', () => {
            const html = dashboard.renderSubmissionCard({
                id: 's1',
                entityName: 'Draft Entity',
                status: 'draft',
                type: 'deity'
            });
            expect(html).toContain('action-btn--edit');
            expect(html).toContain('action-btn--delete');
        });

        test('should show edit button for rejected submissions', () => {
            const html = dashboard.renderSubmissionCard({
                id: 's1',
                entityName: 'Rejected Entity',
                status: 'rejected',
                type: 'deity'
            });
            expect(html).toContain('action-btn--edit');
        });

        test('should not show edit/delete for approved submissions', () => {
            const html = dashboard.renderSubmissionCard({
                id: 's1',
                entityName: 'Approved Entity',
                status: 'approved',
                type: 'deity'
            });
            expect(html).not.toContain('action-btn--edit');
            expect(html).not.toContain('action-btn--delete');
        });

        test('should use data.name when entityName missing', () => {
            const html = dashboard.renderSubmissionCard({
                id: 's1',
                status: 'draft',
                data: { name: 'Fallback Name' }
            });
            expect(html).toContain('Fallback Name');
        });
    });

    // ========================================
    // 15. renderFavoritesTab
    // ========================================

    describe('renderFavoritesTab', () => {
        test('should render empty state when no favorites', () => {
            dashboard.favorites = [];
            const html = dashboard.renderFavoritesTab();
            expect(html).toContain('No Favorites Yet');
        });

        test('should render favorite cards', () => {
            dashboard.favorites = [
                { entityId: 'e1', entityType: 'deities', name: 'Zeus', mythology: 'Greek' },
                { entityId: 'e2', entityType: 'heroes', name: 'Heracles', mythology: 'Greek' }
            ];
            dashboard.pagination.favorites = { page: 1, perPage: 12, total: 2 };
            const html = dashboard.renderFavoritesTab();
            expect(html).toContain('favorite-card');
            expect(html).toContain('Showing all 2 items');
        });
    });

    // ========================================
    // 16. renderFavoriteCard
    // ========================================

    describe('renderFavoriteCard', () => {
        test('should render with name and mythology', () => {
            const html = dashboard.renderFavoriteCard({
                entityId: 'e1',
                entityType: 'deities',
                name: 'Zeus',
                mythology: 'Greek'
            });
            expect(html).toContain('Zeus');
            expect(html).toContain('Greek');
            expect(html).toContain('remove-favorite');
        });
    });

    // ========================================
    // 17. renderNotesTab
    // ========================================

    describe('renderNotesTab', () => {
        test('should render empty state when no notes', () => {
            dashboard.notes = [];
            const html = dashboard.renderNotesTab();
            expect(html).toContain('No Notes Yet');
        });

        test('should render note cards', () => {
            dashboard.notes = [
                { id: 'n1', entityName: 'Zeus', content: 'King of gods', assetType: 'deities', assetId: 'zeus', createdAt: new Date() }
            ];
            dashboard.pagination.notes = { page: 1, perPage: 10, total: 1 };
            const html = dashboard.renderNotesTab();
            expect(html).toContain('note-card');
        });
    });

    // ========================================
    // 18. renderNoteCard
    // ========================================

    describe('renderNoteCard', () => {
        test('should render with entity name and preview', () => {
            const html = dashboard.renderNoteCard({
                id: 'n1',
                entityName: 'Zeus',
                content: 'A very important note about Zeus the king of the Olympian gods.',
                assetType: 'deities',
                assetId: 'zeus',
                createdAt: new Date(),
                isEdited: true
            });
            expect(html).toContain('Zeus');
            expect(html).toContain('(edited)');
            expect(html).toContain('edit-note');
            expect(html).toContain('delete-note');
        });

        test('should use assetId when entityName missing', () => {
            const html = dashboard.renderNoteCard({
                id: 'n1',
                assetId: 'zeus-id',
                content: 'Test',
                assetType: 'deities'
            });
            expect(html).toContain('zeus-id');
        });
    });

    // ========================================
    // 19. renderEmptyState
    // ========================================

    describe('renderEmptyState', () => {
        test('should render submissions empty state', () => {
            const html = dashboard.renderEmptyState('submissions');
            expect(html).toContain('No Submissions Yet');
            expect(html).toContain('create-submission');
        });

        test('should render favorites empty state', () => {
            const html = dashboard.renderEmptyState('favorites');
            expect(html).toContain('No Favorites Yet');
            expect(html).toContain('explore');
        });

        test('should render notes empty state', () => {
            const html = dashboard.renderEmptyState('notes');
            expect(html).toContain('No Notes Yet');
            expect(html).toContain('browse');
        });
    });

    // ========================================
    // 20. renderPagination
    // ========================================

    describe('renderPagination', () => {
        test('should show all items message for single page', () => {
            const html = dashboard.renderPagination('submissions', 1, 1, 5);
            expect(html).toContain('Showing all 5 items');
        });

        test('should render pagination controls for multiple pages', () => {
            const html = dashboard.renderPagination('submissions', 2, 5, 40);
            expect(html).toContain('pagination-btn--prev');
            expect(html).toContain('pagination-btn--next');
            expect(html).toContain('2 / 5');
            expect(html).toContain('Showing 9-16 of 40');
        });

        test('should disable prev button on first page', () => {
            const html = dashboard.renderPagination('submissions', 1, 5, 40);
            expect(html).toContain('data-page="0"');
        });
    });

    // ========================================
    // 21. renderNotAuthenticated
    // ========================================

    describe('renderNotAuthenticated', () => {
        test('should render auth required view', () => {
            const html = dashboard.renderNotAuthenticated();
            expect(html).toContain('Authentication Required');
            expect(html).toContain('signInBtn');
        });
    });

    // ========================================
    // 22. loadAllUserData
    // ========================================

    describe('loadAllUserData', () => {
        test('should skip when no user', async () => {
            mockAuth.currentUser = null;
            await dashboard.loadAllUserData();
            expect(dashboard.submissions).toEqual([]);
        });

        test('should load all data in parallel', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            jest.spyOn(dashboard, 'loadSubmissions').mockResolvedValue([{ id: 's1' }]);
            jest.spyOn(dashboard, 'loadFavorites').mockResolvedValue([{ entityId: 'f1' }, { entityId: 'f2' }]);
            jest.spyOn(dashboard, 'loadNotes').mockResolvedValue([{ id: 'n1' }]);
            jest.spyOn(dashboard, 'loadBadgeCount').mockResolvedValue(3);

            await dashboard.loadAllUserData();

            expect(dashboard.submissions).toEqual([{ id: 's1' }]);
            expect(dashboard.favorites).toHaveLength(2);
            expect(dashboard.notes).toHaveLength(1);
            expect(dashboard.stats.badges).toBe(3);
            expect(dashboard.pagination.submissions.total).toBe(1);
        });

        test('should handle loadAllUserData errors', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            jest.spyOn(dashboard, 'loadSubmissions').mockRejectedValue(new Error('fail'));

            await dashboard.loadAllUserData(); // should not throw
        });
    });

    // ========================================
    // 23. loadBadgeCount
    // ========================================

    describe('loadBadgeCount', () => {
        test('should return 0 when no user', async () => {
            mockAuth.currentUser = null;
            const count = await dashboard.loadBadgeCount();
            expect(count).toBe(0);
        });

        test('should return badge count from Firestore', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            window.EyesOfAzrael.db = {
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({
                            exists: true,
                            data: () => ({ badges: ['b1', 'b2', 'b3'] })
                        })
                    })
                })
            };

            const count = await dashboard.loadBadgeCount();
            expect(count).toBe(3);
        });

        test('should return 0 when user doc does not exist', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            window.EyesOfAzrael.db = {
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({ exists: false })
                    })
                })
            };

            const count = await dashboard.loadBadgeCount();
            expect(count).toBe(0);
        });

        test('should handle errors gracefully', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            window.EyesOfAzrael.db = {
                collection: jest.fn().mockImplementation(() => { throw new Error('db error'); })
            };

            const count = await dashboard.loadBadgeCount();
            expect(count).toBe(0);
        });
    });

    // ========================================
    // 24. initialize and event listeners
    // ========================================

    describe('initialize', () => {
        test('should set container and call sub-methods', () => {
            mockContainer.innerHTML = `
                <div class="dashboard-tab" data-tab="submissions"></div>
                <div class="dashboard-tab" data-tab="favorites"></div>
                <div class="dashboard-panel" id="panel-submissions"></div>
                <div class="dashboard-panel" id="panel-favorites"></div>
                <div class="stat-value" data-target="5">0</div>
            `;

            const tabSpy = jest.spyOn(dashboard, 'initializeTabs');
            const animSpy = jest.spyOn(dashboard, 'animateStatNumbers');
            const eventSpy = jest.spyOn(dashboard, 'initializeEventListeners');
            const kbSpy = jest.spyOn(dashboard, 'initializeKeyboardNavigation');

            dashboard.initialize(mockContainer);

            expect(dashboard.container).toBe(mockContainer);
            expect(tabSpy).toHaveBeenCalled();
            expect(animSpy).toHaveBeenCalled();
            expect(eventSpy).toHaveBeenCalled();
            expect(kbSpy).toHaveBeenCalled();
        });
    });

    // ========================================
    // 25. switchTab
    // ========================================

    describe('switchTab', () => {
        test('should update tab states and panels', () => {
            mockContainer.innerHTML = `
                <button class="dashboard-tab active" data-tab="submissions" aria-selected="true"></button>
                <button class="dashboard-tab" data-tab="favorites" aria-selected="false"></button>
                <div class="dashboard-panel active" id="panel-submissions"></div>
                <div class="dashboard-panel" id="panel-favorites"></div>
            `;
            dashboard.container = mockContainer;
            jest.spyOn(dashboard, 'announceToScreenReader').mockImplementation(() => {});

            dashboard.switchTab('favorites');

            expect(dashboard.activeTab).toBe('favorites');
            const favTab = mockContainer.querySelector('[data-tab="favorites"]');
            expect(favTab.classList.contains('active')).toBe(true);
            expect(favTab.getAttribute('aria-selected')).toBe('true');

            const subTab = mockContainer.querySelector('[data-tab="submissions"]');
            expect(subTab.classList.contains('active')).toBe(false);
        });
    });

    // ========================================
    // 26. animateStatNumbers
    // ========================================

    describe('animateStatNumbers', () => {
        test('should mark animated and call animateNumber', () => {
            mockContainer.innerHTML = `
                <div class="stat-value" data-target="5">0</div>
                <div class="stat-value" data-target="0">0</div>
            `;
            dashboard.container = mockContainer;
            const spy = jest.spyOn(dashboard, 'animateNumber').mockImplementation(() => {});

            dashboard.animateStatNumbers();

            expect(dashboard.animatedStats).toBe(true);
            expect(spy).toHaveBeenCalledTimes(2);
        });

        test('should not re-animate', () => {
            dashboard.container = mockContainer;
            dashboard.animatedStats = true;
            const spy = jest.spyOn(dashboard, 'animateNumber').mockImplementation(() => {});

            dashboard.animateStatNumbers();

            expect(spy).not.toHaveBeenCalled();
        });
    });

    // ========================================
    // 27. animateNumber
    // ========================================

    describe('animateNumber', () => {
        test('should set to 0 immediately when end is 0', () => {
            const el = document.createElement('div');
            dashboard.animateNumber(el, 0, 0, 1000);
            expect(el.textContent).toBe('0');
        });

        test('should call requestAnimationFrame for non-zero end', () => {
            const el = document.createElement('div');
            const spy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {});
            dashboard.animateNumber(el, 0, 10, 1000);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    // ========================================
    // 28. refreshTab
    // ========================================

    describe('refreshTab', () => {
        test('should refresh submissions tab', () => {
            mockContainer.innerHTML = `
                <div id="panel-submissions"></div>
                <button data-tab="submissions"><span class="tab-count">0</span></button>
                <article data-stat="submissions"><div class="stat-value">0</div></article>
            `;
            dashboard.container = mockContainer;
            dashboard.submissions = [{ id: 's1', entityName: 'Zeus', status: 'draft', type: 'deity' }];
            dashboard.stats.submissions = 1;
            dashboard.pagination.submissions = { page: 1, perPage: 8, total: 1 };

            dashboard.refreshTab('submissions');

            expect(mockContainer.querySelector('#panel-submissions').innerHTML).toContain('submission-card');
            expect(mockContainer.querySelector('.tab-count').textContent).toBe('1');
        });

        test('should handle missing panel', () => {
            mockContainer.innerHTML = '';
            dashboard.container = mockContainer;
            expect(() => dashboard.refreshTab('submissions')).not.toThrow();
        });

        test('should refresh favorites tab', () => {
            mockContainer.innerHTML = '<div id="panel-favorites"></div>';
            dashboard.container = mockContainer;
            dashboard.favorites = [];

            dashboard.refreshTab('favorites');
            expect(mockContainer.querySelector('#panel-favorites').innerHTML).toContain('No Favorites Yet');
        });

        test('should refresh notes tab', () => {
            mockContainer.innerHTML = '<div id="panel-notes"></div>';
            dashboard.container = mockContainer;
            dashboard.notes = [];

            dashboard.refreshTab('notes');
            expect(mockContainer.querySelector('#panel-notes').innerHTML).toContain('No Notes Yet');
        });
    });

    // ========================================
    // 29. announceToScreenReader
    // ========================================

    describe('announceToScreenReader', () => {
        test('should add and remove announcement element', () => {
            jest.useFakeTimers();
            dashboard.announceToScreenReader('Tab changed');
            const el = document.querySelector('[role="status"]');
            expect(el).not.toBeNull();
            expect(el.textContent).toBe('Tab changed');

            jest.advanceTimersByTime(1100);
            expect(document.querySelector('[role="status"]')).toBeNull();
            jest.useRealTimers();
        });
    });

    // ========================================
    // 30. handleAction dispatch
    // ========================================

    describe('handleAction dispatch', () => {
        test('should dispatch edit action', async () => {
            const spy = jest.spyOn(dashboard, 'handleEditSubmission');
            await dashboard.handleAction('edit', { id: 's1' });
            expect(spy).toHaveBeenCalledWith('s1');
        });

        test('should dispatch delete action', async () => {
            const spy = jest.spyOn(dashboard, 'handleDeleteSubmission').mockResolvedValue();
            await dashboard.handleAction('delete', { id: 's1' });
            expect(spy).toHaveBeenCalledWith('s1');
        });

        test('should dispatch remove-favorite action', async () => {
            const spy = jest.spyOn(dashboard, 'handleRemoveFavorite').mockResolvedValue();
            await dashboard.handleAction('remove-favorite', { entityId: 'e1', entityType: 'deities' });
            expect(spy).toHaveBeenCalledWith('e1', 'deities');
        });

        test('should dispatch view-favorite action', async () => {
            const spy = jest.spyOn(dashboard, 'handleViewFavorite');
            await dashboard.handleAction('view-favorite', { entityId: 'e1', entityType: 'deities' });
            expect(spy).toHaveBeenCalledWith('e1', 'deities');
        });

        test('should dispatch edit-note action', async () => {
            const spy = jest.spyOn(dashboard, 'handleEditNote');
            await dashboard.handleAction('edit-note', { noteId: 'n1', assetType: 'deities', assetId: 'zeus' });
            expect(spy).toHaveBeenCalledWith('n1', 'deities', 'zeus');
        });

        test('should dispatch delete-note action', async () => {
            const spy = jest.spyOn(dashboard, 'handleDeleteNote').mockResolvedValue();
            await dashboard.handleAction('delete-note', { noteId: 'n1', assetType: 'deities', assetId: 'zeus' });
            expect(spy).toHaveBeenCalledWith('n1', 'deities', 'zeus');
        });

        test('should dispatch paginate action', async () => {
            mockContainer.innerHTML = '<div id="panel-submissions"></div>';
            dashboard.container = mockContainer;
            const spy = jest.spyOn(dashboard, 'handlePagination');
            await dashboard.handleAction('paginate', { type: 'submissions', page: '3' });
            expect(spy).toHaveBeenCalledWith('submissions', 3);
        });

        test('should dispatch create-submission action', async () => {
            const spy = jest.spyOn(dashboard, 'handleCreateSubmission');
            await dashboard.handleAction('create-submission', {});
            expect(spy).toHaveBeenCalled();
        });

        test('should dispatch explore action', async () => {
            const spy = jest.spyOn(dashboard, 'handleNavigate');
            await dashboard.handleAction('explore', {});
            expect(spy).toHaveBeenCalledWith('#/mythologies');
        });

        test('should dispatch browse action', async () => {
            const spy = jest.spyOn(dashboard, 'handleNavigate');
            await dashboard.handleAction('browse', {});
            expect(spy).toHaveBeenCalledWith('#/mythologies');
        });
    });

    // ========================================
    // 31. handleRemoveFavorite
    // ========================================

    describe('handleRemoveFavorite', () => {
        test('should remove favorite and refresh', async () => {
            dashboard.container = mockContainer;
            mockContainer.innerHTML = '<div id="panel-favorites"></div>';
            dashboard.favorites = [
                { entityId: 'e1', entityType: 'deities' },
                { entityId: 'e2', entityType: 'heroes' }
            ];
            dashboard.pagination.favorites = { page: 1, perPage: 12, total: 2 };

            window.EyesOfAzrael.favorites = {
                removeFavorite: jest.fn().mockResolvedValue()
            };

            await dashboard.handleRemoveFavorite('e1', 'deities');

            expect(dashboard.favorites).toHaveLength(1);
            expect(dashboard.stats.favorites).toBe(1);
        });

        test('should handle remove favorite errors', async () => {
            dashboard.container = mockContainer;
            dashboard.favorites = [{ entityId: 'e1', entityType: 'deities' }];

            window.EyesOfAzrael.favorites = {
                removeFavorite: jest.fn().mockRejectedValue(new Error('fail'))
            };

            await dashboard.handleRemoveFavorite('e1', 'deities');
            expect(window.toast.error).toHaveBeenCalled();
        });
    });

    // ========================================
    // 32. handleEditNote and handleDeleteNote
    // ========================================

    describe('handleEditNote', () => {
        test('should navigate to entity page with edit query', () => {
            dashboard.handleEditNote('n1', 'deities', 'zeus');
            expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalledWith(
                '#/mythology/user/deities/zeus?editNote=n1'
            );
        });
    });

    describe('handleDeleteNote', () => {
        test('should delete note and refresh', async () => {
            dashboard.container = mockContainer;
            mockContainer.innerHTML = '<div id="panel-notes"></div>';
            dashboard.notes = [{ id: 'n1' }, { id: 'n2' }];
            dashboard.pagination.notes = { page: 1, perPage: 10, total: 2 };
            global.confirm.mockReturnValue(true);

            window.notesService = {
                deleteNote: jest.fn().mockResolvedValue()
            };

            await dashboard.handleDeleteNote('n1', 'deities', 'zeus');

            expect(dashboard.notes).toHaveLength(1);
            expect(window.toast.success).toHaveBeenCalled();
            delete window.notesService;
        });

        test('should cancel when not confirmed', async () => {
            dashboard.notes = [{ id: 'n1' }];
            global.confirm.mockReturnValue(false);

            await dashboard.handleDeleteNote('n1', 'deities', 'zeus');
            expect(dashboard.notes).toHaveLength(1);
        });

        test('should handle delete note errors', async () => {
            dashboard.container = mockContainer;
            dashboard.notes = [{ id: 'n1' }];
            dashboard.pagination.notes = { page: 1, perPage: 10, total: 1 };
            global.confirm.mockReturnValue(true);

            window.notesService = {
                deleteNote: jest.fn().mockRejectedValue(new Error('fail'))
            };

            await dashboard.handleDeleteNote('n1', 'deities', 'zeus');
            expect(window.toast.error).toHaveBeenCalled();
            delete window.notesService;
        });
    });

    // ========================================
    // 33. initializeEventListeners
    // ========================================

    describe('initializeEventListeners', () => {
        test('should set up edit profile button listener', () => {
            mockContainer.innerHTML = '<button id="editProfileBtn"></button>';
            dashboard.container = mockContainer;
            const spy = jest.spyOn(dashboard, 'handleEditProfile');

            dashboard.initializeEventListeners();
            mockContainer.querySelector('#editProfileBtn').click();

            expect(spy).toHaveBeenCalled();
        });

        test('should set up delegated action handling', () => {
            mockContainer.innerHTML = '<button data-action="view" data-id="s1">View</button>';
            dashboard.container = mockContainer;
            const spy = jest.spyOn(dashboard, 'handleAction').mockImplementation(() => {});

            dashboard.initializeEventListeners();
            mockContainer.querySelector('[data-action]').click();

            expect(spy).toHaveBeenCalledWith('view', expect.any(DOMStringMap));
        });
    });

    // ========================================
    // 34. initializeKeyboardNavigation
    // ========================================

    describe('initializeKeyboardNavigation', () => {
        test('should handle arrow key navigation', () => {
            mockContainer.innerHTML = `
                <button class="dashboard-tab" data-tab="submissions"></button>
                <button class="dashboard-tab" data-tab="favorites"></button>
                <button class="dashboard-tab" data-tab="notes"></button>
                <div class="dashboard-panel" id="panel-submissions"></div>
                <div class="dashboard-panel" id="panel-favorites"></div>
                <div class="dashboard-panel" id="panel-notes"></div>
            `;
            dashboard.container = mockContainer;
            jest.spyOn(dashboard, 'announceToScreenReader').mockImplementation(() => {});

            dashboard.initializeKeyboardNavigation();

            const tabs = mockContainer.querySelectorAll('.dashboard-tab');
            const focusSpy = jest.spyOn(tabs[1], 'focus').mockImplementation(() => {});

            tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            expect(focusSpy).toHaveBeenCalled();
        });
    });

    // ========================================
    // 35. loadSubmissions via Firestore fallback
    // ========================================

    describe('loadSubmissions Firestore fallback', () => {
        test('should load from Firestore when submissionWorkflow unavailable', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            delete window.submissionWorkflow;
            window.EyesOfAzrael.db = {
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                get: jest.fn().mockResolvedValue({
                                    docs: [
                                        { id: 's1', data: () => ({ entityName: 'Zeus' }) },
                                        { id: 's2', data: () => ({ entityName: 'Hera' }) }
                                    ]
                                })
                            })
                        })
                    })
                })
            };

            const result = await dashboard.loadSubmissions();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 's1', entityName: 'Zeus' });
        });

        test('should return empty when no Firestore and no workflow', async () => {
            mockAuth.currentUser = { uid: 'user-123' };
            delete window.submissionWorkflow;
            delete window.EyesOfAzrael.db;

            const result = await dashboard.loadSubmissions();
            expect(result).toEqual([]);
        });
    });

    // ========================================
    // 36. formatDate edge cases
    // ========================================

    describe('formatDate edge cases', () => {
        test('should handle toDate() Firestore timestamp', () => {
            const result = dashboard.formatDate({ toDate: () => new Date() });
            expect(result).toBe('Today');
        });

        test('should format days ago', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
            expect(dashboard.formatDate(threeDaysAgo)).toBe('3 days ago');
        });

        test('should format weeks ago', () => {
            const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
            expect(dashboard.formatDate(twoWeeksAgo)).toContain('weeks ago');
        });

        test('should format months ago', () => {
            const twoMonthsAgo = new Date(Date.now() - 60 * 86400000);
            expect(dashboard.formatDate(twoMonthsAgo)).toContain('months ago');
        });

        test('should format old dates', () => {
            const oldDate = new Date('2020-01-01');
            const result = dashboard.formatDate(oldDate);
            expect(result).toContain('2020');
        });
    });

    // ========================================
    // 37. handleSignIn
    // ========================================

    describe('handleSignIn', () => {
        test('should handle successful sign in', async () => {
            mockAuth.signInWithPopup.mockResolvedValue({ user: { uid: '123' } });
            // Mock location.reload
            delete window.location;
            window.location = { reload: jest.fn(), hash: '' };

            await dashboard.handleSignIn();
            expect(window.location.reload).toHaveBeenCalled();
        });
    });
});
