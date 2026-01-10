/**
 * Ownership Claim UI Components
 * Eyes of Azrael Project
 *
 * Provides UI components for asset ownership management including:
 * - Ownership Status Banner (current owner, unclaimed state, pending transfer)
 * - Claim Modal (submit ownership claims)
 * - Claim Management Panel (for asset owners to approve/deny claims)
 * - Claim Countdown Timer (7-day auto-transfer countdown)
 * - Ownership Transfer Confirmation dialogs
 *
 * @requires js/services/ownership-service.js
 * @requires js/services/contribution-tracking-service.js
 */

class OwnershipClaimUI {
    constructor() {
        this.initialized = false;
        this.currentModal = null;
        this.countdownIntervals = new Map();

        // Configuration
        this.AUTO_TRANSFER_DAYS = 7;
        this.MIN_CONTRIBUTION_SCORE = 5;

        // Inject styles on construction
        this._injectStyles();
    }

    /**
     * Initialize the UI component
     */
    async init() {
        if (this.initialized) return;

        // Ensure ownership service is available
        if (!window.ownershipService) {
            console.error('[OwnershipClaimUI] OwnershipService not found');
            return;
        }

        await window.ownershipService.init();
        this.initialized = true;

        // Listen for ownership events
        this._setupEventListeners();

        console.log('[OwnershipClaimUI] Initialized');
    }

    /**
     * Setup event listeners for ownership changes
     * @private
     */
    _setupEventListeners() {
        window.addEventListener('ownership-claimed', (e) => {
            this._showNotification('Ownership claimed successfully!', 'success');
        });

        window.addEventListener('ownership-transferred', (e) => {
            const { toUserName } = e.detail;
            this._showNotification(`Ownership transferred to ${toUserName}`, 'info');
        });

        window.addEventListener('claim-submitted', (e) => {
            this._showNotification('Claim submitted for review', 'success');
        });

        window.addEventListener('claim-approved', (e) => {
            this._showNotification('Your claim has been approved!', 'success');
        });

        window.addEventListener('claim-denied', (e) => {
            this._showNotification('Your claim was denied', 'warning');
        });
    }

    // ==================== OWNERSHIP STATUS BANNER ====================

    /**
     * Create an ownership status banner for an asset
     * @param {string} assetId - Asset ID
     * @param {Object} options - { container, showActions }
     * @returns {Promise<HTMLElement>} The banner element
     */
    async createOwnershipBanner(assetId, options = {}) {
        await this.init();

        const { container = null, showActions = true } = options;

        const banner = document.createElement('div');
        banner.className = 'ownership-banner';
        banner.dataset.assetId = assetId;

        // Show loading state
        banner.innerHTML = this._getBannerLoadingHTML();

        if (container) {
            container.appendChild(banner);
        }

        // Fetch ownership data
        try {
            const ownership = await window.ownershipService.getOwnership(assetId);
            const currentUser = window.ownershipService.getCurrentUser();
            const pendingClaims = ownership ? await window.ownershipService.getClaimRequests(assetId) : [];

            // Get user's contribution score for this asset
            let userScore = 0;
            if (currentUser) {
                userScore = await window.ownershipService.getContributionScore(assetId, currentUser.uid);
            }

            banner.innerHTML = await this._renderBannerContent(
                assetId,
                ownership,
                currentUser,
                pendingClaims,
                userScore,
                showActions
            );

            // Attach event listeners
            this._attachBannerEventListeners(banner, assetId, ownership, currentUser);

            // Start countdown if unclaimed
            if (ownership?.status === 'unclaimed' && ownership.unclaimedSince) {
                this._startCountdown(banner, ownership.unclaimedSince);
            }

        } catch (error) {
            console.error('[OwnershipClaimUI] Error creating banner:', error);
            banner.innerHTML = this._getBannerErrorHTML();
        }

        return banner;
    }

