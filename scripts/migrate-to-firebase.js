/**
 * Firebase Migration Tool
 * Migrates user theories from localStorage to Firebase Firestore
 */

class FirebaseMigrationTool {
    constructor() {
        this.firebase = null;
        this.firestore = null;
        this.auth = null;
        this.currentUser = null;

        this.localTheories = [];
        this.selectedTheories = new Set();
        this.migrationResults = {
            total: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        this.isPaused = false;
        this.currentStep = 1;

        this.init();
    }

    /**
     * Initialize the migration tool
     */
    async init() {
        // Wait for Firebase to load
        await this.waitForFirebase();

        // Initialize Firebase
        this.initFirebase();

        // Set up event listeners
        this.setupEventListeners();

        // Start with step 1
        this.startStep1();
    }

    /**
     * Wait for Firebase SDK to load
     */
    waitForFirebase() {
        return new Promise((resolve) => {
            if (typeof firebase !== 'undefined') {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (typeof firebase !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    /**
     * Initialize Firebase
     */
    initFirebase() {
        try {
            // Firebase should be initialized by firebase-config.js
            // If not, we'll need to initialize it here
            this.firebase = firebase;
            this.firestore = firebase.firestore();
            this.auth = firebase.auth();

            // Listen for auth state changes
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });

            console.log('Firebase initialized for migration');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            this.showError('Failed to initialize Firebase. Please check your configuration.');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Google Sign-In button
        document.getElementById('btn-google-signin')?.addEventListener('click', () => {
            this.signInWithGoogle();
        });

        // Select all checkbox
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Start migration button
        document.getElementById('btn-start-migration')?.addEventListener('click', () => {
            this.startMigration();
        });

        // Pause migration button
        document.getElementById('btn-pause-migration')?.addEventListener('click', () => {
            this.togglePause();
        });

        // Browse theories button
        document.getElementById('btn-browse-theories')?.addEventListener('click', () => {
            window.location.href = '../theories/user-submissions/browse.html';
        });

        // View report button
        document.getElementById('btn-view-report')?.addEventListener('click', () => {
            this.showDetailedReport();
        });

        // Download report button
        document.getElementById('btn-download-report')?.addEventListener('click', () => {
            this.downloadReport();
        });
    }

    /**
     * Step 1: Detect localStorage data
     */
    async startStep1() {
        const detectionLoading = document.getElementById('detection-loading');
        const detectionResult = document.getElementById('detection-result');

        // Simulate detection delay
        await this.sleep(500);

        // Load theories from localStorage
        this.localTheories = this.detectLocalStorageData();

        // Hide loading, show results
        detectionLoading.classList.add('hidden');
        detectionResult.classList.remove('hidden');

        if (this.localTheories.length > 0) {
            // Show theories found
            document.getElementById('theories-found').classList.remove('hidden');
            document.getElementById('theory-count').textContent = this.localTheories.length;

            // Initialize all as selected
            this.localTheories.forEach(theory => {
                this.selectedTheories.add(theory.id);
            });

            // Mark step 1 as complete, activate step 2
            this.completeStep(1);
            this.activateStep(2);
        } else {
            // No theories found
            document.getElementById('no-theories').classList.remove('hidden');
        }
    }

    /**
     * Detect and load localStorage data
     */
    detectLocalStorageData() {
        try {
            const theoriesJSON = localStorage.getItem('userTheories');
            if (!theoriesJSON) {
                return [];
            }

            const theories = JSON.parse(theoriesJSON);
            return Array.isArray(theories) ? theories : [];
        } catch (error) {
            console.error('Error reading localStorage:', error);
            return [];
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await this.auth.signInWithPopup(provider);
            // User info will be handled by onAuthStateChanged
        } catch (error) {
            console.error('Sign-in error:', error);

            if (error.code === 'auth/popup-closed-by-user') {
                this.showError('Sign-in cancelled. Please try again.');
            } else {
                this.showError('Failed to sign in with Google: ' + error.message);
            }
        }
    }

    /**
     * Handle auth state changes
     */
    handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;

            // Update UI
            document.getElementById('sign-in-prompt').classList.add('hidden');
            document.getElementById('user-signed-in').classList.remove('hidden');
            document.getElementById('user-name').textContent = user.displayName || 'Anonymous';
            document.getElementById('user-email').textContent = user.email || '';
            document.getElementById('user-avatar').src = user.photoURL || this.generateAvatar(user.displayName);

            // Complete step 2, activate step 3
            this.completeStep(2);
            this.activateStep(3);

            // Load theory list
            this.loadTheoryList();
        } else {
            this.currentUser = null;
        }
    }

    /**
     * Load theory list
     */
    loadTheoryList() {
        const theoryList = document.getElementById('theory-list');
        theoryList.innerHTML = '';

        if (this.localTheories.length === 0) {
            theoryList.innerHTML = '<p style="color: #888; text-align: center;">No theories to migrate</p>';
            return;
        }

        this.localTheories.forEach((theory, index) => {
            const theoryItem = this.createTheoryListItem(theory, index);
            theoryList.appendChild(theoryItem);
        });

        this.updateSelectedCount();

        // Enable start migration button
        document.getElementById('btn-start-migration').disabled = false;

        // Activate step 4
        this.activateStep(4);
    }

    /**
     * Create theory list item
     */
    createTheoryListItem(theory, index) {
        const item = document.createElement('div');
        item.className = 'theory-item';
        item.dataset.theoryId = theory.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'theory-checkbox';
        checkbox.checked = this.selectedTheories.has(theory.id);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedTheories.add(theory.id);
            } else {
                this.selectedTheories.delete(theory.id);
            }
            this.updateSelectedCount();
        });

        const info = document.createElement('div');
        info.className = 'theory-info';

        const title = document.createElement('div');
        title.className = 'theory-title';
        title.textContent = theory.title || 'Untitled Theory';

        const meta = document.createElement('div');
        meta.className = 'theory-meta';
        const author = theory.author || 'Unknown';
        const date = theory.createdAt ? new Date(theory.createdAt).toLocaleDateString() : 'Unknown date';
        const category = theory.category || theory.topicName || 'General';
        meta.textContent = `By ${author} • ${date} • ${category}`;

        info.appendChild(title);
        info.appendChild(meta);

        const status = document.createElement('span');
        status.className = 'theory-status pending';
        status.textContent = 'Pending';
        status.dataset.statusElement = true;

        item.appendChild(checkbox);
        item.appendChild(info);
        item.appendChild(status);

        return item;
    }

