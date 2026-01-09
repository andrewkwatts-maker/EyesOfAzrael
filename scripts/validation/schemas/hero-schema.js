/**
 * Hero Schema - Validation schema for hero entities
 * Eyes of Azrael Validation System
 */

const heroSchema = {
    type: 'hero',

    // Required fields specific to heroes
    required: ['id', 'name', 'type'],

    // Hero-specific optional fields
    optional: [
        'displayName',
        'description',
        'mythology',
        'mythologies',
        'filename',
        'titles',
        'quests',
        'feats',
        'relationships',
        'companions',
        'weapons',
        'attributes',
        'primarySources',
        'relatedEntities',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms',
        '_modified',
        'createdAt',
        'updated_at'
    ],

    // Field type definitions
    fieldTypes: {
        titles: 'array',
        quests: 'array',
        feats: 'array',
        relationships: 'object',
        companions: 'array',
        weapons: 'array',
        attributes: 'array'
    },

    // Validation rules
    rules: {
        titles: {
            itemType: 'string'
        },
        quests: {
            itemType: ['string', 'object']
        },
        feats: {
            itemType: ['string', 'object']
        },
        companions: {
            itemType: ['string', 'object']
        },
        weapons: {
            itemType: ['string', 'object']
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'quests',
        'feats'
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

module.exports = heroSchema;
