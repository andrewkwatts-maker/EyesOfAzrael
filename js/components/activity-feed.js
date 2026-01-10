/**
 * Activity Feed Component
 * Eyes of Azrael Project
 *
 * Displays activity feeds across multiple contexts:
 * - Global feed (homepage)
 * - Asset feed (on entity pages)
 * - User feed (on profiles)
 * - Mythology feed
 *
 * Features:
 * - Multiple feed item types (creates, edits, comments, etc.)
 * - Real-time updates with Firebase listeners
 * - Infinite scroll with virtual loading
 * - Filtering by activity type, asset type, mythology
 * - Unread badge counts
 * - Responsive design
 *
 * @example
 * const feed = new ActivityFeed(container, {
 *   context: 'global',
 *   limit: 20
 * });
 */

class ActivityFeed {
    constructor(container, options = {}) {
        if (!container) {
            throw new Error('ActivityFeed: container element is required');
        }

        this.container = container;
        this.options = {
            context: options.context || 'global', // 'global', 'asset', 'user', 'mythology'
            contextId: options.contextId || null, // assetId, userId, or mythologyId
            limit: options.limit || 20,
            showFilters: options.showFilters !== false,
            showNewItemsButton: options.showNewItemsButton !== false,
            autoRefresh: options.autoRefresh !== false,
            compact: options.compact || false,
            ...options
        };

        // State
        this.items = [];
        this.filteredItems = [];
        this.isLoading = false;
        this.hasMore = true;
        this.lastDoc = null;
        this.unsubscribe = null;
        this.newItemsCount = 0;
        this.pendingItems = [];
        this.isDestroyed = false;

        // Filters
        this.filters = {
            type: 'all', // 'all', or specific type
            assetType: 'all',
            mythology: 'all'
        };

        // Cache for user data
        this.userCache = new Map();

        // Initialize
        this.init();
    }

    /**
     * Activity type configurations
     */
    static ACTIVITY_TYPES = {
        ASSET_CREATED: {
            label: 'New Asset',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
            color: '#22c55e',
            verb: 'created'
        },
        MAJOR_EDIT: {
            label: 'Major Edit',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            color: '#3b82f6',
            verb: 'made significant edits to'
        },
        MINOR_EDIT: {
            label: 'Minor Edit',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            color: '#64748b',
            verb: 'made minor edits to'
        },
        SECTION_ADDED: {
            label: 'Section Added',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
            color: '#8b5cf6',
            verb: 'added a section to'
        },
        RELATIONSHIP_ADDED: {
            label: 'Relationship',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><line x1="8.12" y1="8.12" x2="15.88" y2="15.88"/></svg>`,
            color: '#f59e0b',
            verb: 'added a relationship to'
        },
        SOURCE_ADDED: {
            label: 'Source Added',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
            color: '#06b6d4',
            verb: 'added a source to'
        },
        CORPUS_CITATION: {
            label: 'Corpus Citation',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></svg>`,
            color: '#a855f7',
            verb: 'added a corpus citation to'
        },
        COMMENT: {
            label: 'Comment',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
            color: '#ec4899',
            verb: 'commented on'
        },
        PERSPECTIVE_ADDED: {
            label: 'Perspective',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
            color: '#14b8a6',
            verb: 'shared a perspective on'
        },
        SUGGESTION_APPROVED: {
            label: 'Edit Approved',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`,
            color: '#10b981',
            verb: 'had their edit approved for'
        },
        SUGGESTION_REJECTED: {
            label: 'Edit Rejected',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            color: '#ef4444',
            verb: 'had their edit rejected for'
        },
        IMAGE_UPLOADED: {
            label: 'Image Upload',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`,
            color: '#f97316',
            verb: 'uploaded an image for'
        },
        BADGE_EARNED: {
            label: 'Badge Earned',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/></svg>`,
            color: '#fbbf24',
            verb: 'earned a badge'
        },
        OWNERSHIP_CLAIMED: {
            label: 'Ownership',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17,11 19,13 23,9"/></svg>`,
            color: '#6366f1',
            verb: 'claimed ownership of'
        },
        OWNERSHIP_TRANSFERRED: {
            label: 'Transfer',
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
            color: '#84cc16',
            verb: 'transferred ownership of'
        }
    };

