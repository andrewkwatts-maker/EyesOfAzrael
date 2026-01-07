/**
 * User Dashboard Component
 * Displays user's submissions, favorites, notes, and activity
 * Modern, polished UI with tabs, stats cards, and pagination
 */

class UserDashboard {
    /**
     * @param {Object} options - Configuration options
     * @param {FirebaseCRUDManager} options.crudManager - CRUD manager instance
     * @param {firebase.auth.Auth} options.auth - Firebase Auth instance
     */
    constructor(options) {
        this.crudManager = options.crudManager;
        this.auth = options.auth;

        // Data stores
        this.submissions = [];
        this.favorites = [];
        this.notes = [];

        // Pagination state
        this.pagination = {
            submissions: { page: 1, perPage: 8, total: 0 },
            favorites: { page: 1, perPage: 12, total: 0 },
            notes: { page: 1, perPage: 10, total: 0 }
        };

        // Active tab
        this.activeTab = 'submissions';

        // Stats cache
        this.stats = {
            submissions: 0,
            favorites: 0,
            notes: 0,
            badges: 0
        };

        // Container reference
        this.container = null;

        // Animation state for number counters
        this.animatedStats = false;
    }

    /**
     * Get default avatar SVG
     * @returns {string} Data URI for default avatar
     */
    getDefaultAvatar() {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" fill="#667eea"/>
                <circle cx="50" cy="38" r="18" fill="#e2e8f0"/>
                <ellipse cx="50" cy="78" rx="24" ry="16" fill="#e2e8f0"/>
            </svg>
        `;
        return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
    }

    /**
     * Render the dashboard
     * @returns {Promise<string>} HTML string
     */
    async render() {
        const user = this.auth.currentUser;
        if (!user) {
            return this.renderNotAuthenticated();
        }

        // Load all user data
        await this.loadAllUserData();

        const avatarUrl = user.photoURL || this.getDefaultAvatar();
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';

        return `
            <div class="user-dashboard" role="main" aria-label="User Dashboard">
                <!-- Header Section -->
                <header class="dashboard-header glass-card">
                    <div class="dashboard-header-content">
                        <div class="dashboard-user-info">
                            <div class="dashboard-avatar-wrapper">
                                <img
                                    src="${avatarUrl}"
                                    alt="${displayName}'s avatar"
                                    class="dashboard-avatar"
                                    onerror="this.src='${this.getDefaultAvatar()}'"
                                />
                                <span class="avatar-status-indicator" aria-label="Online"></span>
                            </div>
                            <div class="user-details">
                                <h1 class="dashboard-welcome">Welcome, ${this.escapeHtml(displayName)}!</h1>
                                <p class="dashboard-user-email">${user.email}</p>
                                <p class="dashboard-member-since">Member since ${this.formatMemberSince(user.metadata?.creationTime)}</p>
                            </div>
                        </div>
                        <div class="dashboard-header-actions">
                            <button
                                id="editProfileBtn"
                                class="btn btn-secondary"
                                aria-label="Edit profile settings"
                            >
                                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                <span>Edit Profile</span>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Statistics Cards -->
                <section class="dashboard-stats" role="region" aria-label="Your Statistics">
                    ${this.renderStatsCards()}
                </section>

                <!-- Main Content with Tabs -->
                <section class="dashboard-main glass-card">
                    <!-- Tab Navigation -->
                    <nav class="dashboard-tabs" role="tablist" aria-label="Dashboard sections">
                        <button
                            class="dashboard-tab ${this.activeTab === 'submissions' ? 'active' : ''}"
                            role="tab"
                            aria-selected="${this.activeTab === 'submissions'}"
                            aria-controls="panel-submissions"
                            data-tab="submissions"
                            id="tab-submissions"
                        >
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                            <span>Submissions</span>
                            <span class="tab-count">${this.stats.submissions}</span>
                        </button>
                        <button
                            class="dashboard-tab ${this.activeTab === 'favorites' ? 'active' : ''}"
                            role="tab"
                            aria-selected="${this.activeTab === 'favorites'}"
                            aria-controls="panel-favorites"
                            data-tab="favorites"
                            id="tab-favorites"
                        >
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>Favorites</span>
                            <span class="tab-count">${this.stats.favorites}</span>
                        </button>
                        <button
                            class="dashboard-tab ${this.activeTab === 'notes' ? 'active' : ''}"
                            role="tab"
                            aria-selected="${this.activeTab === 'notes'}"
                            aria-controls="panel-notes"
                            data-tab="notes"
                            id="tab-notes"
                        >
                            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                            <span>Notes</span>
                            <span class="tab-count">${this.stats.notes}</span>
                        </button>
                    </nav>

                    <!-- Tab Panels -->
                    <div class="dashboard-tab-content">
                        <div
                            id="panel-submissions"
                            class="dashboard-panel ${this.activeTab === 'submissions' ? 'active' : ''}"
                            role="tabpanel"
                            aria-labelledby="tab-submissions"
                        >
                            ${this.renderSubmissionsTab()}
                        </div>
                        <div
                            id="panel-favorites"
                            class="dashboard-panel ${this.activeTab === 'favorites' ? 'active' : ''}"
                            role="tabpanel"
                            aria-labelledby="tab-favorites"
                        >
                            ${this.renderFavoritesTab()}
                        </div>
                        <div
                            id="panel-notes"
                            class="dashboard-panel ${this.activeTab === 'notes' ? 'active' : ''}"
                            role="tabpanel"
                            aria-labelledby="tab-notes"
                        >
                            ${this.renderNotesTab()}
                        </div>
                    </div>
                </section>

                <!-- Modal Container -->
                <div id="dashboardModal" class="dashboard-modal" role="dialog" aria-modal="true" aria-hidden="true"></div>
            </div>
        `;
    }

    /**
     * Render stats cards with hover tooltips
     * @returns {string} HTML string
     */
    renderStatsCards() {
        const statsConfig = [
            {
                key: 'submissions',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>`,
                label: 'Submissions',
                value: this.stats.submissions,
                tooltip: this.getSubmissionBreakdown(),
                color: 'gold'
            },
            {
                key: 'favorites',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>`,
                label: 'Favorites',
                value: this.stats.favorites,
                tooltip: 'Your personal pantheon of saved entities',
                color: 'rose'
            },
            {
                key: 'notes',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>`,
                label: 'Notes',
                value: this.stats.notes,
                tooltip: 'Personal annotations across all entities',
                color: 'cyan'
            },
            {
                key: 'badges',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>`,
                label: 'Badges',
                value: this.stats.badges,
                tooltip: 'Achievements and recognition earned',
                color: 'purple'
            }
        ];

        return statsConfig.map(stat => `
            <article class="stat-card glass-card stat-card--${stat.color}" role="article" data-stat="${stat.key}">
                <div class="stat-card-inner">
                    <div class="stat-icon" aria-hidden="true">
                        ${stat.icon}
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" data-target="${stat.value}" aria-label="${stat.label}: ${stat.value}">
                            0
                        </div>
                        <div class="stat-label">${stat.label}</div>
                    </div>
                </div>
                <div class="stat-tooltip" role="tooltip">
                    ${stat.tooltip}
                </div>
            </article>
        `).join('');
    }

    /**
     * Get submission breakdown for tooltip
     * @returns {string} HTML string
     */
    getSubmissionBreakdown() {
        const draft = this.submissions.filter(s => s.status === 'draft').length;
        const pending = this.submissions.filter(s => s.status === 'pending').length;
        const approved = this.submissions.filter(s => s.status === 'approved').length;
        const rejected = this.submissions.filter(s => s.status === 'rejected').length;

        return `
            <div class="tooltip-breakdown">
                <div class="tooltip-row"><span class="status-dot status-dot--draft"></span> Draft: ${draft}</div>
                <div class="tooltip-row"><span class="status-dot status-dot--pending"></span> Pending: ${pending}</div>
                <div class="tooltip-row"><span class="status-dot status-dot--approved"></span> Approved: ${approved}</div>
                <div class="tooltip-row"><span class="status-dot status-dot--rejected"></span> Rejected: ${rejected}</div>
            </div>
        `;
    }

    /**
     * Render submissions tab
     * @returns {string} HTML string
     */
    renderSubmissionsTab() {
        if (this.submissions.length === 0) {
            return this.renderEmptyState('submissions');
        }

        const { page, perPage, total } = this.pagination.submissions;
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedSubmissions = this.submissions.slice(start, end);
        const totalPages = Math.ceil(total / perPage);

        return `
            <div class="submissions-list" role="list">
                ${paginatedSubmissions.map(submission => this.renderSubmissionCard(submission)).join('')}
            </div>
            ${this.renderPagination('submissions', page, totalPages, total)}
        `;
    }

    /**
     * Render a single submission card
     * @param {Object} submission - Submission data
     * @returns {string} HTML string
     */
    renderSubmissionCard(submission) {
        const statusConfig = {
            draft: { label: 'Draft', icon: 'edit-2', class: 'status--draft' },
            pending: { label: 'Pending Review', icon: 'clock', class: 'status--pending' },
            approved: { label: 'Approved', icon: 'check-circle', class: 'status--approved' },
            rejected: { label: 'Rejected', icon: 'x-circle', class: 'status--rejected' }
        };

        const status = statusConfig[submission.status] || statusConfig.draft;
        const name = submission.entityName || submission.data?.name || 'Untitled';
        const type = submission.type || 'entity';
        const date = this.formatDate(submission.submittedAt || submission.createdAt);
        const canEdit = ['draft', 'rejected'].includes(submission.status);
        const canDelete = submission.status === 'draft';

        return `
            <article class="submission-card" role="listitem" data-id="${submission.id}">
                <div class="submission-icon" aria-hidden="true">
                    ${submission.data?.icon || this.getTypeIcon(type)}
                </div>
                <div class="submission-content">
                    <h3 class="submission-title" title="${this.escapeHtml(name)}">
                        ${this.truncate(name, 40)}
                    </h3>
                    <div class="submission-meta">
                        <span class="submission-type">${this.capitalizeFirst(type)}</span>
                        <span class="submission-date">${date}</span>
                    </div>
                </div>
                <div class="submission-status ${status.class}">
                    ${this.getStatusIcon(submission.status)}
                    <span>${status.label}</span>
                </div>
                <div class="submission-actions">
                    <button
                        class="action-btn action-btn--view"
                        data-action="view"
                        data-id="${submission.id}"
                        aria-label="View ${name}"
                        title="View"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    ${canEdit ? `
                        <button
                            class="action-btn action-btn--edit"
                            data-action="edit"
                            data-id="${submission.id}"
                            aria-label="Edit ${name}"
                            title="Edit"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    ` : ''}
                    ${canDelete ? `
                        <button
                            class="action-btn action-btn--delete"
                            data-action="delete"
                            data-id="${submission.id}"
                            aria-label="Delete ${name}"
                            title="Delete"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </article>
        `;
    }

    /**
     * Render favorites tab
     * @returns {string} HTML string
     */
    renderFavoritesTab() {
        if (this.favorites.length === 0) {
            return this.renderEmptyState('favorites');
        }

        const { page, perPage, total } = this.pagination.favorites;
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedFavorites = this.favorites.slice(start, end);
        const totalPages = Math.ceil(total / perPage);

        return `
            <div class="favorites-grid" role="list">
                ${paginatedFavorites.map(favorite => this.renderFavoriteCard(favorite)).join('')}
            </div>
            ${this.renderPagination('favorites', page, totalPages, total)}
        `;
    }

    /**
     * Render a single favorite card
     * @param {Object} favorite - Favorite data
     * @returns {string} HTML string
     */
    renderFavoriteCard(favorite) {
        const name = favorite.name || 'Unknown Entity';
        const type = favorite.entityType || 'entity';
        const mythology = favorite.mythology || 'Unknown';

        return `
            <article class="favorite-card glass-card" role="listitem" data-id="${favorite.entityId}" data-type="${type}">
                <button
                    class="favorite-remove-btn"
                    data-action="remove-favorite"
                    data-entity-id="${favorite.entityId}"
                    data-entity-type="${type}"
                    aria-label="Remove ${name} from favorites"
                    title="Remove from favorites"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div class="favorite-icon" aria-hidden="true">
                    ${favorite.icon || this.getTypeIcon(type)}
                </div>
                <h3 class="favorite-name" title="${this.escapeHtml(name)}">
                    ${this.truncate(name, 25)}
                </h3>
                <div class="favorite-meta">
                    <span class="favorite-type">${this.capitalizeFirst(type)}</span>
                    <span class="favorite-mythology">${mythology}</span>
                </div>
                <button
                    class="favorite-view-btn"
                    data-action="view-favorite"
                    data-entity-id="${favorite.entityId}"
                    data-entity-type="${type}"
                    aria-label="View ${name}"
                >
                    View Details
                </button>
            </article>
        `;
    }

    /**
     * Render notes tab
     * @returns {string} HTML string
     */
    renderNotesTab() {
        if (this.notes.length === 0) {
            return this.renderEmptyState('notes');
        }

        const { page, perPage, total } = this.pagination.notes;
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedNotes = this.notes.slice(start, end);
        const totalPages = Math.ceil(total / perPage);

        return `
            <div class="notes-list" role="list">
                ${paginatedNotes.map(note => this.renderNoteCard(note)).join('')}
            </div>
            ${this.renderPagination('notes', page, totalPages, total)}
        `;
    }

    /**
     * Render a single note card
     * @param {Object} note - Note data
     * @returns {string} HTML string
     */
    renderNoteCard(note) {
        const entityName = note.entityName || note.assetId || 'Unknown Entity';
        const preview = this.truncate(note.content, 120);
        const date = this.formatDate(note.createdAt || note.updatedAt);
        const isEdited = note.isEdited;

        return `
            <article class="note-card" role="listitem" data-id="${note.id}">
                <div class="note-header">
                    <div class="note-entity">
                        <span class="note-entity-icon" aria-hidden="true">
                            ${this.getTypeIcon(note.assetType)}
                        </span>
                        <span class="note-entity-name">${this.escapeHtml(entityName)}</span>
                    </div>
                    <div class="note-date">
                        ${date}${isEdited ? ' (edited)' : ''}
                    </div>
                </div>
                <p class="note-preview">${this.escapeHtml(preview)}</p>
                <div class="note-actions">
                    <button
                        class="action-btn action-btn--edit"
                        data-action="edit-note"
                        data-note-id="${note.id}"
                        data-asset-type="${note.assetType}"
                        data-asset-id="${note.assetId}"
                        aria-label="Edit note"
                        title="Edit"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button
                        class="action-btn action-btn--delete"
                        data-action="delete-note"
                        data-note-id="${note.id}"
                        data-asset-type="${note.assetType}"
                        data-asset-id="${note.assetId}"
                        aria-label="Delete note"
                        title="Delete"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </article>
        `;
    }

    /**
     * Render empty state for a tab
     * @param {string} type - Tab type
     * @returns {string} HTML string
     */
    renderEmptyState(type) {
        const emptyConfig = {
            submissions: {
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>`,
                title: 'No Submissions Yet',
                message: 'Share your knowledge with the community by creating your first entity submission.',
                cta: 'Create Submission',
                action: 'create-submission'
            },
            favorites: {
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>`,
                title: 'No Favorites Yet',
                message: 'Build your personal pantheon by favoriting deities, heroes, and other mythological entities.',
                cta: 'Start Exploring',
                action: 'explore'
            },
            notes: {
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>`,
                title: 'No Notes Yet',
                message: 'Add personal annotations to any entity to keep track of your thoughts and insights.',
                cta: 'Browse Entities',
                action: 'browse'
            }
        };

        const config = emptyConfig[type];

        return `
            <div class="empty-state" role="status">
                <div class="empty-state-icon" aria-hidden="true">
                    ${config.icon}
                </div>
                <h3 class="empty-state-title">${config.title}</h3>
                <p class="empty-state-message">${config.message}</p>
                <button
                    class="btn btn-primary empty-state-cta"
                    data-action="${config.action}"
                    aria-label="${config.cta}"
                >
                    ${config.cta}
                </button>
            </div>
        `;
    }

    /**
     * Render pagination controls
     * @param {string} type - Tab type
     * @param {number} currentPage - Current page
     * @param {number} totalPages - Total pages
     * @param {number} totalItems - Total items
     * @returns {string} HTML string
     */
    renderPagination(type, currentPage, totalPages, totalItems) {
        if (totalPages <= 1) {
            return `<div class="pagination-info">Showing all ${totalItems} items</div>`;
        }

        const perPage = this.pagination[type].perPage;
        const start = (currentPage - 1) * perPage + 1;
        const end = Math.min(currentPage * perPage, totalItems);

        return `
            <div class="pagination" role="navigation" aria-label="Pagination">
                <div class="pagination-info">
                    Showing ${start}-${end} of ${totalItems}
                </div>
                <div class="pagination-controls">
                    <button
                        class="pagination-btn pagination-btn--prev"
                        data-action="paginate"
                        data-type="${type}"
                        data-page="${currentPage - 1}"
                        ${currentPage <= 1 ? 'disabled' : ''}
                        aria-label="Previous page"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <span class="pagination-current">${currentPage} / ${totalPages}</span>
                    <button
                        class="pagination-btn pagination-btn--next"
                        data-action="paginate"
                        data-type="${type}"
                        data-page="${currentPage + 1}"
                        ${currentPage >= totalPages ? 'disabled' : ''}
                        aria-label="Next page"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render not authenticated state
     * @returns {string} HTML string
     */
    renderNotAuthenticated() {
        return `
            <div class="dashboard-auth-required glass-card" role="alert">
                <div class="auth-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </div>
                <h2>Authentication Required</h2>
                <p class="auth-message">Sign in to access your dashboard, manage submissions, and track favorites.</p>
                <button
                    id="signInBtn"
                    class="btn btn-primary btn-large"
                    aria-label="Sign in with Google"
                >
                    <svg class="btn-icon-svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign In with Google</span>
                </button>
            </div>
        `;
    }

    /**
     * Load all user data
     */
    async loadAllUserData() {
        const user = this.auth.currentUser;
        if (!user) return;

        try {
            // Load data in parallel
            const [submissions, favorites, notes] = await Promise.all([
                this.loadSubmissions(),
                this.loadFavorites(),
                this.loadNotes()
            ]);

            this.submissions = submissions;
            this.favorites = favorites;
            this.notes = notes;

            // Update stats
            this.stats = {
                submissions: this.submissions.length,
                favorites: this.favorites.length,
                notes: this.notes.length,
                badges: await this.loadBadgeCount()
            };

            // Update pagination totals
            this.pagination.submissions.total = this.submissions.length;
            this.pagination.favorites.total = this.favorites.length;
            this.pagination.notes.total = this.notes.length;

        } catch (error) {
            console.error('[UserDashboard] Error loading user data:', error);
        }
    }

    /**
     * Load user submissions
     * @returns {Promise<Array>}
     */
    async loadSubmissions() {
        try {
            const user = this.auth.currentUser;
            if (!user) return [];

            // Try to get from window.submissionWorkflow if available
            if (window.submissionWorkflow) {
                const result = await window.submissionWorkflow.getUserSubmissions(user.uid);
                return result || [];
            }

            // Fallback: Try direct Firestore query
            if (window.EyesOfAzrael?.db) {
                const snapshot = await window.EyesOfAzrael.db
                    .collection('submissions')
                    .where('submittedBy', '==', user.uid)
                    .orderBy('submittedAt', 'desc')
                    .limit(100)
                    .get();

                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            return [];
        } catch (error) {
            console.error('[UserDashboard] Error loading submissions:', error);
            return [];
        }
    }

    /**
     * Load user favorites
     * @returns {Promise<Array>}
     */
    async loadFavorites() {
        try {
            if (window.EyesOfAzrael?.favorites) {
                const result = await window.EyesOfAzrael.favorites.getFavorites({ returnResultObject: true });
                return result.success ? result.data : [];
            }
            return [];
        } catch (error) {
            console.error('[UserDashboard] Error loading favorites:', error);
            return [];
        }
    }

    /**
     * Load user notes
     * @returns {Promise<Array>}
     */
    async loadNotes() {
        try {
            const user = this.auth.currentUser;
            if (!user) return [];

            if (window.notesService) {
                const notes = await window.notesService.getUserNotes(user.uid, 100);
                return notes || [];
            }
            return [];
        } catch (error) {
            console.error('[UserDashboard] Error loading notes:', error);
            return [];
        }
    }

    /**
     * Load badge count
     * @returns {Promise<number>}
     */
    async loadBadgeCount() {
        try {
            const user = this.auth.currentUser;
            if (!user || !window.EyesOfAzrael?.db) return 0;

            const userDoc = await window.EyesOfAzrael.db
                .collection('users')
                .doc(user.uid)
                .get();

            if (userDoc.exists) {
                const data = userDoc.data();
                return data.badges?.length || 0;
            }
            return 0;
        } catch (error) {
            console.error('[UserDashboard] Error loading badges:', error);
            return 0;
        }
    }

    /**
     * Initialize dashboard after rendering to DOM
     * @param {HTMLElement} container - Container element
     */
    initialize(container) {
        this.container = container;

        // Tab navigation
        this.initializeTabs();

        // Stat card animations
        this.animateStatNumbers();

        // Event delegation for actions
        this.initializeEventListeners();

        // Keyboard navigation
        this.initializeKeyboardNavigation();
    }

    /**
     * Initialize tab navigation
     */
    initializeTabs() {
        const tabs = this.container.querySelectorAll('.dashboard-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    /**
     * Switch to a different tab
     * @param {string} tabName - Tab name
     */
    switchTab(tabName) {
        this.activeTab = tabName;

        // Update tab buttons
        const tabs = this.container.querySelectorAll('.dashboard-tab');
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });

        // Update panels
        const panels = this.container.querySelectorAll('.dashboard-panel');
        panels.forEach(panel => {
            const isActive = panel.id === `panel-${tabName}`;
            panel.classList.toggle('active', isActive);
        });

        // Announce to screen readers
        this.announceToScreenReader(`${this.capitalizeFirst(tabName)} tab selected`);
    }

    /**
     * Animate stat numbers on load
     */
    animateStatNumbers() {
        if (this.animatedStats) return;
        this.animatedStats = true;

        const statValues = this.container.querySelectorAll('.stat-value');

        statValues.forEach(el => {
            const target = parseInt(el.dataset.target, 10) || 0;
            this.animateNumber(el, 0, target, 1000);
        });
    }

    /**
     * Animate a number from start to end
     * @param {HTMLElement} element - Element to update
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateNumber(element, start, end, duration) {
        if (end === 0) {
            element.textContent = '0';
            return;
        }

        const startTime = performance.now();
        const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const current = Math.floor(start + (end - start) * easedProgress);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Edit profile button
        const editProfileBtn = this.container.querySelector('#editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.handleEditProfile());
        }

        // Sign in button
        const signInBtn = this.container.querySelector('#signInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.handleSignIn());
        }

        // Delegated event handling
        this.container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            this.handleAction(action, actionBtn.dataset);
        });
    }

    /**
     * Handle action button clicks
     * @param {string} action - Action name
     * @param {DOMStringMap} dataset - Button dataset
     */
    async handleAction(action, dataset) {
        switch (action) {
            case 'view':
                this.handleViewSubmission(dataset.id);
                break;
            case 'edit':
                this.handleEditSubmission(dataset.id);
                break;
            case 'delete':
                this.handleDeleteSubmission(dataset.id);
                break;
            case 'remove-favorite':
                this.handleRemoveFavorite(dataset.entityId, dataset.entityType);
                break;
            case 'view-favorite':
                this.handleViewFavorite(dataset.entityId, dataset.entityType);
                break;
            case 'edit-note':
                this.handleEditNote(dataset.noteId, dataset.assetType, dataset.assetId);
                break;
            case 'delete-note':
                this.handleDeleteNote(dataset.noteId, dataset.assetType, dataset.assetId);
                break;
            case 'paginate':
                this.handlePagination(dataset.type, parseInt(dataset.page, 10));
                break;
            case 'create-submission':
                this.handleCreateSubmission();
                break;
            case 'explore':
            case 'browse':
                this.handleNavigate('#/mythologies');
                break;
        }
    }

    /**
     * Handle edit profile
     */
    handleEditProfile() {
        if (window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate('#/profile/edit');
        }
    }

    /**
     * Handle sign in
     */
    async handleSignIn() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await this.auth.signInWithPopup(provider);
            window.location.reload();
        } catch (error) {
            console.error('[UserDashboard] Sign in error:', error);
            this.showToast('Failed to sign in: ' + error.message, 'error');
        }
    }

    /**
     * Handle view submission
     * @param {string} id - Submission ID
     */
    handleViewSubmission(id) {
        const submission = this.submissions.find(s => s.id === id);
        if (submission && window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate(`#/submission/${id}`);
        }
    }

    /**
     * Handle edit submission
     * @param {string} id - Submission ID
     */
    handleEditSubmission(id) {
        if (window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate(`#/submission/${id}/edit`);
        }
    }

    /**
     * Handle delete submission
     * @param {string} id - Submission ID
     */
    async handleDeleteSubmission(id) {
        const submission = this.submissions.find(s => s.id === id);
        if (!submission) return;

        const confirmed = confirm(`Are you sure you want to delete "${submission.entityName || 'this submission'}"?`);
        if (!confirmed) return;

        try {
            if (window.submissionWorkflow) {
                await window.submissionWorkflow.deleteSubmission(id);
            } else if (window.EyesOfAzrael?.db) {
                await window.EyesOfAzrael.db.collection('submissions').doc(id).delete();
            }

            this.submissions = this.submissions.filter(s => s.id !== id);
            this.stats.submissions = this.submissions.length;
            this.pagination.submissions.total = this.submissions.length;

            this.refreshTab('submissions');
            this.showToast('Submission deleted successfully', 'success');
        } catch (error) {
            console.error('[UserDashboard] Delete submission error:', error);
            this.showToast('Failed to delete submission: ' + error.message, 'error');
        }
    }

    /**
     * Handle remove favorite
     * @param {string} entityId - Entity ID
     * @param {string} entityType - Entity type
     */
    async handleRemoveFavorite(entityId, entityType) {
        try {
            if (window.EyesOfAzrael?.favorites) {
                await window.EyesOfAzrael.favorites.removeFavorite(entityId, entityType);
            }

            this.favorites = this.favorites.filter(f =>
                !(f.entityId === entityId && f.entityType === entityType)
            );
            this.stats.favorites = this.favorites.length;
            this.pagination.favorites.total = this.favorites.length;

            this.refreshTab('favorites');
            this.showToast('Removed from favorites', 'success');
        } catch (error) {
            console.error('[UserDashboard] Remove favorite error:', error);
            this.showToast('Failed to remove favorite: ' + error.message, 'error');
        }
    }

    /**
     * Handle view favorite
     * @param {string} entityId - Entity ID
     * @param {string} entityType - Entity type
     */
    handleViewFavorite(entityId, entityType) {
        if (window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate(`#/mythology/user/${entityType}/${entityId}`);
        }
    }

    /**
     * Handle edit note
     * @param {string} noteId - Note ID
     * @param {string} assetType - Asset type
     * @param {string} assetId - Asset ID
     */
    handleEditNote(noteId, assetType, assetId) {
        // Navigate to the entity page where the note can be edited
        if (window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate(`#/mythology/user/${assetType}/${assetId}?editNote=${noteId}`);
        }
    }

    /**
     * Handle delete note
     * @param {string} noteId - Note ID
     * @param {string} assetType - Asset type
     * @param {string} assetId - Asset ID
     */
    async handleDeleteNote(noteId, assetType, assetId) {
        const confirmed = confirm('Are you sure you want to delete this note?');
        if (!confirmed) return;

        try {
            if (window.notesService) {
                await window.notesService.deleteNote(assetType, assetId, noteId);
            }

            this.notes = this.notes.filter(n => n.id !== noteId);
            this.stats.notes = this.notes.length;
            this.pagination.notes.total = this.notes.length;

            this.refreshTab('notes');
            this.showToast('Note deleted successfully', 'success');
        } catch (error) {
            console.error('[UserDashboard] Delete note error:', error);
            this.showToast('Failed to delete note: ' + error.message, 'error');
        }
    }

    /**
     * Handle pagination
     * @param {string} type - Tab type
     * @param {number} page - Page number
     */
    handlePagination(type, page) {
        this.pagination[type].page = page;
        this.refreshTab(type);
    }

    /**
     * Handle create submission
     */
    handleCreateSubmission() {
        if (window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate('#/contribute');
        }
    }

    /**
     * Handle navigation
     * @param {string} path - Navigation path
     */
    handleNavigate(path) {
        if (window.EyesOfAzrael?.navigation) {
            window.EyesOfAzrael.navigation.navigate(path);
        } else {
            window.location.hash = path;
        }
    }

    /**
     * Refresh a specific tab
     * @param {string} tabName - Tab name
     */
    refreshTab(tabName) {
        const panel = this.container.querySelector(`#panel-${tabName}`);
        if (!panel) return;

        let content = '';
        switch (tabName) {
            case 'submissions':
                content = this.renderSubmissionsTab();
                break;
            case 'favorites':
                content = this.renderFavoritesTab();
                break;
            case 'notes':
                content = this.renderNotesTab();
                break;
        }

        panel.innerHTML = content;

        // Update tab count
        const tabBtn = this.container.querySelector(`[data-tab="${tabName}"] .tab-count`);
        if (tabBtn) {
            tabBtn.textContent = this.stats[tabName];
        }

        // Update stat card
        const statCard = this.container.querySelector(`[data-stat="${tabName}"] .stat-value`);
        if (statCard) {
            statCard.textContent = this.stats[tabName];
        }
    }

    /**
     * Initialize keyboard navigation
     */
    initializeKeyboardNavigation() {
        const tabs = this.container.querySelectorAll('.dashboard-tab');

        tabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                let targetIndex = index;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    targetIndex = (index + 1) % tabs.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    targetIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    targetIndex = 0;
                } else if (e.key === 'End') {
                    e.preventDefault();
                    targetIndex = tabs.length - 1;
                }

                if (targetIndex !== index) {
                    tabs[targetIndex].focus();
                    tabs[targetIndex].click();
                }
            });
        });
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type) {
        if (window.toast) {
            window.toast[type](message);
        } else {
            console.log(`[${type.toUpperCase()}]`, message);
        }
    }

    /**
     * Announce to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Format date for display
     * @param {Object|Date} timestamp - Firestore timestamp or Date
     * @returns {string} Formatted date
     */
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;

        return date.toLocaleDateString();
    }

    /**
     * Format member since date
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatMemberSince(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    /**
     * Truncate text
     * @param {string} text - Text to truncate
     * @param {number} length - Max length
     * @returns {string} Truncated text
     */
    truncate(text, length) {
        if (!text || text.length <= length) return text || '';
        return text.substring(0, length).trim() + '...';
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Capitalize first letter
     * @param {string} text - Text to capitalize
     * @returns {string} Capitalized text
     */
    capitalizeFirst(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
     * Get icon for entity type
     * @param {string} type - Entity type
     * @returns {string} Icon HTML or emoji
     */
    getTypeIcon(type) {
        const icons = {
            deity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            deities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            hero: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
            heroes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
            creature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c-1.5 0-2.5 1-3 2-1 0-2 1-2 2.5 0 1 .5 2 1.5 2.5-.5 1-1 2.5-1 4 0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5c0-1.5-.5-3-1-4 1-.5 1.5-1.5 1.5-2.5 0-1.5-1-2.5-2-2.5-.5-1-1.5-2-3-2z"/></svg>',
            creatures: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c-1.5 0-2.5 1-3 2-1 0-2 1-2 2.5 0 1 .5 2 1.5 2.5-.5 1-1 2.5-1 4 0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5c0-1.5-.5-3-1-4 1-.5 1.5-1.5 1.5-2.5 0-1.5-1-2.5-2-2.5-.5-1-1.5-2-3-2z"/></svg>',
            item: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            items: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            place: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
            places: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
            text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            texts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            entity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        };

        return icons[type] || icons.entity;
    }

    /**
     * Get status icon SVG
     * @param {string} status - Status name
     * @returns {string} SVG HTML
     */
    getStatusIcon(status) {
        const icons = {
            draft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            approved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            rejected: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        };

        return icons[status] || icons.draft;
    }
}

// CommonJS export for Node.js (Jest tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDashboard;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.UserDashboard = UserDashboard;
}
