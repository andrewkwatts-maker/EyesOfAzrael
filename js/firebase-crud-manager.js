/**
 * Firebase CRUD Manager
 *
 * Comprehensive CRUD (Create, Read, Update, Delete) operations manager
 * for Firebase Firestore entities with user ownership, permissions,
 * validation, and integration with the notes/submission system.
 *
 * Features:
 * - Full CRUD operations with ownership tracking
 * - Permission-based access control
 * - Entity validation by collection type
 * - Soft delete with restore capability
 * - Version tracking for entities
 * - Notes integration
 * - Batch operations
 * - Transaction support
 * - Analytics tracking
 * - Optimistic UI updates
 * - Retry logic with exponential backoff
 * - Offline operation queue
 * - Real-time listener management
 * - User-friendly error messages
 *
 * SOLID Principles:
 * - Single Responsibility: Each class handles one concern
 * - Open/Closed: Extensible through inheritance
 * - Liskov Substitution: Validators can be swapped
 * - Interface Segregation: Focused interfaces
 * - Dependency Inversion: Depends on abstractions
 */

class FirebaseCRUDManager {
    /**
     * @param {firebase.firestore.Firestore} db - Firestore instance
     * @param {firebase.auth.Auth} auth - Firebase Auth instance
     * @param {Object} options - Configuration options
     */
    constructor(db, auth, options = {}) {
        this.db = db || (typeof firebase !== 'undefined' && firebase.firestore());
        this.auth = auth || (typeof firebase !== 'undefined' && firebase.auth());
        this.validator = new EntityValidator();
        this.permissionManager = new PermissionManager(this.auth);

        // Batch operation limits
        this.BATCH_SIZE = 500;

        // Retry configuration
        this.retryConfig = {
            maxRetries: options.maxRetries || 3,
            baseDelay: options.baseDelay || 1000,
            maxDelay: options.maxDelay || 10000
        };

        // Offline operation queue
        this.offlineQueue = [];
        this.isProcessingQueue = false;

        // Real-time listeners registry
        this.activeListeners = new Map();

        // Success/error callbacks
        this.callbacks = {
            onSuccess: options.onSuccess || null,
            onError: options.onError || null,
            onOfflineQueue: options.onOfflineQueue || null,
            onOptimisticUpdate: options.onOptimisticUpdate || null,
            onOptimisticRevert: options.onOptimisticRevert || null
        };

        // Loading state management
        this.loadingStates = new Map();
        this.loadingListeners = new Set();

        // Error codes
        this.ERROR_CODES = {
            AUTH_REQUIRED: 'AUTH_REQUIRED',
            PERMISSION_DENIED: 'PERMISSION_DENIED',
            NOT_FOUND: 'NOT_FOUND',
            VALIDATION_ERROR: 'VALIDATION_ERROR',
            OFFLINE: 'OFFLINE',
            UNKNOWN_ERROR: 'UNKNOWN_ERROR',
            INVALID_COLLECTION: 'INVALID_COLLECTION',
            INVALID_ID: 'INVALID_ID',
            INVALID_QUERY: 'INVALID_QUERY',
            INDEX_REQUIRED: 'INDEX_REQUIRED',
            QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
            NETWORK_ERROR: 'NETWORK_ERROR',
            TIMEOUT: 'TIMEOUT',
            CONFLICT: 'CONFLICT'
        };

        // User-friendly error messages
        this.ERROR_MESSAGES = {
            AUTH_REQUIRED: 'Please sign in to continue.',
            PERMISSION_DENIED: 'You do not have permission to perform this action.',
            NOT_FOUND: 'The requested item could not be found.',
            VALIDATION_ERROR: 'Please check your input and try again.',
            OFFLINE: 'You appear to be offline. Your changes will be saved when you reconnect.',
            UNKNOWN_ERROR: 'Something went wrong. Please try again.',
            INVALID_COLLECTION: 'Invalid data category specified.',
            INVALID_ID: 'Invalid item identifier.',
            INVALID_QUERY: 'Invalid search parameters.',
            INDEX_REQUIRED: 'This search requires database optimization. Please contact support.',
            QUOTA_EXCEEDED: 'Storage limit reached. Please contact support.',
            NETWORK_ERROR: 'Network connection failed. Please check your internet.',
            TIMEOUT: 'The operation took too long. Please try again.',
            CONFLICT: 'This item was modified by someone else. Please refresh and try again.'
        };

        // Initialize offline support
        this.initOfflineSupport();

        // Load any queued operations from storage
        this.loadOfflineQueue();
    }

    // ==================== OFFLINE SUPPORT ====================

