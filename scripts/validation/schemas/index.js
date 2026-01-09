/**
 * Schema Index - Exports all validation schemas
 * Eyes of Azrael Validation System
 */

const baseSchema = require('./base-schema');
const deitySchema = require('./deity-schema');
const creatureSchema = require('./creature-schema');
const heroSchema = require('./hero-schema');
const itemSchema = require('./item-schema');
const placeSchema = require('./place-schema');
const herbSchema = require('./herb-schema');
const ritualSchema = require('./ritual-schema');
const textSchema = require('./text-schema');
const symbolSchema = require('./symbol-schema');
const archetypeSchema = require('./archetype-schema');
const cosmologySchema = require('./cosmology-schema');
const mythologySchema = require('./mythology-schema');

// Map of asset types to their schemas
const schemas = {
    deity: deitySchema,
    deities: deitySchema,
    creature: creatureSchema,
    creatures: creatureSchema,
    hero: heroSchema,
    heroes: heroSchema,
    item: itemSchema,
    items: itemSchema,
    place: placeSchema,
    places: placeSchema,
    herb: herbSchema,
    herbs: herbSchema,
    ritual: ritualSchema,
    rituals: ritualSchema,
    text: textSchema,
    texts: textSchema,
    symbol: symbolSchema,
    symbols: symbolSchema,
    archetype: archetypeSchema,
    archetypes: archetypeSchema,
    cosmology: cosmologySchema,
    mythology: mythologySchema,
    mythologies: mythologySchema
};

/**
 * Get the schema for an asset type
 * @param {string} type - Asset type (e.g., 'deity', 'creature')
 * @returns {Object|null} Schema object or null if not found
 */
function getSchema(type) {
    if (!type) return null;
    return schemas[type.toLowerCase()] || null;
}

/**
 * Get all available schema types
 * @returns {string[]} Array of available schema type names
 */
function getAvailableTypes() {
    return [...new Set(Object.values(schemas).map(s => s.type))];
}

/**
 * Check if a schema exists for the given type
 * @param {string} type - Asset type to check
 * @returns {boolean} True if schema exists
 */
function hasSchema(type) {
    return type && type.toLowerCase() in schemas;
}

module.exports = {
    baseSchema,
    schemas,
    getSchema,
    getAvailableTypes,
    hasSchema,
    // Individual schema exports
    deitySchema,
    creatureSchema,
    heroSchema,
    itemSchema,
    placeSchema,
    herbSchema,
    ritualSchema,
    textSchema,
    symbolSchema,
    archetypeSchema,
    cosmologySchema,
    mythologySchema
};
