/**
 * Vote Buttons Component - Polished Edition
 * Interactive upvote/downvote buttons with premium animations and real-time updates
 *
 * Features:
 * - Optimistic UI updates with rollback on failure
 * - Confetti/sparkle effects on first upvote
 * - Animated vote count transitions
 * - Ripple click effects
 * - Real-time vote synchronization
 * - Karma display integration
 * - Toast notifications for feedback
 * - Full accessibility support (ARIA, keyboard nav)
 *
 * Dependencies:
 * - VoteService (js/services/vote-service.js)
 * - FirebaseService (js/firebase-init.js)
 * - vote-buttons.css
 */

class VoteButtonsComponent {
    /**
     * @param {HTMLElement} container - Container element with data-item-id and data-item-type
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.itemId = container.dataset.itemId;
        this.itemType = container.dataset.itemType;

        if (!this.itemId || !this.itemType) {
            throw new Error('Vote buttons require data-item-id and data-item-type attributes');
        }

        // Configuration
        this.options = {
            showConfetti: options.showConfetti !== false,
            showToast: options.showToast !== false,
            variant: options.variant || container.dataset.variant || 'default', // default, compact, inline, vertical
            showKarma: options.showKarma || false,
            ...options
        };

        // State
        this.userVote = 0; // 1, -1, or 0
        this.totalVotes = 0;
        this.upvoteCount = 0;
        this.downvoteCount = 0;
        this.isLoading = false;
        this.isAuthenticated = false;
        this.hasVotedBefore = false;
        this.previousTotalVotes = 0;

        // Service references
        this.voteService = null;
        this.unsubscribe = null;

        // UI elements
        this.upvoteBtn = null;
        this.downvoteBtn = null;
        this.totalVotesEl = null;
        this.upvoteCountEl = null;
        this.downvoteCountEl = null;
        this.loadingEl = null;
        this.errorEl = null;
        this.loginPromptEl = null;
        this.rateLimitWarningEl = null;
        this.confettiContainer = null;

        // Bound methods for event listeners
        this._handleUpvoteClick = this._handleUpvoteClick.bind(this);
        this._handleDownvoteClick = this._handleDownvoteClick.bind(this);
        this._handleAuthChange = this._handleAuthChange.bind(this);
        this._handleVoteEvent = this._handleVoteEvent.bind(this);

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
                console.warn('[VoteButtons] VoteService or Firebase not available, using mock mode');
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
            window.addEventListener('firebaseAuthStateChanged', this._handleAuthChange);

            // Listen for global vote events
            window.addEventListener('voteUpdated', this._handleVoteEvent);

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
        // Apply variant class
        this.container.classList.add('vote-buttons-container');
        if (this.options.variant !== 'default') {
            this.container.classList.add(this.options.variant);
        }

        // Build HTML
        this.container.innerHTML = this._getTemplate();

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
        this.confettiContainer = this.container.querySelector('.vote-confetti-container');

        // Add event listeners
        if (this.upvoteBtn) {
            this.upvoteBtn.addEventListener('click', this._handleUpvoteClick);
            this.upvoteBtn.addEventListener('mousedown', (e) => this._createRipple(e, this.upvoteBtn));
        }
        if (this.downvoteBtn) {
            this.downvoteBtn.addEventListener('click', this._handleDownvoteClick);
            this.downvoteBtn.addEventListener('mousedown', (e) => this._createRipple(e, this.downvoteBtn));
        }
        if (this.loginPromptEl) {
            this.loginPromptEl.addEventListener('click', () => this._triggerLogin());
        }

        // Set initial state
        this.updateUI();
    }

    /**
     * Get the HTML template based on variant
     */
    _getTemplate() {
        const upvoteIcon = this._getUpvoteIcon();
        const downvoteIcon = this._getDownvoteIcon();

        return `
            <div class="vote-confetti-container" aria-hidden="true"></div>

            <button type="button"
                    class="vote-btn upvote-btn"
                    data-active="false"
                    data-tooltip="Upvote"
                    aria-label="Upvote this ${this.itemType}"
                    aria-pressed="false">
                <span class="vote-icon">${upvoteIcon}</span>
                ${this.options.variant !== 'vertical' ? '<span class="upvote-count">0</span>' : ''}
                <span class="vote-sr-only">upvotes</span>
            </button>

            <div class="total-votes-display" aria-live="polite" aria-atomic="true">
                <span class="total-votes-value neutral" title="Net votes">0</span>
            </div>

            <button type="button"
                    class="vote-btn downvote-btn"
                    data-active="false"
                    data-tooltip="Downvote"
                    aria-label="Downvote this ${this.itemType}"
                    aria-pressed="false">
                <span class="vote-icon">${downvoteIcon}</span>
                ${this.options.variant !== 'vertical' ? '<span class="downvote-count">0</span>' : ''}
                <span class="vote-sr-only">downvotes</span>
            </button>

            <div class="vote-loading" aria-hidden="true">
                <div class="vote-spinner"></div>
            </div>

            <div class="vote-error-message" role="alert" aria-live="assertive">
                <span class="error-text">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <span></span>
                </span>
            </div>

            <div class="vote-login-prompt" role="button" tabindex="0">
                <span class="login-prompt-text">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"/>
                    </svg>
                    Sign in to vote
                </span>
            </div>

            <div class="vote-rate-limit-warning" role="alert">
                <span class="rate-limit-text">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    Slow down! Try again in a moment.
                </span>
            </div>
        `;
    }

