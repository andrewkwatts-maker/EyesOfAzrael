/**
 * Notification Center Component
 *
 * Provides the UI for the notification system including:
 * - Header bell icon with unread count badge
 * - Dropdown panel with recent notifications
 * - Full notification center page
 *
 * Features:
 * - Real-time unread count badge
 * - Notification dropdown with mark all read
 * - Full notification page with filters
 * - Group by date
 * - Type-specific icons and colors
 * - Responsive design
 *
 * @requires NotificationService
 */

class NotificationCenter {
    constructor() {
        this.service = null;
        this.unsubscribe = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.isDropdownOpen = false;
        this.isLoading = false;
        this.currentFilter = 'all'; // 'all', 'unread', or category name
        this.lastDoc = null;

        // Element references
        this.bellButton = null;
        this.dropdown = null;
        this.badgeElement = null;
        this.pageContainer = null;

        // Icons for notification types
        this.ICONS = {
            claim: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
            check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
            x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            transfer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
            edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
            eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
            at: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,
            badge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
            flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
            milestone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
            bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
            default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
        };

        // Category colors
        this.CATEGORY_COLORS = {
            ownership: '#8b7fff',
            content: '#22c55e',
            social: '#3b82f6',
            achievements: '#f59e0b',
            moderation: '#ef4444'
        };

        // Bind methods
        this.handleBellClick = this.handleBellClick.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleNotificationUpdate = this.handleNotificationUpdate.bind(this);
    }

