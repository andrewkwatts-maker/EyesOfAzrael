/**
 * Content Filter Service
 * Eyes of Azrael Project
 *
 * Handles filtering, sorting, and pagination for user-submitted content.
 * Provides comprehensive tools for organizing and displaying community content.
 *
 * Features:
 * - Multiple sort options (popularity, controversy, date, contribution size)
 * - Controversy score calculation
 * - Contribution size/richness calculation
 * - Multiple filter functions (mythology, type, owner, status, date range)
 * - Pagination with page info
 * - Firestore query helpers
 *
 * Usage:
 *   const filterService = new ContentFilterService();
 *   const sorted = filterService.sortByOption(assets, SortOptions.MOST_POPULAR);
 *   const filtered = filterService.combineFilters(assets, [
 *     { type: 'mythology', value: 'greek' },
 *     { type: 'status', value: 'approved' }
 *   ]);
 *   const page = filterService.paginate(filtered, 1, 20);
 */

/**
 * Sort options enumeration
 */
const SortOptions = {
    MOST_POPULAR: 'most_popular',
    LEAST_POPULAR: 'least_popular',
    MOST_CONTROVERSIAL: 'most_controversial',
    LEAST_CONTROVERSIAL: 'least_controversial',
    NEWEST: 'newest',
    OLDEST: 'oldest',
    BIGGEST_CONTRIBUTION: 'biggest_contribution',
    SMALLEST_CONTRIBUTION: 'smallest_contribution'
};

/**
 * Filter types enumeration
 */
const FilterTypes = {
    MYTHOLOGY: 'mythology',
    TYPE: 'type',
    OWNER: 'owner',
    STATUS: 'status',
    DATE_RANGE: 'date_range'
};

/**
 * Content status enumeration
 */
const ContentStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    FLAGGED: 'flagged',
    REJECTED: 'rejected'
};

