/**
 * User Dashboard View - Polished Edition
 *
 * Comprehensive user dashboard with:
 * - Clean layout for user stats and activity
 * - Activity feed with real-time updates
 * - Contribution history with status tracking
 * - Badges and achievements display
 * - Profile settings and preferences
 * - Favorites and collections management
 * - Reputation system visualization
 *
 * @author Eyes of Azrael Team
 */

class UserDashboardView {
    constructor(options = {}) {
        this.container = null;
        this.userId = null;
        this.userData = null;

        // Sub-component instances
        this.badgeDisplay = null;
        this.reputationService = null;
        this.favoritesService = null;

        // View state
        this.activeTab = 'overview';
        this.activityPage = 0;
        this.contributionsPage = 0;
        this.pageSize = 10;

        // Settings state
        this.isEditingProfile = false;
        this.pendingChanges = {};

        // Listeners for cleanup
        this.unsubscribers = [];

        // Options
        this.options = {
            showFullDashboard: true,
            initialTab: 'overview',
            ...options
        };
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        // Wait for Firebase auth
        const auth = firebase.auth();
        const user = auth.currentUser;

        if (!user) {
            throw new Error('User must be authenticated to view dashboard');
        }

        this.userId = user.uid;

        // Initialize services
        if (typeof window.ReputationService !== 'undefined') {
            this.reputationService = new window.ReputationService();
            await this.reputationService.init();
        }

        if (typeof window.FavoritesService !== 'undefined') {
            this.favoritesService = window.EyesOfAzrael?.favorites || new window.FavoritesService();
        }

        // Load user data
        await this._loadUserData();
    }

