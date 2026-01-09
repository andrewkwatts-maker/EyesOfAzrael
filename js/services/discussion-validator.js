/**
 * Discussion Validator Service
 * AI-powered validation of user contributions for the discussion system
 *
 * Features:
 * - Validates comment relevance to asset topic
 * - Checks corpus query results for supporting evidence
 * - Prevents off-topic or unsubstantiated claims
 * - Returns validation result with explanation
 * - Caches validation results to reduce API calls
 * - Rate limiting to prevent abuse
 *
 * Dependencies:
 * - Firebase Functions (for AI endpoint)
 * - CorpusQueryService (for search results)
 */

class DiscussionValidator {
    /**
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            assetId: options.assetId || null,
            assetType: options.assetType || 'assets',
            mythology: options.mythology || '',
            endpoint: options.endpoint || '/api/validate-discussion',
            minRelevanceScore: options.minRelevanceScore || 0.6,
            minCorpusMatches: options.minCorpusMatches || 1,
            maxRetries: options.maxRetries || 2,
            cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
            rateLimitPerMinute: options.rateLimitPerMinute || 10,
            ...options
        };

        // Cache for validation results
        this.validationCache = new Map();

        // Rate limiting
        this.requestTimestamps = [];
        this.rateLimitWindow = 60000; // 1 minute

        // Asset context for validation
        this.assetContext = null;
    }

    /**
     * Load asset context for better validation
     * @param {Object} assetData - Asset data from Firestore
     */
    setAssetContext(assetData) {
        this.assetContext = {
            id: assetData.id,
            name: assetData.name,
            type: assetData.entityType,
            mythology: assetData.mythology,
            description: assetData.description || '',
            domains: assetData.domains || [],
            keywords: this._extractKeywords(assetData),
            relatedTopics: assetData.relatedTopics || []
        };
    }

    /**
     * Extract keywords from asset data
     */
    _extractKeywords(assetData) {
        const keywords = new Set();

        // Add name words
        if (assetData.name) {
            assetData.name.split(/\s+/).forEach(word => {
                if (word.length > 2) keywords.add(word.toLowerCase());
            });
        }

        // Add domains
        if (assetData.domains) {
            assetData.domains.forEach(domain => keywords.add(domain.toLowerCase()));
        }

        // Add symbols
        if (assetData.symbols) {
            assetData.symbols.forEach(symbol => keywords.add(symbol.toLowerCase()));
        }

        // Add alternative names
        if (assetData.alternateNames) {
            assetData.alternateNames.forEach(name => keywords.add(name.toLowerCase()));
        }

        return Array.from(keywords);
    }

    /**
     * Validate a user contribution
     * @param {Object} params - Validation parameters
     * @param {string} params.content - User's comment content
     * @param {string} params.corpusQuery - The corpus search query used
     * @param {Object} params.corpusResults - Results from corpus search
     * @param {string} params.assetName - Name of the asset being discussed
     * @returns {Promise<Object>} Validation result
     */
    async validate(params) {
        const { content, corpusQuery, corpusResults, assetName } = params;

        // Check rate limit
        if (!this._checkRateLimit()) {
            return {
                isValid: false,
                message: 'Too many validation requests. Please wait a moment before trying again.',
                error: 'RATE_LIMIT_EXCEEDED'
            };
        }

        // Check cache
        const cacheKey = this._generateCacheKey(content, corpusQuery);
        const cached = this.validationCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.options.cacheTimeout) {
            return cached.result;
        }

