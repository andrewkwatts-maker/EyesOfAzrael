/**
 * Creature Schema - Validation schema for creature entities
 * Eyes of Azrael Validation System
 */

const creatureSchema = {
    type: 'creature',

    // Required fields specific to creatures
    required: ['id', 'name', 'type'],

    // Creature-specific optional fields
    optional: [
        'displayName',
        'subtitle',
        'description',
        'mythology',
        'mythologies',
        'subtype',
        'characteristics',
        'abilities',
        'weaknesses',
        'habitat',
        'behavior',
        'classification',
        'physicalDescription',
        'relatedEntities',
        'archetype',
        'visual',
        'displayOptions',
        'primarySources',
        'sources',
        'biblicalReferences',
        'worship',
        'extendedContent',
        'attributes',
        'icon',
        'iconType',
        'metadata',
        'content',
        'tags',
        'searchTerms'
    ],

    // Field type definitions
    fieldTypes: {
        characteristics: 'array',
        abilities: 'array',
        weaknesses: 'array',
        habitat: 'string',
        behavior: 'string',
        classification: 'string',
        physicalDescription: 'string',
        archetype: 'object',
        visual: 'object',
        displayOptions: 'object',
        biblicalReferences: 'object',
        worship: 'object',
        extendedContent: 'object'
    },

    // Validation rules
    rules: {
        characteristics: {
            itemType: 'string'
        },
        abilities: {
            itemType: 'string'
        },
        weaknesses: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'characteristics',
        'abilities'
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

module.exports = creatureSchema;