class ContentFilterService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.initialized = false;
    }

    /**
     * Initialize the service with Firebase
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined') {
                console.warn('[ContentFilterService] Firebase not loaded yet');
                return false;
            }

            if (firebase.firestore) {
                this.db = firebase.firestore();
            }

            if (firebase.auth) {
                this.auth = firebase.auth();
            }

            this.initialized = true;
            console.log('[ContentFilterService] Initialized');
            return true;
        } catch (error) {
            console.error('[ContentFilterService] Init error:', error);
            return false;
        }
    }

    // ==========================================
    // CONTROVERSY SCORE CALCULATION
    // ==========================================

    /**
     * Calculate controversy score for content
     * Higher score = more controversial (balanced upvotes/downvotes with high engagement)
     *
     * Formula: ratio * Math.log(total + 1)
     * - ratio = min(upvotes, downvotes) / max(upvotes, downvotes)
     * - ratio approaches 1 when votes are balanced
     * - log(total + 1) weights by engagement level
     *
     * Examples:
     * - 50 up, 50 down: ratio=1.0, log(101)=4.6 => score=4.6 (very controversial)
     * - 100 up, 90 down: ratio=0.9, log(191)=5.25 => score=4.7 (controversial)
     * - 100 up, 10 down: ratio=0.1, log(111)=4.7 => score=0.47 (not controversial)
     * - 10 up, 0 down: ratio=0, log(11)=2.4 => score=0 (not controversial)
     *
     * @param {number} upvotes - Total upvotes
     * @param {number} downvotes - Total downvotes
     * @returns {number} Controversy score (0 to ~10 range)
     */
    calculateControversyScore(upvotes, downvotes) {
        upvotes = Math.max(0, upvotes || 0);
        downvotes = Math.max(0, downvotes || 0);

        const total = upvotes + downvotes;
        if (total === 0) return 0;

        const maxVotes = Math.max(upvotes, downvotes);
        const minVotes = Math.min(upvotes, downvotes);

        // Avoid division by zero
        if (maxVotes === 0) return 0;

        const ratio = minVotes / maxVotes;
        const score = ratio * Math.log(total + 1);

        return Math.round(score * 1000) / 1000; // Round to 3 decimal places
    }

    /**
     * Get controversy level label
     * @param {number} score - Controversy score
     * @returns {string} Human-readable level
     */
    getControversyLevel(score) {
        if (score >= 4) return 'highly_controversial';
        if (score >= 2.5) return 'controversial';
        if (score >= 1) return 'somewhat_controversial';
        if (score >= 0.5) return 'mildly_controversial';
        return 'not_controversial';
    }

    // ==========================================
    // CONTRIBUTION SIZE CALCULATION
    // ==========================================

    /**
     * Calculate contribution size/richness score
     * Measures how complete and detailed the content is
     *
     * Scoring:
     * - Text length (description, sections): 1 point per 100 chars (max 50 points)
     * - Section count: 5 points per section (max 25 points)
     * - Relationship count: 3 points per relationship (max 15 points)
     * - Source/citation count: 5 points per source (max 25 points)
     * - Image count: 4 points per image (max 20 points)
     * - Corpus query count: 2 points per query (max 10 points)
     *
     * Total max: ~145 points
     *
     * @param {Object} asset - The asset/content object
     * @returns {number} Contribution size score
     */
    calculateContributionSize(asset) {
        if (!asset) return 0;

        let score = 0;

        // Text length scoring (description + all sections)
        const textContent = this._extractTextContent(asset);
        const textScore = Math.min(50, Math.floor(textContent.length / 100));
        score += textScore;

        // Section count scoring
        const sectionCount = this._countSections(asset);
        const sectionScore = Math.min(25, sectionCount * 5);
        score += sectionScore;

        // Relationship count scoring
        const relationshipCount = this._countRelationships(asset);
        const relationshipScore = Math.min(15, relationshipCount * 3);
        score += relationshipScore;

        // Source/citation count scoring
        const sourceCount = this._countSources(asset);
        const sourceScore = Math.min(25, sourceCount * 5);
        score += sourceScore;

        // Image count scoring
        const imageCount = this._countImages(asset);
        const imageScore = Math.min(20, imageCount * 4);
        score += imageScore;

        // Corpus query count scoring
        const corpusQueryCount = this._countCorpusQueries(asset);
        const corpusScore = Math.min(10, corpusQueryCount * 2);
        score += corpusScore;

        return score;
    }

    /**
     * Get contribution size breakdown
     * @param {Object} asset - The asset/content object
     * @returns {Object} Detailed breakdown of contribution components
     */
    getContributionBreakdown(asset) {
        if (!asset) {
            return {
                textLength: 0,
                sectionCount: 0,
                relationshipCount: 0,
                sourceCount: 0,
                imageCount: 0,
                corpusQueryCount: 0,
                totalScore: 0
            };
        }

        const textContent = this._extractTextContent(asset);
        const sectionCount = this._countSections(asset);
        const relationshipCount = this._countRelationships(asset);
        const sourceCount = this._countSources(asset);
        const imageCount = this._countImages(asset);
        const corpusQueryCount = this._countCorpusQueries(asset);

        return {
            textLength: textContent.length,
            sectionCount,
            relationshipCount,
            sourceCount,
            imageCount,
            corpusQueryCount,
            totalScore: this.calculateContributionSize(asset)
        };
    }

    /**
     * Get contribution size label
     * @param {number} score - Contribution size score
     * @returns {string} Human-readable size label
     */
    getContributionSizeLabel(score) {
        if (score >= 100) return 'comprehensive';
        if (score >= 70) return 'detailed';
        if (score >= 40) return 'moderate';
        if (score >= 20) return 'basic';
        return 'minimal';
    }

    // Private helper methods for contribution size calculation

    _extractTextContent(asset) {
        let text = '';

        // Main description fields
        if (asset.description) text += asset.description;
        if (asset.shortDescription) text += asset.shortDescription;
        if (asset.longDescription) text += asset.longDescription;
        if (asset.summary) text += asset.summary;

        // Extended content sections
        if (asset.extendedContent && Array.isArray(asset.extendedContent)) {
            asset.extendedContent.forEach(section => {
                if (section.title) text += section.title;
                if (section.content) text += section.content;
            });
        }

        // Sections array
        if (asset.sections && Array.isArray(asset.sections)) {
            asset.sections.forEach(section => {
                if (section.title) text += section.title;
                if (section.content) text += section.content;
                if (section.text) text += section.text;
            });
        }

        // Data object sections
        if (asset.data) {
            if (asset.data.description) text += asset.data.description;
            if (asset.data.shortDescription) text += asset.data.shortDescription;
            if (asset.data.longDescription) text += asset.data.longDescription;
            if (asset.data.extendedContent && Array.isArray(asset.data.extendedContent)) {
                asset.data.extendedContent.forEach(section => {
                    if (section.title) text += section.title;
                    if (section.content) text += section.content;
                });
            }
        }

        return text;
    }

    _countSections(asset) {
        let count = 0;

        if (asset.extendedContent && Array.isArray(asset.extendedContent)) {
            count += asset.extendedContent.length;
        }

        if (asset.sections && Array.isArray(asset.sections)) {
            count += asset.sections.length;
        }

        if (asset.data) {
            if (asset.data.extendedContent && Array.isArray(asset.data.extendedContent)) {
                count += asset.data.extendedContent.length;
            }
            if (asset.data.sections && Array.isArray(asset.data.sections)) {
                count += asset.data.sections.length;
            }
        }

        return count;
    }

    _countRelationships(asset) {
        let count = 0;

        if (asset.relationships && Array.isArray(asset.relationships)) {
            count += asset.relationships.length;
        }

        if (asset.relatedEntities && Array.isArray(asset.relatedEntities)) {
            count += asset.relatedEntities.length;
        }

        if (asset.connections && Array.isArray(asset.connections)) {
            count += asset.connections.length;
        }

        if (asset.data) {
            if (asset.data.relationships && Array.isArray(asset.data.relationships)) {
                count += asset.data.relationships.length;
            }
            if (asset.data.relatedEntities && Array.isArray(asset.data.relatedEntities)) {
                count += asset.data.relatedEntities.length;
            }
        }

        return count;
    }

    _countSources(asset) {
        let count = 0;

        if (asset.sources && Array.isArray(asset.sources)) {
            count += asset.sources.length;
        }

        if (asset.citations && Array.isArray(asset.citations)) {
            count += asset.citations.length;
        }

        if (asset.references && Array.isArray(asset.references)) {
            count += asset.references.length;
        }

        if (asset.data) {
            if (asset.data.sources && Array.isArray(asset.data.sources)) {
                count += asset.data.sources.length;
            }
            if (asset.data.citations && Array.isArray(asset.data.citations)) {
                count += asset.data.citations.length;
            }
        }

        return count;
    }

    _countImages(asset) {
        let count = 0;

        if (asset.imageUrl || asset.image || asset.icon) count++;
        if (asset.images && Array.isArray(asset.images)) {
            count += asset.images.length;
        }
        if (asset.gallery && Array.isArray(asset.gallery)) {
            count += asset.gallery.length;
        }

        if (asset.data) {
            if (asset.data.imageUrl || asset.data.image) count++;
            if (asset.data.images && Array.isArray(asset.data.images)) {
                count += asset.data.images.length;
            }
        }

        return count;
    }

    _countCorpusQueries(asset) {
        let count = 0;

        if (asset.corpusQueries && Array.isArray(asset.corpusQueries)) {
            count += asset.corpusQueries.length;
        }

        if (asset.queries && Array.isArray(asset.queries)) {
            count += asset.queries.length;
        }

        if (asset.data) {
            if (asset.data.corpusQueries && Array.isArray(asset.data.corpusQueries)) {
                count += asset.data.corpusQueries.length;
            }
        }

        return count;
    }

    // ==========================================
    // SORTING FUNCTIONS
    // ==========================================

    /**
     * Sort assets by the specified option
     * @param {Array} assets - Array of assets to sort
     * @param {string} sortOption - One of SortOptions values
     * @returns {Array} Sorted array (new array, does not mutate original)
     */
    sortByOption(assets, sortOption) {
        if (!Array.isArray(assets) || assets.length === 0) {
            return [];
        }

        // Create a copy to avoid mutating the original
        const sorted = [...assets];

        switch (sortOption) {
            case SortOptions.MOST_POPULAR:
                return this.sortByMostPopular(sorted);

            case SortOptions.LEAST_POPULAR:
                return this.sortByLeastPopular(sorted);

            case SortOptions.MOST_CONTROVERSIAL:
                return this.sortByMostControversial(sorted);

            case SortOptions.LEAST_CONTROVERSIAL:
                return this.sortByLeastControversial(sorted);

            case SortOptions.NEWEST:
                return this.sortByNewest(sorted);

            case SortOptions.OLDEST:
                return this.sortByOldest(sorted);

            case SortOptions.BIGGEST_CONTRIBUTION:
                return this.sortByBiggestContribution(sorted);

            case SortOptions.SMALLEST_CONTRIBUTION:
                return this.sortBySmallestContribution(sorted);

            default:
                console.warn(`[ContentFilterService] Unknown sort option: ${sortOption}`);
                return sorted;
        }
    }

    /**
     * Sort by most popular (upvotes DESC)
     */
    sortByMostPopular(assets) {
        return assets.sort((a, b) => {
            const aVotes = this._getUpvotes(a);
            const bVotes = this._getUpvotes(b);
            return bVotes - aVotes;
        });
    }

    /**
     * Sort by least popular (upvotes ASC)
     */
    sortByLeastPopular(assets) {
        return assets.sort((a, b) => {
            const aVotes = this._getUpvotes(a);
            const bVotes = this._getUpvotes(b);
            return aVotes - bVotes;
        });
    }

    /**
     * Sort by most controversial (controversy score DESC)
     */
    sortByMostControversial(assets) {
        return assets.sort((a, b) => {
            const aScore = this._getControversyScore(a);
            const bScore = this._getControversyScore(b);
            return bScore - aScore;
        });
    }

    /**
     * Sort by least controversial (controversy score ASC)
     */
    sortByLeastControversial(assets) {
        return assets.sort((a, b) => {
            const aScore = this._getControversyScore(a);
            const bScore = this._getControversyScore(b);
            return aScore - bScore;
        });
    }

    /**
     * Sort by newest (createdAt DESC)
     */
    sortByNewest(assets) {
        return assets.sort((a, b) => {
            const aDate = this._getTimestamp(a);
            const bDate = this._getTimestamp(b);
            return bDate - aDate;
        });
    }

    /**
     * Sort by oldest (createdAt ASC)
     */
    sortByOldest(assets) {
        return assets.sort((a, b) => {
            const aDate = this._getTimestamp(a);
            const bDate = this._getTimestamp(b);
            return aDate - bDate;
        });
    }

    /**
     * Sort by biggest contribution (content size DESC)
     */
    sortByBiggestContribution(assets) {
        return assets.sort((a, b) => {
            const aSize = this.calculateContributionSize(a);
            const bSize = this.calculateContributionSize(b);
            return bSize - aSize;
        });
    }

    /**
     * Sort by smallest contribution (content size ASC)
     */
    sortBySmallestContribution(assets) {
        return assets.sort((a, b) => {
            const aSize = this.calculateContributionSize(a);
            const bSize = this.calculateContributionSize(b);
            return aSize - bSize;
        });
    }

    // Private helpers for sorting

    _getUpvotes(asset) {
        // Check various field names for upvote counts
        if (typeof asset.upvotes === 'number') return asset.upvotes;
        if (typeof asset.upvoteCount === 'number') return asset.upvoteCount;
        if (typeof asset.votes === 'number') return Math.max(0, asset.votes);
        if (typeof asset.likes === 'number') return asset.likes;
        return 0;
    }

    _getDownvotes(asset) {
        if (typeof asset.downvotes === 'number') return asset.downvotes;
        if (typeof asset.downvoteCount === 'number') return asset.downvoteCount;
        return 0;
    }

    _getControversyScore(asset) {
        // Use pre-calculated score if available
        if (typeof asset.controversyScore === 'number') {
            return asset.controversyScore;
        }
        if (typeof asset.contestedScore === 'number') {
            // Convert contestedScore to controversy score
            // contestedScore = (up + down) * 1000 - abs(net)
            // We'll normalize it
            return asset.contestedScore / 100000;
        }

        // Calculate on the fly
        const upvotes = this._getUpvotes(asset);
        const downvotes = this._getDownvotes(asset);
        return this.calculateControversyScore(upvotes, downvotes);
    }

    _getTimestamp(asset) {
        // Check various timestamp fields
        let timestamp = asset.createdAt || asset.submittedAt || asset.timestamp || asset.date;

        if (!timestamp) return 0;

        // Handle Firestore Timestamp objects
        if (timestamp && typeof timestamp.toMillis === 'function') {
            return timestamp.toMillis();
        }

        // Handle Firestore Timestamp-like objects
        if (timestamp && timestamp.seconds) {
            return timestamp.seconds * 1000;
        }

        // Handle Date objects
        if (timestamp instanceof Date) {
            return timestamp.getTime();
        }

        // Handle number (already milliseconds)
        if (typeof timestamp === 'number') {
            return timestamp;
        }

        // Handle ISO string
        if (typeof timestamp === 'string') {
            return new Date(timestamp).getTime();
        }

        return 0;
    }

    // ==========================================
    // FILTER FUNCTIONS
    // ==========================================

    /**
     * Filter assets by mythology
     * @param {Array} assets - Assets to filter
     * @param {string} mythology - Mythology name/id to filter by
     * @returns {Array} Filtered assets
     */
    filterByMythology(assets, mythology) {
        if (!mythology || !Array.isArray(assets)) return assets;

        const mythLower = mythology.toLowerCase();

        return assets.filter(asset => {
            const assetMyth = (
                asset.mythology ||
                asset.primaryMythology ||
                asset.mythologyId ||
                (asset.data && (asset.data.mythology || asset.data.primaryMythology)) ||
                ''
            ).toLowerCase();

            return assetMyth === mythLower || assetMyth.includes(mythLower);
        });
    }

    /**
     * Filter assets by type
     * @param {Array} assets - Assets to filter
     * @param {string} type - Asset type to filter by (deity, creature, hero, etc.)
     * @returns {Array} Filtered assets
     */
    filterByType(assets, type) {
        if (!type || !Array.isArray(assets)) return assets;

        const typeLower = type.toLowerCase();

        return assets.filter(asset => {
            const assetType = (
                asset.type ||
                asset.entityType ||
                asset.contentType ||
                (asset.data && asset.data.type) ||
                ''
            ).toLowerCase();

            // Handle singular/plural variations
            return assetType === typeLower ||
                   assetType === typeLower + 's' ||
                   assetType + 's' === typeLower;
        });
    }

    /**
     * Filter assets by owner (user ID)
     * @param {Array} assets - Assets to filter
     * @param {string} userId - User ID to filter by
     * @returns {Array} Filtered assets
     */
    filterByOwner(assets, userId) {
        if (!userId || !Array.isArray(assets)) return assets;

        return assets.filter(asset => {
            const ownerId = (
                asset.createdBy ||
                asset.userId ||
                asset.ownerId ||
                asset.submittedBy ||
                asset.authorId ||
                (asset.data && (asset.data.createdBy || asset.data.submittedBy)) ||
                ''
            );

            return ownerId === userId;
        });
    }

    /**
     * Filter assets by status
     * @param {Array} assets - Assets to filter
     * @param {string} status - Status to filter by (pending, approved, flagged, rejected)
     * @returns {Array} Filtered assets
     */
    filterByStatus(assets, status) {
        if (!status || !Array.isArray(assets)) return assets;

        const statusLower = status.toLowerCase();

        return assets.filter(asset => {
            const assetStatus = (
                asset.status ||
                asset.moderationStatus ||
                (asset.data && asset.data.status) ||
                ''
            ).toLowerCase();

            return assetStatus === statusLower;
        });
    }

    /**
     * Filter assets by date range
     * @param {Array} assets - Assets to filter
     * @param {Date|number|string} start - Start date (inclusive)
     * @param {Date|number|string} end - End date (inclusive)
     * @returns {Array} Filtered assets
     */
    filterByDateRange(assets, start, end) {
        if (!Array.isArray(assets)) return assets;

        // Convert start/end to timestamps
        const startTime = this._normalizeDate(start);
        const endTime = this._normalizeDate(end);

        // If both are null, return all
        if (startTime === null && endTime === null) return assets;

        return assets.filter(asset => {
            const assetTime = this._getTimestamp(asset);
            if (assetTime === 0) return false;

            if (startTime !== null && assetTime < startTime) return false;
            if (endTime !== null && assetTime > endTime) return false;

            return true;
        });
    }

    /**
     * Combine multiple filters
     * @param {Array} assets - Assets to filter
     * @param {Array} filterArray - Array of filter objects: { type, value } or { type, start, end }
     * @returns {Array} Filtered assets
     */
    combineFilters(assets, filterArray) {
        if (!Array.isArray(assets)) return [];
        if (!Array.isArray(filterArray) || filterArray.length === 0) return assets;

        let result = [...assets];

        for (const filter of filterArray) {
            if (!filter || !filter.type) continue;

            switch (filter.type) {
                case FilterTypes.MYTHOLOGY:
                    result = this.filterByMythology(result, filter.value);
                    break;

                case FilterTypes.TYPE:
                    result = this.filterByType(result, filter.value);
                    break;

                case FilterTypes.OWNER:
                    result = this.filterByOwner(result, filter.value);
                    break;

                case FilterTypes.STATUS:
                    result = this.filterByStatus(result, filter.value);
                    break;

                case FilterTypes.DATE_RANGE:
                    result = this.filterByDateRange(result, filter.start, filter.end);
                    break;

                default:
                    console.warn(`[ContentFilterService] Unknown filter type: ${filter.type}`);
            }
        }

        return result;
    }

    // Helper for date normalization
    _normalizeDate(date) {
        if (!date) return null;

        if (date instanceof Date) return date.getTime();
        if (typeof date === 'number') return date;
        if (typeof date === 'string') {
            const parsed = new Date(date);
            return isNaN(parsed.getTime()) ? null : parsed.getTime();
        }
        if (date && typeof date.toMillis === 'function') return date.toMillis();
        if (date && date.seconds) return date.seconds * 1000;

        return null;
    }

    // ==========================================
    // PAGINATION
    // ==========================================

    /**
     * Paginate an array of assets
     * @param {Array} assets - All assets
     * @param {number} page - Page number (1-indexed)
     * @param {number} limit - Items per page
     * @returns {Array} Paginated subset of assets
     */
    paginate(assets, page = 1, limit = 20) {
        if (!Array.isArray(assets)) return [];

        // Ensure valid values
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return assets.slice(startIndex, endIndex);
    }

    /**
     * Get pagination info
     * @param {number} total - Total number of items
     * @param {number} page - Current page (1-indexed)
     * @param {number} limit - Items per page
     * @returns {Object} Pagination info
     */
    getPageInfo(total, page = 1, limit = 20) {
        // Ensure valid values
        total = Math.max(0, parseInt(total, 10) || 0);
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
        const endItem = Math.min(page * limit, total);

        return {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
            startItem,
            endItem,
            isFirstPage: page === 1,
            isLastPage: page >= totalPages
        };
    }

    // ==========================================
    // FIRESTORE QUERY HELPERS
    // ==========================================

    /**
     * Build a Firestore query with sorting
     * @param {firebase.firestore.CollectionReference} collection - Firestore collection
     * @param {string} sortOption - Sort option
     * @param {number} limit - Max items to fetch
     * @returns {firebase.firestore.Query} Configured query
     */
    buildSortedQuery(collection, sortOption, limit = 50) {
        if (!collection) {
            console.error('[ContentFilterService] No collection provided');
            return null;
        }

        let query = collection;

        switch (sortOption) {
            case SortOptions.MOST_POPULAR:
                query = query.orderBy('upvoteCount', 'desc');
                break;

            case SortOptions.LEAST_POPULAR:
                query = query.orderBy('upvoteCount', 'asc');
                break;

            case SortOptions.MOST_CONTROVERSIAL:
                // Use contestedScore which is pre-calculated
                query = query.orderBy('contestedScore', 'desc');
                break;

            case SortOptions.LEAST_CONTROVERSIAL:
                query = query.orderBy('contestedScore', 'asc');
                break;

            case SortOptions.NEWEST:
                query = query.orderBy('createdAt', 'desc');
                break;

            case SortOptions.OLDEST:
                query = query.orderBy('createdAt', 'asc');
                break;

            case SortOptions.BIGGEST_CONTRIBUTION:
                // Requires contributionScore field to be pre-calculated
                query = query.orderBy('contributionScore', 'desc');
                break;

            case SortOptions.SMALLEST_CONTRIBUTION:
                query = query.orderBy('contributionScore', 'asc');
                break;

            default:
                query = query.orderBy('createdAt', 'desc');
        }

        if (limit > 0) {
            query = query.limit(limit);
        }

        return query;
    }

    /**
     * Build a Firestore query with filters
     * @param {firebase.firestore.CollectionReference} collection - Firestore collection
     * @param {Array} filters - Array of filter objects
     * @returns {firebase.firestore.Query} Configured query
     */
    buildFilteredQuery(collection, filters = []) {
        if (!collection) {
            console.error('[ContentFilterService] No collection provided');
            return null;
        }

        let query = collection;

        for (const filter of filters) {
            if (!filter || !filter.type || filter.value === undefined) continue;

            switch (filter.type) {
                case FilterTypes.MYTHOLOGY:
                    query = query.where('mythology', '==', filter.value);
                    break;

                case FilterTypes.TYPE:
                    query = query.where('type', '==', filter.value);
                    break;

                case FilterTypes.OWNER:
                    query = query.where('createdBy', '==', filter.value);
                    break;

                case FilterTypes.STATUS:
                    query = query.where('status', '==', filter.value);
                    break;

                case FilterTypes.DATE_RANGE:
                    if (filter.start) {
                        const startDate = this._normalizeDate(filter.start);
                        if (startDate) {
                            query = query.where('createdAt', '>=', new Date(startDate));
                        }
                    }
                    if (filter.end) {
                        const endDate = this._normalizeDate(filter.end);
                        if (endDate) {
                            query = query.where('createdAt', '<=', new Date(endDate));
                        }
                    }
                    break;
            }
        }

        return query;
    }

    /**
     * Get required Firestore indexes for efficient queries
     * Returns an array of index definitions that should be created
     * @returns {Array} Index definitions
     */
    getRequiredFirestoreIndexes() {
        return [
            // User assets collection indexes
            {
                collection: 'user_assets',
                fields: ['status', 'upvoteCount'],
                description: 'Sort user assets by popularity with status filter'
            },
            {
                collection: 'user_assets',
                fields: ['status', 'contestedScore'],
                description: 'Sort user assets by controversy with status filter'
            },
            {
                collection: 'user_assets',
                fields: ['status', 'createdAt'],
                description: 'Sort user assets by date with status filter'
            },
            {
                collection: 'user_assets',
                fields: ['status', 'contributionScore'],
                description: 'Sort user assets by contribution size with status filter'
            },
            {
                collection: 'user_assets',
                fields: ['mythology', 'upvoteCount'],
                description: 'Sort user assets by popularity within mythology'
            },
            {
                collection: 'user_assets',
                fields: ['mythology', 'createdAt'],
                description: 'Sort user assets by date within mythology'
            },
            {
                collection: 'user_assets',
                fields: ['type', 'upvoteCount'],
                description: 'Sort user assets by popularity within type'
            },
            {
                collection: 'user_assets',
                fields: ['type', 'createdAt'],
                description: 'Sort user assets by date within type'
            },
            {
                collection: 'user_assets',
                fields: ['createdBy', 'createdAt'],
                description: 'Get user\'s assets sorted by date'
            },
            {
                collection: 'user_assets',
                fields: ['createdBy', 'upvoteCount'],
                description: 'Get user\'s assets sorted by popularity'
            },

            // Submissions collection indexes
            {
                collection: 'submissions',
                fields: ['status', 'submittedAt'],
                description: 'Filter submissions by status and date'
            },
            {
                collection: 'submissions',
                fields: ['submittedBy', 'status'],
                description: 'Get user submissions by status'
            },
            {
                collection: 'submissions',
                fields: ['type', 'status', 'submittedAt'],
                description: 'Filter submissions by type and status'
            },

            // Assets collection indexes (for mixed content)
            {
                collection: 'assets',
                fields: ['totalEngagement', 'contestedScore'],
                description: 'Get contested items with minimum engagement'
            },
            {
                collection: 'assets',
                fields: ['votes', 'createdAt'],
                description: 'Sort assets by votes and date'
            }
        ];
    }

    /**
     * Log required Firestore indexes to console
     * Useful for developers setting up the database
     */
    logRequiredIndexes() {
        const indexes = this.getRequiredFirestoreIndexes();

        console.group('[ContentFilterService] Required Firestore Indexes');
        console.log('Add these composite indexes in Firebase Console:');
        console.log('');

        indexes.forEach((index, i) => {
            console.log(`${i + 1}. Collection: ${index.collection}`);
            console.log(`   Fields: ${index.fields.join(', ')}`);
            console.log(`   Purpose: ${index.description}`);
            console.log('');
        });

        console.log('Firebase Console URL:');
        console.log('https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes');
        console.groupEnd();
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Get all available sort options
     * @returns {Array} Array of sort option objects with value and label
     */
    getSortOptions() {
        return [
            { value: SortOptions.MOST_POPULAR, label: 'Most Popular', icon: 'trending_up' },
            { value: SortOptions.LEAST_POPULAR, label: 'Least Popular', icon: 'trending_down' },
            { value: SortOptions.MOST_CONTROVERSIAL, label: 'Most Controversial', icon: 'local_fire_department' },
            { value: SortOptions.LEAST_CONTROVERSIAL, label: 'Least Controversial', icon: 'verified' },
            { value: SortOptions.NEWEST, label: 'Newest First', icon: 'schedule' },
            { value: SortOptions.OLDEST, label: 'Oldest First', icon: 'history' },
            { value: SortOptions.BIGGEST_CONTRIBUTION, label: 'Most Detailed', icon: 'expand' },
            { value: SortOptions.SMALLEST_CONTRIBUTION, label: 'Least Detailed', icon: 'compress' }
        ];
    }

    /**
     * Get all available filter types
     * @returns {Array} Array of filter type objects
     */
    getFilterTypes() {
        return [
            { value: FilterTypes.MYTHOLOGY, label: 'Mythology' },
            { value: FilterTypes.TYPE, label: 'Content Type' },
            { value: FilterTypes.OWNER, label: 'Creator' },
            { value: FilterTypes.STATUS, label: 'Status' },
            { value: FilterTypes.DATE_RANGE, label: 'Date Range' }
        ];
    }

    /**
     * Get all available status options
     * @returns {Array} Array of status objects
     */
    getStatusOptions() {
        return [
            { value: ContentStatus.PENDING, label: 'Pending Review', color: '#f59e0b' },
            { value: ContentStatus.APPROVED, label: 'Approved', color: '#10b981' },
            { value: ContentStatus.FLAGGED, label: 'Flagged', color: '#f97316' },
            { value: ContentStatus.REJECTED, label: 'Rejected', color: '#ef4444' }
        ];
    }

    /**
     * Apply filters and sorting in one operation
     * @param {Array} assets - Assets to process
     * @param {Object} options - Options object
     * @param {Array} options.filters - Filters to apply
     * @param {string} options.sortBy - Sort option
     * @param {number} options.page - Page number
     * @param {number} options.limit - Items per page
     * @returns {Object} Result with items, pageInfo, and totalFiltered
     */
    filterSortAndPaginate(assets, options = {}) {
        if (!Array.isArray(assets)) {
            return {
                items: [],
                pageInfo: this.getPageInfo(0, 1, options.limit || 20),
                totalFiltered: 0
            };
        }

        // Apply filters
        let filtered = options.filters && options.filters.length > 0
            ? this.combineFilters(assets, options.filters)
            : [...assets];

        // Apply sorting
        if (options.sortBy) {
            filtered = this.sortByOption(filtered, options.sortBy);
        }

        const totalFiltered = filtered.length;

        // Apply pagination
        const page = options.page || 1;
        const limit = options.limit || 20;
        const paginated = this.paginate(filtered, page, limit);

        return {
            items: paginated,
            pageInfo: this.getPageInfo(totalFiltered, page, limit),
            totalFiltered
        };
    }
}

