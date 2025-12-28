# Schema Validation System Guide

## Overview

The Eyes of Azrael schema validation system ensures data quality and consistency across all entity uploads, downloads, and site templates. This system replaces the previous CI/CD pipeline with a comprehensive validation framework that works for both administrators and contributors.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Schema Overview](#schema-overview)
3. [Validating Entity Data](#validating-entity-data)
4. [Validating Templates](#validating-templates)
5. [Upload Workflow](#upload-workflow)
6. [Download Workflow](#download-workflow)
7. [NPM Scripts](#npm-scripts)
8. [Browser Integration](#browser-integration)
9. [Common Validation Errors](#common-validation-errors)
10. [Best Practices](#best-practices)

---

## Quick Start

### For Users (Browser Upload)

1. Navigate to the admin dashboard
2. Click "Upload Entities" button
3. Select your JSON file
4. Review validation results
5. Import valid entities

### For Developers (Command Line)

```bash
# Validate all entities
npm run validate:entities

# Validate with detailed report
npm run validate:entities:report

# Validate templates
npm run validate:templates

# Validate everything
npm run validate:all:report
```

---

## Schema Overview

### Entity Types

The system supports the following entity types:

- **deity** - Gods, goddesses, and divine beings
- **hero** - Legendary heroes and champions
- **creature** - Mythological creatures and monsters
- **ritual** - Religious ceremonies and practices
- **cosmology** - Cosmological concepts and structures
- **text** - Sacred texts and scriptures
- **symbol** - Sacred symbols and icons
- **herb** - Sacred plants and herbs
- **place** - Sacred locations and realms
- **concept** - Philosophical and religious concepts
- **event** - Mythological events and narratives

### Base Schema (All Entities)

All entities must include these required fields:

```json
{
  "id": "unique-lowercase-id",
  "name": "Display Name",
  "type": "deity",
  "mythology": "greek"
}
```

### Optional Common Fields

```json
{
  "alternateNames": ["Alternative Name 1", "Alternative Name 2"],
  "description": "Detailed description (minimum 10 characters)",
  "shortDescription": "Brief summary for cards (10-500 characters)",
  "symbolism": ["Symbolic meaning 1", "Symbolic meaning 2"],
  "domains": ["Domain 1", "Domain 2"],
  "archetypes": ["archetype-id-1", "archetype-id-2"],
  "relatedEntities": [
    {
      "id": "entity-id",
      "name": "Entity Name",
      "relationship": "Description of relationship"
    }
  ],
  "sources": [
    {
      "title": "Source Title",
      "author": "Author Name",
      "url": "https://example.com"
    }
  ],
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Image description",
      "caption": "Optional caption"
    }
  ],
  "tags": ["tag1", "tag2"],
  "metadata": {
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "verified": true,
    "featured": false
  }
}
```

---

## Validating Entity Data

### Using Browser Interface

The validation upload modal provides real-time validation feedback:

1. **Select File**: Choose a JSON file containing one or more entities
2. **Auto-Validation**: System validates immediately upon file selection
3. **Review Results**: See detailed errors and warnings for each entity
4. **Choose Import Mode**:
   - **Strict**: Only import if all entities are valid
   - **Warn**: Import with warnings displayed
   - **Off**: Skip validation (not recommended)

### Using Command Line

#### Validate All Entities

```bash
npm run validate:entities
```

Output:
```
✓ Loaded 6 schemas
Validating entities in: firebase-assets-enhanced

⚠ zeus (deity) - 2 warnings
✗ invalid-deity (deity) - 3 errors
  └─ name: must NOT have fewer than 1 characters
  └─ mythology: must be equal to one of the allowed values
  └─ description: is required

Summary
Total:   100
Valid:   98
Invalid: 2
Warnings: 5
```

#### Generate Validation Report

```bash
npm run validate:entities:report
```

Creates `validation-report.json`:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "totalEntities": 100,
  "validCount": 98,
  "invalidCount": 2,
  "results": [...]
}
```

---

## Validating Templates

### Template Types

- **deity-detail**: Deity detail pages
- **hero-detail**: Hero detail pages
- **creature-detail**: Creature detail pages
- **ritual-detail**: Ritual detail pages
- **list-page**: Entity list/grid pages
- **index-page**: Mythology index pages

### Required Template Elements

All detail pages must include:
- `.entity-header` - Header section
- `.entity-content` - Content section
- `[data-firebase-source]` - Firebase data source attribute

List pages must include:
- `.entity-grid` - Grid container
- `[data-firebase-collection]` - Collection attribute

### Validation Command

```bash
npm run validate:templates
```

Output:
```
✓ zeus.html (deity-detail)
⚠ thor.html (deity-detail) - 2 warnings
  └─ Recommended script missing: firebase-asset-loader.js
  └─ Template should include viewport meta tag
✗ invalid.html (unknown) - 1 error
  └─ Required element missing: .entity-header
```

---

## Upload Workflow

### Step-by-Step Upload Process

#### 1. Prepare Your Data

Create a JSON file with your entity data:

**Single Entity (deity-example.json):**
```json
{
  "id": "apollo",
  "name": "Apollo",
  "type": "deity",
  "mythology": "greek",
  "description": "Greek god of music, poetry, art, oracles, archery, plague, medicine, sun, light and knowledge.",
  "shortDescription": "Greek god of music, poetry, and the sun",
  "domains": ["music", "poetry", "sun", "prophecy"],
  "pantheon": "Olympian",
  "rank": "major",
  "sources": [
    {
      "title": "Theogony",
      "author": "Hesiod"
    }
  ]
}
```

**Multiple Entities (deities-bulk.json):**
```json
[
  {
    "id": "apollo",
    "name": "Apollo",
    "type": "deity",
    "mythology": "greek",
    "description": "...",
    "shortDescription": "..."
  },
  {
    "id": "artemis",
    "name": "Artemis",
    "type": "deity",
    "mythology": "greek",
    "description": "...",
    "shortDescription": "..."
  }
]
```

#### 2. Upload via Browser

1. Go to **Admin Dashboard** → **Upload Entities**
2. Click **"Select JSON File"**
3. Choose your prepared file
4. Wait for validation to complete

#### 3. Review Validation Results

The system displays:
- **Total entities** in file
- **Valid count** (ready to import)
- **Invalid count** (require fixes)
- **Detailed errors** for each invalid entity
- **Warnings** for valid but improvable entities

#### 4. Fix Errors (if any)

Common fixes:
- Add missing required fields (`id`, `name`, `type`, `mythology`)
- Ensure `id` is lowercase alphanumeric with hyphens/underscores only
- Ensure `description` is at least 10 characters
- Fix invalid `mythology` values (use valid options like `greek`, `norse`, etc.)
- Fix invalid `type` values (use `deity`, `hero`, `creature`, etc.)

#### 5. Import

Choose import mode:
- **Import All Valid** - Import all entities that passed validation
- **Import Valid Only** - Skip invalid entities, import rest

---

## Download Workflow

### Export with Validation

```javascript
// Export all deities with validation check
const validatedCrud = window.EyesOfAzrael.validatedCrud;

const entities = await validatedCrud.exportCollection('greek_deities', {
  validateBeforeExport: true,
  excludeInvalid: false // Include validation info
});

// Entities now include _validation metadata
console.log(entities[0]._validation);
// {
//   isValid: true,
//   errorCount: 0,
//   warningCount: 2
// }
```

### Download JSON

```javascript
// Export as JSON file
const json = JSON.stringify(entities, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = 'greek-deities.json';
a.click();
```

---

## NPM Scripts

### Entity Validation

| Script | Description |
|--------|-------------|
| `npm run validate:entities` | Validate all entity JSON files |
| `npm run validate:entities:report` | Generate detailed validation report |

### Template Validation

| Script | Description |
|--------|-------------|
| `npm run validate:templates` | Validate all HTML templates |
| `npm run validate:templates:report` | Generate template validation report |

### Combined Validation

| Script | Description |
|--------|-------------|
| `npm run validate:all` | Validate both entities and templates |
| `npm run validate:all:report` | Generate complete validation report |

### Custom Paths

```bash
# Validate specific directory
node scripts/validate-entities.js path/to/entities

# Validate specific templates
node scripts/validate-templates.js path/to/templates

# Custom report location
node scripts/validate-entities.js firebase-assets-enhanced --report custom-report.json
```

---

## Browser Integration

### Initialize Validator

```javascript
// Initialize schema validator
const validator = new SchemaValidator();
await validator.initialize();

// Initialize validated CRUD manager
const validatedCrud = new ValidatedCRUDManager(
  window.EyesOfAzrael.crudManager,
  validator
);

// Set validation mode
validatedCrud.setValidationMode('strict'); // 'strict' | 'warn' | 'off'

// Make available globally
window.EyesOfAzrael.validatedCrud = validatedCrud;
```

### Validate Before Creating Entity

```javascript
// Create entity with validation
try {
  const result = await validatedCrud.create('greek_deities', {
    id: 'apollo',
    name: 'Apollo',
    type: 'deity',
    mythology: 'greek',
    description: 'Greek god of music, poetry, and the sun',
    shortDescription: 'Greek god of music and the sun'
  });

  console.log('Entity created successfully');
} catch (error) {
  if (error.validation) {
    console.error('Validation failed:', error.validation.errors);
  }
}
```

### Validate Existing Entity

```javascript
// Check if existing entity is valid
const validation = await validatedCrud.validateEntity('greek_deities', 'zeus');

console.log('Is valid:', validation.isValid);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);
```

### Validate Collection

```javascript
// Validate all entities in collection
const results = await validatedCrud.validateCollection('greek_deities', {
  onProgress: (progress) => {
    console.log(`Validated ${progress.current}/${progress.total}`);
  }
});

console.log('Valid:', results.validCount);
console.log('Invalid:', results.invalidCount);
```

---

## Common Validation Errors

### Missing Required Fields

**Error:**
```
Required field 'name' is missing
```

**Fix:**
```json
{
  "id": "apollo",
  "name": "Apollo",  // Add this
  "type": "deity",
  "mythology": "greek"
}
```

### Invalid ID Format

**Error:**
```
Field 'id' does not match required pattern: ^[a-z0-9_-]+$
```

**Fix:**
```json
{
  "id": "apollo-sun-god",  // Lowercase, hyphens OK
  // NOT: "Apollo Sun God" or "apollo_SUN_god"
}
```

### Invalid Mythology Value

**Error:**
```
Field 'mythology' must be one of: greek, norse, egyptian, hindu, ...
```

**Fix:**
```json
{
  "mythology": "greek"  // Use exact value from schema
  // NOT: "Greek" or "Greece"
}
```

### Description Too Short

**Error:**
```
Field 'description' must be at least 10 characters
```

**Fix:**
```json
{
  "description": "Greek god of music, poetry, art, oracles, and medicine"
  // NOT: "Sun god"
}
```

### Invalid Related Entity

**Error:**
```
relatedEntities[0]: Related entity should have both id and name
```

**Fix:**
```json
{
  "relatedEntities": [
    {
      "id": "artemis",
      "name": "Artemis",
      "relationship": "Twin sister"
    }
  ]
}
```

---

## Best Practices

### 1. Always Include Sources

Add credible sources to improve data quality:

```json
{
  "sources": [
    {
      "title": "Theogony",
      "author": "Hesiod",
      "date": "circa 700 BCE"
    },
    {
      "title": "Homeric Hymns",
      "url": "https://example.com/homeric-hymns"
    }
  ]
}
```

### 2. Use Descriptive IDs

Good IDs are:
- Lowercase
- Descriptive
- Unique
- Use hyphens for spaces

```json
// Good
"id": "apollo-sun-god"
"id": "odin-allfather"
"id": "ganesha-remover-of-obstacles"

// Bad
"id": "Apollo"
"id": "deity_1"
"id": "god"
```

### 3. Provide Both Descriptions

Always include both `description` (detailed) and `shortDescription` (summary):

```json
{
  "description": "Apollo is one of the Olympian deities in classical Greek and Roman religion. As the god of music, poetry, art, oracles, archery, plague, medicine, sun, light and knowledge, he is one of the most important and complex of the Greek gods.",
  "shortDescription": "Greek god of music, poetry, art, and the sun"
}
```

### 4. Link Related Entities

Build a rich knowledge graph by linking related entities:

```json
{
  "relatedEntities": [
    {
      "id": "artemis",
      "name": "Artemis",
      "type": "deity",
      "relationship": "Twin sister"
    },
    {
      "id": "leto",
      "name": "Leto",
      "type": "deity",
      "relationship": "Mother"
    },
    {
      "id": "zeus",
      "name": "Zeus",
      "type": "deity",
      "relationship": "Father"
    }
  ]
}
```

### 5. Add Meaningful Tags

Use tags for better searchability:

```json
{
  "tags": [
    "olympian",
    "music",
    "prophecy",
    "healing",
    "sun",
    "archery"
  ]
}
```

### 6. Set Metadata

Include creation and update timestamps:

```json
{
  "metadata": {
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-15T10:30:00Z",
    "author": "contributor-name",
    "verified": true,
    "featured": false
  }
}
```

### 7. Validate Before Submitting

Always run validation locally before uploading:

```bash
# Validate your JSON file
node scripts/validate-entities.js path/to/your-entities.json --report
```

### 8. Use Validation Mode Appropriately

- **Strict**: For production imports (reject invalid data)
- **Warn**: For drafts and development (accept with warnings)
- **Off**: Only for testing (not recommended)

---

## Troubleshooting

### Schema Not Loading

**Problem:** "Schema not found for type: deity"

**Solution:**
1. Ensure schemas are in `/schemas/` directory
2. Check file naming: `deity.schema.json`
3. Verify schema has correct `$id` field
4. Reload validator: `await validator.initialize()`

### Validation Always Fails

**Problem:** All entities marked invalid

**Solution:**
1. Check validation mode: `validatedCrud.setValidationMode('warn')`
2. Review error messages carefully
3. Validate JSON syntax with [JSONLint](https://jsonlint.com)
4. Compare with working examples in documentation

### Template Validation Fails

**Problem:** Template has all required elements but still fails

**Solution:**
1. Check element selectors match exactly
2. Ensure data attributes use correct format
3. Validate HTML with [W3C Validator](https://validator.w3.org)
4. Check console for specific error messages

---

## Support

For questions or issues:

1. Check [Common Validation Errors](#common-validation-errors)
2. Review [Best Practices](#best-practices)
3. Run validation with `--report` flag for detailed output
4. Open an issue on GitHub with validation report attached

---

## Schema Reference

For complete schema definitions, see:

- [schemas/entity-base.schema.json](schemas/entity-base.schema.json) - Base schema for all entities
- [schemas/deity.schema.json](schemas/deity.schema.json) - Deity-specific schema
- [schemas/hero.schema.json](schemas/hero.schema.json) - Hero-specific schema
- [schemas/creature.schema.json](schemas/creature.schema.json) - Creature-specific schema
- [schemas/ritual.schema.json](schemas/ritual.schema.json) - Ritual-specific schema
- [schemas/cosmology.schema.json](schemas/cosmology.schema.json) - Cosmology-specific schema
