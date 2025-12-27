# Universal Entity Template - Firebase Standard

## Overview

All entities in the Eyes of Azrael Firebase database MUST use this standardized template. This ensures consistent rendering, search functionality, and user editing capabilities across all entity types.

---

## Core Required Fields

Every entity MUST have these fields:

```json
{
  "id": "string (kebab-case)",
  "type": "string (deity|hero|creature|item|place|concept|magic|theory|mythology)",
  "name": "string (Display name)",
  "title": "string (Same as name, for backwards compatibility)",
  "subtitle": "string (One-line descriptor, e.g., 'God of Thunder')",
  "description": "string (Full markdown description, 200-2000 chars)",
  "content": "string (Extended content, markdown, optional but recommended)",
  "mythology": "string (Primary mythology: greek, norse, hindu, etc.)",
  "mythologies": ["array of strings (all mythologies this appears in)"],
  "category": "string (Same as type, for backwards compatibility)",
  "status": "string (draft|published|approved)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "authorId": "string (Firebase Auth UID, or 'official' for curated content)",
  "contributedBy": "string (Email or UID of contributor)"
}
```

---

## Entity Type-Specific Fields

### Deities

```json
{
  "type": "deity",
  "domains": ["array of strings (love, war, wisdom, etc.)"],
  "symbols": ["array of strings (thunderbolt, owl, etc.)"],
  "element": "string (fire, water, earth, air, aether)",
  "gender": "string (male, female, non-binary, fluid, unknown)",
  "generation": "string (primordial, olympian, titan, etc.)",
  "relationships": {
    "father": "string (deity ID)",
    "mother": "string (deity ID)",
    "spouse": "string or array",
    "children": ["array of deity IDs"],
    "siblings": ["array of deity IDs"]
  },
  "sacredAnimals": ["array of strings"],
  "sacredPlants": ["array of strings"],
  "epithets": ["array of strings (titles/alternative names)"],
  "cultCenters": ["array of place IDs"],
  "archetypes": [
    {
      "category": "string (sky-father, trickster, etc.)",
      "score": "number (0-100)",
      "inferred": "boolean"
    }
  ]
}
```

### Heroes

```json
{
  "type": "hero",
  "birthplace": "string (place ID or name)",
  "parentage": {
    "father": "string (deity or mortal ID)",
    "mother": "string (deity or mortal ID)",
    "divine": "boolean"
  },
  "quests": ["array of strings (major adventures)"],
  "companions": ["array of hero/deity IDs"],
  "weapons": ["array of item IDs"],
  "abilities": ["array of strings (superhuman strength, etc.)"],
  "achievements": ["array of strings"],
  "death": "string (how they died, if applicable)",
  "legacy": "string (their lasting impact)",
  "archetypes": ["array of archetype scores"]
}
```

### Creatures

```json
{
  "type": "creature",
  "creatureType": "string (dragon, monster, spirit, beast)",
  "habitat": "string or array (where they live)",
  "diet": "string (carnivore, herbivore, etc.)",
  "size": "string (tiny, small, medium, large, huge, colossal)",
  "dangerLevel": "number (1-10)",
  "abilities": ["array of strings (flight, fire-breathing, etc.)"],
  "weaknesses": ["array of strings (silver, iron, sunlight, etc.)"],
  "origin": "string (how they came to be)",
  "slainBy": ["array of hero IDs"],
  "offspring": ["array of creature IDs"],
  "physicalDescription": "string (detailed appearance)"
}
```

### Items & Artifacts

```json
{
  "type": "item",
  "itemType": "string (weapon, armor, tool, talisman, text, consumable)",
  "subtype": "string (sword, hammer, ring, etc.)",
  "materials": ["array of strings (gold, iron, divine metal, etc.)"],
  "powers": ["array of strings (specific abilities)"],
  "wielders": ["array of deity/hero IDs"],
  "createdBy": ["array of deity/entity IDs"],
  "currentLocation": "string (place ID or status)",
  "forgedAt": "string (place ID)",
  "destruction": "string (how it was destroyed, if applicable)",
  "cursed": "boolean",
  "legendary": "boolean",
  "crossReferences": {
    "deities": ["array of deity IDs"],
    "heroes": ["array of hero IDs"],
    "places": ["array of place IDs"],
    "creatures": ["array of creature IDs"]
  }
}
```