// Export constants
if (typeof window !== 'undefined') {
    window.SortOptions = SortOptions;
    window.FilterTypes = FilterTypes;
    window.ContentStatus = ContentStatus;
    window.ContentFilterService = ContentFilterService;

    // Create global instance
    window.contentFilterService = new ContentFilterService();

    // Auto-initialize when Firebase is ready
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        window.contentFilterService.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                window.contentFilterService.init();
            }
        });
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ContentFilterService,
        SortOptions,
        FilterTypes,
        ContentStatus
    };
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize and sort by most popular:
 *    const service = new ContentFilterService();
 *    const sorted = service.sortByOption(assets, SortOptions.MOST_POPULAR);
 *
 * 2. Calculate controversy score:
 *    const score = service.calculateControversyScore(100, 95);
 *    console.log(`Controversy: ${score}`); // ~4.5 (very controversial)
 *
 * 3. Calculate contribution size:
 *    const size = service.calculateContributionSize(asset);
 *    const label = service.getContributionSizeLabel(size);
 *    console.log(`Contribution: ${label}`); // e.g., "detailed"
 *
 * 4. Apply multiple filters:
 *    const filtered = service.combineFilters(assets, [
 *        { type: 'mythology', value: 'greek' },
 *        { type: 'status', value: 'approved' },
 *        { type: 'date_range', start: '2024-01-01', end: '2024-12-31' }
 *    ]);
 *
 * 5. Paginate results:
 *    const page1 = service.paginate(assets, 1, 20);
 *    const pageInfo = service.getPageInfo(assets.length, 1, 20);
 *    console.log(`Page ${pageInfo.currentPage} of ${pageInfo.totalPages}`);
 *
 * 6. All-in-one operation:
 *    const result = service.filterSortAndPaginate(assets, {
 *        filters: [{ type: 'mythology', value: 'greek' }],
 *        sortBy: SortOptions.MOST_POPULAR,
 *        page: 1,
 *        limit: 20
 *    });
 *    console.log(result.items); // Filtered, sorted, paginated items
 *    console.log(result.pageInfo); // Pagination info
 *
 * 7. Build Firestore query:
 *    const query = service.buildSortedQuery(
 *        db.collection('user_assets'),
 *        SortOptions.MOST_POPULAR,
 *        50
 *    );
 *    const snapshot = await query.get();
 *
 * 8. Get required indexes (for setup):
 *    service.logRequiredIndexes();
 *
 * FIRESTORE INDEXES:
 * Run service.logRequiredIndexes() to see all composite indexes needed
 * for efficient queries. Create these in Firebase Console before deploying.
 */