    /**
     * Initialize offline detection and queue processing
     */
    initOfflineSupport() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('[CRUD] Back online, processing queued operations...');
                this.processOfflineQueue();
            });

            window.addEventListener('offline', () => {
                console.log('[CRUD] Went offline, operations will be queued');
            });
        }
    }

    /**
     * Check if browser is online
     * @returns {boolean}
     */
    isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    /**
     * Add operation to offline queue
     * @param {Object} operation - Operation details
     */
    queueOfflineOperation(operation) {
        const queuedOp = {
            ...operation,
            queuedAt: Date.now(),
            id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        this.offlineQueue.push(queuedOp);
        this.saveOfflineQueue();

        console.log('[CRUD] Operation queued for later:', queuedOp.type, queuedOp.id);

        if (this.callbacks.onOfflineQueue) {
            this.callbacks.onOfflineQueue(queuedOp, this.offlineQueue.length);
        }

        return queuedOp;
    }

    /**
     * Process queued offline operations
     */
    async processOfflineQueue() {
        if (this.isProcessingQueue || this.offlineQueue.length === 0 || !this.isOnline()) {
            return;
        }

        this.isProcessingQueue = true;
        console.log(`[CRUD] Processing ${this.offlineQueue.length} queued operations...`);

        const processed = [];
        const failed = [];

        for (const op of [...this.offlineQueue]) {
            try {
                let result;

                switch (op.type) {
                    case 'create':
                        result = await this.create(op.collection, op.data, op.options);
                        break;
                    case 'update':
                        result = await this.update(op.collection, op.entityId, op.data);
                        break;
                    case 'delete':
                        result = await this.delete(op.collection, op.entityId, op.hardDelete);
                        break;
                    default:
                        console.warn('[CRUD] Unknown queued operation type:', op.type);
                        continue;
                }

                if (result.success) {
                    processed.push(op);
                    // Remove from queue
                    const index = this.offlineQueue.findIndex(q => q.id === op.id);
                    if (index > -1) {
                        this.offlineQueue.splice(index, 1);
                    }
                } else {
                    failed.push({ op, error: result.error });
                }
            } catch (error) {
                failed.push({ op, error: error.message });
            }
        }

        this.saveOfflineQueue();
        this.isProcessingQueue = false;

        console.log(`[CRUD] Queue processing complete: ${processed.length} succeeded, ${failed.length} failed`);

        return { processed, failed };
    }

    /**
     * Save offline queue to localStorage
     */
    saveOfflineQueue() {
        try {
            localStorage.setItem('eoa_offline_queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.warn('[CRUD] Failed to save offline queue:', error);
        }
    }

    /**
     * Load offline queue from localStorage
     */
    loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('eoa_offline_queue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
                console.log(`[CRUD] Loaded ${this.offlineQueue.length} queued operations`);
            }
        } catch (error) {
            console.warn('[CRUD] Failed to load offline queue:', error);
            this.offlineQueue = [];
        }
    }

    // ==================== RETRY LOGIC ====================

    /**
     * Execute operation with retry logic
     * @param {Function} operation - Async operation to execute
     * @param {Object} options - Retry options
     * @returns {Promise<any>}
     */
    async withRetry(operation, options = {}) {
        const maxRetries = options.maxRetries || this.retryConfig.maxRetries;
        const baseDelay = options.baseDelay || this.retryConfig.baseDelay;
        const maxDelay = options.maxDelay || this.retryConfig.maxDelay;

        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }

                if (attempt < maxRetries) {
                    // Calculate delay with exponential backoff and jitter
                    const delay = Math.min(
                        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
                        maxDelay
                    );

                    console.log(`[CRUD] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Check if error should not be retried
     * @param {Error} error
     * @returns {boolean}
     */
    isNonRetryableError(error) {
        const nonRetryableCodes = [
            'permission-denied',
            'invalid-argument',
            'failed-precondition',
            'not-found',
            'already-exists',
            'unauthenticated'
        ];

        return nonRetryableCodes.includes(error.code);
    }

    /**
     * Sleep helper
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== LOADING STATE MANAGEMENT ====================

    /**
     * Set loading state for an operation
     * @param {string} key - Operation key
     * @param {boolean} isLoading - Loading state
     * @param {string} message - Optional loading message
     */
    setLoadingState(key, isLoading, message = '') {
        if (isLoading) {
            this.loadingStates.set(key, { loading: true, message, startTime: Date.now() });
        } else {
            this.loadingStates.delete(key);
        }

        this.notifyLoadingListeners(key, isLoading, message);
    }

    /**
     * Get loading state for an operation
     * @param {string} key - Operation key
     * @returns {Object|null}
     */
    getLoadingState(key) {
        return this.loadingStates.get(key) || null;
    }

    /**
     * Check if any operation is loading
     * @returns {boolean}
     */
    isAnyLoading() {
        return this.loadingStates.size > 0;
    }

    /**
     * Subscribe to loading state changes
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onLoadingChange(callback) {
        this.loadingListeners.add(callback);
        return () => this.loadingListeners.delete(callback);
    }

    /**
     * Notify loading state listeners
     */
    notifyLoadingListeners(key, isLoading, message) {
        for (const callback of this.loadingListeners) {
            try {
                callback({ key, isLoading, message, allStates: this.loadingStates });
            } catch (error) {
                console.error('[CRUD] Loading listener error:', error);
            }
        }
    }

    // ==================== OPTIMISTIC UI UPDATES ====================

    /**
     * Execute operation with optimistic UI update
     * @param {Object} config - Optimistic update configuration
     * @returns {Promise<Object>}
     */
    async withOptimisticUpdate(config) {
        const {
            operation,
            optimisticData,
            rollbackData,
            collection,
            entityId,
            onOptimisticApply,
            onOptimisticRevert
        } = config;

        const optimisticKey = `${collection}_${entityId || 'new'}`;

        try {
            // Apply optimistic update immediately
            if (onOptimisticApply) {
                onOptimisticApply(optimisticData);
            }

            if (this.callbacks.onOptimisticUpdate) {
                this.callbacks.onOptimisticUpdate(optimisticKey, optimisticData);
            }

            // Execute the actual operation
            const result = await operation();

            if (!result.success) {
                // Revert optimistic update on failure
                this.revertOptimisticUpdate(optimisticKey, rollbackData, onOptimisticRevert);
            }

            return result;

        } catch (error) {
            // Revert optimistic update on error
            this.revertOptimisticUpdate(optimisticKey, rollbackData, onOptimisticRevert);
            throw error;
        }
    }

    /**
     * Revert an optimistic update
     */
    revertOptimisticUpdate(key, rollbackData, onRevert) {
        console.log('[CRUD] Reverting optimistic update:', key);

        if (onRevert) {
            onRevert(rollbackData);
        }

        if (this.callbacks.onOptimisticRevert) {
            this.callbacks.onOptimisticRevert(key, rollbackData);
        }
    }

    // ==================== CREATE OPERATIONS ====================

    /**
     * Create a new entity
     * @param {string} collection - Collection name (deities, creatures, etc.)
     * @param {Object} entityData - Entity data
     * @param {Object} options - Creation options
     * @returns {Promise<{success: boolean, id?: string, data?: Object, error?: string, code?: string, userMessage?: string}>}
     */
    async create(collection, entityData, options = {}) {
        const loadingKey = `create_${collection}_${Date.now()}`;
        this.setLoadingState(loadingKey, true, `Creating ${collection} entry...`);

        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: 'You must be logged in to create entities',
                    userMessage: this.ERROR_MESSAGES.AUTH_REQUIRED,
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
                this.handleError(result);
                return result;
            }

            // Validate entity data
            const validation = this.validator.validate(entityData, collection);
            if (!validation.valid) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: `Validation failed: ${validation.errors.join(', ')}`,
                    userMessage: this.ERROR_MESSAGES.VALIDATION_ERROR,
                    validationErrors: validation.errors,
                    code: this.ERROR_CODES.VALIDATION_ERROR
                };
                this.handleError(result);
                return result;
            }

            // Check if offline - queue operation
            if (!this.isOnline()) {
                this.setLoadingState(loadingKey, false);
                const queuedOp = this.queueOfflineOperation({
                    type: 'create',
                    collection,
                    data: entityData,
                    options
                });

                return {
                    success: true,
                    queued: true,
                    queueId: queuedOp.id,
                    userMessage: this.ERROR_MESSAGES.OFFLINE,
                    data: {
                        ...entityData,
                        _pending: true,
                        _queueId: queuedOp.id
                    }
                };
            }

            // Sanitize data
            const sanitizedData = this.sanitizeEntityData(entityData);

            // Add ownership and metadata
            const enrichedData = {
                ...sanitizedData,
                createdBy: user.uid,
                createdByEmail: user.email,
                createdByName: user.displayName || user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: 1,
                status: options.status || 'active'
            };

            // Execute with retry logic
            const createOperation = async () => {
                let docRef;
                if (options.customId) {
                    docRef = this.db.collection(collection).doc(options.customId);
                    await docRef.set(enrichedData);
                } else {
                    docRef = await this.db.collection(collection).add(enrichedData);
                }
                return docRef;
            };

            const docRef = await this.withRetry(createOperation, {
                maxRetries: options.maxRetries || this.retryConfig.maxRetries
            });

            console.log(`[CRUD] Created ${collection} entity:`, docRef.id);

            // Invalidate relevant caches
            this.invalidateCache(collection);

            // Track contribution
            this.trackAction('create', collection, docRef.id);

            const result = {
                success: true,
                id: docRef.id,
                data: {
                    id: docRef.id,
                    ...enrichedData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                userMessage: `Successfully created ${sanitizedData.name || 'entry'}.`
            };

            // Call success callback
            this.handleSuccess('create', result, collection, docRef.id);

            this.setLoadingState(loadingKey, false);
            return result;

        } catch (error) {
            console.error('[CRUD] Create error:', error);
            this.setLoadingState(loadingKey, false);

            const errorCode = this.getErrorCode(error);
            const result = {
                success: false,
                error: error.message,
                userMessage: this.ERROR_MESSAGES[errorCode] || this.ERROR_MESSAGES.UNKNOWN_ERROR,
                code: errorCode
            };

            this.handleError(result);
            return result;
        }
    }

    /**
     * Create multiple entities in a batch
     * @param {string} collection - Collection name
     * @param {Array<Object>} entities - Array of entity data
     * @param {Object} options - Batch options
     * @returns {Promise<{success: boolean, created?: number, failed?: number, errors?: Array, ids?: Array, userMessage?: string}>}
     */
    async createMany(collection, entities, options = {}) {
        const loadingKey = `createMany_${collection}_${Date.now()}`;
        this.setLoadingState(loadingKey, true, `Creating ${entities.length} ${collection} entries...`);

        try {
            const user = this.auth.currentUser;
            if (!user) {
                this.setLoadingState(loadingKey, false);
                return {
                    success: false,
                    error: 'You must be logged in to create entities',
                    userMessage: this.ERROR_MESSAGES.AUTH_REQUIRED,
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
            }

            // Check if offline
            if (!this.isOnline()) {
                this.setLoadingState(loadingKey, false);
                // Queue each entity separately for offline processing
                const queuedIds = entities.map(entityData => {
                    const queuedOp = this.queueOfflineOperation({
                        type: 'create',
                        collection,
                        data: entityData,
                        options: {}
                    });
                    return queuedOp.id;
                });

                return {
                    success: true,
                    queued: true,
                    queueIds: queuedIds,
                    created: entities.length,
                    failed: 0,
                    userMessage: `${entities.length} items queued for creation when back online.`
                };
            }

            const ids = [];
            const errors = [];
            const createdEntities = [];
            let created = 0;
            let failed = 0;

            // Process in batches with progress callback
            const totalBatches = Math.ceil(entities.length / this.BATCH_SIZE);
            let currentBatch = 0;

            for (let i = 0; i < entities.length; i += this.BATCH_SIZE) {
                currentBatch++;
                const batchProgress = Math.round((currentBatch / totalBatches) * 100);

                if (options.onProgress) {
                    options.onProgress({
                        currentBatch,
                        totalBatches,
                        progress: batchProgress,
                        created,
                        failed
                    });
                }

                this.setLoadingState(loadingKey, true,
                    `Processing batch ${currentBatch}/${totalBatches} (${batchProgress}%)`);

                const batch = this.db.batch();
                const batchEntities = entities.slice(i, i + this.BATCH_SIZE);
                const batchIds = [];

                for (const entityData of batchEntities) {
                    // Validate
                    const validation = this.validator.validate(entityData, collection);
                    if (!validation.valid) {
                        errors.push({
                            data: entityData,
                            error: validation.errors.join(', '),
                            index: i + batchEntities.indexOf(entityData)
                        });
                        failed++;
                        continue;
                    }

                    // Create document
                    const docRef = this.db.collection(collection).doc();
                    const enrichedData = {
                        ...this.sanitizeEntityData(entityData),
                        createdBy: user.uid,
                        createdByEmail: user.email,
                        createdByName: user.displayName || user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        version: 1,
                        status: 'active'
                    };

                    batch.set(docRef, enrichedData);
                    batchIds.push(docRef.id);
                    createdEntities.push({ id: docRef.id, ...enrichedData });
                }

                // Commit batch with retry
                try {
                    await this.withRetry(() => batch.commit(), {
                        maxRetries: options.maxRetries || 2
                    });

                    ids.push(...batchIds);
                    created += batchIds.length;
                } catch (batchError) {
                    console.error(`[CRUD] Batch ${currentBatch} failed:`, batchError);
                    errors.push({
                        batch: currentBatch,
                        error: batchError.message,
                        affectedIds: batchIds
                    });
                    failed += batchIds.length;

                    // Option to stop on first error
                    if (options.stopOnError) {
                        break;
                    }
                }
            }

            console.log(`[CRUD] Batch created ${created} ${collection} entities, ${failed} failed`);

            // Invalidate caches
            this.invalidateCache(collection);

            this.setLoadingState(loadingKey, false);

            const result = {
                success: failed === 0,
                created,
                failed,
                ids,
                entities: createdEntities,
                errors: errors.length > 0 ? errors : undefined,
                userMessage: failed === 0
                    ? `Successfully created ${created} items.`
                    : `Created ${created} items, ${failed} failed.`
            };

            if (failed === 0) {
                this.handleSuccess('createMany', result, collection);
            }

            return result;

        } catch (error) {
            console.error('[CRUD] CreateMany error:', error);
            this.setLoadingState(loadingKey, false);

            const errorCode = this.getErrorCode(error);
            return {
                success: false,
                error: error.message,
                userMessage: this.ERROR_MESSAGES[errorCode] || this.ERROR_MESSAGES.UNKNOWN_ERROR,
                code: errorCode
            };
        }
    }

    // ==================== READ OPERATIONS ====================

    /**
     * Read a single entity by ID
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @returns {Promise<{success: boolean, data?: Object, error?: string, code?: string}>}
     */
    async read(collection, id) {
        try {
            // Validate inputs
            if (!collection || typeof collection !== 'string') {
                return {
                    success: false,
                    error: 'Invalid collection name',
                    code: this.ERROR_CODES.INVALID_COLLECTION
                };
            }

            if (!id || typeof id !== 'string') {
                return {
                    success: false,
                    error: 'Invalid document ID',
                    code: this.ERROR_CODES.INVALID_ID
                };
            }

            const docRef = this.db.collection(collection).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return {
                    success: false,
                    error: 'Entity not found',
                    code: this.ERROR_CODES.NOT_FOUND
                };
            }

            const data = {
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            };

            return {
                success: true,
                data
            };

        } catch (error) {
            console.error('[CRUD] Read error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    /**
     * Read multiple entities with query options
     * @param {string} collection - Collection name
     * @param {Object} options - Query options
     * @returns {Promise<{success: boolean, data?: Array, count?: number, hasMore?: boolean, lastDoc?: any, error?: string, code?: string}>}
     */
    async readMany(collection, options = {}) {
        try {
            // Validate collection name
            if (!collection || typeof collection !== 'string') {
                return {
                    success: false,
                    error: 'Invalid collection name',
                    code: this.ERROR_CODES.INVALID_COLLECTION,
                    data: []
                };
            }

            let query = this.db.collection(collection);

            // Apply filters with validation
            if (options.where) {
                if (!Array.isArray(options.where)) {
                    return {
                        success: false,
                        error: 'options.where must be an array',
                        code: this.ERROR_CODES.INVALID_QUERY,
                        data: []
                    };
                }

                for (const filter of options.where) {
                    if (!Array.isArray(filter) || filter.length !== 3) {
                        console.warn('[CRUD] Invalid where clause, skipping:', filter);
                        continue;
                    }
                    const [field, operator, value] = filter;
                    query = query.where(field, operator, value);
                }
            }

            // Filter by status (default: active only)
            if (options.includeDeleted !== true) {
                query = query.where('status', '==', 'active');
            }

            // Apply ordering
            if (options.orderBy) {
                const [field, direction = 'asc'] = Array.isArray(options.orderBy)
                    ? options.orderBy
                    : [options.orderBy, 'asc'];
                query = query.orderBy(field, direction);
            }

            // Apply limit (with maximum cap)
            const maxLimit = 500;
            const limit = options.limit ? Math.min(options.limit, maxLimit) : 100;
            query = query.limit(limit);

            // Apply pagination
            if (options.startAfter) {
                query = query.startAfter(options.startAfter);
            }

            // Execute query
            const snapshot = await query.get();

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            }));

            return {
                success: true,
                data,
                count: data.length,
                total: snapshot.size,
                hasMore: data.length === limit,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
            };

        } catch (error) {
            console.error('[CRUD] ReadMany error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error),
                data: []
            };
        }
    }

    /**
     * Search entities by text (limited client-side)
     * @param {string} collection - Collection name
     * @param {string} searchTerm - Search term
     * @param {Array<string>} fields - Fields to search in
     * @param {Object} options - Additional query options
     * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
     */
    async search(collection, searchTerm, fields = ['name'], options = {}) {
        try {
            // Get all entities first (limited to prevent massive reads)
            const result = await this.readMany(collection, {
                ...options,
                limit: options.limit || 200
            });

            if (!result.success) {
                return result;
            }

            // Client-side filtering
            const searchLower = searchTerm.toLowerCase();
            const filtered = result.data.filter(entity => {
                return fields.some(field => {
                    const value = entity[field];
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(searchLower);
                    }
                    if (Array.isArray(value)) {
                        return value.some(v =>
                            typeof v === 'string' && v.toLowerCase().includes(searchLower)
                        );
                    }
                    return false;
                });
            });

            return {
                success: true,
                data: filtered,
                count: filtered.length
            };

        } catch (error) {
            console.error('[CRUD] Search error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error),
                data: []
            };
        }
    }

    // ==================== UPDATE OPERATIONS ====================

    /**
     * Update an existing entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {Object} updates - Fields to update
     * @param {Object} options - Update options including optimistic update support
     * @returns {Promise<{success: boolean, error?: string, code?: string, userMessage?: string}>}
     */
    async update(collection, id, updates, options = {}) {
        const loadingKey = `update_${collection}_${id}`;
        this.setLoadingState(loadingKey, true, 'Saving changes...');

        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: 'You must be logged in to update entities',
                    userMessage: this.ERROR_MESSAGES.AUTH_REQUIRED,
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
                this.handleError(result);
                return result;
            }

            // Check permissions
            const hasPermission = await this.permissionManager.canEdit(collection, id, user.uid);
            if (!hasPermission) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: 'You do not have permission to edit this entity',
                    userMessage: this.ERROR_MESSAGES.PERMISSION_DENIED,
                    code: this.ERROR_CODES.PERMISSION_DENIED
                };
                this.handleError(result);
                return result;
            }

            // Validate updates
            const validation = this.validator.validateUpdate(updates, collection);
            if (!validation.valid) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: `Validation failed: ${validation.errors.join(', ')}`,
                    userMessage: this.ERROR_MESSAGES.VALIDATION_ERROR,
                    validationErrors: validation.errors,
                    code: this.ERROR_CODES.VALIDATION_ERROR
                };
                this.handleError(result);
                return result;
            }

            // Check if offline - queue operation
            if (!this.isOnline()) {
                this.setLoadingState(loadingKey, false);
                const queuedOp = this.queueOfflineOperation({
                    type: 'update',
                    collection,
                    entityId: id,
                    data: updates
                });

                return {
                    success: true,
                    queued: true,
                    queueId: queuedOp.id,
                    userMessage: this.ERROR_MESSAGES.OFFLINE
                };
            }

            // Sanitize updates
            const sanitizedUpdates = this.sanitizeEntityData(updates);

            // Add update metadata
            const enrichedUpdates = {
                ...sanitizedUpdates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
                updatedByEmail: user.email,
                version: firebase.firestore.FieldValue.increment(1)
            };

            // Execute update with optimistic UI support if provided
            const updateOperation = async () => {
                await this.db.collection(collection).doc(id).update(enrichedUpdates);
            };

            if (options.optimistic && options.previousData) {
                await this.withOptimisticUpdate({
                    operation: () => this.withRetry(updateOperation),
                    optimisticData: { id, ...updates },
                    rollbackData: options.previousData,
                    collection,
                    entityId: id,
                    onOptimisticApply: options.onOptimisticApply,
                    onOptimisticRevert: options.onOptimisticRevert
                });
            } else {
                await this.withRetry(updateOperation);
            }

            console.log(`[CRUD] Updated ${collection} entity:`, id);

            // Invalidate relevant caches
            this.invalidateCache(collection, id);

            // Track contribution
            this.trackAction('edit', collection, id);

            this.setLoadingState(loadingKey, false);

            const result = {
                success: true,
                userMessage: 'Changes saved successfully.'
            };

            this.handleSuccess('update', result, collection, id);
            return result;

        } catch (error) {
            console.error('[CRUD] Update error:', error);
            this.setLoadingState(loadingKey, false);

            const errorCode = this.getErrorCode(error);
            const result = {
                success: false,
                error: error.message,
                userMessage: this.ERROR_MESSAGES[errorCode] || this.ERROR_MESSAGES.UNKNOWN_ERROR,
                code: errorCode
            };

            this.handleError(result);
            return result;
        }
    }

    /**
     * Update multiple entities in a batch
     * @param {string} collection - Collection name
     * @param {Array<{id: string, updates: Object}>} items - Array of updates
     * @returns {Promise<{success: boolean, updated?: number, failed?: number, errors?: Array}>}
     */
    async updateMany(collection, items) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: 'You must be logged in to update entities',
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
            }

            const errors = [];
            let updated = 0;
            let failed = 0;

            // Process in batches
            for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
                const batch = this.db.batch();
                const batchItems = items.slice(i, i + this.BATCH_SIZE);

                for (const item of batchItems) {
                    // Check permission
                    const hasPermission = await this.permissionManager.canEdit(collection, item.id, user.uid);
                    if (!hasPermission) {
                        errors.push({ id: item.id, error: 'Permission denied' });
                        failed++;
                        continue;
                    }

                    // Validate
                    const validation = this.validator.validateUpdate(item.updates, collection);
                    if (!validation.valid) {
                        errors.push({ id: item.id, error: validation.errors.join(', ') });
                        failed++;
                        continue;
                    }

                    // Add to batch
                    const docRef = this.db.collection(collection).doc(item.id);
                    batch.update(docRef, {
                        ...this.sanitizeEntityData(item.updates),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedBy: user.uid,
                        version: firebase.firestore.FieldValue.increment(1)
                    });
                    updated++;
                }

                // Commit batch
                await batch.commit();
            }

            console.log(`[CRUD] Batch updated ${updated} ${collection} entities, ${failed} failed`);

            return {
                success: failed === 0,
                updated,
                failed,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error('[CRUD] UpdateMany error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete an entity (soft delete by default)
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {boolean} hardDelete - If true, permanently delete
     * @param {Object} options - Delete options
     * @returns {Promise<{success: boolean, error?: string, code?: string, userMessage?: string}>}
     */
    async delete(collection, id, hardDelete = false, options = {}) {
        const loadingKey = `delete_${collection}_${id}`;
        this.setLoadingState(loadingKey, true, hardDelete ? 'Permanently deleting...' : 'Deleting...');

        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: 'You must be logged in to delete entities',
                    userMessage: this.ERROR_MESSAGES.AUTH_REQUIRED,
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
                this.handleError(result);
                return result;
            }

            // Check permissions
            const hasPermission = await this.permissionManager.canDelete(collection, id, user.uid);
            if (!hasPermission) {
                this.setLoadingState(loadingKey, false);
                const result = {
                    success: false,
                    error: 'You do not have permission to delete this entity',
                    userMessage: this.ERROR_MESSAGES.PERMISSION_DENIED,
                    code: this.ERROR_CODES.PERMISSION_DENIED
                };
                this.handleError(result);
                return result;
            }

            // Check if offline - queue operation
            if (!this.isOnline()) {
                this.setLoadingState(loadingKey, false);
                const queuedOp = this.queueOfflineOperation({
                    type: 'delete',
                    collection,
                    entityId: id,
                    hardDelete
                });

                return {
                    success: true,
                    queued: true,
                    queueId: queuedOp.id,
                    userMessage: this.ERROR_MESSAGES.OFFLINE
                };
            }

            const docRef = this.db.collection(collection).doc(id);

            // Execute delete with retry
            const deleteOperation = async () => {
                if (hardDelete) {
                    await docRef.delete();
                } else {
                    await docRef.update({
                        status: 'deleted',
                        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        deletedBy: user.uid,
                        deletedByEmail: user.email
                    });
                }
            };

            // Support optimistic delete
            if (options.optimistic && options.entityData) {
                await this.withOptimisticUpdate({
                    operation: () => this.withRetry(deleteOperation),
                    optimisticData: { id, _deleted: true },
                    rollbackData: options.entityData,
                    collection,
                    entityId: id,
                    onOptimisticApply: options.onOptimisticApply,
                    onOptimisticRevert: options.onOptimisticRevert
                });
            } else {
                await this.withRetry(deleteOperation);
            }

            console.log(`[CRUD] ${hardDelete ? 'Hard' : 'Soft'} deleted ${collection} entity:`, id);

            // Invalidate relevant caches
            this.invalidateCache(collection, id);

            // Track contribution
            this.trackAction('delete', collection, id);

            this.setLoadingState(loadingKey, false);

            const result = {
                success: true,
                userMessage: hardDelete
                    ? 'Item permanently deleted.'
                    : 'Item moved to trash. You can restore it later.'
            };

            this.handleSuccess('delete', result, collection, id);
            return result;

        } catch (error) {
            console.error('[CRUD] Delete error:', error);
            this.setLoadingState(loadingKey, false);

            const errorCode = this.getErrorCode(error);
            const result = {
                success: false,
                error: error.message,
                userMessage: this.ERROR_MESSAGES[errorCode] || this.ERROR_MESSAGES.UNKNOWN_ERROR,
                code: errorCode
            };

            this.handleError(result);
            return result;
        }
    }

    /**
     * Restore a soft-deleted entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @returns {Promise<{success: boolean, error?: string, code?: string}>}
     */
    async restore(collection, id) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: 'You must be logged in to restore entities',
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
            }

            const hasPermission = await this.permissionManager.canEdit(collection, id, user.uid);
            if (!hasPermission) {
                return {
                    success: false,
                    error: 'You do not have permission to restore this entity',
                    code: this.ERROR_CODES.PERMISSION_DENIED
                };
            }

            await this.db.collection(collection).doc(id).update({
                status: 'active',
                restoredAt: firebase.firestore.FieldValue.serverTimestamp(),
                restoredBy: user.uid,
                deletedAt: firebase.firestore.FieldValue.delete(),
                deletedBy: firebase.firestore.FieldValue.delete(),
                deletedByEmail: firebase.firestore.FieldValue.delete()
            });

            console.log(`[CRUD] Restored ${collection} entity:`, id);

            return { success: true };

        } catch (error) {
            console.error('[CRUD] Restore error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    // ==================== USER-SPECIFIC OPERATIONS ====================

    /**
     * Get entities created by the current user
     * @param {string} collection - Collection name
     * @param {Object} options - Query options
     * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
     */
    async getUserEntities(collection, options = {}) {
        const user = this.auth.currentUser;
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
                code: this.ERROR_CODES.AUTH_REQUIRED,
                data: []
            };
        }

        return this.readMany(collection, {
            ...options,
            where: [
                ...(options.where || []),
                ['createdBy', '==', user.uid]
            ],
            includeDeleted: options.includeDeleted
        });
    }

    /**
     * Get user's contribution statistics
     * @param {string} userId - User ID (optional, defaults to current user)
     * @returns {Promise<{success: boolean, stats?: Object, error?: string}>}
     */
    async getUserStats(userId = null) {
        try {
            const targetUserId = userId || this.auth.currentUser?.uid;
            if (!targetUserId) {
                return {
                    success: false,
                    error: 'User not specified',
                    code: this.ERROR_CODES.AUTH_REQUIRED
                };
            }

            const collections = ['deities', 'creatures', 'heroes', 'items', 'places', 'texts', 'rituals', 'herbs', 'symbols', 'concepts'];
            const stats = {
                totalEntities: 0,
                byCollection: {},
                activeEntities: 0,
                deletedEntities: 0
            };

            for (const collection of collections) {
                const snapshot = await this.db.collection(collection)
                    .where('createdBy', '==', targetUserId)
                    .get();

                const active = snapshot.docs.filter(doc => doc.data().status === 'active').length;
                const deleted = snapshot.docs.filter(doc => doc.data().status === 'deleted').length;

                stats.byCollection[collection] = {
                    total: snapshot.size,
                    active,
                    deleted
                };
                stats.totalEntities += snapshot.size;
                stats.activeEntities += active;
                stats.deletedEntities += deleted;
            }

            return { success: true, stats };

        } catch (error) {
            console.error('[CRUD] GetUserStats error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error)
            };
        }
    }

    // ==================== NOTES INTEGRATION ====================

    /**
     * Get notes for an entity
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID
     * @param {Object} options - Query options
     * @returns {Promise<{success: boolean, notes?: Array, error?: string}>}
     */
    async getEntityNotes(collection, entityId, options = {}) {
        try {
            const { sortBy = 'netVotes', limit = 20, startAfter = null } = options;

            let query = this.db.collection('notes')
                .where('entityCollection', '==', collection)
                .where('entityId', '==', entityId)
                .where('status', '==', 'active');

            // Apply sorting
            if (sortBy === 'netVotes' || sortBy === 'votes') {
                query = query.orderBy('netVotes', 'desc');
            } else if (sortBy === 'recent' || sortBy === 'createdAt') {
                query = query.orderBy('createdAt', 'desc');
            } else {
                query = query.orderBy('netVotes', 'desc');
            }

            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(limit);

            const snapshot = await query.get();

            const notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...this.convertTimestamps(doc.data())
            }));

            return {
                success: true,
                notes,
                hasMore: notes.length === limit,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
            };

        } catch (error) {
            console.error('[CRUD] GetEntityNotes error:', error);
            return {
                success: false,
                error: error.message,
                code: this.getErrorCode(error),
                notes: []
            };
        }
    }

    /**
     * Get note count for an entity
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID
     * @returns {Promise<number>}
     */
    async getEntityNoteCount(collection, entityId) {
        try {
            const snapshot = await this.db.collection('notes')
                .where('entityCollection', '==', collection)
                .where('entityId', '==', entityId)
                .where('status', '==', 'active')
                .get();

            return snapshot.size;

        } catch (error) {
            console.error('[CRUD] GetEntityNoteCount error:', error);
            return 0;
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Sanitize entity data to remove dangerous fields
     * @param {Object} data - Raw data
     * @returns {Object} Sanitized data
     */
    sanitizeEntityData(data) {
        const sanitized = { ...data };

        // Remove system fields that shouldn't be set by users
        const protectedFields = [
            'id',
            'createdBy',
            'createdByEmail',
            'createdByName',
            'createdAt',
            'deletedAt',
            'deletedBy',
            'deletedByEmail',
            'restoredAt',
            'restoredBy'
        ];

        for (const field of protectedFields) {
            delete sanitized[field];
        }

        return sanitized;
    }

    /**
     * Convert Firestore timestamps to JS Dates
     * @param {Object} data - Data with potential timestamps
     * @returns {Object} Data with JS Dates
     */
    convertTimestamps(data) {
        const converted = { ...data };

        const timestampFields = ['createdAt', 'updatedAt', 'deletedAt', 'restoredAt'];

        for (const field of timestampFields) {
            if (data[field]?.toDate) {
                converted[field] = data[field].toDate();
            }
        }

        return converted;
    }

    /**
     * Get standardized error code from Firestore error
     * @param {Error} error - Firestore error
     * @returns {string} Error code
     */
    getErrorCode(error) {
        switch (error.code) {
            case 'permission-denied':
                return this.ERROR_CODES.PERMISSION_DENIED;
            case 'unavailable':
                return this.ERROR_CODES.OFFLINE;
            case 'not-found':
                return this.ERROR_CODES.NOT_FOUND;
            case 'failed-precondition':
                return this.ERROR_CODES.INDEX_REQUIRED;
            case 'invalid-argument':
                return this.ERROR_CODES.INVALID_QUERY;
            case 'resource-exhausted':
                return this.ERROR_CODES.QUOTA_EXCEEDED;
            case 'deadline-exceeded':
                return this.ERROR_CODES.TIMEOUT;
            case 'aborted':
                return this.ERROR_CODES.CONFLICT;
            default:
                return this.ERROR_CODES.UNKNOWN_ERROR;
        }
    }

    /**
     * Get user-friendly error message for an error code
     * @param {string} code - Error code
     * @returns {string} User-friendly message
     */
    getUserMessage(code) {
        return this.ERROR_MESSAGES[code] || this.ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    /**
     * Track user action for analytics
     * @param {string} action - Action type
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID
     */
    trackAction(action, collection, entityId) {
        if (typeof window !== 'undefined' && window.AnalyticsManager) {
            window.AnalyticsManager.trackContributionAction(action, collection, entityId);
        }
    }

    // ==================== CALLBACK HANDLERS ====================

    /**
     * Handle successful operation
     * @param {string} operationType - Type of operation (create, update, delete)
     * @param {Object} result - Operation result
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID (optional)
     */
    handleSuccess(operationType, result, collection, entityId = null) {
        console.log(`[CRUD] Success: ${operationType} on ${collection}`, entityId || '');

        // Call global success callback
        if (this.callbacks.onSuccess) {
            try {
                this.callbacks.onSuccess({
                    type: operationType,
                    collection,
                    entityId,
                    result,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('[CRUD] Success callback error:', error);
            }
        }

        // Emit custom event for external listeners
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('crud:success', {
                detail: { type: operationType, collection, entityId, result }
            }));
        }
    }

    /**
     * Handle operation error
     * @param {Object} errorResult - Error result object
     */
    handleError(errorResult) {
        console.error(`[CRUD] Error:`, errorResult.code, errorResult.error);

        // Call global error callback
        if (this.callbacks.onError) {
            try {
                this.callbacks.onError(errorResult);
            } catch (error) {
                console.error('[CRUD] Error callback error:', error);
            }
        }

        // Emit custom event for external listeners
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('crud:error', {
                detail: errorResult
            }));
        }
    }

    /**
     * Set global callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.callbacks = {
            ...this.callbacks,
            ...callbacks
        };
    }

    // ==================== CACHE INVALIDATION ====================

    /**
     * Invalidate cache for a collection or specific entity
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID (optional)
     */
    invalidateCache(collection, entityId = null) {
        if (typeof window !== 'undefined' && window.cacheManager) {
            try {
                window.cacheManager.invalidate(collection, entityId);
                console.log(`[CRUD] Cache invalidated: ${collection}${entityId ? '/' + entityId : ''}`);
            } catch (error) {
                console.warn('[CRUD] Cache invalidation failed:', error);
            }
        }

        // Also invalidate related lists
        if (typeof window !== 'undefined' && window.cacheManager) {
            try {
                // Invalidate any list caches for this collection
                window.cacheManager.invalidate(`list_${collection}`);
            } catch (error) {
                // Silently fail for list caches
            }
        }
    }

    // ==================== REAL-TIME LISTENERS ====================

    /**
     * Subscribe to real-time updates for an entity
     * @param {string} collection - Collection name
     * @param {string} entityId - Entity ID
     * @param {Function} callback - Callback function (data, error)
     * @returns {string} Listener ID for cleanup
     */
    subscribeToEntity(collection, entityId, callback) {
        const listenerId = `${collection}_${entityId}_${Date.now()}`;

        const unsubscribe = this.db.collection(collection).doc(entityId)
            .onSnapshot(
                (doc) => {
                    if (doc.exists) {
                        const data = {
                            id: doc.id,
                            ...this.convertTimestamps(doc.data())
                        };
                        callback(data, null);
                    } else {
                        callback(null, { code: 'NOT_FOUND', message: 'Entity not found' });
                    }
                },
                (error) => {
                    console.error(`[CRUD] Listener error for ${listenerId}:`, error);
                    callback(null, {
                        code: this.getErrorCode(error),
                        message: error.message
                    });
                }
            );

        this.activeListeners.set(listenerId, {
            unsubscribe,
            collection,
            entityId,
            createdAt: Date.now()
        });

        console.log(`[CRUD] Subscribed to entity: ${listenerId}`);
        return listenerId;
    }

    /**
     * Subscribe to real-time updates for a collection query
     * @param {string} collection - Collection name
     * @param {Object} options - Query options
     * @param {Function} callback - Callback function (data[], error)
     * @returns {string} Listener ID for cleanup
     */
    subscribeToCollection(collection, options, callback) {
        const listenerId = `list_${collection}_${Date.now()}`;

        let query = this.db.collection(collection);

        // Apply filters
        if (options.where) {
            for (const filter of options.where) {
                const [field, operator, value] = filter;
                query = query.where(field, operator, value);
            }
        }

        // Filter by status (default: active only)
        if (options.includeDeleted !== true) {
            query = query.where('status', '==', 'active');
        }

        // Apply ordering
        if (options.orderBy) {
            const [field, direction = 'asc'] = Array.isArray(options.orderBy)
                ? options.orderBy
                : [options.orderBy, 'asc'];
            query = query.orderBy(field, direction);
        }

        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }

        const unsubscribe = query.onSnapshot(
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...this.convertTimestamps(doc.data())
                }));
                callback(data, null);
            },
            (error) => {
                console.error(`[CRUD] Collection listener error for ${listenerId}:`, error);
                callback([], {
                    code: this.getErrorCode(error),
                    message: error.message
                });
            }
        );

        this.activeListeners.set(listenerId, {
            unsubscribe,
            collection,
            options,
            createdAt: Date.now()
        });

        console.log(`[CRUD] Subscribed to collection: ${listenerId}`);
        return listenerId;
    }

    /**
     * Unsubscribe from a real-time listener
     * @param {string} listenerId - Listener ID to unsubscribe
     * @returns {boolean} Whether the listener was found and unsubscribed
     */
    unsubscribe(listenerId) {
        const listener = this.activeListeners.get(listenerId);
        if (listener) {
            try {
                listener.unsubscribe();
                this.activeListeners.delete(listenerId);
                console.log(`[CRUD] Unsubscribed: ${listenerId}`);
                return true;
            } catch (error) {
                console.error(`[CRUD] Error unsubscribing ${listenerId}:`, error);
            }
        }
        return false;
    }

    /**
     * Unsubscribe from all active listeners
     */
    unsubscribeAll() {
        console.log(`[CRUD] Unsubscribing from ${this.activeListeners.size} listeners...`);

        for (const [listenerId, listener] of this.activeListeners.entries()) {
            try {
                listener.unsubscribe();
            } catch (error) {
                console.error(`[CRUD] Error unsubscribing ${listenerId}:`, error);
            }
        }

        this.activeListeners.clear();
        console.log('[CRUD] All listeners unsubscribed');
    }

    /**
     * Get count of active listeners
     * @returns {number}
     */
    getActiveListenerCount() {
        return this.activeListeners.size;
    }

    /**
     * Get list of active listener IDs
     * @returns {string[]}
     */
    getActiveListenerIds() {
        return Array.from(this.activeListeners.keys());
    }

    /**
     * Clean up stale listeners (older than specified age)
     * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
     * @returns {number} Number of listeners cleaned up
     */
    cleanupStaleListeners(maxAge = 3600000) {
        const now = Date.now();
        let cleaned = 0;

        for (const [listenerId, listener] of this.activeListeners.entries()) {
            if (now - listener.createdAt > maxAge) {
                try {
                    listener.unsubscribe();
                    this.activeListeners.delete(listenerId);
                    cleaned++;
                } catch (error) {
                    console.error(`[CRUD] Error cleaning up ${listenerId}:`, error);
                }
            }
        }

        if (cleaned > 0) {
            console.log(`[CRUD] Cleaned up ${cleaned} stale listeners`);
        }

        return cleaned;
    }

    // ==================== ERROR RECOVERY ====================

    /**
     * Attempt to recover from an error
     * @param {Object} errorResult - Error result from a failed operation
     * @param {Object} originalOperation - Original operation details
     * @returns {Promise<Object>} Recovery result
     */
    async attemptRecovery(errorResult, originalOperation) {
        const { code } = errorResult;
        const { type, collection, entityId, data } = originalOperation;

        console.log(`[CRUD] Attempting recovery for ${code} on ${type} operation`);

        switch (code) {
            case this.ERROR_CODES.OFFLINE:
                // Queue for later
                this.queueOfflineOperation({
                    type,
                    collection,
                    entityId,
                    data
                });
                return {
                    recovered: true,
                    method: 'queued',
                    message: 'Operation queued for when you are back online.'
                };

            case this.ERROR_CODES.TIMEOUT:
                // Retry with longer timeout
                if (type === 'create') {
                    return await this.create(collection, data, { maxRetries: 5 });
                } else if (type === 'update') {
                    return await this.update(collection, entityId, data, { maxRetries: 5 });
                }
                break;

            case this.ERROR_CODES.CONFLICT:
                // Fetch latest and suggest merge
                const latest = await this.read(collection, entityId);
                if (latest.success) {
                    return {
                        recovered: false,
                        method: 'conflict_resolution',
                        message: 'This item was modified by someone else.',
                        latestData: latest.data,
                        yourData: data
                    };
                }
                break;

            default:
                return {
                    recovered: false,
                    method: 'none',
                    message: 'Unable to automatically recover from this error.'
                };
        }

        return {
            recovered: false,
            method: 'none',
            message: 'Recovery not available for this error type.'
        };
    }

    /**
     * Cleanup resources when manager is destroyed
     */
    destroy() {
        console.log('[CRUD] Destroying CRUD Manager...');

        // Unsubscribe all listeners
        this.unsubscribeAll();

        // Clear loading states
        this.loadingStates.clear();
        this.loadingListeners.clear();

        // Save offline queue
        this.saveOfflineQueue();

        // Clear permission cache
        this.permissionManager.clearCache();

        console.log('[CRUD] CRUD Manager destroyed');
    }
}


/**
 * Entity Validator
 * Validates entity data according to schema requirements
 */
class EntityValidator {
    constructor() {
        // Define schemas for each collection
        this.schemas = {
            deities: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'domains', 'symbols', 'family', 'attributes', 'associations', 'powers', 'epithets', 'iconography', 'origin', 'historicalContext']
            },
            creatures: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'habitat', 'abilities', 'weaknesses', 'appearance', 'origin', 'behavior', 'associations']
            },
            heroes: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'quests', 'weapons', 'parents', 'birthplace', 'deathPlace', 'companions', 'enemies', 'achievements']
            },
            items: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'powers', 'owner', 'origin', 'currentLocation', 'materials', 'history']
            },
            places: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'significance', 'inhabitants', 'location', 'features', 'events', 'accessibility']
            },
            texts: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'author', 'date', 'content', 'themes', 'significance', 'translations', 'manuscripts']
            },
            rituals: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'purpose', 'steps', 'offerings', 'participants', 'timing', 'location', 'materials']
            },
            herbs: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'uses', 'preparation', 'warnings', 'associations', 'habitat', 'harvesting']
            },
            symbols: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'meaning', 'usage', 'variations', 'associations', 'origin']
            },
            concepts: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'significance', 'relatedConcepts', 'practices', 'deities']
            },
            archetypes: {
                required: ['name', 'type'],
                optional: ['description', 'characteristics', 'examples', 'mythology', 'psychology', 'associations']
            }
        };

        // Field type validators
        this.fieldTypes = {
            name: 'string',
            mythology: 'string',
            type: 'string',
            description: 'string',
            domains: 'array',
            symbols: 'array',
            abilities: 'array',
            quests: 'array',
            weapons: 'array',
            powers: 'array',
            steps: 'array',
            offerings: 'array',
            uses: 'array',
            tags: 'array',
            associations: 'array',
            relatedConcepts: 'array'
        };
    }

    /**
     * Validate entity data for creation
     * @param {Object} data - Entity data
     * @param {string} collection - Collection name
     * @returns {{valid: boolean, errors: Array<string>}}
     */
    validate(data, collection) {
        const errors = [];
        const schema = this.schemas[collection];

        if (!schema) {
            // For unknown collections, only require name
            if (!data.name) {
                errors.push('Missing required field: name');
            }
            return { valid: errors.length === 0, errors };
        }

        // Check required fields
        for (const field of schema.required) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate field types
        for (const [field, value] of Object.entries(data)) {
            const expectedType = this.fieldTypes[field];
            if (expectedType) {
                if (expectedType === 'string' && typeof value !== 'string') {
                    errors.push(`${field} must be a string`);
                }
                if (expectedType === 'array' && !Array.isArray(value)) {
                    errors.push(`${field} must be an array`);
                }
            }
        }

        // Validate name length
        if (data.name) {
            if (data.name.length < 2) {
                errors.push('Name must be at least 2 characters');
            }
            if (data.name.length > 200) {
                errors.push('Name cannot exceed 200 characters');
            }
        }

        // Validate description length if provided
        if (data.description && data.description.length > 10000) {
            errors.push('Description cannot exceed 10,000 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate update data (partial validation)
     * @param {Object} updates - Update data
     * @param {string} collection - Collection name
     * @returns {{valid: boolean, errors: Array<string>}}
     */
    validateUpdate(updates, collection) {
        const errors = [];

        // Immutable fields that cannot be updated
        const immutableFields = [
            'id',
            'createdBy',
            'createdAt',
            'createdByEmail',
            'createdByName'
        ];

        for (const field of immutableFields) {
            if (Object.prototype.hasOwnProperty.call(updates, field)) {
                errors.push(`Cannot update immutable field: ${field}`);
            }
        }

        // Validate field types for provided fields
        for (const [field, value] of Object.entries(updates)) {
            const expectedType = this.fieldTypes[field];
            if (expectedType) {
                if (expectedType === 'string' && value !== null && typeof value !== 'string') {
                    errors.push(`${field} must be a string`);
                }
                if (expectedType === 'array' && value !== null && !Array.isArray(value)) {
                    errors.push(`${field} must be an array`);
                }
            }
        }

        // Validate name if updating
        if (updates.name !== undefined) {
            if (typeof updates.name === 'string') {
                if (updates.name.length < 2) {
                    errors.push('Name must be at least 2 characters');
                }
                if (updates.name.length > 200) {
                    errors.push('Name cannot exceed 200 characters');
                }
            } else {
                errors.push('Name must be a string');
            }
        }

        // Validate description if updating
        if (updates.description && updates.description.length > 10000) {
            errors.push('Description cannot exceed 10,000 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}


/**
 * Permission Manager
 * Handles user permissions for entity operations
 */
class PermissionManager {
    constructor(auth) {
        this.auth = auth;
        this.adminEmails = [
            'andrewkwatts@gmail.com'
        ];

        // Cache for permission checks
        this.permissionCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Check if user is admin
     * @param {string} uid - User ID
     * @returns {Promise<boolean>}
     */
    async isAdmin(uid) {
        const user = this.auth.currentUser;
        if (!user || user.uid !== uid) return false;

        return this.adminEmails.includes(user.email);
    }

    /**
     * Check if user can edit entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {string} uid - User ID
     * @returns {Promise<boolean>}
     */
    async canEdit(collection, id, uid) {
        // Check cache first
        const cacheKey = `edit_${collection}_${id}_${uid}`;
        const cached = this.permissionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.result;
        }

        // Admins can edit anything
        if (await this.isAdmin(uid)) {
            this.cacheResult(cacheKey, true);
            return true;
        }

        // Users can edit their own entities
        try {
            const db = firebase.firestore();
            const doc = await db.collection(collection).doc(id).get();

            if (!doc.exists) {
                this.cacheResult(cacheKey, false);
                return false;
            }

            const data = doc.data();
            const result = data.createdBy === uid;
            this.cacheResult(cacheKey, result);
            return result;

        } catch (error) {
            console.error('[PermissionManager] canEdit error:', error);
            return false;
        }
    }

    /**
     * Check if user can delete entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {string} uid - User ID
     * @returns {Promise<boolean>}
     */
    async canDelete(collection, id, uid) {
        // Same rules as edit for now
        return this.canEdit(collection, id, uid);
    }

    /**
     * Check if user can read entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {string} uid - User ID
     * @returns {Promise<boolean>}
     */
    async canRead(collection, id, uid) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection(collection).doc(id).get();

            if (!doc.exists) return false;

            const data = doc.data();

            // Anyone can read active entities
            if (data.status === 'active') return true;

            // Only owner and admins can read deleted entities
            if (data.status === 'deleted') {
                if (data.createdBy === uid) return true;
                return await this.isAdmin(uid);
            }

            return false;

        } catch (error) {
            console.error('[PermissionManager] canRead error:', error);
            return false;
        }
    }

    /**
     * Cache permission result
     * @param {string} key - Cache key
     * @param {boolean} result - Permission result
     */
    cacheResult(key, result) {
        this.permissionCache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Clear permission cache
     */
    clearCache() {
        this.permissionCache.clear();
    }

    /**
     * Clear stale cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.permissionCache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.permissionCache.delete(key);
            }
        }
    }
}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseCRUDManager, EntityValidator, PermissionManager };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.FirebaseCRUDManager = FirebaseCRUDManager;
    window.EntityValidator = EntityValidator;
    window.PermissionManager = PermissionManager;

    // Create a default instance if Firebase is available
    if (typeof firebase !== 'undefined') {
        const initCRUDManager = () => {
            if (firebase.apps?.length > 0) {
                window.crudManager = new FirebaseCRUDManager(
                    firebase.firestore(),
                    firebase.auth()
                );
                console.log('[CRUD] Manager initialized: window.crudManager');
            }
        };

        // Initialize when Firebase is ready
        if (firebase.apps?.length > 0) {
            initCRUDManager();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initCRUDManager, 100);
            });
        }
    }
}
