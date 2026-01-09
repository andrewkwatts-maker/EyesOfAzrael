/**
 * Herb Schema - Validation schema for sacred herb entities
 * Eyes of Azrael Validation System
 */

const herbSchema = {
    type: 'herb',

    // Required fields specific to herbs
    required: ['id', 'name', 'type'],

    // Herb-specific optional fields
    optional: [
        'displayName',
        'description',
        'mythology',
        'mythologies',
        'scientificName',
        'commonNames',
        'properties',
        'uses',
        'ritualUses',
        'medicinProperties',
        'symbolism',
        'associations',
        'preparation',
        'warnings',
        'relatedDeities',
        'relatedRituals',
        'primarySources',
        'relatedEntities',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms'
    ],

    // Field type definitions
    fieldTypes: {
        commonNames: 'array',
        properties: 'array',
        uses: 'array',
        ritualUses: 'array',
        medicinProperties: 'array',
        associations: 'array',
        warnings: 'array',
        relatedDeities: 'array',
        relatedRituals: 'array',
        symbolism: ['string', 'object'],
        preparation: ['string', 'object']
    },

    // Validation rules
    rules: {
        properties: {
            itemType: 'string'
        },
        uses: {
            itemType: 'string'
        },
        warnings: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'properties',
        'uses'
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

module.exports = herbSchema;
