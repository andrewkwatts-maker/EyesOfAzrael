/**
 * User Dashboard Component
 * Displays user's created entities with CRUD operations
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

        return `
            <div class="user-dashboard">
                <div class="dashboard-header">
                    <div class="dashboard-user-info">
                        <img src="${user.photoURL || 'https://via.placeholder.com/80'}" alt="${user.displayName}" class="dashboard-avatar">
                        <div>
                            <h1>My Contributions</h1>
                            <p class="dashboard-user-name">${user.displayName || user.email}</p>
                        </div>
                    </div>

                    <div class="dashboard-stats">
                        ${this.renderStats()}
                    </div>
                </div>

                <div class="dashboard-controls">
                    <div class="dashboard-filters">
                        <select id="collectionFilter" class="filter-select">
                            <option value="all">All Types</option>
                            <option value="deities">Deities</option>
                            <option value="creatures">Creatures</option>
                            <option value="heroes">Heroes</option>
                            <option value="items">Items</option>
                            <option value="places">Places</option>
                            <option value="herbs">Herbs</option>
                            <option value="rituals">Rituals</option>
                            <option value="symbols">Symbols</option>
                            <option value="concepts">Concepts</option>
                            <option value="texts">Texts</option>
                        </select>

                        <select id="statusFilter" class="filter-select">
                            <option value="active">Active</option>
                            <option value="deleted">Deleted</option>
                            <option value="all">All Status</option>
                        </select>

                        <input
                            type="search"
                            id="searchInput"
                            placeholder="Search your entities..."
                            class="search-input"
                        />
                    </div>

                    <button id="createNewBtn" class="btn-primary">
                        <span>+ Create New Entity</span>
                    </button>
                </div>

                <div id="entitiesList" class="entities-list">
                    ${this.renderEntitiesList()}
                </div>

                <div id="formContainer"></div>
            </div>
        `;
    }

    /**
     * Render not authenticated state
     * @returns {string} HTML string
     */
    renderNotAuthenticated() {
        return `
            <div class="empty-container">
                <div class="empty-icon">🔒</div>
                <h2>Authentication Required</h2>
                <p class="empty-message">Please sign in to manage your entities</p>
                <button id="signInBtn" class="btn-primary">Sign In with Google</button>
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
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Entities</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.active}</div>
                <div class="stat-label">Active</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.mythologies}</div>
                <div class="stat-label">Mythologies</div>
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

        return {
            total: this.entities.length,
            active,
            mythologies
        };
    }

    /**
     * Render entities list
     * @returns {string} HTML string
     */
    renderEntitiesList() {
        const filteredEntities = this.filterEntities();

        if (filteredEntities.length === 0) {
            return `
                <div class="empty-state">
                    <p>No entities found matching your filters.</p>
                    <button class="btn-secondary" onclick="this.closest('.user-dashboard').querySelector('#createNewBtn').click()">
                        Create Your First Entity
                    </button>
                </div>
            `;
        }

        return `
            <div class="entity-grid">
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
            <div class="entity-panel ${isDeleted ? 'deleted' : ''}" data-mythology="${entity.mythology || 'unknown'}">
                ${isDeleted ? '<div class="deleted-badge">Deleted</div>' : ''}

                <div class="entity-icon">${entity.icon || '📄'}</div>

                <h3 class="entity-name">${entity.name || 'Untitled'}</h3>

                <div class="entity-meta">
                    <span class="entity-tag">${entity.mythology || 'Unknown'}</span>
                    <span class="entity-tag">${entity.type || 'Unknown'}</span>
                </div>

                ${entity.description ? `
                    <p class="entity-description">${this.truncate(entity.description, 120)}</p>
                ` : ''}

                <div class="entity-dates">
                    <small>Created: ${this.formatDate(entity.createdAt)}</small>
                    ${entity.updatedAt ? `<small>Updated: ${this.formatDate(entity.updatedAt)}</small>` : ''}
                </div>

                <div class="panel-actions">
                    <button class="panel-action-btn" data-action="view" data-collection="${entity.collection}" data-id="${entity.id}">
                        👁️ View
                    </button>
                    <button class="panel-action-btn" data-action="edit" data-collection="${entity.collection}" data-id="${entity.id}">
                        ✏️ Edit
                    </button>
                    ${isDeleted ? `
                        <button class="panel-action-btn" data-action="restore" data-collection="${entity.collection}" data-id="${entity.id}">
                            ♻️ Restore
                        </button>
                    ` : `
                        <button class="panel-action-btn danger" data-action="delete" data-collection="${entity.collection}" data-id="${entity.id}">
                            🗑️ Delete
                        </button>
                    `}
                </div>
            </div>
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

        // Search input
        const searchInput = container.querySelector('#searchInput');
        if (searchInput) {
            searchInput.value = this.filter.search;
            searchInput.addEventListener('input', (e) => {
                this.filter.search = e.target.value;
                this.refresh();
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
    }

    /**
     * Refresh the entities list
     */
    async refresh() {
        const listContainer = this.container.querySelector('#entitiesList');
        if (!listContainer) return;

        listContainer.innerHTML = '<div class="loading">Loading...</div>';

        await this.loadUserEntities();

        listContainer.innerHTML = this.renderEntitiesList();
    }

    /**
     * Handle create new entity
     */
    async handleCreateNew() {
        // Show collection selector first
        const collection = prompt(
            'Select entity type:\n\n' +
            '1. Deity\n2. Creature\n3. Hero\n4. Item\n5. Place\n' +
            '6. Herb\n7. Ritual\n8. Symbol\n9. Concept\n10. Text\n\n' +
            'Enter number (1-10):'
        );

        const collectionMap = {
            '1': 'deities',
            '2': 'creatures',
            '3': 'heroes',
            '4': 'items',
            '5': 'places',
            '6': 'herbs',
            '7': 'rituals',
            '8': 'symbols',
            '9': 'concepts',
            '10': 'texts'
        };

        const selectedCollection = collectionMap[collection];
        if (!selectedCollection) return;

        this.showForm(selectedCollection);
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
            alert('Failed to sign in: ' + error.message);
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
                this.showToast(entityId ? 'Entity updated!' : 'Entity created!', 'success');
                await this.refresh();
            },
            onCancel: () => {
                formContainer.innerHTML = '';
            }
        });

        form.render().then(html => {
            formContainer.innerHTML = `<div class="form-overlay">${html}</div>`;
            const formElement = formContainer.querySelector('.entity-form-container');
            form.initialize(formElement);
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDashboard;
}
