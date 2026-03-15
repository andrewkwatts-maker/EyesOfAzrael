/**
 * Offline Event Logger Tests
 * Tests for js/offline-event-logger.js
 */

describe('OfflineEventLogger', () => {
    let logger;

    beforeEach(() => {
        // Reset module state
        jest.resetModules();

        // Mock window.addEventListener to prevent side effects
        window.addEventListener = jest.fn();

        // Require the actual module
        logger = require('../../js/offline-event-logger.js');

        // Reset for clean state
        logger._events = [];
        logger._counter = 0;
        logger._initialized = false;
        logger._initTime = Date.now();
        logger._persistTimer = null;
        logger._stats = {
            stateChanges: 0,
            cacheHits: 0,
            cacheMisses: 0,
            staleFallbacks: 0,
            queuedOps: 0,
            syncedOps: 0,
            swDecisions: 0
        };
    });

    afterEach(() => {
        if (logger._persistTimer) {
            clearTimeout(logger._persistTimer);
            logger._persistTimer = null;
        }
    });

    describe('init()', () => {
        test('should initialize only once', () => {
            logger.init();
            expect(logger._initialized).toBe(true);
            logger._counter = 999;
            logger.init(); // second call should be no-op
            expect(logger._counter).toBe(999);
        });

        test('should restore events from sessionStorage', () => {
            const storedEvents = [
                { id: 0, type: 'STATE_CHANGE', source: 'test' },
                { id: 1, type: 'CACHE_DECISION', source: 'test' }
            ];
            sessionStorage.setItem('eoa_offline_log', JSON.stringify(storedEvents));
            logger.init();
            expect(logger._events).toHaveLength(2);
            expect(logger._counter).toBe(2);
        });

        test('should handle corrupt sessionStorage data', () => {
            sessionStorage.setItem('eoa_offline_log', 'not-valid-json{{{');
            logger.init();
            expect(logger._events).toHaveLength(0);
            expect(logger._initialized).toBe(true);
        });

        test('should handle non-array stored data', () => {
            sessionStorage.setItem('eoa_offline_log', JSON.stringify({ notAnArray: true }));
            logger.init();
            expect(logger._events).toHaveLength(0);
        });
    });

    describe('log()', () => {
        test('should add event with correct structure', () => {
            logger.log('STATE_CHANGE', {
                source: 'Browser',
                action: 'online',
                decision: 'state-transition',
                reason: 'navigator changed',
                outcome: 'online'
            });

            expect(logger._events).toHaveLength(1);
            const event = logger._events[0];
            expect(event.id).toBe(0);
            expect(event.type).toBe('STATE_CHANGE');
            expect(event.source).toBe('Browser');
            expect(event.action).toBe('online');
            expect(event.decision).toBe('state-transition');
            expect(event.reason).toBe('navigator changed');
            expect(event.outcome).toBe('online');
            expect(event.timestamp).toBeDefined();
            expect(event.elapsed).toBeDefined();
        });

        test('should use defaults for missing fields', () => {
            logger.log('TEST', {});
            const event = logger._events[0];
            expect(event.source).toBe('unknown');
            expect(event.action).toBe('');
            expect(event.decision).toBe('');
            expect(event.reason).toBe('');
            expect(event.outcome).toBe('');
            expect(event.metadata).toBeNull();
        });

        test('should increment counter', () => {
            logger.log('A', { source: 'test' });
            logger.log('B', { source: 'test' });
            logger.log('C', { source: 'test' });
            expect(logger._counter).toBe(3);
            expect(logger._events[2].id).toBe(2);
        });

        test('should enforce ring buffer max', () => {
            logger.MAX_EVENTS = 5;
            for (let i = 0; i < 8; i++) {
                logger.log('TEST', { source: `event-${i}` });
            }
            expect(logger._events).toHaveLength(5);
            expect(logger._events[0].source).toBe('event-3');
            logger.MAX_EVENTS = 200; // restore
        });

        test('should include metadata when provided', () => {
            logger.log('TEST', { source: 'test', metadata: { key: 'value' } });
            expect(logger._events[0].metadata).toEqual({ key: 'value' });
        });
    });

    describe('_updateStats()', () => {
        test('should track STATE_CHANGE', () => {
            logger.log('STATE_CHANGE', { source: 'Browser', action: 'online' });
            expect(logger._stats.stateChanges).toBe(1);
        });

        test('should track cache hits', () => {
            logger.log('CACHE_DECISION', { source: 'CM', decision: 'memory-hit' });
            expect(logger._stats.cacheHits).toBe(1);
        });

        test('should track cache misses', () => {
            logger.log('CACHE_DECISION', { source: 'CM', decision: 'cache-miss' });
            expect(logger._stats.cacheMisses).toBe(1);
        });

        test('should track stale fallbacks', () => {
            logger.log('CACHE_DECISION', { source: 'CM', decision: 'serve-stale' });
            expect(logger._stats.staleFallbacks).toBe(1);
        });

        test('should track queue operations', () => {
            logger.log('QUEUE_OP', { source: 'CRUD', action: 'enqueue' });
            expect(logger._stats.queuedOps).toBe(1);
        });

        test('should not count non-enqueue queue ops', () => {
            logger.log('QUEUE_OP', { source: 'CRUD', action: 'dequeue' });
            expect(logger._stats.queuedOps).toBe(0);
        });

        test('should track sync success', () => {
            logger.log('SYNC', { source: 'SW', outcome: 'success' });
            expect(logger._stats.syncedOps).toBe(1);
        });

        test('should not count failed syncs', () => {
            logger.log('SYNC', { source: 'SW', outcome: 'fail' });
            expect(logger._stats.syncedOps).toBe(0);
        });

        test('should track SW_STRATEGY', () => {
            logger.log('SW_STRATEGY', { source: 'ServiceWorker', decision: 'cache-first' });
            expect(logger._stats.swDecisions).toBe(1);
        });

        test('should handle null decision gracefully', () => {
            logger.log('CACHE_DECISION', { source: 'CM', decision: null });
            // Should not increment any cache stat
            expect(logger._stats.cacheHits).toBe(0);
            expect(logger._stats.cacheMisses).toBe(0);
        });
    });

    describe('getEvents()', () => {
        beforeEach(() => {
            logger.log('STATE_CHANGE', { source: 'Browser' });
            logger.log('CACHE_DECISION', { source: 'CM' });
            logger.log('STATE_CHANGE', { source: 'Browser' });
        });

        test('should return all events when no filter', () => {
            const events = logger.getEvents();
            expect(events).toHaveLength(3);
        });

        test('should filter by type', () => {
            const events = logger.getEvents('STATE_CHANGE');
            expect(events).toHaveLength(2);
        });

        test('should return a copy', () => {
            const events = logger.getEvents();
            events.push({ fake: true });
            expect(logger._events).toHaveLength(3);
        });

        test('should return empty array for unmatched filter', () => {
            expect(logger.getEvents('NONEXISTENT')).toHaveLength(0);
        });
    });

    describe('getStats()', () => {
        test('should return stats with totalEvents and currentState', () => {
            logger.log('STATE_CHANGE', { source: 'test' });
            const stats = logger.getStats();
            expect(stats.totalEvents).toBe(1);
            expect(stats.stateChanges).toBe(1);
            expect(stats.currentState).toBeDefined();
            expect(stats.uptimeMs).toBeDefined();
        });
    });

    describe('getRecent()', () => {
        test('should return last N events', () => {
            for (let i = 0; i < 30; i++) {
                logger.log('TEST', { source: `event-${i}` });
            }
            const recent = logger.getRecent(5);
            expect(recent).toHaveLength(5);
            expect(recent[0].source).toBe('event-25');
        });

        test('should default to 20', () => {
            for (let i = 0; i < 30; i++) {
                logger.log('TEST', { source: `event-${i}` });
            }
            const recent = logger.getRecent();
            expect(recent).toHaveLength(20);
        });
    });

    describe('clear()', () => {
        test('should reset all state', () => {
            logger.log('STATE_CHANGE', { source: 'test' });
            logger.log('CACHE_DECISION', { source: 'CM', decision: 'hit' });
            logger.clear();
            expect(logger._events).toHaveLength(0);
            expect(logger._counter).toBe(0);
            expect(logger._stats.stateChanges).toBe(0);
            expect(logger._stats.cacheHits).toBe(0);
        });

        test('should remove from sessionStorage', () => {
            sessionStorage.setItem('eoa_offline_log', 'data');
            logger.clear();
            expect(sessionStorage.getItem('eoa_offline_log')).toBeNull();
        });
    });

    describe('exportJSON()', () => {
        test('should return valid JSON string', () => {
            logger.log('TEST', { source: 'export-test', decision: 'test' });
            const json = logger.exportJSON();
            const parsed = JSON.parse(json);
            expect(parsed.stats).toBeDefined();
            expect(parsed.events).toHaveLength(1);
            expect(parsed.stats.totalEvents).toBe(1);
        });
    });

    describe('_schedulePersist()', () => {
        test('should debounce persistence', () => {
            jest.useFakeTimers();
            logger.log('TEST', { source: 'a' });
            logger.log('TEST', { source: 'b' });
            expect(logger._persistTimer).not.toBeNull();
            jest.advanceTimersByTime(5000);
            expect(sessionStorage.getItem('eoa_offline_log')).not.toBeNull();
            jest.useRealTimers();
        });

        test('should persist only MAX_PERSISTED events', () => {
            jest.useFakeTimers();
            const origMax = logger.MAX_PERSISTED;
            logger.MAX_PERSISTED = 3;
            for (let i = 0; i < 10; i++) {
                logger.log('TEST', { source: `event-${i}` });
            }
            jest.advanceTimersByTime(5000);
            const persisted = JSON.parse(sessionStorage.getItem('eoa_offline_log'));
            expect(persisted).toHaveLength(3);
            logger.MAX_PERSISTED = origMax;
            jest.useRealTimers();
        });
    });
});
