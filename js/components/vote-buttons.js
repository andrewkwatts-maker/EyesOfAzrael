/**
 * Vote Buttons Component
 * Interactive upvote/downvote buttons with real-time updates
 *
 * Features:
 * - Real-time vote count updates
 * - Optimistic UI updates for instant feedback
 * - User vote state persistence
 * - Login prompt for unauthenticated users
 * - Rate limiting with user feedback
 * - Error handling with retry
 * - Accessibility support
 *
 * Dependencies:
 * - VoteService (js/services/vote-service.js)
 * - FirebaseService (js/firebase-init.js)
 * - vote-buttons.css
 */

class VoteButtonsComponent {
    /**
     * @param {HTMLElement} container - Container element with data-item-id and data-item-type
     */
    constructor(container) {
        this.container = container;
        this.itemId = container.dataset.itemId;
        this.itemType = container.dataset.itemType;

        if (!this.itemId || !this.itemType) {
            throw new Error('Vote buttons require data-item-id and data-item-type attributes');
        }

        // State
        this.userVote = 0; // 1, -1, or 0
        this.totalVotes = 0;
        this.upvoteCount = 0;
        this.downvoteCount = 0;
        this.isLoading = false;
        this.isAuthenticated = false;

        // Service references
        this.voteService = null;
        this.unsubscribe = null;

        // UI elements (will be set in render)
        this.upvoteBtn = null;
        this.downvoteBtn = null;
        this.totalVotesEl = null;
        this.upvoteCountEl = null;
        this.downvoteCountEl = null;
        this.loadingEl = null;
        this.errorEl = null;
        this.loginPromptEl = null;
        this.rateLimitWarningEl = null;

        // Initialize
        this.init();
    }

    /**
     * Initialize component
     */
    async init() {
        try {
            // Wait for Firebase to be ready
            if (typeof window.waitForFirebase === 'function') {
                await window.waitForFirebase();
            }

            // Initialize vote service
            if (window.VoteService && window.db && window.auth) {
                this.voteService = new window.VoteService(window.db, window.auth);
            } else {
                throw new Error('VoteService or Firebase not available');
            }

            // Check authentication
            this.isAuthenticated = window.FirebaseService?.isAuthenticated() || false;

            // Render UI
            this.render();

            // Load initial data
            await this.loadVoteData();

            // Subscribe to real-time updates
            this.subscribeToUpdates();

            // Listen for auth state changes
            this.listenForAuthChanges();

            // Listen for global vote events
            this.listenForVoteEvents();

            console.log(`[VoteButtons] Initialized for ${this.itemType}/${this.itemId}`);

        } catch (error) {
            console.error('[VoteButtons] Initialization error:', error);
            this.showError('Failed to initialize voting. Please refresh the page.');
        }
    }

