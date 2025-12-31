#!/usr/bin/env node
/**
 * Entity Schema Validator
 *
 * Comprehensive validation of all entity JSON files against the expected schema.
 *
 * Usage:
 *   node scripts/validate-schema.js [options]
 *
 * Options:
 *   --verbose       Show detailed output for each entity
 *   --type=TYPE     Only validate entities of a specific type (deity, hero, creature, etc.)
 *   --mythology=M   Only validate entities from a specific mythology
 *   --fix           Attempt to auto-fix minor issues (not implemented yet)
 *   --output=FILE   Write report to a file instead of console
 *   --json          Output results as JSON
 */

const fs = require('fs').promises;
const path = require('path');

// Valid enumeration values from the schema
const VALID_ENTITY_TYPES = ['item', 'place', 'deity', 'concept', 'archetype', 'magic', 'creature', 'hero'];

const VALID_MYTHOLOGIES = [
    'greek', 'roman', 'norse', 'egyptian', 'hindu', 'buddhist', 'celtic', 'japanese',
    'chinese', 'mesopotamian', 'aztec', 'mayan', 'inca', 'persian', 'slavic',
    'finnish', 'african', 'polynesian', 'native-american', 'abrahamic', 'christian',
    'jewish', 'islamic', 'zoroastrian', 'sumerian', 'babylonian', 'assyrian',
    'british', 'arthurian', 'medieval', 'universal', 'comparative', 'tibetan'
];

const VALID_ELEMENTS = ['fire', 'water', 'earth', 'air', 'aether', 'wood', 'metal'];

const VALID_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

const VALID_SEFIROT = ['keter', 'chokmah', 'binah', 'chesed', 'gevurah', 'tiferet', 'netzach', 'hod', 'yesod', 'malkhut', 'daat'];

const VALID_CHAKRAS = ['muladhara', 'svadhisthana', 'manipura', 'anahata', 'vishuddha', 'ajna', 'sahasrara'];

const VALID_SCRIPTS = ['latin', 'greek', 'hebrew', 'arabic', 'devanagari', 'chinese', 'japanese', 'runic', 'hieroglyphic', 'cuneiform'];

const VALID_LOCATION_TYPES = ['temple', 'mountain', 'river', 'city', 'battlefield', 'sacred_grove', 'cave', 'island', 'region', 'birthplace'];

const VALID_ACCURACY = ['exact', 'approximate', 'general_area', 'speculative', 'precise'];

const VALID_ATTESTATION_TYPES = ['literary', 'archaeological', 'epigraphic', 'iconographic', 'oral_tradition'];

const VALID_CONFIDENCE = ['certain', 'probable', 'possible', 'speculative'];

const VALID_SOURCE_TYPES = ['primary', 'secondary', 'archaeological'];

const VALID_QUERY_TYPES = ['github', 'firebase', 'combined'];

const VALID_RENDER_MODES = ['panel', 'inline', 'inline-grid', 'full-page', 'modal', 'sidebar', 'embedded'];

class SchemaValidator {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(__dirname, '..');
        this.entitiesDir = path.join(this.baseDir, 'data', 'entities');
        this.verbose = options.verbose || false;
        this.typeFilter = options.type || null;
        this.mythologyFilter = options.mythology || null;
        this.outputJson = options.json || false;

        // Statistics
        this.stats = {
            totalFiles: 0,
            totalValidated: 0,
            passing: 0,
            failing: 0,
            criticalErrors: 0,
            errors: 0,
            warnings: 0,
            info: 0,
            byType: {},
            byMythology: {},
            commonErrors: {}
        };

        // All validation results
        this.results = [];

