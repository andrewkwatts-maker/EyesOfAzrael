/**
 * Comprehensive Connection Validator
 *
 * Validates all entity connections against the standardized connection schema.
 * Identifies:
 * - Legacy field names that need migration
 * - Incorrect formats (strings instead of objects)
 * - Missing required fields (id, name)
 * - Invalid relationship types
 * - Broken links (references to non-existent entities)
 * - Invalid hyperlinks/URLs
 * - Invalid corpus searches
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class ConnectionValidator {
  findAssetsPath() {
    // Prefer firebase-assets-downloaded in project root
    const projectDir = path.join(__dirname, '..');
    const mainAssetsPath = path.join(projectDir, 'firebase-assets-downloaded');

    if (fsSync.existsSync(path.join(mainAssetsPath, 'deities'))) {
      return mainAssetsPath;
    }

    // Fallback to backups directory
    const backupsDir = path.join(projectDir, 'backups');

    try {
      const dirs = fsSync.readdirSync(backupsDir);
      const assetDirs = dirs
        .filter(d => d.startsWith('firebase-assets'))
        .sort()
        .reverse();

      for (const dir of assetDirs) {
        const fullPath = path.join(backupsDir, dir);
        const deitiesPath = path.join(fullPath, 'deities');
        if (fsSync.existsSync(deitiesPath)) {
          return fullPath;
        }
      }
    } catch (e) {
      // Fallback
    }

    return path.join(backupsDir, 'firebase-assets-pre-enrichment');
  }

  constructor(options = {}) {
    this.assetsPath = options.assetsPath || this.findAssetsPath();
    this.allAssets = new Map(); // id -> asset
    this.assetsByType = new Map(); // type -> [assets]
    this.assetsByMythology = new Map(); // mythology -> [assets]

    // Load connection schema definitions
    this.validRelationshipTypes = [
      'parent', 'father', 'mother',
      'child', 'son', 'daughter',
      'sibling', 'brother', 'sister',
      'spouse', 'consort', 'lover',
      'offspring', 'ancestor', 'descendant',
      'ally', 'enemy', 'rival',
      'companion', 'friend',
      'servant', 'master',
      'worshipper', 'devotee',
      'mentor', 'student', 'teacher',
      'creator', 'creation', 'created_by',
      'slayer', 'victim', 'slain_by',
      'aspect', 'avatar', 'incarnation',
      'syncretism', 'equivalent',
      'parallel', 'derived', 'influenced',
      'contrasts', 'similar', 'related',
      'historical', 'thematic', 'symbolic',
      'wielder', 'wielded_by',
      'ruler', 'ruled_by',
      'guardian', 'guarded_by',
      'associated', 'linked', 'connected',
      'origin', 'destination',
      'contains', 'contained_in',
      'member', 'group',
      'other'
    ];

    this.validEntityTypes = [
      'deity', 'hero', 'creature', 'item', 'place', 'text',
      'ritual', 'symbol', 'herb', 'cosmology', 'concept',
      'event', 'archetype', 'magic', 'mythology'
    ];

    // Legacy fields that should be migrated
    this.legacyFields = {
      'related_deities': 'relatedEntities.deities',
      'related_heroes': 'relatedEntities.heroes',
      'related_creatures': 'relatedEntities.creatures',
      'related_items': 'relatedEntities.items',
      'related_places': 'relatedEntities.places',
      'related_texts': 'relatedEntities.texts',
      'associated_deities': 'relatedEntities.deities',
      'associated_places': 'relatedEntities.places',
      'associated_heroes': 'relatedEntities.heroes',
      'mythology_links': 'relatedEntities.mythologies',
      'relatedArchetypes': 'relatedEntities.archetypes',
      'relatedDeities': 'relatedEntities.deities',
      'relatedConcepts': 'relatedEntities.concepts',
      'relatedHeroes': 'relatedEntities.heroes',
      'relatedCreatures': 'relatedEntities.creatures',
      'relatedItems': 'relatedEntities.items',
      'relatedPlaces': 'relatedEntities.places',
      'wielders': 'relatedEntities.heroes',
      'inhabitants': 'relatedEntities.deities',
      'guardians': 'relatedEntities.creatures'
    };

    // Connection fields to validate
    this.connectionFields = [
      'family', 'relatedEntities', 'allies', 'enemies',
      'related_deities', 'related_heroes', 'related_creatures',
      'related_items', 'related_places', 'related_texts',
      'associated_deities', 'associated_places', 'associated_heroes',
      'mythology_links', 'relatedArchetypes', 'relatedDeities',
      'relatedConcepts', 'relatedHeroes', 'relatedCreatures',
      'relatedItems', 'relatedPlaces', 'wielders', 'inhabitants',
      'guardians', 'companions', 'associations', 'connections',
      'relationships', 'corpusSearch', 'primarySources', 'sources'
    ];

    // Content completeness configuration
    this.contentConfig = {
      minDescriptionLength: 100,
      descriptionFields: ['description', 'fullDescription', 'overview', 'summary'],
      keyNarrativeFields: ['keyMyths', 'keyNarratives', 'myths', 'narratives', 'stories', 'legends'],
      sourceFields: ['sources', 'primarySources', 'references', 'bibliography'],
      domainFields: ['domains', 'attributes', 'powers', 'abilities', 'aspects', 'spheres']
    };

    // Results
    this.results = {
      totalAssets: 0,
      totalConnections: 0,
      errors: [],
      warnings: [],
      legacyFieldUsage: {},
      formatIssues: [],
      brokenLinks: [],
      invalidUrls: [],
      invalidCorpusSearches: [],
      schemaViolations: [],
      assetsByCompliance: { compliant: 0, nonCompliant: 0 },
      issuesByType: {},
      // New content validation results
      contentValidation: {
        totalScored: 0,
        totalReadinessScore: 0,
        averageReadinessScore: 0,
        assetsNeedingEnrichment: [],
        readinessDistribution: {
          excellent: 0,    // 90-100
          good: 0,         // 70-89
          moderate: 0,     // 50-69
          poor: 0,         // 25-49
          minimal: 0       // 0-24
        },
        missingContent: {
          description: [],
          keyNarratives: [],
          sources: [],
          domains: [],
          corpusSearch: []
        }
      }
    };
  }

  async loadAllAssets() {
    console.log('Loading assets from:', this.assetsPath);

    const categories = [
      'deities', 'heroes', 'creatures', 'items', 'places',
      'texts', 'cosmology', 'rituals', 'herbs', 'symbols',
      'events', 'concepts', 'archetypes', 'magic', 'angels',
      'beings', 'figures', 'path', 'teachings', 'mythologies'
    ];

    for (const category of categories) {
      const categoryPath = path.join(this.assetsPath, category);
      await this.loadCategory(category, categoryPath);
    }

    this.results.totalAssets = this.allAssets.size;
    console.log(`Loaded ${this.results.totalAssets} assets`);
  }

  async loadCategory(category, categoryPath) {
    try {
      const stats = await fs.stat(categoryPath);
      if (!stats.isDirectory()) return;
    } catch {
      return;
    }

    const entries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

      const entryPath = path.join(categoryPath, entry.name);

      if (entry.isDirectory()) {
        // Mythology subdirectory
        await this.loadSubdirectory(category, entryPath);
      } else if (entry.name.endsWith('.json')) {
        await this.loadAssetFile(entryPath, category);
      }
    }
  }

  async loadSubdirectory(category, dirPath) {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('_')) {
        await this.loadAssetFile(path.join(dirPath, file), category);
      }
    }
  }

  async loadAssetFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const asset = JSON.parse(content);

      if (asset.id) {
        asset._category = category;
        asset._filePath = filePath;
        this.indexAsset(asset);
      }
    } catch (error) {
      this.results.errors.push({
        type: 'FILE_LOAD_ERROR',
        file: filePath,
        message: error.message
      });
    }
  }

  indexAsset(asset) {
    this.allAssets.set(asset.id, asset);

    // Index by type
    const type = asset.type || asset._category;
    if (!this.assetsByType.has(type)) {
      this.assetsByType.set(type, []);
    }
    this.assetsByType.get(type).push(asset);

    // Index by mythology
    const mythology = asset.mythology || asset.primaryMythology;
    if (mythology) {
      if (!this.assetsByMythology.has(mythology)) {
        this.assetsByMythology.set(mythology, []);
      }
      this.assetsByMythology.get(mythology).push(asset);
    }
  }

  async validateAllConnections() {
    console.log('\nValidating connections...');

    for (const [id, asset] of this.allAssets) {
      const assetIssues = this.validateAssetConnections(asset);

      if (assetIssues.length > 0) {
        this.results.assetsByCompliance.nonCompliant++;

        // Track issues by type
        const type = asset.type || asset._category;
        if (!this.results.issuesByType[type]) {
          this.results.issuesByType[type] = { count: 0, assets: [] };
        }
        this.results.issuesByType[type].count += assetIssues.length;
        this.results.issuesByType[type].assets.push(asset.id);
      } else {
        this.results.assetsByCompliance.compliant++;
      }
    }

    // Calculate average readiness score
    if (this.results.contentValidation.totalScored > 0) {
      this.results.contentValidation.averageReadinessScore =
        Math.round(this.results.contentValidation.totalReadinessScore / this.results.contentValidation.totalScored);
    }

    // Sort assets needing enrichment by score (lowest first)
    this.results.contentValidation.assetsNeedingEnrichment.sort((a, b) => a.score - b.score);

    console.log(`Validation complete!`);
    console.log(`- Compliant assets: ${this.results.assetsByCompliance.compliant}`);
    console.log(`- Non-compliant assets: ${this.results.assetsByCompliance.nonCompliant}`);
    console.log(`- Average readiness score: ${this.results.contentValidation.averageReadinessScore}/100`);
    console.log(`- Assets needing enrichment (score < 70): ${this.results.contentValidation.assetsNeedingEnrichment.length}`);
  }

  validateAssetConnections(asset) {
    const issues = [];

    // Check for legacy field usage
    for (const [legacyField, modernField] of Object.entries(this.legacyFields)) {
      if (asset[legacyField] !== undefined) {
        const issue = {
          type: 'LEGACY_FIELD',
          assetId: asset.id,
          assetName: asset.name,
          field: legacyField,
          modernEquivalent: modernField,
          severity: 'warning'
        };
        issues.push(issue);
        this.results.warnings.push(issue);

        // Track legacy field usage
        if (!this.results.legacyFieldUsage[legacyField]) {
          this.results.legacyFieldUsage[legacyField] = { count: 0, assets: [] };
        }
        this.results.legacyFieldUsage[legacyField].count++;
        this.results.legacyFieldUsage[legacyField].assets.push(asset.id);
      }
    }

    // Validate family structure
    if (asset.family) {
      issues.push(...this.validateFamilyStructure(asset));
    }

    // Validate relatedEntities
    if (asset.relatedEntities) {
      issues.push(...this.validateRelatedEntities(asset));
    }

    // Validate allies/enemies
    if (asset.allies) {
      issues.push(...this.validateEntityReferences(asset, 'allies', asset.allies));
    }
    if (asset.enemies) {
      issues.push(...this.validateEntityReferences(asset, 'enemies', asset.enemies));
    }

    // Validate corpus search
    if (asset.corpusSearch) {
      issues.push(...this.validateCorpusSearch(asset));
    }

    // Validate sources
    if (asset.primarySources) {
      issues.push(...this.validateSources(asset, 'primarySources', asset.primarySources));
    }
    if (asset.sources) {
      issues.push(...this.validateSources(asset, 'sources', asset.sources));
    }

    // Validate legacy connection arrays
    const legacyArrayFields = [
      'related_deities', 'related_heroes', 'related_creatures',
      'related_items', 'related_places', 'related_texts',
      'wielders', 'inhabitants', 'guardians', 'companions'
    ];

    for (const field of legacyArrayFields) {
      if (asset[field]) {
        issues.push(...this.validateLegacyConnectionArray(asset, field));
      }
    }

    // Validate URLs in the asset
    issues.push(...this.validateAssetUrls(asset));

    // Content completeness validation (produces warnings, not errors)
    const contentIssues = this.validateContentCompleteness(asset);
    issues.push(...contentIssues);

    // Enhanced corpus search validation
    const corpusIssues = this.validateCorpusSearchComprehensive(asset);
    issues.push(...corpusIssues);

    // Calculate and track wiki-readiness score
    const readinessResult = this.calculateReadinessScore(asset);
    asset._readinessScore = readinessResult.score;
    asset._readinessBreakdown = readinessResult.breakdown;

    // Track readiness statistics
    this.results.contentValidation.totalScored++;
    this.results.contentValidation.totalReadinessScore += readinessResult.score;

    // Track readiness distribution
    if (readinessResult.score >= 90) {
      this.results.contentValidation.readinessDistribution.excellent++;
    } else if (readinessResult.score >= 70) {
      this.results.contentValidation.readinessDistribution.good++;
    } else if (readinessResult.score >= 50) {
      this.results.contentValidation.readinessDistribution.moderate++;
    } else if (readinessResult.score >= 25) {
      this.results.contentValidation.readinessDistribution.poor++;
    } else {
      this.results.contentValidation.readinessDistribution.minimal++;
    }

    // Track assets needing enrichment (score < 70)
    if (readinessResult.score < 70) {
      this.results.contentValidation.assetsNeedingEnrichment.push({
        id: asset.id,
        name: asset.name,
        type: asset.type || asset._category,
        score: readinessResult.score,
        breakdown: readinessResult.breakdown
      });
    }

    return issues;
  }

  validateFamilyStructure(asset) {
    const issues = [];
    const family = asset.family;
    const familyFields = ['parents', 'children', 'siblings', 'consorts', 'ancestors', 'descendants'];

    for (const field of familyFields) {
      if (family[field] !== undefined) {
        if (typeof family[field] === 'string') {
          // Legacy: string format needs migration
          const issue = {
            type: 'FAMILY_STRING_FORMAT',
            assetId: asset.id,
            assetName: asset.name,
            field: `family.${field}`,
            value: family[field],
            message: 'Family field is a string; should be array of entityReferences',
            severity: 'error'
          };
          issues.push(issue);
          this.results.formatIssues.push(issue);
        } else if (Array.isArray(family[field])) {
          issues.push(...this.validateEntityReferences(asset, `family.${field}`, family[field]));
        }
      }
    }

    return issues;
  }

  validateRelatedEntities(asset) {
    const issues = [];
    const related = asset.relatedEntities;

    if (typeof related !== 'object' || related === null) {
      issues.push({
        type: 'INVALID_RELATED_ENTITIES',
        assetId: asset.id,
        assetName: asset.name,
        message: 'relatedEntities must be an object or array',
        severity: 'error'
      });
      return issues;
    }

    // Handle array format: [{ type, name, id, relationship }]
    if (Array.isArray(related)) {
      issues.push(...this.validateEntityReferences(asset, 'relatedEntities', related));
      return issues;
    }

    // Handle object format: { deities: [], heroes: [], ... }
    const validCategories = [
      ...this.validEntityTypes,
      'symbols', 'events', 'deities', 'heroes', 'creatures',
      'items', 'places', 'texts', 'rituals', 'concepts', 'archetypes'
    ];

    for (const [category, entities] of Object.entries(related)) {
      if (!validCategories.includes(category)) {
        const issue = {
          type: 'INVALID_ENTITY_CATEGORY',
          assetId: asset.id,
          assetName: asset.name,
          field: `relatedEntities.${category}`,
          message: `Unknown entity category: ${category}`,
          severity: 'warning'
        };
        issues.push(issue);
        this.results.warnings.push(issue);
      }

      if (Array.isArray(entities)) {
        issues.push(...this.validateEntityReferences(asset, `relatedEntities.${category}`, entities));
      }
    }

    return issues;
  }

  validateEntityReferences(asset, field, references) {
    const issues = [];

    if (!Array.isArray(references)) {
      issues.push({
        type: 'INVALID_REFERENCE_FORMAT',
        assetId: asset.id,
        assetName: asset.name,
        field,
        message: 'Expected array of entity references',
        severity: 'error'
      });
      return issues;
    }

    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      this.results.totalConnections++;

      if (typeof ref === 'string') {
        // String format - needs migration
        const issue = {
          type: 'STRING_REFERENCE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${field}[${i}]`,
          value: ref,
          message: 'Reference is a string; should be entityReference object with id and name',
          severity: 'warning'
        };
        issues.push(issue);
        this.results.formatIssues.push(issue);
      } else if (typeof ref === 'object' && ref !== null) {
        // Object format - validate structure
        issues.push(...this.validateEntityReference(asset, `${field}[${i}]`, ref));
      } else {
        issues.push({
          type: 'INVALID_REFERENCE_TYPE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${field}[${i}]`,
          message: `Invalid reference type: ${typeof ref}`,
          severity: 'error'
        });
      }
    }

    return issues;
  }

  validateEntityReference(asset, field, ref) {
    const issues = [];

    // Check for required fields
    if (!ref.id && !ref.name && !ref.link) {
      const issue = {
        type: 'MISSING_REFERENCE_FIELDS',
        assetId: asset.id,
        assetName: asset.name,
        field,
        value: ref,
        message: 'Entity reference missing id, name, and link',
        severity: 'error'
      };
      issues.push(issue);
      this.results.schemaViolations.push(issue);
    }

    // Warn if missing id
    if (!ref.id && (ref.name || ref.link)) {
      const issue = {
        type: 'MISSING_REFERENCE_ID',
        assetId: asset.id,
        assetName: asset.name,
        field,
        value: ref,
        message: 'Entity reference missing id field',
        suggestedId: this.generateIdFromRef(ref),
        severity: 'warning'
      };
      issues.push(issue);
      this.results.warnings.push(issue);
    }

    // Warn if missing name
    if (!ref.name && ref.id) {
      const issue = {
        type: 'MISSING_REFERENCE_NAME',
        assetId: asset.id,
        assetName: asset.name,
        field,
        value: ref,
        message: 'Entity reference missing name field',
        severity: 'warning'
      };
      issues.push(issue);
      this.results.warnings.push(issue);
    }

    // Validate id format if present
    if (ref.id && !/^[a-z0-9_-]+$/.test(ref.id)) {
      const issue = {
        type: 'INVALID_REFERENCE_ID_FORMAT',
        assetId: asset.id,
        assetName: asset.name,
        field,
        value: ref.id,
        message: 'Reference id must be lowercase alphanumeric with hyphens/underscores',
        severity: 'error'
      };
      issues.push(issue);
      this.results.schemaViolations.push(issue);
    }

    // Validate relationship type if present
    if (ref.relationshipType && !this.validRelationshipTypes.includes(ref.relationshipType)) {
      const issue = {
        type: 'INVALID_RELATIONSHIP_TYPE',
        assetId: asset.id,
        assetName: asset.name,
        field,
        value: ref.relationshipType,
        message: `Invalid relationship type: ${ref.relationshipType}`,
        validTypes: this.validRelationshipTypes,
        severity: 'warning'
      };
      issues.push(issue);
      this.results.warnings.push(issue);
    }

    // Check if link format (legacy)
    if (ref.link && !ref.id) {
      const issue = {
        type: 'LINK_WITHOUT_ID',
        assetId: asset.id,
        assetName: asset.name,
        field,
        value: ref,
        message: 'Reference has link but no id; extract id from link',
        suggestedId: this.extractIdFromLink(ref.link),
        severity: 'warning'
      };
      issues.push(issue);
      this.results.formatIssues.push(issue);
    }

    // Validate that referenced entity exists (if we have an id)
    // Skip validation for entities marked as _unverified (intentionally referencing non-existent entities)
    if (ref.id && !ref._unverified) {
      const targetExists = this.allAssets.has(ref.id);
      if (!targetExists) {
        const issue = {
          type: 'BROKEN_LINK',
          assetId: asset.id,
          assetName: asset.name,
          field,
          targetId: ref.id,
          targetName: ref.name,
          message: `Referenced entity '${ref.id}' not found`,
          severity: 'error'
        };
        issues.push(issue);
        this.results.brokenLinks.push(issue);
      }
    }

    return issues;
  }

  validateLegacyConnectionArray(asset, field) {
    const issues = [];
    const values = asset[field];

    if (!Array.isArray(values)) return issues;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      this.results.totalConnections++;

      if (typeof value === 'string') {
        // Try to resolve the reference
        const normalizedId = this.normalizeId(value);
        const exists = this.allAssets.has(normalizedId) ||
                      [...this.allAssets.values()].some(a =>
                        a.name?.toLowerCase() === value.toLowerCase() ||
                        a.displayName?.toLowerCase().includes(value.toLowerCase())
                      );

        if (!exists) {
          const issue = {
            type: 'UNRESOLVED_STRING_REFERENCE',
            assetId: asset.id,
            assetName: asset.name,
            field: `${field}[${i}]`,
            value,
            normalizedId,
            message: `String reference '${value}' cannot be resolved to an existing entity`,
            severity: 'warning'
          };
          issues.push(issue);
          this.results.warnings.push(issue);
        }
      }
    }

    return issues;
  }

  validateCorpusSearch(asset) {
    const issues = [];
    const corpus = asset.corpusSearch;

    if (typeof corpus !== 'object' || corpus === null) {
      issues.push({
        type: 'INVALID_CORPUS_SEARCH',
        assetId: asset.id,
        assetName: asset.name,
        message: 'corpusSearch must be an object',
        severity: 'error'
      });
      return issues;
    }

    const validFields = ['canonical', 'variants', 'epithets', 'domains', 'symbols', 'places', 'concepts'];

    for (const [field, value] of Object.entries(corpus)) {
      if (!validFields.includes(field)) {
        const issue = {
          type: 'UNKNOWN_CORPUS_FIELD',
          assetId: asset.id,
          assetName: asset.name,
          field: `corpusSearch.${field}`,
          message: `Unknown corpus search field: ${field}`,
          severity: 'info'
        };
        issues.push(issue);
      }

      if (value !== null && !Array.isArray(value)) {
        const issue = {
          type: 'INVALID_CORPUS_FIELD_TYPE',
          assetId: asset.id,
          assetName: asset.name,
          field: `corpusSearch.${field}`,
          message: `Corpus search field must be an array`,
          severity: 'warning'
        };
        issues.push(issue);
        this.results.invalidCorpusSearches.push(issue);
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string') {
            const issue = {
              type: 'INVALID_CORPUS_TERM',
              assetId: asset.id,
              assetName: asset.name,
              field: `corpusSearch.${field}[${i}]`,
              message: `Corpus search term must be a string`,
              severity: 'warning'
            };
            issues.push(issue);
            this.results.invalidCorpusSearches.push(issue);
          } else if (value[i].trim().length === 0) {
            const issue = {
              type: 'EMPTY_CORPUS_TERM',
              assetId: asset.id,
              assetName: asset.name,
              field: `corpusSearch.${field}[${i}]`,
              message: `Empty corpus search term`,
              severity: 'warning'
            };
            issues.push(issue);
            this.results.invalidCorpusSearches.push(issue);
          }
        }
      }
    }

    return issues;
  }

  validateSources(asset, field, sources) {
    const issues = [];

    if (!Array.isArray(sources)) {
      issues.push({
        type: 'INVALID_SOURCES_FORMAT',
        assetId: asset.id,
        assetName: asset.name,
        field,
        message: 'Sources must be an array',
        severity: 'error'
      });
      return issues;
    }

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (typeof source !== 'object' || source === null) {
        issues.push({
          type: 'INVALID_SOURCE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${field}[${i}]`,
          message: 'Source must be an object',
          severity: 'error'
        });
        continue;
      }

      // Check for title or text
      if (!source.title && !source.text && !source.source) {
        issues.push({
          type: 'SOURCE_MISSING_TITLE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${field}[${i}]`,
          message: 'Source missing title/text identifier',
          severity: 'warning'
        });
      }

      // Validate URL if present
      if (source.url) {
        if (!this.isValidUrl(source.url)) {
          const issue = {
            type: 'INVALID_SOURCE_URL',
            assetId: asset.id,
            assetName: asset.name,
            field: `${field}[${i}].url`,
            value: source.url,
            message: 'Invalid URL format',
            severity: 'error'
          };
          issues.push(issue);
          this.results.invalidUrls.push(issue);
        }
      }
    }

    return issues;
  }

  validateAssetUrls(asset) {
    const issues = [];

    // Check common URL fields
    const urlFields = ['url', 'imageUrl', 'iconUrl', 'link', 'externalUrl'];

    for (const field of urlFields) {
      if (asset[field] && typeof asset[field] === 'string') {
        if (!this.isValidUrl(asset[field]) && !this.isValidRelativePath(asset[field])) {
          const issue = {
            type: 'INVALID_URL',
            assetId: asset.id,
            assetName: asset.name,
            field,
            value: asset[field],
            message: 'Invalid URL or path format',
            severity: 'warning'
          };
          issues.push(issue);
          this.results.invalidUrls.push(issue);
        }
      }
    }

    // Check image arrays
    if (asset.images && Array.isArray(asset.images)) {
      for (let i = 0; i < asset.images.length; i++) {
        const img = asset.images[i];
        if (img.url && !this.isValidUrl(img.url)) {
          const issue = {
            type: 'INVALID_IMAGE_URL',
            assetId: asset.id,
            assetName: asset.name,
            field: `images[${i}].url`,
            value: img.url,
            message: 'Invalid image URL format',
            severity: 'warning'
          };
          issues.push(issue);
          this.results.invalidUrls.push(issue);
        }
      }
    }

    return issues;
  }

  // ==========================================
  // Content Validation Methods
  // ==========================================

  /**
   * Validate content completeness for an asset
   * Produces warnings (not errors) for missing content
   */
  validateContentCompleteness(asset) {
    const issues = [];

    // Check description exists and has minimum length
    const descriptionIssue = this.validateDescription(asset);
    if (descriptionIssue) {
      issues.push(descriptionIssue);
      this.results.contentValidation.missingContent.description.push({
        id: asset.id,
        name: asset.name,
        type: asset.type || asset._category
      });
    }

    // Check for keyMyths/keyNarratives presence
    const narrativeIssue = this.validateKeyNarratives(asset);
    if (narrativeIssue) {
      issues.push(narrativeIssue);
      this.results.contentValidation.missingContent.keyNarratives.push({
        id: asset.id,
        name: asset.name,
        type: asset.type || asset._category
      });
    }

    // Check for sources/references
    const sourceIssue = this.validateSourcesPresence(asset);
    if (sourceIssue) {
      issues.push(sourceIssue);
      this.results.contentValidation.missingContent.sources.push({
        id: asset.id,
        name: asset.name,
        type: asset.type || asset._category
      });
    }

    // Check for domains/attributes
    const domainIssue = this.validateDomainsPresence(asset);
    if (domainIssue) {
      issues.push(domainIssue);
      this.results.contentValidation.missingContent.domains.push({
        id: asset.id,
        name: asset.name,
        type: asset.type || asset._category
      });
    }

    return issues;
  }

  /**
   * Validate description exists and has minimum length
   */
  validateDescription(asset) {
    let description = null;
    let foundField = null;

    // Check all possible description fields
    for (const field of this.contentConfig.descriptionFields) {
      if (asset[field] && typeof asset[field] === 'string') {
        description = asset[field];
        foundField = field;
        break;
      }
    }

    if (!description) {
      return {
        type: 'MISSING_DESCRIPTION',
        assetId: asset.id,
        assetName: asset.name,
        message: 'Asset is missing a description field',
        severity: 'content-warning'
      };
    }

    const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
    if (cleanDescription.length < this.contentConfig.minDescriptionLength) {
      return {
        type: 'SHORT_DESCRIPTION',
        assetId: asset.id,
        assetName: asset.name,
        field: foundField,
        currentLength: cleanDescription.length,
        minLength: this.contentConfig.minDescriptionLength,
        message: `Description is too short (${cleanDescription.length}/${this.contentConfig.minDescriptionLength} chars)`,
        severity: 'content-warning'
      };
    }

    return null;
  }

  /**
   * Validate keyMyths/keyNarratives presence
   */
  validateKeyNarratives(asset) {
    for (const field of this.contentConfig.keyNarrativeFields) {
      if (asset[field]) {
        const value = asset[field];
        if (Array.isArray(value) && value.length > 0) {
          return null; // Has narratives
        }
        if (typeof value === 'string' && value.trim().length > 0) {
          return null; // Has narrative text
        }
      }
    }

    return {
      type: 'MISSING_KEY_NARRATIVES',
      assetId: asset.id,
      assetName: asset.name,
      message: 'Asset is missing keyMyths/keyNarratives content',
      severity: 'content-warning'
    };
  }

  /**
   * Validate sources/references presence
   */
  validateSourcesPresence(asset) {
    for (const field of this.contentConfig.sourceFields) {
      if (asset[field]) {
        const value = asset[field];
        if (Array.isArray(value) && value.length > 0) {
          return null; // Has sources
        }
      }
    }

    return {
      type: 'MISSING_SOURCES',
      assetId: asset.id,
      assetName: asset.name,
      message: 'Asset is missing sources/references',
      severity: 'content-warning'
    };
  }

  /**
   * Validate domains/attributes presence
   */
  validateDomainsPresence(asset) {
    for (const field of this.contentConfig.domainFields) {
      if (asset[field]) {
        const value = asset[field];
        if (Array.isArray(value) && value.length > 0) {
          return null; // Has domains/attributes
        }
        if (typeof value === 'string' && value.trim().length > 0) {
          return null; // Has domain text
        }
      }
    }

    return {
      type: 'MISSING_DOMAINS',
      assetId: asset.id,
      assetName: asset.name,
      message: 'Asset is missing domains/attributes',
      severity: 'content-warning'
    };
  }

  /**
   * Enhanced corpus search validation
   * Validates that canonical and variants are arrays of strings with no null/undefined values
   */
  validateCorpusSearchComprehensive(asset) {
    const issues = [];
    const corpus = asset.corpusSearch;

    if (!corpus) {
      // Track missing corpus search for content validation
      this.results.contentValidation.missingContent.corpusSearch.push({
        id: asset.id,
        name: asset.name,
        type: asset.type || asset._category
      });
      return issues; // Not having corpusSearch is not an error
    }

    // Validate canonical field
    if (corpus.canonical !== undefined) {
      const canonicalIssues = this.validateCorpusArray(asset, 'corpusSearch.canonical', corpus.canonical);
      issues.push(...canonicalIssues);
    }

    // Validate variants field
    if (corpus.variants !== undefined) {
      const variantsIssues = this.validateCorpusArray(asset, 'corpusSearch.variants', corpus.variants);
      issues.push(...variantsIssues);
    }

    return issues;
  }

  /**
   * Validate a corpus search array field
   * Ensures it's an array of strings with no null/undefined values
   */
  validateCorpusArray(asset, fieldPath, value) {
    const issues = [];

    if (!Array.isArray(value)) {
      issues.push({
        type: 'CORPUS_NOT_ARRAY',
        assetId: asset.id,
        assetName: asset.name,
        field: fieldPath,
        actualType: typeof value,
        message: `${fieldPath} must be an array of strings`,
        severity: 'warning'
      });
      this.results.invalidCorpusSearches.push({
        assetId: asset.id,
        field: fieldPath,
        issue: 'not_array'
      });
      return issues;
    }

    // Check each element
    for (let i = 0; i < value.length; i++) {
      const item = value[i];

      if (item === null) {
        issues.push({
          type: 'CORPUS_NULL_VALUE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${fieldPath}[${i}]`,
          message: `Null value found in ${fieldPath}`,
          severity: 'warning'
        });
        this.results.invalidCorpusSearches.push({
          assetId: asset.id,
          field: `${fieldPath}[${i}]`,
          issue: 'null_value'
        });
      } else if (item === undefined) {
        issues.push({
          type: 'CORPUS_UNDEFINED_VALUE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${fieldPath}[${i}]`,
          message: `Undefined value found in ${fieldPath}`,
          severity: 'warning'
        });
        this.results.invalidCorpusSearches.push({
          assetId: asset.id,
          field: `${fieldPath}[${i}]`,
          issue: 'undefined_value'
        });
      } else if (typeof item !== 'string') {
        issues.push({
          type: 'CORPUS_NON_STRING_VALUE',
          assetId: asset.id,
          assetName: asset.name,
          field: `${fieldPath}[${i}]`,
          actualType: typeof item,
          message: `Non-string value found in ${fieldPath}: expected string, got ${typeof item}`,
          severity: 'warning'
        });
        this.results.invalidCorpusSearches.push({
          assetId: asset.id,
          field: `${fieldPath}[${i}]`,
          issue: 'non_string',
          actualType: typeof item
        });
      }
    }

    return issues;
  }

  /**
   * Calculate wiki-readiness score for an asset (0-100)
   * Based on content completeness
   */
  calculateReadinessScore(asset) {
    let score = 0;
    const breakdown = {};

    // Description (25 points max)
    const descScore = this.scoreDescription(asset);
    score += descScore.points;
    breakdown.description = descScore;

    // Key Narratives (20 points max)
    const narrativeScore = this.scoreKeyNarratives(asset);
    score += narrativeScore.points;
    breakdown.keyNarratives = narrativeScore;

    // Sources/References (15 points max)
    const sourceScore = this.scoreSources(asset);
    score += sourceScore.points;
    breakdown.sources = sourceScore;

    // Domains/Attributes (15 points max)
    const domainScore = this.scoreDomains(asset);
    score += domainScore.points;
    breakdown.domains = domainScore;

    // Corpus Search (10 points max)
    const corpusScore = this.scoreCorpusSearch(asset);
    score += corpusScore.points;
    breakdown.corpusSearch = corpusScore;

    // Related Entities (10 points max)
    const relatedScore = this.scoreRelatedEntities(asset);
    score += relatedScore.points;
    breakdown.relatedEntities = relatedScore;

    // Basic metadata (5 points max)
    const metadataScore = this.scoreMetadata(asset);
    score += metadataScore.points;
    breakdown.metadata = metadataScore;

    return {
      score: Math.min(100, Math.round(score)),
      breakdown
    };
  }

  scoreDescription(asset) {
    const maxPoints = 25;
    let points = 0;
    let detail = '';

    for (const field of this.contentConfig.descriptionFields) {
      if (asset[field] && typeof asset[field] === 'string') {
        const cleanDesc = asset[field].replace(/<[^>]*>/g, '').trim();
        const length = cleanDesc.length;

        if (length >= 500) {
          points = maxPoints;
          detail = `Excellent description (${length} chars)`;
        } else if (length >= 300) {
          points = 20;
          detail = `Good description (${length} chars)`;
        } else if (length >= 100) {
          points = 15;
          detail = `Adequate description (${length} chars)`;
        } else if (length > 0) {
          points = 5;
          detail = `Short description (${length} chars)`;
        }
        break;
      }
    }

    if (points === 0) {
      detail = 'No description found';
    }

    return { points, maxPoints, detail };
  }

  scoreKeyNarratives(asset) {
    const maxPoints = 20;
    let points = 0;
    let detail = '';

    for (const field of this.contentConfig.keyNarrativeFields) {
      if (asset[field]) {
        const value = asset[field];
        if (Array.isArray(value)) {
          const count = value.length;
          if (count >= 5) {
            points = maxPoints;
            detail = `Excellent narratives (${count} items)`;
          } else if (count >= 3) {
            points = 15;
            detail = `Good narratives (${count} items)`;
          } else if (count >= 1) {
            points = 10;
            detail = `Some narratives (${count} items)`;
          }
          break;
        } else if (typeof value === 'string' && value.trim().length > 0) {
          points = 10;
          detail = 'Has narrative text';
          break;
        }
      }
    }

    if (points === 0) {
      detail = 'No key narratives found';
    }

    return { points, maxPoints, detail };
  }

  scoreSources(asset) {
    const maxPoints = 15;
    let points = 0;
    let detail = '';

    for (const field of this.contentConfig.sourceFields) {
      if (asset[field] && Array.isArray(asset[field])) {
        const count = asset[field].length;
        if (count >= 5) {
          points = maxPoints;
          detail = `Excellent sourcing (${count} sources)`;
        } else if (count >= 3) {
          points = 12;
          detail = `Good sourcing (${count} sources)`;
        } else if (count >= 1) {
          points = 8;
          detail = `Some sources (${count} sources)`;
        }
        break;
      }
    }

    if (points === 0) {
      detail = 'No sources found';
    }

    return { points, maxPoints, detail };
  }

  scoreDomains(asset) {
    const maxPoints = 15;
    let points = 0;
    let detail = '';

    for (const field of this.contentConfig.domainFields) {
      if (asset[field]) {
        const value = asset[field];
        if (Array.isArray(value)) {
          const count = value.length;
          if (count >= 5) {
            points = maxPoints;
            detail = `Excellent domains (${count} items)`;
          } else if (count >= 3) {
            points = 12;
            detail = `Good domains (${count} items)`;
          } else if (count >= 1) {
            points = 8;
            detail = `Some domains (${count} items)`;
          }
          break;
        } else if (typeof value === 'string' && value.trim().length > 0) {
          points = 8;
          detail = 'Has domain text';
          break;
        }
      }
    }

    if (points === 0) {
      detail = 'No domains/attributes found';
    }

    return { points, maxPoints, detail };
  }

  scoreCorpusSearch(asset) {
    const maxPoints = 10;
    let points = 0;
    let detail = '';

    if (asset.corpusSearch) {
      const corpus = asset.corpusSearch;
      const hasCanonical = Array.isArray(corpus.canonical) && corpus.canonical.length > 0;
      const hasVariants = Array.isArray(corpus.variants) && corpus.variants.length > 0;

      if (hasCanonical && hasVariants) {
        points = maxPoints;
        detail = 'Complete corpus search';
      } else if (hasCanonical || hasVariants) {
        points = 5;
        detail = 'Partial corpus search';
      }
    }

    if (points === 0) {
      detail = 'No corpus search configured';
    }

    return { points, maxPoints, detail };
  }

  scoreRelatedEntities(asset) {
    const maxPoints = 10;
    let points = 0;
    let detail = '';
    let totalRelations = 0;

    // Count relations from various fields
    if (asset.relatedEntities) {
      if (Array.isArray(asset.relatedEntities)) {
        totalRelations += asset.relatedEntities.length;
      } else if (typeof asset.relatedEntities === 'object') {
        for (const entities of Object.values(asset.relatedEntities)) {
          if (Array.isArray(entities)) {
            totalRelations += entities.length;
          }
        }
      }
    }

    if (asset.family) {
      for (const members of Object.values(asset.family)) {
        if (Array.isArray(members)) {
          totalRelations += members.length;
        }
      }
    }

    if (totalRelations >= 10) {
      points = maxPoints;
      detail = `Excellent connections (${totalRelations} relations)`;
    } else if (totalRelations >= 5) {
      points = 7;
      detail = `Good connections (${totalRelations} relations)`;
    } else if (totalRelations >= 1) {
      points = 4;
      detail = `Some connections (${totalRelations} relations)`;
    } else {
      detail = 'No related entities found';
    }

    return { points, maxPoints, detail };
  }

  scoreMetadata(asset) {
    const maxPoints = 5;
    let points = 0;
    let detail = '';
    const hasFields = [];

    if (asset.name) {
      points += 1;
      hasFields.push('name');
    }
    if (asset.type || asset._category) {
      points += 1;
      hasFields.push('type');
    }
    if (asset.mythology || asset.primaryMythology) {
      points += 1;
      hasFields.push('mythology');
    }
    if (asset.imageUrl || asset.image || (asset.images && asset.images.length > 0)) {
      points += 1;
      hasFields.push('image');
    }
    if (asset.aliases || asset.otherNames || asset.alternateNames) {
      points += 1;
      hasFields.push('aliases');
    }

    detail = hasFields.length > 0 ? `Has: ${hasFields.join(', ')}` : 'Missing basic metadata';

    return { points, maxPoints, detail };
  }

  // Helper methods
  generateIdFromRef(ref) {
    if (ref.link) {
      return this.extractIdFromLink(ref.link);
    }
    if (ref.name) {
      return this.normalizeId(ref.name);
    }
    return null;
  }

  extractIdFromLink(link) {
    if (!link) return null;

    // Extract from HTML path: ../greek/deities/zeus.html -> zeus
    const match = link.match(/\/([^\/]+)\.html$/);
    if (match) {
      return this.normalizeId(match[1]);
    }

    // Extract from path segments
    const parts = link.split('/').filter(p => p && !p.startsWith('.'));
    if (parts.length > 0) {
      const last = parts[parts.length - 1].replace('.html', '').replace('.json', '');
      return this.normalizeId(last);
    }

    return null;
  }

  normalizeId(str) {
    if (!str) return null;
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  isValidUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  isValidRelativePath(str) {
    // Valid relative paths start with ./ or ../ or are just filenames
    return /^\.\.?\//.test(str) || /^[a-zA-Z0-9_-]+\.(html|json|png|jpg|svg)$/.test(str);
  }

  async generateReport() {
    console.log('\nGenerating validation report...');

    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    // Count warnings by type
    const warningsByType = {};
    this.results.warnings.forEach(w => {
      warningsByType[w.type] = (warningsByType[w.type] || 0) + 1;
    });

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAssets: this.results.totalAssets,
        totalConnections: this.results.totalConnections,
        compliantAssets: this.results.assetsByCompliance.compliant,
        nonCompliantAssets: this.results.assetsByCompliance.nonCompliant,
        complianceRate: this.results.totalAssets > 0
          ? ((this.results.assetsByCompliance.compliant / this.results.totalAssets) * 100).toFixed(2) + '%'
          : '0%',
        totalErrors: this.results.errors.length + this.results.schemaViolations.length + this.results.brokenLinks.length,
        totalWarnings: this.results.warnings.length + this.results.formatIssues.length,
        brokenLinks: this.results.brokenLinks.length,
        invalidUrls: this.results.invalidUrls.length,
        invalidCorpusSearches: this.results.invalidCorpusSearches.length,
        legacyFieldsFound: Object.keys(this.results.legacyFieldUsage).length,
        // Content readiness metrics
        contentReadiness: {
          averageScore: this.results.contentValidation.averageReadinessScore,
          assetsNeedingEnrichment: this.results.contentValidation.assetsNeedingEnrichment.length,
          distribution: this.results.contentValidation.readinessDistribution,
          missingContentCounts: {
            description: this.results.contentValidation.missingContent.description.length,
            keyNarratives: this.results.contentValidation.missingContent.keyNarratives.length,
            sources: this.results.contentValidation.missingContent.sources.length,
            domains: this.results.contentValidation.missingContent.domains.length,
            corpusSearch: this.results.contentValidation.missingContent.corpusSearch.length
          }
        }
      },
      warningsByType,
      legacyFieldUsage: this.results.legacyFieldUsage,
      issuesByType: this.results.issuesByType,
      // Content validation details
      contentValidation: {
        readinessDistribution: this.results.contentValidation.readinessDistribution,
        assetsNeedingEnrichment: this.results.contentValidation.assetsNeedingEnrichment.slice(0, 100),
        missingContent: {
          description: this.results.contentValidation.missingContent.description.slice(0, 50),
          keyNarratives: this.results.contentValidation.missingContent.keyNarratives.slice(0, 50),
          sources: this.results.contentValidation.missingContent.sources.slice(0, 50),
          domains: this.results.contentValidation.missingContent.domains.slice(0, 50),
          corpusSearch: this.results.contentValidation.missingContent.corpusSearch.slice(0, 50)
        }
      },
      brokenLinks: this.results.brokenLinks.slice(0, 100),
      invalidUrls: this.results.invalidUrls.slice(0, 50),
      invalidCorpusSearches: this.results.invalidCorpusSearches.slice(0, 50),
      formatIssues: this.results.formatIssues.slice(0, 100),
      schemaViolations: this.results.schemaViolations.slice(0, 100),
      warnings: this.results.warnings.slice(0, 100),
      errors: this.results.errors.slice(0, 50)
    };

    await fs.writeFile(
      path.join(reportDir, 'connection-validation-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate summary markdown
    const markdown = this.generateMarkdownSummary(report);
    await fs.writeFile(
      path.join(reportDir, 'connection-validation-summary.md'),
      markdown
    );

    console.log(`Reports saved to ${reportDir}/`);
    return report;
  }

  generateMarkdownSummary(report) {
    let md = `# Connection Validation Report\n\n`;
    md += `**Generated:** ${report.timestamp}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Assets | ${report.summary.totalAssets} |\n`;
    md += `| Total Connections | ${report.summary.totalConnections} |\n`;
    md += `| Compliant Assets | ${report.summary.compliantAssets} |\n`;
    md += `| Non-Compliant Assets | ${report.summary.nonCompliantAssets} |\n`;
    md += `| Compliance Rate | ${report.summary.complianceRate} |\n`;
    md += `| Total Errors | ${report.summary.totalErrors} |\n`;
    md += `| Total Warnings | ${report.summary.totalWarnings} |\n`;
    md += `| Broken Links | ${report.summary.brokenLinks} |\n`;
    md += `| Invalid URLs | ${report.summary.invalidUrls} |\n`;
    md += `| Legacy Fields Found | ${report.summary.legacyFieldsFound} |\n`;
    md += `| **Content Readiness Avg** | **${report.summary.contentReadiness.averageScore}/100** |\n`;
    md += `| Assets Needing Enrichment | ${report.summary.contentReadiness.assetsNeedingEnrichment} |\n\n`;

    if (Object.keys(report.legacyFieldUsage).length > 0) {
      md += `## Legacy Field Usage\n\n`;
      md += `These fields should be migrated to the standardized format:\n\n`;
      md += `| Field | Usage Count | Migration Target |\n`;
      md += `|-------|-------------|------------------|\n`;
      for (const [field, data] of Object.entries(report.legacyFieldUsage)) {
        const target = this.legacyFields[field] || 'N/A';
        md += `| \`${field}\` | ${data.count} | \`${target}\` |\n`;
      }
      md += `\n`;
    }

    if (Object.keys(report.issuesByType).length > 0) {
      md += `## Issues by Entity Type\n\n`;
      md += `| Type | Issue Count | Assets Affected |\n`;
      md += `|------|-------------|------------------|\n`;
      for (const [type, data] of Object.entries(report.issuesByType)) {
        md += `| ${type} | ${data.count} | ${data.assets.length} |\n`;
      }
      md += `\n`;
    }

    // Content Readiness Section
    md += `## Content Readiness\n\n`;
    md += `Wiki-readiness score measures how complete an asset's content is for publication.\n\n`;
    md += `### Score Distribution\n\n`;
    md += `| Rating | Score Range | Count |\n`;
    md += `|--------|-------------|-------|\n`;
    md += `| Excellent | 90-100 | ${report.summary.contentReadiness.distribution.excellent} |\n`;
    md += `| Good | 70-89 | ${report.summary.contentReadiness.distribution.good} |\n`;
    md += `| Moderate | 50-69 | ${report.summary.contentReadiness.distribution.moderate} |\n`;
    md += `| Poor | 25-49 | ${report.summary.contentReadiness.distribution.poor} |\n`;
    md += `| Minimal | 0-24 | ${report.summary.contentReadiness.distribution.minimal} |\n\n`;

    md += `### Missing Content Summary\n\n`;
    md += `| Content Type | Assets Missing |\n`;
    md += `|--------------|----------------|\n`;
    md += `| Description (100+ chars) | ${report.summary.contentReadiness.missingContentCounts.description} |\n`;
    md += `| Key Narratives/Myths | ${report.summary.contentReadiness.missingContentCounts.keyNarratives} |\n`;
    md += `| Sources/References | ${report.summary.contentReadiness.missingContentCounts.sources} |\n`;
    md += `| Domains/Attributes | ${report.summary.contentReadiness.missingContentCounts.domains} |\n`;
    md += `| Corpus Search | ${report.summary.contentReadiness.missingContentCounts.corpusSearch} |\n\n`;

    if (report.contentValidation.assetsNeedingEnrichment.length > 0) {
      md += `### Top 20 Assets Needing Enrichment\n\n`;
      md += `| Asset | Type | Score | Priority Areas |\n`;
      md += `|-------|------|-------|----------------|\n`;
      const topAssets = report.contentValidation.assetsNeedingEnrichment.slice(0, 20);
      for (const asset of topAssets) {
        const priorityAreas = [];
        if (asset.breakdown.description.points === 0) priorityAreas.push('description');
        if (asset.breakdown.keyNarratives.points === 0) priorityAreas.push('narratives');
        if (asset.breakdown.sources.points === 0) priorityAreas.push('sources');
        if (asset.breakdown.domains.points === 0) priorityAreas.push('domains');
        md += `| ${asset.name || asset.id} | ${asset.type} | ${asset.score} | ${priorityAreas.join(', ') || 'various'} |\n`;
      }
      md += `\n`;
    }

    md += `## Recommendations\n\n`;
    md += `1. **Migrate Legacy Fields**: Update ${report.summary.legacyFieldsFound} legacy field names to standardized equivalents\n`;
    md += `2. **Fix Broken Links**: Resolve ${report.summary.brokenLinks} references to non-existent entities\n`;
    md += `3. **Standardize References**: Convert string references to entityReference objects with id and name\n`;
    md += `4. **Validate URLs**: Fix ${report.summary.invalidUrls} invalid URL formats\n`;
    md += `5. **Review Corpus Searches**: Check ${report.summary.invalidCorpusSearches} invalid corpus search configurations\n`;
    md += `6. **Enrich Content**: ${report.summary.contentReadiness.assetsNeedingEnrichment} assets have readiness scores below 70 and need content enrichment\n`;
    md += `7. **Add Missing Descriptions**: ${report.summary.contentReadiness.missingContentCounts.description} assets need descriptions (100+ characters)\n`;
    md += `8. **Add Key Narratives**: ${report.summary.contentReadiness.missingContentCounts.keyNarratives} assets need keyMyths/keyNarratives content\n`;

    return md;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('CONNECTION VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Assets: ${this.results.totalAssets}`);
    console.log(`Total Connections: ${this.results.totalConnections}`);
    console.log(`Compliant Assets: ${this.results.assetsByCompliance.compliant}`);
    console.log(`Non-Compliant Assets: ${this.results.assetsByCompliance.nonCompliant}`);
    console.log('');
    console.log('Issues Found:');
    console.log(`  - Errors: ${this.results.errors.length}`);
    console.log(`  - Warnings: ${this.results.warnings.length}`);
    console.log(`  - Format Issues: ${this.results.formatIssues.length}`);
    console.log(`  - Broken Links: ${this.results.brokenLinks.length}`);
    console.log(`  - Invalid URLs: ${this.results.invalidUrls.length}`);
    console.log(`  - Schema Violations: ${this.results.schemaViolations.length}`);
    console.log(`  - Invalid Corpus Searches: ${this.results.invalidCorpusSearches.length}`);
    console.log('');
    console.log(`Legacy Fields Used: ${Object.keys(this.results.legacyFieldUsage).length}`);
    for (const [field, data] of Object.entries(this.results.legacyFieldUsage)) {
      console.log(`  - ${field}: ${data.count} occurrences`);
    }
    console.log('');
    console.log('Content Readiness:');
    console.log(`  - Average Score: ${this.results.contentValidation.averageReadinessScore}/100`);
    console.log(`  - Assets Needing Enrichment (< 70): ${this.results.contentValidation.assetsNeedingEnrichment.length}`);
    console.log(`  - Distribution:`);
    console.log(`      Excellent (90-100): ${this.results.contentValidation.readinessDistribution.excellent}`);
    console.log(`      Good (70-89): ${this.results.contentValidation.readinessDistribution.good}`);
    console.log(`      Moderate (50-69): ${this.results.contentValidation.readinessDistribution.moderate}`);
    console.log(`      Poor (25-49): ${this.results.contentValidation.readinessDistribution.poor}`);
    console.log(`      Minimal (0-24): ${this.results.contentValidation.readinessDistribution.minimal}`);
    console.log('');
    console.log('Missing Content:');
    console.log(`  - Description: ${this.results.contentValidation.missingContent.description.length} assets`);
    console.log(`  - Key Narratives: ${this.results.contentValidation.missingContent.keyNarratives.length} assets`);
    console.log(`  - Sources: ${this.results.contentValidation.missingContent.sources.length} assets`);
    console.log(`  - Domains: ${this.results.contentValidation.missingContent.domains.length} assets`);
    console.log(`  - Corpus Search: ${this.results.contentValidation.missingContent.corpusSearch.length} assets`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Only set assetsPath if explicitly provided
  if (args[0] && !args[0].startsWith('--')) {
    options.assetsPath = args[0];
  }

  console.log('Connection Validator');
  console.log('====================');

  const validator = new ConnectionValidator(options);

  try {
    await validator.loadAllAssets();
    await validator.validateAllConnections();
    await validator.generateReport();
    validator.printSummary();

    console.log('\nValidation complete! Check scripts/reports/ for detailed results.');

    // Exit with error code if there are critical issues
    if (validator.results.brokenLinks.length > 0 || validator.results.schemaViolations.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ConnectionValidator };
