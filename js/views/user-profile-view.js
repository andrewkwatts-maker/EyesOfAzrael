/**
 * User Profile View
 *
 * Displays a user's public profile including:
 * - Profile header with avatar, name, reputation level
 * - Badge showcase
 * - Contribution statistics
 * - Activity feed (notes, entities, perspectives, relationships)
 *
 * Routes: /user/{userId}
 */

class UserProfileView {
    constructor() {
        this.container = null;
        this.userId = null;
        this.profileData = null;
        this.isOwnProfile = false;
        this.currentTab = 'notes';

        // Sub-components
        this.badgeDisplay = null;

        // Services
        this.reputationService = null;
        this.perspectiveService = null;
        this.notesService = null;
        this.userPreferencesService = null;

        // Pagination
        this.pageSize = 20;
        this.lastDocs = {};
        this.hasMore = {};

        // Active listeners for cleanup
        this.unsubscribers = [];
    }

    /**
     * Initialize services
     */
    async _initServices() {
        // Initialize reputation service
        if (typeof window.ReputationService !== 'undefined') {
            this.reputationService = new window.ReputationService();
            await this.reputationService.init();
        }

        // Initialize perspective service
        if (typeof window.PerspectiveService !== 'undefined') {
            this.perspectiveService = new window.PerspectiveService();
            await this.perspectiveService.init();
        }

        // Initialize notes service
        if (typeof window.NotesService !== 'undefined') {
            this.notesService = new window.NotesService();
            await this.notesService.init();
        }

        // Initialize user preferences
        if (typeof window.UserPreferencesService !== 'undefined') {
            this.userPreferencesService = new window.UserPreferencesService();
            await this.userPreferencesService.init();
        }
    }

