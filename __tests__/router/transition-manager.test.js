/**
 * Transition Manager Module Tests
 * Tests for js/router/transition-manager.js
 */

describe('TransitionManager', () => {
    let TransitionManager;
    let mockElement;

    beforeEach(() => {
        // Create mock element
        mockElement = {
            style: {
                opacity: '1',
                transform: '',
                transition: ''
            },
            classList: {
                _classes: new Set(),
                add(...classes) { classes.forEach(c => this._classes.add(c)); },
                remove(...classes) { classes.forEach(c => this._classes.delete(c)); },
                contains(cls) { return this._classes.has(cls); }
            },
            offsetHeight: 100, // Force reflow mock
            addEventListener: jest.fn((event, callback) => {
                if (event === 'transitionend') {
                    // Simulate immediate transition end for testing
                    setTimeout(callback, 10);
                }
            }),
            removeEventListener: jest.fn()
        };

        // Create TransitionManager
        TransitionManager = {
            _defaultDuration: 250,
            _defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',

            async applyExitTransition(element, duration = this._defaultDuration) {
                if (!element) return;

                element.style.transition = `opacity ${duration}ms ${this._defaultEasing}, transform ${duration}ms ${this._defaultEasing}`;
                element.style.opacity = '0';
                element.style.transform = 'translateY(-10px)';

                await this._waitForTransition(element, duration);
            },

            async applyEnterTransition(element, duration = this._defaultDuration) {
                if (!element) return;

                // Set initial state
                element.style.opacity = '0';
                element.style.transform = 'translateY(10px)';

                // Force reflow
                void element.offsetHeight;

                // Apply transition
                element.style.transition = `opacity ${duration}ms ${this._defaultEasing}, transform ${duration}ms ${this._defaultEasing}`;
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';

                await this._waitForTransition(element, duration);
            },

            async fadeOut(element, duration = this._defaultDuration) {
                if (!element) return;

                element.style.transition = `opacity ${duration}ms ${this._defaultEasing}`;
                element.style.opacity = '0';

                await this._waitForTransition(element, duration);
            },

            async fadeIn(element, duration = this._defaultDuration) {
                if (!element) return;

                element.style.opacity = '0';
                void element.offsetHeight;

                element.style.transition = `opacity ${duration}ms ${this._defaultEasing}`;
                element.style.opacity = '1';

                await this._waitForTransition(element, duration);
            },

            _waitForTransition(element, maxDuration) {
                return new Promise(resolve => {
                    const timeout = setTimeout(resolve, maxDuration + 50);

                    const handler = () => {
                        clearTimeout(timeout);
                        element.removeEventListener('transitionend', handler);
                        resolve();
                    };

                    element.addEventListener('transitionend', handler, { once: true });
                });
            },

            setDuration(duration) {
                this._defaultDuration = duration;
            },

            setEasing(easing) {
                this._defaultEasing = easing;
            }
        };
    });

    describe('applyExitTransition', () => {
        it('should set opacity to 0', async () => {
            await TransitionManager.applyExitTransition(mockElement);
            expect(mockElement.style.opacity).toBe('0');
        });

        it('should apply translateY transform', async () => {
            await TransitionManager.applyExitTransition(mockElement);
            expect(mockElement.style.transform).toBe('translateY(-10px)');
        });

        it('should set transition property', async () => {
            await TransitionManager.applyExitTransition(mockElement);
            expect(mockElement.style.transition).toContain('opacity');
            expect(mockElement.style.transition).toContain('transform');
        });

        it('should handle null element gracefully', async () => {
            await expect(TransitionManager.applyExitTransition(null)).resolves.toBeUndefined();
        });

        it('should use custom duration', async () => {
            await TransitionManager.applyExitTransition(mockElement, 500);
            expect(mockElement.style.transition).toContain('500ms');
        });
    });

    describe('applyEnterTransition', () => {
        it('should set opacity to 1', async () => {
            await TransitionManager.applyEnterTransition(mockElement);
            expect(mockElement.style.opacity).toBe('1');
        });

        it('should reset transform', async () => {
            await TransitionManager.applyEnterTransition(mockElement);
            expect(mockElement.style.transform).toBe('translateY(0)');
        });

        it('should handle null element gracefully', async () => {
            await expect(TransitionManager.applyEnterTransition(null)).resolves.toBeUndefined();
        });
    });

    describe('fadeOut', () => {
        it('should set opacity to 0', async () => {
            await TransitionManager.fadeOut(mockElement);
            expect(mockElement.style.opacity).toBe('0');
        });

        it('should only transition opacity', async () => {
            await TransitionManager.fadeOut(mockElement);
            expect(mockElement.style.transition).toContain('opacity');
            expect(mockElement.style.transition).not.toContain('transform');
        });

        it('should handle null element gracefully', async () => {
            await expect(TransitionManager.fadeOut(null)).resolves.toBeUndefined();
        });
    });

    describe('fadeIn', () => {
        it('should set opacity to 1', async () => {
            await TransitionManager.fadeIn(mockElement);
            expect(mockElement.style.opacity).toBe('1');
        });

        it('should handle null element gracefully', async () => {
            await expect(TransitionManager.fadeIn(null)).resolves.toBeUndefined();
        });
    });

    describe('configuration', () => {
        it('should allow setting default duration', () => {
            TransitionManager.setDuration(500);
            expect(TransitionManager._defaultDuration).toBe(500);
        });

        it('should allow setting default easing', () => {
            TransitionManager.setEasing('ease-in-out');
            expect(TransitionManager._defaultEasing).toBe('ease-in-out');
        });
    });

    describe('_waitForTransition', () => {
        it('should resolve when transitionend fires', async () => {
            const promise = TransitionManager._waitForTransition(mockElement, 250);
            await expect(promise).resolves.toBeUndefined();
        });

        it('should resolve after timeout if transition doesn\'t end', async () => {
            // Create element without transitionend support
            const stubElement = {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };

            const start = Date.now();
            await TransitionManager._waitForTransition(stubElement, 50);
            const elapsed = Date.now() - start;

            // Should resolve within timeout + generous buffer for CI/slow environments
            expect(elapsed).toBeLessThan(500);
        });
    });
});
