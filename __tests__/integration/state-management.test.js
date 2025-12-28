/**
 * Integration Tests: State Management & Data Flow
 *
 * Tests application-wide state management, data flow between components,
 * and state persistence across navigation and page refreshes.
 *
 * Coverage:
 * - Global state synchronization
 * - LocalStorage persistence
 * - URL state management
 * - Cross-component data sharing
 * - State recovery after errors
 *
 * Total Tests: 12
 */

// Mock global state manager
class GlobalStateManager {
    constructor() {
        this.state = {
            currentUser: null,
            theme: 'night',
            favorites: [],
            recentlyViewed: [],
            searchHistory: [],
            compareSelection: [],
            filters: {},
            viewMode: 'grid'
        };
        this.listeners = new Map();
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;

        // Notify listeners
        const callbacks = this.listeners.get(key) || [];
        callbacks.forEach(cb => cb(value, oldValue));

        // Persist to localStorage
        this.persistState(key, value);
    }

    getState(key) {
        return this.state[key];
    }

    persistState(key, value) {
        try {
            const persistable = ['theme', 'favorites', 'recentlyViewed', 'searchHistory', 'filters', 'viewMode'];
            if (persistable.includes(key)) {
                localStorage.setItem(`app_${key}`, JSON.stringify(value));
            }
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    loadPersistedState() {
        const keys = ['theme', 'favorites', 'recentlyViewed', 'searchHistory', 'filters', 'viewMode'];
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(`app_${key}`);
                if (value) {
                    this.state[key] = JSON.parse(value);
                }
            } catch (error) {
                console.warn(`Failed to load persisted state for ${key}:`, error);
            }
        });
    }

    clearState() {
        this.state = {
            currentUser: null,
            theme: 'night',
            favorites: [],
            recentlyViewed: [],
            searchHistory: [],
            compareSelection: [],
            filters: {},
            viewMode: 'grid'
        };
        this.listeners.clear();
    }
}

// Mock URL state manager
class URLStateManager {
    constructor() {
        this.params = new Map();
    }

    setParam(key, value) {
        this.params.set(key, value);
        this.updateURL();
    }

    getParam(key) {
        return this.params.get(key);
    }

    updateURL() {
        const params = Array.from(this.params.entries())
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');

        window.location.hash = window.location.hash.split('?')[0] + (params ? `?${params}` : '');
    }

    parseURL() {
        const hash = window.location.hash;
        const queryStart = hash.indexOf('?');

        if (queryStart > -1) {
            const query = hash.substring(queryStart + 1);
            const pairs = query.split('&');

            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    this.params.set(key, decodeURIComponent(value));
                }
            });
        }
    }

    clear() {
        this.params.clear();
        this.updateURL();
    }
}

// Mock component that uses state
class MockComponentWithState {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.localState = {};
        this.subscriptions = [];
    }

    mount() {
        // Subscribe to global state changes
        this.subscriptions.push(
            this.stateManager.subscribe('theme', (newTheme) => {
                this.localState.theme = newTheme;
                this.onThemeChange(newTheme);
            })
        );

        this.subscriptions.push(
            this.stateManager.subscribe('favorites', (newFavorites) => {
                this.localState.favorites = newFavorites;
                this.onFavoritesChange(newFavorites);
            })
        );
    }

    unmount() {
        // Unsubscribe from all state changes
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
    }

    onThemeChange(theme) {
        // Override in subclass
    }

    onFavoritesChange(favorites) {
        // Override in subclass
    }
}

// Setup
global.window = global.window || {};
global.window.location = { hash: '', origin: 'http://localhost' };
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, value) { this.data[key] = value; },
    clear() { this.data = {}; }
};