    /**
     * Get upvote icon SVG
     */
    _getUpvoteIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>`;
    }

    /**
     * Get downvote icon SVG
     */
    _getDownvoteIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>`;
    }

    /**
     * Load vote data from Firebase
     */
    async loadVoteData() {
        if (!this.voteService) {
            // Use mock data if no service
            this.totalVotes = parseInt(this.container.dataset.initialVotes) || 0;
            this.upvoteCount = Math.max(0, this.totalVotes);
            this.downvoteCount = Math.abs(Math.min(0, this.totalVotes));
            this.updateUI();
            return;
        }

        try {
            // Load user's vote
            if (this.isAuthenticated) {
                const userVoteResult = await this.voteService.getUserVote(this.itemId, this.itemType);
                if (userVoteResult.success) {
                    this.userVote = userVoteResult.vote || 0;
                    this.hasVotedBefore = userVoteResult.vote !== 0;
                }
            }

            // Load vote counts
            const countsResult = await this.voteService.getVoteCounts(this.itemId, this.itemType);
            if (countsResult.success) {
                this.upvoteCount = countsResult.upvotes || 0;
                this.downvoteCount = countsResult.downvotes || 0;
                this.totalVotes = countsResult.total || 0;
            }

            this.previousTotalVotes = this.totalVotes;
            this.updateUI();

        } catch (error) {
            console.error('[VoteButtons] Load vote data error:', error);
        }
    }

    /**
     * Handle upvote button click
     */
    _handleUpvoteClick(e) {
        e.preventDefault();
        this.handleVoteClick(1);
    }

    /**
     * Handle downvote button click
     */
    _handleDownvoteClick(e) {
        e.preventDefault();
        this.handleVoteClick(-1);
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

        // Store previous state for rollback
        const previousState = {
            userVote: this.userVote,
            totalVotes: this.totalVotes,
            upvoteCount: this.upvoteCount,
            downvoteCount: this.downvoteCount
        };

        // Check if this is first upvote (for confetti)
        const isFirstUpvote = voteValue === 1 && this.userVote !== 1 && !this.hasVotedBefore;

        // Apply optimistic update
        this.applyOptimisticUpdate(voteValue);
        this.setLoading(true);

        try {
            if (!this.voteService) {
                // Mock mode - just keep the optimistic update
                await new Promise(resolve => setTimeout(resolve, 300));
                this.hasVotedBefore = true;

                if (isFirstUpvote && this.options.showConfetti) {
                    this._triggerConfetti();
                }

                this._animateVoteCount();
                return;
            }

            // Send vote to server
            const result = await this.voteService.handleVote(this.itemId, this.itemType, voteValue);

            if (result.success) {
                // Update with actual server response
                this.userVote = result.userVote;
                this.previousTotalVotes = this.totalVotes;
                this.totalVotes = result.newVotes;
                this.hasVotedBefore = true;

                // Trigger effects
                if (isFirstUpvote && this.options.showConfetti) {
                    this._triggerConfetti();
                }

                this._animateVoteCount();

                // Reload full counts for accuracy
                await this.loadVoteData();

                this.hideError();
                this.hideRateLimitWarning();

                // Dispatch success event
                this._dispatchVoteEvent(true);

            } else {
                // Revert optimistic update on error
                this._revertToState(previousState);

                if (result.error.includes('Too many votes') || result.error.includes('rate')) {
                    this.showRateLimitWarning();
                } else {
                    this.showError(result.error);
                }

                // Dispatch failure event
                this._dispatchVoteEvent(false, result.error);
            }

        } catch (error) {
            // Revert optimistic update on exception
            this._revertToState(previousState);

            console.error('[VoteButtons] Vote error:', error);
            this.showError('Failed to record vote. Please try again.');
            this._dispatchVoteEvent(false, error.message);

        } finally {
            this.setLoading(false);
            this.updateUI();
        }
    }

    /**
     * Revert to a previous state
     */
    _revertToState(state) {
        this.userVote = state.userVote;
        this.totalVotes = state.totalVotes;
        this.upvoteCount = state.upvoteCount;
        this.downvoteCount = state.downvoteCount;
    }

    /**
     * Apply optimistic UI update before server response
     * @param {number} voteValue - 1 for upvote, -1 for downvote
     */
    applyOptimisticUpdate(voteValue) {
        const oldVote = this.userVote;
        this.previousTotalVotes = this.totalVotes;

        if (oldVote === voteValue) {
            // Remove vote (toggle off)
            this.userVote = 0;
            this.totalVotes -= voteValue;
            if (voteValue === 1) {
                this.upvoteCount = Math.max(0, this.upvoteCount - 1);
            } else {
                this.downvoteCount = Math.max(0, this.downvoteCount - 1);
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
            // Change vote (switch)
            this.userVote = voteValue;
            this.totalVotes += voteValue * 2; // Swing by 2
            if (voteValue === 1) {
                this.upvoteCount++;
                this.downvoteCount = Math.max(0, this.downvoteCount - 1);
            } else {
                this.downvoteCount++;
                this.upvoteCount = Math.max(0, this.upvoteCount - 1);
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
                    this.previousTotalVotes = this.totalVotes;
                    this.totalVotes = data.votes;
                    this._animateVoteCount();
                    this.updateUI();
                }
            }
        );
    }

    /**
     * Handle auth state changes
     */
    async _handleAuthChange(event) {
        const wasAuthenticated = this.isAuthenticated;
        this.isAuthenticated = event.detail.user !== null;

        if (!wasAuthenticated && this.isAuthenticated) {
            // User just logged in, reload vote data
            await this.loadVoteData();
            this.hideLoginPrompt();
        } else if (wasAuthenticated && !this.isAuthenticated) {
            // User logged out, reset state
            this.userVote = 0;
            this.hasVotedBefore = false;
        }

        this.updateUI();
    }

    /**
     * Handle global vote events from other components
     */
    _handleVoteEvent(event) {
        const { itemId, itemType, newVotes, userVote } = event.detail;

        // Only update if it's for this item
        if (itemId === this.itemId && itemType === this.itemType) {
            this.previousTotalVotes = this.totalVotes;
            this.totalVotes = newVotes;
            this.userVote = userVote;
            this._animateVoteCount();
            this.updateUI();
        }
    }

    /**
     * Dispatch vote event for other components
     */
    _dispatchVoteEvent(success, error = null) {
        const event = new CustomEvent('voteUpdated', {
            bubbles: true,
            detail: {
                itemId: this.itemId,
                itemType: this.itemType,
                newVotes: this.totalVotes,
                userVote: this.userVote,
                success,
                error
            }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        if (!this.upvoteBtn || !this.downvoteBtn) return;

        // Update button states
        const isUpvoted = this.userVote === 1;
        const isDownvoted = this.userVote === -1;
        const hasVoted = this.userVote !== 0;

        this.upvoteBtn.dataset.active = isUpvoted.toString();
        this.upvoteBtn.setAttribute('aria-pressed', isUpvoted.toString());
        this.upvoteBtn.classList.toggle('has-voted', hasVoted && !isUpvoted);

        this.downvoteBtn.dataset.active = isDownvoted.toString();
        this.downvoteBtn.setAttribute('aria-pressed', isDownvoted.toString());
        this.downvoteBtn.classList.toggle('has-voted', hasVoted && !isDownvoted);

        // Mark container as voted
        this.container.classList.toggle('user-voted', hasVoted);
        this.container.classList.toggle('voted-up', isUpvoted);
        this.container.classList.toggle('voted-down', isDownvoted);

        // Update vote counts
        if (this.totalVotesEl) {
            const formattedCount = this.formatVoteCount(this.totalVotes);
            this.totalVotesEl.textContent = formattedCount;
            this.totalVotesEl.className = 'total-votes-value ' + this.getVoteClass(this.totalVotes);

            // Update display container class for glow effect
            const displayEl = this.totalVotesEl.parentElement;
            if (displayEl) {
                displayEl.classList.remove('high-positive', 'high-negative');
                if (this.totalVotes >= 10) {
                    displayEl.classList.add('high-positive');
                } else if (this.totalVotes <= -10) {
                    displayEl.classList.add('high-negative');
                }

                // Update tooltip
                const tooltip = `${this.totalVotes} net votes (${this.upvoteCount} up, ${this.downvoteCount} down)`;
                displayEl.title = tooltip;
                this.totalVotesEl.title = tooltip;
            }
        }

        if (this.upvoteCountEl) {
            this.upvoteCountEl.textContent = this.formatCount(this.upvoteCount);
        }

        if (this.downvoteCountEl) {
            this.downvoteCountEl.textContent = this.formatCount(this.downvoteCount);
        }

        // Update button states based on auth
        const disabled = !this.isAuthenticated || this.isLoading;
        this.upvoteBtn.disabled = disabled;
        this.downvoteBtn.disabled = disabled;

        // Update tooltips
        if (!this.isAuthenticated) {
            this.upvoteBtn.dataset.tooltip = 'Sign in to upvote';
            this.downvoteBtn.dataset.tooltip = 'Sign in to downvote';
        } else {
            this.upvoteBtn.dataset.tooltip = isUpvoted ? 'Remove upvote' : 'Upvote';
            this.downvoteBtn.dataset.tooltip = isDownvoted ? 'Remove downvote' : 'Downvote';
        }

        // Show/hide login prompt
        if (!this.isAuthenticated && this.loginPromptEl) {
            // Only show on hover/focus, not always
            this.container.classList.add('needs-auth');
        } else {
            this.container.classList.remove('needs-auth');
            this.hideLoginPrompt();
        }
    }

    /**
     * Animate vote count change
     */
    _animateVoteCount() {
        if (!this.totalVotesEl) return;

        // Determine direction
        const isIncreasing = this.totalVotes > this.previousTotalVotes;
        const isDecreasing = this.totalVotes < this.previousTotalVotes;

        // Remove existing animation classes
        this.totalVotesEl.classList.remove('changed', 'increasing', 'decreasing');

        // Force reflow
        void this.totalVotesEl.offsetWidth;

        // Add animation classes
        this.totalVotesEl.classList.add('changed');
        if (isIncreasing) {
            this.totalVotesEl.classList.add('increasing');
        } else if (isDecreasing) {
            this.totalVotesEl.classList.add('decreasing');
        }

        // Remove animation class after animation completes
        setTimeout(() => {
            this.totalVotesEl.classList.remove('changed', 'increasing', 'decreasing');
        }, 400);

        // Also animate individual counts
        if (this.upvoteCountEl) {
            this.upvoteCountEl.classList.add('animating');
            setTimeout(() => this.upvoteCountEl.classList.remove('animating'), 300);
        }
        if (this.downvoteCountEl) {
            this.downvoteCountEl.classList.add('animating');
            setTimeout(() => this.downvoteCountEl.classList.remove('animating'), 300);
        }
    }

    /**
     * Create ripple effect on button click
     */
    _createRipple(event, button) {
        const rect = button.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        button.style.setProperty('--ripple-x', `${x}%`);
        button.style.setProperty('--ripple-y', `${y}%`);

        button.classList.remove('rippling');
        void button.offsetWidth; // Force reflow
        button.classList.add('rippling');

        setTimeout(() => button.classList.remove('rippling'), 500);
    }

    /**
     * Trigger enhanced confetti/celebration effect
     */
    _triggerConfetti() {
        if (!this.confettiContainer || !this.options.showConfetti) return;

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // Premium color palette
        const colors = [
            '#10b981', '#34d399', '#6ee7b7',  // Greens
            '#fbbf24', '#f59e0b', '#fcd34d',  // Golds
            '#8b5cf6', '#a78bfa',              // Purples
            '#ffffff'                           // White sparkles
        ];
        const particleCount = 16;

        // Create burst effect from upvote button
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const isSpecial = Math.random() > 0.7;
            particle.className = 'vote-confetti' + (isSpecial ? ' star' : '') + (Math.random() > 0.8 ? ' heart' : '');

            // Spread particles in burst pattern
            const angle = (i / particleCount) * 360 + (Math.random() - 0.5) * 30;
            const distance = 30 + Math.random() * 40;
            particle.style.setProperty('--angle', angle + 'deg');
            particle.style.setProperty('--distance', distance + 'px');

            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDelay = `${Math.random() * 0.15}s`;
            particle.style.animationDuration = `${0.6 + Math.random() * 0.4}s`;
            particle.style.setProperty('--rotation', (Math.random() * 720 - 360) + 'deg');

            this.confettiContainer.appendChild(particle);
            setTimeout(() => particle.remove(), 1200);
        }

        // Add expanding ring effect
        const ring = document.createElement('div');
        ring.className = 'vote-ring-burst';
        this.confettiContainer.appendChild(ring);
        setTimeout(() => ring.remove(), 600);

        // Add sparkles in starburst pattern
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'vote-sparkle';
            const angle = (i / 8) * 360;
            const distance = 25 + Math.random() * 20;
            sparkle.style.left = `calc(50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`;
            sparkle.style.top = `calc(50% + ${Math.sin(angle * Math.PI / 180) * distance}px)`;
            sparkle.style.animationDelay = `${i * 0.05}s`;

            this.confettiContainer.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 900);
        }

        // Add floating +1 indicator
        const plusOne = document.createElement('div');
        plusOne.className = 'vote-plus-one';
        plusOne.textContent = '+1';
        plusOne.style.color = '#10b981';
        this.confettiContainer.appendChild(plusOne);
        setTimeout(() => plusOne.remove(), 1000);

        // Show toast if enabled
        if (this.options.showToast) {
            this._showToast('Thanks for your vote!', 'success');
        }
    }

    /**
     * Show toast notification
     */
    _showToast(message, type = 'info') {
        // Check if toast already exists
        let toast = document.querySelector('.vote-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'vote-toast';
            toast.innerHTML = `
                <span class="vote-toast-icon"></span>
                <span class="vote-toast-message"></span>
            `;
            document.body.appendChild(toast);
        }

        // Update content
        toast.className = `vote-toast ${type}`;
        toast.querySelector('.vote-toast-message').textContent = message;

        const iconEl = toast.querySelector('.vote-toast-icon');
        if (type === 'success') {
            iconEl.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
        } else if (type === 'error') {
            iconEl.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
        }

        // Show toast
        requestAnimationFrame(() => toast.classList.add('show'));

        // Hide after delay
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Format vote count for display with k/M suffixes
     * @param {number} count - Vote count
     * @returns {string} Formatted count (e.g., +1.2k, -500, +2.3M)
     */
    formatVoteCount(count) {
        if (count === 0) return '0';

        const absCount = Math.abs(count);
        const sign = count > 0 ? '+' : '';

        if (absCount >= 1000000) {
            // Millions
            const formatted = (count / 1000000).toFixed(1);
            // Remove trailing .0
            return sign + formatted.replace(/\.0$/, '') + 'M';
        } else if (absCount >= 10000) {
            // Tens of thousands - no decimal
            return sign + Math.round(count / 1000) + 'k';
        } else if (absCount >= 1000) {
            // Thousands with one decimal
            const formatted = (count / 1000).toFixed(1);
            // Remove trailing .0
            return sign + formatted.replace(/\.0$/, '') + 'k';
        }

        return sign + count.toString();
    }

    /**
     * Format individual count (upvotes/downvotes) without sign
     * @param {number} count - Vote count
     * @returns {string} Formatted count
     */
    formatCount(count) {
        if (count >= 1000000) {
            const formatted = (count / 1000000).toFixed(1);
            return formatted.replace(/\.0$/, '') + 'M';
        } else if (count >= 10000) {
            return Math.round(count / 1000) + 'k';
        } else if (count >= 1000) {
            const formatted = (count / 1000).toFixed(1);
            return formatted.replace(/\.0$/, '') + 'k';
        }
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
        this.container.classList.toggle('loading', loading);

        if (this.loadingEl) {
            this.loadingEl.classList.toggle('active', loading);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.errorEl) {
            const errorText = this.errorEl.querySelector('.error-text span');
            if (errorText) {
                errorText.textContent = message;
            }
            this.errorEl.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => this.hideError(), 5000);
        }

        if (this.options.showToast) {
            this._showToast(message, 'error');
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
     * Trigger login flow
     */
    _triggerLogin() {
        // Dispatch event for auth system to handle
        const event = new CustomEvent('requestLogin', {
            bubbles: true,
            detail: { source: 'vote-buttons' }
        });
        this.container.dispatchEvent(event);

        // Also try direct Firebase auth if available
        if (window.FirebaseService?.signInWithGoogle) {
            window.FirebaseService.signInWithGoogle();
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
            this.voteService.cleanup?.();
        }

        if (this.upvoteBtn) {
            this.upvoteBtn.removeEventListener('click', this._handleUpvoteClick);
        }

        if (this.downvoteBtn) {
            this.downvoteBtn.removeEventListener('click', this._handleDownvoteClick);
        }

        window.removeEventListener('firebaseAuthStateChanged', this._handleAuthChange);
        window.removeEventListener('voteUpdated', this._handleVoteEvent);

        console.log(`[VoteButtons] Destroyed for ${this.itemType}/${this.itemId}`);
    }
}

// ==================== KARMA DISPLAY COMPONENT ====================

/**
 * Karma Display Component
 * Shows user karma score with level indicator and progress
 */
class KarmaDisplay {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            userId: options.userId || container.dataset.userId,
            showProgress: options.showProgress !== false,
            compact: options.compact || false,
            ...options
        };

        this.karma = 0;
        this.level = 'newcomer';
        this.progress = 0;

        this.levels = [
            { name: 'Newcomer', min: 0, class: 'newcomer' },
            { name: 'Contributor', min: 10, class: 'contributor' },
            { name: 'Scholar', min: 50, class: 'scholar' },
            { name: 'Sage', min: 200, class: 'sage' },
            { name: 'Master', min: 500, class: 'master' },
            { name: 'Legend', min: 1000, class: 'legend' }
        ];

        this.init();
    }

    async init() {
        this.karma = parseInt(this.container.dataset.karma) || 0;
        this.calculateLevel();
        this.render();
    }

    calculateLevel() {
        let currentLevel = this.levels[0];
        let nextLevel = this.levels[1];

        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.karma >= this.levels[i].min) {
                currentLevel = this.levels[i];
                nextLevel = this.levels[i + 1] || null;
                break;
            }
        }

        this.level = currentLevel;

        // Calculate progress to next level
        if (nextLevel) {
            const range = nextLevel.min - currentLevel.min;
            const current = this.karma - currentLevel.min;
            this.progress = Math.min(100, (current / range) * 100);
        } else {
            this.progress = 100; // Max level
        }
    }

    render() {
        this.container.className = `karma-display ${this.options.compact ? 'compact' : ''}`;

        this.container.innerHTML = `
            <div class="karma-score">
                <span class="karma-value">${this.formatKarma(this.karma)}</span>
                <span class="karma-label">Karma</span>
            </div>
            <div class="karma-level ${this.level.class}">
                <span class="karma-level-name">${this.level.name}</span>
                ${this.options.showProgress ? `
                    <div class="karma-progress" title="${Math.round(this.progress)}% to next level">
                        <div class="karma-progress-bar" style="width: ${this.progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    formatKarma(value) {
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toString();
    }

    update(newKarma) {
        this.karma = newKarma;
        this.calculateLevel();
        this.render();
    }
}