### Places

```json
{
  "type": "place",
  "placeType": "string (mountain, temple, city, realm, river, underworld)",
  "accessibility": "string (physical, spiritual, astral, metaphysical)",
  "significance": "string (why this place matters)",
  "inhabitants": ["array of deity/creature IDs"],
  "events": ["array of strings (major events that happened here)"],
  "geographicalData": {
    "primaryLocation": {
      "name": "string (modern location)",
      "coordinates": {
        "latitude": "number",
        "longitude": "number",
        "elevation": "number (meters)",
        "accuracy": "string (exact, approximate, legendary)"
      },
      "geopoint": "GeoPoint (Firestore type for map queries)",
      "geohash": "string (for proximity searches)"
    },
    "region": "string (broader geographical area)",
    "modernName": "string (current name if different)"
  },
  "historicalPeriod": "string (when it was most significant)",
  "associatedRituals": ["array of strings"],
  "sacredToDeities": ["array of deity IDs"]
}
```

### Concepts

```json
{
  "type": "concept",
  "conceptType": "string (philosophical, cosmological, ethical, metaphysical)",
  "opposites": ["array of concept IDs"],
  "relatedConcepts": ["array of concept IDs"],
  "personifications": ["array of deity IDs (if concept is personified)"],
  "culturalSignificance": "string",
  "practices": ["array of strings (how this concept is practiced)"],
  "texts": ["array of text IDs mentioning this concept)"]
}
```

### Magic Systems

```json
{
  "type": "magic",
  "category": "string (divination, energy, ritual, alchemy, text)",
  "tradition": "string (Western, Eastern, African, Indigenous, etc.)",
  "techniques": ["array of strings (specific methods)"],
  "tools": ["array of item IDs or strings"],
  "skillLevel": "string (beginner, intermediate, advanced, master)",
  "practitioners": ["array of deity/hero/historical figure IDs"],
  "purposes": ["array of strings (healing, protection, divination, etc.)"],
  "safetyWarnings": ["array of strings"],
  "relatedSystems": ["array of magic IDs"],
  "historicalOrigin": "string",
  "modernPractice": "string (how it's practiced today)"
}
```

### Theories

```json
{
  "type": "theory",
  "theoryType": "string (physics-correlation, philosophical, historical, linguistic)",
  "hypothesis": "string (clear statement of the theory)",
  "evidence": ["array of strings (supporting evidence)"],
  "counterEvidence": ["array of strings (contradicting evidence)"],
  "confidence": "number (0-100, author's confidence in theory)",
  "testablePredictions": ["array of strings (predictions that can be tested)"],
  "relatedTheories": ["array of theory IDs"],
  "relatedEntities": ["array of entity IDs this theory discusses"],
  "intellectualHonestyWarning": "string (required disclaimer)",
  "keyCorrelations": [
    {
      "mythological": "string (aspect from mythology)",
      "scientific": "string (aspect from science/physics)",
      "confidence": "number (0-100)",
      "evidence": "string"
    }
  ],
  "alternativeExplanations": ["array of strings"],
  "cognitiveBiases": ["array of strings (potential biases in reasoning)"]
}
```

### Mythologies (Meta-entities)

```json
{
  "type": "mythology",
  "region": "string (geographical origin)",
  "culturalGroup": "string (people who practice this)",
  "timeperiod": "string (when it flourished)",
  "languages": ["array of strings (languages used)"],
  "majorDeities": ["array of deity IDs"],
  "creationMyth": "string (summary of creation story)",
  "cosmology": "string (structure of universe)",
  "afterlife": "string (beliefs about death)",
  "sacredTexts": ["array of text IDs"],
  "modernFollowers": "number (approximate)",
  "relatedMythologies": ["array of mythology IDs"],
  "iconography": "string (visual style characteristics)"
}
```

---

## Metadata Fields (All Entities)

### Linguistic Data

