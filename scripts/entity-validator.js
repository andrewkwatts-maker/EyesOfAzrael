/**
 * Entity Validator - Comprehensive validation of entity metadata
 * Validates schema compliance, cross-references, geographical data, temporal data, etc.
 */

const fs = require('fs').promises;
const path = require('path');

class EntityValidator {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(__dirname, '..');
        this.entitiesDir = path.join(this.baseDir, 'data', 'entities');
        this.schema = null;
        this.allEntities = new Map(); // Map of id:type => entity
        this.errors = [];
        this.warnings = [];
        this.info = [];
        this.strictMode = options.strictMode || false;
    }

    /**
     * Initialize validator by loading schema
     */
    async initialize() {
        const schemaPath = path.join(this.baseDir, 'data', 'schemas', 'entity-schema-v2.json');
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        this.schema = JSON.parse(schemaContent);
    }

    /**
     * Validate a single entity
     */
    validateEntity(entity, filepath = '') {
        const entityErrors = [];
        const entityWarnings = [];
        const entityInfo = [];

        const context = {
            id: entity.id,
            type: entity.type,
            filepath
        };

        // 1. Required Fields Validation
        this.validateRequiredFields(entity, entityErrors, context);

        // 2. Data Type Validation
        this.validateDataTypes(entity, entityErrors, context);

        // 3. Enum Value Validation
        this.validateEnumValues(entity, entityErrors, context);

        // 4. Pattern Matching (IDs, colors, etc.)
        this.validatePatterns(entity, entityErrors, context);

        // 5. Linguistic Data Validation
        this.validateLinguisticData(entity, entityWarnings, context);

        // 6. Geographical Data Validation
        this.validateGeographicalData(entity, entityErrors, entityWarnings, context);

        // 7. Temporal Data Validation
        this.validateTemporalData(entity, entityWarnings, context);

        // 8. Cross-Reference Structure (URLs will be validated separately)
        this.validateCrossReferenceStructure(entity, entityWarnings, context);

        // 9. Source Citations
        this.validateSources(entity, entityWarnings, context);

        // 10. Metadata Completeness
        this.validateCompleteness(entity, entityInfo, context);

        return {
            entity: context,
            errors: entityErrors,
            warnings: entityWarnings,
            info: entityInfo,
            isValid: entityErrors.length === 0
        };
    }

    /**
     * Validate required fields
     */
    validateRequiredFields(entity, errors, context) {
        const required = ['id', 'type', 'name', 'mythologies'];

        required.forEach(field => {
            if (!entity[field]) {
                errors.push({
                    severity: 'critical',
                    field,
                    message: `Missing required field: ${field}`,
                    context
                });
            }
        });

        // Mythologies must be non-empty array
        if (entity.mythologies && (!Array.isArray(entity.mythologies) || entity.mythologies.length === 0)) {
            errors.push({
                severity: 'critical',
                field: 'mythologies',
                message: 'mythologies must be a non-empty array',
                context
            });
        }
    }

    /**
     * Validate data types
     */
    validateDataTypes(entity, errors, context) {
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
            archetypes: 'array',
            relatedEntities: 'object',
            sources: 'array'
        };

        Object.entries(typeChecks).forEach(([field, expectedType]) => {
            if (entity[field] !== undefined) {
                const actualType = Array.isArray(entity[field]) ? 'array' : typeof entity[field];
                if (actualType !== expectedType) {
                    errors.push({
                        severity: 'critical',
                        field,
                        message: `Invalid type for ${field}: expected ${expectedType}, got ${actualType}`,
                        context
                    });
                }
            }
        });
    }

    /**
     * Validate enum values
     */
    validateEnumValues(entity, errors, context) {
        // Entity type
        const validTypes = ['item', 'place', 'deity', 'concept', 'archetype', 'magic', 'creature', 'hero'];
        if (entity.type && !validTypes.includes(entity.type)) {
            errors.push({
                severity: 'critical',
                field: 'type',
                message: `Invalid entity type: ${entity.type}. Must be one of: ${validTypes.join(', ')}`,
                context
            });
        }

        // Metaphysical properties
        if (entity.metaphysicalProperties) {
            const props = entity.metaphysicalProperties;

            // Element
            const validElements = ['fire', 'water', 'earth', 'air', 'aether', 'wood', 'metal'];
            if (props.primaryElement && !validElements.includes(props.primaryElement)) {
                errors.push({
                    severity: 'warning',
                    field: 'metaphysicalProperties.primaryElement',
                    message: `Invalid element: ${props.primaryElement}`,
                    context
                });
            }

            // Planets
            const validPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
            if (props.planets && Array.isArray(props.planets)) {
                props.planets.forEach(planet => {
                    if (!validPlanets.includes(planet)) {
                        errors.push({
                            severity: 'warning',
                            field: 'metaphysicalProperties.planets',
                            message: `Invalid planet: ${planet}`,
                            context
                        });
                    }
                });
            }

            // Sefirot
            const validSefirot = ['keter', 'chokmah', 'binah', 'chesed', 'gevurah', 'tiferet', 'netzach', 'hod', 'yesod', 'malkhut', 'daat'];
            if (props.sefirot && Array.isArray(props.sefirot)) {
                props.sefirot.forEach(sefirah => {
                    if (!validSefirot.includes(sefirah)) {
                        errors.push({
                            severity: 'warning',
                            field: 'metaphysicalProperties.sefirot',
                            message: `Invalid sefirah: ${sefirah}`,
                            context
                        });
                    }
                });
            }

            // Chakras
            const validChakras = ['muladhara', 'svadhisthana', 'manipura', 'anahata', 'vishuddha', 'ajna', 'sahasrara'];
            if (props.chakras && Array.isArray(props.chakras)) {
                props.chakras.forEach(chakra => {
                    if (!validChakras.includes(chakra)) {
                        errors.push({
                            severity: 'warning',
                            field: 'metaphysicalProperties.chakras',
                            message: `Invalid chakra: ${chakra}`,
                            context
                        });
                    }
                });
            }
        }
    }

    /**
     * Validate patterns (IDs, colors, coordinates)
     */
    validatePatterns(entity, errors, context) {
        // ID must be kebab-case
        if (entity.id && !/^[a-z0-9-]+$/.test(entity.id)) {
            errors.push({
                severity: 'critical',
                field: 'id',
                message: `Invalid ID format: must be kebab-case (lowercase letters, numbers, hyphens only)`,
                context
            });
        }

        // Colors must be valid hex
        if (entity.colors) {
            ['primary', 'secondary', 'accent'].forEach(colorType => {
                const color = entity.colors[colorType];
                if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    errors.push({
                        severity: 'warning',
                        field: `colors.${colorType}`,
                        message: `Invalid hex color format: ${color}`,
                        context
                    });
                }
            });
        }

        // Short description length
        if (entity.shortDescription && entity.shortDescription.length > 200) {
            errors.push({
                severity: 'warning',
                field: 'shortDescription',
                message: `Short description too long (${entity.shortDescription.length} chars, max 200)`,
                context
            });
        }
    }

    /**
     * Validate linguistic data
     */
    validateLinguisticData(entity, warnings, context) {
        const ling = entity.linguistic;
        if (!ling) return;

        // If originalName is provided, should have script and transliteration
        if (ling.originalName) {
            if (!ling.originalScript) {
                warnings.push({
                    severity: 'warning',
                    field: 'linguistic.originalScript',
                    message: 'originalName provided but originalScript missing',
                    context
                });
            }
            if (!ling.transliteration) {
                warnings.push({
                    severity: 'warning',
                    field: 'linguistic.transliteration',
                    message: 'originalName provided but transliteration missing',
                    context
                });
            }
        }

        // Validate script enum
        const validScripts = ['latin', 'greek', 'hebrew', 'arabic', 'devanagari', 'chinese', 'japanese', 'runic', 'hieroglyphic', 'cuneiform'];
        if (ling.originalScript && !validScripts.includes(ling.originalScript)) {
            warnings.push({
                severity: 'warning',
                field: 'linguistic.originalScript',
                message: `Invalid script: ${ling.originalScript}`,
                context
            });
        }
    }

    /**
     * Validate geographical data
     */
    validateGeographicalData(entity, errors, warnings, context) {
        const geo = entity.geographical;
        if (!geo) return;

        // Validate coordinates
        const validateCoordinates = (coords, fieldPath) => {
            if (!coords) return;

            if (coords.latitude !== undefined) {
                if (coords.latitude < -90 || coords.latitude > 90) {
                    errors.push({
                        severity: 'critical',
                        field: `${fieldPath}.latitude`,
                        message: `Invalid latitude: ${coords.latitude} (must be between -90 and 90)`,
                        context
                    });
                }
            }

            if (coords.longitude !== undefined) {
                if (coords.longitude < -180 || coords.longitude > 180) {
                    errors.push({
                        severity: 'critical',
                        field: `${fieldPath}.longitude`,
                        message: `Invalid longitude: ${coords.longitude} (must be between -180 and 180)`,
                        context
                    });
                }
            }

            // Accuracy should be specified
            const validAccuracy = ['exact', 'approximate', 'general_area', 'speculative'];
            if (coords.accuracy && !validAccuracy.includes(coords.accuracy)) {
                warnings.push({
                    severity: 'warning',
                    field: `${fieldPath}.accuracy`,
                    message: `Invalid accuracy: ${coords.accuracy}`,
                    context
                });
            }
        };

        // Check primary location
        if (geo.primaryLocation && geo.primaryLocation.coordinates) {
            validateCoordinates(geo.primaryLocation.coordinates, 'geographical.primaryLocation.coordinates');
        }

        // Check associated locations
        if (geo.associatedLocations && Array.isArray(geo.associatedLocations)) {
            geo.associatedLocations.forEach((loc, idx) => {
                if (loc.coordinates) {
                    validateCoordinates(loc.coordinates, `geographical.associatedLocations[${idx}].coordinates`);
                }
            });
        }
    }

    /**
     * Validate temporal data
     */
    validateTemporalData(entity, warnings, context) {
        const temp = entity.temporal;
        if (!temp) return;

        // Validate date consistency
        if (temp.historicalDate) {
            const { start, end } = temp.historicalDate;

            if (start && end && start.year !== undefined && end.year !== undefined) {
                if (start.year > end.year) {
                    warnings.push({
                        severity: 'warning',
                        field: 'temporal.historicalDate',
                        message: 'Start date is after end date',
                        context
                    });
                }
            }
        }

        // First attestation should have required fields
        if (temp.firstAttestation) {
            const att = temp.firstAttestation;
            if (!att.source) {
                warnings.push({
                    severity: 'warning',
                    field: 'temporal.firstAttestation.source',
                    message: 'First attestation missing source',
                    context
                });
            }

            const validTypes = ['literary', 'archaeological', 'epigraphic', 'iconographic', 'oral_tradition'];
            if (att.type && !validTypes.includes(att.type)) {
                warnings.push({
                    severity: 'warning',
                    field: 'temporal.firstAttestation.type',
                    message: `Invalid attestation type: ${att.type}`,
                    context
                });
            }
        }
    }

    /**
     * Validate cross-reference structure
     */
    validateCrossReferenceStructure(entity, warnings, context) {
        const related = entity.relatedEntities;
        if (!related) return;

        const validTypes = ['deities', 'items', 'places', 'concepts', 'creatures', 'heroes', 'magic'];

        validTypes.forEach(type => {
            if (related[type] && Array.isArray(related[type])) {
                related[type].forEach((ref, idx) => {
                    if (!ref.id) {
                        warnings.push({
                            severity: 'warning',
                            field: `relatedEntities.${type}[${idx}]`,
                            message: 'Related entity missing id',
                            context
                        });
                    }
                    if (!ref.name) {
                        warnings.push({
                            severity: 'warning',
                            field: `relatedEntities.${type}[${idx}]`,
                            message: 'Related entity missing name',
                            context
                        });
                    }
                });
            }
        });
    }

    /**
     * Validate source citations
     */
    validateSources(entity, warnings, context) {
        if (!entity.sources || !Array.isArray(entity.sources)) return;

        entity.sources.forEach((source, idx) => {
            if (!source.title && !source.text) {
                warnings.push({
                    severity: 'warning',
                    field: `sources[${idx}]`,
                    message: 'Source missing title/text',
                    context
                });
            }

            const validTypes = ['primary', 'secondary', 'archaeological'];
            if (source.type && !validTypes.includes(source.type)) {
                warnings.push({
                    severity: 'warning',
                    field: `sources[${idx}].type`,
                    message: `Invalid source type: ${source.type}`,
                    context
                });
            }
        });
    }

    /**
     * Validate metadata completeness
     */
    validateCompleteness(entity, info, context) {
        const optionalButRecommended = [
            'shortDescription',
            'fullDescription',
            'linguistic',
            'geographical',
            'temporal',
            'sources',
            'colors',
            'archetypes'
        ];

        let completeness = 0;
        let total = optionalButRecommended.length;

        optionalButRecommended.forEach(field => {
            if (entity[field]) {
                completeness++;
            }
        });

        const percentage = Math.round((completeness / total) * 100);

        info.push({
            severity: 'info',
            field: 'completeness',
            message: `Metadata completeness: ${percentage}% (${completeness}/${total} recommended fields)`,
            context,
            percentage
        });
    }

    /**
     * Validate cross-reference URLs (requires file system access)
     */
    async validateCrossReferences(entity, context) {
        const errors = [];
        const related = entity.relatedEntities;
        if (!related) return errors;

        for (const [type, entities] of Object.entries(related)) {
            if (!Array.isArray(entities)) continue;

            for (const ref of entities) {
                if (ref.url) {
                    // Check if URL points to existing file
                    // Convert URL to file path
                    const urlPath = ref.url.replace(/^\//, '').replace('.html', '.json');
                    const parts = urlPath.split('/');

                    // Try to construct entity file path
                    // URL format: /mythos/{mythology}/{type}s/{id}.html
                    // File path: data/entities/{type}/{id}.json
                    if (parts.length >= 4) {
                        const entityType = parts[2].replace(/s$/, ''); // Remove trailing 's'
                        const entityId = parts[3];
                        const filepath = path.join(this.entitiesDir, entityType, `${entityId}.json`);

                        try {
                            await fs.access(filepath);
                        } catch {
                            errors.push({
                                severity: 'warning',
                                field: `relatedEntities.${type}`,
                                message: `Cross-reference URL points to non-existent entity: ${ref.url}`,
                                context,
                                suggestion: `Check if entity ${entityId} exists in ${entityType} directory`
                            });
                        }
                    }
                }

                // Store reference for later cross-validation
                if (ref.id && ref.type) {
                    const key = `${ref.type}:${ref.id}`;
                    this.allEntities.set(key, entity);
                }
            }
        }

        return errors;
    }

    /**
     * Get validation summary
     */
    getSummary(results) {
        const summary = {
            total: results.length,
            valid: 0,
            invalid: 0,
            totalErrors: 0,
            totalWarnings: 0,
            totalInfo: 0,
            criticalErrors: 0,
            byType: {},
            avgCompleteness: 0
        };

        let completenessSum = 0;
        let completenessCount = 0;

        results.forEach(result => {
            if (result.isValid) {
                summary.valid++;
            } else {
                summary.invalid++;
            }

            summary.totalErrors += result.errors.length;
            summary.totalWarnings += result.warnings.length;
            summary.totalInfo += result.info.length;

            result.errors.forEach(err => {
                if (err.severity === 'critical') {
                    summary.criticalErrors++;
                }
            });

            // Track by type
            const type = result.entity.type || 'unknown';
            if (!summary.byType[type]) {
                summary.byType[type] = { total: 0, valid: 0, invalid: 0 };
            }
            summary.byType[type].total++;
            if (result.isValid) {
                summary.byType[type].valid++;
            } else {
                summary.byType[type].invalid++;
            }

            // Calculate average completeness
            const completenessInfo = result.info.find(i => i.field === 'completeness');
            if (completenessInfo && completenessInfo.percentage !== undefined) {
                completenessSum += completenessInfo.percentage;
                completenessCount++;
            }
        });

        if (completenessCount > 0) {
            summary.avgCompleteness = Math.round(completenessSum / completenessCount);
        }

        return summary;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityValidator;
}
