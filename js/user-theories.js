/**
 * User Theory Management System
 * Handles creation, editing, viewing, and voting on user-submitted theories
 *
 * Now uses Firebase Firestore with localStorage fallback for backward compatibility
 */

class UserTheories {
    constructor() {
        this.useFirestore = false; // Will be set to true when Firebase is available
        this.theories = this.loadTheories(); // localStorage fallback
        this.listeners = new Map(); // Track active listeners
        this.init();
    }

    /**
     * Initialize theory system
     */
    async init() {
        // Listen for login/logout events
        window.addEventListener('userLogin', () => this.onUserLogin());
        window.addEventListener('userLogout', () => this.onUserLogout());

        // Check if Firebase is available
        await this.initFirebase();
    }

    /**
     * Initialize Firebase connection
     */
    async initFirebase() {
        try {
            // Wait for Firebase to be available
            if (typeof firebase !== 'undefined' && window.firebaseDB) {
                await window.firebaseDB.init();
                this.useFirestore = true;
                console.log('UserTheories: Using Firestore backend');

                // Migrate localStorage data if needed
                await this.migrateFromLocalStorage();
            } else {
                console.log('UserTheories: Using localStorage fallback');
            }
        } catch (error) {
            console.warn('UserTheories: Firebase initialization failed, using localStorage:', error);
            this.useFirestore = false;
        }
    }

    /**
     * Migrate localStorage data to Firestore (one-time migration)
     */
    async migrateFromLocalStorage() {
        const migrationKey = 'userTheories_migrated';
        if (localStorage.getItem(migrationKey)) {
            return; // Already migrated
        }

        const localTheories = this.loadTheories();
        if (localTheories.length === 0) {
            localStorage.setItem(migrationKey, 'true');
            return;
        }

        console.log(`Migrating ${localTheories.length} theories to Firestore...`);
        // Migration would happen here if user is logged in
        // For now, we keep localStorage as backup
    }

    /**
     * Load theories from localStorage (fallback)
     */
    loadTheories() {
        const theoriesJSON = localStorage.getItem('userTheories');
        return theoriesJSON ? JSON.parse(theoriesJSON) : [];
    }