```json
{
  "linguistic": {
    "originalName": "string (name in original language)",
    "transliteration": "string (romanized version)",
    "pronunciation": "string (IPA phonetic)",
    "etymology": {
      "rootLanguage": "string",
      "meaning": "string",
      "cognates": ["array of related words in other languages"]
    },
    "alternativeNames": ["array of strings (other names in same language)"],
    "translations": {
      "greek": "string",
      "latin": "string",
      "arabic": "string",
      "sanskrit": "string",
      "chinese": "string"
    }
  }
}
```

### Geographical Data

```json
{
  "geographical": {
    "primaryLocation": {
      "name": "string",
      "coordinates": {
        "latitude": "number",
        "longitude": "number",
        "elevation": "number",
        "accuracy": "string (exact|approximate|legendary)"
      },
      "geopoint": "GeoPoint",
      "geohash": "string"
    },
    "region": "string",
    "culturalArea": "string",
    "modernCountry": "string"
  }
}
```

### Temporal Data

```json
{
  "temporal": {
    "firstAttestation": {
      "date": "string (YYYY-MM-DD or YYYY or 'circa YYYY BCE')",
      "source": "string (name of text/artifact)",
      "confidence": "string (confirmed|probable|speculative)"
    },
    "historicalPeriod": "string",
    "era": "string (Bronze Age, Classical Period, etc.)",
    "timeline": [
      {
        "date": "string",
        "event": "string",
        "source": "string"
      }
    ]
  }
}
```

### Cultural Data

```json
{
  "cultural": {
    "festivals": [
      {
        "name": "string",
        "date": "string",
        "description": "string",
        "modernObservance": "boolean"
      }
    ],
    "rituals": ["array of strings"],
    "offerings": ["array of strings (what was offered)"],
    "taboos": ["array of strings (prohibitions)"],
    "modernWorship": "boolean",
    "UNESCO_Status": "string (if applicable)"
  }
}
```

### Visual/Display Data

```json
{
  "visual": {
    "colors": {
      "primary": "#RRGGBB",
      "secondary": "#RRGGBB",
      "accent": "#RRGGBB"
    },
    "icon": "string (emoji or unicode symbol)",
    "heroImageURL": "string (URL to main image)",
    "galleryImages": ["array of image URLs"],
    "svgSymbol": "string (SVG code for symbol/icon)"
  }
}
```

### Cross-References

```json
{
  "relatedEntities": {
    "deities": ["array of deity IDs"],
    "heroes": ["array of hero IDs"],
    "creatures": ["array of creature IDs"],
    "items": ["array of item IDs"],
    "places": ["array of place IDs"],
    "concepts": ["array of concept IDs"],
    "magic": ["array of magic IDs"],
    "theories": ["array of theory IDs"],
    "mythologies": ["array of mythology IDs"]
  }
}
```

### Sources & Attribution

```json
{
  "sources": [
    {
      "type": "string (ancient|modern|academic|archaeological)",
      "title": "string",
      "author": "string",
      "date": "string",
      "url": "string (if available)",
      "citation": "string (full citation)"
    }
  ],
  "scholarly": {
    "academicConsensus": "string (high|medium|low)",
    "controversies": ["array of strings (disputed aspects)"],
    "researchStatus": "string (well-documented|partial|speculative)"
  }
}
```

---

## Computed/Auto-Generated Fields

These fields are automatically generated or computed:

```json
{
  "slug": "string (auto-generated from name)",
  "searchTerms": ["array (auto-generated from name, alternativeNames, tags)"],
  "completeness": "number (0-100, percentage of optional fields filled)",
  "popularity": "number (view count or engagement metric)",
  "lastVerified": "timestamp (when content was last fact-checked)",
  "version": "number (increments with each edit)",
  "editHistory": [
    {
      "timestamp": "timestamp",
      "userId": "string",
      "changes": "object (fields modified)"
    }
  ]
}
```

---

## Firebase Collection Names

Standard collection names:

- `deities` - All gods and goddesses
- `heroes` - Legendary heroes and heroines
- `creatures` - Mythological creatures and monsters
- `items` - Artifacts, weapons, sacred objects
- `places` - Sacred sites, mythological locations
- `concepts` - Philosophical/cosmological concepts
- `magic` - Magic systems, divination, rituals
- `user_theories` - User-submitted theories and analyses
- `mythologies` - Meta-data about mythology systems
- `texts` - Sacred texts and ancient sources

