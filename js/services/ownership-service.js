/**
 * Ownership Transfer Service
 *
 * Manages asset ownership, transfers, claims, and contribution tracking.
 * Enables collaborative content management with clear ownership hierarchy.
 *
 * Features:
 * - Get/set asset ownership status
 * - Request, approve, deny ownership claims
 * - Transfer ownership between users
 * - Release ownership voluntarily
 * - Track user contributions per asset
 * - Auto-transfer logic for unclaimed assets
 *
 * Firestore Structure:
 * assetOwnership/{assetId}
 * ├── ownerId, ownerName, ownerEmail
 * ├── status: 'owned' | 'unclaimed'
 * ├── claimedAt, lastActivity
 * ├── unclaimedSince (if status === 'unclaimed')
 * └── previousOwners: [{ userId, name, transferredAt }]
 *
 * assetOwnership/{assetId}/claims/{claimId}
 * ├── userId, userName, userEmail
 * ├── reason, status: 'pending' | 'approved' | 'denied'
 * ├── submittedAt, resolvedAt
 * ├── resolvedBy, denialReason
 * └── contributionScore (at time of claim)
 *
 * assetOwnership/{assetId}/contributions/{contributionId}
 * ├── userId, type, weight
 * ├── timestamp, description
 * └── relatedEntityId (optional)
 *
 * Events Dispatched:
 * - ownership-claimed: When a user claims an unclaimed asset
 * - ownership-transferred: When ownership moves between users
 * - ownership-released: When owner gives up ownership
 * - claim-submitted: When a claim request is submitted
 * - claim-approved: When a claim is approved
 * - claim-denied: When a claim is denied
 *
 * @requires Firebase Firestore
 */