    /**
     * Render vote buttons UI
     */
    render() {
        // Determine template based on container class
        let templateId = 'vote-buttons-template';
        if (this.container.classList.contains('compact')) {
            templateId = 'vote-buttons-compact-template';
        } else if (this.container.classList.contains('inline')) {
            templateId = 'vote-buttons-inline-template';
        }

        // Get template
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`[VoteButtons] Template ${templateId} not found`);
            return;
        }

        // Clone template content
        const content = template.content.cloneNode(true);

        // Clear container and append template
        this.container.innerHTML = '';
        this.container.appendChild(content);

        // Get UI element references
        this.upvoteBtn = this.container.querySelector('.upvote-btn');
        this.downvoteBtn = this.container.querySelector('.downvote-btn');
        this.totalVotesEl = this.container.querySelector('.total-votes-value');
        this.upvoteCountEl = this.container.querySelector('.upvote-count');
        this.downvoteCountEl = this.container.querySelector('.downvote-count');
        this.loadingEl = this.container.querySelector('.vote-loading');
        this.errorEl = this.container.querySelector('.vote-error-message');
        this.loginPromptEl = this.container.querySelector('.vote-login-prompt');
        this.rateLimitWarningEl = this.container.querySelector('.vote-rate-limit-warning');

        // Add event listeners
        if (this.upvoteBtn) {
            this.upvoteBtn.addEventListener('click', () => this.handleVoteClick(1));
        }
        if (this.downvoteBtn) {
            this.downvoteBtn.addEventListener('click', () => this.handleVoteClick(-1));
        }

        // Set initial state
        this.updateUI();
    }

    /**
     * Load vote data from Firebase
     */
    async loadVoteData() {
        if (!this.voteService) return;

        try {
            // Load user's vote
            if (this.isAuthenticated) {
                const userVoteResult = await this.voteService.getUserVote(this.itemId, this.itemType);
                if (userVoteResult.success) {
                    this.userVote = userVoteResult.vote || 0;
                }
            }

            // Load vote counts
            const countsResult = await this.voteService.getVoteCounts(this.itemId, this.itemType);
            if (countsResult.success) {
                this.upvoteCount = countsResult.upvotes || 0;
                this.downvoteCount = countsResult.downvotes || 0;
                this.totalVotes = countsResult.total || 0;
            }

            this.updateUI();

        } catch (error) {
            console.error('[VoteButtons] Load vote data error:', error);
        }
    }

    /**
     * Handle vote button click
     * @param {number} voteValue - 1 for upvote, -1 for downvote
     */
    async handleVoteClick(voteValue) {
        // Check authentication
        if (!this.isAuthenticated) {
            this.showLoginPrompt();
            return;
        }

        // Prevent double-clicking
        if (this.isLoading) return;

        // Optimistic UI update
        const previousState = {
            userVote: this.userVote,
            totalVotes: this.totalVotes,
            upvoteCount: this.upvoteCount,
            downvoteCount: this.downvoteCount
        };

        this.applyOptimisticUpdate(voteValue);
        this.setLoading(true);

        try {
            // Send vote to server
            const result = await this.voteService.handleVote(this.itemId, this.itemType, voteValue);

            if (result.success) {
                // Update with actual server response
                this.userVote = result.userVote;
                this.totalVotes = result.newVotes;

                // Reload full counts for accuracy
                await this.loadVoteData();

                this.hideError();
                this.hideRateLimitWarning();
            } else {
                // Revert optimistic update on error
                this.userVote = previousState.userVote;
                this.totalVotes = previousState.totalVotes;
                this.upvoteCount = previousState.upvoteCount;
                this.downvoteCount = previousState.downvoteCount;

                // Show error
                if (result.error.includes('Too many votes')) {
                    this.showRateLimitWarning();
                } else {
                    this.showError(result.error);
                }
            }

        } catch (error) {
            // Revert optimistic update on exception
            this.userVote = previousState.userVote;
            this.totalVotes = previousState.totalVotes;
            this.upvoteCount = previousState.upvoteCount;
            this.downvoteCount = previousState.downvoteCount;

            console.error('[VoteButtons] Vote error:', error);
            this.showError('Failed to record vote. Please try again.');
        } finally {
            this.setLoading(false);
            this.updateUI();
        }
    }

    /**
     * Apply optimistic UI update before server response
     * @param {number} voteValue - 1 for upvote, -1 for downvote
     */
    applyOptimisticUpdate(voteValue) {
        const oldVote = this.userVote;

        if (oldVote === voteValue) {
            // Remove vote
            this.userVote = 0;
            this.totalVotes -= voteValue;
            if (voteValue === 1) {
                this.upvoteCount--;
            } else {
                this.downvoteCount--;
            }
        } else if (oldVote === 0) {
            // New vote
            this.userVote = voteValue;
            this.totalVotes += voteValue;
            if (voteValue === 1) {
                this.upvoteCount++;
            } else {
                this.downvoteCount++;
            }
        } else {
            // Change vote
            this.userVote = voteValue;
            this.totalVotes += voteValue * 2; // Swing by 2
            if (voteValue === 1) {
                this.upvoteCount++;
                this.downvoteCount--;
            } else {
                this.downvoteCount++;
                this.upvoteCount--;
            }
        }

        this.updateUI();
    }

    /**
     * Subscribe to real-time vote updates
     */
    subscribeToUpdates() {
        if (!this.voteService) return;

        this.unsubscribe = this.voteService.subscribeToVotes(
            this.itemId,
            this.itemType,
            (data) => {
                // Only update if different (prevents unnecessary re-renders)
                if (data.votes !== this.totalVotes) {
                    this.totalVotes = data.votes;
                    this.updateUI();
                }
            }
        );
    }

    /**
     * Listen for auth state changes
     */
    listenForAuthChanges() {
        window.addEventListener('firebaseAuthStateChanged', async (event) => {
            const wasAuthenticated = this.isAuthenticated;
            this.isAuthenticated = event.detail.user !== null;

            if (!wasAuthenticated && this.isAuthenticated) {
                // User just logged in, reload vote data
                await this.loadVoteData();
                this.hideLoginPrompt();
            } else if (wasAuthenticated && !this.isAuthenticated) {
                // User logged out, reset state
                this.userVote = 0;
                this.showLoginPrompt();
            }

            this.updateUI();
        });
    }

    /**
     * Listen for global vote events from other components
     */
    listenForVoteEvents() {
        window.addEventListener('voteUpdated', (event) => {
            const { itemId, itemType, newVotes, userVote } = event.detail;

            // Only update if it's for this item
            if (itemId === this.itemId && itemType === this.itemType) {
                this.totalVotes = newVotes;
                this.userVote = userVote;
                this.updateUI();
            }
        });
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        if (!this.upvoteBtn || !this.downvoteBtn) return;

        // Update button states
        this.upvoteBtn.dataset.active = (this.userVote === 1).toString();
        this.downvoteBtn.dataset.active = (this.userVote === -1).toString();

        // Update vote counts
        if (this.totalVotesEl) {
            this.totalVotesEl.textContent = this.formatVoteCount(this.totalVotes);
            this.totalVotesEl.className = 'total-votes-value ' + this.getVoteClass(this.totalVotes);

            // Update tooltip
            const tooltip = `${this.totalVotes} net votes (${this.upvoteCount} up, ${this.downvoteCount} down)`;
            this.totalVotesEl.title = tooltip;
            if (this.totalVotesEl.parentElement) {
                this.totalVotesEl.parentElement.title = tooltip;
            }
        }

        if (this.upvoteCountEl) {
            this.upvoteCountEl.textContent = this.upvoteCount;
        }

        if (this.downvoteCountEl) {
            this.downvoteCountEl.textContent = this.downvoteCount;
        }

        // Disable buttons if not authenticated
        if (this.upvoteBtn && this.downvoteBtn) {
            this.upvoteBtn.disabled = !this.isAuthenticated || this.isLoading;
            this.downvoteBtn.disabled = !this.isAuthenticated || this.isLoading;
        }

        // Show/hide login prompt
        if (!this.isAuthenticated) {
            this.showLoginPrompt();
        }
    }

    /**
     * Format vote count for display
     * @param {number} count - Vote count
     * @returns {string} Formatted count
     */
    formatVoteCount(count) {
        if (count === 0) return '0';
        if (count > 0) return `+${count}`;
        return count.toString();
    }

    /**
     * Get CSS class based on vote count
     * @param {number} count - Vote count
     * @returns {string} CSS class
     */
    getVoteClass(count) {
        if (count > 0) return 'positive';
        if (count < 0) return 'negative';
        return 'neutral';
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        if (this.loadingEl) {
            this.loadingEl.style.display = loading ? 'block' : 'none';
        }

        if (this.upvoteBtn && this.downvoteBtn) {
            this.upvoteBtn.disabled = loading;
            this.downvoteBtn.disabled = loading;
        }

        this.container.classList.toggle('loading', loading);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.errorEl) {
            const errorText = this.errorEl.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            this.errorEl.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => this.hideError(), 5000);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.errorEl) {
            this.errorEl.style.display = 'none';
        }
    }

    /**
     * Show login prompt
     */
    showLoginPrompt() {
        if (this.loginPromptEl) {
            this.loginPromptEl.style.display = 'block';
        }
    }

    /**
     * Hide login prompt
     */
    hideLoginPrompt() {
        if (this.loginPromptEl) {
            this.loginPromptEl.style.display = 'none';
        }
    }

    /**
     * Show rate limit warning
     */
    showRateLimitWarning() {
        if (this.rateLimitWarningEl) {
            this.rateLimitWarningEl.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => this.hideRateLimitWarning(), 5000);
        }
    }

    /**
     * Hide rate limit warning
     */
    hideRateLimitWarning() {
        if (this.rateLimitWarningEl) {
            this.rateLimitWarningEl.style.display = 'none';
        }
    }

    /**
     * Cleanup and remove event listeners
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        if (this.voteService) {
            this.voteService.cleanup();
        }

        if (this.upvoteBtn) {
            this.upvoteBtn.removeEventListener('click', this.handleVoteClick);
        }

        if (this.downvoteBtn) {
            this.downvoteBtn.removeEventListener('click', this.handleVoteClick);
        }

        console.log(`[VoteButtons] Destroyed for ${this.itemType}/${this.itemId}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoteButtonsComponent;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VoteButtonsComponent = VoteButtonsComponent;
}

/**
 * Auto-initialize vote buttons on page load
 */
