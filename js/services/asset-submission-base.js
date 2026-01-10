/**
 * Asset Submission Base Service
 * Eyes of Azrael Project
 *
 * Abstract base class for asset submissions following SOLID principles:
 * - Single Responsibility: Each class handles one type of submission
 * - Open/Closed: Extensible via subclasses without modifying base
 * - Liskov Substitution: All subclasses can be used interchangeably
 * - Interface Segregation: Clear method contracts for each responsibility
 * - Dependency Inversion: Depends on Firebase abstraction, not concrete implementation
 *
 * Works with existing content-submission-service.js for backward compatibility
 */

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Common validation utilities for asset submissions
 * These are pure functions that can be used across all submission types
 */
const ValidationUtils = {
    /**
     * Validate name field
     * @param {string} name - Asset name to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validateName(name) {
        const errors = [];

        if (!name || typeof name !== 'string') {
            errors.push('Name is required');
            return { valid: false, errors };
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (trimmedName.length > 200) {
            errors.push('Name must be 200 characters or less');
        }

        // Check for special characters (allow letters, numbers, spaces, hyphens, apostrophes)
        const validNamePattern = /^[\p{L}\p{N}\s\-'.,()]+$/u;
        if (!validNamePattern.test(trimmedName)) {
            errors.push('Name contains invalid characters. Use letters, numbers, spaces, hyphens, and apostrophes only');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Validate description field
     * @param {string} description - Description to validate
     * @param {number} minLength - Minimum length (default: 50)
     * @param {number} maxLength - Maximum length (default: 50000)
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    validateDescription(description, minLength = 50, maxLength = 50000) {
        const errors = [];
        const warnings = [];

        if (!description || typeof description !== 'string') {
            errors.push('Description is required');
            return { valid: false, errors, warnings };
        }

        const trimmedDesc = description.trim();

        if (trimmedDesc.length < minLength) {
            errors.push(`Description must be at least ${minLength} characters long`);
        }

        if (trimmedDesc.length > maxLength) {
            errors.push(`Description must be ${maxLength} characters or less`);
        }

        // Quality warnings
        if (trimmedDesc.length >= minLength && trimmedDesc.length < 100) {
            warnings.push('Consider adding more detail to your description for better quality');
        }

        return { valid: errors.length === 0, errors, warnings };
    },

    /**
     * Validate mythology reference
     * @param {string} mythology - Mythology identifier
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    validateMythology(mythology) {
        const errors = [];
        const warnings = [];

        const validMythologies = [
            'greek', 'roman', 'norse', 'egyptian', 'celtic', 'hindu', 'buddhist',
            'christian', 'jewish', 'islamic', 'japanese', 'chinese', 'sumerian',
            'babylonian', 'aztec', 'mayan', 'yoruba', 'polynesian', 'native-american',
            'slavic', 'finnish', 'persian', 'african', 'mesopotamian', 'korean',
            'vietnamese', 'thai', 'indonesian', 'philippine', 'hawaiian',
            'maori', 'aboriginal', 'inuit', 'other', 'cross-cultural'
        ];

        if (!mythology || typeof mythology !== 'string') {
            errors.push('Primary mythology is required');
            return { valid: false, errors, warnings };
        }

        const normalizedMythology = mythology.toLowerCase().trim();

        if (!validMythologies.includes(normalizedMythology)) {
            warnings.push(`Unknown mythology: "${mythology}". Consider using a standard mythology name.`);
        }

        return { valid: errors.length === 0, errors, warnings };
    },

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validateUrl(url) {
        const errors = [];

        if (!url) {
            return { valid: true, errors }; // URL is optional
        }

        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                errors.push('URL must use HTTP or HTTPS protocol');
            }
        } catch (e) {
            errors.push('Invalid URL format');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Validate date/chronological data
     * @param {string|number|Date} date - Date to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, errors: string[], parsedDate: Date|null }
     */
    validateDate(date, options = {}) {
        const { allowFuture = false, allowMythical = true } = options;
        const errors = [];
        let parsedDate = null;

        if (!date) {
            return { valid: true, errors, parsedDate }; // Date is optional
        }

        // Handle mythical/legendary date strings
        if (allowMythical && typeof date === 'string') {
            const mythicalPatterns = [
                /^(ancient|mythical|legendary|primordial|prehistoric|unknown)$/i,
                /^(\d+)\s*(bce?|ce|ad|bc)$/i,
                /^circa\s+\d+/i,
                /^(early|mid|late)\s+\d+(st|nd|rd|th)\s+century/i
            ];

            for (const pattern of mythicalPatterns) {
                if (pattern.test(date.trim())) {
                    return { valid: true, errors, parsedDate: null, mythicalDate: date };
                }
            }
        }

        // Try to parse as standard date
        try {
            if (date instanceof Date) {
                parsedDate = date;
            } else if (typeof date === 'number') {
                parsedDate = new Date(date);
            } else {
                parsedDate = new Date(date);
            }

            if (isNaN(parsedDate.getTime())) {
                errors.push('Invalid date format');
                parsedDate = null;
            } else if (!allowFuture && parsedDate > new Date()) {
                errors.push('Date cannot be in the future');
            }
        } catch (e) {
            errors.push('Failed to parse date');
        }

        return { valid: errors.length === 0, errors, parsedDate };
    },

    /**
     * Validate sources array
     * @param {Array} sources - Array of source objects
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    validateSources(sources) {
        const errors = [];
        const warnings = [];

        if (!sources || !Array.isArray(sources)) {
            warnings.push('No sources provided. Adding sources improves credibility.');
            return { valid: true, errors, warnings };
        }

        if (sources.length === 0) {
            warnings.push('No sources provided. Adding sources improves credibility.');
            return { valid: true, errors, warnings };
        }

        sources.forEach((source, idx) => {
            if (!source.title && !source.url && !source.text) {
                errors.push(`Source ${idx + 1} is empty`);
            }

            if (source.url) {
                const urlValidation = ValidationUtils.validateUrl(source.url);
                if (!urlValidation.valid) {
                    warnings.push(`Source ${idx + 1}: ${urlValidation.errors.join(', ')}`);
                }
            }
        });

        return { valid: errors.length === 0, errors, warnings };
    },

    /**
     * Validate tags array
     * @param {Array} tags - Array of tag strings
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[], sanitizedTags: string[] }
     */
    validateTags(tags) {
        const errors = [];
        const warnings = [];
        let sanitizedTags = [];

        if (!tags || !Array.isArray(tags)) {
            warnings.push('No tags provided. Adding tags improves discoverability.');
            return { valid: true, errors, warnings, sanitizedTags };
        }

        if (tags.length === 0) {
            warnings.push('No tags provided. Adding tags improves discoverability.');
            return { valid: true, errors, warnings, sanitizedTags };
        }

        if (tags.length > 20) {
            errors.push('Maximum 20 tags allowed');
        }

        sanitizedTags = tags
            .map(tag => {
                if (typeof tag !== 'string') return null;
                return tag.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);
            })
            .filter(tag => tag && tag.length > 0);

        return { valid: errors.length === 0, errors, warnings, sanitizedTags };
    },

    /**
     * Validate SVG code
     * @param {string} svgCode - SVG string to validate
     * @returns {Object} { valid: boolean, errors: string[], sanitizedSvg: string }
     */
    validateSvg(svgCode) {
        const errors = [];
        let sanitizedSvg = '';

        if (!svgCode || typeof svgCode !== 'string') {
            return { valid: true, errors, sanitizedSvg }; // SVG is optional
        }

        if (!svgCode.includes('<svg')) {
            errors.push('Not a valid SVG - missing <svg> tag');
        }

        if (!svgCode.includes('</svg>')) {
            errors.push('SVG not properly closed');
        }

        // Check for dangerous content
        if (/<script/i.test(svgCode)) {
            errors.push('SVG contains script tags');
        }

        if (/javascript:/i.test(svgCode)) {
            errors.push('SVG contains JavaScript protocol');
        }

        if (/on\w+=/i.test(svgCode)) {
            errors.push('SVG contains event handlers');
        }

        if (svgCode.length > 100000) {
            errors.push('SVG is too large (max 100KB)');
        }

        // Sanitize SVG
        if (errors.length === 0) {
            sanitizedSvg = svgCode
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/javascript:[^"']*/gi, '')
                .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                .trim();
        }

        return { valid: errors.length === 0, errors, sanitizedSvg };
    }
};


// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

/**
 * Common sanitization utilities for asset submissions
 */
const SanitizationUtils = {
    /**
     * Sanitize text content by removing dangerous elements
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';

        return text
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    },

    /**
     * Sanitize and normalize a name
     * @param {string} name - Name to sanitize
     * @returns {string} Sanitized name
     */
    sanitizeName(name) {
        if (!name || typeof name !== 'string') return '';

        return name
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 200);
    },

    /**
     * Generate a URL-safe slug from a name
     * @param {string} name - Name to convert
     * @returns {string} URL slug
     */
    generateSlug(name) {
        if (!name || typeof name !== 'string') return '';

        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100);
    },

    /**
     * Sanitize tags array
     * @param {Array} tags - Tags to sanitize
     * @returns {Array} Sanitized tags
     */
    sanitizeTags(tags) {
        if (!tags || !Array.isArray(tags)) return [];

        return tags
            .map(tag => {
                if (typeof tag !== 'string') return null;
                return tag.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);
            })
            .filter(tag => tag && tag.length > 0)
            .slice(0, 20);
    },

    /**
     * Sanitize extended content sections
     * @param {Array} sections - Content sections
     * @returns {Array} Sanitized sections
     */
    sanitizeExtendedContent(sections) {
        if (!sections || !Array.isArray(sections)) return [];

        return sections.map(section => ({
            title: SanitizationUtils.sanitizeText(section.title || ''),
            content: SanitizationUtils.sanitizeText(section.content || ''),
            order: typeof section.order === 'number' ? section.order : 0
        }));
    }
};


// ============================================================================
// SUBMISSION METADATA
// ============================================================================

/**
 * Submission metadata structure
 * Used for tracking submission state and moderation
 */
