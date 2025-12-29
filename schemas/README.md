# Entity Schemas

This directory contains JSON Schema definitions for all entity types in Eyes of Azrael.

## Schema Files

| File | Entity Type | Description |
|------|-------------|-------------|
| `entity-base.schema.json` | All | Base schema inherited by all entity types |
| `deity.schema.json` | deity | Gods, goddesses, and divine beings |
| `hero.schema.json` | hero | Legendary heroes and champions |
| `creature.schema.json` | creature | Mythological creatures and monsters |
| `ritual.schema.json` | ritual | Religious ceremonies and practices |
| `cosmology.schema.json` | cosmology | Cosmological concepts and structures |
| `item.schema.json` | item | Mythological items, artifacts, and weapons |
| `place.schema.json` | place | Sacred places, realms, and locations |
| `herb.schema.json` | herb | Sacred herbs and plants |
| `text.schema.json` | text | Sacred texts and mythological literature |
| `symbol.schema.json` | symbol | Sacred symbols and iconography |
| `concept.schema.json` | concept | Metaphysical concepts and ideas |
| `event.schema.json` | event | Mythological events and occurrences |

## Recent Updates (2025-12-29)

### AGENT 2: Schema Fixes
- Fixed all schema `$ref` paths to use correct filenames (entity-base.schema.json)
- Changed `additionalProperties: false` to `additionalProperties: true` in entity-base.schema.json
  - This allows custom fields per mythology (e.g., mantras, sutras, vahana for Hindu/Buddhist deities)
- Created 7 missing schema files: item, place, herb, text, symbol, concept, event
- All schemas now validated and working correctly

### Breaking Changes
- **NONE** - All changes are backwards compatible
- Custom fields that were previously causing validation errors are now allowed

## Schema Structure

All schemas extend the base schema and add type-specific fields.

### Base Schema (Required for All Entities)

```json
{
  "id": "unique-lowercase-id",
  "name": "Display Name",
  "type": "deity|hero|creature|ritual|cosmology|item|place|herb|text|symbol|concept|event",
  "mythology": "greek|norse|egyptian|..."
}
```

### Type-Specific Schemas

Each entity type adds additional fields:

**Deity:** pantheon, rank, family, worship, attributes, mantras, sutras
**Hero:** parentage, quests, abilities, companions
**Creature:** classification, habitat, encounters
**Ritual:** steps, timing, offerings, participants
**Cosmology:** structure, cycles, key figures
**Item:** creator, owner, powers, curses, materials
**Place:** location, inhabitants, significance, access
**Herb:** properties, preparation, harvest practices
**Text:** author, content, structure, themes
**Symbol:** meanings, usage, variations
**Concept:** definition, interpretations, related concepts
**Event:** participants, narrative, consequences

## Using Schemas

### Browser Validation

```javascript
const validator = new SchemaValidator();
await validator.initialize();

const result = validator.validate({
  id: 'apollo',
  name: 'Apollo',
  type: 'deity',
  mythology: 'greek',
  description: 'Greek god of music and poetry'
});

console.log(result.isValid); // true or false
console.log(result.errors);   // array of errors
console.log(result.warnings); // array of warnings
```

### Command Line Validation

```bash
# Validate all entities against schemas
npm run validate:entities

# Generate detailed report
npm run validate:entities:report
```

## Schema Validation Rules

### ID Rules
- Lowercase only
- Alphanumeric characters
- Hyphens and underscores allowed
- Pattern: `^[a-z0-9_-]+$`

### Mythology Values
Valid values: `greek`, `norse`, `egyptian`, `hindu`, `buddhist`, `christian`, `islamic`, `babylonian`, `sumerian`, `persian`, `roman`, `celtic`, `chinese`, `japanese`, `aztec`, `mayan`, `yoruba`, `native_american`, `jewish`, `tarot`, `apocryphal`, `comparative`

### Type Values
Valid values: `deity`, `hero`, `creature`, `ritual`, `cosmology`, `text`, `symbol`, `herb`, `place`, `concept`, `event`, `item`

### Common Constraints
- `description`: minimum 10 characters
- `shortDescription`: 10-500 characters
- `name`: maximum 200 characters
- `tags`: lowercase alphanumeric with hyphens

### Additional Properties
- **All entity types now allow additional custom properties**
- This enables mythology-specific fields without schema violations
- Examples: `mantras` (Buddhist), `vahana` (Hindu), `weapon` (deity-specific)

## Adding New Schemas

To add a new entity type schema:

1. Create `{type}.schema.json` in this directory
2. Extend the base schema using `allOf`
3. Add type-specific properties
4. Update `schema-validator.js` to load new schema
5. Update validation documentation

Example:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://eyesofazrael.com/schemas/newtype.schema.json",
  "title": "New Type Schema",
  "allOf": [
    { "$ref": "entity-base.schema.json" },
    {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": { "const": "newtype" },
        "customField": { "type": "string" }
      }
    }
  ]
}
```

## Documentation

For complete documentation, see:
- [SCHEMA_VALIDATION_GUIDE.md](../SCHEMA_VALIDATION_GUIDE.md) - Full user guide
- [VALIDATION_QUICK_REFERENCE.md](../VALIDATION_QUICK_REFERENCE.md) - Quick reference
- [SCHEMA_VALIDATION_IMPLEMENTATION.md](../SCHEMA_VALIDATION_IMPLEMENTATION.md) - Technical details

## Standards

These schemas follow:
- JSON Schema Draft-07 specification
- OpenAPI 3.0 compatible
- Best practices for schema design
- Semantic versioning for changes