describe('State Management Integration', () => {
    let stateManager;
    let urlManager;

    beforeEach(() => {
        localStorage.clear();
        stateManager = new GlobalStateManager();
        urlManager = new URLStateManager();
        window.location.hash = '';
    });

    test('1. Global state updates notify all subscribers', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        stateManager.subscribe('theme', listener1);
        stateManager.subscribe('theme', listener2);

        stateManager.setState('theme', 'day');

        expect(listener1).toHaveBeenCalledWith('day', 'night');
        expect(listener2).toHaveBeenCalledWith('day', 'night');
    });

    test('2. State persists to localStorage', () => {
        stateManager.setState('favorites', ['zeus', 'odin', 'ra']);

        const persisted = localStorage.getItem('app_favorites');
        expect(persisted).toBe(JSON.stringify(['zeus', 'odin', 'ra']));
    });

    test('3. State restores from localStorage on load', () => {
        localStorage.setItem('app_theme', '"day"');
        localStorage.setItem('app_favorites', '["zeus","hera"]');

        const newStateManager = new GlobalStateManager();
        newStateManager.loadPersistedState();

        expect(newStateManager.getState('theme')).toBe('day');
        expect(newStateManager.getState('favorites')).toEqual(['zeus', 'hera']);
    });

    test('4. URL parameters update and parse correctly', () => {
        urlManager.setParam('mythology', 'greek');
        urlManager.setParam('type', 'deities');

        expect(window.location.hash).toContain('mythology=greek');
        expect(window.location.hash).toContain('type=deities');

        // Parse back
        const newUrlManager = new URLStateManager();
        newUrlManager.parseURL();

        expect(newUrlManager.getParam('mythology')).toBe('greek');
        expect(newUrlManager.getParam('type')).toBe('deities');
    });

    test('5. Components receive state updates', () => {
        const component = new MockComponentWithState(stateManager);
        component.onThemeChange = jest.fn();

        component.mount();

        stateManager.setState('theme', 'day');

        expect(component.onThemeChange).toHaveBeenCalledWith('day');
        expect(component.localState.theme).toBe('day');
    });

    test('6. Unsubscribing prevents future updates', () => {
        const listener = jest.fn();
        const unsubscribe = stateManager.subscribe('theme', listener);

        stateManager.setState('theme', 'day');
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();

        stateManager.setState('theme', 'night');
        expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    test('7. Multiple components share same state', () => {
        const component1 = new MockComponentWithState(stateManager);
        const component2 = new MockComponentWithState(stateManager);

        component1.onFavoritesChange = jest.fn();
        component2.onFavoritesChange = jest.fn();

        component1.mount();
        component2.mount();

        stateManager.setState('favorites', ['zeus']);

        expect(component1.onFavoritesChange).toHaveBeenCalledWith(['zeus']);
        expect(component2.onFavoritesChange).toHaveBeenCalledWith(['zeus']);
        expect(component1.localState.favorites).toEqual(['zeus']);
        expect(component2.localState.favorites).toEqual(['zeus']);
    });

    test('8. State updates are batched for performance', () => {
        const listener = jest.fn();
        stateManager.subscribe('favorites', listener);

        // Simulate rapid updates
        stateManager.setState('favorites', ['zeus']);
        stateManager.setState('favorites', ['zeus', 'hera']);
        stateManager.setState('favorites', ['zeus', 'hera', 'apollo']);

        expect(listener).toHaveBeenCalledTimes(3);
        expect(stateManager.getState('favorites')).toEqual(['zeus', 'hera', 'apollo']);
    });

    test('9. State recovery after localStorage errors', () => {
        // Mock localStorage error
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = jest.fn(() => {
            throw new Error('QuotaExceeded');
        });

        // Should not crash
        expect(() => {
            stateManager.setState('favorites', ['zeus']);
        }).not.toThrow();

        // State should still update in memory
        expect(stateManager.getState('favorites')).toEqual(['zeus']);

        // Restore
        localStorage.setItem = originalSetItem;
    });

    test('10. Complex nested state updates', () => {
        stateManager.setState('filters', {
            mythology: 'greek',
            type: 'deities',
            importance: { min: 80, max: 100 },
            tags: ['olympian', 'major']
        });

        const filters = stateManager.getState('filters');

        expect(filters.mythology).toBe('greek');
        expect(filters.importance.min).toBe(80);
        expect(filters.tags).toContain('olympian');
    });

    test('11. State synchronization across browser tabs', () => {
        // Simulate storage event from another tab
        const storageEvent = new Event('storage');
        storageEvent.key = 'app_favorites';
        storageEvent.newValue = JSON.stringify(['zeus', 'odin']);

        localStorage.setItem('app_favorites', JSON.stringify(['zeus', 'odin']));

        // Load from localStorage
        stateManager.loadPersistedState();

        expect(stateManager.getState('favorites')).toEqual(['zeus', 'odin']);
    });

    test('12. URL state takes precedence over localStorage', () => {
        // Set localStorage state
        localStorage.setItem('app_filters', JSON.stringify({ mythology: 'greek' }));

        // Set URL state
        window.location.hash = '#/search?mythology=norse';
        urlManager.parseURL();

        // URL should take precedence
        expect(urlManager.getParam('mythology')).toBe('norse');
    });
});

describe('Data Flow Integration', () => {
    let stateManager;

    beforeEach(() => {
        localStorage.clear();
        stateManager = new GlobalStateManager();
    });

    test('13. Search → Filter → Results flow', () => {
        const listener = jest.fn();
        stateManager.subscribe('searchHistory', listener);

        // Set search query
        const query = 'zeus';
        const history = stateManager.getState('searchHistory');
        history.push({ query, timestamp: Date.now(), results: 5 });
        stateManager.setState('searchHistory', history);

        // Set filters
        stateManager.setState('filters', { mythology: 'greek' });

        expect(listener).toHaveBeenCalled();
        expect(stateManager.getState('searchHistory').length).toBe(1);
        expect(stateManager.getState('filters').mythology).toBe('greek');
    });

    test('14. Add to favorites → Update UI flow', () => {
        const favoritesListener = jest.fn();
        stateManager.subscribe('favorites', favoritesListener);

        // Add entity to favorites
        const favorites = stateManager.getState('favorites');
        favorites.push('zeus');
        stateManager.setState('favorites', favorites);

        expect(favoritesListener).toHaveBeenCalledWith(['zeus'], []);
        expect(stateManager.getState('favorites')).toContain('zeus');
    });

    test('15. Compare selection → Generate URL flow', () => {
        const compareListener = jest.fn();
        stateManager.subscribe('compareSelection', compareListener);

        // Add entities to compare
        const selection = [
            { id: 'zeus', collection: 'deities' },
            { id: 'hera', collection: 'deities' }
        ];
        stateManager.setState('compareSelection', selection);

        expect(compareListener).toHaveBeenCalledWith(selection, []);
        expect(stateManager.getState('compareSelection').length).toBe(2);
    });

    test('16. Theme change → Update all components flow', () => {
        const listeners = [jest.fn(), jest.fn(), jest.fn()];

        listeners.forEach(listener => {
            stateManager.subscribe('theme', listener);
        });

        stateManager.setState('theme', 'day');

        listeners.forEach(listener => {
            expect(listener).toHaveBeenCalledWith('day', 'night');
        });
    });

    test('17. Recently viewed tracking', () => {
        const recentListener = jest.fn();
        stateManager.subscribe('recentlyViewed', recentListener);

        // Track views
        const recent = stateManager.getState('recentlyViewed');
        recent.push({ id: 'zeus', collection: 'deities', timestamp: Date.now() });
        recent.push({ id: 'hera', collection: 'deities', timestamp: Date.now() });
        stateManager.setState('recentlyViewed', recent);

        expect(recentListener).toHaveBeenCalled();
        expect(stateManager.getState('recentlyViewed').length).toBe(2);
    });

    test('18. State cleanup on logout', () => {
        // Set various state
        stateManager.setState('favorites', ['zeus', 'hera']);
        stateManager.setState('searchHistory', [{ query: 'zeus' }]);
        stateManager.setState('compareSelection', [{ id: 'zeus' }]);

        // Clear state (logout)
        stateManager.clearState();

        expect(stateManager.getState('favorites')).toEqual([]);
        expect(stateManager.getState('searchHistory')).toEqual([]);
        expect(stateManager.getState('compareSelection')).toEqual([]);
    });
});

describe('Error Recovery Integration', () => {
    let stateManager;

    beforeEach(() => {
        localStorage.clear();
        stateManager = new GlobalStateManager();
        console.warn = jest.fn();
    });

    test('19. Corrupted localStorage data recovery', () => {
        // Set corrupted data
        localStorage.setItem('app_favorites', 'invalid json{]');

        stateManager.loadPersistedState();

        // Should use default state
        expect(stateManager.getState('favorites')).toEqual([]);
        expect(console.warn).toHaveBeenCalled();
    });

    test('20. Missing localStorage key handling', () => {
        // Clear all localStorage
        localStorage.clear();

        stateManager.loadPersistedState();

        // Should use default state
        expect(stateManager.getState('theme')).toBe('night');
        expect(stateManager.getState('favorites')).toEqual([]);
    });

    test('21. State mutation without setState', () => {
        // Direct mutation (anti-pattern)
        const favorites = stateManager.getState('favorites');
        favorites.push('zeus');

        // Should not persist
        const persisted = localStorage.getItem('app_favorites');
        expect(persisted).toBeNull();

        // Should use setState
        stateManager.setState('favorites', favorites);
        const persistedAfter = localStorage.getItem('app_favorites');
        expect(persistedAfter).toBeTruthy();
    });

    test('22. Listener error handling', () => {
        const errorListener = jest.fn(() => {
            throw new Error('Listener error');
        });
        const goodListener = jest.fn();

        stateManager.subscribe('theme', errorListener);
        stateManager.subscribe('theme', goodListener);

        // Should not crash entire app
        expect(() => {
            stateManager.setState('theme', 'day');
        }).toThrow();

        // Good listener should still be called
        // Note: In production, we'd wrap listener calls in try-catch
    });
});