class SubmissionMetadata {
    constructor(userId, userName, userEmail, userAvatar = null) {
        // Author information
        this.submittedBy = userId;
        this.submittedByName = userName;
        this.submittedByEmail = userEmail;
        this.submittedByAvatar = userAvatar;

        // Timestamps (will be set by Firebase)
        this.submittedAt = null;
        this.updatedAt = null;

        // Moderation state
        this.status = 'pending'; // pending, approved, rejected, under_review
        this.moderationQueue = true;

        // Review tracking
        this.reviewedBy = null;
        this.reviewedByName = null;
        this.reviewedAt = null;
        this.reviewNotes = null;
        this.rejectionReason = null;

        // Community interaction
        this.votes = 0;
        this.upvotes = 0;
        this.downvotes = 0;
        this.flags = 0;
        this.flagReasons = [];
        this.views = 0;

        // Version control
        this.version = 1;
        this.previousVersions = [];

        // Approval tracking
        this.approvedEntityId = null;
        this.approvedEntityCollection = null;
    }

    /**
     * Convert to Firestore-compatible object
     * @param {Object} firebaseModule - Firebase module reference
     * @returns {Object} Firestore document data
     */
    toFirestore(firebaseModule) {
        const timestamp = firebaseModule.firestore.FieldValue.serverTimestamp();

        return {
            ...this,
            submittedAt: this.submittedAt || timestamp,
            updatedAt: timestamp
        };
    }
}


// ============================================================================
// ABSTRACT BASE CLASS
// ============================================================================

/**
 * Abstract base class for asset submissions
 * Provides common functionality for all asset types
 */
class AssetSubmissionBase {
    /**
     * Create a new AssetSubmissionBase instance
     * @param {string} assetType - The type of asset (deity, creature, hero, etc.)
     */
    constructor(assetType) {
        if (new.target === AssetSubmissionBase) {
            throw new Error('AssetSubmissionBase is abstract and cannot be instantiated directly');
        }

        this.assetType = assetType;
        this.db = null;
        this.auth = null;
        this.initialized = false;

        // Collection mapping (singular to plural)
        this.collectionMap = {
            deity: 'deities',
            hero: 'heroes',
            creature: 'creatures',
            item: 'items',
            place: 'places',
            concept: 'concepts',
            archetype: 'concepts',
            magic: 'magic',
            ritual: 'rituals',
            text: 'texts',
            symbol: 'symbols',
            herb: 'herbs',
            theory: 'user_theories',
            mythology: 'mythologies'
        };
    }

