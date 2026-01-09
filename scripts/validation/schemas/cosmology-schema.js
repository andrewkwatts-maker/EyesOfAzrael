/**
 * Cosmology Schema - Validation schema for cosmology entities
 * Eyes of Azrael Validation System
 */

const cosmologySchema = {
    type: 'cosmology',

    // Required fields specific to cosmology
    required: ['id', 'name', 'type'],

    // Cosmology-specific optional fields
    optional: [
        'displayName',
        'description',
        'mythology',
        'mythologies',
        'filename',
        'cosmologicalType',
        'layers',
        'realms',
        'features',
        'inhabitants',
        'connections',
        'creationDetails',
        'worldStructure',
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
        layers: 'array',
        realms: 'array',
        features: 'array',
        inhabitants: 'array',
        connections: 'array',
        creationDetails: 'object',
        worldStructure: 'object'
    },

    // Valid cosmological types
    validCosmologicalTypes: [
        'creation_myth',
        'world_structure',
        'afterlife',
        'cycle',
        'apocalypse',
        'cosmic_order'
    ],

    // Validation rules
    rules: {
        layers: {
            itemType: ['string', 'object']
        },
        realms: {
            itemType: ['string', 'object']
        },
        inhabitants: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'cosmologicalType',
        'creationDetails'
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

module.exports = cosmologySchema;