    /**
     * Render banner content based on ownership state
     * @private
     */
    async _renderBannerContent(assetId, ownership, currentUser, pendingClaims, userScore, showActions) {
        const isOwner = ownership?.ownerId === currentUser?.uid;
        const isUnclaimed = !ownership || ownership.status === 'unclaimed';
        const hasPendingTransfer = pendingClaims.length > 0;

        if (isUnclaimed) {
            return this._getUnclaimedBannerHTML(assetId, ownership, currentUser, userScore, showActions);
        }

        if (isOwner) {
            return this._getOwnerBannerHTML(assetId, ownership, pendingClaims, showActions);
        }

        return this._getOwnedBannerHTML(assetId, ownership, currentUser, userScore, hasPendingTransfer, showActions);
    }

    /**
     * Get HTML for unclaimed asset banner
     * @private
     */
    _getUnclaimedBannerHTML(assetId, ownership, currentUser, userScore, showActions) {
        const timeLeft = ownership?.unclaimedSince
            ? this._getTimeLeftString(ownership.unclaimedSince)
            : null;

        return `
            <div class="ownership-banner-content ownership-banner-unclaimed">
                <div class="ownership-banner-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                </div>
                <div class="ownership-banner-info">
                    <div class="ownership-banner-status">Unclaimed Asset</div>
                    <div class="ownership-banner-description">
                        This asset is currently unclaimed. You can claim ownership to manage and maintain it.
                    </div>
                    ${timeLeft ? `
                        <div class="ownership-countdown" data-unclaimed-since="${ownership.unclaimedSince}">
                            <span class="countdown-label">Auto-transfer eligible in:</span>
                            <span class="countdown-timer">${timeLeft}</span>
                        </div>
                    ` : ''}
                </div>
                ${showActions && currentUser ? `
                    <div class="ownership-banner-actions">
                        <button class="btn-claim-ownership" data-asset-id="${assetId}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                            Claim Ownership
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get HTML for owner's view of the banner
     * @private
     */
    _getOwnerBannerHTML(assetId, ownership, pendingClaims, showActions) {
        const claimCount = pendingClaims.length;

        return `
            <div class="ownership-banner-content ownership-banner-owned ownership-banner-owner">
                <div class="ownership-banner-icon owner-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                </div>
                <div class="ownership-banner-info">
                    <div class="ownership-banner-status">You Own This Asset</div>
                    <div class="ownership-banner-description">
                        You are the owner and can manage this asset's content.
                        ${ownership.claimedAt ? `<span class="ownership-since">Owner since ${this._formatDate(ownership.claimedAt)}</span>` : ''}
                    </div>
                    ${claimCount > 0 ? `
                        <div class="pending-claims-indicator">
                            <span class="claims-badge">${claimCount}</span>
                            pending ownership ${claimCount === 1 ? 'claim' : 'claims'}
                        </div>
                    ` : ''}
                </div>
                ${showActions ? `
                    <div class="ownership-banner-actions">
                        ${claimCount > 0 ? `
                            <button class="btn-manage-claims" data-asset-id="${assetId}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                Manage Claims
                            </button>
                        ` : ''}
                        <button class="btn-release-ownership btn-secondary" data-asset-id="${assetId}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                            Release
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get HTML for non-owner viewing owned asset
     * @private
     */
    _getOwnedBannerHTML(assetId, ownership, currentUser, userScore, hasPendingTransfer, showActions) {
        const canClaim = userScore >= this.MIN_CONTRIBUTION_SCORE;

        return `
            <div class="ownership-banner-content ownership-banner-owned">
                <div class="ownership-banner-owner-info">
                    ${ownership.ownerAvatar ? `
                        <img class="owner-avatar" src="${ownership.ownerAvatar}" alt="${ownership.ownerName}">
                    ` : `
                        <div class="owner-avatar-placeholder">${this._getInitials(ownership.ownerName)}</div>
                    `}
                    <div class="owner-details">
                        <div class="ownership-banner-status">Owned Asset</div>
                        <div class="owner-name">${ownership.ownerName || 'Unknown User'}</div>
                        ${ownership.claimedAt ? `
                            <div class="ownership-since">Owner since ${this._formatDate(ownership.claimedAt)}</div>
                        ` : ''}
                    </div>
                </div>
                ${showActions && currentUser ? `
                    <div class="ownership-banner-actions">
                        ${hasPendingTransfer ? `
                            <div class="claim-pending-badge">Claim Pending</div>
                        ` : canClaim ? `
                            <button class="btn-submit-claim" data-asset-id="${assetId}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="12" y1="18" x2="12" y2="12"/>
                                    <line x1="9" y1="15" x2="15" y2="15"/>
                                </svg>
                                Request Ownership
                            </button>
                        ` : `
                            <div class="contribution-requirement">
                                <span class="score-info">Your score: ${userScore}/${this.MIN_CONTRIBUTION_SCORE}</span>
                                <span class="requirement-text">Contribute more to request ownership</span>
                            </div>
                        `}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get loading state HTML for banner
     * @private
     */
    _getBannerLoadingHTML() {
        return `
            <div class="ownership-banner-content ownership-banner-loading">
                <div class="ownership-banner-skeleton">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-text">
                        <div class="skeleton-line skeleton-line-short"></div>
                        <div class="skeleton-line skeleton-line-long"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get error state HTML for banner
     * @private
     */
    _getBannerErrorHTML() {
        return `
            <div class="ownership-banner-content ownership-banner-error">
                <div class="ownership-banner-icon error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                </div>
                <div class="ownership-banner-info">
                    <div class="ownership-banner-status">Unable to Load</div>
                    <div class="ownership-banner-description">
                        Could not retrieve ownership information. Please try again later.
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to banner buttons
     * @private
     */
    _attachBannerEventListeners(banner, assetId, ownership, currentUser) {
        // Claim ownership button (unclaimed asset)
        const claimBtn = banner.querySelector('.btn-claim-ownership');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.showClaimModal(assetId));
        }

        // Submit claim button (owned asset)
        const submitClaimBtn = banner.querySelector('.btn-submit-claim');
        if (submitClaimBtn) {
            submitClaimBtn.addEventListener('click', () => this.showClaimModal(assetId));
        }

        // Manage claims button (owner)
        const manageBtn = banner.querySelector('.btn-manage-claims');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => this.showClaimManagementPanel(assetId));
        }

        // Release ownership button
        const releaseBtn = banner.querySelector('.btn-release-ownership');
        if (releaseBtn) {
            releaseBtn.addEventListener('click', () => this.showReleaseConfirmation(assetId));
        }
    }