    /**
     * Initialize the notification center
     * @returns {Promise<void>}
     */
    async init() {
        // Get or create service
        this.service = window.notificationService;
        if (!this.service) {
            console.error('[NotificationCenter] NotificationService not found');
            return;
        }

        await this.service.init();

        // Subscribe to real-time updates if user is authenticated
        const user = this.service.getCurrentUser();
        if (user) {
            this.subscribeToNotifications();
        }

        // Listen for auth changes
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.subscribeToNotifications();
            } else {
                this.unsubscribeFromNotifications();
                this.updateBadge(0);
            }
        });

        // Listen for notification events
        window.addEventListener('notification-received', this.handleNotificationUpdate);

        console.log('[NotificationCenter] Initialized');
    }

    /**
     * Subscribe to real-time notification updates
     */
    subscribeToNotifications() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.unsubscribe = this.service.subscribeToMyNotifications(
            (notifications, unreadCount) => {
                this.notifications = notifications;
                this.unreadCount = unreadCount;
                this.updateBadge(unreadCount);

                // Update dropdown if open
                if (this.isDropdownOpen && this.dropdown) {
                    this.renderDropdownContent();
                }
            }
        );
    }

    /**
     * Unsubscribe from notifications
     */
    unsubscribeFromNotifications() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.notifications = [];
        this.unreadCount = 0;
    }

    /**
     * Handle notification update event
     * @param {CustomEvent} event
     */
    handleNotificationUpdate(event) {
        const { notification } = event.detail;
        if (notification) {
            // Show toast for new notification
            this.showNotificationToast(notification);
        }
    }

    // ==================== HEADER BELL ====================

    /**
     * Create the notification bell button for the header
     * @returns {HTMLElement}
     */
    createBellButton() {
        const button = document.createElement('button');
        button.className = 'notification-bell';
        button.setAttribute('aria-label', 'Notifications');
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = `
            <span class="notification-bell__icon">
                ${this.ICONS.bell}
            </span>
            <span class="notification-bell__badge" style="display: none;">0</span>
        `;

        this.bellButton = button;
        this.badgeElement = button.querySelector('.notification-bell__badge');

        // Create dropdown
        this.dropdown = this.createDropdown();

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'notification-wrapper';
        wrapper.appendChild(button);
        wrapper.appendChild(this.dropdown);

        // Event listeners
        button.addEventListener('click', this.handleBellClick);
        document.addEventListener('click', this.handleOutsideClick);

        // Initialize badge
        this.loadUnreadCount();

        return wrapper;
    }

    /**
     * Handle bell button click
     * @param {Event} event
     */
    handleBellClick(event) {
        event.stopPropagation();
        this.toggleDropdown();
    }

    /**
     * Handle clicks outside the dropdown
     * @param {Event} event
     */
    handleOutsideClick(event) {
        if (this.isDropdownOpen &&
            !this.dropdown?.contains(event.target) &&
            !this.bellButton?.contains(event.target)) {
            this.closeDropdown();
        }
    }

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    /**
     * Open the dropdown
     */
    async openDropdown() {
        if (!this.dropdown) return;

        this.isDropdownOpen = true;
        this.dropdown.classList.add('active');
        this.bellButton?.setAttribute('aria-expanded', 'true');

        // Load notifications if needed
        if (this.notifications.length === 0) {
            await this.loadDropdownNotifications();
        }

        this.renderDropdownContent();
    }

    /**
     * Close the dropdown
     */
    closeDropdown() {
        if (!this.dropdown) return;

        this.isDropdownOpen = false;
        this.dropdown.classList.remove('active');
        this.bellButton?.setAttribute('aria-expanded', 'false');
    }

    /**
     * Load unread count
     */
    async loadUnreadCount() {
        const count = await this.service.getUnreadCount();
        this.updateBadge(count);
    }

    /**
     * Update the badge count
     * @param {number} count
     */
    updateBadge(count) {
        if (!this.badgeElement) return;

        this.unreadCount = count;

        if (count > 0) {
            this.badgeElement.textContent = count > 99 ? '99+' : count.toString();
            this.badgeElement.style.display = 'flex';
            this.bellButton?.classList.add('has-notifications');
        } else {
            this.badgeElement.style.display = 'none';
            this.bellButton?.classList.remove('has-notifications');
        }
    }

    // ==================== DROPDOWN ====================

    /**
     * Create the dropdown element
     * @returns {HTMLElement}
     */
    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-label', 'Notifications');
        dropdown.innerHTML = `
            <div class="notification-dropdown__header">
                <h3 class="notification-dropdown__title">Notifications</h3>
                <button class="notification-dropdown__mark-all" aria-label="Mark all as read">
                    Mark all read
                </button>
            </div>
            <div class="notification-dropdown__content">
                <div class="notification-dropdown__loading">
                    <div class="loading-spinner"></div>
                </div>
            </div>
            <div class="notification-dropdown__footer">
                <a href="#/notifications" class="notification-dropdown__view-all">
                    View all notifications
                </a>
            </div>
        `;

        // Mark all read handler
        const markAllBtn = dropdown.querySelector('.notification-dropdown__mark-all');
        markAllBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.markAllAsRead();
        });

        return dropdown;
    }

    /**
     * Load notifications for dropdown
     */
    async loadDropdownNotifications() {
        const { notifications } = await this.service.getMyNotifications({
            limit: 10
        });
        this.notifications = notifications;
    }

    /**
     * Render dropdown content
     */
    renderDropdownContent() {
        const content = this.dropdown?.querySelector('.notification-dropdown__content');
        if (!content) return;

        if (this.notifications.length === 0) {
            content.innerHTML = `
                <div class="notification-dropdown__empty">
                    <span class="notification-dropdown__empty-icon">
                        ${this.ICONS.bell}
                    </span>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        const html = this.notifications.slice(0, 5).map(notif =>
            this.renderNotificationItem(notif, 'dropdown')
        ).join('');

        content.innerHTML = html;

        // Add click handlers
        content.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNotificationClick(e, item.dataset.id);
            });
        });
    }

    /**
     * Render a single notification item
     * @param {Object} notification
     * @param {string} context - 'dropdown' or 'page'
     * @returns {string} HTML
     */
    renderNotificationItem(notification, context = 'dropdown') {
        const icon = this.ICONS[notification.icon] || this.ICONS.default;
        const categoryColor = this.CATEGORY_COLORS[notification.category] || '#8b7fff';
        const timeAgo = this.formatTimeAgo(notification.createdAt);
        const readClass = notification.read ? 'notification-item--read' : '';

        return `
            <div class="notification-item ${readClass}"
                 data-id="${notification.id}"
                 data-action-url="${notification.actionUrl || ''}"
                 role="menuitem"
                 tabindex="0">
                <div class="notification-item__icon" style="--category-color: ${categoryColor}">
                    ${icon}
                </div>
                <div class="notification-item__content">
                    <p class="notification-item__title">${this.escapeHtml(notification.title)}</p>
                    <p class="notification-item__message">${this.escapeHtml(notification.message)}</p>
                    <span class="notification-item__time">${timeAgo}</span>
                </div>
                ${!notification.read ? '<span class="notification-item__unread-dot"></span>' : ''}
            </div>
        `;
    }

    /**
     * Handle notification item click
     * @param {Event} event
     * @param {string} notificationId
     */
    async handleNotificationClick(event, notificationId) {
        const item = event.currentTarget;
        const actionUrl = item.dataset.actionUrl;

        // Mark as read
        await this.service.markAsRead(notificationId);

        // Update UI
        item.classList.add('notification-item--read');
        item.querySelector('.notification-item__unread-dot')?.remove();

        // Navigate if action URL exists
        if (actionUrl) {
            this.closeDropdown();
            window.location.hash = actionUrl;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        await this.service.markAllRead();

        // Update dropdown
        if (this.dropdown) {
            this.dropdown.querySelectorAll('.notification-item').forEach(item => {
                item.classList.add('notification-item--read');
                item.querySelector('.notification-item__unread-dot')?.remove();
            });
        }

        this.updateBadge(0);
    }

    // ==================== NOTIFICATION PAGE ====================

    /**
     * Render the full notification page
     * @param {HTMLElement} container
     */
    async renderPage(container) {
        this.pageContainer = container;
        container.innerHTML = this.getPageHTML();

        // Set up event listeners
        this.setupPageListeners(container);

        // Load notifications
        await this.loadPageNotifications();
    }

    /**
     * Get the page HTML
     * @returns {string}
     */
    getPageHTML() {
        return `
            <div class="notification-page">
                <header class="notification-page__header">
                    <h1 class="notification-page__title">Notifications</h1>
                    <div class="notification-page__actions">
                        <button class="notification-page__action" id="notif-mark-all-read">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 11 12 14 22 4"></polyline>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            Mark all read
                        </button>
                        <button class="notification-page__action notification-page__action--danger" id="notif-clear-all">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Clear all
                        </button>
                        <a href="#/settings/notifications" class="notification-page__action">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Settings
                        </a>
                    </div>
                </header>

                <nav class="notification-page__filters">
                    <button class="notification-filter active" data-filter="all">All</button>
                    <button class="notification-filter" data-filter="unread">Unread</button>
                    <button class="notification-filter" data-filter="ownership">Ownership</button>
                    <button class="notification-filter" data-filter="content">Content</button>
                    <button class="notification-filter" data-filter="social">Social</button>
                    <button class="notification-filter" data-filter="achievements">Achievements</button>
                </nav>

                <div class="notification-page__content">
                    <div class="notification-page__loading">
                        <div class="loading-spinner loading-spinner-large"></div>
                        <p>Loading notifications...</p>
                    </div>
                </div>

                <div class="notification-page__load-more" style="display: none;">
                    <button class="notification-page__load-more-btn" id="notif-load-more">
                        Load more
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Set up page event listeners
     * @param {HTMLElement} container
     */
    setupPageListeners(container) {
        // Filter buttons
        container.querySelectorAll('.notification-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.notification-filter').forEach(b =>
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.lastDoc = null;
                this.loadPageNotifications();
            });
        });

        // Mark all read
        container.querySelector('#notif-mark-all-read')?.addEventListener('click', async () => {
            await this.markAllAsRead();
            await this.loadPageNotifications();
        });

        // Clear all
        container.querySelector('#notif-clear-all')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all notifications?')) {
                await this.service.clearAllNotifications();
                await this.loadPageNotifications();
            }
        });

        // Load more
        container.querySelector('#notif-load-more')?.addEventListener('click', () => {
            this.loadMoreNotifications();
        });
    }

    /**
     * Load notifications for the page
     */
    async loadPageNotifications() {
        const content = this.pageContainer?.querySelector('.notification-page__content');
        if (!content) return;

        content.innerHTML = `
            <div class="notification-page__loading">
                <div class="loading-spinner loading-spinner-large"></div>
                <p>Loading notifications...</p>
            </div>
        `;

        // Build filters
        const filters = {
            limit: 20
        };

        if (this.currentFilter === 'unread') {
            filters.read = false;
        } else if (this.currentFilter !== 'all') {
            filters.category = this.currentFilter;
        }

        const { notifications, lastDoc } = await this.service.getMyNotifications(filters);
        this.lastDoc = lastDoc;

        this.renderPageNotifications(notifications);
    }

    /**
     * Load more notifications
     */
    async loadMoreNotifications() {
        if (!this.lastDoc) return;

        const loadMoreBtn = this.pageContainer?.querySelector('#notif-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading...';
        }

        const filters = {
            limit: 20,
            startAfter: this.lastDoc
        };

        if (this.currentFilter === 'unread') {
            filters.read = false;
        } else if (this.currentFilter !== 'all') {
            filters.category = this.currentFilter;
        }

        const { notifications, lastDoc } = await this.service.getMyNotifications(filters);
        this.lastDoc = lastDoc;

        // Append to existing list
        this.appendPageNotifications(notifications);

        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load more';
        }
    }

    /**
     * Render notifications on the page
     * @param {Array} notifications
     */
    renderPageNotifications(notifications) {
        const content = this.pageContainer?.querySelector('.notification-page__content');
        const loadMore = this.pageContainer?.querySelector('.notification-page__load-more');

        if (!content) return;

        if (notifications.length === 0) {
            content.innerHTML = `
                <div class="notification-page__empty">
                    <span class="notification-page__empty-icon">
                        ${this.ICONS.bell}
                    </span>
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            `;
            if (loadMore) loadMore.style.display = 'none';
            return;
        }

        // Group by date
        const grouped = this.service.groupByDate(notifications);
        let html = '';

        if (grouped.today.length > 0) {
            html += this.renderNotificationGroup('Today', grouped.today);
        }
        if (grouped.yesterday.length > 0) {
            html += this.renderNotificationGroup('Yesterday', grouped.yesterday);
        }
        if (grouped.thisWeek.length > 0) {
            html += this.renderNotificationGroup('This Week', grouped.thisWeek);
        }
        if (grouped.earlier.length > 0) {
            html += this.renderNotificationGroup('Earlier', grouped.earlier);
        }

        content.innerHTML = html;

        // Add click handlers
        content.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleNotificationClick(e, item.dataset.id);
            });
        });

        // Show/hide load more
        if (loadMore) {
            loadMore.style.display = this.lastDoc ? 'block' : 'none';
        }
    }

    /**
     * Append notifications to the page
     * @param {Array} notifications
     */
    appendPageNotifications(notifications) {
        const content = this.pageContainer?.querySelector('.notification-page__content');
        const loadMore = this.pageContainer?.querySelector('.notification-page__load-more');

        if (!content || notifications.length === 0) {
            if (loadMore) loadMore.style.display = 'none';
            return;
        }

        // Create temporary container for new items
        const temp = document.createElement('div');
        notifications.forEach(notif => {
            temp.innerHTML = this.renderNotificationItem(notif, 'page');
            const item = temp.firstElementChild;
            item.addEventListener('click', (e) => {
                this.handleNotificationClick(e, item.dataset.id);
            });
            content.appendChild(item);
        });

        // Show/hide load more
        if (loadMore) {
            loadMore.style.display = this.lastDoc ? 'block' : 'none';
        }
    }

    /**
     * Render a notification group
     * @param {string} title
     * @param {Array} notifications
     * @returns {string}
     */
    renderNotificationGroup(title, notifications) {
        const items = notifications.map(notif =>
            this.renderNotificationItem(notif, 'page')
        ).join('');

        return `
            <div class="notification-group">
                <h3 class="notification-group__title">${title}</h3>
                <div class="notification-group__items">
                    ${items}
                </div>
            </div>
        `;
    }

    // ==================== TOAST NOTIFICATIONS ====================

    /**
     * Show a toast for a new notification
     * @param {Object} notification
     */
    showNotificationToast(notification) {
        // Use the global toast system if available
        if (window.toastManager) {
            window.toastManager.show({
                type: 'info',
                title: notification.title,
                message: notification.message,
                duration: 5000,
                actions: notification.actionUrl ? [
                    {
                        label: notification.actionLabel || 'View',
                        onClick: () => {
                            window.location.hash = notification.actionUrl;
                        }
                    }
                ] : []
            });
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Format time ago string
     * @param {Date|string} date
     * @returns {string}
     */
    formatTimeAgo(date) {
        const now = new Date();
        const then = date instanceof Date ? date : new Date(date);
        const diff = Math.floor((now - then) / 1000);

        if (diff < 60) {
            return 'Just now';
        } else if (diff < 3600) {
            const mins = Math.floor(diff / 60);
            return `${mins}m ago`;
        } else if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return `${hours}h ago`;
        } else if (diff < 604800) {
            const days = Math.floor(diff / 86400);
            return `${days}d ago`;
        } else {
            return then.toLocaleDateString();
        }
    }

    /**
     * Escape HTML
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.unsubscribeFromNotifications();
        window.removeEventListener('notification-received', this.handleNotificationUpdate);
        document.removeEventListener('click', this.handleOutsideClick);
    }
}

// Create singleton instance
window.notificationCenter = window.notificationCenter || new NotificationCenter();

// Export class for modules
if (typeof window !== 'undefined') {
    window.NotificationCenter = NotificationCenter;
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationCenter;
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize in app:
 *    await notificationCenter.init();
 *
 * 2. Add bell to header:
 *    const headerActions = document.querySelector('.header-actions');
 *    const bell = notificationCenter.createBellButton();
 *    headerActions.prepend(bell);
 *
 * 3. Render notification page:
 *    const container = document.getElementById('main-content');
 *    await notificationCenter.renderPage(container);
 *
 * 4. Manual badge update:
 *    notificationCenter.updateBadge(5);
 *
 * 5. Show toast for notification:
 *    notificationCenter.showNotificationToast({
 *      title: 'New Badge!',
 *      message: 'You earned a badge',
 *      actionUrl: '#/profile/badges'
 *    });
 */
