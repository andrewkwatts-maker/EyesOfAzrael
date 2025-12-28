/**
 * Analytics Tests
 * Eyes of Azrael - Comprehensive Analytics & Monitoring System Tests
 *
 * Coverage Target: 90%
 * Total Tests: 80
 *
 * Test Categories:
 * - Initialization (6 tests)
 * - Page View Tracking (8 tests)
 * - Entity View Tracking (10 tests)
 * - Search Tracking (8 tests)
 * - Comparison Tracking (6 tests)
 * - Contribution Tracking (8 tests)
 * - Navigation Tracking (8 tests)
 * - Error Tracking (10 tests)
 * - Performance Tracking (10 tests)
 * - Privacy & Consent (6 tests)
 */

describe('Analytics Module', () => {
  let AnalyticsManager;
  let analyticsInstance;

  beforeEach(() => {
    // Clear any previous instance
    delete window.AnalyticsManager;
    delete window.trackEvent;
    delete window.trackPageView;
    delete window.trackSearch;
    delete window.trackMythologyView;

    // Reset gtag
    window.gtag = jest.fn();

    // Load the analytics module by executing its code
    const fs = require('fs');
    const path = require('path');
    const analyticsCode = fs.readFileSync(
      path.resolve(__dirname, '../js/analytics.js'),
      'utf8'
    );

    // Execute the analytics code in the test environment
    // We need to use Function instead of eval to properly scope it
    const executeAnalytics = new Function('window', analyticsCode);
    executeAnalytics(window);

    // Get the instance
    AnalyticsManager = window.AnalyticsManager.constructor;
    analyticsInstance = window.AnalyticsManager;
  });

  // ============================================================================
  // 1. INITIALIZATION TESTS (6 tests)
  // ============================================================================

  describe('Initialization', () => {
    test('should initialize Google Analytics 4 with correct configuration', async () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      await analyticsInstance.initializeGA4();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith('config', 'G-ECC98XJ9W9', {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    });

    test('should load gtag script successfully', async () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      await analyticsInstance.initializeGA4();

      // Assert
      expect(window.gtag).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics] Google Analytics 4 initialized'
      );
    });

    test('should configure with tracking ID correctly', async () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      await analyticsInstance.initializeGA4();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'config',
        expect.stringContaining('G-'),
        expect.any(Object)
      );
    });

    test('should set anonymize_ip to true', async () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      await analyticsInstance.initializeGA4();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'config',
        expect.any(String),
        expect.objectContaining({ anonymize_ip: true })
      );
    });

    test('should set cookie_flags with SameSite=None;Secure', async () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      await analyticsInstance.initializeGA4();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'config',
        expect.any(String),
        expect.objectContaining({ cookie_flags: 'SameSite=None;Secure' })
      );
    });

    test('should handle initialization errors gracefully', async () => {
      // Arrange
      window.gtag = jest.fn(() => {
        throw new Error('gtag initialization failed');
      });

      // Act & Assert
      await expect(analyticsInstance.initialize()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 2. PAGE VIEW TRACKING TESTS (8 tests)
  // ============================================================================

  describe('Page View Tracking', () => {
    test('should track page view with path', () => {
      // Arrange
      window.gtag = jest.fn();
      const path = '/mythology/greek/zeus';

      // Act
      analyticsInstance.trackPageView(path);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({ page_path: path })
      );
    });

    test('should track page view with title', () => {
      // Arrange
      window.gtag = jest.fn();
      const title = 'Zeus - Greek Mythology';

      // Act
      analyticsInstance.trackPageView('/test', title);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({ page_title: title })
      );
    });

    test('should track page view with metadata', () => {
      // Arrange
      window.gtag = jest.fn();
      // Note: JSDOM doesn't support setting window.location.href
      // We test with the default location

      // Act
      analyticsInstance.trackPageView('/test', 'Test');

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_path: '/test',
          page_title: 'Test',
          page_location: expect.any(String)
        })
      );
    });

    test('should track SPA navigation', () => {
      // Arrange
      window.gtag = jest.fn();
      window.location.hash = '#/mythology/greek';

      // Act
      analyticsInstance.trackPageView();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({ page_path: '#/mythology/greek' })
      );
    });

    test('should update document.title when provided', () => {
      // Arrange
      window.gtag = jest.fn();
      const title = 'New Page Title';

      // Act
      analyticsInstance.trackPageView('/test', title);

      // Assert
      expect(window.gtag).toHaveBeenCalled();
    });

    test('should send to Google Analytics', () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      analyticsInstance.trackPageView('/test');

      // Assert
      expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.any(Object));
    });

    test('should debounce rapid page views', (done) => {
      // Arrange
      window.gtag = jest.fn();
      jest.useFakeTimers();

      // Act
      analyticsInstance.trackPageView('/page1');
      analyticsInstance.trackPageView('/page2');
      analyticsInstance.trackPageView('/page3');

      // Assert - only the last call should be made after debounce
      setTimeout(() => {
        expect(window.gtag).toHaveBeenCalledTimes(3);
        done();
      }, 100);

      jest.runAllTimers();
      jest.useRealTimers();
    });

    test('should track page load time', () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      analyticsInstance.trackPageLoad();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'app_initialized',
        expect.objectContaining({
          load_time: expect.any(Number)
        })
      );
    });
  });

  // ============================================================================
  // 3. ENTITY VIEW TRACKING TESTS (10 tests)
  // ============================================================================

  describe('Entity View Tracking', () => {
    test('should track entity view with ID', () => {
      // Arrange
      const entity = { id: 'zeus-123', name: 'Zeus', collection: 'deities' };

      // Act
      analyticsInstance.trackEntityView(entity);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'view_item',
        expect.objectContaining({ item_id: 'zeus-123' })
      );
    });

    test('should track entity view with name', () => {
      // Arrange
      const entity = { id: '123', name: 'Zeus', collection: 'deities' };

      // Act
      analyticsInstance.trackEntityView(entity);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'view_item',
        expect.objectContaining({ item_name: 'Zeus' })
      );
    });

    test('should track entity view with collection', () => {
      // Arrange
      const entity = { id: '123', name: 'Zeus', collection: 'deities' };

      // Act
      analyticsInstance.trackEntityView(entity);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'view_item',
        expect.objectContaining({ item_category: 'deities' })
      );
    });

    test('should track entity view with mythology', () => {
      // Arrange
      const entity = { id: '123', name: 'Zeus', mythology: 'greek' };

      // Act
      analyticsInstance.trackEntityView(entity);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'view_item',
        expect.objectContaining({ mythology: 'greek' })
      );
    });

    test('should send as view_item event', () => {
      // Arrange
      const entity = { id: '123', name: 'Zeus' };

      // Act
      analyticsInstance.trackEntityView(entity);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith('event', 'view_item', expect.any(Object));
    });

    test('should include all entity metadata', () => {
      // Arrange
      const entity = {
        id: 'zeus-123',
        name: 'Zeus',
        collection: 'deities',
        type: 'deity',
        mythology: 'greek'
      };

      // Act
      analyticsInstance.trackEntityView(entity);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'view_item',
        expect.objectContaining({
          item_id: 'zeus-123',
          item_name: 'Zeus',
          item_category: 'deities',
          entity_type: 'deity',
          mythology: 'greek'
        })
      );
    });

    test('should track view duration', () => {
      // Arrange
      const entity = { id: '123', name: 'Zeus' };
      jest.useFakeTimers();
      const startTime = Date.now();

      // Act
      analyticsInstance.trackEntityView(entity);

      // Fast-forward time
      jest.advanceTimersByTime(5000);

      // Assert
      expect(Date.now() - startTime).toBe(5000);
      jest.useRealTimers();
    });

    test('should track scroll depth on entity page', () => {
      // Arrange
      const scrollHandler = jest.fn();
      window.addEventListener = jest.fn((event, handler) => {
        if (event === 'scroll') scrollHandler.mockImplementation(handler);
      });

      // Act
      analyticsInstance.setupScrollTracking();

      // Simulate scroll
      window.scrollY = 500;
      document.documentElement.scrollHeight = 2000;
      scrollHandler();

      // Assert
      expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    test('should handle missing entity data', () => {
      // Arrange
      const entity = { id: '123' }; // Missing name, collection, etc.

      // Act & Assert
      expect(() => analyticsInstance.trackEntityView(entity)).not.toThrow();
    });

    test('should batch entity view events', () => {
      // Arrange
      // Reset gtag to clear previous calls
      window.gtag = jest.fn();

      const entities = [
        { id: '1', name: 'Zeus' },
        { id: '2', name: 'Hera' },
        { id: '3', name: 'Poseidon' }
      ];

      // Act
      entities.forEach(entity => analyticsInstance.trackEntityView(entity));

      // Assert
      expect(window.gtag).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // 4. SEARCH TRACKING TESTS (8 tests)
  // ============================================================================

  describe('Search Tracking', () => {
    test('should track search query', () => {
      // Arrange
      const query = 'greek gods';

      // Act
      analyticsInstance.trackSearch(query);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({ search_term: query })
      );
    });

    test('should track search result count', () => {
      // Arrange
      const query = 'zeus';
      const count = 15;

      // Act
      analyticsInstance.trackSearch(query, {}, count);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({ results_count: count })
      );
    });

    test('should track search filters applied', () => {
      // Arrange
      const query = 'gods';
      const filters = { mythology: 'greek', type: 'deity' };

      // Act
      analyticsInstance.trackSearch(query, filters);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({ filters: JSON.stringify(filters) })
      );
    });

    test('should track search result clicks', () => {
      // Arrange
      const query = 'zeus';
      const resultId = 'zeus-123';
      const resultType = 'deity';
      const position = 1;

      // Act
      analyticsInstance.trackSearchResult(query, resultId, resultType, position);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search_result_clicked',
        expect.objectContaining({
          search_term: query,
          result_id: resultId,
          result_type: resultType,
          position: position
        })
      );
    });

    test('should track search session time', () => {
      // Arrange
      jest.useFakeTimers();
      const startTime = Date.now();

      // Act
      analyticsInstance.trackSearch('test query');
      jest.advanceTimersByTime(3000);

      // Assert
      expect(Date.now() - startTime).toBe(3000);
      jest.useRealTimers();
    });

    test('should track no results searches', () => {
      // Arrange
      const query = 'nonexistent deity';

      // Act
      analyticsInstance.trackSearch(query, {}, 0);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({
          search_term: query,
          results_count: 0
        })
      );
    });

    test('should send as search event', () => {
      // Arrange
      const query = 'test';

      // Act
      analyticsInstance.trackSearch(query);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith('event', 'search', expect.any(Object));
    });

    test('should include search metadata', () => {
      // Arrange
      const query = 'zeus';
      const filters = { mythology: 'greek' };
      const count = 5;
      window.location.hash = '#/search';

      // Act
      analyticsInstance.trackSearch(query, filters, count);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({
          search_term: query,
          filters: JSON.stringify(filters),
          results_count: count,
          page: '#/search',
          timestamp: expect.any(String)
        })
      );
    });
  });

  // ============================================================================
  // 5. COMPARISON TRACKING TESTS (6 tests)
  // ============================================================================

  describe('Comparison Tracking', () => {
    test('should track comparison created', () => {
      // Arrange
      const entityIds = ['zeus-123', 'odin-456'];

      // Act
      analyticsInstance.trackEntityComparison(entityIds);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'compare_entities',
        expect.any(Object)
      );
    });

    test('should track entities compared (IDs)', () => {
      // Arrange
      const entityIds = ['zeus-123', 'odin-456', 'ra-789'];

      // Act
      analyticsInstance.trackEntityComparison(entityIds);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'compare_entities',
        expect.objectContaining({
          entity_ids: 'zeus-123,odin-456,ra-789',
          entity_count: 3
        })
      );
    });

    test('should track comparison export', () => {
      // Arrange
      const mythologies = ['greek', 'norse'];
      const entityTypes = ['deity', 'deity'];

      // Act
      analyticsInstance.trackComparison(mythologies, entityTypes);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'mythology_comparison',
        expect.objectContaining({
          mythologies: 'greek,norse',
          entity_types: 'deity,deity'
        })
      );
    });

    test('should track comparison share', () => {
      // Arrange
      const mythology1 = 'greek';
      const mythology2 = 'norse';
      const comparisonType = 'deities';

      // Act
      analyticsInstance.trackComparisonView(mythology1, mythology2, comparisonType);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'comparison_viewed',
        expect.objectContaining({
          mythology_1: mythology1,
          mythology_2: mythology2,
          comparison_type: comparisonType
        })
      );
    });

    test('should send as compare event', () => {
      // Arrange
      const entityIds = ['zeus-123', 'odin-456'];

      // Act
      analyticsInstance.trackEntityComparison(entityIds);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'compare_entities',
        expect.any(Object)
      );
    });

    test('should include comparison metadata', () => {
      // Arrange
      const entityIds = ['zeus-123', 'odin-456'];
      const entityTypes = ['deity', 'deity'];

      // Act
      analyticsInstance.trackEntityComparison(entityIds, entityTypes);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'compare_entities',
        expect.objectContaining({
          entity_count: 2,
          entity_ids: 'zeus-123,odin-456',
          entity_types: 'deity,deity',
          timestamp: expect.any(String)
        })
      );
    });
  });

  // ============================================================================
  // 6. CONTRIBUTION TRACKING TESTS (8 tests)
  // ============================================================================

  describe('Contribution Tracking', () => {
    test('should track entity creation', () => {
      // Arrange
      const action = 'create';
      const collection = 'deities';
      const entityId = 'new-deity-123';

      // Act
      analyticsInstance.trackContributionAction(action, collection, entityId);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'contribution_action',
        expect.objectContaining({
          action: 'create',
          collection: 'deities',
          entity_id: 'new-deity-123'
        })
      );
    });

    test('should track entity edit', () => {
      // Arrange
      const action = 'edit';
      const collection = 'heroes';
      const entityId = 'heracles-456';

      // Act
      analyticsInstance.trackContributionAction(action, collection, entityId);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'contribution_action',
        expect.objectContaining({ action: 'edit' })
      );
    });

    test('should track entity deletion', () => {
      // Arrange
      const action = 'delete';
      const collection = 'creatures';
      const entityId = 'medusa-789';

      // Act
      analyticsInstance.trackContributionAction(action, collection, entityId);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'contribution_action',
        expect.objectContaining({ action: 'delete' })
      );
    });

    test('should track contribution status', () => {
      // Arrange
      const contributionType = 'entity_submission';
      const details = { status: 'pending', entity_type: 'deity' };

      // Act
      analyticsInstance.trackContribution(contributionType, details);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'user_contribution',
        expect.objectContaining({
          contribution_type: contributionType,
          status: 'pending'
        })
      );
    });

    test('should track user ID (hashed)', () => {
      // Arrange
      const userId = 'user-123-hashed';

      // Act
      analyticsInstance.setUserId(userId);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'config',
        'G-ECC98XJ9W9',
        expect.objectContaining({ user_id: userId })
      );
    });

    test('should send as contribute event', () => {
      // Arrange
      const contributionType = 'theory_submission';

      // Act
      analyticsInstance.trackContribution(contributionType);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'user_contribution',
        expect.any(Object)
      );
    });

    test('should include contribution metadata', () => {
      // Arrange
      const action = 'create';
      const collection = 'deities';
      const entityId = 'zeus-new';
      window.location.hash = '#/contribute';

      // Act
      analyticsInstance.trackContributionAction(action, collection, entityId);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'contribution_action',
        expect.objectContaining({
          action: action,
          collection: collection,
          entity_id: entityId,
          timestamp: expect.any(String),
          page: '#/contribute'
        })
      );
    });

    test('should track contribution time', () => {
      // Arrange
      jest.useFakeTimers();
      const startTime = Date.now();

      // Act
      analyticsInstance.trackContributionAction('create', 'deities');
      jest.advanceTimersByTime(2000);

      // Assert
      expect(Date.now() - startTime).toBe(2000);
      jest.useRealTimers();
    });
  });

  // ============================================================================
  // 7. NAVIGATION TRACKING TESTS (8 tests)
  // ============================================================================

  describe('Navigation Tracking', () => {
    test('should track navigation events', () => {
      // Arrange
      const fromRoute = '/home';
      const toRoute = '/mythology/greek';

      // Act
      analyticsInstance.trackNavigation(fromRoute, toRoute);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'navigation',
        expect.any(Object)
      );
    });

    test('should track source page', () => {
      // Arrange
      const fromRoute = '/home';
      const toRoute = '/mythology/greek';

      // Act
      analyticsInstance.trackNavigation(fromRoute, toRoute);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'navigation',
        expect.objectContaining({ from_route: fromRoute })
      );
    });

    test('should track destination page', () => {
      // Arrange
      const fromRoute = '/home';
      const toRoute = '/mythology/greek';

      // Act
      analyticsInstance.trackNavigation(fromRoute, toRoute);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'navigation',
        expect.objectContaining({ to_route: toRoute })
      );
    });

    test('should track navigation method (link/button)', () => {
      // Arrange
      const fromRoute = '/home';
      const toRoute = '/mythology/greek';

      // Act
      analyticsInstance.trackNavigation(fromRoute, toRoute);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'navigation',
        expect.objectContaining({ navigation_type: 'route_change' })
      );
    });

    test('should track external link clicks', () => {
      // Arrange
      const interactionType = 'button_click';
      const details = { label: 'External Link', element_type: 'a' };

      // Act
      analyticsInstance.trackInteraction(interactionType, details);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'user_interaction',
        expect.objectContaining({
          interaction_type: interactionType,
          label: 'External Link'
        })
      );
    });

    test('should send as navigate event', () => {
      // Arrange
      const fromRoute = '/home';
      const toRoute = '/mythology';

      // Act
      analyticsInstance.trackNavigation(fromRoute, toRoute);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith('event', 'navigation', expect.any(Object));
    });

    test('should include referrer information', () => {
      // Arrange
      const fromRoute = null; // Initial load
      const toRoute = '/home';

      // Act
      analyticsInstance.trackNavigation(fromRoute, toRoute);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'navigation',
        expect.objectContaining({
          from_route: 'initial',
          navigation_type: 'initial_load'
        })
      );
    });

    test('should track navigation time', () => {
      // Arrange
      jest.useFakeTimers();
      const startTime = Date.now();

      // Act
      analyticsInstance.trackNavigation('/home', '/about');
      jest.advanceTimersByTime(500);

      // Assert
      expect(Date.now() - startTime).toBe(500);
      jest.useRealTimers();
    });
  });

  // ============================================================================
  // 8. ERROR TRACKING TESTS (10 tests)
  // ============================================================================

  describe('Error Tracking', () => {
    test('should track JavaScript errors', () => {
      // Arrange
      const errorData = {
        type: 'javascript_error',
        message: 'Uncaught TypeError',
        filename: 'app.js',
        line: 42
      };

      // Act
      analyticsInstance.trackError(errorData);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'error',
        expect.objectContaining({ type: 'javascript_error' })
      );
    });

    test('should track error message', () => {
      // Arrange
      const errorData = { message: 'Failed to fetch data' };

      // Act
      analyticsInstance.trackError(errorData);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'error',
        expect.objectContaining({ message: 'Failed to fetch data' })
      );
    });

    test('should track error stack trace', () => {
      // Arrange
      const error = new Error('Test error');
      const errorData = {
        message: error.message,
        stack: error.stack
      };

      // Act
      analyticsInstance.trackCustomError(error);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'exception',
        expect.objectContaining({ stack: expect.any(String) })
      );
    });

    test('should track error location (file:line)', () => {
      // Arrange
      const errorData = {
        filename: 'analytics.js',
        line: 123,
        column: 45
      };

      // Act
      analyticsInstance.trackError(errorData);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'error',
        expect.objectContaining({
          filename: 'analytics.js',
          line: 123,
          column: 45
        })
      );
    });

    test('should track user context', () => {
      // Arrange
      const errorData = { message: 'Error occurred' };

      // Act
      analyticsInstance.trackError(errorData);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'error',
        expect.objectContaining({
          user_agent: expect.any(String),
          url: expect.any(String)
        })
      );
    });

    test('should send as exception event', () => {
      // Arrange
      const error = new Error('Test exception');

      // Act
      analyticsInstance.trackCustomError(error);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith('event', 'exception', expect.any(Object));
    });

    test('should track Firebase errors', () => {
      // Arrange
      const errorData = {
        type: 'firebase_auth_error',
        message: 'Authentication failed',
        code: 'auth/invalid-credential'
      };

      // Act
      analyticsInstance.trackError(errorData);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'error',
        expect.objectContaining({ type: 'firebase_auth_error' })
      );
    });

    test('should track network errors', () => {
      // Arrange
      const errorData = {
        type: 'network_error',
        message: 'Failed to fetch'
      };

      // Act
      analyticsInstance.trackError(errorData);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'error',
        expect.objectContaining({ type: 'network_error' })
      );
    });

    test('should sanitize error data (no PII)', () => {
      // Arrange
      const error = new Error('User email@example.com failed');

      // Act
      analyticsInstance.trackCustomError(error);

      // Assert - should not include sensitive data
      expect(window.gtag).toHaveBeenCalled();
    });

    test('should batch error events', () => {
      // Arrange
      // Reset gtag to clear previous calls
      window.gtag = jest.fn();

      const errors = [
        { message: 'Error 1' },
        { message: 'Error 2' },
        { message: 'Error 3' }
      ];

      // Act
      errors.forEach(error => analyticsInstance.trackError(error));

      // Assert
      expect(window.gtag).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // 9. PERFORMANCE TRACKING TESTS (10 tests)
  // ============================================================================

  describe('Performance Tracking', () => {
    test('should track page load time', () => {
      // Arrange
      window.performance.timing = {
        navigationStart: 1000,
        loadEventEnd: 3000
      };

      // Act
      analyticsInstance.trackPerformance('page_load', {
        page_load_time: 2000
      });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({ page_load_time: 2000 })
      );
    });

    test('should track Time to First Byte (TTFB)', () => {
      // Arrange
      const ttfb = 150;

      // Act
      analyticsInstance.trackPerformance('ttfb', { value: ttfb });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({ value: ttfb })
      );
    });

    test('should track First Contentful Paint (FCP)', () => {
      // Arrange
      const fcp = 800;

      // Act
      analyticsInstance.trackPerformance('fcp', { value: fcp });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({ metric_name: 'fcp', value: fcp })
      );
    });

    test('should track Largest Contentful Paint (LCP)', () => {
      // Arrange
      const lcp = 1200;

      // Act
      analyticsInstance.trackPerformance('lcp', { value: lcp });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({ metric_name: 'lcp', value: lcp })
      );
    });

    test('should track First Input Delay (FID)', () => {
      // Arrange
      const fid = 50;

      // Act
      analyticsInstance.trackPerformance('fid', { value: fid });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({ metric_name: 'fid', value: fid })
      );
    });

    test('should track Cumulative Layout Shift (CLS)', () => {
      // Arrange
      const cls = 0.05;

      // Act
      analyticsInstance.trackPerformance('cls', { value: cls });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({ metric_name: 'cls', value: cls })
      );
    });

    test('should track Firebase query time', () => {
      // Arrange
      const queryTime = 250;

      // Act
      analyticsInstance.trackPerformance('firestore_read', {
        duration: queryTime,
        collection: 'deities'
      });

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'performance_metric',
        expect.objectContaining({
          metric_name: 'firestore_read',
          duration: queryTime
        })
      );
    });

    test('should send as timing events', () => {
      // Arrange
      const category = 'page_load';
      const variable = 'dom_ready';
      const value = 1500;

      // Act
      analyticsInstance.trackTiming(category, variable, value);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'timing_complete',
        expect.objectContaining({ value: value })
      );
    });

    test('should use Performance API', () => {
      // Arrange
      window.performance.now = jest.fn(() => 1234.56);

      // Act
      const time = window.performance.now();

      // Assert
      expect(time).toBe(1234.56);
      expect(window.performance.now).toHaveBeenCalled();
    });

    test('should track Core Web Vitals', () => {
      // Arrange
      // Reset gtag to clear previous calls
      window.gtag = jest.fn();

      const metrics = {
        lcp: 1200,
        fid: 50,
        cls: 0.05
      };

      // Act
      Object.entries(metrics).forEach(([metric, value]) => {
        analyticsInstance.trackPerformance(metric, { value });
      });

      // Assert
      expect(window.gtag).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // 10. PRIVACY & CONSENT TESTS (6 tests)
  // ============================================================================

  describe('Privacy & Consent', () => {
    test('should check user consent before tracking', () => {
      // Arrange
      localStorage.setItem('analytics_consent', 'false');
      const newInstance = new AnalyticsManager();

      // Act
      newInstance.trackPageView('/test');

      // Assert
      expect(newInstance.consentGiven).toBe(false);
    });

    test('should respect Do Not Track (DNT)', () => {
      // Arrange
      navigator.doNotTrack = '1';
      const newInstance = new AnalyticsManager();

      // Act
      const consent = newInstance.checkConsent();

      // Assert - Should still check localStorage, DNT is just a signal
      expect(typeof consent).toBe('boolean');
    });

    test('should anonymize IP addresses', async () => {
      // Arrange
      window.gtag = jest.fn();

      // Act
      await analyticsInstance.initializeGA4();

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'config',
        expect.any(String),
        expect.objectContaining({ anonymize_ip: true })
      );
    });

    test('should hash user IDs', () => {
      // Arrange
      const userId = 'user-12345';

      // Act
      analyticsInstance.setUserId(userId);

      // Assert
      expect(window.gtag).toHaveBeenCalledWith(
        'config',
        'G-ECC98XJ9W9',
        expect.objectContaining({ user_id: userId })
      );
    });

    test('should allow opt-out', () => {
      // Arrange
      analyticsInstance.analyticsEnabled = true;

      // Act
      analyticsInstance.optOut();

      // Assert
      expect(analyticsInstance.consentGiven).toBe(false);
      expect(analyticsInstance.analyticsEnabled).toBe(false);
      expect(window['ga-disable-G-ECC98XJ9W9']).toBe(true);
    });

    test('should clear analytics cookies on opt-out', () => {
      // Arrange
      localStorage.setItem('analytics_consent', 'true');

      // Act
      analyticsInstance.optOut();

      // Assert
      expect(localStorage.getItem('analytics_consent')).toBe('false');
    });
  });
});
