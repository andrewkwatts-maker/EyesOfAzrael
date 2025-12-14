/**
 * Content Filter Dropdown Component
 * Inline filtering controls for user-generated content
 * Provides dropdown menu for blocking users, topics, categories, and reporting content
 */

class ContentFilterDropdown {
    constructor() {
        this.db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
        this.auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
        this.activeDropdown = null;
        this.init();
    }

    /**
     * Initialize the dropdown system
     */
    init() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.activeDropdown && !e.target.closest('.content-filter-dropdown')) {
                this.closeDropdown(this.activeDropdown);
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeDropdown) {
                this.closeDropdown(this.activeDropdown);
            }
        });

        // Listen for filter changes to update UI
        window.addEventListener('contentFilterChanged', () => {
            this.updateAllDropdowns();
        });
    }

    /**
     * Add filter dropdown to an entity element
     * @param {HTMLElement} element - Entity card or detail element
     * @param {Object} entity - Entity data
     */
    addDropdown(element, entity) {
        if (!entity || !window.contentFilter) return;

        const currentUserId = this.auth?.currentUser?.uid;
        const isOfficialContent = !entity.userId || entity.official === true;
        const isOwnContent = entity.userId && entity.userId === currentUserId;

        // Only add dropdown to user-submitted content that's not the current user's
        if (isOfficialContent || isOwnContent) {
            // Add visual indicator for official or own content instead
            this.addContentBadge(element, entity, isOfficialContent, isOwnContent);
            return;
        }

        // Remove existing dropdown if present
        const existing = element.querySelector('.content-filter-dropdown');
        if (existing) {
            existing.remove();
        }

        // Create and add new dropdown
        const dropdown = this.createDropdown(entity);
        element.style.position = 'relative'; // Ensure parent is positioned
        element.insertAdjacentElement('afterbegin', dropdown);

        // Add community contribution badge
        this.addContentBadge(element, entity, false, false);
    }

    /**
     * Create dropdown menu element
     * @param {Object} entity - Entity data
     * @returns {HTMLElement}
     */
    createDropdown(entity) {
        const container = document.createElement('div');
        container.className = 'content-filter-dropdown';
        container.setAttribute('role', 'menu');

        // Trigger button
        const button = document.createElement('button');
        button.className = 'filter-dropdown-trigger';
        button.setAttribute('aria-label', 'Content filter options');
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = '<span class="filter-dropdown-icon">⋮</span>';

        // Dropdown menu
        const menu = document.createElement('div');
        menu.className = 'filter-dropdown-menu';
        menu.setAttribute('role', 'menu');
        menu.innerHTML = this.getMenuHTML(entity);

        container.appendChild(button);
        container.appendChild(menu);

        // Event listeners
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleDropdown(container);
        });

        // Menu item listeners
        this.attachMenuListeners(menu, entity);

        return container;
    }

    /**
     * Generate menu HTML based on entity data
     * @param {Object} entity - Entity data
     * @returns {string}
     */
    getMenuHTML(entity) {
        const userId = entity.userId;
        const userName = entity.userName || entity.userDisplayName || 'this user';
        const entityType = entity.type || 'entity';
        const topicTag = entity.userTopic || entity.topic;
        const subtopicTag = entity.userSubtopic || entity.subtopic;

        const isUserBlocked = userId && window.contentFilter.isUserHidden(userId);
        const isTopicBlocked = topicTag && window.contentFilter.isTopicHidden(topicTag);

        let menuItems = [];

        // Header
        menuItems.push(`
            <div class="filter-menu-header">
                <span class="filter-menu-title">Filter Options</span>
            </div>
        `);

        // Block user option
        if (userId) {
            menuItems.push(`
                <button class="filter-menu-item"
                        data-action="block-user"
                        data-user-id="${this.escapeAttr(userId)}"
                        data-user-name="${this.escapeAttr(userName)}"
                        role="menuitem">
                    <span class="filter-menu-icon">${isUserBlocked ? '👁️' : '🚫'}</span>
                    <span class="filter-menu-text">${isUserBlocked ? 'Unblock' : 'Block'} ${this.escapeHtml(userName)}</span>
                </button>
            `);
        }

        // Block topic option
        if (topicTag) {
            menuItems.push(`
                <button class="filter-menu-item"
                        data-action="block-topic"
                        data-topic="${this.escapeAttr(topicTag)}"
                        role="menuitem">
                    <span class="filter-menu-icon">${isTopicBlocked ? '👁️' : '🏷️'}</span>
                    <span class="filter-menu-text">${isTopicBlocked ? 'Unblock' : 'Block'} topic: ${this.escapeHtml(topicTag)}</span>
                </button>
            `);
        }

        // Block category (entity type) option
        menuItems.push(`
            <button class="filter-menu-item"
                    data-action="block-category"
                    data-category="${this.escapeAttr(entityType)}"
                    role="menuitem">
                <span class="filter-menu-icon">📁</span>
                <span class="filter-menu-text">Block all user ${this.escapeHtml(entityType)}s</span>
            </button>
        `);

        // Divider
        menuItems.push('<div class="filter-menu-divider"></div>');

        // Hide this submission
        menuItems.push(`
            <button class="filter-menu-item"
                    data-action="hide-submission"
                    data-entity-id="${this.escapeAttr(entity.id || '')}"
                    role="menuitem">
                <span class="filter-menu-icon">👁️‍🗨️</span>
                <span class="filter-menu-text">Hide this submission</span>
            </button>
        `);

        // Report content
        menuItems.push(`
            <button class="filter-menu-item filter-menu-item-danger"
                    data-action="report-content"
                    data-entity-id="${this.escapeAttr(entity.id || '')}"
                    role="menuitem">
                <span class="filter-menu-icon">⚠️</span>
                <span class="filter-menu-text">Report content</span>
            </button>
        `);

        return menuItems.join('');
    }

    /**
     * Attach event listeners to menu items
     * @param {HTMLElement} menu - Menu element
     * @param {Object} entity - Entity data
     */
    attachMenuListeners(menu, entity) {
        const items = menu.querySelectorAll('.filter-menu-item');

        items.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const action = item.dataset.action;
                const dropdown = menu.closest('.content-filter-dropdown');

                await this.handleAction(action, item.dataset, entity);

                // Close dropdown after action
                if (dropdown) {
                    this.closeDropdown(dropdown);
                }
            });

            // Keyboard navigation
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    /**
     * Handle filter action
     * @param {string} action - Action type
     * @param {Object} data - Action data
     * @param {Object} entity - Entity data
     */
    async handleAction(action, data, entity) {
        switch (action) {
            case 'block-user':
                await this.blockUser(data.userId, data.userName, entity);
                break;

            case 'block-topic':
                await this.blockTopic(data.topic, entity);
                break;

            case 'block-category':
                await this.blockCategory(data.category, entity);
                break;

            case 'hide-submission':
                await this.hideSubmission(data.entityId, entity);
                break;

            case 'report-content':
                await this.reportContent(data.entityId, entity);
                break;
        }
    }

    /**
     * Block/unblock a user
     */
    async blockUser(userId, userName, entity) {
        if (!userId || !window.contentFilter) return;

        const isCurrentlyBlocked = window.contentFilter.isUserHidden(userId);

        if (isCurrentlyBlocked) {
            window.contentFilter.unhideUser(userId);
            this.showToast(`Content from ${userName} will now be shown`, 'success');
        } else {
            window.contentFilter.hideUser(userId);
            this.showToast(`Content from ${userName} will now be hidden`, 'info');

            // Hide the current element
            this.hideEntityElement(entity);
        }
    }

    /**
     * Block/unblock a topic
     */
    async blockTopic(topic, entity) {
        if (!topic || !window.contentFilter) return;

        const isCurrentlyBlocked = window.contentFilter.isTopicHidden(topic);

        if (isCurrentlyBlocked) {
            window.contentFilter.unhideTopic(topic);
            this.showToast(`Topic "${topic}" will now be shown`, 'success');
        } else {
            window.contentFilter.hideTopic(topic);
            this.showToast(`Topic "${topic}" will now be hidden`, 'info');

            // Hide the current element
            this.hideEntityElement(entity);
        }
    }

    /**
     * Block a category (entity type)
     */
    async blockCategory(category, entity) {
        // Store blocked category in localStorage
        const blockedCategories = this.getBlockedCategories();

        if (!blockedCategories.includes(category)) {
            blockedCategories.push(category);
            localStorage.setItem('blockedCategories', JSON.stringify(blockedCategories));
            this.showToast(`All user-submitted ${category}s will now be hidden`, 'info');

            // Hide all elements of this category
            this.hideEntityElement(entity);

            // Trigger refresh
            window.dispatchEvent(new CustomEvent('categoryBlocked', {
                detail: { category }
            }));
        }
    }

    /**
     * Get blocked categories from localStorage
     */
    getBlockedCategories() {
        try {
            const stored = localStorage.getItem('blockedCategories');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Hide a single submission
     */
    async hideSubmission(entityId, entity) {
        if (!entityId) return;

        // Store in localStorage
        const hiddenSubmissions = this.getHiddenSubmissions();

        if (!hiddenSubmissions.includes(entityId)) {
            hiddenSubmissions.push(entityId);
            localStorage.setItem('hiddenSubmissions', JSON.stringify(hiddenSubmissions));
            this.showToast('This submission has been hidden', 'info');

            // Hide the element
            this.hideEntityElement(entity);
        }
    }

    /**
     * Get hidden submissions from localStorage
     */
    getHiddenSubmissions() {
        try {
            const stored = localStorage.getItem('hiddenSubmissions');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Report content to admin
     */
    async reportContent(entityId, entity) {
        if (!this.db || !this.auth?.currentUser) {
            this.showToast('You must be signed in to report content', 'error');
            return;
        }

        // Confirm report
        const confirmed = confirm(
            'Are you sure you want to report this content?\n\n' +
            'Reports are reviewed by moderators. False reports may result in account restrictions.'
        );

        if (!confirmed) return;

        try {
            // Create report in Firestore
            await this.db.collection('contentReports').add({
                entityId: entityId,
                entityType: entity.type || 'unknown',
                reportedBy: this.auth.currentUser.uid,
                reportedByEmail: this.auth.currentUser.email,
                reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                entity: {
                    id: entity.id,
                    type: entity.type,
                    name: entity.name || entity.title,
                    userId: entity.userId,
                    userName: entity.userName || entity.userDisplayName
                }
            });

            this.showToast('Content has been reported. Thank you.', 'success');

            // Optionally hide after reporting
            this.hideSubmission(entityId, entity);
        } catch (error) {
            console.error('Error reporting content:', error);
            this.showToast('Failed to report content. Please try again.', 'error');
        }
    }

    /**
     * Hide an entity element
     */
    hideEntityElement(entity) {
        if (!entity || !entity.id) return;

        // Find all elements with this entity ID
        const elements = document.querySelectorAll(`[data-entity-id="${entity.id}"]`);

        elements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('filtered-hidden');

            // Add fade-out animation
            el.style.transition = 'opacity 0.3s ease';
            el.style.opacity = '0';

            setTimeout(() => {
                el.style.display = 'none';
            }, 300);
        });
    }

    /**
     * Toggle dropdown open/closed
     */
    toggleDropdown(dropdown) {
        const menu = dropdown.querySelector('.filter-dropdown-menu');
        const button = dropdown.querySelector('.filter-dropdown-trigger');

        if (!menu || !button) return;

        const isOpen = menu.classList.contains('show');

        // Close any other open dropdown
        if (this.activeDropdown && this.activeDropdown !== dropdown) {
            this.closeDropdown(this.activeDropdown);
        }

        if (isOpen) {
            this.closeDropdown(dropdown);
        } else {
            this.openDropdown(dropdown);
        }
    }

    /**
     * Open dropdown
     */
    openDropdown(dropdown) {
        const menu = dropdown.querySelector('.filter-dropdown-menu');
        const button = dropdown.querySelector('.filter-dropdown-trigger');

        if (!menu || !button) return;

        menu.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
        this.activeDropdown = dropdown;

        // Focus first menu item
        const firstItem = menu.querySelector('.filter-menu-item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 100);
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown(dropdown) {
        if (!dropdown) return;

        const menu = dropdown.querySelector('.filter-dropdown-menu');
        const button = dropdown.querySelector('.filter-dropdown-trigger');

        if (!menu || !button) return;

        menu.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');

        if (this.activeDropdown === dropdown) {
            this.activeDropdown = null;
        }
    }

    /**
     * Update all dropdowns (e.g., after filter changes)
     */
    updateAllDropdowns() {
        const dropdowns = document.querySelectorAll('.content-filter-dropdown');
        dropdowns.forEach(dropdown => {
            // Rebuild the dropdown menu to reflect new state
            const entityId = dropdown.closest('[data-entity-id]')?.dataset.entityId;
            if (entityId) {
                // Menu will be rebuilt next time it's opened
                const menu = dropdown.querySelector('.filter-dropdown-menu');
                if (menu && !menu.classList.contains('show')) {
                    menu.remove();
                }
            }
        });
    }

    /**
     * Add content badge (official/community/own)
     */
    addContentBadge(element, entity, isOfficial, isOwn) {
        // Remove existing badge
        const existing = element.querySelector('.content-badge');
        if (existing) {
            existing.remove();
        }

        const badge = document.createElement('div');
        badge.className = 'content-badge';

        if (isOfficial) {
            badge.classList.add('content-badge-official');
            badge.innerHTML = `
                <span class="content-badge-icon">✓</span>
                <span class="content-badge-text">Official Content</span>
            `;
        } else if (isOwn) {
            badge.classList.add('content-badge-own');
            badge.innerHTML = `
                <span class="content-badge-icon">👤</span>
                <span class="content-badge-text">Your Contribution</span>
            `;
        } else {
            // Community contribution
            badge.classList.add('content-badge-community');
            const userName = entity.userName || entity.userDisplayName || 'Community';
            const submittedDate = entity.createdAt ? this.formatDate(entity.createdAt) : '';
            const approvalStatus = entity.approvalStatus || 'pending';

            badge.innerHTML = `
                <div class="content-badge-header">
                    <span class="content-badge-icon">👥</span>
                    <span class="content-badge-text">Community Contribution</span>
                </div>
                <div class="content-badge-meta">
                    <span class="content-badge-author">By: ${this.escapeHtml(userName)}</span>
                    ${submittedDate ? `<span class="content-badge-date">${submittedDate}</span>` : ''}
                    <span class="content-badge-status content-badge-status-${approvalStatus}">${this.formatApprovalStatus(approvalStatus)}</span>
                </div>
            `;
        }

        // Add badge to element
        const headerContent = element.querySelector('.entity-header-content') ||
                            element.querySelector('.entity-name') ||
                            element;

        if (headerContent) {
            headerContent.insertAdjacentElement('afterbegin', badge);
        }
    }

    /**
     * Format approval status
     */
    formatApprovalStatus(status) {
        const statusMap = {
            'pending': '⏳ Pending Review',
            'approved': '✅ Approved',
            'rejected': '❌ Rejected',
            'flagged': '⚠️ Flagged'
        };
        return statusMap[status] || status;
    }

    /**
     * Format date
     */
    formatDate(timestamp) {
        if (!timestamp) return '';

        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate(); // Firestore Timestamp
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }

        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

        return date.toLocaleDateString();
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = {
            'success': '✓',
            'info': 'ℹ',
            'warning': '⚠',
            'error': '✕'
        }[type] || 'ℹ';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Escape HTML attribute
     */
    escapeAttr(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

// Create global instance
window.contentFilterDropdown = new ContentFilterDropdown();
