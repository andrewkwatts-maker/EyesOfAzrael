/**
 * History Manager Module Tests
 * Tests for js/router/history-manager.js
 */

describe('HistoryManager', () => {
    let HistoryManager;
    let originalHistory;

    beforeEach(() => {
        // Store original history methods
        originalHistory = {
            back: window.history.back,
            forward: window.history.forward,
            go: window.history.go,
            pushState: window.history.pushState,
            replaceState: window.history.replaceState
        };

        // Mock history methods
        window.history.back = jest.fn();
        window.history.forward = jest.fn();
        window.history.go = jest.fn();
        window.history.pushState = jest.fn();
        window.history.replaceState = jest.fn();

        // Create HistoryManager
        HistoryManager = {
            _history: [],
            _maxHistory: 50,
            _currentIndex: -1,

            add(path, metadata = {}) {
                const entry = {
                    path,
                    timestamp: Date.now(),
                    ...metadata
                };
                this._history.push(entry);
                if (this._history.length > this._maxHistory) {
                    this._history = this._history.slice(-this._maxHistory);
                }
                this._currentIndex = this._history.length - 1;
            },

            getAll() { return [...this._history]; },
            getRecent(count = 10) { return this._history.slice(-count); },
            getCurrent() { return this._history[this._currentIndex] || null; },
            getPrevious() {
                return this._currentIndex > 0 ? this._history[this._currentIndex - 1] : null;
            },

            back() { window.history.back(); },
            forward() { window.history.forward(); },
            go(delta) { window.history.go(delta); },

            pushState(path, state = {}, title = '') {
                const fullState = { ...state, timestamp: Date.now() };
                if (!path.startsWith('#')) path = '#' + path;
                window.history.pushState(fullState, title, path);
            },

            replaceState(path, state = {}, title = '') {
                const fullState = { ...state, timestamp: Date.now() };
                window.history.replaceState(fullState, title, path || window.location.hash);
            },

            clear() {
                this._history = [];
                this._currentIndex = -1;
            },

            canGoBack() { return this._history.length > 1 && this._currentIndex > 0; },
            canGoForward() { return this._currentIndex < this._history.length - 1; },
            get length() { return this._history.length; },

            search(pattern) {
                const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
                return this._history.filter(entry => regex.test(entry.path));
            },

            getFrequent(limit = 5) {
                const counts = {};
                for (const entry of this._history) {
                    counts[entry.path] = (counts[entry.path] || 0) + 1;
                }
                return Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, limit)
                    .map(([path, count]) => ({ path, count }));
            }
        };
    });

    afterEach(() => {
        // Restore original history methods
        Object.assign(window.history, originalHistory);
    });

    describe('add', () => {
        it('should add entries to history', () => {
            HistoryManager.add('/home');
            HistoryManager.add('/browse/deities');

            expect(HistoryManager.length).toBe(2);
        });

        it('should include timestamp in entries', () => {
            HistoryManager.add('/test');
            const entry = HistoryManager.getCurrent();

            expect(entry.timestamp).toBeDefined();
            expect(typeof entry.timestamp).toBe('number');
        });

        it('should merge metadata into entry', () => {
            HistoryManager.add('/test', { title: 'Test Page', scrollY: 500 });
            const entry = HistoryManager.getCurrent();

            expect(entry.title).toBe('Test Page');
            expect(entry.scrollY).toBe(500);
        });

        it('should enforce max history limit', () => {
            HistoryManager._maxHistory = 5;

            for (let i = 0; i < 10; i++) {
                HistoryManager.add(`/route${i}`);
            }

            expect(HistoryManager.length).toBe(5);
            // Should keep the most recent entries
            expect(HistoryManager.getAll()[0].path).toBe('/route5');
        });
    });

    describe('getAll', () => {
        it('should return copy of history array', () => {
            HistoryManager.add('/a');
            HistoryManager.add('/b');

            const all1 = HistoryManager.getAll();
            const all2 = HistoryManager.getAll();

            expect(all1).not.toBe(all2);
            expect(all1).toEqual(all2);
        });
    });

    describe('getRecent', () => {
        it('should return last N entries', () => {
            for (let i = 0; i < 10; i++) {
                HistoryManager.add(`/route${i}`);
            }

            const recent = HistoryManager.getRecent(3);

            expect(recent.length).toBe(3);
            expect(recent[0].path).toBe('/route7');
            expect(recent[2].path).toBe('/route9');
        });

        it('should return all entries if fewer than requested', () => {
            HistoryManager.add('/a');
            HistoryManager.add('/b');

            const recent = HistoryManager.getRecent(10);
            expect(recent.length).toBe(2);
        });
    });

    describe('getCurrent', () => {
        it('should return current entry', () => {
            HistoryManager.add('/first');
            HistoryManager.add('/second');

            expect(HistoryManager.getCurrent().path).toBe('/second');
        });

        it('should return null when history is empty', () => {
            expect(HistoryManager.getCurrent()).toBeNull();
        });
    });

    describe('getPrevious', () => {
        it('should return previous entry', () => {
            HistoryManager.add('/first');
            HistoryManager.add('/second');

            expect(HistoryManager.getPrevious().path).toBe('/first');
        });

        it('should return null when at beginning', () => {
            HistoryManager.add('/only');
            expect(HistoryManager.getPrevious()).toBeNull();
        });
    });

    describe('navigation methods', () => {
        it('back() should call window.history.back', () => {
            HistoryManager.back();
            expect(window.history.back).toHaveBeenCalled();
        });

        it('forward() should call window.history.forward', () => {
            HistoryManager.forward();
            expect(window.history.forward).toHaveBeenCalled();
        });

        it('go() should call window.history.go with delta', () => {
            HistoryManager.go(-2);
            expect(window.history.go).toHaveBeenCalledWith(-2);
        });
    });

    describe('pushState', () => {
        it('should prepend # if missing', () => {
            HistoryManager.pushState('/test');
            expect(window.history.pushState).toHaveBeenCalledWith(
                expect.any(Object),
                '',
                '#/test'
            );
        });

        it('should not double # prefix', () => {
            HistoryManager.pushState('#/test');
            expect(window.history.pushState).toHaveBeenCalledWith(
                expect.any(Object),
                '',
                '#/test'
            );
        });

        it('should merge state with timestamp', () => {
            HistoryManager.pushState('/test', { custom: 'data' });
            const call = window.history.pushState.mock.calls[0];
            expect(call[0].custom).toBe('data');
            expect(call[0].timestamp).toBeDefined();
        });
    });

    describe('clear', () => {
        it('should remove all history entries', () => {
            HistoryManager.add('/a');
            HistoryManager.add('/b');
            expect(HistoryManager.length).toBe(2);

            HistoryManager.clear();
            expect(HistoryManager.length).toBe(0);
            expect(HistoryManager.getCurrent()).toBeNull();
        });
    });

    describe('canGoBack/canGoForward', () => {
        it('canGoBack should return false with no history', () => {
            expect(HistoryManager.canGoBack()).toBe(false);
        });

        it('canGoBack should return false with only one entry', () => {
            HistoryManager.add('/only');
            expect(HistoryManager.canGoBack()).toBe(false);
        });

        it('canGoBack should return true with multiple entries', () => {
            HistoryManager.add('/first');
            HistoryManager.add('/second');
            expect(HistoryManager.canGoBack()).toBe(true);
        });
    });

    describe('search', () => {
        it('should find entries matching string pattern', () => {
            HistoryManager.add('/browse/deities');
            HistoryManager.add('/browse/creatures');
            HistoryManager.add('/mythology/greek');

            const results = HistoryManager.search('browse');
            expect(results.length).toBe(2);
        });

        it('should find entries matching regex', () => {
            HistoryManager.add('/mythology/greek/deities/zeus');
            HistoryManager.add('/mythology/norse/deities/odin');
            HistoryManager.add('/browse/creatures');

            const results = HistoryManager.search(/deities/);
            expect(results.length).toBe(2);
        });

        it('should be case insensitive for string patterns', () => {
            HistoryManager.add('/Browse/Deities');
            const results = HistoryManager.search('browse');
            expect(results.length).toBe(1);
        });
    });

    describe('getFrequent', () => {
        it('should return most visited paths', () => {
            HistoryManager.add('/home');
            HistoryManager.add('/home');
            HistoryManager.add('/home');
            HistoryManager.add('/browse');
            HistoryManager.add('/browse');
            HistoryManager.add('/other');

            const frequent = HistoryManager.getFrequent(2);

            expect(frequent.length).toBe(2);
            expect(frequent[0].path).toBe('/home');
            expect(frequent[0].count).toBe(3);
            expect(frequent[1].path).toBe('/browse');
            expect(frequent[1].count).toBe(2);
        });

        it('should handle empty history', () => {
            expect(HistoryManager.getFrequent()).toEqual([]);
        });
    });
});
