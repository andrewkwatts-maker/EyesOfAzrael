/**
 * Theory Taxonomy System V2
 * Hierarchical structure: Page → Section (optional) → Topic (optional) → User Topic → User Subtopic
 * Maps to actual site structure from data/page-taxonomy.json
 */

class TheoryTaxonomyV2 {
    constructor() {
        this.pageTaxonomy = null;
        this.customUserTopics = this.loadCustomUserTopics();
        this.init();
    }

    async init() {
        // Load page taxonomy from JSON
        try {
            const response = await fetch('/data/page-taxonomy.json');
            this.pageTaxonomy = await response.json();
            console.log('✅ Page taxonomy loaded:', Object.keys(this.pageTaxonomy).length, 'categories');
        } catch (error) {
            console.error('Error loading page taxonomy:', error);
            this.pageTaxonomy = {};
        }
    }

    /**
     * Get all categories (e.g., "greek", "jewish", "christian")
     */
    getCategories() {
        if (!this.pageTaxonomy) return [];
        return Object.entries(this.pageTaxonomy).map(([id, data]) => ({
            id,
            name: data.name,
            path: data.path
        }));
    }

    /**
     * Get sections for a category (e.g., "deities", "heroes")
     */
    getSections(categoryId) {
        if (!this.pageTaxonomy || !this.pageTaxonomy[categoryId]) return [];
        const category = this.pageTaxonomy[categoryId];
        return Object.entries(category.sections || {}).map(([id, data]) => ({
            id,
            name: data.name,
            path: data.path
        }));
    }

    /**
     * Get topics for a category or section
     * If sectionId provided, get topics within that section
     * Otherwise get topics directly under category
     */
    getTopics(categoryId, sectionId = null) {
        if (!this.pageTaxonomy || !this.pageTaxonomy[categoryId]) return [];

        const category = this.pageTaxonomy[categoryId];

        if (sectionId && category.sections && category.sections[sectionId]) {
            // Topics within a section
            const section = category.sections[sectionId];
            return Object.entries(section.topics || {}).map(([id, data]) => ({
                id,
                name: data.name,
                path: data.path
            }));
        } else if (!sectionId) {
            // Topics directly under category
            return Object.entries(category.topics || {}).map(([id, data]) => ({
                id,
                name: data.name,
                path: data.path
            }));
        }

        return [];
    }

    /**
     * Get the full path display for a location
     * @param {string} categoryId - Category ID (required)
     * @param {string} sectionId - Section ID (optional)
     * @param {string} topicId - Topic ID (optional)
     * @returns {string} Human-readable path
     */
    getLocationPath(categoryId, sectionId = null, topicId = null) {
        if (!this.pageTaxonomy || !this.pageTaxonomy[categoryId]) {
            return 'Unknown Location';
        }

        const parts = [this.pageTaxonomy[categoryId].name];

        if (sectionId && this.pageTaxonomy[categoryId].sections[sectionId]) {
            parts.push(this.pageTaxonomy[categoryId].sections[sectionId].name);

            if (topicId && this.pageTaxonomy[categoryId].sections[sectionId].topics[topicId]) {
                parts.push(this.pageTaxonomy[categoryId].sections[sectionId].topics[topicId].name);
            }
        } else if (topicId && this.pageTaxonomy[categoryId].topics && this.pageTaxonomy[categoryId].topics[topicId]) {
            parts.push(this.pageTaxonomy[categoryId].topics[topicId].name);
        }

        return parts.join(' → ');
    }

    /**
     * Get the URL for a location
     */
    getLocationUrl(categoryId, sectionId = null, topicId = null) {
        if (!this.pageTaxonomy || !this.pageTaxonomy[categoryId]) return null;

        const category = this.pageTaxonomy[categoryId];

        if (topicId) {
            if (sectionId && category.sections[sectionId]?.topics[topicId]) {
                return category.sections[sectionId].topics[topicId].path;
            } else if (category.topics && category.topics[topicId]) {
                return category.topics[topicId].path;
            }
        } else if (sectionId && category.sections[sectionId]) {
            return category.sections[sectionId].path;
        }

        return category.path;
    }

    /**
     * Load custom user-defined topics from localStorage
     */
    loadCustomUserTopics() {
        try {
            const stored = localStorage.getItem('customUserTopics');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading custom user topics:', error);
            return {};
        }
    }

    /**
     * Save custom user topics
     */
    saveCustomUserTopics() {
        try {
            localStorage.setItem('customUserTopics', JSON.stringify(this.customUserTopics));
        } catch (error) {
            console.error('Error saving custom user topics:', error);
        }
    }

    /**
     * Add a custom user topic (user can create their own topic names)
     */
    addCustomUserTopic(topicName) {
        const topicId = this.sanitizeId(topicName);
        if (!this.customUserTopics[topicId]) {
            this.customUserTopics[topicId] = {
                name: topicName,
                created: new Date().toISOString(),
                useCount: 0
            };
            this.saveCustomUserTopics();
        }
        return topicId;
    }

    /**
     * Get all custom user topics sorted by usage
     */
    getCustomUserTopics() {
        return Object.entries(this.customUserTopics)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.useCount - a.useCount);
    }

    /**
     * Increment use count for a user topic
     */
    useCustomUserTopic(topicId) {
        if (this.customUserTopics[topicId]) {
            this.customUserTopics[topicId].useCount++;
            this.saveCustomUserTopics();
        }
    }

    /**
     * Sanitize a string for use as an ID
     */
    sanitizeId(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Build Firestore query filters based on taxonomy selection
     */
    buildQueryFilters(filters) {
        const firestoreFilters = [];

        if (filters.page) {
            firestoreFilters.push({ field: 'page', operator: '==', value: filters.page });
        }
        if (filters.section) {
            firestoreFilters.push({ field: 'section', operator: '==', value: filters.section });
        }
        if (filters.topic) {
            firestoreFilters.push({ field: 'topic', operator: '==', value: filters.topic });
        }
        if (filters.userTopic) {
            firestoreFilters.push({ field: 'userTopic', operator: '==', value: filters.userTopic });
        }
        if (filters.userSubtopic) {
            firestoreFilters.push({ field: 'userSubtopic', operator: '==', value: filters.userSubtopic });
        }

        return firestoreFilters;
    }

    /**
     * Get theories link for a specific page/section/topic
     * Returns URL to browse theories for that location
     */
    getTheoriesLinkForLocation(categoryId, sectionId = null, topicId = null) {
        const params = new URLSearchParams();
        params.set('page', categoryId);
        if (sectionId) params.set('section', sectionId);
        if (topicId) params.set('topic', topicId);

        return `/theories/user-submissions/browse.html?${params.toString()}`;
    }

    /**
     * Generate link HTML for inserting into pages
     * This creates a "View User Theories" link for any page
     */
    generateTheoriesLinkHTML(categoryId, sectionId = null, topicId = null) {
        const url = this.getTheoriesLinkForLocation(categoryId, sectionId, topicId);
        const locationName = this.getLocationPath(categoryId, sectionId, topicId);

        return `
            <a href="${url}" class="user-theories-link"
               title="View user-submitted theories about ${locationName}">
                <span class="icon">💭</span>
                <span class="text">User Theories</span>
            </a>
        `;
    }
}

// Create global instance
window.theoryTaxonomy = new TheoryTaxonomyV2();

// For backward compatibility, also expose as taxonomyV2
window.taxonomyV2 = window.theoryTaxonomy;
