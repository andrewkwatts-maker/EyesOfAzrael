/**
 * Content Filter Settings Modal
 * UI for managing content visibility preferences
 */

class FilterSettingsModal {
    constructor() {
        this.modal = null;
        this.init();
    }

    /**
     * Initialize the modal
     */
    init() {
        this.createModal();
        this.attachEventListeners();

        // Listen for filter changes to update UI
        window.addEventListener('contentFilterChanged', () => {
            if (this.modal && this.modal.style.display !== 'none') {
                this.updateUI();
            }
        });
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        const modalHTML = `
            <div id="filter-settings-modal" class="filter-modal" style="display: none;">
                <div class="filter-modal-overlay"></div>
                <div class="filter-modal-content">
                    <div class="filter-modal-header">
                        <h2>🎛️ Content Filter Settings</h2>
                        <button type="button" class="filter-modal-close" aria-label="Close">&times;</button>
                    </div>

                    <div class="filter-modal-body">
                        <!-- Filter Mode Selection -->
                        <section class="filter-section">
                            <h3>📊 Content Visibility Mode</h3>
                            <p class="filter-description">Choose what content to display throughout the site</p>

                            <div class="filter-mode-options">
                                <label class="filter-mode-card">
                                    <input type="radio" name="filter-mode" value="defaults-only">
                                    <div class="mode-card-content">
                                        <div class="mode-icon">🏛️</div>
                                        <div class="mode-label">Official Only</div>
                                        <div class="mode-description">Official Eyes of Azrael content</div>
                                    </div>
                                </label>

                                <label class="filter-mode-card">
                                    <input type="radio" name="filter-mode" value="defaults-self">
                                    <div class="mode-card-content">
                                        <div class="mode-icon">🏛️ + 👤</div>
                                        <div class="mode-label">Official + Mine</div>
                                        <div class="mode-description">Official + your submissions</div>
                                    </div>
                                </label>

                                <label class="filter-mode-card">
                                    <input type="radio" name="filter-mode" value="everyone">
                                    <div class="mode-card-content">
                                        <div class="mode-icon">🌍</div>
                                        <div class="mode-label">Everyone</div>
                                        <div class="mode-description">Full wiki experience</div>
                                    </div>
                                </label>
                            </div>
                        </section>

                        <!-- Hidden Items Management -->
                        <section class="filter-section">
                            <h3>🚫 Hidden Items</h3>
                            <p class="filter-description">Manage individually hidden users, topics, and subtopics</p>

                            <div class="hidden-items-tabs">
                                <button type="button" class="hidden-tab active" data-tab="users">
                                    Users (<span id="hidden-users-count">0</span>)
                                </button>
                                <button type="button" class="hidden-tab" data-tab="topics">
                                    Topics (<span id="hidden-topics-count">0</span>)
                                </button>
                                <button type="button" class="hidden-tab" data-tab="subtopics">
                                    Subtopics (<span id="hidden-subtopics-count">0</span>)
                                </button>
                            </div>

                            <div class="hidden-items-content">
                                <div class="hidden-items-panel active" id="hidden-users-panel">
                                    <div id="hidden-users-list" class="hidden-items-list"></div>
                                </div>
                                <div class="hidden-items-panel" id="hidden-topics-panel">
                                    <div id="hidden-topics-list" class="hidden-items-list"></div>
                                </div>
                                <div class="hidden-items-panel" id="hidden-subtopics-panel">
                                    <div id="hidden-subtopics-list" class="hidden-items-list"></div>
                                </div>
                            </div>

                            <button type="button" class="btn-clear-all" id="clear-all-hidden">
                                Clear All Hidden Items
                            </button>
                        </section>

                        <!-- Statistics -->
                        <section class="filter-section filter-stats">
                            <h3>📈 Current Settings</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <div class="stat-label">Mode</div>
                                    <div class="stat-value" id="current-mode-label">—</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">Hidden Users</div>
                                    <div class="stat-value" id="stat-hidden-users">0</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">Hidden Topics</div>
                                    <div class="stat-value" id="stat-hidden-topics">0</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">Hidden Subtopics</div>
                                    <div class="stat-value" id="stat-hidden-subtopics">0</div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div class="filter-modal-footer">
                        <button type="button" class="btn btn-secondary" id="filter-modal-cancel">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('filter-settings-modal');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        const closeBtn = this.modal.querySelector('.filter-modal-close');
        const cancelBtn = this.modal.querySelector('#filter-modal-cancel');
        const overlay = this.modal.querySelector('.filter-modal-overlay');

        [closeBtn, cancelBtn, overlay].forEach(el => {
            el.addEventListener('click', () => this.close());
        });

        // Mode selection
        this.modal.querySelectorAll('input[name="filter-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && window.contentFilter) {
                    window.contentFilter.setMode(e.target.value);
                    this.updateUI();
                }
            });
        });

        // Tab switching
        this.modal.querySelectorAll('.hidden-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Clear all hidden items
        const clearAllBtn = this.modal.querySelector('#clear-all-hidden');
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to unhide all users, topics, and subtopics?')) {
                window.contentFilter.clearAllHidden();
                this.updateUI();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.close();
            }
        });
    }

    /**
     * Switch between hidden items tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        this.modal.querySelectorAll('.hidden-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        this.modal.querySelectorAll('.hidden-items-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `hidden-${tabName}-panel`);
        });
    }

    /**
     * Update the UI with current settings
     */
    updateUI() {
        if (!window.contentFilter) return;

        const mode = window.contentFilter.getMode();
        const stats = window.contentFilter.getStats();

        // Update mode radio buttons
        this.modal.querySelectorAll('input[name="filter-mode"]').forEach(radio => {
            radio.checked = radio.value === mode;
        });

        // Update stats
        document.getElementById('current-mode-label').textContent =
            window.contentFilter.getModeLabel(mode);
        document.getElementById('stat-hidden-users').textContent = stats.hiddenUsersCount;
        document.getElementById('stat-hidden-topics').textContent = stats.hiddenTopicsCount;
        document.getElementById('stat-hidden-subtopics').textContent = stats.hiddenSubtopicsCount;

        // Update tab counts
        document.getElementById('hidden-users-count').textContent = stats.hiddenUsersCount;
        document.getElementById('hidden-topics-count').textContent = stats.hiddenTopicsCount;
        document.getElementById('hidden-subtopics-count').textContent = stats.hiddenSubtopicsCount;

        // Update hidden lists
        this.updateHiddenUsersList();
        this.updateHiddenTopicsList();
        this.updateHiddenSubtopicsList();
    }

    /**
     * Update hidden users list
     */
    updateHiddenUsersList() {
        const container = document.getElementById('hidden-users-list');
        const hiddenUsers = window.contentFilter.getHiddenUsers();

        if (hiddenUsers.length === 0) {
            container.innerHTML = '<p class="empty-state">No hidden users</p>';
            return;
        }

        container.innerHTML = hiddenUsers.map(userId => `
            <div class="hidden-item">
                <span class="hidden-item-name">${this.escapeHtml(userId)}</span>
                <button type="button"
                        class="btn-unhide"
                        data-type="user"
                        data-id="${this.escapeHtml(userId)}">
                    Unhide
                </button>
            </div>
        `).join('');

        // Attach unhide handlers
        container.querySelectorAll('.btn-unhide').forEach(btn => {
            btn.addEventListener('click', () => {
                window.contentFilter.unhideUser(btn.dataset.id);
                this.updateUI();
            });
        });
    }

    /**
     * Update hidden topics list
     */
    updateHiddenTopicsList() {
        const container = document.getElementById('hidden-topics-list');
        const hiddenTopics = window.contentFilter.getHiddenTopics();

        if (hiddenTopics.length === 0) {
            container.innerHTML = '<p class="empty-state">No hidden topics</p>';
            return;
        }

        container.innerHTML = hiddenTopics.map(topicId => `
            <div class="hidden-item">
                <span class="hidden-item-name">${this.escapeHtml(topicId)}</span>
                <button type="button"
                        class="btn-unhide"
                        data-type="topic"
                        data-id="${this.escapeHtml(topicId)}">
                    Unhide
                </button>
            </div>
        `).join('');

        // Attach unhide handlers
        container.querySelectorAll('.btn-unhide').forEach(btn => {
            btn.addEventListener('click', () => {
                window.contentFilter.unhideTopic(btn.dataset.id);
                this.updateUI();
            });
        });
    }

    /**
     * Update hidden subtopics list
     */
    updateHiddenSubtopicsList() {
        const container = document.getElementById('hidden-subtopics-list');
        const hiddenSubtopics = window.contentFilter.getHiddenSubtopics();

        if (hiddenSubtopics.length === 0) {
            container.innerHTML = '<p class="empty-state">No hidden subtopics</p>';
            return;
        }

        container.innerHTML = hiddenSubtopics.map(subtopicId => `
            <div class="hidden-item">
                <span class="hidden-item-name">${this.escapeHtml(subtopicId)}</span>
                <button type="button"
                        class="btn-unhide"
                        data-type="subtopic"
                        data-id="${this.escapeHtml(subtopicId)}">
                    Unhide
                </button>
            </div>
        `).join('');

        // Attach unhide handlers
        container.querySelectorAll('.btn-unhide').forEach(btn => {
            btn.addEventListener('click', () => {
                window.contentFilter.unhideSubtopic(btn.dataset.id);
                this.updateUI();
            });
        });
    }

    /**
     * Open the modal
     */
    open() {
        this.updateUI();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the modal
     */
    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.filterSettingsModal = new FilterSettingsModal();
    });
} else {
    window.filterSettingsModal = new FilterSettingsModal();
}
