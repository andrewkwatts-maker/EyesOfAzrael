/**
 * Mythology Schema - Validation schema for mythology collection entities
 * Eyes of Azrael Validation System
 */

const mythologySchema = {
    type: 'mythology',

    // Required fields specific to mythologies
    required: ['id', 'name', 'type'],

    // Mythology-specific optional fields
    optional: [
        'displayName',
        'description',
        'shortDescription',
        'longDescription',
        'region',
        'regions',
        'culture',
        'cultures',
        'period',
        'dateRange',
        'language',
        'languages',
        'primaryDeities',
        'keyFigures',
        'sacredTexts',
        'cosmology',
        'beliefs',
        'practices',
        'influences',
        'influencedBy',
        'historicalContext',
        'modernPractice',
        'relatedMythologies',
        'primarySources',
        'relatedEntities',
        'order',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms',
        'color',
        'colors',
        'theme'
    ],

    // Field type definitions
    fieldTypes: {
        regions: 'array',
        cultures: 'array',
        languages: 'array',
        primaryDeities: 'array',
        keyFigures: 'array',
        sacredTexts: 'array',
        beliefs: 'array',
        practices: 'array',
        influences: 'array',
        influencedBy: 'array',
        relatedMythologies: 'array',
        dateRange: 'object',
        cosmology: 'object',
        historicalContext: 'object',
        colors: 'object'
    },

    // Validation rules
    rules: {
        primaryDeities: {
            itemType: ['string', 'object']
        },
        sacredTexts: {
            itemType: ['string', 'object']
        },
        order: {
            type: 'number',
            min: 0
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'region',
        'period',
        'primaryDeities'
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

module.exports = mythologySchema;