    /**
     * Initialize the activity feed
     */
    async init() {
        console.log('[ActivityFeed] Initializing with context:', this.options.context);

        this.render();
        this.attachEventListeners();

        // Load initial data
        await this.loadItems();

        // Set up real-time subscription if enabled
        if (this.options.autoRefresh) {
            this.subscribeToUpdates();
        }
    }

    /**
     * Render the feed container structure
     */
    render() {
        const compact = this.options.compact ? 'activity-feed--compact' : '';

        this.container.innerHTML = `
            <div class="activity-feed ${compact}">
                ${this.options.showFilters ? this.renderFilters() : ''}

                <div class="activity-feed-new-items" style="display: none;">
                    <button class="activity-feed-new-items-btn" data-action="show-new">
                        <span class="new-items-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17,11 12,6 7,11"/>
                                <line x1="12" y1="6" x2="12" y2="18"/>
                            </svg>
                        </span>
                        <span class="new-items-text">0 new items</span>
                    </button>
                </div>

                <div class="activity-feed-list" role="feed" aria-label="Activity feed">
                    <div class="activity-feed-loading">
                        <div class="activity-feed-spinner"></div>
                        <p>Loading activity...</p>
                    </div>
                </div>

                <div class="activity-feed-end" style="display: none;">
                    <div class="activity-feed-end-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="16,12 12,8 8,12"/>
                            <line x1="12" y1="16" x2="12" y2="8"/>
                        </svg>
                    </div>
                    <p class="activity-feed-end-text">You've reached the end</p>
                </div>

                <div class="activity-feed-load-more" style="display: none;">
                    <button class="activity-feed-load-more-btn" data-action="load-more">
                        Load More
                    </button>
                </div>
            </div>
        `;

        // Cache DOM references
        this.feedList = this.container.querySelector('.activity-feed-list');
        this.newItemsBar = this.container.querySelector('.activity-feed-new-items');
        this.newItemsBtn = this.container.querySelector('.activity-feed-new-items-btn');
        this.newItemsText = this.container.querySelector('.new-items-text');
        this.loadMoreBtn = this.container.querySelector('.activity-feed-load-more');
        this.endIndicator = this.container.querySelector('.activity-feed-end');
        this.loadingIndicator = this.container.querySelector('.activity-feed-loading');
    }