    /**
     * Load user data from Firebase
     */
    async _loadUserData() {
        const db = firebase.firestore();
        const auth = firebase.auth();
        const user = auth.currentUser;

        // Get user document
        const userDoc = await db.collection('users').doc(this.userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Get reputation data
        let reputationData = null;
        if (this.reputationService) {
            reputationData = await this.reputationService.getReputation(this.userId);
        }

        // Get badges
        const badgesSnapshot = await db.collection('badge_awards')
            .where('userId', '==', this.userId)
            .orderBy('awardedAt', 'desc')
            .limit(50)
            .get();

        const badges = [];
        badgesSnapshot.forEach(doc => {
            badges.push({ id: doc.id, ...doc.data() });
        });

        // Get contribution counts
        const counts = await this._getContributionCounts();

        // Get recent activity
        const activity = await this._loadRecentActivity();

        // Get favorites stats
        let favoritesStats = null;
        if (this.favoritesService) {
            favoritesStats = await this.favoritesService.getStatistics();
        }

        this.userData = {
            id: this.userId,
            displayName: user.displayName || userData.displayName || 'Anonymous',
            email: user.email,
            photoURL: user.photoURL || userData.photoURL || userData.avatar,
            bio: userData.bio || '',
            joinedAt: userData.createdAt || userData.joinedAt,
            reputation: reputationData || {
                totalPoints: 0,
                level: 1,
                levelName: 'Newcomer'
            },
            badges: badges,
            counts: counts,
            activity: activity,
            favorites: favoritesStats || { total: 0 },
            preferences: userData.preferences || {},
            notifications: userData.notificationSettings || {
                email: true,
                push: false,
                weekly: true
            }
        };
    }

    /**
     * Get contribution counts
     */
    async _getContributionCounts() {
        const db = firebase.firestore();
        const counts = {
            notes: 0,
            entities: 0,
            perspectives: 0,
            relationships: 0,
            pending: 0,
            approved: 0,
            total: 0
        };

        try {
            // Notes
            const notesQuery = await db.collection('notes')
                .where('userId', '==', this.userId)
                .where('status', '==', 'active')
                .get();
            counts.notes = notesQuery.size;

            // User assets (entities)
            const assetsQuery = await db.collection('user_assets')
                .where('createdBy', '==', this.userId)
                .get();

            assetsQuery.forEach(doc => {
                const data = doc.data();
                counts.entities++;
                if (data.status === 'pending') counts.pending++;
                if (data.status === 'approved' || data.status === 'active') counts.approved++;
            });

            // Perspectives
            const perspectivesQuery = await db.collection('user_perspectives')
                .where('userId', '==', this.userId)
                .where('status', '==', 'active')
                .get();
            counts.perspectives = perspectivesQuery.size;

            // Relationships
            const relationshipsQuery = await db.collection('user_relationships')
                .where('suggestedBy', '==', this.userId)
                .get();
            counts.relationships = relationshipsQuery.size;

            counts.total = counts.notes + counts.entities + counts.perspectives + counts.relationships;

        } catch (error) {
            console.warn('[UserDashboard] Error loading counts:', error);
        }

        return counts;
    }

    /**
     * Load recent activity
     */
    async _loadRecentActivity(limit = 20) {
        const db = firebase.firestore();
        const activity = [];

        try {
            // Get recent notes
            const notesQuery = await db.collection('notes')
                .where('userId', '==', this.userId)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            notesQuery.forEach(doc => {
                const data = doc.data();
                activity.push({
                    type: 'note',
                    id: doc.id,
                    title: `Note on ${data.entityName || data.entityId}`,
                    content: data.content?.substring(0, 100),
                    createdAt: data.createdAt,
                    icon: 'note'
                });
            });

            // Get recent submissions
            const submissionsQuery = await db.collection('user_assets')
                .where('createdBy', '==', this.userId)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            submissionsQuery.forEach(doc => {
                const data = doc.data();
                activity.push({
                    type: 'submission',
                    id: doc.id,
                    title: data.name || 'Entity submission',
                    status: data.status,
                    createdAt: data.createdAt,
                    icon: 'entity'
                });
            });

            // Sort by date
            activity.sort((a, b) => {
                const dateA = a.createdAt?.toMillis?.() || a.createdAt || 0;
                const dateB = b.createdAt?.toMillis?.() || b.createdAt || 0;
                return dateB - dateA;
            });

        } catch (error) {
            console.warn('[UserDashboard] Error loading activity:', error);
        }

        return activity.slice(0, limit);
    }

    /**
     * Render the dashboard
     * @param {HTMLElement} targetContainer
     */
    async render(targetContainer) {
        this.container = targetContainer || document.getElementById('main-content');

        if (!this.container) {
            console.error('[UserDashboard] No container found');
            return;
        }

        // Show loading state
        this.container.innerHTML = this._getLoadingHTML();

        try {
            await this.init();
            this.container.innerHTML = this._getDashboardHTML();
            this._bindEvents();
            this._initSubComponents();

        } catch (error) {
            console.error('[UserDashboard] Error rendering:', error);
            this.container.innerHTML = this._getErrorHTML(error.message);
        }
    }

    /**
     * Get loading HTML
     */
    _getLoadingHTML() {
        return `
            <div class="user-dashboard user-dashboard--loading">
                <div class="dashboard-loader">
                    <div class="loader-spinner">
                        <svg viewBox="0 0 50 50" class="spinner-svg">
                            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                                <animate attributeName="stroke-dasharray" dur="1.5s" repeatCount="indefinite" values="1,150;90,150;90,150"/>
                                <animate attributeName="stroke-dashoffset" dur="1.5s" repeatCount="indefinite" values="0;-35;-125"/>
                            </circle>
                        </svg>
                    </div>
                    <span class="loader-text">Loading your dashboard...</span>
                </div>
            </div>
        `;
    }

    /**
     * Get error HTML
     */
    _getErrorHTML(message) {
        return `
            <div class="user-dashboard user-dashboard--error">
                <div class="dashboard-error">
                    <div class="error-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h2>Unable to load dashboard</h2>
                    <p>${this._escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                </div>
            </div>
        `;
    }

    /**
     * Get main dashboard HTML
     */
    _getDashboardHTML() {
        const u = this.userData;
        const levelInfo = this._getLevelInfo(u.reputation.totalPoints);
        const progressPercent = this._calculateProgress(u.reputation.totalPoints, levelInfo);

        return `
            <div class="user-dashboard" data-active-tab="${this.activeTab}">
                <!-- Dashboard Header -->
                <header class="dashboard-header">
                    <div class="dashboard-header__profile">
                        <div class="dashboard-avatar-wrapper">
                            <div class="dashboard-avatar ${this.isEditingProfile ? 'dashboard-avatar--editable' : ''}">
                                ${u.photoURL
                                    ? `<img src="${this._escapeHtml(u.photoURL)}" alt="${this._escapeHtml(u.displayName)}" class="dashboard-avatar__img" />`
                                    : `<span class="dashboard-avatar__initial">${(u.displayName || 'U')[0].toUpperCase()}</span>`
                                }
                                <button class="dashboard-avatar__edit-btn" title="Change avatar" aria-label="Change avatar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="dashboard-level-badge tier-${levelInfo.tier}" title="${levelInfo.name}">
                                ${levelInfo.icon}
                            </div>
                        </div>

                        <div class="dashboard-user-info">
                            <h1 class="dashboard-user-name">${this._escapeHtml(u.displayName)}</h1>
                            <p class="dashboard-user-email">${this._escapeHtml(u.email)}</p>

                            <div class="dashboard-level-progress">
                                <div class="level-progress-info">
                                    <span class="level-current tier-${levelInfo.tier}">${levelInfo.name}</span>
                                    <span class="level-points">${u.reputation.totalPoints.toLocaleString()} pts</span>
                                    ${levelInfo.next ? `<span class="level-next">Next: ${levelInfo.next}</span>` : ''}
                                </div>
                                <div class="level-progress-bar">
                                    <div class="level-progress-fill tier-${levelInfo.tier}" style="width: ${progressPercent}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-header__actions">
                        <button class="btn btn-secondary" id="btn-edit-profile">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit Profile
                        </button>
                        <a href="#/" class="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            Explore
                        </a>
                    </div>
                </header>

                <!-- Stats Grid -->
                <section class="dashboard-stats" aria-label="Your statistics">
                    <div class="stat-card stat-card--primary">
                        <div class="stat-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <div class="stat-card__content">
                            <span class="stat-card__value">${u.reputation.totalPoints.toLocaleString()}</span>
                            <span class="stat-card__label">Reputation Points</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                        </div>
                        <div class="stat-card__content">
                            <span class="stat-card__value">${u.counts.total}</span>
                            <span class="stat-card__label">Contributions</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="8" r="6"/>
                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                            </svg>
                        </div>
                        <div class="stat-card__content">
                            <span class="stat-card__value">${u.badges.length}</span>
                            <span class="stat-card__label">Badges Earned</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </div>
                        <div class="stat-card__content">
                            <span class="stat-card__value">${u.favorites?.total || 0}</span>
                            <span class="stat-card__label">Favorites</span>
                        </div>
                    </div>
                </section>

                <!-- Navigation Tabs -->
                <nav class="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
                    <button class="dashboard-tab ${this.activeTab === 'overview' ? 'active' : ''}"
                            data-tab="overview" role="tab" aria-selected="${this.activeTab === 'overview'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        Overview
                    </button>
                    <button class="dashboard-tab ${this.activeTab === 'contributions' ? 'active' : ''}"
                            data-tab="contributions" role="tab" aria-selected="${this.activeTab === 'contributions'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Contributions
                        ${u.counts.pending > 0 ? `<span class="tab-badge">${u.counts.pending}</span>` : ''}
                    </button>
                    <button class="dashboard-tab ${this.activeTab === 'favorites' ? 'active' : ''}"
                            data-tab="favorites" role="tab" aria-selected="${this.activeTab === 'favorites'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        Favorites
                    </button>
                    <button class="dashboard-tab ${this.activeTab === 'achievements' ? 'active' : ''}"
                            data-tab="achievements" role="tab" aria-selected="${this.activeTab === 'achievements'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="8" r="6"/>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                        Achievements
                    </button>
                    <button class="dashboard-tab ${this.activeTab === 'settings' ? 'active' : ''}"
                            data-tab="settings" role="tab" aria-selected="${this.activeTab === 'settings'}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        Settings
                    </button>
                </nav>

                <!-- Tab Content -->
                <div class="dashboard-content" role="tabpanel">
                    ${this._getTabContent(this.activeTab)}
                </div>
            </div>
        `;
    }

    /**
     * Get tab content HTML
     */
    _getTabContent(tab) {
        switch (tab) {
            case 'overview':
                return this._getOverviewContent();
            case 'contributions':
                return this._getContributionsContent();
            case 'favorites':
                return this._getFavoritesContent();
            case 'achievements':
                return this._getAchievementsContent();
            case 'settings':
                return this._getSettingsContent();
            default:
                return this._getOverviewContent();
        }
    }

    /**
     * Get overview tab content
     */
    _getOverviewContent() {
        const u = this.userData;

        return `
            <div class="dashboard-overview">
                <!-- Activity Feed -->
                <section class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                            Recent Activity
                        </h2>
                        <a href="#" class="section-link" data-action="view-all-activity">View All</a>
                    </div>

                    <div class="activity-feed" id="activity-feed">
                        ${u.activity.length > 0
                            ? u.activity.slice(0, 5).map(item => this._getActivityItemHTML(item)).join('')
                            : `
                                <div class="empty-state empty-state--compact">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                    </svg>
                                    <p>No activity yet. Start exploring and contributing!</p>
                                </div>
                            `
                        }
                    </div>
                </section>

                <!-- Badges Showcase -->
                <section class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="8" r="6"/>
                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                            </svg>
                            Badge Showcase
                        </h2>
                        <button class="section-link" data-tab="achievements">View All Badges</button>
                    </div>

                    <div class="badges-showcase" id="badges-showcase">
                        <!-- Badge display component will be initialized here -->
                    </div>
                </section>

                <!-- Quick Stats -->
                <section class="dashboard-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="20" x2="18" y2="10"/>
                                <line x1="12" y1="20" x2="12" y2="4"/>
                                <line x1="6" y1="20" x2="6" y2="14"/>
                            </svg>
                            Contribution Breakdown
                        </h2>
                    </div>

                    <div class="contribution-breakdown">
                        <div class="breakdown-item">
                            <span class="breakdown-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                </svg>
                                Notes
                            </span>
                            <span class="breakdown-value">${u.counts.notes}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                                Entities
                            </span>
                            <span class="breakdown-value">${u.counts.entities}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                Perspectives
                            </span>
                            <span class="breakdown-value">${u.counts.perspectives}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                Relationships
                            </span>
                            <span class="breakdown-value">${u.counts.relationships}</span>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Get contributions tab content
     */
    _getContributionsContent() {
        const u = this.userData;

        return `
            <div class="dashboard-contributions">
                <!-- Contributions Filter -->
                <div class="contributions-filter">
                    <div class="filter-tabs">
                        <button class="filter-tab active" data-filter="all">
                            All <span class="filter-count">${u.counts.total}</span>
                        </button>
                        <button class="filter-tab" data-filter="pending">
                            Pending <span class="filter-count">${u.counts.pending}</span>
                        </button>
                        <button class="filter-tab" data-filter="approved">
                            Approved <span class="filter-count">${u.counts.approved}</span>
                        </button>
                    </div>

                    <a href="theories/user-submissions/submit.html" class="btn btn-primary btn-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        New Submission
                    </a>
                </div>

                <!-- Contributions List -->
                <div class="contributions-list" id="contributions-list">
                    <div class="contributions-loading">
                        <span class="loading-spinner"></span>
                        Loading contributions...
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get favorites tab content
     */
    _getFavoritesContent() {
        const u = this.userData;

        return `
            <div class="dashboard-favorites">
                <!-- Favorites Header -->
                <div class="favorites-header">
                    <div class="favorites-stats">
                        <span class="favorites-count">${u.favorites?.total || 0} items in your Pantheon</span>
                        ${u.favorites?.topMythology ? `
                            <span class="favorites-top-mythology">Most from: ${u.favorites.topMythology}</span>
                        ` : ''}
                    </div>

                    <div class="favorites-actions">
                        <button class="btn btn-secondary btn-sm" id="btn-export-favorites">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Export
                        </button>
                        <button class="btn btn-secondary btn-sm" id="btn-share-favorites">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>
                        <button class="btn btn-primary btn-sm" id="btn-create-collection">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            New Collection
                        </button>
                    </div>
                </div>

                <!-- Collections Grid -->
                <section class="favorites-section">
                    <h3 class="favorites-section-title">Collections</h3>
                    <div class="collections-grid" id="collections-grid">
                        <!-- Collections will be loaded here -->
                    </div>
                </section>

                <!-- Favorites Grid -->
                <section class="favorites-section">
                    <h3 class="favorites-section-title">All Favorites</h3>
                    <div class="favorites-grid" id="favorites-grid">
                        <!-- Favorites will be loaded here -->
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Get achievements tab content
     */
    _getAchievementsContent() {
        const u = this.userData;
        const levelInfo = this._getLevelInfo(u.reputation.totalPoints);

        return `
            <div class="dashboard-achievements">
                <!-- Reputation Card -->
                <section class="reputation-card">
                    <div class="reputation-header">
                        <div class="reputation-level-display tier-${levelInfo.tier}">
                            <span class="level-icon">${levelInfo.icon}</span>
                            <span class="level-name">${levelInfo.name}</span>
                        </div>
                        <div class="reputation-points">
                            <span class="points-value">${u.reputation.totalPoints.toLocaleString()}</span>
                            <span class="points-label">Total Points</span>
                        </div>
                    </div>

                    <div class="reputation-progress-section">
                        <div class="progress-header">
                            <span>Progress to ${levelInfo.next || 'Max Level'}</span>
                            ${levelInfo.next ? `<span>${levelInfo.pointsToNext} pts needed</span>` : ''}
                        </div>
                        <div class="reputation-progress-bar">
                            <div class="progress-fill tier-${levelInfo.tier}" style="width: ${this._calculateProgress(u.reputation.totalPoints, levelInfo)}%"></div>
                        </div>
                    </div>

                    <!-- Level Roadmap -->
                    <div class="level-roadmap">
                        ${this._getLevelRoadmapHTML(u.reputation.totalPoints)}
                    </div>
                </section>

                <!-- Badges Section -->
                <section class="badges-section">
                    <h3 class="section-title">All Badges (${u.badges.length})</h3>
                    <div class="badges-full-display" id="badges-full-display">
                        <!-- Full badge display will be initialized here -->
                    </div>
                </section>

                <!-- Points Breakdown -->
                <section class="points-breakdown-section">
                    <h3 class="section-title">How to Earn Points</h3>
                    <div class="points-table">
                        <div class="points-row">
                            <span class="points-action">Write a note</span>
                            <span class="points-amount">+10 pts</span>
                        </div>
                        <div class="points-row">
                            <span class="points-action">Create a perspective</span>
                            <span class="points-amount">+10 pts</span>
                        </div>
                        <div class="points-row">
                            <span class="points-action">Suggest a relationship</span>
                            <span class="points-amount">+20 pts</span>
                        </div>
                        <div class="points-row">
                            <span class="points-action">Submit an entity</span>
                            <span class="points-amount">+25 pts</span>
                        </div>
                        <div class="points-row">
                            <span class="points-action">Entity approved</span>
                            <span class="points-amount">+100 pts</span>
                        </div>
                        <div class="points-row">
                            <span class="points-action">Receive an upvote</span>
                            <span class="points-amount">+2-3 pts</span>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    /**
     * Get settings tab content
     */
    _getSettingsContent() {
        const u = this.userData;

        return `
            <div class="dashboard-settings">
                <!-- Profile Settings -->
                <section class="settings-section">
                    <h3 class="settings-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Profile Settings
                    </h3>

                    <div class="settings-form">
                        <div class="form-group">
                            <label for="setting-displayname">Display Name</label>
                            <input type="text" id="setting-displayname" value="${this._escapeHtml(u.displayName)}"
                                   class="form-input" maxlength="50" />
                            <span class="form-hint">This name will be shown on your public profile</span>
                        </div>

                        <div class="form-group">
                            <label for="setting-bio">Bio</label>
                            <textarea id="setting-bio" class="form-textarea" rows="3"
                                      maxlength="500" placeholder="Tell us about yourself...">${this._escapeHtml(u.bio)}</textarea>
                            <span class="form-hint char-count">0/500</span>
                        </div>

                        <div class="form-group">
                            <label>Avatar</label>
                            <div class="avatar-upload">
                                <div class="avatar-preview">
                                    ${u.photoURL
                                        ? `<img src="${this._escapeHtml(u.photoURL)}" alt="Avatar" />`
                                        : `<span class="avatar-initial">${(u.displayName || 'U')[0].toUpperCase()}</span>`
                                    }
                                </div>
                                <div class="avatar-actions">
                                    <button class="btn btn-secondary btn-sm" id="btn-upload-avatar">
                                        Upload Image
                                    </button>
                                    <button class="btn btn-ghost btn-sm" id="btn-remove-avatar">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Notification Settings -->
                <section class="settings-section">
                    <h3 class="settings-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        Notification Settings
                    </h3>

                    <div class="settings-form">
                        <div class="form-group form-group--toggle">
                            <div class="toggle-content">
                                <span class="toggle-label">Email Notifications</span>
                                <span class="toggle-description">Receive emails about your activity and updates</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-email-notif" ${u.notifications.email ? 'checked' : ''} />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div class="form-group form-group--toggle">
                            <div class="toggle-content">
                                <span class="toggle-label">Weekly Digest</span>
                                <span class="toggle-description">Get a weekly summary of mythology updates</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-weekly-digest" ${u.notifications.weekly ? 'checked' : ''} />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div class="form-group form-group--toggle">
                            <div class="toggle-content">
                                <span class="toggle-label">Submission Updates</span>
                                <span class="toggle-description">Get notified when your submissions are reviewed</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-submission-notif" checked />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Privacy Settings -->
                <section class="settings-section">
                    <h3 class="settings-section-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Privacy Settings
                    </h3>

                    <div class="settings-form">
                        <div class="form-group form-group--toggle">
                            <div class="toggle-content">
                                <span class="toggle-label">Public Profile</span>
                                <span class="toggle-description">Allow others to view your profile and contributions</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-public-profile" checked />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>

                        <div class="form-group form-group--toggle">
                            <div class="toggle-content">
                                <span class="toggle-label">Show on Leaderboard</span>
                                <span class="toggle-description">Display your name on reputation leaderboards</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-show-leaderboard" checked />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Save Button -->
                <div class="settings-actions">
                    <button class="btn btn-primary" id="btn-save-settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save Changes
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get activity item HTML
     */
    _getActivityItemHTML(item) {
        const date = this._formatRelativeDate(item.createdAt);
        const statusClass = item.status ? `status-${item.status}` : '';

        return `
            <div class="activity-item ${statusClass}">
                <div class="activity-item__icon">
                    ${this._getActivityIcon(item.type)}
                </div>
                <div class="activity-item__content">
                    <span class="activity-item__title">${this._escapeHtml(item.title)}</span>
                    ${item.content ? `<p class="activity-item__excerpt">${this._escapeHtml(item.content)}...</p>` : ''}
                    ${item.status ? `<span class="activity-item__status status-badge--${item.status}">${item.status}</span>` : ''}
                </div>
                <span class="activity-item__time">${date}</span>
            </div>
        `;
    }

    /**
     * Get activity icon
     */
    _getActivityIcon(type) {
        const icons = {
            note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
            submission: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            entity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>'
        };
        return icons[type] || icons.note;
    }

    /**
     * Get level info from points
     */
    _getLevelInfo(points) {
        const levels = [
            { min: 1000, name: 'Legend', tier: 'platinum', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>', next: null },
            { min: 500, name: 'Master', tier: 'gold', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9 9H2l5.5 4.5L5 21l7-4 7 4-2.5-7.5L22 9h-7L12 2z"/></svg>', next: 'Legend' },
            { min: 250, name: 'Expert', tier: 'gold', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', next: 'Master' },
            { min: 100, name: 'Contributor', tier: 'silver', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>', next: 'Expert' },
            { min: 25, name: 'Member', tier: 'silver', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', next: 'Contributor' },
            { min: 0, name: 'Newcomer', tier: 'bronze', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>', next: 'Member' }
        ];

        for (const level of levels) {
            if (points >= level.min) {
                const nextLevel = levels.find(l => l.min > level.min);
                return {
                    ...level,
                    pointsToNext: nextLevel ? nextLevel.min - points : 0
                };
            }
        }

        return levels[levels.length - 1];
    }

    /**
     * Calculate progress percentage
     */
    _calculateProgress(points, levelInfo) {
        if (!levelInfo.next) return 100;

        const levels = [0, 25, 100, 250, 500, 1000];
        const currentIndex = levels.findIndex(l => l > points) - 1;

        if (currentIndex < 0) return 100;

        const currentMin = levels[currentIndex];
        const nextMin = levels[currentIndex + 1];

        if (!nextMin) return 100;

        return Math.min(100, ((points - currentMin) / (nextMin - currentMin)) * 100);
    }

    /**
     * Get level roadmap HTML
     */
    _getLevelRoadmapHTML(currentPoints) {
        const levels = [
            { min: 0, name: 'Newcomer', tier: 'bronze' },
            { min: 25, name: 'Member', tier: 'silver' },
            { min: 100, name: 'Contributor', tier: 'silver' },
            { min: 250, name: 'Expert', tier: 'gold' },
            { min: 500, name: 'Master', tier: 'gold' },
            { min: 1000, name: 'Legend', tier: 'platinum' }
        ];

        return levels.map((level, index) => {
            const isAchieved = currentPoints >= level.min;
            const isCurrent = currentPoints >= level.min && (index === levels.length - 1 || currentPoints < levels[index + 1].min);

            return `
                <div class="roadmap-level ${isAchieved ? 'achieved' : ''} ${isCurrent ? 'current' : ''} tier-${level.tier}">
                    <div class="roadmap-marker"></div>
                    <span class="roadmap-name">${level.name}</span>
                    <span class="roadmap-points">${level.min} pts</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Format relative date
     */
    _formatRelativeDate(timestamp) {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMins = Math.floor(diffMs / (1000 * 60));
                return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
            }
            return `${diffHours}h ago`;
        }
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
     * Bind events
     */
    _bindEvents() {
        if (!this.container) return;

        // Tab switching
        const tabs = this.container.querySelectorAll('.dashboard-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => this._handleTabClick(e));
        });

        // Edit profile button
        const editProfileBtn = this.container.querySelector('#btn-edit-profile');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this._handleEditProfile());
        }

        // Avatar edit button
        const avatarEditBtn = this.container.querySelector('.dashboard-avatar__edit-btn');
        if (avatarEditBtn) {
            avatarEditBtn.addEventListener('click', () => this._handleAvatarUpload());
        }

        // Save settings
        const saveSettingsBtn = this.container.querySelector('#btn-save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this._handleSaveSettings());
        }

        // Bio character count
        const bioTextarea = this.container.querySelector('#setting-bio');
        if (bioTextarea) {
            bioTextarea.addEventListener('input', (e) => {
                const charCount = this.container.querySelector('.char-count');
                if (charCount) {
                    charCount.textContent = `${e.target.value.length}/500`;
                }
            });
        }

        // Export favorites
        const exportBtn = this.container.querySelector('#btn-export-favorites');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this._handleExportFavorites());
        }

        // Share favorites
        const shareBtn = this.container.querySelector('#btn-share-favorites');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this._handleShareFavorites());
        }

        // Create collection
        const createCollectionBtn = this.container.querySelector('#btn-create-collection');
        if (createCollectionBtn) {
            createCollectionBtn.addEventListener('click', () => this._handleCreateCollection());
        }

        // Filter tabs for contributions
        const filterTabs = this.container.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this._handleFilterChange(e));
        });

        // Section links that switch tabs
        const sectionLinks = this.container.querySelectorAll('[data-tab]');
        sectionLinks.forEach(link => {
            if (!link.classList.contains('dashboard-tab')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabId = link.dataset.tab;
                    this._switchTab(tabId);
                });
            }
        });
    }

    /**
     * Initialize sub-components
     */
    _initSubComponents() {
        // Initialize badge display
        this._initBadgeDisplay();

        // Load contributions if on that tab
        if (this.activeTab === 'contributions') {
            this._loadContributions();
        }

        // Load favorites if on that tab
        if (this.activeTab === 'favorites') {
            this._loadFavorites();
        }
    }

    /**
     * Initialize badge display
     */
    _initBadgeDisplay() {
        const showcaseContainer = this.container.querySelector('#badges-showcase');
        const fullContainer = this.container.querySelector('#badges-full-display');

        if (typeof window.BadgeDisplay !== 'undefined') {
            // Badge showcase (compact)
            if (showcaseContainer) {
                this.badgeDisplay = new window.BadgeDisplay({
                    maxDisplay: 6,
                    showTooltips: true,
                    compact: false,
                    showPoints: true
                });
                this.badgeDisplay.setBadges(this.userData.badges);
                this.badgeDisplay.render(showcaseContainer);
            }

            // Full badge display
            if (fullContainer) {
                const fullBadgeDisplay = new window.BadgeDisplay({
                    maxDisplay: 100,
                    showTooltips: true,
                    compact: false,
                    showPoints: true,
                    allowPin: true,
                    onPinChange: (badge, pinned) => this._handleBadgePin(badge, pinned)
                });
                fullBadgeDisplay.setBadges(this.userData.badges);
                fullBadgeDisplay.render(fullContainer);
            }
        } else {
            // Fallback
            if (showcaseContainer) {
                showcaseContainer.innerHTML = this.userData.badges.length > 0
                    ? this.userData.badges.slice(0, 6).map(b => `<span class="badge-simple">${b.badgeName || b.badgeId}</span>`).join('')
                    : '<span class="no-badges">No badges earned yet</span>';
            }
        }
    }

    /**
     * Handle tab click
     */
    _handleTabClick(e) {
        const tab = e.currentTarget;
        const tabId = tab.dataset.tab;
        this._switchTab(tabId);
    }

    /**
     * Switch to a tab
     */
    _switchTab(tabId) {
        if (tabId === this.activeTab) return;

        this.activeTab = tabId;

        // Update tab buttons
        this.container.querySelectorAll('.dashboard-tab').forEach(t => {
            const isActive = t.dataset.tab === tabId;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive);
        });

        // Update content
        const contentContainer = this.container.querySelector('.dashboard-content');
        if (contentContainer) {
            contentContainer.innerHTML = this._getTabContent(tabId);

            // Re-bind events for new content
            this._bindEvents();

            // Initialize components for the new tab
            if (tabId === 'contributions') {
                this._loadContributions();
            } else if (tabId === 'favorites') {
                this._loadFavorites();
            } else if (tabId === 'achievements') {
                this._initBadgeDisplay();
            }
        }

        // Update data attribute
        this.container.dataset.activeTab = tabId;
    }

    /**
     * Handle edit profile
     */
    _handleEditProfile() {
        this._switchTab('settings');
    }

    /**
     * Handle avatar upload
     */
    async _handleAvatarUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image must be less than 2MB');
                return;
            }

            try {
                // Upload to Firebase Storage
                const storage = firebase.storage();
                const ref = storage.ref(`avatars/${this.userId}/${Date.now()}_${file.name}`);
                await ref.put(file);
                const url = await ref.getDownloadURL();

                // Update user profile
                const user = firebase.auth().currentUser;
                await user.updateProfile({ photoURL: url });

                // Update Firestore
                const db = firebase.firestore();
                await db.collection('users').doc(this.userId).update({ photoURL: url });

                // Update local data and re-render
                this.userData.photoURL = url;
                this.render(this.container);

            } catch (error) {
                console.error('[UserDashboard] Avatar upload failed:', error);
                alert('Failed to upload avatar: ' + error.message);
            }
        };

        input.click();
    }

    /**
     * Handle save settings
     */
    async _handleSaveSettings() {
        const saveBtn = this.container.querySelector('#btn-save-settings');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        }

        try {
            const displayName = this.container.querySelector('#setting-displayname')?.value?.trim();
            const bio = this.container.querySelector('#setting-bio')?.value?.trim();
            const emailNotif = this.container.querySelector('#setting-email-notif')?.checked;
            const weeklyDigest = this.container.querySelector('#setting-weekly-digest')?.checked;

            // Update Firebase Auth profile
            const user = firebase.auth().currentUser;
            if (displayName && displayName !== user.displayName) {
                await user.updateProfile({ displayName });
            }

            // Update Firestore
            const db = firebase.firestore();
            await db.collection('users').doc(this.userId).update({
                displayName,
                bio,
                notificationSettings: {
                    email: emailNotif,
                    weekly: weeklyDigest
                },
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Show success
            if (window.toast) {
                window.toast.success('Settings saved successfully');
            } else {
                alert('Settings saved successfully');
            }

        } catch (error) {
            console.error('[UserDashboard] Save settings failed:', error);
            alert('Failed to save settings: ' + error.message);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Changes
                `;
            }
        }
    }

    /**
     * Handle export favorites
     */
    async _handleExportFavorites() {
        if (this.favoritesService) {
            await this.favoritesService.exportFavorites();
        }
    }

    /**
     * Handle share favorites
     */
    async _handleShareFavorites() {
        if (this.favoritesService) {
            await this.favoritesService.generateShareLink();
        }
    }

    /**
     * Handle create collection
     */
    async _handleCreateCollection() {
        const name = prompt('Collection name:');
        if (!name) return;

        if (this.favoritesService) {
            const result = await this.favoritesService.createFolder({ name });
            if (result.success) {
                this._loadFavorites();
            }
        }
    }

    /**
     * Handle badge pin
     */
    async _handleBadgePin(badge, pinned) {
        if (this.reputationService) {
            await this.reputationService.toggleBadgePin(badge.id, pinned);
        }
    }

    /**
     * Handle filter change for contributions
     */
    _handleFilterChange(e) {
        const filterTab = e.currentTarget;
        const filter = filterTab.dataset.filter;

        // Update active filter
        this.container.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.filter === filter);
        });

        // Reload contributions with filter
        this._loadContributions(filter);
    }

    /**
     * Load contributions list
     */
    async _loadContributions(filter = 'all') {
        const container = this.container.querySelector('#contributions-list');
        if (!container) return;

        container.innerHTML = `
            <div class="contributions-loading">
                <span class="loading-spinner"></span>
                Loading contributions...
            </div>
        `;

        try {
            const db = firebase.firestore();
            let query = db.collection('user_assets')
                .where('createdBy', '==', this.userId)
                .orderBy('createdAt', 'desc')
                .limit(20);

            if (filter !== 'all') {
                query = query.where('status', '==', filter);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <h3>No contributions yet</h3>
                        <p>Start by submitting your first entity!</p>
                        <a href="theories/user-submissions/submit.html" class="btn btn-primary">Make a Submission</a>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += this._getContributionItemHTML(doc.id, data);
            });

            container.innerHTML = html;

        } catch (error) {
            console.error('[UserDashboard] Load contributions failed:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p>Failed to load contributions</p>
                    <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Get contribution item HTML
     */
    _getContributionItemHTML(id, data) {
        const date = this._formatRelativeDate(data.createdAt);
        const statusClass = data.status || 'pending';

        return `
            <div class="contribution-item status-${statusClass}">
                <div class="contribution-item__main">
                    <div class="contribution-item__icon">
                        ${this._getActivityIcon('entity')}
                    </div>
                    <div class="contribution-item__content">
                        <h4 class="contribution-item__title">${this._escapeHtml(data.name || 'Untitled')}</h4>
                        <div class="contribution-item__meta">
                            <span class="meta-tag">${data.type || 'Entity'}</span>
                            <span class="meta-tag">${data.mythology || 'General'}</span>
                            <span class="meta-date">${date}</span>
                        </div>
                    </div>
                </div>
                <div class="contribution-item__status">
                    <span class="status-badge status-badge--${statusClass}">
                        ${statusClass === 'pending' ? 'Pending Review' : statusClass === 'approved' ? 'Approved' : statusClass === 'rejected' ? 'Needs Revision' : statusClass}
                    </span>
                </div>
                <div class="contribution-item__actions">
                    <button class="btn btn-ghost btn-sm" data-action="view" data-id="${id}">View</button>
                    ${statusClass === 'rejected' ? `<button class="btn btn-secondary btn-sm" data-action="edit" data-id="${id}">Edit</button>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Load favorites
     */
    async _loadFavorites() {
        const collectionsContainer = this.container.querySelector('#collections-grid');
        const favoritesContainer = this.container.querySelector('#favorites-grid');

        if (!this.favoritesService) {
            if (favoritesContainer) {
                favoritesContainer.innerHTML = '<p class="empty-state">Favorites service not available</p>';
            }
            return;
        }

        try {
            // Load collections
            const folders = await this.favoritesService.getFolders();
            if (collectionsContainer) {
                if (folders.length > 0) {
                    collectionsContainer.innerHTML = folders.map(folder => `
                        <div class="collection-card" data-folder-id="${folder.id}">
                            <div class="collection-card__icon" style="background: ${folder.color || '#8b7fff'}">
                                ${folder.icon || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'}
                            </div>
                            <span class="collection-card__name">${this._escapeHtml(folder.name)}</span>
                        </div>
                    `).join('');
                } else {
                    collectionsContainer.innerHTML = `
                        <div class="empty-collections">
                            <p>No collections yet. Create one to organize your favorites!</p>
                        </div>
                    `;
                }
            }

            // Load favorites
            const favorites = await this.favoritesService.getFavorites();
            if (favoritesContainer) {
                if (favorites.length > 0) {
                    favoritesContainer.innerHTML = favorites.map(fav => `
                        <div class="favorite-card" data-entity-id="${fav.entityId}" data-entity-type="${fav.entityType}">
                            <div class="favorite-card__icon">${fav.icon || ''}</div>
                            <div class="favorite-card__content">
                                <span class="favorite-card__name">${this._escapeHtml(fav.name)}</span>
                                <span class="favorite-card__meta">${fav.mythology} - ${fav.entityType}</span>
                            </div>
                            <button class="favorite-card__remove" title="Remove from favorites">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    `).join('');
                } else {
                    favoritesContainer.innerHTML = `
                        <div class="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <h3>No favorites yet</h3>
                            <p>Start exploring and save your favorite myths!</p>
                            <a href="#/" class="btn btn-primary">Explore Mythologies</a>
                        </div>
                    `;
                }
            }

        } catch (error) {
            console.error('[UserDashboard] Load favorites failed:', error);
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

        // Destroy sub-components
        if (this.badgeDisplay) {
            this.badgeDisplay.destroy();
            this.badgeDisplay = null;
        }

        this.container = null;
        this.userData = null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserDashboardView };
}

if (typeof window !== 'undefined') {
    window.UserDashboardView = UserDashboardView;
}
