# Firebase Unified Content Schema

**Version:** 1.0
**Date:** 2025-12-20
**Purpose:** Standardized data model for ALL content types across Eyes of Azrael

---

## 🎯 Design Principles

### 1. **Consistency**
- All entity types share common core fields
- Predictable structure across mythologies
- Same field names mean the same thing everywhere

### 2. **Extensibility**
- Type-specific fields in dedicated sections
- Easy to add new entity types
- Backward compatible

### 3. **Searchability**
- All content indexed with search terms
- Relational links between entities
- Tag-based discovery

### 4. **Editability**
- User submission support for all types
- Moderation workflow built-in
- Version history tracking

---

## 📦 Core Entity Structure

### Universal Fields (ALL Content Types)

```javascript
{
  // === CORE IDENTITY ===
  "id": string,                    // Unique identifier (e.g., "zeus", "creation-myth")
  "entityType": string,            // "deity" | "cosmology" | "hero" | "creature" | "ritual" | "text" | "location" | "concept"
  "mythology": string,             // Primary mythology (e.g., "greek", "egyptian")
  "mythologies": array<string>,    // All related mythologies ["greek", "roman"]

  // === DISPLAY ===
  "name": string,                  // Display name
  "icon": string,                  // Emoji or symbol
  "title": string,                 // Full formatted title
  "subtitle": string,              // Tagline/epithet
  "shortDescription": string,      // 1-2 sentences (150-300 chars)
  "longDescription": string,       // Full description (500-2000 chars)

  // === METADATA ===
  "slug": string,                  // URL-friendly slug
  "filePath": string,              // Original HTML file path
  "status": string,                // "published" | "draft" | "archived"
  "visibility": string,            // "public" | "members" | "admin"

  // Extended metadata for filtering/search
  "timeperiod": object {           // Historical/mythological period
    "era": string,                 // "Bronze Age", "Classical", "Medieval", etc.
    "startDate": string,           // Approximate start (e.g., "1200 BCE")
    "endDate": string,             // Approximate end
    "modernRelevance": boolean     // Still practiced/relevant today?
  },
  "geography": object {            // Geographic metadata
    "regions": array<string>,      // ["Greece", "Anatolia"]
    "modernCountries": array<string>, // Modern nations
    "coordinates": object,         // { lat, lng } if applicable
    "climate": string              // Geographic/climate context
  },
  "cultural": object {             // Cultural context
    "cultures": array<string>,     // ["Hellenic", "Roman"]
    "languages": array<string>,    // ["Ancient Greek", "Latin"]
    "practices": array<string>     // ["Temple worship", "Sacrifice"]
  },

  // === SEARCH & DISCOVERY ===
  "searchTerms": array<string>,    // Generated search keywords
  "tags": array<string>,           // Manual tags (e.g., ["creation", "primordial"])
  "categories": array<string>,     // Categories (e.g., ["cosmology", "origin-story"])

  // === RELATIONSHIPS ===
  "relatedDeities": array<object>, // [{ id, name, relationship }]
  "relatedHeroes": array<object>,
  "relatedCreatures": array<object>,
  "relatedPlaces": array<object>,
  "relatedConcepts": array<object>,
  "relatedRituals": array<object>,
  "relatedTexts": array<object>,

  // === CONTENT SECTIONS ===
  "sections": array<object>,       // Structured content sections
  "attributes": object,            // Key-value attributes

  // === MEDIA & VISUAL ASSETS ===
  "media": array<object> [         // Images, videos, SVGs
    {
      "type": string,              // "image" | "video" | "svg" | "diagram" | "audio"
      "url": string,               // Full URL or Firebase Storage path
      "thumbnail": string,         // Thumbnail URL (for images/videos)
      "alt": string,               // Alt text for accessibility
      "caption": string,           // Display caption
      "credit": string,            // Source/attribution
      "license": string,           // Usage license
      "width": number,             // Original width
      "height": number,            // Original height
      "fileSize": number,          // In bytes
      "mimeType": string,          // MIME type
      "order": number,             // Display order
      "featured": boolean,         // Is this the featured image?
      "tags": array<string>        // Tags for organization
    }
  ],
  "featuredImage": string,         // Primary visual (URL or media ID)
  "gallery": array<string>,        // Additional images (URLs or media IDs)
  "diagrams": array<object> [      // SVG diagrams, family trees, etc.
    {
      "type": string,              // "family-tree" | "map" | "timeline" | "hierarchy"
      "svgData": string,           // Inline SVG or URL
      "title": string,
      "description": string
    }
  ]

  // === SOURCES ===
  "sources": array<object>,        // Primary sources
  "references": array<object>,     // Secondary references

  // === USER INTERACTION ===
  "allowUserEdits": boolean,       // Can users suggest edits?
  "allowUserContent": boolean,     // Can users add content?
  "moderationRequired": boolean,   // Require approval?

  // === TIMESTAMPS ===
  "createdAt": timestamp,
  "updatedAt": timestamp,
  "publishedAt": timestamp,
  "lastModifiedBy": string,        // User ID

  // === MIGRATION TRACKING ===
  "migrationBatch": string,        // Migration batch ID
  "extractedFrom": string,         // Original file
  "dataVersion": number            // Schema version
}
```