    /**
     * Render filter controls
     */
    renderFilters() {
        const activityTypes = Object.keys(ActivityFeed.ACTIVITY_TYPES);

        return `
            <div class="activity-feed-filters">
                <div class="activity-feed-filter-group">
                    <label class="activity-filter-label">Activity Type</label>
                    <select class="activity-filter-select" data-filter="type">
                        <option value="all">All Activity</option>
                        ${activityTypes.map(type => `
                            <option value="${type}">${ActivityFeed.ACTIVITY_TYPES[type].label}</option>
                        `).join('')}
                    </select>
                </div>

                ${this.options.context === 'global' || this.options.context === 'mythology' ? `
                    <div class="activity-feed-filter-group">
                        <label class="activity-filter-label">Asset Type</label>
                        <select class="activity-filter-select" data-filter="assetType">
                            <option value="all">All Types</option>
                            <option value="mythologies">Mythologies</option>
                            <option value="deities">Deities</option>
                            <option value="heroes">Heroes</option>
                            <option value="creatures">Creatures</option>
                            <option value="items">Items</option>
                            <option value="places">Places</option>
                            <option value="texts">Texts</option>
                            <option value="rituals">Rituals</option>
                            <option value="herbs">Herbs</option>
                            <option value="archetypes">Archetypes</option>
                            <option value="symbols">Symbols</option>
                        </select>
                    </div>
                ` : ''}

                ${this.options.context === 'global' || this.options.context === 'user' ? `
                    <div class="activity-feed-filter-group">
                        <label class="activity-filter-label">Mythology</label>
                        <select class="activity-filter-select" data-filter="mythology">
                            <option value="all">All Mythologies</option>
                            <option value="greek">Greek</option>
                            <option value="norse">Norse</option>
                            <option value="egyptian">Egyptian</option>
                            <option value="celtic">Celtic</option>
                            <option value="hindu">Hindu</option>
                            <option value="japanese">Japanese</option>
                            <option value="chinese">Chinese</option>
                            <option value="mesopotamian">Mesopotamian</option>
                            <option value="slavic">Slavic</option>
                            <option value="aztec">Aztec</option>
                            <option value="mayan">Mayan</option>
                        </select>
                    </div>
                ` : ''}

                <button class="activity-filter-reset" data-action="reset-filters" title="Reset filters">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1,4 1,10 7,10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Delegated event handling
        this.container.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            if (action === 'show-new') {
                this.showNewItems();
            } else if (action === 'load-more') {
                this.loadMore();
            } else if (action === 'reset-filters') {
                this.resetFilters();
            }

            // Handle item click for navigation
            const feedItem = e.target.closest('.activity-feed-item[data-asset-link]');
            if (feedItem) {
                const link = feedItem.dataset.assetLink;
                if (link && window.SPANavigation) {
                    e.preventDefault();
                    window.SPANavigation.navigate(link);
                }
            }
        });

        // Filter change handling
        this.container.addEventListener('change', (e) => {
            const filter = e.target.closest('[data-filter]');
            if (filter) {
                this.filters[filter.dataset.filter] = filter.value;
                this.applyFilters();
            }
        });

        // Infinite scroll
        this.setupInfiniteScroll();

        // Listen for contribution events
        window.addEventListener('contribution-recorded', (e) => {
            if (this.options.autoRefresh) {
                this.handleNewContribution(e.detail);
            }
        });
    }

    /**
     * Set up infinite scroll observer
     */
    setupInfiniteScroll() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            return;
        }

        const options = {
            root: null,
            rootMargin: '200px',
            threshold: 0
        };

        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, options);

        // Observe the load more trigger
        const trigger = document.createElement('div');
        trigger.className = 'activity-feed-scroll-trigger';
        this.feedList.appendChild(trigger);
        this.scrollObserver.observe(trigger);
    }

    /**
     * Load feed items from Firebase
     */
    async loadItems() {
        if (this.isLoading || this.isDestroyed) return;

        this.isLoading = true;
        this.showLoading(true);

        try {
            const service = window.contributionTrackingService;
            if (!service) {
                throw new Error('ContributionTrackingService not available');
            }

            await service.init();

            let items = [];

            switch (this.options.context) {
                case 'global':
                    items = await service.getRecentActivity(this.options.limit);
                    break;
                case 'asset':
                    items = await service.getAssetActivity(this.options.contextId, this.options.limit);
                    break;
                case 'user':
                    items = await service.getUserActivity(this.options.contextId, this.options.limit);
                    break;
                case 'mythology':
                    items = await this.getMythologyActivity(this.options.contextId, this.options.limit);
                    break;
                default:
                    items = await service.getRecentActivity(this.options.limit);
            }

            this.items = items;
            this.applyFilters();
            this.hasMore = items.length >= this.options.limit;

            if (items.length > 0) {
                this.lastDoc = items[items.length - 1];
            }

        } catch (error) {
            console.error('[ActivityFeed] Failed to load items:', error);
            this.renderError('Failed to load activity feed. Please try again.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * Get activity for a specific mythology
     */
    async getMythologyActivity(mythology, limit) {
        const service = window.contributionTrackingService;
        await service.init();

        const db = firebase.firestore();
        const query = db.collection('contributions')
            .where('mythology', '==', mythology)
            .where('status', '==', 'active')
            .orderBy('createdAtMs', 'desc')
            .limit(limit);

        const snapshot = await query.get();
        const activities = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'contribution',
                contributionType: data.type,
                userId: data.userId,
                userName: data.userName,
                userAvatar: data.userAvatar,
                assetId: data.assetId,
                assetName: data.assetName,
                assetType: data.assetType,
                mythology: data.mythology,
                weight: data.weight,
                summary: this.getActivitySummary(data),
                metadata: data.metadata,
                createdAt: data.createdAt,
                createdAtMs: data.createdAtMs
            });
        });

        return activities;
    }

    /**
     * Load more items (pagination)
     */
    async loadMore() {
        if (this.isLoading || !this.hasMore || this.isDestroyed) return;

        this.isLoading = true;
        this.loadMoreBtn.querySelector('button').disabled = true;
        this.loadMoreBtn.querySelector('button').textContent = 'Loading...';

        try {
            const service = window.contributionTrackingService;
            await service.init();

            const db = firebase.firestore();
            let query = db.collection('contributions')
                .where('status', '==', 'active')
                .orderBy('createdAtMs', 'desc');

            // Apply context filter
            if (this.options.context === 'user' && this.options.contextId) {
                query = query.where('userId', '==', this.options.contextId);
            } else if (this.options.context === 'asset' && this.options.contextId) {
                query = query.where('assetId', '==', this.options.contextId);
            } else if (this.options.context === 'mythology' && this.options.contextId) {
                query = query.where('mythology', '==', this.options.contextId);
            }

            // Pagination
            if (this.lastDoc?.createdAtMs) {
                query = query.where('createdAtMs', '<', this.lastDoc.createdAtMs);
            }

            query = query.limit(this.options.limit);

            const snapshot = await query.get();
            const newItems = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                newItems.push({
                    id: doc.id,
                    type: 'contribution',
                    contributionType: data.type,
                    userId: data.userId,
                    userName: data.userName,
                    userAvatar: data.userAvatar,
                    assetId: data.assetId,
                    assetName: data.assetName,
                    assetType: data.assetType,
                    mythology: data.mythology,
                    weight: data.weight,
                    summary: this.getActivitySummary(data),
                    metadata: data.metadata,
                    createdAt: data.createdAt,
                    createdAtMs: data.createdAtMs
                });
            });

            this.items = [...this.items, ...newItems];
            this.hasMore = newItems.length >= this.options.limit;

            if (newItems.length > 0) {
                this.lastDoc = newItems[newItems.length - 1];
                this.applyFilters();
            }

            if (!this.hasMore) {
                this.loadMoreBtn.style.display = 'none';
                this.endIndicator.style.display = 'flex';
            }

        } catch (error) {
            console.error('[ActivityFeed] Failed to load more items:', error);
        } finally {
            this.isLoading = false;
            this.loadMoreBtn.querySelector('button').disabled = false;
            this.loadMoreBtn.querySelector('button').textContent = 'Load More';
        }
    }

    /**
     * Subscribe to real-time updates
     */
    subscribeToUpdates() {
        const service = window.contributionTrackingService;
        if (!service) return;

        try {
            this.unsubscribe = service.subscribeToActivity(
                (activities) => {
                    if (this.isDestroyed) return;

                    // Check for new items
                    const existingIds = new Set(this.items.map(item => item.id));
                    const newActivities = activities.filter(a => !existingIds.has(a.id));

                    if (newActivities.length > 0) {
                        this.pendingItems = [...newActivities, ...this.pendingItems];
                        this.newItemsCount = this.pendingItems.length;
                        this.updateNewItemsButton();
                    }
                },
                {
                    userId: this.options.context === 'user' ? this.options.contextId : undefined,
                    assetId: this.options.context === 'asset' ? this.options.contextId : undefined,
                    limit: 5
                }
            );
        } catch (error) {
            console.warn('[ActivityFeed] Real-time subscription failed:', error);
        }
    }

    /**
     * Handle new contribution event
     */
    handleNewContribution(detail) {
        // Check if this contribution is relevant to our feed
        const isRelevant = this.isContributionRelevant(detail);

        if (isRelevant) {
            this.newItemsCount++;
            this.updateNewItemsButton();
        }
    }

    /**
     * Check if a contribution is relevant to the current feed context
     */
    isContributionRelevant(contribution) {
        switch (this.options.context) {
            case 'user':
                return contribution.userId === this.options.contextId;
            case 'asset':
                return contribution.assetId === this.options.contextId;
            case 'mythology':
                return contribution.mythology === this.options.contextId;
            default:
                return true;
        }
    }

    /**
     * Update the "new items" button
     */
    updateNewItemsButton() {
        if (this.newItemsCount > 0) {
            this.newItemsText.textContent = `${this.newItemsCount} new item${this.newItemsCount > 1 ? 's' : ''}`;
            this.newItemsBar.style.display = 'block';
            this.newItemsBar.classList.add('activity-feed-new-items--visible');
        } else {
            this.newItemsBar.classList.remove('activity-feed-new-items--visible');
            setTimeout(() => {
                if (this.newItemsCount === 0) {
                    this.newItemsBar.style.display = 'none';
                }
            }, 300);
        }
    }

    /**
     * Show new items in the feed
     */
    async showNewItems() {
        // Reload the feed to get latest items
        this.items = [];
        this.filteredItems = [];
        this.lastDoc = null;
        this.hasMore = true;
        this.newItemsCount = 0;
        this.pendingItems = [];

        this.updateNewItemsButton();
        await this.loadItems();

        // Scroll to top of feed
        this.feedList.scrollTop = 0;
    }

    /**
     * Apply current filters to items
     */
    applyFilters() {
        let filtered = [...this.items];

        // Filter by activity type
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(item => item.contributionType === this.filters.type);
        }

        // Filter by asset type
        if (this.filters.assetType !== 'all') {
            filtered = filtered.filter(item => item.assetType === this.filters.assetType);
        }

        // Filter by mythology
        if (this.filters.mythology !== 'all') {
            filtered = filtered.filter(item => item.mythology === this.filters.mythology);
        }

        this.filteredItems = filtered;
        this.renderItems();
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.filters = {
            type: 'all',
            assetType: 'all',
            mythology: 'all'
        };

        // Reset select elements
        this.container.querySelectorAll('.activity-filter-select').forEach(select => {
            select.value = 'all';
        });

        this.applyFilters();
    }

    /**
     * Render feed items
     */
    renderItems() {
        if (this.filteredItems.length === 0) {
            this.renderEmpty();
            return;
        }

        const itemsHTML = this.filteredItems.map(item => this.renderItem(item)).join('');

        // Keep the scroll trigger
        const scrollTrigger = this.feedList.querySelector('.activity-feed-scroll-trigger');

        this.feedList.innerHTML = itemsHTML;

        if (scrollTrigger) {
            this.feedList.appendChild(scrollTrigger);
        }

        // Show load more if there are more items
        if (this.hasMore) {
            this.loadMoreBtn.style.display = 'block';
            this.endIndicator.style.display = 'none';
        } else {
            this.loadMoreBtn.style.display = 'none';
            this.endIndicator.style.display = 'flex';
        }
    }

    /**
     * Render a single feed item
     */
    renderItem(item) {
        const typeConfig = ActivityFeed.ACTIVITY_TYPES[item.contributionType] || ActivityFeed.ACTIVITY_TYPES.MINOR_EDIT;
        const timeAgo = this.formatRelativeTime(item.createdAtMs);
        const assetLink = this.getAssetLink(item);
        const userLink = item.userId ? `#/user/${item.userId}` : null;
        const avatarUrl = item.userAvatar || this.getDefaultAvatar(item.userName);

        return `
            <article class="activity-feed-item"
                     data-id="${item.id}"
                     data-asset-link="${assetLink || ''}"
                     role="article"
                     tabindex="0">
                <div class="activity-feed-item-avatar">
                    ${userLink ? `<a href="${userLink}" class="activity-avatar-link">` : ''}
                        <img src="${this.escapeHtml(avatarUrl)}"
                             alt="${this.escapeHtml(item.userName || 'User')}"
                             class="activity-avatar"
                             loading="lazy"
                             onerror="this.src='${this.getDefaultAvatar(item.userName)}'">
                    ${userLink ? '</a>' : ''}
                </div>

                <div class="activity-feed-item-content">
                    <div class="activity-feed-item-header">
                        <div class="activity-type-badge" style="--activity-color: ${typeConfig.color}">
                            <span class="activity-type-icon">${typeConfig.icon}</span>
                            <span class="activity-type-label">${typeConfig.label}</span>
                        </div>
                        <time class="activity-timestamp" datetime="${new Date(item.createdAtMs).toISOString()}">
                            ${timeAgo}
                        </time>
                    </div>

                    <p class="activity-feed-item-description">
                        <span class="activity-user-name">${this.escapeHtml(item.userName || 'Anonymous')}</span>
                        <span class="activity-verb">${typeConfig.verb}</span>
                        ${item.assetName ? `
                            <a href="${assetLink}" class="activity-asset-name"
                               onclick="event.stopPropagation()">
                                ${this.escapeHtml(item.assetName)}
                            </a>
                        ` : ''}
                    </p>

                    ${item.metadata?.editSummary ? `
                        <p class="activity-feed-item-summary">
                            "${this.escapeHtml(this.truncateText(item.metadata.editSummary, 150))}"
                        </p>
                    ` : ''}

                    <div class="activity-feed-item-meta">
                        ${item.assetType ? `
                            <span class="activity-meta-tag activity-meta-type">
                                ${this.getAssetTypeIcon(item.assetType)}
                                ${this.capitalizeFirst(item.assetType)}
                            </span>
                        ` : ''}
                        ${item.mythology ? `
                            <span class="activity-meta-tag activity-meta-mythology">
                                ${this.capitalizeFirst(item.mythology)}
                            </span>
                        ` : ''}
                        ${item.weight ? `
                            <span class="activity-meta-tag activity-meta-points">
                                +${item.weight} pts
                            </span>
                        ` : ''}
                    </div>
                </div>

                ${item.assetId ? `
                    <div class="activity-feed-item-action">
                        <span class="activity-action-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9,18 15,12 9,6"/>
                            </svg>
                        </span>
                    </div>
                ` : ''}
            </article>
        `;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        const message = this.getEmptyMessage();

        this.feedList.innerHTML = `
            <div class="activity-feed-empty">
                <div class="activity-feed-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                    </svg>
                </div>
                <h3 class="activity-feed-empty-title">${message.title}</h3>
                <p class="activity-feed-empty-text">${message.text}</p>
            </div>
        `;

        this.loadMoreBtn.style.display = 'none';
        this.endIndicator.style.display = 'none';
    }