        try {
            // Record request timestamp for rate limiting
            this.requestTimestamps.push(Date.now());

            // Perform validation steps
            const validationResult = await this._performValidation({
                content,
                corpusQuery,
                corpusResults,
                assetName
            });

            // Cache result
            this.validationCache.set(cacheKey, {
                result: validationResult,
                timestamp: Date.now()
            });

            return validationResult;

        } catch (error) {
            console.error('[DiscussionValidator] Validation error:', error);
            return {
                isValid: false,
                message: 'Validation failed. Please try again.',
                error: error.message
            };
        }
    }

    /**
     * Perform the actual validation
     */
    async _performValidation(params) {
        const { content, corpusQuery, corpusResults, assetName } = params;

        // Step 1: Basic content checks
        const contentCheck = this._validateContent(content);
        if (!contentCheck.isValid) {
            return contentCheck;
        }

        // Step 2: Corpus results check
        const corpusCheck = this._validateCorpusResults(corpusResults, corpusQuery);
        if (!corpusCheck.isValid) {
            return corpusCheck;
        }

        // Step 3: Relevance check (local heuristics)
        const relevanceCheck = this._checkRelevance(content, corpusResults, assetName);

        // Step 4: AI validation (if available)
        let aiValidation = null;
        try {
            aiValidation = await this._callAIValidation({
                content,
                corpusQuery,
                corpusResults: this._summarizeCorpusResults(corpusResults),
                assetContext: this.assetContext,
                assetName
            });
        } catch (error) {
            console.warn('[DiscussionValidator] AI validation unavailable, using local validation:', error.message);
        }

        // Combine results
        const combinedScore = this._calculateCombinedScore(relevanceCheck, aiValidation);
        const isValid = combinedScore >= this.options.minRelevanceScore;

        return {
            isValid,
            score: combinedScore,
            message: this._generateValidationMessage(isValid, relevanceCheck, aiValidation),
            details: {
                contentCheck: contentCheck.isValid,
                corpusCheck: corpusCheck.isValid,
                relevanceScore: relevanceCheck.score,
                aiScore: aiValidation?.score || null,
                combinedScore
            }
        };
    }

    /**
     * Validate basic content requirements
     */
    _validateContent(content) {
        if (!content || typeof content !== 'string') {
            return {
                isValid: false,
                message: 'Content is required.'
            };
        }

        const trimmedContent = content.trim();

        if (trimmedContent.length < 10) {
            return {
                isValid: false,
                message: 'Please provide more detail in your contribution (at least 10 characters).'
            };
        }

        if (trimmedContent.length > 5000) {
            return {
                isValid: false,
                message: 'Content exceeds maximum length (5000 characters).'
            };
        }

        // Check for spam patterns
        const spamPatterns = [
            /(.)\1{10,}/,  // Repeated characters
            /(https?:\/\/[^\s]+\s*){3,}/i,  // Multiple URLs
            /\b(buy|sell|discount|offer|click here)\b/gi  // Commercial spam
        ];

        for (const pattern of spamPatterns) {
            if (pattern.test(trimmedContent)) {
                return {
                    isValid: false,
                    message: 'Your contribution appears to contain spam. Please revise.'
                };
            }
        }

        return { isValid: true };
    }

    /**
     * Validate corpus search results
     */
    _validateCorpusResults(corpusResults, corpusQuery) {
        if (!corpusQuery || corpusQuery.trim().length < 3) {
            return {
                isValid: false,
                message: 'A corpus search query is required to validate your contribution.'
            };
        }

        if (!corpusResults) {
            return {
                isValid: false,
                message: 'Please run a corpus search to find supporting evidence.'
            };
        }

        const combined = corpusResults.combined || [];

        if (combined.length < this.options.minCorpusMatches) {
            return {
                isValid: false,
                message: `No corpus results found for "${corpusQuery}". Please try a different search query that finds relevant source material.`
            };
        }

        return { isValid: true };
    }

    /**
     * Check relevance using local heuristics
     */
    _checkRelevance(content, corpusResults, assetName) {
        let score = 0;
        const maxScore = 100;
        const details = [];

        const contentLower = content.toLowerCase();
        const combined = corpusResults?.combined || [];

        // Check 1: Asset name mentioned (20 points)
        if (assetName && contentLower.includes(assetName.toLowerCase())) {
            score += 20;
            details.push('Asset name referenced');
        }

        // Check 2: Keywords from asset context (20 points)
        if (this.assetContext?.keywords) {
            const matchedKeywords = this.assetContext.keywords.filter(keyword =>
                contentLower.includes(keyword)
            );
            const keywordScore = Math.min(20, matchedKeywords.length * 5);
            score += keywordScore;
            if (matchedKeywords.length > 0) {
                details.push(`${matchedKeywords.length} relevant keyword(s) found`);
            }
        }

        // Check 3: Corpus terms overlap (30 points)
        const corpusTerms = this._extractCorpusTerms(combined);
        const termOverlap = corpusTerms.filter(term => contentLower.includes(term)).length;
        const corpusScore = Math.min(30, termOverlap * 10);
        score += corpusScore;
        if (termOverlap > 0) {
            details.push(`${termOverlap} corpus term(s) referenced`);
        }

        // Check 4: Mythology reference (15 points)
        if (this.assetContext?.mythology) {
            if (contentLower.includes(this.assetContext.mythology.toLowerCase())) {
                score += 15;
                details.push('Mythology referenced');
            }
        }

        // Check 5: Educational/substantive content (15 points)
        // Look for explanatory language
        const substantivePatterns = [
            /according to/i,
            /in (the )?mythology/i,
            /represents/i,
            /symbolizes/i,
            /is associated with/i,
            /historically/i,
            /traditionally/i,
            /the (story|myth|legend) (of|tells|describes)/i,
            /scholars (believe|argue|suggest)/i
        ];

        const substantiveMatches = substantivePatterns.filter(pattern => pattern.test(content));
        score += Math.min(15, substantiveMatches.length * 5);
        if (substantiveMatches.length > 0) {
            details.push('Substantive academic language');
        }

        return {
            score: score / maxScore,
            details,
            rawScore: score,
            maxScore
        };
    }

    /**
     * Extract key terms from corpus results
     */
    _extractCorpusTerms(corpusResults) {
        const terms = new Set();

        corpusResults.forEach(result => {
            // Extract from title/name
            if (result.title || result.name) {
                const words = (result.title || result.name).split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3) terms.add(word.toLowerCase());
                });
            }

            // Extract from highlights
            if (result.highlights) {
                result.highlights.forEach(highlight => {
                    if (highlight.length > 3) terms.add(highlight.toLowerCase());
                });
            }
        });

        return Array.from(terms).slice(0, 20);
    }

    /**
     * Summarize corpus results for AI validation
     */
    _summarizeCorpusResults(corpusResults) {
        if (!corpusResults?.combined) return [];

        return corpusResults.combined.slice(0, 5).map(result => ({
            source: result._source,
            title: result.title || result.name || 'Unknown',
            excerpt: (result.context || result.description || '').substring(0, 200)
        }));
    }

    /**
     * Call AI validation endpoint
     */
    async _callAIValidation(params) {
        // Check if Firebase Functions is available
        if (typeof firebase === 'undefined' || !firebase.functions) {
            throw new Error('Firebase Functions not available');
        }

        const validateDiscussion = firebase.functions().httpsCallable('validateDiscussion');

        const result = await validateDiscussion({
            content: params.content,
            corpusQuery: params.corpusQuery,
            corpusResults: params.corpusResults,
            assetId: this.options.assetId,
            assetName: params.assetName,
            mythology: this.options.mythology
        });

        return result.data;
    }

    /**
     * Calculate combined validation score
     */
    _calculateCombinedScore(relevanceCheck, aiValidation) {
        // Weight local heuristics and AI equally if both available
        if (aiValidation && typeof aiValidation.score === 'number') {
            return (relevanceCheck.score * 0.4) + (aiValidation.score * 0.6);
        }

        // Use only local heuristics if AI unavailable
        return relevanceCheck.score;
    }

    /**
     * Generate user-friendly validation message
     */
    _generateValidationMessage(isValid, relevanceCheck, aiValidation) {
        if (isValid) {
            const details = relevanceCheck.details.join(', ');
            return `Validated! Your contribution is relevant. ${details ? `(${details})` : ''}`;
        }

        // Build feedback for improvement
        const suggestions = [];

        if (relevanceCheck.score < 0.3) {
            suggestions.push('Your contribution does not appear to be related to this topic.');
        } else if (relevanceCheck.score < 0.6) {
            suggestions.push('Please strengthen the connection to the topic.');
        }

        if (relevanceCheck.details.length === 0) {
            suggestions.push('Try referencing specific aspects of the subject matter.');
        }

        if (aiValidation && !aiValidation.isValid && aiValidation.feedback) {
            suggestions.push(aiValidation.feedback);
        }

        return suggestions.length > 0
            ? `Needs improvement: ${suggestions.join(' ')}`
            : 'Your contribution could not be validated. Please ensure it relates to the topic and is supported by the corpus search.';
    }

    /**
     * Check rate limit
     */
    _checkRateLimit() {
        const now = Date.now();
        const windowStart = now - this.rateLimitWindow;

        // Remove timestamps outside the window
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > windowStart);

        // Check if under limit
        return this.requestTimestamps.length < this.options.rateLimitPerMinute;
    }

    /**
     * Generate cache key
     */
    _generateCacheKey(content, corpusQuery) {
        const hash = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        };

        return `${hash(content)}_${hash(corpusQuery || '')}`;
    }

    /**
     * Clear validation cache
     */
    clearCache() {
        this.validationCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.validationCache.size,
            rateLimitRemaining: this.options.rateLimitPerMinute - this.requestTimestamps.length
        };
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiscussionValidator };
}

// Global export
if (typeof window !== 'undefined') {
    window.DiscussionValidator = DiscussionValidator;
}
