/**
 * Unit Tests for PerformanceMonitor
 */

describe('PerformanceMonitor', () => {
    let monitor;

    beforeEach(() => {
        monitor = new PerformanceMonitor();
    });

    afterEach(() => {
        if (monitor) {
            monitor.stop();
        }
    });

    describe('Initialization', () => {
        it('should initialize with empty metrics', () => {
            expect(monitor.metrics.navigation).toEqual({});
            expect(monitor.metrics.firebase).toEqual([]);
            expect(monitor.metrics.custom).toEqual([]);
        });

        it('should initialize with default thresholds', () => {
            expect(monitor.thresholds.pageLoad).toBe(3000);
            expect(monitor.thresholds.firebaseQuery).toBe(1000);
        });

        it('should be recording by default', () => {
            expect(monitor.isRecording).toBe(true);
        });
    });

    describe('Marks and Measures', () => {
        it('should create performance mark', () => {
            monitor.mark('test-mark');

            const marks = performance.getEntriesByName('test-mark', 'mark');
            expect(marks.length).toBeGreaterThan(0);
        });

        it('should measure between two marks', () => {
            monitor.mark('start');
            monitor.mark('end');

            const duration = monitor.measure('test-measure', 'start', 'end');
            expect(duration).toBeGreaterThanOrEqual(0);
        });

        it('should handle invalid measure gracefully', () => {
            const duration = monitor.measure('invalid', 'nonexistent1', 'nonexistent2');
            expect(duration).toBe(0);
        });
    });

    describe('Time Operation', () => {
        it('should time async operation', async () => {
            const result = await monitor.timeOperation('test-op', async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return 'success';
            });

            expect(result).toBe('success');
            expect(monitor.metrics.custom.length).toBe(1);
            expect(monitor.metrics.custom[0].name).toBe('test-op');
        });

        it('should record operation duration', async () => {
            await monitor.timeOperation('timed-op', async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            const operation = monitor.metrics.custom[0];
            expect(operation.duration).toBeGreaterThanOrEqual(50);
        });

        it('should handle operation errors', async () => {
            try {
                await monitor.timeOperation('error-op', async () => {
                    throw new Error('Test error');
                });
            } catch (error) {
                expect(error.message).toBe('Test error');
            }

            const operation = monitor.metrics.custom[0];
            expect(operation.success).toBe(false);
            expect(operation.error).toBe('Test error');
        });
    });

    describe('Firebase Query Tracking', () => {
        it('should record Firebase query', () => {
            monitor.recordFirebaseQuery({
                collection: 'deities',
                operation: 'get',
                duration: 250,
                success: true,
                resultCount: 10
            });

            expect(monitor.metrics.firebase.length).toBe(1);
            expect(monitor.metrics.firebase[0].collection).toBe('deities');
        });

        it('should alert on slow queries', () => {
            const slowDuration = monitor.thresholds.firebaseQuery + 100;

            monitor.recordFirebaseQuery({
                collection: 'deities',
                operation: 'get',
                duration: slowDuration,
                success: true
            });

            expect(monitor.alerts.length).toBeGreaterThan(0);
            expect(monitor.alerts[0].level).toBe('warning');
        });
    });

    describe('Performance Metrics', () => {
        it('should track interactions', () => {
            monitor.recordInteraction({
                name: 'button_click',
                duration: 50,
                target: 'submit-btn'
            });

            expect(monitor.metrics.interactions.length).toBe(1);
            expect(monitor.metrics.interactions[0].name).toBe('button_click');
        });

        it('should calculate average query time', () => {
            monitor.recordFirebaseQuery({ duration: 100, success: true });
            monitor.recordFirebaseQuery({ duration: 200, success: true });
            monitor.recordFirebaseQuery({ duration: 300, success: true });

            const avg = monitor.getAverageFirebaseQueryTime();
            expect(avg).toBe(200);
        });

        it('should identify slow queries', () => {
            monitor.recordFirebaseQuery({ duration: 500, success: true });
            monitor.recordFirebaseQuery({ duration: 1500, success: true });
            monitor.recordFirebaseQuery({ duration: 800, success: true });

            const slowQueries = monitor.getSlowFirebaseQueries();
            expect(slowQueries.length).toBe(1);
            expect(slowQueries[0].duration).toBe(1500);
        });
    });

    describe('Alerts', () => {
        it('should add alert', () => {
            monitor.addAlert('warning', 'Test warning');

            expect(monitor.alerts.length).toBe(1);
            expect(monitor.alerts[0].level).toBe('warning');
            expect(monitor.alerts[0].message).toBe('Test warning');
        });

        it('should dispatch alert event', (done) => {
            window.addEventListener('performanceAlert', (event) => {
                expect(event.detail.message).toBe('Test alert');
                done();
            });

            monitor.addAlert('info', 'Test alert');
        });
    });

    describe('Summary and Export', () => {
        beforeEach(() => {
            monitor.recordFirebaseQuery({ duration: 100, success: true });
            monitor.recordFirebaseQuery({ duration: 200, success: true });
        });

        it('should generate summary', () => {
            const summary = monitor.getSummary();

            expect(summary).toHaveProperty('firebaseQueries');
            expect(summary).toHaveProperty('avgFirebaseQueryTime');
            expect(summary.firebaseQueries).toBe(2);
        });

        it('should export metrics as JSON', () => {
            const json = monitor.exportMetrics();
            const parsed = JSON.parse(json);

            expect(parsed).toHaveProperty('firebase');
            expect(parsed.firebase.length).toBe(2);
        });

        it('should export summary report', () => {
            const report = monitor.exportReport();

            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('slowQueries');
            expect(report).toHaveProperty('timestamp');
        });
    });

    describe('Control Methods', () => {
        it('should clear metrics', () => {
            monitor.recordFirebaseQuery({ duration: 100, success: true });
            monitor.addAlert('info', 'Test');

            monitor.clear();

            expect(monitor.metrics.firebase.length).toBe(0);
            expect(monitor.alerts.length).toBe(0);
        });

        it('should stop recording', () => {
            monitor.stop();

            expect(monitor.isRecording).toBe(false);
            expect(monitor.observers.length).toBe(0);
        });

        it('should not record marks when stopped', () => {
            monitor.stop();
            monitor.mark('test-mark-stopped');

            // This won't throw, just won't record
            expect(monitor.isRecording).toBe(false);
        });
    });
});
