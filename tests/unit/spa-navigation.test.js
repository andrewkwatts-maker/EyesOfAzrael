/**
 * Unit Tests for SPANavigation
 */

describe('SPANavigation', () => {
    let navigation;
    let mockDb;
    let mockAuth;
    let mockRenderer;

    beforeEach(() => {
        // Create mocks
        mockDb = new MockFirestore();
        mockAuth = new MockAuth();
        mockRenderer = {
            render: (entities, mode) => `<div>${entities.length} entities</div>`
        };

        // Mock Firebase global
        window.firebase = {
            auth: () => mockAuth,
            firestore: () => mockDb
        };

        // Mock user as authenticated
        mockAuth.mockUser({
            uid: 'test-user',
            email: 'test@example.com',
            displayName: 'Test User'
        });

        // Create main-content element
        if (!document.getElementById('main-content')) {
            const mainContent = document.createElement('div');
            mainContent.id = 'main-content';
            document.body.appendChild(mainContent);
        }
    });

    afterEach(() => {
        // Clean up
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.remove();
        }
        delete window.firebase;
        if (navigation) {
            navigation.routeHistory = [];
        }
    });

    describe('Initialization', () => {
        it('should initialize with proper dependencies', () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);

            expect(navigation.db).toBeDefined();
            expect(navigation.auth).toBeDefined();
            expect(navigation.renderer).toBeDefined();
        });

        it('should initialize empty route history', () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);
            expect(navigation.routeHistory).toEqual([]);
        });

        it('should define route patterns', () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);

            expect(navigation.routes.home).toBeDefined();
            expect(navigation.routes.mythology).toBeDefined();
            expect(navigation.routes.entity).toBeDefined();
        });
    });

    describe('Route Matching', () => {
        beforeEach(() => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);
        });

        it('should match home route', () => {
            expect(navigation.routes.home.test('/')).toBe(true);
            expect(navigation.routes.home.test('#/')).toBe(true);
            expect(navigation.routes.home.test('')).toBe(true);
        });

        it('should match mythology route', () => {
            expect(navigation.routes.mythology.test('/mythology/greek')).toBe(true);
            expect(navigation.routes.mythology.test('#/mythology/norse')).toBe(true);
        });

        it('should match entity route', () => {
            const match = '/mythology/greek/deities/zeus'.match(navigation.routes.entity);
            expect(match).not.toBeNull();
            expect(match[1]).toBe('greek');
            expect(match[2]).toBe('deities');
            expect(match[3]).toBe('zeus');
        });

        it('should match search route', () => {
            expect(navigation.routes.search.test('/search')).toBe(true);
            expect(navigation.routes.search.test('#/search')).toBe(true);
        });
    });

    describe('Navigation', () => {
        beforeEach(async () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);
            // Wait for auth to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should navigate to a path', () => {
            navigation.navigate('/mythology/greek');
            expect(window.location.hash).toBe('#/mythology/greek');
        });

        it('should add hash if missing', () => {
            navigation.navigate('mythology/greek');
            expect(window.location.hash).toBe('#mythology/greek');
        });

        it('should add to route history', async () => {
            navigation.addToHistory('/test');
            expect(navigation.routeHistory.length).toBe(1);
            expect(navigation.routeHistory[0].path).toBe('/test');
        });

        it('should limit history to maxHistory', () => {
            navigation.maxHistory = 5;

            for (let i = 0; i < 10; i++) {
                navigation.addToHistory(`/path${i}`);
            }

            expect(navigation.routeHistory.length).toBe(5);
        });
    });

    describe('Rendering', () => {
        beforeEach(async () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should show loading state', () => {
            navigation.showLoading();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('loading');
        });

        it('should render 404 page', async () => {
            await navigation.render404();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('404');
            expect(mainContent.innerHTML).toContain('not found');
        });

        it('should render error page', () => {
            const error = new Error('Test error');
            navigation.renderError(error);

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('Error');
            expect(mainContent.innerHTML).toContain('Test error');
        });

        it('should render home page with mythology cards', async () => {
            await navigation.renderHome();

            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toContain('mythology');
        });
    });

    describe('Authentication Integration', () => {
        it('should wait for auth before routing', async () => {
            mockAuth.currentUser = null;
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);

            // Should not route yet
            expect(navigation.authReady).toBe(false);

            // Mock user login
            await mockAuth.signInWithEmailAndPassword('test@example.com', 'password123');

            // Wait for auth state change
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(navigation.authReady).toBe(true);
        });

        it('should handle logged out state', async () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Sign out
            await mockAuth.signOut();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Try to handle route - should skip
            await navigation.handleRoute();

            // Main content shouldn't change (protected by auth)
            const mainContent = document.getElementById('main-content');
            expect(mainContent.innerHTML).toBe('');
        });
    });

    describe('History Management', () => {
        beforeEach(async () => {
            navigation = new SPANavigation(mockDb, mockAuth, mockRenderer);
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should get full history', () => {
            navigation.addToHistory('/path1');
            navigation.addToHistory('/path2');

            const history = navigation.getHistory();
            expect(history.length).toBe(2);
        });

        it('should go back', () => {
            const backSpy = jest.fn();
            window.history.back = backSpy;

            navigation.goBack();
            expect(backSpy).toHaveBeenCalled();
        });
    });
});
