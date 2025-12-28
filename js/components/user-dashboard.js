/**
 * User Dashboard Component
 * Displays user's created entities with CRUD operations
 * Modern, polished UI with accessibility features
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
        this.entities = [];
        this.filter = {
            collection: 'all',
            status: 'active',
            search: ''
        };
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

        // Load user's entities from all collections
        await this.loadUserEntities();

        const avatarUrl = user.photoURL || this.getDefaultAvatar();

        return `
            <div class="user-dashboard" role="main">
                <!-- Header Section -->
                <div class="dashboard-header glass-card">
                    <div class="dashboard-user-info">
                        <img
                            src="${avatarUrl}"
                            alt="${user.displayName || user.email} avatar"
                            class="dashboard-avatar"
                            role="img"
                        />
                        <div class="user-details">
                            <h1 class="dashboard-title">My Contributions</h1>
                            <p class="dashboard-user-name">${user.displayName || user.email}</p>
                            <p class="dashboard-user-email">${user.email}</p>
                        </div>
                    </div>

                    <div class="dashboard-quick-actions">
                        <button
                            id="createNewBtn"
                            class="btn btn-primary"
                            aria-label="Create new entity"
                        >
                            <span class="btn-icon">✨</span>
                            <span>Create New</span>
                        </button>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="dashboard-stats" role="region" aria-label="Statistics">
                    ${this.renderStats()}
                </div>

                <!-- Recent Activity Timeline -->
                <div class="dashboard-section glass-card">
                    <h2 class="section-title">
                        <span class="section-icon">📊</span>
                        Recent Activity
                    </h2>
                    <div id="activityTimeline" class="activity-timeline">
                        ${this.renderRecentActivity()}
                    </div>
                </div>

                <!-- Filters and Controls -->
                <div class="dashboard-section glass-card">
                    <div class="dashboard-controls">
                        <div class="dashboard-filters" role="search">
                            <label for="collectionFilter" class="filter-label sr-only">Filter by type</label>
                            <select
                                id="collectionFilter"
                                class="filter-select"
                                aria-label="Filter by entity type"
                            >
                                <option value="all">All Types</option>
                                <option value="deities">🏛️ Deities</option>
                                <option value="creatures">🐉 Creatures</option>
                                <option value="heroes">⚔️ Heroes</option>
                                <option value="items">⚡ Items</option>
                                <option value="places">🗺️ Places</option>
                                <option value="herbs">🌿 Herbs</option>
                                <option value="rituals">🕯️ Rituals</option>
                                <option value="symbols">✨ Symbols</option>
                                <option value="concepts">💭 Concepts</option>
                                <option value="texts">📜 Texts</option>
                            </select>

                            <label for="statusFilter" class="filter-label sr-only">Filter by status</label>
                            <select
                                id="statusFilter"
                                class="filter-select"
                                aria-label="Filter by status"
                            >
                                <option value="active">✅ Active</option>
                                <option value="deleted">🗑️ Deleted</option>
                                <option value="all">All Status</option>
                            </select>

                            <label for="searchInput" class="filter-label sr-only">Search entities</label>
                            <div class="search-input-wrapper">
                                <input
                                    type="search"
                                    id="searchInput"
                                    placeholder="🔍 Search your entities..."
                                    class="search-input"
                                    aria-label="Search entities"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Entities Grid -->
                    <div id="entitiesList" class="entities-list" role="region" aria-live="polite">
                        ${this.renderEntitiesList()}
                    </div>
                </div>

                <!-- Form Container (Modal) -->
                <div id="formContainer" role="dialog" aria-modal="true" aria-hidden="true"></div>
            </div>
        `;
    }

    /**
     * Render not authenticated state
     * @returns {string} HTML string
     */
    renderNotAuthenticated() {
        return `
            <div class="empty-container glass-card" role="alert">
                <div class="empty-icon" aria-hidden="true">🔒</div>
                <h2>Authentication Required</h2>
                <p class="empty-message">Please sign in to manage your entities</p>
                <button
                    id="signInBtn"
                    class="btn btn-primary"
                    aria-label="Sign in with Google"
                >
                    <span class="btn-icon">🔑</span>
                    <span>Sign In with Google</span>
                </button>
            </div>
        `;
    }

    /**
     * Render dashboard stats
     * @returns {string} HTML string
     */
    renderStats() {
        const stats = this.calculateStats();

        return `
            <div class="stat-card glass-card" role="article">
                <div class="stat-icon" aria-hidden="true">📚</div>
                <div class="stat-value" aria-label="Total entities">${stats.total}</div>
                <div class="stat-label">Total Entities</div>
            </div>
            <div class="stat-card glass-card" role="article">
                <div class="stat-icon" aria-hidden="true">✅</div>
                <div class="stat-value" aria-label="Active entities">${stats.active}</div>
                <div class="stat-label">Active</div>
            </div>
            <div class="stat-card glass-card" role="article">
                <div class="stat-icon" aria-hidden="true">🌍</div>
                <div class="stat-value" aria-label="Mythologies covered">${stats.mythologies}</div>
                <div class="stat-label">Mythologies</div>
            </div>
            <div class="stat-card glass-card" role="article">
                <div class="stat-icon" aria-hidden="true">📅</div>
                <div class="stat-value" aria-label="Days active">${stats.daysActive}</div>
                <div class="stat-label">Days Active</div>
            </div>
        `;
    }

    /**
     * Calculate statistics
     * @returns {Object} Statistics
     */
    calculateStats() {
        const active = this.entities.filter(e => e.status === 'active').length;
        const mythologies = new Set(this.entities.map(e => e.mythology)).size;

        // Calculate days active
        const oldestEntity = this.entities.reduce((oldest, entity) => {
            const date = entity.createdAt?.toDate?.() || new Date();
            return !oldest || date < oldest ? date : oldest;
        }, null);

        const daysActive = oldestEntity
            ? Math.floor((new Date() - oldestEntity) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            total: this.entities.length,
            active,
            mythologies,
            daysActive
        };
    }

    /**
     * Render recent activity timeline
     * @returns {string} HTML string
     */
    renderRecentActivity() {
        const recentEntities = this.entities
            .sort((a, b) => {
                const dateA = a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            })
            .slice(0, 5);

        if (recentEntities.length === 0) {
            return `
                <div class="empty-state">
                    <p>No recent activity</p>
                </div>
            `;
        }

        return recentEntities.map(entity => {
            const date = entity.updatedAt?.toDate?.() || entity.createdAt?.toDate?.() || new Date();
            const action = entity.updatedAt ? 'Updated' : 'Created';

            return `
                <div class="activity-item">
                    <div class="activity-icon">${entity.icon || '📄'}</div>
                    <div class="activity-content">
                        <div class="activity-title">${action}: ${entity.name || 'Untitled'}</div>
                        <div class="activity-meta">
                            <span class="activity-type">${entity.collection || 'Unknown'}</span>
                            <span class="activity-time">${this.formatDate(date)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render entities list
     * @returns {string} HTML string
     */
    renderEntitiesList() {
        const filteredEntities = this.filterEntities();

        if (filteredEntities.length === 0) {
            return `
                <div class="empty-state" role="status">
                    <div class="empty-icon" aria-hidden="true">📭</div>
                    <p>No entities found matching your filters.</p>
                    <button
                        class="btn btn-primary"
                        onclick="this.closest('.user-dashboard').querySelector('#createNewBtn').click()"
                        aria-label="Create your first entity"
                    >
                        Create Your First Entity
                    </button>
                </div>
            `;
        }

        return `
            <div class="entity-grid" role="list">
                ${filteredEntities.map(entity => this.renderEntityCard(entity)).join('')}
            </div>
        `;
    }

    /**
     * Render a single entity card
     * @param {Object} entity - Entity data
     * @returns {string} HTML string
     */
    renderEntityCard(entity) {
        const isDeleted = entity.status === 'deleted';

        return `
            <article
                class="entity-panel glass-card ${isDeleted ? 'deleted' : ''}"
                data-mythology="${entity.mythology || 'unknown'}"
                role="listitem"
                tabindex="0"
            >
                ${isDeleted ? '<div class="deleted-badge" role="status">Deleted</div>' : ''}

                <div class="entity-icon" aria-hidden="true">${entity.icon || '📄'}</div>

                <h3 class="entity-name">${entity.name || 'Untitled'}</h3>

                <div class="entity-meta" role="group">
                    <span class="entity-tag" aria-label="Mythology">${entity.mythology || 'Unknown'}</span>
                    <span class="entity-tag" aria-label="Type">${entity.type || 'Unknown'}</span>
                </div>

                ${entity.description ? `
                    <p class="entity-description">${this.truncate(entity.description, 120)}</p>
                ` : ''}

                <div class="entity-dates">
                    <small>Created: <time datetime="${entity.createdAt?.toDate?.()?.toISOString?.()}">${this.formatDate(entity.createdAt)}</time></small>
                    ${entity.updatedAt ? `<small>Updated: <time datetime="${entity.updatedAt?.toDate?.()?.toISOString?.()}">${this.formatDate(entity.updatedAt)}</time></small>` : ''}
                </div>

                <div class="panel-actions" role="group" aria-label="Entity actions">
                    <button
                        class="panel-action-btn"
                        data-action="view"
                        data-collection="${entity.collection}"
                        data-id="${entity.id}"
                        aria-label="View ${entity.name}"
                    >
                        <span aria-hidden="true">👁️</span> View
                    </button>
                    <button
                        class="panel-action-btn"
                        data-action="edit"
                        data-collection="${entity.collection}"
                        data-id="${entity.id}"
                        aria-label="Edit ${entity.name}"
                    >
                        <span aria-hidden="true">✏️</span> Edit
                    </button>
                    ${isDeleted ? `
                        <button
                            class="panel-action-btn"
                            data-action="restore"
                            data-collection="${entity.collection}"
                            data-id="${entity.id}"
                            aria-label="Restore ${entity.name}"
                        >
                            <span aria-hidden="true">♻️</span> Restore
                        </button>
                    ` : `
                        <button
                            class="panel-action-btn danger"
                            data-action="delete"
                            data-collection="${entity.collection}"
                            data-id="${entity.id}"
                            aria-label="Delete ${entity.name}"
                        >
                            <span aria-hidden="true">🗑️</span> Delete
                        </button>
                    `}
                </div>
            </article>
        `;
    }

    /**
     * Load user's entities from all collections
     */
    async loadUserEntities() {
        const collections = [
            'deities', 'creatures', 'heroes', 'items', 'places',
            'herbs', 'rituals', 'symbols', 'concepts', 'texts', 'events'
        ];

        this.entities = [];

        for (const collection of collections) {
            const result = await this.crudManager.getUserEntities(collection);

            if (result.success && result.data) {
                result.data.forEach(entity => {
                    this.entities.push({
                        ...entity,
                        collection
                    });
                });
            }
        }

        // Sort by created date (newest first)
        this.entities.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
    }

    /**
     * Filter entities based on current filters
     * @returns {Array} Filtered entities
     */
    filterEntities() {
        return this.entities.filter(entity => {
            // Collection filter
            if (this.filter.collection !== 'all' && entity.collection !== this.filter.collection) {
                return false;
            }

            // Status filter
            if (this.filter.status !== 'all' && entity.status !== this.filter.status) {
                return false;
            }

            // Search filter
            if (this.filter.search) {
                const searchLower = this.filter.search.toLowerCase();
                const searchableText = `${entity.name} ${entity.description} ${entity.mythology} ${entity.type}`.toLowerCase();

                if (!searchableText.includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Initialize dashboard after rendering to DOM
     * @param {HTMLElement} container - Container element
     */
    initialize(container) {
        this.container = container;

        // Collection filter
        const collectionFilter = container.querySelector('#collectionFilter');
        if (collectionFilter) {
            collectionFilter.value = this.filter.collection;
            collectionFilter.addEventListener('change', (e) => {
                this.filter.collection = e.target.value;
                this.refresh();
            });
        }

        // Status filter
        const statusFilter = container.querySelector('#statusFilter');
        if (statusFilter) {
            statusFilter.value = this.filter.status;
            statusFilter.addEventListener('change', (e) => {
                this.filter.status = e.target.value;
                this.refresh();
            });
        }

        // Search input with debounce
        const searchInput = container.querySelector('#searchInput');
        if (searchInput) {
            searchInput.value = this.filter.search;
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filter.search = e.target.value;
                    this.refresh();
                }, 300);
            });
        }

        // Create new button
        const createNewBtn = container.querySelector('#createNewBtn');
        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => this.handleCreateNew());
        }

        // Sign in button
        const signInBtn = container.querySelector('#signInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.handleSignIn());
        }

        // Entity action buttons
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const collection = btn.dataset.collection;
            const id = btn.dataset.id;

            switch (action) {
                case 'view':
                    this.handleView(collection, id);
                    break;
                case 'edit':
                    this.handleEdit(collection, id);
                    break;
                case 'delete':
                    this.handleDelete(collection, id);
                    break;
                case 'restore':
                    this.handleRestore(collection, id);
                    break;
            }
        });

        // Keyboard navigation for entity cards
        this.initializeKeyboardNavigation();
    }

    /**
     * Initialize keyboard navigation
     */
    initializeKeyboardNavigation() {
        const entityCards = this.container.querySelectorAll('.entity-panel');

        entityCards.forEach((card, index) => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Activate first action button
                    const firstBtn = card.querySelector('.panel-action-btn');
                    if (firstBtn) firstBtn.click();
                }

                // Arrow key navigation
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = entityCards[index + 1];
                    if (next) next.focus();
                }

                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = entityCards[index - 1];
                    if (prev) prev.focus();
                }
            });
        });
    }

    /**
     * Refresh the entities list
     */
    async refresh() {
        const listContainer = this.container.querySelector('#entitiesList');
        if (!listContainer) return;

        listContainer.innerHTML = '<div class="loading" role="status"><div class="loading-spinner" aria-hidden="true">⏳</div><p>Loading...</p></div>';

        await this.loadUserEntities();

        listContainer.innerHTML = this.renderEntitiesList();

        // Re-initialize keyboard navigation
        this.initializeKeyboardNavigation();

        // Announce to screen readers
        const count = this.filterEntities().length;
        this.announceToScreenReader(`${count} entities found`);
    }

    /**
     * Handle create new entity
     */
    async handleCreateNew() {
        // Show collection selector modal with better UI
        const collections = [
            { value: 'deities', label: '🏛️ Deity', description: 'Gods and divine beings' },
            { value: 'creatures', label: '🐉 Creature', description: 'Mythical beasts and monsters' },
            { value: 'heroes', label: '⚔️ Hero', description: 'Legendary figures and champions' },
            { value: 'items', label: '⚡ Item', description: 'Magical artifacts and objects' },
            { value: 'places', label: '🗺️ Place', description: 'Sacred sites and realms' },
            { value: 'herbs', label: '🌿 Herb', description: 'Sacred plants and medicines' },
            { value: 'rituals', label: '🕯️ Ritual', description: 'Ceremonies and practices' },
            { value: 'symbols', label: '✨ Symbol', description: 'Sacred symbols and signs' },
            { value: 'concepts', label: '💭 Concept', description: 'Philosophical ideas' },
            { value: 'texts', label: '📜 Text', description: 'Sacred writings' }
        ];

        const modalHTML = `
            <div class="collection-selector-modal" role="dialog" aria-labelledby="modal-title">
                <div class="modal-content glass-card">
                    <h2 id="modal-title">Select Entity Type</h2>
                    <div class="collection-grid">
                        ${collections.map(col => `
                            <button
                                class="collection-option glass-card"
                                data-collection="${col.value}"
                                aria-label="${col.label} - ${col.description}"
                            >
                                <div class="collection-label">${col.label}</div>
                                <div class="collection-description">${col.description}</div>
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary modal-cancel" aria-label="Cancel">Cancel</button>
                </div>
            </div>
        `;

        const formContainer = this.container.querySelector('#formContainer');
        formContainer.innerHTML = modalHTML;
        formContainer.setAttribute('aria-hidden', 'false');

        // Focus first option
        setTimeout(() => {
            formContainer.querySelector('.collection-option')?.focus();
        }, 100);

        // Handle selection
        formContainer.querySelectorAll('.collection-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const collection = btn.dataset.collection;
                formContainer.innerHTML = '';
                formContainer.setAttribute('aria-hidden', 'true');
                this.showForm(collection);
            });
        });

        formContainer.querySelector('.modal-cancel')?.addEventListener('click', () => {
            formContainer.innerHTML = '';
            formContainer.setAttribute('aria-hidden', 'true');
        });
    }

    /**
     * Handle sign in
     */
    async handleSignIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.auth.signInWithPopup(provider);
            window.location.reload();
        } catch (error) {
            console.error('[Dashboard] Sign in error:', error);
            this.showToast('Failed to sign in: ' + error.message, 'error');
        }
    }

    /**
     * Handle view entity
     * @param {string} collection - Collection name
     * @param {string} id - Entity ID
     */
    handleView(collection, id) {
        // Navigate to entity detail page
        if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
            const categoryType = collection.slice(0, -1); // Remove 's' from plural
            window.EyesOfAzrael.navigation.navigate(`#/mythology/user/${categoryType}/${id}`);
        }
    }

    /**
     * Handle edit entity
     * @param {string} collection - Collection name
     * @param {string} id - Entity ID
     */
    handleEdit(collection, id) {
        this.showForm(collection, id);
    }

    /**
     * Handle delete entity
     * @param {string} collection - Collection name
     * @param {string} id - Entity ID
     */
    async handleDelete(collection, id) {
        if (!confirm('Are you sure you want to delete this entity? You can restore it later.')) {
            return;
        }

        const result = await this.crudManager.delete(collection, id, false);

        if (result.success) {
            this.showToast('Entity deleted successfully', 'success');
            await this.refresh();
        } else {
            this.showToast(`Failed to delete: ${result.error}`, 'error');
        }
    }

    /**
     * Handle restore entity
     * @param {string} collection - Collection name
     * @param {string} id - Entity ID
     */
    async handleRestore(collection, id) {
        const result = await this.crudManager.restore(collection, id);

        if (result.success) {
            this.showToast('Entity restored successfully', 'success');
            await this.refresh();
        } else {
            this.showToast(`Failed to restore: ${result.error}`, 'error');
        }
    }

    /**
     * Show entity form
     * @param {string} collection - Collection name
     * @param {string} [entityId] - Entity ID (for editing)
     */
    showForm(collection, entityId = null) {
        const formContainer = this.container.querySelector('#formContainer');

        const form = new EntityForm({
            crudManager: this.crudManager,
            collection,
            entityId,
            onSuccess: async () => {
                formContainer.innerHTML = '';
                formContainer.setAttribute('aria-hidden', 'true');
                this.showToast(entityId ? 'Entity updated!' : 'Entity created!', 'success');
                await this.refresh();
            },
            onCancel: () => {
                formContainer.innerHTML = '';
                formContainer.setAttribute('aria-hidden', 'true');
            }
        });

        form.render().then(html => {
            formContainer.innerHTML = `<div class="form-overlay">${html}</div>`;
            formContainer.setAttribute('aria-hidden', 'false');
            const formElement = formContainer.querySelector('.entity-form-container');
            form.initialize(formElement);

            // Focus first input
            setTimeout(() => {
                formElement.querySelector('input, textarea, select')?.focus();
            }, 100);
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
            alert(message);
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

    /**
     * Utility: Format date
     * @param {firebase.firestore.Timestamp|Date} timestamp - Timestamp
     * @returns {string} Formatted date
     */
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
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
     * Utility: Truncate text
     * @param {string} text - Text to truncate
     * @param {number} length - Max length
     * @returns {string} Truncated text
     */
    truncate(text, length) {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + '...';
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
