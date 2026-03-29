/**
 * Asset Service
 * Handles querying standard and user-contributed assets from Firebase
 *
 * Features:
 * - Query standard assets from standard_assets collection
 * - Query user assets from user_assets/{userId}/{type}
 * - Merge and mark assets by source (standard vs community)
 * - Respect user preferences for content filtering
 * - Cache results to minimize Firebase reads
 *
 * Usage:
 *   import { AssetService } from './asset-service.js';
 *   const service = new AssetService();
 *   const assets = await service.getAssets('deities', { mythology: 'greek', includeUserContent: true });
 */

class AssetService {
    constructor() {
        try {
            this.db = firebase.firestore();
        } catch (e) {
            console.error('[AssetService] Failed to get Firestore instance:', e);
            this.db = null;
        }
        this.cache = window.cacheManager || null;

        // Cache for queries
        this.queryCache = new Map();
        this.cacheTimestamp = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes

        // Collection name mapping (URL category → Firebase collection)
        // This handles cases where the URL uses a different name than the Firebase collection
        this.collectionMap = {
            'archetypes': 'concepts',    // archetypes maps to concepts collection
            'cosmologies': 'cosmology',  // plural to singular
        };
    }

    /**
     * Get the actual Firebase collection name for a category
     * @param {string} category - URL category name
     * @returns {string} Firebase collection name
     */
    getCollectionName(category) {
        return this.collectionMap[category] || category;
    }

    /**
     * Get assets for a category with optional filters
     * @param {string} type - Asset type (deities, heroes, creatures, etc.)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of assets
     */
    async getAssets(type, options = {}) {
        const {
            mythology = null,
            includeUserContent = false,
            orderBy = 'name',
            limit = 500
        } = options;

        // Build cache key
        const cacheKey = this.buildCacheKey(type, mythology, includeUserContent, orderBy, limit);

        // Check cache
        if (this.isCacheValid(cacheKey)) {
            console.log(`[AssetService] Returning cached ${type}`);
            return this.queryCache.get(cacheKey);
        }

        console.log(`[AssetService] Fetching ${type} (includeUserContent: ${includeUserContent})`);

        try {
            // Fetch standard assets
            const standardAssets = await this.getStandardAssets(type, { mythology, orderBy, limit });

            // If not including user content, return standard assets only
            if (!includeUserContent) {
                const result = standardAssets.map(asset => ({
                    ...asset,
                    isStandard: true,
                    source: 'standard'
                }));

                this.setCacheValue(cacheKey, result);
                return result;
            }

            // Fetch user assets
            const userAssets = await this.getUserAssets(type, { mythology, limit });

            // Merge assets
            const mergedAssets = [
                ...standardAssets.map(asset => ({
                    ...asset,
                    isStandard: true,
                    source: 'standard'
                })),
                ...userAssets.map(asset => ({
                    ...asset,
                    isStandard: false,
                    source: 'community',
                    userId: asset.userId || asset.authorId || asset.contributedBy
                }))
            ];

            // Deduplicate by entity id, preferring standard assets
            const seen = new Map();
            for (const asset of mergedAssets) {
                if (!asset.id) continue;
                const existing = seen.get(asset.id);
                if (!existing || (asset.isStandard && !existing.isStandard)) {
                    seen.set(asset.id, asset);
                }
            }
            const allAssets = Array.from(seen.values());

            // Sort merged assets
            allAssets.sort((a, b) => {
                // Standard assets come first
                if (a.isStandard !== b.isStandard) {
                    return a.isStandard ? -1 : 1;
                }

                // Then sort by orderBy field
                if (orderBy === 'name') {
                    return (a.name || '').localeCompare(b.name || '');
                } else if (orderBy === 'dateAdded') {
                    return (b.dateAdded || 0) - (a.dateAdded || 0);
                }

                return 0;
            });

            // Cache and return
            this.setCacheValue(cacheKey, allAssets);
            return allAssets;

        } catch (error) {
            console.error(`[AssetService] Error fetching ${type}:`, error);
            throw error;
        }
    }