    // ==================== CLAIM MODAL ====================

    /**
     * Show the claim modal for an asset
     * @param {string} assetId - Asset ID to claim
     */
    async showClaimModal(assetId) {
        await this.init();

        const currentUser = window.ownershipService.getCurrentUser();
        if (!currentUser) {
            this._showNotification('Please sign in to claim ownership', 'warning');
            return;
        }

        // Get ownership data
        const ownership = await window.ownershipService.getOwnership(assetId);
        const isUnclaimed = !ownership || ownership.status === 'unclaimed';

        // Get user's contribution data
        const userScore = await window.ownershipService.getContributionScore(assetId, currentUser.uid);
        const userContributions = await window.ownershipService.getUserContributions(assetId, currentUser.uid);

        // Get top contributors for comparison
        const topContributors = await window.ownershipService.getTopContributors(assetId, 5);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay ownership-claim-modal';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">
                        ${isUnclaimed ? 'Claim Ownership' : 'Request Ownership Transfer'}
                    </h2>
                    <button class="modal-close" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="modal-body">
                    ${isUnclaimed ? this._getDirectClaimContent(assetId, userScore) : this._getClaimRequestContent(assetId, ownership, userScore, userContributions, topContributors)}
                </div>

                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary btn-cancel">Cancel</button>
                    <button class="modal-btn modal-btn-primary btn-submit-claim" ${!isUnclaimed && userScore < this.MIN_CONTRIBUTION_SCORE ? 'disabled' : ''}>
                        ${isUnclaimed ? 'Claim Now' : 'Submit Claim'}
                    </button>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        this.currentModal = modal;

        // Show with animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        // Attach event listeners
        this._attachClaimModalListeners(modal, assetId, isUnclaimed);
    }

