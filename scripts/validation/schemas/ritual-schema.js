/**
 * Ritual Schema - Validation schema for ritual entities
 * Eyes of Azrael Validation System
 */

const ritualSchema = {
    type: 'ritual',

    // Required fields specific to rituals
    required: ['id', 'name', 'type'],

    // Ritual-specific optional fields
    optional: [
        'displayName',
        'description',
        'mythology',
        'mythologies',
        'filename',
        'purpose',
        'timing',
        'procedure',
        'steps',
        'participants',
        'materials',
        'tools',
        'prayers',
        'prohibitions',
        'symbolism',
        'historicalContext',
        'modernPractice',
        'relatedDeities',
        'relatedConcepts',
        'primarySources',
        'relatedEntities',
        'gridDisplay',
        'listDisplay',
        'tableDisplay',
        'panelDisplay',
        'corpusSearch',
        'importance',
        'popularity',
        'sortName',
        'entityType',
        '_version',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms'
    ],

    // Field type definitions
    fieldTypes: {
        steps: 'array',
        participants: 'array',
        materials: 'array',
        tools: 'array',
        prayers: 'array',
        prohibitions: 'array',
        relatedDeities: 'array',
        relatedConcepts: 'array',
        symbolism: 'object',
        historicalContext: 'object',
        gridDisplay: 'object',
        listDisplay: 'object',
        tableDisplay: 'object',
        panelDisplay: 'object',
        corpusSearch: 'object'
    },

    // Valid purpose types
    validPurposes: [
        'celebration',
        'purification',
        'initiation',
        'protection',
        'healing',
        'divination',
        'worship',
        'sacrifice',
        'transition',
        'seasonal'
    ],

    // Validation rules
    rules: {
        steps: {
            itemType: 'object',
            itemRequiredFields: ['action']
        },
        participants: {
            itemType: 'string'
        },
        materials: {
            itemType: 'string'
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'purpose',
        'steps',
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

module.exports = ritualSchema;
