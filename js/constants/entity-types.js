/**
 * Entity Type Constants
 * Single source of truth for entity type mappings across the application
 *
 * This file consolidates all entity type definitions to eliminate duplication
 * and ensure consistency across entity-display.js, entity-loader.js,
 * navigation.js, and submission-workflow.js
 */

/**
 * Entity type icon mappings
 * Used for visual representation of entity types
 */
export const ENTITY_ICONS = {
    deity: '⚡',
    hero: '🗡️',
    creature: '🐉',
    item: '⚔️',
    place: '🏛️',
    concept: '💭',
    magic: '🔮',
    theory: '🔬',
    mythology: '📜'
};

/**
 * Entity type display labels
 * Human-readable names for entity types
 */
export const ENTITY_LABELS = {
    deity: 'Deity',
    hero: 'Hero',
    creature: 'Creature',
    item: 'Artifact',
    place: 'Place',
    concept: 'Concept',
    magic: 'Magic System',
    theory: 'Theory',
    mythology: 'Mythology'
};

/**
 * Entity type to Firestore collection name mappings
 * Maps singular entity types to their plural collection names
 * Ensures consistency across all database queries
 */
export const ENTITY_COLLECTIONS = {
    deity: 'deities',
    hero: 'heroes',
    creature: 'creatures',
    item: 'items',
    place: 'places',
    concept: 'concepts',
    magic: 'magic',
    theory: 'user_theories',
    mythology: 'mythologies',
    // Additional mappings for legacy compatibility
    text: 'texts',
    event: 'events'
};

/**
 * Array of all valid entity types
 * Useful for validation and iteration
 */
export const ENTITY_TYPES = [
    'deity',
    'hero',
    'creature',
    'item',
    'place',
    'concept',
    'magic',
    'theory',
    'mythology'
];

/**
 * Helper function to get entity icon
 * @param {Object|string} entityOrType - Entity object or entity type string
 * @returns {string} Icon emoji
 */
export function getEntityIcon(entityOrType) {
    // If passed an entity object
    if (typeof entityOrType === 'object' && entityOrType !== null) {
        const entity = entityOrType;
        if (entity.visual?.icon || entity.icon) {
            return entity.visual?.icon || entity.icon;
        }
        return ENTITY_ICONS[entity.type] || '✨';
    }

    // If passed a type string
    return ENTITY_ICONS[entityOrType] || '✨';
}

/**
 * Helper function to get entity type label
 * @param {string} type - Entity type
 * @returns {string} Display label
 */
export function getEntityLabel(type) {
    return ENTITY_LABELS[type] || capitalize(type);
}

/**
 * Helper function to get collection name from entity type
 * @param {string} type - Entity type
 * @returns {string} Firestore collection name
 */
export function getCollectionName(type) {
    return ENTITY_COLLECTIONS[type] || type + 's';
}

/**
 * Helper function to capitalize a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate if a type is a valid entity type
 * @param {string} type - Type to validate
 * @returns {boolean} True if valid
 */
export function isValidEntityType(type) {
    return ENTITY_TYPES.includes(type);
}
