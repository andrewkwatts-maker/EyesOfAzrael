/**
 * Firebase Content Database Operations
 * Extended database class for managing all mythology content types
 * Handles migration and storage of default and user-submitted content
 */

class FirebaseContentDB {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.cache = new Map();

        // Content type validation schemas
        this.contentTypes = {
            deity: 'deity',
            hero: 'hero',
            creature: 'creature',
            place: 'place',
            concept: 'concept',
            ritual: 'ritual',
            magic: 'magic',
            herb: 'herb',
            symbol: 'symbol',
            text: 'text',
            archetype: 'archetype',
            cosmology: 'cosmology',
            lineage: 'lineage',
            event: 'event'
        };
    }

    /**
     * Initialize Firestore database
     */
    async init() {
        if (this.initialized) return;

        try {
            if (!firebase || !firebase.firestore) {
                throw new Error('Firebase not initialized. Make sure firebase-init.js is loaded first.');
            }

            this.db = firebase.firestore();

            // Enable offline persistence
            try {
                await this.db.enablePersistence({ synchronizeTabs: true });
                console.log('FirebaseContentDB: Offline persistence enabled');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence available in one tab only');
                } else if (err.code === 'unimplemented') {
                    console.warn('Browser does not support persistence');
                }
            }

            this.initialized = true;
            console.log('FirebaseContentDB initialized');
        } catch (error) {
            console.error('Failed to initialize FirebaseContentDB:', error);
            throw error;
        }
    }

    /**
     * Generate content ID
     * Format: default_{mythology}_{contentType}_{slug} for defaults
     *         user_{userId}_{contentType}_{timestamp} for user content
     */
    generateContentId(contentData, isDefault = false) {
        const slug = this.slugify(contentData.title);

        if (isDefault) {
            return `default_${contentData.mythology}_${contentData.contentType}_${slug}`;
        } else {
            const userId = firebase.auth().currentUser?.uid || 'anonymous';
            const timestamp = Date.now();
            return `user_${userId}_${contentData.contentType}_${timestamp}_${slug.substring(0, 20)}`;
        }
    }

    /**
     * Create slug from title
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/-+/g, '-')       // Replace multiple hyphens with single
            .trim();
    }

    /**
     * Validate content type
     */
    validateContentType(contentType) {
        if (!this.contentTypes[contentType]) {
            throw new Error(`Invalid content type: ${contentType}. Must be one of: ${Object.keys(this.contentTypes).join(', ')}`);
        }
        return true;
    }

    /**
     * Validate base content fields
     */
    validateBaseContent(contentData) {
        const errors = [];

        // Required fields
        if (!contentData.title || contentData.title.trim().length < 1) {
            errors.push('Title is required and must not be empty');
        }
        if (contentData.title && contentData.title.length > 200) {
            errors.push('Title must be 200 characters or less');
        }
        if (!contentData.contentType) {
            errors.push('Content type is required');
        }
        if (!contentData.mythology) {
            errors.push('Mythology is required');
        }
        if (!contentData.section) {
            errors.push('Section is required');
        }
        if (!contentData.summary || contentData.summary.trim().length < 10) {
            errors.push('Summary is required and must be at least 10 characters');
        }

        // Validate content type
        try {
            this.validateContentType(contentData.contentType);
        } catch (error) {
            errors.push(error.message);
        }

        return errors;
    }

    /**
     * Validate deity-specific attributes
     */
    validateDeityAttributes(attributes) {
        const errors = [];

        if (!attributes) {
            errors.push('Deity attributes are required');
            return errors;
        }

        // Validate array fields
        const arrayFields = ['titles', 'domains', 'symbols', 'sacredAnimals', 'sacredPlants'];
        arrayFields.forEach(field => {
            if (attributes[field] && !Array.isArray(attributes[field])) {
                errors.push(`${field} must be an array`);
            }
        });

        return errors;
    }

    /**
     * Validate hero-specific attributes
     */
    validateHeroAttributes(attributes) {
        const errors = [];

        if (!attributes) {
            errors.push('Hero attributes are required');
            return errors;
        }

        // Validate array fields
        const arrayFields = ['parentage', 'notableDeeds', 'weapons', 'companions'];
        arrayFields.forEach(field => {
            if (attributes[field] && !Array.isArray(attributes[field])) {
                errors.push(`${field} must be an array`);
            }
        });

        return errors;
    }

    /**
     * Validate creature-specific attributes
     */
    validateCreatureAttributes(attributes) {
        const errors = [];

        if (!attributes) {
            errors.push('Creature attributes are required');
            return errors;
        }

        // Validate array fields
        const arrayFields = ['abilities', 'weaknesses'];
        arrayFields.forEach(field => {
            if (attributes[field] && !Array.isArray(attributes[field])) {
                errors.push(`${field} must be an array`);
            }
        });

        return errors;
    }

    /**
     * Create new content (default or user-submitted)
     */
    async createContent(contentData, options = {}) {
        await this.init();

        const isDefault = options.isDefault || false;
        const currentUser = firebase.auth().currentUser;

        // User submissions require authentication
        if (!isDefault && !currentUser) {
            throw new Error('User must be authenticated to create user-submitted content');
        }

        // Validate base content
        const validationErrors = this.validateBaseContent(contentData);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        // Validate content-type-specific attributes
        if (contentData.attributes) {
            let attrErrors = [];
            switch (contentData.contentType) {
                case 'deity':
                    attrErrors = this.validateDeityAttributes(contentData.attributes);
                    break;
                case 'hero':
                    attrErrors = this.validateHeroAttributes(contentData.attributes);
                    break;
                case 'creature':
                    attrErrors = this.validateCreatureAttributes(contentData.attributes);
                    break;
                // Add other content type validations as needed
            }
            if (attrErrors.length > 0) {
                throw new Error(`Attribute validation failed: ${attrErrors.join(', ')}`);
            }
        }

        // Generate content ID
        const contentId = options.contentId || this.generateContentId(contentData, isDefault);
        const now = firebase.firestore.FieldValue.serverTimestamp();

        // Build content document
        const content = {
            // Identity
            id: contentId,
            contentType: contentData.contentType,

            // Core info
            title: contentData.title.trim(),
            subtitle: contentData.subtitle?.trim() || '',
            summary: contentData.summary.trim(),

            // Rich content
            richContent: contentData.richContent || { panels: [] },

            // Taxonomy
            mythology: contentData.mythology,
            mythologyName: contentData.mythologyName || this.getMythologyDisplayName(contentData.mythology),
            section: contentData.section,
            sectionName: contentData.sectionName || this.getSectionDisplayName(contentData.section),

            // Categorization
            tags: contentData.tags || [],
            relatedContent: contentData.relatedContent || [],
            relatedMythologies: contentData.relatedMythologies || [],

            // Media
            icon: contentData.icon || '',
            imageUrl: contentData.imageUrl || null,
            imageUrls: contentData.imageUrls || [],

            // Content-type-specific attributes
            attributes: contentData.attributes || {},

            // Additional type-specific fields
            ...(contentData.pantheon && { pantheon: contentData.pantheon }),
            ...(contentData.role && { role: contentData.role }),
            ...(contentData.alignment && { alignment: contentData.alignment }),
            ...(contentData.heroType && { heroType: contentData.heroType }),
            ...(contentData.creatureType && { creatureType: contentData.creatureType }),

            // Source & Attribution
            isDefault: isDefault,
            sources: contentData.sources || '',

            // Timestamps
            createdAt: now,
            updatedAt: now
        };

        // Add author info for user submissions
        if (!isDefault && currentUser) {
            content.authorId = currentUser.uid;
            content.authorName = currentUser.displayName || currentUser.email;
            content.authorAvatar = currentUser.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}&background=9333ea&color=fff`;
        } else {
            content.authorId = null;
            content.authorName = null;
            content.authorAvatar = null;
        }

        // Status and visibility
        content.status = contentData.status || (isDefault ? 'published' : 'draft');
        content.visibility = contentData.visibility || 'public';

        // Stats
        content.views = 0;
        content.votes = 0;
        content.commentsCount = 0;

        try {
            await this.db.collection('content').doc(contentId).set(content);

            // Update cache
            const contentWithDates = {
                ...content,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.cache.set(contentId, contentWithDates);

            console.log(`Content created: ${contentId} (${isDefault ? 'default' : 'user'})`);
            return { success: true, contentId, content: contentWithDates };
        } catch (error) {
            console.error('Error creating content:', error);
            throw error;
        }
    }

    /**
     * Batch create multiple content items (for migration)
     */
    async batchCreateContent(contentArray, options = {}) {
        await this.init();

        const results = {
            successful: [],
            failed: [],
            total: contentArray.length
        };

        const batchSize = 500; // Firestore batch limit
        const batches = [];

        for (let i = 0; i < contentArray.length; i += batchSize) {
            const batch = this.db.batch();
            const chunk = contentArray.slice(i, i + batchSize);

            for (const contentData of chunk) {
                try {
                    // Validate
                    const validationErrors = this.validateBaseContent(contentData);
                    if (validationErrors.length > 0) {
                        results.failed.push({
                            content: contentData,
                            error: `Validation failed: ${validationErrors.join(', ')}`
                        });
                        continue;
                    }

                    // Generate ID
                    const contentId = this.generateContentId(contentData, options.isDefault || false);
                    const now = firebase.firestore.Timestamp.now();

                    // Build document
                    const content = {
                        id: contentId,
                        contentType: contentData.contentType,
                        title: contentData.title.trim(),
                        subtitle: contentData.subtitle?.trim() || '',
                        summary: contentData.summary.trim(),
                        richContent: contentData.richContent || { panels: [] },
                        mythology: contentData.mythology,
                        mythologyName: contentData.mythologyName || this.getMythologyDisplayName(contentData.mythology),
                        section: contentData.section,
                        sectionName: contentData.sectionName || this.getSectionDisplayName(contentData.section),
                        tags: contentData.tags || [],
                        relatedContent: contentData.relatedContent || [],
                        relatedMythologies: contentData.relatedMythologies || [],
                        icon: contentData.icon || '',
                        imageUrl: contentData.imageUrl || null,
                        imageUrls: contentData.imageUrls || [],
                        attributes: contentData.attributes || {},
                        isDefault: options.isDefault || false,
                        sources: contentData.sources || '',
                        authorId: null,
                        authorName: null,
                        authorAvatar: null,
                        status: contentData.status || 'published',
                        visibility: contentData.visibility || 'public',
                        views: 0,
                        votes: 0,
                        commentsCount: 0,
                        createdAt: now,
                        updatedAt: now
                    };

                    // Add type-specific fields
                    if (contentData.pantheon) content.pantheon = contentData.pantheon;
                    if (contentData.role) content.role = contentData.role;
                    if (contentData.alignment) content.alignment = contentData.alignment;

                    const docRef = this.db.collection('content').doc(contentId);
                    batch.set(docRef, content);

                    results.successful.push({ contentId, title: content.title });
                } catch (error) {
                    results.failed.push({
                        content: contentData,
                        error: error.message
                    });
                }
            }

            batches.push(batch);
        }

        // Commit all batches
        console.log(`Committing ${batches.length} batches...`);
        for (let i = 0; i < batches.length; i++) {
            try {
                await batches[i].commit();
                console.log(`Batch ${i + 1}/${batches.length} committed`);
            } catch (error) {
                console.error(`Batch ${i + 1} failed:`, error);
                throw error;
            }
        }

        console.log(`Batch upload complete: ${results.successful.length} successful, ${results.failed.length} failed`);
        return results;
    }

    /**
     * Get content by ID
     */
    async getContent(contentId, useCache = true) {
        await this.init();

        if (useCache && this.cache.has(contentId)) {
            return this.cache.get(contentId);
        }

        try {
            const doc = await this.db.collection('content').doc(contentId).get();

            if (!doc.exists) {
                return null;
            }

            const content = this.convertTimestamps(doc.data());
            this.cache.set(contentId, content);
            return content;
        } catch (error) {
            console.error('Error getting content:', error);
            throw error;
        }
    }

    /**
     * Query content with filters
     */
    async queryContent(filters = {}) {
        await this.init();

        try {
            let query = this.db.collection('content');

            // Apply filters
            if (filters.isDefault !== undefined) {
                query = query.where('isDefault', '==', filters.isDefault);
            }

            if (filters.contentType) {
                query = query.where('contentType', '==', filters.contentType);
            }

            if (filters.mythology) {
                query = query.where('mythology', '==', filters.mythology);
            }

            if (filters.section) {
                query = query.where('section', '==', filters.section);
            }

            if (filters.status) {
                query = query.where('status', '==', filters.status);
            } else {
                query = query.where('status', '==', 'published');
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
                case 'alphabetical':
                    query = query.orderBy('title', 'asc');
                    break;
            }

            // Apply pagination
            const limit = filters.limit || 50;
            query = query.limit(limit);

            if (filters.startAfter) {
                query = query.startAfter(filters.startAfter);
            }

            const snapshot = await query.get();
            const content = snapshot.docs.map(doc => this.convertTimestamps(doc.data()));

            return {
                content,
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === limit
            };
        } catch (error) {
            console.error('Error querying content:', error);
            throw error;
        }
    }

    /**
     * Get mythology display name
     */
    getMythologyDisplayName(mythology) {
        const mythologyNames = {
            greek: 'Greek Mythology',
            roman: 'Roman Mythology',
            norse: 'Norse Mythology',
            egyptian: 'Egyptian Mythology',
            hindu: 'Hindu Mythology',
            chinese: 'Chinese Mythology',
            japanese: 'Japanese Mythology',
            celtic: 'Celtic Mythology',
            slavic: 'Slavic Mythology',
            aztec: 'Aztec Mythology',
            mayan: 'Mayan Mythology',
            sumerian: 'Sumerian Mythology',
            christian: 'Christian Tradition',
            jewish: 'Jewish Tradition',
            islamic: 'Islamic Tradition',
            buddhist: 'Buddhist Tradition'
        };
        return mythologyNames[mythology] || mythology.charAt(0).toUpperCase() + mythology.slice(1);
    }

    /**
     * Get section display name
     */
    getSectionDisplayName(section) {
        const sectionNames = {
            deities: 'Deities',
            heroes: 'Heroes',
            creatures: 'Creatures',
            places: 'Places',
            cosmology: 'Cosmology',
            concepts: 'Concepts',
            rituals: 'Rituals',
            magic: 'Magic',
            herbs: 'Sacred Herbs',
            symbols: 'Symbols',
            texts: 'Sacred Texts',
            archetypes: 'Archetypes',
            lineage: 'Lineage',
            events: 'Events'
        };
        return sectionNames[section] || section.charAt(0).toUpperCase() + section.slice(1);
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

        if (data.publishedAt && data.publishedAt.toDate) {
            converted.publishedAt = data.publishedAt.toDate();
        }

        return converted;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Content cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            contentIds: Array.from(this.cache.keys())
        };
    }
}

// Create global instance
window.firebaseContentDB = new FirebaseContentDB();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseContentDB;
}