// ==================== EXPORTS AND AUTO-INIT ====================

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoteButtonsComponent, KarmaDisplay };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VoteButtonsComponent = VoteButtonsComponent;
    window.KarmaDisplay = KarmaDisplay;
}

/**
 * Auto-initialize vote buttons on page load
 */
(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    function initAll() {
        initAllVoteButtons();
        initAllKarmaDisplays();
    }

    function initAllVoteButtons() {
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

    function initAllKarmaDisplays() {
        const containers = document.querySelectorAll('.karma-display[data-karma]:not([data-initialized])');

        containers.forEach(container => {
            try {
                new KarmaDisplay(container);
                container.dataset.initialized = 'true';
            } catch (error) {
                console.error('[KarmaDisplay] Auto-init error:', error);
            }
        });
    }

    // Re-initialize when new content is added dynamically
    const observer = new MutationObserver((mutations) => {
        let needsInit = false;

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.matches?.('.vote-buttons[data-item-id]:not([data-initialized])') ||
                        node.matches?.('.karma-display[data-karma]:not([data-initialized])') ||
                        node.querySelector?.('.vote-buttons[data-item-id]:not([data-initialized])') ||
                        node.querySelector?.('.karma-display[data-karma]:not([data-initialized])')) {
                        needsInit = true;
                    }
                }
            });
        });

        if (needsInit) {
            initAll();
        }
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
 * 1. Basic vote buttons in HTML:
 *    <div class="vote-buttons" data-item-id="asset123" data-item-type="assets"></div>
 *
 * 2. Compact variant:
 *    <div class="vote-buttons compact" data-item-id="note456" data-item-type="notes"></div>
 *
 * 3. Inline variant:
 *    <div class="vote-buttons inline" data-item-id="asset789" data-item-type="assets"></div>
 *
 * 4. Vertical variant (Reddit-style):
 *    <div class="vote-buttons vertical" data-item-id="post123" data-item-type="posts"></div>
 *
 * 5. Manual initialization with options:
 *    const voteButtons = new VoteButtonsComponent(container, {
 *        showConfetti: true,
 *        showToast: true,
 *        variant: 'compact'
 *    });
 *
 * 6. Karma display:
 *    <div class="karma-display" data-karma="150" data-user-id="user123"></div>
 *
 * 7. Listen for vote events:
 *    window.addEventListener('voteUpdated', (event) => {
 *        console.log('Vote updated:', event.detail);
 *    });
 *
 * 8. Destroy component:
 *    voteButtons.destroy();
 */
