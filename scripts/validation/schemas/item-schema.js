/**
 * Item Schema - Validation schema for item/artifact entities
 * Eyes of Azrael Validation System
 */

const itemSchema = {
    type: 'item',

    // Required fields specific to items
    required: ['id', 'name', 'type'],

    // Item-specific optional fields
    optional: [
        'displayName',
        'description',
        'shortDescription',
        'longDescription',
        'mythology',
        'mythologies',
        'primaryMythology',
        'itemType',
        'subtype',
        'materials',
        'powers',
        'wielders',
        'origin',
        'significance',
        'owner',
        'createdBy',
        'relatedItems',
        'primarySources',
        'relatedEntities',
        'sources',
        'symbolism',
        'extendedContent',
        'mythologyContexts',
        'cultural',
        'geographical',
        'temporal',
        'linguistic',
        'colors',
        'metaphysicalProperties',
        'mediaReferences',
        'traditions',
        'bibliography',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms',
        'visibility',
        'status',
        'slug'
    ],

    // Field type definitions
    fieldTypes: {
        materials: 'array',
        powers: 'array',
        wielders: 'array',
        createdBy: 'array',
        relatedItems: 'array',
        sources: 'array',
        mythologyContexts: 'array',
        traditions: 'array',
        bibliography: 'array',
        cultural: 'object',
        geographical: 'object',
        temporal: 'object',
        linguistic: 'object',
        colors: 'object',
        metaphysicalProperties: 'object',
        mediaReferences: 'object'
    },

    // Validation rules
    rules: {
        materials: {
            itemType: 'string'
        },
        powers: {
            itemType: 'string'
        },
        wielders: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'powers',
        'materials'
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

module.exports = itemSchema;
