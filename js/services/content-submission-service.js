/**
 * Content Submission Service
 * Eyes of Azrael Project
 *
 * Handles:
 * - Validation of submission completeness
 * - Submission to Firebase for moderation
 * - Status tracking
 * - User notifications
 */

class ContentSubmissionService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.initialized = false;

        // Entity type to collection mappings
        this.collectionMap = {
            deity: 'deities',
            hero: 'heroes',
            creature: 'creatures',
            item: 'items',
            place: 'places',
            concept: 'concepts',
            magic: 'magic',
            ritual: 'rituals',
            text: 'texts',
            symbol: 'symbols',
            theory: 'user_theories',
            mythology: 'mythologies'
        };

        // Required fields by type
        this.requiredFields = {
            common: ['name', 'primaryMythology', 'shortDescription', 'longDescription', 'type'],
            deity: ['domains'],
            hero: [],
            creature: [],
            item: [],
            place: [],
            concept: [],
            magic: [],
            ritual: [],
            text: [],
            symbol: [],
            theory: [],
            mythology: []
        };

        // Initialize on construction
        this.init();
    }

    /**
     * Initialize the service
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined') {
                console.warn('ContentSubmissionService: Firebase not loaded yet');
                return false;
            }

            if (!firebase.firestore || !firebase.auth) {
                console.warn('ContentSubmissionService: Firebase services not available');
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();

            if (firebase.storage) {
                this.storage = firebase.storage();
            }

            this.initialized = true;
            console.log('ContentSubmissionService initialized');
            return true;
        } catch (error) {
            console.error('ContentSubmissionService init error:', error);
            return false;
        }
    }

    /**
     * Ensure service is initialized
     */
    async ensureInit() {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) {
                throw new Error('Content submission service not initialized. Please ensure Firebase is loaded.');
            }
        }
    }

    /**
     * Submit new content for moderation
     * @param {Object} contentData - The content data
     * @param {string} contentType - Type of content (deity, hero, creature, etc.)
     * @returns {Promise<Object>} Result with submissionId
     */
    async submitContent(contentData, contentType) {
        await this.ensureInit();

        // Check authentication
        const user = this.auth.currentUser;
        if (!user) {
            return {
                success: false,
                error: 'You must be signed in to submit content'
            };
        }

        // Validate content
        const validation = this.validateSubmission(contentData, contentType);
        if (!validation.valid) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validation.errors
            };
        }

        // Check for duplicates
        const duplicates = await this.checkDuplicates(contentData.name, contentData.primaryMythology, contentType);
        if (duplicates.length > 0) {
            return {
                success: false,
                error: 'Similar content already exists',
                duplicates: duplicates
            };
        }

        // Generate submission ID
        const submissionId = this.generateSubmissionId(contentType);
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();

        // Prepare submission document
        const submission = {
            id: submissionId,
            type: contentType,
            status: 'pending',

            // Content data
            data: this.sanitizeContentData(contentData),

            // Entity identification
            entityName: contentData.name,
            mythology: contentData.primaryMythology,
            slug: contentData.slug || this.generateSlug(contentData.name),

            // Author information
            submittedBy: user.uid,
            submittedByName: user.displayName || user.email,
            submittedByEmail: user.email,
            submittedByAvatar: user.photoURL || null,

            // Timestamps
            submittedAt: timestamp,
            updatedAt: timestamp,

            // Review fields (to be filled by moderator)
            reviewedBy: null,
            reviewedByName: null,
            reviewedAt: null,
            reviewNotes: null,
            rejectionReason: null,

            // Approval tracking
            approvedEntityId: null,
            approvedEntityCollection: null,

            // Metrics
            views: 0,
            flags: 0,

            // Version tracking
            version: 1,
            previousVersions: []
        };

        try {
            // Save to submissions collection
            await this.db.collection('submissions').doc(submissionId).set(submission);

            // Create notification for user
            await this.createNotification({
                userId: user.uid,
                type: 'submission_created',
                title: 'Content Submitted',
                message: `Your ${contentType} "${contentData.name}" has been submitted for review.`,
                link: `/dashboard.html?submission=${submissionId}`,
                data: { submissionId, contentType }
            });

            // Update user's submission count
            await this.incrementUserSubmissionCount(user.uid);

            return {
                success: true,
                submissionId: submissionId,
                message: 'Content submitted successfully for review'
            };

        } catch (error) {
            console.error('Submission error:', error);
            return {
                success: false,
                error: 'Failed to submit content: ' + error.message
            };
        }
    }

    /**
     * Validate submission data
     * @param {Object} data - Content data to validate
     * @param {string} type - Content type
     * @returns {Object} Validation result
     */
    validateSubmission(data, type) {
        const errors = [];
        const warnings = [];

        // Check common required fields
        for (const field of this.requiredFields.common) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Check type-specific required fields
        const typeFields = this.requiredFields[type] || [];
        for (const field of typeFields) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`Missing required field for ${type}: ${field}`);
            }
        }

        // Validate name length
        if (data.name && data.name.length > 200) {
            errors.push('Name must be 200 characters or less');
        }

        // Validate short description length
        if (data.shortDescription && data.shortDescription.length > 500) {
            errors.push('Short description must be 500 characters or less');
        }

        // Validate long description length
        if (data.longDescription && data.longDescription.length > 50000) {
            errors.push('Long description must be 50,000 characters or less');
        }

        // Validate mythology
        const validMythologies = [
            'greek', 'roman', 'norse', 'egyptian', 'celtic', 'hindu', 'buddhist',
            'christian', 'jewish', 'islamic', 'japanese', 'chinese', 'sumerian',
            'babylonian', 'aztec', 'mayan', 'yoruba', 'polynesian', 'native-american',
            'slavic', 'finnish', 'persian', 'african', 'other'
        ];

        if (data.primaryMythology && !validMythologies.includes(data.primaryMythology.toLowerCase())) {
            warnings.push(`Unknown mythology: ${data.primaryMythology}. Consider using a standard mythology name.`);
        }

        // Validate SVG icon if present
        if (data.svgIcon) {
            const svgValidation = this.validateSVG(data.svgIcon);
            if (!svgValidation.valid) {
                errors.push(...svgValidation.errors.map(e => `SVG Icon: ${e}`));
            }
        }

        // Validate URLs in sources
        if (data.sources && Array.isArray(data.sources)) {
            data.sources.forEach((source, idx) => {
                if (source.url && !this.isValidUrl(source.url)) {
                    warnings.push(`Source ${idx + 1} has invalid URL`);
                }
            });
        }

        // Content quality checks (warnings only)
        if (data.shortDescription && data.shortDescription.length < 20) {
            warnings.push('Short description seems too brief. Consider adding more detail.');
        }

        if (data.longDescription && data.longDescription.length < 100) {
            warnings.push('Long description seems too brief. Consider adding more detail for better quality.');
        }

        if (!data.tags || data.tags.length === 0) {
            warnings.push('No tags provided. Adding tags improves discoverability.');
        }

        if (!data.sources || data.sources.length === 0) {
            warnings.push('No sources provided. Adding sources improves credibility.');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate SVG code
     */
    validateSVG(svgCode) {
        const errors = [];

        if (!svgCode || typeof svgCode !== 'string') {
            return { valid: false, errors: ['Invalid SVG code'] };
        }

        if (!svgCode.includes('<svg')) {
            errors.push('Not a valid SVG - missing <svg> tag');
        }

        if (!svgCode.includes('</svg>')) {
            errors.push('SVG not properly closed');
        }

        // Check for dangerous content
        if (/<script/i.test(svgCode) || /javascript:/i.test(svgCode) || /on\w+=/i.test(svgCode)) {
            errors.push('SVG contains potentially dangerous content');
        }

        // Check size
        if (svgCode.length > 100000) {
            errors.push('SVG is too large (max 100KB)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check for duplicate content
     * @param {string} name - Entity name
     * @param {string} mythology - Primary mythology
     * @param {string} type - Content type
     * @returns {Promise<Array>} Array of duplicate entries
     */
    async checkDuplicates(name, mythology, type) {
        await this.ensureInit();

        const duplicates = [];
        const collection = this.collectionMap[type];

        if (!collection) return duplicates;

        try {
            // Check main collection
            const mainQuery = await this.db.collection(collection)
                .where('name', '==', name)
                .get();

            mainQuery.forEach(doc => {
                const data = doc.data();
                if (data.primaryMythology === mythology || data.mythology === mythology) {
                    duplicates.push({
                        type: 'existing',
                        id: doc.id,
                        name: data.name,
                        mythology: data.primaryMythology || data.mythology,
                        collection: collection
                    });
                }
            });

            // Check pending submissions
            const pendingQuery = await this.db.collection('submissions')
                .where('entityName', '==', name)
                .where('mythology', '==', mythology)
                .where('type', '==', type)
                .where('status', '==', 'pending')
                .get();

            pendingQuery.forEach(doc => {
                duplicates.push({
                    type: 'pending',
                    id: doc.id,
                    name: doc.data().entityName,
                    mythology: doc.data().mythology
                });
            });

        } catch (error) {
            console.error('Duplicate check error:', error);
        }

        return duplicates;
    }

    /**
     * Sanitize content data before saving
     */
    sanitizeContentData(data) {
        const sanitized = { ...data };

        // Remove any potential XSS vectors from text fields
        const textFields = ['name', 'shortDescription', 'longDescription'];
        for (const field of textFields) {
            if (sanitized[field]) {
                sanitized[field] = this.sanitizeText(sanitized[field]);
            }
        }

        // Sanitize SVG if present
        if (sanitized.svgIcon) {
            sanitized.svgIcon = this.sanitizeSVG(sanitized.svgIcon);
        }

        // Sanitize extended content
        if (sanitized.extendedContent && Array.isArray(sanitized.extendedContent)) {
            sanitized.extendedContent = sanitized.extendedContent.map(section => ({
                title: this.sanitizeText(section.title || ''),
                content: this.sanitizeText(section.content || '')
            }));
        }

        // Sanitize tags
        if (sanitized.tags && Array.isArray(sanitized.tags)) {
            sanitized.tags = sanitized.tags.map(tag =>
                tag.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50)
            ).filter(tag => tag.length > 0);
        }

        return sanitized;
    }

    /**
     * Sanitize text content
     */
    sanitizeText(text) {
        if (!text) return '';

        // Remove script tags and javascript
        let sanitized = text
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');

        return sanitized.trim();
    }

    /**
     * Sanitize SVG code
     */
    sanitizeSVG(svgCode) {
        if (!svgCode) return '';

        return svgCode
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:[^"']*/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .trim();
    }

    /**
     * Generate submission ID
     */
    generateSubmissionId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `sub_${type}_${timestamp}_${random}`;
    }

    /**
     * Generate slug from name
     */
    generateSlug(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);
    }

    /**
     * Validate URL
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Create user notification
     */
    async createNotification(notificationData) {
        try {
            const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            await this.db.collection('notifications').doc(notificationId).set({
                id: notificationId,
                userId: notificationData.userId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                link: notificationData.link || null,
                data: notificationData.data || null,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Error creating notification:', error);
            // Don't throw - notifications are non-critical
        }
    }

    /**
     * Increment user's submission count
     */
    async incrementUserSubmissionCount(userId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                await userRef.update({
                    submissionCount: firebase.firestore.FieldValue.increment(1),
                    lastSubmission: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error updating user submission count:', error);
        }
    }

    /**
     * Get user's submissions
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} Array of submissions
     */
    async getUserSubmissions(options = {}) {
        await this.ensureInit();

        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Not authenticated');
        }

        try {
            let query = this.db.collection('submissions')
                .where('submittedBy', '==', user.uid);

            // Filter by status
            if (options.status) {
                query = query.where('status', '==', options.status);
            }

            // Filter by type
            if (options.type) {
                query = query.where('type', '==', options.type);
            }

            // Order by date
            query = query.orderBy('submittedAt', 'desc');

            // Limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error fetching user submissions:', error);
            throw error;
        }
    }

    /**
     * Get submission by ID
     */
    async getSubmission(submissionId) {
        await this.ensureInit();

        try {
            const doc = await this.db.collection('submissions').doc(submissionId).get();

            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data()
            };

        } catch (error) {
            console.error('Error fetching submission:', error);
            throw error;
        }
    }

    /**
     * Update a submission (only if pending or rejected)
     */
    async updateSubmission(submissionId, updates) {
        await this.ensureInit();

        const user = this.auth.currentUser;
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const submissionRef = this.db.collection('submissions').doc(submissionId);
            const submission = await submissionRef.get();

            if (!submission.exists) {
                return { success: false, error: 'Submission not found' };
            }

            const data = submission.data();

            // Check ownership
            if (data.submittedBy !== user.uid) {
                return { success: false, error: 'You can only update your own submissions' };
            }

            // Check status
            if (!['pending', 'rejected'].includes(data.status)) {
                return { success: false, error: 'Cannot update approved submissions' };
            }

            // Save previous version
            const previousVersions = data.previousVersions || [];
            previousVersions.push({
                data: data.data,
                updatedAt: data.updatedAt,
                version: data.version
            });

            // Prepare update
            const updateData = {
                data: this.sanitizeContentData(updates),
                entityName: updates.name || data.entityName,
                mythology: updates.primaryMythology || data.mythology,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: (data.version || 1) + 1,
                previousVersions: previousVersions.slice(-5) // Keep last 5 versions
            };

            // If rejected, reset to pending
            if (data.status === 'rejected') {
                updateData.status = 'pending';
                updateData.rejectionReason = null;
            }

            await submissionRef.update(updateData);

            return { success: true, message: 'Submission updated successfully' };

        } catch (error) {
            console.error('Error updating submission:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a submission
     */
    async deleteSubmission(submissionId) {
        await this.ensureInit();

        const user = this.auth.currentUser;
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const submissionRef = this.db.collection('submissions').doc(submissionId);
            const submission = await submissionRef.get();

            if (!submission.exists) {
                return { success: false, error: 'Submission not found' };
            }

            const data = submission.data();

            // Check ownership
            if (data.submittedBy !== user.uid) {
                return { success: false, error: 'You can only delete your own submissions' };
            }

            // Check status - can only delete pending or rejected
            if (!['pending', 'rejected'].includes(data.status)) {
                return { success: false, error: 'Cannot delete approved submissions' };
            }

            await submissionRef.delete();

            return { success: true, message: 'Submission deleted' };

        } catch (error) {
            console.error('Error deleting submission:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get submission statistics for current user
     */
    async getUserStats() {
        await this.ensureInit();

        const user = this.auth.currentUser;
        if (!user) {
            return null;
        }

        try {
            const [pending, approved, rejected] = await Promise.all([
                this.db.collection('submissions')
                    .where('submittedBy', '==', user.uid)
                    .where('status', '==', 'pending')
                    .get(),
                this.db.collection('submissions')
                    .where('submittedBy', '==', user.uid)
                    .where('status', '==', 'approved')
                    .get(),
                this.db.collection('submissions')
                    .where('submittedBy', '==', user.uid)
                    .where('status', '==', 'rejected')
                    .get()
            ]);

            const total = pending.size + approved.size + rejected.size;

            return {
                total,
                pending: pending.size,
                approved: approved.size,
                rejected: rejected.size,
                approvalRate: total > 0 ? Math.round((approved.size / total) * 100) : 0
            };

        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                approvalRate: 0
            };
        }
    }

    /**
     * Subscribe to submission status changes
     * @param {string} submissionId - Submission ID to watch
     * @param {Function} callback - Called when status changes
     * @returns {Function} Unsubscribe function
     */
    subscribeToSubmission(submissionId, callback) {
        if (!this.db) {
            console.error('Database not initialized');
            return () => {};
        }

        return this.db.collection('submissions').doc(submissionId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                } else {
                    callback(null);
                }
            }, error => {
                console.error('Subscription error:', error);
                callback(null, error);
            });
    }

    /**
     * Upload image for submission
     * @param {File} file - Image file
     * @param {string} submissionId - Associated submission ID
     * @returns {Promise<string>} Image URL
     */
    async uploadImage(file, submissionId) {
        await this.ensureInit();

        if (!this.storage) {
            throw new Error('Storage not available');
        }

        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Not authenticated');
        }

        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error('Image must be less than 5MB');
        }

        try {
            const filename = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
            const path = `submissions/${user.uid}/${submissionId}/${filename}`;

            const ref = this.storage.ref(path);
            await ref.put(file);

            const url = await ref.getDownloadURL();
            return url;

        } catch (error) {
            console.error('Upload error:', error);
            throw new Error('Failed to upload image: ' + error.message);
        }
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.ContentSubmissionService = ContentSubmissionService;
    window.contentSubmissionService = new ContentSubmissionService();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSubmissionService;
}