---

## Display Component Requirements

All entities must be renderable by these universal components:

### 1. Entity Card (Grid View)

```html
<div class="entity-card">
  <div class="entity-icon">{visual.icon}</div>
  <h3>{name}</h3>
  <p class="subtitle">{subtitle}</p>
  <span class="mythology-badge">{mythology}</span>
</div>
```

### 2. Entity Detail Page

```html
<div class="entity-detail">
  <header>
    <h1>{name}</h1>
    <p class="subtitle">{subtitle}</p>
    <div class="mythology-tags">{mythologies}</div>
  </header>

  <section class="description">
    {description (markdown rendered)}
  </section>

  <section class="content">
    {content (markdown rendered)}
  </section>

  <aside class="metadata">
    <div class="linguistic-info">{linguistic.*}</div>
    <div class="geographical-info">{geographical.*}</div>
    <div class="temporal-info">{temporal.*}</div>
  </aside>

  <section class="related-entities">
    {relatedEntities.* (cross-reference cards)}
  </section>

  <footer class="sources">
    {sources (formatted citations)}
  </footer>
</div>
```

### 3. Entity Editor (User Submissions)

```html
<form class="entity-editor">
  <input name="name" required />
  <input name="subtitle" required />
  <textarea name="description" required></textarea>
  <textarea name="content"></textarea>
  <select name="mythology" required>{mythologies}</select>
  <select name="type" required>{entity types}</select>

  <!-- Type-specific fields appear dynamically -->
  <div class="type-specific-fields">
    <!-- Conditional rendering based on type -->
  </div>

  <button type="submit">Submit for Review</button>
</form>
```

---

## Validation Rules

Every entity MUST pass these validations:

1. **Required Fields:**
   - `id`, `type`, `name`, `title`, `subtitle`, `description`, `mythology`, `mythologies`

2. **Field Lengths:**
   - `subtitle`: 10-150 characters
   - `description`: 200-2000 characters
   - `content`: 500-10000 characters (recommended)

3. **Cross-References:**
   - All referenced IDs must exist in their respective collections
   - Circular references are allowed (e.g., parent-child relationships)

4. **Mythology Consistency:**
   - `mythology` must be in `mythologies` array
   - `mythologies` must contain at least one valid mythology ID

5. **Status Workflow:**
   - New entities start as `draft`
   - User submissions go to `pending` → `approved` or `rejected`
   - Only admin can set `published` status

---

## Visual Theming Requirements

All entity displays MUST maintain the original website's visual theme:

### Colors
- Primary: Dark blue/purple gradient (#1a1a2e → #16213e)
- Accent: Cyan/teal (#64ffda, #00d4ff)
- Text: White (#ffffff) with alpha variations

### Effects
- Glassmorphism: `backdrop-filter: blur(10px)`
- Borders: `1px solid rgba(255, 255, 255, 0.1)`
- Shadows: `0 8px 32px rgba(0, 0, 0, 0.37)`
- Gradients: 135deg angle for all gradients

### Typography
- Headers: 'Cinzel', serif (for mythology feel)
- Body: 'Segoe UI', sans-serif
- Special characters: 'Segoe UI Historic', 'Noto Sans Egyptian Hieroglyphs'

### Layout
- Grid: `repeat(auto-fit, minmax(280px, 1fr))`
- Spacing: 20px gaps
- Border radius: 10-15px
- Responsive: Mobile-first approach

---

## Implementation Checklist

To implement this template system:

- [ ] Create universal entity display component (`entity-display.js`)
- [ ] Create universal entity editor component (`entity-editor.js`)
- [ ] Migrate all existing Firestore data to this template
- [ ] Update all HTML pages to use dynamic entity loader
- [ ] Implement user edit/create functionality
- [ ] Add validation on client and server (Firestore rules)
- [ ] Create admin approval queue for user submissions
- [ ] Build search index from all entities
- [ ] Add export/import functionality
- [ ] Create API endpoints for entity CRUD operations

---

**Version:** 1.0
**Last Updated:** 2025-12-13
**Status:** 🟢 Active Standard