    /**
     * Toggle select all
     */
    toggleSelectAll(checked) {
        this.selectedTheories.clear();

        if (checked) {
            this.localTheories.forEach(theory => {
                this.selectedTheories.add(theory.id);
            });
        }

        // Update checkboxes
        document.querySelectorAll('.theory-checkbox').forEach((checkbox, index) => {
            if (checkbox.id !== 'select-all') {
                checkbox.checked = checked;
            }
        });

        this.updateSelectedCount();
    }

    /**
     * Update selected count
     */
    updateSelectedCount() {
        document.getElementById('selected-count').textContent = this.selectedTheories.size;
    }

    /**
     * Start migration process
     */
    async startMigration() {
        if (this.selectedTheories.size === 0) {
            this.showError('Please select at least one theory to migrate.');
            return;
        }

        if (!this.currentUser) {
            this.showError('You must be signed in to migrate theories.');
            return;
        }

        // Reset results
        this.migrationResults = {
            total: this.selectedTheories.size,
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        // Update UI
        document.getElementById('btn-start-migration').disabled = true;
        document.getElementById('btn-pause-migration').classList.remove('hidden');
        document.getElementById('migration-log').classList.remove('hidden');
        this.activateStep(4);

        // Migrate each selected theory
        let current = 0;
        for (const theory of this.localTheories) {
            if (!this.selectedTheories.has(theory.id)) {
                continue;
            }

            // Check if paused
            while (this.isPaused) {
                await this.sleep(100);
            }

            current++;
            this.updateProgress(current, this.selectedTheories.size);

            try {
                await this.migrateTheory(theory, this.currentUser.uid);
                this.migrationResults.successful++;
                this.updateTheoryStatus(theory.id, 'success', 'Migrated');
                this.logMessage(`✓ Migrated: ${theory.title}`, 'success');
            } catch (error) {
                this.migrationResults.failed++;
                this.migrationResults.errors.push({
                    theory: theory.title,
                    error: error.message
                });
                this.updateTheoryStatus(theory.id, 'error', 'Failed');
                this.logMessage(`✗ Failed: ${theory.title} - ${error.message}`, 'error');
            }

            // Small delay between migrations
            await this.sleep(200);
        }

        // Migration complete
        this.completeMigration();
    }

    /**
     * Migrate a single theory to Firestore
     */
    async migrateTheory(theory, userId) {
        // Validate theory data
        if (!this.validateTheory(theory)) {
            throw new Error('Theory failed validation');
        }

        // Update theory status
        this.updateTheoryStatus(theory.id, 'migrating', 'Migrating...');

        // Transform theory data for Firestore
        const firestoreTheory = this.transformTheoryForFirestore(theory, userId);

        // Create theory document
        const theoryRef = await this.firestore.collection('theories').add(firestoreTheory);
        const theoryId = theoryRef.id;

        // Migrate votes as subcollection
        if (theory.voters && theory.voters.length > 0) {
            await this.migrateVotes(theoryId, theory.voters, userId);
        }

        // Migrate comments as subcollection
        if (theory.comments && theory.comments.length > 0) {
            await this.migrateComments(theoryId, theory.comments, userId);
        }

        // Handle images (convert to placeholders or keep URLs)
        await this.migrateImages(theory, theoryId);

        return theoryId;
    }

    /**
     * Validate theory data
     */
    validateTheory(theory) {
        if (!theory.title || theory.title.trim().length < 5) {
            return false;
        }

        // Check for content
        const hasRichContent = theory.richContent && theory.richContent.panels && theory.richContent.panels.length > 0;
        const hasSimpleContent = theory.content && theory.content.trim().length >= 50;

        if (!hasRichContent && !hasSimpleContent) {
            return false;
        }

        return true;
    }

    /**
     * Transform theory data for Firestore
     */
    transformTheoryForFirestore(theory, userId) {
        const now = firebase.firestore.Timestamp.now();
        const createdAt = theory.createdAt
            ? firebase.firestore.Timestamp.fromDate(new Date(theory.createdAt))
            : now;

        return {
            title: theory.title.trim(),
            summary: theory.summary || '',
            content: theory.content || '',
            richContent: theory.richContent || null,

            // Taxonomy
            topic: theory.topic || null,
            topicName: theory.topicName || null,
            topicIcon: theory.topicIcon || null,
            subtopic: theory.subtopic || null,
            subtopicName: theory.subtopicName || null,

            // Legacy category
            category: theory.category || theory.topic || 'general',

            // Author info (current user who is doing the migration)
            authorId: userId,
            authorName: this.currentUser.displayName || 'Anonymous',
            authorEmail: this.currentUser.email || '',
            authorAvatar: this.currentUser.photoURL || this.generateAvatar(this.currentUser.displayName),

            // Original author from localStorage (preserved in metadata)
            originalAuthor: theory.author || 'Unknown',
            originalAuthorAvatar: theory.authorAvatar || '',

            // Metadata
            sources: theory.sources || '',
            relatedMythologies: theory.relatedMythologies || [],
            relatedPage: theory.relatedPage || null,
            tags: theory.tags || [],

            // Stats
            votes: theory.votes || 0,
            views: theory.views || 0,
            commentCount: (theory.comments || []).length,

            // Status
            status: 'published',

            // Timestamps
            createdAt: createdAt,
            updatedAt: now,
            migratedAt: now,
            migratedFrom: 'localStorage'
        };
    }

    /**
     * Migrate votes to subcollection
     */
    async migrateVotes(theoryId, voters, userId) {
        const batch = this.firestore.batch();

        for (const voter of voters) {
            // Create a unique voter ID (use hash of username or generate new)
            const voterId = this.generateVoterId(voter.username);
            const voteRef = this.firestore.collection('theories').doc(theoryId)
                .collection('votes').doc(voterId);

            batch.set(voteRef, {
                direction: voter.direction || 1,
                voterName: voter.username || 'Anonymous',
                createdAt: voter.votedAt
                    ? firebase.firestore.Timestamp.fromDate(new Date(voter.votedAt))
                    : firebase.firestore.Timestamp.now()
            });
        }

        await batch.commit();
    }

    /**
     * Migrate comments to subcollection
     */
    async migrateComments(theoryId, comments, userId) {
        const batch = this.firestore.batch();

        for (const comment of comments) {
            const commentRef = this.firestore.collection('theories').doc(theoryId)
                .collection('comments').doc();

            batch.set(commentRef, {
                content: comment.content || '',
                authorName: comment.author || 'Anonymous',
                authorAvatar: comment.authorAvatar || this.generateAvatar(comment.author),
                createdAt: comment.createdAt
                    ? firebase.firestore.Timestamp.fromDate(new Date(comment.createdAt))
                    : firebase.firestore.Timestamp.now(),
                votes: comment.votes || 0
            });
        }

        await batch.commit();
    }

    /**
     * Handle image migration
     * For now, we keep external URLs as-is and convert local references to placeholders
     */
    async migrateImages(theory, theoryId) {
        // Check richContent for images
        if (theory.richContent && theory.richContent.panels) {
            for (const panel of theory.richContent.panels) {
                if (panel.imageUrl) {
                    // Keep external URLs, flag local references
                    if (!panel.imageUrl.startsWith('http')) {
                        console.warn(`Local image reference found: ${panel.imageUrl}`);
                        // Could upload to Firebase Storage here in the future
                    }
                }
            }
        }

        // Note: Actual image upload to Firebase Storage would be implemented here
        // For now, we preserve URLs as-is
    }

    /**
     * Generate voter ID from username
     */
    generateVoterId(username) {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            const char = username.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'voter_' + Math.abs(hash).toString(36);
    }

    /**
     * Generate avatar URL
     */
    generateAvatar(name) {
        return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
    }

    /**
     * Update progress bar
     */
    updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        progressFill.style.width = percentage + '%';
        progressFill.textContent = percentage + '%';
        progressText.textContent = `Migrating ${current} of ${total} theories...`;
    }