    /**
     * Get empty state message based on context
     */
    getEmptyMessage() {
        const hasFilters = this.filters.type !== 'all' ||
                          this.filters.assetType !== 'all' ||
                          this.filters.mythology !== 'all';

        if (hasFilters) {
            return {
                title: 'No matching activity',
                text: 'Try adjusting your filters to see more activity.'
            };
        }

        switch (this.options.context) {
            case 'asset':
                return {
                    title: 'No activity yet',
                    text: 'Be the first to contribute to this asset!'
                };
            case 'user':
                return {
                    title: 'No activity yet',
                    text: 'This user has not made any contributions yet.'
                };
            case 'mythology':
                return {
                    title: 'No activity yet',
                    text: 'Be the first to contribute to this mythology!'
                };
            default:
                return {
                    title: 'No activity yet',
                    text: 'Start exploring and contributing to see activity here!'
                };
        }
    }

    /**
     * Render error state
     */
    renderError(message) {
        this.feedList.innerHTML = `
            <div class="activity-feed-error">
                <div class="activity-feed-error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <h3 class="activity-feed-error-title">Something went wrong</h3>
                <p class="activity-feed-error-text">${this.escapeHtml(message)}</p>
                <button class="activity-feed-retry-btn" onclick="this.closest('.activity-feed').dispatchEvent(new CustomEvent('retry'))">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Get activity summary text
     */
    getActivitySummary(contribution) {
        const typeConfig = ActivityFeed.ACTIVITY_TYPES[contribution.type];
        if (!typeConfig) return 'made changes';

        const verb = typeConfig.verb;
        const assetName = contribution.assetName || contribution.assetId || 'an asset';

        return `${verb} ${assetName}`;
    }

    /**
     * Get asset link for navigation
     */
    getAssetLink(item) {
        if (!item.assetId) return null;

        const collection = item.assetCollection || item.assetType || 'entities';
        return `#/${collection}/${item.assetId}`;
    }

