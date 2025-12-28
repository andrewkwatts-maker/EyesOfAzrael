/**
 * Validated CRUD Manager
 * Wraps FirebaseCRUDManager with schema validation
 */

class ValidatedCRUDManager {
    constructor(crudManager, validator) {
        this.crud = crudManager;
        this.validator = validator;
        this.validationMode = 'strict'; // 'strict' | 'warn' | 'off'
    }

    /**
     * Set validation mode
     * @param {string} mode - 'strict' (block invalid), 'warn' (allow with warnings), 'off' (no validation)
     */
    setValidationMode(mode) {
        if (!['strict', 'warn', 'off'].includes(mode)) {
            throw new Error('Invalid validation mode. Use: strict, warn, or off');
        }
        this.validationMode = mode;
        console.log(`[ValidatedCRUD] Validation mode set to: ${mode}`);
    }

    /**
     * Create entity with validation
     */
    async create(collection, data, options = {}) {
        // Skip validation if mode is off
        if (this.validationMode === 'off') {
            return await this.crud.create(collection, data);
        }

        // Validate data
        const validation = this.validator.validate(data);

        // Log validation results
        this.logValidation(validation, 'create', collection);

        // In strict mode, reject invalid data
        if (this.validationMode === 'strict' && !validation.isValid) {
            const error = new Error('Validation failed: Cannot create invalid entity');
            error.validation = validation;
            throw error;
        }

        // Show warnings to user if present
        if (validation.warnings.length > 0 && options.showWarnings !== false) {
            this.showValidationWarnings(validation.warnings);
        }

        // Add validation metadata
        const enhancedData = {
            ...data,
            metadata: {
                ...data.metadata,
                validated: true,
                validationDate: new Date().toISOString(),
                validationWarnings: validation.warnings.length
            }
        };

        // Create entity
        return await this.crud.create(collection, enhancedData);
    }

    /**
     * Update entity with validation
     */
    async update(collection, id, updates, options = {}) {
        // Skip validation if mode is off
        if (this.validationMode === 'off') {
            return await this.crud.update(collection, id, updates);
        }

        // Fetch current data to merge with updates
        let fullData = { ...updates };

        if (options.validateFull !== false) {
            try {
                const current = await this.crud.read(collection, id);
                fullData = { ...current, ...updates };
            } catch (error) {
                console.warn('[ValidatedCRUD] Could not fetch current data for full validation:', error);
            }
        }

        // Validate merged data
        const validation = this.validator.validate(fullData);

        // Log validation results
        this.logValidation(validation, 'update', collection);

        // In strict mode, reject invalid updates
        if (this.validationMode === 'strict' && !validation.isValid) {
            const error = new Error('Validation failed: Cannot update to invalid state');
            error.validation = validation;
            throw error;
        }

        // Show warnings to user if present
        if (validation.warnings.length > 0 && options.showWarnings !== false) {
            this.showValidationWarnings(validation.warnings);
        }

        // Add validation metadata to updates
        const enhancedUpdates = {
            ...updates,
            'metadata.validated': true,
            'metadata.validationDate': new Date().toISOString(),
            'metadata.validationWarnings': validation.warnings.length
        };

        // Update entity
        return await this.crud.update(collection, id, enhancedUpdates);
    }

    /**
     * Delete entity (pass through to CRUD manager)
     */
    async delete(collection, id) {
        return await this.crud.delete(collection, id);
    }

    /**
     * Read entity (pass through to CRUD manager)
     */
    async read(collection, id) {
        return await this.crud.read(collection, id);
    }

    /**
     * List entities (pass through to CRUD manager)
     */
    async list(collection, filters = {}) {
        return await this.crud.list(collection, filters);
    }

    /**
     * Validate existing entity
     */
    async validateEntity(collection, id) {
        const data = await this.crud.read(collection, id);
        const validation = this.validator.validate(data);

        return {
            id,
            collection,
            ...validation,
            report: this.validator.generateReport(validation)
        };
    }