class OwnershipService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Cache for ownership data
        this.ownershipCache = new Map();
        this.contributionCache = new Map();
        this.CACHE_TTL = 2 * 60 * 1000; // 2 minutes

        // Contribution types and their weights
        this.CONTRIBUTION_TYPES = {
            MAJOR_EDIT: { weight: 10, label: 'Major Edit', description: 'Significant content changes' },
            MINOR_EDIT: { weight: 3, label: 'Minor Edit', description: 'Small corrections or additions' },
            COMMENT: { weight: 1, label: 'Comment', description: 'Discussion contribution' },
            CITATION: { weight: 5, label: 'Citation Added', description: 'Source or reference added' },
            SUGGESTION: { weight: 7, label: 'Suggestion', description: 'Improvement suggestion' },
            REVIEW: { weight: 4, label: 'Review', description: 'Content review or verification' },
            MEDIA: { weight: 6, label: 'Media Added', description: 'Image or media contribution' }
        };

        // Auto-transfer configuration
        this.AUTO_TRANSFER_DAYS = 7; // Days before unclaimed asset can auto-transfer
        this.MIN_CONTRIBUTION_SCORE_FOR_CLAIM = 5; // Minimum score to submit a claim
    }

    /**
     * Initialize the service
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('[OwnershipService] Firebase not loaded');
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;

            console.log('[OwnershipService] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[OwnershipService] Initialization error:', error);
            return false;
        }
    }

    /**
     * Get current authenticated user
     * @returns {firebase.User|null}
     */
    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // ==================== OWNERSHIP CORE ====================

    /**
     * Get ownership status for an asset
     * @param {string} assetId - Asset ID
     * @returns {Promise<Object|null>} Ownership data or null if not found
     */
    async getOwnership(assetId) {
        await this.init();

        // Check cache
        const cached = this._getFromCache(this.ownershipCache, assetId);
        if (cached) return cached;

        try {
            const doc = await this.db.collection('assetOwnership').doc(assetId).get();

            if (!doc.exists) {
                return null;
            }

            const ownership = {
                assetId,
                ...this._convertTimestamps(doc.data())
            };

            this._setCache(this.ownershipCache, assetId, ownership);
            return ownership;
        } catch (error) {
            console.error('[OwnershipService] Error getting ownership:', error);
            throw error;
        }
    }

    /**
     * Claim ownership of an unclaimed asset
     * @param {string} assetId - Asset ID to claim
     * @param {string} userId - User ID claiming ownership
     * @param {string} reason - Reason for claiming (required for claimed assets)
     * @returns {Promise<{success: boolean, error?: string, claimId?: string}>}
     */
    async claimOwnership(assetId, userId, reason = '') {
        await this.init();

        const user = this.getCurrentUser();
        if (!user || user.uid !== userId) {
            return { success: false, error: 'Authentication required' };
        }

        try {
            const ownership = await this.getOwnership(assetId);

            // If no ownership exists or unclaimed, allow direct claim
            if (!ownership || ownership.status === 'unclaimed') {
                return await this._directClaim(assetId, user);
            }

            // If already owned by this user
            if (ownership.ownerId === userId) {
                return { success: false, error: 'You already own this asset' };
            }

            // Asset is owned - submit claim request
            return await this._submitClaimRequest(assetId, user, reason, ownership);
        } catch (error) {
            console.error('[OwnershipService] Error claiming ownership:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Direct claim for unclaimed assets
     * @private
     */
    async _directClaim(assetId, user) {
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const ownershipData = {
            ownerId: user.uid,
            ownerName: user.displayName || user.email,
            ownerEmail: user.email,
            status: 'owned',
            claimedAt: now,
            lastActivity: now,
            previousOwners: []
        };

        await this.db.collection('assetOwnership').doc(assetId).set(ownershipData);

        // Clear cache
        this.ownershipCache.delete(assetId);

        // Dispatch event
        this._dispatchEvent('ownership-claimed', {
            assetId,
            userId: user.uid,
            userName: user.displayName || user.email
        });

        console.log(`[OwnershipService] Asset ${assetId} claimed by ${user.uid}`);
        return { success: true };
    }

    /**
     * Submit claim request for owned asset
     * @private
     */
    async _submitClaimRequest(assetId, user, reason, ownership) {
        // Check if user has minimum contribution score
        const score = await this.getContributionScore(assetId, user.uid);
        if (score < this.MIN_CONTRIBUTION_SCORE_FOR_CLAIM) {
            return {
                success: false,
                error: `Minimum contribution score of ${this.MIN_CONTRIBUTION_SCORE_FOR_CLAIM} required to submit a claim. Your score: ${score}`
            };
        }

        // Check for existing pending claim
        const existingClaims = await this._getUserPendingClaims(assetId, user.uid);
        if (existingClaims.length > 0) {
            return { success: false, error: 'You already have a pending claim for this asset' };
        }

        const claimData = {
            userId: user.uid,
            userName: user.displayName || user.email,
            userEmail: user.email,
            reason: reason || 'No reason provided',
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            contributionScore: score,
            currentOwnerId: ownership.ownerId,
            currentOwnerName: ownership.ownerName
        };

        const claimRef = await this.db
            .collection('assetOwnership').doc(assetId)
            .collection('claims').add(claimData);

        // Dispatch event
        this._dispatchEvent('claim-submitted', {
            assetId,
            claimId: claimRef.id,
            userId: user.uid,
            currentOwnerId: ownership.ownerId
        });

        console.log(`[OwnershipService] Claim submitted for asset ${assetId} by ${user.uid}`);
        return { success: true, claimId: claimRef.id };
    }

    /**
     * Transfer ownership from one user to another
     * @param {string} assetId - Asset ID
     * @param {string} fromUserId - Current owner's user ID
     * @param {string} toUserId - New owner's user ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async transferOwnership(assetId, fromUserId, toUserId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        try {
            const ownership = await this.getOwnership(assetId);

            if (!ownership) {
                return { success: false, error: 'No ownership record found for this asset' };
            }

            // Verify caller is current owner
            if (ownership.ownerId !== fromUserId || user.uid !== fromUserId) {
                return { success: false, error: 'Only the current owner can transfer ownership' };
            }

            // Get new owner info
            const newOwnerDoc = await this.db.collection('users').doc(toUserId).get();
            const newOwnerData = newOwnerDoc.exists ? newOwnerDoc.data() : {};

            const now = firebase.firestore.FieldValue.serverTimestamp();

            // Update ownership with transaction
            await this.db.runTransaction(async (transaction) => {
                const ownershipRef = this.db.collection('assetOwnership').doc(assetId);

                // Add current owner to previous owners list
                const previousOwners = ownership.previousOwners || [];
                previousOwners.push({
                    userId: ownership.ownerId,
                    name: ownership.ownerName,
                    transferredAt: new Date().toISOString()
                });

                transaction.update(ownershipRef, {
                    ownerId: toUserId,
                    ownerName: newOwnerData.displayName || newOwnerData.email || toUserId,
                    ownerEmail: newOwnerData.email || null,
                    lastActivity: now,
                    previousOwners
                });
            });

            // Clear cache
            this.ownershipCache.delete(assetId);

            // Dispatch event
            this._dispatchEvent('ownership-transferred', {
                assetId,
                fromUserId,
                toUserId,
                toUserName: newOwnerData.displayName || toUserId
            });

            console.log(`[OwnershipService] Ownership transferred: ${assetId} from ${fromUserId} to ${toUserId}`);
            return { success: true };
        } catch (error) {
            console.error('[OwnershipService] Error transferring ownership:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Release ownership of an asset (make it unclaimed)
     * @param {string} assetId - Asset ID
     * @param {string} userId - Current owner's user ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async releaseOwnership(assetId, userId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user || user.uid !== userId) {
            return { success: false, error: 'Authentication required' };
        }

        try {
            const ownership = await this.getOwnership(assetId);

            if (!ownership) {
                return { success: false, error: 'No ownership record found' };
            }

            if (ownership.ownerId !== userId) {
                return { success: false, error: 'You are not the owner of this asset' };
            }

            const now = firebase.firestore.FieldValue.serverTimestamp();

            // Update to unclaimed status
            const previousOwners = ownership.previousOwners || [];
            previousOwners.push({
                userId: ownership.ownerId,
                name: ownership.ownerName,
                transferredAt: new Date().toISOString(),
                action: 'released'
            });

            await this.db.collection('assetOwnership').doc(assetId).update({
                status: 'unclaimed',
                ownerId: null,
                ownerName: null,
                ownerEmail: null,
                unclaimedSince: now,
                lastActivity: now,
                previousOwners
            });

            // Clear cache
            this.ownershipCache.delete(assetId);

            // Dispatch event
            this._dispatchEvent('ownership-released', {
                assetId,
                previousOwnerId: userId
            });

            console.log(`[OwnershipService] Ownership released for asset ${assetId}`);
            return { success: true };
        } catch (error) {
            console.error('[OwnershipService] Error releasing ownership:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== CLAIM MANAGEMENT ====================

    /**
     * Get pending claim requests for an asset
     * @param {string} assetId - Asset ID
     * @returns {Promise<Array>} List of pending claims
     */
    async getClaimRequests(assetId) {
        await this.init();

        try {
            const snapshot = await this.db
                .collection('assetOwnership').doc(assetId)
                .collection('claims')
                .where('status', '==', 'pending')
                .orderBy('submittedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...this._convertTimestamps(doc.data())
            }));
        } catch (error) {
            console.error('[OwnershipService] Error getting claim requests:', error);
            return [];
        }
    }

    /**
     * Get all claims for an asset (including resolved)
     * @param {string} assetId - Asset ID
     * @param {Object} options - { status, limit }
     * @returns {Promise<Array>}
     */
    async getAllClaims(assetId, options = {}) {
        await this.init();

        const { status = null, limit = 50 } = options;

        try {
            let query = this.db
                .collection('assetOwnership').doc(assetId)
                .collection('claims')
                .orderBy('submittedAt', 'desc')
                .limit(limit);

            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...this._convertTimestamps(doc.data())
            }));
        } catch (error) {
            console.error('[OwnershipService] Error getting all claims:', error);
            return [];
        }
    }

    /**
     * Approve a claim request (owner only)
     * @param {string} assetId - Asset ID
     * @param {string} claimId - Claim ID to approve
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async approveClaimRequest(assetId, claimId) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        try {
            const ownership = await this.getOwnership(assetId);

            if (!ownership || ownership.ownerId !== user.uid) {
                return { success: false, error: 'Only the current owner can approve claims' };
            }

            // Get claim data
            const claimRef = this.db
                .collection('assetOwnership').doc(assetId)
                .collection('claims').doc(claimId);
            const claimDoc = await claimRef.get();

            if (!claimDoc.exists) {
                return { success: false, error: 'Claim not found' };
            }

            const claim = claimDoc.data();

            if (claim.status !== 'pending') {
                return { success: false, error: 'Claim has already been resolved' };
            }

            const now = firebase.firestore.FieldValue.serverTimestamp();

            // Use transaction to approve claim and transfer ownership
            await this.db.runTransaction(async (transaction) => {
                const ownershipRef = this.db.collection('assetOwnership').doc(assetId);

                // Update claim status
                transaction.update(claimRef, {
                    status: 'approved',
                    resolvedAt: now,
                    resolvedBy: user.uid
                });

                // Transfer ownership
                const previousOwners = ownership.previousOwners || [];
                previousOwners.push({
                    userId: ownership.ownerId,
                    name: ownership.ownerName,
                    transferredAt: new Date().toISOString(),
                    action: 'claim_approved'
                });

                transaction.update(ownershipRef, {
                    ownerId: claim.userId,
                    ownerName: claim.userName,
                    ownerEmail: claim.userEmail,
                    lastActivity: now,
                    previousOwners
                });

                // Deny all other pending claims
                const pendingClaimsSnapshot = await this.db
                    .collection('assetOwnership').doc(assetId)
                    .collection('claims')
                    .where('status', '==', 'pending')
                    .get();

                pendingClaimsSnapshot.docs.forEach(doc => {
                    if (doc.id !== claimId) {
                        transaction.update(doc.ref, {
                            status: 'denied',
                            resolvedAt: now,
                            resolvedBy: user.uid,
                            denialReason: 'Another claim was approved'
                        });
                    }
                });
            });

            // Clear cache
            this.ownershipCache.delete(assetId);

            // Dispatch events
            this._dispatchEvent('claim-approved', {
                assetId,
                claimId,
                newOwnerId: claim.userId,
                previousOwnerId: user.uid
            });

            this._dispatchEvent('ownership-transferred', {
                assetId,
                fromUserId: user.uid,
                toUserId: claim.userId,
                toUserName: claim.userName
            });

            console.log(`[OwnershipService] Claim ${claimId} approved for asset ${assetId}`);
            return { success: true };
        } catch (error) {
            console.error('[OwnershipService] Error approving claim:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deny a claim request (owner only)
     * @param {string} assetId - Asset ID
     * @param {string} claimId - Claim ID to deny
     * @param {string} reason - Reason for denial
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async denyClaimRequest(assetId, claimId, reason = '') {
        await this.init();

        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Authentication required' };
        }

        try {
            const ownership = await this.getOwnership(assetId);

            if (!ownership || ownership.ownerId !== user.uid) {
                return { success: false, error: 'Only the current owner can deny claims' };
            }

            const claimRef = this.db
                .collection('assetOwnership').doc(assetId)
                .collection('claims').doc(claimId);
            const claimDoc = await claimRef.get();

            if (!claimDoc.exists) {
                return { success: false, error: 'Claim not found' };
            }

            const claim = claimDoc.data();

            if (claim.status !== 'pending') {
                return { success: false, error: 'Claim has already been resolved' };
            }

            await claimRef.update({
                status: 'denied',
                resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                resolvedBy: user.uid,
                denialReason: reason || 'No reason provided'
            });

            // Dispatch event
            this._dispatchEvent('claim-denied', {
                assetId,
                claimId,
                claimantId: claim.userId,
                reason
            });

            console.log(`[OwnershipService] Claim ${claimId} denied for asset ${assetId}`);
            return { success: true };
        } catch (error) {
            console.error('[OwnershipService] Error denying claim:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user's pending claims for an asset
     * @private
     */
    async _getUserPendingClaims(assetId, userId) {
        const snapshot = await this.db
            .collection('assetOwnership').doc(assetId)
            .collection('claims')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // ==================== CONTRIBUTION TRACKING ====================

    /**
     * Get user's contribution score for an asset
     * @param {string} assetId - Asset ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} Total contribution score
     */
    async getContributionScore(assetId, userId) {
        await this.init();

        // Check cache
        const cacheKey = `${assetId}_${userId}`;
        const cached = this._getFromCache(this.contributionCache, cacheKey);
        if (cached !== null) return cached;

        try {
            const snapshot = await this.db
                .collection('assetOwnership').doc(assetId)
                .collection('contributions')
                .where('userId', '==', userId)
                .get();

            let totalScore = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                totalScore += data.weight || 0;
            });

            this._setCache(this.contributionCache, cacheKey, totalScore);
            return totalScore;
        } catch (error) {
            console.error('[OwnershipService] Error getting contribution score:', error);
            return 0;
        }
    }

    /**
     * Record a contribution to an asset
     * @param {string} assetId - Asset ID
     * @param {string} userId - User ID
     * @param {string} type - Contribution type (MAJOR_EDIT, MINOR_EDIT, etc.)
     * @param {number} weight - Custom weight (optional, uses default from type if not provided)
     * @param {Object} metadata - Additional metadata { description, relatedEntityId }
     * @returns {Promise<{success: boolean, contributionId?: string, error?: string}>}
     */
    async recordContribution(assetId, userId, type, weight = null, metadata = {}) {
        await this.init();

        const user = this.getCurrentUser();
        if (!user || user.uid !== userId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate contribution type
        const typeConfig = this.CONTRIBUTION_TYPES[type];
        if (!typeConfig) {
            return { success: false, error: `Invalid contribution type: ${type}` };
        }

        try {
            const contributionWeight = weight !== null ? weight : typeConfig.weight;

            const contributionData = {
                userId,
                userName: user.displayName || user.email,
                type,
                typeLabel: typeConfig.label,
                weight: contributionWeight,
                description: metadata.description || typeConfig.description,
                relatedEntityId: metadata.relatedEntityId || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            const contributionRef = await this.db
                .collection('assetOwnership').doc(assetId)
                .collection('contributions').add(contributionData);

            // Clear contribution score cache for this user/asset
            const cacheKey = `${assetId}_${userId}`;
            this.contributionCache.delete(cacheKey);

            // Update last activity on ownership record
            const ownershipRef = this.db.collection('assetOwnership').doc(assetId);
            const ownershipDoc = await ownershipRef.get();

            if (ownershipDoc.exists) {
                await ownershipRef.update({
                    lastActivity: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.ownershipCache.delete(assetId);
            }

            console.log(`[OwnershipService] Contribution recorded: ${type} for asset ${assetId}`);
            return { success: true, contributionId: contributionRef.id };
        } catch (error) {
            console.error('[OwnershipService] Error recording contribution:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get top contributors for an asset
     * @param {string} assetId - Asset ID
     * @param {number} limit - Number of top contributors to return
     * @returns {Promise<Array>} Sorted list of contributors with scores
     */
    async getTopContributors(assetId, limit = 10) {
        await this.init();

        try {
            const snapshot = await this.db
                .collection('assetOwnership').doc(assetId)
                .collection('contributions')
                .get();

            // Aggregate contributions by user
            const userScores = new Map();
            const userNames = new Map();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                const currentScore = userScores.get(userId) || 0;
                userScores.set(userId, currentScore + (data.weight || 0));
                userNames.set(userId, data.userName || userId);
            });

            // Convert to array and sort
            const contributors = Array.from(userScores.entries())
                .map(([userId, score]) => ({
                    userId,
                    userName: userNames.get(userId),
                    score,
                    rank: 0
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            // Add ranks
            contributors.forEach((contributor, index) => {
                contributor.rank = index + 1;
            });

            return contributors;
        } catch (error) {
            console.error('[OwnershipService] Error getting top contributors:', error);
            return [];
        }
    }

    /**
     * Get user's contribution history for an asset
     * @param {string} assetId - Asset ID
     * @param {string} userId - User ID
     * @returns {Promise<Array>} List of contributions
     */
    async getUserContributions(assetId, userId) {
        await this.init();

        try {
            const snapshot = await this.db
                .collection('assetOwnership').doc(assetId)
                .collection('contributions')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...this._convertTimestamps(doc.data())
            }));
        } catch (error) {
            console.error('[OwnershipService] Error getting user contributions:', error);
            return [];
        }
    }

    // ==================== AUTO-TRANSFER LOGIC ====================

    /**
     * Check and process auto-transfer for unclaimed assets
     * This should be called periodically (e.g., by a Cloud Function)
     * @param {string} assetId - Asset ID to check
     * @returns {Promise<{success: boolean, transferred?: boolean, newOwnerId?: string, error?: string}>}
     */
    async checkAutoTransfer(assetId) {
        await this.init();

        try {
            const ownership = await this.getOwnership(assetId);

            if (!ownership || ownership.status !== 'unclaimed') {
                return { success: true, transferred: false };
            }

            // Check if unclaimed long enough
            if (!ownership.unclaimedSince) {
                return { success: true, transferred: false };
            }

            const unclaimedDate = ownership.unclaimedSince instanceof Date
                ? ownership.unclaimedSince
                : ownership.unclaimedSince.toDate?.() || new Date(ownership.unclaimedSince);

            const daysSinceUnclaimed = (Date.now() - unclaimedDate.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceUnclaimed < this.AUTO_TRANSFER_DAYS) {
                return { success: true, transferred: false };
            }

            // Get pending claims
            const claims = await this.getClaimRequests(assetId);

            if (claims.length === 0) {
                return { success: true, transferred: false };
            }

            // Find the best claimant (highest contribution score)
            const topContributors = await this.getTopContributors(assetId, 1);
            const topContributor = topContributors[0];

            // Check if original owner (from previousOwners) is among claimants
            const previousOwnerIds = (ownership.previousOwners || []).map(p => p.userId);
            const originalOwnerClaim = claims.find(c =>
                previousOwnerIds.includes(c.userId) && c.userId === topContributor?.userId
            );

            let winningClaim;

            if (originalOwnerClaim) {
                // Original owner who is most active gets auto-approved
                winningClaim = originalOwnerClaim;
            } else {
                // Highest contributor with a claim wins
                winningClaim = claims
                    .sort((a, b) => (b.contributionScore || 0) - (a.contributionScore || 0))[0];
            }

            if (!winningClaim) {
                return { success: true, transferred: false };
            }

            // Auto-approve the winning claim
            const now = firebase.firestore.FieldValue.serverTimestamp();

            await this.db.runTransaction(async (transaction) => {
                const ownershipRef = this.db.collection('assetOwnership').doc(assetId);
                const claimRef = this.db
                    .collection('assetOwnership').doc(assetId)
                    .collection('claims').doc(winningClaim.id);

                // Update claim
                transaction.update(claimRef, {
                    status: 'approved',
                    resolvedAt: now,
                    resolvedBy: 'system_auto_transfer'
                });

                // Update ownership
                const previousOwners = ownership.previousOwners || [];

                transaction.update(ownershipRef, {
                    ownerId: winningClaim.userId,
                    ownerName: winningClaim.userName,
                    ownerEmail: winningClaim.userEmail,
                    status: 'owned',
                    lastActivity: now,
                    unclaimedSince: null,
                    previousOwners
                });

                // Deny other claims
                const claimsSnapshot = await this.db
                    .collection('assetOwnership').doc(assetId)
                    .collection('claims')
                    .where('status', '==', 'pending')
                    .get();

                claimsSnapshot.docs.forEach(doc => {
                    if (doc.id !== winningClaim.id) {
                        transaction.update(doc.ref, {
                            status: 'denied',
                            resolvedAt: now,
                            resolvedBy: 'system_auto_transfer',
                            denialReason: 'Auto-transferred to higher contributing claimant'
                        });
                    }
                });
            });

            // Clear cache
            this.ownershipCache.delete(assetId);

            // Dispatch events
            this._dispatchEvent('claim-approved', {
                assetId,
                claimId: winningClaim.id,
                newOwnerId: winningClaim.userId,
                autoTransfer: true
            });

            this._dispatchEvent('ownership-transferred', {
                assetId,
                fromUserId: null,
                toUserId: winningClaim.userId,
                toUserName: winningClaim.userName,
                autoTransfer: true
            });

            console.log(`[OwnershipService] Auto-transferred asset ${assetId} to ${winningClaim.userId}`);
            return {
                success: true,
                transferred: true,
                newOwnerId: winningClaim.userId
            };
        } catch (error) {
            console.error('[OwnershipService] Error in auto-transfer:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of unclaimed assets eligible for auto-transfer
     * @param {number} limit - Maximum number to return
     * @returns {Promise<Array>}
     */
    async getUnclaimedAssets(limit = 50) {
        await this.init();

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.AUTO_TRANSFER_DAYS);

            const snapshot = await this.db.collection('assetOwnership')
                .where('status', '==', 'unclaimed')
                .where('unclaimedSince', '<=', cutoffDate)
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                assetId: doc.id,
                ...this._convertTimestamps(doc.data())
            }));
        } catch (error) {
            console.error('[OwnershipService] Error getting unclaimed assets:', error);
            return [];
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Check if user is the owner of an asset
     * @param {string} assetId - Asset ID
     * @param {string} userId - User ID to check
     * @returns {Promise<boolean>}
     */
    async isOwner(assetId, userId) {
        const ownership = await this.getOwnership(assetId);
        return ownership?.ownerId === userId;
    }

    /**
     * Get user's owned assets
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number to return
     * @returns {Promise<Array>}
     */
    async getUserOwnedAssets(userId, limit = 100) {
        await this.init();

        try {
            const snapshot = await this.db.collection('assetOwnership')
                .where('ownerId', '==', userId)
                .where('status', '==', 'owned')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                assetId: doc.id,
                ...this._convertTimestamps(doc.data())
            }));
        } catch (error) {
            console.error('[OwnershipService] Error getting user owned assets:', error);
            return [];
        }
    }

    /**
     * Get user's pending claims across all assets
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserPendingClaims(userId) {
        await this.init();

        try {
            // Note: This requires a collection group query
            const snapshot = await this.db.collectionGroup('claims')
                .where('userId', '==', userId)
                .where('status', '==', 'pending')
                .orderBy('submittedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                assetId: doc.ref.parent.parent.id,
                ...this._convertTimestamps(doc.data())
            }));
        } catch (error) {
            console.error('[OwnershipService] Error getting user pending claims:', error);
            return [];
        }
    }

    /**
     * Get contribution type configuration
     * @returns {Object} Contribution types with weights
     */
    getContributionTypes() {
        return { ...this.CONTRIBUTION_TYPES };
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Dispatch custom event
     * @private
     */
    _dispatchEvent(eventName, detail) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        }
    }

    /**
     * Convert Firestore timestamps to JavaScript Date objects
     * @private
     */
    _convertTimestamps(data) {
        if (!data) return data;

        const converted = { ...data };
        const timestampFields = [
            'claimedAt', 'lastActivity', 'unclaimedSince',
            'submittedAt', 'resolvedAt', 'timestamp', 'transferredAt'
        ];

        timestampFields.forEach(field => {
            if (converted[field]?.toDate) {
                converted[field] = converted[field].toDate();
            }
        });

        // Handle previousOwners array
        if (Array.isArray(converted.previousOwners)) {
            converted.previousOwners = converted.previousOwners.map(owner => {
                if (owner.transferredAt?.toDate) {
                    return { ...owner, transferredAt: owner.transferredAt.toDate() };
                }
                return owner;
            });
        }

        return converted;
    }

    /**
     * Get from cache
     * @private
     */
    _getFromCache(cache, key) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Set cache value
     * @private
     */
    _setCache(cache, key, data) {
        cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.ownershipCache.clear();
        this.contributionCache.clear();
        console.log('[OwnershipService] Cache cleared');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.clearCache();
    }
}