    /**
     * Get content for direct claim (unclaimed asset)
     * @private
     */
    _getDirectClaimContent(assetId, userScore) {
        return `
            <div class="claim-direct-content">
                <div class="claim-info-card">
                    <div class="claim-info-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                    </div>
                    <div class="claim-info-text">
                        <h3>Become the Owner</h3>
                        <p>As the owner, you'll be responsible for maintaining and improving this asset's content quality.</p>
                    </div>
                </div>

                <div class="ownership-terms">
                    <h4>Terms of Ownership</h4>
                    <ul class="terms-list">
                        <li>You agree to maintain accurate and respectful content</li>
                        <li>You will review and respond to community contributions</li>
                        <li>You may transfer or release ownership at any time</li>
                        <li>Inactive ownership may be transferred to active contributors</li>
                    </ul>

                    <label class="terms-checkbox">
                        <input type="checkbox" id="accept-terms">
                        <span>I accept the terms of ownership</span>
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Get content for claim request (owned asset)
     * @private
     */
    _getClaimRequestContent(assetId, ownership, userScore, userContributions, topContributors) {
        const canClaim = userScore >= this.MIN_CONTRIBUTION_SCORE;
        const userRank = topContributors.findIndex(c => c.userId === window.ownershipService.getCurrentUser()?.uid) + 1;

        return `
            <div class="claim-request-content">
                <div class="current-owner-info">
                    <span class="label">Current Owner:</span>
                    <div class="owner-display">
                        ${ownership.ownerAvatar ? `
                            <img class="owner-avatar-small" src="${ownership.ownerAvatar}" alt="${ownership.ownerName}">
                        ` : `
                            <div class="owner-avatar-placeholder-small">${this._getInitials(ownership.ownerName)}</div>
                        `}
                        <span class="owner-name">${ownership.ownerName}</span>
                    </div>
                </div>

                <div class="contribution-score-section">
                    <div class="score-display">
                        <div class="score-value">${userScore}</div>
                        <div class="score-label">Your Contribution Score</div>
                    </div>
                    <div class="score-requirements">
                        <div class="requirement ${canClaim ? 'met' : 'not-met'}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${canClaim ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M18 6L6 18M6 6l12 12"/>'}
                            </svg>
                            <span>Minimum score of ${this.MIN_CONTRIBUTION_SCORE} required</span>
                        </div>
                        ${userRank > 0 ? `
                            <div class="contributor-rank">
                                <span class="rank-badge">#${userRank}</span>
                                among top contributors
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${userContributions.length > 0 ? `
                    <div class="contribution-history-section">
                        <h4>Your Contribution History</h4>
                        <div class="contribution-list">
                            ${userContributions.slice(0, 5).map(c => `
                                <div class="contribution-item-small">
                                    <span class="contribution-type">${c.typeLabel || c.type}</span>
                                    <span class="contribution-weight">+${c.weight} pts</span>
                                    <span class="contribution-date">${this._formatDate(c.timestamp)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${topContributors.length > 0 ? `
                    <div class="top-contributors-section">
                        <h4>Top Contributors</h4>
                        <div class="contributors-list">
                            ${topContributors.map((c, i) => `
                                <div class="contributor-item ${c.userId === window.ownershipService.getCurrentUser()?.uid ? 'is-current-user' : ''}">
                                    <span class="contributor-rank">#${i + 1}</span>
                                    <span class="contributor-name">${c.userName}</span>
                                    <span class="contributor-score">${c.score} pts</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${canClaim ? `
                    <div class="claim-reason-section">
                        <h4>Reason for Claim</h4>
                        <textarea id="claim-reason" class="claim-reason-input"
                            placeholder="Explain why you want ownership of this asset (e.g., you're the original creator, primary contributor, or have expertise in this topic)..."
                            rows="4"></textarea>
                        <div class="textarea-hint">This will be sent to the current owner for review</div>
                    </div>

                    <div class="ownership-terms compact">
                        <label class="terms-checkbox">
                            <input type="checkbox" id="accept-terms">
                            <span>I accept the terms of ownership</span>
                        </label>
                    </div>
                ` : `
                    <div class="insufficient-score-notice">
                        <div class="notice-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 16v-4M12 8h.01"/>
                            </svg>
                        </div>
                        <div class="notice-text">
                            <strong>Cannot submit claim yet</strong>
                            <p>You need at least ${this.MIN_CONTRIBUTION_SCORE} contribution points to submit an ownership claim.
                            Continue contributing to this asset to increase your score.</p>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Attach event listeners to claim modal
     * @private
     */
    _attachClaimModalListeners(modal, assetId, isUnclaimed) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const submitBtn = modal.querySelector('.btn-submit-claim');
        const termsCheckbox = modal.querySelector('#accept-terms');

        // Close handlers
        closeBtn?.addEventListener('click', () => this._closeModal(modal));
        cancelBtn?.addEventListener('click', () => this._closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this._closeModal(modal);
        });

        // Terms checkbox handler
        termsCheckbox?.addEventListener('change', () => {
            submitBtn.disabled = !termsCheckbox.checked;
        });

        // Initially disable submit until terms accepted
        if (termsCheckbox) {
            submitBtn.disabled = true;
        }

        // Submit handler
        submitBtn?.addEventListener('click', async () => {
            if (!termsCheckbox?.checked) {
                this._showNotification('Please accept the terms of ownership', 'warning');
                return;
            }

            const reason = modal.querySelector('#claim-reason')?.value || '';

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner-small"></span> Submitting...';

            try {
                const currentUser = window.ownershipService.getCurrentUser();
                const result = await window.ownershipService.claimOwnership(assetId, currentUser.uid, reason);

                if (result.success) {
                    this._closeModal(modal);
                    this._showNotification(
                        isUnclaimed ? 'Ownership claimed successfully!' : 'Claim submitted for review',
                        'success'
                    );

                    // Refresh any banners on the page
                    this._refreshBanners(assetId);
                } else {
                    throw new Error(result.error || 'Failed to submit claim');
                }
            } catch (error) {
                console.error('[OwnershipClaimUI] Claim error:', error);
                this._showNotification(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = isUnclaimed ? 'Claim Now' : 'Submit Claim';
            }
        });

        // Escape key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this._closeModal(modal);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // ==================== CLAIM MANAGEMENT PANEL ====================

    /**
     * Show claim management panel for asset owners
     * @param {string} assetId - Asset ID
     */
    async showClaimManagementPanel(assetId) {
        await this.init();

        const currentUser = window.ownershipService.getCurrentUser();
        if (!currentUser) return;

        // Verify ownership
        const isOwner = await window.ownershipService.isOwner(assetId, currentUser.uid);
        if (!isOwner) {
            this._showNotification('Only the owner can manage claims', 'warning');
            return;
        }

        // Get pending claims
        const claims = await window.ownershipService.getClaimRequests(assetId);

        // Create panel modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay ownership-management-modal';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">Manage Ownership Claims</h2>
                    <button class="modal-close" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="modal-body">
                    ${claims.length > 0 ? this._getClaimsListHTML(claims) : this._getNoClaimsHTML()}
                </div>

                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary btn-close">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        this.currentModal = modal;

        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        this._attachManagementPanelListeners(modal, assetId, claims);
    }

    /**
     * Get HTML for claims list
     * @private
     */
    _getClaimsListHTML(claims) {
        return `
            <div class="claims-management-list">
                ${claims.map(claim => `
                    <div class="claim-card" data-claim-id="${claim.id}">
                        <div class="claim-card-header">
                            <div class="claimant-info">
                                ${claim.userAvatar ? `
                                    <img class="claimant-avatar" src="${claim.userAvatar}" alt="${claim.userName}">
                                ` : `
                                    <div class="claimant-avatar-placeholder">${this._getInitials(claim.userName)}</div>
                                `}
                                <div class="claimant-details">
                                    <div class="claimant-name">${claim.userName}</div>
                                    <div class="claim-submitted">Submitted ${this._formatDate(claim.submittedAt)}</div>
                                </div>
                            </div>
                            <div class="claim-score">
                                <span class="score-value">${claim.contributionScore || 0}</span>
                                <span class="score-label">pts</span>
                            </div>
                        </div>

                        ${claim.reason ? `
                            <div class="claim-reason">
                                <strong>Reason:</strong>
                                <p>${this._escapeHTML(claim.reason)}</p>
                            </div>
                        ` : ''}

                        <div class="claim-card-actions">
                            <button class="btn-approve-claim" data-claim-id="${claim.id}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                Approve
                            </button>
                            <button class="btn-deny-claim" data-claim-id="${claim.id}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                                Deny
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get HTML for no claims state
     * @private
     */
    _getNoClaimsHTML() {
        return `
            <div class="no-claims-message">
                <div class="no-claims-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>
                <h3>No Pending Claims</h3>
                <p>There are currently no pending ownership claims for this asset.</p>
            </div>
        `;
    }

    /**
     * Attach event listeners to management panel
     * @private
     */
    _attachManagementPanelListeners(modal, assetId, claims) {
        const closeBtn = modal.querySelector('.modal-close');
        const closeFooterBtn = modal.querySelector('.btn-close');

        closeBtn?.addEventListener('click', () => this._closeModal(modal));
        closeFooterBtn?.addEventListener('click', () => this._closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this._closeModal(modal);
        });

        // Approve buttons
        modal.querySelectorAll('.btn-approve-claim').forEach(btn => {
            btn.addEventListener('click', async () => {
                const claimId = btn.dataset.claimId;
                await this._handleApprove(modal, assetId, claimId);
            });
        });

        // Deny buttons
        modal.querySelectorAll('.btn-deny-claim').forEach(btn => {
            btn.addEventListener('click', async () => {
                const claimId = btn.dataset.claimId;
                await this._handleDenyPrompt(modal, assetId, claimId);
            });
        });
    }

    /**
     * Handle approve claim action
     * @private
     */
    async _handleApprove(modal, assetId, claimId) {
        const confirmed = await this._showConfirmDialog(
            'Approve Claim',
            'Are you sure you want to approve this claim? Ownership will be transferred to this user.',
            'Approve',
            'warning'
        );

        if (!confirmed) return;

        try {
            const result = await window.ownershipService.approveClaimRequest(assetId, claimId);

            if (result.success) {
                this._closeModal(modal);
                this._showNotification('Claim approved. Ownership has been transferred.', 'success');
                this._refreshBanners(assetId);
            } else {
                throw new Error(result.error || 'Failed to approve claim');
            }
        } catch (error) {
            console.error('[OwnershipClaimUI] Approve error:', error);
            this._showNotification(error.message, 'error');
        }
    }

    /**
     * Handle deny claim with reason prompt
     * @private
     */
    async _handleDenyPrompt(modal, assetId, claimId) {
        // Create deny reason modal
        const denyModal = document.createElement('div');
        denyModal.className = 'modal-overlay confirm-dialog-overlay';
        denyModal.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-dialog-icon danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </div>
                <h3>Deny Claim</h3>
                <p>Please provide a reason for denying this claim:</p>
                <textarea id="deny-reason" class="deny-reason-input"
                    placeholder="Enter your reason..." rows="3"></textarea>
                <div class="confirm-dialog-actions">
                    <button class="modal-btn modal-btn-secondary btn-cancel">Cancel</button>
                    <button class="modal-btn modal-btn-danger btn-confirm">Deny Claim</button>
                </div>
            </div>
        `;

        document.body.appendChild(denyModal);

        requestAnimationFrame(() => {
            denyModal.classList.add('show');
        });

        return new Promise((resolve) => {
            const cancelBtn = denyModal.querySelector('.btn-cancel');
            const confirmBtn = denyModal.querySelector('.btn-confirm');
            const reasonInput = denyModal.querySelector('#deny-reason');

            cancelBtn.addEventListener('click', () => {
                denyModal.classList.remove('show');
                setTimeout(() => denyModal.remove(), 300);
                resolve(false);
            });

            confirmBtn.addEventListener('click', async () => {
                const reason = reasonInput.value.trim();
                if (!reason) {
                    this._showNotification('Please provide a reason', 'warning');
                    return;
                }

                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="loading-spinner-small"></span>';

                try {
                    const result = await window.ownershipService.denyClaimRequest(assetId, claimId, reason);

                    if (result.success) {
                        denyModal.classList.remove('show');
                        setTimeout(() => denyModal.remove(), 300);

                        // Update the claim card in the management modal
                        const claimCard = modal.querySelector(`[data-claim-id="${claimId}"]`);
                        if (claimCard) {
                            claimCard.remove();
                        }

                        // Check if no more claims
                        const remainingClaims = modal.querySelectorAll('.claim-card');
                        if (remainingClaims.length === 0) {
                            modal.querySelector('.modal-body').innerHTML = this._getNoClaimsHTML();
                        }

                        this._showNotification('Claim denied', 'info');
                        resolve(true);
                    } else {
                        throw new Error(result.error || 'Failed to deny claim');
                    }
                } catch (error) {
                    console.error('[OwnershipClaimUI] Deny error:', error);
                    this._showNotification(error.message, 'error');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Deny Claim';
                }
            });
        });
    }

    // ==================== RELEASE CONFIRMATION ====================

    /**
     * Show release ownership confirmation
     * @param {string} assetId - Asset ID
     */
    async showReleaseConfirmation(assetId) {
        const confirmed = await this._showConfirmDialog(
            'Release Ownership',
            'Are you sure you want to release ownership of this asset? It will become available for others to claim.',
            'Release Ownership',
            'danger'
        );

        if (!confirmed) return;

        try {
            const currentUser = window.ownershipService.getCurrentUser();
            const result = await window.ownershipService.releaseOwnership(assetId, currentUser.uid);

            if (result.success) {
                this._showNotification('Ownership released successfully', 'info');
                this._refreshBanners(assetId);
            } else {
                throw new Error(result.error || 'Failed to release ownership');
            }
        } catch (error) {
            console.error('[OwnershipClaimUI] Release error:', error);
            this._showNotification(error.message, 'error');
        }
    }

    /**
     * Show transfer confirmation dialog
     * @param {string} assetId - Asset ID
     * @param {string} toUserId - User ID to transfer to
     * @param {string} toUserName - User name to transfer to
     */
    async showTransferConfirmation(assetId, toUserId, toUserName) {
        const confirmed = await this._showConfirmDialog(
            'Transfer Ownership',
            `Are you sure you want to transfer ownership to ${toUserName}? This action cannot be undone.`,
            'Transfer',
            'warning'
        );

        if (!confirmed) return;

        try {
            const currentUser = window.ownershipService.getCurrentUser();
            const result = await window.ownershipService.transferOwnership(assetId, currentUser.uid, toUserId);

            if (result.success) {
                this._showNotification(`Ownership transferred to ${toUserName}`, 'success');
                this._refreshBanners(assetId);
            } else {
                throw new Error(result.error || 'Failed to transfer ownership');
            }
        } catch (error) {
            console.error('[OwnershipClaimUI] Transfer error:', error);
            this._showNotification(error.message, 'error');
        }
    }

    // ==================== COUNTDOWN TIMER ====================

    /**
     * Start countdown timer for unclaimed asset
     * @private
     */
    _startCountdown(banner, unclaimedSince) {
        const countdownEl = banner.querySelector('.countdown-timer');
        if (!countdownEl) return;

        // Clear any existing interval for this banner
        const existingInterval = this.countdownIntervals.get(banner);
        if (existingInterval) {
            clearInterval(existingInterval);
        }

        const updateCountdown = () => {
            const timeLeft = this._getTimeLeftString(unclaimedSince);
            countdownEl.textContent = timeLeft;

            // Check if auto-transfer is imminent (less than 24 hours)
            const unclaimedDate = unclaimedSince instanceof Date
                ? unclaimedSince
                : new Date(unclaimedSince);
            const daysUnclaimed = (Date.now() - unclaimedDate.getTime()) / (1000 * 60 * 60 * 24);
            const daysLeft = this.AUTO_TRANSFER_DAYS - daysUnclaimed;

            if (daysLeft <= 1 && daysLeft > 0) {
                countdownEl.classList.add('countdown-urgent');
            } else if (daysLeft <= 0) {
                countdownEl.textContent = 'Eligible now';
                countdownEl.classList.add('countdown-complete');
                clearInterval(interval);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute
        this.countdownIntervals.set(banner, interval);
    }

    /**
     * Get time left string for countdown
     * @private
     */
    _getTimeLeftString(unclaimedSince) {
        const unclaimedDate = unclaimedSince instanceof Date
            ? unclaimedSince
            : new Date(unclaimedSince);

        const targetDate = new Date(unclaimedDate.getTime() + (this.AUTO_TRANSFER_DAYS * 24 * 60 * 60 * 1000));
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            return 'Eligible now';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Show confirmation dialog
     * @private
     */
    _showConfirmDialog(title, message, confirmText, type = 'info') {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'modal-overlay confirm-dialog-overlay';
            dialog.innerHTML = `
                <div class="confirm-dialog">
                    <div class="confirm-dialog-icon ${type}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${type === 'danger' ?
                                '<path d="M18 6L6 18M6 6l12 12"/>' :
                                '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'}
                        </svg>
                    </div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-dialog-actions">
                        <button class="modal-btn modal-btn-secondary btn-cancel">Cancel</button>
                        <button class="modal-btn ${type === 'danger' ? 'modal-btn-danger' : 'modal-btn-primary'} btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            requestAnimationFrame(() => {
                dialog.classList.add('show');
            });

            const closeDialog = (result) => {
                dialog.classList.remove('show');
                setTimeout(() => dialog.remove(), 300);
                resolve(result);
            };

            dialog.querySelector('.btn-cancel').addEventListener('click', () => closeDialog(false));
            dialog.querySelector('.btn-confirm').addEventListener('click', () => closeDialog(true));
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) closeDialog(false);
            });
        });
    }

    /**
     * Close current modal
     * @private
     */
    _closeModal(modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            modal.remove();
            if (this.currentModal === modal) {
                this.currentModal = null;
            }
        }, 300);
    }

    /**
     * Refresh ownership banners on the page
     * @private
     */
    _refreshBanners(assetId) {
        const banners = document.querySelectorAll(`.ownership-banner[data-asset-id="${assetId}"]`);
        banners.forEach(async (banner) => {
            const container = banner.parentElement;
            const newBanner = await this.createOwnershipBanner(assetId, { showActions: true });
            container.replaceChild(newBanner, banner);
        });
    }

    /**
     * Show notification toast
     * @private
     */
    _showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ownership-notification ownership-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${type === 'success' ? '<path d="M20 6L9 17l-5-5"/>' :
                      type === 'error' ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' :
                      type === 'warning' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>' :
                      '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'}
                </svg>
            </div>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Get initials from name
     * @private
     */
    _getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    /**
     * Format date for display
     * @private
     */
    _formatDate(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Inject component styles
     * @private
     */
    _injectStyles() {
        if (document.getElementById('ownership-claim-ui-styles')) return;

        const link = document.createElement('link');
        link.id = 'ownership-claim-ui-styles';
        link.rel = 'stylesheet';
        link.href = 'css/ownership-ui.css';
        document.head.appendChild(link);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Clear all countdown intervals
        this.countdownIntervals.forEach(interval => clearInterval(interval));
        this.countdownIntervals.clear();

        // Close any open modals
        if (this.currentModal) {
            this._closeModal(this.currentModal);
        }
    }
}

// Create singleton instance
window.ownershipClaimUI = window.ownershipClaimUI || new OwnershipClaimUI();

// Export class
if (typeof window !== 'undefined') {
    window.OwnershipClaimUI = OwnershipClaimUI;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OwnershipClaimUI;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Create an ownership banner:
 *    const banner = await ownershipClaimUI.createOwnershipBanner('asset123', {
 *      container: document.getElementById('asset-header'),
 *      showActions: true
 *    });
 *
 * 2. Show claim modal directly:
 *    await ownershipClaimUI.showClaimModal('asset123');
 *
 * 3. Show management panel (for owners):
 *    await ownershipClaimUI.showClaimManagementPanel('asset123');
 *
 * 4. Show release confirmation:
 *    await ownershipClaimUI.showReleaseConfirmation('asset123');
 *
 * 5. Show transfer confirmation:
 *    await ownershipClaimUI.showTransferConfirmation('asset123', 'userId456', 'John Doe');
 */
