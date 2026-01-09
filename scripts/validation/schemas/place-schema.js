/**
 * Place Schema - Validation schema for place/location entities
 * Eyes of Azrael Validation System
 */

const placeSchema = {
    type: 'place',

    // Required fields specific to places
    required: ['id', 'name', 'type'],

    // Place-specific optional fields
    optional: [
        'displayName',
        'description',
        'shortDescription',
        'longDescription',
        'mythology',
        'mythologies',
        'primaryMythology',
        'placeType',
        'accessibility',
        'significance',
        'geography',
        'inhabitants',
        'guardians',
        'items',
        'relatedEvents',
        'associatedEvents',
        'connections',
        'features',
        'primarySources',
        'relatedEntities',
        'geographical',
        'extendedContent',
        '_migration',
        '_metadata',
        '_norseEnrichment',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms',
        'visibility',
        'status',
        'created',
        'updatedAt'
    ],

    // Field type definitions
    fieldTypes: {
        placeType: 'string',
        accessibility: 'string',
        geography: 'string',
        inhabitants: 'array',
        guardians: 'array',
        items: 'array',
        relatedEvents: 'array',
        associatedEvents: 'array',
        connections: 'array',
        features: 'array',
        geographical: 'object',
        extendedContent: 'object',
        _migration: 'object',
        _metadata: 'object'
    },

    // Valid place types
    validPlaceTypes: [
        'sacred_site',
        'realm',
        'mountain',
        'river',
        'temple',
        'city',
        'underworld',
        'heaven',
        'island',
        'forest',
        'cave',
        'mythical'
    ],

    // Validation rules
    rules: {
        inhabitants: {
            itemType: 'string'
        },
        guardians: {
            itemType: 'string'
        },
        relatedEvents: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'significance',
        'inhabitants'
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

module.exports = placeSchema;