    /**
     * Update theory status in list
     */
    updateTheoryStatus(theoryId, statusClass, statusText) {
        const theoryItem = document.querySelector(`[data-theory-id="${theoryId}"]`);
        if (theoryItem) {
            const statusElement = theoryItem.querySelector('[data-status-element]');
            if (statusElement) {
                statusElement.className = `theory-status ${statusClass}`;
                statusElement.textContent = statusText;
            }

            if (statusClass === 'success') {
                theoryItem.classList.add('migrated');
            } else if (statusClass === 'error') {
                theoryItem.classList.add('error');
            }
        }
    }

    /**
     * Log migration message
     */
    logMessage(message, type = 'info') {
        const log = document.getElementById('migration-log');
        const entry = document.createElement('div');
        entry.style.padding = '5px 0';
        entry.style.color = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#b8b8d1';
        entry.textContent = message;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    /**
     * Toggle pause
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('btn-pause-migration');
        btn.textContent = this.isPaused ? 'Resume Migration' : 'Pause Migration';
    }

    /**
     * Complete migration
     */
    completeMigration() {
        // Update UI
        document.getElementById('btn-pause-migration').classList.add('hidden');
        document.getElementById('progress-text').textContent = 'Migration complete!';

        // Show summary
        this.showMigrationSummary();

        // Complete step 4, activate step 5
        this.completeStep(4);
        this.activateStep(5);
    }

    /**
     * Show migration summary
     */
    showMigrationSummary() {
        const summary = document.getElementById('migration-summary');
        summary.classList.remove('hidden');

        // Update stats
        document.getElementById('stat-total').textContent = this.migrationResults.total;
        document.getElementById('stat-success').textContent = this.migrationResults.successful;
        document.getElementById('stat-failed').textContent = this.migrationResults.failed;
        document.getElementById('stat-skipped').textContent = this.migrationResults.skipped;

        // Show errors if any
        if (this.migrationResults.failed > 0) {
            const errorSummary = document.getElementById('error-summary');
            const errorList = document.getElementById('error-list');
            errorSummary.classList.remove('hidden');

            errorList.innerHTML = '';
            this.migrationResults.errors.forEach(error => {
                const errorItem = document.createElement('div');
                errorItem.className = 'error-item';
                errorItem.innerHTML = `<strong>${error.theory}:</strong> ${error.error}`;
                errorList.appendChild(errorItem);
            });
        }
    }

    /**
     * Show detailed report in new window
     */
    showDetailedReport() {
        const reportWindow = window.open('migration-report-template.html', '_blank');
        if (reportWindow) {
            // Pass migration results to the new window
            reportWindow.migrationResults = this.migrationResults;
            reportWindow.migratedTheories = this.localTheories.filter(t =>
                this.selectedTheories.has(t.id)
            );
        }
    }

    /**
     * Download report as JSON
     */
    downloadReport() {
        const report = {
            timestamp: new Date().toISOString(),
            user: {
                name: this.currentUser?.displayName,
                email: this.currentUser?.email
            },
            results: this.migrationResults,
            theories: this.localTheories.filter(t => this.selectedTheories.has(t.id)).map(t => ({
                id: t.id,
                title: t.title,
                author: t.author,
                createdAt: t.createdAt,
                status: this.migrationResults.errors.some(e => e.theory === t.title) ? 'failed' : 'success'
            }))
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migration-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create error message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message error';
        messageEl.textContent = message;
        messageEl.style.marginTop = '15px';

        // Append to current step
        const currentStepEl = document.getElementById(`step-${this.currentStep}`);
        if (currentStepEl) {
            currentStepEl.querySelector('.step-content').appendChild(messageEl);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }

    /**
     * Complete a step
     */
    completeStep(stepNumber) {
        const step = document.getElementById(`step-${stepNumber}`);
        if (step) {
            step.classList.add('completed');
            step.classList.remove('active');
        }
    }

    /**
     * Activate a step
     */
    activateStep(stepNumber) {
        const step = document.getElementById(`step-${stepNumber}`);
        if (step) {
            step.classList.add('active');
            this.currentStep = stepNumber;
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize migration tool when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.migrationTool = new FirebaseMigrationTool();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseMigrationTool;
}
