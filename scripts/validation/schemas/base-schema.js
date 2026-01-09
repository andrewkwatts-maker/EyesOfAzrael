/**
 * Base Schema - Common fields for all asset types
 * Eyes of Azrael Validation System
 */

const baseSchema = {
    // Required fields for all assets
    required: ['id', 'name', 'type'],

    // Common optional fields
    optional: [
        'displayName',
        'description',
        'mythology',
        'mythologies',
        'icon',
        'iconType',
        'metadata',
        'primarySources',
        'relatedEntities',
        'tags',
        'searchTerms',
        'createdAt',
        'updatedAt',
        'updated_at',
        '_modified',
        '_created',
        '_enhanced',
        '_uploadedAt',
        'enhancedBy',
        'visibility',
        'status'
    ],

    // Field type definitions
    fieldTypes: {
        id: 'string',
        name: 'string',
        type: 'string',
        displayName: 'string',
        description: 'string',
        mythology: 'string',
        mythologies: 'array',
        icon: 'string',
        iconType: 'string',
        metadata: 'object',
        primarySources: 'array',
        relatedEntities: ['array', 'object'],
        tags: 'array',
        searchTerms: 'array',
        createdAt: ['string', 'object'],
        updatedAt: ['string', 'object'],
        updated_at: 'string',
        _modified: 'string',
        _created: 'string',
        _enhanced: 'boolean',
        _uploadedAt: 'string',
        enhancedBy: 'string',
        visibility: 'string',
        status: 'string'
    },

    // Valid asset types
    validTypes: [
        'deity',
        'creature',
        'hero',
        'item',
        'place',
        'herb',
        'ritual',
        'text',
        'symbol',
        'archetype',
        'cosmology',
        'mythology',
        'concept',
        'magic'
    ],

    // Validation rules
    rules: {
        id: {
            minLength: 1,
            maxLength: 200,
            pattern: /^[a-z0-9_-]+$/i
        },
        name: {
            minLength: 1,
            maxLength: 500
        },
        description: {
            maxLength: 50000
        }
    }
};

module.exports = baseSchema;