    /**
     * Save theories to localStorage (fallback)
     */
    saveTheories() {
        localStorage.setItem('userTheories', JSON.stringify(this.theories));
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `theory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Submit new theory
     */
    async submitTheory(data) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return { success: false, error: 'You must be logged in to submit theories' };
        }

        // Validation
        if (!data.title || data.title.trim().length < 5) {
            return { success: false, error: 'Title must be at least 5 characters' };
        }

        // Support both old (content) and new (richContent) formats
        const hasRichContent = data.richContent && data.richContent.panels && data.richContent.panels.length > 0;
        const hasSimpleContent = data.content && data.content.trim().length >= 50;

        if (!hasRichContent && !hasSimpleContent) {
            return { success: false, error: 'Theory must have content panels or at least 50 characters of text' };
        }

        if (!data.category && !data.topic) {
            return { success: false, error: 'Please select a category or topic' };
        }

        // Use Firestore if available
        if (this.useFirestore) {
            try {
                const result = await window.firebaseDB.createTheory(data);
                return {
                    success: true,
                    theory: result.theory,
                    theoryId: result.theoryId,
                    message: 'Theory submitted successfully!'
                };
            } catch (error) {
                console.error('Error submitting theory to Firestore:', error);
                return { success: false, error: error.message || 'Failed to submit theory' };
            }
        }

        // Fallback to localStorage
        const currentUser = window.userAuth.getCurrentUser();

        const theory = {
            id: this.generateId(),
            title: data.title.trim(),
            summary: data.summary ? data.summary.trim() : '',

            // Rich content support (new format)
            richContent: data.richContent || null,

            // Legacy simple content support
            content: data.content ? data.content.trim() : '',

            // Taxonomy (new)
            topic: data.topic || null,
            topicName: data.topicName || null,
            topicIcon: data.topicIcon || null,
            subtopic: data.subtopic || null,
            subtopicName: data.subtopicName || null,

            // Legacy category support
            category: data.category || data.topic || 'general',

            sources: data.sources ? data.sources.trim() : '',
            relatedMythologies: data.relatedMythologies || [],
            relatedPage: data.relatedPage || null,
            author: currentUser.username,
            authorAvatar: currentUser.avatar,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            votes: 0,
            voters: [],
            comments: [],
            status: 'published', // published, draft, archived
            views: 0,
            tags: data.tags || []
        };

        this.theories.push(theory);
        this.saveTheories();

        // Add to user's theory list
        this.addTheoryToUser(currentUser.username, theory.id);

        return { success: true, theory, message: 'Theory submitted successfully!' };
    }

    /**
     * Update existing theory
     */
    async updateTheory(theoryId, updates) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return { success: false, error: 'You must be logged in to edit theories' };
        }

        // Use Firestore if available
        if (this.useFirestore) {
            try {
                await window.firebaseDB.updateTheory(theoryId, updates);
                return { success: true, message: 'Theory updated successfully!' };
            } catch (error) {
                console.error('Error updating theory in Firestore:', error);
                return { success: false, error: error.message || 'Failed to update theory' };
            }
        }

        // Fallback to localStorage
        const currentUser = window.userAuth.getCurrentUser();
        const theory = this.theories.find(t => t.id === theoryId);

        if (!theory) {
            return { success: false, error: 'Theory not found' };
        }

        if (theory.author !== currentUser.username) {
            return { success: false, error: 'You can only edit your own theories' };
        }

        // Update fields
        if (updates.title) theory.title = updates.title.trim();
        if (updates.summary !== undefined) theory.summary = updates.summary.trim();
        if (updates.content) theory.content = updates.content.trim();
        if (updates.richContent) theory.richContent = updates.richContent;
        if (updates.category) theory.category = updates.category;
        if (updates.topic) theory.topic = updates.topic;
        if (updates.topicName) theory.topicName = updates.topicName;
        if (updates.topicIcon) theory.topicIcon = updates.topicIcon;
        if (updates.subtopic) theory.subtopic = updates.subtopic;
        if (updates.subtopicName) theory.subtopicName = updates.subtopicName;
        if (updates.sources !== undefined) theory.sources = updates.sources.trim();
        if (updates.relatedMythologies) theory.relatedMythologies = updates.relatedMythologies;
        if (updates.tags) theory.tags = updates.tags;
        if (updates.status) theory.status = updates.status;

        theory.updatedAt = new Date().toISOString();

        this.saveTheories();

        return { success: true, theory, message: 'Theory updated successfully!' };
    }

    /**
     * Delete theory
     */
    async deleteTheory(theoryId) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return { success: false, error: 'You must be logged in to delete theories' };
        }

        // Use Firestore if available
        if (this.useFirestore) {
            try {
                await window.firebaseDB.deleteTheory(theoryId);
                return { success: true, message: 'Theory deleted successfully!' };
            } catch (error) {
                console.error('Error deleting theory in Firestore:', error);
                return { success: false, error: error.message || 'Failed to delete theory' };
            }
        }

        // Fallback to localStorage
        const currentUser = window.userAuth.getCurrentUser();
        const theoryIndex = this.theories.findIndex(t => t.id === theoryId);

        if (theoryIndex === -1) {
            return { success: false, error: 'Theory not found' };
        }

        const theory = this.theories[theoryIndex];

        if (theory.author !== currentUser.username) {
            return { success: false, error: 'You can only delete your own theories' };
        }

        this.theories.splice(theoryIndex, 1);
        this.saveTheories();

        return { success: true, message: 'Theory deleted successfully!' };
    }

    /**
     * Get theory by ID
     */
    async getTheory(theoryId) {
        // Use Firestore if available
        if (this.useFirestore) {
            try {
                return await window.firebaseDB.getTheory(theoryId);
            } catch (error) {
                console.error('Error getting theory from Firestore:', error);
                return null;
            }
        }

        // Fallback to localStorage
        return this.theories.find(t => t.id === theoryId);
    }

    /**
     * Get all theories
     */
    async getAllTheories(filters = {}) {
        // Use Firestore if available
        if (this.useFirestore) {
            try {
                // Handle search separately
                if (filters.search) {
                    const result = await window.firebaseDB.searchTheories(filters.search, filters);
                    return result.theories;
                }

                const result = await window.firebaseDB.getTheories(filters);
                return result.theories;
            } catch (error) {
                console.error('Error getting theories from Firestore:', error);
                // Fall back to localStorage on error
            }
        }

        // Fallback to localStorage
        let filtered = [...this.theories];

        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        } else {
            filtered = filtered.filter(t => t.status === 'published');
        }

        // Filter by topic (new)
        if (filters.topic) {
            filtered = filtered.filter(t => t.topic === filters.topic);
        }

        // Filter by subtopic (new)
        if (filters.subtopic) {
            filtered = filtered.filter(t => t.subtopic === filters.subtopic);
        }

        // Filter by category (legacy)
        if (filters.category) {
            filtered = filtered.filter(t => t.category === filters.category);
        }

        // Filter by author
        if (filters.author) {
            filtered = filtered.filter(t => t.author === filters.author);
        }

        // Filter by related mythology
        if (filters.mythology) {
            filtered = filtered.filter(t =>
                t.relatedMythologies.some(m =>
                    m.toLowerCase() === filters.mythology.toLowerCase()
                )
            );
        }

        // Filter by related page
        if (filters.relatedPage) {
            filtered = filtered.filter(t => t.relatedPage === filters.relatedPage);
        }

        // Search in title/content (new)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(t => {
                const inTitle = t.title.toLowerCase().includes(searchTerm);
                const inContent = t.content?.toLowerCase().includes(searchTerm);
                const inPanels = t.richContent?.panels?.some(p =>
                    p.title?.toLowerCase().includes(searchTerm) ||
                    p.content?.toLowerCase().includes(searchTerm)
                );
                return inTitle || inContent || inPanels;
            });
        }

        // Sort
        const sortBy = filters.sortBy || 'newest';
        switch (sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'popular':
                filtered.sort((a, b) => b.votes - a.votes);
                break;
            case 'views':
                filtered.sort((a, b) => b.views - a.views);
                break;
        }

        return filtered;
    }

    /**
     * Vote on theory
     */
    async voteTheory(theoryId, direction = 1) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return { success: false, error: 'You must be logged in to vote' };
        }

        // Use Firestore if available
        if (this.useFirestore) {
            try {
                await window.firebaseDB.voteTheory(theoryId, direction);
                return { success: true };
            } catch (error) {
                console.error('Error voting on theory in Firestore:', error);
                return { success: false, error: error.message || 'Failed to vote' };
            }
        }

        // Fallback to localStorage
        const currentUser = window.userAuth.getCurrentUser();
        const theory = this.theories.find(t => t.id === theoryId);

        if (!theory) {
            return { success: false, error: 'Theory not found' };
        }

        // Check if user already voted
        const voterIndex = theory.voters.findIndex(v => v.username === currentUser.username);

        if (voterIndex !== -1) {
            // User already voted - change vote or remove
            const existingVote = theory.voters[voterIndex];
            if (existingVote.direction === direction) {
                // Remove vote
                theory.votes -= direction;
                theory.voters.splice(voterIndex, 1);
            } else {
                // Change vote
                theory.votes -= existingVote.direction; // Remove old
                theory.votes += direction; // Add new
                existingVote.direction = direction;
            }
        } else {
            // New vote
            theory.votes += direction;
            theory.voters.push({
                username: currentUser.username,
                direction,
                votedAt: new Date().toISOString()
            });
        }

        this.saveTheories();

        return { success: true, votes: theory.votes };
    }

    /**
     * Add comment to theory
     */
    async addComment(theoryId, content) {
        if (!window.userAuth || !window.userAuth.isLoggedIn()) {
            return { success: false, error: 'You must be logged in to comment' };
        }

        // Use Firestore if available
        if (this.useFirestore) {
            try {
                const result = await window.firebaseDB.addComment(theoryId, content);
                return { success: true, comment: result.comment, message: 'Comment added!' };
            } catch (error) {
                console.error('Error adding comment in Firestore:', error);
                return { success: false, error: error.message || 'Failed to add comment' };
            }
        }

        // Fallback to localStorage
        const currentUser = window.userAuth.getCurrentUser();
        const theory = this.theories.find(t => t.id === theoryId);

        if (!theory) {
            return { success: false, error: 'Theory not found' };
        }

        if (!content || content.trim().length < 3) {
            return { success: false, error: 'Comment must be at least 3 characters' };
        }

        const comment = {
            id: this.generateId(),
            author: currentUser.username,
            authorAvatar: currentUser.avatar,
            content: content.trim(),
            createdAt: new Date().toISOString(),
            votes: 0
        };

        theory.comments.push(comment);
        this.saveTheories();

        return { success: true, comment, message: 'Comment added!' };
    }

    /**
     * Increment view count
     */
    async incrementViews(theoryId) {
        // Use Firestore if available
        if (this.useFirestore) {
            try {
                await window.firebaseDB.incrementViews(theoryId);
                return;
            } catch (error) {
                console.error('Error incrementing views in Firestore:', error);
                // Don't throw - view counting is not critical
            }
        }

        // Fallback to localStorage
        const theory = this.theories.find(t => t.id === theoryId);
        if (theory) {
            theory.views = (theory.views || 0) + 1;
            this.saveTheories();
        }
    }

    /**
     * Add theory to user's list
     */
    addTheoryToUser(username, theoryId) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[username]) {
            if (!users[username].theories) {
                users[username].theories = [];
            }
            users[username].theories.push(theoryId);
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    /**
     * Get user's theories
     */
    getUserTheories(username) {
        return this.getAllTheories({ author: username, status: null });
    }

    /**
     * Get comments for a theory
     */
    async getComments(theoryId) {
        // Use Firestore if available
        if (this.useFirestore) {
            try {
                return await window.firebaseDB.getComments(theoryId);
            } catch (error) {
                console.error('Error getting comments from Firestore:', error);
                return [];
            }
        }

        // Fallback to localStorage
        const theory = this.theories.find(t => t.id === theoryId);
        return theory ? theory.comments : [];
    }

    /**
     * Listen for real-time updates to a theory
     */
    listenToTheory(theoryId, callback) {
        if (this.useFirestore && window.firebaseDB) {
            return window.firebaseDB.listenToTheory(theoryId, callback);
        }

        // No real-time updates in localStorage mode
        return () => {};
    }

    /**
     * Listen for real-time comment updates
     */
    listenToComments(theoryId, callback) {
        if (this.useFirestore && window.firebaseDB) {
            return window.firebaseDB.listenToComments(theoryId, callback);
        }

        // No real-time updates in localStorage mode
        return () => {};
    }

    /**
     * Stop listening to a theory
     */
    stopListening(theoryId) {
        if (this.useFirestore && window.firebaseDB) {
            window.firebaseDB.stopListening(theoryId);
        }
    }

    /**
     * Handle user login
     */
    onUserLogin() {
        // Refresh theory displays
        this.refreshTheoryDisplays();
    }

    /**
     * Handle user logout
     */
    onUserLogout() {
        // Refresh theory displays
        this.refreshTheoryDisplays();
    }

    /**
     * Refresh all theory displays on page
     */
    refreshTheoryDisplays() {
        // Trigger custom event for theory widgets to refresh
        window.dispatchEvent(new CustomEvent('theoriesUpdated'));
    }

    /**
     * Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            'pattern': '🔗',
            'archaeological': '🏛️',
            'textual': '📖',
            'alternative': '🧬',
            'geographic': '🗺️',
            'timeline': '⏳',
            'physics': '⚛️',
            'general': '💡'
        };
        return icons[category] || '💭';
    }

    /**
     * Get category name
     */
    getCategoryName(category) {
        const names = {
            'pattern': 'Pattern Connections',
            'archaeological': 'Archaeological Correlations',
            'textual': 'Textual Analysis',
            'alternative': 'Alternative Interpretations',
            'geographic': 'Geographic Correlations',
            'timeline': 'Timeline Analysis',
            'physics': 'Physics Integration',
            'general': 'General Theory'
        };
        return names[category] || category;
    }

    /**
     * Format date
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }
}

// Create global instance
window.userTheories = new UserTheories();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserTheories;
}