    /**
     * Validate all entities in a collection
     */
    async validateCollection(collection, options = {}) {
        const entities = await this.crud.list(collection);
        const results = [];
        let validCount = 0;
        let invalidCount = 0;

        for (const entity of entities) {
            const validation = this.validator.validate(entity);

            if (validation.isValid) {
                validCount++;
            } else {
                invalidCount++;
            }

            results.push({
                id: entity.id,
                name: entity.name,
                ...validation
            });

            // Progress callback
            if (options.onProgress) {
                options.onProgress({
                    current: results.length,
                    total: entities.length,
                    validCount,
                    invalidCount
                });
            }
        }

        return {
            collection,
            totalEntities: entities.length,
            validCount,
            invalidCount,
            results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Bulk validate entities from uploaded file
     */
    async validateUpload(entities) {
        const results = entities.map(entity => {
            const validation = this.validator.validate(entity);
            return {
                id: entity.id,
                name: entity.name,
                type: entity.type,
                ...validation
            };
        });

        const validCount = results.filter(r => r.isValid).length;
        const invalidCount = results.length - validCount;

        return {
            totalEntities: entities.length,
            validCount,
            invalidCount,
            canImport: invalidCount === 0,
            results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Export entities with validation check
     */
    async exportCollection(collection, options = {}) {
        const entities = await this.crud.list(collection);

        // Optionally validate before export
        if (options.validateBeforeExport) {
            const validationResults = entities.map(entity => ({
                entity,
                validation: this.validator.validate(entity)
            }));

            // Filter out invalid entities if requested
            if (options.excludeInvalid) {
                return validationResults
                    .filter(r => r.validation.isValid)
                    .map(r => r.entity);
            }

            // Add validation info to export
            return validationResults.map(r => ({
                ...r.entity,
                _validation: {
                    isValid: r.validation.isValid,
                    errorCount: r.validation.errors.length,
                    warningCount: r.validation.warnings.length
                }
            }));
        }

        return entities;
    }

    /**
     * Log validation results
     */
    logValidation(validation, operation, collection) {
        const { isValid, errors, warnings } = validation;
        const status = isValid ? '✓' : '✗';

        console.group(`[ValidatedCRUD] ${status} ${operation} validation for ${collection}`);

        if (errors.length > 0) {
            console.error('Errors:', errors);
        }

        if (warnings.length > 0) {
            console.warn('Warnings:', warnings);
        }

        console.groupEnd();
    }

    /**
     * Show validation warnings to user
     */
    showValidationWarnings(warnings) {
        // Check if there's a toast notification system
        if (window.showToast) {
            const message = `${warnings.length} validation warning${warnings.length > 1 ? 's' : ''} found. Check console for details.`;
            window.showToast(message, 'warning');
        } else {
            console.warn('[ValidatedCRUD] Validation warnings:', warnings);
        }
    }

    /**
     * Get validation statistics for collection
     */
    async getValidationStats(collection) {
        const validation = await this.validateCollection(collection);

        return {
            collection,
            total: validation.totalEntities,
            valid: validation.validCount,
            invalid: validation.invalidCount,
            validPercentage: Math.round((validation.validCount / validation.totalEntities) * 100),
            timestamp: validation.timestamp
        };
    }

    /**
     * Fix common validation issues automatically
     */
    async autoFix(collection, id, options = {}) {
        const data = await this.crud.read(collection, id);
        const validation = this.validator.validate(data);

        if (validation.isValid) {
            return { fixed: false, message: 'Entity is already valid' };
        }

        const fixes = {};
        let fixCount = 0;

        // Auto-fix missing required fields with defaults
        for (const error of validation.errors) {
            if (error.message.includes('Required field') && error.message.includes('missing')) {
                const field = error.field;

                // Provide sensible defaults
                if (field === 'shortDescription' && data.description) {
                    fixes[field] = data.description.substring(0, 200);
                    fixCount++;
                } else if (field === 'tags') {
                    fixes[field] = [];
                    fixCount++;
                } else if (field === 'alternateNames') {
                    fixes[field] = [];
                    fixCount++;
                }
            }
        }

        // Auto-fix metadata
        if (!data.metadata) {
            fixes.metadata = {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                verified: false
            };
            fixCount++;
        }

        if (fixCount > 0 && options.apply !== false) {
            await this.crud.update(collection, id, fixes);
            return {
                fixed: true,
                fixCount,
                fixes,
                message: `Applied ${fixCount} automatic fix${fixCount > 1 ? 'es' : ''}`
            };
        }

        return {
            fixed: false,
            fixCount: 0,
            message: 'No automatic fixes available'
        };
    }
}

// Export for both module and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidatedCRUDManager;
}

if (typeof window !== 'undefined') {
    window.ValidatedCRUDManager = ValidatedCRUDManager;
}
