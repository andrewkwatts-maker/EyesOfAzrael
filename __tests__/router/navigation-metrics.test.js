/**
 * Navigation Metrics Module Tests
 * Tests for js/router/navigation-metrics.js
 */

describe('NavigationMetrics', () => {
    let NavigationMetrics;

    beforeEach(() => {
        // Reset module state by requiring fresh
        jest.resetModules();

        // Mock performance.now()
        let mockTime = 1000;
        jest.spyOn(performance, 'now').mockImplementation(() => {
            mockTime += 100;
            return mockTime;
        });

        // Mock Date.now()
        jest.spyOn(Date, 'now').mockReturnValue(1704067200000); // 2024-01-01

        // Create a fresh NavigationMetrics object
        NavigationMetrics = {
            _metrics: [],
            _maxMetrics: 100,

            startNavigation(route) {
                return {
                    route,
                    startTime: performance.now(),
                    phases: {}
                };
            },

            recordPhase(metric, phaseName) {
                if (metric && metric.phases) {
                    metric.phases[phaseName] = performance.now() - metric.startTime;
                }
            },

            finishNavigation(metric) {
                if (!metric) return;
                metric.totalTime = performance.now() - metric.startTime;
                metric.timestamp = Date.now();
                this._metrics.push(metric);
                if (this._metrics.length > this._maxMetrics) {
                    this._metrics = this._metrics.slice(-this._maxMetrics);
                }
            },

            getMetrics() {
                return [...this._metrics];
            },

            getAverageTime() {
                if (this._metrics.length === 0) return 0;
                const total = this._metrics.reduce((sum, m) => sum + m.totalTime, 0);
                return total / this._metrics.length;
            },

            clear() {
                this._metrics = [];
            }
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('startNavigation', () => {
        it('should create a metric object with route and startTime', () => {
            const metric = NavigationMetrics.startNavigation('/mythology/greek');

            expect(metric).toBeDefined();
            expect(metric.route).toBe('/mythology/greek');
            expect(metric.startTime).toBeDefined();
            expect(metric.phases).toEqual({});
        });

        it('should create independent metric objects for different navigations', () => {
            const metric1 = NavigationMetrics.startNavigation('/home');
            const metric2 = NavigationMetrics.startNavigation('/browse/deities');

            expect(metric1.route).toBe('/home');
            expect(metric2.route).toBe('/browse/deities');
            expect(metric1).not.toBe(metric2);
        });
    });

    describe('recordPhase', () => {
        it('should record phase timing relative to start', () => {
            const metric = NavigationMetrics.startNavigation('/test');
            NavigationMetrics.recordPhase(metric, 'dataFetch');

            expect(metric.phases.dataFetch).toBeDefined();
            expect(typeof metric.phases.dataFetch).toBe('number');
        });

        it('should handle multiple phases', () => {
            const metric = NavigationMetrics.startNavigation('/test');
            NavigationMetrics.recordPhase(metric, 'init');
            NavigationMetrics.recordPhase(metric, 'dataFetch');
            NavigationMetrics.recordPhase(metric, 'render');

            expect(Object.keys(metric.phases)).toHaveLength(3);
            expect(metric.phases.init).toBeDefined();
            expect(metric.phases.dataFetch).toBeDefined();
            expect(metric.phases.render).toBeDefined();
        });

        it('should handle null metric gracefully', () => {
            expect(() => {
                NavigationMetrics.recordPhase(null, 'test');
            }).not.toThrow();
        });

        it('should handle metric without phases object gracefully', () => {
            expect(() => {
                NavigationMetrics.recordPhase({}, 'test');
            }).not.toThrow();
        });
    });

    describe('finishNavigation', () => {
        it('should calculate total time and store metric', () => {
            const metric = NavigationMetrics.startNavigation('/test');
            NavigationMetrics.finishNavigation(metric);

            expect(metric.totalTime).toBeDefined();
            expect(metric.timestamp).toBe(1704067200000);
            expect(NavigationMetrics.getMetrics()).toHaveLength(1);
        });

        it('should handle null metric gracefully', () => {
            expect(() => {
                NavigationMetrics.finishNavigation(null);
            }).not.toThrow();
        });

        it('should enforce max metrics limit', () => {
            NavigationMetrics._maxMetrics = 5;

            for (let i = 0; i < 10; i++) {
                const metric = NavigationMetrics.startNavigation(`/route${i}`);
                NavigationMetrics.finishNavigation(metric);
            }

            expect(NavigationMetrics.getMetrics().length).toBe(5);
        });
    });

    describe('getMetrics', () => {
        it('should return empty array when no metrics recorded', () => {
            expect(NavigationMetrics.getMetrics()).toEqual([]);
        });

        it('should return copy of metrics array', () => {
            const metric = NavigationMetrics.startNavigation('/test');
            NavigationMetrics.finishNavigation(metric);

            const metrics1 = NavigationMetrics.getMetrics();
            const metrics2 = NavigationMetrics.getMetrics();

            expect(metrics1).not.toBe(metrics2);
            expect(metrics1).toEqual(metrics2);
        });
    });

    describe('getAverageTime', () => {
        it('should return 0 when no metrics recorded', () => {
            expect(NavigationMetrics.getAverageTime()).toBe(0);
        });

        it('should calculate average correctly', () => {
            // Create metrics with known total times
            const metric1 = { totalTime: 100, timestamp: Date.now() };
            const metric2 = { totalTime: 200, timestamp: Date.now() };
            const metric3 = { totalTime: 300, timestamp: Date.now() };

            NavigationMetrics._metrics = [metric1, metric2, metric3];

            expect(NavigationMetrics.getAverageTime()).toBe(200);
        });
    });

    describe('clear', () => {
        it('should clear all recorded metrics', () => {
            const metric = NavigationMetrics.startNavigation('/test');
            NavigationMetrics.finishNavigation(metric);
            expect(NavigationMetrics.getMetrics().length).toBe(1);

            NavigationMetrics.clear();
            expect(NavigationMetrics.getMetrics()).toEqual([]);
        });
    });
});
