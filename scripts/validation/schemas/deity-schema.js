/**
 * Deity Schema - Validation schema for deity entities
 * Eyes of Azrael Validation System
 */

const deitySchema = {
    type: 'deity',

    // Required fields specific to deities
    required: ['id', 'name', 'type'],

    // Deity-specific optional fields
    optional: [
        'displayName',
        'title',
        'description',
        'mythology',
        'mythologies',
        'domains',
        'symbols',
        'epithets',
        'attributes',
        'relationships',
        'archetypes',
        'primarySources',
        'relatedEntities',
        'rawMetadata',
        'icon',
        'iconType',
        'metadata',
        'content',
        'longDescription',
        'shortDescription',
        'worship',
        'sources',
        'extendedContent',
        'tags',
        'searchTerms'
    ],

    // Field type definitions
    fieldTypes: {
        domains: 'array',
        symbols: 'array',
        epithets: 'array',
        attributes: 'array',
        relationships: 'object',
        archetypes: 'array',
        worship: 'object',
        sources: 'object',
        rawMetadata: 'object'
    },

    // Validation rules specific to deities
    rules: {
        domains: {
            itemType: 'string'
        },
        symbols: {
            itemType: 'string'
        },
        epithets: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'domains',
        'symbols'
    ],

    // Quality thresholds
    qualityThresholds: {
        minimal: {
            requiredPresent: 100,
            recommendedPresent: 0
        },
        basic: {
            requiredPresent: 100,
            recommendedPresent: 50
        },
        complete: {
            requiredPresent: 100,
            recommendedPresent: 100
        }
    }
};

module.exports = deitySchema;
