/**
 * Deletion & AI Recovery Service
 * Eyes of Azrael Project
 *
 * Provides soft delete functionality with AI auto-population for deleted content.
 * When an asset is deleted, it preserves core identity and generates placeholder
 * content for community to rebuild.
 *
 * Features:
 * - Soft delete system with restore capability
 * - Hard delete for admins only
 * - AI auto-population on delete (preserves core identity)
 * - Asset history tracking
 * - Contributor notification system
 * - Display banner generation for deleted/auto-populated content
 *
 * Firestore Structure:
 * - Field: deleted: true, deletedAt, deletedBy, deleteReason
 * - Field: autoPopulated: true, autoPopulatedAt
 * - Field: ownershipStatus: 'unclaimed' | 'claimed' | 'standard'
 * - Collection: deleted_asset_history (audit trail)
 *
 * @requires Firebase Firestore
 */

class DeletionRecoveryService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Admin email for hard delete authorization
        this.adminEmail = 'andrewkwatts@gmail.com';

        // Collection name mapping (same as asset-service)
        this.collectionMap = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'item': 'items',
            'place': 'places',
            'text': 'texts',
            'ritual': 'rituals',
            'symbol': 'symbols',
            'concept': 'concepts',
            'herb': 'herbs',
            'magic': 'magic',
            'mythology': 'mythologies',
            'archetypes': 'concepts'
        };

        // AI prompt templates for placeholder generation
        this.aiPrompts = {
            deity: this._getDeityPrompt.bind(this),
            hero: this._getHeroPrompt.bind(this),
            creature: this._getCreaturePrompt.bind(this),
            item: this._getItemPrompt.bind(this),
            place: this._getPlacePrompt.bind(this),
            text: this._getTextPrompt.bind(this),
            ritual: this._getRitualPrompt.bind(this),
            symbol: this._getSymbolPrompt.bind(this),
            concept: this._getConceptPrompt.bind(this),
            herb: this._getHerbPrompt.bind(this),
            default: this._getDefaultPrompt.bind(this)
        };
    }

    /**
     * Initialize the service
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined') {
                console.error('[DeletionRecoveryService] Firebase not loaded');
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;

            console.log('[DeletionRecoveryService] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[DeletionRecoveryService] Initialization error:', error);
            return false;
        }
    }

    /**
     * Ensure service is initialized
     */
    async ensureInit() {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) {
                throw new Error('Deletion recovery service not initialized');
            }
        }
    }

    /**
     * Check if current user is admin
     * @returns {boolean}
     */
    isAdmin() {
        const user = this.auth?.currentUser;
        return user?.email === this.adminEmail;
    }

    /**
     * Get collection name from asset type
     * @param {string} type - Asset type
     * @returns {string} Collection name
     */
    getCollectionName(type) {
        return this.collectionMap[type] || type;
    }

    // ==================== SOFT DELETE ====================

    /**
     * Soft delete an asset - marks as deleted without removing
     * Triggers AI auto-population to generate placeholder content
     *
     * @param {string} assetId - Asset document ID
     * @param {string} collectionName - Collection name (e.g., 'deities')
     * @param {string} reason - Reason for deletion
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Result with success status
     */
    async softDelete(assetId, collectionName, reason = '', options = {}) {
        await this.ensureInit();

        const user = this.auth.currentUser;
        if (!user) {
            return { success: false, error: 'You must be logged in to delete content' };
        }

        try {
            const assetRef = this.db.collection(collectionName).doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                return { success: false, error: 'Asset not found' };
            }

            const assetData = { id: assetDoc.id, ...assetDoc.data() };

            // Check ownership or admin status
            const isOwner = assetData.contributedBy === user.uid ||
                           assetData.userId === user.uid ||
                           assetData.authorId === user.uid;
            const isAdminUser = this.isAdmin();

            if (!isOwner && !isAdminUser) {
                return { success: false, error: 'You can only delete your own content' };
            }

            // Create history record before deletion
            await this._createHistoryRecord(assetId, collectionName, assetData, 'soft_delete', user.uid, reason);

            // Generate placeholder content if requested (default: true)
            const generatePlaceholder = options.generatePlaceholder !== false;
            let placeholderContent = null;

            if (generatePlaceholder) {
                placeholderContent = await this.generatePlaceholderContent(assetData, collectionName);
            }

            // Prepare deletion update
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const deleteUpdate = {
                // Deletion metadata
                deleted: true,
                deletedAt: timestamp,
                deletedBy: user.uid,
                deletedByName: user.displayName || user.email,
                deleteReason: this._sanitizeText(reason),

                // Ownership
                ownershipStatus: 'unclaimed',
                previousOwner: assetData.contributedBy || assetData.userId || null,

                // Status tracking
                needsCommunityUpdate: true,
                lastMajorUpdate: timestamp
            };

            // If generating placeholder, add auto-population fields
            if (placeholderContent) {
                Object.assign(deleteUpdate, {
                    autoPopulated: true,
                    autoPopulatedAt: timestamp,
                    autoPopulatedVersion: 1,

                    // Clear user-generated content
                    description: placeholderContent.description,
                    shortDescription: placeholderContent.shortDescription,

                    // Preserve sections array but mark as placeholder
                    sections: placeholderContent.sections || [],

                    // Clear perspectives/notes (they belong to original author)
                    // perspectives: [],
                    // personalNotes: []
                });

                // Store original content reference (for recovery)
                deleteUpdate.originalContentRef = {
                    hadDescription: !!assetData.description,
                    hadSections: !!(assetData.sections && assetData.sections.length > 0),
                    sectionCount: assetData.sections?.length || 0
                };
            }

            // Update the asset
            await assetRef.update(deleteUpdate);

            // Mark asset as pending community update
            await this.markAsPendingUpdate(assetId, collectionName);

            // Notify past contributors (async, don't wait)
            this._notifyContributorsAsync(assetId, collectionName, assetData);

            // Log the action
            await this._logAction('soft_delete', {
                assetId,
                collectionName,
                reason,
                generatePlaceholder,
                userId: user.uid
            });

            console.log(`[DeletionRecoveryService] Soft deleted: ${collectionName}/${assetId}`);

            return {
                success: true,
                message: 'Asset deleted successfully. Placeholder content has been generated.',
                assetId,
                placeholderGenerated: !!placeholderContent
            };

        } catch (error) {
            console.error('[DeletionRecoveryService] Soft delete error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== HARD DELETE ====================

    /**
     * Hard delete an asset - permanently removes from database
     * Admin only operation
     *
     * @param {string} assetId - Asset document ID
     * @param {string} collectionName - Collection name
     * @returns {Promise<Object>} Result with success status
     */
    async hardDelete(assetId, collectionName) {
        await this.ensureInit();

        if (!this.isAdmin()) {
            return { success: false, error: 'Admin access required for permanent deletion' };
        }

        const user = this.auth.currentUser;

        try {
            const assetRef = this.db.collection(collectionName).doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                return { success: false, error: 'Asset not found' };
            }

            const assetData = { id: assetDoc.id, ...assetDoc.data() };

            // Create final history record
            await this._createHistoryRecord(assetId, collectionName, assetData, 'hard_delete', user.uid, 'Permanent deletion by admin');

            // Archive full data to deleted_assets collection before removing
            await this.db.collection('deleted_assets').doc(`${collectionName}_${assetId}`).set({
                ...assetData,
                _deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                _deletedBy: user.uid,
                _originalCollection: collectionName,
                _deletionType: 'hard_delete'
            });

            // Delete the document
            await assetRef.delete();

            // Log the action
            await this._logAction('hard_delete', {
                assetId,
                collectionName,
                userId: user.uid
            });

            console.log(`[DeletionRecoveryService] Hard deleted: ${collectionName}/${assetId}`);

            return {
                success: true,
                message: 'Asset permanently deleted',
                assetId
            };

        } catch (error) {
            console.error('[DeletionRecoveryService] Hard delete error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== RESTORE ====================

    /**
     * Restore a soft-deleted asset
     *
     * @param {string} assetId - Asset document ID
     * @param {string} collectionName - Collection name
     * @param {Object} options - Restore options
     * @returns {Promise<Object>} Result with success status
     */
    async restore(assetId, collectionName, options = {}) {
        await this.ensureInit();

        const user = this.auth.currentUser;
        if (!user) {
            return { success: false, error: 'You must be logged in to restore content' };
        }

        try {
            const assetRef = this.db.collection(collectionName).doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                return { success: false, error: 'Asset not found' };
            }

            const assetData = assetDoc.data();

            // Check if asset is actually deleted
            if (!assetData.deleted) {
                return { success: false, error: 'Asset is not deleted' };
            }

            // Check permissions - original owner, admin, or restore with new ownership
            const isOriginalOwner = assetData.previousOwner === user.uid;
            const isAdminUser = this.isAdmin();
            const claimOwnership = options.claimOwnership === true;

            if (!isOriginalOwner && !isAdminUser && !claimOwnership) {
                return { success: false, error: 'You can only restore your own content or claim ownership' };
            }

            // Get original content from history if available
            let originalContent = null;
            if (options.restoreOriginalContent) {
                originalContent = await this._getOriginalContent(assetId, collectionName);
            }

            // Prepare restore update
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const restoreUpdate = {
                deleted: false,
                deletedAt: firebase.firestore.FieldValue.delete(),
                deletedBy: firebase.firestore.FieldValue.delete(),
                deletedByName: firebase.firestore.FieldValue.delete(),
                deleteReason: firebase.firestore.FieldValue.delete(),

                restoredAt: timestamp,
                restoredBy: user.uid,
                restoredByName: user.displayName || user.email,

                lastMajorUpdate: timestamp
            };

            // Handle ownership
            if (claimOwnership || !isOriginalOwner) {
                restoreUpdate.ownershipStatus = 'claimed';
                restoreUpdate.contributedBy = user.uid;
                restoreUpdate.contributorName = user.displayName || 'Anonymous';
            } else {
                restoreUpdate.ownershipStatus = assetData.previousOwner ? 'claimed' : 'standard';
            }

            // If restoring original content
            if (originalContent) {
                if (originalContent.description) {
                    restoreUpdate.description = originalContent.description;
                }
                if (originalContent.shortDescription) {
                    restoreUpdate.shortDescription = originalContent.shortDescription;
                }
                if (originalContent.sections) {
                    restoreUpdate.sections = originalContent.sections;
                }

                // Clear auto-populated flags
                restoreUpdate.autoPopulated = false;
                restoreUpdate.needsCommunityUpdate = false;
            }

            // Update the asset
            await assetRef.update(restoreUpdate);

            // Create history record
            await this._createHistoryRecord(assetId, collectionName, assetData, 'restore', user.uid, options.restoreReason || 'Content restored');

            // Log the action
            await this._logAction('restore', {
                assetId,
                collectionName,
                userId: user.uid,
                claimedOwnership: claimOwnership,
                restoredOriginal: !!originalContent
            });

            console.log(`[DeletionRecoveryService] Restored: ${collectionName}/${assetId}`);

            return {
                success: true,
                message: 'Asset restored successfully',
                assetId,
                newOwner: claimOwnership ? user.uid : (assetData.previousOwner || null)
            };

        } catch (error) {
            console.error('[DeletionRecoveryService] Restore error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get list of deleted assets with filters
     *
     * @param {Object} filters - Query filters
     * @returns {Promise<Array>} Array of deleted assets
     */
    async getDeletedAssets(filters = {}) {
        await this.ensureInit();

        const {
            collectionName = null,
            deletedBy = null,
            dateFrom = null,
            dateTo = null,
            autoPopulated = null,
            ownershipStatus = null,
            limit = 50,
            orderBy = 'deletedAt',
            orderDirection = 'desc'
        } = filters;

        try {
            const results = [];

            // If specific collection provided, query that
            // Otherwise, query across all mapped collections
            const collectionsToQuery = collectionName
                ? [collectionName]
                : Object.values(this.collectionMap);

            // Remove duplicates
            const uniqueCollections = [...new Set(collectionsToQuery)];

            for (const collection of uniqueCollections) {
                try {
                    let query = this.db.collection(collection)
                        .where('deleted', '==', true);

                    if (deletedBy) {
                        query = query.where('deletedBy', '==', deletedBy);
                    }

                    if (autoPopulated !== null) {
                        query = query.where('autoPopulated', '==', autoPopulated);
                    }

                    if (ownershipStatus) {
                        query = query.where('ownershipStatus', '==', ownershipStatus);
                    }

                    // Note: Date filtering would require compound indexes
                    // For simplicity, we'll filter in memory
                    query = query.limit(limit);

                    const snapshot = await query.get();

                    snapshot.docs.forEach(doc => {
                        const data = doc.data();

                        // Date filtering (in memory)
                        if (dateFrom && data.deletedAt) {
                            const deletedDate = data.deletedAt.toDate ? data.deletedAt.toDate() : new Date(data.deletedAt);
                            if (deletedDate < new Date(dateFrom)) return;
                        }
                        if (dateTo && data.deletedAt) {
                            const deletedDate = data.deletedAt.toDate ? data.deletedAt.toDate() : new Date(data.deletedAt);
                            if (deletedDate > new Date(dateTo)) return;
                        }

                        results.push({
                            id: doc.id,
                            collection: collection,
                            ...data
                        });
                    });
                } catch (collectionError) {
                    console.warn(`[DeletionRecoveryService] Error querying ${collection}:`, collectionError);
                }
            }

            // Sort results
            results.sort((a, b) => {
                const aVal = a[orderBy];
                const bVal = b[orderBy];

                if (!aVal) return 1;
                if (!bVal) return -1;

                const aDate = aVal.toDate ? aVal.toDate() : new Date(aVal);
                const bDate = bVal.toDate ? bVal.toDate() : new Date(bVal);

                return orderDirection === 'desc' ? bDate - aDate : aDate - bDate;
            });

            return results.slice(0, limit);

        } catch (error) {
            console.error('[DeletionRecoveryService] Error fetching deleted assets:', error);
            return [];
        }
    }

    /**
     * Get full history for an asset
     *
     * @param {string} assetId - Asset document ID
     * @param {string} collectionName - Collection name (optional, searches all if not provided)
     * @returns {Promise<Array>} Array of history records
     */
    async getAssetHistory(assetId, collectionName = null) {
        await this.ensureInit();

        try {
            let query = this.db.collection('deleted_asset_history')
                .where('assetId', '==', assetId);

            if (collectionName) {
                query = query.where('collectionName', '==', collectionName);
            }

            query = query.orderBy('timestamp', 'desc').limit(100);

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('[DeletionRecoveryService] Error fetching asset history:', error);
            return [];
        }
    }

    // ==================== AI PLACEHOLDER GENERATION ====================

    /**
     * Generate placeholder content for a deleted asset
     * Preserves core identity (id, name, type, mythology) and generates
     * basic content based on entity metadata
     *
     * @param {Object} assetData - Original asset data
     * @param {string} collectionName - Collection name
     * @returns {Promise<Object>} Placeholder content
     */
    async generatePlaceholderContent(assetData, collectionName) {
        const {
            id,
            name,
            title,
            type,
            mythology,
            primaryMythology,
            domains,
            symbols,
            entityType
        } = assetData;

        // Determine entity type from collection or field
        const effectiveType = entityType || type || this._getTypeFromCollection(collectionName);
        const effectiveMythology = mythology || primaryMythology || 'Unknown';
        const effectiveName = name || title || 'Unknown Entity';

        // Get type-specific prompt generator
        const promptGenerator = this.aiPrompts[effectiveType] || this.aiPrompts.default;

        // Generate placeholder content
        const placeholder = promptGenerator({
            name: effectiveName,
            mythology: effectiveMythology,
            domains: domains || [],
            symbols: symbols || [],
            type: effectiveType,
            originalData: assetData
        });

        return {
            description: placeholder.description,
            shortDescription: placeholder.shortDescription,
            sections: placeholder.sections,
            placeholderNote: 'This content was deleted and auto-populated. Community contributions are welcome.',
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Mark an asset as pending community update
     *
     * @param {string} assetId - Asset ID
     * @param {string} collectionName - Collection name
     */
    async markAsPendingUpdate(assetId, collectionName) {
        await this.ensureInit();

        try {
            // Add to pending updates queue
            await this.db.collection('pending_community_updates').doc(`${collectionName}_${assetId}`).set({
                assetId,
                collectionName,
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                priority: 'normal',
                status: 'pending',
                updateCount: 0
            });

        } catch (error) {
            console.error('[DeletionRecoveryService] Error marking as pending update:', error);
        }
    }

    /**
     * Notify past contributors about deletion
     *
     * @param {string} assetId - Asset ID
     * @param {string} collectionName - Collection name
     * @param {Object} assetData - Asset data (for context)
     */
    async notifyContributors(assetId, collectionName, assetData) {
        await this.ensureInit();

        try {
            // Get unique contributor IDs
            const contributorIds = new Set();

            // Original author
            if (assetData.contributedBy) contributorIds.add(assetData.contributedBy);
            if (assetData.userId) contributorIds.add(assetData.userId);
            if (assetData.authorId) contributorIds.add(assetData.authorId);

            // Past editors (if tracked)
            if (assetData.editHistory && Array.isArray(assetData.editHistory)) {
                assetData.editHistory.forEach(edit => {
                    if (edit.userId) contributorIds.add(edit.userId);
                });
            }

            // Get perspective authors for this entity
            const perspectivesQuery = await this.db.collection('user_perspectives')
                .where('entityId', '==', assetId)
                .where('entityCollection', '==', collectionName)
                .limit(50)
                .get();

            perspectivesQuery.docs.forEach(doc => {
                const data = doc.data();
                if (data.userId) contributorIds.add(data.userId);
            });

            // Create notifications for each contributor
            const currentUser = this.auth.currentUser;
            const entityName = assetData.name || assetData.title || 'Unknown';

            for (const userId of contributorIds) {
                // Don't notify the person who deleted it
                if (userId === currentUser?.uid) continue;

                await this._createNotification({
                    userId,
                    type: 'asset_deleted',
                    title: 'Content You Contributed To Was Deleted',
                    message: `"${entityName}" was deleted. The content has been auto-populated and is open for community contributions.`,
                    link: `#/${collectionName}/${assetId}`,
                    data: {
                        assetId,
                        collectionName,
                        entityName,
                        action: 'deletion'
                    }
                });
            }

            console.log(`[DeletionRecoveryService] Notified ${contributorIds.size} contributors`);

        } catch (error) {
            console.error('[DeletionRecoveryService] Error notifying contributors:', error);
        }
    }

    // ==================== DISPLAY BANNERS ====================

    /**
     * Get display banner HTML for deleted/auto-populated content
     *
     * @param {Object} assetData - Asset data with deletion metadata
     * @returns {Object} Banner configuration
     */
    getDisplayBanner(assetData) {
        if (!assetData.deleted && !assetData.autoPopulated) {
            return null;
        }

        const banners = [];

        // Deleted content banner
        if (assetData.deleted) {
            const deletedDate = assetData.deletedAt?.toDate
                ? assetData.deletedAt.toDate().toLocaleDateString()
                : 'Unknown date';

            banners.push({
                type: 'warning',
                icon: 'trash',
                title: 'Content Deleted',
                message: `This content was deleted by ${assetData.deletedByName || 'a user'} on ${deletedDate}.`,
                reason: assetData.deleteReason || null,
                actions: [
                    { label: 'Claim Ownership', action: 'claim_ownership', primary: true },
                    { label: 'View History', action: 'view_history' }
                ]
            });
        }

        // Auto-populated content banner
        if (assetData.autoPopulated) {
            banners.push({
                type: 'info',
                icon: 'sparkles',
                title: 'Auto-Generated Content',
                message: 'This content has been auto-populated and needs community updates to reach its full potential.',
                actions: [
                    { label: 'Contribute', action: 'edit_content', primary: true },
                    { label: 'Add Perspective', action: 'add_perspective' }
                ]
            });
        }

        // Unclaimed ownership banner
        if (assetData.ownershipStatus === 'unclaimed') {
            banners.push({
                type: 'opportunity',
                icon: 'hand-raised',
                title: 'Maintainer Needed',
                message: 'This entity is looking for a community member to maintain and improve its content.',
                actions: [
                    { label: 'Become Maintainer', action: 'claim_ownership', primary: true }
                ]
            });
        }

        return {
            hasBanners: banners.length > 0,
            banners,
            html: this._generateBannerHTML(banners)
        };
    }

    /**
     * Generate HTML for display banners
     * @private
     */
    _generateBannerHTML(banners) {
        if (!banners || banners.length === 0) return '';

        const iconMap = {
            'trash': `<svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path></svg>`,
            'sparkles': `<svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"></path><path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"></path></svg>`,
            'hand-raised': `<svg class="banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>`
        };

        const typeClasses = {
            'warning': 'deletion-banner--warning',
            'info': 'deletion-banner--info',
            'opportunity': 'deletion-banner--opportunity'
        };

        return banners.map(banner => `
            <div class="deletion-banner ${typeClasses[banner.type] || ''}">
                <div class="deletion-banner__icon">
                    ${iconMap[banner.icon] || ''}
                </div>
                <div class="deletion-banner__content">
                    <h4 class="deletion-banner__title">${this._escapeHtml(banner.title)}</h4>
                    <p class="deletion-banner__message">${this._escapeHtml(banner.message)}</p>
                    ${banner.reason ? `<p class="deletion-banner__reason">Reason: ${this._escapeHtml(banner.reason)}</p>` : ''}
                </div>
                <div class="deletion-banner__actions">
                    ${(banner.actions || []).map(action => `
                        <button class="deletion-banner__btn ${action.primary ? 'deletion-banner__btn--primary' : ''}"
                                data-action="${action.action}">
                            ${this._escapeHtml(action.label)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // ==================== AI PROMPT TEMPLATES ====================

    _getDeityPrompt(context) {
        const { name, mythology, domains, symbols } = context;
        const domainText = domains.length > 0 ? `associated with ${domains.join(', ')}` : 'with various divine attributes';
        const symbolText = symbols.length > 0 ? `Often depicted with ${symbols.slice(0, 3).join(', ')}.` : '';

        return {
            description: `${name} is a deity from ${mythology} mythology, ${domainText}. This entry is awaiting community contributions to provide a comprehensive overview of this divine figure's role, myths, and worship.

${symbolText}

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A ${mythology} deity ${domainText}. Content pending community contributions.`,

            sections: [
                {
                    title: 'Mythology & Origin',
                    content: 'Information about this deity\'s origins and mythological context is pending. Community members are invited to contribute.',
                    placeholder: true
                },
                {
                    title: 'Attributes & Domains',
                    content: domains.length > 0
                        ? `${name} is associated with: ${domains.join(', ')}. Additional details about these domains are welcome.`
                        : 'Domain information is pending. Please contribute if you have knowledge about this deity.',
                    placeholder: true
                },
                {
                    title: 'Worship & Rituals',
                    content: 'Information about worship practices and rituals is pending community contributions.',
                    placeholder: true
                }
            ]
        };
    }

    _getHeroPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a legendary hero from ${mythology} mythology. This entry is awaiting community contributions to detail their heroic deeds, challenges, and legacy.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A legendary hero from ${mythology} mythology. Content pending community contributions.`,

            sections: [
                {
                    title: 'Legend & Deeds',
                    content: 'Information about this hero\'s legendary deeds is pending. Community contributions are welcome.',
                    placeholder: true
                },
                {
                    title: 'Origins',
                    content: 'Details about this hero\'s birth and background are pending.',
                    placeholder: true
                },
                {
                    title: 'Legacy',
                    content: 'Information about this hero\'s lasting impact and legacy is pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getCreaturePrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a mythical creature from ${mythology} mythology. This entry is awaiting community contributions to describe its characteristics, origins, and role in mythology.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A mythical creature from ${mythology} mythology. Content pending community contributions.`,

            sections: [
                {
                    title: 'Description',
                    content: 'Physical description and characteristics are pending community contributions.',
                    placeholder: true
                },
                {
                    title: 'Mythological Role',
                    content: 'Information about this creature\'s role in mythology is pending.',
                    placeholder: true
                },
                {
                    title: 'Cultural Significance',
                    content: 'Details about cultural significance and symbolism are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getItemPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a sacred or legendary item from ${mythology} mythology. This entry is awaiting community contributions to describe its properties, history, and significance.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A sacred item from ${mythology} mythology. Content pending community contributions.`,

            sections: [
                {
                    title: 'Properties',
                    content: 'Information about this item\'s magical or sacred properties is pending.',
                    placeholder: true
                },
                {
                    title: 'History',
                    content: 'The history and origins of this item are pending community contributions.',
                    placeholder: true
                },
                {
                    title: 'Associated Figures',
                    content: 'Details about figures associated with this item are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getPlacePrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a sacred or mythological location from ${mythology} tradition. This entry is awaiting community contributions to describe its significance and the events associated with it.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A sacred location from ${mythology} mythology. Content pending community contributions.`,

            sections: [
                {
                    title: 'Description',
                    content: 'Physical or metaphysical description of this place is pending.',
                    placeholder: true
                },
                {
                    title: 'Mythological Significance',
                    content: 'Information about mythological events at this location is pending.',
                    placeholder: true
                },
                {
                    title: 'Access & Inhabitants',
                    content: 'Details about who inhabits or can access this place are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getTextPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a sacred text or scripture from ${mythology} tradition. This entry is awaiting community contributions to describe its content, origin, and significance.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A sacred text from ${mythology} tradition. Content pending community contributions.`,

            sections: [
                {
                    title: 'Content Overview',
                    content: 'Summary of this text\'s content is pending community contributions.',
                    placeholder: true
                },
                {
                    title: 'Historical Context',
                    content: 'Information about when and how this text was composed is pending.',
                    placeholder: true
                },
                {
                    title: 'Significance',
                    content: 'Details about the text\'s religious or cultural significance are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getRitualPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a ritual or ceremonial practice from ${mythology} tradition. This entry is awaiting community contributions to describe the practice and its significance.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A ritual practice from ${mythology} tradition. Content pending community contributions.`,

            sections: [
                {
                    title: 'Practice',
                    content: 'Description of how this ritual is performed is pending.',
                    placeholder: true
                },
                {
                    title: 'Purpose',
                    content: 'Information about the purpose and meaning of this ritual is pending.',
                    placeholder: true
                },
                {
                    title: 'Historical Context',
                    content: 'Details about the origins and evolution of this practice are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getSymbolPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a sacred symbol from ${mythology} tradition. This entry is awaiting community contributions to describe its meaning and usage.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A sacred symbol from ${mythology} tradition. Content pending community contributions.`,

            sections: [
                {
                    title: 'Visual Description',
                    content: 'Description of this symbol\'s appearance is pending.',
                    placeholder: true
                },
                {
                    title: 'Meaning',
                    content: 'Information about the symbolic meaning is pending community contributions.',
                    placeholder: true
                },
                {
                    title: 'Usage',
                    content: 'Details about how and where this symbol is used are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getConceptPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a concept or archetype from ${mythology} tradition. This entry is awaiting community contributions to explore its meaning and manifestations.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A concept from ${mythology} tradition. Content pending community contributions.`,

            sections: [
                {
                    title: 'Definition',
                    content: 'A detailed definition of this concept is pending.',
                    placeholder: true
                },
                {
                    title: 'Manifestations',
                    content: 'Information about how this concept manifests is pending.',
                    placeholder: true
                },
                {
                    title: 'Cross-Cultural Parallels',
                    content: 'Details about similar concepts in other traditions are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getHerbPrompt(context) {
        const { name, mythology } = context;

        return {
            description: `${name} is a sacred plant or herb from ${mythology} tradition. This entry is awaiting community contributions to describe its properties and uses.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A sacred plant from ${mythology} tradition. Content pending community contributions.`,

            sections: [
                {
                    title: 'Properties',
                    content: 'Information about this plant\'s properties is pending.',
                    placeholder: true
                },
                {
                    title: 'Sacred Uses',
                    content: 'Details about ritual and sacred uses are pending.',
                    placeholder: true
                },
                {
                    title: 'Mythology',
                    content: 'Myths and legends associated with this plant are pending.',
                    placeholder: true
                }
            ]
        };
    }

    _getDefaultPrompt(context) {
        const { name, mythology, type } = context;

        return {
            description: `${name} is a ${type || 'mythological entity'} from ${mythology} tradition. This entry is awaiting community contributions to provide comprehensive information.

**This content has been auto-generated and needs community input to be complete.**`,

            shortDescription: `A ${type || 'mythological entity'} from ${mythology} tradition. Content pending community contributions.`,

            sections: [
                {
                    title: 'Overview',
                    content: 'General information about this entity is pending community contributions.',
                    placeholder: true
                },
                {
                    title: 'Significance',
                    content: 'Details about mythological significance are pending.',
                    placeholder: true
                },
                {
                    title: 'Related Entities',
                    content: 'Information about related mythological entities is pending.',
                    placeholder: true
                }
            ]
        };
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Create a history record for deletion/restoration
     * @private
     */
    async _createHistoryRecord(assetId, collectionName, assetData, action, userId, reason) {
        try {
            const historyId = `${collectionName}_${assetId}_${Date.now()}`;

            await this.db.collection('deleted_asset_history').doc(historyId).set({
                historyId,
                assetId,
                collectionName,
                action,
                userId,
                reason: reason || null,

                // Snapshot of asset at time of action
                assetSnapshot: {
                    name: assetData.name || assetData.title,
                    type: assetData.type || assetData.entityType,
                    mythology: assetData.mythology || assetData.primaryMythology,
                    description: assetData.description?.substring(0, 500), // First 500 chars
                    hasContent: !!assetData.description || (assetData.sections?.length > 0)
                },

                // Full data backup for restore
                fullSnapshot: assetData,

                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('[DeletionRecoveryService] Error creating history record:', error);
        }
    }

    /**
     * Get original content from history
     * @private
     */
    async _getOriginalContent(assetId, collectionName) {
        try {
            // Find the most recent non-delete history record
            const query = await this.db.collection('deleted_asset_history')
                .where('assetId', '==', assetId)
                .where('collectionName', '==', collectionName)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            for (const doc of query.docs) {
                const data = doc.data();
                if (data.fullSnapshot && data.action !== 'hard_delete') {
                    return {
                        description: data.fullSnapshot.description,
                        shortDescription: data.fullSnapshot.shortDescription,
                        sections: data.fullSnapshot.sections
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('[DeletionRecoveryService] Error getting original content:', error);
            return null;
        }
    }

    /**
     * Log a moderation/deletion action
     * @private
     */
    async _logAction(action, details) {
        try {
            await this.db.collection('deletion_action_log').add({
                action,
                details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('[DeletionRecoveryService] Error logging action:', error);
        }
    }

    /**
     * Create user notification
     * @private
     */
    async _createNotification(notificationData) {
        try {
            const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            await this.db.collection('notifications').doc(notificationId).set({
                id: notificationId,
                userId: notificationData.userId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                link: notificationData.link || null,
                data: notificationData.data || null,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('[DeletionRecoveryService] Error creating notification:', error);
        }
    }

    /**
     * Notify contributors asynchronously (fire and forget)
     * @private
     */
    _notifyContributorsAsync(assetId, collectionName, assetData) {
        // Run async without blocking
        this.notifyContributors(assetId, collectionName, assetData).catch(err => {
            console.error('[DeletionRecoveryService] Background notification error:', err);
        });
    }

    /**
     * Get entity type from collection name
     * @private
     */
    _getTypeFromCollection(collectionName) {
        const reverseMap = {};
        for (const [type, collection] of Object.entries(this.collectionMap)) {
            reverseMap[collection] = type;
        }
        return reverseMap[collectionName] || collectionName;
    }

    /**
     * Sanitize text content
     * @private
     */
    _sanitizeText(text) {
        if (!text) return '';
        return text
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim()
            .substring(0, 10000);
    }

    /**
     * Escape HTML for safe display
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.deletionRecoveryService = new DeletionRecoveryService();

// Auto-initialize when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.apps?.length > 0) {
    window.deletionRecoveryService.init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                window.deletionRecoveryService.init();
            }
        }, 500);
    });
}

// Export class for modules
if (typeof window !== 'undefined') {
    window.DeletionRecoveryService = DeletionRecoveryService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeletionRecoveryService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Soft delete an asset (with AI auto-population):
 *    const result = await deletionRecoveryService.softDelete(
 *        'zeus',
 *        'deities',
 *        'User requested removal of their content'
 *    );
 *
 * 2. Hard delete (admin only):
 *    const result = await deletionRecoveryService.hardDelete('asset123', 'deities');
 *
 * 3. Restore a deleted asset:
 *    const result = await deletionRecoveryService.restore('zeus', 'deities', {
 *        claimOwnership: true,
 *        restoreOriginalContent: true
 *    });
 *
 * 4. Get deleted assets:
 *    const deleted = await deletionRecoveryService.getDeletedAssets({
 *        collectionName: 'deities',
 *        ownershipStatus: 'unclaimed',
 *        limit: 20
 *    });
 *
 * 5. Get asset history:
 *    const history = await deletionRecoveryService.getAssetHistory('zeus', 'deities');
 *
 * 6. Generate placeholder content manually:
 *    const placeholder = await deletionRecoveryService.generatePlaceholderContent(
 *        { name: 'Athena', mythology: 'greek', domains: ['wisdom', 'war'] },
 *        'deities'
 *    );
 *
 * 7. Get display banner for deleted content:
 *    const bannerConfig = deletionRecoveryService.getDisplayBanner(assetData);
 *    if (bannerConfig.hasBanners) {
 *        container.insertAdjacentHTML('beforeend', bannerConfig.html);
 *    }
 *
 * 8. Listen for banner action clicks:
 *    document.addEventListener('click', (e) => {
 *        if (e.target.matches('[data-action]')) {
 *            const action = e.target.dataset.action;
 *            if (action === 'claim_ownership') {
 *                // Handle claim ownership
 *            }
 *        }
 *    });
 */