// Create singleton instance
window.ownershipService = window.ownershipService || new OwnershipService();

// Export class for modules
if (typeof window !== 'undefined') {
    window.OwnershipService = OwnershipService;
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OwnershipService;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Get ownership status:
 *    const ownership = await ownershipService.getOwnership('asset123');
 *    console.log(ownership.ownerId, ownership.status);
 *
 * 2. Claim an unclaimed asset:
 *    const result = await ownershipService.claimOwnership('asset123', userId, 'I created this content');
 *
 * 3. Submit claim for owned asset:
 *    const result = await ownershipService.claimOwnership('asset123', userId, 'I am the original creator');
 *    if (result.claimId) console.log('Claim submitted for review');
 *
 * 4. Record a contribution:
 *    await ownershipService.recordContribution('asset123', userId, 'MAJOR_EDIT', null, {
 *      description: 'Added new section on mythology origins'
 *    });
 *
 * 5. Get top contributors:
 *    const topContributors = await ownershipService.getTopContributors('asset123', 5);
 *    topContributors.forEach(c => console.log(`${c.rank}. ${c.userName}: ${c.score} pts`));
 *
 * 6. Approve a claim (owner only):
 *    await ownershipService.approveClaimRequest('asset123', 'claim456');
 *
 * 7. Listen for ownership events:
 *    window.addEventListener('ownership-transferred', (e) => {
 *      console.log(`Ownership transferred from ${e.detail.fromUserId} to ${e.detail.toUserId}`);
 *    });
 *
 * 8. Check auto-transfer eligibility:
 *    const result = await ownershipService.checkAutoTransfer('asset123');
 *    if (result.transferred) console.log(`Auto-transferred to ${result.newOwnerId}`);
 */
