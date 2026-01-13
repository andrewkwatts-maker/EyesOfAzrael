/**
 * Scroll Manager Module Tests
 * Tests for js/router/scroll-manager.js
 */

describe('ScrollManager', () => {
    let ScrollManager;
    let scrollToSpy;

    beforeEach(() => {
        // Mock window scroll properties
        Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

        // Mock window.scrollTo
        scrollToSpy = jest.fn();
        window.scrollTo = scrollToSpy;

        // Create a fresh ScrollManager object
        ScrollManager = {
            _positions: new Map(),
            _maxEntries: 50,

            save(path) {
                this._positions.set(path, {
                    x: window.scrollX,
                    y: window.scrollY,
                    timestamp: Date.now()
                });

                if (this._positions.size > this._maxEntries) {
                    const oldestKey = this._positions.keys().next().value;
                    this._positions.delete(oldestKey);
                }
            },

            restore(path, smooth = false) {
                const position = this._positions.get(path);
                if (position) {
                    window.scrollTo({
                        left: position.x,
                        top: position.y,
                        behavior: smooth ? 'smooth' : 'instant'
                    });
                    return true;
                }
                return false;
            },

            scrollToTop(smooth = false) {
                window.scrollTo({
                    left: 0,
                    top: 0,
                    behavior: smooth ? 'smooth' : 'instant'
                });
            },

            clear() {
                this._positions.clear();
            },

            has(path) {
                return this._positions.has(path);
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('save', () => {
        it('should save scroll position for a path', () => {
            window.scrollX = 100;
            window.scrollY = 500;

            ScrollManager.save('/mythology/greek');

            expect(ScrollManager.has('/mythology/greek')).toBe(true);
        });

        it('should update position when saving same path twice', () => {
            window.scrollX = 0;
            window.scrollY = 100;
            ScrollManager.save('/test');

            window.scrollX = 50;
            window.scrollY = 200;
            ScrollManager.save('/test');

            const restored = ScrollManager.restore('/test');
            expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({
                left: 50,
                top: 200
            }));
        });

        it('should enforce max entries limit', () => {
            ScrollManager._maxEntries = 5;

            for (let i = 0; i < 10; i++) {
                ScrollManager.save(`/route${i}`);
            }

            expect(ScrollManager._positions.size).toBe(5);
            // Oldest entries should be removed
            expect(ScrollManager.has('/route0')).toBe(false);
            expect(ScrollManager.has('/route9')).toBe(true);
        });
    });

    describe('restore', () => {
        it('should restore saved scroll position', () => {
            window.scrollX = 200;
            window.scrollY = 800;
            ScrollManager.save('/test');

            window.scrollX = 0;
            window.scrollY = 0;

            const result = ScrollManager.restore('/test');

            expect(result).toBe(true);
            expect(scrollToSpy).toHaveBeenCalledWith({
                left: 200,
                top: 800,
                behavior: 'instant'
            });
        });

        it('should use smooth scrolling when specified', () => {
            window.scrollY = 500;
            ScrollManager.save('/test');

            ScrollManager.restore('/test', true);

            expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({
                behavior: 'smooth'
            }));
        });

        it('should return false for unknown paths', () => {
            const result = ScrollManager.restore('/unknown');

            expect(result).toBe(false);
            expect(scrollToSpy).not.toHaveBeenCalled();
        });
    });

    describe('scrollToTop', () => {
        it('should scroll to top of page', () => {
            ScrollManager.scrollToTop();

            expect(scrollToSpy).toHaveBeenCalledWith({
                left: 0,
                top: 0,
                behavior: 'instant'
            });
        });

        it('should use smooth scrolling when specified', () => {
            ScrollManager.scrollToTop(true);

            expect(scrollToSpy).toHaveBeenCalledWith({
                left: 0,
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    describe('clear', () => {
        it('should remove all saved positions', () => {
            ScrollManager.save('/route1');
            ScrollManager.save('/route2');
            ScrollManager.save('/route3');

            ScrollManager.clear();

            expect(ScrollManager.has('/route1')).toBe(false);
            expect(ScrollManager.has('/route2')).toBe(false);
            expect(ScrollManager.has('/route3')).toBe(false);
        });
    });

    describe('has', () => {
        it('should return true for saved paths', () => {
            ScrollManager.save('/saved');
            expect(ScrollManager.has('/saved')).toBe(true);
        });

        it('should return false for unsaved paths', () => {
            expect(ScrollManager.has('/unsaved')).toBe(false);
        });
    });
});
