# Entity Schema Guide v2.0

Complete guide to the Eyes of Azrael unified entity system. This document describes the schema, field definitions, validation rules, and best practices for creating and managing entities.

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Types](#entity-types)
3. [Required vs Optional Fields](#required-vs-optional-fields)
4. [Field Reference](#field-reference)
5. [Complete Examples](#complete-examples)
6. [Best Practices](#best-practices)
7. [Validation](#validation)
8. [Contributing](#contributing)

---

## Overview

The entity system is the core data structure for representing mythological elements across 15+ traditions. Each entity is stored as a JSON file following the v2.0 schema with comprehensive metadata including linguistic, geographical, temporal, and metaphysical properties.

### Key Features

- **Universal Structure**: Same schema for all entity types
- **Rich Metadata**: Linguistic, geographical, temporal, cultural data
- **Cross-References**: Linked relationships between entities
- **Metadata v2.0**: Enhanced with geographical coordinates, temporal attestation, etymology
- **Multi-Mythology Support**: Entities can belong to multiple traditions

### Entity Lifecycle

```
1. Create entity JSON (manually or via scaffold tool)
2. Validate with entity-validator.js
3. Add cross-references to related entities
4. Generate indices with build scripts
5. Display via entity card components
```

---

## Entity Types

### Supported Types

| Type | Description | Example |
|------|-------------|---------|
| `deity` | Gods, goddesses, divine beings | Zeus, Odin, Brahma |
| `item` | Sacred objects, artifacts, weapons | Mjolnir, Ark of the Covenant |
| `place` | Mythical locations, sacred sites | Mount Olympus, Valhalla |
| `concept` | Abstract spiritual concepts | Dharma, Maat, Karma |
| `magic` | Rituals, spells, magical practices | Seidr, Vedic rituals |
| `creature` | Mythical beings, monsters | Dragon, Phoenix, Garuda |
| `hero` | Legendary heroes, demigods | Hercules, Gilgamesh |
| `archetype` | Universal patterns | The Trickster, The Creator |

---

## Required vs Optional Fields

### Required Fields (All Types)

```json
{
  "id": "unique-kebab-case-id",
  "type": "deity|item|place|concept|magic|creature|hero|archetype",
  "name": "Display Name",
  "mythologies": ["primary-mythology", "optional-secondary"]
}
```

### Strongly Recommended

- `shortDescription` - One-sentence summary (max 200 chars)
- `fullDescription` - Complete description (markdown supported)
- `icon` - Unicode emoji or symbol
- `colors.primary` - Primary hex color (#RRGGBB)
- `sources` - Ancient text references

### Optional but Valuable

- `linguistic` - Original name, etymology, pronunciation
- `geographical` - Location data with coordinates
- `temporal` - Historical dating, first attestation
- `metaphysicalProperties` - Elements, sefirot, chakras, planets
- `archetypes` - Jungian archetype mappings
- `relatedEntities` - Cross-references to other entities

---

## Field Reference

### Basic Metadata

#### `id` (string, required)
Unique identifier in kebab-case format.

**Rules**:
- Lowercase letters, numbers, hyphens only
- Pattern: `^[a-z0-9-]+$`
- Must be unique across all entities of the same type

**Examples**:
```json
"id": "zeus"
"id": "mount-olympus"
"id": "mjolnir"
"id": "ark-of-covenant"
```

#### `type` (string, required)
Entity category.

**Valid Values**:
`"deity"`, `"item"`, `"place"`, `"concept"`, `"magic"`, `"creature"`, `"hero"`, `"archetype"`

#### `name` (string, required)
Display name in English.

**Examples**:
```json
"name": "Zeus"
"name": "Mjölnir"
"name": "Brahma"
```

#### `icon` (string, optional)
Unicode emoji representing the entity.

**Examples**:
```json
"icon": "⚡"  // Zeus (lightning)
"icon": "🔨"  // Mjolnir (hammer)
"icon": "🪷"  // Brahma (lotus)
```

#### `mythologies` (array, required)
List of mythological traditions this entity appears in.

**Format**: Array of lowercase tradition names, minimum 1 item.

**Examples**:
```json
"mythologies": ["greek"]
"mythologies": ["hindu", "buddhist"]  // Cross-mythology entity
"mythologies": ["norse", "germanic"]
```

**Valid Mythologies**:
`greek`, `norse`, `egyptian`, `hindu`, `buddhist`, `jewish`, `christian`, `islamic`, `japanese`, `chinese`, `celtic`, `roman`, `mesopotamian`, `persian`, `zoroastrian`, `jain`, `bon`, `universal`

#### `primaryMythology` (string, optional)
The main tradition where this entity originates.

```json
"primaryMythology": "greek"
```

#### `shortDescription` (string, recommended)
One-sentence summary, max 200 characters.

**Guidelines**:
- Concise and informative
- Captures essence of the entity
- No markdown formatting

**Example**:
```json
"shortDescription": "King of the Greek gods, ruler of Mount Olympus, god of sky and thunder"
```

#### `fullDescription` or `longDescription` (string, recommended)
Complete description with context, mythology, and significance.

**Features**:
- Markdown supported (`**bold**`, `*italic*`)
- Multiple paragraphs welcome
- Include mythological context
- Explain cultural significance

**Example**:
```json
"fullDescription": "Zeus (Ancient Greek: Ζεύς) is the sky and thunder god in ancient Greek religion, who rules as king of the gods of Mount Olympus. His name is cognate with the first element of his Roman equivalent Jupiter. **Mythology**: Zeus is the child of Cronus and Rhea, the youngest of his siblings. In most traditions, he is married to Hera, by whom he is usually said to have fathered Ares, Hebe, and Hephaestus..."
```

#### `tags` (array, optional)
Searchable keywords for discovery.

```json
"tags": ["zeus", "jupiter", "sky-god", "thunder", "olympian", "king-of-gods"]
```

#### `colors` (object, optional)
Color scheme for visual display.

**Format**:
```json
"colors": {
  "primary": "#4A90E2",      // Main color (required if colors provided)
  "secondary": "#50C878",    // Accent color (optional)
  "accent": "#FFD700",       // Highlight color (optional)
  "primaryRgb": "74, 144, 226"  // RGB for transparency (optional)
}
```

**Validation**: Hex colors must match pattern `^#[0-9A-Fa-f]{6}$`

---

### Linguistic Data

Provides original language information, etymology, and pronunciation.

```json
"linguistic": {
  "originalName": "Ζεύς",
  "originalScript": "greek",
  "transliteration": "Zeus",
  "pronunciation": "/zjuːs/",
  "alternativeNames": [
    {
      "name": "Dias",
      "language": "Greek",
      "context": "Vocative form",
      "meaning": "Bright sky"
    }
  ],
  "etymology": {
    "rootLanguage": "Proto-Indo-European",
    "meaning": "Sky father, daylight",
    "derivation": "From *dyew- (to shine, sky)"
  },
  "languageCode": "grc"
}
```

**Valid Scripts**:
`latin`, `greek`, `hebrew`, `arabic`, `devanagari`, `chinese`, `japanese`, `runic`, `hieroglyphic`, `cuneiform`

**Language Codes**: ISO 639-1 or ISO 639-3 (e.g., `grc` for Ancient Greek, `sa` for Sanskrit)

---

### Geographical Data

Location information with coordinates and regional context.

```json
"geographical": {
  "primaryLocation": {
    "name": "Mount Olympus",
    "coordinates": {
      "latitude": 40.0855,
      "longitude": 22.3583,
      "elevation": 2917,
      "accuracy": "exact"
    },
    "modernName": "Όλυμπος",
    "ancientName": "Ὄλυμπος",
    "type": "mountain",
    "description": "Highest mountain in Greece",
    "significance": "Mythical home of the twelve Olympian gods"
  },
  "associatedLocations": [
    {
      "name": "Dodona",
      "coordinates": { "latitude": 39.55, "longitude": 20.78 },
      "type": "temple",
      "significance": "Oracle site of Zeus"
    }
  ],
  "region": "Mediterranean",
  "culturalArea": "Ancient Greece",
  "modernCountries": ["Greece"]
}
```

**Coordinate Validation**:
- `latitude`: -90 to 90
- `longitude`: -180 to 180
- `elevation`: meters above sea level
- `accuracy`: `"exact"`, `"approximate"`, `"general_area"`, `"speculative"`

---

### Temporal Data

Historical and mythological dating information.

```json
"temporal": {
  "mythologicalDate": {
    "display": "Primordial age, before mortal creation"
  },
  "historicalDate": {
    "start": { "year": -800, "circa": true, "display": "c. 800 BCE" },
    "end": { "year": 400, "circa": true, "display": "c. 400 CE" },
    "display": "c. 800 BCE - 400 CE"
  },
  "firstAttestation": {
    "date": { "year": -700, "circa": true, "display": "c. 700 BCE" },
    "source": "Homer's Iliad",
    "type": "literary",
    "confidence": "probable"
  },
  "culturalPeriod": "Classical Period",
  "literaryReferences": [
    {
      "work": "Iliad",
      "author": "Homer",
      "date": { "year": -700, "circa": true },
      "significance": "Major role as king of gods"
    }
  ]
}
```

**Date Format**:
- Negative years = BCE
- Use `circa: true` for approximate dates
- Provide `display` string for human readability

**Attestation Types**:
`literary`, `archaeological`, `epigraphic`, `iconographic`, `oral_tradition`

---

### Metaphysical Properties

Esoteric associations and correspondences.

```json
"metaphysicalProperties": {
  "primaryElement": "air",
  "secondaryElements": ["fire"],
  "planets": ["Jupiter"],
  "zodiac": ["Sagittarius", "Pisces"],
  "sefirot": ["keter", "chokmah"],
  "world": "atziluth",
  "chakras": ["ajna", "sahasrara"],
  "yinYang": "yang",
  "polarity": "positive",
  "numerology": {
    "sacredNumber": 3,
    "significance": "Triad of heaven, earth, underworld"
  }
}
```

**Valid Elements**: `fire`, `water`, `earth`, `air`, `aether`, `wood`, `metal`

**Valid Planets**: `Sun`, `Moon`, `Mercury`, `Venus`, `Mars`, `Jupiter`, `Saturn`

**Valid Sefirot**: `keter`, `chokmah`, `binah`, `chesed`, `gevurah`, `tiferet`, `netzach`, `hod`, `yesod`, `malkhut`, `daat`

**Valid Chakras**: `muladhara`, `svadhisthana`, `manipura`, `anahata`, `vishuddha`, `ajna`, `sahasrara`

---

### Related Entities

Cross-references to other entities.

```json
"relatedEntities": {
  "deities": [
    {
      "id": "hera",
      "name": "Hera",
      "type": "deity",
      "mythology": "greek",
      "icon": "👰",
      "url": "/mythos/greek/deities/hera.html",
      "relationship": "consort"
    }
  ],
  "items": [
    {
      "id": "thunderbolt",
      "name": "Thunderbolt",
      "type": "item",
      "url": "/mythos/greek/items/thunderbolt.html",
      "relationship": "weapon"
    }
  ],
  "places": [
    {
      "id": "mount-olympus",
      "name": "Mount Olympus",
      "type": "place",
      "url": "/mythos/greek/places/mount-olympus.html",
      "relationship": "residence"
    }
  ]
}
```

**Relationship Categories**:
- `deities` - Other gods/goddesses
- `items` - Associated objects
- `places` - Associated locations
- `concepts` - Related abstract ideas
- `creatures` - Associated beings
- `heroes` - Related legendary figures
- `magic` - Associated practices

---

### Sources

Ancient text references and citations.

```json
"sources": [
  {
    "title": "Iliad",
    "author": "Homer",
    "date": { "year": -700, "circa": true, "display": "c. 700 BCE" },
    "type": "primary",
    "relevance": "comprehensive",
    "passage": "Various books",
    "corpusUrl": "/mythos/greek/corpus-search.html?term=iliad+zeus",
    "citation": "Homer. Iliad. c. 700 BCE."
  },
  {
    "title": "Theogony",
    "author": "Hesiod",
    "type": "primary",
    "relevance": "comprehensive"
  }
]
```

**Source Types**: `primary`, `secondary`, `archaeological`

**Relevance**: `comprehensive`, `significant`, `minor`

---

### Archetypes

Jungian archetype mappings with scores.

```json
"archetypes": [
  {
    "id": "ruler",
    "category": "ruler",
    "name": "The Ruler",
    "score": 95,
    "strength": "very-strong",
    "role": "sovereign",
    "examples": [
      "King of gods and men",
      "Supreme authority over Olympus",
      "Dispenser of justice"
    ],
    "context": "Zeus embodies the Ruler archetype as the sovereign king of gods...",
    "url": "/shared/archetypes/ruler.html"
  }
]
```

**Score Range**: 0-100 (percentage strength)

**Strength Levels**: `weak`, `moderate`, `strong`, `very-strong`

---

## Complete Examples

### Example: Deity (Zeus)

```json
{
  "id": "zeus",
  "type": "deity",
  "name": "Zeus",
  "icon": "⚡",
  "slug": "zeus",
  "mythologies": ["greek", "roman"],
  "primaryMythology": "greek",
  "shortDescription": "King of the Greek gods, ruler of Mount Olympus, god of sky and thunder",
  "fullDescription": "Zeus (Ancient Greek: Ζεύς) is the sky and thunder god in ancient Greek religion...",
  "tags": ["zeus", "jupiter", "sky-god", "thunder", "olympian", "king-of-gods"],
  "colors": {
    "primary": "#4A90E2",
    "secondary": "#FFD700"
  },
  "linguistic": {
    "originalName": "Ζεύς",
    "originalScript": "greek",
    "transliteration": "Zeus",
    "pronunciation": "/zjuːs/",
    "languageCode": "grc"
  },
  "metaphysicalProperties": {
    "primaryElement": "air",
    "planets": ["Jupiter"]
  },
  "relatedEntities": {
    "deities": [
      { "id": "hera", "name": "Hera", "type": "deity" }
    ],
    "places": [
      { "id": "mount-olympus", "name": "Mount Olympus", "type": "place" }
    ]
  },
  "sources": [
    {
      "title": "Iliad",
      "author": "Homer",
      "type": "primary"
    }
  ]
}
```

### Example: Item (Mjolnir)

```json
{
  "id": "mjolnir",
  "type": "item",
  "name": "Mjölnir",
  "icon": "🔨",
  "mythologies": ["norse"],
  "primaryMythology": "norse",
  "shortDescription": "Thor's mighty hammer, forged by dwarven brothers, symbol of protection and power",
  "category": "divine-weapon",
  "properties": [
    {
      "name": "Return",
      "value": "Always returns to Thor's hand"
    },
    {
      "name": "Lightning",
      "value": "Channels thunder and lightning"
    }
  ],
  "relatedEntities": {
    "deities": [
      { "id": "thor", "name": "Thor", "type": "deity", "relationship": "wielder" }
    ]
  }
}
```

---

## Best Practices

### Naming Conventions

1. **IDs**: Always use kebab-case: `mount-olympus`, `ark-of-covenant`
2. **Names**: Use proper capitalization: `Zeus`, `Mjölnir` (preserve diacritics)
3. **Tags**: Lowercase, hyphenated: `sky-god`, `thunder-deity`

### Color Selection

Choose colors that represent the entity's essence:
- **Fire deities**: Reds, oranges (#FF4500, #FFA500)
- **Water deities**: Blues, teals (#4A90E2, #00CED1)
- **Earth deities**: Greens, browns (#2E8B57, #8B4513)
- **Sky deities**: Light blues, whites (#87CEEB, #E0F6FF)

### Description Writing

**Short Description**:
- One sentence maximum
- Start with entity type: "God of...", "Sacred mountain...", "Ancient concept..."
- Highlight most important attributes

**Full Description**:
- Start with name and original language
- Provide mythological context
- Explain significance
- Include interesting details
- Cite major myths/stories
- Discuss cultural impact

### Source Citations

Always include:
1. Primary ancient texts
2. Date of composition (if known)
3. Link to corpus search when available

Format:
```json
{
  "title": "Text Name",
  "author": "Author Name",
  "date": { "year": -700, "circa": true },
  "type": "primary",
  "corpusUrl": "/mythos/{mythology}/corpus-search.html?term={search}"
}
```

### Cross-Referencing

- Always include `id`, `name`, and `type`
- Add `url` for direct linking
- Specify `relationship` when meaningful
- Use bidirectional references (if A references B, B should reference A)

---

## Validation

### Running Validation

```bash
# Validate all entities
node scripts/validate-all-entities.js

# Verbose output
node scripts/validate-all-entities.js --verbose

# Check cross-references
node scripts/check-cross-references.js

# Generate statistics
node scripts/generate-entity-stats.js
```

### Common Validation Errors

1. **Missing required fields**
   ```
   ERROR: Missing required field: mythologies
   FIX: Add "mythologies": ["tradition-name"]
   ```

2. **Invalid ID format**
   ```
   ERROR: Invalid ID format: must be kebab-case
   FIX: Change "Mount Olympus" to "mount-olympus"
   ```

3. **Invalid color format**
   ```
   ERROR: Invalid hex color format: #FFF
   FIX: Use 6-digit hex: #FFFFFF
   ```

4. **Broken cross-reference**
   ```
   ERROR: Referenced entity not found: deity:unknown-god
   FIX: Check entity ID and type, ensure entity exists
   ```

5. **Invalid coordinates**
   ```
   ERROR: Invalid latitude: 95 (must be between -90 and 90)
   FIX: Verify coordinate values
   ```

---

## Contributing

### Adding a New Entity

1. **Use the scaffolding tool**:
   ```bash
   node scripts/scaffold-entity.js --type deity --id new-god --mythology greek
   ```

2. **Fill in the template**:
   - Add required fields
   - Add recommended fields (shortDescription, fullDescription, colors)
   - Add sources from ancient texts
   - Add cross-references

3. **Validate**:
   ```bash
   node scripts/validate-all-entities.js
   ```

4. **Test display**:
   - Open entity browser: `/entities/index.html`
   - Search for your entity
   - Verify display

5. **Rebuild indices**:
   ```bash
   node scripts/build-indices.js
   ```

### Updating Existing Entities

1. **Load the entity file**: `data/entities/{type}/{id}.json`
2. **Make changes**
3. **Validate**: `node scripts/validate-all-entities.js`
4. **Check cross-references**: `node scripts/check-cross-references.js`

### Quality Checklist

- [ ] All required fields present
- [ ] Short description under 200 characters
- [ ] Full description includes context and significance
- [ ] At least one ancient source cited
- [ ] Colors chosen and meaningful
- [ ] Icon selected (emoji)
- [ ] Cross-references added
- [ ] Related entities linked back (bidirectional)
- [ ] Linguistic data included (if non-English name)
- [ ] Validation passes
- [ ] No critical errors

---

## Schema Version History

### v2.0.0 (Current)
- Added `linguistic` object with etymology
- Added `geographical` with coordinates
- Added `temporal` with attestation data
- Added `metaphysicalProperties.sefirot`, `chakras`, `planets`
- Enhanced `sources` with date and type
- Added `archetypes` scoring

### v1.0.0 (Legacy)
- Basic metadata (id, type, name, mythologies)
- Simple description field
- Basic related entities

---

## Support & Resources

- **Schema File**: `data/schemas/entity-schema-v2.json`
- **Validation Tool**: `scripts/entity-validator.js`
- **Examples**: `data/entities/{type}/` (see existing entities)
- **Planning Doc**: `ENTITY_SYSTEM_POLISH_PLAN.md`

For questions or issues, review existing entities of the same type for reference patterns.