    /**
     * Get standard assets from standard_assets collection
     */
    async getStandardAssets(type, options = {}) {
        const { mythology = null, orderBy = 'name', limit = 500 } = options;

        if (!this.db) {
            console.error(`[AssetService] No Firestore instance available for ${type}`);
            throw new Error('Firestore not initialized');
        }

        // Map URL category to Firebase collection name
        const collectionName = this.getCollectionName(type);
        console.log(`[AssetService] Querying "${collectionName}" (from "${type}"), orderBy="${orderBy}", limit=${limit}${mythology ? `, mythology="${mythology}"` : ''}`);

        // Try cache manager first, fall through to direct query on failure
        if (this.cache) {
            try {
                const query = mythology ? { mythology } : {};
                const cached = await this.cache.getList(collectionName, query, {
                    ttl: this.cache.defaultTTL[collectionName] || 3600000,
                    orderBy: `${orderBy} asc`,
                    limit
                });
                if (cached && cached.length > 0) {
                    console.log(`[AssetService] Cache hit: ${cached.length} ${type}`);
                    return cached;
                }
                console.log(`[AssetService] Cache empty for ${type}, trying direct query`);
            } catch (cacheError) {
                console.warn(`[AssetService] Cache error for ${type}:`, cacheError.message, '- trying direct query');
            }
        }

        // Direct Firebase query (primary path when cache misses or unavailable)
        let query = this.db.collection(collectionName);

        if (mythology) {
            query = query.where('mythology', '==', mythology);
        }

        // Try with orderBy first, fall back to unordered if index is missing
        try {
            const orderedQuery = query.orderBy(orderBy).limit(limit);
            const snapshot = await orderedQuery.get();
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`[AssetService] Direct query: ${results.length} ${type}`);
            return results;
        } catch (orderError) {
            console.warn(`[AssetService] Ordered query failed for ${type}:`, orderError.code || orderError.message);

            // Fallback: query without orderBy (works without composite index)
            try {
                const fallbackQuery = query.limit(limit);
                const snapshot = await fallbackQuery.get();
                const results = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort client-side
                results.sort((a, b) => (a[orderBy] || '').localeCompare(b[orderBy] || ''));
                console.log(`[AssetService] Fallback query: ${results.length} ${type} (sorted client-side)`);
                return results;
            } catch (fallbackError) {
                console.error(`[AssetService] All queries failed for ${type}:`, fallbackError);
                throw fallbackError;
            }
        }
    }

    /**
     * Get user-contributed assets using collectionGroup
     */
    async getUserAssets(type, options = {}) {
        const { mythology = null, limit = 500 } = options;

        // Map URL category to Firebase collection name
        const collectionName = this.getCollectionName(type);

        try {
            // Query using collectionGroup to get all user assets across all users
            let query = this.db.collectionGroup(collectionName)
                .where('isPublic', '==', true);

            if (mythology) {
                query = query.where('mythology', '==', mythology);
            }

            query = query.limit(limit);

            const snapshot = await query.get();

            return snapshot.docs.map(doc => {
                // Extract userId from document path
                // Path format: user_assets/{userId}/{type}/{docId}
                const pathSegments = doc.ref.path.split('/');
                const userId = pathSegments.length >= 2 ? pathSegments[1] : null;

                return {
                    id: doc.id,
                    userId,
                    ...doc.data()
                };
            });

        } catch (error) {
            console.error(`[AssetService] Error fetching user ${type}:`, error);
            return [];
        }
    }

    /**
     * Get count of user assets for a category
     */
    async getUserAssetCount(type, mythology = null) {
        try {
            let query = this.db.collectionGroup(type)
                .where('isPublic', '==', true);

            if (mythology) {
                query = query.where('mythology', '==', mythology);
            }

            const snapshot = await query.count().get();
            return snapshot.data().count;

        } catch (error) {
            console.error(`[AssetService] Error counting user ${type}:`, error);
            return 0;
        }
    }

    /**
     * Get single asset by ID
     */
    async getAsset(type, id, options = {}) {
        const { checkUserAssets = true } = options;

        try {
            // Try standard assets first
            const standardDoc = await this.db.collection(type).doc(id).get();

            if (standardDoc.exists) {
                return {
                    id: standardDoc.id,
                    ...standardDoc.data(),
                    isStandard: true,
                    source: 'standard'
                };
            }

            // If not found in standard and checkUserAssets is true, search user assets
            if (checkUserAssets) {
                const userQuery = this.db.collectionGroup(type)
                    .where('id', '==', id)
                    .where('isPublic', '==', true)
                    .limit(1);

                const userSnapshot = await userQuery.get();

                if (!userSnapshot.empty) {
                    const doc = userSnapshot.docs[0];
                    const pathSegments = doc.ref.path.split('/');
                    const userId = pathSegments.length >= 2 ? pathSegments[1] : null;

                    return {
                        id: doc.id,
                        userId,
                        ...doc.data(),
                        isStandard: false,
                        source: 'community'
                    };
                }
            }

            return null;

        } catch (error) {
            console.error(`[AssetService] Error fetching asset ${type}/${id}:`, error);
            return null;
        }
    }

    /**
     * Build cache key for query
     */
    buildCacheKey(type, mythology, includeUserContent, orderBy, limit) {
        return `${type}|${mythology || 'all'}|${includeUserContent}|${orderBy}|${limit}`;
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(cacheKey) {
        if (!this.queryCache.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamp.get(cacheKey);
        if (!timestamp) {
            return false;
        }

        return (Date.now() - timestamp) < this.cacheDuration;
    }

    /**
     * Set cache value
     */
    setCacheValue(cacheKey, value) {
        this.queryCache.set(cacheKey, value);
        this.cacheTimestamp.set(cacheKey, Date.now());
    }

    /**
     * Clear cache for a specific query or all queries
     */
    clearCache(cacheKey = null) {
        if (cacheKey) {
            this.queryCache.delete(cacheKey);
            this.cacheTimestamp.delete(cacheKey);
        } else {
            this.queryCache.clear();
            this.cacheTimestamp.clear();
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.queryCache.size,
            keys: Array.from(this.queryCache.keys()),
            cacheDuration: this.cacheDuration
        };
    }
}

// Global export for browser usage
if (typeof window !== 'undefined') {
    window.AssetService = AssetService;
}

// CommonJS export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetService;
}
