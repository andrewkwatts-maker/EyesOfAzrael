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

## Schema Structure

All schemas extend the base schema and add type-specific fields.

### Base Schema (Required for All Entities)

```json
{
  "id": "unique-lowercase-id",
  "name": "Display Name",
  "type": "deity|hero|creature|ritual|cosmology|...",
  "mythology": "greek|norse|egyptian|..."
}
```

### Type-Specific Schemas

Each entity type adds additional fields:

**Deity:** pantheon, rank, family, worship, attributes
**Hero:** parentage, quests, abilities, companions
**Creature:** classification, habitat, encounters
**Ritual:** steps, timing, offerings, participants
**Cosmology:** structure, cycles, key figures

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
Valid values: `deity`, `hero`, `creature`, `ritual`, `cosmology`, `text`, `symbol`, `herb`, `place`, `concept`, `event`

### Common Constraints
- `description`: minimum 10 characters
- `shortDescription`: 10-500 characters
- `name`: maximum 200 characters
- `tags`: lowercase alphanumeric with hyphens

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
  "$id": "https://eyesofazrael.com/schemas/newtype.json",
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
