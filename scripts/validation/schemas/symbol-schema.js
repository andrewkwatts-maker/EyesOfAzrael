/**
 * Symbol Schema - Validation schema for sacred symbol entities
 * Eyes of Azrael Validation System
 */

const symbolSchema = {
    type: 'symbol',

    // Required fields specific to symbols
    required: ['id', 'name', 'type'],

    // Symbol-specific optional fields
    optional: [
        'displayName',
        'description',
        'mythology',
        'mythologies',
        'filename',
        'contentType',
        'meaning',
        'meanings',
        'visualDescription',
        'usage',
        'ritualUsage',
        'attributes',
        'variations',
        'relationships',
        'relatedEntities',
        'primarySources',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms',
        'enhancedBy',
        'updatedAt',
        'batch4_migration_status',
        'batch4_migration_timestamp',
        'extracted_title',
        'extracted_headings',
        'extracted_lists',
        'batch5_migration',
        'last_updated'
    ],

    // Field type definitions
    fieldTypes: {
        meanings: 'array',
        variations: 'array',
        attributes: 'array',
        extracted_headings: 'array',
        extracted_lists: 'array',
        relationships: 'object',
        batch5_migration: 'object'
    },

    // Validation rules
    rules: {
        meanings: {
            itemType: 'string'
        },
        variations: {
            itemType: ['string', 'object']
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'meaning',
        'visualDescription'
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

module.exports = symbolSchema;
