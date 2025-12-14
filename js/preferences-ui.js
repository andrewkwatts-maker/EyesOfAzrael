/**
 * Preferences UI Management
 * Handles all UI interactions for the preferences page
 * Works in tandem with user-preferences.js
 */

class PreferencesUI {
    constructor() {
        this.prefs = window.userPreferences;
        this.currentUser = null;
        this.currentTab = 'content-filters';
        this.mythologies = [
            'jewish', 'greek', 'norse', 'egyptian', 'hindu', 'buddhist',
            'japanese', 'chinese', 'celtic', 'mesopotamian', 'roman', 'slavic'
        ];
        this.entityTypes = [
            'deity', 'hero', 'creature', 'place', 'item', 'concept',
            'magic', 'realm', 'theory'
        ];
    }

    /**
     * Initialize the preferences UI
     */
    async init() {
        // Wait for Firebase auth
        this.currentUser = firebase.auth().currentUser;
        if (!this.currentUser) {
            console.error('No user logged in');
            window.location.href = 'index.html';
            return;
        }

        // Load user preferences
        await this.prefs.loadPreferences(this.currentUser.uid);

        // Set up event listeners
        this.setupTabNavigation();
        this.setupContentFilters();
        this.setupBlockedContent();
        this.setupDisplaySettings();
        this.setupNotifications();
        this.setupPrivacy();
        this.setupHeaderActions();
        this.setupSaveIndicator();

        // Populate initial data
        this.populateMythologyFilters();
        this.populateEntityTypeFilters();
        this.populateBlockedUsers();
        this.populateBlockedTopics();
        this.populateHiddenSubmissions();
        this.updateStatistics();
        this.updateBlockedCountBadge();

        // Load current values into UI
        this.loadPreferencesIntoUI();
    }

