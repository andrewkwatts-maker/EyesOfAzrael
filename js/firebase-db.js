/**
 * Firebase Firestore Database Operations
 * Handles all CRUD operations for user theories in Firestore
 */

class FirebaseDB {
    constructor() {
        this.db = null;
        this.unsubscribers = new Map(); // Track real-time listeners
        this.cache = new Map(); // Local cache to reduce reads
        this.initialized = false;
    }

    /**
     * Initialize Firestore database
     */
    async init() {
        if (this.initialized) return;

        try {
            // Wait for Firebase to be initialized
            if (!firebase || !firebase.firestore) {
                throw new Error('Firebase not initialized. Make sure firebase-init.js is loaded first.');
            }

            this.db = firebase.firestore();

            // Enable offline persistence
            try {
                await this.db.enablePersistence({ synchronizeTabs: true });
                console.log('Firestore offline persistence enabled');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence available in one tab only');
                } else if (err.code === 'unimplemented') {
                    console.warn('Browser does not support persistence');
                }
            }

            this.initialized = true;
            console.log('FirebaseDB initialized');
        } catch (error) {
            console.error('Failed to initialize FirebaseDB:', error);
            throw error;
        }
    }

    /**
     * Generate unique theory ID
     */
    generateTheoryId() {
        return `theory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create new theory
     */
    async createTheory(theoryData) {
        await this.init();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to create theories');
        }

        const theoryId = this.generateTheoryId();
        const now = firebase.firestore.FieldValue.serverTimestamp();

        const theory = {
            id: theoryId,
            title: theoryData.title.trim(),
            summary: theoryData.summary?.trim() || '',
            content: theoryData.content?.trim() || '',

            // Rich content support
            richContent: theoryData.richContent || null,

            // Taxonomy
            topic: theoryData.topic || null,
            topicName: theoryData.topicName || null,
            topicIcon: theoryData.topicIcon || null,
            subtopic: theoryData.subtopic || null,
            subtopicName: theoryData.subtopicName || null,

            // Legacy support
            category: theoryData.category || theoryData.topic || 'general',

            // Metadata
            sources: theoryData.sources?.trim() || '',
            relatedMythologies: theoryData.relatedMythologies || [],
            relatedPage: theoryData.relatedPage || null,
            tags: theoryData.tags || [],

            // Author info
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email,
            authorAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=9333ea&color=fff`,

            // Stats
            votes: 0,
            views: 0,
            status: 'published',

            // Timestamps
            createdAt: now,
            updatedAt: now
        };

        try {
            await this.db.collection('theories').doc(theoryId).set(theory);

            // Add to cache
            theory.createdAt = new Date();
            theory.updatedAt = new Date();
            this.cache.set(theoryId, theory);

            console.log('Theory created:', theoryId);
            return { success: true, theoryId, theory };
        } catch (error) {
            console.error('Error creating theory:', error);
            throw error;
        }
    }

    /**
     * Update existing theory
     */
    async updateTheory(theoryId, updates) {
        await this.init();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to update theories');
        }

        try {
            // First check ownership
            const theoryRef = this.db.collection('theories').doc(theoryId);
            const doc = await theoryRef.get();

            if (!doc.exists) {
                throw new Error('Theory not found');
            }

            const theory = doc.data();
            if (theory.authorId !== currentUser.uid) {
                throw new Error('You can only edit your own theories');
            }

            // Prepare update data
            const updateData = {
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Only update provided fields
            const allowedFields = ['title', 'summary', 'content', 'richContent', 'topic', 'topicName',
                                  'topicIcon', 'subtopic', 'subtopicName', 'category', 'sources',
                                  'relatedMythologies', 'relatedPage', 'tags', 'status'];

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    updateData[field] = updates[field];
                }
            });

            await theoryRef.update(updateData);

            // Update cache
            if (this.cache.has(theoryId)) {
                this.cache.set(theoryId, { ...this.cache.get(theoryId), ...updateData, updatedAt: new Date() });
            }

            console.log('Theory updated:', theoryId);
            return { success: true, theoryId };
        } catch (error) {
            console.error('Error updating theory:', error);
            throw error;
        }
    }

    /**
     * Delete theory (soft delete)
     */
    async deleteTheory(theoryId) {
        await this.init();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to delete theories');
        }

        try {
            const theoryRef = this.db.collection('theories').doc(theoryId);
            const doc = await theoryRef.get();

            if (!doc.exists) {
                throw new Error('Theory not found');
            }

            const theory = doc.data();
            if (theory.authorId !== currentUser.uid) {
                throw new Error('You can only delete your own theories');
            }

            // Soft delete
            await theoryRef.update({
                status: 'deleted',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Remove from cache
            this.cache.delete(theoryId);

            console.log('Theory deleted:', theoryId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting theory:', error);
            throw error;
        }
    }

    /**
     * Get theory by ID
     */
    async getTheory(theoryId, useCache = true) {
        await this.init();

        // Check cache first
        if (useCache && this.cache.has(theoryId)) {
            return this.cache.get(theoryId);
        }

        try {
            const doc = await this.db.collection('theories').doc(theoryId).get();

            if (!doc.exists) {
                return null;
            }

            const theory = this.convertTimestamps(doc.data());

            // Add to cache
            this.cache.set(theoryId, theory);

            return theory;
        } catch (error) {
            console.error('Error getting theory:', error);
            throw error;
        }
    }

    /**
     * Get all theories with filters
     */
    async getTheories(filters = {}) {
        await this.init();

        try {
            let query = this.db.collection('theories');

            // Apply filters
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            } else {
                query = query.where('status', '==', 'published');
            }

            if (filters.topic) {
                query = query.where('topic', '==', filters.topic);
            }

            if (filters.subtopic) {
                query = query.where('subtopic', '==', filters.subtopic);
            }

            if (filters.authorId) {
                query = query.where('authorId', '==', filters.authorId);
            }

            if (filters.author) {
                query = query.where('authorName', '==', filters.author);
            }

            // Apply sorting
            const sortBy = filters.sortBy || 'newest';
            switch (sortBy) {
                case 'newest':
                    query = query.orderBy('createdAt', 'desc');
                    break;
                case 'oldest':
                    query = query.orderBy('createdAt', 'asc');
                    break;
                case 'popular':
                    query = query.orderBy('votes', 'desc');
                    break;
                case 'views':
                    query = query.orderBy('views', 'desc');
                    break;
            }

            // Apply pagination
            const limit = filters.limit || 20;
            query = query.limit(limit);

            if (filters.startAfter) {
                query = query.startAfter(filters.startAfter);
            }

            const snapshot = await query.get();
            const theories = snapshot.docs.map(doc => this.convertTimestamps(doc.data()));

            // Cache results
            theories.forEach(theory => {
                this.cache.set(theory.id, theory);
            });

            return {
                theories,
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === limit
            };
        } catch (error) {
            console.error('Error getting theories:', error);
            throw error;
        }
    }

    /**
     * Search theories (limited - client-side filtering)
     * Note: Firestore doesn't have full-text search, so we need to filter on client
     */
    async searchTheories(searchTerm, filters = {}) {
        await this.init();

        // Get all theories matching filters
        const result = await this.getTheories({ ...filters, limit: 100 });

        // Filter on client side
        const searchLower = searchTerm.toLowerCase();
        const filtered = result.theories.filter(theory => {
            const inTitle = theory.title.toLowerCase().includes(searchLower);
            const inContent = theory.content?.toLowerCase().includes(searchLower);
            const inSummary = theory.summary?.toLowerCase().includes(searchLower);
            const inPanels = theory.richContent?.panels?.some(p =>
                p.title?.toLowerCase().includes(searchLower) ||
                p.content?.toLowerCase().includes(searchLower)
            );

            return inTitle || inContent || inSummary || inPanels;
        });

        return {
            theories: filtered,
            hasMore: false // No pagination for search
        };
    }

    /**
     * Vote on theory using transaction to prevent race conditions
     */
    async voteTheory(theoryId, direction = 1) {
        await this.init();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to vote');
        }

        try {
            const voteRef = this.db.collection('theories').doc(theoryId)
                              .collection('votes').doc(currentUser.uid);
            const theoryRef = this.db.collection('theories').doc(theoryId);

            await this.db.runTransaction(async (transaction) => {
                const voteDoc = await transaction.get(voteRef);
                const theoryDoc = await transaction.get(theoryRef);

                if (!theoryDoc.exists) {
                    throw new Error('Theory not found');
                }

                const theory = theoryDoc.data();
                let newVoteCount = theory.votes || 0;

                if (voteDoc.exists) {
                    // User already voted
                    const existingVote = voteDoc.data();

                    if (existingVote.direction === direction) {
                        // Remove vote
                        transaction.delete(voteRef);
                        newVoteCount -= direction;
                    } else {
                        // Change vote
                        transaction.update(voteRef, {
                            direction,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        newVoteCount = newVoteCount - existingVote.direction + direction;
                    }
                } else {
                    // New vote
                    transaction.set(voteRef, {
                        direction,
                        userId: currentUser.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    newVoteCount += direction;
                }

                // Update theory vote count
                transaction.update(theoryRef, { votes: newVoteCount });
            });

            // Update cache
            if (this.cache.has(theoryId)) {
                const theory = await this.getTheory(theoryId, false);
                this.cache.set(theoryId, theory);
            }

            console.log('Vote recorded:', theoryId, direction);
            return { success: true };
        } catch (error) {
            console.error('Error voting on theory:', error);
            throw error;
        }
    }

    /**
     * Add comment to theory
     */
    async addComment(theoryId, content) {
        await this.init();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error('User must be authenticated to comment');
        }

        if (!content || content.trim().length < 3) {
            throw new Error('Comment must be at least 3 characters');
        }

        try {
            const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const commentRef = this.db.collection('theories').doc(theoryId)
                                 .collection('comments').doc(commentId);

            const comment = {
                id: commentId,
                content: content.trim(),
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                authorAvatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=9333ea&color=fff`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await commentRef.set(comment);

            console.log('Comment added:', commentId);
            return { success: true, commentId, comment: { ...comment, createdAt: new Date() } };
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    /**
     * Get comments for theory
     */
    async getComments(theoryId) {
        await this.init();

        try {
            const snapshot = await this.db.collection('theories').doc(theoryId)
                                     .collection('comments')
                                     .orderBy('createdAt', 'desc')
                                     .get();

            return snapshot.docs.map(doc => this.convertTimestamps(doc.data()));
        } catch (error) {
            console.error('Error getting comments:', error);
            throw error;
        }
    }

    /**
     * Get user's vote on theory
     */
    async getUserVote(theoryId) {
        await this.init();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return null;

        try {
            const doc = await this.db.collection('theories').doc(theoryId)
                              .collection('votes').doc(currentUser.uid).get();

            if (!doc.exists) return null;

            return this.convertTimestamps(doc.data());
        } catch (error) {
            console.error('Error getting user vote:', error);
            return null;
        }
    }

    /**
     * Increment view count
     */
    async incrementViews(theoryId) {
        await this.init();

        try {
            await this.db.collection('theories').doc(theoryId).update({
                views: firebase.firestore.FieldValue.increment(1)
            });

            // Update cache
            if (this.cache.has(theoryId)) {
                const theory = this.cache.get(theoryId);
                theory.views = (theory.views || 0) + 1;
                this.cache.set(theoryId, theory);
            }
        } catch (error) {
            console.error('Error incrementing views:', error);
            // Don't throw - view counting is not critical
        }
    }

    /**
     * Listen for real-time updates to a theory
     */
    listenToTheory(theoryId, callback) {
        if (!this.initialized) {
            console.warn('FirebaseDB not initialized. Call init() first.');
            return () => {};
        }

        const unsubscribe = this.db.collection('theories').doc(theoryId)
            .onSnapshot(
                (doc) => {
                    if (doc.exists) {
                        const theory = this.convertTimestamps(doc.data());
                        this.cache.set(theoryId, theory);
                        callback(theory);
                    } else {
                        callback(null);
                    }
                },
                (error) => {
                    console.error('Error listening to theory:', error);
                    callback(null, error);
                }
            );

        this.unsubscribers.set(`theory_${theoryId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Listen for real-time updates to theory comments
     */
    listenToComments(theoryId, callback) {
        if (!this.initialized) {
            console.warn('FirebaseDB not initialized. Call init() first.');
            return () => {};
        }

        const unsubscribe = this.db.collection('theories').doc(theoryId)
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const comments = snapshot.docs.map(doc => this.convertTimestamps(doc.data()));
                    callback(comments);
                },
                (error) => {
                    console.error('Error listening to comments:', error);
                    callback([], error);
                }
            );

        this.unsubscribers.set(`comments_${theoryId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Listen for real-time updates to theory votes
     */
    listenToVotes(theoryId, callback) {
        if (!this.initialized) {
            console.warn('FirebaseDB not initialized. Call init() first.');
            return () => {};
        }

        const unsubscribe = this.db.collection('theories').doc(theoryId)
            .collection('votes')
            .onSnapshot(
                (snapshot) => {
                    const votes = snapshot.docs.map(doc => this.convertTimestamps(doc.data()));
                    callback(votes);
                },
                (error) => {
                    console.error('Error listening to votes:', error);
                    callback([], error);
                }
            );

        this.unsubscribers.set(`votes_${theoryId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Stop listening to a theory
     */
    stopListening(theoryId) {
        const keys = [`theory_${theoryId}`, `comments_${theoryId}`, `votes_${theoryId}`];
        keys.forEach(key => {
            if (this.unsubscribers.has(key)) {
                this.unsubscribers.get(key)();
                this.unsubscribers.delete(key);
            }
        });
    }

    /**
     * Stop all listeners
     */
    stopAllListeners() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers.clear();
    }

    /**
     * Convert Firestore timestamps to JavaScript Date objects
     */
    convertTimestamps(data) {
        const converted = { ...data };

        if (data.createdAt && data.createdAt.toDate) {
            converted.createdAt = data.createdAt.toDate();
        }

        if (data.updatedAt && data.updatedAt.toDate) {
            converted.updatedAt = data.updatedAt.toDate();
        }

        return converted;
    }

    /**
     * Clear local cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            theories: Array.from(this.cache.keys())
        };
    }
}

// Create global instance
window.firebaseDB = new FirebaseDB();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseDB;
}
