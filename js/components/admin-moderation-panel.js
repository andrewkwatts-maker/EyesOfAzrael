/**
 * Admin Moderation Panel Component
 * Provides UI for admin users to manage content moderation:
 * - Ban/unban users
 * - View and resolve flagged content
 * - View moderation history
 *
 * This component integrates with the header user menu as an extended menu option.
 */

class AdminModerationPanel {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.activeTab = 'users'; // 'users', 'flags', 'history'
        this.moderationService = window.moderationService;
        this.data = {
            bannedUsers: [],
            flags: [],
            history: [],
            stats: null
        };
    }

    /**
     * Initialize the moderation panel
     * @returns {Promise<boolean>}
     */
    async init() {
        // Ensure moderation service is available
        if (!this.moderationService) {
            console.error('[AdminModerationPanel] Moderation service not available');
            return false;
        }

        // Listen for admin status changes
        window.addEventListener('adminStatusChanged', (e) => {
            if (e.detail.isAdmin) {
                this.showAdminMenuOption();
                this.showExtendedMenuAdminSection();
            } else {
                this.hideAdminMenuOption();
                this.hideExtendedMenuAdminSection();
                this.hide();
            }
        });

        // Check initial admin status
        const isAdmin = await this.moderationService.getAdminStatus();
        if (isAdmin) {
            this.showAdminMenuOption();
            this.showExtendedMenuAdminSection();
        }

        // Set up extended menu button handlers
        this.setupExtendedMenuHandlers();

        console.log('[AdminModerationPanel] Initialized');
        return true;
    }

    /**
     * Show the admin tools section in the extended menu
     */
    showExtendedMenuAdminSection() {
        const adminSection = document.getElementById('adminToolsSection');
        if (adminSection) {
            adminSection.style.display = 'block';
        }
    }

    /**
     * Hide the admin tools section in the extended menu
     */
    hideExtendedMenuAdminSection() {
        const adminSection = document.getElementById('adminToolsSection');
        if (adminSection) {
            adminSection.style.display = 'none';
        }
    }

    /**
     * Set up event handlers for extended menu admin buttons
     */
    setupExtendedMenuHandlers() {
        // Open moderation panel button
        const openBtn = document.getElementById('openModerationPanel');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.activeTab = 'users';
                this.show();
            });
        }

        // View banned users
        const bannedBtn = document.getElementById('viewBannedUsers');
        if (bannedBtn) {
            bannedBtn.addEventListener('click', () => {
                this.activeTab = 'users';
                this.show();
            });
        }

        // View flagged content
        const flaggedBtn = document.getElementById('viewFlaggedContent');
        if (flaggedBtn) {
            flaggedBtn.addEventListener('click', () => {
                this.activeTab = 'flags';
                this.show();
            });
        }

        // View moderation history
        const historyBtn = document.getElementById('viewModerationHistory');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.activeTab = 'history';
                this.show();
            });
        }
    }

    /**
     * Show the admin menu option in the header
     */
    showAdminMenuOption() {
        // Check if admin menu option already exists
        if (document.getElementById('adminModerationBtn')) return;

        // Find the user info container in header
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) {
            // Try adding to header actions instead
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                this.injectAdminButton(headerActions);
            }
            return;
        }

        this.injectAdminButton(userInfo);
    }

    /**
     * Inject the admin moderation button
     * @param {HTMLElement} container
     */
    injectAdminButton(container) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminModerationBtn';
        adminBtn.className = 'admin-moderation-btn';
        adminBtn.setAttribute('aria-label', 'Admin Moderation Panel');
        adminBtn.setAttribute('title', 'Admin Moderation');
        adminBtn.innerHTML = '<span class="admin-icon">&#9881;</span><span class="admin-label">Admin</span>';
        adminBtn.addEventListener('click', () => this.toggle());

        // Insert before sign out button if present
        const signOutBtn = container.querySelector('#signOutBtn');
        if (signOutBtn) {
            container.insertBefore(adminBtn, signOutBtn);
        } else {
            container.appendChild(adminBtn);
        }
    }

    /**
     * Hide the admin menu option
     */
    hideAdminMenuOption() {
        const adminBtn = document.getElementById('adminModerationBtn');
        if (adminBtn) {
            adminBtn.remove();
        }
    }

    /**
     * Toggle panel visibility
     */
    async toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            await this.show();
        }
    }

    /**
     * Show the moderation panel
     */
    async show() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.createContainer();
        }

        // Load data
        await this.loadData();

        // Render content
        this.render();

        // Show panel
        this.container.classList.add('visible');
        this.isVisible = true;

        // Close on escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') this.hide();
        };
        document.addEventListener('keydown', this.escapeHandler);

        // Close on outside click
        this.outsideClickHandler = (e) => {
            if (this.container && !this.container.contains(e.target) &&
                !e.target.closest('#adminModerationBtn')) {
                this.hide();
            }
        };
        setTimeout(() => {
            document.addEventListener('click', this.outsideClickHandler);
        }, 100);
    }

    /**
     * Hide the moderation panel
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('visible');
        }
        this.isVisible = false;

        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
        }
    }

    /**
     * Create the panel container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'adminModerationPanel';
        this.container.className = 'admin-moderation-panel';
        this.container.setAttribute('role', 'dialog');
        this.container.setAttribute('aria-labelledby', 'moderation-panel-title');
        document.body.appendChild(this.container);
    }

    /**
     * Load moderation data
     */
    async loadData() {
        const [bannedUsers, flags, history, stats] = await Promise.all([
            this.moderationService.getBannedUsers(),
            this.moderationService.getFlags('pending'),
            this.moderationService.getModerationHistory(20),
            this.moderationService.getModerationStats()
        ]);

        this.data = { bannedUsers, flags, history, stats };
    }

    /**
     * Render the panel content
     */
    render() {
        const stats = this.data.stats || { activeBans: 0, pendingFlags: 0, resolvedFlags: 0 };

        this.container.innerHTML = `
            <div class="moderation-panel-header">
                <h2 id="moderation-panel-title">Admin Moderation</h2>
                <button class="moderation-close-btn" aria-label="Close panel">&times;</button>
            </div>

            <div class="moderation-stats">
                <div class="mod-stat">
                    <span class="mod-stat-value">${stats.activeBans}</span>
                    <span class="mod-stat-label">Active Bans</span>
                </div>
                <div class="mod-stat">
                    <span class="mod-stat-value">${stats.pendingFlags}</span>
                    <span class="mod-stat-label">Pending Flags</span>
                </div>
                <div class="mod-stat">
                    <span class="mod-stat-value">${stats.resolvedFlags}</span>
                    <span class="mod-stat-label">Resolved</span>
                </div>
            </div>

            <div class="moderation-tabs" role="tablist">
                <button class="mod-tab ${this.activeTab === 'users' ? 'active' : ''}"
                        role="tab"
                        aria-selected="${this.activeTab === 'users'}"
                        data-tab="users">
                    Banned Users
                </button>
                <button class="mod-tab ${this.activeTab === 'flags' ? 'active' : ''}"
                        role="tab"
                        aria-selected="${this.activeTab === 'flags'}"
                        data-tab="flags">
                    Flagged Content
                </button>
                <button class="mod-tab ${this.activeTab === 'history' ? 'active' : ''}"
                        role="tab"
                        aria-selected="${this.activeTab === 'history'}"
                        data-tab="history">
                    History
                </button>
            </div>

            <div class="moderation-content" role="tabpanel">
                ${this.renderTabContent()}
            </div>

            <div class="moderation-actions">
                <button class="mod-action-btn primary" id="banUserBtn">
                    <span>&#128683;</span> Ban User
                </button>
                <button class="mod-action-btn" id="flagContentBtn">
                    <span>&#9873;</span> Flag Content
                </button>
                <button class="mod-action-btn" id="refreshDataBtn">
                    <span>&#8635;</span> Refresh
                </button>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Render the active tab content
     * @returns {string} HTML string
     */
    renderTabContent() {
        switch (this.activeTab) {
            case 'users':
                return this.renderBannedUsers();
            case 'flags':
                return this.renderFlaggedContent();
            case 'history':
                return this.renderHistory();
            default:
                return '';
        }
    }

    /**
     * Render banned users list
     * @returns {string} HTML string
     */
    renderBannedUsers() {
        if (this.data.bannedUsers.length === 0) {
            return `
                <div class="mod-empty-state">
                    <span class="mod-empty-icon">&#128100;</span>
                    <p>No banned users</p>
                </div>
            `;
        }

        return `
            <div class="mod-list" role="list">
                ${this.data.bannedUsers.map(user => `
                    <div class="mod-list-item" role="listitem" data-user-id="${user.id}">
                        <div class="mod-item-info">
                            <div class="mod-item-title">${this.escapeHtml(user.userDisplayName)}</div>
                            <div class="mod-item-subtitle">${this.escapeHtml(user.userEmail)}</div>
                            <div class="mod-item-meta">
                                <span class="mod-item-reason">Reason: ${this.escapeHtml(user.reason) || 'No reason provided'}</span>
                                <span class="mod-item-date">Banned: ${this.formatDate(user.bannedAt)}</span>
                            </div>
                        </div>
                        <button class="mod-item-action unban-btn" data-user-id="${user.id}" aria-label="Unban ${user.userDisplayName}">
                            Unban
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render flagged content list
     * @returns {string} HTML string
     */
    renderFlaggedContent() {
        if (this.data.flags.length === 0) {
            return `
                <div class="mod-empty-state">
                    <span class="mod-empty-icon">&#9873;</span>
                    <p>No pending flags</p>
                </div>
            `;
        }

        return `
            <div class="mod-list" role="list">
                ${this.data.flags.map(flag => `
                    <div class="mod-list-item" role="listitem" data-flag-id="${flag.id}">
                        <div class="mod-item-info">
                            <div class="mod-item-title">${this.escapeHtml(flag.contentType)}: ${this.escapeHtml(flag.contentId)}</div>
                            <div class="mod-item-subtitle">Reason: ${this.escapeHtml(flag.reason)}</div>
                            <div class="mod-item-meta">
                                <span class="mod-item-date">Flagged: ${this.formatDate(flag.flaggedAt)}</span>
                                <span class="mod-item-status status-${flag.status}">${flag.status}</span>
                            </div>
                        </div>
                        <div class="mod-item-actions">
                            <button class="mod-item-action resolve-btn" data-flag-id="${flag.id}" data-resolution="approved">
                                Approve
                            </button>
                            <button class="mod-item-action resolve-btn danger" data-flag-id="${flag.id}" data-resolution="removed">
                                Remove
                            </button>
                            <button class="mod-item-action resolve-btn" data-flag-id="${flag.id}" data-resolution="dismissed">
                                Dismiss
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render moderation history
     * @returns {string} HTML string
     */
    renderHistory() {
        if (this.data.history.length === 0) {
            return `
                <div class="mod-empty-state">
                    <span class="mod-empty-icon">&#128196;</span>
                    <p>No moderation history</p>
                </div>
            `;
        }

        return `
            <div class="mod-list mod-history-list" role="list">
                ${this.data.history.map(entry => `
                    <div class="mod-list-item history-item" role="listitem">
                        <div class="mod-history-icon">${this.getActionIcon(entry.action)}</div>
                        <div class="mod-item-info">
                            <div class="mod-item-title">${this.formatActionName(entry.action)}</div>
                            <div class="mod-item-subtitle">${this.formatActionDetails(entry.details)}</div>
                            <div class="mod-item-meta">
                                <span>By: ${this.escapeHtml(entry.performedByEmail)}</span>
                                <span class="mod-item-date">${this.formatDate(entry.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.moderation-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Tab buttons
        this.container.querySelectorAll('.mod-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.activeTab = e.target.dataset.tab;
                this.render();
            });
        });

        // Unban buttons
        this.container.querySelectorAll('.unban-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userId;
                await this.handleUnban(userId);
            });
        });

        // Resolve flag buttons
        this.container.querySelectorAll('.resolve-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const flagId = e.target.dataset.flagId;
                const resolution = e.target.dataset.resolution;
                await this.handleResolveFlag(flagId, resolution);
            });
        });

        // Ban user button
        const banUserBtn = this.container.querySelector('#banUserBtn');
        if (banUserBtn) {
            banUserBtn.addEventListener('click', () => this.showBanUserDialog());
        }

        // Flag content button
        const flagContentBtn = this.container.querySelector('#flagContentBtn');
        if (flagContentBtn) {
            flagContentBtn.addEventListener('click', () => this.showFlagContentDialog());
        }

        // Refresh button
        const refreshBtn = this.container.querySelector('#refreshDataBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.loadData();
                this.render();
            });
        }
    }

    /**
     * Handle unban action
     * @param {string} userId
     */
    async handleUnban(userId) {
        if (!confirm('Are you sure you want to unban this user?')) return;

        const result = await this.moderationService.unbanUser(userId);
        if (result.success) {
            this.showToast('User unbanned successfully', 'success');
            await this.loadData();
            this.render();
        } else {
            this.showToast(`Error: ${result.error}`, 'error');
        }
    }

    /**
     * Handle resolve flag action
     * @param {string} flagId
     * @param {string} resolution
     */
    async handleResolveFlag(flagId, resolution) {
        const result = await this.moderationService.resolveFlag(flagId, resolution);
        if (result.success) {
            this.showToast(`Flag resolved: ${resolution}`, 'success');
            await this.loadData();
            this.render();
        } else {
            this.showToast(`Error: ${result.error}`, 'error');
        }
    }

    /**
     * Show ban user dialog
     */
    showBanUserDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'mod-dialog-overlay';
        dialog.innerHTML = `
            <div class="mod-dialog">
                <h3>Ban User</h3>
                <div class="mod-form-group">
                    <label for="banUserId">User ID or Email</label>
                    <input type="text" id="banUserId" placeholder="Enter user ID or email" />
                </div>
                <div class="mod-form-group">
                    <label for="banReason">Reason</label>
                    <textarea id="banReason" placeholder="Reason for ban" rows="3"></textarea>
                </div>
                <div class="mod-dialog-actions">
                    <button class="mod-action-btn" id="cancelBanBtn">Cancel</button>
                    <button class="mod-action-btn primary" id="confirmBanBtn">Ban User</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('#cancelBanBtn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#confirmBanBtn').addEventListener('click', async () => {
            const userId = dialog.querySelector('#banUserId').value.trim();
            const reason = dialog.querySelector('#banReason').value.trim();

            if (!userId) {
                alert('Please enter a user ID or email');
                return;
            }

            const result = await this.moderationService.banUser(userId, reason);
            if (result.success) {
                this.showToast('User banned successfully', 'success');
                dialog.remove();
                await this.loadData();
                this.render();
            } else {
                this.showToast(`Error: ${result.error}`, 'error');
            }
        });
    }

    /**
     * Show flag content dialog
     */
    showFlagContentDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'mod-dialog-overlay';
        dialog.innerHTML = `
            <div class="mod-dialog">
                <h3>Flag Content</h3>
                <div class="mod-form-group">
                    <label for="flagContentType">Content Type</label>
                    <select id="flagContentType">
                        <option value="submission">Submission</option>
                        <option value="comment">Comment</option>
                        <option value="theory">Theory</option>
                        <option value="entity">Entity</option>
                    </select>
                </div>
                <div class="mod-form-group">
                    <label for="flagContentId">Content ID</label>
                    <input type="text" id="flagContentId" placeholder="Enter content ID" />
                </div>
                <div class="mod-form-group">
                    <label for="flagReason">Reason</label>
                    <textarea id="flagReason" placeholder="Reason for flagging" rows="3"></textarea>
                </div>
                <div class="mod-dialog-actions">
                    <button class="mod-action-btn" id="cancelFlagBtn">Cancel</button>
                    <button class="mod-action-btn primary" id="confirmFlagBtn">Flag Content</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('#cancelFlagBtn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#confirmFlagBtn').addEventListener('click', async () => {
            const contentType = dialog.querySelector('#flagContentType').value;
            const contentId = dialog.querySelector('#flagContentId').value.trim();
            const reason = dialog.querySelector('#flagReason').value.trim();

            if (!contentId || !reason) {
                alert('Please fill in all fields');
                return;
            }

            const result = await this.moderationService.flagContent(contentType, contentId, reason);
            if (result.success) {
                this.showToast('Content flagged successfully', 'success');
                dialog.remove();
                await this.loadData();
                this.render();
            } else {
                this.showToast(`Error: ${result.error}`, 'error');
            }
        });
    }

    // ===== UTILITY METHODS =====

    /**
     * Show a toast notification
     * @param {string} message
     * @param {string} type
     */
    showToast(message, type = 'info') {
        if (window.toast) {
            window.toast[type](message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Format a Firestore timestamp
     * @param {firebase.firestore.Timestamp} timestamp
     * @returns {string}
     */
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    }

    /**
     * Get icon for action type
     * @param {string} action
     * @returns {string}
     */
    getActionIcon(action) {
        const icons = {
            'ban_user': '&#128683;',
            'unban_user': '&#9989;',
            'flag_content': '&#9873;',
            'resolve_flag': '&#10004;'
        };
        return icons[action] || '&#8226;';
    }

    /**
     * Format action name for display
     * @param {string} action
     * @returns {string}
     */
    formatActionName(action) {
        const names = {
            'ban_user': 'User Banned',
            'unban_user': 'User Unbanned',
            'flag_content': 'Content Flagged',
            'resolve_flag': 'Flag Resolved'
        };
        return names[action] || action;
    }

    /**
     * Format action details for display
     * @param {Object} details
     * @returns {string}
     */
    formatActionDetails(details) {
        if (!details) return '';
        const parts = [];
        if (details.targetUserId) parts.push(`User: ${details.targetUserId}`);
        if (details.contentType) parts.push(`Type: ${details.contentType}`);
        if (details.contentId) parts.push(`ID: ${details.contentId}`);
        if (details.resolution) parts.push(`Resolution: ${details.resolution}`);
        if (details.reason) parts.push(`Reason: ${this.escapeHtml(details.reason)}`);
        return parts.join(' | ');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Create global instance
window.adminModerationPanel = new AdminModerationPanel();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.adminModerationPanel.init();
    }, 1000);
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModerationPanel;
}