---

## 🏛️ Entity Type Schemas

### 1. Deity

**Collection:** `entities/{mythology}/deities/{id}`

```javascript
{
  ...coreFields,
  "entityType": "deity",

  // Deity-specific fields
  "attributes": {
    "titles": string,              // Alternative names/epithets
    "domains": string,             // Areas of influence
    "symbols": string,             // Sacred symbols
    "sacredAnimals": string,       // Associated animals
    "sacredPlants": string,        // Associated plants
    "colors": string,              // Associated colors
    "numbers": string,             // Sacred numbers
    "weapons": string,             // Weapons/tools
    "consorts": string             // Spouses/partners
  },

  "myths": array<object> [         // Stories about the deity
    {
      "id": string,
      "title": string,
      "summary": string,
      "fullText": string,
      "sources": array<string>,
      "relatedEntities": array<string>
    }
  ],

  "relationships": {
    "family": {
      "parents": array<string>,
      "siblings": array<string>,
      "consorts": array<string>,
      "children": array<string>
    },
    "connections": array<object> [
      {
        "entityId": string,
        "relationship": string,
        "mythology": string
      }
    ]
  },

  "worship": {
    "sacredSites": string,
    "festivals": array<object>,
    "offerings": string,
    "prayers": string,
    "rituals": array<string>        // IDs of ritual entities
  },

  "powers": array<string>,           // Divine powers
  "epithets": array<string>          // Formal titles
}
```

### 2. Cosmology

**Collection:** `entities/{mythology}/cosmology/{id}`

```javascript
{
  ...coreFields,
  "entityType": "cosmology",

  "cosmologyType": string,           // "creation" | "afterlife" | "realm" | "concept"

  "timeline": array<object> [        // For creation myths
    {
      "stage": string,
      "order": number,
      "title": string,
      "description": string,
      "entities": array<string>,     // Entities involved
      "duration": string
    }
  ],

  "structure": object {              // Cosmological structure
    "realms": array<object> [
      {
        "name": string,
        "description": string,
        "ruler": string,
        "inhabitants": array<string>
      }
    ],
    "layers": array<object>          // For multi-layered cosmologies
  },

  "principles": array<object> [      // Fundamental principles
    {
      "name": string,
      "concept": string,
      "description": string,
      "personification": string      // Deity representing this
    }
  ],

  "process": array<object> [         // For processes (creation, death, etc.)
    {
      "step": number,
      "title": string,
      "description": string,
      "participants": array<string>
    }
  ]
}
```

### 3. Hero

**Collection:** `entities/{mythology}/heroes/{id}`

```javascript
{
  ...coreFields,
  "entityType": "hero",

  "attributes": {
    "titles": string,
    "birthplace": string,
    "parentage": string,
    "weapons": string,
    "symbols": string,
    "companions": string,
    "status": string               // "mortal" | "demigod" | "immortalized"
  },

  "biography": {
    "birth": string,
    "earlyLife": string,
    "deeds": string,
    "death": string,
    "legacy": string
  },

  "deeds": array<object> [
    {
      "id": string,
      "title": string,
      "order": number,              // For numbered labors/quests
      "description": string,
      "location": string,
      "allies": array<string>,
      "enemies": array<string>,
      "reward": string,
      "sources": array<string>
    }
  ],

  "relationships": {
    "divine": array<object>,        // Connections to gods
    "mortal": array<object>,        // Mortal relationships
    "enemies": array<object>
  },

  "powers": array<string>,          // Special abilities
  "weaknesses": array<string>       // Vulnerabilities
}
```

