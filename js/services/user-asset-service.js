/**
 * User Asset Service
 * Handles Firebase CRUD operations for user-created assets
 * Stores in user_assets collection separate from standard assets
 */

class UserAssetService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.crudManager = null;
        this.initialized = false;
    }

    /**
     * Initialize service
     */
    async init() {
        if (this.initialized) return;

        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined') {
            console.error('[UserAssetService] Firebase not loaded');
            return;
        }

        this.db = firebase.firestore();
        this.auth = firebase.auth();

        // Wait for auth to be ready
        await new Promise(resolve => {
            const unsubscribe = this.auth.onAuthStateChanged(() => {
                unsubscribe();
                resolve();
            });
        });

        // Initialize CRUD manager
        if (window.FirebaseCRUDManager) {
            this.crudManager = new window.FirebaseCRUDManager(this.db, this.auth);
        }

        this.initialized = true;
        console.log('[UserAssetService] Initialized');
    }

    /**
     * Create a new user asset
     * @param {string} type - Asset type (deities, creatures, etc.)
     * @param {Object} data - Asset data
     * @returns {Promise<{success: boolean, id?: string, data?: Object, error?: string}>}
     */
    async createAsset(type, data) {
        await this.init();

        try {
            // Check authentication
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to create assets');
            }

            // Validate required fields
            const validation = this.validateAssetData(type, data);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Prepare asset data
            const assetData = {
                ...data,
                type: type.slice(0, -1), // Remove plural (deities -> deity)
                createdBy: user.uid,
                createdByEmail: user.email,
                createdByName: user.displayName || user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                visibility: data.visibility || 'public',
                version: 1,
                likes: 0,
                views: 0
            };

            // Generate ID
            const assetRef = this.db.collection('user_assets').doc();
            const assetId = assetRef.id;

            // Save to user_assets collection
            await assetRef.set(assetData);

            console.log(`[UserAssetService] Created ${type} asset:`, assetId);

            // Track in user's contributions
            await this.trackContribution(user.uid, type, assetId);

            // Track analytics
            if (window.AnalyticsManager) {
                window.AnalyticsManager.trackContributionAction('create', type, assetId);
            }

            return {
                success: true,
                id: assetId,
                data: assetData
            };

        } catch (error) {
            console.error('[UserAssetService] Create error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update an existing user asset
     * @param {string} assetId - Asset ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateAsset(assetId, updates) {
        await this.init();

        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to update assets');
            }

            // Check ownership
            const assetRef = this.db.collection('user_assets').doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                throw new Error('Asset not found');
            }

            const assetData = assetDoc.data();

            // Only owner can update
            if (assetData.createdBy !== user.uid) {
                throw new Error('You do not have permission to edit this asset');
            }

            // Prepare updates
            const updateData = {
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: user.uid,
                version: firebase.firestore.FieldValue.increment(1)
            };

            // Don't allow changing ownership fields
            delete updateData.createdBy;
            delete updateData.createdByEmail;
            delete updateData.createdByName;
            delete updateData.createdAt;

            await assetRef.update(updateData);

            console.log(`[UserAssetService] Updated asset:`, assetId);

            return { success: true };

        } catch (error) {
            console.error('[UserAssetService] Update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete a user asset (soft delete)
     * @param {string} assetId - Asset ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteAsset(assetId) {
        await this.init();

        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to delete assets');
            }

            // Check ownership
            const assetRef = this.db.collection('user_assets').doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                throw new Error('Asset not found');
            }

            const assetData = assetDoc.data();

            if (assetData.createdBy !== user.uid) {
                throw new Error('You do not have permission to delete this asset');
            }

            // Soft delete
            await assetRef.update({
                status: 'deleted',
                deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deletedBy: user.uid
            });

            console.log(`[UserAssetService] Deleted asset:`, assetId);

            return { success: true };

        } catch (error) {
            console.error('[UserAssetService] Delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's created assets
     * @param {string} type - Optional asset type filter
     * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
     */
    async getMyAssets(type = null) {
        await this.init();

        try {
            const user = this.auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: 'Not authenticated'
                };
            }

            let query = this.db.collection('user_assets')
                .where('createdBy', '==', user.uid)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc');

            if (type) {
                query = query.where('type', '==', type);
            }

            const snapshot = await query.get();

            const assets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                success: true,
                data: assets
            };

        } catch (error) {
            console.error('[UserAssetService] Get my assets error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get public user assets
     * @param {string} type - Asset type
     * @param {string} mythology - Optional mythology filter
     * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
     */
    async getPublicAssets(type, mythology = null) {
        await this.init();

        try {
            let query = this.db.collection('user_assets')
                .where('type', '==', type)
                .where('status', '==', 'active')
                .where('visibility', '==', 'public')
                .orderBy('createdAt', 'desc')
                .limit(100);

            if (mythology) {
                query = query.where('mythology', '==', mythology);
            }

            const snapshot = await query.get();

            const assets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isUserSubmitted: true // Flag to distinguish from official content
            }));

            return {
                success: true,
                data: assets
            };

        } catch (error) {
            console.error('[UserAssetService] Get public assets error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get a single asset by ID
     * @param {string} assetId - Asset ID
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async getAsset(assetId) {
        await this.init();

        try {
            const assetRef = this.db.collection('user_assets').doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                throw new Error('Asset not found');
            }

            const assetData = {
                id: assetDoc.id,
                ...assetDoc.data(),
                isUserSubmitted: true
            };

            // Check visibility
            const user = this.auth.currentUser;
            if (assetData.visibility === 'private' && (!user || assetData.createdBy !== user.uid)) {
                throw new Error('You do not have permission to view this asset');
            }

            // Increment view count
            assetRef.update({
                views: firebase.firestore.FieldValue.increment(1)
            }).catch(err => console.error('Failed to increment views:', err));

            return {
                success: true,
                data: assetData
            };

        } catch (error) {
            console.error('[UserAssetService] Get asset error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Like/unlike an asset
     * @param {string} assetId - Asset ID
     * @returns {Promise<{success: boolean, liked?: boolean, error?: string}>}
     */
    async toggleLike(assetId) {
        await this.init();

        try {
            const user = this.auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to like assets');
            }

            const assetRef = this.db.collection('user_assets').doc(assetId);
            const userLikesRef = this.db.collection('users').doc(user.uid)
                .collection('liked_assets').doc(assetId);

            const likeDoc = await userLikesRef.get();
            const isLiked = likeDoc.exists;

            if (isLiked) {
                // Unlike
                await userLikesRef.delete();
                await assetRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
                return { success: true, liked: false };
            } else {
                // Like
                await userLikesRef.set({
                    likedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await assetRef.update({
                    likes: firebase.firestore.FieldValue.increment(1)
                });
                return { success: true, liked: true };
            }

        } catch (error) {
            console.error('[UserAssetService] Toggle like error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track contribution in user's profile
     */
    async trackContribution(userId, type, assetId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const contributionsRef = userRef.collection('contributions').doc(assetId);

            await contributionsRef.set({
                type: type,
                assetId: assetId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update contribution count
            await userRef.update({
                [`contributionCounts.${type}`]: firebase.firestore.FieldValue.increment(1),
                'contributionCounts.total': firebase.firestore.FieldValue.increment(1)
            });

        } catch (error) {
            console.error('[UserAssetService] Track contribution error:', error);
            // Don't fail the whole operation if tracking fails
        }
    }

    /**
     * Validate asset data
     */
    validateAssetData(type, data) {
        const errors = [];

        // Required fields for all types
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Name is required');
        }

        if (!data.mythology || data.mythology.trim().length === 0) {
            errors.push('Mythology is required');
        }

        if (!data.description || data.description.trim().length < 50) {
            errors.push('Description must be at least 50 characters');
        }

        if (data.description && data.description.length > 5000) {
            errors.push('Description must be less than 5000 characters');
        }

        // Name length
        if (data.name && data.name.length > 100) {
            errors.push('Name must be less than 100 characters');
        }

        // URL validation
        if (data.imageUrl) {
            try {
                new URL(data.imageUrl);
            } catch {
                errors.push('Image URL is not valid');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Create global instance
window.userAssetService = new UserAssetService();

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    window.userAssetService.init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            window.userAssetService.init();
        }
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserAssetService;
}