        // Entity ID registry for cross-reference validation
        this.entityRegistry = new Map();
    }

    /**
     * Run validation on all entity files
     */
    async validate() {
        console.log('Entity Schema Validator v1.0.0');
        console.log('==============================\n');

        // First pass: collect all entity IDs
        await this.collectEntityIds();

        // Second pass: validate each entity
        const typeDirectories = await fs.readdir(this.entitiesDir);

        for (const typeDir of typeDirectories) {
            const typePath = path.join(this.entitiesDir, typeDir);
            const stat = await fs.stat(typePath);

            if (!stat.isDirectory()) continue;
            if (this.typeFilter && typeDir !== this.typeFilter) continue;

            const files = await fs.readdir(typePath);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                const filePath = path.join(typePath, file);
                await this.validateFile(filePath, typeDir);
            }
        }

        return this.generateReport();
    }

    /**
     * Collect all entity IDs for cross-reference validation
     */
    async collectEntityIds() {
        const typeDirectories = await fs.readdir(this.entitiesDir);

        for (const typeDir of typeDirectories) {
            const typePath = path.join(this.entitiesDir, typeDir);
            const stat = await fs.stat(typePath);

            if (!stat.isDirectory()) continue;

            const files = await fs.readdir(typePath);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                const filePath = path.join(typePath, file);
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const entity = JSON.parse(content);
                    if (entity.id) {
                        this.entityRegistry.set(entity.id, {
                            type: entity.type || typeDir,
                            name: entity.name,
                            file: filePath
                        });
                    }
                } catch (e) {
                    // Will be caught in validation pass
                }
            }
        }

        console.log(`Collected ${this.entityRegistry.size} entity IDs for cross-reference validation\n`);
    }

    /**
     * Validate a single file
     */
    async validateFile(filePath, expectedType) {
        this.stats.totalFiles++;

        const result = {
            file: filePath,
            entityId: null,
            entityName: null,
            entityType: null,
            valid: true,
            errors: [],
            warnings: [],
            info: []
        };

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            let entity;

            // Parse JSON
            try {
                entity = JSON.parse(content);
            } catch (parseError) {
                result.valid = false;
                result.errors.push({
                    severity: 'critical',
                    field: 'json',
                    message: `Invalid JSON: ${parseError.message}`
                });
                this.results.push(result);
                this.stats.totalValidated++;
                this.stats.failing++;
                this.stats.criticalErrors++;
                this.trackError('Invalid JSON');
                return result;
            }

            result.entityId = entity.id;
            result.entityName = entity.name;
            result.entityType = entity.type;

            // Apply mythology filter
            if (this.mythologyFilter) {
                const mythologies = entity.mythologies || [entity.primaryMythology];
                if (!mythologies.includes(this.mythologyFilter)) {
                    return null; // Skip this entity
                }
            }

            // Run all validations
            this.validateRequiredFields(entity, result);
            this.validateFieldTypes(entity, result);
            this.validateIdFormat(entity, result, filePath);
            this.validateEntityType(entity, result, expectedType);
            this.validateMythologies(entity, result);
            this.validateColors(entity, result);
            this.validateLinguistic(entity, result);
            this.validateGeographical(entity, result);
            this.validateTemporal(entity, result);
            this.validateCultural(entity, result);
            this.validateMetaphysical(entity, result);
            this.validateRelatedEntities(entity, result);
            this.validateSources(entity, result);
            this.validateCorpusQueries(entity, result);
            this.validateMetadata(entity, result);
            this.calculateCompleteness(entity, result);

        } catch (readError) {
            result.valid = false;
            result.errors.push({
                severity: 'critical',
                field: 'file',
                message: `Cannot read file: ${readError.message}`
            });
        }

        // Update stats
        this.stats.totalValidated++;
        result.valid = result.errors.filter(e => e.severity === 'critical').length === 0;

        if (result.valid) {
            this.stats.passing++;
        } else {
            this.stats.failing++;
        }

        result.errors.forEach(e => {
            if (e.severity === 'critical') this.stats.criticalErrors++;
            this.stats.errors++;
            this.trackError(e.message);
        });

        result.warnings.forEach(() => this.stats.warnings++);
        result.info.forEach(() => this.stats.info++);

        // Track by type
        if (result.entityType) {
            this.stats.byType[result.entityType] = this.stats.byType[result.entityType] || { total: 0, passing: 0, failing: 0 };
            this.stats.byType[result.entityType].total++;
            if (result.valid) {
                this.stats.byType[result.entityType].passing++;
            } else {
                this.stats.byType[result.entityType].failing++;
            }
        }

        this.results.push(result);

        if (this.verbose && !result.valid) {
            this.printEntityResult(result);
        }

        return result;
    }

    /**
     * Validate required fields
     */
    validateRequiredFields(entity, result) {
        const required = ['id', 'type', 'name', 'mythologies'];

        required.forEach(field => {
            if (entity[field] === undefined || entity[field] === null || entity[field] === '') {
                result.errors.push({
                    severity: 'critical',
                    field,
                    message: `Missing required field: ${field}`
                });
            }
        });

        // mythologies must be non-empty array
        if (entity.mythologies !== undefined) {
            if (!Array.isArray(entity.mythologies)) {
                result.errors.push({
                    severity: 'critical',
                    field: 'mythologies',
                    message: 'mythologies must be an array'
                });
            } else if (entity.mythologies.length === 0) {
                result.errors.push({
                    severity: 'critical',
                    field: 'mythologies',
                    message: 'mythologies array must not be empty'
                });
            }
        }
    }

    /**
     * Validate field types
     */
    validateFieldTypes(entity, result) {
        const typeChecks = {
            id: 'string',
            type: 'string',
            name: 'string',
            icon: 'string',
            slug: 'string',
            mythologies: 'array',
            primaryMythology: 'string',
            shortDescription: 'string',
            longDescription: 'string',
            fullDescription: 'string',
            tags: 'array',
            colors: 'object',
            linguistic: 'object',
            geographical: 'object',
            temporal: 'object',
            cultural: 'object',
            metaphysicalProperties: 'object',
            relatedEntities: 'object',
            sources: 'array',
            corpusQueries: 'array',
            archetypes: 'array',
            metadata: 'object'
        };

        Object.entries(typeChecks).forEach(([field, expectedType]) => {
            if (entity[field] !== undefined && entity[field] !== null) {
                const actualType = Array.isArray(entity[field]) ? 'array' : typeof entity[field];
                if (actualType !== expectedType) {
                    result.errors.push({
                        severity: 'critical',
                        field,
                        message: `Invalid type for ${field}: expected ${expectedType}, got ${actualType}`
                    });
                }
            }
        });
    }

    /**
     * Validate ID format (kebab-case)
     */
    validateIdFormat(entity, result, filePath) {
        if (entity.id) {
            if (!/^[a-z0-9-]+$/.test(entity.id)) {
                result.errors.push({
                    severity: 'critical',
                    field: 'id',
                    message: `Invalid ID format: must be kebab-case (lowercase letters, numbers, hyphens only), got: ${entity.id}`
                });
            }

            // Check if ID matches filename
            const expectedId = path.basename(filePath, '.json');
            if (entity.id !== expectedId) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'id',
                    message: `ID "${entity.id}" does not match filename "${expectedId}"`
                });
            }
        }
    }

    /**
     * Validate entity type
     */
    validateEntityType(entity, result, expectedType) {
        if (entity.type) {
            if (!VALID_ENTITY_TYPES.includes(entity.type)) {
                result.errors.push({
                    severity: 'critical',
                    field: 'type',
                    message: `Invalid entity type: "${entity.type}". Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`
                });
            }

            // Check if type matches directory
            if (entity.type !== expectedType) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'type',
                    message: `Entity type "${entity.type}" does not match directory "${expectedType}"`
                });
            }
        }
    }

    /**
     * Validate mythologies
     */
    validateMythologies(entity, result) {
        if (Array.isArray(entity.mythologies)) {
            entity.mythologies.forEach((myth, idx) => {
                if (typeof myth !== 'string') {
                    result.errors.push({
                        severity: 'critical',
                        field: `mythologies[${idx}]`,
                        message: `Mythology value must be a string, got ${typeof myth}`
                    });
                } else if (!VALID_MYTHOLOGIES.includes(myth.toLowerCase())) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `mythologies[${idx}]`,
                        message: `Unknown mythology: "${myth}". Consider adding to valid list if correct.`
                    });
                }
            });
        }

        if (entity.primaryMythology) {
            if (!VALID_MYTHOLOGIES.includes(entity.primaryMythology.toLowerCase())) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'primaryMythology',
                    message: `Unknown mythology: "${entity.primaryMythology}"`
                });
            }

            // Primary mythology should be in mythologies array
            if (Array.isArray(entity.mythologies) && !entity.mythologies.includes(entity.primaryMythology)) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'primaryMythology',
                    message: `Primary mythology "${entity.primaryMythology}" not found in mythologies array`
                });
            }
        }
    }

    /**
     * Validate colors
     */
    validateColors(entity, result) {
        if (entity.colors && typeof entity.colors === 'object') {
            ['primary', 'secondary', 'accent'].forEach(colorType => {
                const color = entity.colors[colorType];
                if (color && typeof color === 'string') {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                        result.warnings.push({
                            severity: 'warning',
                            field: `colors.${colorType}`,
                            message: `Invalid hex color format: "${color}". Expected #RRGGBB`
                        });
                    }
                }
            });
        }
    }

    /**
     * Validate linguistic data
     */
    validateLinguistic(entity, result) {
        const ling = entity.linguistic;
        if (!ling || typeof ling !== 'object') return;

        // Original script validation
        if (ling.originalScript && !VALID_SCRIPTS.includes(ling.originalScript)) {
            result.warnings.push({
                severity: 'warning',
                field: 'linguistic.originalScript',
                message: `Unknown script: "${ling.originalScript}". Valid values: ${VALID_SCRIPTS.join(', ')}`
            });
        }

        // If originalName provided, should have transliteration
        if (ling.originalName && !ling.transliteration) {
            result.info.push({
                severity: 'info',
                field: 'linguistic.transliteration',
                message: 'originalName provided but transliteration missing'
            });
        }

        // Etymology validation
        if (ling.etymology && typeof ling.etymology === 'object') {
            if (ling.etymology.rootLanguage && typeof ling.etymology.rootLanguage !== 'string') {
                result.warnings.push({
                    severity: 'warning',
                    field: 'linguistic.etymology.rootLanguage',
                    message: 'rootLanguage must be a string'
                });
            }
        }

        // Alternative names validation
        if (ling.alternativeNames && Array.isArray(ling.alternativeNames)) {
            ling.alternativeNames.forEach((alt, idx) => {
                if (typeof alt === 'object' && alt !== null) {
                    if (!alt.name) {
                        result.warnings.push({
                            severity: 'warning',
                            field: `linguistic.alternativeNames[${idx}]`,
                            message: 'Alternative name object missing "name" property'
                        });
                    }
                }
            });
        }
    }

    /**
     * Validate geographical data
     */
    validateGeographical(entity, result) {
        const geo = entity.geographical;
        if (!geo || typeof geo !== 'object') return;

        // Validate primary location
        if (geo.primaryLocation) {
            this.validateLocation(geo.primaryLocation, 'geographical.primaryLocation', result);
        }

        // Validate associated locations
        if (geo.associatedLocations && Array.isArray(geo.associatedLocations)) {
            geo.associatedLocations.forEach((loc, idx) => {
                this.validateLocation(loc, `geographical.associatedLocations[${idx}]`, result);
            });
        }

        // Validate modern countries
        if (geo.modernCountries && !Array.isArray(geo.modernCountries)) {
            result.warnings.push({
                severity: 'warning',
                field: 'geographical.modernCountries',
                message: 'modernCountries must be an array'
            });
        }
    }

    /**
     * Validate a location object
     */
    validateLocation(loc, fieldPath, result) {
        if (!loc || typeof loc !== 'object') return;

        // Validate coordinates
        if (loc.coordinates) {
            const coords = loc.coordinates;

            if (coords.latitude !== undefined) {
                if (typeof coords.latitude !== 'number') {
                    result.errors.push({
                        severity: 'critical',
                        field: `${fieldPath}.coordinates.latitude`,
                        message: `Latitude must be a number, got ${typeof coords.latitude}`
                    });
                } else if (coords.latitude < -90 || coords.latitude > 90) {
                    result.errors.push({
                        severity: 'critical',
                        field: `${fieldPath}.coordinates.latitude`,
                        message: `Invalid latitude: ${coords.latitude} (must be between -90 and 90)`
                    });
                }
            }

            if (coords.longitude !== undefined) {
                if (typeof coords.longitude !== 'number') {
                    result.errors.push({
                        severity: 'critical',
                        field: `${fieldPath}.coordinates.longitude`,
                        message: `Longitude must be a number, got ${typeof coords.longitude}`
                    });
                } else if (coords.longitude < -180 || coords.longitude > 180) {
                    result.errors.push({
                        severity: 'critical',
                        field: `${fieldPath}.coordinates.longitude`,
                        message: `Invalid longitude: ${coords.longitude} (must be between -180 and 180)`
                    });
                }
            }

            // Validate accuracy
            if (coords.accuracy && !VALID_ACCURACY.includes(coords.accuracy)) {
                result.warnings.push({
                    severity: 'warning',
                    field: `${fieldPath}.coordinates.accuracy`,
                    message: `Unknown accuracy value: "${coords.accuracy}". Valid values: ${VALID_ACCURACY.join(', ')}`
                });
            }
        }

        // Validate location type
        if (loc.type && !VALID_LOCATION_TYPES.includes(loc.type)) {
            result.warnings.push({
                severity: 'warning',
                field: `${fieldPath}.type`,
                message: `Unknown location type: "${loc.type}". Valid values: ${VALID_LOCATION_TYPES.join(', ')}`
            });
        }
    }

    /**
     * Validate temporal data
     */
    validateTemporal(entity, result) {
        const temp = entity.temporal;
        if (!temp || typeof temp !== 'object') return;

        // Validate date consistency
        if (temp.historicalDate) {
            const hist = temp.historicalDate;
            if (hist.start && hist.end) {
                const startYear = hist.start.year;
                const endYear = hist.end.year;
                if (startYear !== undefined && endYear !== undefined && startYear > endYear) {
                    result.warnings.push({
                        severity: 'warning',
                        field: 'temporal.historicalDate',
                        message: `Start date (${startYear}) is after end date (${endYear})`
                    });
                }
            }
        }

        // Validate first attestation
        if (temp.firstAttestation) {
            const att = temp.firstAttestation;

            if (att.type && !VALID_ATTESTATION_TYPES.includes(att.type)) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'temporal.firstAttestation.type',
                    message: `Unknown attestation type: "${att.type}". Valid values: ${VALID_ATTESTATION_TYPES.join(', ')}`
                });
            }

            if (att.confidence && !VALID_CONFIDENCE.includes(att.confidence)) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'temporal.firstAttestation.confidence',
                    message: `Unknown confidence level: "${att.confidence}". Valid values: ${VALID_CONFIDENCE.join(', ')}`
                });
            }

            // Should have source
            if (!att.source) {
                result.info.push({
                    severity: 'info',
                    field: 'temporal.firstAttestation.source',
                    message: 'First attestation missing source reference'
                });
            }
        }
    }

    /**
     * Validate cultural data
     */
    validateCultural(entity, result) {
        const cultural = entity.cultural;
        if (!cultural || typeof cultural !== 'object') return;

        // Validate array fields
        ['worshipPractices', 'festivals', 'demographicAppeal', 'taboos'].forEach(field => {
            if (cultural[field] !== undefined && !Array.isArray(cultural[field])) {
                result.warnings.push({
                    severity: 'warning',
                    field: `cultural.${field}`,
                    message: `${field} must be an array`
                });
            }
        });

        // Validate festivals structure
        if (Array.isArray(cultural.festivals)) {
            cultural.festivals.forEach((fest, idx) => {
                if (typeof fest === 'object' && fest !== null && !fest.name) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `cultural.festivals[${idx}]`,
                        message: 'Festival object missing "name" property'
                    });
                }
            });
        }
    }

    /**
     * Validate metaphysical properties
     */
    validateMetaphysical(entity, result) {
        const meta = entity.metaphysicalProperties;
        if (!meta || typeof meta !== 'object') return;

        // Validate primary element
        if (meta.primaryElement && !VALID_ELEMENTS.includes(meta.primaryElement)) {
            result.warnings.push({
                severity: 'warning',
                field: 'metaphysicalProperties.primaryElement',
                message: `Unknown element: "${meta.primaryElement}". Valid values: ${VALID_ELEMENTS.join(', ')}`
            });
        }

        // Validate planets
        if (meta.planets && Array.isArray(meta.planets)) {
            meta.planets.forEach((planet, idx) => {
                if (!VALID_PLANETS.includes(planet)) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `metaphysicalProperties.planets[${idx}]`,
                        message: `Unknown planet: "${planet}". Valid values: ${VALID_PLANETS.join(', ')}`
                    });
                }
            });
        }

        // Validate sefirot
        if (meta.sefirot && Array.isArray(meta.sefirot)) {
            meta.sefirot.forEach((sef, idx) => {
                if (!VALID_SEFIROT.includes(sef)) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `metaphysicalProperties.sefirot[${idx}]`,
                        message: `Unknown sefirah: "${sef}". Valid values: ${VALID_SEFIROT.join(', ')}`
                    });
                }
            });
        }

        // Validate chakras
        if (meta.chakras && Array.isArray(meta.chakras)) {
            meta.chakras.forEach((chakra, idx) => {
                if (!VALID_CHAKRAS.includes(chakra)) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `metaphysicalProperties.chakras[${idx}]`,
                        message: `Unknown chakra: "${chakra}". Valid values: ${VALID_CHAKRAS.join(', ')}`
                    });
                }
            });
        }
    }

    /**
     * Validate related entities
     */
    validateRelatedEntities(entity, result) {
        const related = entity.relatedEntities;
        if (!related || typeof related !== 'object') return;

        const validCategories = ['deities', 'items', 'places', 'concepts', 'creatures', 'heroes', 'magic', 'archetypes'];

        // Check for unknown categories
        Object.keys(related).forEach(category => {
            if (!validCategories.includes(category)) {
                result.warnings.push({
                    severity: 'warning',
                    field: `relatedEntities.${category}`,
                    message: `Unknown entity category: "${category}". Valid values: ${validCategories.join(', ')}`
                });
            }
        });

        // Validate each category
        validCategories.forEach(category => {
            if (related[category] && Array.isArray(related[category])) {
                related[category].forEach((ref, idx) => {
                    this.validateEntityReference(ref, `relatedEntities.${category}[${idx}]`, result);
                });
            } else if (related[category] !== undefined && !Array.isArray(related[category])) {
                result.warnings.push({
                    severity: 'warning',
                    field: `relatedEntities.${category}`,
                    message: `${category} must be an array`
                });
            }
        });
    }

    /**
     * Validate an entity reference
     */
    validateEntityReference(ref, fieldPath, result) {
        if (!ref || typeof ref !== 'object') {
            result.warnings.push({
                severity: 'warning',
                field: fieldPath,
                message: 'Entity reference must be an object'
            });
            return;
        }

        // Must have id
        if (!ref.id) {
            result.warnings.push({
                severity: 'warning',
                field: fieldPath,
                message: 'Entity reference missing required "id" field'
            });
        } else {
            // Check if reference exists in registry
            if (!this.entityRegistry.has(ref.id)) {
                result.info.push({
                    severity: 'info',
                    field: fieldPath,
                    message: `Referenced entity "${ref.id}" not found in local entity files`
                });
            }
        }

        // Should have name
        if (!ref.name) {
            result.info.push({
                severity: 'info',
                field: fieldPath,
                message: 'Entity reference missing "name" field'
            });
        }
    }

    /**
     * Validate sources
     */
    validateSources(entity, result) {
        if (!entity.sources || !Array.isArray(entity.sources)) return;

        entity.sources.forEach((source, idx) => {
            if (!source || typeof source !== 'object') {
                result.warnings.push({
                    severity: 'warning',
                    field: `sources[${idx}]`,
                    message: 'Source must be an object'
                });
                return;
            }

            // Should have title or text
            if (!source.title && !source.text) {
                result.warnings.push({
                    severity: 'warning',
                    field: `sources[${idx}]`,
                    message: 'Source missing both "title" and "text" fields'
                });
            }

            // Validate type if present
            if (source.type && !VALID_SOURCE_TYPES.includes(source.type)) {
                result.warnings.push({
                    severity: 'warning',
                    field: `sources[${idx}].type`,
                    message: `Unknown source type: "${source.type}". Valid values: ${VALID_SOURCE_TYPES.join(', ')}`
                });
            }

            // Validate URL format if present
            if (source.url && typeof source.url === 'string') {
                try {
                    new URL(source.url);
                } catch {
                    // Check if it's a relative URL
                    if (!source.url.startsWith('/')) {
                        result.warnings.push({
                            severity: 'warning',
                            field: `sources[${idx}].url`,
                            message: `Invalid URL format: "${source.url}"`
                        });
                    }
                }
            }
        });
    }

    /**
     * Validate corpus queries
     */
    validateCorpusQueries(entity, result) {
        if (!entity.corpusQueries || !Array.isArray(entity.corpusQueries)) return;

        entity.corpusQueries.forEach((query, idx) => {
            const fieldBase = `corpusQueries[${idx}]`;

            if (!query || typeof query !== 'object') {
                result.warnings.push({
                    severity: 'warning',
                    field: fieldBase,
                    message: 'Corpus query must be an object'
                });
                return;
            }

            // Required fields
            if (!query.id) {
                result.warnings.push({
                    severity: 'warning',
                    field: `${fieldBase}.id`,
                    message: 'Corpus query missing required "id" field'
                });
            } else if (!/^[a-z0-9-]+$/.test(query.id)) {
                result.warnings.push({
                    severity: 'warning',
                    field: `${fieldBase}.id`,
                    message: `Invalid query ID format: "${query.id}". Must be kebab-case`
                });
            }

            if (!query.label) {
                result.warnings.push({
                    severity: 'warning',
                    field: `${fieldBase}.label`,
                    message: 'Corpus query missing "label" field'
                });
            }

            // Validate queryType
            if (query.queryType && !VALID_QUERY_TYPES.includes(query.queryType)) {
                result.warnings.push({
                    severity: 'warning',
                    field: `${fieldBase}.queryType`,
                    message: `Unknown query type: "${query.queryType}". Valid values: ${VALID_QUERY_TYPES.join(', ')}`
                });
            }

            // Validate renderMode
            if (query.renderMode && !VALID_RENDER_MODES.includes(query.renderMode)) {
                result.warnings.push({
                    severity: 'warning',
                    field: `${fieldBase}.renderMode`,
                    message: `Unknown render mode: "${query.renderMode}". Valid values: ${VALID_RENDER_MODES.join(', ')}`
                });
            }

            // Validate query object
            if (query.query) {
                if (typeof query.query !== 'object') {
                    result.warnings.push({
                        severity: 'warning',
                        field: `${fieldBase}.query`,
                        message: 'Query must be an object'
                    });
                } else if (!query.query.term) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `${fieldBase}.query.term`,
                        message: 'Query missing required "term" field'
                    });
                }
            }
        });
    }

    /**
     * Validate metadata
     */
    validateMetadata(entity, result) {
        const meta = entity.metadata;
        if (!meta || typeof meta !== 'object') return;

        // Validate dates
        ['created', 'lastModified'].forEach(field => {
            if (meta[field]) {
                const date = new Date(meta[field]);
                if (isNaN(date.getTime())) {
                    result.warnings.push({
                        severity: 'warning',
                        field: `metadata.${field}`,
                        message: `Invalid date format: "${meta[field]}"`
                    });
                }
            }
        });

        // Validate version
        if (meta.version && typeof meta.version !== 'string') {
            result.warnings.push({
                severity: 'warning',
                field: 'metadata.version',
                message: `Version must be a string, got ${typeof meta.version}`
            });
        }

        // Validate completeness
        if (meta.completeness !== undefined) {
            if (typeof meta.completeness !== 'number') {
                result.warnings.push({
                    severity: 'warning',
                    field: 'metadata.completeness',
                    message: `Completeness must be a number, got ${typeof meta.completeness}`
                });
            } else if (meta.completeness < 0 || meta.completeness > 100) {
                result.warnings.push({
                    severity: 'warning',
                    field: 'metadata.completeness',
                    message: `Completeness must be between 0 and 100, got ${meta.completeness}`
                });
            }
        }
    }

    /**
     * Calculate completeness score
     */
    calculateCompleteness(entity, result) {
        const optionalFields = [
            'shortDescription',
            'fullDescription',
            'linguistic',
            'geographical',
            'temporal',
            'cultural',
            'metaphysicalProperties',
            'relatedEntities',
            'sources',
            'colors',
            'archetypes',
            'corpusQueries',
            'tags'
        ];

        let present = 0;
        let total = optionalFields.length;

        optionalFields.forEach(field => {
            if (entity[field] !== undefined && entity[field] !== null) {
                // Check if arrays are non-empty
                if (Array.isArray(entity[field])) {
                    if (entity[field].length > 0) present++;
                } else if (typeof entity[field] === 'object') {
                    if (Object.keys(entity[field]).length > 0) present++;
                } else if (entity[field] !== '') {
                    present++;
                }
            }
        });

        const percentage = Math.round((present / total) * 100);

        result.info.push({
            severity: 'info',
            field: 'completeness',
            message: `Schema completeness: ${percentage}% (${present}/${total} optional fields populated)`,
            percentage
        });
    }

    /**
     * Track common errors for summary
     */
    trackError(message) {
        // Normalize error message
        const key = message.replace(/: .+$/, '').replace(/".+"/, '').trim();
        this.stats.commonErrors[key] = (this.stats.commonErrors[key] || 0) + 1;
    }

    /**
     * Print result for a single entity
     */
    printEntityResult(result) {
        console.log(`\n--- ${result.entityName || result.file} ---`);
        console.log(`File: ${result.file}`);
        console.log(`Status: ${result.valid ? 'PASS' : 'FAIL'}`);

        if (result.errors.length > 0) {
            console.log('\nErrors:');
            result.errors.forEach(e => {
                console.log(`  [${e.severity.toUpperCase()}] ${e.field}: ${e.message}`);
            });
        }

        if (result.warnings.length > 0) {
            console.log('\nWarnings:');
            result.warnings.forEach(w => {
                console.log(`  [WARNING] ${w.field}: ${w.message}`);
            });
        }
    }

    /**
     * Generate final report
     */
    generateReport() {
        const report = {
            summary: {
                totalFilesProcessed: this.stats.totalFiles,
                totalEntitiesValidated: this.stats.totalValidated,
                entitiesPassingValidation: this.stats.passing,
                entitiesWithErrors: this.stats.failing,
                totalCriticalErrors: this.stats.criticalErrors,
                totalErrors: this.stats.errors,
                totalWarnings: this.stats.warnings,
                totalInfo: this.stats.info,
                passRate: this.stats.totalValidated > 0
                    ? `${((this.stats.passing / this.stats.totalValidated) * 100).toFixed(1)}%`
                    : 'N/A'
            },
            byType: this.stats.byType,
            commonErrors: Object.entries(this.stats.commonErrors)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([error, count]) => ({ error, count })),
            failedEntities: this.results
                .filter(r => !r.valid)
                .map(r => ({
                    id: r.entityId,
                    name: r.entityName,
                    file: r.file,
                    errorCount: r.errors.length,
                    errors: r.errors.map(e => `[${e.severity}] ${e.field}: ${e.message}`)
                }))
        };

        if (this.outputJson) {
            console.log(JSON.stringify(report, null, 2));
        } else {
            this.printReport(report);
        }

        return report;
    }

    /**
     * Print human-readable report
     */
    printReport(report) {
        console.log('\n');
        console.log('='.repeat(60));
        console.log('VALIDATION REPORT');
        console.log('='.repeat(60));

        console.log('\nSUMMARY');
        console.log('-'.repeat(40));
        console.log(`Total Files Processed:      ${report.summary.totalFilesProcessed}`);
        console.log(`Total Entities Validated:   ${report.summary.totalEntitiesValidated}`);
        console.log(`Entities Passing:           ${report.summary.entitiesPassingValidation}`);
        console.log(`Entities With Errors:       ${report.summary.entitiesWithErrors}`);
        console.log(`Pass Rate:                  ${report.summary.passRate}`);
        console.log('');
        console.log(`Critical Errors:            ${report.summary.totalCriticalErrors}`);
        console.log(`Total Errors:               ${report.summary.totalErrors}`);
        console.log(`Total Warnings:             ${report.summary.totalWarnings}`);
        console.log(`Total Info:                 ${report.summary.totalInfo}`);

        console.log('\nBY ENTITY TYPE');
        console.log('-'.repeat(40));
        Object.entries(report.byType)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([type, stats]) => {
                const passRate = stats.total > 0 ? ((stats.passing / stats.total) * 100).toFixed(0) : 0;
                console.log(`${type.padEnd(15)} ${stats.total.toString().padStart(4)} total, ${stats.passing.toString().padStart(4)} pass, ${stats.failing.toString().padStart(4)} fail (${passRate}%)`);
            });

        if (report.commonErrors.length > 0) {
            console.log('\nMOST COMMON ERRORS');
            console.log('-'.repeat(40));
            report.commonErrors.forEach(({ error, count }) => {
                console.log(`${count.toString().padStart(4)}x  ${error}`);
            });
        }

        if (report.failedEntities.length > 0) {
            console.log('\nFAILED ENTITIES');
            console.log('-'.repeat(40));
            report.failedEntities.slice(0, 20).forEach(entity => {
                console.log(`\n${entity.name || entity.id || 'Unknown'} (${entity.errorCount} errors)`);
                console.log(`  File: ${entity.file}`);
                entity.errors.slice(0, 5).forEach(err => {
                    console.log(`  - ${err}`);
                });
                if (entity.errors.length > 5) {
                    console.log(`  ... and ${entity.errors.length - 5} more errors`);
                }
            });

            if (report.failedEntities.length > 20) {
                console.log(`\n... and ${report.failedEntities.length - 20} more failed entities`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Validation completed at ${new Date().toISOString()}`);
        console.log('='.repeat(60));
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        verbose: false,
        type: null,
        mythology: null,
        json: false
    };

    args.forEach(arg => {
        if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg.startsWith('--type=')) {
            options.type = arg.split('=')[1];
        } else if (arg.startsWith('--mythology=')) {
            options.mythology = arg.split('=')[1];
        }
    });

    return options;
}

// Main execution
async function main() {
    const options = parseArgs();
    const validator = new SchemaValidator(options);

    try {
        const report = await validator.validate();

        // Exit with error code if there are failing entities
        if (report.summary.entitiesWithErrors > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('Validation failed:', error.message);
        process.exit(1);
    }
}

main();
