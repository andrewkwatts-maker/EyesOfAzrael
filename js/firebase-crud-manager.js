/**
 * Firebase CRUD Manager
 * Handles Create, Read, Update, Delete operations for Firebase entities
 * with user ownership, permissions, and validation
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
     */
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
        this.validator = new EntityValidator();
        this.permissionManager = new PermissionManager(auth);
    }

    /**
     * Create a new entity
     * @param {string} collection - Collection name (deities, creatures, etc.)
     * @param {Object} entityData - Entity data
     * @returns {Promise<{success: boolean, id: string, error?: string}>}
     */
    async create(collection, entityData) {
        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User must be authenticated to create entities');
            }

            // Validate entity data
            const validation = this.validator.validate(entityData, collection);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Add ownership and metadata
            const enrichedData = {
                ...entityData,
                createdBy: user.uid,
                createdByEmail: user.email,
                createdByName: user.displayName || user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: 1,
                status: 'active'
            };

            // Create document
            const docRef = await this.db.collection(collection).add(enrichedData);

            console.log(`[CRUD] Created ${collection} entity:`, docRef.id);

            // Track contribution
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackContributionAction('create', collection, docRef.id);
            }

            return {
                success: true,
                id: docRef.id,
                data: enrichedData
            };

        } catch (error) {
            console.error('[CRUD] Create error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

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
                    code: 'INVALID_COLLECTION'
                };
            }

            if (!id || typeof id !== 'string') {
                return {
                    success: false,
                    error: 'Invalid document ID',
                    code: 'INVALID_ID'
                };
            }

            const docRef = this.db.collection(collection).doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return {
                    success: false,
                    error: 'Entity not found',
                    code: 'NOT_FOUND'
                };
            }

            const data = {
                id: doc.id,
                ...doc.data()
            };

            return {
                success: true,
                data
            };

        } catch (error) {
            console.error('[CRUD] Read error:', error);

            // Provide specific error codes for common Firestore errors
            let code = 'UNKNOWN_ERROR';
            if (error.code === 'permission-denied') {
                code = 'PERMISSION_DENIED';
            } else if (error.code === 'unavailable') {
                code = 'OFFLINE';
            } else if (error.code === 'not-found') {
                code = 'NOT_FOUND';
            }

            return {
                success: false,
                error: error.message,
                code
            };
        }
    }

    /**
     * Read multiple entities with query options
     * @param {string} collection - Collection name
     * @param {Object} options - Query options
     * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string, code?: string}>}
     */
    async readMany(collection, options = {}) {
        try {
            // Validate collection name
            if (!collection || typeof collection !== 'string') {
                return {
                    success: false,
                    error: 'Invalid collection name',
                    code: 'INVALID_COLLECTION',
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
                        code: 'INVALID_OPTIONS',
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

            // Apply ordering
            if (options.orderBy) {
                const [field, direction = 'asc'] = Array.isArray(options.orderBy)
                    ? options.orderBy
                    : [options.orderBy, 'asc'];
                query = query.orderBy(field, direction);
            }

            // Apply limit (with maximum cap to prevent runaway queries)
            const maxLimit = 500;
            if (options.limit) {
                query = query.limit(Math.min(options.limit, maxLimit));
            } else {
                // Default limit to prevent loading too much data
                query = query.limit(100);
            }

            // Apply startAfter for pagination (offset is not efficient in Firestore)
            if (options.startAfter) {
                query = query.startAfter(options.startAfter);
            }

            // Execute query
            const snapshot = await query.get();

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                data,
                count: data.length,
                total: snapshot.size,
                hasMore: data.length === (options.limit || 100),
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
            };

        } catch (error) {
            console.error('[CRUD] ReadMany error:', error);

            // Provide specific error codes for common Firestore errors
            let code = 'UNKNOWN_ERROR';
            if (error.code === 'permission-denied') {
                code = 'PERMISSION_DENIED';
            } else if (error.code === 'unavailable') {
                code = 'OFFLINE';
            } else if (error.code === 'failed-precondition') {
                code = 'INDEX_REQUIRED';
            } else if (error.code === 'invalid-argument') {
                code = 'INVALID_QUERY';
            }

            return {
                success: false,
                error: error.message,
                code,
                data: [] // Always return empty array on error for safe iteration
            };
        }
    }

    /**
     * Update an existing entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async update(collection, id, updates) {
        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User must be authenticated to update entities');
            }

            // Check permissions
            const hasPermission = await this.permissionManager.canEdit(collection, id, user.uid);
            if (!hasPermission) {
                throw new Error('You do not have permission to edit this entity');
            }

            // Validate updates
            const validation = this.validator.validateUpdate(updates, collection);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Add update metadata
            const enrichedUpdates = {
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
                updatedByEmail: user.email,
                version: firebase.firestore.FieldValue.increment(1)
            };

            // Update document
            await this.db.collection(collection).doc(id).update(enrichedUpdates);

            console.log(`[CRUD] Updated ${collection} entity:`, id);

            // Track contribution
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackContributionAction('edit', collection, id);
            }

            return {
                success: true
            };

        } catch (error) {
            console.error('[CRUD] Update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete an entity (soft delete by default)
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {boolean} hardDelete - If true, permanently delete
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async delete(collection, id, hardDelete = false) {
        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User must be authenticated to delete entities');
            }

            // Check permissions
            const hasPermission = await this.permissionManager.canDelete(collection, id, user.uid);
            if (!hasPermission) {
                throw new Error('You do not have permission to delete this entity');
            }

            const docRef = this.db.collection(collection).doc(id);

            if (hardDelete) {
                // Permanently delete
                await docRef.delete();
                console.log(`[CRUD] Hard deleted ${collection} entity:`, id);
            } else {
                // Soft delete
                await docRef.update({
                    status: 'deleted',
                    deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    deletedBy: user.uid,
                    deletedByEmail: user.email
                });
                console.log(`[CRUD] Soft deleted ${collection} entity:`, id);
            }

            // Track contribution
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackContributionAction('delete', collection, id);
            }

            return {
                success: true
            };

        } catch (error) {
            console.error('[CRUD] Delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Restore a soft-deleted entity
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async restore(collection, id) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('User must be authenticated to restore entities');
            }

            const hasPermission = await this.permissionManager.canEdit(collection, id, user.uid);
            if (!hasPermission) {
                throw new Error('You do not have permission to restore this entity');
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

            return {
                success: true
            };

        } catch (error) {
            console.error('[CRUD] Restore error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

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
                error: 'User not authenticated'
            };
        }

        return this.readMany(collection, {
            ...options,
            where: [
                ...(options.where || []),
                ['createdBy', '==', user.uid]
            ]
        });
    }
}


/**
 * Entity Validator
 * Validates entity data according to schema requirements
 */
class EntityValidator {
    constructor() {
        this.schemas = {
            deities: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'domains', 'symbols', 'family', 'attributes']
            },
            creatures: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'habitat', 'abilities']
            },
            heroes: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'quests', 'weapons']
            },
            items: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'powers', 'owner']
            },
            places: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'significance', 'inhabitants']
            },
            texts: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'author', 'date', 'content']
            },
            rituals: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'purpose', 'steps', 'offerings']
            },
            herbs: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'uses', 'preparation']
            },
            symbols: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'meaning', 'usage']
            },
            concepts: {
                required: ['name', 'mythology', 'type'],
                optional: ['description', 'significance']
            }
        };
    }

    /**
     * Validate entity data
     * @param {Object} data - Entity data
     * @param {string} collection - Collection name
     * @returns {{valid: boolean, errors: Array<string>}}
     */
    validate(data, collection) {
        const errors = [];
        const schema = this.schemas[collection];

        if (!schema) {
            errors.push(`Unknown collection: ${collection}`);
            return { valid: false, errors };
        }

        // Check required fields
        schema.required.forEach(field => {
            if (!data[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate field types
        if (data.name && typeof data.name !== 'string') {
            errors.push('Name must be a string');
        }

        if (data.mythology && typeof data.mythology !== 'string') {
            errors.push('Mythology must be a string');
        }

        if (data.type && typeof data.type !== 'string') {
            errors.push('Type must be a string');
        }

        // Validate arrays
        const arrayFields = ['domains', 'symbols', 'abilities', 'quests', 'weapons', 'powers'];
        arrayFields.forEach(field => {
            if (data[field] && !Array.isArray(data[field])) {
                errors.push(`${field} must be an array`);
            }
        });

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

        // Don't allow changing immutable fields
        const immutableFields = ['id', 'createdBy', 'createdAt', 'createdByEmail', 'createdByName'];
        immutableFields.forEach(field => {
            if (updates.hasOwnProperty(field)) {
                errors.push(`Cannot update immutable field: ${field}`);
            }
        });

        // Validate types for provided fields
        if (updates.name && typeof updates.name !== 'string') {
            errors.push('Name must be a string');
        }

        if (updates.mythology && typeof updates.mythology !== 'string') {
            errors.push('Mythology must be a string');
        }

        const arrayFields = ['domains', 'symbols', 'abilities', 'quests', 'weapons', 'powers'];
        arrayFields.forEach(field => {
            if (updates[field] && !Array.isArray(updates[field])) {
                errors.push(`${field} must be an array`);
            }
        });

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
            'andrewkwatts@gmail.com' // Add admin emails here
        ];
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
        // Admins can edit anything
        if (await this.isAdmin(uid)) {
            return true;
        }

        // Users can edit their own entities
        const db = firebase.firestore();
        const doc = await db.collection(collection).doc(id).get();

        if (!doc.exists) return false;

        const data = doc.data();
        return data.createdBy === uid;
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
        // All authenticated users can read active entities
        const db = firebase.firestore();
        const doc = await db.collection(collection).doc(id).get();

        if (!doc.exists) return false;

        const data = doc.data();

        // Anyone can read active entities
        if (data.status === 'active') return true;

        // Only owner and admins can read deleted entities
        if (data.status === 'deleted') {
            return data.createdBy === uid || await this.isAdmin(uid);
        }

        return false;
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
}