    /**
     * Setup tab navigation
     */
    setupTabNavigation() {
        const tabs = document.querySelectorAll('.pref-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    /**
     * Switch to a different tab
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.pref-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            if (panel.id === `tab-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        this.currentTab = tabName;
    }

    /**
     * Setup content filter controls
     */
    setupContentFilters() {
        // Show/hide user content toggle
        const showUserContentToggle = document.getElementById('show-user-content');
        if (showUserContentToggle) {
            showUserContentToggle.addEventListener('change', (e) => {
                this.prefs.setContentFilter('showUserContent', e.target.checked);
                this.prefs.savePreferences();
            });
        }

        // Content source radio buttons
        const sourceRadios = document.querySelectorAll('input[name="content-source"]');
        sourceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Map to content filter mode
                    const value = e.target.value;
                    if (value === 'official') {
                        this.prefs.set('contentFilters.showUserContent', false);
                    } else if (value === 'official-self') {
                        this.prefs.set('contentFilters.showUserContent', true);
                        this.prefs.set('contentFilters.showApprovedOnly', false);
                    } else if (value === 'everyone') {
                        this.prefs.set('contentFilters.showUserContent', true);
                        this.prefs.set('contentFilters.showApprovedOnly', false);
                    }
                    this.prefs.savePreferences();
                }
            });
        });

        // Tag filtering
        const btnAddTag = document.getElementById('btn-add-tag');
        const tagFilterInput = document.getElementById('tag-filter-input');
        if (btnAddTag && tagFilterInput) {
            btnAddTag.addEventListener('click', () => {
                const tag = tagFilterInput.value.trim();
                if (tag) {
                    this.prefs.blockTopic(tag);
                    this.prefs.savePreferences();
                    this.populateBlockedTopics();
                    tagFilterInput.value = '';
                }
            });

            tagFilterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    btnAddTag.click();
                }
            });
        }
    }

    /**
     * Setup blocked content controls
     */
    setupBlockedContent() {
        // Clear all blocked users
        const btnClearBlockedUsers = document.getElementById('btn-clear-blocked-users');
        if (btnClearBlockedUsers) {
            btnClearBlockedUsers.addEventListener('click', async () => {
                if (confirm('Are you sure you want to unblock all users?')) {
                    this.prefs.preferences.blockedUsers = [];
                    await this.prefs.savePreferences();
                    this.populateBlockedUsers();
                    this.updateBlockedCountBadge();
                }
            });
        }

        // Clear all blocked topics
        const btnClearBlockedTopics = document.getElementById('btn-clear-blocked-topics');
        if (btnClearBlockedTopics) {
            btnClearBlockedTopics.addEventListener('click', async () => {
                if (confirm('Are you sure you want to unblock all topics?')) {
                    this.prefs.preferences.blockedTopics = [];
                    await this.prefs.savePreferences();
                    this.populateBlockedTopics();
                    this.updateBlockedCountBadge();
                }
            });
        }

        // Clear all hidden submissions
        const btnClearHiddenSubmissions = document.getElementById('btn-clear-hidden-submissions');
        if (btnClearHiddenSubmissions) {
            btnClearHiddenSubmissions.addEventListener('click', async () => {
                if (confirm('Are you sure you want to restore all hidden submissions?')) {
                    this.prefs.preferences.hiddenSubmissions = [];
                    await this.prefs.savePreferences();
                    this.populateHiddenSubmissions();
                    this.updateBlockedCountBadge();
                }
            });
        }

        // Block topic input
        const btnBlockTopic = document.getElementById('btn-block-topic');
        const blockTopicInput = document.getElementById('block-topic-input');
        if (btnBlockTopic && blockTopicInput) {
            btnBlockTopic.addEventListener('click', () => {
                const topic = blockTopicInput.value.trim();
                if (topic) {
                    this.prefs.blockTopic(topic);
                    this.prefs.savePreferences();
                    this.populateBlockedTopics();
                    this.updateBlockedCountBadge();
                    blockTopicInput.value = '';
                }
            });

            blockTopicInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    btnBlockTopic.click();
                }
            });
        }
    }

    /**
     * Setup display settings controls
     */
    setupDisplaySettings() {
        // Theme selector
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.prefs.setDisplayPreference('theme', e.target.value);
                    this.prefs.savePreferences();
                    this.prefs.applyTheme();
                }
            });
        });

        // Layout selector
        const layoutRadios = document.querySelectorAll('input[name="layout"]');
        layoutRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.prefs.setDisplayPreference('layout', e.target.value);
                    this.prefs.savePreferences();
                }
            });
        });

        // Grid columns slider
        const gridColumnsSlider = document.getElementById('grid-columns');
        const gridColumnsValue = document.getElementById('grid-columns-value');
        if (gridColumnsSlider && gridColumnsValue) {
            gridColumnsSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                gridColumnsValue.textContent = `${value} columns`;
            });

            gridColumnsSlider.addEventListener('change', (e) => {
                this.prefs.setDisplayPreference('gridSize', parseInt(e.target.value));
                this.prefs.savePreferences();
            });
        }

        // Card size selector
        const cardSizeRadios = document.querySelectorAll('input[name="card-size"]');
        cardSizeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.prefs.setDisplayPreference('cardSize', e.target.value);
                    this.prefs.savePreferences();
                }
            });
        });

        // Font size selector
        const fontSizeRadios = document.querySelectorAll('input[name="font-size"]');
        fontSizeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.prefs.setDisplayPreference('fontSize', e.target.value);
                    this.prefs.savePreferences();
                }
            });
        });

        // Animations selector
        const animationsRadios = document.querySelectorAll('input[name="animations"]');
        animationsRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const enabled = e.target.value !== 'none';
                    this.prefs.setDisplayPreference('animationsEnabled', enabled);
                    this.prefs.savePreferences();
                    this.prefs.applyDisplayPreferences();
                }
            });
        });
    }

    /**
     * Setup notification controls
     */
    setupNotifications() {
        const notifCheckboxes = [
            'email-notifications',
            'notify-submission-status',
            'notify-community',
            'notify-site-updates',
            'weekly-digest'
        ];

        notifCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const prefKey = this.notificationIdToKey(id);
                    this.prefs.setNotificationPreference(prefKey, e.target.checked);
                    this.prefs.savePreferences();
                });
            }
        });
    }

    /**
     * Setup privacy controls
     */
    setupPrivacy() {
        // Public profile toggle
        const publicProfileToggle = document.getElementById('public-profile');
        if (publicProfileToggle) {
            publicProfileToggle.addEventListener('change', (e) => {
                this.prefs.setPrivacySetting('profileVisibility', e.target.checked ? 'public' : 'private');
                this.prefs.savePreferences();
            });
        }

        // Show email toggle
        const showEmailToggle = document.getElementById('show-email');
        if (showEmailToggle) {
            showEmailToggle.addEventListener('change', (e) => {
                this.prefs.setPrivacySetting('showEmail', e.target.checked);
                this.prefs.savePreferences();
            });
        }

        // Activity tracking toggle
        const activityTrackingToggle = document.getElementById('activity-tracking');
        if (activityTrackingToggle) {
            activityTrackingToggle.addEventListener('change', (e) => {
                this.prefs.setPrivacySetting('analyticsOptOut', !e.target.checked);
                this.prefs.savePreferences();
            });
        }

        // Download data button
        const btnDownloadData = document.getElementById('btn-download-data');
        if (btnDownloadData) {
            btnDownloadData.addEventListener('click', () => {
                this.downloadUserData();
            });
        }

        // Clear history button
        const btnClearHistory = document.getElementById('btn-clear-history');
        if (btnClearHistory) {
            btnClearHistory.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear your browsing history?')) {
                    this.prefs.clearRecentlyViewed();
                    await this.prefs.savePreferences();
                    alert('Browsing history cleared');
                }
            });
        }

        // Delete account button
        const btnDeleteAccount = document.getElementById('btn-delete-account');
        if (btnDeleteAccount) {
            btnDeleteAccount.addEventListener('click', () => {
                this.handleDeleteAccount();
            });
        }
    }

    /**
     * Setup header action buttons
     */
    setupHeaderActions() {
        // Export button
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const exported = this.prefs.exportPreferences();
                const blob = new Blob([exported], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `preferences-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        // Import button
        const btnImport = document.getElementById('btn-import');
        const importFileInput = document.getElementById('import-file-input');
        if (btnImport && importFileInput) {
            btnImport.addEventListener('click', () => {
                importFileInput.click();
            });

            importFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const success = this.prefs.importPreferences(event.target.result);
                            if (success) {
                                await this.prefs.savePreferences();
                                this.loadPreferencesIntoUI();
                                alert('Preferences imported successfully!');
                            } else {
                                alert('Failed to import preferences. Invalid file format.');
                            }
                        } catch (error) {
                            console.error('Import error:', error);
                            alert('Error importing preferences: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                    importFileInput.value = '';
                }
            });
        }

        // Reset button
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', async () => {
                if (confirm('Are you sure you want to reset all preferences to defaults? This cannot be undone.')) {
                    this.prefs.resetToDefaults();
                    await this.prefs.savePreferences();
                    this.loadPreferencesIntoUI();
                    this.populateBlockedUsers();
                    this.populateBlockedTopics();
                    this.populateHiddenSubmissions();
                    alert('Preferences reset to defaults');
                }
            });
        }

        // Manual save button
        const btnManualSave = document.getElementById('btn-manual-save');
        if (btnManualSave) {
            btnManualSave.addEventListener('click', async () => {
                await this.prefs.savePreferences();
                this.showSaveSuccess();
            });
        }
    }

    /**
     * Setup save indicator
     */
    setupSaveIndicator() {
        // Listen for save events
        window.addEventListener('preferencesApplied', () => {
            this.showSaveSuccess();
        });
    }

    /**
     * Load current preferences into UI
     */
    loadPreferencesIntoUI() {
        const p = this.prefs.preferences;

        // Content filters
        document.getElementById('show-user-content').checked = p.contentFilters.showUserContent;

        // Display settings
        document.getElementById(`theme-${p.displayPreferences.theme}`).checked = true;
        document.getElementById(`layout-${p.displayPreferences.layout}`).checked = true;
        const gridColumns = p.displayPreferences.gridSize || 3;
        document.getElementById('grid-columns').value = gridColumns;
        document.getElementById('grid-columns-value').textContent = `${gridColumns} columns`;

        // Notifications
        document.getElementById('email-notifications').checked = p.notificationPreferences.emailNotifications;
        document.getElementById('notify-submission-status').checked = p.notificationPreferences.notifyOnSubmissionUpdate;
        document.getElementById('notify-community').checked = p.notificationPreferences.notifyOnTheoryComment;
        document.getElementById('notify-site-updates').checked = true; // Default
        document.getElementById('weekly-digest').checked = p.notificationPreferences.digestFrequency === 'weekly';

        // Privacy
        document.getElementById('public-profile').checked = p.privacySettings.profileVisibility === 'public';
        document.getElementById('show-email').checked = p.privacySettings.showEmail;
        document.getElementById('activity-tracking').checked = !p.privacySettings.analyticsOptOut;
    }

    /**
     * Populate mythology filters
     */
    populateMythologyFilters() {
        const container = document.getElementById('mythology-filters');
        if (!container) return;

        container.innerHTML = this.mythologies.map(myth => `
            <label class="checkbox-item">
                <input type="checkbox" value="${myth}" ${this.prefs.isMythologyBlocked(myth) ? '' : 'checked'}>
                <span class="checkbox-label">${this.capitalize(myth)}</span>
            </label>
        `).join('');

        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const mythology = e.target.value;
                if (e.target.checked) {
                    this.prefs.unblockMythology(mythology);
                } else {
                    this.prefs.blockMythology(mythology);
                }
                this.prefs.savePreferences();
            });
        });
    }

    /**
     * Populate entity type filters
     */
    populateEntityTypeFilters() {
        const container = document.getElementById('entity-type-filters');
        if (!container) return;

        container.innerHTML = this.entityTypes.map(type => `
            <label class="checkbox-item">
                <input type="checkbox" value="${type}" ${this.prefs.isCategoryBlocked(type) ? '' : 'checked'}>
                <span class="checkbox-label">${this.capitalize(type)}</span>
            </label>
        `).join('');

        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const type = e.target.value;
                if (e.target.checked) {
                    this.prefs.unblockCategory(type);
                } else {
                    this.prefs.blockCategory(type);
                }
                this.prefs.savePreferences();
            });
        });
    }

    /**
     * Populate blocked users list
     */
    async populateBlockedUsers() {
        const container = document.getElementById('blocked-users-list');
        if (!container) return;

        const blockedUsers = this.prefs.preferences.blockedUsers;

        if (blockedUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <p>No blocked users</p>
                </div>
            `;
            return;
        }

        // Fetch user info for each blocked user
        const usersInfo = await Promise.all(
            blockedUsers.map(userId => this.getUserInfo(userId))
        );

        container.innerHTML = usersInfo.map((user, index) => `
            <div class="blocked-item" data-user-id="${blockedUsers[index]}">
                <img src="${user.avatar}" alt="${user.name}" class="blocked-user-avatar">
                <div class="blocked-item-info">
                    <div class="blocked-item-name">${user.name}</div>
                    <div class="blocked-item-reason">Blocked by you</div>
                </div>
                <button class="btn-unblock" onclick="window.preferencesUI.unblockUser('${blockedUsers[index]}')">
                    Unblock
                </button>
            </div>
        `).join('');
    }

    /**
     * Populate blocked topics
     */
    populateBlockedTopics() {
        const container = document.getElementById('blocked-topics');
        if (!container) return;

        const blockedTopics = this.prefs.preferences.blockedTopics;

        if (blockedTopics.length === 0) {
            container.innerHTML = '<div class="empty-state-inline">No blocked topics</div>';
            return;
        }

        container.innerHTML = blockedTopics.map(topic => `
            <div class="tag-chip">
                <span>${this.escapeHtml(topic)}</span>
                <button class="tag-chip-remove" onclick="window.preferencesUI.unblockTopic('${this.escapeHtml(topic)}')">&times;</button>
            </div>
        `).join('');
    }

    /**
     * Populate hidden submissions
     */
    populateHiddenSubmissions() {
        const container = document.getElementById('hidden-submissions-list');
        if (!container) return;

        const hiddenSubmissions = this.prefs.preferences.hiddenSubmissions;

        if (hiddenSubmissions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No hidden submissions</p>
                </div>
            `;
            return;
        }

        container.innerHTML = hiddenSubmissions.map(subId => `
            <div class="blocked-item" data-submission-id="${subId}">
                <div class="blocked-item-info">
                    <div class="blocked-item-name">Submission ${subId}</div>
                    <div class="blocked-item-reason">Hidden by you</div>
                </div>
                <button class="btn-unblock" onclick="window.preferencesUI.restoreSubmission('${subId}')">
                    Restore
                </button>
            </div>
        `).join('');
    }

    /**
     * Update statistics
     */
    updateStatistics() {
        const stats = this.prefs.getBlockingStats();

        const statBlockedUsers = document.getElementById('stat-blocked-users');
        const statBlockedTopics = document.getElementById('stat-blocked-topics');
        const statHiddenContent = document.getElementById('stat-hidden-content');
        const statStorageUsed = document.getElementById('stat-storage-used');

        if (statBlockedUsers) statBlockedUsers.textContent = stats.blockedUsers;
        if (statBlockedTopics) statBlockedTopics.textContent = stats.blockedTopics;
        if (statHiddenContent) statHiddenContent.textContent = stats.hiddenSubmissions + stats.hiddenTheories;

        // Calculate storage used
        const prefsJSON = JSON.stringify(this.prefs.preferences);
        const bytes = new Blob([prefsJSON]).size;
        const kb = (bytes / 1024).toFixed(2);
        if (statStorageUsed) statStorageUsed.textContent = `${kb} KB`;
    }

    /**
     * Update blocked count badge
     */
    updateBlockedCountBadge() {
        const badge = document.getElementById('blocked-count-badge');
        if (badge) {
            const stats = this.prefs.getBlockingStats();
            const total = stats.blockedUsers + stats.blockedTopics + stats.hiddenSubmissions;
            badge.textContent = total;
            badge.style.display = total > 0 ? 'block' : 'none';
        }
    }

    /**
     * Unblock a user
     */
    async unblockUser(userId) {
        this.prefs.unblockUser(userId);
        await this.prefs.savePreferences();
        this.populateBlockedUsers();
        this.updateBlockedCountBadge();
        this.updateStatistics();
    }

    /**
     * Unblock a topic
     */
    async unblockTopic(topic) {
        this.prefs.unblockTopic(topic);
        await this.prefs.savePreferences();
        this.populateBlockedTopics();
        this.updateBlockedCountBadge();
        this.updateStatistics();
    }

    /**
     * Restore a hidden submission
     */
    async restoreSubmission(submissionId) {
        this.prefs.unhideSubmission(submissionId);
        await this.prefs.savePreferences();
        this.populateHiddenSubmissions();
        this.updateBlockedCountBadge();
        this.updateStatistics();
    }

    /**
     * Show save success indicator
     */
    showSaveSuccess() {
        const indicator = document.getElementById('save-indicator');
        const timestamp = document.getElementById('save-timestamp');
        if (indicator && timestamp) {
            indicator.classList.remove('saving', 'error');
            timestamp.textContent = 'Last saved: ' + new Date().toLocaleTimeString();
        }
    }

    /**
     * Download user data
     */
    downloadUserData() {
        const data = {
            preferences: this.prefs.preferences,
            user: {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName
            },
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eyes-of-azrael-user-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Handle delete account
     */
    async handleDeleteAccount() {
        const confirmation = prompt('This will permanently delete your account and all associated data. Type "DELETE" to confirm:');
        if (confirmation === 'DELETE') {
            try {
                // Delete user data from Firestore
                await firebase.firestore().collection('user_preferences').doc(this.currentUser.uid).delete();

                // Delete Firebase Auth account
                await this.currentUser.delete();

                alert('Account deleted successfully');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('Error deleting account: ' + error.message);
            }
        }
    }

    /**
     * Get user info
     */
    async getUserInfo(userId) {
        try {
            const userDoc = await firebase.firestore().collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                return {
                    name: data.displayName || data.email || 'Unknown User',
                    avatar: data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || 'User')}`
                };
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }

        return {
            name: 'Unknown User',
            avatar: 'https://ui-avatars.com/api/?name=Unknown'
        };
    }

    /**
     * Map notification checkbox ID to preference key
     */
    notificationIdToKey(id) {
        const map = {
            'email-notifications': 'emailNotifications',
            'notify-submission-status': 'notifyOnSubmissionUpdate',
            'notify-community': 'notifyOnTheoryComment',
            'notify-site-updates': 'notifyOnMention',
            'weekly-digest': 'digestFrequency'
        };
        return map[id] || id;
    }

    /**
     * Utility: Capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.preferencesUI = new PreferencesUI();
