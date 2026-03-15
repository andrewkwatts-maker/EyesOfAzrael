/**
 * Offline Event Logger
 * Structured logging for all offline-related decisions across the app.
 *
 * Tracks: state changes, cache decisions, queue operations, SW strategies, sync events.
 * Integrates with DiagnosticCollector as the 'offline' subsystem.
 *
 * Usage:
 *   window.offlineLog.log('CACHE_DECISION', {
 *       source: 'CacheManager',
 *       action: 'get',
 *       input: { collection: 'deities', id: 'zeus', online: true },
 *       decision: 'memory-hit',
 *       reason: 'found in memory cache',
 *       outcome: 'success'
 *   });
 *
 * @module offline-event-logger
 */

const OfflineEventLogger = {
    /** @type {Array<Object>} Ring buffer of events */
    _events: [],

    /** @type {number} Max events in ring buffer */
    MAX_EVENTS: 200,

    /** @type {number} Max events persisted to sessionStorage */
    MAX_PERSISTED: 50,

    /** @type {number} Monotonic counter */
    _counter: 0,

    /** @type {number} Init timestamp for elapsed calculation */
    _initTime: Date.now(),

    /** @type {boolean} Whether initialized */
    _initialized: false,

    /** @type {number|null} Debounce timer for sessionStorage persistence */
    _persistTimer: null,

    /** @type {Object} Running statistics */
    _stats: {
        stateChanges: 0,
        cacheHits: 0,
        cacheMisses: 0,
        staleFallbacks: 0,
        queuedOps: 0,
        syncedOps: 0,
        swDecisions: 0
    },

    /**
     * Initialize the logger
     */
    init() {
        if (this._initialized) return;
        this._initialized = true;

        // Restore persisted events from sessionStorage
        try {
            const stored = sessionStorage.getItem('eoa_offline_log');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this._events = parsed;
                    this._counter = parsed.length;
                }
            }
        } catch (e) {
            // sessionStorage unavailable or corrupt — start fresh
        }

        // Listen for online/offline state changes
        window.addEventListener('online', () => {
            this.log('STATE_CHANGE', {
                source: 'Browser',
                action: 'online',
                input: { previousState: 'offline' },
                decision: 'state-transition',
                reason: 'navigator.onLine changed to true',
                outcome: 'online'
            });
        });

        window.addEventListener('offline', () => {
            this.log('STATE_CHANGE', {
                source: 'Browser',
                action: 'offline',
                input: { previousState: 'online' },
                decision: 'state-transition',
                reason: 'navigator.onLine changed to false',
                outcome: 'offline'
            });
        });

        console.log('[OfflineLog] Initialized');
    },

    /**
     * Log an offline-related event
     * @param {string} type - Event type: STATE_CHANGE, CACHE_DECISION, QUEUE_OP, SW_STRATEGY, SYNC
     * @param {Object} details - Event details
     * @param {string} details.source - Source system (CacheManager, CRUD, ServiceWorker, etc.)
     * @param {string} details.action - Action being performed
     * @param {Object} [details.input] - Input data (what was checked)
     * @param {string} details.decision - Decision made
     * @param {string} [details.reason] - Why the decision was made
     * @param {string} [details.outcome] - Outcome (success, fail, pending, fallback)
     * @param {Object} [details.metadata] - Extra data
     */
    log(type, details) {
        const event = {
            id: this._counter++,
            timestamp: Date.now(),
            elapsed: Date.now() - this._initTime,
            type: type,
            source: details.source || 'unknown',
            action: details.action || '',
            input: details.input || {},
            decision: details.decision || '',
            reason: details.reason || '',
            outcome: details.outcome || '',
            metadata: details.metadata || null
        };

        // Push to ring buffer
        this._events.push(event);
        if (this._events.length > this.MAX_EVENTS) {
            this._events.shift();
        }

        // Update stats
        this._updateStats(type, details);

        // Console log for debugging
        console.debug(`[OfflineLog] ${type} | ${details.source}.${details.action} → ${details.decision} (${details.reason || '-'})`);

        // Debounced persistence to sessionStorage
        this._schedulePersist();
    },

    /**
     * Update running statistics based on event type
     * @private
     */
    _updateStats(type, details) {
        switch (type) {
            case 'STATE_CHANGE':
                this._stats.stateChanges++;
                break;
            case 'CACHE_DECISION':
                if (details.decision && details.decision.includes('hit')) {
                    this._stats.cacheHits++;
                } else if (details.decision && details.decision.includes('miss')) {
                    this._stats.cacheMisses++;
                }
                if (details.decision && details.decision.includes('stale')) {
                    this._stats.staleFallbacks++;
                }
                break;
            case 'QUEUE_OP':
                if (details.action === 'enqueue') {
                    this._stats.queuedOps++;
                }
                break;
            case 'SYNC':
                if (details.outcome === 'success') {
                    this._stats.syncedOps++;
                }
                break;
            case 'SW_STRATEGY':
                this._stats.swDecisions++;
                break;
        }
    },

    /**
     * Schedule debounced persistence to sessionStorage (every 5s)
     * @private
     */
    _schedulePersist() {
        if (this._persistTimer) return;
        this._persistTimer = setTimeout(() => {
            this._persistTimer = null;
            try {
                const toStore = this._events.slice(-this.MAX_PERSISTED);
                sessionStorage.setItem('eoa_offline_log', JSON.stringify(toStore));
            } catch (e) {
                // sessionStorage full or unavailable
            }
        }, 5000);
    },

    /**
     * Get all events (most recent last)
     * @param {string} [filterType] - Optional type filter
     * @returns {Array<Object>}
     */
    getEvents(filterType) {
        if (filterType) {
            return this._events.filter(e => e.type === filterType);
        }
        return [...this._events];
    },

    /**
     * Get running statistics
     * @returns {Object}
     */
    getStats() {
        return {
            ...this._stats,
            totalEvents: this._events.length,
            currentState: navigator.onLine ? 'online' : 'offline',
            uptimeMs: Date.now() - this._initTime
        };
    },

    /**
     * Get recent events for DiagnosticCollector integration
     * @param {number} [count=20]
     * @returns {Array<Object>}
     */
    getRecent(count = 20) {
        return this._events.slice(-count);
    },

    /**
     * Clear all events and reset stats
     */
    clear() {
        this._events = [];
        this._counter = 0;
        Object.keys(this._stats).forEach(k => this._stats[k] = 0);
        try {
            sessionStorage.removeItem('eoa_offline_log');
        } catch (e) { /* ignore */ }
        console.log('[OfflineLog] Cleared');
    },

    /**
     * Export all events as JSON string
     * @returns {string}
     */
    exportJSON() {
        return JSON.stringify({
            stats: this.getStats(),
            events: this._events
        }, null, 2);
    }
};

// Auto-initialize and expose globally
if (typeof window !== 'undefined') {
    OfflineEventLogger.init();
    window.offlineLog = OfflineEventLogger;
    window.OfflineEventLogger = OfflineEventLogger;
}