    /**
     * Render the profile view
     * @param {string} userId - User ID to display
     * @param {HTMLElement} targetContainer - Container to render into
     */
    async render(userId, targetContainer) {
        this.userId = userId;
        this.container = targetContainer || document.getElementById('main-content');

        if (!this.container) {
            console.error('[UserProfileView] No container provided');
            return;
        }

        // Show loading state
        this.container.innerHTML = this._getLoadingHTML();

        try {
            // Initialize services
            await this._initServices();

            // Check if viewing own profile
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const currentUser = firebase.auth().currentUser;
                this.isOwnProfile = currentUser?.uid === userId;
            }

            // Load profile data
            await this._loadProfileData();

            // Render profile
            this.container.innerHTML = this._getProfileHTML();

            // Bind events
            this._bindEvents();

            // Initialize badge display
            this._initBadgeDisplay();

            // Load initial tab content
            await this._loadTabContent(this.currentTab);

        } catch (error) {
            console.error('[UserProfileView] Error loading profile:', error);
            this.container.innerHTML = this._getErrorHTML(error.message);
        }
    }

    /**
     * Load user profile data from Firebase
     */
    async _loadProfileData() {
        if (!this.userId) {
            throw new Error('User ID is required');
        }

        const db = firebase.firestore();

        // Load user document
        const userDoc = await db.collection('users').doc(this.userId).get();

        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();

        // Load reputation data
        let reputationData = null;
        if (this.reputationService) {
            reputationData = await this.reputationService.getReputation(this.userId);
        }

        // Load badges
        const badgesSnapshot = await db.collection('badge_awards')
            .where('userId', '==', this.userId)
            .orderBy('awardedAt', 'desc')
            .limit(50)
            .get();

        const badges = [];
        badgesSnapshot.forEach(doc => {
            badges.push({ id: doc.id, ...doc.data() });
        });

        // Load contribution counts
        const counts = await this._getContributionCounts();

        this.profileData = {
            id: this.userId,
            displayName: userData.displayName || userData.name || 'Anonymous',
            email: userData.email,
            photoURL: userData.photoURL || userData.avatar,
            bio: userData.bio || '',
            joinedAt: userData.createdAt || userData.joinedAt,
            reputation: reputationData || {
                totalPoints: 0,
                level: 'Newcomer',
                levelProgress: 0
            },
            badges: badges,
            counts: counts,
            isVerified: userData.isVerified || false,
            isModerator: userData.isModerator || userData.role === 'moderator' || userData.role === 'admin'
        };
    }

    /**
     * Get contribution counts for user
     */
    async _getContributionCounts() {
        const db = firebase.firestore();
        const counts = {
            notes: 0,
            entities: 0,
            perspectives: 0,
            relationships: 0
        };

        try {
            // Count notes
            const notesQuery = await db.collection('notes')
                .where('userId', '==', this.userId)
                .where('status', '==', 'active')
                .limit(1000)
                .get();
            counts.notes = notesQuery.size;

            // Count user assets (entities)
            const assetsQuery = await db.collection('user_assets')
                .where('createdBy', '==', this.userId)
                .where('status', '==', 'active')
                .limit(1000)
                .get();
            counts.entities = assetsQuery.size;

            // Count perspectives
            const perspectivesQuery = await db.collection('user_perspectives')
                .where('userId', '==', this.userId)
                .where('status', '==', 'active')
                .limit(1000)
                .get();
            counts.perspectives = perspectivesQuery.size;

            // Count relationship suggestions
            const relationshipsQuery = await db.collection('user_relationships')
                .where('suggestedBy', '==', this.userId)
                .where('status', 'in', ['pending', 'approved'])
                .limit(1000)
                .get();
            counts.relationships = relationshipsQuery.size;

        } catch (error) {
            console.warn('[UserProfileView] Error counting contributions:', error);
        }

        return counts;
    }

    /**
     * Get loading HTML
     */
    _getLoadingHTML() {
        return `
            <div class="user-profile user-profile--loading">
                <div class="loading-spinner">
                    <svg class="spinner" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
                    </svg>
                    <span>Loading profile...</span>
                </div>
            </div>
        `;
    }

    /**
     * Get error HTML
     */
    _getErrorHTML(message) {
        return `
            <div class="user-profile user-profile--error">
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    <h2>Unable to load profile</h2>
                    <p>${this._escapeHtml(message)}</p>
                    <a href="#/" class="btn btn-primary">Go Home</a>
                </div>
            </div>
        `;
    }

    /**
     * Get main profile HTML
     */
    _getProfileHTML() {
        const p = this.profileData;
        const levelInfo = this._getLevelInfo(p.reputation.totalPoints);

        return `
            <div class="user-profile">
                <!-- Header -->
                <header class="user-profile__header">
                    <div class="user-profile__avatar-section">
                        <div class="user-profile__avatar">
                            ${p.photoURL
                                ? `<img src="${this._escapeHtml(p.photoURL)}" alt="${this._escapeHtml(p.displayName)}" />`
                                : `<span class="avatar-initial">${(p.displayName || 'U')[0].toUpperCase()}</span>`
                            }
                            ${p.isVerified ? '<span class="verified-badge" title="Verified Expert">✓</span>' : ''}
                            ${p.isModerator ? '<span class="mod-badge" title="Moderator">🛡️</span>' : ''}
                        </div>
                    </div>

                    <div class="user-profile__info">
                        <h1 class="user-profile__name">${this._escapeHtml(p.displayName)}</h1>

                        <div class="user-profile__level">
                            <span class="level-name tier-${levelInfo.tier}">${levelInfo.name}</span>
                            <span class="level-points">${p.reputation.totalPoints.toLocaleString()} points</span>
                        </div>

                        ${p.bio ? `<p class="user-profile__bio">${this._escapeHtml(p.bio)}</p>` : ''}

                        <div class="user-profile__meta">
                            ${p.joinedAt ? `
                                <span class="meta-item">
                                    📅 Joined ${this._formatDate(p.joinedAt)}
                                </span>
                            ` : ''}
                        </div>

                        ${!this.isOwnProfile ? `
                            <div class="user-profile__actions">
                                <button class="btn btn-secondary btn-block-user" data-user-id="${this.userId}">
                                    🚫 Block User
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </header>

                <!-- Badges -->
                <section class="user-profile__badges">
                    <h2 class="section-title">Badges</h2>
                    <div id="profile-badges-container"></div>
                </section>

                <!-- Stats -->
                <section class="user-profile__stats">
                    <div class="stat-card">
                        <span class="stat-value">${p.counts.notes + p.counts.entities + p.counts.perspectives + p.counts.relationships}</span>
                        <span class="stat-label">Total Contributions</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${p.counts.notes}</span>
                        <span class="stat-label">Notes</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${p.counts.entities}</span>
                        <span class="stat-label">Entities</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${p.counts.perspectives}</span>
                        <span class="stat-label">Perspectives</span>
                    </div>
                </section>

                <!-- Activity Tabs -->
                <section class="user-profile__activity">
                    <nav class="activity-tabs" role="tablist">
                        <button class="activity-tab ${this.currentTab === 'notes' ? 'active' : ''}"
                                data-tab="notes" role="tab" aria-selected="${this.currentTab === 'notes'}">
                            Notes <span class="tab-count">${p.counts.notes}</span>
                        </button>
                        <button class="activity-tab ${this.currentTab === 'entities' ? 'active' : ''}"
                                data-tab="entities" role="tab" aria-selected="${this.currentTab === 'entities'}">
                            Entities <span class="tab-count">${p.counts.entities}</span>
                        </button>
                        <button class="activity-tab ${this.currentTab === 'perspectives' ? 'active' : ''}"
                                data-tab="perspectives" role="tab" aria-selected="${this.currentTab === 'perspectives'}">
                            Perspectives <span class="tab-count">${p.counts.perspectives}</span>
                        </button>
                        <button class="activity-tab ${this.currentTab === 'relationships' ? 'active' : ''}"
                                data-tab="relationships" role="tab" aria-selected="${this.currentTab === 'relationships'}">
                            Relationships <span class="tab-count">${p.counts.relationships}</span>
                        </button>
                    </nav>

                    <div class="activity-content" id="activity-content">
                        <!-- Content loaded dynamically -->
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Get level info from points
     */
    _getLevelInfo(points) {
        const levels = [
            { min: 1000, name: 'Legend', tier: 'platinum' },
            { min: 500, name: 'Master', tier: 'gold' },
            { min: 250, name: 'Expert', tier: 'gold' },
            { min: 100, name: 'Contributor', tier: 'silver' },
            { min: 25, name: 'Member', tier: 'silver' },
            { min: 0, name: 'Newcomer', tier: 'bronze' }
        ];

        for (const level of levels) {
            if (points >= level.min) {
                return level;
            }
        }

        return levels[levels.length - 1];
    }

    /**
     * Format date for display
     */
    _formatDate(timestamp) {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short'
        });
    }

    /**
     * Escape HTML
     */
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Bind event listeners
     */
    _bindEvents() {
        // Tab switching
        const tabs = this.container.querySelectorAll('.activity-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this._handleTabClick(e));
        });

        // Block user button
        const blockBtn = this.container.querySelector('.btn-block-user');
        if (blockBtn) {
            blockBtn.addEventListener('click', () => this._handleBlockUser());
        }
    }

    /**
     * Initialize badge display
     */
    _initBadgeDisplay() {
        const container = this.container.querySelector('#profile-badges-container');
        if (!container || !this.profileData.badges) return;

        if (typeof window.BadgeDisplay !== 'undefined') {
            this.badgeDisplay = new window.BadgeDisplay({
                maxDisplay: 8,
                showTooltips: true,
                compact: false
            });

            this.badgeDisplay.setBadges(this.profileData.badges);
            this.badgeDisplay.render(container);
        } else {
            // Fallback simple display
            container.innerHTML = this.profileData.badges.length > 0
                ? this.profileData.badges.slice(0, 8).map(b => `
                    <span class="badge-simple" title="${b.badgeName || b.badgeId}">
                        🏅 ${b.badgeName || b.badgeId}
                    </span>
                `).join('')
                : '<span class="no-badges">No badges yet</span>';
        }
    }

    /**
     * Handle tab click
     */
    async _handleTabClick(e) {
        const tab = e.currentTarget;
        const tabId = tab.dataset.tab;

        if (tabId === this.currentTab) return;

        // Update active tab
        this.container.querySelectorAll('.activity-tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        this.currentTab = tabId;

        // Load tab content
        await this._loadTabContent(tabId);
    }

    /**
     * Load tab content
     */
    async _loadTabContent(tabId) {
        const contentContainer = this.container.querySelector('#activity-content');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <div class="activity-loading">
                <svg class="spinner" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
                </svg>
            </div>
        `;

        try {
            let content = '';

            switch (tabId) {
                case 'notes':
                    content = await this._loadNotes();
                    break;
                case 'entities':
                    content = await this._loadEntities();
                    break;
                case 'perspectives':
                    content = await this._loadPerspectives();
                    break;
                case 'relationships':
                    content = await this._loadRelationships();
                    break;
            }

            contentContainer.innerHTML = content;

        } catch (error) {
            console.error(`[UserProfileView] Error loading ${tabId}:`, error);
            contentContainer.innerHTML = `
                <div class="activity-error">
                    Failed to load ${tabId}. Please try again.
                </div>
            `;
        }
    }

    /**
     * Load user notes
     */
    async _loadNotes() {
        const db = firebase.firestore();

        const snapshot = await db.collection('notes')
            .where('userId', '==', this.userId)
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .limit(this.pageSize)
            .get();

        if (snapshot.empty) {
            return '<div class="activity-empty">No notes yet</div>';
        }

        let html = '<div class="activity-list">';

        snapshot.forEach(doc => {
            const note = doc.data();
            html += `
                <div class="activity-item activity-item--note">
                    <div class="activity-item__header">
                        <a href="#/entity/${note.entityCollection}/${note.entityId}"
                           class="activity-item__entity">
                            ${this._escapeHtml(note.entityName || note.entityId)}
                        </a>
                        <span class="activity-item__date">${this._formatDate(note.createdAt)}</span>
                    </div>
                    <div class="activity-item__content">
                        ${this._escapeHtml(this._truncate(note.content, 200))}
                    </div>
                    <div class="activity-item__meta">
                        <span class="vote-count">👍 ${note.upvoteCount || 0}</span>
                        <span class="vote-count">👎 ${note.downvoteCount || 0}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        return html;
    }

    /**
     * Load user entities
     */
    async _loadEntities() {
        const db = firebase.firestore();

        const snapshot = await db.collection('user_assets')
            .where('createdBy', '==', this.userId)
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .limit(this.pageSize)
            .get();

        if (snapshot.empty) {
            return '<div class="activity-empty">No entities submitted yet</div>';
        }

        let html = '<div class="activity-grid">';

        snapshot.forEach(doc => {
            const entity = doc.data();
            html += `
                <a href="#/entity/${entity.collection || entity.type}/${doc.id}"
                   class="activity-card">
                    <div class="activity-card__icon">
                        ${this._getEntityIcon(entity.type)}
                    </div>
                    <div class="activity-card__info">
                        <span class="activity-card__name">${this._escapeHtml(entity.name || doc.id)}</span>
                        <span class="activity-card__type">${this._escapeHtml(entity.type || entity.collection)}</span>
                    </div>
                </a>
            `;
        });

        html += '</div>';

        return html;
    }

    /**
     * Load user perspectives
     */
    async _loadPerspectives() {
        const db = firebase.firestore();

        const snapshot = await db.collection('user_perspectives')
            .where('userId', '==', this.userId)
            .where('status', '==', 'active')
            .where('visibility', '==', 'public')
            .orderBy('createdAt', 'desc')
            .limit(this.pageSize)
            .get();

        if (snapshot.empty) {
            return '<div class="activity-empty">No public perspectives yet</div>';
        }

        let html = '<div class="activity-list">';

        snapshot.forEach(doc => {
            const perspective = doc.data();
            html += `
                <div class="activity-item activity-item--perspective">
                    <div class="activity-item__header">
                        <a href="#/entity/${perspective.entityCollection}/${perspective.entityId}?perspective=${this.userId}"
                           class="activity-item__entity">
                            Perspective on ${this._escapeHtml(perspective.entityId)}
                        </a>
                        <span class="activity-item__date">${this._formatDate(perspective.createdAt)}</span>
                    </div>
                    ${perspective.publicNotes ? `
                        <div class="activity-item__content">
                            ${this._escapeHtml(this._truncate(perspective.publicNotes, 200))}
                        </div>
                    ` : ''}
                    <div class="activity-item__meta">
                        <span class="vote-count">👍 ${perspective.upvoteCount || 0}</span>
                        <span class="view-count">👁️ ${perspective.viewCount || 0} views</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        return html;
    }

    /**
     * Load user relationship suggestions
     */
    async _loadRelationships() {
        const db = firebase.firestore();

        const snapshot = await db.collection('user_relationships')
            .where('suggestedBy', '==', this.userId)
            .orderBy('createdAt', 'desc')
            .limit(this.pageSize)
            .get();

        if (snapshot.empty) {
            return '<div class="activity-empty">No relationship suggestions yet</div>';
        }

        let html = '<div class="activity-list">';

        snapshot.forEach(doc => {
            const rel = doc.data();
            const statusClass = rel.status === 'approved' ? 'status--approved' :
                              rel.status === 'rejected' ? 'status--rejected' : 'status--pending';
            html += `
                <div class="activity-item activity-item--relationship">
                    <div class="activity-item__header">
                        <span class="relationship-entities">
                            <a href="#/entity/${rel.fromEntityCollection}/${rel.fromEntityId}">
                                ${this._escapeHtml(rel.fromEntityId)}
                            </a>
                            <span class="relationship-arrow">→</span>
                            <a href="#/entity/${rel.toEntityCollection}/${rel.toEntityId}">
                                ${this._escapeHtml(rel.toEntityId)}
                            </a>
                        </span>
                        <span class="activity-item__status ${statusClass}">${rel.status}</span>
                    </div>
                    <div class="activity-item__content">
                        <span class="relationship-type">${this._escapeHtml(rel.title || rel.relationshipType)}</span>
                        ${rel.description ? `<p>${this._escapeHtml(this._truncate(rel.description, 150))}</p>` : ''}
                    </div>
                    <div class="activity-item__meta">
                        <span class="vote-count">👍 ${rel.upvoteCount || 0}</span>
                        <span class="vote-count">👎 ${rel.downvoteCount || 0}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        return html;
    }

    /**
     * Get icon for entity type
     */
    _getEntityIcon(type) {
        const icons = {
            deity: '🏛️',
            hero: '⚔️',
            creature: '🐉',
            item: '🗡️',
            place: '🏔️',
            text: '📜',
            ritual: '🔮',
            herb: '🌿',
            symbol: '☯️',
            concept: '💡'
        };
        return icons[type] || '📚';
    }

    /**
     * Truncate text
     */
    _truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Handle block user
     */
    async _handleBlockUser() {
        if (!confirm(`Block ${this.profileData.displayName}? Their content will be hidden from your view.`)) {
            return;
        }

        try {
            if (this.userPreferencesService) {
                await this.userPreferencesService.blockUser(this.userId);
                alert('User blocked successfully');
            } else if (typeof window.UserPreferences !== 'undefined') {
                const prefs = new window.UserPreferences();
                await prefs.blockUser(this.userId);
                alert('User blocked successfully');
            } else {
                throw new Error('User preferences service not available');
            }
        } catch (error) {
            console.error('[UserProfileView] Error blocking user:', error);
            alert('Failed to block user: ' + error.message);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Unsubscribe from listeners
        this.unsubscribers.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        this.unsubscribers = [];

        // Destroy badge display
        if (this.badgeDisplay) {
            this.badgeDisplay.destroy();
            this.badgeDisplay = null;
        }

        this.container = null;
        this.profileData = null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserProfileView };
}

if (typeof window !== 'undefined') {
    window.UserProfileView = UserProfileView;
}
