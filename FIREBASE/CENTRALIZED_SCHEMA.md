# Centralized Firebase Schema for Eyes of Azrael

**Version:** 1.0
**Date:** 2025-12-13
**Status:** Design Document - Not Yet Implemented

---

## Executive Summary

This document defines a **standardized, centralized schema** for ALL mythology content in Firestore. The key principle is:

> **Every content type (deities, heroes, creatures, cosmology, texts, herbs, rituals, symbols, concepts, myths, events) shares an IDENTICAL base schema, with the `mythology` field REQUIRED on every document.**

This ensures:
- **Consistency**: All content follows the same structure
- **Scalability**: Easy to add new mythologies and content types
- **Queryability**: Standardized fields enable powerful cross-mythology queries
- **Maintainability**: Single source of truth for schema definitions

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Collection Structure](#collection-structure)
3. [Base Schema (Universal)](#base-schema-universal)
4. [Content-Specific Schemas](#content-specific-schemas)
5. [Firestore Collection Architecture](#firestore-collection-architecture)
6. [Index Requirements](#index-requirements)
7. [Security Rules Updates](#security-rules-updates)
8. [Migration Strategy](#migration-strategy)
9. [Benefits & Rationale](#benefits--rationale)

---

## Core Principles

### 1. Mythology-First Design
- **EVERY document MUST have a `mythology` field** (e.g., "greek", "norse", "hindu")
- Mythology is the primary organizational axis
- Content types are secondary categorizations

### 2. Identical Base Schema
- All content types (deities, heroes, creatures, etc.) share the same base fields
- Content-specific fields are additive, not replacements
- Enables polymorphic queries across content types

### 3. Type-Specific Collections
- Each content type gets its own collection (not mixed)
- Collection naming: `deities`, `heroes`, `creatures`, `cosmology`, `texts`, `herbs`, `rituals`, `symbols`, `concepts`, `myths`, `events`
- No mythology-specific collections (e.g., NO `greek_deities`)

### 4. Hierarchical Structure
```
mythology (field) → contentType (field) → collection (physical) → documents
```

Example:
- `deities/greek_zeus` has `mythology: "greek"` and `contentType: "deity"`
- `heroes/greek_achilles` has `mythology: "greek"` and `contentType: "hero"`

---

## Collection Structure

### Physical Collections in Firestore

```
/deities/{deityId}           - All deities across all mythologies
/heroes/{heroId}             - All heroes across all mythologies
/creatures/{creatureId}      - All creatures/beings/spirits
/cosmology/{cosmologyId}     - Realms, places, afterlife concepts
/texts/{textId}              - Sacred texts, scriptures, epics
/herbs/{herbId}              - Sacred plants, herbs, substances
/rituals/{ritualId}          - Ceremonies, practices, magic
/symbols/{symbolId}          - Sacred symbols, sigils, icons
/concepts/{conceptId}        - Abstract concepts, philosophies
/myths/{mythId}              - Specific myth narratives
/events/{eventId}            - Mythological events, battles
/mythologies/{mythologyId}   - Mythology metadata (Greek, Norse, etc.)
/archetypes/{archetypeId}    - Universal patterns across mythologies
```

### Document ID Convention

Format: `{mythology}_{name}` (lowercase, hyphenated)

Examples:
- `greek_zeus`
- `norse_thor`
- `hindu_shiva`
- `greek_achilles`
- `egyptian_book-of-the-dead`

---

## Base Schema (Universal)

**ALL documents in ALL collections MUST include these fields:**

```typescript
interface BaseDocument {
  // ===== IDENTITY =====
  id: string;                    // Document ID (e.g., "greek_zeus")
  name: string;                  // Primary name (e.g., "Zeus")
  displayName: string;           // Display name with emoji (e.g., "⚡ Zeus")

  // ===== CLASSIFICATION (REQUIRED) =====
  mythology: string;             // REQUIRED: "greek", "norse", "hindu", etc.
  contentType: string;           // REQUIRED: "deity", "hero", "creature", etc.

  // ===== CONTENT =====
  description: string;           // Full description (can be empty string)

  // ===== METADATA (REQUIRED) =====
  metadata: {
    createdAt: Timestamp;        // When document was created
    updatedAt: Timestamp;        // Last modification time
    createdBy: string;           // "system", "admin", or user UID
    source: string;              // "html_parser", "user_submission", "admin"
    verified: boolean;           // Content verification status
    sourceFile?: string;         // Original file path (if parsed)
  };

  // ===== SEARCH & DISCOVERY =====
  searchTokens: string[];        // Lowercase search terms for full-text search
  tags: string[];                // User-friendly tags

  // ===== QUALITY & METRICS =====
  qualityScore: number;          // 0-100, calculated based on completeness

  // ===== RELATIONSHIPS =====
  relatedIds: string[];          // IDs of related documents across collections

  // ===== OPTIONAL COMMON FIELDS =====
  alternateNames?: string[];     // Alternative names, epithets
  primarySources?: string[];     // Scripture references, ancient texts
  imageUrls?: string[];          // Image URLs (public or Firebase Storage)
  externalLinks?: Array<{        // External resources
    title: string;
    url: string;
    type: string;                // "wikipedia", "academic", "resource"
  }>;
}
```

### Field Requirements by Origin

| Field | System Content | User Submissions | Admin Content |
|-------|---------------|------------------|---------------|
| `id` | ✅ Required | ✅ Required | ✅ Required |
| `mythology` | ✅ Required | ✅ Required | ✅ Required |
| `contentType` | ✅ Required | ✅ Required | ✅ Required |
| `metadata.verified` | `false` (initial) | `false` | `true` |
| `metadata.createdBy` | `"system"` | User UID | `"admin"` |
| `qualityScore` | Auto-calculated | Auto-calculated | Admin-set |

---

## Content-Specific Schemas

Each content type extends the base schema with type-specific fields.

### 1. Deities Schema

**Collection:** `/deities/{deityId}`

```typescript
interface Deity extends BaseDocument {
  contentType: "deity";

  // Deity-specific fields
  domains: string[];             // ["sky", "thunder", "justice"]
  symbols: string[];             // ["lightning bolt", "eagle", "oak tree"]
  archetypes: string[];          // ["sky-father", "king-of-gods"]
  epithets: string[];            // ["Cloud-Gatherer", "Father of Gods"]

  // Relationships
  relationships: {
    parents?: string[];          // Deity IDs
    siblings?: string[];         // Deity IDs
    consort?: string[];          // Deity IDs
    children?: string[];         // Deity IDs
    allies?: string[];           // Deity IDs
    enemies?: string[];          // Deity IDs
  };

  // Worship
  cultCenters?: string[];        // ["Olympia", "Dodona"]
  festivals?: string[];          // Festival names
  offerings?: string[];          // Preferred offerings

  // Attributes
  attributes?: string[];         // Physical/personality traits
  powers?: string[];             // Special abilities
}
```

**Example Document:**
```json
{
  "id": "greek_zeus",
  "name": "Zeus",
  "displayName": "⚡ Zeus",
  "mythology": "greek",
  "contentType": "deity",
  "description": "King of the Olympian gods, ruler of sky and thunder...",
  "domains": ["sky", "thunder", "justice", "kingship"],
  "symbols": ["lightning bolt", "eagle", "oak tree"],
  "archetypes": ["sky-father", "king-of-gods"],
  "relationships": {
    "parents": ["greek_cronus", "greek_rhea"],
    "consort": ["greek_hera"],
    "children": ["greek_athena", "greek_apollo", "greek_artemis"]
  },
  "searchTokens": ["zeus", "jupiter", "sky father", "thunder god"],
  "tags": ["olympian", "major deity", "indo-european"],
  "qualityScore": 95,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true,
    "sourceFile": "mythos/greek/deities/zeus.html"
  }
}
```

---

### 2. Heroes Schema

**Collection:** `/heroes/{heroId}`

```typescript
interface Hero extends BaseDocument {
  contentType: "hero";

  // Hero-specific fields
  feats: string[];               // Famous accomplishments
  quests: string[];              // Major quests undertaken
  weapons: string[];             // Famous weapons/items
  companions: string[];          // Named companions (IDs or names)
  titles: string[];              // "Strongest Man Alive", etc.

  // Relationships
  relationships: {
    parents?: string[];          // Parent IDs (can be deities or mortals)
    spouse?: string[];           // Spouse IDs
    children?: string[];         // Children IDs
    mentors?: string[];          // Mentor IDs
    allies?: string[];           // Ally IDs
    enemies?: string[];          // Enemy IDs
  };

  // Story
  birthplace?: string;           // City/region of origin
  deathMethod?: string;          // How they died
  legacyImpact?: string;         // Cultural/historical impact
}
```

**Example Document:**
```json
{
  "id": "greek_achilles",
  "name": "Achilles",
  "displayName": "⚔️ Achilles",
  "mythology": "greek",
  "contentType": "hero",
  "description": "Greatest warrior of the Trojan War...",
  "feats": [
    "Slew Hector in single combat",
    "Led the Myrmidons",
    "Nearly invulnerable except heel"
  ],
  "weapons": ["Spear of Peleus", "Shield crafted by Hephaestus"],
  "relationships": {
    "parents": ["peleus", "greek_thetis"],
    "companions": ["patroclus"]
  },
  "searchTokens": ["achilles", "trojan war", "hero", "myrmidon"],
  "tags": ["trojan war", "warrior", "demigod"],
  "qualityScore": 88,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true
  }
}
```

---

### 3. Creatures Schema

**Collection:** `/creatures/{creatureId}`

```typescript
interface Creature extends BaseDocument {
  contentType: "creature";

  // Creature-specific fields
  type: string;                  // "monster", "spirit", "beast", "hybrid"
  appearance: string;            // Physical description
  abilities: string[];           // Special powers/abilities
  weaknesses: string[];          // Known weaknesses
  habitat: string;               // Where it lives

  // Origins
  origin: string;                // Creation story
  parents?: string[];            // Parent creature/deity IDs

  // Interactions
  slainBy?: string[];            // Hero IDs who defeated it
  guards?: string;               // What it protects
  symbolism?: string;            // What it represents
}
```

**Example Document:**
```json
{
  "id": "greek_medusa",
  "name": "Medusa",
  "displayName": "🐍 Medusa",
  "mythology": "greek",
  "contentType": "creature",
  "description": "One of three Gorgon sisters with serpents for hair...",
  "type": "monster",
  "abilities": ["Petrifying gaze turns viewers to stone"],
  "weaknesses": ["Can be killed via decapitation", "Vulnerable while sleeping"],
  "habitat": "Remote island at edge of the world",
  "slainBy": ["greek_perseus"],
  "searchTokens": ["medusa", "gorgon", "snake hair", "perseus"],
  "tags": ["gorgon", "monster", "cursed"],
  "qualityScore": 82,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true
  }
}
```

---

### 4. Cosmology Schema

**Collection:** `/cosmology/{cosmologyId}`

```typescript
interface Cosmology extends BaseDocument {
  contentType: "cosmology";

  // Cosmology-specific fields
  type: string;                  // "realm", "place", "afterlife", "dimension"
  layers?: string[];             // Hierarchical layers (e.g., 9 realms)
  inhabitants: string[];         // Who lives there (deity/creature IDs)
  features: string[];            // Geographic/mystical features
  connections: string[];         // Connections to other realms/places

  // Access
  accessMethod?: string;         // How mortals access it
  ruledBy?: string[];            // Deity IDs who rule it

  // Metaphysics
  temporality?: string;          // Time flow relative to mortal world
  physicalLaws?: string[];       // Unique physical properties
}
```

**Example Document:**
```json
{
  "id": "greek_afterlife",
  "name": "The Greek Afterlife",
  "displayName": "💀 The Greek Afterlife",
  "mythology": "greek",
  "contentType": "cosmology",
  "description": "The realm of the dead ruled by Hades and Persephone...",
  "type": "afterlife",
  "layers": [
    "Elysium (paradise for heroes)",
    "Asphodel Meadows (ordinary souls)",
    "Tartarus (eternal punishment)"
  ],
  "inhabitants": ["greek_hades", "greek_persephone", "greek_charon"],
  "features": ["River Styx", "River Lethe", "Asphodel Meadows"],
  "ruledBy": ["greek_hades", "greek_persephone"],
  "searchTokens": ["hades", "underworld", "afterlife", "elysium"],
  "tags": ["afterlife", "underworld", "realm"],
  "qualityScore": 90,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true
  }
}
```

---

### 5. Texts Schema

**Collection:** `/texts/{textId}`

```typescript
interface Text extends BaseDocument {
  contentType: "text";

  // Text-specific fields
  type: string;                  // "epic", "scripture", "hymn", "prayer", "spell"
  author?: string;               // Author name (if known)
  dateComposed?: string;         // Approximate date/era
  language: string;              // Original language

  // Content
  chapters?: number;             // Number of chapters/books
  verses?: number;               // Total verses (if applicable)
  excerpts?: Array<{             // Key passages
    title: string;
    text: string;
    citation: string;
  }>;

  // Classification
  genre: string[];               // ["mythological", "devotional", etc.]
  themes: string[];              // Major themes

  // Translations
  translations?: Array<{
    translator: string;
    year: string;
    language: string;
    url?: string;
  }>;
}
```

**Example Document:**
```json
{
  "id": "greek_iliad",
  "name": "The Iliad",
  "displayName": "📜 The Iliad",
  "mythology": "greek",
  "contentType": "text",
  "description": "Homer's epic poem about the Trojan War...",
  "type": "epic",
  "author": "Homer",
  "dateComposed": "8th century BCE",
  "language": "Ancient Greek",
  "chapters": 24,
  "genre": ["epic poetry", "war narrative"],
  "themes": ["honor", "rage", "fate", "divine intervention"],
  "searchTokens": ["iliad", "homer", "trojan war", "achilles"],
  "tags": ["epic", "trojan war", "classical"],
  "qualityScore": 95,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true
  }
}
```

---

### 6. Herbs Schema

**Collection:** `/herbs/{herbId}`

```typescript
interface Herb extends BaseDocument {
  contentType: "herb";

  // Herb-specific fields
  scientificName?: string;       // Latin botanical name
  commonNames: string[];         // Various common names

  // Usage
  uses: string[];                // Ritual/medicinal uses
  properties: string[];          // Magical/spiritual properties
  preparation: string[];         // How to prepare
  rituals: string[];             // Associated rituals

  // Associations
  associatedDeities?: string[];  // Deity IDs
  seasonality?: string;          // When to harvest
  habitat?: string;              // Where it grows

  // Traditions
  traditions?: {                 // Multi-tradition herbs
    [mythology: string]: {
      uses: string[];
      symbolism: string;
    };
  };
}
```

**Example Document:**
```json
{
  "id": "greek_laurel",
  "name": "Laurel",
  "displayName": "🌿 Laurel (Bay)",
  "mythology": "greek",
  "contentType": "herb",
  "description": "Sacred to Apollo, used for prophecy and victory crowns...",
  "scientificName": "Laurus nobilis",
  "commonNames": ["Bay Laurel", "Sweet Bay", "Apollo's Laurel"],
  "uses": [
    "Victory crowns",
    "Prophetic rituals",
    "Purification ceremonies"
  ],
  "properties": ["prophetic", "purifying", "victorious"],
  "associatedDeities": ["greek_apollo"],
  "searchTokens": ["laurel", "bay", "apollo", "prophecy"],
  "tags": ["sacred plant", "apollo", "prophecy"],
  "qualityScore": 85,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true
  }
}
```

---

### 7. Rituals Schema

**Collection:** `/rituals/{ritualId}`

```typescript
interface Ritual extends BaseDocument {
  contentType: "ritual";

  // Ritual-specific fields
  type: string;                  // "ceremony", "sacrifice", "mystery", "festival"
  purpose: string;               // What the ritual accomplishes
  participants: string;          // Who can participate
  frequency: string;             // "annual", "monthly", "as needed"

  // Procedure
  steps: Array<{
    order: number;
    action: string;
    description: string;
  }>;

  // Requirements
  location?: string;             // Where performed
  timing?: string;               // When performed (season, time of day)
  materials?: string[];          // Required materials
  deities?: string[];            // Deity IDs honored

  // Context
  historicalPeriod?: string;     // When practiced
  modernPractice?: boolean;      // Still practiced today?
}
```

**Example Document:**
```json
{
  "id": "greek_eleusinian-mysteries",
  "name": "Eleusinian Mysteries",
  "displayName": "🔮 Eleusinian Mysteries",
  "mythology": "greek",
  "contentType": "ritual",
  "description": "Ancient mystery cult honoring Demeter and Persephone...",
  "type": "mystery",
  "purpose": "Initiation into sacred mysteries of death and rebirth",
  "participants": "Initiated Greeks who spoke Greek",
  "frequency": "Annual",
  "deities": ["greek_demeter", "greek_persephone"],
  "location": "Eleusis",
  "timing": "September (Greater Mysteries), February (Lesser Mysteries)",
  "searchTokens": ["eleusinian", "mysteries", "demeter", "persephone"],
  "tags": ["mystery cult", "initiation", "classical"],
  "qualityScore": 87,
  "metadata": {
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "createdBy": "system",
    "source": "html_parser",
    "verified": true
  }
}
```

---

### 8. Symbols Schema

**Collection:** `/symbols/{symbolId}`

```typescript
interface Symbol extends BaseDocument {
  contentType: "symbol";

  // Symbol-specific fields
  type: string;                  // "geometric", "icon", "sigil", "glyph"
  appearance: string;            // Visual description
  meanings: string[];            // Symbolic meanings

  // Usage
  usedBy?: string[];             // Deity/practitioner IDs
  usedIn?: string[];             // Ritual/text IDs
  context: string[];             // Contexts where used

  // Visual
  svgPath?: string;              // SVG path data (if applicable)
  imageUrl?: string;             // Image URL
  colors?: string[];             // Associated colors

  // Interpretation
  esotericMeaning?: string;      // Hidden/mystical meaning
  exotericMeaning?: string;      // Public/surface meaning
}
```

---

### 9. Concepts Schema

**Collection:** `/concepts/{conceptId}`

```typescript
interface Concept extends BaseDocument {
  contentType: "concept";

  // Concept-specific fields
  type: string;                  // "philosophical", "cosmological", "ethical"
  relatedConcepts: string[];     // Related concept IDs
  opposites?: string[];          // Opposing concept IDs

  // Context
  teachers?: string[];           // Who taught/embodied this
  texts?: string[];              // Texts discussing this
  practices?: string[];          // Practices based on this

  // Comparative
  parallels?: {                  // Similar concepts in other mythologies
    [mythology: string]: {
      conceptId: string;
      notes: string;
    };
  };
}
```

---

### 10. Myths Schema

**Collection:** `/myths/{mythId}`

```typescript
interface Myth extends BaseDocument {
  contentType: "myth";

  // Myth-specific fields
  type: string;                  // "origin", "hero-journey", "moral-tale"
  characters: string[];          // Deity/hero/creature IDs
  locations: string[];           // Place/realm IDs

  // Narrative
  summary: string;               // Brief summary
  fullNarrative?: string;        // Complete story
  moralLesson?: string;          // Moral or lesson

  // Sources
  sources: string[];             // Text IDs where found
  variants?: Array<{             // Different versions
    source: string;
    differences: string;
  }>;

  // Themes
  themes: string[];              // "betrayal", "redemption", etc.
  symbolism?: string;            // Symbolic interpretation
}
```

---

### 11. Events Schema

**Collection:** `/events/{eventId}`

```typescript
interface Event extends BaseDocument {
  contentType: "event";

  // Event-specific fields
  type: string;                  // "battle", "creation", "catastrophe", "festival"
  participants: string[];        // Deity/hero/creature IDs
  location?: string;             // Place/realm ID

  // Chronology
  chronologicalOrder?: number;   // Order in mythological timeline
  precedes?: string[];           // Event IDs that came after
  follows?: string[];            // Event IDs that came before

  // Impact
  consequences: string[];        // What resulted from this
  significance: string;          // Why it matters

  // Details
  duration?: string;             // How long it lasted
  casualties?: string[];         // Who died (IDs)
  winners?: string[];            // Who prevailed (IDs)
}
```

---

## Firestore Collection Architecture

### Collection Hierarchy

```
Firestore Database
│
├── /mythologies/{mythologyId}          [Metadata about each mythology]
│   ├── greek
│   ├── norse
│   ├── hindu
│   └── ...
│
├── /deities/{deityId}                  [All deities, all mythologies]
│   ├── greek_zeus
│   ├── norse_odin
│   ├── hindu_shiva
│   └── ...
│
├── /heroes/{heroId}                    [All heroes, all mythologies]
│   ├── greek_achilles
│   ├── norse_sigurd
│   └── ...
│
├── /creatures/{creatureId}             [All creatures, all mythologies]
│   ├── greek_medusa
│   ├── norse_fenrir
│   └── ...
│
├── /cosmology/{cosmologyId}            [All realms/places, all mythologies]
│   ├── greek_afterlife
│   ├── norse_nine-realms
│   └── ...
│
├── /texts/{textId}                     [All texts, all mythologies]
│   ├── greek_iliad
│   ├── hindu_bhagavad-gita
│   └── ...
│
├── /herbs/{herbId}                     [All herbs, all mythologies]
│   ├── greek_laurel
│   ├── norse_mistletoe
│   └── ...
│
├── /rituals/{ritualId}                 [All rituals, all mythologies]
│   ├── greek_eleusinian-mysteries
│   ├── hindu_agnihotra
│   └── ...
│
├── /symbols/{symbolId}                 [All symbols, all mythologies]
│   ├── greek_caduceus
│   ├── norse_valknut
│   └── ...
│
├── /concepts/{conceptId}               [All concepts, all mythologies]
│   ├── greek_hubris
│   ├── hindu_dharma
│   └── ...
│
├── /myths/{mythId}                     [All myth narratives, all mythologies]
│   ├── greek_pandoras-box
│   ├── norse_ragnarok
│   └── ...
│
├── /events/{eventId}                   [All events, all mythologies]
│   ├── greek_titanomachy
│   ├── norse_aesir-vanir-war
│   └── ...
│
├── /archetypes/{archetypeId}           [Universal cross-mythology archetypes]
│   ├── sky-father
│   ├── trickster
│   └── ...
│
├── /users/{userId}                     [User profiles]
├── /theories/{theoryId}                [User theories]
├── /user_submissions/{submissionId}    [Pending user contributions]
├── /votes/{voteId}                     [Voting data]
├── /bookmarks/{bookmarkId}             [User bookmarks]
└── /search_index/{searchId}            [Search optimization]
```

### Query Examples

```javascript
// Get all Greek deities
db.collection('deities')
  .where('mythology', '==', 'greek')
  .orderBy('name')
  .get();

// Get all sky-father archetypes across mythologies
db.collection('deities')
  .where('archetypes', 'array-contains', 'sky-father')
  .get();

// Get all content related to Zeus (cross-collection)
const zeusId = 'greek_zeus';
Promise.all([
  db.collection('myths').where('characters', 'array-contains', zeusId).get(),
  db.collection('rituals').where('deities', 'array-contains', zeusId).get(),
  db.collection('texts').where('relatedIds', 'array-contains', zeusId).get()
]);

// Get all verified content for a mythology
db.collection('deities')
  .where('mythology', '==', 'hindu')
  .where('metadata.verified', '==', true)
  .get();

// Get high-quality content (quality score > 80)
db.collection('deities')
  .where('qualityScore', '>', 80)
  .orderBy('qualityScore', 'desc')
  .limit(10)
  .get();
```

---

## Index Requirements

### Composite Indexes (Required)

```json
{
  "indexes": [
    {
      "collectionGroup": "deities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "deities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "qualityScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "deities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "archetypes", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "deities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "metadata.verified", "order": "ASCENDING" },
        { "fieldPath": "qualityScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "heroes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "creatures",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "cosmology",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "texts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "herbs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "rituals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "symbols",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "concepts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "myths",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "chronologicalOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "search_index",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "searchTokens", "arrayConfig": "CONTAINS" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Array Indexes

For `array-contains` queries:
- `archetypes` (deities)
- `domains` (deities)
- `symbols` (deities)
- `searchTokens` (all collections)
- `tags` (all collections)
- `characters` (myths)
- `participants` (events)

---

## Security Rules Updates

### Proposed Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== HELPER FUNCTIONS =====

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated()
        && request.auth.token.email == 'andrewkwatts@gmail.com';
    }

    function hasValidBaseSchema() {
      let data = request.resource.data;
      return data.keys().hasAll(['id', 'name', 'mythology', 'contentType', 'metadata'])
             && data.mythology is string
             && data.contentType is string
             && data.metadata is map
             && data.metadata.keys().hasAll(['createdAt', 'updatedAt', 'createdBy', 'source', 'verified']);
    }

    // ===== CONTENT COLLECTIONS (STANDARDIZED) =====
    // All content collections follow same pattern

    match /deities/{deityId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /heroes/{heroId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /creatures/{creatureId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /cosmology/{cosmologyId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /texts/{textId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /herbs/{herbId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /rituals/{ritualId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /symbols/{symbolId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /concepts/{conceptId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /myths/{mythId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /events/{eventId} {
      allow read: if true;
      allow create, update, delete: if isAdmin() && hasValidBaseSchema();
    }

    match /mythologies/{mythologyId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /archetypes/{archetypeId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    // ===== USER SUBMISSIONS =====
    // Users can submit content for review

    match /user_submissions/{submissionId} {
      allow read: if true;
      allow create: if isAuthenticated()
                    && request.resource.data.submittedBy == request.auth.uid
                    && hasValidBaseSchema();
      allow update: if isAuthenticated()
                    && (resource.data.submittedBy == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // ===== EXISTING COLLECTIONS (UNCHANGED) =====

    match /users/{userId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    match /theories/{theoryId} {
      allow read: if resource.data.status == 'published'
                  || (isAuthenticated() && resource.data.authorId == request.auth.uid);
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated()
                             && (resource.data.authorId == request.auth.uid || isAdmin());
    }

    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Schema Validation (Week 1)

**Goal:** Validate current data against new schema

1. **Audit Current Data**
   - Scan all `parsed_data/*.json` files
   - Identify schema violations
   - Document missing required fields
   - Calculate data quality scores

2. **Create Migration Scripts**
   ```bash
   scripts/
   ├── validate-schema.js        # Validate data against new schema
   ├── calculate-quality.js      # Calculate quality scores
   ├── generate-search-tokens.js # Generate search tokens
   └── transform-to-schema.js    # Transform to new schema
   ```

3. **Test Transformations**
   - Run on sample data
   - Verify field mappings
   - Check data integrity

**Deliverables:**
- Schema validation report
- List of required data transformations
- Updated migration scripts

---

### Phase 2: Data Transformation (Week 2)

**Goal:** Transform all existing data to new schema

1. **Transform Parsed Data**
   ```javascript
   // For each content type
   const transform = (oldDoc) => {
     return {
       // Base schema
       id: oldDoc.id,
       name: oldDoc.name,
       displayName: oldDoc.displayName,
       mythology: oldDoc.mythology,
       contentType: detectContentType(oldDoc),
       description: oldDoc.description || '',

       // Metadata
       metadata: {
         createdAt: oldDoc.metadata?.createdAt || new Date(),
         updatedAt: new Date(),
         createdBy: 'system',
         source: oldDoc.metadata?.source || 'migration',
         verified: oldDoc.metadata?.verified || false,
         sourceFile: oldDoc.metadata?.sourceFile
       },

       // Search & discovery
       searchTokens: generateSearchTokens(oldDoc),
       tags: oldDoc.tags || [],
       qualityScore: calculateQualityScore(oldDoc),
       relatedIds: extractRelatedIds(oldDoc),

       // Content-specific fields (preserve existing)
       ...extractContentSpecificFields(oldDoc)
     };
   };
   ```

2. **Generate Missing Fields**
   - Auto-generate `searchTokens` from name, description, tags
   - Calculate `qualityScore` based on field completeness
   - Extract `relatedIds` from relationship fields

3. **Validate Transformed Data**
   - Run validation script
   - Check for missing required fields
   - Verify data types

**Deliverables:**
- Transformed JSON files (in `/transformed_data/`)
- Transformation report
- Data quality report

---

### Phase 3: Firestore Migration (Week 3)

**Goal:** Upload transformed data to Firestore

1. **Backup Current Data**
   ```bash
   # Export existing Firestore data
   firebase firestore:export gs://eyesofazrael.appspot.com/backups/pre-migration
   ```

2. **Upload in Batches**
   ```javascript
   // Upload script
   const collections = [
     'deities', 'heroes', 'creatures', 'cosmology',
     'texts', 'herbs', 'rituals', 'symbols',
     'concepts', 'myths', 'events'
   ];

   for (const collection of collections) {
     const data = loadTransformedData(collection);
     await uploadBatch(db, collection, data);
   }
   ```

3. **Verify Uploads**
   - Count documents per collection
   - Spot-check random documents
   - Test query performance

4. **Create Indexes**
   - Deploy composite indexes
   - Wait for index creation
   - Test indexed queries

**Deliverables:**
- Upload completion report
- Document counts by collection
- Index creation status
- Query performance benchmarks

---

### Phase 4: Security Rules Deployment (Week 4)

**Goal:** Deploy updated security rules

1. **Test Rules in Emulator**
   ```bash
   firebase emulators:start --only firestore
   # Run test suite against rules
   ```

2. **Deploy to Staging**
   ```bash
   firebase use staging
   firebase deploy --only firestore:rules
   ```

3. **Verify Security**
   - Test public read access
   - Test admin write access
   - Test user submission flow
   - Test unauthorized write rejection

4. **Deploy to Production**
   ```bash
   firebase use production
   firebase deploy --only firestore:rules
   ```

**Deliverables:**
- Security rules test report
- Deployment confirmation
- Security verification report

---

### Phase 5: Frontend Updates (Week 5-6)

**Goal:** Update frontend to use new schema

1. **Update Data Access Layer**
   ```javascript
   // Old
   const deities = await db.collection('greek_deities').get();

   // New
   const deities = await db.collection('deities')
     .where('mythology', '==', 'greek')
     .get();
   ```

2. **Update Components**
   - Update deity card components
   - Update hero profile components
   - Update search components
   - Update filter components

3. **Add Quality Indicators**
   - Display quality scores
   - Show verification badges
   - Indicate source type

4. **Test Thoroughly**
   - Test all mythology pages
   - Test cross-mythology queries
   - Test search functionality
   - Test filtering

**Deliverables:**
- Updated frontend code
- Component test reports
- User acceptance testing results

---

### Phase 6: Monitoring & Optimization (Ongoing)

**Goal:** Monitor performance and optimize

1. **Monitor Queries**
   - Track slow queries
   - Identify missing indexes
   - Optimize query patterns

2. **Update Quality Scores**
   - Recalculate based on user engagement
   - Flag low-quality content for review
   - Prioritize content improvements

3. **Gather Feedback**
   - Monitor user submissions
   - Track search patterns
   - Collect user feedback

**Deliverables:**
- Weekly performance reports
- Optimization recommendations
- Content quality improvement plan

---

## Benefits & Rationale

### 1. Consistency Across Content Types

**Problem:** Current system has inconsistent field names and structures across different content types.

**Solution:** All content types share the same base schema, ensuring consistency.

**Benefits:**
- Easier to maintain
- Simpler to query
- Better user experience
- Reduced code duplication

---

### 2. Mythology-First Organization

**Problem:** Current system mixes content by mythology (e.g., `greek_deities` collection).

**Solution:** Single collection per content type, with `mythology` as a required field.

**Benefits:**
- Cross-mythology queries are simple
- Comparative mythology analysis is easy
- Archetype identification across mythologies
- Scalable to infinite mythologies

**Query Examples:**
```javascript
// All sky-father deities across mythologies
db.collection('deities')
  .where('archetypes', 'array-contains', 'sky-father')
  .get();

// All Greek content across collections
const greekContent = await Promise.all([
  db.collection('deities').where('mythology', '==', 'greek').get(),
  db.collection('heroes').where('mythology', '==', 'greek').get(),
  db.collection('creatures').where('mythology', '==', 'greek').get()
]);
```

---

### 3. Quality Scoring System

**Problem:** No way to measure content completeness or quality.

**Solution:** `qualityScore` field (0-100) calculated based on:
- Field completeness (40%)
- Description length (20%)
- Number of relationships (15%)
- Primary sources present (15%)
- Verification status (10%)

**Benefits:**
- Surface best content first
- Identify content gaps
- Prioritize improvement efforts
- Enable quality-based filtering

---

### 4. Powerful Search & Discovery

**Problem:** Limited search capabilities with current structure.

**Solution:** `searchTokens` array with preprocessed search terms.

**Benefits:**
- Fast full-text search
- Nickname/epithet search (e.g., "cloud-gatherer" finds Zeus)
- Multi-language search support
- Fuzzy matching possible

---

### 5. Relationship Tracking

**Problem:** Relationships are scattered and inconsistent.

**Solution:** Standardized relationship fields + `relatedIds` array.

**Benefits:**
- Build family trees automatically
- Generate relationship graphs
- Cross-reference content
- Discover connections

---

### 6. Metadata Transparency

**Problem:** No way to know content source or verification status.

**Solution:** Comprehensive `metadata` object on every document.

**Benefits:**
- Trust indicators for users
- Audit trails for admins
- Source attribution
- Migration tracking

---

### 7. Future-Proof Extensibility

**Problem:** Hard to add new mythologies or content types.

**Solution:** Schema is extensible - new content types just extend base schema.

**Benefits:**
- Add new mythologies without code changes
- New content types require minimal changes
- Schema evolution is managed
- Backwards compatibility maintained

---

## Appendix A: Quality Score Calculation

```javascript
function calculateQualityScore(doc) {
  let score = 0;

  // Field completeness (40 points)
  const requiredFields = ['name', 'mythology', 'contentType', 'description'];
  const presentFields = requiredFields.filter(f => doc[f]).length;
  score += (presentFields / requiredFields.length) * 40;

  // Description length (20 points)
  const descLength = (doc.description || '').length;
  if (descLength > 500) score += 20;
  else if (descLength > 200) score += 15;
  else if (descLength > 100) score += 10;
  else if (descLength > 0) score += 5;

  // Relationships (15 points)
  const relationshipCount = Object.keys(doc.relationships || {}).length;
  score += Math.min(relationshipCount * 3, 15);

  // Primary sources (15 points)
  const sourceCount = (doc.primarySources || []).length;
  score += Math.min(sourceCount * 5, 15);

  // Verification status (10 points)
  if (doc.metadata?.verified) score += 10;

  return Math.round(score);
}
```

---

## Appendix B: Search Token Generation

```javascript
function generateSearchTokens(doc) {
  const tokens = new Set();

  // Name variations
  if (doc.name) {
    tokens.add(doc.name.toLowerCase());
  }

  // Alternate names
  (doc.alternateNames || []).forEach(name => {
    tokens.add(name.toLowerCase());
  });

  // Epithets (for deities)
  (doc.epithets || []).forEach(epithet => {
    tokens.add(epithet.toLowerCase());
  });

  // Domains/attributes
  (doc.domains || []).forEach(domain => {
    tokens.add(domain.toLowerCase());
  });

  // Tags
  (doc.tags || []).forEach(tag => {
    tokens.add(tag.toLowerCase());
  });

  // Mythology
  if (doc.mythology) {
    tokens.add(doc.mythology.toLowerCase());
  }

  // Content type
  if (doc.contentType) {
    tokens.add(doc.contentType.toLowerCase());
  }

  // Description keywords (extract meaningful words)
  if (doc.description) {
    const words = doc.description.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3 && !STOP_WORDS.includes(w));
    words.forEach(w => tokens.add(w));
  }

  return Array.from(tokens);
}
```

---

## Appendix C: Migration Checklist

- [ ] **Phase 1: Validation**
  - [ ] Audit current data files
  - [ ] Create validation scripts
  - [ ] Document schema violations
  - [ ] Generate transformation plan

- [ ] **Phase 2: Transformation**
  - [ ] Transform all content types
  - [ ] Generate search tokens
  - [ ] Calculate quality scores
  - [ ] Validate transformed data

- [ ] **Phase 3: Upload**
  - [ ] Backup current Firestore data
  - [ ] Upload deities collection
  - [ ] Upload heroes collection
  - [ ] Upload creatures collection
  - [ ] Upload cosmology collection
  - [ ] Upload texts collection
  - [ ] Upload herbs collection
  - [ ] Upload rituals collection
  - [ ] Upload symbols collection
  - [ ] Upload concepts collection
  - [ ] Upload myths collection
  - [ ] Upload events collection
  - [ ] Verify upload counts

- [ ] **Phase 4: Indexes**
  - [ ] Create composite indexes
  - [ ] Wait for index builds
  - [ ] Test indexed queries
  - [ ] Benchmark performance

- [ ] **Phase 5: Security**
  - [ ] Update security rules
  - [ ] Test in emulator
  - [ ] Deploy to staging
  - [ ] Verify security
  - [ ] Deploy to production

- [ ] **Phase 6: Frontend**
  - [ ] Update data access layer
  - [ ] Update components
  - [ ] Add quality indicators
  - [ ] Test all pages
  - [ ] Deploy frontend

- [ ] **Phase 7: Monitoring**
  - [ ] Set up performance monitoring
  - [ ] Track query patterns
  - [ ] Gather user feedback
  - [ ] Optimize as needed

---

## Conclusion

This centralized schema provides a solid foundation for organizing all mythology content in a consistent, scalable, and maintainable way. By requiring a `mythology` field on every document and maintaining identical base schemas across all content types, we enable powerful cross-mythology queries while preserving content-specific details.

The migration strategy outlined above provides a clear path from the current data structure to this new schema, with validation, transformation, and testing at each step.

**Next Steps:**
1. Review and approve this schema design
2. Begin Phase 1: Schema Validation
3. Create transformation scripts
4. Test on sample data
5. Execute full migration

**Contact:**
For questions or clarifications about this schema, contact the development team.

---

**Document Status:** Design Complete - Awaiting Approval
**Last Updated:** 2025-12-13
