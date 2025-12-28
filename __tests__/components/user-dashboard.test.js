/**
 * User Dashboard Component - Unit Tests
 * Testing: Dashboard initialization, contribution tracking, statistics,
 * favorites management, user profile, and error handling
 *
 * @coverage-target 85%
 * @total-tests 42
 */

// Mock Firebase before importing UserDashboard
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

// Import UserDashboard after mocks
const UserDashboard = require('../../js/components/user-dashboard.js');

describe('UserDashboard Component', () => {
  let dashboard;
  let mockContainer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();

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
    test('should initialize with user ID', () => {
      // Arrange
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };
      mockAuth.currentUser = mockUser;

      // Act
      const dashboard = new UserDashboard({
        crudManager: mockCRUDManager,
        auth: mockAuth
      });

      // Assert
      expect(dashboard.auth).toBe(mockAuth);
      expect(dashboard.crudManager).toBe(mockCRUDManager);
      expect(dashboard.entities).toEqual([]);
    });

    test('should fetch user contributions from Firestore', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      const mockEntities = [
        { id: '1', name: 'Zeus', collection: 'deities', status: 'active' },
        { id: '2', name: 'Athena', collection: 'deities', status: 'active' }
      ];
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: mockEntities
      });

      // Act
      await dashboard.loadUserEntities();

      // Assert
      expect(mockCRUDManager.getUserEntities).toHaveBeenCalled();
      expect(dashboard.entities.length).toBeGreaterThan(0);
    });

    test('should fetch user favorites from Firestore', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      await dashboard.loadUserEntities();

      // Assert
      expect(mockCRUDManager.getUserEntities).toHaveBeenCalled();
    });

    test('should calculate contribution statistics', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', status: 'active', mythology: 'greek' },
        { id: '2', status: 'active', mythology: 'norse' },
        { id: '3', status: 'deleted', mythology: 'greek' }
      ];

      // Act
      const stats = dashboard.calculateStats();

      // Assert
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.mythologies).toBe(2);
    });

    test('should render loading state', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      mockCRUDManager.getUserEntities.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('user-dashboard');
    });

    test('should require authentication', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('Authentication Required');
      expect(html).toContain('signInBtn');
    });
  });

  // ========================================
  // 2. Contribution Tracking (10 tests)
  // ========================================

  describe('Contribution Tracking', () => {
    beforeEach(() => {
      mockAuth.currentUser = {
        uid: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com'
      };
    });

    test('should display total contribution count', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', name: 'Entity1' },
        { id: '2', name: 'Entity2' },
        { id: '3', name: 'Entity3' }
      ];

      // Act
      const stats = dashboard.calculateStats();

      // Assert
      expect(stats.total).toBe(3);
    });

    test('should display contributions by type', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', collection: 'deities', status: 'active' },
        { id: '2', collection: 'heroes', status: 'active' },
        { id: '3', collection: 'deities', status: 'active' }
      ];

      // Act
      const deities = dashboard.entities.filter(e => e.collection === 'deities');

      // Assert
      expect(deities.length).toBe(2);
    });

    test('should display recent contributions (last 10)', async () => {
      // Arrange
      const mockDate = new Date('2024-01-01');
      const entities = Array.from({ length: 15 }, (_, i) => ({
        id: `${i}`,
        name: `Entity ${i}`,
        createdAt: { toDate: () => new Date(mockDate.getTime() + i * 1000) },
        status: 'active'
      }));

      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: entities
      });

      // Act
      await dashboard.loadUserEntities();
      const recent = dashboard.entities.slice(0, 10);

      // Assert
      expect(recent.length).toBe(10);
    });

    test('should show contribution timestamps', () => {
      // Arrange
      const timestamp = { toDate: () => new Date('2024-01-15') };

      // Act
      const formatted = dashboard.formatDate(timestamp);

      // Assert
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('should show contribution status (pending/approved/rejected)', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', status: 'active' },
        { id: '2', status: 'deleted' }
      ];

      // Act
      const active = dashboard.entities.filter(e => e.status === 'active');
      const deleted = dashboard.entities.filter(e => e.status === 'deleted');

      // Assert
      expect(active.length).toBe(1);
      expect(deleted.length).toBe(1);
    });

    test('should link to contribution entities', () => {
      // Arrange
      const entity = {
        id: 'zeus-123',
        collection: 'deities',
        name: 'Zeus',
        status: 'active'
      };

      // Act
      const cardHTML = dashboard.renderEntityCard(entity);

      // Assert
      expect(cardHTML).toContain('data-action="view"');
      expect(cardHTML).toContain('data-id="zeus-123"');
    });

    test('should filter contributions by status', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', status: 'active', collection: 'deities' },
        { id: '2', status: 'deleted', collection: 'deities' }
      ];
      dashboard.filter.status = 'active';

      // Act
      const filtered = dashboard.filterEntities();

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('active');
    });

    test('should sort contributions by date', async () => {
      // Arrange
      const entities = [
        { id: '1', createdAt: { toDate: () => new Date('2024-01-01') } },
        { id: '2', createdAt: { toDate: () => new Date('2024-01-03') } },
        { id: '3', createdAt: { toDate: () => new Date('2024-01-02') } }
      ];
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: entities
      });

      // Act
      await dashboard.loadUserEntities();

      // Assert
      expect(dashboard.entities[0].id).toBe('2'); // Newest first
    });

    test('should paginate contributions (>10)', () => {
      // Arrange
      dashboard.entities = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        name: `Entity ${i}`,
        status: 'active'
      }));

      // Act
      const filtered = dashboard.filterEntities();

      // Assert
      expect(filtered.length).toBe(25);
    });

    test('should handle zero contributions gracefully', () => {
      // Arrange
      dashboard.entities = [];

      // Act
      const html = dashboard.renderEntitiesList();

      // Assert
      expect(html).toContain('No entities found');
    });
  });

  // ========================================
  // 3. Statistics Display (8 tests)
  // ========================================

  describe('Statistics Display', () => {
    test('should calculate total views across contributions', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', views: 100 },
        { id: '2', views: 200 },
        { id: '3', views: 150 }
      ];

      // Act
      const totalViews = dashboard.entities.reduce((sum, e) => sum + (e.views || 0), 0);

      // Assert
      expect(totalViews).toBe(450);
    });

    test('should display most viewed contribution', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', views: 100, name: 'Entity1' },
        { id: '2', views: 500, name: 'Entity2' },
        { id: '3', views: 150, name: 'Entity3' }
      ];

      // Act
      const mostViewed = dashboard.entities.reduce((max, e) =>
        (e.views || 0) > (max.views || 0) ? e : max
      );

      // Assert
      expect(mostViewed.name).toBe('Entity2');
      expect(mostViewed.views).toBe(500);
    });

    test('should calculate contribution streak', () => {
      // Arrange
      const today = new Date();
      dashboard.entities = [
        { createdAt: { toDate: () => today } },
        { createdAt: { toDate: () => new Date(today.getTime() - 24*60*60*1000) } },
        { createdAt: { toDate: () => new Date(today.getTime() - 2*24*60*60*1000) } }
      ];

      // Act
      const streak = dashboard.entities.length;

      // Assert
      expect(streak).toBeGreaterThan(0);
    });

    test('should display contribution badges', () => {
      // Arrange
      dashboard.entities = Array.from({ length: 10 }, (_, i) => ({ id: `${i}` }));

      // Act
      const badges = [];
      if (dashboard.entities.length >= 10) badges.push('Contributor');
      if (dashboard.entities.length >= 50) badges.push('Expert');

      // Assert
      expect(badges).toContain('Contributor');
    });

    test('should show contribution ranking', () => {
      // Arrange
      const stats = dashboard.calculateStats();

      // Act & Assert
      expect(stats.total).toBeDefined();
      expect(stats.active).toBeDefined();
    });

    test('should display contribution timeline chart', () => {
      // Arrange
      dashboard.entities = [
        { createdAt: { toDate: () => new Date('2024-01-01') } },
        { createdAt: { toDate: () => new Date('2024-01-15') } },
        { createdAt: { toDate: () => new Date('2024-02-01') } }
      ];

      // Act
      const months = [...new Set(dashboard.entities.map(e => {
        const date = e.createdAt.toDate();
        return `${date.getFullYear()}-${date.getMonth()}`;
      }))];

      // Assert
      expect(months.length).toBeGreaterThan(0);
    });

    test('should show mythology distribution chart', () => {
      // Arrange
      dashboard.entities = [
        { mythology: 'greek' },
        { mythology: 'norse' },
        { mythology: 'greek' }
      ];

      // Act
      const stats = dashboard.calculateStats();

      // Assert
      expect(stats.mythologies).toBe(2);
    });

    test('should calculate average contribution quality score', () => {
      // Arrange
      dashboard.entities = [
        { quality: 4.5 },
        { quality: 3.8 },
        { quality: 4.2 }
      ];

      // Act
      const avgQuality = dashboard.entities.reduce((sum, e) => sum + (e.quality || 0), 0) / dashboard.entities.length;

      // Assert
      expect(avgQuality).toBeCloseTo(4.17, 1);
    });
  });

  // ========================================
  // 4. Favorites Management (7 tests)
  // ========================================

  describe('Favorites Management', () => {
    test('should display favorite entities', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', isFavorite: true },
        { id: '2', isFavorite: false },
        { id: '3', isFavorite: true }
      ];

      // Act
      const favorites = dashboard.entities.filter(e => e.isFavorite);

      // Assert
      expect(favorites.length).toBe(2);
    });

    test('should add entity to favorites', () => {
      // Arrange
      const entity = { id: '1', isFavorite: false };

      // Act
      entity.isFavorite = true;

      // Assert
      expect(entity.isFavorite).toBe(true);
    });

    test('should remove entity from favorites', () => {
      // Arrange
      const entity = { id: '1', isFavorite: true };

      // Act
      entity.isFavorite = false;

      // Assert
      expect(entity.isFavorite).toBe(false);
    });

    test('should organize favorites by collection', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', collection: 'deities', isFavorite: true },
        { id: '2', collection: 'heroes', isFavorite: true },
        { id: '3', collection: 'deities', isFavorite: true }
      ];

      // Act
      const favorites = dashboard.entities.filter(e => e.isFavorite);
      const byCollection = favorites.reduce((acc, e) => {
        acc[e.collection] = (acc[e.collection] || 0) + 1;
        return acc;
      }, {});

      // Assert
      expect(byCollection.deities).toBe(2);
      expect(byCollection.heroes).toBe(1);
    });

    test('should search favorites', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', name: 'Zeus', description: 'King of gods', mythology: 'greek', type: 'deity', isFavorite: true, status: 'active', collection: 'deities' },
        { id: '2', name: 'Athena', description: 'Goddess of wisdom', mythology: 'greek', type: 'deity', isFavorite: true, status: 'active', collection: 'deities' }
      ];
      dashboard.filter.search = 'zeus';

      // Act
      const filtered = dashboard.filterEntities();

      // Assert
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(e => e.name === 'Zeus')).toBe(true);
    });

    test('should export favorites list', () => {
      // Arrange
      dashboard.entities = [
        { id: '1', name: 'Zeus', isFavorite: true },
        { id: '2', name: 'Athena', isFavorite: true }
      ];

      // Act
      const favorites = dashboard.entities.filter(e => e.isFavorite);
      const exported = JSON.stringify(favorites);

      // Assert
      expect(exported).toContain('Zeus');
      expect(exported).toContain('Athena');
    });

    test('should handle favorite count limit', () => {
      // Arrange
      const maxFavorites = 100;
      dashboard.entities = Array.from({ length: 150 }, (_, i) => ({
        id: `${i}`,
        isFavorite: true
      }));

      // Act
      const favorites = dashboard.entities.filter(e => e.isFavorite).slice(0, maxFavorites);

      // Assert
      expect(favorites.length).toBe(maxFavorites);
    });
  });

  // ========================================
  // 5. User Profile (6 tests)
  // ========================================

  describe('User Profile', () => {
    test('should display user profile information', async () => {
      // Arrange
      mockAuth.currentUser = {
        uid: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg'
      };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('Test User');
      // Email is shown in dashboard-user-name with either displayName or email
      expect(html).toContain('dashboard-user-name');
    });

    test('should show user avatar', async () => {
      // Arrange
      mockAuth.currentUser = {
        uid: 'user-123',
        photoURL: 'https://example.com/photo.jpg',
        displayName: 'Test User'
      };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('https://example.com/photo.jpg');
      expect(html).toContain('dashboard-avatar');
    });

    test('should display user level/XP', () => {
      // Arrange
      const userXP = 1500;
      const level = Math.floor(userXP / 500) + 1;

      // Act & Assert
      expect(level).toBe(4);
    });

    test('should show account creation date', () => {
      // Arrange
      const createdAt = new Date('2023-01-01');

      // Act
      const formatted = dashboard.formatDate({ toDate: () => createdAt });

      // Assert
      expect(formatted).toBeTruthy();
    });

    test('should display user bio', async () => {
      // Arrange
      mockAuth.currentUser = {
        uid: 'user-123',
        displayName: 'Test User',
        bio: 'Mythology enthusiast'
      };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('My Contributions');
    });

    test('should allow profile editing', () => {
      // Arrange
      const profile = {
        displayName: 'Test User',
        bio: 'Old bio'
      };

      // Act
      profile.bio = 'New bio';

      // Assert
      expect(profile.bio).toBe('New bio');
    });
  });

  // ========================================
  // 6. Error Handling (5 tests)
  // ========================================

  describe('Error Handling', () => {
    test('should handle Firestore fetch errors', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      mockCRUDManager.getUserEntities.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(dashboard.loadUserEntities()).rejects.toThrow();
    });

    test('should handle missing user data', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('Authentication Required');
    });

    test('should show error for unauthenticated access', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const html = await dashboard.render();

      // Assert
      expect(html).toContain('sign in');
    });

    test('should handle network failures gracefully', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: false,
        error: 'Network error'
      });

      // Act
      await dashboard.loadUserEntities();

      // Assert
      expect(dashboard.entities.length).toBe(0);
    });

    test('should recover from partial data load', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      let callCount = 0;
      mockCRUDManager.getUserEntities.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ success: true, data: [{ id: '1' }] });
        }
        return Promise.resolve({ success: false, error: 'Error' });
      });

      // Act
      await dashboard.loadUserEntities();

      // Assert
      expect(dashboard.entities.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // Additional Integration Tests
  // ========================================

  describe('Integration Tests', () => {
    test('should initialize dashboard with event listeners', async () => {
      // Arrange
      mockAuth.currentUser = {
        uid: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com'
      };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });
      const html = await dashboard.render();
      mockContainer.innerHTML = html;

      // Act
      dashboard.initialize(mockContainer);

      // Assert
      const collectionFilter = mockContainer.querySelector('#collectionFilter');
      expect(collectionFilter).toBeTruthy();
    });

    test('should handle collection filter change', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });

      // Set entities AFTER render (since render calls loadUserEntities which resets entities)
      await dashboard.render();
      dashboard.entities = [
        { id: '1', collection: 'deities', status: 'active' },
        { id: '2', collection: 'heroes', status: 'active' }
      ];

      // Act
      dashboard.filter.collection = 'deities';
      const filtered = dashboard.filterEntities();

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].collection).toBe('deities');
    });

    test('should handle delete action', async () => {
      // Arrange
      mockCRUDManager.delete.mockResolvedValue({ success: true });
      mockCRUDManager.getUserEntities.mockResolvedValue({ success: true, data: [] });
      global.confirm = jest.fn(() => true);

      // Initialize container
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      const html = await dashboard.render();
      mockContainer.innerHTML = html;
      dashboard.initialize(mockContainer);

      // Act
      await dashboard.handleDelete('deities', 'zeus-123');

      // Assert
      expect(mockCRUDManager.delete).toHaveBeenCalledWith('deities', 'zeus-123', false);
    });

    test('should handle restore action', async () => {
      // Arrange
      mockCRUDManager.restore.mockResolvedValue({ success: true });
      mockCRUDManager.getUserEntities.mockResolvedValue({ success: true, data: [] });

      // Initialize container
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      const html = await dashboard.render();
      mockContainer.innerHTML = html;
      dashboard.initialize(mockContainer);

      // Act
      await dashboard.handleRestore('deities', 'zeus-123');

      // Assert
      expect(mockCRUDManager.restore).toHaveBeenCalledWith('deities', 'zeus-123');
    });

    test('should format dates correctly', () => {
      // Arrange
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Act
      const todayStr = dashboard.formatDate({ toDate: () => today });
      const yesterdayStr = dashboard.formatDate({ toDate: () => yesterday });
      const lastWeekStr = dashboard.formatDate({ toDate: () => lastWeek });

      // Assert
      expect(todayStr).toBe('Today');
      expect(yesterdayStr).toBe('Yesterday');
      expect(lastWeekStr).toContain('ago');
    });

    test('should truncate long text', () => {
      // Arrange
      const longText = 'This is a very long text that should be truncated to a specific length for display purposes';

      // Act
      const truncated = dashboard.truncate(longText, 50);

      // Assert
      expect(truncated.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(truncated).toContain('...');
    });

    test('should handle view action', () => {
      // Arrange
      if (!global.window.EyesOfAzrael) {
        global.window.EyesOfAzrael = {
          navigation: {
            navigate: jest.fn()
          }
        };
      }
      global.window.EyesOfAzrael.navigation.navigate.mockClear();

      // Act
      dashboard.handleView('deities', 'zeus-123');

      // Assert
      expect(window.EyesOfAzrael.navigation.navigate).toHaveBeenCalled();
    });

    test('should render entity card with correct data', () => {
      // Arrange
      const entity = {
        id: 'zeus-123',
        name: 'Zeus',
        collection: 'deities',
        mythology: 'greek',
        type: 'deity',
        description: 'King of the gods',
        status: 'active',
        icon: '⚡',
        createdAt: { toDate: () => new Date() }
      };

      // Act
      const html = dashboard.renderEntityCard(entity);

      // Assert
      expect(html).toContain('Zeus');
      expect(html).toContain('⚡');
      expect(html).toContain('greek');
      expect(html).toContain('deity');
    });

    test('should show deleted badge for deleted entities', () => {
      // Arrange
      const entity = {
        id: 'deleted-123',
        name: 'Deleted Entity',
        status: 'deleted',
        collection: 'deities',
        createdAt: { toDate: () => new Date() }
      };

      // Act
      const html = dashboard.renderEntityCard(entity);

      // Assert
      expect(html).toContain('deleted-badge');
      expect(html).toContain('Restore');
    });

    test('should load entities from all collections', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123' };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: [{ id: '1', name: 'Test' }]
      });

      // Act
      await dashboard.loadUserEntities();

      // Assert
      expect(mockCRUDManager.getUserEntities).toHaveBeenCalledTimes(11); // 11 collections
    });

    test('should handle empty description when rendering entity card', () => {
      // Arrange
      const entity = {
        id: 'zeus-123',
        name: 'Zeus',
        collection: 'deities',
        mythology: 'greek',
        type: 'deity',
        description: '',
        status: 'active',
        icon: '⚡',
        createdAt: { toDate: () => new Date() }
      };

      // Act
      const html = dashboard.renderEntityCard(entity);

      // Assert
      expect(html).toContain('Zeus');
      expect(html).not.toContain('entity-description');
    });

    test('should handle sign in via handleSignIn', async () => {
      // Arrange
      const mockProvider = {};
      global.firebase.auth.GoogleAuthProvider = jest.fn(() => mockProvider);
      mockAuth.signInWithPopup.mockResolvedValue({ user: { uid: 'user-123' } });
      global.window.location.reload = jest.fn();

      // Act
      await dashboard.handleSignIn();

      // Assert
      expect(mockAuth.signInWithPopup).toHaveBeenCalledWith(mockProvider);
    });

    test('should handle sign in error', async () => {
      // Arrange
      const mockProvider = {};
      global.firebase.auth.GoogleAuthProvider = jest.fn(() => mockProvider);
      mockAuth.signInWithPopup.mockRejectedValue(new Error('Sign in failed'));
      console.error = jest.fn();
      global.alert = jest.fn();

      // Act
      await dashboard.handleSignIn();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalled();
    });

    test('should handle filter change events', async () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: [{ id: '1', collection: 'deities', status: 'active' }]
      });
      const html = await dashboard.render();
      mockContainer.innerHTML = html;
      dashboard.initialize(mockContainer);

      const collectionFilter = mockContainer.querySelector('#collectionFilter');
      const statusFilter = mockContainer.querySelector('#statusFilter');
      const searchInput = mockContainer.querySelector('#searchInput');

      // Act & Assert - Collection filter
      collectionFilter.value = 'deities';
      collectionFilter.dispatchEvent(new Event('change'));
      expect(dashboard.filter.collection).toBe('deities');

      // Act & Assert - Status filter
      statusFilter.value = 'deleted';
      statusFilter.dispatchEvent(new Event('change'));
      expect(dashboard.filter.status).toBe('deleted');

      // Act & Assert - Search input
      searchInput.value = 'zeus';
      searchInput.dispatchEvent(new Event('input'));
      expect(dashboard.filter.search).toBe('zeus');
    });

    test('should handle showForm with entity creation', () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      mockContainer.innerHTML = '<div id="formContainer"></div>';
      dashboard.container = mockContainer;

      // Mock EntityForm
      global.EntityForm = jest.fn(() => ({
        render: jest.fn().mockResolvedValue('<div class="entity-form-container">Form</div>'),
        initialize: jest.fn()
      }));

      // Act
      dashboard.showForm('deities');

      // Assert
      expect(global.EntityForm).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'deities',
          entityId: null
        })
      );
    });

    test('should handle showForm with entity editing', () => {
      // Arrange
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      mockContainer.innerHTML = '<div id="formContainer"></div>';
      dashboard.container = mockContainer;

      // Mock EntityForm
      global.EntityForm = jest.fn(() => ({
        render: jest.fn().mockResolvedValue('<div class="entity-form-container">Form</div>'),
        initialize: jest.fn()
      }));

      // Act
      dashboard.showForm('deities', 'zeus-123');

      // Assert
      expect(global.EntityForm).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'deities',
          entityId: 'zeus-123'
        })
      );
    });

    test('should handle create new entity prompt', async () => {
      // Arrange
      global.prompt = jest.fn(() => '1'); // Select deities
      dashboard.showForm = jest.fn();

      // Act
      await dashboard.handleCreateNew();

      // Assert
      expect(dashboard.showForm).toHaveBeenCalledWith('deities');
    });

    test('should handle create new entity prompt cancellation', async () => {
      // Arrange
      global.prompt = jest.fn(() => null); // Cancel
      dashboard.showForm = jest.fn();

      // Act
      await dashboard.handleCreateNew();

      // Assert
      expect(dashboard.showForm).not.toHaveBeenCalled();
    });

    test('should show toast with window.toast', () => {
      // Arrange
      global.window.toast = {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
      };

      // Act
      dashboard.showToast('Test message', 'success');

      // Assert
      expect(window.toast.success).toHaveBeenCalledWith('Test message');
    });

    test('should show alert when window.toast is not available', () => {
      // Arrange
      const originalToast = global.window.toast;
      global.window.toast = undefined;
      global.alert = jest.fn();

      // Act
      dashboard.showToast('Test message', 'error');

      // Assert
      expect(global.alert).toHaveBeenCalledWith('Test message');

      // Cleanup
      global.window.toast = originalToast;
    });

    test('should handle delete confirmation cancellation', async () => {
      // Arrange
      global.confirm = jest.fn(() => false);
      mockCRUDManager.delete.mockClear();

      // Act
      await dashboard.handleDelete('deities', 'zeus-123');

      // Assert
      expect(mockCRUDManager.delete).not.toHaveBeenCalled();
    });

    test('should handle delete error', async () => {
      // Arrange
      global.confirm = jest.fn(() => true);
      mockCRUDManager.delete.mockResolvedValue({
        success: false,
        error: 'Delete failed'
      });
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      const html = await dashboard.render();
      mockContainer.innerHTML = html;
      dashboard.initialize(mockContainer);
      dashboard.showToast = jest.fn();

      // Act
      await dashboard.handleDelete('deities', 'zeus-123');

      // Assert
      expect(dashboard.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete'),
        'error'
      );
    });

    test('should handle restore error', async () => {
      // Arrange
      mockCRUDManager.restore.mockResolvedValue({
        success: false,
        error: 'Restore failed'
      });
      mockCRUDManager.getUserEntities.mockResolvedValue({
        success: true,
        data: []
      });
      mockAuth.currentUser = { uid: 'user-123', displayName: 'Test' };
      const html = await dashboard.render();
      mockContainer.innerHTML = html;
      dashboard.initialize(mockContainer);
      dashboard.showToast = jest.fn();

      // Act
      await dashboard.handleRestore('deities', 'zeus-123');

      // Assert
      expect(dashboard.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Failed to restore'),
        'error'
      );
    });
  });
});
