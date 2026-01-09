/**
 * Archetype Schema - Validation schema for archetype entities
 * Eyes of Azrael Validation System
 */

const archetypeSchema = {
    type: 'archetype',

    // Required fields specific to archetypes
    required: ['id', 'name', 'type'],

    // Archetype-specific optional fields
    optional: [
        'displayName',
        'description',
        'definition',
        'mythology',
        'characteristics',
        'examples',
        'symbolism',
        'relatedArchetypes',
        'primarySources',
        'relatedEntities',
        'extendedContent',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms'
    ],

    // Field type definitions
    fieldTypes: {
        mythology: 'object',
        characteristics: 'array',
        examples: 'array',
        symbolism: 'object',
        relatedArchetypes: 'array',
        extendedContent: 'object'
    },

    // Validation rules
    rules: {
        characteristics: {
            itemType: 'string'
        },
        examples: {
            itemType: ['string', 'object']
        },
        relatedArchetypes: {
            itemType: 'object',
            itemRequiredFields: ['name']
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'definition',
        'characteristics',
        'examples'
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

module.exports = archetypeSchema;