### 4. Creature

**Collection:** `entities/{mythology}/creatures/{id}`

```javascript
{
  ...coreFields,
  "entityType": "creature",

  "creatureType": string,           // "monster" | "beast" | "spirit" | "hybrid"

  "attributes": {
    "appearance": string,
    "size": string,
    "abilities": string,
    "weaknesses": string,
    "habitat": string,
    "behavior": string,
    "origin": string
  },

  "physicalDescription": {
    "heads": number,
    "limbs": number,
    "features": array<string>,
    "composition": string           // What it's made of
  },

  "encounters": array<object> [     // Famous encounters
    {
      "hero": string,
      "event": string,
      "outcome": string,
      "sources": array<string>
    }
  ],

  "offspring": array<string>,       // Child creatures
  "parentage": {
    "father": string,
    "mother": string,
    "siblings": array<string>
  },

  "symbolism": string,              // What it represents
  "role": string                    // Guardian, destroyer, etc.
}
```

### 5. Ritual

**Collection:** `entities/{mythology}/rituals/{id}`

```javascript
{
  ...coreFields,
  "entityType": "ritual",

  "ritualType": string,             // "ceremony" | "festival" | "practice" | "rite"

  "attributes": {
    "frequency": string,            // "daily" | "annual" | "lifecycle"
    "participants": string,
    "location": string,
    "duration": string,
    "season": string,
    "purpose": string
  },

  "procedure": array<object> [      // Step-by-step instructions
    {
      "step": number,
      "title": string,
      "description": string,
      "timing": string,
      "participants": array<string>,
      "materials": array<string>,
      "chants": string
    }
  ],

  "requirements": {
    "materials": array<object> [
      {
        "item": string,
        "quantity": string,
        "significance": string
      }
    ],
    "preparation": string,
    "purity": string,               // Purification requirements
    "officiant": string             // Who can perform
  },

  "significance": {
    "religious": string,
    "social": string,
    "historical": string,
    "mythological": string
  },

  "relatedDeities": array<string>,  // Gods honored
  "relatedMyths": array<string>,    // Mythological basis
  "historicalContext": string
}
```

### 6. Text

**Collection:** `entities/{mythology}/texts/{id}`

```javascript
{
  ...coreFields,
  "entityType": "text",

  "textType": string,               // "scripture" | "epic" | "hymn" | "prayer" | "spell"

  "attributes": {
    "author": string,
    "dateComposed": string,
    "language": string,
    "originalScript": string,
    "length": string,
    "preservation": string
  },

  "content": {
    "summary": string,
    "fullText": string,             // If available
    "excerpts": array<object> [
      {
        "passage": string,
        "translation": string,
        "context": string,
        "line": string
      }
    ]
  },

  "structure": array<object> [      // For long texts
    {
      "section": string,
      "title": string,
      "summary": string,
      "themes": array<string>
    }
  ],

  "translations": array<object> [
    {
      "translator": string,
      "date": string,
      "language": string,
      "notes": string
    }
  ],

  "themes": array<string>,
  "characters": array<string>,      // Entity IDs mentioned
  "influence": string,              // Cultural impact
  "manuscriptHistory": string
}
```

### 7. Location

**Collection:** `entities/{mythology}/locations/{id}`

```javascript
{
  ...coreFields,
  "entityType": "location",

  "locationType": string,           // "sacred-site" | "mythical-realm" | "city" | "landmark"

  "attributes": {
    "realm": string,                // "mortal" | "divine" | "underworld"
    "geography": string,
    "climate": string,
    "ruler": string,
    "inhabitants": string,
    "access": string                // How to get there
  },

  "geography": {
    "coordinates": object,          // If real location
    "modernName": string,
    "description": string,
    "features": array<string>
  },

  "significance": {
    "mythological": string,
    "historical": string,
    "religious": string
  },

  "events": array<object> [         // Events that happened here
    {
      "event": string,
      "participants": array<string>,
      "description": string,
      "sources": array<string>
    }
  ],

  "relatedRituals": array<string>,  // Rituals performed here
  "sacredTo": array<string>         // Deities associated
}
```

