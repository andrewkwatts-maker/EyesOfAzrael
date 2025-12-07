/**
 * Alternate Name Index System
 * Builds searchable index from entity metadata files
 *
 * Purpose:
 * - Index primary names, alternate names, and linguistic variations
 * - Support fast lookup by any name variant
 * - Handle mythology-specific name contexts
 * - Enable cross-cultural entity discovery
 *
 * Usage:
 *   const index = new AlternateNameIndex();
 *   await index.loadFromDirectory('/data/entities');
 *   const matches = index.findEntitiesByName('Enki');
 *   // Returns: [{id: 'enki', primaryName: 'Enki', alternates: ['Ea', 'Nudimmud']}, ...]
 */

class AlternateNameIndex {
  constructor() {
    this.nameToEntities = new Map(); // name -> [entity references]
    this.entityById = new Map();     // id -> full entity data
    this.indexedCount = 0;
    this.initialized = false;
  }

  /**
   * Load and index all entities from directory structure
   * @param {string} baseDir - Base directory path (e.g., '/data/entities')
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Loading statistics
   */
  async loadFromDirectory(baseDir = '/data/entities', options = {}) {
    const {
      entityTypes = ['deity', 'creature', 'hero', 'place', 'item', 'concept', 'magic'],
      progressCallback = null,
      errorCallback = null
    } = options;

    const stats = {
      totalEntities: 0,
      totalNames: 0,
      errors: [],
      byType: {}
    };

    try {
      for (const entityType of entityTypes) {
        const typeDir = `${baseDir}/${entityType}`;
        const typeStats = await this._loadEntityType(typeDir, entityType, {
          progressCallback,
          errorCallback
        });

        stats.totalEntities += typeStats.count;
        stats.totalNames += typeStats.namesIndexed;
        stats.byType[entityType] = typeStats;
      }

      this.initialized = true;
      this.indexedCount = stats.totalEntities;

      return stats;
    } catch (error) {
      console.error('Failed to load entity directory:', error);
      throw error;
    }
  }

