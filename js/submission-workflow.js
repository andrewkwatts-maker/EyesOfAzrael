/**
 * Submission Workflow System
 * Handles user submissions, admin approval queue, and notifications
 */

class SubmissionWorkflow {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
    }

    /**
     * Initialize the submission workflow
     */
    async init() {
        if (this.initialized) return;

        try {
            if (!firebase || !firebase.firestore || !firebase.auth) {
                throw new Error('Firebase not initialized');
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;

            console.log('SubmissionWorkflow initialized');
        } catch (error) {
            console.error('Failed to initialize SubmissionWorkflow:', error);
            throw error;
        }
    }

    /**
     * Create a new submission
     * @param {Object} submissionData - The submission data
     * @param {string} submissionType - Type: 'deity', 'hero', 'creature', 'place', 'item', 'text', 'concept', 'event'
     * @returns {Promise<Object>}
     */
    async createSubmission(submissionData, submissionType) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to create submissions');
        }

        const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const submission = {
            id: submissionId,
            type: submissionType,
            status: 'pending',

            // Submission data (full entity data)
            data: submissionData,

            // Author information
            submittedBy: currentUser.uid,
            submittedByName: currentUser.displayName || currentUser.email,
            submittedByEmail: currentUser.email,
            submittedByAvatar: currentUser.photoURL || null,

            // Timestamps
            submittedAt: now,
            updatedAt: now,

            // Admin review data
            reviewedBy: null,
            reviewedByName: null,
            reviewedAt: null,
            reviewNotes: null,
            rejectionReason: null,

            // Metadata
            mythology: submissionData.mythology || null,
            entityName: submissionData.name || submissionData.title || 'Untitled',

            // Statistics
            views: 0,
            flags: 0
        };

        try {
            await this.db.collection('submissions').doc(submissionId).set(submission);

            // Create notification for user
            await this.createNotification({
                userId: currentUser.uid,
                type: 'submission_created',
                title: 'Submission Created',
                message: `Your ${submissionType} submission "${submission.entityName}" has been submitted for review.`,
                link: `/dashboard.html?highlight=${submissionId}`,
                data: { submissionId, submissionType }
            });

            return { success: true, submissionId, submission };
        } catch (error) {
            console.error('Error creating submission:', error);
            throw new Error('Failed to create submission: ' + error.message);
        }
    }

    /**
     * Update an existing submission (only allowed if status is 'pending' or 'rejected')
     * @param {string} submissionId
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateSubmission(submissionId, updates) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            const submissionRef = this.db.collection('submissions').doc(submissionId);
            const submission = await submissionRef.get();

            if (!submission.exists) {
                throw new Error('Submission not found');
            }

            const data = submission.data();

            // Check ownership
            if (data.submittedBy !== currentUser.uid) {
                throw new Error('You can only update your own submissions');
            }

            // Check status
            if (!['pending', 'rejected'].includes(data.status)) {
                throw new Error('Cannot update approved or processing submissions');
            }

            const updateData = {
                data: updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // If previously rejected, reset status to pending
            if (data.status === 'rejected') {
                updateData.status = 'pending';
                updateData.rejectionReason = null;
            }

            await submissionRef.update(updateData);

            return { success: true, submissionId };
        } catch (error) {
            console.error('Error updating submission:', error);
            throw error;
        }
    }

    /**
     * Delete a submission (only if pending or rejected)
     * @param {string} submissionId
     * @returns {Promise<Object>}
     */
    async deleteSubmission(submissionId) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            const submissionRef = this.db.collection('submissions').doc(submissionId);
            const submission = await submissionRef.get();

            if (!submission.exists) {
                throw new Error('Submission not found');
            }

            const data = submission.data();

            // Check ownership (or admin)
            const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
            const isAdmin = userDoc.exists && userDoc.data().role === 'admin';

            if (data.submittedBy !== currentUser.uid && !isAdmin) {
                throw new Error('You can only delete your own submissions');
            }

            // Check status
            if (!['pending', 'rejected'].includes(data.status) && !isAdmin) {
                throw new Error('Cannot delete approved submissions');
            }

            await submissionRef.delete();

            return { success: true };
        } catch (error) {
            console.error('Error deleting submission:', error);
            throw error;
        }
    }

    /**
     * Get user's submissions
     * @param {Object} options - Filter options
     * @returns {Promise<Array>}
     */
    async getUserSubmissions(options = {}) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            let query = this.db.collection('submissions')
                .where('submittedBy', '==', currentUser.uid);

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
     * Get submission statistics for current user
     * @returns {Promise<Object>}
     */
    async getUserStats() {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            const [pending, approved, rejected] = await Promise.all([
                this.db.collection('submissions')
                    .where('submittedBy', '==', currentUser.uid)
                    .where('status', '==', 'pending')
                    .get(),
                this.db.collection('submissions')
                    .where('submittedBy', '==', currentUser.uid)
                    .where('status', '==', 'approved')
                    .get(),
                this.db.collection('submissions')
                    .where('submittedBy', '==', currentUser.uid)
                    .where('status', '==', 'rejected')
                    .get()
            ]);

            const total = pending.size + approved.size + rejected.size;
            const approvalRate = total > 0 ? ((approved.size / total) * 100).toFixed(1) : 0;

            return {
                total,
                pending: pending.size,
                approved: approved.size,
                rejected: rejected.size,
                approvalRate
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
     * ADMIN: Get all pending submissions
     * @param {Object} options - Filter options
     * @returns {Promise<Array>}
     */
    async getPendingSubmissions(options = {}) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        // Check if user is admin
        const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error('Admin access required');
        }

        try {
            let query = this.db.collection('submissions');

            // Filter by status
            if (options.status) {
                query = query.where('status', '==', options.status);
            } else {
                query = query.where('status', '==', 'pending');
            }

            // Filter by type
            if (options.type) {
                query = query.where('type', '==', options.type);
            }

            // Filter by mythology
            if (options.mythology) {
                query = query.where('mythology', '==', options.mythology);
            }

            // Order by date
            query = query.orderBy('submittedAt', options.sortOrder || 'desc');

            // Pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.startAfter) {
                query = query.startAfter(options.startAfter);
            }

            const snapshot = await query.get();
            return {
                submissions: snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === options.limit
            };
        } catch (error) {
            console.error('Error fetching pending submissions:', error);
            throw error;
        }
    }

    /**
     * ADMIN: Approve submission and move to main collection
     * @param {string} submissionId
     * @param {Object} options - Optional modifications before approval
     * @returns {Promise<Object>}
     */
    async approveSubmission(submissionId, options = {}) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        // Check if user is admin
        const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error('Admin access required');
        }

        try {
            const submissionRef = this.db.collection('submissions').doc(submissionId);
            const submission = await submissionRef.get();

            if (!submission.exists) {
                throw new Error('Submission not found');
            }

            const data = submission.data();

            // Determine target collection based on type
            const collectionMap = {
                'deity': 'deities',
                'hero': 'heroes',
                'creature': 'creatures',
                'place': 'places',
                'item': 'spiritual-items',
                'text': 'texts',
                'concept': 'concepts',
                'event': 'events'
            };

            const targetCollection = collectionMap[data.type];
            if (!targetCollection) {
                throw new Error('Invalid submission type: ' + data.type);
            }

            // Prepare entity data with optional admin modifications
            const entityData = {
                ...data.data,
                ...(options.modifications || {}),

                // Add submission metadata
                contributedBy: data.submittedBy,
                contributorName: data.submittedByName,
                contributedAt: data.submittedAt,
                approvedBy: currentUser.uid,
                approvedByName: currentUser.displayName || currentUser.email,
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'approved',
                isUserContributed: true
            };

            // Generate entity ID
            const entityId = options.entityId || `${data.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create entity in target collection
            await this.db.collection(targetCollection).doc(entityId).set(entityData);

            // Update submission status
            await submissionRef.update({
                status: 'approved',
                reviewedBy: currentUser.uid,
                reviewedByName: currentUser.displayName || currentUser.email,
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewNotes: options.notes || null,
                approvedEntityId: entityId,
                approvedEntityCollection: targetCollection
            });

            // Notify submitter
            await this.createNotification({
                userId: data.submittedBy,
                type: 'submission_approved',
                title: 'Submission Approved!',
                message: `Your ${data.type} submission "${data.entityName}" has been approved and published.`,
                link: `/${targetCollection}/${entityId}.html`,
                data: { submissionId, entityId, entityCollection: targetCollection }
            });

            return { success: true, entityId, entityCollection: targetCollection };
        } catch (error) {
            console.error('Error approving submission:', error);
            throw error;
        }
    }

    /**
     * ADMIN: Reject submission
     * @param {string} submissionId
     * @param {string} reason
     * @returns {Promise<Object>}
     */
    async rejectSubmission(submissionId, reason) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        // Check if user is admin
        const userDoc = await this.db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error('Admin access required');
        }

        try {
            const submissionRef = this.db.collection('submissions').doc(submissionId);
            const submission = await submissionRef.get();

            if (!submission.exists) {
                throw new Error('Submission not found');
            }

            const data = submission.data();

            // Update submission status
            await submissionRef.update({
                status: 'rejected',
                reviewedBy: currentUser.uid,
                reviewedByName: currentUser.displayName || currentUser.email,
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rejectionReason: reason
            });

            // Notify submitter
            await this.createNotification({
                userId: data.submittedBy,
                type: 'submission_rejected',
                title: 'Submission Needs Revision',
                message: `Your ${data.type} submission "${data.entityName}" needs revision. Reason: ${reason}`,
                link: `/dashboard.html?highlight=${submissionId}`,
                data: { submissionId, reason }
            });

            return { success: true };
        } catch (error) {
            console.error('Error rejecting submission:', error);
            throw error;
        }
    }

    /**
     * ADMIN: Bulk approve submissions
     * @param {Array<string>} submissionIds
     * @returns {Promise<Object>}
     */
    async bulkApprove(submissionIds) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of submissionIds) {
            try {
                await this.approveSubmission(id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
        }

        return results;
    }

    /**
     * ADMIN: Bulk reject submissions
     * @param {Array<string>} submissionIds
     * @param {string} reason
     * @returns {Promise<Object>}
     */
    async bulkReject(submissionIds, reason) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of submissionIds) {
            try {
                await this.rejectSubmission(id, reason);
                results.success.push(id);
            } catch (error) {
                results.failed.push({ id, error: error.message });
            }
        }

        return results;
    }

    /**
     * Create a notification for a user
     * @param {Object} notificationData
     * @returns {Promise<void>}
     */
    async createNotification(notificationData) {
        try {
            const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
     * Get user notifications
     * @param {Object} options
     * @returns {Promise<Array>}
     */
    async getUserNotifications(options = {}) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            let query = this.db.collection('notifications')
                .where('userId', '==', currentUser.uid);

            // Filter by read status
            if (options.unreadOnly) {
                query = query.where('read', '==', false);
            }

            // Order by date
            query = query.orderBy('createdAt', 'desc');

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
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId
     * @returns {Promise<void>}
     */
    async markNotificationAsRead(notificationId) {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            const notifRef = this.db.collection('notifications').doc(notificationId);
            const notif = await notifRef.get();

            if (!notif.exists) {
                throw new Error('Notification not found');
            }

            if (notif.data().userId !== currentUser.uid) {
                throw new Error('Cannot access other users\' notifications');
            }

            await notifRef.update({
                read: true,
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     * @returns {Promise<void>}
     */
    async markAllNotificationsAsRead() {
        await this.init();

        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated');
        }

        try {
            const snapshot = await this.db.collection('notifications')
                .where('userId', '==', currentUser.uid)
                .where('read', '==', false)
                .get();

            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    read: true,
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Check for duplicate submissions
     * @param {string} entityName
     * @param {string} mythology
     * @param {string} type
     * @returns {Promise<Array>}
     */
    async checkDuplicates(entityName, mythology, type) {
        await this.init();

        try {
            // Check in main collections
            const collectionMap = {
                'deity': 'deities',
                'hero': 'heroes',
                'creature': 'creatures',
                'place': 'places',
                'item': 'spiritual-items',
                'text': 'texts',
                'concept': 'concepts',
                'event': 'events'
            };

            const targetCollection = collectionMap[type];
            if (!targetCollection) {
                return [];
            }

            const [existingEntities, pendingSubmissions] = await Promise.all([
                this.db.collection(targetCollection)
                    .where('name', '==', entityName)
                    .where('mythology', '==', mythology)
                    .get(),
                this.db.collection('submissions')
                    .where('entityName', '==', entityName)
                    .where('mythology', '==', mythology)
                    .where('type', '==', type)
                    .where('status', '==', 'pending')
                    .get()
            ]);

            const duplicates = [];

            existingEntities.forEach(doc => {
                duplicates.push({
                    type: 'existing',
                    id: doc.id,
                    data: doc.data()
                });
            });

            pendingSubmissions.forEach(doc => {
                duplicates.push({
                    type: 'pending',
                    id: doc.id,
                    data: doc.data()
                });
            });

            return duplicates;
        } catch (error) {
            console.error('Error checking duplicates:', error);
            return [];
        }
    }
}

// Create global instance
window.submissionWorkflow = new SubmissionWorkflow();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubmissionWorkflow;
}
