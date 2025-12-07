/**
 * Corpus Metadata Integration
 * Bridges corpus search with entity metadata system
 *
 * Purpose:
 * - Expand search queries with alternate names
 * - Annotate results with entity metadata
 * - Add cross-cultural equivalents to results
 * - Maintain backward compatibility with existing corpus search
 *
 * Usage:
 *   const integration = new CorpusMetadataIntegration(corpusSearch);
 *   await integration.init();
 *   const results = await integration.searchWithMetadata('Enki');
 *   // Results include matches for "Enki", "Ea", "Nudimmud", etc.
 */

class CorpusMetadataIntegration {
  constructor(corpusSearchInstance, options = {}) {
    this.corpusSearch = corpusSearchInstance;
    this.nameIndex = null;
    this.crossCulturalMap = null;
    this.initialized = false;

    this.options = {
      autoExpandNames: true,
      includeCrossCultural: true,
      maxAlternateTerms: 5,
      annotateResults: true,
      ...options
    };
  }

  /**
   * Initialize metadata integration
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} Success status
   */
  async init(options = {}) {
    const {
      nameIndexInstance = null,
      entities = null,
      crossCulturalMapPath = '/data/cross-cultural-mapping.json',
      loadCrossCulturalMap = true
    } = options;

    try {
      // Initialize or use provided AlternateNameIndex
      if (nameIndexInstance) {
        this.nameIndex = nameIndexInstance;
      } else {
        this.nameIndex = new AlternateNameIndex();

        // Load from entities array if provided
        if (entities) {
          this.nameIndex.loadFromArray(entities);
        } else {
          // Try to load from directory (requires manifest files)
          try {
            await this.nameIndex.loadFromDirectory('/data/entities');
          } catch (e) {
            console.warn('Could not load entities from directory:', e);
            // Continue without entity data - graceful degradation
          }
        }
      }

      // Load cross-cultural mapping
      if (loadCrossCulturalMap) {
        try {
          const response = await fetch(crossCulturalMapPath);
          if (response.ok) {
            this.crossCulturalMap = await response.json();
          }
        } catch (e) {
          console.warn('Could not load cross-cultural mapping:', e);
          // Continue without cross-cultural mapping
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize CorpusMetadataIntegration:', error);
      throw error;
    }
  }

  /**
   * Search with metadata enhancement
   * @param {string} searchTerm - Original search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Enhanced search results
   */
  async searchWithMetadata(searchTerm, options = {}) {
    const {
      caseSensitive = false,
      maxResults = 100,
      contextWords = 10,
      expandNames = this.options.autoExpandNames,
      includeCrossCultural = this.options.includeCrossCultural,
      annotate = this.options.annotateResults,
      ...otherOptions
    } = options;

    // Start with original term
    let searchTerms = [searchTerm];

    // Expand with alternate names if enabled and index available
    if (expandNames && this.nameIndex && this.nameIndex.initialized) {
      searchTerms = this.nameIndex.expandSearchTerms(searchTerm, {
        includePartialMatches: false,
        maxAlternates: this.options.maxAlternateTerms
      });
    }

    // Add cross-cultural equivalents if enabled
    if (includeCrossCultural && this.crossCulturalMap) {
      const crossCulturalTerms = this._getCrossCulturalEquivalents(searchTerm);
      searchTerms.push(...crossCulturalTerms);
    }

    // Remove duplicates
    searchTerms = [...new Set(searchTerms)];

    // Perform corpus search with expanded terms
    const results = await this.corpusSearch.search(searchTerm, {
      caseSensitive,
      maxResults,
      contextWords,
      terms: searchTerms,
      matchAll: false, // Match ANY of the terms
      ...otherOptions
    });

    // Annotate results with entity metadata if enabled
    if (annotate && this.nameIndex && this.nameIndex.initialized) {
      return this._annotateResults(results, searchTerm, searchTerms);
    }

    return results;
  }

  /**
   * Search with standard corpus search (no metadata)
   * Provides backward compatibility
   */
  async search(searchTerm, options = {}) {
    return await this.corpusSearch.search(searchTerm, options);
  }

  /**
   * Get cross-cultural equivalents for a term
   * @private
   */
  _getCrossCulturalEquivalents(searchTerm) {
    if (!this.crossCulturalMap) {
      return [];
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();
    const equivalents = [];

    // Check deity equivalents
    if (this.crossCulturalMap.deityEquivalents) {
      for (const group of this.crossCulturalMap.deityEquivalents) {
        const names = group.names.map(n => n.toLowerCase());
        if (names.includes(normalizedTerm)) {
          // Add all other names in this equivalence group
          for (const name of group.names) {
            if (name.toLowerCase() !== normalizedTerm) {
              equivalents.push(name);
            }
          }
        }
      }
    }

    // Check concept equivalents
    if (this.crossCulturalMap.conceptEquivalents) {
      for (const group of this.crossCulturalMap.conceptEquivalents) {
        const names = group.names.map(n => n.toLowerCase());
        if (names.includes(normalizedTerm)) {
          for (const name of group.names) {
            if (name.toLowerCase() !== normalizedTerm) {
              equivalents.push(name);
            }
          }
        }
      }
    }

    return equivalents;
  }

  /**
   * Annotate search results with entity metadata
   * @private
   */
  _annotateResults(results, originalTerm, expandedTerms) {
    return results.map(result => {
      const annotation = {
        originalSearchTerm: originalTerm,
        expandedTerms: expandedTerms,
        matchedViaAlternate: result.matched_term !== originalTerm,
        entityMetadata: null,
        crossCulturalEquivalents: []
      };

      // Find entity metadata for matched term
      const entityMatches = this.nameIndex.findEntitiesByName(result.matched_term, {
        exactMatch: true,
        limit: 1
      });

      if (entityMatches.length > 0) {
        const entityMatch = entityMatches[0];
        annotation.entityMetadata = {
          id: entityMatch.id,
          type: entityMatch.type,
          primaryName: entityMatch.primaryName,
          mythology: entityMatch.mythology,
          mythologies: entityMatch.mythologies,
          matchedVariants: entityMatch.matchedVariants
        };

        // Get cross-cultural equivalents
        annotation.crossCulturalEquivalents = this._getCrossCulturalEquivalents(
          entityMatch.primaryName
        );
      }

      return {
        ...result,
        metadata: {
          ...result.metadata,
          entityAnnotation: annotation
        }
      };
    });
  }

  /**
   * Get alternate name suggestions for a term
   * @param {string} searchTerm - Search term
   * @param {Object} options - Suggestion options
   * @returns {Array} Suggested alternate searches
   */
  getAlternateSuggestions(searchTerm, options = {}) {
    const {
      limit = 5,
      includeCrossCultural = true
    } = options;

    const suggestions = [];

    // Get alternate names from index
    if (this.nameIndex && this.nameIndex.initialized) {
      const matches = this.nameIndex.findEntitiesByName(searchTerm, {
        exactMatch: false,
        limit: 3
      });

      for (const match of matches) {
        const alternates = this.nameIndex.getAlternateNames(match.id);
        for (const alt of alternates) {
          if (alt.toLowerCase() !== searchTerm.toLowerCase()) {
            suggestions.push({
              term: alt,
              type: 'alternate',
              entity: match.primaryName,
              mythology: match.mythology
            });
          }
        }
      }
    }

    // Add cross-cultural equivalents
    if (includeCrossCultural && this.crossCulturalMap) {
      const crossCulturalTerms = this._getCrossCulturalEquivalents(searchTerm);
      for (const term of crossCulturalTerms) {
        suggestions.push({
          term: term,
          type: 'cross-cultural',
          entity: searchTerm
        });
      }
    }

    // Remove duplicates and limit
    const uniqueSuggestions = suggestions.filter((s, i, arr) =>
      arr.findIndex(s2 => s2.term.toLowerCase() === s.term.toLowerCase()) === i
    );

    return uniqueSuggestions.slice(0, limit);
  }

  /**
   * Get entity information by name
   * @param {string} name - Entity name
   * @returns {Object|null} Entity information
   */
  getEntityByName(name) {
    if (!this.nameIndex || !this.nameIndex.initialized) {
      return null;
    }

    const matches = this.nameIndex.findEntitiesByName(name, {
      exactMatch: true,
      limit: 1
    });

    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Check if metadata integration is available
   * @returns {boolean} Availability status
   */
  isMetadataAvailable() {
    return this.initialized &&
           this.nameIndex &&
           this.nameIndex.initialized &&
           this.nameIndex.getStats().totalEntities > 0;
  }

  /**
   * Get integration statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      initialized: this.initialized,
      metadataAvailable: this.isMetadataAvailable(),
      crossCulturalMapLoaded: this.crossCulturalMap !== null
    };

    if (this.nameIndex) {
      stats.nameIndex = this.nameIndex.getStats();
    }

    if (this.crossCulturalMap) {
      stats.crossCulturalGroups = {
        deities: this.crossCulturalMap.deityEquivalents?.length || 0,
        concepts: this.crossCulturalMap.conceptEquivalents?.length || 0
      };
    }

    return stats;
  }

  /**
   * Enable or disable auto-expansion
   * @param {boolean} enabled - Enable state
   */
  setAutoExpand(enabled) {
    this.options.autoExpandNames = enabled;
  }

  /**
   * Enable or disable cross-cultural search
   * @param {boolean} enabled - Enable state
   */
  setCrossCultural(enabled) {
    this.options.includeCrossCultural = enabled;
  }

  /**
   * Enable or disable result annotation
   * @param {boolean} enabled - Enable state
   */
  setAnnotation(enabled) {
    this.options.annotateResults = enabled;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CorpusMetadataIntegration;
}