    /**
     * Initialize the submission service
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (this.initialized) return true;

        try {
            if (typeof firebase === 'undefined') {
                console.warn(`${this.constructor.name}: Firebase not loaded yet`);
                return false;
            }

            if (!firebase.firestore || !firebase.auth) {
                console.warn(`${this.constructor.name}: Firebase services not available`);
                return false;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.initialized = true;

            console.log(`${this.constructor.name} initialized for ${this.assetType}`);
            return true;
        } catch (error) {
            console.error(`${this.constructor.name} init error:`, error);
            return false;
        }
    }

    /**
     * Ensure service is initialized
     * @throws {Error} If initialization fails
     */
    async ensureInit() {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) {
                throw new Error(`${this.constructor.name} not initialized. Ensure Firebase is loaded.`);
            }
        }
    }

    /**
     * Get current authenticated user
     * @returns {Object|null} Firebase user object
     * @throws {Error} If not authenticated
     */
    getCurrentUser() {
        const user = this.auth?.currentUser;
        if (!user) {
            throw new Error('You must be signed in to submit content');
        }
        return user;
    }

    /**
     * Get the Firestore collection name for this asset type
     * @returns {string} Collection name
     */
    getCollectionName() {
        return this.collectionMap[this.assetType] || this.assetType + 's';
    }

    // =========================================================================
    // ABSTRACT METHODS - Must be implemented by subclasses
    // =========================================================================

    /**
     * Get required fields for this asset type
     * @abstract
     * @returns {Array<string>} List of required field names
     */
    getRequiredFields() {
        throw new Error('getRequiredFields() must be implemented by subclass');
    }

    /**
     * Get optional fields for this asset type
     * @abstract
     * @returns {Array<string>} List of optional field names
     */
    getOptionalFields() {
        throw new Error('getOptionalFields() must be implemented by subclass');
    }

    /**
     * Perform type-specific validation
     * @abstract
     * @param {Object} data - Data to validate
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    validateTypeSpecific(data) {
        throw new Error('validateTypeSpecific() must be implemented by subclass');
    }

    // =========================================================================
    // CORE METHODS
    // =========================================================================

    /**
     * Validate submission data
     * @param {Object} data - Submission data
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    validate(data) {
        const errors = [];
        const warnings = [];

        // Validate common required fields
        const commonRequired = ['name', 'primaryMythology', 'shortDescription', 'longDescription'];

        for (const field of commonRequired) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate name
        if (data.name) {
            const nameValidation = ValidationUtils.validateName(data.name);
            errors.push(...nameValidation.errors);
        }

        // Validate short description
        if (data.shortDescription) {
            const shortDescValidation = ValidationUtils.validateDescription(
                data.shortDescription, 10, 500
            );
            errors.push(...shortDescValidation.errors);
            warnings.push(...shortDescValidation.warnings);
        }

        // Validate long description
        if (data.longDescription) {
            const longDescValidation = ValidationUtils.validateDescription(
                data.longDescription, 50, 50000
            );
            errors.push(...longDescValidation.errors);
            warnings.push(...longDescValidation.warnings);
        }

        // Validate mythology
        if (data.primaryMythology) {
            const mythValidation = ValidationUtils.validateMythology(data.primaryMythology);
            errors.push(...mythValidation.errors);
            warnings.push(...mythValidation.warnings);
        }

        // Validate SVG icon if present
        if (data.svgIcon) {
            const svgValidation = ValidationUtils.validateSvg(data.svgIcon);
            errors.push(...svgValidation.errors.map(e => `SVG Icon: ${e}`));
        }

        // Validate sources
        if (data.sources) {
            const sourcesValidation = ValidationUtils.validateSources(data.sources);
            errors.push(...sourcesValidation.errors);
            warnings.push(...sourcesValidation.warnings);
        }

        // Validate tags
        if (data.tags) {
            const tagsValidation = ValidationUtils.validateTags(data.tags);
            errors.push(...tagsValidation.errors);
            warnings.push(...tagsValidation.warnings);
        }

        // Check type-specific required fields
        const typeRequiredFields = this.getRequiredFields();
        for (const field of typeRequiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`Missing required field for ${this.assetType}: ${field}`);
            }
        }

        // Run type-specific validation
        const typeValidation = this.validateTypeSpecific(data);
        errors.push(...typeValidation.errors);
        warnings.push(...typeValidation.warnings);

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Sanitize submission data
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitize(data) {
        const sanitized = { ...data };

        // Sanitize text fields
        const textFields = ['name', 'shortDescription', 'longDescription'];
        for (const field of textFields) {
            if (sanitized[field]) {
                sanitized[field] = SanitizationUtils.sanitizeText(sanitized[field]);
            }
        }

        // Sanitize name
        if (sanitized.name) {
            sanitized.name = SanitizationUtils.sanitizeName(sanitized.name);
        }

        // Generate slug if not present
        if (!sanitized.slug && sanitized.name) {
            sanitized.slug = SanitizationUtils.generateSlug(sanitized.name);
        }

        // Sanitize tags
        if (sanitized.tags) {
            sanitized.tags = SanitizationUtils.sanitizeTags(sanitized.tags);
        }

        // Sanitize SVG
        if (sanitized.svgIcon) {
            const svgValidation = ValidationUtils.validateSvg(sanitized.svgIcon);
            sanitized.svgIcon = svgValidation.sanitizedSvg;
        }

        // Sanitize extended content
        if (sanitized.extendedContent) {
            sanitized.extendedContent = SanitizationUtils.sanitizeExtendedContent(sanitized.extendedContent);
        }

        // Normalize mythology to lowercase
        if (sanitized.primaryMythology) {
            sanitized.primaryMythology = sanitized.primaryMythology.toLowerCase().trim();
        }

        // Ensure type is set
        sanitized.type = this.assetType;

        return sanitized;
    }

    /**
     * Check for duplicate assets
     * @param {Object} data - Submission data
     * @returns {Promise<Array>} Array of duplicate entries
     */
    async checkDuplicates(data) {
        await this.ensureInit();

        const duplicates = [];
        const collection = this.getCollectionName();

        if (!data.name || !data.primaryMythology) {
            return duplicates;
        }

        try {
            // Check main collection for exact name match
            const mainQuery = await this.db.collection(collection)
                .where('name', '==', data.name)
                .get();

            mainQuery.forEach(doc => {
                const docData = doc.data();
                const docMythology = docData.primaryMythology || docData.mythology;

                if (docMythology?.toLowerCase() === data.primaryMythology.toLowerCase()) {
                    duplicates.push({
                        type: 'existing',
                        id: doc.id,
                        name: docData.name,
                        mythology: docMythology,
                        collection: collection,
                        similarity: 'exact'
                    });
                }
            });

            // Check pending submissions
            const pendingQuery = await this.db.collection('submissions')
                .where('entityName', '==', data.name)
                .where('mythology', '==', data.primaryMythology.toLowerCase())
                .where('type', '==', this.assetType)
                .where('status', '==', 'pending')
                .get();

            pendingQuery.forEach(doc => {
                duplicates.push({
                    type: 'pending_submission',
                    id: doc.id,
                    name: doc.data().entityName,
                    mythology: doc.data().mythology,
                    similarity: 'exact'
                });
            });

            // Check for similar names (fuzzy matching)
            if (duplicates.length === 0 && data.name.length > 3) {
                const similarQuery = await this.db.collection(collection)
                    .orderBy('name')
                    .startAt(data.name.substring(0, 3))
                    .endAt(data.name.substring(0, 3) + '\uf8ff')
                    .limit(10)
                    .get();

                similarQuery.forEach(doc => {
                    const docData = doc.data();
                    const similarity = this.calculateSimilarity(data.name, docData.name);

                    if (similarity > 0.8 && doc.id !== data.id) {
                        duplicates.push({
                            type: 'similar',
                            id: doc.id,
                            name: docData.name,
                            mythology: docData.primaryMythology || docData.mythology,
                            collection: collection,
                            similarity: 'similar',
                            similarityScore: similarity
                        });
                    }
                });
            }

        } catch (error) {
            console.error('Duplicate check error:', error);
        }

        return duplicates;
    }

    /**
     * Calculate string similarity (Levenshtein-based)
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();

        if (s1 === s2) return 1;

        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Edit distance
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,     // deletion
                        dp[i][j - 1] + 1,     // insertion
                        dp[i - 1][j - 1] + 1  // substitution
                    );
                }
            }
        }

        return dp[m][n];
    }

    /**
     * Generate unique asset ID
     * @param {Object} data - Submission data
     * @returns {string} Unique ID
     */
    generateId(data) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        const prefix = `sub_${this.assetType}`;

        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Prepare data for Firestore storage
     * @param {Object} data - Sanitized submission data
     * @param {Object} user - Current user
     * @returns {Object} Firestore-ready document
     */
    prepareForFirestore(data, user) {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const submissionId = this.generateId(data);

        // Create submission metadata
        const metadata = new SubmissionMetadata(
            user.uid,
            user.displayName || user.email,
            user.email,
            user.photoURL
        );

        return {
            id: submissionId,
            type: this.assetType,

            // Submission data
            data: data,

            // Entity identification
            entityName: data.name,
            mythology: data.primaryMythology,
            slug: data.slug || SanitizationUtils.generateSlug(data.name),

            // Metadata
            ...metadata.toFirestore(firebase),

            // Metrics initialization
            votes: 0,
            upvotes: 0,
            downvotes: 0,
            flags: 0,
            views: 0,

            // Version tracking
            version: 1,
            previousVersions: []
        };
    }

    /**
     * Full submission flow
     * @param {Object} data - Raw submission data
     * @returns {Promise<Object>} Submission result
     */
    async submit(data) {
        await this.ensureInit();

        // Get current user
        let user;
        try {
            user = this.getCurrentUser();
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }

        // Validate
        const validation = this.validate(data);
        if (!validation.valid) {
            return {
                success: false,
                error: 'Validation failed',
                validationErrors: validation.errors,
                warnings: validation.warnings
            };
        }

        // Check for duplicates
        const duplicates = await this.checkDuplicates(data);
        if (duplicates.some(d => d.similarity === 'exact')) {
            return {
                success: false,
                error: 'Similar content already exists',
                duplicates: duplicates
            };
        }

        // Sanitize
        const sanitizedData = this.sanitize(data);

        // Prepare for Firestore
        const submission = this.prepareForFirestore(sanitizedData, user);

        try {
            // Save to submissions collection
            await this.db.collection('submissions').doc(submission.id).set(submission);

            // Create notification for user
            await this.createNotification({
                userId: user.uid,
                type: 'submission_created',
                title: 'Content Submitted',
                message: `Your ${this.assetType} "${sanitizedData.name}" has been submitted for review.`,
                link: `/dashboard.html?submission=${submission.id}`,
                data: { submissionId: submission.id, contentType: this.assetType }
            });

            // Update user's submission count
            await this.incrementUserSubmissionCount(user.uid);

            return {
                success: true,
                submissionId: submission.id,
                message: 'Content submitted successfully for review',
                warnings: validation.warnings,
                duplicates: duplicates.filter(d => d.similarity === 'similar')
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
     * Create user notification
     * @param {Object} notificationData - Notification data
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
            // Non-critical - don't throw
        }
    }

    /**
     * Increment user's submission count
     * @param {string} userId - User ID
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
            // Non-critical - don't throw
        }
    }
}


// ============================================================================
// TYPE-SPECIFIC SUBCLASSES
// ============================================================================

/**
 * Deity submission handler
 */
class DeitySubmission extends AssetSubmissionBase {
    constructor() {
        super('deity');
    }

    getRequiredFields() {
        return ['domains'];
    }

    getOptionalFields() {
        return [
            'epithets', 'symbols', 'consort', 'parents', 'children',
            'siblings', 'realm', 'weapons', 'animals', 'plants',
            'festivals', 'temples', 'gender', 'alignment', 'powerLevel'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate domains (required for deities)
        if (data.domains) {
            if (!Array.isArray(data.domains)) {
                errors.push('Domains must be an array');
            } else if (data.domains.length === 0) {
                errors.push('At least one domain is required for deities');
            } else if (data.domains.length > 10) {
                warnings.push('Consider limiting domains to the most significant ones');
            }
        }

        // Validate optional fields
        if (data.epithets && Array.isArray(data.epithets) && data.epithets.length > 20) {
            warnings.push('Consider limiting epithets to the most well-known ones');
        }

        if (data.powerLevel && !['minor', 'major', 'supreme', 'primordial'].includes(data.powerLevel)) {
            warnings.push('Power level should be: minor, major, supreme, or primordial');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Creature submission handler
 */
class CreatureSubmission extends AssetSubmissionBase {
    constructor() {
        super('creature');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'habitat', 'abilities', 'weaknesses', 'diet', 'behavior',
            'physicalDescription', 'origin', 'classification', 'dangerLevel',
            'relatedCreatures', 'notableIndividuals', 'culturalSignificance'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate danger level
        if (data.dangerLevel && !['harmless', 'low', 'moderate', 'high', 'extreme', 'apocalyptic'].includes(data.dangerLevel)) {
            warnings.push('Danger level should be: harmless, low, moderate, high, extreme, or apocalyptic');
        }

        // Validate classification
        if (data.classification && !['beast', 'spirit', 'undead', 'demon', 'dragon', 'elemental', 'hybrid', 'divine', 'construct', 'other'].includes(data.classification)) {
            warnings.push('Consider using standard classification: beast, spirit, undead, demon, dragon, elemental, hybrid, divine, construct, or other');
        }

        // Physical description recommendation
        if (!data.physicalDescription) {
            warnings.push('Adding a physical description helps readers visualize the creature');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Hero submission handler
 */
class HeroSubmission extends AssetSubmissionBase {
    constructor() {
        super('hero');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'parentage', 'birthplace', 'epithets', 'quests', 'companions',
            'weapons', 'abilities', 'achievements', 'death', 'legacy',
            'mortalOrDivine', 'mentor', 'enemies', 'romanticInterests', 'era'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate mortal/divine status
        if (data.mortalOrDivine && !['mortal', 'demigod', 'divine', 'ascended'].includes(data.mortalOrDivine)) {
            warnings.push('Status should be: mortal, demigod, divine, or ascended');
        }

        // Validate era
        if (data.era) {
            const eraValidation = ValidationUtils.validateDate(data.era, { allowMythical: true });
            errors.push(...eraValidation.errors);
        }

        // Recommendation for quests
        if (!data.quests || (Array.isArray(data.quests) && data.quests.length === 0)) {
            warnings.push('Adding notable quests or adventures enriches the hero\'s story');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Item (Artifact) submission handler
 */
class ItemSubmission extends AssetSubmissionBase {
    constructor() {
        super('item');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'itemType', 'creator', 'owners', 'powers', 'materials',
            'appearance', 'location', 'history', 'curses', 'requirements',
            'destruction', 'replicas', 'relatedItems'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate item type
        const validItemTypes = [
            'weapon', 'armor', 'jewelry', 'vessel', 'instrument', 'clothing',
            'tool', 'key', 'relic', 'talisman', 'scroll', 'book', 'other'
        ];

        if (data.itemType && !validItemTypes.includes(data.itemType)) {
            warnings.push(`Consider using standard item type: ${validItemTypes.join(', ')}`);
        }

        // Recommendation for powers
        if (!data.powers || (Array.isArray(data.powers) && data.powers.length === 0)) {
            warnings.push('Describing the item\'s powers or significance adds depth');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Place submission handler
 */
class PlaceSubmission extends AssetSubmissionBase {
    constructor() {
        super('place');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'placeType', 'realm', 'inhabitants', 'features', 'significance',
            'accessMethods', 'dangers', 'treasures', 'connectedPlaces',
            'rulers', 'events', 'geography', 'realWorldLocation'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate place type
        const validPlaceTypes = [
            'mountain', 'forest', 'underworld', 'heaven', 'temple', 'city',
            'island', 'river', 'sea', 'cave', 'palace', 'battlefield',
            'garden', 'bridge', 'tower', 'other'
        ];

        if (data.placeType && !validPlaceTypes.includes(data.placeType)) {
            warnings.push(`Consider using standard place type: ${validPlaceTypes.join(', ')}`);
        }

        // Validate realm
        const validRealms = ['mortal', 'divine', 'underworld', 'celestial', 'liminal', 'other'];
        if (data.realm && !validRealms.includes(data.realm)) {
            warnings.push(`Consider using standard realm: ${validRealms.join(', ')}`);
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Archetype (Concept) submission handler
 */
class ArchetypeSubmission extends AssetSubmissionBase {
    constructor() {
        super('archetype');
        // Override collection name for archetypes
        this.collectionMap.archetype = 'concepts';
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'archetypeType', 'manifestations', 'symbolism', 'opposites',
            'relatedArchetypes', 'psychologicalMeaning', 'culturalExamples',
            'jungianAnalysis', 'literaryExamples', 'modernInterpretations'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate archetype type
        const validArchetypeTypes = [
            'character', 'situation', 'symbol', 'theme', 'journey',
            'transformation', 'relationship', 'conflict', 'other'
        ];

        if (data.archetypeType && !validArchetypeTypes.includes(data.archetypeType)) {
            warnings.push(`Consider using standard archetype type: ${validArchetypeTypes.join(', ')}`);
        }

        // Cross-cultural examples recommendation
        if (!data.culturalExamples || (Array.isArray(data.culturalExamples) && data.culturalExamples.length < 2)) {
            warnings.push('Adding examples from multiple cultures strengthens archetype entries');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Magic System submission handler
 */
class MagicSubmission extends AssetSubmissionBase {
    constructor() {
        super('magic');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'magicType', 'source', 'practitioners', 'limitations', 'components',
            'rituals', 'spells', 'schools', 'dangers', 'history',
            'relatedSystems', 'culturalRole', 'taboos'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate magic type
        const validMagicTypes = [
            'elemental', 'divine', 'arcane', 'natural', 'necromancy',
            'divination', 'illusion', 'enchantment', 'summoning',
            'healing', 'curse', 'shapeshifting', 'other'
        ];

        if (data.magicType && !validMagicTypes.includes(data.magicType)) {
            warnings.push(`Consider using standard magic type: ${validMagicTypes.join(', ')}`);
        }

        // Limitations recommendation
        if (!data.limitations) {
            warnings.push('Describing limitations and costs makes magic systems more believable');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Herb submission handler
 */
class HerbSubmission extends AssetSubmissionBase {
    constructor() {
        super('herb');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'botanicalName', 'commonNames', 'properties', 'uses',
            'preparation', 'dosage', 'contraindications', 'habitat',
            'harvesting', 'associations', 'folklore', 'modernUses'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Properties recommendation
        if (!data.properties || (Array.isArray(data.properties) && data.properties.length === 0)) {
            warnings.push('Describing magical or medicinal properties is essential for herb entries');
        }

        // Safety warning
        warnings.push('Note: Herb information is for educational purposes only. Always consult qualified practitioners.');

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Ritual submission handler
 */
class RitualSubmission extends AssetSubmissionBase {
    constructor() {
        super('ritual');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'ritualType', 'purpose', 'participants', 'requirements', 'steps',
            'timing', 'location', 'offerings', 'invocations', 'taboos',
            'duration', 'frequency', 'variations', 'modernAdaptations'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate ritual type
        const validRitualTypes = [
            'initiation', 'seasonal', 'healing', 'protection', 'divination',
            'sacrifice', 'purification', 'blessing', 'funeral', 'wedding',
            'coming-of-age', 'coronation', 'dedication', 'other'
        ];

        if (data.ritualType && !validRitualTypes.includes(data.ritualType)) {
            warnings.push(`Consider using standard ritual type: ${validRitualTypes.join(', ')}`);
        }

        // Purpose recommendation
        if (!data.purpose) {
            warnings.push('Describing the ritual\'s purpose helps readers understand its significance');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Sacred Text submission handler
 */
class TextSubmission extends AssetSubmissionBase {
    constructor() {
        super('text');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'textType', 'author', 'dateWritten', 'language', 'translations',
            'contents', 'themes', 'significance', 'preservation', 'versions',
            'relatedTexts', 'commentaries', 'quotes', 'influence'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate text type
        const validTextTypes = [
            'scripture', 'epic', 'hymn', 'prayer', 'prophecy', 'myth',
            'legend', 'chronicle', 'grimoire', 'codex', 'tablet', 'scroll', 'other'
        ];

        if (data.textType && !validTextTypes.includes(data.textType)) {
            warnings.push(`Consider using standard text type: ${validTextTypes.join(', ')}`);
        }

        // Date validation
        if (data.dateWritten) {
            const dateValidation = ValidationUtils.validateDate(data.dateWritten, { allowMythical: true });
            errors.push(...dateValidation.errors);
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Sacred Symbol submission handler
 */
class SymbolSubmission extends AssetSubmissionBase {
    constructor() {
        super('symbol');
    }

    getRequiredFields() {
        return [];
    }

    getOptionalFields() {
        return [
            'symbolType', 'meaning', 'visualDescription', 'usage',
            'variations', 'relatedSymbols', 'history', 'modernUse',
            'taboos', 'colors', 'elements', 'directions'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Validate symbol type
        const validSymbolTypes = [
            'geometric', 'natural', 'celestial', 'religious', 'magical',
            'protective', 'alchemical', 'runic', 'sigil', 'mandala', 'other'
        ];

        if (data.symbolType && !validSymbolTypes.includes(data.symbolType)) {
            warnings.push(`Consider using standard symbol type: ${validSymbolTypes.join(', ')}`);
        }

        // Visual description recommendation
        if (!data.visualDescription && !data.svgIcon) {
            warnings.push('Adding a visual description or SVG icon helps readers understand the symbol');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


/**
 * Mythology submission handler
 */
class MythologySubmission extends AssetSubmissionBase {
    constructor() {
        super('mythology');
    }

    getRequiredFields() {
        return ['region'];
    }

    getOptionalFields() {
        return [
            'region', 'culture', 'timePeriod', 'majorDeities', 'cosmology',
            'creationMyth', 'apocalypseMyth', 'afterlife', 'heroes',
            'sacredTexts', 'practices', 'influence', 'modernSurvival'
        ];
    }

    validateTypeSpecific(data) {
        const errors = [];
        const warnings = [];

        // Region is required
        if (!data.region) {
            errors.push('Region/culture origin is required for mythology entries');
        }

        // Cosmology recommendation
        if (!data.cosmology) {
            warnings.push('Describing the cosmology enriches mythology entries');
        }

        // Creation myth recommendation
        if (!data.creationMyth) {
            warnings.push('Including a creation myth provides foundational context');
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}


// ============================================================================
// SUBMISSION FACTORY
// ============================================================================

/**
 * Factory for creating appropriate submission handlers
 */
class AssetSubmissionFactory {
    /**
     * Registry of submission handlers
     */
    static handlers = {
        deity: DeitySubmission,
        creature: CreatureSubmission,
        hero: HeroSubmission,
        item: ItemSubmission,
        place: PlaceSubmission,
        archetype: ArchetypeSubmission,
        concept: ArchetypeSubmission, // Alias
        magic: MagicSubmission,
        herb: HerbSubmission,
        ritual: RitualSubmission,
        text: TextSubmission,
        symbol: SymbolSubmission,
        mythology: MythologySubmission
    };

    /**
     * Singleton instances cache
     */
    static instances = {};

    /**
     * Create or get a submission handler for a given asset type
     * @param {string} assetType - The type of asset
     * @returns {AssetSubmissionBase} Submission handler instance
     */
    static create(assetType) {
        const normalizedType = assetType.toLowerCase();

        // Check if we have a cached instance
        if (this.instances[normalizedType]) {
            return this.instances[normalizedType];
        }

        // Get the handler class
        const HandlerClass = this.handlers[normalizedType];

        if (!HandlerClass) {
            throw new Error(`Unknown asset type: ${assetType}. Valid types: ${Object.keys(this.handlers).join(', ')}`);
        }

        // Create and cache the instance
        const instance = new HandlerClass();
        this.instances[normalizedType] = instance;

        return instance;
    }

    /**
     * Get list of supported asset types
     * @returns {Array<string>} List of asset types
     */
    static getSupportedTypes() {
        return Object.keys(this.handlers);
    }

    /**
     * Check if an asset type is supported
     * @param {string} assetType - Asset type to check
     * @returns {boolean} True if supported
     */
    static isSupported(assetType) {
        return assetType.toLowerCase() in this.handlers;
    }

    /**
     * Register a custom submission handler
     * @param {string} assetType - Asset type name
     * @param {Function} handlerClass - Handler class extending AssetSubmissionBase
     */
    static register(assetType, handlerClass) {
        if (!(handlerClass.prototype instanceof AssetSubmissionBase)) {
            throw new Error('Handler must extend AssetSubmissionBase');
        }
        this.handlers[assetType.toLowerCase()] = handlerClass;
        // Clear cached instance if exists
        delete this.instances[assetType.toLowerCase()];
    }
}


// ============================================================================
// UNIFIED SUBMISSION SERVICE (Integration with existing code)
// ============================================================================

/**
 * Unified submission service that works with existing content-submission-service.js
 * Provides a single entry point for all submission types
 */
class UnifiedAssetSubmissionService {
    constructor() {
        this.factory = AssetSubmissionFactory;
        this.initialized = false;
    }

    /**
     * Initialize the service
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (this.initialized) return true;

        // Pre-initialize common handlers
        const commonTypes = ['deity', 'creature', 'hero', 'item', 'place'];

        try {
            for (const type of commonTypes) {
                const handler = this.factory.create(type);
                await handler.init();
            }
            this.initialized = true;
            console.log('UnifiedAssetSubmissionService initialized');
            return true;
        } catch (error) {
            console.error('UnifiedAssetSubmissionService init error:', error);
            return false;
        }
    }

    /**
     * Submit an asset
     * @param {Object} data - Submission data
     * @param {string} assetType - Type of asset
     * @returns {Promise<Object>} Submission result
     */
    async submit(data, assetType) {
        const handler = this.factory.create(assetType);
        return handler.submit(data);
    }

    /**
     * Validate submission data
     * @param {Object} data - Data to validate
     * @param {string} assetType - Type of asset
     * @returns {Object} Validation result
     */
    validate(data, assetType) {
        const handler = this.factory.create(assetType);
        return handler.validate(data);
    }

    /**
     * Check for duplicates
     * @param {Object} data - Submission data
     * @param {string} assetType - Type of asset
     * @returns {Promise<Array>} Duplicate entries
     */
    async checkDuplicates(data, assetType) {
        const handler = this.factory.create(assetType);
        await handler.ensureInit();
        return handler.checkDuplicates(data);
    }

    /**
     * Get required fields for an asset type
     * @param {string} assetType - Type of asset
     * @returns {Array<string>} Required fields
     */
    getRequiredFields(assetType) {
        const handler = this.factory.create(assetType);
        return ['name', 'primaryMythology', 'shortDescription', 'longDescription', ...handler.getRequiredFields()];
    }

    /**
     * Get optional fields for an asset type
     * @param {string} assetType - Type of asset
     * @returns {Array<string>} Optional fields
     */
    getOptionalFields(assetType) {
        const handler = this.factory.create(assetType);
        return handler.getOptionalFields();
    }

    /**
     * Get all supported asset types
     * @returns {Array<string>} Supported types
     */
    getSupportedTypes() {
        return this.factory.getSupportedTypes();
    }
}


// ============================================================================
// EXPORTS
// ============================================================================

// Create global instances
if (typeof window !== 'undefined') {
    // Export classes
    window.AssetSubmissionBase = AssetSubmissionBase;
    window.AssetSubmissionFactory = AssetSubmissionFactory;
    window.UnifiedAssetSubmissionService = UnifiedAssetSubmissionService;

    // Export type-specific classes
    window.DeitySubmission = DeitySubmission;
    window.CreatureSubmission = CreatureSubmission;
    window.HeroSubmission = HeroSubmission;
    window.ItemSubmission = ItemSubmission;
    window.PlaceSubmission = PlaceSubmission;
    window.ArchetypeSubmission = ArchetypeSubmission;
    window.MagicSubmission = MagicSubmission;
    window.HerbSubmission = HerbSubmission;
    window.RitualSubmission = RitualSubmission;
    window.TextSubmission = TextSubmission;
    window.SymbolSubmission = SymbolSubmission;
    window.MythologySubmission = MythologySubmission;

    // Export utilities
    window.ValidationUtils = ValidationUtils;
    window.SanitizationUtils = SanitizationUtils;
    window.SubmissionMetadata = SubmissionMetadata;

    // Create singleton instance
    window.assetSubmissionService = new UnifiedAssetSubmissionService();
}

// CommonJS export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AssetSubmissionBase,
        AssetSubmissionFactory,
        UnifiedAssetSubmissionService,
        DeitySubmission,
        CreatureSubmission,
        HeroSubmission,
        ItemSubmission,
        PlaceSubmission,
        ArchetypeSubmission,
        MagicSubmission,
        HerbSubmission,
        RitualSubmission,
        TextSubmission,
        SymbolSubmission,
        MythologySubmission,
        ValidationUtils,
        SanitizationUtils,
        SubmissionMetadata
    };
}