  /**
   * Load entities from a single type directory
   * @private
   */
  async _loadEntityType(typeDir, entityType, options) {
    const stats = { count: 0, namesIndexed: 0, files: [] };

    try {
      // Fetch directory listing (requires server-side directory listing or manifest)
      // For now, we'll rely on a manifest file or entity list
      const manifestPath = `${typeDir}/manifest.json`;
      let entityFiles = [];

      try {
        const manifestResponse = await fetch(manifestPath);
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          entityFiles = manifest.files || [];
        }
      } catch (e) {
        // No manifest, skip this type
        console.warn(`No manifest found for ${entityType}, skipping`);
        return stats;
      }

      // Load each entity file
      for (const filename of entityFiles) {
        try {
          const entityPath = `${typeDir}/${filename}`;
          const response = await fetch(entityPath);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const entityData = await response.json();
          this.indexEntity(entityData);

          stats.count++;
          stats.namesIndexed += this._countIndexedNames(entityData);
          stats.files.push(filename);

          if (options.progressCallback) {
            options.progressCallback({
              entityType,
              filename,
              count: stats.count
            });
          }
        } catch (error) {
          if (options.errorCallback) {
            options.errorCallback({ entityType, filename, error });
          }
          console.warn(`Failed to load ${entityType}/${filename}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to load entity type ${entityType}:`, error);
    }

    return stats;
  }

  /**
   * Load entities from a pre-built array (for direct use)
   * @param {Array} entities - Array of entity objects
   * @returns {Object} Indexing statistics
   */
  loadFromArray(entities) {
    const stats = {
      totalEntities: 0,
      totalNames: 0,
      byType: {}
    };

    for (const entity of entities) {
      this.indexEntity(entity);
      stats.totalEntities++;
      stats.totalNames += this._countIndexedNames(entity);

      const type = entity.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    this.initialized = true;
    this.indexedCount = stats.totalEntities;

    return stats;
  }

  /**
   * Index a single entity and all its name variants
   * @param {Object} entity - Entity data object
   */
  indexEntity(entity) {
    if (!entity.id || !entity.name) {
      console.warn('Entity missing id or name:', entity);
      return;
    }

    // Store entity reference
    const entityRef = {
      id: entity.id,
      type: entity.type,
      primaryName: entity.name,
      mythology: entity.primaryMythology || entity.mythologies?.[0],
      mythologies: entity.mythologies || []
    };

    this.entityById.set(entity.id, entityRef);

    // Index primary name
    this._indexName(entity.name, entityRef, 'primary');

    // Index alternative names from mythologyContexts
    if (entity.mythologyContexts && Array.isArray(entity.mythologyContexts)) {
      for (const context of entity.mythologyContexts) {
        if (context.names && Array.isArray(context.names)) {
          for (const altName of context.names) {
            this._indexName(altName, entityRef, 'mythology-context', {
              mythology: context.mythology,
              context: context.usage
            });
          }
        }
      }
    }

    // Index linguistic alternatives
    if (entity.linguistic) {
      const ling = entity.linguistic;

      // Original name
      if (ling.originalName) {
        this._indexName(ling.originalName, entityRef, 'original');
      }

      // Transliteration
      if (ling.transliteration && ling.transliteration !== entity.name) {
        this._indexName(ling.transliteration, entityRef, 'transliteration');
      }

      // Alternative names with detailed metadata
      if (ling.alternativeNames && Array.isArray(ling.alternativeNames)) {
        for (const alt of ling.alternativeNames) {
          this._indexName(alt.name, entityRef, 'alternative', {
            language: alt.language,
            context: alt.context,
            meaning: alt.meaning
          });
        }
      }

      // Cognates
      if (ling.cognates && Array.isArray(ling.cognates)) {
        for (const cognate of ling.cognates) {
          this._indexName(cognate.term, entityRef, 'cognate', {
            language: cognate.language
          });
        }
      }
    }

    // Index tags (lowercase)
    if (entity.tags && Array.isArray(entity.tags)) {
      for (const tag of entity.tags) {
        this._indexName(tag, entityRef, 'tag');
      }
    }
  }

  /**
   * Index a single name variant
   * @private
   */
  _indexName(name, entityRef, type = 'unknown', metadata = {}) {
    if (!name || typeof name !== 'string') {
      return;
    }

    const normalizedName = this._normalizeName(name);

    if (!this.nameToEntities.has(normalizedName)) {
      this.nameToEntities.set(normalizedName, []);
    }

    const entries = this.nameToEntities.get(normalizedName);

    // Avoid duplicate entries for same entity
    const existingEntry = entries.find(e => e.entity.id === entityRef.id);

    if (existingEntry) {
      // Add this variant to existing entry
      existingEntry.variants.push({
        name: name, // Keep original case/spelling
        type,
        ...metadata
      });
    } else {
      entries.push({
        entity: entityRef,
        variants: [{
          name: name,
          type,
          ...metadata
        }]
      });
    }
  }

  /**
   * Normalize name for matching (lowercase, trim, remove diacritics)
   * @private
   */
  _normalizeName(name) {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }

  /**
   * Count indexed names for an entity
   * @private
   */
  _countIndexedNames(entity) {
    let count = 1; // Primary name

    if (entity.mythologyContexts) {
      for (const ctx of entity.mythologyContexts) {
        count += (ctx.names || []).length;
      }
    }

    if (entity.linguistic) {
      const ling = entity.linguistic;
      if (ling.originalName) count++;
      if (ling.transliteration) count++;
      count += (ling.alternativeNames || []).length;
      count += (ling.cognates || []).length;
    }

    count += (entity.tags || []).length;

    return count;
  }

  /**
   * Find entities by any name variant
   * @param {string} searchName - Name to search for
   * @param {Object} options - Search options
   * @returns {Array} Matching entity references with variant info
   */
  findEntitiesByName(searchName, options = {}) {
    const {
      exactMatch = false,
      mythology = null,
      entityType = null,
      limit = 10
    } = options;

    const normalizedSearch = this._normalizeName(searchName);
    const results = [];

    if (exactMatch) {
      // Exact match only
      const entries = this.nameToEntities.get(normalizedSearch);
      if (entries) {
        results.push(...entries);
      }
    } else {
      // Partial match (name contains search term)
      for (const [name, entries] of this.nameToEntities.entries()) {
        if (name.includes(normalizedSearch)) {
          results.push(...entries);
        }
      }
    }

    // Filter by mythology if specified
    let filtered = results;
    if (mythology) {
      filtered = filtered.filter(entry =>
        entry.entity.mythologies.includes(mythology)
      );
    }

    // Filter by entity type if specified
    if (entityType) {
      filtered = filtered.filter(entry =>
        entry.entity.type === entityType
      );
    }

    // Limit results
    if (limit && filtered.length > limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered.map(entry => ({
      id: entry.entity.id,
      type: entry.entity.type,
      primaryName: entry.entity.primaryName,
      mythology: entry.entity.mythology,
      mythologies: entry.entity.mythologies,
      matchedVariants: entry.variants,
      relevance: this._calculateRelevance(entry, normalizedSearch)
    })).sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate relevance score for search result
   * @private
   */
  _calculateRelevance(entry, searchTerm) {
    let score = 0;

    for (const variant of entry.variants) {
      const normalizedVariant = this._normalizeName(variant.name);

      // Exact match gets highest score
      if (normalizedVariant === searchTerm) {
        score += variant.type === 'primary' ? 100 : 80;
      }
      // Starts with search term
      else if (normalizedVariant.startsWith(searchTerm)) {
        score += variant.type === 'primary' ? 60 : 40;
      }
      // Contains search term
      else if (normalizedVariant.includes(searchTerm)) {
        score += variant.type === 'primary' ? 30 : 20;
      }

      // Bonus for primary name type
      if (variant.type === 'primary') {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Get all alternate names for an entity
   * @param {string} entityId - Entity ID
   * @returns {Array} All name variants
   */
  getAlternateNames(entityId) {
    const entity = this.entityById.get(entityId);
    if (!entity) {
      return [];
    }

    const names = new Set();

    // Find all names that point to this entity
    for (const [name, entries] of this.nameToEntities.entries()) {
      for (const entry of entries) {
        if (entry.entity.id === entityId) {
          for (const variant of entry.variants) {
            names.add(variant.name);
          }
        }
      }
    }

    return Array.from(names);
  }

  /**
   * Expand search terms with alternates
   * @param {string} searchTerm - Original search term
   * @param {Object} options - Expansion options
   * @returns {Array} Array of search terms including alternates
   */
  expandSearchTerms(searchTerm, options = {}) {
    const {
      includePartialMatches = false,
      mythology = null,
      maxAlternates = 5
    } = options;

    const terms = new Set([searchTerm]);

    // Find entities matching the search term
    const matches = this.findEntitiesByName(searchTerm, {
      exactMatch: !includePartialMatches,
      mythology,
      limit: 3 // Only expand top 3 matches
    });

    // Add all alternate names from matched entities
    for (const match of matches) {
      const alternates = this.getAlternateNames(match.id);
      for (const alt of alternates) {
        terms.add(alt);
        if (terms.size >= maxAlternates + 1) {
          break;
        }
      }
      if (terms.size >= maxAlternates + 1) {
        break;
      }
    }

    return Array.from(terms);
  }

  /**
   * Get index statistics
   * @returns {Object} Statistics about the index
   */
  getStats() {
    return {
      initialized: this.initialized,
      totalEntities: this.entityById.size,
      totalNameVariants: this.nameToEntities.size,
      indexedCount: this.indexedCount,
      averageNamesPerEntity: this.entityById.size > 0
        ? (this.nameToEntities.size / this.entityById.size).toFixed(2)
        : 0
    };
  }

  /**
   * Clear the index
   */
  clear() {
    this.nameToEntities.clear();
    this.entityById.clear();
    this.indexedCount = 0;
    this.initialized = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlternateNameIndex;
}