---

## 🔗 Relationship Schema

All entities can reference each other using this structure:

```javascript
{
  "id": string,                     // Entity ID
  "entityType": string,             // Type of entity
  "mythology": string,              // Which mythology
  "name": string,                   // Display name
  "relationship": string,           // Nature of relationship
  "bidirectional": boolean          // Is this a two-way link?
}
```

---

## 📄 Section Schema

Content sections provide structured, renderable content:

```javascript
{
  "id": string,
  "title": string,
  "order": number,
  "type": string,                   // "text" | "list" | "timeline" | "grid" | "quote"
  "content": string | array | object,
  "metadata": {
    "source": string,
    "author": string,
    "date": string
  }
}
```

---

## 🔍 Search Terms Generation

Automatically generate from:
- Entity name (split into words)
- Mythology
- All attribute values
- Tag words
- Related entity names
- Alternative names

```javascript
function generateSearchTerms(entity) {
  const terms = new Set();

  // Add name variations
  terms.add(entity.name.toLowerCase());
  entity.name.split(' ').forEach(word => terms.add(word.toLowerCase()));

  // Add mythology
  terms.add(entity.mythology);

  // Add from attributes
  if (entity.attributes) {
    Object.values(entity.attributes).forEach(value => {
      if (typeof value === 'string') {
        value.split(/[,\s]+/).forEach(term => {
          if (term.length > 2) terms.add(term.toLowerCase());
        });
      }
    });
  }

  // Add tags
  entity.tags?.forEach(tag => terms.add(tag.toLowerCase()));

  // Add related entity names
  // ...etc

  return Array.from(terms);
}
```

---

## 📁 Firestore Collection Structure

```
entities/
  {mythology}/              // e.g., "greek", "egyptian"
    deities/
      {id}/                 // e.g., "zeus"
    heroes/
      {id}/                 // e.g., "heracles"
    creatures/
      {id}/                 // e.g., "cerberus"
    cosmology/
      {id}/                 // e.g., "creation-myth"
    rituals/
      {id}/                 // e.g., "mummification"
    texts/
      {id}/                 // e.g., "iliad"
    locations/
      {id}/                 // e.g., "olympus"
    concepts/
      {id}/                 // e.g., "maat"

submissions/                // User submissions
  {submissionId}/

moderationQueue/            // Pending approvals
  {queueId}/

userContributions/          // Track user contributions
  {userId}/
    submissions/
    edits/
    reputation/
```

---

## 🎨 Display Templates

### Grid Attributes Template
```html
<div data-attribute-grid
     data-mythology="greek"
     data-entity="zeus"
     data-entity-type="deity"
     data-allow-edit="true">
</div>
```

### Content Section Template
```html
<div data-content-section
     data-mythology="greek"
     data-entity="zeus"
     data-section-type="myths">
</div>
```

### Relationship Graph Template
```html
<div data-relationship-graph
     data-mythology="greek"
     data-entity="zeus"
     data-relationship-type="family">
</div>
```

---

## ✅ Migration Checklist

For each entity type:
1. ☐ Sample HTML files
2. ☐ Extract data patterns
3. ☐ Map to unified schema
4. ☐ Create type-specific extraction script
5. ☐ Test extraction on 5-10 samples
6. ☐ Upload to Firebase
7. ☐ Create rendering component
8. ☐ Convert HTML to use component
9. ☐ Test in browser
10. ☐ Update MIGRATION_TRACKER.json

---

## 🔄 Version History

- **v1.0 (2025-12-20)**: Initial unified schema
  - Deity schema (tested with 194 entities)
  - Cosmology schema (designed)
  - Hero schema (designed)
  - Creature schema (designed)
  - Ritual schema (designed)
  - Text schema (designed)
  - Location schema (designed)

---

*This schema ensures consistency, searchability, editability, and extensibility across all content types.*