    /**
     * Get default avatar URL
     */
    getDefaultAvatar(name) {
        const initial = (name || 'U').charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=6366f1&color=fff&size=40`;
    }

    /**
     * Get asset type icon
     */
    getAssetTypeIcon(assetType) {
        const icons = {
            mythologies: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            deities: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
            heroes: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
            creatures: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>',
            items: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>',
            places: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
            texts: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
            rituals: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        };
        return icons[assetType] || '';
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(timestamp) {
        if (!timestamp) return 'Unknown time';

        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 5) return `${weeks}w ago`;
        if (months < 12) return `${months}mo ago`;
        return `${years}y ago`;
    }

    /**
     * Truncate text to specified length
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get unread count (for badge display)
     */
    getUnreadCount() {
        return this.newItemsCount;
    }

    /**
     * Refresh the feed
     */
    async refresh() {
        this.items = [];
        this.filteredItems = [];
        this.lastDoc = null;
        this.hasMore = true;
        this.newItemsCount = 0;
        this.pendingItems = [];

        this.updateNewItemsButton();
        await this.loadItems();
    }

    /**
     * Destroy the feed and clean up
     */
    destroy() {
        console.log('[ActivityFeed] Destroying instance');

        this.isDestroyed = true;

        // Unsubscribe from real-time updates
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // Disconnect intersection observer
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.scrollObserver = null;
        }

        // Clear DOM
        this.container.innerHTML = '';

        // Clear state
        this.items = [];
        this.filteredItems = [];
        this.userCache.clear();
    }
}

// Global export
if (typeof window !== 'undefined') {
    window.ActivityFeed = ActivityFeed;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityFeed;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Global feed on homepage:
 *    const globalFeed = new ActivityFeed(document.getElementById('activity-container'), {
 *      context: 'global',
 *      limit: 20
 *    });
 *
 * 2. Asset-specific feed:
 *    const assetFeed = new ActivityFeed(document.getElementById('asset-activity'), {
 *      context: 'asset',
 *      contextId: 'zeus_12345',
 *      limit: 10,
 *      compact: true
 *    });
 *
 * 3. User profile feed:
 *    const userFeed = new ActivityFeed(document.getElementById('user-activity'), {
 *      context: 'user',
 *      contextId: 'user_abc123',
 *      showFilters: false
 *    });
 *
 * 4. Mythology-specific feed:
 *    const mythFeed = new ActivityFeed(document.getElementById('myth-activity'), {
 *      context: 'mythology',
 *      contextId: 'greek'
 *    });
 *
 * 5. Get unread badge count:
 *    const unreadCount = globalFeed.getUnreadCount();
 *    document.getElementById('badge').textContent = unreadCount;
 *
 * 6. Manually refresh:
 *    await globalFeed.refresh();
 *
 * 7. Cleanup on unmount:
 *    globalFeed.destroy();
 */
