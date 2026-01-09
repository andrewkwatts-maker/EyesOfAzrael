/**
 * Text Schema - Validation schema for sacred text entities
 * Eyes of Azrael Validation System
 */

const textSchema = {
    type: 'text',

    // Required fields specific to texts
    required: ['id', 'name', 'type'],

    // Text-specific optional fields
    optional: [
        'displayName',
        'description',
        'shortDescription',
        'longDescription',
        'mythology',
        'mythologies',
        'filename',
        'author',
        'authorInfo',
        'dateWritten',
        'language',
        'originalLanguage',
        'textType',
        'genre',
        'chapters',
        'books',
        'verses',
        'themes',
        'keyPassages',
        'translations',
        'manuscripts',
        'significance',
        'influence',
        'relatedTexts',
        'relatedDeities',
        'primarySources',
        'relatedEntities',
        'content',
        'summary',
        'icon',
        'iconType',
        'metadata',
        'tags',
        'searchTerms'
    ],

    // Field type definitions
    fieldTypes: {
        chapters: 'array',
        books: 'array',
        verses: 'array',
        themes: 'array',
        keyPassages: 'array',
        translations: 'array',
        manuscripts: 'array',
        relatedTexts: 'array',
        relatedDeities: 'array',
        authorInfo: 'object',
        dateWritten: ['string', 'object']
    },

    // Valid text types
    validTextTypes: [
        'scripture',
        'epic',
        'hymn',
        'myth',
        'commentary',
        'philosophy',
        'prophecy',
        'ritual_text',
        'wisdom',
        'apocalyptic'
    ],

    // Validation rules
    rules: {
        themes: {
            itemType: 'string'
        },
        keyPassages: {
            itemType: ['string', 'object']
        }
    },

    // Recommended fields for completeness scoring
    recommended: [
        'description',
        'mythology',
        'themes',
        'significance'
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

module.exports = textSchema;
