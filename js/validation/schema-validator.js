/**
 * Schema Validator
 * Validates entity data against JSON schemas with detailed error reporting
 */

class SchemaValidator {
    constructor() {
        this.schemas = new Map();
        this.baseSchema = null;
        this.initialized = false;
    }

    /**
     * Initialize validator by loading all schemas
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Load base schema
            this.baseSchema = await this.loadSchema('entity-base');

            // Load type-specific schemas
            const types = ['deity', 'hero', 'creature', 'ritual', 'cosmology', 'text', 'symbol', 'herb', 'place', 'concept', 'event'];

            await Promise.all(types.map(async (type) => {
                try {
                    const schema = await this.loadSchema(type);
                    this.schemas.set(type, schema);
                } catch (error) {
                    console.warn(`[SchemaValidator] Failed to load ${type} schema:`, error.message);
                }
            }));

            this.initialized = true;
            console.log(`[SchemaValidator] Initialized with ${this.schemas.size} schemas`);
        } catch (error) {
            console.error('[SchemaValidator] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load a schema file
     */
    async loadSchema(schemaName) {
        const response = await fetch(`/schemas/${schemaName}.schema.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${schemaName} schema: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Validate entity data against schema
     * @param {Object} data - Entity data to validate
     * @param {string} type - Entity type (deity, hero, etc.)
     * @returns {Object} Validation result with isValid and errors
     */
    validate(data, type = null) {
        if (!this.initialized) {
            throw new Error('SchemaValidator not initialized. Call initialize() first.');
        }

        // Determine type from data if not provided
        const entityType = type || data?.type;
        if (!entityType) {
            return {
                isValid: false,
                errors: [{ field: 'type', message: 'Entity type is required' }]
            };
        }

        // Get schema for this type
        const schema = this.schemas.get(entityType) || this.baseSchema;

        // Perform validation
        const errors = [];
        const warnings = [];

        // Validate required fields from base schema
        this.validateRequired(data, this.baseSchema, errors);

        // Validate field types and constraints
        this.validateProperties(data, schema, errors, warnings);

        // Validate references to other entities
        this.validateReferences(data, warnings);

        // Custom validation rules
        this.applyCustomRules(data, entityType, errors, warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            data
        };
    }

    /**
     * Validate required fields
     */
    validateRequired(data, schema, errors) {
        const required = schema.required || [];

        for (const field of required) {
            if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
                errors.push({
                    field,
                    message: `Required field '${field}' is missing`,
                    severity: 'error'
                });
            }
        }
    }

    /**
     * Validate properties against schema
     */
    validateProperties(data, schema, errors, warnings) {
        const properties = schema.properties || {};

        for (const [field, value] of Object.entries(data)) {
            const fieldSchema = properties[field];

            // Check for additional properties not in schema
            if (!fieldSchema && schema.additionalProperties === false) {
                warnings.push({
                    field,
                    message: `Field '${field}' is not defined in schema`,
                    severity: 'warning'
                });
                continue;
            }

            if (!fieldSchema) continue;

            // Validate type
            const typeError = this.validateType(value, fieldSchema, field);
            if (typeError) {
                errors.push(typeError);
                continue;
            }

            // Validate string constraints
            if (fieldSchema.type === 'string') {
                this.validateString(value, fieldSchema, field, errors);
            }

            // Validate array constraints
            if (fieldSchema.type === 'array') {
                this.validateArray(value, fieldSchema, field, errors, warnings);
            }

            // Validate object constraints
            if (fieldSchema.type === 'object') {
                this.validateObject(value, fieldSchema, field, errors, warnings);
            }

            // Validate enum values
            if (fieldSchema.enum) {
                if (!fieldSchema.enum.includes(value)) {
                    errors.push({
                        field,
                        message: `Field '${field}' must be one of: ${fieldSchema.enum.join(', ')}`,
                        severity: 'error',
                        expected: fieldSchema.enum,
                        actual: value
                    });
                }
            }

            // Validate pattern
            if (fieldSchema.pattern && typeof value === 'string') {
                const regex = new RegExp(fieldSchema.pattern);
                if (!regex.test(value)) {
                    errors.push({
                        field,
                        message: `Field '${field}' does not match required pattern: ${fieldSchema.pattern}`,
                        severity: 'error'
                    });
                }
            }

            // Validate format
            if (fieldSchema.format) {
                this.validateFormat(value, fieldSchema.format, field, errors);
            }
        }
    }

    /**
     * Validate value type
     */
    validateType(value, schema, field) {
        const expectedType = schema.type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (expectedType === 'array' && !Array.isArray(value)) {
            return {
                field,
                message: `Field '${field}' must be an array`,
                severity: 'error',
                expected: 'array',
                actual: actualType
            };
        }

        if (expectedType !== 'array' && expectedType !== actualType) {
            // Special handling for numbers
            if (expectedType === 'number' && (actualType === 'string' || actualType === 'number')) {
                const num = Number(value);
                if (isNaN(num)) {
                    return {
                        field,
                        message: `Field '${field}' must be a number`,
                        severity: 'error'
                    };
                }
                return null; // Valid number
            }

            return {
                field,
                message: `Field '${field}' must be of type '${expectedType}'`,
                severity: 'error',
                expected: expectedType,
                actual: actualType
            };
        }

        return null;
    }

    /**
     * Validate string constraints
     */
    validateString(value, schema, field, errors) {
        if (schema.minLength && value.length < schema.minLength) {
            errors.push({
                field,
                message: `Field '${field}' must be at least ${schema.minLength} characters`,
                severity: 'error',
                expected: `>= ${schema.minLength}`,
                actual: value.length
            });
        }

        if (schema.maxLength && value.length > schema.maxLength) {
            errors.push({
                field,
                message: `Field '${field}' must be at most ${schema.maxLength} characters`,
                severity: 'error',
                expected: `<= ${schema.maxLength}`,
                actual: value.length
            });
        }
    }

    /**
     * Validate array constraints
     */
    validateArray(value, schema, field, errors, warnings) {
        if (schema.minItems && value.length < schema.minItems) {
            errors.push({
                field,
                message: `Field '${field}' must have at least ${schema.minItems} items`,
                severity: 'error'
            });
        }

        if (schema.maxItems && value.length > schema.maxItems) {
            errors.push({
                field,
                message: `Field '${field}' must have at most ${schema.maxItems} items`,
                severity: 'error'
            });
        }

        if (schema.uniqueItems) {
            const duplicates = value.filter((item, index) => value.indexOf(item) !== index);
            if (duplicates.length > 0) {
                errors.push({
                    field,
                    message: `Field '${field}' must contain unique items. Duplicates: ${duplicates.join(', ')}`,
                    severity: 'error'
                });
            }
        }

        // Validate array items
        if (schema.items && value.length > 0) {
            value.forEach((item, index) => {
                if (schema.items.type === 'object' && schema.items.properties) {
                    this.validateProperties(item, schema.items, errors, warnings);
                }
            });
        }
    }

    /**
     * Validate object constraints
     */
    validateObject(value, schema, field, errors, warnings) {
        if (schema.required) {
            this.validateRequired(value, schema, errors);
        }

        if (schema.properties) {
            this.validateProperties(value, schema, errors, warnings);
        }
    }

    /**
     * Validate format constraints
     */
    validateFormat(value, format, field, errors) {
        switch (format) {
            case 'uri':
            case 'url':
                try {
                    new URL(value);
                } catch {
                    errors.push({
                        field,
                        message: `Field '${field}' must be a valid URL`,
                        severity: 'error'
                    });
                }
                break;

            case 'date-time':
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errors.push({
                        field,
                        message: `Field '${field}' must be a valid ISO 8601 date-time`,
                        severity: 'error'
                    });
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push({
                        field,
                        message: `Field '${field}' must be a valid email address`,
                        severity: 'error'
                    });
                }
                break;
        }
    }

    /**
     * Validate entity references
     */
    validateReferences(data, warnings) {
        // Check relatedEntities
        if (data.relatedEntities && Array.isArray(data.relatedEntities)) {
            data.relatedEntities.forEach((ref, index) => {
                if (!ref.id || !ref.name) {
                    warnings.push({
                        field: `relatedEntities[${index}]`,
                        message: 'Related entity should have both id and name',
                        severity: 'warning'
                    });
                }
            });
        }

        // Check archetype references
        if (data.archetypes && Array.isArray(data.archetypes)) {
            data.archetypes.forEach((archetypeId, index) => {
                if (typeof archetypeId !== 'string' || !archetypeId.match(/^[a-z0-9_-]+$/)) {
                    warnings.push({
                        field: `archetypes[${index}]`,
                        message: 'Archetype ID should be lowercase alphanumeric with hyphens/underscores',
                        severity: 'warning'
                    });
                }
            });
        }
    }

    /**
     * Apply custom validation rules
     */
    applyCustomRules(data, type, errors, warnings) {
        // Ensure metadata.updated is set
        if (!data.metadata?.updated) {
            warnings.push({
                field: 'metadata.updated',
                message: 'Updated timestamp should be set',
                severity: 'warning'
            });
        }

        // Ensure entities have descriptions
        if (!data.description || data.description.length < 50) {
            warnings.push({
                field: 'description',
                message: 'Description should be at least 50 characters for better content quality',
                severity: 'warning'
            });
        }

        // Ensure entities have sources
        if (!data.sources || data.sources.length === 0) {
            warnings.push({
                field: 'sources',
                message: 'Adding source references improves credibility',
                severity: 'warning'
            });
        }

        // Type-specific rules
        if (type === 'deity') {
            if (!data.domains || data.domains.length === 0) {
                warnings.push({
                    field: 'domains',
                    message: 'Deities should specify their domains of influence',
                    severity: 'warning'
                });
            }
        }
    }

    /**
     * Validate multiple entities in batch
     */
    validateBatch(entities) {
        return entities.map(entity => ({
            id: entity.id,
            ...this.validate(entity)
        }));
    }

    /**
     * Generate validation report
     */
    generateReport(validationResult) {
        const { isValid, errors, warnings, data } = validationResult;

        return {
            valid: isValid,
            entityId: data.id,
            entityName: data.name,
            entityType: data.type,
            errorCount: errors.length,
            warningCount: warnings.length,
            errors: errors.map(e => ({
                field: e.field,
                message: e.message,
                severity: e.severity || 'error'
            })),
            warnings: warnings.map(w => ({
                field: w.field,
                message: w.message,
                severity: w.severity || 'warning'
            })),
            timestamp: new Date().toISOString()
        };
    }
}

// Export for both module and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaValidator;
}

if (typeof window !== 'undefined') {
    window.SchemaValidator = SchemaValidator;
}