(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllVoteButtons);
    } else {
        initAllVoteButtons();
    }

    function initAllVoteButtons() {
        // Find all vote button containers
        const containers = document.querySelectorAll('.vote-buttons[data-item-id]:not([data-initialized])');

        containers.forEach(container => {
            try {
                new VoteButtonsComponent(container);
                container.dataset.initialized = 'true';
            } catch (error) {
                console.error('[VoteButtons] Auto-init error:', error);
            }
        });
    }

    // Re-initialize when new content is added dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check if the node itself is a vote buttons container
                    if (node.matches && node.matches('.vote-buttons[data-item-id]:not([data-initialized])')) {
                        try {
                            new VoteButtonsComponent(node);
                            node.dataset.initialized = 'true';
                        } catch (error) {
                            console.error('[VoteButtons] Dynamic init error:', error);
                        }
                    }

                    // Check for vote buttons containers within the node
                    const containers = node.querySelectorAll('.vote-buttons[data-item-id]:not([data-initialized])');
                    containers.forEach(container => {
                        try {
                            new VoteButtonsComponent(container);
                            container.dataset.initialized = 'true';
                        } catch (error) {
                            console.error('[VoteButtons] Dynamic init error:', error);
                        }
                    });
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

/**
 * USAGE EXAMPLES:
 *
 * 1. Basic usage in HTML:
 *    <div class="vote-buttons" data-item-id="asset123" data-item-type="assets"></div>
 *
 * 2. Compact variant:
 *    <div class="vote-buttons compact" data-item-id="note456" data-item-type="notes"></div>
 *
 * 3. Inline variant:
 *    <div class="vote-buttons inline" data-item-id="asset789" data-item-type="assets"></div>
 *
 * 4. Manual initialization:
 *    const container = document.getElementById('my-vote-buttons');
 *    const voteButtons = new VoteButtonsComponent(container);
 *
 * 5. Listen for vote events:
 *    window.addEventListener('voteUpdated', (event) => {
 *      console.log('Vote updated:', event.detail);
 *    });
 *
 * 6. Destroy component:
 *    voteButtons.destroy();
 */
